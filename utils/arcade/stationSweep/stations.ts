// /utils/arcade/stationSweep/stations.ts
//
// The Orbit Line's stations as authored data (conductor kr-arcade/t-142, depth slice 2). A station
// is a stack of decks, each a corridor of its own length with doorways into side rooms, sacs on
// the floor and ceiling, and its station's hazards. Lift shafts run between decks wherever the
// layout puts them, and vents join a deck to the one above or below. Each station has a job, a
// clock, the families its sacs hatch, a Nest Mother in the middle deck's nest room, and (for the
// first two) a Queen behind a doorway on the bottom deck.
//
//   1  Greenhouse Ring  sprinklers that slick the floor, vine curtains that hide critters;
//                        the Seed Vault job; Mother Gloop.
//   2  Laundry Moon     conveyor floors, steam vents that hiss before they blow, washing-machine
//                        rooms that tumble critters out; the Spin Cycle job; the Laundry Kraken.
//
// Stations past the authored ones are laid out from the seed by `endlessStation`, in the same
// format, until the later slices author the rest of the Line.

import type { Family } from './critters'
import type { PickupTool } from './tools'

export type RoomKind =
  | 'closet'
  | 'cabin'
  | 'lab'
  | 'galley'
  | 'nest'
  | 'control'
  | 'washer'
  | 'vault'
  | 'boss'
export type DoorKind = RoomKind | 'vent'
/** A hazard a control room can switch off for the whole station. */
export type Switchable = 'sprinklers' | 'conveyors' | 'steam'
export type BossId = 'motherGloop' | 'kraken'
export type JobId = 'seedVault' | 'spinCycle'
export type LookId = 'greenhouse' | 'laundry' | 'steel'

export type Door = {
  x: number
  kind: DoorKind
  /** A vent's way: to the deck above or below (its partner grate is added there). */
  to?: 'up' | 'down'
  /** A supply closet's tool. */
  tool?: PickupTool
  /** A crew cabin's stranded crewmate. */
  crew?: string
  /** A lab with a mimic crate among its jars. */
  mimic?: boolean
  /** A nest room's sacs, and whether the Nest Mother guards it. */
  sacs?: number
  mother?: boolean
  /** What a control room switches off. */
  switches?: Switchable
  /** A washing-machine room's machines. */
  machines?: number
  /** A Queen's room. */
  boss?: BossId
}

export type Conveyor = { from: number; to: number; speed: number }

export type DeckPlan = {
  width: number
  doors: Door[]
  floorSacs: number[]
  ceilingSacs: number[]
  sprinklers?: number[]
  /** Spans hung with vine curtains, which hide what's behind them. */
  vines?: Array<[number, number]>
  conveyors?: Conveyor[]
  steamVents?: number[]
  mimics?: number[]
}

export type Shaft = { x: number; top: number; bottom: number }

export type StationPlan = {
  name: string
  look: LookId
  decks: DeckPlan[]
  shafts: Shaft[]
  /** Floor families its sacs hatch (ceiling sacs always drop crawlers). */
  hatch: readonly Family[]
  clockSecs: number
  job: JobId | null
  boss: BossId | null
}

export type RoomDef = {
  name: string
  /** The split screen's short name for it. */
  short: string
  width: number
  /** The doorway sign's letter, so a doorway never reads as a lift. */
  sign: string
  blurb: string
}

export const ROOMS: Record<RoomKind, RoomDef> = {
  closet: {
    short: 'CLOSET',
    name: 'SUPPLY CLOSET',
    width: 240,
    sign: 'T',
    blurb: 'A TOOL ON THE SHELF',
  },
  cabin: {
    short: 'CABIN',
    name: 'CREW CABIN',
    width: 260,
    sign: 'C',
    blurb: 'A CREWMATE TO WALK TO A LIFT: +10 SECONDS',
  },
  lab: {
    short: 'LAB',
    name: 'LAB',
    width: 300,
    sign: 'L',
    blurb: 'SPECIMEN JARS FOR POINTS. MIND THE CRATES',
  },
  galley: {
    short: 'GALLEY',
    name: 'GALLEY',
    width: 260,
    sign: 'G',
    blurb: 'SNACKS THAT TOP UP CHARGE',
  },
  nest: {
    short: 'NEST',
    name: 'NEST ROOM',
    width: 360,
    sign: 'N',
    blurb: 'A CLUSTER OF SACS',
  },
  control: {
    short: 'CONTROL',
    name: 'CONTROL ROOM',
    width: 240,
    sign: 'S',
    blurb: 'UP AT THE CONSOLE SWITCHES A HAZARD OFF',
  },
  washer: {
    short: 'WASH',
    name: 'WASH ROOM',
    width: 360,
    sign: 'W',
    blurb: 'MACHINES THAT TUMBLE CRITTERS OUT',
  },
  vault: {
    short: 'VAULT',
    name: 'SEED VAULT',
    width: 300,
    sign: 'V',
    blurb: 'THE SEEDS THE GREENHOUSE GROWS FROM',
  },
  boss: {
    short: 'QUEEN',
    name: 'THE QUEEN',
    width: 480,
    sign: '!',
    blurb: 'SHE WAITS HERE',
  },
}

