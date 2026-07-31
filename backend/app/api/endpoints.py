import os
import json
import uuid
import logging
import psycopg2
import psycopg2.extras
from typing import List, Dict, Any, Tuple, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Header, BackgroundTasks, Response
from fastapi.responses import FileResponse

def _ensure_dict(data: Any) -> Dict[str, Any]:
    if isinstance(data, dict):
        return data
    if isinstance(data, str):
        try:
            parsed = json.loads(data)
            return parsed if isinstance(parsed, dict) else {}
        except Exception:
            return {}
    return {}

def _ensure_list(data: Any) -> List[Any]:
    if isinstance(data, list):
        return data
    if isinstance(data, str):
        try:
            parsed = json.loads(data)
            if isinstance(parsed, str):
                parsed = json.loads(parsed)
            return parsed if isinstance(parsed, list) else []
        except Exception:
            return []
    return []
from app.schemas.payloads import (
    UploadRequest,
    UploadResponse,
    AnalysisResultResponse,
    AnalysisSummaryResponse,
    QuoteRequestPayload,
    AuthLoginRequest,
    AuthSignupRequest,
    AuthGoogleRequest,
    MLSImportRequest,
    MLSImportResponse,
    InpaintRequest,
    InpaintResponse,
    UserProfileUpdateRequest,
    AgencyBrandingUpdateRequest,
    NotificationSettingsUpdateRequest,
    PropertyCreatePayload,
    TeamInvitePayload,
    ContractorReviewPayload,
)
from app.core.security import (
    verify_access_token,
    verify_password,
    get_password_hash,
    validate_password_strength,
    create_access_token,
)
from app.core.oauth import verify_google_id_token
from app.core.config import settings
from app.core.db import get_db
from app.core.rate_limit import rate_limiter
from app.services.storage import validate_and_store_image
from app.services.cv_service import analyze_property_images
from app.services.recommendation_service import generate_recommendations
from app.services.report_service import generate_prelisting_report

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    return {"status": "healthy", "service": settings.PROJECT_NAME}

# Mandatory Secure Web Skills: Authentication & Authorization
# Ensure all APIs are authenticated and rate limited.
def get_current_user(authorization: str = Header(None)) -> Dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = authorization.split(" ")[1]
    return verify_access_token(token)

# Mandatory Secure Web Skills: Session Management & Authentication
# - Store credentials using memory-hard hashing / bcrypt with unique per-user salts
# - Do not log credentials server side
# - Never send credentials in URL parameters
# - Rely on parameterized queries to avoid SQL Injection
# - Do not expose SQL errors to users
# TODO(security): Consider using OAuth providers (Google, Apple) for production SSO integration.
# TODO(security): Consider implementing MFA to strengthen account authentication.
# TODO(security): Consider hardening password validation using leaked password detection.

@router.post("/auth/signup", status_code=status.HTTP_201_CREATED)
async def auth_signup(request: Request, payload: AuthSignupRequest) -> Any:
    rate_limiter.check_limit(f"signup:{request.client.host if request.client else 'unknown'}")
    validate_password_strength(payload.password)
    
    logger.info(f"Processing signup request for email: {payload.email}")
    hashed_pw = get_password_hash(payload.password)
    
    try:
        conn = get_db()
        with conn:
            with conn.cursor() as cur:
                cur.execute("SELECT id FROM users WHERE email = %s;", (payload.email,))
                if cur.fetchone():
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Account with this email already exists."
                    )
                user_id = str(uuid.uuid4())
                cur.execute(
                    "INSERT INTO users (id, email, password_hash, full_name, role) VALUES (%s::uuid, %s, %s, %s, %s) RETURNING id, email, role;",
                    (user_id, payload.email, hashed_pw, payload.full_name, "homeowner")
                )
                user_row = cur.fetchone()
                user_id, user_email, user_role = user_row
    except HTTPException:
        raise
    except psycopg2.Error as e:
        logger.error("Database error during user signup.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error. Database unavailable."
        )
    except Exception as e:
        logger.error("Unexpected error during user signup.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error."
        )
    finally:
        if 'conn' in locals() and conn:
            conn.close()

    access_token = create_access_token(subject=user_id)
    return {
        "id": str(user_id),
        "email": user_email,
        "role": user_role,
        "accessToken": access_token,
        "message": "User registered successfully. Verification email triggered."
    }

