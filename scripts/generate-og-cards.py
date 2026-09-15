#!/usr/bin/env python3
"""Render a 1200x630 social share card for every experience and tour.

Social platforms crop shared images to roughly 1.91:1, so the catalog photos
(many of them portrait) cannot be used directly as og:image. This bakes each
one into a correctly-proportioned card with the title and brand mark.

Run after changing a catalog title, price or photo:  python3 scripts/generate-og-cards.py
Output lands in public/og/ and is committed, so the Node-only CI build does
not need a Python toolchain.
"""
import math
import re
import pathlib
from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "og"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1200, 630
INK, KAME, WHITE, MUTED = (23, 26, 33), (238, 124, 24), (255, 255, 255), (226, 228, 233)
JP = "/usr/share/fonts/truetype/fonts-japanese-gothic.ttf"
LATIN = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

f = lambda px: ImageFont.truetype(LATIN, px)
fj = lambda px: ImageFont.truetype(JP, px)


def wrap(draw, text, font, max_w):
    words, lines, cur = text.split(), [], ""
    for w in words:
        trial = f"{cur} {w}".strip()
        if draw.textlength(trial, font=font) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines[:3]


def card(photo, title, meta, out):
    src = Image.open(ROOT / "public" / photo.lstrip("/")).convert("RGB")
    sw, sh = src.size
    s = max(W / sw, H / sh)
    img = src.resize((int(sw * s), int(sh * s)), Image.LANCZOS)
    # Bias the crop upward: subjects sit high in portrait photos.
    img = img.crop((
        (img.width - W) // 2, int((img.height - H) * 0.28),
        (img.width - W) // 2 + W, int((img.height - H) * 0.28) + H,
    ))

    # Gradient scrim so the type reads over any photo.
    scrim = Image.new("L", (1, H))
    for y in range(H):
        t = y / H
        scrim.putpixel((0, y), int(255 * min(0.92, 0.12 + t * t * 1.35)))
    img = Image.composite(Image.new("RGB", (W, H), INK), img, scrim.resize((W, H)))

    d = ImageDraw.Draw(img)

    cx, cy, r = 74, 74, 26
    d.polygon([(cx + r * math.cos(math.radians(60 * i - 90)),
                cy + r * math.sin(math.radians(60 * i - 90))) for i in range(6)], fill=KAME)
    d.text((cx, cy + 1), "亀", font=fj(24), fill=INK, anchor="mm")
    d.text((114, 58), "KAMEHAME", font=f(26), fill=WHITE)
    d.text((115, 88), "JAPAN", font=f(13), fill=KAME)

    lines = wrap(d, title, f(56), W - 192)
    y = H - 158 - (len(lines) - 1) * 66
    for line in lines:
        d.text((96, y), line, font=f(56), fill=WHITE)
        y += 66

    d.rectangle([96, H - 74, 96 + 62, H - 68], fill=KAME)
    d.text((96, H - 52), meta, font=f(21), fill=MUTED)

    img.save(OUT / out, "JPEG", quality=85, optimize=True)
    return out


catalog = (ROOT / "lib" / "catalog.ts").read_text()

experiences = re.findall(
    r'slug:\s*"([a-z-]+)",\s*city:\s*"(tokyo|kyoto)",\s*category:.*?\n\s*title:\s*"([^"]+)",'
    r'.*?duration:\s*"([^"]+)",\s*price:\s*"([^"]+)".*?img:\s*"([^"]+)"',
    catalog, re.S)

tours = re.findall(
    r'slug:\s*"([a-z-]+-private-day-tour)",\s*city:\s*"(tokyo|kyoto)".*?title:\s*"([^"]+)",'
    r'.*?duration:\s*"([^"]+)",\s*price:\s*"([^"]+)".*?img:\s*"([^"]+)"',
    catalog, re.S)

made = 0
for slug, city, title, duration, price, photo in experiences + tours:
    card(photo, title, f"{city.title()}  ·  {duration}  ·  from {price}", f"{slug}.jpg")
    made += 1

print(f"wrote {made} share cards to public/og/")
