// /utils/arcade/batteryMaze/bosses.ts
//
// Battery Maze's boss mazes (conductor kr-arcade/t-040; spec: conductor
// projects/kr-arcade/depth-pass/CABINETS.md section 2). Each boss is its own little machine that
// plays through a BossWorld: the game hands it the maze, the robot and a few levers (spawn a
// baby, drop a power cell, hurt the robot, pay points) and asks it each tick what it is doing.
//
// Gremlin Mama ends Power Phase 1. She is two tiles across, so she can't fit the narrow
// corridors: she keeps to the wide halls round the edge of her den.
//   Phase 1  she patrols the wide halls and drops babies (small, quick, harmless while sleepy).
//            Eat 40% of the den's sparks to make her cranky.
//   Phase 2  three power cells appear. Each makes her sleepy: bump her and she spins round and
//            runs the board backwards, dazed. Three bumps and she's had enough.
//   Phase 3  she plugs the dock. Come close and she gives chase; lead her into the trap bay,
//            slip out through the narrow gap, and throw the switch: the bay's gates shut behind
//            her. Then bump her home for a nap.
//
// The Glitch Train ends Power Phase 2 (slice 3, t-041): a head and eight cars snaking through
// its yard.
//   Phase 1  only the caboose can be bumped, and only while the train is sleepy: each bump
//            reboots one car and shortens the train.
//   Phase 2  with five cars left the head speeds up as the train shortens, and takes the tunnels.
//   Phase 3  with two cars left it splits into two trains that pincer: rewire them into each
//            other (when the heads meet, both reboot), or keep bumping cabooses.
//
// The Overload ends Power Phase 3 and the campaign: the grid's master gremlin, a great face
// filling the dock.
//   Phase 1  it fires power surges down whole rows and columns; the line lights up first.
//   Phase 2  it rewires the maze itself, throwing switches to cut you off; your flips fight its
//            flips. The surges keep coming.
//   Phase 3  it climbs out and chases you, three tiles wide, through the walls. Eat a plug cell
//            to make it sleepy, then bump one of its four plugs out. Four plugs, and it's done.

import type { MusicLoop } from '../sound'
import { BOSS_MUSIC, FINALE_MUSIC } from './music'
import { MAMAS_DEN, THE_CORE, TRAIN_YARD } from './mazes'
import type { MazeLayout, Tile } from './mazes'
import type { HeatRow } from './tables'
import { BASE_SPEED } from './tables'

/** What a boss may ask of the game. */
export type BossWorld = {
  robot: { x: number; y: number }
  row: HeatRow
  rng(): number
  /** Whether a tile is open floor for a walker (not a wall, door, dock or shut gate). */
  open(x: number, y: number): boolean
  /** A power cell's sleepy time is running. */
  sleepy(): boolean
  /** The share of the den's sparks eaten so far. */
  eatenShare(): number
  cellsLeft(): number
  babies(): number
  /** Every baby pops home. */
  clearBabies(): void
  spawnBaby(at: Tile): void
  spawnCell(at: Tile): void
  refillFlips(): void
  addScore(points: number, at: Tile): void
  announce(text: string, sub?: string): void
  sound(name: 'pop' | 'warn' | 'level' | 'extra' | 'boom'): void
  sparkle(at: Tile, colours?: readonly string[]): void
  /** The robot is caught (unless it is shielded). */
  hurt(): void
  /** The maze's switches, and throwing one (the boss's own flips cost nothing). */
  switches(): readonly Tile[]
  flip(i: number): void
  /** Whether a tile is a tunnel tile. */
  tunnel(x: number, y: number): boolean
  /** The crossroads ahead of and behind the robot. */
  ahead(): Tile
  behind(): Tile
}

/** What a boss tells the attract pilot: where it is dangerous, and what to go for. */
export type PilotPlan = {
  threats: ReadonlyArray<Tile & { reach: number }>
  /** Go for these tiles only (null: eat sparks as usual). */
  goals: readonly Tile[] | null
  /** Throw the switch when standing on one. */
  flip: boolean
}

export type BossId = 'mama' | 'train' | 'overload'

/** A boss maze's machine, as the game drives it. */
export interface BossMachine {
  readonly id: BossId
  readonly name: string
  readonly phase: 1 | 2 | 3
  readonly done: boolean
  /** How long its maze's cells keep it sleepy, at any heat. */
  readonly napTicks: number
  readonly music: MusicLoop
  /** How much fight is left, 1 to 0, for the gauge. */
  readonly health: number
  update(w: BossWorld): void
  /** What the robot at (x, y) touching it means. */
  contact(x: number, y: number): 'hurt' | 'bump' | null
  bump(w: BossWorld, x: number, y: number): void
  /** The robot was caught: back to the start, keeping the phase. */
  reset(): void
  pilot(w: BossWorld): PilotPlan
}

