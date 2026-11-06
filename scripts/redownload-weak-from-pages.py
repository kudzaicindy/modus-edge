"""For remaining small heroes, scrape the product page for the real upload URL."""

from __future__ import annotations

import re
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMG_DIR = ROOT / "public" / "images" / "midu"
BASE = "https://miducustomgift.com"
MIN_KEEP = 40_000


def fetch(url: str) -> str | None:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=25) as res:
            return res.read().decode("utf-8", "ignore")
    except Exception as exc:
        print(f"  page fail {url}: {exc}", flush=True)
        return None


def download(url: str) -> bytes | None:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=25) as res:
            return res.read()
    except Exception as exc:
        print(f"  dl fail {url}: {exc}", flush=True)
        return None


def main() -> None:
    sys.stdout.reconfigure(line_buffering=True)
    weak = [p for p in sorted(IMG_DIR.glob("midu-*.jpg")) if p.stat().st_size < MIN_KEEP]
    print(f"still weak: {len(weak)}", flush=True)
    improved = 0
    for path in weak:
        slug = path.stem.removeprefix("midu-")
        model = "M-" + slug.upper()
        page = f"{BASE}/en/product/m-{slug}/"
        html = fetch(page)
        if not html:
            continue
        # Collect uploads for this model only
        urls = re.findall(
            rf'["\']([^"\']*/static/uploads/{re.escape(model)}/[^"\']+\.(?:jpg|jpeg|png|webp))["\']',
            html,
            re.I,
        )
        # also any img under uploads mentioning model
        urls += re.findall(
            rf'(?:src|href)=["\']([^"\']*{re.escape(model)}[^"\']*\.(?:jpg|jpeg|png|webp))["\']',
            html,
            re.I,
        )
        seen = []
        for u in urls:
            full = u if u.startswith("http") else BASE + (u if u.startswith("/") else "/" + u)
            if full not in seen:
                seen.append(full)
        before = path.stat().st_size
        best = None
        for url in seen:
            data = download(url)
            if data and len(data) > (best[0] if best else before):
                best = (len(data), data, url)
            time.sleep(0.05)
        if best and best[0] > before:
            path.write_bytes(best[1])
            improved += 1
            print(f"  {path.name}: {before} -> {best[0]}", flush=True)
        else:
            print(f"  keep {path.name} ({before}b) candidates={len(seen)}", flush=True)
        time.sleep(0.1)
    print(f"improved {improved}", flush=True)


if __name__ == "__main__":
    main()
