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
import {
  gateState,
  LIGHTNING_TELL,
  LIGHTNING_RADIUS,
  PAD_RADIUS,
} from './floors'
import type { LaserGate, PadPair, Rect, Sprinkler } from './floors'
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
    else if (look.emblem === 'gear') gearEmblem(k, look.accent)
    else lateEmblem(k, look.emblem, look.accent)
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

// --- districts 3-5 ---------------------------------------------------------------------------------

/** The dome's flower, the docks' chip and the rooftops' lightning bolt, painted on the floor. */
function lateEmblem(
  k: CanvasRenderingContext2D,
  emblem: 'flower' | 'chip' | 'bolt',
  accent: Ramp,
) {
  k.fillStyle = rgba(accent[1], 0.22)
  k.strokeStyle = rgba(accent[3], 0.24)
  k.lineWidth = 2
  if (emblem === 'flower') {
    for (let p = 0; p < 6; p++) {
      const a = (p / 6) * Math.PI * 2
      k.beginPath()
      k.ellipse(
        CX + Math.cos(a) * 26,
        CY + Math.sin(a) * 26,
        18,
        10,
        a,
        0,
        Math.PI * 2,
      )
      k.fill()
      k.stroke()
    }
    k.fillStyle = rgba(RAMPS.gold[3], 0.25)
    k.beginPath()
    k.arc(CX, CY, 12, 0, Math.PI * 2)
    k.fill()
  } else if (emblem === 'chip') {
    k.fillRect(CX - 32, CY - 32, 64, 64)
    k.strokeRect(CX - 32, CY - 32, 64, 64)
    for (let i = -24; i <= 24; i += 12) {
      k.fillRect(CX + i - 2, CY - 44, 4, 12)
      k.fillRect(CX + i - 2, CY + 32, 4, 12)
      k.fillRect(CX - 44, CY + i - 2, 12, 4)
      k.fillRect(CX + 32, CY + i - 2, 12, 4)
    }
    k.strokeRect(CX - 16, CY - 16, 32, 32)
  } else {
    k.beginPath()
    k.moveTo(CX + 8, CY - 44)
    k.lineTo(CX - 20, CY + 4)
    k.lineTo(CX - 2, CY + 4)
    k.lineTo(CX - 10, CY + 44)
    k.lineTo(CX + 22, CY - 8)
    k.lineTo(CX + 4, CY - 8)
    k.closePath()
    k.fill()
    k.stroke()
  }
}

/** The dome's vine walls: dark stems, leaves, a few flowers. */
export function renderVines(
  g: CanvasRenderingContext2D,
  vines: readonly Rect[],
  tick: number,
) {
  for (const v of vines) {
    g.fillStyle = INK
    g.fillRect(v.x - 1, v.y - 1, v.w + 2, v.h + 2)
    bandedGradient(
      g,
      v.x,
      v.y,
      v.w,
      v.h,
      [RAMPS.leaf[1], RAMPS.leaf[0], RAMPS.leaf[1]],
      2,
    )
    const long = Math.max(v.w, v.h)
    for (let s = 3; s < long - 2; s += 6) {
      const x = v.w > v.h ? v.x + s : v.x + v.w / 2
      const y = v.w > v.h ? v.y + v.h / 2 : v.y + s
      const sway = Math.sin(tick / 30 + s) > 0 ? 1 : -1
      g.fillStyle = RAMPS.leaf[3]
      g.fillRect(Math.round(x + sway * 3) - 1, Math.round(y) - 1, 3, 2)
      g.fillStyle = RAMPS.leaf[2]
      g.fillRect(Math.round(x - sway * 3) - 1, Math.round(y) + 1, 3, 2)
      if (s % 18 === 3) {
        g.fillStyle = RAMPS.pink[3]
        g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2)
        g.fillStyle = RAMPS.gold[4]
        g.fillRect(Math.round(x), Math.round(y), 1, 1)
      }
    }
  }
}

