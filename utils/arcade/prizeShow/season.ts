// /utils/arcade/prizeShow/season.ts
//
// Prize Show Panic's broadcast season (conductor kr-arcade t-026, depth-pass/ASSESSMENT.md section 2).
// The season is data: episodes are maps of rooms on a grid, every room runs a script (which doors
// open when, which crashers come through, what props sit on the floor), and the game in
// games/prizeShowPanic.ts only plays what is written here. Episodes 1-3 are authored (Opening Night,
// Cooking Showdown, Countdown Concert, each on its own set with its own hazards and bosses); episode
// 4 and the Live Finale are appended to SEASON by a later slice. After the last authored episode the
// season loops with harder curves (LOOP_CURVES) and rolled room modifiers, so a run still ends.
//
// Crashers come from the roster (roster.ts), power-ups from the arsenal (arsenal.ts) and bosses from
// bosses.ts. Opening Night's `encore` waves remix later episodes' crashers into its rooms on later
// loops (the Galaxy kinds debut there until episode 4 is authored).
//
// Card text is drawn in the arcade's pixel font: capitals, digits and . , ! ? - + = : / ( ) ' only.

import { levelCurve } from '../curve'
import type { CurveSpec } from '../curve'
import type { PowerKind } from './arsenal'
import { CRASHER_KINDS } from './roster'
import type { CrasherKind } from './roster'

export type { CrasherKind } from './roster'
export type PrizeKind = 'cash' | 'toaster' | 'car' | PowerKind

/** Door sides, clockwise from the top: 0 top, 1 right, 2 bottom, 3 left. */
export type Side = 0 | 1 | 2 | 3

export type RoomType =
  | 'swarm'
  | 'mines'
  | 'lights'
  | 'cameras'
  | 'speed'
  | 'vault'
  | 'ambush'
  | 'conga'
  | 'sponsor'
  | 'secret'
  | 'boss'
  // The later sets' trap rooms: the kitchen's hot plates, conveyor counters and flour, the
  // concert's speaker stacks and mosh pits.
  | 'hotplates'
  | 'conveyor'
  | 'flour'
  | 'speakers'
  | 'moshpit'

/** What the map says a door leads to. */
export type MapIcon = 'swarm' | 'vault' | 'trap' | 'sponsor' | 'boss' | 'secret'

export const ROOM_ICON: Record<RoomType, MapIcon> = {
  swarm: 'swarm',
  speed: 'swarm',
  ambush: 'swarm',
  conga: 'swarm',
  mines: 'trap',
  lights: 'trap',
  cameras: 'trap',
  hotplates: 'trap',
  conveyor: 'trap',
  flour: 'trap',
  speakers: 'trap',
  moshpit: 'trap',
  vault: 'vault',
  sponsor: 'sponsor',
  secret: 'secret',
  boss: 'boss',
}

export const ICON_LABEL: Record<MapIcon, string> = {
  swarm: 'SWARM',
  vault: 'PRIZE VAULT',
  trap: 'TRAP',
  sponsor: 'SPONSOR CHALLENGE',
  boss: 'BOSS',
  secret: 'SECRET',
}

/** The best prize a room offers, as the map's reward icon. */
export type Reward = 'cash' | 'toaster' | 'car' | 'ticket'
export const REWARD_RANK: Record<Reward, number> = {
  cash: 1,
  toaster: 2,
  car: 3,
  ticket: 4,
}

/**
 * Which doors a wave comes through, relative to the door Sparkle came in by: `far` is the one
 * opposite, `flanks` the two either side, `behind` the entry itself, `all` four at once, and `any`
 * one door rolled with the game's rng (never the entry).
 */
export type DoorPick = 'far' | 'flanks' | 'behind' | 'all' | 'any'

export type Wave = {
  /** Ticks after the room starts. */
  at: number
  kind: CrasherKind
  /** Crashers per door: a grabber gang's size, or a conga line's length. */
  count: number
  doors: DoorPick
  /** Repeat the wave this many times in all (default 1)... */
  times?: number
  /** ...this many ticks apart. */
  every?: number
  /** A mini-boss: later loops never bring more of them. */
  fixed?: boolean
}

/** Waves a room adds from a given loop on (the later episodes' crashers, debuting in Encores). */
export type Encore = { loop: number; waves: readonly Wave[] }

/**
 * A spotlight on the rig: each beat it swings (dark) to its next mark across `swing`, shows where it
 * will land, then is hot for `on` ticks.
 */
export type BeamProp = {
  kind: 'beam'
  x: number
  y: number
  /** Resting angle (radians, 0 points right, PI/2 straight down). */
  base: number
  swing: number
  on: number
  off: number
  offset: number
}

export type Prop =
  | { kind: 'cushion' | 'peel'; x: number; y: number }
  | BeamProp
  | {
      /** A camera crane on the wall: a crasher that must be cut like the rest. */
      kind: 'camera'
      /** Which wall, relative to the entry, like a wave's doors. */
      wall: 'far' | 'flanks'
      /** Along the wall, -1..1 either side of its door. */
      at: number
      every: number
      offset: number
    }
  | { kind: 'pedestal'; x: number; y: number; prize: PrizeKind }
  | {
      /** A boom mic: drops on Sparkle's spot after a shadow tells it, and lifts her away a moment. */
      kind: 'boom'
      every: number
      offset: number
    }
  | { kind: 'ticket'; x: number; y: number; id: string }
  | {
      kind: 'crack'
      side: Side
      /** Pixels from the wall's door to the crack. */
      at: number
      /** The secret room behind it (Episode.secrets). */
      secret: string
    }
  | HotPlateProp
  | BeltProp
  | { kind: 'flour'; x: number; y: number; r: number; drift: number }
  | SpeakerProp
  | { kind: 'mosh'; x: number; y: number; r: number; spin: 1 | -1 }

/**
 * A hot plate on the kitchen floor (x, y its top-left corner, w by h): cold, then it glows (the
 * tell), then it sizzles anyone standing on it. One cycle every `every` ticks, `offset` in.
 */
export type HotPlateProp = {
  kind: 'hotplate'
  x: number
  y: number
  w: number
  h: number
  every: number
  offset: number
}

/** A conveyor counter: everyone on it (Sparkle, crashers, prizes) is carried toward `dir`. */
export type BeltProp = {
  kind: 'belt'
  x: number
  y: number
  w: number
  h: number
  dir: Side
}

/** A speaker stack: every `beats` beats (from `offset`) it thumps out a bass ring with a gap. */
export type SpeakerProp = {
  kind: 'speaker'
  x: number
  y: number
  beats: number
  offset: number
}

/** The look and sound of an episode's soundstage. */
export type SetId = 'studio' | 'kitchen' | 'concert'

/** Who a boss room brings on (prizeShow/bosses.ts). */
export type BossKind =
  'float' | 'wobble' | 'piecart' | 'souffle' | 'mosh' | 'jumbotron'

export type ModifierId =
  | 'lights-out'
  | 'foam'
  | 'confetti-storm'
  | 'double-time'
  | 'audience'
  | 'sudden-death'

export type BossScript = {
  kind: BossKind
  /** Confetti hits at loop 1; LOOP_CURVES.bossHp scales it. */
  hp: number
  /** Health fraction where the boss changes its act (phase 2). */
  phase2At: number
  title: string
  sub: string
  /** What the host says as it comes on (original writing). */
  line: string
}

export type RoomScript = {
  type: RoomType
  title: string
  tagline: string
  /** The host's countdown, at loop 1. */
  seconds: number
  /** 1 (a stroll) to 5 (a boss), shown as pips on the map. */
  danger: 1 | 2 | 3 | 4 | 5
  reward: Reward
  waves: readonly Wave[]
  /** More waves on later loops. */
  encore?: readonly Encore[]
  props?: readonly Prop[]
  /** Sponsor challenge: what earns the golden ticket `ticket`. */
  challenge?: 'no-hit' | 'all-prizes'
  ticket?: string
  /** A modifier written into the room (later loops roll them as well). */
  modifier?: ModifierId
  boss?: BossScript
  /** Chance a cheered crasher drops a prize (default DROP_RATE). */
  dropRate?: number
  /** Each drop is two prizes (the speed round). */
  doubleDrops?: boolean
  /** Crasher speed factor for the room (default 1). */
  pace?: number
  /**
   * Prize vault and secret rooms: the exits are open from the start, and when the countdown runs
   * out the set closes and Sparkle is ushered on (no contestant lost).
   */
  closes?: boolean
  /** Ticks per beat, for a room that moves to the music (the concert's speakers, strobes, mosh). */
  beat?: number
  /** The lights strobe on the beat: dark between flashes. */
  strobe?: boolean
}

