// /utils/arcade/games/batteryMaze.ts
//
// Battery Maze -- the Kind Robots Arcade's maze-chase riff (conductor kr-arcade/t-006, depth pass
// t-039..t-042: conductor projects/kr-arcade/depth-pass/CABINETS.md section 2). A little
// cat-eared robot gathers energy sparks through original mazes while glitch gremlins, each with
// its own way of hunting (batteryMaze/roster.ts), chase it. A power cell makes them sleepy;
// every one bumped while it lasts reboots into a friendly bot that rides the Friend Train behind
// the robot, eating sparks, and the train pays out when the cell runs down. Rewire switches at
// chosen junctions swing gates to re-route the maze itself.
//
// The rules engine reads its content as data: the mazes (batteryMaze/mazes.ts), the per-maze
// heat tables for every speed, schedule and counter (batteryMaze/tables.ts) and the gremlins'
// hunting rules (batteryMaze/roster.ts). The art lives in batteryMaze/art.ts.

import { drawText, measureText } from '../font'
import {
  INK,
  RAMPS,
  Sparkles,
  backdropRng,
  cachedLayer,
  drawSprite,
  drawStars,
  dropShadow,
  gauge,
  glow,
  hudPanel,
  vignette,
} from '../snes'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'
import {
  BREAK_STARS,
  CELL_COLOURS,
  CELL_SPRITES,
  EYES_ONLY,
  FLASH_THEME,
  GREMLIN_ART,
  GREMLIN_LOOKS,
  H,
  LIFE_SPRITE,
  PRIZE_SPRITES,
  ROBOT_DEATH,
  ROBOT_FRAMES,
  ROBOT_SPARKS,
  SLEEP_Z,
  SPARK_COLOURS,
  SPARK_SPRITE,
  SPARK_TWINKLE,
  TILE,
  TOP,
  W,
  WALL_THEMES,
  drawGate,
  drawSwitch,
  glowStamp,
  paintBoard,
  paintBreak,
} from '../batteryMaze/art'
import type { Face } from '../batteryMaze/art'
import {
  CLASSIC_LAYOUT,
  LAYOUTS,
  gateOpen,
  parseMaze,
} from '../batteryMaze/mazes'
import type { Maze, Tile } from '../batteryMaze/mazes'
import { HUNTERS, STARTING_FOUR, freshMind } from '../batteryMaze/roster'
import type { GremlinKind, HuntView, Mind } from '../batteryMaze/roster'
import {
  BASE_SPEED,
  OVERCLOCK_BOOST,
  PRIZES,
  PRIZE_AT,
  PRIZE_SPEED,
  PRIZE_WANDER_TICKS,
  REWIRE_FLIPS,
  SHIELD_TICKS,
  bumpPoints,
  heatRow,
  overclockStage,
  prizeFor,
  trainPayout,
} from '../batteryMaze/tables'
import type { HeatRow } from '../batteryMaze/tables'

/** Today's maze, as the engine's layout test reads it. */
export const BATTERY_MAZE = CLASSIC_LAYOUT.rows

const START_LIVES = 3
const EXTRA_LIFE_AT = 10_000

type Dir = { x: number; y: number }
const NONE: Dir = { x: 0, y: 0 }
const UP: Dir = { x: 0, y: -1 }
const DOWN: Dir = { x: 0, y: 1 }
const LEFT: Dir = { x: -1, y: 0 }
const RIGHT: Dir = { x: 1, y: 0 }
// Tie-break order when two turns score the same.
const DIRS: Dir[] = [UP, LEFT, DOWN, RIGHT]

/** The robot may turn this far (in tiles) before or after a junction's centre: cornering. */
export const CORNER_WINDOW = 0.35
/** Ticks the robot stays at chomping speed after a spark. */
const EAT_DRAG = 6
/** The Friend Train's trail is sampled every quarter tile; friends ride a tile apart. */
const TRAIL_STEP = 0.25
const TRAIL_SPACING = 4
const TRAIL_MAX = 80
const HOP_TICKS = 18
/** The robot's last ticks of position, for the chaser to sniff. */
const HISTORY_MAX = 100
/** A gremlin rebooting home moves this fast; a friend peeling off home strolls. */
const EYES_SPEED = 0.25
const FRIEND_HOME_SPEED = 0.16

type GremlinState = 'docked' | 'leaving' | 'roaming' | 'eyes' | 'friend'

type Gremlin = {
  kind: GremlinKind
  x: number
  y: number
  dir: Dir
  state: GremlinState
  sleepy: boolean
  corner: Tile
  /** Its place in the dock's queue (lower leaves first). */
  order: number
  pad: Tile
  mind: Mind
  /** Heading home as a friendly bot (a Friend Train that peeled off). */
  friendly: boolean
  /** Jumping from where it was bumped into its train slot. */
  hop: { x: number; y: number; t: number } | null
}

type RoamingPrize = {
  kind: number
  x: number
  y: number
  dir: Dir
  t: number
}

function sameDir(a: Dir, b: Dir) {
  return a.x === b.x && a.y === b.y
}

function opposite(d: Dir): Dir {
  return { x: 0 - d.x || 0, y: 0 - d.y || 0 }
}

const PARSED = LAYOUTS.map(parseMaze)