export type MamaSpec = {
  layout: MazeLayout
  /** Her footprint's top-left tile at the start, and when she plugs the dock. */
  start: Tile
  plug: Tile
  /** The trap bay (inclusive), and its gate tiles. */
  bay: { x0: number; y0: number; x1: number; y1: number }
  bayGates: readonly Tile[]
  cellSpots: readonly Tile[]
  /** Where to stand to draw her out of the dock, and to draw her into the bay. */
  lureSpots: readonly Tile[]
  baitSpots: readonly Tile[]
  /** The share of sparks that makes her cranky (phase 2). */
  crankyAt: number
  /** How long her den's cells keep her sleepy, at any heat. */
  napTicks: number
  hits: number
  /** Her pace, as a share of the maze's gremlin speed. */
  pace: number
  dazedPace: number
  dazedTicks: number
  dropEvery: number
  maxBabies: number
  /** In phase 3 she leaves the dock to chase within this range, and gives up beyond the next. */
  lure: number
  giveUp: number
  /** Once she gives chase she keeps at it at least this long. */
  chaseTicks: number
  /** A cell comes back this long after the last one is eaten, while she still needs bumps. */
  cellBack: number
  points: { hit: number; home: number }
  music: MusicLoop
}

export const MAMA: MamaSpec = {
  layout: MAMAS_DEN,
  start: { x: 10, y: 1 },
  plug: { x: 10, y: 6 },
  bay: { x0: 15, y0: 13, x1: 16, y1: 16 },
  bayGates: [
    { x: 15, y: 17 },
    { x: 16, y: 17 },
  ],
  cellSpots: [
    { x: 4, y: 4 },
    { x: 18, y: 4 },
    { x: 4, y: 16 },
  ],
  lureSpots: [
    { x: 14, y: 7 },
    { x: 15, y: 7 },
    { x: 16, y: 7 },
  ],
  baitSpots: [{ x: 17, y: 13 }],
  crankyAt: 0.4,
  napTicks: 60 * 6,
  hits: 3,
  pace: 0.85,
  dazedPace: 1.35,
  dazedTicks: 180,
  dropEvery: 60 * 6,
  maxBabies: 4,
  lure: 7,
  giveUp: 12,
  chaseTicks: 60 * 10,
  cellBack: 60 * 4,
  points: { hit: 3000, home: 20000 },
  music: BOSS_MUSIC,
}

export type MamaState =
  'roam' | 'sleepy' | 'dazed' | 'plug' | 'chase' | 'trapped' | 'home'

type Dir = { x: number; y: number }
const DIRS: Dir[] = [
  { x: 0, y: -1 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 1, y: 0 },
]

/** Gremlin Mama: a two-by-two gremlin with three phases (see the header). */
export class GremlinMama implements BossMachine {
  readonly id = 'mama' as const
  readonly name = 'GREMLIN MAMA'
  x: number
  y: number
  dir: Dir = { x: 1, y: 0 }
  phase: 1 | 2 | 3 = 1
  hits = 0
  state: MamaState = 'roam'
  timer = 0
  dropTimer: number
  cellTimer = 0
  /** Ticks since she went home (the game moves on after a moment). */
  homeTicks = 0

  constructor(readonly spec: MamaSpec = MAMA) {
    this.x = spec.start.x
    this.y = spec.start.y
    this.dropTimer = spec.dropEvery
  }

  get done(): boolean {
    return this.state === 'home' && this.homeTicks > 150
  }

  get napTicks() {
    return this.spec.napTicks
  }

  get music() {
    return this.spec.music
  }

  get health() {
    return this.phase === 3 ? 0.15 : 1 - this.hits / this.spec.hits
  }

  contact(x: number, y: number): 'hurt' | 'bump' | null {
    if (!this.touches(x, y)) return null
    return this.bumpable ? 'bump' : this.harmful ? 'hurt' : null
  }

  pilot(w: BossWorld): PilotPlan {
    const s = this.spec
    const mx = Math.round(this.x)
    const my = Math.round(this.y)
    const footprint = [0, 1].flatMap((dx) =>
      [0, 1].map((dy) => ({ x: mx + dx, y: my + dy })),
    )
    const threats = this.harmful
      ? footprint.map((t) => ({ ...t, reach: this.phase === 3 ? 1 : 2 }))
      : []
    if (this.bumpable) return { threats, goals: footprint, flip: false }
    if (this.phase < 3) return { threats, goals: null, flip: false }
    const b = s.bay
    const inBay = mx >= b.x0 && mx + 1 <= b.x1 && my >= b.y0 && my + 1 <= b.y1
    const shut = s.bayGates.every((g) => !w.open(g.x, g.y))
    // Throw the switch to shut her in, or to open the bay again if it is shut while she is out.
    if (inBay !== shut)
      return { threats, goals: w.switches().slice(0, 1), flip: true }
    // Lure her out of the dock, then wait just past the bay's wall until she follows us in.
    return {
      threats,
      goals: this.state === 'plug' ? s.lureSpots : s.baitSpots,
      flip: false,
    }
  }

