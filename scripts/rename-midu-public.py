"""Rename public midu-* IDs and image paths to neutral me-* / gifts/ (no factory name)."""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OLD_DIR = ROOT / "public" / "images" / "midu"
NEW_DIR = ROOT / "public" / "images" / "gifts"
DATA_JS = ROOT / "src" / "data.js"


def rename_file(path: Path) -> Path:
    name = path.name
    if name.startswith("midu-"):
        name = "me-" + name.removeprefix("midu-")
    return path.with_name(name)


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8", line_buffering=True)
    if not OLD_DIR.exists():
        raise SystemExit(f"missing {OLD_DIR}")

    if NEW_DIR.exists():
        shutil.rmtree(NEW_DIR)
    NEW_DIR.mkdir(parents=True)

    moved = 0
    for src in OLD_DIR.rglob("*"):
        if not src.is_file():
            continue
        rel = src.relative_to(OLD_DIR)
        dest = NEW_DIR / rel
        dest = dest.parent / rename_file(dest).name
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dest)
        moved += 1
    print(f"copied {moved} files into {NEW_DIR}", flush=True)

    text = DATA_JS.read_text(encoding="utf-8")
    # Order matters: longer path first
    text2 = text.replace("/images/midu/colors/midu-", "/images/gifts/colors/me-")
    text2 = text2.replace("/images/midu/midu-", "/images/gifts/me-")
    text2 = text2.replace("/images/midu/", "/images/gifts/")
    text2 = text2.replace('id: "midu-', 'id: "me-')
    # any leftover midu- in image filenames inside data
    text2 = text2.replace("midu-", "me-")
    DATA_JS.write_text(text2, encoding="utf-8")
    print("updated data.js ids and paths", flush=True)

    # Remove old public folder after successful rewrite
    shutil.rmtree(OLD_DIR)
    print(f"removed {OLD_DIR}", flush=True)


if __name__ == "__main__":
    main()
