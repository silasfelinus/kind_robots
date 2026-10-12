// /utils/arcade/butterflyJoust/scenery.ts
//
// Butterfly Joust's backdrops: the sunset sky over the pond, the candy-topped floating ledges and
// the glittering water. Painted from backdropRng and the tick only, never the game's dice.

import {
  INK,
  RAMPS,
  backdropRng,
  bandedGradient,
  cachedLayer,
  drawCloud,
  drawRidge,
  drawStars,
  glow,
  mix,
  rgba,
  ridge,
  starField,
  type Ramp,
} from '../snes'
import { CEILING, H, POND_Y, THICK, W, type Ledge } from './field'

// Dusk: indigo overhead, through violet and magenta, to a gold horizon.
const SKY_STOPS = [
  '#0d0a26',
  RAMPS.night[2],
  RAMPS.purple[1],
  '#7a2f8f',
  RAMPS.pink[1],
  '#d9466f',
  RAMPS.rust[3],
  RAMPS.gold[3],
] as const
const SKY_BAND = 4

/** The colour bandedGradient gives the sky at row y, for cutting stripes into the sun. */
function skyAt(y: number): string {
  const count = Math.ceil(H / SKY_BAND)
  const t = Math.floor(y / SKY_BAND) / (count - 1)
  const at = t * (SKY_STOPS.length - 1)
  const lo = Math.min(SKY_STOPS.length - 2, Math.floor(at))
  return mix(SKY_STOPS[lo]!, SKY_STOPS[lo + 1]!, at - lo)
}

export const SUN = { x: 318, y: 284, r: 38 }
const STARS = starField(17, 46, W, 150)
const FAR_RIDGE = ridge(23, W, 52)
const NEAR_RIDGE = ridge(31, W, 30, 3)
const FAR_FILL = mix(RAMPS.purple[1], RAMPS.pink[1], 0.45)
const FAR_RIM = mix(RAMPS.pink[1], RAMPS.pink[2], 0.5)

const DUSK_CLOUD: Ramp = ['#2a1650', '#5a2a7a', '#8a3f86', '#c8649a', '#f0a8c8']
const CLOUDS = (() => {
  const rand = backdropRng(41)
  return Array.from({ length: 5 }, (_, i) => ({
    x: rand() * (W + 80),
    y: 44 + i * 34 + rand() * 16,
    size: 7 + Math.round(rand() * 6),
    speed: 0.04 + rand() * 0.1,
  }))
})()

/** The candy top of every ledge, one row each, frosting first. */
const CANDY_ROWS = [
  RAMPS.cream[4],
  RAMPS.pink[2],
  RAMPS.gold[2],
  RAMPS.leaf[3],
  RAMPS.sky[3],
  RAMPS.purple[1],
] as const

/** One floating candy-topped rock: a bevelled rainbow slab over a tapering, jagged underside. */
/** The turf top of a meadow bank, one row each, grass first. */
const TURF_ROWS = [
  RAMPS.leaf[4],
  RAMPS.leaf[3],
  RAMPS.leaf[3],
  RAMPS.leaf[2],
  RAMPS.leaf[1],
  RAMPS.earth[2],
] as const

/** The other slab looks: autumn earth, a snow bank, sheet ice and moonlit marble. */
const SLAB_ROWS = {
  candy: CANDY_ROWS,
  turf: TURF_ROWS,
  autumn: [
    RAMPS.gold[3],
    RAMPS.rust[3],
    RAMPS.rust[2],
    RAMPS.earth[3],
    RAMPS.earth[2],
    RAMPS.earth[1],
  ],
  snow: [
    '#ffffff',
    RAMPS.cream[4],
    RAMPS.sky[4],
    RAMPS.steel[3],
    RAMPS.steel[2],
    RAMPS.steel[1],
  ],
  ice: [
    '#ffffff',
    RAMPS.sky[4],
    RAMPS.sky[3],
    RAMPS.water[3],
    RAMPS.sky[2],
    RAMPS.water[2],
  ],
  marble: [
    RAMPS.steel[4],
    '#ffffff',
    RAMPS.purple[4],
    RAMPS.steel[3],
    RAMPS.purple[3],
    RAMPS.steel[2],
  ],
} as const
export type SlabLook = keyof typeof SLAB_ROWS
const SLAB_ROCK: Record<SlabLook, Ramp> = {
  candy: RAMPS.earth,
  turf: RAMPS.earth,
  autumn: RAMPS.earth,
  snow: RAMPS.steel,
  ice: RAMPS.steel,
  marble: RAMPS.purple,
}