  /** Her middle, in tiles (her footprint is x..x+1, y..y+1). */
  get centre(): { x: number; y: number } {
    return { x: this.x + 0.5, y: this.y + 0.5 }
  }

  /** The robot was caught: she goes back to her start, keeping her phase. */
  reset() {
    const s = this.spec
    this.x = this.phase === 3 ? s.plug.x : s.start.x
    this.y = this.phase === 3 ? s.plug.y : s.start.y
    this.dir = { x: 1, y: 0 }
    this.state = this.phase === 3 ? 'plug' : 'roam'
    this.timer = 0
  }

  private fits(w: BossWorld, x: number, y: number): boolean {
    return (
      w.open(x, y) &&
      w.open(x + 1, y) &&
      w.open(x, y + 1) &&
      w.open(x + 1, y + 1)
    )
  }

  /** Can hurt the robot. */
  get harmful(): boolean {
    return (
      this.state === 'roam' || this.state === 'chase' || this.state === 'plug'
    )
  }

  /** Can be bumped. */
  get bumpable(): boolean {
    return this.state === 'sleepy' || this.state === 'trapped'
  }

  /** Whether the robot at (x, y) is touching her. */
  touches(x: number, y: number): boolean {
    const c = this.centre
    return Math.abs(x - c.x) < 1.1 && Math.abs(y - c.y) < 1.1
  }

  private trapped(w: BossWorld): boolean {
    const b = this.spec.bay
    const inside =
      Math.round(this.x) >= b.x0 &&
      Math.round(this.x) + 1 <= b.x1 &&
      Math.round(this.y) >= b.y0 &&
      Math.round(this.y) + 1 <= b.y1
    return inside && this.spec.bayGates.every((g) => !w.open(g.x, g.y))
  }

  update(w: BossWorld) {
    const s = this.spec
    if (this.state === 'home') {
      this.homeTicks++
      return
    }
    // Phase changes.
    if (this.phase === 1 && w.eatenShare() >= s.crankyAt) {
      this.phase = 2
      for (const spot of s.cellSpots) w.spawnCell(spot)
      w.announce("MAMA'S CRANKY!", 'GRAB A CELL AND BUMP HER')
      w.sound('warn')
    }
    if (this.phase < 3) {
      if (--this.dropTimer <= 0) {
        this.dropTimer = s.dropEvery
        if (w.babies() < s.maxBabies) {
          w.spawnBaby({ x: Math.round(this.x), y: Math.round(this.y) + 1 })
          w.sound('pop')
        }
      }
    }
    if (this.phase === 2) {
      if (this.state === 'roam' && w.sleepy()) this.state = 'sleepy'
      if (this.state === 'sleepy' && !w.sleepy()) this.state = 'roam'
      if (w.cellsLeft() === 0 && !w.sleepy() && this.hits < s.hits) {
        if (++this.cellTimer >= s.cellBack) {
          this.cellTimer = 0
          w.spawnCell(s.cellSpots[Math.floor(w.rng() * s.cellSpots.length)]!)
        }
      }
    }
    if (this.state === 'dazed' && --this.timer <= 0)
      this.state = this.phase === 3 ? 'plug' : 'roam'
    if (this.phase === 3) {
      const r = w.robot
      const d = Math.hypot(r.x - this.centre.x, r.y - this.centre.y)
      if (this.state === 'plug' && d <= s.lure) {
        this.state = 'chase'
        this.timer = s.chaseTicks
      } else if (this.state === 'chase' && --this.timer <= 0 && d > s.giveUp)
        this.state = 'plug'
      if (this.state !== 'trapped' && this.trapped(w)) {
        this.state = 'trapped'
        w.announce('TRAPPED!', 'NOW BUMP HER HOME')
        w.sound('level')
      } else if (this.state === 'trapped' && !this.trapped(w)) {
        this.state = 'chase'
      }
    }
    this.move(w)
  }

  /** The robot bumped her while she could be bumped. */
  bump(w: BossWorld) {
    this.bumpHer(w)
  }

