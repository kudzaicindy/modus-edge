"""Clean Instagram-imported product titles/copy under MODUS-EDGE branding."""

from __future__ import annotations

import re
from pathlib import Path

DATA_JS = Path(__file__).resolve().parents[1] / "src" / "data.js"

# Hand-tuned retail names from the shop feed photos / captions
FIXES = {
    "ig-daidxxqtzfn": {
        "name": "Premium Golf Apparel Edit",
        "group": "shirts",
        "price": 32.0,
        "blurb": "A curated golf apparel edit for tournament and corporate days.",
        "details": "Premium golfwear for the course and the clubhouse. Blank areas take a MODUS-EDGE or club mark. Ask the desk for colour, size, and branding.",
        "highlights": '["Golf apparel", "Logo ready", "MODUS-EDGE"]',
        "featured": True,
    },
    "ig-dxbkmn8dtr-": {
        "name": "Performance Golf Cap Collection",
        "group": "hats",
        "price": 30.0,
        "blurb": "Performance golf caps ready for a society or company mark.",
        "details": "Structured and mesh golf caps in mixed colourways. Ask the desk for colour runs and branding.",
        "highlights": '["Golf caps", "Logo ready", "From $30"]',
        "featured": True,
    },
    "ig-dvygwo9jrh9": {
        "name": "Ladies Pleated Golf Skirt Set",
        "group": "women",
        "price": 48.0,
        "blurb": "Ladies’ golfwear with poise — pleats ready for the clubhouse.",
        "details": "From the greens to the clubhouse. Ask the desk for colour, size, and a MODUS-EDGE mark.",
        "highlights": '["Ladies golfwear", "Pleated cut", "Logo ready"]',
        "featured": True,
    },
    "ig-dvwawkmjv2h": {
        "name": "Winter Golf Layer Edit",
        "group": "jackets",
        "price": 55.0,
        "blurb": "Warmth with prestige — layered golf looks for cooler rounds.",
        "details": "Winter golf layers for course and travel. Ask the desk for colour and branding.",
        "highlights": '["Winter layer", "Course ready", "Logo ready"]',
    },
    "ig-dvqey5yjdic": {
        "name": "Golf Shoes — Preorder",
        "group": "shoes",
        "price": 85.0,
        "blurb": "Golf shoes available on preorder for the season ahead.",
        "details": "Place a preorder with the desk for size and colour. Branding available on select models.",
        "highlights": '["Golf shoes", "Preorder", "Size run"]',
        "featured": True,
    },
    "ig-dvibb4_jp73": {
        "name": "Core Comfort Full-Zip Jacket",
        "group": "jackets",
        "price": 58.0,
        "blurb": "A full-zip comfort jacket for corporate and individual orders.",
        "details": "Core Comfort full-zip jackets in multiple colour blocks. Chest takes a MODUS-EDGE or club mark.",
        "highlights": '["Full zip", "Corporate orders", "Logo ready"]',
        "featured": True,
    },
    "ig-dvgdujzjynf": {
        "name": "Staff Golf Bag — Order",
        "group": "bags",
        "price": 120.0,
        "blurb": "Staff golf bags available on order for clubs and corporates.",
        "details": "Order a staff bag with the desk. Front panel takes a company or club mark.",
        "highlights": '["Staff bag", "On order", "Logo ready"]',
    },
    "ig-dtsfc8wjebm": {
        "name": "Sporting Essentials Kit",
        "group": "accessories",
        "price": 35.0,
        "blurb": "Sporting essentials for the course, the gym, and the club day.",
        "details": "Ask the desk for the current kit mix, colour, and branding options.",
        "highlights": '["Essentials", "Multi-sport", "Logo ready"]',
    },
    "ig-dsc0cmxdu-s": {
        "name": "Carry Golf Bag — Order",
        "group": "bags",
        "price": 95.0,
        "blurb": "Carry golf bags available on order.",
        "details": "Place an order with the desk for colour and a front-panel mark.",
        "highlights": '["Carry bag", "On order", "Logo ready"]',
    },
    "ig-dqwkkbadq04": {
        "name": "Branding Plug Gift Edit",
        "group": "sets",
        "price": 40.0,
        "blurb": "A branding-ready gift edit for clubs and corporates.",
        "details": "Ask the desk to build a branded kit for your golf day or staff gift.",
        "highlights": '["Gift edit", "Branding", "MODUS-EDGE"]',
    },
    "ig-dqi7z8gjfsf": {
        "name": "Corporate Golf Day Supplies",
        "group": "sets",
        "price": 45.0,
        "blurb": "Premium supplies and bespoke branding for corporate golf days.",
        "details": "Build a branded golf-day kit with the desk — apparel, caps, and gifts.",
        "highlights": '["Corporate day", "Bespoke mark", "Kit build"]',
        "featured": True,
    },
    "ig-dqi4fjfjpzt": {
        "name": "New Season Course Drop",
        "group": "accessories",
        "price": 28.0,
        "blurb": "A new season drop for the course and the clubhouse.",
        "details": "Ask the desk for what’s in this drop, sizes, and branding.",
        "highlights": '["New drop", "Course ready", "Logo ready"]',
    },
    "ig-dpo0qqojaxu": {
        "name": "Golf Clubs — Preorder",
        "group": "clubs",
        "price": 180.0,
        "blurb": "Golf clubs available on preorder.",
        "details": "Preorder clubs with the desk for model and loft. Ask about branding options.",
        "highlights": '["Clubs", "Preorder", "Ask desk"]',
    },
    "ig-doqb4ejddpy": {
        "name": "Weekend Golf Bag",
        "group": "bags",
        "price": 88.0,
        "blurb": "Weekend golf bags ready to order.",
        "details": "Order with the desk for colour and a panel mark.",
        "highlights": '["Golf bag", "On order", "Logo ready"]',
    },
    "ig-donmisldbps": {
        "name": "Golf Travel Cover Bag",
        "group": "bags",
        "price": 110.0,
        "blurb": "Travel cover bags for clubs on the move.",
        "details": "Protect clubs in transit. Ask the desk for colour and branding.",
        "highlights": '["Travel cover", "On order", "Logo ready"]',
    },
    "ig-dowhgqydhgb": {
        "name": "Golf Belt",
        "group": "accessories",
        "price": 22.0,
        "blurb": "A golf belt for the round and the clubhouse.",
        "details": "Ask the desk for colour, size, and buckle mark options.",
        "highlights": '["Belt", "Course ready", "Logo ready"]',
    },
    "ig-dn5tb6fdspz": {
        "name": "Cap Colour Run",
        "group": "hats",
        "price": 30.0,
        "blurb": "A mixed colour run of golf caps.",
        "details": "Spoilt for colour choice. Ask the desk for the current run and branding.",
        "highlights": '["Caps", "Colour run", "Logo ready"]',
    },
    "ig-dnvqaqa2i5u": {
        "name": "Bucket Hat Edit",
        "group": "hats",
        "price": 28.0,
        "blurb": "Bucket hats for sunny rounds and society days.",
        "details": "Ask the desk for colour and a crown or side mark.",
        "highlights": '["Bucket hat", "Sun cover", "Logo ready"]',
    },
    "ig-dnvosyn2rei": {
        "name": "Ladies Course Dress Edit",
        "group": "women",
        "price": 52.0,
        "blurb": "Ladies’ looks for the course — dressed by the desk.",
        "details": "Ask the desk for size, colour, and a MODUS-EDGE mark.",
        "highlights": '["Ladies wear", "Course ready", "Logo ready"]',
        "featured": True,
    },
    "ig-dnnzdpnnhdz": {
        "name": "Performance Golf Polo",
        "group": "shirts",
        "price": 35.0,
        "blurb": "A performance golf polo ready for a chest mark.",
        "details": "Athletic polo cut for the round. Ask the desk for colour, size, and branding.",
        "highlights": '["Golf polo", "Performance knit", "Logo ready"]',
        "featured": True,
    },
    "ig-dnnzqkztbn0": {
        "name": "Golf Shorts",
        "group": "accessories",
        "price": 32.0,
        "blurb": "Quality golf shorts for the round.",
        "details": "Ask the desk for size, colour, and branding options.",
        "highlights": '["Golf shorts", "Course ready", "Ask desk"]',
    },
}


