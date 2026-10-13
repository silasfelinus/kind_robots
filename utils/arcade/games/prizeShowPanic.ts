// /utils/arcade/games/prizeShowPanic.ts
//
// Prize Show Panic -- the Kind Robots Arcade's Smash TV riff (conductor kr-arcade/t-009 game factory,
// depth slice 1 t-026). Sparkle, a contestant robot on a game show, plays a broadcast season: each
// episode is a map of studio rooms, and between rooms the season map shows where every door leads
// (a swarm, a prize vault, a trap, a sponsor challenge or a boss) with its danger and its prize, so
// the route is Sparkle's call. Every room runs its script from prizeShow/season.ts: which doors throw
// in which crashers when, and what is on the floor -- whoopee-cushion and banana-peel mines, a rig of
// spotlight beams swinging on a beat, a wall of live cameras. Confetti cannons make the crashers
// happy (they dance off the set), prizes drop for the grabbing, and the doors open once the room is
// clear: reach one before the host's countdown runs out. Golden tickets hide in vaults, behind a
// cracked wall and in sponsor challenges. The Parade Float is Opening Night's mid-boss; past half
// health its cake's candles light and fire volleys of sparks. After the last authored episode the
// season loops with harder curves and rolled room modifiers.
//
// Depth slice 2 (t-027) fills the studio: nineteen kinds of crasher (prizeShow/roster.ts, each with a
// tell and an answer), ten power-ups that stack with their own HUD timers (prizeShow/arsenal.ts), a
// boom mic that swoops down on a shadow, and true twin-stick aim.
//
// Depth slice 3 (t-028) makes it a broadcast (prizeShow/broadcast.ts): TINSEL the host and LENS the
// co-host cut in with original lines in bleep-speak, a ratings meter on the right wall rises with
// style and drains when idle or hit (four tiers, each a bigger score multiplier; Prime Time drops a
// sponsor's care package, Off Air brings a plot twist), cheer chains build a multiplier the host
// counts out, and between episodes the haul is tallied and can be traded at the Prize Swap. An
// APPLAUSE sign lights on the left wall and the studio audience cheers along the bottom.
//
// Depth slice 4 (t-029) adds episodes 2 and 3, each on its own set with its own look and music loop
// (prizeShow/music.ts). Cooking Showdown's kitchen has hot plates, conveyor counters and flour clouds;
// Countdown Concert keeps a beat for its speaker stacks (bass rings with a gap), strobes and mosh
// pits (prizeShow/hazards.ts). Bosses live in prizeShow/bosses.ts (their art in bossArt.ts): the Big
// Wobble now closes Opening Night, then the Pie Cart and the Souffle Supreme, the Mosh Mascot and
// the Jumbotron. LENS the co-host joins on episode 3.
//
// Depth slice 5 (t-032) finishes the season: episode 4, Galaxy Parade (low gravity, a turning ring
// round a solid hub, teleport doors; the Mothership and the Conga Dragon), then the Live Finale, one
// long run through every set to the host's own Prize Machine (a wheel of acts, then a dance-off).
// Ten golden tickets open the Grand Prize Vault and the true ending (every crasher joins the studio
// audience); either ending rolls the credits (prizeShow/credits.ts) and the season reruns, harder.
// The show is saved at each episode start (`save`) and offered back on the opening card.
//
// Depth slice 6 (t-033) adds four contestants (prizeShow/contestants.ts: Sparkle, Zippy, Boomer and
// Glimmer, each with her own colours and feel), picked on a card at the start, and co-op for up to
// four through the cabinet's `players` frames: each seat plays a contestant (the state below that
// reads as Sparkle's is the current contestant's), the crowd goes after whoever is nearest, a hit
// knocks one down for a moment from a shared pool of lives, and a bigger team meets more crashers
// and tougher bosses and shares its points. Twin-stick stays solo: co-op seats aim the way they
// move, or lock it with B. Between episodes, and halfway through the Live Finale, a commercial break
// (prizeShow/commercials.ts) plays one of four mini-games for prizes.
//
// The arrows move (eight ways) and A fires confetti the way Sparkle faces.
// Hold B to lock the aim while moving, the single-stick stand-in for the
// classic's twin sticks: strafe one way, spray another. With a second stick
// (the right stick, the on-screen aim stick, or the arrows while WASD moves)
// Sparkle sprays wherever it points. On the map the arrows pick a door and
// A goes through it.

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
import { emptyInput } from '../types'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'
import {
  CAMERA_SPRITES,
  CAR_SPRITE,
  CASH_SPRITE,
  TOASTER_SPRITE,
  CUSHION_SPRITES,
  FLASH_SPRITES,
  MAP_ICONS,
  PEEL_SPRITE,
  SPARK_SPRITES,
  TICKET_ICON,
  TICKET_ICON_EMPTY,
  TICKET_SPRITE,
  audienceSprites,
} from '../prizeShow/art'
import {
  ARSENAL,
  POWER_KINDS,
  POWERS,
  powerFromRoll,
  stackPower,
} from '../prizeShow/arsenal'
import type { PowerKind } from '../prizeShow/arsenal'
import {
  CHAIN_WINDOW,
  CLOCK_BONUS_CAP,
  COHOST_FROM_EPISODE,
  COHOST_LINES,
  COHOST_NAME,
  HOST_LINES,
  HOST_NAME,
  RATINGS,
  STARTING_POWERS,
  SWAP_OFFERS,
  TIERS,
  affordable,
  bleepSpeak,
  chainMilestone,
  chainMultiplier,
  emptyWallet,
  seasonRows,
  tallyRows,
  tierOf,
  wrapLine,
} from '../prizeShow/broadcast'
import type {
  Cue,
  SwapId,
  TallyRow,
  Voice,
  Wallet,
} from '../prizeShow/broadcast'
import {
  COHOST_PORTRAIT,
  HOST_PORTRAIT,
  PACKAGE_SPRITE,
} from '../prizeShow/hostArt'
import {
  BOSS,
  BOSS_OUTRO,
  bossAim,
  bossDangers,
  bossTargetAt,
  candleClock as floatCandles,
  damageBoss as strikeBoss,
  newBoss,
  updateBoss as runBoss,
} from '../prizeShow/bosses'
import type { Boss, BossPrize, BossWorld } from '../prizeShow/bosses'
import { renderBoss as drawBoss } from '../prizeShow/bossArt'
import {
  FLOUR,
  RING,
  beltDir,
  beltPush,
  beatPhase,
  driftFlour,
  inFlour,
  inGap,
  newFlour,
  newRing,
  onPlate,
  pitShove,
  plateState,
  ringHits,
  ringLive,
  speakerFires,
  speakerGap,
  speakerShot,
  speakerUntil,
} from '../prizeShow/hazards'
import type { Flour, Pit, Ring } from '../prizeShow/hazards'
import {
  BOSS_MUSIC,
  ENDING_MUSIC,
  FINALE_MUSIC,
  JINGLE_MUSIC,
  SET_MUSIC,
} from '../prizeShow/music'
import {
  ENDINGS,
  ENDING_LINES,
  VAULT_CHEERS,
  creditLines,
} from '../prizeShow/credits'
import type { EndingKind } from '../prizeShow/credits'
import {
  CONTESTANTS,
  CONTESTANT_IDS,
  SEAT_COLOURS,
} from '../prizeShow/contestants'
import type { ContestantId } from '../prizeShow/contestants'
import {
  BREAK_ORDER,
  breakDone,
  breakPilot,
  newBreak,
  renderBreak,
  updateBreak,
} from '../prizeShow/commercials'
import type { BreakState } from '../prizeShow/commercials'
import { renderSeasonMap } from '../prizeShow/mapScreen'
import {
  MEDALS,
  MENU,
  MENU_AUTO,
  RERUN_LOOP,
  drawMedal,
  marathonLeg,
  marathonLoop,
  readMedals,
  remixScript,
  renderModeCard,
  unlocked,
} from '../prizeShow/modes'
import type {
  MedalBoard,
  MedalId,
  MenuState,
  ShowMode,
} from '../prizeShow/modes'
import type { MapOption } from '../prizeShow/mapScreen'
import {
  CONCERT_BEAT,
  DROP_RATE,
  MODIFIERS,
  PRIZE_VAULT,
  VAULT_TICKETS,
  REWARD_RANK,
  ROOM_ICON,
  SEASON,
  SEASON_TICKETS,
  doorSides,
  seasonTickets,
  exitsOf,
  loopTuning,
  noCrashers,
  rollModifier,
  roomById,
  waveCount,
  wavesAt,
} from '../prizeShow/season'
import {
  CRASHER_KINDS,
  ROSTER,
  TELLS,
  burstPopper,
  craneCharging,
  deflects,
  mountCrane,
  newCrasher,
  reachOf,
  shootable,
  touches,
  updateCrasher,
} from '../prizeShow/roster'
import type {
  Crasher,
  CrasherKind,
  CrasherWorld,
  FlightCase,
  ShotStyle,
} from '../prizeShow/roster'
import { CASE_ROWS, ROSTER_EXTRAS, ROSTER_ROWS } from '../prizeShow/rosterArt'
import {
  BOTTOM,
  CX,
  CY,
  DOOR,
  DOORS,
  H,
  HUD,
  LEFT,
  RIGHT,
  SPEED,
  TOP,
  W,
  WALL,
  clampX,
  clampY,
} from '../prizeShow/stage'
import type { Point } from '../prizeShow/stage'
import type { MusicLoop } from '../sound'
import type {
  BeltProp,
  Episode,
  HotPlateProp,
  SetId,
  SpeakerProp,
  TurntableProp,
  WarpProp,
  LoopTuning,
  ModifierId,
  PrizeKind,
  RoomScript,
  Side,
  Wave,
} from '../prizeShow/season'

const CRASHER_TOP_SPEED = SPEED * 0.95
const HALF = 5
const SHOT_SPEED = 4.5
const SHOT_LIFE = 50
const FIRE_COOLDOWN = ARSENAL.cooldown
const RAPID_COOLDOWN = ARSENAL.rapidCooldown
const START_LIVES = 3
/** Points never buy past this many contestants; the Prize Swap never past MAX_LIVES. */
const MAX_EARNED_LIVES = 6
const MAX_LIVES = 9
const EXTRA_EVERY = 50_000
const DEATH_TICKS = 100
const TRANSITION_TICKS = 70
const EPISODE_TICKS = 180
const INVULN_TICKS = 120
const PRIZE_LIFE = 60 * 7
/** The map waits this long before A counts, and goes with the highlighted door after this long. */
const MAP_SETTLE = 30
const MAP_AUTO = 60 * 12
const TICKET_POINTS = 5000
const CUSHION_FUSE = 30
const CUSHION_BLAST = 22
const SLIP_TICKS = 36
/** Below this a stick's push doesn't aim. */
const AIM_MIN = 0.3
/** The light rig steps across the floor on the beat: each lamp's marks, -1..1 of its swing. */
const BEAM_STEPS = [-1, -0.5, 0, 0.5, 1, 0.5, 0, -0.5] as const
/** Ticks a lamp shows its next mark before it lights, and how far a hot beam drifts. */
const BEAM_TELL = 40
const BEAM_DRIFT = 0.1
/** A boom mic shows its shadow this long, then holds Sparkle up this long. */
const BOOM_TELL = 70
const BOOM_LIFT = 60
const BOOM_REACH = 14
/** Cream from a pie, and foam from the foam cannon, stay on the floor this long. */
const CREAM_LIFE = 420
const CREAM_RADIUS = 16
/** How far back Sparkle's footsteps are kept (the mirror clone's beat and then some). */
const HISTORY = 64
/** A host cut-in stays this long; ordinary cues wait this long after the last one. */
const CUT_TICKS = 150
const CUT_GAP = 240
/** Each tally row counts up for this long; the Prize Swap waits this long before moving on. */
const TALLY_ROW = 36
const SWAP_AUTO = 60 * 15
/** A flight case's half size. */
const CASE_HALF_W = 11
const CASE_HALF_H = 6

export const PANIC_CURVES = {
  /** Crasher walking speed by studio (rooms played this run). */
  grabberSpeed: { start: 0.55, step: 0.05, limit: 1.1 },
} as const

type Dir = { x: number; y: number }

/** One contestant on the floor: who she is, and everything about her that is hers alone. */
type Contestant = {
  seat: number
  who: ContestantId
  px: number
  py: number
  /** Momentum, used when the floor is slippery (Foam Party, cream, low gravity) or a peel slides her. */
  vx: number
  vy: number
  slip: number
  aim: Dir
  /** A second stick is aiming this tick (twin-stick): she sprays where it points. */
  aiming: boolean
  /** Whether the stick aimed last tick (the map reads a flick of it as a d-pad press). */
  aimedBefore: boolean
  fireCooldown: number
  popperClock: number
  /** Ticks a boom mic still holds her up in the air. */
  lifted: number
  /** Her recent footsteps, newest last (a mirror clone replays them a beat late). */
  trail: Point[]
  invuln: number
  /** Walk-cycle bookkeeping (cosmetic). */
  stride: number
  striding: boolean
  /** Ticks left on each power-up: several run at once, and pickups stack up to a cap. */
  powers: Record<PowerKind, number>
  /** In co-op: ticks until she is back on set after a hit (0 in play, -1 out of the show). */
  down: number
  /** Glimmer's own shield: up, or ticks until it recharges. */
  guard: boolean
  guardClock: number
}

function newContestant(seat: number, who: ContestantId): Contestant {
  return {
    seat,
    who,
    px: CX,
    py: CY + 30,
    vx: 0,
    vy: 0,
    slip: 0,
    aim: { x: 0, y: -1 },
    aiming: false,
    aimedBefore: false,
    fireCooldown: 0,
    popperClock: 0,
    lifted: 0,
    trail: [],
    invuln: INVULN_TICKS,
    stride: 0,
    striding: false,
    powers: Object.fromEntries(POWER_KINDS.map((kind) => [kind, 0])) as Record<
      PowerKind,
      number
    >,
    down: 0,
    guard: CONTESTANTS[who].recharge > 0,
    guardClock: 0,
  }
}
type Kind = CrasherKind
type Dancer = { x: number; y: number; vx: number; life: number; color: string }
type Shot = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  hue: number
  /** Confetti, or a heavy bubble rocket. */
  kind: 'confetti' | 'rocket'
  /** Fired from the foam cannon: it slows what it hits and foams the floor. */
  foamy: boolean
  damage: number
  /** Crashers a rocket can still punch through. */
  pierce: number
  /** Who it has already hit (a rocket never hits the same crasher twice). */
  hits: Crasher[]
}
/** Thrown at Sparkle: streamers, flashbulbs, candle sparks, popper shards and tank bubbles. */
type Streamer = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  style: ShotStyle
  /** Already counted as a near miss. */
  grazed?: boolean
}
type Prize = {
  x: number
  y: number
  kind: PrizeKind
  life: number
  /** Set out on a pedestal: it waits for the whole room. */
  pedestal?: boolean
  /** How far a saucer's beam has it lifted (0..1). */
  lift: number
}
type Mine = {
  kind: 'cushion' | 'peel'
  x: number
  y: number
  /** A stepped-on cushion's fuse; 0 while it waits. */
  fuse: number
}
type Beam = {
  x: number
  y: number
  base: number
  swing: number
  on: number
  off: number
  offset: number
}
type TicketPickup = { x: number; y: number; id: string }
type Crack = { side: Side; x: number; y: number; hp: number; secret: string }
/** An open way out of the room: a door to a map neighbour, the way back, or a broken wall. */
type RoomExit = {
  side: Side
  x: number
  y: number
  to: string
  kind: 'door' | 'secret' | 'back'
}
/** A gift lobbed in by the audience. */
type Toss = {
  x0: number
  y0: number
  x1: number
  y1: number
  t: number
  dur: number
  kind: PrizeKind
}
/** Lobbed in an arc: a chef's pie, or one of Sparkle's party poppers. */
type Lob = {
  x0: number
  y0: number
  x1: number
  y1: number
  t: number
  dur: number
  kind: 'pie' | 'popper'
}
/** Something on the floor: cream from a pie (slippery), or foam (slows crashers). */
type Slick = {
  x: number
  y: number
  r: number
  life: number
  kind: 'cream' | 'foam'
}
/** A boom mic on the rig: every `every` ticks it swoops on where Sparkle was. */
type Boom = { every: number; offset: number; x: number; y: number }
/** A glitter laser's line, shown for a few ticks. */
type Glitter = { x0: number; y0: number; x1: number; y1: number; life: number }
/** Sparkle's cardboard cutout: the crowd chases it until it is worn out. */
type Decoy = { x: number; y: number; hp: number; life: number }
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = { x: number; y: number; text: string; life: number }
/** A show kept at an episode's start (ArcadeGameInstance.save), and handed back as `resume`. */
export type PrizeSave = {
  v: 2
  /** The episode to pick up at the start of (an index into SEASON). */
  episode: number
  loop: number
  score: number
  lives: number
  studios: number
  tickets: string[]
  wallet: Wallet
  won: Wallet
  bestChain: number
  /** The season has been cleared at least once. */
  cleared: boolean
  /** The run it came from ended: picking it up again starts the score from zero. */
  continued: boolean
  /** Room medals won on this device (prizeShow/modes.ts), kept across shows. */
  medals: MedalBoard
  /** The most rooms cleared in one Marathon. */
  marathon: number
}

const isCount = (v: unknown, max: number): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= max

function readWallet(v: unknown): Wallet | null {
  if (!v || typeof v !== 'object') return null
  const w = v as Record<string, unknown>
  return isCount(w.cash, 9999) &&
    isCount(w.toaster, 9999) &&
    isCount(w.car, 9999)
    ? { cash: w.cash, toaster: w.toaster, car: w.car }
    : null
}

/** A stored save, checked against this season; null when it is not one we can use. */
export function readSave(raw: unknown): PrizeSave | null {
  if (!raw || typeof raw !== 'object') return null
  const v = raw as Record<string, unknown>
  // Version 1 (before the medals) still reads: it simply has none yet.
  if (v.v !== 1 && v.v !== 2) return null
  if (!isCount(v.episode, SEASON.length - 1)) return null
  if (!isCount(v.loop, 99) || v.loop < 1) return null
  if (!isCount(v.score, 250_000_000)) return null
  if (!isCount(v.lives, MAX_LIVES) || v.lives < 1) return null
  if (!isCount(v.studios, 100_000) || !isCount(v.bestChain, 100_000))
    return null
  if (typeof v.cleared !== 'boolean' || typeof v.continued !== 'boolean')
    return null
  const known = new Set(seasonTickets())
  if (
    !Array.isArray(v.tickets) ||
    v.tickets.length > known.size ||
    !v.tickets.every((t) => typeof t === 'string' && known.has(t)) ||
    new Set(v.tickets).size !== v.tickets.length
  )
    return null
  const wallet = readWallet(v.wallet)
  const won = readWallet(v.won)
  if (!wallet || !won) return null
  const medals = readMedals(v.v === 1 ? undefined : v.medals)
  if (!medals) return null
  const marathon = v.v === 1 ? 0 : v.marathon
  if (!isCount(marathon, 100_000)) return null
  return {
    v: 2,
    episode: v.episode,
    loop: v.loop,
    score: v.score,
    lives: v.lives,
    studios: v.studios,
    tickets: [...(v.tickets as string[])],
    wallet,
    won,
    bestChain: v.bestChain,
    cleared: v.cleared,
    continued: v.continued,
    medals,
    marathon,
  }
}

type MapState = {
  options: MapOption[]
  cursor: number
  ticks: number
}
type Next =
  | { to: 'map'; side: Side | null }
  | { to: 'secret'; id: string; side: Side }
  | { to: 'episode' }

const CONFETTI = [
  '#f472b6',
  '#facc15',
  '#4ade80',
  '#38bdf8',
  '#a78bfa',
  '#fb923c',
]
const PRIZE_POINTS = {
  cash: 500,
  toaster: 1000,
  car: 5000,
  ...Object.fromEntries(POWER_KINDS.map((kind) => [kind, 250])),
} as Record<PrizeKind, number>

const DIM_RAMP: Ramp = [
  RAMPS.night[0],
  RAMPS.night[1],
  RAMPS.night[2],
  RAMPS.night[3],
  RAMPS.night[4],
]
const CHECK_TICK = pixelSprite(
  ['.....l', '....lL', 'l..lL.', 'LllL..', '.LL...'],
  {
    l: RAMPS.leaf[4],
    L: RAMPS.leaf[3],
  },
)

/** The four crashers that move in this file; the rest move in prizeShow/roster.ts. */
const FOUNDERS = new Set<Kind>(['grabber', 'bouncer', 'conga', 'thrower'])

/** What the host says when Sparkle bumps into one. */
const BUMP_LINES: Partial<Record<Kind, string>> = {
  mascot: 'BELLY BOUNCED!',
  meatball: 'ROLLED OVER!',
  clone: 'COPYCATTED!',
  fluffball: 'FLUFFED!',
  tank: 'SWEPT UP!',
}

const SHOT_LINES: Record<ShotStyle, string> = {
  streamer: 'TANGLED!',
  flash: 'FLASHED!',
  spark: 'SPARKLED!',
  shard: 'POPPED!',
  bubble: 'BUBBLED!',
}

/** Half width and height a shot has to land inside to hit. */
function hitBox(c: Crasher): [number, number] {
  switch (c.kind) {
    case 'mascot':
      return [13, 16]
    case 'tank':
      return [10, 9]
    case 'crane':
    case 'saucer':
      return [9, 8]
    case 'fluffball':
      return [6, 6]
    default:
      return [7, 8]
  }
}

/** The sprite view for an aim: side-on unless it points mostly up or down. */
function viewOf(aim: Dir): View {
  if (Math.abs(aim.x) > Math.abs(aim.y) * 0.5) return 'side'
  return aim.y < 0 ? 'back' : 'front'
}

function isPower(kind: PrizeKind): kind is PowerKind {
  return kind in POWERS
}

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
function heroSprites(
  palette: Record<string, string>,
): Record<View, readonly PixelSprite[]> {
  return {
    front: FRONT_LEGS.map((legs) =>
      pixelSprite([...HERO_FRONT, ...legs], palette),
    ),
    back: FRONT_LEGS.map((legs) =>
      pixelSprite([...HERO_BACK, ...legs], palette),
    ),
    side: SIDE_LEGS.map((legs) =>
      pixelSprite([...HERO_SIDE, ...legs], palette),
    ),
  }
}
/** Each contestant is Sparkle's frame in her own colours (prizeShow/contestants.ts). */
const CONTESTANT_SPRITES = Object.fromEntries(
  CONTESTANT_IDS.map((id) => {
    const kit = CONTESTANTS[id]
    return [
      id,
      heroSprites({
        ...HERO_PALETTE,
        h: kit.body[0],
        H: kit.body[1],
        G: kit.body[2],
        g: kit.body[3],
        d: kit.body[4],
        p: kit.antenna[0],
        P: kit.antenna[1],
        q: kit.antenna[2],
        c: kit.light,
      }),
    ]
  }),
) as Record<ContestantId, Record<View, readonly PixelSprite[]>>
/** Co-op: each extra contestant brings this share more crashers a wave, and more boss health. */
const COOP_CROWD = 0.4
const COOP_BOSS = 0.6
/** ...and the points are shared: each extra contestant divides them by this much more. */
const COOP_SHARE = 0.5
/** The registry's maxPlausibleScore (under the leaderboard's Int column): no score goes past it. */
const SCORE_CEILING = 250_000_000
/** The season airs this many times (the first run and three reruns), then the series ends. */
const SERIES_LOOPS = 4
/** How long the pick card waits before the seats left choosing are given their cursor's pick. */
const PICK_AUTO = 60 * 15
// The mirror clone: Sparkle in glitchy purple and teal. The cutout: Sparkle printed on cardboard.
const CLONE_PALETTE = {
  ...HERO_PALETTE,
  h: RAMPS.purple[4],
  H: RAMPS.purple[3],
  G: RAMPS.purple[2],
  g: RAMPS.purple[1],
  d: RAMPS.purple[0],
  F: RAMPS.teal[3],
  f: RAMPS.teal[2],
  p: RAMPS.teal[3],
  P: RAMPS.teal[2],
  q: RAMPS.teal[1],
}
const CLONE_SPRITES: Record<View, readonly PixelSprite[]> = {
  front: FRONT_LEGS.map((legs) =>
    pixelSprite([...HERO_FRONT, ...legs], CLONE_PALETTE),
  ),
  back: FRONT_LEGS.map((legs) =>
    pixelSprite([...HERO_BACK, ...legs], CLONE_PALETTE),
  ),
  side: SIDE_LEGS.map((legs) =>
    pixelSprite([...HERO_SIDE, ...legs], CLONE_PALETTE),
  ),
}
const CARDBOARD: Record<string, string> = {
  ...Object.fromEntries(
    Object.keys(HERO_PALETTE).map((key) => [key, RAMPS.earth[3]]),
  ),
  h: RAMPS.earth[4],
  H: RAMPS.earth[4],
  g: RAMPS.earth[2],
  d: RAMPS.earth[2],
  t: RAMPS.earth[2],
  q: RAMPS.earth[2],
  k: INK,
  p: RAMPS.pink[2],
}
const CUTOUT_SPRITE = pixelSprite(
  [...HERO_FRONT, '...dd..dd...', '...dd..dd...'],
  CARDBOARD,
)
const CASE_SPRITE = pixelSprite(CASE_ROWS, {
  '0': RAMPS.night[0],
  '1': RAMPS.steel[1],
  '3': RAMPS.steel[3],
  '4': RAMPS.steel[2],
  K: INK,
  y: RAMPS.gold[3],
})
const PIE_SPRITE = pixelSprite(['.FWWF.', 'FWWWWF', 'MFFFFM', '.MmmM.'], {
  W: RAMPS.cream[4],
  F: RAMPS.cream[3],
  M: RAMPS.earth[3],
  m: RAMPS.earth[2],
})
const POPPER_SPRITE = pixelSprite(
  ['....y', '..ypy', '.PPp.', 'PPp..', 'Pp...'],
  {
    y: RAMPS.gold[4],
    p: RAMPS.pink[3],
    P: RAMPS.pink[2],
  },
)
const MIC_SPRITE = pixelSprite(
  ['.343.', '34443', '43434', '34443', '.343.', '..1..', '..1..', '.111.'],
  {
    '1': RAMPS.steel[1],
    '3': RAMPS.steel[3],
    '4': RAMPS.steel[4],
  },
)

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
    ...ROSTER_EXTRAS,
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

type CrasherLook = Partial<Record<Kind, readonly PixelSprite[]>> & {
  dancer: readonly PixelSprite[]
}
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
    ...Object.fromEntries(
      Object.entries(ROSTER_ROWS).map(([kind, frames]) => [
        kind,
        frames.map((rows) => pixelSprite(rows, palette)),
      ]),
    ),
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

const PRIZE_GLOW = {
  cash: RAMPS.leaf[3],
  toaster: RAMPS.steel[4],
  car: RAMPS.ember[3],
  ...Object.fromEntries(
    POWER_KINDS.map((kind) => [kind, POWERS[kind].ramp[3]]),
  ),
} as Record<PrizeKind, string>

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
  studioLook(RAMPS.night, RAMPS.gold, RAMPS.purple[3]),
  studioLook(RAMPS.sky, RAMPS.steel, RAMPS.cream[4]),
  studioLook(RAMPS.gold, RAMPS.purple, RAMPS.gold[4]),
  studioLook(RAMPS.steel, RAMPS.night, RAMPS.purple[3]),
  studioLook(RAMPS.leaf, RAMPS.pink, RAMPS.cream[4]),
]
/**
 * Each episode's soundstage: its studio looks (one per kind of room, the plain rooms cycling the
 * first `cycle`), the floor's tile size and centre mark, the marquee bulbs' colour and the wall trim.
 */
