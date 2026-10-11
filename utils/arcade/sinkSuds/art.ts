// /utils/arcade/sinkSuds/art.ts
//
// Sink Suds' 16-bit art (conductor kr-arcade/t-043), built on utils/arcade/snes.ts: the sprites,
// the basins drawn from their shapes, the grime mask, and the bubble whose face grows up with it.
// Cosmetic randomness here only ever uses backdropRng, so the game's seeded rng is untouched.

import {
  INK,
  RAMPS,
  backdropRng,
  bevel,
  cachedLayer,
  drawSprite,
  glow,
  mix,
  pixelSprite,
  rgba,
  shadedOrb,
} from '../snes'
import type { Ramp } from '../snes'
import { dialAt, laneDir, W, H } from './basins'
import type { BasinDef, BasinLook, Prim } from './basins'
import { CELL } from './grime'
import type { Grime } from './grime'

// --- sprites ------------------------------------------------------------------------------------

const MITE_PALETTE = {
  r: RAMPS.rust[1],
  o: RAMPS.rust[2],
  y: RAMPS.rust[3],
  h: RAMPS.rust[4],
  w: '#ffffff',
  k: INK,
  l: RAMPS.rust[0],
}
const MITE_BODY = [
  '..rrrrr...',
  '.rooyyhr..',
  'rooooyywwr',
  'rooooooowk',
  'roooooooor',
  '.rrooooorr',
  '..rrrrrr..',
]
export const MITE_SPRITES = [
  pixelSprite([...MITE_BODY, '.l..l..l..', 'l..l..l...'], MITE_PALETTE),
  pixelSprite([...MITE_BODY, '..l..l..l.', '...l..l..l'], MITE_PALETTE),
] as const

export const BRUSH_SPRITE = pixelSprite(
  [
    '..hhhhhhhhhhhhhhhh..',
    '.hTTTTTTTTTTTTTTTTt.',
    '.TTkkkTTTTTTTTkkkTt.',
    '.TTTwkTTTTTTTTwkTTt.',
    '.tTTTTTTTkkTTTTTTtt.',
    '..tttttttttttttttt..',
    '..gGgGgGgGgGgGgGgG..',
    '..GgGgGgGgGgGgGgGg..',
    '..d.d.d.d.d.d.d.d...',
  ],
  {
    h: RAMPS.teal[4],
    T: RAMPS.teal[2],
    t: RAMPS.teal[1],
    k: INK,
    w: '#ffffff',
    g: RAMPS.gold[2],
    G: RAMPS.gold[3],
    d: RAMPS.gold[1],
  },
)

/** The brush tipped on its back: bristles up, eyes spinning. */
export const BRUSH_TIPPED = pixelSprite(
  [
    '..d.d.d.d.d.d.d.d...',
    '..GgGgGgGgGgGgGgGg..',
    '..gGgGgGgGgGgGgGgG..',
    '..tttttttttttttttt..',
    '.tTTTTTTTkkTTTTTTtt.',
    '.TTwTwTTTTTTTTwTwTt.',
    '.TTTwTTTTTTTTTTwTTt.',
    '.hTTTTTTTTTTTTTTTTt.',
    '..hhhhhhhhhhhhhhhh..',
  ],
  {
    h: RAMPS.teal[4],
    T: RAMPS.teal[2],
    t: RAMPS.teal[1],
    k: INK,
    w: '#ffffff',
    g: RAMPS.gold[2],
    G: RAMPS.gold[3],
    d: RAMPS.gold[1],
  },
)

const SPONGE_PALETTE = {
  L: RAMPS.leaf[3],
  l: RAMPS.leaf[2],
  e: RAMPS.leaf[1],
  Y: RAMPS.gold[3],
  y: RAMPS.gold[2],
  d: RAMPS.gold[1],
  w: '#ffffff',
  k: INK,
  m: RAMPS.pink[2],
}
const SPONGE_TOP = ['LLLLLLLLLLLLLL', 'llllllllllllle']
export const SPONGE_SPRITES = [
  pixelSprite(
    [
      ...SPONGE_TOP,
      'YYYYYYYYYYYYYY',
      'YyYwkYYYYwkYyY',
      'YYYkkYYYYkkYYY',
      'YyYYYYyYYYYyYy',
      'yYYYYmmmmYYYYy',
      'yyYyYYYYYYyYyy',
      '.dddddddddddd.',
    ],
    SPONGE_PALETTE,
  ),
  pixelSprite(
    [
      ...SPONGE_TOP,
      'YYYYYYYYYYYYYY',
      'YyYkwYYYYkwYyY',
      'YYYkkYYYYkkYYY',
      'YyYYYYyYYYYyYy',
      'yYYYYYmmYYYYYy',
      'yyYyYYYYYYyYyy',
      '.dddddddddddd.',
    ],
    SPONGE_PALETTE,
  ),
] as const

