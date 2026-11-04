"""Piped polos: clean single-item shots. White from photo; other colours
recoloured from the white isolation using real fabric samples from the rack.
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(r"c:\Users\HP\Documents\GitHub\modus-edge\public\images")


def sample_bg(arr, margin=12):
    h, w = arr.shape[:2]
    patches = [
        arr[:margin, :margin],
        arr[:margin, -margin:],
        arr[-margin:, :margin],
        arr[-margin:, -margin:],
    ]
    return np.median(np.concatenate([p.reshape(-1, 3) for p in patches], 0), 0).astype(np.uint8)


def dilate(mask, size=9):
    im = Image.fromarray((mask.astype(np.uint8) * 255))
    im = im.filter(ImageFilter.MaxFilter(size if size % 2 else size + 1))
    return np.asarray(im) > 0


def erode(mask, size=3):
    im = Image.fromarray((mask.astype(np.uint8) * 255))
    im = im.filter(ImageFilter.MinFilter(size if size % 2 else size + 1))
    return np.asarray(im) > 0


def largest_at(mask, seed):
    h, w = mask.shape
    sx, sy = seed
    if not mask[sy, sx]:
        ys, xs = np.where(mask)
        if len(xs) == 0:
            return mask
        d = (xs - sx) ** 2 + (ys - sy) ** 2
        i = int(np.argmin(d))
        sx, sy = int(xs[i]), int(ys[i])
    keep = np.zeros_like(mask)
    stack = [(sx, sy)]
    keep[sy, sx] = True
    while stack:
        x, y = stack.pop()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and mask[ny, nx] and not keep[ny, nx]:
                keep[ny, nx] = True
                stack.append((nx, ny))
    return keep


def feather(keep, sigma=0.7):
    return (
        np.asarray(
            Image.fromarray((keep.astype(np.uint8) * 255)).filter(
                ImageFilter.GaussianBlur(sigma)
            )
        ).astype(np.float32)
        / 255.0
    )


def paint(arr, keep, bg):
    a = feather(keep)
    out = arr.astype(np.float32)
    b = bg.astype(np.float32)
    for c in range(3):
        out[..., c] = out[..., c] * a + b[c] * (1 - a)
    return np.clip(out, 0, 255).astype(np.uint8)


def to_square(arr, bg, pad=0.06):
    diff = np.abs(arr.astype(np.int16) - bg.astype(np.int16)).sum(-1)
    mask = diff > 18
    ys, xs = np.where(mask)
    if len(xs) == 0:
        return arr
    y0, y1 = max(0, int(ys.min()) - 4), min(arr.shape[0], int(ys.max()) + 5)
    x0, x1 = max(0, int(xs.min()) - 4), min(arr.shape[1], int(xs.max()) + 5)
    crop = arr[y0:y1, x0:x1]
    ch, cw = crop.shape[:2]
    side = int(max(ch, cw) * (1 + pad))
    canvas = np.full((side, side, 3), bg, dtype=np.uint8)
    oy, ox = (side - ch) // 2, (side - cw) // 2
    canvas[oy : oy + ch, ox : ox + cw] = crop
    return canvas


def save(arr, name):
    Image.fromarray(arr).save(ROOT / name)
    print(name, f"{arr.shape[1]}x{arr.shape[0]}")


src = np.asarray(Image.open(ROOT / "polo-piped.png").convert("RGB"))
H, W = src.shape[:2]
R, G, B = [src[..., i].astype(np.int16) for i in range(3)]
lum = (R + G + B) / 3.0

is_coral = (R > 165) & ((R - G) > 40) & ((R - B) > 45) & (G < 190)
is_white = (R > 195) & (G > 190) & (B > 180) & ((R - G) < 35) & (~is_coral)
is_navy = (lum < 85) & (B + 8 >= R) & (B + 8 >= G) & (lum > 5)
is_dark = lum < 50

# --- 1) Isolate the front WHITE shirt cleanly ---
x0, x1 = int(W * 0.03), int(W * 0.47)
y0, y1 = int(H * 0.04), int(H * 0.97)
reg = src[y0:y1, x0:x1].copy()
bg = sample_bg(reg)

local_white = is_white[y0:y1, x0:x1]
# kill coral fringe on the right
local_coral = is_coral[y0:y1, x0:x1]
local_white = local_white & ~dilate(local_coral, 5)

dark = is_dark[y0:y1, x0:x1]
near = dilate(local_white, 11)
# piping: dark pixels on white shirt (black piped line)
piping = dark & dilate(local_white, 7) & ~dilate(local_coral, 7)
keep_raw = local_white | (dark & near) | piping
sx = int(0.22 * W) - x0
sy = int(0.48 * H) - y0
keep = largest_at(keep_raw, (sx, sy))
keep = dilate(erode(dilate(keep, 5), 3), 3)
# hard wipe anything coral-ish remaining
rr, gg, bb = [reg[..., i].astype(np.int16) for i in range(3)]
coralish = (rr > 160) & ((rr - gg) > 35)
keep = keep & ~coralish

white_img = paint(reg, keep, bg)
white_sq = to_square(white_img, bg, pad=0.05)
save(white_sq, "polo-piped-white.png")

# Build a fabric luminance map from white shirt for realistic recolour
white_only = keep & local_white
# normalize luminance of white fabric for shading transfer
w_lum = lum[y0:y1, x0:x1]
# sample target fabric colours from the real shirts
def median_where(mask_full):
    ys, xs = np.where(mask_full)
    if len(xs) == 0:
        return np.array([128, 128, 128], dtype=np.float32)
    # take central 60% of samples by luminance to avoid extremes
    vals = src[ys, xs].astype(np.float32)
    return np.median(vals, axis=0)


coral_c = median_where(is_coral)
# grey band
spread = np.maximum(np.maximum(np.abs(R - G), np.abs(G - B)), np.abs(R - B))
is_grey = (lum > 110) & (lum < 210) & (spread < 28) & ((R - G) < 25) & (~is_coral) & (~is_white)
# prefer grey column
grey_col = np.zeros_like(is_grey)
grey_col[:, int(W * 0.66) : int(W * 0.84)] = True
grey_c = median_where(is_grey & grey_col)
navy_c = median_where(is_navy[:, int(W * 0.82) :])

print("coral sample", coral_c)
print("grey sample", grey_c)
print("navy sample", navy_c)

# piping colour for white shirt is black; for navy shirt piping is white
pipe_mask = piping & keep  # relative to reg

# base alpha of isolated white shirt on its bg
base = white_img.copy()
base_keep = keep.copy()
base_bg = bg.copy()
base_lum = w_lum.copy()


def recolour(target_rgb, piping_rgb, name):
    out = np.full_like(reg, base_bg)
    # shading from original white luminance
    # white fabric ~210-250; map relative shade onto target
    fabric = base_keep & ~pipe_mask & (base_lum > 60)
    # relative shade factor
    ref = np.median(base_lum[fabric]) if fabric.any() else 220.0
    shade = np.clip(base_lum / max(ref, 1), 0.55, 1.15)
    tgt = np.asarray(target_rgb, dtype=np.float32)
    colored = np.zeros_like(reg, dtype=np.float32)
    for c in range(3):
        colored[..., c] = np.clip(tgt[c] * shade, 0, 255)
    # hangers / dark non-piping stay dark from original
    hanger = base_keep & is_dark[y0:y1, x0:x1] & ~pipe_mask
    result = np.zeros_like(reg, dtype=np.float32)
    result[:] = base_bg.astype(np.float32)
    # fabric
    for c in range(3):
        result[..., c] = np.where(fabric, colored[..., c], result[..., c])
    # hanger from original
    for c in range(3):
        result[..., c] = np.where(hanger, reg[..., c], result[..., c])
    # piping
    pr = np.asarray(piping_rgb, dtype=np.float32)
    for c in range(3):
        result[..., c] = np.where(pipe_mask, pr[c], result[..., c])
    # collar/buttons near-white details: for dark targets, slightly lighten collar edge
    a = feather(base_keep, 0.5)
    final = result * a[..., None] + base_bg.astype(np.float32) * (1 - a[..., None])
    final = np.clip(final, 0, 255).astype(np.uint8)
    save(to_square(final, base_bg, pad=0.05), name)


recolour(coral_c, (20, 20, 20), "polo-piped-coral.png")
recolour(grey_c, (25, 25, 28), "polo-piped-grey.png")
recolour(navy_c, (235, 235, 230), "polo-piped-navy.png")

# Re-save white from the same isolation (already saved) — confirm no neighbours
print("piped done")
