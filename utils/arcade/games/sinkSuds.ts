// /utils/arcade/games/sinkSuds.ts
//
// Sink Suds -- the Kind Robots Arcade's riff on the 1982 sink-bubble game
// (conductor kr-arcade/t-009; depth pass t-043.., spec: conductor
// projects/kr-arcade/depth-pass/CABINETS.md section 3, "The Big House Wash").
// You are a soap bubble washing a robot house, room by room
// (utils/arcade/sinkSuds/rooms.ts). Every basin has its own shape and water
// (basins.ts) and starts under a film of grime that comes clean wherever you
// roll. Crumbs, grease and grime feed you; your size is your health (a hit
// shrinks you), your weapon (big bubbles eat mites and tip brushes), your
// ammunition (B blows a soap shot that traps a pest, at the cost of a stage)
// and the drain key (full size opens it). A gives a puff of speed. Power-ups
// float up out of the drain, soap bars buy upgrades in the Soap Shop between
// rooms, and each Wash Cycle ends on a boss. Progress saves at each room.

import { levelCurve } from '../curve'
import { drawText } from '../font'
import {
  INK,
  RAMPS,
  Sparkles,
  backdropRng,
  dropShadow,
  drawSprite,
  gauge,
  hudPanel,
  shadedOrb,
  vignette,
} from '../snes'
import type { MusicLoop } from '../sound'
import { emptyInput } from '../types'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  ArcadeGuidePage,
  InputFrame,
} from '../types'
import {
  BASINS,
  BASIN_PLAYLIST,
  H,
  W,
  basinBounds,
  carry,
  clearPath,
  dialAt,
  flowAt,
  insideBasin,
  keepInside,
} from '../sinkSuds/basins'
import type { BasinDef, BasinId, Point } from '../sinkSuds/basins'
import { Grime, SQUEAKY } from '../sinkSuds/grime'
import {
  BRUSH_TURN,
  GREMLIN_OUT,
  GURGLE_TICKS,
  PESTS,
  TIP_TICKS,
  TRAIL_DRAG,
  TRAIL_TICKS,
  TRAP_POINTS,
  ALGAE_BLOOM,
  LINT_MAX,
  PUFF_TELL,
  PUFF_UP,
  SOCK_GAP,
  SOCK_SEGS,
  STRIDER_SPEED,
  STRIDER_TELL,
  WAX_SET,
} from '../sinkSuds/pests'
import type { PestKind, Touch } from '../sinkSuds/pests'
import {
  BOSS_ARENAS,
  CYCLES,
  DUCK_PEN,
  GOLDEN_ROOMS,
  PLATE_SPOTS,
  ROOMS,
  ROUNDUP_DUCKS,
  campaignSteps,
  isRoomStart,
  isSecretStep,
} from '../sinkSuds/rooms'
import type {
  Backdrop,
  BasinPlan,
  BossId,
  Box,
  EndingKind,
  RoomDef,
  Step,
} from '../sinkSuds/rooms'
import {
  BARS,
  BOMB_REACH,
  FLOAT_EVERY,
  FLOAT_LIFE,
  POWERS,
  POWER_KINDS,
  PUFF,
  SHOP_ITEMS,
  SKIN_TINTS,
  SOAP_SHARE,
  SQUEEGEE_BAND,
} from '../sinkSuds/shop'
import type { PowerKind, ShopItem, SkinId } from '../sinkSuds/shop'
import { MUSIC } from '../sinkSuds/music'
import {
  BUMP_POINTS,
  Bristleton,
  DEFEAT_POINTS,
  RING_GAP,
} from '../sinkSuds/bristleton'
import { Mossback } from '../sinkSuds/mossback'
import { GIANT_R, GrimeKing } from '../sinkSuds/grimeking'
import type { BossHost, SudsBoss } from '../sinkSuds/boss'
import {
  ENDLESS_ROSTER,
  MEDAL,
  MEDAL_NAMES,
  SEAT_COLOURS,
  SUMO,
  SUMO_STARTS,
  medalCount,
  medalKey,
  medalsFor,
  modesFor,
} from '../sinkSuds/modes'
import type { ModeDef, ModeId } from '../sinkSuds/modes'
import { renderBoard, renderMenu, renderResult } from '../sinkSuds/modeArt'
import {
  BRUSH_SPRITE,
  BRUSH_TIPPED,
  CEREAL_SPRITE,
  CRUMB_SPRITE,
  DRIP_SPRITE,
  GREMLIN_SPRITES,
  GrimeLayer,
  MITE_SPRITES,
  SPONGE_SPRITES,
  clipBasin,
  renderBasin,
  renderBubble,
  renderDial,
  renderDizzy,
  renderDrain,
  renderFaucet,
  renderKitchen,
  renderShot,
  renderTrap,
} from '../sinkSuds/art'
import {
  LOOFAH_SPRITE,
  MINIBRUSH_SPRITE,
  SLUG_SPRITES,
  renderBathroom,
  renderDuck,
  renderFloat,
  renderGuard,
  renderIcon,
  renderPlate,
  renderRack,
  renderShop,
  renderSlick,
  renderTrail,
} from '../sinkSuds/roomArt'
import {
  renderAlgae,
  renderAquarium,
  renderCar,
  renderCarWash,
  renderCleanEnding,
  renderCredits,
  renderDrop,
  renderGarden,
  renderJet,
  renderLaundry,
  renderLeaf,
  renderLeafBoat,
  renderLint,
  renderMinion,
  renderPalace,
  renderPlaza,
  renderPuffer,
  renderRain,
  renderRoller,
  renderSnail,
  renderSock,
  renderSockSnake,
  renderSpinner,
  renderSplash,
  renderStrider,
  renderStriderLine,
  renderTrueEnding,
  renderWax,
} from '../sinkSuds/sceneArt'

export { BASINS, BASIN_PLAYLIST, PESTS, ROOMS, SHOP_ITEMS, TRAP_POINTS }
export type { PestKind }

const ACCEL = 0.09
const MAX_SPEED = 2.3
const START_LIVES = 3
const EXTRA_LIFE_EVERY = 25_000
export const MAX_STAGE = 5
export const STAGE_RADIUS = [0, 7, 9.5, 12, 14.5, 17] as const
export const GROWTH_PER_STAGE = 12
/** Grime cells the bubble scrubs for one point of growth. */
export const SCRUB_PER_GROWTH = 60
/** A soap shot needs this stage, and leaves the bubble one smaller (never below stage 2). */
export const SHOT_STAGE = 3
const SHOT_SPEED = 3.2
const SHOT_LIFE = 110
const SHOT_R = 5
/** Eat or trap within this many ticks of the last for the next chain step (x2, x3, x4). */
export const CHAIN_TICKS = 60
export const MAX_CHAIN = 4
/** Points for a Squeaky Clean basin, on top of 20 a percent. */
export const SQUEAKY_BONUS = 5_000
/** Points for finishing a special basin's objective. */
export const SPECIAL_BONUS = 3_000
const HUNT_RANGE = 120
/** Growth for swallowing a pest. */
const EAT_GROWTH = 3
/** Fewer crumbs than this and the tap drips faster. */
const HUNGRY_MESS = 8
/** A slick: faster top speed, slipperier water, a stronger push. */
const SLICK = { cap: 1.45, friction: 0.985, accel: 1.3 }
const PLATE_R = 20
const DUCK_R = 11
/** The Soap Shop closes itself after this long. */
const SHOP_CLOSE = 60 * 45

export const SUDS_CURVES = {
  messStart: { start: 24, step: 3, limit: 54 },
  mites: { start: 2, step: 0.6, limit: 10 },
  miteSpeed: { start: 0.55, step: 0.05, limit: 1.35 },
  brushes: { start: 0, step: 0.5, limit: 4 },
  brushSpeed: { start: 0.45, step: 0.04, limit: 1.05 },
  sponges: { start: 0, step: 0.35, limit: 3 },
  spongeSpeed: { start: 0.3, step: 0.02, limit: 0.6 },
  gremlins: { start: 0, step: 0.5, limit: 1 },
  gremlinRest: { start: 600, step: -25, limit: 240 },
  gremlinSpeed: { start: 1.3, step: 0.06, limit: 2.2 },
  slugSpeed: { start: 0.3, step: 0.02, limit: 0.6 },
  dripEvery: { start: 150, step: -8, limit: 40 },
  /** Scrub passes a grime cell needs: one, then thicker grime from sink 11. */
  dirt: { start: 1, step: 0.1, limit: 3 },
} as const

type Mess = { x: number; y: number; kind: 'crumb' | 'grease'; r: number }
type PestState =
  | 'roam'
  | 'tipped'
  | 'hidden'
  | 'gurgle'
  | 'out'
  | 'home'
  | 'tell'
  | 'puffed'
  | 'set'
  | 'wait'
export type Pest = {
  kind: PestKind
  x: number
  y: number
  vx: number
  vy: number
  heading: number
  /** Ticks to the next change of mind. */
  turn: number
  /** The state's timer (tipped, hidden, gurgling, out). */
  t: number
  state: PestState
  /** 0 while free; once trapped, the chain it was caught on. */
  trap: number
  target: Point | null
  /** A lint ball's radius; an algae puff's swell (ticks). */
  size: number
  /** A sock snake's socks, head first; a strider's run (from, to). */
  segs: Point[]
}
export type Bubble = {
  seat: number
  x: number
  y: number
  vx: number
  vy: number
  wobble: number
  stage: number
  growth: number
  /** Grime cells scrubbed toward the next point of growth. */
  scrub: number
  puff: number
  invuln: number
  hurt: number
  alive: boolean
  respawn: number
  /** The way it faces (and shoots). */
  faceX: number
  faceY: number
  /** A timed power-up it carries (the duck or the magnet). */
  power: { kind: PowerKind; ticks: number } | null
  /** Super Suds: ticks left at full size, and the stage to go back to. */
  superTicks: number
  superFrom: number
  /** Stuck in slug trail this tick. */
  sticky: boolean
  /** The finale's giant bubble. */
  giant: boolean
  /** Bubble Buddies: the seat of the bubble this one has merged into, or null. */
  host: number | null
  /** Seats merged into this one. */
  members: number[]
  /** Ticks before it can merge again after a split. */
  mergeCool: number
  /** Suds Sumo: round points, and whether it is out of this round. */
  points: number
  out: boolean
}
type Shot = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  seat: number
}
type Drip = { x: number; y: number; vy: number; landY: number }
type Pop = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = {
  x: number
  y: number
  text: string
  life: number
  color?: string
}
export type Plate = {
  x: number
  y: number
  vx: number
  vy: number
  dirt: number
}
export type Duck = {
  x: number
  y: number
  vx: number
  vy: number
  /** A bumper bobs round its home; a Round-up duck has none. */
  home: Point | null
  penned: boolean
}
type Blob = { x: number; y: number; life: number }
export type Float = {
  kind: PowerKind | 'soap'
  x: number
  y: number
  vx: number
  vy: number
  life: number
}
type ShopState = { cursor: number; t: number; message: string }
export type Leaf = {
  x: number
  y: number
  vx: number
  vy: number
  a: number
  tone: number
}
export type LooseSock = {
  x: number
  y: number
  vx: number
  vy: number
  colour: number
  a: number
}
export type Car = { x: number; y: number; panels: number[]; cars: number }
type Roller = { lane: number; tell: number; x: number | null; timer: number }
type Splash = { x: number; y: number; life: number }

/** Full Detail's robot car: its size and how fast the belt carries it. */
export const CAR = { w: 120, h: 54, speed: 0.22 }
/** Odd Socks: the pairs, and how long until the spin cycle shuffles them. */
export const SOCK_PAIRS = 4
export const SPIN_CYCLE = 60 * 40
/** Rain Race: how long the shower lasts, how long more if it wins, and the clean it must beat. */
export const RAIN_RACE = { shower: 60 * 40, more: 60 * 15, goal: 70 }
/** Wax jets puff on this beat. */
export const JET_BEAT = 120
/** Deep Clean: what each lap adds. */
export const DEEP = { dirt: 1, heat: 3, mess: 6 }
/** Credits run this long before A skips. */
const CREDITS_TICKS = 60 * 30

/** A Sink Suds save: where the wash got to, and what the bubble has bought. */
export type SudsSave = {
  v: 1
  /** Campaign step to resume at (a room's first basin, or a boss). */
  step: number
  score: number
  lives: number
  bars: number
  puff: boolean
  stage2: boolean
  shield: number
  skins: SkinId[]
  skin: SkinId
  golden: string[]
  /** The house has been washed once: Deep Clean is open. */
  cleared?: boolean
  /** Deep Clean laps begun. */
  deep?: number
  /** Medals per basin, keyed `room:basin` (MEDAL bits). */
  medals?: Record<string, number>
  /** Best Squeaky Clean times per basin, in ticks. */
  times?: Record<string, number>
  /** Rooms the campaign has reached (Squeaky Clean picks from these). */
  reached?: number
}

const SKINS: readonly SkinId[] = ['plain', 'rainbow', 'starry', 'frosted']

/** A stored save, checked against this build; null when unusable. */
export function readSudsSave(raw: unknown): SudsSave | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const count = (v: unknown, max: number) =>
    typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= max
  if (r.v !== 1) return null
  const steps = campaignSteps()
  if (!count(r.step, steps.length - 1)) return null
  const step = steps[r.step as number]
  if (!isRoomStart(step) && step?.kind !== 'boss') return null
  if (
    !count(r.score, 249_999_999) ||
    !count(r.lives, 99) ||
    !count(r.bars, 9_999)
  )
    return null
  const roomIds = new Set(GOLDEN_ROOMS)
  const skins = Array.isArray(r.skins)
    ? r.skins.filter((s): s is SkinId => SKINS.includes(s as SkinId))
    : []
  const skin = SKINS.includes(r.skin as SkinId) ? (r.skin as SkinId) : 'plain'
  return {
    v: 1,
    step: r.step as number,
    score: r.score as number,
    lives: Math.max(1, r.lives as number),
    bars: r.bars as number,
    puff: r.puff === true,
    stage2: r.stage2 === true,
    shield: count(r.shield, 1) ? (r.shield as number) : 0,
    skins: [...new Set(skins)],
    skin: skin === 'plain' || skins.includes(skin) ? skin : 'plain',
    golden: Array.isArray(r.golden)
      ? [
          ...new Set(
            r.golden.filter(
              (g): g is string => typeof g === 'string' && roomIds.has(g),
            ),
          ),
        ]
      : [],
    cleared: r.cleared === true,
    deep: count(r.deep, 99) ? (r.deep as number) : 0,
    medals: readTable(r.medals, 7),
    times: readTable(r.times, 60 * 60 * 60),
    reached: count(r.reached, GOLDEN_ROOMS.length)
      ? Math.max(1, r.reached as number)
      : 1,
  }
}

/** A small table of whole numbers keyed `room:basin` from a save, keeping only what makes sense. */
function readTable(raw: unknown, max: number): Record<string, number> {
  const out: Record<string, number> = {}
  if (!raw || typeof raw !== 'object') return out
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const [room = '', basin = ''] = k.split(':')
    if (!GOLDEN_ROOMS.includes(room) || !/^[1-4]$/.test(basin)) continue
    if (typeof v === 'number' && Number.isInteger(v) && v > 0 && v <= max)
      out[k] = v
  }
  return out
}