const GREMLIN_PALETTE = {
  P: mix(RAMPS.leaf[2], RAMPS.earth[2], 0.45),
  p: mix(RAMPS.leaf[1], RAMPS.earth[1], 0.5),
  h: mix(RAMPS.leaf[3], RAMPS.cream[3], 0.3),
  w: '#ffffff',
  k: INK,
  Y: RAMPS.gold[3],
  m: RAMPS.ember[1],
}
export const GREMLIN_SPRITES = [
  pixelSprite(
    [
      '....pppp....',
      '..pPhhPPPp..',
      '.pPhPPPPPPp.',
      'pPPwwPPwwPPp',
      'pPwkYPPwkYPp',
      'pPPYYPPYYPPp',
      'pPPPPPPPPPPp',
      '.pPPmmmmPPp.',
      '.ppPPPPPPpp.',
      'p.p.pp.pp.p.',
    ],
    GREMLIN_PALETTE,
  ),
  pixelSprite(
    [
      '....pppp....',
      '..pPhhPPPp..',
      '.pPhPPPPPPp.',
      'pPPwwPPwwPPp',
      'pPPwkYPwkYPp',
      'pPPYYPPYYPPp',
      'pPPPPPPPPPPp',
      '.pPPPmmPPPp.',
      '.ppPPPPPPpp.',
      '.p.pp.pp.p..',
    ],
    GREMLIN_PALETTE,
  ),
] as const

export const CRUMB_SPRITE = pixelSprite(['.GY.', 'GYGg', 'gGgd', '.dd.'], {
  Y: RAMPS.gold[4],
  G: RAMPS.gold[3],
  g: RAMPS.gold[2],
  d: RAMPS.gold[1],
})

export const CEREAL_SPRITE = pixelSprite(['.PPp.', 'P...p', 'p...d', '.pdd.'], {
  P: RAMPS.pink[3],
  p: RAMPS.pink[2],
  d: RAMPS.pink[1],
})

export const DRIP_SPRITE = pixelSprite(
  ['.w.', '.W.', 'WwW', 'WWd', '.d.'],
  { w: RAMPS.water[4], W: RAMPS.water[3], d: RAMPS.water[2] },
  { outline: RAMPS.water[0] },
)

const SOAP_SPRITE = pixelSprite(
  [
    '....ss.....',
    '..ssss.....',
    '....ss.....',
    '...tttt....',
    '...tttt....',
    '.hPPPPPPp..',
    'hPPPPPPPpd.',
    'hPwwwwwPpd.',
    'hPwcwcwPpd.',
    'hPwwcwwPpd.',
    'hPPPPPPPpd.',
    'hPPPPPPPpd.',
    '.pppppppd..',
  ],
  {
    s: RAMPS.steel[3],
    t: RAMPS.teal[2],
    h: RAMPS.pink[4],
    P: RAMPS.pink[2],
    p: RAMPS.pink[1],
    d: RAMPS.pink[0],
    w: RAMPS.cream[3],
    c: RAMPS.teal[3],
  },
)

const PLANT_SPRITE = pixelSprite(
  [
    '.....LL......',
    '..LL.LlL.LL..',
    '.LllLLllLllL.',
    '.Llllllllld..',
    '..dllllllld..',
    '...dlldlld...',
    '....ddddd....',
    '..RRRRRRRRR..',
    '..rrrrrrrrq..',
    '...rrrrrrq...',
    '...rrrrrrq...',
    '....qqqqq....',
  ],
  {
    L: RAMPS.leaf[3],
    l: RAMPS.leaf[2],
    d: RAMPS.leaf[1],
    R: RAMPS.rust[3],
    r: RAMPS.rust[2],
    q: RAMPS.rust[1],
  },
)

const MUG_SPRITE = pixelSprite(
  [
    '.hhhhhhh...',
    'hTTTTTTTt..',
    'hTkTTTkTtTT',
    'hTTTTTTTt.T',
    'hTTkkkTTtTT',
    'hTTTTTTTt..',
    '.ttttttt...',
  ],
  { h: RAMPS.teal[4], T: RAMPS.teal[2], t: RAMPS.teal[1], k: INK },
)

const SPONGE_PROP = pixelSprite(
  [
    'LLLLLLLLLLLL',
    'llllllllllld',
    'GGGGGGGGGGGG',
    'GgGgggGgggGd',
    'gggdgggggdgd',
    '.dddddddddd.',
  ],
  {
    L: RAMPS.leaf[3],
    l: RAMPS.leaf[2],
    d: RAMPS.gold[1],
    G: RAMPS.gold[3],
    g: RAMPS.gold[2],
  },
)

const FISH_SPRITE = pixelSprite(
  ['..oo....', '.oOOo.o.', 'oOwkOooo', 'oOOOOoo.', '.oOOo.o.', '..oo....'],
  { o: RAMPS.rust[2], O: RAMPS.gold[3], w: '#ffffff', k: INK },
)

// --- palettes per look --------------------------------------------------------------------------

type LookStyle = {
  rim: Ramp
  floor: readonly [string, string]
  water: string
  waterAlpha: number
  grime: readonly string[]
  speck: string
}

