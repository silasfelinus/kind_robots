// /utils/arcade/games/prizeShowPanic.ts
//
// Prize Show Panic -- the Kind Robots Arcade's Smash TV riff (conductor
// kr-arcade/t-009 game factory). Sparkle, a contestant robot on a game show,
// is stuck in a studio that floods with party crashers. Confetti cannons make
// the crashers happy (they dance off the set), prizes drop for the grabbing,
// and the exit door opens once the room is clear: reach it before the host's
// countdown runs out. Every fourth studio ends in a parade float boss.
//
// The arrows move (eight ways) and A fires confetti the way Sparkle faces.
// Hold B to lock the aim while moving, the single-stick stand-in for the
// classic's twin sticks: strafe one way, spray another.

import { levelCurve } from '../curve'
import { drawText } from '../font'
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
  gauge,
  glow,
  hudPanel,
  mix,
  pixelSprite,
  rgba,
  shadedOrb,
  vignette,
} from '../snes'
import type { PixelSprite, Ramp } from '../snes'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'

const W = 320
const H = 240
const HUD = 16
const WALL = 10
const LEFT = WALL
const RIGHT = W - WALL
const TOP = HUD + WALL
const BOTTOM = H - WALL
const DOOR = 18
const CX = W / 2
const CY = (TOP + BOTTOM) / 2

const SPEED = 1.6
const HALF = 5
const SHOT_SPEED = 4.5
const SHOT_LIFE = 50
const FIRE_COOLDOWN = 7
const RAPID_COOLDOWN = 4
const POWER_TICKS = 60 * 10
const SHIELD_TICKS = 60 * 8
const ROOM_TICKS = 60 * 60
const START_LIVES = 3
const EXTRA_EVERY = 50_000
const DEATH_TICKS = 100
const TRANSITION_TICKS = 70
const INVULN_TICKS = 120
const PRIZE_LIFE = 60 * 7

export const PANIC_CURVES = {
  /** Ticks of crashers streaming in at the start of each room. */
  waveTicks: { start: 60 * 22, step: 60 * 2, limit: 60 * 36 },
  spawnEvery: { start: 55, step: -4, limit: 18 },
  grabberSpeed: { start: 0.55, step: 0.05, limit: 1.1 },
  bossHp: { start: 50, step: 25, limit: 200 },
} as const

type Dir = { x: number; y: number }
type Kind = 'grabber' | 'bouncer' | 'conga' | 'thrower'
type Crasher = {
  kind: Kind
  x: number
  y: number
  vx: number
  vy: number
  hp: number
  t: number
  /** Conga dancers follow the one in front. */
  leader: Crasher | null
  color: string
}
type Dancer = { x: number; y: number; vx: number; life: number; color: string }
type Shot = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  hue: number
}
type Streamer = { x: number; y: number; vx: number; vy: number; life: number }
type PrizeKind = 'cash' | 'toaster' | 'car' | 'spread' | 'rapid' | 'shield'
type Prize = { x: number; y: number; kind: PrizeKind; life: number }
type Boss = {
  x: number
  y: number
  vx: number
  hp: number
  maxHp: number
  t: number
  flash: number
}
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = { x: number; y: number; text: string; life: number }

const CONFETTI = [
  '#f472b6',
  '#facc15',
  '#4ade80',
  '#38bdf8',
  '#a78bfa',
  '#fb923c',
]
const PRIZE_POINTS: Record<PrizeKind, number> = {
  cash: 500,
  toaster: 1000,
  car: 5000,
  spread: 250,
  rapid: 250,
  shield: 250,
}
const KIND_POINTS: Record<Kind, number> = {
  grabber: 100,
  bouncer: 150,
  conga: 75,
  thrower: 250,
}
/** The four doors, by side: where crashers come in and the exit opens. */
const DOORS: Array<{ x: number; y: number; side: number }> = [
  { x: CX, y: TOP, side: 0 },
  { x: RIGHT, y: CY, side: 1 },
  { x: CX, y: BOTTOM, side: 2 },
  { x: LEFT, y: CY, side: 3 },
]

// --- 16-bit art (utils/arcade/snes.ts) -------------------------------------------

/** A five-step ramp around one party colour, from deep shadow to highlight. */
function tint(hex: string): Ramp {
  return [
    mix(hex, INK, 0.7),
    mix(hex, INK, 0.4),
    hex,
    mix(hex, '#ffffff', 0.45),
    mix(hex, '#ffffff', 0.8),
  ]
}

const TINTS = new Map<string, Ramp>()
/** The party ramp for a colour, worked out once and kept. */
function tintOf(hex: string): Ramp {
  let ramp = TINTS.get(hex)
  if (!ramp) TINTS.set(hex, (ramp = tint(hex)))
  return ramp
}

/** Lay stamps of palette letters over a blank grid, later stamps on top ('.' is clear). */
function compose(
  w: number,
  h: number,
  stamps: readonly (readonly [number, number, readonly string[]])[],
): string[] {
  const grid = Array.from({ length: h }, () => new Array<string>(w).fill('.'))
  for (const [x, y, rows] of stamps) {
    rows.forEach((row, dy) => {
      const line = grid[y + dy]
      if (!line) return
      for (let dx = 0; dx < row.length; dx++) {
        const ch = row[dx]!
        if (ch !== '.' && x + dx >= 0 && x + dx < w) line[x + dx] = ch
      }
    })
  }
  return grid.map((line) => line.join(''))
}

/** The ramp step (0..4) a surface facing (nx, ny) catches, lit from the upper left. */
function litStep(nx: number, ny: number, base = 2, spread = 1.6): number {
  const light = -(nx * 0.6 + ny * 0.8)
  return Math.max(0, Math.min(4, Math.round(base + light * spread)))
}

/** A lit ball of ramp letters (`letters` runs shadow to highlight) centred on (cx, cy). */
function ballStamp(
  w: number,
  h: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  letters: string,
): string[] {
  return Array.from({ length: h }, (_, y) =>
    Array.from({ length: w }, (_, x) => {
      const nx = (x + 0.5 - cx) / rx
      const ny = (y + 0.5 - cy) / ry
      if (nx * nx + ny * ny > 1) return '.'
      return letters[litStep(nx, ny)]!
    }).join(''),
  )
}

/** Rows turned on their side: a sprite pointing up becomes one pointing left. */
function transpose(rows: readonly string[]): string[] {
  const w = Math.max(...rows.map((r) => r.length))
  return Array.from({ length: w }, (_, x) =>
    rows.map((r) => r[x] ?? '.').join(''),
  )
}

// Sparkle, the contestant: gold body, cream face plate, pink bow tie, steel limbs. Built per
// view (front, back, side facing right) with an idle pose and two walking frames.
const HERO_PALETTE = {
  p: RAMPS.pink[3],
  P: RAMPS.pink[2],
  q: RAMPS.pink[1],
  s: RAMPS.steel[3],
  S: RAMPS.steel[2],
  t: RAMPS.steel[1],
  h: RAMPS.gold[4],
  H: RAMPS.gold[3],
  G: RAMPS.gold[2],
  g: RAMPS.gold[1],
  d: RAMPS.gold[0],
  F: RAMPS.cream[3],
  f: RAMPS.cream[2],
  k: INK,
  c: RAMPS.teal[3],
}
const HERO_FRONT = [
  '.....pp.....',
  '.....ss.....',
  '..hhhhhhhh..',
  '.hHHHHHHHHg.',
  '.hGFFFFFFGg.',
  '.hGFkFFkFGg.',
  '.hGFkFFkFGg.',
  '.hGpFkkFpGg.',
  '.gGGGGGGGGd.',
  '..tpPqqPpt..',
  '.SshGGGGgsS.',
  '.SsGGccGGsS.',
  '.tSgGGGGgSt.',
  '...dggggd...',
]
const HERO_BACK = [
  '.....pp.....',
  '.....ss.....',
  '..hhhhhhhh..',
  '.hHHHHHHHHg.',
  '.hGGGGGGGGg.',
  '.hGGggggGGg.',
  '.hGGggggGGg.',
  '.hGGGGGGGGg.',
  '.gGGGGGGGGd.',
  '..tGGGGGGt..',
  '.SshGGGGgsS.',
  '.SsGGGGGGsS.',
  '.tSgGGGGgSt.',
  '...dggggd...',
]
const HERO_SIDE = [
  '......pp....',
  '......s.....',
  '...hhhhhhh..',
  '..hHHHHHHHg.',
  '..hGGGFFFFF.',
  '..hGGGFFFkF.',
  '..hGGGFFFkF.',
  '..hGGGFFpFF.',
  '..gGGGGGGGd.',
  '....tGGPq...',
  '...hGSSGg...',
  '...GGSsGg...',
  '...gGStGd...',
  '....dggd....',
]
const FRONT_LEGS = [
  ['...SS..SS...', '...tt..tt...'],
  ['...SS..SS...', '...tt...tt..'],
  ['...SS..SS...', '..tt...tt...'],
] as const
const SIDE_LEGS = [
  ['....SS.S....', '....tt.tt...'],
  ['...SS..SS...', '..tt....tt..'],
  ['.....SS.....', '....ttt.....'],
] as const
type View = 'front' | 'back' | 'side'
const HERO_SPRITES: Record<View, readonly PixelSprite[]> = {
  front: FRONT_LEGS.map((legs) =>
    pixelSprite([...HERO_FRONT, ...legs], HERO_PALETTE),
  ),
  back: FRONT_LEGS.map((legs) =>
    pixelSprite([...HERO_BACK, ...legs], HERO_PALETTE),
  ),
  side: SIDE_LEGS.map((legs) =>
    pixelSprite([...HERO_SIDE, ...legs], HERO_PALETTE),
  ),
}
const LIFE_ROWS = ['...p...', '.hhhhh.', 'hGFFFGg', 'hGkFkGg', 'gGGGGGd']
const LIFE_SPRITE = pixelSprite(LIFE_ROWS, HERO_PALETTE)
const LIFE_EMPTY = pixelSprite(
  LIFE_ROWS,
  Object.fromEntries(
    Object.keys(HERO_PALETTE).map((key) => [key, RAMPS.night[2]]),
  ),
  { outline: RAMPS.night[0] },
)
const STOPWATCH_SPRITE = pixelSprite(
  [
    '..sss..',
    '...s...',
    '.hHHHg.',
    'hHFFFGg',
    'HFFkFFG',
    'HFFkkFG',
    'gGFFFGd',
    '.gGGGd.',
  ],
  HERO_PALETTE,
)

