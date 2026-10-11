// /utils/arcade/games/petalPost.ts
//
// Petal Post -- the Kind Robots Arcade's Paperboy riff (conductor
// kr-arcade/t-009 game factory, batch 4). A delivery bot scoots up a scrolling
// street tossing seed packets to the houses on its route. Bright houses with
// flower boxes subscribe: land a packet in their mailbox (best) or on their
// doorstep. Grey houses don't subscribe; a packet in their garden still
// sprouts a flower for a few points.
//
// Dodge skateboarding cats, rolling bins, parked cars and lawn sprinklers.
// Bundles of packets lie along the way (you carry ten). Miss a subscriber and
// they cancel at the end of the day; deliver to everyone and a neighbour
// signs up. Each day ends with a bonus run past targets where a crash only
// ends the run. Lose every subscriber or every bot and the round is over.
// POST_CURVES ramp the traffic.
//
// Up rides faster, down slower, left/right steer, A tosses a packet.

import { levelCurve } from '../curve'
import { drawText, measureText } from '../font'
import {
  INK,
  RAMPS,
  Sparkles,
  backdropRng,
  bandedGradient,
  bevel,
  cachedLayer,
  dropShadow,
  drawSprite,
  glow,
  hudPanel,
  mix,
  pixelSprite,
  rgba,
  vignette,
} from '../snes'
import type { Ramp } from '../snes'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'

const W = 256
const H = 240
const HUD_H = 24
const BOT_Y = 190
const SIDEWALK = 104
const STREET_L = 132
const STREET_R = 236
const MIN_X = SIDEWALK + 2
const MAX_X = STREET_R - 8
const MAILBOX_X = 96
const DOOR_X = 64
const HOUSES = 12
const HOUSE_GAP = 110
const FIRST_HOUSE = 220
const BONUS_LEN = 700
const BASE_SPEED = 1.3
const MIN_SPEED = 0.7
const MAX_SPEED = 2.2
const STEER = 1.6
const TOSS_VX = 2.6
const TOSS_TICKS = 40
const CARRY = 10
const START_LIVES = 3
const CRASH_TICKS = 100
const SAFE_TICKS = 70
const DAY_END_TICKS = 170
const SUBSCRIBE_CHANCE = 0.6

const MAILBOX_POINTS = 250
const DOOR_POINTS = 100
const GARDEN_POINTS = 25
const TARGET_POINTS = 250
const PERFECT_POINTS = 1000

export const POST_CURVES = {
  /** Hazards per house gap. */
  hazards: { start: 0.7, step: 0.15, limit: 1.8 },
  /** Cat and bin speed. */
  traffic: { start: 0.7, step: 0.08, limit: 1.4 },
} as const

type House = {
  y: number
  subscriber: boolean
  delivered: boolean
  color: string
}
type HazardKind = 'cat' | 'bin' | 'car' | 'sprinkler'
type Hazard = {
  kind: HazardKind
  x: number
  y: number
  vx: number
  vy: number
  w: number
  h: number
  gone: boolean
}
type Packet = { x: number; y: number; vy: number; t: number }
type Target = { x: number; y: number; hit: boolean }
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = { x: number; y: number; text: string; life: number }

const HOUSE_COLORS = [
  '#f472b6',
  '#38bdf8',
  '#facc15',
  '#a78bfa',
  '#4ade80',
  '#fb923c',
]

// --- 16-bit art (utils/arcade/snes.ts) -------------------------------------------

/** The street repeats every PERIOD pixels: slabs (16), lane dashes (30) and mown stripes (24) all fit. */
const PERIOD = 240
/** House layers start this far above the house's y, so the chimney fits. */
const HOUSE_TOP = 52
const HOUSE_LAYER_H = 70

const ASPHALT: Ramp = ['#16141f', '#262433', '#353342', '#454354', '#64627a']
const CONCRETE: Ramp = ['#4a4458', '#8a8296', '#b9b1bd', '#d9d1d3', '#f4ece6']
const MINT: Ramp = ['#123d2a', '#1f7a4a', '#44c27a', '#a6f0c0', '#efffe8']
const GREY: Ramp = ['#2a2830', '#504c58', '#7a7682', '#9e9aa4', '#c4c0c8']
const LAWN = [
  mix(RAMPS.leaf[1], RAMPS.leaf[2], 0.55),
  mix(RAMPS.leaf[1], RAMPS.leaf[2], 0.85),
] as const

/** Each house colour's wall and roof ramps; non-subscribers are all GREY. */
const HOUSE_LOOKS: Record<string, { wall: Ramp; roof: Ramp }> = {
  '#f472b6': { wall: RAMPS.pink, roof: RAMPS.purple },
  '#38bdf8': { wall: RAMPS.sky, roof: RAMPS.rust },
  '#facc15': { wall: RAMPS.gold, roof: RAMPS.rust },
  '#a78bfa': { wall: RAMPS.purple, roof: RAMPS.steel },
  '#4ade80': { wall: MINT, roof: RAMPS.earth },
  '#fb923c': { wall: RAMPS.rust, roof: RAMPS.earth },
}

const rampPalette = (ramp: Ramp) => ({
  '0': ramp[0],
  '1': ramp[1],
  '2': ramp[2],
  '3': ramp[3],
  '4': ramp[4],
})

/**
 * Rows ('0'..'4' by light) for a lit sphere of radius r, lumpy at the edge and dithered between
 * steps: bushes and tree crowns, built once as pixel sprites.
 */
function orbRows(r: number, seed: number, lump: number): string[] {
  const rand = backdropRng(seed)
  const p1 = rand() * Math.PI * 2
  const p2 = rand() * Math.PI * 2
  const size = Math.ceil(r * 2 + 2)
  const c = (size - 1) / 2
  const [lx, ly, lz] = [-0.5, -0.62, 0.6]
  const rows: string[] = []
  for (let y = 0; y < size; y++) {
    let row = ''
    for (let x = 0; x < size; x++) {
      const dx = x - c
      const dy = y - c
      const a = Math.atan2(dy, dx)
      const edge =
        r *
        (1 + lump * (0.6 * Math.sin(5 * a + p1) + 0.4 * Math.sin(9 * a + p2)))
      const d = Math.hypot(dx, dy)
      if (d > edge) {
        row += '.'
        continue
      }
      const nx = dx / edge
      const ny = dy / edge
      const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny))
      const lit = nx * lx + ny * ly + nz * lz
      const v = (lit + 0.15) * 3 + ((x + y) % 2 ? 0.3 : -0.3)
      row += String(Math.max(0, Math.min(4, Math.round(v))))
    }
    rows.push(row)
  }
  return rows
}

/** A bullseye seen from above: red and white rings, rim-lit from the upper left. */
function targetRows(): string[] {
  const rows: string[] = []
  for (let y = 0; y < 15; y++) {
    let row = ''
    for (let x = 0; x < 15; x++) {
      const dx = x - 7
      const dy = y - 7
      const d = Math.hypot(dx, dy)
      if (d > 7.3) {
        row += '.'
        continue
      }
      if (dx === -1 && dy === -1) {
        row += 'x'
        continue
      }
      const red = Math.floor(d / 1.9) % 2 === 0
      const shade = d > 5.6 ? (dx + dy < -2 ? 2 : dx + dy > 2 ? 0 : 1) : 1
      row += (red ? 'qrs' : 'uvw')[shade]
    }
    rows.push(row)
  }
  return rows
}

const TREE_SPRITE = pixelSprite(orbRows(10, 3, 0.1), rampPalette(RAMPS.leaf))
const BUSH_SPRITE = pixelSprite(orbRows(5, 9, 0.14), rampPalette(RAMPS.leaf))

