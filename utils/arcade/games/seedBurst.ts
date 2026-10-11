// /utils/arcade/games/seedBurst.ts
//
// Seed Burst -- the Kind Robots Arcade's Bomberman riff (conductor
// kr-arcade/t-009 game factory, batch 4). Gardener bots plant seed pods in a
// hedge maze. A pod bursts after a moment into a cross of blooms that clears
// the first hedge in each direction and turns any grumpy gnat it touches into
// a butterfly. Turn every gnat to clear the round. Standing in a bloom (yours
// or a partner's) or bumping a gnat costs the team a gardener.
//
// Hedges hide seed packets (+1 pod at a time), fertiliser (longer blooms) and
// quick shoes. A burst that reaches another pod sets it off too. From round 3
// some gnats drift straight through hedges, and when the round timer runs out
// a gust of wind blows in a few more. SEED_CURVES ramp the gnats and hedges.
//
// Up to four gardeners share one screen, one score and one pool of spares.
// Arrows move, A plants a pod.

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
const BLOOM_TICKS = 26
const SAFE_TICKS = 150
const RESPAWN_TICKS = 100
const CLEAR_TICKS = 150
const ROUND_TIME = 60 * 150
const WIND_GNATS = 3
const BASE_SPEED = 1
const SHOE_SPEED = 0.25
const MAX_SPEED = 2
const MAX_PODS = 6
const MAX_RANGE = 7
const TOUCH = 11
const POWER_CHANCE = 0.22

const GNAT_POINTS = 100
const HEDGE_POINTS = 10
const POWER_POINTS = 50
const ROUND_POINTS = 1000

export const SEED_CURVES = {
  /** Gnats in the round. */
  gnats: { start: 3, step: 1, limit: 10 },
  /** Gnat speed in pixels per tick. */
  gnatSpeed: { start: 0.5, step: 0.06, limit: 1.15 },
  /** Gnats that drift through hedges (from round 3). */
  ghosts: { start: 0, step: 0.5, limit: 4 },
  /** Share of free cells planted with hedges. */
  hedges: { start: 0.45, step: 0.03, limit: 0.66 },
} as const

const WALL = 1
const HEDGE = 2

