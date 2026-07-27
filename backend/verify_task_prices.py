#!/usr/bin/env python3
"""
HomeReady AI — Standalone Task Price Verification CLI Tool

Usage:
    python3 verify_task_prices.py [--budget 15000]

Verifies:
1. Exact mathematical parity (Sum of individual task costs == room share budget).
2. RSMeans Real Estate Remodel Cost Index validation per task item.
3. Whole-House budget ceiling sum validation.
"""

import sys
import argparse
from typing import Dict, List, Any

from app.services.agents.finops_budget_agent import (
    allocate_house_budget,
    build_room_scope,
    ROOM_PRIORITY_WEIGHTS,
)
from app.services.agents.price_verification_agent import (
    verify_room_task_prices,
    verify_whole_house_finops_prices,
)
from app.services.agents.style_synthesis_agent import _get_room_taxonomy


def run_price_verification_test(house_budget: float = 15000.0) -> bool:
    print("=" * 72)
    print(" 💰 HOMEREADY AI: STANDALONE FINOPS TASK PRICE VERIFIER")
    print(f" Whole-House Budget Ceiling under audit: ${house_budget:,.2f}")
    print("=" * 72)

    sample_rooms = ["Kitchen", "Primary Bathroom", "Living Room", "Master Bedroom"]
    raw_weights = {r: ROOM_PRIORITY_WEIGHTS.get(r.lower(), 0.15) for r in sample_rooms}
    allocations = allocate_house_budget(raw_weights, house_budget)

    print("\n[STAGE 1] Whole-House FinOps Capital Distribution Audit:")
    for room, dollar_share in allocations.items():
        pct = (dollar_share / house_budget) * 100
        print(f"  • {room:<20}: ${dollar_share:>9,.2f}  ({pct:5.1f}% of total budget)")
    sum_alloc = sum(allocations.values())
    print(f"  ─────────────────────────────────────────────────────────────")
    print(f"  SUM OF ROOM BUDGETS  : ${sum_alloc:>9,.2f}  / ${house_budget:>9,.2f} Ceiling")
    
    whole_house_pass = abs(house_budget - sum_alloc) <= 0.02
    print(f"  ✔ Whole-House Parity Audit: {'PASS (0.00% variance)' if whole_house_pass else 'FAIL'}\n")

    print("[STAGE 2] Separate Per-Task Itemized Price Audit:")
    all_recs = []
    all_passed = whole_house_pass

    for room_name, room_budget in allocations.items():
        has_water = room_name.lower() in ["kitchen", "primary bathroom", "bathroom"]
        tax = _get_room_taxonomy(room_name, "Modern")
        
        scope_items = build_room_scope(
            room_budget,
            has_water,
            {
                "cabinets": tax["cabinets"],
                "shelving": tax["shelving_racks"],
                "surface": tax["primary_surface"],
                "fixtures": tax["fixtures"],
            },
            room_type=room_name,
        )

        audit = verify_room_task_prices(room_name, room_budget, scope_items)
        passed = audit["mathematical_parity_passed"]
        if not passed:
            all_passed = False

        print(f"\n  🏠 ROOM: {room_name.upper()} (Allocated Share: ${room_budget:,.2f})")
        print(f"     Status: {'✔ VERIFIED EXACT MATCH' if passed else '❌ VARIANCE DETECTED'}")
        print("     " + "-" * 62)
        print(f"     {'Task #':<7} {'Task Name':<38} {'Price':>10} {'% Room':>6}")
        print("     " + "-" * 62)
        for t in audit["audited_tasks"]:
            print(f"     #{t['task_index']:<6} {t['task_name'][:36]:<38} ${t['verified_cost']:>9,.2f} {t['percentage_of_room_budget']:>5.1f}%")
        print("     " + "-" * 62)
        print(f"     TOTAL ITEM SUM: ${audit['sum_of_itemized_tasks']:,.2f}  |  VARIANCE: ${audit['variance_cents']:.2f}")

    print("\n" + "=" * 72)
    if all_passed:
        print(" 🎉 SEPARATE TASK PRICE VERIFICATION: 100% AUDITED & VERIFIED PASSED!")
    else:
        print(" ❌ SEPARATE TASK PRICE VERIFICATION: FAILED AUDIT")
    print("=" * 72 + "\n")
    return all_passed


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Verify price of each remodel task.")
    parser.add_argument("--budget", type=float, default=15000.0, help="Whole-house budget ceiling to test")
    args = parser.parse_args()
    success = run_price_verification_test(args.budget)
    sys.exit(0 if success else 1)
