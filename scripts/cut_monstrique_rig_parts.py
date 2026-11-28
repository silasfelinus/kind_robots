#!/usr/bin/env python3
"""Cut a MONSTRIQUE lead's painted A-pose into cut-out rig parts.

Conductor monstress-convention/t-018. The leads' rig (utils/monstrique/rig.ts,
utils/monstrique/leadRigs.ts) draws each part from its own transparent webp.
This script makes those webps from the delivered rig source art of round
monstrique-leads-rig-1 (conductor art/CH1-LEADS-RIG-R1.yaml):

  iris  A-pose ArtImage 280967, head sheet ArtImage 280968
  norb  A-pose ArtImage 280969, head sheet ArtImage 280970

How a part is cut:
  * The background is a flat grey, so it is flood-filled from the corners and
    the figure's edge is feathered from its colour distance to that grey (with
    the grey un-mixed from the edge pixels, so no halo).
  * Each part claims the figure's pixels inside its polygon (source pixels),
    highest priority first, optionally only pixels of a colour key (Norb's
    yellow gloves). Leftovers go to the nearest claimed part.
  * Every part overlaps its neighbours by a few pixels and a child bleeds
    further into its parent, so no seam opens at a joint. A part covered by
    another (the coat under the camera, the jacket under a glove, the shoulder
    under a sleeve) is inpainted there, and thighs that start under a coat or
    a trouser seat are extended up to the hip so a swinging leg never shows
    its cut edge.
  * Mouth shapes come from the A-pose's own mouth (rest) and from the head
    sheet (open, oh), colour-matched to the A-pose skin. Eyes take the A-pose
    eyes (open) and a blink painted from the A-pose's own lid and liner colours,
    because neither delivered head sheet has a closed-eye cell.

Output: one <part>.webp per part (and <part>-<state>.webp for mouth and eye
states) in --out, half the source resolution, plus the leadRigs.ts data block
(rig-space boxes, pivots and sheet sizes) on stdout with --emit-ts.

  python3 scripts/cut_monstrique_rig_parts.py iris --apose iris-apose.webp \
    --heads iris-heads.webp --out public/monstress-convention/rig/iris --emit-ts
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT_SCALE = 0.7
OVERLAP = 3
WEBP_QUALITY = 80


def poly(*points):
    return [tuple(p) for p in points]


# Rig space: `scale` rig units per source pixel, source `anchor` lands on rig
# `rig_anchor` (feet on the ground line, hips centred in the frame).
CHARACTERS = {
    'iris': {
        'frame': {'w': 100, 'h': 220, 'ground': 214},
        'scale': 0.172,
        'anchor': (425, 1208),
        'rig_anchor': (50, 214),
        'parts': [
            {'id': 'handBack', 'priority': 90, 'pivot': (222, 588),
             'poly': poly((130, 568), (250, 586), (246, 700), (120, 710)),
             'bleed': 10},
            {'id': 'handFront', 'priority': 90, 'pivot': (624, 562),
             'poly': poly((596, 562), (668, 548), (730, 630), (712, 690),
                          (620, 690), (600, 610)),
             'bleed': 10},
            {'id': 'camera', 'priority': 85, 'pivot': (384, 502),
             'poly': poly((262, 468), (348, 468), (412, 515), (412, 612),
                          (384, 634), (262, 610), (256, 560))},
            {'id': 'head', 'priority': 80, 'pivot': (440, 284),
             'poly': poly((240, 0), (620, 0), (620, 235), (562, 250),
                          (524, 260), (500, 278), (470, 294), (430, 294),
                          (396, 278), (372, 262), (340, 254), (300, 260),
                          (240, 255))},
            {'id': 'armBackLower', 'priority': 70, 'pivot': (276, 432),
             'poly': poly((205, 392), (348, 446), (345, 470), (302, 474),
                          (276, 556), (266, 600), (186, 588), (160, 560),
                          (176, 480)),
             'bleed': 8},
            {'id': 'armBackUpper', 'priority': 65, 'pivot': (326, 300),
             'poly': poly((262, 256), (372, 254), (354, 330), (346, 410),
                          (344, 452), (215, 400), (238, 300))},
            {'id': 'armFrontLower', 'priority': 70, 'pivot': (584, 436),
             'poly': poly((528, 440), (642, 408), (664, 468), (662, 556),
                          (652, 584), (602, 578), (588, 526), (574, 508),
                          (562, 458)),
             'bleed': 8},
            {'id': 'armFrontUpper', 'priority': 65, 'pivot': (536, 296),
             'poly': poly((500, 254), (602, 256), (642, 408), (566, 432),
                          (542, 440), (532, 400), (528, 300))},
            {'id': 'torso', 'priority': 50, 'pivot': (450, 494),
             'poly': poly((300, 262), (372, 254), (400, 266), (470, 278),
                          (520, 256), (528, 300), (532, 400), (548, 455),
                          (572, 506), (330, 506), (344, 455), (352, 330)),
             'bleed': 0, 'under': ['camera', 'head'], 'under_pad': 6,
             'under_clip': poly((292, 240), (600, 240), (600, 520),
                                (292, 520)),
             'fill': [poly((300, 262), (372, 256), (356, 320), (330, 330),
                           (312, 300)),
                      poly((518, 256), (550, 262), (558, 310), (540, 330),
                           (530, 300))]},
            {'id': 'hips', 'priority': 40, 'pivot': (450, 690),
             'poly': poly((334, 462), (566, 462), (576, 510), (590, 572),
                          (606, 600), (616, 845), (566, 862), (538, 812),
                          (530, 795), (410, 795), (402, 812), (386, 862),
                          (218, 862), (222, 790), (238, 720), (252, 640),
                          (268, 580), (300, 506)),
             'under': ['camera'], 'under_pad': 6,
             'fill': [poly((334, 462), (566, 462), (574, 516), (330, 516))]},
            {'id': 'thighBack', 'priority': 30, 'pivot': (352, 690),
             'poly': poly((278, 790), (412, 790), (398, 976), (280, 976)),
             'extend_up': 690, 'bleed': 0},
            {'id': 'shinBack', 'priority': 25, 'pivot': (328, 966),
             'poly': poly((270, 956), (404, 956), (372, 1010), (368, 1142),
                          (248, 1142), (254, 1010)),
             'bleed': 10},
            {'id': 'footBack', 'priority': 20, 'pivot': (302, 1136),
             'poly': poly((236, 1126), (372, 1126), (352, 1216), (236, 1216)),
             'bleed': 10},
            {'id': 'thighFront', 'priority': 30, 'pivot': (466, 690),
             'poly': poly((410, 790), (542, 790), (532, 962), (424, 976),
                          (414, 900)),
             'extend_up': 690, 'bleed': 0},
            {'id': 'shinFront', 'priority': 25, 'pivot': (468, 964),
             'poly': poly((418, 952), (528, 952), (512, 1010), (516, 1112),
                          (424, 1112), (420, 1010)),
             'bleed': 10},
            {'id': 'footFront', 'priority': 20, 'pivot': (470, 1110),
             'poly': poly((412, 1098), (534, 1098), (596, 1138), (596, 1206),
                          (412, 1206)),
             'bleed': 10},
        ],
        'merged': ['hairBack'],
        'parents': {
            'head': 'torso', 'torso': 'hips', 'camera': 'torso',
            'armBackUpper': 'torso', 'armBackLower': 'armBackUpper',
            'handBack': 'armBackLower', 'armFrontUpper': 'torso',
            'armFrontLower': 'armFrontUpper', 'handFront': 'armFrontLower',
            'thighBack': 'hips', 'shinBack': 'thighBack',
            'footBack': 'shinBack', 'thighFront': 'hips',
            'shinFront': 'thighFront', 'footFront': 'shinFront',
        },
        'face': {
            'eyes': {'box': (404, 118, 116, 52), 'pivot': (456, 144),
                     'eyes': [
                         {'c': (432, 143), 'r': (17, 14)},
                         {'c': (481, 144), 'r': (13, 13)},
                     ]},
            'mouth': {'box': (426, 181, 60, 30), 'pivot': (456, 196),
                      'sheet': {
                          'open': {'c': (550, 338), 'r': (32, 26)},
                          'oh': {'c': (1204, 340), 'r': (30, 25)},
                      },
                      'sheet_scale': 0.8,
                      'skin_probe': [(470, 215), (420, 180), (490, 178)],
                      'sheet_skin_probe': [(510, 300), (525, 372), (590, 300)]},
        },
    },
    'norb': {
        'frame': {'w': 124, 'h': 220, 'ground': 214},
        'scale': 0.174,
        'anchor': (420, 1185),
        'rig_anchor': (62, 214),
        'parts': [
            {'id': 'handBack', 'priority': 90, 'pivot': (176, 600),
             'poly': poly((56, 572), (296, 572), (296, 872), (56, 872)),
             'key': 'glove', 'bleed': 0},
            {'id': 'handFront', 'priority': 90, 'pivot': (662, 592),
             'poly': poly((598, 556), (792, 556), (792, 834), (598, 834)),
             'key': 'glove', 'bleed': 0},
            {'id': 'head', 'priority': 80, 'pivot': (466, 370),
             'poly': poly((230, 0), (640, 0), (640, 320), (592, 330),
                          (548, 345), (512, 362), (470, 372), (420, 368),
                          (370, 350), (330, 330), (290, 314), (230, 314))},
            {'id': 'armBackLower', 'priority': 70, 'pivot': (184, 490),
             'poly': poly((70, 492), (250, 492), (244, 612), (70, 612)),
             'bleed': 8},
            {'id': 'armBackUpper', 'priority': 65, 'pivot': (222, 410),
             'poly': poly((150, 340), (300, 314), (262, 392), (250, 450),
                          (246, 500), (80, 500), (104, 420))},
            {'id': 'armFrontLower', 'priority': 70, 'pivot': (624, 489),
             'poly': poly((598, 492), (720, 492), (716, 614), (612, 614),
                          (606, 540)),
             'bleed': 8},
            {'id': 'armFrontUpper', 'priority': 65, 'pivot': (596, 400),
             'poly': poly((560, 325), (640, 350), (692, 430), (712, 498),
                          (606, 504), (602, 430), (594, 340))},
            {'id': 'torso', 'priority': 50, 'pivot': (452, 748),
             'poly': poly((262, 300), (360, 300), (420, 350), (520, 350),
                          (580, 320), (600, 330), (604, 430), (612, 560),
                          (626, 700), (648, 840), (574, 840), (568, 752),
                          (336, 752), (332, 846), (196, 846), (204, 760),
                          (232, 660), (240, 560), (250, 450), (262, 390)),
             'under': ['handBack', 'handFront', 'head'], 'under_pad': 4,
             'fill': [poly((214, 350), (300, 314), (270, 380), (240, 400),
                           (220, 380)),
                      poly((586, 328), (616, 340), (626, 380), (606, 400),
                           (600, 340))]},
            {'id': 'hips', 'priority': 40, 'pivot': (420, 850),
             'poly': poly((190, 730), (650, 730), (612, 880), (500, 872),
                          (440, 902), (380, 884), (190, 884)),
             'fill': [poly((200, 738), (640, 738), (636, 850), (204, 850))]},
            {'id': 'thighBack', 'priority': 30, 'pivot': (300, 850),
             'poly': poly((180, 866), (410, 866), (402, 978), (184, 978)),
             'extend_up': 776, 'bleed': 0},
            {'id': 'shinBack', 'priority': 25, 'pivot': (296, 972),
             'poly': poly((176, 958), (404, 958), (402, 1068), (176, 1074)),
             'bleed': 10},
            {'id': 'footBack', 'priority': 20, 'pivot': (286, 1076),
             'poly': poly((160, 1064), (396, 1064), (396, 1200), (160, 1200)),
             'bleed': 10},
            {'id': 'thighFront', 'priority': 30, 'pivot': (500, 850),
             'poly': poly((404, 866), (616, 866), (604, 978), (404, 978)),
             'extend_up': 776, 'bleed': 0},
            {'id': 'shinFront', 'priority': 25, 'pivot': (496, 972),
             'poly': poly((400, 958), (604, 958), (600, 1040), (400, 1062)),
             'bleed': 10},
            {'id': 'footFront', 'priority': 20, 'pivot': (476, 1052),
             'poly': poly((392, 1030), (676, 1030), (676, 1156), (392, 1156)),
             'bleed': 10},
        ],
        'merged': ['glasses'],
        'parents': {
            'head': 'torso', 'torso': 'hips',
            'armBackUpper': 'torso', 'armBackLower': 'armBackUpper',
            'handBack': 'armBackLower', 'armFrontUpper': 'torso',
            'armFrontLower': 'armFrontUpper', 'handFront': 'armFrontLower',
            'thighBack': 'hips', 'shinBack': 'thighBack',
            'footBack': 'shinBack', 'thighFront': 'hips',
            'shinFront': 'thighFront', 'footFront': 'shinFront',
        },
        'face': {
            'eyes': {'box': (372, 172, 186, 96), 'pivot': (466, 222),
                     'eyes': [
                         {'c': (430, 224), 'r': (27, 30), 'lens': True},
                         {'c': (499, 217), 'r': (11, 15)},
                     ]},
            'mouth': {'box': (412, 284, 112, 44), 'pivot': (468, 302),
                      'sheet': {
                          'open': {'c': (563, 370), 'r': (50, 30)},
                      },
                      'oh_from': 'open',
                      'sheet_scale': 1.1,
                      'skin_probe': [(455, 335), (400, 290), (520, 330)],
                      'sheet_skin_probe': [(500, 320), (560, 420), (620, 380)]},
        },
    },
}


def load(path: str) -> np.ndarray:
    return np.asarray(Image.open(path).convert('RGB')).astype(np.float32)


def background(rgb: np.ndarray) -> np.ndarray:
    edge = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    return np.median(edge, axis=0)


def figure_alpha(rgb: np.ndarray, bg: np.ndarray):
    """Flood the grey background from the corners; feather the figure's edge."""
    dist = np.abs(rgb - bg).sum(axis=2)
    seed = Image.fromarray(np.where(dist > 30, 255, 0).astype(np.uint8)).copy()
    h, w = dist.shape
    for corner in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        if seed.getpixel(corner) == 0:
            ImageDraw.floodfill(seed, corner, 128)
    outside = np.asarray(seed) == 128
    inside = ~outside
    near_edge = np.asarray(
        Image.fromarray((outside * 255).astype(np.uint8)).filter(
            ImageFilter.MaxFilter(5))) > 0
    alpha = np.where(inside, 1.0, 0.0)
    soft = np.clip((dist - 10) / 50, 0, 1)
    alpha = np.where(near_edge & inside, np.maximum(soft, 0.35), alpha)
    alpha = np.asarray(
        Image.fromarray((alpha * 255).astype(np.uint8)).filter(
            ImageFilter.GaussianBlur(0.6))).astype(np.float32) / 255
    alpha = np.where(inside, alpha, 0)
    a = np.maximum(alpha, 1e-3)[..., None]
    unmixed = np.clip((rgb - (1 - a) * bg) / a, 0, 255)
    rgb = np.where((alpha < 0.98)[..., None] & inside[..., None], unmixed, rgb)
    return rgb, alpha, inside