/** The concert's tempo: 120 beats a minute, a beat every 30 ticks (its music loop matches). */
export const CONCERT_BEAT = 30

export type MapRoom = {
  id: string
  col: number
  row: number
  script: RoomScript
  /** Rooms this one's doors lead to: each is a grid neighbour, and the door faces it. */
  exits: readonly string[]
}

export type Episode = {
  number: number
  title: string
  subtitle: string
  set: SetId
  cols: number
  rows: number
  start: string
  midBoss: string
  finale: string
  rooms: readonly MapRoom[]
  /** Off-map rooms behind cracked walls, by id. */
  secrets: Readonly<Record<string, RoomScript>>
}

/** Golden tickets hidden across the whole season, and how many open the Grand Prize Vault. */
export const SEASON_TICKETS = 12
export const VAULT_TICKETS = 10

export const DROP_RATE = 0.12

const s = (seconds: number) => Math.round(seconds * 60)

// --- the modifiers ----------------------------------------------------------------------------

export type Modifier = {
  id: ModifierId
  title: string
  tagline: string
  /** Relative odds when a later loop rolls one. */
  weight: number
}

export const MODIFIERS: Record<ModifierId, Modifier> = {
  'lights-out': {
    id: 'lights-out',
    title: 'LIGHTS OUT',
    tagline: 'ONLY THE SPOTLIGHTS ARE ON',
    weight: 3,
  },
  foam: {
    id: 'foam',
    title: 'FOAM PARTY',
    tagline: 'SLIPPERY FOR EVERYONE',
    weight: 3,
  },
  'confetti-storm': {
    id: 'confetti-storm',
    title: 'CONFETTI STORM',
    tagline: 'YOU CAN HARDLY SEE A THING',
    weight: 3,
  },
  'double-time': {
    id: 'double-time',
    title: 'DOUBLE TIME',
    tagline: 'ALL FASTER, PRIZES DOUBLED',
    weight: 3,
  },
  audience: {
    id: 'audience',
    title: 'AUDIENCE PARTICIPATION',
    tagline: 'THE CROWD THROWS YOU GIFTS',
    weight: 2,
  },
  'sudden-death': {
    id: 'sudden-death',
    title: 'SUDDEN DEATH',
    tagline: 'NO SHIELDS. NO HITS: JACKPOT',
    weight: 2,
  },
}

export const MODIFIER_IDS = Object.keys(MODIFIERS) as ModifierId[]

/** Rooms that never roll a modifier: the breathers and the boss stages. */
const STEADY: readonly RoomType[] = ['vault', 'secret', 'boss']

// --- the loop curves ---------------------------------------------------------------------------

/** How each pass round the season gets harder (loop 1 is the authored show). */
export const LOOP_CURVES = {
  /** Crasher speed factor. */
  speed: { start: 1, step: 0.15, limit: 1.75 },
  /** Crashers per door factor. */
  count: { start: 1, step: 0.35, limit: 5 },
  /** Waves arrive sooner. */
  waveTime: { start: 1, step: -0.1, limit: 0.6 },
  /** Less time on the clock. */
  clock: { start: 1, step: -0.08, limit: 0.62 },
  bossHp: { start: 1, step: 0.6, limit: 8 },
  /** Chance a room rolls a modifier. */
  modifierChance: { start: 0, step: 0.45, limit: 0.85 },
} as const satisfies Record<string, CurveSpec>

export type LoopTuning = { -readonly [K in keyof typeof LOOP_CURVES]: number }

export function loopTuning(loop: number): LoopTuning {
  const out = {} as LoopTuning
  for (const key of Object.keys(LOOP_CURVES) as (keyof LoopTuning)[])
    out[key] = levelCurve(loop, LOOP_CURVES[key])
  return out
}

/**
 * The modifier a room plays under: its written one, or on later loops one rolled from MODIFIERS'
 * weights with the game's rng (one roll for the chance, one for the pick).
 */
export function rollModifier(
  rng: () => number,
  loop: number,
  script: RoomScript,
): ModifierId | null {
  if (script.modifier) return script.modifier
  if (loop <= 1 || STEADY.includes(script.type)) return null
  if (rng() >= loopTuning(loop).modifierChance) return null
  const total = MODIFIER_IDS.reduce((sum, id) => sum + MODIFIERS[id].weight, 0)
  let roll = rng() * total
  for (const id of MODIFIER_IDS) {
    roll -= MODIFIERS[id].weight
    if (roll < 0) return id
  }
  return MODIFIER_IDS[MODIFIER_IDS.length - 1]!
}

// --- reading the map ---------------------------------------------------------------------------

export function roomById(episode: Episode, id: string): MapRoom {
  const room = episode.rooms.find((r) => r.id === id)
  if (!room) throw new Error(`prize show: no room ${id}`)
  return room
}

/** The door side of `from` that faces its grid neighbour `to`, or null if they don't touch. */
export function sideToward(from: MapRoom, to: MapRoom): Side | null {
  const dc = to.col - from.col
  const dr = to.row - from.row
  if (dc === 0 && dr === -1) return 0
  if (dc === 1 && dr === 0) return 1
  if (dc === 0 && dr === 1) return 2
  if (dc === -1 && dr === 0) return 3
  return null
}

export type MapExit = { room: MapRoom; side: Side }

/** Where a room's doors lead, each with the side its door is on. */
export function exitsOf(episode: Episode, id: string): MapExit[] {
  const from = roomById(episode, id)
  return from.exits.map((next) => {
    const room = roomById(episode, next)
    const side = sideToward(from, room)
    if (side === null) throw new Error(`prize show: ${id} -> ${next}`)
    return { room, side }
  })
}

/** Doors a wave or a camera row uses, relative to the entry. */
export function doorSides(pick: DoorPick, entry: Side): Side[] {
  const turn = (k: number) => ((entry + k) % 4) as Side
  switch (pick) {
    case 'far':
      return [turn(2)]
    case 'flanks':
      return [turn(1), turn(3)]
    case 'behind':
      return [entry]
    case 'all':
      return [0, 1, 2, 3]
    case 'any':
      return [turn(2)]
  }
}

/** A room's waves at a loop: its own, and every encore wave that has come in by then. */
export function wavesAt(script: RoomScript, loop = 1): Wave[] {
  return [
    ...script.waves,
    ...(script.encore ?? [])
      .filter((encore) => encore.loop <= loop)
      .flatMap((encore) => encore.waves),
  ]
}

/** No crashers yet, of every kind. */
export function noCrashers(): Record<CrasherKind, number> {
  return Object.fromEntries(CRASHER_KINDS.map((kind) => [kind, 0])) as Record<
    CrasherKind,
    number
  >
}

/** Crashers a room's script brings on at a loop, by kind (what the game must spawn). */
export function declaredCrashers(
  script: RoomScript,
  loop = 1,
): Record<CrasherKind, number> {
  const out = noCrashers()
  for (const wave of wavesAt(script, loop))
    out[wave.kind] +=
      waveCount(wave, loop) *
      doorSides(wave.doors, 2).length *
      (wave.times ?? 1)
  return out
}

/** Crashers per door in a wave, scaled for the loop (a mini-boss never multiplies). */
export function waveCount(wave: Wave, loop: number): number {
  if (wave.fixed) return wave.count
  return Math.max(1, Math.round(wave.count * loopTuning(loop).count))
}

/** The tick a wave's last group comes through, scaled for the loop. */
export function waveEnds(wave: Wave, loop = 1): number {
  const at = wave.at + (wave.every ?? 0) * ((wave.times ?? 1) - 1)
  return Math.round(at * loopTuning(loop).waveTime)
}

// --- Episode 1: Opening Night ---------------------------------------------------------------
//
//            col 0            col 1             col 2              col 3            col 4
//   row 0    WHOOPEE ALLEY -> SPOTLIGHT DANCE   STUDIO CAMERAS ->  SPONSOR SPOT.
//              ^                  v                 ^                   v
//   row 1    OPENING ACT      THE SHOWCASE  ->  PARADE FLOAT       BUBBLE BASH  ->  GRAND FINALE
//              v                  ^                 v                   ^
//   row 2    WARM-UP CROWD -> LIGHTNING ROUND   CONGA LINE    ->   SURPRISE GUESTS
//
// Up is the rich lane (traps, cars, a sponsor's golden ticket); down is the safe lane. A cracked
// wall in the Lightning Round hides Backstage, the episode's secret room.