// The party crashers: grumpy steel robots in party hats, every one in its party colour.
// Each kind has two frames, drawn facing right and flipped to face its heading.
function crasherPalette(ramp: Ramp): Record<string, string> {
  return {
    '0': RAMPS.steel[0],
    '1': RAMPS.steel[1],
    '2': RAMPS.steel[2],
    '3': RAMPS.steel[3],
    '4': RAMPS.steel[4],
    e: ramp[0],
    a: ramp[1],
    b: ramp[2],
    c: ramp[3],
    d: ramp[4],
    k: INK,
    w: '#ffffff',
    W: RAMPS.cream[4],
    y: RAMPS.gold[3],
    Y: RAMPS.gold[1],
    r: RAMPS.ember[2],
    R: RAMPS.pink[3],
  }
}

const GRABBER_HEAD = [
  '.....W........',
  '.....c........',
  '....cba.......',
  '....cbbe......',
  '...cbbbbe.....',
  '..433333332...',
  '.43222222221..',
  '.3222kk22kk1..',
  '.32222wk2wk1..',
  '.32222222221..',
  '.322222kkk21..',
  '..211111111...',
]
const GRABBER_FRAMES = [
  [
    '..3bbbbbb3331k',
    '..2bcddcb2221.',
    '..2bbbbbb1..1k',
    '...eeeeee.....',
    '...11...11....',
    '..00.....00...',
  ],
  [
    '..3bbbbbb3332k',
    '..2bcddcb2222k',
    '..2bbbbbb1....',
    '...eeeeee.....',
    '....11.11.....',
    '....00.00.....',
  ],
] as const

const CONGA_HEAD = [
  '....W........',
  '....c........',
  '...cbe.......',
  '..cbbbe......',
  '..4333332....',
  '.432222221...',
  '.3222222kk...',
  '.32222222wk..',
  '.322222221...',
  '.32222kkk1...',
  '..2111111....',
]
const CONGA_FRAMES = [
  [
    '..ebbbbbe2Y..',
    '.3cbddbbe.YY.',
    '..ebbbbbe....',
    '..yYyYyYy....',
    '..1....1.....',
    '.00....00....',
  ],
  [
    '..ebbbbbe....',
    '.3cbddbbe2Y..',
    '..ebbbbbe.YY.',
    '...yYyYyYy...',
    '...1..1......',
    '...00.00.....',
  ],
] as const

const THROWER_HEAD = [
  '....cbbbe.....',
  '....cbbbe.....',
  '....yyyyY.....',
  '..acbbbbbea...',
  '...43333332...',
  '..4322222221..',
  '..3222kk2kk1..',
  '..322wk2wk21..',
  '..3222222Rr1..',
  '..3222kkkk21..',
  '...21111111...',
]
const THROWER_FRAMES = [
  [
    'Rr..ebbbbbe...',
    'rR33cbyybbe...',
    '....cbbbbbe...',
    '....ebbbbbe...',
    '....11...11...',
    '...000...000..',
  ],
  [
    '....ebbbbbe3Rr',
    '....cbyybbe3rR',
    '....cbbbbbe...',
    '....ebbbbbe...',
    '.....11.11....',
    '....000.000...',
  ],
] as const

const DANCER_FACE = [
  '...4333332...',
  '..432222221..',
  '..32k222k21..',
  '..3k2k2k2k1..',
  '..3Rk222kR1..',
  '..322kkk221..',
  '...2111111...',
]
const DANCER_FRAMES = [
  [
    '.c.........c.',
    '.b....W....b.',
    '.b....c....b.',
    '..b..cbe..b..',
    '..b.cbbbe.b..',
    ...DANCER_FACE,
    '...ebbbbbe...',
    '...cbddbbe...',
    '...ebbbbbe...',
    '...11...11...',
  ],
  [
    '.............',
    '......W......',
    '......c......',
    '.....cbe.....',
    '....cbbbe....',
    ...DANCER_FACE,
    'cb.ebbbbbe.bc',
    '...cbddbbe...',
    '...ebbbbbe...',
    '..11.....11..',
  ],
] as const

/** The bouncer: a crasher on a party-coloured bouncy ball, stretched and squashed. */
function bouncerRows(squash: boolean): string[] {
  const cx = 7.5
  const cy = squash ? 12.5 : 11.5
  const rx = squash ? 7.5 : 6.5
  const ry = squash ? 5 : 6
  // A white band round the ball's belly, shaded where it turns away from the light.
  const ball = ballStamp(15, 18, cx, cy, rx, ry, 'eabcd').map((row, y) =>
    row
      .split('')
      .map((ch, x) => {
        if (ch === '.') return ch
        const band = y + 0.5 - cy
        if (band < 1.5 || band > 3.5) return ch
        return ch === 'e' ? '1' : ch === 'a' ? '2' : x < cx ? 'W' : '3'
      })
      .join(''),
  )
  const top = Math.round(cy - ry)
  const fy = Math.round(cy) - 4
  return compose(15, 18, [
    [0, 0, ball],
    [5, top - 6, ['..W..', '..y..', '.yWY.', '.WyWY', 'yWyWY']],
    [6, fy, ['k....k', 'kk..kk', 'wk..wk', 'wk..wk']],
    [8, fy + 5, ['kk']],
  ])
}

type CrasherLook = Record<Kind | 'dancer', readonly PixelSprite[]>
function crasherLook(hex: string): CrasherLook {
  const palette = crasherPalette(tintOf(hex))
  const make = (
    head: readonly string[],
    frames: readonly (readonly string[])[],
  ) => frames.map((body) => pixelSprite([...head, ...body], palette))
  return {
    grabber: make(GRABBER_HEAD, GRABBER_FRAMES),
    conga: make(CONGA_HEAD, CONGA_FRAMES),
    thrower: make(THROWER_HEAD, THROWER_FRAMES),
    bouncer: [false, true].map((squash) =>
      pixelSprite(bouncerRows(squash), palette),
    ),
    dancer: DANCER_FRAMES.map((rows) => pixelSprite(rows, palette)),
  }
}
const CRASHER_LOOKS = new Map(CONFETTI.map((hex) => [hex, crasherLook(hex)]))
const FALLBACK_LOOK = CRASHER_LOOKS.get(CONFETTI[0]!)!

/** Confetti shots: a flat square and an edge-on flutter, outlined in their own shadow. */
const SHOT_SPRITES = new Map(
  CONFETTI.map((hex) => {
    const r = tintOf(hex)
    const palette = { d: r[4], c: r[3], b: r[2], a: r[1] }
    return [
      hex,
      [
        pixelSprite(['dcb', 'cba', 'baa'], palette, { outline: r[0] }),
        pixelSprite(['.c.', 'dba', '.a.'], palette, { outline: r[0] }),
      ],
    ] as const
  }),
)

const STREAMER_SPRITES = [
  pixelSprite(['.a', 'ab', 'b.', 'ba', '.a', 'ab'], {
    a: RAMPS.pink[3],
    b: RAMPS.pink[2],
  }),
  pixelSprite(['a.', 'ba', '.b', 'ab', 'a.', 'ba'], {
    a: RAMPS.gold[4],
    b: RAMPS.gold[3],
  }),
] as const

// Prizes: a stack of cash, a chrome toaster and the new car, all shaded and outlined.
const CASH_SPRITE = pixelSprite(
  [
    '34444444443',
    '42322222321',
    '4222uUv2221',
    '4222Uvv2221',
    '42322222321',
    '31111111110',
  ],
  {
    '0': RAMPS.leaf[0],
    '1': RAMPS.leaf[1],
    '2': RAMPS.leaf[2],
    '3': RAMPS.leaf[3],
    '4': RAMPS.leaf[4],
    u: RAMPS.gold[4],
    U: RAMPS.gold[3],
    v: RAMPS.gold[2],
  },
)
const TOASTER_SPRITE = pixelSprite(
  [
    '..ttt..ttt..',
    '..tTt..tTt..',
    '.4444444443.',
    '.4333333321.',
    '.4322222221k',
    '.4322222221.',
    '.3222222211.',
    '..00....00..',
  ],
  {
    '0': RAMPS.steel[0],
    '1': RAMPS.steel[1],
    '2': RAMPS.steel[2],
    '3': RAMPS.steel[3],
    '4': RAMPS.steel[4],
    t: RAMPS.earth[3],
    T: RAMPS.cream[3],
    k: INK,
  },
)
const CAR_SPRITE = pixelSprite(
  [
    '....43333332....',
    '...43sSS3sSS2...',
    '.44333333333332.',
    '4322222222222221',
    '3222222222222221',
    '.21kkk1111kkk11.',
    '...kWk....kWk...',
  ],
  {
    '1': RAMPS.ember[1],
    '2': RAMPS.ember[2],
    '3': RAMPS.ember[3],
    '4': RAMPS.ember[4],
    s: RAMPS.sky[4],
    S: RAMPS.sky[2],
    k: INK,
    W: RAMPS.steel[3],
  },
)
const POWER_RAMPS: Record<'spread' | 'rapid' | 'shield', Ramp> = {
  spread: RAMPS.purple,
  rapid: RAMPS.rust,
  shield: RAMPS.teal,
}
const PRIZE_GLOW: Record<PrizeKind, string> = {
  cash: RAMPS.leaf[3],
  toaster: RAMPS.steel[4],
  car: RAMPS.ember[3],
  spread: RAMPS.purple[3],
  rapid: RAMPS.rust[3],
  shield: RAMPS.teal[3],
}

