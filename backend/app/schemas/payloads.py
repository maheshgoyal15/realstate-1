from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator

# Mandatory Secure Web Skills: Input Validation & Sanitization
# Strict allow-listing of expected types, lengths, and formats using Pydantic v2.

class PropertyMetadata(BaseModel):
    address: str = Field(..., min_length=5, max_length=500, description="Full property address")
    mls_id: Optional[str] = Field(None, min_length=2, max_length=100, description="Optional MLS ID")
    user_budget: float = Field(..., ge=0.0, le=10000000.0, description="User budget ceiling in USD")
    style_preference: str = Field(..., min_length=2, max_length=100, description="Architectural style preference")

    @field_validator("style_preference")
    def validate_style(cls, v: str) -> str:
        allowed_styles = {"modern", "traditional", "contemporary", "farmhouse", "midcentury", "craftsman", "transitional"}
        if v.lower() not in allowed_styles:
            raise ValueError(f"Style must be one of {allowed_styles}")
        return v.lower()

class UploadRequest(BaseModel):
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

class AnalysisResultResponse(BaseModel):
    status: str
    cv_results: Dict[str, Any]
    recommendations: List[RecommendationItem]
    report_url: Optional[str] = None

class QuoteRequestPayload(BaseModel):
    recommendation_id: str = Field(..., min_length=10, max_length=100)
    contractor_id: str = Field(..., min_length=10, max_length=100)
    user_notes: Optional[str] = Field(None, max_length=1000)

class AuthLoginRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=255, description="User email address")
    password: str = Field(..., min_length=8, max_length=128, description="User password")

class AuthSignupRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=255, description="User email address")
    password: str = Field(..., min_length=12, max_length=128, description="User password (minimum 12 chars for high security)")
    full_name: str = Field("Homeowner", min_length=1, max_length=255, description="User full name")