export function paintLedge(
  k: CanvasRenderingContext2D,
  l: Ledge,
  look: SlabLook = 'candy',
) {
  const turf = look === 'turf'
  const ROCK = SLAB_ROCK[look]
  const x0 = Math.max(-4, Math.round(l.x0))
  const x1 = Math.min(W + 4, Math.round(l.x1))
  const w = x1 - x0
  if (w <= 0) return
  const rand = backdropRng(l.y * 31 + 7)
  const deep = Math.min(11, 3 + Math.floor(w / 20))
  // Ledges running off screen don't taper on that side: they continue round the wrap.
  const leftEnd = l.x0 > -4
  const rightEnd = l.x1 < W + 4
  const cols: { x: number; d: number; fleck: number }[] = []
  for (let cx = 0; cx < w; cx += 2) {
    const fromL = leftEnd ? cx : 99
    const fromR = rightEnd ? w - cx : 99
    const taper = Math.min(fromL, fromR) / 2.2
    const d = Math.max(1, Math.round(Math.min(deep, taper) - rand() * 2.5))
    cols.push({ x: x0 + cx, d, fleck: rand() })
  }
  const under = l.y + THICK
  k.fillStyle = INK
  for (const c of cols) k.fillRect(c.x - 1, under, 4, c.d + 1)
  for (const c of cols) {
    k.fillStyle = ROCK[1]
    k.fillRect(c.x, under, 2, c.d)
    k.fillStyle = ROCK[2]
    k.fillRect(c.x, under, 2, Math.ceil(c.d * 0.55))
    k.fillStyle = ROCK[0]
    k.fillRect(c.x, under + c.d - 1, 2, 1)
    if (c.fleck < 0.3 && c.d > 3) {
      k.fillStyle = ROCK[3]
      k.fillRect(c.x, under + 1 + Math.floor(c.fleck * 6), 1, 1)
    }
  }
  // The slab, with clipped corners at the ends that show.
  k.fillStyle = INK
  k.fillRect(x0 - 1, l.y, w + 2, THICK)
  k.fillRect(x0, l.y - 1, w, THICK + 2)
  SLAB_ROWS[look].forEach((colour, i) => {
    k.fillStyle = colour
    k.fillRect(x0, l.y + i, w, 1)
  })
  if (turf) {
    paintTurfTop(k, x0, x1, l.y, rand)
    return
  }
  if (look !== 'candy') {
    paintSlabTop(k, look, x0, x1, l.y, under, rand)
    return
  }
  // Candy blocks: a lit seam and a shadow seam every 16 pixels.
  for (let x = x0 + 12; x < x1 - 4; x += 16) {
    k.fillStyle = rgba(INK, 0.45)
    k.fillRect(x, l.y + 1, 1, THICK - 2)
    k.fillStyle = rgba('#ffffff', 0.5)
    k.fillRect(x + 1, l.y + 1, 1, THICK - 2)
  }
  // Frosting drips over the rock.
  for (let x = x0 + 6; x < x1 - 6; x += 9 + Math.floor(rand() * 14)) {
    const len = 2 + Math.floor(rand() * 4)
    k.fillStyle = INK
    k.fillRect(x - 1, under, 4, len + 1)
    k.fillStyle = RAMPS.pink[2]
    k.fillRect(x, under, 2, len)
    k.fillStyle = RAMPS.pink[3]
    k.fillRect(x, under, 1, len - 1)
  }
}

/** Fallen leaves on autumn earth, icicles under snow and ice, seams in moon marble. */
function paintSlabTop(
  k: CanvasRenderingContext2D,
  look: SlabLook,
  x0: number,
  x1: number,
  y: number,
  under: number,
  rand: () => number,
) {
  if (look === 'autumn') {
    for (let x = x0 + 3; x < x1 - 3; x += 4 + Math.floor(rand() * 6)) {
      k.fillStyle = [RAMPS.ember[2], RAMPS.gold[2], RAMPS.rust[3]][
        Math.floor(rand() * 3)
      ]!
      k.fillRect(x, y - 1, 2, 1)
    }
    return
  }
  if (look === 'marble') {
    for (let x = x0 + 10; x < x1 - 4; x += 20) {
      k.fillStyle = rgba(RAMPS.purple[2], 0.6)
      k.fillRect(x, y + 1, 1, THICK - 2)
    }
    return
  }
  // Snow and ice: icicles hanging under the slab.
  for (let x = x0 + 4; x < x1 - 4; x += 6 + Math.floor(rand() * 9)) {
    const len = 2 + Math.floor(rand() * 6)
    k.fillStyle = INK
    k.fillRect(x - 1, under, 3, len + 1)
    k.fillStyle = RAMPS.sky[4]
    k.fillRect(x, under, 1, len)
  }
  if (look === 'snow') {
    k.fillStyle = '#ffffff'
    for (let x = x0 + 2; x < x1 - 2; x += 5) k.fillRect(x, y - 1, 3, 1)
  }
}

/** Grass tufts and little flowers along a turf ledge's top. */
function paintTurfTop(
  k: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  y: number,
  rand: () => number,
) {
  for (let x = x0 + 2; x < x1 - 2; x += 3 + Math.floor(rand() * 4)) {
    const h = 1 + Math.floor(rand() * 3)
    k.fillStyle = RAMPS.leaf[rand() < 0.5 ? 3 : 4]
    k.fillRect(x, y - h, 1, h)
    if (rand() < 0.12) {
      const petal = [RAMPS.pink[3], RAMPS.gold[3], '#ffffff', RAMPS.sky[3]][
        Math.floor(rand() * 4)
      ]!
      k.fillStyle = INK
      k.fillRect(x - 2, y - h - 3, 5, 3)
      k.fillStyle = petal
      k.fillRect(x - 1, y - h - 3, 3, 2)
      k.fillStyle = RAMPS.gold[4]
      k.fillRect(x, y - h - 3, 1, 1)
    }
  }
}

