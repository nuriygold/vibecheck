#!/usr/bin/env python3
"""
AirKeys Logo — Aerial Cipher movement — REFINED PASS
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math, os

FONT_DIR = '/sessions/brave-beautiful-keller/mnt/.claude/skills/canvas-design/canvas-fonts/'
OUT      = '/sessions/brave-beautiful-keller/mnt/claude/outputs/airkeys-logo.png'

# ── Palette ───────────────────────────────────────────────────────────────────
BG        = (5,   5,  10)
WHITE     = (244, 244, 250)
ACCENT    = (108, 112, 255)
ACCENT_MID= (140, 145, 255)
DIM       = (88,  90, 112)
RULE      = (28,  29,  48)
CORNER    = (32,  34,  54)

# ── Canvas ────────────────────────────────────────────────────────────────────
S = 2
CW, CH = 2400, 960
W,  H  = CW * S, CH * S

img  = Image.new('RGB', (W, H), BG)
draw = ImageDraw.Draw(img)

# ── Fonts ─────────────────────────────────────────────────────────────────────
def font(name, size):
    return ImageFont.truetype(os.path.join(FONT_DIR, name), size * S)

f_word   = font('BigShoulders-Bold.ttf',    190)
f_tag    = font('GeistMono-Regular.ttf',     28)
f_label  = font('GeistMono-Regular.ttf',     19)
f_tiny   = font('GeistMono-Regular.ttf',     16)

# ── Helpers ───────────────────────────────────────────────────────────────────
def px(x): return int(x * S)

def blend(c1, c2, t):
    return tuple(max(0, min(255, int(a + (b-a)*t))) for a, b in zip(c1, c2))

def tc(draw, x, y, txt, fnt, fill, anchor='mm'):
    draw.text((px(x), px(y)), txt, font=fnt, fill=fill, anchor=anchor)

def rounded_rect(draw, x0, y0, x1, y1, r, outline, width):
    w = max(1, int(width * S))
    r = int(r * S)
    x0, y0, x1, y1 = px(x0), px(y0), px(x1), px(y1)
    draw.line([(x0+r, y0), (x1-r, y0)], fill=outline, width=w)
    draw.line([(x0+r, y1), (x1-r, y1)], fill=outline, width=w)
    draw.line([(x0, y0+r), (x0, y1-r)], fill=outline, width=w)
    draw.line([(x1, y0+r), (x1, y1-r)], fill=outline, width=w)
    draw.arc([x0, y0, x0+2*r, y0+2*r], 180, 270, fill=outline, width=w)
    draw.arc([x1-2*r, y0, x1, y0+2*r], 270, 360, fill=outline, width=w)
    draw.arc([x0, y1-2*r, x0+2*r, y1], 90, 180, fill=outline, width=w)
    draw.arc([x1-2*r, y1-2*r, x1, y1], 0, 90, fill=outline, width=w)

def arc(draw, cx, cy, r, a0, a1, col, w):
    bx0, by0 = px(cx-r), px(cy-r)
    bx1, by1 = px(cx+r), px(cy+r)
    draw.arc([bx0, by0, bx1, by1], a0, a1, fill=col, width=max(1, w*S))

# ── Subtle dot grid ───────────────────────────────────────────────────────────
DOT_STEP = 52
DOT_R    = 1 * S
DOT_COL  = (14, 14, 24)
for gy in range(DOT_STEP * S // 2, H, DOT_STEP * S):
    for gx in range(DOT_STEP * S // 2, W, DOT_STEP * S):
        draw.ellipse([gx-DOT_R, gy-DOT_R, gx+DOT_R, gy+DOT_R], fill=DOT_COL)

# ── Layout ────────────────────────────────────────────────────────────────────
ICON_CX  = 390
ICON_CY  = 475
KEY_W    = 220
KEY_H    = 220
KEY_R    = 30
DIV_X    = 660
DIV_Y0   = 110
DIV_Y1   = 850
TXT_X    = 740
TXT_CX   = (TXT_X + CW - 70) / 2

# ── Vertical divider ──────────────────────────────────────────────────────────
draw.line([px(DIV_X), px(DIV_Y0), px(DIV_X), px(DIV_Y1)],
          fill=RULE, width=S)

# ── Left edge bar ─────────────────────────────────────────────────────────────
draw.line([px(38), px(DIV_Y0+60), px(38), px(DIV_Y1-60)],
          fill=RULE, width=S)

# ── Key icon on rotated layer ─────────────────────────────────────────────────
key_layer = Image.new('RGBA', (W, H), (0,0,0,0))
kd = ImageDraw.Draw(key_layer)

kx0 = ICON_CX - KEY_W/2
kx1 = ICON_CX + KEY_W/2
ky0 = ICON_CY - KEY_H/2
ky1 = ICON_CY + KEY_H/2

# main key outline — crisp white
rounded_rect(kd, kx0, ky0, kx1, ky1, KEY_R, WHITE, 2.8)

# inner bevel (depth — very subtle)
INSET = 16
rounded_rect(kd, kx0+INSET, ky0+INSET, kx1-INSET, ky1-INSET,
             KEY_R - 10, (38, 40, 65), 1.0)

# diamond pip
PIP = 11
pc = (px(ICON_CX), px(ICON_CY))
kd.polygon([
    (pc[0],         pc[1] - PIP*S),
    (pc[0] + PIP*S, pc[1]),
    (pc[0],         pc[1] + PIP*S),
    (pc[0] - PIP*S, pc[1]),
], fill=ACCENT)

# rotate -9 degrees
key_layer = key_layer.rotate(-9, expand=False, resample=Image.BICUBIC,
                              center=(px(ICON_CX), px(ICON_CY)))
img.paste(key_layer, mask=key_layer.split()[3])
draw = ImageDraw.Draw(img)

# ── Signal arcs ───────────────────────────────────────────────────────────────
ARC_CX = ICON_CX + KEY_W/2 - 14
ARC_CY = ICON_CY - KEY_H/2 + 14

arc_specs = [
    (50,  ACCENT,      3),
    (88,  ACCENT_MID,  2),
    (128, (80,84,190), 2),
    (170, (50,52,140), 1),
    (214, (30,32,100), 1),
]
for (r, col, lw) in arc_specs:
    arc(draw, ARC_CX, ARC_CY, r, 0, 90, col, lw)

# origin dot
DR = 4
draw.ellipse([px(ARC_CX-DR), px(ARC_CY-DR), px(ARC_CX+DR), px(ARC_CY+DR)],
             fill=ACCENT)

# ── Wordmark ──────────────────────────────────────────────────────────────────
WORD_Y = 420
tc(draw, TXT_CX, WORD_Y, 'AIRKEYS', f_word, WHITE)

# ── Thin rule ─────────────────────────────────────────────────────────────────
RULE2_Y  = 530
RULE2_X0 = TXT_X + 4
RULE2_X1 = CW - 72
draw.line([px(RULE2_X0), px(RULE2_Y), px(RULE2_X1), px(RULE2_Y)],
          fill=RULE, width=S)

# accent dot on rule
DOT_POS = TXT_X + 4
draw.ellipse([px(DOT_POS - 3), px(RULE2_Y - 3),
              px(DOT_POS + 3), px(RULE2_Y + 3)], fill=ACCENT)

# ── Tagline ───────────────────────────────────────────────────────────────────
TAG_Y = 572
tc(draw, TXT_CX, TAG_Y, 'wireless.  keystroke.  anywhere.', f_tag, DIM)

# ── Right-side annotation pair (below rule, right-aligned) ───────────────────
tc(draw, CW - 75, 628, 'iPad PWA', f_tiny, CORNER, anchor='rm')
tc(draw, CW - 75, 648, 'WebSocket  /  pyautogui', f_tiny, CORNER, anchor='rm')

# ── Left column annotations (safely to the LEFT of key) ──────────────────────
# Positioned far left, no overlap with icon
ANNO_X = 65
ann_items = [
    (185,  '01'),
    (470,  '02'),
    (755,  '03'),
]
for (y, num) in ann_items:
    draw.text((px(ANNO_X), px(y - 8)), num, font=f_label,
              fill=(32, 34, 52), anchor='lm')
    draw.line([px(ANNO_X + 28), px(y), px(ANNO_X + 42), px(y)],
              fill=(28, 30, 48), width=S)

# ── Corner registration marks ─────────────────────────────────────────────────
for cx, cy in [(52, 48), (CW-52, 48), (52, CH-48), (CW-52, CH-48)]:
    arm = 9
    draw.line([px(cx-arm), px(cy), px(cx+arm), px(cy)], fill=CORNER, width=S)
    draw.line([px(cx), px(cy-arm), px(cx), px(cy+arm)], fill=CORNER, width=S)
    draw.ellipse([px(cx-2), px(cy-2), px(cx+2), px(cy+2)],
                 outline=CORNER, width=S)

# ── Build stamp (bottom right) ────────────────────────────────────────────────
tc(draw, CW-72, CH-52, 'AK — v1.0', f_tiny, (26, 28, 46), anchor='rm')
tc(draw, CW-72, CH-30, '2026', f_tiny, (26, 28, 46), anchor='rm')

# ── Bottom accent bar (accent indigo hairline) ────────────────────────────────
draw.rectangle([0, H - 3*S, W, H], fill=ACCENT)

# ── Subtle top border ─────────────────────────────────────────────────────────
draw.rectangle([0, 0, W, S], fill=RULE)

# ── Downsample (LANCZOS for sharpness) ───────────────────────────────────────
out = img.resize((CW, CH), Image.LANCZOS)
out.save(OUT, dpi=(300, 300))
print(f'Saved {OUT}  ({CW}×{CH})')
