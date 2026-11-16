"""Disegna l'icona dell'app (la zampa bianca sul quadrato lime) in SVG e nei PNG di public/icons/.

    python3 scripts/icona/disegna.py      (serve Pillow: pip install pillow)

Le forme sono le stesse nei due formati: un fondo con il gradiente lime, il cuscinetto e quattro dita.
Il maskable ha la zampa più piccola, così resta dentro il cerchio di Android.
"""
import math
from pathlib import Path

from PIL import Image, ImageDraw

QUI = Path(__file__).resolve().parent
ICONE = QUI.parent.parent / "public" / "icons"

ALTO, BASSO = (0xC2, 0xE6, 0x66), (0x5A, 0x95, 0x1F)   # gradiente in diagonale

# In unità su 100: (cx, cy, rx, ry, rotazione in gradi)
DITA = [(27, 45, 8.6, 11, -28), (40.5, 30.5, 9, 12, -8), (59.5, 30.5, 9, 12, 8), (73, 45, 8.6, 11, 28)]
CUSCINETTO = [(50, 62, 18.5, 15, 0), (43.5, 70.5, 10, 8.5, -12), (56.5, 70.5, 10, 8.5, 12)]


def ellisse(cx, cy, rx, ry, rot, scala, dx=0, dy=0, n=96):
    a = math.radians(rot)
    punti = []
    for i in range(n):
        t = 2 * math.pi * i / n
        x, y = rx * math.cos(t), ry * math.sin(t)
        punti.append(((cx + x * math.cos(a) - y * math.sin(a)) * scala + dx, (cy + x * math.sin(a) + y * math.cos(a)) * scala + dy))
    return punti


def disegna(lato, zampa=1.0, angoli=True):
    s = 4  # sovracampionamento
    L = lato * s
    fondo = Image.new("RGB", (L, L))
    px = fondo.load()
    for y in range(L):
        for x in range(L):
            t = (x + y) / (2 * L)
            px[x, y] = tuple(round(ALTO[i] + (BASSO[i] - ALTO[i]) * t) for i in range(3))
    img = Image.new("RGBA", (L, L), (0, 0, 0, 0))
    maschera = Image.new("L", (L, L), 0)
    ImageDraw.Draw(maschera).rounded_rectangle([0, 0, L - 1, L - 1], radius=int(L * 0.22) if angoli else 0, fill=255)
    img.paste(fondo, (0, 0), maschera)
    d = ImageDraw.Draw(img)
    scala = L / 100 * zampa
    off = (L - 100 * scala) / 2
    for forma in DITA + CUSCINETTO:
        d.polygon(ellisse(*forma, scala, off, off + 2 * scala), fill=(255, 255, 255, 255))
    return img.resize((lato, lato), Image.LANCZOS)


def svg():
    forme = "".join(
        f'<ellipse cx="{cx}" cy="{cy + 2}" rx="{rx}" ry="{ry}" transform="rotate({r} {cx} {cy + 2})"/>' for cx, cy, rx, ry, r in DITA + CUSCINETTO
    )
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">'
        '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">'
        '<stop offset="0" stop-color="#c2e666"/><stop offset="1" stop-color="#5a951f"/></linearGradient></defs>'
        f'<rect width="100" height="100" rx="22" fill="url(#g)"/><g fill="#fff">{forme}</g></svg>\n'
    )


if __name__ == "__main__":
    ICONE.mkdir(parents=True, exist_ok=True)
    (ICONE / "zampa.svg").write_text(svg())
    # iOS arrotonda da sé gli angoli dell'apple-touch-icon: lì il quadrato è pieno.
    disegna(180, angoli=False).convert("RGB").save(ICONE / "zampa-180.png")
    disegna(192).save(ICONE / "zampa-192.png")
    disegna(512).save(ICONE / "zampa-512.png")
    disegna(512, zampa=0.72, angoli=False).convert("RGB").save(ICONE / "zampa-maskable-512.png")
    print("Icone aggiornate in public/icons/.")
