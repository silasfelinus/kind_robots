#!/usr/bin/env python3
"""Cut MONSTRIQUE's stateful stage objects out of the painted room backdrops.

Conductor monstress-convention/t-019. The rooms are single paintings with every
prop baked in (round monstrique-ch1-cast-motel-1). utils/monstrique/
stageObjects.ts draws each stateful prop as its own layer over the painting,
from the files this script writes to public/monstress-convention/objects/:

  balcony-door.webp           Room 205's door slab, swung open on its hinge
  balcony-door-interior.webp  Room 205 itself (cut from the odette-room
                              painting), seen through the open doorway
  ice-machine.webp            the ice machine, shuddered on the double clank
  vending-machine.webp        the vending machine, thumped when it dispenses
  vending-pack.webp           one painted pack from its shelves, dropped
  odette-purse.webp           Odette's purse, lifted into an evidence bag
  odette-purse-gone.webp      the chair and wall behind the purse once taken

Every layer is cut at the painting's own resolution and keeps its source box,
so a layer at rest is pixel-identical to the painting under it: no seam shows
until the object moves. Masks are polygons in painting pixels, feathered by a
pixel. The purse patch rebuilds the wall, the dresser's side and the chair
seat from the painting around it (tiled grain, wall shading continued from
above, the seat's front edge carried across), so nothing new is invented.

  python3 scripts/cut_monstrique_object_layers.py \
    --rooms public/monstress-convention/rooms \
    --out public/monstress-convention/objects
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

WEBP_QUALITY = 92
STAGE = (1344, 768)


def load(path: Path) -> np.ndarray:
    img = Image.open(path).convert('RGB')
    if img.size != STAGE:
        raise SystemExit(f'{path} is {img.size}, expected {STAGE}')
    return np.asarray(img).astype(np.float32)


def polygon_alpha(points, feather=1.0) -> np.ndarray:
    img = Image.new('L', STAGE, 0)
    ImageDraw.Draw(img).polygon([tuple(p) for p in points], fill=255)
    if feather:
        img = img.filter(ImageFilter.GaussianBlur(feather))
    return np.asarray(img).astype(np.float32) / 255


def save(rgb: np.ndarray, alpha: np.ndarray, box, out: Path, name: str):
    x, y, w, h = box
    c = rgb[y:y + h, x:x + w]
    a = alpha[y:y + h, x:x + w]
    rgba = np.dstack([c, a * 255]).clip(0, 255).round().astype(np.uint8)
    Image.fromarray(rgba, 'RGBA').save(
        out / (name + '.webp'), 'WEBP', quality=WEBP_QUALITY,
        alpha_quality=95, method=6)
    return {'file': name + '.webp', 'box': list(box)}


def bbox(points, pad=2):
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    x0 = max(0, min(xs) - pad)
    y0 = max(0, min(ys) - pad)
    x1 = min(STAGE[0], max(xs) + pad)
    y1 = min(STAGE[1], max(ys) + pad)
    return (int(x0), int(y0), int(x1 - x0), int(y1 - y0))


# Painting pixels (1344x768) for each object.
DOOR = [(722, 117), (812, 66), (813, 653), (721, 604)]
KNOB = (727, 381, 14, 14)
KNOB_JAMB = (711, 366, 723, 398)
ICE_MACHINE = [(505, 202), (700, 202), (736, 226), (738, 612), (690, 623),
               (468, 623), (462, 412), (451, 392), (455, 377), (496, 352),
               (496, 222)]
VENDING = [(1121, 3), (1344, 0), (1344, 768), (1088, 768), (1091, 700),
           (1110, 28)]
PACK = [(1175, 414), (1215, 409), (1221, 434), (1208, 463), (1180, 466),
        (1169, 440)]
PURSE = [(0, 365), (23, 367), (35, 381), (41, 399), (59, 404), (69, 419),
         (81, 464), (86, 492), (73, 504), (0, 507)]
# Room 205's far wall, lamp, nightstand and bed (above the knife), seen
# through the open door.
INTERIOR_SOURCE = (636, 30, 124, 520)


def ellipse_alpha(cx, cy, rx, ry, feather=0.8) -> np.ndarray:
    img = Image.new('L', STAGE, 0)
    ImageDraw.Draw(img).ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=255)
    img = img.filter(ImageFilter.GaussianBlur(feather))
    return np.asarray(img).astype(np.float32) / 255


def door_layers(balcony: np.ndarray, room205: np.ndarray, out: Path):
    made = {}
    alpha = polygon_alpha(DOOR, feather=0.8)
    # The knob stands proud of the slab's edge, over the jamb.
    slab = np.maximum(alpha, ellipse_alpha(*KNOB))
    box = bbox(DOOR + [(KNOB[0] - KNOB[2], KNOB[1])])
    made['door'] = save(balcony, slab, box, out, 'balcony-door')

    sx, sy, sw, sh = INTERIOR_SOURCE
    src = Image.fromarray(room205.astype(np.uint8)).crop(
        (sx, sy, sx + sw, sy + sh))
    bx, by, bw, bh = box
    # Map the source rectangle onto the doorway quad in perspective.
    quad_out = [(p[0] - bx, p[1] - by) for p in DOOR]
    warped = warp_to_quad(src, quad_out, (bw, bh))
    rgb = np.zeros((STAGE[1], STAGE[0], 3), np.float32)
    rgb[by:by + bh, bx:bx + bw] = np.asarray(warped).astype(np.float32)
    # Dim the room and pull it toward the balcony's night palette; deepen the
    # jambs so the opening reads as depth, not a picture in a frame.
    yy, xx = np.mgrid[0:STAGE[1], 0:STAGE[0]].astype(np.float32)
    u = np.clip((xx - 721) / 91, 0, 1)
    edge = np.minimum(u, 1 - u)
    shade = 0.42 + 0.3 * np.clip(edge * 4, 0, 1)
    tint = np.array([1.0, 0.82, 0.92], np.float32)
    rgb = rgb * shade[..., None] * tint
    # Where the knob stood, the jamb continues: blend each column from the
    # jamb just above the knob to just below it.
    jx0, jy0, jx1, jy1 = KNOB_JAMB
    top = balcony[jy0 - 4:jy0].mean(axis=0)[jx0:jx1]
    bottom = balcony[jy1:jy1 + 4].mean(axis=0)[jx0:jx1]
    t = np.linspace(0, 1, jy1 - jy0, dtype=np.float32)[:, None, None]
    rgb[jy0:jy1, jx0:jx1] = top[None] * (1 - t) + bottom[None] * t
    jamb = np.zeros_like(alpha)
    jamb[jy0:jy1, jx0:jx1] = 1
    jamb = np.asarray(Image.fromarray((jamb * 255).astype(np.uint8)).filter(
        ImageFilter.GaussianBlur(0.8))).astype(np.float32) / 255
    made['interior'] = save(rgb, np.maximum(alpha, jamb), box, out,
                            'balcony-door-interior')
    return made


def warp_to_quad(src: Image.Image, quad, size) -> Image.Image:
    """Perspective-map the whole of `src` onto `quad` (TL, TR, BR, BL)."""
    w, h = src.size
    dst = np.array(quad, np.float64)
    srcpts = np.array([(0, 0), (w, 0), (w, h), (0, h)], np.float64)
    # Solve the homography from output pixels back to source pixels.
    rows = []
    rhs = []
    for (x, y), (u, v) in zip(dst, srcpts):
        rows.append([x, y, 1, 0, 0, 0, -u * x, -u * y])
        rows.append([0, 0, 0, x, y, 1, -v * x, -v * y])
        rhs += [u, v]
    coeffs = np.linalg.solve(np.array(rows), np.array(rhs))
    return src.transform(size, Image.PERSPECTIVE, tuple(coeffs),
                         Image.BICUBIC)


def seat_line(x):
    """The chair seat's back edge under the purse, sloping down to the right."""
    return 497.0 + 8.0 * x / 107.0


