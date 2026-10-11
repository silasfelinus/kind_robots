// /utils/arcade/games/batteryMaze.ts
//
// Battery Maze -- the Kind Robots Arcade's maze-chase riff (conductor kr-arcade/t-006, depth pass
// t-039..t-042: conductor projects/kr-arcade/depth-pass/CABINETS.md section 2, "The Charging
// Network"). The city's power grid has gone glitchy, and a little cat-eared robot travels inside
// its appliances to recharge them, board by board, while glitch gremlins (each with its own way
// of hunting: batteryMaze/roster.ts) chase it. A power cell makes them sleepy; every one bumped
// while it lasts reboots into a friendly bot that rides the Friend Train behind the robot, and
// the train pays out when the cell runs down. Rewire switches swing gates to re-route the maze.
//
// The campaign is data (batteryMaze/boards.ts): boards of three mazes each, story breaks
// (story.ts), a boss maze at the end of each Power Phase (bosses.ts) and the Charging Bay
// between phases (bay.ts). The rules engine reads its mazes (mazes.ts), per-maze heat tables
// (tables.ts) and hunting rules (roster.ts); the art lives in art.ts and the music in music.ts.

import { drawText, measureText } from '../font'
import {
  INK,
  RAMPS,
  Sparkles,
  backdropRng,
  bevel,
  cachedLayer,
  drawSprite,
  drawStars,
  dropShadow,
  gauge,
  glow,
  hudPanel,
  vignette,
} from '../snes'
import type { MusicLoop } from '../sound'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'
import {
  BOLT_ICON,
  BREAK_STARS,
  CELL_COLOURS,
  CELL_SPRITES,
  DECOY_SPRITE,
  EYES_ONLY,
  FLASH_THEME,
  GOLDEN_BOLT,
  GREMLIN_ART,
  GREMLIN_LOOKS,
  H,
  LIFE_SPRITE,
  MAMA_ART,
  POWER_UP_SPRITES,
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
  boardTheme,
  drawConveyor,
  drawGate,
  drawSwitch,
  drawToastSlot,
  glowStamp,
  paintBoard,
  paintBreak,
} from '../batteryMaze/art'
import type { Face, WallTheme } from '../batteryMaze/art'
import type { Ramp } from '../snes'
import { BAY_ITEMS, BOLT_AWARDS, STARTING_POWER } from '../batteryMaze/bay'
import type { BayItemId } from '../batteryMaze/bay'
import {
  PARADE,
  RUSH,
  SPECIALS,
  boardById,
  bossHeat,
  campaignSteps,
  heatFor,
} from '../batteryMaze/boards'
import type { Board, BoardMaze, Step } from '../batteryMaze/boards'
import { GremlinMama, MAMA } from '../batteryMaze/bosses'
import type { BossWorld } from '../batteryMaze/bosses'
import { CLASSIC_LAYOUT, gateOpen, parseMaze } from '../batteryMaze/mazes'
import type { Maze, MazeLayout, Tile } from '../batteryMaze/mazes'
import { BAY_MUSIC, BOSS_MUSIC, STORY_MUSIC } from '../batteryMaze/music'
import { HUNTERS, SNACKS_TO_OVERCLOCK, freshMind } from '../batteryMaze/roster'
import type { GremlinKind, HuntView, Mind } from '../batteryMaze/roster'
import { STAGE_FLOOR, actorAt, sceneById } from '../batteryMaze/story'
import type { Scene } from '../batteryMaze/story'
import {
  BASE_SPEED,
  MAGNET_RANGE,
  OVERCLOCK_BOOST,
  POWER_UPS,
  POWER_UP_KINDS,
  POWER_UP_ROLL,
  PRIZES,
  PRIZE_AT,
  PRIZE_SPEED,
  PRIZE_WANDER_TICKS,
  REWIRE_FLIPS,
  SHIELD_TICKS,
  TURBO_BOOST,
  bumpPoints,
  heatRow,
  overclockStage,
  prizeFor,
  trainPayout,
} from '../batteryMaze/tables'
import type { HeatRow, PowerUpKind } from '../batteryMaze/tables'

/** Today's maze, as the engine's layout test reads it. */
export const BATTERY_MAZE = CLASSIC_LAYOUT.rows

const CAMPAIGN = campaignSteps()
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
/** Conveyors speed things riding with them and slow things walking against them. */
const CONVEYOR_WITH = 1.5
const CONVEYOR_AGAINST = 0.6
const CARD_TICKS = 200
const GOLDEN_POINTS = 5000

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

/** Something that ambles round the maze: a roaming prize or a power-up. */
type Walker = { x: number; y: number; dir: Dir; t: number; wander: number }
type RoamingPrize = Walker & { kind: number; parade: boolean }
type PowerItem = Walker & { kind: PowerUpKind }

/** A special maze's progress (and Breakfast Rush's golden toast on show). */
type SpecialRun = {
  caught: number
  spawned: number
  next: number
  done: boolean
  toast: { at: Tile; t: number } | null
}

/**
 * A saved run (utils/arcade/saves.ts): the board reached, with what was earned on the way. A run
 * picked up after a game over keeps the board, bolts and golden bolts, never the score.
 */
export type BatterySave = {
  v: 1
  /** The campaign step of the board's title card. */
  step: number
  lap: number
  level: number
  score: number
  lives: number
  bolts: number
  flipBonus: number
  startMagnet: boolean
  hint: boolean
  golden: string[]
  continued: boolean
}

/** A stored save, checked against this build; null when unusable. */
export function readBatterySave(raw: unknown): BatterySave | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const count = (v: unknown, max: number) =>
    typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= max
  if (r.v !== 1) return null
  if (!count(r.step, CAMPAIGN.length - 1)) return null
  if (CAMPAIGN[r.step as number]!.kind !== 'card') return null
  if (!count(r.lap, 50) || !count(r.level, 9999)) return null
  if (!count(r.score, 99_999_999) || !count(r.lives, 99)) return null
  if (!count(r.bolts, 9999) || !count(r.flipBonus, 2)) return null
  if (!Array.isArray(r.golden)) return null
  const boards = new Set(
    CAMPAIGN.map((s) => (s.kind === 'card' ? s.board : '')),
  )
  return {
    v: 1,
    step: r.step as number,
    lap: r.lap as number,
    level: Math.max(1, r.level as number),
    score: r.score as number,
    lives: Math.max(1, r.lives as number),
    bolts: r.bolts as number,
    flipBonus: r.flipBonus as number,
    startMagnet: r.startMagnet === true,
    hint: r.hint === true,
    golden: [
      ...new Set(
        r.golden.filter(
          (g): g is string => typeof g === 'string' && boards.has(g),
        ),
      ),
    ],
    continued: r.continued === true,
  }
}

function sameDir(a: Dir, b: Dir) {
  return a.x === b.x && a.y === b.y
}

function opposite(d: Dir): Dir {
  return { x: 0 - d.x || 0, y: 0 - d.y || 0 }
}

const PARSED = new Map<string, Maze>()
function mazeOf(layout: MazeLayout): Maze {
  let maze = PARSED.get(layout.id)
  if (!maze) {
    maze = parseMaze(layout)
    PARSED.set(layout.id, maze)
  }
  return maze
}

