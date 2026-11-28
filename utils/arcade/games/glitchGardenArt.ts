// /utils/arcade/games/glitchGardenArt.ts
//
// Glitch Garden's double-density art helpers and the Spring/Summer cast (conductor
// kr-arcade/t-088, t-089): fruit trees and apples, tall sunflowers, lily pads, the dragonfly bot,
// bee bots and the wasp-glitch hiding among them, Queen Wiggle's rainbow body and crowned head, and
// the code-drawn Mow-Bot 3000. Sprites are authored at the garden's own pixel size and smoothed to
// twice the pixels (Scale2x), so they read crisply on the doubled screen. Pure drawing: nothing
// here touches the game's seeded dice.

import {
  INK,
  RAMPS,
  bevel,
  drawSprite,
  glow,
  mix,
  pixelSprite,
  rgba,
} from '../snes'
import type { PixelSprite, Ramp, SpriteDrawOptions } from '../snes'

/** The logical screen is this many times the garden's size: sprites carry twice the pixels. */
export const DENSITY = 2

/**
 * Scale2x: each art pixel becomes four, and a corner takes a neighbour's colour where two
 * neighbours agree, so diagonals come out smooth instead of stair-stepped.
 */
export function scale2x(rows: readonly string[]): string[] {
  const h = rows.length
  const w = Math.max(...rows.map((r) => r.length))
  const at = (x: number, y: number) =>
    x < 0 || y < 0 || x >= w || y >= h ? '.' : (rows[y]![x] ?? '.')
  const out: string[] = []
  for (let y = 0; y < h; y++) {
    let top = ''
    let bottom = ''
    for (let x = 0; x < w; x++) {
      const p = at(x, y)
      const a = at(x, y - 1)
      const b = at(x + 1, y)
      const c = at(x - 1, y)
      const d = at(x, y + 1)
      top += c === a && c !== d && a !== b ? a : p
      top += a === b && a !== c && b !== d ? b : p
      bottom += d === c && d !== b && c !== a ? c : p
      bottom += b === d && b !== a && d !== c ? d : p
    }
    out.push(top, bottom)
  }
  return out
}

/** A double-density sprite: the art smoothed to twice the pixels, with a hairline outline. */
export function hdSprite(
  rows: readonly string[],
  palette: Record<string, string>,
): PixelSprite {
  return pixelSprite(scale2x(rows), palette)
}

/** Draw a double-density sprite at garden coordinates: one art pixel per screen pixel. */
export function drawHd(
  g: CanvasRenderingContext2D,
  sprite: PixelSprite,
  x: number,
  y: number,
  options: SpriteDrawOptions = {},
) {
  g.save()
  g.scale(1 / DENSITY, 1 / DENSITY)
  drawSprite(g, sprite, x * DENSITY, y * DENSITY, options)
  g.restore()
}

// --- each garden's lawn -------------------------------------------------------------

export type GardenLook = {
  /** Lawn bands, top to bottom. */
  lawn: readonly string[]
  /** The mowing stripes' tint. */
  stripe: string
  soil: readonly string[]
  edging: Ramp
}

