"""
Room Design Taxonomy & Architectural Style Sub-Agent

Responsible for:
1. Room and style token lookups (Farmhouse, Mid-Century Modern, Contemporary Modern).
2. Timeline scope modifiers (Quick Refresh, Standard Renovation, Full Overhaul).
"""

from typing import Dict

ROOM_STYLE_TAXONOMY: Dict[str, Dict[str, Dict[str, str]]] = {
    "kitchen": {
        "farmhouse": {
            "cabinets": "Satin White Shaker Cabinets with antique brass cup pulls",
            "primary_surface": "Honed Calacatta Quartz Countertop with white shiplap backsplash",
            "fixtures": "Apron-Front Fireclay Sink with Matte Black Bridge Faucet",
            "shelving_racks": "Rustic reclaimed-wood floating pantry shelves",
            "tokens": "modern farmhouse kitchen, apron sink, shiplap tile, matte black hardware",
            "negative_tokens": "",
        },
        "midcentury": {
            "cabinets": "Warm Walnut Flat-Panel Cabinets with finger pulls",
            "primary_surface": "White Terrazzo Countertop with geometric mosaic backsplash",
            "fixtures": "Brushed Brass Gooseneck Faucet and Undermount Basin",
            "shelving_racks": "Walnut open display racks with brass supports",
            "tokens": "mid-century modern kitchen, warm walnut, retro mosaic tile, brass hardware",
            "negative_tokens": "",
        },
        "modern": {
            "cabinets": "Satin White Minimalist Shaker Cabinets with matte black bar pulls",
            "primary_surface": "Calacatta White Quartz Countertop with bold grey veining and subway backsplash",
            "fixtures": "Commercial Stainless Steel Pull-Down Faucet and Undermount Basin",
            "shelving_racks": "Minimalist white floating wall shelves",
            "tokens": "modern bright kitchen, quartz countertops, white shaker cabinets, professional lighting",
            "negative_tokens": "",
        },
        "default": {
            "cabinets": "Modern Shaker Cabinets with sleek metal hardware",
            "primary_surface": "Polished Quartz Countertop with ceramic tile backsplash",
            "fixtures": "High-Arc Pull-Down Gooseneck Faucet and Undermount Sink",
            "shelving_racks": "Built-in pantry cabinets and open display shelving",
            "tokens": "renovated modern kitchen, polished quartz, upgraded cabinets",
            "negative_tokens": "",
        },
    },
    "bathroom": {
        "farmhouse": {
            "cabinets": "Weathered Wood Double Vanity Cabinet with black metal pulls",
            "primary_surface": "White Quartz Vanity Top with matte black framed mirrors",
            "fixtures": "Matte Black Widespread Bathroom Faucets and porcelain vessel sinks",
            "shelving_racks": "Ladder-style wooden towel rack and recessed shower niche",
            "tokens": "farmhouse bathroom renovation, wooden vanity, matte black fixtures, subway shower tile",
            "negative_tokens": "kitchen island, stove, refrigerator, range hood",
        },
        "modern": {
            "cabinets": "Floating Minimalist Walnut or White Vanity Cabinet",
            "primary_surface": "Seamless Calacatta Marble Top with frameless LED backlight mirror",
            "fixtures": "Wall-Mounted Brushed Brass Faucets and frameless glass spa shower",
            "shelving_racks": "Recessed illuminated wall niches and floating glass shelves",
            "tokens": "modern luxury spa bathroom, floating vanity, frameless glass shower, brass hardware",
            "negative_tokens": "kitchen island, stove, refrigerator, dining table",
        },
        "default": {
            "cabinets": "Upgraded Double Vanity Cabinet with soft-close drawers",
            "primary_surface": "Quartz Vanity Surface with ceramic tile wainscoting",
            "fixtures": "Brushed Nickel High-Arc Bathroom Faucets",
            "shelving_racks": "Built-in linen cabinet and glass towel shelves",
            "tokens": "bright modernized bathroom, updated vanity, glass shower enclosure",
            "negative_tokens": "kitchen island, stove, refrigerator",
        },
    },
    "bedroom": {
        "farmhouse": {
            "cabinets": "Built-in Soft White Wardrobe Cabinets with beadboard doors and black iron pulls",
            "primary_surface": "Shiplap Accent Wall behind upholstered linen bed frame",
            "fixtures": "Black Iron Industrial Pendant Lights and wall sconces",
            "shelving_racks": "Built-in closet organization racks and floating pine display shelves",
            "tokens": "cozy modern farmhouse bedroom, shiplap accent wall, built-in wardrobes, warm hardwood flooring, plush bedding",
            "negative_tokens": "sink, faucet, plumbing fixture, countertop, kitchen island, stove, refrigerator, dishwasher, toilet, shower",
        },
        "midcentury": {
            "cabinets": "Walnut Lowline Credenza Cabinets and built-in closet doors with brass knobs",
            "primary_surface": "Warm Slatted Wood Feature Wall behind low-profile platform bed",
            "fixtures": "Sputnik Brass Chandelier and mid-century bedside globe sconces",
            "shelving_racks": "Walnut modular wall-mounted shelving and book racks",
            "tokens": "mid-century modern bedroom, walnut furniture, platform bed, warm ambient lighting, retro area rug",
            "negative_tokens": "sink, faucet, plumbing fixture, countertop, kitchen island, stove, refrigerator, dishwasher, toilet, shower",
        },
        "modern": {
            "cabinets": "Floor-to-Ceiling Matte White Flat-Panel Closet Cabinets with hidden touch-latches",
            "primary_surface": "Minimalist Neutral Textured Wall with integrated padded headboard",
            "fixtures": "Architectural Recessed Linear LED Strip and designer pendant lamps",
            "shelving_racks": "Concealed custom closet rack organization and floating display shelves",
            "tokens": "modern luxury master bedroom, floor-to-ceiling built-in wardrobes, neutral tone textiles, warm oak flooring",
            "negative_tokens": "sink, faucet, plumbing fixture, countertop, kitchen island, stove, refrigerator, dishwasher, toilet, shower",
        },
        "default": {
            "cabinets": "Built-in Storage Cabinets and custom wardrobe units with modern hardware",
            "primary_surface": "Fresh Neutral Designer Paint Wall with tailored window drapes",
            "fixtures": "Modern Ceiling Fan / Chandelier and warm bedside reading lamps",
            "shelving_racks": "Custom built-in closet organizer racks and open bookshelves",
            "tokens": "serene modern bedroom design, custom built-in closets, plush area rug, architectural lighting",
            "negative_tokens": "sink, faucet, plumbing fixture, countertop, kitchen island, stove, refrigerator, dishwasher, toilet, shower",
        },
    },
    "living_room": {
        "farmhouse": {
            "cabinets": "Built-in White Flanking Media Cabinets beside stone fireplace mantle",
            "primary_surface": "Natural Fieldstone Fireplace Surround and wide-plank oak flooring",
            "fixtures": "Wrought-Iron Wheel Chandelier and dimmable accent uplights",
            "shelving_racks": "Thick oak mantelpiece and open book racks flanking fireplace",
            "tokens": "cozy modern farmhouse living room, stone fireplace, built-in media cabinets, rustic beams, plush sofa",
            "negative_tokens": "sink, faucet, plumbing fixture, countertop, kitchen stove, bathtub, shower, toilet",
        },
        "modern": {
            "cabinets": "Floating Low-Profile Matte Charcoal Media Cabinets with hidden cable management",
            "primary_surface": "Venetian Plaster or Large-Format Tile Accent Wall with ribbon gas fireplace",
            "fixtures": "Sculptural Modern Chandelier and recessed perimeter LED cove light",
            "shelving_racks": "Illuminated floating glass display shelves and custom media wall racks",
            "tokens": "contemporary modern living room, architectural linear fireplace, floating media cabinets, floor-to-ceiling windows",
            "negative_tokens": "sink, faucet, plumbing fixture, countertop, kitchen stove, bathtub, shower, toilet",
        },
        "default": {
            "cabinets": "Custom Built-in Console Cabinets and storage cupboards",
            "primary_surface": "Tailored Accent Wall with upgraded hardwood flooring and trim",
            "fixtures": "Designer Ceiling Light and architectural floor lamps",
            "shelving_racks": "Built-in bookcases and floating display racks",
            "tokens": "bright spacious living room, custom built-in cabinetry, hardwood floors, high-end furniture",
            "negative_tokens": "sink, faucet, plumbing fixture, countertop, kitchen stove, bathtub, shower, toilet",
        },
    },
    "home_office": {
        "default": {
            "cabinets": "Custom Built-in Desk Credenza Cabinets with file drawers and hidden outlets",
            "primary_surface": "Acoustic Wood Slat Feature Wall behind executive desk",
            "fixtures": "Architectural LED Linear Desk Light and flush-mount ceiling fixture",
            "shelving_racks": "Floor-to-ceiling built-in bookcases and open reference racks",
            "tokens": "executive home office workspace, built-in bookcases, custom desk cabinetry, inspiring productivity environment",
            "negative_tokens": "sink, faucet, plumbing fixture, kitchen counter, stove, refrigerator, bathtub, bed",
        }
    },
}

