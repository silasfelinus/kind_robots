// /utils/arcade/cableCrawler/tangleMatch.ts
//
// Cable Crawler's Tangle (conductor kr-arcade/t-068): two to four cables in one maze, one per
// seated player, each steered by its own `players` frame.
//
// - Team Tangle shares one battery, one score and one pool of spare cables. The arenas loop,
//   faster each lap. Plug into a socket while your cable touches a friend's and the surge runs
//   down both: a Link Surge, the longer the tangle the bigger the sweep.
// - Tangle Race is a match over the four arenas: most sparks takes each arena, most arenas takes
//   the match. A bite only reboots your cable at its seat; nobody is ever knocked out.
//
// Bodies are walls to each other, and two plugs nose to nose pause with a boop (tangle.ts). The
// match is pure and deterministic: it reads only the frames, and reports what happened as events
// the cabinet turns into sound and sparkle.

import type { InputFrame } from '../types'
import {
  type Maze,
  type Way,
  cellKey,
  cellX,
  cellY,
  COLS,
  ROWS,
  parseMaze,
} from './mazes'
import {
  SOCKET_RECHARGE,
  SURGE_REACH,
  SURGE_TOPUP_PER_CELL,
  chainPoints,
  surgeSweep,
} from './surge'
import {
  BUMP_PAUSE,
  type TangleKind,
  raceBanner,
  raceWinners,
  resolveTangle,
  tangleSeats,
  teamCharge,
} from './tangle'
import { TANGLE_ARENAS, type TangleArena } from './tangleArenas'

export const TANGLE_START_LEN = 4
/** Each Team lap starts the cables this much longer (up to the cap). */
export const TANGLE_LEN_RAMP = 2
export const TANGLE_LEN_CAP = 12
/** Ticks a bitten cable takes to reboot at its seat. */
export const REBOOT_TICKS = 90
/** Crawl steps a plug may sit boxed in before it reboots itself. */
export const TANGLE_STUCK = 14
/** Extra pause per place in a boop's waiting order. */
export const BUMP_STAGGER = 8
export const TANGLE_CARD_TICKS = 120
export const TANGLE_CLEAR_TICKS = 150
/** Tangle Race: seconds on each arena's clock. */
export const RACE_CLOCK = 70
/** Tangle Race: ticks per cell (the same for every lap; a race is four arenas). */
export const RACE_PACE = 6
export const RACE_ROUNDS = TANGLE_ARENAS.length

export const TANGLE_SPARK = 10
export const TANGLE_BYTE = 1000
export const TANGLE_BATTERY_POINTS = 10
export const RACE_ROUND_BONUS = 500
/** Team Tangle: a spare cable for the pool every this many points. */
export const TEAM_EXTRA_EVERY = 50_000
export const TEAM_MAX_SPARES = 9

const UP: Way = { dx: 0, dy: -1 }
const DOWN: Way = { dx: 0, dy: 1 }
const LEFT: Way = { dx: -1, dy: 0 }
const RIGHT: Way = { dx: 1, dy: 0 }
const WAYS: readonly Way[] = [UP, LEFT, RIGHT, DOWN]

const reverseOf = (a: Way, b: Way) => a.dx === -b.dx && a.dy === -b.dy
const step = (k: number, d: Way) => {
  const x = cellX(k) + d.dx
  const y = cellY(k) + d.dy
  return x < 0 || y < 0 || x >= COLS || y >= ROWS ? -1 : cellKey(x, y)
}

/** Team Tangle's pace on lap n: 7 ticks a cell, a tick faster each lap, never under 3. */
export function teamPace(lap: number): number {
  return Math.max(3, 7 - lap)
}

/** Team Tangle's battery on an arena: more seats, more battery; each lap trims it. */
export function teamBattery(arena: TangleArena, seats: number, lap: number) {
  return Math.max(30, arena.battery + (seats - 2) * 10 - lap * 8)
}