const TARGET_SPRITE = pixelSprite(targetRows(), {
  q: RAMPS.ember[1],
  r: RAMPS.ember[2],
  s: RAMPS.ember[3],
  u: RAMPS.cream[2],
  v: RAMPS.cream[3],
  w: '#ffffff',
  x: '#ffffff',
})
const TARGET_HIT_SPRITE = pixelSprite(targetRows(), {
  q: GREY[0],
  r: GREY[1],
  s: GREY[2],
  u: GREY[2],
  v: GREY[3],
  w: GREY[4],
  x: GREY[4],
})

const PACKET_PALETTE = {
  h: RAMPS.pink[4],
  P: RAMPS.pink[3],
  p: RAMPS.pink[2],
  q: RAMPS.pink[1],
  g: RAMPS.leaf[1],
  G: RAMPS.leaf[3],
  y: RAMPS.gold[3],
  Y: RAMPS.gold[1],
}
/** A seed packet tumbling end over end: two pre-baked frames, never rotated. */
const PACKET_FRAMES = [
  pixelSprite(['hPPPPp', 'PPgGPp', 'PPGgPp', 'pppppq'], PACKET_PALETTE),
  pixelSprite(['hPPp', 'PPPp', 'PgGp', 'PGgp', 'PPPp', 'pppq'], PACKET_PALETTE),
] as const
const PACKET_ICON = pixelSprite(
  ['hPPp', 'PgGp', 'PGgp', 'PPPp', 'pppq'],
  PACKET_PALETTE,
)
const BUNDLE_SPRITE = pixelSprite(
  [
    '.hPPPPPPp.',
    'hPPgGPPPPp',
    'PPPGgPPPPp',
    'yyyyYyyyyy',
    'ppppYppppq',
    'hPPPYPPPPp',
    'PPPPPPPPPp',
    'pppppppppq',
  ],
  PACKET_PALETTE,
)

function flowerSprite(ramp: Ramp, eye: string) {
  return pixelSprite(['..h..', '.hPp.', 'hPyPp', '.pPq.', '..g..', '.Gg..'], {
    h: ramp[4],
    P: ramp[3],
    p: ramp[2],
    q: ramp[1],
    y: eye,
    g: RAMPS.leaf[1],
    G: RAMPS.leaf[3],
  })
}
const SPROUT_SPRITE = pixelSprite(['G.G', 'gGg', '.g.'], {
  G: RAMPS.leaf[3],
  g: RAMPS.leaf[1],
})
const BLOOM_SPRITES = [
  flowerSprite(RAMPS.pink, RAMPS.gold[3]),
  flowerSprite(RAMPS.gold, RAMPS.rust[2]),
  flowerSprite(RAMPS.purple, RAMPS.gold[4]),
] as const

/** Mailboxes: flag down while a subscriber waits, up once delivered; no flag at a grey house. */
const MAILBOX_ROWS = (flag: 'up' | 'down' | 'none') => [
  flag === 'up' ? '........ff' : '..........',
  flag === 'up' ? '........ff' : '..........',
  flag === 'up' ? '........f.' : '..........',
  '.hhhhhh...',
  'hsssssSdk.',
  flag === 'down' ? 'hsWsssSdff' : 'hsWsssSdk.',
  'hssssssdk.',
  'hSSSSSSd..',
  '.dddddd...',
  '...bB.....',
  '...bB.....',
  '...bB.....',
  '...bB.....',
  '...bB.....',
  '...bB.....',
  '...bB.....',
]
const MAILBOX_SUB_PALETTE = {
  h: RAMPS.steel[4],
  s: RAMPS.steel[3],
  S: RAMPS.steel[2],
  d: RAMPS.steel[1],
  W: '#ffffff',
  k: RAMPS.steel[0],
  f: RAMPS.ember[2],
  b: RAMPS.earth[3],
  B: RAMPS.earth[1],
}
const MAILBOX_WAITING = pixelSprite(MAILBOX_ROWS('down'), MAILBOX_SUB_PALETTE)
const MAILBOX_DELIVERED = pixelSprite(MAILBOX_ROWS('up'), MAILBOX_SUB_PALETTE)
const MAILBOX_GREY = pixelSprite(MAILBOX_ROWS('none'), {
  ...MAILBOX_SUB_PALETTE,
  h: GREY[3],
  s: GREY[2],
  S: GREY[1],
  d: GREY[0],
  W: GREY[3],
  k: GREY[0],
  b: RAMPS.earth[2],
  B: RAMPS.earth[0],
})

const BOT_PALETTE = {
  r: RAMPS.steel[0],
  R: RAMPS.steel[3],
  q: RAMPS.pink[0],
  P: RAMPS.pink[2],
  p: RAMPS.pink[1],
  s: RAMPS.steel[3],
  S: RAMPS.steel[2],
  d: RAMPS.steel[1],
  h: RAMPS.steel[4],
  W: '#ffffff',
  a: RAMPS.steel[2],
  e: RAMPS.earth[1],
  B: RAMPS.earth[2],
  b: RAMPS.earth[3],
  g: RAMPS.leaf[3],
  t: RAMPS.teal[4],
  T: RAMPS.teal[3],
  c: RAMPS.cream[4],
  C: RAMPS.cream[3],
  x: RAMPS.cream[1],
}
/** The delivery bot from above and behind, satchel on its left; frames spin wheels and kick. */
const BOT_BODY = [
  '.qPPssdSdssPPq.',
  '..a..hhhhh..a..',
  '...ahsssssSa...',
  '....hsWsssSd...',
  '....hssssSSd...',
  '....dSSSSSdd...',
  '..eBbcCCCCxd...',
  '.eBbbcCtTCxd...',
  '.eBgbcCTTCxd...',
  '.eBPbcCCCCxd...',
  '.eeBbdxxxxdd...',
  '..eee.PPPpq....',
  '......PPpq.....',
]
const BOT_FRAMES = [
  pixelSprite(
    [
      '......rRr......',
      '......rrr......',
      ...BOT_BODY,
      '......Pppq.....',
      '......pppq.....',
      '......rRr......',
      '......rrr......',
    ],
    BOT_PALETTE,
  ),
  pixelSprite(
    [
      '......rrr......',
      '......rRr......',
      ...BOT_BODY,
      '...sS.Pppq.....',
      '...dd.pppq.....',
      '......rrr......',
      '......rRr......',
    ],
    BOT_PALETTE,
  ),
] as const
const LIFE_ICON = pixelSprite(
  ['.hhhhd.', 'hsWssSd', 'hTttTSd', 'dSSSSdd', '.qPPPq.', '..r.r..'],
  BOT_PALETTE,
)

const CAT_PALETTE = {
  y: RAMPS.rust[4],
  O: RAMPS.rust[3],
  o: RAMPS.rust[2],
  t: RAMPS.rust[2],
  w: '#ffffff',
  k: INK,
  n: RAMPS.pink[3],
  m: RAMPS.rust[4],
  b: RAMPS.earth[3],
  B: RAMPS.earth[1],
  v: RAMPS.steel[3],
}
/** A cat on a skateboard, facing right (flipped when it rolls left); the tail flicks. */
const CAT_FRAMES = [
  pixelSprite(
    [
      '.........y..y.',
      '.........OyyO.',
      '.t......OOwkO.',
      '.tO.....OOOOOn',
      '..tOyyyyOOOOm.',
      '...OOOOOOOOo..',
      '...oOOoOOOoo..',
      '...ooo.oo.oo..',
      'bbbbbbbbbbbbbB',
      '.BBBBBBBBBBBB.',
      '..v.......v...',
    ],
    CAT_PALETTE,
  ),
  pixelSprite(
    [
      't........y..y.',
      '.t.......OyyO.',
      '..t.....OOwkO.',
      '..tO....OOOOOn',
      '...OyyyyOOOOm.',
      '...OOOOOOOOo..',
      '...oOOoOOOoo..',
      '....oo.oo.oo..',
      'bbbbbbbbbbbbbB',
      '.BBBBBBBBBBBB.',
      '...v.......v..',
    ],
    CAT_PALETTE,
  ),
] as const

