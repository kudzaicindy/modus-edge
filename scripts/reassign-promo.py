from pathlib import Path
import re

path = Path(__file__).resolve().parents[1] / "src" / "data.js"
text = path.read_text(encoding="utf-8")

moves = {
    "mini-fan": "desk",
    "midu-pts07": "shirts",
    "midu-lst04": "shirts",
    "midu-pts45": "shirts",
    "midu-lst01": "shirts",
    "midu-rc01": "jackets",
    "midu-vt01": "accessories",
    "midu-ww01": "jackets",
    "midu-ww04a": "jackets",
}

for pid, group in moves.items():
    pattern = rf'(id: "{re.escape(pid)}",[\s\S]*?\n    group: )"[^"]+"'
    text, n = re.subn(pattern, rf'\1"{group}"', text, count=1)
    print(pid, "->", group, "ok" if n == 1 else "FAIL")

path.write_text(text, encoding="utf-8")
print("done")
