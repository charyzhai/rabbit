from pathlib import Path

from PIL import Image


PROJECT = Path("/home/ubuntu/rabbit-english-quest")
ASSETS = PROJECT / "assets" / "images"

TARGETS = {
    "icon.png": 512,
    "splash-icon.png": 512,
    "favicon.png": 256,
    "android-icon-foreground.png": 432,
}


def compress_image(path: Path, max_dimension: int) -> None:
    with Image.open(path) as source:
        image = source.convert("RGBA")
        image.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
        image.save(path, format="PNG", optimize=True, compress_level=9)


for filename, size in TARGETS.items():
    compress_image(ASSETS / filename, size)
    print(f"compressed {filename}")