  private bumpHer(w: BossWorld) {
    const s = this.spec
    if (this.state === 'trapped') {
      this.state = 'home'
      this.homeTicks = 0
      w.addScore(s.points.home, this.centre)
      w.announce("MAMA'S HOME FOR A NAP!", 'POWER PHASE CLEAR')
      w.sound('extra')
      w.sparkle(this.centre)
      return
    }
    this.hits++
    w.addScore(s.points.hit, this.centre)
    w.sparkle(this.centre)
    w.sound('boom')
    if (this.hits >= s.hits) {
      this.phase = 3
      this.state = 'plug'
      w.refillFlips()
      w.clearBabies()
      w.announce('SHE PLUGGED THE DOCK!', 'LURE HER INTO THE TRAP BAY')
      return
    }
    this.state = 'dazed'
    this.timer = s.dazedTicks
    this.dir = { x: -this.dir.x || 0, y: -this.dir.y || 0 }
  }

  private target(w: BossWorld): Tile {
    const r = w.robot
    if (this.state === 'plug') return this.spec.plug
    return { x: r.x - 0.5, y: r.y - 0.5 }
  }

  private move(w: BossWorld) {
    const s = this.spec
    if (this.state === 'trapped') return
    if (this.state === 'plug' && this.x === s.plug.x && this.y === s.plug.y)
      return
    const pace =
      this.state === 'dazed'
        ? s.dazedPace
        : this.state === 'sleepy'
          ? w.row.sleepyGremlin / w.row.gremlin
          : s.pace
    const speed = BASE_SPEED * w.row.gremlin * pace
    const atCentre =
      Math.abs(this.x - Math.round(this.x)) < 1e-6 &&
      Math.abs(this.y - Math.round(this.y)) < 1e-6
    if (atCentre) {
      this.choose(w)
      // Nowhere better to be: she waits where she is.
      if (!this.dir.x && !this.dir.y) return
    }
    const before = this.dir.x
      ? this.x - Math.round(this.x)
      : this.y - Math.round(this.y)
    this.x += this.dir.x * speed
    this.y += this.dir.y * speed
    const after = this.dir.x
      ? this.x - Math.round(this.x)
      : this.y - Math.round(this.y)
    const crossed = (before < 0 && after >= 0) || (before > 0 && after <= 0)
    if (crossed && Math.abs(after) < speed + 1e-6) {
      this.x = Math.round(this.x)
      this.y = Math.round(this.y)
    }
  }

  private choose(w: BossWorld) {
    const x = Math.round(this.x)
    const y = Math.round(this.y)
    const away = this.state === 'dazed' || this.state === 'sleepy'
    if (!away) {
      // She knows her den: walk the wide halls to the spot nearest her target.
      const step = this.pathStep(w, x, y, this.target(w))
      this.dir = step ?? { x: 0, y: 0 }
      return
    }
    const back = { x: -this.dir.x || 0, y: -this.dir.y || 0 }
    let options = DIRS.filter(
      (d) =>
        !(d.x === back.x && d.y === back.y) && this.fits(w, x + d.x, y + d.y),
    )
    if (!options.length)
      options = DIRS.filter((d) => this.fits(w, x + d.x, y + d.y))
    if (!options.length) return
    const r = w.robot
    let best = options[0]!
    let far = -Infinity
    for (const d of options) {
      const dist = Math.hypot(x + d.x - r.x + 0.5, y + d.y - r.y + 0.5)
      if (dist > far + 1e-9) {
        far = dist
        best = d
      }
    }
    this.dir = best
  }

  /**
   * The first step of the shortest walk (in footprints she fits) to the reachable footprint
   * nearest `target`; null when she is already there.
   */
  private pathStep(
    w: BossWorld,
    x: number,
    y: number,
    target: Tile,
  ): Dir | null {
    const first = new Map<string, Dir | null>([[`${x},${y}`, null]])
    const queue: Array<[number, number]> = [[x, y]]
    let best: [number, number] = [x, y]
    let bestD = Math.hypot(x - target.x, y - target.y)
    while (queue.length) {
      const [cx, cy] = queue.shift()!
      for (const d of DIRS) {
        const nx = cx + d.x
        const ny = cy + d.y
        const key = `${nx},${ny}`
        if (first.has(key) || !this.fits(w, nx, ny)) continue
        first.set(key, first.get(`${cx},${cy}`) ?? d)
        queue.push([nx, ny])
        const dist = Math.hypot(nx - target.x, ny - target.y)
        if (dist < bestD - 1e-9) {
          bestD = dist
          best = [nx, ny]
        }
      }
    }
    return first.get(`${best[0]},${best[1]}`) ?? null
  }
}

// --- the Glitch Train ----------------------------------------------------------------------

