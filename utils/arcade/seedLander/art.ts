// /utils/arcade/seedLander/art.ts
//
// Seed Lander's 16-bit art (utils/arcade/snes.ts), drawn in world units through the camera: the
// skies by time of day with parallax ridges, the island's turf and soil painted once per map, the
// planter beds, sunflowers and shed, the pod itself (leaning vector art, never a rotated sprite),
// towed cargo on its line, updraft vents and the bloom a planting grows. Cosmetic dice only.

import { drawText } from '../font'
import {
  INK,
  RAMPS,
  backdropRng,
  bandedGradient,
  bevel,
  cachedLayer,
  drawCloud,
  drawRidge,
  drawSprite,
  drawStars,
  dropShadow,
  glow,
  mirrorSprite,
  mix,
  pixelSprite,
  ridge,
  rgba,
  shadedOrb,
  starField,
} from '../snes'
import type { PixelSprite, Ramp } from '../snes'
import type { Pod } from './flight'
import { POD_FEET } from './flight'
import type { ThemeId, VentSpec } from './missions'
import { H, HUD_H, W } from './missions'
import type { Cargo } from './tether'
import { winchPoint } from './tether'
import type { Pad, Terrain } from './terrain'

// --- skies --------------------------------------------------------------------------------------

type Theme = {
  sky: readonly string[]
  stars: number
  /** The sun (or moon) and where it hangs on screen. */
  orb: { x: number; y: number; r: number; ramp: Ramp; glow: string }
  planet: boolean
  cloud: Ramp
  far: { fill: string; rim: string }
  mid: { fill: string; rim: string }
  haze: string
  /** Turf tops by slope (lit, flat, shade) and the soil bands. */
  turf: Ramp
  soil: Ramp
}

export const THEMES: Record<ThemeId, Theme> = {
  dawn: {
    sky: [
      RAMPS.night[2],
      '#3a2a85',
      '#6b3fa0',
      '#b04f9a',
      '#ec7f8c',
      '#f9b77a',
      RAMPS.gold[3],
    ],
    stars: 60,
    orb: {
      x: W - 46,
      y: HUD_H + 34,
      r: 14,
      ramp: RAMPS.gold,
      glow: RAMPS.gold[3],
    },
    planet: true,
    cloud: ['#24124f', '#9a5aa8', '#f0a0b8', '#ffd0c8', '#fff4e8'],
    far: { fill: mix('#6b3fa0', '#b04f9a', 0.35), rim: RAMPS.pink[3] },
    mid: {
      fill: mix(RAMPS.leaf[1], '#3a2a85', 0.55),
      rim: mix(RAMPS.leaf[3], RAMPS.pink[3], 0.4),
    },
    haze: RAMPS.pink[4],
    turf: RAMPS.leaf,
    soil: RAMPS.earth,
  },
  noon: {
    sky: [RAMPS.sky[1], RAMPS.sky[2], '#5aa8ee', RAMPS.sky[3], '#c8ecff'],
    stars: 0,
    orb: { x: 70, y: HUD_H + 26, r: 13, ramp: RAMPS.gold, glow: RAMPS.gold[4] },
    planet: false,
    cloud: [RAMPS.sky[1], RAMPS.sky[3], '#e6f4ff', '#ffffff', '#ffffff'],
    far: { fill: mix(RAMPS.sky[2], RAMPS.leaf[2], 0.35), rim: RAMPS.sky[3] },
    mid: { fill: mix(RAMPS.leaf[1], RAMPS.leaf[2], 0.5), rim: RAMPS.leaf[3] },
    haze: '#ffffff',
    turf: RAMPS.leaf,
    soil: RAMPS.earth,
  },
  dusk: {
    sky: ['#2a1650', '#5a2a78', '#a8406e', '#e0604a', '#f59e5b', '#fcd38a'],
    stars: 30,
    orb: {
      x: W - 70,
      y: HUD_H + 64,
      r: 18,
      ramp: RAMPS.ember,
      glow: RAMPS.rust[3],
    },
    planet: true,
    cloud: ['#3a1408', '#7a2c50', '#e0705a', '#f8b08a', '#ffe0c2'],
    far: { fill: mix('#5a2a78', RAMPS.rust[1], 0.4), rim: RAMPS.rust[3] },
    mid: {
      fill: mix(RAMPS.leaf[0], '#5a2a78', 0.5),
      rim: mix(RAMPS.leaf[2], RAMPS.rust[3], 0.5),
    },
    haze: RAMPS.rust[4],
    turf: ['#123d2a', '#2a5a30', '#5a8a3a', '#b0c86a', '#fff0c0'],
    soil: RAMPS.earth,
  },
  downs: {
    sky: ['#2a5aa8', '#3b8fe6', '#6ab4f0', '#a8dcf8', '#e8f4d0', '#f8e8a0'],
    stars: 0,
    orb: {
      x: W - 60,
      y: HUD_H + 30,
      r: 13,
      ramp: RAMPS.gold,
      glow: RAMPS.gold[4],
    },
    planet: false,
    cloud: [RAMPS.sky[1], RAMPS.sky[3], '#e6f4ff', '#ffffff', '#ffffff'],
    far: { fill: mix(RAMPS.sky[2], RAMPS.gold[2], 0.3), rim: RAMPS.gold[3] },
    mid: { fill: mix(RAMPS.gold[1], RAMPS.leaf[1], 0.5), rim: RAMPS.gold[3] },
    haze: RAMPS.gold[4],
    turf: ['#3a3a10', '#6a6a18', '#a8a030', '#e0d060', '#fff8c0'],
    soil: RAMPS.earth,
  },
  night: {
    sky: [
      RAMPS.night[0],
      RAMPS.night[1],
      RAMPS.night[2],
      RAMPS.night[3],
      '#3a3a8a',
    ],
    stars: 110,
    orb: { x: 64, y: HUD_H + 30, r: 11, ramp: RAMPS.cream, glow: RAMPS.sky[4] },
    planet: false,
    cloud: [
      RAMPS.night[0],
      RAMPS.night[2],
      RAMPS.night[4],
      '#8a8ad8',
      '#c8c8ff',
    ],
    far: {
      fill: mix(RAMPS.night[2], RAMPS.purple[1], 0.5),
      rim: RAMPS.purple[2],
    },
    mid: { fill: mix(RAMPS.night[1], RAMPS.leaf[0], 0.5), rim: RAMPS.teal[1] },
    haze: RAMPS.purple[3],
    turf: ['#0a2a2a', '#124a3a', '#1f6a4a', '#5aa070', '#c8f0c8'],
    soil: ['#140c10', '#2e1a1e', '#4a3030', '#7a5a50', '#b09080'],
  },
}

