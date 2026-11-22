// /utils/arcade/games/gloomInvaders.ts
//
// Gloom Invaders -- the Kind Robots Arcade's Space Invaders riff (conductor
// kr-arcade/t-009 game factory). Rows of grumpy gloom clouds march down the
// sky. Sunny, a little solar robot, shines sunbeams up at them: every cloud a
// beam reaches turns into a smiling rain cloud and drifts off to water the
// garden. Rainbow umbrellas shelter Sunny from the gloom drops, but they wear
// away (Sunny's own beams nibble them too).
//
// Each wave starts lower and marches faster, the last clouds of a wave hurry,
// and a rainbow kite crosses the top now and then for a mystery bonus. Left
// and right move; A (or Up) shines a sunbeam. One beam at a time, so aim. If
// the gloom reaches the ground Sunny loses a life and the wave regroups.
//
// Depth pass slice 1, "Weather and the garden" (conductor kr-arcade/t-132):
// the Weather mode strings fronts together from data (utils/arcade/
// gloomInvaders/weather.ts): the 11 x 5 grid, drifting rows, the diagonal
// squall line, the spiral ring and the jet-stream rows, with drizzlers,
// splitter puffs, diver gusts, hailers and thunderheads and their drizzle,
// hail, sleet and lightning. Hold A to charge the Sun Lance, which pierces a
// whole column. Every cloud cheered rains on the plot below it, and plots
// bloom into helpers (garden.ts); drops that land wilt them. A heartbeat loop
// quickens with the march. Classic Sky keeps the original rules.

import { levelCurve } from '../curve'
import { drawText, measureText } from '../font'
import {
  INK,
  RAMPS,
  Sparkles,
  backdropRng,
  bandedGradient,
  cachedLayer,
  drawCloud,
  drawRidge,
  drawSprite,
  dropShadow,
  glow,
  hudPanel,
  mirrorSprite,
  mix,
  pixelSprite,
  rgba,
  ridge,
  shadedOrb,
  vignette,
} from '../snes'
import type { PixelSprite, Ramp } from '../snes'
import type { MusicLoop } from '../sound'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'
import {
  BLOOM_AT,
  HELPER_NAMES,
  HELPER_TICKS,
  VINE_CELLS,
  newGarden,
  plotCenter,
  plotIndex,
  spendPumpkin,
  waterPlot,
  wiltPlot,
} from '../gloomInvaders/garden'
import type { HelperKind, Plot } from '../gloomInvaders/garden'
import { calendarFront } from '../gloomInvaders/calendar'
import {
  readGloomCalendarSave,
} from '../gloomInvaders/calendarSave'
import type { GloomCalendarSave } from '../gloomInvaders/calendarSave'
import {
  CLASSIC_FRONT,
  CLOUD_H,
  CLOUD_KINDS,
  CLOUD_W,
  DIVE_MULTIPLIER,
  H,
  HALF_OFFSETS,
  HEARTBEAT_LOOPS,
  HURRY_STEP_X,
  SPLIT_PAIR_BONUS,
  STEP_X,
  STRIKE_FLASH,
  STRIKE_HALF,
  STRIKE_TELL,
  W,
  bounceHail,
  formationSlots,
  heartbeatTier,
  marchStep,
  newDrop,
  newFormation,
  rainKind,
  slotHome,
  stepDrop,
  weatherFront,
} from '../gloomInvaders/weather'
import type {
  CloudKind,
  Drop,
  DropKind,
  FormationState,
  Front,
  Strike,
} from '../gloomInvaders/weather'

const GROUND_Y = H - 18
const PLAYER_Y = H - 34
const PLAYER_HALF = 8
const PLAYER_SPEED = 2
const BEAM_SPEED = 6
const AUTOFIRE_COOLDOWN = 14

/** Hold A (with no beam in the sky) this long to charge the Sun Lance. */
export const LANCE_CHARGE = 36
const LANCE_HALF = 5
/** The pumpkin's launch clears a column this wide either side of its plot. */
const PUMPKIN_HALF = 10
/** Ticks a drizzler darkens, and a hailer glints, before its drop falls. */
const DRIZZLE_TELL = 40
const HAIL_TELL = 30
/** A diver gust's red-edged wiggle, then its swoop at Sunny and back. */
export const DIVE_TELL = 45
export const SWOOP_TICKS = 140
/** Where a bean vine's leafy canopy hangs (between the umbrellas and Sunny). */
const VINE_Y = PLAYER_Y - 20

export type GloomMode = 'weather' | 'classic' | 'calendar'
export const GLOOM_MODES: readonly GloomMode[] = [
  'weather',
  'classic',
  'calendar',
]
const MODE_NAMES: Record<GloomMode, string> = {
  weather: 'WEATHER',
  classic: 'CLASSIC SKY',
  calendar: 'YEAR OF WEATHER',
}
const MODE_BLURBS: Record<GloomMode, string> = {
  weather: 'NEW CLOUDS, SUN LANCE, A GARDEN',
  classic: 'THE ORIGINAL 9 BY 5 GLOOM',
  calendar: '18 AUTHORED SPRING / SUMMER FRONTS',
}

const UMBRELLAS = 4
const UMB_COLS = 22
const UMB_ROWS = 13
const UMB_CELL = 2
const UMBRELLA_Y = H - 84

const START_LIVES = 3
const FIRST_EXTRA = 1500
const EXTRA_EVERY = 10_000
const DEATH_TICKS = 100
const WAVE_CLEAR_TICKS = 130

const KITE_Y = 32
/** The rainbow kite's mystery values, picked by how many beams you've shone. */
const KITE_VALUES = [
  100, 50, 50, 100, 150, 100, 100, 50, 300, 100, 100, 100, 50, 150, 100,
]

const RAINBOW = [
  '#ef4444',
  '#f97316',
  '#facc15',
  '#4ade80',
  '#38bdf8',
  '#a78bfa',
]

export const GLOOM_CURVES = {
  /** Extra ticks between formation steps while the whole wave is alive. */
  march: { start: 20, step: -2, limit: 11 },
  /** Where the formation's top row starts: each wave a little lower. */
  startY: { start: 52, step: 8, limit: 100 },
  dropEvery: { start: 48, step: -4, limit: 16 },
  maxDrops: { start: 2, step: 0.5, limit: 6 },
  dropSpeed: { start: 2, step: 0.15, limit: 3.6 },
  kiteEvery: { start: 1500, step: -60, limit: 900 },
  /** Ticks between diver gusts peeling out of the formation. */
  diveEvery: { start: 360, step: -20, limit: 170 },
} as const

type Dive = { phase: 'tell' | 'swoop'; t: number; targetX: number }
type Cloud = {
  kind: CloudKind
  col: number
  row: number
  alive: boolean
  hp: number
  /** The cloud's box: where it is drawn and where beams find it. */
  x: number
  y: number
  w: number
  h: number
  /** Its slot in the formation (a diver swoops away from it and back). */
  hx: number
  hy: number
  /** Ticks of a hit flash (a thunderhead takes three beams). */
  flash: number
  /** A drizzler darkening or a hailer glinting before its drop falls. */
  tell: number
  tellKind: DropKind | null
  dive: Dive | null
  /** A split puff's half (-1 left, 1 right) and the pair it belongs to. */
  half: -1 | 0 | 1
  pair: number
}
type Beam = {
  x: number
  y: number
  /** Half its width beyond the 1px core: a Sun Lance and a pumpkin are wide. */
  half: number
  pierce: boolean
  helper: boolean
  pumpkin?: boolean
  hit?: Set<Cloud>
}
type ActiveStrike = Strike & { source: Cloud; stopY: number }
type Bee = { x: number; y: number; tx: number; ty: number; t: number }
type Happy = { x: number; y: number; life: number }
type Umbrella = { x: number; cells: boolean[] }
type Kite = { x: number; dir: 1 | -1 }
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = { x: number; y: number; text: string; life: number }

/** The umbrella bitmap: a dome canopy over a hooked handle. */
function umbrellaShape(): boolean[] {
  const cells: boolean[] = []
  const cx = (UMB_COLS - 1) / 2
  for (let r = 0; r < UMB_ROWS; r++) {
    for (let c = 0; c < UMB_COLS; c++) {
      let on: boolean
      if (r < 9) {
        const dx = (c - cx) / (UMB_COLS / 2)
        const dy = (8.5 - r) / 9
        on = dx * dx + dy * dy <= 1
        // Scalloped hem between the ribs.
        if (r === 8 && c % 5 === 2) on = false
      } else {
        on = c === 10 || c === 11
        if (r === UMB_ROWS - 1 && (c === 7 || c === 8 || c === 9)) on = true
        if (r === UMB_ROWS - 2 && c === 7) on = true
      }
      cells.push(on)
    }
  }
  return cells
}

// --- 16-bit art (utils/arcade/snes.ts) -------------------------------------------

/** How many sky stages there are: the sky brightens one stage per cleared wave. */
const SKY_STAGES = 6

/** Gloom-cloud ramps by row type: the storm, the grey middle rows, the dark grumps. */
const GLOOM_RAMPS: readonly Ramp[] = [
  ['#1c0f3d', '#36206e', '#5a3aa6', '#8a6fdc', '#c9bbff'],
  ['#1c2338', '#353f5c', '#58658a', '#8a97b8', '#c4cde0'],
  ['#141a2e', '#262f4c', '#414d6e', '#6d7a9c', '#a6b2cc'],
]
const HAPPY_RAMP: Ramp = [
  RAMPS.purple[1],
  RAMPS.purple[3],
  '#e4dcff',
  RAMPS.purple[4],
  '#ffffff',
]
/** The six umbrella and flower colours, red to violet, as shading ramps. */
const RAINBOW_RAMPS: readonly Ramp[] = [
  ['#4a0d1a', '#a3172f', '#e8383d', '#f87171', '#fecaca'],
  RAMPS.rust,
  RAMPS.gold,
  RAMPS.leaf,
  RAMPS.sky,
  RAMPS.purple,
]

type Puff = readonly [x: number, y: number, r: number]
/** Puff layouts per row type: a tall storm anvil, the classic puff, a squat grump. */
const GLOOM_SHAPES: readonly (readonly Puff[])[] = [
  [
    [4.5, 7, 4.5],
    [9.5, 4.5, 6],
    [14, 6.5, 4.5],
  ],
  [
    [5, 7, 5],
    [10, 5, 6],
    [14, 7, 4.5],
  ],
  [
    [5.5, 7.5, 4.5],
    [10.5, 6, 5],
    [14, 8, 3.5],
  ],
]

/**
 * A cloud body as shade digits '0'..'4' (ramp steps): each pixel lit by the puff it sits highest
 * on, from the upper left, with the flat underside in shadow. `wobble` breathes the puffs.
 */
function cloudRows(
  puffs: readonly Puff[],
  wobble: number,
  box: { w: number; h: number; flatY: number; shadeY: number } = {
    w: CLOUD_W,
    h: CLOUD_H,
    flatY: 7,
    shadeY: 8.5,
  },
): string[] {
  const rows: string[] = []
  for (let r = 0; r < box.h; r++) {
    let row = ''
    for (let c = 0; c < box.w; c++) {
      const px = c + 0.5
      const py = r + 0.5
      let light = -Infinity
      puffs.forEach(([cx, cy, pr], i) => {
        const rr = pr + (i % 2 ? -wobble : wobble)
        const nx = (px - cx) / rr
        const ny = (py - cy) / rr
        const d2 = nx * nx + ny * ny
        if (d2 > 1) return
        light = Math.max(light, 0.4 * Math.sqrt(1 - d2) - 0.55 * ny - 0.3 * nx)
      })
      if (light === -Infinity && px >= 2 && px <= box.w - 1 && py >= box.flatY)
        light = -0.6
      if (light !== -Infinity) light -= Math.max(0, py - box.shadeY) * 0.18
      row +=
        light === -Infinity
          ? '.'
          : light > 0.5
            ? '4'
            : light > 0.18
              ? '3'
              : light > -0.15
                ? '2'
                : light > -0.45
                  ? '1'
                  : '0'
    }
    rows.push(row)
  }
  return rows
}

/** Paint single pixels (x, y, palette letter) over sprite rows, growing them as needed. */
function overlay(
  rows: string[],
  marks: readonly (readonly [number, number, string])[],
): string[] {
  const out = [...rows]
  for (const [x, y, ch] of marks) {
    while (out.length <= y) out.push('.'.repeat(CLOUD_W))
    const row = out[y]!.padEnd(x + 1, '.')
    out[y] = row.slice(0, x) + ch + row.slice(x + 1)
  }
  return out
}