def polygon_mask(shape, points) -> np.ndarray:
    img = Image.new('L', (shape[1], shape[0]), 0)
    ImageDraw.Draw(img).polygon(points, fill=255)
    return np.asarray(img) > 0


def dilate(mask: np.ndarray, px: int) -> np.ndarray:
    if px <= 0:
        return mask
    img = Image.fromarray((mask * 255).astype(np.uint8))
    size = 2 * px + 1
    return np.asarray(img.filter(ImageFilter.MaxFilter(size))) > 0


def glove_key(rgb: np.ndarray) -> np.ndarray:
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    yellow = (r > 150) & (g > 110) & (b < 110) & (r - b > 90)
    core = dilate(yellow, 2)
    return dilate(core, 9)


def inpaint(rgb: np.ndarray, known: np.ndarray, hole: np.ndarray) -> np.ndarray:
    """Fill `hole` by repeatedly averaging the known neighbours."""
    out = rgb.copy()
    todo_all = hole & ~known
    if not todo_all.any():
        return out
    ys, xs = np.where(todo_all)
    pad = 40
    y0, y1 = max(0, ys.min() - pad), min(hole.shape[0], ys.max() + pad + 1)
    x0, x1 = max(0, xs.min() - pad), min(hole.shape[1], xs.max() + pad + 1)
    sub = out[y0:y1, x0:x1].copy()
    have = known[y0:y1, x0:x1].copy()
    todo = todo_all[y0:y1, x0:x1].copy()
    for _ in range(400):
        if not todo.any():
            break
        acc = np.zeros_like(sub)
        cnt = np.zeros(have.shape, np.float32)
        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1),
                       (-1, -1), (1, 1), (-1, 1), (1, -1)]:
            k = np.roll(np.roll(have, dy, 0), dx, 1)
            v = np.roll(np.roll(sub, dy, 0), dx, 1)
            acc += v * k[..., None]
            cnt += k
        grow = todo & (cnt > 0)
        sub[grow] = acc[grow] / cnt[grow][..., None]
        have |= grow
        todo &= ~grow
    out[y0:y1, x0:x1] = sub
    return out


