"""
MLS (Multiple Listing Service) Data & Photo Ingestion Service

Supports:
1. RESO Web API (OData v4 standard for Bright MLS, CRMLS, Stellar MLS, etc.).
2. SimplyRETS / MLS Grid API REST adapters.
3. Development / Sandbox Provider for testing listing photo auto-ingestion.
"""

import os
import io
import json
import ssl
import logging
import base64
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional
from PIL import Image

logger = logging.getLogger(__name__)


class MLSClient:
    """Unified client for RESO Web API and MLS Data Aggregators."""

    def __init__(self):
        self.provider = os.getenv("MLS_PROVIDER", "sandbox").lower()
        self.api_url = os.getenv("MLS_API_URL", "https://api.simplyrets.com/properties")
        self.api_key = os.getenv("MLS_API_KEY", "")
        self.api_secret = os.getenv("MLS_API_SECRET", "")

    def fetch_listing_by_mls_id(self, mls_id: str) -> Dict[str, Any]:
        """
        Fetch property details and high-resolution photo URLs from MLS feed.
        """
        logger.info(f"[MLS Integration] Fetching listing details for MLS ID: {mls_id} via provider '{self.provider}'")

        if self.provider == "simplyrets" and self.api_key:
            return self._fetch_simplyrets(mls_id)
        elif self.provider == "reso_web_api" and self.api_key:
            return self._fetch_reso_web_api(mls_id)
        else:
            return self._fetch_sandbox_listing(mls_id)

    def _fetch_reso_web_api(self, mls_id: str) -> Dict[str, Any]:
        """Fetch via standard RESO Web API OData endpoint."""
        url = f"{self.api_url}/Property?$filter=ListingId eq '{mls_id}'&$expand=Media"
        req = urllib.request.Request(
            url,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Accept": "application/json",
            }
        )
        try:
            ctx = ssl._create_unverified_context()
            with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                value = data.get("value", [])
                if value:
                    prop = value[0]
                    media_items = prop.get("Media", [])
                    photo_urls = [m.get("MediaURL") for m in media_items if m.get("MediaURL") and m.get("MediaCategory") == "Photo"]
                    return {
                        "mls_id": mls_id,
                        "address": f"{prop.get('UnparsedAddress', 'MLS Property')}, {prop.get('City', '')} {prop.get('StateOrProvince', '')}",
                        "list_price": float(prop.get("ListPrice", 0)),
                        "bedrooms": int(prop.get("BedroomsTotal", 3)),
                        "bathrooms": float(prop.get("BathroomsTotalInteger", 2)),
                        "photo_urls": photo_urls or [m.get("MediaURL") for m in media_items if m.get("MediaURL")]
                    }
        except Exception as e:
            logger.warning(f"RESO Web API fetch failed ({e}). Falling back to sandbox listing provider.")
        return self._fetch_sandbox_listing(mls_id)

    def _fetch_simplyrets(self, mls_id: str) -> Dict[str, Any]:
        """Fetch via SimplyRETS API."""
        url = f"{self.api_url}/{mls_id}"
        auth_str = base64.b64encode(f"{self.api_key}:{self.api_secret}".encode("utf-8")).decode("utf-8")
        req = urllib.request.Request(
            url,
            headers={
                "Authorization": f"Basic {auth_str}",
                "Accept": "application/json",
            }
        )
        try:
            ctx = ssl._create_unverified_context()
            with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
                prop = json.loads(resp.read().decode("utf-8"))
                photos = prop.get("photos", [])
                addr = prop.get("address", {})
                return {
                    "mls_id": mls_id,
                    "address": f"{addr.get('full', 'MLS Property')}",
                    "list_price": float(prop.get("listPrice", 0)),
                    "bedrooms": int(prop.get("property", {}).get("bedrooms", 3)),
                    "bathrooms": float(prop.get("property", {}).get("bathsFull", 2)),
                    "photo_urls": photos
                }
        except Exception as e:
            logger.warning(f"SimplyRETS API fetch failed ({e}). Falling back to sandbox listing provider.")
        return self._fetch_sandbox_listing(mls_id)

    def _fetch_sandbox_listing(self, mls_id: str) -> Dict[str, Any]:
        """Sandbox provider for demonstration & local development."""
        return {
            "mls_id": mls_id,
            "address": f"1042 Grandview Blvd (MLS #{mls_id})",
            "list_price": 685000.0,
            "bedrooms": 4,
            "bathrooms": 3.0,
            "photo_urls": [
                "https://images.unsplash.com/photo-1556911220-e15b29be8c8f",  # Kitchen
                "https://images.unsplash.com/photo-1584622650111-993a426fbf0a",  # Bathroom
                "https://images.unsplash.com/photo-1616594039964-ae9021a400a0",  # Bedroom
            ]
        }


def download_mls_photo_base64(photo_url: str) -> Optional[str]:
    """Download an external MLS photo URL and convert to JPEG base64 string."""
    try:
        ctx = ssl._create_unverified_context()
        req = urllib.request.Request(photo_url, headers={"User-Agent": "HomeReadyAI-MLSClient/1.0"})
        with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
            img_bytes = resp.read()
            img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=85)
            return f"data:image/jpeg;base64,{base64.b64encode(buf.getvalue()).decode('utf-8')}"
    except Exception as e:
        logger.warning(f"Failed to download MLS photo URL {photo_url}: {e}")
        return None
