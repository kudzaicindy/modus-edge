"""Re-download sharper MIDU product images from detail pages; drop bad colour crops."""

from __future__ import annotations

import re
import ssl
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_JS = ROOT / "src" / "data.js"
IMG_DIR = ROOT / "public" / "images" / "midu"
BASE = "https://miducustomgift.com"
CTX = ssl.create_default_context()


def fetch(url: str) -> str:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; ModusEdgeImport/1.0)",
            "Accept": "text/html,application/xhtml+xml",
        },
    )
    with urllib.request.urlopen(req, context=CTX, timeout=45) as res:
        return res.read().decode("utf-8", "ignore")


def download(url: str, dest: Path, force: bool = False) -> bool:
    if dest.exists() and dest.stat().st_size > 40_000 and not force:
        return True
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 ModusEdgeImport/1.0"})
        with urllib.request.urlopen(req, context=CTX, timeout=60) as res:
            data = res.read()
        if len(data) < 800:
            return False
        # Keep existing if new download is not clearly better
        if dest.exists() and dest.stat().st_size >= len(data) and not force:
            return True
        dest.write_bytes(data)
        return True
    except Exception as exc:
        print("  fail", url, exc)
        return False


def abs_url(src: str) -> str:
    if src.startswith("http"):
        return src
    if src.startswith("/"):
        return BASE + src
    return BASE + "/" + src


def best_images(html: str, model: str) -> list[str]:
    urls = []
    # Canonical upload folder first: /static/uploads/M-PB406/M-PB406.jpg
    folder = model.upper()
    for m in re.finditer(
        rf'(?:src|data-src|data-lazy-src|href)=["\']([^"\']*{re.escape(folder)}[^"\']*\.(?:jpg|jpeg|png|webp)[^"\']*)["\']',
        html,
        re.I,
    ):
        urls.append(m.group(1))
    # Also list files referenced under that uploads folder in JS/JSON
    for m in re.finditer(
        rf'["\']([^"\']*/static/uploads/{re.escape(folder)}/[^"\']+\.(?:jpg|jpeg|png|webp))["\']',
        html,
        re.I,
    ):
        urls.append(m.group(1))
    # Prefer exact model filename
    preferred = f"/static/uploads/{folder}/{folder}.jpg"
    urls.insert(0, preferred)
    # gallery / other product images
    for m in re.finditer(
        r'(?:src|data-src|data-lazy-src|href)=["\']([^"\']+\.(?:jpg|jpeg|png|webp)(?:\?[^"\']*)?)["\']',
        html,
        re.I,
    ):
        u = m.group(1)
        if any(x in u.lower() for x in ("logo", "icon", "favicon", "sprite", "avatar", "flag")):
            continue
        urls.append(u)
    scored = []
    seen = set()
    for u in urls:
        full = abs_url(u)
        if full in seen:
            continue
        seen.add(full)
        score = 0
        low = full.lower()
        if folder.lower() in low:
            score += 20
        if low.rstrip("/").endswith(f"{folder.lower()}.jpg") or low.rstrip("/").endswith(
            f"{folder.lower()}.jpeg"
        ):
            score += 30
        if "upload" in low:
            score += 5
        if any(x in low for x in ("-150x", "-300x", "-100x", "thumb", "thumbnail")):
            score -= 10
        if any(x in low for x in ("_2", "_3", "_03", "_04")):
            score += 2
        scored.append((score, full))
    scored.sort(key=lambda x: -x[0])
    return [u for _, u in scored]


def upscale_url(url: str) -> list[str]:
    """Try common WordPress size strip variants for a sharper file."""
    variants = [url]
    # strip -WxH before extension
    stripped = re.sub(r"-\d{2,4}x\d{2,4}(?=\.(?:jpg|jpeg|png|webp))", "", url, flags=re.I)
    if stripped != url:
        variants.insert(0, stripped)
    return variants


def midu_ids(text: str) -> list[str]:
    return re.findall(r'id: "(midu-[^"]+)"', text)


def hero_path(pid: str) -> Path:
    return IMG_DIR / f"{pid}.jpg"


def main() -> None:
    text = DATA_JS.read_text(encoding="utf-8")
    ids = midu_ids(text)
    print(f"refreshing images for {len(ids)} midu products")

    refreshed = 0
    for pid in ids:
        slug = "m-" + pid.removeprefix("midu-")
        model = "M-" + pid.removeprefix("midu-").upper()
        dest = hero_path(pid)
        url = f"{BASE}/en/product/{slug}/"
        try:
            html = fetch(url)
        except Exception as exc:
            print(f"  skip {pid}: {exc}")
            continue
        candidates = best_images(html, model)
        if not candidates:
            print(f"  no images {pid}")
            continue
        ok = False
        # Always try canonical upload; replace if new file is larger
        before = dest.stat().st_size if dest.exists() else 0
        force = True
        for cand in candidates[:8]:
            for variant in upscale_url(cand):
                tmp = dest.with_suffix(".tmp.jpg")
                if download(variant, tmp, force=True):
                    size = tmp.stat().st_size
                    if size > before or (size > 20_000 and before < 40_000):
                        if dest.exists():
                            dest.unlink()
                        tmp.replace(dest)
                        before = size
                        ok = True
                        break
                    tmp.unlink(missing_ok=True)
            if ok and before > 40_000:
                break
        if ok:
            refreshed += 1
            print(f"  ok {pid} {dest.stat().st_size}b from {slug}")
        else:
            print(f"  weak {pid} keep {before}b")
        time.sleep(0.12)

    # Point every midu product at its hero; drop /colors/ crops from main image + colors
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
        if "/colors/" in block or f'image: "{hero}"' not in block:
            # replace image field
            block2 = re.sub(r'image: "/images/midu/[^"]+"', f'image: "{hero}"', block, count=1)
            # replace colors array with As shown hero (balanced)
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
                            # Keep named tone-only colours if present without crop paths
                            old_colors = block2[pos:end_br]
                            if "/colors/" in old_colors or "As shown" in old_colors or old_colors.count("name:") <= 1:
                                new_colors = f'colors: [{{ name: "As shown", image: "{hero}" }}],'
                                block2 = block2[:pos] + new_colors + block2[end_br:]
                            else:
                                # strip image: crop paths from colour entries; keep names
                                cleaned = re.sub(
                                    r',\s*image:\s*"/images/midu/colors/[^"]+"',
                                    "",
                                    old_colors,
                                )
                                # if entries still have other image paths under midu hero, leave; else tone only
                                cleaned = re.sub(
                                    r',\s*image:\s*"/images/midu/midu-[^"]+"',
                                    "",
                                    cleaned,
                                )
                                block2 = block2[:pos] + cleaned + block2[end_br:]
                            cleared += 1
                            break
                    j += 1
            block = block2
        parts.append(block)
        i = end
    parts.append(text[i:])
    DATA_JS.write_text("".join(parts), encoding="utf-8")
    print(f"refreshed files: {refreshed}; cleared crop refs on ~{cleared} blocks")


if __name__ == "__main__":
    main()
