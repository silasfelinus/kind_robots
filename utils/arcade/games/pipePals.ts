// /utils/arcade/games/pipePals.ts
//
// Pipe Pals -- the Kind Robots Arcade's single-screen platform riff (conductor
// kr-arcade/t-009 game factory). The teal cat-eared android from the logo
// keeps a plumbing system tidy: grumpy critters crawl out of the top pipes,
// and bumping the platform under one from below flips it over; touch a
// flipped critter to kick it out of the pipes for good. Crab bots need two
// bumps, shell knights lose their armour first, and spring fleas can only be
// flipped while they are landed. A kicked critter bowls along its ledge and
// takes other flipped critters with it; kicks in quick succession chain.
// Ember sparks bounce across the board and lurker embers hunt a pal who
// lingers; bump the ledge under either to snuff it. Tools roll out of the
// pipes now and then. The KIND block flips everything that is standing on a
// floor. Left and right edges wrap around. A jumps; B blows a bubble while
// the Bubble Wand is in hand.

import { levelCurve } from '../curve'
import {
  DISTRICTS,
  LEAKS,
  PHASES_PER_DISTRICT,
  SEEDLINGS,
  SHOP_ITEMS,
  SOCK_COLOURS,
  SPECIAL_PHASE,
  VALVE_TESTS,
  districtAt,
  districtSteps,
  liftX,
  rosterFor,
  shopPrice,
} from '../pipePals/districts'
import type {
  District,
  Kind,
  Segment,
  SockColour,
  Spot,
  Step,
} from '../pipePals/districts'
import {
  SCENE_SKY,
  ledgeTile,
  paintBoiler,
  paintClock,
  paintCold,
  paintGreenhouse,
  paintLaundry,
} from '../pipePals/scenes'
import { drawText, measureText } from '../font'
import {
  INK,
  RAMPS,
  Sparkles,
  backdropRng,
  bandedGradient,
  bevel,
  cachedLayer,
  drawCloud,
  drawSprite,
  drawStars,
  dropShadow,
  gauge,
  glow,
  hudPanel,
  mix,
  pixelSprite,
  rgba,
  shadedOrb,
  starField,
  vignette,
} from '../snes'
import type { PixelSprite, Ramp } from '../snes'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'

const W = 448
const H = 336

const GRAVITY = 0.35
const JUMP_SPEED = -7.2
const RUN_ACCEL = 0.28
const RUN_MAX = 2.1
const RUN_FRICTION = 0.78
const PLAYER_W = 16
const PLAYER_H = 22
const CRITTER_W = 20
const CRITTER_H = 13
const START_LIVES = 3
const EXTRA_LIFE_AT = 30_000
const BUMP_TICKS = 12
const BUMP_REACH = 22
/** Kick chains: points for the 1st, 2nd, ... kick inside the window. */
export const CHAIN_POINTS = [800, 1600, 2400, 3200, 5000] as const
const CHAIN_WINDOW = 120
/** A kicked critter bowls this many ticks along its ledge (Kick Boots: the whole ledge). */
const BOWL_TICKS = 18
const BOWL_SPEED = 3.4
/** A tool rolls out of the pipes after every this many kicks. */
const TOOL_EVERY_KICKS = 6
const TOOL_TICKS = 60 * 10
const WAND_CHARGES = 3
const BUBBLE_TRAP_TICKS = 60 * 5
const KIND_BLOCK_USES = 3
const HAZARD_TELL = 45

export function chainPoints(n: number): number {
  return CHAIN_POINTS[Math.max(0, Math.min(CHAIN_POINTS.length, n) - 1)]!
}

/** District 1's board, kept for callers that want the classic layout. */
export const PIPE_LEVELS: Segment[] = DISTRICTS[0]!.segments
const THICK = 8
const KIND_W = 24
const KIND_H = 16
const TOP_PIPES = [
  { x: 18, y: 88, dir: 1 },
  { x: W - 18, y: 88, dir: -1 },
]

export const PIPE_CURVES = {
  critters: { start: 3, step: 1, limit: 10 },
  crawlerSpeed: { start: 0.6, step: 0.07, limit: 1.4 },
  recoverTicks: { start: 600, step: -40, limit: 240 },
  releaseEvery: { start: 150, step: -10, limit: 60 },
  /** Ticks between ember sparks once they appear (phase 3 on). */
  sparkEvery: { start: 60 * 16, step: -60, limit: 60 * 7 },
  /** How long a phase runs before lurker embers start hunting a lingering pal. */
  lurkerAfter: { start: 60 * 40, step: -120, limit: 60 * 24 },
} as const

export { DISTRICTS, rosterFor }
export type { Kind }
const SPARKS_FROM = 3

/** Calm, cross, furious: each recovery steps a critter up one tier. */
export type Tier = 0 | 1 | 2
const TIER_SPEED = [1, 1.3, 1.6] as const
const RUSH_SPEED = 1.35
/** The fastest any walker goes (a pal runs at 2.1); gear bug dashes are separate. */
const MAX_WALK = 2.5

type Critter = {
  kind: Kind
  x: number
  y: number
  vx: number
  vy: number
  dir: number
  onGround: boolean
  flipped: number
  /** Crab bots after their first bump. */
  angry: boolean
  /** Shell knights still wearing their shell. */
  armored: boolean
  tier: Tier
  /** The last critter of a phase sprints. */
  rush: boolean
  kicked: boolean
  /** Ticks left bowling along the ledge after a kick. */
  slide: number
  hits: number
  /** Spring fleas: ticks until the next hop. */
  hop: number
  /** Ticks of squash after a flip or a kick (drawn flattened). */
  squash: number
  /** Ticks left floating inside a wand bubble. */
  trapped: number
  /** Lint moths on the wing (they can only be flipped while resting). */
  flying: boolean
  /** Snowballs grow as they roll. */
  size: number
  /** Gear bugs: 0 winding up, 1 paused (flippable), 2 dashing. */
  mode: number
}
type Coin = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  /** Sprinkler and bubble coins drift at a set speed instead of falling. */
  float?: number
  /** Coins riding a gear ledge: which one, and where along it. */
  ride?: { lift: number; dx: number }
}
export type ToolKind = 'wrench' | 'boots' | 'wand' | 'magnet'
const TOOL_KINDS: readonly ToolKind[] = ['wrench', 'boots', 'wand', 'magnet']
const TOOL_NAMES: Record<ToolKind, string> = {
  wrench: 'WIDE WRENCH',
  boots: 'KICK BOOTS',
  wand: 'BUBBLE WAND',
  magnet: 'MAGNET CAP',
}
type Pickup = Coin & { kind: ToolKind }
const CRITTER_NAMES: Record<Kind, string> = {
  crawler: 'SHELL CRAWLER',
  crab: 'CRAB BOT',
  flea: 'SPRING FLEA',
  knight: 'SHELL KNIGHT',
  moth: 'LINT MOTH',
  puppet: 'SOCK PUPPET',
  sock: 'LOOSE SOCK',
  frost: 'FROST BOT',
  snowball: 'SNOWBALL',
  gearbug: 'GEAR BUG',
}
type Bubble = { x: number; y: number; vx: number; vy: number; life: number }
/** An ember spark bounces across the board; a lurker ember slides along one floor. */
type Ember = {
  kind: 'spark' | 'lurker' | 'cuckoo'
  x: number
  y: number
  vx: number
  vy: number
  life: number
  /** Harmless warning ticks before it moves. */
  tell: number
}
type Spark = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = { x: number; y: number; text: string; life: number }

function wrapX(x: number) {
  if (x < -8) return x + W + 16
  if (x > W + 8) return x - W - 16
  return x
}

/** Two walkers on one floor heading into each other: both turn round. */
export function walkersMeet(
  a: { x: number; y: number; dir: number },
  b: { x: number; y: number; dir: number },
): boolean {
  if (Math.abs(a.y - b.y) > 1 || a.dir === b.dir) return false
  const dx = b.x - a.x
  return Math.abs(dx) < CRITTER_W - 2 && dx * a.dir > 0
}

function segmentUnder(
  board: readonly Segment[],
  x: number,
  w: number,
  footY: number,
  tolerance: number,
): Segment | null {
  for (const s of board) {
    if (
      Math.abs(footY - s.y) <= tolerance &&
      x + w / 2 > s.x0 &&
      x - w / 2 < s.x1
    )
      return s
  }
  return null
}

// --- 16-bit art (utils/arcade/snes.ts) -------------------------------------------

/** The bonus round's full length, for the HUD timer gauge (startPhase sets it). */
const BONUS_FULL = 60 * 20
/** Where the city stands: the bottom floor's underside. */
const GROUND_Y = 310 + THICK
const MOON = { x: 372, y: 50, r: 12 }

const CITY_FAR = mix(RAMPS.night[2], RAMPS.purple[1], 0.45)
const CITY_FAR_RIM = mix(CITY_FAR, RAMPS.purple[3], 0.35)
const CITY_NEAR = mix(RAMPS.night[1], RAMPS.night[0], 0.4)
const CITY_NEAR_RIM = mix(CITY_NEAR, RAMPS.purple[2], 0.35)
/** The back plumbing: steel sunk into the dusk, so it reads as scenery, not as floor. */
const PIPE_DARK = RAMPS.steel.map((c) =>
  mix(c, RAMPS.night[1], 0.72),
) as unknown as Ramp
const DUSK_CLOUD: Ramp = [
  RAMPS.night[0],
  RAMPS.night[2],
  RAMPS.night[3],
  mix(RAMPS.purple[1], RAMPS.pink[1], 0.4),
  mix(RAMPS.purple[2], RAMPS.pink[2], 0.3),
]
const CLOUDS = [
  { x: 40, y: 40, size: 11, speed: 0.05 },
  { x: 300, y: 74, size: 8, speed: 0.08 },
]
const STARS = starField(17, 64, W, 190).filter(
  (s) => Math.hypot(s.x - MOON.x, s.y - MOON.y) > MOON.r + 6,
)

/** Which ramp step a line across a round pipe takes: lit high on the curve, shadowed below. */
function pipeShade(f: number): 0 | 1 | 2 | 3 | 4 {
  if (f < 0.1) return 1
  if (f < 0.22) return 3
  if (f < 0.36) return 4
  if (f < 0.5) return 3
  if (f < 0.78) return 2
  if (f < 0.92) return 1
  return 0
}

/**
 * A straight pipe run shaded across its girth: a horizontal run ('rows') shades top to bottom,
 * a vertical one ('cols') left to right, with an ink outline unless `outline` is null.
 */
function pipeRun(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  ramp: Ramp,
  across: 'rows' | 'cols',
  outline: string | null = INK,
) {
  if (outline) {
    g.fillStyle = outline
    g.fillRect(x - 1, y - 1, w + 2, h + 2)
  }
  const n = across === 'rows' ? h : w
  for (let i = 0; i < n; i++) {
    g.fillStyle = ramp[pipeShade((i + 0.5) / n)]
    if (across === 'rows') g.fillRect(x, y + i, w, 1)
    else g.fillRect(x + i, y, 1, h)
  }
}

/** A side pipe sticking out of the wall: a shaded run, a chrome clamp and a lipped mouth. */
function wallPipe(
  g: CanvasRenderingContext2D,
  mouthX: number,
  mouthTop: number,
  mouthH: number,
  bodyH: number,
  facing: 1 | -1,
) {
  const lipW = 10
  const bodyTop = mouthTop + Math.round((mouthH - bodyH) / 2)
  const lipX = facing > 0 ? mouthX - lipW : mouthX
  const bodyX = facing > 0 ? 0 : mouthX + lipW - 2
  const bodyW = facing > 0 ? mouthX - lipW + 2 : W - bodyX
  pipeRun(g, bodyX, bodyTop, bodyW, bodyH, RAMPS.leaf, 'rows')
  // A chrome clamp bolted round the run.
  const clampX = facing > 0 ? 5 : W - 9
  pipeRun(g, clampX, bodyTop - 2, 4, bodyH + 4, RAMPS.steel, 'rows')
  g.fillStyle = RAMPS.steel[4]
  g.fillRect(clampX + 1, bodyTop, 1, 1)
  g.fillRect(clampX + 1, bodyTop + bodyH - 2, 1, 1)
  // The lip, its lit face toward the room and the dark throat inside.
  pipeRun(g, lipX, mouthTop, lipW, mouthH, RAMPS.leaf, 'rows')
  const face = facing > 0 ? lipX + lipW - 1 : lipX
  g.fillStyle = INK
  g.fillRect(face - (facing > 0 ? 3 : -1), mouthTop + 3, 3, mouthH - 6)
  g.fillStyle = RAMPS.leaf[0]
  g.fillRect(face - (facing > 0 ? 4 : -4), mouthTop + 3, 1, mouthH - 6)
  g.fillStyle = RAMPS.leaf[4]
  g.fillRect(facing > 0 ? lipX : lipX + lipW - 1, mouthTop + 2, 1, mouthH - 5)
}

// The two pals from the Kind Robots logo: the teal cat-eared android (the player) and the
// pink-haired android girl (she keeps the spare lives in the HUD).
const TEAL_PALETTE = {
  h: RAMPS.teal[4],
  L: RAMPS.teal[3],
  T: RAMPS.teal[2],
  t: RAMPS.teal[1],
  d: RAMPS.teal[0],
  y: RAMPS.gold[3],
  Y: RAMPS.gold[2],
  g: RAMPS.gold[4],
  p: RAMPS.pink[3],
  k: INK,
  w: '#ffffff',
}
// The pal is drawn at full size (about 24 px tall); the HUD keeps a small face.
const TEAL_HEAD = [
  '...h........h...',
  '..hLt......hLt..',
  '..hLTt....hLTt..',
  '.hLLTTTTTTTTLTt.',
  '.hLLLLLLLLLLLLTt',
  'yhLLLLLLLLLLLLTy',
  'YLLLwwkLLLwwkLTY',
  'YLLLwkkLLLwkkLTY',
  'YTLLLLLLLLLLLLtY',
  '.TLLLLLppLLLLLt.',
  '..tTTTTTTTTTTt..',
]
const TEAL_BODY = [
  '....dTTTTTTd....',
  '...hLLLLLLLLTt..',
  '..hLLgLLLLLLTTt.',
  '.hLLggLLLLLLTTtt',
  '.TLLLLLLLLLLLTtt',
  '.tTTTTTTTTTTTTtd',
  '..dtttttttttttd.',
]
const pal = (legs: string[]) =>
  pixelSprite([...TEAL_HEAD, ...TEAL_BODY, ...legs], TEAL_PALETTE)
const PLAYER_SPRITES = {
  stand: pal([
    '....TL....TL....',
    '....TL....TL....',
    '....Tt....Tt....',
    '...TTt...TTt....',
  ]),
  run: [
    pal([
      '...TL......TL...',
      '..TL........Tt..',
      '.TL..........Tt.',
      'TTt..........TTt',
    ]),
    pal([
      '.....TL..TL.....',
      '.....Tt..Tt.....',
      '....TTt...Tt....',
      '..........TTt...',
    ]),
    pal([
      '......TLTL......',
      '......TtTt......',
      '.....TTtTt......',
      '.........TTt....',
    ]),
  ],
  jump: pal([
    '...TL....TL.....',
    '..TL......Tt....',
    '.TL........TTt..',
    '.T..............',
  ]),
} as const
const TEAL_FACE = pixelSprite(
  [
    '..h......h..',
    '.hL.....hLt.',
    '.hLTTTTTTLt.',
    '.LhhLLLLLLt.',
    'yhLLLLLLLLTy',
    'YLLLwkLLLwkY',
    'YLLLkkLLLkkY',
    '.TLLLLLppLt.',
    '..tTTTTTTt..',
  ],
  TEAL_PALETTE,
)
const PINK_FACE = pixelSprite(
  [
    '...pPPPPp...',
    '..pHhhPPPp..',
    '.pHhPPPPPPp.',
    '.PHPPPPPPPPp',
    'PPccccccPPPp',
    'PPcwkccwkcPp',
    'PpckkcckkcPp',
    'pPcqcccqcCPd',
    'pd.CCCCCC.dp',
    'd..........d',
  ],
  {
    h: RAMPS.pink[4],
    H: RAMPS.pink[3],
    P: RAMPS.pink[2],
    p: RAMPS.pink[1],
    d: RAMPS.pink[0],
    c: RAMPS.cream[3],
    C: RAMPS.cream[2],
    q: RAMPS.pink[3],
    k: INK,
    w: '#ffffff',
  },
)

// Grumpy critters, about 20 px across: a shell crawler, a clawed crab bot, an armoured shell knight
// (and the bare sprinter under the armour) and a spring flea. Every walker has three walk frames
// and a squashed frame for the instant it is flipped or kicked, recoloured per tier (calm, cross,
// furious) and white for the flash before a flipped critter rights itself.
const FLASH: Ramp = ['#6b7a99', '#b4c0d8', '#e6eef8', '#ffffff', '#ffffff']
const CRAWLER_BODY = [
  '.....HHHHLL.........',
  '...HHLLLLLLLB.......',
  '..HLLLSLLLLSLB......',
  '.HLLLSSSLLSSSLB..kk.',
  '.LLLLLSLLLLSLLB.cccc',
  'HLLSLLLLLSLLLLBcwkcc',
  'LLSSSLLLSSSLLBBccccC',
  'LLLSLLLLLSLLLBB.cCC.',
  'SBBBBBBBBBBBBBS.....',
  '.DSSSSSSSSSSSD......',
]
const CRAWLER_LEGS = [
  ['.CC...CC...CC.......', '.CC...CC...CC.......'],
  ['..CC...CC...CC......', '...CC...CC...CC.....'],
  ['.CC....CC....CC.....', 'CC....CC....CC......'],
] as const
const CRAB_BODY = [
  '.HH..............HH.',
  'HLLH....w..w....HLLS',
  'LLLS....k..k....SLLS',
  '.LSS....B..B....SSL.',
  '...S.HHHLLLLLLB.S...',
  '....HLLLLLLLLLLB....',
  '...HLLSLLLLLLSLLB...',
  '...LLLLLLLLLLLLLB...',
  '...SBBBBBBBBBBBBS...',
  '....DDSSSSSSSSDD....',
]
const CRAB_LEGS = [
  ['...S.S.S....S.S.S...', '..S..S..S..S..S..S..'],
  ['..S.S.S......S.S.S..', '.S..S..S....S..S..S.'],
  ['...S..S.S..S.S..S...', '..S..S...SS...S..S..'],
] as const
/** The knight's armour: a riveted shell with a plume, worn over the crawler's body. */
const KNIGHT_BODY = [
  '......pp............',
  '.....pHHHLL.........',
  '...HHLLwLLLLB.......',
  '..HLLLLLLLLwLB......',
  '.HLwLLLLLLLLLLB..kk.',
  '.LLLLLLwLLLLLLB.cccc',
  'HLLLLLLLLLLLwLBcwkcc',
  'LLwLLLLLLLLLLBBccccC',
  'LLLLLLwLLLLLLBB.cCC.',
  'SBBBBBBBBBBBBBS.....',
  '.DSSSSSSSSSSSD......',
]
/** Out of its armour the knight is a soft, quick grub. */
const BARE_BODY = [
  '....................',
  '.............kk.....',
  '....HHHLLLLL.cccc...',
  '..HLLLLLLLLLBcwkc...',
  '.HLSLLLSLLLSBccccC..',
  '.SBBBBBBBBBBS.cCC...',
  '..DSSSSSSSSD........',
]
const FLEA_BODY = [
  '...a.......a....',
  '....a.....a.....',
  '....HHHLLLL.....',
  '..HHLLLLLLLLB...',
  '.HLLwkLLLwkLLB..',
  '.LLLkkLLLkkLLB..',
  '.LLLLLLLLLLLLB..',
  '.SLLLLccLLLLBS..',
  '..SBBBBBBBBBS...',
  '...DSSSSSSSD....',
]
const FLEA_LEGS = [
  ['..SD......DS....', '.SD........DS...'],
  ['...S......S.....', '...S......S.....'],
  ['..SD......DS....', 'SD..........DS..'],
] as const