const STAR_RAMP: Ramp = ['#24124f', '#4c2a99', '#9a8ad8', '#e6dcff', '#ffffff']
const FAR_RIDGE = ridge(101, 640, 44, 4)
const MID_RIDGE = ridge(203, 480, 30, 3)
const SKY_STARS: Record<number, ReturnType<typeof starField>> = {}
function starsFor(count: number) {
  return (SKY_STARS[count] ??= starField(5, count, W, 120).filter(
    (s) => s.y > HUD_H + 2,
  ))
}

/** The sky in screen space: bands, stars, the orb and two parallax ridges that scroll with camX. */
export function paintSky(
  g: CanvasRenderingContext2D,
  themeId: ThemeId,
  tick: number,
  camX: number,
  camY: number,
  wind: number,
) {
  const t = THEMES[themeId]
  cachedLayer(g, `seed-lander-sky-${themeId}`, W, H, (k) => {
    bandedGradient(k, 0, 0, W, H, t.sky, 4)
    if (t.planet) paintPlanet(k, 60, 62, 12)
    shadedOrb(k, t.orb.x, t.orb.y, t.orb.r, t.orb.ramp, { outline: null })
  })
  if (t.stars) drawStars(g, starsFor(t.stars), tick, STAR_RAMP)
  glow(
    g,
    t.orb.x,
    t.orb.y,
    t.orb.r * 3 + 3 * Math.sin(tick / 30),
    t.orb.glow,
    0.42,
  )
  // Clouds drift with the wind and the camera (far away, so slowly).
  for (let i = 0; i < 4; i++) {
    const span = W + 60
    const cx =
      ((((i * 97 + tick * (0.1 + wind * 40) - camX * 0.08) % span) + span) %
        span) -
      30
    drawCloud(g, cx, HUD_H + 18 + i * 13, [6, 5, 7, 5][i]!, t.cloud)
  }
  // The ridges sink a little as the camera climbs, and scroll slower than the island.
  const lift = Math.max(-20, Math.min(30, (camY - 120) * 0.1))
  const farBase = 156 - lift
  drawRidge(g, FAR_RIDGE, {
    base: farBase,
    bottom: H,
    width: W,
    step: 4,
    offset: camX * 0.18,
    fill: mix(t.far.fill, t.far.rim, 0.3),
    rim: t.far.rim,
  })
  drawRidge(g, FAR_RIDGE, {
    base: farBase + 2,
    bottom: H,
    width: W,
    step: 4,
    offset: camX * 0.18,
    fill: t.far.fill,
  })
  g.fillStyle = rgba(t.haze, 0.12)
  for (let i = 0; i < 4; i++) g.fillRect(0, farBase - 14 + i * 4, W, 30 - i * 4)
  const midBase = 182 - lift * 1.5
  drawRidge(g, MID_RIDGE, {
    base: midBase,
    bottom: H,
    width: W,
    step: 3,
    offset: camX * 0.35,
    fill: mix(t.mid.fill, t.mid.rim, 0.3),
    rim: t.mid.rim,
  })
  drawRidge(g, MID_RIDGE, {
    base: midBase + 2,
    bottom: H,
    width: W,
    step: 3,
    offset: camX * 0.35,
    fill: t.mid.fill,
  })
}

