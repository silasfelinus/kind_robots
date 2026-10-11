// /utils/arcade/rescueRally/floorArt.ts
//
// Rescue Rally's arenas on screen (conductor kr-arcade t-035/t-036): each district's floor (painted
// once and cached), the rim's chase lights, the wall vents and their tell, the conveyor belts and
// the beacon pad.

import {
  INK,
  RAMPS,
  backdropRng,
  bandedGradient,
  bevel,
  cachedLayer,
  glow,
  mix,
  rgba,
} from '../snes'
import type { Ramp } from '../snes'
import { ARENA, ARENA_H, ARENA_W, CX, CY, H, VENTS, W } from './arena'
import type { District } from './districts'
import { conveyorStep } from './waves'
import type { Conveyor } from './waves'

const TILE = 24

export function renderFloor(
  g: CanvasRenderingContext2D,
  look: District['floor'],
  key: string,
  seed: number,
  tick: number,
) {
  // Plated walls, a raised bevelled rim and a tiled floor, painted once per district.
  cachedLayer(g, `rescue-rally-arena-${key}`, W, H, (k) => {
    bandedGradient(
      k,
      0,
      0,
      W,
      H,
      [RAMPS.night[0], RAMPS.night[1], RAMPS.night[0]],
      4,
    )
    // Wall plating seams and rivets in the margins around the arena.
    for (let y = 0; y < H; y += TILE) {
      k.fillStyle = INK
      k.fillRect(0, y, ARENA.left - 4, 1)
      k.fillRect(ARENA.right + 4, y, W - ARENA.right - 4, 1)
      k.fillStyle = RAMPS.night[3]
      k.fillRect(0, y + 1, ARENA.left - 4, 1)
      k.fillRect(ARENA.right + 4, y + 1, W - ARENA.right - 4, 1)
      k.fillStyle = RAMPS.steel[1]
      k.fillRect(3, y + 12, 2, 2)
      k.fillRect(W - 5, y + 12, 2, 2)
      k.fillStyle = RAMPS.steel[3]
      k.fillRect(3, y + 12, 1, 1)
      k.fillRect(W - 5, y + 12, 1, 1)
    }
    // The raised rim: lit on the top and left, shadowed bottom and right.
    bevel(
      k,
      ARENA.left - 4,
      ARENA.top - 4,
      ARENA_W + 8,
      ARENA_H + 8,
      look.rim,
      { depth: 2 },
    )
    k.fillStyle = INK
    k.fillRect(ARENA.left - 1, ARENA.top - 1, ARENA_W + 2, ARENA_H + 2)
    // The floor: HDMA bands, lighter under the overhead lamps in the middle.
    bandedGradient(k, ARENA.left, ARENA.top, ARENA_W, ARENA_H, [
      look.bands[0],
      look.bands[1],
      mix(look.bands[0], look.bands[1], 0.4),
      look.bands[0],
    ])
    for (let ty = 0, j = 0; ty < ARENA_H; ty += TILE, j++) {
      for (let tx = 0, i = 0; tx < ARENA_W; tx += TILE, i++) {
        const x = ARENA.left + tx
        const y = ARENA.top + ty
        const w = Math.min(TILE, ARENA_W - tx)
        const h = Math.min(TILE, ARENA_H - ty)
        if ((i + j) % 2) {
          k.fillStyle = rgba(INK, 0.16)
          k.fillRect(x, y, w, h)
        }
        k.fillStyle = rgba(look.seam, 0.2)
        k.fillRect(x, y, w, 1)
        k.fillRect(x, y, 1, h)
        k.fillStyle = rgba(INK, 0.45)
        k.fillRect(x, y + h - 1, w, 1)
        k.fillRect(x + w - 1, y, 1, h)
        k.fillStyle = rgba(look.seam, 0.45)
        k.fillRect(x + 1, y + 1, 1, 1)
      }
    }
    // Floor furniture: vent grilles and little lamp panels, laid out by a fixed seed.
    const rand = backdropRng(97 + seed)
    for (let n = 0; n < 16; n++) {
      const tx = ARENA.left + Math.floor(rand() * 19) * TILE
      const ty = ARENA.top + Math.floor(rand() * 13) * TILE
      if (n % 3 === 0) {
        // A recessed floor lamp, dim so it never reads as a pickup.
        const lamp: Ramp = [
          INK,
          look.accent[0],
          look.accent[1],
          look.accent[2],
          look.accent[3],
        ]
        bevel(k, tx + 8, ty + 8, 8, 8, RAMPS.steel, {
          depth: 1,
          outline: INK,
        })
        bevel(k, tx + 10, ty + 10, 4, 4, lamp, { depth: 1, outline: null })
        glow(k, tx + 12, ty + 12, 9, look.accent[2], 0.12)
      } else {
        for (let v = 0; v < 3; v++) {
          k.fillStyle = rgba(INK, 0.6)
          k.fillRect(tx + 5, ty + 7 + v * 4, 14, 2)
          k.fillStyle = rgba(look.seam, 0.25)
          k.fillRect(tx + 5, ty + 9 + v * 4, 14, 1)
        }
      }
    }
    // Hazard stripes in the four corners.
    for (const [cx, cy] of [
      [ARENA.left, ARENA.top],
      [ARENA.right - TILE, ARENA.top],
      [ARENA.left, ARENA.bottom - TILE],
      [ARENA.right - TILE, ARENA.bottom - TILE],
    ] as const) {
      k.save()
      k.beginPath()
      k.rect(cx + 3, cy + 3, TILE - 6, TILE - 6)
      k.clip()
      for (let s = -TILE; s < TILE; s += 6) {
        k.fillStyle = rgba(RAMPS.gold[2], 0.35)
        k.beginPath()
        k.moveTo(cx + s, cy + TILE)
        k.lineTo(cx + s + 3, cy + TILE)
        k.lineTo(cx + s + 3 + TILE, cy)
        k.lineTo(cx + s + TILE, cy)
        k.fill()
      }
      k.restore()
    }
    if (look.emblem === 'heart') heartEmblem(k, look.accent)
    else gearEmblem(k, look.accent)
    // Ambient occlusion where the floor meets the rim, light catching the far lip.
    k.fillStyle = rgba(INK, 0.5)
    k.fillRect(ARENA.left, ARENA.top, ARENA_W, 3)
    k.fillRect(ARENA.left, ARENA.top, 3, ARENA_H)
    k.fillStyle = rgba(INK, 0.25)
    k.fillRect(ARENA.left, ARENA.top + 3, ARENA_W, 3)
    k.fillRect(ARENA.left + 3, ARENA.top, 3, ARENA_H)
    k.fillStyle = rgba(look.seam, 0.3)
    k.fillRect(ARENA.left, ARENA.bottom - 1, ARENA_W, 1)
    k.fillRect(ARENA.right - 1, ARENA.top, 1, ARENA_H)
  })
  // The rim's inner edge breathes teal, and chase lights run around it.
  const pulse = 0.6 + 0.4 * Math.sin(tick / 20)
  g.fillStyle = rgba(RAMPS.teal[3], 0.55 * pulse)
  g.fillRect(ARENA.left - 1, ARENA.top - 1, ARENA_W + 2, 1)
  g.fillRect(ARENA.left - 1, ARENA.bottom, ARENA_W + 2, 1)
  g.fillRect(ARENA.left - 1, ARENA.top, 1, ARENA_H)
  g.fillRect(ARENA.right, ARENA.top, 1, ARENA_H)
  const chase = Math.floor(tick / 6)
  const light = (x: number, y: number, i: number) => {
    const lit = (i + chase) % 4 === 0
    g.fillStyle = INK
    g.fillRect(x - 1, y - 1, 3, 3)
    g.fillStyle = lit
      ? i % 2
        ? RAMPS.pink[4]
        : RAMPS.teal[4]
      : i % 2
        ? RAMPS.pink[1]
        : RAMPS.teal[1]
    g.fillRect(x, y, 1, 1)
    if (lit) glow(g, x, y, 6, i % 2 ? RAMPS.pink[3] : RAMPS.teal[3], 0.6)
  }
  let i = 0
  for (let x = ARENA.left + TILE / 2; x < ARENA.right; x += TILE, i++) {
    light(x, ARENA.top - 3, i)
    light(ARENA.right + ARENA.left - x, ARENA.bottom + 2, i)
  }
  for (let y = ARENA.top + TILE / 2; y < ARENA.bottom; y += TILE, i++) {
    light(ARENA.right + 2, y, i)
    light(ARENA.left - 3, ARENA.bottom + ARENA.top - y, i)
  }
}

