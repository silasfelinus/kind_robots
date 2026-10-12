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
  reverse,
  turnLeft,
  turnRight,
  type Dir,
} from '../ribbonRiders/grid'
import {
  DEFAULT_PICKUPS,
  MAX_LIT_PICKUPS,
  MIDWAY,
  RIDER_SPAWNS,
  RIVAL_SPAWNS,
  buildArena,
  gateOpen,
  gateWarning,
  type BuiltArena,
} from '../ribbonRiders/arenas'
import {
  FLOORS,
  MIRROR_RAMPS,
  RAINBOW_RAMPS,
  SEAT_COLOURS,
  bikeArt,
  bowSprite,
  pickupIcon,
  presentSprite,
  rampOf,
} from '../ribbonRiders/art'
import { BEAT_TICKS, MIDWAY_MUSIC } from '../ribbonRiders/music'
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
  private bikes: Bike[] = []
  private pickups: Pickup[] = []
  private pickupTimer = 0
  private wraps: Wrap[] = []
  private margin = 0
  private shrinkTimer = 0
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

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.startRound(1)
  }

  get music(): MusicLoop | null {
    if (this.demo || this.over) return null
    return MIDWAY_MUSIC
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

  private startRound(round: number) {
    this.level = round
    const spec = MIDWAY[(round - 1) % MIDWAY.length]!
    const lap = Math.floor((round - 1) / MIDWAY.length)
    this.arena = buildArena(spec)
    this.cells.fill(0)
    this.fill.fill(0)
    this.order.fill(0)
    this.wraps = []
    this.pickups = []
    this.pickupTimer = spec.pickups?.first ?? DEFAULT_PICKUPS.first
    this.margin = 0
    this.shrinkTimer = this.shrinkEvery()
    this.freeze = 0
    this.roundTicks = 0
    const crew = [...spec.crew]
    for (let i = 0; i < lap && crew.length < MAX_CREW; i++)
      crew.push(LAP_EXTRAS[i % LAP_EXTRAS.length]!)
    const old = this.bikes[0]
    const rider = newBike(1, 0, null, RIDER_SPAWNS[0]!, SEAT_COLOURS[0]!)
    if (old) {
      // A rider's kit is the rider's, not the round's: snips and chains ride on.
      rider.snips = old.snips
    }
    this.bikes = [rider]
    const spawns = spec.rivalSpawns ?? RIVAL_SPAWNS
    crew.forEach((kind, i) => {
      const spawn = spawns[i] ?? RIVAL_SPAWNS[i % RIVAL_SPAWNS.length]!
      this.bikes.push(
        newBike(FIRST_RIVAL_ID + i, -1, kind, spawn, RIVALS[kind].colour),
      )
    })
    for (const b of this.bikes) this.lay(b)
    this.ready = this.demo ? 60 : READY_TICKS
    const names = [...new Set(crew)].map((k) => RIVALS[k].name)
    const fresh = [...new Set(crew)].find((k) => !this.seenKinds.has(k))
    for (const k of crew) this.seenKinds.add(k)
    this.banner = {
      text: spec.name,
      sub: `ROUND ${round}   ${names.join(' ')}`,
      lines: fresh
        ? [`${RIVALS[fresh].name}: ${RIVALS[fresh].tell}`, RIVALS[fresh].answer]
        : ['CLOSE A LOOP TO WRAP A RIVAL'],
      ticks: this.ready,
    }
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

  /** Solid terrain on this cell right now (lookahead: a gate about to shut counts). */
  private terrainSolid(i: number, lookahead = false): boolean {
    const t = this.arena.terrain[i]!
    if (t === T.PILLAR) return true
    if (t === T.GATE) {
      const gate = this.arena.gates[this.arena.gateAt[i]!]!
      if (!gateOpen(gate, this.beat)) return true
      return lookahead && gateWarning(gate, this.beat)
    }
    return false
  }

  private blocked(x: number, y: number, lookahead = false): boolean {
    // Riders who can see the wall flashing keep clear of the next line in.
    const m = this.margin + (lookahead && this.shrinkTimer < 90 ? 1 : 0)
    if (!this.inside(x, y, m)) return true
    const i = idx(x, y)
    return this.cells[i] !== 0 || this.terrainSolid(i, lookahead)
  }

  private lay(b: Bike, x = b.x, y = b.y, order = b.laid++) {
    const i = idx(x, y)
    this.cells[i] = b.id
    this.fill[i] = 0
    this.order[i] = order
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    const controls = this.demo ? this.demoInput() : input
    this.updateFades()

    if (this.roundClear > 0) {
      if (--this.roundClear === 0) this.startRound(this.level + 1)
      return
    }
    if (this.dead > 0) {
      if (--this.dead === 0) {
        if (this.lives <= 0) {
          this.over = true
          this.banner = { text: 'GAME OVER', ticks: 9999 }
        } else {
          this.startRound(this.level)
        }
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
    if (this.beat !== beat) this.onBeat()

    for (const r of this.riders) this.runKit(r)
    if (--this.shrinkTimer <= 0) this.shrink()
    if (this.freeze > 0) this.freeze--
    this.updatePickups()

    const pace = levelCurve(this.level, RIBBON_CURVES.speed)
    for (const b of this.bikes) {
      if (!b.alive) continue
      b.speed = this.speedOf(b, pace)
      if (b.seat < 0 && this.freeze > 0) continue
      b.acc += b.speed
      if (b.lean > 0) b.lean--
    }
    // Step the bikes a cell at a time, together, so head-on meetings are fair.
    while (this.bikes.some((b) => b.alive && b.acc >= 1)) {
      this.stepBikes(this.bikes.filter((b) => b.alive && b.acc >= 1))
      if (!this.player.alive) break
    }
    this.checkRoundOver()
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
    if (spec.speed === 'match') {
      const t = this.targetFor(b)
      return t ? Math.max(pace * 0.5, t.speed) : pace
    }
    let speed = pace * spec.speed
    if (b.kind === 'hugger') {
      b.hugging = besideSolid(this.ctx(b), b.x, b.y, b.dir)
      if (b.hugging) speed *= HUG_BOOST
    }
    return speed
  }

  private stepBikes(moving: Bike[]) {
    const targets = new Map<number, Bike[]>()
    for (const b of moving) {
      b.acc -= 1
      const was = b.dir
      if (b.seat < 0) b.want = steer(this.ctx(b), b, b.kind!)
      if (b.want !== reverse(b.dir)) b.dir = b.want
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
      if (this.blocked(nx, ny) && !this.snip(b, nx, ny)) {
        this.crash(b)
        continue
      }
      const key = idx(nx, ny)
      targets.set(key, [...(targets.get(key) ?? []), b])
    }
    for (const [key, group] of targets) {
      if (group.length > 1) {
        for (const b of group) this.crash(b)
        continue
      }
      const b = group[0]!
      const prev = idx(b.x, b.y)
      b.x = key % GRID
      b.y = Math.floor(key / GRID)
      b.wheel++
      const t = this.arena.terrain[key]!
      if (isPad(t)) {
        b.dir = (t - T.PAD) as Dir
        b.want = b.dir
      }
      this.lay(b)
      if (b.kind === 'dasher') {
        // Every other cell is left open: the Dasher's own wall leaks.
        if (b.dash && this.cells[prev] === b.id && !this.fill[prev])
          this.cells[prev] = 0
        b.dash = !b.dash
      }
      if (b.seat >= 0) this.rode(b)
    }
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
    if (b.spool > 0) {
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
    this.wrapUp(b)
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

  private wrapUp(b: Bike) {
    const team = (owner: number) => owner === b.id
    const regions = findWraps({
      x: b.x,
      y: b.y,
      dir: b.dir,
      limit: WRAP_LIMIT * (b.bow ? 2 : 1),
      wrapX: this.arena.spec.wrap?.x,
      wrapY: this.arena.spec.wrap?.y,
      side: (x, y) => {
        if (!this.inside(x, y)) return true
        const i = idx(x, y)
        return team(this.cells[i]!) || this.terrainSolid(i)
      },
      forbid: (i) =>
        this.bikes.some(
          (o) => o.seat >= 0 && o !== b && o.alive && idx(o.x, o.y) === i,
        ),
    })
    for (const region of regions) this.giftWrap(b, region)
  }

  private giftWrap(b: Bike, region: number[]) {
    const inRegion = new Set(region)
    let caught = 0
    for (const r of this.rivals) {
      if (!r.alive || !inRegion.has(idx(r.x, r.y))) continue
      r.alive = false
      r.wrapped = true
      r.fade = FADE_TICKS
      caught++
    }
    // This wrap spends a Bow in hand; one wrapped up inside is kept for the next.
    b.bow = false
    for (const i of region) {
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
    if (caught) {
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
      if (this.cells[i] || this.arena.terrain[i] !== T.FLOOR) continue
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
    if (!s || this.margin >= s.max) return
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
    if (this.player.alive) this.addScore(250 * this.level, px, py - 6)
  }

  private checkRoundOver() {
    if (!this.player.alive || this.dead > 0) return
    if (this.rivals.some((b) => b.alive)) return
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
    return {
      rng: this.rng,
      cunning: levelCurve(this.level, RIBBON_CURVES.cunning),
      room: (x, y) => this.room(x, y),
      next: (x, y, d) => this.next(x, y, d),
      solid: (x, y) => this.blocked(x, y),
      target: this.targetFor(b),
    }
  }

  /** Free cells reachable from (x, y), counted up to FLOOD_LIMIT. */
  private room(x: number, y: number, limit = FLOOD_LIMIT): number {
    if (this.blocked(x, y, true)) return 0
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
        if (seen.has(k) || this.blocked(n[0], n[1], true)) continue
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
    for (const d of [p.dir, turnLeft(p.dir), turnRight(p.dir)] as Dir[]) {
      const n = this.next(p.x, p.y, d)
      const space = n ? this.room(n[0], n[1], 140) : 0
      spaces.push(space)
      let score = space + (d === p.dir ? 3 : 0)
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
    this.renderFloor(g)
    this.renderTerrain(g)
    this.renderWalls(g)
    this.renderWraps(g)
    this.renderRibbons(g)
    this.renderWarning(g)
    this.renderPickups(g)
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
    for (let i = 0; i < terrain.length; i++) {
      const t = terrain[i]!
      if (t === T.FLOOR) continue
      const x = (i % GRID) * CELL
      const y = ARENA_Y + Math.floor(i / GRID) * CELL
      if (isPad(t)) {
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
        P.glow.add(ramp[2], px - 3, py - 3, CELL + 6, CELL + 6)
        P.body.add(ramp[2], px, py, CELL, CELL)
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
    if (b.kind === 'hugger' && b.hugging && this.tick % 3 === 0) {
      const s = turnLeft(b.dir)
      this.fx.burst(cx + DX[s] * 4, cy + DY[s] * 4, this.fxRng, {
        count: 1,
        colours: [RAMPS.gold[4], RAMPS.ember[3]],
        speed: 0.8,
      })
    }
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
    drawText(g, `ROUND ${this.level}`, 282, 12, {
      align: 'right',
      color: RAMPS.teal[3],
      outline: INK,
    })
    if (this.freeze > 0) {
      drawText(g, 'FREEZE!', W / 2, ARENA_Y + 8, {
        align: 'center',
        color: RAMPS.sky[4],
        outline: INK,
      })
    }
    const b = this.banner
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
