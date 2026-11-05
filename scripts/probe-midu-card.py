import re
import ssl
import urllib.request
from pathlib import Path

ctx = ssl.create_default_context()
html = urllib.request.urlopen(
    "https://miducustomgift.com/en/products/usb-drives/",
    context=ctx,
    timeout=45,
).read().decode("utf-8", "ignore")
Path("scripts/_midu_usb.html").write_text(html, encoding="utf-8")

# Extract product blocks by splitting on product links
parts = re.split(r'href="(/en/product/(m-[a-z0-9-]+))"', html, flags=re.I)
# parts: text, href, slug, text, href, slug, ...
print("parts", len(parts))
for i in range(1, min(len(parts), 20), 3):
    href, slug, after = parts[i], parts[i + 1], parts[i + 2][:800]
    img = re.search(r'src="(https?://[^"]+/static/uploads/[^"]+)"', after) or re.search(
        r'src="(/static/uploads/[^"]+)"', after
    )
    title = re.search(r"<h[23][^>]*>([\s\S]*?)</h[23]>", after, re.I)
    if not title:
        title = re.search(r'alt="([^"]{3,120})"', after)
    price = re.search(r"Est\.\s*\$([0-9.]+)(?:\s*[–-]\s*([0-9.]+))?", after, re.I)
    model = re.search(r"Model:\s*(M-[A-Z0-9]+)", after, re.I)
    print(
        {
            "slug": slug,
            "img": img.group(1) if img else None,
            "title": re.sub(r"<[^>]+>", "", title.group(1)).strip() if title else None,
            "price": price.groups() if price else None,
            "model": model.group(1) if model else None,
            "after": re.sub(r"\s+", " ", after)[:180],
        }
    )
