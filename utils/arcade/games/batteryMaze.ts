// /utils/arcade/games/batteryMaze.ts
//
// Battery Maze -- the Kind Robots Arcade's maze-chase riff (conductor
// kr-arcade/t-006). A little cat-eared robot gathers energy sparks through an
// original maze while four glitch gremlins, each with its own way of hunting,
// chase it. A power cell makes them sleepy and blue for a while; bumping one
// then reboots it and sends its eyes home to the charging dock.

import { everyNthLevel, levelCurve } from '../curve'
import { drawText } from '../font'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'

// '#' wall, '.' spark, 'o' power cell, '-' dock door (gremlins only),
// 'G' charging dock, 'P' robot start, ' ' empty (row 9 wraps as a tunnel).
export const BATTERY_MAZE = [
  '#######################',
  '#..........#..........#',
  '#o###.####.#.####.###o#',
  '#.....................#',
  '#.###.#.#######.#.###.#',
  '#.....#....#....#.....#',
  '#####.####.#.####.#####',
  '#####.#.........#.#####',
  '#####.#.###-###.#.#####',
  '     ...#GGGGG#...     ',
  '#####.#.#######.#.#####',
  '#####.#....P....#.#####',
  '#####.#.#######.#.#####',
  '#..........#..........#',
  '#.###.####.#.####.###.#',
  '#o..#.............#..o#',
  '###.#.#.#######.#.#.###',
  '#.....#....#....#.....#',
  '#.########.#.########.#',
  '#.....................#',
  '#######################',
]

const COLS = BATTERY_MAZE[0]!.length
const ROWS = BATTERY_MAZE.length
const TILE = 14
const TOP = 24
const W = COLS * TILE
const H = TOP + ROWS * TILE + 22

const DOOR = { x: 11, y: 8 }
const DOCK_EXIT = { x: 11, y: 7 }
const DOCK_HOME = { x: 11, y: 9 }
const START = { x: 11, y: 11 }
const BONUS_SPOT = { x: 11, y: 11 }
const TUNNEL_ROW = 9

const START_LIVES = 3
const EXTRA_LIFE_AT = 10_000

type Dir = { x: number; y: number }
const NONE: Dir = { x: 0, y: 0 }
const UP: Dir = { x: 0, y: -1 }
const DOWN: Dir = { x: 0, y: 1 }
const LEFT: Dir = { x: -1, y: 0 }
const RIGHT: Dir = { x: 1, y: 0 }
// Tie-break order when two turns score the same (classic: up, left, down, right).
const DIRS: Dir[] = [UP, LEFT, DOWN, RIGHT]

export const MAZE_CURVES = {
  robotSpeed: { start: 0.105, step: 0.006, limit: 0.135 },
  gremlinSpeed: { start: 0.095, step: 0.007, limit: 0.13 },
  sleepyTicks: { start: 420, step: -45, limit: 60 },
  releaseEvery: { start: 240, step: -20, limit: 90 },
} as const

const BONUSES = [
  { name: 'GEAR', points: 100, color: '#cbd5e1' },
  { name: 'OIL CAN', points: 300, color: '#fbbf24' },
  { name: 'FLOWER', points: 500, color: '#f472b6' },
  { name: 'BOLT', points: 700, color: '#facc15' },
  { name: 'STAR', points: 1000, color: '#fde68a' },
  { name: 'HEART', points: 2000, color: '#fb7185' },
  { name: 'RAINBOW', points: 3000, color: '#a78bfa' },
  { name: 'CROWN', points: 5000, color: '#fcd34d' },
]

// Scatter / chase schedule in ticks; after the last entry, chase forever.
const MODE_SCHEDULE = [420, 1200, 420, 1200, 300, 1200, 300]

type Personality = 'chaser' | 'ambusher' | 'flanker' | 'wanderer'
type GremlinState = 'docked' | 'leaving' | 'roaming' | 'eyes'

type Gremlin = {
  name: Personality
  color: string
  x: number
  y: number
  dir: Dir
  state: GremlinState
  sleepy: boolean
  corner: { x: number; y: number }
  releaseAt: number
}

function isWall(x: number, y: number): boolean {
  const row = BATTERY_MAZE[y]
  if (!row) return true
  const cell = row[((x % COLS) + COLS) % COLS]
  return cell === '#'
}

function sameDir(a: Dir, b: Dir) {
  return a.x === b.x && a.y === b.y
}

