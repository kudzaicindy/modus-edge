from pathlib import Path
from PIL import Image

ROOT = Path(r"c:\Users\HP\Documents\GitHub\modus-edge\public\images")


def save(im, box, name):
    out = ROOT / name
    im.crop(box).save(out)
    print(out.name, box, im.size)


im = Image.open(ROOT / "jacket-women-grid.png").convert("RGB")
w, h = im.size
cw, ch = w / 3, h / 3
jackets = [
    ("black", 0, 0),
    ("cream", 0, 1),
    ("navy", 0, 2),
    ("burgundy", 1, 0),
    ("pink", 1, 1),
    ("olive", 1, 2),
    ("grey", 2, 0),
]
for name, row, col in jackets:
    save(
        im,
        (int(col * cw + 8), int(row * ch + 8), int((col + 1) * cw - 8), int((row + 1) * ch - 8)),
        f"jacket-women-{name}.png",
    )

im = Image.open(ROOT / "desk-notebook-lineup.png").convert("RGB")
boxes = {
    "black": (70, 260, 390, 800),
    "navy": (250, 240, 560, 760),
    "tan": (430, 220, 740, 740),
    "grey": (600, 200, 940, 720),
}
for name, box in boxes.items():
    save(im, box, f"desk-notebook-{name}.png")

im = Image.open(ROOT / "desk-pen-lineup.png").convert("RGB")
w, h = im.size
pens = [
    ("black", (80, 90, 980, 310)),
    ("navy", (80, 220, 980, 430)),
    ("silver", (80, 350, 980, 560)),
    ("red", (80, 480, 980, 700)),
    ("white", (80, 620, 980, 860)),
]
for name, box in pens:
    save(im, box, f"desk-pen-{name}.png")

src = ROOT / "bottle-vacuum.png"
if not src.exists():
    src = ROOT / "bottle-label-lineup.png"
im = Image.open(src).convert("RGB")
print("vacuum source", im.size)
vw, vh = im.size
# row of standing bottles + one lying navy
save(im, (0, int(vh * 0.48), int(vw * 0.38), vh), "bottle-vac-navy.png")
save(im, (int(vw * 0.18), int(vh * 0.12), int(vw * 0.40), int(vh * 0.72)), "bottle-vac-lilac.png")
save(im, (int(vw * 0.34), int(vh * 0.22), int(vw * 0.52), int(vh * 0.78)), "bottle-vac-black.png")
save(im, (int(vw * 0.48), int(vh * 0.22), int(vw * 0.66), int(vh * 0.78)), "bottle-vac-white.png")
save(im, (int(vw * 0.60), int(vh * 0.08), int(vw * 0.80), int(vh * 0.62)), "bottle-vac-mint.png")
save(im, (int(vw * 0.76), int(vh * 0.22), int(vw * 0.99), int(vh * 0.78)), "bottle-vac-sand.png")

im = Image.open(ROOT / "bottle-straw.png").convert("RGB")
print("straw", im.size)
sw, sh = im.size
save(im, (int(sw * 0.18), int(sh * 0.42), int(sw * 0.58), sh), "bottle-straw-white.png")
save(im, (int(sw * 0.42), int(sh * 0.38), int(sw * 0.78), int(sh * 0.98)), "bottle-straw-navy.png")
save(im, (int(sw * 0.68), int(sh * 0.28), int(sw * 0.98), int(sh * 0.92)), "bottle-straw-black.png")
save(im, (int(sw * 0.28), int(sh * 0.02), int(sw * 0.58), int(sh * 0.48)), "bottle-straw-white-back.png")
save(im, (int(sw * 0.48), int(sh * 0.02), int(sw * 0.78), int(sh * 0.42)), "bottle-straw-pink.png")
save(im, (0, int(sh * 0.08), int(sw * 0.28), int(sh * 0.72)), "bottle-straw-teal.png")