function paintPlanet(
  k: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
) {
  const ring = (from: number, to: number) => {
    k.lineWidth = 3
    k.strokeStyle = INK
    k.beginPath()
    k.ellipse(x, y, r * 1.9, r * 0.45, -0.3, from, to)
    k.stroke()
    k.lineWidth = 1.5
    k.strokeStyle = RAMPS.gold[3]
    k.beginPath()
    k.ellipse(x, y, r * 1.9, r * 0.45, -0.3, from, to)
    k.stroke()
  }
  ring(Math.PI, Math.PI * 2)
  shadedOrb(k, x, y, r, RAMPS.teal)
  k.save()
  k.beginPath()
  k.arc(x, y, r, 0, Math.PI * 2)
  k.clip()
  k.fillStyle = rgba(RAMPS.night[1], 0.45)
  k.beginPath()
  k.arc(x - r * 0.55, y + r * 0.35, r * 1.05, 0, Math.PI * 2)
  k.rect(x - r - 2, y - r - 2, r * 2 + 4, r * 2 + 4)
  k.fill('evenodd')
  k.restore()
  ring(0, Math.PI)
  shadedOrb(k, x + 30, y - 22, 3, RAMPS.purple)
}

// --- the island ---------------------------------------------------------------------------------

/** The planter boxes' wood. */
const WOOD: Ramp = ['#2e160c', '#5c2e14', '#93501f', '#c98a4a', '#f2c98e']