type CritterFrames = {
  walk: readonly PixelSprite[]
  squash: PixelSprite
}
function critterFrames(
  body: readonly string[],
  legs: readonly (readonly string[])[],
  ramp: Ramp,
  shell: Ramp = ramp,
): CritterFrames {
  const palette = {
    D: shell[0],
    S: shell[1],
    B: shell[2],
    L: shell[3],
    H: shell[4],
    c: RAMPS.cream[3],
    C: RAMPS.cream[2],
    a: ramp[3],
    p: ramp[3],
    R: RAMPS.pink[3],
    Y: RAMPS.gold[3],
    y: RAMPS.gold[2],
    r: RAMPS.ember[1],
    k: INK,
    w: '#ffffff',
  }
  return {
    walk: legs.map((l) => pixelSprite([...body, ...l], palette)),
    // Squashed flat: the top rows pressed down, legs splayed.
    squash: pixelSprite(
      [...body.slice(3), legs[2]![legs[2]!.length - 1]!],
      palette,
    ),
  }
}
// Suds Works newcomers: the lint moth (three wing beats; it rests with its wings down), the sock
// puppet (it splits into two loose socks when flipped) and the loose sock itself.
const MOTH_FRAMES = [
  [
    'HL............LH',
    'LLB..a....a..BLL',
    'BLLB..a..a..BLLB',
    'SBLLBccccccBLLBS',
    '.SBBcwkccwkcBBS.',
    '..SSccccccccSS..',
    '.....CccccC.....',
    '......CCCC......',
  ],
  [
    '................',
    '.....a....a.....',
    'HLLB..a..a..BLLH',
    'LLLLBccccccBLLLL',
    'SBBBcwkccwkcBBBS',
    '.SSSccccccccSSS.',
    '.....CccccC.....',
    '......CCCC......',
  ],
  [
    '................',
    '.....a....a.....',
    '......a..a......',
    '....BccccccB....',
    '.SBBcwkccwkcBBS.',
    'SBLLccccccccLLBS',
    'LLLB.CccccC.BLLL',
    'HLB...CCCC...BLH',
  ],
] as const
const PUPPET_BODY = [
  '....HHHHLL......',
  '...HLLLLLLB.....',
  '..HLwkLLwkLB....',
  '..LLkkLLkkLB....',
  '..LLLLLLLLLB....',
  '..LRRRRRRRLB....',
  '..LLrrrrrrLB....',
  '..LLLLLLLLLB....',
  '..SSSSSSSSSB....',
  '..LLLLLLLLLB....',
  '..SSSSSSSSSBB...',
  '..LLLLLLLLLLLB..',
  '..LLLLLLLLLLLLB.',
  '..DSSSSSSSSSSSD.',
]
const PUPPET_FEET = [
  ['..D.D.D.D.D.D...'],
  ['...D.D.D.D.D.D..'],
  ['..D..D..D..D..D.'],
] as const
const SOCK_BODY = [
  '..HHLL......',
  '..LwkB......',
  '..SSSB......',
  '..LLLB......',
  '..SSSB......',
  '..LLLLLB....',
  '..LLLLLLLB..',
  '..DSSSSSSD..',
]
const SOCK_FEET = [
  ['..D.D.D.D...'],
  ['...D.D.D.D..'],
  ['..D..D..D...'],
] as const

/** Frames built from whole-sprite rows (no separate legs), for the moth. */
function wingFrames(
  frames: readonly (readonly string[])[],
  ramp: Ramp,
): CritterFrames {
  const palette = {
    D: ramp[0],
    S: ramp[1],
    B: ramp[2],
    L: ramp[3],
    H: ramp[4],
    c: RAMPS.cream[3],
    C: RAMPS.cream[2],
    a: RAMPS.cream[1],
    k: INK,
    w: '#ffffff',
  }
  return {
    walk: frames.map((rows) => pixelSprite(rows, palette)),
    squash: pixelSprite(frames[2]!.slice(3), palette),
  }
}

/** Each kind's frames by tier (calm, cross, furious), plus the recovery flash. */
type KindLook = {
  tiers: readonly [CritterFrames, CritterFrames, CritterFrames]
  flash: CritterFrames
}
function kindLook(
  body: readonly string[],
  legs: readonly (readonly string[])[],
  tiers: readonly [Ramp, Ramp, Ramp],
): KindLook {
  return {
    tiers: [
      critterFrames(body, legs, tiers[0]),
      critterFrames(body, legs, tiers[1]),
      critterFrames(body, legs, tiers[2]),
    ],
    flash: critterFrames(body, legs, FLASH),
  }
}
// Swing Shift newcomers: the frost bot (a snowflake antenna; it ices the ledge it walks) and the
// gear bug (a wind-up beetle with a key on its back). Snowballs are drawn round, by size.
const FROST_BODY = [
  '.......a........',
  '......aHa.......',
  '.......a........',
  '....HHHLLLL.....',
  '...HLLLLLLLLB...',
  '..HLwkLLLwkLLB..',
  '..LLkkLLLkkLLB..',
  '..LLLLLLLLLLLB..',
  '..SLLcccccLLBS..',
  '...SBBBBBBBBS...',
  '....DSSSSSSD....',
]
const FROST_LEGS = [
  ['...SS....SS.....', '...SD....SD.....'],
  ['....SS..SS......', '....SD..SD......'],
  ['..SS......SS....', '..SD......SD....'],
] as const
const GEARBUG_BODY = [
  '......YyyY.......',
  '.......yy........',
  '....HHHLLLL......',
  '..HHLLSLLSLLB....',
  '.HLLSSLLSSLLB.kk.',
  '.LLLLLLLLLLLBccc.',
  'HLLSLLLLSLLLBcwk.',
  'SBBBBBBBBBBBBccC.',
  '.DSSSSSSSSSSD....',
]

const CRITTER_LOOKS: Record<Kind | 'bare', KindLook> = {
  crawler: kindLook(CRAWLER_BODY, CRAWLER_LEGS, [
    RAMPS.leaf,
    RAMPS.sky,
    RAMPS.ember,
  ]),
  crab: kindLook(CRAB_BODY, CRAB_LEGS, [RAMPS.rust, RAMPS.gold, RAMPS.pink]),
  flea: kindLook(FLEA_BODY, FLEA_LEGS, [RAMPS.purple, RAMPS.sky, RAMPS.ember]),
  knight: {
    tiers: [
      critterFrames(KNIGHT_BODY, CRAWLER_LEGS, RAMPS.pink, RAMPS.steel),
      critterFrames(KNIGHT_BODY, CRAWLER_LEGS, RAMPS.gold, RAMPS.steel),
      critterFrames(KNIGHT_BODY, CRAWLER_LEGS, RAMPS.ember, RAMPS.steel),
    ],
    flash: critterFrames(KNIGHT_BODY, CRAWLER_LEGS, FLASH),
  },
  moth: {
    tiers: [
      wingFrames(MOTH_FRAMES, RAMPS.cream),
      wingFrames(MOTH_FRAMES, RAMPS.gold),
      wingFrames(MOTH_FRAMES, RAMPS.ember),
    ],
    flash: wingFrames(MOTH_FRAMES, FLASH),
  },
  puppet: kindLook(PUPPET_BODY, PUPPET_FEET, [
    RAMPS.teal,
    RAMPS.gold,
    RAMPS.ember,
  ]),
  sock: kindLook(SOCK_BODY, SOCK_FEET, [RAMPS.teal, RAMPS.gold, RAMPS.ember]),
  frost: kindLook(FROST_BODY, FROST_LEGS, [
    RAMPS.water,
    RAMPS.sky,
    RAMPS.purple,
  ]),
  gearbug: kindLook(GEARBUG_BODY, CRAWLER_LEGS, [
    RAMPS.steel,
    RAMPS.gold,
    RAMPS.ember,
  ]),
  // Snowballs are drawn by size in renderCritter; this look is never used.
  snowball: kindLook(FROST_BODY, FROST_LEGS, [
    RAMPS.water,
    RAMPS.water,
    RAMPS.water,
  ]),
  bare: kindLook(BARE_BODY, CRAWLER_LEGS, [
    RAMPS.pink,
    RAMPS.gold,
    RAMPS.ember,
  ]),
}

/** The lurker ember: a low flame that creeps along a floor, two flicker frames. */
const LURKER_PALETTE = {
  d: RAMPS.ember[1],
  b: RAMPS.ember[2],
  c: RAMPS.ember[3],
  w: RAMPS.ember[4],
  k: INK,
}
const LURKER_SPRITES = [
  pixelSprite(
    [
      '.........d......',
      '......d.dbd.....',
      '.....dbdbcbd..d.',
      '....dbcbcwcbddbd',
      '...dbcwcwwwcbcbd',
      '..dbcwkwwkwwcwcb',
      '.dbcwwwwwwwwwwcb',
      'dbccccccccccccbd',
    ],
    LURKER_PALETTE,
  ),
  pixelSprite(
    [
      '..........d.....',
      '.....d...dbd....',
      '....dbd.dbcbd.d.',
      '....dbcdbcwcbdbd',
      '...dbcwcwwwcbcbd',
      '..dbcwkwwkwwcwcb',
      '.dbcwwwwwwwwwwcb',
      'dbccccccccccccbd',
    ],
    LURKER_PALETTE,
  ),
] as const

/** The cuckoo: a small clockwork bird that swoops along a floor, two wing frames. */
const CUCKOO_PALETTE = {
  y: RAMPS.gold[3],
  Y: RAMPS.gold[4],
  o: RAMPS.ember[3],
  b: RAMPS.earth[2],
  k: INK,
  w: '#ffffff',
}
const CUCKOO_SPRITES = [
  pixelSprite(
    [
      '..bb........',
      '.bbbb.......',
      'bbyyyyy..wk.',
      '.yyyyyyyyyyo',
      '..yyYYyyyy..',
      '....yy......',
    ],
    CUCKOO_PALETTE,
  ),
  pixelSprite(
    [
      '............',
      '.......wk...',
      'bbyyyyyyyyyo',
      'bbbyyYYyyy..',
      '.bb.yy......',
      '..b.........',
    ],
    CUCKOO_PALETTE,
  ),
] as const

/** Tools from the belt: wrench, boot, wand and magnet, 10 px icons. */
const TOOL_SPRITES: Record<ToolKind, PixelSprite> = {
  wrench: pixelSprite(
    [
      '.ss...ss.',
      '.sS...Ss.',
      '..SsssS..',
      '...sSs...',
      '...sSs...',
      '...sSs...',
      '...sSs...',
      '...SSS...',
    ],
    { s: RAMPS.steel[4], S: RAMPS.steel[2] },
  ),
  boots: pixelSprite(
    [
      '..rrr....',
      '..rRr....',
      '..rRr....',
      '..rRr....',
      '..rRRrr..',
      '.rRRRRRr.',
      '.wwwwwwww',
    ],
    { r: RAMPS.rust[3], R: RAMPS.rust[2], w: RAMPS.cream[4] },
  ),
  wand: pixelSprite(
    [
      '...bbb...',
      '..b...b..',
      '..b...b..',
      '...bbb...',
      '....s....',
      '....s....',
      '....s....',
      '....s....',
    ],
    { b: RAMPS.water[3], s: RAMPS.gold[3] },
  ),
  magnet: pixelSprite(
    [
      '.rrr.ttt.',
      '.rRr.tTt.',
      '.rRr.tTt.',
      '.rRrrtTt.',
      '.rRRRTTt.',
      '..rrrttt.',
      '..wwwww..',
    ],
    {
      r: RAMPS.ember[2],
      R: RAMPS.ember[3],
      t: RAMPS.teal[2],
      T: RAMPS.teal[3],
      w: RAMPS.steel[4],
    },
  ),
}

const COIN_PALETTE = {
  w: '#ffffff',
  h: RAMPS.gold[4],
  Y: RAMPS.gold[3],
  g: RAMPS.gold[2],
  d: RAMPS.gold[1],
}
/** A spinning coin: face, three-quarter, edge (the three-quarter frame mirrors on the way back). */
const COIN_SPRITES = [
  pixelSprite(
    [
      '..hYYg..',
      '.hYYYYg.',
      'hYYwYYYg',
      'hYYwYYgd',
      'hYYwYYgd',
      'hYYwYYgd',
      'hYYwYYgd',
      '.hYYYgd.',
      '..ggdd..',
    ],
    COIN_PALETTE,
  ),
  pixelSprite(
    [
      '.hYg.',
      'hYwYg',
      'hYwgd',
      'hYwgd',
      'hYwgd',
      'hYwgd',
      'hYwgd',
      'hYYgd',
      '.ggd.',
    ],
    COIN_PALETTE,
  ),
  pixelSprite(
    ['hd', 'Yd', 'Yd', 'Yd', 'Yd', 'Yd', 'Yd', 'Yd', 'gd'],
    COIN_PALETTE,
  ),
] as const

/** The far city: two rows of towers with lit windows, then the dark plumbing in front. */
function paintCity(k: CanvasRenderingContext2D) {
  const rand = backdropRng(41)
  const towers = (
    tall: number,
    least: number,
    widest: number,
    fill: string,
    rim: string,
    windows: (x: number, w: number, top: number) => void,
  ) => {
    for (let x = -6; x < W;) {
      const w = 12 + Math.floor(rand() * (widest - 12))
      const h = least + Math.floor(rand() * (tall - least))
      const top = GROUND_Y - h
      k.fillStyle = fill
      k.fillRect(x, top, w, h)
      k.fillStyle = rim
      k.fillRect(x, top, w, 1)
      k.fillRect(x, top, 1, h)
      if (rand() < 0.35) {
        k.fillRect(x + Math.floor(w / 2), top - 6, 1, 6)
      }
      windows(x, w, top)
      x += w + 1 + Math.floor(rand() * 5)
    }
  }
  towers(130, 56, 30, CITY_FAR, CITY_FAR_RIM, (x, w, top) => {
    k.fillStyle = rgba(RAMPS.gold[3], 0.32)
    for (let wy = top + 4; wy < GROUND_Y - 4; wy += 5)
      for (let wx = x + 2; wx < x + w - 2; wx += 3)
        if (rand() < 0.28) k.fillRect(wx, wy, 1, 2)
  })
  const neon = [RAMPS.gold[2], RAMPS.teal[3], RAMPS.pink[3]] as const
  towers(66, 24, 44, CITY_NEAR, CITY_NEAR_RIM, (x, w, top) => {
    for (let wy = top + 5; wy < GROUND_Y - 6; wy += 7)
      for (let wx = x + 3; wx < x + w - 4; wx += 6)
        if (rand() < 0.22) {
          k.fillStyle = neon[Math.floor(rand() * neon.length)]!
          k.fillRect(wx, wy, 2, 2)
        }
  })
  // Back plumbing: risers and a header pipe with a valve wheel, sunk into the dusk.
  for (const x of [92, 346]) {
    pipeRun(k, x, 128, 10, GROUND_Y - 128, PIPE_DARK, 'cols')
    pipeRun(k, x - 2, 124, 14, 6, PIPE_DARK, 'cols')
  }
  pipeRun(k, 102, 198, 244, 9, PIPE_DARK, 'rows')
  pipeRun(k, W / 2 - 5, 207, 10, GROUND_Y - 207, PIPE_DARK, 'cols')
  for (const x of [92, 219, 346]) bevel(k, x - 2, 195, 14, 15, PIPE_DARK)
  shadedOrb(k, 160, 202, 7, PIPE_DARK)
  k.fillStyle = PIPE_DARK[0]
  k.fillRect(153, 201, 15, 2)
  k.fillRect(159, 195, 2, 15)
  // The ground under the bottom floor.
  bandedGradient(
    k,
    0,
    GROUND_Y,
    W,
    H - GROUND_Y,
    [RAMPS.night[2], RAMPS.night[1], RAMPS.night[0]],
    3,
  )
}

/** One floor segment's bricks, clipped to its solid span. */
function brickRun(
  g: CanvasRenderingContext2D,
  s: Segment,
  from: number,
  to: number,
  lift: number,
  tile: PixelSprite,
) {
  g.save()
  g.beginPath()
  g.rect(s.x0, s.y - lift - 1, s.x1 - s.x0, THICK + 2)
  g.clip()
  for (let x = from; x < to; x += 8)
    drawSprite(g, tile, x, s.y - lift, { anchor: 'topleft' })
  g.restore()
}

// The Big Shell, Day Shift's boss: a shell crawler as wide as a ledge, painted procedurally on a
// 60x32 grid (feet at the bottom): a plated dome, a rim, a grumpy head and four stomping legs.
function bigShellRows(frame: 0 | 1, curl: boolean): string[] {
  const w = 60
  const h = 32
  const grid = Array.from({ length: h }, () => new Array<string>(w).fill('.'))
  const put = (x: number, y: number, ch: string) => {
    if (y >= 0 && y < h && x >= 0 && x < w) grid[y]![x] = ch
  }
  const shade = (nx: number, ny: number) => {
    const light = -(nx * 0.55 + ny * 0.85)
    return 'DSBLH'[Math.max(0, Math.min(4, Math.round(2 + light * 1.7)))]!
  }
  if (curl) {
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const nx = (x + 0.5 - 30) / 16
        const ny = (y + 0.5 - 16) / 16
        if (nx * nx + ny * ny > 1) continue
        const seam = (x + y) % 9 === 0 || (x - y + 60) % 9 === 0
        put(x, y, seam ? 'S' : shade(nx, ny))
      }
    return grid.map((r) => r.join(''))
  }
  // The dome and its plates.
  for (let y = 0; y <= 22; y++)
    for (let x = 0; x < w; x++) {
      const nx = (x + 0.5 - 28) / 25
      const ny = (y + 0.5 - 22) / 21
      if (nx * nx + ny * ny > 1) continue
      const plate = y % 7 === 3 || (x + Math.floor(y / 7) * 5) % 11 === 0
      put(x, y, plate ? 'S' : shade(nx, ny))
    }
  // The rim.
  for (let x = 2; x < 55; x++) {
    put(x, 22, 'B')
    put(x, 23, 'D')
  }
  // The head, poking out to the right, with a scowl.
  for (let y = 12; y <= 22; y++)
    for (let x = 50; x < 60; x++) {
      const nx = (x + 0.5 - 54) / 6
      const ny = (y + 0.5 - 17) / 6
      if (nx * nx + ny * ny <= 1) put(x, y, ny < -0.2 ? 'c' : 'C')
    }
  put(55, 15, 'k')
  put(56, 15, 'k')
  put(55, 16, 'w')
  put(56, 16, 'k')
  put(53, 14, 'k')
  put(54, 14, 'k')
  put(57, 19, 'k')
  put(58, 19, 'k')
  // Four stomping legs.
  for (const [i, lx] of [10, 21, 33, 44].entries()) {
    const lift = (i + frame) % 2 === 0 ? 0 : 2
    for (let y = 24; y < 32 - lift; y++) {
      put(lx, y, 'C')
      put(lx + 1, y, 'C')
      put(lx + 2, y, 'c')
    }
    put(lx - 1, 31 - lift, 'C')
    put(lx + 3, 31 - lift, 'C')
  }
  return grid.map((r) => r.join(''))
}
function bigShellPalette(ramp: Ramp): Record<string, string> {
  return {
    D: ramp[0],
    S: ramp[1],
    B: ramp[2],
    L: ramp[3],
    H: ramp[4],
    c: RAMPS.cream[3],
    C: RAMPS.cream[2],
    k: INK,
    w: '#ffffff',
  }
}
const BIG_SHELL = {
  walk: [0, 1].map((f) =>
    pixelSprite(bigShellRows(f as 0 | 1, false), bigShellPalette(RAMPS.leaf)),
  ),
  angry: [0, 1].map((f) =>
    pixelSprite(bigShellRows(f as 0 | 1, false), bigShellPalette(RAMPS.ember)),
  ),
  curl: pixelSprite(bigShellRows(0, true), bigShellPalette(RAMPS.ember)),
  flash: pixelSprite(
    bigShellRows(0, false),
    bigShellPalette(['#b4c0d8', '#e6eef8', '#ffffff', '#ffffff', '#ffffff']),
  ),
}

type Leak = { x: number; y: number; sealed: boolean; t: number }
type Seedling = {
  x: number
  y: number
  state: 'potted' | 'rescued' | 'trampled'
  t: number
}
type LooseSock = Coin & { colour: SockColour }
type BossState = 'walk' | 'leap' | 'tipped' | 'down' | 'roll'
type Boss = {
  x: number
  y: number
  vx: number
  vy: number
  dir: number
  hp: number
  maxHp: number
  seg: Segment
  target: Segment | null
  state: BossState
  t: number
  tipHits: number
  tipTimer: number
  flash: number
  rolls: number
}
type Workshop = { cursor: number; t: number; bought: ShopItemId[] }
type Icicle = {
  x: number
  /** The ledge top it hangs under. */
  y: number
  grow: number
  state: 'grow' | 'shake' | 'fall' | 'gone'
  fy: number
  vy: number
  t: number
}
type Thermostat = {
  hp: number
  maxHp: number
  mode: 'freeze' | 'heat'
  modeT: number
  target: number
  targetT: number
  flash: number
  spawnT: number
}
const THERMO = { x: W / 2, y: 70, r: 24 }
const ICICLE_GROW = 420
const ICICLE_SHAKE = 70
const VENT_PERIOD = 200
const VENT_PUFF = 34
const VENT_TELL = 40
/** The needle's last ticks on a ledge, when a bump there lands. */
const THERMO_ARMED = 44
type ShopItemId = (typeof SHOP_ITEMS)[number]['item']

