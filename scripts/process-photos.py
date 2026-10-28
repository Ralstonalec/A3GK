#!/usr/bin/env python3
"""
Turn the supplied flat-lay photographs into site assets (cutouts + pad close-ups).

  python3 scripts/process-photos.py <dir containing top.jpg and leggings.jpg> [out_dir]

- Cuts each garment out of its background (dark, low-saturation pixels), keeps the garment's own
  detail untouched, fades edges where the frame crops the garment.
- Neutralises the warm room light using the white table as the reference.
- Writes RGBA cutouts and RGB macro crops of each padded panel. No pixels are painted or invented.
Needs only numpy + Pillow. Re-run with better photographs when they exist; keep the same file names.
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

src = Path(sys.argv[1])
out = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(__file__).resolve().parent.parent / 'public' / 'photos'
out.mkdir(parents=True, exist_ok=True)


def luma(a):
    return a @ np.array([0.299, 0.587, 0.114], dtype=np.float32)


def white_balance(img: Image.Image) -> Image.Image:
    a = np.asarray(img.convert('RGB')).astype(np.float32)
    L = luma(a)
    sat = (a.max(-1) - a.min(-1)) / (a.max(-1) + 1e-3)
    ref = (L > 170) & (sat < 0.3)
    if ref.sum() > 500:
        med = np.median(a[ref], axis=0)
        gains = med.mean() / med
        a = a * gains
    # gentle shadow lift so stitching and cell edges read; nothing else
    a = 255 * np.power(np.clip(a / 255, 0, 1), 0.9)
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def garment_mask(img, seed, limit=125, rows=None, cols=None, close=11, polys=()):
    a = np.asarray(img).astype(np.float32)
    L = luma(a)
    sat = (a.max(-1) - a.min(-1)) / (a.max(-1) + 1e-3)
    m = (L < limit) & (sat < 0.33)
    if rows: m[: rows[0], :] = False; m[rows[1]:, :] = False
    if cols: m[:, : cols[0]] = False; m[:, cols[1]:] = False
    for poly in polys:
        pm = Image.new('L', img.size, 0)
        ImageDraw.Draw(pm).polygon(poly, fill=255)
        m[np.asarray(pm) > 0] = False
    mi = Image.fromarray((m * 255).astype(np.uint8))
    mi = mi.filter(ImageFilter.MaxFilter(close)).filter(ImageFilter.MinFilter(close))
    mi = mi.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(5))
    ImageDraw.floodfill(mi, seed, 128, thresh=0)
    m2 = np.asarray(mi) == 128
    soft = Image.fromarray((m2 * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(1.6))
    return np.asarray(soft).astype(np.float32) / 255


def edge_fade(alpha, left=0, right=0, top=0, bottom=0):
    h, w = alpha.shape
    ramp = lambda n, size: np.clip(np.arange(n) / max(size, 1), 0, 1)
    if left: alpha *= ramp(w, left)[None, :]
    if right: alpha *= ramp(w, right)[::-1][None, :]
    if top: alpha *= ramp(h, top)[:, None]
    if bottom: alpha *= ramp(h, bottom)[::-1][:, None]
    return alpha


def save_cutout(img, alpha, name, max_w=1500):
    rgba = np.dstack([np.asarray(img), (alpha * 255).astype(np.uint8)])
    im = Image.fromarray(rgba, 'RGBA')
    bbox = im.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    im = im.crop(bbox)
    bw, bh = im.size
    if im.width > max_w: im = im.resize((max_w, int(im.height * max_w / im.width)), Image.LANCZOS)
    im.save(out / name, 'WEBP', quality=90, method=6)
    print(name, im.size)
    return {'w': im.width, 'h': im.height, 'bx': bbox[0], 'by': bbox[1], 'bw': bw, 'bh': bh}


def crop(img, box, name, max_w=1100):
    c = img.crop(box)
    if c.width > max_w: c = c.resize((max_w, int(c.height * max_w / c.width)), Image.LANCZOS)
    c.save(out / name, 'WEBP', quality=90, method=6)
    print(name, c.size)


# ---------- top (portrait photo, sleeves cropped by the frame) ----------
top = white_balance(Image.open(src / 'top.jpg'))
al = garment_mask(top, seed=(740, 800), rows=(330, 1555), polys=[[(0, 1500), (230, 1500), (230, 2000), (0, 2000)], [(1330, 1500), (1500, 1500), (1500, 2000), (1330, 2000)]])
al = edge_fade(al, left=140, right=140)
save_cutout(top, al, 'top-cutout.webp')
crop(top, (520, 600, 970, 960), 'pad-chest.webp')
crop(top, (240, 880, 740, 1190), 'pad-ribs.webp')
crop(top, (0, 780, 290, 1240), 'pad-forearm.webp', 700)
crop(top, (120, 440, 470, 780), 'pad-upper-arm.webp', 800)

# ---------- leggings (landscape photo, rotated so the waistband is at the top) ----------
leg = white_balance(Image.open(src / 'leggings.jpg'))
al = garment_mask(leg, seed=(714, 640), rows=(280, 985), cols=(180, 1745), close=21, polys=[[(1648, 886), (1800, 886), (1800, 1010), (1648, 1010)]])
rot = Image.fromarray((al * 255).astype(np.uint8))
leg_rot = leg.rotate(-90, expand=True)
al_rot = edge_fade(np.asarray(rot.rotate(-90, expand=True)).astype(np.float32) / 255, bottom=90)
save_cutout(leg_rot, al_rot, 'leggings-cutout.webp')
crop(leg, (350, 420, 960, 930), 'pad-hip-thigh.webp')
crop(leg, (1170, 520, 1760, 950), 'pad-knee.webp')
crop(leg, (240, 360, 390, 950), 'waistband.webp', 400)


# ---------- social preview: real photographs on the stage colour ----------
W, H = 1200, 630
bg = Image.new('RGB', (W, H))
px = bg.load()
for yy in range(H):
    for xx in range(W):
        d = (((xx - W * 0.5) / (W * 0.7)) ** 2 + ((yy - H * 0.46) / (H * 0.75)) ** 2) ** 0.5
        t = min(1, d)
        px[xx, yy] = (int(89 * (1 - t) + 7 * t), int(97 * (1 - t) + 8 * t), int(107 * (1 - t) + 10 * t))
t_im = Image.open(out / 'top-cutout.webp').convert('RGBA')
l_im = Image.open(out / 'leggings-cutout.webp').convert('RGBA')
t_im = t_im.resize((int(t_im.width * 470 / t_im.height), 470), Image.LANCZOS)
l_im = l_im.resize((int(l_im.width * 560 / l_im.height), 560), Image.LANCZOS)
bg = bg.convert('RGBA')
bg.alpha_composite(t_im, (70, 80))
bg.alpha_composite(l_im, (820, 35))
bg.convert('RGB').save(out.parent / 'og.jpg', quality=88)
print('og.jpg')
