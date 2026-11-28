// /utils/arcade/games/ribbonRiders.ts
//
// Ribbon Riders -- the Kind Robots Arcade's Tron light-cycles riff (conductor kr-arcade/t-009,
// deepened in m8 as The Lantern Festival Circuit). Ride a light-bike that unrolls a glowing
// rainbow ribbon. Anyone who bumps into a ribbon, a lamp post or the wall is out of the round.
//
// The ribbon is more than a wall: close a loop and it gift-wraps whatever is inside, pickups and
// rival riders alike, who pop out tied in a bow and sit the round out. Riding close beside any
// ribbon is a slipstream that refills turbo and builds a chain; a late turn off a ribbon is a
// near-miss whisker. Hold A for turbo and B to brake. Each rival crew rides by its own
// personality (rivals.ts), and the arenas are data (ribbonRiders/arenas.ts).
//
// The Festival (t-075) tours the fairgrounds (ribbonRiders/fairgrounds.ts): pick the next event
// on the Festival Board, play its objective, beat each fairground's Grand Marshal (marshals.ts),
// spend tickets at the Paint Shop between fairgrounds, and pick up again at the last fairground
// started (festival.ts). The Midway is the endless circuit of slice 1, and the attract demo's.

import { levelCurve } from '../curve'
import { drawText } from '../font'
import {
  INK,
  RAMPS,
  Sparkles,
  backdropRng,
  bandedGradient,
  bevel,
  cachedLayer,
  drawSprite,
  dropShadow,
  gauge,
  glow,
  hudPanel,
  mix,
  pixelSprite,
  rgba,
  shadedOrb,
  vignette,
  type PixelSprite,
  type Ramp,
} from '../snes'
import type { MusicLoop } from '../sound'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'
import {
  ARENA_Y,
  CELL,
  DX,
  DY,
  GRID,
  H,
  T,
  W,
  idx,
  isPad,
  isConveyor,
  reverse,
  turnLeft,
  turnRight,
  type Dir,
} from '../ribbonRiders/grid'
import {
  DEFAULT_PICKUPS,
  BELL_TICKS,
  CONVEYOR_CELLS,
  SPIRAL_STEP,
  MAX_LIT_PICKUPS,
  MELT_TICKS,
  MIDWAY,
  RIDER_SPAWNS,
  RIVAL_SPAWNS,
  buildArena,
  gateOpen,
  gateWarning,
  horseCells,
  type ArenaSpec,
  type BuiltArena,
  type Spawn,
} from '../ribbonRiders/arenas'
import {
  FLOORS,
  GLOWBUG,
  HEART,
  LANTERN,
  MIRROR_RAMPS,
  RAINBOW_RAMPS,
  SEAT_COLOURS,
  STAR,
  TICKET,
  bikeArt,
  bowSprite,
  pickupIcon,
  presentSprite,
  rampOf,
} from '../ribbonRiders/art'
import { BEAT_TICKS, MARSHAL_MUSIC, MIDWAY_MUSIC } from '../ribbonRiders/music'
import {
  FAIRGROUNDS,
  OBJECTIVES,
  SECRET_FAIR_INDEX,
  fairgroundAt,
  arenaById,
  encoreArena,
  openEvents,
  outlineCells,
  rectCells,
  type FairArena,
  type Fairground,
} from '../ribbonRiders/fairgrounds'
import {
  MAX_LIVES,
  MAX_TICKETS,
  SHOP,
  SPOOL_STEP,
  buy,
  clearTickets,
  hasAllGoldenBows,
  newKit,
  readGoldenBows,
  readFestivalSave,
  shopBlock,
  type FestivalSave,
  type Kit,
} from '../ribbonRiders/festival'
import {
  horseSprite,
  makeMarshal,
  type Marshal,
  type MarshalHost,
} from '../ribbonRiders/marshals'
import {
  ERASER_CELLS,
  FREEZE_TICKS,
  MAX_SNIPS,
  PICKUPS,
  PICKUP_LIFE,
  SPOOL_TICKS,
  rollPickup,
  type PickupKind,
} from '../ribbonRiders/pickups'
import {
  FLOOD_LIMIT,
  HUG_BOOST,
  RIVALS,
  besideSolid,
  steer,
  steerPair,
  type RivalKind,
  type SteerCtx,
} from '../ribbonRiders/rivals'
import { bowCell, findWraps } from '../ribbonRiders/wrap'

const START_LIVES = 3
const READY_TICKS = 120
const DEATH_TICKS = 90
const ROUND_CLEAR_TICKS = 150
const FADE_TICKS = 40
export const TURBO_MAX = 120
/** Turbo and brake as multiples of the round's pace. */
export const TURBO_SPEED = 1.8
export const BRAKE_SPEED = 0.5
const EXTRA_EVERY = 25_000

/** The largest loop that wraps (a Bow doubles the next one). */
export const WRAP_LIMIT = 160
/** Points per wrapped cell, before the slipstream multiplier and the wrap chain. */
export const WRAP_CELL_POINTS = 5
/** Two wraps this close together chain. */
export const WRAP_CHAIN_TICKS = 180
/** A slipstream chain survives this many ticks out of the slipstream. */
export const CHAIN_IDLE_TICKS = 40
/** Turbo refilled per slipstream cell. */
export const SLIP_REFILL = 3
/** Own ribbon this recent never counts as a slipstream (it is the tail just behind you). */
const OWN_TAIL = 6
export const WHISKER_POINTS = 100

const RIDER_IDS = 4
/** Bike ids: riders 1..4, rivals from 5. */
const FIRST_RIVAL_ID = RIDER_IDS + 1

export const RIBBON_CURVES = {
  /** Cells per tick at the round's pace. */
  speed: { start: 0.2, step: 0.008, limit: 0.3 },
  /** How hard the crews press their personalities (0..1). */
  cunning: { start: 0.2, step: 0.1, limit: 1 },
} as const

/** Rivals a lap adds to an arena's crew, in turn. */
const LAP_EXTRAS: readonly RivalKind[] = ['cutter', 'hugger', 'dasher', 'pacer']
const MAX_CREW = 6

/** Ticks before a rival that bumped itself reboots, where the objective needs it back. */
export const REBOOT_TICKS = 100
/** Where a Tandem's partner rides: two cells across and two back, so their ribbons run side by side. */
const TANDEM_OFFSET = 2
/** Glowbugs drift this many cells a tick. */
const BUG_SPEED = 0.035
/** A festival arena clear's score bonus per tier; a Grand Marshal's per fairground. */
const ARENA_BONUS = 1000
const MARSHAL_BONUS = 15000
const PHASE_BONUS = 3000
/** Tag Lap racers ride at this share of the round's pace. */
const TAG_LAP_PACE = 0.88

type Mode = 'midway' | 'festival'
type MenuKind = 'title' | 'board' | 'shop' | 'credits'
type TitleChoice = 'continue' | 'new' | 'midway' | 'encore' | 'spool'
type Menu = { kind: MenuKind; cursor: number; ticks: number; note: string }
type Glowbug = { x: number; y: number; vx: number; vy: number }

/** The slipstream multiplier a chain this long pays (x1..x5). */
export function slipMultiplier(chain: number): number {
  return 1 + Math.min(4, Math.floor(chain / 16))
}

export type Bike = {
  id: number
  /** A rider's seat (0..3), or -1 for a rival. */
  seat: number
  kind: RivalKind | null
  x: number
  y: number
  dir: Dir
  want: Dir
  acc: number
  /** Cells per tick this tick. */
  speed: number
  alive: boolean
  /** Out tied in a bow (wrapped), not crashed. */
  wrapped: boolean
  /** Ticks left on an out bike's fading ribbon. */
  fade: number
  colour: string
  laid: number
  /** Ticks left of a lean into the last turn, and its side (-1 left, 1 right). */
  lean: number
  leanSide: number
  /** Cells ridden, which turns the wheels. */
  wheel: number
  hugging: boolean
  /** The Dasher's next cell is a gap. */
  dash: boolean
  /** Where it lined up, for a reboot. */
  spawn: Spawn
  /** A Tandem's partner bike (0 for none); the leader steers both. */
  partner: number
  lead: boolean
  /** A turn queued on ice: it slides one more cell first. */
  skid: boolean
  conveyorSteps?: number
  /** Ticks to a reboot after a bump, 0 for none. */
  reboot: number
  /** Glowbugs collected, and the next Tag Lap arch. */
  bugs: number
  arch: number
  // A rider's kit.
  turbo: number
  boosting: boolean
  braking: boolean
  snips: number
  spool: number
  bow: boolean
  chain: number
  chainIdle: number
  bestChain: number
  whiskers: number
  wraps: number
  wrapCombo: number
  wrapTimer: number
}

