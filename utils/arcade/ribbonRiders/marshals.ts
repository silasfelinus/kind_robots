// /utils/arcade/ribbonRiders/marshals.ts
//
// The Grand Marshals of the first two fairgrounds (conductor kr-arcade/t-075). Each is a big
// rider with three phases, beaten by wrapping: closing a loop round the glowing part this phase
// asks for. A Marshal paints its solid cells into the arena each tick (1: solid and a wrap side,
// 2: solid but not a side, so a loop can take it) and talks to the game only through its host.
//
//   The Carousel Keeper  1: a shrinking ring with gaps on the chime; wrap a pony on the inside lane.
//                        2: the ponies break off as three small rivals; wrap all three to crack it.
//                        3: a spiral winds out from the hub; loop the hub before it reaches you.
//   The Zamboni Swan     1: sweeps the rink in straight lines, wiping every ribbon; build behind it.
//                        2: its wake freezes to ice, and it sweeps faster.
//                        3: it chases you; lure it onto a snowbank to stall it, then wrap it.

import {
  INK,
  RAMPS,
  bevel,
  dropShadow,
  glow,
  pixelSprite,
  drawSprite,
  shadedOrb,
  type PixelSprite,
} from '../snes'
import { ringCells, type Spawn } from './arenas'
import { ClockworkConductor, LoomSpinner } from './lateMarshals'
import type { MarshalKind } from './fairgrounds'
import { ARENA_Y, CELL, DX, DY, GRID, T, idx, reverse, type Dir } from './grid'

/** What a Marshal may ask of the game. */
export interface MarshalHost {
  beat(): number
  terrainAt(i: number): number
  /** A ribbon or a wrapped gift lies on this cell. */
  ribbonAt(i: number): boolean
  /** A bike's head is on this cell. */
  bikeAt(i: number): boolean
  /** Wipe the ribbon or gift on a cell. */
  clearCell(i: number): void
  /** Bump any bike whose head is on this cell. */
  bumpAt(i: number): void
  /** Turn a floor cell to ice. */
  freezeIce(i: number): void
  /** Melt the snowbank on this cell at once; false when there is none. */
  meltBankAt(i: number): boolean
  /** Put the Keeper's ponies on the board as rivals. */
  spawnPonies(spawns: readonly Spawn[]): void
  player(): { x: number; y: number } | null
  say(text: string, sub?: string): void
  sfx(name: 'blip' | 'warn' | 'boom' | 'level' | 'pop'): void
  burst(cell: number, big?: boolean): void
}

export interface Marshal {
  readonly kind: MarshalKind
  readonly name: string
  readonly phase: number
  /** Phases beaten (3 beats it). */
  readonly hits: number
  readonly defeated: boolean
  /** The largest loop that may take this Marshal's target. */
  readonly limit: number
  update(): void
  paint(dyn: Uint8Array): void
  /** The cells a loop must take to land a hit this phase. */
  targets(): number[]
  /** Cells about to turn solid (the tells), which careful riders keep out of. */
  danger(): number[]
  /** The player closed a loop over these cells: true when it landed a hit. */
  wrapped(region: ReadonlySet<number>): boolean
  /** A rival of this kind was wrapped (the Keeper's ponies). */
  rivalWrapped(kind: string): void
  render(g: CanvasRenderingContext2D, tick: number): void
}

export const MARSHAL_LIMIT = 420

// --- the Carousel Keeper -------------------------------------------------------------------------

export const KEEPER = { cx: 24, cy: 23 } as const
const RING_START = 11
const RING_MIN = 7
/** Beats between the ring winding in a step. */
const SHRINK_BEATS = 8
/** The chime: gaps open for the first two beats of every four, flashing on the last. */
const CHIME_BEATS = 4
const PONY_EVERY = 10
const SPIRAL_EVERY = 5
export const PONY_SPAWNS: readonly Spawn[] = [
  [5, 5, 2],
  [42, 5, 2],
  [24, 3, 1],
]

/** A square spiral winding out from round the hub, two cells between its turns. */
export function spiralPath(cx: number, cy: number, reach = 15): number[] {
  const out: number[] = []
  let x = cx - 2
  let y = cy - 2
  let d: Dir = 1
  out.push(idx(x, y))
  for (let n = 0; ; n++) {
    const len = 4 + 3 * Math.floor(n / 2)
    for (let s = 0; s < len; s++) {
      x += DX[d]
      y += DY[d]
      if (
        Math.abs(x - cx) > reach ||
        Math.abs(y - cy) > reach ||
        x < 1 ||
        y < 1 ||
        x > GRID - 2 ||
        y > GRID - 2
      )
        return out
      out.push(idx(x, y))
    }
    d = ((d + 1) % 4) as Dir
  }
}