const OPENING_ACT: RoomScript = {
  type: 'swarm',
  title: 'OPENING ACT',
  tagline: 'WARM UP THE CROWD',
  seconds: 45,
  danger: 1,
  reward: 'cash',
  waves: [
    { at: s(1), kind: 'grabber', count: 3, doors: 'far' },
    { at: s(5), kind: 'grabber', count: 2, doors: 'flanks' },
    { at: s(10), kind: 'bouncer', count: 1, doors: 'far' },
    {
      at: s(13),
      kind: 'grabber',
      count: 3,
      doors: 'any',
      times: 3,
      every: s(4),
    },
    { at: s(18), kind: 'popper', count: 1, doors: 'far' },
    { at: s(26), kind: 'grabber', count: 2, doors: 'flanks' },
  ],
  encore: [
    { loop: 2, waves: [{ at: s(9), kind: 'chef', count: 1, doors: 'far' }] },
    {
      loop: 4,
      waves: [{ at: s(15), kind: 'fluffball', count: 2, doors: 'flanks' }],
    },
  ],
}

const WARM_UP_CROWD: RoomScript = {
  type: 'swarm',
  title: 'WARM-UP CROWD',
  tagline: 'THE SAFE ROUTE, FOR NOW',
  seconds: 45,
  danger: 1,
  reward: 'cash',
  waves: [
    { at: s(1), kind: 'grabber', count: 3, doors: 'far' },
    { at: s(6), kind: 'bouncer', count: 1, doors: 'flanks' },
    {
      at: s(11),
      kind: 'grabber',
      count: 2,
      doors: 'any',
      times: 4,
      every: s(3),
    },
    { at: s(24), kind: 'bouncer', count: 1, doors: 'far' },
    { at: s(27), kind: 'grabber', count: 3, doors: 'flanks' },
  ],
  encore: [
    { loop: 2, waves: [{ at: s(8), kind: 'timer', count: 1, doors: 'far' }] },
    {
      loop: 4,
      waves: [{ at: s(20), kind: 'fluffball', count: 3, doors: 'far' }],
    },
  ],
}

const WHOOPEE_ALLEY: RoomScript = {
  type: 'mines',
  title: 'WHOOPEE ALLEY',
  tagline: 'MIND THE CUSHIONS AND PEELS',
  seconds: 50,
  danger: 3,
  reward: 'toaster',
  dropRate: 0.18,
  waves: [
    { at: s(2), kind: 'grabber', count: 3, doors: 'far' },
    { at: s(7), kind: 'grabber', count: 3, doors: 'flanks' },
    { at: s(10), kind: 'stagehand', count: 1, doors: 'flanks' },
    { at: s(12), kind: 'bouncer', count: 1, doors: 'flanks' },
    {
      at: s(18),
      kind: 'grabber',
      count: 4,
      doors: 'far',
      times: 2,
      every: s(6),
    },
    { at: s(30), kind: 'grabber', count: 3, doors: 'flanks' },
  ],
  encore: [
    { loop: 3, waves: [{ at: s(14), kind: 'roadie', count: 1, doors: 'far' }] },
  ],
  props: [
    { kind: 'cushion', x: 64, y: 58 },
    { kind: 'cushion', x: 256, y: 58 },
    { kind: 'cushion', x: 108, y: 92 },
    { kind: 'cushion', x: 212, y: 92 },
    { kind: 'cushion', x: 64, y: 168 },
    { kind: 'cushion', x: 256, y: 168 },
    { kind: 'cushion', x: 112, y: 196 },
    { kind: 'cushion', x: 208, y: 196 },
    { kind: 'peel', x: 160, y: 70 },
    { kind: 'peel', x: 92, y: 128 },
    { kind: 'peel', x: 236, y: 128 },
    { kind: 'peel', x: 160, y: 162 },
  ],
}

const SPOTLIGHT_DANCE: RoomScript = {
  type: 'lights',
  title: 'SPOTLIGHT DANCE',
  tagline: 'STAY OUT OF THE HOT BEAMS',
  seconds: 50,
  danger: 3,
  reward: 'car',
  dropRate: 0.16,
  waves: [
    { at: s(2), kind: 'grabber', count: 3, doors: 'far' },
    { at: s(8), kind: 'conga', count: 5, doors: 'far' },
    { at: s(12), kind: 'drone', count: 1, doors: 'far' },
    { at: s(15), kind: 'grabber', count: 3, doors: 'flanks' },
    {
      at: s(22),
      kind: 'bouncer',
      count: 1,
      doors: 'any',
      times: 2,
      every: s(4),
    },
    { at: s(31), kind: 'grabber', count: 3, doors: 'far' },
  ],
  encore: [
    { loop: 4, waves: [{ at: s(16), kind: 'clone', count: 1, doors: 'far' }] },
  ],
  props: [
    {
      kind: 'beam',
      x: 92,
      y: 26,
      base: Math.PI / 2,
      swing: 0.75,
      on: 110,
      off: 80,
      offset: 0,
    },
    {
      kind: 'beam',
      x: 228,
      y: 26,
      base: Math.PI / 2,
      swing: 0.75,
      on: 110,
      off: 80,
      offset: 95,
    },
    {
      kind: 'beam',
      x: 310,
      y: 196,
      base: Math.PI,
      swing: 0.45,
      on: 90,
      off: 100,
      offset: 40,
    },
  ],
}

const LIGHTNING_ROUND: RoomScript = {
  type: 'speed',
  title: 'LIGHTNING ROUND',
  tagline: "PSST... THAT WALL'S CRACKED",
  seconds: 28,
  danger: 2,
  reward: 'cash',
  dropRate: 0.2,
  doubleDrops: true,
  waves: [
    { at: s(1), kind: 'grabber', count: 3, doors: 'far' },
    { at: s(3), kind: 'grabber', count: 2, doors: 'flanks' },
    {
      at: s(6),
      kind: 'grabber',
      count: 3,
      doors: 'any',
      times: 3,
      every: s(2.5),
    },
    { at: s(5), kind: 'popper', count: 1, doors: 'flanks' },
    { at: s(13), kind: 'bouncer', count: 1, doors: 'flanks' },
  ],
  encore: [
    {
      loop: 2,
      waves: [{ at: s(8), kind: 'meatball', count: 1, doors: 'far' }],
    },
  ],
  props: [{ kind: 'crack', side: 2, at: 92, secret: 'backstage' }],
}

const THE_SHOWCASE: RoomScript = {
  type: 'vault',
  title: 'THE SHOWCASE',
  tagline: 'GRAB IT ALL BEFORE IT CLOSES',
  seconds: 12,
  danger: 1,
  reward: 'ticket',
  closes: true,
  waves: [],
  encore: [
    {
      loop: 4,
      waves: [
        { at: s(2), kind: 'saucer', count: 1, doors: 'far', fixed: true },
      ],
    },
  ],
  props: [
    { kind: 'pedestal', x: 268, y: 58, prize: 'car' },
    { kind: 'pedestal', x: 92, y: 58, prize: 'toaster' },
    { kind: 'pedestal', x: 92, y: 198, prize: 'toaster' },
    { kind: 'pedestal', x: 268, y: 198, prize: 'cash' },
    { kind: 'pedestal', x: 214, y: 128, prize: 'cash' },
    { kind: 'pedestal', x: 160, y: 96, prize: 'orbiters' },
    { kind: 'ticket', x: 34, y: 128, id: 'e1-showcase' },
  ],
}

const PARADE_FLOAT: RoomScript = {
  type: 'boss',
  title: 'PARADE FLOAT',
  tagline: 'CONFETTI IT INTO A PARTY',
  seconds: 75,
  danger: 4,
  reward: 'car',
  waves: [
    { at: s(18), kind: 'grabber', count: 2, doors: 'flanks' },
    { at: s(36), kind: 'bouncer', count: 1, doors: 'flanks' },
  ],
  boss: {
    kind: 'float',
    hp: 60,
    phase2At: 0.5,
    title: 'PARADE FLOAT!',
    sub: 'CONFETTI IT INTO A PARTY',
    line: 'HERE COMES THE FLOAT. IT HAS A CAKE. IT HAS OPINIONS.',
  },
}

const STUDIO_CAMERAS: RoomScript = {
  type: 'cameras',
  title: 'STUDIO CAMERAS',
  tagline: 'THE CAMERA WALL IS LIVE',
  seconds: 50,
  danger: 4,
  reward: 'car',
  dropRate: 0.16,
  waves: [
    { at: s(3), kind: 'grabber', count: 3, doors: 'flanks' },
    { at: s(10), kind: 'thrower', count: 1, doors: 'far' },
    {
      at: s(16),
      kind: 'grabber',
      count: 3,
      doors: 'any',
      times: 2,
      every: s(5),
    },
    { at: s(28), kind: 'thrower', count: 1, doors: 'flanks' },
  ],
  encore: [
    {
      loop: 3,
      waves: [{ at: s(12), kind: 'roadie', count: 1, doors: 'flanks' }],
    },
  ],
  props: [
    { kind: 'camera', wall: 'far', at: -0.85, every: 150, offset: 0 },
    { kind: 'camera', wall: 'far', at: -0.4, every: 150, offset: 50 },
    { kind: 'camera', wall: 'far', at: 0.4, every: 150, offset: 100 },
    { kind: 'camera', wall: 'far', at: 0.85, every: 150, offset: 25 },
  ],
}

