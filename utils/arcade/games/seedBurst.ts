// /utils/arcade/games/seedBurst.ts
//
// Seed Burst -- the Kind Robots Arcade's Bomberman riff (conductor kr-arcade/t-009 game factory,
// batch 4; depth pass kr-arcade/t-136, CABINETS.md section 24 slice 1). Gardener bots plant seed
// pods in a hedge maze. A pod bursts after a moment into blooms that clear hedges and turn grumps
// into butterflies. Standing in a bloom (yours or a partner's) or bumping a grump costs the team a
// gardener.
//
// The Seed Pouch: every gardener carries seed varieties, swapped with B, each bursting in its own
// shape (utils/arcade/seedBurst/pouch.ts). Plots are authored data (seedBurst/plots.ts): a hedge
// mask, a compost heap and a grump script. Every tile a bloom crosses grows into a flowerbed, and
// the plot's In Bloom % pays out at the gate. One hedge hides the Garden Gate: blooming it rings
// the gate bell, which calls three more grumps out of the compost heap. Clear every grump, then
// step through the open gate. One hedge hides a golden seed. A bonked gardener drops a level of
// each power as pickups to win back. When the plot timer runs out the Grumble Cloud rolls in: it
// cannot be bloomed and drifts after the nearest gardener until the plot is done.
//
// Up to four gardeners share one screen, one score and one pool of spares.
// Arrows move, A plants (or bursts a Puffcap), B swaps seeds.