function hubCells(cx: number, cy: number): number[] {
  const out: number[] = []
  for (let y = cy - 1; y <= cy + 1; y++)
    for (let x = cx - 1; x <= cx + 1; x++) out.push(idx(x, y))
  return out
}

const HORSE = pixelSprite(
  ['..mm..', '.mWWm.', 'mWWWWd', '.WWWd.', '.p..p.', '.p..p.'],
  {
    m: RAMPS.pink[3],
    W: RAMPS.cream[4],
    d: RAMPS.cream[2],
    p: RAMPS.gold[3],
  },
)

export function horseSprite(): PixelSprite {
  return HORSE
}

export class CarouselKeeper implements Marshal {
  readonly kind = 'keeper'
  readonly name = 'THE CAROUSEL KEEPER'
  readonly limit = MARSHAL_LIMIT
  phase = 1
  hits = 0
  defeated = false
  r = RING_START
  /** Where each pony stands on the inside lane, as an index round it. */
  ponies: number[] = []
  ponyWraps = 0
  spiral: number[] = []
  laid = 0
  private lastBeat = -1
  private ticks = 0
  private hub = hubCells(KEEPER.cx, KEEPER.cy)

  constructor(private host: MarshalHost) {
    const lane = this.lane()
    this.ponies = [0, 1, 2].map((k) => Math.floor((k * lane.length) / 3))
    this.spiral = spiralPath(KEEPER.cx, KEEPER.cy)
  }

  private lane(): number[] {
    return ringCells(KEEPER.cx, KEEPER.cy, Math.max(3, this.r - 3))
  }

  /** The ring's gap cells this chime: three on each side, shifting round the chimes. */
  gapCells(beat = this.host.beat()): number[] {
    const { cx, cy } = KEEPER
    // The first chime opens the middle of each side, right in front of the riders' line-up.
    const shift = (((Math.floor(beat / CHIME_BEATS) + 1) % 3) - 1) * 3
    const r = this.r
    const out: number[] = []
    for (let k = -1; k <= 1; k++) {
      out.push(idx(cx + shift + k, cy - r), idx(cx - shift + k, cy + r))
      out.push(idx(cx + r, cy + shift + k), idx(cx - r, cy - shift + k))
    }
    return out
  }

  gapsOpen(beat = this.host.beat()): boolean {
    return this.phase < 3 && beat % CHIME_BEATS < 2
  }

  /** The beat before the gaps open: they flash. */
  gapsTell(beat = this.host.beat()): boolean {
    return this.phase < 3 && beat % CHIME_BEATS === CHIME_BEATS - 1
  }

  /** The beat before the ring winds in: the next line flashes. */
  shrinkTell(beat = this.host.beat()): boolean {
    return (
      this.phase === 1 &&
      this.r > RING_MIN &&
      beat % SHRINK_BEATS === SHRINK_BEATS - 1
    )
  }

  ringNow(): number[] {
    if (this.phase === 3) return []
    const ring = ringCells(KEEPER.cx, KEEPER.cy, this.r)
    if (!this.gapsOpen()) return ring
    const gaps = new Set(this.gapCells())
    return ring.filter((i) => !gaps.has(i))
  }

  ponyCells(): number[] {
    if (this.phase !== 1) return []
    const lane = this.lane()
    return this.ponies.map((p) => lane[p % lane.length]!)
  }

  update() {
    this.ticks++
    const beat = this.host.beat()
    if (beat !== this.lastBeat) {
      this.lastBeat = beat
      this.onBeat(beat)
    }
    if (this.phase === 1 && this.ticks % PONY_EVERY === 0) this.trot()
    if (this.phase === 3 && this.ticks % SPIRAL_EVERY === 0) this.wind()
  }

  private onBeat(beat: number) {
    if (this.phase === 3) return
    if (beat % CHIME_BEATS === 0) this.host.sfx('blip')
    if (beat % CHIME_BEATS === 2) {
      // The gaps shut: anything caught in one is bumped, ribbons in them are lost.
      for (const i of this.gapCells(beat - 1)) {
        this.host.bumpAt(i)
        this.host.clearCell(i)
      }
    }
    if (
      this.phase === 1 &&
      beat > 0 &&
      beat % SHRINK_BEATS === 0 &&
      this.r > RING_MIN
    ) {
      const lane = this.lane().length
      this.r--
      const next = this.lane().length
      this.ponies = this.ponies.map((p) => Math.floor((p * next) / lane))
      for (const i of ringCells(KEEPER.cx, KEEPER.cy, this.r)) {
        this.host.bumpAt(i)
        this.host.clearCell(i)
      }
      this.host.sfx('warn')
    }
  }