const CONGA_LINE: RoomScript = {
  type: 'conga',
  title: 'THE CONGA LINE',
  tagline: 'LONG LINES, FAST FEET',
  seconds: 45,
  danger: 2,
  reward: 'cash',
  pace: 1.25,
  waves: [
    { at: s(1), kind: 'conga', count: 8, doors: 'far' },
    { at: s(10), kind: 'conga', count: 6, doors: 'flanks' },
    { at: s(21), kind: 'conga', count: 10, doors: 'far' },
    { at: s(29), kind: 'conga', count: 5, doors: 'flanks' },
  ],
  encore: [
    {
      loop: 2,
      waves: [{ at: s(16), kind: 'meatball', count: 1, doors: 'flanks' }],
    },
    { loop: 3, waves: [{ at: s(6), kind: 'heckler', count: 1, doors: 'far' }] },
  ],
  props: [{ kind: 'boom', every: 420, offset: 200 }],
}

const SPONSOR_SPOTLIGHT: RoomScript = {
  type: 'sponsor',
  title: 'SPONSOR SPOTLIGHT',
  tagline: 'NO HITS WINS A GOLDEN TICKET',
  seconds: 50,
  danger: 4,
  reward: 'ticket',
  challenge: 'no-hit',
  ticket: 'e1-sponsor',
  waves: [
    { at: s(2), kind: 'grabber', count: 3, doors: 'far' },
    { at: s(7), kind: 'bouncer', count: 1, doors: 'flanks' },
    { at: s(12), kind: 'thrower', count: 1, doors: 'far' },
    { at: s(17), kind: 'conga', count: 6, doors: 'any' },
    { at: s(25), kind: 'grabber', count: 3, doors: 'flanks' },
    { at: s(20), kind: 'tank', count: 1, doors: 'far', fixed: true },
    { at: s(31), kind: 'thrower', count: 1, doors: 'flanks' },
  ],
  encore: [
    {
      loop: 2,
      waves: [{ at: s(10), kind: 'chef', count: 1, doors: 'flanks' }],
    },
    { loop: 4, waves: [{ at: s(14), kind: 'clone', count: 1, doors: 'far' }] },
  ],
}

const SURPRISE_GUESTS: RoomScript = {
  type: 'ambush',
  title: 'SURPRISE GUESTS',
  tagline: 'EVERY DOOR AT ONCE!',
  seconds: 55,
  danger: 3,
  reward: 'toaster',
  waves: [
    { at: s(2), kind: 'grabber', count: 2, doors: 'all' },
    { at: s(10), kind: 'bouncer', count: 1, doors: 'all' },
    { at: s(18), kind: 'grabber', count: 2, doors: 'all' },
    { at: s(26), kind: 'conga', count: 5, doors: 'behind' },
    { at: s(20), kind: 'mascot', count: 1, doors: 'far', fixed: true },
  ],
  encore: [
    {
      loop: 3,
      waves: [{ at: s(12), kind: 'diver', count: 1, doors: 'flanks' }],
    },
  ],
}

const BUBBLE_BASH: RoomScript = {
  type: 'swarm',
  title: 'BUBBLE BASH',
  tagline: 'A FOAM PARTY BEFORE THE FINALE',
  seconds: 50,
  danger: 3,
  reward: 'toaster',
  modifier: 'foam',
  waves: [
    { at: s(2), kind: 'grabber', count: 3, doors: 'far' },
    { at: s(8), kind: 'bouncer', count: 1, doors: 'flanks' },
    { at: s(14), kind: 'conga', count: 6, doors: 'far' },
    { at: s(21), kind: 'thrower', count: 1, doors: 'any' },
    { at: s(18), kind: 'tank', count: 1, doors: 'far', fixed: true },
    { at: s(27), kind: 'grabber', count: 3, doors: 'flanks' },
  ],
  encore: [
    {
      loop: 3,
      waves: [{ at: s(10), kind: 'heckler', count: 1, doors: 'flanks' }],
    },
  ],
  props: [{ kind: 'boom', every: 480, offset: 120 }],
}

const GRAND_FINALE: RoomScript = {
  type: 'boss',
  title: 'GRAND FINALE',
  tagline: 'THE BIG WOBBLE TAKES THE STAGE',
  seconds: 100,
  danger: 5,
  reward: 'car',
  waves: [
    { at: s(15), kind: 'grabber', count: 2, doors: 'flanks' },
    { at: s(30), kind: 'bouncer', count: 1, doors: 'flanks' },
    { at: s(45), kind: 'grabber', count: 2, doors: 'flanks' },
  ],
  props: [{ kind: 'boom', every: 520, offset: 100 }],
  boss: {
    kind: 'wobble',
    hp: 120,
    phase2At: 0.5,
    title: 'THE BIG WOBBLE!',
    sub: 'POP ITS ARMS AND LEGS',
    line: "FORTY FEET OF HOT AIR, AND FOR ONCE IT ISN'T ME.",
  },
}

const BACKSTAGE: RoomScript = {
  type: 'secret',
  title: 'BACKSTAGE',
  tagline: 'YOU FOUND THE SECRET ROOM!',
  seconds: 18,
  danger: 1,
  reward: 'ticket',
  closes: true,
  waves: [
    { at: s(3), kind: 'grabber', count: 2, doors: 'far' },
    { at: s(8), kind: 'grabber', count: 2, doors: 'flanks' },
  ],
  encore: [
    {
      loop: 4,
      waves: [
        { at: s(2), kind: 'saucer', count: 1, doors: 'far', fixed: true },
      ],
    },
  ],
  props: [
    { kind: 'pedestal', x: 80, y: 64, prize: 'car' },
    { kind: 'pedestal', x: 240, y: 64, prize: 'toaster' },
    { kind: 'pedestal', x: 80, y: 192, prize: 'cash' },
    { kind: 'pedestal', x: 240, y: 192, prize: 'shield' },
    { kind: 'ticket', x: 160, y: 80, id: 'e1-backstage' },
  ],
}

export const EPISODE_1: Episode = {
  number: 1,
  title: 'OPENING NIGHT',
  subtitle: 'THE GAME SHOW',
  set: 'studio',
  cols: 5,
  rows: 3,
  start: 'opening-act',
  midBoss: 'parade-float',
  finale: 'grand-finale',
  rooms: [
    {
      id: 'opening-act',
      col: 0,
      row: 1,
      script: OPENING_ACT,
      exits: ['whoopee-alley', 'warm-up-crowd'],
    },
    {
      id: 'whoopee-alley',
      col: 0,
      row: 0,
      script: WHOOPEE_ALLEY,
      exits: ['spotlight-dance'],
    },
    {
      id: 'warm-up-crowd',
      col: 0,
      row: 2,
      script: WARM_UP_CROWD,
      exits: ['lightning-round'],
    },
    {
      id: 'spotlight-dance',
      col: 1,
      row: 0,
      script: SPOTLIGHT_DANCE,
      exits: ['the-showcase'],
    },
    {
      id: 'lightning-round',
      col: 1,
      row: 2,
      script: LIGHTNING_ROUND,
      exits: ['the-showcase'],
    },
    {
      id: 'the-showcase',
      col: 1,
      row: 1,
      script: THE_SHOWCASE,
      exits: ['parade-float'],
    },
    {
      id: 'parade-float',
      col: 2,
      row: 1,
      script: PARADE_FLOAT,
      exits: ['studio-cameras', 'conga-line'],
    },
    {
      id: 'studio-cameras',
      col: 2,
      row: 0,
      script: STUDIO_CAMERAS,
      exits: ['sponsor-spotlight'],
    },
    {
      id: 'conga-line',
      col: 2,
      row: 2,
      script: CONGA_LINE,
      exits: ['surprise-guests'],
    },
    {
      id: 'sponsor-spotlight',
      col: 3,
      row: 0,
      script: SPONSOR_SPOTLIGHT,
      exits: ['bubble-bash'],
    },
    {
      id: 'surprise-guests',
      col: 3,
      row: 2,
      script: SURPRISE_GUESTS,
      exits: ['bubble-bash'],
    },
    {
      id: 'bubble-bash',
      col: 3,
      row: 1,
      script: BUBBLE_BASH,
      exits: ['grand-finale'],
    },
    {
      id: 'grand-finale',
      col: 4,
      row: 1,
      script: GRAND_FINALE,
      exits: [],
    },
  ],
  secrets: { backstage: BACKSTAGE },
}