/** Paint the island's ground (and roof) columns x0..x1 in world units onto `k`. */
export function paintTerrain(
  k: CanvasRenderingContext2D,
  terrain: Terrain,
  themeId: ThemeId,
  x0 = 0,
  x1 = terrain.w,
) {
  const t = THEMES[themeId]
  const turf = {
    lit: [t.turf[4], t.turf[3], t.turf[3], t.turf[2]],
    flat: [t.turf[3], t.turf[3], t.turf[2], t.turf[2]],
    shade: [t.turf[2], t.turf[2], t.turf[1], t.turf[1]],
  }
  const soil: Array<[number, string]> = [
    [4, t.turf[1]],
    [7, t.turf[0]],
    [8, t.soil[2]],
    [22, t.soil[1]],
    [46, mix(t.soil[1], t.soil[0], 0.5)],
    [76, t.soil[0]],
  ]
  const bottom = terrain.h + 40
  const from = Math.max(0, Math.floor(x0))
  const to = Math.min(terrain.w, Math.ceil(x1))
  for (let x = from; x < to; x++) {
    const top = Math.round(terrain.groundAt(x + 0.5))
    const slope = terrain.groundAt(x + 2.5) - terrain.groundAt(x - 1.5)
    const rim = slope < -1 ? turf.lit : slope > 1 ? turf.shade : turf.flat
    rim.forEach((colour, row) => {
      k.fillStyle = colour
      k.fillRect(x, top + row, 1, 1)
    })
    soil.forEach(([fromRow, colour], i) => {
      const toRow = soil[i + 1]?.[0] ?? bottom - top
      if (top + fromRow >= bottom) return
      k.fillStyle = colour
      k.fillRect(x, top + fromRow, 1, Math.max(0, toRow - fromRow))
      if (i > 1 && x % 2) {
        k.fillStyle = soil[i - 1]![1]
        k.fillRect(x, top + fromRow, 1, 1)
      }
    })
    if (terrain.roof) {
      // A cavern roof: rock hanging down to its underside, a lit lip along the edge.
      const under = Math.round(terrain.roofAt(x + 0.5))
      k.fillStyle = t.soil[0]
      k.fillRect(x, -40, 1, under + 40 - 3)
      k.fillStyle = t.soil[1]
      k.fillRect(x, under - 3, 1, 2)
      k.fillStyle = t.soil[3]
      k.fillRect(x, under - 1, 1, 1)
    }
  }
  // Ledges: stone pillars (or shelves) with a turf cap.
  for (const l of terrain.ledges) {
    if (l.leafy || l.x1 < from || l.x0 > to) continue
    bevel(k, l.x0, l.y0, l.x1 - l.x0, Math.max(4, l.y1 - l.y0), RAMPS.steel, {
      depth: 2,
    })
    k.fillStyle = t.turf[3]
    k.fillRect(l.x0, l.y0, l.x1 - l.x0, 2)
  }
  // Pebbles, tufts and wildflowers (cosmetic dice, seeded by the map so they stay put).
  const rand = backdropRng(31 + Math.round(terrain.w + terrain.ground[3]!))
  const onPad = (x: number) =>
    terrain.pads.some((p) => x >= p.x0 - 2 && x <= p.x1 + 2)
  const count = Math.round(terrain.w / 4.5)
  for (let i = 0; i < count; i++) {
    const x = Math.floor(rand() * terrain.w)
    const y = Math.round(terrain.groundAt(x) + 12 + rand() * 70)
    if (x < from || x >= to) continue
    k.fillStyle = t.soil[3]
    k.fillRect(x, y, 2, 1)
    k.fillStyle = t.soil[4]
    k.fillRect(x, y, 1, 1)
    k.fillStyle = t.soil[0]
    k.fillRect(x, y + 1, 2, 1)
  }
  const blossoms = [RAMPS.pink[3], RAMPS.gold[4], RAMPS.purple[3]]
  for (let i = 0; i < count * 0.7; i++) {
    const x = Math.floor(rand() * terrain.w)
    const flower = rand() < 0.25
    const pick = blossoms[Math.floor(rand() * blossoms.length)]!
    if (onPad(x) || x < from || x >= to) continue
    const top = Math.round(terrain.groundAt(x + 0.5))
    k.fillStyle = t.turf[2]
    k.fillRect(x, top - 1, 1, 1)
    if (flower) {
      k.fillRect(x, top - 2, 1, 1)
      k.fillStyle = pick
      k.fillRect(x - 1, top - 3, 3, 1)
      k.fillRect(x, top - 4, 1, 3)
      k.fillStyle = RAMPS.gold[4]
      k.fillRect(x, top - 3, 1, 1)
    } else {
      k.fillStyle = t.turf[4]
      k.fillRect(x - 1, top - 2, 1, 1)
      k.fillRect(x + 1, top - 3, 1, 1)
      k.fillStyle = t.turf[3]
      k.fillRect(x + 1, top - 2, 1, 1)
    }
  }
  for (const pad of terrain.pads)
    if (pad.x1 >= from && pad.x0 <= to && !pad.live) paintPad(k, pad)
}

/** A pad: tilled soil in a bevelled planter (a seed bed), a sunflower bed, or the shed's boards. */
export function paintPad(k: CanvasRenderingContext2D, pad: Pad) {
  const w = pad.x1 - pad.x0
  const y = pad.y
  if (pad.kind === 'perch') {
    // A plant's perch: a broad leaf (the plant draws its stalk).
    k.fillStyle = INK
    k.fillRect(pad.x0 - 1, y - 2, w + 2, 6)
    k.fillStyle = RAMPS.leaf[3]
    k.fillRect(pad.x0, y - 1, w, 2)
    k.fillStyle = RAMPS.leaf[1]
    k.fillRect(pad.x0 + 1, y + 1, w - 2, 2)
    k.fillStyle = RAMPS.leaf[4]
    k.fillRect(pad.x0 + 2, y - 1, Math.max(1, w - 8), 1)
    return
  }
  k.fillStyle = INK
  k.fillRect(pad.x0 - 1, y - 2, w + 2, 10)
  if (pad.kind === 'drop') {
    // The shed's landing deck: grey boards with a painted crate mark.
    bevel(k, pad.x0, y - 1, w, 8, RAMPS.steel, { depth: 1, outline: null })
    k.fillStyle = RAMPS.steel[1]
    for (let x = pad.x0 + 6; x < pad.x1 - 2; x += 6) k.fillRect(x, y, 1, 6)
    k.fillStyle = RAMPS.gold[3]
    k.fillRect(Math.round((pad.x0 + pad.x1) / 2) - 4, y + 1, 8, 1)
    k.fillRect(Math.round((pad.x0 + pad.x1) / 2) - 4, y + 4, 8, 1)
    return
  }
  k.fillStyle = pad.kind === 'sun' ? RAMPS.gold[1] : RAMPS.earth[1]
  k.fillRect(pad.x0, y - 1, w, 2)
  for (let x = pad.x0 + 1; x < pad.x1 - 1; x += 3) {
    k.fillStyle = pad.kind === 'sun' ? RAMPS.gold[3] : RAMPS.earth[3]
    k.fillRect(x, y - 1, 1, 1)
    k.fillStyle = RAMPS.earth[0]
    k.fillRect(x + 1, y, 1, 1)
  }
  bevel(k, pad.x0, y + 1, w, 6, WOOD, { depth: 1, outline: null })
  k.fillStyle = WOOD[1]
  for (let x = pad.x0 + 7; x < pad.x1 - 3; x += 8) k.fillRect(x, y + 2, 1, 4)
  if (pad.kind === 'seed')
    for (const px of [pad.x0 - 1, pad.x1 - 1])
      bevel(k, px, y - 7, 2, 7, RAMPS.steel, { depth: 1 })
}

