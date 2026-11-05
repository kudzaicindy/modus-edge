from pathlib import Path

path = Path(__file__).resolve().parents[1] / "src" / "data.js"
text = path.read_text(encoding="utf-8")
fixes = {
    "accessoriesgifts": "accessories",
    "keychainsgifts": "keychains",
    "power-notebookspower": "power-notebooks",
    "power-bankspower": "power-banks",
    "chargerspower": "chargers",
    "usbpower": "usb",
    "notebooksdesk": "notebooks",
    "pensdesk": "pens",
    "card-holdersdesk": "card-holders",
    "phone-standsdesk": "phone-stands",
    "lanyardsdesk": "lanyards",
    "promogifts": "promo",
}
count = 0
for bad, good in fixes.items():
    pat = f'group: "{bad},'
    rep = f'group: "{good}",'
    n = text.count(pat)
    if n:
        text = text.replace(pat, rep)
        count += n
        print(f"fixed {n}x {bad} -> {good}")
path.write_text(text, encoding="utf-8")
print("total", count)
