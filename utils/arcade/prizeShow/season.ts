// /utils/arcade/prizeShow/season.ts
//
// Prize Show Panic's broadcast season (conductor kr-arcade t-026, depth-pass/ASSESSMENT.md section 2).
// The season is data: episodes are maps of rooms on a grid, every room runs a script (which doors
// open when, which crashers come through, what props sit on the floor), and the game in
// games/prizeShowPanic.ts only plays what is written here. Episode 1, Opening Night, is fully
// authored; episodes 2-4 and the Live Finale are appended to SEASON by later slices. After the last
// authored episode the season loops with harder curves (LOOP_CURVES) and rolled room modifiers, so a
// run still ends.
//
// Crashers come from the roster (roster.ts) and power-ups from the arsenal (arsenal.ts). Kinds that
// belong to episodes 2-4 debut in Opening Night's Encore loops (`encore` waves) until those episodes
// are authored.
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

export type ModifierId =
  | 'lights-out'
  | 'foam'
  | 'confetti-storm'
  | 'double-time'
  | 'audience'
  | 'sudden-death'

export type BossScript = {
  /** Confetti hits at loop 1; LOOP_CURVES.bossHp scales it. */
  hp: number
  /** Health fraction where the cake's candles light (phase 2). */
  phase2At: number
  title: string
  sub: string
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
}

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
  count: { start: 1, step: 0.35, limit: 2.5 },
  /** Waves arrive sooner. */
  waveTime: { start: 1, step: -0.1, limit: 0.6 },
  /** Less time on the clock. */
  clock: { start: 1, step: -0.08, limit: 0.62 },
  bossHp: { start: 1, step: 0.6, limit: 4 },
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
    hp: 60,
    phase2At: 0.5,
    title: 'PARADE FLOAT!',
    sub: 'CONFETTI IT INTO A PARTY',
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
  tagline: 'THE FLOAT IS BACK, AND BIGGER',
  seconds: 90,
  danger: 5,
  reward: 'car',
  waves: [
    { at: s(15), kind: 'grabber', count: 2, doors: 'flanks' },
    { at: s(30), kind: 'bouncer', count: 1, doors: 'flanks' },
    { at: s(45), kind: 'grabber', count: 2, doors: 'flanks' },
  ],
  props: [{ kind: 'boom', every: 520, offset: 100 }],
  boss: {
    hp: 110,
    phase2At: 0.5,
    title: 'GRAND FINALE!',
    sub: 'THE FLOAT IS BACK, AND BIGGER',
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

/** The season in broadcast order. Later slices append episodes 2-4 and the Live Finale. */
export const SEASON: readonly Episode[] = [EPISODE_1]

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
