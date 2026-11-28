// /utils/arcade/games/brickBloom.ts
//
// Brick Bloom -- the Kind Robots Arcade's Breakout / Arkanoid riff (conductor
// kr-arcade/t-009 game factory, batch 3). A paddle bot bounces a pollen ball
// into walls of glitch crates; every crate cracked frees a flower. Clear every
// breakable crate to bloom the stage.
//
// Where the ball meets the paddle decides its angle (the edges send it off
// steep and wide). Some cracked crates drop seeds to catch: W widens the
// paddle, S makes it sticky (catch the ball, aim, let go with A), M splits the
// ball in three, C calms the ball down, and a rare + is a spare paddle.
//
// Stages cycle through wall patterns and ramp on BLOOM_CURVES: faster balls,
// crates that take more hits, bolted crates that never break (from stage 4),
// and a drifting gloom puff that knocks the ball off course (from stage 3).
// Arrows move the paddle; A launches (or lets go of) the ball.
//
// Depth pass, slice 1 (conductor kr-arcade/t-078, "The Glasshouse Grand Tour"): walls are authored
// data (utils/arcade/brickBloom/walls.ts); cracked crates send flowers down to plant the Bloom Bed,
// and a plot in full bloom bounces a missed ball back once. The Pollen Chain multiplies crates
// cracked between paddle touches, Last-Crate Rush sends Bumble in for the last four, B right after
// a paddle hit while moving is the Leaf Curl, the ball glows hotter as it speeds up, the roof glass
// chimes for a double, and sprout, hinge and puffball crates plus the R, T and Q seeds join in.
// The rules' numbers live in utils/arcade/brickBloom/rules.ts.
//
// Slice 2 (conductor kr-arcade/t-079): the Grand Tour climbs the Seedling House and Vine Hall vent
// maps (houses.ts) past pollen mites, snail bots and ladybot rings to each house's boss, Mister Mulch
// and the Tangle Rose (bosses.ts). A house map card follows every wall and a title card opens every
// house (map.ts); between houses the Potting Bench sells kit for petals earned in play, a vault on
// each house's rich route hides a golden seed, and the tour saves at each glasshouse (bench.ts).
//
// Slice 3 (conductor kr-arcade/t-080): the tour goes on through the Cactus Dome (prickle and
// sand-timer crates, tumbleweeds and shell beetles, the V Vent seed, Sunny Saguaro) and the Lily
// Pond House (the lower wall under water, drifting lily pads, bubble bumpers, frog bots and mirror
// bugs, the D Duo Paddle seed, Queen Koi), with golden seeds 3-4 (crates.ts, pests.ts, art.ts).

