#!/usr/bin/env python3
"""Generate assets/og-card.png — the 1200x630 social embed card.

A stylized miniature of the atlas: starfield, the eight system clusters in
their map colors, faint warp lanes, and the title. Deterministic output.
"""
import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
ROOT = Path(__file__).resolve().parent.parent

BG = (5, 8, 15)
INK = (233, 238, 248)
DIM = (143, 160, 189)
ACCENT = (242, 176, 74)

# cluster centers from index.html, mapped from 1600x1000 into the card
CLUSTERS = [
    ((470, 430), '#4FD8CF', 11),   # Combat Core
    ((845, 205), '#9D8CFF', 3),    # Isolytic & Apex
    ((295, 750), '#FF8A5C', 4),    # Status Effects
    ((1075, 545), '#FFC66B', 6),   # Officer Mechanics
    ((1345, 265), '#FF6BB5', 9),   # Armadas
    ((1275, 815), '#5BA8FF', 7),   # Galaxy & Travel
    ((790, 865), '#6BDB8C', 5),    # Ships & Economy
    ((160, 215), '#FF5A6E', 2),    # PvP & Loot
]

def hex_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

def mapxy(x, y):
    # right-align the map so the left side stays quiet for the title
    return 260 + x / 1600 * (W - 300), 40 + y / 1000 * (H - 80)

img = Image.new('RGB', (W, H), BG)
d = ImageDraw.Draw(img, 'RGBA')

rng = random.Random(1701)  # NCC-1701, of course
for _ in range(170):
    x, y = rng.uniform(0, W), rng.uniform(0, H)
    r = rng.uniform(0.5, 1.6)
    a = rng.randint(60, 200)
    d.ellipse([x - r, y - r, x + r, y + r], fill=(203, 216, 239, a))

# faint warp lanes between a few systems
lanes = [(0, 1), (0, 2), (0, 3), (1, 4), (3, 4), (3, 5), (0, 6), (6, 5), (7, 0)]
for a, b in lanes:
    (x1, y1), (x2, y2) = mapxy(*CLUSTERS[a][0]), mapxy(*CLUSTERS[b][0])
    d.line([x1, y1, x2, y2], fill=(242, 176, 74, 40), width=1)

# cluster stars
for (cx, cy), color, n in CLUSTERS:
    cx, cy = mapxy(cx, cy)
    rgb = hex_rgb(color)
    for i in range(n):
        ang = i / n * math.tau + n
        rad = 18 + (i % 2) * 16 + (i * 7) % 9
        x, y = cx + math.cos(ang) * rad * 1.3, cy + math.sin(ang) * rad * 0.9
        d.ellipse([x - 8, y - 8, x + 8, y + 8], fill=rgb + (36,))
        d.ellipse([x - 2.6, y - 2.6, x + 2.6, y + 2.6], fill=rgb + (255,))
    d.ellipse([cx - 12, cy - 12, cx + 12, cy + 12], fill=rgb + (46,))
    d.ellipse([cx - 4, cy - 4, cx + 4, cy + 4], fill=rgb + (255,))

def font(size, candidates):
    for path, index in candidates:
        try:
            return ImageFont.truetype(path, size, index=index)
        except OSError:
            continue
    return ImageFont.load_default()

display = lambda s: font(s, [
    ('/System/Library/Fonts/Avenir Next Condensed.ttc', 4),  # demi bold
    ('/System/Library/Fonts/HelveticaNeue.ttc', 0),
])
mono = lambda s: font(s, [('/System/Library/Fonts/Menlo.ttc', 0)])

def spaced(draw, pos, text, fnt, fill, tracking):
    x, y = pos
    for ch in text:
        draw.text((x, y), ch, font=fnt, fill=fill)
        x += draw.textlength(ch, font=fnt) + tracking

# left panel scrim so the title reads over the map edge
scrim = Image.new('RGBA', (W, H), (0, 0, 0, 0))
sd = ImageDraw.Draw(scrim)
for i in range(420):
    sd.line([i, 0, i, H], fill=(5, 8, 15, int(235 * (1 - i / 420))))
img = Image.alpha_composite(img.convert('RGBA'), scrim)
d = ImageDraw.Draw(img, 'RGBA')

spaced(d, (64, 200), 'STFC', display(64), INK, 14)
spaced(d, (64, 272), 'MECHANICS', display(64), ACCENT, 14)
spaced(d, (64, 344), 'ATLAS', display(64), INK, 14)
d.line([66, 440, 380, 440], fill=(27, 42, 69, 255), width=2)
d.text((66, 456), 'A galaxy map of game mechanics.', font=mono(19), fill=DIM)
d.text((66, 486), 'Every star is a topic dossier.', font=mono(19), fill=DIM)

out = ROOT / 'assets'
out.mkdir(exist_ok=True)
img.convert('RGB').save(out / 'og-card.png', optimize=True)
print(f'wrote {out / "og-card.png"}')