def harmonic_fill(img: np.ndarray, known: np.ndarray, todo: np.ndarray,
                  iterations=3000) -> np.ndarray:
    """Solve Laplace's equation over `todo` with `known` pixels fixed."""
    out = img.copy()
    ys, xs = np.where(todo)
    y0, y1 = ys.min() - 2, ys.max() + 3
    x0, x1 = max(0, xs.min() - 2), xs.max() + 3
    sub = out[y0:y1, x0:x1]
    k = known[y0:y1, x0:x1]
    t = todo[y0:y1, x0:x1]
    have = k | t
    # Start from the mean of the known border for faster convergence.
    sub[t] = sub[k].mean(axis=0)
    for _ in range(iterations):
        acc = np.zeros_like(sub)
        cnt = np.zeros(t.shape, np.float32)
        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            m = np.roll(np.roll(have, dy, 0), dx, 1)
            v = np.roll(np.roll(sub, dy, 0), dx, 1)
            acc += v * m[..., None]
            cnt += m
        upd = acc / np.maximum(cnt, 1)[..., None]
        sub[t] = upd[t]
    out[y0:y1, x0:x1] = sub
    return out


def purse_layers(room205: np.ndarray, out: Path):
    made = {}
    alpha = polygon_alpha(PURSE, feather=0.8)
    box = bbox(PURSE)
    made['purse'] = save(room205, alpha, box, out, 'odette-purse')

    hole_img = Image.new('L', STAGE, 0)
    ImageDraw.Draw(hole_img).polygon(PURSE, fill=255)
    hole = np.asarray(hole_img.filter(ImageFilter.MaxFilter(7))) > 0
    patch = room205.copy()
    h, w = hole.shape
    yy, xx = np.mgrid[0:h, 0:w]
    seat = yy >= seat_line(xx) - 2
    # The dresser's left ink edge leans right as it drops (x 70 at y 372).
    centre = 70.0 + (yy - 372) * 0.12
    offset = xx - centre

    # The side panel right of the edge: vertical grain, lit the same down its
    # height, so shift the visible panel 24px left, row by row.
    panel = hole & ~seat & (offset >= 2)
    patch[panel] = room205[yy[panel], xx[panel] + 24]

    # The edge and the shadowed wall just left of it, as a profile across the
    # edge measured where it shows above the purse (y 372-396).
    span = np.arange(-6, 2)
    profile = np.zeros((span.size, 3), np.float32)
    for i, d in enumerate(span):
        profile[i] = np.mean([room205[y, int(round(70 + (y - 372) * 0.12 + d))]
                              for y in range(372, 397)], axis=0)
    ink = hole & ~seat & (offset >= -6) & (offset < 2)
    idx = np.clip(np.round(offset[ink]).astype(int) - span[0], 0, span.size - 1)
    patch[ink] = profile[idx]

    # The wall left of the dresser: a smooth fill from the painting around it
    # (the cast shadow continues down), closed at the bottom by the darker
    # wall just above the seat, with a fine paint grain.
    wall = hole & ~seat & (offset < -6)
    floor_row = (yy == np.floor(seat_line(xx)).astype(int) - 2) & (
        offset < -6)
    shade = room205[360:364, 0:60].mean(axis=(0, 1)) * 0.55
    patch[floor_row] = shade
    known = ~wall & ~(hole & seat)
    known |= floor_row
    patch = harmonic_fill(patch, known, wall)
    # The seat: its back edge (ink line, then the cushion's sheen) as a
    # profile measured along the slope where it shows (x 88-104), laid across
    # the hole with each column's own colour from the cushion below the purse.
    cushion = hole & seat
    rows = np.arange(-3, 14)
    profile = np.zeros((rows.size, 3), np.float32)
    for i, r in enumerate(rows):
        samples = [room205[int(round(seat_line(x) + r)), x]
                   for x in range(88, 105)]
        profile[i] = np.mean(samples, axis=0)
    below = room205[512:516].mean(axis=0)
    below_ref = room205[512:516, 88:105].mean(axis=(0, 1))
    for y, x in zip(*np.where(cushion)):
        r = int(round(y - seat_line(x)))
        r = min(max(r, rows[0]), rows[-1])
        patch[y, x] = profile[r - rows[0]] + (below[x] - below_ref) * 0.6

    rng = np.random.default_rng(205)
    noise = rng.normal(0, 4.0, patch.shape[:2]).astype(np.float32)
    noise = np.asarray(Image.fromarray(np.clip(noise * 8 + 128, 0, 255).astype(
        np.uint8)).filter(ImageFilter.GaussianBlur(0.7))).astype(
            np.float32) / 8 - 16
    patch += noise[..., None] * hole[..., None]
    patch = np.clip(patch, 0, 255)

    patch_alpha = np.asarray(
        Image.fromarray((hole * 255).astype(np.uint8)).filter(
            ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1.6))
    ).astype(np.float32) / 255
    gone_box = bbox(PURSE, pad=6)
    made['gone'] = save(patch, patch_alpha, gone_box, out, 'odette-purse-gone')
    return made