/** The banded dusk sky with the setting sun, the stars, the drifting clouds and two ridges. */
export function paintSunsetSky(g: CanvasRenderingContext2D, tick: number) {
  cachedLayer(g, 'butterfly-joust-sky', W, H, (k) => {
    bandedGradient(k, 0, 0, W, H, SKY_STOPS, SKY_BAND)
    glow(k, SUN.x, SUN.y, SUN.r * 2.4, RAMPS.gold[3], 0.35)
    k.save()
    k.beginPath()
    k.arc(SUN.x, SUN.y, SUN.r, 0, Math.PI * 2)
    k.clip()
    bandedGradient(
      k,
      SUN.x - SUN.r,
      SUN.y - SUN.r,
      SUN.r * 2,
      SUN.r * 2,
      [RAMPS.gold[4], RAMPS.gold[3], RAMPS.rust[3], RAMPS.ember[2]],
      3,
    )
    // The sunset stripes: the sky showing through ever wider slits.
    for (let i = 0; i < 6; i++) {
      const y = SUN.y - 4 + i * 6
      const h = 1 + Math.floor(i / 2)
      for (let row = y; row < y + h; row++) {
        k.fillStyle = skyAt(row)
        k.fillRect(SUN.x - SUN.r, row, SUN.r * 2, 1)
      }
    }
    k.restore()
  })
  drawStars(g, STARS, tick, RAMPS.gold)
  for (const c of CLOUDS) {
    const x = ((c.x + tick * c.speed) % (W + 80)) - 40
    drawCloud(g, x, c.y, c.size, DUSK_CLOUD)
  }
  // Two parallax ridges drifting past the sun.
  drawRidge(g, FAR_RIDGE, {
    base: 300,
    bottom: POND_Y,
    width: W,
    offset: tick * 0.05,
    fill: FAR_FILL,
    rim: FAR_RIM,
  })
  drawRidge(g, NEAR_RIDGE, {
    base: 318,
    bottom: POND_Y,
    width: W,
    offset: tick * 0.14,
    step: 3,
    fill: RAMPS.night[2],
    rim: RAMPS.purple[1],
  })
}

/** Every ledge, cached under `key` (change it when a ledge changes). */
export function paintLedges(
  g: CanvasRenderingContext2D,
  ledges: readonly (Ledge & { look?: string })[],
  key: string,
) {
  cachedLayer(g, `butterfly-joust-ledges-${key}`, W, H, (k) => {
    for (const l of ledges)
      paintLedge(
        k,
        l,
        l.look && l.look in SLAB_ROWS ? (l.look as SlabLook) : 'candy',
      )
  })
}

/** The pond: banded water, the sun's glitter path and rolling wavelets. */
export function paintPond(g: CanvasRenderingContext2D, tick: number) {
  bandedGradient(
    g,
    0,
    POND_Y,
    W,
    H - POND_Y,
    [RAMPS.water[2], RAMPS.water[1], RAMPS.water[0]],
    2,
  )
  g.fillStyle = RAMPS.water[3]
  g.fillRect(0, POND_Y, W, 1)
  g.save()
  g.globalCompositeOperation = 'lighter'
  for (let i = 0; i < 5; i++) {
    const y = POND_Y + 2 + i * 2
    const half = Math.round(
      SUN.r * 0.5 - i * 3 + Math.sin(tick / 9 + i * 1.7) * 3,
    )
    g.fillStyle = rgba(RAMPS.gold[3], 0.55 - i * 0.08)
    g.fillRect(SUN.x - half, y, half * 2, 1)
  }
  g.restore()
  for (let x = 0; x < W; x += 16) {
    const y = Math.round(POND_Y + 3 + Math.sin((x + tick) / 10) * 1.5)
    g.fillStyle = RAMPS.water[4]
    g.fillRect(x + 2, y, 6, 1)
    g.fillStyle = RAMPS.water[3]
    g.fillRect(x + 8, y, 3, 1)
    g.fillStyle = RAMPS.water[0]
    g.fillRect(x + 3, y + 1, 7, 1)
  }
}

// --- Spring Meadow (slice 2) -------------------------------------------------------------------

// Morning: a clear blue overhead, paling to a warm cream at the horizon.
const MEADOW_STOPS = [
  '#3d86d8',
  RAMPS.sky[2],
  '#63aef0',
  RAMPS.sky[3],
  '#bfe6fb',
  '#e9f6e8',
  '#fff1c9',
] as const
const MEADOW_SUN = { x: 92, y: 66, r: 20 }
const MEADOW_FAR = ridge(57, W, 40, 6)
const MEADOW_NEAR = ridge(61, W, 26, 3)
const MORNING_CLOUD: Ramp = [
  '#9ab7d8',
  '#c4d8ee',
  '#e3eef9',
  '#f6fbff',
  '#ffffff',
]
const MEADOW_CLOUDS = (() => {
  const rand = backdropRng(67)
  return Array.from({ length: 4 }, (_, i) => ({
    x: rand() * (W + 80),
    y: 40 + i * 30 + rand() * 14,
    size: 8 + Math.round(rand() * 6),
    speed: 0.05 + rand() * 0.08,
  }))
})()
const MEADOW_FLOWERS = (() => {
  const rand = backdropRng(71)
  return Array.from({ length: 70 }, () => ({
    x: Math.floor(rand() * W),
    y: 268 + Math.floor(rand() * 50),
    c: Math.floor(rand() * 4),
  }))
})()
const FLOWER_COLOURS = [
  RAMPS.pink[3],
  RAMPS.gold[3],
  '#ffffff',
  RAMPS.purple[3],
]
const LILY_PADS = (() => {
  const rand = backdropRng(73)
  return Array.from({ length: 9 }, () => ({
    x: rand() * W,
    w: 10 + Math.floor(rand() * 8),
    flower: rand() < 0.35,
  }))
})()