import { levelCurve } from '../curve'
import {
  BALL_R,
  BUMBLE_TAP_TICKS,
  CHIME_MULT,
  COMPASS_TICKS,
  CURL_TICKS,
  CURL_TURN,
  CURL_WINDOW,
  FULL_BLOOM,
  HEAT_COLORS,
  LEFT,
  PLOTS,
  RAIN_EVERY,
  RAIN_TICKS,
  RIGHT,
  RUSH_AT,
  THORN_TICKS,
  TOP,
  W,
  ballHeat,
  bedSave,
  cashIn,
  chainColor,
  chainMultiplier,
  coolSpeed,
  curlDirection,
  newBed,
  plantPetal,
  plotCenter,
  plotIndex,
  trample,
  predictPath,
  rotate,
  rushActive,
  rushBonus,
  steerToward,
} from '../brickBloom/rules'
import type { Bed } from '../brickBloom/rules'
import {
  miteGone,
  miteHit,
  mitesHatch,
  popMite,
  spawnMiteLine,
  stepMite,
} from '../brickBloom/mites'
import type { Mite, MiteLine } from '../brickBloom/mites'
import {
  dotHit,
  popDot,
  ringShields,
  ringedCrate,
  spawnRing,
  stepRing,
} from '../brickBloom/ladybots'
import type { Ladybot, LadybotRing } from '../brickBloom/ladybots'
import {
  crackSnail,
  snailHit,
  snailsPatrol,
  spawnSnail,
  stepSnail,
} from '../brickBloom/snails'
import type { Snail } from '../brickBloom/snails'
import {
  HOUSES,
  CONSERVATORY_INDEX,
  houseAt,
  mirrorWall,
  HOUSE_LEGEND,
  TOUR_START,
  houseWall,
  nextTourPos,
  ventSide,
} from '../brickBloom/houses'
import type { TourPos } from '../brickBloom/houses'
import { COLS, ROWS, parseWall, wallFor } from '../brickBloom/walls'
import type { CrateKind } from '../brickBloom/walls'
import {
  BOSS_SPECS,
  SHOT_R,
  SWEEP_H,
  WHIRL_CENTRE,
  WHIRL_TURN,
  armKnock,
  armTouches,
  bossHealth,
  bossOf,
  bossRect,
  bossTouches,
  guardPhase,
  gloomOpen,
  hitBoss,
  openBoss,
  spawnBoss,
  stepBoss,
  THORN_Y,
  thornWidth,
  sweepCellAt,
  whirling,
} from '../brickBloom/bosses'
import {
  BUMPER_SCORE,
  SAND_OPEN,
  SAND_RUN,
  WATER_CURRENT,
  WATER_DRAG,
  bumperBounce,
  currentDir,
  driftToward,
  inWater,
  lilyGoal,
  prickled,
  sandOpen,
  spawnBumper,
  stepBumper,
} from '../brickBloom/crates'
import type { Bumper } from '../brickBloom/crates'
import {
  BEETLE_H,
  BEETLE_SCORE,
  FROG_R,
  FROG_SCORE,
  MIRROR_SCORE,
  TUMBLE_EVERY,
  TUMBLE_R,
  TUMBLE_SCORE,
  TUMBLE_Y,
  beetleBonk,
  beetleTouches,
  frogTouches,
  mirrorTouches,
  pestsOf,
  spawnBeetle,
  spawnFrog,
  spawnMirror,
  spawnTumbleweed,
  splitGhost,
  stepBeetle,
  stepFrog,
  stepGhost,
  stepMirror,
  stepTumbleweed,
  tumbleTouches,
} from '../brickBloom/pests'
import type {
  Beetle,
  Frog,
  Ghost,
  MirrorBug,
  Tumbleweed,
} from '../brickBloom/pests'
import {
  VENT_Y0,
  VENT_Y1,
  drawBallShadow,
  drawBeetle,
  drawBumper,
  drawDuo,
  drawFrog,
  drawGhost,
  drawKoi,
  drawMirror,
  drawSaguaro,
  drawTumbleweed,
  drawVent,
  drawWater,
  markBubble,
  markLily,
  markPrickle,
  markSand,
  paintCacti,
} from '../brickBloom/art'
import type { Boss, BossId, BossShot, Sweep } from '../brickBloom/bosses'
import {
  BENCH_ITEMS,
  GOLDEN_TOTAL,
  MAX_PETALS,
  PETALS,
  STARTER_SEEDS,
  VAULTS,
  VAULT_HITS,
  buy,
  emptyKit,
  freshSave,
  hasAllGoldenSeeds,
  owned,
  readBloomSave,
  resumable,
  vaultAt,
} from '../brickBloom/bench'
import type { BloomSave, Kit, StarterSeed } from '../brickBloom/bench'
import { HOUSE_CARDS, houseMap, richRoute } from '../brickBloom/map'
import { drawText } from '../font'
import {
  INK,
  RAMPS,
  Sparkles,
  backdropRng,
  bandedGradient,
  bevel,
  cachedLayer,
  drawRidge,
  drawSprite,
  drawStars,
  dropShadow,
  gauge,
  glow,
  hudPanel,
  mix,
  pixelSprite,
  rgba,
  ridge,
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

const H = 320
const PADDLE_Y = 296
const PADDLE_H = 6
const PADDLE_W = 36
/** The Potting Bench's wider base paddle. */
const ROOMY_W = 44
const WIDE_W = 56
/** Mister Mulch's clods make the paddle sluggish; a Tangle Rose petal stings it still. */
const MUDDY_TICKS = 120
const STUNG_TICKS = 50
/** Swat a clod with the paddle moving at least this fast and it flies off. */
const SWAT_SPEED = 2.5
const GOLDEN_FALL = 0.9
const MAP_TICKS = 150
const HOUSE_CARD_TICKS = 240
const BRICK_W = (RIGHT - LEFT) / COLS
const BRICK_H = 10
const BRICK_TOP = 48
const START_LIVES = 3
const SERVE_TICKS = 50
const CLEAR_TICKS = 150
const LOST_TICKS = 70
const POWER_TICKS = 60 * 14
const EXTRA_AT = [20_000, 60_000, 120_000]
const MAX_BALLS = 5
/** Where a missed ball meets the Bloom Bed, and where the bed's flowers stand. */
const BED_SAVE_Y = 306
const BED_FEET = H - 1
/** Hinge crates swing shut for the first HINGE_SHUT ticks of every HINGE_PERIOD. */
const HINGE_PERIOD = 150
const HINGE_SHUT = 100
const PETAL_SPEED = 1.3
const DROPLET_SPEED = 4
/** The Vent seed keeps its hatch open this long; the Duo Paddle hovers this high, this wide. */
const VENT_TICKS = 60 * 10
const VENT_BONUS = 500
const DUO_Y = PADDLE_Y - 46
const DUO_W = 28
const PRICKLE_CATCH = 300
/** The Cactus Dome and the Lily Pond House (tour house indexes). */
const DOME = 2
const POND = 3
const NIGHT = 4
/** What each boss says when the ball meets its shield, its HUD tag, and its cheering-up. */
const SHIELD_WORDS: Record<BossId, string> = {
  'mister-mulch': 'PLATED!',
  'tangle-rose': 'ROOTED!',
  'sunny-saguaro': 'WAIT FOR THE BLOOM',
  'queen-koi': 'SPLASH!',
  'gloom-bloom': 'PETALS SHUT!',
  thorn: 'ROOT SHIELD!',
}
const BOSS_TAGS: Record<BossId, string> = {
  'mister-mulch': 'MULCH',
  'tangle-rose': 'ROSE',
  'sunny-saguaro': 'SAGUARO',
  'queen-koi': 'KOI',
  'gloom-bloom': 'GLOOM',
  thorn: 'THORN',
}
const CHEER_WORDS: Record<BossId, string> = {
  'mister-mulch': 'ACHOO!',
  'tangle-rose': 'IN FULL BLOOM!',
  'sunny-saguaro': 'SUNNY AGAIN!',
  'queen-koi': 'A SPLASH OF JOY!',
  'gloom-bloom': 'MOONFLOWER IN BLOOM!',
  thorn: 'WELCOME TO THE GARDEN!',
}

/** Crate colours by row, top first (the top rows score more). */
const ROW_COLORS = [
  '#f472b6',
  '#f87171',
  '#fb923c',
  '#facc15',
  '#a3e635',
  '#4ade80',
  '#2dd4bf',
  '#38bdf8',
  '#a78bfa',
]
const FLOWER_COLORS = ['#f9a8d4', '#fde047', '#c4b5fd', '#fdba74', '#86efac']

export const BLOOM_CURVES = {
  /** Ball speed (pixels per tick) at the start of a stage. */
  speed: { start: 2.4, step: 0.18, limit: 4.2 },
  /** The most a ball speeds up to as it keeps hitting things. */
  maxSpeed: { start: 3.6, step: 0.2, limit: 5.6 },
  /** Hits the toughest crates take. */
  tough: { start: 1, step: 0.5, limit: 4 },
  /** Chance a cracked crate drops a seed. */
  seedChance: { start: 0.16, step: -0.01, limit: 0.09 },
  /** Bolted (unbreakable) crates per stage. */
  bolts: { start: -3, step: 1, limit: 8 },
  puffs: { start: -1, step: 0.5, limit: 2 },
} as const

type Seed = 'W' | 'S' | 'M' | 'C' | '+' | 'R' | 'T' | 'Q' | 'V' | 'D'
const SEEDS: Seed[] = ['W', 'W', 'S', 'M', 'M', 'C', 'C', '+', 'R', 'T', 'Q']
const SEEDS_DOME: Seed[] = [...SEEDS, 'V']
const SEEDS_POND: Seed[] = [...SEEDS, 'V', 'D']
const SEED_COLORS: Record<Seed, string> = {
  W: '#38bdf8',
  S: '#4ade80',
  M: '#f472b6',
  C: '#c4b5fd',
  '+': '#fde047',
  R: '#67e8f9',
  T: '#fb7185',
  Q: '#e879f9',
  V: '#fbbf24',
  D: '#a5b4fc',
}

type Brick = {
  col: number
  row: number
  hp: number
  maxHp: number
  /** Bolted crates never break and don't count toward clearing. */
  bolt: boolean
  kind: CrateKind
  /** A hinge crate swings open on a beat and the ball passes through. */
  open: boolean
  flash: number
  /** A boss's guard: Mister Mulch's face plates, the Tangle Rose's feeding roots. */
  guard?: boolean
  /** The house's golden seed vault. */
  vault?: boolean
  /** A lily pad's drift along its row, in pixels. */
  dx?: number
  /** A sand timer's place in its run-and-flip cycle. */
  sand?: number
}
/** A golden seed falling from its cracked vault: catch it to keep it for good. */
type Golden = { x: number; y: number; house: string }
/** A full-screen card between walls: the house title card or the house map. */
type Card = { kind: 'house' | 'map'; ticks: number; total: number }
type Bench = { house: number; cursor: number; seed: number; ticks: number }
type Note = { text: string; ticks: number }
type Ball = {
  x: number
  y: number
  vx: number
  vy: number
  /** Riding the paddle (serve or sticky catch), at this offset. */
  stuck: number | null
  /** Ticks of Leaf Curl left, and which way it bends. */
  curl: number
  curlDir: number
  /** Ticks since the paddle last hit it, and the paddle's direction then (the curl window). */
  since: number
  hitDir: number
}
type Drop = { x: number; y: number; kind: Seed }
type Puff = { x: number; y: number; vx: number; vy: number; hp: number }
type Flower = { x: number; y: number; vy: number; life: number; color: string }
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
/** A cracked crate's flower, falling to plant itself in the Bloom Bed. */
type Petal = { x: number; y: number; color: string }
type Droplet = { x: number; y: number }
type Bumble = { x: number; y: number; angle: number; tap: number }
type Floater = { x: number; y: number; text: string; life: number }

// --- 16-bit art (utils/arcade/snes.ts) -------------------------------------------

/** A five-step ramp around one colour: inked shadows below it, white-lit steps above. */
function rampOf(base: string): Ramp {
  return [
    mix(base, INK, 0.68),
    mix(base, INK, 0.36),
    mix(base, base, 0),
    mix(base, '#ffffff', 0.42),
    mix(base, '#ffffff', 0.8),
  ]
}

const ROW_RAMPS = ROW_COLORS.map(rampOf)
const SEED_RAMPS = Object.fromEntries(
  Object.entries(SEED_COLORS).map(([k, c]) => [k, rampOf(c)]),
) as Record<Seed, Ramp>

const CRATE_W = Math.round(BRICK_W) - 2
const CRATE_H = BRICK_H - 2

/**
 * A glossy crate: a lit top edge and a specular glint, a pale gloss band over the base face,
 * a shadowed lower lip and a slat seam down the middle (bolted crates get rivets instead).
 */
function crateSprite(
  ramp: Ramp,
  kind: 'crate' | 'bolt' | 'flash',
): PixelSprite {
  const w = CRATE_W
  const h = CRATE_H
  const seam = w >> 1
  const rows: string[] = []
  for (let y = 0; y < h; y++) {
    let row = ''
    for (let x = 0; x < w; x++) {
      const left = x === 0
      const right = x === w - 1
      let ch: string
      if (y === 0) ch = right ? 'L' : 'H'
      else if (y === h - 1) ch = left ? 'S' : 'D'
      else if (y === h - 2) ch = left ? 'B' : 'S'
      else if (left) ch = y <= 2 ? 'H' : 'L'
      else if (right) ch = 'S'
      else if (y === 1 && x <= 2) ch = 'W'
      else if (y <= 2) ch = 'L'
      else ch = 'B'
      if (kind === 'crate' && y >= 2 && y <= h - 3) {
        if (x === seam) ch = 'S'
        if (x === seam + 1) ch = 'L'
      }
      if (kind === 'bolt' && y >= 3 && y <= 4) {
        for (const r of [3, w - 5]) {
          if (x === r) ch = y === 3 ? 'W' : 'S'
          if (x === r + 1) ch = 'D'
        }
      }
      row += ch
    }
    rows.push(row)
  }
  return pixelSprite(rows, {
    W: '#ffffff',
    H: ramp[4],
    L: ramp[3],
    B: ramp[2],
    S: ramp[1],
    D: ramp[0],
  })
}

const CRATE_SPRITES = ROW_RAMPS.map((r) => crateSprite(r, 'crate'))
const BOLT_SPRITE = crateSprite(RAMPS.steel, 'bolt')
const FLASH_SPRITE = crateSprite(RAMPS.cream, 'flash')
const SPROUT_CRATE = crateSprite(RAMPS.leaf, 'crate')
const HINGE_CRATE = crateSprite(RAMPS.earth, 'crate')
const PUFF_CRATE = crateSprite(RAMPS.pink, 'crate')
const ROOT_CRATE = crateSprite(RAMPS.rust, 'crate')
const VINE_CRATE = crateSprite(RAMPS.leaf, 'crate')
const TRELLIS_CRATE = crateSprite(RAMPS.cream, 'crate')
const PRICKLE_CRATE = crateSprite(rampOf('#65a30d'), 'crate')
const SAND_SHUT = crateSprite(RAMPS.earth, 'flash')
const SAND_FLIPPED = crateSprite(RAMPS.cream, 'flash')
const LILY_CRATE = crateSprite(rampOf('#16a34a'), 'flash')
const BUBBLE_CRATE = crateSprite(RAMPS.water, 'flash')
const VAULT_CRATE = crateSprite(RAMPS.gold, 'bolt')
/** The Dome's and the Pond's crates (a sand timer looks dark while its sand runs). */
const KIND_SPRITE: Partial<Record<CrateKind, (shut: boolean) => PixelSprite>> =
  {
    prickle: () => PRICKLE_CRATE,
    sand: (shut) => (shut ? SAND_SHUT : SAND_FLIPPED),
    lily: () => LILY_CRATE,
    bubble: () => BUBBLE_CRATE,
  }
const PLATE_CRATE = crateSprite(RAMPS.earth, 'bolt')

/**
 * The paddle bot: a lit tray with pink bumper caps and an inked visor with two shining eyes
 * (closed in the blink frame). Built per width, since the wide seed swaps in a longer tray.
 */
function paddleSprite(w: number, body: Ramp, blink: boolean): PixelSprite {
  const c = w / 2
  const rows: string[] = []
  for (let y = 0; y < PADDLE_H; y++) {
    let row = ''
    for (let x = 0; x < w; x++) {
      const edge = x === 0 || x === w - 1
      if (edge && (y === 0 || y === PADDLE_H - 1)) {
        row += '.'
        continue
      }
      const v = x - c
      if ((y === 2 || y === 3) && v >= -5 && v < 5) {
        const eye = (v >= -3 && v <= -2) || (v >= 1 && v <= 2)
        if (eye && (y === 3 || !blink))
          row += y === 2 && (v === -3 || v === 1) ? 'w' : 'y'
        else row += 'k'
        continue
      }
      const cap = x < 4 || x >= w - 4
      let ch: string
      if (y === 0) ch = 'H'
      else if (y === PADDLE_H - 1) ch = 'D'
      else if (y === PADDLE_H - 2) ch = x === 0 ? 'B' : 'S'
      else if (x === 0) ch = y === 1 ? 'H' : 'L'
      else if (x === w - 1) ch = 'S'
      else if (y === 1) ch = x >= 5 && x <= 8 ? 'H' : 'L'
      else ch = x === 4 || x === w - 5 ? 'S' : 'B'
      row += cap ? ch.toLowerCase() : ch
    }
    rows.push(row)
  }
  return pixelSprite(rows, {
    H: body[4],
    L: body[3],
    B: body[2],
    S: body[1],
    D: body[0],
    h: RAMPS.pink[4],
    l: RAMPS.pink[3],
    b: RAMPS.pink[2],
    s: RAMPS.pink[1],
    d: RAMPS.pink[0],
    k: INK,
    y: RAMPS.gold[3],
    w: '#ffffff',
  })
}

function paddleSet(w: number) {
  return {
    sky: [paddleSprite(w, RAMPS.sky, false), paddleSprite(w, RAMPS.sky, true)],
    leaf: [
      paddleSprite(w, RAMPS.leaf, false),
      paddleSprite(w, RAMPS.leaf, true),
    ],
  } as const
}

const PADDLE_SPRITES = {
  normal: paddleSet(PADDLE_W),
  roomy: paddleSet(ROOMY_W),
  wide: paddleSet(WIDE_W),
}

const LIFE_SPRITE = pixelSprite(['hLLLLLLLs', 'pBkykykBs', 'pSSSSSSSd'], {
  h: RAMPS.pink[4],
  p: RAMPS.pink[2],
  s: RAMPS.pink[1],
  d: RAMPS.pink[0],
  L: RAMPS.sky[3],
  B: RAMPS.sky[2],
  S: RAMPS.sky[1],
  k: INK,
  y: RAMPS.gold[3],
})

/** The pollen ball: lit from the upper left, its spore speckles shifting as it spins. */
const BALL_PALETTE = {
  W: '#ffffff',
  Y: RAMPS.gold[3],
  y: RAMPS.gold[2],
  d: RAMPS.gold[1],
}
const BALL_SPRITES = [
  pixelSprite(['.YYy.', 'YWYyy', 'YYydy', 'ydyyd', '.ydd.'], BALL_PALETTE),
  pixelSprite(['.YYy.', 'YWyYy', 'YYyyy', 'yyydd', '.dyd.'], BALL_PALETTE),
] as const

/** Bud, half-open and full bloom, per flower colour. */
function flowerSprites(colour: string): readonly PixelSprite[] {
  const ramp = rampOf(colour)
  const palette = {
    H: ramp[4],
    P: ramp[2],
    p: ramp[1],
    C: RAMPS.gold[4],
    c: RAMPS.gold[3],
    o: RAMPS.gold[1],
    g: RAMPS.leaf[1],
    G: RAMPS.leaf[3],
  }
  return [
    pixelSprite(['..H..', '.HPp.', '.Ppp.', '.gGg.', '..g..'], palette),
    pixelSprite(['.H.P.', 'HPCPp', '.Ppp.', '.gGg.', '..g..'], palette),
    pixelSprite(
      [
        '.HP.HP.',
        'HPPpPPp',
        '.pCCcp.',
        'HPCcoPp',
        '.pcoop.',
        'HPPpPPp',
        '.Pp.pp.',
      ],
      palette,
    ),
  ]
}

const FLOWER_SPRITES: Record<string, readonly PixelSprite[]> =
  Object.fromEntries(FLOWER_COLORS.map((c) => [c, flowerSprites(c)]))

const SPROUT_SPRITE = pixelSprite(['G.G', 'gGg', '.g.', '.d.'], {
  G: RAMPS.leaf[3],
  g: RAMPS.leaf[2],
  d: RAMPS.leaf[1],
})

const LEAF_SPRITE = pixelSprite(['.GG', 'Ggd', 'gd.'], {
  G: RAMPS.leaf[3],
  g: RAMPS.leaf[2],
  d: RAMPS.leaf[1],
})

/** A seed capsule, rolling: its dark seam band steps across as it falls. */
function capsuleSprite(ramp: Ramp, frame: number): PixelSprite {
  const w = 15
  const h = 9
  const band = frame ? 9 : 4
  const rows: string[] = []
  for (let y = 0; y < h; y++) {
    const trim = y === 0 || y === h - 1 ? 2 : y === 1 || y === h - 2 ? 1 : 0
    let row = ''
    for (let x = 0; x < w; x++) {
      if (x < trim || x >= w - trim) {
        row += '.'
        continue
      }
      let ch =
        y <= 1
          ? 'H'
          : y === 2
            ? 'L'
            : y >= h - 2
              ? 'D'
              : y === h - 3
                ? 'S'
                : 'B'
      if (x === trim && y > 1 && y < h - 2) ch = 'L'
      if (x === w - 1 - trim && y > 1) ch = 'S'
      if ((x === band || x === band + 1) && y > 1 && y < h - 2) ch = 'S'
      row += ch
    }
    rows.push(row)
  }
  return pixelSprite(rows, {
    H: ramp[4],
    L: ramp[3],
    B: ramp[2],
    S: ramp[1],
    D: ramp[0],
  })
}

function capsuleFrames(kind: Seed): readonly PixelSprite[] {
  return [
    capsuleSprite(SEED_RAMPS[kind], 0),
    capsuleSprite(SEED_RAMPS[kind], 1),
  ]
}

const CAPSULE_SPRITES: Record<Seed, readonly PixelSprite[]> = {
  W: capsuleFrames('W'),
  S: capsuleFrames('S'),
  M: capsuleFrames('M'),
  C: capsuleFrames('C'),
  '+': capsuleFrames('+'),
  R: capsuleFrames('R'),
  T: capsuleFrames('T'),
  Q: capsuleFrames('Q'),
  V: capsuleFrames('V'),
  D: capsuleFrames('D'),
}

const GLOOM: Ramp = ['#1a1430', '#3a3058', '#5a5080', '#8a82ae', '#c8c2e0']
const GLOOM_FRAYED: Ramp = [
  '#2a2244',
  '#4a4068',
  '#6e6490',
  '#a098c0',
  '#dcd6f0',
]

type Theme = {
  sky: readonly string[]
  frame: string
  far: string
  farRim: string
  near: string
  nearRim: string
  stars: boolean
  cacti?: boolean
}

/** One greenhouse sky per stage, cycling: dusk, moonlight, dawn, and a teal glasshouse night. */
const THEMES: readonly Theme[] = [
  {
    sky: ['#120f33', '#24124f', '#43246e', '#6b2f78', '#8f3a72'],
    frame: '#2c2350',
    far: '#2a2a52',
    farRim: '#4a3f7a',
    near: RAMPS.leaf[0],
    nearRim: RAMPS.leaf[1],
    stars: true,
  },
  {
    sky: [RAMPS.night[0], RAMPS.night[1], RAMPS.night[2], '#1f3a6e', '#2b5a8a'],
    frame: '#1c2a4e',
    far: '#16305a',
    farRim: '#2f5a8a',
    near: '#0f3326',
    nearRim: RAMPS.leaf[1],
    stars: true,
  },
  {
    sky: ['#24124f', '#4c2a99', '#8a3a8a', '#b84a6e', '#d8685a'],
    frame: '#3a2266',
    far: '#4a2458',
    farRim: '#7a3a6e',
    near: RAMPS.leaf[0],
    nearRim: RAMPS.leaf[1],
    stars: false,
  },
  {
    sky: [RAMPS.night[0], RAMPS.teal[0], '#0f4f5a', '#127070', '#1a8a80'],
    frame: '#0c2e3a',
    far: '#0c3a44',
    farRim: '#1a6a6a',
    near: '#0c2a20',
    nearRim: RAMPS.leaf[1],
    stars: false,
  },
  // The Cactus Dome at high noon: a bleached sky over sand dunes.
  {
    sky: ['#3b82c4', '#5aa0d8', '#8cc4e8', '#e8d8a8', '#f0c890'],
    frame: '#8a6a3a',
    far: '#c8a060',
    farRim: '#e8c890',
    near: '#9a7040',
    nearRim: '#c89a5a',
    stars: false,
    cacti: true,
  },
  // The Lily Pond House on a rainy afternoon: soft green-grey light.
  {
    sky: ['#1e3a4a', '#2a5060', '#3a6a70', '#4a8078', '#5a9480'],
    frame: '#1a3a3a',
    far: '#1f4a40',
    farRim: '#2f6a58',
    near: '#123a2a',
    nearRim: RAMPS.leaf[1],
    stars: false,
  },
]
/** The first four skies cycle by stage; the Dome and the Pond have their own. */
const CYCLE_THEMES = 4

const STARS = starField(13, 46, W, 150)
const FAR_RIDGE = ridge(17, W, 30, 4)
const NEAR_RIDGE = ridge(23, W, 12, 3)
const HEDGE_FLECKS = (() => {
  const rand = backdropRng(19)
  return Array.from({ length: 70 }, () => ({
    x: Math.floor(rand() * W),
    y: 286 + Math.floor(rand() * 20),
  }))
})()
const FIREFLIES = (() => {
  const rand = backdropRng(37)
  return Array.from({ length: 6 }, () => ({
    x: 24 + rand() * (W - 48),
    y: 236 + rand() * 40,
    phase: rand() * Math.PI * 2,
    speed: 0.6 + rand() * 0.6,
  }))
})()
const SOIL_TOP = 306
const PANE_X = [LEFT, 68, 128, 188, RIGHT]
const PANE_Y = [TOP, 170, 230, 270]

/** The greenhouse: banded sky through the glass, hills, a hedge, the soil bed and the trellis. */
function paintGarden(k: CanvasRenderingContext2D, t: Theme) {
  bandedGradient(k, 0, TOP, W, H - TOP, t.sky, 6)
  if (t.stars) {
    k.save()
    k.translate(0, TOP)
    drawStars(k, STARS, 0, RAMPS.purple)
    k.restore()
  }
  drawRidge(k, FAR_RIDGE, {
    base: 272,
    bottom: H,
    width: W,
    fill: t.far,
    rim: t.farRim,
  })
  // Glazing bars and the sheen on each pane of glass.
  for (let i = 1; i < PANE_X.length - 1; i++) {
    const x = PANE_X[i]!
    k.fillStyle = t.frame
    k.fillRect(x - 1, TOP, 3, 280 - TOP)
    k.fillStyle = rgba(RAMPS.steel[4], 0.14)
    k.fillRect(x - 1, TOP, 1, 280 - TOP)
  }
  for (let j = 1; j < PANE_Y.length - 1; j++) {
    const y = PANE_Y[j]!
    k.fillStyle = t.frame
    k.fillRect(LEFT, y - 1, RIGHT - LEFT, 3)
    k.fillStyle = rgba(RAMPS.steel[4], 0.14)
    k.fillRect(LEFT, y - 1, RIGHT - LEFT, 1)
  }
  k.fillStyle = rgba('#ffffff', 0.06)
  for (let i = 0; i < PANE_X.length - 1; i++) {
    for (let j = 0; j < PANE_Y.length - 1; j++) {
      const px = PANE_X[i]! + 8
      const py = PANE_Y[j]! + 26
      for (let s = 0; s < 18; s++) {
        k.fillRect(px + s, py - s, 3, 1)
        if (s < 10) k.fillRect(px + s + 8, py - s, 1, 1)
      }
    }
  }
  // The hedge, flecked with lit leaves.
  drawRidge(k, NEAR_RIDGE, {
    base: 298,
    bottom: H,
    width: W,
    step: 3,
    fill: t.near,
    rim: t.nearRim,
  })
  k.fillStyle = t.nearRim
  for (const f of HEDGE_FLECKS) k.fillRect(f.x, f.y, 2, 1)
  if (t.cacti) paintCacti(k)
  // The soil bed, furrowed; the live Bloom Bed is drawn over it.
  bandedGradient(
    k,
    0,
    SOIL_TOP,
    W,
    H - SOIL_TOP,
    [RAMPS.earth[2], RAMPS.earth[1], RAMPS.earth[0]],
    3,
  )
  k.fillStyle = RAMPS.earth[3]
  k.fillRect(0, SOIL_TOP, W, 1)
  for (let x = 4; x < W; x += 8) {
    k.fillStyle = RAMPS.earth[0]
    k.fillRect(x, SOIL_TOP + 5 + ((x >> 3) % 2) * 5, 4, 1)
    k.fillStyle = RAMPS.earth[3]
    k.fillRect(x + 1, SOIL_TOP + 4 + ((x >> 3) % 2) * 5, 2, 1)
  }
  // Trellis posts with climbing ivy, and the roof beam with ivy hanging from it.
  for (const x of [1, RIGHT + 1]) {
    bevel(k, x, TOP - 3, LEFT - 2, H, RAMPS.earth, { depth: 1 })
    k.fillStyle = RAMPS.earth[0]
    for (let y = TOP + 4; y < H; y += 10) k.fillRect(x, y, LEFT - 2, 1)
  }
  for (let y = TOP + 6, i = 0; y < H - 8; y += 14, i++) {
    drawSprite(k, LEAF_SPRITE, i % 2 ? 3 : 5, y, { flipX: i % 2 === 1 })
    drawSprite(k, LEAF_SPRITE, RIGHT + (i % 2 ? 5 : 3), y + 7, {
      flipX: i % 2 === 0,
    })
  }
  bandedGradient(
    k,
    0,
    0,
    W,
    TOP - 4,
    [RAMPS.night[2], RAMPS.night[1], RAMPS.night[0]],
    2,
  )
  bevel(k, 0, TOP - 4, W, 3, RAMPS.earth, { depth: 1 })
  for (const x of [30, 92, 160, 222]) {
    for (let i = 0; i < 3; i++)
      drawSprite(k, LEAF_SPRITE, x + (i % 2) * 3, TOP + 1 + i * 4, {
        flipX: i % 2 === 1,
      })
  }
}

class BrickBloom implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private paddleX = W / 2
  private paddleV = 0
  private wide = 0
  private sticky = 0
  private calm = 0
  /** Seconds of the new seeds still working: Rain Spray, Thorn Ball, Queen's Compass. */
  private rain = 0
  private thorn = 0
  private compass = 0
  private bed: Bed = newBed()
  private petals: Petal[] = []
  private droplets: Droplet[] = []
  private bumble: Bumble | null = null
  /** Crates cracked since the paddle last touched a ball: the Pollen Chain. */
  private chain = 0
  private bestChain = 0
  /** The roof glass rang since the last crate: the next one pays double. */
  private chime = false
  private rushTicks = 0
  private bricks: Brick[] = []
  private litRows = new Map<number, number>()
  private balls: Ball[] = []
  private drops: Drop[] = []
  private puffs: Puff[] = []
  /** The Seedling House's pollen mites: a line of three swaying down from the roof vents. */
  private miteLine: MiteLine | null = null
  /** Vine Hall's snail bot: patrols a lane under the crates; its shell bounces the ball. */
  private snail: Snail | null = null
  /** Vine Hall's ladybot ring: five dots orbit one crate and shield it until all are popped. */
  private ring: LadybotRing | null = null
  private ringBrick: Brick | null = null
  private flowers: Flower[] = []
  private speed = 0
  /** The Grand Tour's place (Seedling House, Vine Hall), or null once the tour is over. */
  private tour: TourPos | null = TOUR_START
  private champion = false
  private trueChampion = false
  private secondBloom = false
  private credits: 'normal' | 'true' | null = null
  private tourMenu = false
  private tourCursor = 0
  /** Stages the tour took, so the classic walls start from their first after it. */
  private tourStages = 0
  /** Where the last crate cracked: that side of the screen picks the vent. */
  private lastCrackX = W / 2
  private clear = 0
  private lost = 0
  private serveTimer = SERVE_TICKS
  private extraIndex = 0
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null
  // Cosmetic only: sparkles on their own rng, and each ball's recent path for its trail.
  private fx = new Sparkles()
  private fxRng = backdropRng(43)
  private trails = new Map<Ball, { x: number; y: number }[]>()

  // --- slice 2: bosses, the Potting Bench, golden seeds, the house map, saves ----------------
  /** The house boss in play (Mister Mulch, the Tangle Rose), or null on a wall. */
  private boss: Boss | null = null
  /** Ticks the paddle stays sluggish (a clod) or stung still (a rose petal). */
  private muddy = 0
  private stung = 0
  /** Petals to spend at the Potting Bench, earned in play. */
  private purse = 0
  /** The bench's wider base paddle, kept for the run. */
  private roomy = false
  /** What the bench sold for house `kitHouse`. */
  private kit: Kit = emptyKit()
  private kitHouse = -1
  /** House ids whose golden seed is home for good. */
  private golden = new Set<string>()
  private goldenDrop: Golden | null = null
  /** The walls this house's run has visited, for the map. */
  private path: string[] = [TOUR_START.wall]
  /** This wall was reached by a right (rich) vent. */
  private richWall = false
  private card: Card | null = null
  private bench: Bench | null = null
  private benchNote: Note | null = null
  /** A saved tour waiting for continue (A) or a new tour (B). */
  private offer: BloomSave | null = null
  private shieldNoteAt = -999
  /** The tour's resume point (utils/arcade/saves.ts); undefined until there is one. */
  save: BloomSave | null | undefined = undefined

  // --- slice 3: the Cactus Dome and the Lily Pond House -----------------------------------------
  private tumble: Tumbleweed | null = null
  private tumbleTimer = 0
  private beetle: Beetle | null = null
  private frog: Frog | null = null
  private mirror: MirrorBug | null = null
  /** A mirror bug's ghost balls: they crack nothing and fade. */
  private ghosts: Ghost[] = []
  /** Bubble crates' bumpers, ringing for a few seconds each. */
  private bumpers: Bumper[] = []
  /** Each lily row's drift on the current. */
  private lilyDx = new Map<number, number>()
  /** Queen Koi's splash-downs already acted on (each one flips the pads). */
  private flipsSeen = 0
  /** The Vent seed's open hatch, and the Duo Paddle's ticks and place. */
  private vent: { side: 0 | 1; ticks: number } | null = null
  private duo = 0
  private duoX = W / 2

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    const stored = this.demo ? null : readBloomSave(options.resume)
    if (stored) {
      this.golden = new Set(stored.golden)
      this.champion = stored.champion === true
      this.trueChampion = stored.trueChampion === true
      this.save = stored
      if (resumable(stored)) this.offer = stored
      else if (this.champion && options.selectScreen) this.tourMenu = true
    }
    this.startStage(1)
    if (!this.offer && options.selectScreen && !this.demo)
      this.card = this.newCard('house')
  }

  get menuOpen(): boolean {
    return !!(this.bench || this.offer || this.credits || this.tourMenu)
  }

  get touchActions(): Readonly<Partial<Record<'a' | 'b', string>>> {
    if (this.offer || this.bench || this.credits || this.tourMenu || this.clear > 0 || this.lost > 0) return {}
    if (this.card) return { a: 'Skip' }
    if (this.balls.some((ball) => ball.stuck !== null)) return { a: 'Launch' }
    if (
      this.balls.some(
        (ball) =>
          ball.curl === 0 && ball.hitDir !== 0 && ball.since <= CURL_WINDOW,
      )
    )
      return { b: 'Curl' }
    return {}
  }

  private get paddleW(): number {
    return this.wide > 0 ? WIDE_W : this.roomy ? ROOMY_W : PADDLE_W
  }

  private get houseNow(): number {
    return this.tour ? this.tour.house : -1
  }

  /** The bench's kit works only in the house it was bought for. */
  private get kitLive(): boolean {
    return this.kitHouse >= 0 && this.houseNow === this.kitHouse
  }

  private newCard(kind: Card['kind']): Card {
    const total =
      kind === 'house'
        ? this.demo
          ? 90
          : HOUSE_CARD_TICKS
        : this.demo
          ? 60
          : MAP_TICKS
    return { kind, ticks: total, total }
  }

  private earn(petals: number) {
    this.purse = Math.min(MAX_PETALS, this.purse + petals)
  }

  /** The save as of now: resume at the Potting Bench before house `house`. */
  private snapshot(house: number, stage: number): BloomSave {
    return {
      v: 1,
      house,
      stage,
      score: this.score,
      lives: Math.max(1, this.lives),
      continued: false,
      petals: this.purse,
      wide: this.roomy,
      kit: { ...this.kit },
      golden: [...this.golden],
      ...(this.champion ? { champion: true } : {}),
      ...(this.trueChampion ? { trueChampion: true } : {}),
      ...(this.secondBloom ? { secondBloom: true } : {}),
      ...(this.tour?.house === CONSERVATORY_INDEX && house === CONSERVATORY_INDEX ? { secret: true } : {}),
    }
  }

  private keepSave(house: number, stage: number) {
    if (this.demo) return
    this.save = this.snapshot(house, stage)
  }

  /** Continue a saved tour: back at the Potting Bench before its glasshouse. */
  private resumeFrom(s: BloomSave) {
    this.secondBloom = s.secondBloom === true
    if (s.secret) this.tour = { house: CONSERVATORY_INDEX, wall: houseAt(CONSERVATORY_INDEX)!.start }
    this.score = s.continued ? 0 : s.score
    this.lives = s.continued ? START_LIVES : s.lives
    this.extraIndex = EXTRA_AT.filter((at) => at <= this.score).length
    this.purse = s.petals
    this.roomy = s.wide
    this.kit = { ...s.kit }
    this.kitHouse = s.house
    this.level = s.stage - 1
    this.save = { ...s, continued: false }
    this.openBench(s.house)
  }

  private updateOffer(input: InputFrame) {
    const s = this.offer!
    if (input.pressed.a || input.pressed.start) {
      this.offer = null
      this.resumeFrom(s)
    } else if (input.pressed.b) {
      // A new tour: the golden seeds stay, the rest starts over.
      this.offer = null
      this.startTour(false)
    }
  }

  private get tourChoices(): Array<'tour' | 'second' | 'secret'> {
    const choices: Array<'tour' | 'second' | 'secret'> = ['tour']
    if (this.champion) choices.push('second')
    if (hasAllGoldenSeeds([...this.golden])) choices.push('secret')
    return choices
  }

  private startTour(second: boolean, secret = false) {
    if (second && !this.champion) return
    if (secret && !hasAllGoldenSeeds([...this.golden])) return
    this.secondBloom = second
    this.credits = null
    this.tourMenu = false
    this.score = 0
    this.lives = START_LIVES
    this.extraIndex = 0
    this.purse = 0
    this.roomy = false
    this.kit = emptyKit()
    this.kitHouse = -1
    this.bed = newBed()
    this.level = 0
    this.clear = 0
    this.lost = 0
    this.enterHouse(secret ? CONSERVATORY_INDEX : 0)
  }

  private finishTour(secret: boolean) {
    this.champion = true
    this.trueChampion ||= secret
    this.credits = secret ? 'true' : 'normal'
    this.tour = null
    this.balls = []
    this.secondBloom = false
    this.keepSave(HOUSES.length, 1)
    this.sound.play('level')
  }

  private updateTourMenu(input: InputFrame) {
    const choices = this.tourChoices
    if (input.pressed.up) this.tourCursor = (this.tourCursor + choices.length - 1) % choices.length
    if (input.pressed.down) this.tourCursor = (this.tourCursor + 1) % choices.length
    if (input.pressed.a || input.pressed.start) {
      const choice = choices[this.tourCursor]
      this.startTour(choice === 'second', choice === 'secret')
    }
  }

  // --- stages --------------------------------------------------------------------

  private startStage(stage: number) {
    this.level = stage
    this.boss = null
    const tough = Math.round(levelCurve(stage, BLOOM_CURVES.tough))
    this.bricks = []
    const house = this.tour ? houseAt(this.tour.house) : undefined
    const vented =
      house && this.tour ? houseWall(house, this.tour.wall) : undefined
    const baseWall = vented ?? wallFor(stage - this.tourStages)
    const mirrored = this.secondBloom || this.houseNow === CONSERVATORY_INDEX
    const wall = mirrored ? mirrorWall(baseWall) : baseWall
    for (const cell of parseWall(wall, vented ? HOUSE_LEGEND : undefined)) {
      // The top rows are the toughest; special crates take one hit and let the wall's shape play.
      const plain = cell.kind === 'crate' || cell.kind === 'bolt'
      let hp = plain ? Math.max(1, tough - Math.floor(cell.row / 3)) : 1
      if (cell.kind === 'root') hp = 2
      this.bricks.push({
        col: cell.col,
        row: cell.row,
        hp,
        maxHp: hp,
        bolt: cell.kind === 'bolt',
        kind: cell.kind,
        open: false,
        flash: 0,
      })
    }
    // Glasshouse walls are authored: no random bolts on top of them.
    const bolts = vented
      ? 0
      : Math.max(0, Math.round(levelCurve(stage, BLOOM_CURVES.bolts)))
    for (let i = 0; i < bolts && this.bricks.length > 12; i++) {
      const pick = this.bricks[Math.floor(this.rng() * this.bricks.length)]!
      // Keep the top row breakable, so no wall is sealed shut.
      if (pick.row > 0 && pick.kind === 'crate') {
        pick.bolt = true
        pick.kind = 'bolt'
      }
    }
    this.miteLine =
      vented && this.tour && mitesHatch(this.tour.house, vented.id)
        ? spawnMiteLine(W / 2 + (this.rng() - 0.5) * 80)
        : null
    this.snail =
      vented && this.tour && snailsPatrol(this.tour.house, vented.id)
        ? spawnSnail(this.rng() < 0.5)
        : null
    const ringed =
      vented && this.tour ? ringedCrate(this.tour.house, vented.id) : null
    this.ringBrick =
      this.bricks.find(
        (b) =>
          ringed && b.col === ringed.col && b.row === ringed.row && !b.bolt,
      ) ?? null
    if (this.ringBrick) {
      const r = this.brickRect(this.ringBrick)
      this.ring = spawnRing(r.x + r.w / 2, r.y + r.h / 2)
    } else this.ring = null
    // The house's golden seed waits in a vault crate on its rich route.
    const vault =
      vented && this.tour ? vaultAt(this.tour.house, vented.id) : null
    const safe = this.bricks.find(
      (b) => vault && b.col === (mirrored ? COLS - 1 - vault.col : vault.col) && b.row === vault.row && !b.bolt,
    )
    if (safe) {
      safe.vault = true
      safe.hp = VAULT_HITS
      safe.maxHp = VAULT_HITS
    }
    this.dressWall(vented?.id ?? null)
    this.puffs = []
    const puffs = Math.max(0, Math.round(levelCurve(stage, BLOOM_CURVES.puffs)))
    for (let i = 0; i < puffs; i++) {
      this.puffs.push({
        x: 40 + this.rng() * (W - 80),
        y: 160 + this.rng() * 60,
        vx: (this.rng() < 0.5 ? -1 : 1) * 0.45,
        vy: (this.rng() - 0.5) * 0.4,
        hp: 2,
      })
    }
    this.speed = levelCurve(stage, BLOOM_CURVES.speed) * (this.secondBloom || this.houseNow === CONSERVATORY_INDEX ? 1.15 : 1)
    this.resetRound()
    // The bench's starter seed: every wall of the house it was bought for starts with it.
    if (vented && this.kitLive && this.kit.seed) this.giveSeed(this.kit.seed)
    this.serve()
    this.banner = vented
      ? { text: vented.name.toUpperCase(), sub: house!.name, ticks: 90 }
      : { text: `STAGE ${stage}`, sub: 'BLOOM EVERY CRATE', ticks: 90 }
  }

  /** What every wall and boss starts without: seeds, falling things and the chain. */
  private resetRound() {
    this.drops = []
    this.wide = 0
    this.sticky = 0
    this.calm = 0
    this.rain = 0
    this.thorn = 0
    this.compass = 0
    this.muddy = 0
    this.stung = 0
    this.droplets = []
    this.petals = []
    this.bumble = null
    this.goldenDrop = null
    this.chain = 0
    this.chime = false
    this.rushTicks = 0
    this.ghosts = []
    this.bumpers = []
    this.vent = null
    this.duo = 0
  }

  /**
   * Sand timers start their cycles out of step, lily rows start still, and the Cactus Dome and
   * the Lily Pond House send out their pests (`wallId` null at a boss: no pests there).
   */
  private dressWall(wallId: string | null) {
    this.litRows.clear()
    for (const b of this.bricks)
      if (b.kind === 'sand')
        b.sand = Math.floor(this.rng() * (SAND_RUN + SAND_OPEN))
    this.lilyDx.clear()
    this.flipsSeen = 0
    const pests = wallId && this.tour ? pestsOf(this.tour.house, wallId) : null
    this.tumble = null
    this.tumbleTimer = pests?.tumbleweed ? 300 : 0
    this.beetle = pests?.beetle ? spawnBeetle(this.rng() < 0.5) : null
    this.frog = pests?.frog
      ? spawnFrog(LEFT + 30 + this.rng() * (RIGHT - LEFT - 60))
      : null
    this.mirror = pests?.mirror ? spawnMirror(this.rng() * 400) : null
  }

  /** The Lily Pond House's water fills the lower wall, boss pond included. */
  private get pond(): boolean {
    return this.houseNow === POND
  }

  /** A seed's timer, without the catch's points (the bench's starter seed). */
  private giveSeed(kind: StarterSeed) {
    if (kind === 'W') this.wide = POWER_TICKS
    if (kind === 'S') this.sticky = POWER_TICKS
    if (kind === 'C') this.calm = POWER_TICKS
    if (kind === 'R') this.rain = RAIN_TICKS
    if (kind === 'T') this.thorn = THORN_TICKS
    if (kind === 'Q') this.compass = COMPASS_TICKS
  }

  /** The house boss: guards and a few crates on the wall, the boss hanging over them. */
  private startBoss(stage: number, house: number) {
    const id = bossOf(house)!
    this.level = stage
    this.boss = spawnBoss(id)
    this.bricks = BOSS_SPECS[id].cells.map((c) => ({
      col: c.col,
      row: c.row,
      hp: c.hp,
      maxHp: c.hp,
      bolt: false,
      kind: c.kind,
      open: false,
      flash: 0,
      guard: c.guard,
    }))
    this.dressWall(null)
    this.miteLine = null
    this.snail = null
    this.ring = null
    this.ringBrick = null
    this.puffs = []
    this.speed = levelCurve(stage, BLOOM_CURVES.speed) * (this.secondBloom || this.houseNow === CONSERVATORY_INDEX ? 1.15 : 1)
    this.resetRound()
    if (this.kitLive && this.kit.seed) this.giveSeed(this.kit.seed)
    this.serve()
    const spec = BOSS_SPECS[id]
    this.banner = { text: spec.name, sub: spec.phases[0], ticks: 150 }
    this.sound.play('warn')
  }

  /** Into a glasshouse from the bench: its kit goes to work and its title card shows. */
  private enterHouse(house: number) {
    this.bench = null
    this.benchNote = null
    const h = houseAt(house)!
    this.tour = { house, wall: h.start }
    this.path = [h.start]
    this.richWall = false
    this.kitHouse = house
    if (this.kit.plots) {
      this.bed[3] = FULL_BLOOM
      this.bed[4] = FULL_BLOOM
    }
    this.keepSave(house, this.level + 1)
    this.startStage(this.level + 1)
    this.card = this.newCard('house')
  }

  private openBench(house: number) {
    this.bench = { house, cursor: 0, seed: 0, ticks: 0 }
    this.benchNote = null
    this.balls = []
    this.sound.play('level')
  }

  /** What comes after a cleared wall or a cheered-up boss. */
  private afterClear() {
    const tour = this.tour
    if (this.boss) {
      this.boss = null
      const next = tour ? nextTourPos(tour, 0) : null
      // The bench's kit was for the house just finished.
      this.kit = emptyKit()
      this.kitHouse = -1
      if (next) {
        this.tour = next
        this.keepSave(next.house, this.level + 1)
        this.openBench(next.house)
        return
      }
      if (!this.demo) {
        this.finishTour(tour?.house === CONSERVATORY_INDEX)
        return
      }
      // Attract mode continues endlessly after the tour.
      this.tour = null
      this.tourStages = this.level
      this.keepSave(HOUSES.length, this.level + 1)
      this.startStage(this.level + 1)
      this.banner = {
        text: 'THE TOUR GOES ON',
        sub: 'MORE GLASSHOUSES SOON',
        ticks: 150,
      }
      return
    }
    if (tour) {
      const here = houseWall(houseAt(tour.house)!, tour.wall)
      if (here?.vents === 'boss' && bossOf(tour.house)) {
        this.startBoss(this.level + 1, tour.house)
        return
      }
      const side = ventSide(this.lastCrackX, W)
      this.tour = nextTourPos(tour, side)
      if (!this.tour) this.tourStages = this.level
      else {
        this.path.push(this.tour.wall)
        this.richWall = side === 1
      }
      this.startStage(this.level + 1)
      if (this.tour) this.card = this.newCard('map')
      return
    }
    this.startStage(this.level + 1)
  }

  private serve() {
    this.balls = [this.newBall(this.paddleX, PADDLE_Y - BALL_R - 1, 0, 0, 0)]
    this.serveTimer = SERVE_TICKS
  }

  private newBall(
    x: number,
    y: number,
    vx: number,
    vy: number,
    stuck: number | null,
  ): Ball {
    return { x, y, vx, vy, stuck, curl: 0, curlDir: 0, since: 999, hitDir: 0 }
  }

  private get breakable(): Brick[] {
    return this.bricks.filter((b) => !b.bolt)
  }

  private brickRect(b: Brick) {
    return {
      x: LEFT + b.col * BRICK_W + (b.dx ?? 0),
      y: BRICK_TOP + b.row * BRICK_H,
      w: BRICK_W,
      h: BRICK_H,
    }
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.benchNote && --this.benchNote.ticks <= 0) this.benchNote = null
    if (this.over) return
    if (this.credits) {
      if (input.pressed.a || input.pressed.start) {
        this.credits = null
        this.tourMenu = true
        this.tourCursor = 0
      }
      return
    }
    if (this.tourMenu) { this.updateTourMenu(input); return }
    if (this.offer) {
      this.updateOffer(input)
      return
    }
    if (this.bench) {
      this.updateBench(input)
      return
    }
    if (this.card) {
      const card = this.card
      card.ticks--
      const skip =
        !this.demo &&
        card.total - card.ticks > 20 &&
        (input.pressed.a || input.pressed.start)
      if (card.ticks <= 0 || skip) this.card = null
      return
    }
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    const controls = this.demo ? this.demoInput() : input
    if (this.clear > 0) {
      if (--this.clear === 0) this.afterClear()
      return
    }
    if (this.lost > 0) {
      if (--this.lost === 0) {
        if (this.lives <= 0) {
          this.over = true
          this.banner = { text: 'GAME OVER', ticks: 9999 }
          // A continue keeps the glasshouse, never the score.
          if (this.save && resumable(this.save))
            this.save = { ...this.save, continued: true }
        } else this.serve()
      }
      return
    }
    if (this.wide > 0) this.wide--
    if (this.sticky > 0) this.sticky--
    if (this.calm > 0) this.calm--
    if (this.rain > 0) this.rain--
    if (this.thorn > 0) this.thorn--
    if (this.compass > 0) this.compass--
    if (this.muddy > 0) this.muddy--
    if (this.stung > 0) this.stung--
    if (this.duo > 0) this.duo--
    if (this.vent && --this.vent.ticks <= 0) this.vent = null
    this.movePaddle(controls)
    this.duoX += (this.paddleX - this.duoX) * 0.15
    this.updateHinges()
    this.updateLilies()
    this.updateBalls(controls)
    if (this.clear > 0) return
    this.updateDrops()
    this.updateGolden()
    this.updatePetals()
    this.updateRain()
    this.updateRush()
    this.updatePuffs()
    this.updateMites()
    this.updateRing()
    if (this.snail) stepSnail(this.snail)
    this.updateDomePests()
    this.updatePondPests()
    for (const b of this.bumpers) stepBumper(b)
    this.bumpers = this.bumpers.filter((b) => b.ticks > 0)
    for (const b of this.bricks) if (b.flash > 0) b.flash--
    if (this.boss) this.updateBoss()
    else if (!this.bricks.some((b) => !b.bolt)) this.stageClear()
  }

  // --- slice 3: lilies, the Dome's and the Pond's pests, the Vent and the Duo Paddle ----------

  /** Lily rows sway on the current, each row as one, never off the glass. */
  private updateLilies() {
    const rows = new Map<number, Brick[]>()
    for (const b of this.bricks)
      if (b.kind === 'lily') rows.set(b.row, [...(rows.get(b.row) ?? []), b])
    for (const [row, pads] of rows) {
      const cols = pads.map((p) => p.col)
      const goal = lilyGoal(
        row,
        this.tick,
        Math.min(...cols),
        Math.max(...cols),
        BRICK_W,
      )
      const dx = driftToward(this.lilyDx.get(row) ?? 0, goal)
      this.lilyDx.set(row, dx)
      for (const p of pads) p.dx = dx
    }
  }

  /** Queen Koi's splash-down flips the pads end for end: each row mirrors across the pond. */
  private flipLilies() {
    for (const b of this.bricks) {
      if (b.kind !== 'lily') continue
      b.col = COLS - 1 - b.col
      b.dx = -(b.dx ?? 0)
      b.flash = 10
    }
    for (const [row, dx] of this.lilyDx) this.lilyDx.set(row, -dx)
    this.float({ x: W / 2, y: 100, text: 'FLIP!', life: 40 })
    this.sound.play('warn')
  }

  /** The Cactus Dome: tumbleweeds after a dust-puff tell, and the shell beetle's walk. */
  private updateDomePests() {
    if (this.tumbleTimer > 0 && !this.tumble && --this.tumbleTimer === 0) {
      this.tumble = spawnTumbleweed(this.rng() < 0.5)
      this.tumbleTimer = TUMBLE_EVERY
    }
    const t = this.tumble
    if (t) {
      if (stepTumbleweed(t)) this.tumble = null
      else if (t.tell === 0) {
        // It flattens the bloom it rolls over.
        const plot = plotIndex(t.x)
        if (this.bed[plot]! >= 2) {
          trample(this.bed, plot)
          this.float({
            x: plotCenter(plot),
            y: BED_SAVE_Y - 16,
            text: 'FLATTENED!',
            life: 40,
          })
          this.sound.play('warn')
        }
        // The paddle rolls right over it: bonk.
        if (Math.abs(t.x - this.paddleX) <= this.paddleW / 2 + TUMBLE_R)
          this.bonkTumbleweed()
      }
    }
    if (this.beetle) stepBeetle(this.beetle)
  }

  private bonkTumbleweed() {
    const t = this.tumble
    if (!t) return
    this.tumble = null
    this.addScore(TUMBLE_SCORE * Math.max(1, this.level), t.x, TUMBLE_Y - 12)
    this.earn(PETALS.pest)
    this.burst(t.x, TUMBLE_Y, 10, RAMPS.cream[3])
    this.sound.play('pop')
  }

  /** The Lily Pond House: the frog bot's puff-and-lick and the mirror bug's ghosts. */
  private updatePondPests() {
    const f = this.frog
    if (f) {
      const seed =
        [...this.drops].sort(
          (a, b) =>
            Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y),
        )[0] ?? null
      if (stepFrog(f, seed, this.rng) === 'tongue' && seed && f.tx === seed.x) {
        // It tongues the seed out of the air.
        this.drops = this.drops.filter((d) => d !== seed)
        this.float({ x: f.x, y: f.y - 14, text: 'GULP!', life: 40 })
        this.sound.play('warn')
      }
    }
    const m = this.mirror
    if (m && stepMirror(m)) {
      const real = this.balls.find((b) => b.stuck === null)
      if (real && this.ghosts.length < 2) {
        this.ghosts.push(splitGhost(real))
        this.float({ x: m.x, y: m.y - 12, text: 'MIRROR!', life: 36 })
        this.sound.play('blip')
      }
    }
    const half = this.paddleW / 2
    this.ghosts = this.ghosts.filter((gh) =>
      stepGhost(gh, this.paddleX, half, PADDLE_Y),
    )
  }

  /** A pest the ball met in the Dome or the Pond. */
  private pestBonks(ball: Ball) {
    const t = this.tumble
    if (t && tumbleTouches(t, ball.x, ball.y, BALL_R)) this.bonkTumbleweed()
    const b = this.beetle
    if (b && b.flash === 0 && beetleTouches(b, ball.x, ball.y)) {
      // Out of the beetle's way, whichever way it went.
      ball.vy = ball.y < b.y ? -Math.abs(ball.vy) : Math.abs(ball.vy)
      ball.y = b.y + Math.sign(ball.vy) * (BEETLE_H + BALL_R + 0.5)
      if (beetleBonk(b, ball.x) === 'pop') {
        this.beetle = null
        this.addScore(BEETLE_SCORE * Math.max(1, this.level), b.x, b.y - 10)
        this.earn(PETALS.pest)
        this.burst(b.x, b.y, 10, RAMPS.teal[3])
        this.sound.play('pop')
      } else {
        ball.vx = b.dir * Math.abs(ball.vx || 1)
        b.flash = 10
        this.float({ x: b.x, y: b.y - 12, text: 'CLANG!', life: 24 })
        this.sound.play('blip')
      }
    }
    const f = this.frog
    if (f && frogTouches(f, ball.x, ball.y)) {
      if (f.puff > 0) {
        this.frog = null
        this.addScore(FROG_SCORE * Math.max(1, this.level), f.x, f.y - 10)
        this.earn(PETALS.pest)
        this.burst(f.x, f.y, 12, RAMPS.leaf[3])
        this.sound.play('pop')
      } else {
        ball.vy = ball.y < f.y ? -Math.abs(ball.vy) : Math.abs(ball.vy)
        ball.y = f.y + Math.sign(ball.vy) * (FROG_R + BALL_R + 1)
        if (this.tick - this.shieldNoteAt > 60) {
          this.shieldNoteAt = this.tick
          this.float({ x: f.x, y: f.y - 14, text: 'BOING', life: 24 })
        }
        this.sound.play('blip')
      }
    }
    const m = this.mirror
    if (m && mirrorTouches(m, ball.x, ball.y)) {
      this.mirror = null
      this.ghosts = []
      this.addScore(MIRROR_SCORE * Math.max(1, this.level), m.x, m.y - 10)
      this.earn(PETALS.pest)
      this.burst(m.x, m.y, 10, RAMPS.sky[3])
      this.sound.play('pop')
    }
    for (const bump of this.bumpers) {
      const cap = (levelCurve(this.level, BLOOM_CURVES.maxSpeed) * (this.secondBloom || this.houseNow === CONSERVATORY_INDEX ? 1.15 : 1))
      const v = bumperBounce(bump, ball, BALL_R, cap)
      if (!v) continue
      ball.vx = v.vx
      ball.vy = v.vy
      this.addScore(BUMPER_SCORE, bump.x, bump.y - 10)
      this.sound.play('blip')
    }
  }

  /** The ball flies out of the Vent seed's hatch: the wall is skipped, by that side's vent. */
  private ventOut(side: 0 | 1) {
    this.vent = null
    this.lastCrackX = side === 0 ? LEFT : RIGHT
    this.bricks = this.bricks.filter((b) => b.bolt)
    this.addScore(VENT_BONUS * Math.max(1, this.level), W / 2, 200)
    this.stageClear()
    this.banner = {
      text: 'VENTED!',
      sub: side === 0 ? 'OUT BY THE LEFT VENT' : 'OUT BY THE RIGHT VENT',
      ticks: CLEAR_TICKS,
    }
  }

  /** The Duo Paddle bounces a falling ball back up, angled by where it lands, like yours. */
  private hitDuo(ball: Ball) {
    if (this.duo <= 0 || ball.vy <= 0) return
    const half = DUO_W / 2
    if (
      ball.y + BALL_R < DUO_Y ||
      ball.y - BALL_R > DUO_Y + 5 ||
      Math.abs(ball.x - this.duoX) > half + BALL_R
    )
      return
    const offset = Math.max(-1, Math.min(1, (ball.x - this.duoX) / half))
    const speed = Math.hypot(ball.vx, ball.vy)
    const angle = -Math.PI / 2 + offset * 0.95
    ball.vx = Math.cos(angle) * speed
    ball.vy = Math.sin(angle) * speed
    ball.y = DUO_Y - BALL_R - 0.1
    this.cashChain(ball)
    this.sound.play('blip')
  }

  // --- the house bosses -------------------------------------------------------------------

  private updateBoss() {
    const boss = this.boss!
    if (this.lost > 0 || this.clear > 0) return
    const target = boss.id === 'thorn' ? this.balls.find((ball) => ball.stuck === null && ball.vy < 0) : undefined
    stepBoss(boss, target?.x ?? this.paddleX, this.rng)
    // A guard phase ends when the last guard cracks: the face (or the bud) is open.
    if (guardPhase(boss) && !this.bricks.some((b) => b.guard)) {
      openBoss(boss)
      this.banner = {
        text: `PHASE ${boss.phase}`,
        sub: BOSS_SPECS[boss.id].phases[boss.phase - 1],
        ticks: 120,
      }
      this.sound.play('warn')
    }
    if (boss.flips > this.flipsSeen) {
      this.flipsSeen = boss.flips
      this.flipLilies()
    }
    const half = this.paddleW / 2
    for (const s of [...boss.shots]) {
      if (s.kind === 'gloom' && s.y >= BED_SAVE_Y) {
        const plot = plotIndex(s.x)
        if (plot >= 0 && plot < PLOTS) trample(this.bed, plot)
        boss.shots = boss.shots.filter((o) => o !== s)
        this.sound.play('warn')
        continue
      }
      const onPaddle =
        s.y + SHOT_R >= PADDLE_Y &&
        s.y - SHOT_R <= PADDLE_Y + PADDLE_H &&
        Math.abs(s.x - this.paddleX) <= half + SHOT_R
      if (!onPaddle) continue
      boss.shots = boss.shots.filter((o) => o !== s)
      this.shotOnPaddle(s)
    }
    if (boss.defeated) this.bossCheered(boss)
  }

  /** A clod or a petal meets the paddle: swat it while moving, or wear it for a moment. */
  private shotOnPaddle(s: BossShot) {
    if (s.kind === 'gloom') {
      this.burst(s.x, PADDLE_Y - 4, 8, RAMPS.purple[3])
      this.sound.play('pop')
      return
    }
    if (s.kind === 'prickle') {
      // Sunny Saguaro's prickle ball, caught: bonus points, and it splits off as an extra ball.
      this.addScore(PRICKLE_CATCH * Math.max(1, this.level), s.x, PADDLE_Y - 12)
      this.float({ x: s.x, y: PADDLE_Y - 22, text: 'CAUGHT!', life: 40 })
      if (this.balls.length < MAX_BALLS) {
        const a = -Math.PI / 2 + (s.x - this.paddleX) / 40
        this.balls.push(
          this.newBall(
            s.x,
            PADDLE_Y - BALL_R - 1,
            Math.cos(a) * this.speed,
            Math.sin(a) * this.speed,
            null,
          ),
        )
      }
      this.sound.play('pickup')
      return
    }
    if (s.kind === 'clod' && Math.abs(this.paddleV) >= SWAT_SPEED) {
      this.addScore(150, s.x, PADDLE_Y - 10)
      this.float({ x: s.x, y: PADDLE_Y - 18, text: 'SWAT!', life: 30 })
      this.burst(s.x, PADDLE_Y - 4, 8, RAMPS.earth[3])
      this.sound.play('pop')
      return
    }
    if (s.kind === 'clod') {
      this.muddy = MUDDY_TICKS
      this.float({ x: s.x, y: PADDLE_Y - 18, text: 'MUDDY!', life: 40 })
      this.burst(s.x, PADDLE_Y - 2, 10, RAMPS.earth[2])
    } else {
      this.stung = STUNG_TICKS
      this.float({ x: s.x, y: PADDLE_Y - 18, text: 'STUNG!', life: 40 })
      this.burst(s.x, PADDLE_Y - 2, 8, RAMPS.pink[3])
    }
    this.sound.play('warn')
  }

  /** The ball meets the boss: a shield, a hit, a new phase, or the cheering-up. */
  private bonkBoss(ball: Ball) {
    const boss = this.boss!
    const result = hitBoss(boss)
    if (result === 'shielded') {
      this.sound.play('blip')
      if (this.tick - this.shieldNoteAt > 90) {
        this.shieldNoteAt = this.tick
        this.float({
          x: boss.x,
          y: boss.y + boss.h / 2 + 8,
          text: SHIELD_WORDS[boss.id],
          life: 36,
        })
      }
      return
    }
    if (result === 'none') return
    this.addScore(400 * this.level, ball.x, ball.y - 6)
    this.burst(
      ball.x,
      ball.y,
      10,
      boss.id === 'tangle-rose' ? '#fb7185' : '#c9926a',
    )
    this.fx.burst(ball.x, ball.y, this.fxRng, { count: 10, speed: 1.8 })
    this.sound.play('pop')
    if (result === 'phase')
      this.banner = {
        text: `PHASE ${boss.phase}`,
        sub: BOSS_SPECS[boss.id].phases[boss.phase - 1],
        ticks: 120,
      }
  }

  /** The last hit: Mister Mulch sneezes a shower of flowers; the Tangle Rose bursts into bloom. */
  private bossCheered(boss: Boss) {
    const spec = BOSS_SPECS[boss.id]
    this.addScore(spec.score, boss.x, boss.y)
    this.earn(spec.petals)
    for (let i = 0; i < 28; i++) {
      this.flowers.push({
        x: LEFT + 6 + this.fxRng() * (RIGHT - LEFT - 12),
        y: boss.y + (this.fxRng() - 0.5) * boss.h,
        vy: 0.4 + this.fxRng() * 0.9,
        life: 70,
        color: FLOWER_COLORS[i % FLOWER_COLORS.length]!,
      })
    }
    // The shower plants the bed: every plot grows two steps.
    for (let p = 0; p < PLOTS; p++)
      this.bed[p] = Math.min(FULL_BLOOM, this.bed[p]! + 2)
    this.fx.burst(boss.x, boss.y, this.fxRng, { count: 24, speed: 2.4 })
    this.bricks = []
    this.stageClear()
    this.banner = {
      text: CHEER_WORDS[boss.id],
      sub: `${spec.name} FEELS MUCH BETTER`,
      ticks: CLEAR_TICKS,
    }
  }

  // --- golden seeds and the Potting Bench ---------------------------------------------------

  private updateGolden() {
    const seed = this.goldenDrop
    if (!seed) return
    seed.y += GOLDEN_FALL
    const half = this.paddleW / 2
    if (
      seed.y > PADDLE_Y - 5 &&
      seed.y < PADDLE_Y + PADDLE_H + 5 &&
      Math.abs(seed.x - this.paddleX) < half + 6
    ) {
      this.collectGolden(seed)
      return
    }
    if (seed.y > H + 6) {
      this.goldenDrop = null
      this.float({
        x: seed.x,
        y: PADDLE_Y - 20,
        text: 'IT ROLLED AWAY...',
        life: 60,
      })
    }
  }

  private collectGolden(seed: Golden) {
    this.goldenDrop = null
    this.golden.add(seed.house)
    this.earn(PETALS.golden)
    this.addScore(5000, seed.x, PADDLE_Y - 14)
    this.banner = {
      text: 'GOLDEN SEED!',
      sub: `${this.golden.size} OF ${GOLDEN_TOTAL} FOUND`,
      ticks: 120,
    }
    this.sound.play('extra')
    this.fx.burst(seed.x, PADDLE_Y - 4, this.fxRng, {
      count: 18,
      colours: [RAMPS.gold[4], RAMPS.gold[3], '#ffffff'],
    })
    // Kept for good the moment it is caught.
    if (!this.demo)
      this.save = {
        ...(this.save ?? freshSave()),
        golden: [...this.golden],
      }
  }

  private updateBench(input: InputFrame) {
    const bench = this.bench!
    bench.ticks++
    if (this.demo) {
      if (bench.ticks > 90) this.enterHouse(bench.house)
      return
    }
    const rows = BENCH_ITEMS.length + 1
    if (input.pressed.up) bench.cursor = (bench.cursor + rows - 1) % rows
    if (input.pressed.down) bench.cursor = (bench.cursor + 1) % rows
    const item = BENCH_ITEMS[bench.cursor]
    if (item?.id === 'seed' && this.kit.seed === null) {
      const n = STARTER_SEEDS.length
      if (input.pressed.left) bench.seed = (bench.seed + n - 1) % n
      if (input.pressed.right) bench.seed = (bench.seed + 1) % n
    }
    if (bench.ticks > 20 && input.pressed.b) {
      this.enterHouse(bench.house)
      return
    }
    if (!(input.pressed.a || input.pressed.start)) return
    if (!item) {
      this.enterHouse(bench.house)
      return
    }
    const seed = STARTER_SEEDS[bench.seed]!
    const sold = buy(this.purse, this.kit, this.roomy, item.id, seed)
    if (!sold) {
      this.benchNote = {
        text: owned(this.kit, this.roomy, item.id)
          ? 'ALREADY ON YOUR BENCH'
          : 'NOT ENOUGH PETALS YET',
        ticks: 70,
      }
      this.sound.play('blip')
      return
    }
    this.purse = sold.purse
    this.kit = sold.kit
    this.roomy = sold.wide
    this.benchNote = { text: `${item.name} POTTED!`, ticks: 70 }
    this.sound.play('pickup')
  }

  /** Hinge crates swing on a beat; one stays open while a ball is inside it, so none traps a ball. */
  private updateHinges() {
    const shut = this.tick % HINGE_PERIOD < HINGE_SHUT
    for (const b of this.bricks) {
      if (b.kind !== 'hinge') continue
      const r = this.brickRect(b)
      const occupied = this.balls.some(
        (ball) =>
          ball.x + BALL_R > r.x - 1 &&
          ball.x - BALL_R < r.x + r.w + 1 &&
          ball.y + BALL_R > r.y - 1 &&
          ball.y - BALL_R < r.y + r.h + 1,
      )
      b.open = !shut || (b.open && occupied)
    }
  }

  /** Cracked crates' flowers fall into the Bloom Bed and plant where they land. */
  private updatePetals() {
    for (const p of this.petals) {
      p.y += PETAL_SPEED
      if (p.y < BED_SAVE_Y) continue
      const { plot, bloomed } = plantPetal(this.bed, p.x)
      this.addScore(10, plotCenter(plot), BED_SAVE_Y - 10)
      if (bloomed) {
        this.float({
          x: plotCenter(plot),
          y: BED_SAVE_Y - 16,
          text: 'IN BLOOM!',
          life: 44,
        })
        this.fx.burst(plotCenter(plot), BED_SAVE_Y, this.fxRng, {
          count: 8,
          colours: [RAMPS.leaf[4], RAMPS.gold[4], p.color],
        })
        this.sound.play('pickup')
      }
      p.y = H + 99
    }
    this.petals = this.petals.filter((p) => p.y < H + 10)
  }

  /** Rain Spray: droplets leave the paddle and chip the first crate they meet. */
  private updateRain() {
    if (this.rain > 0 && this.rain % RAIN_EVERY === 0)
      this.droplets.push({ x: this.paddleX, y: PADDLE_Y - 3 })
    for (const d of this.droplets) {
      d.y -= DROPLET_SPEED
      const hit = this.bricks.find((b) => {
        if (b.kind === 'hinge' && b.open) return false
        const r = this.brickRect(b)
        return d.x >= r.x && d.x <= r.x + r.w && d.y <= r.y + r.h && d.y >= r.y
      })
      if (hit) {
        d.y = -99
        this.crack(hit)
      }
    }
    this.droplets = this.droplets.filter((d) => d.y > TOP)
  }

  /** Last-Crate Rush: with four or fewer crates left, Bumble the bee loops in and taps the nearest. */
  private updateRush() {
    const left = this.breakable
    // A boss is no wall to rush; a bench Bumble pass brings Bumble in for the last six.
    const at = this.kitLive && this.kit.bumble ? RUSH_AT + 2 : RUSH_AT
    if (this.boss || !rushActive(left.length, at)) {
      this.bumble = null
      return
    }
    this.rushTicks++
    // Bumble taps crates that can crack now, before any sand timer still running.
    const open = left.filter((b) => !this.sandShut(b))
    const near = (x: number, y: number) =>
      [...(open.length ? open : left)].sort((a, b) => {
        const ra = this.brickRect(a)
        const rb = this.brickRect(b)
        return (
          Math.hypot(ra.x + ra.w / 2 - x, ra.y + ra.h / 2 - y) -
          Math.hypot(rb.x + rb.w / 2 - x, rb.y + rb.h / 2 - y)
        )
      })[0]!
    if (!this.bumble) {
      this.bumble = {
        x: this.paddleX,
        y: PADDLE_Y - 40,
        angle: 0,
        tap: Math.floor(BUMBLE_TAP_TICKS / 2),
      }
      this.float({ x: W / 2, y: 170, text: 'LAST CRATES!', life: 60 })
    }
    const bee = this.bumble
    const target = near(bee.x, bee.y)
    const r = this.brickRect(target)
    bee.angle += 0.14
    const gx = r.x + r.w / 2 + Math.cos(bee.angle) * 15
    const gy = r.y + r.h / 2 + Math.sin(bee.angle * 1.3) * 9
    bee.x += (gx - bee.x) * 0.12
    bee.y += (gy - bee.y) * 0.12
    if (--bee.tap <= 0) {
      bee.tap = BUMBLE_TAP_TICKS
      this.float({
        x: r.x + r.w / 2,
        y: r.y - 4,
        text: 'BZZT',
        life: 24,
      })
      this.crack(target)
    }
  }

  private movePaddle(input: InputFrame) {
    // A rose petal's sting holds the paddle still; a dirt clod makes it sluggish.
    const target =
      input.touchPaddleX === undefined
        ? null
        : LEFT + Math.max(0, Math.min(1, input.touchPaddleX)) * (RIGHT - LEFT)
    const steer =
      target === null
        ? (input.held.right ? 1 : 0) - (input.held.left ? 1 : 0)
        : Math.max(-1, Math.min(1, (target - this.paddleX) / 7))
    const dir = this.stung ? 0 : steer
    const touch = target !== null
    const push = this.muddy ? 0.9 : touch ? 3.8 : 2.2
    const top = this.muddy ? 2.2 : touch ? 10 : 5
    // A little momentum: quick to start, quick to stop.
    this.paddleV = dir ? this.paddleV * 0.6 + dir * push : this.paddleV * 0.4
    this.paddleV = Math.max(-top, Math.min(top, this.paddleV))
    const half = this.paddleW / 2
    this.paddleX = Math.max(
      LEFT + half,
      Math.min(RIGHT - half, this.paddleX + this.paddleV),
    )
  }

  private launch(ball: Ball) {
    // Off at an angle set by where it sits on the paddle.
    const offset = (ball.stuck ?? 0) / (this.paddleW / 2)
    const angle =
      -Math.PI / 2 + Math.max(-0.9, Math.min(0.9, offset * 1.1 + 0.25))
    ball.vx = Math.cos(angle) * this.speed
    ball.vy = Math.sin(angle) * this.speed
    ball.stuck = null
    this.sound.play('blip')
  }

  private updateBalls(input: InputFrame) {
    const calmFactor = this.calm > 0 ? 0.7 : 1
    for (const ball of this.balls) {
      if (ball.stuck !== null) {
        ball.x = this.paddleX + ball.stuck
        ball.y = PADDLE_Y - BALL_R - 1
        if (this.serveTimer > 0) this.serveTimer--
        if (
          input.pressed.a ||
          input.pressed.b ||
          (this.serveTimer === 0 && this.sticky === 0)
        )
          this.launch(ball)
        continue
      }
      ball.since++
      // Leaf Curl: B just after a paddle hit, while the paddle was moving, bends the ball.
      if (
        input.pressed.b &&
        ball.curl === 0 &&
        ball.hitDir !== 0 &&
        ball.since <= CURL_WINDOW
      ) {
        ball.curl = CURL_TICKS
        ball.curlDir = ball.hitDir
        this.float({ x: ball.x, y: ball.y - 8, text: 'CURL', life: 24 })
        this.sound.play('blip')
      }
      if (ball.curl > 0) {
        ball.curl--
        const bent = rotate(ball.vx, ball.vy, ball.curlDir * CURL_TURN)
        ball.vx = bent.vx
        ball.vy = bent.vy
      }
      // Last-Crate Rush: a gentle 10% steer toward the nearest crate that is left.
      if (this.bumble) {
        const near = this.breakable
          .map((b) => this.brickRect(b))
          .sort(
            (a, b) =>
              Math.hypot(a.x + a.w / 2 - ball.x, a.y + a.h / 2 - ball.y) -
              Math.hypot(b.x + b.w / 2 - ball.x, b.y + b.h / 2 - ball.y),
          )[0]
        if (near) {
          const steered = steerToward(
            ball.vx,
            ball.vy,
            near.x + near.w / 2 - ball.x,
            near.y + near.h / 2 - ball.y,
          )
          ball.vx = steered.vx
          ball.vy = steered.vy
        }
      }
      // Under the Lily Pond's water the ball moves slow and floaty, nudged along by the current,
      // and Queen Koi's whirlpool spirals it toward the middle.
      const wet = this.pond && inWater(ball.y)
      if (wet) this.swim(ball)
      const factor = calmFactor * (wet ? WATER_DRAG : 1)
      // Step in small pieces so a fast ball never tunnels through a crate.
      const v = Math.hypot(ball.vx, ball.vy) * factor
      const steps = Math.max(1, Math.ceil(v / 1.5))
      for (let i = 0; i < steps && ball.stuck === null; i++) {
        if (this.clear > 0) break
        this.stepBall(
          ball,
          (ball.vx * factor) / steps,
          (ball.vy * factor) / steps,
        )
      }
      // A plot in full bloom bounces a missed ball back up once, and cools it a step.
      if (ball.stuck === null && ball.vy > 0 && ball.y >= BED_SAVE_Y) {
        const plot = bedSave(this.bed, ball.x)
        if (plot !== null) {
          const speed = Math.hypot(ball.vx, ball.vy)
          const cooled = coolSpeed(speed)
          ball.vx *= cooled / speed
          ball.vy = -Math.abs(ball.vy * (cooled / speed))
          ball.y = BED_SAVE_Y - 1
          this.float({
            x: plotCenter(plot),
            y: BED_SAVE_Y - 16,
            text: 'BLOOM SAVE!',
            life: 50,
          })
          this.fx.burst(plotCenter(plot), BED_SAVE_Y, this.fxRng, {
            count: 12,
            colours: [RAMPS.leaf[4], RAMPS.gold[4], '#f9a8d4'],
          })
          this.sound.play('extra')
        }
      }
      // Never let a ball settle into a near-flat bounce that loops forever.
      const s = Math.hypot(ball.vx, ball.vy)
      if (ball.stuck === null && s > 0 && Math.abs(ball.vy) < s * 0.3) {
        ball.vy = Math.sign(ball.vy || 1) * s * 0.3
        ball.vx = Math.sign(ball.vx || 1) * Math.sqrt(s * s - ball.vy * ball.vy)
      }
    }
    const before = this.balls.length
    this.balls = this.balls.filter((b) => b.y < H + 8)
    if (before && !this.balls.length) this.loseBall()
  }

  /**
   * The seeds that can fall: the Cactus Dome brings in V (Vent) and the Lily Pond House D (Duo
   * Paddle); past the tour both stay in the mix.
   */
  private get seedPool(): readonly Seed[] {
    const house = this.tour ? this.tour.house : HOUSES.length
    if (house >= POND) return SEEDS_POND
    if (house >= DOME) return SEEDS_DOME
    return SEEDS
  }

  /** A sand timer whose sand still runs: unbreakable until it flips. */
  private sandShut(b: Brick): boolean {
    return b.kind === 'sand' && !sandOpen(this.tick, b.sand ?? 0)
  }

  /** One tick of a ball in the pond: the current's nudge (speed kept), and the whirlpool's pull. */
  private swim(ball: Ball) {
    const speed = Math.hypot(ball.vx, ball.vy)
    if (speed === 0) return
    const row = Math.floor((ball.y - BRICK_TOP) / BRICK_H)
    ball.vx += currentDir(row, this.tick) * WATER_CURRENT
    let s = Math.hypot(ball.vx, ball.vy)
    ball.vx *= speed / s
    ball.vy *= speed / s
    if (!this.boss || !whirling(this.boss)) return
    let diff =
      Math.atan2(WHIRL_CENTRE.y - ball.y, WHIRL_CENTRE.x - ball.x) -
      Math.atan2(ball.vy, ball.vx)
    while (diff > Math.PI) diff -= Math.PI * 2
    while (diff < -Math.PI) diff += Math.PI * 2
    // A spiral, not a straight pull: it turns the ball partway round the middle.
    const turned = rotate(
      ball.vx,
      ball.vy,
      Math.max(-WHIRL_TURN, Math.min(WHIRL_TURN, diff * 0.5 + 0.02)),
    )
    s = Math.hypot(turned.vx, turned.vy)
    ball.vx = (turned.vx * speed) / s
    ball.vy = (turned.vy * speed) / s
  }

  private stepBall(ball: Ball, dx: number, dy: number) {
    if (this.clear > 0) return
    ball.x += dx
    // The Vent seed's hatch: a ball flying out of it skips the wall.
    const vent = this.vent
    if (
      vent &&
      !this.boss &&
      ball.y >= VENT_Y0 &&
      ball.y <= VENT_Y1 &&
      (vent.side === 0 ? ball.x < LEFT + BALL_R : ball.x > RIGHT - BALL_R)
    ) {
      this.ventOut(vent.side)
      return
    }
    if (ball.x < LEFT + BALL_R) {
      ball.x = LEFT + BALL_R
      ball.vx = Math.abs(ball.vx)
    } else if (ball.x > RIGHT - BALL_R) {
      ball.x = RIGHT - BALL_R
      ball.vx = -Math.abs(ball.vx)
    }
    const hitX = this.hitBrick(ball)
    if (hitX) {
      if (this.thorn > 0 && !hitX.bolt) this.pierce(hitX)
      else {
        ball.x -= dx
        ball.vx = -ball.vx
        if (hitX.kind !== 'trellis') this.crack(hitX)
      }
    }
    const boss = this.boss
    if (boss && !boss.defeated) {
      if (bossTouches(boss, ball.x, ball.y, BALL_R)) {
        ball.x -= dx
        ball.vx = -ball.vx
        this.bonkBoss(ball)
      }
      if (this.hitSweep(ball)) {
        ball.x -= dx
        ball.vx = -ball.vx
      }
    }
    const oldY = ball.y
    ball.y += dy
    if (boss?.id === 'thorn' && !boss.defeated && dy < 0 &&
        oldY >= THORN_Y + BALL_R && ball.y < THORN_Y + BALL_R &&
        Math.abs(ball.x - boss.x) <= thornWidth(boss) / 2 + BALL_R) {
      const speed = Math.hypot(ball.vx, ball.vy)
      const offset = Math.max(-1, Math.min(1, (ball.x - boss.x) / (thornWidth(boss) / 2)))
      ball.y = THORN_Y + BALL_R + 0.1
      ball.vx = Math.sin(offset) * speed
      ball.vy = Math.cos(offset) * speed
      this.sound.play('blip')
    }
    if (ball.y < TOP + BALL_R) {
      ball.y = TOP + BALL_R
      ball.vy = Math.abs(ball.vy)
      if (boss?.id === 'thorn' && !boss.defeated) this.bonkBoss(ball)
      else this.ringRoof(ball)
    }
    const hitY = this.hitBrick(ball)
    if (hitY) {
      if (this.thorn > 0 && !hitY.bolt) this.pierce(hitY)
      else {
        ball.y -= dy
        ball.vy = -ball.vy
        // A trellis only breaks from below; the ball skips off its top and sides.
        if (hitY.kind !== 'trellis' || dy < 0) this.crack(hitY)
      }
    }
    if (boss && !boss.defeated) {
      if (bossTouches(boss, ball.x, ball.y, BALL_R)) {
        ball.y -= dy
        ball.vy = -ball.vy
        this.bonkBoss(ball)
        // A boss that moved onto the ball pushes it out underneath.
        if (bossTouches(boss, ball.x, ball.y, BALL_R)) {
          const r = bossRect(boss)
          ball.y = r.y + r.h + BALL_R + 0.5
          ball.vy = Math.abs(ball.vy)
        }
      }
      if (this.hitSweep(ball)) {
        ball.y -= dy
        ball.vy = -ball.vy
      }
      // Sunny Saguaro's spinning arms knock the ball around.
      if (boss.knock === 0 && armTouches(boss, ball.x, ball.y, BALL_R)) {
        const v = armKnock(boss, ball)
        ball.vx = v.vx
        ball.vy = v.vy
        this.sound.play('blip')
      }
      // The ball bonks clods and petals out of the air (a prickle ball is for catching).
      for (const s of [...boss.shots]) {
        if (s.kind === 'prickle') continue
        if (Math.hypot(s.x - ball.x, s.y - ball.y) > SHOT_R + BALL_R + 1)
          continue
        boss.shots = boss.shots.filter((o) => o !== s)
        this.addScore(60, s.x, s.y - 6)
        this.burst(s.x, s.y, 6, s.kind === 'clod' ? '#c9926a' : '#f9a8d4')
        this.sound.play('pop')
      }
    }
    this.hitDuo(ball)
    this.hitPaddle(ball)
    this.pestBonks(ball)
    for (const puff of this.puffs) {
      if (Math.hypot(puff.x - ball.x, puff.y - ball.y) > 9) continue
      // The gloom puff knocks the ball off at a random angle, and frays.
      const a = this.rng() * Math.PI * 2
      const s = Math.hypot(ball.vx, ball.vy)
      ball.vx = Math.cos(a) * s
      ball.vy = -Math.abs(Math.sin(a) * s) - 0.4
      this.hitPuff(puff)
    }
    const line = this.miteLine
    if (line) {
      for (const mite of [...line.mites]) {
        if (miteHit(mite, ball.x, ball.y)) this.popPollenMite(line, mite)
      }
    }
    const ring = this.ring
    if (ring) {
      for (const dot of [...ring.dots]) {
        if (dotHit(dot, ball.x, ball.y)) this.popLadybot(ring, dot)
      }
    }
    const snail = this.snail
    if (snail && snail.flash === 0 && snailHit(snail, ball.x, ball.y)) {
      // The shell turns the ball back up the wall.
      ball.vy = -Math.abs(ball.vy)
      ball.y = Math.min(ball.y, snail.y - 8)
      const score = crackSnail(snail, this.level)
      this.sound.play('pop')
      if (score > 0) {
        this.addScore(score, snail.x, snail.y - 10)
        this.earn(PETALS.pest)
        this.burst(snail.x, snail.y, 10, '#86efac')
        this.snail = null
      }
    }
  }

  /** A Tangle Rose vine wall meets the ball: the segment it hits cracks. */
  private hitSweep(ball: Ball): boolean {
    for (const s of this.boss?.sweeps ?? []) {
      const c = sweepCellAt(s, ball.x, ball.y, BALL_R)
      if (c < 0) continue
      s.cells[c] = false
      const cx = LEFT + (c + 0.5) * BRICK_W
      this.addScore(20, cx, s.y)
      this.burst(cx, s.y + SWEEP_H / 2, 5, RAMPS.leaf[3])
      this.sound.play('blip')
      return true
    }
    return false
  }

  private updateMites() {
    const line = this.miteLine
    if (!line) return
    for (const m of line.mites) stepMite(m, this.tick)
    line.mites = line.mites.filter((m) => !miteGone(m))
    if (line.mites.length === 0) this.miteLine = null
  }

  private updateRing() {
    const ring = this.ring
    if (!ring) return
    stepRing(ring)
    // Never seal a wall: once the ringed crate is all that is left, the ring lets go.
    if (!this.bricks.some((b) => !b.bolt && b !== this.ringBrick))
      this.ring = null
  }

  private popLadybot(ring: LadybotRing, dot: Ladybot) {
    const score = popDot(ring, dot, this.level)
    this.addScore(score, dot.x, dot.y - 8)
    this.earn(PETALS.pest)
    this.burst(dot.x, dot.y, 6, '#f87171')
    this.sound.play('pop')
  }

  private renderLadybot(g: CanvasRenderingContext2D, d: Ladybot) {
    const x = Math.round(d.x)
    const y = Math.round(d.y)
    glow(g, x, y, 6, '#f87171', 0.3)
    g.fillStyle = INK
    g.fillRect(x - 3, y - 3, 7, 7)
    g.fillStyle = '#ef4444'
    g.fillRect(x - 2, y - 2, 5, 5)
    g.fillStyle = INK
    g.fillRect(x, y - 2, 1, 5)
    g.fillRect(x - 1, y - 1, 1, 1)
    g.fillRect(x + 1, y + 1, 1, 1)
  }

  private popPollenMite(line: MiteLine, mite: Mite) {
    const score = popMite(line, mite, this.level)
    this.addScore(score, mite.x, mite.y - 8)
    this.earn(PETALS.pest)
    this.burst(mite.x, mite.y, 8, '#fde047')
    this.sound.play('pop')
    if (line.popped === line.total) this.miteLine = null
  }

  private renderSnail(g: CanvasRenderingContext2D, s: Snail) {
    const x = Math.round(s.x)
    const y = Math.round(s.y)
    const lit = s.flash > 0 && Math.floor(s.flash / 2) % 2 === 0
    glow(g, x, y, 10, '#86efac', 0.25)
    g.fillStyle = INK
    g.fillRect(x - 8, y - 2, 16, 8)
    g.fillRect(x - 5, y - 7, 10, 6)
    g.fillStyle = lit ? '#ffffff' : '#86efac'
    g.fillRect(x - 7, y - 1, 14, 6)
    g.fillStyle = s.hp > 1 ? '#fde68a' : '#fca5a5'
    g.fillRect(x - 4, y - 6, 8, 5)
    g.fillStyle = INK
    g.fillRect(x + s.dir * 6, y - 1, 1, 1)
    g.fillRect(x + s.dir * 7, y - 6, 1, 3)
  }

  private renderMite(g: CanvasRenderingContext2D, m: Mite) {
    const x = Math.round(m.x)
    const y = Math.round(m.y)
    const flap = Math.floor(this.tick / 6) % 2
    glow(g, x, y, 8, '#fde047', 0.3)
    g.fillStyle = INK
    g.fillRect(x - 4, y - 3, 8, 7)
    g.fillStyle = '#fde047'
    g.fillRect(x - 3, y - 2, 6, 5)
    g.fillStyle = '#fef9c3'
    g.fillRect(x - 3, y - 2, 6, 1)
    g.fillStyle = INK
    g.fillRect(x - 2, y - 1, 1, 1)
    g.fillRect(x + 1, y - 1, 1, 1)
    g.fillStyle = '#ffffff'
    g.fillRect(x - 6, y - 4 + flap * 2, 2, 2)
    g.fillRect(x + 4, y - 4 + flap * 2, 2, 2)
  }

  /** The Thorn Ball goes straight through a crate: it breaks outright and the ball flies on. */
  private pierce(b: Brick) {
    b.hp = 1
    this.crack(b)
  }

  /** The roof glass rings, and the next crate pays double. */
  private ringRoof(ball: Ball) {
    if (this.chime) return
    this.chime = true
    this.float({ x: ball.x, y: TOP + 14, text: 'CHIME x2', life: 40 })
    this.sound.play('pickup')
  }

  private hitBrick(ball: Ball): Brick | undefined {
    return this.bricks.find((b) => {
      if (b.kind === 'hinge' && b.open) return false
      const r = this.brickRect(b)
      return (
        ball.x + BALL_R > r.x &&
        ball.x - BALL_R < r.x + r.w &&
        ball.y + BALL_R > r.y &&
        ball.y - BALL_R < r.y + r.h
      )
    })
  }

  private hitPaddle(ball: Ball) {
    if (ball.vy <= 0) return
    const half = this.paddleW / 2
    if (
      ball.y + BALL_R < PADDLE_Y ||
      ball.y - BALL_R > PADDLE_Y + PADDLE_H ||
      ball.x < this.paddleX - half - BALL_R ||
      ball.x > this.paddleX + half + BALL_R
    )
      return
    const offset = Math.max(-1, Math.min(1, (ball.x - this.paddleX) / half))
    this.cashChain(ball)
    if (this.sticky > 0) {
      ball.stuck = ball.x - this.paddleX
      ball.vx = 0
      ball.vy = 0
      this.sound.play('pickup')
      return
    }
    // Where it lands decides the angle: steep in the middle, wide at the edges.
    const max = (levelCurve(this.level, BLOOM_CURVES.maxSpeed) * (this.secondBloom || this.houseNow === CONSERVATORY_INDEX ? 1.15 : 1))
    const speed = Math.min(max, Math.hypot(ball.vx, ball.vy) + 0.04)
    const angle = -Math.PI / 2 + offset * 1.05
    ball.vx = Math.cos(angle) * speed + this.paddleV * 0.08
    ball.vy = Math.sin(angle) * speed
    ball.y = PADDLE_Y - BALL_R - 0.1
    ball.since = 0
    ball.hitDir = curlDirection(this.paddleV)
    ball.curl = 0
    this.sound.play('blip')
  }

  /** Touching the paddle cashes the Pollen Chain in. */
  private cashChain(ball: Ball) {
    const bonus = cashIn(this.chain)
    if (bonus > 0) {
      this.addScore(bonus, ball.x, PADDLE_Y - 14)
      this.float({
        x: ball.x,
        y: PADDLE_Y - 24,
        text: `CHAIN x${Math.min(this.chain, 8)}`,
        life: 44,
      })
    }
    this.chain = 0
  }

  private crack(b: Brick) {
    b.flash = 6
    // The ladybot ring shields its crate: the ball rings off it until the last dot pops.
    if (
      b.bolt ||
      (b === this.ringBrick && ringShields(this.ring)) ||
      this.sandShut(b)
    ) {
      this.sound.play('blip')
      return
    }
    b.hp--
    const r = this.brickRect(b)
    const cx = r.x + r.w / 2
    const cy = r.y + r.h / 2
    // A prickle crate pricks the ball: every ball speeds up a step.
    if (b.kind === 'prickle') {
      const cap = (levelCurve(this.level, BLOOM_CURVES.maxSpeed) * (this.secondBloom || this.houseNow === CONSERVATORY_INDEX ? 1.15 : 1))
      for (const ball of this.balls) {
        const s = Math.hypot(ball.vx, ball.vy)
        if (s === 0) continue
        const faster = prickled(s, cap)
        ball.vx *= faster / s
        ball.vy *= faster / s
      }
      this.float({ x: cx, y: cy - 8, text: 'PRICK!', life: 24 })
    }
    if (b.hp <= 0) this.lastCrackX = cx
    // The roof chime doubles the next crate's points, chip or crack.
    const chimed = this.chime ? CHIME_MULT : 1
    this.chime = false
    if (b.hp > 0) {
      this.sound.play('blip')
      this.addScore(5 * chimed, cx, cy)
      return
    }
    // Pollen Chain: every crate cracked between paddle touches pays more than the last.
    const link = chainMultiplier(this.chain)
    this.chain++
    this.bestChain = Math.max(this.bestChain, this.chain)
    this.bricks = this.bricks.filter((o) => o !== b)
    this.earn(PETALS.crate)
    if (b.kind === 'glow' || b.kind === 'lantern') {
      this.litRows.set(b.row, this.tick + 240)
      this.float({ x: cx, y: cy - 8, text: 'LIGHT!', life: 40 })
    }
    // A bubble crate pops into a bouncy bumper for a few seconds.
    if (b.kind === 'bubble') this.bumpers.push(spawnBumper(cx, cy))
    if (b.vault) this.openVault(cx, cy)
    if (b.guard && this.bricks.some((o) => o.guard))
      this.float({
        x: cx,
        y: cy + 8,
        text: `${this.bricks.filter((o) => o.guard).length} LEFT`,
        life: 30,
      })
    const points = (ROWS - b.row) * 10 * b.maxHp * link * chimed
    this.addScore(points, cx, cy - 4)
    if (link > 1 && !this.demo)
      this.float({ x: cx, y: cy + 6, text: `x${link}`, life: 30 })
    this.burst(cx, cy, 6, ROW_COLORS[b.row]!)
    const ramp = ROW_RAMPS[b.row]!
    this.fx.burst(cx, cy, this.fxRng, {
      count: 7,
      colours: [ramp[4], ramp[3], RAMPS.gold[4]],
      speed: 1.4,
    })
    // A flower blooms where the crate was and floats away; a petal falls to plant the Bloom Bed.
    const color = FLOWER_COLORS[Math.floor(this.rng() * FLOWER_COLORS.length)]!
    this.flowers.push({
      x: cx,
      y: cy,
      vy: -0.4 - this.rng() * 0.3,
      life: 70,
      color,
    })
    this.petals.push({ x: cx, y: cy, color })
    this.sound.play('pop')
    // Speed up a touch with every crate, up to the stage's cap.
    const max = (levelCurve(this.level, BLOOM_CURVES.maxSpeed) * (this.secondBloom || this.houseNow === CONSERVATORY_INDEX ? 1.15 : 1))
    for (const ball of this.balls) {
      const s = Math.hypot(ball.vx, ball.vy)
      if (s > 0 && s < max) {
        ball.vx *= (s + 0.015) / s
        ball.vy *= (s + 0.015) / s
      }
    }
    // A sprout crate always drops a seed; the rest drop one by chance.
    if (
      b.kind === 'sprout' ||
      this.rng() < levelCurve(this.level, BLOOM_CURVES.seedChance)
    ) {
      const pool = this.seedPool
      this.drops.push({
        x: cx,
        y: cy,
        kind: pool[Math.floor(this.rng() * pool.length)]!,
      })
    }
    // A cracked vine pulls its side neighbours down a row (never into another crate or the floor).
    if (b.kind === 'vine') {
      for (const o of this.bricks) {
        if (o.row !== b.row || Math.abs(o.col - b.col) !== 1) continue
        if (o.row + 1 >= ROWS) continue
        if (this.bricks.some((x) => x.col === o.col && x.row === o.row + 1))
          continue
        o.row++
      }
    }
    // A puffball bursts: it cracks all eight neighbours, so chains can run.
    if (b.kind === 'puffball') {
      this.fx.burst(cx, cy, this.fxRng, { count: 12, speed: 2 })
      for (const o of this.bricks.slice()) {
        if (o.bolt || !this.bricks.includes(o)) continue
        if (Math.abs(o.col - b.col) <= 1 && Math.abs(o.row - b.row) <= 1)
          this.crack(o)
      }
    }
  }

  /** A cracked vault lets its golden seed fall (or pays petals if that seed is already home). */
  private openVault(x: number, y: number) {
    const id = this.tour ? houseAt(this.tour.house)?.id : undefined
    if (!id || !VAULTS[id]) return
    // Keep the long words on the glass, whichever edge the vault sits by.
    const tx = Math.max(LEFT + 44, Math.min(RIGHT - 44, x))
    if (this.golden.has(id)) {
      this.earn(PETALS.vault)
      this.float({ x: tx, y: y + 8, text: 'VAULT PETALS', life: 40 })
      return
    }
    this.goldenDrop = { x, y, house: id }
    this.float({ x: tx, y: y + 8, text: 'A GOLDEN SEED!', life: 50 })
    this.sound.play('extra')
  }

  private updateDrops() {
    for (const d of this.drops) {
      d.y += 1.1
      const half = this.paddleW / 2
      if (
        d.y > PADDLE_Y - 4 &&
        d.y < PADDLE_Y + PADDLE_H + 4 &&
        Math.abs(d.x - this.paddleX) < half + 5
      ) {
        d.y = H + 99
        this.power(d.kind)
      }
    }
    this.drops = this.drops.filter((d) => d.y < H + 10)
  }

  private power(kind: Seed) {
    this.addScore(50, this.paddleX, PADDLE_Y - 12)
    this.sound.play('pickup')
    this.fx.burst(this.paddleX, PADDLE_Y - 2, this.fxRng, {
      count: 10,
      colours: [SEED_RAMPS[kind][4], SEED_RAMPS[kind][3], RAMPS.gold[4]],
    })
    const label: Record<Seed, string> = {
      W: 'WIDE!',
      S: 'STICKY!',
      M: 'MULTI!',
      C: 'CALM!',
      '+': 'SPARE PADDLE!',
      R: 'RAIN SPRAY!',
      T: 'THORN BALL!',
      Q: "QUEEN'S COMPASS!",
      V: this.boss ? 'NO VENTS AT A BOSS' : 'VENT OPEN!',
      D: 'DUO PADDLE!',
    }
    this.float({
      x: this.paddleX,
      y: PADDLE_Y - 22,
      text: label[kind],
      life: 50,
    })
    // Vent: a hatch opens in one side of the frame; fly the ball out of it to skip the wall.
    if (kind === 'V' && !this.boss)
      this.vent = { side: this.rng() < 0.5 ? 0 : 1, ticks: VENT_TICKS }
    if (kind === 'D') {
      if (this.duo <= 0) this.duoX = this.paddleX
      this.duo = POWER_TICKS
    }
    if (kind === 'W') this.wide = POWER_TICKS
    if (kind === 'S') this.sticky = POWER_TICKS
    if (kind === 'C') this.calm = POWER_TICKS
    if (kind === 'R') this.rain = RAIN_TICKS
    if (kind === 'T') this.thorn = THORN_TICKS
    if (kind === 'Q') this.compass = COMPASS_TICKS
    if (kind === '+') {
      this.lives++
      this.sound.play('extra')
    }
    if (kind === 'M') {
      const free = this.balls.find((b) => b.stuck === null) ?? this.balls[0]
      if (!free) return
      if (free.stuck !== null) this.launch(free)
      const s = Math.hypot(free.vx, free.vy) || this.speed
      for (const turn of [-0.5, 0.5]) {
        if (this.balls.length >= MAX_BALLS) break
        const a = Math.atan2(free.vy, free.vx) + turn
        this.balls.push(
          this.newBall(free.x, free.y, Math.cos(a) * s, Math.sin(a) * s, null),
        )
      }
    }
  }

  private updatePuffs() {
    for (const p of this.puffs) {
      p.x += p.vx
      p.y += p.vy + Math.sin(this.tick / 30 + p.x) * 0.15
      if (p.x < LEFT + 10 || p.x > RIGHT - 10) p.vx = -p.vx
      if (p.y < 130 || p.y > 250) p.vy = -p.vy
      p.x = Math.max(LEFT + 10, Math.min(RIGHT - 10, p.x))
      p.y = Math.max(130, Math.min(250, p.y))
    }
  }

  private hitPuff(puff: Puff) {
    puff.hp--
    this.sound.play('warn')
    if (puff.hp > 0) return
    this.puffs = this.puffs.filter((p) => p !== puff)
    this.addScore(100 * this.level, puff.x, puff.y - 8)
    this.earn(PETALS.pest)
    this.burst(puff.x, puff.y, 12, '#c4b5fd')
    this.fx.burst(puff.x, puff.y, this.fxRng, { count: 14, speed: 2 })
    this.sound.play('pop')
  }

  private loseBall() {
    this.lives--
    this.lost = LOST_TICKS
    this.wide = 0
    this.sticky = 0
    this.calm = 0
    this.rain = 0
    this.thorn = 0
    this.compass = 0
    this.droplets = []
    this.chain = 0
    this.chime = false
    this.drops = []
    this.muddy = 0
    this.stung = 0
    this.duo = 0
    this.vent = null
    this.ghosts = []
    if (this.boss) this.boss.shots = []
    this.burst(this.paddleX, PADDLE_Y, 12, '#f9a8d4')
    this.sound.play('die')
    if (this.lives > 0) this.banner = { text: 'BALL LOST', ticks: LOST_TICKS }
  }

  private stageClear() {
    // Cash in the chain, plant every petal still falling, and pay the Last-Crate Rush bonus.
    const rush = this.rushTicks > 0 ? rushBonus(this.rushTicks) : 0
    const bonus = 1000 * this.level + rush + cashIn(this.chain)
    this.addScore(bonus, W / 2, 180)
    for (const petal of this.petals) plantPetal(this.bed, petal.x)
    this.petals = []
    this.droplets = []
    this.bumble = null
    this.chain = 0
    this.balls = []
    this.clear = CLEAR_TICKS
    this.banner = {
      text: 'STAGE IN BLOOM!',
      sub: rush > 0 ? `BONUS ${bonus} · RUSH ${rush}` : `BONUS ${bonus}`,
      ticks: CLEAR_TICKS,
    }
    this.sound.play('level')
    // A wall on the rich route pays extra petals for the bench.
    if (this.richWall && this.tour && !this.boss) {
      this.earn(10)
      this.float({ x: W / 2, y: 236, text: 'RICH VENT +10', life: 70 })
    }
    // A golden seed still falling when the wall blooms: Bumble catches it.
    const seed = this.goldenDrop
    if (seed) {
      this.collectGolden(seed)
      this.float({
        x: W / 2,
        y: 250,
        text: 'BUMBLE CAUGHT IT!',
        life: 80,
      })
    }
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x: number, y: number) {
    if (this.demo) return
    this.score += points
    if (points >= 50) this.float({ x, y, text: String(points), life: 36 })
    if (
      this.extraIndex < EXTRA_AT.length &&
      this.score >= EXTRA_AT[this.extraIndex]!
    ) {
      this.extraIndex++
      this.lives++
      this.banner = { text: 'SPARE PADDLE!', ticks: 80 }
      this.sound.play('extra')
    }
  }

  /**
   * Every floating word goes through here: kept whole on the glass, and lifted clear of any
   * word already floating where it would land, so popups and labels never print over each other.
   */
  private float(f: Floater) {
    const half = (f.text.length * 6) / 2
    f.x = Math.max(half + 1, Math.min(W - half - 1, f.x))
    for (let tries = 0; tries < 6; tries++) {
      const clash = this.floaters.some(
        (o) =>
          Math.abs(o.y - f.y) < 9 &&
          Math.abs(o.x - f.x) < ((o.text.length + f.text.length) * 6) / 2 + 2,
      )
      if (!clash) break
      f.y -= 9
    }
    this.floaters.push(f)
  }

  private burst(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.4 + this.rng() * 1.3
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 14 + Math.floor(this.rng() * 12),
        color,
      })
    }
  }

  private updateEffects() {
    this.fx.update()
    // A stage in bloom keeps sparkling until the next one starts.
    if (this.clear > 0 && this.tick % 8 === 0)
      this.fx.burst(
        LEFT + 16 + this.fxRng() * (RIGHT - LEFT - 32),
        BRICK_TOP + this.fxRng() * ROWS * BRICK_H,
        this.fxRng,
        { count: 6 },
      )
    for (const ball of this.balls) {
      if (ball.stuck !== null) {
        this.trails.delete(ball)
        continue
      }
      const trail = this.trails.get(ball) ?? []
      trail.push({ x: ball.x, y: ball.y })
      if (trail.length > 6) trail.shift()
      this.trails.set(ball, trail)
    }
    for (const ball of this.trails.keys())
      if (!this.balls.includes(ball)) this.trails.delete(ball)
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.05
      p.life--
    }
    this.particles = this.particles.filter((p) => p.life > 0)
    for (const f of this.flowers) {
      f.y += f.vy
      f.life--
    }
    this.flowers = this.flowers.filter((f) => f.life > 0)
    for (const f of this.floaters) {
      f.y -= 0.4
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
  }

  // --- attract-mode pilot -----------------------------------------------------

  /** Where a falling ball will cross the paddle line, bouncing off the side walls. */
  private landingX(ball: Ball): number {
    if (ball.vy <= 0) return ball.x
    const t = (PADDLE_Y - BALL_R - ball.y) / ball.vy
    let x = ball.x + ball.vx * t
    const span = RIGHT - LEFT - BALL_R * 2
    x -= LEFT + BALL_R
    x = ((x % (2 * span)) + 2 * span) % (2 * span)
    if (x > span) x = 2 * span - x
    return x + LEFT + BALL_R
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
    // Follow the lowest falling ball (or a seed worth catching when all's calm).
    const falling = this.balls
      .filter((b) => b.stuck === null && b.vy > 0)
      .sort((a, b) => b.y - a.y)[0]
    let aim = this.paddleX
    if (falling) {
      // Meet it a little off-centre, toward the crates' side, to send it there.
      // At a boss: its guards first, then the boss itself.
      const guards = this.bricks.filter((b) => b.guard)
      const bricksLeft = this.boss ? guards : this.bricks.filter((b) => !b.bolt)
      const meanCol = bricksLeft.length
        ? bricksLeft.reduce((s, b) => s + b.col, 0) / bricksLeft.length
        : COLS / 2
      const goal =
        this.boss && !guards.length
          ? this.boss.x
          : LEFT + (meanCol + 0.5) * BRICK_W
      const towards = Math.sign(goal - this.paddleX)
      aim = this.landingX(falling) - towards * this.paddleW * 0.2
    } else if (this.drops.length) {
      aim = this.drops[0]!.x
    } else if (this.balls[0]?.stuck !== null && this.tick % 40 === 0) {
      frame.pressed.a = true
    }
    if (aim < this.paddleX - 3) held.left = true
    if (aim > this.paddleX + 3) held.right = true
    return frame
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    this.renderGarden(g)
    const boss = this.boss
    // Queen Koi swims under the water; she is drawn over it only mid-leap.
    const submerged = boss?.id === 'queen-koi' && boss.leap === 0
    if (boss && submerged) drawKoi(g, boss, this.tick)
    if (this.pond) drawWater(g, this.tick)
    if (boss) this.renderBossBack(g, boss)
    this.renderWall(g)
    if (boss && !submerged) this.renderBoss(g, boss)
    for (const b of this.bumpers) drawBumper(g, b, this.tick)
    if (this.vent) drawVent(g, this.vent.side, this.vent.ticks, this.tick)
    this.renderBed(g)
    if (this.tumble) drawTumbleweed(g, this.tumble, this.tick)
    if (this.beetle) drawBeetle(g, this.beetle)
    if (this.frog) drawFrog(g, this.frog, this.tick)
    if (this.mirror) drawMirror(g, this.mirror, this.tick)
    for (const gh of this.ghosts) drawGhost(g, gh)
    if (this.duo > 0) drawDuo(g, this.duoX, DUO_Y, DUO_W, this.tick)
    if (this.compass > 0) this.renderCompass(g)
    for (const f of this.flowers) this.renderFlower(g, f)
    for (const p of this.petals) this.renderPetal(g, p)
    for (const d of this.droplets) {
      g.fillStyle = INK
      g.fillRect(Math.round(d.x) - 1, Math.round(d.y) - 1, 3, 5)
      g.fillStyle = SEED_COLORS.R
      g.fillRect(Math.round(d.x), Math.round(d.y), 1, 3)
    }
    if (this.bumble) this.renderBumble(g, this.bumble)
    for (const p of this.puffs) this.renderPuff(g, p)
    if (this.miteLine)
      for (const m of this.miteLine.mites) this.renderMite(g, m)
    if (this.snail) this.renderSnail(g, this.snail)
    if (this.ring) for (const d of this.ring.dots) this.renderLadybot(g, d)
    for (const d of this.drops) this.renderDrop(g, d)
    if (this.boss) for (const s of this.boss.shots) this.renderShot(g, s)
    if (this.goldenDrop) this.renderGolden(g, this.goldenDrop)
    this.renderPaddle(g)
    // With a mirror bug about, only the real ball casts a shadow on the glass.
    if (this.mirror || this.ghosts.length)
      for (const ball of this.balls) drawBallShadow(g, ball.x, ball.y)
    for (const ball of this.balls) this.renderBall(g, ball)
    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, p.life / 26)
      const x = Math.round(p.x) - 1
      const y = Math.round(p.y) - 1
      g.fillStyle = INK
      g.fillRect(x - 1, y - 1, 4, 4)
      g.fillStyle = p.color
      g.fillRect(x, y, 2, 2)
      g.fillStyle = '#ffffff'
      g.fillRect(x, y, 1, 1)
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
    if (this.card) this.renderCard(g, this.card)
    if (this.bench) this.renderBench(g, this.bench)
    if (this.offer) this.renderOffer(g, this.offer)
    if (this.credits || this.tourMenu) this.renderTourEnd(g)
  }

  // --- slice 2 art: bosses, shots, the golden seed, the map, the bench ------------------------

  /** Chains for Mister Mulch, roots and stems for the Tangle Rose, drawn behind the wall. */
  private renderBossBack(g: CanvasRenderingContext2D, boss: Boss) {
    const x = Math.round(boss.x)
    const top = Math.round(boss.y - boss.h / 2)
    if (boss.id === 'mister-mulch') {
      for (const cx of [x - 18, x + 18]) {
        for (let y = TOP; y < top; y += 4) {
          g.fillStyle = INK
          g.fillRect(cx - 2, y, 4, 4)
          g.fillStyle = (y >> 2) % 2 ? RAMPS.steel[3] : RAMPS.steel[2]
          g.fillRect(cx - 1, y, 2, 3)
        }
      }
      return
    }
    if (boss.id !== 'tangle-rose') return
    // The rose's stem climbs from the roof; each living root feeds a vine to her bud.
    g.fillStyle = RAMPS.leaf[1]
    g.fillRect(x - 2, TOP, 4, top - TOP)
    g.fillStyle = RAMPS.leaf[2]
    g.fillRect(x - 1, TOP, 1, top - TOP)
    for (const b of this.bricks) {
      if (!b.guard) continue
      const r = this.brickRect(b)
      const fx = r.x + r.w / 2
      const fy = r.y + r.h / 2
      const steps = 16
      for (let i = 1; i < steps; i++) {
        const t = i / steps
        const px = fx + (boss.x - fx) * t
        const py =
          fy +
          (boss.y - fy) * t -
          Math.sin(t * Math.PI) * 14 +
          Math.sin(this.tick / 20 + i) * 1
        g.fillStyle = INK
        g.fillRect(Math.round(px) - 1, Math.round(py) - 1, 3, 3)
        g.fillStyle = i % 4 === 0 ? RAMPS.ember[3] : RAMPS.leaf[2]
        g.fillRect(Math.round(px), Math.round(py), 1, 1)
      }
    }
  }

  private renderBoss(g: CanvasRenderingContext2D, boss: Boss) {
    if (boss.id === 'thorn') {
      bevel(g, boss.x - thornWidth(boss) / 2, THORN_Y - 6, thornWidth(boss), 6, RAMPS.purple, { depth: 1 })
      glow(g, boss.x, THORN_Y - 3, 10, RAMPS.pink[3], 0.5)
      return
    }
    if (boss.id === 'sunny-saguaro') return drawSaguaro(g, boss, this.tick)
    if (boss.id === 'queen-koi') return drawKoi(g, boss, this.tick)
    if (boss.id === 'gloom-bloom') {
      const open = boss.defeated || gloomOpen(boss)
      const colour = boss.defeated ? RAMPS.cream[4] : RAMPS.purple[3]
      glow(g, boss.x, boss.y, open ? 32 : 22, colour, 0.6)
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4
        const radius = open ? 15 : 8
        g.fillStyle = INK
        g.beginPath()
        g.ellipse(
          boss.x + Math.cos(angle) * radius,
          boss.y + Math.sin(angle) * radius,
          10,
          7,
          angle,
          0,
          Math.PI * 2,
        )
        g.fill()
        g.fillStyle = colour
        g.fill()
      }
      g.fillStyle = open ? RAMPS.gold[4] : RAMPS.night[0]
      g.fillRect(boss.x - 5, boss.y - 5, 10, 10)
      return
    }
    const r = bossRect(boss)
    const x = Math.round(r.x)
    const y = Math.round(r.y)
    const hurt = boss.hurt > 0 && Math.floor(boss.hurt / 3) % 2 === 0
    const tell = boss.tell > 0
    const shake = tell ? (Math.floor(this.tick / 2) % 2) * 2 - 1 : 0
    dropShadow(g, boss.x, r.y + r.h + 4, r.w / 2, 3, 0.35)
    if (boss.id === 'mister-mulch') {
      const ramp = hurt ? RAMPS.cream : RAMPS.earth
      bevel(g, x + shake, y, r.w, r.h, ramp, { depth: 2 })
      // Compost slats, leaf litter and a happy face once he is cheered.
      g.fillStyle = ramp[1]
      for (let sx = x + 8; sx < x + r.w - 4; sx += 12)
        g.fillRect(sx + shake, y + 3, 2, r.h - 6)
      for (const [lx, ly] of [
        [6, 5],
        [r.w - 12, 7],
        [20, r.h - 7],
      ] as const)
        drawSprite(g, LEAF_SPRITE, x + lx + shake, y + ly, {
          anchor: 'topleft',
        })
      const fx = Math.round(boss.x) + shake
      const fy = y + r.h - 14
      g.fillStyle = INK
      g.fillRect(fx - 14, fy - 2, 28, 12)
      g.fillStyle = boss.phase === 1 ? RAMPS.earth[0] : RAMPS.earth[2]
      g.fillRect(fx - 13, fy - 1, 26, 10)
      const eye = boss.defeated
        ? RAMPS.leaf[4]
        : tell
          ? RAMPS.ember[3]
          : RAMPS.gold[3]
      g.fillStyle = eye
      g.fillRect(fx - 9, fy + 1, 4, 3)
      g.fillRect(fx + 5, fy + 1, 4, 3)
      g.fillStyle = INK
      if (boss.defeated) g.fillRect(fx - 4, fy + 6, 8, 1)
      else g.fillRect(fx - 3, fy + 6, 6, 2)
      if (tell) {
        // Dirt dribbles from his base: a clod is coming.
        g.fillStyle = RAMPS.earth[2]
        for (let i = 0; i < 3; i++)
          g.fillRect(fx - 6 + i * 6, y + r.h + ((this.tick + i * 5) % 8), 2, 2)
      }
      return
    }
    // The Tangle Rose: a thorny bush of leaves around a big bud, shielded while roots feed her.
    const cx = Math.round(boss.x)
    const cy = Math.round(boss.y)
    g.fillStyle = INK
    g.beginPath()
    g.ellipse(cx, cy, r.w / 2 + 1, r.h / 2 + 1, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = RAMPS.leaf[1]
    g.beginPath()
    g.ellipse(cx, cy + 3, r.w / 2, r.h / 2 - 2, 0, 0, Math.PI * 2)
    g.fill()
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + this.tick / 120
      const tx = Math.round(cx + Math.cos(a) * (r.w / 2 - 1))
      const ty = Math.round(cy + 3 + Math.sin(a) * (r.h / 2 - 3))
      g.fillStyle = RAMPS.cream[3]
      g.fillRect(tx - 1, ty - 1, 2, 2)
    }
    const petal = hurt
      ? RAMPS.cream
      : boss.defeated
        ? RAMPS.pink
        : tell
          ? RAMPS.ember
          : RAMPS.pink
    // Two rings of round petals that open wider with every phase, lit from the top.
    const open = boss.defeated ? 11 : boss.phase === 1 ? 7 : 9
    for (const [ring, count, radius, size] of [
      [0, 7, open, 6],
      [1, 5, open * 0.5, 5],
    ] as const) {
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + ring * 0.6 + this.tick / 240
        const px = cx + Math.cos(a) * radius
        const py = cy + Math.sin(a) * radius * 0.85
        g.fillStyle = INK
        g.beginPath()
        g.arc(px, py, size + 1, 0, Math.PI * 2)
        g.fill()
        g.fillStyle = petal[ring ? 3 : 2]
        g.beginPath()
        g.arc(px, py, size, 0, Math.PI * 2)
        g.fill()
        g.fillStyle = petal[4]
        g.fillRect(Math.round(px) - 2, Math.round(py - size + 1), 3, 1)
      }
    }
    g.fillStyle = INK
    g.fillRect(cx - 5, cy - 5, 10, 10)
    g.fillStyle = petal[1]
    g.fillRect(cx - 4, cy - 4, 8, 8)
    // A gentle face in the bud's heart.
    g.fillStyle = INK
    g.fillRect(cx - 3, cy - 2, 2, 2)
    g.fillRect(cx + 1, cy - 2, 2, 2)
    if (boss.defeated) g.fillRect(cx - 2, cy + 2, 4, 1)
    else g.fillRect(cx - 1, cy + 2, 2, 1)
    if (boss.phase === 1) {
      // The root-fed shield: a ring of thorns.
      g.strokeStyle = rgba(RAMPS.leaf[4], 0.55 + 0.25 * Math.sin(this.tick / 8))
      g.lineWidth = 2
      g.beginPath()
      g.ellipse(cx, cy, r.w / 2 + 5, r.h / 2 + 5, 0, 0, Math.PI * 2)
      g.stroke()
    }
    for (const s of boss.sweeps) this.renderSweep(g, s)
  }

  private renderSweep(g: CanvasRenderingContext2D, s: Sweep) {
    const y = Math.round(s.y)
    s.cells.forEach((on, c) => {
      if (!on) return
      const x = Math.round(LEFT + c * BRICK_W)
      g.fillStyle = INK
      g.fillRect(x, y, Math.round(BRICK_W), SWEEP_H)
      g.fillStyle = RAMPS.leaf[2]
      g.fillRect(x + 1, y + 1, Math.round(BRICK_W) - 2, SWEEP_H - 2)
      g.fillStyle = RAMPS.leaf[3]
      g.fillRect(x + 1, y + 1, Math.round(BRICK_W) - 2, 2)
      g.fillStyle = RAMPS.cream[3]
      g.fillRect(x + 5, y + SWEEP_H - 2, 1, 1)
      g.fillRect(x + 13, y + SWEEP_H - 2, 1, 1)
    })
  }

  private renderShot(g: CanvasRenderingContext2D, s: BossShot) {
    const x = Math.round(s.x)
    const y = Math.round(s.y)
    if (s.kind === 'clod') {
      g.fillStyle = INK
      g.fillRect(x - 4, y - 3, 8, 7)
      g.fillStyle = RAMPS.earth[2]
      g.fillRect(x - 3, y - 2, 6, 5)
      g.fillStyle = RAMPS.earth[3]
      g.fillRect(x - 3, y - 2, 3, 2)
      return
    }
    if (s.kind === 'gloom') {
      glow(g, x, y, 12, RAMPS.purple[3], 0.6)
      g.fillStyle = RAMPS.night[0]
      g.fillRect(x - 4, y - 3, 8, 6)
      g.fillStyle = RAMPS.purple[4]
      g.fillRect(x - 2, y - 1, 4, 2)
      return
    }
    if (s.kind === 'prickle') {
      // A spiny green ball, glowing: catch it for an extra ball.
      glow(g, x, y, 10, RAMPS.leaf[3], 0.45)
      g.fillStyle = INK
      g.fillRect(x - 4, y - 4, 9, 9)
      g.fillStyle = RAMPS.leaf[2]
      g.fillRect(x - 3, y - 3, 7, 7)
      g.fillStyle = RAMPS.leaf[4]
      g.fillRect(x - 3, y - 3, 3, 2)
      g.fillStyle = RAMPS.cream[4]
      for (const [px, py] of [
        [0, -6],
        [0, 5],
        [-6, 0],
        [5, 0],
      ] as const)
        g.fillRect(x + px, y + py, 1, 2)
      return
    }
    glow(g, x, y, 6, RAMPS.pink[3], 0.35)
    g.fillStyle = INK
    g.fillRect(x - 3, y - 2, 6, 5)
    g.fillStyle = RAMPS.pink[3]
    g.fillRect(x - 2, y - 1, 4, 3)
    g.fillStyle = '#ffffff'
    g.fillRect(x - 2, y - 1, 1, 1)
  }

  private renderGolden(g: CanvasRenderingContext2D, s: Golden) {
    const x = Math.round(s.x)
    const y = Math.round(s.y)
    glow(g, x, y, 14, RAMPS.gold[3], 0.5)
    g.fillStyle = INK
    g.fillRect(x - 4, y - 5, 8, 10)
    g.fillStyle = RAMPS.gold[2]
    g.fillRect(x - 3, y - 4, 6, 8)
    g.fillStyle = RAMPS.gold[4]
    g.fillRect(x - 3, y - 4, 2, 4)
    g.fillStyle = RAMPS.leaf[3]
    g.fillRect(x, y - 7, 2, 3)
    if (Math.floor(this.tick / 6) % 2) {
      g.fillStyle = '#ffffff'
      g.fillRect(x + 4, y - 6, 1, 1)
      g.fillRect(x - 6, y + 2, 1, 1)
    }
  }

  /** A dim panel over the garden for the cards, the bench and the continue offer. */
  private panel(g: CanvasRenderingContext2D) {
    g.fillStyle = rgba(INK, 0.82)
    g.fillRect(0, 0, W, H)
    hudPanel(g, 8, 10, W - 16, H - 20)
  }

  /** The house map: the title card when a house begins, then the climb so far after each wall. */
  private renderCard(g: CanvasRenderingContext2D, card: Card) {
    const house = houseAt(this.houseNow)
    if (!house) return
    this.panel(g)
    const info = HOUSE_CARDS[house.id]
    drawText(g, house.name.toUpperCase(), W / 2, 18, {
      scale: 2,
      align: 'center',
      color: RAMPS.gold[3],
      outline: INK,
    })
    let mapTop = 76
    if (card.kind === 'house' && info) {
      drawText(g, info.tagline, W / 2, 36, {
        align: 'center',
        color: RAMPS.teal[3],
        outline: INK,
      })
      drawText(g, `PESTS: ${info.pests}`, W / 2, 48, {
        align: 'center',
        color: '#ffffff',
        outline: INK,
      })
      drawText(g, `NEW SEED: ${info.seed}`, W / 2, 58, {
        align: 'center',
        color: RAMPS.pink[3],
        outline: INK,
      })
    } else {
      drawText(g, 'THE HOUSE MAP', W / 2, 38, {
        align: 'center',
        color: RAMPS.teal[3],
        outline: INK,
      })
      mapTop = 60
    }
    const map = houseMap(house, W, mapTop + 16, 254)
    const hint = this.kitLive && this.kit.hint
    const rich = new Set(hint ? richRoute(house) : [])
    const visited = new Set(this.path)
    const here = this.tour?.wall
    const at = (id: string) => map.nodes.find((n) => n.id === id)
    // Vents first, under the walls: the path taken lit, the rich route gold with a hint.
    for (const e of map.edges) {
      const a = at(e.from)
      const b = at(e.to)
      if (!a || !b) continue
      const taken =
        this.path.indexOf(e.to) === this.path.indexOf(e.from) + 1 &&
        visited.has(e.from)
      const colour = taken
        ? RAMPS.leaf[3]
        : hint && e.rich && rich.has(e.to)
          ? RAMPS.gold[3]
          : rgba(RAMPS.steel[3], 0.35)
      this.dottedLine(g, a.x, a.y, b.x, b.y, colour)
    }
    const top = map.nodes.filter(
      (n) => n.tier === Math.max(...map.nodes.map((m) => m.tier)),
    )
    for (const n of top)
      this.dottedLine(
        g,
        n.x,
        n.y,
        map.boss.x,
        map.boss.y,
        rgba(RAMPS.ember[3], 0.5),
      )
    const vault = VAULTS[house.id]
    for (const n of map.nodes) {
      const seen = visited.has(n.id)
      const now = n.id === here
      const pulse = now && Math.floor(this.tick / 10) % 2 === 0
      const ramp = now ? RAMPS.gold : seen ? RAMPS.leaf : RAMPS.steel
      bevel(g, n.x - 9, n.y - 6, 18, 12, ramp, { depth: 1 })
      if (pulse) glow(g, n.x, n.y, 16, RAMPS.gold[3], 0.4)
      if (seen || now)
        drawText(g, n.name.toUpperCase(), n.x, n.y + 8, {
          align: 'center',
          color: now ? RAMPS.gold[4] : RAMPS.leaf[4],
          outline: INK,
        })
      else drawText(g, '?', n.x + 1, n.y - 3, { align: 'center', color: INK })
      // The vault: shown with a hint, or once its golden seed is home.
      if (vault?.wall === n.id && (hint || this.golden.has(house.id))) {
        const home = this.golden.has(house.id)
        g.fillStyle = INK
        g.fillRect(n.x + 8, n.y - 10, 7, 7)
        g.fillStyle = home ? RAMPS.leaf[3] : RAMPS.gold[3]
        g.fillRect(n.x + 9, n.y - 9, 5, 5)
      }
    }
    // The boss waits at the top.
    const bx = map.boss.x
    const by = map.boss.y
    glow(g, bx, by, 18, RAMPS.ember[3], 0.35)
    bevel(g, bx - 12, by - 8, 24, 16, RAMPS.ember, { depth: 1 })
    g.fillStyle = INK
    g.fillRect(bx - 6, by - 3, 3, 3)
    g.fillRect(bx + 3, by - 3, 3, 3)
    g.fillRect(bx - 4, by + 3, 8, 1)
    drawText(g, BOSS_SPECS[bossOf(this.houseNow)!].name, bx, by - 18, {
      align: 'center',
      color: RAMPS.ember[4],
      outline: INK,
    })
    const next = here ? houseWall(house, here) : undefined
    drawText(
      g,
      card.kind === 'house'
        ? `FIRST WALL: ${next?.name.toUpperCase() ?? ''}`
        : `NEXT: ${next?.name.toUpperCase() ?? ''}`,
      W / 2,
      278,
      { align: 'center', color: '#ffffff', outline: INK },
    )
    drawText(
      g,
      `PETALS ${this.purse}   GOLDEN ${this.golden.size}/${GOLDEN_TOTAL}`,
      W / 2,
      290,
      { align: 'center', color: RAMPS.pink[3], outline: INK },
    )
    if (!this.demo && card.total - card.ticks > 20)
      drawText(g, 'A: GO', W / 2, 300, {
        align: 'center',
        color: RAMPS.teal[3],
        outline: INK,
      })
  }

  private dottedLine(
    g: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    colour: string,
  ) {
    const steps = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 4))
    g.fillStyle = colour
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      g.fillRect(
        Math.round(x0 + (x1 - x0) * t) - 1,
        Math.round(y0 + (y1 - y0) * t) - 1,
        2,
        2,
      )
    }
  }

  /** The Potting Bench: a shelf of pots, one per thing to buy, with Bumble minding the shop. */
  private renderBench(g: CanvasRenderingContext2D, bench: Bench) {
    this.panel(g)
    drawText(g, 'THE POTTING BENCH', W / 2, 18, {
      scale: 2,
      align: 'center',
      color: RAMPS.gold[3],
      outline: INK,
    })
    drawText(g, `PETALS ${this.purse}`, W / 2, 38, {
      align: 'center',
      color: RAMPS.pink[3],
      outline: INK,
    })
    // Bumble keeps the shop.
    const bee = {
      x: 214,
      y: 42 + Math.sin(this.tick / 12) * 3,
      angle: 0,
      tap: 0,
    }
    this.renderBumble(g, bee)
    const rows = [...BENCH_ITEMS, null]
    rows.forEach((item, i) => {
      const y = 56 + i * 32
      const on = bench.cursor === i
      if (on) {
        g.fillStyle = rgba(RAMPS.gold[3], 0.18)
        g.fillRect(16, y - 4, W - 32, 28)
        drawText(g, '>', 20, y + 6, { color: RAMPS.gold[3], outline: INK })
      }
      if (!item) {
        const next = houseAt(bench.house)
        drawText(g, `ON TO ${next?.name.toUpperCase() ?? ''}`, 60, y + 6, {
          color: on ? '#ffffff' : RAMPS.teal[3],
          outline: INK,
        })
        return
      }
      // A terracotta pot holding the item's sprout.
      bevel(g, 30, y + 6, 18, 12, RAMPS.rust, { depth: 1 })
      g.fillStyle = RAMPS.rust[3]
      g.fillRect(28, y + 4, 22, 3)
      const has = owned(this.kit, this.roomy, item.id)
      drawSprite(
        g,
        has ? FLOWER_SPRITES[FLOWER_COLORS[i]!]![2]! : SPROUT_SPRITE,
        39,
        y + 4,
        {
          anchor: 'feet',
          scale: has ? 1 : 2,
        },
      )
      const seedName =
        item.id === 'seed'
          ? ` ${this.kit.seed ?? STARTER_SEEDS[bench.seed]}`
          : ''
      drawText(g, `${item.name}${seedName}`, 60, y + 1, {
        color: has ? RAMPS.leaf[4] : '#ffffff',
        outline: INK,
      })
      drawText(g, has ? 'ON YOUR BENCH' : `${item.price} PETALS`, 60, y + 11, {
        color: has
          ? RAMPS.leaf[3]
          : this.purse >= item.price
            ? RAMPS.gold[3]
            : RAMPS.ember[3],
        outline: INK,
      })
      if (on && item.id === 'seed' && !has)
        drawText(g, '< >', W - 30, y + 6, {
          align: 'right',
          color: RAMPS.teal[3],
          outline: INK,
        })
    })
    const item = BENCH_ITEMS[bench.cursor]
    drawText(
      g,
      this.benchNote?.text ?? item?.line ?? 'A: LEAVE THE BENCH',
      W / 2,
      254,
      {
        align: 'center',
        color: this.benchNote ? RAMPS.gold[4] : RAMPS.teal[3],
        outline: INK,
      },
    )
    drawText(g, 'UP/DOWN PICK  A BUY  B LEAVE', W / 2, 270, {
      align: 'center',
      color: RAMPS.steel[3],
      outline: INK,
    })
    drawText(g, 'PETALS COME FROM PLAY, NEVER MONEY', W / 2, 284, {
      align: 'center',
      color: RAMPS.steel[2],
      outline: INK,
    })
  }

  private renderTourEnd(g: CanvasRenderingContext2D) {
    this.panel(g)
    const line = (text: string, y: number, color: string, scale = 1) =>
      drawText(g, text, W / 2, y, { align: 'center', color, outline: INK, scale })
    if (this.credits) {
      line(this.credits === 'true' ? 'THE GARDEN IS WHOLE!' : 'GRAND TOUR COMPLETE!', 76, RAMPS.gold[4], 2)
      line('FIVE GLASSHOUSES BLOOM AGAIN', 112, RAMPS.leaf[4])
      line(this.credits === 'true' ? 'THORN WAS ONLY LONELY.' : 'THE GLOOM HAS LIFTED.', 135, RAMPS.pink[3])
      if (this.credits === 'true') {
        line('A NEW FRIEND JOINS THE GARDEN', 150, RAMPS.teal[4])
        drawDuo(g, W / 2, 180, 36, this.tick)
      }
      line(`GOLDEN SEEDS ${this.golden.size}/${GOLDEN_TOTAL}`, 220, RAMPS.gold[3])
      line('A: RETURN TO TOUR MENU', 266, '#ffffff')
      return
    }
    line('THE GLASSHOUSE TOUR', 65, RAMPS.gold[4], 2)
    const labels = { tour: 'NEW GRAND TOUR', second: 'SECOND BLOOM - NEW GAME+', secret: 'MOONFLOWER CONSERVATORY' }
    this.tourChoices.forEach((choice, i) => line(
      (this.tourCursor === i ? '> ' : '') + labels[choice], 112 + i * 30,
      this.tourCursor === i ? '#ffffff' : RAMPS.teal[3],
    ))
    if (!hasAllGoldenSeeds([...this.golden])) line(`MOONFLOWER LOCKED: ${this.golden.size}/5 SEEDS`, 220, RAMPS.gold[3])
    line('UP / DOWN   A: START', 266, RAMPS.leaf[4])
  }

  private renderOffer(g: CanvasRenderingContext2D, s: BloomSave) {
    this.panel(g)
    const house = houseAt(s.house)
    drawText(g, 'WELCOME BACK!', W / 2, 90, {
      scale: 2,
      align: 'center',
      color: RAMPS.gold[3],
      outline: INK,
    })
    drawText(g, 'YOUR TOUR WAITS AT THE BENCH', W / 2, 120, {
      align: 'center',
      color: '#ffffff',
      outline: INK,
    })
    drawText(g, `BEFORE ${house?.name.toUpperCase() ?? ''}`, W / 2, 132, {
      align: 'center',
      color: RAMPS.teal[3],
      outline: INK,
    })
    drawText(
      g,
      s.continued ? 'A CONTINUE: SCORE STARTS AT 0' : `SCORE ${s.score}`,
      W / 2,
      150,
      { align: 'center', color: RAMPS.pink[3], outline: INK },
    )
    drawText(g, `GOLDEN SEEDS ${s.golden.length}/${GOLDEN_TOTAL}`, W / 2, 162, {
      align: 'center',
      color: RAMPS.gold[4],
      outline: INK,
    })
    drawText(g, 'A: CONTINUE', W / 2, 196, {
      align: 'center',
      color: RAMPS.leaf[4],
      outline: INK,
      scale: 2,
    })
    drawText(g, 'B: NEW TOUR (GOLDEN SEEDS STAY)', W / 2, 220, {
      align: 'center',
      color: RAMPS.steel[3],
      outline: INK,
    })
  }

  private renderGarden(g: CanvasRenderingContext2D) {
    const theme =
      this.houseNow === DOME
        ? CYCLE_THEMES
        : this.houseNow === POND
          ? CYCLE_THEMES + 1
          : this.houseNow === NIGHT
            ? 1
            : (this.level - 1) % CYCLE_THEMES
    cachedLayer(g, `brick-bloom-garden-${theme}`, W, H, (k) =>
      paintGarden(k, THEMES[theme]!),
    )
    // Fireflies drifting over the hedge.
    for (const f of FIREFLIES) {
      const t = (this.tick / 60) * f.speed + f.phase
      const x = Math.round(f.x + Math.sin(t) * 18)
      const y = Math.round(f.y + Math.cos(t * 1.3) * 10)
      const lit = 0.5 + 0.5 * Math.sin(t * 3)
      glow(g, x, y, 7, RAMPS.leaf[4], 0.35 * lit)
      g.fillStyle = lit > 0.4 ? RAMPS.gold[4] : RAMPS.leaf[3]
      g.fillRect(x, y, 1, 1)
    }
  }

  private renderWall(g: CanvasRenderingContext2D) {
    // Every crate casts a shadow onto the glass behind it.
    g.fillStyle = rgba(INK, 0.4)
    for (const b of this.bricks) {
      const r = this.brickRect(b)
      g.fillRect(Math.round(r.x) + 3, r.y + 4, CRATE_W, CRATE_H)
    }
    const lanterns = this.bricks.filter((b) => b.kind === 'lantern')
    for (const b of this.bricks) {
      g.save()
      if (this.houseNow === NIGHT && !this.boss?.defeated) {
        const r = this.brickRect(b)
        const nearBall = this.balls.some(
          (ball) => Math.hypot(ball.x - r.x - r.w / 2, ball.y - r.y) < 50,
        )
        const nearLantern = lanterns.some(
          (lamp) =>
            Math.abs(lamp.col - b.col) + Math.abs(lamp.row - b.row) <= 2,
        )
        const rowLit = (this.litRows.get(b.row) ?? 0) > this.tick
        if (!nearBall && !nearLantern && !rowLit && !b.flash && !b.vault)
          g.globalAlpha = 0.22
      }
      this.renderBrick(g, b)
      g.restore()
    }
  }

  private renderBrick(g: CanvasRenderingContext2D, b: Brick) {
    const r = this.brickRect(b)
    const x = Math.round(r.x) + 1
    const y = r.y + 1
    const sprite = b.flash
      ? FLASH_SPRITE
      : b.bolt
        ? BOLT_SPRITE
        : b.vault
          ? VAULT_CRATE
          : b.guard && this.boss?.id === 'mister-mulch'
            ? PLATE_CRATE
            : b.kind === 'sprout'
              ? SPROUT_CRATE
              : b.kind === 'hinge'
                ? HINGE_CRATE
                : b.kind === 'puffball'
                  ? PUFF_CRATE
                  : b.kind === 'root'
                    ? ROOT_CRATE
                    : b.kind === 'vine'
                      ? VINE_CRATE
                      : b.kind === 'trellis'
                        ? TRELLIS_CRATE
                        : (KIND_SPRITE[b.kind]?.(this.sandShut(b)) ??
                          CRATE_SPRITES[b.row]!)
    // An open hinge crate is a ghost the ball flies through.
    drawSprite(g, sprite, x - 1, y - 1, {
      anchor: 'topleft',
      alpha: b.open ? 0.3 : 1,
    })
    if (b.kind === 'hinge') {
      g.fillStyle = INK
      for (const px of [x, x + CRATE_W - 2]) g.fillRect(px, y + 2, 2, 4)
    }
    if (b.bolt || b.flash) return
    if (b.vault) {
      // A golden seed glints behind the vault's bars.
      const glint = Math.floor(this.tick / 12) % 4 === 0
      glow(g, x + CRATE_W / 2, y + CRATE_H / 2, 12, RAMPS.gold[3], 0.35)
      g.fillStyle = INK
      g.fillRect(x + CRATE_W / 2 - 3, y + 1, 6, 6)
      g.fillStyle = glint ? '#ffffff' : RAMPS.gold[4]
      g.fillRect(x + CRATE_W / 2 - 2, y + 2, 4, 4)
      g.fillStyle = RAMPS.gold[1]
      g.fillRect(x + CRATE_W / 2, y + 3, 1, 3)
    }
    if (b.kind === 'prickle') markPrickle(g, x, y, CRATE_W, CRATE_H)
    if (b.kind === 'sand') markSand(g, x, y, CRATE_W, this.tick, b.sand ?? 0)
    if (b.kind === 'lily') markLily(g, x, y, CRATE_W)
    if (b.kind === 'bubble') markBubble(g, x, y, CRATE_W)
    if (b.kind === 'lantern' || b.kind === 'glow') {
      const colour = b.kind === 'lantern' ? RAMPS.gold[4] : RAMPS.sky[4]
      glow(g, x + CRATE_W / 2, y + 4, 14, colour, 0.5)
      g.fillStyle = colour
      g.fillRect(x + CRATE_W / 2 - 3, y + 2, 6, 4)
    }
    if (b.guard && this.boss?.id === 'tangle-rose') {
      const sway = Math.floor(this.tick / 15) % 2
      g.fillStyle = RAMPS.leaf[3]
      g.fillRect(x + 2 + sway, y - 2, 2, 2)
      g.fillRect(x + CRATE_W - 5 - sway, y - 2, 2, 2)
    }
    if (b.kind === 'sprout')
      drawSprite(g, SPROUT_SPRITE, x + CRATE_W / 2, y + CRATE_H - 1, {
        anchor: 'feet',
      })
    if (b.kind === 'puffball') {
      const pulse = Math.floor(this.tick / 10) % 2
      g.fillStyle = RAMPS.pink[4]
      for (const [px, py] of [
        [x, y],
        [x + CRATE_W - 1, y],
        [x, y + CRATE_H - 1],
        [x + CRATE_W - 1, y + CRATE_H - 1],
      ] as const)
        g.fillRect(px - pulse, py - pulse, 1, 1)
    }
    // Cracks as it weakens, and gold studs for the hits it has left.
    const w = CRATE_W
    if (b.hp < b.maxHp) {
      g.fillStyle = INK
      g.fillRect(x + 3, y + 2, 3, 1)
      g.fillRect(x + 5, y + 3, 1, 2)
      g.fillRect(x + 6, y + 5, 2, 1)
      if (b.maxHp - b.hp >= 2) {
        g.fillRect(x + w - 6, y + 3, 2, 1)
        g.fillRect(x + w - 7, y + 4, 1, 2)
      }
    }
    if (b.maxHp > 1) {
      for (let i = 0; i < b.hp; i++) {
        const px = x + w - 4 - i * 3
        g.fillStyle = RAMPS.gold[0]
        g.fillRect(px + 1, y + 3, 2, 2)
        g.fillStyle = RAMPS.gold[3]
        g.fillRect(px, y + 2, 2, 2)
        g.fillStyle = RAMPS.gold[4]
        g.fillRect(px, y + 2, 1, 1)
      }
    }
  }

  private renderFlower(g: CanvasRenderingContext2D, f: Flower) {
    const frames = FLOWER_SPRITES[f.color]
    if (!frames) return
    const stage = f.life > 60 ? 0 : f.life > 50 ? 1 : 2
    const alpha = Math.min(1, f.life / 30)
    const x = f.x + Math.round(Math.sin((f.life + f.x) / 9))
    if (stage === 2) glow(g, x, f.y, 9, f.color, 0.3 * alpha)
    drawSprite(g, frames[stage]!, x, f.y, { alpha })
  }

  private renderPuff(g: CanvasRenderingContext2D, p: Puff) {
    const ramp = p.hp > 1 ? GLOOM : GLOOM_FRAYED
    const wob = Math.sin(this.tick / 8 + p.x * 0.1) * 0.6
    const lobes: [number, number, number][] = [
      [-4, 0, 5 + wob],
      [4, 0, 5 - wob],
      [0, -3, 6],
    ]
    // A gloomy shade around it, then lobes shaded from ink up toward the light.
    g.fillStyle = rgba(INK, 0.22)
    g.beginPath()
    g.ellipse(p.x, p.y, 15, 12, 0, 0, Math.PI * 2)
    g.fill()
    const passes: [string, number, number, number][] = [
      [INK, 0, 0, 1],
      [ramp[1], 0, 0, 0],
      [ramp[2], -0.8, -1, -1.2],
      [ramp[3], -1.8, -2.2, -3],
    ]
    for (const [colour, dx, dy, dr] of passes) {
      g.fillStyle = colour
      g.beginPath()
      for (const [lx, ly, lr] of lobes) {
        g.moveTo(p.x + lx + dx + lr + dr, p.y + ly + dy)
        g.arc(
          p.x + lx + dx,
          p.y + ly + dy,
          Math.max(1, lr + dr),
          0,
          Math.PI * 2,
        )
      }
      g.fill()
    }
    // A grumpy face: scowling brows, shiny eyes, a frown.
    const x = Math.round(p.x)
    const y = Math.round(p.y)
    g.fillStyle = INK
    g.fillRect(x - 5, y - 6, 2, 1)
    g.fillRect(x - 3, y - 5, 2, 1)
    g.fillRect(x + 1, y - 5, 2, 1)
    g.fillRect(x + 3, y - 6, 2, 1)
    g.fillRect(x - 4, y - 4, 3, 3)
    g.fillRect(x + 1, y - 4, 3, 3)
    g.fillRect(x - 2, y + 1, 4, 1)
    g.fillRect(x - 3, y + 2, 1, 1)
    g.fillRect(x + 2, y + 2, 1, 1)
    g.fillStyle = RAMPS.ember[3]
    g.fillRect(x - 3, y - 3, 1, 1)
    g.fillRect(x + 2, y - 3, 1, 1)
    g.fillStyle = '#ffffff'
    g.fillRect(x - 4, y - 4, 1, 1)
    g.fillRect(x + 1, y - 4, 1, 1)
  }

  private renderDrop(g: CanvasRenderingContext2D, d: Drop) {
    glow(g, d.x, d.y, 11, SEED_COLORS[d.kind], 0.4)
    const frame = Math.floor((this.tick + d.x) / 8) % 2
    drawSprite(g, CAPSULE_SPRITES[d.kind][frame]!, d.x, d.y)
    drawText(g, d.kind, d.x + 1, d.y - 3, { align: 'center', color: INK })
  }

  private renderPaddle(g: CanvasRenderingContext2D) {
    if (this.lost > 0 && Math.floor(this.tick / 6) % 2) return
    const w = this.paddleW
    const x = Math.round(this.paddleX - w / 2)
    dropShadow(g, this.paddleX, SOIL_TOP + 3, w / 2, 2.5, 0.4)
    // Hover jets under each bumper cap.
    const jet = 2 + (Math.floor(this.tick / 3) % 2)
    for (const jx of [x + 1, x + w - 3]) {
      glow(g, jx + 1, PADDLE_Y + PADDLE_H + 2, 6, RAMPS.ember[3], 0.45)
      g.fillStyle = RAMPS.ember[2]
      g.fillRect(jx, PADDLE_Y + PADDLE_H, 2, jet + 1)
      g.fillStyle = RAMPS.gold[4]
      g.fillRect(jx, PADDLE_Y + PADDLE_H, 2, jet - 1)
    }
    const set =
      w === WIDE_W
        ? PADDLE_SPRITES.wide
        : w === ROOMY_W
          ? PADDLE_SPRITES.roomy
          : PADDLE_SPRITES.normal
    const frames = this.sticky > 0 ? set.leaf : set.sky
    const blink = this.tick % 150 < 7 ? 1 : 0
    drawSprite(g, frames[blink], x - 1, PADDLE_Y - 1, { anchor: 'topleft' })
    if (this.sticky > 0)
      glow(g, this.paddleX, PADDLE_Y, w / 2, RAMPS.leaf[3], 0.2)
  }

  private renderBall(g: CanvasRenderingContext2D, ball: Ball) {
    const heat = ballHeat(Math.hypot(ball.vx, ball.vy))
    const colour =
      this.calm > 0
        ? SEED_COLORS.C
        : this.thorn > 0
          ? SEED_COLORS.T
          : HEAT_COLORS[heat]
    const trailColour = this.chain > 0 ? chainColor(this.chain) : RAMPS.pink[2]
    const trail = this.trails.get(ball)
    if (trail) {
      g.save()
      g.globalCompositeOperation = 'lighter'
      trail.forEach((p, i) => {
        const t = (i + 1) / (trail.length + 1)
        const s = 1 + Math.round(t * 2)
        g.globalAlpha = t * 0.7
        g.fillStyle = mix(trailColour, colour, t)
        g.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), s, s)
      })
      g.restore()
    }
    glow(g, ball.x, ball.y, 10 + heat * 2, colour, 0.5 + heat * 0.1)
    const frame = Math.floor(this.tick / 5) % 2
    drawSprite(g, BALL_SPRITES[frame]!, ball.x, ball.y)
  }

  /** The Bloom Bed: eight plots, each a sprout, a bud or a bloom; a bloom is the safety net. */
  private renderBed(g: CanvasRenderingContext2D) {
    for (let plot = 0; plot < PLOTS; plot++) {
      const cx = Math.round(plotCenter(plot))
      const level = this.bed[plot]!
      const colour = FLOWER_COLORS[plot % FLOWER_COLORS.length]!
      g.fillStyle = RAMPS.earth[1]
      g.fillRect(cx - 11, H - 5, 22, 5)
      g.fillStyle = RAMPS.earth[3]
      g.fillRect(cx - 11, H - 5, 22, 1)
      for (let pip = 0; pip < FULL_BLOOM; pip++) {
        g.fillStyle = pip < level ? RAMPS.gold[3] : RAMPS.earth[0]
        g.fillRect(cx - 6 + pip * 5, H - 3, 3, 2)
      }
      if (level === 0) continue
      if (level >= FULL_BLOOM) {
        const bob = Math.round(Math.sin((this.tick + plot * 9) / 14))
        glow(g, cx, BED_FEET - 12, 14, colour, 0.35)
        drawSprite(g, FLOWER_SPRITES[colour]![2]!, cx, BED_FEET - 5 + bob, {
          anchor: 'feet',
          scale: 2,
        })
      } else if (level === 2) {
        drawSprite(g, FLOWER_SPRITES[colour]![0]!, cx, BED_FEET - 5, {
          anchor: 'feet',
          scale: 2,
        })
      } else {
        drawSprite(g, SPROUT_SPRITE, cx, BED_FEET - 5, {
          anchor: 'feet',
          scale: 2,
        })
      }
    }
  }

  private renderPetal(g: CanvasRenderingContext2D, p: Petal) {
    const x = Math.round(p.x + Math.sin((p.y + p.x) / 12) * 3)
    glow(g, x, p.y, 7, p.color, 0.3)
    drawSprite(g, FLOWER_SPRITES[p.color]![0]!, x, p.y)
  }

  private renderBumble(g: CanvasRenderingContext2D, bee: Bumble) {
    const x = Math.round(bee.x)
    const y = Math.round(bee.y)
    const flap = Math.floor(this.tick / 2) % 2
    glow(g, x, y, 9, RAMPS.gold[3], 0.3)
    g.fillStyle = INK
    g.fillRect(x - 5, y - 3, 10, 7)
    g.fillStyle = RAMPS.gold[3]
    g.fillRect(x - 4, y - 2, 8, 5)
    g.fillStyle = INK
    g.fillRect(x - 1, y - 2, 1, 5)
    g.fillRect(x + 2, y - 2, 1, 5)
    g.fillStyle = '#ffffff'
    g.fillRect(x - 3, y - 6 + flap, 3, 2)
    g.fillRect(x + 1, y - 6 + flap, 3, 2)
    g.fillRect(x - 4, y - 1, 1, 1)
  }

  /** Queen's Compass: the ball's path two bounces ahead, dotted on the glass. */
  private renderCompass(g: CanvasRenderingContext2D) {
    const solids = this.bricks
      .filter((b) => !(b.kind === 'hinge' && b.open))
      .map((b) => this.brickRect(b))
    for (const ball of this.balls) {
      if (ball.stuck !== null) continue
      const path = predictPath(ball, solids)
      path.forEach((pt, i) => {
        g.globalAlpha = Math.max(0.15, 0.8 - i * 0.012)
        g.fillStyle = SEED_COLORS.Q
        g.fillRect(Math.round(pt.x), Math.round(pt.y), 2, 2)
      })
    }
    g.globalAlpha = 1
  }

  private renderHud(g: CanvasRenderingContext2D) {
    hudPanel(g, 3, 2, 78, 18)
    drawText(g, String(this.score).padStart(6, '0'), 8, 4, {
      scale: 2,
      color: RAMPS.gold[3],
      shadow: INK,
    })
    hudPanel(g, W - 66, 2, 63, 18)
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W - 7, 3, {
      align: 'right',
      color: RAMPS.pink[3],
      shadow: INK,
    })
    drawText(g, `STAGE ${this.level}`, W - 7, 11, {
      align: 'right',
      color: RAMPS.teal[3],
      shadow: INK,
    })
    // Spare paddles, then the seeds still working and how long each has left.
    const spares = Math.max(0, Math.min(this.lives - 1, 5))
    const powers: [Seed, number][] = []
    if (this.wide > 0) powers.push(['W', this.wide])
    if (this.sticky > 0) powers.push(['S', this.sticky])
    if (this.calm > 0) powers.push(['C', this.calm])
    if (spares || powers.length) {
      hudPanel(g, 86, 2, 100, 18)
      for (let i = 0; i < spares; i++)
        drawSprite(g, LIFE_SPRITE, 91 + i * 13, 4, { anchor: 'topleft' })
      powers.forEach(([kind, left], i) => {
        const px = 91 + i * 31
        drawText(g, kind, px, 12, {
          color: SEED_RAMPS[kind][3],
          outline: INK,
        })
        gauge(g, px + 8, 14, 18, 3, left / POWER_TICKS, SEED_RAMPS[kind])
      })
    }
    const extra: [Seed, number, number][] = []
    if (this.rain > 0) extra.push(['R', this.rain, RAIN_TICKS])
    if (this.thorn > 0) extra.push(['T', this.thorn, THORN_TICKS])
    if (this.compass > 0) extra.push(['Q', this.compass, COMPASS_TICKS])
    if (this.vent) extra.push(['V', this.vent.ticks, VENT_TICKS])
    if (this.duo > 0) extra.push(['D', this.duo, POWER_TICKS])
    if (extra.length) {
      hudPanel(g, 86, 22, 100, 14)
      // Up to three get long gauges; four or five share the panel.
      const step = extra.length > 3 ? 20 : 31
      extra.forEach(([kind, left, max], i) => {
        const px = 91 + i * step
        drawText(g, kind, px, 26, {
          color: SEED_RAMPS[kind][3],
          outline: INK,
        })
        gauge(g, px + 7, 28, step - 13, 3, left / max, SEED_RAMPS[kind])
      })
    }
    if (this.chain >= 2)
      drawText(g, `POLLEN x${Math.min(8, this.chain)}`, 6, 24, {
        color: chainColor(this.chain),
        outline: INK,
      })
    if (this.bumble)
      drawText(g, `RUSH ${rushBonus(this.rushTicks)}`, W - 7, 24, {
        align: 'right',
        color: RAMPS.gold[3],
        outline: INK,
      })
    else if (this.boss) {
      const boss = this.boss
      drawText(g, BOSS_TAGS[boss.id], W - 7, 23, {
        align: 'right',
        color: RAMPS.ember[3],
        outline: INK,
      })
      gauge(g, W - 62, 32, 54, 4, bossHealth(boss), RAMPS.ember)
      if (this.chime)
        drawText(g, 'x2', W - 11 - BOSS_TAGS[boss.id].length * 6, 23, {
          align: 'right',
          color: RAMPS.teal[3],
          outline: INK,
        })
    } else if (this.chime)
      drawText(g, 'CHIME x2', W - 7, 24, {
        align: 'right',
        color: RAMPS.teal[3],
        outline: INK,
      })
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, 200, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.purple[1],
      })
      if (this.banner.sub)
        drawText(g, this.banner.sub, W / 2, 220, {
          align: 'center',
          color: RAMPS.gold[3],
          outline: INK,
        })
    }
  }
}

const brickBloom: ArcadeGameModule = {
  create: (options) => new BrickBloom(options),
}

export const create = brickBloom.create
export default brickBloom