export const GARDEN_LOOKS: Record<string, GardenLook> = {
  'kitchen-plot': {
    lawn: [
      mix(RAMPS.night[1], RAMPS.leaf[0], 0.35),
      mix(RAMPS.night[1], RAMPS.leaf[0], 0.7),
      RAMPS.leaf[0],
      mix(RAMPS.leaf[0], RAMPS.leaf[1], 0.3),
    ],
    stripe: RAMPS.leaf[2],
    soil: [RAMPS.earth[1], mix(RAMPS.earth[1], RAMPS.earth[0], 0.7)],
    edging: RAMPS.rust,
  },
  'orchard-rows': {
    lawn: [
      mix(RAMPS.night[1], RAMPS.leaf[1], 0.45),
      mix(RAMPS.leaf[0], RAMPS.earth[1], 0.25),
      mix(RAMPS.leaf[1], RAMPS.gold[1], 0.2),
      mix(RAMPS.leaf[1], RAMPS.gold[1], 0.32),
    ],
    stripe: RAMPS.gold[2],
    soil: [RAMPS.earth[2], RAMPS.earth[1]],
    edging: RAMPS.earth,
  },
  'sunflower-maze': {
    lawn: [
      mix(RAMPS.sky[1], RAMPS.leaf[1], 0.55),
      mix(RAMPS.leaf[1], RAMPS.gold[1], 0.15),
      mix(RAMPS.leaf[1], RAMPS.leaf[2], 0.35),
      mix(RAMPS.leaf[2], RAMPS.gold[2], 0.25),
    ],
    stripe: RAMPS.gold[3],
    soil: [mix(RAMPS.earth[2], RAMPS.gold[1], 0.3), RAMPS.earth[1]],
    edging: RAMPS.gold,
  },
  'leaf-pile-lane': {
    lawn: [
      mix(RAMPS.night[1], RAMPS.rust[0], 0.5),
      mix(RAMPS.earth[1], RAMPS.rust[1], 0.45),
      mix(RAMPS.leaf[1], RAMPS.rust[1], 0.55),
      mix(RAMPS.leaf[1], RAMPS.gold[1], 0.65),
    ],
    stripe: RAMPS.gold[2],
    soil: [mix(RAMPS.earth[1], RAMPS.rust[0], 0.45), RAMPS.earth[1]],
    edging: RAMPS.rust,
  },
  'pumpkin-patch': {
    lawn: [
      mix(RAMPS.night[1], RAMPS.rust[1], 0.55),
      mix(RAMPS.leaf[0], RAMPS.earth[2], 0.7),
      mix(RAMPS.rust[1], RAMPS.earth[1], 0.45),
      mix(RAMPS.leaf[1], RAMPS.gold[1], 0.5),
    ],
    stripe: RAMPS.ember[2],
    soil: [mix(RAMPS.rust[0], RAMPS.earth[1], 0.65), RAMPS.earth[1]],
    edging: RAMPS.ember,
  },
  'frost-frame-greenhouse': {
    lawn: [
      mix(RAMPS.night[1], RAMPS.sky[0], 0.55),
      mix(RAMPS.sky[0], RAMPS.teal[0], 0.42),
      mix(RAMPS.sky[1], RAMPS.steel[0], 0.62),
      mix(RAMPS.sky[1], RAMPS.steel[1], 0.65),
    ],
    stripe: RAMPS.sky[3],
    soil: [mix(RAMPS.steel[0], RAMPS.earth[0], 0.3), RAMPS.steel[0]],
    edging: RAMPS.sky,
  },
  'midnight-garden': {
    lawn: ['#040619', '#0a1230', '#111a35', '#17143b'],
    stripe: '#505a93',
    soil: ['#100a27', '#241b44'],
    edging: RAMPS.purple,
  },
  'snowball-hill': {
    lawn: [
      mix(RAMPS.night[0], RAMPS.purple[0], 0.7),
      mix(RAMPS.sky[0], RAMPS.purple[1], 0.7),
      mix(RAMPS.sky[1], RAMPS.steel[1], 0.6),
      mix(RAMPS.sky[2], RAMPS.steel[2], 0.65),
    ],
    stripe: RAMPS.sky[4],
    soil: [RAMPS.sky[1], mix(RAMPS.sky[2], RAMPS.steel[0], 0.3)],
    edging: RAMPS.steel,
  },
  'lily-pond': {
    lawn: [
      mix(RAMPS.night[1], RAMPS.teal[0], 0.6),
      RAMPS.teal[0],
      mix(RAMPS.teal[0], RAMPS.leaf[1], 0.5),
      mix(RAMPS.leaf[0], RAMPS.leaf[1], 0.6),
    ],
    stripe: RAMPS.teal[2],
    soil: [mix(RAMPS.earth[1], RAMPS.teal[0], 0.3), RAMPS.earth[0]],
    edging: RAMPS.steel,
  },
}

// --- the orchard ---------------------------------------------------------------------

