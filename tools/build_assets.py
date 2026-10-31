# assets-src/original içindeki ham görsellerden web için optimize edilmiş varlıkları üretir.
# Çalıştırma: npm run assets
import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets-src" / "original" / "images"
PUB = ROOT / "public"
EMBLEM_BOX = (264, 53, 1687, 1953)

TOURNAMENTS = {
    "SQTR_turnuvasi.png": "sqtr",
    "OSS_logo.png": "oss",
    "Squad_Rivals.png": "squad-rivals",
    "OISC.png": "oisc",
    "BoT.png": "bot",
    "SOT.png": "sot",
    "SC_Logo.png": "sgc",
    "SCL.png": "scl",
    "Rivals.png": "rivals",
}


def save_webp(im, path, quality=82):
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, "WEBP", quality=quality, method=6)
    return path.stat().st_size


def emblem(name):
    return Image.open(SRC / name).convert("RGBA").crop(EMBLEM_BOX)


def scaled_h(im, height):
    return im.resize((round(im.width * height / im.height), height), Image.LANCZOS)


def scaled_w(im, width):
    return im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)


def neutralize(im, gain, floor=0):
    """Mavi logonun renkli alanlarını griye çevirir; turuncu gözlere dokunmaz."""
    out = im.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if a and b >= r - 4:
                v = min(255, max(floor, round(max(r, g, b) * gain)))
                t = min(1.0, (b - r + 4) / 28)
                n = [round(c * (1 - t) + v * t) for c in (r, g, b)]
                px[x, y] = (n[0], n[1], n[2], a)
    return out


def main():
    report = {}
    base = emblem("owl-logo.png")

    # Hero: tarayıcı srcset ile uygun boyutu seçer, WebGL aynı dosyayı yeniden kullanır
    for w, q in ((760, 80), (1140, 80), (1423, 82)):
        report[f"hero/emblem-{w}.webp"] = save_webp(scaled_w(base, w), PUB / "hero" / f"emblem-{w}.webp", q)

    # Rütbe amblemleri: üç renk sitede var, gri ve beyaz mavi logodan türetildi
    ranks = {
        "black": base,
        "blue": emblem("blue_logo.png"),
        "yellow": emblem("LogoSar.png"),
        "red": emblem("LogoKirmizi.png"),
    }
    ranks["grey"] = neutralize(ranks["blue"], 1.05)
    ranks["white"] = neutralize(ranks["blue"], 2.1, 90)
    for key, im in ranks.items():
        report[f"img/owl-{key}.webp"] = save_webp(scaled_h(im, 560), PUB / "img" / f"owl-{key}.webp", 84)

    report["img/owl-mark.webp"] = save_webp(scaled_h(base, 72), PUB / "img" / "owl-mark.webp", 86)

    for name, slug in TOURNAMENTS.items():
        im = Image.open(SRC / name).convert("RGBA")
        im = im.crop(im.getbbox())
        im.thumbnail((360, 240), Image.LANCZOS)
        report[f"img/t/{slug}.webp"] = save_webp(im, PUB / "img" / "t" / f"{slug}.webp", 86)

    for size, name in ((32, "favicon-32.png"), (180, "apple-touch-icon.png"), (192, "icon-192.png"), (512, "icon-512.png")):
        canvas = Image.new("RGBA", (size, size), (0, 0, 0, 255))
        mark = scaled_h(base, round(size * 0.9))
        canvas.alpha_composite(mark, ((size - mark.width) // 2, (size - mark.height) // 2))
        canvas.convert("RGB").save(PUB / name, "PNG", optimize=True)

    print(json.dumps(report, indent=1))
    print(f"toplam {sum(report.values()) / 1024:.0f} KB")


if __name__ == "__main__":
    sys.exit(main())