TIMELINE_TAXONOMY: Dict[str, Dict[str, str]] = {
    "quick": {
        "label": "Quick Refresh (1-2 Weeks)",
        "scope_modifier": "Focus on high-impact surface refinishing, painting existing cabinets/built-ins, updating hardware handles, and adding floating shelves requiring no heavy structural demo.",
    },
    "standard": {
        "label": "Standard Renovation (3-4 Weeks)",
        "scope_modifier": "Include full cabinet refacing, replacement of shelving and storage racks, stone or wood surface upgrades, and designer fixture installations.",
    },
    "full_overhaul": {
        "label": "Full Overhaul (6+ Weeks)",
        "scope_modifier": "Complete custom architectural rebuild including floor-to-ceiling built-in cabinetry, custom storage rack systems, premium materials, and integrated LED task lighting.",
    },
}


def synthesize_custom_style_prompt_with_gemini(room_type: str, custom_style: str, budget: float) -> Dict[str, str]:
    """
    TASK 3: Architectural Style Synthesis & Prompt Engineering Sub-Agent
    Uses gemini-3.5-flash for deep architectural reasoning, generating custom
    carpentry, stone surface, and hardware specifications tailored to niche designs.
    """
    import os, json, ssl, urllib.request
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        return _get_room_taxonomy(room_type, custom_style)

    model = os.getenv("GEMINI_STYLE_MODEL", "gemini-3.5-flash")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
    prompt = f"""
    Role: Senior Architectural Interior Designer.
    Create material specifications for a {room_type} renovation in '{custom_style}' style with ${budget:,.0f} budget.
    Return strictly JSON:
    {{
      "cabinets": "exact cabinet finish and handle spec",
      "primary_surface": "exact stone/surface material",
      "fixtures": "plumbing or light fixture specification",
      "shelving_racks": "floating shelves or rack design",
      "tokens": "diffusion positive prompt tokens",
      "negative_tokens": "diffusion negative prompt elements"
    }}
    """
    try:
        ctx = ssl._create_unverified_context()
        req = urllib.request.Request(
            url,
            data=json.dumps({"contents": [{"parts": [{"text": prompt}]}]}).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, context=ctx, timeout=12) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            txt = data["candidates"][0]["content"]["parts"][0]["text"].strip()
            if txt.startswith("```json"): txt = txt[7:-3].strip()
            elif txt.startswith("```"): txt = txt[3:-3].strip()
            return json.loads(txt)
    except Exception:
        pass
    return _get_room_taxonomy(room_type, custom_style)


def _get_room_taxonomy(room_type: str, style_pref: str) -> Dict[str, str]:
    rt_key = room_type.lower()
    if "bed" in rt_key:
        group = ROOM_STYLE_TAXONOMY["bedroom"]
    elif "bath" in rt_key:
        group = ROOM_STYLE_TAXONOMY["bathroom"]
    elif "living" in rt_key or "family" in rt_key or "den" in rt_key:
        group = ROOM_STYLE_TAXONOMY["living_room"]
    elif "office" in rt_key or "study" in rt_key:
        group = ROOM_STYLE_TAXONOMY.get("home_office", ROOM_STYLE_TAXONOMY["bedroom"])
    else:
        group = ROOM_STYLE_TAXONOMY["kitchen"]

    st_key = style_pref.lower()
    for s_name in ["farmhouse", "midcentury", "modern"]:
        if s_name in st_key and s_name in group:
            return group[s_name]
    return group.get("default", list(group.values())[0])