/** A round fruit tree with a few apples showing; it stands over its own cell. */
export const TREE_SPRITE = hdSprite(
  [
    '...hLLh...',
    '.hLLPLLLh.',
    'hLLPLrLPLh',
    'LPLLPPLrPL',
    'LPrPLPLPPd',
    '.dPPpPPpd.',
    '..ddpdpd..',
    '....tt....',
    '....tT....',
    '...tTTt...',
  ],
  {
    h: RAMPS.leaf[4],
    L: RAMPS.leaf[3],
    P: RAMPS.leaf[2],
    p: RAMPS.leaf[1],
    d: RAMPS.leaf[0],
    r: RAMPS.ember[2],
    t: RAMPS.earth[2],
    T: RAMPS.earth[1],
  },
)

export const APPLE_SPRITE = hdSprite(['..g.', '.rRr', 'rRwr', 'rrRr', '.dd.'], {
  g: RAMPS.leaf[3],
  r: RAMPS.ember[2],
  R: RAMPS.ember[3],
  w: '#ffffff',
  d: RAMPS.ember[1],
})

// --- the sunflower maze --------------------------------------------------------------

/** A tall sunflower: its head nods above the cell, the stalk fills it. */
export const SUNFLOWER_SPRITES = [
  hdSprite(
    [
      '..yYYy..',
      '.yYooYy.',
      'yYobboYy',
      'yYobboYy',
      '.yYooYy.',
      '..yYYy..',
      '...gg...',
      '.gGgg...',
      '...ggGg.',
      '...gg...',
      '...gg...',
    ],
    {
      y: RAMPS.gold[2],
      Y: RAMPS.gold[3],
      o: RAMPS.earth[2],
      b: RAMPS.earth[1],
      g: RAMPS.leaf[2],
      G: RAMPS.leaf[3],
    },
  ),
  hdSprite(
    [
      '...yYYy.',
      '..yYooYy',
      '.yYobboY',
      '.yYobboY',
      '..yYooYy',
      '...yYYy.',
      '...gg...',
      '.gGgg...',
      '...ggGg.',
      '...gg...',
      '...gg...',
    ],
    {
      y: RAMPS.gold[2],
      Y: RAMPS.gold[3],
      o: RAMPS.earth[2],
      b: RAMPS.earth[1],
      g: RAMPS.leaf[2],
      G: RAMPS.leaf[3],
    },
  ),
] as const

// --- the lily pond -------------------------------------------------------------------

