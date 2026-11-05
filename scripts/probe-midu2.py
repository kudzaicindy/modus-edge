import re
import ssl
import urllib.request
from pathlib import Path

ctx = ssl.create_default_context()


def fetch(url):
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; ModusEdgeBot/1.0)",
            "Accept": "text/html,application/json",
        },
    )
    return urllib.request.urlopen(req, context=ctx, timeout=45).read().decode("utf-8", "ignore")


candidates = [
    "https://miducustomgift.com/en/products/gift-sets/?page=2",
    "https://miducustomgift.com/en/products/gift-sets/?page=3",
    "https://miducustomgift.com/en/products/?page=1",
    "https://miducustomgift.com/en/products/?page=2",
    "https://miducustomgift.com/sitemap.xml",
    "https://miducustomgift.com/en/sitemap.xml",
    "https://miducustomgift.com/robots.txt",
    "https://miducustomgift.com/api/products",
    "https://miducustomgift.com/en/api/products",
    "https://miducustomgift.com/static/api/products.json",
]

for url in candidates:
    try:
        html = fetch(url)
        models = list(dict.fromkeys(re.findall(r"/en/product/(m-[a-z0-9-]+)", html, re.I)))
        print(f"OK {url} len={len(html)} products={len(models)} sample={models[:6]}")
    except Exception as e:
        print(f"FAIL {url} {e}")

# Parse one category page more carefully for titles/prices
html = fetch("https://miducustomgift.com/en/products/gift-sets/")
Path("scripts/_midu_gift_sets.html").write_text(html, encoding="utf-8")
# Look for card structure
for m in re.finditer(r'<article[\s\S]{0,1200}?/en/product/(m-[a-z0-9-]+)[\s\S]{0,800}?</article>', html, re.I):
    chunk = m.group(0)
    print("--- article ---")
    print(re.sub(r"\s+", " ", chunk)[:300])

# Generic product anchors with nearby text
print("\nANCHORS")
for m in re.finditer(
    r'href="(/en/product/(m-[a-z0-9-]+))"[^>]*>[\s\S]{0,400}?Est\.\s*\$([0-9.]+)(?:[–-]([0-9.]+))?',
    html,
    re.I,
):
    print(m.groups())