class BatteryMaze implements ArcadeGameInstance {
  score = 0
  level = 0
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private maze: Maze = PARSED[0]!
  private heat = 1
  private row: HeatRow = heatRow(1)
  private sparks = new Set<string>()
  private cells = new Set<string>()
  private totalSparks = 0
  private eaten = 0
  private switchState: Array<0 | 1> = []
  private shut = new Set<string>()
  private flips = REWIRE_FLIPS
  private robot = {
    x: 0,
    y: 0,
    dir: LEFT as Dir,
    want: LEFT as Dir,
    mouth: 0,
    eatDrag: 0,
    shield: 0,
  }
  private history: Tile[] = []
  private trail: Tile[] = []
  private trailAcc = 0
  private gremlins: Gremlin[] = []
  private train: Gremlin[] = []
  private modeIndex = 0
  private modeTimer = 0
  private chasing = false
  private sleepyTimer = 0
  private sleepyFull = 1
  private chain = 0
  private released = 0
  private sparksSinceRelease = 0
  private idleTicks = 0
  private prize: RoamingPrize | null = null
  private prizesRolled = 0
  private floaters: Array<{
    x: number
    y: number
    text: string
    life: number
  }> = []
  private pause = 0
  private dying = 0
  private clearing = 0
  private intermission = 0
  private nextExtra = EXTRA_LIFE_AT
  private banner: { text: string; sub?: string; ticks: number } | null = null
  // Cosmetic sparkles roll their own dice, so the game's seeded rng is untouched.
  private fx = new Sparkles()
  private fxRng = backdropRng(41)

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.startLevel(1)
  }

  // --- setup ---------------------------------------------------------------

  /** Each level plays the next maze in turn, one heat hotter than the last. */
  private startLevel(level: number) {
    this.level = level
    this.loadMaze(PARSED[(level - 1) % PARSED.length]!, level)
    this.banner = { text: `LEVEL ${level}`, sub: this.maze.name, ticks: 150 }
  }

  private loadMaze(maze: Maze, heat: number) {
    this.maze = maze
    this.heat = heat
    this.row = heatRow(heat)
    this.sparks = new Set(maze.sparks.map((t) => `${t.x},${t.y}`))
    this.cells = new Set(maze.cells.map((t) => `${t.x},${t.y}`))
    this.totalSparks = this.sparks.size + this.cells.size
    this.eaten = 0
    this.switchState = maze.switches.map(() => 0)
    this.refreshGates()
    this.flips = REWIRE_FLIPS
    this.prize = null
    this.prizesRolled = 0
    this.resetActors()
  }

  private resetActors() {
    const m = this.maze
    this.robot = {
      x: m.start.x,
      y: m.start.y,
      dir: LEFT,
      want: LEFT,
      mouth: 0,
      eatDrag: 0,
      shield: 0,
    }
    this.history = [{ ...m.start }]
    this.trail = [{ ...m.start }]
    this.trailAcc = 0
    const corners: Tile[] = [
      { x: m.cols - 2, y: -2 },
      { x: 1, y: -2 },
      { x: m.cols - 1, y: m.height + 1 },
      { x: 0, y: m.height + 1 },
    ]
    const pads = m.dockPads
    const mid = Math.floor(pads.length / 2)
    this.gremlins = STARTING_FOUR.map((kind, i) => {
      // The first waits outside the door; the rest on the dock's pads, middle out.
      const pad = pads[mid + (i === 1 ? 0 : i === 2 ? -1 : 1)]!
      const outside = i === 0
      return {
        kind,
        x: outside ? m.dockExit.x : pad.x,
        y: outside ? m.dockExit.y : pad.y,
        dir: LEFT,
        state: outside ? 'roaming' : 'docked',
        sleepy: false,
        corner: corners[i % corners.length]!,
        order: i - 1,
        pad,
        mind: freshMind(),
        friendly: false,
        hop: null,
      }
    })
    this.train = []
    this.modeIndex = 0
    this.modeTimer = this.row.schedule[0] ?? Infinity
    this.chasing = false
    this.sleepyTimer = 0
    this.chain = 0
    this.released = 0
    this.sparksSinceRelease = 0
    this.idleTicks = 0
    this.pause = 90
  }

  // --- the maze --------------------------------------------------------------

  private refreshGates() {
    this.shut.clear()
    this.maze.switches.forEach((s, i) => {
      for (const gate of s.gates)
        if (!gateOpen(gate, this.switchState[i]!))
          this.shut.add(`${gate.x},${gate.y}`)
    })
  }

  private wrapX(x: number) {
    const c = this.maze.cols
    return ((x % c) + c) % c
  }

  private key(x: number, y: number) {
    return `${this.wrapX(Math.round(x))},${Math.round(y)}`
  }

  private isWall(x: number, y: number): boolean {
    const row = this.maze.rows[y]
    if (!row) return true
    const wx = this.wrapX(x)
    return row[wx] === '#' || this.shut.has(`${wx},${y}`)
  }

  private isDoor(x: number, y: number) {
    return x === this.maze.door.x && y === this.maze.door.y
  }

  private canMove(x: number, y: number, dir: Dir, allowDoor = false): boolean {
    const nx = Math.round(x) + dir.x
    const ny = Math.round(y) + dir.y
    if (!allowDoor && this.isDoor(this.wrapX(nx), ny)) return false
    const cell = this.maze.rows[ny]?.[this.wrapX(nx)]
    if (!allowDoor && cell === 'G') return false
    return !this.isWall(nx, ny)
  }

  private exits(x: number, y: number): number {
    return DIRS.filter((d) => this.canMove(x, y, d)).length
  }

  /** Walk from the robot's tile along `dir` to the first crossroads (or as far as it goes). */
  private junctionAlong(dir: Dir): Tile {
    let x = Math.round(this.robot.x)
    let y = Math.round(this.robot.y)
    if (sameDir(dir, NONE)) return { x: this.wrapX(x), y }
    for (let i = 0; i < 14; i++) {
      if (!this.canMove(x, y, dir)) break
      x = this.wrapX(x + dir.x)
      y += dir.y
      if (this.exits(x, y) >= 3) break
    }
    return { x, y }
  }

  // --- update ----------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.fx.update()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    for (const f of this.floaters) {
      f.y -= 0.03
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)

    if (this.over) return
    if (this.intermission > 0) {
      if (--this.intermission === 0) this.startLevel(this.level + 1)
      return
    }
    if (this.clearing > 0) {
      if (this.clearing % 16 === 0) {
        this.fx.burst(
          TILE + this.fxRng() * (W - TILE * 2),
          TOP + TILE + this.fxRng() * (this.maze.height - 2) * TILE,
          this.fxRng,
          { count: 12, speed: 2 },
        )
      }
      if (--this.clearing === 0) {
        if (this.level % 3 === 0) this.intermission = 300
        else this.startLevel(this.level + 1)
      }
      return
    }
    if (this.dying > 0) {
      if (--this.dying === 0) {
        if (this.lives <= 0) {
          this.over = true
          this.banner = { text: 'GAME OVER', ticks: 9999 }
        } else {
          this.resetActors()
        }
      }
      if (this.dying === 30) {
        this.sparkle(this.robot.x, this.robot.y, 16, ROBOT_SPARKS, 2)
      }
      return
    }
    if (this.pause > 0) {
      this.pause--
      return
    }

    const controls = this.demo ? this.demoInput() : input
    if (controls.held.up) this.robot.want = UP
    else if (controls.held.down) this.robot.want = DOWN
    else if (controls.held.left) this.robot.want = LEFT
    else if (controls.held.right) this.robot.want = RIGHT
    if (controls.pressed.a) this.tryFlip()

    this.updateModes()
    this.moveRobot()
    this.eat()
    this.release()
    const view = this.huntView()
    for (const gremlin of this.gremlins) {
      if (gremlin.state === 'roaming' && !gremlin.sleepy)
        HUNTERS[gremlin.kind].sense?.(gremlin, view)
      this.moveGremlin(gremlin, view)
    }
    this.moveTrain()
    this.collide()
    this.movePrize()

    if (this.sparks.size === 0 && this.cells.size === 0) {
      this.endTrain(true)
      this.clearing = 120
      this.sound.play('level')
      this.banner = { text: 'MAZE CHARGED!', ticks: 120 }
    }
  }

  private updateModes() {
    if (this.robot.shield > 0) this.robot.shield--
    if (this.sleepyTimer > 0) {
      this.sleepyTimer--
      if (this.sleepyTimer === 0) {
        for (const g of this.gremlins) g.sleepy = false
        this.endTrain(true)
      }
      return
    }
    const schedule = this.row.schedule
    if (this.modeIndex >= schedule.length) return
    if (--this.modeTimer <= 0) {
      this.modeIndex++
      this.chasing = !this.chasing
      this.modeTimer = schedule[this.modeIndex] ?? Infinity
      for (const g of this.gremlins) {
        if (g.state === 'roaming') g.dir = opposite(g.dir)
      }
    }
    if (this.modeIndex >= schedule.length) this.chasing = true
  }

  /** The chaser's overclock stage, from the sparks still to eat. */
  private overclock(): 0 | 1 | 2 {
    return overclockStage(this.row, this.sparks.size + this.cells.size)
  }

  // --- the robot ------------------------------------------------------------

  private robotSpeed(): number {
    const r = this.row
    const pace =
      this.sleepyTimer > 0
        ? r.robotSleepy
        : this.robot.eatDrag > 0
          ? r.robotEat
          : r.robot
    return BASE_SPEED * pace
  }

  /**
   * The robot moves a tile at a time like everything else, but it corners: within
   * CORNER_WINDOW of a junction's centre it may take a new turn at once, cutting the corner on
   * the diagonal while it drifts back onto the new corridor's centre line.
   */
  private moveRobot() {
    const robot = this.robot
    if (robot.eatDrag > 0) robot.eatDrag--
    const speed = this.robotSpeed()
    if (sameDir(robot.want, opposite(robot.dir))) robot.dir = robot.want
    const tx = Math.round(robot.x)
    const ty = Math.round(robot.y)
    const along = robot.dir.x ? robot.x - tx : robot.y - ty
    const side = robot.dir.x ? robot.y - ty : robot.x - tx
    const perpendicular =
      !sameDir(robot.want, robot.dir) &&
      !sameDir(robot.want, opposite(robot.dir))
    if (
      perpendicular &&
      Math.abs(along) <= CORNER_WINDOW &&
      Math.abs(side) < 1e-6 &&
      this.canMove(tx, ty, robot.want)
    ) {
      robot.dir = robot.want
    }

    const before = { x: robot.x, y: robot.y }
    // Drift back onto the centre line across the heading (the cut corner).
    if (robot.dir.x) robot.y = this.approach(robot.y, ty, speed)
    else if (robot.dir.y) robot.x = this.approach(robot.x, tx, speed)

    const cx = Math.round(robot.x)
    const cy = Math.round(robot.y)
    const offset = robot.dir.x ? robot.x - cx : robot.y - cy
    const sign = robot.dir.x || robot.dir.y
    const ahead = offset * sign
    if (ahead >= -1e-6 && !this.canMove(cx, cy, robot.dir)) {
      // Blocked: settle on the centre and wait for a way on.
      if (robot.dir.x) robot.x = cx
      else robot.y = cy
      robot.mouth = 0.6
    } else if (
      ahead < -1e-6 &&
      ahead + speed >= 0 &&
      !this.canMove(cx, cy, robot.dir)
    ) {
      if (robot.dir.x) robot.x = cx
      else robot.y = cy
    } else {
      robot.x += robot.dir.x * speed
      robot.y += robot.dir.y * speed
      robot.mouth = (robot.mouth + 0.12) % (Math.PI * 2)
    }
    const cols = this.maze.cols
    if (robot.x < -0.5) robot.x += cols
    if (robot.x > cols - 0.5) robot.x -= cols
    this.recordTrail(before)
  }

  private approach(v: number, to: number, step: number) {
    return v < to ? Math.min(to, v + step) : Math.max(to, v - step)
  }

  private recordTrail(before: Tile) {
    const r = this.robot
    this.history.push({ x: Math.round(r.x), y: Math.round(r.y) })
    if (this.history.length > HISTORY_MAX) this.history.shift()
    let dx = Math.abs(r.x - before.x)
    if (dx > 2) dx = 0
    this.trailAcc += dx + Math.abs(r.y - before.y)
    while (this.trailAcc >= TRAIL_STEP) {
      this.trailAcc -= TRAIL_STEP
      this.trail.push({ x: r.x, y: r.y })
    }
    if (this.trail.length > TRAIL_MAX)
      this.trail.splice(0, this.trail.length - TRAIL_MAX)
  }

  private trailPoint(back: number): Tile {
    const i = Math.max(0, this.trail.length - 1 - back)
    return this.trail[i]!
  }

  private tryFlip() {
    const r = this.robot
    const tx = this.wrapX(Math.round(r.x))
    const ty = Math.round(r.y)
    const i = this.maze.switches.findIndex((s) => s.x === tx && s.y === ty)
    if (i < 0) return
    if (this.flips <= 0) {
      this.sound.play('warn')
      return
    }
    this.flip(i)
  }

  /** Throw a switch: its gates swing, and anything walking into a shut one turns round. */
  private flip(i: number) {
    this.flips--
    this.switchState[i] = this.switchState[i] === 0 ? 1 : 0
    this.refreshGates()
    const sw = this.maze.switches[i]!
    this.sound.play('pickup')
    for (const gate of sw.gates)
      this.sparkle(gate.x, gate.y, 6, [RAMPS.gold[3], RAMPS.steel[4]], 1)
    const walkers: Array<{ x: number; y: number; dir: Dir }> = this.gremlins
      .filter((g) => g.state === 'roaming' || g.state === 'eyes')
      .map((g) => g)
    if (this.prize) walkers.push(this.prize)
    for (const w of walkers) {
      if (sameDir(w.dir, NONE)) continue
      // The tile it is walking into (or the gate it stands short of the middle of).
      const ax =
        w.dir.x > 0
          ? Math.ceil(w.x - 1e-6)
          : w.dir.x < 0
            ? Math.floor(w.x + 1e-6)
            : Math.round(w.x)
      const ay =
        w.dir.y > 0
          ? Math.ceil(w.y - 1e-6)
          : w.dir.y < 0
            ? Math.floor(w.y + 1e-6)
            : Math.round(w.y)
      const intoShut = this.shut.has(`${this.wrapX(ax)},${ay}`)
      const atCentre = Math.abs(w.x - ax) < 1e-6 && Math.abs(w.y - ay) < 1e-6
      if (intoShut && !atCentre) w.dir = opposite(w.dir)
    }
  }

  private eat() {
    const key = this.key(this.robot.x, this.robot.y)
    if (this.sparks.delete(key)) {
      this.chomp(this.robot.x, this.robot.y)
      this.robot.eatDrag = EAT_DRAG
      this.sparksSinceRelease++
      this.idleTicks = 0
      if (this.tick % 2 === 0) this.sound.play('blip')
    } else if (this.cells.delete(key)) {
      this.addScore(50)
      this.eaten++
      this.sound.play('pickup')
      this.sparkle(this.robot.x, this.robot.y, 14, CELL_COLOURS, 1.8)
      this.powerUp()
    }
    this.rollPrize()
  }

  /** A spark eaten, by the robot or a friend on its train. */
  private chomp(x: number, y: number) {
    this.addScore(10)
    this.eaten++
    this.sparkle(x, y, 3, SPARK_COLOURS, 0.8)
  }

  /** A power cell: the gremlins go sleepy (or, at heat 20, a shield cell). Flips refill. */
  private powerUp() {
    this.flips = REWIRE_FLIPS
    const ticks = this.row.sleepyTicks
    for (const g of this.gremlins) {
      if (g.state === 'roaming') g.dir = opposite(g.dir)
    }
    if (ticks <= 0) {
      this.robot.shield = SHIELD_TICKS
      this.banner = { text: 'SHIELD!', ticks: 60 }
      return
    }
    // A fresh cell keeps any train rolling but starts the bump chain over.
    this.chain = 0
    this.sleepyTimer = ticks
    this.sleepyFull = ticks
    for (const g of this.gremlins) if (g.state === 'roaming') g.sleepy = true
  }

  // --- the dock ---------------------------------------------------------------

  /** Docked gremlins step out in turn: after enough sparks, or after a quiet spell. */
  private release() {
    this.idleTicks++
    const next = this.gremlins
      .filter((g) => g.state === 'docked')
      .sort((a, b) => a.order - b.order)[0]
    if (!next) return
    const needed = this.row.release[this.released] ?? 0
    if (
      this.sparksSinceRelease >= needed ||
      this.idleTicks >= this.row.idleRelease
    ) {
      next.state = 'leaving'
      this.released++
      this.sparksSinceRelease = 0
      this.idleTicks = 0
    }
  }

  // --- the gremlins ------------------------------------------------------------

  private huntView(): HuntView {
    const r = this.robot
    const view: HuntView = {
      robot: { x: r.x, y: r.y, dir: r.dir },
      trail: (ticks) =>
        this.history[Math.max(0, this.history.length - 1 - ticks)]!,
      junctionAhead: () => this.junctionAlong(r.dir),
      junctionBehind: () => this.junctionAlong(opposite(r.dir)),
      cellNearRobot: () => {
        let best: Tile | null = null
        let bestD = Infinity
        for (const key of this.cells) {
          const [x, y] = key.split(',').map(Number) as [number, number]
          const d = Math.hypot(x - r.x, y - r.y)
          if (d < bestD) {
            bestD = d
            best = { x, y }
          }
        }
        return best
      },
      randomSpark: () => {
        if (!this.sparks.size) return null
        const pick = Math.floor(this.rng() * this.sparks.size)
        let i = 0
        for (const key of this.sparks) {
          if (i++ === pick) {
            const [x, y] = key.split(',').map(Number) as [number, number]
            return { x, y }
          }
        }
        return null
      },
      chomping: r.eatDrag > 0,
      overclock: this.overclock(),
    }
    return view
  }

  private target(g: Gremlin, view: HuntView): Tile {
    if (g.state === 'eyes') return this.maze.dockExit
    const relentless = g.kind === 'chaser' && view.overclock === 2
    if (!this.chasing && !relentless) return g.corner
    return HUNTERS[g.kind].hunt(g, view)
  }

  private inTunnel(g: { x: number; y: number }) {
    const y = Math.round(g.y)
    if (!this.maze.tunnelRows.includes(y)) return false
    return this.maze.rows[y]?.[this.wrapX(Math.round(g.x))] === ' '
  }

  private gremlinSpeed(g: Gremlin): number {
    if (g.state === 'eyes') return g.friendly ? FRIEND_HOME_SPEED : EYES_SPEED
    const r = this.row
    if (this.inTunnel(g)) return BASE_SPEED * r.tunnel
    if (g.sleepy) return BASE_SPEED * r.sleepyGremlin
    const boost = g.kind === 'chaser' ? OVERCLOCK_BOOST[this.overclock()] : 1
    return BASE_SPEED * r.gremlin * boost
  }

  private moveGremlin(g: Gremlin, view: HuntView) {
    if (g.state === 'friend') return
    if (g.state === 'docked') {
      // Bob in the dock until released.
      g.y = g.pad.y + Math.sin((this.tick + g.pad.x * 20) / 10) * 0.15
      return
    }
    const home = this.maze.dockHome
    if (g.state === 'leaving') {
      const speed = 0.06
      if (Math.abs(g.x - home.x) > speed) {
        g.x += Math.sign(home.x - g.x) * speed
        g.y = home.y
      } else {
        g.x = home.x
        g.y -= speed
        if (g.y <= this.maze.dockExit.y) {
          g.y = this.maze.dockExit.y
          g.state = 'roaming'
          g.dir = this.rng() < 0.5 ? LEFT : RIGHT
          g.sleepy = false
          g.friendly = false
        }
      }
      return
    }

    const speed = this.gremlinSpeed(g)
    if (this.atCentre(g)) this.chooseTurn(g, view)
    if (this.step(g, g.dir, speed)) {
      this.snap(g)
      const exit = this.maze.dockExit
      if (g.state === 'eyes' && g.x === exit.x && g.y === exit.y) {
        g.state = 'leaving'
        g.x = home.x
        g.y = home.y
        g.sleepy = false
      }
    }
  }

  /** Advance an actor along `dir` by `speed` tiles; returns true when it reached a tile centre. */
  private step(
    actor: { x: number; y: number },
    dir: Dir,
    speed: number,
  ): boolean {
    const cx = Math.round(actor.x)
    const cy = Math.round(actor.y)
    const before = dir.x ? actor.x - cx : actor.y - cy
    actor.x += dir.x * speed
    actor.y += dir.y * speed
    const cols = this.maze.cols
    if (actor.x < -0.5) actor.x += cols
    if (actor.x > cols - 0.5) actor.x -= cols
    const after = dir.x
      ? actor.x - Math.round(actor.x)
      : actor.y - Math.round(actor.y)
    const crossed =
      (before < 0 && after >= 0) ||
      (before > 0 && after <= 0) ||
      Math.abs(after) < 1e-6
    return crossed && Math.abs(after) < speed + 1e-6
  }

  private snap(actor: { x: number; y: number }) {
    actor.x = Math.round(actor.x)
    actor.y = Math.round(actor.y)
    if (actor.x >= this.maze.cols) actor.x -= this.maze.cols
  }

  private atCentre(actor: { x: number; y: number }) {
    return (
      Math.abs(actor.x - Math.round(actor.x)) < 1e-6 &&
      Math.abs(actor.y - Math.round(actor.y)) < 1e-6
    )
  }

  private chooseTurn(g: Gremlin, view: HuntView) {
    const options = DIRS.filter(
      (d) =>
        !sameDir(d, opposite(g.dir)) &&
        this.canMove(g.x, g.y, d, g.state === 'eyes'),
    )
    if (!options.length) {
      g.dir = opposite(g.dir)
      return
    }
    if (g.sleepy && g.state === 'roaming') {
      // Sleepwalking: mostly away from the robot, now and then any which way.
      if (this.rng() < 0.35) {
        g.dir = options[Math.floor(this.rng() * options.length)]!
        return
      }
      const r = this.robot
      let best = options[0]!
      let far = -Infinity
      for (const d of options) {
        const away = Math.hypot(g.x + d.x - r.x, g.y + d.y - r.y)
        if (away > far + 1e-9) {
          far = away
          best = d
        }
      }
      g.dir = best
      return
    }
    const target = this.target(g, view)
    let best = options[0]!
    let bestDistance = Infinity
    for (const d of options) {
      const distance = Math.hypot(g.x + d.x - target.x, g.y + d.y - target.y)
      if (distance < bestDistance - 1e-9) {
        bestDistance = distance
        best = d
      }
    }
    g.dir = best
  }

  // --- the Friend Train ------------------------------------------------------------

  /** Friends ride the robot's trail a tile apart, hopping into place, eating what they pass. */
  private moveTrain() {
    this.train.forEach((g, i) => {
      const spot = this.trailPoint((i + 1) * TRAIL_SPACING)
      if (g.hop) {
        g.hop.t++
        const p = Math.min(1, g.hop.t / HOP_TICKS)
        g.x = g.hop.x + (spot.x - g.hop.x) * p
        g.y = g.hop.y + (spot.y - g.hop.y) * p
        if (p >= 1) g.hop = null
        return
      }
      g.dir = { x: Math.sign(spot.x - g.x), y: Math.sign(spot.y - g.y) }
      g.x = spot.x
      g.y = spot.y
      const key = this.key(g.x, g.y)
      if (this.sparks.delete(key)) {
        this.chomp(g.x, g.y)
        this.sparksSinceRelease++
      }
    })
  }

  /** The cell ran down (or the maze is charged): the train pays and the friends stroll home. */
  private endTrain(pays: boolean) {
    const length = this.train.length
    if (!length) return
    if (pays) {
      const points = trainPayout(length)
      this.addScore(points)
      this.floaters.push({
        x: this.robot.x,
        y: this.robot.y - 1,
        text: `TRAIN x${length} ${points}`,
        life: 100,
      })
      if (length >= 4) this.banner = { text: 'FULL TRAIN!', ticks: 90 }
      this.sound.play('extra')
    }
    for (const g of this.train) {
      g.state = 'eyes'
      g.friendly = true
      g.hop = null
      g.x = this.wrapX(Math.round(g.x))
      g.y = Math.round(g.y)
      if (this.isWall(g.x, g.y)) {
        g.x = this.wrapX(Math.round(this.robot.x))
        g.y = Math.round(this.robot.y)
      }
      g.dir = UP
      this.sparkle(g.x, g.y, 8, [RAMPS.teal[3], RAMPS.gold[4], '#ffffff'], 1.2)
    }
    this.train = []
  }

  private collide() {
    const r = this.robot
    const cols = this.maze.cols
    for (const g of this.gremlins) {
      if (g.state !== 'roaming') continue
      const dx = Math.abs(g.x - r.x)
      const wrapDx = Math.min(dx, cols - dx)
      if (wrapDx >= 0.6 || Math.abs(g.y - r.y) >= 0.6) continue
      if (g.sleepy) {
        this.chain++
        this.addScore(bumpPoints(this.chain), g.x, g.y)
        g.state = 'friend'
        g.sleepy = false
        g.hop = { x: g.x, y: g.y, t: 0 }
        this.train.push(g)
        this.sparkle(g.x, g.y, 16, [
          GREMLIN_LOOKS[g.kind].ramp[3],
          RAMPS.teal[3],
          '#ffffff',
        ])
        this.sound.play('pop')
        this.pause = 20
        return
      }
      if (r.shield > 0) {
        // The shield bounces it: it turns round if it was coming on.
        if ((r.x - g.x) * g.dir.x + (r.y - g.y) * g.dir.y > 0)
          g.dir = opposite(g.dir)
        continue
      }
      this.lives--
      this.dying = 110
      this.prize = null
      this.endTrain(false)
      this.sound.play('die')
      return
    }
  }

  // --- roaming prizes ----------------------------------------------------------

  /** Twice a maze a prize rolls in from a tunnel (or the dock) and wanders about. */
  private rollPrize() {
    if (this.prizesRolled >= PRIZE_AT.length || this.prize) return
    if (this.eaten < PRIZE_AT[this.prizesRolled]! * this.totalSparks) return
    this.prizesRolled++
    const m = this.maze
    const kind = prizeFor(this.heat)
    if (m.tunnelRows.length) {
      const y = m.tunnelRows[Math.floor(this.rng() * m.tunnelRows.length)]!
      const fromLeft = this.rng() < 0.5
      this.prize = {
        kind,
        x: fromLeft ? 0 : m.cols - 1,
        y,
        dir: fromLeft ? RIGHT : LEFT,
        t: 0,
      }
    } else {
      this.prize = {
        kind,
        x: m.dockExit.x,
        y: m.dockExit.y,
        dir: this.rng() < 0.5 ? LEFT : RIGHT,
        t: 0,
      }
    }
  }

  private movePrize() {
    const p = this.prize
    if (!p) return
    p.t++
    const m = this.maze
    const leaving = p.t > PRIZE_WANDER_TICKS
    if (p.t > PRIZE_WANDER_TICKS + 60 * 8) {
      this.prize = null
      return
    }
    if (this.atCentre(p)) {
      const x = this.wrapX(Math.round(p.x))
      const y = Math.round(p.y)
      if (
        leaving &&
        m.tunnelRows.includes(y) &&
        (x === 0 || x === m.cols - 1)
      ) {
        this.prize = null
        return
      }
      const options = DIRS.filter(
        (d) => !sameDir(d, opposite(p.dir)) && this.canMove(x, y, d),
      )
      if (!options.length) p.dir = opposite(p.dir)
      else if (!leaving || !m.tunnelRows.length)
        p.dir = options[Math.floor(this.rng() * options.length)]!
      else {
        // Head for the nearest tunnel mouth.
        let best = options[0]!
        let bestD = Infinity
        for (const d of options) {
          for (const ty of m.tunnelRows) {
            for (const tx of [-1, m.cols]) {
              const dd = Math.hypot(x + d.x - tx, y + d.y - ty)
              if (dd < bestD - 1e-9) {
                bestD = dd
                best = d
              }
            }
          }
        }
        p.dir = best
      }
    }
    if (this.step(p, p.dir, PRIZE_SPEED)) this.snap(p)
    const r = this.robot
    const dx = Math.abs(p.x - r.x)
    if (Math.min(dx, m.cols - dx) < 0.75 && Math.abs(p.y - r.y) < 0.75) {
      const prize = PRIZES[p.kind]!
      this.addScore(prize.points, p.x, p.y)
      this.sparkle(p.x, p.y, 18, undefined, 2)
      this.sound.play('extra')
      this.prize = null
    }
  }

  /** A cosmetic sparkle burst at tile (tx, ty). */
  private sparkle(
    tx: number,
    ty: number,
    count: number,
    colours?: readonly string[],
    speed = 1.6,
  ) {
    const x = tx * TILE + TILE / 2
    const y = TOP + ty * TILE + TILE / 2
    this.fx.burst(
      x,
      y,
      this.fxRng,
      colours ? { count, colours, speed } : { count, speed },
    )
  }

  private addScore(points: number, x?: number, y?: number) {
    if (this.demo) return
    this.score += points
    if (x !== undefined && y !== undefined) {
      this.floaters.push({ x, y, text: String(points), life: 70 })
    }
    if (this.score >= this.nextExtra) {
      this.lives++
      this.nextExtra += EXTRA_LIFE_AT * 2
      this.sound.play('extra')
      this.sparkle(this.robot.x, this.robot.y, 20, ROBOT_SPARKS, 2.2)
      this.banner = { text: 'EXTRA ROBOT!', ticks: 90 }
    }
  }

  // --- attract-mode pilot --------------------------------------------------------

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
    const cols = this.maze.cols
    const r = this.robot
    const sx = this.wrapX(Math.round(r.x))
    const sy = Math.round(r.y)
    const danger = new Set<string>()
    let nearest = Infinity
    const hunters = this.gremlins.filter(
      (g) => g.state === 'roaming' && !g.sleepy,
    )
    if (r.shield <= 0) {
      for (const g of hunters) {
        const gx = Math.round(g.x)
        const gy = Math.round(g.y)
        nearest = Math.min(nearest, Math.abs(gx - sx) + Math.abs(gy - sy))
        for (let dx = -2; dx <= 2; dx++) {
          for (let dy = -2; dy <= 2; dy++) {
            if (Math.abs(dx) + Math.abs(dy) <= 2) {
              danger.add(`${this.wrapX(gx + dx)},${gy + dy}`)
            }
          }
        }
      }
    }
    // Standing on a switch with a hunter close: throw it.
    if (
      nearest <= 4 &&
      this.flips > 0 &&
      this.maze.switches.some((s) => s.x === sx && s.y === sy)
    ) {
      held.a = true
      frame.pressed.a = true
    }
    const prizeKey = this.prize ? this.key(this.prize.x, this.prize.y) : ''
    const isGoal = (key: string) =>
      this.sparks.has(key) ||
      this.cells.has(key) ||
      key === prizeKey ||
      this.gremlins.some(
        (g) => g.sleepy && g.state === 'roaming' && this.key(g.x, g.y) === key,
      )
    // Breadth-first search to the nearest goal that avoids danger.
    const startKey = `${sx},${sy}`
    const firstStep = new Map<string, Dir>([[startKey, NONE]])
    const queue: Array<[number, number]> = [[sx, sy]]
    let chosen: Dir | null = null
    while (queue.length && !chosen) {
      const [x, y] = queue.shift()!
      for (const d of DIRS) {
        const nx = (x + d.x + cols) % cols
        const ny = y + d.y
        const key = `${nx},${ny}`
        if (firstStep.has(key) || !this.canMove(x, y, d)) continue
        if (danger.has(key)) continue
        const first = firstStep.get(`${x},${y}`)!
        const step = sameDir(first, NONE) ? d : first
        firstStep.set(key, step)
        if (isGoal(key)) {
          chosen = step
          break
        }
        queue.push([nx, ny])
      }
    }
    const dir = chosen ?? this.fleeDir()
    if (sameDir(dir, UP)) held.up = true
    else if (sameDir(dir, DOWN)) held.down = true
    else if (sameDir(dir, LEFT)) held.left = true
    else if (sameDir(dir, RIGHT)) held.right = true
    return frame
  }

  private fleeDir(): Dir {
    const r = this.robot
    let best = r.dir
    let bestScore = -Infinity
    for (const d of DIRS) {
      if (!this.canMove(r.x, r.y, d)) continue
      const nx = Math.round(r.x) + d.x
      const ny = Math.round(r.y) + d.y
      const nearest = Math.min(
        ...this.gremlins
          .filter((g) => g.state === 'roaming' && !g.sleepy)
          .map((g) => Math.hypot(g.x - nx, g.y - ny)),
      )
      if (nearest > bestScore) {
        bestScore = nearest
        best = d
      }
    }
    return best
  }

  // --- render ----------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    if (this.intermission > 0) {
      this.renderIntermission(g)
      this.fx.render(g)
      vignette(g, W, H, 0.3)
      this.renderHud(g)
      return
    }
    const flash = this.clearing > 0 && Math.floor(this.clearing / 12) % 2 === 0
    const themeIndex = (this.level - 1) % WALL_THEMES.length
    const theme = flash ? FLASH_THEME : WALL_THEMES[themeIndex]!
    cachedLayer(
      g,
      `battery-maze-${this.maze.id}-${flash ? 'flash' : themeIndex}`,
      W,
      H,
      (k) => paintBoard(k, theme, this.maze),
    )
    this.renderGates(g, theme.neon)
    this.renderSparks(g)
    this.renderCells(g)
    if (this.prize) this.renderPrize(g, this.prize)
    if (!(this.dying > 0 && this.dying < 70)) {
      for (const gremlin of this.gremlins)
        if (gremlin.state !== 'friend') this.renderGremlin(g, gremlin)
      for (let i = this.train.length - 1; i >= 0; i--)
        this.renderGremlin(g, this.train[i]!)
    }
    this.renderRobot(g)
    this.fx.render(g)
    for (const f of this.floaters) {
      drawText(g, f.text, f.x * TILE + TILE / 2, TOP + f.y * TILE, {
        align: 'center',
        color: RAMPS.teal[3],
        outline: INK,
      })
    }
    vignette(g, W, H, 0.28)
    this.renderHud(g)
  }

  private renderGates(g: CanvasRenderingContext2D, neon: string) {
    this.maze.switches.forEach((s, i) => {
      for (const gate of s.gates)
        drawGate(
          g,
          this.maze,
          gate,
          this.shut.has(`${gate.x},${gate.y}`),
          this.tick,
          neon,
        )
      drawSwitch(g, s, this.switchState[i]!, this.flips > 0, this.tick)
    })
  }

  /** The sparks are live (they get eaten): a baked glow under each, and a twinkle now and then. */
  private renderSparks(g: CanvasRenderingContext2D) {
    const spots: Array<[number, number, boolean]> = []
    for (const key of this.sparks) {
      const [x, y] = key.split(',').map(Number) as [number, number]
      const twinkle = (x * 7 + y * 13 + Math.floor(this.tick / 5)) % 29 === 0
      spots.push([x * TILE + TILE / 2, TOP + y * TILE + TILE / 2, twinkle])
    }
    const stamp = glowStamp(RAMPS.gold[3], 5, 0.3)
    if (stamp) {
      g.save()
      g.globalCompositeOperation = 'lighter'
      g.imageSmoothingEnabled = true
      for (const [x, y] of spots) g.drawImage(stamp, x - 5, y - 5, 10, 10)
      g.restore()
    }
    for (const [x, y, twinkle] of spots) {
      drawSprite(g, twinkle ? SPARK_TWINKLE : SPARK_SPRITE, x, y)
    }
  }

  /** Power cells pulse with a green glow; the bolt blinks between charged and dim. */
  private renderCells(g: CanvasRenderingContext2D) {
    const lit = Math.floor(this.tick / 15) % 2 === 0 || this.pause > 0
    const pulse = 0.5 + 0.5 * Math.sin(this.tick / 7)
    const shield = this.row.sleepyTicks <= 0
    for (const key of this.cells) {
      const [x, y] = key.split(',').map(Number) as [number, number]
      const cx = x * TILE + TILE / 2
      const cy = TOP + y * TILE + TILE / 2
      glow(
        g,
        cx,
        cy,
        9 + pulse * 5,
        shield ? RAMPS.sky[3] : RAMPS.leaf[3],
        0.3 + 0.35 * pulse,
      )
      drawSprite(g, CELL_SPRITES[lit ? 0 : 1], cx, cy)
    }
  }

  /** A roaming prize bobs along, blinking as it gets ready to leave. */
  private renderPrize(g: CanvasRenderingContext2D, p: RoamingPrize) {
    if (p.t > PRIZE_WANDER_TICKS + 60 * 6 && Math.floor(p.t / 6) % 2 === 0)
      return
    const sprite = PRIZE_SPRITES[p.kind]!
    const cx = p.x * TILE + TILE / 2
    const cy = TOP + p.y * TILE + TILE / 2
    const bob = Math.round(Math.sin(this.tick / 5) * 1.5)
    glow(
      g,
      cx,
      cy,
      12 + Math.sin(this.tick / 6) * 2,
      PRIZES[p.kind]!.color,
      0.5,
    )
    dropShadow(g, cx, cy + 7, 5, 1.5, 0.4)
    drawSprite(g, sprite, cx, cy - 1 + bob, { flipX: p.dir.x < 0 })
  }

  /** The robot sprite for a facing and mouth phase, centred on its body at (cx, cy). */
  private drawRobot(
    g: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    dir: Dir,
    mouth: number,
    scale = 1,
  ) {
    const open = 0.15 + Math.abs(Math.sin(mouth)) * 0.55
    const frame = open < 0.3 ? 0 : open < 0.52 ? 1 : 2
    const face: Face = dir.y < 0 ? 'up' : dir.y > 0 ? 'down' : 'side'
    drawSprite(g, ROBOT_FRAMES[face][frame]!, cx, cy - 1.5 * scale, {
      flipX: dir.x < 0,
      scale,
    })
  }

  private renderRobot(g: CanvasRenderingContext2D) {
    const r = this.robot
    const cx = r.x * TILE + TILE / 2
    const cy = TOP + r.y * TILE + TILE / 2
    if (this.dying > 0) {
      if (this.dying <= 30) return
      const p = 1 - (this.dying - 30) / 80
      if (p < 0.15) {
        this.drawRobot(g, cx, cy, r.dir, 0)
        return
      }
      const i = Math.min(
        ROBOT_DEATH.length - 1,
        Math.floor(((p - 0.15) / 0.85) * ROBOT_DEATH.length),
      )
      glow(g, cx, cy, 10 + p * 8, RAMPS.teal[3], 0.5 * (1 - p))
      drawSprite(g, ROBOT_DEATH[i]!, cx, cy - 1.5)
      return
    }
    glow(g, cx, cy, 11, RAMPS.teal[3], 0.22)
    dropShadow(g, cx + 1, cy + 7, 5, 1.6, 0.4)
    this.drawRobot(g, cx, cy, r.dir, r.mouth)
    if (r.shield > 0 && (r.shield > 40 || Math.floor(r.shield / 5) % 2 === 0)) {
      glow(g, cx, cy, 15, RAMPS.sky[3], 0.45)
      g.strokeStyle = RAMPS.sky[4]
      g.lineWidth = 1
      g.beginPath()
      g.arc(cx, cy, 10, 0, Math.PI * 2)
      g.stroke()
    }
  }

  /**
   * A glitch gremlin sprite: its kind's colours and crest, eyes looking where it heads, feet
   * stepping. Sleepy gremlins go blue with droopy ears, shut eyes and a drifting z (flashing
   * white near the end); a rebooting gremlin is just its eyes over a faint ghost; a friend on
   * the train smiles. Each wears its hunting tell: the chaser's ears glow as it overclocks, the
   * flanker's antenna lights when it charges, the wanderer's "!" when it hears chomping.
   */
  private renderGremlin(
    g: CanvasRenderingContext2D,
    gremlin: Gremlin,
    scale = 1,
  ) {
    const cx = gremlin.x * TILE + TILE / 2
    const cy = TOP + gremlin.y * TILE + TILE / 2
    const art = GREMLIN_ART[gremlin.kind]
    const look = gremlin.dir
    const face: Face = look.y < 0 ? 'up' : look.y > 0 ? 'down' : 'side'
    const flipX = look.x < 0
    const step = Math.floor(this.tick / 6) % 2
    const y = cy - scale

    if (
      gremlin.state === 'friend' ||
      (gremlin.state === 'eyes' && gremlin.friendly)
    ) {
      const hop = gremlin.hop
        ? Math.sin((gremlin.hop.t / HOP_TICKS) * Math.PI) * 6
        : 0
      glow(g, cx, cy - hop, 10, RAMPS.teal[3], 0.35)
      dropShadow(g, cx, cy + 8 * scale, 6 * scale, 1.8 * scale, 0.35)
      drawSprite(g, art.friend[step]!, cx, y - hop, { flipX, scale })
      return
    }
    if (gremlin.state === 'eyes') {
      glow(g, cx, cy - 2, 8, RAMPS.sky[3], 0.35)
      drawSprite(g, art.normal.side[0], cx, y, { flipX, scale, alpha: 0.18 })
      drawSprite(g, EYES_ONLY[face], cx, y, {
        flipX: flipX && face === 'side',
        scale,
      })
      return
    }
    const flashing =
      gremlin.sleepy &&
      this.sleepyTimer < 120 &&
      Math.floor(this.sleepyTimer / 12) % 2 === 0
    const sprite = gremlin.sleepy
      ? (flashing ? art.flash : art.sleepy)[step]!
      : art.normal[face][step]!
    dropShadow(g, cx, cy + 8 * scale, 6 * scale, 1.8 * scale, 0.4)
    if (!gremlin.sleepy && gremlin.state === 'roaming')
      this.renderTell(g, gremlin, cx, cy)
    drawSprite(g, sprite, cx, y, { flipX, scale })
    if (gremlin.sleepy) {
      const drift = (this.tick % 40) / 40
      drawSprite(
        g,
        SLEEP_Z,
        cx + (7 + drift * 3) * scale,
        cy - (10 + drift * 5) * scale,
        { scale, alpha: 1 - drift * 0.7 },
      )
    } else if (gremlin.kind === 'wanderer' && gremlin.mind.curious > 0) {
      drawText(g, '!', cx + 6, cy - 16, { color: RAMPS.gold[4], outline: INK })
    }
  }

  private renderTell(
    g: CanvasRenderingContext2D,
    gremlin: Gremlin,
    cx: number,
    cy: number,
  ) {
    if (gremlin.kind === 'chaser') {
      const stage = this.overclock()
      if (!stage) return
      const flick = 0.5 + 0.3 * Math.sin(this.tick / 3)
      const hot = stage === 2 ? RAMPS.ember[2] : RAMPS.ember[3]
      glow(g, cx - 6, cy - 8, 6 + stage * 2, hot, flick)
      glow(g, cx + 6, cy - 8, 6 + stage * 2, hot, flick)
    } else if (gremlin.kind === 'flanker' && gremlin.mind.charging) {
      glow(
        g,
        cx,
        cy - 10,
        7,
        RAMPS.ember[2],
        0.6 + 0.3 * Math.sin(this.tick / 2),
      )
    }
  }

  private renderIntermission(g: CanvasRenderingContext2D) {
    cachedLayer(g, 'battery-maze-break', W, H, paintBreak)
    drawStars(g, BREAK_STARS, this.tick)
    const t = 300 - this.intermission
    const half = t < 150
    const laneY = TOP + 9 * TILE + TILE / 2
    hudPanel(g, W / 2 - 84, TOP + 32, 168, 26, RAMPS.purple)
    drawText(g, 'COFFEE BREAK', W / 2, TOP + 38, {
      scale: 2,
      align: 'center',
      color: RAMPS.gold[3],
      outline: INK,
    })
    const chaser = this.gremlins[0]!
    if (half) {
      const x = W + 20 - t * 2.4
      dropShadow(g, x + 1, laneY + 7, 5, 1.6, 0.4)
      this.drawRobot(g, x, laneY, LEFT, t / 4)
      this.renderGremlin(g, {
        ...chaser,
        x: (x + 30 - TILE / 2) / TILE,
        y: 9,
        dir: LEFT,
        sleepy: false,
        state: 'docked',
      })
    } else {
      const x = -20 + (t - 150) * 2.4
      this.renderGremlin(g, {
        ...chaser,
        x: (x - TILE / 2) / TILE,
        y: 9,
        dir: RIGHT,
        sleepy: true,
        state: 'roaming',
      })
      const bigY = laneY + TILE / 2 - 13
      glow(g, x - 34, bigY, 30, RAMPS.teal[3], 0.3)
      dropShadow(g, x - 34, laneY + 8, 18, 3, 0.4)
      this.drawRobot(g, x - 34, bigY, RIGHT, t / 4, 3)
    }
  }

  private renderHud(g: CanvasRenderingContext2D) {
    // Score and high score in framed boxes along the top.
    const score = String(this.score).padStart(6, '0')
    const scoreW = measureText(score, 2) + 12
    hudPanel(g, 3, 2, scoreW, 20)
    drawText(g, score, 9, 5, {
      scale: 2,
      color: RAMPS.teal[3],
      outline: INK,
    })
    const hi = `HI ${Math.max(this.hiScore, this.score)}`
    const hiW = measureText(hi, 2) + 12
    hudPanel(g, W - 3 - hiW, 2, hiW, 20)
    drawText(g, hi, W - 9, 5, {
      scale: 2,
      align: 'right',
      color: RAMPS.gold[3],
      outline: INK,
    })
    // Between them: the Friend Train while it rolls, else the Rewire flips left.
    const midL = 3 + scoreW + 6
    const midR = W - 3 - hiW - 6
    if (this.intermission <= 0 && midR - midL >= 60) {
      if (this.train.length) {
        const text = `TRAIN x${this.train.length}`
        const w = measureText(text) + 12
        hudPanel(g, (midL + midR - w) / 2, 5, w, 15, RAMPS.teal)
        drawText(g, text, (midL + midR) / 2, 9, {
          align: 'center',
          color: RAMPS.teal[4],
          outline: INK,
        })
      } else if (this.maze.switches.length) {
        const w = 76
        const x = (midL + midR - w) / 2
        hudPanel(g, x, 5, w, 15)
        drawText(g, 'FLIPS', x + 6, 9, { color: RAMPS.gold[4], outline: INK })
        for (let i = 0; i < REWIRE_FLIPS; i++) {
          const on = i < this.flips
          g.fillStyle = INK
          g.fillRect(x + 46 + i * 9, 8, 7, 9)
          g.fillStyle = on ? RAMPS.gold[3] : RAMPS.steel[1]
          g.fillRect(x + 47 + i * 9, 9, 5, 7)
          if (on) {
            g.fillStyle = RAMPS.gold[4]
            g.fillRect(x + 47 + i * 9, 9, 2, 2)
          }
        }
      }
    }

    // Along the bottom: spare robots, the maze's charge (or the sleepy timer), and the level.
    const panelY = TOP + this.maze.height * TILE + 4
    const textY = panelY + 4
    const lives = Math.min(this.lives, 5)
    if (lives > 0) {
      hudPanel(g, 3, panelY, lives * 12 + 6, 15)
      for (let i = 0; i < lives; i++) {
        drawSprite(g, LIFE_SPRITE, 12 + i * 12, panelY + 7)
      }
    }
    const level = `LEVEL ${this.level}`
    const levelW = measureText(level) + 12
    hudPanel(g, W - 3 - levelW, panelY, levelW, 15)
    drawText(g, level, W - 9, textY, {
      align: 'right',
      color: RAMPS.purple[3],
      outline: INK,
    })
    const left = 76
    const right = W - 3 - levelW - 6
    if (right - left > 80) {
      hudPanel(g, left, panelY, right - left, 15)
      const sleepy = this.sleepyTimer > 0
      const shield = this.robot.shield > 0
      const total = this.totalSparks || 1
      const amount = shield
        ? this.robot.shield / SHIELD_TICKS
        : sleepy
          ? this.sleepyTimer / Math.max(1, this.sleepyFull)
          : (total - this.sparks.size - this.cells.size) / total
      const label = shield ? 'SHIELD' : sleepy ? 'SLEEPY' : 'CHARGE'
      drawText(g, label, left + 6, textY, {
        color: shield || sleepy ? RAMPS.sky[4] : RAMPS.gold[4],
        outline: INK,
      })
      gauge(
        g,
        left + 48,
        textY,
        right - left - 54,
        7,
        amount,
        shield || sleepy ? RAMPS.sky : RAMPS.gold,
      )
    }

    if (this.banner) {
      const y = TOP + 12.5 * TILE
      drawText(g, this.banner.text, W / 2, y, {
        scale: 2,
        align: 'center',
        color: RAMPS.gold[4],
        outline: INK,
        shadow: RAMPS.pink[1],
      })
      if (this.banner.sub) {
        drawText(g, this.banner.sub, W / 2, y + 18, {
          align: 'center',
          color: RAMPS.teal[3],
          outline: INK,
        })
      }
    }
  }
}

const batteryMaze: ArcadeGameModule = {
  create: (options) => new BatteryMaze(options),
}

export const MAZE_SIZE = { width: W, height: H }
export const create = batteryMaze.create
export default batteryMaze