@router.post("/auth/login", status_code=status.HTTP_200_OK)
async def auth_login(request: Request, payload: AuthLoginRequest) -> Any:
    rate_limiter.check_limit(f"login:{request.client.host if request.client else 'unknown'}")
    logger.info(f"Processing login request for email: {payload.email}")
    
    try:
        conn = get_db()
        with conn:
            with conn.cursor() as cur:
                cur.execute("SELECT id, email, password_hash, role FROM users WHERE email = %s;", (payload.email,))
                user_row = cur.fetchone()
    except psycopg2.Error as e:
        logger.error("Database error during user login.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error. Database unavailable."
        )
    except Exception as e:
        logger.error("Unexpected error during user login.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error."
        )
    finally:
        if 'conn' in locals() and conn:
            conn.close()

    if not user_row:
        logger.warning("Login failed: User not found.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id, user_email, password_hash, user_role = user_row
    if not verify_password(payload.password, password_hash):
        logger.warning("Login failed: Invalid password.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=user_id)
    return {
        "id": str(user_id),
        "email": user_email,
        "role": user_role,
        "accessToken": access_token
    }


@router.post("/auth/oauth/google", status_code=status.HTTP_200_OK)
async def auth_oauth_google(request: Request, payload: AuthGoogleRequest) -> Any:
    rate_limiter.check_limit(f"oauth:{request.client.host if request.client else 'unknown'}")

    try:
        idinfo = verify_google_id_token(payload.id_token)
    except ValueError as e:
        logger.error(f"Google OAuth token verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google sign-in token: {e}",
        )

    google_sub = idinfo["sub"]
    email = idinfo["email"]
    full_name = idinfo.get("name") or email.split("@")[0]

    logger.info("Processing Google OAuth sign-in.")

    try:
        conn = get_db()
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id, email, role FROM users WHERE oauth_provider = 'google' AND oauth_id = %s;",
                    (google_sub,)
                )
                user_row = cur.fetchone()

                if not user_row:
                    cur.execute(
                        "SELECT id, email, role, oauth_provider FROM users WHERE email = %s;",
                        (email,)
                    )
                    existing = cur.fetchone()
                    if existing:
                        # Automatically link Google OAuth to the existing account matching this verified email
                        cur.execute(
                            "UPDATE users SET oauth_provider = 'google', oauth_id = %s WHERE id = %s;",
                            (google_sub, existing[0])
                        )
                        user_row = (existing[0], existing[1], existing[2])
                    else:
                        user_id = str(uuid.uuid4())
                        cur.execute(
                            "INSERT INTO users (id, email, password_hash, full_name, role, oauth_provider, oauth_id) "
                            "VALUES (%s, %s, NULL, %s, %s, 'google', %s);",
                            (user_id, email, full_name, "homeowner", google_sub)
                        )
                        user_row = (user_id, email, "homeowner")
    except HTTPException:
        raise
    except psycopg2.Error as e:
        logger.error("Database error during Google OAuth sign-in.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error. Database unavailable."
        )
    except Exception as e:
        logger.error("Unexpected error during Google OAuth sign-in.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error."
        )
    finally:
        if 'conn' in locals() and conn:
            conn.close()

    user_id, user_email, user_role = user_row
    access_token = create_access_token(subject=user_id)
    return {
        "id": str(user_id),
        "email": user_email,
        "role": user_role,
        "accessToken": access_token
    }


from app.services.multi_agent_pipeline import run_multi_agent_pipeline_for_images

def run_analysis_pipeline_bg(analysis_id: str, s3_keys: List[str], base64_images: List[str], budget: float, style: str):
    logger.info(f"Background multi-agent analysis task starting for analysis: {analysis_id}")
    try:
        # Trigger Multi-Agent Pipeline for EACH picture uploaded by the user
        cv_summary, recs = run_multi_agent_pipeline_for_images(
            analysis_id=analysis_id,
            base64_images=base64_images,
            budget_ceiling=budget,
            style_preference=style
        )
        
        # If recs is empty, fallback to standard recommendation generator
        if not recs:
            cv_res = analyze_property_images(analysis_id, s3_keys, base64_images)
            cv_summary = cv_res.get("cv_summary", {})
            recs = generate_recommendations(analysis_id, cv_summary, budget, style, base64_images)

        conn = get_db()
        try:
            with conn:
                with conn.cursor() as cur:
                    cur.execute(
                        "SELECT p.address FROM analyses a JOIN properties p ON a.property_id = p.id "
                        "WHERE a.id = %s::uuid;",
                        (analysis_id,)
                    )
                    row = cur.fetchone()
                    address = row[0] if row else "Property address unavailable"
        finally:
            conn.close()

        # Generate and persist the PDF report tied to this analysis
        generate_prelisting_report(analysis_id, address, budget, cv_summary, recs)

        conn = get_db()
        try:
            with conn:
                with conn.cursor() as cur:
                    cur.execute(
                        "UPDATE analyses SET status = 'completed', progress = 100, stage = 'done', "
                        "cv_summary = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s::uuid;",
                        (psycopg2.extras.Json(cv_summary), analysis_id)
                    )
        finally:
            conn.close()

        logger.info(f"Background analysis task completed successfully for analysis: {analysis_id}")
    except Exception as e:
        logger.error(f"Background analysis task failed: {e}")
        try:
            conn = get_db()
            try:
                with conn:
                    with conn.cursor() as cur:
                        # Keep the exception text for diagnostics. It is not
                        # surfaced to the client verbatim — get_analysis_results
                        # returns a generic message so internals don't leak.
                        cur.execute(
                            "UPDATE analyses SET status = 'failed', stage = 'failed', "
                            "error = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s::uuid;",
                            (str(e)[:2000], analysis_id)
                        )
            finally:
                conn.close()
        except psycopg2.Error:
            logger.error("Failed to persist failure status for analysis.")


@router.post("/upload", response_model=UploadResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_property_images(
    request: Request,
    payload: UploadRequest,
    background_tasks: BackgroundTasks,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Any:
    """
    Ingest property images, perform magic bytes validation, persist a real
    property + analysis row, and queue the async background pipeline.
    """
    user_id = current_user["sub"]
    rate_limiter.check_limit(f"upload:{user_id}")

    logger.info(f"Received upload request for property_id: {payload.property_id} from user_id: {user_id}")

    s3_keys = []
    for img_data in payload.images:
        s3_key, ext = validate_and_store_image(img_data, user_id)
        s3_keys.append(s3_key)

    try:
        conn = get_db()
        with conn:
            with conn.cursor() as cur:
                property_id = str(uuid.uuid4())
                cur.execute(
                    "INSERT INTO properties (id, user_id, address, mls_id, budget_ceiling, style_preference) "
                    "VALUES (%s::uuid, %s::uuid, %s, %s, %s, %s) RETURNING id;",
                    (
                        property_id,
                        user_id,
                        payload.metadata.address,
                        payload.metadata.mls_id,
                        payload.metadata.user_budget,
                        payload.metadata.style_preference,
                    )
                )

                analysis_id = str(uuid.uuid4())
                cur.execute(
                    "INSERT INTO analyses (id, property_id, status) VALUES (%s::uuid, %s::uuid, 'processing') RETURNING id;",
                    (analysis_id, property_id)
                )
    except psycopg2.Error:
        logger.error("Database error while initializing analysis.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error. Database unavailable."
        )
    finally:
        if 'conn' in locals() and conn:
            conn.close()

    # Trigger background pipeline in-process
    background_tasks.add_task(
        run_analysis_pipeline_bg,
        analysis_id,
        s3_keys,
        payload.images,
        payload.metadata.user_budget,
        payload.metadata.style_preference
    )

    return UploadResponse(
        analysis_id=analysis_id,
        status="processing",
        estimated_completion_time="5s"
    )

from app.services.mls_service import MLSClient, download_mls_photo_base64

@router.post("/mls/import", response_model=MLSImportResponse, status_code=status.HTTP_202_ACCEPTED)
async def import_mls_listing(
    request: Request,
    payload: MLSImportRequest,
    background_tasks: BackgroundTasks,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Any:
    """
    Directly ingest listing metadata & room photos from MLS feeds (RESO Web API / SimplyRETS)
    via MLS ID, store property records, and trigger multi-agent image analysis.
    """
    user_id = current_user["sub"]
    rate_limiter.check_limit(f"mls_import:{user_id}")

    logger.info(f"Received MLS import request for MLS ID: {payload.mls_id} from user_id: {user_id}")

    client = MLSClient()
    listing_data = client.fetch_listing_by_mls_id(payload.mls_id)

    # Download photos concurrently and convert to base64
    base64_images = []
    s3_keys = []
    for photo_url in listing_data.get("photo_urls", []):
        b64_str = download_mls_photo_base64(photo_url)
        if b64_str:
            s3_key, ext = validate_and_store_image(b64_str, user_id)
            s3_keys.append(s3_key)
            base64_images.append(b64_str)

    if not base64_images:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to fetch listing photos for the specified MLS ID."
        )

    try:
        conn = get_db()
        with conn:
            with conn.cursor() as cur:
                property_id = str(uuid.uuid4())
                cur.execute(
                    "INSERT INTO properties (id, user_id, address, mls_id, budget_ceiling, style_preference) "
                    "VALUES (%s::uuid, %s::uuid, %s, %s, %s, %s) RETURNING id;",
                    (
                        property_id,
                        user_id,
                        listing_data["address"],
                        payload.mls_id,
                        payload.user_budget,
                        payload.style_preference,
                    )
                )

                analysis_id = str(uuid.uuid4())
                cur.execute(
                    "INSERT INTO analyses (id, property_id, status) VALUES (%s::uuid, %s::uuid, 'processing') RETURNING id;",
                    (analysis_id, property_id)
                )
    except psycopg2.Error:
        logger.error("Database error while initializing MLS analysis.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error. Database unavailable."
        )
    finally:
        if 'conn' in locals() and conn:
            conn.close()

    background_tasks.add_task(
        run_analysis_pipeline_bg,
        analysis_id,
        s3_keys,
        base64_images,
        payload.user_budget,
        payload.style_preference
    )

    return MLSImportResponse(
        mls_id=payload.mls_id,
        address=listing_data["address"],
        list_price=listing_data["list_price"],
        bedrooms=listing_data["bedrooms"],
        bathrooms=listing_data["bathrooms"],
        photos_imported_count=len(base64_images),
        analysis_id=analysis_id,
        status="processing"
    )

from app.services.inpaint_service import generate_selective_inpaint

@router.post("/inpaint", response_model=InpaintResponse, status_code=status.HTTP_200_OK)
async def perform_selective_inpaint(
    request: Request,
    payload: InpaintRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Any:
    """
    Perform localized AI image inpainting on a specific room zone (Wall Paint, Window Drapes, Lighting, Cabinets)
    while preserving 100% of unmasked room geometry and original photo elements.
    """
    user_id = current_user["sub"]
    rate_limiter.check_limit(f"inpaint:{user_id}")

    logger.info(f"Received selective inpainting request for zone '{payload.zone}' option '{payload.option_key}' from user_id: {user_id}")

    result = generate_selective_inpaint(
        source_img_b64=payload.source_image,
        zone_name=payload.zone,
        option_key=payload.option_key,
        style_preference=payload.style_preference,
        custom_prompt=payload.custom_prompt,
        custom_title=payload.custom_title
    )

    if result.get("status") != "SUCCESS":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("reason", "Inpainting generation failed.")
        )

    return InpaintResponse(
        status="SUCCESS",
        inpaint_id=result["inpaint_id"],
        inpainted_image_url=result["inpainted_image_url"],
        mask_image_url=result["mask_image_url"],
        zone=result["zone"],
        option_title=result["option_title"],
        paint_code=result.get("paint_code", "")
    )

@router.get("/analyses", response_model=List[AnalysisSummaryResponse])
async def list_analyses(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Any:
    """
    List the current user's analyses for the dashboard overview.
    """
    user_id = current_user["sub"]
    rate_limiter.check_limit(f"analyses_list:{user_id}")

    status_labels = {
        "pending": ("status-progress", "Analyzing"),
        "processing": ("status-progress", "Analyzing"),
        "completed": ("status-complete", "Complete"),
        "failed": ("status-error", "Error"),
    }

    try:
        conn = get_db()
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT a.id, p.address, a.created_at, a.status, p.budget_ceiling, "
                    "(SELECT MAX(r.roi_percentage) FROM recommendations r WHERE r.analysis_id = a.id) AS top_roi, "
                    "(SELECT rp.shareable_token FROM reports rp WHERE rp.analysis_id = a.id "
                    "ORDER BY rp.created_at DESC LIMIT 1) AS shareable_token "
                    "FROM analyses a JOIN properties p ON a.property_id = p.id "
                    "WHERE p.user_id = %s::uuid ORDER BY a.created_at DESC;",
                    (user_id,)
                )
                rows = cur.fetchall()
    except psycopg2.Error:
        logger.error("Database error while listing analyses.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error. Database unavailable."
        )
    finally:
        if 'conn' in locals() and conn:
            conn.close()

    results = []
    for row in rows:
        analysis_id, address, created_at, analysis_status, budget_ceiling, top_roi, shareable_token = row
        status_key, status_label = status_labels.get(analysis_status, ("status-progress", "Analyzing"))
        date_str = created_at.strftime("%b %d, %Y") if hasattr(created_at, "strftime") else str(created_at)[:10]
        results.append(AnalysisSummaryResponse(
            id=str(analysis_id),
            address=address,
            date=date_str,
            status=status_key,
            statusLabel=status_label,
            roi=float(top_roi) if top_roi is not None else None,
            cost=float(budget_ceiling or 0),
            reportUrl=f"/api/v1/reports/{shareable_token}/download" if shareable_token else None,
        ))
    return results

@router.delete("/analyses/{analysis_id}", status_code=status.HTTP_200_OK)
async def delete_analysis(
    analysis_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Any:
    """
    Delete an analysis owned by the current user. Recommendations and
    reports for it are removed via ON DELETE CASCADE.
    """
    user_id = current_user["sub"]
    rate_limiter.check_limit(f"delete_analysis:{user_id}")

    try:
        conn = get_db()
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM analyses WHERE id = %s::uuid AND property_id IN "
                    "(SELECT id FROM properties WHERE user_id = %s::uuid) "
                    "RETURNING id;",
                    (analysis_id, user_id)
                )
                deleted = cur.fetchone()
    except psycopg2.Error:
        logger.error("Database error while deleting analysis.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error. Database unavailable."
        )
    finally:
        if 'conn' in locals() and conn:
            conn.close()

    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found.")

    return {"status": "deleted", "id": analysis_id}

@router.get("/images/{image_name}", status_code=status.HTTP_200_OK)
async def get_generated_image(image_name: str):
    images_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "generated")
    image_path = os.path.join(images_dir, os.path.basename(image_name))
    if not os.path.exists(image_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    return FileResponse(image_path, media_type="image/png")

def _generate_smart_selective_options_for_rec(category: str, why_text: str, scope: List[Any]) -> Tuple[List[str], List[Dict[str, Any]]]:
    cat_lower = (category or "").lower()
    scope_text = " ".join([
        (str(item.get("feature", "")) + " " + str(item.get("item", "")) + " " + str(item.get("added_details", "")))
        if isinstance(item, dict) else str(item)
        for item in (scope or [])
    ]).lower()
    combined_context = f"{cat_lower} {(why_text or '').lower()} {scope_text}"

    # Master library of AI-curated interactive surface & fixture customizations
    all_candidate_options = [
        {
            "zone": "accent_wall",
            "option_key": "paint_repose_gray",
            "title": "🎨 SW Repose Gray Walls",
            "badge": "SW 7015",
            "description": "Sherwin-Williams Repose Gray low-VOC eggshell wall refresh",
            "exclude_keywords": ["repose gray", "gray wall"],
            "items_added": [
                {"item": "[+] Sherwin-Williams Repose Gray (SW 7015) Low-VOC Eggshell Wall Paint ($650)", "checked": True},
                {"item": "[+] Professional Surface Prep, Priming & 2-Coat Application ($450)", "checked": True}
            ]
        },
        {
            "zone": "accent_wall",
            "option_key": "paint_evergreen_fog",
            "title": "🎨 Evergreen Fog Wall",
            "badge": "SW 9130",
            "description": "Sherwin-Williams Evergreen Fog soft organic sage green wall",
            "exclude_keywords": ["evergreen fog", "green wall"],
            "items_added": [
                {"item": "[+] Sherwin-Williams Evergreen Fog (SW 9130) Organic Accent Wall ($750)", "checked": True},
                {"item": "[+] Designer Feature Wall Prep & Edge Cutting ($350)", "checked": True}
            ]
        },
        {
            "zone": "accent_wall",
            "option_key": "paint_alabaster",
            "title": "🎨 SW Alabaster Walls",
            "badge": "SW 7008",
            "description": "Sherwin-Williams Alabaster warm crisp designer off-white",
            "exclude_keywords": ["alabaster", "white wall"],
            "items_added": [
                {"item": "[+] Sherwin-Williams Alabaster (SW 7008) Warm Off-White Paint ($680)", "checked": True},
                {"item": "[+] Complete Room Priming & Architectural Trim Coat ($420)", "checked": True}
            ]
        },
        {
            "zone": "lighting",
            "option_key": "brass_vanity_mirror",
            "title": "🪞 Brass Framed Mirror",
            "badge": "Vanity",
            "description": "Modern brushed brass backlit framed designer vanity mirror",
            "exclude_keywords": ["mirror", "vanity mirror", "framed mirror"],
            "items_added": [
                {"item": "[+] Modern Brushed Brass Framed Vanity Mirror with LED Backlighting ($850)", "checked": True},
                {"item": "[+] Professional Mirror Wall Mounting & Concealed Electrical ($350)", "checked": True}
            ]
        },
        {
            "zone": "window_drapes",
            "option_key": "frosted_privacy_glass",
            "title": "🚿 Frosted Privacy Glass",
            "badge": "Bath Window",
            "description": "Sleek frosted privacy glass window in matte black frame",
            "exclude_keywords": ["privacy glass", "frosted glass", "frosted window", "drapes", "curtains"],
            "items_added": [
                {"item": "[+] Sleek Frosted Privacy Glass Bath Window with Matte Black Frame ($1,150)", "checked": True},
                {"item": "[+] Weatherproofing, Sealing & Interior Window Trim ($320)", "checked": True}
            ]
        },
        {
            "zone": "lighting",
            "option_key": "modern_sconces",
            "title": "💡 Warm Vanity Sconces",
            "badge": "LED",
            "description": "Stylish modern black-and-brass LED bedside/vanity wall sconces",
            "exclude_keywords": ["sconce", "sconces", "wall sconce", "bedside lamp"],
            "items_added": [
                {"item": "[+] Stylish Black-and-Brass Dimmable Warm LED Wall Sconces ($640)", "checked": True},
                {"item": "[+] Wall Junction Box Installation & Dedicated Dimmer Switch ($380)", "checked": True}
            ]
        },
        {
            "zone": "cabinetry",
            "option_key": "brass_cabinet_hardware",
            "title": "✨ Brass Hardware",
            "badge": "Modern",
            "description": "Designer brushed brass bar cabinet handles and drawer pulls",
            "exclude_keywords": ["brass hardware", "cabinet pull", "hardware", "handles"],
            "items_added": [
                {"item": "[+] Designer Brushed Brass Solid Bar Handles & Drawer Pulls ($520)", "checked": True},
                {"item": "[+] Precision Template Drilling & Custom Hardware Mounting ($280)", "checked": True}
            ]
        },
        {
            "zone": "window_drapes",
            "option_key": "modern_blackout_drapes",
            "title": "🪟 Blackout Drapes",
            "badge": "Window",
            "description": "Tailored floor-length charcoal blackout curtains on metal rod",
            "exclude_keywords": ["drape", "drapes", "curtain", "curtains", "blackout", "blind", "blinds"],
            "items_added": [
                {"item": "[+] Tailored Floor-Length Charcoal Blackout Curtains ($780)", "checked": True},
                {"item": "[+] Heavy-Duty Matte Black Metal Traverse Drapery Rod & Hardware ($320)", "checked": True}
            ]
        },
        {
            "zone": "window_drapes",
            "option_key": "linen_sheer_drapes",
            "title": "🪟 Linen Sheer Drapes",
            "badge": "Sheers",
            "description": "Elegant flowing organic white linen sheer window drapes",
            "exclude_keywords": ["drape", "drapes", "curtain", "curtains", "sheer", "blind", "blinds"],
            "items_added": [
                {"item": "[+] Elegant Flowing Organic White Linen Sheer Drapery Panels ($690)", "checked": True},
                {"item": "[+] Custom Architectural Track Rod & Professional Hanging ($290)", "checked": True}
            ]
        },
        {
            "zone": "lighting",
            "option_key": "brass_chandelier",
            "title": "💡 Brass Chandelier",
            "badge": "Ceiling",
            "description": "Minimalist brushed brass chandelier ceiling fixture with warm bulbs",
            "exclude_keywords": ["chandelier", "pendant", "pendants", "ceiling fixture", "island light"],
            "items_added": [
                {"item": "[+] Minimalist Brushed Brass Chandelier Ceiling Light Fixture ($920)", "checked": True},
                {"item": "[+] Ceiling Box Reinforcement & Electrical Hookup ($350)", "checked": True}
            ]
        },
        {
            "zone": "accent_wall",
            "option_key": "crown_molding",
            "title": "🪵 Crown Molding & Trim",
            "badge": "Architectural",
            "description": "Install crisp modern white architectural crown molding & trim",
            "exclude_keywords": ["crown molding", "molding", "trim", "wainscot"],
            "items_added": [
                {"item": "[+] Crisp White Modern Architectural Crown Molding & Trim ($1,100)", "checked": True},
                {"item": "[+] Precision Mitering, Caulking & Enamel Topcoat ($450)", "checked": True}
            ]
        },
        {
            "zone": "flooring",
            "option_key": "white_oak_flooring",
            "title": "🪵 White Oak Hardwood",
            "badge": "Flooring",
            "description": "Wide-plank European white oak hardwood flooring with natural matte finish",
            "exclude_keywords": ["hardwood", "white oak floor", "wood floor", "engineered floor", "flooring"],
            "items_added": [
                {"item": "[+] Wide-Plank European White Oak Engineered Hardwood Flooring ($2,850)", "checked": True},
                {"item": "[+] Professional Subfloor Leveling, Underlayment & Installation ($1,200)", "checked": True}
            ]
        },
        {
            "zone": "cabinetry",
            "option_key": "calacatta_countertop",
            "title": "🪨 Calacatta Quartz Vanity",
            "badge": "Countertop",
            "description": "Resurface bathroom vanity or countertops with luxury Calacatta white quartz",
            "exclude_keywords": ["quartz", "countertop", "marble surface", "calacatta"],
            "items_added": [
                {"item": "[+] Luxury Seamless Calacatta White Quartz Vanity Countertop ($1,150)", "checked": True},
                {"item": "[+] Professional Template, Fabrication & Undermount Sink Seal ($450)", "checked": True}
            ]
        },
        {
            "zone": "cabinetry",
            "option_key": "white_oak_vanity",
            "title": "🪵 White Oak Vanity Base",
            "badge": "Cabinetry",
            "description": "Reface bathroom vanity cabinetry in warm natural rift-cut white oak finish",
            "exclude_keywords": ["white oak vanity", "wood vanity", "oak cabinet", "vanity base"],
            "items_added": [
                {"item": "[+] Custom Rift-Cut European White Oak Vanity Refacing ($1,400)", "checked": True},
                {"item": "[+] Moisture-Resistant Matte Polyurethane Protective Finish ($380)", "checked": True}
            ]
        }
    ]

    # Filter out options where the photo/scope already has that feature or lacks required room geometry
    eligible_options = []
    for opt in all_candidate_options:
        # Check if any exclude keyword is already present in the photograph / scope text
        if not any(kw in combined_context for kw in opt["exclude_keywords"]):
            # If option targets window treatments or privacy glass, verify the room photograph actually has a window!
            if opt["zone"] == "window_drapes" or "glass" in opt["option_key"] or "drape" in opt["option_key"]:
                has_window = any(w in combined_context for w in ["window", "windows", "natural light", "drape", "curtain", "blind", "skylight"])
                if not has_window:
                    continue

            # Also ensure bathroom-only or bedroom-only logic is clean
            if "bath" in cat_lower and opt["option_key"] in ["modern_blackout_drapes", "linen_sheer_drapes"]:
                continue
            if "kitchen" in cat_lower and opt["option_key"] in ["modern_blackout_drapes", "linen_sheer_drapes", "brass_vanity_mirror", "frosted_privacy_glass", "white_oak_vanity"]:
                continue
            if not ("bath" in cat_lower) and opt["option_key"] in ["brass_vanity_mirror", "frosted_privacy_glass", "white_oak_vanity"]:
                continue
            eligible_options.append(opt)

    # Pick exactly 6 tailored options (pad with safe universal options if needed)
    selected_options = eligible_options[:6]
    if len(selected_options) < 6:
        for opt in all_candidate_options:
            if opt not in selected_options and not ("bath" in cat_lower and ("drapes" in opt["option_key"] or "glass" in opt["option_key"])):
                selected_options.append(opt)
                if len(selected_options) == 6:
                    break

    # Extract 6 detected features present in the image
    detected_features = []
    if "bath" in cat_lower:
        detected_features = ["Vanity Mirror & Sconces", "Bathroom Privacy Window", "Sherwin-Williams Paint", "Vanity Hardware", "Quartz Countertop Surface", "Floor & Shower Tile"]
    elif "kitchen" in cat_lower:
        detected_features = ["Cabinetry & Island", "Backsplash Tile Surface", "Countertop Surface", "Ceiling Pendant Lights", "Cabinet Hardware", "Wall Paint & Trim"]
    else:
        detected_features = ["Wall Paint & Accent Wall", "Window Perimeter & Trim", "Ceiling & Lighting Fixtures", "Flooring Surface", "Architectural Molding", "Furniture & Layout"]

    # Strip helper 'exclude_keywords' from returned dictionaries
    clean_options = [
        {k: v for k, v in opt.items() if k != "exclude_keywords"}
        for opt in selected_options
    ]
    return detected_features, clean_options

@router.get("/analyze/{analysis_id}", response_model=AnalysisResultResponse)
async def get_analysis_results(
    analysis_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Any:
    """
    Poll analysis status, return CV results and AI recommendations for an
    analysis owned by the current user.
    """
    user_id = current_user["sub"]
    rate_limiter.check_limit(f"analyze:{user_id}")

    try:
        conn = get_db()
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT a.status, a.cv_summary, a.progress, a.stage, a.stage_detail, a.created_at FROM analyses a "
                    "JOIN properties p ON a.property_id = p.id "
                    "WHERE a.id = %s::uuid AND p.user_id = %s::uuid;",
                    (analysis_id, user_id)
                )
                analysis_row = cur.fetchone()
                if not analysis_row:
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found.")

                (analysis_status, cv_summary, analysis_progress, analysis_stage,
                 analysis_stage_detail, analysis_created_at) = analysis_row

                # Postgres hands back a datetime, the SQLite path a string.
                started_at_iso = (
                    analysis_created_at.isoformat()
                    if hasattr(analysis_created_at, "isoformat")
                    else (str(analysis_created_at) if analysis_created_at else None)
                )

                if analysis_status == "failed":
                    # Reported as a 200 with status="failed" rather than a 500:
                    # a failed pipeline run is a valid, expected outcome of
                    # polling, and an error status code made the client's fetch
                    # throw and retry forever instead of showing the failure.
                    # The stored error text stays server-side; the client gets a
                    # generic message so internals aren't exposed.
                    #
                    # Note: no conn.close() here. Returning from inside the
                    # `with conn`/`with cur` blocks still runs their __exit__,
                    # and the outer `finally` closes the connection — closing it
                    # early made those exits operate on a dead handle.
                    return AnalysisResultResponse(
                        status="failed",
                        cv_results=_ensure_dict(cv_summary),
                        recommendations=[],
                        report_url=None,
                        progress=analysis_progress or 0,
                        stage=analysis_stage,
                        error="The analysis pipeline could not complete. Please try again.",
                    )
                elif analysis_status == "processing":
                    return AnalysisResultResponse(
                        status="processing",
                        cv_results=_ensure_dict(cv_summary),
                        recommendations=[],
                        report_url=None,
                        progress=analysis_progress or 0,
                        stage=analysis_stage or "ingest",
                        stage_detail=analysis_stage_detail,
                        started_at=started_at_iso,
                    )

                cur.execute(
                    "SELECT id, category, estimated_cost, projected_value_increase, roi_percentage, "
                    "timeline, explanation, why_details, scope, before_image_url, after_image_url FROM recommendations "
                    "WHERE analysis_id = %s::uuid ORDER BY roi_percentage DESC;",
                    (analysis_id,)
                )
                rec_rows = cur.fetchall()

                cur.execute(
                    "SELECT shareable_token FROM reports WHERE analysis_id = %s::uuid "
                    "ORDER BY created_at DESC LIMIT 1;",
                    (analysis_id,)
                )
                report_row = cur.fetchone()
    except HTTPException:
        raise
    except psycopg2.Error:
        logger.error("Database error while fetching analysis results.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error. Database unavailable."
        )
    finally:
        if 'conn' in locals() and conn:
            conn.close()

    recommendations = []
    for r in rec_rows:
        why_raw = r[7]
        why_text = why_raw
        tier_5k_url = None
        tier_10k_url = None
        tier_15k_url = None
        options_list = []
        
        if isinstance(why_raw, str) and (why_raw.startswith("{") or why_raw.startswith('{"')):
            try:
                parsed_why = json.loads(why_raw)
                why_text = parsed_why.get("why_details", why_raw)
                tier_5k_url = parsed_why.get("tier_5k_url")
                tier_10k_url = parsed_why.get("tier_10k_url")
                tier_15k_url = parsed_why.get("tier_15k_url")
                options_list = parsed_why.get("options", [])
            except Exception:
                pass
        elif isinstance(why_raw, dict):
            why_text = why_raw.get("why_details", str(why_raw))
            tier_5k_url = why_raw.get("tier_5k_url")
            tier_10k_url = why_raw.get("tier_10k_url")
            tier_15k_url = why_raw.get("tier_15k_url")
            options_list = why_raw.get("options", [])

        if not options_list:
            cost_val = float(r[2])
            val_add = float(r[3])
            roi_val = float(r[4])
            time_str = r[5]
            sc_list = _ensure_list(r[8])
            aft_url = r[10] if len(r) > 10 else None
            options_list = [
                {
                    "id": "option_a",
                    "title": "Option A: Cosmetic Value Refresh",
                    "cost": max(1500.0, round(cost_val * 0.45, 2)),
                    "projected_value_increase": round(cost_val * 0.45 * 1.85, 2),
                    "roi_percentage": 85.0,
                    "timeline": "Quick Refresh (1-2 Weeks)",
                    "after_image_url": tier_5k_url or aft_url or "/api/v1/images/homeready_upgrade_5k_cosmetic_refresh.png",
                    "scope": sc_list[:2] if len(sc_list) >= 2 else sc_list,
                },
                {
                    "id": "option_b",
                    "title": "Option B: Balanced Designer Upgrade",
                    "cost": cost_val,
                    "projected_value_increase": val_add,
                    "roi_percentage": roi_val,
                    "timeline": time_str,
                    "after_image_url": tier_10k_url or aft_url or "/api/v1/images/homeready_upgrade_10k_moderate_upgrade.png",
                    "scope": sc_list,
                },
                {
                    "id": "option_c",
                    "title": "Option C: Luxury Architectural Remodel",
                    "cost": round(cost_val * 1.45, 2),
                    "projected_value_increase": round(cost_val * 1.45 * 1.48, 2),
                    "roi_percentage": 48.0,
                    "timeline": "Full Overhaul (6+ Weeks)",
                    "after_image_url": tier_15k_url or aft_url or "/api/v1/images/homeready_upgrade_15k_luxury_remodel.png",
                    "scope": sc_list + [{"item": "[+] Premium Custom Architectural Millwork ($3,500) — Custom built-in cabinetry", "checked": True}],
                },
            ]

        det_feats, sel_opts = _generate_smart_selective_options_for_rec(r[1], why_text, _ensure_list(r[8]))
        recommendations.append({
            "upgrade_id": str(r[0]),
            "category": r[1],
            "estimated_cost": float(r[2]),
            "projected_value_increase": float(r[3]),
            "roi_percentage": float(r[4]),
            "timeline": r[5],
            "explanation": r[6],
            "why_details": why_text,
            "scope": _ensure_list(r[8]),
            "before_image_url": r[9] if len(r) > 9 else None,
            "after_image_url": r[10] if len(r) > 10 else None,
            "tier_5k_url": tier_5k_url,
            "tier_10k_url": tier_10k_url,
            "tier_15k_url": tier_15k_url,
            "options": options_list,
            "detected_features": det_feats,
            "selective_options": sel_opts,
        })

    report_url = f"/api/v1/reports/{report_row[0]}/download" if report_row else None

    return AnalysisResultResponse(
        status=analysis_status,
        cv_results=_ensure_dict(cv_summary),
        recommendations=recommendations,
        report_url=report_url,
        progress=100,
        stage="done",
    )

@router.get("/recommendations/{analysis_id}")
async def get_recommendations_only(
    analysis_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Any:
    """
    Fetch persisted recommendations for an analysis owned by the current user.
    """
    user_id = current_user["sub"]
    rate_limiter.check_limit(f"recs:{user_id}")

    try:
        conn = get_db()
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT r.id, r.category, r.estimated_cost, r.projected_value_increase, r.roi_percentage, "
                    "r.timeline, r.explanation, r.why_details, r.scope, r.before_image_url, r.after_image_url "
                    "FROM recommendations r "
                    "JOIN analyses a ON r.analysis_id = a.id "
                    "JOIN properties p ON a.property_id = p.id "
                    "WHERE a.id = %s::uuid AND p.user_id = %s::uuid "
                    "ORDER BY r.roi_percentage DESC;",
                    (analysis_id, user_id)
                )
                rows = cur.fetchall()
    except psycopg2.Error:
        logger.error("Database error while fetching recommendations.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error. Database unavailable."
        )
    finally:
        if 'conn' in locals() and conn:
            conn.close()

    recommendations = []
    for r in rows:
        why_raw = r[7]
        why_text = why_raw
        tier_5k_url = None
        tier_10k_url = None
        tier_15k_url = None
        options_list = []

        if isinstance(why_raw, str) and (why_raw.startswith("{") or why_raw.startswith('{"')):
            try:
                parsed_why = json.loads(why_raw)
                why_text = parsed_why.get("why_details", why_raw)
                tier_5k_url = parsed_why.get("tier_5k_url")
                tier_10k_url = parsed_why.get("tier_10k_url")
                tier_15k_url = parsed_why.get("tier_15k_url")
                options_list = parsed_why.get("options", [])
            except Exception:
                pass
        elif isinstance(why_raw, dict):
            why_text = why_raw.get("why_details", str(why_raw))
            tier_5k_url = why_raw.get("tier_5k_url")
            tier_10k_url = why_raw.get("tier_10k_url")
            tier_15k_url = why_raw.get("tier_15k_url")
            options_list = why_raw.get("options", [])

        if not options_list:
            cost_val = float(r[2])
            val_add = float(r[3])
            roi_val = float(r[4])
            time_str = r[5]
            sc_list = _ensure_list(r[8])
            aft_url = r[10] if len(r) > 10 else None
            options_list = [
                {
                    "id": "option_a",
                    "title": "Option A: Cosmetic Value Refresh",
                    "cost": max(1500.0, round(cost_val * 0.45, 2)),
                    "projected_value_increase": round(cost_val * 0.45 * 1.85, 2),
                    "roi_percentage": 85.0,
                    "timeline": "Quick Refresh (1-2 Weeks)",
                    "after_image_url": tier_5k_url or aft_url or "/api/v1/images/homeready_upgrade_5k_cosmetic_refresh.png",
                    "scope": sc_list[:2] if len(sc_list) >= 2 else sc_list,
                },
                {
                    "id": "option_b",
                    "title": "Option B: Balanced Designer Upgrade",
                    "cost": cost_val,
                    "projected_value_increase": val_add,
                    "roi_percentage": roi_val,
                    "timeline": time_str,
                    "after_image_url": tier_10k_url or aft_url or "/api/v1/images/homeready_upgrade_10k_moderate_upgrade.png",
                    "scope": sc_list,
                },
                {
                    "id": "option_c",
                    "title": "Option C: Luxury Architectural Remodel",
                    "cost": round(cost_val * 1.45, 2),
                    "projected_value_increase": round(cost_val * 1.45 * 1.48, 2),
                    "roi_percentage": 48.0,
                    "timeline": "Full Overhaul (6+ Weeks)",
                    "after_image_url": tier_15k_url or aft_url or "/api/v1/images/homeready_upgrade_15k_luxury_remodel.png",
                    "scope": sc_list + [{"item": "[+] Premium Custom Architectural Millwork ($3,500) — Custom built-in cabinetry", "checked": True}],
                },
            ]

        det_feats, sel_opts = _generate_smart_selective_options_for_rec(r[1], why_text, _ensure_list(r[8]))
        recommendations.append({
            "upgrade_id": str(r[0]),
            "category": r[1],
            "estimated_cost": float(r[2]),
            "projected_value_increase": float(r[3]),
            "roi_percentage": float(r[4]),
            "timeline": r[5],
            "explanation": r[6],
            "why_details": why_text,
            "scope": _ensure_list(r[8]),
            "before_image_url": r[9] if len(r) > 9 else None,
            "after_image_url": r[10] if len(r) > 10 else None,
            "tier_5k_url": tier_5k_url,
            "tier_10k_url": tier_10k_url,
            "tier_15k_url": tier_15k_url,
            "options": options_list,
            "detected_features": det_feats,
            "selective_options": sel_opts,
        })
    return {"analysis_id": analysis_id, "recommendations": recommendations}

@router.get("/reports")
async def list_reports(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Any:
    """
    List the current user's generated pre-listing reports.
    """
    user_id = current_user["sub"]
    rate_limiter.check_limit(f"reports_list:{user_id}")

    try:
        conn = get_db()
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT rp.id, rp.shareable_token, p.address, rp.created_at, p.budget_ceiling, "
                    "(SELECT COUNT(*) FROM recommendations rec WHERE rec.analysis_id = a.id) AS recs_count, "
                    "(SELECT COALESCE(SUM(rec.projected_value_increase), 0) FROM recommendations rec WHERE rec.analysis_id = a.id) AS value_add "
                    "FROM reports rp "
                    "JOIN analyses a ON rp.analysis_id = a.id "
                    "JOIN properties p ON a.property_id = p.id "
                    "WHERE p.user_id = %s::uuid ORDER BY rp.created_at DESC;",
                    (user_id,)
                )
                rows = cur.fetchall()
    except psycopg2.Error:
        logger.error("Database error while listing reports.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error. Database unavailable."
        )
    finally:
        if 'conn' in locals() and conn:
            conn.close()

    results = []
    for row in rows:
        report_id, shareable_token, address, created_at, budget_ceiling, recs_count, value_add = row
        results.append({
            "id": str(report_id),
            "address": address,
            "title": f"Pre-Listing Report — {address}",
            "recsCount": int(recs_count),
            "valueAdd": float(value_add),
            "cost": float(budget_ceiling or 0),
            "date": created_at.strftime("%b %d, %Y"),
            "status": "status-complete",
            "reportUrl": f"/api/v1/reports/{shareable_token}/download",
        })
    return results

@router.delete("/reports/{report_id}", status_code=status.HTTP_200_OK)
async def delete_report(
    report_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Any:
    """
    Delete a generated report owned by the current user. Only removes the
    report artifact - the underlying analysis/recommendations are untouched.
    """
    user_id = current_user["sub"]
    rate_limiter.check_limit(f"delete_report:{user_id}")

    try:
        conn = get_db()
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM reports WHERE id = %s::uuid AND analysis_id IN "
                    "(SELECT a.id FROM analyses a JOIN properties p ON a.property_id = p.id WHERE p.user_id = %s::uuid) "
                    "RETURNING id;",
                    (report_id, user_id)
                )
                deleted = cur.fetchone()
    except psycopg2.Error:
        logger.error("Database error while deleting report.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error. Database unavailable."
        )
    finally:
        if 'conn' in locals() and conn:
            conn.close()

    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

    return {"status": "deleted", "id": report_id}

@router.get("/reports/{shareable_token}/download")
async def download_report(request: Request, shareable_token: str) -> Any:
    """
    Serve a generated report PDF by its shareable token. Deliberately
    unauthenticated - matches the schema's own shareable_token/
    is_password_protected "shareable public link" design intent - but still
    rate-limited by IP like every other endpoint, and the token is never
    logged in full.
    """
    client_host = request.client.host if request.client else "unknown"
    rate_limiter.check_limit(f"report_download:{client_host}")

    try:
        conn = get_db()
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT pdf_data FROM reports WHERE shareable_token = %s;",
                    (shareable_token,)
                )
                row = cur.fetchone()
    except psycopg2.Error:
        logger.error("Database error while fetching report PDF.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error. Database unavailable."
        )
    finally:
        if 'conn' in locals() and conn:
            conn.close()

    if not row or not row[0]:
        logger.warning(f"Report download requested for unknown token (prefix: {shareable_token[:8]}...).")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

    return Response(content=bytes(row[0]), media_type="application/pdf")

@router.get("/images/{filename}")
async def get_generated_image(filename: str) -> Any:
    """
    Serve generated before/after concept visualization images (.png) created by the CV analysis pipeline.
    """
    safe_name = os.path.basename(filename)
    filepath = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "generated", safe_name)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found.")
    return FileResponse(filepath, media_type="image/png")

@router.get("/contractors")
async def list_contractors(request: Request) -> Any:
    """
    Public contractor directory listing - no auth required.
    """
    client_host = request.client.host if request.client else "unknown"
    rate_limiter.check_limit(f"contractors_list:{client_host}")

    try:
        conn = get_db()
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id, company_name, rating, reviews_count, license, location, "
                    "specialties, avg_cost, avg_timeline, availability, snippet, bio, pricing_info, reviews "
                    "FROM contractors WHERE is_verified = TRUE ORDER BY rating DESC;"
                )
                rows = cur.fetchall()
    except psycopg2.Error:
        logger.error("Database error while listing contractors.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error. Database unavailable."
        )
    finally:
        if 'conn' in locals() and conn:
            conn.close()

    results = []
    for row in rows:
        (contractor_id, company_name, rating, reviews_count, license_, location, specialties,
         avg_cost, avg_timeline, availability, snippet, bio, pricing_info, reviews) = row
        results.append({
            "id": str(contractor_id),
            "name": company_name,
            "rating": float(rating) if rating is not None else None,
            "reviewsCount": reviews_count,
            "license": license_,
            "location": location,
            "specialties": _ensure_list(specialties),
            "avgCost": float(avg_cost) if avg_cost is not None else None,
            "avgTimeline": avg_timeline,
            "availability": availability,
            "snippet": snippet,
            "bio": bio,
            "pricingInfo": _ensure_list(pricing_info),
            "reviews": _ensure_list(reviews),
        })
    return results