/** A lily pad under whatever floats on it: a round leaf with its notch, and a little flower. */
export function drawLilyPad(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  flower: boolean,
) {
  g.fillStyle = rgba(INK, 0.35)
  g.beginPath()
  g.ellipse(x + 0.5, y + 1, 4.5, 2.6, 0, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = RAMPS.leaf[2]
  g.beginPath()
  g.ellipse(x, y, 4.5, 2.6, 0, 0.35, Math.PI * 2 - 0.35)
  g.lineTo(x, y)
  g.fill()
  g.fillStyle = RAMPS.leaf[3]
  g.fillRect(x - 3, y - 1.5, 2, 0.5)
  if (flower) {
    g.fillStyle = RAMPS.pink[3]
    g.fillRect(x + 1, y - 1.5, 1.5, 1.5)
    g.fillStyle = RAMPS.gold[3]
    g.fillRect(x + 1.5, y - 1, 0.5, 0.5)
  }
}

// --- the dragonfly bot ---------------------------------------------------------------

const DRAGONFLY_PALETTE = {
  w: rgba(RAMPS.sky[4], 0.9),
  W: RAMPS.sky[3],
  p: RAMPS.teal[2],
  P: RAMPS.teal[3],
  E: RAMPS.gold[3],
  e: INK,
}
/** Facing right: wings spread (darting, drawn blurred), then folded back (the stop). */
export const DRAGONFLY_SPRITES = [
  hdSprite(
    ['.ww..ww...', 'wWWwwWWw..', 'pPPPPPPPEe', 'wWWwwWWw..', '.ww..ww...'],
    DRAGONFLY_PALETTE,
  ),
  hdSprite(
    ['..www.....', '.wWWW.....', 'pPPPPPPPEe', '.wWWW.....', '..www.....'],
    DRAGONFLY_PALETTE,
  ),
] as const

// --- bee bots and the wasp-glitch ----------------------------------------------------

const BEE_ROWS = [
  ['..ww..', '.wWWw.', 'yKyKyE', 'KyKyKe', '.yKy..', '..p...'],
  ['.w..w.', 'wWwwWw', 'yKyKyE', 'KyKyKe', '.yKy..', '..p...'],
] as const
/** A friendly bee bot facing right, carrying a ball of pollen. */
export const BEE_SPRITES = BEE_ROWS.map((rows) =>
  hdSprite(rows, {
    w: RAMPS.sky[4],
    W: RAMPS.sky[3],
    y: RAMPS.gold[3],
    K: INK,
    E: RAMPS.sky[3],
    e: INK,
    p: RAMPS.gold[4],
  }),
)
/** The wasp-glitch: a bee at a glance, but its stripes jitter and its eye glows red. */
export const WASP_SPRITES = [
  hdSprite(BEE_ROWS[0], {
    w: RAMPS.sky[4],
    W: RAMPS.sky[3],
    y: RAMPS.gold[3],
    K: INK,
    E: RAMPS.ember[2],
    e: INK,
    p: RAMPS.gold[4],
  }),
  hdSprite(['.w..w.', 'wWwwWw', 'KyKyKE', 'yKyKye', '.Kyk..', '..k...'], {
    w: RAMPS.sky[4],
    W: RAMPS.sky[3],
    y: RAMPS.ember[3],
    K: INK,
    E: RAMPS.ember[2],
    e: INK,
    k: RAMPS.ember[1],
  }),
] as const

// --- Queen Wiggle --------------------------------------------------------------------

const SEGMENT_ROWS = [
  ['.hLLP.', 'hLLPPp', 'LLPPpp', 'PPPppd', 'Pppddd', '.pddd.', '.p..p.'],
  ['.hLLP.', 'hLPPPp', 'LLPPpp', 'PPppdd', 'Pppddd', '.pddd.', 'p....p'],
] as const
const ramp = (r: Ramp) => ({ h: r[4], L: r[3], P: r[2], p: r[1], d: r[0] })
/** Her body runs through the rainbow, one colour per segment. */
export const QUEEN_RAMPS: readonly Ramp[] = [
  RAMPS.ember,
  RAMPS.rust,
  RAMPS.gold,
  RAMPS.leaf,
  RAMPS.teal,
  RAMPS.sky,
  RAMPS.purple,
  RAMPS.pink,
]
export const QUEEN_SEGMENTS = QUEEN_RAMPS.map((r) =>
  SEGMENT_ROWS.map((rows) => hdSprite(rows, ramp(r))),
)
/** A coloured joint: a gold-ringed segment, the only place she splits at first. */
export const QUEEN_JOINT = SEGMENT_ROWS.map((rows) =>
  hdSprite(rows, {
    h: '#ffffff',
    L: RAMPS.gold[4],
    P: RAMPS.gold[3],
    p: RAMPS.gold[2],
    d: RAMPS.gold[1],
  }),
)
const QUEEN_HEAD_ROWS = [
  [
    'y.y.y.',
    'YyYyY.',
    'hLLwkp',
    'LLPwkp',
    'PPPPkd',
    'Ppkkdd',
    '.pddd.',
    '.p..p.',
  ],
  [
    'y.y.y.',
    'YyYyY.',
    'hLLwkp',
    'LLPwkp',
    'PPPPpd',
    'Pppkkd',
    '.pddd.',
    'p....p',
  ],
] as const
/** Her crowned head, facing right; armoured, it wears steel. */
export const QUEEN_HEADS = QUEEN_HEAD_ROWS.map((rows) =>
  hdSprite(rows, {
    ...ramp(RAMPS.pink),
    y: RAMPS.gold[3],
    Y: RAMPS.gold[4],
    w: '#ffffff',
    k: INK,
  }),
)
export const QUEEN_ARMOURED = QUEEN_HEAD_ROWS.map((rows) =>
  hdSprite(rows, {
    ...ramp(RAMPS.steel),
    y: RAMPS.gold[3],
    Y: RAMPS.gold[4],
    w: '#ffffff',
    k: INK,
  }),
)

// --- Mow-Bot 3000 --------------------------------------------------------------------

export type MowerLook = {
  x: number
  y: number
  w: number
  h: number
  /** Hits left on each fuel cap (0 is fixed). */
  caps: readonly number[]
  capOffsets: readonly number[]
  tick: number
  /** Facing: 1 right, -1 left. */
  dir: number
  /** Fixed: it parks with a smile. */
  parked: boolean
}

/** The runaway mower: a red bevelled body, spinning blades, three fuel caps and a face. */
export function drawMower(g: CanvasRenderingContext2D, m: MowerLook) {
  const { x, y, w, h } = m
  glow(g, x + w / 2, y + h / 2, w * 0.7, RAMPS.ember[2], m.parked ? 0.1 : 0.25)
  g.fillStyle = rgba(INK, 0.4)
  g.fillRect(x + 2, y + h - 1, w - 2, 3)
  // The blade deck: grass flicks spin out under it while it runs.
  g.fillStyle = RAMPS.steel[1]
  g.fillRect(x + 1, y + h - 5, w - 2, 4)
  if (!m.parked)
    for (let i = 0; i < 4; i++) {
      const sx = x + 3 + ((m.tick * 3 + i * 9) % (w - 6))
      g.fillStyle = i % 2 ? RAMPS.leaf[3] : RAMPS.steel[4]
      g.fillRect(sx, y + h - 3, 2, 1)
    }
  bevel(g, x, y + 2, w, h - 6, m.parked ? RAMPS.leaf : RAMPS.ember, {
    depth: 2,
  })
  // Wheels.
  g.fillStyle = INK
  for (const wx of [x + 3, x + w - 7]) g.fillRect(wx, y + h - 3, 5, 3)
  g.fillStyle = RAMPS.steel[2]
  for (const wx of [x + 4, x + w - 6])
    g.fillRect(wx, y + h - 2 - ((m.tick >> 2) % 2), 2, 1)
  // The face, at the front.
  const fx = m.dir > 0 ? x + w - 9 : x + 3
  g.fillStyle = RAMPS.cream[3]
  g.fillRect(fx, y + 5, 6, 3)
  g.fillStyle = INK
  g.fillRect(fx + 1, y + 6, 1, 1)
  g.fillRect(fx + 4, y + 6, 1, 1)
  g.fillStyle = m.parked ? RAMPS.leaf[3] : RAMPS.ember[3]
  g.fillRect(fx + 1, y + 8, 4, 1)
  // The fuel caps: glinting gold until fixed, then a calm green.
  m.capOffsets.forEach((ox, i) => {
    const left = m.caps[i] ?? 0
    const cx = x + ox
    const cy = y
    if (left > 0) {
      const blink = (m.tick >> 3) % 2 === 0
      glow(g, cx + 2, cy + 2, 5, RAMPS.gold[3], blink ? 0.5 : 0.25)
      g.fillStyle = INK
      g.fillRect(cx - 1, cy - 1, 7, 6)
      g.fillStyle = RAMPS.gold[2]
      g.fillRect(cx, cy, 5, 4)
      g.fillStyle = RAMPS.gold[4]
      g.fillRect(cx + 1, cy, 2, 1)
      g.fillStyle = INK
      for (let k = 0; k < left; k++) g.fillRect(cx + 1 + k, cy + 2, 1, 1)
    } else {
      g.fillStyle = INK
      g.fillRect(cx - 1, cy, 7, 5)
      g.fillStyle = RAMPS.leaf[3]
      g.fillRect(cx, cy + 1, 5, 3)
    }
  })
}
