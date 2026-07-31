import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token

client = TestClient(app)

@pytest.fixture
def auth_header():
    token = create_access_token(subject="user-cat1-test-uuid")
    return {"Authorization": f"Bearer {token}"}

def test_get_user_profile(auth_header):
    response = client.get("/api/v1/users/me", headers=auth_header)
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert "email" in data

def test_update_agency_branding(auth_header):
    response = client.put(
        "/api/v1/users/me/branding",
        headers=auth_header,
        json={
            "company_name": "Test Agency Realty",
            "branding_color": "#FF5733",
            "footer_text": "Prepared by Test Agency"
        }
    )
    assert response.status_code == 200
    cfg = response.json()["white_label_config"]
    assert cfg["company_name"] == "Test Agency Realty"
    assert cfg["branding_color"] == "#FF5733"

def test_create_and_list_properties(auth_header):
    # Create property
    create_res = client.post(
        "/api/v1/properties",
        headers=auth_header,
        json={
            "address": "789 Custom Way, Austin TX",
            "style_preference": "Modern",
            "budget_ceiling": 45000
        }
    )
    assert create_res.status_code == 201
    prop_data = create_res.json()
    assert prop_data["address"] == "789 Custom Way, Austin TX"
    prop_id = prop_data["id"]

    # List properties
    list_res = client.get("/api/v1/properties", headers=auth_header)
    assert list_res.status_code == 200
    props = list_res.json()
    assert any(p["id"] == prop_id for p in props)

    # Delete property
    del_res = client.delete(f"/api/v1/properties/{prop_id}", headers=auth_header)
    assert del_res.status_code == 200

def test_team_invite(auth_header):
    invite_res = client.post(
        "/api/v1/teams/invite",
        headers=auth_header,
        json={"email": "colleague@agency.com", "role": "Editor"}
    )
    assert invite_res.status_code == 201
    data = invite_res.json()
    assert data["email"] == "colleague@agency.com"
    assert data["role"] == "Editor"

    members_res = client.get("/api/v1/teams/members", headers=auth_header)
    assert members_res.status_code == 200
    members = members_res.json()
    assert any(m["email"] == "colleague@agency.com" for m in members)