export type TrainSpec = {
  layout: MazeLayout
  cars: number
  /** Cars left when it speeds up and takes the tunnels, and when it splits in two. */
  phase2At: number
  phase3At: number
  /** Its pace as a share of the gremlin speed, plus this much per car it has lost. */
  pace: number
  pacePerCar: number
  napTicks: number
  /** Where cells come back while it still has cars, and how long after the last is eaten. */
  cellSpots: readonly Tile[]
  cellBack: number
  points: { car: number; crash: number; train: number }
  music: MusicLoop
}

export const TRAIN: TrainSpec = {
  layout: TRAIN_YARD,
  cars: 8,
  phase2At: 5,
  phase3At: 2,
  pace: 0.72,
  pacePerCar: 0.05,
  napTicks: 60 * 6,
  cellSpots: [
    { x: 1, y: 2 },
    { x: 21, y: 2 },
    { x: 1, y: 18 },
    { x: 21, y: 18 },
  ],
  cellBack: 60 * 4,
  points: { car: 1500, crash: 25000, train: 10000 },
  music: BOSS_MUSIC,
}

/** One train: a head and the cars on its trail (a quarter-tile apart, four to a car). */
export type Train = {
  x: number
  y: number
  dir: Dir
  cars: number
  trail: Tile[]
  /** 0 hunts the robot (or races ahead of it), 1 cuts off its retreat. */
  side: 0 | 1
}

const CAR_GAP = 4

/** The Glitch Train (see the header). */
export class GlitchTrain implements BossMachine {
  readonly id = 'train' as const
  readonly name = 'THE GLITCH TRAIN'
  phase: 1 | 2 | 3 = 1
  trains: Train[]
  sleepy = false
  /** It shook off its sleep after a bump (until the next cell). */
  shook = false
  /** Ticks since it was beaten (the game moves on after a moment). */
  doneTicks = -1
  cellTimer = 0
  private dock: Tile

  constructor(
    dock: Tile,
    readonly spec: TrainSpec = TRAIN,
  ) {
    this.dock = dock
    this.trains = [this.newTrain(dock, spec.cars, 0)]
  }

  private newTrain(at: Tile, cars: number, side: 0 | 1): Train {
    return {
      x: at.x,
      y: at.y,
      dir: { x: side ? 1 : -1, y: 0 },
      cars,
      trail: [{ ...at }],
      side,
    }
  }

  get done() {
    return this.doneTicks > 120
  }

  get napTicks() {
    return this.spec.napTicks
  }

  get music() {
    return this.spec.music
  }

  get carsLeft() {
    return this.trains.reduce((n, t) => n + t.cars, 0)
  }

  get health() {
    if (this.doneTicks >= 0) return 0
    return Math.max(0.05, this.carsLeft / this.spec.cars)
  }

  /** Where a train's cars sit, head first, caboose last. */
  carsOf(t: Train): Tile[] {
    const out: Tile[] = []
    for (let i = 1; i <= t.cars; i++) {
      const at = t.trail[Math.max(0, t.trail.length - 1 - i * CAR_GAP)]!
      out.push(at)
    }
    return out
  }

  reset() {
    const cars = this.trains.reduce((n, t) => n + t.cars, 0)
    this.trains =
      this.phase === 3 && this.trains.length > 1
        ? this.trains.map((t, i) =>
            this.newTrain(this.dock, t.cars, i as 0 | 1),
          )
        : [this.newTrain(this.dock, cars, 0)]
  }

  update(w: BossWorld) {
    const s = this.spec
    if (this.doneTicks >= 0) {
      this.doneTicks++
      return
    }
    // Each cell buys one bump: a bumped train shakes its sleep off until the next cell.
    if (!w.sleepy()) this.shook = false
    this.sleepy = w.sleepy() && !this.shook
    if (!w.sleepy() && w.cellsLeft() === 0) {
      if (++this.cellTimer >= s.cellBack) {
        this.cellTimer = 0
        w.spawnCell(s.cellSpots[Math.floor(w.rng() * s.cellSpots.length)]!)
      }
    }
    for (const t of this.trains) this.drive(w, t)
    // Two heads meeting crash into each other: both reboot.
    if (this.trains.length === 2) {
      const [a, b] = this.trains as [Train, Train]
      if (Math.abs(a.x - b.x) < 0.9 && Math.abs(a.y - b.y) < 0.9) {
        w.addScore(s.points.crash, { x: a.x, y: a.y })
        w.sparkle({ x: a.x, y: a.y })
        w.sound('boom')
        w.announce('CRASH!', 'THE GLITCH TRAIN IS REBOOTED')
        this.trains = []
        this.doneTicks = 0
      }
    }
  }

