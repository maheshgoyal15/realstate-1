import io
import logging
import uuid
from typing import List, Dict, Any

import psycopg2

from app.core.celery_app import celery_app
from app.core.config import settings

from reportlab.lib import colors
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

logger = logging.getLogger(__name__)


def _render_report_pdf(address: str, budget: float, recommendations: List[Dict[str, Any]]) -> bytes:
    """Render a simple pre-listing report PDF. Layout/branding polish is a
    follow-up - this produces a real, correct document, not a placeholder."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=LETTER, topMargin=0.75 * inch, bottomMargin=0.75 * inch)
    styles = getSampleStyleSheet()
    story = [
        Paragraph("HomeReady AI &mdash; Pre-Listing Upgrade Report", styles["Title"]),
        Spacer(1, 0.15 * inch),
        Paragraph(address, styles["Heading2"]),
        Paragraph(f"Budget ceiling: ${budget:,.0f}", styles["Normal"]),
        Spacer(1, 0.3 * inch),
    ]

    if recommendations:
        table_data = [["Category", "Est. Cost", "Value Increase", "ROI", "Timeline"]]
        for rec in recommendations:
            table_data.append([
                rec["category"],
                f"${rec['estimated_cost']:,.0f}",
                f"${rec['projected_value_increase']:,.0f}",
                f"{rec['roi_percentage']:.1f}%",
                rec["timeline"],
            ])
        table = Table(table_data, hAlign="LEFT")
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ]))
        story.append(table)

        story.append(Spacer(1, 0.3 * inch))
        for rec in recommendations:
            story.append(Paragraph(rec["category"], styles["Heading3"]))
            story.append(Paragraph(rec["explanation"], styles["Normal"]))
            story.append(Paragraph(rec["why_details"], styles["Normal"]))
            story.append(Spacer(1, 0.15 * inch))
    else:
        story.append(Paragraph("No recommendations were generated for this analysis.", styles["Normal"]))

    doc.build(story)
    return buffer.getvalue()


@celery_app.task(name="app.services.report_service.generate_prelisting_report")
def generate_prelisting_report(
    analysis_id: str, address: str, budget: float, cv_summary: Dict[str, Any], recommendations: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Renders a real PDF report and persists it (as bytes, in Postgres - see
    migration 005) with a real shareable token, returning a real backend
    download URL instead of a fabricated CloudFront link.
    """
    logger.info(f"Generating pre-listing PDF report for analysis_id: {analysis_id}")

    pdf_bytes = _render_report_pdf(address, budget, recommendations)
    shareable_token = uuid.uuid4().hex
    # Logical placeholder key - bytes currently live in reports.pdf_data; a
    # real S3 migration would upload here and populate this with the actual
    # bucket key instead.
    s3_pdf_key = f"db:{shareable_token}.pdf"

    conn = psycopg2.connect(settings.DATABASE_URL)
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO reports (analysis_id, s3_pdf_key, shareable_token, pdf_data) "
                    "VALUES (%s, %s, %s, %s);",
                    (analysis_id, s3_pdf_key, shareable_token, psycopg2.Binary(pdf_bytes)),
                )
    finally:
        conn.close()

    logger.info(f"Persisted PDF report for analysis_id: {analysis_id} (token prefix: {shareable_token[:8]}...)")

    return {
        "analysis_id": analysis_id,
        "s3_pdf_key": s3_pdf_key,
        "shareable_token": shareable_token,
        "report_url": f"/api/v1/reports/{shareable_token}/download",
    }