function dist(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function angleTo(from: number, to: number, step: number) {
  let d = to - from
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return from + Math.max(-step, Math.min(step, d))
}

function inBox(p: Point, box: Box) {
  return (
    p.x >= box.x && p.x <= box.x + box.w && p.y >= box.y && p.y <= box.y + box.h
  )
}

/** The basin the endless sink plays at this level. */
export function basinForLevel(level: number): BasinDef {
  return BASINS[BASIN_PLAYLIST[(level - 1) % BASIN_PLAYLIST.length]!]
}

/** The endless sink's plan for a level: every shape in turn, the pests rising on curves. */
/** Every shape the Endless Sink plays, in turn. */
export const ENDLESS_PLAYLIST: readonly BasinId[] = [
  'oval',
  'double',
  'tub',
  'drum',
  'tank',
  'birdbath',
  'conveyor',
  'palace',
]

/**
 * The Endless Sink: every shape in turn and, level by level, every pest. Each pest joins at its
 * level (ENDLESS_ROSTER) and a second of each comes along eight levels later.
 */
export function endlessSinkPlan(level: number): BasinPlan {
  const pests: Partial<Record<PestKind, number>> = {}
  for (const { kind, from } of ENDLESS_ROSTER) {
    if (level < from) continue
    pests[kind] = 1 + Math.floor((level - from) / 8) + (kind === 'mite' ? 2 : 0)
  }
  const basin = ENDLESS_PLAYLIST[(level - 1) % ENDLESS_PLAYLIST.length]!
  return {
    title: `SINK ${level}`,
    basin,
    pests,
    mess: Math.min(60, 26 + level * 2),
    drip: Math.max(50, 140 - level * 5),
    heat: level,
    dirt: 1 + Math.floor(level / 10),
    rain: basin === 'birdbath' ? 60 : undefined,
    leaves: basin === 'birdbath' ? 3 : undefined,
    par: 100,
  }
}

/** Classic Sink: the original single kitchen sink, mites and brushes on today's curves. */
export function classicPlan(level: number): BasinPlan {
  const n = (spec: { start: number; step: number; limit: number }) =>
    Math.max(0, Math.floor(levelCurve(level, spec)))
  return {
    title: `SINK ${level}`,
    basin: 'oval',
    pests: { mite: n(SUDS_CURVES.mites), brush: n(SUDS_CURVES.brushes) },
    mess: n(SUDS_CURVES.messStart),
    drip: Math.round(levelCurve(level, SUDS_CURVES.dripEvery)),
    heat: level,
    dirt: 1,
    par: 90,
  }
}

export function endlessPlan(level: number): BasinPlan {
  const n = (spec: { start: number; step: number; limit: number }) =>
    Math.max(0, Math.floor(levelCurve(level, spec)))
  return {
    title: `SINK ${level}`,
    basin: BASIN_PLAYLIST[(level - 1) % BASIN_PLAYLIST.length]! as BasinId,
    pests: {
      mite: n(SUDS_CURVES.mites),
      brush: n(SUDS_CURVES.brushes),
      sponge: n(SUDS_CURVES.sponges),
      gremlin: n(SUDS_CURVES.gremlins),
    },
    mess: n(SUDS_CURVES.messStart),
    drip: Math.round(levelCurve(level, SUDS_CURVES.dripEvery)),
    heat: level,
    dirt: n(SUDS_CURVES.dirt),
    par: 90,
  }
}

/** Is (x, y) inside the first basin (kept for the older tests and tools)? */
export function insideSink(x: number, y: number, margin = 0): boolean {
  return insideBasin(BASINS.oval, x, y, margin)
}

function newBubble(seat: number, at: Point): Bubble {
  return {
    seat,
    x: at.x,
    y: at.y,
    vx: 0,
    vy: 0,
    wobble: 0,
    stage: 1,
    growth: 0,
    scrub: 0,
    puff: 0,
    invuln: 90,
    hurt: 0,
    alive: true,
    respawn: 0,
    faceX: 0,
    faceY: -1,
    power: null,
    superTicks: 0,
    superFrom: 1,
    sticky: false,
    giant: false,
    host: null,
    members: [],
    mergeCool: 0,
    points: 0,
    out: false,
  }
}

/** A boss fight's basin plan, from its arena. */
function bossPlan(id: BossId): BasinPlan {
  const a = BOSS_ARENAS[id]
  return {
    title: a.name,
    basin: a.basin,
    pests: {},
    mess: a.mess,
    drip: a.drip,
    heat: a.heat,
    par: 180,
  }
}

function newBoss(id: BossId): SudsBoss {
  if (id === 'mossback') return new Mossback()
  if (id === 'grimeking') return new GrimeKing()
  return new Bristleton()
}

/** The credits, rolled after an ending. */
export const CREDITS: readonly string[] = [
  '- SINK SUDS -',
  'THE BIG HOUSE WASH',
  '',
  '- THE ROOMS -',
  ...ROOMS.filter((r) => !r.secret).map((r) => r.name),
  '',
  '- THE BOSSES -',
  'BRISTLETON, THE BIG BRUSH',
  'MOSSBACK, THE OLD GIANT SNAIL',
  'THE GRIME KING',
  '',
  '- STARRING -',
  'ONE BRAVE BUBBLE',
  'AND EVERY ROBOT IN THE HOUSE',
  '',
  '- A KIND ROBOTS ARCADE CABINET -',
  '',
  'THANK YOU FOR WASHING!',
]

class SinkSuds implements ArcadeGameInstance {
  score = 0
  level = 0
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private steps: Step[] = campaignSteps()
  private stepIndex = 0
  private inEndless = false
  private room: RoomDef | null = null
  private plan: BasinPlan = endlessPlan(1)
  private backdrop: Backdrop = 'kitchen'
  private basin: BasinDef = BASINS.oval
  private grime: Grime = new Grime(BASINS.oval)
  /** The drum's speed now (eased toward its dial) and how far it has turned. */
  private spin = 0
  private drumAngle = 0
  private bubbles: Bubble[] = [newBubble(0, BASINS.oval.start)]
  private mess: Mess[] = []
  private pests: Pest[] = []
  private shots: Shot[] = []
  private drips: Drip[] = []
  private pops: Pop[] = []
  private floaters: Floater[] = []
  private plates: Plate[] = []
  private ducks: Duck[] = []
  private trail: Blob[] = []
  private floats: Float[] = []
  private floatTimer = FLOAT_EVERY
  private specialDone = false
  private basinTicks = 0
  private boss: SudsBoss | null = null
  private bossId: BossId | null = null
  /** Players seated (1-4) and the mode they chose. */
  private seats = 1
  private mode: ModeId = 'campaign'
  /** The mode menu before a real game starts; `board` shows the medal board instead. */
  private menu: { mode: number; pick: number; board: boolean } | null = null
  /** A finished Squeaky Clean or Suds Sumo, showing its result before the game ends. */
  private result: {
    title: string
    lines: { text: string; colour?: string }[]
    t: number
  } | null = null
  private medals: Record<string, number> = {}
  private times: Record<string, number> = {}
  private reached = 1
  /** Bubbles lost in this basin (No Pop). */
  private basinPops = 0
  /** The step the save resumes at (the latest room start or boss). */
  private resumeStep = 0
  /** The Squeaky Clean basin, keyed `room:basin`. */
  private squeakyKey = ''
  private sumo: {
    round: number
    wins: number[]
    t: number
    pause: number
  } | null = null
  /** The credits after an ending. */
  private ending: { kind: EndingKind; t: number } | null = null
  /** Deep Clean laps begun, and whether the house has been washed once. */
  private deep = 0
  private cleared = false
  private leaves: Leaf[] = []
  private socks: LooseSock[] = []
  private car: Car | null = null
  private roller: Roller | null = null
  private splashes: Splash[] = []
  private rainTimer = 0
  /** Odd Socks: ticks to the spin cycle; Rain Race: ticks of shower left. */
  private specialTimer = 0
  private strideTimer = 0
  private bossDone = 0
  private shop: ShopState | null = null
  private offer: SudsSave | null = null
  private saveData: SudsSave | null = null
  /** Pests flee the bubble while this runs (Lemon Zest). */
  private flee = 0
  private shield = 0
  private bars = 0
  private upgrades = { puff: false, stage2: false }
  private skins = new Set<SkinId>()
  private skin: SkinId = 'plain'
  private golden = new Set<string>()
  private dripTimer = 0
  private chain = 0
  private chainTimer = 0
  private draining = 0
  private overTimer = 0
  private nextExtra = EXTRA_LIFE_EVERY
  private shotHint = false
  private banner: { text: string; sub?: string; ticks: number } | null = null
  private pilotGoal: Point | null = null
  private pilotRetarget = 0
  // Cosmetic sparkles roll their own dice, so the game's seeded rng is untouched.
  private fx = new Sparkles()
  private fxRng = backdropRng(29)
  private grimeLayer = new GrimeLayer()

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.seats = Math.max(1, Math.min(4, options.players ?? 1))
    if (this.demo) this.seats = 1
    this.bubbles = Array.from({ length: this.seats }, (_, i) =>
      newBubble(i, BASINS.oval.start),
    )
    this.lives = START_LIVES * this.seats
    const stored = this.demo ? null : readSudsSave(options.resume)
    if (stored) {
      this.medals = { ...stored.medals }
      this.times = { ...stored.times }
      this.reached = stored.reached ?? 1
      this.golden = new Set(stored.golden)
      this.skins = new Set(stored.skins)
      this.skin = stored.skin
      this.cleared = stored.cleared === true
    }
    this.beginStep(0)
    if (stored && stored.step > 0) {
      this.offer = stored
      this.saveData = stored
    } else if (!this.demo) {
      this.openMenu()
    }
  }

  // --- modes -------------------------------------------------------------------

  private openMenu() {
    this.menu = { mode: 0, pick: 0, board: false }
  }

  private modes(): ModeDef[] {
    return modesFor(this.seats)
  }

  /** Squeaky Clean's basins: every basin of the rooms the campaign has reached. */
  private squeakyPicks() {
    const picks: Array<{ room: number; basin: number }> = []
    const rooms = ROOMS.filter((r) => !r.secret).slice(
      0,
      Math.max(1, this.reached),
    )
    for (const r of rooms)
      for (let basin = 0; basin < 4; basin++)
        picks.push({ room: ROOMS.indexOf(r), basin })
    return picks
  }

  private updateMenu(input: InputFrame) {
    const m = this.menu!
    if (input.pressed.b) {
      m.board = !m.board
      this.sound.play('blip')
      return
    }
    if (m.board) {
      if (input.pressed.a || input.pressed.start) m.board = false
      return
    }
    const n = this.modes().length
    if (input.pressed.up) m.mode = (m.mode + n - 1) % n
    if (input.pressed.down) m.mode = (m.mode + 1) % n
    const picks = this.squeakyPicks().length
    if (input.pressed.left) m.pick = (m.pick + picks - 1) % picks
    if (input.pressed.right) m.pick = (m.pick + 1) % picks
    if (
      input.pressed.up ||
      input.pressed.down ||
      input.pressed.left ||
      input.pressed.right
    )
      this.sound.play('blip')
    if (input.pressed.a || input.pressed.start) this.startMode()
  }

  private startMode() {
    const m = this.menu!
    this.menu = null
    this.mode = this.modes()[m.mode]!.id
    this.sound.play('level')
    switch (this.mode) {
      case 'campaign':
        if (this.seats > 1)
          this.banner = {
            text: 'BUBBLE BUDDIES',
            sub: 'TOUCH TO MERGE, B TO SPLIT',
            ticks: 150,
          }
        return
      case 'squeaky': {
        const pick = this.squeakyPicks()[m.pick] ?? { room: 0, basin: 0 }
        const room = ROOMS[pick.room]!
        const plan = room.basins[pick.basin]!
        this.level = 1
        this.room = room
        this.squeakyKey = medalKey(room.id, pick.basin)
        // A time attack on the grime: no special objective, just the clock.
        this.startBasin(
          { ...plan, special: undefined, goal: undefined },
          room.backdrop,
        )
        this.banner = {
          text: 'SQUEAKY CLEAN',
          sub: `${plan.title}: 95% CLEAN, FAST`,
          ticks: 120,
        }
        return
      }
      case 'sumo':
        this.startSumoRound(1)
        return
      default:
        this.level = 0
        this.startLevel(1)
    }
  }

  /** Suds Sumo: every bubble in the oval sink at once; the drain swallows whoever is shoved in. */
  private startSumoRound(round: number) {
    if (!this.sumo)
      this.sumo = { round, wins: this.bubbles.map(() => 0), t: 0, pause: 0 }
    this.sumo.round = round
    this.sumo.t = 0
    this.sumo.pause = 0
    this.level = round
    this.room = null
    this.startBasin(
      {
        title: 'SUDS SUMO',
        basin: 'oval',
        pests: { mite: 3 },
        mess: SUMO.mess,
        drip: SUMO.drip,
        heat: 3,
        par: 90,
      },
      'kitchen',
    )
    this.bubbles.forEach((b, i) => {
      const at = SUMO_STARTS[i % SUMO_STARTS.length]!
      Object.assign(b, {
        x: at.x,
        y: at.y,
        stage: 2,
        alive: true,
        out: false,
        host: null,
        members: [],
        invuln: 90,
      })
    })
    this.lives = this.seats
    this.banner = {
      text: `ROUND ${round}`,
      sub: 'SHOVE THEM DOWN THE DRAIN',
      ticks: 120,
    }
  }

  private updateSumo() {
    const sumo = this.sumo!
    sumo.t++
    // Bigger bubbles shove smaller ones about: the push goes by size.
    const live = this.bubbles.filter((b) => b.alive && !b.out)
    for (let i = 0; i < live.length; i++)
      for (let j = i + 1; j < live.length; j++) {
        const a = live[i]!
        const c = live[j]!
        const ra = this.radiusOf(a)
        const rc = this.radiusOf(c)
        const d = dist(a, c) || 1
        if (d >= ra + rc) continue
        const nx = (c.x - a.x) / d
        const ny = (c.y - a.y) / d
        const ma = ra * ra
        const mc = rc * rc
        const overlap = ra + rc - d
        a.x -= nx * overlap * (mc / (ma + mc))
        a.y -= ny * overlap * (mc / (ma + mc))
        c.x += nx * overlap * (ma / (ma + mc))
        c.y += ny * overlap * (ma / (ma + mc))
        const rel = (a.vx - c.vx) * nx + (a.vy - c.vy) * ny
        if (rel > 0) {
          const k = (2.4 * rel) / (ma + mc)
          a.vx -= k * mc * nx
          a.vy -= k * mc * ny
          c.vx += k * ma * nx
          c.vy += k * ma * ny
          if (rel > 1) this.sound.play('blip')
        }
      }
    // The drain is open all round: shoved in, you are out.
    for (const b of live) {
      if (dist(b, this.basin.drain) < 12) {
        b.out = true
        b.alive = false
        this.burst(b.x, b.y, 24, SEAT_COLOURS[b.seat]!)
        this.sound.play('die')
        this.floaters.push({
          x: b.x,
          y: b.y - 20,
          text: `P${b.seat + 1} DOWN THE DRAIN!`,
          life: 70,
          color: SEAT_COLOURS[b.seat],
        })
      }
    }
    const standing = this.bubbles.filter((b) => !b.out)
    if (sumo.pause > 0) {
      if (--sumo.pause === 0) {
        if (Math.max(...sumo.wins) >= SUMO.wins) this.endSumo()
        else this.startSumoRound(sumo.round + 1)
      }
      return
    }
    if (standing.length <= 1 || sumo.t >= SUMO.roundTicks) {
      // The last bubble in the basin, or the biggest when the clock runs out.
      const winner = (standing.length ? standing : this.bubbles).reduce(
        (a, c) => (c.stage * 100 + c.growth > a.stage * 100 + a.growth ? c : a),
      )
      sumo.wins[winner.seat]!++
      winner.points += 1000
      if (winner.seat === 0) this.addScore(1000)
      this.banner = {
        text: `P${winner.seat + 1} WINS THE ROUND`,
        sub: sumo.wins.map((w, i) => `P${i + 1} ${w}`).join('  '),
        ticks: 150,
      }
      this.sound.play('extra')
      sumo.pause = 150
    }
  }

  private endSumo() {
    const sumo = this.sumo!
    const best = Math.max(...sumo.wins)
    const champ = sumo.wins.indexOf(best)
    this.result = {
      title: `P${champ + 1} WINS!`,
      lines: this.bubbles.map((b, i) => ({
        text: `P${i + 1}  ${sumo.wins[i]} ROUNDS  ${b.points} POINTS`,
        colour: SEAT_COLOURS[i],
      })),
      t: 0,
    }
  }

  /** Squeaky Clean: done at 95%; the clock is the score. */
  private finishSqueaky() {
    const ticks = this.basinTicks
    const best = this.times[this.squeakyKey]
    const record = !best || ticks < best
    if (record && !this.demo) this.times[this.squeakyKey] = ticks
    const points = Math.max(1_000, 40_000 - ticks * 8)
    this.addScore(points)
    this.keepProgress()
    const clock = (t: number) =>
      `${Math.floor(t / 3600)}:${String(Math.floor((t / 60) % 60)).padStart(2, '0')}.${String(Math.floor(((t % 60) / 60) * 10))}`
    this.result = {
      title: 'SQUEAKY CLEAN!',
      lines: [
        { text: `${this.plan.title}  ${clock(ticks)}`, colour: '#ffffff' },
        {
          text: record ? 'A NEW BEST TIME!' : `BEST ${clock(best!)}`,
          colour: record ? RAMPS.gold[4] : RAMPS.cream[3],
        },
        { text: `${points} POINTS`, colour: RAMPS.teal[4] },
      ],
      t: 0,
    }
    this.sound.play('extra')
  }

  /** Medals, best times and rooms reached go into the save as soon as they are earned. */
  private keepProgress() {
    if (this.demo) return
    // Any mode can earn progress: with no campaign checkpoint to carry it, it rides on a fresh
    // start-of-the-house save (step 0, which never offers to continue).
    const s = this.saveData ?? this.progressSave()
    this.saveData = {
      ...s,
      golden: [...this.golden],
      skins: [...this.skins],
      skin: this.skin,
      cleared: this.cleared,
      medals: { ...this.medals },
      times: { ...this.times },
      reached: this.reached,
    }
  }

  get save(): SudsSave | null | undefined {
    return this.demo ? undefined : this.saveData
  }

  get music(): MusicLoop | null {
    if (this.over || this.offer) return null
    if (this.ending) return MUSIC.ending
    if (this.shop) return MUSIC.shop
    if (this.boss) return MUSIC.boss
    return MUSIC[this.room?.music ?? 'kitchen']
  }

  /** The first bubble (tests and the pilot read it). */
  private get bubble(): Bubble {
    return this.bubbles[0]!
  }

  private radiusOf(b: Bubble) {
    if (b.giant) return GIANT_R
    // A merged bubble is bigger than any one bubble can grow.
    return (
      STAGE_RADIUS[b.stage]! + (b.members.length ? 2 + b.members.length * 3 : 0)
    )
  }

  // --- the campaign ------------------------------------------------------------

  /** Has the bubble every golden soap (the palace is open)? */
  private get allGolden() {
    return GOLDEN_ROOMS.every((id) => this.golden.has(id))
  }

  /** Start campaign step i: a room's basin, the shop, a boss, an ending, or Deep Clean. */
  private beginStep(i: number) {
    this.stepIndex = i
    this.shop = null
    this.boss = null
    this.bossId = null
    this.ending = null
    this.inEndless = false
    const step = this.steps[i]
    // The palace, its shop and the true ending only open with every golden soap.
    if (isSecretStep(step) && !this.allGolden) {
      this.beginStep(i + 1)
      return
    }
    if (!step || step.kind === 'endless') {
      this.startLevel(this.level + 1)
      return
    }
    if (step.kind === 'shop') {
      this.shop = { cursor: 0, t: 0, message: '' }
      this.sound.play('start')
      return
    }
    if (step.kind === 'ending') {
      this.ending = { kind: step.ending, t: 0 }
      this.cleared = true
      this.sound.play('extra')
      return
    }
    if (step.kind === 'deep') {
      // Round again: Deep Clean, dirtier and faster.
      this.deep++
      this.beginStep(0)
      this.banner = {
        text: 'DEEP CLEAN',
        sub: `LAP ${this.deep}: DIRTIER AND FASTER`,
        ticks: 180,
      }
      return
    }
    this.level++
    if (step.kind === 'boss') {
      const arena = BOSS_ARENAS[step.boss]
      this.room =
        ROOMS.find((r) => r.id === CYCLES[step.cycle]!.rooms.at(-1)) ?? null
      this.startBasin(bossPlan(step.boss), arena.backdrop)
      this.boss = newBoss(step.boss)
      this.bossId = step.boss
      this.banner = { text: arena.name, sub: arena.title, ticks: 150 }
      this.keep()
      return
    }
    const room = ROOMS[step.room]!
    this.room = room
    const plan = room.basins[step.basin]!
    this.startBasin(plan, room.backdrop)
    this.banner = {
      text: plan.title,
      sub: plan.goal ?? `${room.name} ${step.basin + 1}/4`,
      ticks: 120,
    }
    if (step.basin === 0) {
      this.banner = {
        text: room.name,
        sub: `${CYCLES[room.cycle - 1]?.name ?? ''}`,
        ticks: 150,
      }
      this.keep()
    }
  }

  private advance() {
    if (this.inEndless) {
      this.startLevel(this.level + 1)
      return
    }
    this.beginStep(this.stepIndex + 1)
  }

  /** The endless sink at this level (every shape in turn, rising on curves). */
  private startLevel(level: number) {
    this.level = level
    this.room = null
    this.boss = null
    this.shop = null
    const plan =
      this.mode === 'endless'
        ? endlessSinkPlan(level)
        : this.mode === 'classic'
          ? classicPlan(level)
          : endlessPlan(level)
    const backdrop =
      plan.basin === 'birdbath'
        ? 'garden'
        : plan.basin === 'palace'
          ? 'palace'
          : plan.basin === 'tub'
            ? 'bath'
            : plan.basin === 'drum'
              ? 'laundry'
              : plan.basin === 'tank'
                ? 'aquarium'
                : plan.basin === 'conveyor'
                  ? 'carwash'
                  : 'kitchen'
    this.startBasin(plan, backdrop)
    this.inEndless = true
    this.banner = { text: `SINK ${level}`, sub: this.basin.name, ticks: 100 }
  }

  /** Write the save: where the wash is (a room's start or a boss) and what the bubble owns. */
  /**
   * A save that holds only what lasts between washes (medals, best times, rooms reached, golden
   * soaps, skins, a clear) and starts the house over: what New Wash and the other modes keep.
   */
  private progressSave(): SudsSave {
    return {
      v: 1,
      step: 0,
      score: 0,
      lives: START_LIVES,
      bars: 0,
      puff: false,
      stage2: false,
      shield: 0,
      skins: [...this.skins],
      skin: this.skin,
      golden: [...this.golden],
      cleared: this.cleared,
      deep: 0,
      medals: { ...this.medals },
      times: { ...this.times },
      reached: this.reached,
    }
  }

  private keep() {
    if (this.demo || this.mode !== 'campaign') return
    this.resumeStep = this.stepIndex
    const step = this.steps[this.stepIndex]
    if (step?.kind === 'basin' && !ROOMS[step.room]!.secret)
      this.reached = Math.max(
        this.reached,
        GOLDEN_ROOMS.indexOf(ROOMS[step.room]!.id) + 1,
      )
    this.saveData = {
      v: 1,
      step: this.stepIndex,
      score: this.score,
      lives: Math.max(1, this.lives),
      bars: this.bars,
      puff: this.upgrades.puff,
      stage2: this.upgrades.stage2,
      shield: this.shield,
      skins: [...this.skins],
      skin: this.skin,
      golden: [...this.golden],
      cleared: this.cleared,
      deep: this.deep,
      medals: { ...this.medals },
      times: { ...this.times },
      reached: this.reached,
    }
  }

  private resumeFrom(s: SudsSave) {
    this.score = s.score
    this.lives = s.lives
    this.bars = s.bars
    this.upgrades = { puff: s.puff, stage2: s.stage2 }
    this.shield = s.shield
    this.skins = new Set(s.skins)
    this.skin = s.skin
    this.golden = new Set(s.golden)
    this.cleared = s.cleared === true
    this.deep = s.deep ?? 0
    this.nextExtra =
      (Math.floor(s.score / EXTRA_LIFE_EVERY) + 1) * EXTRA_LIFE_EVERY
    this.level = this.steps
      .slice(0, s.step)
      .filter((st) => st.kind === 'basin' || st.kind === 'boss').length
    this.beginStep(s.step)
  }

  // --- setup ------------------------------------------------------------------

  private spot(margin: number, awayFrom?: Point, minDistance = 0): Point {
    const { x0, y0, x1, y1 } = basinBounds(this.basin)
    for (let attempt = 0; attempt < 80; attempt++) {
      const p = {
        x: x0 + this.rng() * (x1 - x0),
        y: y0 + this.rng() * (y1 - y0),
      }
      if (!insideBasin(this.basin, p.x, p.y, margin)) continue
      if (dist(p, this.basin.drain) < 30) continue
      if (awayFrom && dist(p, awayFrom) < minDistance) continue
      return p
    }
    return { ...this.basin.start }
  }

  private addMess(at?: Point) {
    const p = at ?? this.spot(14)
    const grease = this.rng() < 0.3
    this.mess.push({
      x: p.x,
      y: p.y,
      kind: grease ? 'grease' : 'crumb',
      r: grease ? 5 : 3,
    })
  }

  private newPest(kind: PestKind, at: Point): Pest {
    return {
      kind,
      x: at.x,
      y: at.y,
      vx: 0,
      vy: 0,
      heading: this.rng() * Math.PI * 2,
      turn: 0,
      t: 0,
      state: 'roam',
      trap: 0,
      target: null,
      size: kind === 'lint' ? PESTS.lint.radius : 0,
      segs: [],
    }
  }

  /** A pest set up for its kind: the sock snake's socks, a strider waiting off the water. */
  private placePest(kind: PestKind, at: Point): Pest {
    const p = this.newPest(kind, at)
    if (kind === 'sock')
      p.segs = Array.from({ length: SOCK_SEGS }, (_, i) => ({
        x: at.x - i * SOCK_GAP,
        y: at.y,
      }))
    if (kind === 'strider') {
      p.state = 'wait'
      p.t = 120 + Math.floor(this.rng() * 120)
    }
    if (kind === 'spinner') {
      const a = this.rng() * Math.PI * 2
      p.vx = Math.cos(a) * 1.6
      p.vy = Math.sin(a) * 1.6
    }
    if (kind === 'puffer') p.t = 120 + Math.floor(this.rng() * 200)
    if (kind === 'drop') {
      // Flung out of the King.
      const a = Math.atan2(at.y - this.basin.drain.y, at.x - this.basin.drain.x)
      p.vx = Math.cos(a) * 2.5
      p.vy = Math.sin(a) * 2.5
    }
    return p
  }

  /** Lay out a basin from its plan: grime, mess, pests, props and the special's pieces. */
  private startBasin(plan: BasinPlan, backdrop: Backdrop) {
    this.plan = plan
    this.backdrop = backdrop
    this.basin = BASINS[plan.basin]
    // Deep Clean: thicker grime, more mess, faster pests.
    if (this.deep > 0) {
      plan = {
        ...plan,
        dirt: (plan.dirt ?? 1) + DEEP.dirt * this.deep,
        heat: plan.heat + DEEP.heat * this.deep,
        mess: plan.mess + DEEP.mess * this.deep,
      }
      this.plan = plan
    }
    this.grime = new Grime(this.basin, plan.dirt ?? 1)
    this.leaves = []
    this.socks = []
    this.car = null
    this.roller = plan.rollers
      ? { lane: 0, tell: 0, x: null, timer: plan.rollers.every }
      : null
    this.splashes = []
    this.rainTimer = plan.rain ?? 0
    this.specialTimer = 0
    this.strideTimer = 0
    this.spin = 0
    this.mess = []
    this.pests = []
    this.shots = []
    this.drips = []
    this.trail = []
    this.floats = []
    this.plates = []
    this.ducks = []
    this.floatTimer = FLOAT_EVERY
    this.specialDone = false
    this.basinTicks = 0
    this.draining = 0
    this.chain = 0
    this.chainTimer = 0
    this.flee = 0
    this.bossDone = 0
    this.pilotGoal = null
    const startStage = this.upgrades.stage2 ? 2 : 1
    this.basinPops = 0
    for (const b of this.bubbles) {
      const at = this.seatStart(b.seat)
      Object.assign(b, {
        host: null,
        members: [],
        mergeCool: 60,
        x: at.x,
        y: at.y,
        vx: 0,
        vy: 0,
        stage: startStage,
        growth: 0,
        scrub: 0,
        invuln: 90,
        power: null,
        superTicks: 0,
        giant: false,
      })
    }
    const home = this.basin.start
    for (let i = 0; i < plan.mess; i++) this.addMess()
    const keep: Record<PestKind, number> = {
      mite: 90,
      brush: 140,
      sponge: 120,
      gremlin: 0,
      slug: 110,
      loofah: 130,
      minibrush: 120,
      lint: 100,
      sock: 140,
      algae: 70,
      snail: 120,
      puffer: 110,
      strider: 0,
      leafboat: 120,
      wax: 60,
      spinner: 150,
      minion: 80,
      drop: 60,
    }
    for (const [kind, n] of Object.entries(plan.pests) as [
      PestKind,
      number,
    ][]) {
      for (let i = 0; i < n; i++) {
        if (kind === 'gremlin') {
          const g = this.newPest('gremlin', this.basin.drain)
          g.state = 'hidden'
          g.t = Math.round(levelCurve(plan.heat, SUDS_CURVES.gremlinRest))
          this.pests.push(g)
          continue
        }
        this.pests.push(
          this.placePest(
            kind,
            this.spot(PESTS[kind].radius + 12, home, keep[kind]),
          ),
        )
      }
    }
    for (const at of plan.ducks ?? [])
      this.ducks.push({
        x: at.x,
        y: at.y,
        vx: 0,
        vy: 0,
        home: at,
        penned: false,
      })
    if (plan.special === 'dish-stack') {
      for (const at of PLATE_SPOTS) {
        const a = this.rng() * Math.PI * 2
        this.plates.push({
          x: at.x,
          y: at.y,
          vx: Math.cos(a) * 0.25,
          vy: Math.sin(a) * 0.25,
          dirt: 1,
        })
      }
    }
    if (plan.special === 'duck-roundup') {
      for (const at of ROUNDUP_DUCKS)
        this.ducks.push({
          x: at.x,
          y: at.y,
          vx: 0,
          vy: 0,
          home: null,
          penned: false,
        })
    }
    for (let i = 0; i < (plan.leaves ?? 0); i++) {
      const at = this.spot(20)
      const a = this.rng() * Math.PI * 2
      this.leaves.push({
        x: at.x,
        y: at.y,
        vx: Math.cos(a) * 0.3,
        vy: Math.sin(a) * 0.3,
        a,
        tone: i,
      })
    }
    if (plan.special === 'odd-socks') {
      for (let i = 0; i < SOCK_PAIRS * 2; i++) {
        const at = this.spot(24, home, 60)
        this.socks.push({
          x: at.x,
          y: at.y,
          vx: 0,
          vy: 0,
          colour: i % SOCK_PAIRS,
          a: this.rng() * 6,
        })
      }
      this.specialTimer = SPIN_CYCLE
    }
    if (plan.special === 'rain-race') this.specialTimer = RAIN_RACE.shower
    if (plan.special === 'full-detail') this.newCar(0)
    this.dripTimer = plan.drip
  }

  /** Full Detail: a robot car rolls in at the belt's start with six grimy panels. */
  private newCar(cars: number) {
    const { x0, y0, y1 } = basinBounds(this.basin)
    this.car = {
      x: x0 - CAR.w + 10,
      y: (y0 + y1) / 2 - CAR.h / 2 + 10,
      panels: [1, 1, 1, 1, 1, 1],
      cars: cars + 1,
    }
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame, players?: InputFrame[]) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.chainTimer > 0 && --this.chainTimer === 0) this.chain = 0
    if (this.over) return
    if (this.result) {
      this.result.t++
      if (
        this.result.t > 60 * 12 ||
        (this.result.t > 90 && (input.pressed.a || input.pressed.start))
      )
        this.over = true
      return
    }
    if (this.menu) {
      this.updateMenu(input)
      return
    }
    if (this.offer) {
      if (input.pressed.a || input.pressed.start) {
        const s = this.offer
        this.offer = null
        this.resumeFrom(s)
      } else if (input.pressed.b) {
        // A new wash: the golden soaps and skins stay, the house starts dirty again.
        const s = this.offer
        this.offer = null
        this.golden = new Set(s.golden)
        this.skins = new Set(s.skins)
        this.skin = s.skin
        this.cleared = s.cleared === true
        // The checkpoint goes; the medals, best times and rooms reached stay saved.
        this.saveData = this.progressSave()
        this.openMenu()
      }
      return
    }
    if (this.ending) {
      this.ending.t++
      const skip =
        !this.demo &&
        this.ending.t > 120 &&
        (input.pressed.a || input.pressed.start)
      if (
        skip ||
        this.ending.t > CREDITS_TICKS ||
        (this.demo && this.ending.t > 300)
      )
        this.advance()
      return
    }
    if (
      this.mode !== 'sumo' &&
      this.lives <= 0 &&
      !this.bubbles.some((b) => b.alive)
    ) {
      if (++this.overTimer > 100) this.over = true
      return
    }
    if (this.shop) {
      this.updateShop(this.demo ? this.shopPilot() : input)
      return
    }
    if (this.draining > 0) {
      this.updateDraining()
      return
    }
    if (this.bossDone > 0) {
      if (--this.bossDone === 0) this.advance()
      return
    }
    for (const b of this.bubbles) {
      if (b.alive || b.host !== null || this.lives <= 0 || this.mode === 'sumo')
        continue
      if (--b.respawn <= 0) this.revive(b)
    }
    if (this.mode === 'sumo') this.updateSumo()
    if (this.result || !this.bubbles.some((b) => b.alive)) return

    this.basinTicks++
    const frames = this.demo
      ? [this.demoInput()]
      : players?.length && this.seats > 1
        ? players
        : [input]
    this.updateWater()
    for (const b of this.bubbles) {
      if (!b.alive || b.host !== null) continue
      const controls = this.controlsFor(b, frames)
      // B splits a merged bubble (any of its players can).
      if (b.members.length && controls.pressed.b) {
        this.split(b)
        continue
      }
      // The B that split a bubble does not also blow a soap shot.
      const own =
        b.mergeCool >= 90 && controls.pressed.b
          ? { ...controls, pressed: { ...controls.pressed, b: false } }
          : controls
      this.moveBubble(b, own)
    }
    this.mergeBubbles()
    for (const b of this.bubbles) {
      if (b.host === null) continue
      const h = this.bubbles[b.host]!
      b.x = h.x
      b.y = h.y
    }
    this.carryMess()
    this.updateDucks()
    this.updatePlates()
    this.updateHazards()
    this.updateSocks()
    this.updateCar()
    this.movePests()
    this.moveShots()
    this.moveDrips()
    this.updateFloats()
    this.updateBoss()
    for (const b of this.bubbles)
      if (b.alive && b.host === null) this.collide(b)
    if (
      this.mode === 'squeaky' &&
      !this.result &&
      this.grime.percent >= SQUEAKY
    )
      this.finishSqueaky()
  }

  /** A bubble's controls: its own player's, or everyone's averaged inside a merged bubble. */
  private controlsFor(b: Bubble, frames: InputFrame[]): InputFrame {
    const own = frames[b.seat] ?? emptyInput()
    if (!b.members.length) return own
    const all = [own, ...b.members.map((s) => frames[s] ?? emptyInput())]
    let x = 0
    let y = 0
    for (const f of all) {
      x += (f.held.right ? 1 : 0) - (f.held.left ? 1 : 0)
      y += (f.held.down ? 1 : 0) - (f.held.up ? 1 : 0)
    }
    const out = emptyInput()
    const k = 0.34 * all.length
    out.held.right = x > k
    out.held.left = x < -k
    out.held.down = y > k
    out.held.up = y < -k
    out.pressed.a = all.some((f) => f.pressed.a)
    out.pressed.b = all.some((f) => f.pressed.b)
    return out
  }

  /** Bubble Buddies: two bubbles that touch merge into one, bigger, steered by both. */
  private mergeBubbles() {
    if (
      this.seats < 2 ||
      this.mode === 'sumo' ||
      this.boss instanceof GrimeKing
    )
      return
    for (const b of this.bubbles) if (b.mergeCool > 0) b.mergeCool--
    const free = this.bubbles.filter(
      (b) => b.alive && b.host === null && !b.giant && b.mergeCool === 0,
    )
    for (let i = 0; i < free.length; i++)
      for (let j = i + 1; j < free.length; j++) {
        const a = free[i]!
        const c = free[j]!
        if (a.host !== null || c.host !== null) continue
        if (dist(a, c) > this.radiusOf(a) + this.radiusOf(c)) continue
        // The bigger one takes the other in (and everyone it carried).
        const [host, guest] =
          this.radiusOf(a) >= this.radiusOf(c) ? [a, c] : [c, a]
        const seats = [guest.seat, ...guest.members]
        guest.members = []
        for (const seat of seats) {
          const m = this.bubbles[seat]!
          m.host = host.seat
          m.alive = true
        }
        host.members.push(...seats)
        host.stage = Math.min(MAX_STAGE, Math.max(host.stage, guest.stage) + 1)
        host.growth = 0
        host.x = (host.x + guest.x) / 2
        host.y = (host.y + guest.y) / 2
        keepInside(this.basin, host, this.radiusOf(host))
        this.fx.burst(host.x, host.y, this.fxRng, { count: 14 })
        this.sound.play('pickup')
        this.floaters.push({
          x: host.x,
          y: host.y - 24,
          text: 'MERGED!',
          life: 50,
          color: RAMPS.teal[4],
        })
      }
  }

  /** B on a merged bubble: everyone pops back out, each a size smaller than the whole. */
  private split(b: Bubble) {
    const seats = b.members
    b.members = []
    const size = Math.max(1, b.stage - 1)
    b.stage = size
    b.mergeCool = 90
    const n = seats.length + 1
    seats.forEach((seat, i) => {
      const m = this.bubbles[seat]!
      const a = ((i + 1) / n) * Math.PI * 2
      Object.assign(m, {
        host: null,
        alive: true,
        stage: size,
        growth: 0,
        x: b.x + Math.cos(a) * 20,
        y: b.y + Math.sin(a) * 20,
        vx: Math.cos(a) * 2.5,
        vy: Math.sin(a) * 2.5,
        invuln: 60,
        mergeCool: 90,
      })
      keepInside(this.basin, m, this.radiusOf(m))
    })
    b.vx -= 1
    this.sound.play('pop')
    this.floaters.push({
      x: b.x,
      y: b.y - 24,
      text: 'SPLIT!',
      life: 45,
      color: RAMPS.pink[3],
    })
  }

  private updateDraining() {
    // Spiral down the drain, then rinse into the next basin.
    this.draining++
    const t = this.draining / 70
    const d = this.basin.drain
    for (const b of this.bubbles) {
      b.x = d.x + Math.cos(this.draining / 4) * 20 * (1 - t)
      b.y = d.y + Math.sin(this.draining / 4) * 20 * (1 - t)
    }
    if (this.draining <= 70) return
    const left = this.mess.length
    const percent = this.grime.percent
    const squeaky = percent >= SQUEAKY
    const bonus = Math.max(0, 1000 * this.level - left * 50) + percent * 20
    this.addScore(bonus + (squeaky ? SQUEAKY_BONUS : 0), W / 2, H / 2 - 40)
    let bars = BARS.basin + (squeaky ? BARS.squeaky : 0)
    let golden = false
    if (this.plan.special) {
      bars += BARS.special
      if (squeaky && this.room && !this.golden.has(this.room.id)) {
        this.golden.add(this.room.id)
        golden = true
      }
    }
    if (!this.demo) this.bars += bars
    // Medals for a campaign basin: Squeaky Clean, No Pop, Quick Rinse.
    const step = this.steps[this.stepIndex]
    let earned = 0
    if (
      this.mode === 'campaign' &&
      step?.kind === 'basin' &&
      !this.inEndless &&
      !this.demo
    ) {
      const room = ROOMS[step.room]!
      if (!room.secret) {
        const key = medalKey(room.id, step.basin)
        const bits = medalsFor(
          percent,
          this.basinPops,
          this.basinTicks,
          this.plan.par,
        )
        earned = bits & ~(this.medals[key] ?? 0)
        this.medals[key] = (this.medals[key] ?? 0) | bits
        this.keepProgress()
      }
    }
    this.advance()
    if (earned && !golden && !squeaky) {
      const names = (Object.keys(MEDAL) as (keyof typeof MEDAL)[])
        .filter((k) => earned & MEDAL[k])
        .map((k) => MEDAL_NAMES[k])
      this.banner = {
        text: medalCount(earned) > 1 ? 'MEDALS!' : 'MEDAL!',
        sub: names.join(' + '),
        ticks: 120,
      }
    }
    if (golden)
      this.banner = {
        text: 'GOLDEN SOAP!',
        sub: 'HIDDEN IN THE SUDS',
        ticks: 150,
      }
    else if (squeaky)
      this.banner = {
        text: 'SQUEAKY CLEAN!',
        sub: this.banner?.sub,
        ticks: 120,
      }
  }

  private updateWater() {
    const p = this.basin.physics
    if (p.kind === 'ripple') {
      // Ripples roll out in waves.
      const w = Math.sin((this.basinTicks * Math.PI * 2) / p.period)
      this.spin = w > 0 ? w * w : 0
      return
    }
    if (p.kind !== 'spin') return
    const { now } = dialAt(p, this.tick)
    this.spin += (now - this.spin) * 0.02
    this.drumAngle += this.spin * 0.0035
  }

  private moveBubble(b: Bubble, input: InputFrame) {
    let ax = 0
    let ay = 0
    if (input.held.left) ax -= 1
    if (input.held.right) ax += 1
    if (input.held.up) ay -= 1
    if (input.held.down) ay += 1
    const len = Math.hypot(ax, ay)
    const slick = this.plan.slicks?.some((s) => inBox(b, s)) ?? false
    const grip =
      this.basin.grip * (slick ? SLICK.accel : 1) * (b.sticky ? 0.5 : 1)
    if (len) {
      b.faceX = ax / len
      b.faceY = ay / len
      let push = ACCEL * grip
      const phys = this.basin.physics
      // In the tank, pushing down against the bubble's own lift is hard work.
      if (phys.kind === 'buoyancy' && ay > 0) push *= phys.downEffort
      b.vx += (ax / len) * ACCEL * grip
      b.vy += (ay / len) * push
    }
    const flow = flowAt(this.basin, b.x, b.y, this.spin, b.stage)
    b.vx += flow.x
    b.vy += flow.y
    const puff = this.upgrades.puff ? PUFF.long : PUFF.base
    if (b.puff > 0) b.puff--
    if (
      input.pressed.a &&
      b.puff === 0 &&
      (len || Math.hypot(b.vx, b.vy) > 0.2)
    ) {
      const sp = Math.hypot(b.vx, b.vy) || 1
      const dx = len ? ax / len : b.vx / sp
      const dy = len ? ay / len : b.vy / sp
      b.vx = dx * puff.speed
      b.vy = dy * puff.speed
      b.puff = puff.cooldown
      this.sound.play('blip')
    }
    if (input.pressed.b) this.fireShot(b)
    const speed = Math.hypot(b.vx, b.vy)
    const cap =
      (b.puff > puff.cooldown - 15 ? puff.speed : MAX_SPEED) *
      (slick ? SLICK.cap : 1)
    if (speed > cap) {
      b.vx *= cap / speed
      b.vy *= cap / speed
    }
    const friction = slick ? SLICK.friction : this.basin.friction
    b.vx *= friction
    b.vy *= friction
    // Scum slug trail: sticky going.
    b.sticky = this.trail.some((t) => dist(t, b) < this.radiusOf(b) + 4)
    if (b.sticky) {
      b.vx *= TRAIL_DRAG
      b.vy *= TRAIL_DRAG
    }
    b.x += b.vx
    b.y += b.vy
    keepInside(this.basin, b, this.radiusOf(b))
    b.wobble += 0.12 + speed * 0.05
    if (b.invuln > 0) b.invuln--
    if (b.hurt > 0) b.hurt--
    if (b.power && --b.power.ticks <= 0) b.power = null
    if (b.superTicks > 0 && --b.superTicks === 0) {
      b.stage = Math.min(b.stage, b.superFrom)
      b.growth = 0
    }
    // Wherever the bubble rolls, the basin comes clean, and the grime feeds it.
    this.scrubFor(b, this.grime.scrub(b.x, b.y, this.radiusOf(b)))
  }

  /** Credit a bubble with grime it scrubbed: a point a cell, and growth. */
  private scrubFor(b: Bubble, cleaned: number) {
    if (!cleaned) return
    this.addScore(cleaned)
    b.scrub += cleaned
    while (b.scrub >= SCRUB_PER_GROWTH) {
      b.scrub -= SCRUB_PER_GROWTH
      this.grow(b, 1)
    }
  }

  /** B: blow a soap shot the way the bubble faces, paying a stage of growth for it. */
  private fireShot(b: Bubble) {
    if (b.stage < SHOT_STAGE) {
      this.sound.play('warn')
      return
    }
    b.stage--
    if (b.superTicks > 0) b.superFrom = Math.min(b.superFrom, b.stage)
    const r = this.radiusOf(b)
    this.shots.push({
      x: b.x + b.faceX * (r + SHOT_R),
      y: b.y + b.faceY * (r + SHOT_R),
      vx: b.faceX * SHOT_SPEED + b.vx * 0.3,
      vy: b.faceY * SHOT_SPEED + b.vy * 0.3,
      life: SHOT_LIFE,
      seat: b.seat,
    })
    this.sound.play('shoot')
  }

  private carryMess() {
    const kind = this.basin.physics.kind
    if (kind === 'spin' || kind === 'conveyor') {
      for (const m of this.mess) {
        const to = carry(this.basin, m, this.spin)
        m.x = to.x
        m.y = to.y
        if (!insideBasin(this.basin, m.x, m.y, 6))
          keepInside(this.basin, m, 6, 0)
      }
    }
    // The Magnet Sponge pulls crumbs in.
    for (const b of this.bubbles) {
      if (!b.alive || b.power?.kind !== 'magnet') continue
      for (const m of this.mess) {
        const d = dist(m, b)
        if (d < 130 && d > 1) {
          m.x += ((b.x - m.x) / d) * 1.4
          m.y += ((b.y - m.y) / d) * 1.4
        }
      }
    }
  }

  private nearestMess(from: Point): Mess | null {
    let best: Mess | null = null
    let bestDistance = Infinity
    for (const m of this.mess) {
      const d = dist(m, from)
      if (d < bestDistance) {
        bestDistance = d
        best = m
      }
    }
    return best
  }

  /** The live bubble nearest to (x, y), if any. */
  private nearestBubble(from: Point): Bubble | null {
    let best: Bubble | null = null
    let bestD = Infinity
    for (const b of this.bubbles) {
      if (!b.alive) continue
      const d = dist(b, from)
      if (d < bestD) {
        bestD = d
        best = b
      }
    }
    return best
  }

  // --- props and the special basins -----------------------------------------------

  /** Rubber ducks: bumpers bob round home; Round-up ducks drift on the current until penned. */
  private updateDucks() {
    for (const d of this.ducks) {
      if (d.penned) continue
      if (d.home) {
        d.vx += (d.home.x - d.x) * 0.02
        d.vy += (d.home.y - d.y) * 0.02
        d.vx *= 0.85
        d.vy *= 0.85
      } else {
        const flow = flowAt(this.basin, d.x, d.y, this.spin)
        d.vx = (d.vx + flow.x * 0.35) * 0.97
        d.vy = (d.vy + flow.y * 0.35) * 0.97
        // Loose ducks jostle apart rather than stacking up.
        for (const o of this.ducks) {
          if (o === d) continue
          const dd = dist(o, d)
          if (dd < DUCK_R * 2 && dd > 0.01) {
            d.x += ((d.x - o.x) / dd) * (DUCK_R * 2 - dd) * 0.5
            d.y += ((d.y - o.y) / dd) * (DUCK_R * 2 - dd) * 0.5
          }
        }
      }
      d.x += d.vx
      d.y += d.vy
      // Loose ducks bob a little off the wall, where a bubble can get round them.
      keepInside(this.basin, d, d.home ? DUCK_R : DUCK_R + 12, 1.4)
      for (const b of this.bubbles) {
        if (!b.alive) continue
        const r = this.radiusOf(b) + DUCK_R
        const dd = dist(d, b)
        if (dd >= r || dd < 0.01) continue
        const nx = (d.x - b.x) / dd
        const ny = (d.y - b.y) / dd
        const push = r - dd
        if (d.home) {
          // A bumper: the bubble bounces off.
          b.x -= nx * push
          b.y -= ny * push
          const dot = b.vx * nx + b.vy * ny
          if (dot > 0) {
            b.vx -= 2.2 * dot * nx
            b.vy -= 2.2 * dot * ny
          }
          if (dot > 0.5) this.sound.play('blip')
        } else {
          // A Round-up duck: nudged along the way the bubble pushes it.
          d.x += nx * push
          d.y += ny * push
          const dot = Math.max(0, b.vx * nx + b.vy * ny)
          d.vx += nx * (dot * 0.9 + 0.2)
          d.vy += ny * (dot * 0.9 + 0.2)
          b.vx *= 0.9
          b.vy *= 0.9
        }
      }
      if (
        !d.home &&
        this.plan.special === 'duck-roundup' &&
        dist(d, DUCK_PEN) < DUCK_PEN.r - 8
      ) {
        d.penned = true
        d.vx = 0
        d.vy = 0
        this.addScore(500, d.x, d.y - 12)
        this.fx.burst(d.x, d.y, this.fxRng, { count: 10 })
        this.sound.play('pickup')
        if (this.ducks.every((x) => x.penned || x.home)) this.completeSpecial()
      }
    }
  }

  /** Dish Stack's plates drift about; a bubble sitting on one scrubs it. */
  private updatePlates() {
    for (const p of this.plates) {
      p.x += p.vx
      p.y += p.vy
      keepInside(this.basin, p, PLATE_R, 2)
      if (p.dirt <= 0) continue
      for (const b of this.bubbles) {
        if (!b.alive || dist(p, b) > PLATE_R + this.radiusOf(b) * 0.4) continue
        p.dirt -= 0.003 + b.stage * 0.0015
        if (this.tick % 6 === 0)
          this.fx.burst(p.x, p.y, this.fxRng, { count: 1, speed: 0.6 })
        if (p.dirt <= 0) {
          p.dirt = 0
          this.addScore(250, p.x, p.y - 16)
          this.sound.play('pickup')
          if (this.plates.every((x) => x.dirt <= 0)) this.completeSpecial()
        }
      }
    }
  }

  private completeSpecial() {
    if (this.specialDone) return
    this.specialDone = true
    this.addScore(SPECIAL_BONUS, W / 2, H / 2)
    this.sound.play('level')
    this.banner = { text: 'ALL DONE!', sub: 'THE DRAIN IS OPEN', ticks: 120 }
  }

  /** Can this bubble go down the drain now? */
  private drainOpenFor(b: Bubble) {
    if (this.boss || this.mode === 'sumo' || this.mode === 'squeaky')
      return false
    if (this.plan.special) return this.specialDone
    return b.stage >= MAX_STAGE
  }

  // --- power-ups and soap bars ---------------------------------------------------

  private updateFloats() {
    if (this.flee > 0) this.flee--
    if (--this.floatTimer <= 0) {
      this.floatTimer = FLOAT_EVERY
      if (this.floats.length < 2) {
        const kind =
          this.rng() < SOAP_SHARE
            ? 'soap'
            : POWER_KINDS[Math.floor(this.rng() * POWER_KINDS.length)]!
        const a = this.rng() * Math.PI * 2
        this.floats.push({
          kind,
          x: this.basin.drain.x,
          y: this.basin.drain.y,
          vx: Math.cos(a) * 1.1,
          vy: Math.sin(a) * 1.1,
          life: FLOAT_LIFE,
        })
        this.sound.play('blip')
      }
    }
    for (const f of this.floats) {
      f.x += f.vx
      f.y += f.vy
      f.vx *= 0.985
      f.vy *= 0.985
      keepInside(this.basin, f, 12, 1.8)
      f.life--
      for (const b of this.bubbles) {
        if (!b.alive || f.life <= 0) continue
        if (dist(f, b) < this.radiusOf(b) + 10) {
          this.pickUp(b, f.kind)
          f.life = 0
        }
      }
    }
    this.floats = this.floats.filter((f) => f.life > 0)
  }

  private pickUp(b: Bubble, kind: PowerKind | 'soap') {
    this.sound.play('pickup')
    this.fx.burst(b.x, b.y, this.fxRng, { count: 10 })
    if (kind === 'soap') {
      if (!this.demo) this.bars++
      this.floaters.push({
        x: b.x,
        y: b.y - 20,
        text: 'SOAP BAR!',
        life: 50,
        color: RAMPS.pink[3],
      })
      return
    }
    const def = POWERS[kind]
    this.floaters.push({
      x: b.x,
      y: b.y - 20,
      text: def.name,
      life: 60,
      color: RAMPS.gold[4],
    })
    switch (kind) {
      case 'lemon':
        this.flee = def.ticks
        return
      case 'supersuds':
        if (b.superTicks <= 0) b.superFrom = b.stage
        b.superTicks = def.ticks
        b.stage = MAX_STAGE
        return
      case 'squeegee': {
        // A wipe right across the basin at the bubble's height.
        const { x0, x1 } = basinBounds(this.basin)
        let cleaned = 0
        for (let x = x0; x <= x1; x += 4)
          cleaned += this.grime.scrub(x, b.y, SQUEEGEE_BAND / 2)
        this.scrubFor(b, cleaned)
        for (let x = x0; x <= x1; x += 24)
          this.fx.burst(x, b.y, this.fxRng, { count: 1, speed: 0.5 })
        return
      }
      case 'bathbomb':
        for (const p of this.pests)
          if (
            this.solid(p) &&
            PESTS[p.kind].trappable &&
            dist(p, b) < BOMB_REACH
          )
            this.trapPest(p)
        this.fx.burst(b.x, b.y, this.fxRng, {
          count: 24,
          speed: 2.4,
          colours: [RAMPS.pink[3], RAMPS.purple[3], '#ffffff'],
        })
        return
      default:
        b.power = { kind, ticks: def.ticks }
    }
  }

  // --- pests -------------------------------------------------------------------

  private movePests() {
    for (const p of this.pests) {
      if (p.trap) {
        this.driftTrapped(p)
        continue
      }
      if (this.flee > 0 && this.solid(p)) this.fleeFrom(p)
      else if (p.kind === 'mite') this.moveMite(p)
      else if (p.kind === 'brush')
        this.moveBrush(
          p,
          HUNT_RANGE,
          levelCurve(this.plan.heat, SUDS_CURVES.brushSpeed),
        )
      else if (p.kind === 'minibrush') this.moveBrush(p, 80, 0.8)
      else if (p.kind === 'sponge')
        this.moveSponge(p, levelCurve(this.plan.heat, SUDS_CURVES.spongeSpeed))
      else if (p.kind === 'loofah') this.moveSponge(p, 0.22)
      else if (p.kind === 'slug') this.moveSlug(p)
      else if (p.kind === 'gremlin') this.moveGremlin(p)
      else this.moveRoster(p)
      const rule = PESTS[p.kind]
      if (rule.cleans && p.state !== 'tipped')
        this.grime.scrub(p.x, p.y, rule.cleans)
      if (rule.eatsMess && p.state !== 'tipped') {
        const eaten = this.mess.findIndex((m) => dist(m, p) < this.pestR(p) + 2)
        if (eaten >= 0) {
          this.mess.splice(eaten, 1)
          // A lint ball rolls the crumb up and grows.
          if (p.kind === 'lint') p.size = Math.min(LINT_MAX, p.size + 1)
        }
      }
      this.guardShove(p)
    }
    this.pests = this.pests.filter(
      (p) => !(p.trap && dist(p, this.basin.drain) < 6),
    )
    for (const t of this.trail) t.life--
    this.trail = this.trail.filter((t) => t.life > 0)
  }

  /** The Rubber Duck bodyguard shoves away any pest it meets. */
  private guardShove(p: Pest) {
    if (!this.solid(p)) return
    for (const b of this.bubbles) {
      if (!b.alive || b.power?.kind !== 'duck') continue
      const g = this.guardAt(b)
      const d = dist(g, p)
      if (d > PESTS[p.kind].radius + DUCK_R || d < 0.01) continue
      p.x += ((p.x - g.x) / d) * 6
      p.y += ((p.y - g.y) / d) * 6
      p.heading = Math.atan2(p.y - b.y, p.x - b.x)
      keepInside(this.basin, p, PESTS[p.kind].radius + 2, 0)
      if (this.tick % 8 === 0) this.sound.play('blip')
    }
  }

  private guardAt(b: Bubble): Point {
    const a = this.tick * 0.08
    const r = this.radiusOf(b) + 16
    return { x: b.x + Math.cos(a) * r, y: b.y + Math.sin(a) * r }
  }

  /** Lemon Zest: every pest scurries away from the nearest bubble. */
  private fleeFrom(p: Pest) {
    if (p.kind === 'gremlin' && (p.state === 'hidden' || p.state === 'gurgle'))
      return
    const b = this.nearestBubble(p)
    if (!b) return
    const a = Math.atan2(p.y - b.y, p.x - b.x)
    p.heading = a
    p.vx = Math.cos(a) * 1.1
    p.vy = Math.sin(a) * 1.1
    p.x += p.vx
    p.y += p.vy
    keepInside(this.basin, p, PESTS[p.kind].radius + 2, 2)
  }

  /** A trapped pest floats to the drain and goes down it for the chain it was caught on. */
  private driftTrapped(p: Pest) {
    const d = this.basin.drain
    const a = Math.atan2(d.y - p.y, d.x - p.x)
    const flow = flowAt(this.basin, p.x, p.y, this.spin)
    p.x += Math.cos(a) * 0.9 + flow.x * 8
    p.y += Math.sin(a) * 0.9 + flow.y * 8
    if (dist(p, d) < 6) {
      this.addScore(
        TRAP_POINTS * p.trap * (PESTS[p.kind].trapBonus ?? 1),
        d.x,
        d.y - 16,
      )
      this.fx.burst(d.x, d.y, this.fxRng, { count: 12 })
      this.sound.play('pickup')
    }
  }

  private moveMite(m: Pest) {
    const speed = levelCurve(this.plan.heat, SUDS_CURVES.miteSpeed)
    if (--m.turn <= 0) {
      // Mites mostly wander, sometimes scuttle toward the nearest crumb.
      const target = this.rng() < 0.4 ? this.nearestMess(m) : null
      const a = target
        ? Math.atan2(target.y - m.y, target.x - m.x)
        : this.rng() * Math.PI * 2
      m.vx = Math.cos(a) * speed
      m.vy = Math.sin(a) * speed
      m.turn = 30 + Math.floor(this.rng() * 50)
    }
    m.x += m.vx
    m.y += m.vy
    if (keepInside(this.basin, m, 8, 2)) m.turn = 0
  }

  private moveBrush(br: Pest, range: number, speed: number) {
    if (br.state === 'tipped') {
      if (--br.t <= 0) {
        br.state = 'roam'
        this.sound.play('warn')
      }
      return
    }
    // Brushes turn toward a bubble that comes close, otherwise scrub toward the mess.
    const prey = this.nearestBubble(br)
    let target: Point | null = prey && dist(prey, br) < range ? prey : null
    if (!target) {
      if (--br.turn <= 0 || !br.target) {
        br.target =
          this.nearestMess(br) ?? this.grime.nearestDirty(br.x, br.y, 20)
        br.turn = 40
      }
      target = br.target
    }
    if (target) {
      const want = Math.atan2(target.y - br.y, target.x - br.x)
      br.heading = angleTo(br.heading, want, BRUSH_TURN)
    }
    br.vx = Math.cos(br.heading) * speed
    br.vy = Math.sin(br.heading) * speed
    br.x += br.vx
    br.y += br.vy
    if (keepInside(this.basin, br, PESTS[br.kind].radius + 4, 2)) {
      br.heading = Math.atan2(br.vy, br.vx)
      br.target = null
    }
  }

  /** Sponges and loofahs: slow cleaners heading for the mess, soaking up grime on the way. */
  private moveSponge(s: Pest, speed: number) {
    if (--s.turn <= 0 || !s.target) {
      s.target = this.nearestMess(s) ?? this.grime.nearestDirty(s.x, s.y, 25)
      s.turn = 60
    }
    if (s.target) {
      const a = Math.atan2(s.target.y - s.y, s.target.x - s.x)
      s.heading = angleTo(s.heading, a, 0.05)
    }
    s.vx = Math.cos(s.heading) * speed
    s.vy = Math.sin(s.heading) * speed
    s.x += s.vx
    s.y += s.vy
    if (keepInside(this.basin, s, PESTS[s.kind].radius + 4, 2)) s.target = null
  }

  /** The scum slug crawls about, leaving a sticky trail. */
  private moveSlug(s: Pest) {
    const speed = levelCurve(this.plan.heat, SUDS_CURVES.slugSpeed)
    if (--s.turn <= 0) {
      s.target = this.spot(20)
      s.turn = 120 + Math.floor(this.rng() * 80)
    }
    if (s.target)
      s.heading = angleTo(
        s.heading,
        Math.atan2(s.target.y - s.y, s.target.x - s.x),
        0.03,
      )
    s.vx = Math.cos(s.heading) * speed
    s.vy = Math.sin(s.heading) * speed
    s.x += s.vx
    s.y += s.vy
    if (keepInside(this.basin, s, 10, 2)) s.turn = 0
    if (this.tick % 10 === 0)
      this.trail.push({ x: s.x, y: s.y + 2, life: TRAIL_TICKS })
  }

  private moveGremlin(g: Pest) {
    const d = this.basin.drain
    if (g.state === 'hidden') {
      g.x = d.x
      g.y = d.y
      if (--g.t <= 0) {
        g.state = 'gurgle'
        g.t = GURGLE_TICKS
        this.sound.play('warn')
      }
      return
    }
    if (g.state === 'gurgle') {
      if (--g.t <= 0) {
        g.state = 'out'
        g.t = GREMLIN_OUT
        g.turn = 0
        this.sound.play('pop')
        // Out it pops: anything loitering over the drain gets bonked.
        for (const b of this.bubbles)
          if (b.alive && dist(b, d) < this.radiusOf(b) + 14)
            this.hurtBubble(b, 'hit', g)
      }
      return
    }
    const speed = levelCurve(this.plan.heat, SUDS_CURVES.gremlinSpeed)
    if (g.state === 'out') {
      if (--g.turn <= 0) {
        // It darts in straight lines, half the time at the nearest bubble.
        const prey = this.nearestBubble(g)
        g.heading =
          prey && this.rng() < 0.5
            ? Math.atan2(prey.y - g.y, prey.x - g.x)
            : this.rng() * Math.PI * 2
        g.turn = 40 + Math.floor(this.rng() * 40)
      }
      if (--g.t <= 0) g.state = 'home'
    } else {
      g.heading = Math.atan2(d.y - g.y, d.x - g.x)
      if (dist(g, d) < 4) {
        g.state = 'hidden'
        g.t = Math.round(levelCurve(this.plan.heat, SUDS_CURVES.gremlinRest))
        return
      }
    }
    g.vx = Math.cos(g.heading) * speed
    g.vy = Math.sin(g.heading) * speed
    g.x += g.vx
    g.y += g.vy
    if (keepInside(this.basin, g, 8, 2)) {
      g.heading = Math.atan2(g.vy, g.vx)
    }
  }

  /** Can this pest touch (or be touched) right now? */
  private solid(p: Pest) {
    if (p.trap || p.state === 'hidden' || p.state === 'gurgle') return false
    if (p.kind === 'strider') return p.state === 'roam'
    return true
  }

  /** A pest's contact radius now (a lint ball grows; an algae puff swells). */
  private pestR(p: Pest) {
    if (p.kind === 'lint') return p.size
    if (p.kind === 'algae') return 6 + (p.size / ALGAE_BLOOM) * 4
    if (p.kind === 'puffer' && p.state === 'puffed') return 14
    return PESTS[p.kind].radius
  }

  /** The nearest bubble a hunter can see: one sheltering under a leaf is hidden. */
  private prey(from: Point): Bubble | null {
    const b = this.nearestBubble(from)
    if (!b) return null
    return this.leaves.some((l) => dist(l, b) < 15) ? null : b
  }

  // --- the Cycle 2 and 3 roster ------------------------------------------------

  private moveRoster(p: Pest) {
    const heat = this.plan.heat
    switch (p.kind) {
      case 'lint': {
        // Rolling about after crumbs; the drum's spin carries it hardest of all.
        if (--p.turn <= 0) {
          const food = this.nearestMess(p)
          p.heading = food
            ? Math.atan2(food.y - p.y, food.x - p.x)
            : this.rng() * Math.PI * 2
          p.turn = 40
        }
        const flow = flowAt(this.basin, p.x, p.y, this.spin)
        p.vx = Math.cos(p.heading) * 0.5 + flow.x * 25
        p.vy = Math.sin(p.heading) * 0.5 + flow.y * 25
        this.step(p)
        return
      }
      case 'sock':
        this.moveSock(p)
        return
      case 'algae':
        this.wander(p, 0.15, 120)
        if (++p.size >= ALGAE_BLOOM) {
          // It blooms: the water clouds over with algae again.
          p.size = 0
          this.grime.soil(p.x, p.y, 40)
          this.splashes.push({ x: p.x, y: p.y, life: 40 })
          this.sound.play('warn')
        }
        return
      case 'snail':
        this.wander(p, 0.3, 160)
        return
      case 'puffer':
        if (p.state === 'puffed') {
          if (--p.t <= 0) {
            p.state = 'roam'
            p.t = 150 + Math.floor(this.rng() * 200)
          }
          return
        }
        if (p.state === 'tell') {
          if (--p.t <= 0) {
            p.state = 'puffed'
            p.t = PUFF_UP
            this.sound.play('pop')
          }
          return
        }
        this.wander(p, 0.6, 90)
        if (--p.t <= 0) {
          p.state = 'tell'
          p.t = PUFF_TELL
        }
        return
      case 'strider':
        this.moveStrider(p)
        return
      case 'leafboat': {
        // Drifting on the water, paddling round to face a bubble it can see.
        const prey = this.prey(p)
        if (prey && dist(prey, p) < 150)
          p.heading = angleTo(
            p.heading,
            Math.atan2(prey.y - p.y, prey.x - p.x),
            0.03,
          )
        else if (--p.turn <= 0) {
          p.heading += (this.rng() - 0.5) * 2
          p.turn = 90
        }
        const flow = flowAt(this.basin, p.x, p.y, this.spin)
        p.vx = Math.cos(p.heading) * 0.55 + flow.x * 10
        p.vy = Math.sin(p.heading) * 0.55 + flow.y * 10
        this.step(p)
        return
      }
      case 'wax':
        if (p.state === 'roam' && ++p.t >= WAX_SET) {
          p.state = 'set'
          this.sound.play('blip')
        }
        return
      case 'spinner': {
        const speed = Math.min(2.6, 1.5 + heat * 0.06)
        const v = Math.hypot(p.vx, p.vy) || 1
        p.vx = (p.vx / v) * speed
        p.vy = (p.vy / v) * speed
        p.x += p.vx
        p.y += p.vy
        if (keepInside(this.basin, p, 10, 2)) this.sound.play('blip')
        p.heading += 0.3
        return
      }
      case 'minion': {
        const prey = this.prey(p)
        if (prey && dist(prey, p) < 100) {
          const a = Math.atan2(prey.y - p.y, prey.x - p.x)
          p.vx = Math.cos(a) * 0.9
          p.vy = Math.sin(a) * 0.9
        } else {
          // Circling the King on guard.
          const d = this.basin.drain
          p.heading = Math.atan2(p.y - d.y, p.x - d.x) + 0.02
          const r = 84
          p.vx = (d.x + Math.cos(p.heading) * r - p.x) * 0.05
          p.vy = (d.y + Math.sin(p.heading) * r * 0.75 - p.y) * 0.05
        }
        this.step(p)
        return
      }
      default: {
        // A grime drop: drifting back toward the others, shying from the bubble.
        const drops = this.pests.filter((o) => o.kind === 'drop' && !o.trap)
        const cx = drops.reduce((a, o) => a + o.x, 0) / drops.length
        const cy = drops.reduce((a, o) => a + o.y, 0) / drops.length
        let ax = (cx - p.x) * 0.0025
        let ay = (cy - p.y) * 0.0025
        const b = this.nearestBubble(p)
        if (b && dist(b, p) < 80) {
          const d = dist(b, p) || 1
          ax += ((p.x - b.x) / d) * 0.25
          ay += ((p.y - b.y) / d) * 0.25
        }
        p.vx = (p.vx + ax) * 0.95
        p.vy = (p.vy + ay) * 0.95
        const v = Math.hypot(p.vx, p.vy)
        if (v > 1.7) {
          p.vx *= 1.7 / v
          p.vy *= 1.7 / v
        }
        this.step(p)
      }
    }
  }

  /** Move a pest by its velocity and keep it in the water. */
  private step(p: Pest) {
    p.x += p.vx
    p.y += p.vy
    if (keepInside(this.basin, p, this.pestR(p) + 2, 2))
      p.heading = Math.atan2(p.vy, p.vx)
  }

  /** Amble toward a random spot, picking a new one now and then. */
  private wander(p: Pest, speed: number, every: number) {
    if (--p.turn <= 0 || !p.target) {
      p.target = this.spot(20)
      p.turn = every + Math.floor(this.rng() * every)
    }
    p.heading = angleTo(
      p.heading,
      Math.atan2(p.target.y - p.y, p.target.x - p.x),
      0.05,
    )
    p.vx = Math.cos(p.heading) * speed
    p.vy = Math.sin(p.heading) * speed
    this.step(p)
  }

  /** The sock snake: the head winds about (after a bubble it can see); each sock follows the last. */
  private moveSock(p: Pest) {
    const prey = this.prey(p)
    if (prey && dist(prey, p) < 110)
      p.heading = angleTo(
        p.heading,
        Math.atan2(prey.y - p.y, prey.x - p.x),
        0.04,
      )
    else if (--p.turn <= 0) {
      p.heading += (this.rng() - 0.5) * 1.6
      p.turn = 50
    }
    p.vx = Math.cos(p.heading) * 0.8
    p.vy = Math.sin(p.heading) * 0.8
    this.step(p)
    const segs = p.segs
    if (!segs.length) return
    segs[0] = { x: p.x, y: p.y }
    for (let i = 1; i < segs.length; i++) {
      const a = segs[i - 1]!
      const s = segs[i]!
      const d = dist(a, s) || 1
      if (d > SOCK_GAP) {
        s.x = a.x + ((s.x - a.x) / d) * SOCK_GAP
        s.y = a.y + ((s.y - a.y) / d) * SOCK_GAP
      }
    }
  }

  /** The water strider: waits off the water, shows its ripple line, then skates straight across. */
  private moveStrider(p: Pest) {
    if (p.state === 'wait') {
      if (--p.t > 0) return
      const c = this.basin.drain
      const a = this.rng() * Math.PI * 2
      const b = a + Math.PI + (this.rng() - 0.5) * 1.2
      const rim = (ang: number) => {
        let r = 10
        while (
          r < 400 &&
          insideBasin(
            this.basin,
            c.x + Math.cos(ang) * r,
            c.y + Math.sin(ang) * r,
            8,
          )
        )
          r += 4
        return {
          x: c.x + Math.cos(ang) * (r - 4),
          y: c.y + Math.sin(ang) * (r - 4),
        }
      }
      p.segs = [rim(a), rim(b)]
      p.x = p.segs[0]!.x
      p.y = p.segs[0]!.y
      p.state = 'tell'
      p.t = STRIDER_TELL
      this.sound.play('warn')
      return
    }
    if (p.state === 'tell') {
      if (--p.t <= 0) p.state = 'roam'
      return
    }
    const to = p.segs[1]!
    const d = dist(to, p)
    const speed = STRIDER_SPEED + Math.min(1.5, this.plan.heat * 0.05)
    if (d < speed) {
      p.state = 'wait'
      p.t = 200 + Math.floor(this.rng() * 220)
      return
    }
    p.heading = Math.atan2(to.y - p.y, to.x - p.x)
    p.vx = Math.cos(p.heading) * speed
    p.vy = Math.sin(p.heading) * speed
    p.x += p.vx
    p.y += p.vy
  }

  // --- hazards and the Cycle 2 and 3 specials -----------------------------------

  private updateHazards() {
    const plan = this.plan
    // Rain: drops land anywhere, grime the spot, and now and then leave a crumb.
    const raining =
      plan.rain && (plan.special !== 'rain-race' || !this.specialDone)
    if (raining && --this.rainTimer <= 0) {
      this.rainTimer = plan.rain!
      const at = this.spot(8)
      this.grime.soil(at.x, at.y, 8)
      this.splashes.push({ x: at.x, y: at.y, life: 20 })
      if (this.rng() < 0.25) this.addMess(at)
    }
    for (const sp of this.splashes) sp.life--
    this.splashes = this.splashes.filter((sp) => sp.life > 0)
    // Leaves drift on the water and the ripples.
    for (const l of this.leaves) {
      const flow = flowAt(this.basin, l.x, l.y, this.spin)
      l.vx = (l.vx + flow.x * 0.5) * 0.995
      l.vy = (l.vy + flow.y * 0.5) * 0.995
      l.x += l.vx
      l.y += l.vy
      l.a += 0.004
      keepInside(this.basin, l, 16, 1.8)
    }
    this.updateRoller()
    this.updateJets()
    // Specials won on cleanliness.
    if (
      plan.special === 'clean-goal' &&
      this.grime.percent >= (plan.cleanGoal ?? 90)
    )
      this.completeSpecial()
    if (
      plan.special === 'rain-race' &&
      !this.specialDone &&
      --this.specialTimer <= 0
    ) {
      if (this.grime.percent >= RAIN_RACE.goal) {
        this.completeSpecial()
        this.banner = {
          text: 'THE SHOWER PASSES!',
          sub: 'THE DRAIN IS OPEN',
          ticks: 120,
        }
      } else {
        this.specialTimer = RAIN_RACE.more
        this.banner = {
          text: 'STILL RAINING!',
          sub: `GET IT ${RAIN_RACE.goal}% CLEAN`,
          ticks: 100,
        }
        this.sound.play('warn')
      }
    }
  }

  /** Car-wash rollers: a lane lights up, then a roller sweeps along it. */
  private updateRoller() {
    const r = this.roller
    const belt = this.basin.physics
    if (!r || !this.plan.rollers || belt.kind !== 'conveyor') return
    const laneH = (belt.bottom - belt.top) / belt.lanes
    if (r.x === null && r.tell === 0) {
      if (--r.timer <= 0) {
        r.lane = Math.floor(this.rng() * belt.lanes)
        r.tell = this.plan.rollers.tell
        this.sound.play('warn')
      }
      return
    }
    if (r.tell > 0) {
      if (--r.tell === 0) r.x = basinBounds(this.basin).x0 - 16
      return
    }
    r.x! += 3.4
    const y0 = belt.top + r.lane * laneH
    const y1 = y0 + laneH
    // It scrubs the lane clean and sweeps away whatever is in it.
    this.grime.scrub(r.x!, (y0 + y1) / 2, laneH / 2)
    this.mess = this.mess.filter(
      (m) => !(Math.abs(m.x - r.x!) < 12 && m.y >= y0 && m.y < y1),
    )
    this.pests = this.pests.filter(
      (p) =>
        !(
          p.kind === 'wax' &&
          Math.abs(p.x - r.x!) < 14 &&
          p.y >= y0 &&
          p.y < y1
        ),
    )
    for (const b of this.bubbles)
      if (
        b.alive &&
        b.y >= y0 - 4 &&
        b.y < y1 + 4 &&
        Math.abs(b.x - r.x!) < this.radiusOf(b) + 12
      )
        this.hurtBubble(b, 'hit', { x: r.x!, y: b.y })
    if (r.x! > basinBounds(this.basin).x1 + 16) {
      r.x = null
      r.timer = this.plan.rollers.every
    }
  }

  /** The jet's beat: 0..1 of a puff, and whether it is about to blow. */
  private jetPhase() {
    const t = this.basinTicks % JET_BEAT
    return { puff: t < 24 ? 1 - t / 24 : 0, warn: t > JET_BEAT - 36 }
  }

  /** Wax jets puff on the beat: they shove the bubble and spatter fresh wax. */
  private updateJets() {
    const jets = this.plan.jets
    if (!jets) return
    const t = this.basinTicks % JET_BEAT
    if (t === 0) {
      this.sound.play('pop')
      const jet = jets[Math.floor(this.rng() * jets.length)]!
      if (this.pests.filter((p) => p.kind === 'wax').length < 5) {
        const c = this.basin.drain
        const d = dist(c, jet) || 1
        this.pests.push(
          this.placePest('wax', {
            x: jet.x + ((c.x - jet.x) / d) * 50,
            y: jet.y + ((c.y - jet.y) / d) * 50,
          }),
        )
      }
    }
    if (t >= 24) return
    for (const jet of jets) {
      const c = this.basin.drain
      const dir = Math.atan2(c.y - jet.y, c.x - jet.x)
      for (const b of this.bubbles) {
        if (!b.alive || dist(b, jet) > 90) continue
        let off = Math.atan2(b.y - jet.y, b.x - jet.x) - dir
        while (off > Math.PI) off -= Math.PI * 2
        while (off < -Math.PI) off += Math.PI * 2
        if (Math.abs(off) > 0.6) continue
        b.vx += Math.cos(dir) * 0.4
        b.vy += Math.sin(dir) * 0.4
      }
    }
  }

  /** Odd Socks: socks tumble in the drum; push matching pairs together before the spin cycle. */
  private updateSocks() {
    if (this.plan.special !== 'odd-socks' || this.specialDone) return
    for (const k of this.socks) {
      const flow = flowAt(this.basin, k.x, k.y, this.spin)
      k.vx = (k.vx + flow.x * 0.5) * 0.96
      k.vy = (k.vy + flow.y * 0.5) * 0.96
      k.x += k.vx
      k.y += k.vy
      k.a += k.vx * 0.05
      keepInside(this.basin, k, 10, 1.5)
      for (const b of this.bubbles) {
        if (!b.alive) continue
        const r = this.radiusOf(b) + 9
        const d = dist(k, b)
        if (d >= r || d < 0.01) continue
        const nx = (k.x - b.x) / d
        const ny = (k.y - b.y) / d
        k.x += nx * (r - d)
        k.y += ny * (r - d)
        const dot = Math.max(0, b.vx * nx + b.vy * ny)
        k.vx += nx * (dot * 0.9 + 0.2)
        k.vy += ny * (dot * 0.9 + 0.2)
      }
    }
    // A matching pair touching: paired off.
    for (let i = 0; i < this.socks.length; i++)
      for (let j = i + 1; j < this.socks.length; j++) {
        const a = this.socks[i]!
        const c = this.socks[j]!
        if (dist(a, c) > 16) continue
        if (a.colour === c.colour) {
          this.addScore(
            400 * this.chainUp(),
            (a.x + c.x) / 2,
            (a.y + c.y) / 2 - 12,
          )
          this.fx.burst(a.x, a.y, this.fxRng, { count: 12 })
          this.sound.play('pickup')
          this.socks = this.socks.filter((x) => x !== a && x !== c)
          if (!this.socks.length) this.completeSpecial()
          return
        }
        const d = dist(a, c) || 1
        a.vx += ((a.x - c.x) / d) * 0.3
        a.vy += ((a.y - c.y) / d) * 0.3
      }
    if (--this.specialTimer <= 0) {
      // The spin cycle: everything flies apart.
      this.specialTimer = SPIN_CYCLE
      for (const k of this.socks) {
        const a = this.rng() * Math.PI * 2
        k.vx = Math.cos(a) * 3
        k.vy = Math.sin(a) * 3
      }
      this.banner = {
        text: 'SPIN CYCLE!',
        sub: 'THE SOCKS GO FLYING',
        ticks: 90,
      }
      this.sound.play('boom')
    }
  }

  /** Full Detail: the car rides the belt; sit on a panel to scrub it. */
  private updateCar() {
    const car = this.car
    if (!car || this.specialDone) return
    car.x += CAR.speed
    const cols = 3
    const pw = (CAR.w - 8) / cols
    const ph = (CAR.h - 8) / 2
    car.panels.forEach((dirt, i) => {
      if (dirt <= 0) return
      const px = car.x + 4 + (i % cols) * pw
      const py = car.y + 4 + Math.floor(i / cols) * ph
      for (const b of this.bubbles) {
        if (!b.alive) continue
        const m = this.radiusOf(b) * 0.4
        if (
          b.x < px - m ||
          b.x > px + pw + m ||
          b.y < py - m ||
          b.y > py + ph + m
        )
          continue
        car.panels[i] = Math.max(0, car.panels[i]! - (0.006 + b.stage * 0.002))
        if (this.tick % 8 === 0)
          this.fx.burst(b.x, b.y, this.fxRng, { count: 1, speed: 0.5 })
        if (car.panels[i] === 0) {
          this.addScore(300, px + pw / 2, py - 6)
          this.sound.play('pickup')
        }
      }
    })
    if (car.panels.every((d) => d <= 0)) {
      this.completeSpecial()
      this.banner = { text: 'FULL DETAIL!', sub: 'SHINY AS NEW', ticks: 120 }
      return
    }
    if (car.x > basinBounds(this.basin).x1 + 10) {
      this.newCar(car.cars)
      this.banner = { text: 'NEXT CAR!', sub: 'CLEAN EVERY PANEL', ticks: 80 }
    }
  }

  // --- the boss ----------------------------------------------------------------

  private bossHost(): BossHost {
    return {
      rng: this.rng,
      radiusOf: (b) => this.radiusOf(b as Bubble),
      hurt: (b, from, touch) => this.hurtBubble(b as Bubble, touch, from),
      bumped: (b, at) => {
        const bubble = b as Bubble
        this.addScore(BUMP_POINTS, at.x, at.y - 20)
        bubble.superTicks = 0
        bubble.stage = Math.min(bubble.stage, 3)
        bubble.growth = 0
        bubble.invuln = 60
        this.fx.burst(at.x, at.y, this.fxRng, { count: 16 })
      },
      score: (points, at) => this.addScore(points, at.x, at.y),
      spawn: (kind, at) => {
        const p = this.placePest(kind, at)
        keepInside(this.basin, p, this.pestR(p) + 2, 0)
        this.pests.push(p)
      },
      living: (kind) => this.pests.filter((p) => p.kind === kind && !p.trap),
      clear: (kind) => {
        this.pests = this.pests.filter((p) => p.kind !== kind || p.trap > 0)
      },
      keepIn: (body, r) => keepInside(this.basin, body, r, 1.5),
      dropCrumbs: (at, count) => {
        for (let i = 0; i < count; i++) {
          const p = {
            x: at.x + (this.rng() * 2 - 1) * 60,
            y: at.y + (this.rng() * 2 - 1) * 50,
          }
          keepInside(this.basin, p, 12, 0)
          this.addMess(p)
        }
      },
      soil: (at, r) => {
        this.grime.soil(at.x, at.y, r)
      },
      giant: (b, on) => {
        const bubble = b as Bubble
        if (bubble.giant === on) return
        bubble.giant = on
        if (on) {
          bubble.stage = MAX_STAGE
          this.banner = {
            text: 'GIANT BUBBLE!',
            sub: 'SWEEP HIM DOWN THE DRAIN',
            ticks: 120,
          }
        }
        keepInside(this.basin, bubble, this.radiusOf(bubble))
      },
      sound: (name) => this.sound.play(name),
      drain: this.basin.drain,
    }
  }

  private updateBoss() {
    const boss = this.boss
    if (!boss) return
    boss.update(this.bossHost(), this.bubbles)
    if (boss.done && this.bossDone === 0) {
      const which = this.bossId ?? 'bristleton'
      const rank = which === 'grimeking' ? 3 : which === 'mossback' ? 2 : 1
      this.addScore(DEFEAT_POINTS * rank, W / 2, H / 2 - 30)
      if (!this.demo) this.bars += BARS.boss
      this.pests = this.pests.filter(
        (p) => p.kind !== 'minibrush' && p.kind !== 'algae',
      )
      for (const b of this.bubbles) b.giant = false
      const lines: Record<BossId, [string, string]> = {
        bristleton: ['TIPPED IN!', 'BRISTLETON IS ALL WASHED UP'],
        mossback: ['SHINING!', 'MOSSBACK IS SPARKLING CLEAN'],
        grimeking: ['DOWN THE DRAIN!', 'THE TOWN SPARKLES AGAIN'],
      }
      this.banner = { text: lines[which][0], sub: lines[which][1], ticks: 160 }
      this.sound.play('extra')
      this.bossDone = 160
    }
  }

  // --- shots -------------------------------------------------------------------

  private moveShots() {
    for (const s of this.shots) {
      s.x += s.vx
      s.y += s.vy
      s.life--
      if (!insideBasin(this.basin, s.x, s.y, SHOT_R)) s.life = 0
      if (s.life <= 0) {
        this.fx.burst(s.x, s.y, this.fxRng, { count: 4, speed: 0.8 })
        continue
      }
      if (this.mode === 'sumo') {
        // In Suds Sumo a shot shoves a rival and knocks a size off it.
        const rival = this.bubbles.find(
          (o) =>
            o.alive &&
            !o.out &&
            o.seat !== s.seat &&
            dist(o, s) < this.radiusOf(o) + SHOT_R,
        )
        if (rival) {
          rival.vx += s.vx * 1.3
          rival.vy += s.vy * 1.3
          rival.stage = Math.max(1, rival.stage - 1)
          rival.hurt = 30
          s.life = 0
          this.sound.play('pop')
          continue
        }
      }
      for (const p of this.pests) {
        if (!this.solid(p) || dist(p, s) >= this.pestR(p) + SHOT_R) continue
        if (p.kind === 'wax' && p.state === 'set') {
          // A shot shatters hardened wax.
          this.pests = this.pests.filter((o) => o !== p)
          this.addScore(50, p.x, p.y - 10)
          this.fx.burst(p.x, p.y, this.fxRng, { count: 8 })
          s.life = 0
          break
        }
        if (!PESTS[p.kind].trappable) continue
        if (p.kind === 'puffer' && p.state === 'puffed') continue
        // A leaf boat's raised leaf turns a shot from the front.
        if (p.kind === 'leafboat') {
          const d = dist(p, s) || 1
          const front =
            (Math.cos(p.heading) * (s.x - p.x) +
              Math.sin(p.heading) * (s.y - p.y)) /
            d
          if (front > 0.35) {
            s.life = 0
            this.fx.burst(s.x, s.y, this.fxRng, { count: 4, speed: 0.8 })
            this.sound.play('blip')
            break
          }
        }
        this.trapPest(p)
        s.life = 0
        break
      }
    }
    this.shots = this.shots.filter((s) => s.life > 0)
  }

  private trapPest(p: Pest) {
    p.trap = this.chainUp()
    p.state = 'roam'
    this.sound.play('pickup')
    this.floaters.push({
      x: p.x,
      y: p.y - 14,
      text: p.trap > 1 ? `TRAPPED X${p.trap}` : 'TRAPPED!',
      life: 50,
      color: RAMPS.teal[3],
    })
  }

  /** Count an eat or a trap toward the chain; returns the multiplier it earns. */
  private chainUp(): number {
    this.chain = this.chainTimer > 0 ? Math.min(MAX_CHAIN, this.chain + 1) : 1
    this.chainTimer = CHAIN_TICKS
    return this.chain
  }

  private moveDrips() {
    // A basin picked bare by the cleaners drips three times as fast, so a hungry bubble can refill.
    this.dripTimer -= this.mess.length < HUNGRY_MESS ? 4 : 1
    if (this.dripTimer <= 0) {
      const land = this.spot(16)
      const f = this.basin.faucet
      this.drips.push({
        x: land.x,
        y: f ? Math.min(f.y, land.y - 40) : basinBounds(this.basin).y0 - 20,
        vy: 2.5,
        landY: land.y,
      })
      this.dripTimer = this.plan.drip
    }
    for (const d of this.drips) d.y += d.vy
    const landed = this.drips.filter((d) => d.y >= d.landY)
    const hungry = this.mess.length < HUNGRY_MESS
    for (const d of landed) {
      this.addMess({ x: d.x, y: d.landY })
      // A picked-bare basin gets a little extra splash of food.
      if (hungry) this.addMess({ x: d.x + 10, y: d.landY + 4 })
      this.grime.soil(d.x, d.landY, 7)
    }
    this.drips = this.drips.filter((d) => d.y < d.landY)
  }

  // --- growth and contact --------------------------------------------------------

  private grow(b: Bubble, amount: number) {
    if (b.stage >= MAX_STAGE) return
    b.growth += amount
    while (b.growth >= GROWTH_PER_STAGE && b.stage < MAX_STAGE) {
      b.growth -= GROWTH_PER_STAGE
      b.stage++
      this.sound.play('pickup')
      if (b.stage === SHOT_STAGE && !this.shotHint) {
        this.shotHint = true
        this.banner = {
          text: 'BIG ENOUGH!',
          sub: 'B BLOWS A SOAP SHOT',
          ticks: 110,
        }
      }
      if (b.stage === MAX_STAGE) {
        b.growth = 0
        if (!this.plan.special && !this.boss) {
          this.banner = {
            text: 'FULL OF SUDS!',
            sub: 'SAIL DOWN THE DRAIN',
            ticks: 120,
          }
          this.sound.play('level')
        }
      }
    }
  }

  private collide(b: Bubble) {
    const r = this.radiusOf(b)
    for (let i = this.mess.length - 1; i >= 0; i--) {
      const m = this.mess[i]!
      if (dist(m, b) < r + m.r) {
        this.mess.splice(i, 1)
        this.fx.burst(m.x, m.y, this.fxRng, { count: 4, speed: 1 })
        const chain = this.chainUp()
        this.addScore((m.kind === 'grease' ? 25 : 10) * chain)
        this.grow(b, m.kind === 'grease' ? 2 : 1)
        if (this.tick % 2 === 0) this.sound.play('blip')
      }
    }
    if (this.drainOpenFor(b) && dist(b, this.basin.drain) < 17) {
      this.draining = 1
      this.sound.play('extra')
      return
    }
    for (let i = this.pests.length - 1; i >= 0; i--) {
      const p = this.pests[i]!
      if (!this.solid(p)) continue
      const rule = PESTS[p.kind]
      if (p.kind === 'sock') {
        if (this.touchSock(b, p)) this.pests.splice(i, 1)
        if (!b.alive) return
        continue
      }
      const pr = this.pestR(p)
      if (dist(p, b) >= r + pr) continue
      if (p.kind === 'brush' && p.state === 'tipped') continue
      if (b.giant) {
        // Nothing stands up to the giant bubble.
        this.pests.splice(i, 1)
        this.addScore(100, p.x, p.y)
        this.fx.burst(p.x, p.y, this.fxRng, { count: 8 })
        continue
      }
      if (p.kind === 'wax' && p.state === 'set') {
        // Hardened wax is a wall.
        const d = dist(p, b) || 1
        b.x = p.x + ((b.x - p.x) / d) * (r + pr)
        b.y = p.y + ((b.y - p.y) / d) * (r + pr)
        b.vx *= -0.5
        b.vy *= -0.5
        continue
      }
      const edible =
        p.kind === 'lint'
          ? p.size <= r
          : p.kind === 'snail'
            ? b.stage >= MAX_STAGE
            : !!rule.edibleFrom && b.stage >= rule.edibleFrom
      if (edible) {
        this.pests.splice(i, 1)
        const chain = this.chainUp()
        this.addScore(rule.points * chain, p.x, p.y)
        this.burst(p.x, p.y, 8, RAMPS.rust[2])
        this.fx.burst(p.x, p.y, this.fxRng, { count: 10 })
        this.sound.play('pop')
        this.grow(b, p.kind === 'lint' ? Math.ceil(p.size / 3) : EAT_GROWTH)
        if (p.kind === 'snail')
          this.floaters.push({
            x: p.x,
            y: p.y - 20,
            text: 'ROLLED OVER!',
            life: 50,
            color: RAMPS.gold[4],
          })
        // A swallowed mite drops a crumb somewhere else: the sink is never quite done.
        if (p.kind === 'mite') this.addMess()
        continue
      }
      if (p.kind === 'brush' && b.stage >= MAX_STAGE && this.behind(p, b)) {
        // Bumped from behind at full size: over it goes.
        p.state = 'tipped'
        p.t = TIP_TICKS
        this.addScore(rule.points * this.chainUp(), p.x, p.y)
        this.fx.burst(p.x, p.y, this.fxRng, { count: 12 })
        this.sound.play('boom')
        const a = Math.atan2(b.y - p.y, b.x - p.x)
        b.vx += Math.cos(a) * 1.5
        b.vy += Math.sin(a) * 1.5
        continue
      }
      // Scared pests (Lemon Zest) are all bluster.
      if (b.invuln > 0 || this.flee > 0) continue
      const touch =
        p.kind === 'puffer' && p.state === 'puffed' ? 'deadly' : rule.touch
      this.hurtBubble(b, touch, p)
      if (!b.alive) return
    }
  }

  /** The sock snake: its head bites, its tail can be nibbled. Returns true when the last sock goes. */
  private touchSock(b: Bubble, p: Pest): boolean {
    const r = this.radiusOf(b)
    const tail = p.segs[p.segs.length - 1]
    if (tail && p.segs.length > 1 && dist(tail, b) < r + PESTS.sock.radius) {
      p.segs.pop()
      this.addScore(PESTS.sock.points * this.chainUp(), tail.x, tail.y - 10)
      this.grow(b, 2)
      this.sound.play('pop')
      this.fx.burst(tail.x, tail.y, this.fxRng, { count: 6 })
      return false
    }
    if (dist(p, b) < r + PESTS.sock.radius) {
      if (b.giant || p.segs.length <= 1) {
        this.addScore(PESTS.sock.points * 3 * this.chainUp(), p.x, p.y - 10)
        this.grow(b, 2)
        this.sound.play('pop')
        return true
      }
      if (b.invuln <= 0 && this.flee <= 0) this.hurtBubble(b, 'hit', p)
    }
    return false
  }

  /** Is the bubble behind the brush (against the way it is heading)? */
  private behind(br: Pest, b: Bubble) {
    const dx = b.x - br.x
    const dy = b.y - br.y
    const d = Math.hypot(dx, dy) || 1
    return (Math.cos(br.heading) * dx + Math.sin(br.heading) * dy) / d < -0.15
  }

  /**
   * A pest touched the bubble. Growth is health: a soak takes a stage, a hit
   * on a big bubble splashes off two, and a hit on a small one pops it. A
   * Sturdy Film or Super Suds takes the hit instead.
   */
  private hurtBubble(b: Bubble, touch: Touch, from: Point) {
    if (b.invuln > 0 || b.giant) return
    const a = Math.atan2(b.y - from.y, b.x - from.x)
    const knock = () => {
      b.vx = Math.cos(a) * 3
      b.vy = Math.sin(a) * 3
    }
    if (touch === 'bounce') {
      // An armoured shell (or a calm pufferfish): just a shove.
      knock()
      return
    }
    if (b.superTicks > 0 || this.shield > 0) {
      if (b.superTicks > 0) {
        b.superTicks = 0
        b.stage = b.superFrom
      } else this.shield--
      b.invuln = 90
      b.hurt = 20
      knock()
      this.sound.play('warn')
      this.floaters.push({
        x: b.x,
        y: b.y - 20,
        text: 'SAVED!',
        life: 45,
        color: RAMPS.teal[4],
      })
      return
    }
    if (touch === 'soak') {
      if (b.stage > 1) b.stage--
      b.growth = 0
      b.invuln = 60
      b.hurt = 30
      knock()
      this.sound.play('warn')
      this.floaters.push({
        x: b.x,
        y: b.y - 20,
        text: 'SOAKED!',
        life: 45,
        color: RAMPS.gold[3],
      })
      return
    }
    if (touch === 'hit' && b.stage >= 3) {
      b.stage -= 2
      b.growth = 0
      b.invuln = 90
      b.hurt = 40
      knock()
      this.burst(b.x, b.y, 12, '#e0f2fe')
      this.sound.play('pop')
      this.floaters.push({
        x: b.x,
        y: b.y - 20,
        text: 'SPLASH!',
        life: 45,
        color: RAMPS.water[4],
      })
      return
    }
    this.popBubble(b)
  }

  private popBubble(b: Bubble) {
    if (this.mode === 'sumo') {
      b.alive = false
      b.out = true
      this.burst(b.x, b.y, 30, SEAT_COLOURS[b.seat]!)
      this.sound.play('die')
      return
    }
    // A merged bubble pops everyone inside it, for one bubble off the shared count.
    for (const seat of b.members) {
      const m = this.bubbles[seat]!
      Object.assign(m, { alive: false, host: null, respawn: 100 + seat * 20 })
    }
    b.members = []
    b.alive = false
    this.lives = Math.max(0, this.lives - 1)
    this.basinPops++
    b.respawn = 100
    b.power = null
    b.superTicks = 0
    this.burst(b.x, b.y, 30, '#e0f2fe')
    this.sound.play('die')
    if (this.lives <= 0 && !this.bubbles.some((o) => o.alive))
      this.banner = { text: 'GAME OVER', ticks: 9999 }
  }

  /** Where a seat's bubble starts: side by side across the basin's start. */
  private seatStart(seat: number): Point {
    const s = this.basin.start
    if (this.seats === 1) return { ...s }
    const at = { x: s.x + (seat - (this.seats - 1) / 2) * 30, y: s.y }
    keepInside(this.basin, at, 18, 0)
    return at
  }

  private revive(b: Bubble) {
    const at = this.seatStart(b.seat)
    Object.assign(b, {
      host: null,
      members: [],
      mergeCool: 60,
      x: at.x,
      y: at.y,
      vx: 0,
      vy: 0,
      stage: Math.max(this.upgrades.stage2 ? 2 : 1, b.stage - 1),
      growth: 0,
      alive: true,
      invuln: 120,
      hurt: 0,
    })
  }

  private addScore(points: number, x?: number, y?: number) {
    if (this.demo || points <= 0) return
    this.score += points
    if (x !== undefined && y !== undefined) {
      this.floaters.push({ x, y, text: String(points), life: 50 })
    }
    if (this.score >= this.nextExtra) {
      this.lives++
      this.nextExtra += EXTRA_LIFE_EVERY
      this.sound.play('extra')
      this.banner = { text: 'EXTRA BUBBLE!', ticks: 90 }
    }
  }

  private burst(x: number, y: number, count: number, color: string) {
    // Cosmetic: the burst's dice are the sparkles' own, never the game's rng.
    const rand = this.fxRng
    for (let i = 0; i < count; i++) {
      const a = rand() * Math.PI * 2
      const s = 0.5 + rand() * 2
      this.pops.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 25 + Math.floor(rand() * 20),
        color,
      })
    }
  }

  private updateEffects() {
    this.fx.update()
    for (const p of this.pops) {
      p.x += p.vx
      p.y += p.vy
      p.vx *= 0.93
      p.vy *= 0.93
      p.life--
    }
    this.pops = this.pops.filter((p) => p.life > 0)
    for (const f of this.floaters) {
      f.y -= 0.35
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
  }

  // --- the Soap Shop -------------------------------------------------------------

  private owns(item: ShopItem): boolean {
    if (item.id === 'puff') return this.upgrades.puff
    if (item.id === 'stage2') return this.upgrades.stage2
    if (item.id === 'rainbow' || item.id === 'starry' || item.id === 'frosted')
      return this.skins.has(item.id)
    return false
  }

  /** The next room's golden soap hint (or the boss's room when a boss is next). */
  private nextHint(): string {
    for (let i = this.stepIndex + 1; i < this.steps.length; i++) {
      const s = this.steps[i]!
      if (s.kind !== 'basin') continue
      const room = ROOMS[s.room]!
      if (this.golden.has(room.id)) continue
      return `${room.name}: ${room.hint}`
    }
    return 'NO GOLDEN SOAP LEFT TO FIND HERE'
  }

  private updateShop(input: InputFrame) {
    const s = this.shop!
    s.t++
    const n = SHOP_ITEMS.length
    if (input.pressed.up) {
      s.cursor = (s.cursor + n - 1) % n
      s.message = ''
      this.sound.play('blip')
    }
    if (input.pressed.down) {
      s.cursor = (s.cursor + 1) % n
      s.message = ''
      this.sound.play('blip')
    }
    if (input.pressed.a && s.t > 20) this.buy(SHOP_ITEMS[s.cursor]!)
    if (
      this.shop &&
      (input.pressed.b || input.pressed.start || s.t > SHOP_CLOSE)
    )
      this.leaveShop()
  }

  private buy(item: ShopItem) {
    const s = this.shop!
    if (item.id === 'done') {
      this.leaveShop()
      return
    }
    if (this.owns(item)) {
      if (
        item.id === 'rainbow' ||
        item.id === 'starry' ||
        item.id === 'frosted'
      ) {
        this.skin = this.skin === item.id ? 'plain' : item.id
        s.message =
          this.skin === 'plain'
            ? 'BACK TO THE PLAIN FILM'
            : `WEARING ${item.name}`
        this.sound.play('blip')
      } else s.message = 'ALREADY YOURS'
      return
    }
    if (item.id === 'sturdy' && this.shield > 0) {
      s.message = 'YOUR FILM IS ALREADY STURDY'
      return
    }
    if (this.bars < item.price) {
      s.message = 'NOT ENOUGH SOAP BARS'
      this.sound.play('warn')
      return
    }
    this.bars -= item.price
    this.sound.play('pickup')
    switch (item.id) {
      case 'spare':
        this.lives++
        s.message = 'ONE MORE BUBBLE'
        break
      case 'puff':
        this.upgrades.puff = true
        s.message = 'PUFF, PUFF, AWAY!'
        break
      case 'stage2':
        this.upgrades.stage2 = true
        s.message = 'EVERY BASIN STARTS AT SIZE 2'
        break
      case 'sturdy':
        this.shield = 1
        s.message = 'THE NEXT HIT IS FREE'
        break
      case 'hint':
        s.message = this.nextHint()
        break
      default:
        this.skins.add(item.id as SkinId)
        this.skin = item.id as SkinId
        s.message = `WEARING ${item.name}`
    }
  }

  private leaveShop() {
    this.shop = null
    this.sound.play('start')
    this.advance()
  }

  /** The attract pilot's shopping: a spare bubble when it can, then back to work. */
  private shopPilot(): InputFrame {
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
    const s = this.shop!
    if (s.t % 15 !== 0 || s.t < 40) return frame
    const want = this.bars >= 6 ? 0 : SHOP_ITEMS.length - 1
    if (s.cursor !== want) frame.pressed.down = true
    else frame.pressed.a = true
    return frame
  }

  // --- attract-mode pilot --------------------------------------------------------

  /**
   * Where to go to push `obj` (radius objR) toward `target`: round behind it first (working it
   * along the wall when the wall is in the way), then on through it.
   */
  private pushGoal(b: Bubble, obj: Point, objR: number, target: Point) {
    const r = this.radiusOf(b)
    const base = Math.atan2(obj.y - target.y, obj.x - target.x)
    const reach = r + objR + 3
    for (const turn of [0, 0.5, -0.5, 1, -1, 1.5, -1.5, 2, -2, 2.4, -2.4]) {
      const at = {
        x: obj.x + Math.cos(base + turn) * reach,
        y: obj.y + Math.sin(base + turn) * reach,
      }
      if (!insideBasin(this.basin, at.x, at.y, r * 0.7)) continue
      const pushing = dist(at, b) <= 9
      const through = {
        x: obj.x + (obj.x - at.x) * 3,
        y: obj.y + (obj.y - at.y) * 3,
      }
      return { goal: pushing ? through : at, pushing }
    }
    return { goal: null as Point | null, pushing: false }
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
    // On the menu or a result card, the pilot just presses on.
    if (this.menu || this.result) {
      frame.pressed.a = this.tick % 30 === 0
      return frame
    }
    if (this.shop) return this.shopPilot()
    const b = this.bubble
    if (!b.alive) return frame
    const r = this.radiusOf(b)
    let goal: Point | null = null
    let pushing = false
    if (this.drainOpenFor(b)) goal = this.basin.drain
    else if (this.boss) goal = this.boss.goal(b, r, this.bossHost())
    if (!goal && this.plan.special === 'dish-stack') {
      let best = Infinity
      for (const p of this.plates) {
        const d = dist(p, b)
        if (p.dirt > 0 && d < best) {
          best = d
          goal = p
        }
      }
    }
    if (!goal && this.plan.special === 'duck-roundup') {
      // Get behind the nearest loose duck and push it toward the pen.
      let best = Infinity
      let duck: Duck | null = null
      for (const d of this.ducks) {
        const dd = dist(d, b)
        if (!d.penned && !d.home && dd < best) {
          best = dd
          duck = d
        }
      }
      if (duck) ({ goal, pushing } = this.pushGoal(b, duck, DUCK_R, DUCK_PEN))
    }
    if (!goal && this.plan.special === 'odd-socks' && this.socks.length) {
      // Push the nearest sock at its match.
      const sock = this.socks.reduce((a, k) =>
        dist(k, b) < dist(a, b) ? k : a,
      )
      const match = this.socks.find(
        (k) => k !== sock && k.colour === sock.colour,
      )
      if (match) ({ goal, pushing } = this.pushGoal(b, sock, 9, match))
    }
    if (!goal && this.car && !this.specialDone) {
      // Sit on the dirtiest panel.
      const car = this.car
      let worst = 0
      car.panels.forEach((dirt, i) => {
        if (dirt <= worst) return
        const px = car.x + 4 + (i % 3) * ((CAR.w - 8) / 3) + (CAR.w - 8) / 6
        const py =
          car.y + 4 + Math.floor(i / 3) * ((CAR.h - 8) / 2) + (CAR.h - 8) / 4
        if (!insideBasin(this.basin, px, py, r)) return
        worst = dirt
        goal = { x: px + CAR.speed * 20, y: py }
      })
    }
    if (!goal) {
      const float = this.floats.find((f) => dist(f, b) < 120)
      const food = this.nearestMess(b)
      if (float) goal = float
      else if (food && dist(food, b) < 140) goal = food
      else {
        if (
          --this.pilotRetarget <= 0 ||
          !this.pilotGoal ||
          !this.grime.isDirty(this.pilotGoal.x, this.pilotGoal.y)
        ) {
          this.pilotGoal = this.grime.nearestDirty(b.x, b.y) ?? food
          this.pilotRetarget = 20
        }
        goal = this.pilotGoal ?? food
      }
    }
    // Round the divider through the overflow gap when the goal is on the other side.
    if (goal && this.basin.gaps && !clearPath(this.basin, b, goal, r)) {
      let best = Infinity
      for (const gap of this.basin.gaps) {
        const d = dist(gap, b)
        if (d < best) {
          best = d
          goal = d < 12 ? goal : gap
        }
      }
    }
    let steerX = goal ? goal.x - b.x : 0
    let steerY = goal ? goal.y - b.y : 0
    const scale = Math.hypot(steerX, steerY) || 1
    steerX /= scale
    steerY /= scale
    // Lean against the water's push, so the current and the drum don't carry it off.
    const flow = flowAt(this.basin, b.x, b.y, this.spin, b.stage)
    steerX -= flow.x * 12
    steerY -= flow.y * 12
    // Shy away from anything that could pop or soak the bubble.
    const threats: Point[] = []
    if (this.flee <= 0 && b.superTicks <= 0 && !b.giant) {
      for (const p of this.pests) {
        if (p.kind === 'strider' && p.state === 'tell') {
          // Off the ripple line before it skates.
          const [a, c] = p.segs
          for (let k = 0; k <= 1; k += 0.1)
            threats.push({
              x: a!.x + (c!.x - a!.x) * k,
              y: a!.y + (c!.y - a!.y) * k,
            })
          continue
        }
        if (!this.solid(p)) continue
        const rule = PESTS[p.kind]
        if (
          rule.touch === 'bounce' &&
          !(p.kind === 'puffer' && p.state !== 'roam')
        )
          continue
        if (p.kind === 'lint' && p.size <= r) continue
        if (rule.edibleFrom && b.stage >= rule.edibleFrom) continue
        if (p.kind === 'brush' && p.state === 'tipped') continue
        threats.push(p)
        if (p.kind === 'spinner' || p.kind === 'strider')
          for (let k = 8; k <= 40; k += 8)
            threats.push({ x: p.x + p.vx * k, y: p.y + p.vy * k })
        if (p.kind === 'sock') threats.push(...p.segs.slice(1, -1))
      }
      const roll = this.roller
      const belt = this.basin.physics
      if (
        roll &&
        belt.kind === 'conveyor' &&
        (roll.tell > 0 || roll.x !== null)
      ) {
        const laneH = (belt.bottom - belt.top) / belt.lanes
        const y = belt.top + roll.lane * laneH + laneH / 2
        threats.push({ x: b.x, y }, { x: b.x - 20, y }, { x: b.x + 20, y })
      }
    }
    const gurgling = this.pests.some(
      (p) =>
        p.kind === 'gremlin' &&
        (p.state === 'gurgle' || (p.state === 'hidden' && p.t < 40)),
    )
    if (gurgling) threats.push(this.basin.drain)
    if (this.boss) threats.push(...this.boss.threats())
    if (this.boss instanceof Bristleton) {
      // A suds ring coming: slide round to the nearer of its gaps.
      for (const ring of this.boss.rings) {
        const d = dist(ring, b)
        if (d - ring.r < -4 || d - ring.r > 90) continue
        const a = Math.atan2(b.y - ring.y, b.x - ring.x)
        let off = a - ring.gap
        while (off > Math.PI / 2) off -= Math.PI
        while (off < -Math.PI / 2) off += Math.PI
        if (Math.abs(off) < RING_GAP * 0.5) continue
        const side = off > 0 ? -1 : 1
        steerX += -Math.sin(a) * side * 1.5
        steerY += Math.cos(a) * side * 1.5
      }
    }
    let closest = Infinity
    let fleeX = 0
    let fleeY = 0
    for (const t of threats) {
      const d = dist(t, b) || 1
      if (d < 70) {
        steerX += (((b.x - t.x) / d) * (70 - d)) / 25
        steerY += (((b.y - t.y) / d) * (70 - d)) / 25
      }
      if (d < closest) {
        closest = d
        fleeX = (b.x - t.x) / d
        fleeY = (b.y - t.y) / d
      }
    }
    // Slug trail: steer round the nearest blob of it.
    for (const t of this.trail) {
      const d = dist(t, b) || 1
      if (d < r + 14) {
        steerX += ((b.x - t.x) / d) * 0.4
        steerY += ((b.y - t.y) / d) * 0.4
      }
    }
    // Something about to touch: puff clear of it, along the wall if the wall is behind.
    if (closest < r + 26 && b.puff === 0) {
      const ahead = { x: b.x + fleeX * 30, y: b.y + fleeY * 30 }
      if (!insideBasin(this.basin, ahead.x, ahead.y, r)) {
        const side = fleeX * steerY - fleeY * steerX >= 0 ? 1 : -1
        const fx = -fleeY * side
        fleeY = fleeX * side
        fleeX = fx
      }
      steerX = fleeX * 2
      steerY = fleeY * 2
      held.a = true
      frame.pressed.a = true
    } else if (pushing && b.puff === 0 && this.tick % 40 === 0) {
      held.a = true
      frame.pressed.a = true
    }
    // Trap a pest lined up ahead, while there is size to spare (never while saving up for a bump).
    // A hunting brush close by is worth turning to face and trapping at size 3.
    if (b.stage >= 3 && !b.giant) {
      for (const p of this.pests) {
        // In a boss fight, only its mini-brushes are worth a shot.
        if (this.boss && p.kind !== 'minibrush') continue
        if (!this.solid(p) || !PESTS[p.kind].trappable || p.kind === 'mite')
          continue
        if (p.kind === 'brush' && p.state === 'tipped') continue
        if (PESTS[p.kind].edibleFrom && b.stage >= PESTS[p.kind].edibleFrom!)
          continue
        const d = dist(p, b)
        const hunter =
          p.kind === 'brush' || p.kind === 'minibrush' || p.kind === 'leafboat'
        if (d > 110 || d < 1 || (b.stage < 4 && !hunter)) continue
        if (((p.x - b.x) * b.faceX + (p.y - b.y) * b.faceY) / d > 0.9) {
          held.b = true
          frame.pressed.b = this.tick % 20 === 0
          break
        }
        if (hunter && d < 90 && b.puff > 0) {
          // Turn to face it for the shot.
          steerX = (p.x - b.x) / d
          steerY = (p.y - b.y) / d
          break
        }
      }
    }
    const lead = 0.3
    if (steerX < -lead) held.left = true
    if (steerX > lead) held.right = true
    if (steerY < -lead) held.up = true
    if (steerY > lead) held.down = true
    return frame
  }

  // --- render ------------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    if (this.ending) {
      this.renderEnding(g, this.ending)
      return
    }
    this.renderBackdrop(g)
    renderBasin(g, this.basin, this.tick, this.drumAngle)
    this.grimeLayer.draw(g, this.grime, this.basin)
    for (const s of this.plan.slicks ?? []) renderSlick(g, s, this.tick)
    if (this.plan.special === 'duck-roundup') this.renderPen(g)
    renderFaucet(g, this.basin)
    renderDial(g, this.basin, this.tick)
    const gurgle = this.pests.some(
      (p) => p.kind === 'gremlin' && p.state === 'gurgle',
    )
    renderDrain(
      g,
      this.basin,
      this.tick,
      this.bubbles.some((b) => b.alive && this.drainOpenFor(b)),
      gurgle ? 1 : 0,
    )
    for (const t of this.trail) renderTrail(g, t.x, t.y, t.life)
    for (const sp of this.splashes) renderSplash(g, sp.x, sp.y, sp.life)
    if (this.car)
      renderCar(
        g,
        this.car.x,
        this.car.y,
        CAR.w,
        CAR.h,
        this.car.panels,
        this.tick,
      )
    for (const m of this.mess) this.renderMess(g, m)
    for (const k of this.socks) renderSock(g, k.x, k.y, k.colour, k.a, 1)
    for (const p of this.pests)
      if (p.kind === 'strider' && p.state === 'tell')
        renderStriderLine(
          g,
          p.segs[0]!,
          p.segs[1]!,
          1 - p.t / STRIDER_TELL,
          this.tick,
        )
    for (const p of this.plates)
      renderPlate(g, p.x, p.y, PLATE_R, p.dirt, PLATE_SPOTS.length)
    for (const d of this.drips) drawSprite(g, DRIP_SPRITE, d.x, d.y)
    for (const p of this.pests) if (!p.trap) this.renderPest(g, p)
    if (this.plan.shadows) renderRack(g, this.plan.shadows)
    this.renderMachinery(g)
    for (const d of this.ducks)
      renderDuck(g, d.x, d.y, this.tick, d.penned, d.vx > 0.05)
    for (const f of this.floats)
      renderFloat(g, f.kind, f.x, f.y, this.tick, f.life)
    if (this.boss) {
      // The brush and its rings dip under the rim rather than over the floor.
      g.save()
      clipBasin(g, this.basin)
      this.boss.render(g, this.tick)
      g.restore()
    }
    for (const p of this.pests) {
      if (!p.trap) continue
      this.renderPest(g, p)
      renderTrap(g, p.x, p.y, this.pestR(p) + 6, this.tick)
    }
    for (const s of this.shots) renderShot(g, s.x, s.y, SHOT_R, this.tick)
    for (const p of this.pops) {
      g.globalAlpha = Math.max(0, p.life / 45)
      g.fillStyle = INK
      g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 3, 3)
      g.fillStyle = p.color
      g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 2, 2)
    }
    g.globalAlpha = 1
    for (const b of this.bubbles) this.renderOneBubble(g, b)
    // Leaves float over the water: cover for a bubble underneath.
    for (const l of this.leaves) {
      g.save()
      g.globalAlpha = 0.85
      renderLeaf(g, l.x, l.y, 15, l.a, l.tone)
      g.restore()
    }
    if (
      this.plan.rain &&
      !(this.plan.special === 'rain-race' && this.specialDone)
    )
      renderRain(g, this.tick, (this.plan.rain ?? 99) < 30)
    this.fx.render(g)
    for (const f of this.floaters) {
      drawText(g, f.text, f.x, f.y, {
        align: 'center',
        color: f.color ?? RAMPS.gold[3],
        outline: INK,
      })
    }
    vignette(g, W, H, 0.3)
    this.renderHud(g)
    if (this.shop) {
      renderShop(g, {
        items: SHOP_ITEMS,
        cursor: this.shop.cursor,
        bars: this.bars,
        owned: (item) => this.owns(item),
        wearing: (item) => item.id === this.skin,
        message: this.shop.message,
        golden: this.golden.size,
        goldenTotal: GOLDEN_ROOMS.length,
        tick: this.tick,
      })
    }
    if (this.offer) this.renderOffer(g, this.offer)
    if (this.menu) {
      if (this.menu.board) renderBoard(g, this.boardRows(), this.tick)
      else {
        const modes = this.modes()
        const pick = this.squeakyPicks()[this.menu.pick] ?? {
          room: 0,
          basin: 0,
        }
        const room = ROOMS[pick.room]!
        const key = medalKey(room.id, pick.basin)
        const best = this.times[key]
        renderMenu(g, {
          modes,
          mode: this.menu.mode,
          row: 0,
          rows:
            modes[this.menu.mode]?.id === 'squeaky'
              ? ['mode', 'room']
              : ['mode'],
          room: `${room.name}: ${room.basins[pick.basin]!.title}`,
          basin: pick.basin,
          best: best ? `${(best / 60).toFixed(1)} S` : null,
          seats: this.seats,
          tick: this.tick,
        })
      }
    }
    if (this.result)
      renderResult(g, this.result.title, this.result.lines, this.result.t > 90)
  }

  private renderBackdrop(g: CanvasRenderingContext2D) {
    const b = this.basin
    switch (this.backdrop) {
      case 'bath':
        renderBathroom(g, b)
        return
      case 'laundry':
        renderLaundry(g, b)
        return
      case 'aquarium':
        renderAquarium(g, b)
        return
      case 'garden':
        renderGarden(g, b)
        return
      case 'carwash':
        renderCarWash(g, b)
        return
      case 'plaza':
        renderPlaza(g, b)
        return
      case 'palace':
        renderPalace(g, b)
        return
      default:
        renderKitchen(g, b)
    }
  }

  /** Car-wash rollers and wax jets. */
  private renderMachinery(g: CanvasRenderingContext2D) {
    const r = this.roller
    const belt = this.basin.physics
    if (r && belt.kind === 'conveyor') {
      const box = basinBounds(this.basin)
      const laneH = (belt.bottom - belt.top) / belt.lanes
      const y0 = belt.top + r.lane * laneH
      g.save()
      clipBasin(g, this.basin)
      renderRoller(g, box.x0, box.x1, y0, y0 + laneH, r.tell, r.x, this.tick)
      g.restore()
    }
    if (this.plan.jets) {
      const { puff, warn } = this.jetPhase()
      for (const jet of this.plan.jets)
        renderJet(g, jet, this.basin.drain, puff, warn, this.tick)
    }
  }

  private renderEnding(
    g: CanvasRenderingContext2D,
    e: { kind: EndingKind; t: number },
  ) {
    if (e.kind === 'true') renderTrueEnding(g, e.t)
    else renderCleanEnding(g, e.t)
    const title =
      e.kind === 'true'
        ? 'THE WHOLE HOUSE SHINES'
        : 'THE BIG HOUSE WASH IS DONE'
    const lines = [
      ...CREDITS,
      '',
      e.kind === 'true'
        ? 'EVERY GOLDEN SOAP FOUND!'
        : `GOLDEN SOAPS ${this.golden.size}/${GOLDEN_ROOMS.length}`,
      e.kind === 'true' || this.allGolden
        ? ''
        : 'FIND THEM ALL TO OPEN THE PALACE',
      'DEEP CLEAN IS OPEN',
    ]
    renderCredits(g, lines, e.t, title)
    if (e.t > 120)
      drawText(g, `SCORE ${this.score}`, W / 2, 34, {
        align: 'center',
        color: RAMPS.gold[3],
        outline: INK,
      })
  }

  /** The medal board's rows: every room but the palace, four basins each. */
  private boardRows() {
    return ROOMS.filter((r) => !r.secret).map((r) => ({
      name: r.name,
      medals: [0, 1, 2, 3].map((i) => this.medals[medalKey(r.id, i)] ?? 0),
    }))
  }

  private renderOneBubble(g: CanvasRenderingContext2D, b: Bubble) {
    if (!b.alive || b.host !== null) return
    if (b.invuln > 0 && Math.floor(b.invuln / 6) % 2 === 0) return
    const base = this.radiusOf(b)
    const r =
      this.draining > 0 ? base * Math.max(0.1, 1 - this.draining / 70) : base
    dropShadow(g, b.x + r * 0.35, b.y + r * 0.95, r * 0.8, r * 0.28, 0.3)
    if (b.superTicks > 0) {
      g.strokeStyle =
        Math.floor(this.tick / 4) % 2 ? RAMPS.gold[4] : RAMPS.sky[4]
      g.beginPath()
      g.arc(b.x, b.y, r + 3, 0, Math.PI * 2)
      g.stroke()
    }
    if (this.shield > 0 && b.seat === 0) {
      g.strokeStyle = 'rgba(255, 255, 255, 0.5)'
      g.beginPath()
      g.arc(b.x, b.y, r + 2, 0, Math.PI * 2)
      g.stroke()
    }
    const sp = Math.hypot(b.vx, b.vy)
    renderBubble(g, {
      x: b.x,
      y: b.y,
      r,
      wobble: b.wobble,
      stage: b.stage,
      hurt: b.hurt,
      lookX: sp > 0.3 ? b.vx / sp : b.faceX,
      lookY: sp > 0.3 ? b.vy / sp : b.faceY,
      tick: this.tick,
      tint: SKIN_TINTS[this.skin],
    })
    if (this.seats > 1) {
      // Whose bubble: a ring in the seat's colour and a tag for everyone inside.
      g.strokeStyle = SEAT_COLOURS[b.seat]!
      g.lineWidth = 2
      g.beginPath()
      g.arc(b.x, b.y, r + 2, 0, Math.PI * 2)
      g.stroke()
      g.lineWidth = 1
      const tag = [b.seat, ...b.members].map((seat) => `P${seat + 1}`).join('+')
      drawText(g, tag, b.x, b.y - r - 12, {
        align: 'center',
        color: SEAT_COLOURS[b.seat],
        outline: INK,
      })
    }
    if (this.skin === 'starry') {
      g.fillStyle = '#ffffff'
      for (let i = 0; i < 4; i++) {
        const a = i * 1.7 + this.tick / 40
        g.fillRect(
          Math.round(b.x + Math.cos(a) * r * 0.6),
          Math.round(b.y + Math.sin(a) * r * 0.6),
          1,
          1,
        )
      }
    }
    if (b.sticky) {
      g.fillStyle = 'rgba(155, 227, 107, 0.6)'
      g.fillRect(
        Math.round(b.x - r * 0.5),
        Math.round(b.y + r - 2),
        Math.round(r),
        2,
      )
    }
    if (b.power?.kind === 'duck') {
      const at = this.guardAt(b)
      renderGuard(g, at.x, at.y, this.tick)
    }
    if (b.power?.kind === 'magnet') {
      g.strokeStyle = `rgba(239, 68, 68, ${0.25 + 0.15 * Math.sin(this.tick / 5)})`
      g.beginPath()
      g.arc(b.x, b.y, r + 10 + ((this.tick / 2) % 12), 0, Math.PI * 2)
      g.stroke()
    }
  }

  private renderPen(g: CanvasRenderingContext2D) {
    g.save()
    g.fillStyle = `rgba(250, 204, 21, ${0.12 + 0.05 * Math.sin(this.tick / 10)})`
    g.beginPath()
    g.arc(DUCK_PEN.x, DUCK_PEN.y, DUCK_PEN.r, 0, Math.PI * 2)
    g.fill()
    g.strokeStyle = RAMPS.gold[3]
    g.setLineDash([5, 4])
    g.beginPath()
    g.arc(DUCK_PEN.x, DUCK_PEN.y, DUCK_PEN.r, 0, Math.PI * 2)
    g.stroke()
    g.setLineDash([])
    g.restore()
    const penned = this.ducks.filter((d) => d.penned).length
    drawText(g, `${penned}/5`, DUCK_PEN.x, DUCK_PEN.y - DUCK_PEN.r - 12, {
      align: 'center',
      color: RAMPS.gold[4],
      outline: INK,
    })
  }

  private renderMess(g: CanvasRenderingContext2D, m: Mess) {
    if (m.kind === 'grease') {
      const tilt = (m.x + m.y) % 3
      g.fillStyle = 'rgba(122, 44, 16, 0.55)'
      g.beginPath()
      g.ellipse(m.x, m.y, 7, 5, tilt, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = 'rgba(194, 84, 27, 0.6)'
      g.beginPath()
      g.ellipse(m.x - 1, m.y - 1, 5, 3, tilt, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = 'rgba(255, 224, 194, 0.8)'
      g.fillRect(Math.round(m.x) - 3, Math.round(m.y) - 2, 2, 1)
    } else {
      const sprite =
        (Math.round(m.x) + Math.round(m.y)) % 2 ? CRUMB_SPRITE : CEREAL_SPRITE
      drawSprite(g, sprite, m.x, m.y)
    }
  }

  private renderPest(g: CanvasRenderingContext2D, p: Pest) {
    const frame = Math.floor(this.tick / 6) % 2
    const scared = this.flee > 0 && !p.trap
    switch (p.kind) {
      case 'mite':
        dropShadow(g, p.x, p.y + 5, 5, 1.5, 0.3)
        drawSprite(g, MITE_SPRITES[frame]!, p.x, p.y, { flipX: p.vx < 0 })
        break
      case 'brush': {
        dropShadow(g, p.x, p.y + 9, 11, 2.5, 0.35)
        if (p.state === 'tipped') {
          drawSprite(g, BRUSH_TIPPED, p.x, p.y + 2)
          renderDizzy(g, p.x, p.y - 8, this.tick)
          return
        }
        const bob = Math.round(Math.sin(this.tick / 6) * 1.5)
        drawSprite(g, BRUSH_SPRITE, p.x, p.y + bob, {
          flipX: Math.cos(p.heading) < 0,
        })
        g.fillStyle = RAMPS.water[4]
        const f = Math.floor(this.tick / 4) % 3
        g.fillRect(Math.round(p.x) - 9 + f * 6, Math.round(p.y) + 8, 2, 1)
        g.fillRect(Math.round(p.x) + 5 - f * 4, Math.round(p.y) + 9, 1, 1)
        break
      }
      case 'minibrush':
        dropShadow(g, p.x, p.y + 5, 6, 1.5, 0.3)
        drawSprite(g, MINIBRUSH_SPRITE, p.x, p.y + (frame ? 1 : 0), {
          flipX: Math.cos(p.heading) < 0,
        })
        break
      case 'sponge':
        dropShadow(g, p.x, p.y + 7, 10, 2, 0.35)
        drawSprite(
          g,
          SPONGE_SPRITES[Math.floor(this.tick / 20) % 2]!,
          p.x,
          p.y,
          { flipX: p.vx < 0 },
        )
        break
      case 'loofah':
        dropShadow(g, p.x, p.y + 11, 14, 3, 0.35)
        drawSprite(
          g,
          LOOFAH_SPRITE,
          p.x,
          p.y + (Math.floor(this.tick / 24) % 2),
          { flipX: p.vx < 0 },
        )
        break
      case 'lint':
        dropShadow(g, p.x, p.y + p.size, p.size, 2, 0.3)
        renderLint(g, p.x, p.y, p.size, this.tick)
        break
      case 'sock':
        renderSockSnake(g, p.segs, this.tick)
        break
      case 'algae':
        renderAlgae(g, p.x, p.y, p.size / ALGAE_BLOOM, this.tick)
        break
      case 'snail':
        renderSnail(g, p.x, p.y, p.vx < 0, false)
        break
      case 'puffer':
        renderPuffer(
          g,
          p.x,
          p.y,
          p.state === 'puffed'
            ? 'puffed'
            : p.state === 'tell'
              ? 'tell'
              : 'calm',
          p.vx < 0,
          this.tick,
        )
        break
      case 'strider':
        if (p.state === 'roam') renderStrider(g, p.x, p.y, p.heading, this.tick)
        break
      case 'leafboat':
        renderLeafBoat(g, p.x, p.y, p.heading, this.tick)
        break
      case 'wax':
        renderWax(g, p.x, p.y, p.t / WAX_SET, p.state === 'set', this.tick)
        break
      case 'spinner':
        // Its line of travel shows faintly ahead: read the bounce.
        g.strokeStyle = 'rgba(239, 68, 68, 0.25)'
        g.beginPath()
        g.moveTo(p.x, p.y)
        g.lineTo(p.x + p.vx * 30, p.y + p.vy * 30)
        g.stroke()
        renderSpinner(g, p.x, p.y, p.heading)
        break
      case 'minion':
        renderMinion(g, p.x, p.y, this.tick)
        break
      case 'drop':
        renderDrop(g, p.x, p.y, this.tick)
        break
      case 'slug':
        dropShadow(g, p.x, p.y + 4, 6, 1.5, 0.3)
        drawSprite(g, SLUG_SPRITES[Math.floor(this.tick / 16) % 2]!, p.x, p.y, {
          flipX: p.vx < 0,
        })
        break
      default: {
        if (p.state === 'hidden') return
        if (p.state === 'gurgle') {
          // Eyes peering up through the grate.
          if (p.t < GURGLE_TICKS / 2) {
            g.fillStyle = RAMPS.gold[3]
            g.fillRect(Math.round(p.x) - 4, Math.round(p.y) - 1, 2, 2)
            g.fillRect(Math.round(p.x) + 2, Math.round(p.y) - 1, 2, 2)
          }
          return
        }
        dropShadow(g, p.x, p.y + 7, 6, 2, 0.3)
        drawSprite(g, GREMLIN_SPRITES[frame]!, p.x, p.y, { flipX: p.vx < 0 })
      }
    }
    if (scared && Math.floor(this.tick / 8) % 2 === 0) {
      g.fillStyle = RAMPS.sky[4]
      g.fillRect(Math.round(p.x) + 6, Math.round(p.y) - 10, 2, 3)
    }
  }

  private renderHud(g: CanvasRenderingContext2D) {
    hudPanel(g, 4, 3, 86, 31)
    drawText(g, String(this.score).padStart(6, '0'), 10, 6, {
      scale: 2,
      color: RAMPS.teal[4],
      shadow: INK,
    })
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, 10, 24, {
      color: RAMPS.gold[3],
      outline: INK,
    })
    const b = this.bubble
    // A power-up in hand, under the score.
    const power =
      b.power ??
      (b.superTicks > 0
        ? { kind: 'supersuds' as const, ticks: b.superTicks }
        : null)
    const lemon =
      this.flee > 0 ? { kind: 'lemon' as const, ticks: this.flee } : null
    const shown = power ?? lemon
    if (shown) {
      hudPanel(g, 4, 37, 86, 14, RAMPS.gold)
      renderIcon(g, shown.kind, 13, 44)
      gauge(
        g,
        24,
        41,
        60,
        5,
        shown.ticks / POWERS[shown.kind].ticks,
        RAMPS.gold,
      )
    }
    const lives = Math.min(this.lives, 5)
    if (lives > 0) {
      hudPanel(g, W - 8 - lives * 14, 3, lives * 14 + 4, 20)
      for (let i = 0; i < lives; i++)
        shadedOrb(g, W - 13 - i * 14, 13, 4.5, RAMPS.water)
    }
    hudPanel(g, W - 56, 26, 52, 15, RAMPS.pink)
    renderIcon(g, 'soap', W - 44, 33)
    drawText(g, String(this.bars), W - 10, 30, {
      align: 'right',
      color: RAMPS.cream[4],
      outline: INK,
    })
    if (this.chain >= 2) {
      hudPanel(g, W - 56, 44, 52, 15, RAMPS.purple)
      drawText(g, `CHAIN X${this.chain}`, W - 30, 48, {
        align: 'center',
        color: RAMPS.gold[4],
        outline: INK,
      })
    }
    if (this.boss && !this.boss.done) {
      const boss = this.boss
      hudPanel(g, W / 2 - 80, 3, 160, 17, RAMPS.ember)
      drawText(g, boss.name, W / 2 - 72, 8, { color: '#ffffff', outline: INK })
      for (let i = 0; i < boss.maxHp; i++)
        shadedOrb(
          g,
          W / 2 + 70 - (boss.maxHp - 1 - i) * 11,
          11,
          4,
          i < boss.hp ? RAMPS.gold : RAMPS.steel,
        )
      if (boss.hint)
        drawText(g, boss.hint, W / 2, 24, {
          align: 'center',
          color: RAMPS.gold[4],
          outline: INK,
        })
    }
    // A special basin's clock.
    if (
      !this.specialDone &&
      (this.plan.special === 'odd-socks' || this.plan.special === 'rain-race')
    ) {
      const label = this.plan.special === 'odd-socks' ? 'SPIN CYCLE' : 'SHOWER'
      hudPanel(g, W / 2 - 60, 3, 120, 15, RAMPS.sky)
      drawText(g, `${label} ${Math.ceil(this.specialTimer / 60)}`, W / 2, 7, {
        align: 'center',
        color: '#ffffff',
        outline: INK,
      })
    }
    if (!this.specialDone && this.plan.special === 'clean-goal')
      drawText(g, `GOAL ${this.plan.cleanGoal}% CLEAN`, W / 2, 7, {
        align: 'center',
        color: RAMPS.gold[4],
        outline: INK,
      })
    if (this.sumo) {
      hudPanel(g, W / 2 - 90, 3, 180, 17, RAMPS.pink)
      const left = Math.max(0, Math.ceil((SUMO.roundTicks - this.sumo.t) / 60))
      drawText(g, `ROUND ${this.sumo.round}  ${left}`, W / 2 - 82, 8, {
        color: '#ffffff',
        outline: INK,
      })
      this.sumo.wins.forEach((w, i) =>
        drawText(g, `${w}`, W / 2 + 30 + i * 14, 8, {
          color: SEAT_COLOURS[i],
          outline: INK,
        }),
      )
    }
    if (this.mode === 'squeaky') {
      hudPanel(g, W / 2 - 50, 3, 100, 15, RAMPS.gold)
      drawText(g, `${(this.basinTicks / 60).toFixed(1)} S`, W / 2, 7, {
        align: 'center',
        color: '#ffffff',
        outline: INK,
      })
    }
    const step = this.steps[this.stepIndex]
    const label =
      this.mode === 'sumo'
        ? 'SUMO'
        : this.mode === 'squeaky'
          ? 'TIMED'
          : this.inEndless
            ? `SINK ${this.level}`
            : step?.kind === 'boss'
              ? this.deep
                ? `BOSS +${this.deep}`
                : 'BOSS'
              : step?.kind === 'basin'
                ? `BASIN ${step.room + 1}-${step.basin + 1}`
                : 'SHOP'
    hudPanel(g, 4, H - 19, 58, 15)
    drawText(g, label, 33, H - 15, {
      align: 'center',
      color: RAMPS.purple[4],
      outline: INK,
    })
    // How clean the basin is: the Squeaky Clean bonus waits at 95%.
    const percent = this.grime.percent
    hudPanel(
      g,
      68,
      H - 19,
      114,
      15,
      percent >= SQUEAKY ? RAMPS.gold : RAMPS.purple,
    )
    drawText(g, 'CLEAN', 74, H - 15, { color: RAMPS.teal[4], outline: INK })
    gauge(
      g,
      108,
      H - 14,
      40,
      5,
      percent / 100,
      percent >= SQUEAKY ? RAMPS.gold : RAMPS.leaf,
    )
    drawText(g, `${percent}%`, 176, H - 15, {
      align: 'right',
      color: RAMPS.cream[3],
      outline: INK,
    })
    // Suds meter: the bubble's size, in five stages; the notches are what a soap shot costs.
    const filled =
      b.stage >= MAX_STAGE
        ? 1
        : (b.stage - 1 + b.growth / GROWTH_PER_STAGE) / (MAX_STAGE - 1)
    hudPanel(g, W - 152, H - 19, 148, 15)
    drawText(g, 'SUDS', W - 146, H - 15, { color: RAMPS.teal[4], outline: INK })
    gauge(
      g,
      W - 112,
      H - 15,
      102,
      7,
      filled,
      filled >= 1
        ? RAMPS.gold
        : b.stage >= SHOT_STAGE
          ? RAMPS.teal
          : RAMPS.water,
    )
    g.fillStyle = INK
    for (let i = 1; i < MAX_STAGE - 1; i++)
      g.fillRect(
        W - 112 + Math.round((102 * i) / (MAX_STAGE - 1)),
        H - 15,
        1,
        7,
      )
    if (this.banner && !this.shop) {
      drawText(g, this.banner.text, W / 2, H / 2 - 50, {
        scale: 3,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.teal[1],
      })
      if (this.banner.sub) {
        drawText(g, this.banner.sub, W / 2, H / 2 - 18, {
          scale: 2,
          align: 'center',
          color: RAMPS.gold[3],
          outline: INK,
        })
      }
    }
  }

  private renderOffer(g: CanvasRenderingContext2D, s: SudsSave) {
    g.fillStyle = 'rgba(20, 10, 38, 0.75)'
    g.fillRect(0, 0, W, H)
    hudPanel(g, 50, 96, W - 100, 150, RAMPS.teal)
    const step = this.steps[s.step]
    const where =
      step?.kind === 'boss'
        ? 'BRISTLETON'
        : step?.kind === 'basin'
          ? ROOMS[step.room]!.name
          : ''
    drawText(g, 'CONTINUE THE WASH?', W / 2, 110, {
      scale: 2,
      align: 'center',
      color: '#ffffff',
      outline: INK,
    })
    drawText(g, where, W / 2, 140, {
      scale: 2,
      align: 'center',
      color: RAMPS.gold[3],
      outline: INK,
    })
    drawText(
      g,
      `SCORE ${s.score}   BUBBLES ${s.lives}   SOAP ${s.bars}`,
      W / 2,
      172,
      {
        align: 'center',
        color: RAMPS.cream[3],
        outline: INK,
      },
    )
    drawText(g, `GOLDEN SOAP ${s.golden.length}/${ROOMS.length}`, W / 2, 188, {
      align: 'center',
      color: RAMPS.gold[4],
      outline: INK,
    })
    drawText(g, 'A CONTINUE    B NEW WASH', W / 2, 218, {
      align: 'center',
      color: RAMPS.teal[4],
      outline: INK,
    })
  }
}