const BIN_PALETTE = {
  L: RAMPS.leaf[4],
  l: RAMPS.leaf[3],
  D: RAMPS.leaf[1],
  h: RAMPS.leaf[3],
  G: RAMPS.leaf[2],
  g: RAMPS.leaf[1],
  d: RAMPS.leaf[0],
  y: RAMPS.gold[3],
  k: RAMPS.steel[0],
  K: RAMPS.steel[3],
}
const BIN_BODY = [
  '.LLLLLLLLLL.',
  'LllllllllllD',
  'DDDDDDDDDDDD',
  '.hGGGGGGGGd.',
  '.hGgGGGGgGd.',
  '.hGgGyyGgGd.',
  '.hGgGyyGgGd.',
  '.hGgGGGGgGd.',
  '.hGgGGGGgGd.',
  '.hGGGGGGGGd.',
  '.dddddddddd.',
]
const BIN_FRAMES = [
  pixelSprite([...BIN_BODY, '.kK......Kk.'], BIN_PALETTE),
  pixelSprite([...BIN_BODY, '.Kk......kK.'], BIN_PALETTE),
] as const

const CAR_ROWS = [
  '..yhhBBBBBBbby..',
  '.hBBBBBBBBBBBBb.',
  '.hBBBBBBBBBBBBb.',
  'khBBBBBBBBBBBBbk',
  'khBBBBBBBBBBBBbk',
  'khBBBBBBBBBBBBbk',
  'khBBBBBBBBBBBBbk',
  '.hbbbbbbbbbbbbb.',
  '.hgGGGGGGGGGGgb.',
  '.hgGWWGGGGGGGgb.',
  '.hggGWWGGGGGggb.',
  '.hggggggggggggb.',
  '.hRRRRRRRRRRRRb.',
  '.hRrrrrrrrrrrRb.',
  '.hRrrrrrrrrrrRb.',
  '.hRrrrrrrrrrrRb.',
  '.hRrrrrrrrrrrRb.',
  '.hRrrrrrrrrrrRb.',
  '.hRrrrrrrrrrrRb.',
  '.hRRRRRRRRRRRRb.',
  '.hggggggggggggb.',
  '.hgGGGGGGGGGGgb.',
  '.hbbbbbbbbbbbbb.',
  'khBBBBBBBBBBBBbk',
  'khBBBBBBBBBBBBbk',
  'khBBBBBBBBBBBBbk',
  'khBBBBBBBBBBBBbk',
  '.hBBBBBBBBBBBBb.',
  '.hBBBBBBBBBBBBb.',
  '..eebbbbbbbbee..',
]
const carSprite = (ramp: Ramp) =>
  pixelSprite(CAR_ROWS, {
    h: ramp[3],
    B: ramp[2],
    b: ramp[1],
    R: ramp[2],
    r: ramp[3],
    k: RAMPS.steel[0],
    y: RAMPS.gold[4],
    e: RAMPS.ember[2],
    g: RAMPS.night[2],
    G: RAMPS.water[2],
    W: RAMPS.water[4],
  })
const CAR_SPRITES = [
  carSprite(RAMPS.sky),
  carSprite(RAMPS.pink),
  carSprite(RAMPS.teal),
] as const

const SPRINKLER_SPRITE = pixelSprite(['..h..', '.hsS.', 'hsSSd', '.ddd.'], {
  h: RAMPS.steel[4],
  s: RAMPS.steel[3],
  S: RAMPS.steel[2],
  d: RAMPS.steel[1],
})

/** The scrolling street, PERIOD + H tall so any scroll offset covers the screen. */
function paintStreet(k: CanvasRenderingContext2D) {
  const h = H + PERIOD
  // Mown lawn stripes, edged where they meet the sidewalk.
  for (let y = 0; y < h; y += 12) {
    k.fillStyle = (y / 12) % 2 ? LAWN[0] : LAWN[1]
    k.fillRect(0, y, SIDEWALK, 12)
  }
  k.fillStyle = RAMPS.leaf[0]
  k.fillRect(SIDEWALK - 1, 0, 1, h)
  // Sidewalk slabs, lit from the upper left; the curb; the far kerb and verge.
  for (let y = 0; y < h; y += 16) {
    bevel(k, SIDEWALK, y, STREET_L - 3 - SIDEWALK, 16, CONCRETE, {
      depth: 1,
      outline: null,
    })
    bevel(k, STREET_R + 3, y, W - STREET_R - 3, 16, CONCRETE, {
      depth: 1,
      outline: null,
    })
  }
  const kerbs: [number, string][] = [
    [STREET_L - 3, CONCRETE[4]],
    [STREET_L - 2, CONCRETE[3]],
    [STREET_L - 1, CONCRETE[1]],
    [STREET_R, CONCRETE[4]],
    [STREET_R + 1, CONCRETE[3]],
    [STREET_R + 2, CONCRETE[1]],
  ]
  for (const [x, colour] of kerbs) {
    k.fillStyle = colour
    k.fillRect(x, 0, 1, h)
  }
  // Asphalt in columns: dark gutters, a lighter crown down the middle.
  const mid = (STREET_L + STREET_R) / 2
  for (let x = STREET_L; x < STREET_R; x += 4) {
    const t = Math.abs(x + 2 - mid) / ((STREET_R - STREET_L) / 2)
    k.fillStyle =
      t > 0.92 ? ASPHALT[1] : mix(ASPHALT[3], ASPHALT[2], Math.min(1, t * 1.2))
    k.fillRect(x, 0, 4, h)
  }
  // Decorations repeat each period; painting at -PERIOD too lets the edges wrap.
  for (const oy of [-PERIOD, 0, PERIOD, PERIOD * 2]) {
    const rand = backdropRng(71)
    for (let i = 0; i < 70; i++) {
      const x = 2 + Math.floor(rand() * (SIDEWALK - 8))
      const y = oy + Math.floor(rand() * PERIOD)
      k.fillStyle = RAMPS.leaf[3]
      k.fillRect(x, y, 1, 1)
      k.fillRect(x + 2, y, 1, 1)
      k.fillStyle = RAMPS.leaf[1]
      k.fillRect(x + 1, y + 1, 1, 1)
    }
    for (let i = 0; i < 12; i++) {
      const x = 2 + Math.floor(rand() * (SIDEWALK - 8))
      const y = oy + Math.floor(rand() * PERIOD)
      k.fillStyle = i % 2 ? RAMPS.pink[3] : RAMPS.cream[4]
      k.fillRect(x, y, 1, 1)
    }
    for (let i = 0; i < 260; i++) {
      const x = STREET_L + 1 + Math.floor(rand() * (STREET_R - STREET_L - 2))
      const y = oy + Math.floor(rand() * PERIOD)
      k.fillStyle = rand() < 0.15 ? ASPHALT[4] : ASPHALT[1]
      k.fillRect(x, y, 1, 1)
    }
    // Tar snakes: patched cracks wandering down the lanes.
    k.fillStyle = ASPHALT[0]
    for (let i = 0; i < 3; i++) {
      let x = STREET_L + 10 + Math.floor(rand() * 80)
      let y = oy + Math.floor(rand() * PERIOD)
      for (let s = 0; s < 14; s++) {
        k.fillRect(x, y, 1, 2)
        x += Math.floor(rand() * 3) - 1
        y += 2
      }
    }
    // Storm drains in the near gutter and bushes on the far verge.
    for (const dy of [60, 180]) {
      k.fillStyle = ASPHALT[0]
      k.fillRect(STREET_L, oy + dy, 6, 12)
      k.fillStyle = ASPHALT[3]
      for (let s = 0; s < 4; s++)
        k.fillRect(STREET_L + 1, oy + dy + 1 + s * 3, 4, 1)
    }
    for (let y = 20; y < PERIOD; y += 40)
      drawSprite(k, BUSH_SPRITE, W - 2, oy + y + ((y / 40) % 2) * 6)
    // The centre line, painted in shaded dashes.
    for (let y = 0; y < PERIOD; y += 30) {
      k.fillStyle = RAMPS.gold[1]
      k.fillRect(STREET_L + 52, oy + y + 1, 2, 14)
      k.fillStyle = RAMPS.gold[3]
      k.fillRect(STREET_L + 52, oy + y, 2, 13)
      k.fillStyle = RAMPS.gold[4]
      k.fillRect(STREET_L + 52, oy + y, 1, 12)
    }
  }
}

