"""Split MIDU multi-colour lineup photos into clean one-item crops.

Only keeps crops that look like a single object. Products that cannot be
separated cleanly fall back to the original photo with one colour.
"""

from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage.feature import peak_local_max
from skimage.morphology import disk, erosion
from skimage.segmentation import watershed

ROOT = Path(__file__).resolve().parents[1]
IMG_DIR = ROOT / "public" / "images" / "midu"
OUT_DIR = IMG_DIR / "colors"
DATA_JS = ROOT / "src" / "data.js"
MANIFEST = ROOT / "scripts" / "_midu_color_crops.json"

COLOR_NAMES = [
    ((245, 245, 245), "White"),
    ((210, 210, 210), "Silver"),
    ((30, 30, 30), "Black"),
    ((55, 55, 60), "Charcoal"),
    ((20, 35, 90), "Navy"),
    ((35, 90, 180), "Blue"),
    ((70, 170, 210), "Sky"),
    ((20, 140, 120), "Teal"),
    ((40, 120, 70), "Green"),
    ((140, 190, 60), "Lime"),
    ((200, 180, 50), "Yellow"),
    ((220, 130, 40), "Orange"),
    ((190, 40, 40), "Red"),
    ((170, 50, 90), "Magenta"),
    ((220, 120, 150), "Pink"),
    ((180, 120, 90), "Brown"),
    ((190, 150, 110), "Tan"),
    ((180, 140, 90), "Gold"),
    ((184, 115, 51), "Copper"),
    ((201, 162, 120), "Rose gold"),
    ((90, 55, 40), "Wood"),
]