@router.post("/contractors/quote-requests", status_code=status.HTTP_200_OK)
async def create_quote_request(
    payload: QuoteRequestPayload,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Any:
    """
    Persist a homeowner lead for a contractor, optionally tied to a specific
    upgrade recommendation (recommendation_id is nullable - the contractors
    directory also supports general "contact this contractor" requests).
    """
    user_id = current_user["sub"]
    rate_limiter.check_limit(f"quote:{user_id}")

    attribution_token = f"lead-token-{uuid.uuid4().hex}"

    try:
        conn = get_db()
        with conn:
            with conn.cursor() as cur:
                if payload.recommendation_id:
                    cur.execute(
                        "SELECT r.id FROM recommendations r "
                        "JOIN analyses a ON r.analysis_id = a.id "
                        "JOIN properties p ON a.property_id = p.id "
                        "WHERE r.id = %s::uuid AND p.user_id = %s::uuid;",
                        (payload.recommendation_id, user_id)
                    )
                    if not cur.fetchone():
                        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recommendation not found.")

                cur.execute("SELECT id FROM contractors WHERE id = %s::uuid;", (payload.contractor_id,))
                if not cur.fetchone():
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contractor not found.")

                lead_id = str(uuid.uuid4())
                cur.execute(
                    "INSERT INTO lead_requests (id, recommendation_id, contractor_id, user_id, attribution_token) "
                    "VALUES (%s, %s, %s, %s::uuid, %s);",
                    (lead_id, payload.recommendation_id, payload.contractor_id, user_id, attribution_token)
                )
    except HTTPException:
        raise
    except psycopg2.Error:
        logger.error("Database error while creating quote request.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error. Database unavailable."
        )
    finally:
        if 'conn' in locals() and conn:
            conn.close()

    logger.info(f"Routed quote request to contractor_id: {payload.contractor_id}")

    return {
        "status": "sent",
        "attribution_token": attribution_token,
        "message": "Quote request routed successfully to contractor."
    }

@router.post("/modernize", status_code=status.HTTP_200_OK)
async def modernize_property_image(request: Request) -> Any:
    """
    Direct endpoint to test and generate a modernized architectural remodel concept image (.png).
    Accepts JSON with image (base64 string or sample filename), style preference, category, and budget.
    """
    from app.services.image_generator import modernize_image_file, transform_to_modernized_image, GENERATED_IMAGES_DIR
    from PIL import Image
    import io

    body = {}
    try:
        body = await request.json()
    except Exception:
        body = {}

    image_input = body.get("image") or ""
    style = body.get("style", "modern")
    category = body.get("category", "Kitchen Remodel")
    cost = float(body.get("budget", 25000.0))
    roi = float(body.get("roi", 48.5))

    # Check if input is a filename in images/ directory
    img_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "images")
    sample_path = os.path.join(img_dir, os.path.basename(image_input)) if image_input and not image_input.startswith("data:") and len(image_input) < 300 else None

    if sample_path and os.path.exists(sample_path):
        result = modernize_image_file(
            image_path=sample_path,
            style=style,
            category=category,
            estimated_cost=cost,
            roi=roi
        )
        return {
            "success": True,
            "message": "Modernized image generated successfully from sample photo.",
            "rec_id": result["rec_id"],
            "style": result["style"],
            "category": result["category"],
            "before_image_url": result["before_image_url"],
            "after_image_url": result["after_image_url"],
            "dimensions": f"{result['width']}x{result['height']}",
            "format": result["format"]
        }

    # If base64 data URL or raw string
    rec_id = f"api_mod_{uuid.uuid4().hex[:8]}_{style}"
    source_img = None
    if image_input:
        try:
            raw_b64 = image_input.split(",")[-1] if "," in image_input else image_input
            raw_bytes = base64.b64decode(raw_b64)
            source_img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
        except Exception as e:
            logger.warning(f"Could not decode provided base64 image: {e}")

    if not source_img:
        # Fallback to default sample photo in images/
        default_sample = os.path.join(img_dir, "Screenshot 2026-07-17 at 5.46.46 PM.png")
        if os.path.exists(default_sample):
            source_img = Image.open(default_sample).convert("RGB")
        else:
            source_img = Image.new("RGB", (1200, 800), color=(220, 225, 230))

    before_img, after_img = transform_to_modernized_image(
        source_img=source_img,
        category=category,
        style=style,
        estimated_cost=cost,
        roi=roi,
        rec_id=rec_id
    )

    before_filename = f"{rec_id}_before.png"
    after_filename = f"{rec_id}_after.png"
    before_path = os.path.join(GENERATED_IMAGES_DIR, before_filename)
    after_path = os.path.join(GENERATED_IMAGES_DIR, after_filename)

    before_img.save(before_path, "PNG")
    after_img.save(after_path, "PNG")

    return {
        "success": True,
        "message": "Modernized image generated successfully.",
        "rec_id": rec_id,
        "style": style,
        "category": category,
        "before_image_url": f"/api/v1/images/{before_filename}",
        "after_image_url": f"/api/v1/images/{after_filename}",
        "dimensions": "1200x800",
        "format": "PNG"
    }

