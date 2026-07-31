#!/usr/bin/env python3
"""
HomeReady AI - Automated Computer Vision & Upgrade Recommendation Evaluation Runner
Runs the Gemini Enterprise evaluation set (eval_dataset.json) against the application pipeline,
tests sample images, and verifies AI modernized image creation.
"""
import os
import sys

# Ensure backend directory is in path
sys.path.insert(0, os.path.dirname(__file__))

from run_gemini_enterprise_eval import run_gemini_enterprise_eval

if __name__ == "__main__":
    exit_code = run_gemini_enterprise_eval()
    sys.exit(exit_code)