/** Each bed's beacon colour, by multiplier. */
export const PAD_RAMP: Record<number, Ramp> = {
  1: RAMPS.teal,
  2: RAMPS.sky,
  3: RAMPS.gold,
  4: RAMPS.pink,
  5: RAMPS.purple,
}

/** Live pad dressing: beacons on unplanted beds, the multiplier, sunflowers swaying. */
export function drawPadLive(
  g: CanvasRenderingContext2D,
  pad: Pad,
  tick: number,
  i: number,
  goal: boolean,
) {
  if (pad.live) paintPad(g, pad)
  if (pad.kind === 'sun') {
    const n = Math.max(1, Math.floor((pad.x1 - pad.x0) / 14))
    for (let k = 0; k < n; k++) {
      const x = pad.x0 + ((k + 0.5) * (pad.x1 - pad.x0)) / n
      drawSunflower(g, x, pad.y - 1, tick + k * 17 + i * 31, 0.9)
    }
    return
  }
  if (pad.kind === 'drop') {
    const sway = Math.sin(tick / 20 + i) > 0 ? 1 : 0
    drawSprite(g, SHED_FLAG, pad.x1 - 3 + sway * 0, pad.y - 2, {
      anchor: 'feet',
    })
    return
  }
  if (pad.planted || !goal) return
  const ramp = PAD_RAMP[pad.mult] ?? RAMPS.teal
  const pulse = 0.5 + 0.5 * Math.sin(tick / 9 + i * 2.1)
  for (const bx of [pad.x0, pad.x1]) {
    const by = pad.y - 9
    glow(g, bx, by, 7 + pulse * 5, ramp[3], 0.35 + pulse * 0.35)
    g.fillStyle = INK
    g.fillRect(bx - 2, by - 2, 4, 4)
    g.fillStyle = pulse > 0.5 ? ramp[3] : ramp[2]
    g.fillRect(bx - 1, by - 1, 2, 2)
    g.fillStyle = ramp[4]
    g.fillRect(bx - 1, by - 1, 1, 1)
  }
  if (pad.mult > 1)
    drawText(g, `X${pad.mult}`, (pad.x0 + pad.x1) / 2, pad.y + 10, {
      align: 'center',
      color: ramp[3],
      outline: INK,
    })
}

const SHED_FLAG = pixelSprite(
  ['GGGs', 'GgGs', 'GGGs', '...s', '...s', '...s', '...s'],
  { G: RAMPS.gold[3], g: RAMPS.gold[2], s: RAMPS.steel[3] },
)

const SUNFLOWER_HEAD = pixelSprite(
  ['..yYy..', '.YyYyY.', 'yYbbbYy', 'Ybbcbby', 'yYbbbYy', '.YyYyY.', '..yYy..'],
  { Y: RAMPS.gold[3], y: RAMPS.gold[2], b: RAMPS.earth[1], c: RAMPS.earth[3] },
)

/** A sunflower: stalk, two leaves, a head that turns to sway. */
export function drawSunflower(
  g: CanvasRenderingContext2D,
  x: number,
  base: number,
  tick: number,
  scale = 1,
) {
  const h = Math.round(16 * scale)
  const sway = Math.round(Math.sin(tick / 28) * 1.4)
  g.fillStyle = INK
  g.fillRect(Math.round(x) - 1, base - h, 3, h)
  g.fillStyle = RAMPS.leaf[2]
  g.fillRect(Math.round(x), base - h, 1, h)
  g.fillStyle = RAMPS.leaf[3]
  g.fillRect(Math.round(x) - 3, base - Math.round(h * 0.45), 3, 2)
  g.fillRect(Math.round(x) + 1, base - Math.round(h * 0.65), 3, 2)
  drawSprite(g, SUNFLOWER_HEAD, x + sway, base - h - 3)
}