// --- Episode 2: Cooking Showdown ------------------------------------------------------------
//
//            col 0            col 1             col 2              col 3            col 4
//   row 0    HOT PLATES  ->   THE CONVEYOR      SPICE RUSH    ->   BAKE-OFF
//              ^                  v                 ^                 v
//   row 1    MISE EN PLACE    SAMPLE TRAY  ->   THE PIE CART       THE PASS    ->   SOUFFLE SUPREME
//              v                  ^                 v                 ^
//   row 2    PANTRY RAID ->   FLOUR POWER       THE DISH PIT  ->   EGG HUNT
//
// The kitchen set: hot-plate tiles glow, then sizzle; flour clouds hide whoever is inside; conveyor
// counters carry everyone along. Up is the rich lane again, down the safe one. A cracked wall in
// Flour Power hides the Walk-In Freezer.

/** A 2x2-tile hot plate (32px square) at tile (col, row) of the floor grid. */
const plate = (col: number, row: number, every: number, offset: number) =>
  ({
    kind: 'hotplate',
    x: col * 16,
    y: row * 16,
    w: 32,
    h: 32,
    every,
    offset,
  }) as const

const MISE_EN_PLACE: RoomScript = {
  type: 'swarm',
  title: 'MISE EN PLACE',
  tagline: 'EVERYTHING IN ITS PLACE. FOR NOW',
  seconds: 45,
  danger: 2,
  reward: 'cash',
  waves: [
    { at: s(1), kind: 'grabber', count: 3, doors: 'far' },
    { at: s(6), kind: 'chef', count: 1, doors: 'far' },
    { at: s(9), kind: 'grabber', count: 2, doors: 'flanks' },
    { at: s(15), kind: 'timer', count: 1, doors: 'any' },
    {
      at: s(19),
      kind: 'grabber',
      count: 3,
      doors: 'any',
      times: 2,
      every: s(4),
    },
    { at: s(27), kind: 'bouncer', count: 1, doors: 'flanks' },
  ],
  props: [
    { kind: 'belt', x: 96, y: 192, w: 128, h: 16, dir: 1 },
    plate(9, 3, 300, 0),
  ],
}

const HOT_PLATES: RoomScript = {
  type: 'hotplates',
  title: 'HOT PLATES',
  tagline: 'WATCH FOR THE GLOW',
  seconds: 50,
  danger: 3,
  reward: 'toaster',
  dropRate: 0.18,
  waves: [
    { at: s(2), kind: 'grabber', count: 3, doors: 'far' },
    { at: s(7), kind: 'chef', count: 1, doors: 'flanks' },
    { at: s(12), kind: 'grabber', count: 3, doors: 'any' },
    { at: s(18), kind: 'meatball', count: 1, doors: 'far' },
    {
      at: s(24),
      kind: 'grabber',
      count: 2,
      doors: 'flanks',
      times: 2,
      every: s(5),
    },
  ],
  props: [
    plate(3, 3, 240, 0),
    plate(15, 3, 240, 80),
    plate(3, 10, 240, 160),
    plate(15, 10, 240, 40),
    plate(7, 6, 240, 120),
    plate(11, 8, 240, 200),
  ],
}

const PANTRY_RAID: RoomScript = {
  type: 'swarm',
  title: 'PANTRY RAID',
  tagline: 'THE SAFE ROUTE SMELLS OF BREAD',
  seconds: 45,
  danger: 1,
  reward: 'cash',
  waves: [
    { at: s(1), kind: 'grabber', count: 3, doors: 'far' },
    { at: s(6), kind: 'bouncer', count: 1, doors: 'flanks' },
    { at: s(10), kind: 'meatball', count: 1, doors: 'far' },
    {
      at: s(14),
      kind: 'grabber',
      count: 2,
      doors: 'any',
      times: 3,
      every: s(4),
    },
    { at: s(26), kind: 'timer', count: 1, doors: 'flanks' },
  ],
  props: [
    { kind: 'flour', x: 96, y: 80, r: 22, drift: 1 },
    { kind: 'flour', x: 224, y: 176, r: 22, drift: -1 },
  ],
}

const THE_CONVEYOR: RoomScript = {
  type: 'conveyor',
  title: 'THE CONVEYOR',
  tagline: 'THE COUNTERS NEVER STOP',
  seconds: 50,
  danger: 3,
  reward: 'car',
  dropRate: 0.16,
  waves: [
    { at: s(2), kind: 'grabber', count: 3, doors: 'flanks' },
    { at: s(7), kind: 'meatball', count: 1, doors: 'far' },
    { at: s(12), kind: 'chef', count: 1, doors: 'far' },
    { at: s(16), kind: 'conga', count: 6, doors: 'flanks' },
    { at: s(23), kind: 'meatball', count: 1, doors: 'flanks' },
    { at: s(29), kind: 'grabber', count: 3, doors: 'any' },
  ],
  props: [
    { kind: 'belt', x: 32, y: 64, w: 112, h: 16, dir: 1 },
    { kind: 'belt', x: 176, y: 64, w: 112, h: 16, dir: 3 },
    { kind: 'belt', x: 32, y: 176, w: 112, h: 16, dir: 3 },
    { kind: 'belt', x: 176, y: 176, w: 112, h: 16, dir: 1 },
    { kind: 'belt', x: 112, y: 96, w: 16, h: 64, dir: 0 },
    { kind: 'belt', x: 192, y: 96, w: 16, h: 64, dir: 2 },
  ],
}

const FLOUR_POWER: RoomScript = {
  type: 'flour',
  title: 'FLOUR POWER',
  tagline: "WHO'S HIDING IN THE CLOUD? ...AND WHAT'S THAT CRACK?",
  seconds: 45,
  danger: 2,
  reward: 'cash',
  waves: [
    { at: s(2), kind: 'grabber', count: 3, doors: 'far' },
    { at: s(7), kind: 'grabber', count: 2, doors: 'flanks' },
    { at: s(12), kind: 'chef', count: 1, doors: 'any' },
    {
      at: s(16),
      kind: 'grabber',
      count: 3,
      doors: 'any',
      times: 2,
      every: s(5),
    },
    { at: s(25), kind: 'bouncer', count: 1, doors: 'far' },
  ],
  props: [
    { kind: 'flour', x: 88, y: 72, r: 26, drift: 1 },
    { kind: 'flour', x: 232, y: 72, r: 24, drift: -1 },
    { kind: 'flour', x: 160, y: 132, r: 28, drift: 1 },
    { kind: 'flour', x: 96, y: 188, r: 22, drift: -1 },
    { kind: 'crack', side: 0, at: -96, secret: 'walk-in-freezer' },
  ],
}

const SAMPLE_TRAY: RoomScript = {
  type: 'vault',
  title: 'THE SAMPLE TRAY',
  tagline: 'TAKE ONE OF EACH. QUICKLY',
  seconds: 12,
  danger: 1,
  reward: 'ticket',
  closes: true,
  waves: [],
  props: [
    { kind: 'pedestal', x: 92, y: 60, prize: 'car' },
    { kind: 'pedestal', x: 228, y: 60, prize: 'toaster' },
    { kind: 'pedestal', x: 92, y: 196, prize: 'cash' },
    { kind: 'pedestal', x: 228, y: 196, prize: 'cash' },
    { kind: 'pedestal', x: 160, y: 96, prize: 'foamgun' },
    { kind: 'belt', x: 128, y: 160, w: 64, h: 16, dir: 3 },
    { kind: 'ticket', x: 286, y: 128, id: 'e2-sampler' },
  ],
}

const PIE_CART: RoomScript = {
  type: 'boss',
  title: 'THE PIE CART',
  tagline: 'A RUNAWAY DESSERT TROLLEY',
  seconds: 80,
  danger: 4,
  reward: 'car',
  waves: [
    { at: s(20), kind: 'grabber', count: 2, doors: 'flanks' },
    { at: s(42), kind: 'grabber', count: 2, doors: 'flanks' },
  ],
  boss: {
    kind: 'piecart',
    hp: 70,
    phase2At: 0.5,
    title: 'THE PIE CART!',
    sub: 'STAY OFF THE CREAM',
    line: 'NOBODY IS PUSHING THAT TROLLEY. NOBODY HAS EVER PUSHED THAT TROLLEY.',
  },
}