const GRUMP_EYES = [
  [6, 5, 'w'],
  [7, 5, 'k'],
  [6, 6, 'k'],
  [7, 6, 'k'],
  [11, 5, 'k'],
  [12, 5, 'w'],
  [11, 6, 'k'],
  [12, 6, 'k'],
] as const
const FROWN = [
  [7, 9, 'k'],
  [8, 9, 'k'],
  [9, 9, 'k'],
  [10, 9, 'k'],
  [11, 9, 'k'],
  [6, 10, 'k'],
  [12, 10, 'k'],
] as const
const STORM_BROWS = [
  [5, 3, 'k'],
  [6, 3, 'k'],
  [7, 4, 'k'],
  [12, 3, 'k'],
  [13, 3, 'k'],
  [11, 4, 'k'],
] as const
const BOLT = [
  [10, 12, 'Y'],
  [9, 13, 'Y'],
  [10, 13, 'y'],
  [8, 14, 'Y'],
  [9, 14, 'y'],
  [8, 15, 'y'],
] as const

function drizzle(off: number) {
  return [
    [4 + off, 13, 'r'],
    [4 + off, 14, 'R'],
    [11 + off, 13, 'r'],
    [11 + off, 14, 'R'],
  ] as const
}

function rampPalette(ramp: Ramp): Record<string, string> {
  return {
    '0': ramp[0],
    '1': ramp[1],
    '2': ramp[2],
    '3': ramp[3],
    '4': ramp[4],
  }
}

/** GLOOM_SPRITES[row type][march frame]: 18x12 body art (+ drizzle or a bolt below), outlined. */
const GLOOM_SPRITES = GLOOM_SHAPES.map((puffs, kind) =>
  [0, 1].map((frame) => {
    let rows = cloudRows(puffs, frame ? 0.6 : -0.6)
    rows = overlay(rows, [...GRUMP_EYES, ...FROWN])
    if (kind === 0) {
      rows = overlay(rows, STORM_BROWS)
      if (frame) rows = overlay(rows, BOLT)
    } else {
      rows = overlay(rows, drizzle(frame ? 0 : 3))
    }
    return pixelSprite(rows, {
      ...rampPalette(GLOOM_RAMPS[kind]!),
      k: INK,
      w: '#ffffff',
      Y: RAMPS.gold[4],
      y: RAMPS.gold[3],
      r: RAMPS.purple[3],
      R: RAMPS.purple[2],
    })
  }),
)

/** A cloud the sunbeam reached: lit up, smiling, rosy-cheeked. */
const HAPPY_SPRITE = pixelSprite(
  overlay(cloudRows(GLOOM_SHAPES[1]!, 0), [
    [6, 5, 'k'],
    [7, 5, 'k'],
    [6, 6, 'k'],
    [7, 6, 'w'],
    [11, 5, 'k'],
    [12, 5, 'k'],
    [11, 6, 'w'],
    [12, 6, 'k'],
    [6, 9, 'k'],
    [12, 9, 'k'],
    [7, 10, 'k'],
    [8, 10, 'k'],
    [9, 10, 'k'],
    [10, 10, 'k'],
    [11, 10, 'k'],
    [4, 8, 'c'],
    [5, 8, 'c'],
    [13, 8, 'c'],
    [14, 8, 'c'],
  ]),
  { ...rampPalette(HAPPY_RAMP), k: INK, w: '#ffffff', c: RAMPS.pink[3] },
)

// --- the weather's new clouds (slice 1) -----------------------------------------------------------

const DRIZZLE_RAMP: Ramp = [
  '#0c1f33',
  '#173a5c',
  '#24608a',
  '#4f93b8',
  '#a9d7ea',
]
const DRIZZLE_DARK_RAMP: Ramp = [
  '#060f1c',
  '#0d2238',
  '#163a58',
  '#28587a',
  '#517f9c',
]
const SPLIT_RAMP: Ramp = ['#3a1d33', '#5e3456', '#8a5a80', '#c294b8', '#f4dcee']
const DIVER_RAMP: Ramp = ['#123040', '#1f5466', '#3a8599', '#79bfcc', '#d2f3f7']
const HAIL_RAMP: Ramp = ['#1b2a4a', '#33507a', '#5b84b3', '#9ec3e6', '#eef8ff']
const THUNDER_RAMP: Ramp = [
  '#07071a',
  '#13133a',
  '#232359',
  '#3a3a80',
  '#6b6bb8',
]
/** A thunderhead wears a crackling gold edge, so it never passes for an anvil. */
const THUNDER_EDGE = RAMPS.gold[2]

const SLEEPY_EYES = [
  [5, 5, 'k'],
  [6, 5, 'k'],
  [7, 5, 'k'],
  [6, 6, 'k'],
  [7, 6, 'k'],
  [11, 5, 'k'],
  [12, 5, 'k'],
  [13, 5, 'k'],
  [11, 6, 'k'],
  [12, 6, 'k'],
] as const
const SEAM = [
  [9, 1, 'k'],
  [9, 3, 'k'],
  [9, 4, 'k'],
  [9, 7, 'k'],
  [9, 8, 'k'],
  [9, 10, 'k'],
] as const
const SWIRL = [
  [2, 6, 'w'],
  [3, 5, 'w'],
  [4, 5, 'w'],
  [14, 3, 'w'],
  [15, 3, 'w'],
  [16, 4, 'w'],
] as const

/** Shade digits for a cloud, with its face and marks, as a sprite on `ramp`. */
function cloudSprite(
  rows: string[],
  ramp: Ramp,
  outline: string | null = INK,
): PixelSprite {
  return pixelSprite(
    rows,
    {
      ...rampPalette(ramp),
      k: INK,
      w: '#ffffff',
      Y: RAMPS.gold[4],
      y: RAMPS.gold[3],
      r: RAMPS.purple[3],
      R: RAMPS.purple[2],
      i: '#dff4ff',
      t: RAMPS.water[3],
      T: RAMPS.water[2],
    },
    { outline },
  )
}

function faced(puffs: readonly Puff[], frame: number): string[] {
  return overlay(cloudRows(puffs, frame ? 0.6 : -0.6), [
    ...GRUMP_EYES,
    ...FROWN,
  ])
}

const DRIZZLE_SHAPE: readonly Puff[] = [
  [5, 7, 5],
  [10, 5.5, 5.5],
  [14, 7.5, 4],
]
const DIVER_SHAPE: readonly Puff[] = [
  [4, 7.5, 4],
  [9, 6, 5],
  [14, 7, 4.5],
]
const HALF_SHAPE: readonly Puff[] = [
  [3, 4.5, 3],
  [6.5, 3.5, 3.5],
]

function drizzlerRows(frame: number): string[] {
  return overlay(cloudRows(DRIZZLE_SHAPE, frame ? 0.6 : -0.6), [
    ...SLEEPY_EYES,
    ...FROWN,
    [5, 13, 't'],
    [5, 14, 'T'],
    [13, 13, 't'],
    [13, 14, 'T'],
  ])
}

/** NEW_SPRITES[kind][march frame] for the weather's clouds (the classic three stay as they were). */
const NEW_SPRITES: Partial<Record<CloudKind, readonly PixelSprite[]>> = {
  drizzler: [0, 1].map((f) => cloudSprite(drizzlerRows(f), DRIZZLE_RAMP)),
  splitter: [0, 1].map((f) =>
    cloudSprite(overlay(faced(GLOOM_SHAPES[1]!, f), SEAM), SPLIT_RAMP),
  ),
  diver: [0, 1].map((f) =>
    cloudSprite(overlay(faced(DIVER_SHAPE, f), SWIRL), DIVER_RAMP),
  ),
  hailer: [0, 1].map((f) =>
    cloudSprite(
      overlay(
        faced(GLOOM_SHAPES[1]!, f),
        f
          ? [
              [7, 2, 'w'],
              [15, 6, 'w'],
              [6, 13, 'i'],
            ]
          : [
              [4, 3, 'w'],
              [13, 5, 'w'],
              [12, 13, 'i'],
            ],
      ),
      HAIL_RAMP,
    ),
  ),
  thunderhead: [0, 1].map((f) =>
    cloudSprite(
      overlay(overlay(faced(GLOOM_SHAPES[0]!, f), STORM_BROWS), f ? BOLT : []),
      THUNDER_RAMP,
      THUNDER_EDGE,
    ),
  ),
  half: [0, 1].map((f) =>
    cloudSprite(
      overlay(
        cloudRows(HALF_SHAPE, f ? 0.4 : -0.4, {
          w: 10,
          h: 8,
          flatY: 4.5,
          shadeY: 5.5,
        }),
        [
          [3, 3, 'k'],
          [6, 3, 'k'],
          [4, 5, 'k'],
          [5, 5, 'k'],
        ],
      ),
      SPLIT_RAMP,
    ),
  ),
}
/** A drizzler about to drizzle: darker, with a drop swelling beneath. */
const DRIZZLER_DARK = [0, 1].map((f) =>
  cloudSprite(drizzlerRows(f), DRIZZLE_DARK_RAMP),
)
/** A diver gust about to peel out: the same gust with a red edge. */
const DIVER_RED = [0, 1].map((f) =>
  cloudSprite(overlay(faced(DIVER_SHAPE, f), SWIRL), DIVER_RAMP, '#ef4444'),
)

const DRIZZLE_DROP = pixelSprite(
  ['..w..', '.wtt.', 'wtTTt', 'tTTTt', '.tTt.'],
  { w: '#ffffff', t: RAMPS.teal[3], T: RAMPS.teal[2] },
)
const HAIL_STONE = pixelSprite(['.wi.', 'wiiI', 'iiII', '.II.'], {
  w: '#ffffff',
  i: '#cfe9ff',
  I: '#7fb2e0',
})
const SLEET_STREAK = pixelSprite(
  ['w..', 'sw.', '.sw', '..s', '.ws', 'ws.', 's..'],
  { w: '#ffffff', s: '#a5c4f0' },
)

// --- the garden's helpers -----------------------------------------------------------------------

const SUNFLOWER = pixelSprite(
  [
    '..y.y.y..',
    '.yYYYYYy.',
    'yYYoooYYy',
    '.YYoOoYY.',
    'yYYoooYYy',
    '.yYYYYYy.',
    '..y.g.y..',
    '....g....',
    '.Ll.g....',
    '..LLg.Ll.',
    '....gLL..',
    '....g....',
  ],
  {
    Y: RAMPS.gold[3],
    y: RAMPS.gold[2],
    o: RAMPS.earth[2],
    O: RAMPS.earth[1],
    g: RAMPS.leaf[2],
    L: RAMPS.leaf[3],
    l: RAMPS.leaf[1],
  },
)
const BEEHIVE = pixelSprite(
  [
    '...hhhh...',
    '..hHHHHh..',
    '.dddddddd.',
    '.hHHHHHHh.',
    'ddddkkdddd',
    'hHHHkkHHHh',
    'dddddddddd',
    '....gg....',
  ],
  {
    h: RAMPS.gold[4],
    H: RAMPS.gold[3],
    d: RAMPS.gold[1],
    k: INK,
    g: RAMPS.earth[2],
  },
)
const PUMPKIN = pixelSprite(
  [
    '.....g.....',
    '....gl.....',
    '..oOOoOOo..',
    '.oOPoOoPOo.',
    'oOPoOOOoPOo',
    'oOOoOOOoOOo',
    '.oOOoOoOOo.',
    '..ooooooo..',
  ],
  {
    o: RAMPS.rust[1],
    O: RAMPS.rust[2],
    P: RAMPS.rust[3],
    g: RAMPS.leaf[1],
    l: RAMPS.leaf[3],
  },
)
const STRAWBERRY = pixelSprite(
  [
    '..L...L....',
    '.LLl.LLl.L.',
    'LlrRLlrRLLl',
    '.rRRr.rRRr.',
    '.rRyr.ryRr.',
    '..rr...rr..',
  ],
  {
    r: RAMPS.ember[1],
    R: RAMPS.ember[2],
    y: RAMPS.gold[4],
    L: RAMPS.leaf[3],
    l: RAMPS.leaf[2],
  },
)
const BEE = pixelSprite(['ww.', 'yky', '.y.'], {
  w: '#ffffff',
  y: RAMPS.gold[3],
  k: INK,
})
const HELPER_SPRITES: Record<Exclude<HelperKind, 'beanVine'>, PixelSprite> = {
  sunflower: SUNFLOWER,
  beehive: BEEHIVE,
  pumpkin: PUMPKIN,
  strawberry: STRAWBERRY,
}

