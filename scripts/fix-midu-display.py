"""Fix garbled MIDU titles and replace broken colour crops with full product shots."""

from __future__ import annotations

import re
from pathlib import Path

DATA_JS = Path(__file__).resolve().parents[1] / "src" / "data.js"

# Clear retail names + optional specs/details. Image = hero (drop bad colour crops).
FIXES: dict[str, dict] = {
    "midu-lst04": {
        "name": "Long Sleeve Colorblock Sports Polo",
        "blurb": "A long-sleeve colourblock sports polo, blank for a club or company mark.",
        "details": "Performance knit with a contrast panel. Ask the desk for colour and branding options.",
        "highlights": '["Long sleeve", "Colourblock", "Logo ready"]',
        "specs": """[
      ["Style", "Long sleeve polo"],
      ["Fabric", "Polyester / spandex"],
      ["Mark", "Chest / sleeve"],
      ["Colours", "As shown / on request"],
    ]""",
        "hero": True,
    },
    "midu-lst01": {
        "name": "Long Sleeve Stretch Shirt",
        "blurb": "A slim long-sleeve stretch shirt for staff or event wear.",
        "details": "Polyester/spandex blend with a clean placket. Ask the desk for colour and branding options.",
        "highlights": '["Long sleeve", "Stretch fit", "Logo ready"]',
        "specs": """[
      ["Style", "Long sleeve shirt"],
      ["Fabric", "Polyester / spandex"],
      ["Mark", "Chest"],
      ["Colours", "As shown / on request"],
    ]""",
        "hero": True,
    },
    "midu-hat13": {
        "name": "Safety Hard Hat",
        "blurb": "A vented hard hat for site, event, or branded safety kits.",
        "details": "Gloss shell with a front panel for a company mark. Ask the desk for colour runs.",
        "highlights": '["Hard hat", "Vented shell", "Logo ready"]',
        "specs": """[
      ["Style", "Safety helmet"],
      ["Weight", "About 460 g"],
      ["Mark", "Front shell"],
      ["Colours", "As shown / on request"],
    ]""",
        "hero": True,
        "group": "hats",
    },
    "midu-hat04": {
        "name": "Mesh Trucker Cap",
        "blurb": "A mesh-back trucker cap with a blank front panel for a mark.",
        "details": "Structured foam front and mesh rear. Fits about 58 cm. Ask the desk for colour and branding.",
        "highlights": '["Trucker mesh", "Blank front", "58 cm fit"]',
        "specs": """[
      ["Style", "Trucker cap"],
      ["Fit", "About 58 cm"],
      ["Mark", "Front panel"],
      ["Colours", "As shown / on request"],
    ]""",
        "hero": True,
        "tones": ["Orange", "Black", "Red", "Yellow", "Charcoal", "Blue", "Navy", "White"],
    },
    "midu-hat03": {
        "name": "Structured Baseball Cap",
        "blurb": "A six-panel baseball cap with a blank front for embroidery.",
        "details": "Curved brim, about 58 cm fit. Ask the desk for colour and branding options.",
        "highlights": '["Six panel", "Blank front", "58 cm fit"]',
        "specs": """[
      ["Style", "Baseball cap"],
      ["Fit", "About 58 cm"],
      ["Mark", "Front panel"],
      ["Colours", "As shown / on request"],
    ]""",
        "hero": True,
    },
    "midu-hat03b": {
        "name": "Classic Baseball Cap",
        "blurb": "A classic baseball cap ready for a club or company mark.",
        "details": "About 58 cm circumference. Ask the desk for colour and branding options.",
        "highlights": '["Classic cut", "Blank front", "58 cm fit"]',
        "specs": """[
      ["Style", "Baseball cap"],
      ["Fit", "About 58 cm"],
      ["Mark", "Front panel"],
      ["Colours", "As shown / on request"],
    ]""",
        "hero": True,
    },
    "midu-hat10": {
        "name": "Knitted Beanie",
        "blurb": "A knitted beanie for winter staff or event kits.",
        "hero": True,
    },
    "midu-hat07": {
        "name": "Bucket Hat",
        "blurb": "A soft bucket hat with space for a side or crown mark.",
        "hero": True,
    },
    "midu-pp130": {
        "name": "Plastic Twist Ballpoint",
        "blurb": "A slim plastic twist ballpoint with a clip, ready for a barrel print.",
        "details": "Twist action, pocket clip, and a blank barrel for a logo. Ask the desk for colour runs.",
        "highlights": '["Twist action", "Clip", "Logo barrel"]',
        "specs": """[
      ["Style", "Twist ballpoint"],
      ["Body", "Plastic"],
      ["Mark", "Barrel print"],
      ["Colours", "As shown / on request"],
    ]""",
        "hero": True,
        "tones": ["Black", "Grey", "White", "Yellow", "Sky", "Blue", "Green", "Red", "Purple"],
    },
    "midu-mp52": {
        "name": "Metal Twist Ballpoint",
        "blurb": "A polished metal twist ballpoint for desk and gift sets.",
        "details": "1.0 mm tip. Blank barrel for a company mark. Ask the desk for finish options.",
        "highlights": '["Metal body", "Twist action", "1.0 mm tip"]',
        "specs": """[
      ["Style", "Metal ballpoint"],
      ["Tip", "1.0 mm"],
      ["Mark", "Barrel"],
      ["Finish", "As shown / on request"],
    ]""",
        "hero": True,
    },
    "midu-mp53": {
        "name": "Executive Metal Ballpoint",
        "blurb": "An executive metal ballpoint with a 1.0 mm tip.",
        "details": "Blank for a logo mark. Ask the desk for colour and branding options.",
        "highlights": '["Metal body", "1.0 mm tip", "Logo ready"]',
        "specs": """[
      ["Style", "Metal ballpoint"],
      ["Tip", "1.0 mm"],
      ["Mark", "Barrel"],
      ["Colours", "As shown / on request"],
    ]""",
        "hero": True,
    },
    "midu-mp04": {
        "name": "Wood Barrel Executive Pen",
        "blurb": "A wood-and-metal executive pen for premium gift sets.",
        "details": "About 14.2 × 1.5 cm. Blank cap or barrel for a mark. Ask the desk for branding.",
        "highlights": '["Wood barrel", "Executive finish", "Logo ready"]',
        "specs": """[
      ["Style", "Executive pen"],
      ["Size", "14.2 × 1.5 cm"],
      ["Mark", "Cap / barrel"],
      ["Finish", "Wood + metal"],
    ]""",
        "hero": True,
    },
    "midu-mp03": {
        "name": "Slim Metal Gift Pen",
        "blurb": "A slim metal gift pen for kits and desk sets.",
        "details": "About 13.9 × 1.0 cm. Ask the desk for colour and branding options.",
        "specs": """[
      ["Style", "Metal pen"],
      ["Size", "13.9 × 1.0 cm"],
      ["Mark", "Barrel"],
      ["Colours", "As shown / on request"],
    ]""",
        "hero": True,
    },
    "midu-mp29b": {
        "name": "Soft-Grip Twist Ballpoint",
        "blurb": "A soft-grip twist ballpoint with a blank upper barrel for a mark.",
        "details": "Black ink refill. Ask the desk for colour and branding options.",
        "highlights": '["Soft grip", "Twist action", "Black ink"]',
        "specs": """[
      ["Style", "Twist ballpoint"],
      ["Ink", "Black"],
      ["Mark", "Upper barrel"],
      ["Colours", "As shown / on request"],
    ]""",
        "hero": True,
        "tones": ["White", "Tan", "Orange", "Olive", "Navy", "Black"],
    },
    "midu-pp005": {
        "name": "Promo Ballpoint Pack",
        "blurb": "A simple promo ballpoint for event and staff giveaways.",
        "hero": True,
    },
    "midu-wcp02": {
        "name": "Wireless Charging Desk Mat",
        "blurb": "A desk mat with wireless charge zone, mouse area, and pen loop.",
        "details": "Blank charge plate for a lit logo. Ask the desk for branding options.",
        "highlights": '["Wireless charge", "Mouse pad", "Pen loop"]',
        "specs": """[
      ["Style", "Desk mat"],
      ["Charge", "Wireless"],
      ["Mark", "Charge plate"],
      ["Colours", "As shown / on request"],
    ]""",
        "hero": True,
    },
    "midu-m93": {
        "name": "Notebook & Wireless Mouse Set",
        "blurb": "A notebook and wireless mouse packed as one desk gift.",
        "details": "Blank covers and plates for a company mark. Ask the desk for branding.",
        "highlights": '["Notebook", "Wireless mouse", "Gift set"]',
        "specs": """[
      ["Style", "Desk gift set"],
      ["Includes", "Notebook + mouse"],
      ["Mark", "Cover / plate"],
      ["Colours", "As shown / on request"],
    ]""",
        "hero": True,
    },
    "midu-ub30": {
        "name": "Umbrella Hat",
        "blurb": "A novelty umbrella hat for outdoor events and promo days.",
        "details": "About 50 cm canopy when open. Ask the desk for colour and branding options.",
        "highlights": '["Hands-free canopy", "Event promo", "Logo panels"]',
        "specs": """[
      ["Style", "Umbrella hat"],
      ["Open size", "About 50 cm"],
      ["Mark", "Canopy panels"],
      ["Colours", "As shown / on request"],
    ]""",
        "hero": True,
        "group": "hats",
    },
    "midu-ub15": {
        "name": "Rubberized Golf Umbrella",
        "blurb": "A thickened rubberized canopy umbrella for outdoor branding.",
        "hero": True,
    },
    "midu-ub14": {
        "name": "Colour Rubberized Umbrella",
        "blurb": "A rubberized colour canopy umbrella for staff and event kits.",
        "hero": True,
    },
    "midu-ub13": {
        "name": "Black Rubberized Umbrella",
        "blurb": "A thickened black rubberized umbrella with room for a panel mark.",
        "hero": True,
    },
    "midu-ub11": {
        "name": "Impact Cloth Umbrella",
        "blurb": "An impact-cloth umbrella for outdoor brand days.",
        "hero": True,
    },
    "midu-kc37": {
        "name": "3D Rubber Keychain",
        "blurb": "A raised 3D rubber keychain moulded for a custom logo.",
        "details": "About 6 cm long, 1 cm thick rubber. Ask the desk for colour and mould artwork.",
        "highlights": '["3D rubber", "Custom mould", "Keyring"]',
        "specs": """[
      ["Style", "Rubber keychain"],
      ["Size", "About 6 × 1 cm"],
      ["Material", "Rubber"],
      ["Mark", "Raised logo"],
    ]""",
        "hero": True,
    },
    "midu-phd16": {
        "name": "Pen Holder with Clock",
        "blurb": "A desk pen holder with phone stand, analog clock, and blank plate.",
        "details": "Holds pens and a phone. Front plate takes a company mark. Ask the desk for colour.",
        "highlights": '["Pen cups", "Phone stand", "Clock + plate"]',
        "specs": """[
      ["Style", "Desk organiser"],
      ["Includes", "Clock, pen cups, phone stand"],
      ["Mark", "Front plate"],
      ["Colours", "As shown / on request"],
    ]""",
        "hero": True,
    },
    "midu-phd12": {
        "name": "Digital Alarm Clock Pen Stand",
        "blurb": "A digital alarm clock with an integrated pen stand.",
        "hero": True,
    },
    "midu-bh12": {
        "name": "Badge Holder with Lanyard",
        "blurb": "A PU badge holder on a lanyard for staff and event passes.",
        "details": "Window for an ID card. Strap and holder take a company mark.",
        "highlights": '["ID window", "Lanyard", "Logo ready"]',
        "specs": """[
      ["Style", "Badge + lanyard"],
      ["Window", "ID / IC card"],
      ["Mark", "Strap / holder"],
      ["Colours", "As shown / on request"],
    ]""",
        "hero": True,
    },
    "midu-bh13": {
        "name": "Printed Event Lanyard",
        "blurb": "A polyester event lanyard with a clip for badges and passes.",
        "details": "Full-colour print on the strap. Ask the desk for length and artwork.",
        "highlights": '["Polyester strap", "Full print", "Clip"]',
        "specs": """[
      ["Style", "Event lanyard"],
      ["Material", "Polyester"],
      ["Mark", "Full strap print"],
      ["Colours", "As shown / on request"],
    ]""",
        "hero": True,
    },
    "midu-bp26": {
        "name": "City Laptop Backpack",
        "blurb": "A structured city backpack with laptop sleeve and USB pass-through.",
        "details": "Fits up to a 17-inch laptop. Front panel blank for a company mark.",
        "highlights": '["17-inch sleeve", "USB port", "Front mark"]',
        "specs": """[
      ["Style", "Laptop backpack"],
      ["Laptop", "Up to 17 inches"],
      ["Mark", "Front panel"],
      ["Colours", "As shown / on request"],
    ]""",
        "hero": True,
        "featured": True,
    },
    "midu-bp93": {
        "name": "PU Leather City Backpack",
        "blurb": "A soft PU leather city backpack with a flap front pocket.",
        "details": "About 1 kg. Front flap takes a company mark. Ask the desk for colour.",
        "highlights": '["PU leather", "Flap pocket", "Logo ready"]',
        "specs": """[
      ["Style", "City backpack"],
      ["Weight", "About 1 kg"],
      ["Mark", "Front flap"],
      ["Colours", "As shown / on request"],
    ]""",
        "hero": True,
    },
    "midu-bg16": {
        "name": "Travel Duffel Bag",
        "blurb": "A roomy travel duffel for kits and staff travel packs.",
        "details": "About 46 × 31 × 14 cm. Ask the desk for branding options.",
        "specs": """[
      ["Style", "Duffel"],
      ["Size", "46 × 31 × 14 cm"],
      ["Mark", "Side / end"],
      ["Colours", "As shown / on request"],
    ]""",
        "hero": True,
    },
    "midu-pbn030": {
        "name": "Power Notebook with Clock",
        "blurb": "A power notebook with a built-in cover clock.",
        "hero": True,
    },
    "midu-pbn023": {
        "name": "Clock Cover Power Notebook",
        "blurb": "A power notebook with a clock set into the cover.",
        "hero": True,
    },
    "midu-gs545": {
        "name": "Premium Desk Gift Set",
        "blurb": "A multi-piece desk gift set ready for a company mark.",
        "hero": True,
    },
    "midu-ccb02": {
        "name": "Canvas Cotton Tote",
        "blurb": "A cotton/polyester canvas tote for events and staff kits.",
        "hero": True,
    },
    "midu-hcb01": {
        "name": "PU Leather Carry Bag",
        "blurb": "A PU leather carry bag with a blank panel for a mark.",
        "hero": True,
    },
}