/** The morning meadow: sky, sun, drifting clouds and two rolling green hills dotted with flowers. */
export function paintMeadowSky(g: CanvasRenderingContext2D, tick: number) {
  cachedLayer(g, 'butterfly-joust-meadow-sky', W, H, (k) => {
    bandedGradient(k, 0, 0, W, H, MEADOW_STOPS, 4)
    glow(k, MEADOW_SUN.x, MEADOW_SUN.y, MEADOW_SUN.r * 3.2, '#fff6c8', 0.55)
    k.fillStyle = '#fffbe6'
    k.beginPath()
    k.arc(MEADOW_SUN.x, MEADOW_SUN.y, MEADOW_SUN.r, 0, Math.PI * 2)
    k.fill()
    k.fillStyle = '#fff0a8'
    k.beginPath()
    k.arc(MEADOW_SUN.x + 3, MEADOW_SUN.y + 3, MEADOW_SUN.r - 5, 0, Math.PI * 2)
    k.fill()
  })
  for (const c of MEADOW_CLOUDS) {
    const x = ((c.x + tick * c.speed) % (W + 80)) - 40
    drawCloud(g, x, c.y, c.size, MORNING_CLOUD)
  }
  drawRidge(g, MEADOW_FAR, {
    base: 262,
    bottom: POND_Y,
    width: W,
    offset: tick * 0.04,
    step: 6,
    fill: mix(RAMPS.leaf[2], RAMPS.sky[3], 0.45),
    rim: mix(RAMPS.leaf[3], '#ffffff', 0.3),
  })
  drawRidge(g, MEADOW_NEAR, {
    base: 292,
    bottom: POND_Y,
    width: W,
    offset: tick * 0.12,
    step: 3,
    fill: RAMPS.leaf[2],
    rim: RAMPS.leaf[3],
  })
  for (const f of MEADOW_FLOWERS) {
    const x = Math.round((f.x - tick * 0.12 + W * 4) % W)
    if (f.y < 296) continue
    g.fillStyle = FLOWER_COLOURS[f.c]!
    g.fillRect(x, f.y, 2, 1)
  }
}

/** The lily pond: green-blue water, floating pads (a few in flower), and reeds at the banks. */
export function paintLilyPond(g: CanvasRenderingContext2D, tick: number) {
  bandedGradient(
    g,
    0,
    POND_Y,
    W,
    H - POND_Y,
    [
      mix(RAMPS.water[2], RAMPS.leaf[2], 0.35),
      mix(RAMPS.water[1], RAMPS.leaf[1], 0.35),
      RAMPS.water[0],
    ],
    2,
  )
  g.fillStyle = RAMPS.water[4]
  g.fillRect(0, POND_Y, W, 1)
  for (const pad of LILY_PADS) {
    const x = Math.round((pad.x + Math.sin(tick / 90 + pad.x) * 3 + W) % W)
    const y = POND_Y + 3 + Math.round(Math.sin(tick / 40 + pad.x) * 0.6)
    g.fillStyle = INK
    g.fillRect(x - pad.w / 2 - 1, y - 1, pad.w + 2, 4)
    g.fillStyle = RAMPS.leaf[2]
    g.fillRect(x - pad.w / 2, y, pad.w, 2)
    g.fillStyle = RAMPS.leaf[3]
    g.fillRect(x - pad.w / 2 + 1, y, pad.w - 4, 1)
    g.fillStyle = RAMPS.leaf[1]
    g.fillRect(x + 1, y, 1, 2)
    if (pad.flower) {
      g.fillStyle = INK
      g.fillRect(x - 3, y - 4, 6, 4)
      g.fillStyle = RAMPS.pink[3]
      g.fillRect(x - 2, y - 3, 4, 2)
      g.fillStyle = RAMPS.pink[4]
      g.fillRect(x - 1, y - 4, 2, 2)
    }
  }
  for (let x = 0; x < W; x += 24) {
    const y = Math.round(POND_Y + 8 + Math.sin((x + tick) / 12))
    g.fillStyle = rgba(RAMPS.water[4], 0.6)
    g.fillRect(x + 6, y, 5, 1)
  }
}

/** A flower ledge: open, a flat ring of petals to stand on; folding, the petals tremble and
 * lift; shut, a closed bud on its stem (nothing to stand on). */