def claim(rgb, inside, spec):
    parts = sorted(spec['parts'], key=lambda p: -p['priority'])
    owner = np.full(inside.shape, -1, np.int32)
    gloves = glove_key(rgb) if any(p.get('key') for p in parts) else None
    for index, part in enumerate(parts):
        region = polygon_mask(inside.shape, part['poly']) & inside
        if part.get('key') == 'glove':
            region &= gloves
        owner[region & (owner < 0)] = index
    loose = inside & (owner < 0)
    for _ in range(200):
        if not loose.any():
            break
        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            moved = np.roll(np.roll(owner, dy, 0), dx, 1)
            take = loose & (moved >= 0)
            owner[take] = moved[take]
            loose = inside & (owner < 0)
    return parts, owner


def extend_up(rgb, alpha, mask, top_y):
    """Grow a thigh up to the hip by repeating its top band of rows."""
    rows = np.where(mask.any(axis=1))[0]
    if len(rows) == 0:
        return rgb, alpha, mask
    first = rows[0]
    band = 24
    rgb, alpha, mask = rgb.copy(), alpha.copy(), mask.copy()
    src_rows = range(first + 6, first + 6 + band)
    for y in range(first + 5, top_y - 1, -1):
        sy = src_rows[(first + 5 - y) % band]
        cols = mask[sy]
        rgb[y, cols] = rgb[sy, cols]
        alpha[y, cols] = np.maximum(alpha[y, cols], alpha[sy, cols])
        mask[y] |= cols
    return rgb, alpha, mask