const SPICE_RUSH: RoomScript = {
  type: 'speed',
  title: 'SPICE RUSH',
  tagline: 'HOT, FAST AND DOUBLE PRIZES',
  seconds: 30,
  danger: 3,
  reward: 'toaster',
  dropRate: 0.2,
  doubleDrops: true,
  waves: [
    { at: s(1), kind: 'grabber', count: 3, doors: 'far' },
    { at: s(3), kind: 'grabber', count: 3, doors: 'flanks' },
    {
      at: s(6),
      kind: 'grabber',
      count: 3,
      doors: 'any',
      times: 3,
      every: s(2.5),
    },
    { at: s(8), kind: 'meatball', count: 1, doors: 'flanks' },
    { at: s(14), kind: 'popper', count: 1, doors: 'far' },
  ],
  props: [plate(5, 5, 200, 0), plate(13, 9, 200, 100)],
}

const THE_DISH_PIT: RoomScript = {
  type: 'conga',
  title: 'THE DISH PIT',
  tagline: 'CONGA LINES ON THE COUNTERS',
  seconds: 45,
  danger: 2,
  reward: 'cash',
  pace: 1.2,
  waves: [
    { at: s(1), kind: 'conga', count: 7, doors: 'far' },
    { at: s(9), kind: 'conga', count: 6, doors: 'flanks' },
    { at: s(15), kind: 'timer', count: 1, doors: 'far' },
    { at: s(20), kind: 'conga', count: 9, doors: 'far' },
    { at: s(28), kind: 'conga', count: 5, doors: 'flanks' },
  ],
  props: [
    { kind: 'belt', x: 48, y: 96, w: 224, h: 16, dir: 1 },
    { kind: 'belt', x: 48, y: 160, w: 224, h: 16, dir: 3 },
  ],
}

const BAKE_OFF: RoomScript = {
  type: 'sponsor',
  title: 'THE BAKE-OFF',
  tagline: 'GRAB EVERY PRIZE FOR A GOLDEN TICKET',
  seconds: 50,
  danger: 4,
  reward: 'ticket',
  challenge: 'all-prizes',
  ticket: 'e2-bakeoff',
  dropRate: 0.2,
  waves: [
    { at: s(2), kind: 'grabber', count: 3, doors: 'far' },
    { at: s(6), kind: 'chef', count: 1, doors: 'flanks' },
    { at: s(11), kind: 'thrower', count: 1, doors: 'far' },
    { at: s(16), kind: 'timer', count: 1, doors: 'any' },
    { at: s(21), kind: 'grabber', count: 3, doors: 'flanks' },
    { at: s(27), kind: 'chef', count: 1, doors: 'far' },
  ],
  props: [
    plate(4, 4, 260, 0),
    plate(14, 4, 260, 130),
    { kind: 'pedestal', x: 160, y: 64, prize: 'toaster' },
    { kind: 'pedestal', x: 64, y: 196, prize: 'cash' },
    { kind: 'pedestal', x: 256, y: 196, prize: 'cash' },
  ],
}

const EGG_HUNT: RoomScript = {
  type: 'ambush',
  title: 'EGG HUNT',
  tagline: 'TIMERS AT EVERY DOOR',
  seconds: 50,
  danger: 3,
  reward: 'toaster',
  waves: [
    { at: s(2), kind: 'grabber', count: 2, doors: 'all' },
    { at: s(8), kind: 'timer', count: 1, doors: 'flanks' },
    { at: s(15), kind: 'grabber', count: 2, doors: 'all' },
    { at: s(21), kind: 'timer', count: 1, doors: 'far' },
    { at: s(26), kind: 'bouncer', count: 1, doors: 'all' },
  ],
  props: [{ kind: 'flour', x: 160, y: 128, r: 24, drift: 1 }],
}

const THE_PASS: RoomScript = {
  type: 'conveyor',
  title: 'THE PASS',
  tagline: 'EVERY ORDER UP AT ONCE',
  seconds: 55,
  danger: 4,
  reward: 'car',
  dropRate: 0.16,
  waves: [
    { at: s(2), kind: 'grabber', count: 3, doors: 'far' },
    { at: s(6), kind: 'chef', count: 1, doors: 'flanks' },
    { at: s(12), kind: 'meatball', count: 1, doors: 'far' },
    { at: s(17), kind: 'timer', count: 1, doors: 'flanks' },
    { at: s(21), kind: 'chef', count: 1, doors: 'far' },
    { at: s(24), kind: 'popper', count: 1, doors: 'flanks' },
    { at: s(28), kind: 'grabber', count: 3, doors: 'any' },
  ],
  props: [
    { kind: 'belt', x: 48, y: 80, w: 224, h: 16, dir: 1 },
    { kind: 'belt', x: 48, y: 176, w: 224, h: 16, dir: 3 },
    plate(4, 7, 240, 0),
    plate(16, 7, 240, 120),
    { kind: 'boom', every: 480, offset: 160 },
  ],
}

const SOUFFLE_SUPREME: RoomScript = {
  type: 'boss',
  title: 'SOUFFLE SUPREME',
  tagline: 'WHAT RISES MUST COME DOWN',
  seconds: 110,
  danger: 5,
  reward: 'car',
  waves: [
    { at: s(25), kind: 'grabber', count: 2, doors: 'flanks' },
    { at: s(55), kind: 'chef', count: 1, doors: 'far' },
  ],
  props: [{ kind: 'boom', every: 600, offset: 240 }],
  boss: {
    kind: 'souffle',
    hp: 100,
    phase2At: 0.5,
    title: 'SOUFFLE SUPREME!',
    sub: 'HIT IT WHEN IT FALLS',
    line: 'THE CHEF SAYS NOBODY OPENS THE OVEN DOOR. WELL. TOO LATE.',
  },
}

const WALK_IN_FREEZER: RoomScript = {
  type: 'secret',
  title: 'WALK-IN FREEZER',
  tagline: 'COOL! A SECRET ROOM!',
  seconds: 18,
  danger: 1,
  reward: 'ticket',
  closes: true,
  modifier: 'foam',
  waves: [
    { at: s(3), kind: 'grabber', count: 2, doors: 'far' },
    { at: s(8), kind: 'bouncer', count: 1, doors: 'flanks' },
  ],
  props: [
    { kind: 'pedestal', x: 80, y: 64, prize: 'car' },
    { kind: 'pedestal', x: 240, y: 64, prize: 'skates' },
    { kind: 'pedestal', x: 80, y: 192, prize: 'cash' },
    { kind: 'pedestal', x: 240, y: 192, prize: 'toaster' },
    { kind: 'ticket', x: 160, y: 176, id: 'e2-freezer' },
  ],
}

export const EPISODE_2: Episode = {
  number: 2,
  title: 'COOKING SHOWDOWN',
  subtitle: 'THE KITCHEN',
  set: 'kitchen',
  cols: 5,
  rows: 3,
  start: 'mise-en-place',
  midBoss: 'pie-cart',
  finale: 'souffle-supreme',
  rooms: [
    {
      id: 'mise-en-place',
      col: 0,
      row: 1,
      script: MISE_EN_PLACE,
      exits: ['hot-plates', 'pantry-raid'],
    },
    {
      id: 'hot-plates',
      col: 0,
      row: 0,
      script: HOT_PLATES,
      exits: ['the-conveyor'],
    },
    {
      id: 'pantry-raid',
      col: 0,
      row: 2,
      script: PANTRY_RAID,
      exits: ['flour-power'],
    },
    {
      id: 'the-conveyor',
      col: 1,
      row: 0,
      script: THE_CONVEYOR,
      exits: ['sample-tray'],
    },
    {
      id: 'flour-power',
      col: 1,
      row: 2,
      script: FLOUR_POWER,
      exits: ['sample-tray'],
    },
    {
      id: 'sample-tray',
      col: 1,
      row: 1,
      script: SAMPLE_TRAY,
      exits: ['pie-cart'],
    },
    {
      id: 'pie-cart',
      col: 2,
      row: 1,
      script: PIE_CART,
      exits: ['spice-rush', 'dish-pit'],
    },
    {
      id: 'spice-rush',
      col: 2,
      row: 0,
      script: SPICE_RUSH,
      exits: ['bake-off'],
    },
    {
      id: 'dish-pit',
      col: 2,
      row: 2,
      script: THE_DISH_PIT,
      exits: ['egg-hunt'],
    },
    {
      id: 'bake-off',
      col: 3,
      row: 0,
      script: BAKE_OFF,
      exits: ['the-pass'],
    },
    {
      id: 'egg-hunt',
      col: 3,
      row: 2,
      script: EGG_HUNT,
      exits: ['the-pass'],
    },
    {
      id: 'the-pass',
      col: 3,
      row: 1,
      script: THE_PASS,
      exits: ['souffle-supreme'],
    },
    {
      id: 'souffle-supreme',
      col: 4,
      row: 1,
      script: SOUFFLE_SUPREME,
      exits: [],
    },
  ],
  secrets: { 'walk-in-freezer': WALK_IN_FREEZER },
}