  /** The ponies trot round the lane, each waiting while a ribbon or a bike is in its way. */
  private trot() {
    const lane = this.lane()
    const taken = new Set(this.ponyCells())
    this.ponies = this.ponies.map((p) => {
      const to = lane[(p + 1) % lane.length]!
      if (this.host.ribbonAt(to) || this.host.bikeAt(to) || taken.has(to))
        return p
      taken.delete(lane[p % lane.length]!)
      taken.add(to)
      return p + 1
    })
  }

  /** The spiral winds out a cell, waiting on a ribbon in its way, bumping a bike. */
  private wind() {
    if (this.laid >= this.spiral.length) {
      this.laid = 0
      this.host.say('THE SPIRAL UNWINDS', 'LOOP THE HUB!')
      this.host.sfx('warn')
      return
    }
    const i = this.spiral[this.laid]!
    if (this.host.ribbonAt(i)) return
    this.host.bumpAt(i)
    this.laid++
  }

  paint(dyn: Uint8Array) {
    for (const i of this.ringNow()) dyn[i] = 1
    for (const i of this.ponyCells()) dyn[i] = 2
    for (let k = 0; k < this.laid; k++) dyn[this.spiral[k]!] = 1
    for (const i of this.hub) dyn[i] = this.phase === 3 ? 2 : 1
  }

  targets(): number[] {
    if (this.phase === 1) return this.ponyCells()
    if (this.phase === 3) return this.hub
    return []
  }

  danger(): number[] {
    const beat = this.host.beat()
    const out: number[] = []
    if (this.gapsOpen() && beat % CHIME_BEATS === 1)
      out.push(...this.gapCells())
    if (this.shrinkTell())
      out.push(...ringCells(KEEPER.cx, KEEPER.cy, this.r - 1))
    if (this.phase === 3)
      out.push(...this.spiral.slice(this.laid, this.laid + 3))
    return out
  }

  wrapped(region: ReadonlySet<number>): boolean {
    if (this.defeated) return false
    if (!this.targets().some((i) => region.has(i))) return false
    if (this.phase === 1) {
      this.hits = 1
      this.phase = 2
      this.ponyWraps = 0
      this.host.say('THE PONIES BREAK OFF!', 'WRAP ALL THREE')
      this.host.spawnPonies(PONY_SPAWNS)
    } else {
      this.hits = 3
      this.defeated = true
      this.host.say('THE KEEPER IS WRAPPED!', 'THE CAROUSEL TAKES A BOW')
    }
    this.host.sfx('level')
    for (const i of this.hub) this.host.burst(i, true)
    return true
  }

  rivalWrapped(kind: string) {
    if (this.phase !== 2 || kind !== 'pony') return
    this.ponyWraps++
    if (this.ponyWraps < 3) return
    for (const i of ringCells(KEEPER.cx, KEEPER.cy, this.r)) this.host.burst(i)
    this.hits = 2
    this.phase = 3
    this.laid = 0
    this.host.say('THE RING CRACKS!', 'LOOP THE HUB BEFORE THE SPIRAL')
    this.host.sfx('boom')
  }