/** Team laps that raise the score multiplier; after that the laps only get faster. */
export const TEAM_MULT_LAPS = 4

/** Seated cables start with this many spares in the shared pool. */
export function teamSpares(seats: number): number {
  return seats + 1
}

export type TangleCable = {
  seat: number
  /** Plug first; empty while it reboots. */
  body: number[]
  dir: Way
  want: Way
  grow: number
  stepTimer: number
  stuck: number
  /** Ticks frozen after a plug-to-plug boop. */
  pause: number
  /** Ticks until it reboots at its seat (0: in play). */
  down: number
  /** Team: unplugged with the pool dry, it sits out until the next arena. */
  out: boolean
  /** Sparks slurped on this arena, and in the whole match. */
  sparks: number
  total: number
  /** Tangle Race: arenas won. */
  wins: number
  points: number
  surgeGlow: number
}

export type TangleEvent =
  | { kind: 'spark'; seat: number; k: number }
  | { kind: 'byte'; seat: number; k: number; points: number }
  | {
      kind: 'surge'
      seat: number
      k: number
      chain: number
      linked: number
      points: number
    }
  | { kind: 'arc'; from: number; to: number }
  | { kind: 'bump'; k: number }
  | { kind: 'bite'; seat: number; k: number; why: string }
  | { kind: 'reboot'; seat: number; k: number }
  | { kind: 'flat' }
  | { kind: 'byte-shown'; k: number }
  | { kind: 'clear'; text: string; sub: string }
  | { kind: 'extra' }
  | { kind: 'over'; text: string; sub: string }

export type TanglePhase = 'card' | 'play' | 'clear' | 'over'

export type TangleSocket = { k: number; charge: number }

export class TangleMatch {
  readonly kind: TangleKind
  readonly seats: number
  phase: TanglePhase = 'card'
  timer = TANGLE_CARD_TICKS
  /** Arenas begun (from 1), and Team laps of the four arenas done. */
  arenas = 0
  lap = 0
  arena: TangleArena = TANGLE_ARENAS[0]!
  maze!: Maze
  walls: readonly boolean[] = []
  sparks = new Set<number>()
  totalSparks = 0
  sockets: TangleSocket[] = []
  byte: { k: number; shown: boolean } | null = null
  cables: TangleCable[] = []
  /** Team: the shared battery. Race: the arena's clock. In ticks. */
  battery = 0
  batteryMax = 0
  /** Team: spare cables in the shared pool. */
  spares = 0
  score = 0
  over = false
  banner: { text: string; sub: string } | null = null
  events: TangleEvent[] = []
  /** Plug-to-plug boops so far (it staggers who waits longest). */
  bumps = 0
  private tick = 0
  private nextExtra = TEAM_EXTRA_EVERY

  constructor(kind: TangleKind, players: number) {
    this.kind = kind
    this.seats = tangleSeats(players)
    this.spares = kind === 'team' ? teamSpares(this.seats) : 0
    this.cables = Array.from({ length: this.seats }, (_, seat) => ({
      seat,
      body: [],
      dir: UP,
      want: UP,
      grow: 0,
      stepTimer: 0,
      stuck: 0,
      pause: 0,
      down: 0,
      out: false,
      sparks: 0,
      total: 0,
      wins: 0,
      points: 0,
      surgeGlow: 0,
    }))
    this.beginArena()
  }

  /** The score multiplier: Team climbs a step each lap; a Race stays at one. */
  get mult(): number {
    return this.kind === 'team' ? 1 + Math.min(this.lap, TEAM_MULT_LAPS) : 1
  }

  get pace(): number {
    return this.kind === 'team' ? teamPace(this.lap) : RACE_PACE
  }

  get startLen(): number {
    return this.kind === 'team'
      ? Math.min(TANGLE_LEN_CAP, TANGLE_START_LEN + TANGLE_LEN_RAMP * this.lap)
      : TANGLE_START_LEN
  }

