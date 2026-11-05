"""Split MIDU multi-colour lineup photos into one cropped image per colour."""

from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage.feature import peak_local_max
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
    ((170, 110, 90), "Copper"),
    ((120, 80, 60), "Rose gold"),
    ((90, 55, 40), "Wood"),
]


def sample_bg(arr, margin=12):
    h, w = arr.shape[:2]
    m = max(4, min(margin, h // 10, w // 10))
    patches = [
        arr[:m, :m],
        arr[:m, -m:],
        arr[-m:, :m],
        arr[-m:, -m:],
    ]
    return np.median(np.concatenate([p.reshape(-1, 3) for p in patches], 0), 0).astype(np.float32)


def near_white(arr, thr=38):
    # Treat near-white / light grey studio backdrop as background.
    return (arr[..., 0] > 215) & (arr[..., 1] > 215) & (arr[..., 2] > 215) & (
        np.max(arr, axis=-1) - np.min(arr, axis=-1) < 28
    ) | (
        np.abs(arr.astype(np.float32) - 245).sum(-1) < thr * 3
    )


def fg_mask(arr):
    bg = sample_bg(arr)
    diff = np.abs(arr.astype(np.float32) - bg).sum(-1)
    mask = (diff > 30) & ~near_white(arr, thr=36)
    # Soften speckles, keep object bodies.
    mask = ndi.binary_opening(mask, iterations=2)
    mask = ndi.binary_closing(mask, iterations=3)
    mask = ndi.binary_fill_holes(mask)
    return mask


def _filter_labels(labels, mask, min_area_frac=0.01, max_count=12):
    min_area = int(mask.size * min_area_frac)
    keep = []
    for lab in range(1, int(labels.max()) + 1):
        area = int((labels == lab).sum())
        if area < min_area:
            continue
        ys, xs = np.where(labels == lab)
        bw = xs.max() - xs.min() + 1
        bh = ys.max() - ys.min() + 1
        if bh < 18 or bw < 18:
            continue
        if bw > mask.shape[1] * 0.92 and bh < mask.shape[0] * 0.18:
            continue
        keep.append((lab, area, int(xs.min())))
    if not keep:
        return np.zeros_like(labels, dtype=np.int32), 0
    keep.sort(key=lambda item: item[2])
    if len(keep) > max_count:
        keep = sorted(keep, key=lambda item: item[1], reverse=True)[:max_count]
        keep.sort(key=lambda item: item[2])
    remap = np.zeros(int(labels.max()) + 1, dtype=np.int32)
    for i, (lab, _, _) in enumerate(keep, start=1):
        remap[lab] = i
    return remap[labels], len(keep)


def _score_labels(labels, count):
    if count < 2:
        return -1
    areas = np.array([(labels == lab).sum() for lab in range(1, count + 1)], dtype=np.float32)
    med = float(np.median(areas))
    if med <= 0:
        return -1
    similar = sum(0.25 * med <= a <= 3.5 * med for a in areas)
    if similar < max(2, int(count * 0.5)):
        return -1
    # Prefer more colours when quality is similar.
    return similar * 10 + count


def label_objects(mask, min_area_frac=0.01, max_count=12):
    if mask.mean() < 0.01:
        return np.zeros_like(mask, dtype=np.int32), 0

    distance = ndi.distance_transform_edt(mask)
    h, w = mask.shape
    best_labels = None
    best_count = 0
    best_score = -1
    for frac in (0.045, 0.06, 0.08, 0.1, 0.13):
        min_dist = max(10, int(min(h, w) * frac))
        coords = peak_local_max(
            distance,
            min_distance=min_dist,
            labels=mask,
            exclude_border=False,
        )
        if len(coords) < 2:
            continue
        markers = np.zeros_like(mask, dtype=np.int32)
        for i, (r, c) in enumerate(coords, start=1):
            markers[r, c] = i
        raw = watershed(-distance, markers, mask=mask)
        labels, count = _filter_labels(raw, mask, min_area_frac=min_area_frac, max_count=max_count)
        score = _score_labels(labels, count)
        if score > best_score:
            best_score = score
            best_labels = labels
            best_count = count

    if best_labels is None:
        raw, _ = ndi.label(mask)
        return _filter_labels(raw, mask, min_area_frac=min_area_frac, max_count=max_count)
    return best_labels, best_count


def square_pad(crop, bg, size=900, pad=0.08):
    ch, cw = crop.shape[:2]
    side = int(max(ch, cw) * (1 + pad))
    side = max(side, 64)
    canvas = np.full((side, side, 3), bg, dtype=np.uint8)
    oy = (side - ch) // 2
    ox = (side - cw) // 2
    canvas[oy : oy + ch, ox : ox + cw] = crop
    return np.asarray(Image.fromarray(canvas).resize((size, size), Image.Resampling.LANCZOS))


def dominant_color_name(crop, mask_local):
    pixels = crop[mask_local]
    if len(pixels) == 0:
        pixels = crop.reshape(-1, 3)
    # Ignore near-white pixels for naming.
    sat = pixels.astype(np.int16)
    keep = ~((sat[:, 0] > 220) & (sat[:, 1] > 220) & (sat[:, 2] > 220))
    if keep.sum() > 20:
        pixels = pixels[keep]
    med = np.median(pixels.astype(np.float32), axis=0)

    def dist(rgb):
        return float(np.linalg.norm(med - np.asarray(rgb, dtype=np.float32)))

    name = min(COLOR_NAMES, key=lambda item: dist(item[0]))[1]
    return name, tuple(int(x) for x in med)


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
    # Work on a medium preview for detection, map boxes back.
    max_side = 900
    scale = max(im.size) / max_side
    if scale < 1:
        scale = 1.0
        work = im
    else:
        work = im.resize(
            (max(1, int(im.size[0] / scale)), max(1, int(im.size[1] / scale))),
            Image.Resampling.BILINEAR,
        )
    arr = np.asarray(work)
    mask = fg_mask(arr)
    labels, count = label_objects(mask)
    bg = sample_bg(arr).astype(np.uint8)

    if count < 2:
        return []

    # Similar sized objects => colour lineup. Wildly uneven => gift-set collage; skip.
    areas = [(labels == lab).sum() for lab in range(1, count + 1)]
    med = float(np.median(areas))
    if med <= 0:
        return []
    similar = sum(0.25 * med <= a <= 3.5 * med for a in areas)
    if similar < max(2, int(count * 0.5)):
        return []

    full = np.asarray(im)
    full_bg = sample_bg(full).astype(np.uint8)
    crops = []
    for lab in range(1, count + 1):
        ys, xs = np.where(labels == lab)
        y0, y1 = ys.min(), ys.max() + 1
        x0, x1 = xs.min(), xs.max() + 1
        # pad a little in work space then map
        pad = 4
        y0 = max(0, y0 - pad)
        x0 = max(0, x0 - pad)
        y1 = min(arr.shape[0], y1 + pad)
        x1 = min(arr.shape[1], x1 + pad)
        fy0, fy1 = int(y0 * scale), int(y1 * scale)
        fx0, fx1 = int(x0 * scale), int(x1 * scale)
        fy1 = min(full.shape[0], max(fy1, fy0 + 8))
        fx1 = min(full.shape[1], max(fx1, fx0 + 8))
        cell = full[fy0:fy1, fx0:fx1].copy()
        # local mask approximated by bg distance
        local_mask = np.abs(cell.astype(np.float32) - full_bg).sum(-1) > 40
        local_mask = ndi.binary_fill_holes(ndi.binary_opening(local_mask, iterations=1))
        name, _rgb = dominant_color_name(cell, local_mask)
        sq = square_pad(cell, full_bg)
        crops.append({"name": name, "image_arr": sq, "box": [fx0, fy0, fx1, fy1]})
    names = unique_names([c["name"] for c in crops])
    for crop, name in zip(crops, names):
        crop["name"] = name
    return crops


def update_data_js(updates: dict[str, list[dict]]):
    text = DATA_JS.read_text(encoding="utf-8")
    for product_id, colors in updates.items():
        # Replace the colors array for this product block.
        pattern = re.compile(
            rf'(id: "{re.escape(product_id)}",[\s\S]*?colors: )(\[[\s\S]*?\])(,)',
            re.M,
        )

        def repl(match):
            body = ",\n      ".join(
                '{ name: "%s", image: "%s" }' % (c["name"], c["image"]) for c in colors
            )
            arr = "[\n      " + body + ",\n    ]"
            return match.group(1) + arr + match.group(3)

        new_text, n = pattern.subn(repl, text, count=1)
        if n != 1:
            print("WARN: could not patch", product_id)
            continue
        # Also set main image to first colour crop when present.
        first = colors[0]["image"]
        text2, n2 = re.subn(
            rf'(id: "{re.escape(product_id)}",[\s\S]*?\n    image: )"[^"]+"',
            rf'\1"{first}"',
            new_text,
            count=1,
        )
        text = text2 if n2 else new_text
        print("patched", product_id, "->", len(colors), "colours")
    DATA_JS.write_text(text, encoding="utf-8")


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    only = set()
    # Optional: python scripts/crop-midu-colors.py midu-b06 midu-cup09
    import sys

    if len(sys.argv) > 1:
        only = {arg if arg.startswith("midu-") else f"midu-{arg}" for arg in sys.argv[1:]}
        only = {name[:-4] if name.endswith(".jpg") else name for name in only}

    files = sorted(IMG_DIR.glob("midu-*.jpg"))
    updates = {}
    manifest = {}
    if MANIFEST.exists() and not only:
        try:
            manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        except Exception:
            manifest = {}

    for path in files:
        stem = path.stem  # midu-b06
        product_id = stem
        if only and product_id not in only:
            continue
        # Skip already-split products unless explicitly requested.
        if not only and product_id in manifest and len(manifest[product_id]) >= 2:
            print("keep", path.name, len(manifest[product_id]))
            continue
        try:
            crops = crop_product(path)
        except Exception as exc:
            print("FAIL", path.name, exc)
            continue
        if len(crops) < 2:
            print("skip", path.name, "single/uneven")
            continue

        saved = []
        for crop in crops:
            fname = f"{stem}-{slug(crop['name'])}.jpg"
            out = OUT_DIR / fname
            Image.fromarray(crop["image_arr"]).save(out, quality=90, optimize=True)
            rel = f"/images/midu/colors/{fname}"
            saved.append({"name": crop["name"], "image": rel, "box": crop["box"]})
        updates[product_id] = saved
        manifest[product_id] = saved
        print("cropped", path.name, len(saved), [c["name"] for c in saved])

    MANIFEST.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    if updates:
        update_data_js(updates)
    print("done", len(updates), "products split")


if __name__ == "__main__":
    main()
