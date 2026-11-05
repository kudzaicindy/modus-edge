from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "public" / "images"


def square_pad(cell, bg=(255, 255, 255), size=900):
    cell = cell.convert("RGB")
    w, h = cell.size
    side = max(w, h)
    canvas = Image.new("RGB", (side, side), bg)
    canvas.paste(cell, ((side - w) // 2, (side - h) // 2))
    if side != size:
        canvas = canvas.resize((size, size), Image.Resampling.LANCZOS)
    return canvas


def crop_frac(im, box, pad=0.02):
    w, h = im.size
    x0, y0, x1, y1 = box
    dx = (x1 - x0) * pad
    dy = (y1 - y0) * pad
    return im.crop(
        (
            int((x0 + dx) * w),
            int((y0 + dy) * h),
            int((x1 - dx) * w),
            int((y1 - dy) * h),
        )
    )


def save(im, name, box, bg=(255, 255, 255)):
    out = square_pad(crop_frac(im, box), bg=bg)
    path = ROOT / name
    out.save(path, optimize=True)
    print("wrote", name, out.size)


def grid2(im, names, order=("tl", "tr", "bl", "br"), bg=(255, 255, 255)):
    boxes = {
        "tl": (0.0, 0.0, 0.5, 0.5),
        "tr": (0.5, 0.0, 1.0, 0.5),
        "bl": (0.0, 0.5, 0.5, 1.0),
        "br": (0.5, 0.5, 1.0, 1.0),
    }
    for name, key in zip(names, order):
        save(im, name, boxes[key], bg=bg)


def main_thumbs(im, main_name, thumb_names, main_box=(0.02, 0.01, 0.98, 0.68), thumb_y=(0.70, 0.99), bg=(255, 255, 255)):
    save(im, main_name, main_box, bg=bg)
    n = len(thumb_names)
    y0, y1 = thumb_y
    for i, name in enumerate(thumb_names):
        x0 = i / n
        x1 = (i + 1) / n
        save(im, name, (x0, y0, x1, y1), bg=bg)


def hero_thumbs(src, prefix, colors):
    im = Image.open(ROOT / src)
    main = f"{prefix}-{colors[0]}.png"
    thumbs = [f"{prefix}-{c}.png" for c in colors[1:]]
    main_thumbs(im, main, thumbs)


def main():
    im = Image.open(ROOT / "visor-fore-group.png")
    save(im, "visor-fore-white.png", (0.22, 0.02, 0.78, 0.52))
    save(im, "visor-fore-green.png", (0.00, 0.48, 0.50, 0.98))
    save(im, "visor-fore-black.png", (0.50, 0.48, 1.00, 0.98))

    im = Image.open(ROOT / "visor-tm-print-group.png")
    save(im, "visor-tm-print-white.png", (0.00, 0.12, 0.50, 0.55))
    save(im, "visor-tm-print-black.png", (0.50, 0.12, 1.00, 0.55))

    im = Image.open(ROOT / "visor-pxg-group.png")
    save(im, "visor-pxg-white.png", (0.08, 0.02, 0.92, 0.50))
    save(im, "visor-pxg-black.png", (0.08, 0.50, 0.92, 0.98))

    im = Image.open(ROOT / "visor-pm99-group.png")
    save(im, "visor-pm99-white.png", (0.08, 0.02, 0.92, 0.68))
    save(im, "visor-pm99-black.png", (0.34, 0.70, 0.66, 0.99))

    im = Image.open(ROOT / "bucket-hat-tm-print.png")
    save(im, "bucket-hat-tm-print-black.png", (0.05, 0.18, 0.58, 0.92), bg=(245, 245, 245))
    save(im, "bucket-hat-tm-print-white.png", (0.42, 0.12, 0.95, 0.82), bg=(245, 245, 245))

    im = Image.open(ROOT / "bucket-hat-malbon.png")
    grid2(
        im,
        [
            "bucket-hat-malbon-white-script.png",
            "bucket-hat-malbon-white-character.png",
            "bucket-hat-malbon-black-script.png",
            "bucket-hat-malbon-black-character.png",
        ],
    )

    im = Image.open(ROOT / "bucket-hat-pxg.png")
    save(im, "bucket-hat-pxg-white.png", (0.00, 0.00, 0.50, 0.50))
    save(im, "bucket-hat-pxg-black.png", (0.00, 0.50, 0.50, 1.00))

    im = Image.open(ROOT / "bucket-hat-titleist.png")
    grid2(
        im,
        [
            "bucket-hat-titleist-black-script.png",
            "bucket-hat-titleist-white-script.png",
            "bucket-hat-titleist-black-box.png",
            "bucket-hat-titleist-white-box.png",
        ],
    )

    im = Image.open(ROOT / "bucket-hat-w-logo.png")
    grid2(
        im,
        [
            "bucket-hat-w-logo-white-large.png",
            "bucket-hat-w-logo-white-circle.png",
            "bucket-hat-w-logo-black-large.png",
            "bucket-hat-w-logo-black-circle.png",
        ],
    )

    hero_thumbs("cap-jl-bridge.png", "cap-jl-bridge", ["white", "red", "black", "navy"])
    hero_thumbs("cap-titleist-fj.png", "cap-titleist-fj", ["white", "black", "grey", "red"])
    hero_thumbs("cap-titleist-perforated.png", "cap-titleist-perforated", ["white", "black", "red", "blue"])
    hero_thumbs("cap-callaway-apex.png", "cap-callaway-apex", ["white", "black", "red", "navy"])
    hero_thumbs("cap-honma-wow.png", "cap-honma-wow", ["white", "red", "black", "blue"])
    hero_thumbs("cap-ua-circle.png", "cap-ua-circle", ["white", "red", "black", "navy"])
    hero_thumbs("cap-pmg-perforated.png", "cap-pmg-perforated", ["white", "red", "black", "sky"])

    im = Image.open(ROOT / "cap-titleist-mesh.png")
    names = [
        "cap-titleist-mesh-white-pink.png",
        "cap-titleist-mesh-white-lime.png",
        "cap-titleist-mesh-white-black.png",
        "cap-titleist-mesh-black-red.png",
        "cap-titleist-mesh-black-blue.png",
        "cap-titleist-mesh-black-white.png",
    ]
    for i, name in enumerate(names):
        r, c = divmod(i, 3)
        save(im, name, (c / 3, r / 2, (c + 1) / 3, (r + 1) / 2))

    im = Image.open(ROOT / "cap-titleist-marker.png")
    grid2(
        im,
        [
            "cap-titleist-marker-white-red.png",
            "cap-titleist-marker-white-black.png",
            "cap-titleist-marker-black-white.png",
            "cap-titleist-marker-black-lime.png",
        ],
        bg=(245, 245, 245),
    )

    im = Image.open(ROOT / "cap-titleist-splatter.png")
    for i, name in enumerate(
        [
            "cap-titleist-splatter-green.png",
            "cap-titleist-splatter-white.png",
            "cap-titleist-splatter-black.png",
        ]
    ):
        save(im, name, (i / 3, 0.15, (i + 1) / 3, 0.9), bg=(40, 80, 40))

    im = Image.open(ROOT / "cap-malbon-script.png")
    save(im, "cap-malbon-script-cyan.png", (0.00, 0.00, 0.48, 0.48), bg=(30, 90, 40))
    save(im, "cap-malbon-script-white.png", (0.08, 0.35, 0.55, 0.85), bg=(30, 90, 40))
    save(im, "cap-malbon-script-black.png", (0.45, 0.20, 0.92, 0.70), bg=(30, 90, 40))
    save(im, "cap-malbon-script-green.png", (0.52, 0.48, 1.00, 0.98), bg=(30, 90, 40))

    im = Image.open(ROOT / "cap-tm-performance.png")
    save(im, "cap-tm-performance-white.png", (0.22, 0.42, 0.78, 0.92), bg=(30, 90, 40))
    save(im, "cap-tm-performance-red.png", (0.00, 0.08, 0.45, 0.55), bg=(30, 90, 40))
    save(im, "cap-tm-performance-blue.png", (0.28, 0.02, 0.72, 0.48), bg=(30, 90, 40))
    save(im, "cap-tm-performance-black.png", (0.55, 0.12, 1.00, 0.58), bg=(30, 90, 40))

    im = Image.open(ROOT / "cap-pxg-tropical.png")
    grid2(
        im,
        [
            "cap-pxg-tropical-white-silver.png",
            "cap-pxg-tropical-white-black.png",
            "cap-pxg-tropical-navy-floral.png",
            "cap-pxg-tropical-black-floral.png",
        ],
    )

    im = Image.open(ROOT / "cap-ua-circle-turf.png")
    for i, name in enumerate(
        [
            "cap-ua-circle-turf-white.png",
            "cap-ua-circle-turf-red.png",
            "cap-ua-circle-turf-black.png",
            "cap-ua-circle-turf-navy.png",
        ]
    ):
        save(im, name, (i / 4, 0.05, (i + 1) / 4, 0.95), bg=(30, 90, 40))

    print("done")


if __name__ == "__main__":
    main()