/** Where a room's own door sits, by its left wall. */
export const ROOM_EXIT_X = 30

export const JOBS: Record<JobId, { name: string; blurb: string }> = {
  seedVault: {
    name: 'SEED VAULT',
    blurb: 'REACH THE SEED VAULT BEFORE THE GOO DOES',
  },
  spinCycle: {
    name: 'SPIN CYCLE',
    blurb: 'CLEAN EVERY ROOM WHILE THE CONVEYORS RUN',
  },
}

/** The goo's head start on the Seed Vault, in seconds. */
export const SEED_VAULT_SECS = 100

/** What a control room's console says it switches off. */
export const SWITCH_NAMES: Record<Switchable, string> = {
  sprinklers: 'SPRINKLERS',
  conveyors: 'CONVEYORS',
  steam: 'STEAM VENTS',
}

/**
 * Hazard timing. A sprinkler drips (its tell) before it mists, and its mist leaves the floor wet
 * and slick for a while; a steam vent hisses (its tell) before it blows.
 */
export const HAZARDS = {
  sprinkler: {
    period: 600,
    tell: 420,
    mist: 480,
    wetLife: 360,
    wetR: 34,
    /** How fast Mop's slide catches up with where it's walking, on a wet floor. */
    slip: 0.05,
  },
  steam: { period: 360, tell: 260, blow: 300, reach: 10, every: 6, damage: 2 },
} as const

/** Where a hazard at `x` is in its cycle: every one runs on the station clock, staggered. */
export function hazardPhase(tick: number, x: number, period: number): number {
  return (tick + Math.floor(x * 7)) % period
}

/** A stranded crewmate walked to a lift. */
export const CREW_RESCUE = {
  secs: 10,
  credits: 3,
  points: 2000,
  /** How close Mop must come to be followed, and how fast the crewmate keeps up. */
  reach: 18,
  follow: 1.6,
} as const

export const GREENHOUSE_RING: StationPlan = {
  name: 'GREENHOUSE RING',
  look: 'greenhouse',
  hatch: ['roller', 'biter', 'puffer'],
  clockSecs: 200,
  job: 'seedVault',
  boss: 'motherGloop',
  shafts: [
    { x: 180, top: 0, bottom: 2 },
    { x: 1100, top: 0, bottom: 1 },
  ],
  decks: [
    {
      width: 1600,
      doors: [
        { x: 520, kind: 'closet', tool: 'wide' },
        { x: 700, kind: 'vent', to: 'down' },
        { x: 860, kind: 'cabin', crew: 'SQUEEGEE' },
        { x: 1350, kind: 'lab' },
      ],
      floorSacs: [430, 980, 1260],
      ceilingSacs: [920],
      sprinklers: [400, 1000],
      vines: [[580, 660]],
    },
    {
      width: 1400,
      doors: [
        { x: 320, kind: 'galley' },
        { x: 560, kind: 'nest', sacs: 3, mother: true },
        { x: 900, kind: 'control', switches: 'sprinklers' },
        { x: 1260, kind: 'cabin', crew: 'DUSTY' },
      ],
      floorSacs: [420, 800, 1180],
      ceilingSacs: [480, 1000],
      sprinklers: [450, 1040],
      vines: [[960, 1060]],
    },
    {
      width: 1200,
      doors: [
        { x: 420, kind: 'vault' },
        { x: 700, kind: 'galley' },
        { x: 1000, kind: 'boss', boss: 'motherGloop' },
      ],
      floorSacs: [300, 580, 860],
      ceilingSacs: [500],
      sprinklers: [560],
      vines: [[760, 860]],
    },
  ],
}