def save_part(rgb, alpha, mask, out: Path, name: str):
    ys, xs = np.where(mask & (alpha > 0.01))
    x0, y0 = max(0, xs.min() - 2), max(0, ys.min() - 2)
    x1, y1 = min(mask.shape[1], xs.max() + 3), min(mask.shape[0], ys.max() + 3)
    a = np.where(mask, alpha, 0)[y0:y1, x0:x1]
    c = rgb[y0:y1, x0:x1]
    rgba = np.dstack([c, a * 255]).clip(0, 255).astype(np.uint8)
    img = Image.fromarray(rgba, 'RGBA')
    w = max(1, round(img.width * OUT_SCALE))
    h = max(1, round(img.height * OUT_SCALE))
    img = img.resize((w, h), Image.LANCZOS)
    img.save(out / (name + '.webp'), 'WEBP', quality=WEBP_QUALITY,
             alpha_quality=90, method=6)
    return {'file': name + '.webp', 'sheet': [w, h],
            'src_box': [int(x0), int(y0), int(x1 - x0), int(y1 - y0)]}


def ellipse_mask(shape, c, r, feather=3.0):
    yy, xx = np.mgrid[0:shape[0], 0:shape[1]]
    d = np.sqrt(((xx - c[0]) / r[0]) ** 2 + ((yy - c[1]) / r[1]) ** 2)
    edge = feather / max(r)
    return np.clip((1 - d) / edge, 0, 1)