export function paintFlower(
  g: CanvasRenderingContext2D,
  l: Ledge,
  open: boolean,
  closing: number,
  tick: number,
) {
  const cx = Math.round((l.x0 + l.x1) / 2)
  const half = Math.round((l.x1 - l.x0) / 2)
  // The stem down toward the meadow.
  g.fillStyle = INK
  g.fillRect(cx - 3, l.y + 4, 6, 46)
  g.fillStyle = RAMPS.leaf[2]
  g.fillRect(cx - 2, l.y + 4, 4, 45)
  g.fillStyle = RAMPS.leaf[3]
  g.fillRect(cx - 2, l.y + 4, 1, 45)
  // A leaf on the stem.
  g.fillStyle = INK
  g.fillRect(cx + 2, l.y + 26, 12, 5)
  g.fillStyle = RAMPS.leaf[3]
  g.fillRect(cx + 3, l.y + 27, 10, 3)
  if (!open) {
    // The closed bud.
    g.fillStyle = INK
    g.fillRect(cx - 8, l.y - 16, 16, 22)
    g.fillRect(cx - 6, l.y - 20, 12, 4)
    g.fillStyle = RAMPS.pink[2]
    g.fillRect(cx - 7, l.y - 15, 14, 20)
    g.fillRect(cx - 5, l.y - 19, 10, 4)
    g.fillStyle = RAMPS.pink[3]
    g.fillRect(cx - 5, l.y - 17, 3, 18)
    g.fillStyle = RAMPS.leaf[2]
    g.fillRect(cx - 7, l.y + 1, 14, 4)
    return
  }
  const shake =
    closing > 0 ? Math.round(Math.sin(tick * 1.4) * closing * 1.5) : 0
  const lift = Math.round(closing * 6)
  // Petals: overlapping lobes in one soft pad, the outer ones lifting as it is about to fold.
  const petals = Math.max(4, Math.round(half / 8))
  const spacing = (l.x1 - l.x0 - 8) / (petals - 1)
  const rx = spacing / 2 + 4
  const lobes = Array.from({ length: petals }, (_, i) => {
    const t = i / (petals - 1)
    const edge = Math.abs(t - 0.5) * 2
    return {
      x: l.x0 + 4 + i * spacing,
      y: l.y + 3 - edge * edge * lift + (i % 2 ? shake : -shake),
    }
  })
  const flash = closing > 0.5 && Math.floor(tick / 4) % 2 === 1
  const pass = (colour: string, grow: number, dy: number, k = 1) => {
    g.fillStyle = colour
    for (const p of lobes) {
      g.beginPath()
      g.ellipse(p.x, p.y + dy, (rx + grow) * k, 4 + grow, 0, 0, Math.PI * 2)
      g.fill()
    }
  }
  pass(INK, 1.5, 0)
  pass(RAMPS.pink[1], 0, 0.5)
  pass(flash ? RAMPS.pink[3] : RAMPS.pink[2], -0.5, -0.5)
  pass(RAMPS.pink[3], -2, -1.5, 0.7)
  pass(RAMPS.pink[4], -3, -2, 0.4)
  // The golden heart.
  g.fillStyle = INK
  g.beginPath()
  g.ellipse(cx, l.y + 1, 9, 4, 0, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = RAMPS.gold[2]
  g.beginPath()
  g.ellipse(cx, l.y + 1, 8, 3, 0, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = RAMPS.gold[4]
  g.fillRect(cx - 5, l.y - 1, 2, 1)
  g.fillRect(cx - 1, l.y, 2, 1)
  g.fillRect(cx + 3, l.y - 1, 2, 1)
}

/** A drifting leaf to stand on. */
export function paintLeaf(g: CanvasRenderingContext2D, l: Ledge) {
  const x0 = Math.round(l.x0)
  const x1 = Math.round(l.x1)
  const y = Math.round(l.y)
  const w = x1 - x0
  g.fillStyle = INK
  g.beginPath()
  g.ellipse((x0 + x1) / 2, y + 3, w / 2 + 2, 6, 0, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = RAMPS.leaf[2]
  g.beginPath()
  g.ellipse((x0 + x1) / 2, y + 3, w / 2, 4.5, 0, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = RAMPS.leaf[3]
  g.beginPath()
  g.ellipse((x0 + x1) / 2 - 2, y + 1.5, w / 2 - 4, 2, 0, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = RAMPS.leaf[1]
  g.fillRect(x0 + 4, y + 3, w - 8, 1)
  g.fillStyle = INK
  g.fillRect(x1, y + 2, 5, 2)
}

/** A dandelion puff: a soft cloud of seed fluff, fading as it is about to burst. */
export function paintPuff(
  g: CanvasRenderingContext2D,
  l: Ledge,
  burst: number,
  tick: number,
) {
  const cx = (l.x0 + l.x1) / 2
  const half = (l.x1 - l.x0) / 2
  const shake = burst > 0.5 ? Math.sin(tick * 1.5) * 1.2 : 0
  for (let i = 0; i < 5; i++) {
    const t = i / 4
    const x = cx - half + 6 + t * (half * 2 - 12) + shake
    const y = l.y + 3 - Math.sin(t * Math.PI) * 3
    g.fillStyle = INK
    g.beginPath()
    g.arc(x, y, 7, 0, Math.PI * 2)
    g.fill()
  }
  for (let i = 0; i < 5; i++) {
    const t = i / 4
    const x = cx - half + 6 + t * (half * 2 - 12) + shake
    const y = l.y + 3 - Math.sin(t * Math.PI) * 3
    g.fillStyle =
      burst > 0.6 && Math.floor(tick / 4) % 2 ? RAMPS.cream[3] : '#ffffff'
    g.beginPath()
    g.arc(x, y, 6, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = RAMPS.cream[3]
    g.fillRect(Math.round(x) - 2, Math.round(y) + 2, 4, 1)
  }
  // Fine seed hairs standing out of the fluff.
  g.fillStyle = rgba('#ffffff', 0.8)
  for (let i = 0; i < 5; i++) {
    const hx = Math.round(cx - half + 8 + i * ((half * 2 - 16) / 4) + shake)
    g.fillRect(hx, Math.round(l.y) - 6 - (i % 2) * 2, 1, 3)
  }
}

/** A sun-patch thermal: a column of warm light with motes rising up it. */
export function paintThermal(
  g: CanvasRenderingContext2D,
  x: number,
  w: number,
  top: number,
  on: boolean,
  tick: number,
) {
  const alpha = on ? 0.07 : 0.025
  for (let i = 0; i < 3; i++) {
    const inset = i * (w / 6)
    g.fillStyle = rgba(RAMPS.gold[3], alpha)
    g.fillRect(
      Math.round(x - w / 2 + inset),
      top,
      Math.round(w - inset * 2),
      POND_Y - top,
    )
  }
  // A shimmer at its top where the lift gives out.
  g.fillStyle = rgba(RAMPS.gold[4], on ? 0.35 : 0.1)
  g.fillRect(Math.round(x - w / 2 + 3), top, Math.round(w - 6), 1)
  if (on) {
    for (let i = 0; i < 10; i++) {
      const y = POND_Y - ((tick * 1.4 + i * 37) % (POND_Y - top))
      const mx = x + Math.sin((y + i * 13) / 14) * (w / 2 - 4)
      g.fillStyle = rgba(i % 3 ? RAMPS.gold[4] : '#ffffff', 0.9)
      g.fillRect(Math.round(mx), Math.round(y), 1, 2)
    }
  }
}

/** Wind: streaks blowing across the arena (`dir` its way, `k` 0..1 its strength). */
export function paintWind(
  g: CanvasRenderingContext2D,
  dir: number,
  k: number,
  tick: number,
) {
  g.fillStyle = rgba('#ffffff', 0.35 * k)
  for (let i = 0; i < 14; i++) {
    const y = 40 + ((i * 53) % 260)
    const len = 10 + (i % 4) * 6
    const x =
      ((((tick * 5 * dir + i * 97) % (W + 60)) + W + 60) % (W + 60)) - 30
    g.fillRect(Math.round(x), y, len, 1)
  }
}

// --- Thunderhead Heights, Autumn Orchard, Lantern Snowfield, the Moon Garden (slice 3) ------

const STORM_STOPS = [
  '#1b1f3a',
  '#262c52',
  '#323a66',
  '#3f4a78',
  '#55628c',
  '#6f7ea3',
  '#8796b5',
] as const
const STORM_CLOUD: Ramp = [
  '#20243e',
  '#353c60',
  '#4a5480',
  '#66729c',
  '#8a96b8',
]
const HEIGHTS_CLOUDS = (() => {
  const rand = backdropRng(81)
  return Array.from({ length: 7 }, (_, i) => ({
    x: rand() * (W + 120),
    y: 36 + i * 30 + rand() * 20,
    size: 12 + Math.round(rand() * 10),
    speed: 0.08 + rand() * 0.12,
  }))
})()

/** A storm sky, cloud on cloud, with far-off sheet lightning now and then. */
export function paintHeightsSky(g: CanvasRenderingContext2D, tick: number) {
  cachedLayer(g, 'butterfly-joust-heights-sky', W, H, (k) => {
    bandedGradient(k, 0, 0, W, H, STORM_STOPS, 4)
  })
  const sheet = tick % 400 < 6 && Math.floor(tick / 400) % 3 === 1
  if (sheet) {
    g.fillStyle = rgba('#dfe6ff', 0.18)
    g.fillRect(0, 0, W, H)
  }
  for (const c of HEIGHTS_CLOUDS) {
    const x = ((c.x + tick * c.speed) % (W + 120)) - 60
    drawCloud(g, x, c.y, c.size, STORM_CLOUD)
  }
}

/** Open sky below: a sea of cloud far under the heights. */
export function paintCloudSea(g: CanvasRenderingContext2D, tick: number) {
  bandedGradient(
    g,
    0,
    POND_Y - 4,
    W,
    H - POND_Y + 4,
    ['#6f7ea3', '#55628c', '#3f4a78'],
    2,
  )
  for (let i = 0; i < 9; i++) {
    const x = ((i * 61 + tick * 0.2) % (W + 60)) - 30
    drawCloud(g, x, POND_Y + 10, 10, STORM_CLOUD)
  }
}

const AUTUMN_STOPS = [
  '#6b9fd4',
  '#8bb5d8',
  '#b8c9cf',
  '#e6c9a0',
  '#f2b26b',
  '#e88a4a',
] as const
const ORCHARD_FAR = ridge(91, W, 34, 8)
const ORCHARD_NEAR = ridge(97, W, 22, 4)

/** An autumn afternoon: a pale sky warming to orange, rows of trees, leaves on the air. */
export function paintOrchardSky(g: CanvasRenderingContext2D, tick: number) {
  cachedLayer(g, 'butterfly-joust-orchard-sky', W, H, (k) => {
    bandedGradient(k, 0, 0, W, H, AUTUMN_STOPS, 4)
    glow(k, 360, 70, 70, '#fff1c0', 0.5)
    k.fillStyle = '#fff4d0'
    k.beginPath()
    k.arc(360, 70, 18, 0, Math.PI * 2)
    k.fill()
  })
  drawRidge(g, ORCHARD_FAR, {
    base: 250,
    bottom: POND_Y,
    width: W,
    offset: tick * 0.04,
    step: 8,
    fill: mix(RAMPS.rust[2], RAMPS.sky[3], 0.45),
    rim: mix(RAMPS.gold[3], '#ffffff', 0.2),
  })
  drawRidge(g, ORCHARD_NEAR, {
    base: 286,
    bottom: POND_Y,
    width: W,
    offset: tick * 0.12,
    step: 4,
    fill: RAMPS.rust[1],
    rim: RAMPS.rust[3],
  })
  // Leaves drifting down across the orchard.
  for (let i = 0; i < 12; i++) {
    const y = ((tick * 0.5 + i * 37) % (POND_Y - CEILING)) + CEILING
    const x = (i * 53 + Math.sin((tick + i * 40) / 30) * 20 + tick * 0.3) % W
    g.fillStyle = [RAMPS.ember[2], RAMPS.gold[2], RAMPS.rust[3]][i % 3]!
    g.fillRect(Math.round(x), Math.round(y), 2, 1)
  }
}

/** The orchard stream: brown-green water with leaves floating by. */
export function paintStream(g: CanvasRenderingContext2D, tick: number) {
  bandedGradient(
    g,
    0,
    POND_Y,
    W,
    H - POND_Y,
    [
      mix(RAMPS.water[2], RAMPS.earth[2], 0.4),
      mix(RAMPS.water[1], RAMPS.earth[1], 0.4),
      RAMPS.water[0],
    ],
    2,
  )
  g.fillStyle = RAMPS.water[3]
  g.fillRect(0, POND_Y, W, 1)
  for (let i = 0; i < 10; i++) {
    const x = Math.round((i * 47 + tick * 0.6) % W)
    g.fillStyle = [RAMPS.ember[2], RAMPS.gold[2]][i % 2]!
    g.fillRect(x, POND_Y + 4 + (i % 3) * 3, 3, 1)
  }
}

const SNOW_STOPS = [
  '#070b24',
  '#0d1436',
  '#141e4a',
  '#1d2a5e',
  '#2a3a73',
  '#3a4d88',
] as const
const SNOW_STARS = starField(101, 40, W, 160)
const SNOW_HILLS = ridge(103, W, 28, 5)

/** A winter night: stars, falling snow, snowy hills and strings of festival lanterns. */
export function paintSnowSky(g: CanvasRenderingContext2D, tick: number) {
  cachedLayer(g, 'butterfly-joust-snow-sky', W, H, (k) => {
    bandedGradient(k, 0, 0, W, H, SNOW_STOPS, 4)
  })
  drawStars(g, SNOW_STARS, tick, RAMPS.sky)
  drawRidge(g, SNOW_HILLS, {
    base: 280,
    bottom: POND_Y,
    width: W,
    offset: tick * 0.05,
    step: 5,
    fill: '#c9d6ec',
    rim: '#ffffff',
  })
  // Festival lanterns strung across the far hills.
  for (let s = 0; s < 2; s++) {
    for (let i = 0; i < 16; i++) {
      const x = i * 30 + 6 + s * 15
      const y = 238 + s * 16 + Math.sin(i / 2.5 + s) * 6
      const on = (i + Math.floor(tick / 20)) % 4 !== 0
      g.fillStyle = on ? RAMPS.ember[3] : RAMPS.ember[1]
      g.fillRect(x, Math.round(y), 2, 3)
    }
  }
  // Snow.
  g.fillStyle = '#ffffff'
  for (let i = 0; i < 40; i++) {
    const y =
      ((tick * (0.4 + (i % 3) * 0.2) + i * 29) % (H - CEILING)) + CEILING
    const x = (i * 71 + Math.sin((tick + i * 17) / 40) * 10) % W
    g.fillRect(
      Math.round(x),
      Math.round(y),
      i % 5 === 0 ? 2 : 1,
      i % 5 === 0 ? 2 : 1,
    )
  }
}

/** Under the frozen pond: dark water, seen where the ice has broken. */
export function paintIcePond(g: CanvasRenderingContext2D, tick: number) {
  bandedGradient(
    g,
    0,
    POND_Y - 4,
    W,
    H - POND_Y + 4,
    [RAMPS.water[1], RAMPS.water[0], RAMPS.night[1]],
    2,
  )
  for (let x = 0; x < W; x += 20) {
    const y = Math.round(POND_Y + 4 + Math.sin((x + tick) / 9))
    g.fillStyle = rgba(RAMPS.water[3], 0.5)
    g.fillRect(x + 4, y, 6, 1)
  }
}

/** A slab of the frozen pond, crazed with cracks as it is landed on. */
export function paintFloe(
  g: CanvasRenderingContext2D,
  l: Ledge,
  cracks: number,
) {
  const x0 = Math.round(l.x0)
  const w = Math.round(l.x1 - l.x0)
  g.fillStyle = INK
  g.fillRect(x0, l.y - 1, w, 7)
  g.fillStyle = RAMPS.sky[4]
  g.fillRect(x0 + 1, l.y, w - 2, 5)
  g.fillStyle = '#ffffff'
  g.fillRect(x0 + 2, l.y, w - 8, 1)
  g.fillStyle = RAMPS.sky[3]
  g.fillRect(x0 + 1, l.y + 4, w - 2, 1)
  g.strokeStyle = INK
  g.lineWidth = 1
  for (let c = 0; c < cracks; c++) {
    const cx = x0 + ((c * 17 + 9) % (w - 8)) + 4
    g.beginPath()
    g.moveTo(cx, l.y)
    g.lineTo(cx + 3, l.y + 2)
    g.lineTo(cx - 2, l.y + 5)
    g.stroke()
  }
}

const MOON_STOPS = [
  '#0c0620',
  '#160c36',
  '#22124a',
  '#2f1a5c',
  '#3d2470',
  '#4f3184',
] as const
const MOON_STARS = starField(111, 54, W, 200)
const MOON = { x: 330, y: 76, r: 26 }
const TOPIARY = ridge(113, W, 30, 10)

/** The Moon Garden: a violet night, the moon slipping behind clouds, and dark topiary. */
export function paintMoonSky(
  g: CanvasRenderingContext2D,
  tick: number,
  hidden: number,
) {
  cachedLayer(g, 'butterfly-joust-moon-sky', W, H, (k) => {
    bandedGradient(k, 0, 0, W, H, MOON_STOPS, 4)
  })
  drawStars(g, MOON_STARS, tick, RAMPS.purple)
  glow(g, MOON.x, MOON.y, MOON.r * 3, '#f4ecff', 0.4 * (1 - hidden))
  g.fillStyle = '#f6f0ff'
  g.beginPath()
  g.arc(MOON.x, MOON.y, MOON.r, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = '#d9cdf0'
  for (const [dx, dy, r] of [
    [-8, -6, 5],
    [7, 4, 4],
    [-3, 10, 3],
  ] as const) {
    g.beginPath()
    g.arc(MOON.x + dx, MOON.y + dy, r, 0, Math.PI * 2)
    g.fill()
  }
  // Clouds sliding over it as it hides.
  const cover = MOON.x - 90 + hidden * 90
  drawCloud(g, cover, MOON.y + 4, 16, [
    '#1d1238',
    '#2c1c50',
    '#3d2a66',
    '#56408a',
    '#7460a8',
  ])
  drawCloud(g, cover + 40, MOON.y - 10, 13, [
    '#1d1238',
    '#2c1c50',
    '#3d2a66',
    '#56408a',
    '#7460a8',
  ])
  drawRidge(g, TOPIARY, {
    base: 276,
    bottom: POND_Y,
    width: W,
    offset: 0,
    step: 10,
    fill: '#140a2e',
    rim: '#2c1c50',
  })
}

/** A still mirror pool: the moon's path shimmering on the water. */
export function paintMirrorPool(g: CanvasRenderingContext2D, tick: number) {
  bandedGradient(
    g,
    0,
    POND_Y,
    W,
    H - POND_Y,
    ['#3d2a66', '#2c1c50', '#140a2e'],
    2,
  )
  g.fillStyle = '#e8dcff'
  g.fillRect(0, POND_Y, W, 1)
  for (let i = 0; i < 5; i++) {
    const half = Math.round(16 - i * 2 + Math.sin(tick / 11 + i) * 3)
    g.fillStyle = rgba('#f6f0ff', 0.5 - i * 0.08)
    g.fillRect(MOON.x - half, POND_Y + 2 + i * 2, half * 2, 1)
  }
}

const RAINBOW_STOPS = [
  '#ff8fb4',
  '#ffb38a',
  '#ffe08a',
  '#b8f08a',
  '#8ad8ff',
  '#b8a0ff',
] as const

/** The Rainbow Lists: a sky in rainbow bands, all sparkle. */
export function paintRainbowSky(g: CanvasRenderingContext2D, tick: number) {
  cachedLayer(g, 'butterfly-joust-rainbow-sky', W, H, (k) => {
    bandedGradient(k, 0, 0, W, H, RAINBOW_STOPS, 6)
  })
  for (let i = 0; i < 24; i++) {
    const t = (tick + i * 37) % 120
    if (t > 20) continue
    const x = (i * 97) % W
    const y = CEILING + ((i * 53) % 240)
    g.fillStyle = '#ffffff'
    g.fillRect(x - 1, y, 3, 1)
    g.fillRect(x, y - 1, 1, 3)
  }
}

/** A fluffy cloud ledge. */
export function paintCloudLedge(g: CanvasRenderingContext2D, l: Ledge) {
  const x0 = l.x0
  const w = l.x1 - l.x0
  const puffs = Math.max(3, Math.round(w / 14))
  const at = (i: number) => x0 + 6 + (i * (w - 12)) / (puffs - 1)
  g.fillStyle = INK
  for (let i = 0; i < puffs; i++) {
    g.beginPath()
    g.arc(at(i), l.y + 4, 8, 0, Math.PI * 2)
    g.fill()
  }
  g.fillRect(Math.round(x0) + 2, Math.round(l.y) + 4, Math.round(w) - 4, 8)
  for (let i = 0; i < puffs; i++) {
    g.fillStyle = '#b8c2da'
    g.beginPath()
    g.arc(at(i), l.y + 5, 7, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#eef2fb'
    g.beginPath()
    g.arc(at(i) - 1, l.y + 3, 5.5, 0, Math.PI * 2)
    g.fill()
  }
  g.fillStyle = '#ffffff'
  g.fillRect(Math.round(x0) + 6, Math.round(l.y) - 1, Math.round(w) - 12, 1)
}

/** A swaying branch: bark, twigs and a few bright autumn leaves. */
export function paintBranch(g: CanvasRenderingContext2D, l: Ledge) {
  const x0 = Math.round(l.x0)
  const w = Math.round(l.x1 - l.x0)
  const y = Math.round(l.y)
  g.fillStyle = INK
  g.fillRect(x0 - 1, y - 1, w + 2, 8)
  g.fillStyle = RAMPS.earth[2]
  g.fillRect(x0, y, w, 6)
  g.fillStyle = RAMPS.earth[3]
  g.fillRect(x0, y, w, 2)
  g.fillStyle = RAMPS.earth[1]
  for (let x = x0 + 5; x < x0 + w - 3; x += 9) g.fillRect(x, y + 3, 4, 1)
  // Twigs and leaf clusters.
  for (let i = 0; i < 4; i++) {
    const tx = x0 + 8 + (i * (w - 16)) / 3
    g.fillStyle = INK
    g.fillRect(Math.round(tx), y + 6, 2, 6)
    const leafs = [RAMPS.ember[2], RAMPS.gold[2], RAMPS.rust[3]]
    for (let j = 0; j < 3; j++) {
      g.fillStyle = INK
      g.fillRect(Math.round(tx) - 4 + j * 3, y + 10 + (j % 2) * 2, 5, 4)
      g.fillStyle = leafs[(i + j) % 3]!
      g.fillRect(Math.round(tx) - 3 + j * 3, y + 11 + (j % 2) * 2, 3, 2)
    }
  }
}

/** Rain: slanting streaks over the whole arena (`k` 0..1 as it builds). */
export function paintRain(
  g: CanvasRenderingContext2D,
  tick: number,
  k: number,
) {
  g.fillStyle = rgba('#c6d4f0', 0.45 * k)
  for (let i = 0; i < 70; i++) {
    const x = ((i * 67 + tick * 3) % (W + 40)) - 20
    const y = ((i * 41 + tick * 7) % (H - CEILING)) + CEILING
    g.fillRect(Math.round(x), Math.round(y), 1, 5)
    g.fillRect(Math.round(x) - 1, Math.round(y) + 5, 1, 2)
  }
}

/** The orchard's weather vane: it swings to point the way the next gust will blow. */
export function paintVane(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: number,
  swing: number,
) {
  g.fillStyle = INK
  g.fillRect(x - 1, y, 3, 18)
  g.fillStyle = RAMPS.steel[3]
  g.fillRect(x, y, 1, 17)
  const tip = dir * (10 + swing)
  g.strokeStyle = INK
  g.lineWidth = 3
  g.beginPath()
  g.moveTo(x - tip, y + 2)
  g.lineTo(x + tip, y + 2)
  g.stroke()
  g.strokeStyle = RAMPS.gold[3]
  g.lineWidth = 1
  g.beginPath()
  g.moveTo(x - tip, y + 2)
  g.lineTo(x + tip, y + 2)
  g.stroke()
  // The arrowhead and the rooster's tail.
  g.fillStyle = RAMPS.gold[3]
  g.fillRect(Math.round(x + tip) - (dir > 0 ? 0 : 3), y, 4, 5)
  g.fillStyle = RAMPS.rust[3]
  g.fillRect(Math.round(x - tip) - (dir > 0 ? 3 : 0), y - 2, 4, 6)
}
