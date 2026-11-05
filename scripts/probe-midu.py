import re
import ssl
import urllib.request

ctx = ssl.create_default_context()
url = "https://miducustomgift.com/en/products/gift-sets/"
html = urllib.request.urlopen(url, context=ctx, timeout=45).read().decode("utf-8", "ignore")
print("len", len(html))

patterns = [
    r"https?://[^\"']+api[^\"']+",
    r"/product/m-[a-z0-9-]+",
    r"/en/product/[^\"'#?\s]+",
    r"static/uploads/[^\"']+",
    r"__NEXT_DATA__",
    r"\"model\"\s*:\s*\"[^\"]+\"",
    r"M-[A-Z0-9]+",
]
for pat in patterns:
    hits = re.findall(pat, html, re.I)
    uniq = list(dict.fromkeys(hits))
    print(pat, "count", len(uniq), "sample", uniq[:8])

# Save a slice for inspection
Path = __import__("pathlib").Path
Path("scripts/_midu_sample.html").write_text(html[:50000], encoding="utf-8")
print("wrote scripts/_midu_sample.html")