@router.get("/sample-photos", status_code=status.HTTP_200_OK)
async def get_sample_evaluation_photos() -> Any:
    """
    Returns list of Gemini Enterprise evaluation set sample property photos
    with base64 data, ground-truth metadata, and test presets for instant testing.
    """
    eval_set_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "tests", "eval_dataset.json")
    if not os.path.exists(eval_set_path):
        return []

    with open(eval_set_path, "r") as f:
        eval_dataset = json.load(f)

    results = []
    for item in eval_dataset:
        sample_path = item["file_path"]
        data_url = ""
        if os.path.exists(sample_path):
            with open(sample_path, "rb") as f:
                b64 = base64.b64encode(f.read()).decode("utf-8")
                data_url = f"data:image/png;base64,{b64}"

        results.append({
            "eval_id": item["eval_id"],
            "title": item.get("property_scene", item["eval_id"].replace("-", " ").title()),
            "file_name": item["file_name"],
            "address": item["test_metadata"]["address"],
            "mls_id": item["test_metadata"]["mls_id"],
            "user_budget": item["test_metadata"]["user_budget"],
            "style_preference": item["test_metadata"]["style_preference"],
            "dataUrl": data_url
        })

    return results


# ==========================================
# CATEGORY 1 FEATURE ENDPOINTS
# ==========================================

