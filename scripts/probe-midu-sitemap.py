import re
import ssl
import urllib.request
from collections import Counter

ctx = ssl.create_default_context()
xml = urllib.request.urlopen(
    "https://miducustomgift.com/sitemap.xml",
    context=ctx,
    timeout=60,
).read().decode("utf-8", "ignore")
urls = re.findall(r"<loc>(https://miducustomgift\.com/en/product/(m-[^<]+))</loc>", xml, re.I)
print("product urls", len(urls))
prefixes = Counter()
for _, slug in urls:
    # m-gs545 -> gs, m-pbn046 -> pbn, m-pb055 -> pb
    body = slug.lower().removeprefix("m-")
    m = re.match(r"([a-z]+)", body)
    prefixes[m.group(1) if m else "?"] += 1
print("prefixes:")
for k, v in prefixes.most_common():
    print(f"  {k}: {v}")

# category listing page totals via pagination
cats = [
    "gift-sets",
    "power-notebooks",
    "power-banks",
    "notebooks",
    "apparel",
    "hats",
    "usb-drives",
    "keychains",
    "drinkware",
    "wireless-chargers",
    "pens",
    "bags",
    "card-holders",
    "umbrellas",
    "phone-stands",
    "desk-organizers",
    "lanyards-badges",
    "other-promotional",
]
for cat in cats:
    total = 0
    page = 1
    seen = set()
    while page <= 40:
        url = f"https://miducustomgift.com/en/products/{cat}/?page={page}"
        try:
            html = urllib.request.urlopen(url, context=ctx, timeout=30).read().decode("utf-8", "ignore")
        except Exception as e:
            print(cat, "fail", e)
            break
        models = set(re.findall(r"/en/product/(m-[a-z0-9-]+)", html, re.I))
        new = models - seen
        if not new:
            break
        seen |= models
        total = len(seen)
        page += 1
    print(f"cat {cat}: {total} pages={page-1}")