const CHEVRON_UP_ROWS = ['..a..', '.aba.', 'ab.ba', 'b...b']
const CHEVRON_PALETTE = { a: RAMPS.leaf[4], b: RAMPS.leaf[3] }
const CHEVRON_UP = pixelSprite(CHEVRON_UP_ROWS, CHEVRON_PALETTE)
const CHEVRON_LEFT = pixelSprite(transpose(CHEVRON_UP_ROWS), CHEVRON_PALETTE)

// The parade float: a bevelled pink platform with gold trim, bunting and fringe, rolling on
// two wheels, carrying a giant grumpy cake. Painted procedurally on an 86x52 grid whose
// (43, 30) is the boss's (x, y); two frames turn the wheels and sway the fringe.
const FLOAT_W = 86
const FLOAT_H = 52
const FLOAT_CX = 43
const FLOAT_CY = 30
const FLOAT_PALETTE: Record<string, string> = {
  A: RAMPS.pink[0],
  B: RAMPS.pink[1],
  C: RAMPS.pink[2],
  D: RAMPS.pink[3],
  E: RAMPS.pink[4],
  f: RAMPS.cream[0],
  g: RAMPS.cream[1],
  h: RAMPS.cream[2],
  i: RAMPS.cream[3],
  j: RAMPS.cream[4],
  q: RAMPS.gold[0],
  r: RAMPS.gold[1],
  s: RAMPS.gold[2],
  t: RAMPS.gold[3],
  u: RAMPS.gold[4],
  v: RAMPS.teal[1],
  w: RAMPS.teal[2],
  x: RAMPS.teal[3],
  '0': RAMPS.steel[0],
  '1': RAMPS.steel[1],
  '2': RAMPS.steel[2],
  '3': RAMPS.steel[3],
  k: INK,
  W: '#ffffff',
}

function floatRows(frame: 0 | 1): string[] {
  const grid = Array.from({ length: FLOAT_H }, () =>
    new Array<string>(FLOAT_W).fill('.'),
  )
  const put = (x: number, y: number, ch: string) => {
    const row = grid[y]
    if (row && x >= 0 && x < FLOAT_W) row[x] = ch
  }
  const disc = (cx: number, cy: number, r: number, letters: string) => {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        const nx = (x + 0.5 - cx) / r
        const ny = (y + 0.5 - cy) / r
        if (nx * nx + ny * ny <= 1) put(x, y, letters[litStep(nx, ny)]!)
      }
  }
  // The platform, lit on its top and left edges.
  for (let y = 22; y <= 43; y++)
    for (let x = 3; x <= 82; x++) {
      let ch = 'C'
      if (y === 22) ch = 'E'
      else if (y === 23) ch = 'D'
      else if (y === 43) ch = 'A'
      else if (y === 42) ch = 'B'
      else if (x <= 4) ch = 'D'
      else if (x >= 81) ch = 'B'
      put(x, y, ch)
    }
  for (let x = 3; x <= 82; x++) {
    put(x, 28, 'u')
    put(x, 29, 's')
    put(x, 38, 't')
    put(x, 39, 'r')
  }
  // Bunting pennants hanging from the top rail, teal and gold by turns.
  for (let i = 0; i < 10; i++) {
    const x0 = 4 + i * 8
    const [lit, base] = i % 2 ? ['x', 'w'] : ['u', 't']
    for (let r = 0; r < 4; r++)
      for (let dx = r; dx < 7 - r; dx++)
        put(x0 + dx, 24 + r, dx === r ? lit : base)
  }
  // Rosettes along the side panel, a big teal one in the middle.
  for (const x of [11, 25, 61, 75]) {
    disc(x, 34, 3, 'qrstu')
    put(x, 34, 'k')
  }
  disc(43, 34, 4, 'vwxxW')
  // Gold fringe, swaying a pixel between frames.
  for (let x = 3; x <= 82; x++) {
    if ((x + frame) % 3 === 2) continue
    const len = 4 + ((x * 7) % 3)
    for (let y = 44; y < 44 + len; y++)
      put(x, y, y === 44 ? 'u' : y < 43 + len ? 't' : 'r')
  }
  // Wheels, spokes turned by frame.
  for (const wx of [13, 72]) {
    for (let y = 42; y <= 52; y++)
      for (let x = wx - 5; x <= wx + 5; x++) {
        const dx = x - wx
        const dy = y - 47
        const d = Math.hypot(dx, dy)
        if (d > 4.6) continue
        let ch = d > 3.2 ? '0' : '1'
        if (d <= 3.2 && (frame ? Math.abs(dx) === Math.abs(dy) : !dx || !dy))
          ch = '2'
        if (d < 1.2) ch = '3'
        put(x, y, ch)
      }
  }
  // The cake: frosting with drips over a cream sponge.
  for (let y = 8; y <= 21; y++)
    for (let x = 23; x <= 62; x++) {
      let ch = 'h'
      if (x === 23) ch = 'i'
      else if (x >= 61) ch = 'g'
      if (y === 21) ch = 'g'
      if (y === 20) ch = x % 4 === 1 ? 'D' : 'C'
      if (y === 8) ch = 'E'
      else if (y === 9) ch = 'D'
      else if (y === 10) ch = 'C'
      put(x, y, ch)
    }
  for (let x = 24; x <= 61; x++) {
    const drip = (x * 5) % 7
    if (drip < 3) for (let y = 11; y < 11 + drip; y++) put(x, y, 'C')
    if (x % 7 === 3 && (x < 30 || x > 55))
      put(x, 15 + (x % 3), x % 2 ? 'x' : 'u')
  }
  // A grumpy face: slanted brows, glinting eyes, a frown.
  for (const [x, y] of [
    [31, 11],
    [32, 11],
    [33, 12],
    [34, 12],
    [35, 13],
    [36, 13],
    [49, 13],
    [50, 13],
    [51, 12],
    [52, 12],
    [53, 11],
    [54, 11],
  ] as const)
    put(x, y, 'k')
  for (const ex of [32, 50])
    for (let y = 14; y <= 16; y++)
      for (let x = ex; x < ex + 4; x++)
        put(x, y, x === ex && y === 14 ? 'W' : 'k')
  for (let x = 37; x <= 48; x++) put(x, 18, 'k')
  put(36, 19, 'k')
  put(49, 19, 'k')
  // Candles, striped, waiting for their flames.
  for (let i = 0; i < 4; i++) {
    const x = 28 + i * 10
    for (let y = 2; y <= 7; y++) {
      put(x, y, y % 2 ? 'W' : 'E')
      put(x + 1, y, y % 2 ? 'j' : 'D')
    }
  }
  return grid.map((line) => line.join(''))
}
const FLOAT_SPRITES = [
  pixelSprite(floatRows(0), FLOAT_PALETTE),
  pixelSprite(floatRows(1), FLOAT_PALETTE),
] as const
const FLOAT_FLASH = pixelSprite(
  floatRows(0),
  Object.fromEntries(
    Object.entries(FLOAT_PALETTE).map(([key, colour]) => [
      key,
      key === 'k' ? colour : mix(colour, '#ffffff', 0.75),
    ]),
  ),
)

// The studio: a bevelled checkerboard floor under banded spotlight pools, walls trimmed
// with marquee bulbs. Each studio gets its colours; parade-float rooms go gold and red.
type StudioLook = {
  wall: Ramp
  tileA: Ramp
  tileB: Ramp
  pool: string
  mark: string
}
function studioLook(floor: Ramp, wall: Ramp, pool: string): StudioLook {
  const tileA: Ramp = [
    mix(floor[0], INK, 0.5),
    mix(floor[0], floor[1], 0.2),
    mix(floor[0], floor[1], 0.45),
    floor[1],
    mix(floor[1], floor[2], 0.5),
  ]
  const dark = (c: string) => mix(c, INK, 0.5)
  return {
    wall,
    tileA,
    tileB: [
      dark(tileA[0]),
      dark(tileA[1]),
      dark(tileA[2]),
      dark(tileA[3]),
      dark(tileA[4]),
    ],
    pool,
    mark: floor[3],
  }
}
const STUDIOS: readonly StudioLook[] = [
  studioLook(RAMPS.purple, RAMPS.pink, RAMPS.gold[4]),
  studioLook(RAMPS.teal, RAMPS.purple, RAMPS.cream[4]),
  studioLook(RAMPS.pink, RAMPS.teal, RAMPS.gold[4]),
  studioLook(RAMPS.ember, RAMPS.gold, RAMPS.gold[4]),
]
const TILE = 16

