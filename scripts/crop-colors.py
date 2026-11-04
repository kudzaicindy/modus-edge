from pathlib import Path
from PIL import Image

ROOT = Path(r"c:\Users\HP\Documents\GitHub\modus-edge\public\images")


def save(im, box, name):
    out = ROOT / name
    im.crop(box).save(out)
    print(out.name, box)


def grid(src, names, cols, rows, prefix, pad=0.06):
    im = Image.open(ROOT / src).convert("RGB")
    w, h = im.size
    cw, ch = w / cols, h / rows
    px, py = cw * pad, ch * pad
    for i, name in enumerate(names):
        row, col = divmod(i, cols)
        save(
            im,
            (
                int(col * cw + px),
                int(row * ch + py),
                int((col + 1) * cw - px),
                int((row + 1) * ch - py),
            ),
            f"{prefix}-{name}.png",
        )


def boxes(src, items):
    im = Image.open(ROOT / src).convert("RGB")
    for name, box in items:
        save(im, box, name)


grid(
    "bottle-handle-colors.png",
    ["black", "cream", "grey", "green", "lilac", "navy", "cyan", "orange", "white", "lime"],
    5,
    2,
    "bottle-handle",
    0,
)

im = Image.open(ROOT / "towel-clip-lineup.png").convert("RGB")
w, h = im.size
rh = h / 3
cw = w / 3
towels = [
    ("white", 0, 0),
    ("pink", 0, 1),
    ("sky", 0, 2),
    ("blue", 1, 0),
    ("grey", 1, 1),
    ("black", 1, 2),
]
pad = 0.04
for name, row, col in towels:
    save(
        im,
        (
            int(col * cw + cw * pad),
            int(row * rh + rh * pad),
            int((col + 1) * cw - cw * pad),
            int((row + 1) * rh - rh * pad),
        ),
        f"towel-{name}.png",
    )
save(im, (int(w * 0.08), int(rh * 2 + rh * pad), int(w * 0.48), int(h - rh * pad)), "towel-green.png")
save(im, (int(w * 0.52), int(rh * 2 + rh * pad), int(w * 0.92), int(h - rh * pad)), "towel-rose.png")

boxes(
    "visor-tour-lineup.png",
    [
        ("visor-tour-teal.png", (30, 70, 490, 520)),
        ("visor-tour-sky.png", (530, 50, 1010, 500)),
        ("visor-tour-red.png", (270, 300, 760, 730)),
        ("visor-tour-black.png", (10, 560, 500, 1010)),
        ("visor-tour-blue.png", (575, 590, 1024, 1024)),
    ],
)

boxes(
    "notebook-lineup.png",
    [("notebook-orange.png", (20, 20, 510, 510))],
)

im = Image.open(ROOT / "bottle-matte-lineup.png").convert("RGB")
w, h = im.size
names = ["navy", "sky", "white", "lilac", "charcoal"]
cw = w / 5
for i, name in enumerate(names):
    save(im, (int(i * cw), int(h * 0.12), int((i + 1) * cw), int(h * 0.98)), f"bottle-matte-{name}.png")

boxes(
    "bottle-cord-lineup.png",
    [
        ("bottle-cord-black.png", (10, 90, 165, 430)),
        ("bottle-cord-rose.png", (145, 90, 290, 410)),
        ("bottle-cord-blue.png", (255, 175, 365, 475)),
        ("bottle-cord-gold.png", (345, 40, 510, 360)),
        ("bottle-cord-silver.png", (385, 200, 530, 510)),
    ],
)

im = Image.open(ROOT / "power-usb-lineup.png").convert("RGB")
w, h = im.size
usb = ["silver", "black", "navy", "gold", "red", "white"]
left, right = 30, w - 30
top, bottom = int(h * 0.36), int(h * 0.74)
span = right - left
cw = span / 6
inset = cw * 0.12
for i, name in enumerate(usb):
    save(
        im,
        (int(left + i * cw + inset), top, int(left + (i + 1) * cw - inset), bottom),
        f"usb-{name}.png",
    )
