"""Fix broken midu specs left by scrub-midu-copy (nested-array regex bug)."""

from __future__ import annotations

import re
from pathlib import Path

DATA_JS = Path(__file__).resolve().parents[1] / "src" / "data.js"

CLEAN_SPECS = """specs: [
      ["Mark", "Logo print"],
      ["Use", "Corporate gift"],
      ["Colours", "As shown / on request"],
      ["Brand", "Ask desk"],
    ],"""

# Clean specs followed by leftover confidential rows and an extra closing ]
BROKEN = re.compile(
    r"specs: \[\n"
    r'      \["Mark", "Logo print"\],\n'
    r'      \["Use", "Corporate gift"\],\n'
    r'      \["Colours", "As shown / on request"\],\n'
    r'      \["Brand", "Ask desk"\],\n'
    r"    \],\n"
    r"(?:      \[[^\]]+\],\n)+"
    r"    \],",
)

# Also catch any remaining Source/MIDU/MOQ/Factory model wording
LEAK = re.compile(
    r'Factory model .*?options\."|'
    r'\["Source", "MIDU"\],?\n?|'
    r'\["MOQ", "Factory"\],?\n?|'
    r'\["Model", "[^"]+"\],?\n?',
)


def main() -> None:
    text = DATA_JS.read_text(encoding="utf-8")
    text2, n = BROKEN.subn(CLEAN_SPECS, text)
    print(f"fixed broken specs blocks: {n}")

    # Safety: rewrite any midu product still leaking confidential fields
    pattern = re.compile(r'\n  \{\n    id: "(midu-[^"]+)",')
    matches = list(pattern.finditer(text2))
    parts = []
    i = 0
    scrubbed = 0
    for idx, m in enumerate(matches):
        start = m.start() + 1
        if idx + 1 < len(matches):
            end = matches[idx + 1].start() + 1
        else:
            end_marker = text2.find("\n];\n\nexport const stories", m.start())
            if end_marker < 0:
                end_marker = text2.find("\n];", m.start())
            block_end = text2.rfind("\n  }", m.start(), end_marker) + len("\n  }")
            if text2[block_end : block_end + 1] == ",":
                block_end += 1
            end = block_end

        parts.append(text2[i:start])
        block = text2[start:end]

        # Replace entire specs: [...] with clean specs (greedy to outer close)
        def replace_specs(b: str) -> str:
            # Find specs: [ then match balanced brackets
            key = "specs: ["
            pos = b.find(key)
            if pos < 0:
                return b
            depth = 0
            j = pos + len("specs: ")
            start_br = j
            while j < len(b):
                ch = b[j]
                if ch == "[":
                    depth += 1
                elif ch == "]":
                    depth -= 1
                    if depth == 0:
                        # include trailing comma if present
                        end_br = j + 1
                        if end_br < len(b) and b[end_br] == ",":
                            end_br += 1
                        return b[:pos] + CLEAN_SPECS + b[end_br:]
                j += 1
            return b

        new_block = replace_specs(block)
        # Also scrub details/highlights/blurb if still leaking
        if "MIDU" in new_block or "Factory model" in new_block or "MOQ" in new_block:
            nm = re.search(r'name: "((?:\\.|[^"\\])*)"', new_block)
            name = nm.group(1).replace('\\"', '"') if nm else "Corporate gift"
            short = name if len(name) <= 80 else name[:77].rstrip() + "…"
            new_block = re.sub(
                r'blurb: "(?:\\.|[^"\\])*",',
                f'blurb: "{short} — ready for a logo mark.",',
                new_block,
                count=1,
            )
            new_block = re.sub(
                r'details: "(?:\\.|[^"\\])*",',
                'details: "Blank areas take a company mark. Ask the desk for colour and branding options.",',
                new_block,
                count=1,
            )
            new_block = re.sub(
                r"highlights: \[[^\]]*\],",
                'highlights: ["Corporate gift", "Logo ready", "Blank for mark"],',
                new_block,
                count=1,
            )
            scrubbed += 1
        parts.append(new_block)
        i = end

    parts.append(text2[i:])
    out = "".join(parts)
    DATA_JS.write_text(out, encoding="utf-8")
    print(f"rewrote specs on {len(matches)} midu products; extra scrub {scrubbed}")

    # Final leak check on file text for midu section
    leaks = []
    for term in ("Source\", \"MIDU", "MOQ\", \"Factory", "Factory model", "from the MIDU"):
        if term in out:
            leaks.append(term)
    print("remaining leak terms:", leaks or "none")


if __name__ == "__main__":
    main()
