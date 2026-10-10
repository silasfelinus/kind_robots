// /utils/arcade/games/butterflyJoust.ts
//
// Butterfly Joust -- the Kind Robots Arcade's riff on the 1982 flapping
// joust (conductor kr-arcade/t-009 game factory). The teal cat-eared robot
// rides a rainbow butterfly: tap A to flap, steer left and right, and the
// edges wrap around. Touch a grumpy moth rider while you are higher and you
// bonk them: they curl into a cocoon you can scoop up for points before it
// hatches into a tougher rider. Lower loses; level bounces both apart. Fall
// into the pond and you lose a butterfly. Dawdle and a storm cloud comes
// hunting -- bonk it from above to pop it. Every fifth wave is a cocoon wave.

import { everyNthLevel, levelCurve } from '../curve'
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
  drawStars,
  dropShadow,
  glow,
  hudPanel,
  mix,
  pixelSprite,
  rgba,
  ridge,
  starField,
  vignette,
  type PixelSprite,
  type Ramp,
} from '../snes'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'

const W = 448
const H = 336
const POND_Y = 322
const CEILING = 26
const THICK = 6
const GRAVITY = 0.1
const FLAP = 1.9
const MAX_RISE = -3.2
const MAX_FALL = 3
const AIR_ACCEL = 0.06
const AIR_MAX = 2.2
const WALK_MAX = 1.4
const HALF_W = 9
const HALF_H = 8
const START_LIVES = 3
const EXTRA_LIFE_EVERY = 20_000
const AUTO_FLAP_TICKS = 10
const SURVIVOR_BONUS = 3000
/** Riders within this many pixels of the same height bounce instead of bonking. */
const LEVEL_BAND = 6

type Ledge = { x0: number; x1: number; y: number }

/** Ledge tops (y) and spans; the bottom ledge crumbles in later waves. */
export const JOUST_LEDGES: Ledge[] = [
  { x0: 70, x1: 378, y: 304 },
  { x0: -20, x1: 92, y: 226 },
  { x0: 356, x1: W + 20, y: 226 },
  { x0: 168, x1: 280, y: 196 },
  { x0: 34, x1: 138, y: 126 },
  { x0: 310, x1: 414, y: 126 },
  { x0: 186, x1: 262, y: 74 },
]

const SPAWNS = [
  { x: 224, y: 196 },
  { x: 86, y: 126 },
  { x: 362, y: 126 },
  { x: 40, y: 226 },
  { x: 408, y: 226 },
]

export const JOUST_CURVES = {
  rivals: { start: 2, step: 1, limit: 8 },
  hunterShare: { start: 0, step: 0.15, limit: 0.6 },
  shadowShare: { start: -0.16, step: 0.08, limit: 0.35 },
  riderSpeed: { start: 1.2, step: 0.08, limit: 2 },
  hatchTicks: { start: 600, step: -40, limit: 300 },
  stormAfter: { start: 60 * 45, step: -60 * 3, limit: 60 * 25 },
  stormSpeed: { start: 0.9, step: 0.06, limit: 1.5 },
  crumble: { start: -16, step: 8, limit: 56 },
} as const

/** 0 drifter, 1 hunter, 2 shadow: points, colours and smarts all step up. */
type Tier = 0 | 1 | 2
const TIER_POINTS = [500, 750, 1500]
const TIER_WINGS = ['#f87171', '#a78bfa', '#475569']
const TIER_SPEED = [0.75, 1, 1.15]
const TIER_FLAP_GAP = [16, 12, 9]

type Body = {
  x: number
  y: number
  vx: number
  vy: number
  ground: Ledge | null
  flap: number
}
type Rival = Body & {
  tier: Tier
  dir: number
  targetY: number
  retarget: number
  cooldown: number
  /** Ticks left shimmering into the world; can't be bonked meanwhile. */
  spawn: number
}
type Cocoon = {
  x: number
  y: number
  vy: number
  ground: Ledge | null
  hatch: number
  tier: Tier
}
type Storm = { x: number; y: number; t: number }
type Spark = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = { x: number; y: number; text: string; life: number }

/** Shortest signed horizontal distance from a to b on the wrapping field. */
export function wrapDx(a: number, b: number): number {
  let d = b - a
  if (d > W / 2) d -= W
  if (d < -W / 2) d += W
  return d
}

function wrapX(x: number): number {
  return ((x % W) + W) % W
}

function onLedge(l: Ledge, x: number): boolean {
  return (
    (x >= l.x0 && x <= l.x1) ||
    (x + W >= l.x0 && x + W <= l.x1) ||
    (x - W >= l.x0 && x - W <= l.x1)
  )
}

// --- 16-bit art (utils/arcade/snes.ts) -------------------------------------------

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

