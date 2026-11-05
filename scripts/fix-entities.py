from pathlib import Path

path = Path(__file__).resolve().parents[1] / "src" / "data.js"
text = path.read_text(encoding="utf-8")
replacements = {
    "&amp;": "&",
    "&quot;": '"',
    "&#39;": "'",
    "&lt;": "<",
    "&gt;": ">",
}
for old, new in replacements.items():
    n = text.count(old)
    if n:
        text = text.replace(old, new)
        print(old, n)
path.write_text(text, encoding="utf-8")
print("done")