// --- Episode 3: Countdown Concert -----------------------------------------------------------
//
//            col 0            col 1             col 2              col 3            col 4
//   row 0    FRONT ROW   ->   STROBE STORM      CROWD CAM     ->   SPONSOR SOLO
//              ^                  v                 ^                 v
//   row 1    SOUND CHECK      GOLD RECORDS ->   MOSH MASCOT        STAGE INVASION -> THE JUMBOTRON
//              v                  ^                 v                 ^
//   row 2    MERCH STAND ->   THE PIT           ENCORE CONGA  ->   LIGHTNING SET
//
// The concert set moves to the music: at 120 beats a minute the speaker stacks thump bass rings
// on the beat (each with a gap to slip through), the strobes flash on it, and the mosh pits shove
// hardest on it. A cracked wall in The Pit hides the Green Room.

/** A speaker stack in a corner of the floor (0 top-left, clockwise). */
const speaker = (corner: 0 | 1 | 2 | 3, beats: number, offset: number) =>
  ({
    kind: 'speaker',
    x: corner === 0 || corner === 3 ? 26 : 294,
    y: corner < 2 ? 42 : 214,
    beats,
    offset,
  }) as const

const SOUND_CHECK: RoomScript = {
  type: 'swarm',
  title: 'SOUND CHECK',
  tagline: 'ONE, TWO. ONE, TWO',
  seconds: 45,
  danger: 2,
  reward: 'cash',
  beat: CONCERT_BEAT,
  waves: [
    { at: s(1), kind: 'grabber', count: 3, doors: 'far' },
    { at: s(6), kind: 'roadie', count: 1, doors: 'far' },
    { at: s(10), kind: 'grabber', count: 2, doors: 'flanks' },
    { at: s(15), kind: 'heckler', count: 1, doors: 'any' },
    {
      at: s(19),
      kind: 'grabber',
      count: 3,
      doors: 'any',
      times: 2,
      every: s(4),
    },
  ],
  props: [speaker(1, 8, 0)],
}

const FRONT_ROW: RoomScript = {
  type: 'speakers',
  title: 'THE FRONT ROW',
  tagline: 'FEEL THE BASS. SLIP THE GAP',
  seconds: 50,
  danger: 3,
  reward: 'toaster',
  dropRate: 0.18,
  beat: CONCERT_BEAT,
  waves: [
    { at: s(2), kind: 'grabber', count: 3, doors: 'far' },
    { at: s(7), kind: 'roadie', count: 1, doors: 'flanks' },
    { at: s(12), kind: 'grabber', count: 3, doors: 'any' },
    { at: s(17), kind: 'diver', count: 1, doors: 'far' },
    { at: s(24), kind: 'grabber', count: 3, doors: 'flanks' },
  ],
  props: [
    speaker(0, 6, 0),
    speaker(1, 6, 3),
    speaker(2, 6, 0),
    speaker(3, 6, 3),
  ],
}

const MERCH_STAND: RoomScript = {
  type: 'swarm',
  title: 'MERCH STAND',
  tagline: 'THE SAFE ROUTE. MIND THE HECKLERS',
  seconds: 45,
  danger: 1,
  reward: 'cash',
  beat: CONCERT_BEAT,
  waves: [
    { at: s(1), kind: 'grabber', count: 3, doors: 'far' },
    { at: s(6), kind: 'heckler', count: 1, doors: 'far' },
    { at: s(9), kind: 'grabber', count: 2, doors: 'flanks' },
    {
      at: s(14),
      kind: 'grabber',
      count: 2,
      doors: 'any',
      times: 3,
      every: s(4),
    },
    { at: s(26), kind: 'bouncer', count: 1, doors: 'flanks' },
  ],
}

const STROBE_STORM: RoomScript = {
  type: 'lights',
  title: 'STROBE STORM',
  tagline: 'YOU SEE THEM ON THE BEAT',
  seconds: 50,
  danger: 4,
  reward: 'car',
  dropRate: 0.16,
  beat: CONCERT_BEAT,
  strobe: true,
  waves: [
    { at: s(2), kind: 'grabber', count: 3, doors: 'far' },
    { at: s(7), kind: 'diver', count: 1, doors: 'flanks' },
    { at: s(12), kind: 'conga', count: 6, doors: 'far' },
    { at: s(18), kind: 'heckler', count: 1, doors: 'any' },
    { at: s(24), kind: 'grabber', count: 3, doors: 'flanks' },
  ],
  props: [
    {
      kind: 'beam',
      x: 80,
      y: 26,
      base: Math.PI / 2,
      swing: 0.7,
      on: 90,
      off: 30,
      offset: 0,
    },
    {
      kind: 'beam',
      x: 240,
      y: 26,
      base: Math.PI / 2,
      swing: 0.7,
      on: 90,
      off: 30,
      offset: 60,
    },
  ],
}

const THE_PIT: RoomScript = {
  type: 'moshpit',
  title: 'THE PIT',
  tagline: "DON'T GET SWEPT UP. ...IS THAT A CRACK?",
  seconds: 45,
  danger: 2,
  reward: 'cash',
  beat: CONCERT_BEAT,
  waves: [
    { at: s(2), kind: 'grabber', count: 3, doors: 'far' },
    { at: s(7), kind: 'diver', count: 1, doors: 'far' },
    { at: s(11), kind: 'grabber', count: 2, doors: 'flanks' },
    {
      at: s(16),
      kind: 'grabber',
      count: 2,
      doors: 'any',
      times: 2,
      every: s(5),
    },
    { at: s(25), kind: 'heckler', count: 1, doors: 'flanks' },
  ],
  props: [
    { kind: 'mosh', x: 100, y: 96, r: 30, spin: 1 },
    { kind: 'mosh', x: 220, y: 160, r: 30, spin: -1 },
    { kind: 'crack', side: 2, at: 96, secret: 'green-room' },
  ],
}

const GOLD_RECORDS: RoomScript = {
  type: 'vault',
  title: 'GOLD RECORDS',
  tagline: 'GRAB THE PLATINUM BEFORE THE CURTAIN',
  seconds: 12,
  danger: 1,
  reward: 'ticket',
  closes: true,
  beat: CONCERT_BEAT,
  waves: [],
  props: [
    { kind: 'pedestal', x: 92, y: 60, prize: 'toaster' },
    { kind: 'pedestal', x: 228, y: 60, prize: 'car' },
    { kind: 'pedestal', x: 92, y: 196, prize: 'cash' },
    { kind: 'pedestal', x: 228, y: 196, prize: 'toaster' },
    { kind: 'pedestal', x: 160, y: 160, prize: 'rockets' },
    { kind: 'ticket', x: 160, y: 56, id: 'e3-records' },
  ],
}

const MOSH_MASCOT: RoomScript = {
  type: 'boss',
  title: 'MOSH MASCOT',
  tagline: 'IT SURFS ON THE CROWD',
  seconds: 85,
  danger: 4,
  reward: 'car',
  beat: CONCERT_BEAT,
  waves: [],
  boss: {
    kind: 'mosh',
    hp: 70,
    phase2At: 0.5,
    title: 'MOSH MASCOT!',
    sub: 'CLEAR THE CROWD AND IT FALLS',
    line: 'OUR MASCOT HAS FOUND THE CROWD. THE CROWD HAS FOUND OUR MASCOT.',
  },
}

const CROWD_CAM: RoomScript = {
  type: 'cameras',
  title: 'CROWD CAM',
  tagline: 'SMILE, YOU ARE ON THE BIG SCREEN',
  seconds: 50,
  danger: 4,
  reward: 'car',
  dropRate: 0.16,
  beat: CONCERT_BEAT,
  waves: [
    { at: s(3), kind: 'grabber', count: 3, doors: 'flanks' },
    { at: s(9), kind: 'roadie', count: 1, doors: 'far' },
    { at: s(15), kind: 'heckler', count: 1, doors: 'flanks' },
    { at: s(21), kind: 'grabber', count: 3, doors: 'any' },
    { at: s(28), kind: 'diver', count: 1, doors: 'far' },
  ],
  props: [
    { kind: 'camera', wall: 'far', at: -0.6, every: 150, offset: 0 },
    { kind: 'camera', wall: 'far', at: 0.6, every: 150, offset: 75 },
    speaker(2, 8, 0),
    speaker(3, 8, 4),
  ],
}