// --- blooms -------------------------------------------------------------------------------------

/** A planted seed grows: sprout, bud, then a full bloom (swaying in two frames). */
function flowerSprites(ramp: Ramp): {
  sprout: PixelSprite
  bud: PixelSprite
  bloom: readonly [PixelSprite, PixelSprite]
} {
  const leaves = {
    L: RAMPS.leaf[3],
    l: RAMPS.leaf[2],
    d: RAMPS.leaf[1],
    s: RAMPS.leaf[2],
  }
  const petals = {
    h: ramp[4],
    P: ramp[3],
    p: ramp[2],
    q: ramp[1],
    c: RAMPS.gold[2],
    Y: RAMPS.gold[4],
  }
  const sprout = pixelSprite(
    ['LL...LL', 'lLl.lLl', '.dlsld.', '...s...', '...s...'],
    leaves,
  )
  const bud = pixelSprite(
    [
      '...hP...',
      '..hPPp..',
      '..PPpq..',
      '...pq...',
      '...s....',
      '.Lls....',
      'Llds.lL.',
      '...sllL.',
      '...s....',
    ],
    { ...leaves, ...petals },
  )
  const bloom = pixelSprite(
    [
      '..hh.hP..',
      '.hPPhPPp.',
      'hPPcYcPPp',
      'PPpYYYpPq',
      'hPPcYcPpq',
      '.PPpPPpq.',
      '..pq.qq..',
      '....s....',
      '.Ll.s....',
      'Lllss....',
      '.dds..lL.',
      '....sllL.',
      '....sdd..',
      '....s....',
    ],
    { ...leaves, ...petals },
  )
  return { sprout, bud, bloom: [bloom, mirrorSprite(bloom)] }
}

export const BLOOM_COLOURS = [
  '#f9a8d4',
  '#fde047',
  '#c4b5fd',
  '#fdba74',
] as const
const FLOWERS: Record<string, ReturnType<typeof flowerSprites>> = {
  '#f9a8d4': flowerSprites(RAMPS.pink),
  '#fde047': flowerSprites(RAMPS.gold),
  '#c4b5fd': flowerSprites(RAMPS.purple),
  '#fdba74': flowerSprites(RAMPS.rust),
}
export const FLOWER_SPARKS: Record<string, readonly string[]> = {
  '#f9a8d4': [RAMPS.pink[3], RAMPS.pink[4], RAMPS.gold[4]],
  '#fde047': [RAMPS.gold[3], RAMPS.gold[4], RAMPS.leaf[4]],
  '#c4b5fd': [RAMPS.purple[3], RAMPS.purple[4], RAMPS.teal[3]],
  '#fdba74': [RAMPS.rust[3], RAMPS.rust[4], RAMPS.gold[4]],
}

/** A planted bloom `age` ticks after planting. */
export function drawBloom(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  colour: string,
  age: number,
  tick: number,
) {
  const art = FLOWERS[colour] ?? FLOWERS['#f9a8d4']!
  glow(g, x, y - 8, 16, RAMPS.gold[3], 0.3 + 0.1 * Math.sin(tick / 7))
  dropShadow(g, x + 1, y, 5, 1.5, 0.35)
  const sprite =
    age < 24
      ? art.sprout
      : age < 52
        ? art.bud
        : art.bloom[Math.floor(tick / 20) % 2]!
  drawSprite(g, sprite, x, y, { anchor: 'feet' })
}

// --- cargo, vents -------------------------------------------------------------------------------

const CRATE = pixelSprite(
  [
    'WWWWWWWWW',
    'WwwwwwwwW',
    'WwsWWWswW',
    'WwWsWsWwW',
    'WwWWsWWwW',
    'WwWsWsWwW',
    'WwsWWWswW',
    'WwwwwwwwW',
    'WWWWWWWWW',
  ],
  { W: WOOD[3], w: WOOD[2], s: RAMPS.leaf[3] },
)