  render(g: CanvasRenderingContext2D, tick: number) {
    const px = (i: number) => (i % GRID) * CELL
    const py = (i: number) => ARENA_Y + Math.floor(i / GRID) * CELL
    const flash = Math.floor(tick / 6) % 2 === 0
    if (this.shrinkTell() && flash) {
      g.fillStyle = 'rgba(253, 230, 138, 0.35)'
      for (const i of ringCells(KEEPER.cx, KEEPER.cy, this.r - 1))
        g.fillRect(px(i), py(i), CELL, CELL)
    }
    // The ring: striped canopy poles, gold and pink.
    const gaps = new Set(this.phase < 3 ? this.gapCells() : [])
    const open = this.gapsOpen()
    const ring = this.phase < 3 ? ringCells(KEEPER.cx, KEEPER.cy, this.r) : []
    ring.forEach((i, k) => {
      if (gaps.has(i) && open) return
      const tellGap = gaps.has(i) && this.gapsTell() && flash
      bevel(
        g,
        px(i),
        py(i),
        CELL,
        CELL,
        tellGap ? RAMPS.cream : k % 2 ? RAMPS.pink : RAMPS.gold,
        { depth: 1, outline: INK },
      )
    })
    for (let k = 0; k < this.laid; k++) {
      const i = this.spiral[k]!
      bevel(g, px(i), py(i), CELL, CELL, k % 3 ? RAMPS.purple : RAMPS.pink, {
        depth: 1,
        outline: INK,
      })
    }
    if (this.phase === 3 && this.laid < this.spiral.length) {
      const head = this.spiral[this.laid]!
      glow(g, px(head) + 3, py(head) + 3, 10, RAMPS.pink[3], flash ? 0.9 : 0.5)
    }
    for (const i of this.ponyCells()) {
      glow(g, px(i) + 3, py(i) + 3, 9, RAMPS.pink[3], 0.5)
      drawSprite(g, HORSE, px(i) + 3, py(i) + 3)
    }
    // The hub: the Keeper itself, a striped canopy with a glowing heart.
    const x = (KEEPER.cx - 1) * CELL
    const y = ARENA_Y + (KEEPER.cy - 1) * CELL
    dropShadow(g, x + 9, y + 18, 11, 4, 0.5)
    const lit = this.phase === 3
    glow(g, x + 9, y + 9, lit ? 26 : 16, RAMPS.gold[3], lit ? 0.8 : 0.4)
    bevel(g, x, y, CELL * 3, CELL * 3, RAMPS.purple, {
      depth: 2,
      outline: INK,
    })
    for (let k = 0; k < 3; k++) {
      g.fillStyle = k % 2 ? RAMPS.cream[4] : RAMPS.pink[2]
      g.fillRect(x + 2 + k * 5, y + 2, 4, 3)
    }
    shadedOrb(g, x + 9, y + 11, 4, lit ? RAMPS.gold : RAMPS.pink)
  }
}

// --- the Zamboni Swan ----------------------------------------------------------------------------

const SWAN_EVERY = [7, 5, 6] as const
const STALL_TICKS = 150
const SPIN_TICKS = 90

export class ZamboniSwan implements Marshal {
  readonly kind = 'swan'
  readonly name = 'THE ZAMBONI SWAN'
  readonly limit = MARSHAL_LIMIT
  phase = 1
  hits = 0
  defeated = false
  x = 5
  y = 5
  dir: Dir = 1
  /** Steps left of a lane change, and which way lanes go (1 down, -1 up). */
  shift = 0
  vdir = 1
  stall = 0
  spin = 0
  private ticks = 0

  constructor(private host: MarshalHost) {}

  body(x = this.x, y = this.y): number[] {
    return hubCells(x, y)
  }

  /** Can the body sit centred on (x, y)? Snow is a wall until the chase, then a trap. */
  private can(x: number, y: number): boolean {
    if (x < 1 || y < 1 || x > GRID - 2 || y > GRID - 2) return false
    for (const i of this.body(x, y)) {
      const t = this.host.terrainAt(i)
      if (t === T.PILLAR || t === T.GATE) return false
      if (t === T.SNOW && this.phase < 3) return false
    }
    return true
  }

  update() {
    this.ticks++
    if (this.spin > 0) this.spin--
    if (this.stall > 0) {
      this.stall--
      return
    }
    if (this.ticks % SWAN_EVERY[this.phase - 1]! !== 0) return
    const was = this.body()
    if (this.phase === 3) this.chase()
    else this.sweep()
    const now = new Set(this.body())
    let snow = false
    for (const i of now) {
      if (this.host.terrainAt(i) === T.SNOW)
        snow = this.host.meltBankAt(i) || snow
      this.host.clearCell(i)
      this.host.bumpAt(i)
    }
    if (this.phase === 2)
      for (const i of was) if (!now.has(i)) this.host.freezeIce(i)
    if (snow) {
      this.stall = STALL_TICKS
      this.host.say('THE SWAN IS STUCK!', 'WRAP IT NOW')
      this.host.sfx('pop')
    }
  }

  private step(d: Dir): boolean {
    const nx = this.x + DX[d]
    const ny = this.y + DY[d]
    if (!this.can(nx, ny)) return false
    this.x = nx
    this.y = ny
    return true
  }

  /** Back and forth across the rink, three rows over at each end. */
  private sweep() {
    if (this.shift > 0) {
      const v: Dir = this.vdir > 0 ? 2 : 0
      if (!this.step(v)) {
        this.vdir = -this.vdir
        if (!this.step(this.vdir > 0 ? 2 : 0)) this.dir = reverse(this.dir)
      }
      if (--this.shift === 0) this.dir = reverse(this.dir)
      return
    }
    if (!this.step(this.dir)) this.shift = 3
  }

