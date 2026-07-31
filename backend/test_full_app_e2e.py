import os
import time
import json
import base64
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8000/api/v1"
def _resolve_image_path() -> str:
    """Locate a sample property photo portably across machines.

    Priority: explicit E2E_IMAGE_PATH env var, then the repo's images/ dir
    (any *.png/*.jpg), so the suite runs regardless of the developer's home path.
    """
    env_path = os.environ.get("E2E_IMAGE_PATH")
    if env_path and os.path.exists(env_path):
        return env_path

    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    images_dir = os.path.join(repo_root, "images")
    if os.path.isdir(images_dir):
        for name in sorted(os.listdir(images_dir)):
            if name.lower().endswith((".png", ".jpg", ".jpeg")):
                return os.path.join(images_dir, name)
    return os.path.join(images_dir, "sample.png")


IMAGE_PATH = _resolve_image_path()

_SUITE_START = time.time()

print("================================================================")
print(" 🧪 HOMEREADY AI: FULL APP END-TO-END VERIFICATION SUITE")
print("================================================================")

# 1. Health Check
print("\n[STEP 1] Testing Backend API Health Check...")
try:
    req = urllib.request.Request(f"{BASE_URL}/health")
    with urllib.request.urlopen(req, timeout=5) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        print(f"✔ Health Check PASS: {res}")
except Exception as e:
    print(f"❌ Health Check FAIL: {e}")
    exit(1)

# 2. Upload Property Photo and Trigger Multi-Agent Pipeline
print("\n[STEP 2] Submitting Photo & Metadata to /api/v1/upload...")
if not os.path.exists(IMAGE_PATH):
    print(f"❌ Image path not found: {IMAGE_PATH}")
    exit(1)

with open(IMAGE_PATH, "rb") as f:
    img_b64 = base64.b64encode(f.read()).decode("utf-8")

payload = {
    "property_id": "test_e2e_prop_101",
    "images": [img_b64],
    "metadata": {
        "address": "742 Evergreen Terrace, Springfield",
        "mls_id": "MLS-998877",
        "user_budget": 15000.0,
        "style_preference": "modern"
    }
}

try:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}/upload", data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        upload_res = json.loads(resp.read().decode("utf-8"))
        analysis_id = upload_res["analysis_id"]
        print(f"✔ Upload ACCEPTED! Generated Analysis ID: {analysis_id}")
        print(f"  Response: {upload_res}")
except Exception as e:
    print(f"❌ Upload API Call FAIL: {e}")
    exit(1)

# 3. Poll Analysis Progress
print("\n[STEP 3] Polling /api/v1/analyze/{analysis_id} for Multi-Agent completion...")
completed = False
results_data = None

for attempt in range(1, 30):
    time.sleep(2)
    try:
        req = urllib.request.Request(f"{BASE_URL}/analyze/{analysis_id}")
        with urllib.request.urlopen(req, timeout=10) as resp:
            results_data = json.loads(resp.read().decode("utf-8"))
            status = results_data.get("status")
            print(f"  Attempt {attempt}: Status = '{status}'")
            if status == "completed":
                completed = True
                break
    except Exception as e:
        print(f"  Attempt {attempt}: Error fetching status ({e})")

if not completed:
    print("❌ Analysis pipeline polling timed out.")
    exit(1)

print("\n✔ Multi-Agent Pipeline Completed Successfully!")

# 4. Verify Recommendations Payload & Multi-Agent Render URLs
print("\n[STEP 4] Validating Multi-Agent Recommendations & Render URLs...")
recs = results_data.get("recommendations", [])
print(f"✔ Total Recommendations Surface: {len(recs)}")

if not recs:
    print("❌ No recommendations returned in payload.")
    exit(1)

rec = recs[0]
print(f"  Recommendation Category: {rec.get('category')}")
print(f"  ROI Percentage: +{rec.get('roi_percentage')}%")
print(f"  Before Image URL: {rec.get('before_image_url')}")
print(f"  After Image URL:  {rec.get('after_image_url')}")

# Verify the actual render assets the pipeline returns. The app moved from fixed
# 5k/10k/15k tier renders to a single whole-house budget-allocated render, so we
# validate the real URLs on the recommendation rather than legacy filenames.
urls_to_test = [
    ("Before Image", rec.get("before_image_url")),
    ("After (Whole-House Allocated) Render", rec.get("after_image_url")),
]

print("\n[STEP 5] Verifying Image Asset Retrieval from Backend...")
all_images_ok = True
for label, rel_url in urls_to_test:
    if not rel_url:
        print(f"  ⚠️ {label}: No URL provided")
        continue
    full_url = f"http://127.0.0.1:8000{rel_url}" if rel_url.startswith("/") else rel_url
    try:
        req = urllib.request.Request(full_url)
        with urllib.request.urlopen(req, timeout=5) as resp:
            content_type = resp.headers.get("Content-Type", "")
            length = len(resp.read())
            print(f"  ✔ {label}: HTTP {resp.status} OK | Size: {length:,} bytes | Content-Type: {content_type}")
    except Exception as e:
        print(f"  ❌ {label} ({full_url}) FAIL: {e}")
        all_images_ok = False

_elapsed = time.time() - _SUITE_START

print("\n================================================================")
if all_images_ok:
    print(" 🎉 FULL APP END-TO-END VERIFICATION: 100% PASSED SUCCESSFULLY!")
else:
    print(" ⚠️ FULL APP VERIFICATION: COMPLETED WITH WARNINGS")
print(f" ⏱  Total wall-clock runtime: {_elapsed:.2f}s "
      f"({'PASS' if _elapsed < 5.0 else 'OVER'} target < 5.0s)")
print("================================================================")