  /** Cables left, for the cabinet's lives readout: the pool and the cables still in, in Team. */
  get lives(): number {
    if (this.kind === 'race') return this.seats
    return this.spares + this.cables.filter((c) => !c.out).length
  }

  private beginArena() {
    const index = this.arenas % TANGLE_ARENAS.length
    this.lap = Math.floor(this.arenas / TANGLE_ARENAS.length)
    this.arenas++
    this.arena = TANGLE_ARENAS[index]!
    this.maze = parseMaze(this.arena.layout)
    this.walls = this.maze.walls
    this.sparks = new Set(this.maze.sparks)
    this.totalSparks = this.sparks.size
    this.sockets = this.maze.sockets.map((k) => ({ k, charge: 0 }))
    this.byte =
      this.maze.byte === null ? null : { k: this.maze.byte, shown: false }
    const seconds =
      this.kind === 'team'
        ? teamBattery(this.arena, this.seats, this.lap)
        : RACE_CLOCK
    this.batteryMax = seconds * 60
    this.battery = this.batteryMax
    for (const c of this.cables) {
      c.sparks = 0
      this.spawn(c)
    }
    this.phase = 'card'
    this.timer = TANGLE_CARD_TICKS
    this.banner = {
      text:
        this.kind === 'race'
          ? `RACE ${this.arenas} OF ${RACE_ROUNDS}`
          : `TANGLE ${this.arenas}`,
      sub: this.arena.layout.name,
    }
  }

  /** Plug a cable in at its seat, facing the first open way. */
  private spawn(c: TangleCable) {
    const k = this.arena.seats[c.seat]!
    c.body = [k]
    const face =
      WAYS.find((d) => {
        const n = step(k, d)
        return n >= 0 && !this.walls[n]
      }) ?? UP
    c.dir = face
    c.want = face
    c.grow = this.startLen - 1
    c.stepTimer = 0
    c.stuck = 0
    c.pause = 0
    c.down = 0
    c.out = false
  }

  /** Whether any cable but `seat` lies on a cell. */
  private othersOn(k: number, seat: number): boolean {
    return this.cables.some((c) => c.seat !== seat && c.body.includes(k))
  }

  /** Whether a cell is cable `c`'s own and still there after its next step. */
  private ownBlocks(c: TangleCable, k: number): boolean {
    const i = c.body.indexOf(k)
    return i >= 0 && !(c.grow === 0 && i === c.body.length - 1)
  }

  private open(c: TangleCable, d: Way): boolean {
    const n = step(c.body[0]!, d)
    return n >= 0 && !this.walls[n] && !this.othersOn(n, c.seat)
  }

  /**
   * Where a cable's plug goes next, the single-player way: the way held if open, else straight
   * on, else the only way on at a corner. -1 when it waits at a wall or another cable.
   */
  private intent(c: TangleCable): number {
    let dir = c.want
    if (!this.open(c, dir)) dir = c.dir
    if (!this.open(c, dir)) {
      const head = c.body[0]!
      const ways = WAYS.filter(
        (d) =>
          !reverseOf(d, c.dir) &&
          this.open(c, d) &&
          !this.ownBlocks(c, step(head, d)),
      )
      if (ways.length !== 1) {
        if (!ways.length && c.body.length > 1 && ++c.stuck >= TANGLE_STUCK)
          this.bite(c, 'TANGLED UP', false)
        return -1
      }
      dir = ways[0]!
    }
    c.stuck = 0
    c.dir = dir
    return step(c.body[0]!, dir)
  }

  private steer(c: TangleCable, input: InputFrame | undefined) {
    if (!input) return
    const h = input.held
    const pick = h.up
      ? UP
      : h.down
        ? DOWN
        : h.left
          ? LEFT
          : h.right
            ? RIGHT
            : null
    if (pick && !reverseOf(pick, c.dir)) c.want = pick
  }

