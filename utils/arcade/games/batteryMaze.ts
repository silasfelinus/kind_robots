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
import { emptyInput } from '../types'
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
  PINK_ROBOT_FRAMES,
  ROBOT_SPARKS,
  SLEEP_Z,
  SPARK_COLOURS,
  SPARK_SPRITE,
  SPARK_TWINKLE,
  TILE,
  TOP,
  W,
  boardTheme,
  drawBed,
  drawConveyor,
  drawCrackle,
  drawDarkness,
  drawFan,
  drawFlowerGate,
  drawIce,
  drawLamp,
  drawLock,
  drawPanel,
  drawProp,
  drawThorns,
  drawVine,
  drawGate,
  drawOverload,
  drawSurge,
  drawTrainCar,
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
  BOARDS,
  BLOOM_VINES,
  GARDEN_PRIZE_EVERY,
  LAMP_REACH,
  PARADE,
  PHASES,
  RUSH,
  SPECIALS,
  SUNSET,
  THAW_TICKS,
  boardById,
  bossHeat,
  campaignSteps,
  heatFor,
  secretStep,
} from '../batteryMaze/boards'
import type { Board, BoardMaze, SpecialKind, Step } from '../batteryMaze/boards'
import {
  GlitchTrain,
  GremlinMama,
  MAMA,
  OVERLOAD,
  Overload,
  TRAIN,
} from '../batteryMaze/bosses'
import type { BossMachine, BossWorld, PilotPlan } from '../batteryMaze/bosses'
import {
  CLASSIC_LAYOUT,
  LAYOUTS,
  gateOpen,
  parseMaze,
} from '../batteryMaze/mazes'
import {
  ALL_MEDALS,
  CLASSIC_MAZE,
  COOP_LIVES,
  MEDALS,
  MODES,
  RUSH_HOUR,
  TAG,
  menuModes,
} from '../batteryMaze/modes'
import type { ModeId } from '../batteryMaze/modes'
import type { Maze, MazeLayout, Tile } from '../batteryMaze/mazes'
import { BAY_MUSIC, ENDING_MUSIC, STORY_MUSIC } from '../batteryMaze/music'
import {
  BLINK,
  HUNTERS,
  SNACKS_TO_OVERCLOCK,
  STARTING_FOUR,
  THORN_TICKS,
  freshMind,
} from '../batteryMaze/roster'
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
  TOOL_CHANCE,
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
/** The boss's name on the gauge. */
const BOSS_LABEL = { mama: 'MAMA', train: 'TRAIN', overload: 'CORE' } as const
const GOLDEN_POINTS = 5000
/** Ice speeds things up; fans push things along their row while they blow. */
const ICE_PACE = 1.3
const WIND_WITH = 1.4
const WIND_AGAINST = 0.6
/** Static's crackle lingers this long on a tile. */
const CRACKLE_TICKS = 150

type GremlinState = 'docked' | 'leaving' | 'roaming' | 'eyes' | 'friend'

/** A robot: one, or two side by side in co-op, each with its own trail and Friend Train. */
type Robot = {
  seat: 0 | 1
  x: number
  y: number
  dir: Dir
  want: Dir
  mouth: number
  eatDrag: number
  shield: number
  /** Caught in co-op: a flickering spark bot until its partner touches it (ticks left). */
  down: number
  /** Its last ticks of position (the chaser sniffs it), and its trail for the train. */
  history: Tile[]
  trail: Tile[]
  trailAcc: number
  train: Gremlin[]
}

function newRobot(seat: 0 | 1, at: Tile): Robot {
  return {
    seat,
    x: at.x,
    y: at.y,
    dir: LEFT,
    want: LEFT,
    mouth: 0,
    eatDrag: 0,
    shield: 0,
    down: 0,
    history: [{ ...at }],
    trail: [{ ...at }],
    trailAcc: 0,
    train: [],
  }
}

/** A caught co-op robot waits this long for its partner before it costs a life. */
const REVIVE_TICKS = 60 * 12
/** A sleepy gremlin bumped with both robots close by pays this Pair Bonus. */
const PAIR_BONUS = 1000
const PAIR_RANGE = 1.6
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
  /** The tile it last stood on (a bramble's thorns go there). */
  from: Tile | null
  /** A twin sulking home after its twin was rebooted. */
  sulky: boolean
  /** Gremlin Tag: the seat steering it (players[seat]), and where that player last pushed. */
  seat?: number
  want?: Dir
}

/** Rush Hour's run: the clock, the sparks not yet banked, and the battery bar. */
type RushRun = {
  t: number
  unbanked: number
  mult: number
  bar: { x: number; y: number; ticks: number } | null
  barNext: number
  wave: number
  nextWave: number
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
  /** The special was lost (the vines won, the freezer shut, the sun set). */
  failed: boolean
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
  /** The campaign has been cleared once: Overclocked is open. */
  overclocked?: boolean
  /** Medals won per campaign maze (`board:maze`), as MEDALS bits. */
  medals?: Record<string, number>
  /** The best Rush Hour score on this device. */
  rushBest?: number
}

/** Every campaign maze a medal can be won on, as `board:maze`. */
const MEDAL_KEYS = new Set(
  BOARDS.flatMap((b) => b.mazes.map((_, i) => `${b.id}:${i}`)),
)

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
    overclocked: r.overclocked === true,
    medals: readMedals(r.medals),
    rushBest: count(r.rushBest, 99_999_999) ? (r.rushBest as number) : 0,
  }
}