/** Marquee bulbs around the walls, numbered clockwise so the chase runs round the set. */
const BULBS = (() => {
  const out: { x: number; y: number }[] = []
  const inDoor = (x: number, y: number) =>
    DOORS.some(
      (d) => Math.abs(d.x - x) < DOOR + 4 && Math.abs(d.y - y) < DOOR + 4,
    )
  const push = (x: number, y: number) => {
    if (!inDoor(x, y)) out.push({ x, y })
  }
  for (let x = 14; x <= W - 16; x += 8) push(x, HUD + 4)
  for (let y = HUD + 14; y <= H - 16; y += 8) push(W - 6, y)
  for (let x = W - 16; x >= 14; x -= 8) push(x, BOTTOM + 4)
  for (let y = H - 16; y >= HUD + 14; y -= 8) push(4, y)
  return out
})()

/** Small additive halos in stepped squares: cheap colour math for many little lights. */
function halo(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  colour: string,
) {
  const cx = Math.round(x)
  const cy = Math.round(y)
  g.fillStyle = colour
  g.fillRect(cx - r, cy - r + 1, r * 2 + 1, r * 2 - 1)
  g.fillRect(cx - r + 1, cy - r, r * 2 - 1, r * 2 + 1)
  g.fillRect(cx - r + 2, cy - r + 2, r * 2 - 3, r * 2 - 3)
}

/** The doorway's bands from backstage to the floor: dark, or the open exit's green light. */
const DOOR_BANDS = {
  closed: [INK, RAMPS.night[0], RAMPS.night[1], RAMPS.night[2], RAMPS.night[3]],
  exit: [
    RAMPS.leaf[1],
    RAMPS.leaf[2],
    RAMPS.leaf[3],
    mix(RAMPS.leaf[3], RAMPS.leaf[4], 0.5),
    RAMPS.leaf[4],
  ],
} as const
/** From each door (by side) into the room. */
const EXIT_INWARD = [
  [0, 1],
  [-1, 0],
  [0, -1],
  [1, 0],
] as const

/** A five-point star, squashed a little to lie on the floor. */
function starPath(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  outer: number,
  inner: number,
) {
  g.beginPath()
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? inner : outer
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const px = x + Math.cos(a) * r
    const py = y + Math.sin(a) * r * 0.72
    if (i) g.lineTo(px, py)
    else g.moveTo(px, py)
  }
  g.closePath()
}