class BatteryMaze implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = START_LIVES
  over = false
  save: BatterySave | null = null

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  // The campaign: where it is, and what is on screen between mazes.
  private steps: Step[] = CAMPAIGN
  private stepIndex = 0
  private lap = 0
  private board: Board = boardById('cozy')
  private spec: BoardMaze | null = null
  private card: { t: number } | null = null
  private story: { scene: Scene; t: number } | null = null
  private bay: { cursor: number; t: number } | null = null
  private offer: BatterySave | null = null
  private mama: GremlinMama | null = null
  private bossWorld: BossWorld | null = null
  // What the run has earned.
  private bolts = 0
  private flipBonus = 0
  private startMagnet = false
  private hint = false
  private golden: string[] = []
  // This maze.
  private maze: Maze = mazeOf(CLASSIC_LAYOUT)
  private theme: WallTheme = boardTheme(boardById('cozy').look)
  private roster: readonly GremlinKind[] = []
  private heat = 1
  private row: HeatRow = heatRow(1)
  private mazeTick = 0
  private sparks = new Set<string>()
  private cells = new Set<string>()
  private totalSparks = 0
  private eaten = 0
  private switchState: Array<0 | 1> = []
  private shut = new Set<string>()
  private toastUp = new Set<string>()
  private blocked = new Set<string>()
  private flips = REWIRE_FLIPS
  private mazeLost = false
  private mazeFullTrain = false
  private special: SpecialRun | null = null
  private goldenBolt: { at: Tile; shown: boolean } | null = null
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
  private prizes: RoamingPrize[] = []
  private prizesRolled = 0
  private powerItem: PowerItem | null = null
  private powerNext = POWER_UP_ROLL.first
  private power: { kind: PowerUpKind; ticks: number } | null = null
  private decoy: { x: number; y: number } | null = null
  private floaters: Array<{
    x: number
    y: number
    text: string
    life: number
  }> = []
  private pause = 0
  private dying = 0
  private clearing = 0
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
    const stored = this.demo ? null : readBatterySave(options.resume)
    this.startStep()
    if (stored && stored.step > 0) {
      this.offer = stored
      this.save = stored
    }
  }

  /** The board's tune, the boss theme, the Bay's or the story's; none in the attract demo. */
  get music(): MusicLoop | null {
    if (this.demo || this.over || this.offer) return null
    if (this.story) return STORY_MUSIC
    if (this.bay) return BAY_MUSIC
    if (this.mama) return BOSS_MUSIC
    return this.board.music
  }

  // --- the campaign ---------------------------------------------------------------

  private currentStep(): Step {
    return this.steps[this.stepIndex]!
  }

  private startStep() {
    const step = this.currentStep()
    this.card = null
    this.story = null
    this.bay = null
    this.mama = null
    this.bossWorld = null
    switch (step.kind) {
      case 'card':
        this.board = boardById(step.board)
        this.theme = boardTheme(this.board.look)
        this.card = { t: 0 }
        this.keep()
        // The board's first maze sits behind its title card.
        this.beginMaze(this.board, 0)
        return
      case 'maze':
        this.beginMaze(boardById(step.board), step.maze)
        return
      case 'story':
        this.story = { scene: sceneById(step.id), t: 0 }
        return
      case 'boss':
        this.beginBoss(step.phase)
        return
      case 'bay':
        this.openBay()
        return
    }
  }

  private advance() {
    this.stepIndex++
    if (this.stepIndex >= this.steps.length) {
      // Round the grid again, hotter.
      this.stepIndex = 0
      this.lap++
    }
    const step = this.currentStep()
    if (step.kind !== 'story' && step.kind !== 'bay') this.level++
    this.startStep()
    if (this.stepIndex === 0 && this.lap > 0)
      this.banner = { text: 'THE GRID GLITCHES AGAIN!', ticks: 150 }
  }

  /** Remember the run at this board's start (a real game only). */
  private keep() {
    if (this.demo) return
    this.save = {
      v: 1,
      step: this.stepIndex,
      lap: this.lap,
      level: this.level,
      score: this.score,
      lives: Math.max(1, this.lives),
      bolts: this.bolts,
      flipBonus: this.flipBonus,
      startMagnet: this.startMagnet,
      hint: this.hint,
      golden: [...this.golden],
      continued: false,
    }
  }

  /** Pick a saved run back up at the start of its board. */
  private resumeFrom(s: BatterySave) {
    this.score = s.continued ? 0 : s.score
    this.lives = s.continued ? START_LIVES : s.lives
    this.nextExtra =
      (Math.floor(this.score / EXTRA_LIFE_AT) + 1) * EXTRA_LIFE_AT
    this.bolts = s.bolts
    this.flipBonus = s.flipBonus
    this.startMagnet = s.startMagnet
    this.hint = s.hint
    this.golden = [...s.golden]
    this.lap = s.lap
    this.level = s.level
    this.stepIndex = s.step
    this.startStep()
  }

  private beginMaze(board: Board, index: number) {
    this.board = board
    this.theme = boardTheme(board.look)
    const spec = board.mazes[index]!
    this.spec = spec
    this.loadMaze(
      mazeOf(spec.layout),
      heatFor(board, index, this.lap),
      spec.roster,
    )
    this.special = spec.special
      ? { caught: 0, spawned: 0, next: PARADE.first, done: false, toast: null }
      : null
    this.goldenBolt =
      spec.goldenBolt && !this.golden.includes(board.id)
        ? { at: spec.goldenBolt, shown: false }
        : null
    if (index === 0 && this.startMagnet) {
      this.startMagnet = false
      this.power = {
        kind: STARTING_POWER,
        ticks: POWER_UPS[STARTING_POWER].ticks,
      }
    }
    if (!this.card) {
      const name = spec.special ? SPECIALS[spec.special].name : this.maze.name
      this.banner = {
        text: `${board.number}-${index + 1} ${name}`,
        sub: spec.special ? SPECIALS[spec.special].goal : undefined,
        ticks: 160,
      }
    }
  }

  private beginBoss(phase: number) {
    this.spec = null
    this.special = null
    this.goldenBolt = null
    this.theme = boardTheme({ wall: 'pink', neon: 'gold', pattern: 'rivets' })
    this.loadMaze(mazeOf(MAMA.layout), bossHeat(phase, this.lap), [])
    this.mama = new GremlinMama(MAMA)
    this.bossWorld = this.makeBossWorld()
    this.banner = {
      text: 'GREMLIN MAMA!',
      sub: 'EAT SPARKS TO WAKE HER UP',
      ticks: 180,
    }
  }

  private openBay() {
    this.bay = { cursor: 0, t: 0 }
    this.bay.cursor = this.bayDefault(0)
  }

  private owned(id: BayItemId): number {
    if (id === 'flip') return this.flipBonus
    if (id === 'magnet') return this.startMagnet ? 1 : 0
    if (id === 'hint') return this.hint ? 1 : 0
    return 0
  }

  private canBuy(i: number): boolean {
    const item = BAY_ITEMS[i]
    if (!item) return false
    if (this.bolts < item.price) return false
    return item.max === undefined || this.owned(item.id) < item.max
  }

  /** The first row from `from` the robot can still buy, else LEAVE. */
  private bayDefault(from: number): number {
    for (let i = from; i < BAY_ITEMS.length; i++) if (this.canBuy(i)) return i
    return BAY_ITEMS.length
  }

  private updateBay(input: InputFrame) {
    const bay = this.bay!
    bay.t++
    const leave = () => {
      this.bay = null
      this.sound.play('start')
      this.advance()
    }
    if (this.demo) {
      if (bay.t > 150) leave()
      return
    }
    if (bay.t < 20) return
    const rows = BAY_ITEMS.length + 1
    if (input.pressed.up) bay.cursor = (bay.cursor + rows - 1) % rows
    if (input.pressed.down) bay.cursor = (bay.cursor + 1) % rows
    if (input.pressed.up || input.pressed.down) this.sound.play('blip')
    if (input.pressed.b || input.pressed.start) return leave()
    if (!input.pressed.a) return
    if (bay.cursor >= BAY_ITEMS.length) return leave()
    if (!this.canBuy(bay.cursor)) {
      this.sound.play('warn')
      return
    }
    const item = BAY_ITEMS[bay.cursor]!
    this.bolts -= item.price
    if (item.id === 'robot') this.lives++
    if (item.id === 'flip') this.flipBonus++
    if (item.id === 'magnet') this.startMagnet = true
    if (item.id === 'hint') this.hint = true
    this.sound.play('extra')
    if (!this.canBuy(bay.cursor)) bay.cursor = this.bayDefault(bay.cursor)
  }

  // --- setup ---------------------------------------------------------------

  private maxFlips() {
    return REWIRE_FLIPS + this.flipBonus
  }

  private loadMaze(maze: Maze, heat: number, roster: readonly GremlinKind[]) {
    this.maze = maze
    this.heat = heat
    this.row = heatRow(heat)
    this.mazeTick = 0
    this.sparks = new Set(maze.sparks.map((t) => `${t.x},${t.y}`))
    this.cells = new Set(maze.cells.map((t) => `${t.x},${t.y}`))
    this.totalSparks = this.sparks.size + this.cells.size
    this.eaten = 0
    this.switchState = maze.switches.map(() => 0)
    this.toastUp.clear()
    this.refreshGates()
    this.flips = this.maxFlips()
    this.prizes = []
    this.prizesRolled = 0
    this.powerItem = null
    this.powerNext = POWER_UP_ROLL.first
    this.power = null
    this.decoy = null
    this.mazeLost = false
    this.mazeFullTrain = false
    this.roster = roster
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
    const padOrder = [0, -1, 1, -2, 2]
    this.gremlins = this.roster.map((kind, i) => {
      // The first waits outside the door; the rest on the dock's pads, middle out.
      const pad = pads[mid + (padOrder[Math.max(0, i - 1)] ?? 0)] ?? pads[mid]!
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
    this.decoy = null
    this.mama?.reset()
    this.pause = 90
  }

  private makeBossWorld(): BossWorld {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const game = this
    return {
      get robot() {
        return game.robot
      },
      row: this.row,
      rng: () => this.rng(),
      open: (x, y) => {
        if (x < 0 || x >= this.maze.cols) return false
        const c = this.maze.rows[y]?.[x]
        if (!c || c === '#' || c === '-' || c === 'G') return false
        return !this.blocked.has(`${x},${y}`)
      },
      sleepy: () => this.sleepyTimer > 0,
      eatenShare: () => this.eaten / Math.max(1, this.totalSparks),
      cellsLeft: () => this.cells.size,
      babies: () => this.gremlins.filter((g) => g.kind === 'baby').length,
      clearBabies: () => {
        for (const g of this.gremlins)
          if (g.kind === 'baby')
            this.sparkle(g.x, g.y, 10, [RAMPS.purple[3], '#ffffff'], 1.2)
        this.gremlins = this.gremlins.filter((g) => g.kind !== 'baby')
      },
      spawnBaby: (at) => {
        this.gremlins.push({
          kind: 'baby',
          x: at.x,
          y: at.y,
          dir: DOWN,
          state: 'roaming',
          sleepy: false,
          corner: at,
          order: 99,
          pad: this.maze.dockHome,
          mind: freshMind(),
          friendly: false,
          hop: null,
        })
      },
      spawnCell: (at) => {
        const key = `${at.x},${at.y}`
        if (this.sparks.delete(key)) this.totalSparks--
        this.cells.add(key)
        this.totalSparks++
      },
      refillFlips: () => {
        this.flips = this.maxFlips()
      },
      addScore: (points, at) => this.addScore(points, at.x, at.y),
      announce: (text, sub) => {
        this.banner = { text, sub, ticks: 160 }
      },
      sound: (name) => this.sound.play(name),
      sparkle: (at, colours) => this.sparkle(at.x, at.y, 24, colours, 2.2),
    }
  }

  // --- the maze --------------------------------------------------------------

  private refreshGates() {
    this.shut.clear()
    this.maze.switches.forEach((s, i) => {
      for (const gate of s.gates)
        if (!gateOpen(gate, this.switchState[i]!))
          this.shut.add(`${gate.x},${gate.y}`)
    })
    this.blocked = new Set([...this.shut, ...this.toastUp])
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
    return row[wx] === '#' || this.blocked.has(`${wx},${y}`)
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

  /** Whether the robot is in plain sight straight down a corridor from `from`. */
  private sees(from: Tile): boolean {
    const r = {
      x: this.wrapX(Math.round(this.robot.x)),
      y: Math.round(this.robot.y),
    }
    if (r.x !== from.x && r.y !== from.y) return false
    const span = Math.abs(r.x - from.x) + Math.abs(r.y - from.y)
    if (span > 10) return false
    const dx = Math.sign(r.x - from.x)
    const dy = Math.sign(r.y - from.y)
    for (let i = 1; i < span; i++)
      if (this.isWall(from.x + dx * i, from.y + dy * i)) return false
    return true
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
    const controls = this.demo ? this.demoInput() : input
    if (this.offer) {
      if (controls.pressed.a || controls.pressed.start) {
        const s = this.offer
        this.offer = null
        this.resumeFrom(s)
      } else if (controls.pressed.b) {
        // A new run: the campaign starts over (the golden bolts found stay found).
        this.golden = [...this.offer.golden]
        this.offer = null
        this.keep()
      }
      return
    }
    if (this.bay) {
      this.updateBay(controls)
      return
    }
    if (this.story) {
      const s = this.story
      s.t++
      const skip = s.t > 60 && (controls.pressed.a || controls.pressed.start)
      if (skip || s.t >= s.scene.ticks) {
        this.story = null
        this.advance()
      }
      return
    }
    if (this.card) {
      const c = this.card
      c.t++
      const skip = c.t > 40 && (controls.pressed.a || controls.pressed.start)
      if (skip || c.t >= CARD_TICKS) {
        // The card lifts off the board's first maze.
        this.card = null
        this.stepIndex++
        this.sound.play('start')
      }
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
      if (--this.clearing === 0) this.advance()
      return
    }
    if (this.dying > 0) {
      if (--this.dying === 0) {
        if (this.lives <= 0) {
          this.over = true
          this.banner = { text: 'GAME OVER', ticks: 9999 }
          if (this.save) this.save = { ...this.save, continued: true }
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

    this.mazeTick++
    if (controls.held.up) this.robot.want = UP
    else if (controls.held.down) this.robot.want = DOWN
    else if (controls.held.left) this.robot.want = LEFT
    else if (controls.held.right) this.robot.want = RIGHT
    if (controls.pressed.a) this.tryFlip()

    this.updateToast()
    this.updateModes()
    this.updatePower()
    this.moveRobot()
    this.eat()
    this.release()
    const view = this.huntView()
    const frozen = this.power?.kind === 'freeze'
    for (const gremlin of this.gremlins) {
      if (frozen && gremlin.state === 'roaming') continue
      if (gremlin.state === 'roaming' && !gremlin.sleepy)
        HUNTERS[gremlin.kind].sense?.(gremlin, view)
      this.moveGremlin(gremlin, view)
    }
    if (this.mama && this.bossWorld) this.mama.update(this.bossWorld)
    this.moveTrain()
    this.collide()
    this.updatePrizes()
    this.updateSpecial()

    const cleared = this.mama
      ? this.mama.done
      : this.sparks.size === 0 && this.cells.size === 0
    if (cleared && this.dying === 0) this.clearMaze()
  }

  /** The maze is charged (or the boss is home): bolts for what went well, then on. */
  private clearMaze() {
    this.endTrain(true)
    this.clearing = 120
    this.sound.play('level')
    let bolts = this.mama ? BOLT_AWARDS.boss : BOLT_AWARDS.maze
    if (!this.mazeLost) bolts += BOLT_AWARDS.clean
    if (this.mazeFullTrain) bolts += BOLT_AWARDS.fullTrain
    this.earn(bolts)
    if (this.mama) {
      for (const g of this.gremlins) this.sparkle(g.x, g.y, 8)
      this.gremlins = []
      return
    }
    this.banner = {
      text: 'MAZE CHARGED!',
      sub: `+${bolts} BOLTS${this.mazeLost ? '' : '  CLEAN CHARGE!'}`,
      ticks: 120,
    }
  }

  private earn(bolts: number) {
    if (this.demo) return
    this.bolts += bolts
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

  // --- the Toaster Works -------------------------------------------------------------

  /** Where a slot is in the board's beat: down, glowing to warn, or up. */
  private toastPhase(group: 0 | 1): 'down' | 'tell' | 'up' {
    const beat = this.board.toastBeat
    if (!beat || this.mama) return 'down'
    const t = (this.mazeTick + (group * beat.period) / 2) % beat.period
    if (t >= beat.period - beat.up) return 'up'
    if (t >= beat.period - beat.up - beat.tell) return 'tell'
    return 'down'
  }

  /** Toast pops on the beat, but never onto anyone (it waits for the slot to clear). */
  private updateToast() {
    if (!this.maze.toast.length) return
    let changed = false
    const rush = this.special?.toast?.at
    for (const slot of this.maze.toast) {
      const key = `${slot.x},${slot.y}`
      const want =
        this.toastPhase(slot.group) === 'up' &&
        !(rush && rush.x === slot.x && rush.y === slot.y)
      if (want && !this.toastUp.has(key)) {
        const occupied = [this.robot, ...this.gremlins].some(
          (a) => this.key(a.x, a.y) === key,
        )
        if (!occupied) {
          this.toastUp.add(key)
          changed = true
        }
      } else if (!want && this.toastUp.has(key)) {
        this.toastUp.delete(key)
        changed = true
      }
    }
    if (changed) {
      this.refreshGates()
      this.turnBack()
    }
  }

  /** How a conveyor under `actor` changes its pace. */
  private conveyorPace(actor: { x: number; y: number }, dir: Dir): number {
    if (!this.maze.conveyors.length) return 1
    const x = this.wrapX(Math.round(actor.x))
    const y = Math.round(actor.y)
    const belt = this.maze.conveyors.find((c) => c.x === x && c.y === y)
    if (!belt) return 1
    if (sameDir(belt.dir, dir)) return CONVEYOR_WITH
    if (sameDir(belt.dir, opposite(dir))) return CONVEYOR_AGAINST
    return 1
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
    const turbo = this.power?.kind === 'turbo' ? TURBO_BOOST : 1
    return (
      BASE_SPEED * pace * turbo * this.conveyorPace(this.robot, this.robot.dir)
    )
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
    this.turnBack()
  }

  /** Anything walking into a tile that has just shut turns round. */
  private turnBack() {
    const walkers: Array<{ x: number; y: number; dir: Dir }> = [
      ...this.gremlins.filter(
        (g) => g.state === 'roaming' || g.state === 'eyes',
      ),
      ...this.prizes,
    ]
    if (this.powerItem) walkers.push(this.powerItem)
    for (const w of walkers) {
      if (sameDir(w.dir, NONE)) continue
      // The tile it is walking into (or the shut tile it stands short of the middle of).
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
      const intoShut = this.blocked.has(`${this.wrapX(ax)},${ay}`)
      const atCentre = Math.abs(w.x - ax) < 1e-6 && Math.abs(w.y - ay) < 1e-6
      if (intoShut && !atCentre) w.dir = opposite(w.dir)
    }
    const mama = this.mama
    if (mama && this.bossWorld) {
      // Mama is two tiles across: she turns back if any tile ahead of her has shut.
      const fx =
        mama.dir.x > 0
          ? Math.ceil(mama.x - 1e-6) + 1
          : Math.floor(mama.x + 1e-6)
      const fy =
        mama.dir.y > 0
          ? Math.ceil(mama.y - 1e-6) + 1
          : Math.floor(mama.y + 1e-6)
      const ahead = mama.dir.x
        ? [
            [fx, Math.round(mama.y)],
            [fx, Math.round(mama.y) + 1],
          ]
        : [
            [Math.round(mama.x), fy],
            [Math.round(mama.x) + 1, fy],
          ]
      const moving = mama.dir.x ? mama.x % 1 !== 0 : mama.y % 1 !== 0
      if (moving && ahead.some(([x, y]) => !this.bossWorld!.open(x!, y!)))
        mama.dir = opposite(mama.dir)
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
    this.flips = this.maxFlips()
    const ticks = this.mama ? this.mama.spec.napTicks : this.row.sleepyTicks
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

  // --- power-ups ---------------------------------------------------------------

  private updatePower() {
    if (this.power && --this.power.ticks <= 0) {
      this.power = null
      this.decoy = null
    }
    if (this.power?.kind === 'magnet' && this.tick % 3 === 0) {
      // Pull in the nearest spark within reach.
      const r = this.robot
      let best: string | null = null
      let bestD = MAGNET_RANGE + 1e-6
      for (const key of this.sparks) {
        if (this.toastUp.has(key)) continue
        const [x, y] = key.split(',').map(Number) as [number, number]
        const d = Math.hypot(x - r.x, y - r.y)
        if (d <= bestD) {
          bestD = d
          best = key
        }
      }
      if (best && this.sparks.delete(best)) {
        const [x, y] = best.split(',').map(Number) as [number, number]
        this.chomp(x, y)
        this.sparksSinceRelease++
      }
    }
    if (this.mama) return
    // Now and then a power-up rolls out of the dock.
    if (!this.powerItem && this.mazeTick >= this.powerNext) {
      this.powerNext = this.mazeTick + POWER_UP_ROLL.every
      const exit = this.maze.dockExit
      this.powerItem = {
        kind: POWER_UP_KINDS[Math.floor(this.rng() * POWER_UP_KINDS.length)]!,
        x: exit.x,
        y: exit.y,
        dir: this.rng() < 0.5 ? LEFT : RIGHT,
        t: 0,
        wander: POWER_UP_ROLL.wander,
      }
    }
    const item = this.powerItem
    if (!item) return
    if (!this.walk(item, PRIZE_SPEED, false)) {
      this.powerItem = null
      return
    }
    if (this.touchingRobot(item)) {
      this.powerItem = null
      this.power = { kind: item.kind, ticks: POWER_UPS[item.kind].ticks }
      if (item.kind === 'decoy')
        this.decoy = {
          x: this.wrapX(Math.round(this.robot.x)),
          y: Math.round(this.robot.y),
        }
      this.banner = {
        text: POWER_UPS[item.kind].name,
        sub: POWER_UPS[item.kind].about,
        ticks: 90,
      }
      this.sound.play('extra')
      this.sparkle(item.x, item.y, 16, [RAMPS.sky[3], RAMPS.gold[4], '#ffffff'])
    }
  }

  private touchingRobot(w: { x: number; y: number }) {
    const r = this.robot
    const dx = Math.abs(w.x - r.x)
    return (
      Math.min(dx, this.maze.cols - dx) < 0.75 && Math.abs(w.y - r.y) < 0.75
    )
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
    const nearest = (from: Tile, keys: Iterable<string>): Tile | null => {
      let best: Tile | null = null
      let bestD = Infinity
      for (const key of keys) {
        const [x, y] = key.split(',').map(Number) as [number, number]
        const d = Math.hypot(x - from.x, y - from.y)
        if (d < bestD) {
          bestD = d
          best = { x, y }
        }
      }
      return best
    }
    return {
      robot: { x: r.x, y: r.y, dir: r.dir },
      trail: (ticks) =>
        this.history[Math.max(0, this.history.length - 1 - ticks)]!,
      junctionAhead: () => this.junctionAlong(r.dir),
      junctionBehind: () => this.junctionAlong(opposite(r.dir)),
      cellNearRobot: () => nearest(r, this.cells),
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
      sees: (from) => this.sees(from),
      nearestSpark: (from) => nearest(from, this.sparks),
    }
  }

  private target(g: Gremlin, view: HuntView): Tile {
    if (g.state === 'eyes') return this.maze.dockExit
    if (this.decoy) return this.decoy
    const relentless =
      (g.kind === 'chaser' && view.overclock === 2) || g.kind === 'baby'
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
    const pace = HUNTERS[g.kind].pace?.(g) ?? 1
    return BASE_SPEED * r.gremlin * boost * pace * this.conveyorPace(g, g.dir)
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
    if (speed <= 0) return
    if (this.atCentre(g)) this.chooseTurn(g, view)
    if (this.step(g, g.dir, speed)) {
      this.snap(g)
      const exit = this.maze.dockExit
      if (g.state === 'eyes' && g.x === exit.x && g.y === exit.y) {
        g.state = 'leaving'
        g.x = home.x
        g.y = home.y
        g.sleepy = false
      } else if (g.state === 'roaming' && !g.sleepy && HUNTERS[g.kind].eats) {
        this.snack(g)
      }
    }
  }

  /** A crumb snacker eats the spark it stands on; its fifteenth turns it red. */
  private snack(g: Gremlin) {
    if (!this.sparks.delete(this.key(g.x, g.y))) return
    this.eaten++
    g.mind.snacks++
    this.sparkle(g.x, g.y, 3, [RAMPS.rust[3], RAMPS.gold[3]], 0.6)
    if (g.mind.snacks === SNACKS_TO_OVERCLOCK) {
      this.sound.play('warn')
      this.sparkle(g.x, g.y, 14, [RAMPS.ember[2], RAMPS.ember[3]], 1.6)
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
      if (!this.toastUp.has(key) && this.sparks.delete(key)) {
        this.chomp(g.x, g.y)
        this.sparksSinceRelease++
      }
    })
    if (this.train.length >= 4) this.mazeFullTrain = true
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
    const frozen = this.power?.kind === 'freeze'
    if (this.decoy) {
      const d = this.decoy
      if (
        this.gremlins.some(
          (g) =>
            g.state === 'roaming' &&
            !g.sleepy &&
            Math.abs(g.x - d.x) < 0.6 &&
            Math.abs(g.y - d.y) < 0.6,
        )
      ) {
        this.sparkle(d.x, d.y, 12, [RAMPS.earth[3], RAMPS.earth[2]], 1.4)
        this.sound.play('pop')
        this.decoy = null
        if (this.power?.kind === 'decoy') this.power = null
      }
    }
    if (this.mama && this.mama.touches(r.x, r.y)) {
      if (this.mama.bumpable) {
        this.mama.bump(this.bossWorld!)
        this.pause = 30
        return
      }
      if (this.mama.harmful && r.shield <= 0) return this.lose()
    }
    for (const g of this.gremlins) {
      if (g.state !== 'roaming') continue
      const dx = Math.abs(g.x - r.x)
      const wrapDx = Math.min(dx, cols - dx)
      if (wrapDx >= 0.6 || Math.abs(g.y - r.y) >= 0.6) continue
      if (frozen) continue
      if (g.sleepy) {
        this.chain++
        this.addScore(bumpPoints(this.chain), g.x, g.y)
        this.sparkle(g.x, g.y, 16, [
          GREMLIN_LOOKS[g.kind].ramp[3],
          RAMPS.teal[3],
          '#ffffff',
        ])
        this.sound.play('pop')
        if (g.kind === 'baby') {
          // A baby just pops home in a puff.
          this.gremlins = this.gremlins.filter((x) => x !== g)
          return
        }
        g.state = 'friend'
        g.sleepy = false
        g.mind = freshMind()
        g.hop = { x: g.x, y: g.y, t: 0 }
        this.train.push(g)
        this.pause = 20
        return
      }
      if (r.shield > 0) {
        // The shield bounces it: it turns round if it was coming on.
        if ((r.x - g.x) * g.dir.x + (r.y - g.y) * g.dir.y > 0)
          g.dir = opposite(g.dir)
        continue
      }
      return this.lose()
    }
  }

  private lose() {
    this.lives--
    this.dying = 110
    this.mazeLost = true
    this.prizes = this.prizes.filter((p) => p.parade)
    this.power = null
    this.decoy = null
    this.endTrain(false)
    if (this.mama)
      this.gremlins = this.gremlins.filter((g) => g.kind !== 'baby')
    this.sound.play('die')
  }

  // --- roaming prizes and special mazes ----------------------------------------------

  /** Twice a maze a prize rolls in from a tunnel (or the dock) and wanders about. */
  private rollPrize() {
    if (this.special || this.mama) return
    if (this.prizesRolled >= PRIZE_AT.length || this.prizes.length) return
    if (this.eaten < PRIZE_AT[this.prizesRolled]! * this.totalSparks) return
    this.prizesRolled++
    this.spawnPrize(prizeFor(this.heat), PRIZE_WANDER_TICKS, false)
  }

  private spawnPrize(kind: number, wander: number, parade: boolean) {
    const m = this.maze
    const base = { kind, t: 0, wander, parade }
    if (m.tunnelRows.length) {
      const y = m.tunnelRows[Math.floor(this.rng() * m.tunnelRows.length)]!
      const fromLeft = this.rng() < 0.5
      this.prizes.push({
        ...base,
        x: fromLeft ? 0 : m.cols - 1,
        y,
        dir: fromLeft ? RIGHT : LEFT,
      })
    } else {
      this.prizes.push({
        ...base,
        x: m.dockExit.x,
        y: m.dockExit.y,
        dir: this.rng() < 0.5 ? LEFT : RIGHT,
      })
    }
  }

  /**
   * Amble a walker one tick: wandering at random, then heading for a tunnel mouth (or, for a
   * power-up, blinking out). False once it has gone.
   */
  private walk(w: Walker, speed: number, viaTunnel = true): boolean {
    w.t++
    const m = this.maze
    const leaving = w.t > w.wander
    if (w.t > w.wander + 60 * 8) return false
    if (!viaTunnel && leaving) return w.t <= w.wander + 90
    if (this.atCentre(w)) {
      const x = this.wrapX(Math.round(w.x))
      const y = Math.round(w.y)
      if (leaving && m.tunnelRows.includes(y) && (x === 0 || x === m.cols - 1))
        return false
      const options = DIRS.filter(
        (d) => !sameDir(d, opposite(w.dir)) && this.canMove(x, y, d),
      )
      if (!options.length) w.dir = opposite(w.dir)
      else if (!leaving || !m.tunnelRows.length)
        w.dir = options[Math.floor(this.rng() * options.length)]!
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
        w.dir = best
      }
    }
    if (this.step(w, w.dir, speed)) this.snap(w)
    return true
  }

  private updatePrizes() {
    this.prizes = this.prizes.filter((p) => {
      if (!this.walk(p, PRIZE_SPEED)) return false
      if (!this.touchingRobot(p)) return true
      const prize = PRIZES[p.kind]!
      this.addScore(prize.points, p.x, p.y)
      this.earn(BOLT_AWARDS.prize)
      this.sparkle(p.x, p.y, 18, undefined, 2)
      this.sound.play('extra')
      if (p.parade && this.special) this.special.caught++
      return false
    })
  }

  /** The special maze's own goal, and the golden bolt it can reveal. */
  private updateSpecial() {
    const sp = this.special
    const kind = this.spec?.special
    if (sp && kind === 'prize-parade' && sp.spawned < SPECIALS[kind].target) {
      if (this.mazeTick >= sp.next && this.prizes.length < 3) {
        this.spawnPrize(sp.spawned, PARADE.wander, true)
        sp.spawned++
        sp.next = this.mazeTick + PARADE.every
      }
    }
    if (sp && kind === 'breakfast-rush') this.updateRush(sp)
    if (sp && kind && !sp.done && sp.caught >= SPECIALS[kind].target) {
      sp.done = true
      this.earn(BOLT_AWARDS.special)
      this.banner = {
        text: `${SPECIALS[kind].name} DONE!`,
        sub: `+${BOLT_AWARDS.special} BOLTS`,
        ticks: 120,
      }
      if (this.goldenBolt && !this.mazeLost) {
        this.goldenBolt.shown = true
        this.banner.sub = 'A GOLDEN BOLT APPEARS!'
      }
    }
    const gb = this.goldenBolt
    if (
      gb?.shown &&
      this.key(this.robot.x, this.robot.y) === `${gb.at.x},${gb.at.y}`
    ) {
      this.goldenBolt = null
      if (!this.demo) this.golden.push(this.board.id)
      this.addScore(GOLDEN_POINTS, gb.at.x, gb.at.y)
      this.sparkle(
        gb.at.x,
        gb.at.y,
        30,
        [RAMPS.gold[4], RAMPS.gold[3], '#ffffff'],
        2.4,
      )
      this.sound.play('extra')
      this.banner = {
        text: 'GOLDEN BOLT!',
        sub: `${this.golden.length} OF 6 FOUND`,
        ticks: 150,
      }
    }
  }

  /** Breakfast Rush: three golden toasts pop as the maze empties; grab each in time. */
  private updateRush(sp: SpecialRun) {
    if (sp.toast) {
      const t = sp.toast
      if (this.key(this.robot.x, this.robot.y) === `${t.at.x},${t.at.y}`) {
        const points = RUSH.points[sp.caught] ?? RUSH.points.at(-1)!
        this.addScore(points, t.at.x, t.at.y)
        this.earn(BOLT_AWARDS.prize)
        this.sparkle(t.at.x, t.at.y, 20, [RAMPS.gold[4], '#ffffff'], 2)
        this.sound.play('extra')
        sp.caught++
        sp.toast = null
      } else if (--t.t <= 0) {
        sp.toast = null
      }
      return
    }
    const popped = sp.spawned
    if (
      popped < RUSH.at.length &&
      this.eaten >= RUSH.at[popped]! * this.totalSparks &&
      this.maze.toast.length
    ) {
      const slot =
        this.maze.toast[Math.floor(this.rng() * this.maze.toast.length)]!
      sp.toast = { at: { x: slot.x, y: slot.y }, t: RUSH.ticks }
      sp.spawned++
      if (this.toastUp.delete(`${slot.x},${slot.y}`)) this.refreshGates()
      this.banner = { text: 'GOLDEN TOAST!', ticks: 70 }
      this.sound.play('pop')
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
    // Between mazes: tap through the cards, the comics and the Bay.
    if (this.offer || this.card || this.story || this.bay) {
      if (this.tick % 20 === 0) frame.pressed.a = held.a = true
      return frame
    }
    const cols = this.maze.cols
    const r = this.robot
    const sx = this.wrapX(Math.round(r.x))
    const sy = Math.round(r.y)
    const danger = new Set<string>()
    let nearest = Infinity
    const mark = (gx: number, gy: number, reach: number) => {
      nearest = Math.min(nearest, Math.abs(gx - sx) + Math.abs(gy - sy))
      for (let dx = -reach; dx <= reach; dx++)
        for (let dy = -reach; dy <= reach; dy++)
          if (Math.abs(dx) + Math.abs(dy) <= reach)
            danger.add(`${this.wrapX(gx + dx)},${gy + dy}`)
    }
    if (r.shield <= 0 && this.power?.kind !== 'freeze') {
      for (const g of this.gremlins) {
        if (g.state !== 'roaming' || g.sleepy) continue
        mark(Math.round(g.x), Math.round(g.y), g.kind === 'sprinter' ? 3 : 2)
      }
      const mama = this.mama
      if (mama?.harmful) {
        for (const [dx, dy] of [
          [0, 0],
          [1, 0],
          [0, 1],
          [1, 1],
        ])
          mark(
            Math.round(mama.x) + dx!,
            Math.round(mama.y) + dy!,
            mama.phase === 3 ? 1 : 2,
          )
      }
    }
    const goals = this.pilotGoals()
    // Standing on a switch: throw it when a hunter is close, or when the plan says so.
    const onSwitch = this.maze.switches.some((s) => s.x === sx && s.y === sy)
    const panic = nearest <= 4 && !this.mama
    if (onSwitch && this.flips > 0 && (panic || goals.flip)) {
      held.a = true
      frame.pressed.a = true
    }
    const only = goals.only
    const isGoal = only
      ? (key: string) => only.has(key)
      : (key: string) =>
          (this.sparks.has(key) && !this.toastUp.has(key)) ||
          this.cells.has(key) ||
          goals.extra.has(key) ||
          this.gremlins.some(
            (g) =>
              g.sleepy && g.state === 'roaming' && this.key(g.x, g.y) === key,
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
    const dir =
      chosen ?? (only?.has(startKey) && !danger.size ? NONE : this.fleeDir())
    if (sameDir(dir, UP)) held.up = true
    else if (sameDir(dir, DOWN)) held.down = true
    else if (sameDir(dir, LEFT)) held.left = true
    else if (sameDir(dir, RIGHT)) held.right = true
    return frame
  }

  /** What the pilot is after besides sparks: prizes, power-ups, and Mama's trap. */
  private pilotGoals(): {
    extra: Set<string>
    only: Set<string> | null
    flip: boolean
  } {
    const extra = new Set<string>()
    for (const p of this.prizes) extra.add(this.key(p.x, p.y))
    if (this.powerItem) extra.add(this.key(this.powerItem.x, this.powerItem.y))
    if (this.special?.toast)
      extra.add(`${this.special.toast.at.x},${this.special.toast.at.y}`)
    if (this.goldenBolt?.shown)
      extra.add(`${this.goldenBolt.at.x},${this.goldenBolt.at.y}`)
    const mama = this.mama
    if (!mama) return { extra, only: null, flip: false }
    const tiles = (list: Tile[]) => new Set(list.map((t) => `${t.x},${t.y}`))
    const mx = Math.round(mama.x)
    const my = Math.round(mama.y)
    if (mama.bumpable) {
      const around: Tile[] = []
      for (let dx = 0; dx <= 1; dx++)
        for (let dy = 0; dy <= 1; dy++) around.push({ x: mx + dx, y: my + dy })
      return { extra, only: tiles(around), flip: false }
    }
    if (mama.phase === 3) {
      const b = MAMA.bay
      const inBay = mx >= b.x0 && mx + 1 <= b.x1 && my >= b.y0 && my + 1 <= b.y1
      const sw = this.maze.switches[0]!
      const shut = MAMA.bayGates.every((t) => this.blocked.has(`${t.x},${t.y}`))
      // Throw the switch to shut her in, or to open the bay again if it is shut while she is out.
      if (inBay !== shut) return { extra, only: tiles([sw]), flip: true }
      // Lure her out of the dock, then wait just past the bay's wall until she follows us in.
      return {
        extra,
        only: tiles(mama.state === 'plug' ? MAMA.lureSpots : MAMA.baitSpots),
        flip: false,
      }
    }
    return { extra, only: null, flip: false }
  }

  private fleeDir(): Dir {
    const r = this.robot
    let best = r.dir
    let bestScore = -Infinity
    for (const d of DIRS) {
      if (!this.canMove(r.x, r.y, d)) continue
      const nx = Math.round(r.x) + d.x
      const ny = Math.round(r.y) + d.y
      const threats = this.gremlins
        .filter((g) => g.state === 'roaming' && !g.sleepy)
        .map((g) => Math.hypot(g.x - nx, g.y - ny))
      if (this.mama?.harmful)
        threats.push(
          Math.hypot(this.mama.centre.x - nx, this.mama.centre.y - ny),
        )
      const nearest = Math.min(Infinity, ...threats)
      if (nearest > bestScore) {
        bestScore = nearest
        best = d
      }
    }
    return best
  }

  // --- render ----------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    if (this.story) {
      this.renderStory(g, this.story)
      this.fx.render(g)
      vignette(g, W, H, 0.3)
      return
    }
    const flash = this.clearing > 0 && Math.floor(this.clearing / 12) % 2 === 0
    const theme = flash
      ? { ...FLASH_THEME, floor: this.theme.floor, pattern: this.theme.pattern }
      : this.theme
    const lookId = this.mama ? 'boss' : this.board.id
    cachedLayer(
      g,
      `battery-maze-${this.maze.id}-${lookId}-${flash ? 'flash' : 'lit'}`,
      W,
      H,
      (k) => paintBoard(k, theme, this.maze),
    )
    for (const c of this.maze.conveyors) drawConveyor(g, c, c.dir, this.tick)
    this.renderToast(g)
    this.renderGates(g, theme.neon)
    this.renderSparks(g)
    this.renderCells(g)
    this.renderGolden(g)
    for (const p of this.prizes) this.renderPrize(g, p)
    if (this.powerItem) this.renderPowerItem(g, this.powerItem)
    if (this.decoy) {
      const cx = this.decoy.x * TILE + TILE / 2
      const cy = TOP + this.decoy.y * TILE + TILE / 2
      dropShadow(g, cx, cy + 7, 5, 1.5, 0.4)
      drawSprite(g, DECOY_SPRITE, cx, cy - 1.5)
    }
    if (!(this.dying > 0 && this.dying < 70)) {
      for (const gremlin of this.gremlins)
        if (gremlin.state !== 'friend') this.renderGremlin(g, gremlin)
      for (let i = this.train.length - 1; i >= 0; i--)
        this.renderGremlin(g, this.train[i]!)
      if (this.mama) this.renderMama(g, this.mama)
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
    if (this.card) this.renderCard(g)
    if (this.bay) this.renderBay(g)
    if (this.offer) this.renderOffer(g, this.offer)
  }

  private renderToast(g: CanvasRenderingContext2D) {
    const rush = this.special?.toast
    for (const slot of this.maze.toast) {
      const key = `${slot.x},${slot.y}`
      if (rush && rush.at.x === slot.x && rush.at.y === slot.y) {
        if (rush.t > 60 || Math.floor(rush.t / 5) % 2 === 0)
          drawToastSlot(g, slot, 'up', this.tick, true)
        continue
      }
      const state = this.toastUp.has(key)
        ? 'up'
        : this.toastPhase(slot.group) === 'down'
          ? 'down'
          : 'tell'
      drawToastSlot(g, slot, state, this.tick)
    }
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
      if (this.toastUp.has(key)) continue
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

  /** The golden bolt: blazing once it shows, a faint outline before that with a Bolt Hint. */
  private renderGolden(g: CanvasRenderingContext2D) {
    const gb = this.goldenBolt
    if (!gb || (!gb.shown && !this.hint)) return
    const cx = gb.at.x * TILE + TILE / 2
    const cy = TOP + gb.at.y * TILE + TILE / 2
    if (!gb.shown) {
      drawSprite(g, GOLDEN_BOLT, cx, cy, {
        alpha: 0.25 + 0.1 * Math.sin(this.tick / 9),
      })
      return
    }
    glow(g, cx, cy, 16 + Math.sin(this.tick / 5) * 3, RAMPS.gold[4], 0.7)
    drawSprite(g, GOLDEN_BOLT, cx, cy - 1 + Math.round(Math.sin(this.tick / 6)))
  }

  /** A roaming prize bobs along, blinking as it gets ready to leave. */
  private renderPrize(g: CanvasRenderingContext2D, p: RoamingPrize) {
    if (p.t > p.wander + 60 * 6 && Math.floor(p.t / 6) % 2 === 0) return
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

  private renderPowerItem(g: CanvasRenderingContext2D, p: PowerItem) {
    if (p.t > p.wander && Math.floor(p.t / 5) % 2 === 0) return
    const cx = p.x * TILE + TILE / 2
    const cy = TOP + p.y * TILE + TILE / 2
    glow(g, cx, cy, 11, RAMPS.sky[3], 0.45 + 0.15 * Math.sin(this.tick / 4))
    bevel(g, cx - 6, cy - 6, 12, 12, RAMPS.night, { depth: 1 })
    drawSprite(g, POWER_UP_SPRITES[p.kind], cx, cy)
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
    const kind = this.power?.kind
    const aura =
      kind === 'magnet'
        ? RAMPS.ember[3]
        : kind === 'turbo'
          ? RAMPS.sky[3]
          : RAMPS.teal[3]
    const strong = kind === 'magnet' || kind === 'turbo'
    glow(g, cx, cy, kind === 'magnet' ? 18 : 11, aura, strong ? 0.4 : 0.22)
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
   * flanker's antenna lights when it charges, the wanderer's "!" when it hears chomping, the
   * sprinter crouches with flat ears before a dash, and a full crumb snacker turns red.
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
    const frozen = this.power?.kind === 'freeze' && gremlin.state === 'roaming'
    const step = frozen ? 0 : Math.floor(this.tick / 6) % 2
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
    const hot =
      gremlin.kind === 'snacker' && gremlin.mind.snacks >= SNACKS_TO_OVERCLOCK
    const sprite = gremlin.sleepy
      ? (flashing ? art.flash : art.sleepy)[step]!
      : hot
        ? art.hot[face][step]!
        : art.normal[face][step]!
    dropShadow(g, cx, cy + 8 * scale, 6 * scale, 1.8 * scale, 0.4)
    if (!gremlin.sleepy && gremlin.state === 'roaming')
      this.renderTell(g, gremlin, cx, cy)
    // A sprinter winding up crouches low.
    const crouch =
      gremlin.kind === 'sprinter' && gremlin.mind.aim > 0 && !gremlin.sleepy
        ? 2
        : 0
    drawSprite(g, sprite, cx, y + crouch, { flipX, scale })
    if (frozen) {
      glow(g, cx, cy, 10, RAMPS.sky[4], 0.5)
      g.fillStyle = 'rgba(190, 235, 255, 0.35)'
      g.fillRect(cx - 7, cy - 8, 14, 15)
    }
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
    const m = gremlin.mind
    if (gremlin.kind === 'chaser') {
      const stage = this.overclock()
      if (!stage) return
      const flick = 0.5 + 0.3 * Math.sin(this.tick / 3)
      const hot = stage === 2 ? RAMPS.ember[2] : RAMPS.ember[3]
      glow(g, cx - 6, cy - 8, 6 + stage * 2, hot, flick)
      glow(g, cx + 6, cy - 8, 6 + stage * 2, hot, flick)
    } else if (gremlin.kind === 'flanker' && m.charging) {
      glow(
        g,
        cx,
        cy - 10,
        7,
        RAMPS.ember[2],
        0.6 + 0.3 * Math.sin(this.tick / 2),
      )
    } else if (gremlin.kind === 'sprinter') {
      if (m.aim > 0) glow(g, cx, cy - 2, 9, RAMPS.gold[4], 0.7)
      if (m.dash > 0)
        glow(
          g,
          cx - gremlin.dir.x * 8,
          cy - gremlin.dir.y * 8,
          9,
          RAMPS.gold[3],
          0.5,
        )
    } else if (gremlin.kind === 'snacker' && m.snacks >= SNACKS_TO_OVERCLOCK) {
      glow(g, cx, cy, 11, RAMPS.ember[2], 0.45 + 0.2 * Math.sin(this.tick / 3))
    }
  }

  /** Gremlin Mama, twice the size, in her mood of the moment. */
  private renderMama(g: CanvasRenderingContext2D, mama: GremlinMama) {
    const cx = (mama.x + 1) * TILE
    const cy = TOP + (mama.y + 1) * TILE
    const look = mama.dir
    const face: Face = look.y < 0 ? 'up' : look.y > 0 ? 'down' : 'side'
    const step = Math.floor(this.tick / 9) % 2
    const flipX = look.x < 0
    const state = mama.state
    dropShadow(g, cx, cy + 15, 12, 3, 0.45)
    if (state === 'home') {
      const fade = Math.max(0, 1 - mama.homeTicks / 150)
      glow(g, cx, cy, 24, RAMPS.teal[3], 0.5 * fade)
      drawSprite(g, MAMA_ART.friend[step]!, cx, cy - 2, {
        scale: 2,
        alpha: fade,
      })
      return
    }
    const sleepy = state === 'sleepy' || state === 'trapped'
    const sprite = sleepy
      ? MAMA_ART.sleepy[step]!
      : state === 'dazed'
        ? MAMA_ART.flash[step]!
        : MAMA_ART.normal[face][step]!
    if (state === 'chase') glow(g, cx, cy, 22, RAMPS.ember[2], 0.3)
    drawSprite(g, sprite, cx, cy - 2, { scale: 2, flipX })
    if (state === 'dazed' || state === 'trapped') {
      for (let i = 0; i < 3; i++) {
        const a = this.tick / 8 + (i * Math.PI * 2) / 3
        drawText(g, '*', cx + Math.cos(a) * 12, cy - 22 + Math.sin(a) * 3, {
          color: RAMPS.gold[4],
          outline: INK,
        })
      }
    }
    if (sleepy) {
      const drift = (this.tick % 40) / 40
      drawSprite(g, SLEEP_Z, cx + 14 + drift * 4, cy - 18 - drift * 6, {
        scale: 2,
        alpha: 1 - drift * 0.7,
      })
    }
  }

  /** A story break: the stage, its actors on their keys, and the captions. */
  private renderStory(
    g: CanvasRenderingContext2D,
    story: { scene: Scene; t: number },
  ) {
    cachedLayer(g, 'battery-maze-break', W, H, paintBreak)
    drawStars(g, BREAK_STARS, this.tick)
    const { scene, t } = story
    hudPanel(g, W / 2 - 92, TOP + 32, 184, 26, RAMPS.purple)
    drawText(g, scene.title, W / 2, TOP + 38, {
      scale: 2,
      align: 'center',
      color: RAMPS.gold[3],
      outline: INK,
    })
    for (const actor of scene.actors) {
      const a = actorAt(actor, t)
      if (a.pose === 'hidden') continue
      const dir = a.face < 0 ? LEFT : RIGHT
      const cy = a.y
      switch (actor.cast) {
        case 'robot':
          if (a.scale > 1) glow(g, a.x, cy, 30, RAMPS.teal[3], 0.3)
          dropShadow(g, a.x + 1, STAGE_FLOOR + 7, 5 * a.scale, 1.6, 0.4)
          this.drawRobot(g, a.x, cy, dir, t / 4, a.scale)
          break
        case 'oil-can':
          drawSprite(g, PRIZE_SPRITES[1]!, a.x, cy, { flipX: a.face < 0 })
          break
        case 'puddle':
          g.fillStyle = 'rgba(20, 10, 38, 0.85)'
          g.beginPath()
          g.ellipse(a.x, cy, 26, 4, 0, 0, Math.PI * 2)
          g.fill()
          glow(g, a.x - 8, cy - 1, 10, RAMPS.purple[3], 0.35)
          break
        case 'stars':
          for (let i = 0; i < 3; i++) {
            const ang = t / 7 + (i * Math.PI * 2) / 3
            drawText(g, '*', a.x + Math.cos(ang) * 9, cy + Math.sin(ang) * 3, {
              color: RAMPS.gold[4],
              outline: INK,
            })
          }
          break
        default: {
          const art = GREMLIN_ART[actor.cast]
          const frame = Math.floor(t / 6) % 2
          const sprite =
            a.pose === 'sleepy'
              ? art.sleepy[frame]!
              : a.pose === 'dizzy'
                ? art.flash[frame]!
                : a.pose === 'friend'
                  ? art.friend[frame]!
                  : art.normal.side[frame]!
          dropShadow(g, a.x, STAGE_FLOOR + 8, 6, 1.8, 0.4)
          drawSprite(g, sprite, a.x, cy - 1, { flipX: a.face < 0 })
        }
      }
    }
    for (const c of scene.captions) {
      if (t < c.from || t >= c.to) continue
      drawText(g, c.text, W / 2, TOP + 200, {
        scale: 2,
        align: 'center',
        color: RAMPS.teal[3],
        outline: INK,
      })
    }
    if (t > 60 && Math.floor(t / 30) % 2 === 0)
      drawText(g, 'A  SKIP', W - 8, H - 14, {
        align: 'right',
        color: RAMPS.purple[3],
        outline: INK,
      })
  }

  /** The board's title card, over its first maze. */
  private renderCard(g: CanvasRenderingContext2D) {
    const b = this.board
    const slide = Math.min(1, this.card!.t / 20)
    const x = 14
    const w = W - 28
    const y = TOP + 40 + (1 - slide) * 30
    hudPanel(g, x, y, w, 168, RAMPS[b.look.wall])
    drawText(g, `POWER PHASE ${b.phase}`, W / 2, y + 10, {
      align: 'center',
      color: RAMPS.gold[4],
      outline: INK,
    })
    drawText(g, `BOARD ${b.number}`, W / 2, y + 26, {
      align: 'center',
      color: RAMPS.teal[3],
      outline: INK,
    })
    drawText(g, b.name, W / 2, y + 44, {
      scale: 2,
      align: 'center',
      color: RAMPS.gold[3],
      outline: INK,
      shadow: RAMPS.pink[1],
    })
    drawText(g, b.intro, W / 2, y + 74, {
      align: 'center',
      color: RAMPS.steel[4],
      outline: INK,
    })
    drawText(g, 'NEW GREMLINS', W / 2, y + 98, {
      align: 'center',
      color: RAMPS.pink[3],
      outline: INK,
    })
    drawText(g, b.newcomers, W / 2, y + 112, {
      align: 'center',
      color: RAMPS.steel[4],
      outline: INK,
    })
    const found = this.golden.includes(b.id)
    const label = found ? 'GOLDEN BOLT FOUND' : 'A GOLDEN BOLT HIDES HERE'
    const lw = measureText(label) + 16
    drawSprite(g, GOLDEN_BOLT, W / 2 - lw / 2 + 4, y + 146, {
      alpha: found ? 1 : 0.35,
    })
    drawText(g, label, W / 2 - lw / 2 + 16, y + 142, {
      color: found ? RAMPS.gold[4] : RAMPS.purple[3],
      outline: INK,
    })
  }

  /** The Charging Bay: spend bolts between phases. */
  private renderBay(g: CanvasRenderingContext2D) {
    const bay = this.bay!
    g.fillStyle = 'rgba(7, 6, 26, 0.78)'
    g.fillRect(0, 0, W, H)
    const x = 12
    const w = W - 24
    const y = TOP + 14
    hudPanel(g, x, y, w, 270, RAMPS.teal)
    drawText(g, 'THE CHARGING BAY', W / 2, y + 10, {
      scale: 2,
      align: 'center',
      color: RAMPS.gold[3],
      outline: INK,
    })
    const wallet = `${this.bolts} BOLTS`
    const ww = measureText(wallet) + 12
    drawSprite(g, BOLT_ICON, W / 2 - ww / 2, y + 38)
    drawText(g, wallet, W / 2 - ww / 2 + 8, y + 35, {
      color: RAMPS.gold[4],
      outline: INK,
    })
    BAY_ITEMS.forEach((item, i) => {
      const iy = y + 56 + i * 42
      const on = bay.cursor === i
      const can = this.canBuy(i)
      const maxed = item.max !== undefined && this.owned(item.id) >= item.max
      if (on) hudPanel(g, x + 6, iy - 5, w - 12, 36, RAMPS.gold)
      drawText(g, item.name, x + 14, iy, {
        color: can ? RAMPS.steel[4] : RAMPS.steel[2],
        outline: INK,
      })
      drawText(g, maxed ? 'OWNED' : `${item.price} BOLTS`, x + w - 14, iy, {
        align: 'right',
        color: maxed ? RAMPS.teal[3] : can ? RAMPS.gold[4] : RAMPS.ember[3],
        outline: INK,
      })
      drawText(g, item.about, x + 14, iy + 14, {
        color: on ? RAMPS.night[1] : RAMPS.cream[3],
        outline: INK,
      })
    })
    const ly = y + 56 + BAY_ITEMS.length * 42
    if (bay.cursor === BAY_ITEMS.length)
      hudPanel(g, x + 6, ly - 5, w - 12, 18, RAMPS.gold)
    drawText(g, 'LEAVE THE BAY', W / 2, ly, {
      align: 'center',
      color: RAMPS.teal[3],
      outline: INK,
    })
    drawText(g, 'A BUY   B LEAVE', W / 2, y + 252, {
      align: 'center',
      color: RAMPS.purple[3],
      outline: INK,
    })
  }

  private renderOffer(g: CanvasRenderingContext2D, s: BatterySave) {
    g.fillStyle = 'rgba(7, 6, 26, 0.8)'
    g.fillRect(0, 0, W, H)
    const step = CAMPAIGN[s.step]!
    const board = step.kind === 'card' ? boardById(step.board) : this.board
    const y = TOP + 70
    hudPanel(g, 20, y, W - 40, 140, RAMPS.purple)
    drawText(g, 'CONTINUE?', W / 2, y + 12, {
      scale: 2,
      align: 'center',
      color: RAMPS.gold[3],
      outline: INK,
    })
    drawText(g, `BOARD ${board.number}  ${board.name}`, W / 2, y + 42, {
      align: 'center',
      color: RAMPS.teal[3],
      outline: INK,
    })
    drawText(
      g,
      s.continued ? 'SCORE STARTS FRESH' : `SCORE ${s.score}`,
      W / 2,
      y + 60,
      { align: 'center', color: RAMPS.steel[4], outline: INK },
    )
    drawText(g, `${s.bolts} BOLTS  ${s.golden.length} GOLDEN`, W / 2, y + 76, {
      align: 'center',
      color: RAMPS.gold[4],
      outline: INK,
    })
    drawText(g, 'A  CONTINUE', W / 2, y + 100, {
      align: 'center',
      color: RAMPS.leaf[3],
      outline: INK,
    })
    drawText(g, 'B  NEW RUN', W / 2, y + 116, {
      align: 'center',
      color: RAMPS.pink[3],
      outline: INK,
    })
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
    // Between them: the Friend Train while it rolls, a special maze's tally, or the flips left.
    const midL = 3 + scoreW + 6
    const midR = W - 3 - hiW - 6
    const kind = this.spec?.special
    const tally = (text: string, ramp: Ramp = RAMPS.teal) => {
      const w = measureText(text) + 12
      hudPanel(g, (midL + midR - w) / 2, 5, w, 15, ramp)
      drawText(g, text, (midL + midR) / 2, 9, {
        align: 'center',
        color: ramp[4],
        outline: INK,
      })
    }
    if (midR - midL >= 60) {
      if (this.train.length) tally(`TRAIN x${this.train.length}`)
      else if (kind && this.special)
        tally(
          `${kind === 'prize-parade' ? 'PRIZES' : 'TOAST'} ${this.special.caught}/${SPECIALS[kind].target}`,
          RAMPS.gold,
        )
      else if (this.maze.switches.length) {
        const max = this.maxFlips()
        const w = 46 + max * 9
        const x = (midL + midR - w) / 2
        hudPanel(g, x, 5, w, 15)
        drawText(g, 'FLIPS', x + 6, 9, { color: RAMPS.gold[4], outline: INK })
        for (let i = 0; i < max; i++) {
          const on = i < this.flips
          g.fillStyle = INK
          g.fillRect(x + 40 + i * 9, 8, 7, 9)
          g.fillStyle = on ? RAMPS.gold[3] : RAMPS.steel[1]
          g.fillRect(x + 41 + i * 9, 9, 5, 7)
          if (on) {
            g.fillStyle = RAMPS.gold[4]
            g.fillRect(x + 41 + i * 9, 9, 2, 2)
          }
        }
      }
    }

    // Along the bottom: spare robots, the maze's charge (or a timer), bolts and where we are.
    const panelY = TOP + this.maze.height * TILE + 4
    const textY = panelY + 4
    const lives = Math.min(this.lives, 5)
    if (lives > 0) {
      hudPanel(g, 3, panelY, lives * 12 + 6, 15)
      for (let i = 0; i < lives; i++) {
        drawSprite(g, LIFE_SPRITE, 12 + i * 12, panelY + 7)
      }
    }
    const mazeNo = this.spec ? this.board.mazes.indexOf(this.spec) + 1 : 1
    const where = this.mama ? 'BOSS' : `${this.board.number}-${mazeNo}`
    const boltText = String(this.bolts)
    const rightW = measureText(where) + measureText(boltText) + 30
    const rx = W - 3 - rightW
    hudPanel(g, rx, panelY, rightW, 15)
    drawSprite(g, BOLT_ICON, rx + 8, panelY + 7)
    drawText(g, boltText, rx + 14, textY, {
      color: RAMPS.gold[4],
      outline: INK,
    })
    drawText(g, where, W - 9, textY, {
      align: 'right',
      color: RAMPS.purple[3],
      outline: INK,
    })
    const left = 76
    const right = rx - 6
    if (right - left > 80) {
      hudPanel(g, left, panelY, right - left, 15)
      const [label, amount, ramp] = this.gaugeReading()
      drawText(g, label, left + 6, textY, { color: ramp[4], outline: INK })
      gauge(g, left + 48, textY, right - left - 54, 7, amount, ramp)
    }

    if (this.banner && !this.card) {
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

  /** The bottom gauge: a shield, the sleepy time, a power-up, Mama's patience, or the charge. */
  private gaugeReading(): [string, number, Ramp] {
    if (this.robot.shield > 0)
      return ['SHIELD', this.robot.shield / SHIELD_TICKS, RAMPS.sky]
    if (this.sleepyTimer > 0)
      return [
        'SLEEPY',
        this.sleepyTimer / Math.max(1, this.sleepyFull),
        RAMPS.sky,
      ]
    if (this.power) {
      const p = POWER_UPS[this.power.kind]
      return [p.name.split(' ')[0]!, this.power.ticks / p.ticks, RAMPS.pink]
    }
    if (this.mama) return ['MAMA', 1 - this.mama.hits / MAMA.hits, RAMPS.pink]
    const total = this.totalSparks || 1
    return [
      'CHARGE',
      (total - this.sparks.size - this.cells.size) / total,
      RAMPS.gold,
    ]
  }
}

const batteryMaze: ArcadeGameModule = {
  create: (options) => new BatteryMaze(options),
}

export const MAZE_SIZE = { width: W, height: H }
export const create = batteryMaze.create
export default batteryMaze