export const LAUNDRY_MOON: StationPlan = {
  name: 'LAUNDRY MOON',
  look: 'laundry',
  hatch: ['roller', 'biter', 'puffer', 'gloop'],
  clockSecs: 240,
  job: 'spinCycle',
  boss: 'kraken',
  shafts: [
    { x: 180, top: 0, bottom: 3 },
    { x: 1150, top: 0, bottom: 2 },
  ],
  decks: [
    {
      width: 1300,
      doors: [
        { x: 480, kind: 'washer', machines: 2 },
        { x: 760, kind: 'closet', tool: 'foam' },
        { x: 980, kind: 'cabin', crew: 'BUBBLES' },
      ],
      floorSacs: [400, 880],
      ceilingSacs: [620],
      conveyors: [{ from: 280, to: 700, speed: 0.6 }],
      steamVents: [860],
      mimics: [1060],
    },
    {
      width: 1500,
      doors: [
        { x: 420, kind: 'lab', mimic: true },
        { x: 700, kind: 'control', switches: 'conveyors' },
        { x: 860, kind: 'vent', to: 'down' },
        { x: 1320, kind: 'galley' },
      ],
      floorSacs: [520, 1000, 1240],
      ceilingSacs: [760],
      conveyors: [{ from: 940, to: 1360, speed: -0.6 }],
      steamVents: [580, 1260],
    },
    {
      width: 1400,
      doors: [
        { x: 620, kind: 'nest', sacs: 3, mother: true },
        { x: 1000, kind: 'washer', machines: 2 },
        { x: 1300, kind: 'cabin', crew: 'TUMBLE' },
      ],
      floorSacs: [420, 920],
      ceilingSacs: [1080],
      conveyors: [{ from: 280, to: 560, speed: 0.7 }],
      steamVents: [780],
    },
    {
      width: 1100,
      doors: [
        { x: 420, kind: 'control', switches: 'steam' },
        { x: 820, kind: 'boss', boss: 'kraken' },
      ],
      floorSacs: [560],
      ceilingSacs: [640],
      conveyors: [{ from: 580, to: 740, speed: -0.5 }],
      steamVents: [300],
      mimics: [700],
    },
  ],
}

/** The authored stations, in order round the Line. */
export const ORBIT_LINE: readonly StationPlan[] = [
  GREENHOUSE_RING,
  LAUNDRY_MOON,
]

/** A deck's lift shafts, and which way each runs from it. */
export function liftsOn(
  plan: StationPlan,
  deck: number,
): Array<{ x: number; up: boolean; down: boolean }> {
  return plan.shafts
    .filter((s) => s.top <= deck && s.bottom >= deck)
    .map((s) => ({ x: s.x, up: s.top < deck, down: s.bottom > deck }))
}

/** Every deck's doors with each vent's partner grate added on the deck it leads to. */
export function doorsOn(plan: StationPlan, deck: number): Door[] {
  const own = plan.decks[deck]?.doors ?? []
  const partners: Door[] = []
  const above = plan.decks[deck - 1]?.doors ?? []
  const below = plan.decks[deck + 1]?.doors ?? []
  for (const d of above)
    if (d.kind === 'vent' && d.to === 'down')
      partners.push({ x: d.x, kind: 'vent', to: 'up' })
  for (const d of below)
    if (d.kind === 'vent' && d.to === 'up')
      partners.push({ x: d.x, kind: 'vent', to: 'down' })
  return [...own, ...partners].sort((a, b) => a.x - b.x)
}

/** The middle deck, where the Nest Mother guards her nest. */
export function middleDeck(plan: StationPlan): number {
  return Math.ceil((plan.decks.length - 1) / 2)
}