/** Vivid rain with a white rim and dark outline, readable on dark or daylight skies. */
export const DROP_SPRITES = (() => {
  const drop = pixelSprite(
    [
      '...w...',
      '..wco..',
      '.owcco.',
      '.occco.',
      '.ocbco.',
      '.occco.',
      '..cbo..',
      '..oco..',
      '...o...',
    ],
    { w: '#ffffff', c: '#67e8f9', b: '#0284c7', o: INK },
  )
  return [drop, mirrorSprite(drop)] as const
})()

const SUNNY_PALETTE = {
  h: RAMPS.teal[4],
  T: RAMPS.teal[2],
  t: RAMPS.teal[1],
  d: RAMPS.teal[0],
  k: INK,
  E: RAMPS.gold[4],
  p: RAMPS.pink[3],
  s: RAMPS.steel[2],
  S: RAMPS.steel[3],
  n: RAMPS.steel[1],
}
const SUNNY_BODY = [
  '.......nn.......',
  '..hhhhhhhhhhhh..',
  '.hTTTTTTTTTTTTt.',
  'hTkkkkkkkkkkkkTt',
  'hTkEEkkkkkkEEkTt',
  'hTkkkkkkkkkkkkTt',
  'hTpTTTTTTTTTpTtd',
  '.ttttttttttttdd.',
]
/** Sunny, the solar robot: two tread frames, so the wheels roll as Sunny drives. */
const SUNNY_SPRITES = [
  pixelSprite(
    [...SUNNY_BODY, '.sSsS......sSsS.', '.SsSs......SsSs.', '..nn........nn..'],
    SUNNY_PALETTE,
  ),
  pixelSprite(
    [...SUNNY_BODY, '.SsSs......SsSs.', '.sSsS......sSsS.', '..nn........nn..'],
    SUNNY_PALETTE,
  ),
] as const

/** A spare Sunny for the lives box. */
const LIFE_SPRITE = pixelSprite(
  ['..yy..', '.yYYy.', 'tTTTTt', 'tkEEkt', '.s..s.'],
  {
    y: RAMPS.gold[3],
    Y: RAMPS.gold[4],
    T: RAMPS.teal[3],
    t: RAMPS.teal[2],
    k: INK,
    E: RAMPS.gold[4],
    s: RAMPS.steel[2],
  },
)

/** The rainbow kite: a diamond banded red to violet, lit on the left, with its spars. */
const KITE_SPRITE = (() => {
  const palette: Record<string, string> = {
    z: RAMPS.earth[3],
    Z: RAMPS.earth[2],
  }
  const rows: string[] = []
  for (let r = 0; r < 12; r++) {
    const half = Math.round(8 - Math.abs(r - 5.5) * 1.4)
    const band = Math.floor(r / 2)
    const ramp = RAINBOW_RAMPS[band]!
    let row = ''
    for (let c = 0; c < 17; c++) {
      const dx = c - 8
      if (Math.abs(dx) > half) {
        row += '.'
        continue
      }
      if (c === 8) {
        row += 'z'
        continue
      }
      if (r === 5) {
        row += 'Z'
        continue
      }
      const shade =
        dx === -half && r < 6
          ? 4
          : dx < -half * 0.3
            ? 3
            : dx > half * 0.5
              ? 1
              : 2
      const key = String.fromCharCode(97 + band * 5 + shade)
      palette[key] = ramp[shade]!
      row += key
    }
    rows.push(row)
  }
  return pixelSprite(rows, palette)
})()

const BOW_SPRITES = [RAMPS.pink, RAMPS.gold].map((ramp) =>
  pixelSprite(['h.p', 'hkp', 'h.p'], { h: ramp[3], p: ramp[2], k: ramp[1] }),
)

const FLOWER_ROWS = [
  '..hPp...',
  '.hPPPp..',
  'hPPOPPp.',
  'PPOoOpd.',
  '.pPOpd..',
  '..pdd...',
  '...g....',
  'Ll.g....',
  '.LLg.Ll.',
  '...gLl..',
  '...g....',
]
/** FLOWER_SPRITES[colour][sway frame]: the head nods one pixel in the breeze. */
const FLOWER_SPRITES = RAINBOW_RAMPS.map((ramp) => {
  const palette = {
    h: ramp[4],
    P: ramp[3],
    p: ramp[2],
    d: ramp[1],
    O: RAMPS.gold[4],
    o: RAMPS.rust[2],
    g: RAMPS.leaf[2],
    L: RAMPS.leaf[3],
    l: RAMPS.leaf[1],
  }
  const sway = FLOWER_ROWS.map((row, i) =>
    i < 6 ? '.' + row.slice(0, 7) : i === 6 ? '....g...' : row,
  )
  return [
    pixelSprite(FLOWER_ROWS, palette),
    pixelSprite(sway, palette),
  ] as const
})

/** Sky bands, hill colours and the sun's height for each sky stage, darkest first. */
const SKIES = Array.from({ length: SKY_STAGES + 1 }, (_, stage) => {
  const t = stage / SKY_STAGES
  return {
    t,
    bands: [
      mix('#0b0a24', RAMPS.sky[1], t),
      mix(RAMPS.night[2], RAMPS.sky[2], t),
      mix('#3a1f6e', RAMPS.sky[3], t),
      mix('#6b2a7a', RAMPS.gold[3], t),
    ],
    far: mix('#2a1f5c', '#5a7fc0', t),
    farRim: mix('#4a3a8a', '#a9c8ef', t),
    near: mix('#15233a', RAMPS.leaf[1], t),
    nearRim: mix('#2b4a52', RAMPS.leaf[3], t),
    haze: [
      mix(RAMPS.night[1], RAMPS.purple[1], t),
      mix(RAMPS.night[1], RAMPS.purple[1], t),
      mix(RAMPS.night[2], RAMPS.sky[2], t),
      mix(RAMPS.night[3], RAMPS.sky[3], t),
      mix(RAMPS.night[4], '#ffffff', t),
    ] as Ramp,
  }
})

const FAR_HILLS = ridge(17, W, 30, 4)
const NEAR_HILLS = ridge(41, W, 16, 4)
const HAZE_CLOUDS = (() => {
  const rand = backdropRng(23)
  return Array.from({ length: 3 }, (_, i) => ({
    x: (W / 3) * i + rand() * 60,
    y: 262 + rand() * 18,
    size: 6 + rand() * 3,
    speed: 0.05 + rand() * 0.05,
  }))
})()

/** A canvas painted once (null headless, where the caller paints straight onto the screen). */
function bakeCanvas(
  w: number,
  h: number,
  paint: (k: CanvasRenderingContext2D) => void,
): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const k = canvas.getContext('2d')
  if (!k) return null
  paint(k)
  return canvas
}

/**
 * An umbrella as shaded 2x2 cells: each rainbow stripe on its own ramp, lit across the dome from
 * the upper left, every exposed top edge catching the light and every eroded underside in
 * shadow, all wrapped in an ink outline so the bites stay readable.
 */
function paintUmbrella(
  k: CanvasRenderingContext2D,
  cells: readonly boolean[],
  x0: number,
  y0: number,
) {
  const on = (r: number, c: number) =>
    r >= 0 &&
    r < UMB_ROWS &&
    c >= 0 &&
    c < UMB_COLS &&
    !!cells[r * UMB_COLS + c]
  k.fillStyle = INK
  for (let r = 0; r < UMB_ROWS; r++)
    for (let c = 0; c < UMB_COLS; c++)
      if (on(r, c))
        k.fillRect(
          x0 + c * UMB_CELL - 1,
          y0 + r * UMB_CELL - 1,
          UMB_CELL + 2,
          UMB_CELL + 2,
        )
  const stripe = UMB_COLS / RAINBOW_RAMPS.length
  for (let r = 0; r < UMB_ROWS; r++) {
    for (let c = 0; c < UMB_COLS; c++) {
      if (!on(r, c)) continue
      let colour: string
      if (r < 9) {
        const ramp =
          RAINBOW_RAMPS[
            Math.min(RAINBOW_RAMPS.length - 1, Math.floor(c / stripe))
          ]!
        const dx = (c - (UMB_COLS - 1) / 2) / (UMB_COLS / 2)
        let shade = dx < -0.4 ? 3 : dx > 0.5 ? 1 : 2
        if (r >= 7) shade = Math.max(1, shade - 1)
        if (!on(r - 1, c)) shade = dx < 0.3 ? 4 : 3
        else if (r === 8 || !on(r + 1, c)) shade = Math.min(shade, 1)
        colour = ramp[shade]!
      } else {
        colour = !on(r - 1, c)
          ? RAMPS.cream[4]
          : c === 10
            ? RAMPS.cream[3]
            : c === 11
              ? RAMPS.cream[1]
              : RAMPS.cream[2]
      }
      k.fillStyle = colour
      k.fillRect(x0 + c * UMB_CELL, y0 + r * UMB_CELL, UMB_CELL, UMB_CELL)
    }
  }
}