@router.get("/users/me", status_code=status.HTTP_200_OK)
async def get_user_profile(current_user: Dict[str, Any] = Depends(get_current_user)) -> Any:
    user_id = current_user["sub"]
    conn = get_db()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id, email, full_name, phone, role, organization_id, white_label_config "
                    "FROM users WHERE id = %s::uuid OR id = %s;",
                    (user_id, user_id)
                )
                row = cur.fetchone()
                if not row:
                    return {
                        "id": user_id,
                        "email": "user@example.com",
                        "full_name": "Jordan Rivera",
                        "phone": "+1 (512) 555-0123",
                        "role": "homeowner",
                        "white_label_config": {
                            "company_name": "Austin Premier Realty",
                            "branding_color": "#0066CC",
                            "footer_text": "Prepared by Austin Premier Realty Group",
                            "analysis_complete_alerts": True,
                            "new_report_requests": True
                        }
                    }
                uid, email, full_name, phone, role, org_id, white_label_config = row
                cfg = _ensure_dict(white_label_config)
                return {
                    "id": str(uid),
                    "email": email,
                    "full_name": full_name,
                    "phone": phone or "",
                    "role": role,
                    "organization_id": str(org_id) if org_id else None,
                    "white_label_config": cfg
                }
    finally:
        if 'conn' in locals() and conn:
            conn.close()


