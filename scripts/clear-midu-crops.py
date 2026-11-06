"""Point every midu product at its hero photo; drop broken /colors/ crop thumbs."""

from __future__ import annotations

import re
from pathlib import Path

DATA_JS = Path(__file__).resolve().parents[1] / "src" / "data.js"


def main() -> None:
    text = DATA_JS.read_text(encoding="utf-8")
    pattern = re.compile(r'\n  \{\n    id: "(midu-[^"]+)",')
    matches = list(pattern.finditer(text))
    parts = []
    i = 0
    cleared = 0

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
        hero = f"/images/midu/{pid}.jpg"

        # Always set main image to hero
        block2, n_img = re.subn(
            r'image: "/images/midu/[^"]+"',
            f'image: "{hero}"',
            block,
            count=1,
        )

        # Replace colors array
        key = "colors: ["
        pos = block2.find(key)
        if pos >= 0:
            depth = 0
            j = pos + len("colors: ")
            while j < len(block2):
                if block2[j] == "[":
                    depth += 1
                elif block2[j] == "]":
                    depth -= 1
                    if depth == 0:
                        end_br = j + 1
                        if end_br < len(block2) and block2[end_br] == ",":
                            end_br += 1
                        old = block2[pos:end_br]
                        names = re.findall(r'name:\s*"([^"]+)"', old)
                        # Keep useful named colours as tone-only (no crop image)
                        keep = [
                            n
                            for n in names
                            if n
                            and not re.match(r"^(as shown|default)$", n, re.I)
                            and "/colors/" not in old  # if crops present, rebuild cleanly
                        ]
                        # If old used crops, rebuild as As shown OR tone-only from names
                        if "/colors/" in old:
                            if keep and len(keep) >= 2:
                                entries = ", ".join(f'{{ name: "{n}" }}' for n in keep)
                                new = f"colors: [{entries}],"
                            else:
                                new = f'colors: [{{ name: "As shown", image: "{hero}" }}],'
                            block2 = block2[:pos] + new + block2[end_br:]
                            cleared += 1
                        elif n_img:
                            # ensure As shown points at hero when single colour with image path
                            if len(names) <= 1:
                                new = f'colors: [{{ name: "As shown", image: "{hero}" }}],'
                                block2 = block2[:pos] + new + block2[end_br:]
                        break
                j += 1

        if block2 != block:
            cleared += 1
        parts.append(block2)
        i = end

    parts.append(text[i:])
    DATA_JS.write_text("".join(parts), encoding="utf-8")
    print(f"cleared/normalized {cleared} midu product image blocks")


if __name__ == "__main__":
    main()
