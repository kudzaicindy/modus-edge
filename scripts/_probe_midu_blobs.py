from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1] / "public" / "images" / "midu"


def sample_bg(arr, margin=10):
    patches = [
        arr[:margin, :margin],
        arr[:margin, -margin:],
        arr[-margin:, :margin],
        arr[-margin:, -margin:],
    ]
    return np.median(np.concatenate([p.reshape(-1, 3) for p in patches], 0), 0).astype(np.uint8)


def components(mask, min_area=800):
    h, w = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    boxes = []
    for y in range(h):
        xs = np.where(mask[y] & ~seen[y])[0]
        for x in xs:
            if seen[y, x]:
                continue
            stack = [(int(x), int(y))]
            seen[y, x] = True
            pts_x = []
            pts_y = []
            while stack:
                cx, cy = stack.pop()
                pts_x.append(cx)
                pts_y.append(cy)
                for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
                    if 0 <= nx < w and 0 <= ny < h and mask[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        stack.append((nx, ny))
            if len(pts_x) < min_area:
                continue
            boxes.append((min(pts_x), min(pts_y), max(pts_x) + 1, max(pts_y) + 1, len(pts_x)))
    boxes.sort(key=lambda b: b[0])
    return boxes


def projection_splits(mask, min_gap=8, min_width=18):
    col = mask.mean(axis=0)
    active = col > 0.04
    segments = []
    start = None
    for i, on in enumerate(active):
        if on and start is None:
            start = i
        elif not on and start is not None:
            if i - start >= min_width:
                segments.append((start, i))
            start = None
    if start is not None and len(active) - start >= min_width:
        segments.append((start, len(active)))
    # merge tiny gaps
    merged = []
    for seg in segments:
        if not merged:
            merged.append(list(seg))
            continue
        if seg[0] - merged[-1][1] < min_gap:
            merged[-1][1] = seg[1]
        else:
            merged.append(list(seg))
    return [(a, b) for a, b in merged]


def analyze(path, thr=32, open_size=3, close_size=7):
    im = Image.open(path).convert("RGB")
    scale = max(im.size) / 640.0
    small = im.resize((max(1, int(im.size[0] / scale)), max(1, int(im.size[1] / scale))), Image.Resampling.BILINEAR)
    arr = np.asarray(small)
    bg = sample_bg(arr)
    diff = np.abs(arr.astype(np.int16) - bg.astype(np.int16)).sum(-1)
    mask = diff > thr
    m = Image.fromarray((mask.astype(np.uint8) * 255))
    if open_size:
        m = m.filter(ImageFilter.MinFilter(open_size if open_size % 2 else open_size + 1))
        m = m.filter(ImageFilter.MaxFilter(open_size if open_size % 2 else open_size + 1))
    if close_size:
        m = m.filter(ImageFilter.MaxFilter(close_size if close_size % 2 else close_size + 1))
        m = m.filter(ImageFilter.MinFilter(close_size if close_size % 2 else close_size + 1))
    mask = np.asarray(m) > 0
    boxes = components(mask, min_area=max(400, int(mask.size * 0.004)))
    segs = projection_splits(mask)
    print(
        f"{path.name:22} boxes={len(boxes):2} segs={len(segs):2} "
        f"box_w={[round((b[2]-b[0])*scale) for b in boxes[:8]]} "
        f"segs={[round((b-a)*scale) for a,b in segs[:8]]}"
    )


names = [
    "midu-b06.jpg",
    "midu-cup25.jpg",
    "midu-nb70.jpg",
    "midu-hat03.jpg",
    "midu-pb304.jpg",
    "midu-ub08.jpg",
    "midu-wcs11.jpg",
    "midu-gs545.jpg",
    "midu-pbn019b.jpg",
    "midu-hat07.jpg",
]
for name in names:
    p = ROOT / name
    if p.exists():
        analyze(p)