def mean_at(rgb, points, radius=4):
    vals = [rgb[y - radius:y + radius, x - radius:x + radius].reshape(-1, 3)
            for x, y in points]
    return np.median(np.concatenate(vals), axis=0)


def face_parts(rgb, alpha, spec, heads_path, out):
    face = spec['face']
    made = {}
    shape = alpha.shape

    m = face['mouth']
    bx, by, bw, bh = m['box']
    cx, cy = bx + bw / 2, by + bh / 2
    rest_alpha = ellipse_mask(shape, (cx, cy), (bw / 2, bh / 2), 6)
    made['mouth-rest'] = save_part(
        rgb, rest_alpha * alpha, rest_alpha > 0, out, 'mouth-rest')
    if heads_path:
        sheet = load(heads_path)
        skin = mean_at(rgb, m['skin_probe'])
        sheet_skin = mean_at(sheet, m['sheet_skin_probe'])
        shift = skin - sheet_skin
        states = dict(m['sheet'])
        for state, cell in states.items():
            sx, sy = cell['c']
            rx, ry = cell['r']
            crop = sheet[sy - ry:sy + ry, sx - rx:sx + rx]
            lum = crop.mean(axis=2, keepdims=True)
            skinlike = np.clip((lum - 90) / 60, 0, 1)
            crop = np.clip(crop + shift * skinlike, 0, 255)
            img = Image.fromarray(crop.astype(np.uint8))
            k = m['sheet_scale']
            img = img.resize((max(1, round(img.width * k)),
                              max(1, round(img.height * k))), Image.LANCZOS)
            patch = np.asarray(img).astype(np.float32)
            canvas = rgb.copy()
            ph, pw = patch.shape[:2]
            ox, oy = int(round(cx - pw / 2)), int(round(cy - ph / 2))
            canvas[oy:oy + ph, ox:ox + pw] = patch
            a = ellipse_mask(shape, (cx, cy), (pw / 2 - 1, ph / 2 - 1), 7)
            made['mouth-' + state] = save_part(
                canvas, a * alpha, a > 0, out, 'mouth-' + state)
        if m.get('oh_from'):
            src = made['mouth-' + m['oh_from']]
            img = Image.open(out / src['file'])
            w, h = img.size
            narrow = img.resize((max(1, round(w * 0.62)), h), Image.LANCZOS)
            narrow.save(out / 'mouth-oh.webp', 'WEBP', quality=WEBP_QUALITY,
                        alpha_quality=90, method=6)
            sb = src['src_box']
            nw = sb[2] * 0.62
            made['mouth-oh'] = {
                'file': 'mouth-oh.webp', 'sheet': list(narrow.size),
                'src_box': [sb[0] + (sb[2] - nw) / 2, sb[1], nw, sb[3]]}

    e = face['eyes']
    ex, ey, ew, eh = e['box']
    box_mask = np.zeros(shape, bool)
    box_mask[ey:ey + eh, ex:ex + ew] = True
    open_alpha = np.zeros(shape, np.float32)
    for eye in e['eyes']:
        r = (eye['r'][0] + 4, eye['r'][1] + 4)
        open_alpha = np.maximum(open_alpha, ellipse_mask(shape, eye['c'], r, 4))
    made['eyes-open'] = save_part(
        rgb, open_alpha * alpha, open_alpha > 0, out, 'eyes-open')

    blink = rgb.copy()
    lid = mean_at(rgb, [(eye['c'][0], eye['c'][1] - eye['r'][1] - 6)
                        for eye in e['eyes']], 3)
    ink = np.array([24, 16, 22], np.float32)
    canvas = Image.fromarray(blink.astype(np.uint8))
    draw = ImageDraw.Draw(canvas)
    for eye in e['eyes']:
        (x, y), (rx, ry) = eye['c'], eye['r']
        region = ellipse_mask(shape, (x, y), (rx, ry), 1.5)
        b = np.asarray(canvas).astype(np.float32)
        b = b * (1 - region[..., None]) + lid * region[..., None]
        canvas = Image.fromarray(b.clip(0, 255).astype(np.uint8))
        draw = ImageDraw.Draw(canvas)
        width = max(3, round(ry / 4))
        draw.arc([x - rx, y - ry * 0.9, x + rx, y + ry * 0.55], 15, 165,
                 fill=tuple(int(v) for v in ink), width=width)
        if not eye.get('lens'):
            draw.line([(x + rx * 0.85, y + ry * 0.05),
                       (x + rx * 1.25, y - ry * 0.35)],
                      fill=tuple(int(v) for v in ink), width=width)
    blink = np.asarray(canvas).astype(np.float32)
    made['eyes-blink'] = save_part(
        blink, open_alpha * alpha, open_alpha > 0, out, 'eyes-blink')
    return made