  private drive(w: BossWorld, t: Train) {
    const lost = this.spec.cars - this.carsLeft
    const pace = this.sleepy
      ? w.row.sleepyGremlin / w.row.gremlin
      : this.spec.pace + (this.phase > 1 ? lost * this.spec.pacePerCar : 0)
    const speed = BASE_SPEED * w.row.gremlin * pace
    const atCentre =
      Math.abs(t.x - Math.round(t.x)) < 1e-6 &&
      Math.abs(t.y - Math.round(t.y)) < 1e-6
    if (atCentre) this.choose(w, t)
    const before = { x: t.x, y: t.y }
    const cx = Math.round(t.x)
    const cy = Math.round(t.y)
    const b0 = t.dir.x ? t.x - cx : t.y - cy
    t.x += t.dir.x * speed
    t.y += t.dir.y * speed
    if (t.x < -0.5) t.x += 23
    if (t.x > 22.5) t.x -= 23
    const a0 = t.dir.x ? t.x - Math.round(t.x) : t.y - Math.round(t.y)
    if (
      ((b0 < 0 && a0 >= 0) || (b0 > 0 && a0 <= 0)) &&
      Math.abs(a0) < speed + 1e-6
    ) {
      t.x = Math.round(t.x)
      t.y = Math.round(t.y)
      if (t.x >= 23) t.x -= 23
    }
    // The trail, a quarter tile at a time.
    let d = Math.abs(t.x - before.x)
    if (d > 2) d = 0
    d += Math.abs(t.y - before.y)
    const last = t.trail[t.trail.length - 1]!
    if (Math.abs(t.x - last.x) + Math.abs(t.y - last.y) >= 0.25 || d > 0.25)
      t.trail.push({ x: t.x, y: t.y })
    const keep = (this.spec.cars + 2) * CAR_GAP
    if (t.trail.length > keep) t.trail.splice(0, t.trail.length - keep)
  }

  private choose(w: BossWorld, t: Train) {
    const x = Math.round(t.x)
    const y = Math.round(t.y)
    const back = { x: -t.dir.x || 0, y: -t.dir.y || 0 }
    const ok = (d: Dir) => {
      const nx = (x + d.x + 23) % 23
      if (!w.open(nx, y + d.y)) return false
      return this.phase > 1 || !w.tunnel(nx, y + d.y)
    }
    let options = DIRS.filter(
      (d) => !(d.x === back.x && d.y === back.y) && ok(d),
    )
    if (!options.length) options = DIRS.filter(ok)
    if (!options.length) return
    const r = w.robot
    const target = this.sleepy
      ? null
      : this.phase === 3
        ? t.side === 0
          ? w.ahead()
          : w.behind()
        : { x: r.x, y: r.y }
    let best = options[0]!
    let bestScore = Infinity
    for (const d of options) {
      const dist = target
        ? Math.hypot(x + d.x - target.x, y + d.y - target.y)
        : -Math.hypot(x + d.x - r.x, y + d.y - r.y)
      if (dist < bestScore - 1e-9) {
        bestScore = dist
        best = d
      }
    }
    t.dir = best
  }

  contact(x: number, y: number): 'hurt' | 'bump' | null {
    for (const t of this.trains) {
      const parts = [{ x: t.x, y: t.y }, ...this.carsOf(t)]
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i]!
        const dx = Math.min(Math.abs(p.x - x), 23 - Math.abs(p.x - x))
        if (dx >= 0.6 || Math.abs(p.y - y) >= 0.6) continue
        if (!this.sleepy) return 'hurt'
        if (i === parts.length - 1) return 'bump'
      }
    }
    return null
  }

  bump(w: BossWorld, x: number, y: number) {
    const s = this.spec
    const t = this.trains.find((tr) => {
      const parts = [{ x: tr.x, y: tr.y }, ...this.carsOf(tr)]
      const c = parts[parts.length - 1]!
      return Math.abs(c.x - x) < 0.6 && Math.abs(c.y - y) < 0.6
    })
    if (!t) return
    const at = this.carsOf(t).at(-1) ?? { x: t.x, y: t.y }
    w.sparkle(at)
    w.sound('pop')
    this.shook = true
    this.sleepy = false
    if (t.cars === 0) {
      // A train with no cars left: its head reboots.
      w.addScore(s.points.train, at)
      this.trains = this.trains.filter((tr) => tr !== t)
      if (!this.trains.length) {
        w.announce('ALL ABOARD FOR HOME!', 'THE GLITCH TRAIN IS REBOOTED')
        w.sound('extra')
        this.doneTicks = 0
      }
      return
    }
    t.cars--
    w.addScore(s.points.car, at)
    const left = this.carsLeft
    if (this.phase === 1 && left <= s.phase2At) {
      this.phase = 2
      w.announce('FULL STEAM!', 'IT SPEEDS UP AND TAKES THE TUNNELS')
      w.sound('warn')
    } else if (this.phase === 2 && left <= s.phase3At) {
      this.phase = 3
      // It splits in two: the second half sets off from the dock.
      t.cars = 1
      this.trains.push(this.newTrain(this.dock, Math.max(0, left - 1), 1))
      w.refillFlips()
      w.announce('IT SPLIT IN TWO!', 'REWIRE THEM INTO EACH OTHER')
      w.sound('warn')
    }
  }

  pilot(w: BossWorld): PilotPlan {
    void w
    const threats: Array<Tile & { reach: number }> = []
    const goals: Tile[] = []
    for (const t of this.trains) {
      const parts = [{ x: t.x, y: t.y }, ...this.carsOf(t)]
      parts.forEach((p, i) => {
        const tile = { x: Math.round(p.x), y: Math.round(p.y) }
        if (this.sleepy) {
          if (i === parts.length - 1) goals.push(tile)
        } else threats.push({ ...tile, reach: i === 0 ? 2 : 1 })
      })
    }
    return { threats, goals: goals.length ? goals : null, flip: false }
  }
}