type Dir = { dx: number; dy: number }
const DIRS: Dir[] = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
]
type Power = 'pod' | 'bloom' | 'shoe'
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
}
type Pod = {
  x: number
  y: number
  fuse: number
  owner: number
  range: number
  standing: Set<number>
}
type Bloom = { x: number; y: number; life: number; chain: { count: number } }
type Gnat = {
  tx: number
  ty: number
  nx: number
  ny: number
  p: number
  dir: Dir
  ghost: boolean
  speed: number
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

/** Three garden looks, taken in turn round by round: spring, deep summer, twilight. */
const GARDENS: readonly { grass: Ramp; flowers: readonly string[] }[] = [
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

const POWER_SPRITES: Record<Power, PixelSprite> = {
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

class SeedBurst implements ArcadeGameInstance {
  score = 0
  level = 1
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private grid: number[] = []
  private powers = new Map<number, Power>()
  private hidden = new Map<number, Power>()
  private gardeners: Gardener[] = []
  private spares = START_SPARES
  private pods: Pod[] = []
  private blooms: Bloom[] = []
  private gnats: Gnat[] = []
  private timer = ROUND_TIME
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
        pods: 1,
        range: 2,
        speed: BASE_SPEED,
        safe: SAFE_TICKS,
        down: 0,
      })
    this.buildRound(1)
  }

  /** Gardeners in play or waiting to respawn, plus the team's spares. */
  get lives(): number {
    return this.gardeners.filter((g) => g.down >= 0).length + this.spares
  }

  // --- the maze -------------------------------------------------------------------

  private buildRound(round: number) {
    this.level = round
    this.grid = []
    this.powers.clear()
    this.hidden.clear()
    this.pods = []
    this.blooms = []
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++) {
        const edge = x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1
        this.grid.push(edge || (x % 2 === 0 && y % 2 === 0) ? WALL : 0)
      }
    // Corners stay clear so every gardener can step out and plant.
    const clearCells = new Set<number>()
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
        const x = c.x + dx!
        const y = c.y + dy!
        if (
          x > 0 &&
          y > 0 &&
          x < COLS - 1 &&
          y < ROWS - 1 &&
          !this.grid[key(x, y)]
        )
          this.grid[key(x, y)] = HEDGE
      }
    const density = levelCurve(round, SEED_CURVES.hedges)
    for (let y = 1; y < ROWS - 1; y++)
      for (let x = 1; x < COLS - 1; x++) {
        const k = key(x, y)
        if (this.grid[k] || clearCells.has(k)) continue
        if (this.rng() < density) {
          this.grid[k] = HEDGE
          if (this.rng() < POWER_CHANCE)
            this.hidden.set(
              k,
              (['pod', 'bloom', 'shoe'] as const)[Math.floor(this.rng() * 3)]!,
            )
        }
      }
    for (const g of this.gardeners) {
      if (g.down < 0) continue
      this.placeAtCorner(g)
      g.down = 0
    }
    // Gnats start well away from every corner.
    this.gnats = []
    const count = Math.round(levelCurve(round, SEED_CURVES.gnats))
    const ghosts = Math.max(
      0,
      Math.floor(levelCurve(round, SEED_CURVES.ghosts)),
    )
    const speed = levelCurve(round, SEED_CURVES.gnatSpeed)
    const open: Array<{ x: number; y: number }> = []
    for (let y = 1; y < ROWS - 1; y++)
      for (let x = 1; x < COLS - 1; x++)
        if (
          this.grid[key(x, y)] === 0 &&
          CORNERS.every((c) => Math.abs(c.x - x) + Math.abs(c.y - y) >= 6)
        )
          open.push({ x, y })
    for (let i = 0; i < count && open.length; i++) {
      const at = open.splice(Math.floor(this.rng() * open.length), 1)[0]!
      this.gnats.push(this.newGnat(at.x, at.y, i < ghosts, speed))
    }
    this.timer = ROUND_TIME
    this.banner = {
      text: `ROUND ${round}`,
      sub: `TURN ${this.gnats.length} GNATS INTO BUTTERFLIES`,
      ticks: 110,
    }
  }

  private newGnat(x: number, y: number, ghost: boolean, speed: number): Gnat {
    return {
      tx: x,
      ty: y,
      nx: x,
      ny: y,
      p: 0,
      dir: DIRS[Math.floor(this.rng() * 4)]!,
      ghost,
      speed: ghost ? speed * 0.8 : speed,
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

  // --- update ------------------------------------------------------------------

  update(input: InputFrame, players?: InputFrame[]) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    if (this.clear > 0) {
      if (--this.clear === 0) this.buildRound(this.level + 1)
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
      this.walk(g, controls)
      if (controls.pressed.a) this.plant(g)
    }
    this.updatePods()
    this.updateBlooms()
    this.updateGnats()
    this.touchGnats()
    if (--this.timer === 0) this.windGust()
    if (this.gnats.length === 0) this.roundClear()
    else if (this.gardeners.every((g) => g.down < 0)) {
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
      if (!dir) return
      g.nx = g.tx + dir.dx
      g.ny = g.ty + dir.dy
    }
    g.p += g.speed / TILE
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

  private plant(g: Gardener) {
    const at = this.here(g)
    const mine = this.pods.filter((p) => p.owner === g.seat).length
    if (mine >= g.pods || this.podAt(at.x, at.y)) return
    const standing = new Set<number>()
    for (const other of this.gardeners) {
      if (other.down !== 0) continue
      const t = this.here(other)
      if (t.x === at.x && t.y === at.y) standing.add(other.seat)
      // Mid-step off this tile counts as standing on it too.
      if (other.tx === at.x && other.ty === at.y) standing.add(other.seat)
    }
    this.pods.push({
      x: at.x,
      y: at.y,
      fuse: FUSE,
      owner: g.seat,
      range: g.range,
      standing,
    })
    this.sound.play('blip')
  }

  private pickUp(g: Gardener) {
    const k = key(g.tx, g.ty)
    const power = this.powers.get(k)
    if (!power) return
    this.powers.delete(k)
    if (power === 'pod') g.pods = Math.min(MAX_PODS, g.pods + 1)
    else if (power === 'bloom') g.range = Math.min(MAX_RANGE, g.range + 1)
    else g.speed = Math.min(MAX_SPEED, g.speed + SHOE_SPEED)
    const px = this.pixel(g)
    this.addScore(POWER_POINTS, px.x, px.y - 12)
    this.floaters.push({
      x: px.x,
      y: px.y - 20,
      text: power === 'pod' ? '+POD' : power === 'bloom' ? '+BLOOM' : '+SPEED',
      life: 50,
    })
    this.fx.burst(px.x, px.y, this.fxRng, { count: 10 })
    this.sound.play('extra')
  }

  private updatePods() {
    for (const pod of [...this.pods]) if (--pod.fuse <= 0) this.burst(pod)
  }

  /** A pod bursts into a cross of blooms, setting off any pod it reaches. */
  private burst(pod: Pod) {
    const i = this.pods.indexOf(pod)
    if (i < 0) return
    this.pods.splice(i, 1)
    const chain = { count: 0 }
    const triggered: Pod[] = []
    this.addBloom(pod.x, pod.y, chain)
    for (const d of DIRS) {
      for (let r = 1; r <= pod.range; r++) {
        const x = pod.x + d.dx * r
        const y = pod.y + d.dy * r
        const cell = this.grid[key(x, y)]
        if (cell === WALL) break
        if (cell === HEDGE) {
          this.grid[key(x, y)] = 0
          const hidden = this.hidden.get(key(x, y))
          if (hidden) {
            this.hidden.delete(key(x, y))
            this.powers.set(key(x, y), hidden)
          }
          this.addScore(HEDGE_POINTS, x * TILE + TILE / 2, HUD_H + y * TILE)
          this.leaves(x, y)
          this.addBloom(x, y, chain)
          break
        }
        this.addBloom(x, y, chain)
        const other = this.podAt(x, y)
        if (other) {
          triggered.push(other)
          break
        }
      }
    }
    this.sound.play('boom')
    for (const other of triggered) this.burst(other)
  }

  private addBloom(x: number, y: number, chain: { count: number }) {
    const old = this.blooms.find((b) => b.x === x && b.y === y)
    if (old) old.life = BLOOM_TICKS
    else this.blooms.push({ x, y, life: BLOOM_TICKS, chain })
  }

  private updateBlooms() {
    for (const b of this.blooms) {
      b.life--
      // Gardeners caught in a bloom.
      for (const g of this.gardeners) {
        if (g.down !== 0 || g.safe > 0) continue
        const t = this.here(g)
        if (t.x === b.x && t.y === b.y)
          this.catchGardener(g, 'TANGLED IN BLOOMS')
      }
      // Gnats caught in a bloom become butterflies.
      for (const gnat of this.gnats) {
        const t = this.here(gnat)
        if (t.x !== b.x || t.y !== b.y) continue
        gnat.speed = -1
        b.chain.count++
        const points = GNAT_POINTS * 2 ** Math.min(4, b.chain.count - 1)
        const px = this.pixel(gnat)
        this.addScore(points, px.x, px.y - 12)
        this.butterflies(px.x, px.y)
        this.fx.burst(px.x, px.y, this.fxRng, {
          count: 10,
          colours: [RAMPS.pink[3], RAMPS.gold[4], RAMPS.purple[3]],
        })
        this.sound.play('pop')
      }
      this.gnats = this.gnats.filter((g) => g.speed >= 0)
    }
    this.blooms = this.blooms.filter((b) => b.life > 0)
  }

  private updateGnats() {
    for (const gnat of this.gnats) {
      if (gnat.p === 0) {
        const can = (d: Dir) => {
          const x = gnat.tx + d.dx
          const y = gnat.ty + d.dy
          const cell = this.grid[key(x, y)]
          if (
            cell === WALL ||
            x <= 0 ||
            y <= 0 ||
            x >= COLS - 1 ||
            y >= ROWS - 1
          )
            return false
          if (cell === HEDGE && !gnat.ghost) return false
          return !this.podAt(x, y)
        }
        const options = DIRS.filter(can)
        if (options.length === 0) continue
        // Mostly keep going; sometimes wander off down a side path.
        if (!can(gnat.dir) || this.rng() < 0.25) {
          const turns = options.filter(
            (d) => d.dx !== -gnat.dir.dx || d.dy !== -gnat.dir.dy,
          )
          const pool = turns.length ? turns : options
          gnat.dir = pool[Math.floor(this.rng() * pool.length)]!
        }
        gnat.nx = gnat.tx + gnat.dir.dx
        gnat.ny = gnat.ty + gnat.dir.dy
      }
      gnat.p += gnat.speed / TILE
      if (gnat.p >= 1) {
        gnat.tx = gnat.nx
        gnat.ty = gnat.ny
        gnat.p = 0
      }
    }
  }

  private touchGnats() {
    for (const g of this.gardeners) {
      if (g.down !== 0 || g.safe > 0) continue
      const a = this.pixel(g)
      for (const gnat of this.gnats) {
        const b = this.pixel(gnat)
        if (Math.abs(a.x - b.x) < TOUCH && Math.abs(a.y - b.y) < TOUCH) {
          this.catchGardener(g, 'BUMPED A GNAT')
          break
        }
      }
    }
  }

  private catchGardener(g: Gardener, why: string) {
    const px = this.pixel(g)
    this.burst2(px.x, px.y, SEAT_COLORS[g.seat]!)
    this.sound.play('die')
    if (this.spares > 0) {
      this.spares--
      g.down = RESPAWN_TICKS
    } else g.down = -1
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

  private windGust() {
    const speed = levelCurve(this.level, SEED_CURVES.gnatSpeed) * 1.3
    for (let i = 0; i < WIND_GNATS; i++) {
      const c = [
        { x: 7, y: 1 },
        { x: 7, y: ROWS - 2 },
        { x: 1, y: 6 },
      ][i]!
      this.gnats.push(this.newGnat(c.x, c.y, true, speed / 0.8))
    }
    this.sound.play('warn')
    this.banner = { text: 'WIND!', sub: 'MORE GNATS BLOW IN', ticks: 90 }
  }

  private roundClear() {
    const timeBonus = Math.max(0, Math.floor(this.timer / 60)) * 10
    const bonus = ROUND_POINTS * this.level + timeBonus
    this.addScore(bonus, W / 2, H / 2)
    this.clear = CLEAR_TICKS
    this.pods = []
    this.blooms = []
    for (let i = 0; i < 6; i++)
      this.fx.burst(
        TILE + this.fxRng() * (W - TILE * 2),
        HUD_H + TILE + this.fxRng() * (H - HUD_H - TILE * 2),
        this.fxRng,
        { count: 12, speed: 2 },
      )
    this.sound.play('level')
    this.banner = {
      text: 'ROUND CLEAR!',
      sub: `BUTTERFLIES EVERYWHERE  +${bonus}`,
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
        vx: (this.rng() - 0.5) * 2,
        vy: -this.rng() * 1.5,
        life: 24,
        color: LEAF_COLOUR,
      })
  }

  private butterflies(x: number, y: number) {
    for (let i = 0; i < 8; i++)
      this.particles.push({
        x,
        y,
        vx: (this.rng() - 0.5) * 1.6,
        vy: -0.4 - this.rng() * 1.2,
        life: 40,
        color: ['#f9a8d4', '#fde047', '#c4b5fd'][i % 3]!,
      })
  }

  private burst2(x: number, y: number, color: string) {
    for (let i = 0; i < 14; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.5 + this.rng() * 1.5
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
      p.vy += 0.02
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

  /** Tiles a pod at (x, y) would bloom over (hedges stop it). */
  private blastTiles(x: number, y: number, range: number): number[] {
    const out = [key(x, y)]
    for (const d of DIRS)
      for (let r = 1; r <= range; r++) {
        const tx = x + d.dx * r
        const ty = y + d.dy * r
        const cell = this.grid[key(tx, ty)]
        if (cell === WALL) break
        out.push(key(tx, ty))
        if (cell === HEDGE) break
      }
    return out
  }

  private dangerMap(): Set<number> {
    const danger = new Set<number>()
    for (const pod of this.pods)
      for (const k of this.blastTiles(pod.x, pod.y, pod.range)) danger.add(k)
    for (const b of this.blooms) danger.add(key(b.x, b.y))
    for (const gnat of this.gnats)
      for (const t of [
        { x: gnat.tx, y: gnat.ty },
        { x: gnat.nx, y: gnat.ny },
      ]) {
        danger.add(key(t.x, t.y))
        for (const d of DIRS) danger.add(key(t.x + d.dx, t.y + d.dy))
      }
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
   * Flees any tile a pod, bloom or gnat threatens; plants beside hedges and in
   * line with gnats when there is a safe way out; otherwise heads for the
   * nearest power-up or hedge.
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
    // Never step onto a bloom or straight into a gnat while getting away.
    const bloomNow = new Set(this.blooms.map((b) => key(b.x, b.y)))
    for (const gnat of this.gnats) {
      bloomNow.add(key(gnat.tx, gnat.ty))
      bloomNow.add(key(gnat.nx, gnat.ny))
    }
    if (danger.has(here)) {
      const out = this.route(g, (k) => !danger.has(k), bloomNow, 12)
      if (out) this.press(frame, out.dir)
      return frame
    }
    const mine = this.pods.filter((p) => p.owner === g.seat).length
    if (mine < g.pods && !this.podAt(g.tx, g.ty)) {
      const blast = this.blastTiles(g.tx, g.ty, g.range)
      const hitsHedge = blast.some((k) => this.grid[k] === HEDGE)
      const hitsGnat = this.gnats.some((gn) =>
        blast.includes(key(gn.tx, gn.ty)),
      )
      if (hitsHedge || hitsGnat) {
        const after = new Set([...danger, ...blast])
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
      this.route(
        g,
        (k) =>
          !danger.has(k) &&
          (DIRS.some((d) => this.grid[k + d.dx + d.dy * COLS] === HEDGE) ||
            this.gnats.some((gn) =>
              this.blastTiles(k % COLS, Math.floor(k / COLS), g.range).includes(
                key(gn.tx, gn.ty),
              ),
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
    cachedLayer(g, `seed-burst-field-${garden}`, W, H, (k) =>
      this.paintField(k, GARDENS[garden]!),
    )
    this.renderHedges(g)
    for (const [k, power] of this.powers) this.renderPower(g, k, power)
    for (const pod of this.pods) this.renderPod(g, pod)
    this.renderBlooms(g)
    this.renderCloudShadows(g)
    for (const gnat of this.gnats) this.renderGnat(g, gnat)
    for (const gd of this.gardeners) this.renderGardener(g, gd)
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
      (x % 2 === 0 && y % 2 === 0)
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

  private renderPower(g: CanvasRenderingContext2D, k: number, power: Power) {
    const cx = (k % COLS) * TILE + TILE / 2
    const cy = HUD_H + Math.floor(k / COLS) * TILE + TILE / 2
    const pulse = Math.sin(this.tick / 8)
    const bob = Math.round(pulse)
    glow(g, cx, cy, 13, RAMPS.gold[3], 0.4 + 0.2 * pulse)
    dropShadow(g, cx + 1, cy + 7, 6, 1.5, 0.35)
    bevel(g, cx - 7, cy - 7 + bob, 14, 13, RAMPS.purple, { depth: 2 })
    if (Math.floor(this.tick / 10) % 2) {
      g.fillStyle = RAMPS.gold[4]
      g.fillRect(cx - 7, cy - 7 + bob, 14, 1)
    }
    drawSprite(g, POWER_SPRITES[power], cx, cy + bob)
  }

  private renderPod(g: CanvasRenderingContext2D, pod: Pod) {
    const cx = pod.x * TILE + TILE / 2
    const cy = HUD_H + pod.y * TILE + TILE / 2 + 1
    const late = pod.fuse < 50
    const pulse = late
      ? Math.floor(this.tick / 4) % 2
      : Math.floor(this.tick / 12) % 2
    const r = 5 + pulse
    dropShadow(g, cx + 1, cy + 6, 6, 2, 0.4)
    if (late) glow(g, cx, cy, 14, RAMPS.ember[2], 0.35 + 0.35 * pulse)
    else glow(g, cx, cy, 10, RAMPS.gold[3], 0.18)
    shadedOrb(g, cx, cy, r, late && pulse ? RAMPS.ember : SEED)
    // Husk seams, so it reads as a seed and not a ball.
    g.fillStyle = rgba(INK, 0.45)
    g.fillRect(cx - 1, cy - r + 2, 1, r * 2 - 3)
    drawSprite(g, SPROUT_SPRITE, cx, cy - r + 1, { anchor: 'feet' })
  }

  private renderBlooms(g: CanvasRenderingContext2D) {
    if (!this.blooms.length) return
    const at = new Set(this.blooms.map((b) => key(b.x, b.y)))
    // Colour math: the glowing cross of petals the burst throws out.
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

  private renderGnat(g: CanvasRenderingContext2D, gnat: Gnat) {
    const { x, y } = this.pixel(gnat)
    const flap = Math.floor(this.tick / 4) % 2
    const hover = Math.round(Math.sin(this.tick / 9 + gnat.tx) * 1.5) - 3
    dropShadow(g, x, y + 6, 4, 1.5, 0.35)
    if (gnat.ghost) glow(g, x, y + hover, 11, RAMPS.purple[3], 0.45)
    drawSprite(
      g,
      (gnat.ghost ? GHOST_SPRITES : GNAT_SPRITES)[flap]!,
      x,
      y + hover,
      { flipX: gnat.dir.dx < 0, alpha: gnat.ghost ? 0.8 : 1 },
    )
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
      else {
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
   * Each gardener's badge sits on the garden wall by their home corner: their hat, then pods,
   * bloom reach and shoe speed. Greyed while they wait to respawn, OUT when out of the game.
   */
  private renderSeatBadges(g: CanvasRenderingContext2D) {
    const bw = 64
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
        const stats = [
          gd.pods,
          gd.range,
          Math.round((gd.speed - BASE_SPEED) / SHOE_SPEED) + 1,
        ]
        stats.forEach((n, i) => {
          const sx = x + 16 + i * 16
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
    const gnats = `GNATS ${this.gnats.length}`
    const tw = Math.max(measureText(`TIME ${secs}`), measureText(gnats)) + 8
    hudPanel(g, left, 2, tw, 20)
    drawText(g, `TIME ${secs}`, left + 4, 4, {
      color: secs <= 20 && this.timer > 0 ? RAMPS.ember[3] : RAMPS.sky[4],
      outline: INK,
    })
    drawText(g, gnats, left + 4, 13, {
      color: RAMPS.steel[3],
      outline: INK,
    })
    const hi = `HI ${Math.max(this.hiScore, this.score)}`
    const round = `ROUND ${this.level}`
    const rw = Math.max(measureText(hi), measureText(round)) + 8
    hudPanel(g, W - 2 - rw, 2, rw, 20)
    drawText(g, hi, W - 6, 4, {
      align: 'right',
      color: RAMPS.pink[3],
      outline: INK,
    })
    drawText(g, round, W - 6, 13, {
      align: 'right',
      color: LIME[3],
      outline: INK,
    })
    // The team's spares, between the timer and the high score.
    const sl = left + tw + 2
    const sw = W - 4 - rw - sl
    const spares = Math.min(this.spares, 5)
    if (sw >= 14) {
      hudPanel(g, sl, 2, sw, 20, RAMPS.teal)
      const perRow = Math.max(1, Math.floor((sw - 4) / 10))
      if (spares === 0) drawSprite(g, SPARE_SPRITE, sl + 7, 12, { alpha: 0.3 })
      for (let i = 0; i < Math.min(spares, perRow * 2); i++)
        drawSprite(
          g,
          SPARE_SPRITE,
          sl + 7 + (i % perRow) * 10,
          8 + Math.floor(i / perRow) * 9,
        )
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