def sample_bg(arr, margin=14):
    h, w = arr.shape[:2]
    m = max(4, min(margin, h // 10, w // 10))
    patches = [arr[:m, :m], arr[:m, -m:], arr[-m:, :m], arr[-m:, -m:]]
    return np.median(np.concatenate([p.reshape(-1, 3) for p in patches], 0), 0).astype(np.float32)


def near_white(arr):
    return (arr[..., 0] > 205) & (arr[..., 1] > 205) & (arr[..., 2] > 205) & (
        (arr.max(-1) - arr.min(-1)) < 34
    )


def fg_mask(arr):
    bg = sample_bg(arr)
    mask = (np.abs(arr.astype(np.float32) - bg).sum(-1) > 24) & ~near_white(arr)
    mask = ndi.binary_opening(mask, iterations=1)
    mask = ndi.binary_closing(mask, iterations=2)
    return ndi.binary_fill_holes(mask), bg.astype(np.uint8)


def seed_points(mask):
    h, w = mask.shape
    best = []
    for rad, md_div in ((3, 12), (4, 10), (2, 14)):
        eroded = erosion(mask, footprint=disk(rad))
        if eroded.mean() < 0.02:
            continue
        dist = ndi.distance_transform_edt(eroded)
        md = max(12, w // md_div)
        coords = peak_local_max(dist, min_distance=md, labels=eroded, exclude_border=False)
        coords = [(int(r), int(c)) for r, c in coords]
        if 2 <= len(coords) <= 12 and len(coords) > len(best):
            best = sorted(coords, key=lambda p: p[1])
    return best


def grow_object(arr, mask, seed, color_thr=68):
    """Grow one object from a seed using colour threshold + connectivity."""
    h, w = mask.shape
    sy, sx = seed
    if not (0 <= sy < h and 0 <= sx < w):
        return None
    if not mask[sy, sx]:
        ys, xs = np.where(mask)
        if len(xs) == 0:
            return None
        i = int(np.argmin((ys - sy) ** 2 + (xs - sx) ** 2))
        sy, sx = int(ys[i]), int(xs[i])

    seed_rgb = arr[sy, sx].astype(np.float32)
    pix = arr.astype(np.float32)
    dist = np.sqrt(((pix - seed_rgb) ** 2).sum(-1))
    chroma = pix.max(-1) - pix.min(-1)
    lum = pix.mean(-1)
    allowed = mask & (
        (dist <= color_thr)
        | ((chroma < 28) & (dist <= color_thr + 40))
        | ((lum < 55) & (dist <= color_thr + 55))
    )
    labeled, _ = ndi.label(allowed)
    target = int(labeled[sy, sx])
    if target == 0:
        return None
    keep = labeled == target
    if keep.sum() < 80:
        return None
    keep = ndi.binary_fill_holes(keep)
    keep = ndi.binary_closing(keep, iterations=1)
    keep = ndi.binary_dilation(keep, iterations=1)
    return keep


def is_clean_single(arr, keep, img_w):
    ys, xs = np.where(keep)
    if len(xs) < 80:
        return False
    bw = xs.max() - xs.min() + 1
    bh = ys.max() - ys.min() + 1
    if bw > img_w * 0.30:
        return False
    if bh < 20 or bw < 16:
        return False
    # Reject if the crop contains two strong different colour masses.
    pix = arr[keep].astype(np.float32)
    chroma = pix.max(1) - pix.min(1)
    body = chroma > 18
    if body.sum() < 40:
        return True
    body_pix = pix[body]
    c0 = body_pix.mean(0)
    d0 = ((body_pix - c0) ** 2).sum(1)
    c1 = body_pix[int(np.argmax(d0))]
    a = np.ones(len(body_pix), dtype=bool)
    for _ in range(8):
        dA = ((body_pix - c0) ** 2).sum(1)
        dB = ((body_pix - c1) ** 2).sum(1)
        a = dA <= dB
        if a.any():
            c0 = body_pix[a].mean(0)
        if (~a).any():
            c1 = body_pix[~a].mean(0)
    sep = float(np.linalg.norm(c0 - c1))
    share = float(min(a.mean(), (~a).mean()))
    if sep > 48 and share > 0.14:
        return False
    return True


def square_pad(crop, bg, size=1000, pad=0.06):
    diff = np.abs(crop.astype(np.int16) - bg.astype(np.int16)).sum(-1)
    ys, xs = np.where(diff > 12)
    if len(xs) > 20:
        crop = crop[max(0, ys.min() - 2) : ys.max() + 3, max(0, xs.min() - 2) : xs.max() + 3]
    ch, cw = crop.shape[:2]
    side = max(96, int(max(ch, cw) * (1 + pad)))
    canvas = np.full((side, side, 3), bg, dtype=np.uint8)
    oy, ox = (side - ch) // 2, (side - cw) // 2
    canvas[oy : oy + ch, ox : ox + cw] = crop
    return np.asarray(Image.fromarray(canvas).resize((size, size), Image.Resampling.LANCZOS))


def dominant_color_name(crop, mask_local):
    pixels = crop[mask_local] if mask_local is not None and mask_local.any() else crop.reshape(-1, 3)
    sat = pixels.astype(np.int16)
    chroma = sat.max(1) - sat.min(1)
    keep = (chroma > 12) & ~((sat[:, 0] > 220) & (sat[:, 1] > 220) & (sat[:, 2] > 220))
    if keep.sum() > 25:
        pixels = pixels[keep]
    med = np.median(pixels.astype(np.float32), axis=0)

    def dist(rgb):
        return float(np.linalg.norm(med - np.asarray(rgb, dtype=np.float32)))

    return min(COLOR_NAMES, key=lambda item: dist(item[0]))[1]


def unique_names(names):
    counts = Counter()
    out = []
    for name in names:
        counts[name] += 1
        n = counts[name]
        out.append(name if n == 1 else f"{name} {n}")
    return out


def slug(name):
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def crop_product(path: Path):
    im = Image.open(path).convert("RGB")
    max_side = 800
    scale = max(im.size) / max_side
    work = im if scale <= 1 else im.resize(
        (max(1, int(im.size[0] / scale)), max(1, int(im.size[1] / scale))),
        Image.Resampling.BILINEAR,
    )
    arr = np.asarray(work)
    mask, bg = fg_mask(arr)
    h, w = arr.shape[:2]
    seeds = seed_points(mask)
    if len(seeds) < 2:
        # Fallback watershed seeds.
        dist = ndi.distance_transform_edt(mask)
        coords = peak_local_max(dist, min_distance=max(12, w // 12), labels=mask)
        seeds = sorted([(int(r), int(c)) for r, c in coords], key=lambda p: p[1])
    if len(seeds) < 2:
        return []

    crops = []
    used = np.zeros_like(mask, dtype=bool)
    for seed in seeds:
        # Skip seeds already covered by a previous object.
        if used[seed]:
            continue
        keep = grow_object(arr, mask, seed)
        if keep is None:
            continue
        if not is_clean_single(arr, keep, w):
            continue
        # Avoid duplicates heavily overlapping previous crops.
        overlap = (keep & used).sum() / max(1, keep.sum())
        if overlap > 0.35:
            continue
        used |= keep
        ys, xs = np.where(keep)
        pad_y = max(8, int((ys.max() - ys.min() + 1) * 0.1))
        pad_x = max(8, int((xs.max() - xs.min() + 1) * 0.12))
        y0 = max(0, ys.min() - pad_y)
        y1 = min(h, ys.max() + 1 + pad_y)
        x0 = max(0, xs.min() - pad_x)
        x1 = min(w, xs.max() + 1 + pad_x)
        out = np.full((y1 - y0, x1 - x0, 3), bg, dtype=np.uint8)
        region = keep[y0:y1, x0:x1]
        out[region] = arr[y0:y1, x0:x1][region]
        name = dominant_color_name(out, region)
        crops.append(
            {
                "name": name,
                "image_arr": square_pad(out, bg),
                "box": [int(x0), int(y0), int(x1), int(y1)],
            }
        )

    if len(crops) < 2:
        return []

    # Keep the largest crop per colour family (Navy, Navy 2 → one Navy).
    by_base = {}
    for crop in crops:
        base = crop["name"].split()[0]
        area = (crop["box"][2] - crop["box"][0]) * (crop["box"][3] - crop["box"][1])
        prev = by_base.get(base)
        if not prev or area > prev[0]:
            by_base[base] = (area, crop)
    crops = [item[1] for item in sorted(by_base.values(), key=lambda item: item[1]["box"][0])]
    if len(crops) > 8:
        crops = crops[:8]
    if len(crops) < 2:
        return []
    names = unique_names([c["name"] for c in crops])
    for crop, name in zip(crops, names):
        crop["name"] = name
    return crops


def update_data_js(updates: dict[str, list[dict]], fallbacks: list[str]):
    text = DATA_JS.read_text(encoding="utf-8")
    for product_id, colors in updates.items():
        pattern = re.compile(
            rf'(id: "{re.escape(product_id)}",[\s\S]*?colors: )(\[[\s\S]*?\])(,)',
            re.M,
        )

        def repl(match):
            body = ",\n      ".join(
                '{ name: "%s", image: "%s" }' % (c["name"], c["image"]) for c in colors
            )
            return match.group(1) + "[\n      " + body + ",\n    ]" + match.group(3)

        new_text, n = pattern.subn(repl, text, count=1)
        if n != 1:
            print("WARN: could not patch", product_id)
            continue
        first = colors[0]["image"]
        text2, n2 = re.subn(
            rf'(id: "{re.escape(product_id)}",[\s\S]*?\n    image: )"[^"]+"',
            rf'\1"{first}"',
            new_text,
            count=1,
        )
        text = text2 if n2 else new_text
        print("patched", product_id, "->", len(colors), "colours")

    for product_id in fallbacks:
        original = f"/images/midu/{product_id}.jpg"
        pattern = re.compile(
            rf'(id: "{re.escape(product_id)}",[\s\S]*?\n    image: )"[^"]+"([\s\S]*?colors: )(\[[\s\S]*?\])(,)',
            re.M,
        )

        def repl_fb(match):
            colors = f'[{{ name: "As shown", image: "{original}" }}]'
            return match.group(1) + f'"{original}"' + match.group(2) + colors + match.group(4)

        text, n = pattern.subn(repl_fb, text, count=1)
        print("fallback", product_id, "ok" if n == 1 else "FAIL")

    DATA_JS.write_text(text, encoding="utf-8")


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    only = set()
    args = [a for a in sys.argv[1:] if a != "--force"]
    if args:
        only = {arg if arg.startswith("midu-") else f"midu-{arg}" for arg in args}
        only = {name[:-4] if name.endswith(".jpg") else name for name in only}

    files = sorted(IMG_DIR.glob("midu-*.jpg"))
    updates = {}
    fallbacks = []
    manifest = {}

    for path in files:
        product_id = path.stem
        if only and product_id not in only:
            continue
        try:
            crops = crop_product(path)
        except Exception as exc:
            print("FAIL", path.name, exc, flush=True)
            fallbacks.append(product_id)
            continue

        for old in OUT_DIR.glob(f"{product_id}-*.jpg"):
            old.unlink(missing_ok=True)

        if len(crops) < 2:
            print("fallback", path.name, "could not isolate clean singles", flush=True)
            fallbacks.append(product_id)
            continue

        saved = []
        for crop in crops:
            fname = f"{product_id}-{slug(crop['name'])}.jpg"
            Image.fromarray(crop["image_arr"]).save(OUT_DIR / fname, quality=92, optimize=True)
            saved.append(
                {
                    "name": crop["name"],
                    "image": f"/images/midu/colors/{fname}",
                    "box": [int(v) for v in crop["box"]],
                }
            )
        updates[product_id] = saved
        manifest[product_id] = saved
        print("cropped", path.name, len(saved), [c["name"] for c in saved], flush=True)

    MANIFEST.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    update_data_js(updates, fallbacks)
    print("done", len(updates), "split;", len(fallbacks), "fallback to original", flush=True)


if __name__ == "__main__":
    main()