/** Towed or waiting cargo, with its line up to the pod when hooked. */
export function drawCargo(
  g: CanvasRenderingContext2D,
  cargo: Cargo,
  pod: Pod | null,
  tick: number,
) {
  if (pod) {
    const w = winchPoint(pod)
    g.strokeStyle = INK
    g.lineWidth = 2
    g.beginPath()
    g.moveTo(w.x, w.y)
    g.lineTo(cargo.x, cargo.y - cargo.r)
    g.stroke()
    g.strokeStyle = RAMPS.cream[3]
    g.lineWidth = 0.8
    g.stroke()
  }
  if (cargo.hookedBy < 0 && !cargo.delivered && cargo.resting && !pod) {
    // A waiting crate glints so it can be found.
    if (tick % 50 < 8) glow(g, cargo.x, cargo.y, 10, RAMPS.gold[3], 0.5)
  }
  dropShadow(g, cargo.x, cargo.y + cargo.r + 1, cargo.r, 1.2, 0.35)
  drawSprite(g, CRATE, cargo.x, cargo.y)
  for (let i = 0; i < cargo.seedlings; i++) {
    g.fillStyle = INK
    g.fillRect(
      Math.round(cargo.x) - 4 + i * 3,
      Math.round(cargo.y - cargo.r) - 3,
      2,
      3,
    )
    g.fillStyle = RAMPS.leaf[3]
    g.fillRect(
      Math.round(cargo.x) - 4 + i * 3,
      Math.round(cargo.y - cargo.r) - 3,
      1,
      2,
    )
  }
}

/** An updraft vent: a stone ring in the ground and leaves spiralling up its column. */
export function drawVent(
  g: CanvasRenderingContext2D,
  vent: VentSpec,
  ground: number,
  tick: number,
) {
  const top = ground - vent.h
  g.fillStyle = rgba(RAMPS.sky[4], 0.08)
  g.fillRect(vent.x - vent.w / 2, top, vent.w, vent.h)
  for (let i = 0; i < 7; i++) {
    const rise = ((tick * 0.9 + i * (vent.h / 7)) % vent.h) | 0
    const y = ground - rise
    const x = vent.x + Math.sin((tick + i * 40) / 9) * (vent.w / 2 - 2)
    const c = i % 2 ? RAMPS.leaf[3] : RAMPS.gold[3]
    g.fillStyle = INK
    g.fillRect(Math.round(x) - 1, y - 1, 3, 2)
    g.fillStyle = c
    g.fillRect(Math.round(x), y - 1, 2, 1)
  }
  bevel(g, vent.x - vent.w / 2 - 2, ground - 3, vent.w + 4, 4, RAMPS.steel, {
    depth: 1,
  })
  g.fillStyle = RAMPS.night[1]
  g.fillRect(vent.x - vent.w / 2 + 1, ground - 2, vent.w - 2, 1)
}

// --- the pod ------------------------------------------------------------------------------------

/**
 * The seed pod: an acorn with a leafy cap and legs, leaning (shaded vector art turned against the
 * lean so the light stays upper left), its jet of sunlight while it puffs, its cap open as a
 * parachute when the tank is dry. `sink` (0..1) shrinks it into the soil after a planting.
 */
