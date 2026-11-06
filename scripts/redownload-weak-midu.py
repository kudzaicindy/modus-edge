"""Re-download only small/weak MIDU hero JPEGs from canonical upload URLs."""

from __future__ import annotations

import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMG_DIR = ROOT / "public" / "images" / "midu"
BASE = "https://miducustomgift.com"
MIN_KEEP = 40_000


def download(url: str) -> bytes | None:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 ModusEdgeImport/1.0"})
        with urllib.request.urlopen(req, timeout=25) as res:
            return res.read()
    except Exception as exc:
        print(f"  fail {url}: {exc}", flush=True)
        return None


def main() -> None:
    files = sorted(IMG_DIR.glob("midu-*.jpg"))
    weak = [p for p in files if p.stat().st_size < MIN_KEEP]
    print(f"weak heroes: {len(weak)} / {len(files)}", flush=True)
    improved = 0
    for path in weak:
        slug = path.stem.removeprefix("midu-")
        model = "M-" + slug.upper()
        urls = [
            f"{BASE}/static/uploads/{model}/{model}.jpg",
            f"{BASE}/static/uploads/{model}/{model}_1.jpg",
            f"{BASE}/static/uploads/{model}/{model}_2.jpg",
            f"{BASE}/static/uploads/{model}/{model}_01.jpg",
            f"{BASE}/static/uploads/{model}/{model}_02.jpg",
        ]
        before = path.stat().st_size
        best = None
        for url in urls:
            data = download(url)
            if data and len(data) > (best[0] if best else before):
                best = (len(data), data, url)
            time.sleep(0.05)
        if best and best[0] > before:
            path.write_bytes(best[1])
            improved += 1
            print(f"  {path.name}: {before} -> {best[0]}  {best[2]}", flush=True)
        else:
            print(f"  keep {path.name} ({before}b)", flush=True)
    print(f"improved {improved}", flush=True)


if __name__ == "__main__":
    # unbuffered
    sys.stdout.reconfigure(line_buffering=True)
    main()
