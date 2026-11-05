import re
from pathlib import Path

text = Path(__file__).resolve().parents[1].joinpath("src", "data.js").read_text(encoding="utf-8")
groups = sorted(set(re.findall(r'group:\s*"([^"]+)"', text)))
print("\n".join(groups))
print("count", len(groups))