def escape(s: str) -> str:
    return s.replace("\\", "\\\\").replace('"', '\\"')


def hero_path(pid: str) -> str:
    slug = pid.removeprefix("midu-")
    return f"/images/midu/midu-{slug}.jpg"


def colors_js(pid: str, fix: dict) -> str:
    hero = hero_path(pid)
    tones = fix.get("tones")
    if tones:
        # Tone-only swatches (no broken crop thumbnails); main photo stays the hero shot
        lines = [f'{{ name: "{t}" }}' for t in tones]
        return "[" + ", ".join(lines) + "]"
    return f'[{{ name: "As shown", image: "{hero}" }}]'


def replace_field(block: str, key: str, value_js: str) -> str:
    """Replace a top-level field. value_js is raw JS after the colon."""
    if key in ("highlights", "specs", "colors"):
        # balanced for arrays
        m = re.search(rf"{key}:\s*", block)
        if not m:
            return block
        start = m.end()
        if block[start] != "[":
            return block
        depth = 0
        j = start
        while j < len(block):
            ch = block[j]
            if ch == "[":
                depth += 1
            elif ch == "]":
                depth -= 1
                if depth == 0:
                    end = j + 1
                    if end < len(block) and block[end] == ",":
                        end += 1
                    return block[: m.start()] + f"{key}: {value_js}," + block[end:]
            j += 1
        return block

    # string / bool / number simple fields
    if key == "featured":
        return re.sub(rf"featured:\s*(true|false)", f"featured: {value_js}", block, count=1)
    if key == "group":
        return re.sub(rf'group:\s*"[^"]*"', f'group: "{value_js}"', block, count=1)
    return re.sub(
        rf'{key}:\s*"(?:\\.|[^"\\])*"',
        f'{key}: "{value_js}"',
        block,
        count=1,
    )