  /** Straight at the player, never doubling back unless cornered. */
  private chase() {
    const p = this.host.player()
    const options = ([0, 1, 2, 3] as Dir[]).filter(
      (d) => d !== reverse(this.dir),
    )
    let best: Dir | null = null
    let bestD = Infinity
    for (const d of options) {
      const nx = this.x + DX[d]
      const ny = this.y + DY[d]
      if (!this.can(nx, ny)) continue
      const dist = p ? Math.abs(p.x - nx) + Math.abs(p.y - ny) : 0
      if (dist < bestD) {
        bestD = dist
        best = d
      }
    }
    if (best === null) best = reverse(this.dir)
    this.dir = best
    this.step(best)
  }

  paint(dyn: Uint8Array) {
    for (const i of this.body()) dyn[i] = 2
  }

  targets(): number[] {
    return this.defeated || this.spin > 0 ? [] : this.body()
  }

  /** Where the body goes next: a cell out each way it might turn. */
  danger(): number[] {
    if (this.stall > 0) return []
    const out: number[] = []
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++) {
        const x = this.x + dx
        const y = this.y + dy
        if (x >= 0 && y >= 0 && x < GRID && y < GRID) out.push(idx(x, y))
      }
    return out
  }

  wrapped(region: ReadonlySet<number>): boolean {
    if (!this.targets().some((i) => region.has(i))) return false
    this.hits++
    this.stall = 0
    this.spin = SPIN_TICKS
    for (const i of this.body()) this.host.burst(i, true)
    this.host.sfx('level')
    if (this.hits >= 3) {
      this.defeated = true
      this.host.say('THE SWAN IS WRAPPED!', 'THE RINK SHINES')
      return true
    }
    this.phase++
    if (this.phase === 2)
      this.host.say('ITS WAKE FREEZES!', 'ICE BEHIND THE SWAN')
    else this.host.say('THE SWAN GIVES CHASE!', 'LURE IT ONTO A SNOWBANK')
    return true
  }

  rivalWrapped() {}

  render(g: CanvasRenderingContext2D, tick: number) {
    if (this.defeated) return
    const cx = this.x * CELL + CELL / 2
    const cy = ARENA_Y + this.y * CELL + CELL / 2
    const blink = this.spin > 0 && Math.floor(tick / 4) % 2 === 0
    dropShadow(g, cx + 1, cy + 9, 11, 4, 0.5)
    glow(
      g,
      cx,
      cy,
      this.stall > 0 ? 28 : 20,
      this.stall > 0 ? RAMPS.gold[3] : RAMPS.sky[3],
      0.6,
    )
    if (blink) return
    // The machine: a white swan-shaped body, a blue skirt, a long neck forward.
    bevel(g, cx - 9, cy - 9, 18, 18, RAMPS.sky, { depth: 2, outline: INK })
    g.fillStyle = RAMPS.cream[4]
    g.fillRect(cx - 7, cy - 6, 14, 12)
    g.fillStyle = RAMPS.steel[3]
    g.fillRect(cx - 7, cy + 4, 14, 2)
    const nx = cx + DX[this.dir] * 7
    const ny = cy + DY[this.dir] * 7
    g.fillStyle = RAMPS.cream[4]
    g.fillRect(Math.round(nx) - 2, Math.round(ny) - 2, 4, 4)
    g.fillStyle = RAMPS.ember[3]
    g.fillRect(
      Math.round(nx + DX[this.dir] * 3) - 1,
      Math.round(ny + DY[this.dir] * 3) - 1,
      2,
      2,
    )
    g.fillStyle = INK
    g.fillRect(Math.round(nx) - 1, Math.round(ny) - 1, 1, 1)
    // Its spray behind.
    const bx = cx - DX[this.dir] * 10
    const by = cy - DY[this.dir] * 10
    if (tick % 4 < 2 && this.stall === 0) {
      g.fillStyle = RAMPS.sky[4]
      g.fillRect(Math.round(bx) - 2, Math.round(by) - 1, 3, 2)
      g.fillRect(Math.round(bx) + 1, Math.round(by) + 1, 2, 2)
    }
    if (this.stall > 0) {
      g.fillStyle = RAMPS.cream[4]
      for (let k = 0; k < 3; k++)
        g.fillRect(cx - 8 + k * 7, cy - 12 - (((tick >> 3) + k) % 3), 2, 2)
    }
    shadedOrb(g, cx, cy - 1, 3, this.phase === 3 ? RAMPS.ember : RAMPS.sky)
  }
}

export function makeMarshal(kind: MarshalKind, host: MarshalHost): Marshal {
  switch (kind) {
    case 'keeper':
      return new CarouselKeeper(host)
    case 'swan':
      return new ZamboniSwan(host)
    case 'conductor':
      return new ClockworkConductor(host)
    case 'loom':
      return new LoomSpinner(host)
  }
}