const LOOKS: Record<BasinLook, LookStyle> = {
  steel: {
    rim: RAMPS.steel,
    floor: [RAMPS.steel[2], '#dfe7f5'],
    water: RAMPS.water[2],
    waterAlpha: 0.16,
    grime: ['#6b5a34', '#7a6a3e', '#5e4f2c'],
    speck: '#3a2c18',
  },
  enamel: {
    rim: RAMPS.cream,
    floor: [mix(RAMPS.cream[2], RAMPS.sky[3], 0.25), '#ffffff'],
    water: RAMPS.sky[3],
    waterAlpha: 0.2,
    grime: ['#8a7a6a', '#9a8878', '#7a6a5c'],
    speck: '#4a3c30',
  },
  drum: {
    rim: RAMPS.steel,
    floor: [RAMPS.steel[1], RAMPS.steel[3]],
    water: RAMPS.water[2],
    waterAlpha: 0.22,
    grime: ['#7a7488', '#8a8498', '#6a6478'],
    speck: '#3a3448',
  },
  glass: {
    rim: RAMPS.earth,
    floor: [RAMPS.water[1], RAMPS.water[3]],
    water: RAMPS.water[2],
    waterAlpha: 0,
    grime: ['#3f6b2a', '#4c7a30', '#335c24'],
    speck: '#1d3a14',
  },
  bay: {
    rim: RAMPS.gold,
    floor: [RAMPS.night[2], RAMPS.steel[1]],
    water: RAMPS.water[2],
    waterAlpha: 0.14,
    grime: ['#5a4030', '#6a4c38', '#4a3426'],
    speck: '#24160e',
  },
}

// --- paths --------------------------------------------------------------------------------------

function primPath(g: CanvasRenderingContext2D, p: Prim, grow: number) {
  if (p.kind === 'ellipse') {
    g.ellipse(p.cx, p.cy, p.rx + grow, p.ry + grow, 0, 0, Math.PI * 2)
    return
  }
  const x = p.x - grow
  const y = p.y - grow
  const w = p.w + grow * 2
  const h = p.h + grow * 2
  const r = Math.max(0, Math.min(p.r + grow, w / 2, h / 2))
  g.moveTo(x + r, y)
  g.lineTo(x + w - r, y)
  g.arc(x + w - r, y + r, r, -Math.PI / 2, 0)
  g.lineTo(x + w, y + h - r)
  g.arc(x + w - r, y + h - r, r, 0, Math.PI / 2)
  g.lineTo(x + r, y + h)
  g.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI)
  g.lineTo(x, y + r)
  g.arc(x + r, y + r, r, Math.PI, Math.PI * 1.5)
  g.closePath()
}

function fillPrims(
  g: CanvasRenderingContext2D,
  b: BasinDef,
  grow: number,
  colour: string,
  dx = 0,
  dy = 0,
) {
  g.fillStyle = colour
  g.save()
  g.translate(dx, dy)
  g.beginPath()
  for (const p of b.prims) primPath(g, p, grow)
  g.fill()
  g.restore()
}

/** Clip to the water of the basin. */
export function clipBasin(g: CanvasRenderingContext2D, b: BasinDef) {
  g.beginPath()
  for (const p of b.prims) primPath(g, p, 0)
  g.clip()
}

// --- the room behind the basin ------------------------------------------------------------------

const TILE = 24
const TILE_DARK = [
  '#120a33',
  '#24124f',
  '#3a2479',
  '#5b3fb0',
  '#8f7be0',
] as const

/** The kitchen backsplash and counter clutter, kept clear of this basin's rim. */
export function renderKitchen(g: CanvasRenderingContext2D, b: BasinDef) {
  cachedLayer(g, `sink-suds-kitchen-${b.id}`, W, H, (k) => {
    k.fillStyle = RAMPS.night[1]
    k.fillRect(0, 0, W, H)
    for (let y = 0; y < H; y += TILE) {
      for (let x = 0; x < W; x += TILE) {
        const ramp = ((x + y) / TILE) % 2 ? RAMPS.purple : TILE_DARK
        bevel(k, x + 1, y + 1, TILE - 2, TILE - 2, ramp, {
          depth: 2,
          outline: null,
        })
        k.fillStyle = rgba(RAMPS.purple[4], 0.35)
        for (let i = 0; i < 6; i++) k.fillRect(x + 4 + i, y + 9 - i, 2, 1)
      }
    }
    const props = [
      { s: SOAP_SPRITE, x: 34, y: 78 },
      { s: PLANT_SPRITE, x: W - 36, y: 80 },
      { s: MUG_SPRITE, x: 30, y: H - 30 },
      { s: SPONGE_PROP, x: W - 32, y: H - 30 },
    ]
    for (const p of props) {
      const clear = propClear(b, p.x, p.y)
      if (clear) drawSprite(k, p.s, p.x, p.y, { anchor: 'feet', scale: 2 })
    }
  })
}

/** Is a 28 px counter prop standing at (x, y) (its feet) clear of the basin's rim? */
export function propClear(b: BasinDef, x: number, y: number): boolean {
  return b.prims.every((q) => {
    if (q.kind === 'ellipse') {
      const dx = (x - q.cx) / (q.rx + 16)
      const dy = (y - 12 - q.cy) / (q.ry + 16)
      return dx * dx + dy * dy > 1
    }
    return (
      x + 14 < q.x - 14 ||
      x - 14 > q.x + q.w + 14 ||
      y < q.y - 14 ||
      y - 28 > q.y + q.h + 14
    )
  })
}

// --- the basin ----------------------------------------------------------------------------------

const CAUSTICS = (() => {
  const rand = backdropRng(11)
  return Array.from({ length: 30 }, () => ({
    x: rand(),
    y: rand(),
    w: 4 + Math.round(rand() * 6),
    phase: rand() * Math.PI * 2,
  }))
})()