function readMedals(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {}
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out
  for (const [key, bits] of Object.entries(raw as Record<string, unknown>)) {
    if (!MEDAL_KEYS.has(key)) continue
    if (typeof bits !== 'number' || !Number.isInteger(bits)) continue
    const kept = bits & ALL_MEDALS
    if (kept) out[key] = kept
  }
  return out
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
  private boss: BossMachine | null = null
  private bossWorld: BossWorld | null = null
  // What the run has earned.
  private bolts = 0
  private flipBonus = 0
  private startMagnet = false
  private hint = false
  private golden: string[] = []
  private overclocked = false
  /** The ending scene on show (credits, or the true ending). */
  private ending = false
  // The mode, its menu, and what lasts beyond a run.
  private mode: ModeId = 'campaign'
  private menu: { cursor: number; t: number; medals: boolean } | null = null
  private medals: Record<string, number> = {}
  private rushBest = 0
  private rush: RushRun | null = null
  /** The Rush Hour best before this run, for the result card's NEW BEST. */
  private rushBefore = 0
  private result: { text: string; lines: string[]; t: number } | null = null
  private classicBreak = false
  private tune: MusicLoop | null = null
  private prizesCaught = 0
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
  // Board mechanics.
  private vineGrown = new Map<string, number>()
  private vineTimer = 0
  private bloomed = new Set<string>()
  private ice = new Set<string>()
  private lit = new Set<string>()
  private unlocked = false
  private panelBack = new Map<string, number>()
  private mirrorTimer = 0
  private thorns = new Map<string, number>()
  private crackle = new Map<string, number>()
  private gardenTimer = 0
  private flips = REWIRE_FLIPS
  private mazeLost = false
  private mazeFullTrain = false
  private special: SpecialRun | null = null
  private goldenBolt: { at: Tile; shown: boolean } | null = null
  /** The robots in play; per-robot code acts for `cur`, through the accessors below. */
  private robots: Robot[] = [newRobot(0, { x: 0, y: 0 })]
  private cur = 0
  private seats = 1
  private gremlins: Gremlin[] = []
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

  private get robot(): Robot {
    return this.robots[this.cur] ?? this.robots[0]!
  }

  private get history(): Tile[] {
    return this.robot.history
  }

  private get trail(): Tile[] {
    return this.robot.trail
  }

  private set trail(v: Tile[]) {
    this.robot.trail = v
  }

  private get trailAcc(): number {
    return this.robot.trailAcc
  }

  private set trailAcc(v: number) {
    this.robot.trailAcc = v
  }

  private get train(): Gremlin[] {
    return this.robot.train
  }

  private set train(v: Gremlin[]) {
    this.robot.train = v
  }

  /** Every friend on every robot's train. */
  private allFriends(): Gremlin[] {
    return this.robots.flatMap((r) => r.train)
  }

  /** Run `fn` for each robot still up, as the current robot; robot 0 is current after. */
  private eachRobot(fn: (r: Robot) => void) {
    this.robots.forEach((r, i) => {
      if (r.down > 0) return
      this.cur = i
      fn(r)
    })
    this.cur = 0
  }

  /** The robot nearest a spot (the one a gremlin goes after), preferring robots still up. */
  private nearestRobot(at: { x: number; y: number }): number {
    let best = 0
    let bestD = Infinity
    this.robots.forEach((r, i) => {
      const d = Math.hypot(r.x - at.x, r.y - at.y) + (r.down > 0 ? 1000 : 0)
      if (d < bestD) {
        bestD = d
        best = i
      }
    })
    return best
  }

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.seats = Math.max(1, Math.min(4, options.players ?? 1))
    const stored = this.demo ? null : readBatterySave(options.resume)
    if (stored) {
      this.medals = { ...stored.medals }
      this.rushBest = stored.rushBest ?? 0
      this.overclocked = stored.overclocked === true
      this.golden = [...stored.golden]
    }
    this.startStep()
    if (stored) this.save = stored
    // A real game opens on the continue offer (with a run saved) or the mode menu.
    if (stored && stored.step > 0) this.offer = stored
    else if (!this.demo) this.openMenu()
  }

  /** Two seated, in any mode but Tag, is co-op: two robots. */
  private coop() {
    return this.seats === 2 && this.mode !== 'tag'
  }

  /** The campaign (or its Overclocked lap): where saves, bolts and medals count. */
  private campaignMode() {
    return this.mode === 'campaign' || this.mode === 'overclocked'
  }

  // --- the modes ---------------------------------------------------------------

  private openMenu() {
    this.menu = { cursor: 0, t: 0, medals: false }
  }

  private updateMenu(input: InputFrame) {
    const m = this.menu!
    m.t++
    if (m.t < 15) return
    if (m.medals) {
      if (input.pressed.a || input.pressed.b || input.pressed.start) {
        m.medals = false
        this.sound.play('blip')
      }
      return
    }
    const list = menuModes(this.seats, this.overclocked)
    if (input.pressed.up) m.cursor = (m.cursor + list.length - 1) % list.length
    if (input.pressed.down) m.cursor = (m.cursor + 1) % list.length
    if (input.pressed.up || input.pressed.down) this.sound.play('blip')
    if (input.pressed.b) {
      m.medals = true
      this.sound.play('blip')
      return
    }
    if (input.pressed.a || input.pressed.start) {
      this.menu = null
      this.startMode(list[m.cursor] ?? 'campaign')
    }
  }

  /** A fresh run in this mode. */
  private startMode(id: ModeId) {
    this.mode = id
    this.score = 0
    this.level = 1
    this.lives =
      id === 'tag' ? TAG.lives : this.coop() ? COOP_LIVES : START_LIVES
    // Tag is three tags and out: no extra robots from points.
    this.nextExtra = id === 'tag' ? Infinity : EXTRA_LIFE_AT
    this.bolts = 0
    this.flipBonus = 0
    this.startMagnet = false
    this.hint = false
    this.rush = null
    this.result = null
    this.classicBreak = false
    this.tune = null
    this.sound.play('start')
    if (id === 'campaign' || id === 'overclocked') {
      this.lap = id === 'overclocked' ? 1 : 0
      this.stepIndex = 0
      this.startStep()
      if (id === 'overclocked')
        this.banner = {
          text: 'OVERCLOCKED!',
          sub: 'THE GRID RUNS HOT',
          ticks: 150,
        }
      return
    }
    this.lap = 0
    if (id === 'rush') this.beginRush()
    else if (id === 'classic') this.beginClassic()
    else this.beginTag()
  }

  /** One maze outside the campaign: the mechanics of the Cozy Charger, in its own colours. */
  private beginSolo(
    layoutId: string,
    look: string,
    heat: number,
    roster: readonly GremlinKind[],
  ) {
    this.card = null
    this.story = null
    this.ending = false
    this.bay = null
    this.boss = null
    this.bossWorld = null
    this.spec = null
    this.special = null
    this.goldenBolt = null
    this.board = boardById('cozy')
    const lookBoard = boardById(look)
    this.theme = boardTheme(lookBoard.look)
    this.tune = lookBoard.music
    const layout = LAYOUTS.find((l) => l.id === layoutId) ?? CLASSIC_LAYOUT
    this.loadMaze(mazeOf(layout), heat, roster)
  }

  private beginClassic() {
    this.beginSolo(
      CLASSIC_MAZE.layout,
      CLASSIC_MAZE.look,
      Math.min(20, this.level),
      STARTING_FOUR,
    )
    this.banner = {
      text: `LEVEL ${this.level}`,
      sub: 'CLASSIC MAZE',
      ticks: 140,
    }
  }

  /** Classic Maze, after a clear: the next level, with a coffee break every few. */
  private nextClassic() {
    if (this.classicBreak) {
      this.classicBreak = false
      this.beginClassic()
      return
    }
    this.level++
    if ((this.level - 1) % CLASSIC_MAZE.breakEvery === 0) {
      this.classicBreak = true
      this.story = { scene: sceneById(CLASSIC_MAZE.scene), t: 0 }
      return
    }
    this.beginClassic()
  }

  private beginRush() {
    this.beginSolo(
      RUSH_HOUR.layout,
      RUSH_HOUR.look,
      RUSH_HOUR.heat,
      STARTING_FOUR,
    )
    this.lives = 1
    this.rushBefore = this.rushBest
    this.rush = {
      t: 0,
      unbanked: 0,
      mult: 1,
      bar: null,
      barNext: RUSH_HOUR.barEvery,
      wave: 1,
      nextWave: RUSH_HOUR.wave,
    }
    this.banner = {
      text: 'RUSH HOUR!',
      sub: 'EAT A BATTERY BAR TO BANK',
      ticks: 160,
    }
  }

  /** Rush Hour's clock, its battery bars and its waves. */
  private updateRushHour() {
    const r = this.rush
    if (!r) return
    r.t++
    if (r.t % 60 === 0 && this.score > this.rushBest) {
      // A quit mid-run still keeps the best scored so far.
      this.rushBest = this.score
      this.keepMeta()
    }
    if (r.t >= RUSH_HOUR.ticks) {
      this.endRush()
      return
    }
    if (r.bar) {
      if (r.unbanked > 0 && this.touchingRobot(r.bar)) this.bank(r)
      else if (--r.bar.ticks <= 0) r.bar = null
    } else if (r.t >= r.barNext) {
      r.barNext = r.t + RUSH_HOUR.barEvery
      const spots = this.maze.sparks.filter(
        (t) => !this.robotOn(this.key(t.x, t.y)),
      )
      const at = spots[Math.floor(this.rng() * spots.length)]
      if (at) r.bar = { x: at.x, y: at.y, ticks: RUSH_HOUR.barLife }
    }
    if (r.t >= r.nextWave || (this.sparks.size === 0 && this.cells.size === 0))
      this.rushWave(r)
  }

  /** The battery bar banks every spark eaten since the last, at a rising multiplier. */
  private bank(r: RushRun) {
    const bar = r.bar!
    const points = r.unbanked * RUSH_HOUR.sparkPoints * r.mult
    this.addScore(points)
    this.floaters.push({
      x: bar.x,
      y: bar.y - 1,
      text: `BANKED x${r.mult} ${points}`,
      life: 100,
    })
    this.sparkle(bar.x, bar.y, 20, [RAMPS.gold[4], RAMPS.leaf[3], '#ffffff'], 2)
    this.sound.play('extra')
    r.mult = Math.min(RUSH_HOUR.maxMultiplier, r.mult + 1)
    r.unbanked = 0
    r.bar = null
    r.barNext = r.t + RUSH_HOUR.barEvery
  }

  /** The sparks flow back in, and the grid runs a little hotter. */
  private rushWave(r: RushRun) {
    r.wave++
    r.nextWave = r.t + RUSH_HOUR.wave
    this.heat = Math.min(RUSH_HOUR.maxHeat, this.heat + RUSH_HOUR.heatPerWave)
    this.row = heatRow(this.heat)
    for (const t of this.maze.sparks) {
      const k = this.key(t.x, t.y)
      if (!this.robotOn(k)) this.sparks.add(k)
    }
    for (const t of this.maze.cells) {
      const k = this.key(t.x, t.y)
      if (!this.robotOn(k)) this.cells.add(k)
    }
    this.banner = {
      text: `WAVE ${r.wave}!`,
      sub: 'THE SPARKS FLOW BACK',
      ticks: 120,
    }
    this.sound.play('level')
  }

  private endRush() {
    if (!this.rush) return
    const best = this.score > this.rushBefore
    this.rushBest = Math.max(this.rushBest, this.score)
    this.keepMeta()
    this.rush.t = RUSH_HOUR.ticks
    this.showResult('TIME UP!', [
      `SCORE ${this.score}`,
      best && this.score > 0 ? 'A NEW BEST!' : `BEST ${this.rushBest}`,
    ])
  }

  private beginTag() {
    this.beginSolo(TAG.layout, TAG.look, TAG.heat, TAG.roster)
    this.banner = {
      text: 'GREMLIN TAG!',
      sub: 'ROBOT: CHARGE IT. GREMLINS: TAG!',
      ticks: 180,
    }
  }

  /** The seated players' gremlins follow their sticks. */
  private steerGremlins(players?: InputFrame[]) {
    for (const g of this.gremlins) {
      if (!g.seat) continue
      const f = players?.[g.seat]
      if (!f) continue
      if (f.held.up) g.want = UP
      else if (f.held.down) g.want = DOWN
      else if (f.held.left) g.want = LEFT
      else if (f.held.right) g.want = RIGHT
    }
  }

  /** A mode's last card (Tag's winner, Rush Hour's score), then the game is over. */
  private showResult(text: string, lines: string[]) {
    this.result = { text, lines, t: 0 }
    this.banner = null
    this.sound.play(text.startsWith('GREMLINS') ? 'die' : 'level')
  }

  /**
   * Keep what lasts beyond a run (Overclocked opened, golden bolts, medals, the Rush Hour best)
   * the moment it is earned, leaving any saved campaign checkpoint as it was: the host saves
   * whenever `save` changes, and again when the player leaves.
   */
  private keepMeta() {
    if (this.demo) return
    const base: BatterySave = this.save ?? {
      v: 1,
      step: 0,
      lap: 0,
      level: 1,
      score: 0,
      lives: START_LIVES,
      bolts: 0,
      flipBonus: 0,
      startMagnet: false,
      hint: false,
      golden: [...this.golden],
      continued: false,
    }
    this.save = {
      ...base,
      golden: [...new Set([...base.golden, ...this.golden])],
      overclocked: this.overclocked || base.overclocked === true,
      medals: { ...base.medals, ...this.medals },
      rushBest: Math.max(this.rushBest, base.rushBest ?? 0),
    }
  }

  /** A campaign maze charged: which medals it won (and which are new). */
  private awardMedals() {
    if (this.demo || !this.campaignMode() || !this.spec || this.boss) return
    const index = this.board.mazes.indexOf(this.spec)
    if (index < 0) return
    const key = `${this.board.id}:${index}`
    const sp = this.special
    const won = [
      !this.mazeLost,
      this.mazeFullTrain,
      sp ? sp.done && !sp.failed : this.prizesCaught >= PRIZE_AT.length,
    ]
    const had = this.medals[key] ?? 0
    let bits = had
    let y = this.robot.y - 2
    MEDALS.forEach((m, i) => {
      if (!won[i]) return
      bits |= m.bit
      if (had & m.bit) return
      this.floaters.push({
        x: this.robot.x,
        y,
        text: `MEDAL: ${m.name}`,
        life: 140,
      })
      y -= 1
    })
    if (bits !== had) {
      this.medals[key] = bits
      this.keepMeta()
    }
  }

  /** The board's tune, the boss theme, the Bay's or the story's; none in the attract demo. */
  get music(): MusicLoop | null {
    if (this.demo || this.over || this.offer || this.result) return null
    if (this.menu) return BAY_MUSIC
    if (this.story && this.ending)
      return this.story.scene.id === 'true-ending'
        ? this.board.music
        : ENDING_MUSIC
    if (this.story) return STORY_MUSIC
    if (this.bay) return BAY_MUSIC
    if (this.boss) return this.boss.music
    return this.tune ?? this.board.music
  }

  // --- the campaign ---------------------------------------------------------------

  private currentStep(): Step {
    return this.steps[this.stepIndex]!
  }

  private startStep() {
    const step = this.currentStep()
    this.card = null
    this.story = null
    this.ending = false
    this.bay = null
    this.boss = null
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
      case 'ending':
        // The campaign is cleared: Overclocked opens.
        this.story = { scene: sceneById(step.id), t: 0 }
        this.ending = true
        // Recorded the moment the ending starts, so leaving during the credits keeps it.
        if (!this.demo) {
          this.overclocked = true
          this.keepMeta()
        }
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
    if (this.mode === 'classic') return this.nextClassic()
    this.stepIndex++
    // The secret board and its true ending open only with all six golden bolts.
    while (
      this.stepIndex < this.steps.length &&
      secretStep(this.currentStepAt(this.stepIndex)) &&
      this.golden.length < 6
    )
      this.stepIndex++
    if (this.stepIndex >= this.steps.length) {
      // Round the grid again, Overclocked: the late tables from the first maze.
      this.stepIndex = 0
      this.lap++
    }
    const step = this.currentStep()
    if (step.kind === 'card' || step.kind === 'maze' || step.kind === 'boss')
      this.level++
    this.startStep()
    if (this.stepIndex === 0 && this.lap > 0)
      this.banner = {
        text: 'OVERCLOCKED!',
        sub: 'THE GRID RUNS HOT',
        ticks: 150,
      }
  }

  private currentStepAt(i: number): Step {
    return this.steps[i]!
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
      overclocked: this.overclocked,
      medals: { ...this.medals },
      rushBest: this.rushBest,
    }
  }

  /** Pick a saved run back up at the start of its board. */
  private resumeFrom(s: BatterySave) {
    this.mode = s.lap > 0 ? 'overclocked' : 'campaign'
    this.score = s.continued ? 0 : s.score
    this.lives = s.continued
      ? this.coop()
        ? COOP_LIVES
        : START_LIVES
      : Math.max(s.lives, this.coop() ? 2 : 1)
    this.nextExtra =
      (Math.floor(this.score / EXTRA_LIFE_AT) + 1) * EXTRA_LIFE_AT
    this.bolts = s.bolts
    this.flipBonus = s.flipBonus
    this.startMagnet = s.startMagnet
    this.hint = s.hint
    this.golden = [...s.golden]
    this.overclocked = s.overclocked === true
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
      ? {
          caught: 0,
          spawned: 0,
          next: PARADE.first,
          done: false,
          failed: false,
          toast: null,
        }
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
    const heat = bossHeat(phase, this.lap)
    const id = PHASES[phase - 1]!.boss
    if (id === 'train') {
      this.theme = boardTheme({
        wall: 'steel',
        neon: 'pink',
        floor: 'night',
        pattern: 'rivets',
      })
      this.loadMaze(mazeOf(TRAIN.layout), heat, [])
      this.boss = new GlitchTrain(this.maze.dockExit, TRAIN)
      this.banner = {
        text: 'THE GLITCH TRAIN!',
        sub: 'GRAB A CELL, BUMP THE CABOOSE',
        ticks: 180,
      }
    } else if (id === 'overload') {
      this.theme = boardTheme({
        wall: 'night',
        neon: 'ember',
        floor: 'night',
        pattern: 'tiles',
      })
      this.loadMaze(mazeOf(OVERLOAD.layout), heat, [])
      this.boss = new Overload(OVERLOAD)
      this.banner = {
        text: 'THE OVERLOAD!',
        sub: 'WATCH THE LINES LIGHT UP',
        ticks: 180,
      }
    } else {
      this.theme = boardTheme({ wall: 'pink', neon: 'gold', pattern: 'rivets' })
      this.loadMaze(mazeOf(MAMA.layout), heat, [])
      this.boss = new GremlinMama(MAMA)
      this.banner = {
        text: 'GREMLIN MAMA!',
        sub: 'EAT SPARKS TO WAKE HER UP',
        ticks: 180,
      }
    }
    this.bossWorld = this.makeBossWorld()
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
    this.vineGrown.clear()
    this.vineTimer = 0
    this.bloomed.clear()
    this.ice = new Set(maze.ice.map((t) => `${t.x},${t.y}`))
    this.lit = new Set(
      this.spec?.special === 'lamp-lighter'
        ? []
        : maze.lamps.map((t) => `${t.x},${t.y}`),
    )
    this.unlocked = false
    this.panelBack.clear()
    this.mirrorTimer = 0
    this.thorns.clear()
    this.crackle.clear()
    this.gardenTimer = 0
    this.refreshGates()
    this.flips = this.maxFlips()
    this.prizes = []
    this.prizesRolled = 0
    this.prizesCaught = 0
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
    this.robots = [newRobot(0, m.start)]
    if (this.coop()) {
      // The second robot starts a step or two along the same corridor.
      const open = (x: number) => !'#-G'.includes(m.rows[m.start.y]?.[x] ?? '#')
      const x = open(m.start.x + 2)
        ? m.start.x + 2
        : open(m.start.x - 2)
          ? m.start.x - 2
          : m.start.x
      this.robots.push(newRobot(1, { x, y: m.start.y }))
      this.robots[1]!.dir = RIGHT
      this.robots[1]!.want = RIGHT
    }
    this.cur = 0
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
        from: null,
        sulky: false,
      }
    })
    if (this.mode === 'tag')
      this.gremlins.forEach((g, i) => {
        if (i >= this.seats - 1) return
        g.seat = i + 1
        g.want = LEFT
        if (g.state === 'docked') g.state = 'leaving'
      })
    // Twins work as a pair: the first races ahead, the second cuts off the retreat.
    let twins = 0
    for (const g of this.gremlins)
      if (g.kind === 'twin') g.mind.side = (twins++ % 2) as 0 | 1
    this.modeIndex = 0
    this.modeTimer = this.row.schedule[0] ?? Infinity
    this.chasing = false
    this.sleepyTimer = 0
    this.chain = 0
    this.released = 0
    this.sparksSinceRelease = 0
    this.idleTicks = 0
    this.decoy = null
    this.boss?.reset()
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
        const wx = this.wrapX(x)
        const c = this.maze.rows[y]?.[wx]
        if (!c || c === '#' || c === '-' || c === 'G' || c === '{' || c === '}')
          return false
        if (!this.maze.tunnelRows.includes(y) && (x < 0 || x >= this.maze.cols))
          return false
        return !this.blocked.has(`${wx},${y}`)
      },
      hurt: () => {
        if (this.robot.shield <= 0 && this.dying === 0) this.lose()
      },
      switches: () => this.maze.switches,
      flip: (i) => {
        if (!this.maze.switches[i]) return
        this.flips++
        this.flip(i)
      },
      tunnel: (x, y) => this.inTunnel({ x, y }),
      ahead: () => this.junctionAlong(this.robot.dir),
      behind: () => this.junctionAlong(opposite(this.robot.dir)),
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
          from: null,
          sulky: false,
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
    for (const [key, grown] of this.vineGrown)
      if (grown >= 1) this.blocked.add(key)
    for (const f of this.maze.flowers) {
      const key = `${f.x},${f.y}`
      if (!this.bloomed.has(key)) this.blocked.add(key)
    }
    if (!this.unlocked)
      for (const k of this.maze.locks) this.blocked.add(`${k.x},${k.y}`)
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

  update(input: InputFrame, players?: InputFrame[]) {
    this.cur = 0
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
    if (this.result) {
      const r = this.result
      r.t++
      if (
        r.t >= TAG.resultTicks ||
        (r.t > 60 && (controls.pressed.a || controls.pressed.start))
      )
        this.over = true
      return
    }
    if (this.offer) {
      if (controls.pressed.a || controls.pressed.start) {
        const s = this.offer
        this.offer = null
        this.resumeFrom(s)
      } else if (controls.pressed.b) {
        // Something else: the menu (the saved run stays saved until a new campaign starts).
        this.offer = null
        this.openMenu()
      }
      return
    }
    if (this.menu) {
      this.updateMenu(controls)
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
        if (this.lives <= 0 && this.mode === 'tag') {
          this.showResult('GREMLINS WIN!', [
            `TAGGED ${TAG.lives} TIMES`,
            `ROBOT SCORE ${this.score}`,
          ])
        } else if (this.lives <= 0) {
          this.over = true
          this.banner = { text: 'GAME OVER', ticks: 9999 }
          if (this.save && this.campaignMode())
            this.save = { ...this.save, continued: true }
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
    this.eachRobot((r) => {
      const frame =
        r.seat === 0
          ? controls
          : this.demo
            ? this.demoInput()
            : (players?.[r.seat] ?? emptyInput())
      if (frame.held.up) r.want = UP
      else if (frame.held.down) r.want = DOWN
      else if (frame.held.left) r.want = LEFT
      else if (frame.held.right) r.want = RIGHT
      if (frame.pressed.a) this.tryFlip()
    })
    if (this.mode === 'tag' && !this.demo) this.steerGremlins(players)
    this.updateDown()

    this.updateToast()
    this.updateBoard()
    this.updateModes()
    this.updatePower()
    this.eachRobot(() => {
      this.moveRobot()
      this.eat()
    })
    this.release()
    const frozen = this.power?.kind === 'freeze'
    for (const gremlin of this.gremlins) {
      if (frozen && gremlin.state === 'roaming') continue
      // Each gremlin goes after the robot nearest it.
      this.cur = this.nearestRobot(gremlin)
      const view = this.huntView()
      if (gremlin.state === 'roaming' && !gremlin.sleepy && !gremlin.seat) {
        HUNTERS[gremlin.kind].sense?.(gremlin, view)
        this.gremlinTricks(gremlin)
      }
      this.moveGremlin(gremlin, view)
    }
    this.cur = Math.max(
      0,
      this.robots.findIndex((r) => r.down === 0),
    )
    if (this.boss && this.bossWorld) this.boss.update(this.bossWorld)
    this.cur = 0
    this.eachRobot(() => this.moveTrain())
    this.eachRobot(() => this.collide())
    this.updatePrizes()
    this.updateSpecial()
    if (this.rush) {
      this.updateRushHour()
      return
    }

    const cleared = this.boss
      ? this.boss.done
      : this.sparks.size === 0 && this.cells.size === 0
    if (cleared && this.dying === 0 && this.mode === 'tag') {
      this.showResult('ROBOT WINS!', [
        'THE MAZE IS CHARGED',
        `SCORE ${this.score}`,
      ])
      return
    }
    if (cleared && this.dying === 0) this.clearMaze()
  }

  /** Caught co-op robots wait for a partner's touch; too long, and it costs a life. */
  private updateDown() {
    if (this.robots.length < 2) return
    for (const r of this.robots) {
      if (r.down <= 0) continue
      const partner = this.robots.find((o) => o !== r && o.down === 0)
      if (
        partner &&
        Math.abs(partner.x - r.x) < 0.8 &&
        Math.abs(partner.y - r.y) < 0.8
      ) {
        r.down = 0
        r.shield = 90
        this.sparkle(r.x, r.y, 18, ROBOT_SPARKS, 1.8)
        this.sound.play('extra')
        this.banner = { text: 'REVIVED!', ticks: 60 }
        continue
      }
      if (--r.down > 0) continue
      if (this.rush || this.lives > 1) {
        // Too long: it costs a robot, and this one rolls back in from the start.
        if (!this.rush) this.lives--
        const start = this.maze.start
        Object.assign(r, { x: start.x, y: start.y, shield: 120, down: 0 })
        r.history = [{ ...start }]
        r.trail = [{ ...start }]
      } else r.down = 1
    }
  }

  /** The maze is charged (or the boss is home): bolts for what went well, then on. */
  private clearMaze() {
    this.eachRobot(() => this.endTrain(true))
    this.clearing = 120
    this.sound.play('level')
    this.awardMedals()
    if (!this.campaignMode()) {
      this.banner = {
        text: 'MAZE CHARGED!',
        sub: this.mazeLost ? undefined : 'CLEAN CHARGE!',
        ticks: 120,
      }
      return
    }
    const sp = this.special
    if (this.spec?.special === 'thaw' && sp && !sp.failed && !sp.done) {
      sp.done = true
      this.earn(BOLT_AWARDS.special)
      if (this.goldenBolt && !this.mazeLost && !this.demo) {
        this.golden.push(this.board.id)
        this.keepMeta()
        this.addScore(GOLDEN_POINTS)
        this.goldenBolt = null
      }
    }
    let bolts = this.boss ? BOLT_AWARDS.boss : BOLT_AWARDS.maze
    if (!this.mazeLost) bolts += BOLT_AWARDS.clean
    if (this.mazeFullTrain) bolts += BOLT_AWARDS.fullTrain
    this.earn(bolts)
    if (this.boss) {
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
    if (this.demo || !this.campaignMode()) return
    this.bolts += bolts
  }

  private updateModes() {
    for (const r of this.robots) if (r.shield > 0) r.shield--
    if (this.sleepyTimer > 0) {
      this.sleepyTimer--
      if (this.sleepyTimer === 0) {
        for (const g of this.gremlins) g.sleepy = false
        this.eachRobot(() => this.endTrain(true))
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
    if (!beat || this.boss) return 'down'
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
        const occupied = [...this.robots, ...this.gremlins].some(
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

  // --- Power Phases 2 and 3: vines, flowers, fans, lamps, panels, mirrors ----------------

  private sunny(): boolean {
    const sun = this.board.sun
    if (!sun || this.boss) return false
    if (this.spec?.special === 'sunset-charge')
      return this.mazeTick < SUNSET.day
    return this.mazeTick % (sun.day + sun.night) < sun.day
  }

  private fanOn(): boolean {
    const fans = this.board.fans
    if (!fans || this.boss) return false
    return this.mazeTick % (fans.on + fans.off) < fans.on
  }

  private darkness(): boolean {
    return !!this.board.dark && !this.boss
  }

  /** Every tick: vines grow, beds bloom, panels shine, mirrors turn, thorns and crackle fade. */
  private updateBoard() {
    const m = this.maze
    let changed = false
    // Vines: one buds, then grows, every so often (never onto anyone); a watering can stops them.
    const vines = this.board.vines
    if (vines && m.vines.length && this.power?.kind !== 'can') {
      const every =
        this.spec?.special === 'bloom-run' ? BLOOM_VINES : vines.every
      if (++this.vineTimer >= every) {
        this.vineTimer = 0
        const waiting = m.vines.filter(
          (v) => !this.vineGrown.has(`${v.x},${v.y}`),
        )
        if (waiting.length) {
          const v = waiting[Math.floor(this.rng() * waiting.length)]!
          this.vineGrown.set(`${v.x},${v.y}`, 0)
        }
      }
      for (const [key, grown] of this.vineGrown) {
        if (grown >= 1) continue
        const next = grown + 1 / vines.bud
        if (next < 1) {
          this.vineGrown.set(key, next)
          continue
        }
        const occupied = [...this.robots, ...this.gremlins].some(
          (a) => this.key(a.x, a.y) === key,
        )
        if (!occupied) {
          this.vineGrown.set(key, 1)
          changed = true
        }
      }
    }
    // Flower gates bloom once their beds are eaten.
    for (const f of m.flowers) {
      const key = `${f.x},${f.y}`
      if (this.bloomed.has(key)) continue
      if (f.bed.every((b) => !this.sparks.has(`${b.x},${b.y}`))) {
        this.bloomed.add(key)
        changed = true
        this.sparkle(
          f.x,
          f.y,
          14,
          [RAMPS.pink[3], RAMPS.leaf[3], '#ffffff'],
          1.6,
        )
        this.sound.play('pickup')
        if (this.spec?.special === 'bloom-run' && this.special)
          this.special.caught++
      }
    }
    // Mirror junctions turn on the clock.
    const mirrors = this.board.mirrors
    if (
      mirrors &&
      m.switches.some((sw) => sw.auto) &&
      ++this.mirrorTimer >= mirrors
    ) {
      this.mirrorTimer = 0
      m.switches.forEach((sw, i) => {
        if (!sw.auto) return
        this.switchState[i] = this.switchState[i] === 0 ? 1 : 0
        for (const gate of sw.gates)
          this.sparkle(gate.x, gate.y, 4, [RAMPS.sky[4]], 0.8)
      })
      changed = true
    }
    if (changed) {
      this.refreshGates()
      this.turnBack()
    }
    // Panels' sparks come back in the sun.
    if (this.board.sun) {
      const sunny = this.sunny()
      for (const [key, t] of this.panelBack) {
        if (!sunny) continue
        if (t > 1) this.panelBack.set(key, t - 1)
        else {
          this.panelBack.delete(key)
          if (!this.sparks.has(key)) {
            this.sparks.add(key)
            this.totalSparks++
          }
        }
      }
    }
    // Thorns and crackle fade.
    for (const [key, t] of this.thorns)
      if (t <= 1) this.thorns.delete(key)
      else this.thorns.set(key, t - 1)
    for (const [key, t] of this.crackle)
      if (t <= 1) this.crackle.delete(key)
      else this.crackle.set(key, t - 1)
    // Prizes rain on the Battery Garden.
    if (this.board.secret && ++this.gardenTimer >= GARDEN_PRIZE_EVERY) {
      this.gardenTimer = 0
      if (this.prizes.length < 3)
        this.spawnPrize(
          Math.floor(this.rng() * PRIZES.length),
          PRIZE_WANDER_TICKS,
          false,
        )
    }
  }

  /** How ice and wind under `actor` change its pace. */
  private terrainPace(actor: { x: number; y: number }, dir: Dir): number {
    let pace = 1
    const key = this.key(actor.x, actor.y)
    if (this.ice.has(key)) pace *= ICE_PACE
    if (this.fanOn()) {
      const y = Math.round(actor.y)
      const fan = this.maze.fans.find((f) => f.row === y)
      if (fan && dir.x) pace *= dir.x === fan.dir ? WIND_WITH : WIND_AGAINST
    }
    return pace
  }

  /** The robot may not walk into thorns. */
  private robotCan(x: number, y: number, dir: Dir): boolean {
    if (!this.canMove(x, y, dir)) return false
    if (!this.thorns.size) return true
    const nx = this.wrapX(Math.round(x) + dir.x)
    return !this.thorns.has(`${nx},${Math.round(y) + dir.y}`)
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
      BASE_SPEED *
      pace *
      turbo *
      this.conveyorPace(this.robot, this.robot.dir) *
      this.terrainPace(this.robot, this.robot.dir)
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
    const tx = Math.round(robot.x)
    const ty = Math.round(robot.y)
    // On ice there's no stopping and no turning back: only junctions let you choose.
    const onIce = this.ice.has(this.key(tx, ty))
    if (!onIce && sameDir(robot.want, opposite(robot.dir)))
      robot.dir = robot.want
    const along = robot.dir.x ? robot.x - tx : robot.y - ty
    const side = robot.dir.x ? robot.y - ty : robot.x - tx
    const perpendicular =
      !sameDir(robot.want, robot.dir) &&
      !sameDir(robot.want, opposite(robot.dir))
    if (
      perpendicular &&
      Math.abs(along) <= CORNER_WINDOW &&
      Math.abs(side) < 1e-6 &&
      this.robotCan(tx, ty, robot.want) &&
      (!onIce || this.exits(tx, ty) >= 3)
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
    const slide =
      onIce &&
      ahead >= -1e-6 &&
      !this.robotCan(cx, cy, robot.dir) &&
      DIRS.find(
        (d) => !sameDir(d, opposite(robot.dir)) && this.robotCan(cx, cy, d),
      )
    if (slide) {
      // Sliding round an icy bend.
      if (robot.dir.x) robot.x = cx
      else robot.y = cy
      robot.dir = slide
    } else if (ahead >= -1e-6 && !this.robotCan(cx, cy, robot.dir)) {
      // Blocked: settle on the centre and wait for a way on.
      if (robot.dir.x) robot.x = cx
      else robot.y = cy
      robot.mouth = 0.6
    } else if (
      ahead < -1e-6 &&
      ahead + speed >= 0 &&
      !this.robotCan(cx, cy, robot.dir)
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
    const i = this.maze.switches.findIndex(
      (s) => s.x === tx && s.y === ty && !s.auto,
    )
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
    const mama = this.boss instanceof GremlinMama ? this.boss : null
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
      this.ateAt(key)
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

  /** What eating the spark at `key` sets off: a lamp relit, a panel banked, ice melting. */
  private ateAt(key: string) {
    const [x, y] = key.split(',').map(Number) as [number, number]
    const sp = this.special
    for (const lamp of this.maze.lamps) {
      const lk = `${lamp.x},${lamp.y}`
      if (this.lit.has(lk)) continue
      if (Math.abs(lamp.x - x) + Math.abs(lamp.y - y) > LAMP_REACH) continue
      this.lit.add(lk)
      this.sparkle(lamp.x, lamp.y, 12, [RAMPS.pink[3], RAMPS.gold[4]], 1.4)
      this.sound.play('pickup')
      if (this.spec?.special === 'lamp-lighter' && sp) sp.caught++
    }
    if (this.maze.panels.some((p) => p.x === x && p.y === y)) {
      if (this.sunny()) {
        this.panelBack.set(key, this.board.sun?.respawn ?? 360)
        if (this.spec?.special === 'sunset-charge' && sp && !sp.failed)
          sp.caught++
      }
    }
    if (this.spec?.special === 'thaw' && this.ice.delete(key))
      this.sparkle(x, y, 4, [RAMPS.sky[4], '#ffffff'], 0.8)
  }

  /** A spark eaten, by the robot or a friend on its train. */
  private chomp(x: number, y: number) {
    if (this.rush) this.rush.unbanked++
    else this.addScore(10)
    this.eaten++
    this.sparkle(x, y, 3, SPARK_COLOURS, 0.8)
  }

  /** A power cell: the gremlins go sleepy (or, at heat 20, a shield cell). Flips refill. */
  private powerUp() {
    this.flips = this.maxFlips()
    const ticks = this.boss ? this.boss.napTicks : this.row.sleepyTicks
    for (const g of this.gremlins) {
      if (g.state === 'roaming') g.dir = opposite(g.dir)
    }
    if (ticks <= 0) {
      for (const r of this.robots) if (r.down === 0) r.shield = SHIELD_TICKS
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
    if (this.power?.kind === 'magnet' && this.tick % 3 === 0)
      this.eachRobot(() => this.pullSpark())
    this.rollPower()
  }

  /** The magnet pulls in the nearest spark within reach of the current robot. */
  private pullSpark() {
    {
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
  }

  /** Now and then a power-up rolls out of the dock, and wanders until it is eaten. */
  private rollPower() {
    if (this.boss) return
    // Now and then a power-up rolls out of the dock.
    if (!this.powerItem && this.mazeTick >= this.powerNext) {
      this.powerNext = this.mazeTick + POWER_UP_ROLL.every
      const exit = this.maze.dockExit
      const tool = this.board.tool
      const pick = Math.floor(this.rng() * POWER_UP_KINDS.length)
      this.powerItem = {
        kind: tool && this.rng() < TOOL_CHANCE ? tool : POWER_UP_KINDS[pick]!,
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
      if (item.kind === 'can') {
        // The vines wither.
        for (const key of this.vineGrown.keys()) {
          const [x, y] = key.split(',').map(Number) as [number, number]
          this.sparkle(x, y, 6, [RAMPS.leaf[3], RAMPS.sky[4]], 1)
        }
        this.vineGrown.clear()
        this.vineTimer = 0
        this.refreshGates()
      }
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

  /** Whether any robot still up is touching `w`. */
  private touchingRobot(w: { x: number; y: number }) {
    return this.robots.some((r) => {
      if (r.down > 0) return false
      const dx = Math.abs(w.x - r.x)
      return (
        Math.min(dx, this.maze.cols - dx) < 0.75 && Math.abs(w.y - r.y) < 0.75
      )
    })
  }

  /** Whether any robot still up stands on this tile. */
  private robotOn(key: string) {
    return this.robots.some((r) => r.down === 0 && this.key(r.x, r.y) === key)
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
      stick: r.want,
      junction: (at) => this.exits(at.x, at.y) >= 3,
      hopAcross: (from) => {
        for (const d of DIRS) {
          if (!this.isWall(from.x + d.x, from.y + d.y)) continue
          const land = { x: this.wrapX(from.x + d.x * 2), y: from.y + d.y * 2 }
          const cell = this.maze.rows[land.y]?.[land.x]
          if (
            !cell ||
            cell === 'G' ||
            cell === '-' ||
            this.isWall(land.x, land.y)
          )
            continue
          if (Math.hypot(land.x - r.x, land.y - r.y) <= 2) return land
        }
        return null
      },
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
    if (g.state === 'eyes')
      return g.sulky
        ? FRIEND_HOME_SPEED * 0.7
        : g.friendly
          ? FRIEND_HOME_SPEED
          : EYES_SPEED
    const r = this.row
    if (this.inTunnel(g)) return BASE_SPEED * r.tunnel
    if (g.sleepy) return BASE_SPEED * r.sleepyGremlin
    const boost = g.kind === 'chaser' ? OVERCLOCK_BOOST[this.overclock()] : 1
    const pace = HUNTERS[g.kind].pace?.(g) ?? 1
    return (
      BASE_SPEED *
      r.gremlin *
      boost *
      pace *
      this.conveyorPace(g, g.dir) *
      this.terrainPace(g, g.dir)
    )
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
          g.sulky = false
        }
      }
      return
    }

    const speed = this.gremlinSpeed(g)
    // A player's gremlin turns straight round when its player pulls back.
    if (
      g.seat &&
      g.state === 'roaming' &&
      g.want &&
      sameDir(g.want, opposite(g.dir))
    )
      g.dir = g.want
    if (this.atCentre(g)) this.chooseTurn(g, view)
    if (speed <= 0 || sameDir(g.dir, NONE)) return
    if (this.step(g, g.dir, speed)) {
      this.snap(g)
      if (g.state === 'roaming') this.leaveMark(g)
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

  /** A bramble leaves thorns on the tile behind it; static leaves crackle where it walks. */
  private leaveMark(g: Gremlin) {
    const here = { x: this.wrapX(g.x), y: g.y }
    if (g.kind === 'static')
      this.crackle.set(`${here.x},${here.y}`, CRACKLE_TICKS)
    if (HUNTERS[g.kind].thorns && g.from && !g.sleepy) {
      const key = `${g.from.x},${g.from.y}`
      if (!this.robotOn(key)) this.thorns.set(key, THORN_TICKS)
    }
    g.from = here
  }

  /** Each tick for a hunting gremlin: a blinker's hop, a snowball rolling in the wind. */
  private gremlinTricks(g: Gremlin) {
    const m = g.mind
    if (g.kind === 'blinker' && m.goal && m.blink === 0) {
      // Hop through the wall.
      this.sparkle(g.x, g.y, 8, [RAMPS.steel[4], RAMPS.gold[3]], 1.2)
      g.x = m.goal.x
      g.y = m.goal.y
      g.from = null
      m.goal = null
      m.cool = BLINK.rest
      this.sparkle(g.x, g.y, 8, [RAMPS.steel[4], RAMPS.gold[3]], 1.2)
      this.sound.play('warn')
    }
    if (g.kind === 'snowball') {
      const fan = this.fanOn()
        ? this.maze.fans.find((f) => f.row === Math.round(g.y))
        : null
      m.rolling = !!fan && g.dir.x === fan.dir
      m.size = m.rolling
        ? Math.min(3, m.size + 0.012)
        : Math.max(0, m.size - 0.01)
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
    if (g.seat && g.state === 'roaming') {
      // A player's gremlin: where its stick says, else straight on (the hunt only at a wall).
      if (g.want && this.canMove(g.x, g.y, g.want)) {
        g.dir = g.want
        return
      }
      if (!sameDir(g.dir, NONE) && this.canMove(g.x, g.y, g.dir)) return
      g.dir = NONE
      return
    }
    const hunter = HUNTERS[g.kind]
    if (hunter.steer && g.state === 'roaming' && !g.sleepy && !this.decoy) {
      // A copycat goes where it's steered, or stands still.
      const d = hunter.steer(g, view)
      if (d && this.canMove(g.x, g.y, d)) g.dir = d
      else if (sameDir(g.dir, NONE) || !this.canMove(g.x, g.y, g.dir))
        g.dir = NONE
      return
    }
    if (sameDir(g.dir, NONE)) g.dir = LEFT
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
    const touch = this.boss?.contact(r.x, r.y)
    if (touch === 'bump') {
      this.boss!.bump(this.bossWorld!, r.x, r.y)
      this.pause = 30
      return
    }
    if (touch === 'hurt' && r.shield <= 0) return this.lose()
    for (const g of this.gremlins) {
      if (g.state !== 'roaming') continue
      const dx = Math.abs(g.x - r.x)
      const wrapDx = Math.min(dx, cols - dx)
      const reach = g.kind === 'snowball' ? 0.6 + g.mind.size * 0.15 : 0.6
      if (wrapDx >= reach || Math.abs(g.y - r.y) >= reach) continue
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
        const partner = this.robots.find(
          (o) => o !== this.robot && o.down === 0,
        )
        if (
          partner &&
          Math.hypot(partner.x - g.x, partner.y - g.y) <= PAIR_RANGE
        ) {
          // Both robots on it at once: a Pair Bonus.
          this.addScore(PAIR_BONUS, g.x, g.y - 1)
          this.banner = { text: 'PAIR BONUS!', ticks: 70 }
        }
        if (g.kind === 'baby') {
          // A baby just pops home in a puff.
          this.gremlins = this.gremlins.filter((x) => x !== g)
          return
        }
        g.state = 'friend'
        g.sleepy = false
        const side = g.mind.side
        g.mind = freshMind()
        g.mind.side = side
        g.hop = { x: g.x, y: g.y, t: 0 }
        this.train.push(g)
        this.rebooted(g)
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

  /** Rebooting a gatekeeper opens the shortcuts; rebooting a twin sends the other home sulking. */
  private rebooted(g: Gremlin) {
    if (g.kind === 'gatekeeper' && !this.unlocked && this.maze.locks.length) {
      this.unlocked = true
      for (const k of this.maze.locks)
        this.sparkle(k.x, k.y, 12, [RAMPS.gold[4]], 1.4)
      this.refreshGates()
      this.banner = { text: 'SHORTCUTS OPEN!', ticks: 90 }
    }
    if (g.kind === 'twin')
      for (const other of this.gremlins) {
        if (other === g || other.kind !== 'twin' || other.state !== 'roaming')
          continue
        other.state = 'eyes'
        other.sleepy = false
        other.friendly = true
        other.sulky = true
        other.x = this.wrapX(Math.round(other.x))
        other.y = Math.round(other.y)
      }
  }

  private lose() {
    const r = this.robot
    if (this.robots.some((o) => o !== r && o.down === 0)) {
      // Co-op: a flickering spark bot until the partner revives it.
      this.endTrain(false)
      r.down = REVIVE_TICKS
      r.shield = 0
      this.mazeLost = true
      this.sparkle(r.x, r.y, 16, ROBOT_SPARKS, 2)
      this.sound.play('die')
      return
    }
    if (this.rush) {
      if (this.rush.unbanked > 0)
        this.floaters.push({
          x: r.x,
          y: r.y - 1,
          text: 'SPARKS SPILLED!',
          life: 90,
        })
      this.rush.unbanked = 0
    } else this.lives--
    this.dying = 110
    this.mazeLost = true
    this.prizes = this.prizes.filter((p) => p.parade)
    this.power = null
    this.decoy = null
    this.endTrain(false)
    if (this.boss)
      this.gremlins = this.gremlins.filter((g) => g.kind !== 'baby')
    this.sound.play('die')
  }

  // --- roaming prizes and special mazes ----------------------------------------------

  /** Twice a maze a prize rolls in from a tunnel (or the dock) and wanders about. */
  private rollPrize() {
    if (this.special || this.boss) return
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
      else this.prizesCaught++
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
    if (sp && !sp.done && !sp.failed) {
      const lost =
        (kind === 'bloom-run' &&
          this.maze.vines.length > 0 &&
          [...this.vineGrown.values()].filter((g) => g >= 1).length >=
            this.maze.vines.length) ||
        (kind === 'thaw' && this.mazeTick >= THAW_TICKS) ||
        (kind === 'sunset-charge' && this.mazeTick >= SUNSET.day)
      if (lost) {
        sp.failed = true
        this.banner = {
          text:
            kind === 'bloom-run'
              ? 'THE VINES WIN!'
              : kind === 'thaw'
                ? 'THE FREEZER SHUTS!'
                : 'THE SUN SETS!',
          sub: 'NO GOLDEN BOLT THIS TIME',
          ticks: 120,
        }
        this.sound.play('warn')
      }
    }
    if (
      sp &&
      kind &&
      kind !== 'thaw' &&
      !sp.done &&
      !sp.failed &&
      sp.caught >= SPECIALS[kind].target
    ) {
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
    if (gb?.shown && this.robotOn(`${gb.at.x},${gb.at.y}`)) {
      this.goldenBolt = null
      if (!this.demo) {
        this.golden.push(this.board.id)
        this.keepMeta()
      }
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
      if (this.robotOn(`${t.at.x},${t.at.y}`)) {
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
    if (
      this.offer ||
      this.menu ||
      this.result ||
      this.card ||
      this.story ||
      this.bay
    ) {
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
    const plan =
      this.boss && this.bossWorld ? this.boss.pilot(this.bossWorld) : null
    if (r.shield <= 0 && this.power?.kind !== 'freeze') {
      for (const g of this.gremlins) {
        if (g.state !== 'roaming' || g.sleepy) continue
        mark(Math.round(g.x), Math.round(g.y), g.kind === 'sprinter' ? 3 : 2)
      }
      for (const t of plan?.threats ?? []) mark(t.x, t.y, t.reach)
    }
    const goals = this.pilotGoals(plan)
    // Standing on a switch: throw it when a hunter is close, or when the plan says so.
    const onSwitch = this.maze.switches.some((s) => s.x === sx && s.y === sy)
    const panic = nearest <= 4 && !this.boss
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
        if (firstStep.has(key) || !this.robotCan(x, y, d)) continue
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

  /** What the pilot is after besides sparks: prizes, power-ups, and the boss's plan. */
  private pilotGoals(plan: PilotPlan | null): {
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
    // A partner down in co-op: go and revive it first.
    const partner = this.robots.find((o) => o !== this.robot && o.down > 0)
    if (partner)
      return {
        extra,
        only: new Set([
          `${this.wrapX(Math.round(partner.x))},${Math.round(partner.y)}`,
        ]),
        flip: false,
      }
    const bar = this.rush?.bar
    if (bar && this.rush!.unbanked >= 20)
      return { extra, only: new Set([`${bar.x},${bar.y}`]), flip: false }
    for (const lamp of this.maze.lamps)
      if (!this.lit.has(`${lamp.x},${lamp.y}`)) extra.add(`${lamp.x},${lamp.y}`)
    if (!plan?.goals) return { extra, only: null, flip: !!plan?.flip }
    const only = new Set(plan.goals.map((t) => `${this.wrapX(t.x)},${t.y}`))
    return { extra, only, flip: plan.flip }
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
      if (this.boss && this.bossWorld)
        for (const t of this.boss.pilot(this.bossWorld).threats)
          threats.push(Math.hypot(t.x - nx, t.y - ny) - t.reach)
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
    const lookId = this.boss
      ? `boss-${this.boss.id}`
      : this.campaignMode()
        ? this.board.id
        : `mode-${this.mode}`
    cachedLayer(
      g,
      `battery-maze-${this.maze.id}-${lookId}-${flash ? 'flash' : 'lit'}`,
      W,
      H,
      (k) => paintBoard(k, theme, this.maze),
    )
    for (const c of this.maze.conveyors) drawConveyor(g, c, c.dir, this.tick)
    this.renderBoardMechanics(g)
    this.renderToast(g)
    this.renderGates(g, theme.neon)
    this.renderSparks(g)
    this.renderCells(g)
    this.renderGolden(g)
    for (const p of this.prizes) this.renderPrize(g, p)
    if (this.powerItem) this.renderPowerItem(g, this.powerItem)
    if (this.rush?.bar) this.renderBar(g, this.rush.bar)
    if (this.decoy) {
      const cx = this.decoy.x * TILE + TILE / 2
      const cy = TOP + this.decoy.y * TILE + TILE / 2
      dropShadow(g, cx, cy + 7, 5, 1.5, 0.4)
      drawSprite(g, DECOY_SPRITE, cx, cy - 1.5)
    }
    if (!(this.dying > 0 && this.dying < 70)) {
      const hidden = this.hiddenGremlins()
      for (const gremlin of this.gremlins)
        if (gremlin.state !== 'friend' && !hidden.has(gremlin))
          this.renderGremlin(g, gremlin)
      for (const robot of this.robots)
        for (let i = robot.train.length - 1; i >= 0; i--)
          this.renderGremlin(g, robot.train[i]!)
      if (this.boss) this.renderBoss(g, this.boss)
    }
    for (const robot of this.robots) this.renderRobot(g, robot)
    this.renderShade(g)
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
    if (this.card && !this.menu) this.renderCard(g)
    if (this.bay) this.renderBay(g)
    if (this.offer) this.renderOffer(g, this.offer)
    if (this.menu) {
      if (this.menu.medals) this.renderMedals(g)
      else this.renderMenu(g, this.menu)
    }
    if (this.result) this.renderResult(g, this.result)
  }

  /** Rush Hour's battery bar: eat it to bank the sparks. */
  private renderBar(
    g: CanvasRenderingContext2D,
    bar: { x: number; y: number; ticks: number },
  ) {
    if (bar.ticks < 120 && Math.floor(bar.ticks / 6) % 2 === 0) return
    const cx = bar.x * TILE + TILE / 2
    const cy = TOP + bar.y * TILE + TILE / 2
    const ready = (this.rush?.unbanked ?? 0) > 0
    const pulse = 0.5 + Math.sin(this.tick / 6) * 0.15
    glow(g, cx, cy, 16, RAMPS.leaf[3], ready ? pulse : 0.25)
    dropShadow(g, cx, cy + 7, 7, 1.6, 0.4)
    g.fillStyle = INK
    g.fillRect(cx - 8, cy - 5, 15, 11)
    g.fillRect(cx + 7, cy - 2, 3, 5)
    g.fillStyle = RAMPS.gold[3]
    g.fillRect(cx - 7, cy - 4, 13, 9)
    g.fillRect(cx + 7, cy - 1, 2, 3)
    const fill = Math.floor(this.tick / 8) % 4
    for (let i = 0; i <= fill; i++) {
      g.fillStyle = i === fill ? RAMPS.leaf[4] : RAMPS.leaf[3]
      g.fillRect(cx - 6 + i * 3, cy - 3, 2, 7)
    }
    g.fillStyle = '#ffffff'
    g.fillRect(cx - 6, cy - 4, 4, 1)
    if (ready)
      drawText(g, 'BANK!', cx, cy - 17, {
        align: 'center',
        color: RAMPS.leaf[4],
        outline: INK,
      })
  }

  private renderMenu(
    g: CanvasRenderingContext2D,
    menu: { cursor: number; t: number },
  ) {
    g.fillStyle = 'rgba(7, 6, 26, 0.82)'
    g.fillRect(0, 0, W, H)
    const list = menuModes(this.seats, this.overclocked)
    const y = TOP + 40
    const h = 112 + list.length * 18
    hudPanel(g, 18, y, W - 36, h, RAMPS.purple)
    drawText(g, 'BATTERY MAZE', W / 2, y + 12, {
      scale: 2,
      align: 'center',
      color: RAMPS.gold[3],
      outline: INK,
      shadow: RAMPS.pink[1],
    })
    const who =
      this.seats >= 3
        ? `${this.seats} PLAYERS`
        : this.seats === 2
          ? '2 ROBOTS: CO-OP'
          : '1 ROBOT'
    drawText(g, who, W / 2, y + 34, {
      align: 'center',
      color: this.seats === 2 ? RAMPS.pink[3] : RAMPS.teal[3],
      outline: INK,
    })
    list.forEach((id, i) => {
      const on = i === menu.cursor
      const ly = y + 54 + i * 18
      if (on) {
        g.fillStyle = 'rgba(255, 255, 255, 0.08)'
        g.fillRect(30, ly - 4, W - 60, 16)
        if (Math.floor(menu.t / 15) % 2 === 0)
          drawSprite(g, LIFE_SPRITE, 42, ly + 3)
      }
      drawText(g, MODES[id].name, W / 2, ly, {
        align: 'center',
        color: on ? RAMPS.gold[4] : RAMPS.steel[4],
        outline: INK,
      })
    })
    const pick = list[menu.cursor] ?? 'campaign'
    const fy = y + 58 + list.length * 18
    drawText(g, MODES[pick].about, W / 2, fy, {
      align: 'center',
      color: RAMPS.teal[3],
      outline: INK,
    })
    const extra =
      pick === 'rush' && this.rushBest > 0
        ? `BEST ${this.rushBest}`
        : pick === 'tag' && this.seats < 4
          ? `${5 - this.seats} MORE GREMLINS ON AUTOPILOT`
          : ''
    if (extra)
      drawText(g, extra, W / 2, fy + 13, {
        align: 'center',
        color: RAMPS.gold[4],
        outline: INK,
      })
    drawText(g, 'A  PLAY     B  MEDALS', W / 2, y + h - 14, {
      align: 'center',
      color: RAMPS.leaf[3],
      outline: INK,
    })
  }

  /** The medal board: every campaign maze's three medals. */
  private renderMedals(g: CanvasRenderingContext2D) {
    g.fillStyle = 'rgba(7, 6, 26, 0.86)'
    g.fillRect(0, 0, W, H)
    const boards = BOARDS.filter(
      (b) =>
        !b.secret ||
        this.golden.length >= 6 ||
        b.mazes.some((_, i) => this.medals[`${b.id}:${i}`]),
    )
    const rowH = 24
    const y = TOP + 6
    const h = 70 + boards.length * rowH
    hudPanel(g, 10, y, W - 20, h, RAMPS.purple)
    let got = 0
    let total = 0
    for (const b of boards)
      b.mazes.forEach((_, i) => {
        const bits = this.medals[`${b.id}:${i}`] ?? 0
        for (const m of MEDALS) {
          total++
          if (bits & m.bit) got++
        }
      })
    drawText(g, 'MEDALS', W / 2, y + 10, {
      scale: 2,
      align: 'center',
      color: RAMPS.gold[3],
      outline: INK,
    })
    drawText(g, `${got}/${total}`, W - 22, y + 14, {
      align: 'right',
      color: RAMPS.gold[4],
      outline: INK,
    })
    const colours = [RAMPS.teal, RAMPS.pink, RAMPS.gold]
    boards.forEach((b, row) => {
      const ry = y + 34 + row * rowH
      drawText(g, `${b.number} ${b.name}`, 20, ry + 2, {
        color: RAMPS.steel[4],
        outline: INK,
      })
      b.mazes.forEach((_, i) => {
        const bits = this.medals[`${b.id}:${i}`] ?? 0
        const mx = 196 + i * 38
        g.fillStyle = INK
        g.fillRect(mx - 2, ry - 2, 34, 14)
        MEDALS.forEach((m, k) => {
          const on = (bits & m.bit) !== 0
          const ramp = colours[k]!
          g.fillStyle = on ? ramp[3] : RAMPS.steel[1]
          g.fillRect(mx + k * 10, ry, 8, 10)
          if (on) {
            g.fillStyle = ramp[4]
            g.fillRect(mx + k * 10, ry, 3, 3)
          }
        })
      })
    })
    const ly = y + h - 28
    MEDALS.forEach((m, k) => {
      const lx = 22 + k * 98
      g.fillStyle = colours[k]![3]
      g.fillRect(lx, ly, 7, 9)
      drawText(g, m.name, lx + 11, ly + 1, {
        color: colours[k]![4],
        outline: INK,
      })
    })
    drawText(g, 'B  BACK', W / 2, ly + 14, {
      align: 'center',
      color: RAMPS.leaf[3],
      outline: INK,
    })
  }

  /** Tag's winner, or Rush Hour's score. */
  private renderResult(
    g: CanvasRenderingContext2D,
    r: { text: string; lines: string[]; t: number },
  ) {
    g.fillStyle = `rgba(7, 6, 26, ${Math.min(0.8, r.t / 30)})`
    g.fillRect(0, 0, W, H)
    const y = TOP + 80
    const h = 64 + r.lines.length * 16
    hudPanel(g, 24, y, W - 48, h, RAMPS.purple)
    const gremlins = r.text.startsWith('GREMLINS')
    drawText(g, r.text, W / 2, y + 14, {
      scale: 2,
      align: 'center',
      color: gremlins ? RAMPS.pink[3] : RAMPS.gold[3],
      outline: INK,
      shadow: RAMPS.purple[1],
    })
    r.lines.forEach((line, i) =>
      drawText(g, line, W / 2, y + 40 + i * 16, {
        align: 'center',
        color: RAMPS.teal[3],
        outline: INK,
      }),
    )
  }

  /** In the dark, gremlins outside every light can't be seen. */
  private hiddenGremlins(): Set<Gremlin> {
    const out = new Set<Gremlin>()
    if (!this.darkness()) return out
    const dark = this.board.dark!
    const lights = [
      ...this.robots.map((r) => ({
        x: r.x,
        y: r.y,
        r: dark.robot * (this.power?.kind === 'lamp' ? 1.8 : 1),
      })),
      ...this.maze.lamps
        .filter((l) => this.lit.has(`${l.x},${l.y}`))
        .map((l) => ({ x: l.x, y: l.y, r: dark.lamp })),
    ]
    for (const g of this.gremlins)
      if (g.state === 'roaming' && !this.inLight(g, lights)) out.add(g)
    return out
  }

  /** Panels, ice, beds, thorns, crackle, vines, flower gates, locks, fans and lamps. */
  private renderBoardMechanics(g: CanvasRenderingContext2D) {
    const m = this.maze
    const sunny = this.sunny()
    for (const p of m.panels) drawPanel(g, p, sunny)
    for (const key of this.ice) {
      const [x, y] = key.split(',').map(Number) as [number, number]
      drawIce(g, { x, y }, this.tick)
    }
    for (const f of m.flowers)
      if (!this.bloomed.has(`${f.x},${f.y}`))
        for (const b of f.bed)
          if (this.sparks.has(`${b.x},${b.y}`)) drawBed(g, b)
    for (const [key, life] of this.thorns) {
      const [x, y] = key.split(',').map(Number) as [number, number]
      drawThorns(g, { x, y }, life)
    }
    for (const [key, life] of this.crackle) {
      const [x, y] = key.split(',').map(Number) as [number, number]
      drawCrackle(g, { x, y }, life, this.tick)
    }
    for (const [key, grown] of this.vineGrown) {
      const [x, y] = key.split(',').map(Number) as [number, number]
      drawVine(g, { x, y }, grown >= 1 ? 1 : 0, this.tick)
    }
    for (const f of m.flowers)
      drawFlowerGate(g, f, this.bloomed.has(`${f.x},${f.y}`), this.tick)
    if (!this.unlocked) for (const k of m.locks) drawLock(g, k)
    const on = this.fanOn()
    for (const fan of m.fans) drawFan(g, fan.row, fan.dir, on, this.tick)
    for (const lamp of m.lamps)
      drawLamp(g, lamp, this.lit.has(`${lamp.x},${lamp.y}`), this.tick)
  }

  /** Lights out in the arcade; night on the rooftop. */
  private renderShade(g: CanvasRenderingContext2D) {
    if (this.darkness()) {
      const dark = this.board.dark!
      const reach = dark.robot * (this.power?.kind === 'lamp' ? 1.8 : 1)
      const lights = this.robots.map((r) => ({ x: r.x, y: r.y, r: reach }))
      for (const lamp of this.maze.lamps)
        if (this.lit.has(`${lamp.x},${lamp.y}`))
          lights.push({ x: lamp.x, y: lamp.y, r: dark.lamp })
      drawDarkness(g, lights, 0.9)
      // Sparks glow faintly through the dark; gremlins' eyes glint (static's don't).
      for (const key of this.sparks) {
        const [x, y] = key.split(',').map(Number) as [number, number]
        g.fillStyle = 'rgba(253, 230, 138, 0.35)'
        g.fillRect(x * TILE + TILE / 2 - 1, TOP + y * TILE + TILE / 2 - 1, 2, 2)
      }
      for (const gr of this.gremlins) {
        if (gr.state !== 'roaming' || gr.kind === 'static') continue
        if (this.inLight(gr, lights)) continue
        const cx = gr.x * TILE + TILE / 2
        const cy = TOP + gr.y * TILE + TILE / 2
        g.fillStyle = gr.sleepy ? RAMPS.sky[4] : '#ffffff'
        g.fillRect(cx - 3, cy - 3, 2, 2)
        g.fillRect(cx + 2, cy - 3, 2, 2)
      }
      return
    }
    if (this.board.sun && !this.boss && !this.sunny()) {
      g.fillStyle = 'rgba(16, 24, 72, 0.38)'
      g.fillRect(0, TOP, W, this.maze.height * TILE)
    }
  }

  private inLight(
    at: { x: number; y: number },
    lights: ReadonlyArray<{ x: number; y: number; r: number }>,
  ): boolean {
    return lights.some((l) => Math.hypot(at.x - l.x, at.y - l.y) < l.r * 0.8)
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
      drawSwitch(g, s, this.switchState[i]!, this.flips > 0, this.tick, s.auto)
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
    pink = false,
  ) {
    const open = 0.15 + Math.abs(Math.sin(mouth)) * 0.55
    const frame = open < 0.3 ? 0 : open < 0.52 ? 1 : 2
    const face: Face = dir.y < 0 ? 'up' : dir.y > 0 ? 'down' : 'side'
    const frames = pink ? PINK_ROBOT_FRAMES : ROBOT_FRAMES
    drawSprite(g, frames[face][frame]!, cx, cy - 1.5 * scale, {
      flipX: dir.x < 0,
      scale,
    })
  }

  private renderRobot(g: CanvasRenderingContext2D, r: Robot) {
    const cx = r.x * TILE + TILE / 2
    const cy = TOP + r.y * TILE + TILE / 2
    const pink = r.seat === 1
    if (r.down > 0) {
      // A flickering spark bot, waiting for its partner's touch.
      if (Math.floor(this.tick / 4) % 3 === 0) return
      g.globalAlpha = 0.55
      this.drawRobot(g, cx, cy, UP, 0, 1, pink)
      g.globalAlpha = 1
      glow(g, cx, cy, 12, pink ? RAMPS.pink[3] : RAMPS.teal[3], 0.5)
      if (Math.floor(this.tick / 20) % 2 === 0)
        drawText(g, 'HELP!', cx, cy - 16, {
          align: 'center',
          color: RAMPS.gold[4],
          outline: INK,
        })
      return
    }
    if (this.dying > 0) {
      if (this.dying <= 30) return
      const p = 1 - (this.dying - 30) / 80
      if (p < 0.15) {
        this.drawRobot(g, cx, cy, r.dir, 0, 1, pink)
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
    this.drawRobot(g, cx, cy, r.dir, r.mouth, 1, pink)
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

    if (gremlin.state === 'eyes' && gremlin.sulky) {
      dropShadow(g, cx, cy + 8 * scale, 6 * scale, 1.8 * scale, 0.35)
      drawSprite(g, art.sleepy[step]!, cx, y, { flipX, scale, alpha: 0.8 })
      return
    }
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
    const grow =
      gremlin.kind === 'snowball' && !gremlin.sleepy
        ? 1 + Math.floor(gremlin.mind.size)
        : scale
    drawSprite(g, sprite, cx, y + crouch - (grow - 1) * 4, {
      flipX,
      scale: grow,
    })
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
    // Gremlin Tag: the seat steering it, so every player can find their gremlin.
    if (gremlin.seat && gremlin.state === 'roaming')
      drawText(g, `P${gremlin.seat + 1}`, cx, cy - 18, {
        align: 'center',
        color: gremlin.sleepy ? RAMPS.sky[4] : RAMPS.gold[4],
        outline: INK,
      })
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
    } else if (gremlin.kind === 'blinker' && m.blink > 0) {
      if (Math.floor(m.blink / 5) % 2 === 0)
        glow(g, cx, cy, 12, RAMPS.steel[4], 0.7)
    } else if (gremlin.kind === 'gatekeeper' && m.park > 0) {
      glow(g, cx, cy, 13, RAMPS.gold[3], 0.35)
    } else if (gremlin.kind === 'snacker' && m.snacks >= SNACKS_TO_OVERCLOCK) {
      glow(g, cx, cy, 11, RAMPS.ember[2], 0.45 + 0.2 * Math.sin(this.tick / 3))
    }
  }

  /** The boss: Mama, the Glitch Train or the Overload. */
  private renderBoss(g: CanvasRenderingContext2D, boss: BossMachine) {
    if (boss instanceof GremlinMama) this.renderMama(g, boss)
    else if (boss instanceof GlitchTrain) {
      for (const t of boss.trains) {
        const cars = boss.carsOf(t)
        for (let i = cars.length - 1; i >= 0; i--)
          drawTrainCar(
            g,
            cars[i]!.x,
            cars[i]!.y,
            boss.sleepy,
            i === cars.length - 1,
            this.tick,
          )
        this.renderGremlin(g, {
          kind: 'chaser',
          x: t.x,
          y: t.y,
          dir: t.dir,
          state: 'roaming',
          sleepy: boss.sleepy,
          corner: t,
          order: 0,
          pad: t,
          mind: freshMind(),
          friendly: false,
          hop: null,
          from: null,
          sulky: false,
        })
        if (boss.sleepy && !cars.length)
          glow(
            g,
            t.x * TILE + TILE / 2,
            TOP + t.y * TILE + TILE / 2,
            10,
            RAMPS.gold[4],
            0.5,
          )
      }
    } else if (boss instanceof Overload) {
      if (boss.surge)
        drawSurge(
          g,
          boss.surge.axis,
          boss.surge.at,
          boss.surgeLive(),
          this.tick,
        )
      const mood =
        boss.doneTicks >= 0
          ? 'calm'
          : boss.dazed > 0
            ? 'dazed'
            : boss.sleepy && boss.phase === 3
              ? 'sleepy'
              : 'angry'
      drawOverload(g, boss.x, boss.y, boss.plugs, mood, this.tick)
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
    const { scene, t } = story
    if (scene.sky === 'dawn') {
      g.fillStyle = 'rgba(251, 146, 60, 0.28)'
      g.fillRect(0, 0, W, STAGE_FLOOR + 4)
    } else drawStars(g, BREAK_STARS, this.tick)
    const titleW = Math.max(184, measureText(scene.title, 2) + 24)
    hudPanel(g, W / 2 - titleW / 2, TOP + 32, titleW, 26, RAMPS.purple)
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
        case 'cake':
        case 'snow':
        case 'dark':
        case 'sun':
        case 'flowers':
          drawProp(g, actor.cast, a.x, cy, a.scale, t)
          break
        case 'mama': {
          const frame = Math.floor(t / 9) % 2
          const art = a.pose === 'friend' ? MAMA_ART.friend : MAMA_ART.sleepy
          dropShadow(g, a.x, STAGE_FLOOR + 8, 12, 3, 0.4)
          drawSprite(g, art[frame]!, a.x, cy, { scale: 2, flipX: a.face < 0 })
          break
        }
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
          dropShadow(g, a.x, STAGE_FLOOR + 8, 6 * a.scale, 1.8, 0.4)
          drawSprite(g, sprite, a.x, cy - 1, {
            flipX: a.face < 0,
            scale: a.scale,
          })
        }
      }
    }
    if (scene.credits && t >= scene.credits.from) {
      // The credits roll up from the bottom.
      const rise = (t - scene.credits.from) * 0.35
      scene.credits.lines.forEach((line, i) => {
        const y = H + 10 + i * 18 - rise
        if (y < STAGE_FLOOR + 30 || y > H - 4) return
        drawText(g, line, W / 2, y, {
          align: 'center',
          color: i === 0 ? RAMPS.gold[3] : RAMPS.steel[4],
          outline: INK,
        })
      })
    }
    for (const c of scene.captions) {
      if (t < c.from || t >= c.to) continue
      drawText(g, c.text, W / 2, TOP + 200, {
        scale: measureText(c.text, 2) > W - 16 ? 1 : 2,
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
    drawText(
      g,
      b.secret ? 'THE SECRET BOARD' : `POWER PHASE ${b.phase}`,
      W / 2,
      y + 10,
      {
        align: 'center',
        color: RAMPS.gold[4],
        outline: INK,
      },
    )
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
    if (b.secret) return
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
      const cars = this.allFriends().length
      if (cars) tally(`TRAIN x${cars}`)
      else if (this.rush)
        tally(
          `x${this.rush.mult}  ${this.rush.unbanked} UNBANKED`,
          this.rush.unbanked ? RAMPS.gold : RAMPS.steel,
        )
      else if (kind && this.special)
        tally(
          this.specialTally(kind, this.special),
          this.special.failed ? RAMPS.steel : RAMPS.gold,
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
    const lives = this.rush ? 0 : Math.min(this.lives, 5)
    if (lives > 0) {
      hudPanel(g, 3, panelY, lives * 12 + 6, 15)
      for (let i = 0; i < lives; i++) {
        drawSprite(g, LIFE_SPRITE, 12 + i * 12, panelY + 7)
      }
    }
    const mazeNo = this.spec ? this.board.mazes.indexOf(this.spec) + 1 : 1
    const left = this.rush ? Math.max(0, RUSH_HOUR.ticks - this.rush.t) : 0
    const secs = Math.ceil(left / 60)
    const where = this.rush
      ? `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`
      : this.mode === 'tag'
        ? 'TAG'
        : this.mode === 'classic'
          ? `LEVEL ${this.level}`
          : this.boss
            ? 'BOSS'
            : `${this.board.number}-${mazeNo}`
    const bolts = this.campaignMode()
    const boltText = String(this.bolts)
    const rightW =
      measureText(where) + (bolts ? measureText(boltText) + 30 : 14)
    const rx = W - 3 - rightW
    hudPanel(g, rx, panelY, rightW, 15)
    if (bolts) {
      drawSprite(g, BOLT_ICON, rx + 8, panelY + 7)
      drawText(g, boltText, rx + 14, textY, {
        color: RAMPS.gold[4],
        outline: INK,
      })
    }
    drawText(g, where, W - 9, textY, {
      align: 'right',
      color: RAMPS.purple[3],
      outline: INK,
    })
    const gl = this.rush ? 3 : 76
    const gr = rx - 6
    if (gr - gl > 80) {
      hudPanel(g, gl, panelY, gr - gl, 15)
      const [label, amount, ramp] = this.gaugeReading()
      drawText(g, label, gl + 6, textY, { color: ramp[4], outline: INK })
      gauge(g, gl + 48, textY, gr - gl - 54, 7, amount, ramp)
    }

    if (this.banner && !this.card && !this.menu && !this.result) {
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

  /** A special maze's progress, for the HUD. */
  private specialTally(kind: SpecialKind, sp: SpecialRun): string {
    if (sp.failed) return 'NEXT TIME!'
    if (sp.done) return 'DONE!'
    const target = SPECIALS[kind].target
    switch (kind) {
      case 'prize-parade':
        return `PRIZES ${sp.caught}/${target}`
      case 'breakfast-rush':
        return `TOAST ${sp.caught}/${target}`
      case 'bloom-run':
        return `FLOWERS ${sp.caught}/${target}`
      case 'lamp-lighter':
        return `LAMPS ${sp.caught}/${target}`
      case 'sunset-charge':
        return `BANKED ${sp.caught}/${target}`
      case 'thaw': {
        const left = Math.max(0, Math.ceil((THAW_TICKS - this.mazeTick) / 60))
        return `THAW ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`
      }
    }
  }

  /** The bottom gauge: a shield, the sleepy time, a power-up, the boss's fight, or the charge. */
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
    if (this.boss)
      return [BOSS_LABEL[this.boss.id], this.boss.health, RAMPS.pink]
    if (this.rush)
      return ['TIME', 1 - this.rush.t / RUSH_HOUR.ticks, RAMPS.leaf]
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