def alcove_layers(alcove: np.ndarray, out: Path):
    made = {}
    made['ice'] = save(alcove, polygon_alpha(ICE_MACHINE, 1.0),
                       bbox(ICE_MACHINE), out, 'ice-machine')
    made['vending'] = save(alcove, polygon_alpha(VENDING, 1.0),
                           bbox(VENDING, pad=0), out, 'vending-machine')
    made['pack'] = save(alcove, polygon_alpha(PACK, 0.8), bbox(PACK), out,
                        'vending-pack')
    return made


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split('\n\n')[0])
    parser.add_argument('--rooms', required=True,
                        help='directory of the painted room webps')
    parser.add_argument('--out', required=True, help='output directory')
    args = parser.parse_args(argv)
    rooms = Path(args.rooms)
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    balcony = load(rooms / 'balcony.webp')
    room205 = load(rooms / 'odette-room.webp')
    alcove = load(rooms / 'ice-alcove.webp')
    made = {}
    made.update(door_layers(balcony, room205, out))
    made.update(purse_layers(room205, out))
    made.update(alcove_layers(alcove, out))
    total = sum((out / m['file']).stat().st_size for m in made.values())
    print(json.dumps(made, indent=2))
    print(f'{len(made)} files, {total / 1024:.0f} KB', file=sys.stderr)
    return 0


if __name__ == '__main__':
    sys.exit(main())
