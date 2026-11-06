"""Download recent @swing_elegance_ posts and append missing products as MODUS-EDGE SKUs."""

from __future__ import annotations

import json
import re
import ssl
import sys
import time
from pathlib import Path

ssl._create_default_https_context = ssl._create_unverified_context
import urllib3

urllib3.disable_warnings()
import requests

_old = requests.Session.request


def _req(self, *a, **k):
    k["verify"] = False
    return _old(self, *a, **k)


requests.Session.request = _req

import instaloader

ROOT = Path(__file__).resolve().parents[1]
IMG_DIR = ROOT / "public" / "images" / "ig"
DATA_JS = ROOT / "src" / "data.js"
MANIFEST = ROOT / "scripts" / "_ig_manifest.json"
USERNAME = "swing_elegance_"
LIMIT = 40


def js_escape(text: str) -> str:
    return text.replace("\\", "\\\\").replace('"', '\\"')


def clean_caption(raw: str | None) -> str:
    text = (raw or "").strip()
    text = re.sub(r"https?://\S+", "", text)
    text = re.sub(r"[#@]\w+", "", text)
    text = re.sub(r"\s+", " ", text).strip(" -–—|")
    return text


def guess_name(caption: str, shortcode: str) -> str:
    if not caption:
        return f"Course piece {shortcode[-4:].upper()}"
    # first sentence / line-ish
    chunk = re.split(r"[.!?\n|]", caption)[0].strip()
    chunk = re.sub(r"^(new|available|for sale|selling|dm|order)\s*[:\-–]?\s*", "", chunk, flags=re.I)
    if len(chunk) < 6:
        words = caption.split()
        chunk = " ".join(words[:8])
    if len(chunk) > 70:
        chunk = chunk[:67].rstrip() + "…"
    # Title case lightly if all caps / all lower
    if chunk.isupper() or chunk.islower():
        chunk = chunk.title()
    return chunk or f"Course piece {shortcode[-4:].upper()}"


def guess_group(name: str, caption: str) -> str:
    blob = f"{name} {caption}".lower()
    rules = [
        (r"polo|t-?shirt|shirt|tee\b", "shirts"),
        (r"jacket|hoodie|windbreaker|softshell", "jackets"),
        (r"dress|skirt|women|ladies", "women"),
        (r"shoe|sneaker|spike|footwear", "shoes"),
        (r"visor", "hats"),
        (r"cap|hat|beanie|bucket", "hats"),
        (r"towel", "accessories"),
        (r"umbrella", "umbrellas"),
        (r"bottle|tumbler|flask|drink", "bottles"),
        (r"bag|backpack|tote|duffel|caddie", "bags"),
        (r"glove", "accessories"),
        (r"club|iron|driver|putter|wedge", "clubs"),
        (r"pen|notebook|desk|power bank|usb|gift set|charger", "sets"),
    ]
    for pat, group in rules:
        if re.search(pat, blob):
            return group
    return "accessories"


def guess_price(caption: str) -> float:
    m = re.search(r"(?:USD|US\$|\$)\s*(\d+(?:\.\d{1,2})?)", caption, re.I)
    if m:
        return round(float(m.group(1)), 2)
    m = re.search(r"(\d+(?:\.\d{1,2})?)\s*(?:USD|\$)", caption, re.I)
    if m:
        return round(float(m.group(1)), 2)
    return 28.0


def product_js(item: dict) -> str:
    return f"""  {{
    id: "{item["id"]}",
    name: "{js_escape(item["name"])}",
    group: "{item["group"]}",
    price: {item["price"]},
    compareAt: null,
    badge: "New",
    featured: false,
    image: "{item["image"]}",
    colors: [{{ name: "As shown", image: "{item["image"]}" }}],
    blurb: "{js_escape(item["blurb"])}",
    details: "{js_escape(item["details"])}",
    highlights: ["MODUS-EDGE", "Logo ready", "From the shop feed"],
    specs: [
      ["Brand", "MODUS-EDGE"],
      ["Mark", "Ask desk"],
      ["Use", "Course / gift"],
      ["Colours", "As shown / on request"],
    ],
  }}"""


def existing_ids(text: str) -> set[str]:
    return set(re.findall(r'^\s*id:\s*"([^"]+)"', text, re.M))


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8", line_buffering=True)
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    L = instaloader.Instaloader(
        download_pictures=False,
        download_videos=False,
        download_video_thumbnails=False,
        save_metadata=False,
        compress_json=False,
        quiet=True,
    )
    print(f"loading @{USERNAME}…", flush=True)
    profile = instaloader.Profile.from_username(L.context, USERNAME)
    print(f"profile: {profile.full_name!r} · {profile.mediacount} posts", flush=True)
    print(f"bio: {profile.biography!r}", flush=True)

    data_text = DATA_JS.read_text(encoding="utf-8")
    have = existing_ids(data_text)
    items = []
    seen_codes = set()

    for post in profile.get_posts():
        if post.is_video:
            continue
        code = post.shortcode
        if code in seen_codes:
            continue
        seen_codes.add(code)
        pid = f"ig-{code.lower()}"
        if pid in have:
            print(f"  skip existing {pid}", flush=True)
            continue

        caption = clean_caption(post.caption)
        name = guess_name(caption, code)
        # Prefer MODUS-EDGE naming (strip swing elegance mentions)
        name = re.sub(r"swing[\s\-]?elegance_?", "MODUS-EDGE", name, flags=re.I)
        group = guess_group(name, caption)
        price = guess_price(caption)

        dest = IMG_DIR / f"{pid}.jpg"
        url = post.url
        if not dest.exists() or dest.stat().st_size < 2000:
            try:
                r = requests.get(url, timeout=60, verify=False)
                r.raise_for_status()
                dest.write_bytes(r.content)
            except Exception as exc:
                print(f"  image fail {pid}: {exc}", flush=True)
                continue

        blurb = f"{name} — ready for a MODUS-EDGE mark."
        details = (
            "From the shop feed. Blank areas take a company or club mark. "
            "Ask the desk for colour, size, and branding options."
        )
        if caption and len(caption) > 12:
            details = f"{caption[:220].rstrip()} Ask the desk for colour, size, and branding."

        item = {
            "id": pid,
            "name": name,
            "group": group,
            "price": price,
            "image": f"/images/ig/{pid}.jpg",
            "blurb": blurb,
            "details": details,
            "caption": caption,
            "shortcode": code,
        }
        items.append(item)
        print(f"  + {pid} [{group}] {name}", flush=True)
        if len(items) >= LIMIT:
            break
        time.sleep(0.2)

    MANIFEST.write_text(json.dumps(items, indent=2), encoding="utf-8")
    print(f"manifest {len(items)} items", flush=True)
    if not items:
        return

    block = ",\n".join(product_js(it) for it in items)
    # Insert before closing of products array
    marker = "\n];\n\nexport const stories"
    if marker not in data_text:
        raise SystemExit("products array end marker not found")
    # ensure previous product ends with comma
    insert_at = data_text.index(marker)
    before = data_text[:insert_at].rstrip()
    if not before.endswith(","):
        before += ","
    new_text = before + "\n" + block + marker + data_text[insert_at + len(marker) :]
    DATA_JS.write_text(new_text, encoding="utf-8")
    print(f"updated {DATA_JS} with {len(items)} Instagram products", flush=True)


if __name__ == "__main__":
    main()
