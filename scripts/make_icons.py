"""Render the Via logo to the PNG sizes browsers need. Dev-only: `python scripts/make_icons.py`."""

from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "src" / "icons"
GREEN = (14, 124, 102, 255)
WHITE = (255, 255, 255, 255)


def render(size: int) -> Image.Image:
    s = 16  # supersample
    u = size * s / 32  # one unit of the 32x32 logo viewBox
    img = Image.new("RGBA", (size * s, size * s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, size * s - 1, size * s - 1], radius=8 * u, fill=GREEN)
    d.ellipse([6 * u, 13 * u, 12 * u, 19 * u], fill=WHITE)
    w = round(2.6 * u)
    for a, b in [((13, 16), (21, 16)), ((17.5, 11.5), (22, 16)), ((22, 16), (17.5, 20.5))]:
        d.line([(a[0] * u, a[1] * u), (b[0] * u, b[1] * u)], fill=WHITE, width=w)
        for x, y in (a, b):
            d.ellipse([x * u - w / 2, y * u - w / 2, x * u + w / 2, y * u + w / 2], fill=WHITE)
    return img.resize((size, size), Image.LANCZOS)


OUT.mkdir(parents=True, exist_ok=True)
for size in (16, 32, 48, 96, 128):
    render(size).save(OUT / f"icon-{size}.png")