// --- the Overload --------------------------------------------------------------------------

export type OverloadSpec = {
  layout: MazeLayout
  /** The face's middle while it fills the dock. */
  home: Tile
  /** Shares of the core's sparks eaten that start phases 2 and 3. */
  phase2At: number
  phase3At: number
  /** Surges: one every `every` ticks (by phase), lit `tell` ticks first, live for `live`. */
  surge: { every: readonly [number, number]; tell: number; live: number }
  /** In phase 2 it throws a switch every this many ticks. */
  rewireEvery: number
  plugs: number
  plugSpots: readonly Tile[]
  /** Its chase pace (a share of the gremlin speed), and its reach (half its width). */
  pace: number
  reach: number
  napTicks: number
  points: { plug: number; done: number }
  music: MusicLoop
}

export const OVERLOAD: OverloadSpec = {
  layout: THE_CORE,
  home: { x: 11, y: 9 },
  phase2At: 0.3,
  phase3At: 0.6,
  surge: { every: [150, 210], tell: 60, live: 24 },
  rewireEvery: 60 * 5,
  plugs: 4,
  plugSpots: [
    { x: 1, y: 1 },
    { x: 21, y: 1 },
    { x: 1, y: 19 },
    { x: 21, y: 19 },
  ],
  pace: 0.5,
  reach: 1.4,
  napTicks: 60 * 5,
  points: { plug: 5000, done: 50000 },
  music: FINALE_MUSIC,
}

export type Surge = { axis: 'row' | 'col'; at: number; t: number }

/** The Overload (see the header). */
export class Overload implements BossMachine {
  readonly id = 'overload' as const
  readonly name = 'THE OVERLOAD'
  phase: 1 | 2 | 3 = 1
  x: number
  y: number
  plugs: number
  surge: Surge | null = null
  surgeTimer: number
  rewireTimer: number
  sleepy = false
  shook = false
  dazed = 0
  /** Surges alternate rows and columns. */
  nextAxis: 'row' | 'col' = 'row'
  doneTicks = -1

  constructor(readonly spec: OverloadSpec = OVERLOAD) {
    this.x = spec.home.x
    this.y = spec.home.y
    this.plugs = spec.plugs
    this.surgeTimer = spec.surge.every[0]
    this.rewireTimer = spec.rewireEvery
  }

  get done() {
    return this.doneTicks > 150
  }

  get napTicks() {
    return this.spec.napTicks
  }

  get music() {
    return this.spec.music
  }

  get health() {
    if (this.doneTicks >= 0) return 0
    return this.phase < 3 ? 1 : Math.max(0.05, this.plugs / this.spec.plugs)
  }

  /** The surge's line is lit (the tell) or live. */
  surgeLive(): boolean {
    return !!this.surge && this.surge.t >= this.spec.surge.tell
  }

  reset() {
    this.surge = null
    this.surgeTimer = this.spec.surge.every[0]
    if (this.phase === 3) {
      // It backs off to the top of the core and gathers itself before coming again.
      this.x = this.spec.home.x
      this.y = 2
      this.dazed = 150
    }
  }

