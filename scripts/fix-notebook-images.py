"""Re-download correct MIDU notebook images and clean duplicate/garbled notebook entries."""

from __future__ import annotations

import re
import ssl
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMG_DIR = ROOT / "public" / "images" / "midu"
DATA_JS = ROOT / "src" / "data.js"
BASE = "https://miducustomgift.com"
CTX = ssl.create_default_context()

# SKUs that currently share one wrong photo
TARGETS = ["midu-sn07", "midu-nb89", "midu-nb86", "midu-nb84"]

NAME_FIX = {
    "midu-sn07": {
        "name": "Sticky Memo Box",
        "blurb": "A sticky memo box ready for a company mark.",
        "details": "Desk memo set with blank faces for a logo. Ask the desk for colour and branding options.",
        "highlights": '["Memo box", "Desk gift", "Logo ready"]',
    },
    "midu-nb89": {
        "name": "A5 Loose-Leaf Inner Pages",
        "blurb": "Custom A5 loose-leaf refill pages for promotional notebooks.",
        "details": "Inner pages for business and promotional gifts. Ask the desk for branding options.",
        "highlights": '["A5 refill", "Loose leaf", "Logo ready"]',
    },
    "midu-nb86": {
        "name": "PU Leather A5 Notebook",
        "blurb": "A premium PU leather A5 notebook for corporate gifting.",
        "details": "Perfect-bound A5 with a blank cover for a company mark. Ask the desk for colour options.",
        "highlights": '["A5 notebook", "PU leather", "Logo ready"]',
    },
    "midu-nb84": {
        "name": "A5 Notebook Business Set",
        "blurb": "A multi-functional A5 PU leather notebook business set.",
        "details": "Notebook set for desk and corporate gifts. Blank cover for a mark. Ask the desk for options.",
        "highlights": '["Business set", "A5 notebook", "Logo ready"]',
    },
}


def fetch(url: str) -> bytes | str:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 ModusEdgeImport/1.0"})
    with urllib.request.urlopen(req, context=CTX, timeout=45) as res:
        return res.read()


def product_image_urls(html: str, model: str) -> list[str]:
    urls = []
    for m in re.finditer(
        rf'["\']([^"\']*/static/uploads/{re.escape(model)}/[^"\']+\.(?:jpg|jpeg|png|webp))["\']',
        html,
        re.I,
    ):
        u = m.group(1)
        full = u if u.startswith("http") else BASE + (u if u.startswith("/") else "/" + u)
        if full not in urls:
            urls.append(full)
    # canonical first
    canon = f"{BASE}/static/uploads/{model}/{model}.jpg"
    if canon not in urls:
        urls.insert(0, canon)
    else:
        urls.remove(canon)
        urls.insert(0, canon)
    return urls


def download_best(pid: str) -> bool:
    model = "M-" + pid.removeprefix("midu-").upper()
    dest = IMG_DIR / f"{pid}.jpg"
    page = f"{BASE}/en/product/m-{pid.removeprefix('midu-')}/"
    try:
        html = fetch(page).decode("utf-8", "ignore")
    except Exception as exc:
        print(f"  page fail {pid}: {exc}", flush=True)
        return False
    best = None
    for url in product_image_urls(html, model)[:8]:
        try:
            data = fetch(url)
            if isinstance(data, str):
                data = data.encode()
            if best is None or len(data) > len(best[0]):
                best = (data, url)
        except Exception as exc:
            print(f"  skip {url}: {exc}", flush=True)
    if not best or len(best[0]) < 3000:
        print(f"  weak {pid}", flush=True)
        return False
    dest.write_bytes(best[0])
    print(f"  ok {pid} {len(best[0])}b <- {best[1]}", flush=True)
    return True


def replace_field(block: str, key: str, value_js: str) -> str:
    if key == "highlights":
        return re.sub(r"highlights: \[[^\]]*\],", f"highlights: {value_js},", block, count=1)
    return re.sub(
        rf'{key}:\s*"(?:\\.|[^"\\])*"',
        f'{key}: "{value_js}"',
        block,
        count=1,
    )


def esc(s: str) -> str:
    return s.replace("\\", "\\\\").replace('"', '\\"')


def scrub_data() -> None:
    text = DATA_JS.read_text(encoding="utf-8")
    pattern = re.compile(r'\n  \{\n    id: "(midu-(?:sn07|nb89|nb86|nb84))",')
    matches = list(pattern.finditer(text))
    parts = []
    i = 0
    for idx, m in enumerate(matches):
        start = m.start() + 1
        pid = m.group(1)
        if idx + 1 < len(matches):
            end = matches[idx + 1].start() + 1
        else:
            # end of this product object
            nxt = re.search(r"\n  \{\n    id:", text[m.end() :])
            end = m.end() + nxt.start() if nxt else None
            if end is None:
                end_marker = text.find("\n];\n\nexport const stories", m.start())
                block_end = text.rfind("\n  }", m.start(), end_marker) + len("\n  }")
                if text[block_end : block_end + 1] == ",":
                    block_end += 1
                end = block_end
        parts.append(text[i:start])
        block = text[start:end]
        fix = NAME_FIX[pid]
        block = replace_field(block, "name", esc(fix["name"]))
        block = replace_field(block, "blurb", esc(fix["blurb"]))
        block = replace_field(block, "details", esc(fix["details"]))
        block = replace_field(block, "highlights", fix["highlights"])
        parts.append(block)
        i = end
    parts.append(text[i:])
    DATA_JS.write_text("".join(parts), encoding="utf-8")
    print(f"scrubbed names for {len(matches)} notebooks", flush=True)


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8", line_buffering=True)
    for pid in TARGETS:
        # force overwrite even if file exists
        path = IMG_DIR / f"{pid}.jpg"
        if path.exists():
            path.unlink()
        download_best(pid)
    scrub_data()
    # verify uniqueness
    import hashlib

    hashes = {}
    for pid in TARGETS:
        data = (IMG_DIR / f"{pid}.jpg").read_bytes()
        h = hashlib.sha256(data).hexdigest()[:12]
        hashes.setdefault(h, []).append(pid)
        print(f"  hash {pid} {h} {len(data)}b", flush=True)
    dupes = {h: ids for h, ids in hashes.items() if len(ids) > 1}
    print("duplicate groups:", dupes or "none", flush=True)


if __name__ == "__main__":
    main()
