from pathlib import Path
import re

text = Path(__file__).resolve().parents[1].joinpath("src", "data.js").read_text(encoding="utf-8")
groups = {}
for m in re.finditer(r'group:\s*"([^"]+)"', text):
    groups[m.group(1)] = groups.get(m.group(1), 0) + 1
ids = re.findall(r'^\s*id:\s*"([^"]+)"', text, re.M)
print("products", len(ids))
print("groups:")
for g, n in sorted(groups.items(), key=lambda x: -x[1]):
    print(f"  {g}: {n}")
print("filters:")
for m in re.finditer(r'\{\s*id:\s*"([^"]+)",\s*label:\s*"([^"]+)"', text):
    print(f"  {m.group(1)} - {m.group(2)}")
print("sample ids:")
for i in ids[:20]:
    print(" ", i)
print("...")
for i in ids[-20:]:
    print(" ", i)
