"""
Scrape MIDU category listings, download images, append products to src/data.js.
Target: category-complete import (~130 new SKUs) without cloning all 1025 models.
"""
from __future__ import annotations

import json
import re
import ssl
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_JS = ROOT / "src" / "data.js"
IMG_DIR = ROOT / "public" / "images" / "midu"
MANIFEST = ROOT / "scripts" / "_midu_manifest.json"
GENERATED = ROOT / "scripts" / "_midu_products.js"

BASE = "https://miducustomgift.com"
CTX = ssl.create_default_context()

# category slug -> (shop group, max products to import)
CATEGORIES = {
    "gift-sets": ("sets", 18),
    "power-notebooks": ("power-notebooks", 12),
    "power-banks": ("power-banks", 14),
    "notebooks": ("notebooks", 10),
    "pens": ("pens", 8),
    "usb-drives": ("usb", 10),
    "wireless-chargers": ("chargers", 12),
    "drinkware": ("bottles", 12),
    "bags": ("bags", 10),
    "umbrellas": ("umbrellas", 8),
    "keychains": ("keychains", 2),
    "card-holders": ("card-holders", 2),
    "phone-stands": ("phone-stands", 3),
    "desk-organizers": ("desk", 2),
    "lanyards-badges": ("lanyards", 3),
    "hats": ("hats", 6),
    # Map apparel into real shop lines (not "Other promotional")
    "apparel": ("shirts", 8),
}

# Skip titles that collide with existing local photography SKUs
DEDUPE_TITLE_RE = re.compile(
    r"""(?ix)
    (?:
      power\s*notebook(?:\s*clock)? |
      slim\s*power\s*bank |
      cable\s*power\s*bank |
      metal\s*usb |
      wireless\s*charge\s*pad |
      charge\s*cup |
      leather\s*a5\s*notebook |
      metal\s*(?:gift\s*)?pen |
      wood\s*(?:face\s*)?keyring |
      desk\s*organizer |
      card\s*holder |
      phone\s*stand |
      event\s*lanyard |
      mini\s*(?:desk\s*)?fan |
      velvet\s*(?:gift\s*)?pouch |
      cotton\s*tote |
      cooler\s*lunch |
      golf\s*umbrella |
      fold\s*umbrella
    )
    """
)

MARKUP = 2.5


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


def download(url: str, dest: Path) -> bool:
    if dest.exists() and dest.stat().st_size > 1000:
        return True
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 ModusEdgeImport/1.0"})
        with urllib.request.urlopen(req, context=CTX, timeout=60) as res:
            dest.write_bytes(res.read())
        return dest.stat().st_size > 500
    except Exception as exc:
        print("  image fail", url, exc)
        return False


def abs_url(src: str) -> str:
    if src.startswith("http"):
        return src
    if src.startswith("/"):
        return BASE + src
    return BASE + "/" + src


def clean_title(raw: str) -> str:
    import html as html_lib

    text = re.sub(r"<[^>]+>", "", raw or "")
    text = html_lib.unescape(text)
    text = re.sub(r"\s+", " ", text).strip(" :：")
    # Prefer readable names over empty "Gift box contain"
    if len(text) < 4 or text.lower().startswith("gift box contain"):
        return ""
    if len(text) > 90:
        text = text[:87].rstrip() + "…"
    return text


def parse_price(low: str | None, high: str | None) -> float | None:
    try:
        a = float(low) if low else None
        b = float(high) if high else a
        if a is None:
            return None
        mid = (a + (b or a)) / 2
        return round(max(mid * MARKUP, 4), 2)
    except Exception:
        return None


def parse_cards(html: str) -> list[dict]:
    cards = []
    for block in re.findall(
        r'<article class="product-card">([\s\S]*?)</article>',
        html,
        re.I,
    ):
        slug_m = re.search(r"/en/product/(m-[a-z0-9-]+)", block, re.I)
        if not slug_m:
            continue
        slug = slug_m.group(1).lower()
        model_m = re.search(r"Model:\s*(M-[A-Z0-9]+)", block, re.I)
        model = (model_m.group(1) if model_m else slug.upper().replace("M-", "M-")).upper()
        if not model.startswith("M-"):
            model = "M-" + model

        img_m = re.search(r'<img[^>]+src="([^"]+)"', block, re.I)
        alt_m = re.search(r'<img[^>]+alt="([^"]*)"', block, re.I)
        h3_m = re.search(r"<h3[^>]*>\s*<a[^>]*>([\s\S]*?)</a>", block, re.I)
        title = clean_title(h3_m.group(1) if h3_m else "") or clean_title(alt_m.group(1) if alt_m else "")
        if not title:
            title = model.replace("-", " ")

        price_m = re.search(
            r"Est\.\s*\$([0-9.]+)\s*[–\-\u2013\u2014]\s*([0-9.]+)|Est\.\s*\$([0-9.]+)",
            block,
            re.I,
        )
        if price_m:
            if price_m.group(1):
                price = parse_price(price_m.group(1), price_m.group(2))
            else:
                price = parse_price(price_m.group(3), None)
        else:
            price = None

        cards.append(
            {
                "slug": slug,
                "model": model,
                "title": title,
                "price": price,
                "image": abs_url(img_m.group(1)) if img_m else None,
            }
        )
    # unique by slug, keep first
    seen = set()
    out = []
    for card in cards:
        if card["slug"] in seen:
            continue
        seen.add(card["slug"])
        out.append(card)
    return out


