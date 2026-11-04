from pathlib import Path
from PIL import Image

ROOT = Path(r"c:\Users\HP\Documents\GitHub\modus-edge\public\images")


def save(im, box, name):
    w, h = im.size
    x0, y0, x1, y1 = [int(v) for v in box]
    box = (max(0, x0), max(0, y0), min(w, x1), min(h, y1))
    im.crop(box).save(ROOT / name)
    print(name, box, im.size)


def frac(im, left, top, right, bottom):
    w, h = im.size
    return (w * left, h * top, w * right, h * bottom)


im = Image.open(ROOT / "polo-stripe.png").convert("RGB")
print("polo-stripe", im.size)
save(im, frac(im, 0.00, 0.02, 0.68, 0.99), "polo-stripe-white.png")
save(im, frac(im, 0.66, 0.00, 1.00, 0.34), "polo-stripe-black.png")
save(im, frac(im, 0.66, 0.32, 1.00, 0.66), "polo-stripe-teal.png")
save(im, frac(im, 0.66, 0.64, 1.00, 0.99), "polo-stripe-orange.png")

im = Image.open(ROOT / "polo-panel.png").convert("RGB")
print("polo-panel", im.size)
save(im, frac(im, 0.00, 0.02, 0.68, 0.99), "polo-panel-white-black.png")
save(im, frac(im, 0.66, 0.00, 1.00, 0.34), "polo-panel-grey.png")
save(im, frac(im, 0.66, 0.32, 1.00, 0.66), "polo-panel-black-white.png")

im = Image.open(ROOT / "polo-piped.png").convert("RGB")
print("polo-piped", im.size)
save(im, frac(im, 0.00, 0.06, 0.28, 0.98), "polo-piped-white.png")
save(im, frac(im, 0.24, 0.06, 0.50, 0.98), "polo-piped-coral.png")
save(im, frac(im, 0.46, 0.06, 0.74, 0.98), "polo-piped-grey.png")
save(im, frac(im, 0.70, 0.06, 0.99, 0.98), "polo-piped-navy.png")

im = Image.open(ROOT / "power-bank-slim.png").convert("RGB")
print("power-bank-slim", im.size)
for i, name in enumerate(["black", "white", "navy", "grey", "red"]):
    save(im, frac(im, 0.015 + i * 0.194, 0.22, 0.015 + (i + 1) * 0.194, 0.78), f"power-bank-slim-{name}.png")

im = Image.open(ROOT / "power-wireless.png").convert("RGB")
print("power-wireless", im.size)
save(im, frac(im, 0.02, 0.28, 0.58, 0.88), "power-wireless-black.png")
save(im, frac(im, 0.42, 0.10, 0.98, 0.74), "power-wireless-white.png")

im = Image.open(ROOT / "gift-keyring-wood.png").convert("RGB")
print("gift-keyring-wood", im.size)
save(im, frac(im, 0.00, 0.22, 0.54, 0.99), "gift-keyring-round.png")
save(im, frac(im, 0.42, 0.00, 0.99, 0.88), "gift-keyring-rect.png")

im = Image.open(ROOT / "set-coffee-mug.png").convert("RGB")
print("set-coffee-mug", im.size)
save(im, frac(im, 0.08, 0.16, 0.52, 0.74), "set-coffee-white.png")
save(im, frac(im, 0.42, 0.16, 0.88, 0.74), "set-coffee-navy.png")

im = Image.open(ROOT / "bag-roll-pair.png").convert("RGB")
print("bag-roll-pair", im.size)
save(im, frac(im, 0.48, 0.08, 0.96, 0.96), "bag-roll-tan.png")

im = Image.open(ROOT / "hat-bucket.png").convert("RGB")
print("hat-bucket", im.size)
save(im, frac(im, 0.00, 0.38, 0.46, 0.96), "hat-bucket-navy.png")
save(im, frac(im, 0.28, 0.08, 0.72, 0.58), "hat-bucket-khaki.png")
save(im, frac(im, 0.54, 0.32, 1.00, 0.90), "hat-bucket-black.png")

im = Image.open(ROOT / "hat-knit.png").convert("RGB")
print("hat-knit", im.size)
save(im, frac(im, 0.00, 0.42, 0.48, 0.99), "hat-knit-navy.png")
save(im, frac(im, 0.30, 0.06, 0.70, 0.52), "hat-knit-grey.png")
save(im, frac(im, 0.52, 0.36, 1.00, 0.92), "hat-knit-black.png")

im = Image.open(ROOT / "desk-lanyard.png").convert("RGB")
print("desk-lanyard", im.size)
save(im, frac(im, 0.00, 0.04, 0.36, 0.98), "desk-lanyard-navy.png")
save(im, frac(im, 0.32, 0.04, 0.68, 0.98), "desk-lanyard-black.png")
save(im, frac(im, 0.64, 0.04, 1.00, 0.98), "desk-lanyard-red.png")

im = Image.open(ROOT / "mug-cork.png").convert("RGB")
print("mug-cork", im.size)
save(im, frac(im, 0.00, 0.18, 0.42, 0.78), "mug-cork-navy.png")
save(im, frac(im, 0.28, 0.32, 0.72, 0.98), "mug-cork-white.png")
save(im, frac(im, 0.58, 0.16, 1.00, 0.78), "mug-cork-grey.png")