export function drawPod(
  g: CanvasRenderingContext2D,
  pod: Pod,
  tick: number,
  sink = 1,
  tint?: Ramp,
) {
  if (sink <= 0) return
  const flicker = Math.abs(Math.sin(tick * 0.9)) + (tick % 2) * 0.5
  const body = tint ?? RAMPS.earth
  const lx = -0.7 * Math.cos(pod.tilt) - 0.7 * Math.sin(pod.tilt)
  const ly = 0.7 * Math.sin(pod.tilt) - 0.7 * Math.cos(pod.tilt)
  const oval = (x: number, y: number, rx: number, ry: number) => {
    g.beginPath()
    g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
    g.fill()
  }
  const dome = (x: number, y: number, rx: number, ry: number) => {
    g.beginPath()
    g.ellipse(x, y, rx, ry, 0, Math.PI, 0)
    g.closePath()
    g.fill()
  }
  if (pod.puffing) {
    const jx = pod.x - Math.sin(pod.tilt) * (POD_FEET + 5)
    const jy = pod.y + Math.cos(pod.tilt) * (POD_FEET + 5)
    glow(g, jx, jy, 13 + flicker * 3, RAMPS.gold[3], 0.6)
  }
  g.save()
  g.translate(pod.x, pod.y)
  g.rotate(pod.tilt)
  g.translate(0, POD_FEET)
  g.scale(sink, sink)
  g.translate(0, -POD_FEET)
  if (pod.chute) {
    // The leaf cap opened wide as a parachute, on four strings.
    g.strokeStyle = RAMPS.cream[3]
    g.lineWidth = 0.6
    g.beginPath()
    for (const sx of [-12, -5, 5, 12]) {
      g.moveTo(sx, -16)
      g.lineTo(sx > 0 ? 4 : -4, -4)
    }
    g.stroke()
    g.fillStyle = INK
    dome(0, -15, 15, 8)
    g.fillStyle = RAMPS.leaf[2]
    dome(0, -15.5, 13.5, 6.8)
    g.fillStyle = RAMPS.leaf[3]
    dome(-3, -17, 7, 3.2)
  }
  if (pod.puffing) {
    const len = 9 + flicker * 4
    const jet = (half: number, reach: number, colour: string) => {
      g.fillStyle = colour
      g.beginPath()
      g.moveTo(-half, 6)
      g.lineTo(half, 6)
      g.lineTo(0, 6 + reach)
      g.closePath()
      g.fill()
    }
    g.save()
    g.globalCompositeOperation = 'lighter'
    jet(3.5, len, rgba(RAMPS.ember[2], 0.85))
    g.restore()
    jet(2.4, len * 0.72, RAMPS.gold[3])
    jet(1.2, len * 0.4, '#ffffff')
  }
  g.strokeStyle = INK
  g.lineWidth = 2.2
  g.beginPath()
  g.moveTo(-3.5, 2)
  g.lineTo(-6.5, 6)
  g.moveTo(3.5, 2)
  g.lineTo(6.5, 6)
  g.stroke()
  g.strokeStyle = RAMPS.steel[2]
  g.lineWidth = 0.9
  g.stroke()
  g.fillStyle = INK
  g.fillRect(-9, 5, 5, 2.2)
  g.fillRect(4, 5, 5, 2.2)
  g.fillStyle = RAMPS.steel[3]
  g.fillRect(-8.5, 5.4, 4, 1)
  g.fillRect(4.5, 5.4, 4, 1)
  g.fillStyle = INK
  oval(0, 0.3, 6.2, 7.2)
  g.fillStyle = body[1]
  oval(0, 0, 5.2, 6.2)
  g.fillStyle = body[2]
  oval(lx * 0.9, ly * 0.9, 4.2, 5)
  g.fillStyle = body[3]
  oval(lx * 2, ly * 2, 2.4, 3)
  g.fillStyle = body[4]
  oval(lx * 3, ly * 3, 0.9, 1.3)
  g.fillStyle = INK
  g.fillRect(-3, -1, 1.6, 2.2)
  g.fillRect(1.4, -1, 1.6, 2.2)
  g.fillStyle = '#ffffff'
  g.fillRect(-3, -1, 0.8, 0.8)
  g.fillRect(1.4, -1, 0.8, 0.8)
  g.fillStyle = rgba(RAMPS.pink[2], 0.75)
  g.fillRect(-4.6, 1.8, 1.8, 1)
  g.fillRect(2.8, 1.8, 1.8, 1)
  if (!pod.chute) {
    g.fillStyle = INK
    dome(0, -3, 7.4, 5)
    g.fillRect(-7.4, -3.4, 14.8, 2.2)
    g.fillStyle = RAMPS.leaf[1]
    dome(0, -3.2, 6.4, 4)
    g.fillStyle = RAMPS.leaf[2]
    dome(lx * 0.8, -3.4 + Math.min(0, ly) * 0.6, 5, 3.2)
    g.fillStyle = RAMPS.leaf[3]
    dome(lx * 1.8 - 1, -4, 2.4, 1.6)
    g.fillStyle = RAMPS.leaf[1]
    for (const [cx, cy] of [
      [-3.5, -4.2],
      [0, -5.6],
      [3.2, -4.4],
      [-1.6, -4.4],
      [1.8, -4.2],
    ] as const)
      g.fillRect(cx, cy, 1, 1)
    g.fillStyle = RAMPS.leaf[0]
    g.fillRect(-6.4, -2.6, 12.8, 1)
    g.fillStyle = RAMPS.leaf[3]
    g.fillRect(-6, -3.4, 11, 0.8)
    g.fillStyle = INK
    g.fillRect(-1.6, -10, 3.2, 4)
    g.beginPath()
    g.ellipse(3, -9.5, 3, 1.8, -0.5, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = RAMPS.leaf[2]
    g.fillRect(-0.8, -9.2, 1.6, 3)
    g.fillStyle = RAMPS.leaf[3]
    g.beginPath()
    g.ellipse(3, -9.5, 2, 1, -0.5, 0, Math.PI * 2)
    g.fill()
  }
  g.restore()
}

/** The spare-pod icon for the HUD. */
export const POD_ICON = pixelSprite(
  ['.LLL.', 'LllLd', 'dddd.', 'EeeeE', 'EeEeE', '.EEE.'],
  {
    L: RAMPS.leaf[3],
    l: RAMPS.leaf[2],
    d: RAMPS.leaf[1],
    E: RAMPS.earth[1],
    e: RAMPS.earth[3],
  },
)