class GloomInvaders implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  /** Weather (the depth pass) or Classic Sky (today's rules). */
  mode: GloomMode = 'weather'
  save: GloomCalendarSave | null = null
  /** The mode select, open until the player picks (only on a real cabinet). */
  menu: { cursor: number } | null = null
  front: Front = weatherFront(1)
  form: FormationState = newFormation(CLASSIC_FRONT.formation, 52)
  private formationSize = 1
  /** The last march interval in ticks: the heartbeat's tempo follows it. */
  stepEvery = 20

  private tick = 0
  px = W / 2
  beam: Beam | null = null
  private fireCooldown = 0
  /** Ticks A has been held with no beam in the sky (the Sun Lance's charge). */
  charge = 0
  private beamsShone = 0
  clouds: Cloud[] = []
  private dir: 1 | -1 = 1
  private stepTimer = 0
  private frame = 0
  private lastBeat = 0
  drops: Drop[] = []
  private dropTimer = 0
  strikes: ActiveStrike[] = []
  private diveTimer = 0
  private nextPair = 0
  private pairs = new Map<number, number>()
  /** The garden's eleven plots (Weather only), kept across fronts. */
  plots: Plot[] = newGarden()
  private wateredThisFront = new Set<number>()
  helperBeams: Beam[] = []
  private bees: Bee[] = []
  private umbrellas: Umbrella[] = []
  private kite: Kite | null = null
  private kiteTimer = 0
  private happies: Happy[] = []
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private dead = 0
  private waveClear = 0
  /** Waves cleared this game: each one grows a flower in the garden. */
  private cleared = 0
  private nextExtra = FIRST_EXTRA
  private banner: { text: string; sub?: string; ticks: number } | null = null
  private stars: Array<{ x: number; y: number; phase: number }> = []
  /** The attract pilot's Sun Lance: ticks left to hold A. */
  private pilotCharge = 0
  // Cosmetic sparkles roll their own dice, so the game's seeded rng is untouched.
  private sparkles = new Sparkles()
  private sparkRng = backdropRng(41)
  private umbrellaArt = new WeakMap<
    Umbrella,
    { left: number; canvas: HTMLCanvasElement | null }
  >()

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    for (let i = 0; i < 40; i++) {
      this.stars.push({
        x: this.rng() * W,
        y: 20 + this.rng() * (UMBRELLA_Y - 40),
        phase: this.rng() * Math.PI * 2,
      })
    }
    const stored = this.demo ? null : readGloomCalendarSave(options.resume)
    if (stored) {
      this.mode = 'calendar'
      this.score = stored.run.score
      this.lives = stored.run.lives
      this.nextExtra =
        this.score < FIRST_EXTRA
          ? FIRST_EXTRA
          : (Math.floor(this.score / EXTRA_EVERY) + 1) * EXTRA_EVERY
      this.startWave(stored.run.wave)
    } else {
      this.startWave(1)
    }
    if (options.selectScreen && !this.demo) {
      this.menu = { cursor: stored ? 2 : 0 }
    }
  }

  get weather(): boolean {
    return this.mode !== 'classic'
  }

  /** The heartbeat, quickening with the march (Weather only; Classic Sky keeps its blips). */
  get music(): MusicLoop | null {
    if (!this.weather || this.menu || this.over) return null
    return HEARTBEAT_LOOPS[heartbeatTier(this.stepEvery)] ?? null
  }

  // --- the mode select ------------------------------------------------------------

  private updateMenu(input: InputFrame) {
    const m = this.menu!
    const n = GLOOM_MODES.length
    if (input.pressed.down || input.pressed.right) m.cursor = (m.cursor + 1) % n
    else if (input.pressed.up || input.pressed.left)
      m.cursor = (m.cursor + n - 1) % n
    else if (input.pressed.a || input.pressed.start)
      this.chooseMode(GLOOM_MODES[m.cursor]!)
  }

  /** Select a sky; a calendar checkpoint reopens from its season start. */
  chooseMode(mode: GloomMode) {
    const checkpoint = mode === 'calendar' ? this.save?.run : null
    this.menu = null
    this.mode = mode
    this.plots = newGarden()
    this.score = checkpoint?.score ?? 0
    this.lives = checkpoint?.lives ?? START_LIVES
    this.over = false
    this.nextExtra =
      this.score < FIRST_EXTRA
        ? FIRST_EXTRA
        : (Math.floor(this.score / EXTRA_EVERY) + 1) * EXTRA_EVERY
    this.startWave(checkpoint?.wave ?? 1)
    this.sound.play('start')
  }

  // --- setup -------------------------------------------------------------------

  private startWave(wave: number) {
    this.level = wave
    this.wateredThisFront.clear()
    this.front =
      this.mode === 'calendar'
        ? calendarFront(wave)
        : this.weather
          ? weatherFront(wave)
          : CLASSIC_FRONT
    if (this.mode === 'calendar' && (wave === 1 || wave === 10)) {
      this.plots = newGarden()
      if (!this.demo) {
        this.save = {
          v: 1,
          run: { wave, score: this.score, lives: Math.max(1, this.lives) },
        }
      }
    }
    const spec = this.front.formation
    this.clouds = formationSlots(spec).map((slot) => {
      const kind = CLOUD_KINDS[slot.kind]
      return {
        kind: slot.kind,
        col: slot.col,
        row: slot.row,
        alive: true,
        hp: kind.hp,
        x: 0,
        y: 0,
        w: kind.w,
        h: kind.h,
        hx: 0,
        hy: 0,
        flash: 0,
        tell: 0,
        tellKind: null,
        dive: null,
        half: 0,
        pair: -1,
      }
    })
    this.formationSize = this.clouds.length
    this.pairs.clear()
    this.umbrellas = Array.from({ length: UMBRELLAS }, (_, i) => ({
      x: Math.round((W * (i + 0.5)) / UMBRELLAS - (UMB_COLS * UMB_CELL) / 2),
      cells: umbrellaShape(),
    }))
    this.regroup()
    this.kite = null
    this.kiteTimer = Math.round(levelCurve(wave, GLOOM_CURVES.kiteEvery))
    this.banner = this.weather
      ? { text: this.front.name, sub: this.front.sub, ticks: 110 }
      : { text: `WAVE ${wave}`, sub: 'SHINE ON THE GLOOM', ticks: 90 }
  }

  /** Put the formation back at the wave's starting height. */
  private regroup() {
    this.form = newFormation(
      this.front.formation,
      Math.round(levelCurve(this.level, GLOOM_CURVES.startY)),
    )
    this.dir = this.form.dir
    this.stepTimer = 18
    this.drops = []
    this.strikes = []
    this.helperBeams = []
    this.dropTimer = 60
    this.diveTimer = Math.round(levelCurve(this.level, GLOOM_CURVES.diveEvery))
    this.beam = null
    this.charge = 0
    for (const cloud of this.clouds) {
      cloud.dive = null
      cloud.tell = 0
      cloud.tellKind = null
    }
    this.layout()
  }

  /** Every cloud to its formation slot (a swooping diver keeps its own path). */
  private layout() {
    const spec = this.front.formation
    for (const cloud of this.clouds) {
      if (!cloud.alive) continue
      const home = slotHome(spec, this.form, cloud.row, cloud.col)
      if (cloud.half) {
        const [ox, oy] = cloud.half < 0 ? HALF_OFFSETS.left : HALF_OFFSETS.right
        home.x += ox
        home.y += oy
      }
      cloud.hx = home.x
      cloud.hy = home.y
      if (cloud.dive?.phase !== 'swoop') {
        cloud.x = home.x
        cloud.y = home.y
      }
    }
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.menu) {
      this.updateMenu(input)
      return
    }
    if (this.over) return
    const controls = this.demo ? this.demoInput() : input

    if (this.dead > 0) {
      if (--this.dead === 0) {
        if (this.lives <= 0) {
          this.over = true
          this.banner = { text: 'GAME OVER', ticks: 9999 }
        } else {
          this.px = W / 2
          this.drops = []
          this.strikes = []
          for (const cloud of this.clouds) cloud.dive = null
          this.layout()
        }
      }
      return
    }
    if (this.waveClear > 0) {
      this.movePlayer(controls)
      if (--this.waveClear === 0) this.startWave(this.level + 1)
      return
    }

    this.movePlayer(controls)
    this.fire(controls)
    this.updateBeams()
    this.march()
    if (this.dead > 0) return
    if (this.weather) {
      this.updateClouds()
      if (this.dead > 0) return
    }
    this.updateDrops()
    if (this.weather) {
      this.updateStrikes()
      this.updateGarden()
    }
    this.updateKite()
    if (this.clouds.every((c) => !c.alive)) this.clearWave()
  }

  private movePlayer(input: InputFrame) {
    if (input.held.left) this.px -= PLAYER_SPEED
    if (input.held.right) this.px += PLAYER_SPEED
    this.px = Math.max(PLAYER_HALF + 4, Math.min(W - PLAYER_HALF - 4, this.px))
  }

  private fire(input: InputFrame) {
    const pressed = input.pressed.a || input.pressed.up
    const held = input.held.a || input.held.up
    if (!this.weather) {
      // Classic Sky: tap or hold to shine, one beam at a time.
      if (this.fireCooldown > 0) this.fireCooldown--
      if (this.beam) return
      if (!pressed && !(held && this.fireCooldown === 0)) return
      this.shine(false)
      this.fireCooldown = AUTOFIRE_COOLDOWN
      return
    }
    // Weather: a tap shines; holding with no beam in the sky charges the Sun Lance, which
    // fires on release. Still one beam at a time, so a charge is a choice.
    if (pressed) {
      this.charge = 0
      if (!this.beam) this.shine(false)
      return
    }
    if (held) {
      if (!this.beam) this.charge = Math.min(LANCE_CHARGE + 30, this.charge + 1)
      if (this.charge === LANCE_CHARGE) this.sound.play('blip')
      return
    }
    if (this.charge >= LANCE_CHARGE && !this.beam) this.shine(true)
    this.charge = 0
  }

  private shine(lance: boolean) {
    this.beam = {
      x: this.px,
      y: PLAYER_Y - 10,
      half: lance ? LANCE_HALF : 0,
      pierce: lance,
      helper: false,
      hit: lance ? new Set() : undefined,
    }
    this.beamsShone++
    if (lance) {
      this.sparkles.burst(this.px, PLAYER_Y - 10, this.sparkRng, {
        count: 12,
        colours: [RAMPS.gold[4], RAMPS.gold[3], '#ffffff'],
      })
      if (this.sound.playNotes)
        this.sound.playNotes([
          { freq: 440, to: 1760, dur: 0.22, type: 'square', vol: 0.06 },
          { freq: 880, to: 2200, dur: 0.18, type: 'triangle', vol: 0.05 },
        ])
      else this.sound.play('shoot')
    } else this.sound.play('shoot')
  }

  private updateBeams() {
    if (this.beam && !this.advanceBeam(this.beam)) this.beam = null
    this.helperBeams = this.helperBeams.filter((b) => this.advanceBeam(b))
  }

  /** Move a beam up one tick; false once it is spent. */
  private advanceBeam(beam: Beam): boolean {
    // Check every couple of pixels so a fast beam never skips a cloud edge.
    for (let i = 0; i < BEAM_SPEED; i += 2) {
      beam.y -= 2
      if (beam.y < 20) return false
      // Sunny's plain beam nibbles the umbrellas; the lance and the garden's
      // light shine through them.
      if (!beam.pierce && !beam.helper) {
        const hit = this.umbrellaCell(beam.x, beam.y)
        if (hit) {
          this.erode(hit[0], hit[1], 1.6)
          return false
        }
      }
      if (!beam.helper && this.kite && Math.abs(beam.x - this.kite.x) < 10) {
        if (Math.abs(beam.y - KITE_Y) < 7) {
          this.hitKite()
          if (!beam.pierce) return false
        }
      }
      for (const cloud of [...this.clouds]) {
        if (!cloud.alive) continue
        if (beam.x + beam.half < cloud.x) continue
        if (beam.x - beam.half > cloud.x + cloud.w) continue
        if (beam.y < cloud.y || beam.y > cloud.y + cloud.h) continue
        if (beam.pierce) {
          if (beam.hit?.has(cloud)) continue
          beam.hit?.add(cloud)
          this.cheer(cloud)
          continue
        }
        this.damage(cloud)
        return false
      }
      for (const [j, drop] of this.drops.entries()) {
        if (
          Math.abs(drop.x - beam.x) < 3 + beam.half &&
          Math.abs(drop.y - beam.y) < 5
        ) {
          // A sunbeam evaporates a gloom drop on the way up.
          this.drops.splice(j, 1)
          this.burst(beam.x, beam.y, 4, '#fde68a')
          this.sparkles.burst(beam.x, beam.y, this.sparkRng, {
            count: 3,
            speed: 1,
          })
          if (!beam.pierce) return false
          break
        }
      }
    }
    return true
  }

  /** One beam's worth: a thunderhead shrugs off the first two. */
  private damage(cloud: Cloud) {
    cloud.hp--
    if (cloud.hp > 0) {
      cloud.flash = 12
      this.burst(cloud.x + cloud.w / 2, cloud.y + cloud.h / 2, 4, '#fde68a')
      this.sound.play('blip')
      return
    }
    this.cheer(cloud)
  }

  /** A cloud turns happy: points, a smiling cloud, and rain for the plot below. */
  private cheer(cloud: Cloud) {
    cloud.alive = false
    cloud.hp = 0
    cloud.tell = 0
    const cx = cloud.x + cloud.w / 2
    const swooping = cloud.dive?.phase === 'swoop'
    cloud.dive = null
    const points =
      CLOUD_KINDS[cloud.kind].points * (swooping ? DIVE_MULTIPLIER : 1)
    this.addScore(points, cx, cloud.y)
    this.happies.push({ x: cloud.x, y: cloud.y, life: 60 })
    this.burst(cx, cloud.y + cloud.h / 2, 6, '#fde68a')
    this.sparkles.burst(cx, cloud.y + cloud.h / 2, this.sparkRng, {
      count: 7,
      colours: [RAMPS.gold[4], RAMPS.gold[3], RAMPS.pink[3]],
    })
    this.sound.play('pop')
    if (!this.weather) return
    if (swooping) this.floatText('DOUBLE!', cx, cloud.y - 8)
    this.strikes = this.strikes.filter((s) => s.source !== cloud || s.tell <= 0)
    this.water(cx)
    if (cloud.kind === 'splitter') this.split(cloud)
    if (cloud.kind === 'half') {
      const both = (this.pairs.get(cloud.pair) ?? 0) + 1
      this.pairs.set(cloud.pair, both)
      if (both === 2) {
        this.addScore(SPLIT_PAIR_BONUS, cx, cloud.y - 10)
        this.floatText('PAIR!', cx, cloud.y - 18)
      }
    }
  }

  /** A splitter puff pops into two little puffs that keep its slot. */
  private split(cloud: Cloud) {
    const pair = this.nextPair++
    for (const half of [-1, 1] as const) {
      const spec = CLOUD_KINDS.half
      this.clouds.push({
        ...cloud,
        kind: 'half',
        alive: true,
        hp: spec.hp,
        w: spec.w,
        h: spec.h,
        flash: 0,
        tell: 0,
        tellKind: null,
        dive: null,
        half,
        pair,
      })
    }
    this.layout()
  }

  /** The rain of a cheered cloud waters the plot under `x`. */
  private water(x: number) {
    const result = waterPlot(this.plots, x, this.front.season)
    if (this.mode === 'calendar') this.wateredThisFront.add(result.plot)
    const cx = plotCenter(result.plot)
    if (result.bloomed) {
      this.floatText(HELPER_NAMES[result.bloomed], cx, GROUND_Y - 28)
      this.sparkles.burst(cx, GROUND_Y - 8, this.sparkRng, {
        count: 12,
        colours: RAINBOW,
      })
      this.sound.play('pickup')
    }
    if (result.berry && !this.demo) {
      this.lives++
      this.banner = { text: 'EXTRA SUNNY!', sub: 'STRAWBERRIES', ticks: 90 }
      this.sound.play('extra')
    }
  }

  private hitKite() {
    const kite = this.kite!
    const value = KITE_VALUES[this.beamsShone % KITE_VALUES.length]!
    this.addScore(value, kite.x, KITE_Y + 10)
    for (let i = 0; i < RAINBOW.length; i++) {
      this.burst(kite.x, KITE_Y, 2, RAINBOW[i]!)
    }
    this.sparkles.burst(kite.x, KITE_Y, this.sparkRng, {
      count: 16,
      colours: RAINBOW,
      speed: 2.2,
    })
    this.kite = null
    this.sound.play('pickup')
  }

  private aliveClouds(): Cloud[] {
    return this.clouds.filter((c) => c.alive)
  }

  private march() {
    if (--this.stepTimer > 0) return
    const alive = this.aliveClouds()
    if (!alive.length) return
    const total = this.formationSize
    const pace = levelCurve(this.level, GLOOM_CURVES.march)
    const hurry = alive.length <= 1
    const count = Math.min(alive.length, total)
    this.stepTimer = hurry
      ? 1
      : Math.max(1, Math.round(1 + (pace * (count - 1)) / (total - 1)))
    this.stepEvery = this.stepTimer
    marchStep(
      this.front.formation,
      this.form,
      alive,
      hurry ? HURRY_STEP_X : STEP_X,
    )
    this.dir = this.form.dir
    this.layout()
    this.frame ^= 1
    if (!this.weather && this.tick - this.lastBeat >= 10) {
      this.lastBeat = this.tick
      this.sound.play('blip')
    }
    // Clouds low enough to touch the umbrellas soak them away.
    const marching = alive.filter((c) => c.dive?.phase !== 'swoop')
    if (!marching.length) return
    const bottom = Math.max(...marching.map((c) => c.y + c.h))
    if (bottom >= UMBRELLA_Y) {
      for (const cloud of marching) this.soak(cloud.x, cloud.y)
    }
    if (bottom >= PLAYER_Y - 6) this.invaded()
  }

  private invaded() {
    this.lives--
    this.dead = DEATH_TICKS
    this.burst(this.px, PLAYER_Y, 16, '#94a3b8')
    this.banner = { text: 'THE GLOOM LANDED', sub: 'REGROUPING', ticks: 100 }
    this.sound.play('die')
    this.regroup()
  }

  // --- the weather's clouds: tells and dives ------------------------------------

  private updateClouds() {
    for (const cloud of this.clouds) {
      if (!cloud.alive) continue
      if (cloud.flash > 0) cloud.flash--
      if (cloud.tell > 0 && --cloud.tell === 0 && cloud.tellKind) {
        this.drops.push(
          newDrop(
            cloud.tellKind,
            cloud.x + cloud.w / 2,
            cloud.y + cloud.h,
            this.dropSpeed(),
          ),
        )
        cloud.tellKind = null
      }
    }
    this.updateDives()
  }

  private updateDives() {
    const diving = this.clouds.find((c) => c.alive && c.dive)
    if (!diving && --this.diveTimer <= 0) {
      this.diveTimer = Math.round(
        levelCurve(this.level, GLOOM_CURVES.diveEvery),
      )
      const ready = this.clouds.filter(
        (c) => c.alive && c.kind === 'diver' && c.tell === 0,
      )
      if (ready.length) {
        const diver = ready[Math.floor(this.rng() * ready.length)]!
        diver.dive = { phase: 'tell', t: DIVE_TELL, targetX: 0 }
      }
    }
    if (!diving?.dive) return
    const dive = diving.dive
    if (dive.phase === 'tell') {
      if (--dive.t > 0) return
      dive.phase = 'swoop'
      dive.t = 0
      dive.targetX = this.px
      this.sound.play('warn')
    }
    dive.t++
    const p = swoopPoint(diving, dive)
    diving.x = p.x
    diving.y = p.y
    const cx = diving.x + diving.w / 2
    const cy = diving.y + diving.h / 2
    if (
      Math.abs(cx - this.px) < diving.w / 2 + PLAYER_HALF - 2 &&
      Math.abs(cy - PLAYER_Y) < diving.h / 2 + 5
    ) {
      diving.dive = null
      this.layout()
      this.playerHit()
      return
    }
    if (dive.t >= SWOOP_TICKS) {
      diving.dive = null
      diving.x = diving.hx
      diving.y = diving.hy
    }
  }

  // --- drops ----------------------------------------------------------------------

  private dropSpeed(): number {
    const cap = levelCurve(this.level, GLOOM_CURVES.dropSpeed)
    return cap * (0.75 + this.rng() * 0.25)
  }

  private updateDrops() {
    for (const drop of this.drops) stepDrop(drop, this.px)
    this.drops = this.drops.filter((drop) => this.dropAlive(drop))
    if (this.dead > 0) return
    if (--this.dropTimer > 0) return
    this.dropTimer = Math.round(levelCurve(this.level, GLOOM_CURVES.dropEvery))
    const maxDrops = Math.round(levelCurve(this.level, GLOOM_CURVES.maxDrops))
    if (this.weather) this.weatherDrop(maxDrops)
    else this.classicDrop(maxDrops)
  }

  /** Where a drop meets the ground, an umbrella, a vine or Sunny; false once it is gone. */
  private dropAlive(drop: Drop): boolean {
    if (drop.x < -4 || drop.x > W + 4 || drop.y < -10) return false
    if (drop.y > GROUND_Y) {
      if (drop.kind === 'hail' && !drop.bounced) {
        drop.y = GROUND_Y
        bounceHail(drop)
        this.landed(drop.x)
        this.burst(drop.x, GROUND_Y, 3, '#cfe9ff')
        return true
      }
      this.burst(drop.x, GROUND_Y, 2, '#7c3aed')
      this.landed(drop.x)
      return false
    }
    const hit = this.umbrellaCell(drop.x, drop.y + 3)
    if (hit) {
      if (drop.kind === 'hail' && !drop.bounced) {
        this.erode(hit[0], hit[1], 1.2)
        bounceHail(drop)
        drop.y -= 3
        return true
      }
      this.erode(hit[0], hit[1], 1.8)
      return false
    }
    if (this.weather && this.vineCatch(drop.x, drop.y + 3)) return false
    if (
      Math.abs(drop.x - this.px) < PLAYER_HALF &&
      drop.y + 3 > PLAYER_Y - 6 &&
      drop.y < PLAYER_Y + 6
    ) {
      this.playerHit()
      return false
    }
    return true
  }

  /** A gloom drop reached the garden: the plot it fell on wilts a little. */
  private landed(x: number) {
    if (!this.weather) return
    const { plot, wilted } = wiltPlot(this.plots, x)
    if (wilted) {
      this.floatText('WILTED', plotCenter(plot), GROUND_Y - 22)
      this.burst(plotCenter(plot), GROUND_Y - 4, 6, RAMPS.earth[3])
    }
  }

  /** Today's rule: a third of the drops come from the column over Sunny. */
  private classicDrop(maxDrops: number) {
    if (this.drops.length >= maxDrops) return
    const alive = this.aliveClouds()
    if (!alive.length) return
    let col: number
    if (this.rng() < 0.34) {
      col = alive.reduce((best, c) => {
        const d = Math.abs(c.x + CLOUD_W / 2 - this.px)
        const bd = Math.abs(best.x + CLOUD_W / 2 - this.px)
        return d < bd ? c : best
      }).col
    } else {
      col = alive[Math.floor(this.rng() * alive.length)]!.col
    }
    const lowest = alive
      .filter((c) => c.col === col)
      .reduce((a, b) => (b.row > a.row ? b : a))
    this.drops.push(
      newDrop(
        'straight',
        lowest.x + CLOUD_W / 2,
        lowest.y + CLOUD_H,
        this.dropSpeed(),
      ),
    )
  }

  /** Weather: a cloud is picked as Classic Sky picks a column; what falls depends on the cloud. */
  private weatherDrop(maxDrops: number) {
    const pending = this.clouds.filter((c) => c.alive && c.tell > 0).length
    if (this.drops.length + pending >= maxDrops) return
    const shooters = this.clouds.filter(
      (c) =>
        c.alive &&
        !c.dive &&
        c.tell === 0 &&
        c.x >= 0 &&
        c.x + c.w <= W &&
        c.y + c.h < PLAYER_Y - 40,
    )
    if (!shooters.length) return
    let shooter: Cloud
    if (this.rng() < 0.34) {
      const gap = (c: Cloud) => Math.abs(c.x + c.w / 2 - this.px)
      const near = Math.min(...shooters.map(gap))
      shooter = shooters
        .filter((c) => gap(c) <= near + 4)
        .reduce((a, b) => (b.y > a.y ? b : a))
    } else {
      shooter = shooters[Math.floor(this.rng() * shooters.length)]!
    }
    const x = shooter.x + shooter.w / 2
    switch (shooter.kind) {
      case 'drizzler':
        shooter.tell = DRIZZLE_TELL
        shooter.tellKind = 'drizzle'
        return
      case 'hailer':
        shooter.tell = HAIL_TELL
        shooter.tellKind = 'hail'
        return
      case 'thunderhead':
        if (!this.strikes.length) {
          this.strikes.push({
            x: Math.round(x),
            tell: STRIKE_TELL,
            flash: 0,
            source: shooter,
            stopY: GROUND_Y,
          })
          this.sound.play('warn')
          return
        }
        break
    }
    this.drops.push(
      newDrop(
        rainKind(this.front.rain, this.rng()),
        x,
        shooter.y + shooter.h,
        this.dropSpeed(),
      ),
    )
  }

  /** Lightning: the column glows, then the bolt falls to the first thing in its way. */
  private updateStrikes() {
    for (const strike of this.strikes) {
      if (strike.tell > 0) {
        if (--strike.tell === 0) this.strike(strike)
      } else strike.flash--
    }
    this.strikes = this.strikes.filter((s) => s.tell > 0 || s.flash > 0)
  }

  private strike(s: ActiveStrike) {
    s.flash = STRIKE_FLASH
    this.sound.play('boom')
    // The highest umbrella cell under the bolt takes it.
    for (let y = UMBRELLA_Y; y < UMBRELLA_Y + UMB_ROWS * UMB_CELL; y++) {
      for (let dx = -STRIKE_HALF; dx <= STRIKE_HALF; dx += 2) {
        const hit = this.umbrellaCell(s.x + dx, y)
        if (!hit) continue
        this.erode(hit[0], hit[1], 2.2)
        s.stopY = y
        return
      }
    }
    for (let dx = -STRIKE_HALF; dx <= STRIKE_HALF; dx += 2) {
      if (this.vineCatch(s.x + dx, VINE_Y + 1)) {
        s.stopY = VINE_Y
        return
      }
    }
    s.stopY = GROUND_Y
    this.landed(s.x)
    if (Math.abs(s.x - this.px) < STRIKE_HALF + PLAYER_HALF) this.playerHit()
  }

  private playerHit() {
    this.lives--
    this.dead = DEATH_TICKS
    this.beam = null
    this.charge = 0
    this.burst(this.px, PLAYER_Y, 18, '#facc15')
    this.burst(this.px, PLAYER_Y, 10, '#7c3aed')
    this.sound.play('die')
    if (this.lives > 0) {
      this.banner = { text: 'SUNNY GOT SOAKED', ticks: 90 }
    }
  }

  // --- the garden -----------------------------------------------------------------

  private updateGarden() {
    this.plots.forEach((plot, i) => {
      if (!plot.helper) return
      const cx = plotCenter(i)
      switch (plot.helper) {
        case 'sunflower':
          if (--plot.timer > 0) return
          plot.timer = HELPER_TICKS.sunflower
          this.helperBeams.push({
            x: cx,
            y: GROUND_Y - 14,
            half: 1,
            pierce: false,
            helper: true,
          })
          this.sparkles.burst(cx, GROUND_Y - 12, this.sparkRng, {
            count: 5,
            colours: [RAMPS.gold[4], RAMPS.gold[3]],
          })
          return
        case 'beehive': {
          if (plot.timer > 0) {
            plot.timer--
            return
          }
          const near = this.drops.filter(
            (d) => d.y > UMBRELLA_Y - 70 && Math.abs(d.x - cx) < 72,
          )
          if (!near.length) return
          const drop = near.reduce((a, b) => (b.y > a.y ? b : a))
          this.drops.splice(this.drops.indexOf(drop), 1)
          this.bees.push({
            x: cx,
            y: GROUND_Y - 8,
            tx: drop.x,
            ty: drop.y,
            t: 0,
          })
          this.burst(drop.x, drop.y, 3, RAMPS.gold[3])
          plot.timer = HELPER_TICKS.beehive
          return
        }
        case 'pumpkin': {
          if (--plot.timer > 0) return
          const target = this.clouds.some(
            (c) =>
              c.alive && Math.abs(c.x + c.w / 2 - cx) <= PUMPKIN_HALF + c.w / 2,
          )
          if (!target) {
            plot.timer = 10
            return
          }
          this.helperBeams.push({
            x: cx,
            y: GROUND_Y - 8,
            half: PUMPKIN_HALF,
            pierce: true,
            helper: true,
            pumpkin: true,
            hit: new Set(),
          })
          spendPumpkin(plot)
          this.floatText('PUMPKIN UP!', cx, GROUND_Y - 30)
          this.sound.play('boom')
          return
        }
        case 'beanVine':
          if (--plot.timer > 0) return
          plot.timer = HELPER_TICKS.vineRegrow
          {
            const gap = plot.vine.indexOf(false)
            if (gap >= 0) plot.vine[gap] = true
          }
          return
        default:
      }
    })
  }

  /** A bean vine's canopy catches a drop at (x, y): true if a leaf took it. */
  private vineCatch(x: number, y: number): boolean {
    if (y < VINE_Y || y >= VINE_Y + 4) return false
    const i = plotIndex(x)
    const plot = this.plots[i]!
    if (plot.helper !== 'beanVine') return false
    const left = plotCenter(i) - VINE_CELLS
    const c = Math.floor((x - left) / 2)
    if (c < 0 || c >= VINE_CELLS) return false
    const r = Math.floor((y - VINE_Y) / 2)
    const index = r * VINE_CELLS + c
    if (!plot.vine[index]) return false
    plot.vine[index] = false
    this.burst(x, y, 3, RAMPS.leaf[3])
    return true
  }

  private updateKite() {
    if (this.kite) {
      this.kite.x += this.kite.dir * 1.2
      if (this.kite.x < -16 || this.kite.x > W + 16) this.kite = null
      return
    }
    if (--this.kiteTimer > 0) return
    this.kiteTimer = Math.round(levelCurve(this.level, GLOOM_CURVES.kiteEvery))
    // Like the classic saucer, the kite stays away once the wave is nearly done.
    if (this.aliveClouds().length < 8) return
    const dir = this.rng() < 0.5 ? 1 : -1
    this.kite = { x: dir === 1 ? -14 : W + 14, dir }
    this.sound.play('warn')
  }

  private clearWave() {
    this.cleared++
    this.waveClear = WAVE_CLEAR_TICKS
    this.drops = []
    this.strikes = []
    this.helperBeams = []
    this.beam = null
    this.charge = 0
    this.kite = null
    this.addScore(100 * this.level, W / 2, 150)
    if (this.mode === 'calendar' && this.level === 2) {
      if (this.wateredThisFront.size >= 5) {
        this.addScore(500, W / 2, 162)
        this.floatText('FIRST SHOOTS!', W / 2, 144)
      }
    }
    if (!this.weather && this.cleared <= 11) {
      // The new flower pops up in the garden.
      this.sparkles.burst(
        92 + (this.cleared - 1) * 12,
        GROUND_Y - 6,
        this.sparkRng,
        { count: 12, colours: RAINBOW },
      )
    }
    this.banner = {
      text: 'SKY CLEARED!',
      sub: 'THE GARDEN GETS RAIN',
      ticks: WAVE_CLEAR_TICKS,
    }
    this.sound.play('level')
  }

  // --- umbrellas ----------------------------------------------------------------

  private umbrellaCell(x: number, y: number): [Umbrella, number] | null {
    if (this.mode === 'calendar' && this.level === 11) return null
    if (y < UMBRELLA_Y || y >= UMBRELLA_Y + UMB_ROWS * UMB_CELL) return null
    const r = Math.floor((y - UMBRELLA_Y) / UMB_CELL)
    for (const u of this.umbrellas) {
      const c = Math.floor((x - u.x) / UMB_CELL)
      if (c < 0 || c >= UMB_COLS) continue
      const index = r * UMB_COLS + c
      if (u.cells[index]) return [u, index]
    }
    return null
  }

  /** Knock a ragged hole in an umbrella around one cell. */
  private erode(u: Umbrella, index: number, radius: number) {
    const r0 = Math.floor(index / UMB_COLS)
    const c0 = index % UMB_COLS
    const reach = Math.ceil(radius)
    for (let dr = -reach; dr <= reach; dr++) {
      for (let dc = -reach; dc <= reach; dc++) {
        const r = r0 + dr
        const c = c0 + dc
        if (r < 0 || r >= UMB_ROWS || c < 0 || c >= UMB_COLS) continue
        if (dr * dr + dc * dc > radius * radius + this.rng() * 1.5) continue
        u.cells[r * UMB_COLS + c] = false
      }
    }
    this.burst(u.x + c0 * UMB_CELL, UMBRELLA_Y + r0 * UMB_CELL, 2, '#f9a8d4')
  }

  /** A cloud low enough to touch an umbrella soaks those cells away. */
  private soak(x: number, y: number) {
    for (const u of this.umbrellas) {
      for (let r = 0; r < UMB_ROWS; r++) {
        const cy = UMBRELLA_Y + r * UMB_CELL
        if (cy < y || cy > y + CLOUD_H) continue
        for (let c = 0; c < UMB_COLS; c++) {
          const cx = u.x + c * UMB_CELL
          if (cx >= x && cx <= x + CLOUD_W) u.cells[r * UMB_COLS + c] = false
        }
      }
    }
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x: number, y: number) {
    if (this.demo) return
    this.score += points
    this.floaters.push({ x, y, text: String(points), life: 40 })
    if (this.score >= this.nextExtra) {
      this.lives++
      this.nextExtra =
        this.nextExtra === FIRST_EXTRA
          ? EXTRA_EVERY
          : this.nextExtra + EXTRA_EVERY
      this.banner = { text: 'EXTRA SUNNY!', ticks: 90 }
      this.sparkles.burst(this.px, PLAYER_Y - 6, this.sparkRng, { count: 14 })
      this.sound.play('extra')
    }
  }

  private floatText(text: string, x: number, y: number) {
    this.floaters.push({ x, y, text, life: 50 })
  }

  private burst(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.4 + this.rng() * 1.6
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 18 + Math.floor(this.rng() * 14),
        color,
      })
    }
  }

  private updateEffects() {
    this.sparkles.update()
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      p.life--
    }
    this.particles = this.particles.filter((p) => p.life > 0)
    for (const f of this.floaters) {
      f.y -= 0.4
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
    for (const h of this.happies) {
      h.y -= 0.5
      h.life--
    }
    this.happies = this.happies.filter((h) => h.life > 0)
    for (const b of this.bees) b.t++
    this.bees = this.bees.filter((b) => b.t < 40)
  }

  // --- attract-mode pilot -----------------------------------------------------

  demoInput(): InputFrame {
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
    const step = (goLeft: boolean) => {
      this.pilotCharge = 0
      if (goLeft) held.left = true
      else held.right = true
      return frame
    }
    // Dodge a gloom drop that is about to land on Sunny.
    const threat = this.drops.find(
      (d) =>
        Math.abs(d.x - this.px) < PLAYER_HALF + 6 &&
        d.y > PLAYER_Y - 110 &&
        d.y < PLAYER_Y,
    )
    if (threat) {
      const goLeft = threat.x >= this.px ? this.px > 30 : this.px > W - 30
      return step(goLeft)
    }
    // Step out of a lit column and out of a diver's swoop.
    const bolt = this.strikes.find(
      (s) => Math.abs(s.x - this.px) < STRIKE_HALF + PLAYER_HALF + 6,
    )
    if (bolt) return step(bolt.x >= this.px ? this.px > 30 : this.px > W - 30)
    const gust = this.clouds.find(
      (c) =>
        c.alive &&
        c.dive?.phase === 'swoop' &&
        c.y > PLAYER_Y - 90 &&
        Math.abs(c.x + c.w / 2 - this.px) < 26,
    )
    if (gust) {
      const gx = gust.x + gust.w / 2
      return step(gx >= this.px ? this.px > 30 : this.px > W - 30)
    }
    // Holding a Sun Lance: keep holding, then let go.
    if (this.pilotCharge > 0) {
      if (--this.pilotCharge > 0) held.a = true
      return frame
    }
    // Otherwise line up under the lowest cloud and shine.
    const alive = this.aliveClouds().filter((c) => c.x >= 0 && c.x + c.w <= W)
    if (!alive.length) return frame
    const target = alive.reduce((a, b) =>
      b.y > a.y || (b.y === a.y && this.rng() < 0.1) ? b : a,
    )
    const lead =
      this.front.formation.kind === 'grid' ? this.dir * STEP_X * 2 : 0
    const tx = target.x + target.w / 2 + lead
    if (tx < this.px - 3) held.left = true
    else if (tx > this.px + 3) held.right = true
    else if (!this.weather) held.a = true
    else if (!this.beam) {
      const stack = alive.filter(
        (c) => Math.abs(c.x + c.w / 2 - this.px) < 10,
      ).length
      if (stack >= 3 && this.rng() < 0.25) {
        this.pilotCharge = LANCE_CHARGE + 3
        held.a = true
      } else {
        held.a = true
        frame.pressed.a = true
      }
    }
    return frame
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    const sky = SKIES[Math.min(this.cleared, SKY_STAGES)]!
    this.renderSky(g, sky)
    this.renderGarden(g)
    if (this.weather) this.renderPlots(g)
    this.renderUmbrellas(g)
    for (const strike of this.strikes) this.renderStrikeTell(g, strike)
    for (const cloud of this.clouds) {
      if (cloud.alive) this.renderCloud(g, cloud)
    }
    for (const h of this.happies) this.renderHappy(g, h)
    if (this.kite) this.renderKite(g, this.kite)
    for (const d of this.drops) this.renderDrop(g, d)
    for (const strike of this.strikes) this.renderBolt(g, strike)
    for (const b of this.helperBeams) {
      if (b.pumpkin) this.renderPumpkinLaunch(g, b)
      else this.renderBeam(g, b.x, b.y, 0, true)
    }
    if (this.beam) this.renderBeam(g, this.beam.x, this.beam.y, this.beam.half)
    if (this.dead === 0 && !this.over) this.renderSunny(g, this.px, PLAYER_Y)
    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, Math.min(1, p.life / 30))
      g.fillStyle = INK
      g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 3, 3)
      g.fillStyle = p.color
      g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 2, 2)
    }
    g.globalAlpha = 1
    this.sparkles.render(g)
    for (const f of this.floaters) {
      drawText(g, f.text, f.x, f.y, {
        align: 'center',
        color: RAMPS.gold[3],
        outline: INK,
      })
    }
    vignette(g, W, H, 0.28)
    this.renderHud(g)
    if (this.menu) this.renderMenu(g, this.menu)
  }

  private renderSky(g: CanvasRenderingContext2D, sky: (typeof SKIES)[number]) {
    // The banded sky, the horizon glow and (once a wave is cleared) the rising sun: one layer
    // per sky stage, painted once.
    const stage = Math.min(this.cleared, SKY_STAGES)
    cachedLayer(g, `gloom-invaders-sky-${stage}`, W, H, (k) => {
      bandedGradient(k, 0, 0, W, GROUND_Y, sky.bands, 6)
      glow(k, W / 2, GROUND_Y - 30, 170, RAMPS.pink[2], 0.12 + 0.18 * sky.t)
      if (stage > 0) {
        const sunY = GROUND_Y - 44 - sky.t * 96
        glow(k, W / 2 + 40, sunY, 60, RAMPS.gold[3], 0.5)
        shadedOrb(k, W / 2 + 40, sunY, 16, RAMPS.gold, { outline: null })
      }
    })
    // Stars fade as the sky brightens; the bright ones flare into crosses.
    const fade = 1 - sky.t * 0.85
    this.stars.forEach((s, i) => {
      const twinkle = Math.sin(this.tick / 25 + s.phase)
      g.globalAlpha = fade * (twinkle > -0.3 ? 1 : 0.5)
      g.fillStyle =
        twinkle > 0.6
          ? RAMPS.purple[4]
          : twinkle > -0.2
            ? RAMPS.purple[3]
            : RAMPS.purple[2]
      const x = Math.round(s.x)
      const y = Math.round(s.y)
      g.fillRect(x, y, 1, 1)
      if (i % 6 === 0 && twinkle > 0.75) {
        g.fillRect(x - 1, y, 3, 1)
        g.fillRect(x, y - 1, 1, 3)
      }
    })
    g.globalAlpha = 1
    // Haze clouds drift over the far hills; the hills themselves scroll at two speeds.
    g.save()
    g.globalAlpha = 0.3 + 0.4 * sky.t
    for (const c of HAZE_CLOUDS) {
      const x =
        ((((c.x + this.tick * c.speed) % (W + 60)) + W + 60) % (W + 60)) - 30
      drawCloud(g, x, c.y, c.size, sky.haze)
    }
    g.restore()
    drawRidge(g, FAR_HILLS, {
      base: GROUND_Y - 34,
      bottom: GROUND_Y,
      width: W,
      offset: this.tick * 0.06,
      fill: sky.far,
      rim: sky.farRim,
    })
    drawRidge(g, NEAR_HILLS, {
      base: GROUND_Y - 4,
      bottom: GROUND_Y,
      width: W,
      offset: this.tick * 0.15,
      fill: sky.near,
      rim: sky.nearRim,
    })
  }

  private renderGarden(g: CanvasRenderingContext2D) {
    cachedLayer(g, 'gloom-invaders-ground', W, H, (k) => {
      bandedGradient(
        k,
        0,
        GROUND_Y,
        W,
        H - GROUND_Y,
        [RAMPS.earth[2], RAMPS.earth[1], RAMPS.earth[0]],
        3,
      )
      k.fillStyle = INK
      k.fillRect(0, GROUND_Y - 1, W, 1)
      k.fillStyle = RAMPS.leaf[1]
      k.fillRect(0, GROUND_Y, W, 4)
      k.fillStyle = RAMPS.leaf[2]
      k.fillRect(0, GROUND_Y, W, 2)
      k.fillStyle = RAMPS.leaf[3]
      k.fillRect(0, GROUND_Y, W, 1)
      const rand = backdropRng(53)
      for (let x = 0; x < W; x += 3) {
        const tall = rand()
        k.fillStyle = RAMPS.leaf[2]
        if (tall > 0.45) k.fillRect(x, GROUND_Y - 2, 1, 2)
        k.fillStyle = RAMPS.leaf[3]
        if (tall > 0.8) k.fillRect(x + 1, GROUND_Y - 3, 1, 3)
        k.fillStyle = RAMPS.leaf[0]
        k.fillRect(x + 1, GROUND_Y + 4, 1, 1)
        k.fillStyle = rand() < 0.5 ? RAMPS.earth[3] : RAMPS.earth[0]
        k.fillRect(
          x + Math.floor(rand() * 3),
          GROUND_Y + 7 + Math.floor(rand() * 9),
          1,
          1,
        )
      }
    })
    if (this.weather) return
    // One flower for every wave cleared, up to a full row, nodding in the breeze.
    const flowers = Math.min(this.cleared, 11)
    for (let i = 0; i < flowers; i++) {
      const x = 92 + i * 12
      const sway = Math.floor(this.tick / 32 + i * 0.7) % 2
      const sprite = FLOWER_SPRITES[i % FLOWER_SPRITES.length]![sway]!
      dropShadow(g, x, GROUND_Y + 1, 4, 1, 0.35)
      drawSprite(g, sprite, x - 4, GROUND_Y + 1 - sprite.height, {
        anchor: 'topleft',
      })
    }
  }

  /** The eleven plots: a sprout growing with each watering, then its helper. */
  private renderPlots(g: CanvasRenderingContext2D) {
    this.plots.forEach((plot, i) => {
      const cx = plotCenter(i)
      // The plot's water: a pip per watering, five to bloom.
      const pips = Math.max(BLOOM_AT, plot.water)
      const left = Math.round(cx - pips + 1)
      for (let p = 0; p < pips; p++) {
        g.fillStyle = INK
        g.fillRect(left + p * 2 - 1, GROUND_Y + 1, 2, 2)
        g.fillStyle = p < plot.water ? RAMPS.water[3] : RAMPS.earth[1]
        g.fillRect(left + p * 2 - 1, GROUND_Y + 1, 1, 1)
      }
      if (!plot.helper) {
        // Bare soil, a shoot, then a budding stem.
        g.fillStyle = RAMPS.earth[1]
        g.fillRect(cx - 3, GROUND_Y - 1, 6, 1)
        if (plot.water <= 0) return
        const tall = 1 + plot.water * 2
        g.fillStyle = RAMPS.leaf[2]
        g.fillRect(cx, GROUND_Y - tall, 1, tall)
        g.fillStyle = RAMPS.leaf[3]
        g.fillRect(cx - 2, GROUND_Y - tall + 1, 2, 1)
        g.fillRect(cx + 1, GROUND_Y - tall + 2, 2, 1)
        if (plot.water >= 3) {
          g.fillStyle = RAMPS.pink[3]
          g.fillRect(cx - 1, GROUND_Y - tall - 1, 3, 2)
        }
        return
      }
      if (plot.helper === 'beanVine') {
        this.renderVine(g, plot, cx)
        return
      }
      const sprite = HELPER_SPRITES[plot.helper]
      const sway =
        plot.helper === 'sunflower' ? Math.sin(this.tick / 30 + i) : 0
      dropShadow(g, cx, GROUND_Y + 1, 5, 1, 0.35)
      drawSprite(g, sprite, cx + Math.round(sway), GROUND_Y + 1, {
        anchor: 'feet',
      })
      if (plot.helper === 'sunflower' && plot.timer < 20)
        glow(g, cx, GROUND_Y - 10, 10, RAMPS.gold[3], 0.5)
      if (plot.helper === 'strawberry' && plot.berryPaid)
        glow(g, cx, GROUND_Y - 4, 8, RAMPS.pink[3], 0.25)
    })
    for (const bee of this.bees) {
      const p = bee.t < 20 ? bee.t / 20 : (40 - bee.t) / 20
      const x = bee.x + (bee.tx - bee.x) * p + Math.sin(bee.t / 2) * 2
      const y = bee.y + (bee.ty - bee.y) * p
      drawSprite(g, BEE, x, y)
    }
  }

  private renderVine(g: CanvasRenderingContext2D, plot: Plot, cx: number) {
    // The stalk winds up to a leafy canopy: a living umbrella that regrows.
    for (let y = VINE_Y + 4; y < GROUND_Y; y += 2) {
      const wind = Math.round(Math.sin(y / 5) * 2)
      g.fillStyle = RAMPS.leaf[1]
      g.fillRect(cx + wind - 1, y, 3, 2)
      g.fillStyle = RAMPS.leaf[2]
      g.fillRect(cx + wind, y, 1, 2)
      if (y % 8 === 0) {
        g.fillStyle = RAMPS.leaf[3]
        g.fillRect(cx + wind + (y % 16 ? 2 : -3), y, 2, 1)
      }
    }
    const left = cx - VINE_CELLS
    g.fillStyle = INK
    plot.vine.forEach((on, index) => {
      if (!on) return
      const c = index % VINE_CELLS
      const r = Math.floor(index / VINE_CELLS)
      g.fillRect(left + c * 2 - 1, VINE_Y + r * 2 - 1, 4, 4)
    })
    plot.vine.forEach((on, index) => {
      if (!on) return
      const c = index % VINE_CELLS
      const r = Math.floor(index / VINE_CELLS)
      g.fillStyle = r === 0 ? RAMPS.leaf[3] : RAMPS.leaf[2]
      if (r === 0 && c % 3 === 1) g.fillStyle = RAMPS.leaf[4]
      g.fillRect(left + c * 2, VINE_Y + r * 2, 2, 2)
    })
  }

  private renderUmbrellas(g: CanvasRenderingContext2D) {
    if (this.mode === 'calendar' && this.level === 11) return
    const w = UMB_COLS * UMB_CELL + 2
    const h = UMB_ROWS * UMB_CELL + 2
    for (const u of this.umbrellas) {
      // Cells only ever wear away, so the count of what's left names the bake.
      const left = u.cells.reduce((n, on) => n + (on ? 1 : 0), 0)
      let art = this.umbrellaArt.get(u)
      if (!art || art.left !== left) {
        art = {
          left,
          canvas: bakeCanvas(w, h, (k) => paintUmbrella(k, u.cells, 1, 1)),
        }
        this.umbrellaArt.set(u, art)
      }
      if (art.canvas) {
        g.save()
        g.imageSmoothingEnabled = false
        g.drawImage(art.canvas, u.x - 1, UMBRELLA_Y - 1)
        g.restore()
      } else {
        paintUmbrella(g, u.cells, u.x, UMBRELLA_Y)
      }
    }
  }

  private renderCloud(g: CanvasRenderingContext2D, cloud: Cloud) {
    const { x, y } = cloud
    const classic = CLASSIC_KIND[cloud.kind]
    if (classic !== undefined) {
      const sprite = GLOOM_SPRITES[classic]![this.frame]!
      drawSprite(g, sprite, x - 1, y - 1, { anchor: 'topleft' })
      // The storm cloud's lightning lights up the sky on alternate steps.
      if (classic === 0 && this.frame)
        glow(g, x + 9, y + 14, 8, RAMPS.gold[3], 0.55)
      return
    }
    let sprites = NEW_SPRITES[cloud.kind]!
    let dx = 0
    if (cloud.kind === 'drizzler' && cloud.tell > 0) sprites = DRIZZLER_DARK
    if (cloud.kind === 'diver' && cloud.dive) {
      sprites = DIVER_RED
      if (cloud.dive.phase === 'tell')
        dx = Math.floor(this.tick / 3) % 2 ? 1 : -1
    }
    drawSprite(g, sprites[this.frame]!, x - 1 + dx, y - 1, {
      anchor: 'topleft',
    })
    if (cloud.kind === 'drizzler' && cloud.tell > 0) {
      // The drizzle swells under the cloud before it falls.
      const grow = Math.ceil((1 - cloud.tell / DRIZZLE_TELL) * 4)
      g.fillStyle = INK
      g.fillRect(x + 8, y + cloud.h, 3, grow + 2)
      g.fillStyle = RAMPS.teal[3]
      g.fillRect(x + 9, y + cloud.h, 1, grow + 1)
    }
    if (cloud.kind === 'hailer' && cloud.tell > 0 && cloud.tell % 8 < 4)
      glow(g, x + 9, y + 10, 9, '#dff4ff', 0.7)
    if (cloud.kind === 'thunderhead') {
      // Each beam it has taken shows as a crack of light.
      const cracks = CLOUD_KINDS.thunderhead.hp - cloud.hp
      g.fillStyle = RAMPS.gold[4]
      for (let c = 0; c < cracks; c++) {
        g.fillRect(x + 4 + c * 6, y + 3, 1, 3)
        g.fillRect(x + 5 + c * 6, y + 5, 1, 3)
      }
      if (this.frame) glow(g, x + 9, y + 14, 8, RAMPS.gold[3], 0.55)
    }
    if (cloud.flash > 0 && cloud.flash % 4 < 2)
      glow(g, x + cloud.w / 2, y + cloud.h / 2, 12, '#ffffff', 0.7)
  }

  private renderHappy(g: CanvasRenderingContext2D, h: Happy) {
    const alpha = Math.min(1, h.life / 30)
    glow(g, h.x + 9, h.y + 6, 14, RAMPS.gold[3], 0.25 * alpha)
    drawSprite(g, HAPPY_SPRITE, h.x - 1, h.y - 1, { anchor: 'topleft', alpha })
    // Gentle rain for the garden.
    g.globalAlpha = alpha
    for (let i = 0; i < 3; i++) {
      const fall = (60 - h.life + i * 7) % 14
      const rx = Math.round(h.x) + 4 + i * 5
      const ry = Math.round(h.y) + 13 + fall
      g.fillStyle = RAMPS.water[2]
      g.fillRect(rx, ry, 1, 3)
      g.fillStyle = RAMPS.water[4]
      g.fillRect(rx, ry + 2, 1, 1)
    }
    g.globalAlpha = 1
  }

  private renderDrop(g: CanvasRenderingContext2D, d: Drop) {
    const x = Math.round(d.x)
    const y = Math.round(d.y)
    switch (d.kind) {
      case 'drizzle':
        g.fillStyle = rgba(RAMPS.teal[3], 0.5)
        g.fillRect(x, y - 7, 1, 5)
        drawSprite(g, DRIZZLE_DROP, x, y + 1)
        return
      case 'hail':
        if (!d.bounced) {
          g.fillStyle = rgba('#ffffff', 0.5)
          g.fillRect(x, y - 6, 1, 4)
        }
        drawSprite(g, HAIL_STONE, x, y + 1)
        return
      case 'sleet':
        drawSprite(g, SLEET_STREAK, x, y)
        return
      default:
        // High-contrast streak keeps falling shots distinct from the scenery.
        g.fillStyle = INK
        g.fillRect(x - 1, y - 9, 3, 9)
        g.fillStyle = '#fef08a'
        g.fillRect(x, y - 8, 1, 6)
        drawSprite(
          g,
          DROP_SPRITES[Math.floor(this.tick / 4) % 2]!,
          d.x - 3,
          d.y - 1,
          { anchor: 'topleft' },
        )
    }
  }

  /** A thunderhead's warning: its column glows on the ground. */
  private renderStrikeTell(g: CanvasRenderingContext2D, s: ActiveStrike) {
    if (s.tell <= 0) return
    const pulse = s.tell % 10 < 5
    const top = s.source.y + s.source.h
    g.fillStyle = rgba(RAMPS.gold[3], pulse ? 0.24 : 0.14)
    g.fillRect(s.x - STRIKE_HALF, top, STRIKE_HALF * 2, GROUND_Y - top)
    // Dashed edges march down the column toward the ground.
    g.fillStyle = rgba(RAMPS.gold[4], 0.6)
    for (let y = top + (this.tick % 8); y < GROUND_Y; y += 8) {
      g.fillRect(s.x - STRIKE_HALF, y, 1, 4)
      g.fillRect(s.x + STRIKE_HALF - 1, y, 1, 4)
    }
    g.fillStyle = pulse ? RAMPS.gold[4] : RAMPS.gold[2]
    g.fillRect(s.x - STRIKE_HALF - 2, GROUND_Y - 2, STRIKE_HALF * 2 + 4, 3)
    glow(g, s.x, GROUND_Y, 14, RAMPS.gold[3], pulse ? 0.7 : 0.4)
  }

  private renderBolt(g: CanvasRenderingContext2D, s: ActiveStrike) {
    if (s.tell > 0 || s.flash <= 0) return
    const top = s.source.alive ? s.source.y + s.source.h : 30
    let px = s.x
    let py = top
    g.lineWidth = 3
    g.strokeStyle = RAMPS.gold[3]
    g.beginPath()
    g.moveTo(px, py)
    for (let i = 1; py < s.stopY; i++) {
      py = Math.min(s.stopY, top + i * 12)
      px = s.x + (i % 2 ? 3 : -3)
      g.lineTo(px, py)
    }
    g.stroke()
    g.lineWidth = 1
    g.strokeStyle = '#ffffff'
    g.stroke()
    glow(g, s.x, s.stopY, 20, RAMPS.gold[4], 0.8)
  }

  private renderPumpkinLaunch(g: CanvasRenderingContext2D, b: Beam) {
    glow(g, b.x, b.y + 4, 16, RAMPS.rust[3], 0.6)
    for (let i = 0; i < 4; i++) {
      g.fillStyle = rgba(RAMPS.gold[3], 0.5 - i * 0.1)
      g.fillRect(b.x - 2, b.y + 8 + i * 4, 4, 4)
    }
    drawSprite(g, PUMPKIN, b.x, b.y)
  }

  private renderKite(g: CanvasRenderingContext2D, kite: Kite) {
    const x = Math.round(kite.x)
    const y = KITE_Y
    glow(g, x, y, 22, RAMPS.pink[3], 0.35 + 0.1 * Math.sin(this.tick / 6))
    // The tail string waves behind, tied with bows.
    const tail = (j: number) => ({
      x: Math.round(x - kite.dir * j * 1.5),
      y: Math.round(y + 7 + j * 0.4 + Math.sin(this.tick / 5 + j / 2) * 2),
    })
    for (let j = 0; j <= 12; j++) {
      const p = tail(j)
      g.fillStyle = INK
      g.fillRect(p.x, p.y, 1, 2)
      g.fillStyle = RAMPS.cream[3]
      g.fillRect(p.x, p.y, 1, 1)
    }
    for (let j = 4; j <= 12; j += 4) {
      const p = tail(j)
      drawSprite(g, BOW_SPRITES[(j / 4) % 2]!, p.x, p.y)
    }
    drawSprite(g, KITE_SPRITE, x, y)
  }

  private renderBeam(
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    half = 0,
    helper = false,
  ) {
    if (half > 0) {
      // The Sun Lance: a wide shaft of light with a white-hot heart.
      glow(g, x, y + 8, 22, RAMPS.gold[3], 0.7)
      g.fillStyle = rgba(RAMPS.gold[2], 0.45)
      g.fillRect(x - half - 1, y - 2, half * 2 + 2, 40)
      g.fillStyle = RAMPS.gold[4]
      g.fillRect(x - half + 1, y, half * 2 - 2, 30)
      g.fillStyle = '#ffffff'
      g.fillRect(x - 1, y, 3, 34)
      return
    }
    glow(g, x, y + 4, helper ? 8 : 12, RAMPS.gold[3], helper ? 0.45 : 0.6)
    // A fading trail, then the bright core with a white-hot tip.
    for (let i = 0; i < 4; i++) {
      g.fillStyle = rgba(RAMPS.gold[3], 0.5 - i * 0.12)
      g.fillRect(x - 1, y + 9 + i * 3, 2, 3)
    }
    g.fillStyle = rgba(helper ? RAMPS.leaf[3] : RAMPS.gold[2], 0.6)
    g.fillRect(x - 2, y - 1, 4, 10)
    g.fillStyle = RAMPS.gold[4]
    g.fillRect(x - 1, y, 2, 8)
    g.fillStyle = '#ffffff'
    g.fillRect(x - 1, y, 2, 3)
  }

  private renderSunny(g: CanvasRenderingContext2D, x: number, y: number) {
    dropShadow(g, x, y + 10, 9, 2, 0.4)
    // Treads roll as Sunny drives.
    const tread = Math.floor(x / 3) % 2
    drawSprite(g, SUNNY_SPRITES[tread]!, x - 9, y - 4, { anchor: 'topleft' })
    // The sun dish on top, glowing, with its rays turning.
    glow(g, x, y - 7, 16, RAMPS.gold[3], 0.45 + 0.1 * Math.sin(this.tick / 8))
    shadedOrb(g, x, y - 7, 4, RAMPS.gold)
    for (let i = 0; i < 6; i++) {
      const a = this.tick / 20 + (i * Math.PI) / 3
      const rx = Math.round(x + Math.cos(a) * 8)
      const ry = Math.round(y - 7 + Math.sin(a) * 8)
      g.fillStyle = RAMPS.gold[3]
      g.fillRect(rx - 1, ry, 3, 1)
      g.fillRect(rx, ry - 1, 1, 3)
      g.fillStyle = '#ffffff'
      g.fillRect(rx, ry, 1, 1)
    }
    if (this.charge > 4) {
      // The Sun Lance charging: a ring of light closes round the dish.
      const full = this.charge >= LANCE_CHARGE
      const dots = full ? 16 : Math.floor((16 * this.charge) / LANCE_CHARGE)
      for (let i = 0; i < dots; i++) {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / 16
        g.fillStyle = full && this.tick % 6 < 3 ? '#ffffff' : RAMPS.gold[4]
        g.fillRect(
          Math.round(x + Math.cos(a) * 12),
          Math.round(y - 7 + Math.sin(a) * 12),
          2,
          2,
        )
      }
      if (full) glow(g, x, y - 7, 24, RAMPS.gold[4], 0.5)
    }
  }

  private renderHud(g: CanvasRenderingContext2D) {
    // Score and high score in boxes along the top, clear of the kite's lane.
    hudPanel(g, 4, 3, 80, 19)
    drawText(g, String(this.score).padStart(6, '0'), 9, 6, {
      scale: 2,
      color: RAMPS.gold[3],
      shadow: INK,
    })
    const hi = `HI ${Math.max(this.hiScore, this.score)}`
    const hiW = measureText(hi) + 12
    hudPanel(g, W - 4 - hiW, 3, hiW, 13)
    drawText(g, hi, W - 10, 6, {
      align: 'right',
      color: RAMPS.pink[3],
      outline: INK,
    })
    // Spare Sunnies wait in a box in the soil.
    const spares = Math.min(this.lives - 1, 5)
    if (spares > 0) {
      hudPanel(g, 4, GROUND_Y + 4, spares * 12 + 6, 12, RAMPS.teal)
      for (let i = 0; i < spares; i++) {
        drawSprite(g, LIFE_SPRITE, 8 + i * 12, GROUND_Y + 6, {
          anchor: 'topleft',
        })
      }
    }
    const wave = this.mode === 'calendar' ? this.front.name : `WAVE ${this.level}`
    const waveW = measureText(wave) + 12
    hudPanel(g, W - 4 - waveW, GROUND_Y + 4, waveW, 12, RAMPS.leaf)
    drawText(g, wave, W - 10, GROUND_Y + 7, {
      align: 'right',
      color: RAMPS.leaf[4],
      outline: INK,
    })
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, 170, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.purple[1],
      })
      if (this.banner.sub) {
        drawText(g, this.banner.sub, W / 2, 190, {
          align: 'center',
          color: RAMPS.gold[3],
          outline: INK,
        })
      }
    }
  }

  private renderMenu(g: CanvasRenderingContext2D, m: { cursor: number }) {
    g.save()
    g.fillStyle = rgba(INK, 0.8)
    g.fillRect(0, 0, W, H)
    g.restore()
    hudPanel(g, 14, 50, W - 28, 218)
    drawText(g, 'CHOOSE THE SKY', W / 2, 62, {
      scale: 2,
      align: 'center',
      color: RAMPS.gold[3],
      outline: INK,
    })
    GLOOM_MODES.forEach((mode, i) => {
      const y = 99 + i * 45
      const on = i === m.cursor
      drawText(g, `${on ? '> ' : ''}${MODE_NAMES[mode]}`, W / 2, y, {
        scale: 2,
        align: 'center',
        color: on ? '#ffffff' : RAMPS.steel[3],
        outline: INK,
      })
      drawText(g, MODE_BLURBS[mode], W / 2, y + 16, {
        align: 'center',
        color: RAMPS.teal[3],
        outline: INK,
      })
    })
    drawText(g, 'UP/DOWN  A: PLAY', W / 2, 250, {
      align: 'center',
      color: RAMPS.steel[3],
      outline: INK,
    })
  }
}

/** The classic three keep their original sprites. */
const CLASSIC_KIND: Partial<Record<CloudKind, number>> = {
  anvil: 0,
  puff: 1,
  grump: 2,
}

/** Where a diver gust is `dive.t` ticks into its swoop: out to Sunny's column and back. */
export function swoopPoint(
  home: { hx: number; hy: number; w: number; h: number },
  dive: { t: number; targetX: number },
): { x: number; y: number } {
  const p = Math.min(1, dive.t / SWOOP_TICKS)
  const depth = Math.sin(Math.PI * p)
  const wiggle = Math.sin(dive.t / 5) * 6 * depth
  return {
    x: Math.round(
      home.hx + (dive.targetX - home.w / 2 - home.hx) * depth + wiggle,
    ),
    y: Math.round(home.hy + (PLAYER_Y - 4 - home.h / 2 - home.hy) * depth),
  }
}

const gloomInvaders: ArcadeGameModule = {
  create: (options) => new GloomInvaders(options),
}

export const create = gloomInvaders.create
export default gloomInvaders