im = Image.open(ROOT / "cup-fold.png").convert("RGB")
print("cup-fold", im.size)
save(im, frac(im, 0.00, 0.18, 0.30, 0.78), "cup-fold-navy.png")
save(im, frac(im, 0.22, 0.28, 0.50, 0.82), "cup-fold-grey.png")
save(im, frac(im, 0.46, 0.32, 0.74, 0.82), "cup-fold-teal.png")

im = Image.open(ROOT / "gift-mini-fan.png").convert("RGB")
print("gift-mini-fan", im.size)
save(im, frac(im, 0.00, 0.32, 0.42, 0.99), "gift-mini-fan-navy.png")
save(im, frac(im, 0.32, 0.08, 0.68, 0.78), "gift-mini-fan-white.png")
save(im, frac(im, 0.58, 0.28, 1.00, 0.98), "gift-mini-fan-black.png")

im = Image.open(ROOT / "bag-drawstring.png").convert("RGB")
print("bag-drawstring", im.size)
save(im, frac(im, 0.00, 0.16, 0.38, 0.92), "bag-drawstring-navy.png")
save(im, frac(im, 0.32, 0.16, 0.68, 0.92), "bag-drawstring-black.png")
save(im, frac(im, 0.62, 0.16, 1.00, 0.92), "bag-drawstring-grey.png")

im = Image.open(ROOT / "bag-velvet.png").convert("RGB")
print("bag-velvet", im.size)
save(im, frac(im, 0.00, 0.22, 0.36, 0.82), "bag-velvet-navy.png")
save(im, frac(im, 0.32, 0.22, 0.68, 0.82), "bag-velvet-black.png")
save(im, frac(im, 0.64, 0.22, 1.00, 0.82), "bag-velvet-burgundy.png")

im = Image.open(ROOT / "bottle-wood-lid.png").convert("RGB")
print("bottle-wood-lid", im.size)
save(im, frac(im, 0.00, 0.08, 0.36, 0.96), "bottle-wood-black.png")
save(im, frac(im, 0.32, 0.08, 0.68, 0.96), "bottle-wood-white.png")
save(im, frac(im, 0.64, 0.08, 1.00, 0.96), "bottle-wood-navy.png")

im = Image.open(ROOT / "umbrella-fold.png").convert("RGB")
print("umbrella-fold", im.size)
save(im, frac(im, 0.08, 0.08, 0.52, 0.96), "umbrella-fold-black.png")
save(im, frac(im, 0.48, 0.08, 0.92, 0.96), "umbrella-fold-navy.png")

im = Image.open(ROOT / "bag-tote-cotton.png").convert("RGB")
print("bag-tote-cotton", im.size)
save(im, frac(im, 0.00, 0.06, 0.52, 0.98), "bag-tote-natural.png")
save(im, frac(im, 0.50, 0.12, 0.98, 0.98), "bag-tote-navy.png")

im = Image.open(ROOT / "bag-cooler.png").convert("RGB")
print("bag-cooler", im.size)
save(im, frac(im, 0.04, 0.14, 0.52, 0.78), "bag-cooler-navy.png")
save(im, frac(im, 0.46, 0.28, 0.96, 0.90), "bag-cooler-grey.png")

im = Image.open(ROOT / "desk-card-holder.png").convert("RGB")
print("desk-card-holder", im.size)
save(im, frac(im, 0.08, 0.16, 0.50, 0.90), "desk-card-black.png")
save(im, frac(im, 0.50, 0.16, 0.94, 0.90), "desk-card-tan.png")

im = Image.open(ROOT / "bottle-temp-mug.png").convert("RGB")
print("bottle-temp-mug", im.size)
save(im, frac(im, 0.06, 0.08, 0.50, 0.96), "bottle-temp-black.png")
save(im, frac(im, 0.50, 0.08, 0.94, 0.96), "bottle-temp-white.png")

im = Image.open(ROOT / "desk-phone-stand.png").convert("RGB")
print("desk-phone-stand", im.size)
save(im, frac(im, 0.02, 0.16, 0.50, 0.92), "desk-phone-silver.png")
save(im, frac(im, 0.50, 0.16, 0.98, 0.92), "desk-phone-black.png")

im = Image.open(ROOT / "desk-writing-pad.png").convert("RGB")
print("desk-writing-pad", im.size)
save(im, frac(im, 0.04, 0.10, 0.50, 0.94), "desk-writing-black.png")
save(im, frac(im, 0.50, 0.10, 0.96, 0.94), "desk-writing-tan.png")

im = Image.open(ROOT / "bag-document.png").convert("RGB")
print("bag-document", im.size)
save(im, frac(im, 0.04, 0.16, 0.52, 0.90), "bag-document-tan.png")
save(im, frac(im, 0.48, 0.16, 0.96, 0.90), "bag-document-black.png")

im = Image.open(ROOT / "power-mouse-pad.png").convert("RGB")
print("power-mouse-pad", im.size)
save(im, frac(im, 0.04, 0.38, 0.72, 0.96), "power-mouse-black.png")
save(im, frac(im, 0.40, 0.16, 0.98, 0.62), "power-mouse-navy.png")

im = Image.open(ROOT / "jacket-women-colors.png").convert("RGB")
print("jacket-women-colors", im.size)
save(im, frac(im, 0.00, 0.00, 0.50, 0.66), "jacket-women-black.png")