/** Sprinkler sprays: a misty ring of droplets over a wet patch. */
export function renderSprinklers(
  g: CanvasRenderingContext2D,
  list: readonly Sprinkler[],
  tick: number,
) {
  for (const s of list) {
    g.fillStyle = rgba(RAMPS.water[2], 0.16)
    g.beginPath()
    g.ellipse(s.x, s.y, s.r, s.r * 0.8, 0, 0, Math.PI * 2)
    g.fill()
    g.strokeStyle = rgba(RAMPS.water[3], 0.35)
    g.lineWidth = 1
    g.stroke()
    bevel(g, s.x - 3, s.y - 3, 6, 6, RAMPS.steel, { depth: 1 })
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2 + tick / 20
      const r = ((tick * 0.8 + k * 9) % s.r) | 0
      g.fillStyle = rgba(RAMPS.water[4], 0.8 - r / s.r / 1.5)
      g.fillRect(
        Math.round(s.x + Math.cos(a) * r),
        Math.round(s.y + Math.sin(a) * r * 0.8),
        1,
        2,
      )
    }
  }
}

/** Flowerbeds: soil and blooms (the family hides in them). */
export function renderBeds(g: CanvasRenderingContext2D, beds: readonly Rect[]) {
  for (const b of beds) {
    g.fillStyle = INK
    g.fillRect(b.x - 1, b.y - 1, b.w + 2, b.h + 2)
    bandedGradient(g, b.x, b.y, b.w, b.h, [RAMPS.earth[2], RAMPS.earth[1]], 3)
  }
}

/** The blooms on top of a bed, drawn over anyone hiding in it. */
export function renderBedTops(
  g: CanvasRenderingContext2D,
  beds: readonly Rect[],
  tick: number,
) {
  for (const b of beds) {
    for (let y = b.y + 4; y < b.y + b.h; y += 7) {
      for (let x = b.x + 3 + ((y / 7) % 2) * 3; x < b.x + b.w - 2; x += 7) {
        const nod = Math.sin(tick / 25 + x + y) > 0 ? 1 : 0
        g.fillStyle = RAMPS.leaf[2]
        g.fillRect(x, y + 1, 3, 3)
        const c =
          (x + y) % 3 === 0
            ? RAMPS.pink[3]
            : (x + y) % 3 === 1
              ? RAMPS.gold[3]
              : RAMPS.purple[3]
        g.fillStyle = c
        g.fillRect(x + nod, y - 1, 2, 2)
      }
    }
  }
}

/** Teleport pads: rings that hum, linked pairs sharing a colour. */
export function renderPads(
  g: CanvasRenderingContext2D,
  pads: readonly PadPair[],
  tick: number,
) {
  const ramps = [RAMPS.pink, RAMPS.teal, RAMPS.gold]
  pads.forEach((pair, i) => {
    const ramp = ramps[i % ramps.length]!
    for (const p of pair) {
      g.fillStyle = INK
      g.beginPath()
      g.ellipse(
        p.x,
        p.y,
        PAD_RADIUS + 2,
        PAD_RADIUS * 0.6 + 2,
        0,
        0,
        Math.PI * 2,
      )
      g.fill()
      g.fillStyle = ramp[1]
      g.beginPath()
      g.ellipse(p.x, p.y, PAD_RADIUS, PAD_RADIUS * 0.6, 0, 0, Math.PI * 2)
      g.fill()
      const t = (tick / 30) % 1
      g.strokeStyle = rgba(ramp[3], 1 - t)
      g.lineWidth = 1
      g.beginPath()
      g.ellipse(
        p.x,
        p.y - t * 10,
        PAD_RADIUS * (1 - t * 0.4),
        PAD_RADIUS * 0.6 * (1 - t * 0.4),
        0,
        0,
        Math.PI * 2,
      )
      g.stroke()
      glow(g, p.x, p.y, 16, ramp[3], 0.3)
    }
  })
}