function opposite(d: Dir): Dir {
  return { x: -d.x, y: -d.y }
}

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
  private sparks = new Set<string>()
  private cells = new Set<string>()
  private totalSparks = 0
  private eaten = 0
  private robot = {
    x: START.x,
    y: START.y,
    dir: LEFT as Dir,
    want: LEFT as Dir,
    mouth: 0,
  }
  private gremlins: Gremlin[] = []
  private modeIndex = 0
  private modeTimer = MODE_SCHEDULE[0]!
  private chasing = false
  private sleepyTimer = 0
  private chain = 0
  private bonus: { kind: number; ticks: number } | null = null
  private bonusesShown = 0
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
  private banner: { text: string; ticks: number } | null = null

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.startLevel(1)
  }

  // --- setup ---------------------------------------------------------------

  private startLevel(level: number) {
    this.level = level
    this.sparks.clear()
    this.cells.clear()
    BATTERY_MAZE.forEach((row, y) => {
      for (let x = 0; x < COLS; x++) {
        if (row[x] === '.') this.sparks.add(`${x},${y}`)
        if (row[x] === 'o') this.cells.add(`${x},${y}`)
      }
    })
    this.totalSparks = this.sparks.size + this.cells.size
    this.eaten = 0
    this.bonusesShown = 0
    this.bonus = null
    this.resetActors()
    this.banner = { text: `LEVEL ${level}`, ticks: 120 }
  }

  private resetActors() {
    this.robot = { x: START.x, y: START.y, dir: LEFT, want: LEFT, mouth: 0 }
    const release = levelCurve(this.level, MAZE_CURVES.releaseEvery)
    const specs: Array<[Personality, string, { x: number; y: number }]> = [
      ['chaser', '#f472b6', { x: COLS - 2, y: -2 }],
      ['ambusher', '#fb923c', { x: 1, y: -2 }],
      ['flanker', '#22d3ee', { x: COLS - 1, y: ROWS + 1 }],
      ['wanderer', '#4ade80', { x: 0, y: ROWS + 1 }],
    ]
    this.gremlins = specs.map(([name, color, corner], i) => ({
      name,
      color,
      corner,
      x: i === 0 ? DOCK_EXIT.x : 9 + i,
      y: i === 0 ? DOCK_EXIT.y : DOCK_HOME.y,
      dir: LEFT,
      state: i === 0 ? 'roaming' : 'docked',
      sleepy: false,
      releaseAt: this.tick + Math.round(release * i),
    }))
    this.modeIndex = 0
    this.modeTimer = MODE_SCHEDULE[0]!
    this.chasing = false
    this.sleepyTimer = 0
    this.pause = 90
  }

  // --- update ----------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
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
      if (--this.clearing === 0) {
        if (everyNthLevel(this.level, 3)) this.intermission = 300
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

    this.updateModes()
    this.moveRobot()
    this.eat()
    for (const gremlin of this.gremlins) this.moveGremlin(gremlin)
    this.collide()
    if (this.bonus && --this.bonus.ticks <= 0) this.bonus = null

    if (this.sparks.size === 0 && this.cells.size === 0) {
      this.clearing = 120
      this.sound.play('level')
      this.banner = { text: 'MAZE CHARGED!', ticks: 120 }
    }
  }

  private updateModes() {
    if (this.sleepyTimer > 0) {
      this.sleepyTimer--
      if (this.sleepyTimer === 0) {
        for (const g of this.gremlins) g.sleepy = false
      }
      return
    }
    if (this.modeIndex >= MODE_SCHEDULE.length) return
    if (--this.modeTimer <= 0) {
      this.modeIndex++
      this.chasing = !this.chasing
      this.modeTimer = MODE_SCHEDULE[this.modeIndex] ?? Infinity
      for (const g of this.gremlins) {
        if (g.state === 'roaming') g.dir = opposite(g.dir)
      }
    }
  }

  private canMove(x: number, y: number, dir: Dir, allowDoor = false): boolean {
    const nx = Math.round(x) + dir.x
    const ny = Math.round(y) + dir.y
    if (!allowDoor && nx === DOOR.x && ny === DOOR.y) return false
    return !isWall(nx, ny)
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
    // Tunnel wrap.
    if (actor.x < -0.5) actor.x += COLS
    if (actor.x > COLS - 0.5) actor.x -= COLS
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
    if (actor.x >= COLS) actor.x -= COLS
  }

  private atCentre(actor: { x: number; y: number }) {
    return (
      Math.abs(actor.x - Math.round(actor.x)) < 1e-6 &&
      Math.abs(actor.y - Math.round(actor.y)) < 1e-6
    )
  }

  private moveRobot() {
    const robot = this.robot
    const speed = levelCurve(this.level, MAZE_CURVES.robotSpeed)
    // Reversing is allowed any time, like the classic.
    if (sameDir(robot.want, opposite(robot.dir))) robot.dir = robot.want
    if (this.atCentre(robot)) {
      if (this.canMove(robot.x, robot.y, robot.want)) robot.dir = robot.want
      if (!this.canMove(robot.x, robot.y, robot.dir)) {
        robot.mouth = 0.6
        return
      }
    }
    if (this.step(robot, robot.dir, speed)) {
      this.snap(robot)
    }
    robot.mouth = (robot.mouth + 0.12) % (Math.PI * 2)
  }

  private eat() {
    const key = `${Math.round(this.robot.x) % COLS},${Math.round(this.robot.y)}`
    if (this.sparks.delete(key)) {
      this.addScore(10)
      this.eaten++
      if (this.tick % 2 === 0) this.sound.play('blip')
    } else if (this.cells.delete(key)) {
      this.addScore(50)
      this.eaten++
      this.sound.play('pickup')
      this.chain = 0
      this.sleepyTimer = Math.round(
        levelCurve(this.level, MAZE_CURVES.sleepyTicks),
      )
      for (const g of this.gremlins) {
        if (g.state === 'roaming') {
          g.sleepy = true
          g.dir = opposite(g.dir)
        }
      }
    }
    if (
      this.bonusesShown < 2 &&
      this.eaten >= (this.bonusesShown === 0 ? 70 : 150)
    ) {
      this.bonusesShown++
      this.bonus = {
        kind: Math.min(this.level - 1, BONUSES.length - 1),
        ticks: 560,
      }
    }
    if (
      this.bonus &&
      Math.round(this.robot.x) === BONUS_SPOT.x &&
      Math.round(this.robot.y) === BONUS_SPOT.y
    ) {
      const prize = BONUSES[this.bonus.kind]!
      this.addScore(prize.points, BONUS_SPOT.x, BONUS_SPOT.y)
      this.sound.play('extra')
      this.bonus = null
    }
  }

  private target(g: Gremlin): { x: number; y: number } {
    if (g.state === 'eyes') return DOCK_EXIT
    if (!this.chasing) return g.corner
    const r = this.robot
    switch (g.name) {
      case 'chaser':
        return { x: r.x, y: r.y }
      case 'ambusher':
        return { x: r.x + r.dir.x * 4, y: r.y + r.dir.y * 4 }
      case 'flanker': {
        const chaser = this.gremlins[0]!
        const pivot = { x: r.x + r.dir.x * 2, y: r.y + r.dir.y * 2 }
        return { x: pivot.x * 2 - chaser.x, y: pivot.y * 2 - chaser.y }
      }
      case 'wanderer': {
        const d = Math.hypot(g.x - r.x, g.y - r.y)
        return d > 8 ? { x: r.x, y: r.y } : g.corner
      }
    }
  }

  private gremlinSpeed(g: Gremlin): number {
    const base = levelCurve(this.level, MAZE_CURVES.gremlinSpeed)
    if (g.state === 'eyes') return 0.25
    if (Math.round(g.y) === TUNNEL_ROW && (g.x < 5 || g.x > COLS - 6))
      return base * 0.5
    if (g.sleepy) return base * 0.6
    return base
  }

  private moveGremlin(g: Gremlin) {
    if (g.state === 'docked') {
      // Bob in the dock until released.
      g.y = DOCK_HOME.y + Math.sin((this.tick + g.x * 20) / 10) * 0.15
      if (this.tick >= g.releaseAt) {
        g.state = 'leaving'
        g.y = DOCK_HOME.y
      }
      return
    }
    if (g.state === 'leaving') {
      const speed = 0.06
      if (Math.abs(g.x - DOCK_HOME.x) > speed) {
        g.x += Math.sign(DOCK_HOME.x - g.x) * speed
      } else {
        g.x = DOCK_HOME.x
        g.y -= speed
        if (g.y <= DOCK_EXIT.y) {
          g.y = DOCK_EXIT.y
          g.state = 'roaming'
          g.dir = this.rng() < 0.5 ? LEFT : RIGHT
          g.sleepy = false
        }
      }
      return
    }

    const speed = this.gremlinSpeed(g)
    if (this.atCentre(g)) this.chooseTurn(g)
    if (this.step(g, g.dir, speed)) {
      this.snap(g)
      if (g.state === 'eyes' && g.x === DOCK_EXIT.x && g.y === DOCK_EXIT.y) {
        g.state = 'leaving'
        g.x = DOCK_HOME.x
        g.y = DOCK_HOME.y
        g.sleepy = false
      }
    }
  }

  private chooseTurn(g: Gremlin) {
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
      g.dir = options[Math.floor(this.rng() * options.length)]!
      return
    }
    const target = this.target(g)
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

  private collide() {
    const r = this.robot
    for (const g of this.gremlins) {
      if (g.state !== 'roaming') continue
      const dx = Math.abs(g.x - r.x)
      const wrapDx = Math.min(dx, COLS - dx)
      if (wrapDx < 0.6 && Math.abs(g.y - r.y) < 0.6) {
        if (g.sleepy) {
          this.chain++
          const points = 100 * 2 ** this.chain
          this.addScore(points, g.x, g.y)
          g.state = 'eyes'
          g.sleepy = false
          this.sound.play('pop')
          this.pause = 30
        } else {
          this.lives--
          this.dying = 110
          this.sound.play('die')
          return
        }
      }
    }
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
    const r = this.robot
    const sx = Math.round(r.x) % COLS
    const sy = Math.round(r.y)
    const danger = new Set<string>()
    for (const g of this.gremlins) {
      if (g.state !== 'roaming' || g.sleepy) continue
      const gx = Math.round(g.x)
      const gy = Math.round(g.y)
      for (let dx = -2; dx <= 2; dx++) {
        for (let dy = -2; dy <= 2; dy++) {
          if (Math.abs(dx) + Math.abs(dy) <= 2) {
            danger.add(`${(gx + dx + COLS) % COLS},${gy + dy}`)
          }
        }
      }
    }
    const isGoal = (key: string) =>
      this.sparks.has(key) ||
      this.cells.has(key) ||
      this.gremlins.some(
        (g) =>
          g.sleepy &&
          g.state === 'roaming' &&
          `${Math.round(g.x) % COLS},${Math.round(g.y)}` === key,
      )
    // Breadth-first search to the nearest goal that avoids danger.
    const startKey = `${sx},${sy}`
    const firstStep = new Map<string, Dir>([[startKey, NONE]])
    const queue: Array<[number, number]> = [[sx, sy]]
    let chosen: Dir | null = null
    while (queue.length && !chosen) {
      const [x, y] = queue.shift()!
      for (const d of DIRS) {
        const nx = (x + d.x + COLS) % COLS
        const ny = y + d.y
        const key = `${nx},${ny}`
        if (
          firstStep.has(key) ||
          isWall(nx, ny) ||
          (nx === DOOR.x && ny === DOOR.y)
        )
          continue
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
        ...this.gremlins.map((g) => Math.hypot(g.x - nx, g.y - ny)),
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
    g.fillStyle = '#0b0620'
    g.fillRect(0, 0, W, H)
    if (this.intermission > 0) {
      this.renderIntermission(g)
      this.renderHud(g)
      return
    }
    const flash = this.clearing > 0 && Math.floor(this.clearing / 12) % 2 === 0
    this.renderWalls(
      g,
      flash ? '#f5f3ff' : '#8b5cf6',
      flash ? '#fde68a' : '#22d3ee',
    )
    g.fillStyle = '#fde68a'
    for (const key of this.sparks) {
      const [x, y] = key.split(',').map(Number) as [number, number]
      g.fillRect(
        x * TILE + TILE / 2 - 1.5,
        TOP + y * TILE + TILE / 2 - 1.5,
        3,
        3,
      )
    }
    if (Math.floor(this.tick / 15) % 2 === 0 || this.pause > 0) {
      for (const key of this.cells) {
        const [x, y] = key.split(',').map(Number) as [number, number]
        this.renderBattery(g, x * TILE + TILE / 2, TOP + y * TILE + TILE / 2)
      }
    }
    // Dock door.
    g.fillStyle = '#f9a8d4'
    g.fillRect(DOOR.x * TILE, TOP + DOOR.y * TILE + TILE / 2 - 1, TILE, 2)
    if (this.bonus) this.renderBonus(g, this.bonus.kind)
    if (!(this.dying > 0 && this.dying < 70)) {
      for (const gremlin of this.gremlins) this.renderGremlin(g, gremlin)
    }
    this.renderRobot(g)
    for (const f of this.floaters) {
      drawText(g, f.text, f.x * TILE + TILE / 2, TOP + f.y * TILE, {
        align: 'center',
        color: '#22d3ee',
      })
    }
    this.renderHud(g)
  }

  private renderWalls(g: CanvasRenderingContext2D, edge: string, glow: string) {
    g.fillStyle = '#1e1b4b'
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (BATTERY_MAZE[y]![x] === '#')
          g.fillRect(x * TILE, TOP + y * TILE, TILE, TILE)
      }
    }
    // Neon outline wherever a wall meets an open tile.
    g.lineWidth = 2
    g.strokeStyle = edge
    g.beginPath()
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (BATTERY_MAZE[y]![x] !== '#') continue
        const px = x * TILE
        const py = TOP + y * TILE
        const open = (dx: number, dy: number) => {
          const row = BATTERY_MAZE[y + dy]
          return (
            row !== undefined &&
            x + dx >= 0 &&
            x + dx < COLS &&
            row[x + dx] !== '#'
          )
        }
        if (open(0, -1)) {
          g.moveTo(px, py + 1)
          g.lineTo(px + TILE, py + 1)
        }
        if (open(0, 1)) {
          g.moveTo(px, py + TILE - 1)
          g.lineTo(px + TILE, py + TILE - 1)
        }
        if (open(-1, 0)) {
          g.moveTo(px + 1, py)
          g.lineTo(px + 1, py + TILE)
        }
        if (open(1, 0)) {
          g.moveTo(px + TILE - 1, py)
          g.lineTo(px + TILE - 1, py + TILE)
        }
      }
    }
    g.stroke()
    g.strokeStyle = glow
    g.globalAlpha = 0.25
    g.lineWidth = 4
    g.stroke()
    g.globalAlpha = 1
  }

  private renderBattery(g: CanvasRenderingContext2D, cx: number, cy: number) {
    g.fillStyle = '#4ade80'
    g.fillRect(cx - 3, cy - 5, 6, 10)
    g.fillRect(cx - 1.5, cy - 7, 3, 2)
    g.fillStyle = '#0b0620'
    g.fillRect(cx - 2, cy - 4, 4, 2)
    g.fillStyle = '#fde68a'
    g.fillRect(cx - 1, cy - 1, 2, 4)
  }

  private renderBonus(g: CanvasRenderingContext2D, kind: number) {
    const prize = BONUSES[kind]!
    const cx = BONUS_SPOT.x * TILE + TILE / 2
    const cy = TOP + BONUS_SPOT.y * TILE + TILE / 2
    const pulse = 5 + Math.sin(this.tick / 6)
    g.fillStyle = prize.color
    g.beginPath()
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2
      const radius = i % 2 ? pulse * 0.5 : pulse
      g.lineTo(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius)
    }
    g.closePath()
    g.fill()
  }

  private renderRobot(g: CanvasRenderingContext2D) {
    const r = this.robot
    const cx = r.x * TILE + TILE / 2
    const cy = TOP + r.y * TILE + TILE / 2
    const dying = this.dying > 0 ? Math.max(0, (this.dying - 30) / 80) : 1
    if (dying <= 0) return
    const radius = 6 * dying
    g.save()
    g.translate(cx, cy)
    const angle = Math.atan2(r.dir.y, r.dir.x)
    // Cat ears (from the logo) stay upright.
    g.fillStyle = '#14b8a6'
    g.beginPath()
    g.moveTo(-5 * dying, -3 * dying)
    g.lineTo(-4 * dying, -9 * dying)
    g.lineTo(-1 * dying, -5 * dying)
    g.moveTo(5 * dying, -3 * dying)
    g.lineTo(4 * dying, -9 * dying)
    g.lineTo(1 * dying, -5 * dying)
    g.fill()
    g.rotate(angle)
    const open =
      this.dying > 0 ? 0.2 : 0.15 + Math.abs(Math.sin(r.mouth)) * 0.55
    g.fillStyle = '#2dd4bf'
    g.beginPath()
    g.moveTo(0, 0)
    g.arc(0, 0, radius, open, Math.PI * 2 - open)
    g.closePath()
    g.fill()
    g.fillStyle = '#fde68a'
    g.beginPath()
    g.arc(-1, -3 * dying, 1.5 * dying, 0, Math.PI * 2)
    g.fill()
    g.restore()
  }

  private renderGremlin(g: CanvasRenderingContext2D, gremlin: Gremlin) {
    const cx = gremlin.x * TILE + TILE / 2
    const cy = TOP + gremlin.y * TILE + TILE / 2
    const flashing =
      gremlin.sleepy &&
      this.sleepyTimer < 120 &&
      Math.floor(this.sleepyTimer / 12) % 2 === 0
    if (gremlin.state !== 'eyes') {
      g.fillStyle = gremlin.sleepy
        ? flashing
          ? '#f5f3ff'
          : '#3b82f6'
        : gremlin.color
      g.beginPath()
      g.arc(cx, cy - 1, 6, Math.PI, 0)
      g.lineTo(cx + 6, cy + 6)
      const wobble = Math.floor(this.tick / 8) % 2
      for (let i = 0; i < 4; i++) {
        const x = cx + 6 - (i + 1) * 3
        g.lineTo(x + 1.5, cy + (i % 2 === wobble ? 3 : 6))
        g.lineTo(x, cy + 6)
      }
      g.closePath()
      g.fill()
    }
    if (gremlin.sleepy && gremlin.state !== 'eyes') {
      g.fillStyle = flashing ? '#ef4444' : '#e0e7ff'
      g.fillRect(cx - 4, cy - 2, 3, 1)
      g.fillRect(cx + 1, cy - 2, 3, 1)
      return
    }
    const look = gremlin.dir
    g.fillStyle = '#ffffff'
    g.fillRect(cx - 4.5, cy - 4, 3.5, 4)
    g.fillRect(cx + 1, cy - 4, 3.5, 4)
    g.fillStyle = '#1e1b4b'
    g.fillRect(cx - 3.5 + look.x, cy - 3 + look.y, 1.5, 2)
    g.fillRect(cx + 2 + look.x, cy - 3 + look.y, 1.5, 2)
    if (gremlin.state !== 'eyes') {
      // Grumpy brows.
      g.fillRect(cx - 5, cy - 6, 4, 1)
      g.fillRect(cx + 1, cy - 6, 4, 1)
    }
  }

  private renderIntermission(g: CanvasRenderingContext2D) {
    const t = 300 - this.intermission
    const half = t < 150
    const y = TOP + 9 * TILE
    drawText(g, 'COFFEE BREAK', W / 2, TOP + 40, {
      scale: 2,
      align: 'center',
      color: '#fde68a',
    })
    if (half) {
      const x = W + 20 - t * 2.4
      this.robot.x = (x - TILE / 2) / TILE
      this.robot.y = 9
      this.robot.dir = LEFT
      this.robot.mouth = t / 4
      this.renderRobot(g)
      this.renderGremlin(g, {
        ...this.gremlins[0]!,
        x: (x + 30) / TILE,
        y: 9,
        dir: LEFT,
        sleepy: false,
        state: 'roaming',
      })
    } else {
      const x = -20 + (t - 150) * 2.4
      this.renderGremlin(g, {
        ...this.gremlins[0]!,
        x: x / TILE,
        y: 9,
        dir: RIGHT,
        sleepy: true,
        state: 'roaming',
      })
      g.fillStyle = '#2dd4bf'
      g.beginPath()
      g.arc(x - 34, y + TILE / 2, 18, 0.3, Math.PI * 2 - 0.3)
      g.lineTo(x - 34, y + TILE / 2)
      g.fill()
    }
  }

  private renderHud(g: CanvasRenderingContext2D) {
    const shadow = '#1e1b4b'
    drawText(g, String(this.score).padStart(6, '0'), 6, 6, {
      scale: 2,
      color: '#2dd4bf',
      shadow,
    })
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W - 6, 6, {
      scale: 2,
      align: 'right',
      color: '#fde68a',
      shadow,
    })
    const bottom = TOP + ROWS * TILE + 7
    for (let i = 0; i < Math.min(this.lives, 5); i++) {
      drawText(g, '*', 6 + i * 12, bottom, { color: '#2dd4bf' })
    }
    drawText(g, `LEVEL ${this.level}`, W - 6, bottom, {
      align: 'right',
      color: '#c4b5fd',
    })
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, TOP + 12.5 * TILE, {
        scale: 2,
        align: 'center',
        color: '#fde68a',
        shadow: '#db2777',
      })
    }
  }
}

const batteryMaze: ArcadeGameModule = {
  create: (options) => new BatteryMaze(options),
}

export const MAZE_SIZE = { width: W, height: H }
export const create = batteryMaze.create
export default batteryMaze
