#!/usr/bin/env python3
"""
HomeReady AI - Standalone Sample Image Modernizer & Visual Verification CLI Tool
Takes a sample real estate photo, applies AI surface modernization, and generates
high-resolution (1200x800 PNG) Before and After Modernized Concept images.
"""
import os
import sys
import json

# Ensure backend directory is in python path
sys.path.insert(0, os.path.dirname(__file__))

from app.services.image_generator import modernize_image_file

def main():
    print("=====================================================================")
    print("  HomeReady AI - Neural Image Modernizer & Visual Concept Generator  ")
    print("=====================================================================\n")

    # Default to sample kitchen photo if no argument provided
    default_img = os.path.join(os.path.dirname(os.path.dirname(__file__)), "images", "Screenshot 2026-07-17 at 5.46.46 PM.png")
    image_path = sys.argv[1] if len(sys.argv) > 1 else default_img
    style = sys.argv[2] if len(sys.argv) > 2 else "modern"
    category = sys.argv[3] if len(sys.argv) > 3 else "Kitchen Remodel"
    cost = float(sys.argv[4]) if len(sys.argv) > 4 else 25000.0
    roi = float(sys.argv[5]) if len(sys.argv) > 5 else 48.5

    if not os.path.exists(image_path):
        print(f"Error: Sample image not found at '{image_path}'", file=sys.stderr)
        print("Available sample images in images/ directory:")
        img_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "images")
        if os.path.exists(img_dir):
            for f in os.listdir(img_dir):
                if f.endswith((".png", ".jpg", ".jpeg")):
                    print(f"  - {os.path.join(img_dir, f)}")
        sys.exit(1)

    print(f"Input Sample Photo : {image_path}")
    print(f"Target Concept     : {category} ({style.title()} Concept)")
    print(f"Projected Metrics  : Cost ${cost:,.0f} | Estimated ROI +{roi:.1f}%\n")
    print("Processing AI architectural surface modernization...")

    try:
        result = modernize_image_file(
            image_path=image_path,
            style=style,
            category=category,
            estimated_cost=cost,
            roi=roi
        )

        before_path = result["before_image_path"]
        after_path = result["after_image_path"]

        before_size = os.path.getsize(before_path) if os.path.exists(before_path) else 0
        after_size = os.path.getsize(after_path) if os.path.exists(after_path) else 0

        print("\n=====================================================================")
        print("  MODERNIZED IMAGE CREATION SUCCESSFUL!                              ")
        print("=====================================================================")
        print(f"✔ Generated Before Image : {before_path} ({before_size:,} bytes)")
        print(f"✔ Generated After Image  : {after_path} ({after_size:,} bytes)")
        print(f"✔ Image Dimensions       : {result['width']}x{result['height']} ({result['format']})")
        print(f"✔ Web Access URLs        : Before: {result['before_image_url']}")
        print(f"                           After : {result['after_image_url']}")
        print("=====================================================================\n")

        print("JSON Output Metadata:")
        print(json.dumps({
            "status": "success",
            "rec_id": result["rec_id"],
            "style": result["style"],
            "category": result["category"],
            "before_image_url": result["before_image_url"],
            "after_image_url": result["after_image_url"],
            "dimensions": f"{result['width']}x{result['height']}",
            "before_file": before_path,
            "after_file": after_path,
        }, indent=2))

    except Exception as e:
        print(f"\n[FAIL] Image modernization failed: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