const PLANTS = (() => {
  const rand = backdropRng(41)
  return Array.from({ length: 7 }, (_, i) => ({
    x: 50 + i * 52 + Math.round(rand() * 20),
    h: 26 + Math.round(rand() * 34),
    phase: rand() * Math.PI * 2,
    tone: rand() < 0.5 ? RAMPS.leaf : RAMPS.teal,
  }))
})()

const PEBBLES = (() => {
  const rand = backdropRng(43)
  return Array.from({ length: 150 }, () => ({
    x: rand(),
    y: rand(),
    c: Math.floor(rand() * 4),
  }))
})()

/** The basin: rim, floor, water, and whatever its look adds (drum holes, belts, gravel). */
export function renderBasin(
  g: CanvasRenderingContext2D,
  b: BasinDef,
  tick: number,
  drumAngle: number,
) {
  const look = LOOKS[b.look]
  const rim = look.rim
  // The rim, every shape at once so a union reads as one basin.
  fillPrims(g, b, 12, INK)
  fillPrims(g, b, 10, rim[1])
  fillPrims(g, b, 9, rim[3], -1, -1)
  fillPrims(g, b, 8, rim[2])
  fillPrims(g, b, 6, rim[3], -1, -1)
  fillPrims(g, b, 5, rim[2])
  fillPrims(g, b, 2, rim[0])
  if (b.look === 'glass') {
    renderTank(g, b, tick)
    return
  }
  // The floor, shaded in bands toward the light.
  const bands = 6
  for (const p of b.prims) {
    if (p.kind === 'rect' && p.joint) continue
    for (let i = 0; i < bands; i++) {
      const t = i / bands
      g.fillStyle = mix(look.floor[0], look.floor[1], i / (bands - 1))
      g.beginPath()
      if (p.kind === 'ellipse') {
        g.ellipse(
          p.cx - t * 24,
          p.cy - t * 30,
          p.rx * (1 - t * 0.6),
          p.ry * (1 - t * 0.6),
          0,
          0,
          Math.PI * 2,
        )
      } else {
        const k = 1 - t * 0.55
        const w = p.w * k
        const h = p.h * k
        primPath(
          g,
          {
            kind: 'rect',
            x: p.x + (p.w - w) / 2 - t * 18,
            y: p.y + (p.h - h) / 2 - t * 22,
            w,
            h,
            r: Math.min(p.r, w / 2, h / 2),
          },
          0,
        )
      }
      g.fill()
    }
  }
  for (const o of b.openings ?? []) {
    // The overflow gap: floor straight through, lips cut back on either side.
    g.fillStyle = mix(look.floor[0], look.floor[1], 0.35)
    g.fillRect(o.x, o.y, o.w, o.h)
    g.fillStyle = rim[0]
    g.fillRect(o.x, o.y, o.w, 2)
    g.fillStyle = mix(look.floor[0], look.floor[1], 0.6)
    g.fillRect(o.x, o.y + o.h - 2, o.w, 2)
  }
  g.save()
  clipBasin(g, b)
  if (b.look === 'drum') renderDrumHoles(g, b, drumAngle)
  if (b.look === 'bay') renderBelts(g, b, tick)
  // A skin of water with light dancing on it.
  const box = bounds(b)
  g.fillStyle = rgba(look.water, look.waterAlpha)
  g.fillRect(box.x0, box.y0, box.x1 - box.x0, box.y1 - box.y0)
  g.fillStyle = rgba(RAMPS.water[4], 0.4)
  for (const c of CAUSTICS) {
    const sway = Math.sin(tick / 40 + c.phase)
    g.fillRect(
      Math.round(box.x0 + c.x * (box.x1 - box.x0) + sway * 6),
      Math.round(box.y0 + c.y * (box.y1 - box.y0)),
      Math.round(c.w + sway * 2),
      1,
    )
  }
  g.restore()
  if (b.physics.kind === 'current') renderCurrent(g, b, tick)
}

function bounds(b: BasinDef) {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const p of b.prims) {
    if (p.kind === 'ellipse') {
      x0 = Math.min(x0, p.cx - p.rx)
      y0 = Math.min(y0, p.cy - p.ry)
      x1 = Math.max(x1, p.cx + p.rx)
      y1 = Math.max(y1, p.cy + p.ry)
    } else {
      x0 = Math.min(x0, p.x)
      y0 = Math.min(y0, p.y)
      x1 = Math.max(x1, p.x + p.w)
      y1 = Math.max(y1, p.y + p.h)
    }
  }
  return { x0, y0, x1, y1 }
}

function renderDrumHoles(
  g: CanvasRenderingContext2D,
  b: BasinDef,
  angle: number,
) {
  if (b.physics.kind !== 'spin') return
  const { cx, cy, r } = b.physics
  for (let ring = 1; ring <= 5; ring++) {
    const rr = (r * ring) / 5.6
    const count = ring * 7
    for (let i = 0; i < count; i++) {
      const a = angle + (i / count) * Math.PI * 2 + ring * 0.3
      const x = Math.round(cx + Math.cos(a) * rr)
      const y = Math.round(cy + Math.sin(a) * rr)
      g.fillStyle = RAMPS.steel[0]
      g.fillRect(x - 1, y - 1, 3, 3)
      g.fillStyle = RAMPS.steel[4]
      g.fillRect(x - 1, y + 2, 3, 1)
    }
  }
  // Three paddles on the drum wall, turning with it.
  for (let i = 0; i < 3; i++) {
    const a = angle + (i * Math.PI * 2) / 3
    const x = cx + Math.cos(a) * (r - 8)
    const y = cy + Math.sin(a) * (r - 8)
    g.save()
    g.translate(x, y)
    g.rotate(a)
    bevel(g, -6, -9, 12, 18, RAMPS.steel, { depth: 2 })
    g.restore()
  }
}