// Butterfly + rider, facing right on a 30x28 grid: (col 15, row 16) is the rider's (x, y), so
// the mount's feet (row 23) stand on the ledge. Wings: A leading-edge light, B outer band,
// C middle band, D inner band, E trailing shadow, s eye spot. Mount: h light, m body, M stripe,
// n shadow, H head, e eye, k antennae. Rider: r light, R base, t shadow, y eye, w glint,
// S chest, b brow. Lance: L l T.
const FOREWING_UP = [
  '...AAAA.......',
  '..ABBBBA......',
  '.ABBBBBBA.....',
  '.ABBsBBBBA....',
  'ABBsssBBBBA...',
  'ABBBsBBCCCBA..',
  'ABBBBCCCCCCBA.',
  '.EBBCCCCCCCCB.',
  '.EBCCCCDDDCCB.',
  '..ECCCDDDDDCB.',
  '..ECCDDDDDDDC.',
  '...ECDDDDDDDC.',
  '....EDDDDDDD..',
  '.....EDDDDDD..',
  '......EEDDDD..',
  '........EEDD..',
  '.........EDD..',
  '..........DD..',
]
const HINDWING_UP = [
  '..AAA....',
  '.ABBBA...',
  'ABCCCBA..',
  'ACCsCCBA.',
  'ECCCCDDB.',
  '.ECDDDDDA',
  '..EEDDDDD',
  '....EEDDD',
  '......EDD',
]
const FOREWING_DOWN = [
  '...........AA..',
  '........AABBBA.',
  '.....AABBBCCCB.',
  '..AABBBCCCDDDD.',
  '.ABBsBCCCDDDDD.',
  'ABBsssCCDDDDD..',
  'ABBBsCCDDDDE...',
  '.EBBCCDDDEE....',
  '..EEBCDEE......',
  '....EEE........',
]
const MOUNT = [
  '......................k.',
  '.....................k.k',
  '....................k...',
  '...................k....',
  '..hhhhhhhhhhhhhhhhHHH...',
  '.hmmMmmMmmMhhhhmmmHHeH..',
  'hmmMmmMmmMmmmmmmmmHHHH..',
  '.nnnnnnnnnnnnnnnnnnnn...',
  '...n.n.n.......n..n.....',
]
const PLAYER_RIDER = [
  '.r...r...',
  '.rR..rR..',
  '.rRRRRRr.',
  'rRRRRRRRt',
  'rRRRRyyRt',
  'rRRRRywRt',
  'rRRRRRRRt',
  '.tttttttt',
  '..rRRRRt.',
  '..rRSSRt.',
  '..rRSSRRR',
  '..rRRRRt.',
  '..tttttt.',
]
const MOTH_RIDER = [
  'k.....k..',
  '.k...k...',
  '.rRRRRRr.',
  'rRRRRRRRt',
  'rRRRbbbRt',
  'rRRRRyyRt',
  'rRRRRRRRt',
  '.tttttttt',
  '..rRRRRt.',
  '..rRSSRt.',
  '..rRSSRRR',
  '..rRRRRt.',
  '..tttttt.',
]
const LANCE = ['LLLLLLLLT', 'lllllllT.']

type Frames = readonly [PixelSprite, PixelSprite]

function riderPalette(
  wing: readonly [string, string, string, string, string, string],
  body: Ramp,
  eye: string,
  chest: string,
  mount: readonly [string, string, string, string, string, string, string],
): Record<string, string> {
  return {
    A: wing[0],
    B: wing[1],
    C: wing[2],
    D: wing[3],
    E: wing[4],
    s: wing[5],
    h: mount[0],
    m: mount[1],
    M: mount[2],
    n: mount[3],
    H: mount[4],
    e: mount[5],
    k: mount[6],
    r: body[3],
    R: body[2],
    t: body[1],
    y: eye,
    w: '#ffffff',
    S: chest,
    b: INK,
    L: RAMPS.steel[4],
    l: RAMPS.steel[2],
    T: RAMPS.gold[3],
  }
}

/** [wings up, wings down (the near wing sweeps in front of the mount)], facing right. */
function riderFrames(
  rider: readonly string[],
  palette: Record<string, string>,
): Frames {
  const up = compose(30, 28, [
    [0, 11, HINDWING_UP],
    [3, 1, FOREWING_UP],
    [3, 15, MOUNT],
    [12, 6, rider],
    [20, 15, LANCE],
  ])
  const down = compose(30, 28, [
    [3, 15, MOUNT],
    [0, 18, FOREWING_DOWN],
    [12, 6, rider],
    [20, 15, LANCE],
  ])
  return [pixelSprite(up, palette), pixelSprite(down, palette)]
}

const RAINBOW_WINGS = [
  RAMPS.pink[4],
  RAMPS.pink[2],
  RAMPS.gold[2],
  RAMPS.teal[2],
  RAMPS.purple[1],
  RAMPS.gold[4],
] as const

const PLAYER_FRAMES = riderFrames(
  PLAYER_RIDER,
  riderPalette(RAINBOW_WINGS, RAMPS.teal, RAMPS.gold[4], RAMPS.gold[3], [
    RAMPS.purple[3],
    RAMPS.night[3],
    RAMPS.gold[3],
    RAMPS.night[1],
    RAMPS.purple[2],
    '#ffffff',
    RAMPS.gold[3],
  ]),
)

const MOTH_MOUNT = [
  RAMPS.night[4],
  RAMPS.night[2],
  RAMPS.steel[1],
  RAMPS.night[0],
  RAMPS.night[3],
  RAMPS.ember[3],
  RAMPS.steel[2],
] as const