const ENCORE_CONGA: RoomScript = {
  type: 'conga',
  title: 'ENCORE CONGA',
  tagline: 'ONE MORE TIME, LONGER',
  seconds: 45,
  danger: 2,
  reward: 'cash',
  pace: 1.25,
  beat: CONCERT_BEAT,
  waves: [
    { at: s(1), kind: 'conga', count: 8, doors: 'far' },
    { at: s(10), kind: 'conga', count: 7, doors: 'flanks' },
    { at: s(16), kind: 'heckler', count: 1, doors: 'far' },
    { at: s(21), kind: 'conga', count: 10, doors: 'far' },
  ],
  props: [{ kind: 'mosh', x: 160, y: 128, r: 28, spin: 1 }],
}

const SPONSOR_SOLO: RoomScript = {
  type: 'sponsor',
  title: 'SPONSOR SOLO',
  tagline: 'PLAY IT CLEAN: NO HITS, ONE TICKET',
  seconds: 50,
  danger: 4,
  reward: 'ticket',
  challenge: 'no-hit',
  ticket: 'e3-solo',
  beat: CONCERT_BEAT,
  waves: [
    { at: s(2), kind: 'grabber', count: 3, doors: 'far' },
    { at: s(7), kind: 'diver', count: 1, doors: 'flanks' },
    { at: s(12), kind: 'roadie', count: 1, doors: 'far' },
    { at: s(17), kind: 'grabber', count: 3, doors: 'any' },
    { at: s(22), kind: 'heckler', count: 1, doors: 'flanks' },
    { at: s(27), kind: 'thrower', count: 1, doors: 'far' },
  ],
  props: [speaker(0, 8, 0), speaker(1, 8, 4)],
}

const LIGHTNING_SET: RoomScript = {
  type: 'speed',
  title: 'LIGHTNING SET',
  tagline: 'A SHORT SET, DOUBLE PRIZES',
  seconds: 30,
  danger: 2,
  reward: 'toaster',
  dropRate: 0.2,
  doubleDrops: true,
  beat: CONCERT_BEAT,
  strobe: true,
  waves: [
    { at: s(1), kind: 'grabber', count: 3, doors: 'far' },
    { at: s(3), kind: 'grabber', count: 2, doors: 'flanks' },
    {
      at: s(6),
      kind: 'grabber',
      count: 3,
      doors: 'any',
      times: 3,
      every: s(2.5),
    },
    { at: s(10), kind: 'diver', count: 1, doors: 'far' },
  ],
}

const STAGE_INVASION: RoomScript = {
  type: 'ambush',
  title: 'STAGE INVASION',
  tagline: 'EVERY DOOR, EVERY BEAT',
  seconds: 55,
  danger: 4,
  reward: 'toaster',
  beat: CONCERT_BEAT,
  waves: [
    { at: s(2), kind: 'grabber', count: 2, doors: 'all' },
    { at: s(9), kind: 'heckler', count: 1, doors: 'far' },
    { at: s(14), kind: 'grabber', count: 2, doors: 'all' },
    { at: s(20), kind: 'diver', count: 1, doors: 'flanks' },
    { at: s(24), kind: 'mascot', count: 1, doors: 'far', fixed: true },
    { at: s(30), kind: 'grabber', count: 2, doors: 'all' },
  ],
  props: [
    { kind: 'mosh', x: 84, y: 128, r: 26, spin: 1 },
    { kind: 'mosh', x: 236, y: 128, r: 26, spin: -1 },
    speaker(0, 8, 0),
    speaker(2, 8, 4),
  ],
}

const THE_JUMBOTRON: RoomScript = {
  type: 'boss',
  title: 'THE JUMBOTRON',
  tagline: 'THE FACE ON EVERY SCREEN',
  seconds: 110,
  danger: 5,
  reward: 'car',
  beat: CONCERT_BEAT,
  waves: [
    { at: s(20), kind: 'grabber', count: 2, doors: 'flanks' },
    { at: s(45), kind: 'heckler', count: 1, doors: 'flanks' },
    { at: s(70), kind: 'grabber', count: 2, doors: 'flanks' },
  ],
  props: [speaker(2, 8, 0), speaker(3, 8, 4)],
  boss: {
    kind: 'jumbotron',
    hp: 90,
    phase2At: 0.5,
    title: 'THE JUMBOTRON!',
    sub: 'CRACK THE SCREENS. CORNER THE FACE',
    line: 'OH NO. THE BIG SCREEN HAS STARTED WATCHING US BACK.',
  },
}

const GREEN_ROOM: RoomScript = {
  type: 'secret',
  title: 'THE GREEN ROOM',
  tagline: "THE BAND'S SECRET STASH!",
  seconds: 18,
  danger: 1,
  reward: 'ticket',
  closes: true,
  waves: [
    { at: s(3), kind: 'grabber', count: 2, doors: 'far' },
    { at: s(8), kind: 'heckler', count: 1, doors: 'far' },
  ],
  props: [
    { kind: 'pedestal', x: 80, y: 64, prize: 'car' },
    { kind: 'pedestal', x: 240, y: 64, prize: 'laser' },
    { kind: 'pedestal', x: 80, y: 192, prize: 'toaster' },
    { kind: 'pedestal', x: 240, y: 192, prize: 'cash' },
    { kind: 'ticket', x: 160, y: 80, id: 'e3-greenroom' },
  ],
}

export const EPISODE_3: Episode = {
  number: 3,
  title: 'COUNTDOWN CONCERT',
  subtitle: 'THE MUSIC SHOW',
  set: 'concert',
  cols: 5,
  rows: 3,
  start: 'sound-check',
  midBoss: 'mosh-mascot',
  finale: 'the-jumbotron',
  rooms: [
    {
      id: 'sound-check',
      col: 0,
      row: 1,
      script: SOUND_CHECK,
      exits: ['front-row', 'merch-stand'],
    },
    {
      id: 'front-row',
      col: 0,
      row: 0,
      script: FRONT_ROW,
      exits: ['strobe-storm'],
    },
    {
      id: 'merch-stand',
      col: 0,
      row: 2,
      script: MERCH_STAND,
      exits: ['the-pit'],
    },
    {
      id: 'strobe-storm',
      col: 1,
      row: 0,
      script: STROBE_STORM,
      exits: ['gold-records'],
    },
    {
      id: 'the-pit',
      col: 1,
      row: 2,
      script: THE_PIT,
      exits: ['gold-records'],
    },
    {
      id: 'gold-records',
      col: 1,
      row: 1,
      script: GOLD_RECORDS,
      exits: ['mosh-mascot'],
    },
    {
      id: 'mosh-mascot',
      col: 2,
      row: 1,
      script: MOSH_MASCOT,
      exits: ['crowd-cam', 'encore-conga'],
    },
    {
      id: 'crowd-cam',
      col: 2,
      row: 0,
      script: CROWD_CAM,
      exits: ['sponsor-solo'],
    },
    {
      id: 'encore-conga',
      col: 2,
      row: 2,
      script: ENCORE_CONGA,
      exits: ['lightning-set'],
    },
    {
      id: 'sponsor-solo',
      col: 3,
      row: 0,
      script: SPONSOR_SOLO,
      exits: ['stage-invasion'],
    },
    {
      id: 'lightning-set',
      col: 3,
      row: 2,
      script: LIGHTNING_SET,
      exits: ['stage-invasion'],
    },
    {
      id: 'stage-invasion',
      col: 3,
      row: 1,
      script: STAGE_INVASION,
      exits: ['the-jumbotron'],
    },
    {
      id: 'the-jumbotron',
      col: 4,
      row: 1,
      script: THE_JUMBOTRON,
      exits: [],
    },
  ],
  secrets: { 'green-room': GREEN_ROOM },
}

/** The season in broadcast order. Episode 4 and the Live Finale are appended by a later slice. */
export const SEASON: readonly Episode[] = [EPISODE_1, EPISODE_2, EPISODE_3]

/** Every golden ticket the authored season places, by id. */
export function seasonTickets(season: readonly Episode[] = SEASON): string[] {
  const ids: string[] = []
  for (const episode of season) {
    const scripts = [
      ...episode.rooms.map((r) => r.script),
      ...Object.values(episode.secrets),
    ]
    for (const script of scripts) {
      if (script.ticket) ids.push(script.ticket)
      for (const prop of script.props ?? [])
        if (prop.kind === 'ticket') ids.push(prop.id)
    }
  }
  return ids
}