function renderBelts(g: CanvasRenderingContext2D, b: BasinDef, tick: number) {
  const p = b.physics
  if (p.kind !== 'conveyor') return
  const box = bounds(b)
  const laneH = (p.bottom - p.top) / p.lanes
  for (let lane = 0; lane < p.lanes; lane++) {
    const y = p.top + lane * laneH
    const dir = laneDir(p, y + 1)
    g.fillStyle =
      lane % 2 ? RAMPS.night[2] : mix(RAMPS.night[2], RAMPS.steel[1], 0.5)
    g.fillRect(box.x0, y, box.x1 - box.x0, laneH)
    g.fillStyle = RAMPS.steel[1]
    const shift = (((tick * p.speed * 40 * dir) % 24) + 24) % 24
    for (let x = box.x0 - 24 + shift; x < box.x1; x += 24) {
      // A chevron pointing the way the belt runs.
      for (let i = 0; i < 8; i++) {
        const off = dir > 0 ? i : 8 - i
        g.fillRect(Math.round(x + off), Math.round(y + laneH / 2 - 8 + i), 3, 1)
        g.fillRect(Math.round(x + off), Math.round(y + laneH / 2 + 8 - i), 3, 1)
      }
    }
    g.fillStyle = INK
    g.fillRect(box.x0, Math.round(y + laneH) - 1, box.x1 - box.x0, 2)
  }
}

function renderCurrent(g: CanvasRenderingContext2D, b: BasinDef, tick: number) {
  if (b.physics.kind !== 'current') return
  const box = bounds(b)
  g.fillStyle = rgba(RAMPS.water[4], 0.55)
  for (let i = 0; i < 9; i++) {
    const y = box.y0 + 30 + ((box.y1 - box.y0 - 60) * i) / 8
    const span = box.x1 - box.x0 - 120
    const x = box.x0 + 60 + ((tick * 1.1 + i * 53) % span)
    g.fillRect(Math.round(x), Math.round(y), 8, 1)
    g.fillRect(Math.round(x) + 6, Math.round(y) - 1, 3, 1)
  }
}

function renderTank(g: CanvasRenderingContext2D, b: BasinDef, tick: number) {
  const box = bounds(b)
  const floor = b.physics.kind === 'buoyancy' ? b.physics.floor : box.y1 - 16
  g.save()
  clipBasin(g, b)
  // Water in bands, lighter toward the surface.
  const bands = 9
  for (let i = 0; i < bands; i++) {
    g.fillStyle = mix(RAMPS.water[3], RAMPS.water[1], i / (bands - 1))
    const y0 = box.y0 + ((box.y1 - box.y0) * i) / bands
    g.fillRect(
      box.x0,
      Math.floor(y0),
      box.x1 - box.x0,
      Math.ceil((box.y1 - box.y0) / bands) + 1,
    )
  }
  // Light shafts from the surface.
  g.fillStyle = rgba(RAMPS.water[4], 0.08)
  for (let i = 0; i < 4; i++) {
    const x = box.x0 + 40 + i * 90 + Math.sin(tick / 90 + i) * 10
    g.beginPath()
    g.moveTo(x, box.y0)
    g.lineTo(x + 26, box.y0)
    g.lineTo(x + 70, floor)
    g.lineTo(x + 30, floor)
    g.fill()
  }
  // The surface line, rippling.
  g.fillStyle = RAMPS.water[4]
  for (let x = box.x0; x < box.x1; x += 4) {
    const y = box.y0 + 6 + Math.round(Math.sin(x / 14 + tick / 20) * 1.5)
    g.fillRect(x, y, 4, 1)
  }
  // Swaying plants behind the gravel.
  for (const p of PLANTS) {
    for (let s = 0; s < p.h; s += 3) {
      const sway = Math.sin(tick / 50 + p.phase + s / 12) * (s / 10)
      g.fillStyle = s % 6 ? p.tone[2] : p.tone[3]
      g.fillRect(Math.round(p.x + sway), floor - s, 3, 3)
      if (s % 9 === 0)
        g.fillRect(Math.round(p.x + sway) + 3, floor - s - 1, 3, 2)
    }
  }
  // Gravel.
  g.fillStyle = RAMPS.earth[1]
  g.fillRect(box.x0, floor, box.x1 - box.x0, box.y1 - floor)
  const tones = [RAMPS.earth[2], RAMPS.earth[3], RAMPS.cream[2], RAMPS.rust[2]]
  for (const p of PEBBLES) {
    g.fillStyle = tones[p.c]!
    g.fillRect(
      Math.round(box.x0 + p.x * (box.x1 - box.x0)),
      Math.round(floor + 1 + p.y * (box.y1 - floor - 2)),
      2,
      2,
    )
  }
  // A friendly fish going about its day.
  const fx = box.x0 + 30 + ((tick * 0.4) % (box.x1 - box.x0 - 60))
  drawSprite(g, FISH_SPRITE, fx, box.y0 + 60 + Math.sin(tick / 30) * 6, {
    scale: 2,
  })
  g.restore()
  // Glass glints over everything.
  g.fillStyle = rgba('#ffffff', 0.18)
  g.fillRect(box.x0 + 8, box.y0 + 12, 3, box.y1 - box.y0 - 40)
  g.fillRect(box.x0 + 14, box.y0 + 12, 1, box.y1 - box.y0 - 80)
}