  update(frames: readonly InputFrame[]) {
    this.events = []
    this.tick++
    if (this.over) return
    if (this.phase === 'card') {
      const skip =
        this.timer < TANGLE_CARD_TICKS - 40 &&
        frames.some((f) => f.pressed.a || f.pressed.start)
      if (--this.timer <= 0 || skip) {
        this.phase = 'play'
        this.banner = null
      }
      return
    }
    if (this.phase === 'clear') {
      if (--this.timer <= 0) this.afterClear()
      return
    }
    if (this.phase !== 'play') return
    for (const s of this.sockets) if (s.charge > 0) s.charge--
    if (--this.battery <= 0) {
      this.battery = 0
      this.batteryOut()
      return
    }
    for (const c of this.cables) {
      if (c.surgeGlow > 0) c.surgeGlow--
      if (c.out) continue
      if (c.down > 0) {
        if (--c.down === 0) {
          const seat = this.arena.seats[c.seat]!
          if (this.othersOn(seat, c.seat)) c.down = 1
          else {
            this.spawn(c)
            this.events.push({ kind: 'reboot', seat: c.seat, k: seat })
          }
        }
        continue
      }
      this.steer(c, frames[c.seat])
    }
    // Every plug whose crawl comes due this tick says where it wants to go; then they all move
    // at once, so nobody wins a cell by sitting earlier in the seat order.
    const next = this.cables.map((c) => {
      if (c.down > 0 || !c.body.length) return -1
      if (c.pause > 0) {
        c.pause--
        return -1
      }
      if (++c.stepTimer < this.pace) return -1
      c.stepTimer = 0
      return this.intent(c)
    })
    if (this.phase !== 'play') return
    const bodies = this.cables.map((c) => new Set(c.body))
    const heads = this.cables.map((c) => c.body[0] ?? -1)
    const moves = resolveTangle(this.walls, heads, next, bodies)
    // Booped plugs pause, staggered so they never meet again in lockstep: whose turn it is to
    // wait longest goes round the seats bump by bump.
    if (moves.includes('bump')) {
      this.bumps++
      moves.forEach((m, i) => {
        if (m !== 'bump') return
        const c = this.cables[i]!
        c.pause =
          BUMP_PAUSE + ((c.seat + this.bumps) % this.seats) * BUMP_STAGGER
      })
      this.events.push({ kind: 'bump', k: next[moves.indexOf('bump')]! })
    }
    moves.forEach((m, i) => {
      if (m === 'move' && this.phase === 'play')
        this.crawl(this.cables[i]!, next[i]!)
    })
  }

  private crawl(c: TangleCable, to: number) {
    if (this.ownBlocks(c, to)) {
      this.bite(c, 'BIT YOUR OWN CABLE', true)
      return
    }
    c.want = c.dir
    c.body.unshift(to)
    if (c.grow > 0) c.grow--
    else c.body.pop()
    this.eat(c, to)
  }

  private eat(c: TangleCable, at: number) {
    if (this.sparks.delete(at)) {
      c.grow++
      c.sparks++
      c.total++
      this.gain(c, TANGLE_SPARK * this.mult)
      if (this.kind === 'team')
        this.battery = teamCharge(this.battery, 6, this.batteryMax)
      this.events.push({ kind: 'spark', seat: c.seat, k: at })
    }
    if (this.byte?.shown && this.byte.k === at) this.takeByte(c)
    const socket = this.sockets.find((s) => s.k === at)
    if (socket && socket.charge === 0) this.surge(c, socket)
    this.afterSpark()
  }

  private takeByte(c: TangleCable) {
    const b = this.byte!
    this.byte = null
    const points = TANGLE_BYTE * this.mult
    this.gain(c, points)
    this.events.push({ kind: 'byte', seat: c.seat, k: b.k, points })
  }