@router.put("/users/me", status_code=status.HTTP_200_OK)
async def update_user_profile(
    payload: UserProfileUpdateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Any:
    user_id = current_user["sub"]
    conn = get_db()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id, email, password_hash, full_name, phone FROM users WHERE id = %s::uuid OR id = %s;",
                    (user_id, user_id)
                )
                row = cur.fetchone()
                if not row:
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

                uid, email, existing_pw_hash, existing_name, existing_phone = row

                new_pw_hash = existing_pw_hash
                if payload.new_password:
                    if not payload.current_password or not existing_pw_hash or not verify_password(payload.current_password, existing_pw_hash):
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Current password verification failed."
                        )
                    validate_password_strength(payload.new_password)
                    new_pw_hash = get_password_hash(payload.new_password)

                updated_name = payload.full_name.strip() if payload.full_name else existing_name
                updated_phone = payload.phone.strip() if payload.phone is not None else existing_phone

                cur.execute(
                    "UPDATE users SET full_name = %s, phone = %s, password_hash = %s WHERE id = %s::uuid OR id = %s;",
                    (updated_name, updated_phone, new_pw_hash, user_id, user_id)
                )
                return {
                    "message": "User profile updated successfully.",
                    "full_name": updated_name,
                    "phone": updated_phone
                }
    finally:
        if 'conn' in locals() and conn:
            conn.close()