/** Moth riders by tier: drifter (red), hunter (violet), shadow (slate with red eye spots). */
const RIVAL_FRAMES: readonly Frames[] = [
  riderFrames(
    MOTH_RIDER,
    riderPalette(
      [
        RAMPS.rust[4],
        RAMPS.ember[2],
        RAMPS.rust[3],
        RAMPS.ember[1],
        RAMPS.ember[0],
        RAMPS.gold[3],
      ],
      RAMPS.pink,
      RAMPS.ember[2],
      RAMPS.pink[4],
      MOTH_MOUNT,
    ),
  ),
  riderFrames(
    MOTH_RIDER,
    riderPalette(
      [
        RAMPS.purple[4],
        RAMPS.purple[2],
        RAMPS.purple[3],
        RAMPS.purple[1],
        RAMPS.purple[0],
        RAMPS.pink[3],
      ],
      RAMPS.purple,
      RAMPS.ember[2],
      RAMPS.purple[4],
      MOTH_MOUNT,
    ),
  ),
  riderFrames(
    MOTH_RIDER,
    riderPalette(
      [
        RAMPS.steel[3],
        RAMPS.steel[1],
        RAMPS.steel[2],
        RAMPS.night[2],
        RAMPS.night[0],
        RAMPS.ember[2],
      ],
      RAMPS.steel,
      RAMPS.ember[3],
      RAMPS.steel[4],
      MOTH_MOUNT,
    ),
  ),
]

/** A little front-view butterfly for the lives box. */
const LIFE_SPRITE = pixelSprite(
  [
    '.AA...AA.',
    'ABBA.ABBA',
    'ABCCmCCBA',
    '.BCDmDCB.',
    '..DDmDD..',
    '.EDE.EDE.',
    '.EE...EE.',
  ],
  {
    A: RAINBOW_WINGS[0],
    B: RAINBOW_WINGS[1],
    C: RAINBOW_WINGS[2],
    D: RAINBOW_WINGS[3],
    E: RAINBOW_WINGS[4],
    m: RAMPS.night[3],
  },
)

const COCOON_ROWS = [
  '...cc...',
  '..hccd..',
  '.hcCCcd.',
  '.hccccd.',
  'hcCCcccd',
  'hccccccd',
  'hccCCccd',
  '.hccccd.',
  '.hcCCcd.',
  '..cccd..',
  '...dd...',
]
/** The same cocoon with its top half leaning a pixel right (flip for left): a wiggle, not a rotation. */
const COCOON_LEAN_ROWS = COCOON_ROWS.map((row, i) =>
  i < 5 ? `.${row}` : `${row}.`,
)
function cocoonSprites(ramp: Ramp): readonly [PixelSprite, PixelSprite] {
  const palette = { h: ramp[4], c: ramp[3], C: ramp[2], d: ramp[1] }
  return [
    pixelSprite(COCOON_ROWS, palette),
    pixelSprite(COCOON_LEAN_ROWS, palette),
  ]
}
const COCOON_SPRITES = cocoonSprites(RAMPS.leaf)
const COCOON_WARN_SPRITES = cocoonSprites(RAMPS.gold)

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

const SUN = { x: 318, y: 284, r: 38 }
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

const STORM_RAMP: Ramp = ['#0a0818', '#1a1433', '#2c2650', '#46427a', '#6e6aa4']
const STORM_FLASH: Ramp = [
  '#1a1433',
  '#3b3a6a',
  '#6a6ea0',
  '#a8b0dc',
  '#e6eaff',
]
/** drawCloud's puffs, so the storm can wear an ink silhouette under them. */
const STORM_PUFFS: readonly (readonly [number, number, number])[] = [
  [-1.1, 0.25, 0.55],
  [-0.45, -0.15, 0.75],
  [0.35, -0.3, 0.85],
  [1.05, 0.15, 0.6],
  [0, 0.35, 0.7],
]

