import os
import json
import base64
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token
from app.services.storage import ALLOWED_MAGIC_BYTES

client = TestClient(app)

EVAL_DATASET_PATH = os.path.join(os.path.dirname(__file__), "eval_dataset.json")

@pytest.fixture
def auth_header():
    token = create_access_token(subject="eval-user-uuid-888")
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def eval_dataset():
    with open(EVAL_DATASET_PATH, "r") as f:
        return json.load(f)

def test_eval_images_exist_and_magic_bytes(eval_dataset):
    """Ensure all evaluation set photos exist and have valid magic bytes signatures."""
    for item in eval_dataset:
        path = item["file_path"]
        assert os.path.exists(path), f"Evaluation image file not found: {path}"
        
        with open(path, "rb") as img_file:
            header = img_file.read(32)
            valid_magic = any(header.startswith(magic) for magic in ALLOWED_MAGIC_BYTES.keys()) or (b"ftypheic" in header or b"ftypheix" in header)
            assert valid_magic, f"Image {path} has invalid magic bytes signature."

def test_full_app_pipeline_against_eval_set(auth_header, eval_dataset):
    """
    Test the full application ingestion, CV analysis, upgrade recommendation,
    and report generation pipeline against every item in our evaluation set.
    """
    for item in eval_dataset:
        path = item["file_path"]
        with open(path, "rb") as f:
            b64_str = base64.b64encode(f.read()).decode("utf-8")
        
        payload = {
            "property_id": f"eval-prop-{item['eval_id']}",
            "images": [b64_str],
            "metadata": {
                "address": item["test_metadata"]["address"],
                "mls_id": item["test_metadata"]["mls_id"],
                "user_budget": item["test_metadata"]["user_budget"],
                "style_preference": item["test_metadata"]["style_preference"]
            }
        }
        
        # Step 1: Upload via /api/v1/upload
        upload_res = client.post("/api/v1/upload", headers=auth_header, json=payload)
        assert upload_res.status_code == 202, f"Upload failed for {item['eval_id']}: {upload_res.text}"
        res_data = upload_res.json()
        assert "analysis_id" in res_data
        analysis_id = res_data["analysis_id"]
        
        # Step 2: Retrieve analysis outcome via /api/v1/analyze/{analysis_id}
        # Notice: Background tasks run in-process for TestClient requests
        analyze_res = client.get(f"/api/v1/analyze/{analysis_id}", headers=auth_header)
        assert analyze_res.status_code == 200, f"Analysis retrieval failed for {item['eval_id']}: {analyze_res.text}"
        outcome = analyze_res.json()
        
        # Step 3: Validate outcome structure and status
        assert outcome["status"] == "completed", f"Expected completed analysis status, got {outcome['status']}"
        assert "cv_results" in outcome
        assert "recommendations" in outcome
        
        cv_results = outcome["cv_results"]
        score = cv_results.get("overall_condition_score")
        assert score is not None and 1.0 <= float(score) <= 10.0, f"Condition score out of valid bounds: {score}"
        
        # Step 4: Validate generated upgrade recommendations
        recs = outcome["recommendations"]
        assert isinstance(recs, list) and len(recs) > 0, "No recommendations generated from evaluation scan"
        for rec in recs:
            assert rec["estimated_cost"] <= item["test_metadata"]["user_budget"], \
                f"Recommendation cost (${rec['estimated_cost']}) exceeded user budget ceiling (${item['test_metadata']['user_budget']})"
            assert rec["roi_percentage"] >= 0.0, "Invalid negative ROI percentage"
            assert item["test_metadata"]["style_preference"] in rec["explanation"].lower() or rec["explanation"], "Explanation template formatting missing"
            
            # Verify that new before/after remodel concept image files (.png) were generated and are downloadable
            assert rec.get("before_image_url") and rec["before_image_url"].startswith("/api/v1/images/"), "Missing before_image_url"
            assert rec.get("after_image_url") and rec["after_image_url"].startswith("/api/v1/images/"), "Missing after_image_url"
            
            img_res = client.get(rec["after_image_url"])
            assert img_res.status_code == 200, f"Failed to download generated after image: {rec['after_image_url']}"
            assert img_res.headers.get("content-type") == "image/png", f"Expected image/png, got {img_res.headers.get('content-type')}"
            
        # Step 5: Verify pre-listing PDF report generation URL
        assert outcome["report_url"] is not None and outcome["report_url"].startswith("/api/v1/reports/"), "Missing or invalid report URL"

def test_batch_multi_image_eval_analysis(auth_header, eval_dataset):
    """Test batch analysis of multiple photos submitted for a single property."""
    images_b64 = []
    for item in eval_dataset:
        with open(item["file_path"], "rb") as f:
            images_b64.append(base64.b64encode(f.read()).decode("utf-8"))
            
    payload = {
        "property_id": "eval-batch-all-photos",
        "images": images_b64,
        "metadata": {
            "address": "2030 Natchez Dr, Austin, TX 78704",
            "mls_id": "TX-ACTRIS-99999",
            "user_budget": 50000.0,
            "style_preference": "contemporary"
        }
    }
    
    upload_res = client.post("/api/v1/upload", headers=auth_header, json=payload)
    assert upload_res.status_code == 202
    analysis_id = upload_res.json()["analysis_id"]
    
    outcome_res = client.get(f"/api/v1/analyze/{analysis_id}", headers=auth_header)
    assert outcome_res.status_code == 200
    outcome = outcome_res.json()
    assert outcome["status"] == "completed"
    assert outcome["cv_results"].get("room_count", 0) >= 1
    assert len(outcome["recommendations"]) > 0

def test_modernized_image_creation_standalone_and_api(eval_dataset):
    """Test standalone image modernization function and /api/v1/modernize endpoint."""
    from app.services.image_generator import modernize_image_file
    
    for item in eval_dataset:
        sample_path = item["file_path"]
        mod_res = modernize_image_file(
            image_path=sample_path,
            style=item["test_metadata"]["style_preference"],
            category="Kitchen Remodel",
            estimated_cost=25000.0,
            roi=48.5
        )
        assert os.path.exists(mod_res["after_image_path"])
        assert mod_res["width"] == 1200 and mod_res["height"] == 800
        assert mod_res["format"] == "PNG"
        
        # Test API endpoint /api/v1/modernize
        api_res = client.post(
            "/api/v1/modernize",
            json={
                "image": item["file_name"],
                "style": item["test_metadata"]["style_preference"],
                "category": "Kitchen Remodel",
                "budget": 25000.0,
                "roi": 48.5
            }
        )
        assert api_res.status_code == 200
        data = api_res.json()
        assert data["success"] is True
        assert data["after_image_url"].startswith("/api/v1/images/")