const BOSS_HALF = 28
const BOSS_H = 30
const BOSS_HP = 3
const SOCK_RGB: Record<SockColour, Ramp> = {
  pink: RAMPS.pink,
  gold: RAMPS.gold,
  teal: RAMPS.teal,
  purple: RAMPS.purple,
}
const SHIFT_NAMES = ['', 'DAY SHIFT', 'SWING SHIFT', 'NIGHT SHIFT'] as const
const TILE_CACHE = new Map<string, PixelSprite>()
function tileFor(
  kind: Segment['kind'],
  rampName: keyof typeof RAMPS,
): PixelSprite {
  const key = `${kind ?? 'brick'}-${rampName}`
  let tile = TILE_CACHE.get(key)
  if (!tile)
    TILE_CACHE.set(key, (tile = ledgeTile(kind ?? 'brick', RAMPS[rampName])))
  return tile
}

class PipePals implements ArcadeGameInstance {
  score = 0
  level = 0
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private player = {
    x: W / 2,
    y: 310,
    vx: 0,
    vy: 0,
    onGround: true,
    face: 1,
    run: 0,
  }
  private alive = true
  private respawn = 0
  private invuln = 0
  // The campaign: which district, which step of it, and how many laps of the city.
  private districtIndex = 0
  private district: District = DISTRICTS[0]!
  private lap = 0
  private steps: Step[] = []
  private stepIndex = 0
  private boardNow: Segment[] = []
  private liftLefts: number[] = []
  private vines = new Map<number, { sag: number; down: number }>()
  /** Ledges a frost bot has iced over, and how long they stay icy. */
  private frozen = new Map<Segment, number>()
  /** Crumble ledges: landings so far, and how long until a fallen one rebuilds. */
  private crumbles = new Map<Segment, { landings: number; down: number }>()
  private wasOnGround = true
  private icicles: Icicle[] = []
  private cuckooTimer = 0
  // Swing Shift special phases.
  private blocks: Array<Spot & { hits: number; freed: boolean }> = []
  private gauges: Array<Spot & { p: number; rate: number; burst: boolean }> = []
  private wheels: Spot[] = []
  private route = -1
  private bestChain = 0
  private thermo: Thermostat | null = null
  private cardTicks = 0
  // Workshop economy, golden valves and the KIND block.
  private wallet = 0
  private valves: string[] = []
  private hintNext = false
  private hintActive = false
  private lucky = false
  private luckyNext = false
  private startTool: ToolKind | null = null
  private kindMax = KIND_BLOCK_USES
  private kindBlockUses = KIND_BLOCK_USES
  private kindShake = 0
  private workshop: Workshop | null = null
  // Phase actors.
  private critters: Critter[] = []
  private queue: Kind[] = []
  private releaseTimer = 0
  private bump: { x: number; y: number; ticks: number; reach: number } | null =
    null
  private coins: Coin[] = []
  private pickups: Pickup[] = []
  private tool: { kind: ToolKind; ticks: number; charges: number } | null = null
  private bubbles: Bubble[] = []
  private embers: Ember[] = []
  private sparkTimer = 0
  private phaseTicks = 0
  private lurkerTimer = 0
  private kicks = 0
  private chain = 0
  private chainTimer = 0
  // Special phases.
  private leaks: Leak[] = []
  private seedlings: Seedling[] = []
  private socks: LooseSock[] = []
  private socksDropped = 0
  private sockTimer = 0
  private heldSock: SockColour | null = null
  private pairs = 0
  // Boss and bonus.
  private boss: Boss | null = null
  private bossTimer = 0
  private bonusRound = 0
  private bonusFeed = 0
  private bonusTimer = 0
  private bonusTotal = 0
  private bonusGot = 0
  // Effects.
  private sparks: Spark[] = []
  private floaters: Floater[] = []
  private phaseDelay = 0
  private overTimer = 0
  private pilotClimb: { dir: number; targetY: number } | null = null
  private nextExtra = EXTRA_LIFE_AT
  private banner: { text: string; sub?: string; ticks: number } | null = null
  // Cosmetic sparkles roll their own dice, so the game's seeded rng is untouched.
  private fx = new Sparkles()
  private fxRng = backdropRng(53)

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.beginDistrict(0)
  }

  // --- the campaign ---------------------------------------------------------------

  private step(): Step {
    return this.steps[this.stepIndex]!
  }

  /**
   * Difficulty climbs two steps per district and one per phase, so the curves are still rising in
   * the Night Shift (new mechanics carry the rest); each lap round the city adds six.
   */
  private heat(): number {
    const step = this.step()
    const phase = step.kind === 'phase' ? step.phase : PHASES_PER_DISTRICT
    return (this.district.number - 1) * 2 + phase + this.lap * 6
  }

  private beginDistrict(index: number) {
    const { district, lap } = districtAt(index)
    this.districtIndex = index
    this.district = district
    this.lap = lap
    this.steps = districtSteps(district)
    this.stepIndex = 0
    this.vines = new Map()
    this.kindBlockUses = this.kindMax
    this.lucky = this.luckyNext
    this.luckyNext = false
    this.hintActive = this.hintNext
    this.hintNext = false
    this.cardTicks = 170
    this.startStep()
    if (this.startTool) {
      this.tool = {
        kind: this.startTool,
        ticks: TOOL_TICKS * 2,
        charges: this.startTool === 'wand' ? WAND_CHARGES : 0,
      }
      this.startTool = null
    }
  }

  private advance() {
    this.stepIndex++
    if (this.stepIndex >= this.steps.length)
      this.beginDistrict(this.districtIndex + 1)
    else this.startStep()
  }

  private startStep() {
    const step = this.step()
    if (step.kind !== 'workshop') this.level++
    this.critters = []
    this.queue = []
    this.coins = []
    this.pickups = []
    this.bubbles = []
    this.embers = []
    this.leaks = []
    this.seedlings = []
    this.socks = []
    this.blocks = []
    this.gauges = []
    this.wheels = []
    this.route = -1
    this.bestChain = 0
    this.icicles = []
    this.thermo = null
    this.boss = null
    this.workshop = null
    this.bonusRound = 0
    this.bump = null
    this.chain = 0
    this.chainTimer = 0
    this.phaseTicks = 0
    Object.assign(this.player, {
      x: W / 2,
      y: 310,
      vx: 0,
      vy: 0,
      onGround: true,
    })
    this.frozen = new Map()
    this.crumbles = new Map()
    this.cuckooTimer = 600
    this.refreshBoard()
    if (step.kind === 'phase') this.startPhase(step.phase)
    else if (step.kind === 'boss') this.startBoss()
    else if (step.kind === 'bonus') this.startBonus()
    else this.startWorkshop()
  }

  private startPhase(phase: number) {
    const d = this.district
    const total = Math.round(levelCurve(this.heat(), PIPE_CURVES.critters))
    const { kinds, debut } = rosterFor(d, phase)
    const weights = d.roster.filter((r) => kinds.includes(r.kind))
    const sum = weights.reduce((n, r) => n + r.weight, 0)
    this.queue = Array.from({ length: total }, () => {
      let roll = this.rng() * sum
      for (const r of weights) if ((roll -= r.weight) < 0) return r.kind
      return 'crawler' as Kind
    })
    let sub: string | undefined
    // A newcomer leads its debut phase, so the player meets it on its own.
    if (debut) {
      this.queue[0] = debut
      sub = `NEW: ${CRITTER_NAMES[debut]}`
    }
    if (phase === SPECIAL_PHASE) {
      sub = this.valveTestLabel()
      this.startSpecial()
    }
    this.icicles = (d.icicles ?? []).map((spot, i) => ({
      x: spot.x,
      y: spot.y,
      grow: -i * 90,
      state: 'grow',
      fy: 0,
      vy: 0,
      t: 0,
    }))
    this.releaseTimer = 60
    this.sparkTimer = Math.round(
      levelCurve(this.heat(), PIPE_CURVES.sparkEvery) / 2,
    )
    this.lurkerTimer = Math.round(
      levelCurve(this.heat(), PIPE_CURVES.lurkerAfter),
    )
    this.invuln = 90
    this.banner = { text: `PHASE ${d.number}-${phase}`, sub, ticks: 120 }
  }

  private valveGoal(): number {
    return Math.max(
      1,
      VALVE_TESTS[this.district.special].goal - (this.hintActive ? 1 : 0),
    )
  }

  private valveTestLabel(): string {
    const test = VALVE_TESTS[this.district.special]
    return this.hintActive
      ? test.label.replace(String(test.goal), String(this.valveGoal()))
      : test.label
  }

  private startSpecial() {
    const special = this.district.special
    if (special === 'first-fix') {
      this.leaks = LEAKS.map((l, i) => ({ ...l, sealed: false, t: i * 50 }))
    } else if (special === 'seedling-rescue') {
      this.seedlings = SEEDLINGS.map((s) => ({ ...s, state: 'potted', t: 0 }))
    } else if (special === 'thaw-run') {
      this.blocks = (this.district.spots ?? []).map((spot) => ({
        ...spot,
        hits: 0,
        freed: false,
      }))
    } else if (special === 'pressure-valves') {
      this.gauges = (this.district.spots ?? []).map((spot, i) => ({
        ...spot,
        p: i * 0.12,
        rate: 1 / (1100 - i * 110),
        burst: false,
      }))
    } else if (special === 'valve-routing') {
      this.wheels = [...(this.district.spots ?? [])]
      this.route = 0
      this.bestChain = 0
    } else {
      this.socksDropped = 0
      this.sockTimer = 90
      this.heldSock = null
      this.pairs = 0
    }
  }

  /** How the special phase went: its score toward the golden valve. */
  private specialScore(): number {
    const special = this.district.special
    if (special === 'first-fix')
      return this.leaks.filter((l) => l.sealed).length
    if (special === 'seedling-rescue')
      return this.seedlings.filter((s) => s.state === 'rescued').length
    if (special === 'thaw-run') return this.blocks.filter((b) => b.freed).length
    if (special === 'pressure-valves')
      return this.gauges.filter((g) => !g.burst).length
    if (special === 'valve-routing') return this.bestChain
    return this.pairs
  }

  private finishSpecial() {
    const got = this.specialScore()
    const d = this.district
    if (got >= this.valveGoal() && !this.valves.includes(d.id)) {
      this.valves.push(d.id)
      this.addScore(10_000, W / 2, 200)
      this.banner = { text: 'GOLDEN VALVE!', sub: d.name, ticks: 140 }
      this.fx.burst(W / 2, 160, this.fxRng, {
        count: 30,
        speed: 2.8,
        colours: [RAMPS.gold[4], RAMPS.gold[3], '#ffffff'],
      })
    }
    this.hintActive = false
  }

  private startBoss() {
    if (this.district.boss === 'thermostat') {
      this.startThermostat()
      return
    }
    const seg = this.bossLedges()[0]!
    this.boss = {
      x: (seg.x0 + seg.x1) / 2,
      y: -40,
      vx: 0,
      vy: 0,
      dir: 1,
      hp: BOSS_HP,
      maxHp: BOSS_HP,
      seg,
      target: seg,
      state: 'leap',
      t: 0,
      tipHits: 0,
      tipTimer: 0,
      flash: 0,
      rolls: 0,
    }
    this.bossTimer = 240
    this.invuln = 120
    this.banner = {
      text: 'THE BIG SHELL',
      sub: 'TIP IT WITH THREE BUMPS, THEN KICK',
      ticks: 160,
    }
    this.sound.play('warn')
  }

  /** Ledges wide enough for the Big Shell to stand on (never the floor: it must be bumpable). */
  private bossLedges(): Segment[] {
    return this.district.segments.filter(
      (s) => s.y < 310 && s.x1 - s.x0 >= BOSS_HALF * 2 + 16,
    )
  }

  private startBonus() {
    const twist = this.district.bonus
    this.bonusRound = BONUS_FULL
    this.bonusGot = 0
    if (twist === 'static' || twist === 'ice' || twist === 'gears') {
      for (const s of this.district.segments.slice(1)) {
        for (let x = s.x0 + 20; x < s.x1 - 10; x += 44) {
          this.coins.push({ x, y: s.y - 10, vx: 0, vy: 0, life: Infinity })
        }
      }
      // Coins riding the gear ledges, two apiece.
      if (twist === 'gears')
        (this.district.lifts ?? []).forEach((lift, i) => {
          for (const dx of [16, lift.w - 16])
            this.coins.push({
              x: 0,
              y: lift.y - 10,
              vx: 0,
              vy: 0,
              life: Infinity,
              ride: { lift: i, dx },
            })
        })
      this.bonusTotal = this.coins.length
      this.bonusFeed = 0
    } else {
      this.bonusTotal = 24
      this.bonusFeed = 24
      this.bonusTimer = 30
    }
    const sub = {
      static: 'GRAB EVERY COIN',
      sprinkler: 'COINS FROM THE SPRINKLERS',
      bubbles: 'COINS RIDING THE SUDS',
      ice: 'EVERY FLOOR IS ICE',
      steam: 'COINS ON THE STEAM',
      gears: 'COINS ON THE GEARS',
    }[twist]
    this.banner = { text: 'BONUS ROUND', sub, ticks: 120 }
  }

  private startWorkshop() {
    this.workshop = { cursor: 0, t: 0, bought: [] }
    this.banner = null
    this.sound.play('start')
  }

  private release() {
    const kind = this.queue.shift()
    if (!kind) return
    const pipe =
      TOP_PIPES[this.route >= 0 ? this.route : this.critters.length % 2]!
    this.critters.push(this.makeCritter(kind, pipe.x, pipe.y, pipe.dir))
    this.sound.play('warn')
  }

  private makeCritter(kind: Kind, x: number, y: number, dir: number): Critter {
    return {
      kind,
      x,
      y,
      vx: 0,
      vy: 0,
      dir,
      onGround: false,
      flipped: 0,
      angry: false,
      armored: kind === 'knight',
      tier: 0,
      rush: false,
      kicked: false,
      slide: 0,
      hits: 0,
      hop: kind === 'moth' ? 150 : 40,
      squash: 0,
      trapped: 0,
      flying: kind === 'moth',
      size: 6,
      mode: 0,
    }
  }

  // --- the board ------------------------------------------------------------------

  /** This tick's solid ledges: the district's, minus drooping vines and fallen crumble, plus lifts. */
  private refreshBoard() {
    const d = this.district
    const board = d.segments.filter(
      (seg, i) =>
        !((this.vines.get(i)?.down ?? 0) > 0) &&
        !((this.crumbles.get(seg)?.down ?? 0) > 0),
    )
    this.liftLefts = (d.lifts ?? []).map((lift) => liftX(lift, this.tick))
    ;(d.lifts ?? []).forEach((lift, i) => {
      board.push({
        x0: this.liftLefts[i]!,
        x1: this.liftLefts[i]! + lift.w,
        y: lift.y,
        kind: lift.kind,
      })
    })
    this.boardNow = board
  }

  /** Lifts and gear ledges glide; whoever stands on them rides along. Conveyors carry riders. */
  private moveLift() {
    const p = this.player
    ;(this.district.lifts ?? []).forEach((lift, i) => {
      const before = this.liftLefts[i] ?? liftX(lift, this.tick - 1)
      const dx = liftX(lift, this.tick) - before
      const riding = (x: number, y: number) =>
        Math.abs(y - lift.y) < 1 && x >= before - 4 && x <= before + lift.w + 4
      if (p.onGround && riding(p.x, p.y)) p.x = wrapX(p.x + dx)
      for (const c of this.critters)
        if (c.onGround && !c.kicked && riding(c.x, c.y)) c.x += dx
    })
    for (const seg of this.district.segments) {
      if (seg.kind !== 'conveyor' || !seg.dir) continue
      const on = (x: number, y: number) =>
        Math.abs(y - seg.y) < 1 && x > seg.x0 && x < seg.x1
      if (p.onGround && on(p.x, p.y)) p.x = wrapX(p.x + seg.dir)
      for (const c of this.critters)
        if (c.onGround && !c.kicked && c.flipped > 0 && on(c.x, c.y))
          c.x += seg.dir
    }
  }

  /** Crumble ledges give way after their third landing and rebuild ten seconds later. */
  private updateCrumbles() {
    for (const c of this.crumbles.values())
      if (c.down > 0 && --c.down === 0) c.landings = 0
    const p = this.player
    if (p.onGround && !this.wasOnGround) {
      const seg = segmentUnder(this.boardNow, p.x, PLAYER_W, p.y, 1)
      if (seg?.kind === 'crumble') {
        const c = this.crumbles.get(seg) ?? { landings: 0, down: 0 }
        c.landings++
        if (c.landings >= 3) {
          c.down = 600
          this.sound.play('boom')
          for (let x = seg.x0 + 8; x < seg.x1; x += 24)
            this.burst(x, seg.y + 4, RAMPS.rust[2])
        } else {
          this.sound.play('warn')
        }
        this.crumbles.set(seg, c)
      }
    }
    this.wasOnGround = p.onGround
  }

  /** Vines sag under a pal who lingers, then droop away for a moment. */
  private updateVines() {
    const p = this.player
    this.district.segments.forEach((s, i) => {
      if (s.kind !== 'vine') return
      const v = this.vines.get(i) ?? { sag: 0, down: 0 }
      if (v.down > 0) {
        v.down--
      } else if (
        p.onGround &&
        Math.abs(p.y - s.y) < 1 &&
        p.x > s.x0 &&
        p.x < s.x1
      ) {
        v.sag++
        if (v.sag >= 100) {
          v.sag = 0
          v.down = 90
          this.sound.play('pop')
        }
      } else {
        v.sag = Math.max(0, v.sag - 2)
      }
      this.vines.set(i, v)
    })
  }

  /** What the pal is standing on: soap and ice change the footing. */
  private footing(): 'soap' | 'ice' | null {
    const p = this.player
    if (!p.onGround) return null
    const s = segmentUnder(this.boardNow, p.x, PLAYER_W, p.y, 1)
    if (!s) return null
    if (s.kind === 'soap') return 'soap'
    const original = this.district.segments.find(
      (o) => o.y === s.y && o.x0 === s.x0 && o.x1 === s.x1,
    )
    if (
      s.kind === 'ice' ||
      (original && (this.frozen.get(original) ?? 0) > 0) ||
      (this.bonusRound > 0 && this.district.bonus === 'ice') ||
      this.thermo?.mode === 'freeze'
    )
      return 'ice'
    return null
  }

  // --- update -------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.kindShake > 0) this.kindShake--
    if (this.bump && --this.bump.ticks <= 0) this.bump = null
    if (this.chainTimer > 0 && --this.chainTimer === 0) this.chain = 0
    if (this.over) return
    if (this.lives <= 0 && !this.alive) {
      if (++this.overTimer > 100) this.over = true
      return
    }
    if (this.workshop) {
      this.updateWorkshop(this.demo ? this.workshopPilot() : input)
      return
    }
    if (this.cardTicks > 0) {
      this.cardTicks--
      if (!this.demo && (input.pressed.a || input.pressed.start))
        this.cardTicks = 0
      return
    }
    if (this.phaseDelay > 0) {
      if (--this.phaseDelay === 0) this.advance()
      return
    }
    if (!this.alive) {
      if (--this.respawn <= 0) this.revive()
      return
    }

    const controls = this.demo ? this.demoInput() : input
    this.moveLift()
    this.updateVines()
    this.updateCrumbles()
    this.refreshBoard()
    this.movePlayer(controls)
    this.updateTool(controls)
    this.updateVents()
    if (this.bonusRound > 0) {
      this.updateBonus()
      return
    }
    this.phaseTicks++
    const step = this.step()
    if (step.kind === 'boss') {
      this.bossReinforcements()
      this.updateThermostat()
    } else if (this.queue.length && --this.releaseTimer <= 0) {
      this.release()
      this.releaseTimer = Math.round(
        levelCurve(this.heat(), PIPE_CURVES.releaseEvery),
      )
    }
    this.spawnEmbers()
    this.moveCritters()
    this.moveBoss()
    this.moveBubbles()
    this.moveEmbers()
    this.moveIcicles()
    this.moveCoins()
    this.updateSpecial()
    this.collide()
    if (step.kind !== 'phase') return
    const left = this.critters.filter((c) => !c.kicked)
    if (!this.queue.length && left.length === 1 && !left[0]!.rush) {
      // The last critter of the phase sprints.
      const last = left[0]!
      last.rush = true
      last.tier = 2
      this.sound.play('warn')
      this.floaters.push({
        x: last.x,
        y: last.y - 22,
        text: 'HURRY!',
        life: 50,
      })
    }
    if (!this.queue.length && this.critters.every((c) => c.kicked)) {
      this.critters = []
      this.embers = []
      this.bubbles = []
      this.phaseDelay = 120
      this.sound.play('level')
      this.banner = { text: 'PIPES CLEAR!', ticks: 110 }
      this.fx.burst(W / 2, 150, this.fxRng, { count: 20, speed: 2.4 })
      if (step.phase === SPECIAL_PHASE) this.finishSpecial()
    }
  }

  private movePlayer(input: InputFrame) {
    const p = this.player
    const footing = this.footing()
    const accel =
      footing === 'ice'
        ? RUN_ACCEL * 0.45
        : footing === 'soap'
          ? RUN_ACCEL * 0.7
          : RUN_ACCEL
    if (input.held.left) {
      p.vx -= accel
      p.face = -1
    } else if (input.held.right) {
      p.vx += accel
      p.face = 1
    } else {
      p.vx *=
        footing === 'ice' ? 0.985 : footing === 'soap' ? 0.96 : RUN_FRICTION
    }
    p.vx = Math.max(-RUN_MAX, Math.min(RUN_MAX, p.vx))
    if ((input.pressed.a || input.pressed.up) && p.onGround) {
      p.vy = JUMP_SPEED
      p.onGround = false
      this.sound.play('blip')
    }
    p.vy += GRAVITY
    const headBefore = p.y - PLAYER_H
    p.x = wrapX(p.x + p.vx)
    p.y += p.vy
    // Head bumps from below.
    if (p.vy < 0) {
      const head = p.y - PLAYER_H
      for (const s of this.boardNow) {
        if (s.y >= 310) continue
        const underside = s.y + THICK
        if (
          headBefore >= underside &&
          head < underside &&
          p.x > s.x0 &&
          p.x < s.x1
        ) {
          p.y = underside + PLAYER_H
          p.vy = 1
          this.bumpAt(p.x, s.y)
          break
        }
      }
      const kb = this.district.kindBlock
      const under = kb.y + KIND_H
      if (
        this.kindBlockUses > 0 &&
        headBefore >= under &&
        head < under &&
        p.x > kb.x - 4 &&
        p.x < kb.x + KIND_W + 4
      ) {
        p.y = under + PLAYER_H
        p.vy = 1
        this.kindBlock()
      }
    }
    // Land on floors.
    p.onGround = false
    if (p.vy >= 0) {
      const s = segmentUnder(
        this.boardNow,
        p.x,
        PLAYER_W,
        p.y,
        Math.max(4, p.vy + 1),
      )
      if (s && p.y - p.vy <= s.y + 1) {
        p.y = s.y
        p.vy = 0
        p.onGround = true
      }
    }
    if (p.y > H + 20) Object.assign(p, { y: 310, vy: 0 })
    p.run += Math.abs(p.vx) * 0.25
    if (this.invuln > 0) this.invuln--
  }

  /** How far a bump reaches along the floor: the Wide Wrench triples it. */
  private bumpReach(): number {
    return this.tool?.kind === 'wrench' ? BUMP_REACH * 3 : BUMP_REACH
  }

  private bumpAt(x: number, floorY: number) {
    const reach = this.bumpReach()
    this.bump = { x, y: floorY, ticks: BUMP_TICKS, reach }
    this.sound.play('pop')
    this.fx.burst(x, floorY + THICK, this.fxRng, {
      count: 4,
      speed: 0.9,
      colours: [RAMPS.teal[4], RAMPS.steel[4]],
    })
    for (const c of [...this.critters]) {
      if (c.kicked || !c.onGround || c.trapped > 0) continue
      if (Math.abs(c.y - floorY) > 2 || Math.abs(c.x - x) > reach) continue
      this.hitCritter(c)
    }
    // Embers resting on or just above this ledge are snuffed from below.
    for (const e of this.embers) {
      if (e.life <= 0 || e.tell > 0) continue
      const above = floorY - e.y
      if (Math.abs(e.x - x) <= reach + 6 && above >= -2 && above <= 26) {
        e.life = 0
        this.addScore(e.kind === 'spark' ? 1000 : 500, e.x, e.y - 10)
        this.sound.play('extra')
        this.burst(e.x, e.y, RAMPS.ember[3])
      }
    }
    // A leaky joint in this ledge is knocked shut.
    for (const leak of this.leaks) {
      if (leak.sealed || leak.y !== floorY || Math.abs(leak.x - x) > reach)
        continue
      leak.sealed = true
      this.addScore(1000, leak.x, leak.y - 20)
      this.sound.play('extra')
      this.fx.burst(leak.x, leak.y - 4, this.fxRng, {
        count: 10,
        colours: [RAMPS.water[4], RAMPS.water[3], '#ffffff'],
      })
    }
    // Icicles under this ledge shatter harmlessly.
    for (const ice of this.icicles) {
      if (ice.y !== floorY || Math.abs(ice.x - x) > reach) continue
      if (ice.state !== 'grow' && ice.state !== 'shake') continue
      if (ice.grow < ICICLE_GROW * 0.3) continue
      this.shatterIcicle(ice)
      this.addScore(300, ice.x, ice.y + 20)
    }
    // Thaw Run: three bumps free a frozen pal from its block.
    for (const b of this.blocks) {
      if (b.freed || b.y !== floorY || Math.abs(b.x - x) > reach) continue
      b.hits++
      this.sound.play('pop')
      if (b.hits >= 3) {
        b.freed = true
        this.addScore(1000, b.x, b.y - 24)
        this.sound.play('extra')
        this.fx.burst(b.x, b.y - 10, this.fxRng, {
          count: 14,
          colours: [RAMPS.water[4], RAMPS.teal[3], '#ffffff'],
        })
      }
    }
    // Pressure Valves: a bump vents the gauge back to zero.
    for (const gauge of this.gauges) {
      if (gauge.burst || gauge.y !== floorY || Math.abs(gauge.x - x) > reach)
        continue
      if (gauge.p > 0.2) this.addScore(300, gauge.x, gauge.y - 24)
      gauge.p = 0
      this.fx.burst(gauge.x, gauge.y - 14, this.fxRng, {
        count: 8,
        colours: ['#ffffff', RAMPS.steel[4]],
      })
    }
    // Valve Routing: a bump on a wheel switches the pipe critters come out of.
    for (const wheel of this.wheels) {
      if (wheel.y !== floorY || Math.abs(wheel.x - x) > reach) continue
      this.route = this.route === 0 ? 1 : 0
      this.sound.play('blip')
      this.floaters.push({
        x: wheel.x,
        y: wheel.y - 26,
        text: this.route === 0 ? '< LEFT PIPE' : 'RIGHT PIPE >',
        life: 60,
      })
    }
    // The Thermostat: bump the ledge its needle has lit.
    const th = this.thermo
    if (th && th.targetT <= THERMO_ARMED) {
      const seg = this.thermoLedges()[th.target]
      if (seg && seg.y === floorY && x > seg.x0 - 8 && x < seg.x1 + 8)
        this.hitThermostat()
    }
    // A soapy ledge blows a bubble up from the bump.
    const ledge = segmentUnder(this.boardNow, x, 1, floorY, 1)
    if (ledge?.kind === 'soap' && this.bubbles.length < 6) {
      this.bubbles.push({ x, y: floorY - 10, vx: 0, vy: -0.7, life: 160 })
    }
    // The Big Shell: three quick bumps under it tip it over.
    const b = this.boss
    if (
      b &&
      (b.state === 'walk' || b.state === 'roll') &&
      b.y === floorY &&
      Math.abs(b.x - x) <= BOSS_HALF + reach / 2
    ) {
      b.tipHits++
      b.tipTimer = 150
      b.flash = 8
      this.kindShake = Math.max(this.kindShake, 6)
      this.sound.play('boom')
      if (b.tipHits >= 3) {
        b.state = 'tipped'
        b.t = b.hp === 1 ? 220 : 300
        b.tipHits = 0
        this.addScore(500, b.x, b.y - 40)
        this.banner = { text: 'TIPPED!', sub: 'KICK IT NOW', ticks: 70 }
      }
    }
    // Bumping a coin from below collects it.
    for (const coin of this.coins) {
      if (
        Math.abs(coin.y - (floorY - 10)) < 8 &&
        Math.abs(coin.x - x) < reach
      ) {
        coin.life = 0
        this.gotCoin(coin.x, coin.y)
      }
    }
  }

  private hitCritter(c: Critter) {
    if ((c.kind === 'flea' || c.kind === 'moth') && !c.onGround) return
    if (c.kind === 'moth' && c.flying) return
    if (c.kind === 'frost') {
      // One bump shatters a frost bot: no kick needed.
      this.shatter(c)
      return
    }
    if (c.kind === 'snowball') {
      if (c.size < 10) this.shatter(c)
      else {
        c.vy = -2.5
        this.floaters.push({ x: c.x, y: c.y - 24, text: 'TOO BIG!', life: 40 })
      }
      return
    }
    // A gear bug only flips while it is paused, winding down.
    if (c.kind === 'gearbug' && c.mode !== 1 && c.flipped === 0) return
    if (c.flipped > 0) {
      // Bumping a flipped critter rights it again.
      c.flipped = 0
      c.vy = -2.5
      return
    }
    c.hits++
    if (c.kind === 'crab' && !c.angry) {
      c.angry = true
      c.tier = Math.max(c.tier, 1) as Tier
      c.vy = -2.5
      this.addScore(10, c.x, c.y - 14)
      return
    }
    if (c.kind === 'knight' && c.armored) {
      // The armour flies off; the bare grub underneath sprints.
      c.armored = false
      c.vy = -2.5
      this.addScore(50, c.x, c.y - 14)
      this.burst(c.x, c.y - 8, RAMPS.steel[3])
      this.sound.play('boom')
      return
    }
    const recover = Math.round(
      levelCurve(this.heat(), PIPE_CURVES.recoverTicks),
    )
    if (c.kind === 'puppet') {
      // The puppet comes apart into two loose socks, both already flipped.
      const y = c.y
      c.kicked = true
      c.slide = 0
      c.y = H + 100
      for (const dir of [-1, 1]) {
        const sock = this.makeCritter('sock', c.x + dir * 9, y, dir)
        Object.assign(sock, {
          onGround: true,
          flipped: recover,
          vy: -3,
          squash: 8,
          tier: c.tier,
        })
        this.critters.push(sock)
      }
      this.addScore(10, c.x, y - 14)
      this.sound.play('pop')
      return
    }
    c.flipped = recover
    c.vy = -3
    c.vx = 0
    c.squash = 8
    this.addScore(10, c.x, c.y - 14)
  }

  private kindBlock() {
    this.kindBlockUses--
    this.kindShake = 24
    this.sound.play('boom')
    const kb = this.district.kindBlock
    this.fx.burst(kb.x + KIND_W / 2, kb.y + KIND_H / 2, this.fxRng, {
      count: 16,
      speed: 2.2,
      colours: [RAMPS.pink[3], RAMPS.pink[4], RAMPS.gold[4]],
    })
    for (const c of [...this.critters]) {
      if (!c.kicked && c.onGround && c.trapped === 0) this.hitCritter(c)
    }
    for (const e of this.embers) if (e.tell === 0) e.life = 0
    // The whole board jolts: a walking Big Shell takes one tip from it.
    const b = this.boss
    if (b && b.state === 'walk') {
      b.tipHits++
      b.tipTimer = 150
      b.flash = 8
    }
  }

  private moveCritters() {
    const base = levelCurve(this.heat(), PIPE_CURVES.crawlerSpeed)
    for (const c of this.critters) {
      if (c.squash > 0) c.squash--
      if (c.kicked) {
        this.moveKicked(c)
        continue
      }
      if (c.trapped > 0) {
        // Floating up inside a bubble; it pops at the ceiling or when time runs out.
        c.y = Math.max(40, c.y - 0.35)
        if (--c.trapped === 0 || c.y <= 40) {
          c.trapped = 0
          c.vy = 0
          c.flying = false
          c.tier = Math.min(2, c.tier + 1) as Tier
          this.sound.play('pop')
        }
        continue
      }
      if (c.flipped > 0) {
        c.flipped--
        if (c.flipped === 0) {
          // Recovers one tier crosser and faster.
          c.tier = Math.min(2, c.tier + 1) as Tier
          c.angry = c.kind === 'crab'
          c.vy = -2
          this.sound.play('warn')
        }
      }
      if (c.kind === 'moth' && c.flipped === 0 && c.flying) {
        // On the wing: a wavering flight, then it settles on a ledge to rest.
        c.vx = c.dir * 1.1 * TIER_SPEED[c.tier]
        c.vy = Math.sin((this.tick + c.x) / 18) * 0.8
        c.x = wrapX(c.x + c.vx)
        c.y = Math.max(50, Math.min(296, c.y + c.vy))
        c.onGround = false
        if (--c.hop <= 0) {
          c.flying = false
          c.hop = Math.max(50, 120 - c.tier * 25)
          c.vy = 0
        }
        continue
      }
      let speed =
        c.flipped > 0
          ? 0
          : base *
            TIER_SPEED[c.tier] *
            (c.rush ? RUSH_SPEED : 1) *
            (c.kind === 'crab' && c.angry ? 1.25 : 1) *
            (c.kind === 'knight' && !c.armored ? 1.5 : 1) *
            (c.kind === 'sock' ? 1.2 : 1) *
            (c.kind === 'frost' ? 0.85 : 1) *
            (c.kind === 'snowball' ? 1.3 : 1)
      if (c.kind === 'flea' && c.flipped === 0) {
        // Fleas wait, then spring forward in an arc.
        if (c.onGround) {
          speed = 0
          if (--c.hop <= 0) {
            c.vy = -5.2
            c.hop = Math.max(24, 70 - c.tier * 16)
            c.onGround = false
          }
        } else {
          speed = 1.5 * TIER_SPEED[c.tier]
        }
      }
      if (c.kind === 'gearbug' && c.flipped === 0) {
        // Wind up slowly, pause (the only time it can be flipped), then dash.
        if (--c.hop <= 0) {
          c.mode = (c.mode + 1) % 3
          c.hop = c.mode === 0 ? 110 : c.mode === 1 ? 64 : 44
          if (c.mode === 2) this.sound.play('blip')
        }
        speed =
          c.mode === 1
            ? 0
            : c.mode === 2
              ? 2 + 0.3 * c.tier
              : base * 0.5 * TIER_SPEED[c.tier]
      }
      if (c.kind === 'snowball' && c.flipped === 0)
        c.size = Math.min(14, c.size + 0.008 * TIER_SPEED[c.tier])
      if (c.kind === 'frost' && c.onGround && c.flipped === 0) {
        // Frost bots ice over the ledge they walk, and re-ice any thawing block.
        const seg = this.district.segments.find(
          (o) => Math.abs(o.y - c.y) < 1 && c.x > o.x0 && c.x < o.x1,
        )
        if (seg && seg.y < 310) this.frozen.set(seg, 600)
        for (const b of this.blocks)
          if (
            !b.freed &&
            b.hits > 0 &&
            Math.abs(b.y - c.y) < 1 &&
            Math.abs(b.x - c.x) < 12
          )
            b.hits = 0
      }
      if (c.kind === 'moth' && c.flipped === 0) {
        // Resting: still, wings down, then off it goes again.
        speed = 0
        if (c.onGround && --c.hop <= 0) {
          c.flying = true
          c.hop = 150 + Math.floor(this.rng() * 90)
          c.vy = -2
          c.onGround = false
          continue
        }
      }
      // However the bonuses stack, a walker never outruns a running pal by much.
      c.vx = c.dir * Math.min(speed, MAX_WALK)
      c.vy += GRAVITY
      c.x += c.vx
      c.y += c.vy
      c.onGround = false
      if (c.vy >= 0) {
        const s = segmentUnder(
          this.boardNow,
          c.x,
          CRITTER_W,
          c.y,
          Math.max(4, c.vy + 1),
        )
        if (s && c.y - c.vy <= s.y + 1) {
          c.y = s.y
          c.vy = 0
          c.onGround = true
        }
      }
      // On the bottom floor, critters leave through the bottom pipes and
      // come back out of the top ones.
      // (A hopping flea counts as on the bottom floor while it is still low.)
      if (c.y >= 280 && (c.x < 6 || c.x > W - 6)) {
        const pipe = c.x < 6 ? TOP_PIPES[1]! : TOP_PIPES[0]!
        Object.assign(c, { x: pipe.x, y: pipe.y, vy: 0, dir: pipe.dir })
        if (c.kind === 'moth') Object.assign(c, { flying: true, hop: 150 })
        if (c.kind === 'snowball') c.size = 6
        continue
      }
      if (c.y > H + 20) Object.assign(c, { y: 310, vy: 0 })
      c.x = wrapX(c.x)
    }
    // Walkers that meet turn round.
    const walkers = this.critters.filter(
      (c) => !c.kicked && c.onGround && c.flipped === 0 && c.trapped === 0,
    )
    for (let i = 0; i < walkers.length; i++)
      for (let j = i + 1; j < walkers.length; j++) {
        const a = walkers[i]!
        const b = walkers[j]!
        if (!walkersMeet(a, b)) continue
        a.dir = -a.dir
        b.dir = -b.dir
      }
    this.critters = this.critters.filter((c) => !(c.kicked && c.y > H + 30))
  }

  /** A kicked critter bowls along its ledge, then pops off the board. */
  private moveKicked(c: Critter) {
    if (c.slide > 0) {
      c.slide--
      c.x += c.vx
      const ledge = segmentUnder(this.boardNow, c.x, 2, c.y, 2)
      if (!ledge || c.x < 2 || c.x > W - 2) c.slide = 0
      // Bowling: flipped critters in the way go with it, an upright one stops it.
      for (const o of this.critters) {
        if (o === c || o.kicked || !o.onGround || o.trapped > 0) continue
        if (Math.abs(o.y - c.y) > 2 || Math.abs(o.x - c.x) > CRITTER_W - 4)
          continue
        if (o.flipped > 0) {
          this.kick(o, Math.sign(c.vx) || 1)
        } else {
          this.hitCritter(o)
          c.slide = 0
        }
      }
      if (c.slide === 0) {
        c.vy = -4
        c.vx = Math.sign(c.vx) * 2.5
      }
      return
    }
    c.vy += GRAVITY
    c.y += c.vy
    c.x += c.vx
  }

  private kick(c: Critter, dir: number) {
    const grounded = c.onGround && c.trapped === 0
    c.kicked = true
    c.flipped = 0
    c.trapped = 0
    c.squash = 8
    c.vx = dir * (grounded ? BOWL_SPEED : 2.5)
    c.vy = grounded ? 0 : -4
    c.slide = grounded ? (this.tool?.kind === 'boots' ? W : BOWL_TICKS) : 0
    this.chain = this.chainTimer > 0 ? this.chain + 1 : 1
    this.chainTimer = CHAIN_WINDOW
    this.bestChain = Math.max(this.bestChain, this.chain)
    this.addScore(chainPoints(this.chain), c.x, c.y - 14)
    if (this.chain > 1) {
      this.floaters.push({
        x: c.x,
        y: c.y - 26,
        text: `CHAIN ${this.chain}`,
        life: 50,
      })
    }
    this.sound.play('extra')
    this.burst(c.x, c.y - 6, c.kind === 'crab' ? '#f87171' : '#a3e635')
    this.fx.burst(c.x, c.y - 6, this.fxRng, { count: 12 })
    // Every kick sends a coin out of a pipe (two with the Lucky Pipe), and every few a tool.
    for (let i = 0; i < (this.lucky ? 2 : 1); i++) {
      const pipe = TOP_PIPES[Math.floor(this.rng() * 2)]!
      this.coins.push({
        x: pipe.x,
        y: pipe.y,
        vx: pipe.dir * (1.2 + i * 0.4),
        vy: 0,
        life: 900,
      })
    }
    this.kicks++
    if (this.kicks % TOOL_EVERY_KICKS === 0) {
      const pipe = TOP_PIPES[Math.floor(this.rng() * 2)]!
      this.pickups.push({
        x: pipe.x,
        y: pipe.y,
        vx: pipe.dir * 1,
        vy: 0,
        life: 720,
        kind: TOOL_KINDS[Math.floor(this.rng() * TOOL_KINDS.length)]!,
      })
    }
  }

  // --- the Big Shell --------------------------------------------------------------

  private bossReinforcements() {
    if (!this.boss) return
    if (--this.bossTimer > 0) return
    this.bossTimer = this.boss.hp === 1 ? 300 : 420
    if (this.critters.filter((c) => !c.kicked).length < 3) {
      this.queue.push('crawler')
      this.release()
    }
  }

  private moveBoss() {
    const b = this.boss
    if (!b) return
    b.t++
    if (b.flash > 0) b.flash--
    if (b.tipTimer > 0 && --b.tipTimer === 0) b.tipHits = 0
    const speed = 0.55 + 0.25 * (b.maxHp - b.hp)
    if (b.state === 'leap') {
      b.vy += GRAVITY
      b.x += b.vx
      b.y += b.vy
      const t = b.target!
      if (b.vy > 0 && b.y >= t.y) {
        b.y = t.y
        b.vy = 0
        b.vx = 0
        b.seg = t
        b.target = null
        b.state = 'walk'
        b.t = 0
        this.kindShake = 14
        this.sound.play('boom')
      }
    } else if (b.state === 'walk' || b.state === 'roll') {
      const v = b.state === 'roll' ? 2.8 : speed
      b.x += b.dir * v
      const lo = b.seg.x0 + BOSS_HALF
      const hi = b.seg.x1 - BOSS_HALF
      if (b.x < lo || b.x > hi) {
        b.x = Math.max(lo, Math.min(hi, b.x))
        b.dir = -b.dir
        if (b.state === 'roll' && ++b.rolls >= 4) {
          b.state = 'walk'
          b.t = 0
        }
      }
      if (
        b.state === 'walk' &&
        b.t > Math.max(150, 260 - 50 * (b.maxHp - b.hp))
      ) {
        if (b.hp === 1 && b.rolls === 0) {
          // Last legs: it curls up and rolls along its ledge, then leaps.
          b.state = 'roll'
          this.sound.play('warn')
        } else {
          b.rolls = 0
          this.bossLeap()
        }
        b.t = 0
      }
    } else if (b.state === 'tipped') {
      if (--b.t <= 0) this.bossRights()
    } else if (b.state === 'down') {
      b.x += b.vx
      b.vx *= 0.94
      b.x = Math.max(b.seg.x0 + BOSS_HALF, Math.min(b.seg.x1 - BOSS_HALF, b.x))
      if (--b.t <= 0) this.bossRights()
    }
  }

  private bossLeap() {
    const b = this.boss!
    const options = this.bossLedges().filter((s) => s !== b.seg)
    const target = options[Math.floor(this.rng() * options.length)] ?? b.seg
    const tx = Math.max(
      target.x0 + BOSS_HALF,
      Math.min(target.x1 - BOSS_HALF, b.x + (this.rng() - 0.5) * 80),
    )
    const ticks = 56
    b.target = target
    b.vx = (tx - b.x) / ticks
    b.vy = (target.y - b.y) / ticks - 0.5 * GRAVITY * ticks
    b.state = 'leap'
    b.dir = Math.sign(b.vx) || b.dir
  }

  /** The Big Shell rights itself and sheds two crawlers from under its shell. */
  private bossRights() {
    const b = this.boss!
    b.state = 'walk'
    b.t = 0
    b.tipHits = 0
    for (const dir of [-1, 1]) {
      const c = this.makeCritter(
        'crawler',
        b.x + dir * (BOSS_HALF + 6),
        b.y - 6,
        dir,
      )
      c.tier = 1
      this.critters.push(c)
    }
    this.sound.play('warn')
  }

  private hitBoss() {
    const b = this.boss!
    b.hp--
    b.flash = 16
    this.addScore(5000, b.x, b.y - 40)
    this.burst(b.x, b.y - 14, RAMPS.gold[3])
    this.fx.burst(b.x, b.y - 14, this.fxRng, { count: 18, speed: 2.4 })
    this.sound.play('boom')
    if (b.hp <= 0) {
      this.bossDefeated()
      return
    }
    b.state = 'down'
    b.t = 50
    b.vx = this.player.face * 3
    this.invuln = Math.max(this.invuln, 60)
  }

  private bossDefeated() {
    const b = this.boss!
    this.boss = null
    this.addScore(20_000, b.x, b.y - 50)
    for (const c of this.critters) {
      if (c.kicked) continue
      c.kicked = true
      c.slide = 0
      c.vy = -4
      c.vx = c.x < W / 2 ? -2 : 2
    }
    for (let i = 0; i < 5; i++)
      this.fx.burst(b.x + (i - 2) * 16, b.y - 16, this.fxRng, {
        count: 16,
        speed: 2.8,
      })
    this.banner = {
      text: 'SHELL SHOCKED!',
      sub: 'THE BIG SHELL IS BEATEN',
      ticks: 160,
    }
    this.sound.play('level')
    this.phaseDelay = 170
  }

  private spawnEmbers() {
    const step = this.step()
    if (step.kind !== 'phase') return
    const rate = this.district.emberRate ?? 1
    if (this.level >= SPARKS_FROM && --this.sparkTimer <= 0) {
      this.sparkTimer = Math.round(
        levelCurve(this.heat(), PIPE_CURVES.sparkEvery) / rate,
      )
      const live = this.embers.filter((e) => e.kind === 'spark').length
      if (live < (this.heat() >= 8 ? 2 : 1) + (rate > 1 ? 1 : 0)) {
        const left = this.rng() < 0.5
        this.embers.push({
          kind: 'spark',
          x: left ? 10 : W - 10,
          y: 60 + Math.floor(this.rng() * 200),
          vx: left ? 1.1 : -1.1,
          vy: this.rng() < 0.5 ? 1 : -1,
          life: 60 * 14,
          tell: HAZARD_TELL,
        })
      }
    }
    // The cuckoo pops out of the clock on the hour and swoops along one floor.
    if (this.district.cuckoo && --this.cuckooTimer <= 0) {
      this.cuckooTimer = 60 * 13
      const fromLeft = this.rng() < 0.5
      const floor = this.rng() < 0.5 ? 244 : 178
      this.embers.push({
        kind: 'cuckoo',
        x: fromLeft ? -10 : W + 10,
        y: floor - 12,
        vx: fromLeft ? 2.4 : -2.4,
        vy: 0,
        life: 60 * 10,
        tell: 70,
      })
      this.sound.play('warn')
    }
    // A pal who lingers gets a lurker ember sliding in along their floor.
    if (this.level >= 2 && this.phaseTicks > this.lurkerTimer) {
      this.lurkerTimer = this.phaseTicks + 60 * 12
      const left = this.player.x > W / 2
      this.embers.push({
        kind: 'lurker',
        x: left ? 6 : W - 6,
        y: this.floorOf(this.player.y),
        vx: left ? 1.3 : -1.3,
        vy: 0,
        life: 60 * 12,
        tell: HAZARD_TELL,
      })
    }
  }

  private moveEmbers() {
    for (const e of this.embers) {
      if (e.tell > 0) {
        e.tell--
        continue
      }
      e.life--
      e.x += e.vx
      if (e.kind === 'spark') {
        e.y += e.vy
        if (e.x < 8 || e.x > W - 8) e.vx = -e.vx
        if (e.y < 34 || e.y > 302) e.vy = -e.vy
      } else if (e.kind === 'cuckoo') {
        e.y += Math.sin((this.tick + e.x) / 10) * 0.6
        if (e.x < -16 || e.x > W + 16) e.life = 0
      } else if (e.x < -8 || e.x > W + 8) {
        e.life = 0
      }
    }
    this.embers = this.embers.filter((e) => e.life > 0)
  }

  // --- special phases ---------------------------------------------------------------

  private updateSpecial() {
    const p = this.player
    for (const leak of this.leaks) {
      if (leak.sealed) continue
      leak.t++
      // A spray knocks a pal sideways; it never hurts.
      if (
        this.spraying(leak) &&
        Math.abs(p.x - leak.x) < 10 &&
        p.y <= leak.y + 1 &&
        p.y > leak.y - 44
      ) {
        p.vx = (p.x >= leak.x ? 1 : -1) * 3.2
        if (this.tick % 12 === 0) this.sound.play('blip')
      }
    }
    for (const gauge of this.gauges) {
      if (gauge.burst) continue
      gauge.p += gauge.rate
      if (gauge.p >= 1) {
        gauge.burst = true
        this.sound.play('boom')
        this.kindShake = 14
        this.burst(gauge.x, gauge.y - 12, '#ffffff')
        this.floaters.push({
          x: gauge.x,
          y: gauge.y - 30,
          text: 'BURST!',
          life: 60,
        })
      }
    }
    for (const s of this.seedlings) {
      if (s.state !== 'potted') {
        s.t++
        continue
      }
      if (this.touchingPlayer(s.x, s.y - 8, 12, 16)) {
        s.state = 'rescued'
        this.addScore(500, s.x, s.y - 20)
        this.sound.play('pickup')
        this.fx.burst(s.x, s.y - 8, this.fxRng, {
          count: 10,
          colours: [RAMPS.leaf[4], RAMPS.leaf[3], RAMPS.pink[3]],
        })
        continue
      }
      const trampler = this.critters.find(
        (c) =>
          !c.kicked &&
          c.onGround &&
          c.flipped === 0 &&
          c.trapped === 0 &&
          Math.abs(c.y - s.y) < 1 &&
          Math.abs(c.x - s.x) < 8,
      )
      if (trampler) {
        s.state = 'trampled'
        this.burst(s.x, s.y - 6, RAMPS.earth[3])
        this.sound.play('die')
      }
    }
    if (
      this.district.special === 'lost-socks' &&
      this.step().kind === 'phase'
    ) {
      const step = this.step() as { kind: 'phase'; phase: number }
      if (
        step.phase === SPECIAL_PHASE &&
        this.socksDropped < 12 &&
        --this.sockTimer <= 0
      ) {
        this.sockTimer = 100
        const pipe = TOP_PIPES[this.socksDropped % 2]!
        this.socks.push({
          x: pipe.x,
          y: pipe.y,
          vx: pipe.dir * 1.1,
          vy: 0,
          life: 1100,
          colour: SOCK_COLOURS[Math.floor(this.rng() * SOCK_COLOURS.length)]!,
        })
        this.socksDropped++
      }
      for (const sock of this.socks) {
        this.fall(sock)
        if (sock.life !== Infinity) sock.life--
        if (!this.touchingPlayer(sock.x, sock.y, 11, 16)) continue
        sock.life = 0
        if (this.heldSock === sock.colour) {
          this.pairs++
          this.heldSock = null
          this.addScore(2000, sock.x, sock.y - 12)
          this.floaters.push({
            x: sock.x,
            y: sock.y - 26,
            text: 'PAIR!',
            life: 50,
          })
          this.sound.play('extra')
        } else {
          if (this.heldSock)
            this.floaters.push({
              x: sock.x,
              y: sock.y - 26,
              text: 'ODD SOCK',
              life: 40,
            })
          this.heldSock = sock.colour
          this.sound.play('pickup')
        }
      }
      this.socks = this.socks.filter((s) => s.life > 0)
    }
  }

  /** Shatter a critter on the spot (frost bots, small snowballs): it counts as a kick. */
  private shatter(c: Critter) {
    c.onGround = false
    this.kick(c, this.player.x < c.x ? 1 : -1)
    this.burst(c.x, c.y - 6, RAMPS.water[4])
    this.fx.burst(c.x, c.y - 6, this.fxRng, {
      count: 10,
      colours: [RAMPS.water[4], '#ffffff', RAMPS.sky[3]],
    })
  }

  private shatterIcicle(ice: Icicle) {
    const y = ice.state === 'fall' ? ice.fy + 10 : ice.y + 14
    ice.state = 'gone'
    ice.t = 300
    this.sound.play('pop')
    this.burst(ice.x, y, RAMPS.water[4])
  }

  /** Icicles grow under their ledge, shake (the tell), drop, and grow back. */
  private moveIcicles() {
    for (const ice of this.icicles) {
      if (ice.state === 'gone') {
        if (--ice.t <= 0) Object.assign(ice, { state: 'grow', grow: 0 })
        continue
      }
      if (ice.state === 'grow') {
        ice.grow++
        if (ice.grow >= ICICLE_GROW)
          Object.assign(ice, { state: 'shake', t: ICICLE_SHAKE })
        continue
      }
      if (ice.state === 'shake') {
        if (--ice.t <= 0)
          Object.assign(ice, { state: 'fall', fy: ice.y + THICK, vy: 0 })
        if (ice.t === ICICLE_SHAKE - 1) this.sound.play('warn')
        continue
      }
      ice.vy = Math.min(7, ice.vy + GRAVITY)
      ice.fy += ice.vy
      const tip = ice.fy + 14
      const land = segmentUnder(
        this.boardNow,
        ice.x,
        2,
        tip,
        Math.max(4, ice.vy + 1),
      )
      if ((land && land.y > ice.y) || tip > H) {
        this.shatterIcicle(ice)
        ice.fy = tip
      }
    }
  }

  /** Steam vents puff on a beat: whoever stands in the puff is thrown upward. */
  private updateVents() {
    const vents = this.district.vents ?? []
    const p = this.player
    vents.forEach((vent, i) => {
      if (!this.ventPuffing(vent, i)) return
      const inPuff = (x: number, y: number) =>
        Math.abs(x - vent.x) < 11 && y <= vent.y + 1 && y > vent.y - 40
      if (inPuff(p.x, p.y) && p.vy >= 0) {
        p.vy = -8.2
        p.onGround = false
        this.sound.play('blip')
      }
      for (const c of this.critters)
        if (!c.kicked && c.trapped === 0 && c.onGround && inPuff(c.x, c.y)) {
          c.vy = -5.5
          c.onGround = false
        }
    })
    // A burst gauge vents steam on its spot until the phase ends.
    for (const gauge of this.gauges) {
      if (!gauge.burst) continue
      if (
        Math.abs(p.x - gauge.x) < 11 &&
        p.y <= gauge.y + 1 &&
        p.y > gauge.y - 40 &&
        p.vy >= 0
      ) {
        p.vy = -7
        p.onGround = false
      }
    }
  }

  private ventPuffing(vent: Spot, i: number): boolean {
    const t = (this.tick + i * 50) % VENT_PERIOD
    return t >= VENT_PERIOD - VENT_PUFF
  }

  private ventHissing(vent: Spot, i: number): boolean {
    const t = (this.tick + i * 50) % VENT_PERIOD
    return (
      t >= VENT_PERIOD - VENT_PUFF - VENT_TELL && t < VENT_PERIOD - VENT_PUFF
    )
  }

  // --- the Thermostat ------------------------------------------------------------

  private startThermostat() {
    this.thermo = {
      hp: 9,
      maxHp: 9,
      mode: 'freeze',
      modeT: 480,
      target: 0,
      targetT: 100,
      flash: 0,
      spawnT: 120,
    }
    this.invuln = 120
    this.banner = {
      text: 'THE THERMOSTAT',
      sub: 'BUMP THE LEDGE ITS NEEDLE LIGHTS',
      ticks: 170,
    }
    this.sound.play('warn')
  }

  /** The ledges the needle can point at: every ledge above the floor. */
  private thermoLedges(): Segment[] {
    return this.district.segments.filter((s) => s.y < 310)
  }

  /** 1, 2 or 3: each third of its health it spins faster. */
  private thermoStage(): number {
    const t = this.thermo!
    return Math.min(3, 1 + Math.floor(((t.maxHp - t.hp) / t.maxHp) * 3))
  }

  private updateThermostat() {
    const t = this.thermo
    if (!t) return
    if (t.flash > 0) t.flash--
    const stage = this.thermoStage()
    if (--t.modeT <= 0) {
      t.mode = t.mode === 'freeze' ? 'heat' : 'freeze'
      t.modeT = [480, 380, 300][stage - 1]!
      this.sound.play('warn')
      this.banner = {
        text: t.mode === 'freeze' ? 'FREEZE!' : 'HEAT!',
        ticks: 60,
      }
    }
    if (--t.targetT <= 0) {
      const ledges = this.thermoLedges()
      t.target =
        (t.target + 1 + Math.floor(this.rng() * (ledges.length - 1))) %
        ledges.length
      t.targetT = [110, 90, 72][stage - 1]!
    }
    if (--t.spawnT <= 0) {
      t.spawnT = [260, 220, 180][stage - 1]!
      const both = stage === 3
      if (t.mode === 'freeze' || both) {
        const frost = this.critters.filter(
          (c) => !c.kicked && c.kind === 'frost',
        ).length
        if (frost < 3) {
          this.queue.push('frost')
          this.release()
        }
      }
      if (t.mode === 'heat' || both) {
        const live = this.embers.filter((e) => e.kind === 'spark').length
        if (live < 3) {
          const left = this.rng() < 0.5
          this.embers.push({
            kind: 'spark',
            x: left ? 10 : W - 10,
            y: 120 + Math.floor(this.rng() * 150),
            vx: left ? 1.2 : -1.2,
            vy: this.rng() < 0.5 ? 1.1 : -1.1,
            life: 60 * 10,
            tell: HAZARD_TELL,
          })
        }
      }
    }
  }

  private hitThermostat() {
    const t = this.thermo!
    t.hp--
    t.flash = 20
    t.targetT = 0
    this.addScore(3000, THERMO.x, THERMO.y + 40)
    this.sound.play('boom')
    this.kindShake = 16
    this.fx.burst(THERMO.x, THERMO.y, this.fxRng, { count: 18, speed: 2.4 })
    if (t.hp > 0) return
    this.thermo = null
    this.addScore(25_000, THERMO.x, THERMO.y + 50)
    for (const c of this.critters) {
      if (c.kicked) continue
      c.kicked = true
      c.slide = 0
      c.vy = -4
      c.vx = c.x < W / 2 ? -2 : 2
    }
    this.embers = []
    this.banner = {
      text: 'TEMPERATURE NORMAL',
      sub: 'THE THERMOSTAT IS FIXED',
      ticks: 170,
    }
    this.sound.play('level')
    this.phaseDelay = 180
  }

  private spraying(leak: Leak): boolean {
    return !leak.sealed && leak.t % 150 < 64
  }

  // --- tools, bubbles, coins ----------------------------------------------------------

  private updateTool(input: InputFrame) {
    const t = this.tool
    if (!t) return
    if (t.kind === 'wand' && input.pressed.b && t.charges > 0) {
      t.charges--
      const p = this.player
      this.bubbles.push({
        x: p.x + p.face * 10,
        y: p.y - PLAYER_H / 2,
        vx: p.face * 2.4,
        vy: -0.15,
        life: 90,
      })
      this.sound.play('blip')
    }
    if (t.kind === 'magnet') {
      const p = this.player
      for (const coin of this.coins) {
        const dx = p.x - coin.x
        const dy = p.y - PLAYER_H / 2 - coin.y
        const d = Math.hypot(dx, dy)
        if (d < 140 && d > 1) {
          coin.x += (dx / d) * 2.6
          coin.y += (dy / d) * 2.6
          coin.vy = 0
        }
      }
    }
    if (--t.ticks <= 0 || (t.kind === 'wand' && t.charges <= 0))
      this.tool = null
  }

  private moveBubbles() {
    for (const b of this.bubbles) {
      b.life--
      b.x += b.vx
      b.y += b.vy
      const hit = this.critters.find(
        (c) =>
          !c.kicked &&
          c.flipped === 0 &&
          c.trapped === 0 &&
          Math.abs(c.x - b.x) < 12 &&
          Math.abs(c.y - CRITTER_H / 2 - b.y) < 12,
      )
      if (hit) {
        hit.trapped = BUBBLE_TRAP_TICKS
        hit.onGround = false
        hit.flying = false
        hit.vy = 0
        b.life = 0
        this.addScore(100, hit.x, hit.y - 14)
        this.sound.play('pickup')
      }
    }
    this.bubbles = this.bubbles.filter(
      (b) => b.life > 0 && b.x > -10 && b.x < W + 10 && b.y > 30,
    )
  }

  /** Coins, tools and socks: fall and settle on ledges, or drift at their float speed. */
  private fall(coin: Coin) {
    if (coin.ride) {
      const lift = this.district.lifts?.[coin.ride.lift]
      if (lift) {
        coin.x = (this.liftLefts[coin.ride.lift] ?? lift.minX) + coin.ride.dx
        coin.y = lift.y - 10
        return
      }
    }
    if (coin.float !== undefined) {
      coin.y += coin.float
      if (coin.float < 0) {
        coin.x += Math.sin((this.tick + coin.y) / 14) * 0.4
        if (coin.y < 40) coin.life = 0
        return
      }
    } else {
      coin.vy += GRAVITY * 0.5
      coin.y += coin.vy
    }
    coin.x = wrapX(coin.x + coin.vx)
    const vy = coin.float ?? coin.vy
    const s = segmentUnder(
      this.boardNow,
      coin.x,
      8,
      coin.y + 6,
      Math.max(4, vy + 1),
    )
    if (s && vy >= 0) {
      coin.y = s.y - 6
      coin.vy = 0
      coin.float = undefined
    }
    if (coin.y > H + 10) coin.life = 0
  }

  private moveCoins() {
    for (const list of [this.coins, this.pickups] as Coin[][]) {
      for (const coin of list) {
        if (coin.life !== Infinity) coin.life--
        this.fall(coin)
      }
    }
    this.coins = this.coins.filter((c) => c.life > 0)
    this.pickups = this.pickups.filter((c) => c.life > 0)
  }

  private updateBonus() {
    this.bonusRound--
    if (this.bonusFeed > 0 && --this.bonusTimer <= 0) {
      this.bonusTimer = 26
      this.bonusFeed--
      const x = 24 + Math.floor(this.rng() * (W - 48))
      const twist = this.district.bonus
      const vents = this.district.vents ?? []
      if (twist === 'steam' && vents.length) {
        // Coins thrown up on the steam from a random vent.
        const vent = vents[Math.floor(this.rng() * vents.length)]!
        this.coins.push({
          x: vent.x,
          y: vent.y - 8,
          vx: (this.rng() - 0.5) * 2.4,
          vy: -6 - this.rng() * 2,
          life: Infinity,
        })
      } else {
        const rising = twist === 'bubbles'
        this.coins.push({
          x,
          y: rising ? 300 : 44,
          vx: 0,
          vy: 0,
          life: Infinity,
          float: rising ? -0.55 : 0.5,
        })
      }
    }
    this.moveCoins()
    this.collectCoins()
    const done = this.bonusFeed === 0 && !this.coins.length
    if (done || this.bonusRound <= 0) {
      const perfect = this.bonusGot >= this.bonusTotal
      if (perfect) {
        this.addScore(5000, W / 2, 140)
        this.fx.burst(W / 2, 150, this.fxRng, { count: 24, speed: 2.6 })
      }
      this.bonusRound = 0
      this.coins = []
      this.phaseDelay = 100
      this.sound.play('level')
      this.banner = {
        text: perfect ? 'PERFECT!' : 'TIME UP',
        sub: `${this.bonusGot} OF ${this.bonusTotal} COINS`,
        ticks: 100,
      }
    }
  }

  private touchingPlayer(x: number, y: number, rx: number, ry: number) {
    const p = this.player
    return Math.abs(x - p.x) < rx && Math.abs(y - (p.y - PLAYER_H / 2)) < ry
  }

  private gotCoin(x: number, y: number) {
    this.wallet++
    if (this.bonusRound > 0) this.bonusGot++
    this.addScore(800, x, y)
    this.sound.play('pickup')
    this.fx.burst(x, y, this.fxRng, {
      count: 8,
      colours: [RAMPS.gold[4], RAMPS.gold[3], '#ffffff'],
    })
  }

  private collectCoins() {
    for (const coin of this.coins) {
      if (!this.touchingPlayer(coin.x, coin.y, 11, 16)) continue
      coin.life = 0
      this.gotCoin(coin.x, coin.y)
    }
    this.coins = this.coins.filter((c) => c.life > 0)
    for (const tool of this.pickups) {
      if (!this.touchingPlayer(tool.x, tool.y, 12, 16)) continue
      tool.life = 0
      this.tool = {
        kind: tool.kind,
        ticks: tool.kind === 'wand' ? TOOL_TICKS * 2 : TOOL_TICKS,
        charges: tool.kind === 'wand' ? WAND_CHARGES : 0,
      }
      this.addScore(300, tool.x, tool.y - 8)
      this.floaters.push({
        x: tool.x,
        y: tool.y - 22,
        text: TOOL_NAMES[tool.kind],
        life: 60,
      })
      this.sound.play('extra')
      this.fx.burst(tool.x, tool.y, this.fxRng, { count: 12 })
    }
    this.pickups = this.pickups.filter((c) => c.life > 0)
  }

  private collide() {
    this.collectCoins()
    const p = this.player
    for (const c of this.critters) {
      if (c.kicked) continue
      const overlap =
        Math.abs(c.x - p.x) < (CRITTER_W + PLAYER_W) / 2 - 3 &&
        Math.abs(c.y - CRITTER_H / 2 - (p.y - PLAYER_H / 2)) <
          (CRITTER_H + PLAYER_H) / 2 - 3
      if (!overlap) continue
      if (c.flipped > 0 || c.trapped > 0) {
        this.kick(c, p.face)
      } else if (this.invuln <= 0) {
        this.loseLife()
        return
      }
    }
    const b = this.boss
    if (b && b.y > 0) {
      const touching =
        Math.abs(b.x - p.x) < BOSS_HALF + PLAYER_W / 2 - 4 &&
        p.y > b.y - BOSS_H - 2 &&
        p.y - PLAYER_H < b.y
      if (touching) {
        if (b.state === 'tipped') this.hitBoss()
        else if (b.state !== 'down' && this.invuln <= 0) {
          this.loseLife()
          return
        }
      }
    }
    if (this.invuln > 0) return
    for (const ice of this.icicles) {
      if (ice.state !== 'fall') continue
      if (this.touchingPlayer(ice.x, ice.fy + 6, 8, 16)) {
        this.shatterIcicle(ice)
        this.loseLife()
        return
      }
    }
    for (const e of this.embers) {
      if (e.tell > 0) continue
      if (this.touchingPlayer(e.x, e.y - 5, 10, 14)) {
        this.loseLife()
        return
      }
    }
  }

  private loseLife() {
    this.alive = false
    this.lives--
    this.respawn = 110
    this.tool = null
    this.chain = 0
    this.burst(this.player.x, this.player.y - 8, '#2dd4bf')
    this.sound.play('die')
    if (this.lives <= 0) this.banner = { text: 'GAME OVER', ticks: 9999 }
  }

  private revive() {
    Object.assign(this.player, {
      x: W / 2,
      y: 112,
      vx: 0,
      vy: 0,
      onGround: true,
    })
    this.alive = true
    this.invuln = 150
    // A fresh pal does not land in a lurker's path.
    this.embers = this.embers.filter((e) => e.kind === 'spark')
  }

  private addScore(points: number, x: number, y: number) {
    if (this.demo) return
    this.score += points
    this.floaters.push({ x, y, text: String(points), life: 45 })
    if (this.score >= this.nextExtra) {
      this.lives++
      this.nextExtra += EXTRA_LIFE_AT
      this.sound.play('extra')
      this.banner = { text: 'EXTRA PAL!', ticks: 90 }
      this.fx.burst(this.player.x, this.player.y - 10, this.fxRng, {
        count: 14,
      })
    }
  }

  private burst(x: number, y: number, color: string) {
    for (let i = 0; i < 14; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.6 + this.rng() * 2
      this.sparks.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 30,
        color,
      })
    }
  }

  private updateEffects() {
    this.fx.update()
    for (const s of this.sparks) {
      s.x += s.vx
      s.y += s.vy
      s.vy += 0.08
      s.life--
    }
    this.sparks = this.sparks.filter((s) => s.life > 0)
    for (const f of this.floaters) {
      f.y -= 0.4
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
  }

  // --- the Workshop ---------------------------------------------------------------

  private shopPrice(base: number): number {
    const next = districtAt(this.districtIndex + 1)
    return shopPrice(base, next.district.shift, next.lap)
  }

  private shopAvailable(item: ShopItemId): boolean {
    const w = this.workshop!
    if (item === 'done') return true
    if (w.bought.includes(item)) return false
    if (item === 'kind' && this.kindMax >= 4) return false
    return true
  }

  private updateWorkshop(input: InputFrame) {
    const w = this.workshop!
    w.t++
    const n = SHOP_ITEMS.length
    if (input.pressed.up) w.cursor = (w.cursor + n - 1) % n
    if (input.pressed.down) w.cursor = (w.cursor + 1) % n
    if (!(input.pressed.a || input.pressed.start) || w.t < 20) return
    const entry = SHOP_ITEMS[w.cursor]!
    if (entry.item === 'done') {
      this.workshop = null
      this.advance()
      return
    }
    const price = this.shopPrice(entry.price)
    if (!this.shopAvailable(entry.item) || this.wallet < price) {
      this.sound.play('warn')
      return
    }
    this.wallet -= price
    w.bought.push(entry.item)
    this.sound.play('extra')
    if (entry.item === 'pal') this.lives++
    else if (entry.item === 'kind') this.kindMax = 4
    else if (entry.item === 'tool')
      this.startTool = TOOL_KINDS[Math.floor(this.rng() * TOOL_KINDS.length)]!
    else if (entry.item === 'lucky') this.luckyNext = true
    else if (entry.item === 'hint') this.hintNext = true
  }

  /** The attract pilot's shopping: an extra pal if it can, a KIND charge, then back to work. */
  private workshopPilot(): InputFrame {
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
    const w = this.workshop!
    if (w.t % 24 !== 23) return frame
    const wants = (['pal', 'kind', 'done'] as ShopItemId[]).find(
      (item) =>
        item === 'done' ||
        (this.shopAvailable(item) &&
          this.wallet >=
            this.shopPrice(SHOP_ITEMS.find((s) => s.item === item)!.price)),
    )!
    const at = SHOP_ITEMS.findIndex((s) => s.item === wants)
    if (w.cursor === at) frame.pressed.a = true
    else frame.pressed.down = true
    return frame
  }

  // --- attract-mode pilot --------------------------------------------------------
  //
  // Floors are 66 px apart. To climb, the pilot stands just inside a gap in
  // the floor above, jumps straight up, and only steers onto the platform once
  // its feet are above it (steering early bonks its head on the underside).

  private floorOf(y: number): number {
    let best = 310
    for (const s of this.boardNow)
      if (Math.abs(s.y - y) < Math.abs(best - y)) best = s.y
    return best
  }

  /** Spots on my floor right under a gap in the floor above, with the side the platform is on. */
  private climbSpots(fromY: number): Array<{ x: number; dir: number }> {
    const aboveY = fromY - 66
    const spots: Array<{ x: number; dir: number }> = []
    for (const s of this.boardNow) {
      if (s.y !== aboveY) continue
      if (s.x0 > 0) spots.push({ x: s.x0 - 9, dir: 1 })
      if (s.x1 < W) spots.push({ x: s.x1 + 9, dir: -1 })
    }
    return spots.filter((spot) =>
      segmentUnder(this.boardNow, spot.x, 1, fromY, 1),
    )
  }

  private steerToward(frame: InputFrame, x: number, slack = 5) {
    const p = this.player
    if (x < p.x - slack) frame.held.left = true
    else if (x > p.x + slack) frame.held.right = true
  }

  private demoInput(): InputFrame {
    if (this.workshop) return this.workshopPilot()
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
    // Mid-climb: rise straight, then steer onto the platform near the top.
    if (this.pilotClimb && !p.onGround) {
      if (p.y < this.pilotClimb.targetY - 1) {
        if (this.pilotClimb.dir > 0) held.right = true
        else held.left = true
      }
      return frame
    }
    this.pilotClimb = null
    const myFloor = this.floorOf(p.y)
    const live = this.critters.filter((c) => !c.kicked && c.onGround)
    const boss = this.boss
    // Danger on my own floor: back away.
    const threat =
      live.find(
        (c) =>
          c.flipped === 0 &&
          c.y === myFloor &&
          Math.abs(c.x - p.x) < 34 &&
          Math.sign(c.dir) === Math.sign(p.x - c.x),
      ) ??
      // A flea in mid-hop or a moth on the wing comes down anywhere near: keep clear.
      this.critters.find(
        (c) =>
          (c.kind === 'flea' || c.kind === 'moth') &&
          !c.kicked &&
          !c.onGround &&
          c.trapped === 0 &&
          Math.abs(c.x - p.x) < 44 &&
          myFloor - c.y < 60 &&
          myFloor - c.y > -8,
      ) ??
      (boss &&
      boss.state !== 'tipped' &&
      boss.state !== 'down' &&
      boss.y === myFloor &&
      Math.abs(boss.x - p.x) < BOSS_HALF + 30
        ? boss
        : undefined)
    if (threat && this.invuln <= 0) {
      if (threat.x > p.x) held.left = true
      else held.right = true
      return frame
    }
    // A shaking or falling icicle overhead: get out from under it.
    const icicle = this.icicles.find(
      (ice) =>
        (ice.state === 'shake' || ice.state === 'fall') &&
        Math.abs(ice.x - p.x) < 16 &&
        (ice.state === 'fall' ? ice.fy : ice.y) < p.y,
    )
    if (icicle && this.invuln <= 0) {
      if (icicle.x > p.x) held.left = true
      else held.right = true
      return frame
    }
    // An ember close by: step away from it.
    const ember = this.embers.find(
      (e) =>
        e.tell === 0 &&
        Math.abs(e.x - p.x) < 40 &&
        Math.abs(e.y - (p.y - PLAYER_H / 2)) < 30,
    )
    if (ember && this.invuln <= 0) {
      if (ember.x > p.x) held.left = true
      else held.right = true
      return frame
    }
    // Pick a job: kick a flipped critter (or a tipped boss), bump a walker (or the boss) from
    // below, seal a leak, rescue a seedling, else chase a coin or a sock.
    const flipped = live
      .filter((c) => c.flipped > 0)
      .sort((a, b) => Math.abs(a.y - myFloor) - Math.abs(b.y - myFloor))[0]
    const walker = live
      .filter((c) => c.flipped === 0 && c.y < 300)
      .sort(
        (a, b) => Math.abs(a.y + 66 - myFloor) - Math.abs(b.y + 66 - myFloor),
      )[0]
    // Objectives first, but never forever: after a while it just clears the critters.
    const keen = this.phaseTicks < 60 * 45
    const th = this.thermo
    const thermoSeg = th ? this.thermoLedges()[th.target] : undefined
    const prop = keen
      ? (this.leaks.find((l) => !l.sealed) ??
        this.blocks.find((b) => !b.freed) ??
        this.gauges
          .filter((gg) => !gg.burst && gg.p > 0.45)
          .sort((a, b) => b.p - a.p)[0])
      : undefined
    const leak = prop
    const seedling = keen
      ? this.seedlings.find((s) => s.state === 'potted')
      : undefined
    const loot = this.coins[0] ?? this.socks[0]
    let goalFloor: number | null = null
    let goalX = p.x
    let jumpWhenUnder = false
    if (thermoSeg && th && th.targetT < 80) {
      goalFloor = thermoSeg.y + 66
      goalX = Math.max(thermoSeg.x0 + 10, Math.min(thermoSeg.x1 - 10, p.x))
      jumpWhenUnder = th.targetT <= THERMO_ARMED
    } else if (boss && boss.state === 'tipped' && boss.y > 0) {
      goalFloor = boss.y
      goalX = boss.x
    } else if (flipped) {
      goalFloor = flipped.y
      goalX = flipped.x
    } else if (
      boss &&
      (boss.state === 'walk' || boss.state === 'roll') &&
      boss.y > 0
    ) {
      goalFloor = boss.y + 66
      goalX = boss.x
      jumpWhenUnder = true
    } else if (leak) {
      goalFloor = leak.y + 66
      goalX = leak.x
      jumpWhenUnder = true
    } else if (seedling) {
      goalFloor = seedling.y
      goalX = seedling.x
    } else if (walker) {
      goalFloor = walker.y + 66
      goalX = walker.x
      jumpWhenUnder = true
    } else if (loot) {
      goalFloor = this.floorOf(loot.y + 10)
      goalX = loot.x
    }
    if (goalFloor === null) {
      this.steerToward(frame, W / 2)
      return frame
    }
    if (goalFloor === myFloor) {
      // Another ledge on this row: drop off toward it and climb back up beside it.
      const mine = segmentUnder(this.boardNow, p.x, 1, myFloor, 1)
      const theirs = segmentUnder(this.boardNow, goalX, 1, goalFloor, 1)
      if (mine && theirs && mine !== theirs && myFloor < 310) {
        this.steerToward(frame, goalX, 1)
        return frame
      }
      this.steerToward(frame, goalX, jumpWhenUnder ? 4 : 2)
      if (jumpWhenUnder && Math.abs(goalX - p.x) < 8) frame.pressed.a = true
      return frame
    }
    if (goalFloor < myFloor) {
      // Climb: walk to the spot under a gap that lands nearest the goal, then jump.
      const spots = this.climbSpots(myFloor)
      const cost = (x: number) => Math.abs(x - goalX) + Math.abs(x - p.x) * 0.5
      const spot = spots.sort((a, b) => cost(a.x) - cost(b.x))[0]
      if (!spot) {
        this.steerToward(frame, goalX)
        return frame
      }
      if (Math.abs(spot.x - p.x) <= 2 && Math.abs(p.vx) < 0.6) {
        frame.pressed.a = true
        this.pilotClimb = { dir: spot.dir, targetY: myFloor - 66 }
      } else {
        this.steerToward(frame, spot.x, 1)
      }
      return frame
    }
    // Descend: walk off the nearer interior edge of this floor.
    const seg = segmentUnder(this.boardNow, p.x, 1, myFloor, 1)
    if (seg) {
      const edges = [
        seg.x0 > 0 ? seg.x0 - 12 : null,
        seg.x1 < W ? seg.x1 + 12 : null,
      ].filter((x): x is number => x !== null)
      const edge = edges.sort(
        (a, b) => Math.abs(a - p.x) - Math.abs(b - p.x),
      )[0]
      this.steerToward(frame, edge ?? goalX, 1)
    }
    return frame
  }

  // --- render ----------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    if (this.workshop) {
      this.renderWorkshop(g)
      return
    }
    const shake = this.kindShake > 0 ? Math.sin(this.tick * 3) * 2 : 0
    g.save()
    g.translate(0, shake)
    g.fillStyle = RAMPS.night[0]
    g.fillRect(0, -4, W, H + 8)
    this.renderBackdrop(g)
    if (this.thermo) this.renderThermostat(g, this.thermo)
    this.renderFloors(g)
    this.renderKindBlock(g)
    this.renderSpecial(g)
    const visible =
      this.alive && !(this.invuln > 0 && Math.floor(this.invuln / 6) % 2 === 0)
    this.renderShadows(g, visible)
    for (const coin of this.coins) this.renderCoin(g, coin)
    for (const tool of this.pickups) this.renderPickup(g, tool)
    for (const sock of this.socks)
      this.renderSock(g, sock.x, sock.y, sock.colour)
    if (this.boss) this.renderBoss(g, this.boss)
    for (const c of this.critters) this.renderCritter(g, c)
    // The pipes stand in front, so critters crawl in and out of them.
    cachedLayer(g, 'pipe-pals-pipes', W, H, (k) => this.paintPipes(k))
    for (const e of this.embers) this.renderEmber(g, e)
    for (const b of this.bubbles) this.renderBubble(g, b.x, b.y, 7)
    if (visible) this.renderPlayer(g)
    for (const s of this.sparks) {
      const x = Math.round(s.x)
      const y = Math.round(s.y)
      g.globalAlpha = Math.max(0, s.life / 30)
      g.fillStyle = INK
      g.fillRect(x - 1, y - 1, 3, 3)
      g.fillStyle = s.color
      g.fillRect(x - 1, y - 1, 2, 2)
    }
    g.globalAlpha = 1
    this.fx.render(g)
    for (const f of this.floaters) {
      drawText(g, f.text, f.x, f.y, {
        align: 'center',
        color: RAMPS.gold[3],
        outline: INK,
      })
    }
    g.restore()
    vignette(g, W, H, 0.3)
    this.renderHud(g)
    if (this.cardTicks > 0) this.renderCard(g)
  }

  private renderBackdrop(g: CanvasRenderingContext2D) {
    const scene = this.district.scene
    if (scene === 'cold') {
      cachedLayer(g, 'pipe-pals-cold', W, H, paintCold)
      // Snow drifting down in the cold-room air.
      g.fillStyle = rgba('#ffffff', 0.7)
      for (let i = 0; i < 26; i++) {
        const x = (i * 53 + Math.sin((this.tick + i * 30) / 40) * 10 + W) % W
        const y = (this.tick * (0.3 + (i % 3) * 0.15) + i * 41) % 300
        g.fillRect(Math.round(x), Math.round(y), 1, 1)
      }
      return
    }
    if (scene === 'boiler') {
      cachedLayer(g, 'pipe-pals-boiler', W, H, paintBoiler)
      glow(
        g,
        W / 2,
        300,
        70,
        RAMPS.ember[3],
        0.18 + 0.08 * Math.sin(this.tick / 7),
      )
      return
    }
    if (scene === 'clock') {
      cachedLayer(g, 'pipe-pals-clock', W, H, paintClock)
      // The clock's hands.
      const minute = (this.tick / 600) * Math.PI * 2 - Math.PI / 2
      const hour = minute / 12
      g.fillStyle = INK
      for (let r = 0; r < 16; r++)
        g.fillRect(
          Math.round(W / 2 + Math.cos(minute) * r),
          Math.round(46 + Math.sin(minute) * r),
          1,
          1,
        )
      for (let r = 0; r < 10; r++)
        g.fillRect(
          Math.round(W / 2 + Math.cos(hour) * r),
          Math.round(46 + Math.sin(hour) * r),
          2,
          2,
        )
      return
    }
    if (scene === 'greenhouse') {
      cachedLayer(g, 'pipe-pals-greenhouse', W, H, paintGreenhouse)
      // Sprinkler drips falling past the glass.
      g.fillStyle = rgba(RAMPS.water[4], 0.5)
      for (let i = 0; i < 14; i++) {
        const x = 30 + ((i * 64) % W) + (i % 3) * 7
        const y = 40 + ((this.tick * 1.6 + i * 37) % 270)
        g.fillRect(x, Math.round(y), 1, 3)
      }
      return
    }
    if (scene === 'laundry') {
      cachedLayer(g, 'pipe-pals-laundry', W, H, paintLaundry)
      // Suds drifting up the back wall.
      g.save()
      g.globalAlpha = 0.3
      for (let i = 0; i < 10; i++) {
        const x =
          20 + ((i * 47) % (W - 40)) + Math.sin((this.tick + i * 40) / 30) * 6
        const y = 300 - ((this.tick * 0.4 + i * 53) % 250)
        shadedOrb(g, Math.round(x), Math.round(y), 3 + (i % 3), RAMPS.water, {
          outline: null,
        })
      }
      g.restore()
      return
    }
    // HDMA dusk sky and the moon, painted once.
    cachedLayer(g, 'pipe-pals-sky', W, H, (k) => {
      bandedGradient(k, 0, 0, W, GROUND_Y, SCENE_SKY.city, 4)
      glow(k, MOON.x, MOON.y, MOON.r * 3.5, RAMPS.cream[3], 0.3)
      shadedOrb(k, MOON.x, MOON.y, MOON.r, RAMPS.cream, { outline: null })
      k.fillStyle = RAMPS.cream[1]
      k.fillRect(MOON.x + 2, MOON.y + 3, 3, 2)
      k.fillRect(MOON.x - 5, MOON.y + 5, 2, 2)
      k.fillRect(MOON.x + 5, MOON.y - 3, 2, 1)
    })
    drawStars(g, STARS, this.tick, RAMPS.purple)
    // Smog clouds drifting past at their own speeds: the parallax layer.
    g.save()
    g.globalAlpha = 0.35
    for (const c of CLOUDS) {
      const x = ((c.x + this.tick * c.speed) % (W + 80)) - 40
      drawCloud(g, Math.round(x), c.y, c.size, DUSK_CLOUD)
    }
    g.restore()
    // The city skyline and the back plumbing, painted once.
    cachedLayer(g, 'pipe-pals-city', W, H, paintCity)
  }

  private paintPipes(k: CanvasRenderingContext2D) {
    // Top pipes: critters drop out of these mouths.
    wallPipe(k, 34, 61, 28, 18, 1)
    wallPipe(k, W - 34, 61, 28, 18, -1)
    // Bottom pipes, sitting on the floor: critters leave through these.
    wallPipe(k, 26, 284, 26, 18, 1)
    wallPipe(k, W - 26, 284, 26, 18, -1)
  }

  private tileOf(s: Segment): PixelSprite {
    const d = this.district
    return tileFor(s.kind, s.y === 310 ? d.ground : d.ledge)
  }

  private drawLedge(g: CanvasRenderingContext2D, s: Segment, lift = 0) {
    const d = this.district
    g.fillStyle = INK
    g.fillRect(
      Math.round(s.x0) - 1,
      s.y - 1 - lift,
      Math.round(s.x1 - s.x0) + 2,
      THICK + 2,
    )
    brickRun(g, s, Math.floor(s.x0 / 8) * 8, s.x1, lift, this.tileOf(s))
    const ramp = RAMPS[s.y === 310 ? d.ground : d.ledge]
    g.fillStyle = ramp[3]
    g.fillRect(Math.round(s.x0), s.y + 1 - lift, 1, THICK - 2)
    g.fillStyle = ramp[0]
    g.fillRect(Math.round(s.x1) - 1, s.y + 1 - lift, 1, THICK - 1)
  }

  private renderFloors(g: CanvasRenderingContext2D) {
    const d = this.district
    // Bricks and soap at rest are painted once per district; vines and the lift move.
    cachedLayer(g, `pipe-pals-floors-${d.id}`, W, H, (k) => {
      for (const s of d.segments) if (s.kind !== 'vine') this.drawLedge(k, s)
    })
    d.segments.forEach((s, i) => {
      if (s.kind !== 'vine') return
      const v = this.vines.get(i)
      if (v && v.down > 0) {
        // Drooped: the vine hangs in loops until it springs back.
        g.fillStyle = RAMPS.leaf[1]
        for (let x = s.x0 + 4; x < s.x1; x += 10) {
          const droop = 6 + Math.round(Math.sin((x + this.tick) / 9) * 3)
          g.fillRect(x, s.y, 2, droop)
          g.fillStyle = RAMPS.leaf[3]
          g.fillRect(x - 1, s.y + droop, 4, 2)
          g.fillStyle = RAMPS.leaf[1]
        }
        return
      }
      const sag = v ? Math.round((v.sag / 100) * 4) : 0
      this.drawLedge(g, s, -sag)
      if (sag >= 3 && Math.floor(this.tick / 4) % 2 === 0) {
        g.fillStyle = RAMPS.leaf[4]
        g.fillRect(Math.round((s.x0 + s.x1) / 2), s.y + THICK + sag, 2, 2)
      }
    })
    ;(d.lifts ?? []).forEach((liftDef, i) => {
      const left = this.liftLefts[i] ?? liftDef.minX
      const lift = {
        x0: left,
        x1: left + liftDef.w,
        y: liftDef.y,
        kind: liftDef.kind,
      }
      if (liftDef.kind === 'gear') {
        // A brass gear ledge: teeth along its underside that turn as it slides.
        this.drawLedge(g, lift)
        for (let x = 0; x < liftDef.w; x += 6) {
          const tx = Math.round(left + ((x + left * 0.5) % liftDef.w))
          g.fillStyle = INK
          g.fillRect(tx - 1, liftDef.y + THICK, 4, 3)
          g.fillStyle = RAMPS.gold[2]
          g.fillRect(tx, liftDef.y + THICK, 2, 2)
        }
        return
      }
      this.drawLedge(g, lift)
      // Its cable rails, up into the roof.
      g.fillStyle = RAMPS.steel[2]
      g.fillRect(Math.round(left) + 6, 36, 1, liftDef.y - 36)
      g.fillRect(Math.round(left + liftDef.w) - 7, 36, 1, liftDef.y - 36)
    })
    for (const seg of d.segments) {
      if (seg.kind === 'conveyor' && seg.dir) {
        // Chevrons running along the belt.
        const step = Math.floor((this.tick * Math.abs(seg.dir)) % 12)
        for (let x = seg.x0 + 4; x < seg.x1 - 6; x += 12) {
          const cx = Math.round(x + ((seg.dir > 0 ? step : 12 - step) % 12))
          if (cx > seg.x1 - 6) continue
          g.fillStyle = RAMPS.gold[4]
          g.fillRect(cx, seg.y + 2, 1, 1)
          g.fillRect(cx + (seg.dir > 0 ? 1 : -1), seg.y + 3, 1, 1)
          g.fillRect(cx, seg.y + 4, 1, 1)
        }
      }
      const iced = this.frozen.get(seg) ?? 0
      if (iced > 0) {
        g.fillStyle = rgba(RAMPS.water[4], Math.min(0.55, iced / 200))
        g.fillRect(seg.x0, seg.y - 2, seg.x1 - seg.x0, 3)
        g.fillStyle = '#ffffff'
        for (let x = seg.x0 + 5; x < seg.x1; x += 17)
          g.fillRect(x, seg.y - 2, 2, 1)
      }
      if (seg.kind === 'crumble') {
        const c = this.crumbles.get(seg)
        if (c && c.down > 0) {
          // Fallen: a dotted outline where it will rebuild.
          g.fillStyle = rgba(
            RAMPS.rust[3],
            c.down < 120 && Math.floor(c.down / 6) % 2 ? 0.7 : 0.25,
          )
          for (let x = seg.x0; x < seg.x1; x += 6)
            g.fillRect(x, seg.y + 3, 3, 2)
          continue
        }
        // Cracks spreading with each landing.
        g.fillStyle = INK
        for (let i = 0; i < (c?.landings ?? 0) * 4; i++) {
          const x = Math.round(
            seg.x0 + 10 + ((i * 37) % (seg.x1 - seg.x0 - 20)),
          )
          g.fillRect(x, seg.y + 1, 1, 3)
          g.fillRect(x + 1, seg.y + 3, 1, 3)
        }
      }
    }
    const bump = this.bump
    if (!bump) return
    const lift = Math.round(Math.sin((bump.ticks / BUMP_TICKS) * Math.PI) * 5)
    for (const s of this.boardNow) {
      if (s.y !== bump.y || s.kind === 'vine') continue
      for (let x = Math.floor(s.x0 / 8) * 8; x < s.x1; x += 8) {
        if (
          Math.abs(x + 4 - bump.x) >= Math.min(bump.reach, BUMP_REACH * 3) ||
          lift <= 0
        )
          continue
        g.fillStyle = INK
        g.fillRect(Math.max(x, s.x0), s.y, Math.min(8, s.x1 - x), THICK)
        brickRun(g, s, x, x + 8, lift, this.tileOf(s))
      }
    }
    glow(
      g,
      bump.x,
      bump.y + THICK,
      16,
      RAMPS.gold[4],
      (0.5 * bump.ticks) / BUMP_TICKS,
    )
  }

  private renderKindBlock(g: CanvasRenderingContext2D) {
    if (this.kindBlockUses <= 0) return
    const kb = this.district.kindBlock
    const squash = this.kindShake > 0 ? 3 : 0
    glow(
      g,
      kb.x + KIND_W / 2,
      kb.y + KIND_H / 2,
      28,
      RAMPS.pink[3],
      0.28 + 0.1 * Math.sin(this.tick / 10),
    )
    bevel(g, kb.x, kb.y + squash, KIND_W, KIND_H - squash, RAMPS.pink, {
      depth: 2,
    })
    drawText(g, '*', kb.x + KIND_W / 2, kb.y + 3 + squash, {
      align: 'center',
      color: '#ffffff',
      outline: INK,
    })
    // One gold stud per use left.
    for (let i = 0; i < this.kindBlockUses; i++) {
      const x = kb.x + 3 + i * 5
      const y = kb.y + KIND_H - 3
      g.fillStyle = INK
      g.fillRect(x - 1, y - 1, 5, 3)
      g.fillStyle = RAMPS.gold[3]
      g.fillRect(x, y, 3, 1)
      g.fillStyle = RAMPS.gold[4]
      g.fillRect(x, y, 1, 1)
    }
  }

  /** Leaky joints, potted seedlings, thaw blocks, gauges, route wheels, vents and icicles. */
  private renderSpecial(g: CanvasRenderingContext2D) {
    this.renderSwing(g)
    for (const leak of this.leaks) {
      const x = leak.x
      const y = leak.y
      bevel(g, x - 6, y - 3, 12, 5, leak.sealed ? RAMPS.gold : RAMPS.steel)
      if (leak.sealed) {
        g.fillStyle = RAMPS.gold[4]
        g.fillRect(x - 1, y - 5, 2, 2)
        continue
      }
      if (!this.spraying(leak)) {
        // Between bursts it dribbles: the tell.
        if (Math.floor(this.tick / 6) % 2 === 0) {
          g.fillStyle = RAMPS.water[3]
          g.fillRect(x, y - 5, 1, 2)
        }
        continue
      }
      // The spray: a column of water fanning out over the ledge.
      glow(g, x, y - 20, 18, RAMPS.water[3], 0.35)
      for (let i = 0; i < 16; i++) {
        const h = (i * 7 + this.tick * 3) % 44
        const spread = (h / 44) * 9 * (i % 2 ? 1 : -1)
        g.fillStyle = i % 3 ? RAMPS.water[3] : '#ffffff'
        g.fillRect(Math.round(x + spread), y - 4 - h, 2, 2)
      }
    }
    for (const s of this.seedlings) {
      if (s.state === 'rescued') {
        // Lifted away to safety.
        const up = Math.min(80, s.t * 2)
        if (up >= 80) continue
        this.drawSeedling(g, s.x, s.y - up, false)
        continue
      }
      this.drawSeedling(g, s.x, s.y, s.state === 'trampled')
    }
  }

  private renderSwing(g: CanvasRenderingContext2D) {
    // Steam vents: a grate, a hiss before the puff, then a column of steam.
    ;(this.district.vents ?? []).forEach((vent, i) => {
      bevel(g, vent.x - 9, vent.y - 3, 18, 4, RAMPS.steel)
      g.fillStyle = INK
      for (let x = -6; x <= 6; x += 3) g.fillRect(vent.x + x, vent.y - 2, 1, 2)
      if (this.ventHissing(vent, i) && Math.floor(this.tick / 3) % 2 === 0) {
        g.fillStyle = rgba('#ffffff', 0.6)
        g.fillRect(vent.x - 1 + ((this.tick * 3) % 5) - 2, vent.y - 7, 2, 3)
      }
      if (this.ventPuffing(vent, i)) this.drawSteam(g, vent.x, vent.y)
    })
    for (const b of this.blocks) {
      if (b.freed) continue
      // An ice block with a frozen pal inside; cracks show the bumps so far.
      const x = Math.round(b.x - 10)
      const y = Math.round(b.y - 22)
      g.fillStyle = INK
      g.fillRect(x - 1, y - 1, 22, 23)
      g.fillStyle = rgba(RAMPS.water[3], 0.85)
      g.fillRect(x, y, 20, 21)
      drawSprite(g, TEAL_FACE, b.x, b.y - 11, { alpha: 0.7 })
      g.fillStyle = rgba('#ffffff', 0.7)
      g.fillRect(x + 2, y + 2, 3, 8)
      g.fillStyle = INK
      for (let i = 0; i < b.hits; i++) {
        g.fillRect(x + 4 + i * 6, y + 4, 1, 6)
        g.fillRect(x + 5 + i * 6, y + 10, 1, 5)
      }
    }
    for (const gauge of this.gauges) {
      const x = gauge.x
      const y = gauge.y - 12
      if (gauge.burst) {
        this.drawSteam(g, x, gauge.y)
        shadedOrb(g, x, y, 7, RAMPS.night)
        continue
      }
      shadedOrb(g, x, y, 8, RAMPS.steel)
      g.fillStyle = RAMPS.cream[4]
      g.beginPath()
      g.arc(x, y, 6, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = RAMPS.ember[2]
      g.fillRect(x + 2, y - 6, 3, 2)
      // The needle swings from left to the red zone at top right.
      const a = Math.PI * (0.9 + gauge.p * 1.45)
      g.fillStyle = INK
      for (let r = 0; r < 6; r++)
        g.fillRect(
          Math.round(x + Math.cos(a) * r),
          Math.round(y + Math.sin(a) * r),
          1,
          1,
        )
      if (gauge.p > 0.75 && Math.floor(this.tick / 5) % 2 === 0)
        glow(g, x, y, 14, RAMPS.ember[3], 0.45)
      bevel(g, x - 2, y + 7, 4, gauge.y - y - 7, RAMPS.steel)
    }
    for (const wheel of this.wheels) {
      const x = wheel.x
      const y = wheel.y - 10
      shadedOrb(g, x, y, 8, RAMPS.ember)
      const a = this.tick / 30 + (this.route === 0 ? 0 : Math.PI / 4)
      g.fillStyle = RAMPS.ember[4]
      for (let i = 0; i < 4; i++) {
        const sa = a + (i * Math.PI) / 2
        g.fillRect(
          Math.round(x + Math.cos(sa) * 5),
          Math.round(y + Math.sin(sa) * 5),
          2,
          2,
        )
      }
    }
    if (this.route >= 0) {
      // A glow on the pipe critters are routed through.
      const pipe = TOP_PIPES[this.route]!
      glow(
        g,
        pipe.x + pipe.dir * 16,
        pipe.y - 14,
        22,
        RAMPS.gold[4],
        0.35 + 0.1 * Math.sin(this.tick / 8),
      )
    }
    for (const ice of this.icicles) {
      if (ice.state === 'gone') continue
      const len =
        ice.state === 'grow' ? Math.round((ice.grow / ICICLE_GROW) * 14) : 14
      if (len <= 0) continue
      const shake =
        ice.state === 'shake' ? Math.round(Math.sin(this.tick * 2)) : 0
      const top = ice.state === 'fall' ? Math.round(ice.fy) : ice.y + THICK
      const x = Math.round(ice.x) + shake
      for (let i = 0; i < len; i++) {
        const w = Math.max(1, Math.round((1 - i / len) * 5))
        g.fillStyle = INK
        g.fillRect(x - Math.ceil(w / 2) - 1, top + i, w + 2, 1)
        g.fillStyle = i < 3 ? '#ffffff' : RAMPS.water[3]
        g.fillRect(x - Math.ceil(w / 2), top + i, w, 1)
      }
      if (ice.state === 'shake') glow(g, x, top + 6, 10, RAMPS.water[4], 0.4)
    }
  }

  private drawSteam(g: CanvasRenderingContext2D, x: number, y: number) {
    glow(g, x, y - 20, 18, '#ffffff', 0.3)
    for (let i = 0; i < 12; i++) {
      const h = (i * 9 + this.tick * 2) % 40
      const spread = (h / 40) * 8 * (i % 2 ? 1 : -1)
      g.fillStyle = rgba('#ffffff', 0.75 - h / 70)
      g.fillRect(Math.round(x + spread) - 1, y - 3 - h, 3, 3)
    }
  }

  private drawSeedling(
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    broken: boolean,
  ) {
    const px = Math.round(x)
    const py = Math.round(y)
    g.fillStyle = INK
    g.fillRect(px - 5, py - 9, 10, 9)
    g.fillStyle = broken ? RAMPS.earth[1] : RAMPS.rust[2]
    g.fillRect(px - 4, py - 8, 8, 7)
    g.fillStyle = RAMPS.rust[3]
    g.fillRect(px - 4, py - 8, 8, 1)
    if (broken) {
      g.fillStyle = INK
      g.fillRect(px - 1, py - 8, 1, 7)
      return
    }
    const sway = Math.round(Math.sin((this.tick + x) / 12))
    g.fillStyle = RAMPS.leaf[2]
    g.fillRect(px + sway, py - 15, 1, 7)
    g.fillStyle = RAMPS.leaf[3]
    g.fillRect(px - 3 + sway, py - 14, 3, 2)
    g.fillRect(px + 1 + sway, py - 16, 3, 2)
    g.fillStyle = RAMPS.pink[3]
    g.fillRect(px + sway, py - 17, 1, 1)
  }

  private renderSock(
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    colour: SockColour,
  ) {
    const r = SOCK_RGB[colour]
    const px = Math.round(x)
    const py = Math.round(y)
    g.fillStyle = INK
    g.fillRect(px - 4, py - 7, 7, 12)
    g.fillRect(px - 4, py + 2, 11, 5)
    g.fillStyle = r[2]
    g.fillRect(px - 3, py - 6, 5, 11)
    g.fillRect(px - 3, py + 3, 9, 3)
    g.fillStyle = r[4]
    g.fillRect(px - 3, py - 6, 5, 2)
    g.fillStyle = r[3]
    g.fillRect(px - 3, py - 2, 5, 1)
  }

  /** The Thermostat: a great dial, blue for freeze and red for heat, its needle on a ledge. */
  private renderThermostat(g: CanvasRenderingContext2D, t: Thermostat) {
    const ledges = this.thermoLedges()
    const seg = ledges[t.target]
    const armed = t.targetT <= THERMO_ARMED
    if (seg) {
      const cx = (seg.x0 + seg.x1) / 2
      const a = Math.atan2(seg.y - THERMO.y, cx - THERMO.x)
      if (armed) {
        const pulse = 0.35 + 0.25 * Math.sin(this.tick / 3)
        g.fillStyle = rgba(
          t.mode === 'freeze' ? RAMPS.water[4] : RAMPS.ember[3],
          pulse,
        )
        g.fillRect(seg.x0, seg.y + THICK, seg.x1 - seg.x0, 4)
      }
      // The pointer beam from dial to ledge.
      g.fillStyle = rgba(RAMPS.gold[4], armed ? 0.5 : 0.18)
      const len = Math.hypot(cx - THERMO.x, seg.y - THERMO.y)
      for (let r = THERMO.r; r < len; r += 6)
        g.fillRect(
          Math.round(THERMO.x + Math.cos(a) * r),
          Math.round(THERMO.y + Math.sin(a) * r),
          2,
          2,
        )
    }
    const ramp = t.mode === 'freeze' ? RAMPS.water : RAMPS.ember
    glow(g, THERMO.x, THERMO.y, THERMO.r * 2, ramp[3], t.flash ? 0.7 : 0.3)
    shadedOrb(
      g,
      THERMO.x,
      THERMO.y,
      THERMO.r,
      t.flash && t.flash % 4 < 2 ? RAMPS.cream : RAMPS.steel,
    )
    g.fillStyle = RAMPS.cream[4]
    g.beginPath()
    g.arc(THERMO.x, THERMO.y, THERMO.r - 5, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = RAMPS.water[2]
    g.beginPath()
    g.arc(THERMO.x, THERMO.y, THERMO.r - 7, Math.PI * 0.5, Math.PI * 1.5)
    g.fill()
    g.fillStyle = RAMPS.ember[2]
    g.beginPath()
    g.arc(THERMO.x, THERMO.y, THERMO.r - 7, -Math.PI * 0.5, Math.PI * 0.5)
    g.fill()
    if (seg) {
      const a = Math.atan2(seg.y - THERMO.y, (seg.x0 + seg.x1) / 2 - THERMO.x)
      g.fillStyle = INK
      for (let r = 0; r < THERMO.r - 6; r++)
        g.fillRect(
          Math.round(THERMO.x + Math.cos(a) * r) - 1,
          Math.round(THERMO.y + Math.sin(a) * r) - 1,
          3,
          3,
        )
    }
    shadedOrb(g, THERMO.x, THERMO.y, 4, RAMPS.gold)
    drawText(
      g,
      t.mode === 'freeze' ? 'FREEZE' : 'HEAT',
      THERMO.x,
      THERMO.y + THERMO.r + 4,
      {
        align: 'center',
        color: ramp[3],
        outline: INK,
      },
    )
    gauge(
      g,
      THERMO.x - 30,
      THERMO.y + THERMO.r + 14,
      60,
      4,
      t.hp / t.maxHp,
      RAMPS.ember,
    )
  }

  private renderBoss(g: CanvasRenderingContext2D, b: Boss) {
    const tipped = b.state === 'tipped' || b.state === 'down'
    const sprite =
      b.flash > 0 && Math.floor(b.flash / 2) % 2 === 0
        ? BIG_SHELL.flash
        : b.state === 'roll'
          ? BIG_SHELL.curl
          : b.hp === 1
            ? BIG_SHELL.angry[Math.floor(this.tick / 8) % 2]!
            : BIG_SHELL.walk[Math.floor(this.tick / 10) % 2]!
    if (b.y > 0 && b.state !== 'leap') dropShadow(g, b.x, b.y, 26, 2.5, 0.4)
    const wobble =
      b.tipHits > 0 ? Math.round(Math.sin(this.tick) * b.tipHits) : 0
    drawSprite(g, sprite, b.x + wobble, b.y + 1, {
      anchor: 'feet',
      flipX: b.dir < 0,
      flipY: tipped,
    })
    // Its health: three shells over its head.
    for (let i = 0; i < b.maxHp; i++) {
      const x = Math.round(b.x - 12 + i * 12)
      const y = Math.round(b.y - BOSS_H - 14)
      shadedOrb(g, x, y, 4, i < b.hp ? RAMPS.leaf : RAMPS.night)
    }
    // Tip pips: how close the next tip is.
    for (let i = 0; i < b.tipHits; i++) {
      g.fillStyle = RAMPS.gold[4]
      g.fillRect(
        Math.round(b.x - 6 + i * 6),
        Math.round(b.y - BOSS_H - 6),
        3,
        3,
      )
    }
    if (b.state === 'tipped') {
      for (let i = 0; i < 3; i++) {
        const a = this.tick / 7 + (i * Math.PI * 2) / 3
        const x = Math.round(b.x + Math.cos(a) * 22)
        const y = Math.round(b.y - BOSS_H - 4 + Math.sin(a) * 3)
        g.fillStyle = INK
        g.fillRect(x - 1, y - 1, 3, 3)
        g.fillStyle = RAMPS.gold[4]
        g.fillRect(x, y, 1, 1)
      }
    }
  }

  private renderShadows(g: CanvasRenderingContext2D, playerVisible: boolean) {
    const p = this.player
    if (playerVisible && p.onGround) dropShadow(g, p.x, p.y, 9, 1.5, 0.4)
    for (const c of this.critters) {
      if (c.onGround && !c.kicked) dropShadow(g, c.x, c.y, 10, 1.5, 0.35)
    }
  }

  private renderCoin(g: CanvasRenderingContext2D, coin: Coin) {
    if (coin.float !== undefined && coin.float < 0)
      this.renderBubble(g, coin.x, coin.y, 9)
    const spin = Math.floor(this.tick / 6) % 4
    const sprite =
      spin === 0
        ? COIN_SPRITES[0]
        : spin === 2
          ? COIN_SPRITES[2]
          : COIN_SPRITES[1]
    glow(g, coin.x, coin.y, 13, RAMPS.gold[3], 0.4)
    drawSprite(g, sprite, coin.x, coin.y, { flipX: spin === 3 })
    // A glint that hops between coins.
    const twinkle = (this.tick + Math.round(coin.x) * 3) % 48
    if (twinkle < 8) {
      const arm = twinkle < 4 ? 2 : 1
      const x = Math.round(coin.x) + 3
      const y = Math.round(coin.y) - 4
      g.fillStyle = '#ffffff'
      g.fillRect(x - arm, y, arm * 2 + 1, 1)
      g.fillRect(x, y - arm, 1, arm * 2 + 1)
    }
  }

  private renderPlayer(g: CanvasRenderingContext2D) {
    const p = this.player
    const sprite = !p.onGround
      ? PLAYER_SPRITES.jump
      : Math.abs(p.vx) > 0.3
        ? PLAYER_SPRITES.run[Math.floor(p.run / 1.6) % 3]!
        : PLAYER_SPRITES.stand
    drawSprite(g, sprite, p.x, p.y + 1, { anchor: 'feet', flipX: p.face < 0 })
    if (this.heldSock)
      this.renderSock(g, p.x - p.face * 9, p.y - PLAYER_H + 4, this.heldSock)
  }

  /** The district title card. */
  private renderCard(g: CanvasRenderingContext2D) {
    const d = this.district
    const fade = Math.min(1, this.cardTicks / 20)
    g.save()
    g.globalAlpha = fade
    g.fillStyle = rgba(INK, 0.55)
    g.fillRect(0, 0, W, H)
    hudPanel(g, 54, 104, W - 108, 112)
    drawText(
      g,
      `${SHIFT_NAMES[d.shift]}${this.lap ? `  LAP ${this.lap + 1}` : ''}`,
      W / 2,
      116,
      {
        align: 'center',
        color: RAMPS.purple[3],
        outline: INK,
      },
    )
    drawText(g, `DISTRICT ${d.number}`, W / 2, 132, {
      scale: 2,
      align: 'center',
      color: RAMPS.gold[3],
      outline: INK,
    })
    drawText(g, d.name, W / 2, 156, {
      scale: 2,
      align: 'center',
      color: '#ffffff',
      outline: INK,
      shadow: RAMPS.leaf[1],
    })
    drawText(g, d.tagline, W / 2, 182, {
      align: 'center',
      color: RAMPS.teal[3],
      outline: INK,
    })
    drawText(g, 'PRESS A', W / 2, 200, {
      align: 'center',
      color: RAMPS.steel[3],
      outline: INK,
    })
    g.restore()
  }

  /** The Workshop: spend coins on the next district. */
  private renderWorkshop(g: CanvasRenderingContext2D) {
    const w = this.workshop!
    cachedLayer(g, 'pipe-pals-workshop', W, H, (k) => {
      bandedGradient(
        k,
        0,
        0,
        W,
        H,
        [RAMPS.night[0], RAMPS.night[1], RAMPS.purple[1], RAMPS.night[1]],
        6,
      )
      // Pegboard of tools on the back wall.
      k.fillStyle = rgba(RAMPS.steel[3], 0.15)
      for (let y = 20; y < H; y += 12)
        for (let x = 16; x < W; x += 12) k.fillRect(x, y, 2, 2)
    })
    hudPanel(g, 40, 20, W - 80, 30)
    drawText(g, 'THE WORKSHOP', W / 2, 27, {
      scale: 2,
      align: 'center',
      color: RAMPS.gold[3],
      outline: INK,
    })
    drawSprite(g, COIN_SPRITES[0], 70, 74)
    drawText(g, `x ${this.wallet}`, 82, 70, {
      scale: 2,
      color: RAMPS.gold[4],
      outline: INK,
    })
    // Golden valves earned so far.
    drawText(g, 'VALVES', W - 160, 70, { color: RAMPS.steel[3], outline: INK })
    for (let i = 0; i < 8; i++) {
      const got = i < DISTRICTS.length && this.valves.includes(DISTRICTS[i]!.id)
      shadedOrb(g, W - 104 + i * 9, 74, 3, got ? RAMPS.gold : RAMPS.night)
    }
    SHOP_ITEMS.forEach((entry, i) => {
      const y = 100 + i * 34
      const selected = i === w.cursor
      const open = this.shopAvailable(entry.item)
      const price = this.shopPrice(entry.price)
      const afford = entry.item === 'done' || this.wallet >= price
      hudPanel(g, 60, y, W - 120, 31)
      if (selected) glow(g, 80, y + 14, 24, RAMPS.gold[4], 0.5)
      drawText(g, selected ? '>' : ' ', 70, y + 6, {
        scale: 2,
        color: RAMPS.gold[4],
        outline: INK,
      })
      drawText(g, entry.label, 90, y + 3, {
        scale: 2,
        color: !open ? RAMPS.night[4] : afford ? '#ffffff' : RAMPS.steel[2],
        outline: INK,
      })
      if (entry.blurb)
        drawText(g, open ? entry.blurb : 'SOLD', 92, y + 21, {
          color: RAMPS.teal[3],
          outline: INK,
        })
      if (entry.item !== 'done')
        drawText(g, String(price), W - 74, y + 8, {
          scale: 2,
          align: 'right',
          color: afford && open ? RAMPS.gold[3] : RAMPS.steel[2],
          outline: INK,
        })
    })
    drawText(g, 'UP DOWN TO CHOOSE   A TO BUY', W / 2, H - 16, {
      align: 'center',
      color: RAMPS.steel[3],
      outline: INK,
    })
  }

  private renderCritter(g: CanvasRenderingContext2D, c: Critter) {
    if (c.kind === 'snowball' && !c.kicked) {
      const r = Math.round(c.size / 2 + 3)
      const cy = Math.round(c.y - r)
      shadedOrb(g, Math.round(c.x), cy, r, RAMPS.water)
      g.fillStyle = '#ffffff'
      g.fillRect(Math.round(c.x) - r + 3, cy - r + 3, 2, 2)
      // Rolling: a scuff mark that turns with it, and a grumpy face.
      const a = (c.x / r) * c.dir
      g.fillStyle = RAMPS.water[1]
      g.fillRect(
        Math.round(c.x + Math.cos(a) * (r - 3)),
        Math.round(cy + Math.sin(a) * (r - 3)),
        2,
        2,
      )
      g.fillStyle = INK
      g.fillRect(Math.round(c.x) + c.dir * 2 - 1, cy - 2, 1, 2)
      g.fillRect(Math.round(c.x) + c.dir * 2 + 2, cy - 2, 1, 2)
      if (c.size >= 10) glow(g, c.x, cy, r + 6, RAMPS.water[4], 0.25)
      return
    }
    const upside = c.flipped > 0 || c.kicked
    const warning =
      c.flipped > 0 && c.flipped < 120 && Math.floor(c.flipped / 8) % 2 === 0
    const look =
      CRITTER_LOOKS[c.kind === 'knight' && !c.armored ? 'bare' : c.kind]
    const set = warning ? look.flash : look.tiers[c.tier]
    // Flipped critters kick their legs in the air, twice as fast; fleas tuck in on the ground.
    const step = Math.floor(this.tick / (upside ? 3 : 6))
    const frame =
      c.squash > 0
        ? set.squash
        : c.kind === 'flea' && !upside
          ? set.walk[c.onGround ? 0 : 1]!
          : set.walk[step % set.walk.length]!
    if (c.trapped > 0) this.renderBubble(g, c.x, c.y - CRITTER_H / 2 - 1, 14)
    if (c.kind === 'gearbug' && c.mode === 1 && !upside)
      glow(g, c.x, c.y - 8, 14, RAMPS.gold[4], 0.35)
    if (c.rush && !upside)
      glow(
        g,
        c.x,
        c.y - 7,
        16,
        RAMPS.ember[3],
        0.25 + 0.1 * Math.sin(this.tick / 3),
      )
    drawSprite(g, frame, c.x, c.y + 1, {
      anchor: 'feet',
      flipX: c.dir < 0,
      flipY: upside,
    })
    if (c.flipped > 0 && !c.kicked) {
      // Dizzy stars circling a flipped critter: kick it now.
      for (let i = 0; i < 2; i++) {
        const a = this.tick / 7 + i * Math.PI
        const x = Math.round(c.x + Math.cos(a) * 10)
        const y = Math.round(c.y - 19 + Math.sin(a) * 2)
        g.fillStyle = INK
        g.fillRect(x - 1, y - 1, 3, 3)
        g.fillStyle = i ? RAMPS.gold[4] : RAMPS.teal[4]
        g.fillRect(x, y, 1, 1)
      }
    }
  }

  /** A soap bubble: a see-through shaded orb with a glint. */
  private renderBubble(
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
  ) {
    g.save()
    g.globalAlpha = 0.45
    shadedOrb(g, Math.round(x), Math.round(y), r, RAMPS.water, {
      outline: null,
    })
    g.restore()
    g.fillStyle = '#ffffff'
    g.fillRect(Math.round(x - r / 2), Math.round(y - r / 2), 2, 2)
  }

  private renderEmber(g: CanvasRenderingContext2D, e: Ember) {
    if (e.kind === 'cuckoo') {
      if (e.tell > 0) {
        // The clock door opens: the tell.
        if (Math.floor(e.tell / 6) % 2 === 0)
          glow(g, W / 2, 56, 16, RAMPS.gold[4], 0.6)
        return
      }
      const flap = Math.floor(this.tick / 5) % 2
      drawSprite(g, CUCKOO_SPRITES[flap]!, e.x, e.y, { flipX: e.vx < 0 })
      return
    }
    const x = Math.round(e.x)
    const y = Math.round(e.kind === 'lurker' ? e.y - 5 : e.y)
    if (e.tell > 0) {
      // The tell: a blinking glow where it is about to appear.
      if (Math.floor(e.tell / 5) % 2 === 0)
        glow(g, x, y, 14, RAMPS.ember[3], 0.5)
      return
    }
    const flick = Math.floor(this.tick / 4) % 2
    glow(g, x, y, e.kind === 'spark' ? 18 : 22, RAMPS.ember[3], 0.45)
    if (e.kind === 'spark') {
      shadedOrb(g, x, y, 5, RAMPS.ember)
      g.fillStyle = RAMPS.ember[4]
      g.fillRect(x - 1 - flick, y - 2, 2, 2)
      return
    }
    // The lurker: a low creeping flame, licking forward.
    drawSprite(g, LURKER_SPRITES[flick]!, x, e.y + 1, {
      anchor: 'feet',
      flipX: e.vx < 0,
    })
  }

  private renderPickup(g: CanvasRenderingContext2D, tool: Pickup) {
    if (tool.life < 120 && Math.floor(tool.life / 6) % 2 === 0) return
    const bob = Math.round(Math.sin(this.tick / 8) * 1.5)
    glow(g, tool.x, tool.y - 2, 16, RAMPS.cream[4], 0.45)
    drawSprite(g, TOOL_SPRITES[tool.kind], tool.x, tool.y - 2 + bob)
  }

  private renderHud(g: CanvasRenderingContext2D) {
    hudPanel(g, 4, 3, 82, 20)
    drawText(g, String(this.score).padStart(6, '0'), 10, 6, {
      scale: 2,
      color: RAMPS.teal[4],
      shadow: INK,
    })
    const hi = `HI ${Math.max(this.hiScore, this.score)}`
    const hiW = measureText(hi, 2) + 14
    hudPanel(g, Math.round(W / 2 - hiW / 2), 3, hiW, 20)
    drawText(g, hi, W / 2, 6, {
      scale: 2,
      align: 'center',
      color: RAMPS.gold[3],
      shadow: INK,
    })
    // Spare pals, teal and pink in turn.
    const lives = Math.min(this.lives, 5)
    if (lives > 0) {
      hudPanel(g, W - 8 - lives * 16, 3, lives * 16 + 4, 20)
      for (let i = 0; i < lives; i++) {
        drawSprite(g, i % 2 ? PINK_FACE : TEAL_FACE, W - 14 - i * 16, 13)
      }
    }
    const step = this.step()
    const label =
      this.bonusRound > 0
        ? `BONUS ${Math.ceil(this.bonusRound / 60)}`
        : step.kind === 'boss'
          ? this.district.boss === 'thermostat'
            ? 'THERMOSTAT'
            : 'BIG SHELL'
          : step.kind === 'phase'
            ? `PHASE ${this.district.number}-${step.phase}`
            : 'WORKSHOP'
    hudPanel(g, 26, H - 16, measureText(label) + 14, 13)
    drawText(g, label, 33, H - 13, {
      color: RAMPS.purple[4],
      outline: INK,
    })
    // Coins in the wallet and the golden valves, under the score.
    hudPanel(g, 4, 25, 82, 13)
    drawSprite(g, COIN_SPRITES[0], 13, 31)
    drawText(g, String(this.wallet), 20, 28, {
      color: RAMPS.gold[3],
      outline: INK,
    })
    for (let i = 0; i < 8; i++) {
      const got = i < DISTRICTS.length && this.valves.includes(DISTRICTS[i]!.id)
      g.fillStyle = got ? RAMPS.gold[3] : RAMPS.night[3]
      g.fillRect(44 + i * 5, 29, 3, 5)
    }
    // Special-phase progress toward the golden valve.
    if (step.kind === 'phase' && step.phase === SPECIAL_PHASE) {
      const text = `${VALVE_TESTS[this.district.special].short} ${this.specialScore()}/${this.valveGoal()}`
      const tw = measureText(text) + 14
      hudPanel(g, Math.round(W / 2 - tw / 2), H - 16, tw, 13)
      drawText(g, text, W / 2, H - 13, {
        align: 'center',
        color:
          this.specialScore() >= this.valveGoal()
            ? RAMPS.gold[4]
            : RAMPS.teal[3],
        outline: INK,
      })
    }
    if (this.bonusRound > 0) {
      hudPanel(g, W - 112, H - 16, 86, 13)
      gauge(g, W - 106, H - 12, 74, 5, this.bonusRound / BONUS_FULL, RAMPS.gold)
    }
    // The tool in hand, its time left, and the wand's bubbles.
    const tool = this.tool
    if (tool && this.bonusRound === 0) {
      hudPanel(g, W - 130, H - 18, 104, 15)
      drawSprite(g, TOOL_SPRITES[tool.kind], W - 120, H - 10)
      const full = tool.kind === 'wand' ? TOOL_TICKS * 2 : TOOL_TICKS
      gauge(g, W - 108, H - 13, 52, 5, tool.ticks / full, RAMPS.teal)
      if (tool.kind === 'wand')
        drawText(g, `B x${tool.charges}`, W - 52, H - 14, {
          color: RAMPS.water[3],
          outline: INK,
        })
    }
    if (this.chain > 1 && this.chainTimer > 0) {
      drawText(g, `CHAIN ${this.chain}`, W / 2, 28, {
        scale: 2,
        align: 'center',
        color: RAMPS.ember[4],
        outline: INK,
      })
    }
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, 140, {
        scale: 3,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.leaf[1],
      })
      if (this.banner.sub) {
        drawText(g, this.banner.sub, W / 2, 170, {
          scale: 2,
          align: 'center',
          color: RAMPS.gold[3],
          outline: INK,
        })
      }
    }
  }
}

const pipePals: ArcadeGameModule = {
  create: (options) => new PipePals(options),
}

export const create = pipePals.create
export default pipePals
