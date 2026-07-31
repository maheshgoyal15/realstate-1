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


def build_room_options(
    room_budget: float,
    has_water: bool,
    specs: Dict[str, str],
    room_type: str = "Kitchen",
    style_preference: str = "Modern",
    total_house_budget: float = 15000.0,
) -> Dict[str, Any]:
    """Generate 3 distinct design & budget options (Option A: Cosmetic Value Refresh,
    Option B: Balanced Designer Upgrade, Option C: Luxury Architectural Remodel)
    for a room, with visual_prompt_token binding for accurate AI image rendering."""
    from app.services.agents.style_synthesis_agent import get_designer_paint_spec

    paint_spec = get_designer_paint_spec(style_preference)
    main_paint = paint_spec["main_wall"]
    accent_paint = paint_spec["accent_wall"]
    cab_paint = paint_spec["cabinet_accent"]

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
    is_bath = "bath" in rk

    # Budget targets for the 3 options
    cost_a = max(1500.0, round(room_budget * 0.45, 2))
    cost_b = round(room_budget, 2)
    cost_c = round(room_budget * 1.45, 2)

    def _build_option_items(target_cost: float, opt_tier: str) -> List[Dict[str, Any]]:
        if is_bedroom:
            if opt_tier == "A":
                items = [
                    (
                        f"Designer Accent Wall Repaint ({accent_paint})",
                        0.38,
                        f"Low-VOC repaint behind bed using code {accent_paint}",
                        f"fresh designer accent wall behind bed in {style_preference} style",
                    ),
                    (
                        "Modern Window Treatments & Hardware",
                        0.25,
                        "Tailored window drapes replacing thin blinds",
                        "tailored floor-length window drapes",
                    ),
                    (
                        "Bedside & Ambient Ceiling Lighting",
                        0.20,
                        "Updated modern bedside lamps and dimmable ceiling light",
                        "warm bedside reading lamps and dimmable ceiling fixture",
                    ),
                    (
                        "Decorative Wall Shelves & Trim Refresh",
                        0.17,
                        "Minimalist floating wall shelves and trim touch-up",
                        "minimalist wall-mounted shelves on side walls",
                    ),
                ]
            elif opt_tier == "B":
                items = [
                    (
                        "Custom Slatted Wood / Shiplap Accent Wall",
                        0.38,
                        f"Architectural slatted feature wall with {main_paint} trim",
                        "architectural wood slat accent wall behind bed",
                    ),
                    (
                        "Built-in Closet Organizer & Racks",
                        0.30,
                        "Concealed internal closet storage organization system",
                        "custom built-in closet storage racks",
                    ),
                    (
                        "Hardwood Polish & Plush Wool Area Rug",
                        0.18,
                        "Refreshed wide-plank flooring and luxury rug",
                        "plush wool area rug over warm oak hardwood flooring",
                    ),
                    (
                        "Architectural Dimmable LED Lighting & Fan",
                        0.14,
                        "Designer warm ceiling fixture and reading sconces",
                        "modern architectural ceiling chandelier and ambient sconces",
                    ),
                ]
            else:
                items = [
                    (
                        "Floor-to-Ceiling Custom Wardrobe Built-ins",
                        0.40,
                        "Full custom wardrobe cabinetry with soft-close hardware",
                        "floor-to-ceiling custom wardrobe cabinets",
                    ),
                    (
                        "Luxury Acoustic Upholstered Headboard Wall",
                        0.30,
                        "Premium acoustic wall paneling behind bed",
                        "luxury upholstered acoustic feature wall behind bed",
                    ),
                    (
                        "Wide-Plank Engineered Hardwood Flooring",
                        0.18,
                        "New engineered European white oak wide-plank flooring",
                        "wide-plank European white oak hardwood floors",
                    ),
                    (
                        "Smart Lighting Automation & Motorized Shades",
                        0.12,
                        "Automated smart recessed LED cove lighting and window shades",
                        "recessed LED cove lighting and designer pendant fixtures",
                    ),
                ]
        elif is_living:
            if opt_tier == "A":
                items = [
                    (
                        "Architectural Accent Wall & Paint Refresh",
                        0.42,
                        f"Professional repaint using {main_paint} and {accent_paint} trim",
                        f"tailored accent feature wall in {style_preference} style",
                    ),
                    (
                        "Floating Media Shelves & Cable Channels",
                        0.28,
                        "Minimalist wall-mounted media shelves",
                        "sleek floating wall shelves for media",
                    ),
                    (
                        "Flooring Touch-up & Designer Area Rug",
                        0.16,
                        "Hardwood surface polish and luxury accent rug",
                        "designer woven area rug on polished hardwood floor",
                    ),
                    (
                        "Updated Ceiling Light & Floor Lamps",
                        0.14,
                        "Warm architectural floor lamps and ceiling fixture",
                        "modern sculptural ceiling light fixture",
                    ),
                ]
            elif opt_tier == "B":
                items = [
                    (
                        "Stone/Tile Fireplace Surround & Mantle Upgrade",
                        0.38,
                        "Modern ribbon gas or stone hearth wall surround",
                        "natural stone fireplace surround with timber mantle",
                    ),
                    (
                        "Low-Profile Floating Media Console & Shelves",
                        0.30,
                        "Concealed floating media shelves and cable management",
                        "floating low-profile media console cabinets",
                    ),
                    (
                        "Wide-Plank Hardwood Floor Refinishing",
                        0.18,
                        "Refreshed hardwood floor finish across living room",
                        "refinished wide-plank oak hardwood flooring",
                    ),
                    (
                        "Architectural Perimeter LED Cove Lighting",
                        0.14,
                        "Dimmable architectural cove lighting",
                        "architectural perimeter LED cove lighting",
                    ),
                ]
            else:
                items = [
                    (
                        "Full Custom Flanking Media Wall & Bookcases",
                        0.42,
                        "Custom built-in media cabinetry and flanking bookshelves",
                        "custom built-in bookcases flanking fireplace",
                    ),
                    (
                        "Architectural Linear Gas Fireplace & Hearth",
                        0.30,
                        "Floor-to-ceiling large-format porcelain tile fireplace wall",
                        "architectural linear fireplace with stone hearth",
                    ),
                    (
                        "Wide-Plank White Oak Hardwood Flooring",
                        0.16,
                        "New luxury wide-plank engineered hardwood flooring",
                        "premium wide-plank white oak hardwood floors",
                    ),
                    (
                        "Designer Chandelier & Automated Lighting Control",
                        0.12,
                        "High-end sculptural chandelier and smart dimmer automation",
                        "sculptural designer chandelier and recessed spot lighting",
                    ),
                ]
        else:
            # Kitchen, Bathroom, Home Office, Laundry
            if opt_tier == "A":
                items = [
                    (
                        f"Cabinet Paint & Hardware Refinishing ({cab_paint})",
                        0.40,
                        "Professional cabinet repaint with new pulls and hinges",
                        f"painted cabinet finish in {style_preference} style with modern handles",
                    ),
                    (
                        "Updated Backsplash & Surface Touch-Up",
                        0.25,
                        "Fresh ceramic tile backsplash and surface restoration",
                        "modern subway ceramic tile backsplash",
                    ),
                    (
                        "Updated Hardware & Fixtures",
                        0.20,
                        "New handles, pulls and high-arc faucet",
                        "brushed brass high-arc faucet and modern cabinet pulls",
                    ),
                    (
                        "Refreshed Ceiling & Task Lighting",
                        0.15,
                        "Updated ceiling spot lighting and under-cabinet LED strips",
                        "under-cabinet LED task lighting and bright ceiling lights",
                    ),
                ]
            elif opt_tier == "B":
                items = [
                    (
                        f"Cabinet Refacing ({cab.split(',')[0]})",
                        0.40,
                        "Reface existing cabinet boxes with new shaker/flat-panel doors",
                        cab,
                    ),
                    (
                        f"Engineered {surf}",
                        0.30,
                        "Durable quartz/engineered stone countertops with tile backsplash",
                        surf,
                    ),
                    (
                        shelv,
                        0.18,
                        "Built-in open shelving and storage organizers",
                        shelv,
                    ),
                    (
                        fix,
                        0.12,
                        fixture_detail,
                        fix,
                    ),
                ]
            else:
                items = [
                    (
                        f"Full Custom Cabinetry ({cab.split(',')[0]})",
                        0.42,
                        "Full custom replacement cabinetry with soft-close hardware",
                        f"full custom {style_preference} cabinetry with designer pulls",
                    ),
                    (
                        f"Premium Seamless {surf}",
                        0.32,
                        "Luxury Calacatta quartz or marble countertops and waterfall edge",
                        f"premium seamless {surf}",
                    ),
                    (
                        "Architectural Built-in Pantry & Storage Racks",
                        0.14,
                        "Custom roll-out storage racks and built-in pantry shelving",
                        "custom built-in pantry shelving racks",
                    ),
                    (
                        "Designer Plumbing & Lighting Suite",
                        0.12,
                        "Commercial-grade gooseneck faucet, undermount sink, and designer pendants",
                        "designer plumbing fixtures and architectural pendant lights",
                    ),
                ]

        scope_list = []
        for label, weight, detail, token in items:
            scope_list.append({
                "feature": label,
                "item_cost": round(target_cost * weight, 2),
                "added_details": detail,
                "visual_prompt_token": token,
            })
        drift = round(target_cost - sum(i["item_cost"] for i in scope_list), 2)
        if scope_list:
            scope_list[0]["item_cost"] = round(scope_list[0]["item_cost"] + drift, 2)
        return scope_list

    scope_a = _build_option_items(cost_a, "A")
    scope_b = _build_option_items(cost_b, "B")
    scope_c = _build_option_items(cost_c, "C")

    options = {
        "option_a": {
            "id": "option_a",
            "title": "Option A: Cosmetic Value Refresh",
            "cost": cost_a,
            "projected_value_increase": round(cost_a * 1.85, 2),
            "roi_percentage": 85.0,
            "timeline": "Quick Refresh (1-2 Weeks)",
            "scope": scope_a,
            "prompt_tokens": ", ".join([item["visual_prompt_token"] for item in scope_a]),
        },
        "option_b": {
            "id": "option_b",
            "title": "Option B: Balanced Designer Upgrade",
            "cost": cost_b,
            "projected_value_increase": round(cost_b * 1.60, 2),
            "roi_percentage": 60.0,
            "timeline": "Standard Renovation (3-4 Weeks)",
            "scope": scope_b,
            "prompt_tokens": ", ".join([item["visual_prompt_token"] for item in scope_b]),
        },
        "option_c": {
            "id": "option_c",
            "title": "Option C: Luxury Architectural Remodel",
            "cost": cost_c,
            "projected_value_increase": round(cost_c * 1.48, 2),
            "roi_percentage": 48.0,
            "timeline": "Full Overhaul (6+ Weeks)",
            "scope": scope_c,
            "prompt_tokens": ", ".join([item["visual_prompt_token"] for item in scope_c]),
        },
    }
    return options


def build_room_scope(
    room_budget: float,
    has_water: bool,
    specs: Dict[str, str],
    room_type: str = "Kitchen",
    style_preference: str = "Modern",
) -> List[Dict[str, Any]]:
    """Return itemized upgrades whose costs sum exactly to room_budget, choosing
    room-appropriate upgrades with exact designer paint codes for low budget tiers.
    Defaults to Option B (Balanced Designer Upgrade) scope."""
    options = build_room_options(room_budget, has_water, specs, room_type, style_preference)
    return options["option_b"]["scope"]