class PrizeShowPanic implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private px = CX
  private py = CY + 30
  private aim: Dir = { x: 0, y: -1 }
  private fireCooldown = 0
  private spread = 0
  private rapid = 0
  private shield = 0
  private invuln = INVULN_TICKS
  private shots: Shot[] = []
  private crashers: Crasher[] = []
  private dancers: Dancer[] = []
  private streamers: Streamer[] = []
  private prizes: Prize[] = []
  private boss: Boss | null = null
  private roomTimer = ROOM_TICKS
  private waveTimer = 0
  private spawnTimer = 0
  private exitDoor = -1
  private entryDoor = 2
  private transition = 0
  private dead = 0
  private nextExtra = EXTRA_EVERY
  private haul = 0
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null
  // Cosmetic only: walk-cycle bookkeeping and sparkles with their own dice, so the
  // game's seeded rng is untouched.
  private stride = 0
  private striding = false
  private fx = new Sparkles()
  private fxRng = backdropRng(47)

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.startRoom(1)
  }

  private bossRoom(room = this.level): boolean {
    return room % 4 === 0
  }

  private unlocked(): Kind[] {
    const kinds: Kind[] = ['grabber']
    if (this.level >= 2) kinds.push('bouncer')
    if (this.level >= 3) kinds.push('conga')
    if (this.level >= 5) kinds.push('thrower')
    return kinds
  }

  // --- rooms -------------------------------------------------------------------

  private startRoom(room: number) {
    this.level = room
    this.crashers = []
    this.streamers = []
    this.shots = []
    this.prizes = []
    this.exitDoor = -1
    this.roomTimer = ROOM_TICKS
    this.waveTimer = Math.round(levelCurve(room, PANIC_CURVES.waveTicks))
    this.spawnTimer = 60
    this.invuln = INVULN_TICKS
    const entry = DOORS[this.entryDoor]!
    this.px = entry.x + (CX - entry.x) * 0.25
    this.py = entry.y + (CY - entry.y) * 0.25
    this.boss = null
    if (this.bossRoom(room)) {
      const hp = Math.round(levelCurve(room / 4, PANIC_CURVES.bossHp))
      this.boss = { x: CX, y: TOP + 28, vx: 0.8, hp, maxHp: hp, t: 0, flash: 0 }
      this.waveTimer = Math.round(this.waveTimer / 2)
      this.banner = {
        text: 'PARADE FLOAT!',
        sub: 'CONFETTI IT INTO A PARTY',
        ticks: 110,
      }
    } else {
      this.banner = { text: `STUDIO ${room}`, sub: 'CLEAR THE SET', ticks: 90 }
    }
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    const controls = this.demo ? this.demoInput() : input

    if (this.transition > 0) {
      if (--this.transition === 0) this.startRoom(this.level + 1)
      return
    }
    if (this.dead > 0) {
      if (--this.dead === 0) {
        if (this.lives <= 0) {
          this.over = true
          this.banner = {
            text: 'GAME OVER',
            sub: `PRIZES WON ${this.haul}`,
            ticks: 9999,
          }
        } else {
          this.startRoom(this.level)
        }
      }
      return
    }

    if (this.invuln > 0) this.invuln--
    if (this.spread > 0) this.spread--
    if (this.rapid > 0) this.rapid--
    if (this.shield > 0) this.shield--
    if (--this.roomTimer <= 0) {
      this.loseLife("TIME'S UP!")
      return
    }

    const fromX = this.px
    const fromY = this.py
    this.move(controls)
    this.striding = this.px !== fromX || this.py !== fromY
    if (this.striding) this.stride++
    if (this.fireCooldown > 0) this.fireCooldown--
    if (controls.held.a && this.fireCooldown === 0) this.fire()
    this.spawn()
    this.updateShots()
    this.updateCrashers()
    this.updateBoss()
    this.updateStreamers()
    this.updatePrizes()
    this.checkExit()
  }

  private move(input: InputFrame) {
    let dx = 0
    let dy = 0
    if (input.held.left) dx -= 1
    if (input.held.right) dx += 1
    if (input.held.up) dy -= 1
    if (input.held.down) dy += 1
    if (dx === 0 && dy === 0) return
    // Holding B locks the aim so Sparkle can strafe.
    if (!input.held.b) this.aim = { x: dx, y: dy }
    const len = Math.hypot(dx, dy)
    this.px = Math.max(
      LEFT + HALF,
      Math.min(RIGHT - HALF, this.px + (dx / len) * SPEED),
    )
    this.py = Math.max(
      TOP + HALF,
      Math.min(BOTTOM - HALF, this.py + (dy / len) * SPEED),
    )
  }

  private fire() {
    this.fireCooldown = this.rapid > 0 ? RAPID_COOLDOWN : FIRE_COOLDOWN
    const base = Math.atan2(this.aim.y, this.aim.x)
    const angles = this.spread > 0 ? [base - 0.25, base, base + 0.25] : [base]
    for (const a of angles) {
      this.shots.push({
        x: this.px + Math.cos(a) * 7,
        y: this.py + Math.sin(a) * 7,
        vx: Math.cos(a) * SHOT_SPEED,
        vy: Math.sin(a) * SHOT_SPEED,
        life: SHOT_LIFE,
        hue: Math.floor(this.rng() * CONFETTI.length),
      })
    }
    if (this.tick % 3 === 0) this.sound.play('shoot')
  }

  private spawn() {
    if (this.waveTimer <= 0) return
    this.waveTimer--
    if (--this.spawnTimer > 0) return
    this.spawnTimer = Math.round(
      levelCurve(this.level, PANIC_CURVES.spawnEvery),
    )
    const doors = DOORS.filter((_, i) => i !== this.entryDoor || this.level > 1)
    const door = doors[Math.floor(this.rng() * doors.length)]!
    const kinds = this.unlocked()
    const kind = kinds[Math.floor(this.rng() * kinds.length)]!
    if (kind === 'conga') {
      let leader: Crasher | null = null
      const length = 4 + Math.min(4, Math.floor(this.level / 3))
      for (let i = 0; i < length; i++) {
        const c = this.makeCrasher('conga', door.x, door.y)
        c.leader = leader
        leader = c
      }
    } else if (kind === 'grabber') {
      const group = 2 + Math.floor(this.rng() * 3)
      for (let i = 0; i < group; i++) {
        this.makeCrasher(
          'grabber',
          door.x + (this.rng() - 0.5) * 16,
          door.y + (this.rng() - 0.5) * 16,
        )
      }
    } else {
      this.makeCrasher(kind, door.x, door.y)
    }
  }

  private makeCrasher(kind: Kind, x: number, y: number): Crasher {
    const a = Math.atan2(CY - y, CX - x) + (this.rng() - 0.5)
    const c: Crasher = {
      kind,
      x: Math.max(LEFT + 4, Math.min(RIGHT - 4, x)),
      y: Math.max(TOP + 4, Math.min(BOTTOM - 4, y)),
      vx: kind === 'bouncer' ? Math.cos(a) * 1.4 : 0,
      vy: kind === 'bouncer' ? Math.sin(a) * 1.4 : 0,
      hp: kind === 'thrower' ? 3 : kind === 'bouncer' ? 2 : 1,
      t: Math.floor(this.rng() * 60),
      leader: null,
      color: CONFETTI[Math.floor(this.rng() * CONFETTI.length)]!,
    }
    this.crashers.push(c)
    return c
  }

  private updateShots() {
    for (const s of this.shots) {
      s.x += s.vx
      s.y += s.vy
      s.life--
      if (s.x < LEFT || s.x > RIGHT || s.y < TOP || s.y > BOTTOM) s.life = 0
      if (s.life <= 0) continue
      const hit = this.crashers.find(
        (c) => Math.abs(c.x - s.x) < 7 && Math.abs(c.y - s.y) < 8,
      )
      if (hit) {
        s.life = 0
        this.burst(s.x, s.y, 3, CONFETTI[s.hue]!)
        if (--hit.hp <= 0) this.cheer(hit)
        continue
      }
      const b = this.boss
      if (b && Math.abs(b.x - s.x) < 40 && Math.abs(b.y - s.y) < 18) {
        s.life = 0
        b.hp--
        b.flash = 4
        this.burst(s.x, s.y, 2, CONFETTI[s.hue]!)
        if (b.hp <= 0) this.bossDown()
      }
      // Confetti knocks streamers out of the air too.
      const streamer = this.streamers.find(
        (st) => Math.abs(st.x - s.x) < 5 && Math.abs(st.y - s.y) < 5,
      )
      if (streamer) {
        streamer.life = 0
        s.life = 0
      }
    }
    this.shots = this.shots.filter((s) => s.life > 0)
  }

  /** Confetti'd: the crasher gets happy and dances off the set. */
  private cheer(c: Crasher) {
    this.crashers = this.crashers.filter((other) => other !== c)
    for (const other of this.crashers)
      if (other.leader === c) other.leader = c.leader
    this.dancers.push({
      x: c.x,
      y: c.y,
      vx: this.rng() < 0.5 ? -1.2 : 1.2,
      life: 50,
      color: c.color,
    })
    this.addScore(
      KIND_POINTS[c.kind] * Math.ceil(this.level / 2),
      c.x,
      c.y - 10,
    )
    this.burst(c.x, c.y, 8, c.color)
    this.fx.burst(c.x, c.y - 4, this.fxRng, { count: 6 })
    this.sound.play('pop')
    if (this.rng() < 0.12) this.dropPrize(c.x, c.y)
  }

  private dropPrize(x: number, y: number) {
    const roll = this.rng()
    const kind: PrizeKind =
      roll < 0.35
        ? 'cash'
        : roll < 0.55
          ? 'toaster'
          : roll < 0.62
            ? 'car'
            : roll < 0.76
              ? 'spread'
              : roll < 0.9
                ? 'rapid'
                : 'shield'
    this.prizes.push({ x, y, kind, life: PRIZE_LIFE })
  }

  private updateCrashers() {
    const speed = levelCurve(this.level, PANIC_CURVES.grabberSpeed)
    for (const c of this.crashers) {
      c.t++
      if (c.kind === 'grabber') {
        const dx = this.px - c.x
        const dy = this.py - c.y
        const d = Math.hypot(dx, dy) || 1
        c.x += (dx / d) * speed + Math.sin(c.t / 7) * 0.3
        c.y += (dy / d) * speed
      } else if (c.kind === 'bouncer') {
        c.x += c.vx
        c.y += c.vy
        if (c.x < LEFT + 6 || c.x > RIGHT - 6) c.vx = -c.vx
        if (c.y < TOP + 6 || c.y > BOTTOM - 6) c.vy = -c.vy
      } else if (c.kind === 'conga') {
        if (c.leader) {
          const dx = c.leader.x - c.x
          const dy = c.leader.y - c.y
          const d = Math.hypot(dx, dy) || 1
          if (d > 11) {
            c.x += (dx / d) * speed * 1.3
            c.y += (dy / d) * speed * 1.3
          }
        } else {
          // The head of the line weaves toward Sparkle.
          const a =
            Math.atan2(this.py - c.y, this.px - c.x) + Math.sin(c.t / 20) * 0.9
          c.x += Math.cos(a) * speed * 1.1
          c.y += Math.sin(a) * speed * 1.1
        }
      } else {
        // Throwers keep their distance and fling streamers.
        const dx = this.px - c.x
        const dy = this.py - c.y
        const d = Math.hypot(dx, dy) || 1
        const away = d < 70 ? -1 : d > 110 ? 1 : 0
        c.x += (dx / d) * speed * 0.6 * away + Math.cos(c.t / 30) * 0.4
        c.y += (dy / d) * speed * 0.6 * away + Math.sin(c.t / 30) * 0.4
        if (c.t % 90 === 0) this.throwStreamer(c.x, c.y)
      }
      c.x = Math.max(LEFT + 4, Math.min(RIGHT - 4, c.x))
      c.y = Math.max(TOP + 4, Math.min(BOTTOM - 4, c.y))
      if (this.touching(c.x, c.y, 8)) {
        this.loseLife('MOBBED!')
        return
      }
    }
  }

  private throwStreamer(x: number, y: number) {
    const a = Math.atan2(this.py - y, this.px - x) + (this.rng() - 0.5) * 0.3
    this.streamers.push({
      x,
      y,
      vx: Math.cos(a) * 1.8,
      vy: Math.sin(a) * 1.8,
      life: 160,
    })
    this.sound.play('blip')
  }

  private updateStreamers() {
    for (const s of this.streamers) {
      s.x += s.vx
      s.y += s.vy
      s.life--
      if (s.x < LEFT || s.x > RIGHT || s.y < TOP || s.y > BOTTOM) s.life = 0
      if (s.life > 0 && this.touching(s.x, s.y, 4)) {
        s.life = 0
        this.loseLife('TANGLED!')
      }
    }
    this.streamers = this.streamers.filter((s) => s.life > 0)
  }

  private updateBoss() {
    const b = this.boss
    if (!b) return
    b.t++
    if (b.flash > 0) b.flash--
    b.x += b.vx
    if (b.x < LEFT + 50 || b.x > RIGHT - 50) b.vx = -b.vx
    // Volleys of streamers, and a few grabbers hopping off the float.
    if (b.t % 70 === 0) {
      for (const off of [-0.35, 0, 0.35]) {
        const a = Math.atan2(this.py - b.y, this.px - b.x) + off
        this.streamers.push({
          x: b.x,
          y: b.y + 14,
          vx: Math.cos(a) * 2,
          vy: Math.sin(a) * 2,
          life: 160,
        })
      }
      this.sound.play('blip')
    }
    if (b.t % 240 === 0 && this.crashers.length < 8) {
      this.makeCrasher('grabber', b.x - 20, b.y + 20)
      this.makeCrasher('grabber', b.x + 20, b.y + 20)
    }
    if (this.touching(b.x, b.y, 30)) this.loseLife('RUN OVER BY A FLOAT!')
  }

  private bossDown() {
    const b = this.boss!
    this.boss = null
    const bonus = 10_000 * (this.level / 4)
    this.addScore(bonus, b.x, b.y)
    for (let i = 0; i < 6; i++)
      this.burst(b.x + (i - 3) * 12, b.y, 10, CONFETTI[i]!)
    for (let i = 0; i < 4; i++)
      this.fx.burst(b.x + (i - 1.5) * 24, b.y - 6, this.fxRng, {
        count: 12,
        speed: 2.4,
      })
    this.banner = {
      text: 'BEST FLOAT EVER!',
      sub: `BONUS ${bonus}`,
      ticks: 120,
    }
    this.sound.play('level')
    for (let i = 0; i < 3; i++) this.dropPrize(b.x + (i - 1) * 24, b.y + 20)
  }

  private updatePrizes() {
    for (const p of this.prizes) {
      p.life--
      if (!this.touching(p.x, p.y, 9)) continue
      p.life = 0
      this.addScore(PRIZE_POINTS[p.kind], p.x, p.y - 10)
      if (p.kind === 'spread') this.spread = POWER_TICKS
      if (p.kind === 'rapid') this.rapid = POWER_TICKS
      if (p.kind === 'shield') this.shield = SHIELD_TICKS
      if (p.kind === 'cash' || p.kind === 'toaster' || p.kind === 'car')
        this.haul++
      this.fx.burst(p.x, p.y, this.fxRng, {
        count: 12,
        colours: [RAMPS.gold[4], RAMPS.gold[3], RAMPS.cream[4]],
      })
      this.floaters.push({
        x: p.x,
        y: p.y - 20,
        text: PRIZE_NAMES[p.kind],
        life: 45,
      })
      this.sound.play('pickup')
    }
    this.prizes = this.prizes.filter((p) => p.life > 0)
  }

  private checkExit() {
    const clear =
      this.waveTimer <= 0 && this.crashers.length === 0 && !this.boss
    if (!clear) return
    if (this.exitDoor < 0) {
      const options = DOORS.map((_, i) => i).filter((i) => i !== this.entryDoor)
      this.exitDoor = options[Math.floor(this.rng() * options.length)]!
      this.streamers = []
      this.banner = { text: 'ROOM CLEAR!', sub: 'GET TO THE EXIT', ticks: 80 }
      const open = DOORS[this.exitDoor]!
      this.fx.burst(open.x, open.y, this.fxRng, {
        count: 14,
        colours: [RAMPS.leaf[4], RAMPS.leaf[3], RAMPS.gold[4]],
      })
      this.sound.play('extra')
    }
    const door = DOORS[this.exitDoor]!
    if (Math.hypot(door.x - this.px, door.y - this.py) < 16) {
      const timeBonus = Math.floor(this.roomTimer / 60) * 50
      this.addScore(timeBonus, this.px, this.py - 12)
      this.entryDoor = (this.exitDoor + 2) % 4
      this.transition = TRANSITION_TICKS
      this.banner = {
        text: 'NEXT STUDIO!',
        sub: timeBonus ? `TIME BONUS ${timeBonus}` : undefined,
        ticks: TRANSITION_TICKS,
      }
      this.sound.play('level')
    }
  }

  private touching(x: number, y: number, r: number): boolean {
    return Math.abs(x - this.px) < r && Math.abs(y - this.py) < r
  }

  private loseLife(text: string) {
    if (this.invuln > 0 || this.dead > 0) return
    if (this.shield > 0) {
      // The shield pops instead.
      this.shield = 0
      this.invuln = 60
      this.burst(this.px, this.py, 10, '#a5f3fc')
      this.fx.burst(this.px, this.py, this.fxRng, {
        count: 10,
        colours: [RAMPS.teal[4], RAMPS.teal[3], '#ffffff'],
      })
      this.sound.play('warn')
      return
    }
    this.lives--
    this.dead = DEATH_TICKS
    this.burst(this.px, this.py, 18, '#fde68a')
    this.sound.play('die')
    if (this.lives > 0) this.banner = { text, ticks: 80 }
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x: number, y: number) {
    if (this.demo) return
    this.score += points
    this.floaters.push({ x, y, text: String(points), life: 40 })
    if (this.score >= this.nextExtra) {
      this.lives++
      // Each extra contestant takes longer to earn: 50k, 150k, 350k, 750k...
      this.nextExtra = this.nextExtra * 2 + EXTRA_EVERY
      this.banner = { text: 'EXTRA CONTESTANT!', ticks: 90 }
      this.fx.burst(this.px, this.py, this.fxRng, { count: 16, speed: 2 })
      this.sound.play('extra')
    }
  }

  private burst(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.5 + this.rng() * 1.8
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 0.5,
        life: 20 + Math.floor(this.rng() * 16),
        color,
      })
    }
  }

  private updateEffects() {
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.04
      p.life--
    }
    this.particles = this.particles.filter((p) => p.life > 0)
    for (const d of this.dancers) {
      d.x += d.vx
      d.life--
    }
    this.dancers = this.dancers.filter((d) => d.life > 0)
    for (const f of this.floaters) {
      f.y -= 0.4
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
    this.fx.update()
  }

  // --- attract-mode pilot -----------------------------------------------------

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
    const threats: Array<{ x: number; y: number }> = [
      ...this.crashers,
      ...this.streamers,
    ]
    if (this.boss) threats.push(this.boss)
    // Step away from whatever is closest; aim at the nearest crasher (or the float).
    let mx = 0
    let my = 0
    for (const t of threats) {
      const d = Math.hypot(t.x - this.px, t.y - this.py)
      if (d < 50) {
        mx -= (t.x - this.px) / (d || 1)
        my -= (t.y - this.py) / (d || 1)
      }
    }
    let goal: { x: number; y: number } | null = null
    if (this.exitDoor >= 0) goal = DOORS[this.exitDoor]!
    else if (this.prizes.length) goal = this.prizes[0]!
    if (goal && Math.abs(mx) + Math.abs(my) < 0.5) {
      mx = goal.x - this.px
      my = goal.y - this.py
    }
    // Drift back toward the middle when nothing else calls.
    if (Math.abs(mx) + Math.abs(my) < 0.3) {
      mx = (CX - this.px) * 0.02
      my = (CY - this.py) * 0.02
    }
    if (mx < -0.2) held.left = true
    if (mx > 0.2) held.right = true
    if (my < -0.2) held.up = true
    if (my > 0.2) held.down = true
    const target = [...this.crashers, ...(this.boss ? [this.boss] : [])].sort(
      (a, b) =>
        Math.hypot(a.x - this.px, a.y - this.py) -
        Math.hypot(b.x - this.px, b.y - this.py),
    )[0]
    if (target) {
      // Point the cannon (it locks while B is held) and spray.
      const a = Math.atan2(target.y - this.py, target.x - this.px)
      const f = Math.round(a / (Math.PI / 4))
      this.aim = {
        x: Math.round(Math.cos((f * Math.PI) / 4)),
        y: Math.round(Math.sin((f * Math.PI) / 4)),
      }
      held.b = true
      held.a = true
    }
    return frame
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    this.renderStudio(g)
    this.renderSpotlights(g)
    this.renderMarquee(g)
    DOORS.forEach((d, i) => this.renderDoor(g, d, i))
    if (this.exitDoor >= 0) this.renderExitArrows(g, DOORS[this.exitDoor]!)
    this.renderShadows(g)
    for (const p of this.prizes) this.renderPrize(g, p)
    if (this.boss) this.renderBoss(g, this.boss)
    const crowd = [...this.crashers].sort((a, b) => a.y - b.y)
    for (const c of crowd) this.renderCrasher(g, c)
    for (const d of this.dancers) this.renderDancer(g, d)
    this.renderStreamers(g)
    this.renderShots(g)
    if (this.dead === 0 && !this.over) this.renderSparkle(g)
    this.renderConfetti(g)
    this.fx.render(g)
    for (const f of this.floaters) {
      drawText(g, f.text, f.x, f.y, {
        align: 'center',
        color: RAMPS.gold[3],
        outline: INK,
      })
    }
    vignette(g, W, H, 0.28)
    this.renderHud(g)
  }

  private studioIndex(): number {
    return this.bossRoom() ? 3 : (this.level - 1) % 3
  }

  private renderStudio(g: CanvasRenderingContext2D) {
    const theme = this.studioIndex()
    const look = STUDIOS[theme]!
    // Floor, walls and bulb sockets are painted once per studio look.
    cachedLayer(g, `prize-show-panic-studio-${theme}`, W, H, (k) => {
      k.fillStyle = INK
      k.fillRect(0, 0, W, H)
      bandedGradient(k, 0, 0, W, HUD, [RAMPS.night[2], RAMPS.night[0]], 2)
      k.save()
      k.beginPath()
      k.rect(LEFT, TOP, RIGHT - LEFT, BOTTOM - TOP)
      k.clip()
      // Glossy bevelled tiles in a checkerboard, each with a glint of studio light.
      k.fillStyle = look.tileB[0]
      k.fillRect(LEFT, TOP, RIGHT - LEFT, BOTTOM - TOP)
      for (let y = 0; y < BOTTOM; y += TILE) {
        for (let x = 0; x < RIGHT; x += TILE) {
          if (y + TILE <= TOP || x + TILE <= LEFT) continue
          const ramp = (x / TILE + y / TILE) % 2 ? look.tileB : look.tileA
          bevel(k, x + 1, y + 1, TILE - 2, TILE - 2, ramp, {
            depth: 1,
            outline: null,
          })
          k.fillStyle = rgba(ramp[4], 0.5)
          for (let i = 0; i < 4; i++) k.fillRect(x + 3 + i, y + 7 - i, 2, 1)
        }
      }
      // The show's star painted on the middle of the stage.
      k.fillStyle = rgba(look.mark, 0.14)
      starPath(k, CX, CY, 52, 22)
      k.fill()
      k.fillStyle = rgba(look.mark, 0.16)
      starPath(k, CX, CY, 34, 14)
      k.fill()
      // Spotlight pools in stepped bands: one big one on the star, one per corner.
      k.globalCompositeOperation = 'lighter'
      const pool = (
        x: number,
        y: number,
        rx: number,
        ry: number,
        a: number,
      ) => {
        for (let b = 0; b < 4; b++) {
          k.fillStyle = rgba(look.pool, a)
          k.beginPath()
          k.ellipse(x, y, rx * (1 - b * 0.22), ry * (1 - b * 0.22), 0, 0, 7)
          k.fill()
        }
      }
      pool(CX, CY, 96, 64, 0.045)
      for (const [x, y] of [
        [LEFT + 44, TOP + 30],
        [RIGHT - 44, TOP + 30],
        [LEFT + 44, BOTTOM - 30],
        [RIGHT - 44, BOTTOM - 30],
      ] as const)
        pool(x, y, 40, 24, 0.03)
      k.globalCompositeOperation = 'source-over'
      // HDMA falloff: the floor darkens in bands toward the walls.
      for (let i = 0; i < 6; i++) {
        k.fillStyle = rgba(INK, 0.3 - i * 0.05)
        k.fillRect(LEFT, TOP + i * 4, RIGHT - LEFT, 4)
        k.fillRect(LEFT, BOTTOM - (i + 1) * 4, RIGHT - LEFT, 4)
        k.fillRect(LEFT + i * 4, TOP, 4, BOTTOM - TOP)
        k.fillRect(RIGHT - (i + 1) * 4, TOP, 4, BOTTOM - TOP)
      }
      k.restore()
      // Bevelled walls with a recessed marquee channel, gold posts at the corners.
      const wall = look.wall
      bevel(k, 1, HUD + 1, WALL - 2, H - HUD - 2, wall)
      bevel(k, RIGHT + 1, HUD + 1, WALL - 2, H - HUD - 2, wall)
      bevel(k, 1, HUD + 1, W - 2, WALL - 2, wall)
      bevel(k, 1, BOTTOM + 1, W - 2, WALL - 2, wall)
      k.fillStyle = wall[0]
      k.fillRect(WALL, HUD + 3, W - WALL * 2, 4)
      k.fillRect(WALL, BOTTOM + 3, W - WALL * 2, 4)
      k.fillRect(3, TOP, 4, BOTTOM - TOP)
      k.fillRect(RIGHT + 3, TOP, 4, BOTTOM - TOP)
      for (const b of BULBS) {
        k.fillStyle = INK
        k.fillRect(b.x - 1, b.y - 1, 4, 4)
        k.fillStyle = RAMPS.gold[1]
        k.fillRect(b.x, b.y, 2, 2)
        k.fillStyle = RAMPS.gold[2]
        k.fillRect(b.x, b.y, 1, 1)
      }
      for (const [x, y] of [
        [1, HUD + 1],
        [RIGHT + 1, HUD + 1],
        [1, BOTTOM + 1],
        [RIGHT + 1, BOTTOM + 1],
      ] as const) {
        bevel(k, x, y, WALL - 2, WALL - 2, RAMPS.gold)
        k.fillStyle = RAMPS.gold[4]
        k.fillRect(x + 3, y + 3, 2, 2)
      }
    })
  }

  private renderSpotlights(g: CanvasRenderingContext2D) {
    // Two follow-spots sweep the stage, stepped like the pools under them.
    const look = STUDIOS[this.studioIndex()]!
    g.save()
    g.globalCompositeOperation = 'lighter'
    for (let i = 0; i < 2; i++) {
      const t = this.tick / 90 + i * 2.6
      const x = CX + Math.sin(t * 0.83 + i) * 100
      const y = CY + Math.sin(t * 1.21 + i * 1.7) * 52
      g.fillStyle = rgba(i ? RAMPS.pink[3] : look.pool, 0.06)
      for (let b = 0; b < 3; b++) {
        g.beginPath()
        g.ellipse(x, y, 30 - b * 8, 19 - b * 5, 0, 0, Math.PI * 2)
        g.fill()
      }
    }
    g.restore()
  }

  private renderMarquee(g: CanvasRenderingContext2D) {
    // The bulbs chase round the set: gold, green once the exit opens, red when time is short.
    const step = Math.floor(this.tick / 5)
    const ramp =
      this.exitDoor >= 0
        ? RAMPS.leaf
        : this.roomTimer <= 600 && !this.over
          ? RAMPS.ember
          : RAMPS.gold
    const lit = BULBS.filter((_, i) => (((i - step) % 4) + 4) % 4 === 0)
    g.save()
    g.globalCompositeOperation = 'lighter'
    g.globalAlpha = 0.3
    for (const b of lit) halo(g, b.x + 0.5, b.y + 0.5, 3, ramp[3])
    g.restore()
    for (const b of lit) {
      g.fillStyle = ramp[4]
      g.fillRect(b.x, b.y, 2, 2)
      g.fillStyle = '#ffffff'
      g.fillRect(b.x, b.y, 1, 1)
    }
  }

  private renderDoor(
    g: CanvasRenderingContext2D,
    d: { x: number; y: number; side: number },
    i: number,
  ) {
    const across = d.side % 2 === 0
    const x = across ? d.x - DOOR : d.side === 3 ? 0 : RIGHT
    const y = across ? (d.side === 0 ? HUD : BOTTOM) : d.y - DOOR
    const w = across ? DOOR * 2 : WALL
    const h = across ? WALL : DOOR * 2
    const exit = i === this.exitDoor
    // Gold posts either side of the doorway.
    const posts: [number, number, number, number][] = across
      ? [
          [x - 4, y + 1, 4, h - 2],
          [x + w, y + 1, 4, h - 2],
        ]
      : [
          [x + 1, y - 4, w - 2, 4],
          [x + 1, y + h, w - 2, 4],
        ]
    for (const [px, py, pw, ph] of posts)
      bevel(g, px, py, pw, ph, RAMPS.gold, { depth: 1 })
    // The opening, banded from backstage dark (or the exit's green light) to the floor.
    const bands = exit ? DOOR_BANDS.exit : DOOR_BANDS.closed
    for (let b = 0; b < 5; b++) {
      g.fillStyle = bands[b]!
      if (across)
        g.fillRect(x, d.side === 0 ? y + b * 2 : y + h - (b + 1) * 2, w, 2)
      else g.fillRect(d.side === 3 ? x + b * 2 : x + w - (b + 1) * 2, y, 2, h)
    }
    if (exit) {
      glow(g, d.x, d.y, 30, RAMPS.leaf[3], 0.4 + 0.15 * Math.sin(this.tick / 6))
      drawText(
        g,
        'EXIT',
        d.x + (d.side === 1 ? -22 : d.side === 3 ? 22 : 0),
        d.y + (d.side === 0 ? 6 : d.side === 2 ? -12 : -3),
        { align: 'center', color: RAMPS.leaf[4], outline: INK },
      )
      return
    }
    // Closed: two sliding steel panels with a pink stud each.
    const half = DOOR - 1
    const panels: [number, number, number, number][] = across
      ? [
          [x + 1, y + 2, half - 1, h - 4],
          [x + DOOR + 1, y + 2, half - 1, h - 4],
        ]
      : [
          [x + 2, y + 1, w - 4, half - 1],
          [x + 2, y + DOOR + 1, w - 4, half - 1],
        ]
    for (const [px, py, pw, ph] of panels) {
      bevel(g, px, py, pw, ph, RAMPS.steel, { depth: 1 })
      g.fillStyle = RAMPS.pink[3]
      g.fillRect(px + Math.floor(pw / 2) - 1, py + Math.floor(ph / 2) - 1, 2, 2)
      g.fillStyle = RAMPS.pink[4]
      g.fillRect(px + Math.floor(pw / 2) - 1, py + Math.floor(ph / 2) - 1, 1, 1)
    }
    // While crashers are still streaming in, warning lamps blink on the posts.
    if (this.waveTimer > 0 && Math.floor(this.tick / 12) % 2 === 0) {
      g.save()
      g.globalCompositeOperation = 'lighter'
      g.globalAlpha = 0.45
      for (const [px, py, pw, ph] of posts)
        halo(g, px + pw / 2, py + ph / 2, 3, RAMPS.ember[2])
      g.restore()
      for (const [px, py, pw, ph] of posts) {
        g.fillStyle = RAMPS.ember[4]
        g.fillRect(
          Math.round(px + pw / 2) - 1,
          Math.round(py + ph / 2) - 1,
          2,
          2,
        )
      }
    }
  }

  private renderExitArrows(
    g: CanvasRenderingContext2D,
    d: { x: number; y: number; side: number },
  ) {
    // Chevrons on the floor run toward the open exit.
    const inward = EXIT_INWARD[d.side]!
    const start = d.side % 2 ? 40 : 18
    const step = Math.floor(this.tick / 6)
    for (let k = 0; k < 3; k++) {
      const dist = start + k * 9
      drawSprite(
        g,
        d.side % 2 ? CHEVRON_LEFT : CHEVRON_UP,
        d.x + inward[0] * dist,
        d.y + inward[1] * dist,
        {
          flipX: d.side === 1,
          flipY: d.side === 2,
          alpha: (step + k) % 3 === 0 ? 1 : 0.4,
        },
      )
    }
  }

  private renderShadows(g: CanvasRenderingContext2D) {
    for (const p of this.prizes) dropShadow(g, p.x, p.y + 6, 6, 1.6, 0.35)
    if (this.boss) dropShadow(g, this.boss.x, this.boss.y + 21, 44, 5, 0.4)
    for (const c of this.crashers)
      dropShadow(g, c.x, c.y + 7, c.kind === 'bouncer' ? 6 : 5, 1.6, 0.35)
    for (const d of this.dancers)
      dropShadow(g, d.x, d.y + 7, 4, 1.4, 0.3 * Math.min(1, d.life / 25))
    if (this.dead === 0 && !this.over)
      dropShadow(g, this.px, this.py + 8, 6, 1.8, 0.4)
  }

  private renderSparkle(g: CanvasRenderingContext2D) {
    if (this.invuln > 0 && Math.floor(this.tick / 4) % 2) return
    const x = Math.round(this.px)
    const y = Math.round(this.py)
    const view: View =
      this.aim.x !== 0 ? 'side' : this.aim.y < 0 ? 'back' : 'front'
    const pace = Math.floor(this.stride / 7) % 2
    const frame = this.striding ? 1 + pace : 0
    // The confetti cannon sits on Sparkle's aim; behind when aiming away from us.
    const cannon = () => {
      const mx = x + this.aim.x * 8
      const my = y - 1 + this.aim.y * 7
      const cool = this.rapid > 0 ? RAPID_COOLDOWN : FIRE_COOLDOWN
      if (this.fireCooldown >= cool - 1) glow(g, mx, my, 9, RAMPS.pink[3], 0.7)
      shadedOrb(g, mx, my, 2.5, RAMPS.pink)
    }
    if (this.aim.y < 0) cannon()
    drawSprite(g, HERO_SPRITES[view][frame]!, x, y + 8 - (frame ? pace : 0), {
      anchor: 'feet',
      flipX: this.aim.x < 0,
    })
    if (this.aim.y >= 0) cannon()
    if (
      this.shield > 0 &&
      !(this.shield < 120 && Math.floor(this.tick / 4) % 2)
    ) {
      glow(g, x, y - 1, 15, RAMPS.teal[3], 0.3)
      g.lineWidth = 1
      g.strokeStyle = rgba(RAMPS.teal[3], 0.85)
      g.beginPath()
      g.arc(x, y - 1, 11, 0, Math.PI * 2)
      g.stroke()
      g.strokeStyle = RAMPS.teal[4]
      g.beginPath()
      g.arc(x, y - 1, 11, Math.PI * 1.05, Math.PI * 1.45)
      g.stroke()
      g.fillStyle = '#ffffff'
      for (let k = 0; k < 2; k++) {
        const a = this.tick / 12 + k * Math.PI
        g.fillRect(
          Math.round(x + Math.cos(a) * 11) - 1,
          Math.round(y - 1 + Math.sin(a) * 11) - 1,
          2,
          2,
        )
      }
    }
  }

  private renderCrasher(g: CanvasRenderingContext2D, c: Crasher) {
    const look = CRASHER_LOOKS.get(c.color) ?? FALLBACK_LOOK
    let frame = Math.floor(c.t / 8) % 2
    let lift = Math.round(Math.abs(Math.sin(c.t / 5)))
    let flip = this.px < c.x
    if (c.kind === 'bouncer') {
      lift = Math.round(Math.sin(((c.t % 20) / 20) * Math.PI) * 4)
      frame = lift === 0 ? 1 : 0
      flip = c.vx < 0
    } else if (c.kind === 'conga') {
      frame = Math.floor(c.t / 10) % 2
      if (c.leader) flip = c.leader.x < c.x
    } else if (c.kind === 'thrower') {
      frame = c.t % 90 < 12 ? 1 : 0
    }
    drawSprite(g, look[c.kind][frame]!, c.x, c.y + 7 - lift, {
      anchor: 'feet',
      flipX: flip,
    })
  }

  private renderDancer(g: CanvasRenderingContext2D, d: Dancer) {
    // Confetti'd: arms up, a happy face, hopping off the set.
    const look = CRASHER_LOOKS.get(d.color) ?? FALLBACK_LOOK
    const hop = Math.round(Math.abs(Math.sin(d.life / 4)) * 4)
    drawSprite(
      g,
      look.dancer[Math.floor(d.life / 6) % 2]!,
      d.x,
      d.y + 7 - hop,
      {
        anchor: 'feet',
        flipX: d.vx < 0,
        alpha: Math.min(1, d.life / 25),
      },
    )
  }

  private renderStreamers(g: CanvasRenderingContext2D) {
    if (!this.streamers.length) return
    g.save()
    g.globalCompositeOperation = 'lighter'
    g.globalAlpha = 0.25
    for (const s of this.streamers) halo(g, s.x, s.y, 4, RAMPS.pink[3])
    g.restore()
    const sprite = STREAMER_SPRITES[Math.floor(this.tick / 4) % 2]!
    for (const s of this.streamers) drawSprite(g, sprite, s.x, s.y)
  }

  private renderShots(g: CanvasRenderingContext2D) {
    if (!this.shots.length) return
    const spin = Math.floor(this.tick / 3)
    const colour = (s: Shot) => CONFETTI[(s.hue + spin) % CONFETTI.length]!
    g.save()
    g.globalCompositeOperation = 'lighter'
    g.globalAlpha = 0.32
    for (const s of this.shots) halo(g, s.x, s.y, 3, colour(s))
    g.restore()
    for (const s of this.shots) {
      const sprites = SHOT_SPRITES.get(colour(s))!
      drawSprite(g, sprites[(spin + s.hue) % 2]!, s.x, s.y)
    }
  }

  private renderConfetti(g: CanvasRenderingContext2D) {
    // Burst particles are paper confetti, fluttering between face-on and edge-on.
    for (const p of this.particles) {
      g.globalAlpha = Math.min(1, Math.max(0, p.life / 30))
      const ramp = tintOf(p.color)
      const x = Math.round(p.x)
      const y = Math.round(p.y)
      if ((p.life >> 2) % 2) {
        g.fillStyle = ramp[3]
        g.fillRect(x - 1, y - 1, 2, 2)
        g.fillStyle = ramp[1]
        g.fillRect(x, y, 1, 1)
      } else {
        g.fillStyle = ramp[2]
        g.fillRect(x - 1, y, 3, 1)
      }
    }
    g.globalAlpha = 1
  }

  private renderBoss(g: CanvasRenderingContext2D, b: Boss) {
    const x = Math.round(b.x)
    const y = Math.round(b.y)
    const sprite =
      b.flash > 0 ? FLOAT_FLASH : FLOAT_SPRITES[Math.floor(b.t / 8) % 2]!
    drawSprite(g, sprite, x - FLOAT_CX - 1, y - FLOAT_CY - 1, {
      anchor: 'topleft',
    })
    // Candle flames flicker and glow.
    for (let i = 0; i < 4; i++) {
      const fx = x - 15 + i * 10
      const fy = y - 31
      const flick = Math.floor(this.tick / 5 + i) % 2
      glow(g, fx + 1, fy + 1, 8, RAMPS.gold[3], 0.55)
      g.fillStyle = INK
      g.fillRect(fx - 1, fy - 1 - flick, 4, 5 + flick)
      g.fillStyle = flick ? RAMPS.ember[3] : RAMPS.gold[3]
      g.fillRect(fx, fy - flick, 2, 3 + flick)
      g.fillStyle = RAMPS.gold[4]
      g.fillRect(fx, fy + 1, 2, 1)
    }
    gauge(g, x - 40, y - 37, 80, 3, b.hp / b.maxHp, RAMPS.leaf)
  }

  private renderPrize(g: CanvasRenderingContext2D, p: Prize) {
    if (p.life < 90 && Math.floor(this.tick / 5) % 2) return
    const bob = Math.round(Math.sin((this.tick + p.x) / 9) * 1.5)
    const x = p.x
    const y = p.y - 1 + bob
    glow(
      g,
      p.x,
      p.y,
      13,
      PRIZE_GLOW[p.kind],
      0.32 + 0.12 * Math.sin(this.tick / 7),
    )
    switch (p.kind) {
      case 'cash':
        drawSprite(g, CASH_SPRITE, x - 1, y - 2)
        drawSprite(g, CASH_SPRITE, x + 1, y)
        break
      case 'toaster':
        drawSprite(g, TOASTER_SPRITE, x, y)
        break
      case 'car':
        drawSprite(g, CAR_SPRITE, x, y)
        break
      default:
        shadedOrb(g, x, y, 5.5, POWER_RAMPS[p.kind])
        drawText(g, p.kind[0]!.toUpperCase(), x + 1, y - 3, {
          align: 'center',
          color: INK,
        })
    }
    // A twinkle on the prize now and then.
    if ((this.tick + Math.round(p.x)) % 40 < 8) {
      const tx = Math.round(x) + 5
      const ty = Math.round(y) - 5
      g.fillStyle = RAMPS.gold[4]
      g.fillRect(tx - 2, ty, 5, 1)
      g.fillRect(tx, ty - 2, 1, 5)
      g.fillStyle = '#ffffff'
      g.fillRect(tx, ty, 1, 1)
    }
  }

  private renderHud(g: CanvasRenderingContext2D) {
    // Score.
    hudPanel(g, 2, 1, 90, 15)
    drawText(g, String(this.score).padStart(7, '0'), 6, 2, {
      scale: 2,
      color: RAMPS.gold[3],
      shadow: INK,
    })
    // Power-ups: lit with a draining gauge while they last.
    hudPanel(g, 96, 1, 26, 15)
    const powers = [
      ['S', this.spread, POWER_TICKS, RAMPS.purple],
      ['R', this.rapid, POWER_TICKS, RAMPS.rust],
      ['D', this.shield, SHIELD_TICKS, RAMPS.teal],
    ] as const
    powers.forEach(([letter, left, full, ramp], i) => {
      const px = 98 + i * 8
      if (left > 0) drawText(g, letter, px, 3, { color: ramp[3], outline: INK })
      else drawText(g, letter, px, 3, { color: RAMPS.night[3] })
      gauge(g, px, 12, 5, 2, left / full, ramp)
    })
    // The host's countdown.
    hudPanel(g, CX - 36, 1, 72, 15)
    const seconds = Math.ceil(this.roomTimer / 60)
    const urgent = seconds <= 10 && Math.floor(this.tick / 10) % 2 === 0
    if (seconds <= 10)
      glow(g, CX + 20, 9, 22, RAMPS.ember[2], urgent ? 0.5 : 0.25)
    drawText(g, 'TIME', CX - 31, 3, { color: RAMPS.cream[3], shadow: INK })
    gauge(
      g,
      CX - 31,
      12,
      23,
      2,
      this.roomTimer / ROOM_TICKS,
      seconds <= 10 ? RAMPS.ember : RAMPS.gold,
    )
    drawSprite(g, STOPWATCH_SPRITE, CX - 1, 8)
    drawText(g, String(seconds), CX + 31, 2, {
      scale: 2,
      align: 'right',
      color: urgent ? RAMPS.ember[3] : RAMPS.gold[4],
      shadow: INK,
    })
    // Contestants in reserve.
    hudPanel(g, 200, 1, 50, 15)
    for (let i = 0; i < 5; i++) {
      drawSprite(
        g,
        i < this.lives - 1 ? LIFE_SPRITE : LIFE_EMPTY,
        207 + i * 9,
        9,
      )
    }
    // High score and studio.
    hudPanel(g, 254, 1, 64, 15)
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W - 6, 2, {
      align: 'right',
      color: RAMPS.pink[3],
      shadow: INK,
    })
    drawText(g, `STUDIO ${this.level}`, W - 6, 9, {
      align: 'right',
      color: RAMPS.teal[3],
      shadow: INK,
    })
    if (this.banner) {
      drawText(g, this.banner.text, CX, 90, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.purple[1],
      })
      if (this.banner.sub)
        drawText(g, this.banner.sub, CX, 110, {
          align: 'center',
          color: RAMPS.gold[3],
          outline: INK,
        })
    }
  }
}

const PRIZE_NAMES: Record<PrizeKind, string> = {
  cash: 'CASH!',
  toaster: 'A TOASTER!',
  car: 'A NEW CAR!',
  spread: 'SPREAD SHOT!',
  rapid: 'RAPID FIRE!',
  shield: 'SHIELD!',
}

const prizeShowPanic: ArcadeGameModule = {
  create: (options) => new PrizeShowPanic(options),
}

export const create = prizeShowPanic.create
export default prizeShowPanic
