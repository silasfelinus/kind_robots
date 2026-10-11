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
import { H, POND_Y, THICK, W, type Ledge } from './field'

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

/** Chocolate rock under the candy, lit from the upper left. */
const ROCK = RAMPS.earth
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
export function paintLedge(k: CanvasRenderingContext2D, l: Ledge) {
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
  CANDY_ROWS.forEach((colour, i) => {
    k.fillStyle = colour
    k.fillRect(x0, l.y + i, w, 1)
  })
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
  ledges: readonly Ledge[],
  key: string,
) {
  cachedLayer(g, `butterfly-joust-ledges-${key}`, W, H, (k) => {
    for (const l of ledges) paintLedge(k, l)
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