function sinkGuide(): ArcadeGuidePage[] {
  return [
    {
      title: 'SIZE IS EVERYTHING',
      scale: 1,
      lines: [
        'CRUMBS, GREASE AND GRIME FEED THE BUBBLE: FIVE SIZES.',
        'A HIT SHRINKS A BIG BUBBLE TWO SIZES; IT POPS A SMALL ONE.',
        'FROM SIZE 3, B BLOWS A SOAP SHOT FOR ONE SIZE.',
        'A SHOT TRAPS A PEST: IT FLOATS TO THE DRAIN FOR 300 X CHAIN.',
        'EAT OR TRAP WITHIN A SECOND FOR X2, X3, X4.',
        'FULL SIZE LIGHTS THE DRAIN: SAIL DOWN IT.',
        'SCRUB THE BASIN 95% CLEAN FOR SQUEAKY CLEAN.',
      ],
    },
    {
      title: 'THE PESTS',
      scale: 1,
      lines: (Object.keys(PESTS) as PestKind[])
        .filter((k) => !PESTS[k].hidden)
        .flatMap((k) => [
          `${PESTS[k].name}: ${PESTS[k].tell}`,
          `  ${PESTS[k].answer}`,
        ]),
    },
    {
      title: 'FROM THE DRAIN',
      scale: 1,
      lines: [
        ...POWER_KINDS.map((k) => `${POWERS[k].name}: ${POWERS[k].does}`),
        'SOAP BARS: SPEND THEM IN THE SOAP SHOP',
        'BETWEEN ROOMS. BOSSES PAY FIVE.',
      ],
    },
    {
      title: 'THE BIG HOUSE WASH',
      scale: 1,
      lines: [
        'EVERY ROOM HAS FOUR BASINS. BASIN 3 IS SPECIAL:',
        'DO ITS JOB AND THE DRAIN OPENS.',
        "FINISH IT 95% CLEAN FOR THE ROOM'S GOLDEN SOAP.",
        ...ROOMS.filter((r) => !r.secret).map(
          (r) => `${r.name}: ${r.basins[2].title}`,
        ),
        'PROGRESS SAVES AT EVERY ROOM AND BOSS.',
      ],
    },
    {
      title: 'THE BOSSES',
      scale: 1,
      lines: [
        'BRISTLETON: BUMP THE HANDLE AT FULL SIZE.',
        '  WHEN IT SPINS, SLIP THROUGH THE RING GAPS.',
        'MOSSBACK: POP ITS ALGAE, FLOAT OVER ITS ROLL,',
        '  THEN SCRUB ITS MOSSY BACK AT FULL SIZE.',
        'THE GRIME KING: EAT HIS MINIONS, SWALLOW HIS',
        '  DROPS, THEN CARRY HIM DOWN THE DRAIN.',
        'ALL SIX GOLDEN SOAPS OPEN A SECRET ROOM.',
        'A CLEAR OPENS DEEP CLEAN: DIRTIER, FASTER.',
      ],
    },
    {
      title: 'MODES AND MEDALS',
      scale: 1,
      lines: [
        'BUBBLE BUDDIES (2-4): BUBBLES THAT TOUCH MERGE INTO',
        '  ONE BIG BUBBLE STEERED BY ALL. B SPLITS IT AGAIN.',
        'SUDS SUMO (2-4): BIG BUBBLES SHOVE SMALL ONES. THE',
        '  DRAIN SWALLOWS THE LOSER. TWO ROUNDS WINS.',
        'SQUEAKY CLEAN: ONE BASIN 95% CLEAN, AGAINST THE CLOCK.',
        'ENDLESS SINK: EVERY SHAPE, EVERY PEST, FOREVER.',
        'CLASSIC SINK: THE ORIGINAL KITCHEN SINK.',
        'MEDALS PER BASIN: SQUEAKY CLEAN, NO POP, QUICK RINSE.',
      ],
    },
  ]
}

const sinkSuds: ArcadeGameModule = {
  create: (options) => new SinkSuds(options),
  guide: () => sinkGuide(),
}

export const create = sinkSuds.create
export default sinkSuds
