import os
import sys
import json

# Ensure app module can be imported
sys.path.insert(0, os.path.dirname(__file__))

from app.core.config import settings
from app.services.mls_service import MLSClient, download_mls_photo_base64


def test_simplyrets_sandbox():
    print("==================================================")
    print("Testing SimplyRETS MLS Sandbox Ingestion Pipeline")
    print("==================================================")
    print(f"MLS Provider   : {os.getenv('MLS_PROVIDER')}")
    print(f"MLS API Key    : {os.getenv('MLS_API_KEY')}")
    print(f"MLS API URL    : {os.getenv('MLS_API_URL')}")
    print("--------------------------------------------------")

    client = MLSClient()
    test_mls_ids = ["1005192", "1005221", "1005252", "1005193", "1005177"]


    for mls_id in test_mls_ids:
        print(f"\nFetching SimplyRETS listing for MLS ID: '{mls_id}'...")
        listing = client.fetch_listing_by_mls_id(mls_id)

        print(f"  • Address    : {listing.get('address')}")
        print(f"  • List Price : ${listing.get('list_price'):,.2f}")
        print(f"  • Bedrooms   : {listing.get('bedrooms')}")
        print(f"  • Bathrooms  : {listing.get('bathrooms')}")
        photos = listing.get("photo_urls", [])
        print(f"  • Photos     : {len(photos)} photos returned")

        if photos:
            print(f"  • Sample Photo URL: {photos[0]}")
            print("  • Downloading and converting sample photo to base64...")
            b64 = download_mls_photo_base64(photos[0])
            if b64:
                print(f"  [SUCCESS] Photo converted to base64 JPEG ({len(b64)} chars)")
            else:
                print("  [WARNING] Failed to download sample photo.")

    print("\n==================================================")
    print("SimplyRETS Sandbox Integration Test Complete!")
    print("==================================================")

if __name__ == "__main__":
    test_simplyrets_sandbox()
