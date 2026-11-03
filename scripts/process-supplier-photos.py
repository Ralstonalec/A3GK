"""Crops the supplier product photographs into the close-ups used on the site. Run with: python3 scripts/process-supplier-photos.py <folder with 26.png..30.png>"""
import sys
from PIL import Image
src = sys.argv[1]
out = 'public/photos'
def trim_white(im, thresh=226):
    """Trims near-white borders and white columns at the edges so the close-ups sit cleanly on the dark cards."""
    g = im.convert('L'); w, h = g.size; px = g.load()
    def col_bright(x): return sum(px[x, y] for y in range(h)) / h
    def row_bright(y): return sum(px[x, y] for x in range(w)) / w
    l, r, t, b = 0, w, 0, h
    while l < r - 1 and col_bright(l) > thresh: l += 1
    while r > l + 1 and col_bright(r - 1) > thresh: r -= 1
    while t < b - 1 and row_bright(t) > thresh: t += 1
    while b > t + 1 and row_bright(b - 1) > thresh: b -= 1
    im = im.crop((l + 2, t + 2, r - 2, b - 2))
    return fill_background(im)


def fill_background(im, dark=(14, 17, 23), thresh=40):
    """Replaces white studio background that touches the edges with the card's dark colour."""
    from PIL import ImageDraw
    w, h = im.size; px = im.load()
    seeds = [(x, 0) for x in range(0, w, 6)] + [(x, h - 1) for x in range(0, w, 6)] + [(0, y) for y in range(0, h, 6)] + [(w - 1, y) for y in range(0, h, 6)]
    for x, y in seeds:
        if min(px[x, y]) > 225:
            ImageDraw.floodfill(im, (x, y), dark, thresh=thresh)
    return im

SCALE = {'sup-ribs.webp': 2}

jobs = [
    ('26.png', (478, 30, 1300, 552), 'sup-chest.webp'),       # chest panel macro (drops the caption text below)
    ('27.png', (172, 30, 596, 552), 'sup-forearm.webp'),      # elbow and forearm panel macro
    ('28.png', (0, 150, 433, 740), 'sup-hip-thigh.webp'),     # shorts: joined hip and thigh panels
    ('31.webp', (240, 458, 362, 566), 'sup-ribs.webp'),        # rib panel (small source, upscaled 2x)
    ('32.png', (132, 448, 232, 662), 'sup-knee.webp'),         # knee panel
    ('32.png', (0, 0, 861, 791), 'card-leggings.webp'),        # leggings side and back
    ('28.png', (0, 0, 433, 805), 'card-shorts.webp'),          # shorts side
    ('30.png', (20, 140, 270, 770), 'sup-upper-arm.webp'),    # upper-arm and elbow panels from behind
]
for name, box, dest in jobs:
    im = Image.open(f'{src}/{name}').convert('RGB').crop(box)
    im = trim_white(im)
    k = SCALE.get(dest, 1)
    if k > 1: im = im.resize((im.width * k, im.height * k), Image.LANCZOS)
    im.save(f'{out}/{dest}', 'WEBP', quality=92, method=6)
    print(dest, im.size)