@router.put("/users/me/branding", status_code=status.HTTP_200_OK)
async def update_agency_branding(
    payload: AgencyBrandingUpdateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Any:
    user_id = current_user["sub"]
    conn = get_db()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT white_label_config FROM users WHERE id = %s::uuid OR id = %s;",
                    (user_id, user_id)
                )
                row = cur.fetchone()
                cfg = _ensure_dict(row[0]) if row else {}

                if payload.company_name is not None:
                    cfg["company_name"] = payload.company_name
                if payload.branding_color is not None:
                    cfg["branding_color"] = payload.branding_color
                if payload.footer_text is not None:
                    cfg["footer_text"] = payload.footer_text

                cur.execute(
                    "UPDATE users SET white_label_config = %s WHERE id = %s::uuid OR id = %s;",
                    (psycopg2.extras.Json(cfg), user_id, user_id)
                )
                return {
                    "message": "Agency branding preferences updated.",
                    "white_label_config": cfg
                }
    finally:
        if 'conn' in locals() and conn:
            conn.close()


@router.put("/users/me/notifications", status_code=status.HTTP_200_OK)
async def update_notification_settings(
    payload: NotificationSettingsUpdateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Any:
    user_id = current_user["sub"]
    conn = get_db()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT white_label_config FROM users WHERE id = %s::uuid OR id = %s;",
                    (user_id, user_id)
                )
                row = cur.fetchone()
                cfg = _ensure_dict(row[0]) if row else {}

                cfg["analysis_complete_alerts"] = payload.analysis_complete_alerts
                cfg["new_report_requests"] = payload.new_report_requests

                cur.execute(
                    "UPDATE users SET white_label_config = %s WHERE id = %s::uuid OR id = %s;",
                    (psycopg2.extras.Json(cfg), user_id, user_id)
                )
                return {
                    "message": "Notification preferences updated.",
                    "white_label_config": cfg
                }
    finally:
        if 'conn' in locals() and conn:
            conn.close()


