# Logodaki göz merkezlerini, göz bebeklerini ve marka renklerini ölçer.
import sys
from collections import Counter
from pathlib import Path

from PIL import Image

src = Path(sys.argv[1])
crop = (264, 53, 1687, 1953)
im = Image.open(src / "owl-logo.png").convert("RGBA").crop(crop)
w, h = im.size
print("emblem", w, h)
small = im.resize((w // 2, h // 2), Image.LANCZOS)
px = small.load()
W, H = small.size


def is_orange(r, g, b):
    return r > 170 and 70 < g < 175 and b < 90 and r - g > 55


pts = [(x, y) for y in range(H // 8, H // 2) for x in range(W) if is_orange(*px[x, y][:3])]
mid = sum(p[0] for p in pts) / len(pts)
for name, group in (("sol", [p for p in pts if p[0] < mid]), ("sag", [p for p in pts if p[0] >= mid])):
    xs = [p[0] for p in group]
    ys = [p[1] for p in group]
    cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
    rx, ry = (max(xs) - min(xs)) / 2, (max(ys) - min(ys)) / 2
    # Göz bebeği: iris içindeki koyu piksellerin ağırlık merkezi
    dark = [
        (x, y)
        for y in range(int(cy - ry), int(cy + ry))
        for x in range(int(cx - rx), int(cx + rx))
        if sum(px[x, y][:3]) < 90 and (x - cx) ** 2 / rx**2 + (y - cy) ** 2 / ry**2 < 0.8
    ]
    px_c = (sum(p[0] for p in dark) / len(dark), sum(p[1] for p in dark) / len(dark))
    pr = (len(dark) / 3.14159) ** 0.5
    print(
        f"goz {name}: merkez=({cx * 2:.0f},{cy * 2:.0f}) r=({rx * 2:.0f},{ry * 2:.0f}) "
        f"uv=({cx / W:.4f},{cy / H:.4f}) ruv=({rx / W:.4f},{ry / H:.4f}) | "
        f"bebek uv=({px_c[0] / W:.4f},{px_c[1] / H:.4f}) r={pr * 2:.1f}px ruv={pr / H:.4f}"
    )


def top_colors(path, keep):
    img = Image.open(path).convert("RGBA").resize((400, 400), Image.LANCZOS)
    c = Counter()
    for r, g, b, a in img.getdata():
        if a > 200 and keep(r, g, b):
            c[(r // 8 * 8, g // 8 * 8, b // 8 * 8)] += 1
    return ["#%02X%02X%02X" % k for k, _ in c.most_common(4)]


print("amber", top_colors(src / "owl-logo.png", is_orange))
print("altin", top_colors(src / "owl-logo.png", lambda r, g, b: r > 150 and 120 < g < 200 and b < 130 and r - b > 60))
print("mavi", top_colors(src / "blue_logo.png", lambda r, g, b: b > r + 25 and b > 60))
print("sari", top_colors(src / "LogoSar.png", lambda r, g, b: g > b + 40 and r > 80 and abs(r - g) < 50))
print("kirmizi", top_colors(src / "LogoKirmizi.png", lambda r, g, b: r > g + 50 and r > b + 50 and g < 70))
