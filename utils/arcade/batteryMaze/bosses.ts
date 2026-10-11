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

import type { MusicLoop } from '../sound'
import { BOSS_MUSIC } from './music'
import { MAMAS_DEN } from './mazes'
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
}

export type BossId = 'mama'

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
export class GremlinMama {
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

export const BOSSES: Record<BossId, { name: string; layout: MazeLayout }> = {
  mama: { name: 'GREMLIN MAMA', layout: MAMAS_DEN },
}