type SetStyle = {
  looks: readonly StudioLook[]
  lookOf: Partial<Record<RoomScript['type'], number>>
  cycle: number
  tile: number
  mark: 'star' | 'plate' | 'stage' | 'pad'
  marquee: Ramp
  trim: 'bulbs' | 'tiles' | 'grilles' | 'stars'
}
const SETS: Record<SetId, SetStyle> = {
  // Opening Night: the game show's glossy tiles, a star on the floor and gold marquee bulbs.
  studio: {
    looks: STUDIOS,
    lookOf: {
      boss: 3,
      lights: 4,
      cameras: 5,
      vault: 6,
      secret: 7,
      mines: 8,
      conga: 2,
    },
    cycle: 3,
    tile: 16,
    mark: 'star',
    marquee: RAMPS.gold,
    trim: 'bulbs',
  },
  // Cooking Showdown: small kitchen tiles, a big serving plate, steel and tiled walls.
  kitchen: {
    looks: [
      studioLook(RAMPS.cream, RAMPS.steel, RAMPS.gold[4]),
      studioLook(RAMPS.teal, RAMPS.cream, RAMPS.cream[4]),
      studioLook(RAMPS.steel, RAMPS.ember, RAMPS.gold[4]),
      studioLook(RAMPS.gold, RAMPS.teal, RAMPS.gold[4]),
      studioLook(RAMPS.sky, RAMPS.steel, RAMPS.water[4]),
      studioLook(RAMPS.rust, RAMPS.steel, RAMPS.ember[4]),
      studioLook(RAMPS.leaf, RAMPS.cream, RAMPS.cream[4]),
    ],
    lookOf: {
      boss: 2,
      vault: 3,
      secret: 4,
      hotplates: 5,
      speed: 5,
      sponsor: 3,
      conveyor: 6,
    },
    cycle: 2,
    tile: 8,
    mark: 'plate',
    marquee: RAMPS.cream,
    trim: 'tiles',
  },
  // Countdown Concert: a dark stage with tape marks, speaker-grille walls and pink stage lights.
  concert: {
    looks: [
      studioLook(RAMPS.night, RAMPS.purple, RAMPS.pink[3]),
      studioLook(RAMPS.purple, RAMPS.night, RAMPS.teal[3]),
      studioLook(RAMPS.pink, RAMPS.night, RAMPS.purple[3]),
      studioLook(RAMPS.ember, RAMPS.night, RAMPS.gold[4]),
      studioLook(RAMPS.gold, RAMPS.night, RAMPS.gold[4]),
      studioLook(RAMPS.leaf, RAMPS.purple, RAMPS.cream[4]),
      studioLook(RAMPS.steel, RAMPS.night, RAMPS.pink[3]),
    ],
    lookOf: {
      boss: 3,
      vault: 4,
      secret: 5,
      speakers: 6,
      moshpit: 2,
      lights: 1,
    },
    cycle: 2,
    tile: 16,
    mark: 'stage',
    marquee: RAMPS.pink,
    trim: 'grilles',
  },
  // Galaxy Parade: dark deck plates, a landing pad on the floor, starlit walls and teal lights.
  galaxy: {
    looks: [
      studioLook(RAMPS.night, RAMPS.steel, RAMPS.teal[3]),
      studioLook(RAMPS.sky, RAMPS.night, RAMPS.teal[4]),
      studioLook(RAMPS.purple, RAMPS.steel, RAMPS.pink[3]),
      studioLook(RAMPS.night, RAMPS.purple, RAMPS.ember[3]),
      studioLook(RAMPS.gold, RAMPS.night, RAMPS.gold[4]),
      studioLook(RAMPS.steel, RAMPS.teal, RAMPS.cream[4]),
      studioLook(RAMPS.water, RAMPS.night, RAMPS.teal[3]),
    ],
    lookOf: {
      boss: 3,
      vault: 4,
      secret: 5,
      ring: 6,
      warp: 2,
      sponsor: 4,
    },
    cycle: 2,
    tile: 16,
    mark: 'pad',
    marquee: RAMPS.teal,
    trim: 'stars',
  },
}
const CROWD_COLOURS = [
  RAMPS.pink[2],
  RAMPS.teal[2],
  RAMPS.gold[2],
  RAMPS.purple[2],
  RAMPS.sky[2],
  RAMPS.leaf[2],
]
const CROWD = CROWD_COLOURS.map(audienceSprites)
/** Cosmetic layout for the foam and confetti-storm modifiers (never the game's rng). */
const FOAM_SUDS = (() => {
  const dice = backdropRng(311)
  return Array.from({ length: 34 }, () => ({
    x: LEFT + 6 + dice() * (RIGHT - LEFT - 12),
    y: TOP + 6 + dice() * (BOTTOM - TOP - 12),
    r: 3 + Math.floor(dice() * 6),
  }))
})()
const STORM_FLAKES = (() => {
  const dice = backdropRng(907)
  return Array.from({ length: 280 }, () => ({
    x: dice() * W,
    y: dice() * H,
    speed: 0.35 + dice() * 0.7,
    sway: dice() * Math.PI * 2,
    hue: Math.floor(dice() * 6),
    big: dice() < 0.55,
  }))
})()

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
  /**
   * Everyone seated (one contestant each, up to four), and whose turn it is: while the game works
   * through a contestant, `px`, `aim`, `powers` and the rest below are hers.
   */
  private team: Contestant[] = [newContestant(0, 'sparkle')]
  private cur: Contestant = this.team[0]!
  /** The contestant pick card at the start of a show (a seat's cursor and whether she is set). */
  picking: { cursor: number[]; locked: boolean[]; ticks: number } | null = null
  private glitter: Glitter[] = []
  private decoy: Decoy | null = null

  // The broadcast (t-028): ratings, cheer chains, the host's cut-ins, the haul and the swap.
  ratings: number = RATINGS.start
  private peakTier = tierOf(RATINGS.start)
  chain = 0
  private chainClock = 0
  bestChain = 0
  private sinceCheer = 0
  private packageClock = 0
  private twistClock = 0
  /** Prizes won this episode and all season, and the ones still in hand for the Prize Swap. */
  episodeWon: Wallet = emptyWallet()
  seasonWon: Wallet = emptyWallet()
  wallet: Wallet = emptyWallet()
  private episodeTickets = 0
  /** The host (or co-host) on screen, and who is waiting to speak next. */
  cutIn: { voice: Voice; text: string; ticks: number } | null = null
  private cutQueue: Array<{ voice: Voice; text: string }> = []
  private cutGap = 0
  private lowTimeSaid = false
  private riskyRoute = false
  /** Ticks left on the APPLAUSE sign, the audience's cheer and a camera flash. */
  private applause = 0
  private audienceCheer = 0
  private camFlash = 0
  private packages: Array<{ x: number; y: number; landY: number }> = []
  /** Between episodes: the tally counting up, then the Prize Swap. */
  tally: { rows: TallyRow[]; ticks: number; paid: number } | null = null
  swap: { cursor: number; ticks: number; bought: SwapId[] } | null = null
  /** What the last Prize Swap bought for this episode. */
  perks: { clock: number; power: PowerKind | null; secret: boolean } = {
    clock: 0,
    power: null,
    secret: false,
  }
  /** The season haul shown on the game-over screen. */
  private finalRows: TallyRow[] | null = null
  private overTicks = 0
  /** The host's own dice: which line, and whether LENS chimes in (never the game's rng). */
  private hostRng: () => number
  private shots: Shot[] = []
  private crashers: Crasher[] = []
  private dancers: Dancer[] = []
  private streamers: Streamer[] = []
  private prizes: Prize[] = []
  private boss: Boss | null = null
  private dead = 0
  private nextExtra = EXTRA_EVERY
  private haul = 0
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null

  /** A commercial break on the air (a mini-game), and what comes after it. */
  commercial: { state: BreakState; then: 'episode' | 'map' } | null = null
  private breaksAired = 0

  // How the season ends: the Grand Prize Vault (for ten golden tickets), the ending, the credits.
  private inVault = false
  ending: { kind: EndingKind; ticks: number; crowd: Crasher[] } | null = null
  /** The season has been cleared (kept in the save: it unlocks reruns). */
  seasonCleared = false
  /** Progress kept at each episode start (the cabinet stores it); demos never save. */
  save: PrizeSave | null = null
  /** A saved show offered on the opening card, until the player chooses. */
  private offer: PrizeSave | null = null
  private choosing = 0
  /** The mode card before a new show: Season, Rerun, Marathon, episode select, the medal board. */
  menu: MenuState | null = null
  mode: ShowMode = 'season'
  /** Room medals won on this device (kept in the save), and this episode's and this show's count. */
  medals: MedalBoard = {}
  private episodeMedals = 0
  private showMedals = 0
  /** The Marathon: rooms cleared this run, and the most in one run (kept in the save). */
  marathonRooms = 0
  marathonBest = 0

  // The season: where Sparkle is on which episode's map, and what she carries between rooms.
  private season: readonly Episode[] = SEASON
  private episodeIndex = 0
  private loop = 1
  private tuning: LoopTuning = loopTuning(1)
  private roomId = ''
  /** The secret room Sparkle is in (off the map), or null on the map's own rooms. */
  private secretId: string | null = null
  private route: string[] = []
  private secretsFound: string[] = []
  /** Golden tickets held, by id (twelve across the season; ten open the Grand Prize Vault). */
  tickets: string[] = []
  private modifiers = new Map<string, ModifierId | null>()
  private map: MapState | null = null
  private next: Next | null = null
  private transition = 0
  private studios = 0

  // The room in play: its script and everything the script put on the set.
  private script!: RoomScript
  private modifier: ModifierId | null = null
  private entryDoor: Side = 2
  private roomTick = 0
  private roomTicks = 1
  private roomTimer = 0
  private waves: Array<{ wave: Wave; at: number; left: number }> = []
  /** Crashers the room's script has brought on so far, by kind. */
  spawned: Record<Kind, number> = noCrashers()
  private mines: Mine[] = []
  private beams: Beam[] = []
  private booms: Boom[] = []
  private cases: FlightCase[] = []
  private lobs: Lob[] = []
  private slicks: Slick[] = []
  private pickups: TicketPickup[] = []
  private crack: Crack | null = null
  // The set's floor (prizeShow/hazards.ts): the kitchen's hot plates, counters and flour, the
  // concert's speaker stacks, their bass rings (and bosses' shockwaves), and mosh pits.
  private plates: HotPlateProp[] = []
  private belts: BeltProp[] = []
  private flours: Flour[] = []
  private speakers: SpeakerProp[] = []
  private rings: Ring[] = []
  private pits: Pit[] = []
  // The galaxy's floor: the turning ring round its hub, and teleport doors (with a cool-down, so
  // Sparkle doesn't bounce straight back).
  private turntable: TurntableProp | null = null
  private warps: WarpProp[] = []
  private warpClock = 0
  /** The loop the cabinet should be playing (a concert room restarts it, so the beat lines up). */
  private musicNow: MusicLoop | null = null
  private exits: RoomExit[] = []
  private exitsOpen = false
  private cleared = false
  private hit = false
  private prizeMissed = false
  /** Full Haul: prizes grabbed in this room, and whether any got away. */
  private roomGrabbed = 0
  private haulMissed = false
  /** The medals just won, shown on the way out of the room (and whether each is new). */
  private medalToast: {
    won: MedalId[]
    fresh: MedalId[]
    ticks: number
  } | null = null
  private tosses: Toss[] = []
  private nextToss = 0

  // Cosmetic only: sparkles with their own dice, so the game's seeded rng is untouched.
  private fx = new Sparkles()
  private fxRng = backdropRng(47)
  /** What the roster's crashers may ask of the room (prizeShow/roster.ts). */
  private world: CrasherWorld
  /** And what a boss may ask of it (prizeShow/bosses.ts). */
  private bossWorld: BossWorld

  /** The set's loop (the boss theme on a boss stage); none in the attract demo or after the show. */
  get music(): MusicLoop | null {
    if (this.demo || this.over) return null
    if (this.ending) return ENDING_MUSIC
    if (this.commercial) return JINGLE_MUSIC
    return this.musicNow
  }

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    // The host's own dice, seeded once from the game's: each show sounds different, replays alike.
    this.hostRng = backdropRng(Math.floor(this.rng() * 2 ** 31))
    // Up to four seats, a contestant each (the pick card lets them choose); one shared pool of lives.
    const seats = Math.max(1, Math.min(4, Math.floor(options.players ?? 1)))
    this.team = Array.from({ length: seats }, (_, i) =>
      newContestant(i, CONTESTANT_IDS[i]!),
    )
    this.cur = this.team[0]!
    this.lives = START_LIVES + seats - 1
    this.world = this.makeWorld()
    this.bossWorld = this.makeBossWorld()
    const offer = this.demo ? null : readSave(options.resume)
    if (offer) {
      // What this device has won stays with every show: the clear, the medals, the best Marathon.
      this.seasonCleared = offer.cleared
      this.medals = { ...offer.medals }
      this.marathonBest = offer.marathon
    }
    this.beginEpisode(0)
    if (!this.demo) this.openPick()
    if (offer && (offer.episode > 0 || offer.loop > 1)) {
      // Until the player chooses, the stored show stays as it was.
      this.offer = offer
      this.save = offer
      this.choosing = 1
      this.cutIn = null
      this.cutQueue = []
    } else if (!this.demo) {
      this.openMenu()
    }
  }

  // The current contestant's own state, read and written as if it were the game's.
  private get px(): number {
    return this.cur.px
  }
  private set px(v: number) {
    this.cur.px = v
  }
  private get py(): number {
    return this.cur.py
  }
  private set py(v: number) {
    this.cur.py = v
  }
  private get vx(): number {
    return this.cur.vx
  }
  private set vx(v: number) {
    this.cur.vx = v
  }
  private get vy(): number {
    return this.cur.vy
  }
  private set vy(v: number) {
    this.cur.vy = v
  }
  private get slip(): number {
    return this.cur.slip
  }
  private set slip(v: number) {
    this.cur.slip = v
  }
  private get aim(): Dir {
    return this.cur.aim
  }
  private set aim(v: Dir) {
    this.cur.aim = v
  }
  private get aiming(): boolean {
    return this.cur.aiming
  }
  private set aiming(v: boolean) {
    this.cur.aiming = v
  }
  private get aimedBefore(): boolean {
    return this.cur.aimedBefore
  }
  private set aimedBefore(v: boolean) {
    this.cur.aimedBefore = v
  }
  private get fireCooldown(): number {
    return this.cur.fireCooldown
  }
  private set fireCooldown(v: number) {
    this.cur.fireCooldown = v
  }
  private get popperClock(): number {
    return this.cur.popperClock
  }
  private set popperClock(v: number) {
    this.cur.popperClock = v
  }
  private get lifted(): number {
    return this.cur.lifted
  }
  private set lifted(v: number) {
    this.cur.lifted = v
  }
  private get trail(): Point[] {
    return this.cur.trail
  }
  private set trail(v: Point[]) {
    this.cur.trail = v
  }
  private get invuln(): number {
    return this.cur.invuln
  }
  private set invuln(v: number) {
    this.cur.invuln = v
  }
  private get stride(): number {
    return this.cur.stride
  }
  private set stride(v: number) {
    this.cur.stride = v
  }
  private get striding(): boolean {
    return this.cur.striding
  }
  private set striding(v: boolean) {
    this.cur.striding = v
  }
  get powers(): Record<PowerKind, number> {
    return this.cur.powers
  }
  set powers(v: Record<PowerKind, number>) {
    this.cur.powers = v
  }

  /** How many more crashers a wave brings with more contestants seated. */
  private crowdFactor(): number {
    return 1 + COOP_CROWD * (this.team.length - 1)
  }

  /** Contestants in play right now (not knocked down, not out of the show). */
  private inPlay(): Contestant[] {
    return this.team.filter((c) => c.down === 0)
  }

  /** The first contestant in play (the one the map, the pilot and the HUD follow). */
  private lead(): Contestant {
    return this.team.find((c) => c.down === 0) ?? this.team[0]!
  }

  /** The contestant in play nearest (x, y): who a crasher or a boss goes after. */
  private nearestTo(x: number, y: number): Contestant {
    let best = this.lead()
    let bestD = Infinity
    for (const c of this.team) {
      if (c.down !== 0) continue
      const d = Math.hypot(c.px - x, c.py - y)
      if (d < bestD) {
        bestD = d
        best = c
      }
    }
    return best
  }

  /** Run `fn` as each contestant in play in turn (then back to whoever was current). */
  private eachContestant(fn: (c: Contestant) => void) {
    const keep = this.cur
    for (const c of this.team) {
      if (c.down !== 0) continue
      this.cur = c
      fn(c)
    }
    this.cur = keep
  }

  private makeWorld(): CrasherWorld {
    return {
      rng: () => this.rng(),
      roomTick: () => this.roomTick,
      player: () => ({ x: this.px, y: this.py }),
      chase: () => this.chase(),
      history: (ago) => this.history(ago),
      pace: (c) => this.pace(c),
      crowd: () => this.crashers,
      spawn: (kind, x, y) => this.makeCrasher(kind, x, y),
      fire: (x, y, angle, speed, style) => {
        this.streamers.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: style === 'bubble' ? 200 : 170,
          style,
        })
      },
      lobPie: (x, y, tx, ty, ticks) => {
        this.lobs.push({
          x0: x,
          y0: y,
          x1: clampX(tx, 8),
          y1: clampY(ty, 8),
          t: 0,
          dur: ticks,
          kind: 'pie',
        })
      },
      layMine: (kind, x, y) => this.layMine(kind, x, y),
      hurt: (why) => this.loseLife(why),
      freePrize: (x, y) => this.freePrize(x, y),
      steal: (prize) => this.steal(prize),
      addCase: (x, y) => {
        const box: FlightCase = { x, y, vx: 0, vy: 0, pushed: true }
        this.cases.push(box)
        return box
      },
      remove: (c) => this.removeCrasher(c),
      puff: (x, y, colour, count) => this.burst(x, y, count, colour),
      say: (text, x, y) => this.floaters.push({ x, y, text, life: 40 }),
      play: (sound) => this.sound.play(sound),
    }
  }

  private makeBossWorld(): BossWorld {
    return {
      rng: () => this.rng(),
      player: () => ({ x: this.px, y: this.py }),
      beat: () => this.beat(),
      crowdScale: () => this.tuning.count,
      fire: (x, y, angle, speed, style) =>
        this.world.fire(x, y, angle, speed, style),
      lobPie: (x, y, tx, ty, ticks) => this.world.lobPie(x, y, tx, ty, ticks),
      slick: (x, y) => this.addSlick(clampX(x, 6), clampY(y, 6), 'cream'),
      ring: (x, y, max, speed, gap) =>
        this.rings.push(newRing(x, y, max, speed, gap)),
      spawn: (kind, x, y) => this.makeCrasher(kind, x, y),
      crowd: () => this.crashers,
      hurt: (x, y, r, why) =>
        this.eachContestant(() => {
          if (this.lifted === 0 && this.touching(x, y, r)) this.loseLife(why)
        }),
      announce: (text, sub) => {
        this.banner = { text, sub, ticks: 90 }
      },
      puff: (x, y, colour, count) => this.burst(x, y, count, colour),
      play: (sound) => this.sound.play(sound),
      prizes: () => this.prizes.filter((p) => p.life > 0),
      takePrize: (p: BossPrize) => {
        const prize = p as Prize
        if (prize.pedestal && this.script.challenge === 'all-prizes')
          this.prizeMissed = true
        this.haulMissed = true
        this.prizes = this.prizes.filter((q) => q !== prize)
      },
      dropPrize: (x, y) => this.dropPrize(x, y),
      dance: (x, y) =>
        this.dancers.push({
          x,
          y,
          vx: this.fxRng() < 0.5 ? -1 : 1,
          life: 60,
          color: CONFETTI[Math.floor(this.fxRng() * CONFETTI.length)]!,
        }),
    }
  }

  /** The mode card: what kind of show tonight (a new show only; the demo never sees it). */
  private openMenu() {
    this.menu = { cursor: 0, episode: 0, board: false, ticks: 0 }
    this.cutIn = null
    this.cutQueue = []
  }

  private updateMenu(input: InputFrame) {
    const m = this.menu!
    m.ticks++
    if (m.ticks < 15) return
    const go = input.pressed.a || input.pressed.start
    if (m.board) {
      if (go || input.pressed.b || m.ticks >= MENU_AUTO) {
        m.board = false
        m.ticks = 0
        this.sound.play('blip')
      }
      return
    }
    const step = input.pressed.up ? -1 : input.pressed.down ? 1 : 0
    if (step) {
      m.cursor = (m.cursor + step + MENU.length) % MENU.length
      this.sound.play('blip')
    }
    const entry = MENU[m.cursor]!
    const open = unlocked(entry, this.seasonCleared)
    if (entry === 'episode' && open) {
      const turn = input.pressed.left ? -1 : input.pressed.right ? 1 : 0
      if (turn) {
        m.episode = (m.episode + turn + SEASON.length) % SEASON.length
        this.sound.play('blip')
      }
    }
    if (!go) {
      // Nobody choosing: the show goes on with the row under the cursor (or the Season).
      if (m.ticks >= MENU_AUTO)
        this.startMode(open && entry !== 'medals' ? entry : 'season', m.episode)
      return
    }
    if (!open) {
      this.sound.play('warn')
    } else if (entry === 'medals') {
      m.board = true
      m.ticks = 0
      this.sound.play('pickup')
    } else {
      this.startMode(entry, m.episode)
    }
  }

  /** A new show in `mode` (episode select starts at `episode`, an index into SEASON). */
  private startMode(mode: ShowMode, episode = 0) {
    this.menu = null
    this.mode = mode
    this.loop = mode === 'rerun' ? RERUN_LOOP : 1
    this.tuning = loopTuning(this.loop)
    this.season = mode === 'marathon' ? [marathonLeg(0, this.rng)] : SEASON
    this.studios = 0
    this.marathonRooms = 0
    this.showMedals = 0
    this.beginEpisode(mode === 'episode' ? episode : 0)
    this.sound.play('start')
  }

  /** The contestant pick card: each seat chooses who to play (no two the same). */
  private openPick() {
    this.picking = {
      cursor: this.team.map((_, i) => i),
      locked: this.team.map(() => false),
      ticks: 0,
    }
    this.cutIn = null
    this.cutQueue = []
  }

  private updatePick(inputs: readonly InputFrame[]) {
    const p = this.picking!
    p.ticks++
    if (p.ticks < 15) return
    const n = CONTESTANT_IDS.length
    const taken = (pick: number, seat: number) =>
      p.cursor.some((c, i) => i !== seat && p.locked[i] && c === pick)
    this.team.forEach((_, seat) => {
      if (p.locked[seat]) return
      const f = inputs[seat] ?? emptyInput()
      const step = f.pressed.left ? -1 : f.pressed.right ? 1 : 0
      if (step) {
        let next = p.cursor[seat]!
        for (let k = 0; k < n; k++) {
          next = (next + step + n) % n
          if (!taken(next, seat)) break
        }
        p.cursor[seat] = next
        this.sound.play('blip')
      }
      if ((f.pressed.a || f.pressed.start) && !taken(p.cursor[seat]!, seat)) {
        p.locked[seat] = true
        this.sound.play('pickup')
      }
    })
    if (!p.locked.every(Boolean) && p.ticks < PICK_AUTO) return
    // Everyone set (or time's up): a seat still choosing takes the next one free from its cursor.
    this.team.forEach((c, seat) => {
      let pick = p.cursor[seat]!
      for (let k = 0; k < n && taken(pick, seat); k++) pick = (pick + 1) % n
      p.cursor[seat] = pick
      p.locked[seat] = true
      c.who = CONTESTANT_IDS[pick]!
      c.guard = CONTESTANTS[c.who].recharge > 0
    })
    this.picking = null
    this.sound.play('start')
    this.say('room-start')
  }

  private renderPick(g: CanvasRenderingContext2D) {
    const p = this.picking!
    this.renderStudio(g)
    g.fillStyle = rgba(INK, 0.66)
    g.fillRect(0, 0, W, H)
    drawText(
      g,
      this.team.length > 1 ? 'PICK YOUR CONTESTANTS' : 'PICK YOUR CONTESTANT',
      CX,
      22,
      { align: 'center', scale: 2, color: '#ffffff', outline: INK },
    )
    CONTESTANT_IDS.forEach((id, i) => {
      const kit = CONTESTANTS[id]
      const x = 46 + i * 76
      const seats = p.cursor.flatMap((c, seat) => (c === i ? [seat] : []))
      const lit = seats.length > 0
      hudPanel(g, x - 34, 50, 68, 150, lit ? RAMPS.purple : RAMPS.night)
      // A podium, and the contestant bobbing on it (front view, mid-stride when chosen).
      bevel(g, x - 18, 138, 36, 8, RAMPS.gold)
      const bob = lit ? Math.round(Math.sin((this.tick + i * 9) / 7) * 2) : 0
      const frame = lit ? 1 + (Math.floor(this.tick / 10) % 2) : 0
      drawSprite(g, CONTESTANT_SPRITES[id].front[frame]!, x, 138 + bob, {
        anchor: 'feet',
        scale: 3,
        alpha: lit ? 1 : 0.55,
      })
      drawText(g, kit.name, x, 152, {
        align: 'center',
        color: lit ? RAMPS.gold[4] : RAMPS.cream[2],
        outline: INK,
      })
      kit.blurb.forEach((line, k) =>
        drawText(g, line, x, 164 + k * 9, {
          align: 'center',
          color: RAMPS.cream[3],
          shadow: INK,
        }),
      )
      seats.forEach((seat, k) => {
        const colour = SEAT_COLOURS[seat]!
        g.strokeStyle = colour
        g.lineWidth = p.locked[seat] ? 2 : 1
        g.strokeRect(x - 33.5 + k * 2, 50.5 + k * 2, 67 - k * 4, 149 - k * 4)
        drawText(
          g,
          p.locked[seat] ? `P${seat + 1} READY` : `P${seat + 1}`,
          x,
          56 + k * 9,
          {
            align: 'center',
            color: colour,
            outline: INK,
          },
        )
      })
    })
    const blink = Math.floor(this.tick / 20) % 2
    drawText(g, 'LEFT/RIGHT CHOOSE   A READY', CX, 212, {
      align: 'center',
      color: blink ? RAMPS.gold[4] : RAMPS.gold[3],
      outline: INK,
    })
  }

  /** Keep the show as it stands at an episode's start (a real game only; demos never save). */
  private keep() {
    if (this.demo || this.offer) return
    if (this.mode === 'marathon') {
      // The Marathon is one sitting: it keeps only what the device has won.
      this.keepProfile()
      return
    }
    this.save = {
      v: 2,
      episode: this.episodeIndex,
      loop: this.loop,
      score: this.score,
      lives: Math.max(1, Math.min(MAX_LIVES, this.lives)),
      studios: this.studios,
      tickets: [...this.tickets],
      wallet: { ...this.wallet },
      won: { ...this.seasonWon },
      bestChain: this.bestChain,
      cleared: this.seasonCleared,
      continued: false,
      medals: { ...this.medals },
      marathon: this.marathonBest,
    }
  }

  /** What the device has won (the clear, the medals, the best Marathon), kept the moment it's won. */
  private keepProfile() {
    if (this.demo || this.offer) return
    const base: PrizeSave = this.save ?? {
      v: 2,
      episode: 0,
      loop: 1,
      score: 0,
      lives: START_LIVES,
      studios: 0,
      tickets: [],
      wallet: emptyWallet(),
      won: emptyWallet(),
      bestChain: 0,
      cleared: false,
      continued: true,
      medals: {},
      marathon: 0,
    }
    this.save = {
      ...base,
      cleared: this.seasonCleared,
      medals: { ...this.medals },
      marathon: this.marathonBest,
    }
  }

  /** Pick a saved show back up at the start of its episode. */
  private resumeFrom(s: PrizeSave) {
    this.offer = null
    this.choosing = 0
    this.score = s.continued ? 0 : s.score
    this.lives = s.continued ? START_LIVES : s.lives
    this.nextExtra = EXTRA_EVERY
    while (this.nextExtra <= this.score)
      this.nextExtra = this.nextExtra * 2 + EXTRA_EVERY
    this.studios = s.studios
    this.tickets = [...s.tickets]
    this.wallet = { ...s.wallet }
    this.seasonWon = { ...s.won }
    this.bestChain = s.bestChain
    this.seasonCleared = s.cleared
    this.medals = { ...s.medals }
    this.marathonBest = s.marathon
    this.mode = s.loop > 1 ? 'rerun' : 'season'
    this.loop = s.loop
    this.tuning = loopTuning(this.loop)
    this.beginEpisode(s.episode)
    this.banner = {
      text: 'WELCOME BACK!',
      sub: `EPISODE ${this.episode.number}: ${this.episode.title}`,
      ticks: 120,
    }
  }

  /** The opening card: carry on from the saved episode (A), or a new show (B). */
  private updateChoice(input: InputFrame) {
    this.choosing++
    if (this.choosing < 20) return
    if (input.pressed.a || input.pressed.start) {
      this.resumeFrom(this.offer!)
      this.sound.play('start')
    } else if (input.pressed.b) {
      // A new show: the mode card first (the medals and the clear stay with the device).
      this.offer = null
      this.choosing = 0
      this.openMenu()
    }
  }

  /** The host says something about `cue` (big moments jump the queue; the rest wait their turn). */
  private say(cue: Cue, text?: string) {
    const urgent =
      cue === 'death' ||
      cue === 'boss-intro' ||
      cue === 'wrap' ||
      cue === 'game-over' ||
      cue === 'room-start' ||
      cue === 'risky-route' ||
      cue === 'chain'
    if (!urgent && (this.cutGap > 0 || this.cutIn)) return
    const lines =
      this.inVault && cue !== 'death' && cue !== 'game-over'
        ? VAULT_CHEERS
        : HOST_LINES[cue]
    const line = text ?? lines[Math.floor(this.hostRng() * lines.length)]!
    if (urgent) this.cutQueue = []
    this.speak('host', line)
    this.cutGap = CUT_GAP
    const cohost = this.episode.number >= COHOST_FROM_EPISODE || this.loop > 1
    if (cohost && this.hostRng() < 0.35) {
      const reply =
        COHOST_LINES[Math.floor(this.hostRng() * COHOST_LINES.length)]!
      this.cutQueue.push({ voice: 'cohost', text: reply })
    }
  }

  private speak(voice: Voice, text: string) {
    this.cutIn = { voice, text, ticks: CUT_TICKS }
    // Bleep-speak through the cabinet's own notes, or a plain blip where there are none.
    if (this.sound.playNotes) this.sound.playNotes(bleepSpeak(text, voice))
    else this.sound.play('blip')
  }

  /** Cut-ins run out and the next speaker steps up. */
  private updateCutIns() {
    if (this.cutGap > 0) this.cutGap--
    if (this.cutIn && --this.cutIn.ticks <= 0) this.cutIn = null
    if (!this.cutIn && this.cutQueue.length) {
      const next = this.cutQueue.shift()!
      this.speak(next.voice, next.text)
    }
  }

  // --- the ratings meter and cheer chains ---------------------------------------------

  /** The score multiplier: the ratings tier's, times the cheer chain's. */
  multiplier(withChain = true): number {
    const tier = TIERS[tierOf(this.ratings)]!.multiplier
    return tier * (withChain ? chainMultiplier(this.chain) : 1)
  }

  /** Move the meter; crossing into Prime Time or down to Off Air gets the host talking. */
  private rate(delta: number) {
    const before = tierOf(this.ratings)
    this.ratings = Math.max(0, Math.min(RATINGS.max, this.ratings + delta))
    const after = tierOf(this.ratings)
    this.peakTier = Math.max(this.peakTier, after)
    if (after === before) return
    if (after === TIERS.length - 1) {
      this.say('prime-time')
      this.audienceCheer = 90
    } else if (after === 0) {
      this.say('off-air')
    }
    this.floaters.push({
      x: RIGHT - 40,
      y: TOP + 14,
      text: TIERS[after]!.name,
      life: 50,
    })
  }

  /** Every tick of play: idle drains the meter, chains time out, sponsors and producers act. */
  private updateShow() {
    this.sinceCheer++
    if (this.sinceCheer > RATINGS.idleAfter) this.rate(-RATINGS.idleDrain)
    if (this.chainClock > 0 && --this.chainClock === 0) this.chain = 0
    if (this.applause > 0) this.applause--
    if (this.audienceCheer > 0) this.audienceCheer--
    if (this.camFlash > 0) this.camFlash--
    if (this.packageClock > 0) this.packageClock--
    if (this.twistClock > 0) this.twistClock--
    const tier = tierOf(this.ratings)
    if (tier === TIERS.length - 1 && this.packageClock === 0 && !this.cleared) {
      // Prime Time: the sponsors drop a care package.
      this.packageClock = 1e9
      const x = LEFT + 40 + this.rng() * (RIGHT - LEFT - 80)
      const landY = TOP + 50 + this.rng() * (BOTTOM - TOP - 100)
      this.packages.push({ x, y: TOP - 10, landY })
      this.sound.play('extra')
    }
    if (
      tier === 0 &&
      this.twistClock === 0 &&
      !this.cleared &&
      !this.script.closes &&
      this.roomTick > RATINGS.twistGrace
    )
      this.plotTwist()
    for (const pack of this.packages) {
      pack.y += 1.4
      if (pack.y < pack.landY) continue
      this.burst(pack.x, pack.y, 12, RAMPS.gold[3])
      this.floaters.push({
        x: pack.x,
        y: pack.y - 12,
        text: 'CARE PACKAGE!',
        life: 45,
      })
      for (let i = 0; i < 3; i++)
        this.prizes.push({
          x: clampX(pack.x + (i - 1) * 16, 8),
          y: clampY(pack.landY, 8),
          kind: this.prizeFor(i === 1 ? 'cash' : powerFromRoll(this.rng())),
          life: PRIZE_LIFE,
          lift: 0,
        })
    }
    this.packages = this.packages.filter((pack) => pack.y < pack.landY)
  }

  /** Off Air: the producer throws in a twist to win the viewers back. */
  private plotTwist() {
    this.twistClock = RATINGS.twistEvery
    const roll = this.rng()
    const far = DOORS[(this.entryDoor + 2) % 4]!
    let sub: string
    if (roll < 0.4) {
      for (const door of DOORS) {
        if (door.side === this.entryDoor) continue
        this.makeCrasher('grabber', door.x, door.y).extra = true
      }
      sub = 'SURPRISE GUESTS AT EVERY DOOR'
    } else if (roll < 0.7) {
      this.makeCrasher('drone', far.x, far.y).extra = true
      sub = 'A SPOTLIGHT DRONE JOINS THE SHOW'
    } else {
      this.makeCrasher('stagehand', far.x, far.y).extra = true
      sub = 'A STAGEHAND RE-DRESSES THE SET'
    }
    this.banner = { text: 'PLOT TWIST!', sub, ticks: 100 }
    this.sound.play('warn')
  }

  /** Who the crowd chases: Sparkle, or her cardboard cutout while it stands. */
  private chase(): Point {
    return this.decoy
      ? { x: this.decoy.x, y: this.decoy.y }
      : { x: this.px, y: this.py }
  }

  /** Sparkle's position `ago` ticks back. */
  private history(ago: number): Point {
    return (
      this.trail[this.trail.length - 1 - ago] ??
      this.trail[0] ?? { x: this.px, y: this.py }
    )
  }

  /** One crasher's pace: the room's, sped up by a heckler, slowed by foam, never Sparkle's. */
  private pace(c: Crasher): number {
    let speed = this.crasherSpeed()
    if (c.pumped > 0) speed *= 1.4
    if (c.slow > 0) speed *= 0.5
    return Math.min(CRASHER_TOP_SPEED, speed)
  }

  /** A stagehand's mine: never in a doorway, so every exit stays reachable. */
  private layMine(kind: 'cushion' | 'peel', x: number, y: number): boolean {
    if (this.mines.length >= 14) return false
    if (DOORS.some((d) => Math.hypot(d.x - x, d.y - y) < 30)) return false
    this.mines.push({ kind, x: clampX(x, 10), y: clampY(y, 10), fuse: 0 })
    return true
  }

  /** The prize nearest (x, y) that no saucer is already beaming up. */
  private freePrize(x: number, y: number): Prize | null {
    let best: Prize | null = null
    let bestD = Infinity
    for (const p of this.prizes) {
      if (p.lift > 0 || this.crashers.some((c) => c.prize === p)) continue
      const d = Math.hypot(p.x - x, p.y - y)
      if (d < bestD) {
        bestD = d
        best = p
      }
    }
    return best
  }

  private steal(prize: Point) {
    const before = this.prizes.length
    this.prizes = this.prizes.filter((p) => p !== prize)
    if (this.prizes.length === before) return
    if (this.script.challenge === 'all-prizes') this.prizeMissed = true
    this.haulMissed = true
    this.burst(prize.x, prize.y - 20, 8, RAMPS.sky[3])
    this.sound.play('warn')
  }

  /** Off the set without a cheer (a popper that burst, a hatched timer, a mic's passenger). */
  private removeCrasher(c: Crasher) {
    this.crashers = this.crashers.filter((other) => other !== c)
    for (const other of this.crashers)
      if (other.leader === c) other.leader = c.leader
  }

  private get episode(): Episode {
    return this.inVault ? PRIZE_VAULT : this.season[this.episodeIndex]!
  }

  private has(mod: ModifierId): boolean {
    return this.modifier === mod
  }

  // --- the season ----------------------------------------------------------------

  private beginEpisode(index: number) {
    this.episodeIndex = index
    if (!this.inVault) this.keep()
    this.route = []
    this.modifiers.clear()
    this.episodeWon = emptyWallet()
    this.episodeTickets = 0
    this.episodeMedals = 0
    this.peakTier = tierOf(this.ratings)
    // Every episode opens from the wings: the map's left edge.
    this.enterRoom(this.episode.start, 3)
    if (this.perks.power)
      for (const c of this.team)
        c.powers[this.perks.power] = POWERS[this.perks.power].ticks
    this.banner = {
      text: this.episode.title,
      sub: `${this.billing()}: ${this.episode.subtitle}`,
      ticks: 120,
    }
  }

  /** What the cards call this episode: EPISODE n, or a Marathon leg. */
  private billing(): string {
    return this.episode.billing ?? `EPISODE ${this.episode.number}`
  }

  /** The modifier a map room plays under this loop, rolled once and kept. */
  private modifierFor(id: string): ModifierId | null {
    if (!this.modifiers.has(id)) {
      const script = roomById(this.episode, id).script
      this.modifiers.set(id, rollModifier(this.rng, this.loop, script))
    }
    return this.modifiers.get(id)!
  }

  private enterRoom(id: string, entry: Side) {
    this.commercial = null
    this.roomId = id
    this.secretId = null
    this.route.push(id)
    this.entryDoor = entry
    // Later passes play a remix of the room's script (prizeShow/modes.ts).
    this.script = remixScript(roomById(this.episode, id).script, id, this.loop)
    this.modifier = this.modifierFor(id)
    this.level = ++this.studios
    this.startRoom()
    if (this.script.commercial) this.openCommercial('map')
  }

  private enterSecret(id: string, entry: Side) {
    this.secretId = id
    if (!this.secretsFound.includes(this.roomId))
      this.secretsFound.push(this.roomId)
    this.entryDoor = entry
    this.script = remixScript(this.episode.secrets[id]!, id, this.loop)
    this.modifier = null
    this.level = ++this.studios
    this.startRoom()
  }

  private openMap(side: Side | null) {
    const options: MapOption[] = exitsOf(this.episode, this.roomId).map(
      (exit) => ({
        id: exit.room.id,
        side: exit.side,
        modifier: this.modifierFor(exit.room.id),
      }),
    )
    const cursor = Math.max(
      0,
      options.findIndex((o) => o.side === side),
    )
    this.map = { options, cursor, ticks: 0 }
    this.banner = null
  }

  private updateMap(input: InputFrame, flick: Dir | null = null) {
    const map = this.map!
    map.ticks++
    if (map.ticks < MAP_SETTLE) return
    const pressed = { ...input.pressed }
    if (flick) {
      if (Math.abs(flick.x) > Math.abs(flick.y))
        pressed[flick.x > 0 ? 'right' : 'left'] = true
      else pressed[flick.y > 0 ? 'down' : 'up'] = true
    }
    const sides: [keyof InputFrame['pressed'], Side][] = [
      ['up', 0],
      ['right', 1],
      ['down', 2],
      ['left', 3],
    ]
    for (const [button, side] of sides) {
      if (!pressed[button]) continue
      const facing = map.options.findIndex((o) => o.side === side)
      const count = map.options.length
      if (facing >= 0) map.cursor = facing
      else if (button === 'left') map.cursor = (map.cursor + count - 1) % count
      else if (button === 'right') map.cursor = (map.cursor + 1) % count
      this.sound.play('blip')
    }
    if (pressed.a || pressed.start || map.ticks >= MAP_AUTO) {
      const option = map.options[map.cursor]!
      this.riskyRoute = this.isRichPick(map.options, map.cursor)
      this.map = null
      this.sound.play('level')
      this.enterRoom(option.id, ((option.side + 2) % 4) as Side)
    }
  }

  /** Did Sparkle take the riskier, richer of two doors? */
  private isRichPick(options: readonly { id: string }[], cursor: number) {
    if (options.length < 2) return false
    const pick = roomById(this.episode, options[cursor]!.id).script
    return options.every((o, i) => {
      if (i === cursor) return true
      const other = roomById(this.episode, o.id).script
      return pick.danger > other.danger
    })
  }

  /** The episode's haul counts up, row by row, with a tick a count. */
  private openTally() {
    this.tally = {
      rows: tallyRows(
        this.episodeWon,
        this.episodeTickets,
        this.peakTier,
        this.loop,
        this.episodeMedals,
      ),
      ticks: 0,
      paid: 0,
    }
    this.banner = null
    this.sound.play('level')
  }

  private updateTally(input: InputFrame) {
    const tally = this.tally!
    tally.ticks++
    const counted = Math.floor(tally.ticks / TALLY_ROW)
    if (tally.ticks % 4 === 0 && counted < tally.rows.length)
      this.sound.play('blip')
    // Each row pays as it finishes counting (A finishes them all at once).
    const skip = input.pressed.a || input.pressed.start
    const done = skip ? tally.rows.length : Math.min(tally.rows.length, counted)
    while (tally.paid < done) {
      const row = tally.rows[tally.paid]!
      if (row.points) this.addScore(row.points, CX, 60 + tally.paid * 22)
      tally.paid++
      this.sound.play('pickup')
    }
    if (skip) tally.ticks = Math.max(tally.ticks, tally.rows.length * TALLY_ROW)
    const finished = tally.ticks >= tally.rows.length * TALLY_ROW + 90
    if (
      finished ||
      (skip && tally.ticks > tally.rows.length * TALLY_ROW + 20)
    ) {
      this.tally = null
      // Out of the Vault there is nothing left to buy: straight to the ending.
      if (this.inVault) this.finishEpisode()
      else this.openSwap()
    }
  }

  /** The Prize Swap: prizes in hand trade for help in the next episode. */
  private openSwap() {
    this.perks = { clock: 0, power: null, secret: false }
    this.swap = { cursor: 0, ticks: 0, bought: [] }
  }

  private updateSwap(input: InputFrame, flick: Dir | null) {
    const swap = this.swap!
    swap.ticks++
    const rows = SWAP_OFFERS.length + 1
    const up = input.pressed.up || (flick !== null && flick.y < -0.5)
    const down = input.pressed.down || (flick !== null && flick.y > 0.5)
    if (up) swap.cursor = (swap.cursor + rows - 1) % rows
    if (down) swap.cursor = (swap.cursor + 1) % rows
    if (up || down) this.sound.play('blip')
    const done =
      input.pressed.start ||
      swap.ticks >= SWAP_AUTO ||
      (input.pressed.a && swap.cursor === SWAP_OFFERS.length)
    if (input.pressed.a && swap.cursor < SWAP_OFFERS.length && swap.ticks > 20)
      this.buy(SWAP_OFFERS[swap.cursor]!.id)
    if (done && swap.ticks > 20) {
      this.swap = null
      if (
        this.mode === 'marathon' ||
        this.episodeIndex + 1 < this.season.length
      )
        this.openCommercial('episode')
      else this.finishEpisode()
    }
  }

  /** Can this swap be made now (affordable, and not already maxed out)? */
  canBuy(id: SwapId): boolean {
    const offer = SWAP_OFFERS.find((o) => o.id === id)!
    if (!affordable(offer, this.wallet, this.tickets.length)) return false
    if (id === 'power') return this.perks.power === null
    if (id === 'secret') return !this.perks.secret
    if (id === 'clock') return this.perks.clock < CLOCK_BONUS_CAP
    return this.lives < MAX_LIVES
  }

  private buy(id: SwapId) {
    if (!this.canBuy(id)) {
      this.sound.play('warn')
      return
    }
    const offer = SWAP_OFFERS.find((o) => o.id === id)!
    this.wallet.cash -= offer.cost.cash ?? 0
    this.wallet.toaster -= offer.cost.toaster ?? 0
    this.wallet.car -= offer.cost.car ?? 0
    if (offer.cost.ticket) this.tickets.pop()
    if (id === 'contestant') this.lives++
    if (id === 'power')
      this.perks.power =
        STARTING_POWERS[Math.floor(this.rng() * STARTING_POWERS.length)]!
    if (id === 'clock') this.perks.clock += 5
    if (id === 'secret') this.perks.secret = true
    this.swap!.bought.push(id)
    this.sound.play('extra')
  }

  /** A word from our sponsors: a mini-game (they take turns), paying out in prizes. */
  private openCommercial(then: 'episode' | 'map') {
    const kind = BREAK_ORDER[this.breaksAired % BREAK_ORDER.length]!
    this.breaksAired++
    this.commercial = {
      state: newBreak(kind, this.rng, this.team.length),
      then,
    }
    this.banner = null
    this.cutQueue = []
    this.speak('host', "WE'LL BE RIGHT BACK... AFTER YOU PLAY THIS!")
    this.sound.play('level')
  }

  private updateCommercial(inputs: readonly InputFrame[]) {
    const c = this.commercial!
    for (const ev of updateBreak(c.state, inputs, this.rng)) {
      const x = ev.x ?? CX
      const y = ev.y ?? CY
      if (ev.prize) {
        this.wallet[ev.prize]++
        this.seasonWon[ev.prize]++
        this.haul++
        this.addScore(PRIZE_POINTS[ev.prize], x, y)
        this.floaters.push({
          x,
          y: y - 12,
          text: PRIZE_NAMES[ev.prize],
          life: 45,
        })
        this.fx.burst(x, y, this.fxRng, { count: 10 })
      }
      if (ev.points) this.addScore(ev.points, x, y)
      if (ev.text) this.floaters.push({ x, y, text: ev.text, life: 35 })
      if (ev.sound) this.sound.play(ev.sound)
    }
    if (!breakDone(c.state)) return
    this.commercial = null
    if (c.then === 'episode') this.finishEpisode()
    else this.openMap(null)
  }

  /** A contestant drawn into a commercial (her own sprite, her seat's marker in co-op). */
  private drawSeat(
    g: CanvasRenderingContext2D,
    seat: number,
    x: number,
    y: number,
    face: 1 | -1,
    moving: boolean,
  ) {
    const c = this.team[seat]!
    const frame = moving ? 1 + (Math.floor(this.tick / 7) % 2) : 0
    dropShadow(g, x, y, 7, 2, 0.4)
    drawSprite(g, CONTESTANT_SPRITES[c.who].side[frame]!, x, y, {
      anchor: 'feet',
      flipX: face < 0,
    })
    if (this.team.length > 1)
      drawText(g, `P${seat + 1}`, x, y - 26, {
        align: 'center',
        color: SEAT_COLOURS[seat]!,
        outline: INK,
      })
  }

  private finishEpisode() {
    if (this.inVault) {
      // Out of the Vault with the grand prize: the true ending (still on the Vault's set).
      this.openEnding('true')
      return
    }
    if (this.mode === 'marathon') {
      // The Marathon never ends on its own: another leg, a step harder every two.
      const leg = this.episodeIndex + 1
      this.loop = marathonLoop(leg)
      this.tuning = loopTuning(this.loop)
      this.season = [...this.season, marathonLeg(leg, this.rng)]
      this.beginEpisode(leg)
      return
    }
    if (this.episodeIndex + 1 < this.season.length) {
      this.beginEpisode(this.episodeIndex + 1)
      return
    }
    // The Live Finale is won. Ten golden tickets open the Grand Prize Vault first.
    if (this.tickets.length >= VAULT_TICKETS) {
      this.inVault = true
      this.beginEpisode(this.episodeIndex)
      this.banner = {
        text: 'THE GRAND PRIZE VAULT!',
        sub: `${this.tickets.length} GOLDEN TICKETS OPEN THE DOORS`,
        ticks: 150,
      }
      return
    }
    this.openEnding('show')
  }

  /** The show's haul on the game-over card: prizes, tickets, best chain, medals, Marathon rooms. */
  private haulRows(): TallyRow[] {
    const rows = seasonRows(
      this.seasonWon,
      this.tickets.length,
      this.bestChain,
    ).filter((row) => this.mode !== 'marathon' || row.icon !== 'ticket')
    if (this.showMedals)
      rows.push({
        label: 'ROOM MEDALS',
        count: this.showMedals,
        points: 0,
        icon: 'medal',
      })
    if (this.mode === 'marathon')
      rows.push({
        label: 'MARATHON ROOMS',
        count: this.marathonRooms,
        points: 0,
        icon: 'bonus',
      })
    return rows
  }

  /** The season is cleared: the ending, then the credits, then a rerun. */
  private openEnding(kind: EndingKind) {
    this.seasonCleared = true
    this.keepProfile()
    const bonus = (kind === 'true' ? 500_000 : 250_000) * this.loop
    this.addScore(bonus, CX, CY)
    this.ending = {
      kind,
      ticks: 0,
      crowd: kind === 'true' ? this.joinedCrowd() : [],
    }
    this.banner = null
    this.cutQueue = []
    this.speak('host', ENDING_LINES[kind])
    this.audienceCheer = 240
    this.sound.play('level')
  }

  /** The party crashers, one of every kind, in the studio audience (the true ending). */
  private joinedCrowd(): Crasher[] {
    return CRASHER_KINDS.filter((kind) => kind !== 'crane').map((kind, i) => {
      const c = newCrasher(
        kind,
        24 + i * 16.5,
        BOTTOM - 14 - (i % 2) * 10,
        CONFETTI[i % CONFETTI.length]!,
        i * 7,
      )
      c.color = CONFETTI[i % CONFETTI.length]!
      return c
    })
  }

  /** Ticks the ending card holds before the credits roll, and how fast they roll. */
  private static readonly ENDING_HOLD = 360
  private static readonly CREDIT_SPEED = 0.5

  private creditsHeight(): number {
    return creditLines(this.ending!.kind).length * 12 + H
  }

  private updateEnding(input: InputFrame) {
    const e = this.ending!
    e.ticks++
    const hold = PrizeShowPanic.ENDING_HOLD
    const pressed = input.pressed.a || input.pressed.start
    if (e.ticks < hold) {
      if (pressed && e.ticks > 60) e.ticks = hold
      return
    }
    const rolled = (e.ticks - hold) * PrizeShowPanic.CREDIT_SPEED
    if (rolled >= this.creditsHeight() || (pressed && e.ticks > hold + 60)) {
      if (this.loop >= SERIES_LOOPS) {
        // The last rerun is done: that's the series. The show ends on a high.
        this.ending = null
        this.over = true
        this.finalRows = this.haulRows()
        this.banner = {
          text: "THAT'S THE SERIES!",
          sub: 'THANKS FOR WATCHING',
          ticks: 600,
        }
        this.speak(
          'host',
          "THAT'S THE SERIES, FOLKS. YOU WERE THE BEST CONTESTANTS WE EVER HAD.",
        )
        if (this.save) this.save = { ...this.save, continued: true }
        return
      }
      // The show goes on: a rerun of the season, harder.
      this.ending = null
      this.inVault = false
      this.loop++
      this.tuning = loopTuning(this.loop)
      this.beginEpisode(0)
      this.banner = {
        text: `RERUN ${this.loop - 1}!`,
        sub: 'THE SEASON AGAIN, HARDER',
        ticks: 140,
      }
    }
  }

  // --- rooms -------------------------------------------------------------------

  private startRoom() {
    const script = this.script
    const t = this.tuning
    const double = this.has('double-time')
    this.crashers = []
    this.streamers = []
    this.shots = []
    this.prizes = []
    this.tosses = []
    this.exits = []
    this.exitsOpen = false
    this.cleared = false
    this.hit = false
    this.prizeMissed = false
    this.roomGrabbed = 0
    this.haulMissed = false
    this.medalToast = null
    this.slip = 0
    this.vx = 0
    this.vy = 0
    this.roomTick = 0
    this.roomTicks = Math.round(script.seconds * 60 * t.clock)
    this.roomTimer = this.roomTicks
    this.invuln = INVULN_TICKS
    this.spawned = noCrashers()
    this.lobs = []
    this.slicks = []
    this.cases = []
    this.glitter = []
    this.decoy = null
    this.powers.cutout = 0
    this.lifted = 0
    this.trail = []
    const pace = t.waveTime * (double ? 0.75 : 1)
    this.waves = wavesAt(script, this.loop).map((wave) => ({
      wave,
      at: Math.round(wave.at * pace),
      left: wave.times ?? 1,
    }))
    this.nextToss = 150
    if (this.has('sudden-death')) this.powers.shield = 0
    this.placeTeam()
    this.cur = this.lead()

    this.mines = []
    this.beams = []
    this.booms = []
    this.pickups = []
    this.crack = null
    this.plates = []
    this.belts = []
    this.flours = []
    this.speakers = []
    this.rings = []
    this.pits = []
    this.turntable = null
    this.warps = []
    this.warpClock = 0
    const flankSide = [1, 3].map((k) => ((this.entryDoor + k) % 4) as Side)
    let flank = 0
    for (const prop of script.props ?? []) {
      switch (prop.kind) {
        case 'cushion':
        case 'peel':
          this.mines.push({ kind: prop.kind, x: prop.x, y: prop.y, fuse: 0 })
          break
        case 'beam':
          this.beams.push({ ...prop })
          break
        case 'camera': {
          const side =
            prop.wall === 'far'
              ? (((this.entryDoor + 2) % 4) as Side)
              : flankSide[flank++ % 2]!
          const crane = this.makeCrasher('crane', CX, CY)
          mountCrane(crane, side, prop.at, prop.every, prop.offset)
          break
        }
        case 'boom':
          this.booms.push({
            every: prop.every,
            offset: prop.offset,
            x: CX,
            y: CY,
          })
          break
        case 'pedestal':
          this.prizes.push({
            x: prop.x,
            y: prop.y,
            kind: this.prizeFor(prop.prize),
            life: PRIZE_LIFE,
            pedestal: true,
            lift: 0,
          })
          break
        case 'ticket':
          if (!this.tickets.includes(prop.id))
            this.pickups.push({ x: prop.x, y: prop.y, id: prop.id })
          break
        case 'hotplate':
          this.plates.push(prop)
          break
        case 'belt':
          this.belts.push(prop)
          break
        case 'flour':
          this.flours.push(newFlour(prop.x, prop.y, prop.r, prop.drift))
          break
        case 'speaker':
          this.speakers.push(prop)
          break
        case 'mosh':
          this.pits.push({ x: prop.x, y: prop.y, r: prop.r, spin: prop.spin })
          break
        case 'turntable':
          this.turntable = prop
          break
        case 'warp':
          this.warps.push(prop)
          break
        case 'crack': {
          const door = DOORS[prop.side]!
          const along = prop.side % 2 === 0
          this.crack = {
            side: prop.side,
            x: along ? door.x + prop.at : door.x,
            y: along ? door.y : door.y + prop.at,
            hp: 6,
            secret: prop.secret,
          }
          break
        }
      }
    }

    this.boss = null
    if (script.boss) {
      this.boss = newBoss(
        script.boss,
        t.bossHp * (1 + COOP_BOSS * (this.team.length - 1)),
        !this.secretId && this.roomId === this.episode.finale,
      )
      this.banner = {
        text: script.boss.title,
        sub: script.boss.sub,
        ticks: 120,
      }
    } else {
      this.banner = { text: script.title, sub: script.tagline, ticks: 100 }
    }
    if (this.modifier) {
      const mod = MODIFIERS[this.modifier]
      this.banner = { text: mod.title, sub: mod.tagline, ticks: 110 }
    }
    if (script.closes) this.openExits()
    // The set's loop, or the boss theme; a room on the beat starts its loop with the room.
    const loop =
      script.boss?.kind === 'machine'
        ? FINALE_MUSIC
        : script.boss
          ? BOSS_MUSIC
          : SET_MUSIC[this.roomSet()]
    this.musicNow = script.beat && !script.boss ? { ...loop } : loop
    this.lowTimeSaid = false
    this.packages = []
    // One care package a room at most: Prime Time is a treat, not a supply line.
    this.packageClock = RATINGS.packageEvery / 3
    this.roomTicks += this.perks.clock * 60
    this.roomTimer = this.roomTicks
    if (this.perks.secret && this.crack) this.crack.hp = 0
    if (script.boss) {
      // A stock welcome, then the boss's own introduction.
      this.say('boss-intro')
      this.cutQueue.unshift({ voice: 'host', text: script.boss.line })
    } else if (this.riskyRoute) this.say('risky-route')
    else this.say('room-start')
    this.riskyRoute = false
  }

  /** Sudden Death has no shields: they come out as cash. */
  private prizeFor(kind: PrizeKind): PrizeKind {
    return kind === 'shield' && this.has('sudden-death') ? 'cash' : kind
  }

  private wavesDone(): boolean {
    return this.waves.every((w) => w.left <= 0)
  }

  /** Doors to the map's neighbours (or the way back from a secret), and a broken wall. */
  private openExits() {
    this.exitsOpen = true
    if (this.secretId) {
      const door = DOORS[this.entryDoor]!
      this.exits = [
        { side: this.entryDoor, x: door.x, y: door.y, to: '', kind: 'back' },
      ]
      return
    }
    this.exits = exitsOf(this.episode, this.roomId).map((exit) => {
      const door = DOORS[exit.side]!
      return {
        side: exit.side,
        x: door.x,
        y: door.y,
        to: exit.room.id,
        kind: 'door' as const,
      }
    })
    if (this.crack && this.crack.hp <= 0) this.openCrack()
  }

  private openCrack() {
    const crack = this.crack!
    if (this.exits.some((e) => e.kind === 'secret')) return
    this.exits.push({
      side: crack.side,
      x: crack.x,
      y: crack.y,
      to: crack.secret,
      kind: 'secret',
    })
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame, players?: InputFrame[]) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.medalToast && --this.medalToast.ticks <= 0) this.medalToast = null
    this.updateCutIns()
    if (this.over) {
      this.overTicks++
      return
    }
    const controls = this.demo ? this.demoInput() : input
    const stick =
      controls.aim && Math.hypot(controls.aim.x, controls.aim.y) >= AIM_MIN
        ? controls.aim
        : null
    const flicked = stick !== null && !this.aimedBefore
    this.aimedBefore = stick !== null

    if (this.choosing) {
      this.updateChoice(controls)
      return
    }
    if (this.menu) {
      this.updateMenu(controls)
      return
    }
    if (this.picking) {
      this.updatePick(
        players?.length ? [controls, ...players.slice(1)] : [controls],
      )
      return
    }
    if (this.ending) {
      this.updateEnding(controls)
      return
    }
    if (this.commercial) {
      const state = this.commercial.state
      this.updateCommercial(
        this.demo
          ? state.seats.map((_, i) => breakPilot(state, i))
          : players?.length
            ? [controls, ...players.slice(1)]
            : [controls],
      )
      return
    }
    if (this.map) {
      this.updateMap(controls, flicked ? stick : null)
      return
    }
    if (this.tally) {
      this.updateTally(controls)
      return
    }
    if (this.swap) {
      this.updateSwap(controls, flicked ? stick : null)
      return
    }
    if (this.transition > 0) {
      if (--this.transition === 0) this.follow()
      return
    }
    if (this.dead > 0) {
      if (--this.dead === 0) {
        if (this.lives <= 0) {
          this.over = true
          this.banner = null
          this.finalRows = this.haulRows()
          this.say('game-over')
          // A save from this run can be picked up again, but its score starts over.
          if (this.save && this.mode !== 'marathon')
            this.save = { ...this.save, continued: true }
        } else {
          this.startRoom()
        }
      }
      return
    }

    this.roomTick++
    if (--this.roomTimer <= 0) {
      if (this.script.closes) this.closeSet()
      else this.timeUp()
      return
    }
    this.updateShow()
    if (!this.lowTimeSaid && !this.script.closes && this.roomTimer <= 600) {
      this.lowTimeSaid = true
      this.say('low-time')
    }
    // Each contestant takes her turn: her own frame (seat 1's is the cabinet's), her own moves.
    this.team.forEach((c, i) => {
      this.cur = c
      if (c.down !== 0) {
        this.updateDown(c)
        return
      }
      if (i === 0) {
        this.stepContestant(controls, stick)
        return
      }
      const frame = players?.[i] ?? emptyInput()
      const aim =
        frame.aim && Math.hypot(frame.aim.x, frame.aim.y) >= AIM_MIN
          ? frame.aim
          : null
      this.stepContestant(frame, aim)
    })
    this.cur = this.lead()
    this.spawnWaves()
    this.updateShots()
    this.updateCrashers()
    this.updateMines()
    this.updateBeams()
    this.updateBoss()
    this.updateHazards()
    this.updateStreamers()
    this.updateLobs()
    this.updateSlicks()
    this.updateBooms()
    this.updateArsenal()
    this.updatePrizes()
    this.updatePickups()
    this.updateTosses()
    this.checkClear()
    this.checkExit()
  }

  /** One contestant's turn: her timers, then the boom mic's lift or her own moves and spray. */
  private stepContestant(controls: InputFrame, stick: Dir | null) {
    const c = this.cur
    if (c.invuln > 0) c.invuln--
    for (const kind of POWER_KINDS) if (c.powers[kind] > 0) c.powers[kind]--
    if (c.popperClock > 0) c.popperClock--
    // Glimmer's own shield recharges a while after it pops.
    const kit = CONTESTANTS[c.who]
    if (kit.recharge > 0 && !c.guard && --c.guardClock <= 0) {
      c.guard = true
      this.floaters.push({ x: c.px, y: c.py - 16, text: 'GUARD UP!', life: 30 })
    }
    c.trail.push({ x: c.px, y: c.py })
    if (c.trail.length > HISTORY) c.trail.shift()
    const fromX = c.px
    const fromY = c.py
    if (c.fireCooldown > 0) c.fireCooldown--
    if (c.lifted > 0) {
      this.updateLift()
    } else {
      this.move(controls, stick)
      this.carry()
      this.warp()
      c.aiming = stick !== null
      if (stick) {
        const len = Math.hypot(stick.x, stick.y)
        c.aim = { x: stick.x / len, y: stick.y / len }
      }
      if ((controls.held.a || c.aiming) && c.fireCooldown === 0) this.fire()
    }
    c.striding = c.px !== fromX || c.py !== fromY
    if (c.striding) c.stride++
  }

  /** Teleport doors: step into one and come out of the other (her turn; a short cool-down). */
  private warp() {
    if (this.warpClock > 0) this.warpClock--
    else if (this.lifted === 0)
      for (const w of this.warps) {
        const from = Math.hypot(this.px - w.x1, this.py - w.y1) < 9
        const to = Math.hypot(this.px - w.x2, this.py - w.y2) < 9
        if (!from && !to) continue
        this.burst(this.px, this.py, 8, RAMPS.teal[4])
        this.px = from ? w.x2 : w.x1
        this.py = from ? w.y2 : w.y1
        this.warpClock = 50
        this.burst(this.px, this.py, 8, RAMPS.teal[4])
        this.sound.play('blip')
        break
      }
  }

  /** A knocked-down contestant (co-op) is back on set after a moment, safe for a while. */
  private updateDown(c: Contestant) {
    if (c.down <= 0 || --c.down > 0) return
    const spot = this.safeSpot()
    Object.assign(c, {
      px: spot.x,
      py: spot.y,
      vx: 0,
      vy: 0,
      slip: 0,
      lifted: 0,
      trail: [],
      invuln: INVULN_TICKS,
    })
    this.floaters.push({ x: c.px, y: c.py - 16, text: 'BACK IN!', life: 40 })
    this.sound.play('start')
  }

  /** The countdown ran out: it costs the team a contestant and the room starts again. */
  private timeUp() {
    if (this.team.length === 1) {
      this.loseLife("TIME'S UP!")
      return
    }
    if (this.dead > 0) return
    this.hit = true
    this.lives = Math.max(0, this.lives - 1)
    this.dead = DEATH_TICKS
    this.banner = { text: "TIME'S UP!", ticks: 80 }
    this.sound.play('die')
    if (this.lives > 0) this.say('death')
  }

  /** Placing everyone at the door they came in by, side by side (a new room, or a restart). */
  private placeTeam() {
    const entry = DOORS[this.entryDoor]!
    const bx = entry.x + (CX - entry.x) * 0.25
    const by = entry.y + (CY - entry.y) * 0.25
    const across = this.entryDoor % 2 === 0
    const offsets = [0, 14, -14, 28]
    this.team.forEach((c, i) => {
      // A contestant who was out comes back if the team has lives to spare.
      if (c.down !== 0 && (c.down > 0 || this.lives > 0)) c.down = 0
      Object.assign(c, {
        px: bx + (across ? offsets[i]! : 0),
        py: by + (across ? 0 : offsets[i]!),
        vx: 0,
        vy: 0,
        slip: 0,
        lifted: 0,
        trail: [],
        invuln: INVULN_TICKS,
      })
      c.powers.cutout = 0
      if (this.has('sudden-death')) c.powers.shield = 0
    })
  }

  /** Where Sparkle goes once the transition ends. */
  private follow() {
    const next = this.next
    this.next = null
    if (!next) return
    if (next.to === 'map') this.openMap(next.side)
    else if (next.to === 'secret')
      this.enterSecret(next.id, ((next.side + 2) % 4) as Side)
    else this.openTally()
  }

  private move(input: InputFrame, stick: Dir | null = null) {
    let dx = 0
    let dy = 0
    if (input.held.left) dx -= 1
    if (input.held.right) dx += 1
    if (input.held.up) dy -= 1
    if (input.held.down) dy += 1
    // Holding B locks the aim so Sparkle can strafe; a second stick aims on its own.
    if ((dx || dy) && !input.held.b && !stick) this.aim = { x: dx, y: dy }
    const len = Math.hypot(dx, dy) || 1
    const speed =
      SPEED *
      CONTESTANTS[this.cur.who].speed *
      (this.powers.skates > 0 ? ARSENAL.skateSpeed : 1)
    let mx = (dx / len) * speed
    let my = (dy / len) * speed
    if (this.slip > 0) {
      // On a banana peel: no steering until she stops sliding.
      this.slip--
      mx = this.vx
      my = this.vy
    } else if (this.script.lowGravity) {
      // Low gravity: she drifts on her momentum and steers slowly.
      this.vx += (mx - this.vx) * (dx || dy ? 0.045 : 0.008)
      this.vy += (my - this.vy) * (dx || dy ? 0.045 : 0.008)
      mx = this.vx
      my = this.vy
    } else if (this.has('foam') || this.inCream()) {
      this.vx += (mx - this.vx) * (dx || dy ? 0.06 : 0.025)
      this.vy += (my - this.vy) * (dx || dy ? 0.06 : 0.025)
      mx = this.vx
      my = this.vy
    } else {
      this.vx = mx
      this.vy = my
    }
    const nx = Math.max(LEFT + HALF, Math.min(RIGHT - HALF, this.px + mx))
    const ny = Math.max(TOP + HALF, Math.min(BOTTOM - HALF, this.py + my))
    if (nx !== this.px + mx) this.vx = 0
    if (ny !== this.py + my) this.vy = 0
    this.px = nx
    this.py = ny
    this.bumpCases()
  }

  /** Counters, mosh pits and the turning ring move Sparkle; the ring's hub is solid. */
  private carry() {
    const belt = beltPush(this.belts, this.px, this.py + 3)
    const pit = pitShove(
      this.pits,
      this.px,
      this.py,
      this.roomTick,
      this.beat(),
    )
    const ring = this.turnPush(this.px, this.py)
    const dx = belt.x + pit.x + ring.x
    const dy = belt.y + pit.y + ring.y
    if (dx || dy) {
      this.px = Math.max(LEFT + HALF, Math.min(RIGHT - HALF, this.px + dx))
      this.py = Math.max(TOP + HALF, Math.min(BOTTOM - HALF, this.py + dy))
    }
    const hub = this.outOfHub(this.px, this.py, HALF)
    this.px = hub.x
    this.py = hub.y
    this.bumpCases()
  }

  /** How far the turning ring carries something at (x, y) this tick (round the middle). */
  private turnPush(x: number, y: number): Point {
    const t = this.turntable
    if (!t) return { x: 0, y: 0 }
    const dx = x - CX
    const dy = y - CY
    const r = Math.hypot(dx, dy)
    if (r < t.inner || r > t.outer) return { x: 0, y: 0 }
    return { x: -dy * t.spin, y: dx * t.spin }
  }

  /** (x, y) pushed out of the ring's solid hub (radius `pad` for whoever is standing there). */
  private outOfHub(x: number, y: number, pad = 0): Point {
    const t = this.turntable
    if (!t) return { x, y }
    const dx = x - CX
    const dy = y - CY
    const r = Math.hypot(dx, dy)
    const hub = t.inner - 6 + pad
    if (r >= hub) return { x, y }
    const a = r > 0.001 ? Math.atan2(dy, dx) : Math.PI / 2
    return { x: CX + Math.cos(a) * hub, y: CY + Math.sin(a) * hub }
  }

  /** Is (x, y) inside the hub (it stops confetti and streamers)? */
  private inHub(x: number, y: number): boolean {
    const t = this.turntable
    return !!t && Math.hypot(x - CX, y - CY) < t.inner - 6
  }

  /** Standing in pie cream: as slippery as a foam party. */
  private inCream(): boolean {
    return this.slicks.some(
      (s) =>
        s.kind === 'cream' && Math.hypot(s.x - this.px, s.y - this.py) < s.r,
    )
  }

  /** Flight cases are solid: Sparkle is pushed out of any she walks (or is shoved) into. */
  private bumpCases() {
    for (const box of this.cases) {
      const ox = CASE_HALF_W + HALF - Math.abs(this.px - box.x)
      const oy = CASE_HALF_H + HALF - Math.abs(this.py - box.y)
      if (ox <= 0 || oy <= 0) continue
      if (ox < oy) this.px += this.px < box.x ? -ox : ox
      else this.py += this.py < box.y ? -oy : oy
      this.px = Math.max(LEFT + HALF, Math.min(RIGHT - HALF, this.px))
      this.py = Math.max(TOP + HALF, Math.min(BOTTOM - HALF, this.py))
    }
  }

  /** Is (x, y) inside a flight case? (it stops confetti and streamers alike) */
  private inCase(x: number, y: number): boolean {
    return this.cases.some(
      (box) =>
        Math.abs(x - box.x) < CASE_HALF_W && Math.abs(y - box.y) < CASE_HALF_H,
    )
  }

  private fire() {
    const p = this.powers
    const kit = CONTESTANTS[this.cur.who]
    const rocket = p.rockets > 0
    const laser = p.laser > 0
    this.fireCooldown = Math.round(
      (laser
        ? ARSENAL.laserCooldown
        : rocket
          ? ARSENAL.rocketCooldown
          : p.rapid > 0
            ? RAPID_COOLDOWN
            : FIRE_COOLDOWN) * kit.cooldown,
    )
    const base = Math.atan2(this.aim.y, this.aim.x)
    // Her own spray (Boomer's is three wide), opened up by the spread power (Zippy's stays narrow).
    const own =
      kit.shots === 3 ? [base - kit.spread, base, base + kit.spread] : [base]
    const fan = this.cur.who === 'zippy' ? 0.12 : 0.25
    const angles = p.spread > 0 ? [base - fan, ...own, base + fan] : own
    for (const a of angles) {
      if (laser) {
        this.fireLaser(a)
        continue
      }
      const speed = rocket ? ARSENAL.rocketSpeed : SHOT_SPEED
      this.shots.push({
        x: this.px + Math.cos(a) * 7,
        y: this.py + Math.sin(a) * 7,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life: rocket ? 100 : SHOT_LIFE,
        hue: Math.floor(this.rng() * CONFETTI.length),
        kind: rocket ? 'rocket' : 'confetti',
        foamy: p.foamgun > 0,
        damage: (rocket ? ARSENAL.rocketDamage : 1) * kit.damage,
        pierce: rocket ? ARSENAL.rocketPierce : 0,
        hits: [],
      })
    }
    if (p.poppers > 0 && this.popperClock <= 0) {
      this.lobPopper(base)
      this.popperClock = ARSENAL.popperEvery
    }
    if (this.tick % 3 === 0) this.sound.play(laser ? 'blip' : 'shoot')
  }

  /** The glitter laser: a line to the wall that cheers everything along it (cases stop it). */
  private fireLaser(angle: number) {
    const dx = Math.cos(angle)
    const dy = Math.sin(angle)
    const x0 = this.px + dx * 6
    const y0 = this.py + dy * 6
    const struck = new Set<Crasher>()
    let x1 = x0
    let y1 = y0
    let bossHit = false
    for (let d = 0; d < 400; d += 3) {
      const x = x0 + dx * d
      const y = y0 + dy * d
      if (x < LEFT || x > RIGHT || y < TOP || y > BOTTOM || this.inCase(x, y))
        break
      x1 = x
      y1 = y
      let stop = false
      for (const c of this.crashers) {
        if (struck.has(c) || !shootable(c)) continue
        const [hw, hh] = hitBox(c)
        if (
          Math.abs(c.x - x) > hw + ARSENAL.laserHalf ||
          Math.abs(c.y - c.z - y) > hh + ARSENAL.laserHalf
        )
          continue
        struck.add(c)
        if (deflects(c, dx, dy)) stop = true
      }
      if (!bossHit && this.boss && this.damageBoss(1, x, y)) {
        bossHit = true
        stop = true
      }
      for (const st of this.streamers)
        if (Math.abs(st.x - x) < 5 && Math.abs(st.y - y) < 5) st.life = 0
      if (stop) break
    }
    for (const c of struck) {
      if (!this.crashers.includes(c)) continue
      this.burst(c.x, c.y - c.z, 3, RAMPS.cream[4])
      this.hitCrasher(c, 1, dx, dy, this.powers.foamgun > 0)
    }
    this.glitter.push({ x0, y0, x1, y1, life: ARSENAL.laserShow })
  }

  /** A party popper, lobbed ahead along the aim. */
  private lobPopper(angle: number) {
    this.lobs.push({
      x0: this.px,
      y0: this.py - 6,
      x1: clampX(this.px + Math.cos(angle) * ARSENAL.popperRange, 8),
      y1: clampY(this.py + Math.sin(angle) * ARSENAL.popperRange, 8),
      t: 0,
      dur: ARSENAL.popperFlight,
      kind: 'popper',
    })
  }

  /** A popper lands: confetti over everyone close (plates don't help against it from above). */
  private popperBlast(x: number, y: number) {
    for (let i = 0; i < 4; i++) this.burst(x, y, 6, CONFETTI[i]!)
    this.fx.burst(x, y, this.fxRng, { count: 12, speed: 2.2 })
    this.floaters.push({ x, y: y - 10, text: 'POP!', life: 30 })
    this.sound.play('pop')
    for (const c of [...this.crashers]) {
      if (!shootable(c)) continue
      if (Math.hypot(c.x - x, c.y - y) < ARSENAL.popperBlast)
        this.hitCrasher(c, ARSENAL.popperDamage, 0, 0, false)
    }
    this.damageBoss(ARSENAL.popperDamage, x, y, 6)
    for (const m of this.mines)
      if (
        m.kind === 'cushion' &&
        m.fuse === 0 &&
        Math.hypot(m.x - x, m.y - y) < ARSENAL.popperBlast
      )
        m.fuse = 12
  }

  /**
   * Confetti lands on a crasher: a plate turns it (false), otherwise it counts, double on a
   * dizzy mascot, and foam slows it and foams the floor under it.
   */
  private hitCrasher(
    c: Crasher,
    damage: number,
    vx: number,
    vy: number,
    foamy: boolean,
  ): boolean {
    if (deflects(c, vx, vy)) {
      this.burst(
        c.x + Math.cos(c.face) * 9,
        c.y + Math.sin(c.face) * 6,
        2,
        RAMPS.steel[4],
      )
      if (c.kind === 'tank') c.armorHitsLeft = Math.max(0, c.armorHitsLeft - 1)
      this.floaters.push({
        x: c.x,
        y: c.y - 16,
        text:
          c.kind === 'tank'
            ? c.armorHitsLeft === 0
              ? 'ARMOR OFF!'
              : 'FLANK! / ARMOR ' + c.armorHitsLeft
            : 'CLANG!',
        life: 40,
      })
      this.sound.play(
        c.kind === 'tank' && c.armorHitsLeft === 0 ? 'pickup' : 'blip',
      )
      return false
    }
    if (foamy) {
      c.slow = ARSENAL.foamSlow
      this.addSlick(c.x, c.y + 4, 'foam')
    }
    c.hp -= c.kind === 'mascot' && c.mode === 3 ? damage * 2 : damage
    if (c.hp <= 0) this.cheer(c)
    return true
  }

  /** Confetti (or a blast) strikes the boss at (x, y): true if it hit anything solid. */
  private damageBoss(damage: number, x: number, y: number, pad = 0): boolean {
    const b = this.boss
    if (!b) return false
    const target = bossTargetAt(b, x, y, pad)
    if (!target) return false
    if (!target.open || b.shift > 0) {
      if (this.tick % 8 === 0) {
        this.floaters.push({ x, y: y - 8, text: 'PFFT!', life: 20 })
        this.sound.play('blip')
      }
      return true
    }
    const callout = strikeBoss(b, target, damage, this.bossWorld)
    this.camFlash = 4
    if (callout) {
      this.addScore(1500 * this.loop, x, y - 10)
      this.rate(RATINGS.cheer * 4)
      this.audienceCheer = Math.max(this.audienceCheer, 40)
      this.applause = Math.max(this.applause, 40)
      this.floaters.push({ x, y: y - 18, text: callout, life: 40 })
    }
    if (b.hp <= 0) this.bossDown()
    return true
  }

  /** The script's waves: each comes through its doors on its tick. */
  private spawnWaves() {
    const pace = this.tuning.waveTime * (this.has('double-time') ? 0.75 : 1)
    for (const run of this.waves) {
      while (run.left > 0 && this.roomTick >= run.at) {
        this.spawnWave(run.wave)
        run.left--
        run.at += Math.max(1, Math.round((run.wave.every ?? 0) * pace))
      }
    }
  }

  private spawnWave(wave: Wave) {
    let sides: Side[]
    if (wave.doors === 'any') {
      const open = ([0, 1, 2, 3] as Side[]).filter(
        (side) => side !== this.entryDoor,
      )
      sides = [open[Math.floor(this.rng() * open.length)]!]
    } else {
      sides = doorSides(wave.doors, this.entryDoor)
    }
    // More hands on stage, more crashers through the doors (a mini-boss stays one).
    const count = wave.fixed
      ? waveCount(wave, this.loop)
      : Math.round(waveCount(wave, this.loop) * this.crowdFactor())
    for (const side of sides) {
      const door = DOORS[side]!
      this.spawned[wave.kind] += count
      if (wave.kind === 'conga') {
        let leader: Crasher | null = null
        for (let i = 0; i < count; i++) {
          const c = this.makeCrasher('conga', door.x, door.y)
          c.leader = leader
          leader = c
        }
      } else if (wave.kind === 'grabber') {
        for (let i = 0; i < count; i++) {
          this.makeCrasher(
            'grabber',
            door.x + (this.rng() - 0.5) * 16,
            door.y + (this.rng() - 0.5) * 16,
          )
        }
      } else if (wave.kind === 'crane') {
        for (let i = 0; i < count; i++) {
          const c = this.makeCrasher('crane', door.x, door.y)
          const at = count === 1 ? 0.6 : -0.8 + (1.6 * i) / (count - 1)
          mountCrane(c, side, at, 150, i * 37)
        }
      } else {
        for (let i = 0; i < count; i++)
          this.makeCrasher(
            wave.kind,
            door.x + (i - (count - 1) / 2) * 12,
            door.y,
          )
      }
    }
    if (wave.doors === 'all') this.sound.play('warn')
    if (wave.kind === 'mascot') {
      this.banner = {
        text: 'MASCOT!',
        sub: 'DODGE THE CHARGE, HIT ITS BACK',
        ticks: 100,
      }
      this.sound.play('warn')
    }
  }

  private makeCrasher(kind: Kind, x: number, y: number): Crasher {
    const a = Math.atan2(CY - y, CX - x) + (this.rng() - 0.5)
    const c = newCrasher(kind, x, y, CONFETTI[0]!, Math.floor(this.rng() * 60))
    c.color = CONFETTI[Math.floor(this.rng() * CONFETTI.length)]!
    if (kind === 'bouncer') {
      c.vx = Math.cos(a) * 1.4
      c.vy = Math.sin(a) * 1.4
    }
    if (kind === 'mascot') {
      c.hp = c.maxHp = Math.round(ROSTER.mascot.hp * this.tuning.bossHp)
    }
    this.crashers.push(c)
    return c
  }

  private updateShots() {
    for (const s of this.shots) {
      s.x += s.vx
      s.y += s.vy
      s.life--
      for (const f of this.flours)
        if (inFlour(f, s.x, s.y))
          f.density = Math.max(0, f.density - FLOUR.thin)
      if (this.inHub(s.x, s.y)) {
        s.life = 0
        continue
      }
      const crack = this.crack
      if (
        crack &&
        crack.hp > 0 &&
        Math.abs(crack.x - s.x) < 12 &&
        Math.abs(crack.y - s.y) < 12
      ) {
        s.life = 0
        this.hitCrack(crack)
        continue
      }
      if (s.x < LEFT || s.x > RIGHT || s.y < TOP || s.y > BOTTOM) s.life = 0
      if (s.life <= 0) continue
      if (this.inCase(s.x, s.y)) {
        // Flight cases are cover: confetti thuds against them.
        s.life = 0
        this.burst(s.x, s.y, 2, RAMPS.steel[3])
        continue
      }
      const hit = this.crashers.find((c) => {
        if (!shootable(c) || s.hits.includes(c)) return false
        const [hw, hh] = hitBox(c)
        return Math.abs(c.x - s.x) < hw && Math.abs(c.y - c.z - s.y) < hh
      })
      if (hit) {
        this.burst(s.x, s.y, 3, CONFETTI[s.hue]!)
        const landed = this.hitCrasher(hit, s.damage, s.vx, s.vy, s.foamy)
        if (!landed || s.pierce <= 0) s.life = 0
        else {
          s.pierce--
          s.hits.push(hit)
        }
        continue
      }
      const mine = this.mines.find(
        (m) =>
          m.kind === 'cushion' &&
          m.fuse === 0 &&
          Math.abs(m.x - s.x) < 8 &&
          Math.abs(m.y - s.y) < 6,
      )
      if (mine) {
        // Pop a cushion from range: it goes off where it lies.
        s.life = 0
        mine.fuse = 12
        continue
      }
      if (this.boss && this.damageBoss(s.damage, s.x, s.y)) {
        s.life = 0
        this.burst(s.x, s.y, 2, CONFETTI[s.hue]!)
        continue
      }
      // Confetti knocks streamers out of the air too.
      const streamer = this.streamers.find(
        (st) => Math.abs(st.x - s.x) < 5 && Math.abs(st.y - s.y) < 5,
      )
      if (streamer) {
        streamer.life = 0
        if (s.kind !== 'rocket') s.life = 0
      }
    }
    this.shots = this.shots.filter((s) => s.life > 0)
  }

  private hitCrack(crack: Crack) {
    crack.hp--
    this.burst(crack.x, crack.y, 3, RAMPS.cream[3])
    if (crack.hp > 0) return
    this.burst(crack.x, crack.y, 14, RAMPS.purple[3])
    this.fx.burst(crack.x, crack.y, this.fxRng, {
      count: 14,
      colours: [RAMPS.purple[4], RAMPS.purple[3], RAMPS.gold[4]],
    })
    this.banner = {
      text: 'A SECRET!',
      sub: 'CLEAR THE SET, THEN GO IN',
      ticks: 90,
    }
    this.sound.play('extra')
    if (this.exitsOpen) this.openCrack()
  }

  /** Confetti'd: the crasher gets happy and dances off the set. */
  private cheer(c: Crasher) {
    if (!this.crashers.includes(c)) return
    this.removeCrasher(c)
    if (c.kind === 'popper') burstPopper(c, this.world)
    if (c.flightCase) c.flightCase.pushed = false
    if (c.prize) {
      c.prize.lift = 0
      c.prize = null
    }
    if (c.kind === 'crane') {
      this.floaters.push({ x: c.x, y: c.y + 14, text: 'CUT!', life: 40 })
      this.burst(c.x, c.y, 12, RAMPS.sky[3])
    } else {
      this.dancers.push({
        x: c.x,
        y: c.y,
        vx: this.rng() < 0.5 ? -1.2 : 1.2,
        life: 50,
        color: c.color,
      })
    }
    this.chain = this.chainClock > 0 ? this.chain + 1 : 1
    this.chainClock = CHAIN_WINDOW
    this.bestChain = Math.max(this.bestChain, this.chain)
    this.sinceCheer = 0
    this.applause = 30
    this.rate(RATINGS.cheer)
    if (chainMilestone(this.chain)) {
      // The host counts the chain out.
      this.rate(RATINGS.chainStep)
      this.audienceCheer = Math.max(this.audienceCheer, 50)
      this.floaters.push({
        x: c.x,
        y: c.y - 22,
        text: `${this.chain} CHAIN! X${chainMultiplier(this.chain)}`,
        life: 50,
      })
      this.say(
        'chain',
        `${this.chain} IN A ROW! X${chainMultiplier(this.chain)}!`,
      )
    }
    this.addScore(
      Math.round(
        ROSTER[c.kind].points * Math.ceil(this.level / 2) * this.multiplier(),
      ),
      c.x,
      c.y - 10,
    )
    this.burst(c.x, c.y, 8, c.color)
    this.fx.burst(c.x, c.y - 4, this.fxRng, { count: 6 })
    if (c.kind === 'mascot') {
      for (let i = 0; i < 3; i++)
        this.fx.burst(c.x + (i - 1) * 12, c.y - 8, this.fxRng, {
          count: 12,
          speed: 2.2,
        })
      this.banner = { text: 'MASCOT CHEERED!', ticks: 90 }
    }
    this.sound.play('pop')
    const rate =
      (this.script.dropRate ?? DROP_RATE) * (this.has('double-time') ? 2 : 1)
    if (this.rng() < rate) {
      this.dropPrize(c.x, c.y)
      if (this.script.doubleDrops) this.dropPrize(c.x + 10, c.y)
    }
  }

  private dropPrize(x: number, y: number) {
    const roll = this.rng()
    const kind: PrizeKind =
      roll < 0.35
        ? 'cash'
        : roll < 0.53
          ? 'toaster'
          : roll < 0.6
            ? 'car'
            : powerFromRoll((roll - 0.6) / 0.4)
    this.prizes.push({
      x: Math.max(LEFT + 8, Math.min(RIGHT - 8, x)),
      y: Math.max(TOP + 8, Math.min(BOTTOM - 8, y)),
      kind: this.prizeFor(kind),
      life: PRIZE_LIFE,
      lift: 0,
    })
  }

  /** Crashers' walking pace; never quite Sparkle's, so a crowd can always be outrun. */
  private crasherSpeed(): number {
    return Math.min(
      CRASHER_TOP_SPEED,
      levelCurve(this.level, PANIC_CURVES.grabberSpeed) *
        (this.script.pace ?? 1) *
        this.tuning.speed *
        (this.has('double-time') ? 1.35 : 1),
    )
  }

  private updateCrashers() {
    const foam = this.has('foam')
    for (const c of [...this.crashers]) {
      if (!this.crashers.includes(c)) continue
      // Each crasher goes after the contestant nearest it (the world's player() is her now).
      this.cur = this.nearestTo(c.x, c.y)
      const goal = this.chase()
      c.t++
      if (FOUNDERS.has(c.kind)) {
        if (c.slow > 0) c.slow--
        if (c.pumped > 0) c.pumped--
        this.moveFounder(c, goal, foam)
      } else {
        updateCrasher(c, this.world)
        if (!this.crashers.includes(c)) continue
      }
      const d = this.decoy
      if (
        d &&
        touches(c) &&
        Math.abs(c.x - d.x) < 9 &&
        Math.abs(c.y - d.y) < 9 &&
        c.t % 15 === 0
      )
        d.hp--
      if (touches(c))
        this.eachContestant(() => {
          if (this.touching(c.x, c.y, reachOf(c)))
            this.loseLife(BUMP_LINES[c.kind] ?? 'MOBBED!')
        })
      if (this.dead > 0) break
    }
    this.cur = this.lead()
  }

  /** The four founding crashers: grabbers, bouncers, conga lines and throwers. */
  private moveFounder(c: Crasher, goal: Point, foam: boolean) {
    const speed = this.pace(c)
    let mx = 0
    let my = 0
    if (c.kind === 'grabber') {
      const dx = goal.x - c.x
      const dy = goal.y - c.y
      const d = Math.hypot(dx, dy) || 1
      mx = (dx / d) * speed + Math.sin(c.t / 7) * 0.3
      my = (dy / d) * speed
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
          mx = (dx / d) * speed * 1.3
          my = (dy / d) * speed * 1.3
        }
      } else {
        // The head of the line weaves toward Sparkle.
        const a =
          Math.atan2(goal.y - c.y, goal.x - c.x) + Math.sin(c.t / 20) * 0.9
        mx = Math.cos(a) * speed * 1.1
        my = Math.sin(a) * speed * 1.1
      }
    } else {
      // Throwers keep their distance and fling streamers.
      const dx = goal.x - c.x
      const dy = goal.y - c.y
      const d = Math.hypot(dx, dy) || 1
      const away = d < 70 ? -1 : d > 110 ? 1 : 0
      mx = (dx / d) * speed * 0.6 * away + Math.cos(c.t / 30) * 0.4
      my = (dy / d) * speed * 0.6 * away + Math.sin(c.t / 30) * 0.4
      if (c.t % 90 === 0) this.throwStreamer(c.x, c.y)
    }
    if (c.kind !== 'bouncer') {
      if (foam) {
        // Foam Party: crashers skid too, slow to turn and slow to stop.
        c.vx += (mx - c.vx) * 0.07
        c.vy += (my - c.vy) * 0.07
        mx = c.vx
        my = c.vy
      }
      c.x += mx
      c.y += my
    }
    c.x = clampX(c.x)
    c.y = clampY(c.y)
  }

  private throwStreamer(x: number, y: number) {
    const a = Math.atan2(this.py - y, this.px - x) + (this.rng() - 0.5) * 0.3
    this.streamers.push({
      x,
      y,
      vx: Math.cos(a) * 1.8,
      vy: Math.sin(a) * 1.8,
      life: 160,
      style: 'streamer',
    })
    this.sound.play('blip')
  }

  // --- the set's hazards ---------------------------------------------------------

  /** Whoopee cushions go off a beat after they are stepped on; peels send Sparkle sliding. */
  private updateMines() {
    for (const m of this.mines) {
      if (m.kind === 'peel') {
        for (const c of this.inPlay()) {
          this.cur = c
          if (m.fuse !== -1 && this.slip === 0 && this.touching(m.x, m.y, 7)) {
            m.fuse = -1
            const len = Math.hypot(this.vx, this.vy)
            const dx = len > 0.2 ? this.vx / len : this.aim.x
            const dy = len > 0.2 ? this.vy / len : this.aim.y
            const n = Math.hypot(dx, dy) || 1
            this.vx = (dx / n) * 2.6
            this.vy = (dy / n) * 2.6
            this.slip = SLIP_TICKS
            this.floaters.push({
              x: this.px,
              y: this.py - 16,
              text: 'WHOA!',
              life: 40,
            })
            this.sound.play('blip')
          }
        }
        this.cur = this.lead()
        continue
      }
      if (m.fuse === 0) {
        const stepped =
          this.inPlay().some(
            (c) => Math.abs(m.x - c.px) < 8 && Math.abs(m.y - c.py) < 8,
          ) ||
          this.crashers.some(
            (c) =>
              touches(c) &&
              c.kind !== 'bouncer' &&
              c.kind !== 'stagehand' &&
              Math.abs(c.x - m.x) < 7 &&
              Math.abs(c.y - m.y) < 6,
          )
        if (stepped) {
          m.fuse = CUSHION_FUSE
          this.sound.play('warn')
        }
        continue
      }
      if (--m.fuse > 0) continue
      // PFFT: a cartoon puff that bowls over whoever is close.
      m.fuse = -1
      this.burst(m.x, m.y, 16, RAMPS.pink[3])
      this.fx.burst(m.x, m.y, this.fxRng, {
        count: 10,
        colours: [RAMPS.cream[4], RAMPS.pink[3], RAMPS.gold[4]],
      })
      this.floaters.push({ x: m.x, y: m.y - 12, text: 'PFFT!', life: 40 })
      this.sound.play('pop')
      for (const c of [...this.crashers])
        if (Math.hypot(c.x - m.x, c.y - m.y) < CUSHION_BLAST) this.cheer(c)
      this.eachContestant(() => {
        if (Math.hypot(this.px - m.x, this.py - m.y) < CUSHION_BLAST)
          this.loseLife('WHOOPEE!')
      })
    }
    this.mines = this.mines.filter((m) => m.fuse >= 0)
  }

  /** A beam's state at this tick: where it points and whether it is hot (or about to be). */
  beamState(b: Beam) {
    const beat = b.on + b.off
    const clock = this.roomTick + b.offset
    const k = Math.floor(clock / beat)
    const phase = clock % beat
    const stepAt = (i: number) =>
      b.base +
      b.swing *
        BEAM_STEPS[
          ((i % BEAM_STEPS.length) + BEAM_STEPS.length) % BEAM_STEPS.length
        ]!
    const target = stepAt(k)
    const prev = stepAt(k - 1)
    const hot = !this.cleared && phase >= b.off
    const warming = !this.cleared && !hot && phase >= b.off - BEAM_TELL
    // In the dark the lamp swings to its next mark; it settles before the tell, and once hot it
    // only drifts a little further the way it was going.
    const angle = hot
      ? target +
        Math.sign(target - prev) * BEAM_DRIFT * ((phase - b.off) / b.on)
      : prev +
        (target - prev) * Math.min(1, phase / Math.max(1, b.off - BEAM_TELL))
    return { angle, hot, warming }
  }

  /** How far (x, y) is from a beam's centre line, and how wide the beam is there. */
  private beamReach(b: Beam, angle: number, x: number, y: number) {
    const dx = Math.cos(angle)
    const dy = Math.sin(angle)
    const rx = x - b.x
    const ry = y - b.y
    const along = rx * dx + ry * dy
    const across = Math.abs(rx * dy - ry * dx)
    return { along, across, half: 5 + Math.max(0, along) * 0.07 }
  }

  private updateBeams() {
    for (const b of this.beams) {
      const { angle, hot } = this.beamState(b)
      if (!hot) continue
      this.eachContestant(() => {
        const { along, across, half } = this.beamReach(
          b,
          angle,
          this.px,
          this.py,
        )
        if (along > 6 && across < half - 1) this.loseLife('IN THE SPOTLIGHT!')
      })
    }
  }

  /** Ticks per beat in this room (the concert's tempo by default, for the bosses that keep it). */
  beat(): number {
    return this.script.beat ?? CONCERT_BEAT
  }

  /** The set's floor: hot plates, counters, flour, speaker stacks and their rings, mosh pits. */
  private updateHazards() {
    const tick = this.roomTick
    const beat = this.beat()
    for (const p of this.plates)
      if (plateState(p, tick).state === 'hot')
        this.eachContestant(() => {
          if (this.lifted === 0 && onPlate(p, this.px, this.py + 3))
            this.loseLife('SIZZLED!')
        })
    for (const f of this.flours) driftFlour(f, tick)
    for (const sp of this.speakers) {
      if (!speakerFires(sp, tick, beat)) continue
      const n = speakerShot(sp, tick, beat)
      this.rings.push(
        newRing(
          sp.x,
          sp.y,
          RING.speakerMax,
          RING.speakerSpeed,
          speakerGap(sp, n),
        ),
      )
      this.sound.play('pop')
    }
    for (const ring of this.rings) {
      ring.r += ring.speed
      this.eachContestant(() => {
        if (this.lifted === 0 && ringHits(ring, this.px, this.py))
          this.loseLife(
            ring.gap === null ? 'KNOCKED FLAT!' : 'BLOWN AWAY BY THE BASS!',
          )
      })
    }
    this.rings = this.rings.filter((ring) => ring.r < ring.max)
    // The hub soaks up streamers; the ring carries the crowd and pushes them off the hub.
    if (this.turntable) {
      for (const st of this.streamers) if (this.inHub(st.x, st.y)) st.life = 0
      for (const c of this.crashers) {
        if (c.kind === 'crane' || c.z > 2) continue
        const push = this.turnPush(c.x, c.y)
        const out = this.outOfHub(c.x + push.x, c.y + push.y, 4)
        c.x = out.x
        c.y = out.y
      }
    }
    // The counters and the pits move the crowd (and loose prizes) as well.
    if (!this.belts.length && !this.pits.length) return
    for (const c of this.crashers) {
      if (c.kind === 'crane' || c.z > 2) continue
      const belt = beltPush(this.belts, c.x, c.y)
      const pit = pitShove(this.pits, c.x, c.y, tick, beat)
      c.x = clampX(c.x + belt.x + pit.x * 0.5, 6)
      c.y = clampY(c.y + belt.y + pit.y * 0.5, 6)
    }
    for (const p of this.prizes) {
      if (p.pedestal) continue
      const belt = beltPush(this.belts, p.x, p.y)
      p.x = clampX(p.x + belt.x, 8)
      p.y = clampY(p.y + belt.y, 8)
    }
  }

  private updateStreamers() {
    for (const s of this.streamers) {
      s.x += s.vx
      s.y += s.vy
      s.life--
      if (s.x < LEFT || s.x > RIGHT || s.y < TOP || s.y > BOTTOM) s.life = 0
      if (s.life > 0 && this.inCase(s.x, s.y)) s.life = 0
      if (s.life <= 0) continue
      const hit = this.inPlay().find(
        (c) =>
          c.lifted === 0 &&
          Math.abs(s.x - c.px) < 4 &&
          Math.abs(s.y - c.py) < 4,
      )
      const grazed = this.inPlay().find(
        (c) =>
          c.invuln === 0 &&
          Math.abs(s.x - c.px) < 11 &&
          Math.abs(s.y - c.py) < 11,
      )
      if (hit) {
        s.life = 0
        this.cur = hit
        this.loseLife(SHOT_LINES[s.style])
        this.cur = this.lead()
      } else if (grazed && !s.grazed) {
        this.cur = grazed
        // A near miss: the crowd gasps, the ratings like it.
        s.grazed = true
        this.rate(RATINGS.nearMiss)
        this.floaters.push({
          x: this.px,
          y: this.py - 16,
          text: 'CLOSE!',
          life: 30,
        })
        this.say('near-miss')
        this.cur = this.lead()
      }
    }
    this.streamers = this.streamers.filter((s) => s.life > 0)
  }

  /** Pies and party poppers in the air: each lands where its shadow said. */
  private updateLobs() {
    for (const lob of this.lobs) {
      if (++lob.t < lob.dur) continue
      if (lob.kind === 'popper') {
        this.popperBlast(lob.x1, lob.y1)
        continue
      }
      this.burst(lob.x1, lob.y1, 10, RAMPS.cream[4])
      this.floaters.push({
        x: lob.x1,
        y: lob.y1 - 10,
        text: 'SPLAT!',
        life: 35,
      })
      this.addSlick(lob.x1, lob.y1, 'cream')
      this.sound.play('pop')
      this.eachContestant(() => {
        if (Math.hypot(this.px - lob.x1, this.py - lob.y1) < 10)
          this.loseLife('PIED!')
      })
    }
    this.lobs = this.lobs.filter((lob) => lob.t < lob.dur)
  }

  private addSlick(x: number, y: number, kind: Slick['kind']) {
    const cream = kind === 'cream'
    this.slicks.push({
      x,
      y,
      r: cream ? CREAM_RADIUS : ARSENAL.foamRadius,
      life: cream ? CREAM_LIFE : ARSENAL.foamLife,
      kind,
    })
    if (this.slicks.length > 24) this.slicks.shift()
  }

  /** Foam on the floor slows any crasher wading through it. */
  private updateSlicks() {
    for (const s of this.slicks) {
      s.life--
      if (s.kind !== 'foam') continue
      for (const c of this.crashers)
        if (Math.hypot(c.x - s.x, c.y - s.y) < s.r)
          c.slow = Math.max(c.slow, 20)
    }
    this.slicks = this.slicks.filter((s) => s.life > 0)
  }

  /** Boom mics: a shadow on Sparkle's spot, then the mic swoops and lifts whoever is under it. */
  private updateBooms() {
    if (this.cleared) return
    for (const boom of this.booms) {
      const k = (this.roomTick + boom.offset) % boom.every
      if (k === boom.every - BOOM_TELL) {
        boom.x = this.px
        boom.y = this.py
        this.sound.play('warn')
      }
      if (k !== boom.every - 1) continue
      this.burst(boom.x, boom.y, 6, RAMPS.steel[3])
      for (const c of [...this.crashers]) {
        if (!touches(c) || c.kind === 'mascot') continue
        if (Math.hypot(c.x - boom.x, c.y - boom.y) < BOOM_REACH) {
          this.removeCrasher(c)
          this.floaters.push({ x: c.x, y: c.y - 14, text: 'WHEE!', life: 35 })
        }
      }
      for (const c of this.inPlay()) {
        this.cur = c
        if (
          this.lifted !== 0 ||
          Math.hypot(this.px - boom.x, this.py - boom.y) >= BOOM_REACH
        )
          continue
        this.lifted = BOOM_LIFT
        this.invuln = Math.max(this.invuln, BOOM_LIFT + 40)
        this.floaters.push({
          x: this.px,
          y: this.py - 18,
          text: 'UP YOU GO!',
          life: 45,
        })
        this.sound.play('blip')
      }
      this.cur = this.lead()
    }
  }

  /** The boom mic boom's tell: where it will swoop, and how close it is (0..1), or null. */
  boomTell(boom: Boom): number | null {
    if (this.cleared) return null
    const k = (this.roomTick + boom.offset) % boom.every
    if (k < boom.every - BOOM_TELL) return null
    return (k - (boom.every - BOOM_TELL)) / BOOM_TELL
  }

  /** Held up by a boom mic: no moving or spraying, then set down somewhere clear. */
  private updateLift() {
    if (--this.lifted > 0) return
    const spot = this.safeSpot()
    this.px = spot.x
    this.py = spot.y
    this.vx = 0
    this.vy = 0
    this.slip = 0
    this.floaters.push({
      x: this.px,
      y: this.py - 16,
      text: 'BACK ON SET!',
      life: 40,
    })
  }

  /** The open spot on the floor farthest from the crowd. */
  private safeSpot(): Point {
    const spots: Point[] = [
      { x: CX, y: CY },
      { x: CX - 80, y: CY - 50 },
      { x: CX + 80, y: CY - 50 },
      { x: CX - 80, y: CY + 50 },
      { x: CX + 80, y: CY + 50 },
    ]
    let best = spots[0]!
    let bestD = -1
    for (const spot of spots) {
      const near = Math.min(
        999,
        ...this.crashers.map((c) => Math.hypot(c.x - spot.x, c.y - spot.y)),
      )
      if (near > bestD) {
        bestD = near
        best = spot
      }
    }
    return best
  }

  /** The two streamer orbiters' positions this tick. */
  orbiterSpots(): Point[] {
    if (this.powers.orbiters <= 0) return []
    return [0, 1].map((k) => {
      const a = this.tick * 0.12 + k * Math.PI
      return {
        x: this.px + Math.cos(a) * ARSENAL.orbitRadius,
        y: this.py - 2 + Math.sin(a) * ARSENAL.orbitRadius * 0.8,
      }
    })
  }

  /** Orbiters, glitter, popper cadence and the cardboard cutout. */
  private updateArsenal() {
    for (const g of this.glitter) g.life--
    this.glitter = this.glitter.filter((g) => g.life > 0)
    const spots: Point[] = []
    this.eachContestant(() => spots.push(...this.orbiterSpots()))
    for (const o of spots) {
      for (const c of [...this.crashers]) {
        if (!shootable(c) || c.t % ARSENAL.orbitEvery !== 0) continue
        if (Math.hypot(c.x - o.x, c.y - c.z - o.y) < ARSENAL.orbitReach + 4) {
          this.burst(o.x, o.y, 2, RAMPS.gold[4])
          this.hitCrasher(c, 1, 0, 0, false)
        }
      }
      for (const st of this.streamers)
        if (Math.hypot(st.x - o.x, st.y - o.y) < 6) st.life = 0
    }
    const d = this.decoy
    if (d) {
      d.life--
      this.powers.cutout = Math.max(0, d.life)
      if (d.life <= 0 || d.hp <= 0) {
        this.decoy = null
        this.powers.cutout = 0
        this.burst(d.x, d.y, 10, RAMPS.earth[3])
        this.floaters.push({
          x: d.x,
          y: d.y - 16,
          text: 'FOOLED YA!',
          life: 40,
        })
      }
    }
  }

  // --- the parade float -----------------------------------------------------------

  private updateBoss() {
    if (!this.boss) return
    // The boss goes after whoever is nearest; its blows land on whoever they reach.
    this.cur = this.nearestTo(this.boss.x, this.boss.y)
    runBoss(this.boss, this.bossWorld)
    this.cur = this.lead()
  }

  /** Ticks until the float's candles fire (they flare for a moment first). */
  candleClock(b: Boss): number {
    return floatCandles(b)
  }

  private bossDown() {
    const b = this.boss!
    this.boss = null
    const bonus = (b.finale ? 25_000 : 10_000) * this.loop
    this.addScore(bonus, b.x, b.y)
    for (let i = 0; i < 6; i++)
      this.burst(b.x + (i - 3) * 12, b.y, 10, CONFETTI[i]!)
    for (let i = 0; i < 4; i++)
      this.fx.burst(b.x + (i - 1.5) * 24, b.y - 6, this.fxRng, {
        count: 12,
        speed: 2.4,
      })
    this.banner = {
      text: BOSS_OUTRO[b.kind],
      sub: `BONUS ${bonus}`,
      ticks: 120,
    }
    this.audienceCheer = Math.max(this.audienceCheer, 90)
    this.sound.play('level')
    for (let i = 0; i < 3; i++)
      this.dropPrize(clampX(b.x + (i - 1) * 24, 12), clampY(b.y + 20, 12))
    // Everything the Mothership beamed up rains back down.
    for (let i = 0; i < b.hold; i++)
      this.dropPrize(
        clampX(b.x + (i - (b.hold - 1) / 2) * 18, 12),
        clampY(b.y + 40 + (i % 2) * 14, 12),
      )
  }

  // --- prizes, tickets and the audience ---------------------------------------------

  private updatePrizes() {
    const double = this.has('double-time') ? 2 : 1
    for (const p of this.prizes) {
      if (!p.pedestal) p.life--
      if (p.life <= 0) {
        if (this.script.challenge === 'all-prizes') this.prizeMissed = true
        this.haulMissed = true
        continue
      }
      const taker = this.inPlay().find(
        (c) => Math.abs(p.x - c.px) < 9 && Math.abs(p.y - c.py) < 9,
      )
      if (!taker) continue
      this.cur = taker
      p.life = -1
      this.roomGrabbed++
      for (const c of this.crashers) if (c.prize === p) c.prize = null
      this.addScore(
        Math.round(PRIZE_POINTS[p.kind] * double * this.multiplier(false)),
        p.x,
        p.y - 10,
      )
      this.rate(RATINGS.prize)
      if (isPower(p.kind)) {
        this.powers[p.kind] = stackPower(p.kind, this.powers[p.kind])
        if (p.kind === 'cutout') this.placeDecoy()
      } else {
        this.haul += double
        this.wallet[p.kind] += double
        this.episodeWon[p.kind] += double
        this.seasonWon[p.kind] += double
        if (p.kind === 'car') {
          this.say('big-prize')
          this.audienceCheer = Math.max(this.audienceCheer, 60)
        }
      }
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
    this.cur = this.lead()
  }

  /** A cardboard Sparkle where she stands: the crowd goes after it instead. */
  private placeDecoy() {
    this.decoy = {
      x: this.px,
      y: this.py,
      hp: ARSENAL.cutoutHp,
      life: POWERS.cutout.ticks,
    }
    this.powers.cutout = POWERS.cutout.ticks
  }

  private updatePickups() {
    for (const t of this.pickups) {
      const near = this.inPlay().some(
        (c) => Math.abs(t.x - c.px) < 10 && Math.abs(t.y - c.py) < 10,
      )
      if (near) this.collectTicket(t)
    }
  }

  private collectTicket(t: TicketPickup) {
    this.pickups = this.pickups.filter((other) => other !== t)
    if (!this.tickets.includes(t.id)) this.tickets.push(t.id)
    this.episodeTickets++
    this.addScore(TICKET_POINTS, t.x, t.y - 12)
    this.rate(RATINGS.ticket)
    this.say('ticket')
    this.audienceCheer = Math.max(this.audienceCheer, 60)
    this.banner = {
      text: 'GOLDEN TICKET!',
      sub: `${this.tickets.length} OF ${SEASON_TICKETS}`,
      ticks: 110,
    }
    for (let i = 0; i < 3; i++)
      this.fx.burst(t.x, t.y, this.fxRng, {
        count: 12,
        speed: 2.2,
        colours: [RAMPS.gold[4], RAMPS.gold[3], '#ffffff'],
      })
    this.sound.play('extra')
  }

  /** Audience Participation: the crowd lobs gifts over the front wall. */
  private updateTosses() {
    if (
      this.has('audience') &&
      !this.cleared &&
      this.roomTick >= this.nextToss
    ) {
      this.nextToss = this.roomTick + 220 + Math.floor(this.rng() * 160)
      const pick = this.rng()
      const kind: PrizeKind = pick < 0.8 ? powerFromRoll(pick / 0.8) : 'cash'
      const x0 = LEFT + 30 + this.rng() * (RIGHT - LEFT - 60)
      this.tosses.push({
        x0,
        y0: BOTTOM + 4,
        x1: LEFT + 30 + this.rng() * (RIGHT - LEFT - 60),
        y1: TOP + 30 + this.rng() * (BOTTOM - TOP - 80),
        t: 0,
        dur: 55,
        kind: this.prizeFor(kind),
      })
      this.sound.play('blip')
    }
    for (const toss of this.tosses) {
      if (++toss.t < toss.dur) continue
      this.prizes.push({
        x: toss.x1,
        y: toss.y1,
        kind: toss.kind,
        life: PRIZE_LIFE,
        lift: 0,
      })
    }
    this.tosses = this.tosses.filter((toss) => toss.t < toss.dur)
  }

  // --- clearing and leaving the room ---------------------------------------------

  private checkClear() {
    if (this.cleared) return
    if (!this.wavesDone() || this.crashers.length || this.boss) return
    this.cleared = true
    this.streamers = []
    // The stage crew wheels the roadies' flight cases off, so no door is left walled in.
    for (const box of this.cases) this.burst(box.x, box.y, 6, RAMPS.steel[3])
    this.cases = []
    const script = this.script
    if (!this.hit && !script.closes) {
      this.rate(RATINGS.noDamageClear)
      this.say('no-damage')
    } else if (!script.closes) {
      this.say('clear')
    }
    this.audienceCheer = Math.max(this.audienceCheer, 60)
    if (!script.closes) {
      this.openExits()
      this.banner = { text: 'ROOM CLEAR!', sub: 'PICK A DOOR', ticks: 80 }
      for (const exit of this.exits)
        this.fx.burst(exit.x, exit.y, this.fxRng, {
          count: 14,
          colours: [RAMPS.leaf[4], RAMPS.leaf[3], RAMPS.gold[4]],
        })
      this.sound.play('extra')
    }
    if (script.challenge) {
      const won =
        script.challenge === 'no-hit'
          ? !this.hit
          : !this.prizeMissed && !this.prizes.some((p) => p.pedestal)
      if (won && script.ticket && !this.tickets.includes(script.ticket)) {
        this.pickups.push({ x: CX, y: CY, id: script.ticket })
        this.banner = {
          text: 'CHALLENGE MET!',
          sub: 'A GOLDEN TICKET APPEARS',
          ticks: 110,
        }
      } else if (won) {
        this.addScore(TICKET_POINTS * this.loop, CX, CY)
        this.banner = {
          text: 'CHALLENGE MET!',
          sub: 'SPONSOR BONUS',
          ticks: 100,
        }
      } else {
        this.banner = {
          text: 'NO TICKET THIS TIME',
          sub: 'PICK A DOOR',
          ticks: 90,
        }
      }
    }
    if (this.has('sudden-death') && !this.hit) {
      const jackpot = 25_000 * this.loop
      this.addScore(jackpot, CX, CY - 10)
      this.banner = {
        text: 'JACKPOT!',
        sub: `SUDDEN DEATH ${jackpot}`,
        ticks: 110,
      }
    }
    if (!this.secretId && this.exits.length === 0) {
      // The finale is down: the episode is a wrap, and the haul is counted next.
      this.awardMedals(true)
      this.banner = {
        text: "THAT'S A WRAP!",
        sub: `${this.billing()}: ${this.episode.title}`,
        ticks: EPISODE_TICKS,
      }
      this.say('wrap')
      this.audienceCheer = EPISODE_TICKS
      this.next = { to: 'episode' }
      this.transition = EPISODE_TICKS
      this.sound.play('level')
    }
  }

  private checkExit() {
    if (!this.exitsOpen || this.transition > 0) return
    for (const exit of this.exits) {
      // Any contestant through a door takes the whole team with her.
      const out = this.inPlay().find(
        (c) => Math.hypot(exit.x - c.px, exit.y - c.py) < 16,
      )
      if (!out) continue
      this.cur = out
      this.leave(exit)
      this.cur = this.lead()
      return
    }
  }

  /**
   * The room is done: its medals onto the board (Flawless: no hit; Full Haul: a prize or more grabbed
   * and none lost or left behind; Prime Time: out with the ratings at Prime Time). A finale's wrap
   * leaves nothing behind (the crew bags what's on the floor).
   */
  private awardMedals(wrap = false) {
    if (this.script.commercial) return
    const left = !wrap && this.prizes.some((p) => p.life > 0)
    const won: MedalId[] = []
    if (!this.hit) won.push('flawless')
    if (this.roomGrabbed > 0 && !this.haulMissed && !left) won.push('haul')
    if (tierOf(this.ratings) === TIERS.length - 1) won.push('prime')
    if (this.mode === 'marathon') {
      this.marathonRooms++
      this.marathonBest = Math.max(this.marathonBest, this.marathonRooms)
    }
    if (won.length) {
      const id = this.secretId ?? this.roomId
      const before = this.medals[id] ?? 0
      let bits = before
      for (const m of won) bits |= MEDALS[m].bit
      this.medals[id] = bits
      this.episodeMedals += won.length
      this.showMedals += won.length
      this.medalToast = {
        won,
        fresh: won.filter((m) => !(before & MEDALS[m].bit)),
        ticks: 100,
      }
      this.sound.play(bits !== before ? 'extra' : 'pickup')
    }
    this.keepProfile()
  }

  private leave(exit: RoomExit) {
    this.awardMedals()
    const timeBonus = this.script.closes
      ? 0
      : Math.floor(this.roomTimer / 60) * 50
    if (timeBonus) this.addScore(timeBonus, this.px, this.py - 12)
    // A sponsor's ticket left lying is collected on the way out; vault tickets are not.
    for (const t of [...this.pickups])
      if (t.id === this.script.ticket) this.collectTicket(t)
    this.next =
      exit.kind === 'secret'
        ? { to: 'secret', id: exit.to, side: exit.side }
        : { to: 'map', side: exit.kind === 'door' ? exit.side : null }
    this.transition = TRANSITION_TICKS
    this.banner = {
      text: exit.kind === 'secret' ? 'BACKSTAGE!' : 'NEXT STUDIO!',
      sub: timeBonus ? `TIME BONUS ${timeBonus}` : undefined,
      ticks: TRANSITION_TICKS,
    }
    this.sound.play('level')
  }

  /** A vault or secret room's countdown ran out: the set closes behind Sparkle. */
  private closeSet() {
    this.awardMedals()
    this.next = { to: 'map', side: null }
    this.transition = TRANSITION_TICKS
    this.banner = { text: 'THE SET CLOSES!', ticks: TRANSITION_TICKS }
    this.sound.play('warn')
  }

  private touching(x: number, y: number, r: number): boolean {
    return Math.abs(x - this.px) < r && Math.abs(y - this.py) < r
  }

  private loseLife(text: string) {
    const who = this.cur
    if (who.invuln > 0 || this.dead > 0 || who.down !== 0) return
    this.hit = true
    this.rate(RATINGS.hit)
    this.chain = 0
    this.chainClock = 0
    if (this.powers.shield > 0 && !this.has('sudden-death')) {
      // The shield pops instead.
      this.powers.shield = 0
      this.invuln = 60
      this.burst(this.px, this.py, 10, '#a5f3fc')
      this.fx.burst(this.px, this.py, this.fxRng, {
        count: 10,
        colours: [RAMPS.teal[4], RAMPS.teal[3], '#ffffff'],
      })
      this.sound.play('warn')
      return
    }
    if (who.guard) {
      // Glimmer's own shield takes the hit, then recharges.
      who.guard = false
      who.guardClock = CONTESTANTS[who.who].recharge
      who.invuln = 60
      this.burst(who.px, who.py, 10, RAMPS.purple[3])
      this.floaters.push({
        x: who.px,
        y: who.py - 16,
        text: 'GUARD!',
        life: 30,
      })
      this.sound.play('warn')
      return
    }
    if (this.team.length > 1) {
      // Co-op: she is down for a moment (back if the team has lives), and the show goes on.
      this.lives = Math.max(0, this.lives - 1)
      who.down = this.lives > 0 ? DEATH_TICKS : -1
      this.burst(who.px, who.py, 18, '#fde68a')
      this.sound.play('die')
      this.banner = { text: `${CONTESTANTS[who.who].name}: ${text}`, ticks: 80 }
      if (!this.inPlay().length) this.dead = DEATH_TICKS
      else this.say('death')
      return
    }
    this.lives--
    this.dead = DEATH_TICKS
    this.burst(this.px, this.py, 18, '#fde68a')
    this.sound.play('die')
    if (this.lives > 0) {
      this.banner = { text, ticks: 80 }
      this.say('death')
    }
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x: number, y: number) {
    if (this.demo) return
    // A team shares the points it earns (a fair leaderboard), and no score passes the ceiling.
    const share = Math.round(points / (1 + COOP_SHARE * (this.team.length - 1)))
    this.score = Math.min(SCORE_CEILING, this.score + share)
    this.floaters.push({ x, y, text: String(share), life: 40 })
    if (this.score >= this.nextExtra) {
      if (this.lives < MAX_EARNED_LIVES) this.lives++
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

  /**
   * The pilot's route call: the richest door, or the safest one every other room and whenever it
   * is down to its last contestant, so the attract loop shows both lanes.
   */
  private pilotPick(options: readonly { id: string }[]): number {
    if (options.length < 2) return 0
    const careful = this.lives <= 1 || this.studios % 2 === 1
    let best = 0
    let bestScore = -Infinity
    options.forEach((option, i) => {
      const script = roomById(this.episode, option.id).script
      const value = careful
        ? -script.danger * 10 + REWARD_RANK[script.reward]
        : REWARD_RANK[script.reward] * 10 - script.danger
      if (value > bestScore) {
        bestScore = value
        best = i
      }
    })
    return best
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
    if (this.menu) {
      frame.pressed.a = this.menu.ticks % 30 === 29
      return frame
    }
    if (this.picking) {
      frame.pressed.a = this.picking.ticks % 30 === 29
      return frame
    }
    if (this.commercial) return breakPilot(this.commercial.state, this.cur.seat)
    if (this.ending) {
      // Let the ending play, then skip the credits along.
      frame.pressed.a = this.ending.ticks % 240 === 239
      return frame
    }
    if (this.tally) {
      // Watch the haul count up for a moment, then skip on.
      frame.pressed.a = this.tally.ticks > 120 && this.tally.ticks % 30 === 0
      return frame
    }
    if (this.swap) {
      // Trade what it can (a contestant, a power-up, clock time), then DONE.
      const swap = this.swap
      if (swap.ticks < 30 || swap.ticks % 15 !== 0) return frame
      const want = (['contestant', 'power', 'clock'] as const).find((id) =>
        this.canBuy(id),
      )
      const target = want
        ? SWAP_OFFERS.findIndex((o) => o.id === want)
        : SWAP_OFFERS.length
      if (swap.cursor !== target) frame.pressed.down = true
      else frame.pressed.a = true
      return frame
    }
    if (this.map) {
      // On the map: walk the cursor to the pick, then press A.
      const map = this.map
      const target = this.pilotPick(map.options)
      const buttons = ['up', 'right', 'down', 'left'] as const
      if (map.cursor !== target) {
        if (map.ticks >= MAP_SETTLE && map.ticks % 10 === 0)
          frame.pressed[buttons[map.options[target]!.side]] = true
      } else if (map.ticks >= MAP_SETTLE + 40) {
        frame.pressed.a = true
      }
      return frame
    }
    const threats: Array<{ x: number; y: number; r: number }> = []
    const slippery =
      this.has('foam') || this.inCream() || !!this.script.lowGravity
    for (const c of this.crashers) {
      if (!touches(c)) continue
      const r =
        c.kind === 'mascot'
          ? c.mode >= 1 && c.mode <= 2
            ? 80
            : 60
          : c.kind === 'meatball' && c.mode === 1
            ? 64
            : c.kind === 'tank'
              ? 62
              : 50
      // On a slippery floor it can't stop short: keep further off.
      threats.push({ x: c.x, y: c.y, r: slippery ? r * 1.3 : r })
    }
    for (const st of this.streamers) threats.push({ x: st.x, y: st.y, r: 18 })
    const bossThreats = this.boss ? bossDangers(this.boss) : []
    threats.push(...bossThreats)
    for (const p of this.plates) {
      const { state, k } = plateState(p, this.roomTick)
      if (state === 'cold' && k < 0.9) continue
      threats.push({
        x: p.x + p.w / 2,
        y: p.y + p.h / 2,
        r: Math.max(p.w, p.h) * 0.75 + 8,
      })
    }
    for (const ring of this.rings) {
      // Out ahead of a ring's edge (and not in its gap): get further away.
      const d = Math.hypot(this.px - ring.x, this.py - ring.y)
      if (!ringLive(ring) || d < ring.r - 6 || d > ring.r + 34) continue
      if (d > ring.max * RING.live + 6) continue
      if (inGap(ring, this.px, this.py)) continue
      const ux = (this.px - ring.x) / (d || 1)
      const uy = (this.py - ring.y) / (d || 1)
      threats.push({ x: ring.x + ux * ring.r, y: ring.y + uy * ring.r, r: 40 })
    }
    for (const sp of this.speakers)
      if (speakerUntil(sp, this.roomTick, this.beat()) < 30)
        threats.push({ x: sp.x, y: sp.y, r: 36 })
    const leavingNow = this.exitsOpen && this.cleared
    if (!leavingNow)
      for (const pit of this.pits)
        threats.push({ x: pit.x, y: pit.y, r: pit.r + 8 })
    if (this.turntable)
      threats.push({ x: CX, y: CY, r: this.turntable.inner + 8 })
    // Flight cases are solid: step round them rather than push into one.
    for (const box of this.cases) threats.push({ x: box.x, y: box.y, r: 18 })
    // Heading for a door, a teleport door would only send it back across the room.
    if (leavingNow)
      for (const w of this.warps)
        threats.push({ x: w.x1, y: w.y1, r: 16 }, { x: w.x2, y: w.y2, r: 16 })
    for (const m of this.mines) {
      // Heading out of a cleared room, only an armed cushion is worth a detour.
      if (leavingNow && m.fuse === 0) continue
      threats.push({
        x: m.x,
        y: m.y,
        r:
          (m.fuse > 0 ? CUSHION_BLAST + 16 : m.kind === 'cushion' ? 15 : 12) *
          (slippery ? 1.8 : 1),
      })
    }
    for (const lob of this.lobs)
      if (lob.kind === 'pie') threats.push({ x: lob.x1, y: lob.y1, r: 22 })
    for (const boom of this.booms)
      if (this.boomTell(boom) !== null)
        threats.push({ x: boom.x, y: boom.y, r: BOOM_REACH + 14 })
    for (const c of this.crashers) {
      if (c.kind === 'diver' && c.mode === 1)
        threats.push({ x: c.tx, y: c.ty, r: TELLS.diverRing + 14 })
      if (c.kind === 'drone' && c.mode >= 1) {
        // Step off the drone's locked line.
        const a = Math.atan2(c.ty - c.y, c.tx - c.x)
        const along = Math.max(
          0,
          (this.px - c.x) * Math.cos(a) + (this.py - c.y) * Math.sin(a),
        )
        threats.push({
          x: c.x + Math.cos(a) * along,
          y: c.y + Math.sin(a) * along,
          r: 20,
        })
      }
    }
    for (const b of this.beams) {
      const { angle, hot, warming } = this.beamState(b)
      if (!hot && !warming) continue
      const { along, half } = this.beamReach(b, angle, this.px, this.py)
      const d = Math.max(0, along)
      threats.push({
        x: b.x + Math.cos(angle) * d,
        y: b.y + Math.sin(angle) * d,
        r: half + 18,
      })
    }
    // Step away from whatever is close; aim at the nearest crasher (or the float).
    let mx = 0
    let my = 0
    for (const t of threats) {
      const d = Math.hypot(t.x - this.px, t.y - this.py)
      if (d >= t.r) continue
      if (d < 1) {
        // Dead on top of it (a pie aimed at a pilot standing still): step off toward the middle.
        mx += this.px <= CX ? 1 : -1
        my += this.py <= CY ? 0.5 : -0.5
        continue
      }
      mx -= (t.x - this.px) / d
      my -= (t.y - this.py) / d
    }
    // Sidestep anything thrown this way, off the line it is flying along.
    for (const st of this.streamers) {
      const rx = this.px - st.x
      const ry = this.py - st.y
      if (Math.hypot(rx, ry) > 80) continue
      const speed = Math.hypot(st.vx, st.vy) || 1
      const ux = st.vx / speed
      const uy = st.vy / speed
      if (rx * ux + ry * uy < 0) continue
      const off = ry * ux - rx * uy
      if (Math.abs(off) > 12) continue
      const side = off >= 0 ? 1 : -1
      const push = 2 * (1 - Math.abs(off) / 12)
      mx += -uy * side * push
      my += ux * side * push
    }
    // A charging mascot or a rolling meatball can't be outrun: step out of its line.
    for (const c of this.crashers) {
      const charging =
        (c.kind === 'mascot' && c.mode >= 1 && c.mode <= 2) ||
        (c.kind === 'meatball' && c.mode === 1)
      if (!charging) continue
      const ux = c.kind === 'meatball' ? Math.sign(c.vx) : Math.cos(c.face)
      const uy = c.kind === 'meatball' ? Math.sign(c.vy) : Math.sin(c.face)
      const rx = this.px - c.x
      const ry = this.py - c.y
      if (rx * ux + ry * uy < 0 || Math.hypot(rx, ry) > 140) continue
      const off = ry * ux - rx * uy
      if (Math.abs(off) > 22) continue
      const side = off >= 0 ? 1 : -1
      mx += -uy * side * 2.5
      my += ux * side * 2.5
    }
    // A boss pinning it to the top or bottom wall: slip out sideways, away from it.
    for (const t of bossThreats) {
      const d = Math.hypot(t.x - this.px, t.y - this.py)
      const walled = this.py > BOTTOM - 24 || this.py < TOP + 24
      if (d < t.r && walled) mx += (this.px >= t.x ? 1 : -1) * 1.2
    }
    // While dodging, keep off the walls so a corner never pins the pilot.
    if (Math.abs(mx) + Math.abs(my) > 0.5) {
      if (this.px < LEFT + 24) mx += 0.8
      if (this.px > RIGHT - 24) mx -= 0.8
      if (this.py < TOP + 24) my += 0.8
      if (this.py > BOTTOM - 24) my -= 0.8
    }
    let goal: { x: number; y: number } | null = null
    const doors = this.exits.filter((e) => e.kind !== 'secret')
    const leaving =
      this.exitsOpen &&
      (this.cleared || this.roomTimer < 150 || !this.prizes.length) &&
      !this.pickups.length
    if (leaving && doors.length)
      goal =
        doors[this.pilotPick(doors.map((e) => ({ id: e.to || this.roomId })))]!
    else if (this.pickups.length) goal = this.pickups[0]!
    else if (this.prizes.length) goal = this.prizes[0]!
    if (goal && Math.abs(mx) + Math.abs(my) < 0.5) {
      mx = goal.x - this.px
      my = goal.y - this.py
    } else if (goal && leaving) {
      // Heading out: keep pulling for the door while stepping round trouble; the last few steps
      // straight through it (the wall it is in is no reason to back off).
      const d = Math.hypot(goal.x - this.px, goal.y - this.py) || 1
      if (d < 36) {
        mx = goal.x - this.px
        my = goal.y - this.py
      } else {
        mx += ((goal.x - this.px) / d) * 0.8
        my += ((goal.y - this.py) / d) * 0.8
      }
    }
    // An armoured front turns confetti: circle round to its back while nothing else calls.
    const plated = this.crashers.find(
      (c) =>
        (c.kind === 'tank' || (c.kind === 'mascot' && c.mode === 0)) &&
        Math.hypot(c.x - this.px, c.y - this.py) < 140,
    )
    if (plated && !leaving && Math.abs(mx) + Math.abs(my) < 0.5) {
      // Behind it, but outside the berth the threats above keep (wider on a slippery floor).
      const back = slippery ? 92 : 72
      const bx = clampX(plated.x - Math.cos(plated.face) * back, 20)
      const by = clampY(plated.y - Math.sin(plated.face) * back, 20)
      const rx = this.px - plated.x
      const ry = this.py - plated.y
      // Go round, not through: step sideways first when it is between here and its back.
      const side =
        rx * Math.sin(plated.face) - ry * Math.cos(plated.face) >= 0 ? 1 : -1
      mx = (bx - this.px) * 0.05 + Math.sin(plated.face) * side
      my = (by - this.py) * 0.05 - Math.cos(plated.face) * side
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
    const bossSpot = this.boss
      ? bossAim(this.boss, { x: this.px, y: this.py })
      : null
    const target = [
      ...this.crashers.filter(shootable).map((c) => ({ x: c.x, y: c.y - c.z })),
      ...(bossSpot ? [bossSpot] : []),
    ].sort(
      (a, b) =>
        Math.hypot(a.x - this.px, a.y - this.py) -
        Math.hypot(b.x - this.px, b.y - this.py),
    )[0]
    if (target) {
      // Twin-stick: the second stick points at the target and Sparkle sprays.
      const a = Math.atan2(target.y - this.py, target.x - this.px)
      frame.aim = { x: Math.cos(a), y: Math.sin(a) }
    }
    return frame
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    if (this.choosing) {
      this.renderStudio(g)
      this.renderChoice(g)
      return
    }
    if (this.menu) {
      this.renderStudio(g)
      renderModeCard(g, {
        menu: this.menu,
        cleared: this.seasonCleared,
        board: this.medals,
        marathonBest: this.marathonBest,
        tick: this.tick,
      })
      return
    }
    if (this.picking) {
      this.renderPick(g)
      this.renderCutIn(g)
      return
    }
    if (this.ending) {
      this.renderEnding(g)
      this.renderCutIn(g)
      return
    }
    if (this.commercial) {
      renderBreak(
        g,
        this.commercial.state,
        this.tick,
        (k, seat, x, y, face, moving) =>
          this.drawSeat(k, seat, x, y, face, moving),
      )
      this.fx.render(g)
      for (const f of this.floaters)
        drawText(g, f.text, f.x, f.y, {
          align: 'center',
          color: RAMPS.gold[3],
          outline: INK,
        })
      this.renderCutIn(g)
      return
    }
    if (this.map) {
      this.renderMap(g)
      this.renderCutIn(g)
      return
    }
    if (this.tally || this.swap) {
      this.renderStudio(g)
      g.fillStyle = rgba(INK, 0.72)
      g.fillRect(0, 0, W, H)
      if (this.tally) this.renderTally(g)
      else this.renderSwap(g)
      this.renderCutIn(g)
      return
    }
    const dark = this.has('lights-out')
    this.renderStudio(g)
    if (this.has('foam')) this.renderFoam(g)
    this.renderSpotlights(g)
    this.renderMarquee(g)
    DOORS.forEach((d, i) => this.renderDoor(g, d, i))
    this.renderCrack(g)
    if (this.exitsOpen)
      for (const exit of this.exits) this.renderExitArrows(g, exit)
    this.renderSetFloor(g)
    this.renderSlicks(g)
    this.renderMines(g)
    this.renderShadows(g)
    this.renderBoomShadows(g)
    this.renderPedestals(g)
    for (const p of this.prizes) this.renderPrize(g, p)
    this.renderTickets(g)
    this.renderDecoy(g)
    if (this.boss) this.renderBoss(g, this.boss)
    for (const box of this.cases)
      drawSprite(g, CASE_SPRITE, Math.round(box.x), Math.round(box.y))
    const crowd = [...this.crashers].sort((a, b) => a.y - b.y)
    for (const c of crowd) this.renderCrasher(g, c)
    for (const d of this.dancers) this.renderDancer(g, d)
    this.renderFlour(g)
    if (this.script.strobe && !this.over) this.renderStrobe(g)
    if (!dark) this.renderBeams(g)
    this.renderDroneBeams(g)
    this.renderRings(g)
    this.renderStreamers(g)
    this.renderShots(g)
    this.renderGlitter(g)
    if (this.dead === 0 && !this.over)
      this.eachContestant(() => this.renderSparkle(g))
    this.eachContestant(() => this.renderOrbiters(g))
    this.renderLobs(g)
    this.renderBoomMics(g)
    this.renderConfetti(g)
    this.fx.render(g)
    this.renderTosses(g)
    if (dark) {
      this.renderDarkness(g)
      this.renderBeams(g)
      this.renderEyes(g)
    }
    if (this.has('confetti-storm')) this.renderStorm(g)
    for (const pack of this.packages) {
      dropShadow(g, pack.x, pack.landY + 6, 7, 2, 0.4)
      drawSprite(g, PACKAGE_SPRITE, pack.x, pack.y)
    }
    this.renderAudience(g)
    this.renderApplause(g)
    this.renderRatings(g)
    if (this.camFlash > 0) {
      g.fillStyle = rgba('#ffffff', 0.05 * this.camFlash)
      g.fillRect(LEFT, TOP, RIGHT - LEFT, BOTTOM - TOP)
    }
    for (const f of this.floaters) {
      drawText(g, f.text, f.x, f.y, {
        align: 'center',
        color: RAMPS.gold[3],
        outline: INK,
      })
    }
    if (this.has('sudden-death')) this.renderSuddenDeath(g)
    vignette(g, W, H, 0.28)
    this.renderHud(g)
    this.renderCutIn(g)
    if (this.over) this.renderGameOver(g)
  }

  /** The opening card for a saved show: carry on, or start over. */
  private renderChoice(g: CanvasRenderingContext2D) {
    const o = this.offer!
    g.fillStyle = rgba(INK, 0.72)
    g.fillRect(0, 0, W, H)
    hudPanel(g, 40, 50, W - 80, 140)
    const ep = SEASON[o.episode]!
    drawText(g, 'CONTINUE THE SHOW?', CX, 60, {
      align: 'center',
      scale: 2,
      color: '#ffffff',
      outline: INK,
    })
    const lines = [
      `EPISODE ${ep.number}: ${ep.title}`,
      o.loop > 1 ? `RERUN ${o.loop - 1}` : ep.subtitle,
      o.continued
        ? 'SCORE STARTS AGAIN FROM ZERO'
        : `SCORE ${o.score}  LIVES ${o.lives}`,
      `GOLDEN TICKETS ${o.tickets.length}/${SEASON_TICKETS}`,
      o.cleared ? 'SEASON CLEARED' : '',
    ]
    lines.forEach((line, i) =>
      drawText(g, line, CX, 88 + i * 14, {
        align: 'center',
        color: i === 0 ? RAMPS.gold[4] : RAMPS.cream[3],
        shadow: INK,
      }),
    )
    const blink = Math.floor(this.tick / 20) % 2
    drawText(g, 'A: CONTINUE     B: NEW SHOW', CX, 172, {
      align: 'center',
      color: blink ? RAMPS.gold[4] : RAMPS.gold[3],
      outline: INK,
    })
  }

  /** The season's end: the ending card, then the credits rolling over the studio. */
  private renderEnding(g: CanvasRenderingContext2D) {
    const e = this.ending!
    this.renderStudio(g)
    this.renderSpotlights(g)
    this.renderMarquee(g)
    this.fx.render(g)
    // The true ending: every kind of party crasher has joined the studio audience.
    for (const [i, c] of e.crowd.entries()) {
      const hop = Math.round(Math.abs(Math.sin((this.tick + i * 9) / 10)) * 3)
      const y = c.y
      c.y = y - hop
      c.t = this.tick + i * 7
      this.renderCrasher(g, c)
      c.y = y
    }
    this.renderAudience(g)
    this.renderApplause(g)
    g.fillStyle = rgba(INK, 0.55)
    g.fillRect(0, HUD, W, (e.crowd.length ? BOTTOM - 30 : BOTTOM) - HUD)
    const hold = PrizeShowPanic.ENDING_HOLD
    if (e.ticks < hold) {
      const card = ENDINGS[e.kind]
      drawText(g, card.title, CX, 50, {
        align: 'center',
        scale: 2,
        color: RAMPS.gold[4],
        outline: INK,
      })
      card.lines.forEach((line, i) =>
        drawText(g, line, CX, 84 + i * 13, {
          align: 'center',
          color: RAMPS.cream[4],
          shadow: INK,
        }),
      )
      if (e.kind === 'show')
        drawText(
          g,
          `YOU HOLD ${this.tickets.length} OF ${VAULT_TICKETS}`,
          CX,
          172,
          {
            align: 'center',
            color: RAMPS.gold[3],
            outline: INK,
          },
        )
      if (e.ticks % 12 === 0)
        this.fx.burst(
          LEFT + this.fxRng() * (RIGHT - LEFT),
          TOP + 20,
          this.fxRng,
          { count: 8 },
        )
    } else {
      const rolled = (e.ticks - hold) * PrizeShowPanic.CREDIT_SPEED
      g.save()
      g.beginPath()
      g.rect(0, TOP, W, (e.crowd.length ? BOTTOM - 34 : BOTTOM) - TOP)
      g.clip()
      creditLines(e.kind).forEach((line, i) => {
        const y = Math.round(H - rolled + i * 12)
        if (y < HUD - 10 || y > H) return
        const heading = line.startsWith('*')
        drawText(g, heading ? line.slice(1) : line, CX, y, {
          align: 'center',
          color: heading ? RAMPS.gold[3] : RAMPS.cream[4],
          outline: INK,
        })
      })
      g.restore()
    }
    this.renderHud(g)
  }

  private renderMap(g: CanvasRenderingContext2D) {
    const map = this.map!
    renderSeasonMap(g, {
      episode: this.episode,
      loop: this.loop,
      visited: this.route,
      current: this.roomId,
      options: map.options,
      cursor: map.cursor,
      tickets: this.tickets.length,
      ticketsTotal: SEASON_TICKETS,
      secrets: this.secretsFound,
      marker: LIFE_SPRITE,
      tick: this.tick,
      medals: this.medals,
      ...(this.mode === 'marathon'
        ? { tag: `PACE ${this.loop}`, rooms: this.marathonRooms }
        : {}),
    })
    vignette(g, W, H, 0.22)
    if (this.banner) this.renderBanner(g)
  }

  /** The set this room is on: its episode's, unless the room borrows another's (the finale). */
  private roomSet(): SetId {
    return this.script.set ?? this.episode.set
  }

  private setStyle(): SetStyle {
    return SETS[this.roomSet()]
  }

  private studioIndex(): number {
    const style = this.setStyle()
    const look = style.lookOf[this.script.type]
    if (look !== undefined) return look
    const room = this.secretId ? null : roomById(this.episode, this.roomId)
    return room ? (room.col + room.row) % style.cycle : 0
  }

  private renderStudio(g: CanvasRenderingContext2D) {
    const theme = this.studioIndex()
    const style = this.setStyle()
    const look = style.looks[theme]!
    const tile = style.tile
    // Floor, walls and bulb sockets are painted once per studio look.
    cachedLayer(g, `prize-show-panic-${this.roomSet()}-${theme}`, W, H, (k) => {
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
      for (let y = 0; y < BOTTOM; y += tile) {
        for (let x = 0; x < RIGHT; x += tile) {
          if (y + tile <= TOP || x + tile <= LEFT) continue
          const ramp = (x / tile + y / tile) % 2 ? look.tileB : look.tileA
          bevel(k, x + 1, y + 1, tile - 2, tile - 2, ramp, {
            depth: 1,
            outline: null,
          })
          k.fillStyle = rgba(ramp[4], 0.5)
          for (let i = 0; i < tile / 4; i++)
            k.fillRect(x + 3 + i, y + tile / 2 - 1 - i, 2, 1)
        }
      }
      if (style.mark === 'pad') {
        // A landing pad: rings and four chevrons pointing in.
        k.strokeStyle = rgba(look.mark, 0.3)
        k.lineWidth = 2
        for (const r of [66, 44]) {
          k.beginPath()
          k.ellipse(CX, CY, r, r * 0.65, 0, 0, Math.PI * 2)
          k.stroke()
        }
        k.fillStyle = rgba(look.mark, 0.35)
        for (const [dx, dy] of [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ] as const) {
          const x = CX + dx * 54
          const y = CY + dy * 36
          k.fillRect(x - 3, y - 3, 6, 6)
        }
      } else if (style.mark === 'plate') {
        // The kitchen's big serving plate in the middle of the floor.
        for (const [rx, a] of [
          [70, 0.12],
          [62, 0.1],
          [40, 0.14],
        ] as const) {
          k.fillStyle = rgba(look.mark, a)
          k.beginPath()
          k.ellipse(CX, CY, rx, rx * 0.6, 0, 0, Math.PI * 2)
          k.fill()
        }
      } else {
        // The show's star painted on the middle of the stage (the concert's taped in a circle).
        k.fillStyle = rgba(look.mark, 0.14)
        starPath(k, CX, CY, 52, 22)
        k.fill()
        k.fillStyle = rgba(look.mark, 0.16)
        starPath(k, CX, CY, 34, 14)
        k.fill()
        if (style.mark === 'stage') {
          k.strokeStyle = rgba(RAMPS.gold[3], 0.3)
          k.lineWidth = 2
          k.beginPath()
          k.ellipse(CX, CY, 74, 48, 0, 0, Math.PI * 2)
          k.stroke()
          for (const [x, y] of [
            [LEFT + 62, TOP + 34],
            [RIGHT - 62, TOP + 34],
            [LEFT + 62, BOTTOM - 34],
            [RIGHT - 62, BOTTOM - 34],
          ] as const) {
            k.fillStyle = rgba(RAMPS.gold[3], 0.35)
            k.fillRect(x - 5, y - 1, 10, 2)
            k.fillRect(x - 1, y - 5, 2, 10)
          }
        }
      }
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
      if (style.trim === 'tiles') {
        // A tiled kitchen backsplash: grout lines on every wall.
        k.fillStyle = rgba('#ffffff', 0.18)
        for (let x = 0; x < W; x += 5) {
          k.fillRect(x, HUD + 1, 1, WALL - 2)
          k.fillRect(x, BOTTOM + 1, 1, WALL - 2)
        }
        for (let y = HUD; y < H; y += 5) {
          k.fillRect(1, y, WALL - 2, 1)
          k.fillRect(RIGHT + 1, y, WALL - 2, 1)
        }
      } else if (style.trim === 'stars') {
        // Starlight in the walls: a scatter of tiny lights (laid out once, never the game's dice).
        const dice = backdropRng(613)
        for (let i = 0; i < 90; i++) {
          const along = dice()
          const side = Math.floor(dice() * 4)
          const x =
            side % 2 ? (side === 1 ? RIGHT + 2 : 2) + dice() * 6 : along * W
          const y =
            side % 2
              ? HUD + along * (H - HUD)
              : (side === 0 ? HUD + 2 : BOTTOM + 2) + dice() * 6
          k.fillStyle = dice() < 0.3 ? RAMPS.teal[4] : rgba('#ffffff', 0.7)
          k.fillRect(Math.round(x), Math.round(y), 1, 1)
        }
      } else if (style.trim === 'grilles') {
        // Speaker grilles all round the concert stage.
        k.fillStyle = rgba(INK, 0.55)
        for (let x = 2; x < W - 2; x += 3)
          for (const y of [HUD + 2, HUD + 6, BOTTOM + 2, BOTTOM + 6])
            k.fillRect(x, y, 1, 1)
        for (let y = HUD + 2; y < H - 2; y += 3)
          for (const x of [2, 6, RIGHT + 2, RIGHT + 6]) k.fillRect(x, y, 1, 1)
      }
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

  /** The two follow-spots' centres this tick (also the only light in Lights Out). */
  private followSpots(): Array<{ x: number; y: number }> {
    return [0, 1].map((i) => {
      const t = this.tick / 90 + i * 2.6
      return {
        x: CX + Math.sin(t * 0.83 + i) * 100,
        y: CY + Math.sin(t * 1.21 + i * 1.7) * 52,
      }
    })
  }

  private renderSpotlights(g: CanvasRenderingContext2D) {
    // Two follow-spots sweep the stage, stepped like the pools under them.
    const look = this.setStyle().looks[this.studioIndex()]!
    g.save()
    g.globalCompositeOperation = 'lighter'
    this.followSpots().forEach(({ x, y }, i) => {
      g.fillStyle = rgba(i ? RAMPS.pink[3] : look.pool, 0.06)
      for (let b = 0; b < 3; b++) {
        g.beginPath()
        g.ellipse(x, y, 30 - b * 8, 19 - b * 5, 0, 0, Math.PI * 2)
        g.fill()
      }
    })
    g.restore()
  }

  private renderMarquee(g: CanvasRenderingContext2D) {
    // The bulbs chase round the set: gold, green once the doors open, red when time is short.
    const step = Math.floor(this.tick / (this.has('double-time') ? 2 : 5))
    const ramp =
      this.exitsOpen && !this.script.closes
        ? RAMPS.leaf
        : this.roomTimer <= 600 && !this.over
          ? RAMPS.ember
          : this.setStyle().marquee
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
    const exit = this.exitsOpen
      ? this.exits.find((e) => e.side === i && e.kind !== 'secret')
      : undefined
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
      // The door's sign shows what the map says is through it.
      const icon =
        exit.kind === 'back'
          ? MAP_ICONS.secret
          : MAP_ICONS[ROOM_ICON[roomById(this.episode, exit.to).script.type]]
      const sx = d.x + (d.side === 1 ? -20 : d.side === 3 ? 20 : 0)
      const sy = d.y + (d.side === 0 ? 14 : d.side === 2 ? -14 : 0)
      bevel(g, sx - 9, sy - 8, 18, 16, RAMPS.leaf, { depth: 1 })
      drawSprite(g, icon, sx, sy)
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
    // While the script still has crashers to send, warning lamps blink on the posts.
    if (!this.wavesDone() && Math.floor(this.tick / 12) % 2 === 0) {
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

  /** The cracked wall: hairlines that spread as it takes confetti, then a hole to backstage. */
  private renderCrack(g: CanvasRenderingContext2D) {
    const crack = this.crack
    if (!crack) return
    const across = crack.side % 2 === 0
    const wx = across ? crack.x - 12 : crack.side === 3 ? 1 : RIGHT + 1
    const wy = across ? (crack.side === 0 ? HUD + 1 : BOTTOM + 1) : crack.y - 12
    const ww = across ? 24 : WALL - 2
    const wh = across ? WALL - 2 : 24
    if (crack.hp <= 0) {
      const open = this.exits.some((e) => e.kind === 'secret')
      bandedGradient(
        g,
        wx,
        wy,
        ww,
        wh,
        [INK, RAMPS.purple[0], RAMPS.night[2]],
        2,
      )
      glow(
        g,
        crack.x,
        crack.y,
        open ? 26 : 14,
        RAMPS.purple[3],
        open ? 0.45 + 0.15 * Math.sin(this.tick / 6) : 0.25,
      )
      if (open)
        drawSprite(
          g,
          MAP_ICONS.secret,
          crack.x,
          crack.y + (crack.side === 2 ? -14 : 14),
        )
      return
    }
    // Hairline cracks in ink with a lit edge, more of them the more it is hit.
    const stage = 6 - crack.hp
    const lines: [number, number][][] = [
      [
        [-1, -4],
        [1, -1],
        [-1, 2],
        [1, 4],
      ],
      [
        [1, -1],
        [5, -2],
        [8, 1],
      ],
      [
        [-1, 2],
        [-5, 1],
        [-8, 3],
      ],
      [
        [5, -2],
        [7, -4],
      ],
      [
        [-5, 1],
        [-7, -3],
        [-10, -2],
      ],
    ]
    const count = 1 + Math.min(4, stage)
    // Drawn on the wall's face, not the floor's edge.
    const ox = crack.side === 1 ? 5 : crack.side === 3 ? -5 : 0
    const oy = crack.side === 2 ? 5 : crack.side === 0 ? -5 : 0
    for (let i = 0; i < count; i++) {
      const path = lines[i]!
      for (let k = 1; k < path.length; k++) {
        const [ax, ay] = path[k - 1]!
        const [bx, by] = path[k]!
        const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay))
        for (let s = 0; s <= steps; s++) {
          const u = s / (steps || 1)
          const lx = ax + (bx - ax) * u
          const ly = ay + (by - ay) * u
          const px = Math.round(crack.x + ox + (across ? lx : ly))
          const py = Math.round(crack.y + oy + (across ? ly : lx))
          g.fillStyle = INK
          g.fillRect(px, py, 2, 1)
          g.fillStyle = RAMPS.cream[4]
          g.fillRect(px + 2, py, 1, 1)
        }
      }
    }
    // The host's hint: now and then a glint and a puff of plaster dust at the crack.
    if (this.tick % 150 < 14) {
      const t = this.tick % 150
      g.fillStyle = '#ffffff'
      g.fillRect(crack.x + ox - 1, crack.y + oy - 3 + (t >> 2), 3, 1)
      g.fillRect(crack.x + ox, crack.y + oy - 4 + (t >> 2), 1, 3)
      glow(g, crack.x + ox, crack.y + oy, 10, RAMPS.cream[4], 0.35)
    }
  }

  private renderExitArrows(g: CanvasRenderingContext2D, exit: RoomExit) {
    // Chevrons on the floor run toward each open way out.
    const inward = EXIT_INWARD[exit.side]!
    const start = exit.side % 2 ? 40 : 18
    const step = Math.floor(this.tick / 6)
    for (let k = 0; k < 3; k++) {
      const dist = start + k * 9
      drawSprite(
        g,
        exit.side % 2 ? CHEVRON_LEFT : CHEVRON_UP,
        exit.x + inward[0] * dist,
        exit.y + inward[1] * dist,
        {
          flipX: exit.side === 1,
          flipY: exit.side === 2,
          alpha: (step + k) % 3 === 0 ? 1 : 0.4,
        },
      )
    }
  }

  /** Floor mines: cushions puff up and flash with their blast ring showing before they go. */
  private renderMines(g: CanvasRenderingContext2D) {
    for (const m of this.mines) {
      if (m.kind === 'peel') {
        dropShadow(g, m.x, m.y + 4, 6, 1.4, 0.3)
        drawSprite(g, PEEL_SPRITE, m.x, m.y)
        continue
      }
      dropShadow(g, m.x + 1, m.y + 5, 8, 1.8, 0.3)
      if (m.fuse > 0) {
        const urgent = m.fuse < 14
        const blink = Math.floor(m.fuse / (urgent ? 2 : 4)) % 2 === 0
        // The blast ring, dotted round the floor.
        g.fillStyle = rgba(
          urgent ? RAMPS.ember[3] : RAMPS.pink[3],
          blink ? 0.9 : 0.45,
        )
        for (let i = 0; i < 20; i++) {
          const a = (i / 20) * Math.PI * 2 + this.tick / 20
          g.fillRect(
            Math.round(m.x + Math.cos(a) * CUSHION_BLAST) - 1,
            Math.round(m.y + Math.sin(a) * CUSHION_BLAST * 0.8),
            2,
            2,
          )
        }
        glow(g, m.x, m.y, 16, RAMPS.pink[3], blink ? 0.55 : 0.25)
        const frame = m.fuse > CUSHION_FUSE / 2 ? 1 : 2
        drawSprite(g, CUSHION_SPRITES[frame]!, m.x, m.y, {
          alpha: blink || !urgent ? 1 : 0.75,
        })
        continue
      }
      drawSprite(g, CUSHION_SPRITES[0]!, m.x, m.y)
    }
  }

  private renderPedestals(g: CanvasRenderingContext2D) {
    for (const p of this.prizes) {
      if (!p.pedestal) continue
      const x = Math.round(p.x)
      const y = Math.round(p.y)
      dropShadow(g, x, y + 11, 11, 2.2, 0.4)
      bevel(g, x - 9, y + 3, 18, 8, RAMPS.purple, { depth: 1 })
      bevel(g, x - 11, y + 1, 22, 3, RAMPS.gold, { depth: 1 })
    }
    for (const t of this.pickups) {
      const x = Math.round(t.x)
      const y = Math.round(t.y)
      dropShadow(g, x, y + 11, 12, 2.2, 0.4)
      bevel(g, x - 10, y + 3, 20, 8, RAMPS.gold, { depth: 1 })
    }
  }

  private renderTickets(g: CanvasRenderingContext2D) {
    for (const t of this.pickups) {
      const bob = Math.round(Math.sin(this.tick / 8) * 2)
      glow(
        g,
        t.x,
        t.y - 3,
        22,
        RAMPS.gold[3],
        0.5 + 0.15 * Math.sin(this.tick / 5),
      )
      drawSprite(g, TICKET_SPRITE, t.x, t.y - 4 + bob)
      if (this.tick % 30 < 10) {
        const tx = Math.round(t.x) + 8
        const ty = Math.round(t.y) - 9 + bob
        g.fillStyle = '#ffffff'
        g.fillRect(tx - 2, ty, 5, 1)
        g.fillRect(tx, ty - 2, 1, 5)
      }
    }
  }

  /** The light rig: hot beams glare in stepped bands; a warming beam flickers its outline. */
  private renderBeams(g: CanvasRenderingContext2D) {
    if (!this.beams.length) return
    const reach = 300
    g.save()
    g.beginPath()
    g.rect(LEFT, TOP, RIGHT - LEFT, BOTTOM - TOP)
    g.clip()
    for (const b of this.beams) {
      const { angle, hot, warming } = this.beamState(b)
      const dx = Math.cos(angle)
      const dy = Math.sin(angle)
      const nx = -dy
      const ny = dx
      const edge = (half: number, far: number) => {
        g.beginPath()
        g.moveTo(b.x + nx * half, b.y + ny * half)
        g.lineTo(b.x + dx * reach + nx * far, b.y + dy * reach + ny * far)
        g.lineTo(b.x + dx * reach - nx * far, b.y + dy * reach - ny * far)
        g.lineTo(b.x - nx * half, b.y - ny * half)
        g.closePath()
      }
      if (hot) {
        g.globalCompositeOperation = 'lighter'
        const bands: [number, string, number][] = [
          [1.35, RAMPS.gold[2], 0.12],
          [1, RAMPS.gold[3], 0.2],
          [0.55, RAMPS.cream[4], 0.28],
        ]
        for (const [k, colour, a] of bands) {
          g.fillStyle = rgba(colour, a)
          edge(5 * k, (5 + reach * 0.07) * k)
          g.fill()
        }
        g.globalCompositeOperation = 'source-over'
      } else if (warming) {
        g.strokeStyle = rgba(
          RAMPS.ember[3],
          Math.floor(this.tick / 4) % 2 ? 0.4 : 0.85,
        )
        g.lineWidth = 1
        edge(5, 5 + reach * 0.07)
        g.stroke()
      }
    }
    g.restore()
    // The lamps themselves, bolted to the wall.
    for (const b of this.beams) {
      const { hot, warming } = this.beamState(b)
      bevel(g, Math.round(b.x) - 5, Math.round(b.y) - 4, 10, 8, RAMPS.steel, {
        depth: 1,
      })
      const lamp = hot
        ? RAMPS.gold[4]
        : warming
          ? RAMPS.ember[3]
          : RAMPS.night[3]
      g.fillStyle = lamp
      g.fillRect(Math.round(b.x) - 2, Math.round(b.y) - 1, 4, 3)
      if (hot || warming)
        glow(g, b.x, b.y, hot ? 16 : 10, lamp, hot ? 0.6 : 0.4)
    }
  }

  private renderShadows(g: CanvasRenderingContext2D) {
    for (const p of this.prizes)
      if (!p.pedestal) dropShadow(g, p.x, p.y + 6, 6, 1.6, 0.35)
    if (this.boss?.kind === 'float')
      dropShadow(g, this.boss.x, this.boss.y + 21, 44, 5, 0.4)
    for (const box of this.cases)
      dropShadow(g, box.x + 1, box.y + 7, 12, 2.2, 0.4)
    for (const c of this.crashers) {
      if (c.kind === 'crane') continue
      const size =
        c.kind === 'mascot'
          ? 13
          : c.kind === 'tank'
            ? 10
            : c.kind === 'bouncer'
              ? 6
              : 5
      const high = c.z > 0 ? Math.max(0.35, 1 - c.z / 60) : 1
      dropShadow(g, c.x, c.y + 7, size * high, 1.6 * high, 0.35 * high)
      if (c.kind === 'diver' && c.mode === 1) {
        // Where the diver will land: a shadow that grows as it falls (the tell).
        const u = Math.min(1, c.clock / TELLS.diverFlight)
        dropShadow(g, c.tx, c.ty + 7, 6 + u * 10, 2 + u * 3, 0.25 + u * 0.35)
        g.strokeStyle = rgba(RAMPS.ember[3], 0.4 + u * 0.5)
        g.lineWidth = 1
        g.beginPath()
        g.ellipse(
          c.tx,
          c.ty + 7,
          TELLS.diverRing,
          TELLS.diverRing * 0.6,
          0,
          0,
          Math.PI * 2,
        )
        g.stroke()
      }
    }
    for (const d of this.dancers)
      dropShadow(g, d.x, d.y + 7, 4, 1.4, 0.3 * Math.min(1, d.life / 25))
    if (this.dead === 0 && !this.over)
      this.eachContestant(() => {
        if (this.lifted === 0) dropShadow(g, this.px, this.py + 8, 6, 1.8, 0.4)
      })
  }

  /** The set's floor hazards: counters, hot plates, mosh pits and speaker stacks. */
  private renderSetFloor(g: CanvasRenderingContext2D) {
    const tick = this.roomTick
    for (const b of this.belts) this.renderBelt(g, b)
    for (const p of this.plates) {
      const { state, k } = plateState(p, tick)
      const cx = p.x + p.w / 2
      const cy = p.y + p.h / 2
      bevel(g, p.x + 1, p.y + 1, p.w - 2, p.h - 2, RAMPS.steel, { depth: 1 })
      g.fillStyle = RAMPS.night[1]
      g.fillRect(p.x + 3, p.y + 3, p.w - 6, p.h - 6)
      const blink = Math.floor(this.tick / 4) % 2
      const coil =
        state === 'hot'
          ? RAMPS.ember[blink ? 4 : 3]
          : state === 'glow'
            ? mix(RAMPS.steel[1], RAMPS.ember[2], blink ? k : k * 0.6)
            : RAMPS.steel[1]
      if (state !== 'cold')
        glow(
          g,
          cx,
          cy,
          p.w * (state === 'hot' ? 0.8 : 0.5),
          state === 'hot' ? RAMPS.ember[3] : RAMPS.ember[2],
          state === 'hot' ? 0.55 : 0.2 + 0.3 * k,
        )
      g.strokeStyle = coil
      g.lineWidth = 2
      for (const inset of [6, 11]) {
        g.beginPath()
        g.ellipse(cx, cy, p.w / 2 - inset, p.h / 2 - inset, 0, 0, Math.PI * 2)
        g.stroke()
      }
      if (state === 'hot') {
        // Heat shimmering up off it.
        for (let i = 0; i < 4; i++) {
          const t = (this.tick + i * 9) % 36
          g.fillStyle = rgba(RAMPS.gold[4], 0.6 * (1 - t / 36))
          g.fillRect(p.x + 5 + i * 7, Math.round(cy - t / 2), 1, 3)
        }
      }
    }
    for (const pit of this.pits) {
      // A scuffed circle with the crowd moshing round its edge.
      g.fillStyle = rgba(INK, 0.28)
      g.beginPath()
      g.ellipse(pit.x, pit.y, pit.r, pit.r * 0.8, 0, 0, Math.PI * 2)
      g.fill()
      const kick = 1 - beatPhase(tick, this.beat())
      g.strokeStyle = rgba(RAMPS.pink[3], 0.35 + 0.4 * kick)
      g.lineWidth = 1
      g.beginPath()
      g.ellipse(pit.x, pit.y, pit.r, pit.r * 0.8, 0, 0, Math.PI * 2)
      g.stroke()
      // Swirl marks showing which way it spins.
      g.strokeStyle = rgba(RAMPS.pink[3], 0.25 + 0.3 * kick)
      g.lineWidth = 2
      for (const k of [0, Math.PI]) {
        const a0 = k + (this.tick / 30) * pit.spin
        g.beginPath()
        g.ellipse(pit.x, pit.y, pit.r * 0.5, pit.r * 0.4, 0, a0, a0 + 1.6)
        g.stroke()
      }
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2 + (this.tick / 40) * pit.spin
        const mx = Math.round(pit.x + Math.cos(a) * pit.r * 0.86)
        const my = Math.round(pit.y + Math.sin(a) * pit.r * 0.7)
        const hop = Math.round(kick * 2 * ((i % 2) * 2 - 1))
        // A little moshing fan: a head, a body, an arm up on the beat.
        g.fillStyle = INK
        g.fillRect(mx - 3, my - 8 - hop, 6, 10)
        g.fillStyle = CROWD_COLOURS[i % CROWD_COLOURS.length]!
        g.fillRect(mx - 2, my - 4 - hop, 4, 5)
        g.fillStyle = RAMPS.cream[3]
        g.fillRect(mx - 1, my - 7 - hop, 3, 3)
        if (kick > 0.6) {
          g.fillStyle = INK
          g.fillRect(mx + 2, my - 11 - hop, 2, 5)
          g.fillStyle = RAMPS.cream[3]
          g.fillRect(mx + 2, my - 10 - hop, 1, 3)
        }
      }
    }
    if (this.turntable) this.renderTurntable(g, this.turntable)
    for (const w of this.warps) {
      // Two door frames with a swirling portal in each (dim while it recharges).
      const ready = this.warpClock === 0
      for (const [x, y] of [
        [w.x1, w.y1],
        [w.x2, w.y2],
      ] as const) {
        bevel(g, x - 8, y - 11, 16, 20, RAMPS.steel, { depth: 1 })
        g.fillStyle = RAMPS.night[0]
        g.fillRect(x - 6, y - 9, 12, 16)
        for (let i = 0; i < 3; i++) {
          const k = (this.tick / 25 + i / 3) % 1
          g.strokeStyle = rgba(
            i % 2 ? RAMPS.purple[3] : RAMPS.teal[3],
            (ready ? 0.9 : 0.35) * (1 - k),
          )
          g.lineWidth = 1
          g.beginPath()
          g.ellipse(
            x,
            y - 1,
            5 * (1 - k) + 1,
            7 * (1 - k) + 1,
            0,
            0,
            Math.PI * 2,
          )
          g.stroke()
        }
        if (ready) glow(g, x, y - 1, 10, RAMPS.teal[3], 0.25)
      }
    }
    if (this.script.lowGravity) {
      // Motes drifting up through the low gravity (cosmetic, from the tick alone).
      for (let i = 0; i < 18; i++) {
        const x = LEFT + ((i * 53 + 17) % (RIGHT - LEFT))
        const y =
          BOTTOM -
          ((this.tick * (0.2 + (i % 3) * 0.1) + i * 31) % (BOTTOM - TOP))
        g.fillStyle = rgba(i % 4 ? '#ffffff' : RAMPS.teal[4], 0.35)
        g.fillRect(Math.round(x), Math.round(y), 1, 1)
      }
    }
    for (const sp of this.speakers) {
      // A speaker stack: two cones that pump just before each thump.
      const until = speakerUntil(sp, tick, this.beat())
      const pump =
        until <= RING.speakerTell ? 1 + (1 - until / RING.speakerTell) : 1
      dropShadow(g, sp.x, sp.y + 13, 11, 3, 0.4)
      bevel(g, sp.x - 9, sp.y - 13, 18, 26, RAMPS.night)
      for (const dy of [-6, 6]) {
        shadedOrb(g, sp.x, sp.y + dy, 4 + pump, RAMPS.steel, { glint: false })
        g.fillStyle = INK
        g.fillRect(sp.x - 1, sp.y + dy - 1, 2, 2)
      }
      if (until <= RING.speakerTell)
        glow(g, sp.x, sp.y, 16, RAMPS.pink[3], 0.25 + 0.35 * (pump - 1))
    }
  }

  /** The galaxy's turning ring: lit panels going round, and the solid hub in the middle. */
  private renderTurntable(g: CanvasRenderingContext2D, t: TurntableProp) {
    const turn = this.roomTick * t.spin
    const n = 16
    g.save()
    g.translate(CX, CY)
    g.scale(1, 0.8)
    g.fillStyle = INK
    g.beginPath()
    g.arc(0, 0, t.outer + 1, 0, Math.PI * 2)
    g.fill()
    for (let i = 0; i < n; i++) {
      const a0 = turn + (i / n) * Math.PI * 2
      g.fillStyle = i % 2 ? RAMPS.night[2] : RAMPS.night[3]
      g.beginPath()
      g.arc(0, 0, t.outer, a0, a0 + (Math.PI * 2) / n)
      g.arc(0, 0, t.inner, a0 + (Math.PI * 2) / n, a0, true)
      g.closePath()
      g.fill()
      // A running light on the rim of every other panel.
      if (i % 2 === 0) {
        g.fillStyle =
          (i / 2 + Math.floor(this.tick / 8)) % 4 === 0
            ? RAMPS.teal[4]
            : RAMPS.teal[1]
        g.fillRect(
          Math.cos(a0) * (t.outer - 4) - 1,
          Math.sin(a0) * (t.outer - 4) - 1,
          3,
          3,
        )
      }
    }
    g.strokeStyle = rgba(RAMPS.teal[3], 0.7)
    g.lineWidth = 1
    for (const r of [t.outer, t.inner]) {
      g.beginPath()
      g.arc(0, 0, r, 0, Math.PI * 2)
      g.stroke()
    }
    g.restore()
    // The hub: a solid column with a broadcast mast on top.
    const hub = t.inner - 6
    shadedOrb(g, CX, CY, hub, RAMPS.steel)
    g.fillStyle = INK
    g.fillRect(CX - 1, CY - hub - 10, 3, 12)
    glow(
      g,
      CX,
      CY - hub - 10,
      6,
      RAMPS.ember[3],
      0.4 + 0.4 * (Math.floor(this.tick / 15) % 2),
    )
  }

  /** A conveyor counter: a steel bed with chevrons rolling the way it carries. */
  private renderBelt(g: CanvasRenderingContext2D, b: BeltProp) {
    bevel(g, b.x, b.y, b.w, b.h, RAMPS.steel, { depth: 1 })
    g.fillStyle = RAMPS.night[2]
    g.fillRect(b.x + 2, b.y + 2, b.w - 4, b.h - 4)
    const dir = beltDir(b)
    const roll = Math.floor(this.roomTick * 0.6) % 8
    g.save()
    g.beginPath()
    g.rect(b.x + 2, b.y + 2, b.w - 4, b.h - 4)
    g.clip()
    g.fillStyle = RAMPS.steel[2]
    if (dir.x !== 0) {
      for (let x = b.x - 8; x < b.x + b.w + 8; x += 8) {
        const cx = x + roll * dir.x
        for (let i = 0; i < 3; i++) {
          g.fillRect(cx + i * dir.x, b.y + b.h / 2 - 3 + i, 1, 1)
          g.fillRect(cx + i * dir.x, b.y + b.h / 2 + 3 - i, 1, 1)
        }
      }
    } else {
      for (let y = b.y - 8; y < b.y + b.h + 8; y += 8) {
        const cy = y + roll * dir.y
        for (let i = 0; i < 3; i++) {
          g.fillRect(b.x + b.w / 2 - 3 + i, cy + i * dir.y, 1, 1)
          g.fillRect(b.x + b.w / 2 + 3 - i, cy + i * dir.y, 1, 1)
        }
      }
    }
    g.restore()
  }

  /** Flour clouds drawn over the crowd: whoever is inside is hard to see. */
  private renderFlour(g: CanvasRenderingContext2D) {
    for (const [n, f] of this.flours.entries()) {
      const a = 0.18 + 0.72 * f.density
      for (let i = 0; i < 7; i++) {
        const ang = (i / 7) * Math.PI * 2 + n
        const wob = Math.sin((this.tick + i * 17) / 30) * 2
        const r = f.r * (i === 0 ? 0.75 : 0.5) + wob
        const x = i === 0 ? f.x : f.x + Math.cos(ang) * f.r * 0.5
        const y = i === 0 ? f.y : f.y + Math.sin(ang) * f.r * 0.4
        g.fillStyle = rgba(i % 2 ? RAMPS.cream[3] : RAMPS.cream[4], a * 0.8)
        g.beginPath()
        g.arc(x, y, r, 0, Math.PI * 2)
        g.fill()
      }
    }
  }

  /** The strobe: a flash on the beat, then the set falls dark until the next one. */
  private renderStrobe(g: CanvasRenderingContext2D) {
    const p = beatPhase(this.roomTick, this.beat())
    g.fillStyle = rgba(INK, Math.min(0.86, 0.12 + p * 1.3))
    g.fillRect(LEFT, TOP, RIGHT - LEFT, BOTTOM - TOP)
    if (p < 0.1) {
      g.fillStyle = rgba('#ffffff', 0.16)
      g.fillRect(LEFT, TOP, RIGHT - LEFT, BOTTOM - TOP)
    }
    if (p > 0.4) this.renderEyes(g)
  }

  /** Bass rings and shockwaves: a bright edge (with its gap) that fades as it spreads. */
  private renderRings(g: CanvasRenderingContext2D) {
    if (!this.rings.length) return
    g.save()
    g.beginPath()
    g.rect(LEFT, TOP, RIGHT - LEFT, BOTTOM - TOP)
    g.clip()
    for (const ring of this.rings) {
      // Bright while it can hurt, a faint ripple for the last of its spread.
      const fade = ringLive(ring) ? 1 - (0.6 * ring.r) / ring.max : 0.15
      const from = ring.gap === null ? 0 : ring.gap + RING.gapHalf
      const to =
        ring.gap === null ? Math.PI * 2 : ring.gap - RING.gapHalf + Math.PI * 2
      const colour = ring.gap === null ? RAMPS.cream[4] : RAMPS.pink[3]
      g.strokeStyle = rgba(INK, 0.5 * fade + 0.2)
      g.lineWidth = 4
      g.beginPath()
      g.arc(ring.x, ring.y, ring.r, from, to)
      g.stroke()
      g.strokeStyle = rgba(colour, 0.5 + 0.5 * fade)
      g.lineWidth = 2
      g.beginPath()
      g.arc(ring.x, ring.y, ring.r, from, to)
      g.stroke()
    }
    g.restore()
  }

  /** Pie cream (slippery) and foam (slows crashers) on the floor. */
  private renderSlicks(g: CanvasRenderingContext2D) {
    for (const s of this.slicks) {
      const fade = Math.min(1, s.life / 60)
      const cream = s.kind === 'cream'
      const base = cream ? RAMPS.cream[3] : RAMPS.water[3]
      const top = cream ? RAMPS.cream[4] : RAMPS.water[4]
      g.fillStyle = rgba(base, 0.55 * fade)
      g.beginPath()
      g.ellipse(s.x, s.y + 4, s.r, s.r * 0.55, 0, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = rgba(top, 0.7 * fade)
      for (let i = 0; i < 4; i++) {
        const a = i * 1.7 + s.x
        g.beginPath()
        g.ellipse(
          s.x + Math.cos(a) * s.r * 0.5,
          s.y + 4 + Math.sin(a) * s.r * 0.25,
          s.r * 0.3,
          s.r * 0.18,
          0,
          0,
          Math.PI * 2,
        )
        g.fill()
      }
    }
  }

  /** A boom mic's tell: its shadow grows on the floor where it will swoop. */
  private renderBoomShadows(g: CanvasRenderingContext2D) {
    for (const boom of this.booms) {
      const u = this.boomTell(boom)
      if (u === null) continue
      dropShadow(g, boom.x, boom.y + 6, 6 + u * 10, 2 + u * 4, 0.3 + u * 0.4)
      g.fillStyle = rgba(
        RAMPS.ember[3],
        0.5 + 0.4 * (Math.floor(this.tick / 4) % 2),
      )
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + this.tick / 18
        g.fillRect(
          Math.round(boom.x + Math.cos(a) * BOOM_REACH),
          Math.round(boom.y + 6 + Math.sin(a) * BOOM_REACH * 0.6),
          2,
          1,
        )
      }
    }
  }

  /** The boom mics on their cables: lowering during the tell, carrying Sparkle while she's up. */
  private renderBoomMics(g: CanvasRenderingContext2D) {
    for (const boom of this.booms) {
      const u = this.boomTell(boom)
      if (u === null) continue
      const y = TOP + (boom.y - 14 - TOP) * u * u
      g.fillStyle = RAMPS.steel[1]
      g.fillRect(Math.round(boom.x), HUD, 1, Math.max(0, Math.round(y) - HUD))
      drawSprite(g, MIC_SPRITE, boom.x, y, { flipY: true })
    }
    if (this.lifted > 0) {
      const up = Math.sin((1 - this.lifted / BOOM_LIFT) * Math.PI) * 40
      const y = this.py - up
      g.fillStyle = RAMPS.steel[1]
      g.fillRect(
        Math.round(this.px),
        HUD,
        1,
        Math.max(0, Math.round(y - 22 - HUD)),
      )
      drawSprite(g, MIC_SPRITE, this.px, y - 18, { flipY: true })
    }
  }

  /** The cardboard cutout the crowd chases. */
  private renderDecoy(g: CanvasRenderingContext2D) {
    const d = this.decoy
    if (!d) return
    if (d.life < 90 && Math.floor(this.tick / 4) % 2) return
    dropShadow(g, d.x, d.y + 8, 6, 1.8, 0.4)
    g.fillStyle = RAMPS.earth[1]
    g.fillRect(Math.round(d.x) + 3, Math.round(d.y) + 2, 2, 7)
    drawSprite(g, CUTOUT_SPRITE, d.x, d.y + 8, { anchor: 'feet' })
    gauge(
      g,
      Math.round(d.x) - 8,
      Math.round(d.y) - 14,
      16,
      2,
      d.hp / ARSENAL.cutoutHp,
      RAMPS.earth,
    )
  }

  /** Pies and party poppers in flight, each over a landing shadow (the pie's is the tell). */
  private renderLobs(g: CanvasRenderingContext2D) {
    for (const lob of this.lobs) {
      const u = lob.t / lob.dur
      const x = lob.x0 + (lob.x1 - lob.x0) * u
      const y = lob.y0 + (lob.y1 - lob.y0) * u - Math.sin(u * Math.PI) * 42
      dropShadow(g, lob.x1, lob.y1 + 4, 3 + u * 6, 1 + u * 2, 0.25 + u * 0.35)
      if (lob.kind === 'pie') {
        g.strokeStyle = rgba(RAMPS.cream[4], 0.35 + u * 0.5)
        g.lineWidth = 1
        g.beginPath()
        g.ellipse(lob.x1, lob.y1 + 4, 10, 6, 0, 0, Math.PI * 2)
        g.stroke()
        drawSprite(g, PIE_SPRITE, x, y)
      } else {
        glow(g, x, y, 8, RAMPS.pink[3], 0.4)
        drawSprite(g, POPPER_SPRITE, x, y, { flipX: lob.x1 < lob.x0 })
      }
    }
  }

  /** Streamer orbiters: two gold ribbons circling Sparkle. */
  private renderOrbiters(g: CanvasRenderingContext2D) {
    const spots = this.orbiterSpots()
    if (!spots.length) return
    const fading = this.powers.orbiters < 120 && Math.floor(this.tick / 4) % 2
    if (fading) return
    for (const o of spots) {
      glow(g, o.x, o.y, 8, RAMPS.gold[3], 0.45)
      drawSprite(g, STREAMER_SPRITES[1]!, o.x, o.y)
    }
  }

  /** Glitter laser lines: a white core in a pink haze, glinting along its length. */
  private renderGlitter(g: CanvasRenderingContext2D) {
    if (!this.glitter.length) return
    g.save()
    g.globalCompositeOperation = 'lighter'
    for (const l of this.glitter) {
      const a = l.life / ARSENAL.laserShow
      for (const [w, colour, alpha] of [
        [5, RAMPS.pink[3], 0.35],
        [3, RAMPS.cream[4], 0.6],
        [1, '#ffffff', 0.9],
      ] as const) {
        g.strokeStyle = rgba(colour, alpha * a)
        g.lineWidth = w
        g.beginPath()
        g.moveTo(l.x0, l.y0)
        g.lineTo(l.x1, l.y1)
        g.stroke()
      }
      g.fillStyle = '#ffffff'
      const len = Math.hypot(l.x1 - l.x0, l.y1 - l.y0)
      for (let d = (this.tick * 3) % 14; d < len; d += 14) {
        const u = d / (len || 1)
        g.fillRect(
          Math.round(l.x0 + (l.x1 - l.x0) * u) - 1,
          Math.round(l.y0 + (l.y1 - l.y0) * u),
          3,
          1,
        )
      }
    }
    g.restore()
  }

  /** Spotlight drones: a dotted lock line (the tell), then a hot beam down it. */
  private renderDroneBeams(g: CanvasRenderingContext2D) {
    for (const c of this.crashers) {
      if (c.kind !== 'drone' || c.mode === 0) continue
      const x = c.x
      const y = c.y - c.z
      const a = Math.atan2(c.ty - c.y, c.tx - c.x)
      const dx = Math.cos(a)
      const dy = Math.sin(a)
      if (c.mode === 1) {
        const k = c.clock / TELLS.droneLock
        g.fillStyle = rgba(RAMPS.ember[3], 0.35 + k * 0.55)
        for (let d = 8; d < TELLS.droneLength; d += 6) {
          if (Math.floor((d + this.tick) / 6) % 2) continue
          const px = x + dx * d
          const py = c.y + dy * d
          if (px < LEFT || px > RIGHT || py < TOP || py > BOTTOM) break
          g.fillRect(Math.round(px), Math.round(py), 2, 2)
        }
        g.strokeStyle = rgba(RAMPS.ember[3], 0.8)
        g.lineWidth = 1
        g.strokeRect(Math.round(c.tx) - 5.5, Math.round(c.ty) - 5.5, 11, 11)
        continue
      }
      g.save()
      g.beginPath()
      g.rect(LEFT, TOP, RIGHT - LEFT, BOTTOM - TOP)
      g.clip()
      g.globalCompositeOperation = 'lighter'
      for (const [w, colour, alpha] of [
        [9, RAMPS.gold[3], 0.25],
        [5, RAMPS.gold[4], 0.45],
        [2, '#ffffff', 0.85],
      ] as const) {
        g.strokeStyle = rgba(colour, alpha)
        g.lineWidth = w
        g.beginPath()
        g.moveTo(x, y)
        g.lineTo(c.x + dx * TELLS.droneLength, c.y + dy * TELLS.droneLength)
        g.stroke()
      }
      g.restore()
    }
  }

  private renderSparkle(g: CanvasRenderingContext2D) {
    if (this.invuln > 0 && this.lifted === 0 && Math.floor(this.tick / 4) % 2)
      return
    const x = Math.round(this.px)
    const up = this.lifted
      ? Math.sin((1 - this.lifted / BOOM_LIFT) * Math.PI) * 40
      : 0
    const y = Math.round(this.py - up)
    const view = viewOf(this.aim)
    const pace = Math.floor(this.stride / 7) % 2
    const frame = this.striding ? 1 + pace : 0
    // The confetti cannon sits on Sparkle's aim; behind when aiming away from us.
    const cannon = () => {
      const mx = x + this.aim.x * 8
      const my = y - 1 + this.aim.y * 7
      const cool = this.powers.rapid > 0 ? RAPID_COOLDOWN : FIRE_COOLDOWN
      if (this.fireCooldown >= cool - 1) glow(g, mx, my, 9, RAMPS.pink[3], 0.7)
      shadedOrb(g, mx, my, 2.5, RAMPS.pink)
    }
    if (this.aim.y < 0) cannon()
    if (this.powers.skates > 0) glow(g, x, y + 7, 8, RAMPS.leaf[3], 0.35)
    const sprites = CONTESTANT_SPRITES[this.cur.who]
    drawSprite(g, sprites[view][frame]!, x, y + 8 - (frame ? pace : 0), {
      anchor: 'feet',
      flipX: this.aim.x < 0,
    })
    if (this.aim.y >= 0) cannon()
    if (this.slip > 0) {
      // Sliding on a peel: little motion lines behind her.
      g.fillStyle = rgba(RAMPS.gold[4], 0.8)
      for (let i = 1; i <= 3; i++)
        g.fillRect(
          Math.round(x - this.vx * i * 3) - 3,
          Math.round(y + 6 - this.vy * i * 3),
          6 - i,
          1,
        )
    }
    if (this.cur.guard) {
      // Glimmer's own shield: a faint lilac ring while it is up.
      g.strokeStyle = rgba(RAMPS.purple[3], 0.55)
      g.lineWidth = 1
      g.beginPath()
      g.arc(x, y - 1, 12, 0, Math.PI * 2)
      g.stroke()
    }
    if (this.team.length > 1)
      drawText(g, `P${this.cur.seat + 1}`, x, y - 22, {
        align: 'center',
        color: SEAT_COLOURS[this.cur.seat]!,
        outline: INK,
      })
    const shield = this.powers.shield
    if (shield > 0 && !(shield < 120 && Math.floor(this.tick / 4) % 2)) {
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
    if (c.kind === 'crane') {
      this.renderCrane(g, c)
      return
    }
    if (c.kind === 'clone') {
      this.renderClone(g, c)
      return
    }
    const look = CRASHER_LOOKS.get(c.color) ?? FALLBACK_LOOK
    const frames = look[c.kind] ?? look.grabber!
    let frame = Math.floor(c.t / 8) % 2
    let lift = Math.round(Math.abs(Math.sin(c.t / 5)))
    let flip = this.px < c.x
    let shake = 0
    switch (c.kind) {
      case 'bouncer':
        lift = Math.round(Math.sin(((c.t % 20) / 20) * Math.PI) * 4)
        frame = lift === 0 ? 1 : 0
        flip = c.vx < 0
        break
      case 'conga':
        frame = Math.floor(c.t / 10) % 2
        if (c.leader) flip = c.leader.x < c.x
        break
      case 'thrower':
        frame = c.t % 90 < 12 ? 1 : 0
        break
      case 'popper':
        lift = 3 + Math.round(Math.sin(c.t / 9) * 2)
        frame = Math.floor(c.t / 14) % 2
        if (c.mode === 1) shake = Math.floor(c.clock / 2) % 2 ? 1 : -1
        break
      case 'tank':
      case 'mascot':
      case 'roadie':
        flip = Math.cos(c.face) < 0
        frame = Math.floor(c.t / (c.kind === 'tank' ? 5 : 9)) % 2
        lift = c.kind === 'tank' ? 0 : lift
        if (c.kind === 'mascot' && c.mode === 1)
          shake = Math.floor(c.clock / 3) % 2 ? 1 : -1
        if (c.kind === 'mascot' && c.mode === 2) frame = Math.floor(c.t / 4) % 2
        break
      case 'stagehand':
        if (c.mode === 1) lift = -2
        break
      case 'drone':
      case 'saucer':
        lift = Math.round(c.z + Math.sin(c.t / 10) * 2)
        frame = Math.floor(c.t / (c.kind === 'drone' ? 3 : 8)) % 2
        flip = c.kind === 'drone' ? this.px < c.x : false
        break
      case 'chef':
      case 'heckler':
        frame = c.mode === 1 ? 1 : Math.floor(c.t / 12) % 2 ? 0 : 0
        break
      case 'timer':
        frame = Math.floor(c.t / 10) % 2
        break
      case 'meatball':
        lift = 0
        frame = Math.floor(c.t / (c.mode === 1 ? 3 : 10)) % 2
        flip = c.mode === 1 ? c.vx < 0 || c.vy < 0 : Math.cos(c.face) < 0
        if (c.mode === 0) shake = Math.floor(c.clock / 2) % 2 ? 1 : 0
        break
      case 'diver':
        lift = Math.round(c.z) + (c.z > 0 ? 0 : lift)
        frame = c.z > 2 ? 1 : 0
        break
      case 'fluffball': {
        const swelling = c.clock > TELLS.fluffEvery
        frame = Math.floor(c.t / (swelling ? 3 : 7)) % 2
        break
      }
    }
    const x = Math.round(c.x) + shake
    const y = Math.round(c.y) + 7 - lift
    if (c.kind === 'popper' && c.mode === 1) {
      const k = c.clock / TELLS.popperSwell
      glow(g, x, y - 12, 10 + k * 10, RAMPS.pink[3], 0.4 + k * 0.4)
    }
    drawSprite(g, frames[frame]!, x, y, {
      anchor: 'feet',
      flipX: flip,
      alpha:
        c.kind === 'popper' && c.mode === 1 && Math.floor(c.clock / 3) % 2
          ? 0.6
          : 1,
    })
    this.renderTell(g, c, x, y)
  }

  /** What a crasher shows before it acts, drawn over it. */
  private renderTell(
    g: CanvasRenderingContext2D,
    c: Crasher,
    x: number,
    y: number,
  ) {
    const bang = (top: number, colour: string) => {
      if (Math.floor(this.tick / 4) % 2) return
      drawText(g, '!', x, top, { align: 'center', color: colour, outline: INK })
    }
    if (c.pumped > 0 && Math.floor(this.tick / 6) % 2 === 0) {
      // Heckled: little anger marks over its head.
      g.fillStyle = RAMPS.ember[3]
      g.fillRect(x + 4, y - 22, 3, 1)
      g.fillRect(x + 5, y - 23, 1, 3)
    }
    if (c.slow > 0) {
      g.fillStyle = rgba(RAMPS.water[4], 0.7)
      g.fillRect(x - 5, y - 2, 10, 2)
    }
    switch (c.kind) {
      case 'tank': {
        if (c.mode !== 1) break
        const k = c.clock / TELLS.tankCharge
        glow(
          g,
          x + Math.cos(c.face) * 9,
          y - 9 + Math.sin(c.face) * 4,
          6 + k * 8,
          RAMPS.sky[3],
          0.4 + k * 0.5,
        )
        break
      }
      case 'stagehand':
        if (c.mode === 1) bang(y - 30, RAMPS.pink[3])
        break
      case 'mascot':
        if (c.mode === 1) bang(y - 40, RAMPS.ember[3])
        if (c.mode === 3) {
          for (let i = 0; i < 3; i++) {
            const a = this.tick / 8 + (i * Math.PI * 2) / 3
            g.fillStyle = RAMPS.gold[4]
            g.fillRect(
              Math.round(x + Math.cos(a) * 10),
              Math.round(y - 30 + Math.sin(a) * 3),
              2,
              2,
            )
          }
        }
        gauge(g, x - 12, y - 34, 24, 2, c.hp / c.maxHp, RAMPS.ember)
        break
      case 'chef':
        if (c.mode === 1)
          drawSprite(g, PIE_SPRITE, x, y - 26 - Math.min(4, c.clock / 6))
        break
      case 'timer': {
        // The dial's hand sweeps round; the last two seconds it flashes.
        const left = TELLS.timerFuse - c.clock
        const a = -Math.PI / 2 + (c.clock / TELLS.timerFuse) * Math.PI * 2
        const cx = x
        const cy = y - 9
        if (left < 120 && Math.floor(this.tick / 5) % 2)
          glow(g, cx, cy, 12, RAMPS.ember[3], 0.6)
        g.fillStyle = RAMPS.ember[2]
        for (let r = 1; r <= 2; r++)
          g.fillRect(
            Math.round(cx + Math.cos(a) * r),
            Math.round(cy + Math.sin(a) * r),
            1,
            1,
          )
        break
      }
      case 'heckler':
        if (c.mode === 1) {
          bang(y - 30, RAMPS.gold[4])
          g.strokeStyle = rgba(RAMPS.gold[4], 0.6)
          g.lineWidth = 1
          for (let r = 1; r <= 2; r++) {
            g.beginPath()
            g.arc(x + 9, y - 12, 4 * r + (this.tick % 8) / 2, -0.7, 0.7)
            g.stroke()
          }
        }
        break
      case 'saucer': {
        const prize = c.prize
        if (c.mode !== 1 || !prize) break
        // The tractor beam: a pale cone from the saucer down to the prize it is lifting.
        g.save()
        g.globalCompositeOperation = 'lighter'
        g.fillStyle = rgba(RAMPS.sky[3], 0.22 + 0.08 * Math.sin(this.tick / 3))
        g.beginPath()
        g.moveTo(x - 4, y - 8)
        g.lineTo(x + 4, y - 8)
        g.lineTo(prize.x + 9, prize.y + 6)
        g.lineTo(prize.x - 9, prize.y + 6)
        g.closePath()
        g.fill()
        g.restore()
        break
      }
      case 'meatball':
        if (c.mode === 0 && c.clock % 6 < 3) {
          g.fillStyle = rgba(RAMPS.earth[3], 0.8)
          const back = Math.cos(c.face) > 0 ? -1 : 1
          g.fillRect(x + back * 9, y - 3, 3, 1)
          g.fillRect(x + back * 11, y - 5, 2, 1)
        }
        break
      case 'fluffball':
        if (c.clock > TELLS.fluffEvery) glow(g, x, y - 6, 9, RAMPS.pink[3], 0.4)
        break
    }
  }

  /** A camera crane on the wall: the lens glows red and an aim line shows while it charges. */
  private renderCrane(g: CanvasRenderingContext2D, c: Crasher) {
    const charging = !this.cleared && craneCharging(c, this.roomTick)
    if (charging) {
      const k =
        (((this.roomTick + c.offset) % c.every) -
          (c.every - TELLS.craneCharge)) /
        TELLS.craneCharge
      glow(g, c.x, c.y, 10 + k * 10, RAMPS.ember[3], 0.35 + k * 0.4)
      const dx = c.tx - c.x
      const dy = c.ty - c.y
      const len = Math.hypot(dx, dy) || 1
      g.fillStyle = rgba(RAMPS.ember[3], 0.35 + k * 0.5)
      for (let d = 12; d < len; d += 7) {
        if (Math.floor((d + this.tick) / 7) % 2) continue
        g.fillRect(
          Math.round(c.x + (dx / len) * d),
          Math.round(c.y + (dy / len) * d),
          2,
          2,
        )
      }
    }
    // The crane arm it hangs from, along the wall.
    const along = c.side % 2 === 0
    g.fillStyle = INK
    if (along)
      g.fillRect(
        Math.round(c.x) - 7,
        Math.round(c.y) - (c.side === 0 ? 6 : -4),
        14,
        3,
      )
    else
      g.fillRect(
        Math.round(c.x) - (c.side === 3 ? 6 : -4),
        Math.round(c.y) - 7,
        3,
        14,
      )
    g.fillStyle = RAMPS.gold[2]
    if (along)
      g.fillRect(
        Math.round(c.x) - 6,
        Math.round(c.y) - (c.side === 0 ? 5 : -5),
        12,
        1,
      )
    else
      g.fillRect(
        Math.round(c.x) - (c.side === 3 ? 5 : -5),
        Math.round(c.y) - 6,
        1,
        12,
      )
    const sideways = c.side % 2 === 1
    const sprite = sideways
      ? charging
        ? CAMERA_SPRITES.sideHot
        : CAMERA_SPRITES.side
      : charging
        ? CAMERA_SPRITES.downHot
        : CAMERA_SPRITES.down
    const sx = c.x + (c.side === 1 ? 1 : c.side === 3 ? -1 : 0)
    const sy = c.y + (c.side === 0 ? -1 : c.side === 2 ? 1 : 0)
    drawSprite(g, sprite, sx, sy, {
      flipX: c.side === 1,
      flipY: c.side === 2,
    })
    if (charging && Math.floor(this.tick / 4) % 2 === 0) {
      g.fillStyle = RAMPS.ember[4]
      g.fillRect(Math.round(sx) - 2, Math.round(sy) - 2, 2, 2)
    }
  }

  /** The mirror clone: Sparkle in glitch colours, with a scanline flicker. */
  private renderClone(g: CanvasRenderingContext2D, c: Crasher) {
    const moving = Math.abs(c.vx) + Math.abs(c.vy) > 0.1
    const aim = moving ? { x: c.vx, y: c.vy } : { x: 0, y: 1 }
    const view = viewOf(aim)
    const frame = moving ? 1 + (Math.floor(c.t / 7) % 2) : 0
    const glitch = Math.floor(this.tick / 3) % 7 === 0 ? 1 : 0
    glow(g, c.x, c.y, 12, RAMPS.purple[3], 0.3)
    drawSprite(
      g,
      CLONE_SPRITES[view][frame]!,
      Math.round(c.x) + glitch,
      Math.round(c.y) + 8,
      {
        anchor: 'feet',
        flipX: aim.x < 0,
        alpha: 0.85,
      },
    )
    g.fillStyle = rgba(RAMPS.teal[4], 0.35)
    const line = Math.round(c.y) - 6 + (this.tick % 14)
    g.fillRect(Math.round(c.x) - 6, line, 12, 1)
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
    const halos: Record<Streamer['style'], string> = {
      streamer: RAMPS.pink[3],
      flash: RAMPS.gold[4],
      spark: RAMPS.ember[3],
      shard: RAMPS.pink[3],
      bubble: RAMPS.water[3],
    }
    g.save()
    g.globalCompositeOperation = 'lighter'
    g.globalAlpha = 0.25
    for (const s of this.streamers)
      if (s.style === 'streamer' || s.style === 'shard')
        halo(g, s.x, s.y, 4, halos[s.style])
    g.restore()
    for (const s of this.streamers)
      if (s.style === 'flash' || s.style === 'spark')
        glow(g, s.x, s.y, 9, halos[s.style], 0.55)
    const flutter = Math.floor(this.tick / 4) % 2
    for (const s of this.streamers) {
      if (s.style === 'bubble') {
        shadedOrb(g, s.x, s.y, 3, RAMPS.water, { outline: RAMPS.water[1] })
        continue
      }
      const sprite =
        s.style === 'flash'
          ? FLASH_SPRITES[flutter]!
          : s.style === 'spark'
            ? SPARK_SPRITES[flutter]!
            : STREAMER_SPRITES[flutter]!
      drawSprite(g, sprite, s.x, s.y)
    }
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
      if (s.kind === 'rocket') {
        // A bubble rocket: a heavy water bubble trailing smaller ones.
        glow(g, s.x, s.y, 9, RAMPS.water[3], 0.45)
        for (let k = 1; k <= 3; k++)
          shadedOrb(
            g,
            s.x - s.vx * k * 2.2,
            s.y - s.vy * k * 2.2,
            2 - k * 0.4,
            RAMPS.water,
            { outline: null, glint: false },
          )
        shadedOrb(g, s.x, s.y, 3.5, RAMPS.water)
        continue
      }
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
    if (b.kind !== 'float') {
      drawBoss(g, b, this.tick)
      return
    }
    const rock = b.shift > 0 ? Math.round(Math.sin(b.shift / 2) * 2) : 0
    const x = Math.round(b.x) + rock
    const y = Math.round(b.y)
    const sprite =
      b.flash > 0 || (b.shift > 0 && Math.floor(b.shift / 4) % 2)
        ? FLOAT_FLASH
        : FLOAT_SPRITES[Math.floor(b.t / 8) % 2]!
    drawSprite(g, sprite, x - FLOAT_CX - 1, y - FLOAT_CY - 1, {
      anchor: 'topleft',
    })
    // Phase 1: the candles are cold wicks. Phase 2: lit, flaring hot before each volley.
    const until = this.candleClock(b)
    const charge = BOSS.float.candleCharge
    const charging = b.phase === 2 && b.shift === 0 && until <= charge
    const k = charging ? 1 - until / charge : 0
    for (let i = 0; i < 4; i++) {
      const fx = x - 15 + i * 10
      const fy = y - 31
      if (b.phase === 1) {
        g.fillStyle = INK
        g.fillRect(fx, fy + 1, 2, 3)
        g.fillStyle = RAMPS.steel[2]
        g.fillRect(fx, fy + 2, 1, 1)
        continue
      }
      const flick = Math.floor(this.tick / 5 + i) % 2
      // A teardrop flame: ink edge, ember skin, gold heart; it stretches as the volley nears.
      const tall = 4 + flick + Math.round(k * 5)
      const top = fy + 1 - tall
      glow(
        g,
        fx + 1,
        fy - 2,
        7 + k * 8,
        charging ? RAMPS.ember[3] : RAMPS.gold[3],
        0.45 + k * 0.35,
      )
      g.fillStyle = INK
      g.fillRect(fx - 2, top + 1, 6, tall + 1)
      g.fillRect(fx - 1, top - 1, 4, tall + 3)
      g.fillStyle = charging && k > 0.5 ? RAMPS.ember[2] : RAMPS.ember[3]
      g.fillRect(fx - 1, top + 2, 4, tall - 1)
      g.fillRect(fx, top, 2, tall + 1)
      g.fillStyle = RAMPS.gold[3]
      g.fillRect(fx, top + 2, 2, tall - 2)
      g.fillStyle = k > 0.6 ? '#ffffff' : RAMPS.gold[4]
      g.fillRect(fx, top + tall - 2, 2, 2)
      g.fillStyle = RAMPS.gold[4]
      g.fillRect(fx + (flick ? 1 : 0), top, 1, 1)
    }
    if (b.phase === 2) {
      // The cake is cross now: its eyes glow.
      glow(g, x - 8, y - 15, 5, RAMPS.ember[3], 0.6)
      glow(g, x + 9, y - 15, 5, RAMPS.ember[3], 0.6)
    }
    gauge(
      g,
      x - 40,
      y - 37,
      80,
      3,
      b.hp / b.maxHp,
      b.phase === 2 ? RAMPS.ember : RAMPS.leaf,
    )
    // The phase mark on the gauge: past it, the candles light.
    g.fillStyle = INK
    g.fillRect(x - 40 + Math.round(80 * b.phase2At), y - 38, 1, 5)
  }

  private renderPrize(g: CanvasRenderingContext2D, p: Prize) {
    if (!p.pedestal && p.life < 90 && Math.floor(this.tick / 5) % 2) return
    const bob = Math.round(Math.sin((this.tick + p.x) / 9) * 1.5)
    const x = p.x
    const y = p.y - 1 + bob - (p.pedestal ? 4 : 0) - (p.lift || 0) * 26
    glow(
      g,
      p.x,
      y,
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
        shadedOrb(g, x, y, 5.5, POWERS[p.kind].ramp)
        drawText(g, POWERS[p.kind].letter, x + 1, y - 3, {
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

  /** Audience gifts in flight, with a ring on the floor where each will land. */
  private renderTosses(g: CanvasRenderingContext2D) {
    for (const toss of this.tosses) {
      const u = toss.t / toss.dur
      const x = toss.x0 + (toss.x1 - toss.x0) * u
      const y = toss.y0 + (toss.y1 - toss.y0) * u - Math.sin(u * Math.PI) * 60
      g.strokeStyle = rgba(RAMPS.leaf[4], 0.5 + 0.4 * u)
      g.lineWidth = 1
      g.beginPath()
      g.ellipse(toss.x1, toss.y1 + 5, 7, 3, 0, 0, Math.PI * 2)
      g.stroke()
      dropShadow(g, toss.x1, toss.y1 + 5, 3 + u * 4, 1 + u, 0.35)
      if (isPower(toss.kind)) shadedOrb(g, x, y, 4.5, POWERS[toss.kind].ramp)
      else drawSprite(g, CASH_SPRITE, x, y)
    }
  }

  /** Foam Party: soap suds on the floor and bubbles drifting up. */
  private renderFoam(g: CanvasRenderingContext2D) {
    for (const s of FOAM_SUDS) {
      g.fillStyle = rgba(RAMPS.cream[4], 0.18)
      g.beginPath()
      g.ellipse(s.x, s.y, s.r * 2, s.r * 1.2, 0, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = rgba('#ffffff', 0.3)
      g.beginPath()
      g.ellipse(
        s.x - s.r * 0.6,
        s.y - s.r * 0.3,
        s.r * 0.7,
        s.r * 0.4,
        0,
        0,
        Math.PI * 2,
      )
      g.fill()
    }
    for (let i = 0; i < 14; i++) {
      const s = FOAM_SUDS[i]!
      const rise = (this.tick * 0.4 + i * 37) % 120
      const bx = s.x + Math.sin((this.tick + i * 20) / 18) * 4
      const by = s.y - rise
      if (by < TOP + 2) continue
      const r = 1.5 + (i % 3)
      g.strokeStyle = rgba(RAMPS.sky[4], 0.7 * (1 - rise / 120))
      g.lineWidth = 1
      g.beginPath()
      g.arc(bx, by, r, 0, Math.PI * 2)
      g.stroke()
      g.fillStyle = rgba('#ffffff', 0.8 * (1 - rise / 120))
      g.fillRect(Math.round(bx - r / 2), Math.round(by - r / 2), 1, 1)
    }
  }

  /** Lights Out: the floor goes dark in stepped bands except under the spotlights. */
  private renderDarkness(g: CanvasRenderingContext2D) {
    const lights: Array<{ x: number; y: number; r: number }> = [
      { x: this.px, y: this.py, r: 36 },
      ...this.followSpots().map((s) => ({ ...s, r: 30 })),
      ...this.prizes.map((p) => ({ x: p.x, y: p.y, r: 11 })),
      ...this.pickups.map((t) => ({ x: t.x, y: t.y, r: 14 })),
      ...(this.exitsOpen
        ? this.exits.map((e) => ({ x: e.x, y: e.y, r: 22 }))
        : []),
    ]
    for (const [alpha, grow] of [
      [0.55, 1.3],
      [0.5, 1],
    ] as const) {
      g.save()
      g.fillStyle = rgba(INK, alpha)
      g.beginPath()
      g.rect(LEFT, TOP, RIGHT - LEFT, BOTTOM - TOP)
      for (const l of lights) {
        const r = l.r * grow
        g.moveTo(l.x + r, l.y)
        g.ellipse(l.x, l.y, r, r * 0.8, 0, 0, Math.PI * 2)
      }
      g.fill('evenodd')
      g.restore()
    }
  }

  /** In the dark, crashers' eyes still glint. */
  private renderEyes(g: CanvasRenderingContext2D) {
    for (const c of this.crashers) {
      if (Math.floor((this.tick + c.t) / 50) % 6 === 0) continue
      g.fillStyle = RAMPS.gold[4]
      g.fillRect(Math.round(c.x) - 3, Math.round(c.y) - 5, 2, 1)
      g.fillRect(Math.round(c.x) + 1, Math.round(c.y) - 5, 2, 1)
    }
  }

  /** Confetti Storm: a blizzard of paper over the whole set. */
  private renderStorm(g: CanvasRenderingContext2D) {
    // A haze in bands, thickest at the top and bottom of the set.
    for (let y = TOP; y < BOTTOM; y += 12) {
      const u = Math.abs((y - TOP) / (BOTTOM - TOP) - 0.5) * 2
      g.fillStyle = rgba(RAMPS.purple[4], 0.12 + u * 0.16)
      g.fillRect(LEFT, y, RIGHT - LEFT, Math.min(12, BOTTOM - y))
    }
    for (const f of STORM_FLAKES) {
      const y = ((f.y + this.tick * f.speed * 1.4) % (H - HUD)) + HUD
      const x = (f.x + Math.sin(this.tick / 25 + f.sway) * 10 + W) % W
      const ramp = tintOf(CONFETTI[f.hue]!)
      const flat = Math.floor((this.tick + f.sway * 10) / 6) % 2
      g.fillStyle = ramp[flat ? 3 : 2]
      if (f.big)
        g.fillRect(Math.round(x), Math.round(y), flat ? 4 : 3, flat ? 3 : 1)
      else g.fillRect(Math.round(x), Math.round(y), flat ? 2 : 3, flat ? 2 : 1)
    }
  }

  /** The studio audience over the bottom wall: bobbing along, arms up on big moments. */
  private renderAudience(g: CanvasRenderingContext2D) {
    const cheering = this.audienceCheer > 0 || this.has('audience')
    for (let i = 0, x = 16; x < W - 10; i++, x += 12) {
      if (Math.abs(x - CX) < DOOR + 6) continue
      const sprites = CROWD[i % CROWD.length]!
      const beat = Math.floor((this.tick + i * 7) / (cheering ? 7 : 20)) % 3
      const up = cheering ? beat !== 2 : beat === 0 && i % 4 === 0
      drawSprite(g, sprites[up ? 1 : 0]!, x, H + 2 - (up ? 2 : 0), {
        anchor: 'feet',
      })
      if (this.camFlash > 0 && i % 5 === this.tick % 5)
        glow(g, x, H - 4, 8, '#ffffff', 0.7)
    }
  }

  /** The APPLAUSE sign down the left wall: it lights up whenever a crasher is cheered. */
  private renderApplause(g: CanvasRenderingContext2D) {
    const lit = this.applause > 0 && Math.floor(this.applause / 4) % 2 === 0
    const top = TOP + 4
    g.fillStyle = INK
    g.fillRect(1, top - 2, 8, 'APPLAUSE'.length * 8 + 3)
    g.fillStyle = lit ? RAMPS.ember[1] : RAMPS.night[1]
    g.fillRect(2, top - 1, 6, 'APPLAUSE'.length * 8 + 1)
    if (lit) glow(g, 5, top + 30, 26, RAMPS.ember[3], 0.35)
    'APPLAUSE'.split('').forEach((letter, i) => {
      drawText(g, letter, 3, top + i * 8, {
        color: lit ? RAMPS.gold[4] : RAMPS.ember[1],
      })
    })
  }

  /** The ratings meter up the right wall: a thermometer, tier marks, and the tier's colour. */
  private renderRatings(g: CanvasRenderingContext2D) {
    const x = RIGHT + 2
    const top = TOP + 4
    const height = CY - DOOR - 10 - top
    const tier = TIERS[tierOf(this.ratings)]!
    g.fillStyle = INK
    g.fillRect(x - 1, top - 1, 8, height + 2)
    g.fillStyle = RAMPS.night[1]
    g.fillRect(x, top, 6, height)
    const fill = Math.round((height * this.ratings) / RATINGS.max)
    const ramp = tintOf(tier.colour)
    bandedGradient(
      g,
      x,
      top + height - fill,
      6,
      fill,
      [ramp[3], ramp[2], ramp[1]],
      2,
    )
    g.fillStyle = rgba('#ffffff', 0.5)
    g.fillRect(x + 1, top + height - fill, 1, fill)
    for (const t of TIERS.slice(1)) {
      const y = top + height - Math.round((height * t.from) / RATINGS.max)
      g.fillStyle = INK
      g.fillRect(x - 1, y, 3, 1)
      g.fillRect(x + 4, y, 3, 1)
    }
    if (tierOf(this.ratings) === TIERS.length - 1)
      glow(
        g,
        x + 3,
        top + 6,
        12,
        tier.colour,
        0.4 + 0.2 * Math.sin(this.tick / 6),
      )
  }

  /** The host (or LENS) cuts in at the bottom of the screen with a speech panel. */
  private renderCutIn(g: CanvasRenderingContext2D) {
    const cut = this.cutIn
    if (!cut) return
    const age = CUT_TICKS - cut.ticks
    const slide = Math.min(1, age / 8, cut.ticks / 8)
    const host = cut.voice === 'host'
    const rows = wrapLine(cut.text, 28)
    const width = 44 + Math.max(...rows.map((r) => measureText(r))) + 8
    const height = 38
    const y = BOTTOM - height - 4
    const x = host
      ? Math.round(LEFT + 2 - (1 - slide) * (width + 20))
      : Math.round(RIGHT - 2 - width + (1 - slide) * (width + 20))
    hudPanel(g, x, y, width, height, host ? RAMPS.purple : RAMPS.teal)
    // The portrait in its own little monitor.
    g.fillStyle = INK
    g.fillRect(x + 3, y + 3, 36, height - 6)
    bandedGradient(
      g,
      x + 4,
      y + 4,
      34,
      height - 8,
      [RAMPS.night[2], RAMPS.night[0]],
      3,
    )
    const talking = age < CUT_TICKS - 40 && Math.floor(age / 6) % 2 === 1
    const portrait = host ? HOST_PORTRAIT : COHOST_PORTRAIT
    drawSprite(g, portrait[talking ? 1 : 0]!, x + 21, y + height / 2 + 1)
    drawText(g, host ? HOST_NAME : COHOST_NAME, x + 44, y + 4, {
      color: host ? RAMPS.gold[4] : RAMPS.teal[4],
      outline: INK,
    })
    rows.slice(0, 3).forEach((row, i) => {
      drawText(g, row, x + 44, y + 14 + i * 8, {
        color: '#ffffff',
        shadow: INK,
      })
    })
  }

  /** A tally row's icon. */
  private tallyIcon(
    g: CanvasRenderingContext2D,
    icon: TallyRow['icon'],
    x: number,
    y: number,
  ) {
    switch (icon) {
      case 'cash':
        drawSprite(g, CASH_SPRITE, x, y)
        break
      case 'toaster':
        drawSprite(g, TOASTER_SPRITE, x, y)
        break
      case 'car':
        drawSprite(g, CAR_SPRITE, x, y)
        break
      case 'ticket':
        drawSprite(g, TICKET_SPRITE, x, y)
        break
      case 'ratings':
        shadedOrb(g, x, y, 5, tintOf(TIERS[this.peakTier]!.colour))
        break
      case 'chain':
        shadedOrb(g, x, y, 5, RAMPS.pink)
        break
      case 'bonus':
        glow(g, x, y, 10, RAMPS.gold[3], 0.5)
        starPath(g, x, y, 7, 3)
        g.fillStyle = RAMPS.gold[3]
        g.fill()
        break
      case 'medal':
        drawMedal(g, x, y + 2, 'haul', true, 4)
        break
    }
  }

  /** Rows counting up one after another, `progress` rows' worth so far. */
  private renderRows(
    g: CanvasRenderingContext2D,
    rows: readonly TallyRow[],
    progress: number,
    top: number,
    gap = 22,
  ) {
    rows.forEach((row, i) => {
      if (progress < i) return
      const y = top + i * gap
      const k = Math.min(1, progress - i)
      const count = Math.floor(row.count * k)
      bevel(g, 30, y - 8, W - 60, 18, RAMPS.purple, { depth: 1 })
      this.tallyIcon(g, row.icon, 48, y + 1)
      drawText(g, row.label, 66, y - 2, { color: '#ffffff', shadow: INK })
      if (row.icon !== 'ratings' && (row.icon !== 'bonus' || !row.points))
        drawText(g, `X ${count}`, 200, y - 2, {
          align: 'right',
          color: RAMPS.gold[4],
          shadow: INK,
        })
      if (row.points)
        drawText(g, String(Math.floor(row.points * k)), W - 38, y - 2, {
          align: 'right',
          color: k >= 1 ? RAMPS.leaf[4] : RAMPS.cream[3],
          shadow: INK,
        })
    })
  }

  /** Between episodes: the haul counted up row by row. */
  private renderTally(g: CanvasRenderingContext2D) {
    const tally = this.tally!
    drawText(g, 'THE HAUL', CX, 12, {
      scale: 2,
      align: 'center',
      color: RAMPS.gold[4],
      outline: INK,
      shadow: RAMPS.purple[1],
    })
    drawText(g, `${this.billing()}: ${this.episode.title}`, CX, 32, {
      align: 'center',
      color: RAMPS.cream[3],
      shadow: INK,
    })
    const long = tally.rows.length > 6
    this.renderRows(
      g,
      tally.rows,
      tally.ticks / TALLY_ROW,
      long ? 50 : 54,
      long ? 20 : 22,
    )
    drawText(g, `SCORE ${this.score}`, CX, H - 50, {
      scale: 2,
      align: 'center',
      color: '#ffffff',
      outline: INK,
    })
    if (Math.floor(this.tick / 20) % 2)
      drawText(g, 'A  SKIP', CX, H - 30, {
        align: 'center',
        color: RAMPS.gold[3],
      })
  }

  /** The Prize Swap: what's in hand, and what it trades for. */
  private renderSwap(g: CanvasRenderingContext2D) {
    const swap = this.swap!
    drawText(g, 'PRIZE SWAP', CX, 10, {
      scale: 2,
      align: 'center',
      color: RAMPS.gold[4],
      outline: INK,
      shadow: RAMPS.purple[1],
    })
    // In hand.
    const hand: Array<[TallyRow['icon'], number]> = [
      ['cash', this.wallet.cash],
      ['toaster', this.wallet.toaster],
      ['car', this.wallet.car],
      ['ticket', this.tickets.length],
    ]
    hudPanel(g, 30, 30, W - 60, 22)
    hand.forEach(([icon, n], i) => {
      const x = 52 + i * 66
      this.tallyIcon(g, icon, x, 41)
      drawText(g, `X${n}`, x + 14, 38, { color: '#ffffff', shadow: INK })
    })
    const offers = [...SWAP_OFFERS, null]
    offers.forEach((offer, i) => {
      const y = 62 + i * 30
      const chosen = i === swap.cursor
      const ok = offer ? this.canBuy(offer.id) : true
      if (chosen) glow(g, CX, y + 11, 90, RAMPS.leaf[3], 0.25)
      bevel(
        g,
        30,
        y,
        W - 60,
        24,
        chosen ? RAMPS.leaf : ok ? RAMPS.purple : DIM_RAMP,
        {
          depth: 1,
        },
      )
      if (!offer) {
        drawText(g, 'DONE: ON WITH THE SHOW', CX, y + 9, {
          align: 'center',
          color: '#ffffff',
          shadow: INK,
        })
        return
      }
      drawText(g, offer.title, 40, y + 4, {
        color: ok ? '#ffffff' : RAMPS.night[4],
        shadow: INK,
      })
      drawText(g, offer.blurb, 40, y + 14, {
        color: ok ? RAMPS.cream[3] : RAMPS.night[4],
      })
      const [icon, n] = (
        Object.entries(offer.cost) as Array<[TallyRow['icon'], number]>
      )[0]!
      this.tallyIcon(g, icon, W - 70, y + 12)
      drawText(g, `X${n}`, W - 56, y + 9, {
        color: ok ? RAMPS.gold[4] : RAMPS.night[4],
        shadow: INK,
      })
      const times = swap.bought.filter((b) => b === offer.id).length
      if (times) drawSprite(g, CHECK_TICK, W - 38, y + 12)
    })
    const perks: string[] = []
    if (this.perks.power)
      perks.push(`START WITH ${POWERS[this.perks.power].name}`)
    if (this.perks.clock) perks.push(`+${this.perks.clock}S CLOCK`)
    if (this.perks.secret) perks.push('A SECRET REVEALED')
    drawText(g, perks.join('  ') || 'ARROWS PICK  A TRADE', CX, H - 14, {
      align: 'center',
      color: RAMPS.teal[4],
      shadow: INK,
    })
  }

  /** Game over: the season's haul counts up, the way the episodes' did. */
  private renderGameOver(g: CanvasRenderingContext2D) {
    g.fillStyle = rgba(INK, Math.min(0.75, this.overTicks / 60))
    g.fillRect(0, 0, W, H)
    drawText(g, 'GAME OVER', CX, 16, {
      scale: 2,
      align: 'center',
      color: '#ffffff',
      outline: INK,
      shadow: RAMPS.purple[1],
    })
    drawText(
      g,
      this.mode === 'marathon' ? 'THE MARATHON HAUL' : 'THE SEASON HAUL',
      CX,
      36,
      {
        align: 'center',
        color: RAMPS.gold[3],
        shadow: INK,
      },
    )
    if (this.finalRows)
      this.renderRows(
        g,
        this.finalRows,
        Math.max(0, (this.overTicks - 40) / 30),
        58,
      )
    drawText(g, `FINAL SCORE ${this.score}`, CX, H - 34, {
      scale: 2,
      align: 'center',
      color: RAMPS.gold[4],
      outline: INK,
    })
  }

  /** Sudden Death: the set's edge pulses red. */
  private renderSuddenDeath(g: CanvasRenderingContext2D) {
    const a = 0.3 + 0.2 * Math.sin(this.tick / 8)
    g.fillStyle = rgba(RAMPS.ember[2], a)
    g.fillRect(LEFT, TOP, RIGHT - LEFT, 2)
    g.fillRect(LEFT, BOTTOM - 2, RIGHT - LEFT, 2)
    g.fillRect(LEFT, TOP, 2, BOTTOM - TOP)
    g.fillRect(RIGHT - 2, TOP, 2, BOTTOM - TOP)
  }

  private renderBanner(g: CanvasRenderingContext2D) {
    if (!this.banner) return
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

  /** The power-up that loads the cannon, if any (the laser beats rockets beats foam). */
  private cannon(): PowerKind | null {
    const p = this.powers
    return p.laser > 0
      ? 'laser'
      : p.rockets > 0
        ? 'rockets'
        : p.foamgun > 0
          ? 'foamgun'
          : null
  }

  /**
   * Every live power-up gets a chip on the top wall, either side of the door: its letter and a
   * draining gauge, blinking in its last two seconds.
   */
  private renderPowerChips(g: CanvasRenderingContext2D) {
    const live = POWER_KINDS.filter((kind) => this.powers[kind] > 0)
    live.forEach((kind, i) => {
      const x = i < 5 ? 12 + i * 25 : CX + DOOR + 6 + (i - 5) * 25
      const y = HUD + 1
      const left = this.powers[kind]
      const power = POWERS[kind]
      if (left < 120 && Math.floor(this.tick / 5) % 2) return
      g.fillStyle = INK
      g.fillRect(x - 1, y - 1, 25, 10)
      g.fillStyle = power.ramp[0]
      g.fillRect(x, y, 23, 8)
      g.fillStyle = power.ramp[2]
      g.fillRect(x, y, 23, 1)
      drawText(g, power.letter, x + 2, y + 1, { color: power.ramp[4] })
      gauge(g, x + 9, y + 3, 12, 2, left / power.cap, power.ramp)
    })
  }

  private renderHud(g: CanvasRenderingContext2D) {
    // Score.
    hudPanel(g, 2, 1, 90, 15)
    const digits = String(this.score).padStart(7, '0')
    if (digits.length <= 7)
      drawText(g, digits, 6, 2, {
        scale: 2,
        color: RAMPS.gold[3],
        shadow: INK,
      })
    else
      // Past ten million it drops to the small font, so it still fits its panel.
      drawText(g, digits, 47, 5, {
        align: 'center',
        color: RAMPS.gold[3],
        shadow: INK,
      })
    // The cannon: what it is loaded with now (confetti, rockets, the laser or foam).
    hudPanel(g, 96, 1, 26, 15)
    const gun = this.cannon()
    const gunRamp = gun ? POWERS[gun].ramp : RAMPS.pink
    if (this.fireCooldown > 0) glow(g, 109, 8, 9, gunRamp[3], 0.4)
    shadedOrb(g, 109, 8, 5, gunRamp)
    drawText(g, gun ? POWERS[gun].letter : '*', 110, 5, {
      align: 'center',
      color: INK,
    })
    this.renderPowerChips(g)
    // The host's countdown.
    const tx = 126
    hudPanel(g, tx, 1, 60, 15)
    const seconds = Math.ceil(this.roomTimer / 60)
    const urgent = seconds <= 10 && Math.floor(this.tick / 10) % 2 === 0
    if (seconds <= 10)
      glow(g, tx + 46, 9, 20, RAMPS.ember[2], urgent ? 0.5 : 0.25)
    drawText(g, 'TIME', tx + 4, 3, { color: RAMPS.cream[3], shadow: INK })
    gauge(
      g,
      tx + 4,
      12,
      23,
      2,
      this.roomTimer / this.roomTicks,
      seconds <= 10 ? RAMPS.ember : RAMPS.gold,
    )
    drawSprite(g, STOPWATCH_SPRITE, tx + 33, 8)
    drawText(g, String(Math.max(0, seconds)), tx + 58, 2, {
      scale: 2,
      align: 'right',
      color: urgent ? RAMPS.ember[3] : RAMPS.gold[4],
      shadow: INK,
    })
    // Contestants in reserve.
    hudPanel(g, 190, 1, 42, 15)
    for (let i = 0; i < 4; i++) {
      drawSprite(
        g,
        i < this.lives - 1 ? LIFE_SPRITE : LIFE_EMPTY,
        197 + i * 9,
        9,
      )
    }
    // Golden tickets held.
    hudPanel(g, 236, 1, 26, 15)
    drawSprite(g, this.tickets.length ? TICKET_ICON : TICKET_ICON_EMPTY, 244, 9)
    drawText(g, String(this.tickets.length), 259, 5, {
      align: 'right',
      color: this.tickets.length ? RAMPS.gold[4] : RAMPS.night[3],
      outline: INK,
    })
    // High score and studio.
    hudPanel(g, 266, 1, 52, 15)
    const hi = String(Math.max(this.hiScore, this.score))
    if (measureText(`HI ${hi}`) <= 46)
      drawText(g, 'HI', 270, 2, { color: RAMPS.pink[2], shadow: INK })
    drawText(g, hi, W - 5, 2, {
      align: 'right',
      color: RAMPS.pink[3],
      shadow: INK,
    })
    drawText(g, `STUDIO ${this.level}`, W - 5, 9, {
      align: 'right',
      color: RAMPS.teal[3],
      shadow: INK,
    })
    // The room's modifier and sponsor challenge, tagged on the floor's top edge (not over the
    // ending and its credits).
    if (this.ending) return
    const tags: Array<[string, string]> = []
    if (this.script.remixed) tags.push(['REMIX', RAMPS.purple[3]])
    if (this.modifier)
      tags.push([MODIFIERS[this.modifier].title, RAMPS.pink[3]])
    if (this.script.challenge && !this.cleared) {
      const failed =
        this.script.challenge === 'no-hit' ? this.hit : this.prizeMissed
      tags.push([
        this.script.challenge === 'no-hit'
          ? 'NO-HIT CHALLENGE'
          : 'GRAB EVERY PRIZE',
        failed ? RAMPS.night[4] : RAMPS.gold[4],
      ])
    }
    const tier = TIERS[tierOf(this.ratings)]!
    tags.push([`${tier.name} X${tier.multiplier}`, tier.colour])
    if (this.chain >= 3)
      tags.push([
        `CHAIN ${this.chain}  X${chainMultiplier(this.chain)}`,
        RAMPS.pink[3],
      ])
    let ty = TOP + 3
    for (const [text, colour] of tags) {
      drawText(g, text, LEFT + 6, ty, { color: colour, outline: INK })
      ty += 9
    }
    this.renderBanner(g)
    this.renderMedalToast(g)
  }

  /** The medals won in the room just left: a strip along the floor's foot. */
  private renderMedalToast(g: CanvasRenderingContext2D) {
    const toast = this.medalToast
    if (!toast) return
    const step = 80
    const w = toast.won.length * step + 6
    const x0 = Math.round(CX - w / 2)
    const rise = Math.min(1, (100 - toast.ticks) / 10)
    const y = Math.round(BOTTOM - 8 - 30 * rise)
    hudPanel(g, x0, y, w, 28, RAMPS.night)
    toast.won.forEach((m, i) => {
      const x = x0 + 6 + i * step
      const fresh = toast.fresh.includes(m)
      if (fresh) glow(g, x + 7, y + 14, 12, MEDALS[m].ramp[3], 0.5)
      drawMedal(g, x + 7, y + 17, m, true, 4)
      drawText(g, MEDALS[m].title, x + 16, y + 5, {
        color: MEDALS[m].ramp[3],
        outline: INK,
      })
      drawText(g, fresh ? 'NEW!' : 'AGAIN', x + 16, y + 15, {
        color: fresh ? RAMPS.gold[4] : RAMPS.cream[2],
        shadow: INK,
      })
    })
  }
}

const PRIZE_NAMES = {
  cash: 'CASH!',
  toaster: 'A TOASTER!',
  car: 'A NEW CAR!',
  ...Object.fromEntries(
    POWER_KINDS.map((kind) => [kind, `${POWERS[kind].name}!`]),
  ),
} as Record<PrizeKind, string>

const prizeShowPanic: ArcadeGameModule = {
  create: (options) => new PrizeShowPanic(options),
}

export const create = prizeShowPanic.create
export default prizeShowPanic