/** The tap pouring into the basin. */
export function renderFaucet(g: CanvasRenderingContext2D, b: BasinDef) {
  const f = b.faucet
  if (!f) return
  if (f.side === 'top') {
    const top = f.y
    bevel(g, f.x - 5, top - 26, 10, 24, RAMPS.steel)
    bevel(g, f.x - 22, top - 31, 44, 8, RAMPS.steel)
    bevel(g, f.x - 3, top - 4, 6, 6, RAMPS.steel, { depth: 1 })
    shadedOrb(g, f.x - 32, top - 24, 6, RAMPS.pink)
    shadedOrb(g, f.x + 32, top - 24, 6, RAMPS.teal)
  } else {
    bevel(g, f.x - 18, f.y - 6, 26, 12, RAMPS.gold)
    bevel(g, f.x - 22, f.y - 26, 8, 52, RAMPS.gold)
    shadedOrb(g, f.x - 18, f.y - 34, 6, RAMPS.pink)
    shadedOrb(g, f.x - 18, f.y + 34, 6, RAMPS.teal)
  }
}

/** The drum's dial above it: where it is turning now, and the next setting flashing early. */
export function renderDial(
  g: CanvasRenderingContext2D,
  b: BasinDef,
  tick: number,
) {
  const p = b.physics
  if (p.kind !== 'spin') return
  const { now, next, telling } = dialAt(p, tick)
  const x = p.cx
  const y = p.cy - p.r - 2
  shadedOrb(g, x, y, 15, RAMPS.steel)
  g.fillStyle = RAMPS.cream[3]
  g.beginPath()
  g.arc(x, y, 11, 0, Math.PI * 2)
  g.fill()
  const needle = (v: number, colour: string, len: number) => {
    const a = -Math.PI / 2 + (v / 1.6) * (Math.PI * 0.75)
    g.strokeStyle = colour
    g.lineWidth = 2
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len)
    g.stroke()
    g.lineWidth = 1
  }
  if (telling && Math.floor(tick / 8) % 2 === 0)
    needle(next, RAMPS.ember[2], 10)
  needle(now, INK, 9)
  g.fillStyle = INK
  g.fillRect(x - 1, y - 1, 3, 3)
}

