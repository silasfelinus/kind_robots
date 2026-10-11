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

import { everyNthLevel, levelCurve } from '../curve'
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
/** The KIND block refills at the start of every fifth phase (6, 11, 16...). */
const KIND_REFILL_EVERY = 5
const HAZARD_TELL = 45

export function chainPoints(n: number): number {
  return CHAIN_POINTS[Math.max(0, Math.min(CHAIN_POINTS.length, n) - 1)]!
}

type Segment = { x0: number; x1: number; y: number }

/** Floor tops (y) and their solid spans. Platforms are 8 px thick. */
export const PIPE_LEVELS: Segment[] = [
  { x0: 0, x1: W, y: 310 },
  { x0: 0, x1: 170, y: 244 },
  { x0: 278, x1: W, y: 244 },
  { x0: 0, x1: 92, y: 178 },
  { x0: 138, x1: 310, y: 178 },
  { x0: 356, x1: W, y: 178 },
  { x0: 0, x1: 176, y: 112 },
  { x0: 272, x1: W, y: 112 },
]
const THICK = 8
const KIND_BLOCK = { x: W / 2 - 12, y: 262, w: 24, h: 16 }
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

export type Kind = 'crawler' | 'crab' | 'flea' | 'knight'

/** Who comes out of the pipes, from which phase, and how often against the rest. */
export const PIPE_ROSTER: ReadonlyArray<{
  kind: Kind
  from: number
  weight: number
}> = [
  { kind: 'crawler', from: 1, weight: 4 },
  { kind: 'flea', from: 2, weight: 2 },
  { kind: 'crab', from: 3, weight: 2 },
  { kind: 'knight', from: 4, weight: 2 },
]
const SPARKS_FROM = 3

/** The kinds a phase can release, and the one making its debut there (it leads the queue). */
export function rosterFor(phase: number): {
  kinds: Kind[]
  debut: Kind | null
} {
  const open = PIPE_ROSTER.filter((r) => r.from <= phase)
  const debut = PIPE_ROSTER.find((r) => r.from === phase)?.kind ?? null
  return { kinds: open.map((r) => r.kind), debut }
}