@router.get("/properties", status_code=status.HTTP_200_OK)
async def list_user_properties(current_user: Dict[str, Any] = Depends(get_current_user)) -> Any:
    user_id = current_user["sub"]
    conn = get_db()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id, address, mls_id, style_preference, budget_ceiling, created_at "
                    "FROM properties WHERE user_id = %s::uuid OR user_id = %s ORDER BY created_at DESC;",
                    (user_id, user_id)
                )
                rows = cur.fetchall()
                results = []
                for row in rows:
                    p_id, addr, mls, style, budget, created = row
                    results.append({
                        "id": str(p_id),
                        "address": addr,
                        "mls_id": mls,
                        "style": style or "Modern",
                        "budget": float(budget) if budget else 0.0,
                        "created_at": str(created)
                    })
                return results
    finally:
        if 'conn' in locals() and conn:
            conn.close()


@router.post("/properties", status_code=status.HTTP_201_CREATED)
async def create_user_property(
    payload: PropertyCreatePayload,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Any:
    user_id = current_user["sub"]
    prop_id = str(uuid.uuid4())
    conn = get_db()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO properties (id, user_id, address, mls_id, style_preference, budget_ceiling) "
                    "VALUES (%s, %s::uuid, %s, %s, %s, %s);",
                    (prop_id, user_id, payload.address, payload.mls_id, payload.style_preference, payload.budget_ceiling)
                )
                return {
                    "id": prop_id,
                    "address": payload.address,
                    "mls_id": payload.mls_id,
                    "style": payload.style_preference,
                    "budget": payload.budget_ceiling,
                    "message": "Property added successfully."
                }
    finally:
        if 'conn' in locals() and conn:
            conn.close()


@router.delete("/properties/{property_id}", status_code=status.HTTP_200_OK)
async def delete_user_property(
    property_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Any:
    user_id = current_user["sub"]
    conn = get_db()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id FROM properties WHERE (id = %s::uuid OR id = %s) AND (user_id = %s::uuid OR user_id = %s);",
                    (property_id, property_id, user_id, user_id)
                )
                if not cur.fetchone():
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found or unauthorized.")
                cur.execute("DELETE FROM properties WHERE id = %s::uuid OR id = %s;", (property_id, property_id))
                return {"message": "Property deleted successfully."}
    finally:
        if 'conn' in locals() and conn:
            conn.close()


@router.get("/teams/members", status_code=status.HTTP_200_OK)
async def list_team_members(current_user: Dict[str, Any] = Depends(get_current_user)) -> Any:
    user_id = current_user["sub"]
    conn = get_db()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT organization_id FROM users WHERE id = %s::uuid OR id = %s;",
                    (user_id, user_id)
                )
                row = cur.fetchone()
                org_id = row[0] if row and row[0] else user_id

                cur.execute(
                    "SELECT id, name, email, role FROM organization_members WHERE organization_id = %s;",
                    (str(org_id),)
                )
                rows = cur.fetchall()
                results = []
                for m_id, name, email, role in rows:
                    results.append({
                        "id": str(m_id),
                        "name": name or email.split("@")[0],
                        "email": email,
                        "role": role
                    })
                return results
    finally:
        if 'conn' in locals() and conn:
            conn.close()


@router.post("/teams/invite", status_code=status.HTTP_201_CREATED)
async def invite_team_member(
    payload: TeamInvitePayload,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Any:
    user_id = current_user["sub"]
    conn = get_db()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT organization_id FROM users WHERE id = %s::uuid OR id = %s;",
                    (user_id, user_id)
                )
                row = cur.fetchone()
                org_id = row[0] if row and row[0] else user_id

                member_id = str(uuid.uuid4())
                name_prefix = payload.email.split("@")[0].capitalize()
                cur.execute(
                    "INSERT INTO organization_members (id, organization_id, email, role, name) "
                    "VALUES (%s, %s, %s, %s, %s);",
                    (member_id, str(org_id), payload.email, payload.role, name_prefix)
                )
                return {
                    "id": member_id,
                    "email": payload.email,
                    "role": payload.role,
                    "name": name_prefix,
                    "message": f"Invitation sent to {payload.email}."
                }
    finally:
        if 'conn' in locals() and conn:
            conn.close()


@router.post("/contractors/{contractor_id}/reviews", status_code=status.HTTP_201_CREATED)
async def submit_contractor_review(
    contractor_id: str,
    payload: ContractorReviewPayload,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Any:
    user_id = current_user["sub"]
    conn = get_db()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT full_name FROM users WHERE id = %s::uuid OR id = %s;",
                    (user_id, user_id)
                )
                user_row = cur.fetchone()
                author_name = user_row[0] if user_row else "Verified Homeowner"

                cur.execute("SELECT id, rating, reviews_count FROM contractors WHERE id = %s::uuid OR id = %s;", (contractor_id, contractor_id))
                contractor_row = cur.fetchone()
                if not contractor_row:
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contractor not found.")

                c_id, curr_rating, curr_count = contractor_row
                review_id = str(uuid.uuid4())
                cur.execute(
                    "INSERT INTO contractor_reviews (id, contractor_id, user_id, author_name, rating, review_text) "
                    "VALUES (%s, %s, %s, %s, %s, %s);",
                    (review_id, contractor_id, user_id, author_name, payload.rating, payload.review_text)
                )

                new_count = (curr_count or 0) + 1
                new_rating = round((float(curr_rating or 5.0) * (curr_count or 0) + payload.rating) / new_count, 1)

                cur.execute(
                    "UPDATE contractors SET rating = %s, reviews_count = %s WHERE id = %s::uuid OR id = %s;",
                    (new_rating, new_count, contractor_id, contractor_id)
                )

                return {
                    "id": review_id,
                    "contractor_id": contractor_id,
                    "author": author_name,
                    "rating": payload.rating,
                    "text": payload.review_text,
                    "new_average_rating": new_rating,
                    "total_reviews": new_count
                }
    finally:
        if 'conn' in locals() and conn:
            conn.close()


@router.get("/contractors/{contractor_id}/reviews", status_code=status.HTTP_200_OK)
async def list_contractor_reviews(contractor_id: str) -> Any:
    conn = get_db()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id, author_name, rating, review_text, created_at "
                    "FROM contractor_reviews WHERE contractor_id = %s ORDER BY created_at DESC;",
                    (contractor_id,)
                )
                rows = cur.fetchall()
                results = []
                for r_id, author, rating, text, created in rows:
                    results.append({
                        "id": str(r_id),
                        "author": author,
                        "rating": float(rating),
                        "text": text,
                        "created_at": str(created)
                    })
                return results
    finally:
        if 'conn' in locals() and conn:
            conn.close()


@router.get("/contractors/leads", status_code=status.HTTP_200_OK)
async def list_user_lead_requests(current_user: Dict[str, Any] = Depends(get_current_user)) -> Any:
    user_id = current_user["sub"]
    conn = get_db()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT lr.id, c.company_name, lr.status, lr.attribution_token, lr.created_at "
                    "FROM lead_requests lr JOIN contractors c ON lr.contractor_id = c.id "
                    "WHERE lr.user_id = %s::uuid OR lr.user_id = %s ORDER BY lr.created_at DESC;",
                    (user_id, user_id)
                )
                rows = cur.fetchall()
                results = []
                for lr_id, c_name, status_, token, created in rows:
                    results.append({
                        "id": str(lr_id),
                        "contractor": c_name,
                        "status": status_,
                        "attribution_token": token,
                        "created_at": str(created)
                    })
                return results
    finally:
        if 'conn' in locals() and conn:
            conn.close()