/** The drain: it glows when the bubble is full, and gurgles before the gremlin comes up. */
export function renderDrain(
  g: CanvasRenderingContext2D,
  b: BasinDef,
  tick: number,
  ready: boolean,
  gurgle: number,
) {
  const d = b.drain
  const r = 13
  if (ready)
    glow(g, d.x, d.y, r + 22, RAMPS.gold[3], 0.45 + 0.25 * Math.sin(tick / 6))
  if (gurgle > 0)
    glow(g, d.x, d.y, r + 16, RAMPS.leaf[3], 0.3 + 0.3 * Math.sin(tick / 3))
  shadedOrb(g, d.x, d.y, r + 3, RAMPS.steel, { glint: false })
  g.fillStyle = INK
  g.beginPath()
  g.arc(d.x, d.y, r - 1, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = RAMPS.steel[3]
  for (let i = -1; i <= 1; i++) g.fillRect(d.x - 8, d.y + i * 5 - 1, 16, 2)
  if (gurgle > 0) {
    // Bubbles burping up through the grate: the gremlin is coming.
    g.fillStyle = RAMPS.leaf[4]
    for (let i = 0; i < 3; i++) {
      const t = (tick * 0.6 + i * 9) % 26
      g.fillRect(Math.round(d.x - 6 + i * 6), Math.round(d.y + 4 - t), 2, 2)
    }
  }
  if (ready) {
    g.fillStyle = RAMPS.gold[4]
    for (let i = 0; i < 4; i++) {
      const a = tick / 10 + (i * Math.PI) / 2
      g.fillRect(
        Math.round(d.x + Math.cos(a) * (r + 6)),
        Math.round(d.y + Math.sin(a) * (r + 6)),
        2,
        2,
      )
    }
  }
}

// --- the grime mask -----------------------------------------------------------------------------

/**
 * The grime drawn as a mask cached on its own canvas: painted whole when a basin starts, then
 * only the cells cleaned (or grimed over) since the last frame are touched. Headless there is no
 * canvas, and the grime is simply not drawn.
 */
export class GrimeLayer {
  private canvas: HTMLCanvasElement | null = null
  private layer: CanvasRenderingContext2D | null = null
  private painted: Grime | null = null
  private look: LookStyle = LOOKS.steel

  draw(g: CanvasRenderingContext2D, grime: Grime, b: BasinDef) {
    if (typeof document === 'undefined') {
      grime.fresh.length = 0
      grime.dirtied.length = 0
      return
    }
    if (!this.canvas) {
      this.canvas = document.createElement('canvas')
      this.canvas.width = W
      this.canvas.height = H
      this.layer = this.canvas.getContext('2d')
    }
    const k = this.layer
    if (!k) return
    if (this.painted !== grime) {
      this.painted = grime
      this.look = LOOKS[b.look]
      k.clearRect(0, 0, W, H)
      for (let i = 0; i < grime.hp.length; i++)
        if (grime.hp[i]) this.paintCell(k, grime, i)
      grime.fresh.length = 0
      grime.dirtied.length = 0
    }
    for (const i of grime.fresh) {
      const c = grime.cellAt(i)
      k.clearRect(c.x, c.y, CELL, CELL)
    }
    grime.fresh.length = 0
    for (const i of grime.dirtied) this.paintCell(k, grime, i)
    grime.dirtied.length = 0
    g.save()
    g.imageSmoothingEnabled = false
    g.drawImage(this.canvas, 0, 0)
    g.restore()
  }

  private paintCell(k: CanvasRenderingContext2D, grime: Grime, i: number) {
    const c = grime.cellAt(i)
    // A hash of the cell, so the film's mottling is fixed per cell without any rng.
    const h = (i * 2654435761) >>> 0
    const tones = this.look.grime
    k.fillStyle = rgba(tones[h % tones.length]!, 0.62)
    k.fillRect(c.x, c.y, CELL, CELL)
    k.fillStyle = rgba(this.look.speck, 0.55)
    k.fillRect(c.x + ((h >> 4) % CELL), c.y + ((h >> 8) % CELL), 1, 1)
    if ((h >> 12) % 3 === 0)
      k.fillRect(c.x + ((h >> 14) % CELL), c.y + ((h >> 18) % CELL), 2, 1)
  }
}

// --- the bubble ---------------------------------------------------------------------------------

const SHEEN = [
  'rgba(244, 114, 182, 0.55)',
  'rgba(250, 204, 21, 0.5)',
  'rgba(94, 234, 212, 0.5)',
  'rgba(167, 139, 250, 0.55)',
]

export type BubbleLook = {
  x: number
  y: number
  r: number
  wobble: number
  stage: number
  /** Ticks left on the ouch face after a hit. */
  hurt: number
  /** Which way it is looking. */
  lookX: number
  lookY: number
  tick: number
  /** Film colours for a skin (the default is the rainbow film). */
  tint?: readonly [string, string, string]
}

/** The bubble, with a face that grows up from a nervous blob (stage 1) to a beaming full bubble. */
export function renderBubble(g: CanvasRenderingContext2D, b: BubbleLook) {
  const r = b.r
  const wob = Math.sin(b.wobble) * 0.08
  g.save()
  g.translate(b.x, b.y)
  g.scale(1 + wob, 1 - wob)
  const tint = b.tint ?? [
    'rgba(165, 243, 252, 0.35)',
    'rgba(244, 114, 182, 0.4)',
    'rgba(167, 139, 250, 0.75)',
  ]
  const film = g.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r)
  film.addColorStop(0, 'rgba(255, 255, 255, 0.85)')
  film.addColorStop(0.5, tint[0])
  film.addColorStop(0.8, tint[1])
  film.addColorStop(1, tint[2])
  g.fillStyle = film
  g.beginPath()
  g.arc(0, 0, r, 0, Math.PI * 2)
  g.fill()
  const spin = b.tick / 18
  g.lineWidth = Math.max(1.5, r / 6)
  SHEEN.forEach((colour, i) => {
    g.strokeStyle = colour
    g.beginPath()
    g.arc(0, 0, r * 0.8, spin + i * 0.45, spin + i * 0.45 + 0.45)
    g.stroke()
  })
  g.lineWidth = 1
  g.strokeStyle = INK
  g.beginPath()
  g.arc(0, 0, r + 0.5, 0, Math.PI * 2)
  g.stroke()
  g.strokeStyle = 'rgba(255, 255, 255, 0.9)'
  g.beginPath()
  g.arc(0, 0, r - 0.5, Math.PI * 0.9, Math.PI * 1.6)
  g.stroke()
  g.fillStyle = '#ffffff'
  g.fillRect(Math.round(-r * 0.55), Math.round(-r * 0.55), 3, 2)
  g.fillRect(Math.round(-r * 0.6), Math.round(-r * 0.3), 2, 2)
  renderFace(g, b)
  g.restore()
}