/** What's wrong with a plan, if anything: the checks every authored station passes. */
export function stationProblems(plan: StationPlan): string[] {
  const problems: string[] = []
  const n = plan.decks.length
  if (n < 3 || n > 5) problems.push(`${plan.name}: ${n} decks, not 3-5`)
  plan.decks.forEach((deck, d) => {
    const doors = doorsOn(plan, d)
    if (deck.doors.filter((x) => x.kind !== 'vent').length < 2)
      problems.push(`${plan.name} deck ${d + 1}: fewer than 2 doorways`)
    const lifts = liftsOn(plan, d)
    if (!lifts.length) problems.push(`${plan.name} deck ${d + 1}: no lift`)
    const spots = [
      ...lifts.map((l) => ({ x: l.x, what: 'lift' })),
      ...doors.map((x) => ({ x: x.x, what: x.kind })),
    ].sort((a, b) => a.x - b.x)
    for (let i = 1; i < spots.length; i++)
      if (spots[i]!.x - spots[i - 1]!.x < 60)
        problems.push(
          `${plan.name} deck ${d + 1}: ${spots[i - 1]!.what} and ${spots[i]!.what} crowd at ${spots[i]!.x}`,
        )
    for (const s of spots)
      if (s.x < 60 || s.x > deck.width - 60)
        problems.push(`${plan.name} deck ${d + 1}: ${s.what} at the end wall`)
    for (const x of [...deck.floorSacs, ...deck.ceilingSacs])
      if (x < 40 || x > deck.width - 40)
        problems.push(`${plan.name} deck ${d + 1}: a sac off the deck`)
    for (const x of deck.floorSacs)
      if (spots.some((s) => s.what === 'lift' && Math.abs(s.x - x) < 30))
        problems.push(`${plan.name} deck ${d + 1}: a sac in a lift`)
    for (const v of deck.doors)
      if (v.kind === 'vent') {
        const to = d + (v.to === 'up' ? -1 : 1)
        if (to < 0 || to >= n)
          problems.push(`${plan.name} deck ${d + 1}: a vent to nowhere`)
      }
  })
  // Every deck can be reached from the top one by lift.
  const reached = new Set([0])
  for (let pass = 0; pass < n; pass++)
    for (const s of plan.shafts)
      for (let d = s.top; d <= s.bottom; d++)
        if (reached.has(d))
          for (let e = s.top; e <= s.bottom; e++) reached.add(e)
  if (reached.size !== n) problems.push(`${plan.name}: a deck no lift reaches`)
  const all = plan.decks.flatMap((d) => d.doors)
  const mid = middleDeck(plan)
  if (!plan.decks[mid]!.doors.some((d) => d.kind === 'nest' && d.mother))
    problems.push(`${plan.name}: no Nest Mother on the middle deck`)
  if (plan.boss) {
    const bottom = plan.decks[n - 1]!
    if (!bottom.doors.some((d) => d.kind === 'boss' && d.boss === plan.boss))
      problems.push(`${plan.name}: the Queen isn't on the bottom deck`)
    if (
      plan.boss === 'motherGloop' &&
      !plan.decks[n - 2]!.doors.some((d) => d.kind === 'nest')
    )
      problems.push(`${plan.name}: no nest above for Mother Gloop to pour into`)
  }
  if (plan.job === 'seedVault' && !all.some((d) => d.kind === 'vault'))
    problems.push(`${plan.name}: no seed vault`)
  if (plan.job === 'spinCycle' && !plan.decks.some((d) => d.conveyors?.length))
    problems.push(`${plan.name}: no conveyors to spin`)
  return problems
}

const ENDLESS_LIFTS = [180, 1100]
const ENDLESS_DOORS = [440, 780]

/**
 * A station past the authored ones, laid out from the dice: three or four decks of steel
 * corridor, a closet, galley or cabin or two on each, the Nest Mother's nest on the middle deck,
 * and lifts at both ends.
 */
export function endlessStation(
  station: number,
  rng: () => number,
): StationPlan {
  const n = Math.min(4, 3 + Math.floor((station - 3) / 2))
  const crew = ['MOPPET', 'SPONGE', 'WHISK', 'BUFF', 'POLISH']
  const decks: DeckPlan[] = []
  for (let d = 0; d < n; d++) {
    const width = 1300 + Math.floor(rng() * 4) * 100
    const kinds: RoomKind[] =
      d === Math.ceil((n - 1) / 2)
        ? ['nest', rng() < 0.5 ? 'galley' : 'closet']
        : [rng() < 0.5 ? 'closet' : 'lab', rng() < 0.5 ? 'galley' : 'cabin']
    const doors: Door[] = kinds.map((kind, i) => {
      const x = ENDLESS_DOORS[i]!
      if (kind === 'nest') return { x, kind, sacs: 3, mother: true }
      if (kind === 'cabin')
        return { x, kind, crew: crew[(station + d) % crew.length]! }
      return { x, kind }
    })
    const sacs = Math.min(6, 2 + Math.floor(station / 2))
    const floorSacs = Array.from({ length: sacs }, (_, i) => {
      const x = Math.round(
        260 + ((width - 520) * (i + 0.3 + rng() * 0.4)) / sacs,
      )
      const lift = ENDLESS_LIFTS.find((l) => Math.abs(l - x) < 30)
      return lift === undefined ? x : lift + (x < lift ? -40 : 40)
    })
    const ceilingSacs = [Math.round(width / 2 + (rng() - 0.5) * 300)]
    decks.push({ width, doors, floorSacs, ceilingSacs })
  }
  return {
    name: `STATION ${station}`,
    look: 'steel',
    hatch: ['roller', 'biter', 'puffer', 'gloop'],
    clockSecs: 60 + 40 * n,
    job: null,
    boss: null,
    shafts: ENDLESS_LIFTS.map((x) => ({ x, top: 0, bottom: n - 1 })),
    decks,
  }
}