/** A storm cloud: drawCloud's shaded puffs over an ink outline, so it reads as an actor. */
function stormCloud(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  ramp: Ramp,
) {
  g.fillStyle = INK
  for (const [dx, dy, k] of STORM_PUFFS) {
    const r = size * k
    g.beginPath()
    g.arc(x + dx * size, y + dy * size + r * 0.12, r + 1.5, 0, Math.PI * 2)
    g.fill()
  }
  drawCloud(g, x, y, size, ramp)
}

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
function paintLedge(k: CanvasRenderingContext2D, l: Ledge) {
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

class ButterflyJoust implements ArcadeGameInstance {
  score = 0
  level = 0
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private player: Body & { facing: number } = {
    x: W / 2,
    y: 304 - HALF_H,
    vx: 0,
    vy: 0,
    ground: null,
    flap: 0,
    facing: 1,
  }
  private autoFlap = 0
  private alive = true
  private respawn = 0
  private invuln = 0
  private rivals: Rival[] = []
  private cocoons: Cocoon[] = []
  private storm: Storm | null = null
  private sparks: Spark[] = []
  private floaters: Floater[] = []
  private ledges: Ledge[] = JOUST_LEDGES.map((l) => ({ ...l }))
  private waveTicks = 0
  private collected = 0
  private diedThisWave = false
  private clearing = 0
  private cocoonWave = false
  private overTimer = 0
  private nextExtra = EXTRA_LIFE_EVERY
  private banner: { text: string; sub?: string; ticks: number } | null = null
  // Cosmetic sparkles roll their own dice, so the game's seeded rng is untouched.
  private fx = new Sparkles()
  private fxRng = backdropRng(53)

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.startWave(1)
  }

  // --- setup ------------------------------------------------------------------

  private startWave(wave: number) {
    this.level = wave
    this.rivals = []
    this.cocoons = []
    this.storm = null
    this.waveTicks = 0
    this.collected = 0
    this.diedThisWave = false
    this.clearing = 0
    // The bottom ledge crumbles in from both ends as the waves go on.
    const crumble = Math.max(0, levelCurve(wave, JOUST_CURVES.crumble))
    this.ledges = JOUST_LEDGES.map((l, i) =>
      i === 0 ? { ...l, x0: l.x0 + crumble, x1: l.x1 - crumble } : { ...l },
    )
    this.cocoonWave = everyNthLevel(wave, 5)
    if (this.cocoonWave) {
      // Cocoon wave: scoop them all up before they hatch.
      const hatch = Math.round(levelCurve(wave, JOUST_CURVES.hatchTicks)) + 480
      for (let i = 0; i < 8; i++) {
        const ledge = this.ledges[1 + (i % (this.ledges.length - 1))]!
        const span = ledge.x1 - ledge.x0
        const x = wrapX(ledge.x0 + span * (0.25 + (0.5 * ((i * 37) % 7)) / 7))
        this.cocoons.push({
          x,
          y: ledge.y - 5,
          vy: 0,
          ground: ledge,
          hatch: hatch + i * 30,
          tier: 0,
        })
      }
      this.banner = {
        text: 'COCOON WAVE!',
        sub: 'SCOOP THEM ALL UP',
        ticks: 120,
      }
    } else {
      const count = Math.floor(levelCurve(wave, JOUST_CURVES.rivals))
      const hunters = levelCurve(wave, JOUST_CURVES.hunterShare)
      const shadows = Math.max(0, levelCurve(wave, JOUST_CURVES.shadowShare))
      for (let i = 0; i < count; i++) {
        const roll = this.rng()
        const tier: Tier = roll < shadows ? 2 : roll < shadows + hunters ? 1 : 0
        this.addRival(tier, i * 40)
      }
      this.banner = { text: `WAVE ${wave}`, ticks: 90 }
    }
    this.placePlayer()
  }

  private addRival(tier: Tier, delay = 0, at?: { x: number; y: number }) {
    const spot = at ?? SPAWNS[Math.floor(this.rng() * SPAWNS.length)]!
    this.rivals.push({
      x: spot.x,
      y: spot.y - HALF_H,
      vx: 0,
      vy: 0,
      ground: null,
      flap: 0,
      tier,
      dir: this.rng() < 0.5 ? -1 : 1,
      targetY: 120,
      retarget: 0,
      cooldown: 20,
      spawn: 50 + delay,
    })
  }

  private placePlayer() {
    const p = this.player
    const bottom = this.ledges[0]!
    Object.assign(p, {
      x: (bottom.x0 + bottom.x1) / 2,
      y: bottom.y - HALF_H,
      vx: 0,
      vy: 0,
      ground: bottom,
      flap: 0,
      facing: 1,
    })
    this.invuln = 120
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    if (this.lives <= 0 && !this.alive) {
      if (++this.overTimer > 100) this.over = true
      return
    }
    if (this.clearing > 0) {
      if (--this.clearing <= 0) this.startWave(this.level + 1)
      return
    }
    if (!this.alive) {
      if (--this.respawn <= 0) {
        this.alive = true
        this.placePlayer()
      }
      this.moveRivals()
      this.moveCocoons()
      return
    }

    this.waveTicks++
    const controls = this.demo ? this.demoInput() : input
    this.movePlayer(controls)
    this.moveRivals()
    this.moveCocoons()
    this.moveStorm()
    this.collide()
    this.checkWave()
  }

  private flapBody(b: Body) {
    b.vy = Math.max(MAX_RISE, b.vy - FLAP)
    b.ground = null
    b.flap = 8
  }

  /** Gravity, ledges, ceiling and wrap for any flier. Returns true if it fell in the pond. */
  private physics(b: Body, maxSpeed: number): boolean {
    if (b.flap > 0) b.flap--
    if (b.ground) {
      b.vx = Math.max(-WALK_MAX, Math.min(WALK_MAX, b.vx))
      b.x = wrapX(b.x + b.vx)
      if (!onLedge(b.ground, b.x)) b.ground = null
      else {
        b.y = b.ground.y - HALF_H
        b.vy = 0
        return false
      }
    }
    b.vx = Math.max(-maxSpeed, Math.min(maxSpeed, b.vx * 0.995))
    b.vy = Math.min(MAX_FALL, b.vy + GRAVITY)
    const prevTop = b.y - HALF_H
    const prevBottom = b.y + HALF_H
    b.x = wrapX(b.x + b.vx)
    b.y += b.vy
    for (const l of this.ledges) {
      if (!onLedge(l, b.x)) continue
      if (b.vy >= 0 && prevBottom <= l.y && b.y + HALF_H >= l.y) {
        b.y = l.y - HALF_H
        b.vy = 0
        b.ground = l
      } else if (
        b.vy < 0 &&
        prevTop >= l.y + THICK &&
        b.y - HALF_H <= l.y + THICK
      ) {
        b.y = l.y + THICK + HALF_H
        b.vy = 0.6
      }
    }
    if (b.y - HALF_H < CEILING) {
      b.y = CEILING + HALF_H
      b.vy = Math.abs(b.vy) * 0.4
    }
    return b.y > POND_Y
  }

  private movePlayer(input: InputFrame) {
    const p = this.player
    if (this.invuln > 0) this.invuln--
    let dx = 0
    if (input.held.left) dx -= 1
    if (input.held.right) dx += 1
    if (dx) p.facing = dx
    if (p.ground) {
      p.vx = dx ? p.vx + dx * 0.15 : p.vx * 0.8
    } else if (dx) {
      p.vx += dx * AIR_ACCEL
    }
    // Tap A to flap; holding A keeps flapping at a steady beat for touch players.
    if (this.autoFlap > 0) this.autoFlap--
    if (input.pressed.a || (input.held.a && this.autoFlap === 0)) {
      this.flapBody(p)
      this.autoFlap = AUTO_FLAP_TICKS
      if (this.tick % 2 === 0) this.sound.play('blip')
    }
    if (this.physics(p, AIR_MAX)) this.splash(p.x)
  }

  private moveRivals() {
    const p = this.player
    const speed = levelCurve(this.level, JOUST_CURVES.riderSpeed)
    for (const r of this.rivals) {
      if (r.spawn > 0) {
        r.spawn--
        continue
      }
      if (--r.retarget <= 0) {
        r.retarget = 60 + Math.floor(this.rng() * 60)
        if (r.tier === 0) {
          r.targetY = 60 + this.rng() * 200
          if (this.rng() < 0.25) r.dir = -r.dir
        }
      }
      if (r.tier > 0 && this.alive) {
        // Hunters chase your height; shadows try to get above you.
        r.targetY = p.y - (r.tier === 2 ? 28 : 6)
        const toward = Math.sign(wrapDx(r.x, p.x)) || r.dir
        if (r.retarget % 20 === 0) r.dir = toward
      }
      const max = speed * TIER_SPEED[r.tier]!
      r.vx += r.dir * (r.ground ? 0.15 : 0.05)
      if (r.cooldown > 0) r.cooldown--
      const wantsUp = r.y > r.targetY + 4 || (r.y > POND_Y - 50 && r.vy > 0)
      if (wantsUp && r.cooldown === 0) {
        this.flapBody(r)
        r.cooldown = TIER_FLAP_GAP[r.tier]! + Math.floor(this.rng() * 6)
      }
      if (this.physics(r, max)) {
        r.spawn = -1
        this.burst(r.x, POND_Y, 10, '#7dd3fc')
        this.sound.play('pop')
      }
    }
    this.rivals = this.rivals.filter((r) => r.spawn >= 0)
  }

  private moveCocoons() {
    for (const c of this.cocoons) {
      c.hatch--
      if (c.ground) {
        if (!onLedge(c.ground, c.x)) c.ground = null
      } else {
        const prev = c.y
        c.vy = Math.min(MAX_FALL, c.vy + GRAVITY)
        c.y += c.vy
        for (const l of this.ledges) {
          if (onLedge(l, c.x) && prev + 5 <= l.y && c.y + 5 >= l.y) {
            c.y = l.y - 5
            c.vy = 0
            c.ground = l
          }
        }
      }
      if (c.hatch === 60) this.sound.play('warn')
      if (c.hatch <= 0) {
        // Out pops a tougher rider.
        const tier = Math.min(2, c.tier + 1) as Tier
        this.addRival(tier, -20, { x: c.x, y: c.y + 5 })
        c.hatch = -999
      }
    }
    this.cocoons = this.cocoons.filter((c) => c.hatch > -999 && c.y < POND_Y)
  }

  private moveStorm() {
    const after = levelCurve(this.level, JOUST_CURVES.stormAfter)
    if (
      !this.storm &&
      !this.cocoonWave &&
      this.waveTicks === Math.round(after)
    ) {
      this.storm = { x: this.rng() < 0.5 ? -20 : W + 20, y: 40, t: 0 }
      this.banner = { text: 'STORM CLOUD!', sub: 'DONT DAWDLE', ticks: 90 }
      this.sound.play('warn')
    }
    const s = this.storm
    if (!s) return
    s.t++
    const speed = levelCurve(this.level, JOUST_CURVES.stormSpeed)
    const p = this.player
    const dx = wrapDx(s.x, p.x)
    const dy = p.y - s.y
    const len = Math.hypot(dx, dy) || 1
    s.x = wrapX(s.x + (dx / len) * speed)
    s.y += (dy / len) * speed + Math.sin(s.t / 12) * 0.4
  }

  private collide() {
    const p = this.player
    // Storm cloud: deadly, unless you bonk it from above.
    const s = this.storm
    if (s && Math.abs(wrapDx(p.x, s.x)) < 22 && Math.abs(p.y - s.y) < 18) {
      if (p.y < s.y - 8 && p.vy > 0) {
        this.addScore(2000, s.x, s.y - 16)
        this.burst(s.x, s.y, 30, '#93c5fd')
        this.fx.burst(s.x, s.y, this.fxRng, {
          count: 18,
          speed: 2.2,
          colours: [RAMPS.sky[4], RAMPS.gold[4], RAMPS.teal[3]],
        })
        this.sound.play('boom')
        this.storm = null
        p.vy = -2.5
      } else if (this.invuln <= 0) {
        this.loseLife()
        return
      }
    }
    for (const r of this.rivals) {
      if (r.spawn > 0) continue
      const dx = wrapDx(p.x, r.x)
      const dy = r.y - p.y
      if (Math.abs(dx) > HALF_W * 2 - 2 || Math.abs(dy) > HALF_H * 2 - 2)
        continue
      if (Math.abs(dy) < LEVEL_BAND) {
        // Level joust: both bounce apart.
        const push = Math.sign(dx) || 1
        p.vx = -push * 2
        r.vx = push * 2
        r.dir = push
        this.sound.play('blip')
      } else if (dy > 0) {
        this.bonk(r)
      } else if (this.invuln <= 0) {
        this.loseLife()
        return
      }
    }
    for (let i = this.cocoons.length - 1; i >= 0; i--) {
      const c = this.cocoons[i]!
      if (Math.abs(wrapDx(p.x, c.x)) < 13 && Math.abs(c.y - p.y) < 14) {
        this.cocoons.splice(i, 1)
        this.collected++
        let points = Math.min(1000, 250 * this.collected)
        if (!c.ground) points += 500
        this.addScore(points, c.x, c.y - 12)
        this.fx.burst(c.x, c.y, this.fxRng, {
          count: 8,
          colours: [RAMPS.leaf[4], RAMPS.gold[4], RAMPS.pink[3]],
        })
        this.sound.play('pickup')
      }
    }
  }

  private bonk(r: Rival) {
    this.rivals = this.rivals.filter((other) => other !== r)
    this.addScore(TIER_POINTS[r.tier]!, r.x, r.y - 14)
    this.burst(r.x, r.y, 14, TIER_WINGS[r.tier]!)
    this.fx.burst(r.x, r.y, this.fxRng, { count: 12 })
    this.sound.play('shoot')
    this.player.vy = Math.min(this.player.vy, -1.2)
    this.cocoons.push({
      x: r.x,
      y: r.y,
      vy: -1,
      ground: null,
      hatch: Math.round(levelCurve(this.level, JOUST_CURVES.hatchTicks)),
      tier: r.tier,
    })
  }

  private splash(x: number) {
    this.burst(x, POND_Y, 16, '#7dd3fc')
    this.loseLife(true)
  }

  private loseLife(splashed = false) {
    if (!this.alive) return
    this.alive = false
    this.lives--
    this.diedThisWave = true
    this.respawn = 90
    if (!splashed) this.burst(this.player.x, this.player.y, 24, '#5eead4')
    this.sound.play('die')
    if (this.lives <= 0) this.banner = { text: 'GAME OVER', ticks: 9999 }
  }

  private checkWave() {
    if (this.rivals.length || this.cocoons.length) return
    if (!this.diedThisWave && !this.cocoonWave) {
      this.addScore(SURVIVOR_BONUS, W / 2, 150)
      this.banner = { text: 'WAVE CLEAR!', sub: 'SURVIVOR BONUS', ticks: 90 }
    } else {
      this.banner = { text: 'WAVE CLEAR!', ticks: 90 }
    }
    this.sound.play('level')
    this.fx.burst(this.player.x, this.player.y, this.fxRng, { count: 16 })
    this.storm = null
    this.clearing = 90
  }

  private addScore(points: number, x?: number, y?: number) {
    if (this.demo) return
    this.score += points
    if (x !== undefined && y !== undefined) {
      this.floaters.push({ x, y, text: String(points), life: 50 })
    }
    if (this.score >= this.nextExtra) {
      this.lives++
      this.nextExtra += EXTRA_LIFE_EVERY
      this.sound.play('extra')
      this.fx.burst(this.player.x, this.player.y, this.fxRng, { count: 14 })
      this.banner = { text: 'EXTRA BUTTERFLY!', ticks: 90 }
    }
  }

  private burst(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.5 + this.rng() * 2
      this.sparks.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 25 + Math.floor(this.rng() * 20),
        color,
      })
    }
  }

  private updateEffects() {
    this.fx.update()
    for (const s of this.sparks) {
      s.x += s.vx
      s.y += s.vy
      s.vy += 0.05
      s.life--
    }
    this.sparks = this.sparks.filter((s) => s.life > 0)
    for (const f of this.floaters) {
      f.y -= 0.35
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
  }

  // --- attract-mode pilot --------------------------------------------------------

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
    const p = this.player
    let goalX = W / 2
    let goalY = 140
    const s = this.storm
    const cocoon = this.cocoons
      .slice()
      .sort(
        (a, b) => Math.abs(wrapDx(p.x, a.x)) - Math.abs(wrapDx(p.x, b.x)),
      )[0]
    // Prefer riders level with or below us: the ones above are the danger.
    const cost = (r: Rival) =>
      Math.abs(wrapDx(p.x, r.x)) + Math.max(0, p.y - r.y) * 1.5
    const rival = this.rivals
      .filter((r) => r.spawn <= 0)
      .sort((a, b) => cost(a) - cost(b))[0]
    if (s && Math.abs(wrapDx(p.x, s.x)) < 90 && Math.abs(s.y - p.y) < 70) {
      // Get above the storm and drop on it.
      goalX = s.x
      goalY = s.y - 34
    } else if (cocoon && (!rival || cocoon.hatch < 200)) {
      goalX = cocoon.x
      goalY = cocoon.y - 4
    } else if (rival) {
      goalX = rival.x
      goalY = rival.y - 22
    }
    // Back away from any rider bearing down from above.
    const threat = this.rivals.find(
      (r) =>
        r.spawn <= 0 &&
        r.y < p.y - 3 &&
        p.y - r.y < 70 &&
        Math.abs(wrapDx(p.x, r.x)) < 50,
    )
    if (threat) goalX = wrapX(p.x - Math.sign(wrapDx(p.x, threat.x)) * 60)
    const dx = wrapDx(p.x, goalX)
    if (dx < -6) held.left = true
    else if (dx > 6) held.right = true
    const low = p.y > goalY + 4 || (p.y > POND_Y - 60 && !p.ground)
    if (low && !threat && p.vy > -1 && this.tick % 4 === 0) {
      frame.pressed.a = true
    }
    return frame
  }

  // --- render ------------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    this.renderSky(g)
    this.renderLedges(g)
    this.renderPond(g)
    for (const c of this.cocoons)
      this.wrapDraw(c.x, (x) => this.renderCocoon(g, c, x))
    for (const r of this.rivals)
      this.wrapDraw(r.x, (x) => this.renderRival(g, r, x))
    if (
      this.alive &&
      !(this.invuln > 0 && Math.floor(this.invuln / 6) % 2 === 0)
    ) {
      const p = this.player
      this.wrapDraw(p.x, (x) =>
        this.renderRider(g, x, p.y, p.facing, p.flap, p.ground, PLAYER_FRAMES),
      )
    }
    if (this.storm) this.wrapDraw(this.storm.x, (x) => this.renderStorm(g, x))
    this.renderSparks(g)
    this.fx.render(g)
    for (const f of this.floaters) {
      drawText(g, f.text, f.x, f.y, {
        align: 'center',
        color: RAMPS.gold[3],
        outline: INK,
      })
    }
    vignette(g, W, H, 0.3)
    this.renderHud(g)
  }

  /** Draw something twice when it straddles the wrapping edge. */
  private wrapDraw(x: number, draw: (x: number) => void) {
    draw(x)
    if (x < 24) draw(x + W)
    if (x > W - 24) draw(x - W)
  }

  private renderSky(g: CanvasRenderingContext2D) {
    // Banded dusk sky with the setting sun, painted once.
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
    drawStars(g, STARS, this.tick, RAMPS.gold)
    for (const c of CLOUDS) {
      const x = ((c.x + this.tick * c.speed) % (W + 80)) - 40
      drawCloud(g, x, c.y, c.size, DUSK_CLOUD)
    }
    // Two parallax ridges drifting past the sun.
    drawRidge(g, FAR_RIDGE, {
      base: 300,
      bottom: POND_Y,
      width: W,
      offset: this.tick * 0.05,
      fill: FAR_FILL,
      rim: FAR_RIM,
    })
    drawRidge(g, NEAR_RIDGE, {
      base: 318,
      bottom: POND_Y,
      width: W,
      offset: this.tick * 0.14,
      step: 3,
      fill: RAMPS.night[2],
      rim: RAMPS.purple[1],
    })
  }

  private renderLedges(g: CanvasRenderingContext2D) {
    // The bottom ledge crumbles wave by wave, so its span is part of the key.
    const bottom = this.ledges[0]!
    cachedLayer(
      g,
      `butterfly-joust-ledges-${bottom.x0}-${bottom.x1}`,
      W,
      H,
      (k) => {
        for (const l of this.ledges) paintLedge(k, l)
      },
    )
  }

  private renderPond(g: CanvasRenderingContext2D) {
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
    // The sun's glitter path on the water.
    g.save()
    g.globalCompositeOperation = 'lighter'
    for (let i = 0; i < 5; i++) {
      const y = POND_Y + 2 + i * 2
      const half = Math.round(
        SUN.r * 0.5 - i * 3 + Math.sin(this.tick / 9 + i * 1.7) * 3,
      )
      g.fillStyle = rgba(RAMPS.gold[3], 0.55 - i * 0.08)
      g.fillRect(SUN.x - half, y, half * 2, 1)
    }
    g.restore()
    for (let x = 0; x < W; x += 16) {
      const y = Math.round(POND_Y + 3 + Math.sin((x + this.tick) / 10) * 1.5)
      g.fillStyle = RAMPS.water[4]
      g.fillRect(x + 2, y, 6, 1)
      g.fillStyle = RAMPS.water[3]
      g.fillRect(x + 8, y, 3, 1)
      g.fillStyle = RAMPS.water[0]
      g.fillRect(x + 3, y + 1, 7, 1)
    }
  }

  /** A shadow on the ledge below a rider, fading as they fly higher above it. */
  private renderShadow(
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    ground: Ledge | null,
  ) {
    let top = ground ? ground.y : Infinity
    if (!ground) {
      for (const l of this.ledges) {
        if (l.y >= y + HALF_H && l.y < top && onLedge(l, wrapX(x))) top = l.y
      }
    }
    const gap = top - (y + HALF_H)
    if (gap > 64) return
    const k = 1 - gap / 64
    dropShadow(g, x, top, 4 + 6 * k, 1 + k, 0.4 * k)
  }

  private renderRider(
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    facing: number,
    flap: number,
    ground: Ledge | null,
    frames: Frames,
    alpha?: number,
  ) {
    const up = flap > 4 || Math.floor(this.tick / 8) % 2 === 0
    if (alpha === undefined) this.renderShadow(g, x, y, ground)
    drawSprite(
      g,
      up ? frames[0] : frames[1],
      Math.round(x) - 16,
      Math.round(y) - 17,
      { anchor: 'topleft', flipX: facing < 0, alpha },
    )
  }

  private renderRival(g: CanvasRenderingContext2D, r: Rival, x: number) {
    let alpha: number | undefined
    if (r.spawn > 0) {
      // Shimmering into the world.
      alpha = 0.3 + 0.3 * Math.sin(this.tick / 3)
      glow(g, x, r.y - 4, 22, RAMPS.purple[3], 0.35)
    }
    this.renderRider(
      g,
      x,
      r.y,
      Math.sign(r.vx) || r.dir,
      r.flap,
      r.ground,
      RIVAL_FRAMES[r.tier]!,
      alpha,
    )
  }

  private renderCocoon(g: CanvasRenderingContext2D, c: Cocoon, x: number) {
    const wiggle =
      c.hatch < 120 ? Math.sin(this.tick / (c.hatch < 60 ? 1.5 : 3)) : 0
    const warn = c.hatch < 60 && Math.floor(this.tick / 5) % 2 === 1
    const sprites = warn ? COCOON_WARN_SPRITES : COCOON_SPRITES
    if (c.ground) dropShadow(g, x, c.ground.y + 1, 5, 1.5, 0.4)
    if (c.hatch < 120) {
      glow(g, x, c.y, 13, warn ? RAMPS.gold[3] : RAMPS.leaf[3], 0.35)
    }
    drawSprite(g, Math.abs(wiggle) > 0.35 ? sprites[1] : sprites[0], x, c.y, {
      flipX: wiggle < 0,
    })
  }

  private renderStorm(g: CanvasRenderingContext2D, x: number) {
    const s = this.storm!
    const bolt = Math.floor(s.t / 10) % 4 === 0
    const y = Math.round(s.y)
    glow(g, x, y, 42, bolt ? RAMPS.gold[3] : RAMPS.purple[2], bolt ? 0.5 : 0.28)
    // Rain streaking out of its belly.
    g.fillStyle = rgba(RAMPS.water[3], 0.75)
    for (let i = 0; i < 7; i++) {
      const ry = (this.tick * 1.5 + i * 11) % 18
      g.fillRect(Math.round(x - 18 + i * 6), Math.round(y + 10 + ry), 1, 3)
    }
    stormCloud(g, x, y, 14, bolt ? STORM_FLASH : STORM_RAMP)
    // Angry slanted brows over glowing eyes, and a scowl.
    const cx = Math.round(x)
    glow(g, cx, y - 2, 12, RAMPS.gold[3], 0.4)
    g.fillStyle = INK
    g.fillRect(cx - 9, y - 5, 5, 4)
    g.fillRect(cx + 4, y - 5, 5, 4)
    g.fillRect(cx - 9, y - 8, 2, 1)
    g.fillRect(cx - 7, y - 7, 2, 1)
    g.fillRect(cx - 5, y - 6, 2, 1)
    g.fillRect(cx + 7, y - 8, 2, 1)
    g.fillRect(cx + 5, y - 7, 2, 1)
    g.fillRect(cx + 3, y - 6, 2, 1)
    g.fillRect(cx - 3, y + 3, 6, 1)
    g.fillRect(cx - 4, y + 4, 1, 1)
    g.fillRect(cx + 3, y + 4, 1, 1)
    g.fillStyle = RAMPS.gold[4]
    g.fillRect(cx - 8, y - 4, 3, 2)
    g.fillRect(cx + 5, y - 4, 3, 2)
    g.fillStyle = '#ffffff'
    g.fillRect(cx - 8, y - 4, 1, 1)
    g.fillRect(cx + 5, y - 4, 1, 1)
    if (bolt) {
      const path: [number, number][] = [
        [x, y + 10],
        [x - 4, y + 18],
        [x + 2, y + 18],
        [x - 3, y + 28],
      ]
      glow(g, x - 1, y + 20, 20, RAMPS.gold[4], 0.7)
      g.save()
      g.lineJoin = 'miter'
      const strokes: [number, string][] = [
        [4, INK],
        [2, RAMPS.gold[3]],
        [1, '#ffffff'],
      ]
      for (const [width, colour] of strokes) {
        g.lineWidth = width
        g.strokeStyle = colour
        g.beginPath()
        path.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py)))
        g.stroke()
      }
      g.restore()
    }
  }

  /** The bonk and splash bursts: additive pixels with a hot white core. */
  private renderSparks(g: CanvasRenderingContext2D) {
    g.save()
    g.globalCompositeOperation = 'lighter'
    for (const s of this.sparks) {
      const x = Math.round(s.x)
      const y = Math.round(s.y)
      g.globalAlpha = Math.max(0, Math.min(1, s.life / 30))
      g.fillStyle = s.color
      g.fillRect(x - 1, y - 1, 2, 2)
      if (s.life > 18) {
        g.fillStyle = '#ffffff'
        g.fillRect(x - 1, y - 1, 1, 1)
      }
    }
    g.restore()
  }

  private renderHud(g: CanvasRenderingContext2D) {
    // Everything boxed into the band above the ceiling.
    hudPanel(g, 4, 3, 84, 21)
    drawText(g, String(this.score).padStart(6, '0'), 10, 7, {
      scale: 2,
      color: RAMPS.pink[3],
      shadow: INK,
    })
    hudPanel(g, 92, 3, 54, 21, RAMPS.teal)
    drawText(g, `WAVE ${this.level}`, 119, 10, {
      align: 'center',
      color: RAMPS.teal[4],
      outline: INK,
    })
    const hi = `HI ${Math.max(this.hiScore, this.score)}`
    const hiW = measureText(hi, 2)
    hudPanel(g, Math.round(W / 2 - hiW / 2 - 6), 3, hiW + 12, 21)
    drawText(g, hi, W / 2, 7, {
      scale: 2,
      align: 'center',
      color: RAMPS.gold[3],
      shadow: INK,
    })
    const lives = Math.min(this.lives, 5)
    if (lives > 0) {
      hudPanel(g, W - 8 - lives * 13, 3, lives * 13 + 4, 21)
      for (let i = 0; i < lives; i++) {
        drawSprite(g, LIFE_SPRITE, W - 12 - i * 13, 13)
      }
    }
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, H / 2 - 60, {
        scale: 3,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.pink[1],
      })
      if (this.banner.sub) {
        drawText(g, this.banner.sub, W / 2, H / 2 - 28, {
          scale: 2,
          align: 'center',
          color: RAMPS.gold[3],
          outline: INK,
        })
      }
    }
  }
}

const butterflyJoust: ArcadeGameModule = {
  create: (options) => new ButterflyJoust(options),
}

export const create = butterflyJoust.create
export default butterflyJoust
