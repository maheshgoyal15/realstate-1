import logging
import uuid
from typing import List, Dict, Any

import psycopg2
import psycopg2.extras

from app.core.celery_app import celery_app
from app.core.config import settings
from app.core.db import get_db
from app.services.image_generator import generate_recommendation_visuals

logger = logging.getLogger(__name__)


@celery_app.task(name="app.services.recommendation_service.generate_recommendations")
def generate_recommendations(analysis_id: str, cv_summary: Dict[str, Any], budget_ceiling: float, style_preference: str, base64_images: List[str] = None) -> List[Dict[str, Any]]:
    """
    Selects candidate upgrades from the upgrade_catalog reference table,
    filters/ranks them against this analysis's detected defects and budget,
    and persists the selected ones as real recommendations rows tied to
    analysis_id.
    """
    logger.info(f"Starting recommendation ranking for analysis_id: {analysis_id}. Budget: ${budget_ceiling}")

    detected_defects = cv_summary.get("detected_defects", [])
    budget = budget_ceiling or 100000.0

    conn = get_db()
    try:
        with conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(
                    "SELECT id, category, trigger_defect, estimated_cost, projected_value_increase, "
                    "timeline, explanation_template, why_details_template, scope FROM upgrade_catalog;"
                )
                catalog = cur.fetchall()

                selected = []
                # First match exact detected defects within budget
                for upg in catalog:
                    if upg["trigger_defect"] in detected_defects and float(upg["estimated_cost"]) <= budget:
                        selected.append(upg)

                # If we have less than 3, intelligently add highest-ROI interior upgrades within budget
                if len(selected) < 3:
                    for upg in sorted(catalog, key=lambda x: (float(x["projected_value_increase"]) - float(x["estimated_cost"])) / float(x["estimated_cost"]), reverse=True):
                        if upg not in selected and float(upg["estimated_cost"]) <= budget:
                            if any(w in upg["category"].lower() for w in ["kitchen", "countertop", "floor", "bath", "fixture"]):
                                selected.append(upg)
                        if len(selected) >= 3:
                            break

                recommendations = []
                for upg in selected:
                    cost = float(upg["estimated_cost"])
                    value_increase = float(upg["projected_value_increase"])
                    roi = round(((value_increase - cost) / cost) * 100, 1)
                    explanation = upg["explanation_template"].format(style=style_preference)
                    why_details = upg["why_details_template"].format(style=style_preference)

                    rec_id = str(uuid.uuid4())
                    
                    # Generate real image files (.png) on disk for this recommendation
                    before_url, after_url = generate_recommendation_visuals(
                        upg["category"], style_preference, cost, roi, rec_id, base64_images
                    )

                    cur.execute(
                        "INSERT INTO recommendations "
                        "(id, analysis_id, category, estimated_cost, projected_value_increase, roi_percentage, "
                        "timeline, explanation, why_details, scope, upgrade_catalog_id, before_image_url, after_image_url) "
                        "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id;",
                        (
                            rec_id, analysis_id, upg["category"], cost, value_increase, roi,
                            upg["timeline"], explanation, why_details,
                            psycopg2.extras.Json(upg["scope"]), upg["id"], before_url, after_url,
                        )
                    )
                    row_res = cur.fetchone()
                    if row_res and (isinstance(row_res, dict) and "id" in row_res):
                        rec_id = str(row_res["id"])
                    elif row_res and isinstance(row_res, (tuple, list)):
                        rec_id = str(row_res[0])

                    recommendations.append({
                        "upgrade_id": str(rec_id),
                        "category": upg["category"],
                        "estimated_cost": cost,
                        "projected_value_increase": value_increase,
                        "roi_percentage": roi,
                        "timeline": upg["timeline"],
                        "explanation": explanation,
                        "why_details": why_details,
                        "scope": upg["scope"],
                        "before_image_url": before_url,
                        "after_image_url": after_url,
                    })
    finally:
        conn.close()

    recommendations.sort(key=lambda x: x["roi_percentage"], reverse=True)
    logger.info(f"Generated {len(recommendations)} ranked recommendations for analysis_id: {analysis_id}")

    return recommendations
