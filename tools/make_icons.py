#!/usr/bin/env python3
"""Draw the app icons (the default character on the night sky) into the repo root."""
import pathlib
from PIL import Image, ImageDraw, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parent.parent


def icon(size, pad=0.0):
    s = size * 4
    img = Image.new('RGB', (s, s), '#080f27')
    d = ImageDraw.Draw(img)
    for y in range(s):  # sky gradient
        t = y / s
        d.line([(0, y), (s, y)], fill=(int(8 + 11 * t), int(15 + 19 * t), int(39 + 35 * t)))
    for x, y, r in [(0.18, 0.2, 0.012), (0.8, 0.14, 0.009), (0.86, 0.62, 0.01), (0.12, 0.7, 0.008), (0.62, 0.86, 0.008)]:
        d.ellipse([(x - r) * s, (y - r) * s, (x + r) * s, (y + r) * s], fill='#f4efe4')
    # meteor
    mx, my, mr = 0.78 * s, 0.3 * s, 0.07 * s
    tail = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    td = ImageDraw.Draw(tail)
    td.line([(mx, my), (mx + 0.16 * s, my - 0.2 * s)], fill=(255, 106, 85, 110), width=int(mr * 1.6))
    img.paste(tail.filter(ImageFilter.GaussianBlur(s * 0.01)), (0, 0), tail.filter(ImageFilter.GaussianBlur(s * 0.01)))
    d.ellipse([mx - mr, my - mr, mx + mr, my + mr], fill='#ff6a55')
    # character with glow
    cx, cy, r = 0.47 * s, 0.56 * s, (0.27 - pad * 0.27) * s
    glow = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse([cx - r * 1.25, cy - r * 1.25, cx + r * 1.25, cy + r * 1.25], fill=(255, 196, 92, 120))
    glow = glow.filter(ImageFilter.GaussianBlur(r * 0.35))
    img.paste(glow, (0, 0), glow)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill='#ffc45c')
    er = r * 0.13
    for ex in (-0.32, 0.32):
        d.ellipse([cx + ex * r - er, cy - 0.12 * r - er, cx + ex * r + er, cy - 0.12 * r + er], fill='#080f27')
    for bx in (-0.55, 0.55):
        d.ellipse([cx + bx * r - r * 0.17, cy + 0.2 * r - r * 0.1, cx + bx * r + r * 0.17, cy + 0.2 * r + r * 0.1], fill='#ff9db0')
    return img.resize((size, size), Image.LANCZOS)


icon(192).save(ROOT / 'icon-192.png')
icon(512).save(ROOT / 'icon-512.png')
icon(512, pad=0.2).save(ROOT / 'icon-maskable-512.png')
icon(180).save(ROOT / 'icon-180.png')
print('icons written')