  update(w: BossWorld) {
    const s = this.spec
    if (this.doneTicks >= 0) {
      this.doneTicks++
      return
    }
    const share = w.eatenShare()
    if (this.phase === 1 && share >= s.phase2At) {
      this.phase = 2
      w.announce('IT REWIRES THE MAZE!', 'YOUR FLIPS FIGHT ITS FLIPS')
      w.sound('warn')
    } else if (this.phase === 2 && share >= s.phase3At) {
      this.phase = 3
      this.surge = null
      for (const spot of s.plugSpots) w.spawnCell(spot)
      w.refillFlips()
      w.announce('IT CLIMBS OUT!', 'EAT A PLUG CELL, THEN BUMP A PLUG')
      w.sound('boom')
    }
    // One plug per cell: a bump shakes its sleep off until the next one.
    if (!w.sleepy()) this.shook = false
    this.sleepy = w.sleepy() && !this.shook
    if (this.phase < 3) {
      this.updateSurge(w)
      if (this.phase === 2 && --this.rewireTimer <= 0) {
        this.rewireTimer = s.rewireEvery
        // It throws the switch nearest the robot.
        const r = w.robot
        const list = w.switches()
        let best = -1
        let bestD = Infinity
        list.forEach((t, i) => {
          const d = Math.hypot(t.x - r.x, t.y - r.y)
          if (d < bestD) {
            bestD = d
            best = i
          }
        })
        if (best >= 0) w.flip(best)
      }
      return
    }
    if (this.dazed > 0) {
      this.dazed--
      return
    }
    if (this.sleepy) return
    if (!w.cellsLeft() && this.plugs > 0) {
      // Out of plug cells: one more comes back.
      w.spawnCell(s.plugSpots[Math.floor(w.rng() * s.plugSpots.length)]!)
    }
    const r = w.robot
    const dx = r.x - this.x
    const dy = r.y - this.y
    const d = Math.hypot(dx, dy)
    const speed = BASE_SPEED * w.row.gremlin * s.pace
    if (d > 1e-6) {
      this.x += (dx / d) * Math.min(speed, d)
      this.y += (dy / d) * Math.min(speed, d)
    }
  }

  private updateSurge(w: BossWorld) {
    const s = this.spec.surge
    const r = w.robot
    if (!this.surge) {
      if (--this.surgeTimer > 0) return
      this.surgeTimer = s.every[this.phase - 1]!
      const axis = this.nextAxis
      this.nextAxis = axis === 'row' ? 'col' : 'row'
      this.surge = { axis, at: Math.round(axis === 'row' ? r.y : r.x), t: 0 }
      w.sound('warn')
      return
    }
    const surge = this.surge
    surge.t++
    if (surge.t === s.tell) w.sound('boom')
    if (this.surgeLive()) {
      const hit =
        surge.axis === 'row'
          ? Math.abs(r.y - surge.at) < 0.45
          : Math.abs(r.x - surge.at) < 0.45
      if (hit) w.hurt()
    }
    if (surge.t >= s.tell + s.live) this.surge = null
  }

  contact(x: number, y: number): 'hurt' | 'bump' | null {
    if (this.phase < 3 || this.doneTicks >= 0) return null
    const reach = this.spec.reach
    if (Math.abs(x - this.x) > reach || Math.abs(y - this.y) > reach)
      return null
    if (this.dazed > 0) return null
    return this.sleepy ? 'bump' : 'hurt'
  }

  bump(w: BossWorld) {
    const s = this.spec
    this.plugs--
    this.shook = true
    this.sleepy = false
    w.addScore(s.points.plug, { x: this.x, y: this.y })
    w.sparkle({ x: this.x, y: this.y })
    w.sound('boom')
    if (this.plugs <= 0) {
      this.doneTicks = 0
      w.addScore(s.points.done, { x: this.x, y: this.y })
      w.announce('UNPLUGGED!', 'THE GRID HUMS BACK TO LIFE')
      w.sound('extra')
      return
    }
    // Knocked back to the dock, dazed.
    this.dazed = 90
    this.x = s.home.x
    this.y = s.home.y
    w.announce(`${this.plugs} PLUG${this.plugs > 1 ? 'S' : ''} LEFT!`)
  }

  pilot(w: BossWorld): PilotPlan {
    void w
    const threats: Array<Tile & { reach: number }> = []
    if (this.surge) {
      for (let i = 0; i < 23; i++) {
        const t =
          this.surge.axis === 'row'
            ? { x: i, y: this.surge.at, reach: 0 }
            : { x: this.surge.at, y: i, reach: 0 }
        threats.push(t)
      }
    }
    if (this.phase === 3 && this.doneTicks < 0) {
      const c = { x: Math.round(this.x), y: Math.round(this.y) }
      if (this.sleepy && !this.dazed)
        return { threats, goals: [c], flip: false }
      if (!this.dazed) threats.push({ ...c, reach: 3 })
    }
    return { threats, goals: null, flip: false }
  }
}