/** The Kind Robots heart emblem painted on the middle of the floor. */
function heartEmblem(k: CanvasRenderingContext2D, accent: Ramp) {
  const cx = CX
  const cy = CY
  k.lineWidth = 3
  k.strokeStyle = rgba(accent[2], 0.2)
  k.beginPath()
  k.arc(cx, cy, 44, 0, Math.PI * 2)
  k.stroke()
  k.lineWidth = 1
  k.strokeStyle = rgba(accent[3], 0.2)
  k.beginPath()
  k.arc(cx, cy, 38, 0, Math.PI * 2)
  k.stroke()
  const heart = (size: number) => {
    k.beginPath()
    k.moveTo(cx, cy + size * 0.9)
    k.bezierCurveTo(
      cx - size * 1.4,
      cy - size * 0.1,
      cx - size * 0.7,
      cy - size * 1.1,
      cx,
      cy - size * 0.4,
    )
    k.bezierCurveTo(
      cx + size * 0.7,
      cy - size * 1.1,
      cx + size * 1.4,
      cy - size * 0.1,
      cx,
      cy + size * 0.9,
    )
    k.closePath()
  }
  heart(24)
  k.fillStyle = rgba(accent[1], 0.22)
  k.fill()
  k.lineWidth = 2
  k.strokeStyle = rgba(accent[3], 0.22)
  k.stroke()
}