/** Calm, cross, furious: each recovery steps a critter up one tier. */
export type Tier = 0 | 1 | 2
const TIER_SPEED = [1, 1.3, 1.6] as const
const RUSH_SPEED = 1.35

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
}
type Coin = { x: number; y: number; vx: number; vy: number; life: number }
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
}
type Bubble = { x: number; y: number; vx: number; life: number }
/** An ember spark bounces across the board; a lurker ember slides along one floor. */
type Ember = {
  kind: 'spark' | 'lurker'
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
  x: number,
  w: number,
  footY: number,
  tolerance: number,
): Segment | null {
  for (const s of PIPE_LEVELS) {
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

const SKY_STOPS = [
  RAMPS.night[0],
  RAMPS.night[1],
  RAMPS.night[2],
  mix(RAMPS.night[3], RAMPS.purple[1], 0.5),
  mix(RAMPS.purple[1], RAMPS.pink[1], 0.55),
]
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

const BRICK_ROWS = [
  'HHHHHHHH',
  'LBBBBBBD',
  'BBBBBBSD',
  'SSSSSSSD',
  'BBDLBBBB',
  'BBDBBBBB',
  'SSDSSSSS',
  'DDDDDDDD',
]
function brickTile(ramp: Ramp): PixelSprite {
  return pixelSprite(
    BRICK_ROWS,
    { D: ramp[0], S: ramp[1], B: ramp[2], L: ramp[3], H: ramp[4] },
    { outline: null },
  )
}
const LEDGE_TILE = brickTile(RAMPS.teal)
const GROUND_TILE = brickTile(RAMPS.purple)

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
    k: INK,
    w: '#ffffff',
  }
  return {
    walk: legs.map((l) => pixelSprite([...body, ...l], palette)),
    // Squashed flat: the top rows pressed down, legs splayed.
    squash: pixelSprite([...body.slice(3), legs[2]![1]!], palette),
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
) {
  const tile = s.y === 310 ? GROUND_TILE : LEDGE_TILE
  g.save()
  g.beginPath()
  g.rect(s.x0, s.y - lift - 1, s.x1 - s.x0, THICK + 2)
  g.clip()
  for (let x = from; x < to; x += 8)
    drawSprite(g, tile, x, s.y - lift, { anchor: 'topleft' })
  g.restore()
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
  private critters: Critter[] = []
  private queue: Kind[] = []
  private releaseTimer = 0
  private bump: { x: number; y: number; ticks: number; reach: number } | null =
    null
  private kindBlockUses = KIND_BLOCK_USES
  private kindShake = 0
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
  private bonusRound = 0
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
    this.startPhase(1)
  }

  // --- setup ----------------------------------------------------------------

  private startPhase(phase: number) {
    this.level = phase
    this.critters = []
    this.coins = []
    this.pickups = []
    this.bubbles = []
    this.embers = []
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
    if (phase > 1 && everyNthLevel(phase - 1, 4)) {
      // Bonus round: grab the coins before the timer runs out.
      this.bonusRound = BONUS_FULL
      for (const s of PIPE_LEVELS.slice(1)) {
        for (let x = s.x0 + 20; x < s.x1 - 10; x += 44) {
          this.coins.push({ x, y: s.y - 10, vx: 0, vy: 0, life: Infinity })
        }
      }
      this.banner = { text: 'BONUS ROUND', sub: 'GRAB EVERY COIN', ticks: 120 }
      this.queue = []
      return
    }
    this.bonusRound = 0
    let sub: string | undefined
    if (phase > 1 && (phase - 1) % KIND_REFILL_EVERY === 0) {
      this.kindBlockUses = KIND_BLOCK_USES
      sub = 'KIND BLOCK REFILLED'
    }
    const total = Math.round(levelCurve(phase, PIPE_CURVES.critters))
    const { kinds, debut } = rosterFor(phase)
    const weights = PIPE_ROSTER.filter((r) => kinds.includes(r.kind))
    const sum = weights.reduce((n, r) => n + r.weight, 0)
    this.queue = Array.from({ length: total }, () => {
      let roll = this.rng() * sum
      for (const r of weights) if ((roll -= r.weight) < 0) return r.kind
      return 'crawler'
    })
    // A newcomer leads its debut phase, so the player meets it on its own.
    if (debut) {
      this.queue[0] = debut
      sub ??= `NEW: ${CRITTER_NAMES[debut]}`
    }
    this.releaseTimer = 60
    this.sparkTimer = Math.round(levelCurve(phase, PIPE_CURVES.sparkEvery) / 2)
    this.lurkerTimer = Math.round(levelCurve(phase, PIPE_CURVES.lurkerAfter))
    this.invuln = 90
    this.banner = { text: `PHASE ${phase}`, sub, ticks: 110 }
  }

  private release() {
    const kind = this.queue.shift()
    if (!kind) return
    const pipe = TOP_PIPES[this.critters.length % 2]!
    this.critters.push({
      kind,
      x: pipe.x,
      y: pipe.y,
      vx: 0,
      vy: 0,
      dir: pipe.dir,
      onGround: false,
      flipped: 0,
      angry: false,
      armored: kind === 'knight',
      tier: 0,
      rush: false,
      kicked: false,
      slide: 0,
      hits: 0,
      hop: 40,
      squash: 0,
      trapped: 0,
    })
    this.sound.play('warn')
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
    if (this.phaseDelay > 0) {
      if (--this.phaseDelay === 0) this.startPhase(this.level + 1)
      return
    }
    if (!this.alive) {
      if (--this.respawn <= 0) this.revive()
      return
    }

    const controls = this.demo ? this.demoInput() : input
    this.movePlayer(controls)
    this.updateTool(controls)
    if (this.bonusRound > 0) {
      this.updateBonus()
      return
    }
    this.phaseTicks++
    if (this.queue.length && --this.releaseTimer <= 0) {
      this.release()
      this.releaseTimer = Math.round(
        levelCurve(this.level, PIPE_CURVES.releaseEvery),
      )
    }
    this.spawnEmbers()
    this.moveCritters()
    this.moveBubbles()
    this.moveEmbers()
    this.moveCoins()
    this.collide()
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
    }
  }

  private movePlayer(input: InputFrame) {
    const p = this.player
    if (input.held.left) {
      p.vx -= RUN_ACCEL
      p.face = -1
    } else if (input.held.right) {
      p.vx += RUN_ACCEL
      p.face = 1
    } else {
      p.vx *= RUN_FRICTION
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
      for (const s of PIPE_LEVELS.slice(1)) {
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
      const kb = KIND_BLOCK
      const under = kb.y + kb.h
      if (
        this.kindBlockUses > 0 &&
        headBefore >= under &&
        head < under &&
        p.x > kb.x - 4 &&
        p.x < kb.x + kb.w + 4
      ) {
        p.y = under + PLAYER_H
        p.vy = 1
        this.kindBlock()
      }
    }
    // Land on floors.
    p.onGround = false
    if (p.vy >= 0) {
      const s = segmentUnder(p.x, PLAYER_W, p.y, Math.max(4, p.vy + 1))
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
    for (const c of this.critters) {
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
    // Bumping a coin from below collects it.
    for (const coin of this.coins) {
      if (
        Math.abs(coin.y - (floorY - 10)) < 8 &&
        Math.abs(coin.x - x) < reach
      ) {
        coin.life = 0
        this.addScore(800, coin.x, coin.y)
        this.sound.play('pickup')
        this.fx.burst(coin.x, coin.y, this.fxRng, {
          count: 8,
          colours: [RAMPS.gold[4], RAMPS.gold[3], '#ffffff'],
        })
      }
    }
  }

  private hitCritter(c: Critter) {
    if (c.kind === 'flea' && !c.onGround) return
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
    c.flipped = Math.round(levelCurve(this.level, PIPE_CURVES.recoverTicks))
    c.vy = -3
    c.vx = 0
    c.squash = 8
    this.addScore(10, c.x, c.y - 14)
  }

  private kindBlock() {
    this.kindBlockUses--
    this.kindShake = 24
    this.sound.play('boom')
    this.fx.burst(
      KIND_BLOCK.x + KIND_BLOCK.w / 2,
      KIND_BLOCK.y + KIND_BLOCK.h / 2,
      this.fxRng,
      {
        count: 16,
        speed: 2.2,
        colours: [RAMPS.pink[3], RAMPS.pink[4], RAMPS.gold[4]],
      },
    )
    for (const c of this.critters) {
      if (!c.kicked && c.onGround && c.trapped === 0) this.hitCritter(c)
    }
    for (const e of this.embers) if (e.tell === 0) e.life = 0
  }

  private moveCritters() {
    const base = levelCurve(this.level, PIPE_CURVES.crawlerSpeed)
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
      let speed =
        c.flipped > 0
          ? 0
          : base *
            TIER_SPEED[c.tier] *
            (c.rush ? RUSH_SPEED : 1) *
            (c.kind === 'crab' && c.angry ? 1.25 : 1) *
            (c.kind === 'knight' && !c.armored ? 1.5 : 1)
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
      c.vx = c.dir * speed
      c.vy += GRAVITY
      c.x += c.vx
      c.y += c.vy
      c.onGround = false
      if (c.vy >= 0) {
        const s = segmentUnder(c.x, CRITTER_W, c.y, Math.max(4, c.vy + 1))
        if (s && c.y - c.vy <= s.y + 1) {
          c.y = s.y
          c.vy = 0
          c.onGround = true
        }
      }
      // On the bottom floor, critters leave through the bottom pipes and
      // come back out of the top ones.
      if (c.y >= 309 && (c.x < 6 || c.x > W - 6)) {
        const pipe = c.x < 6 ? TOP_PIPES[1]! : TOP_PIPES[0]!
        Object.assign(c, { x: pipe.x, y: pipe.y, vy: 0, dir: pipe.dir })
        continue
      }
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
      const ledge = segmentUnder(c.x, 2, c.y, 2)
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
    // Every kick sends a coin out of a pipe, and every few a tool.
    const pipe = TOP_PIPES[Math.floor(this.rng() * 2)]!
    this.coins.push({
      x: pipe.x,
      y: pipe.y,
      vx: pipe.dir * 1.2,
      vy: 0,
      life: 900,
    })
    this.kicks++
    if (this.kicks % TOOL_EVERY_KICKS === 0) {
      const other = TOP_PIPES[pipe === TOP_PIPES[0] ? 1 : 0]!
      this.pickups.push({
        x: other.x,
        y: other.y,
        vx: other.dir * 1,
        vy: 0,
        life: 720,
        kind: TOOL_KINDS[Math.floor(this.rng() * TOOL_KINDS.length)]!,
      })
    }
  }

  private spawnEmbers() {
    if (this.level >= SPARKS_FROM && --this.sparkTimer <= 0) {
      this.sparkTimer = Math.round(
        levelCurve(this.level, PIPE_CURVES.sparkEvery),
      )
      const live = this.embers.filter((e) => e.kind === 'spark').length
      if (live < (this.level >= 8 ? 2 : 1)) {
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
      } else if (e.x < -8 || e.x > W + 8) {
        e.life = 0
      }
    }
    this.embers = this.embers.filter((e) => e.life > 0)
  }

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
      b.y -= 0.15
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
        hit.vy = 0
        b.life = 0
        this.addScore(100, hit.x, hit.y - 14)
        this.sound.play('pickup')
      }
    }
    this.bubbles = this.bubbles.filter(
      (b) => b.life > 0 && b.x > -10 && b.x < W + 10,
    )
  }

  private moveCoins() {
    for (const list of [this.coins, this.pickups] as Coin[][]) {
      for (const coin of list) {
        if (coin.life !== Infinity) coin.life--
        coin.vy += GRAVITY * 0.5
        coin.x = wrapX(coin.x + coin.vx)
        coin.y += coin.vy
        const s = segmentUnder(coin.x, 8, coin.y + 6, Math.max(4, coin.vy + 1))
        if (s && coin.vy >= 0) {
          coin.y = s.y - 6
          coin.vy = 0
        }
      }
    }
    this.coins = this.coins.filter((c) => c.life > 0)
    this.pickups = this.pickups.filter((c) => c.life > 0)
  }

  private updateBonus() {
    this.bonusRound--
    this.moveCoins()
    this.collectCoins()
    if (!this.coins.length || this.bonusRound <= 0) {
      const perfect = !this.coins.length
      if (perfect) {
        this.addScore(5000, W / 2, 140)
        this.fx.burst(W / 2, 150, this.fxRng, { count: 24, speed: 2.6 })
      }
      this.bonusRound = 0
      this.coins = []
      this.phaseDelay = 100
      this.sound.play('level')
      this.banner = { text: perfect ? 'PERFECT!' : 'TIME UP', ticks: 100 }
    }
  }

  private touchingPlayer(x: number, y: number, rx: number, ry: number) {
    const p = this.player
    return Math.abs(x - p.x) < rx && Math.abs(y - (p.y - PLAYER_H / 2)) < ry
  }

  private collectCoins() {
    for (const coin of this.coins) {
      if (!this.touchingPlayer(coin.x, coin.y, 11, 16)) continue
      coin.life = 0
      this.addScore(800, coin.x, coin.y)
      this.sound.play('pickup')
      this.fx.burst(coin.x, coin.y, this.fxRng, {
        count: 8,
        colours: [RAMPS.gold[4], RAMPS.gold[3], '#ffffff'],
      })
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
    if (this.invuln > 0) return
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

  // --- attract-mode pilot --------------------------------------------------------
  //
  // Floors are 66 px apart. To climb, the pilot stands just inside a gap in
  // the floor above, jumps straight up, and only steers onto the platform once
  // its feet are above it (steering early bonks its head on the underside).

  private floorOf(y: number): number {
    let best = 310
    for (const s of PIPE_LEVELS)
      if (Math.abs(s.y - y) < Math.abs(best - y)) best = s.y
    return best
  }

  /** Spots on my floor right under a gap in the floor above, with the side the platform is on. */
  private climbSpots(fromY: number): Array<{ x: number; dir: number }> {
    const aboveY = fromY - 66
    const spots: Array<{ x: number; dir: number }> = []
    for (const s of PIPE_LEVELS) {
      if (s.y !== aboveY) continue
      if (s.x0 > 0) spots.push({ x: s.x0 - 9, dir: 1 })
      if (s.x1 < W) spots.push({ x: s.x1 + 9, dir: -1 })
    }
    return spots.filter((spot) => segmentUnder(spot.x, 1, fromY, 1))
  }

  private steerToward(frame: InputFrame, x: number, slack = 5) {
    const p = this.player
    if (x < p.x - slack) frame.held.left = true
    else if (x > p.x + slack) frame.held.right = true
  }

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
    const coin = this.coins[0]
    // Danger on my own floor: back away.
    const threat =
      live.find(
        (c) =>
          c.flipped === 0 &&
          c.y === myFloor &&
          Math.abs(c.x - p.x) < 34 &&
          Math.sign(c.dir) === Math.sign(p.x - c.x),
      ) ??
      // A flea in mid-hop lands anywhere near: keep clear of it too.
      this.critters.find(
        (c) =>
          c.kind === 'flea' &&
          !c.kicked &&
          !c.onGround &&
          c.trapped === 0 &&
          Math.abs(c.x - p.x) < 44 &&
          myFloor - c.y < 60 &&
          myFloor - c.y > -8,
      )
    if (threat && this.invuln <= 0) {
      if (threat.x > p.x) held.left = true
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
    // Pick a job: kick a flipped critter, else bump the nearest walker from below, else chase a coin.
    const flipped = live
      .filter((c) => c.flipped > 0)
      .sort((a, b) => Math.abs(a.y - myFloor) - Math.abs(b.y - myFloor))[0]
    const walker = live
      .filter((c) => c.flipped === 0 && c.y < 300)
      .sort(
        (a, b) => Math.abs(a.y + 66 - myFloor) - Math.abs(b.y + 66 - myFloor),
      )[0]
    let goalFloor: number | null = null
    let goalX = p.x
    let jumpWhenUnder = false
    if (flipped) {
      goalFloor = flipped.y
      goalX = flipped.x
    } else if (walker) {
      goalFloor = walker.y + 66
      goalX = walker.x
      jumpWhenUnder = true
    } else if (coin) {
      goalFloor = this.floorOf(coin.y + 10)
      goalX = coin.x
    }
    if (goalFloor === null) {
      this.steerToward(frame, W / 2)
      return frame
    }
    if (goalFloor === myFloor) {
      this.steerToward(frame, goalX, jumpWhenUnder ? 4 : 2)
      if (jumpWhenUnder && Math.abs(goalX - p.x) < 8) frame.pressed.a = true
      return frame
    }
    if (goalFloor < myFloor) {
      // Climb: walk to the nearest spot under a gap, then jump.
      const spots = this.climbSpots(myFloor)
      const spot = spots.sort(
        (a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x),
      )[0]
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
    const seg = segmentUnder(p.x, 1, myFloor, 1)
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
    const shake = this.kindShake > 0 ? Math.sin(this.tick * 3) * 2 : 0
    g.save()
    g.translate(0, shake)
    g.fillStyle = RAMPS.night[0]
    g.fillRect(0, -4, W, H + 8)
    this.renderBackdrop(g)
    this.renderFloors(g)
    this.renderKindBlock(g)
    const visible =
      this.alive && !(this.invuln > 0 && Math.floor(this.invuln / 6) % 2 === 0)
    this.renderShadows(g, visible)
    for (const coin of this.coins) this.renderCoin(g, coin)
    for (const tool of this.pickups) this.renderPickup(g, tool)
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
  }

  private renderBackdrop(g: CanvasRenderingContext2D) {
    // HDMA dusk sky and the moon, painted once.
    cachedLayer(g, 'pipe-pals-sky', W, H, (k) => {
      bandedGradient(k, 0, 0, W, GROUND_Y, SKY_STOPS, 4)
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

  private renderFloors(g: CanvasRenderingContext2D) {
    // Bevelled bricks at rest, painted once; a bumped stretch is redrawn lifted on top.
    cachedLayer(g, 'pipe-pals-floors', W, H, (k) => {
      for (const s of PIPE_LEVELS) {
        k.fillStyle = INK
        k.fillRect(s.x0 - 1, s.y - 1, s.x1 - s.x0 + 2, THICK + 2)
        brickRun(k, s, s.x0, s.x1, 0)
        // Lit and shadowed end faces.
        const ramp = s.y === 310 ? RAMPS.purple : RAMPS.teal
        k.fillStyle = ramp[3]
        k.fillRect(s.x0, s.y + 1, 1, THICK - 2)
        k.fillStyle = ramp[0]
        k.fillRect(s.x1 - 1, s.y + 1, 1, THICK - 1)
      }
    })
    const bump = this.bump
    if (!bump) return
    const lift = Math.round(Math.sin((bump.ticks / BUMP_TICKS) * Math.PI) * 5)
    for (const s of PIPE_LEVELS) {
      if (s.y !== bump.y) continue
      for (let x = s.x0; x < s.x1; x += 8) {
        if (Math.abs(x + 4 - bump.x) >= BUMP_REACH || lift <= 0) continue
        g.fillStyle = INK
        g.fillRect(Math.max(x, s.x0), s.y, Math.min(8, s.x1 - x), THICK)
        brickRun(g, s, x, x + 8, lift)
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
    const kb = KIND_BLOCK
    const squash = this.kindShake > 0 ? 3 : 0
    glow(
      g,
      kb.x + kb.w / 2,
      kb.y + kb.h / 2,
      28,
      RAMPS.pink[3],
      0.28 + 0.1 * Math.sin(this.tick / 10),
    )
    bevel(g, kb.x, kb.y + squash, kb.w, kb.h - squash, RAMPS.pink, {
      depth: 2,
    })
    drawText(g, '*', kb.x + kb.w / 2, kb.y + 3 + squash, {
      align: 'center',
      color: '#ffffff',
      outline: INK,
    })
    // One gold stud per use left.
    for (let i = 0; i < this.kindBlockUses; i++) {
      const x = kb.x + 5 + i * 6
      const y = kb.y + kb.h - 3
      g.fillStyle = INK
      g.fillRect(x - 1, y - 1, 5, 3)
      g.fillStyle = RAMPS.gold[3]
      g.fillRect(x, y, 3, 1)
      g.fillStyle = RAMPS.gold[4]
      g.fillRect(x, y, 1, 1)
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
  }

  private renderCritter(g: CanvasRenderingContext2D, c: Critter) {
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
    const label =
      this.bonusRound > 0
        ? `BONUS ${Math.ceil(this.bonusRound / 60)}`
        : `PHASE ${this.level}`
    hudPanel(g, 26, H - 16, measureText(label) + 14, 13)
    drawText(g, label, 33, H - 13, {
      color: RAMPS.purple[4],
      outline: INK,
    })
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