def replace_field(block: str, key: str, value_js: str) -> str:
    if key in ("highlights", "specs", "colors"):
        m = re.search(rf"{key}:\s*", block)
        if not m:
            return block
        start = m.end()
        if block[start] != "[":
            return block
        depth = 0
        j = start
        while j < len(block):
            if block[j] == "[":
                depth += 1
            elif block[j] == "]":
                depth -= 1
                if depth == 0:
                    end = j + 1
                    if end < len(block) and block[end] == ",":
                        end += 1
                    return block[: m.start()] + f"{key}: {value_js}," + block[end:]
            j += 1
        return block
    if key == "featured":
        return re.sub(r"featured:\s*(true|false)", f"featured: {value_js}", block, count=1)
    if key == "group":
        return re.sub(r'group:\s*"[^"]*"', f'group: "{value_js}"', block, count=1)
    if key == "price":
        return re.sub(r"price:\s*[0-9.]+", f"price: {value_js}", block, count=1)
    return re.sub(
        rf'{key}:\s*"(?:\\.|[^"\\])*"',
        f'{key}: "{value_js}"',
        block,
        count=1,
    )


def esc(s: str) -> str:
    return s.replace("\\", "\\\\").replace('"', '\\"')


def main() -> None:
    text = DATA_JS.read_text(encoding="utf-8")
    pattern = re.compile(r'\n  \{\n    id: "(ig-[^"]+)",')
    matches = list(pattern.finditer(text))
    parts = []
    i = 0
    n = 0
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
            block = replace_field(block, "name", esc(fix["name"]))
            if "group" in fix:
                block = replace_field(block, "group", fix["group"])
            if "price" in fix:
                block = replace_field(block, "price", str(fix["price"]))
            block = replace_field(block, "blurb", esc(fix["blurb"]))
            block = replace_field(block, "details", esc(fix["details"]))
            if "highlights" in fix:
                block = replace_field(block, "highlights", fix["highlights"])
            if fix.get("featured"):
                block = replace_field(block, "featured", "true")
            n += 1
        parts.append(block)
        i = end
    parts.append(text[i:])
    DATA_JS.write_text("".join(parts), encoding="utf-8")
    print(f"scrubbed {n} ig products")


if __name__ == "__main__":
    main()