def cut(character: str, apose: str, heads: str | None, out: Path):
    spec = CHARACTERS[character]
    rgb = load(apose)
    bg = background(rgb)
    rgb, alpha, inside = figure_alpha(rgb, bg)
    parts, owner = claim(rgb, inside, spec)
    index = {p['id']: i for i, p in enumerate(parts)}
    out.mkdir(parents=True, exist_ok=True)
    made = {}
    for i, part in enumerate(parts):
        own = owner == i
        mask = own | (dilate(own, OVERLAP) & inside)
        prgb, palpha = rgb, alpha
        parent = spec['parents'].get(part['id'])
        if part.get('bleed') and parent in index:
            grow = dilate(own, part['bleed']) & (owner == index[parent])
            mask = mask | grow
        hole = np.zeros_like(mask)
        if part.get('under'):
            region = polygon_mask(inside.shape, part['poly']) & inside
            if part.get('under_clip'):
                region &= polygon_mask(inside.shape, part['under_clip'])
            covered = np.zeros_like(mask)
            for other in part['under']:
                covered |= owner == index[other]
            hole |= dilate(covered, part.get('under_pad', 0)) & region
        for shape in part.get('fill', []):
            hole |= polygon_mask(inside.shape, shape) & inside & ~own
        if hole.any():
            keep = own & ~hole
            prgb = inpaint(rgb, keep, hole)
            mask = mask | hole
            palpha = np.where(hole, np.maximum(alpha, 1.0 * inside), alpha)
        if part.get('extend_up'):
            prgb, palpha, mask = extend_up(prgb, palpha, mask,
                                           part['extend_up'])
        made[part['id']] = save_part(prgb, palpha, mask, out, part['id'])
        made[part['id']]['pivot_px'] = part['pivot']
    made.update(face_parts(rgb, alpha, spec, heads, out))
    made['eyes-open']['pivot_px'] = spec['face']['eyes']['pivot']
    made['mouth-rest']['pivot_px'] = spec['face']['mouth']['pivot']
    return spec, made


