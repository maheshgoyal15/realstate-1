from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator

# Mandatory Secure Web Skills: Input Validation & Sanitization
# Strict allow-listing of expected types, lengths, and formats using Pydantic v2.

class PropertyMetadata(BaseModel):
    address: str = Field(..., min_length=5, max_length=500, description="Full property address")
    mls_id: Optional[str] = Field(None, max_length=100, description="Optional MLS ID")
    user_budget: float = Field(..., ge=0.0, le=10000000.0, description="User budget ceiling in USD")
    style_preference: str = Field(..., min_length=2, max_length=100, description="Architectural style preference")

    @field_validator("mls_id", mode="before")
    def clean_mls_id(cls, v: Any) -> Optional[str]:
        if not v or (isinstance(v, str) and v.strip() == ""):
            return None
        return str(v).strip()

    @field_validator("style_preference", mode="before")
    def clean_style(cls, v: Any) -> str:
        if not v or not isinstance(v, str) or not v.strip():
            return "traditional"
        allowed_styles = {"modern", "traditional", "contemporary", "farmhouse", "midcentury", "craftsman", "transitional"}
        val = v.strip().lower()
        if val not in allowed_styles:
            raise ValueError(f"Unsupported architectural style: {v}")
        return val

class UploadRequest(BaseModel):
    # Client-generated label only - the backend creates its own real
    # `properties` row and `analysis_id` per upload, it does not use this
    # value as a database key.
    property_id: str = Field(..., min_length=5, max_length=100)
    images: List[str] = Field(..., min_items=1, max_items=50, description="Base64 encoded image strings or multipart references")
    metadata: PropertyMetadata

class UploadResponse(BaseModel):
    analysis_id: str
    status: str
    estimated_completion_time: str

class RecommendationItem(BaseModel):
    upgrade_id: str
    category: str
    estimated_cost: float
    projected_value_increase: float
    roi_percentage: float
    timeline: str
    explanation: str
    why_details: str
    scope: List[Dict[str, Any]]
    before_image_url: Optional[str] = None
    after_image_url: Optional[str] = None
    tier_5k_url: Optional[str] = None
    tier_10k_url: Optional[str] = None
    tier_15k_url: Optional[str] = None
    options: Optional[List[Dict[str, Any]]] = None

class AnalysisResultResponse(BaseModel):
    status: str
    cv_results: Dict[str, Any]
    recommendations: List[RecommendationItem]
    report_url: Optional[str] = None

class QuoteRequestPayload(BaseModel):
    # Optional: the contractors directory supports general "contact this
    # contractor" requests not tied to a specific upgrade recommendation.
    recommendation_id: Optional[str] = Field(None, min_length=10, max_length=100)
    contractor_id: str = Field(..., min_length=10, max_length=100)
    user_notes: Optional[str] = Field(None, max_length=1000)

class AuthLoginRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=255, description="User email address")
    password: str = Field(..., min_length=8, max_length=128, description="User password")

class AuthSignupRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=255, description="User email address")
    password: str = Field(..., min_length=12, max_length=128, description="User password (minimum 12 chars for high security)")
    full_name: str = Field("Homeowner", min_length=1, max_length=255, description="User full name")

class AuthGoogleRequest(BaseModel):
    id_token: str = Field(..., min_length=20, max_length=4096, description="Google-issued OAuth ID token (JWT) to verify")

class AnalysisSummaryResponse(BaseModel):
    id: str
    address: str
    date: str
    status: str
    statusLabel: str
    roi: Optional[float] = None
    cost: float
    reportUrl: Optional[str] = None


class MLSImportRequest(BaseModel):
    mls_id: str = Field(..., min_length=2, max_length=100, description="MLS Listing ID")
    user_budget: float = Field(15000.0, ge=0.0, le=10000000.0, description="User budget ceiling in USD")
    style_preference: str = Field("Modern Farmhouse", min_length=2, max_length=100, description="Design style preference")


class MLSImportResponse(BaseModel):
    mls_id: str
    address: str
    list_price: float
    bedrooms: int
    bathrooms: float
    photos_imported_count: int
    analysis_id: str
    status: str


class InpaintRequest(BaseModel):
    source_image: str = Field(..., description="Base64 encoded source image string")
    zone: str = Field(..., min_length=2, max_length=50, description="Target room zone (accent_wall | window_drapes | lighting | cabinetry)")
    option_key: str = Field(..., min_length=2, max_length=100, description="Selective upgrade option key")
    style_preference: str = Field("Modern Farmhouse", max_length=100, description="Style preference")


class InpaintResponse(BaseModel):
    status: str
    inpaint_id: str
    inpainted_image_url: str
    mask_image_url: str
    zone: str
    option_title: str
    paint_code: Optional[str] = ""


# Category 1 Feature Payloads

class UserProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    current_password: Optional[str] = Field(None, min_length=8, max_length=128)
    new_password: Optional[str] = Field(None, min_length=12, max_length=128)

class AgencyBrandingUpdateRequest(BaseModel):
    company_name: Optional[str] = Field(None, max_length=255)
    branding_color: Optional[str] = Field(None, max_length=20)
    footer_text: Optional[str] = Field(None, max_length=500)

class NotificationSettingsUpdateRequest(BaseModel):
    analysis_complete_alerts: Optional[bool] = True
    new_report_requests: Optional[bool] = True

class PropertyCreatePayload(BaseModel):
    address: str = Field(..., min_length=5, max_length=500)
    mls_id: Optional[str] = Field(None, max_length=100)
    style_preference: Optional[str] = Field("Modern", max_length=100)
    budget_ceiling: Optional[float] = Field(0.0, ge=0.0)

class TeamInvitePayload(BaseModel):
    email: str = Field(..., min_length=5, max_length=255)
    role: str = Field("Viewer", min_length=2, max_length=50)

class ContractorReviewPayload(BaseModel):
    rating: float = Field(..., ge=1.0, le=5.0)
    review_text: str = Field(..., min_length=5, max_length=2000)