  private afterSpark() {
    if (
      this.byte &&
      !this.byte.shown &&
      this.sparks.size * 2 <= this.totalSparks
    ) {
      this.byte.shown = true
      this.events.push({ kind: 'byte-shown', k: this.byte.k })
    }
    if (this.sparks.size === 0 && this.phase === 'play') this.arenaClear()
  }

  /**
   * The cables a surge runs down: in a Race only the surger's own; in Team every cable touching
   * it, and every cable touching those (a Link Surge), so a tangle of friends sweeps together.
   */
  linked(seat: number): TangleCable[] {
    const live = this.cables.filter((c) => c.down === 0 && c.body.length)
    const first = live.find((c) => c.seat === seat)
    if (!first) return []
    if (this.kind === 'race') return [first]
    const near = (a: TangleCable, b: TangleCable) => {
      const cells = new Set(b.body)
      return a.body.some((k) => WAYS.some((d) => cells.has(step(k, d))))
    }
    const net = [first]
    for (let i = 0; i < net.length; i++)
      for (const c of live)
        if (!net.includes(c) && near(net[i]!, c)) net.push(c)
    return net
  }

  private surge(c: TangleCable, socket: TangleSocket) {
    socket.charge = SOCKET_RECHARGE
    const net = this.linked(c.seat)
    const cable = net.flatMap((n) => n.body)
    const sweep = surgeSweep(cable, this.walls, SURGE_REACH)
    let chain = 0
    let points = 0
    const from = (k: number) =>
      cable.reduce(
        (best, b) =>
          Math.abs(cellX(b) - cellX(k)) + Math.abs(cellY(b) - cellY(k)) <
          Math.abs(cellX(best) - cellX(k)) + Math.abs(cellY(best) - cellY(k))
            ? b
            : best,
        cable[0]!,
      )
    for (const k of sweep) {
      if (this.sparks.delete(k)) {
        const p = chainPoints(chain++) * this.mult
        points += p
        c.sparks++
        c.total++
        this.events.push({ kind: 'arc', from: from(k), to: k })
      }
      if (this.byte?.shown && this.byte.k === k) this.takeByte(c)
    }
    this.gain(c, points)
    for (const n of net) n.surgeGlow = 40
    if (this.kind === 'team')
      this.battery = teamCharge(
        this.battery,
        cable.length * SURGE_TOPUP_PER_CELL,
        this.batteryMax,
      )
    this.events.push({
      kind: 'surge',
      seat: c.seat,
      k: socket.k,
      chain,
      linked: net.length,
      points,
    })
  }

  private gain(c: TangleCable, points: number) {
    if (points <= 0) return
    c.points += points
    this.score += points
    if (this.kind !== 'team') return
    while (this.score >= this.nextExtra) {
      this.nextExtra += TEAM_EXTRA_EVERY
      if (this.spares < TEAM_MAX_SPARES) {
        this.spares++
        this.events.push({ kind: 'extra' })
      }
    }
  }

  /**
   * A cable is unplugged: it reboots at its seat after a moment. In Team a reboot takes a spare
   * from the pool; with the pool dry the cable sits out until the next arena, and the game ends
   * when every cable is out. `costs` is false for a cable that only got itself boxed in.
   */
  private bite(c: TangleCable, why: string, costs: boolean) {
    const k = c.body[0] ?? this.arena.seats[c.seat]!
    c.body = []
    c.down = REBOOT_TICKS
    c.pause = 0
    this.events.push({ kind: 'bite', seat: c.seat, k, why })
    if (this.kind !== 'team' || !costs) return
    if (this.spares > 0) {
      this.spares--
      return
    }
    c.down = 0
    c.out = true
    if (this.cables.every((o) => o.out))
      this.finish('UNPLUGGED', `TEAM SCORE ${this.score}`)
  }