/** One house in its own layer: shingled roof, sided walls, windows lit for subscribers. */
function paintHouse(
  k: CanvasRenderingContext2D,
  wall: Ramp,
  roof: Ramp,
  sub: boolean,
  delivered: boolean,
) {
  const y0 = HOUSE_TOP
  // Cast shadow to the lower right.
  k.fillStyle = rgba(INK, 0.3)
  k.fillRect(59, y0 - 36, 6, 50)
  k.fillRect(12, y0 + 11, 53, 4)
  // Chimney.
  bevel(k, 44, y0 - 50, 7, 12, sub ? RAMPS.rust : GREY, { depth: 1 })
  k.fillStyle = INK
  k.fillRect(43, y0 - 51, 9, 2)
  // Walls with clapboard siding, then a stone foundation.
  bevel(k, 8, y0 - 26, 50, 36, wall)
  k.fillStyle = rgba(wall[0], 0.35)
  for (let y = y0 - 22; y < y0 + 8; y += 4) k.fillRect(10, y, 46, 1)
  k.fillStyle = CONCRETE[1]
  k.fillRect(8, y0 + 7, 50, 3)
  k.fillStyle = CONCRETE[3]
  k.fillRect(8, y0 + 7, 50, 1)
  // Roof: four courses of shingles, lit at the ridge, shadowed at the eave.
  k.fillStyle = INK
  k.fillRect(3, y0 - 43, 60, 18)
  for (let c = 0; c < 4; c++) {
    const y = y0 - 42 + c * 4
    const base = roof[c === 0 ? 3 : c === 3 ? 1 : 2]
    k.fillStyle = base
    k.fillRect(4, y, 58, 4)
    k.fillStyle = roof[c === 0 ? 4 : 3]
    k.fillRect(4, y, 58, 1)
    k.fillStyle = roof[0]
    k.fillRect(4, y + 3, 58, 1)
    for (let x = 6 + (c % 2) * 3; x < 62; x += 6) k.fillRect(x, y + 1, 1, 2)
  }
  k.fillStyle = rgba(INK, 0.35)
  k.fillRect(8, y0 - 25, 50, 2)
  // Two windows, warm and lit for subscribers, dark glass otherwise.
  for (const wx of [13, 29]) {
    const wy = y0 - 21
    k.fillStyle = INK
    k.fillRect(wx - 1, wy - 1, 13, 11)
    k.fillStyle = RAMPS.cream[4]
    k.fillRect(wx, wy, 11, 9)
    if (sub)
      bandedGradient(
        k,
        wx + 1,
        wy + 1,
        9,
        7,
        [RAMPS.gold[3], RAMPS.gold[2], RAMPS.rust[3]],
        2,
      )
    else
      bandedGradient(
        k,
        wx + 1,
        wy + 1,
        9,
        7,
        [RAMPS.night[3], RAMPS.night[1]],
        2,
      )
    k.fillStyle = sub ? RAMPS.pink[3] : GREY[1]
    k.fillRect(wx + 1, wy + 1, 2, 7)
    k.fillRect(wx + 8, wy + 1, 2, 7)
    k.fillStyle = RAMPS.cream[3]
    k.fillRect(wx + 5, wy + 1, 1, 7)
    k.fillRect(wx + 1, wy + 4, 9, 1)
    if (!sub) {
      k.fillStyle = GREY[3]
      k.fillRect(wx + 3, wy + 2, 1, 1)
      k.fillRect(wx + 4, wy + 1, 1, 1)
    }
    if (sub) {
      // A flower box: pink buds, gold once the packet arrives.
      bevel(k, wx - 1, wy + 10, 13, 3, RAMPS.earth, { depth: 1 })
      k.fillStyle = RAMPS.leaf[2]
      k.fillRect(wx, wy + 9, 11, 1)
      for (let i = 0; i < 4; i++) {
        k.fillStyle = delivered ? RAMPS.gold[3] : RAMPS.pink[3]
        k.fillRect(wx + 1 + i * 3, wy + 8, 2, 1)
        k.fillStyle = delivered ? RAMPS.gold[4] : RAMPS.pink[4]
        k.fillRect(wx + 1 + i * 3, wy + 8, 1, 1)
      }
    } else {
      k.fillStyle = CONCRETE[3]
      k.fillRect(wx - 1, wy + 10, 13, 1)
    }
  }
  // The front door, its step and a path of flagstones out to the sidewalk.
  const door: Ramp = sub ? RAMPS.earth : GREY
  bevel(k, 46, y0 - 11, 9, 19, door, { depth: 1 })
  k.fillStyle = door[1]
  k.fillRect(48, y0 - 8, 5, 6)
  k.fillRect(48, y0, 5, 5)
  k.fillStyle = INK
  k.fillRect(46, y0 - 11, 1, 1)
  k.fillRect(54, y0 - 11, 1, 1)
  k.fillStyle = RAMPS.gold[4]
  k.fillRect(53, y0 - 1, 1, 1)
  if (sub) {
    k.fillStyle = INK
    k.fillRect(41, y0 - 10, 4, 4)
    k.fillStyle = RAMPS.gold[4]
    k.fillRect(42, y0 - 9, 2, 2)
  }
  bevel(k, 56, y0 + 1, 14, 9, CONCRETE, { depth: 1 })
  k.fillStyle = sub ? RAMPS.pink[2] : GREY[1]
  k.fillRect(58, y0 + 3, 8, 4)
  k.fillStyle = sub ? RAMPS.pink[3] : GREY[2]
  k.fillRect(58, y0 + 3, 8, 1)
  for (let x = 73; x < SIDEWALK - 4; x += 9)
    bevel(k, x, y0 + 3 + ((x / 9) % 2), 6, 5, CONCRETE, { depth: 1 })
  // A bed along the foundation: flowers for subscribers, weeds otherwise.
  for (let x = 9; x < 45; x += 3) {
    const tall = (x * 7) % 5
    k.fillStyle = sub ? RAMPS.leaf[2] : RAMPS.earth[2]
    k.fillRect(x, y0 + 10, 3, 3)
    k.fillStyle = sub ? RAMPS.leaf[3] : RAMPS.leaf[1]
    k.fillRect(x + 1, y0 + 9 - (tall % 2), 1, 2)
    if (sub && tall > 1) {
      k.fillStyle = wall[3]
      k.fillRect(x, y0 + 10, 2, 1)
      k.fillStyle = wall[4]
      k.fillRect(x, y0 + 10, 1, 1)
    }
  }
}

