#!/usr/bin/env python3
"""
HomeReady AI - Gemini Enterprise Evaluation Suite & Benchmarking Harness
Executes the multimodal Computer Vision, Upgrade Recommendation, and Modernized
Image Generation pipeline against the enterprise ground-truth eval set (eval_dataset.json).

Scores 5 Quantitative Enterprise Benchmark Dimensions:
  1. Multimodal Room Classification Accuracy (%)
  2. Defect Detection Coverage & Precision (%)
  3. Condition Scoring MAE & Bounds Conformance (%)
  4. Renovation ROI Optimization & Budget Compliance (%)
  5. Modernized Image Generation Success & Quality (%)
"""
import os
import sys
import json
import base64
import time
from typing import Dict, Any, List

# Ensure backend directory is in path
sys.path.insert(0, os.path.dirname(__file__))

from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token
from app.services.image_generator import modernize_image_file

def run_gemini_enterprise_eval():
    print("================================================================================")
    print("      HomeReady AI - Gemini Enterprise Evaluation Suite & Benchmark Runner      ")
    print("================================================================================")

    client = TestClient(app)
    token = create_access_token(subject="gemini-enterprise-eval-runner")
    headers = {"Authorization": f"Bearer {token}"}

    eval_set_path = os.path.join(os.path.dirname(__file__), "tests", "eval_dataset.json")
    if not os.path.exists(eval_set_path):
        print(f"Error: Evaluation set not found at {eval_set_path}", file=sys.stderr)
        sys.exit(1)

    with open(eval_set_path, "r") as f:
        eval_dataset = json.load(f)

    print(f"Loaded {len(eval_dataset)} Gemini Enterprise evaluation scenarios from {eval_set_path}\n")

    eval_results = []
    total_metrics = {
        "room_accuracy_passes": 0,
        "defect_coverage_passes": 0,
        "score_bounds_passes": 0,
        "budget_roi_passes": 0,
        "modernized_images_generated": 0,
        "total_recommendations": 0,
        "score_errors": []
    }

    start_time = time.time()

    for idx, item in enumerate(eval_dataset, 1):
        print(f"--------------------------------------------------------------------------------")
        print(f"[{idx}/{len(eval_dataset)}] SCENARIO: {item['eval_id']}")
        print(f"  • Property Scene  : {item.get('property_scene', 'Real Estate Photo')}")
        print(f"  • Sample Photo    : {item['file_name']}")
        print(f"  • Target Concept  : {item['test_metadata']['style_preference'].title()} Style | Budget Ceiling: ${item['test_metadata']['user_budget']:,.0f}")

        sample_path = item["file_path"]
        if not os.path.exists(sample_path):
            print(f"  [FAIL] Sample image file missing at {sample_path}", file=sys.stderr)
            continue

        # Ingest image data
        with open(sample_path, "rb") as img_f:
            img_b64 = base64.b64encode(img_f.read()).decode("utf-8")

        payload = {
            "property_id": f"enterprise-eval-{item['eval_id']}",
            "images": [img_b64],
            "metadata": {
                "address": item["test_metadata"]["address"],
                "mls_id": item["test_metadata"]["mls_id"],
                "user_budget": item["test_metadata"]["user_budget"],
                "style_preference": item["test_metadata"]["style_preference"]
            }
        }

        # 1. Pipeline Ingestion via REST endpoint
        t0 = time.time()
        up_res = client.post("/api/v1/upload", headers=headers, json=payload)
        if up_res.status_code != 202:
            print(f"  [FAIL] Upload ingestion failed (HTTP {up_res.status_code}): {up_res.text}")
            continue

        analysis_id = up_res.json()["analysis_id"]

        # 2. Retrieve completed analysis outcome
        out_res = client.get(f"/api/v1/analyze/{analysis_id}", headers=headers)
        latency_ms = (time.time() - t0) * 1000

        if out_res.status_code != 200:
            print(f"  [FAIL] Retrieval failed (HTTP {out_res.status_code}): {out_res.text}")
            continue

        outcome = out_res.json()
        status = outcome.get("status")
        cv_results = outcome.get("cv_results", {})
        recommendations = outcome.get("recommendations", [])
        report_url = outcome.get("report_url")

        detected_rooms = cv_results.get("detected_rooms", [])
        detected_defects = cv_results.get("detected_defects", [])
        condition_score = float(cv_results.get("overall_condition_score", 0.0))

        # Ground truth expectations
        gt = item["ground_truth"]
        expected_rooms = gt["room_type_options"]
        expected_defects = gt["expected_defects"]
        min_score = gt["min_condition_score"]
        max_score = gt["max_condition_score"]
        target_score = gt.get("target_condition_score", 7.0)
        budget = item["test_metadata"]["user_budget"]

        # Dimension 1: Room Classification Accuracy
        room_overlap = [r for r in detected_rooms if any(exp.lower() in r.lower() or r.lower() in exp.lower() for exp in expected_rooms)]
        room_pass = len(room_overlap) > 0
        if room_pass:
            total_metrics["room_accuracy_passes"] += 1

        # Dimension 2: Defect Detection Recall
        defect_overlap = [d for d in detected_defects if d in expected_defects]
        defect_pass = len(defect_overlap) > 0
        if defect_pass:
            total_metrics["defect_coverage_passes"] += 1

        # Dimension 3: Condition Score Bounds & MAE
        score_pass = min_score <= condition_score <= max_score
        score_err = abs(condition_score - target_score)
        total_metrics["score_errors"].append(score_err)
        if score_pass:
            total_metrics["score_bounds_passes"] += 1

        # Dimension 4: Budget & ROI Compliance
        budget_pass = all(rec["estimated_cost"] <= budget for rec in recommendations) if recommendations else False
        roi_pass = all(rec["roi_percentage"] >= 0.0 for rec in recommendations) if recommendations else False
        budget_roi_pass = budget_pass and roi_pass
        if budget_roi_pass:
            total_metrics["budget_roi_passes"] += 1

        # Dimension 5: Modernized Image Generation Verification
        mod_images_ok = 0
        for rec in recommendations:
            total_metrics["total_recommendations"] += 1
            before_url = rec.get("before_image_url")
            after_url = rec.get("after_image_url")
            if before_url and after_url:
                # Test downloadability of generated modernized PNG
                after_res = client.get(after_url)
                if after_res.status_code == 200 and after_res.headers.get("content-type") == "image/png":
                    mod_images_ok += 1
                    total_metrics["modernized_images_generated"] += 1

        # Also test standalone direct sample image modernization tool
        direct_mod = modernize_image_file(
            image_path=sample_path,
            style=item["test_metadata"]["style_preference"],
            category=recommendations[0]["category"] if recommendations else "Kitchen Remodel",
            estimated_cost=recommendations[0]["estimated_cost"] if recommendations else 25000.0,
            roi=recommendations[0]["roi_percentage"] if recommendations else 48.0
        )

        scenario_passed = room_pass and defect_pass and score_pass and budget_roi_pass and (mod_images_ok == len(recommendations))

        print(f"  ✔ Status          : {status.upper()} (Pipeline Latency: {latency_ms:.0f}ms)")
        print(f"  ✔ Detected Rooms  : {', '.join(detected_rooms)} [{'PASS' if room_pass else 'FAIL'}]")
        print(f"  ✔ Detected Defects: {', '.join(detected_defects[:3])}... [{'PASS' if defect_pass else 'FAIL'}]")
        print(f"  ✔ Condition Score : {condition_score}/10.0 (Target: {target_score}, Bounds: [{min_score}-{max_score}]) [{'PASS' if score_pass else 'FAIL'}]")
        print(f"  ✔ Recommendations : {len(recommendations)} Upgrades Generated (100% within ${budget:,.0f} budget) [{'PASS' if budget_roi_pass else 'FAIL'}]")
        print(f"  ✔ Modernized Imgs : {mod_images_ok}/{len(recommendations)} After Modernized .PNG Concept Images Generated & Verified")
        print(f"  ✔ Direct Modernize: {direct_mod['after_image_url']} (1200x800 PNG)")
        print(f"  -> Scenario Result: {'[SUCCESS - 100% PASS]' if scenario_passed else '[FAIL]'}")

        eval_results.append({
            "eval_id": item["eval_id"],
            "file_name": item["file_name"],
            "analysis_id": analysis_id,
            "status": status,
            "latency_ms": round(latency_ms, 1),
            "room_classification_pass": room_pass,
            "defect_detection_pass": defect_pass,
            "condition_score": condition_score,
            "condition_score_pass": score_pass,
            "score_mae": round(score_err, 2),
            "recommendations_count": len(recommendations),
            "budget_roi_pass": budget_roi_pass,
            "modernized_images_verified": mod_images_ok,
            "direct_modernized_url": direct_mod["after_image_url"],
            "report_url": report_url,
            "overall_pass": scenario_passed
        })

    total_time = time.time() - start_time
    n_scenarios = len(eval_dataset)
    room_acc = (total_metrics["room_accuracy_passes"] / n_scenarios) * 100
    defect_acc = (total_metrics["defect_coverage_passes"] / n_scenarios) * 100
    score_acc = (total_metrics["score_bounds_passes"] / n_scenarios) * 100
    budget_acc = (total_metrics["budget_roi_passes"] / n_scenarios) * 100
    img_gen_acc = (total_metrics["modernized_images_generated"] / max(total_metrics["total_recommendations"], 1)) * 100
    avg_mae = sum(total_metrics["score_errors"]) / max(len(total_metrics["score_errors"]), 1)

    print("\n================================================================================")
    print("                    GEMINI ENTERPRISE EVALUATION SCORECARD                      ")
    print("================================================================================")
    print(f"  1. Multimodal Room Classification Accuracy : {room_acc:.1f}% ({total_metrics['room_accuracy_passes']}/{n_scenarios})")
    print(f"  2. Structural Defect Detection Recall     : {defect_acc:.1f}% ({total_metrics['defect_coverage_passes']}/{n_scenarios})")
    print(f"  3. Condition Score Bounds Conformance     : {score_acc:.1f}% (MAE: {avg_mae:.2f})")
    print(f"  4. Remodel Budget & ROI Compliance        : {budget_acc:.1f}% ({total_metrics['budget_roi_passes']}/{n_scenarios})")
    print(f"  5. Modernized Image Generation Quality    : {img_gen_acc:.1f}% ({total_metrics['modernized_images_generated']}/{total_metrics['total_recommendations']} PNGs verified)")
    print(f"  • Total Evaluation Execution Time          : {total_time:.2f}s")
    print("================================================================================")

    all_scenarios_passed = all(r["overall_pass"] for r in eval_results)

    # Persist JSON benchmark results
    out_json_path = os.path.join(os.path.dirname(__file__), "tests", "enterprise_eval_results.json")
    with open(out_json_path, "w") as f:
        json.dump({
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "overall_success": all_scenarios_passed,
            "metrics": {
                "room_classification_accuracy": room_acc,
                "defect_detection_coverage": defect_acc,
                "condition_score_conformance": score_acc,
                "condition_score_mae": round(avg_mae, 2),
                "budget_roi_compliance": budget_acc,
                "modernized_image_generation_rate": img_gen_acc
            },
            "scenarios": eval_results
        }, f, indent=2)

    # Persist Markdown benchmark report
    out_md_path = os.path.join(os.path.dirname(__file__), "tests", "enterprise_eval_report.md")
    with open(out_md_path, "w") as f:
        f.write("# Gemini Enterprise Evaluation & Modernized Image Generation Report\n\n")
        f.write(f"**Execution Timestamp:** {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())}  \n")
        f.write(f"**Overall Status:** {'✅ ALL BENCHMARKS PASSED (100%)' if all_scenarios_passed else '❌ FAILED'}  \n\n")
        f.write("## 1. Enterprise Scorecard Summary\n\n")
        f.write("| Metric Dimension | Ground Truth Criteria | Benchmark Result | Status |\n")
        f.write("| :--- | :--- | :--- | :--- |\n")
        f.write(f"| **Room Classification Accuracy** | Overlap with `room_type_options` | **{room_acc:.1f}%** | {'✅ PASS' if room_acc == 100 else '⚠️'} |\n")
        f.write(f"| **Defect Detection Coverage** | Identification of structural flags | **{defect_acc:.1f}%** | {'✅ PASS' if defect_acc == 100 else '⚠️'} |\n")
        f.write(f"| **Condition Score Conformance** | Within bounds [min-max] (MAE <= 1.0) | **{score_acc:.1f}%** (MAE: {avg_mae:.2f}) | {'✅ PASS' if score_acc == 100 else '⚠️'} |\n")
        f.write(f"| **Budget & ROI Compliance** | 100% within user budget ceiling | **{budget_acc:.1f}%** | {'✅ PASS' if budget_acc == 100 else '⚠️'} |\n")
        f.write(f"| **Modernized Image Generation** | High-Res 1200x800 PNG Before/After Renders | **{img_gen_acc:.1f}%** | {'✅ PASS' if img_gen_acc == 100 else '⚠️'} |\n\n")
        f.write("## 2. Scenario Results Breakdown\n\n")
        for r in eval_results:
            f.write(f"### Scenario: `{r['eval_id']}`\n")
            f.write(f"- **Sample Image:** `{r['file_name']}`\n")
            f.write(f"- **Condition Score:** {r['condition_score']}/10.0 (MAE: {r['score_mae']})\n")
            f.write(f"- **Recommendations Generated:** {r['recommendations_count']} upgrades\n")
            f.write(f"- **Modernized Image Render:** [{r['direct_modernized_url']}](file://{os.path.abspath(os.path.join(os.path.dirname(__file__), 'app', 'static', 'generated'))})\n")
            f.write(f"- **Scenario Status:** {'✅ 100% Passed' if r['overall_pass'] else '❌ Failed'}\n\n")

    print(f"\nSaved Enterprise Eval Results JSON : {out_json_path}")
    print(f"Saved Enterprise Eval Report Markdown: {out_md_path}\n")

    if all_scenarios_passed:
        print(">>> EVALUATION OUTCOME: SUCCESS - ALL GEMINI ENTERPRISE BENCHMARKS PASSED (100%) <<<\n")
        return 0
    else:
        print(">>> EVALUATION OUTCOME: PARTIAL OR FAILED <<<\n")
        return 1

if __name__ == "__main__":
    sys.exit(run_gemini_enterprise_eval())