  private batteryOut() {
    if (this.kind === 'race') {
      this.arenaClear()
      return
    }
    this.events.push({ kind: 'flat' })
    if (this.spares <= 0) {
      this.finish('BATTERY FLAT', `TEAM SCORE ${this.score}`)
      return
    }
    this.spares--
    this.battery = this.batteryMax
    for (const c of this.cables) {
      if (c.out) continue
      c.body = []
      c.down = REBOOT_TICKS
    }
  }

  private arenaClear() {
    this.phase = 'clear'
    this.timer = TANGLE_CLEAR_TICKS
    if (this.kind === 'team') {
      const bonus =
        Math.ceil(this.battery / 60) *
        TANGLE_BATTERY_POINTS *
        this.mult *
        this.seats
      this.gain(this.cables[0]!, bonus)
      this.banner = { text: 'ARENA CLEAR!', sub: `BATTERY BONUS +${bonus}` }
    } else {
      const round = this.cables.map((c) => c.sparks)
      for (const i of raceWinners(round)) {
        this.cables[i]!.wins++
        this.gain(this.cables[i]!, RACE_ROUND_BONUS)
      }
      this.banner = {
        text: this.sparks.size ? 'TIME!' : 'ARENA CLEAR!',
        sub: raceBanner(round),
      }
    }
    this.events.push({ kind: 'clear', ...this.banner })
  }

  private afterClear() {
    if (this.kind === 'race' && this.arenas >= RACE_ROUNDS) {
      const champs = raceChampions(this.cables)
      this.finish(
        champs.length === 1 ? `P${champs[0]! + 1} WINS!` : 'A FRIENDLY TIE',
        champs.length === 1
          ? `${this.cables[champs[0]!]!.wins} ARENAS  ${this.cables[champs[0]!]!.total} SPARKS`
          : `${champs.map((i) => `P${i + 1}`).join(' ')} SHARE THE CUP`,
      )
      return
    }
    this.beginArena()
  }

  private finish(text: string, sub: string) {
    this.over = true
    this.phase = 'over'
    this.banner = { text, sub }
    this.events.push({ kind: 'over', text, sub })
  }
}

/** Tangle Race's champions: most arenas won, then most sparks over the match. */
export function raceChampions(
  cables: ReadonlyArray<Pick<TangleCable, 'wins' | 'total'>>,
): number[] {
  const best = cables.reduce(
    (b, c) =>
      c.wins > b.wins || (c.wins === b.wins && c.total > b.total) ? c : b,
    cables[0]!,
  )
  return cables.flatMap((c, i) =>
    c.wins === best.wins && c.total === best.total ? [i] : [],
  )
}

/**
 * A simple pilot for one seat (tests, and a seat nobody is steering): the way to the nearest
 * spark by breadth-first search around the walls and every cable, or a socket once the cable is
 * long; null when there is nowhere to go.
 */
export function tanglePilot(match: TangleMatch, seat: number): Way | null {
  const c = match.cables[seat]
  if (!c || !c.body.length) return null
  const blocked = new Set(match.cables.flatMap((o) => o.body))
  const head = c.body[0]!
  const wantSocket = c.body.length >= 14
  const goal = (k: number) =>
    match.sparks.has(k) ||
    (wantSocket && match.sockets.some((s) => s.k === k && s.charge === 0)) ||
    (match.byte?.shown === true && match.byte.k === k)
  const first = new Map<number, Way>()
  const queue: number[] = []
  for (const d of WAYS) {
    if (reverseOf(d, c.dir)) continue
    const n = step(head, d)
    if (n < 0 || match.walls[n] || blocked.has(n) || first.has(n)) continue
    first.set(n, d)
    queue.push(n)
  }
  for (let i = 0; i < queue.length; i++) {
    const k = queue[i]!
    if (goal(k)) return first.get(k)!
    for (const d of WAYS) {
      const n = step(k, d)
      if (n < 0 || match.walls[n] || blocked.has(n) || first.has(n)) continue
      first.set(n, first.get(k)!)
      queue.push(n)
    }
  }
  return queue.length ? first.get(queue[0]!)! : null
}