function renderFace(g: CanvasRenderingContext2D, b: BubbleLook) {
  const r = b.r
  const lx = Math.round(b.lookX * Math.max(1, r * 0.12))
  const ly = Math.round(b.lookY * Math.max(1, r * 0.1))
  const ex = Math.round(r * 0.32)
  const ey = Math.round(-r * 0.15) + ly
  const blink = b.tick % 200 < 6
  g.fillStyle = INK
  if (b.hurt > 0) {
    // Squeezed shut: > <
    for (const side of [-1, 1]) {
      const x = side * ex + lx
      g.fillRect(x - 2, ey - 1, 1, 1)
      g.fillRect(x - 1, ey, 2, 1)
      g.fillRect(x - 2, ey + 1, 1, 1)
      g.fillRect(x + 1, ey - 1, 1, 1)
      g.fillRect(x + 1, ey + 1, 1, 1)
    }
    g.beginPath()
    g.arc(lx, r * 0.3, Math.max(1.5, r * 0.14), 0, Math.PI * 2)
    g.fill()
    return
  }
  const stage = b.stage
  if (stage === 1) {
    // A nervous blob: wide eyes darting about, a wobbly mouth, a bead of sweat.
    for (const side of [-1, 1]) {
      const x = side * ex + lx
      g.fillStyle = '#ffffff'
      g.fillRect(x - 1, ey - 1, 3, 3)
      g.fillStyle = INK
      if (!blink) g.fillRect(x + Math.sign(b.lookX), ey, 1, 1)
    }
    g.fillRect(lx - 2, Math.round(r * 0.35), 1, 1)
    g.fillRect(lx - 1, Math.round(r * 0.35) - 1, 1, 1)
    g.fillRect(lx, Math.round(r * 0.35), 1, 1)
    g.fillRect(lx + 1, Math.round(r * 0.35) - 1, 1, 1)
    g.fillStyle = RAMPS.sky[3]
    g.fillRect(Math.round(r * 0.55), Math.round(-r * 0.55), 1, 2)
    g.fillRect(Math.round(r * 0.55) - 1, Math.round(-r * 0.55) + 2, 2, 1)
    return
  }
  // Eyes: dots, then shiny eyes, then sparkles at full size.
  for (const side of [-1, 1]) {
    const x = side * ex + lx
    if (blink) {
      g.fillRect(x - 1, ey + 1, 3, 1)
      continue
    }
    if (stage >= 5) {
      g.fillRect(x - 1, ey - 1, 3, 4)
      g.fillStyle = '#ffffff'
      g.fillRect(x - 1, ey - 1, 1, 1)
      g.fillStyle = RAMPS.gold[4]
      const tw = Math.floor(b.tick / 10) % 2
      g.fillRect(x + 1, ey - 3 - tw, 1, 1)
      g.fillStyle = INK
    } else {
      g.fillRect(x - 1, ey, 2, stage >= 3 ? 3 : 2)
      if (stage >= 3) {
        g.fillStyle = '#ffffff'
        g.fillRect(x - 1, ey, 1, 1)
        g.fillStyle = INK
      }
    }
    if (stage >= 4) {
      // Brows up: confident.
      g.fillRect(x - 2, ey - 3, 4, 1)
    }
  }
  if (stage >= 3) {
    g.fillStyle = rgba(RAMPS.pink[2], 0.75)
    g.fillRect(-ex - 4 + lx, ey + 4, 3, stage >= 5 ? 2 : 1)
    g.fillRect(ex + 2 + lx, ey + 4, 3, stage >= 5 ? 2 : 1)
  }
  g.strokeStyle = INK
  g.fillStyle = INK
  const my = r * 0.15 + ly
  if (stage >= 5) {
    // A beaming open smile.
    g.beginPath()
    g.arc(lx, my, r * 0.3, 0.1, Math.PI - 0.1)
    g.closePath()
    g.fill()
    g.fillStyle = RAMPS.pink[2]
    g.fillRect(lx - 2, Math.round(my + r * 0.18), 4, 2)
  } else {
    g.beginPath()
    g.arc(lx, my, r * (stage >= 4 ? 0.28 : 0.2), 0.25, Math.PI - 0.25)
    g.stroke()
  }
}

/** A soap shot: a little bubble with a glint. */
export function renderShot(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  tick: number,
) {
  g.fillStyle = rgba(RAMPS.water[4], 0.35)
  g.beginPath()
  g.arc(x, y, r, 0, Math.PI * 2)
  g.fill()
  g.strokeStyle = SHEEN[Math.floor(tick / 5) % SHEEN.length]!
  g.beginPath()
  g.arc(x, y, r, 0, Math.PI * 2)
  g.stroke()
  g.fillStyle = '#ffffff'
  g.fillRect(Math.round(x - r * 0.5), Math.round(y - r * 0.5), 2, 2)
}

/** A trap bubble round a caught pest, wobbling on its way to the drain. */
export function renderTrap(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  tick: number,
) {
  const wob = Math.sin(tick / 5) * 0.08
  g.save()
  g.translate(x, y)
  g.scale(1 + wob, 1 - wob)
  g.fillStyle = rgba(RAMPS.water[4], 0.28)
  g.beginPath()
  g.arc(0, 0, r, 0, Math.PI * 2)
  g.fill()
  g.lineWidth = 2
  SHEEN.forEach((colour, i) => {
    g.strokeStyle = colour
    g.beginPath()
    g.arc(0, 0, r - 1, tick / 14 + i * 1.5, tick / 14 + i * 1.5 + 0.9)
    g.stroke()
  })
  g.lineWidth = 1
  g.strokeStyle = 'rgba(255, 255, 255, 0.8)'
  g.beginPath()
  g.arc(0, 0, r, 0, Math.PI * 2)
  g.stroke()
  g.fillStyle = '#ffffff'
  g.fillRect(Math.round(-r * 0.55), Math.round(-r * 0.55), 3, 2)
  g.restore()
}

/** Little stars circling a stunned head. */
export function renderDizzy(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  tick: number,
) {
  for (let i = 0; i < 3; i++) {
    const a = tick / 9 + (i * Math.PI * 2) / 3
    g.fillStyle = i % 2 ? RAMPS.gold[4] : RAMPS.pink[3]
    const sx = Math.round(x + Math.cos(a) * 9)
    const sy = Math.round(y + Math.sin(a) * 3)
    g.fillRect(sx - 1, sy, 3, 1)
    g.fillRect(sx, sy - 1, 1, 3)
  }
}
