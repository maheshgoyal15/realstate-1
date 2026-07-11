import uuid
import logging
import psycopg2
import psycopg2.extras
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Request, Header, BackgroundTasks, Response
from app.schemas.payloads import (
    UploadRequest,
    UploadResponse,
    AnalysisResultResponse,
    AnalysisSummaryResponse,
    QuoteRequestPayload,
    AuthLoginRequest,
    AuthSignupRequest,
    AuthGoogleRequest,
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
from app.core.rate_limit import rate_limiter
from app.services.storage import validate_and_store_image
from app.services.cv_service import analyze_property_images
from app.services.recommendation_service import generate_recommendations
from app.services.report_service import generate_prelisting_report

logger = logging.getLogger(__name__)
router = APIRouter()

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
        conn = psycopg2.connect(settings.DATABASE_URL)
        with conn:
            with conn.cursor() as cur:
                cur.execute("SELECT id FROM users WHERE email = %s;", (payload.email,))
                if cur.fetchone():
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Account with this email already exists."
                    )
                cur.execute(
                    "INSERT INTO users (email, password_hash, full_name, role) VALUES (%s, %s, %s, %s) RETURNING id, email, role;",
                    (payload.email, hashed_pw, payload.full_name, "homeowner")
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
        conn = psycopg2.connect(settings.DATABASE_URL)
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
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google sign-in token.",
        )

    google_sub = idinfo["sub"]
    email = idinfo["email"]
    full_name = idinfo.get("name") or email.split("@")[0]

    logger.info("Processing Google OAuth sign-in.")

    try:
        conn = psycopg2.connect(settings.DATABASE_URL)
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
                    if existing and existing[3] is None:
                        # A password-only account already owns this email. Do not silently
                        # link - an attacker could pre-register a victim's email/password
                        # and hijack the account when the victim later signs in with Google.
                        raise HTTPException(
                            status_code=status.HTTP_409_CONFLICT,
                            detail="An account with this email already exists. Please sign in with your password instead."
                        )
                    if existing:
                        user_row = (existing[0], existing[1], existing[2])
                    else:
                        cur.execute(
                            "INSERT INTO users (email, password_hash, full_name, role, oauth_provider, oauth_id) "
                            "VALUES (%s, NULL, %s, %s, 'google', %s) RETURNING id, email, role;",
                            (email, full_name, "homeowner", google_sub)
                        )
                        user_row = cur.fetchone()
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