type Pickup = { x: number; y: number; kind: PickupKind; life: number }
type Wrap = {
  cells: number[]
  bow: number
  colour: string
  seat: number
  born: number
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
type Banner = { text: string; sub?: string; lines?: string[]; ticks: number }
type Ring = { x: number; y: number; life: number; colour: string }
const RING_TICKS = 22

function newBike(
  id: number,
  seat: number,
  kind: RivalKind | null,
  spawn: readonly [number, number, Dir],
  colour: string,
): Bike {
  const [x, y, dir] = spawn
  return {
    id,
    seat,
    kind,
    x,
    y,
    dir,
    want: dir,
    acc: 0,
    speed: 0,
    alive: true,
    wrapped: false,
    fade: 0,
    colour,
    laid: 0,
    lean: 0,
    leanSide: 1,
    wheel: 0,
    hugging: false,
    dash: false,
    spawn,
    partner: 0,
    lead: false,
    skid: false,
    reboot: 0,
    bugs: 0,
    arch: 0,
    turbo: TURBO_MAX,
    boosting: false,
    braking: false,
    snips: 0,
    spool: 0,
    bow: false,
    chain: 0,
    chainIdle: 0,
    bestChain: 0,
    whiskers: 0,
    wraps: 0,
    wrapCombo: 0,
    wrapTimer: 0,
  }
}

function blankFrame(): InputFrame {
  const held = {
    up: false,
    down: false,
    left: false,
    right: false,
    a: false,
    b: false,
    start: false,
  }
  return { held, pressed: { ...held } }
}

/**
 * Rects queued by fill colour and drawn as one path each, so a few thousand ribbon pixels
 * cost a handful of fills a frame.
 */
class RectBatch {
  private queues = new Map<string, number[]>()

  add(colour: string, x: number, y: number, w: number, h: number) {
    let q = this.queues.get(colour)
    if (!q) {
      q = []
      this.queues.set(colour, q)
    }
    q.push(x, y, w, h)
  }

  flush(g: CanvasRenderingContext2D) {
    for (const [colour, q] of this.queues) {
      if (!q.length) continue
      g.fillStyle = colour
      g.beginPath()
      for (let i = 0; i < q.length; i += 4) {
        g.rect(q[i]!, q[i + 1]!, q[i + 2]!, q[i + 3]!)
      }
      g.fill()
      q.length = 0
    }
  }
}

/** One batch per shading pass, drawn in this order: outline, glow, body, lit, shade, core. */
const PASSES = {
  outline: new RectBatch(),
  glow: new RectBatch(),
  body: new RectBatch(),
  lit: new RectBatch(),
  shade: new RectBatch(),
  core: new RectBatch(),
}

/** A fixed per-cell value in 0..1, for a fading ribbon's dissolve. */
function cellNoise(i: number): number {
  return ((Math.imul(i + 1, 2654435761) >>> 8) % 1000) / 1000
}

const TILE = CELL * 8

const ARROW = ['..a..', '.aaa.', 'aaaaa', '..a..', '..a..']
const arrowCache = new Map<string, PixelSprite>()

/** A turn pad's glowing arrow, pointing its way. */
function padArrow(d: Dir, colour: string): PixelSprite {
  const key = `${d}|${colour}`
  let sprite = arrowCache.get(key)
  if (!sprite) {
    let rows = ARROW
    for (let k = 0; k < d; k++) {
      // A quarter turn clockwise.
      rows = rows[0]!.split('').map((_, x) =>
        rows
          .map((r) => r[x]!)
          .reverse()
          .join(''),
      )
    }
    sprite = pixelSprite(rows, { a: colour }, { outline: null })
    arrowCache.set(key, sprite)
  }
  return sprite
}

class RibbonRiders implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  /** Ticks this round has been rolling (the beat counts from here). */
  private roundTicks = 0
  private arena: BuiltArena = buildArena(MIDWAY[0]!)
  /** Who owns each cell: 0, or a bike id. */
  private cells = new Uint8Array(GRID * GRID)
  /** 1 where a cell is part of a wrap (a gift, not a ribbon). */
  private fill = new Uint8Array(GRID * GRID)
  /** The order each cell was laid in, for the rainbow, the tube links and the Eraser. */
  private order = new Uint32Array(GRID * GRID)
  private ribbonBorn = new Uint32Array(GRID * GRID)
  private bikes: Bike[] = []
  private pickups: Pickup[] = []
  private pickupTimer = 0
  private wraps: Wrap[] = []
  private margin = 0
  private shrinkTimer = 0
  private spiralCount = 0
  private bellUntil = 0
  private freeze = 0
  private ready = 0
  private dead = 0
  private roundClear = 0
  private distance = 0
  private nextExtra = EXTRA_EVERY
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: Banner | null = null
  /** Cosmetic only: sparkles, chips and shock rings, on their own rng so play stays seeded. */
  private fx = new Sparkles()
  private fxRng = backdropRng(47)
  private rings: Ring[] = []
  /** Rival kinds already met, so each one's tell is shown on its first card only. */
  private seenKinds = new Set<RivalKind>()

  // The Festival (t-075).
  private mode: Mode = 'midway'
  private menu: Menu | null = null
  private titleChoices: TitleChoice[] = []
  private fair = 0
  /** Events cleared on this fairground's board. */
  private cleared = new Set<string>()
  /** The festival arena being played, or null on the Midway. */
  private node: FairArena | null = null
  private tickets = 0
  private kit: Kit = newKit()
  private continued = false
  private champion = false
  private goldenBows: string[] = []
  private trueChampion = false
  private trueEnding = false
  private encore = false
  /** The festival kept on this device (written at each fairground's start). */
  private savePoint: FestivalSave | null = null
  private offer: FestivalSave | null = null
  /** Cells solid this tick that are not terrain: horses, a Marshal's ring, its body (2: not a wrap side). */
  private dyn = new Uint8Array(GRID * GRID)
  private carouselStep = 0
  /** Cells about to turn solid (a horse's next step, a Marshal's tells), for lookahead. */
  private soon = new Uint8Array(GRID * GRID)
  private marshal: Marshal | null = null
  /** Objective state: the clock, rivals wrapped, glowbugs, the art outline, the arches. */
  private timeLeft = 0
  private wrappedCount = 0
  private kidWrapped = false
  private bugs: Glowbug[] = []
  private outline: number[] = []
  private traced = new Uint8Array(GRID * GRID)
  private tracedCount = 0
  private arches: number[][] = []
  private escortHits = 0
  private escortLastX = 4

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    const stored = this.demo ? null : readFestivalSave(options.resume)
    if (stored) {
      this.savePoint = stored
      this.champion = stored.champion
      this.goldenBows = readGoldenBows(stored.goldenBows)
      this.trueChampion = stored.trueChampion === true
      this.offer = stored
    }
    this.startRound(1)
    // The title opens over the Midway's first round; starting any round (as staging does) closes it.
    if (options.selectScreen && !this.demo) this.openTitle()
  }

  get music(): MusicLoop | null {
    if (this.demo || this.over) return null
    if (this.menu?.kind === 'title') return null
    if (this.mode === 'midway') return MIDWAY_MUSIC
    if (this.marshal && !this.menu) return MARSHAL_MUSIC
    return this.fairground.music
  }

  /** The festival kept on this device: written at each fairground's start, never by the demo. */
  get save(): FestivalSave | null | undefined {
    return this.demo ? undefined : this.savePoint
  }

  /** The title, the Festival Board or the Paint Shop is up. */
  get menuOpen(): boolean {
    return this.menu !== null
  }

  private get fairground(): Fairground {
    return fairgroundAt(this.fair)
  }

  private get player(): Bike {
    return this.bikes[0]!
  }

  private get riders(): Bike[] {
    return this.bikes.filter((b) => b.seat >= 0)
  }

  private get rivals(): Bike[] {
    return this.bikes.filter((b) => b.seat < 0)
  }

  private get beat(): number {
    return Math.floor(this.roundTicks / BEAT_TICKS)
  }

  // --- setup -------------------------------------------------------------------

  /** A round of the Midway: the endless circuit, a lap harder each time round. */
  private startRound(round: number) {
    this.mode = 'midway'
    this.node = null
    this.menu = null
    const spec = MIDWAY[(round - 1) % MIDWAY.length]!
    const lap = Math.floor((round - 1) / MIDWAY.length)
    const crew = [...spec.crew]
    for (let i = 0; i < lap && crew.length < MAX_CREW; i++)
      crew.push(LAP_EXTRAS[i % LAP_EXTRAS.length]!)
    this.setupArena(spec, round, crew)
    const fresh = this.freshKind(crew)
    this.banner = {
      text: spec.name,
      sub: `ROUND ${round}   ${this.crewNames(crew)}`,
      lines: fresh
        ? [`${RIVALS[fresh].name}: ${RIVALS[fresh].tell}`, RIVALS[fresh].answer]
        : ['CLOSE A LOOP TO WRAP A RIVAL'],
      ticks: this.ready,
    }
  }

  /** A festival event: its arena, crew and objective (a Grand Marshal for the last). */
  private playArena(a: FairArena) {
    this.mode = 'festival'
    this.node = a
    if (this.encore) a = encoreArena(a)
    this.setupArena(a, a.tier, [...a.crew])
    if (this.kit.snip) this.player.snips = Math.max(1, this.player.snips)
    this.timeLeft = a.limit ?? 0
    this.escortHits = 0
    this.escortLastX = 4
    if (a.glowbugs) {
      for (let k = 0; k < a.glowbugs.lit; k++) this.spawnBug()
    }
    if (a.art) this.outline = outlineCells(a.art.corners)
    if (a.arches) this.arches = a.arches.map(rectCells)
    if (a.marshal) {
      this.marshal = makeMarshal(a.marshal, this.marshalHost())
      this.paintDyn()
    }
    const objective = OBJECTIVES[a.objective]
    const fresh = this.freshKind(a.crew)
    const lines = [objective.about]
    if (fresh) lines.push(`${RIVALS[fresh].name}: ${RIVALS[fresh].tell}`)
    else lines.push(a.intro)
    this.banner = {
      text: a.marshal ? this.marshal!.name : a.name,
      sub: objective.name,
      lines,
      ticks: this.ready,
    }
  }

  private crewNames(crew: readonly RivalKind[]): string {
    return [...new Set(crew)].map((k) => RIVALS[k].name).join(' ')
  }

  /** The first kind in this crew not met before (its tell goes on the card). */
  private freshKind(crew: readonly RivalKind[]): RivalKind | undefined {
    const fresh = [...new Set(crew)].find((k) => !this.seenKinds.has(k))
    for (const k of crew) this.seenKinds.add(k)
    return fresh
  }

  /** Lay out an arena and line up the riders and the crew. */
  private setupArena(spec: ArenaSpec, level: number, crew: RivalKind[]) {
    this.level = level
    this.arena = buildArena(spec)
    this.cells.fill(0)
    this.fill.fill(0)
    this.order.fill(0)
    this.ribbonBorn.fill(0)
    this.dyn.fill(0)
    this.traced.fill(0)
    this.tracedCount = 0
    this.outline = []
    this.arches = []
    this.bugs = []
    this.wrappedCount = 0
    this.kidWrapped = false
    this.timeLeft = 0
    this.marshal = null
    this.carouselStep = 0
    this.wraps = []
    this.pickups = []
    this.pickupTimer = spec.pickups?.first ?? DEFAULT_PICKUPS.first
    this.margin = 0
    this.spiralCount = 0
    this.bellUntil = 0
    this.shrinkTimer = this.shrinkEvery()
    this.freeze = 0
    this.roundTicks = 0
    const old = this.bikes[0]
    const rider = newBike(1, 0, null, RIDER_SPAWNS[0]!, SEAT_COLOURS[0]!)
    if (old) {
      // A rider's kit is the rider's, not the round's: snips and chains ride on.
      rider.snips = old.snips
    }
    this.bikes = [rider]
    const spawns = spec.rivalSpawns ?? RIVAL_SPAWNS
    let id = FIRST_RIVAL_ID
    crew.forEach((kind, i) => {
      const spawn = spawns[i] ?? RIVAL_SPAWNS[i % RIVAL_SPAWNS.length]!
      const lead = newBike(id++, -1, kind, spawn, RIVALS[kind].colour)
      this.bikes.push(lead)
      if (!RIVALS[kind].pair) return
      // The partner rides two across and two back, so both ribbons run parallel whichever way.
      const [x, y, d] = spawn
      const side = turnRight(d)
      const px = x + (DX[side] - DX[d]) * TANDEM_OFFSET
      const py = y + (DY[side] - DY[d]) * TANDEM_OFFSET
      const mate = newBike(id++, -1, kind, [px, py, d], RIVALS[kind].colour)
      lead.lead = true
      lead.partner = mate.id
      mate.partner = lead.id
      this.bikes.push(mate)
    })
    for (const b of this.bikes) this.lay(b)
    this.paintDyn()
    this.ready = this.demo ? 60 : READY_TICKS
  }

  private shrinkEvery(): number {
    const s = this.arena.spec.shrink
    if (!s) return Infinity
    const lap = Math.floor((this.level - 1) / MIDWAY.length)
    return Math.max(300, Math.round(s.every * (1 - 0.06 * lap)))
  }

  /** The cell one step from (x, y), across a wrapping edge, or null off the board. */
  private next(x: number, y: number, d: Dir): [number, number] | null {
    let nx = x + DX[d]
    let ny = y + DY[d]
    const wrap = this.arena.spec.wrap
    if (nx < 0 || nx >= GRID) {
      if (!wrap?.x) return null
      nx = (nx + GRID) % GRID
    }
    if (ny < 0 || ny >= GRID) {
      if (!wrap?.y) return null
      ny = (ny + GRID) % GRID
    }
    return [nx, ny]
  }

  /** Inside the closing wall? */
  private inside(x: number, y: number, m = this.margin): boolean {
    return x >= m && y >= m && x < GRID - m && y < GRID - m
  }

  /**
   * Solid terrain on this cell right now (lookahead: a gate about to shut counts): lamp posts,
   * shut gates, standing snowbanks, carousel horses and a Marshal's pieces.
   */
  private terrainSolid(i: number, lookahead = false): boolean {
    if (this.dyn[i]) return true
    if (lookahead && this.soon[i]) return true
    const rank = this.arena.spiralRank[i]!
    if (
      rank >= 0 &&
      rank <
        this.spiralCount +
          (lookahead && this.shrinkTimer < 90 ? SPIRAL_STEP : 0)
    )
      return true
    const t = this.arena.terrain[i]!
    if (t === T.PILLAR || t === T.SNOW) return true
    if (t === T.GATE) {
      const gate = this.arena.gates[this.arena.gateAt[i]!]!
      if (!gateOpen(gate, this.beat)) return true
      return lookahead && gateWarning(gate, this.beat)
    }
    return false
  }

  /** A side for a wrap: solid terrain, except a Marshal's target (dyn 2), which a loop can take. */
  private sideSolid(i: number): boolean {
    if (this.dyn[i] === 2) return false
    return this.terrainSolid(i)
  }

  private blocked(x: number, y: number, lookahead = false): boolean {
    // Riders who can see the wall flashing keep clear of the next line in.
    const m =
      this.margin +
      (this.arena.spec.shrink?.shape !== 'spiral' &&
      lookahead &&
      this.shrinkTimer < 90
        ? 1
        : 0)
    if (!this.inside(x, y, m)) return true
    const i = idx(x, y)
    return this.cells[i] !== 0 || this.terrainSolid(i, lookahead)
  }

  /** Blocked for a Snowplow: ribbons are no wall to it, but gifts, terrain and bikes are. */
  private plowBlocked(x: number, y: number, lookahead = false): boolean {
    const m =
      this.margin +
      (this.arena.spec.shrink?.shape !== 'spiral' &&
      lookahead &&
      this.shrinkTimer < 90
        ? 1
        : 0)
    if (!this.inside(x, y, m)) return true
    const i = idx(x, y)
    if (this.fill[i] || this.terrainSolid(i, lookahead)) return true
    return this.bikes.some(
      (o) => o.alive && o.x === x && o.y === y && !this.harmless(o),
    )
  }

  private harmless(b: Bike): boolean {
    return b.kind !== null && RIVALS[b.kind].harmless === true
  }

  private lay(b: Bike, x = b.x, y = b.y, order = b.laid++) {
    // The Lantern Kid lays no ribbon at all.
    if (this.harmless(b)) return
    const i = idx(x, y)
    this.cells[i] = b.id
    this.fill[i] = 0
    this.order[i] = order
    this.ribbonBorn[i] = this.roundTicks
    this.brushSnow(x, y)
  }

  /** A ribbon laid beside a standing snowbank starts it melting. */
  private brushSnow(x: number, y: number) {
    const { banks, bankAt, terrain } = this.arena
    if (!banks.length) return
    for (let d = 0; d < 4; d++) {
      const nx = x + DX[d]!
      const ny = y + DY[d]!
      if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) continue
      const k = idx(nx, ny)
      if (terrain[k] !== T.SNOW) continue
      const bank = banks[bankAt[k]!]
      if (bank && bank.melt < 0) {
        bank.melt = MELT_TICKS
        this.sound.play('blip')
      }
    }
  }

  /** Melt a bank to floor now. */
  private meltBank(bankIndex: number) {
    const bank = this.arena.banks[bankIndex]
    if (!bank) return
    bank.melt = 0
    for (const i of bank.cells) {
      if (this.arena.terrain[i] !== T.SNOW) continue
      this.arena.terrain[i] = T.FLOOR
      const px = (i % GRID) * CELL + CELL / 2
      const py = ARENA_Y + Math.floor(i / GRID) * CELL + CELL / 2
      this.fx.burst(px, py, this.fxRng, {
        count: 2,
        colours: ['#ffffff', RAMPS.sky[4]],
        speed: 0.8,
      })
    }
    this.sound.play('pop')
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    if (this.menu) {
      this.updateMenu(input)
      return
    }
    const controls = this.demo ? this.demoInput() : input
    this.updateFades()

    if (this.roundClear > 0) {
      if (--this.roundClear === 0) this.afterClear()
      return
    }
    if (this.dead > 0) {
      if (--this.dead === 0) {
        if (this.lives <= 0) this.gameOver()
        else if (this.node) this.playArena(this.node)
        else this.startRound(this.level)
      }
      return
    }
    this.steerRider(this.player, controls)
    if (this.ready > 0) {
      this.ready--
      return
    }
    const beat = this.beat
    this.roundTicks++
    this.expireRibbons()
    if (this.beat !== beat) this.onBeat()

    for (const r of this.riders) this.runKit(r)
    if (--this.shrinkTimer <= 0) this.shrink()
    if (this.freeze > 0) this.freeze--
    this.updatePickups()
    this.updateTerrain()
    this.updateBugs()
    if (this.timeLeft > 0) this.timeLeft--

    const pace = levelCurve(this.level, RIBBON_CURVES.speed)
    for (const b of this.bikes) {
      if (!b.alive) continue
      b.speed = this.speedOf(b, pace)
      if (b.seat < 0 && this.freeze > 0) continue
      b.acc += b.speed
      if (b.lean > 0) b.lean--
    }
    // A Tandem's two bikes keep step: the partner rides at its leader's pace.
    for (const b of this.bikes) {
      const lead = this.partnerOf(b)
      if (b.alive && lead && lead.lead && lead.alive) b.acc = lead.acc
    }
    // Step the bikes a cell at a time, together, so head-on meetings are fair.
    while (this.bikes.some((b) => b.alive && b.acc >= 1)) {
      this.stepBikes(this.bikes.filter((b) => b.alive && b.acc >= 1))
      if (!this.player.alive) break
    }
    this.updateReboots()
    this.checkRoundOver()
  }

  /** Comet tails expire in simulation time, never erasing gifts or live bike heads. */
  private expireRibbons() {
    const lifetime = this.arena.spec.ribbonLifetime
    if (!lifetime || this.roundTicks < lifetime) return
    const heads = new Set(
      this.bikes.filter((b) => b.alive).map((b) => idx(b.x, b.y)),
    )
    for (let i = 0; i < this.cells.length; i++) {
      if (!this.cells[i] || this.fill[i] || heads.has(i)) continue
      if (this.roundTicks - this.ribbonBorn[i]! >= lifetime) this.cells[i] = 0
    }
  }

  private partnerOf(b: Bike): Bike | null {
    if (!b.partner) return null
    return this.bikes.find((o) => o.id === b.partner) ?? null
  }

  /** Snowbanks melting, the carousel turning, the Marshal at work: this tick's solid cells. */
  private updateTerrain() {
    for (let k = 0; k < this.arena.banks.length; k++) {
      const bank = this.arena.banks[k]!
      if (bank.melt > 0 && --bank.melt === 0) this.meltBank(k)
    }
    const c = this.arena.spec.carousel
    if (c && this.roundTicks % c.every === 0) {
      this.carouselStep++
      // A horse trots onto a cell: a bike's head there is bumped, a ribbon is trampled.
      for (const i of horseCells(c, this.carouselStep)) {
        for (const b of this.bikes) {
          if (b.alive && idx(b.x, b.y) === i && !this.harmless(b)) this.crash(b)
        }
        this.cells[i] = 0
        this.fill[i] = 0
      }
    }
    if (this.marshal && this.freeze === 0) this.marshal.update()
    this.paintDyn()
  }

  private paintDyn() {
    this.dyn.fill(0)
    this.soon.fill(0)
    const c = this.arena.spec.carousel
    if (c) {
      for (const i of horseCells(c, this.carouselStep)) this.dyn[i] = 1
      for (const i of horseCells(c, this.carouselStep + 1)) this.soon[i] = 1
    }
    if (!this.marshal) return
    this.marshal.paint(this.dyn)
    for (const i of this.marshal.danger()) this.soon[i] = 1
  }

  /** What the Marshal may touch. */
  private marshalHost(): MarshalHost {
    return {
      beat: () => this.beat,
      terrainAt: (i) => this.arena.terrain[i]!,
      ribbonAt: (i) => this.cells[i] !== 0,
      bikeAt: (i) => this.bikes.some((b) => b.alive && idx(b.x, b.y) === i),
      clearCell: (i) => {
        this.cells[i] = 0
        this.fill[i] = 0
      },
      bumpAt: (i) => {
        for (const b of this.bikes)
          if (b.alive && idx(b.x, b.y) === i && !this.harmless(b)) this.crash(b)
      },
      freezeIce: (i) => {
        if (this.arena.terrain[i] === T.FLOOR) this.arena.terrain[i] = T.ICE
      },
      meltBankAt: (i) => {
        if (this.arena.terrain[i] !== T.SNOW) return false
        this.meltBank(this.arena.bankAt[i]!)
        return true
      },
      spawnPonies: (spawns) => {
        let id = Math.max(...this.bikes.map((b) => b.id)) + 1
        for (const s of spawns) {
          const pony = newBike(id++, -1, 'pony', s, RIVALS.pony.colour)
          this.bikes.push(pony)
          this.lay(pony)
        }
      },
      player: () => (this.player.alive ? this.player : null),
      say: (text, sub) => {
        this.banner = { text, sub, ticks: 100 }
      },
      sfx: (name) => this.sound.play(name),
      burst: (i, big) => {
        const px = (i % GRID) * CELL + CELL / 2
        const py = ARENA_Y + Math.floor(i / GRID) * CELL + CELL / 2
        this.fx.burst(px, py, this.fxRng, {
          count: big ? 8 : 3,
          colours: [RAMPS.gold[4], RAMPS.pink[3], '#ffffff'],
          speed: big ? 1.8 : 1,
        })
      },
    }
  }

  private steerRider(p: Bike, input: InputFrame) {
    let want: Dir | null = null
    if (input.pressed.up || input.held.up) want = 0
    if (input.pressed.right || input.held.right) want = 1
    if (input.pressed.down || input.held.down) want = 2
    if (input.pressed.left || input.held.left) want = 3
    if (want !== null && want !== reverse(p.dir)) p.want = want
    p.braking = input.held.b
    p.boosting = input.held.a && !p.braking && p.turbo > 0
  }

  /** Turbo, the slipstream chain's clock, the Spool and the wrap chain's window. */
  private runKit(r: Bike) {
    if (!r.alive) return
    if (r.boosting) r.turbo--
    else if (this.tick % 3 === 0) r.turbo = Math.min(TURBO_MAX, r.turbo + 1)
    if (r.spool > 0) r.spool--
    if (r.wrapTimer > 0 && --r.wrapTimer === 0) r.wrapCombo = 0
    if (r.chain > 0 && ++r.chainIdle > CHAIN_IDLE_TICKS) {
      if (r.chain >= 16) {
        this.floaters.push({
          x: r.x * CELL,
          y: ARENA_Y + r.y * CELL - 8,
          text: `CHAIN ${r.chain}`,
          life: 50,
        })
      }
      r.chain = 0
    }
  }

  private speedOf(b: Bike, pace: number): number {
    if (b.seat >= 0) {
      return pace * (b.boosting ? TURBO_SPEED : b.braking ? BRAKE_SPEED : 1)
    }
    const spec = RIVALS[b.kind!]
    // A Tag Lap crew races a touch under the rider's pace: turbo and slipstream win it.
    const race = this.node?.objective === 'taglap' ? TAG_LAP_PACE : 1
    const encorePace = this.mode === 'festival' && this.encore ? 1.12 : 1
    pace *= race * encorePace
    if (spec.speed === 'match') {
      const t = this.targetFor(b)
      return t ? Math.max(pace * 0.5, t.speed * race * encorePace) : pace
    }
    let speed = pace * spec.speed
    if (b.kind === 'hugger') {
      b.hugging = besideSolid(this.ctx(b), b.x, b.y, b.dir)
      if (b.hugging) speed *= HUG_BOOST
    }
    return speed
  }

  /** Does this rider slide on ice (no Grip Tyres)? */
  private slides(b: Bike): boolean {
    if (this.arena.terrain[idx(b.x, b.y)] !== T.ICE) return false
    return !(b.seat >= 0 && this.kit.grip && this.mode === 'festival')
  }

  private stepBikes(moving: Bike[]) {
    const targets = new Map<number, Bike[]>()
    const routes = new Map<Bike, number[]>()
    for (const b of moving) {
      b.acc -= 1
      const was = b.dir
      const lead = this.partnerOf(b)
      if (b.seat < 0) {
        if (lead?.alive && !b.lead) b.want = lead.dir
        else if (b.lead && lead?.alive) b.want = steerPair(this.ctx(b), b, lead)
        else b.want = steer(this.ctx(b), b, b.kind!)
      }
      // On ice a queued turn slides one more cell before it bites.
      const turning = b.want !== b.dir && b.want !== reverse(b.dir)
      const pairedMate = !b.lead && lead?.alive
      if (turning && !pairedMate && this.slides(b) && !b.skid) {
        b.skid = true
      } else {
        b.skid = false
        if (b.want !== reverse(b.dir)) b.dir = b.want
      }
      if (b.dir !== was) {
        b.lean = 10
        b.leanSide = b.dir === turnRight(was) ? 1 : -1
        if (b.seat >= 0) this.checkWhisker(b, was)
      }
      const n = this.next(b.x, b.y, b.dir)
      if (!n) {
        this.crash(b)
        continue
      }
      const [nx, ny] = n
      const plow = b.kind !== null && RIVALS[b.kind].plow === true
      const stopped = plow ? this.plowBlocked(nx, ny) : this.blocked(nx, ny)
      if (stopped && !this.snip(b, nx, ny)) {
        this.crash(b)
        continue
      }
      const entry = idx(nx, ny)
      const t = this.arena.terrain[entry]!
      const path = [entry]
      if (isConveyor(t)) {
        b.conveyorSteps = (b.conveyorSteps ?? 0) + 1
        if (b.conveyorSteps >= CONVEYOR_CELLS) {
          b.conveyorSteps = 0
          const dir = ((t -
            T.CONVEYOR +
            (this.marshal?.kind === 'conductor' && this.beat % 2 ? 2 : 0)) %
            4) as Dir
          const shift = this.next(nx, ny, dir)
          if (
            !shift ||
            (shift[0] === b.x && shift[1] === b.y) ||
            (plow
              ? this.plowBlocked(shift[0], shift[1])
              : this.blocked(shift[0], shift[1]))
          ) {
            this.crash(b)
            continue
          }
          path.push(idx(shift[0], shift[1]))
        }
      } else b.conveyorSteps = 0
      const last = path[path.length - 1]!
      const portal = this.arena.portalAt[last]!
      if (portal >= 0) {
        const x = portal % GRID
        const y = Math.floor(portal / GRID)
        if (plow ? this.plowBlocked(x, y) : this.blocked(x, y)) {
          this.crash(b)
          continue
        }
        path.push(portal)
      }
      routes.set(b, path)
      // The Lantern Kid is a friendly ghost on the road: it never meets anyone head-on.
      if (this.harmless(b)) {
        continue
      }
      for (const cell of path)
        targets.set(cell, [...(targets.get(cell) ?? []), b])
    }
    for (const group of targets.values())
      if (group.length > 1) for (const b of group) this.crash(b)
    for (const [b, path] of routes) {
      if (!b.alive) continue
      for (const cell of path.slice(0, -1)) {
        // A portal entrance stays open; the exit receives the ribbon.
        if (this.arena.terrain[cell] !== T.PORTAL)
          this.lay(b, cell % GRID, Math.floor(cell / GRID))
      }
      this.arrive(b, path[path.length - 1]!)
    }
  }

  /** A bike rolls onto its next cell. */
  private arrive(b: Bike, key: number) {
    const prev = idx(b.x, b.y)
    b.x = key % GRID
    b.y = Math.floor(key / GRID)
    b.wheel++
    const t = this.arena.terrain[key]!
    if (isPad(t)) {
      b.dir = (t - T.PAD) as Dir
      b.want = b.dir
    }
    if (b.kind === 'snowplow' && this.cells[key] && this.cells[key] !== b.id) {
      // The plow scrapes another rider's ribbon away as it goes.
      const px = b.x * CELL + CELL / 2
      const py = ARENA_Y + b.y * CELL + CELL / 2
      this.fx.burst(px, py, this.fxRng, {
        count: 2,
        colours: ['#ffffff', RAMPS.sky[4]],
        speed: 1.2,
      })
    }
    if (t === T.BELL) {
      this.bellUntil = this.roundTicks + BELL_TICKS
      this.sound.play('pickup')
      this.banner = {
        text: 'BELL FLARE!',
        sub: 'WIDE RIBBONS',
        ticks: BELL_TICKS,
      }
    }
    this.lay(b)
    if (!this.harmless(b) && this.roundTicks < this.bellUntil) {
      const side = this.next(b.x, b.y, turnRight(b.dir))
      if (
        side &&
        !this.blocked(side[0], side[1]) &&
        !this.bikes.some(
          (other) => other.alive && other.x === side[0] && other.y === side[1],
        )
      )
        this.lay(b, side[0], side[1], b.laid - 1)
    }
    if (b.kind === 'dasher') {
      // Every other cell is left open: the Dasher's own wall leaks.
      if (b.dash && this.cells[prev] === b.id && !this.fill[prev])
        this.cells[prev] = 0
      b.dash = !b.dash
    }
    this.reachBug(b, key)
    this.reachArch(b, key)
    if (b.seat >= 0) this.rode(b)
    else if (this.harmless(b)) this.kidPickup(b, key)
  }

  /** A Snip cuts the ribbon cell in the way instead of the rider crashing. */
  private snip(b: Bike, x: number, y: number): boolean {
    if (b.seat < 0 || b.snips <= 0) return false
    if (!this.inside(x, y)) return false
    const i = idx(x, y)
    if (this.cells[i] === 0 || this.terrainSolid(i)) return false
    if (this.bikes.some((o) => o.alive && o.x === x && o.y === y)) return false
    b.snips--
    this.cells[i] = 0
    this.fill[i] = 0
    const px = x * CELL + CELL / 2
    const py = ARENA_Y + y * CELL + CELL / 2
    this.fx.burst(px, py, this.fxRng, {
      count: 10,
      colours: [RAMPS.steel[4], RAMPS.steel[3], RAMPS.gold[4]],
    })
    this.floaters.push({ x: px, y: py - 8, text: 'SNIP!', life: 40 })
    this.sound.play('pop')
    return true
  }

  /** A rider's cell laid: distance, the Spool, slipstream, pickups and the wrap-up. */
  private rode(b: Bike) {
    this.distance++
    if (this.distance % 4 === 0) this.addScore(1)
    if (b.spool > 0 && this.roundTicks >= this.bellUntil) {
      const s = this.next(b.x, b.y, turnRight(b.dir))
      if (s && !this.blocked(s[0], s[1])) {
        if (!this.bikes.some((o) => o.alive && o.x === s[0] && o.y === s[1])) {
          this.lay(b, s[0], s[1], b.laid - 1)
          this.collectAt(b, idx(s[0], s[1]))
        }
      }
    }
    this.slipstream(b)
    this.collectAt(b, idx(b.x, b.y))
    this.traceArt(b)
    this.wrapUp(b)
  }

  // --- the objectives ----------------------------------------------------------------------------

  /** Ribbon Art: the outline cells within a cell of the rider's line are traced. */
  private traceArt(b: Bike) {
    if (!this.outline.length) return
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = b.x + dx
        const y = b.y + dy
        if (x < 0 || y < 0 || x >= GRID || y >= GRID) continue
        const i = idx(x, y)
        if (this.traced[i] || !this.outline.includes(i)) continue
        this.traced[i] = 1
        this.tracedCount++
        if (this.tracedCount % 8 === 0) this.sound.play('blip')
        this.addScore(10)
      }
    }
  }

  private artShare(): number {
    return this.outline.length ? this.tracedCount / this.outline.length : 0
  }

  /** A glowbug lit somewhere open, away from the bikes. */
  private spawnBug() {
    const m = this.margin + 3
    for (let tries = 0; tries < 30; tries++) {
      const x = m + this.rng() * (GRID - m * 2)
      const y = m + this.rng() * (GRID - m * 2)
      const i = idx(Math.floor(x), Math.floor(y))
      if (this.cells[i] || this.terrainSolid(i)) continue
      if (
        this.bikes.some(
          (b) => b.alive && Math.abs(b.x - x) + Math.abs(b.y - y) < 6,
        )
      )
        continue
      const a = this.rng() * Math.PI * 2
      this.bugs.push({
        x,
        y,
        vx: Math.cos(a) * BUG_SPEED,
        vy: Math.sin(a) * BUG_SPEED,
      })
      return
    }
  }

  private bugCell(bug: Glowbug): number {
    return idx(Math.floor(bug.x), Math.floor(bug.y))
  }

  /** Glowbugs drift and wheel about; a bike's head meeting one collects it. */
  private updateBugs() {
    const plan = this.node?.glowbugs
    if (!plan) return
    const lo = this.margin + 1
    const hi = GRID - this.margin - 1
    for (const bug of this.bugs) {
      if (this.rng() < 0.02) {
        const a = this.rng() * Math.PI * 2
        bug.vx = Math.cos(a) * BUG_SPEED
        bug.vy = Math.sin(a) * BUG_SPEED
      }
      bug.x += bug.vx
      bug.y += bug.vy
      if (bug.x < lo || bug.x >= hi) bug.vx = -bug.vx
      if (bug.y < lo || bug.y >= hi) bug.vy = -bug.vy
      bug.x = Math.min(hi - 0.01, Math.max(lo, bug.x))
      bug.y = Math.min(hi - 0.01, Math.max(lo, bug.y))
    }
    for (const b of this.bikes) {
      if (b.alive) this.reachBug(b, idx(b.x, b.y))
    }
    while (this.bugs.length < plan.lit) this.spawnBug()
  }

  private reachBug(b: Bike, key: number) {
    if (!this.bugs.length) return
    const k = this.bugs.findIndex((bug) => this.bugCell(bug) === key)
    if (k < 0) return
    this.bugs.splice(k, 1)
    this.gotBug(b)
  }

  private gotBug(b: Bike) {
    b.bugs++
    const px = b.x * CELL + CELL / 2
    const py = ARENA_Y + b.y * CELL + CELL / 2
    this.fx.burst(px, py, this.fxRng, {
      count: 6,
      colours: [RAMPS.gold[4], '#e0f2fe'],
      speed: 1,
    })
    if (b.seat >= 0) {
      this.addScore(150, px, py - 8)
      this.sound.play('pickup')
    }
  }

  /** Tag Lap: a bike riding through its next arch moves on to the one after. */
  private reachArch(b: Bike, key: number) {
    const arch = this.arches[b.arch]
    if (!arch || !arch.includes(key)) return
    b.arch++
    if (b.seat < 0) return
    const px = b.x * CELL + CELL / 2
    const py = ARENA_Y + b.y * CELL + CELL / 2
    this.addScore(300 * b.arch, px, py - 8)
    this.fx.burst(px, py, this.fxRng, { count: 10 })
    this.sound.play('pickup')
  }

  /** The Lantern Kid grabs any pickup it rides over, cheerfully. */
  private kidPickup(b: Bike, key: number) {
    const k = this.pickups.findIndex((p) => idx(p.x, p.y) === key)
    if (k < 0) return
    this.pickups.splice(k, 1)
    this.floaters.push({
      x: b.x * CELL + CELL / 2,
      y: ARENA_Y + b.y * CELL - 6,
      text: 'MINE!',
      life: 40,
    })
  }

  /** Rivals that bumped themselves come back, where the objective needs them back. */
  private rebootable(b: Bike): boolean {
    if (this.harmless(b)) return true
    const o = this.node?.objective
    if (o === 'giftwrap' || o === 'glowbug' || o === 'taglap' || o === 'escort')
      return true
    return o === 'marshal' && b.kind === 'pony'
  }

  private updateReboots() {
    for (const b of this.bikes) {
      if (b.alive || b.wrapped || b.reboot <= 0) continue
      if (--b.reboot > 0) continue
      const spot = this.freeSpot(b.spawn)
      if (!spot) {
        b.reboot = 30
        continue
      }
      Object.assign(b, {
        x: spot[0],
        y: spot[1],
        dir: spot[2],
        want: spot[2],
        acc: 0,
        alive: true,
        fade: 0,
        partner: 0,
        lead: false,
        skid: false,
      })
      this.lay(b)
      this.rings.push({
        x: b.x * CELL + CELL / 2,
        y: ARENA_Y + b.y * CELL + CELL / 2,
        life: RING_TICKS,
        colour: rampOf(b.colour)[3],
      })
    }
  }

  /** The open cell nearest a spawn with room to ride out of it. */
  private freeSpot(spawn: Spawn): Spawn | null {
    const [sx, sy] = spawn
    for (let r = 0; r <= 12; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue
          const x = sx + dx
          const y = sy + dy
          if (this.blocked(x, y, true)) continue
          if (this.bikes.some((o) => o.alive && o.x === x && o.y === y))
            continue
          for (const d of [spawn[2], 0, 1, 2, 3] as Dir[]) {
            let ok = true
            let at: [number, number] = [x, y]
            for (let k = 0; k < 4 && ok; k++) {
              const n = this.next(at[0], at[1], d)
              ok = !!n && !this.blocked(n[0], n[1], true)
              if (n) at = n
            }
            if (ok) return [x, y, d]
          }
        }
      }
    }
    return null
  }

  /** Riding beside any ribbon: turbo back, and a chain that pays more the longer it runs. */
  private slipstream(b: Bike) {
    let near = false
    for (const s of [turnLeft(b.dir), turnRight(b.dir)]) {
      const n = this.next(b.x, b.y, s)
      if (!n) continue
      const i = idx(n[0], n[1])
      const owner = this.cells[i]!
      if (!owner) continue
      if (
        owner === b.id &&
        !this.fill[i] &&
        this.order[i]! + OWN_TAIL >= b.laid
      )
        continue
      near = true
    }
    if (!near) return
    b.chain++
    b.bestChain = Math.max(b.bestChain, b.chain)
    b.chainIdle = 0
    b.turbo = Math.min(TURBO_MAX, b.turbo + SLIP_REFILL)
    this.addScore(1 + Math.floor(b.chain / 10))
    if (b.chain % 3 === 0) {
      const sx = b.x * CELL + CELL / 2
      const sy = ARENA_Y + b.y * CELL + CELL / 2
      this.fx.burst(sx, sy, this.fxRng, {
        count: 2,
        colours: [RAMPS.sky[4], RAMPS.gold[4]],
        speed: 0.8,
      })
    }
  }

  /** A turn taken a cell short of a ribbon, at speed. */
  private checkWhisker(b: Bike, was: Dir) {
    if (b.braking) return
    const n = this.next(b.x, b.y, was)
    if (!n) return
    const i = idx(n[0], n[1])
    if (!this.cells[i]) return
    b.whiskers++
    const mult = slipMultiplier(b.chain)
    const px = n[0] * CELL + CELL / 2
    const py = ARENA_Y + n[1] * CELL + CELL / 2
    this.addScore(WHISKER_POINTS * mult, px, py - 6)
    this.fx.burst(px, py, this.fxRng, {
      count: 6,
      colours: [RAMPS.gold[4], '#ffffff'],
      speed: 1.2,
    })
    this.sound.play('blip')
  }

  // --- the wrap-up ------------------------------------------------------------------

  /** The largest loop this rider can wrap: the Bow doubles it, the Paint Shop's spool adds to it. */
  private wrapLimit(b: Bike): number {
    const spool = this.mode === 'festival' ? this.kit.spool * SPOOL_STEP : 0
    return (WRAP_LIMIT + spool) * (b.bow ? 2 : 1)
  }

  private wrapUp(b: Bike) {
    const team = (owner: number) => owner === b.id
    const normal = this.wrapLimit(b)
    // A Marshal's target may be taken by a bigger loop than anything else.
    const targets = new Set(this.marshal?.targets() ?? [])
    const limit = targets.size ? Math.max(normal, this.marshal!.limit) : normal
    const regions = findWraps({
      x: b.x,
      y: b.y,
      dir: b.dir,
      limit,
      wrapX: this.arena.spec.wrap?.x,
      wrapY: this.arena.spec.wrap?.y,
      side: (x, y) => {
        if (!this.inside(x, y)) return true
        const i = idx(x, y)
        return team(this.cells[i]!) || this.sideSolid(i)
      },
      forbid: (i) =>
        this.bikes.some(
          (o) => o.seat >= 0 && o !== b && o.alive && idx(o.x, o.y) === i,
        ),
    })
    for (const region of regions) {
      if (region.length > normal && !region.some((i) => targets.has(i)))
        continue
      this.giftWrap(b, region)
    }
  }

  private giftWrap(b: Bike, region: number[]) {
    const inRegion = new Set(region)
    let caught = 0
    let kids = 0
    for (const r of this.rivals) {
      if (!r.alive || !inRegion.has(idx(r.x, r.y))) continue
      r.alive = false
      r.wrapped = true
      r.fade = FADE_TICKS
      if (this.harmless(r)) {
        kids++
        this.kidWrapped = true
        continue
      }
      caught++
      this.wrappedCount++
      this.marshal?.rivalWrapped(r.kind!)
    }
    const hit = this.marshal?.wrapped(inRegion) ?? false
    if (hit) this.addScore(PHASE_BONUS * (this.fair + 1))
    // Glowbugs inside are collected with the wrap.
    for (let k = this.bugs.length - 1; k >= 0; k--) {
      if (!inRegion.has(this.bugCell(this.bugs[k]!))) continue
      this.bugs.splice(k, 1)
      this.gotBug(b)
    }
    // This wrap spends a Bow in hand; one wrapped up inside is kept for the next.
    b.bow = false
    for (const i of region) {
      if (this.dyn[i]) continue
      this.cells[i] = b.id
      this.fill[i] = 1
      this.collectAt(b, i)
    }
    b.wraps++
    b.wrapCombo = b.wrapTimer > 0 ? b.wrapCombo + 1 : 1
    b.wrapTimer = WRAP_CHAIN_TICKS
    const bow = bowCell(region)
    this.wraps.push({
      cells: region,
      bow,
      colour: b.colour,
      seat: b.seat,
      born: this.tick,
    })
    const mult = slipMultiplier(b.chain) * b.wrapCombo
    const points = region.length * WRAP_CELL_POINTS * mult
    const bx = (bow % GRID) * CELL + CELL / 2
    const by = ARENA_Y + Math.floor(bow / GRID) * CELL + CELL / 2
    this.addScore(points, bx, by - 10)
    if (hit) {
      // The Marshal's own card stands.
    } else if (kids && !caught) {
      this.banner = {
        text: 'A LANTERN KID!',
        sub: 'WRAPPED A FRIEND. NO KIND RIDER TICKET',
        ticks: 70,
      }
    } else if (caught) {
      this.addScore(1000 * this.level * caught, bx, by + 4)
      this.banner = {
        text: caught > 1 ? `${caught} RIVALS WRAPPED!` : 'GIFT WRAPPED!',
        sub: mult > 1 ? `x${mult}` : undefined,
        ticks: 70,
      }
    } else if (b.wrapCombo > 1) {
      this.banner = { text: `WRAP CHAIN x${b.wrapCombo}`, ticks: 50 }
    }
    this.fx.burst(bx, by, this.fxRng, {
      count: 14 + caught * 8,
      colours: [RAMPS.gold[4], RAMPS.pink[3], '#ffffff'],
      speed: 2,
    })
    this.rings.push({ x: bx, y: by, life: RING_TICKS, colour: RAMPS.gold[3] })
    this.sound.play(caught ? 'level' : 'pickup')
  }

  // --- pickups --------------------------------------------------------------------------

  private updatePickups() {
    for (const p of this.pickups) p.life--
    this.pickups = this.pickups.filter(
      (p) => p.life > 0 && this.inside(p.x, p.y),
    )
    if (--this.pickupTimer > 0) return
    const plan = this.arena.spec.pickups
    this.pickupTimer = plan?.every ?? DEFAULT_PICKUPS.every
    if (this.pickups.length >= MAX_LIT_PICKUPS) return
    const m = this.margin + 2
    for (let tries = 0; tries < 30; tries++) {
      const x = m + Math.floor(this.rng() * (GRID - m * 2))
      const y = m + Math.floor(this.rng() * (GRID - m * 2))
      const i = idx(x, y)
      if (this.cells[i] || this.dyn[i] || this.arena.terrain[i] !== T.FLOOR)
        continue
      if (this.pickups.some((p) => p.x === x && p.y === y)) continue
      if (
        this.bikes.some(
          (b) => b.alive && Math.abs(b.x - x) + Math.abs(b.y - y) < 6,
        )
      )
        continue
      this.pickups.push({
        x,
        y,
        kind: rollPickup(this.rng(), plan?.kinds),
        life: PICKUP_LIFE,
      })
      return
    }
  }

  private collectAt(b: Bike, i: number) {
    const k = this.pickups.findIndex((p) => idx(p.x, p.y) === i)
    if (k < 0) return
    const p = this.pickups[k]!
    this.pickups.splice(k, 1)
    this.applyPickup(b, p.kind)
    const px = p.x * CELL + CELL / 2
    const py = ARENA_Y + p.y * CELL + CELL / 2
    this.addScore(250, px, py - 8)
    this.floaters.push({
      x: px,
      y: py - 16,
      text: PICKUPS[p.kind].name,
      life: 50,
    })
    this.fx.burst(px, py, this.fxRng, { count: 10 })
    this.sound.play('pickup')
  }

  private applyPickup(b: Bike, kind: PickupKind) {
    switch (kind) {
      case 'snip':
        b.snips = Math.min(MAX_SNIPS, b.snips + 1)
        break
      case 'spool':
        b.spool = SPOOL_TICKS
        break
      case 'eraser': {
        const mine: number[] = []
        for (let i = 0; i < this.cells.length; i++) {
          if (this.cells[i] === b.id && !this.fill[i]) mine.push(i)
        }
        mine.sort((a, c) => this.order[a]! - this.order[c]!)
        const head = idx(b.x, b.y)
        for (const i of mine.slice(0, ERASER_CELLS)) {
          if (i !== head && this.order[i]! + OWN_TAIL < b.laid)
            this.cells[i] = 0
        }
        break
      }
      case 'bow':
        b.bow = true
        break
      case 'freeze':
        this.freeze = FREEZE_TICKS
        break
      case 'spark':
        b.turbo = TURBO_MAX
        break
    }
  }

  // --- the arena ------------------------------------------------------------------------

  /** A new beat: gates that shut take any ribbon (and any bike) on them. */
  private onBeat() {
    const beat = this.beat
    for (const gate of this.arena.gates) {
      const shut = !gateOpen(gate, beat) && gateOpen(gate, beat - 1)
      if (!shut) continue
      for (const i of gate.cells) {
        for (const b of this.bikes) {
          if (b.alive && idx(b.x, b.y) === i) this.crash(b)
        }
        this.cells[i] = 0
        this.fill[i] = 0
      }
      this.sound.play('blip')
    }
  }

  private shrink() {
    this.shrinkTimer = this.shrinkEvery()
    const s = this.arena.spec.shrink
    if (!s) return
    if (s.shape === 'spiral') {
      if (this.spiralCount >= s.max * SPIRAL_STEP) return
      this.spiralCount += SPIRAL_STEP
      this.sound.play('warn')
      for (const b of this.bikes)
        if (b.alive && this.terrainSolid(idx(b.x, b.y))) this.crash(b)
      return
    }
    if (this.margin >= s.max) return
    this.margin++
    this.sound.play('warn')
    // A bike caught on the closing wall is out.
    for (const b of this.bikes) {
      if (b.alive && !this.inside(b.x, b.y)) this.crash(b)
    }
  }

  private crash(b: Bike) {
    if (!b.alive) return
    b.alive = false
    b.fade = FADE_TICKS
    const px = b.x * CELL + CELL / 2
    const py = ARENA_Y + b.y * CELL + CELL / 2
    this.burst(px, py, 16, b.seat >= 0 ? '#fde68a' : b.colour)
    const ramp = rampOf(b.colour)
    this.fx.burst(px, py, this.fxRng, {
      count: 12,
      colours: [ramp[3], ramp[4], RAMPS.gold[4]],
      speed: 2,
    })
    this.rings.push({ x: px, y: py, life: RING_TICKS, colour: ramp[3] })
    this.sound.play('boom')
    if (b.seat >= 0) {
      this.lives--
      this.dead = DEATH_TICKS
      this.sound.play('die')
      if (this.lives > 0) this.banner = { text: 'BUMPED!', ticks: 80 }
      return
    }
    if (this.rebootable(b)) b.reboot = REBOOT_TICKS
    if (this.harmless(b)) return
    if (this.player.alive) this.addScore(250 * this.level, px, py - 6)
  }

  private escortColumn(): number {
    const duration = Math.max(1, this.node?.limit ?? 1)
    return Math.min(
      42,
      5 + Math.floor(((duration - this.timeLeft) * 37) / duration),
    )
  }

  /** Has this round's objective been met, or lost? */
  private checkRoundOver() {
    if (!this.player.alive || this.dead > 0) return
    const a = this.node
    if (!a) {
      if (this.rivals.some((b) => b.alive && !this.harmless(b))) return
      return this.clearRound()
    }
    const p = this.player
    switch (a.objective) {
      case 'last':
        if (this.rivals.some((b) => b.alive && !this.harmless(b))) return
        return this.clearRound()
      case 'giftwrap':
        if (this.wrappedCount >= this.crewSize()) return this.clearRound()
        if (this.timeLeft === 0)
          this.fail('TIME UP!', 'WRAP THEM ALL NEXT TIME')
        return
      case 'glowbug': {
        const target = a.glowbugs!.target
        if (p.bugs >= target) return this.clearRound()
        const winner = this.rivals.find((b) => b.bugs >= target)
        if (winner)
          this.fail(`${RIVALS[winner.kind!].name} WINS!`, 'RACE FOR THE BUGS')
        return
      }
      case 'art':
        if (this.artShare() >= a.art!.share) return this.clearRound()
        if (this.timeLeft === 0) this.fail('TIME UP!', 'TRACE THE OUTLINE')
        return
      case 'taglap': {
        if (p.arch >= this.arches.length) return this.clearRound()
        const winner = this.rivals.find((b) => b.arch >= this.arches.length)
        if (winner)
          this.fail(`${RIVALS[winner.kind!].name} TAGS FIRST!`, 'RIDE FASTER')
        return
      }
      case 'escort': {
        const x = this.escortColumn()
        if (x > this.escortLastX) {
          this.escortLastX = x
          const row = a.escort!.row
          const danger = [row - 1, row, row + 1].some((y) => {
            const i = idx(x, y)
            return this.cells[i]! >= FIRST_RIVAL_ID && !this.fill[i]
          })
          if (danger) {
            this.escortHits++
            this.sound.play('warn')
            this.banner = {
              text: 'MOON FLOAT HIT!',
              sub: `${a.escort!.health - this.escortHits} LANTERNS LEFT`,
              ticks: 65,
            }
          }
        }
        if (this.escortHits >= a.escort!.health)
          return this.fail('THE FLOAT IS TANGLED!', 'WRAP THE CREW FIRST')
        if (this.timeLeft === 0) return this.clearRound()
        return
      }
      case 'marshal':
        if (this.marshal?.defeated) this.clearRound()
        return
    }
  }

  /** Rivals this round must wrap (the Lantern Kids never count). */
  private crewSize(): number {
    return this.rivals.filter(
      (b) => !this.harmless(b) && (b.kind !== 'pony' || !this.marshal),
    ).length
  }

  /** The objective is lost: it costs a rider, as a bump does. */
  private fail(text: string, sub: string) {
    this.crash(this.player)
    if (this.lives > 0) this.banner = { text, sub, ticks: 90 }
  }

  private clearRound() {
    if (this.node) return this.clearEvent(this.node)
    const bonus = 1000 * this.level
    this.addScore(bonus, W / 2, ARENA_Y + 100)
    this.roundClear = ROUND_CLEAR_TICKS
    const p = this.player
    this.banner = {
      text: 'ROUND CLEAR!',
      sub: `BONUS ${bonus}`,
      lines: [`WRAPS ${p.wraps}  WHISKERS ${p.whiskers}  CHAIN ${p.bestChain}`],
      ticks: ROUND_CLEAR_TICKS,
    }
    this.sound.play('level')
    for (let i = 0; i < 3; i++) {
      this.fx.burst(p.x * CELL + 3, ARENA_Y + p.y * CELL + 3, this.fxRng, {
        count: 10,
        speed: 1.4 + i * 0.6,
      })
    }
  }

  // --- the Festival --------------------------------------------------------------------------------

  /** A festival event won: tickets, the score bonus, and its lantern lit on the board. */
  private clearEvent(a: FairArena) {
    const p = this.player
    const underPar = this.roundTicks <= a.par
    const kind = a.crew.includes('lanternKid') && !this.kidWrapped
    const won = clearTickets(a.tickets, underPar, kind)
    this.tickets = Math.min(MAX_TICKETS, this.tickets + won)
    const bonus = a.marshal
      ? MARSHAL_BONUS * (this.fair + 1)
      : ARENA_BONUS * a.tier
    this.addScore(bonus, W / 2, ARENA_Y + 100)
    this.cleared.add(a.id)
    const lines = [`TICKETS +${won}`]
    if (underPar) lines.push('UNDER PAR +2')
    if (kind) lines.push('KIND RIDER +1')
    const fair = this.fairground
    if (
      !this.demo &&
      this.fair < SECRET_FAIR_INDEX &&
      a.special &&
      fair.arenas.some((event) => event.id === a.id && event.special) &&
      underPar &&
      !this.kidWrapped &&
      (a.objective !== 'escort' || this.escortHits === 0) &&
      !this.goldenBows.includes(fair.id)
    ) {
      this.goldenBows = readGoldenBows([...this.goldenBows, fair.id])
      // A bow is a lifetime trophy, not a replayable checkpoint reward.
      if (this.savePoint)
        this.savePoint = { ...this.savePoint, goldenBows: [...this.goldenBows] }
      lines.push(
        hasAllGoldenBows(this.goldenBows)
          ? 'RAINBOW SPOOL UNLOCKED!'
          : 'GOLDEN BOW EARNED!',
      )
    }
    this.roundClear = ROUND_CLEAR_TICKS
    this.banner = {
      text: a.marshal ? 'MARSHAL WRAPPED!' : 'EVENT CLEAR!',
      sub: `BONUS ${bonus}`,
      lines,
      ticks: ROUND_CLEAR_TICKS,
    }
    this.sound.play('level')
    for (let i = 0; i < 3; i++) {
      this.fx.burst(p.x * CELL + 3, ARENA_Y + p.y * CELL + 3, this.fxRng, {
        count: 10,
        speed: 1.4 + i * 0.6,
      })
    }
  }

  private afterClear() {
    if (this.mode === 'midway') return this.startRound(this.level + 1)
    if (this.fair === SECRET_FAIR_INDEX) {
      if (this.node?.id === 'spool-itself') return this.finishFestival()
      return this.openMenu('board')
    }
    if (this.node?.marshal) return this.openMenu('shop')
    this.openMenu('board')
  }

  private gameOver() {
    this.over = true
    this.banner = { text: 'GAME OVER', ticks: 9999 }
    // The festival waits at its fairground; picking it up again starts the score afresh.
    if (this.savePoint && this.mode === 'festival')
      this.savePoint = { ...this.savePoint, continued: true }
  }

  /** A fairground's gates open: a fresh board, and the save point. */
  private openFairground(fair: number) {
    this.fair = fair
    this.cleared = new Set()
    this.mode = 'festival'
    this.writeSave()
    this.openMenu('board')
  }

  private writeSave() {
    if (this.demo) return
    this.savePoint = {
      v: 1,
      fair: this.fair,
      score: Math.min(5_000_000, this.score),
      lives: Math.min(MAX_LIVES, Math.max(1, this.lives)),
      tickets: this.tickets,
      kit: { ...this.kit, patterns: [...this.kit.patterns] },
      continued: this.continued,
      champion: this.champion,
      ...(this.encore ? { encore: true } : {}),
      ...(this.goldenBows.length ? { goldenBows: [...this.goldenBows] } : {}),
      ...(this.trueChampion ? { trueChampion: true } : {}),
    }
  }

  /** Four Grand Marshals beaten: keep the trophy and roll the festival credits. */
  private finishFestival() {
    this.champion = true
    this.trueEnding =
      this.fair === SECRET_FAIR_INDEX && this.cleared.has('spool-itself')
    this.trueChampion ||= this.trueEnding
    this.fair = 0
    this.tickets = Math.min(MAX_TICKETS, this.tickets)
    this.writeSave()
    if (this.savePoint) {
      this.savePoint = { ...this.savePoint, score: 0, encore: false }
      this.offer = this.savePoint
    }
    this.openMenu('credits')
    this.sound.play('extra')
  }

  private openMenu(kind: MenuKind) {
    this.menu = { kind, cursor: 0, ticks: 0, note: '' }
    this.banner = null
  }

  private openTitle() {
    this.titleChoices = this.offer
      ? ['continue', 'new', 'midway']
      : ['new', 'midway']
    if (this.champion) this.titleChoices.splice(-1, 0, 'encore')
    if (hasAllGoldenBows(this.goldenBows))
      this.titleChoices.splice(-1, 0, 'spool')
    this.openMenu('title')
    this.banner = null
  }

  /** The board's open events, in board order. */
  private boardEvents(): string[] {
    return openEvents(this.fairground, this.cleared)
  }

  private updateMenu(input: InputFrame) {
    const m = this.menu!
    m.ticks++
    const p = input.pressed
    const go = m.ticks > 8 && (p.a || p.start)
    const step = (n: number, size: number) => {
      m.cursor = (m.cursor + n + size) % size
      m.note = ''
      this.sound.play('blip')
    }
    if (m.kind === 'credits') {
      if (go) this.openTitle()
      return
    }
    if (m.kind === 'title') {
      const size = this.titleChoices.length
      if (p.up || p.left) step(-1, size)
      if (p.down || p.right) step(1, size)
      if (go) this.chooseTitle(this.titleChoices[m.cursor]!)
      return
    }
    if (m.kind === 'board') {
      const open = this.boardEvents()
      if (p.up || p.left) step(-1, open.length)
      if (p.down || p.right) step(1, open.length)
      if (go) {
        const id = open[m.cursor % open.length]!
        this.menu = null
        this.sound.play('start')
        this.playArena(arenaById(this.fairground, id))
      }
      return
    }
    if (p.up) step(-1, SHOP.length)
    if (p.down) step(1, SHOP.length)
    if (!go) return
    const item = SHOP[m.cursor]!
    if (item.id === 'leave') return this.leaveShop()
    const why = shopBlock(item, this.kit, this.tickets, this.lives)
    const got = buy(item, this.kit, this.tickets, this.lives)
    if (!got.ok) {
      m.note = why ?? ''
      this.sound.play('warn')
      return
    }
    this.tickets = got.tickets
    this.lives = got.lives
    m.note = 'THANK YOU!'
    this.sound.play('pickup')
  }

  private chooseTitle(choice: TitleChoice) {
    if (choice === 'spool' && !hasAllGoldenBows(this.goldenBows)) return
    this.menu = null
    this.sound.play('start')
    if (choice === 'midway') {
      this.startRound(1)
      return
    }
    const offer = choice === 'continue' ? this.offer : null
    this.offer = null
    this.encore = choice === 'encore' || offer?.encore === true
    this.score = offer && !offer.continued ? offer.score : 0
    this.nextExtra = EXTRA_EVERY * (Math.floor(this.score / EXTRA_EVERY) + 1)
    this.lives = offer && !offer.continued ? offer.lives : START_LIVES
    this.tickets = offer?.tickets ?? 0
    const carriedKit =
      offer?.kit ??
      (this.encore || choice === 'spool' ? this.savePoint?.kit : null)
    this.kit = carriedKit
      ? { ...carriedKit, patterns: [...carriedKit.patterns] }
      : newKit()
    this.continued = false
    this.openFairground(
      choice === 'spool' ? SECRET_FAIR_INDEX : (offer?.fair ?? 0),
    )
  }

  private leaveShop() {
    this.menu = null
    this.sound.play('start')
    if (this.fair + 1 >= FAIRGROUNDS.length) return this.finishFestival()
    this.openFairground(this.fair + 1)
  }

  private updateFades() {
    for (const b of this.bikes) {
      if (b.alive || b.fade <= 0) continue
      if (--b.fade === 0) {
        // The fallen rider's ribbon dissolves, opening the arena back up.
        for (let i = 0; i < this.cells.length; i++) {
          if (this.cells[i] === b.id && !this.fill[i]) this.cells[i] = 0
        }
      }
    }
  }

  // --- rival steering --------------------------------------------------------------

  private targetFor(b: Bike): Bike | null {
    let best: Bike | null = null
    let bestD = Infinity
    for (const r of this.bikes) {
      if (r.seat < 0 || !r.alive) continue
      const d = Math.abs(r.x - b.x) + Math.abs(r.y - b.y)
      if (d < bestD) {
        bestD = d
        best = r
      }
    }
    return best
  }

  private ctx(b: Bike): SteerCtx {
    const plow = b.kind !== null && RIVALS[b.kind].plow === true
    return {
      rng: this.rng,
      cunning: levelCurve(this.level, RIBBON_CURVES.cunning),
      room: (x, y) => this.room(x, y, FLOOD_LIMIT, plow),
      next: (x, y, d) => this.next(x, y, d),
      solid: (x, y) => (plow ? this.plowBlocked(x, y) : this.blocked(x, y)),
      target: this.targetFor(b),
      goal: this.goalFor(b),
    }
  }

  /** Where a rival is headed besides its rider: its next arch, or (for a Lantern Kid) a glowbug. */
  private goalFor(b: Bike): { x: number; y: number } | null {
    const arch = this.arches[b.arch]
    if (arch?.length) {
      const mid = arch[Math.floor(arch.length / 2)]!
      return { x: mid % GRID, y: Math.floor(mid / GRID) }
    }
    if (!this.harmless(b)) return null
    const spots = [
      ...this.bugs.map((g) => ({ x: Math.floor(g.x), y: Math.floor(g.y) })),
      ...this.pickups,
    ]
    let best: { x: number; y: number } | null = null
    let bestD = Infinity
    for (const s of spots) {
      const d = Math.abs(s.x - b.x) + Math.abs(s.y - b.y)
      if (d < bestD) {
        bestD = d
        best = { x: s.x, y: s.y }
      }
    }
    return best
  }

  /** Free cells reachable from (x, y), counted up to FLOOD_LIMIT (ribbons are open road to a plow). */
  private room(
    x: number,
    y: number,
    limit = FLOOD_LIMIT,
    plow = false,
  ): number {
    const shut = (cx: number, cy: number) =>
      plow ? this.plowBlocked(cx, cy, true) : this.blocked(cx, cy, true)
    if (shut(x, y)) return 0
    const seen = new Set<number>([idx(x, y)])
    const queue = [x, y]
    let head = 0
    while (head < queue.length && seen.size < limit) {
      const cx = queue[head++]!
      const cy = queue[head++]!
      for (let d = 0; d < 4; d++) {
        const n = this.next(cx, cy, d as Dir)
        if (!n) continue
        const k = idx(n[0], n[1])
        if (seen.has(k) || shut(n[0], n[1])) continue
        seen.add(k)
        queue.push(n[0], n[1])
      }
    }
    return seen.size
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x?: number, y?: number) {
    if (this.demo) return
    this.score += points
    if (x !== undefined && y !== undefined) {
      this.floaters.push({ x, y, text: String(points), life: 40 })
    }
    if (this.score >= this.nextExtra) {
      this.lives++
      this.nextExtra += EXTRA_EVERY
      this.banner = { text: 'EXTRA RIDER!', ticks: 90 }
      this.fx.burst(180, 11, this.fxRng, { count: 12 })
      this.sound.play('extra')
    }
  }

  private burst(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const a = this.fxRng() * Math.PI * 2
      const s = 0.5 + this.fxRng() * 2
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 20 + Math.floor(this.fxRng() * 16),
        color,
      })
    }
  }

  private updateEffects() {
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      p.vx *= 0.96
      p.vy *= 0.96
      p.life--
    }
    this.particles = this.particles.filter((p) => p.life > 0)
    for (const f of this.floaters) {
      f.y -= 0.4
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
    this.fx.update()
    for (const r of this.rings) r.life--
    this.rings = this.rings.filter((r) => r.life > 0)
  }

  // --- attract-mode pilot -----------------------------------------------------

  /** The attract pilot (and the probes' rider): roomy lines, pickups when it's safe, turbo in the open. */
  demoInput(seat = 0): InputFrame {
    const frame = blankFrame()
    const held = frame.held
    const p = this.bikes.find((b) => b.seat === seat)
    if (!p || !p.alive) return frame
    const pickup = this.pickups
      .filter((k) => !this.cells[idx(k.x, k.y)])
      .sort(
        (a, b) =>
          Math.abs(a.x - p.x) +
          Math.abs(a.y - p.y) -
          Math.abs(b.x - p.x) -
          Math.abs(b.y - p.y),
      )[0]
    let best = p.dir
    let bestScore = -Infinity
    const spaces: number[] = []
    // On ice a turn bites a cell late, so the pilot plans from the cell ahead.
    let from: [number, number] = [p.x, p.y]
    if (this.slides(p) && !p.skid) {
      const ahead = this.next(p.x, p.y, p.dir)
      if (ahead && !this.blocked(ahead[0], ahead[1], true)) from = ahead
    }
    for (const d of [p.dir, turnLeft(p.dir), turnRight(p.dir)] as Dir[]) {
      const n = this.next(from[0], from[1], d)
      const space = n ? this.room(n[0], n[1], 140) : 0
      spaces.push(space)
      let score = space + (d === p.dir ? 3 : 0)
      // A turn pad spins the bike its own way: what counts is the road after the spin.
      const t = n ? this.arena.terrain[idx(n[0], n[1])]! : T.FLOOR
      if (n && isPad(t)) {
        const after = this.next(n[0], n[1], (t - T.PAD) as Dir)
        if (!after || this.blocked(after[0], after[1], true)) score -= 400
        else score = Math.min(score, this.room(after[0], after[1], 140))
      }
      if (n && space >= 100 && pickup) {
        score -= (Math.abs(n[0] - pickup.x) + Math.abs(n[1] - pickup.y)) * 0.8
      }
      if (score > bestScore) {
        bestScore = score
        best = d
      }
    }
    held[(['up', 'right', 'down', 'left'] as const)[best]] = true
    const ahead = this.next(p.x, p.y, p.dir)
    const clear = (n: number) => {
      let at: [number, number] | null = [p.x, p.y]
      for (let i = 0; i < n && at; i++) {
        at = this.next(at[0], at[1], p.dir)
        if (!at || this.blocked(at[0], at[1], true)) return false
      }
      return true
    }
    if (best === p.dir && ahead && spaces[0]! >= 120 && clear(10))
      held.a = p.turbo > 30 && this.tick % 240 < 150
    else if (best === p.dir && !clear(2)) held.b = true
    return frame
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    if (this.menu) {
      this.renderMenu(g)
      return
    }
    this.renderFloor(g)
    this.renderTerrain(g)
    this.renderCarousel(g)
    this.renderObjective(g)
    this.renderWalls(g)
    this.renderWraps(g)
    this.renderRibbons(g)
    this.renderWarning(g)
    this.renderPickups(g)
    this.marshal?.render(g, this.tick)
    this.renderBugs(g)
    this.renderTethers(g)
    for (const b of this.bikes) {
      if (b.alive) this.renderBike(g, b)
      else if (b.wrapped) this.renderPresent(g, b)
    }
    g.save()
    g.globalCompositeOperation = 'lighter'
    for (const p of this.particles) {
      const x = Math.round(p.x)
      const y = Math.round(p.y)
      g.globalAlpha = Math.max(0, Math.min(1, p.life / 30))
      g.fillStyle = p.color
      g.fillRect(x - 1, y - 1, 2, 2)
      if (p.life > 14) {
        g.fillStyle = '#ffffff'
        g.fillRect(x - 1, y - 1, 1, 1)
      }
    }
    g.restore()
    for (const r of this.rings) this.renderRing(g, r)
    this.fx.render(g)
    for (const f of this.floaters) {
      drawText(g, f.text, Math.round(f.x), Math.round(f.y), {
        align: 'center',
        color: RAMPS.gold[3],
        outline: INK,
      })
    }
    vignette(g, W, H, 0.3)
    this.renderHud(g)
  }

  private get floor() {
    return FLOORS[this.arena.spec.floor]
  }

  private renderFloor(g: CanvasRenderingContext2D) {
    const id = this.arena.spec.floor
    const { face, line } = this.floor
    // Bevelled grid tiles over glowing grout, brighter toward the arena's heart; painted once.
    cachedLayer(g, `ribbon-riders-floor-${id}`, W, H, (k) => {
      bandedGradient(
        k,
        0,
        0,
        W,
        ARENA_Y,
        [RAMPS.night[2], RAMPS.night[1], RAMPS.night[0]],
        2,
      )
      bandedGradient(
        k,
        0,
        ARENA_Y,
        W,
        GRID * CELL,
        [line[1], line[0], line[1], line[0]],
        8,
      )
      const tiles = (GRID * CELL) / TILE
      const mid = (tiles - 1) / 2
      for (let ty = 0; ty < tiles; ty++) {
        for (let tx = 0; tx < tiles; tx++) {
          const x = tx * TILE
          const y = ARENA_Y + ty * TILE
          const ring = Math.max(Math.abs(tx - mid), Math.abs(ty - mid)) / mid
          const lift = Math.round((1 - ring) * 4) / 4
          bandedGradient(
            k,
            x + 1,
            y + 1,
            TILE - 2,
            TILE - 2,
            [
              mix(face[2], face[3], lift),
              mix(face[1], face[2], lift),
              mix(face[0], face[1], lift),
            ],
            3,
          )
          k.fillStyle = mix(face[3], face[4], lift)
          k.fillRect(x + 1, y + 1, TILE - 2, 1)
          k.fillRect(x + 1, y + 1, 1, TILE - 2)
          k.fillStyle = face[0]
          k.fillRect(x + 1, y + TILE - 2, TILE - 2, 1)
          k.fillRect(x + TILE - 2, y + 1, 1, TILE - 2)
          // The ride grid: a faint dot at every other cell corner.
          k.fillStyle = rgba(line[3], 0.16 + lift * 0.12)
          for (let j = 2; j < TILE / CELL; j += 2) {
            for (let i = 2; i < TILE / CELL; i += 2) {
              k.fillRect(x + i * CELL, y + j * CELL, 1, 1)
            }
          }
        }
      }
      k.fillStyle = rgba(line[3], 0.28)
      for (let i = 0; i <= tiles; i++) {
        k.fillRect(i * TILE - 1, ARENA_Y, 1, GRID * CELL)
        k.fillRect(0, ARENA_Y + i * TILE - 1, W, 1)
      }
      for (let ty = 1; ty < tiles; ty++) {
        for (let tx = 1; tx < tiles; tx++) {
          const x = tx * TILE - 1
          const y = ARENA_Y + ty * TILE - 1
          glow(k, x, y, 6, line[3], 0.3)
          k.fillStyle = line[3]
          k.fillRect(x - 1, y, 3, 1)
          k.fillRect(x, y - 1, 1, 3)
        }
      }
    })
  }

  /** Lamp posts, gates on the beat and turn pads. */
  private renderTerrain(g: CanvasRenderingContext2D) {
    const { terrain, gates, gateAt } = this.arena
    const beat = this.beat
    const flash = Math.floor(this.tick / 6) % 2 === 0
    const { line } = this.floor
    const { banks, bankAt } = this.arena
    for (let i = 0; i < terrain.length; i++) {
      const t = terrain[i]!
      if (t === T.FLOOR) continue
      const x = (i % GRID) * CELL
      const y = ARENA_Y + Math.floor(i / GRID) * CELL
      if (t === T.ICE) {
        // Glassy ice: pale, with a diagonal glint that drifts across the sheet.
        const cx = i % GRID
        const cy = Math.floor(i / GRID)
        g.fillStyle = 'rgba(186, 230, 253, 0.22)'
        g.fillRect(x, y, CELL, CELL)
        if ((cx + cy + (this.tick >> 4)) % 9 === 0) {
          g.fillStyle = 'rgba(255, 255, 255, 0.55)'
          g.fillRect(x + 1, y + 4, 1, 1)
          g.fillRect(x + 2, y + 3, 1, 1)
          g.fillRect(x + 3, y + 2, 1, 1)
        }
        continue
      }
      if (t === T.SNOW) {
        const bank = banks[bankAt[i]!]
        const melting = bank && bank.melt > 0
        const drip = melting && Math.floor(this.tick / 5) % 2 === 0
        bevel(g, x, y, CELL, CELL, RAMPS.sky, { depth: 1, outline: null })
        g.fillStyle = drip ? RAMPS.sky[3] : '#ffffff'
        g.fillRect(x + 1, y + 1, CELL - 2, CELL - 3)
        g.fillStyle = RAMPS.cream[4]
        g.fillRect(x + 1, y + 1, CELL - 3, 1)
        if (melting) {
          g.fillStyle = RAMPS.sky[2]
          g.fillRect(x + 2, y + CELL - 1, 1, 1 + ((this.tick >> 3) % 2))
        }
        continue
      }
      if (isConveyor(t)) {
        const d = ((t -
          T.CONVEYOR +
          (this.marshal?.kind === 'conductor' && this.beat % 2 ? 2 : 0)) %
          4) as Dir
        g.fillStyle = rgba(RAMPS.teal[3], 0.45)
        g.fillRect(x, y, CELL, CELL)
        drawSprite(g, padArrow(d, RAMPS.teal[4]), x + 3, y + 3)
      } else if (t === T.BELL) {
        glow(g, x + 3, y + 3, 12, RAMPS.gold[4], 0.7)
        bevel(g, x, y, CELL, CELL, RAMPS.gold, { depth: 1 })
      } else if (t === T.PORTAL) {
        const partner = this.arena.portalAt[i]!
        const ramp = Math.min(i, partner) % 2 ? RAMPS.pink : RAMPS.sky
        glow(g, x + 3, y + 3, 12, ramp[4], 0.75)
        g.fillStyle = ramp[3]
        g.fillRect(x + 1, y + 1, 4, 4)
        g.fillStyle = INK
        g.fillRect(x + 2, y + 2, 2, 2)
      } else if (isPad(t)) {
        const d = (t - T.PAD) as Dir
        glow(g, x + 3, y + 3, 8, line[3], 0.4)
        bevel(g, x, y, CELL, CELL, line, { depth: 1 })
        drawSprite(
          g,
          padArrow(d, (this.tick >> 3) % 2 ? INK : line[0]),
          x + 3,
          y + 3,
        )
      } else if (t === T.GATE) {
        const gate = gates[gateAt[i]!]!
        if (gateOpen(gate, beat)) {
          const warn = gateWarning(gate, beat)
          g.fillStyle =
            warn && flash ? RAMPS.gold[2] : rgba(RAMPS.ember[1], 0.5)
          g.fillRect(x + 1, y + 1, CELL - 2, CELL - 2)
        } else {
          bevel(g, x, y, CELL, CELL, RAMPS.ember, { depth: 1, outline: null })
          g.fillStyle = RAMPS.gold[3]
          if (((i % GRID) + Math.floor(i / GRID)) % 2)
            g.fillRect(x + 1, y + 2, 4, 2)
        }
      }
    }
    // Lamp posts last, so their light falls across the floor: a steel post, a glowing globe.
    for (let i = 0; i < terrain.length; i++) {
      if (terrain[i] !== T.PILLAR) continue
      const x = (i % GRID) * CELL
      const y = ARENA_Y + Math.floor(i / GRID) * CELL
      bevel(g, x, y, CELL, CELL, RAMPS.steel, { depth: 1, outline: INK })
      g.fillStyle = RAMPS.steel[0]
      g.fillRect(x + 1, y + CELL - 2, CELL - 2, 1)
    }
    for (let i = 0; i < terrain.length; i++) {
      if (terrain[i] !== T.PILLAR) continue
      const x = (i % GRID) * CELL + 3
      const y = ARENA_Y + Math.floor(i / GRID) * CELL + 2
      glow(g, x, y, 9, RAMPS.gold[3], 0.3)
      shadedOrb(g, x, y, 2, RAMPS.gold, { glint: false })
      g.fillStyle = RAMPS.gold[4]
      g.fillRect(x - 1, y - 1, 1, 1)
    }
  }

  /** The closing wall: a striped hazard band outside the arena, glowing along its inner edge. */
  private renderWalls(g: CanvasRenderingContext2D) {
    const m = this.margin * CELL
    const top = ARENA_Y
    const size = GRID * CELL
    const x0 = m
    const y0 = top + m
    const x1 = W - m
    const y1 = top + size - m
    const warn = this.shrinkTimer < 90 && Math.floor(this.tick / 8) % 2 === 0
    if (m > 0) {
      g.save()
      g.beginPath()
      g.rect(0, top, W, size)
      g.rect(x0, y0, x1 - x0, y1 - y0)
      g.clip('evenodd')
      g.fillStyle = warn ? RAMPS.ember[0] : mix(RAMPS.purple[0], INK, 0.4)
      g.fillRect(0, top, W, size)
      g.fillStyle = warn ? RAMPS.gold[2] : RAMPS.pink[0]
      g.beginPath()
      const shift = Math.floor(this.tick / 3) % 16
      for (let s = shift - 16; s < W + size; s += 16) {
        g.moveTo(s, top)
        g.lineTo(s + 8, top)
        g.lineTo(s + 8 - size, top + size)
        g.lineTo(s - size, top + size)
        g.closePath()
      }
      g.fill()
      g.restore()
    }
    if (this.arena.spec.shrink?.shape === 'spiral') {
      for (let i = 0; i < this.arena.spiralRank.length; i++) {
        const rank = this.arena.spiralRank[i]!
        if (rank < 0 || rank >= this.spiralCount) continue
        bevel(
          g,
          (i % GRID) * CELL,
          ARENA_Y + Math.floor(i / GRID) * CELL,
          CELL,
          CELL,
          RAMPS.purple,
          { depth: 1 },
        )
      }
    }
    this.renderRim(g, x0, y0, x1, y1, warn)
  }

  /** A steel rim, lit top-left, with a running chase of lights; a wrap edge glows open. */
  private renderRim(
    g: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    warn: boolean,
  ) {
    const { line } = this.floor
    const wrap = this.arena.spec.wrap
    const frame = (inset: number, lit: string, dark: string) => {
      const ax = x0 + inset
      const ay = y0 + inset
      const w = x1 - x0 - inset * 2
      const h = y1 - y0 - inset * 2
      g.fillStyle = dark
      if (!wrap?.y) g.fillRect(ax, ay + h - 1, w, 1)
      if (!wrap?.x) g.fillRect(ax + w - 1, ay, 1, h)
      g.fillStyle = lit
      if (!wrap?.y) g.fillRect(ax, ay, w, 1)
      if (!wrap?.x) g.fillRect(ax, ay, 1, h)
    }
    frame(-3, INK, INK)
    frame(-2, RAMPS.steel[4], RAMPS.steel[1])
    frame(-1, RAMPS.steel[3], RAMPS.steel[1])
    frame(0, RAMPS.steel[2], RAMPS.steel[0])
    const edge = warn ? RAMPS.gold[3] : line[3]
    frame(1, edge, edge)
    if (wrap?.x) {
      // The pier's open ends: light pours through from the other side.
      const pulse = 0.25 + 0.15 * Math.sin(this.tick / 10)
      for (const ex of [x0, x1 - 4]) {
        g.fillStyle = rgba(line[3], pulse)
        g.fillRect(ex, y0, 4, y1 - y0)
      }
    }
  }

  /** The ring of cells the wall takes next, flashing while the wall winds up. */
  private renderWarning(g: CanvasRenderingContext2D) {
    const s = this.arena.spec.shrink
    if (!s || this.shrinkTimer >= 90 || this.margin >= s.max) return
    if (this.over || this.dead > 0 || this.roundClear > 0) return
    const m = this.margin * CELL
    const flash = Math.floor(this.tick / 8) % 2 === 0
    g.fillStyle = rgba(flash ? RAMPS.gold[3] : RAMPS.ember[2], 0.4)
    if (s.shape === 'spiral') {
      if (this.spiralCount >= s.max * SPIRAL_STEP) return
      for (let i = 0; i < this.arena.spiralRank.length; i++) {
        const rank = this.arena.spiralRank[i]!
        if (rank >= this.spiralCount && rank < this.spiralCount + SPIRAL_STEP)
          g.fillRect(
            (i % GRID) * CELL,
            ARENA_Y + Math.floor(i / GRID) * CELL,
            CELL,
            CELL,
          )
      }
      return
    }
    const top = ARENA_Y + m
    const span = (GRID - this.margin * 2) * CELL
    g.fillRect(m, top, span, CELL)
    g.fillRect(m, top + span - CELL, span, CELL)
    g.fillRect(m, top + CELL, CELL, span - CELL * 2)
    g.fillRect(m + span - CELL, top + CELL, CELL, span - CELL * 2)
  }

  /** Wraps as gifts: striped paper in the wrapper's colours, a ribbon across, a bow on top. */
  private renderWraps(g: CanvasRenderingContext2D) {
    for (const w of this.wraps) {
      const live = w.cells.filter(
        (i) => this.fill[i] && this.inside(i % GRID, Math.floor(i / GRID)),
      )
      if (!live.length) continue
      const paper = w.seat === 0 ? RAINBOW_RAMPS : [rampOf(w.colour)]
      const set = new Set(live)
      const bx = w.bow % GRID
      const by = Math.floor(w.bow / GRID)
      const age = this.tick - w.born
      const P = PASSES
      for (const i of live) {
        const cx = i % GRID
        const cy = Math.floor(i / GRID)
        const x = cx * CELL
        const y = ARENA_Y + cy * CELL
        // Diagonal stripes, two cells a band, with a dot of shine in each cell.
        const band = Math.floor((cx + cy) / 2)
        const ramp = paper[band % paper.length]!
        const light = paper.length > 1 || band % 2 === 0
        P.body.add(light ? ramp[2] : ramp[1], x, y, CELL, CELL)
        P.lit.add(ramp[3], x + 1 + ((cx + cy) % 2) * 2, y + 1, 1, 1)
        if (!set.has(i - GRID)) P.shade.add(ramp[4], x, y, CELL, 1)
        if (!set.has(i - 1)) P.shade.add(ramp[4], x, y, 1, CELL)
        if (!set.has(i + GRID)) P.outline.add(INK, x, y + CELL - 1, CELL, 1)
        if (!set.has(i + 1)) P.outline.add(INK, x + CELL - 1, y, 1, CELL)
        if (cx === bx) P.core.add(RAMPS.cream[4], x + 2, y, 2, CELL)
        if (cy === by) P.core.add(RAMPS.cream[4], x, y + 2, CELL, 2)
      }
      g.save()
      P.body.flush(g)
      P.lit.flush(g)
      P.shade.flush(g)
      P.outline.flush(g)
      P.core.flush(g)
      if (age < 12) {
        g.globalAlpha = 1 - age / 12
        g.fillStyle = '#ffffff'
        for (const i of live) {
          g.fillRect(
            (i % GRID) * CELL,
            ARENA_Y + Math.floor(i / GRID) * CELL,
            CELL,
            CELL,
          )
        }
      }
      g.restore()
      if (set.has(w.bow)) {
        const pop = age < 10 ? 1 + Math.floor((10 - age) / 4) : 1
        drawSprite(
          g,
          bowSprite(RAMPS.pink[2]),
          bx * CELL + CELL / 2,
          ARENA_Y + by * CELL + CELL / 2,
          { scale: pop },
        )
      }
    }
  }

  /**
   * Ribbons as glowing tubes: an ink edge, an additive halo, then each cell shaded lit-side up
   * with a white-hot core running along the way the ribbon was laid.
   */
  private renderRibbons(g: CanvasRenderingContext2D) {
    for (const b of this.bikes) {
      let alpha = 1
      let dissolve = 1
      if (!b.alive) {
        if (b.fade <= 0) continue
        dissolve = b.fade / FADE_TICKS
        alpha = dissolve * (Math.floor(this.tick / 3) % 2 ? 1 : 0.6)
      }
      this.renderRibbon(g, b, alpha, dissolve)
    }
  }

  private ribbonRamps(b: Bike): readonly Ramp[] {
    if (b.seat === 0) return RAINBOW_RAMPS
    if (b.kind === 'copycat') return MIRROR_RAMPS
    return [rampOf(b.colour)]
  }

  private renderRibbon(
    g: CanvasRenderingContext2D,
    b: Bike,
    alpha: number,
    dissolve: number,
  ) {
    const P = PASSES
    const id = b.id
    const ramps = this.ribbonRamps(b)
    const lo = this.margin
    const hi = GRID - this.margin
    const pattern =
      b.seat === 0 && this.mode === 'festival' ? this.kit.pattern : 'plain'
    const marks: number[] = []
    let any = false
    for (let y = lo; y < hi; y++) {
      for (let x = lo; x < hi; x++) {
        const i = idx(x, y)
        if (this.cells[i] !== id || this.fill[i]) continue
        if (dissolve < 1 && cellNoise(i) > dissolve) continue
        any = true
        const o = this.order[i]!
        const ramp = ramps[Math.floor(o / 4) % ramps.length]!
        const linked = (j: number) =>
          this.cells[j] === id &&
          !this.fill[j] &&
          Math.abs(this.order[j]! - o) === 1
        const up = y > 0 && linked(i - GRID)
        const down = y < GRID - 1 && linked(i + GRID)
        const left = x > 0 && linked(i - 1)
        const right = x < GRID - 1 && linked(i + 1)
        const px = x * CELL
        const py = ARENA_Y + y * CELL
        P.outline.add(INK, px - 1, py - 1, CELL + 2, CELL + 3)
        const flare = this.roundTicks < this.bellUntil ? 2 : 0
        P.glow.add(
          ramp[2],
          px - 3 - flare,
          py - 3 - flare,
          CELL + 6 + flare * 2,
          CELL + 6 + flare * 2,
        )
        const stripe = pattern === 'stripes' && (o >> 1) % 2 === 1
        P.body.add(stripe ? ramp[4] : ramp[2], px, py, CELL, CELL)
        if ((pattern === 'hearts' || pattern === 'stars') && o % 6 === 3)
          marks.push(px + CELL / 2, py + CELL / 2)
        if (!up) P.lit.add(ramp[3], px, py, CELL, 1)
        if (!left) P.lit.add(ramp[3], px, py, 1, CELL)
        if (!down) P.shade.add(ramp[1], px, py + CELL - 1, CELL, 1)
        if (!right) P.shade.add(ramp[1], px + CELL - 1, py, 1, CELL)
        P.core.add(ramp[4], px + 2, py + 2, 2, 2)
        if (left) P.core.add(ramp[4], px, py + 2, 2, 2)
        if (right) P.core.add(ramp[4], px + 4, py + 2, 2, 2)
        if (up) P.core.add(ramp[4], px + 2, py, 2, 2)
        if (down) P.core.add(ramp[4], px + 2, py + 4, 2, 2)
      }
    }
    if (!any) return
    g.save()
    g.globalAlpha = alpha
    P.outline.flush(g)
    g.globalCompositeOperation = 'lighter'
    g.globalAlpha = alpha * 0.16
    P.glow.flush(g)
    g.globalCompositeOperation = 'source-over'
    g.globalAlpha = alpha
    P.body.flush(g)
    P.lit.flush(g)
    P.shade.flush(g)
    P.core.flush(g)
    const mark = pattern === 'hearts' ? HEART : STAR
    for (let k = 0; k < marks.length; k += 2)
      drawSprite(g, mark, marks[k]!, marks[k + 1]!)
    g.restore()
  }

  private renderPickups(g: CanvasRenderingContext2D) {
    for (const p of this.pickups) {
      if (p.life < 120 && (p.life >> 2) % 2 === 0) continue
      const x = p.x * CELL + CELL / 2
      const y = ARENA_Y + p.y * CELL + CELL / 2
      const bob = Math.round(Math.sin((this.tick + p.x * 7) / 8))
      glow(g, x, y, 10, RAMPS.pink[3], 0.5)
      g.fillStyle = INK
      g.fillRect(x - 6, y - 6 + bob, 12, 12)
      g.fillStyle = (this.tick >> 3) % 2 ? RAMPS.pink[2] : RAMPS.pink[4]
      g.fillRect(x - 5, y - 5 + bob, 10, 10)
      g.fillStyle = RAMPS.night[1]
      g.fillRect(x - 4, y - 4 + bob, 8, 8)
      drawSprite(g, pickupIcon(p.kind), x, y + bob)
    }
  }

  private renderBike(g: CanvasRenderingContext2D, b: Bike) {
    const art = bikeArt(b.colour, b.seat >= 0 ? RAMPS.sky[4] : RAMPS.steel[4])
    const cx = b.x * CELL + CELL / 2
    const cy = ARENA_Y + b.y * CELL + CELL / 2
    const boost = b.boosting || (b.kind === 'hugger' && b.hugging)
    const vertical = b.dir === 0 || b.dir === 2
    // The sprite sits a little behind the head cell, so the nose leads.
    const sx = cx - DX[b.dir] * 3
    const sy = cy - DY[b.dir] * 3
    dropShadow(g, sx + 1, sy + 3, vertical ? 5 : 8, vertical ? 8 : 4, 0.45)
    glow(g, cx, cy, boost ? 18 : 12, art.ramp[3], boost ? 0.7 : 0.45)
    this.renderTell(g, b, cx, cy)
    if (boost) {
      const tx = sx - DX[b.dir] * 9
      const ty = sy - DY[b.dir] * 9
      const flick = this.tick % 4 < 2 ? 1 : 0
      glow(g, tx, ty, 8 + flick * 2, RAMPS.ember[3], 0.8)
      g.fillStyle = RAMPS.ember[3]
      g.fillRect(Math.round(tx) - 1, Math.round(ty) - 1, 3, 3)
      g.fillStyle = RAMPS.gold[4]
      g.fillRect(
        Math.round(tx - DX[b.dir] * (1 + flick)),
        Math.round(ty - DY[b.dir] * (1 + flick)),
        1,
        1,
      )
    }
    if (b.braking) {
      // Brake lights: two red dots off the tail.
      const tx = sx - DX[b.dir] * 8
      const ty = sy - DY[b.dir] * 8
      glow(g, tx, ty, 6, RAMPS.ember[2], 0.8)
    }
    const wheel = this.ready > 0 ? 0 : b.wheel % 4
    // Lean into the turn, mapped to the sprite's own sides (see art.ts).
    const sign = b.dir === 0 || b.dir === 1 ? 1 : -1
    const lean = b.lean > 0 ? b.leanSide * sign : 0
    const sprite = (vertical ? art.up : art.left)[lean + 1]![wheel]!
    drawSprite(g, sprite, sx, sy, {
      flipX: b.dir === 1,
      flipY: b.dir === 2,
    })
    if (b.seat >= 0 && b.spool > 0) {
      glow(g, cx, cy, 14, RAMPS.pink[3], 0.4)
    }
    if (b.seat >= 0 && b.snips > 0) {
      g.fillStyle = RAMPS.steel[4]
      g.fillRect(
        Math.round(cx + DX[b.dir] * 5) - 1,
        Math.round(cy + DY[b.dir] * 5) - 1,
        2,
        2,
      )
    }
  }

  /** Each personality's tell, so a rival can be read at a glance. */
  private renderTell(
    g: CanvasRenderingContext2D,
    b: Bike,
    cx: number,
    cy: number,
  ) {
    if (b.seat >= 0 || !b.kind) return
    const ramp = rampOf(b.colour)
    let heading = Math.atan2(DY[b.dir], DX[b.dir])
    if (b.kind === 'roamer') heading += Math.sin(this.tick / 5) * 0.5
    if (b.kind === 'cutter') {
      const t = this.targetFor(b)
      if (t) {
        const to = Math.atan2(t.y - b.y, t.x - b.x)
        let delta = to - heading
        while (delta > Math.PI) delta -= Math.PI * 2
        while (delta < -Math.PI) delta += Math.PI * 2
        heading += Math.max(-0.8, Math.min(0.8, delta))
      }
    }
    if (b.kind === 'roamer' || b.kind === 'cutter') {
      // A headlight cone.
      g.save()
      g.globalCompositeOperation = 'lighter'
      g.globalAlpha = 0.22
      g.fillStyle = ramp[4]
      g.beginPath()
      g.moveTo(cx, cy)
      g.arc(cx, cy, 26, heading - 0.3, heading + 0.3)
      g.closePath()
      g.fill()
      g.restore()
    }
    if (b.kind === 'pacer') {
      // Pace lights on both flanks, blinking in step.
      const on = (this.tick >> 3) % 2 === 0
      for (const s of [turnLeft(b.dir), turnRight(b.dir)]) {
        g.fillStyle = on ? ramp[4] : ramp[1]
        g.fillRect(
          Math.round(cx + DX[s] * 6) - 1,
          Math.round(cy + DY[s] * 6) - 1,
          2,
          2,
        )
      }
    }
    if (b.kind === 'snowplow') {
      // A shovel nose, and white spray thrown off both sides.
      const s = turnRight(b.dir)
      const nx = cx + DX[b.dir] * 6
      const ny = cy + DY[b.dir] * 6
      g.fillStyle = RAMPS.steel[4]
      g.fillRect(
        Math.round(nx - Math.abs(DX[s]) * 4) - (DX[s] ? 0 : 1),
        Math.round(ny - Math.abs(DY[s]) * 4) - (DY[s] ? 0 : 1),
        DX[s] ? 9 : 2,
        DY[s] ? 9 : 2,
      )
      if (this.tick % 4 === 0) {
        for (const side of [s, turnLeft(b.dir)]) {
          this.fx.burst(nx + DX[side] * 4, ny + DY[side] * 4, this.fxRng, {
            count: 1,
            colours: ['#ffffff', RAMPS.sky[4]],
            speed: 0.7,
          })
        }
      }
    }
    if (b.kind === 'lanternKid') {
      const s = turnRight(b.dir)
      const lx = cx + DX[s] * 6
      const ly = cy + DY[s] * 6 - 2
      glow(g, lx, ly, 14, RAMPS.gold[3], 0.6 + 0.2 * Math.sin(this.tick / 5))
      drawSprite(g, LANTERN, lx, ly)
    }
    if (b.kind === 'pony') {
      g.fillStyle = RAMPS.gold[3]
      g.fillRect(Math.round(cx), Math.round(cy) - 9, 1, 6)
      drawSprite(g, horseSprite(), cx, cy - 9)
    }
    if (b.kind === 'hugger' && b.hugging && this.tick % 3 === 0) {
      const s = turnLeft(b.dir)
      this.fx.burst(cx + DX[s] * 4, cy + DY[s] * 4, this.fxRng, {
        count: 1,
        colours: [RAMPS.gold[4], RAMPS.ember[3]],
        speed: 0.8,
      })
    }
  }

  /** The carousel's canopy ring track and its turning horses. */
  private renderCarousel(g: CanvasRenderingContext2D) {
    const c = this.arena.spec.carousel
    if (!c) return
    const x0 = (c.cx - c.r) * CELL
    const y0 = ARENA_Y + (c.cy - c.r) * CELL
    const span = (c.r * 2 + 1) * CELL
    g.strokeStyle = rgba(RAMPS.gold[3], 0.35)
    g.lineWidth = 1
    g.strokeRect(x0 + 2.5, y0 + 2.5, span - 5, span - 5)
    const sprite = horseSprite()
    horseCells(c, this.carouselStep).forEach((i, k) => {
      const x = (i % GRID) * CELL + CELL / 2
      const y = ARENA_Y + Math.floor(i / GRID) * CELL + CELL / 2
      const bob = Math.round(Math.sin((this.tick + k * 11) / 7))
      glow(g, x, y, 8, RAMPS.pink[3], 0.4)
      g.fillStyle = RAMPS.gold[3]
      g.fillRect(x, y - 6, 1, 4)
      drawSprite(g, sprite, x, y + bob)
    })
  }

  /** Ribbon Art, Tag Lap arches, and the moon float, under the ribbons. */
  private renderObjective(g: CanvasRenderingContext2D) {
    if (this.node?.escort) {
      const x = this.escortColumn() * CELL + CELL / 2
      const y = ARENA_Y + this.node.escort.row * CELL + CELL / 2
      glow(g, x, y, 20, RAMPS.sky[4], 0.8)
      shadedOrb(g, x, y, 8, RAMPS.sky)
      drawSprite(g, STAR, x, y - 6)
    }
    if (this.outline.length) {
      const pulse = 0.35 + 0.2 * Math.sin(this.tick / 9)
      for (const i of this.outline) {
        const x = (i % GRID) * CELL
        const y = ARENA_Y + Math.floor(i / GRID) * CELL
        if (this.traced[i]) {
          g.fillStyle = rgba(RAMPS.gold[4], 0.75)
          g.fillRect(x + 1, y + 1, CELL - 2, CELL - 2)
        } else {
          g.fillStyle = rgba('#e0f2fe', pulse)
          g.fillRect(x + 2, y + 2, CELL - 4, CELL - 4)
        }
      }
    }
    if (!this.arches.length) return
    const p = this.player
    this.arches.forEach((cells, k) => {
      const next = k === p.arch
      const done = k < p.arch
      const ramp = done ? RAMPS.leaf : next ? RAMPS.gold : RAMPS.steel
      const flash = next && Math.floor(this.tick / 8) % 2 === 0
      for (const i of cells) {
        const x = (i % GRID) * CELL
        const y = ARENA_Y + Math.floor(i / GRID) * CELL
        g.fillStyle = rgba(ramp[flash ? 4 : 3], done ? 0.25 : 0.45)
        g.fillRect(x, y, CELL, CELL)
      }
      // A lit post at each end of the arch, and its number.
      for (const i of [cells[0]!, cells[cells.length - 1]!]) {
        const x = (i % GRID) * CELL + CELL / 2
        const y = ARENA_Y + Math.floor(i / GRID) * CELL + CELL / 2
        glow(g, x, y, 7, ramp[3], 0.6)
        shadedOrb(g, x, y, 2, ramp, { glint: false })
      }
      const mid = cells[Math.floor(cells.length / 2)]!
      drawText(
        g,
        String(k + 1),
        (mid % GRID) * CELL + CELL / 2,
        ARENA_Y + Math.floor(mid / GRID) * CELL - 1,
        { align: 'center', color: ramp[4], outline: INK },
      )
    })
  }

  private renderBugs(g: CanvasRenderingContext2D) {
    for (const bug of this.bugs) {
      const x = Math.round(bug.x * CELL)
      const y = ARENA_Y + Math.round(bug.y * CELL)
      const blink = Math.sin((this.tick + bug.x * 13) / 6) > -0.3
      glow(g, x, y, blink ? 12 : 7, RAMPS.gold[3], blink ? 0.7 : 0.4)
      drawSprite(g, GLOWBUG, x, y)
    }
  }

  /** A Tandem's bright tether, bike to bike. */
  private renderTethers(g: CanvasRenderingContext2D) {
    for (const b of this.bikes) {
      if (!b.alive || !b.lead) continue
      const mate = this.partnerOf(b)
      if (!mate?.alive) continue
      g.save()
      g.globalCompositeOperation = 'lighter'
      g.strokeStyle = rgba(RAMPS.gold[4], 0.5 + 0.3 * Math.sin(this.tick / 4))
      g.lineWidth = 1
      g.beginPath()
      g.moveTo(b.x * CELL + CELL / 2, ARENA_Y + b.y * CELL + CELL / 2)
      g.lineTo(mate.x * CELL + CELL / 2, ARENA_Y + mate.y * CELL + CELL / 2)
      g.stroke()
      g.restore()
    }
  }

  // --- the title, the Festival Board and the Paint Shop -----------------------------------------------

  private renderMenu(g: CanvasRenderingContext2D) {
    const m = this.menu!
    if (m.kind === 'title') return this.renderTitle(g, m)
    if (m.kind === 'board') return this.renderBoard(g, m)
    if (m.kind === 'credits') return this.renderCredits(g)
    this.renderShop(g, m)
  }

  private backdrop(g: CanvasRenderingContext2D, sky: readonly string[]) {
    bandedGradient(g, 0, 0, W, H, [sky[0]!, sky[1]!, sky[2]!, sky[1]!], 10)
    // Festoon lights strung across the top.
    for (let k = 0; k * 14 + 6 < W; k++) {
      const x = k * 14 + 6
      const sag = Math.round(Math.sin((x / W) * Math.PI) * 8)
      const on = (k + (this.tick >> 4)) % 3 !== 0
      const c = [RAMPS.gold[3], RAMPS.pink[3], RAMPS.sky[3]][k % 3]!
      if (on) glow(g, x, 8 + sag, 6, c, 0.6)
      g.fillStyle = on ? c : RAMPS.night[3]
      g.fillRect(x - 1, 7 + sag, 3, 3)
    }
  }

  private renderCredits(g: CanvasRenderingContext2D) {
    this.backdrop(g, FAIRGROUNDS[3]!.sky)
    drawText(
      g,
      this.trueEnding
        ? 'RAINBOW CHAMPION!'
        : this.encore
          ? 'ENCORE CHAMPION!'
          : 'FESTIVAL CHAMPION!',
      W / 2,
      40,
      {
        scale: 2,
        align: 'center',
        color: RAMPS.gold[4],
        outline: INK,
      },
    )
    drawText(
      g,
      this.trueEnding
        ? 'FIVE FAIRS. ONE FESTIVAL.'
        : 'FOUR FAIRS. FOUR MARSHALS.',
      W / 2,
      75,
      {
        align: 'center',
        color: RAMPS.cream[4],
        outline: INK,
      },
    )
    drawText(
      g,
      this.trueEnding
        ? 'THE SKY BLOOMS IN EVERY COLOUR'
        : 'THE RIBBONS LIGHT THE NIGHT',
      W / 2,
      96,
      {
        align: 'center',
        color: RAMPS.pink[3],
        outline: INK,
      },
    )
    for (let k = 0; k < 4; k++) {
      const y = 120 + k * 22
      drawSprite(g, bowSprite(RAMPS.gold[3]), 35, y)
      drawText(g, FAIRGROUNDS[k]!.name, 50, y - 4, {
        color: RAMPS.sky[4],
        outline: INK,
      })
    }
    drawText(g, 'THE LANTERN FESTIVAL CIRCUIT', W / 2, 226, {
      align: 'center',
      color: RAMPS.gold[3],
      outline: INK,
    })
    drawText(g, 'A KIND ROBOTS ARCADE GAME', W / 2, 244, {
      align: 'center',
      color: RAMPS.cream[3],
      outline: INK,
    })
    drawText(g, 'A TO RETURN TO THE FESTIVAL', W / 2, H - 18, {
      align: 'center',
      color: RAMPS.teal[3],
      outline: INK,
    })
  }

  private renderTitle(g: CanvasRenderingContext2D, m: Menu) {
    this.backdrop(g, FAIRGROUNDS[0]!.sky)
    drawText(g, 'RIBBON RIDERS', W / 2, 40, {
      scale: 3,
      align: 'center',
      color: RAMPS.gold[3],
      outline: INK,
      shadow: RAMPS.purple[1],
    })
    drawText(g, 'THE LANTERN FESTIVAL CIRCUIT', W / 2, 70, {
      align: 'center',
      color: RAMPS.teal[3],
      outline: INK,
    })
    drawSprite(
      g,
      bikeArt(SEAT_COLOURS[0]!).up[1]![(this.tick >> 3) % 4]!,
      W / 2,
      100,
    )
    const labels: Record<TitleChoice, string> = {
      continue: this.offer
        ? `CONTINUE: ${fairgroundAt(this.offer.fair).name}`
        : 'CONTINUE',
      new: 'NEW FESTIVAL',
      encore: 'ENCORE (MIRRORED FESTIVAL)',
      midway: 'THE MIDWAY (ENDLESS)',
      spool: 'THE RAINBOW SPOOL (SECRET)',
    }
    this.titleChoices.forEach((c, k) => {
      const y = 122 + k * 20
      const on = k === m.cursor
      hudPanel(g, 30, y - 5, W - 60, 18, on ? RAMPS.gold : undefined)
      drawText(g, labels[c], W / 2, y, {
        align: 'center',
        color: on ? '#ffffff' : RAMPS.cream[3],
        outline: INK,
      })
    })
    if (this.offer) {
      drawText(
        g,
        `TICKETS ${this.offer.tickets}   RIDERS ${this.offer.lives}`,
        W / 2,
        232,
        { align: 'center', color: RAMPS.pink[3], outline: INK },
      )
    }
    drawText(g, `GOLDEN BOWS ${this.goldenBows.length}/4`, W / 2, 248, {
      align: 'center',
      color: RAMPS.gold[3],
      outline: INK,
    })
    if (this.champion) {
      drawText(
        g,
        this.trueChampion ? '* RAINBOW CHAMPION *' : '* FESTIVAL CHAMPION *',
        W / 2,
        264,
        {
          align: 'center',
          color: RAMPS.gold[4],
          outline: INK,
        },
      )
    }
    drawText(g, 'UP/DOWN TO CHOOSE   A TO RIDE', W / 2, H - 20, {
      align: 'center',
      color: RAMPS.teal[3],
      outline: INK,
    })
  }

  private renderBoard(g: CanvasRenderingContext2D, m: Menu) {
    const f = this.fairground
    this.backdrop(g, f.sky)
    drawText(g, f.name, W / 2, 28, {
      scale: 2,
      align: 'center',
      color: '#ffffff',
      outline: INK,
      shadow: RAMPS.purple[1],
    })
    drawText(g, 'THE FESTIVAL BOARD', W / 2, 46, {
      align: 'center',
      color: RAMPS.gold[3],
      outline: INK,
    })
    drawText(g, f.tagline, W / 2, 57, {
      align: 'center',
      color: RAMPS.teal[3],
      outline: INK,
    })
    const open = this.boardEvents()
    const chosen = open[m.cursor % Math.max(1, open.length)]
    const pos = (a: FairArena): [number, number] => [a.at[0], a.at[1]]
    // The strings between the lanterns.
    g.strokeStyle = rgba(f.string, 0.55)
    g.lineWidth = 1
    for (const a of f.arenas) {
      for (const n of a.next) {
        const b = arenaById(f, n)
        const [x0, y0] = pos(a)
        const [x1, y1] = pos(b)
        g.beginPath()
        g.moveTo(x0 + 0.5, y0 + 0.5)
        g.quadraticCurveTo(
          (x0 + x1) / 2,
          (y0 + y1) / 2 + 10,
          x1 + 0.5,
          y1 + 0.5,
        )
        g.stroke()
      }
    }
    for (const a of f.arenas) {
      const [x, y] = pos(a)
      const done = this.cleared.has(a.id)
      const isOpen = open.includes(a.id)
      const on = a.id === chosen
      const ramp = a.marshal
        ? RAMPS.ember
        : a.special
          ? RAMPS.purple
          : RAMPS.gold
      const r = a.marshal ? 13 : 9
      if (isOpen) glow(g, x, y, on ? 26 : 18, ramp[3], on ? 0.9 : 0.5)
      shadedOrb(g, x, y, r, done ? RAMPS.leaf : isOpen ? ramp : RAMPS.steel)
      if (done) drawSprite(g, bowSprite(RAMPS.pink[2]), x, y - r)
      if (on && Math.floor(this.tick / 10) % 2 === 0) {
        g.strokeStyle = '#ffffff'
        g.strokeRect(x - r - 3.5, y - r - 3.5, r * 2 + 7, r * 2 + 7)
      }
      drawText(g, a.name, x, y + r + 4, {
        align: 'center',
        color: isOpen ? '#ffffff' : RAMPS.steel[3],
        outline: INK,
      })
    }
    const a = chosen ? arenaById(f, chosen) : null
    hudPanel(g, 6, H - 58, W - 12, 52)
    if (a) {
      const objective = OBJECTIVES[a.objective]
      drawText(g, objective.name, 12, H - 52, {
        color: RAMPS.gold[3],
        outline: INK,
      })
      drawText(g, `${a.tickets} TICKETS`, W - 12, H - 52, {
        align: 'right',
        color: RAMPS.pink[3],
        outline: INK,
      })
      drawText(g, objective.about, 12, H - 41, {
        color: RAMPS.cream[3],
        outline: INK,
      })
      drawText(
        g,
        a.special
          ? this.goldenBows.includes(f.id)
            ? 'GOLDEN BOW EARNED'
            : 'GOLDEN BOW: BEAT PAR. RIDE KINDLY.'
          : a.crew.length
            ? this.crewNames(a.crew)
            : a.intro,
        12,
        H - 30,
        { color: RAMPS.teal[3], outline: INK },
      )
      drawText(g, 'LEFT/RIGHT TO PICK   A TO RIDE', 12, H - 19, {
        color: RAMPS.sky[3],
        outline: INK,
      })
    }
    this.renderHud(g)
  }

  private renderShop(g: CanvasRenderingContext2D, m: Menu) {
    this.backdrop(g, ['#1a0d22', '#2e1438', '#4a1f4a'])
    drawText(g, 'THE PAINT SHOP', W / 2, 30, {
      scale: 2,
      align: 'center',
      color: RAMPS.pink[3],
      outline: INK,
      shadow: RAMPS.purple[1],
    })
    drawText(g, 'SPEND YOUR FESTIVAL TICKETS', W / 2, 48, {
      align: 'center',
      color: RAMPS.cream[3],
      outline: INK,
    })
    SHOP.forEach((item, k) => {
      const y = 66 + k * 24
      const on = k === m.cursor
      const block = shopBlock(item, this.kit, this.tickets, this.lives)
      const wearing = this.kit.pattern === item.id
      hudPanel(g, 12, y - 4, W - 24, 20, on ? RAMPS.gold : undefined)
      drawText(g, item.name, 18, y, {
        color: block && block !== 'WEAR IT' ? RAMPS.steel[3] : '#ffffff',
        outline: INK,
      })
      if (item.about)
        drawText(g, item.about, 18, y + 8, {
          color: RAMPS.teal[3],
          outline: INK,
        })
      const tag = wearing
        ? 'WEARING'
        : block === 'WEAR IT'
          ? 'OWNED'
          : block === 'FITTED' || block === 'FULL'
            ? block
            : item.cost
              ? String(item.cost)
              : ''
      if (tag) {
        if (item.cost && !wearing && block !== 'WEAR IT' && block !== 'FITTED')
          drawSprite(g, TICKET, W - 50, y + 3)
        drawText(g, tag, W - 18, y, {
          align: 'right',
          color: RAMPS.gold[3],
          outline: INK,
        })
      }
    })
    if (m.note) {
      drawText(g, m.note, W / 2, H - 22, {
        align: 'center',
        color: RAMPS.gold[4],
        outline: INK,
      })
    }
    this.renderHud(g)
  }

  private renderPresent(g: CanvasRenderingContext2D, b: Bike) {
    const x = b.x * CELL + CELL / 2
    const y = ARENA_Y + b.y * CELL + CELL / 2
    const hop = Math.abs(Math.round(Math.sin((this.tick + b.id * 9) / 6) * 2))
    dropShadow(g, x, y + 5, 5, 2, 0.4)
    drawSprite(g, presentSprite(b.colour), x, y - hop)
  }

  private renderRing(g: CanvasRenderingContext2D, r: Ring) {
    const t = 1 - r.life / RING_TICKS
    g.save()
    g.globalCompositeOperation = 'lighter'
    g.globalAlpha = 1 - t
    g.strokeStyle = r.colour
    g.lineWidth = 2
    g.beginPath()
    g.arc(r.x, r.y, 3 + t * 18, 0, Math.PI * 2)
    g.stroke()
    g.restore()
  }

  /** The festival objective's progress, across the top of the arena. */
  private objectiveStatus(): string {
    const a = this.node
    if (!a) return ''
    const clock = (t: number) => {
      const s = Math.ceil(t / 60)
      return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
    }
    const p = this.player
    switch (a.objective) {
      case 'last':
        return `RIVALS ROLLING ${this.rivals.filter((b) => b.alive && !this.harmless(b)).length}`
      case 'giftwrap':
        return `WRAPPED ${this.wrappedCount}/${this.crewSize()}   ${clock(this.timeLeft)}`
      case 'glowbug': {
        const best = Math.max(0, ...this.rivals.map((b) => b.bugs))
        return `BUGS ${p.bugs}/${a.glowbugs!.target}   BEST RIVAL ${best}`
      }
      case 'art':
        return `TRACED ${Math.floor(this.artShare() * 100)}%/${Math.round(a.art!.share * 100)}%   ${clock(this.timeLeft)}`
      case 'taglap': {
        const best = Math.max(0, ...this.rivals.map((b) => b.arch))
        return `ARCH ${Math.min(p.arch + 1, this.arches.length)}/${this.arches.length}   CREW ${best}`
      }
      case 'escort':
        return `MOON ${this.escortColumn() - 5}/37  SAFE ${Math.max(0, a.escort!.health - this.escortHits)}/${a.escort!.health}`
      case 'marshal': {
        const m = this.marshal
        if (!m) return ''
        const hp = '*'.repeat(3 - m.hits)
        return `${m.name}  ${hp}  PHASE ${Math.min(3, m.phase)}`
      }
    }
  }

  private renderHud(g: CanvasRenderingContext2D) {
    const p = this.player
    hudPanel(g, 2, 2, 74, 19)
    drawText(g, String(this.score).padStart(6, '0'), 4, 4, {
      scale: 2,
      color: RAMPS.gold[3],
      shadow: INK,
    })
    // Turbo, and the slipstream chain riding on it.
    hudPanel(g, 79, 2, 72, 19, RAMPS.sky)
    const fill = p.turbo / TURBO_MAX
    drawText(g, p.braking ? 'BRAKE' : 'TURBO', 83, 4, {
      color: p.braking
        ? RAMPS.ember[3]
        : p.boosting
          ? RAMPS.gold[4]
          : RAMPS.sky[4],
      outline: INK,
    })
    const mult = slipMultiplier(p.chain)
    if (p.chain > 0) {
      drawText(g, `x${mult} ${p.chain}`, 147, 4, {
        align: 'right',
        color: mult > 1 ? RAMPS.gold[4] : RAMPS.teal[3],
        outline: INK,
      })
    }
    gauge(
      g,
      83,
      13,
      64,
      4,
      fill,
      p.boosting ? RAMPS.gold : fill < 0.25 ? RAMPS.ember : RAMPS.teal,
    )
    // Spare riders and the kit in hand.
    hudPanel(g, 154, 2, 56, 19)
    drawSprite(g, bikeArt(p.colour).up[1]![0]!, 162, 12)
    drawText(g, `x${Math.max(0, this.lives - 1)}`, 169, 9, {
      color: RAMPS.cream[3],
      outline: INK,
    })
    let ix = 190
    const kit: Array<[PickupKind, string | null]> = []
    if (p.snips > 0) kit.push(['snip', p.snips > 1 ? String(p.snips) : null])
    if (p.bow) kit.push(['bow', null])
    if (p.spool > 0) kit.push(['spool', null])
    for (const [kind, label] of kit.slice(0, 2)) {
      drawSprite(g, pickupIcon(kind), ix, 11)
      if (label) {
        drawText(g, label, ix + 5, 13, { color: '#ffffff', outline: INK })
      }
      ix += 11
    }
    hudPanel(g, 213, 2, 73, 19)
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, 282, 4, {
      align: 'right',
      color: RAMPS.pink[3],
      outline: INK,
    })
    if (this.mode === 'festival') {
      drawSprite(g, TICKET, 222, 15)
      drawText(g, String(this.tickets), 282, 12, {
        align: 'right',
        color: RAMPS.gold[3],
        outline: INK,
      })
    } else {
      drawText(g, `ROUND ${this.level}`, 282, 12, {
        align: 'right',
        color: RAMPS.teal[3],
        outline: INK,
      })
    }
    const status = this.menu ? '' : this.objectiveStatus()
    if (status) {
      g.save()
      g.globalAlpha = 0.6
      g.fillStyle = INK
      g.fillRect(0, ARENA_Y, W, 10)
      g.restore()
      drawText(g, status, W / 2, ARENA_Y + 2, {
        align: 'center',
        color:
          this.timeLeft > 0 && this.timeLeft < 600 && (this.tick >> 3) % 2
            ? RAMPS.ember[3]
            : RAMPS.cream[4],
        outline: INK,
      })
    }
    if (this.freeze > 0) {
      drawText(g, 'FREEZE!', W / 2, ARENA_Y + 8, {
        align: 'center',
        color: RAMPS.sky[4],
        outline: INK,
      })
    }
    // The title, the board and the Paint Shop speak for themselves: no cards over them.
    const b = this.menu ? null : this.banner
    if (b) {
      const lines = b.lines ?? []
      const top = ARENA_Y + 110
      const tall = 22 + (b.sub ? 12 : 0) + lines.length * 10
      g.save()
      g.globalAlpha = 0.72
      g.fillStyle = INK
      g.fillRect(0, top - 6, W, tall + 8)
      g.restore()
      drawText(g, b.text, W / 2, top, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.purple[1],
      })
      let y = top + 20
      if (b.sub) {
        drawText(g, b.sub, W / 2, y, {
          align: 'center',
          color: RAMPS.gold[3],
          outline: INK,
        })
        y += 12
      }
      for (const line of lines) {
        drawText(g, line, W / 2, y, {
          align: 'center',
          color: RAMPS.teal[3],
          outline: INK,
        })
        y += 10
      }
    }
  }
}

const ribbonRiders: ArcadeGameModule = {
  create: (options) => new RibbonRiders(options),
}

export const create = ribbonRiders.create
export default ribbonRiders