class PetalPost implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  /** World y grows downward; the bot rides toward smaller y. */
  private by = 0
  private bx = SIDEWALK + 10
  private speed = BASE_SPEED
  private carry = CARRY
  private houses: House[] = []
  private hazards: Hazard[] = []
  private bundles: Array<{ x: number; y: number; gone: boolean }> = []
  private targets: Target[] = []
  private packets: Packet[] = []
  private routeEnd = 0
  private bonusEnd = 0
  private inBonus = false
  private crash = 0
  private safe = 0
  private dayEnd = 0
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null
  /** Cosmetic only: sparkle bursts and garden blooms, on their own rng. */
  private fx = new Sparkles()
  private fxRng = backdropRng(53)
  private blooms: Array<{ x: number; y: number; born: number }> = []

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    for (let i = 0; i < HOUSES; i++)
      this.houses.push({
        y: 0,
        subscriber: this.rng() < SUBSCRIBE_CHANCE || i === 0,
        delivered: false,
        color: HOUSE_COLORS[i % HOUSE_COLORS.length]!,
      })
    this.startDay(1)
  }

  private get camera(): number {
    return this.by - BOT_Y
  }

  // --- the route ----------------------------------------------------------------

  private startDay(day: number) {
    this.level = day
    this.by = 0
    this.bx = SIDEWALK + 10
    this.speed = BASE_SPEED
    this.carry = CARRY
    this.packets = []
    this.blooms = []
    this.inBonus = false
    this.houses.forEach((h, i) => {
      h.y = -FIRST_HOUSE - i * HOUSE_GAP
      h.delivered = false
    })
    this.routeEnd = -FIRST_HOUSE - HOUSES * HOUSE_GAP
    this.bonusEnd = this.routeEnd - BONUS_LEN
    this.hazards = []
    this.bundles = []
    this.targets = []
    const per = levelCurve(day, POST_CURVES.hazards)
    const traffic = levelCurve(day, POST_CURVES.traffic)
    for (
      let y = -FIRST_HOUSE + 60;
      y > this.bonusEnd + 60;
      y -= HOUSE_GAP / 2
    ) {
      if (this.rng() < per / 2) this.addHazard(y - this.rng() * 40, traffic)
      if (y > this.routeEnd && this.rng() < 0.22)
        this.bundles.push({
          x: SIDEWALK + 10 + this.rng() * 80,
          y: y - 30,
          gone: false,
        })
    }
    for (let i = 0; i < 8; i++)
      this.targets.push({
        x: 30 + (i % 3) * 22,
        y: this.routeEnd - 60 - i * 80,
        hit: false,
      })
    const subs = this.houses.filter((h) => h.subscriber).length
    this.banner = {
      text: `DAY ${day}`,
      sub: `${subs} HOUSES ON YOUR ROUTE`,
      ticks: 110,
    }
  }

  private addHazard(y: number, traffic: number) {
    const roll = this.rng()
    const kind: HazardKind =
      roll < 0.3
        ? 'cat'
        : roll < 0.55
          ? 'bin'
          : roll < 0.8
            ? 'car'
            : 'sprinkler'
    if (kind === 'cat')
      this.hazards.push({
        kind,
        x: STREET_L + this.rng() * 80,
        y,
        vx: (this.rng() < 0.5 ? -1 : 1) * traffic,
        vy: 0,
        w: 12,
        h: 8,
        gone: false,
      })
    else if (kind === 'bin')
      this.hazards.push({
        kind,
        x: STREET_L + 10 + this.rng() * 70,
        y,
        vx: 0,
        vy: traffic * 0.8,
        w: 10,
        h: 12,
        gone: false,
      })
    else if (kind === 'car')
      this.hazards.push({
        kind,
        x: STREET_R - 26 + this.rng() * 6,
        y,
        vx: 0,
        vy: 0,
        w: 18,
        h: 32,
        gone: false,
      })
    else
      this.hazards.push({
        kind,
        x: 92,
        y,
        vx: 0,
        vy: 0,
        w: 4,
        h: 4,
        gone: false,
      })
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    if (this.dayEnd > 0) {
      if (--this.dayEnd === 0) this.startDay(this.level + 1)
      return
    }
    if (this.crash > 0) {
      if (--this.crash === 0) {
        if (this.lives <= 0) this.gameOver('OUT OF DELIVERY BOTS')
        else this.safe = SAFE_TICKS
      }
      return
    }
    if (this.safe > 0) this.safe--
    const controls = this.demo ? this.demoInput() : input
    this.ride(controls)
    this.updateHazards()
    this.updatePackets()
    if (!this.inBonus && this.by < this.routeEnd) {
      this.inBonus = true
      this.banner = {
        text: 'BONUS RUN!',
        sub: 'TOSS AT THE TARGETS',
        ticks: 90,
      }
      this.sound.play('start')
    }
    if (this.by < this.bonusEnd) this.endDay()
  }

  private ride(input: InputFrame) {
    if (input.held.up) this.speed = Math.min(MAX_SPEED, this.speed + 0.04)
    else if (input.held.down)
      this.speed = Math.max(MIN_SPEED, this.speed - 0.05)
    else this.speed += (BASE_SPEED - this.speed) * 0.03
    if (input.held.left) this.bx = Math.max(MIN_X, this.bx - STEER)
    if (input.held.right) this.bx = Math.min(MAX_X, this.bx + STEER)
    this.by -= this.speed
    if (input.pressed.a && this.carry > 0) {
      this.carry--
      this.packets.push({
        x: this.bx - 6,
        y: this.by - 4,
        vy: -this.speed,
        t: 0,
      })
      this.sound.play('shoot')
    }
    for (const b of this.bundles) {
      if (
        b.gone ||
        Math.abs(b.x - this.bx) > 10 ||
        Math.abs(b.y - this.by) > 10
      )
        continue
      b.gone = true
      this.carry = CARRY
      this.fx.burst(this.bx, BOT_Y - 4, this.fxRng, {
        count: 8,
        colours: [RAMPS.pink[3], RAMPS.gold[4], RAMPS.pink[4]],
      })
      this.floaters.push({
        x: this.bx,
        y: BOT_Y - 16,
        text: 'REFILL',
        life: 40,
      })
      this.sound.play('pickup')
    }
  }

  private updateHazards() {
    for (const h of this.hazards) {
      if (h.gone) continue
      // Things only start moving once they are nearly on screen.
      const sy = h.y - this.camera
      if (sy > -40) {
        h.x += h.vx
        h.y += h.vy
        if (h.kind === 'cat' && (h.x < SIDEWALK || h.x > STREET_R - 10))
          h.vx = -h.vx
      }
      if (this.safe > 0) continue
      if (h.kind === 'sprinkler') {
        // The spray sweeps out over the sidewalk half the time.
        const on = Math.floor((this.tick + h.y) / 90) % 2 === 0
        if (on && this.bx < SIDEWALK + 18 && Math.abs(h.y - this.by) < 10)
          this.crashBot('SOAKED BY A SPRINKLER', h)
        continue
      }
      if (
        Math.abs(h.x - this.bx) < h.w / 2 + 5 &&
        Math.abs(h.y - this.by) < h.h / 2 + 7
      )
        this.crashBot(
          h.kind === 'cat'
            ? 'A CAT ON A SKATEBOARD!'
            : h.kind === 'bin'
              ? 'HIT A ROLLING BIN'
              : 'BUMPED A PARKED CAR',
          h,
        )
    }
    this.hazards = this.hazards.filter(
      (h) => !h.gone && h.y - this.camera < H + 60,
    )
  }

  private updatePackets() {
    for (const p of this.packets) {
      p.t++
      p.x -= TOSS_VX
      p.y += p.vy
      // A mailbox catches it on the way past, then the doorstep, then the garden.
      for (const h of this.houses) {
        if (h.delivered && h.subscriber) continue
        const mailY = h.y + 22
        if (
          h.subscriber &&
          Math.abs(p.x - MAILBOX_X) < 5 &&
          Math.abs(p.y - mailY) < 9
        ) {
          this.deliver(h, MAILBOX_POINTS, 'MAILBOX!', p)
          break
        }
      }
      for (const t of this.targets) {
        if (!t.hit && Math.abs(p.x - t.x) < 7 && Math.abs(p.y - t.y) < 7) {
          t.hit = true
          p.t = 999
          this.addScore(TARGET_POINTS, t.x, t.y - this.camera - 10)
          this.sparkle(t.x, t.y - this.camera, '#fde047')
          this.fx.burst(t.x, t.y - this.camera, this.fxRng, {
            count: 10,
            colours: [RAMPS.gold[4], RAMPS.ember[3], '#ffffff'],
          })
          this.sound.play('pop')
        }
      }
      if (p.t === TOSS_TICKS) this.land(p)
    }
    this.packets = this.packets.filter((p) => p.t < TOSS_TICKS)
  }

  private land(p: Packet) {
    const house = this.houses.find((h) => Math.abs(p.y - h.y) < 30)
    if (!house || p.x > MAILBOX_X) return
    if (house.subscriber && !house.delivered) {
      if (Math.abs(p.x - DOOR_X) < 14 && Math.abs(p.y - house.y) < 14)
        this.deliver(house, DOOR_POINTS, 'DOORSTEP', p)
      else {
        this.deliver(house, GARDEN_POINTS * 2, 'ON THE LAWN', p)
        this.blooms.push({ x: p.x, y: p.y, born: this.tick })
      }
    } else if (!house.subscriber) {
      this.addScore(GARDEN_POINTS, p.x, p.y - this.camera - 8)
      this.sparkle(p.x, p.y - this.camera, '#86efac')
      this.fx.burst(p.x, p.y - this.camera, this.fxRng, {
        count: 5,
        colours: [RAMPS.leaf[3], RAMPS.leaf[4]],
        speed: 1,
      })
      this.blooms.push({ x: p.x, y: p.y, born: this.tick })
    }
  }

  private deliver(h: House, points: number, label: string, p: Packet) {
    h.delivered = true
    p.t = 999
    this.addScore(points, p.x, p.y - this.camera - 10)
    this.floaters.push({
      x: Math.max(40, p.x + 4),
      y: p.y - this.camera - 20,
      text: label,
      life: 40,
    })
    this.sparkle(p.x, p.y - this.camera, h.color)
    this.fx.burst(p.x, p.y - this.camera, this.fxRng, {
      count: 12,
      colours: [
        RAMPS.gold[4],
        (HOUSE_LOOKS[h.color] ?? { wall: RAMPS.pink }).wall[3],
        RAMPS.pink[3],
      ],
    })
    this.sound.play('pickup')
  }

  private endDay() {
    if (this.dayEnd > 0 || this.over) return
    let missed = 0
    for (const h of this.houses)
      if (h.subscriber && !h.delivered) {
        h.subscriber = false
        missed++
      }
    const subs = this.houses.filter((h) => h.subscriber).length
    let sub = `${missed} CANCELLED`
    if (missed === 0) {
      const bonus = PERFECT_POINTS * this.level
      this.addScore(bonus, W / 2, 120)
      this.fx.burst(W / 2, 120, this.fxRng, { count: 24, speed: 2.4 })
      const grey = this.houses.filter((h) => !h.subscriber)
      if (grey.length)
        grey[Math.floor(this.rng() * grey.length)]!.subscriber = true
      sub = `PERFECT DAY  +${bonus}  A NEIGHBOUR SIGNS UP`
    }
    this.sound.play('level')
    if (subs === 0) {
      this.gameOver('NO SUBSCRIBERS LEFT')
      return
    }
    this.dayEnd = DAY_END_TICKS
    this.banner = { text: 'END OF THE DAY', sub, ticks: DAY_END_TICKS }
  }

  private crashBot(why: string, h: Hazard) {
    this.sparkle(this.bx, BOT_Y, '#fb923c')
    this.fx.burst(this.bx, BOT_Y, this.fxRng, {
      count: 10,
      colours: [RAMPS.ember[3], RAMPS.ember[4], RAMPS.gold[4]],
    })
    this.sound.play('die')
    if (h.kind !== 'sprinkler' && h.kind !== 'car') h.gone = true
    if (this.inBonus) {
      // On the bonus run a crash just ends the run.
      this.by = this.bonusEnd - 1
      this.endDay()
      return
    }
    this.lives--
    this.crash = CRASH_TICKS
    // Step back onto the sidewalk to carry on.
    if (h.kind === 'car') this.bx = SIDEWALK + 10
    this.banner = {
      text: 'CRASH!',
      sub: this.lives > 0 ? `${why}  ${this.lives} LEFT` : why,
      ticks: CRASH_TICKS,
    }
  }

  private gameOver(why: string) {
    this.over = true
    this.banner = { text: why, sub: 'GAME OVER', ticks: 9999 }
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x: number, y: number) {
    if (this.demo || points <= 0) return
    this.score += points
    // Keep labels clear of the screen edges.
    this.floaters.push({
      x: Math.max(20, Math.min(W - 20, x)),
      y,
      text: String(points),
      life: 45,
    })
  }

  private sparkle(x: number, y: number, color: string) {
    for (let i = 0; i < 10; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.4 + this.rng() * 1.4
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 0.5,
        life: 22 + Math.floor(this.rng() * 12),
        color,
      })
    }
  }

  private updateEffects() {
    this.fx.update()
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.04
      p.life--
    }
    this.particles = this.particles.filter((p) => p.life > 0)
    for (const f of this.floaters) {
      f.y -= 0.3
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
  }

  // --- attract-mode pilot -----------------------------------------------------

  /**
   * Rides the sidewalk at an even pace, sidesteps whatever is ahead, grabs
   * bundles when low, and tosses so the packet crosses each subscriber's
   * mailbox (or a bonus target) on the way past.
   */
  private demoInput(): InputFrame {
    const held = {
      up: false,
      down: false,
      left: false,
      right: false,
      a: false,
      b: false,
      start: false,
    }
    const frame: InputFrame = { held, pressed: { ...held } }
    // Where would a packet thrown now cross the mailbox line?
    const ticks = (this.bx - 6 - MAILBOX_X) / TOSS_VX
    const crossY = this.by - 4 - this.speed * ticks
    const flying = this.packets.length > 0
    for (const h of this.houses) {
      if (!h.subscriber || h.delivered || flying) continue
      if (Math.abs(crossY - (h.y + 22)) < 4) {
        held.a = true
        frame.pressed.a = true
      }
    }
    for (const t of this.targets) {
      if (t.hit || flying) continue
      const tt = (this.bx - 6 - t.x) / TOSS_VX
      if (
        tt > 0 &&
        tt < TOSS_TICKS &&
        Math.abs(this.by - 4 - this.speed * tt - t.y) < 4
      ) {
        held.a = true
        frame.pressed.a = true
      }
    }
    // Lane choice: the sidewalk by default, a bundle when running low.
    let wantX = SIDEWALK + 22
    const bundle = this.bundles.find(
      (b) => !b.gone && b.y < this.by && this.by - b.y < 120,
    )
    if (bundle && this.carry < 4) wantX = bundle.x
    // Dodge anything in the way over the next stretch.
    for (const hz of this.hazards) {
      if (hz.gone) continue
      const ahead = this.by - hz.y
      if (ahead < -10 || ahead > 70) continue
      if (hz.kind === 'sprinkler') {
        if (Math.floor((this.tick + hz.y) / 90) % 2 === 0 || ahead < 40)
          wantX = Math.max(wantX, SIDEWALK + 26)
        continue
      }
      const futureX = hz.x + hz.vx * (ahead / this.speed)
      if (Math.abs(futureX - wantX) < hz.w / 2 + 12)
        wantX =
          futureX > (MIN_X + MAX_X) / 2
            ? futureX - hz.w / 2 - 16
            : futureX + hz.w / 2 + 16
    }
    wantX = Math.max(MIN_X, Math.min(MAX_X, wantX))
    if (wantX < this.bx - 2) held.left = true
    if (wantX > this.bx + 2) held.right = true
    return frame
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    const cam = Math.round(this.camera)
    this.renderStreet(g, cam)
    for (const b of this.blooms) this.renderBloom(g, b, cam)
    for (const h of this.houses) this.renderYard(g, h.y - cam)
    for (const h of this.houses) this.renderHouse(g, h.y - cam, h)
    for (const t of this.targets) this.renderTarget(g, t, cam)
    for (const b of this.bundles) {
      if (b.gone) continue
      const sy = b.y - cam
      if (sy < -10 || sy > H + 10) continue
      const bob = Math.round(Math.sin(this.tick / 9 + b.x) * 1.5)
      dropShadow(g, b.x + 1, sy + 6, 6, 1.5, 0.35)
      glow(
        g,
        b.x,
        sy + bob,
        12,
        RAMPS.gold[3],
        0.3 + 0.12 * Math.sin(this.tick / 7),
      )
      drawSprite(g, BUNDLE_SPRITE, b.x, sy - 1 + bob)
    }
    for (const hz of this.hazards)
      if (hz.kind === 'sprinkler') this.renderHazard(g, hz, cam)
    for (const hz of this.hazards)
      if (hz.kind !== 'sprinkler') this.renderHazard(g, hz, cam)
    for (const p of this.packets) this.renderPacket(g, p, cam)
    if (this.crash > 0) this.renderCrash(g)
    else if (this.safe === 0 || Math.floor(this.safe / 4) % 2) this.renderBot(g)
    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, Math.min(1, p.life / 30))
      g.fillStyle = INK
      g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 3, 3)
      g.fillStyle = p.color
      g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 2, 2)
      g.fillStyle = '#ffffff'
      g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 1, 1)
    }
    g.globalAlpha = 1
    this.fx.render(g)
    for (const f of this.floaters)
      drawText(g, f.text, f.x, f.y, {
        align: 'center',
        color: RAMPS.gold[3],
        outline: INK,
      })
    vignette(g, W, H, 0.28)
    this.renderHud(g)
  }

  private renderStreet(g: CanvasRenderingContext2D, cam: number) {
    // One cached strip of lawn, sidewalk and road, slid by the scroll.
    const off = (((-cam % PERIOD) + PERIOD) % PERIOD) - PERIOD
    g.save()
    g.translate(0, off)
    cachedLayer(g, 'petal-post-street', W, H + PERIOD, paintStreet)
    g.restore()
  }

  private renderBloom(
    g: CanvasRenderingContext2D,
    b: { x: number; y: number; born: number },
    cam: number,
  ) {
    const sy = b.y - cam
    if (sy < -10 || sy > H + 10) return
    const age = this.tick - b.born
    const sprite =
      age < 10
        ? SPROUT_SPRITE
        : BLOOM_SPRITES[Math.abs(Math.round(b.x + b.y)) % BLOOM_SPRITES.length]!
    dropShadow(g, b.x + 1, sy + 1, 3, 1, 0.3)
    drawSprite(g, sprite, b.x, sy + 1, { anchor: 'feet' })
  }

  private renderYard(g: CanvasRenderingContext2D, sy: number) {
    // A shade tree and a bush in the yard below each house.
    if (sy < -75 || sy > H) return
    dropShadow(g, 26, sy + 60, 11, 4, 0.3)
    drawSprite(g, TREE_SPRITE, 22, sy + 52)
    dropShadow(g, 80, sy + 48, 6, 2, 0.3)
    drawSprite(g, BUSH_SPRITE, 78, sy + 44)
  }

  private renderHouse(g: CanvasRenderingContext2D, sy: number, h: House) {
    if (sy < -40 || sy > H + 55) return
    const sub = h.subscriber
    const look = HOUSE_LOOKS[h.color] ?? {
      wall: RAMPS.pink,
      roof: RAMPS.purple,
    }
    const wall = sub ? look.wall : GREY
    const roof = sub ? look.roof : RAMPS.steel
    const key = sub
      ? `petal-post-house-${h.color}-${h.delivered ? 'done' : 'due'}`
      : 'petal-post-house-grey'
    g.save()
    g.translate(0, sy - HOUSE_TOP)
    cachedLayer(g, key, SIDEWALK, HOUSE_LAYER_H, (k) =>
      paintHouse(k, wall, roof, sub, h.delivered),
    )
    g.restore()
    if (sub) {
      // Warm light spilling from the windows and the porch lamp.
      const pulse = 0.18 + 0.05 * Math.sin(this.tick / 20 + h.y)
      glow(g, 18, sy - 17, 12, RAMPS.gold[3], pulse)
      glow(g, 34, sy - 17, 12, RAMPS.gold[3], pulse)
      glow(g, 42, sy - 8, 7, RAMPS.gold[4], 0.35)
    }
    // The mailbox by the sidewalk: flag up once delivered; a beacon while it waits.
    const my = sy + 22
    if (sub && !h.delivered)
      glow(
        g,
        MAILBOX_X - 1,
        my - 2,
        11,
        RAMPS.gold[4],
        0.3 + 0.18 * Math.sin(this.tick / 6),
      )
    dropShadow(g, MAILBOX_X + 1, my + 8, 4, 1.2, 0.35)
    drawSprite(
      g,
      !sub ? MAILBOX_GREY : h.delivered ? MAILBOX_DELIVERED : MAILBOX_WAITING,
      MAILBOX_X,
      my + 9,
      { anchor: 'feet' },
    )
  }

  private renderTarget(g: CanvasRenderingContext2D, t: Target, cam: number) {
    const sy = t.y - cam
    if (sy < -12 || sy > H + 12) return
    dropShadow(g, t.x + 2, sy + 7, 7, 2, 0.35)
    if (!t.hit) glow(g, t.x, sy, 13, RAMPS.ember[3], 0.18)
    drawSprite(g, t.hit ? TARGET_HIT_SPRITE : TARGET_SPRITE, t.x, sy)
  }

  private renderHazard(g: CanvasRenderingContext2D, hz: Hazard, cam: number) {
    const sy = hz.y - cam
    if (sy < -40 || sy > H + 40) return
    const frame = Math.floor(this.tick / 6) % 2
    if (hz.kind === 'cat') {
      dropShadow(g, hz.x, sy + 7, 7, 1.5)
      drawSprite(g, CAT_FRAMES[frame]!, hz.x, sy - 1, { flipX: hz.vx < 0 })
    } else if (hz.kind === 'bin') {
      dropShadow(g, hz.x + 1, sy + 7, 6, 1.5)
      drawSprite(g, BIN_FRAMES[frame]!, hz.x, sy)
    } else if (hz.kind === 'car') {
      g.fillStyle = rgba(INK, 0.35)
      g.fillRect(Math.round(hz.x) - 6, Math.round(sy) - 13, 18, 32)
      const sprite =
        CAR_SPRITES[Math.abs(Math.floor(hz.y)) % CAR_SPRITES.length]!
      drawSprite(g, sprite, hz.x, sy)
    } else {
      const phase = (((this.tick + hz.y) % 180) + 180) % 180
      const on = Math.floor((this.tick + hz.y) / 90) % 2 === 0
      dropShadow(g, hz.x, sy + 2, 3, 1, 0.3)
      drawSprite(g, SPRINKLER_SPRITE, hz.x, sy, {
        anchor: 'feet',
      })
      if (on) {
        // A sweeping fan of spray out over the sidewalk.
        const sweep = Math.sin(this.tick / 8) * 6
        const tipX = SIDEWALK + 20
        g.fillStyle = rgba(RAMPS.water[3], 0.28)
        g.beginPath()
        g.moveTo(hz.x, sy)
        g.lineTo(tipX, sy - 8 + sweep)
        g.lineTo(tipX, sy + 8 + sweep)
        g.closePath()
        g.fill()
        for (let ray = 0; ray < 5; ray++) {
          const endY = sy - 8 + sweep + ray * 4
          for (let d = 0; d < 4; d++) {
            const t = (this.tick * 0.05 + d / 4 + ray * 0.13) % 1
            const px = Math.round(hz.x + (tipX - hz.x) * t)
            const py = Math.round(
              sy + (endY - sy) * t - Math.sin(t * Math.PI) * 4,
            )
            g.fillStyle = RAMPS.water[2]
            g.fillRect(px, py + 1, 2, 1)
            g.fillStyle = RAMPS.water[4]
            g.fillRect(px, py, 2, 1)
          }
        }
        glow(g, tipX - 2, sy + sweep, 10, RAMPS.water[3], 0.3)
      } else if (phase > 160) {
        // Sputtering: about to come on.
        g.fillStyle = RAMPS.water[4]
        g.fillRect(
          Math.round(hz.x) + (frame ? 1 : -2),
          Math.round(sy) - 6,
          1,
          2,
        )
      }
    }
  }

  private renderPacket(g: CanvasRenderingContext2D, p: Packet, cam: number) {
    const sy = p.y - cam
    const lift = Math.sin((p.t / TOSS_TICKS) * Math.PI) * 10
    dropShadow(g, p.x, sy + 1, 3 - lift * 0.12, 1, 0.3)
    // A trail of petals behind the toss.
    g.fillStyle = RAMPS.pink[3]
    for (let i = 1; i <= 2; i++) {
      g.globalAlpha = 0.6 / i
      g.fillRect(Math.round(p.x + i * 4), Math.round(sy - lift + i), 2, 1)
    }
    g.globalAlpha = 1
    glow(g, p.x, sy - lift, 8, RAMPS.pink[3], 0.5)
    drawSprite(g, PACKET_FRAMES[Math.floor(p.t / 5) % 2]!, p.x, sy - lift)
  }

  private renderBot(g: CanvasRenderingContext2D) {
    const x = Math.round(this.bx)
    const y = BOT_Y
    const frame = Math.floor(this.tick / 6) % 2
    // Dust kicked up behind the back wheel, and speed lines when racing.
    for (let i = 0; i < 3; i++) {
      const age = (this.tick + i * 6) % 18
      g.globalAlpha = 0.45 * (1 - age / 18)
      g.fillStyle = CONCRETE[4]
      const side = ((i % 2) * 2 - 1) * Math.floor(age / 4)
      g.fillRect(x + side - 1, y + 11 + Math.floor(age / 2), 2, 1)
      g.fillRect(x + side, y + 10 + Math.floor(age / 2), 1, 3)
    }
    g.globalAlpha = 1
    if (this.speed > 1.7) {
      g.fillStyle = rgba('#ffffff', 0.55)
      for (let i = 0; i < 3; i++) {
        const ly = y - 4 + ((this.tick * 3 + i * 7) % 20)
        g.fillRect(x - 11 - i, ly, 1, 5)
        g.fillRect(x + 11 + i, ly + 3, 1, 5)
      }
    }
    dropShadow(g, x + 1, y + 10, 6, 2)
    drawSprite(g, BOT_FRAMES[frame]!, x, y + (frame ? 0 : -1))
  }

  private renderCrash(g: CanvasRenderingContext2D) {
    // Tipped over (a flip, never a rotation), seeing stars.
    const x = Math.round(this.bx)
    dropShadow(g, x + 1, BOT_Y + 9, 8, 2)
    drawSprite(g, BOT_FRAMES[0], x, BOT_Y, { flipY: true })
    for (let i = 0; i < 3; i++) {
      const a = this.tick / 8 + (i * Math.PI * 2) / 3
      const sx = Math.round(x + Math.cos(a) * 10)
      const sy = Math.round(BOT_Y - 12 + Math.sin(a) * 3)
      g.fillStyle = RAMPS.gold[3]
      g.fillRect(sx - 1, sy, 3, 1)
      g.fillRect(sx, sy - 1, 1, 3)
      g.fillStyle = '#ffffff'
      g.fillRect(sx, sy, 1, 1)
    }
  }

  private renderHud(g: CanvasRenderingContext2D) {
    bandedGradient(g, 0, 0, W, HUD_H, [RAMPS.night[2], RAMPS.night[0]], 2)
    g.fillStyle = INK
    g.fillRect(0, HUD_H, W, 1)
    hudPanel(g, 2, 2, 80, 20)
    drawText(g, String(this.score).padStart(6, '0'), 7, 5, {
      scale: 2,
      color: RAMPS.gold[3],
      shadow: INK,
    })
    // Homes on the route and the packets left in the satchel.
    hudPanel(g, 86, 2, 66, 20)
    const subs = this.houses.filter((h) => h.subscriber).length
    drawText(g, `HOMES ${subs}`, 90, 4, {
      color: RAMPS.pink[3],
      outline: INK,
    })
    for (let i = 0; i < CARRY; i++)
      drawSprite(g, PACKET_ICON, 89 + i * 6, 13, {
        anchor: 'topleft',
        alpha: i < this.carry ? 1 : 0.25,
      })
    const spare = Math.min(this.lives - 1, 4)
    if (spare > 0) {
      hudPanel(g, 155, 2, 35, 20)
      for (let i = 0; i < spare; i++)
        drawSprite(g, LIFE_ICON, 156 + i * 8, 8, { anchor: 'topleft' })
    }
    hudPanel(g, 193, 2, 61, 20)
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W - 6, 4, {
      align: 'right',
      color: RAMPS.pink[3],
      outline: INK,
    })
    drawText(g, `DAY ${this.level}`, W - 6, 13, {
      align: 'right',
      color: RAMPS.leaf[3],
      outline: INK,
    })
    if (this.banner) {
      const sub = this.banner.sub
      const bw = Math.min(
        W - 8,
        Math.max(measureText(this.banner.text, 2), sub ? measureText(sub) : 0) +
          16,
      )
      hudPanel(g, Math.round((W - bw) / 2), 84, bw, sub ? 38 : 24)
      drawText(g, this.banner.text, W / 2, 89, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.purple[1],
      })
      if (sub)
        drawText(g, sub, W / 2, 109, {
          align: 'center',
          color: RAMPS.gold[3],
          outline: INK,
        })
    }
  }
}

const petalPost: ArcadeGameModule = {
  create: (options) => new PetalPost(options),
}

export const create = petalPost.create
export default petalPost