def to_rig(spec, x, y):
    s = spec['scale']
    ax, ay = spec['anchor']
    rx, ry = spec['rig_anchor']
    return (rx + (x - ax) * s, ry + (y - ay) * s)


def r2(v: float) -> float:
    return round(v * 100) / 100


def emit_ts(character: str, spec, made) -> str:
    def box(entry):
        x, y, w, h = entry['src_box']
        x0, y0 = to_rig(spec, x, y)
        return [r2(x0), r2(y0), r2(w * spec['scale']), r2(h * spec['scale'])]

    lines = []
    for part in spec['parts']:
        entry = made[part['id']]
        px, py = to_rig(spec, *part['pivot'])
        lines.append(
            f"  {part['id']}: cut({json.dumps(entry['sheet'])}, "
            f"{json.dumps(box(entry))}, [{r2(px)}, {r2(py)}]),")
    for channel, states, pivot in [
            ('eyes', ['open', 'blink'], spec['face']['eyes']['pivot']),
            ('mouth', ['rest', 'open', 'oh'], spec['face']['mouth']['pivot'])]:
        px, py = to_rig(spec, *pivot)
        inner = ', '.join(
            f"{s}: state({json.dumps(made[channel + '-' + s]['sheet'])}, "
            f"{json.dumps(box(made[channel + '-' + s]))})"
            for s in states if channel + '-' + s in made)
        lines.append(f"  {channel}: swap([{r2(px)}, {r2(py)}], {{ {inner} }}),")
    for merged in spec['merged']:
        lines.append(f'  {merged}: MERGED,')
    return '\n'.join(lines)


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split('\n\n')[0])
    parser.add_argument('character', choices=sorted(CHARACTERS))
    parser.add_argument('--apose', required=True, help='A-pose source image')
    parser.add_argument('--heads', help='talk/blink head sheet image')
    parser.add_argument('--out', required=True, help='output directory')
    parser.add_argument('--emit-ts', action='store_true',
                        help='print the leadRigs.ts painted-part block')
    args = parser.parse_args(argv)
    out = Path(args.out)
    spec, made = cut(args.character, args.apose, args.heads, out)
    total = sum((out / m['file']).stat().st_size for m in made.values())
    print(f'{args.character}: {len(made)} files, {total / 1024:.0f} KB',
          file=sys.stderr)
    if args.emit_ts:
        print(emit_ts(args.character, spec, made))
    return 0


if __name__ == '__main__':
    sys.exit(main())