def scrape_category(slug: str, limit: int) -> list[dict]:
    collected = []
    page = 1
    seen = set()
    while len(collected) < limit and page <= 40:
        url = f"{BASE}/en/products/{slug}/?page={page}"
        try:
            html = fetch(url)
        except Exception as exc:
            print(f"  page fail {url}: {exc}")
            break
        cards = parse_cards(html)
        new = [c for c in cards if c["slug"] not in seen]
        if not new:
            break
        for card in new:
            seen.add(card["slug"])
            collected.append(card)
            if len(collected) >= limit:
                break
        page += 1
        time.sleep(0.15)
    return collected[:limit]


def js_escape(text: str) -> str:
    return text.replace("\\", "\\\\").replace('"', '\\"')


def product_js(item: dict) -> str:
    pid = item["id"]
    name = js_escape(item["name"])
    group = item["group"]
    price = item["price"]
    image = item["image"]
    blurb = js_escape(item["blurb"])
    details = js_escape(item["details"])
    model = item["model"]
    return f"""  {{
    id: "{pid}",
    name: "{name}",
    group: "{group}",
    price: {price},
    compareAt: null,
    badge: "New",
    featured: false,
    image: "{image}",
    colors: [{{ name: "As shown", image: "{image}" }}],
    blurb: "{blurb}",
    details: "{details}",
    highlights: ["Corporate gift", "Logo ready", "Blank for mark"],
    specs: [
      ["Mark", "Logo print"],
      ["Use", "Corporate gift"],
      ["Colours", "As shown / on request"],
      ["Brand", "Ask desk"],
    ],
  }}"""


def existing_ids(text: str) -> set[str]:
    return set(re.findall(r'^\s*id:\s*"([^"]+)"', text, re.M))


def main():
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    data_text = DATA_JS.read_text(encoding="utf-8")
    have_ids = existing_ids(data_text)

    manifest = []
    for cat, (group, limit) in CATEGORIES.items():
        print(f"scrape {cat} -> {group} (max {limit})")
        cards = scrape_category(cat, limit * 2)  # oversample before dedupe
        kept = []
        for card in cards:
            pid = "midu-" + card["slug"].removeprefix("m-").replace("_", "-")
            if pid in have_ids:
                continue
            if DEDUPE_TITLE_RE.search(card["title"] or ""):
                print(f"  skip dup title: {card['title']}")
                continue
            if not card.get("image"):
                continue
            # default price if missing
            price = card["price"] if card["price"] is not None else 18.0
            fname = f"midu-{card['slug'].removeprefix('m-')}.jpg"
            dest = IMG_DIR / fname
            ok = download(card["image"], dest)
            if not ok:
                continue
            item = {
                "id": pid,
                "model": card["model"],
                "name": card["title"],
                "group": group,
                "price": price,
                "image": f"/images/midu/{fname}",
                "blurb": f"{card['title']} — ready for a logo mark.",
                "details": (
                    "Blank areas take a company mark. "
                    "Ask the desk for colour and branding options."
                ),
                "category": cat,
            }
            kept.append(item)
            if len(kept) >= limit:
                break
        print(f"  kept {len(kept)}")
        manifest.extend(kept)

    # de-dupe ids across categories
    uniq = []
    seen = set()
    for item in manifest:
        if item["id"] in seen or item["id"] in have_ids:
            continue
        seen.add(item["id"])
        uniq.append(item)

    MANIFEST.write_text(json.dumps(uniq, indent=2), encoding="utf-8")
    print(f"manifest {len(uniq)} products -> {MANIFEST}")

    blocks = [product_js(item) for item in uniq]
    GENERATED.write_text(",\n".join(blocks), encoding="utf-8")

    # Inject before the closing of products array: `,\n];` preceding `export const stories`
    marker = "\n];\n\nexport const stories"
    if marker not in data_text:
        raise SystemExit("Could not find products array end marker in data.js")
    if any(item["id"] in data_text for item in uniq[:1]) and "midu-" in data_text:
        # replace previous midu block if present between last local product and stories
        data_text = re.sub(
            r",\n  \{\n    id: \"midu-[\s\S]*?(?=\n\];\n\nexport const stories)",
            "",
            data_text,
            count=1,
        )

    # Remove prior midu products, then inject once before the array close.
    data_text = re.sub(
        r",?\n  \{\n    id: \"midu-[^\"]+\",[\s\S]*?\n  \}",
        "",
        data_text,
    )
    if marker not in data_text:
        raise SystemExit("Marker lost after midu cleanup")
    injection = (",\n" + ",\n".join(blocks)) if blocks else ""
    data_text = data_text.replace(marker, injection + marker, 1)
    DATA_JS.write_text(data_text, encoding="utf-8")
    print(f"updated {DATA_JS} with {len(uniq)} MIDU products")


if __name__ == "__main__":
    main()
