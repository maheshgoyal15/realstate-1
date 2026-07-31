"""
Vision & Geometry Perception Sub-Agent

Responsible for:
1. Extracting high-contrast Canny luminance edge wireframes for ControlNet geometry locking.
2. Interfacing with Google Gemini VLM to analyze structural condition, detected rooms,
   furniture/built-in inventory, and water plumbing presence.
"""

import os
import json
import ssl
import logging
import urllib.request
from typing import Optional
from PIL import Image, ImageFilter, ImageOps

logger = logging.getLogger(__name__)


def generate_canny_wireframe(source_img: Image.Image, output_path: str) -> str:
    """Generate high-contrast structural boundary wireframe preserving windows, sloped
    ceilings, walls, and doorways."""
    gray = ImageOps.grayscale(source_img)
    edges = gray.filter(ImageFilter.FIND_EDGES)
    inverted = ImageOps.invert(edges)
    contrast = ImageOps.autocontrast(inverted, cutoff=2)
    contrast.save(output_path, quality=92)
    return output_path


def _get_gemini_api_key() -> str:
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        env_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
            ".env",
        )
        if os.path.exists(env_path):
            with open(env_path, "r") as f:
                for line in f:
                    if line.startswith("GEMINI_API_KEY="):
                        key = line.strip().split("=", 1)[1]
    return key or "dummy_key"


def _call_gemini_vlm(prompt_text: str, image_b64: Optional[str] = None) -> str:
    """Send multimodal image analysis or text request to Google Gemini VLM."""
    key = _get_gemini_api_key()
    ctx = ssl._create_unverified_context()
    model = os.getenv("GEMINI_VLM_MODEL", os.getenv("GEMINI_IMAGE_MODEL", "gemini-3.5-flash-lite"))
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"

    parts = []
    if image_b64:
        parts.append({"inline_data": {"mime_type": "image/jpeg", "data": image_b64}})
    parts.append({"text": prompt_text})

    payload = {"contents": [{"parts": parts}]}
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )

    try:
        with urllib.request.urlopen(req, context=ctx, timeout=60) as resp:
            res = json.loads(resp.read().decode("utf-8"))
            candidates = res.get("candidates", [])
            if candidates:
                parts_out = candidates[0].get("content", {}).get("parts", [])
                for p in parts_out:
                    if "text" in p:
                        text = p["text"].strip()
                        if text.startswith("```json"):
                            text = text[7:-3].strip()
                        elif text.startswith("```"):
                            text = text[3:-3].strip()
                        return text
    except Exception as e:
        logger.warning(f"VLM API call failed ({e}). Returning fallback JSON.")
    return "{}"
