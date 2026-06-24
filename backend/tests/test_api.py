import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token
from app.core.config import settings

client = TestClient(app)

# Mandatory Secure Web Skills: Testing Constraints
# Servers and database servers MUST listen on localhost or 127.0.0.1 when testing.
# Servers MUST NOT listen on 0.0.0.0.

@pytest.fixture
def auth_header():
    token = create_access_token(subject="user-test-uuid-001")
    return {"Authorization": f"Bearer {token}"}

def test_health_check():
    # Verify localhost binding setting in test environment
    assert settings.SERVER_HOST in ("127.0.0.1", "localhost")
    assert settings.SERVER_HOST != "0.0.0.0"
    
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_missing_auth_upload():
    # Attempt upload without JWT Bearer token
    response = client.post(
        "/api/v1/upload", 
        json={
            "property_id": "prop-001",
            "images": ["base64str..."],
            "metadata": {
                "address": "123 Oak St",
                "user_budget": 25000,
                "style_preference": "modern"
            }
        }
    )
    assert response.status_code == 401
    assert "missing or invalid authorization header" in response.json()["detail"].lower()

def test_upload_invalid_style(auth_header):
    # Attempt upload with unsupported style preference (Zod/Pydantic validation check)
    response = client.post(
        "/api/v1/upload", 
        headers=auth_header,
        json={
            "property_id": "prop-001",
            "images": ["base64str..."],
            "metadata": {
                "address": "123 Oak St",
                "user_budget": 25000,
                "style_preference": "unsupported_futuristic"
            }
        }
    )
    assert response.status_code == 422 # Pydantic validation error

def test_secure_headers():
    response = client.get("/api/v1/health")
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert "no-store" in response.headers.get("Cache-Control", "")
