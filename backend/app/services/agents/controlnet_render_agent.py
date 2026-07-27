"""
ControlNet Spatial Diffusion Render Sub-Agent

Responsible for:
1. Generating genuine spatial image-to-image concept renders anchored to original photos.
2. Saving renders into the static directory with instant REST accessibility.
"""

import os
import io
import json
import ssl
import logging
import base64
import urllib.request
from typing import Optional
from PIL import Image

logger = logging.getLogger(__name__)

GENERATED_IMAGES_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "static", "generated"
)
os.makedirs(GENERATED_IMAGES_DIR, exist_ok=True)


def _generate_render_for_prompt(
    source_img: Image.Image,
    source_b64: str,
    prompt_text: str,
    rec_id: str,
    tier_name: str,
    cost: float,
    room_type: str = "Kitchen",
) -> Optional[str]:
    """Generate genuine image-to-image upgrade of the SOURCE photo via the AI image
    model."""
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        logger.info(
            f"No GEMINI_API_KEY configured; skipping AI render for {room_type}."
        )
        return None

    model = os.getenv("GEMINI_IMAGE_MODEL", "gemini-3.1-flash-image")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"

    filename = f"{rec_id}_{tier_name}.png"
    filepath = os.path.join(GENERATED_IMAGES_DIR, filename)

    payload = {
        "contents": [
            {
                "parts": [
                    {"inline_data": {"mime_type": "image/jpeg", "data": source_b64}},
                    {"text": prompt_text},
                ]
            }
        ]
    }

    try:
        ctx = ssl._create_unverified_context()
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, context=ctx, timeout=60) as resp:
            res_data = json.loads(resp.read().decode("utf-8"))
            candidates = res_data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                for p in parts:
                    inline = p.get("inline_data") or p.get("inlineData")
                    if inline and inline.get("data"):
                        img_bytes = base64.b64decode(inline["data"])
                        out_img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
                        out_img.save(filepath, quality=95)
                        logger.info(
                            f"Saved genuine image-to-image render for {room_type}: {filename}"
                        )
                        return f"/api/v1/images/{filename}"
    except Exception as e:
        logger.warning(
            f"Image-to-image generation failed for {room_type} ({e})."
        )
    return None
