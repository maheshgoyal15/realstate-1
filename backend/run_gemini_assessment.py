#!/usr/bin/env python3
import os
import sys
import json
import base64
import urllib.request
import urllib.error

def run_gemini_scan(image_path: str, api_key: str):
    print(f"Reading image file: {image_path}...")
    if not os.path.exists(image_path):
        print(f"Error: File not found at {image_path}", file=sys.stderr)
        return None

    # Load image data as base64
    with open(image_path, "rb") as image_file:
        img_bytes = image_file.read()
        base64_data = base64.b64encode(img_bytes).decode("utf-8")

    prompt = """
    Analyze this real estate property photo as a professional appraiser and structural inspector.
    Identify:
    1. The type of room or area displayed (e.g., Kitchen, Bathroom, Living Room, Bedroom, Exterior Front, Landscaping).
    2. Specific defect flags or outdated features (e.g., outdated_kitchen_cabinets, worn_hardwood_floors, old_shingle_roof, laminate_countertops, overgrown_landscaping, cracked_walls).
    3. An overall condition score from 1.0 to 10.0 based on structural condition and material finish quality.
    
    Return the response strictly as a JSON object matching this schema:
    {
      "room_type": "Kitchen",
      "detected_defects": ["outdated_kitchen_cabinets", "laminate_countertops"],
      "overall_condition_score": 6.8
    }
    Do not include any markdown code blocks (such as ```json) or additional explanation outside the JSON object.
    """

    print("Building API payload...")
    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "inline_data": {
                            "mime_type": "image/jpeg",
                            "data": base64_data
                        }
                    },
                    {
                        "text": prompt
                    }
                ]
            }
        ]
    }

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )

    print("Initializing connection to Google Generative Language Gateway API...")
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            response_text = res_data["candidates"][0]["content"]["parts"][0]["text"].strip()
            
            # Clean response text
            if response_text.startswith("```json"):
                response_text = response_text[7:-3].strip()
            elif response_text.startswith("```"):
                response_text = response_text[3:-3].strip()
                
            return json.loads(response_text)
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.read().decode('utf-8')}", file=sys.stderr)
        return None
    except Exception as e:
        print(f"API Request failed: {e}", file=sys.stderr)
        return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 run_gemini_assessment.py <path_to_image_file> [gemini_api_key]")
        sys.exit(1)

    image_path = sys.argv[1]
    
    # Resolve API Key
    api_key = os.getenv("GEMINI_API_KEY")
    if len(sys.argv) >= 3:
        api_key = sys.argv[2]
        
    if not api_key:
        print("Error: No Gemini API Key specified.", file=sys.stderr)
        print("Please set the GEMINI_API_KEY environment variable or pass it as the second argument.", file=sys.stderr)
        print("Example: python3 run_gemini_assessment.py house.jpg AIzaSy...", file=sys.stderr)
        sys.exit(1)

    result = run_gemini_scan(image_path, api_key)
    if result:
        print("\n=== AI Computer Vision Assessment Results ===")
        print(json.dumps(result, indent=2))
        print("=============================================")
    else:
        print("\nScan failed. Please verify your API key and network connection.")