/** The Toy Factory's emblem: a big gear with a heart for a hub. */
function gearEmblem(k: CanvasRenderingContext2D, accent: Ramp) {
  k.fillStyle = rgba(accent[1], 0.22)
  k.strokeStyle = rgba(accent[3], 0.22)
  k.lineWidth = 2
  k.beginPath()
  for (let t = 0; t < 12; t++) {
    const a0 = (t / 12) * Math.PI * 2
    const a1 = a0 + (Math.PI * 2) / 24
    const a2 = a0 + (Math.PI * 2) / 12
    k.lineTo(CX + Math.cos(a0) * 44, CY + Math.sin(a0) * 44)
    k.lineTo(CX + Math.cos(a0) * 52, CY + Math.sin(a0) * 52)
    k.lineTo(CX + Math.cos(a1) * 52, CY + Math.sin(a1) * 52)
    k.lineTo(CX + Math.cos(a1) * 44, CY + Math.sin(a1) * 44)
    k.lineTo(CX + Math.cos(a2) * 44, CY + Math.sin(a2) * 44)
  }
  k.closePath()
  k.fill()
  k.stroke()
  k.fillStyle = rgba(INK, 0.3)
  k.beginPath()
  k.arc(CX, CY, 20, 0, Math.PI * 2)
  k.fill()
  k.fillStyle = rgba(accent[3], 0.3)
  k.beginPath()
  k.moveTo(CX, CY + 9)
  k.bezierCurveTo(CX - 14, CY - 1, CX - 7, CY - 11, CX, CY - 4)
  k.bezierCurveTo(CX + 7, CY - 11, CX + 14, CY - 1, CX, CY + 9)
  k.fill()
}

/** The conveyor strips: dark belts with rollers at the ends and chevrons sliding the way they run. */
export function renderConveyors(
  g: CanvasRenderingContext2D,
  belts: readonly Conveyor[],
  tick: number,
) {
  for (const c of belts) {
    const step = conveyorStep(c)
    g.fillStyle = INK
    g.fillRect(c.x - 1, c.y - 1, c.w + 2, c.h + 2)
    bandedGradient(
      g,
      c.x,
      c.y,
      c.w,
      c.h,
      [RAMPS.steel[1], RAMPS.steel[0], RAMPS.steel[1]],
      2,
    )
    g.save()
    g.beginPath()
    g.rect(c.x, c.y, c.w, c.h)
    g.clip()
    const horizontal = step.x !== 0
    const shift = (tick * 0.7) % 12
    g.fillStyle = rgba(RAMPS.gold[3], 0.55)
    if (horizontal) {
      for (
        let x = c.x - 12 + (step.x > 0 ? shift : 12 - shift);
        x < c.x + c.w + 12;
        x += 12
      ) {
        const tip = step.x > 0 ? 4 : -4
        for (let k = 0; k < 4; k++) {
          const yy = c.y + c.h / 2 - 4 + k * 2
          const off = k < 2 ? k : 3 - k
          g.fillRect(Math.round(x + off * Math.sign(tip)), yy, 2, 2)
        }
      }
      g.fillStyle = RAMPS.steel[3]
      g.fillRect(c.x, c.y + 1, c.w, 1)
      g.fillRect(c.x, c.y + c.h - 2, c.w, 1)
    } else {
      for (
        let y = c.y - 12 + (step.y > 0 ? shift : 12 - shift);
        y < c.y + c.h + 12;
        y += 12
      ) {
        const tip = step.y > 0 ? 1 : -1
        for (let k = 0; k < 4; k++) {
          const xx = c.x + c.w / 2 - 4 + k * 2
          const off = k < 2 ? k : 3 - k
          g.fillRect(xx, Math.round(y + off * tip), 2, 2)
        }
      }
      g.fillStyle = RAMPS.steel[3]
      g.fillRect(c.x + 1, c.y, 1, c.h)
      g.fillRect(c.x + c.w - 2, c.y, 1, c.h)
    }
    g.restore()
  }
}

/** The four wall vents; one glows red before a late group comes through. */
export function renderVents(
  g: CanvasRenderingContext2D,
  due: boolean,
  tick: number,
) {
  const hot = due && Math.floor(tick / 6) % 2 === 0
  VENTS.forEach((v, i) => {
    const horizontal = i % 2 === 0
    const w = horizontal ? 28 : 8
    const h = horizontal ? 8 : 28
    const x = Math.round(v.x - w / 2 + (i === 1 ? 6 : i === 3 ? -6 : 0))
    const y = Math.round(v.y - h / 2 + (i === 0 ? -6 : i === 2 ? 6 : 0))
    bevel(g, x, y, w, h, RAMPS.steel, { depth: 1 })
    g.fillStyle = hot ? RAMPS.ember[2] : INK
    for (let s = 2; s < (horizontal ? w : h) - 2; s += 3) {
      if (horizontal) g.fillRect(x + s, y + 2, 1, h - 4)
      else g.fillRect(x + 2, y + s, w - 4, 1)
    }
    if (due) glow(g, v.x, v.y, 22, RAMPS.ember[3], hot ? 0.7 : 0.35)
  })
}