import { drawText, measureText } from '../font'
import {
  GOLDEN_SEED_SPRITE,
  BULLY_SPRITES,
  GRUMBLE_RAMP,
  HEAP_SPRITE,
  HOPPER_SPRITES,
  MOLE_SPRITE,
  MOUND_SPRITE,
  PUFFBALL_SPRITE,
  SACK_SPRITE,
  SLUG_SPRITES,
  SPORE_SPRITES,
  THIEF_SPRITE,
  VARIETY_RAMPS,
  VARIETY_SPRITES,
} from '../seedBurst/art'
import {
  BED_GROW,
  BLOOM_POINTS,
  FLOWER_PACE,
  bedStage,
  dropPower,
  dropSpots,
  inBloomPercent,
} from '../seedBurst/garden'
import {
  BARE_SLUG_PACE,
  BELL_GAP,
  BELL_MAX,
  BELL_RUMBLE,
  BULLY_CHARGE_PACE,
  BULLY_REST,
  BULLY_SIGHT,
  BULLY_SPARK,
  GRUMPS,
  HOP_AIR,
  HOP_CROUCH,
  HOP_REST,
  MOLE_DIG,
  MOLE_UNDER,
  MOLE_UP,
  MOLE_WOBBLE,
  SLIME_PACE,
  SLIME_TICKS,
  bloomable,
  chargeLane,
  hopLanding,
  moundSpot,
  stepToward,
  touches,
} from '../seedBurst/grumps'
import type { GrumpPhase } from '../seedBurst/grumps'
import { parseMask, planPlot } from '../seedBurst/plots'
import type { GrumpKind, PlotPlan } from '../seedBurst/plots'
import {
  VARIETY_INFO,
  brambleLine,
  burstTiles,
  nextSeed,
} from '../seedBurst/pouch'
import type { BurstTile, TileLook, Variety } from '../seedBurst/pouch'
import { sniffStep } from '../seedBurst/sniffer'
import {
  INK,
  RAMPS,
  Sparkles,
  backdropRng,
  bandedGradient,
  bevel,
  cachedLayer,
  drawCloud,
  dropShadow,
  drawSprite,
  glow,
  hudPanel,
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

const TILE = 16
const COLS = 15
const ROWS = 13
const HUD_H = 24
const W = COLS * TILE
const H = HUD_H + ROWS * TILE
const MAX_PLAYERS = 4
const START_SPARES = 2
const FUSE = 150
/** A Puffcap waits for its gardener's second press, but not for ever. */
const PUFF_FUSE = 480
/** Ticks a kicked pumpkin takes to roll one tile. */
const ROLL_TICKS = 6
const BLOOM_TICKS = 26
const SAFE_TICKS = 150
const RESPAWN_TICKS = 100
const CLEAR_TICKS = 150
const BASE_SPEED = 1
const SHOE_SPEED = 0.25
const MAX_SPEED = 2
const MAX_PODS = 6
const MAX_RANGE = 7
const TOUCH = 11
const START_STATS = { pods: 1, range: 2, speed: BASE_SPEED }
/** The Grumble Cloud: starting pace, how it quickens, its top pace and its reach. */
const CLOUD_SPEED = 0.3
const CLOUD_ACCEL = 0.0002
const CLOUD_MAX = 0.95
const CLOUD_TOUCH = 10

const GNAT_POINTS = 100
const HEDGE_POINTS = 10
const POWER_POINTS = 50
const ROUND_POINTS = 1000
const GOLDEN_POINTS = 500
const LOOT_POINTS = 500
const SHELL_POINTS = 50

const WALL = 1
const HEDGE = 2

type Dir = { dx: number; dy: number }
const DIRS: Dir[] = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
]
/** What a hedge can hide, and what lies about to be picked up. */
type Pickup = 'pod' | 'bloom' | 'shoe' | 'golden' | Variety
type Gardener = {
  seat: number
  tx: number
  ty: number
  nx: number
  ny: number
  p: number
  facing: Dir
  pods: number
  range: number
  speed: number
  safe: number
  /** >0 counting down to a respawn; -1 out of the game; 0 in play. */
  down: number
  /** The varieties this gardener has found, and the one in hand. */
  pouch: Variety[]
  seed: number
}
type Pod = {
  x: number
  y: number
  fuse: number
  owner: number
  range: number
  standing: Set<number>
  variety: Variety
  /** The way a Dandelion's fluff drifts (the gardener's facing at planting). */
  dir: Dir
  /** A kicked pumpkin's roll, and its progress to the next tile. */
  roll: Dir | null
  rollT: number
}
type Chain = { count: number }
type Bloom = { x: number; y: number; life: number; chain: Chain }
type Grump = {
  kind: GrumpKind
  tx: number
  ty: number
  /** The tile it is stepping to (a hopper's landing tile while it crouches and hops). */
  nx: number
  ny: number
  p: number
  dir: Dir
  /** Pixels per tick. */
  speed: number
  dead: boolean
  phase: GrumpPhase
  timer: number
  cooldown: number
  /** The bloom chain it shrugged off (a slug's shell, a puffball's spores). */
  immune: Chain | null
  shell: boolean
  /** A thief's loot: a pickup, or a planted pod it carried off. */
  loot: Pickup | 'planted' | null
  /** A hopper's take-off tile. */
  hopFrom: { x: number; y: number } | null
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

const SEAT_COLORS = ['#38bdf8', '#f472b6', '#a3e635', '#fbbf24']
const CORNERS = [
  { x: 1, y: 1 },
  { x: COLS - 2, y: ROWS - 2 },
  { x: COLS - 2, y: 1 },
  { x: 1, y: ROWS - 2 },
]

const key = (x: number, y: number) => y * COLS + x
const cornerDistance = (x: number, y: number) =>
  Math.min(...CORNERS.map((c) => Math.abs(c.x - x) + Math.abs(c.y - y)))

// --- 16-bit art (utils/arcade/snes.ts) -------------------------------------------

/** Cool grey garden stone for the pillars, lit from the upper left. */
const STONE: Ramp = ['#1e1a30', '#3c3852', '#6a6884', '#a4a2bc', '#e2e0f0']
/** The seed pod's husk: warm brown into a ripe gold. */
const SEED: Ramp = ['#3a1a0a', '#6b3a14', '#a8641e', '#e0a040', '#fff0c0']
const LIME: Ramp = ['#24400a', '#4d7c0f', '#84cc16', '#bef264', '#f7fee7']
/** Each seat's colour as a ramp, in the order of SEAT_COLORS. */
const SEAT_RAMPS: readonly Ramp[] = [RAMPS.sky, RAMPS.pink, LIME, RAMPS.gold]
const BLOOM_RAMPS: readonly Ramp[] = [
  RAMPS.pink,
  RAMPS.gold,
  RAMPS.purple,
  RAMPS.rust,
]

/** Six garden looks, taken in turn round by round: spring, deep summer, twilight, autumn, winter, blossom. */
export const GARDENS: readonly { grass: Ramp; flowers: readonly string[] }[] = [
  {
    grass: ['#173f22', '#24602e', '#3a8a3c', '#5aac4c', '#94d470'],
    flowers: [RAMPS.pink[3], '#ffffff', RAMPS.gold[3]],
  },
  {
    grass: ['#0f3a2e', '#18563c', '#26784a', '#3f9a58', '#7cc884'],
    flowers: [RAMPS.purple[3], RAMPS.sky[3], '#ffffff'],
  },
  {
    grass: ['#0c2436', '#12384a', '#1a5058', '#276c68', '#4f9a86'],
    flowers: [RAMPS.teal[4], RAMPS.pink[3], RAMPS.gold[4]],
  },
  {
    grass: ['#3a2a0c', '#5c4210', '#82601a', '#a98530', '#d2b05a'],
    flowers: [RAMPS.rust[3], RAMPS.gold[3], RAMPS.pink[3]],
  },
  {
    grass: ['#20324a', '#2f4a68', '#476a8a', '#6c92ae', '#a9cade'],
    flowers: ['#ffffff', RAMPS.sky[4], RAMPS.purple[4]],
  },
  {
    grass: ['#2a2038', '#40305a', '#5d4a7c', '#8a74a2', '#c4aedc'],
    flowers: [RAMPS.pink[4], '#ffffff', RAMPS.pink[2]],
  },
]

/**
 * A flower as palette rows, shaded per pixel toward the upper-left light: `petals` round petals
 * of ramp letters (S shadow, B base, L light, H highlight) around a gold eye (c, C).
 */
function flowerRows(r: number, petals: number): string[] {
  const rows: string[] = []
  for (let y = -r; y <= r; y++) {
    let row = ''
    for (let x = -r; x <= r; x++) {
      let ch = '.'
      if (Math.hypot(x, y) <= r * 0.34) ch = x + y < 0 ? 'C' : 'c'
      else {
        for (let i = 0; i < petals; i++) {
          const a = (i / petals) * Math.PI * 2 - Math.PI / 2
          const px = Math.cos(a) * r * 0.55
          const py = Math.sin(a) * r * 0.55
          const pr = r * 0.5
          const d = Math.hypot(x - px, y - py)
          if (d > pr) continue
          const lit = -(x - px + (y - py)) / pr / 1.4 + (1 - d / pr) * 0.3
          ch = lit > 0.5 ? 'H' : lit > 0.05 ? 'L' : lit > -0.45 ? 'B' : 'S'
        }
      }
      row += ch
    }
    rows.push(row)
  }
  return rows
}

function flowerSprite(r: number, ramp: Ramp, eye: Ramp = RAMPS.gold) {
  return pixelSprite(flowerRows(r, 5), {
    S: ramp[1],
    B: ramp[2],
    L: ramp[3],
    H: ramp[4],
    c: eye[2],
    C: eye[4],
  })
}

/** Full blooms and the buds they open from, one per bloom colour. */
const BLOOM_SPRITES = BLOOM_RAMPS.map((ramp) =>
  flowerSprite(6, ramp, ramp === RAMPS.gold ? RAMPS.rust : RAMPS.gold),
)
const BUD_SPRITES = BLOOM_RAMPS.map((ramp) =>
  flowerSprite(4, ramp, ramp === RAMPS.gold ? RAMPS.rust : RAMPS.gold),
)

const HEDGE_PALETTE = {
  H: RAMPS.leaf[4],
  L: RAMPS.leaf[3],
  l: RAMPS.leaf[2],
  d: RAMPS.leaf[1],
  D: RAMPS.leaf[0],
  e: RAMPS.earth[3],
  E: RAMPS.earth[2],
  q: RAMPS.earth[1],
  p: RAMPS.pink[3],
  w: '#ffffff',
  y: RAMPS.gold[3],
}
/**
 * A hedge's leafy top as palette rows: overlapping clumps, each shaded toward the upper-left
 * light with a little leaf-texture noise, the lower clumps in front. With `flowers`, a few lit
 * leaves carry blossoms (p pink, w white, y their gold eyes).
 */
function hedgeRows(flowers: boolean): string[] {
  const clumps: [number, number, number][] = [
    [7, 3.5, 3.8],
    [3.5, 5, 3.6],
    [10.5, 5, 3.6],
    [2.6, 8, 2.8],
    [11.4, 8, 2.8],
    [7, 7, 4.2],
  ]
  const rows: string[] = []
  for (let y = 0; y < 11; y++) {
    let row = ''
    for (let x = 0; x < 14; x++) {
      let ch = '.'
      for (const [cx, cy, r] of clumps) {
        const nx = (x + 0.5 - cx) / r
        const ny = (y + 0.5 - cy) / r
        const d = Math.hypot(nx, ny)
        if (d > 1) continue
        const noise = (((x * 37 + y * 61) ^ (x * y * 13)) % 7) / 7 - 0.45
        const lit = -(nx + ny) * 0.6 + (1 - d) * 0.2 + noise * 0.35 - 0.12
        ch =
          lit > 0.62
            ? 'H'
            : lit > 0.25
              ? 'L'
              : lit > -0.15
                ? 'l'
                : lit > -0.5
                  ? 'd'
                  : 'D'
        if (flowers && lit > 0 && (x * 5 + y * 3) % 11 === 0) ch = 'p'
        if (flowers && lit > 0 && (x * 7 + y * 2) % 13 === 0) ch = 'w'
      }
      row += ch
    }
    rows.push(row)
  }
  return rows
}
const PLANTER = [
  'eeeeeeeeeeeeee',
  'EEEEEEEEEEEEEq',
  'EqEEEEEqEEEEEq',
  'qqqqqqqqqqqqqq',
]
/** Hedge planters: plain, and one in flower (picked per cell so the maze is varied). */
const HEDGE_SPRITES = [
  pixelSprite([...hedgeRows(false), ...PLANTER], HEDGE_PALETTE),
  pixelSprite([...hedgeRows(true), ...PLANTER], HEDGE_PALETTE),
] as const

const SPROUT_SPRITE = pixelSprite(['LL.LL', 'lLdLl', '..d..'], {
  L: RAMPS.leaf[3],
  l: RAMPS.leaf[2],
  d: RAMPS.leaf[1],
})

type Face = 'down' | 'up' | 'side'

const HAT = ['....hHHS....', '...hHHHHSs..', '.hHHHHHHHSs.', 'zssssssssssz']
const HEADS: Record<Face, string[]> = {
  down: [
    ...HAT,
    '..WFFFFFFf..',
    '..FkFFFFkf..',
    '..FkFFFFkf..',
    '..cFFkkFFc..',
    '...fFFFFf...',
  ],
  up: [
    ...HAT,
    '..WFFFFFFf..',
    '..FFFFFFFf..',
    '..FFFFFFFf..',
    '..fFFFFFff..',
    '...ffffff...',
  ],
  side: [
    '...hHHS.....',
    '..hHHHHSs...',
    '.hHHHHHHHSss',
    '.zssssssssss',
    '..fWFFFFF...',
    '..fFFFFkF...',
    '..fFFFFkFF..',
    '..ffFFFFc...',
    '...ffFFf....',
  ],
}
const BODIES: Record<Face, string[]> = {
  down: ['.FSHSSSSSsF.', '.fsSSggSSsf.', '..sSSSSSSs..'],
  up: ['.FSSSSSSSsF.', '.fsHSSSSHsf.', '..sSSSSSSs..'],
  side: ['...FHSSSs...', '...fSSgSs...', '...sSSSs....'],
}
/** Legs per facing: standing, then two walk frames. */
const LEGS: Record<Face, [string, string][]> = {
  down: [
    ['..ss....ss..', '.eEe....eEe.'],
    ['.eEe....ss..', '........eEe.'],
    ['..ss....eEe.', '.eEe........'],
  ],
  up: [
    ['..ss....ss..', '.eEe....eEe.'],
    ['.eEe....ss..', '........eEe.'],
    ['..ss....eEe.', '.eEe........'],
  ],
  side: [
    ['....ss......', '...eEEe.....'],
    ['...s..ss....', '..eE...eEe..'],
    ['....ss......', '...eEEe.....'],
  ],
}

function gardenerPalette(ramp: Ramp): Record<string, string> {
  return {
    h: ramp[4],
    H: ramp[3],
    S: ramp[2],
    s: ramp[1],
    z: ramp[0],
    W: RAMPS.cream[4],
    F: RAMPS.cream[3],
    f: RAMPS.cream[2],
    k: INK,
    c: RAMPS.pink[3],
    g: RAMPS.gold[4],
    e: RAMPS.earth[1],
    E: RAMPS.earth[3],
  }
}

/** Every seat's gardener: per facing, [standing, step, step] (left is the side frames flipped). */
const GARDENER_SPRITES = SEAT_RAMPS.map((ramp) => {
  const palette = gardenerPalette(ramp)
  const faces = {} as Record<Face, PixelSprite[]>
  for (const face of ['down', 'up', 'side'] as const)
    faces[face] = LEGS[face].map((legs) =>
      pixelSprite([...HEADS[face], ...BODIES[face], ...legs], palette),
    )
  return faces
})

/** Little gardener heads: the team's spares, and each seat's badge. */
const HEAD_ROWS = [
  '..hHHS..',
  '.hHHHHS.',
  'zssssssz',
  '.WFFFFf.',
  '.FkFFkf.',
  '..fFFf..',
]
const SPARE_SPRITE = pixelSprite(HEAD_ROWS, gardenerPalette(RAMPS.teal))
const SEAT_HEADS = SEAT_RAMPS.map((ramp) =>
  pixelSprite(HEAD_ROWS, gardenerPalette(ramp)),
)

function gnatSprites(body: Ramp, wing: Ramp, eye: string) {
  const palette = {
    W: wing[4],
    w: wing[3],
    H: body[3],
    D: body[2],
    d: body[1],
    y: eye,
    k: INK,
  }
  return [
    pixelSprite(
      [
        'Ww......Ww',
        'wWw....wWw',
        '.wWwddwWw.',
        '..wdHDdw..',
        '..kkDDkk..',
        '..DyDDyD..',
        '..dDDDDd..',
        '...dkkd...',
        '....dd....',
      ],
      palette,
    ),
    pixelSprite(
      [
        '..........',
        '..........',
        '....dd....',
        '...dHDd...',
        'WwkkDDkkWw',
        'wWDyDDyDWw',
        '.wdDDDDdw.',
        '...dkkd...',
        '....dd....',
      ],
      palette,
    ),
  ] as const
}
const GNAT_SPRITES = gnatSprites(RAMPS.earth, RAMPS.steel, RAMPS.gold[3])
const GHOST_SPRITES = gnatSprites(RAMPS.purple, RAMPS.pink, RAMPS.teal[4])
const SNIFFER_SPRITES = gnatSprites(RAMPS.rust, RAMPS.cream, RAMPS.sky[4])

const POWER_SPRITES: Record<'pod' | 'bloom' | 'shoe', PixelSprite> = {
  pod: pixelSprite(
    [
      '...LL.LL',
      '...lLdLl',
      '.....d..',
      '..oOOOo.',
      '.oHOOOOo',
      '.oOOOOoq',
      '.qoOOoqq',
      '..qqqqq.',
    ],
    {
      L: RAMPS.leaf[3],
      l: RAMPS.leaf[2],
      d: RAMPS.leaf[1],
      H: SEED[4],
      O: SEED[3],
      o: SEED[2],
      q: SEED[1],
    },
  ),
  bloom: flowerSprite(4, RAMPS.pink),
  shoe: pixelSprite(
    [
      '......hHs..',
      'WW....HSs..',
      'WWw...HSs..',
      '.Www..HSSs.',
      '..wwwHSSSSs',
      '.....zzzzzz',
    ],
    {
      h: RAMPS.sky[4],
      H: RAMPS.sky[3],
      S: RAMPS.sky[2],
      s: RAMPS.sky[1],
      z: RAMPS.sky[0],
      W: '#ffffff',
      w: RAMPS.steel[3],
    },
  ),
}

/** Five-pixel icons for the seat badges: pods, bloom reach, shoe speed. */
const STAT_ICONS = [
  pixelSprite(['..L..', '.oHo.', 'oHOOo', 'oOOOq', '.qqq.'], {
    L: RAMPS.leaf[3],
    H: SEED[4],
    O: SEED[3],
    o: SEED[2],
    q: SEED[1],
  }),
  flowerSprite(2, RAMPS.pink),
  pixelSprite(['W.Hs.', 'WwHs.', '.HSSs', '.zzzz'], {
    H: RAMPS.sky[3],
    S: RAMPS.sky[2],
    s: RAMPS.sky[1],
    z: RAMPS.sky[0],
    W: '#ffffff',
    w: RAMPS.steel[3],
  }),
] as const

/** Butterflies (the gnats' happy ending), two wing frames per colour, keyed by particle colour. */
const BUTTERFLY_SPRITES = new Map<string, readonly PixelSprite[]>(
  (
    [
      ['#f9a8d4', RAMPS.pink],
      ['#fde047', RAMPS.gold],
      ['#c4b5fd', RAMPS.purple],
    ] as const
  ).map(([colour, ramp]) => {
    const palette = { L: ramp[4], B: ramp[3], S: ramp[2], k: INK }
    return [
      colour,
      [
        pixelSprite(['LB.BL', 'BSkSB', '.SkS.'], palette, { outline: ramp[0] }),
        pixelSprite(['.LkL.', '.BkB.'], palette, { outline: ramp[0] }),
      ] as const,
    ]
  }),
)
const LEAF_COLOUR = '#15803d'
const RAIN_COLOUR = '#7cd3f2'
const LEAF_SPRITE = pixelSprite(['.LH', 'Ll.', 'd..'], {
  H: RAMPS.leaf[4],
  L: RAMPS.leaf[3],
  l: RAMPS.leaf[2],
  d: RAMPS.leaf[1],
})

/** Slow cloud shadows drifting over the garden (cosmetic layout, never the game's rng). */
const CLOUD_SHADOWS = (() => {
  const rand = backdropRng(53)
  return Array.from({ length: 3 }, (_, i) => ({
    x: rand() * W,
    y: HUD_H + 30 + i * 62 + rand() * 20,
    rx: 34 + rand() * 18,
    ry: 14 + rand() * 6,
    speed: 0.08 + rand() * 0.06,
  }))
})()

/** A flowerbed's bud and full flower, one per bloom colour (the sprout is SPROUT_SPRITE). */
const BED_BUDS = BLOOM_RAMPS.map((ramp) =>
  pixelSprite(['.b.', 'bBb', '.g.'], {
    b: ramp[2],
    B: ramp[3],
    g: RAMPS.leaf[2],
  }),
)
const BED_FLOWERS = BLOOM_RAMPS.map((ramp) =>
  flowerSprite(3, ramp, ramp === RAMPS.gold ? RAMPS.rust : RAMPS.gold),
)

/** What a pickup looks like: the old three powers, the golden seed and each seed packet. */
function pickupSprite(power: Pickup): PixelSprite {
  if (power === 'pod' || power === 'bloom' || power === 'shoe')
    return POWER_SPRITES[power]
  if (power === 'golden') return GOLDEN_SEED_SPRITE
  return VARIETY_SPRITES[power]
}

class SeedBurst implements ArcadeGameInstance {
  score = 0
  level = 1
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private plotIndex = 0
  private plan: PlotPlan = planPlot(0)
  private grid: number[] = []
  /** The plot's stone layout, as drawn into the cached field. */
  private stone: boolean[] = []
  private heap = -1
  /** Tiles that can flower (every tile inside the wall that is not stone). */
  private area = 1
  private powers = new Map<number, Pickup>()
  private hidden = new Map<number, Pickup>()
  private gardeners: Gardener[] = []
  private spares = START_SPARES
  private pods: Pod[] = []
  private blooms: Bloom[] = []
  private grumps: Grump[] = []
  /** Flowerbeds by tile: ticks since they were first bloomed. */
  private beds = new Map<number, number>()
  /** Slug slime by tile: ticks left. */
  private slime = new Map<number, number>()
  private gate = { k: -1, open: false, rings: 0, chain: null as Chain | null }
  private bells: { kinds: GrumpKind[]; timer: number }[] = []
  private cloud: { x: number; y: number; speed: number } | null = null
  private golden = 0
  /** Which "the gate is open" / "find the gate" call has been made this plot. */
  private gateCall: 'none' | 'find' | 'open' = 'none'
  private timer = 0
  private clear = 0
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null
  // Cosmetic sparkles roll their own dice, so the game's seeded rng is untouched.
  private fx = new Sparkles()
  private fxRng = backdropRng(83)

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    const seats = this.demo
      ? 1
      : Math.max(1, Math.min(MAX_PLAYERS, Math.round(options.players ?? 1)))
    for (let seat = 0; seat < seats; seat++)
      this.gardeners.push({
        seat,
        tx: 0,
        ty: 0,
        nx: 0,
        ny: 0,
        p: 0,
        facing: DIRS[2]!,
        pods: START_STATS.pods,
        range: START_STATS.range,
        speed: START_STATS.speed,
        safe: SAFE_TICKS,
        down: 0,
        pouch: ['sunflower'],
        seed: 0,
      })
    this.buildPlot(0)
  }

  /** Gardeners in play or waiting to respawn, plus the team's spares. */
  get lives(): number {
    return this.gardeners.filter((g) => g.down >= 0).length + this.spares
  }

  /** Every grump turned and no bell still calling: the gate opens once it is found. */
  private get gateOpen(): boolean {
    return this.gate.open && !this.grumps.length && !this.bells.length
  }

  // --- the plot -------------------------------------------------------------------

  private buildPlot(index: number) {
    this.plotIndex = index
    this.level = index + 1
    this.plan = planPlot(index)
    const plot = this.plan.plot
    const mask = parseMask(plot.mask)
    this.stone = [...mask.stone]
    this.grid = mask.stone.map((s) => (s ? WALL : 0))
    this.heap = mask.heap
    this.powers.clear()
    this.hidden.clear()
    this.beds.clear()
    this.slime.clear()
    this.pods = []
    this.blooms = []
    this.bells = []
    this.cloud = null
    this.gateCall = 'none'
    // Corners stay clear so every gardener can step out and plant.
    const clearCells = new Set<number>([this.heap])
    for (const c of CORNERS)
      for (const [dx, dy] of [
        [0, 0],
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ])
        clearCells.add(key(c.x + dx!, c.y + dy!))
    // A hedge two steps out from each corner, so a first pod always clears one.
    for (const c of CORNERS)
      for (const [dx, dy] of [
        [2, 0],
        [-2, 0],
        [0, 2],
        [0, -2],
      ]) {
        const k = key(c.x + dx!, c.y + dy!)
        if (this.grid[k] === 0 && !clearCells.has(k)) this.grid[k] = HEDGE
      }
    for (let y = 1; y < ROWS - 1; y++)
      for (let x = 1; x < COLS - 1; x++) {
        const k = key(x, y)
        if (this.grid[k] || clearCells.has(k)) continue
        if (mask.hedge[k] || (mask.maybe[k] && this.rng() < plot.density))
          this.grid[k] = HEDGE
      }
    this.area = this.stone.filter((s) => !s).length
    this.hideTreasures()
    for (const g of this.gardeners) {
      if (g.down < 0) continue
      this.placeAtCorner(g)
      g.down = 0
    }
    // Grumps start well away from every corner, never on the compost heap.
    this.grumps = []
    const open: Array<{ x: number; y: number }> = []
    for (let y = 1; y < ROWS - 1; y++)
      for (let x = 1; x < COLS - 1; x++)
        if (
          this.grid[key(x, y)] === 0 &&
          key(x, y) !== this.heap &&
          cornerDistance(x, y) >= 6
        )
          open.push({ x, y })
    for (const kind of this.plan.roster) {
      if (!open.length) break
      const at = open.splice(Math.floor(this.rng() * open.length), 1)[0]!
      this.grumps.push(this.newGrump(kind, at.x, at.y))
    }
    this.timer = plot.time * 60
    this.banner = { text: plot.name, sub: plot.intro, ticks: 150 }
  }

  /** The Garden Gate, the golden seed, the plot's seed packets and the usual powers. */
  private hideTreasures() {
    const plot = this.plan.plot
    const pool: number[] = []
    for (let k = 0; k < this.grid.length; k++)
      if (this.grid[k] === HEDGE) pool.push(k)
    const take = (far: number): number => {
      const fits = pool.filter(
        (k) => cornerDistance(k % COLS, Math.floor(k / COLS)) >= far,
      )
      const from = fits.length ? fits : pool
      if (!from.length) return -1
      const k = from[Math.floor(this.rng() * from.length)]!
      pool.splice(pool.indexOf(k), 1)
      return k
    }
    this.gate = { k: take(6), open: false, rings: 0, chain: null }
    if (this.gate.k < 0) {
      // No hedge to hide it under: the gate stands in plain sight, away from the corners.
      const k = this.grid.findIndex(
        (cell, i) =>
          cell === 0 &&
          i !== this.heap &&
          cornerDistance(i % COLS, Math.floor(i / COLS)) >= 4,
      )
      this.gate.k = k >= 0 ? k : this.heap
      this.gate.open = true
    }
    const golden = take(4)
    if (golden >= 0) this.hidden.set(golden, 'golden')
    for (const variety of plot.offers) {
      const k = take(0)
      if (k >= 0) this.hidden.set(k, variety)
    }
    for (const k of pool)
      if (this.rng() < plot.powers)
        this.hidden.set(
          k,
          (['pod', 'bloom', 'shoe'] as const)[Math.floor(this.rng() * 3)]!,
        )
  }

  private newGrump(kind: GrumpKind, x: number, y: number): Grump {
    return {
      kind,
      tx: x,
      ty: y,
      nx: x,
      ny: y,
      p: 0,
      dir: DIRS[Math.floor(this.rng() * 4)]!,
      speed: this.plan.speed * GRUMPS[kind].pace,
      dead: false,
      phase: 'walk',
      timer: kind === 'mole' ? MOLE_UP : 0,
      cooldown: kind === 'hopper' || kind === 'bully' ? 90 : 0,
      immune: null,
      shell: kind === 'slug',
      loot: null,
      hopFrom: null,
    }
  }

  private placeAtCorner(g: Gardener) {
    const c = CORNERS[g.seat]!
    g.tx = g.nx = c.x
    g.ty = g.ny = c.y
    g.p = 0
    g.safe = SAFE_TICKS
  }

  private solid(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return true
    return this.grid[key(x, y)] !== 0
  }

  private podAt(x: number, y: number): Pod | undefined {
    return this.pods.find((p) => p.x === x && p.y === y)
  }

  private canWalk(g: Gardener, x: number, y: number): boolean {
    if (this.solid(x, y)) return false
    const pod = this.podAt(x, y)
    return !pod || pod.standing.has(g.seat)
  }

  private gardenerOn(x: number, y: number): boolean {
    return this.gardeners.some((g) => {
      if (g.down !== 0) return false
      const t = this.here(g)
      return t.x === x && t.y === y
    })
  }

  private activeTiles(): { x: number; y: number }[] {
    return this.gardeners
      .filter((g) => g.down === 0)
      .map((g) => ({ x: g.tx, y: g.ty }))
  }

  /** The tile a walker is mostly standing on. */
  private here(w: {
    tx: number
    ty: number
    nx: number
    ny: number
    p: number
  }) {
    return w.p < 0.5 ? { x: w.tx, y: w.ty } : { x: w.nx, y: w.ny }
  }

  private pixel(w: {
    tx: number
    ty: number
    nx: number
    ny: number
    p: number
  }) {
    return {
      x: (w.tx + (w.nx - w.tx) * w.p) * TILE + TILE / 2,
      y: HUD_H + (w.ty + (w.ny - w.ty) * w.p) * TILE + TILE / 2,
    }
  }

  private look = (x: number, y: number): TileLook => {
    const border = x <= 0 || y <= 0 || x >= COLS - 1 || y >= ROWS - 1
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS)
      return { kind: 'stone', border: true, pod: false }
    const cell = this.grid[key(x, y)]
    return {
      kind: cell === WALL ? 'stone' : cell === HEDGE ? 'hedge' : 'open',
      border,
      pod: !!this.podAt(x, y),
    }
  }

  /** The tiles a pod would bloom over right now. */
  private podTiles(pod: Pod): BurstTile[] {
    return burstTiles(pod.variety, pod.x, pod.y, pod.dir, pod.range, this.look)
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame, players?: InputFrame[]) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    if (this.clear > 0) {
      if (--this.clear === 0) this.buildPlot(this.plotIndex + 1)
      return
    }
    const frames = this.demo ? [this.demoInput()] : (players ?? [input])
    for (const g of this.gardeners) {
      if (g.down > 0) {
        if (--g.down === 0) this.placeAtCorner(g)
        continue
      }
      if (g.down < 0) continue
      if (g.safe > 0) g.safe--
      const controls = frames[g.seat] ?? frames[0]!
      if (controls.pressed.b) this.swapSeed(g)
      this.walk(g, controls)
      if (controls.pressed.a) this.plant(g)
    }
    this.updatePods()
    this.updateBlooms()
    this.updateGrumps()
    this.updateBells()
    this.updateGarden()
    this.updateCloud()
    this.touchGrumps()
    if (this.timer > 0 && --this.timer === 0) this.grumbleCloud()
    this.updateGate()
    if (this.clear === 0 && this.gardeners.every((g) => g.down < 0)) {
      this.over = true
      this.banner = { text: 'GARDEN CLOSED', sub: 'GAME OVER', ticks: 9999 }
    }
  }

  private walk(g: Gardener, input: InputFrame) {
    if (g.p === 0) {
      const wanted = DIRS.filter(
        (d) =>
          (d.dy < 0 && input.held.up) ||
          (d.dy > 0 && input.held.down) ||
          (d.dx < 0 && input.held.left) ||
          (d.dx > 0 && input.held.right),
      )
      // With two directions held, take the one that is open.
      const dir = wanted.find((d) => this.canWalk(g, g.tx + d.dx, g.ty + d.dy))
      if (wanted.length) g.facing = dir ?? wanted[0]!
      if (!dir) {
        // Walking into a pumpkin sets it rolling.
        for (const d of wanted) {
          const pod = this.podAt(g.tx + d.dx, g.ty + d.dy)
          if (pod?.variety === 'pumpkin' && !pod.roll) {
            pod.roll = d
            pod.rollT = 0
            this.sound.play('blip')
          }
        }
        return
      }
      g.nx = g.tx + dir.dx
      g.ny = g.ty + dir.dy
    }
    const slimed = this.slime.has(key(g.tx, g.ty)) ? SLIME_PACE : 1
    g.p += (g.speed * slimed) / TILE
    if (g.p >= 1) {
      // Leaving a pod's tile makes it solid for this gardener.
      for (const pod of this.pods)
        if (pod.x === g.tx && pod.y === g.ty) pod.standing.delete(g.seat)
      g.tx = g.nx
      g.ty = g.ny
      g.p = 0
      this.pickUp(g)
    }
  }

  private swapSeed(g: Gardener) {
    if (g.pouch.length < 2) return
    g.seed = nextSeed(g.pouch, g.seed)
    const px = this.pixel(g)
    this.floaters.push({
      x: px.x,
      y: px.y - 20,
      text: VARIETY_INFO[g.pouch[g.seed]!].name,
      life: 45,
    })
    this.sound.play('blip')
  }

  private plant(g: Gardener) {
    const at = this.here(g)
    const variety = g.pouch[g.seed] ?? 'sunflower'
    if (variety === 'puffcap') {
      const live = this.pods.find(
        (p) => p.owner === g.seat && p.variety === 'puffcap',
      )
      if (live) {
        this.burst(live)
        return
      }
    }
    const mine = this.pods.filter((p) => p.owner === g.seat).length
    if (mine >= g.pods || this.podAt(at.x, at.y)) return
    const tiles =
      variety === 'bramble'
        ? brambleLine(
            at.x,
            at.y,
            g.facing,
            g.pods - mine,
            (x, y) =>
              !this.solid(x, y) && !this.podAt(x, y) && !this.gardenerOn(x, y),
          )
        : [at]
    tiles.forEach((t, i) => {
      const standing = new Set<number>()
      if (i === 0)
        for (const other of this.gardeners) {
          if (other.down !== 0) continue
          const o = this.here(other)
          if (o.x === t.x && o.y === t.y) standing.add(other.seat)
          // Mid-step off this tile counts as standing on it too.
          if (other.tx === t.x && other.ty === t.y) standing.add(other.seat)
        }
      this.pods.push({
        x: t.x,
        y: t.y,
        fuse: variety === 'puffcap' ? PUFF_FUSE : FUSE,
        owner: g.seat,
        range: g.range,
        standing,
        variety,
        dir: g.facing,
        roll: null,
        rollT: 0,
      })
    })
    this.sound.play('blip')
  }

  private pickUp(g: Gardener) {
    const k = key(g.tx, g.ty)
    const power = this.powers.get(k)
    if (!power) return
    this.powers.delete(k)
    const px = this.pixel(g)
    let text: string
    if (power === 'pod') {
      g.pods = Math.min(MAX_PODS, g.pods + 1)
      text = '+POD'
    } else if (power === 'bloom') {
      g.range = Math.min(MAX_RANGE, g.range + 1)
      text = '+BLOOM'
    } else if (power === 'shoe') {
      g.speed = Math.min(MAX_SPEED, g.speed + SHOE_SPEED)
      text = '+SPEED'
    } else if (power === 'golden') {
      this.golden++
      text = `GOLDEN SEED ${this.golden}`
      this.addScore(GOLDEN_POINTS, px.x, px.y - 4)
    } else {
      const info = VARIETY_INFO[power]
      text = info.name
      if (!g.pouch.includes(power)) {
        g.pouch.push(power)
        g.seed = g.pouch.length - 1
        this.banner = {
          text: `${info.name}!`,
          sub: `${info.hint} - B SWAPS SEEDS`,
          ticks: 120,
        }
      } else g.seed = g.pouch.indexOf(power)
    }
    this.addScore(POWER_POINTS, px.x, px.y - 12)
    this.floaters.push({ x: px.x, y: px.y - 20, text, life: 50 })
    this.fx.burst(px.x, px.y, this.fxRng, { count: 10 })
    this.sound.play('extra')
  }

  private updatePods() {
    for (const pod of [...this.pods]) {
      if (pod.roll && ++pod.rollT >= ROLL_TICKS) {
        pod.rollT = 0
        const x = pod.x + pod.roll.dx
        const y = pod.y + pod.roll.dy
        const blocked =
          this.solid(x, y) ||
          !!this.podAt(x, y) ||
          this.gardenerOn(x, y) ||
          this.grumps.some((gr) => {
            if (gr.dead || !bloomable(gr.kind, gr.phase)) return false
            const t = this.here(gr)
            return t.x === x && t.y === y
          })
        if (blocked) pod.roll = null
        else {
          pod.x = x
          pod.y = y
          pod.standing.clear()
        }
      }
      if (--pod.fuse <= 0) this.burst(pod)
    }
  }

  /** A pod bursts in its variety's shape, setting off any pod it reaches. */
  private burst(pod: Pod) {
    const i = this.pods.indexOf(pod)
    if (i < 0) return
    this.pods.splice(i, 1)
    const chain: Chain = { count: 0 }
    const triggered: Pod[] = []
    for (const t of this.podTiles(pod)) {
      if (t.hit === 'hedge') this.clearHedge(t.x, t.y, chain)
      this.addBloom(t.x, t.y, chain, t.hit !== 'over')
      if (t.hit === 'pod') {
        const other = this.podAt(t.x, t.y)
        if (other) triggered.push(other)
      }
    }
    this.sound.play('boom')
    for (const other of triggered) this.burst(other)
  }

  private clearHedge(x: number, y: number, chain: Chain) {
    const k = key(x, y)
    this.grid[k] = 0
    const hidden = this.hidden.get(k)
    if (hidden) {
      this.hidden.delete(k)
      this.powers.set(k, hidden)
    }
    this.addScore(HEDGE_POINTS, x * TILE + TILE / 2, HUD_H + y * TILE)
    this.leaves(x, y)
    if (k === this.gate.k && !this.gate.open) {
      this.gate.open = true
      this.gate.chain = chain
      this.ringBell()
    }
  }

  private addBloom(x: number, y: number, chain: Chain, grow: boolean) {
    const k = key(x, y)
    // One bloom per burst per tile: two bursts on one tile are two blooms in a row.
    const old = this.blooms.find(
      (b) => b.x === x && b.y === y && b.chain === chain,
    )
    if (old) old.life = BLOOM_TICKS
    else this.blooms.push({ x, y, life: BLOOM_TICKS, chain })
    if (grow && this.grid[k] === 0 && !this.beds.has(k)) this.beds.set(k, 0)
    // Blooming the found gate again rings its bell again.
    if (k === this.gate.k && this.gate.open && this.gate.chain !== chain) {
      this.gate.chain = chain
      this.ringBell()
    }
  }

  /** The gate bell calls three grumps out of the compost heap (after a rumble you can see). */
  private ringBell() {
    if (this.gate.rings >= BELL_MAX) return
    this.gate.rings++
    this.bells.push({ kinds: [...this.plan.plot.bell], timer: BELL_RUMBLE })
    this.sound.play('warn')
    this.sound.playNotes?.([
      { freq: 1318, dur: 0.35, type: 'triangle', vol: 0.08 },
      { freq: 988, dur: 0.5, type: 'triangle', vol: 0.08, at: 0.18 },
    ])
    this.banner = {
      text: 'DING DONG!',
      sub: 'THE GATE BELL WAKES THE COMPOST HEAP',
      ticks: 100,
    }
  }

  private updateBells() {
    for (const bell of this.bells) {
      if (--bell.timer > 0) continue
      const kind = bell.kinds.shift()
      if (kind) {
        const x = this.heap % COLS
        const y = Math.floor(this.heap / COLS)
        this.grumps.push(this.newGrump(kind, x, y))
        this.dust(x, y)
        this.sound.play('pop')
      }
      bell.timer = BELL_GAP
    }
    this.bells = this.bells.filter((b) => b.kinds.length)
  }

  private updateBlooms() {
    const spawned: Grump[] = []
    for (const b of this.blooms) {
      b.life--
      // Gardeners caught in a bloom.
      for (const g of this.gardeners) {
        if (g.down !== 0 || g.safe > 0) continue
        const t = this.here(g)
        if (t.x === b.x && t.y === b.y)
          this.catchGardener(g, 'TANGLED IN BLOOMS')
      }
      // Grumps caught in a bloom become butterflies (or lose a shell, or burst into spores).
      for (const gr of this.grumps) {
        if (gr.dead || gr.immune === b.chain) continue
        if (!bloomable(gr.kind, gr.phase)) continue
        const t = gr.phase === 'mound' ? { x: gr.tx, y: gr.ty } : this.here(gr)
        if (t.x === b.x && t.y === b.y) this.bloomGrump(gr, b.chain, spawned)
      }
    }
    this.grumps = this.grumps.filter((g) => !g.dead).concat(spawned)
    this.blooms = this.blooms.filter((b) => b.life > 0)
  }

  private bloomGrump(gr: Grump, chain: Chain, spawned: Grump[]) {
    const px = this.pixel(gr)
    if (gr.kind === 'slug' && gr.shell) {
      gr.shell = false
      gr.immune = chain
      gr.speed = this.plan.speed * BARE_SLUG_PACE
      this.addScore(SHELL_POINTS, px.x, px.y - 12)
      this.floaters.push({
        x: px.x,
        y: px.y - 20,
        text: 'SHELL OFF!',
        life: 45,
      })
      this.burst2(px.x, px.y, RAMPS.rust[3])
      this.sound.play('pop')
      return
    }
    gr.dead = true
    chain.count++
    const points =
      GNAT_POINTS * GRUMPS[gr.kind].worth * 2 ** Math.min(4, chain.count - 1)
    this.addScore(points, px.x, px.y - 12)
    if (gr.kind === 'thief' && gr.loot) {
      const t = this.here(gr)
      const k = key(t.x, t.y)
      if (gr.loot !== 'planted' && this.grid[k] === 0 && !this.powers.has(k))
        this.powers.set(k, gr.loot)
      this.addScore(LOOT_POINTS, px.x, px.y - 22)
      this.floaters.push({
        x: px.x,
        y: px.y - 30,
        text: 'LOOT BACK!',
        life: 50,
      })
    }
    if (gr.kind === 'puffball') {
      const t = this.here(gr)
      for (const d of DIRS) {
        const spore = this.newGrump('spore', t.x, t.y)
        spore.dir = d
        spore.immune = chain
        spawned.push(spore)
      }
      this.floaters.push({ x: px.x, y: px.y - 22, text: 'SPORES!', life: 40 })
    }
    this.butterflies(px.x, px.y)
    this.fx.burst(px.x, px.y, this.fxRng, {
      count: 10,
      colours: [RAMPS.pink[3], RAMPS.gold[4], RAMPS.purple[3]],
    })
    this.sound.play('pop')
  }

  // --- grumps ------------------------------------------------------------------

  /** Whether a grump can step onto (x, y). */
  private grumpCan(gr: Grump, x: number, y: number): boolean {
    if (x <= 0 || y <= 0 || x >= COLS - 1 || y >= ROWS - 1) return false
    const cell = this.grid[key(x, y)]
    if (cell === WALL) return false
    if (cell === HEDGE && !GRUMPS[gr.kind].ghost) return false
    return gr.kind === 'thief' || !this.podAt(x, y)
  }

  private updateGrumps() {
    for (const gr of this.grumps) {
      if (gr.cooldown > 0) gr.cooldown--
      if (gr.kind === 'mole') this.updateMole(gr)
      else if (gr.kind === 'hopper') this.updateHopper(gr)
      else if (gr.kind === 'bully') this.updateBully(gr)
      else if (gr.kind === 'thief') this.updateThief(gr)
      else this.stepGrump(gr, null)
    }
  }

  /**
   * One tick of walking. At a tile, picks a way: toward `goal` when given (most of the time),
   * by scent for sniffers and moles, otherwise mostly straight on with the odd turn.
   */
  private stepGrump(gr: Grump, goal: { x: number; y: number } | null) {
    if (gr.p === 0) {
      const can = (d: Dir) => this.grumpCan(gr, gr.tx + d.dx, gr.ty + d.dy)
      const options = DIRS.filter(can)
      if (options.length === 0) return
      const here = { x: gr.tx, y: gr.ty }
      const toward =
        goal && this.rng() < 0.75 ? stepToward(here, goal, options) : null
      const scent =
        !goal && (gr.kind === 'sniffer' || gr.kind === 'mole')
          ? sniffStep(here, options, this.activeTiles(), this.rng())
          : null
      if (toward) gr.dir = toward
      else if (scent) gr.dir = scent
      else if (!can(gr.dir) || this.rng() < 0.25) {
        const turns = options.filter(
          (d) => d.dx !== -gr.dir.dx || d.dy !== -gr.dir.dy,
        )
        const pool = turns.length ? turns : options
        gr.dir = pool[Math.floor(this.rng() * pool.length)]!
      }
      gr.nx = gr.tx + gr.dir.dx
      gr.ny = gr.ty + gr.dir.dy
    }
    this.advance(gr, 1)
  }

  /** Moves a grump along its step; flowers slow it to half pace. */
  private advance(gr: Grump, boost: number) {
    const t = this.here(gr)
    const age = this.beds.get(key(t.x, t.y)) ?? 0
    const pace = age >= BED_GROW ? FLOWER_PACE : 1
    gr.p += (gr.speed * boost * pace) / TILE
    if (gr.p >= 1) {
      if (gr.kind === 'slug') this.slime.set(key(gr.tx, gr.ty), SLIME_TICKS)
      gr.tx = gr.nx
      gr.ty = gr.ny
      gr.p = 0
    }
  }

  /** Up and about, digging down (tell), tunnelling, then the wobbling mound (tell). */
  private updateMole(gr: Grump) {
    if (gr.phase === 'walk') {
      if (--gr.timer <= 0 && gr.p === 0) {
        gr.phase = 'tell'
        gr.timer = MOLE_DIG
      } else this.stepGrump(gr, null)
    } else if (gr.phase === 'tell') {
      if (--gr.timer <= 0) {
        gr.phase = 'under'
        gr.timer = MOLE_UNDER
      }
    } else if (gr.phase === 'under') {
      if (--gr.timer > 0) return
      const tiles = this.activeTiles()
      const target = tiles.length
        ? tiles.reduce((best, t) =>
            Math.abs(t.x - gr.tx) + Math.abs(t.y - gr.ty) <
            Math.abs(best.x - gr.tx) + Math.abs(best.y - gr.ty)
              ? t
              : best,
          )
        : { x: gr.tx, y: gr.ty }
      const spot = moundSpot(
        target,
        (x, y) =>
          x > 0 &&
          y > 0 &&
          x < COLS - 1 &&
          y < ROWS - 1 &&
          this.grid[key(x, y)] === 0 &&
          !this.podAt(x, y) &&
          !this.gardenerOn(x, y),
        this.rng(),
      )
      if (!spot) {
        gr.timer = 30
        return
      }
      gr.tx = gr.nx = spot.x
      gr.ty = gr.ny = spot.y
      gr.p = 0
      gr.phase = 'mound'
      gr.timer = MOLE_WOBBLE
    } else if (gr.phase === 'mound') {
      // A pod planted on the mound keeps the mole pinned underneath until it bursts.
      if (this.podAt(gr.tx, gr.ty)) return
      if (--gr.timer <= 0) {
        gr.phase = 'walk'
        gr.timer = MOLE_UP
        this.dust(gr.tx, gr.ty)
      }
    }
  }

  /** Walks; at a hedge with open ground beyond, crouches (tell), then hops it. */
  private updateHopper(gr: Grump) {
    if (gr.phase === 'tell') {
      if (--gr.timer > 0) return
      if (this.hopLook(gr.nx, gr.ny) !== 'open') {
        gr.phase = 'walk'
        gr.nx = gr.tx
        gr.ny = gr.ty
        return
      }
      gr.phase = 'air'
      gr.hopFrom = { x: gr.tx, y: gr.ty }
      gr.p = 0
      return
    }
    if (gr.phase === 'air') {
      gr.p += 1 / HOP_AIR
      if (gr.p >= 1) {
        gr.tx = gr.nx
        gr.ty = gr.ny
        gr.p = 0
        gr.hopFrom = null
        gr.phase = 'walk'
        gr.cooldown = HOP_REST
        this.dust(gr.tx, gr.ty)
      }
      return
    }
    if (gr.p === 0 && gr.cooldown <= 0) {
      const ways = [gr.dir, ...DIRS.filter((d) => d !== gr.dir)]
      for (const d of ways) {
        const land = hopLanding({ x: gr.tx, y: gr.ty }, d, (x, y) =>
          this.hopLook(x, y),
        )
        if (!land) continue
        if (this.rng() < 0.6) {
          gr.phase = 'tell'
          gr.timer = HOP_CROUCH
          gr.dir = d
          gr.nx = land.x
          gr.ny = land.y
          return
        }
        break
      }
    }
    this.stepGrump(gr, null)
  }

  private hopLook(x: number, y: number): 'hedge' | 'open' | 'blocked' {
    if (x <= 0 || y <= 0 || x >= COLS - 1 || y >= ROWS - 1) return 'blocked'
    const cell = this.grid[key(x, y)]
    if (cell === HEDGE) return 'hedge'
    return cell === 0 && !this.podAt(x, y) ? 'open' : 'blocked'
  }

  /** Wanders; with a gardener down a clear lane it sparks (tell), then charges. */
  private updateBully(gr: Grump) {
    if (gr.phase === 'tell') {
      if (--gr.timer <= 0) gr.phase = 'charge'
      return
    }
    if (gr.phase === 'charge') {
      if (gr.p === 0) {
        if (!this.grumpCan(gr, gr.tx + gr.dir.dx, gr.ty + gr.dir.dy)) {
          gr.phase = 'walk'
          gr.cooldown = BULLY_REST
          return
        }
        gr.nx = gr.tx + gr.dir.dx
        gr.ny = gr.ty + gr.dir.dy
      }
      this.advance(gr, BULLY_CHARGE_PACE / GRUMPS.bully.pace)
      return
    }
    if (gr.p === 0 && gr.cooldown <= 0) {
      const lane = chargeLane(
        { x: gr.tx, y: gr.ty },
        this.activeTiles(),
        (x, y) => this.grumpCan(gr, x, y),
      )
      if (lane) {
        gr.phase = 'tell'
        gr.timer = BULLY_SPARK
        gr.dir = lane
        this.sound.play('blip')
        return
      }
    }
    this.stepGrump(gr, null)
  }

  /** Heads for the nearest pod or pickup, carries it off, and buries it in the compost heap. */
  private updateThief(gr: Grump) {
    if (gr.p === 0) {
      const k = key(gr.tx, gr.ty)
      if (gr.loot && k === this.heap) {
        gr.loot = null
        const px = this.pixel(gr)
        this.floaters.push({ x: px.x, y: px.y - 18, text: 'BURIED!', life: 45 })
        this.dust(gr.tx, gr.ty)
      } else if (!gr.loot) {
        const pod = this.podAt(gr.tx, gr.ty)
        const power = this.powers.get(k)
        if (pod) {
          this.pods.splice(this.pods.indexOf(pod), 1)
          gr.loot = 'planted'
        } else if (power && power !== 'golden') {
          this.powers.delete(k)
          gr.loot = power
        }
        if (gr.loot) this.sound.play('blip')
      }
    }
    let goal: { x: number; y: number } | null = null
    if (gr.loot) goal = { x: this.heap % COLS, y: Math.floor(this.heap / COLS) }
    else {
      let best = Infinity
      const consider = (x: number, y: number) => {
        const d = Math.abs(x - gr.tx) + Math.abs(y - gr.ty)
        if (d < best) {
          best = d
          goal = { x, y }
        }
      }
      for (const pod of this.pods) consider(pod.x, pod.y)
      for (const [k, power] of this.powers)
        if (power !== 'golden') consider(k % COLS, Math.floor(k / COLS))
    }
    this.stepGrump(gr, goal)
  }

  private touchGrumps() {
    for (const g of this.gardeners) {
      if (g.down !== 0 || g.safe > 0) continue
      const a = this.pixel(g)
      for (const gr of this.grumps) {
        if (!touches(gr.kind, gr.phase)) continue
        const b = this.pixel(gr)
        if (Math.abs(a.x - b.x) < TOUCH && Math.abs(a.y - b.y) < TOUCH) {
          this.catchGardener(g, `BUMPED A ${GRUMPS[gr.kind].name}`)
          break
        }
      }
    }
  }

  private catchGardener(g: Gardener, why: string) {
    const px = this.pixel(g)
    const at = this.here(g)
    this.burst2(px.x, px.y, SEAT_COLORS[g.seat]!)
    this.sound.play('die')
    if (this.spares > 0) {
      this.spares--
      g.down = RESPAWN_TICKS
    } else g.down = -1
    // Power has a price: a level of each stat drops around the tile, to be won back.
    const { keep, drops } = dropPower(
      { pods: g.pods, range: g.range, speed: g.speed },
      START_STATS,
      SHOE_SPEED,
    )
    g.pods = keep.pods
    g.range = keep.range
    g.speed = keep.speed
    const spots = dropSpots(
      at,
      drops.length,
      (x, y) =>
        x > 0 &&
        y > 0 &&
        x < COLS - 1 &&
        y < ROWS - 1 &&
        this.grid[key(x, y)] === 0 &&
        key(x, y) !== this.gate.k &&
        !this.powers.has(key(x, y)) &&
        !this.podAt(x, y),
      this.rng,
    )
    drops.forEach((drop, i) => {
      const s = spots[i]!
      const k = key(s.x, s.y)
      if (!this.powers.has(k)) this.powers.set(k, drop)
    })
    if (drops.length)
      this.floaters.push({
        x: px.x,
        y: px.y - 24,
        text: 'POWER DROPPED',
        life: 60,
      })
    // Their pods stay put; they still burst on time.
    g.p = 0
    g.nx = g.tx
    g.ny = g.ty
    const multi = this.gardeners.length > 1
    this.banner = {
      text: 'OOPS!',
      sub: `${multi ? `${g.seat + 1}P ` : ''}${why}`,
      ticks: 70,
    }
  }

  // --- the garden, the gate and the cloud -------------------------------------------

  private updateGarden() {
    for (const [k, age] of this.beds)
      if (age < BED_GROW) this.beds.set(k, age + 1)
    for (const [k, left] of this.slime)
      if (left <= 1) this.slime.delete(k)
      else this.slime.set(k, left - 1)
  }

  /** The time-out: a sulky rain cloud nobody can bloom drifts after the nearest gardener. */
  private grumbleCloud() {
    if (this.cloud) return
    const tiles = this.activeTiles()
    const spots = [
      { x: W / 2, y: HUD_H + TILE * 1.5 },
      { x: W / 2, y: H - TILE * 1.5 },
      { x: TILE * 1.5, y: HUD_H + (ROWS * TILE) / 2 },
      { x: W - TILE * 1.5, y: HUD_H + (ROWS * TILE) / 2 },
    ]
    const nearest = (s: { x: number; y: number }) =>
      Math.min(
        Infinity,
        ...tiles.map((t) =>
          Math.hypot(
            t.x * TILE + TILE / 2 - s.x,
            HUD_H + t.y * TILE + TILE / 2 - s.y,
          ),
        ),
      )
    const start = spots.reduce((a, b) => (nearest(b) > nearest(a) ? b : a))
    this.cloud = { ...start, speed: CLOUD_SPEED }
    this.sound.play('warn')
    this.banner = {
      text: 'GRUMBLE CLOUD!',
      sub: 'FINISH THE PLOT BEFORE IT RAINS ON YOU',
      ticks: 110,
    }
  }

  private updateCloud() {
    const cloud = this.cloud
    if (!cloud) return
    cloud.speed = Math.min(CLOUD_MAX, cloud.speed + CLOUD_ACCEL)
    let target: { x: number; y: number } | null = null
    let best = Infinity
    for (const g of this.gardeners) {
      if (g.down !== 0) continue
      const px = this.pixel(g)
      const d = Math.hypot(px.x - cloud.x, px.y - cloud.y)
      if (d < best) {
        best = d
        target = px
      }
    }
    if (target && best > 0.01) {
      const step = Math.min(best, cloud.speed)
      cloud.x += ((target.x - cloud.x) / best) * step
      cloud.y += ((target.y - cloud.y) / best) * step
    }
    for (const g of this.gardeners) {
      if (g.down !== 0 || g.safe > 0) continue
      const px = this.pixel(g)
      if (
        Math.abs(px.x - cloud.x) < CLOUD_TOUCH &&
        Math.abs(px.y - cloud.y) < CLOUD_TOUCH
      )
        this.catchGardener(g, 'RAINED ON BY THE GRUMBLE CLOUD')
    }
    if (this.tick % 3 === 0)
      this.particles.push({
        x: cloud.x + (this.fxRng() - 0.5) * 22,
        y: cloud.y + 6,
        vx: 0,
        vy: 1.6,
        life: 12,
        color: RAIN_COLOUR,
      })
  }

  /** Calls out the open gate (or that it still needs finding), and lets gardeners through it. */
  private updateGate() {
    if (this.grumps.length || this.bells.length) return
    if (!this.gate.open) {
      if (this.gateCall === 'none') {
        this.gateCall = 'find'
        this.banner = {
          text: 'FIND THE GATE!',
          sub: 'IT IS HIDING UNDER A HEDGE',
          ticks: 110,
        }
      }
      return
    }
    if (this.gateCall !== 'open') {
      this.gateCall = 'open'
      this.sound.play('level')
      this.banner = {
        text: 'THE GATE IS OPEN!',
        sub: 'STEP THROUGH TO FINISH THE PLOT',
        ticks: 110,
      }
    }
    for (const g of this.gardeners) {
      if (g.down !== 0) continue
      const t = this.here(g)
      if (key(t.x, t.y) === this.gate.k) {
        this.plotClear()
        return
      }
    }
  }

  private plotClear() {
    const inBloom = inBloomPercent(this.beds, this.area)
    const timeBonus = Math.max(0, Math.floor(this.timer / 60)) * 10
    const bonus = ROUND_POINTS * this.level + timeBonus + inBloom * BLOOM_POINTS
    this.addScore(bonus, W / 2, H / 2)
    this.clear = CLEAR_TICKS
    this.pods = []
    this.blooms = []
    this.cloud = null
    for (let i = 0; i < 6; i++)
      this.fx.burst(
        TILE + this.fxRng() * (W - TILE * 2),
        HUD_H + TILE + this.fxRng() * (H - HUD_H - TILE * 2),
        this.fxRng,
        { count: 12, speed: 2 },
      )
    this.sound.play('level')
    this.banner = {
      text: 'PLOT CLEAR!',
      sub: `IN BLOOM ${inBloom}%  +${bonus}`,
      ticks: CLEAR_TICKS,
    }
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x: number, y: number) {
    if (this.demo || points <= 0) return
    this.score += points
    this.floaters.push({ x, y, text: String(points), life: 45 })
  }

  private leaves(x: number, y: number) {
    for (let i = 0; i < 6; i++)
      this.particles.push({
        x: x * TILE + TILE / 2,
        y: HUD_H + y * TILE + TILE / 2,
        vx: (this.fxRng() - 0.5) * 2,
        vy: -this.fxRng() * 1.5,
        life: 24,
        color: LEAF_COLOUR,
      })
  }

  private dust(x: number, y: number) {
    for (let i = 0; i < 8; i++)
      this.particles.push({
        x: x * TILE + TILE / 2,
        y: HUD_H + y * TILE + TILE / 2 + 4,
        vx: (this.fxRng() - 0.5) * 1.8,
        vy: -this.fxRng() * 1.2,
        life: 22,
        color: RAMPS.earth[3],
      })
  }

  private butterflies(x: number, y: number) {
    for (let i = 0; i < 8; i++)
      this.particles.push({
        x,
        y,
        vx: (this.fxRng() - 0.5) * 1.6,
        vy: -0.4 - this.fxRng() * 1.2,
        life: 40,
        color: ['#f9a8d4', '#fde047', '#c4b5fd'][i % 3]!,
      })
  }

  private burst2(x: number, y: number, color: string) {
    for (let i = 0; i < 14; i++) {
      const a = this.fxRng() * Math.PI * 2
      const s = 0.5 + this.fxRng() * 1.5
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 26,
        color,
      })
    }
  }

  private updateEffects() {
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      if (p.color !== RAIN_COLOUR) p.vy += 0.02
      p.life--
    }
    this.particles = this.particles.filter((p) => p.life > 0)
    for (const f of this.floaters) {
      f.y -= 0.3
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
    this.fx.update()
  }

  // --- attract-mode pilot -----------------------------------------------------

  private dangerMap(): Set<number> {
    const danger = new Set<number>()
    for (const pod of this.pods)
      for (const t of this.podTiles(pod)) danger.add(key(t.x, t.y))
    for (const b of this.blooms) danger.add(key(b.x, b.y))
    const around = (x: number, y: number) => {
      danger.add(key(x, y))
      for (const d of DIRS) danger.add(key(x + d.dx, y + d.dy))
    }
    for (const gr of this.grumps) {
      if (gr.phase === 'under') continue
      around(gr.tx, gr.ty)
      around(gr.nx, gr.ny)
      if (gr.kind === 'bully' && (gr.phase === 'tell' || gr.phase === 'charge'))
        for (let r = 1; r <= BULLY_SIGHT; r++)
          danger.add(key(gr.tx + gr.dir.dx * r, gr.ty + gr.dir.dy * r))
    }
    if (this.bells.length && this.heap >= 0)
      around(this.heap % COLS, Math.floor(this.heap / COLS))
    if (this.cloud)
      for (let y = 1; y < ROWS - 1; y++)
        for (let x = 1; x < COLS - 1; x++)
          if (
            Math.hypot(
              x * TILE + TILE / 2 - this.cloud.x,
              HUD_H + y * TILE + TILE / 2 - this.cloud.y,
            ) <
            TILE * 2.5
          )
            danger.add(key(x, y))
    return danger
  }

  /** Breadth-first search from the gardener; returns the first step to a goal. */
  private route(
    g: Gardener,
    goal: (k: number) => boolean,
    avoid: Set<number> | null,
    maxSteps = 60,
  ): { dir: Dir; steps: number } | null {
    const start = key(g.tx, g.ty)
    const first = new Map<number, Dir | null>([[start, null]])
    const dist = new Map<number, number>([[start, 0]])
    const queue = [start]
    while (queue.length) {
      const k = queue.shift()!
      const steps = dist.get(k)!
      if (k !== start && goal(k)) return { dir: first.get(k)!, steps }
      if (steps >= maxSteps) continue
      const x = k % COLS
      const y = Math.floor(k / COLS)
      for (const d of DIRS) {
        const nx = x + d.dx
        const ny = y + d.dy
        const nk = key(nx, ny)
        if (first.has(nk) || !this.canWalk(g, nx, ny)) continue
        if (avoid?.has(nk) && !goal(nk)) continue
        first.set(nk, first.get(k) ?? d)
        dist.set(nk, steps + 1)
        queue.push(nk)
      }
    }
    return null
  }

  /**
   * The pouch variety the pilot would plant here: one that blooms a grump beats one that clears
   * the most hedges, and the seed in hand wins a tie. Null when nothing is worth a pod.
   */
  private pilotSeed(g: Gardener): { variety: Variety; blast: number[] } | null {
    let best: { variety: Variety; blast: number[]; score: number } | null = null
    for (const variety of g.pouch) {
      if (variety === 'puffcap' || variety === 'bramble') continue
      const tiles = burstTiles(
        variety,
        g.tx,
        g.ty,
        g.facing,
        g.range,
        this.look,
      )
      const blast = tiles.map((t) => key(t.x, t.y))
      const grumpHit = this.grumps.some(
        (gr) =>
          bloomable(gr.kind, gr.phase) && blast.includes(key(gr.tx, gr.ty)),
      )
      const hedges = tiles.filter((t) => t.hit === 'hedge').length
      if (!grumpHit && !hedges) continue
      const score =
        (grumpHit ? 10 : 0) + hedges + (variety === g.pouch[g.seed] ? 0.5 : 0)
      if (!best || score > best.score) best = { variety, blast, score }
    }
    return best
  }

  /**
   * Flees any tile a pod, bloom, grump or the cloud threatens; picks the best seed and plants
   * beside hedges and in line with grumps when there is a safe way out; otherwise heads for the
   * nearest pickup, the open gate, or the nearest hedge.
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
    const g = this.gardeners[0]
    if (!g || g.down !== 0 || g.p !== 0) {
      // Mid-step: keep walking the same way.
      if (g && g.p !== 0)
        this.press(frame, { dx: g.nx - g.tx, dy: g.ny - g.ty })
      return frame
    }
    const danger = this.dangerMap()
    const here = key(g.tx, g.ty)
    // Never step onto a bloom or straight into a grump while getting away.
    const bloomNow = new Set(this.blooms.map((b) => key(b.x, b.y)))
    for (const gr of this.grumps) {
      if (gr.phase === 'under') continue
      bloomNow.add(key(gr.tx, gr.ty))
      bloomNow.add(key(gr.nx, gr.ny))
    }
    if (danger.has(here)) {
      const out = this.route(g, (k) => !danger.has(k), bloomNow, 12)
      if (out) this.press(frame, out.dir)
      return frame
    }
    const mine = this.pods.filter((p) => p.owner === g.seat).length
    if (mine < g.pods && !this.podAt(g.tx, g.ty)) {
      const choice = this.pilotSeed(g)
      if (choice && choice.variety !== g.pouch[g.seed]) {
        held.b = true
        frame.pressed.b = true
        return frame
      }
      if (choice) {
        const after = new Set([...danger, ...choice.blast])
        const escape = this.route(g, (k) => !after.has(k), bloomNow, 6)
        if (escape) {
          held.a = true
          frame.pressed.a = true
          return frame
        }
      }
    }
    const target =
      this.route(g, (k) => this.powers.has(k) && !danger.has(k), danger, 30) ??
      (this.gateOpen
        ? this.route(g, (k) => k === this.gate.k, danger, 60)
        : null) ??
      this.route(
        g,
        (k) =>
          !danger.has(k) &&
          (DIRS.some((d) => this.grid[k + d.dx + d.dy * COLS] === HEDGE) ||
            this.grumps.some(
              (gr) =>
                bloomable(gr.kind, gr.phase) &&
                burstTiles(
                  'sunflower',
                  k % COLS,
                  Math.floor(k / COLS),
                  g.facing,
                  g.range,
                  this.look,
                ).some((t) => t.x === gr.tx && t.y === gr.ty),
            )),
        danger,
        40,
      )
    if (target) this.press(frame, target.dir)
    return frame
  }

  private press(frame: InputFrame, d: Dir) {
    if (d.dy < 0) frame.held.up = true
    if (d.dy > 0) frame.held.down = true
    if (d.dx < 0) frame.held.left = true
    if (d.dx > 0) frame.held.right = true
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    const garden = (this.level - 1) % GARDENS.length
    cachedLayer(
      g,
      `seed-burst-field-${this.plan.plot.id}-${garden}`,
      W,
      H,
      (k) => this.paintField(k, GARDENS[garden]!),
    )
    this.renderBeds(g)
    this.renderSlime(g)
    this.renderHeap(g)
    this.renderGate(g)
    this.renderHedges(g)
    for (const [k, power] of this.powers) this.renderPower(g, k, power)
    for (const pod of this.pods) this.renderPod(g, pod)
    this.renderBlooms(g)
    this.renderCloudShadows(g)
    for (const gr of this.grumps) this.renderGrump(g, gr)
    for (const gd of this.gardeners) this.renderGardener(g, gd)
    this.renderCloud(g)
    this.renderParticles(g)
    this.fx.render(g)
    for (const f of this.floaters)
      drawText(g, f.text, f.x, f.y, {
        align: 'center',
        color: RAMPS.gold[3],
        outline: INK,
      })
    vignette(g, W, H, 0.28)
    this.renderSeatBadges(g)
    for (const gd of this.gardeners) this.renderSeatLabel(g, gd)
    this.renderHud(g)
  }

  /** The static garden: banded grass, stone pillars with lit tops, the brick wall, the HUD bed. */
  private paintField(
    k: CanvasRenderingContext2D,
    garden: (typeof GARDENS)[number],
  ) {
    const { grass, flowers } = garden
    const rand = backdropRng(71)
    bandedGradient(k, 0, 0, W, HUD_H, [RAMPS.night[2], RAMPS.night[0]], 2)
    const isWall = (x: number, y: number) =>
      x <= 0 ||
      y <= 0 ||
      x >= COLS - 1 ||
      y >= ROWS - 1 ||
      !!this.stone[key(x, y)]
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++) {
        const px = x * TILE
        const py = HUD_H + y * TILE
        if (isWall(x, y)) continue
        // Grass in lit bands, a checker of two mowing stripes.
        const dark = (x + y) % 2 === 1
        bandedGradient(
          k,
          px,
          py,
          TILE,
          TILE,
          dark
            ? [grass[2], grass[1], grass[1], grass[0]]
            : [grass[3], grass[2], grass[2], grass[1]],
          4,
        )
        k.fillStyle = dark ? grass[2] : grass[3]
        k.fillRect(px, py, TILE, 1)
        for (let i = 0; i < 3; i++) {
          const tx = px + 2 + Math.floor(rand() * (TILE - 4))
          const ty = py + 3 + Math.floor(rand() * (TILE - 6))
          k.fillStyle = grass[4]
          k.fillRect(tx, ty, 1, 2)
          k.fillStyle = dark ? grass[3] : grass[4]
          k.fillRect(tx - 1, ty + 1, 1, 1)
          k.fillRect(tx + 1, ty + 1, 1, 1)
        }
        if (rand() < 0.22) {
          const fx = px + 3 + Math.floor(rand() * (TILE - 6))
          const fy = py + 3 + Math.floor(rand() * (TILE - 6))
          k.fillStyle = flowers[Math.floor(rand() * flowers.length)]!
          k.fillRect(fx - 1, fy, 3, 1)
          k.fillRect(fx, fy - 1, 1, 3)
          k.fillStyle = RAMPS.gold[4]
          k.fillRect(fx, fy, 1, 1)
        }
        // Walls cast their shadow down and to the right, away from the light.
        k.fillStyle = rgba(INK, 0.4)
        if (isWall(x, y - 1)) k.fillRect(px, py, TILE, 5)
        if (isWall(x - 1, y)) k.fillRect(px, py, 4, TILE)
      }
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++) {
        if (!isWall(x, y)) continue
        const px = x * TILE
        const py = HUD_H + y * TILE
        if (x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1)
          this.paintBricks(k, px, py, y)
        else this.paintPillar(k, px, py)
      }
    // A lit lip where the wall meets the HUD.
    k.fillStyle = INK
    k.fillRect(0, HUD_H - 1, W, 1)
  }

  private paintBricks(
    k: CanvasRenderingContext2D,
    px: number,
    py: number,
    row: number,
  ) {
    const ramp = RAMPS.earth
    k.fillStyle = ramp[0]
    k.fillRect(px, py, TILE, TILE)
    for (let r = 0; r < 4; r++) {
      const shift = (r + row) % 2 ? 4 : 0
      for (let c = -1; c < 2; c++) {
        const bx = px + c * 8 + shift
        const left = Math.max(px, bx)
        const right = Math.min(px + TILE, bx + 8)
        if (right - left < 2) continue
        bevel(k, left, py + r * 4, right - left - 1, 3, ramp, {
          depth: 1,
          outline: null,
        })
      }
    }
    k.fillStyle = rgba(RAMPS.leaf[2], 0.8)
    if ((px / TILE + row) % 3 === 0) {
      k.fillRect(px + 3, py, 3, 1)
      k.fillRect(px + 4, py + 1, 1, 2)
    }
  }

  private paintPillar(k: CanvasRenderingContext2D, px: number, py: number) {
    // A raised stone block: a bevelled top face over a darker front face.
    k.fillStyle = INK
    k.fillRect(px, py, TILE, TILE)
    k.fillStyle = STONE[1]
    k.fillRect(px + 1, py + 11, TILE - 2, 4)
    k.fillStyle = STONE[0]
    k.fillRect(px + 1, py + 14, TILE - 2, 1)
    k.fillRect(px + 5, py + 11, 1, 3)
    k.fillRect(px + 10, py + 11, 1, 3)
    bevel(k, px + 1, py + 1, TILE - 2, 10, STONE, { depth: 2, outline: null })
    k.fillStyle = STONE[3]
    k.fillRect(px + 4, py + 4, 3, 1)
    k.fillStyle = STONE[1]
    k.fillRect(px + 9, py + 6, 3, 1)
    k.fillRect(px + 11, py + 5, 1, 1)
    k.fillStyle = RAMPS.leaf[2]
    k.fillRect(px + 1, py + 1, 3, 1)
    k.fillRect(px + 1, py + 2, 1, 2)
    k.fillStyle = RAMPS.leaf[3]
    k.fillRect(px + 2, py + 1, 1, 1)
  }

  /** Flowerbeds: a sprout, then a bud, then a flower where every bloom has been. */
  private renderBeds(g: CanvasRenderingContext2D) {
    for (const [k, age] of this.beds) {
      if (this.grid[k] !== 0) continue
      const x = k % COLS
      const y = Math.floor(k / COLS)
      const cx = x * TILE + TILE / 2 + (((x * 5 + y * 3) % 5) - 2)
      const cy = HUD_H + y * TILE + TILE / 2 + (((x * 3 + y * 7) % 3) - 1) + 3
      const colour = (x + y) % 4
      const stage = bedStage(age)
      if (stage === 0) drawSprite(g, SPROUT_SPRITE, cx, cy)
      else if (stage === 1) drawSprite(g, BED_BUDS[colour]!, cx, cy)
      else {
        drawSprite(g, BED_FLOWERS[colour]!, cx, cy)
        drawSprite(g, BED_BUDS[(colour + 1) % 4]!, cx + 5, cy - 4)
        drawSprite(g, SPROUT_SPRITE, cx - 5, cy - 3)
      }
    }
  }

  private renderSlime(g: CanvasRenderingContext2D) {
    for (const [k, left] of this.slime) {
      const cx = (k % COLS) * TILE + TILE / 2
      const cy = HUD_H + Math.floor(k / COLS) * TILE + TILE / 2 + 3
      g.save()
      g.globalAlpha = 0.45 * Math.min(1, left / 60)
      g.fillStyle = '#d9f99d'
      g.beginPath()
      g.ellipse(cx, cy, 6, 3, 0, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = '#ffffff'
      g.fillRect(cx - 3, cy - 1, 2, 1)
      g.restore()
    }
  }

  /** The compost heap; it shakes and steams while the gate bell is calling grumps out. */
  private renderHeap(g: CanvasRenderingContext2D) {
    if (this.heap < 0) return
    const cx = (this.heap % COLS) * TILE + TILE / 2
    const cy = HUD_H + Math.floor(this.heap / COLS) * TILE + TILE / 2
    const rumble = this.bells.length > 0
    const shake = rumble ? (Math.floor(this.tick / 2) % 2 ? 1 : -1) : 0
    dropShadow(g, cx + 1, cy + 6, 7, 2, 0.35)
    if (rumble) glow(g, cx, cy, 13, RAMPS.ember[3], 0.35)
    drawSprite(g, HEAP_SPRITE, cx + shake, cy + 7, { anchor: 'feet' })
    if (rumble && this.tick % 10 < 5)
      drawText(g, '!', cx, cy - 12, {
        align: 'center',
        color: RAMPS.ember[3],
        outline: INK,
      })
  }

  /** The Garden Gate once found: shut with its bell while grumps remain, then open and glowing. */
  private renderGate(g: CanvasRenderingContext2D) {
    if (!this.gate.open) return
    const cx = (this.gate.k % COLS) * TILE + TILE / 2
    const cy = HUD_H + Math.floor(this.gate.k / COLS) * TILE + TILE / 2
    const x0 = cx - 7
    const y0 = cy - 5
    if (this.gateOpen) {
      glow(g, cx, cy, 16, RAMPS.gold[3], 0.5 + 0.2 * Math.sin(this.tick / 6))
      g.fillStyle = rgba(RAMPS.gold[4], 0.6)
      g.fillRect(x0 + 2, y0, 10, 11)
      bevel(g, x0 + 1, y0, 2, 11, RAMPS.earth, { depth: 1 })
      bevel(g, x0 + 11, y0, 2, 11, RAMPS.earth, { depth: 1 })
    } else {
      bevel(g, x0 + 2, y0, 5, 11, RAMPS.earth, { depth: 1 })
      bevel(g, x0 + 7, y0, 5, 11, RAMPS.earth, { depth: 1 })
      g.fillStyle = RAMPS.earth[1]
      g.fillRect(x0 + 2, y0 + 4, 10, 1)
      g.fillRect(x0 + 2, y0 + 8, 10, 1)
    }
    bevel(g, x0 - 1, y0 - 3, 3, 14, STONE, { depth: 1 })
    bevel(g, x0 + 12, y0 - 3, 3, 14, STONE, { depth: 1 })
    g.fillStyle = RAMPS.earth[2]
    g.fillRect(x0 + 1, y0 - 3, 12, 1)
    const swing = this.bells.length
      ? Math.round(Math.sin(this.tick / 3) * 2)
      : 0
    shadedOrb(g, cx + swing, y0 - 1, 2.5, RAMPS.gold)
    const pct = `${inBloomPercent(this.beds, this.area)}%`
    drawText(g, pct, cx, Math.max(HUD_H + 1, y0 - 12), {
      align: 'center',
      color: this.gateOpen ? RAMPS.gold[4] : LIME[3],
      outline: INK,
    })
  }

  private renderHedges(g: CanvasRenderingContext2D) {
    // Shadows first, so no hedge's shade falls across its neighbour.
    g.fillStyle = rgba(INK, 0.35)
    for (let y = 1; y < ROWS - 1; y++)
      for (let x = 1; x < COLS - 1; x++) {
        if (this.grid[key(x, y)] !== HEDGE) continue
        const px = x * TILE
        const py = HUD_H + y * TILE
        if (!this.grid[key(x, y + 1)])
          g.fillRect(px + 3, py + TILE, TILE - 2, 3)
        if (!this.grid[key(x + 1, y)])
          g.fillRect(px + TILE, py + 4, 3, TILE - 4)
      }
    for (let y = 1; y < ROWS - 1; y++)
      for (let x = 1; x < COLS - 1; x++) {
        if (this.grid[key(x, y)] !== HEDGE) continue
        const sprite = HEDGE_SPRITES[(x * 7 + y * 3) % 5 === 0 ? 1 : 0]
        drawSprite(g, sprite, x * TILE + TILE / 2, HUD_H + y * TILE + TILE / 2)
      }
  }

  private renderPower(g: CanvasRenderingContext2D, k: number, power: Pickup) {
    const cx = (k % COLS) * TILE + TILE / 2
    const cy = HUD_H + Math.floor(k / COLS) * TILE + TILE / 2
    const pulse = Math.sin(this.tick / 8)
    const bob = Math.round(pulse)
    const golden = power === 'golden'
    const packet = !golden && !(power in POWER_SPRITES)
    glow(g, cx, cy, golden ? 16 : 13, RAMPS.gold[3], 0.4 + 0.2 * pulse)
    dropShadow(g, cx + 1, cy + 7, 6, 1.5, 0.35)
    bevel(
      g,
      cx - 7,
      cy - 7 + bob,
      14,
      13,
      golden ? RAMPS.gold : packet ? RAMPS.cream : RAMPS.purple,
      { depth: 2 },
    )
    if (Math.floor(this.tick / 10) % 2) {
      g.fillStyle = RAMPS.gold[4]
      g.fillRect(cx - 7, cy - 7 + bob, 14, 1)
    }
    drawSprite(g, pickupSprite(power), cx, cy + bob)
  }

  private renderPod(g: CanvasRenderingContext2D, pod: Pod) {
    const roll = pod.roll && pod.rollT > 0 ? (pod.rollT / ROLL_TICKS) * TILE : 0
    const cx = pod.x * TILE + TILE / 2 + (pod.roll?.dx ?? 0) * roll
    const cy = HUD_H + pod.y * TILE + TILE / 2 + 1 + (pod.roll?.dy ?? 0) * roll
    const remote = pod.variety === 'puffcap'
    const late = pod.fuse < 50
    const pulse = late
      ? Math.floor(this.tick / 4) % 2
      : Math.floor(this.tick / (remote ? 20 : 12)) % 2
    const r = (pod.variety === 'pumpkin' ? 6 : 5) + pulse
    const ramp = VARIETY_RAMPS[pod.variety]
    dropShadow(g, cx + 1, cy + 6, 6, 2, 0.4)
    if (late) glow(g, cx, cy, 14, RAMPS.ember[2], 0.35 + 0.35 * pulse)
    else glow(g, cx, cy, 10, ramp[3], 0.18)
    shadedOrb(g, cx, cy, r, late && pulse ? RAMPS.ember : ramp)
    // Each husk wears its burst shape, so a glance tells you where it will bloom.
    g.fillStyle = rgba(ramp[4], 0.9)
    const dot = (dx: number, dy: number) =>
      g.fillRect(Math.round(cx + dx), Math.round(cy + dy), 1, 1)
    if (pod.variety === 'clover')
      for (const s of [-2, -1, 1, 2]) {
        dot(s, s)
        dot(s, -s)
      }
    else if (pod.variety === 'dandelion')
      for (let i = 0; i <= 3; i++) dot(pod.dir.dx * i, pod.dir.dy * i)
    else if (pod.variety === 'pumpkin') {
      g.fillStyle = rgba(INK, 0.45)
      g.fillRect(Math.round(cx) - 2, Math.round(cy - r + 2), 1, r * 2 - 3)
      g.fillRect(Math.round(cx) + 2, Math.round(cy - r + 2), 1, r * 2 - 3)
    } else if (remote) {
      g.fillStyle = '#ffffff'
      dot(-2, -2)
      dot(2, -1)
      dot(-1, 1)
    } else
      for (const s of [-2, -1, 1, 2]) {
        dot(s, 0)
        dot(0, s)
      }
    drawSprite(g, SPROUT_SPRITE, cx, cy - r + 1, { anchor: 'feet' })
  }

  private renderBlooms(g: CanvasRenderingContext2D) {
    if (!this.blooms.length) return
    const at = new Set(this.blooms.map((b) => key(b.x, b.y)))
    // Colour math: the glowing burst of petals the pod throws out.
    g.save()
    g.globalCompositeOperation = 'lighter'
    for (const b of this.blooms) {
      const cx = b.x * TILE + TILE / 2
      const cy = HUD_H + b.y * TILE + TILE / 2
      const ramp = BLOOM_RAMPS[(b.x + b.y) % 4]!
      const fade = Math.min(1, b.life / 8)
      g.globalAlpha = 1
      glow(g, cx, cy, 14, ramp[3], 0.55 * fade)
      // A white flash the moment the pod pops.
      if (BLOOM_TICKS - b.life < 4) glow(g, cx, cy, 20, '#ffffff', 0.5)
      const shimmer = (this.tick + b.x + b.y) % 4 < 2 ? 0 : 2
      for (const d of DIRS) {
        if (!at.has(key(b.x + d.dx, b.y + d.dy))) continue
        for (const [w, colour, a] of [
          [12 + shimmer, ramp[2], 0.5],
          [8, ramp[3], 0.65],
          [4, ramp[4], 0.8],
          [2, '#ffffff', 0.9],
        ] as const) {
          g.globalAlpha = a * fade
          g.fillStyle = colour
          if (d.dx)
            g.fillRect(d.dx > 0 ? cx : cx - TILE / 2, cy - w / 2, TILE / 2, w)
          else
            g.fillRect(cx - w / 2, d.dy > 0 ? cy : cy - TILE / 2, w, TILE / 2)
        }
      }
    }
    g.restore()
    for (const b of this.blooms) {
      const cx = b.x * TILE + TILE / 2
      const cy = HUD_H + b.y * TILE + TILE / 2
      const age = BLOOM_TICKS - b.life
      const sprites = age < 5 ? BUD_SPRITES : BLOOM_SPRITES
      drawSprite(g, sprites[(b.x + b.y) % 4]!, cx, cy, {
        alpha: Math.min(1, b.life / 6),
      })
    }
  }

  private renderCloudShadows(g: CanvasRenderingContext2D) {
    g.save()
    g.beginPath()
    g.rect(0, HUD_H, W, H - HUD_H)
    g.clip()
    g.fillStyle = rgba(INK, 0.1)
    for (const c of CLOUD_SHADOWS) {
      const span = W + c.rx * 2
      const x = ((c.x + this.tick * c.speed) % span) - c.rx
      g.beginPath()
      g.ellipse(x, c.y, c.rx, c.ry, 0, 0, Math.PI * 2)
      g.fill()
    }
    g.restore()
  }

  private renderGrump(g: CanvasRenderingContext2D, gr: Grump) {
    const { x, y } = this.pixel(gr)
    const flap = Math.floor(this.tick / 4) % 2
    const flip = gr.dir.dx < 0
    const kind = gr.kind
    if (kind === 'gnat' || kind === 'drifter' || kind === 'sniffer') {
      const hover = Math.round(Math.sin(this.tick / 9 + gr.tx) * 1.5) - 3
      const ghost = kind === 'drifter'
      dropShadow(g, x, y + 6, 4, 1.5, 0.35)
      if (ghost) glow(g, x, y + hover, 11, RAMPS.purple[3], 0.45)
      drawSprite(
        g,
        (ghost
          ? GHOST_SPRITES
          : kind === 'sniffer'
            ? SNIFFER_SPRITES
            : GNAT_SPRITES)[flap]!,
        x,
        y + hover,
        { flipX: flip, alpha: ghost ? 0.8 : 1 },
      )
    } else if (kind === 'spore') {
      const hover = Math.round(Math.sin(this.tick / 6 + gr.ty) * 1.5) - 2
      dropShadow(g, x, y + 5, 3, 1, 0.3)
      drawSprite(g, SPORE_SPRITES[flap]!, x, y + hover)
    } else if (kind === 'slug') {
      dropShadow(g, x, y + 6, 6, 1.5, 0.35)
      drawSprite(g, SLUG_SPRITES[gr.shell ? 0 : 1], x, y + 7, {
        anchor: 'feet',
        flipX: flip,
      })
      if (!gr.shell && Math.floor(this.tick / 8) % 2) {
        g.fillStyle = RAMPS.sky[4]
        g.fillRect(x + (flip ? 5 : -6), y - 4, 1, 2)
      }
    } else if (kind === 'mole') this.renderMole(g, gr, x, y)
    else if (kind === 'hopper') this.renderHopper(g, gr, x, y)
    else if (kind === 'bully') {
      const charging = gr.phase === 'charge'
      dropShadow(g, x, y + 7, 5, 1.5, 0.35)
      if (charging) {
        g.fillStyle = rgba('#ffffff', 0.6)
        for (let i = 1; i <= 3; i++)
          g.fillRect(
            Math.round(x - gr.dir.dx * (6 + i * 3)) - (gr.dir.dy ? 4 : 0),
            Math.round(y - gr.dir.dy * (6 + i * 3)) - (gr.dir.dx ? 3 : 0) + i,
            gr.dir.dy ? 8 : 2,
            gr.dir.dx ? 1 : 2,
          )
      }
      drawSprite(g, BULLY_SPRITES[flap]!, x, y - 1, { flipX: flip })
      if (gr.phase === 'tell') {
        // The tell: antennae spark and a "!" pops over its head.
        if (this.tick % 4 < 2) {
          g.fillStyle = RAMPS.gold[4]
          g.fillRect(x - 5, y - 9, 2, 2)
          g.fillRect(x + 4, y - 9, 2, 2)
        }
        drawText(g, '!', x, y - 19, {
          align: 'center',
          color: RAMPS.ember[3],
          outline: INK,
        })
      }
    } else if (kind === 'thief') {
      dropShadow(g, x, y + 7, 5, 1.5, 0.35)
      const sackX = x + (flip ? 5 : -5)
      drawSprite(g, SACK_SPRITE, sackX, y + 2, { alpha: gr.loot ? 1 : 0.7 })
      drawSprite(g, THIEF_SPRITE, x, y, { flipX: flip })
      if (gr.loot) {
        const icon =
          gr.loot === 'planted'
            ? VARIETY_SPRITES.sunflower
            : pickupSprite(gr.loot)
        drawSprite(g, icon, sackX, y - 6)
      }
    } else if (kind === 'puffball') {
      const bob = Math.round(Math.sin(this.tick / 10 + gr.tx) * 1)
      dropShadow(g, x, y + 7, 5, 1.5, 0.35)
      drawSprite(g, PUFFBALL_SPRITE, x, y + bob)
    }
  }

  private renderMole(
    g: CanvasRenderingContext2D,
    gr: Grump,
    x: number,
    y: number,
  ) {
    if (gr.phase === 'under') return
    if (gr.phase === 'mound') {
      // The tell: the mound wobbles, faster as the mole nears the top.
      const fast = gr.timer < MOLE_WOBBLE / 2
      const wob = Math.floor(this.tick / (fast ? 2 : 4)) % 2 ? 1 : -1
      dropShadow(g, x, y + 6, 6, 1.5, 0.3)
      drawSprite(g, MOUND_SPRITE, x + wob, y + 7, { anchor: 'feet' })
      if (this.tick % 6 === 0) this.dust(gr.tx, gr.ty)
      return
    }
    dropShadow(g, x, y + 6, 5, 1.5, 0.35)
    if (gr.phase === 'tell') {
      // Digging down: the mole sinks into its mound.
      const sink = Math.round((1 - gr.timer / MOLE_DIG) * 7)
      g.save()
      g.beginPath()
      g.rect(x - 8, y - 12, 16, 16)
      g.clip()
      drawSprite(g, MOLE_SPRITE, x, y + 5 + sink, { anchor: 'feet' })
      g.restore()
      drawSprite(g, MOUND_SPRITE, x, y + 7, { anchor: 'feet' })
      return
    }
    drawSprite(g, MOLE_SPRITE, x, y + 6, {
      anchor: 'feet',
      flipX: gr.dir.dx < 0,
    })
  }

  private renderHopper(
    g: CanvasRenderingContext2D,
    gr: Grump,
    x: number,
    y: number,
  ) {
    const flip = gr.dir.dx < 0
    if (gr.phase === 'tell' || gr.phase === 'air') {
      // The tell: a shadow ring on the landing tile.
      const lx = gr.nx * TILE + TILE / 2
      const ly = HUD_H + gr.ny * TILE + TILE / 2
      const pulse = Math.floor(this.tick / 5) % 2
      g.save()
      g.strokeStyle = rgba(INK, 0.6)
      g.lineWidth = 1
      g.beginPath()
      g.ellipse(lx, ly + 3, 6 + pulse, 3 + pulse / 2, 0, 0, Math.PI * 2)
      g.stroke()
      g.restore()
    }
    if (gr.phase === 'air') {
      const lift = Math.sin(gr.p * Math.PI) * 12
      dropShadow(g, x, y + 6, 4, 1.2, 0.25)
      drawSprite(g, HOPPER_SPRITES[0], x, y + 4 - lift, {
        anchor: 'feet',
        flipX: flip,
      })
      return
    }
    dropShadow(g, x, y + 6, 5, 1.5, 0.35)
    const crouch = gr.phase === 'tell'
    const wind = crouch && Math.floor(this.tick / 4) % 2 ? 1 : 0
    drawSprite(g, HOPPER_SPRITES[crouch ? 1 : 0], x + wind, y + 6, {
      anchor: 'feet',
      flipX: flip,
    })
  }

  /** The Grumble Cloud: a sulky rain cloud with a frown, too grumpy to bloom. */
  private renderCloud(g: CanvasRenderingContext2D) {
    const cloud = this.cloud
    if (!cloud) return
    const bob = Math.sin(this.tick / 12) * 1.5
    dropShadow(g, cloud.x, cloud.y + 9, 12, 3, 0.4)
    drawCloud(g, cloud.x, cloud.y - 8 + bob, 9, GRUMBLE_RAMP)
    g.fillStyle = INK
    g.fillRect(Math.round(cloud.x - 5), Math.round(cloud.y - 9 + bob), 2, 2)
    g.fillRect(Math.round(cloud.x + 3), Math.round(cloud.y - 9 + bob), 2, 2)
    g.fillRect(Math.round(cloud.x - 3), Math.round(cloud.y - 4 + bob), 6, 1)
    g.fillRect(Math.round(cloud.x - 4), Math.round(cloud.y - 3 + bob), 1, 1)
    g.fillRect(Math.round(cloud.x + 3), Math.round(cloud.y - 3 + bob), 1, 1)
  }

  private renderGardener(g: CanvasRenderingContext2D, gd: Gardener) {
    if (gd.down !== 0) return
    if (gd.safe > 0 && Math.floor(gd.safe / 5) % 2) return
    const { x, y } = this.pixel(gd)
    const face: Face =
      gd.facing.dy < 0 ? 'up' : gd.facing.dy > 0 ? 'down' : 'side'
    const pose = gd.p > 0 ? 1 + (Math.floor(this.tick / 6) % 2) : 0
    dropShadow(g, x, y + 7, 6, 2, 0.4)
    drawSprite(g, GARDENER_SPRITES[gd.seat]![face][pose]!, x, y + 8, {
      anchor: 'feet',
      flipX: gd.facing.dx < 0,
    })
  }

  /** Seat numbers over each gardener, drawn after the badges; beside them in the top row. */
  private renderSeatLabel(g: CanvasRenderingContext2D, gd: Gardener) {
    if (gd.down !== 0 || this.gardeners.length < 2) return
    if (gd.safe > 0 && Math.floor(gd.safe / 5) % 2) return
    const { x, y } = this.pixel(gd)
    const above = y - 17 >= HUD_H + TILE
    drawText(g, `${gd.seat + 1}`, above ? x : x + 11, above ? y - 17 : y - 4, {
      align: 'center',
      color: SEAT_RAMPS[gd.seat]![3],
      outline: INK,
    })
  }

  private renderParticles(g: CanvasRenderingContext2D) {
    const flap = Math.floor(this.tick / 5) % 2
    for (const p of this.particles) {
      const alpha = Math.max(0, Math.min(1, p.life / 30))
      const butterfly = BUTTERFLY_SPRITES.get(p.color)
      if (butterfly) drawSprite(g, butterfly[flap]!, p.x, p.y, { alpha })
      else if (p.color === LEAF_COLOUR)
        drawSprite(g, LEAF_SPRITE, p.x, p.y, { alpha, flipX: p.vx < 0 })
      else if (p.color === RAIN_COLOUR) {
        g.fillStyle = rgba(RAMPS.water[3], 0.8)
        g.fillRect(Math.round(p.x), Math.round(p.y), 1, 3)
      } else {
        g.save()
        g.globalCompositeOperation = 'lighter'
        g.globalAlpha = alpha
        g.fillStyle = p.color
        g.fillRect(Math.round(p.x) - 1, Math.round(p.y), 3, 1)
        g.fillRect(Math.round(p.x), Math.round(p.y) - 1, 1, 3)
        g.fillStyle = '#ffffff'
        g.fillRect(Math.round(p.x), Math.round(p.y), 1, 1)
        g.restore()
      }
    }
  }

  /**
   * Each gardener's badge sits on the garden wall by their home corner: their hat, the seed in
   * hand, then pods, bloom reach and shoe speed. Greyed while they wait to respawn, OUT when out.
   */
  private renderSeatBadges(g: CanvasRenderingContext2D) {
    const bw = 76
    for (const gd of this.gardeners) {
      const corner = CORNERS[gd.seat]!
      const x = corner.x < COLS / 2 ? 3 : W - 3 - bw
      const y = corner.y < ROWS / 2 ? HUD_H + 2 : H - TILE + 2
      g.save()
      if (gd.down !== 0) g.globalAlpha = 0.55
      hudPanel(g, x, y, bw, 12, gd.down < 0 ? RAMPS.night : RAMPS.purple)
      drawSprite(g, SEAT_HEADS[gd.seat]!, x + 7, y + 6)
      if (gd.down < 0)
        drawText(g, `${gd.seat + 1}P OUT`, x + 15, y + 3, {
          color: RAMPS.steel[3],
          outline: INK,
        })
      else {
        drawSprite(
          g,
          VARIETY_SPRITES[gd.pouch[gd.seed] ?? 'sunflower'],
          x + 19,
          y + 6,
        )
        const stats = [
          gd.pods,
          gd.range,
          Math.round((gd.speed - BASE_SPEED) / SHOE_SPEED) + 1,
        ]
        stats.forEach((n, i) => {
          const sx = x + 28 + i * 16
          drawSprite(g, STAT_ICONS[i]!, sx + 3, y + 6)
          drawText(g, String(n), sx + 8, y + 3, {
            color: RAMPS.cream[3],
            outline: INK,
          })
        })
      }
      g.restore()
    }
  }

  private renderHud(g: CanvasRenderingContext2D) {
    const score = String(this.score).padStart(6, '0')
    hudPanel(g, 2, 2, measureText(score, 2) + 8, 20, RAMPS.leaf)
    drawText(g, score, 6, 5, {
      scale: 2,
      color: RAMPS.gold[4],
      shadow: INK,
    })
    const left = measureText(score, 2) + 12
    const secs = Math.max(0, Math.ceil(this.timer / 60))
    const grumps = `GRUMPS ${this.grumps.length + this.bells.reduce((n, b) => n + b.kinds.length, 0)}`
    const time = this.cloud ? 'RAIN!' : `TIME ${secs}`
    const tw = Math.max(measureText(time), measureText(grumps)) + 8
    hudPanel(g, left, 2, tw, 20)
    drawText(g, time, left + 4, 4, {
      color:
        this.cloud || (secs <= 20 && this.timer > 0)
          ? RAMPS.ember[3]
          : RAMPS.sky[4],
      outline: INK,
    })
    drawText(g, grumps, left + 4, 13, {
      color: RAMPS.steel[3],
      outline: INK,
    })
    const hi = `HI ${Math.max(this.hiScore, this.score)}`
    const plot = `PLOT ${this.level}`
    const rw = Math.max(measureText(hi), measureText(plot)) + 8
    hudPanel(g, W - 2 - rw, 2, rw, 20)
    drawText(g, hi, W - 6, 4, {
      align: 'right',
      color: RAMPS.pink[3],
      outline: INK,
    })
    drawText(g, plot, W - 6, 13, {
      align: 'right',
      color: LIME[3],
      outline: INK,
    })
    // The team's spares (and any golden seeds), between the timer and the high score.
    const sl = left + tw + 2
    const sw = W - 4 - rw - sl
    const spares = Math.min(this.spares, 5)
    if (sw >= 14) {
      hudPanel(g, sl, 2, sw, 20, RAMPS.teal)
      const goldW = this.golden ? 16 : 0
      const perRow = Math.max(1, Math.floor((sw - 4 - goldW) / 10))
      if (spares === 0) drawSprite(g, SPARE_SPRITE, sl + 7, 12, { alpha: 0.3 })
      for (let i = 0; i < Math.min(spares, perRow * 2); i++)
        drawSprite(
          g,
          SPARE_SPRITE,
          sl + 7 + (i % perRow) * 10,
          8 + Math.floor(i / perRow) * 9,
        )
      if (this.golden && sw >= 30) {
        drawSprite(g, GOLDEN_SEED_SPRITE, sl + sw - 11, 8)
        drawText(g, String(this.golden), sl + sw - 11, 13, {
          align: 'center',
          color: RAMPS.gold[4],
          outline: INK,
        })
      }
    }
    if (this.banner) {
      // A dimmed band behind the banner keeps it legible over the busy garden.
      g.fillStyle = rgba(INK, 0.5)
      g.fillRect(0, 86, W, this.banner.sub ? 38 : 26)
      g.fillStyle = rgba(RAMPS.leaf[3], 0.5)
      g.fillRect(0, 86, W, 1)
      g.fillRect(0, this.banner.sub ? 123 : 111, W, 1)
      drawText(g, this.banner.text, W / 2, 92, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.leaf[1],
      })
      if (this.banner.sub)
        drawText(g, this.banner.sub, W / 2, 112, {
          align: 'center',
          color: RAMPS.gold[3],
          outline: INK,
        })
    }
  }
}

const seedBurst: ArcadeGameModule = {
  create: (options) => new SeedBurst(options),
}

export const create = seedBurst.create
export default seedBurst
