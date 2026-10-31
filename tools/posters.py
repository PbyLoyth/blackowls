# Video karelerini WebP afişe çevirir.
import sys
from pathlib import Path

from PIL import Image

src, out = Path(sys.argv[1]), Path(sys.argv[2])
for png in src.glob("*.png"):
    Image.open(png).convert("RGB").save(out / f"{png.stem}.webp", "WEBP", quality=74, method=6)
