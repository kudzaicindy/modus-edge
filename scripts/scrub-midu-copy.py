"""Remove confidential MIDU/factory wording from public catalogue copy."""

from __future__ import annotations

import re
from pathlib import Path

DATA_JS = Path(__file__).resolve().parents[1] / "src" / "data.js"

BLOCK_RE = re.compile(
    r'(\{\n    id: "(midu-[^"]+)",\n'
    r'    name: ("(?:\\.|[^"\\])*"),\n'
    r'    group: "[^"]+",\n'
    r"    price: [^,]+,\n"
    r"    compareAt: [^,]+,\n"
    r"    badge: [^,]+,\n"
    r"    featured: [^,]+,\n"
    r'    image: "[^"]+",\n'
    r"    colors: \[[\s\S]*?\],\n"
    r"    blurb: )\"(?:\\.|[^\"\\])*\",\n"
    r"    details: \"(?:\\.|[^\"\\])*\",\n"
    r"    highlights: \[[\s\S]*?\],\n"
    r"    specs: \[[\s\S]*?\],\n"
    r"  \}"
)


def scrub_name(raw: str) -> str:
    text = raw.strip().strip('"')
    # Unescape simple JS string escapes used in data.js
    text = text.replace('\\"', '"').replace("\\n", " ")
    return text


def public_copy(name: str) -> tuple[str, str, str, str]:
    short = name if len(name) <= 80 else name[:77].rstrip() + "…"
    blurb = f"{short} — ready for a logo mark."
    details = (
        "Blank areas take a company mark. Ask the desk for colour and branding options."
    )
    highlights = '["Corporate gift", "Logo ready", "Blank for mark"]'
    specs = """[
      ["Mark", "Logo print"],
      ["Use", "Corporate gift"],
      ["Colours", "As shown / on request"],
      ["Brand", "Ask desk"],
    ]"""
    return blurb, details, highlights, specs


def main():
    text = DATA_JS.read_text(encoding="utf-8")
    count = 0

    def repl(match: re.Match) -> str:
        nonlocal count
        full = match.group(0)
        pid = match.group(2)
        name = scrub_name(match.group(3))
        blurb, details, highlights, specs = public_copy(name)

        # Replace only the trailing marketing fields, keep id/name/group/media.
        head = full[: match.start(1) - match.start(0)]
        # match.group(1) is the "blurb: " prefix capture start inside the object —
        # easier to rebuild from colors close.
        colors_end = full.rfind("colors:")
        # Find end of colors array.
        after_colors = full[colors_end:]
        # colors: [ ... ],
        m_colors = re.search(r"colors: \[[\s\S]*?\],\n", after_colors)
        if not m_colors:
            return full
        prefix = full[: colors_end + m_colors.end()]
        rebuilt = (
            f'{prefix}    blurb: "{blurb}",\n'
            f'    details: "{details}",\n'
            f"    highlights: {highlights},\n"
            f"    specs: {specs},\n"
            f"  }}"
        )
        count += 1
        return rebuilt

    # Simpler line-based rewrite per midu product block.
    parts = []
    i = 0
    pattern = re.compile(r'\n  \{\n    id: "(midu-[^"]+)",')
    matches = list(pattern.finditer(text))
    if not matches:
        raise SystemExit("No midu products found")

    for idx, m in enumerate(matches):
        start = m.start() + 1  # keep leading newline outside
        end = matches[idx + 1].start() + 1 if idx + 1 < len(matches) else None
        # Find end of this object: next product or stories export.
        if end is None:
            end_marker = text.find("\n];\n\nexport const stories", m.start())
            if end_marker < 0:
                end_marker = text.find("\n];", m.start())
            # include through closing `  },` or `  }`
            block_end = text.rfind("\n  }", m.start(), end_marker) + len("\n  }")
            # keep trailing comma if present
            if text[block_end : block_end + 1] == ",":
                block_end += 1
            end = block_end
        else:
            end = matches[idx + 1].start() + 1

        parts.append(text[i:start])
        block = text[start:end]
        # Extract name
        nm = re.search(r'name: "((?:\\.|[^"\\])*)"', block)
        name = scrub_name(f'"{nm.group(1)}"') if nm else "Corporate gift"
        blurb, details, highlights, specs = public_copy(name)

        block2, n1 = re.subn(
            r'blurb: "(?:\\.|[^"\\])*",',
            f'blurb: "{blurb}",',
            block,
            count=1,
        )
        block2, n2 = re.subn(
            r'details: "(?:\\.|[^"\\])*",',
            f'details: "{details}",',
            block2,
            count=1,
        )
        block2, n3 = re.subn(
            r"highlights: \[[^\]]*\],",
            f"highlights: {highlights},",
            block2,
            count=1,
        )

        def replace_specs(b: str) -> tuple[str, int]:
            key = "specs: ["
            pos = b.find(key)
            if pos < 0:
                return b, 0
            depth = 0
            j = pos + len("specs: ")
            while j < len(b):
                ch = b[j]
                if ch == "[":
                    depth += 1
                elif ch == "]":
                    depth -= 1
                    if depth == 0:
                        end_br = j + 1
                        if end_br < len(b) and b[end_br] == ",":
                            end_br += 1
                        return b[:pos] + f"specs: {specs}," + b[end_br:], 1
                j += 1
            return b, 0

        block2, n4 = replace_specs(block2)
        if min(n1, n2, n3, n4) < 1:
            print("WARN incomplete", m.group(1), n1, n2, n3, n4)
        else:
            count += 1
        parts.append(block2)
        i = end

    parts.append(text[i:])
    DATA_JS.write_text("".join(parts), encoding="utf-8")
    print(f"scrubbed {count} midu products in {DATA_JS}")


if __name__ == "__main__":
    main()
