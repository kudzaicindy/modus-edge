import re
from pathlib import Path

root = Path(__file__).resolve().parents[1]
text = (root / "src" / "data.js").read_text(encoding="utf-8")
images = root / "public" / "images"
paths = re.findall(r'"(/images/[^"]+\.(?:png|jpg|jpeg|webp))"', text)
prefixes = (
    "visor-fore",
    "visor-tm-print",
    "visor-pxg",
    "visor-pm99",
    "bucket-hat-",
    "cap-jl",
    "cap-tm-performance",
    "cap-titleist",
    "cap-callaway",
    "cap-honma",
    "cap-ua-circle",
    "cap-malbon",
    "cap-pmg",
    "cap-pxg",
)
ok = 0
miss = []
for path in sorted(set(paths)):
    name = path.rsplit("/", 1)[-1]
    if not name.startswith(prefixes) and not any(name.startswith(p) for p in prefixes):
        continue
    if (images / name).exists():
        ok += 1
    else:
        miss.append(path)
print(f"ok={ok} miss={len(miss)}")
for item in miss:
    print("MISS", item)