/** Laser gates: two emitter posts and the beam between, flickering before it goes hot. */
export function renderGates(
  g: CanvasRenderingContext2D,
  gates: readonly LaserGate[],
  tick: number,
) {
  for (const gt of gates) {
    const state = gateState(gt, tick)
    const flicker = state === 'tell' && Math.floor(tick / 3) % 2 === 0
    if (state === 'on' || flicker) {
      g.save()
      g.globalCompositeOperation = 'lighter'
      g.strokeStyle =
        state === 'on' ? rgba(RAMPS.ember[3], 0.9) : rgba(RAMPS.ember[2], 0.4)
      g.lineWidth = state === 'on' ? 4 : 1
      g.beginPath()
      g.moveTo(gt.x0, gt.y0)
      g.lineTo(gt.x1, gt.y1)
      g.stroke()
      if (state === 'on') {
        g.strokeStyle = '#ffffff'
        g.lineWidth = 1
        g.stroke()
      }
      g.restore()
    } else if (state === 'off') {
      g.strokeStyle = rgba(RAMPS.ember[1], 0.35)
      g.setLineDash([2, 4])
      g.lineWidth = 1
      g.beginPath()
      g.moveTo(gt.x0, gt.y0)
      g.lineTo(gt.x1, gt.y1)
      g.stroke()
      g.setLineDash([])
    }
    for (const [x, y] of [
      [gt.x0, gt.y0],
      [gt.x1, gt.y1],
    ] as const) {
      bevel(g, x - 3, y - 3, 6, 6, RAMPS.steel, { depth: 1 })
      g.fillStyle = state === 'off' ? RAMPS.ember[1] : RAMPS.ember[3]
      g.fillRect(x - 1, y - 1, 2, 2)
    }
  }
}

/** Magnet floors: striped plates with arrows drawing in to their middle. */
export function renderMagnetFloors(
  g: CanvasRenderingContext2D,
  list: readonly Rect[],
  tick: number,
) {
  for (const m of list) {
    g.fillStyle = INK
    g.fillRect(m.x - 1, m.y - 1, m.w + 2, m.h + 2)
    bandedGradient(
      g,
      m.x,
      m.y,
      m.w,
      m.h,
      [RAMPS.ember[1], RAMPS.steel[1], RAMPS.ember[1]],
      3,
    )
    const cy = m.y + m.h / 2
    const pull = (tick / 3) % 8
    g.fillStyle = rgba(RAMPS.steel[4], 0.5)
    for (let x = m.x + 6; x < m.x + m.w - 4; x += 12) {
      g.fillRect(x, m.y + 2 + pull, 2, 2)
      g.fillRect(x, m.y + m.h - 4 - pull, 2, 2)
    }
    g.fillStyle = rgba(RAMPS.ember[3], 0.5)
    g.fillRect(m.x, Math.round(cy), m.w, 1)
  }
}

/** Wind streaks across the roof, and the lightning rings and strikes. */
export function renderStorm(
  g: CanvasRenderingContext2D,
  wind: { x: number; y: number },
  strikes: ReadonlyArray<{ x: number; y: number; clock: number }>,
  tick: number,
) {
  const speed = Math.hypot(wind.x, wind.y)
  if (speed > 0.01) {
    const ux = wind.x / speed
    const uy = wind.y / speed
    g.strokeStyle = rgba(RAMPS.steel[4], 0.25)
    g.lineWidth = 1
    for (let i = 0; i < 18; i++) {
      const sx = ((i * 97 + tick * speed * 9) % ARENA_W) + ARENA.left
      const sy =
        ((((i * 61 + tick * speed * 5 * uy) % ARENA_H) + ARENA_H) % ARENA_H) +
        ARENA.top
      g.beginPath()
      g.moveTo(sx, sy)
      g.lineTo(sx - ux * 14, sy - uy * 14)
      g.stroke()
    }
  }
  for (const s of strikes) {
    if (s.clock > 0) {
      const t = 1 - s.clock / LIGHTNING_TELL
      g.strokeStyle = rgba(RAMPS.gold[3], 0.4 + 0.5 * t)
      g.lineWidth = 2
      g.beginPath()
      g.ellipse(
        s.x,
        s.y,
        LIGHTNING_RADIUS,
        LIGHTNING_RADIUS * 0.7,
        0,
        0,
        Math.PI * 2,
      )
      g.stroke()
      if (Math.floor(tick / 4) % 2)
        glow(g, s.x, s.y, LIGHTNING_RADIUS + 6, RAMPS.gold[3], 0.2 + 0.3 * t)
    } else {
      // The strike itself: a jagged bolt from the sky and a white flash.
      g.strokeStyle = '#ffffff'
      g.lineWidth = 3
      g.beginPath()
      let x = s.x + 10
      g.moveTo(x, ARENA.top)
      for (let y = ARENA.top; y < s.y; y += 18) {
        x += ((y * 7) % 13) - 6
        g.lineTo(x, y)
      }
      g.lineTo(s.x, s.y)
      g.stroke()
      glow(g, s.x, s.y, 40, RAMPS.gold[4], 0.9)
    }
  }
}
