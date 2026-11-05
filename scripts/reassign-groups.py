"""Reassign product groups in data.js for MIDU-aligned shop categories."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
path = ROOT / "src" / "data.js"
text = path.read_text(encoding="utf-8")

ASSIGN = {
    "tour-soft": "accessories",
    "glove": "accessories",
    "clip-towel": "accessories",
    "power-notebook": "power-notebooks",
    "clock-notebook": "power-notebooks",
    "cable-power-bank": "power-banks",
    "slim-power-bank": "power-banks",
    "wireless-charger": "chargers",
    "charger-pen-cup": "chargers",
    "globe-charger": "chargers",
    "magnetic-charger": "chargers",
    "wireless-mouse-pad": "chargers",
    "usb-drive": "usb",
    "metal-pen": "pens",
    "leather-notebook": "notebooks",
    "writing-pad": "notebooks",
    "wood-keyring": "keychains",
    "card-holder": "card-holders",
    "phone-stand": "phone-stands",
    "desk-organizer": "desk",
    "lanyard-badge": "lanyards",
    "mini-fan": "promo",
    "notebook-set": "sets",
    "bamboo-desk-set": "sets",
    "buckle-bottle-set": "sets",
    "ladies-golf-set": "sets",
    "power-desk-set": "sets",
    "fan-umbrella-set": "sets",
}

pattern = re.compile(
    r'({\s*id:\s*"(?P<id>[^"]+)",[\s\S]*?group:\s*")(?P<group>[^"]+)(")',
    re.M,
)

changed = 0


def repl(match):
    global changed
    pid = match.group("id")
    if pid in ASSIGN and match.group("group") != ASSIGN[pid]:
        changed += 1
        return f'{match.group(1)}{ASSIGN[pid]}{match.group(3)}'
    return match.group(0)


new_text = pattern.sub(repl, text)
path.write_text(new_text, encoding="utf-8")
print(f"updated groups: {changed}")