def main() -> None:
    text = DATA_JS.read_text(encoding="utf-8")
    pattern = re.compile(r'\n  \{\n    id: "(midu-[^"]+)",')
    matches = list(pattern.finditer(text))
    parts = []
    i = 0
    count = 0

    for idx, m in enumerate(matches):
        start = m.start() + 1
        pid = m.group(1)
        if idx + 1 < len(matches):
            end = matches[idx + 1].start() + 1
        else:
            end_marker = text.find("\n];\n\nexport const stories", m.start())
            block_end = text.rfind("\n  }", m.start(), end_marker) + len("\n  }")
            if text[block_end : block_end + 1] == ",":
                block_end += 1
            end = block_end

        parts.append(text[i:start])
        block = text[start:end]
        fix = FIXES.get(pid)
        if fix:
            if "name" in fix:
                block = replace_field(block, "name", escape(fix["name"]))
            if "blurb" in fix:
                block = replace_field(block, "blurb", escape(fix["blurb"]))
            if "details" in fix:
                block = replace_field(block, "details", escape(fix["details"]))
            if "highlights" in fix:
                block = replace_field(block, "highlights", fix["highlights"])
            if "specs" in fix:
                block = replace_field(block, "specs", fix["specs"])
            if "group" in fix:
                block = replace_field(block, "group", fix["group"])
            if fix.get("featured"):
                block = replace_field(block, "featured", "true")
            if fix.get("hero"):
                hero = hero_path(pid)
                block = replace_field(block, "image", hero)
                block = replace_field(block, "colors", colors_js(pid, fix))
            count += 1
        parts.append(block)
        i = end

    parts.append(text[i:])
    out = "".join(parts)

    # City Backpack local SKU — swap weak PNGs for the clearer MIDU city packs
    out2, n_city = re.subn(
        r"""  \{
    id: "city-backpack",
    name: "City Backpack",
    group: "bags",
    price: 54,
    compareAt: null,
    badge: "New",
    featured: true,
    image: "/images/bag-pack-slim.png",
    images: \[[\s\S]*?\],
    colors: \[[\s\S]*?\],
    blurb: "[^"]*",
    details:
      "[^"]*",
    highlights: \[[^\]]*\],
    specs: \[[\s\S]*?\],
  \}""",
        """  {
    id: "city-backpack",
    name: "City Backpack",
    group: "bags",
    price: 54,
    compareAt: null,
    badge: "New",
    featured: true,
    image: "/images/midu/midu-bp26.jpg",
    images: [
      "/images/midu/midu-bp26.jpg",
      "/images/midu/midu-bp93.jpg",
    ],
    colors: [
      { name: "Black laptop", image: "/images/midu/midu-bp26.jpg", tone: TONE.black },
      { name: "Brown leather", image: "/images/midu/midu-bp93.jpg", tone: TONE.brown },
    ],
    blurb: "City packs in two cuts — a structured laptop backpack and a soft PU flap pack.",
    details:
      "Black laptop pack (to 17 inches) and brown PU leather flap pack. Front panels take a company mark.",
    highlights: ["Two cuts", "Laptop sleeve option", "Front mark"],
    specs: [
      ["Style", "City backpack"],
      ["Cuts", "2"],
      ["Laptop", "Up to 17 inches on black"],
      ["Mark", "Front panel"],
    ],
  }""",
        out,
        count=1,
    )
    print(f"updated midu products: {count}; city-backpack: {n_city}")
    DATA_JS.write_text(out2, encoding="utf-8")


if __name__ == "__main__":
    main()
