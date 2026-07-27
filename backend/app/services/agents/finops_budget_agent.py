"""
Whole-House FinOps Budget Allocator Sub-Agent

Responsible for:
1. Distributing a single house-level capital ceiling ($15,000) across distinct room
   views by return-on-investment priority weight ratios.
2. Generating realistic, room-appropriate itemized upgrade manifests where cost items
   sum to each room's allocated share of the house budget ceiling.
"""

from typing import Dict, List, Any

ROOM_PRIORITY_WEIGHTS: Dict[str, float] = {
    "kitchen": 0.48,
    "bathroom": 0.26,
    "living room": 0.16,
    "bedroom": 0.10,
    "home office": 0.10,
    "laundry room": 0.08,
}

# Minimum whole-house budget share below which a room isn't worth a standalone
# renovation line item. Rooms under this are dropped and their budget flows to
# higher-ROI rooms.
MIN_VIABLE_ROOM_BUDGET = 2500.0


def allocate_house_budget(weights: Dict[str, float], total_budget: float) -> Dict[str, float]:
    """Distribute whole-house budget across rooms by ROI weight without leaving any
    room with an unrealistically small share. Any room below MIN_VIABLE_ROOM_BUDGET
    is dropped (lowest weight first) and its budget is redistributed to remaining rooms.
    Guarantees sum(result) == total_budget."""
    rooms = {r: w for r, w in weights.items() if w and w > 0}
    while rooms:
        sw = sum(rooms.values()) or 1.0
        alloc = {r: round((w / sw) * total_budget, 2) for r, w in rooms.items()}
        under = [r for r, a in alloc.items() if a < MIN_VIABLE_ROOM_BUDGET]
        if not under or len(rooms) == 1:
            return alloc
        drop = min(under, key=lambda r: rooms[r])
        rooms.pop(drop)
    return {}


def build_room_scope(
    room_budget: float,
    has_water: bool,
    specs: Dict[str, str],
    room_type: str = "Kitchen",
) -> List[Dict[str, Any]]:
    """Return itemized upgrades whose costs sum exactly to room_budget, choosing
    room-appropriate upgrades (e.g. feature walls for bedrooms vs stone countertops
    for kitchens)."""
    cab = specs.get("cabinets", "Custom cabinetry")
    shelv = specs.get("shelving", "Open shelving")
    surf = specs.get("surface", "Upgraded surfaces")
    fix = specs.get("fixtures", "Architectural lighting")
    fixture_detail = (
        "Upgraded sink, faucet and fixtures" if has_water else "New lighting and fixtures"
    )

    rk = room_type.lower()
    is_bedroom = "bed" in rk
    is_living = "living" in rk or "family" in rk or "den" in rk

    if is_bedroom:
        if room_budget >= 6000:
            items = [
                (
                    "Designer Architectural Feature Wall & Upholstered Panel",
                    0.38,
                    "Custom Slatted Wood / Shiplap accent wall behind bed",
                ),
                (
                    "Custom Built-in Closet Organizer & Storage Rack System",
                    0.30,
                    "Concealed internal closet organization system",
                ),
                (
                    "Hardwood Flooring & Plush Wool Area Rug",
                    0.18,
                    "Refreshed wide-plank flooring and luxury rug",
                ),
                (
                    "Architectural Dimmable LED Lighting & Fan",
                    0.14,
                    "Designer warm ceiling fixture and reading lamps",
                ),
            ]
        elif room_budget >= 3500:
            items = [
                (
                    "Tailored Accent Wall & Designer Paint Finish",
                    0.40,
                    "Fresh designer low-VOC paint and millwork trim",
                ),
                (
                    "Closet Storage Rack & Shelving Refresh",
                    0.28,
                    "Internal closet hanging racks and shoe organizers",
                ),
                (
                    "Plush Area Rug & Window Drapes",
                    0.18,
                    "Custom woven window treatments and wool rug",
                ),
                (
                    "Updated Bedside & Ceiling Light Fixtures",
                    0.14,
                    "Modern ambient light fixtures",
                ),
            ]
        else:
            items = [
                (
                    "Designer Neutral Wall Repaint & Trim Touch-up",
                    0.45,
                    "Professional architectural wall refresh",
                ),
                (
                    "Floating Wall Bedside Shelves",
                    0.22,
                    "Wall-mounted bedside reading shelves",
                ),
                (
                    "Updated LED Lighting Fixtures",
                    0.18,
                    "Dimmable flush-mount lighting",
                ),
                (
                    "Closet Organizer Accessories",
                    0.15,
                    "Drawer and rack organizer modules",
                ),
            ]
    elif is_living:
        if room_budget >= 6000:
            items = [
                (
                    "Stone/Tile Fireplace Surround & Mantle Upgrade",
                    0.38,
                    "Modern ribbon gas or stone hearth wall surround",
                ),
                (
                    "Low-Profile Floating Media Console & Shelves",
                    0.30,
                    "Concealed floating media shelves and cable channels",
                ),
                (
                    "Wide-Plank Hardwood Floor Refinishing",
                    0.18,
                    "Refreshed hardwood floor finish",
                ),
                (
                    "Architectural Perimeter LED Cove Lighting",
                    0.14,
                    "Dimmable architectural cove lighting",
                ),
            ]
        else:
            items = [
                (
                    "Architectural Accent Feature Wall",
                    0.42,
                    "Tailored designer paint wall with picture frame molding",
                ),
                (
                    "Floating Media & Display Shelves",
                    0.28,
                    "Minimalist wall-mounted shelves",
                ),
                (
                    "Hardwood Polish & Area Rug Refresh",
                    0.16,
                    "Flooring touch-up and accent rug",
                ),
                (
                    "Designer Ceiling Chandelier",
                    0.14,
                    "Updated ambient living room lighting",
                ),
            ]
    else:
        if room_budget >= 8000:
            items = [
                (
                    f"Custom {surf}",
                    0.34,
                    "Premium stone/quartz surfaces replacing existing countertops",
                ),
                (cab, 0.40, "Full custom cabinetry with soft-close hardware"),
                (shelv, 0.14, "Built-in shelving and storage racks"),
                (fix, 0.12, fixture_detail),
            ]
        elif room_budget >= 4000:
            items = [
                (
                    f"Cabinet refacing ({cab.split(',')[0]})",
                    0.42,
                    "Reface existing cabinet boxes with new doors, fronts and hardware",
                ),
                (
                    f"Engineered {surf}",
                    0.30,
                    "Durable engineered/laminate surfaces with updated backsplash",
                ),
                (shelv, 0.16, "Open shelving and storage organizers"),
                (fix, 0.12, fixture_detail),
            ]
        else:
            items = [
                (
                    "Repaint existing cabinetry & trim",
                    0.40,
                    "Professional repaint of existing cabinets and millwork (no replacement)",
                ),
                ("Updated hardware & fixtures", 0.20, "New handles, pulls and fixtures"),
                ("Refreshed lighting", 0.22, "Updated ceiling and task lighting"),
                ("Floating accent shelves", 0.18, "Lightweight wall-mounted display shelves"),
            ]

    scope = [
        {
            "feature": label,
            "item_cost": round(room_budget * weight, 2),
            "added_details": detail,
        }
        for label, weight, detail in items
    ]
    drift = round(room_budget - sum(i["item_cost"] for i in scope), 2)
    if scope:
        scope[0]["item_cost"] = round(scope[0]["item_cost"] + drift, 2)
    return scope