def run_analysis_pipeline_bg(analysis_id: str, s3_keys: List[str], base64_images: List[str], budget: float, style: str):
    logger.info(f"Background analysis task starting for analysis: {analysis_id}")
    try:
        # Trigger Gemini or Fallback CV analysis
        res = analyze_property_images(analysis_id, s3_keys, base64_images)
        cv_summary = res.get("cv_summary", {})

        # Trigger ROI recommendation calculations - persists recommendations rows itself
        recs = generate_recommendations(analysis_id, cv_summary, budget, style)

        conn = psycopg2.connect(settings.DATABASE_URL)
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

        conn = psycopg2.connect(settings.DATABASE_URL)
        try:
            with conn:
                with conn.cursor() as cur:
                    cur.execute(
                        "UPDATE analyses SET status = 'completed', cv_summary = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s::uuid;",
                        (psycopg2.extras.Json(cv_summary), analysis_id)
                    )
        finally:
            conn.close()

        logger.info(f"Background analysis task completed successfully for analysis: {analysis_id}")
    except Exception as e:
        logger.error(f"Background analysis task failed: {e}")
        try:
            conn = psycopg2.connect(settings.DATABASE_URL)
            try:
                with conn:
                    with conn.cursor() as cur:
                        cur.execute(
                            "UPDATE analyses SET status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE id = %s::uuid;",
                            (analysis_id,)
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
        conn = psycopg2.connect(settings.DATABASE_URL)
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO properties (user_id, address, mls_id, budget_ceiling, style_preference) "
                    "VALUES (%s::uuid, %s, %s, %s, %s) RETURNING id;",
                    (
                        user_id,
                        payload.metadata.address,
                        payload.metadata.mls_id,
                        payload.metadata.user_budget,
                        payload.metadata.style_preference,
                    )
                )
                property_id = cur.fetchone()[0]

                cur.execute(
                    "INSERT INTO analyses (property_id, status) VALUES (%s, 'processing') RETURNING id;",
                    (property_id,)
                )
                analysis_id = str(cur.fetchone()[0])
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
        conn = psycopg2.connect(settings.DATABASE_URL)
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
        results.append(AnalysisSummaryResponse(
            id=str(analysis_id),
            address=address,
            date=created_at.strftime("%b %d, %Y"),
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
        conn = psycopg2.connect(settings.DATABASE_URL)
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM analyses a USING properties p "
                    "WHERE a.property_id = p.id AND a.id = %s::uuid AND p.user_id = %s::uuid "
                    "RETURNING a.id;",
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
        conn = psycopg2.connect(settings.DATABASE_URL)
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT a.status, a.cv_summary FROM analyses a "
                    "JOIN properties p ON a.property_id = p.id "
                    "WHERE a.id = %s::uuid AND p.user_id = %s::uuid;",
                    (analysis_id, user_id)
                )
                analysis_row = cur.fetchone()
                if not analysis_row:
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found.")

                analysis_status, cv_summary = analysis_row

                if analysis_status == "failed":
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Analysis pipeline execution failed."
                    )

                cur.execute(
                    "SELECT id, category, estimated_cost, projected_value_increase, roi_percentage, "
                    "timeline, explanation, why_details, scope FROM recommendations "
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

    recommendations = [
        {
            "upgrade_id": str(r[0]),
            "category": r[1],
            "estimated_cost": float(r[2]),
            "projected_value_increase": float(r[3]),
            "roi_percentage": float(r[4]),
            "timeline": r[5],
            "explanation": r[6],
            "why_details": r[7],
            "scope": r[8],
        }
        for r in rec_rows
    ]

    report_url = f"/api/v1/reports/{report_row[0]}/download" if report_row else None

    return AnalysisResultResponse(
        status=analysis_status,
        cv_results=cv_summary or {},
        recommendations=recommendations,
        report_url=report_url,
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
        conn = psycopg2.connect(settings.DATABASE_URL)
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT r.id, r.category, r.estimated_cost, r.projected_value_increase, r.roi_percentage, "
                    "r.timeline, r.explanation, r.why_details, r.scope "
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

    recommendations = [
        {
            "upgrade_id": str(r[0]),
            "category": r[1],
            "estimated_cost": float(r[2]),
            "projected_value_increase": float(r[3]),
            "roi_percentage": float(r[4]),
            "timeline": r[5],
            "explanation": r[6],
            "why_details": r[7],
            "scope": r[8],
        }
        for r in rows
    ]
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
        conn = psycopg2.connect(settings.DATABASE_URL)
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
        conn = psycopg2.connect(settings.DATABASE_URL)
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM reports rp USING analyses a, properties p "
                    "WHERE rp.analysis_id = a.id AND a.property_id = p.id "
                    "AND rp.id = %s::uuid AND p.user_id = %s::uuid "
                    "RETURNING rp.id;",
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
        conn = psycopg2.connect(settings.DATABASE_URL)
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

@router.get("/contractors")
async def list_contractors(request: Request) -> Any:
    """
    Public contractor directory listing - no auth required.
    """
    client_host = request.client.host if request.client else "unknown"
    rate_limiter.check_limit(f"contractors_list:{client_host}")

    try:
        conn = psycopg2.connect(settings.DATABASE_URL)
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
            "specialties": specialties,
            "avgCost": float(avg_cost) if avg_cost is not None else None,
            "avgTimeline": avg_timeline,
            "availability": availability,
            "snippet": snippet,
            "bio": bio,
            "pricingInfo": pricing_info,
            "reviews": reviews,
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
        conn = psycopg2.connect(settings.DATABASE_URL)
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

                cur.execute(
                    "INSERT INTO lead_requests (recommendation_id, contractor_id, user_id, attribution_token) "
                    "VALUES (%s, %s, %s::uuid, %s);",
                    (payload.recommendation_id, payload.contractor_id, user_id, attribution_token)
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
