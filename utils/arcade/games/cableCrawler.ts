// /utils/arcade/games/cableCrawler.ts
//
// Cable Crawler: The Mainframe Odyssey -- the Kind Robots Arcade's Nibbler riff (conductor
// kr-arcade/t-009, depth pass m8 from t-064; spec: conductor projects/kr-arcade/depth-pass/
// CABINETS.md section 8). A charging-cable bot crawls into a giant old computer that has gone
// dark, slurping stray sparks and re-powering it one component at a time.
//
// The cable never crashes into walls: it pauses until you turn, and at a corner with only one way
// on it turns by itself. It grows with every spark it slurps, and each maze of a component starts
// it two cells longer than the last, so a long body in narrow corridors is the puzzle. What costs a
// cable is biting your own length, meeting a static bug head-on, getting tangled with no way on,
// or the battery running flat.
//
// The twist is the Plug-In Surge: drive the plug into a socket and the current runs the whole
// length of the cable, slurping every spark by its sides as a climbing chain, rebooting every
// glitch it touches and topping the battery up by the cable's length. The longer the cable you
// dare lay across the maze, the bigger the sweep.
//
// Components so far: the Power Strip (t-064), RAM Rows and the Cooling Fan (t-065), the Sound
// Card (t-066: beat gates, speaker cones, echoes, noise gnats, the Equaliser and the Subwoofer),
// with the Workbench between components. Mazes, components, glitches, bosses, pickups, art and music live
// in utils/arcade/cableCrawler/. Arrows steer; A and B work the Workbench and menus.

import { drawText, measureText } from '../font'
import {
  INK,
  RAMPS,
  Sparkles,
  backdropRng,
  bandedGradient,
  bevel,
  cachedLayer,
  drawSprite,
  gauge,
  glow,
  hudPanel,
  rgba,
  shadedOrb,
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
  BLOCK_SPRITE,
  BOARD_H,
  BOARD_W,
  BUG_SPRITES,
  BUNNY_SPRITES,
  BYTE_SPRITES,
  CABLE_COATS,
  CRAB_SPRITES,
  DRIP_SPRITES,
  ELBOWS_SURGE,
  FLIPPER_SPRITES,
  FUSE_BEETLE,
  type Facing,
  LIFE_SPRITE,
  MIMIC_TWINKLE,
  PICKUP_SPRITES,
  PLUG,
  REBOOT_SPRITE,
  REEL_SPRITE,
  SOCKET_SPRITE,
  SPARK_SPRITES,
  TILE,
  TUBE_SURGE,
  boardCanvas,
  glowStamp,
  paintBoard,
} from '../cableCrawler/art'
import {
  BEAT_PULSE,
  BOSS_DEFEAT_POINTS,
  BOSS_HIT_POINTS,
  SHOCK_REACH,
  SHUFFLE_TELL,
  WHIRR_TELL,
  type Boss,
  blobRadius,
  bladeCells,
  bossCell,
  bossCells,
  bossPhase,
  hitBoss,
  newBoss,
  updateBoss,
  whirrWalls,
  wrapSides,
} from '../cableCrawler/bosses'
import {
  BOSS_MUSIC,
  BOARDS_PER_COMPONENT,
  COMPONENTS,
  SCREENSAVER_MUSIC,
  WORKBENCH_MUSIC,
  type Component,
  type Step,
  componentAt,
  componentSteps,
} from '../cableCrawler/components'
import {
  BUG_BOOT,
  BUG_DOWN,
  CRAB_STEP,
  CRACKLE_RANGE,
  DRIP_STEP,
  ECHO_DELAY,
  ECHO_DOWN,
  FLIPPER_STEP,
  GLITCH_POINTS,
  GNAT_DRAIN,
  GNAT_SIGHT,
  GNAT_STEP,
  GOO_TICKS,
  MIMIC_SHORT,
  SNIP_MIN,
  SOLID_GLITCHES,
  WANDERERS,
  type Glitch,
  type GlitchKind,
  bugWay,
  clawsUp,
  glitchLive,
  hotRadius,
  newGlitch,
} from '../cableCrawler/glitches'
import {
  COLS,
  ROWS,
  type Maze,
  type Way,
  cellKey,
  cellX,
  cellY,
  oneWayOk,
  parseMaze,
  ringOf,
  sectorCells,
  turnCell,
  turnSector,
} from '../cableCrawler/mazes'
import {
  CAPACITOR_TICKS,
  COIL_CELLS,
  HEATSINK_SLOW,
  HEATSINK_TICKS,
  INSULATION_MAX,
  MAGNET_TICKS,
  PICKUP_CHANCE,
  PICKUP_LIFE,
  PICKUP_NAMES,
  type Pickup,
  pickupFor,
} from '../cableCrawler/pickups'
import {
  type CableSave,
  MAX_SAVED_LIVES,
  readCableSave,
} from '../cableCrawler/save'
import {
  SOCKET_RECHARGE,
  SURGE_REACH,
  SURGE_TOPUP_PER_CELL,
  chainPoints,
  surgeSweep,
} from '../cableCrawler/surge'
import {
  BENCH_ITEMS,
  COPPER,
  type Kit,
  buy,
  cannotBuy,
} from '../cableCrawler/workbench'

const W = 240
const H = 224
/** Where the board sits inside the Mainframe's chassis. */
const BX = 5
const BY = 29
const START_LEN = 4
/** Each maze of a component starts the cable this much longer than the last. */
const LEN_RAMP = 2
const START_LIVES = 3
const DEAD_TICKS = 100
const CLEAR_TICKS = 130
const CARD_TICKS = 170
/** Steps with no way on at all before a boxed-in cable gives up. */
const STUCK_STEPS = 12
const EXTRA_FIRST = 40_000
const EXTRA_EVERY = 100_000
/** Laps of the Mainframe that raise the score multiplier. */
const MULT_LAPS = 3

const SPARK_POINTS = 10
const BYTE_POINTS = 1000
const BATTERY_POINTS = 10
const STAR_POINTS = 50
const BAY_POINTS = 300
const SAVER_PERFECT = 5000
const SAVER_TICKS = 60 * 20
const STAR_EVERY = 26
const STAR_STEP = 9
const BREEZE_EVERY = 24
const BREEZE_MAX = 10
/** Sparks a boss board keeps topped up, so there is always cable to lay. */
const BOSS_SPARKS = 14
/** RAM Rows' refresh beat, and how long the rows flash before it. */
const REFRESH_EVERY = 60 * 7
const REFRESH_TELL = 60
/** How often a fan sector turns, how long it flashes first, and its wait when something is in it. */
const FAN_EVERY = 60 * 7
const FAN_TELL = 60
const FAN_JAM = 30

/** The Sound Card's beat: how often the gates swap, how long they flash first, their wait when blocked. */
const GATE_EVERY = 60 * 2
const GATE_TELL = 30
const GATE_JAM = 20
/** How often the speaker cones fire, and how long they glow first. */
const CONE_EVERY = 60 * 2.5
const CONE_TELL = 24
const CONE_RING = 16
/** The Equaliser's bars: their columns, how long a caught bar's spark waits to come back. */
const EQ_COLUMNS = [2, 5, 8, 11, 14, 17, 20] as const
const EQ_WAIT = 70

type Dir = Way
const UP: Dir = { dx: 0, dy: -1 }
const DOWN: Dir = { dx: 0, dy: 1 }
const LEFT: Dir = { dx: -1, dy: 0 }
const RIGHT: Dir = { dx: 1, dy: 0 }
const DIRS = [UP, RIGHT, DOWN, LEFT]

type Socket = { k: number; charge: number }
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = { x: number; y: number; text: string; life: number }
/** A bolt of surge current jumping from the cable to something it slurps. */
type Arc = { from: number; to: number; life: number }
type Saver = {
  kind: Component['screensaver']['kind']
  ticks: number
  stars: Array<{ k: number; t: number }>
  spawn: number
  caught: number
  total: number
  /** The Equaliser's bars: each carries one spark up and down its column. */
  bars: Array<{
    x: number
    phase: number
    speed: number
    on: boolean
    wait: number
  }>
}
/** A ring of sound spreading from a cone or the Subwoofer. */
type Wave = { x: number; y: number; life: number; max: number; big: boolean }
type Fan = { hub: number; timer: number }

const px = (k: number) => cellX(k) * TILE + TILE / 2
const py = (k: number) => cellY(k) * TILE + TILE / 2
const step = (k: number, d: Dir) => {
  const x = cellX(k) + d.dx
  const y = cellY(k) + d.dy
  return x < 0 || y < 0 || x >= COLS || y >= ROWS ? -1 : cellKey(x, y)
}
const reverseOf = (a: Dir, b: Dir) => a.dx === -b.dx && a.dy === -b.dy
const sameWay = (a: Dir | undefined, b: Dir) =>
  !!a && a.dx === b.dx && a.dy === b.dy
const manhattan = (a: number, b: number) =>
  Math.abs(cellX(a) - cellX(b)) + Math.abs(cellY(a) - cellY(b))

class CableCrawler implements ArcadeGameInstance {
  score = 0
  level = 0
  lives = START_LIVES
  over = false
  /** Progress the cabinet keeps for this player (demos never save). */
  save: CableSave | null = null

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  // The campaign: which component, which board of it, and how many laps of the Mainframe.
  private compIndex = 0
  private component: Component = COMPONENTS[0]!
  private lap = 0
  private steps: Step[] = []
  private stepIndex = 0
  private reached = 1
  private bytes = new Set<string>()
  /** A saved run waiting on CONTINUE (A) or NEW RUN (B). */
  private offer: CableSave | null = null
  // The Workbench kit, and the Workbench screen while it is open.
  private copper = 0
  private reachBonus = 0
  private insulation = 0
  private colour = 0
  private finder = false
  /** The byte finder bought for this component. */
  private finding = false
  private bench: { cursor: number; note: string; t: number } | null = null
  // The board in play.
  private maze!: Maze
  private walls: boolean[] = []
  private diodes = new Map<number, Way>()
  private goo = new Map<number, number>()
  private fans: Fan[] = []
  private refreshTimer = 0
  /** The Sound Card: whether the beat gates have swapped, and the timers to the next beat. */
  private gateFlip = false
  private gateTimer = GATE_EVERY
  private coneTimer = CONE_EVERY / 2
  private waves: Wave[] = []
  /** The plug's cell on each of the last ECHO_DELAY ticks (an echo walks it back). */
  private trail: number[] = []
  private ring: number[] = []
  private sparks = new Set<number>()
  private totalSparks = 0
  private sockets: Socket[] = []
  private glitches: Glitch[] = []
  private pickups: Pickup[] = []
  private boss: Boss | null = null
  private byte: { k: number; shown: boolean } | null = null
  private saver: Saver | null = null
  private bossSparkTimer = 0
  // The cable, plug first.
  private body: number[] = []
  private dir: Dir = UP
  private want: Dir = UP
  private grow = 0
  private stepTimer = 0
  private startLen = START_LEN
  private stuck = 0
  private battery = 0
  private batteryMax = 0
  private slow = 0
  private magnet = 0
  private dead = 0
  private clear = 0
  private cardTicks = 0
  private nextExtra = EXTRA_FIRST
  private surgeGlow = 0
  // Effects.
  private arcs: Arc[] = []
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null
  // Cosmetic sparkles roll their own dice, so the game's seeded rng is untouched.
  private fx = new Sparkles()
  /** Small eat sparkles, drawn under the cable so they never wash out the plug's face. */
  private crumbs = new Sparkles()
  private fxRng = backdropRng(53)
  /** This instance's board, painted once per set of walls onto one reused canvas. */
  private boardArt: {
    walls: boolean[]
    canvas: HTMLCanvasElement | null
  } | null = null
  /** The attract pilot's last plan, kept until the plug moves on. */
  private pilot: { head: number; tick: number; dir: Dir | null } | null = null

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    const stored = this.demo ? null : readCableSave(options.resume)
    if (stored) {
      this.bytes = new Set(stored.bytes)
      this.reached = stored.reached
      if (stored.comp > 0) this.offer = stored
      this.save = stored
    }
    this.beginComponent(0)
  }

  get music(): MusicLoop | null {
    if (this.over || this.offer) return null
    const kind = this.steps[this.stepIndex]?.kind
    if (kind === 'boss') return BOSS_MUSIC
    if (kind === 'screensaver') return SCREENSAVER_MUSIC
    if (kind === 'workbench') return WORKBENCH_MUSIC
    return this.component.music
  }

  // --- the campaign -------------------------------------------------------------------------

  /**
   * The score multiplier: the component's number, plus a lap of the Mainframe each time round
   * (for the first few laps; after that the laps only get faster).
   */
  private get mult(): number {
    return (
      this.component.number + Math.min(this.lap, MULT_LAPS) * COMPONENTS.length
    )
  }

  private get stepNow(): Step {
    return this.steps[this.stepIndex]!
  }

  private get kit(): Kit {
    return {
      copper: this.copper,
      lives: this.lives,
      reach: this.reachBonus,
      insulation: this.insulation,
      colour: this.colour,
      finder: this.finder,
    }
  }

  private beginComponent(index: number) {
    const { component, lap } = componentAt(index)
    this.compIndex = index
    this.component = component
    this.lap = lap
    this.steps = componentSteps(component)
    this.stepIndex = 0
    this.bench = null
    this.finding = this.finder
    this.finder = false
    if (!this.demo) this.reached = Math.max(this.reached, index + 1)
    this.cardTicks = CARD_TICKS
    this.startStep()
    this.keep()
  }

  private advance() {
    this.stepIndex++
    if (this.stepIndex >= this.steps.length) {
      this.beginComponent(this.compIndex + 1)
      return
    }
    this.startStep()
  }

  private startStep() {
    const s = this.stepNow
    if (s.kind === 'workbench') {
      this.bench = { cursor: 0, note: '', t: 0 }
      this.saver = null
      this.boss = null
      this.banner = null
      return
    }
    this.level++
    this.maze = parseMaze(s.layout)
    this.walls = [...this.maze.walls]
    this.diodes = new Map(this.maze.diodes)
    this.goo = new Map()
    this.fans = this.maze.fans.map((hub, i) => ({
      hub,
      timer: FAN_EVERY + i * 90,
    }))
    this.refreshTimer = REFRESH_EVERY
    this.gateFlip = false
    this.gateTimer = this.gateEvery()
    this.coneTimer = CONE_EVERY / 2
    this.waves = []
    this.trail = []
    this.applyGates()
    this.ring = s.kind === 'boss' ? ringOf(this.maze) : []
    this.sparks = new Set(this.maze.sparks)
    this.totalSparks = this.sparks.size
    this.sockets = this.maze.sockets.map((k) => ({ k, charge: 0 }))
    const spawn = (kind: GlitchKind, cells: readonly number[]) =>
      cells.map((k) => newGlitch(kind, k))
    this.glitches = [
      ...spawn('bug', this.maze.bugs),
      ...spawn('bunny', this.maze.bunnies),
      ...spawn('mimic', this.maze.mimics),
      ...spawn('crab', this.maze.crabs),
      ...spawn('flipper', this.maze.flippers),
      ...spawn('hotspot', this.maze.hotspots),
      ...spawn('drip', this.maze.drips),
      ...spawn('block', this.maze.blocks),
      ...spawn('gnats', this.maze.gnats),
      ...(this.maze.echoes.length ? [newGlitch('echo', this.maze.start)] : []),
    ]
    this.pickups = []
    this.boss = null
    if (s.kind === 'boss') {
      const kind = this.component.boss.kind
      const lair = this.maze.boss ?? this.maze.start
      if (kind === 'surge-protector' && this.ring.length)
        this.boss = newBoss(kind, this.ring, lair)
      else if (kind !== 'surge-protector')
        this.boss = newBoss(kind, [], lair, this.maze.walls)
      if (this.boss?.kind === 'big-whirr') this.walls = whirrWalls(this.boss)
    }
    this.byte =
      s.kind === 'maze' && this.maze.byte !== null
        ? { k: this.maze.byte, shown: this.finding }
        : null
    this.saver =
      s.kind === 'screensaver'
        ? {
            kind: this.component.screensaver.kind,
            ticks: SAVER_TICKS + (this.maze.bays.length ? 300 : 0),
            stars: [],
            spawn: 30,
            caught: 0,
            total: this.maze.bays.length,
            bars: [],
          }
        : null
    if (this.saver?.kind === 'equaliser') {
      this.saver.bars = EQ_COLUMNS.map((x, i) => ({
        x,
        phase: i * 0.9,
        speed: 0.024 + (i % 3) * 0.006,
        on: true,
        wait: 0,
      }))
      this.saver.total = this.saver.bars.length
    }
    this.bossSparkTimer = 0
    this.arcs = []
    const index = s.kind === 'maze' ? s.index : s.kind === 'screensaver' ? 3 : 5
    this.startLen = START_LEN + LEN_RAMP * index
    const c = this.component
    const seconds =
      s.kind === 'boss'
        ? c.battery + 30
        : Math.max(45, c.battery - index * 4 - this.lap * 10)
    this.batteryMax = seconds * 60
    this.resetCable()
    const saverLine: Record<Saver['kind'], string> = {
      starfield: 'CATCH THE STREAMING STARS',
      defrag: 'PUSH THE BLOCKS INTO THE SLOTS',
      breeze: 'RIDE THE AIR, CATCH THE FLAKES',
      equaliser: 'CATCH THE RISING SPARKS',
    }
    this.banner = {
      text: this.boardTitle(),
      sub:
        s.kind === 'maze'
          ? `${this.maze.name}  ${this.totalSparks} SPARKS`
          : s.kind === 'boss'
            ? c.boss.name
            : saverLine[c.screensaver.kind],
      ticks: 110,
    }
  }

  /** The board's label: MAZE 1-3, SCREENSAVER, BOSS or WORKBENCH. */
  private boardTitle(): string {
    const s = this.stepNow
    if (s.kind === 'maze') return `MAZE ${this.component.number}-${s.index + 1}`
    if (s.kind === 'workbench') return 'WORKBENCH'
    return s.kind === 'boss' ? 'BOSS!' : 'SCREENSAVER'
  }

  /** Ticks per cell the plug crawls on this board, before what it is crawling over. */
  private stepTicks(): number {
    const s = this.stepNow
    if (s.kind === 'screensaver') return 6
    const index = s.kind === 'maze' ? s.index : 4
    return Math.max(3, this.component.step - index * 0.25 - this.lap)
  }

  /** Ticks for the plug's next cell: air with it hurries it, goo and a heat sink slow it. */
  private crawlTicks(): number {
    const head = this.body[0]!
    let t = this.stepTicks()
    if (sameWay(this.maze.air.get(head), this.dir)) t *= 0.5
    if (this.goo.has(head)) t *= 2
    if (this.slow > 0) t *= HEATSINK_SLOW
    if (this.boss?.kind === 'big-whirr' && bossPhase(this.boss) === 3) t *= 0.8
    return t
  }

  private resetCable() {
    this.body = [this.maze.start]
    this.dir = this.maze.face
    this.want = this.maze.face
    this.grow = this.startLen - 1
    this.stepTimer = 0
    this.stuck = 0
    this.battery = this.batteryMax
    this.surgeGlow = 0
    this.slow = 0
    this.magnet = 0
    this.pilot = null
    this.trail = []
    for (const g of this.glitches) {
      if (!WANDERERS.has(g.kind) || g.gone) continue
      g.k = g.home
      g.timer = 40
      if (g.down === 0 && g.kind !== 'hotspot') g.booting = BUG_BOOT
    }
    if (this.boss) {
      const b = this.boss
      if (b.kind === 'surge-protector')
        b.at = Math.max(0, this.ring.indexOf(this.maze.boss ?? this.ring[0]!))
      for (const s of b.splits) s.k = s.home
      b.stun = 90
      b.charging = 0
      b.tell = 0
      b.blocked = 0
    }
  }

  /** The run as it stands, for the save. */
  private snapshot(comp: number, bench: boolean): CableSave {
    return {
      v: 1,
      comp,
      score: this.score,
      lives: Math.max(1, this.lives),
      continued: false,
      bytes: [...this.bytes],
      reached: this.reached,
      copper: this.copper,
      reach: this.reachBonus,
      insulation: this.insulation,
      colour: this.colour,
      // At a component's start the finder bought for it is in use; at the bench, it's for next.
      finder: bench ? this.finder : this.finding,
      bench,
    }
  }

  /** Remember the run at this component's start (a real campaign game only). */
  private keep() {
    if (this.demo || this.offer) return
    this.save = this.snapshot(this.compIndex, false)
  }

  /** Keep what is earned for good (the golden bytes) the moment it is earned. */
  private persist() {
    if (this.demo) return
    const base = this.save ?? this.snapshot(0, false)
    this.save = { ...base, bytes: [...this.bytes], reached: this.reached }
  }

  /** Pick a saved run back up at the start of its component (or its Workbench). */
  private resumeFrom(s: CableSave) {
    this.score = s.continued ? 0 : s.score
    this.lives = s.continued ? START_LIVES : s.lives
    this.nextExtra = EXTRA_FIRST
    while (this.nextExtra <= this.score) this.nextExtra += EXTRA_EVERY
    this.copper = s.copper ?? 0
    this.reachBonus = s.reach ?? 0
    this.insulation = s.insulation ?? 0
    this.colour = s.colour ?? 0
    this.finder = s.finder ?? false
    this.level = s.comp * BOARDS_PER_COMPONENT
    if (s.bench && !s.continued) {
      // Back at the Workbench before component `comp`.
      const { component, lap } = componentAt(s.comp - 1)
      this.compIndex = s.comp - 1
      this.component = component
      this.lap = lap
      this.steps = componentSteps(component)
      this.stepIndex = this.steps.length - 1
      this.startStep()
      this.save = this.snapshot(s.comp, true)
      return
    }
    this.beginComponent(s.comp)
  }

  // --- update ---------------------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    if (this.offer) {
      if (input.pressed.a || input.pressed.start) {
        const s = this.offer
        this.offer = null
        this.resumeFrom(s)
      } else if (input.pressed.b) {
        // A new run: the golden bytes stay, the campaign starts over.
        this.offer = null
        this.keep()
      }
      return
    }
    if (this.bench) {
      this.updateBench(this.demo ? this.demoInput() : input)
      return
    }
    if (this.cardTicks > 0) {
      this.cardTicks--
      if (
        this.cardTicks < CARD_TICKS - 40 &&
        !this.demo &&
        (input.pressed.a || input.pressed.start)
      )
        this.cardTicks = 0
      return
    }
    if (this.dead > 0) {
      if (--this.dead === 0) {
        if (this.lives <= 0) {
          this.over = true
          this.banner = { text: 'UNPLUGGED', sub: 'GAME OVER', ticks: 9999 }
          if (this.save && !this.demo)
            this.save = { ...this.save, continued: true }
        } else this.resetCable()
      }
      return
    }
    if (this.clear > 0) {
      if (--this.clear === 0) this.advance()
      return
    }
    const controls = this.demo ? this.demoInput() : input
    this.steer(controls)
    if (this.surgeGlow > 0) this.surgeGlow--
    if (this.slow > 0) this.slow--
    if (this.magnet > 0) this.magnet--
    for (const s of this.sockets) if (s.charge > 0) s.charge--
    this.updateBoard()
    if (this.saver) {
      this.updateSaver()
      if (this.clear > 0 || this.dead > 0) return
    } else {
      this.battery -= this.drain()
      if (this.battery <= 0) {
        this.unplug('THE BATTERY RAN FLAT')
        return
      }
    }
    this.updateGlitches()
    if (this.dead > 0) return
    if (this.boss) {
      this.updateBossBoard()
      if (this.dead > 0 || this.clear > 0) return
    }
    if (++this.stepTimer >= this.crawlTicks()) {
      this.stepTimer = 0
      this.crawl()
    }
    if (this.maze.echoes.length) {
      this.trail.push(this.body[0]!)
      if (this.trail.length > ECHO_DELAY + 1) this.trail.shift()
    }
  }

  /** Battery used this tick: twice on a heat tile, and more inside each hot spot's glow. */
  private drain(): number {
    const head = this.body[0]!
    let d = 1
    if (this.maze.heat.includes(head)) d++
    for (const g of this.glitches)
      if (
        g.kind === 'hotspot' &&
        glitchLive(g) &&
        manhattan(g.k, head) <= hotRadius(g)
      )
        d++
    for (const g of this.glitches)
      if (
        g.kind === 'gnats' &&
        glitchLive(g) &&
        manhattan(g.k, head) <= GNAT_DRAIN
      )
        d++
    return d
  }

  /** The board's own clockwork: RAM refresh, fans turning, goo drying, pickups fading. */
  private updateBoard() {
    // The Subwoofer sets the beat itself on its board; everywhere else the beat is a clock.
    if (this.boss?.kind !== 'subwoofer') {
      if (this.maze.gates.length && --this.gateTimer <= 0)
        this.gateTimer = this.flipGates() ? this.gateEvery() : GATE_JAM
      if (this.maze.cones.length && --this.coneTimer <= 0) {
        this.coneTimer = CONE_EVERY
        this.fireCones()
      }
    }
    this.waves = this.waves.filter((w) => --w.life > 0)
    if (this.maze.refresh && --this.refreshTimer <= 0) {
      this.refreshTimer = REFRESH_EVERY
      this.refreshRows()
    }
    for (const fan of this.fans) {
      if (--fan.timer > 0) continue
      if (this.sectorBusy(fan.hub)) {
        fan.timer = FAN_JAM
        continue
      }
      fan.timer = FAN_EVERY
      this.turnFan(fan.hub)
    }
    for (const [k, t] of this.goo)
      if (t <= 1) this.goo.delete(k)
      else this.goo.set(k, t - 1)
    for (const p of this.pickups) p.life--
    this.pickups = this.pickups.filter((p) => p.life > 0)
  }

  /** Ticks between beat-gate swaps: a little quicker on each lap of the Mainframe. */
  private gateEvery(): number {
    return Math.max(80, GATE_EVERY - this.lap * 12)
  }

  /** Whether a beat gate is shut right now. */
  private gateShut(k: number): boolean {
    return this.maze.shutGates.includes(k) !== this.gateFlip
  }

  /** Put the beat gates' walls up or down for the beat they are on. */
  private applyGates() {
    if (!this.maze.gates.length) return
    const walls = [...this.walls]
    for (const k of this.maze.gates) walls[k] = this.gateShut(k)
    this.walls = walls
  }

  /**
   * The beat: shut gates open and open ones shut. A gate never shuts on the cable, a glitch, the
   * boss or a pickup; the beat waits until they are clear. Returns whether the gates swapped.
   */
  private flipGates(): boolean {
    for (const k of this.maze.gates) {
      if (this.gateShut(k)) continue
      if (
        this.body.includes(k) ||
        this.pickups.some((p) => p.k === k) ||
        this.glitches.some(
          (g) =>
            !g.gone &&
            g.down === 0 &&
            g.k === k &&
            g.kind !== 'echo' &&
            g.kind !== 'gnats',
        ) ||
        (this.boss && bossCells(this.boss).includes(k))
      )
        return false
    }
    this.gateFlip = !this.gateFlip
    this.applyGates()
    this.sound.play('pop')
    return true
  }

  /** Every speaker cone fires: a plug beside one is shoved a cell away from it. */
  private fireCones() {
    for (const k of this.maze.cones) {
      this.waves.push({
        x: px(k),
        y: py(k),
        life: CONE_RING,
        max: CONE_RING,
        big: false,
      })
      const head = this.body[0]!
      if (manhattan(head, k) > 1) continue
      const away =
        head === k
          ? this.dir
          : { dx: cellX(head) - cellX(k), dy: cellY(head) - cellY(k) }
      this.shove(away)
    }
    this.sound.play('blip')
  }

  /** The plug is shoved one cell the way `d`, if the way is clear (never into its own cable). */
  private shove(d: Dir) {
    if (this.dead > 0 || this.clear > 0) return
    const head = this.body[0]!
    const next = step(head, d)
    if (next < 0 || !this.canPass(head, d) || this.bodyBlocks(next)) return
    const hit = this.glitchAt(next)
    if (hit && (SOLID_GLITCHES.has(hit.kind) || hit.kind === 'bunny')) return
    if (this.boss && bossCells(this.boss).includes(next)) return
    this.floaters.push({
      x: px(head),
      y: py(head) - 10,
      text: 'BOOM!',
      life: 40,
    })
    if (!reverseOf(d, this.dir)) {
      this.dir = d
      this.want = d
    }
    this.body.unshift(next)
    if (this.grow > 0) this.grow--
    else this.body.pop()
    this.stepTimer = 0
    this.landOn(next)
  }

  /** The Subwoofer's beat: the gates swap, the cones fire, and from phase 2 a shockwave shoves. */
  private bossBeat(shockwave: boolean) {
    const boss = this.boss!
    this.flipGates()
    this.fireCones()
    this.waves.push({
      x: px(boss.center),
      y: py(boss.center),
      life: 26,
      max: 26,
      big: true,
    })
    this.sound.play('boom')
    if (!shockwave) return
    const head = this.body[0]!
    const dx = cellX(head) - cellX(boss.center)
    const dy = cellY(head) - cellY(boss.center)
    if (Math.max(Math.abs(dx), Math.abs(dy)) > SHOCK_REACH + 1) return
    this.shove(
      Math.abs(dx) >= Math.abs(dy)
        ? { dx: Math.sign(dx) || 1, dy: 0 }
        : { dx: 0, dy: Math.sign(dy) },
    )
  }

  /** RAM Rows' refresh: each pair of rows swaps its sparks, cell for cell (never under the cable). */
  private refreshRows() {
    for (let y = 1; y + 2 < ROWS - 1; y += 4)
      for (let x = 1; x < COLS - 1; x++) {
        const a = cellKey(x, y)
        const b = cellKey(x, y + 2)
        if (this.walls[a] || this.walls[b]) continue
        if (this.body.includes(a) || this.body.includes(b)) continue
        const hasA = this.sparks.has(a)
        const hasB = this.sparks.has(b)
        if (hasA === hasB) continue
        this.sparks.delete(hasA ? a : b)
        this.sparks.add(hasA ? b : a)
      }
    this.sound.play('blip')
  }

  /** Whether anything but walls and sparks sits in a fan sector (then it waits). */
  private sectorBusy(hub: number): boolean {
    const cells = new Set(sectorCells(hub))
    if (this.body.some((k) => cells.has(k))) return true
    if (this.glitches.some((g) => !g.gone && cells.has(g.k))) return true
    if (this.sockets.some((s) => cells.has(s.k))) return true
    if (this.pickups.some((p) => cells.has(p.k))) return true
    if (this.byte && cells.has(this.byte.k)) return true
    return cells.has(this.maze.start)
  }

  /** A fan sector turns a quarter clockwise, carrying its sparks round with it. */
  private turnFan(hub: number) {
    this.walls = turnSector(this.walls, hub)
    const cells = sectorCells(hub)
    const moved = cells.filter((k) => this.sparks.has(k))
    for (const k of moved) this.sparks.delete(k)
    for (const k of moved) this.sparks.add(turnCell(hub, k))
    this.sound.play('pop')
  }

  private steer(input: InputFrame) {
    const pick = input.held.up
      ? UP
      : input.held.down
        ? DOWN
        : input.held.left
          ? LEFT
          : input.held.right
            ? RIGHT
            : null
    // No doubling straight back into yourself.
    if (pick && !reverseOf(pick, this.dir)) this.want = pick
  }

  /** A live glitch on a cell, if any. */
  private glitchAt(k: number, kind?: GlitchKind): Glitch | undefined {
    return this.glitches.find(
      (g) => g.k === k && glitchLive(g) && (!kind || g.kind === kind),
    )
  }

  private isWall(k: number): boolean {
    return k < 0 || this.walls[k] === true
  }

  /** Whether a crawl from `k` the way `d` gets past the walls, diodes and airflow. */
  private canPass(k: number, d: Dir): boolean {
    const n = step(k, d)
    if (n < 0 || this.isWall(n)) return false
    return oneWayOk(
      d,
      { diode: this.diodes.get(k), air: this.maze.air.get(k) },
      { diode: this.diodes.get(n), air: this.maze.air.get(n) },
    )
  }

  /** Where a pushed dust bunny or Defrag block off `k` the way `d` would land, or -1. */
  private pushLanding(k: number, d: Dir): number {
    const to = step(k, d)
    if (to < 0 || this.isWall(to)) return -1
    if (
      this.body.includes(to) ||
      this.glitches.some((g) => !g.gone && g.down === 0 && g.k === to)
    )
      return -1
    if (this.sockets.some((s) => s.k === to) || to === this.maze.start)
      return -1
    if (this.byte?.shown && this.byte.k === to) return -1
    if (this.boss && bossCells(this.boss).includes(to)) return -1
    return to
  }

  /** Whether the plug can crawl from its cell the way `d` (its own body aside). */
  private plugCan(d: Dir): boolean {
    const head = this.body[0]!
    if (!this.canPass(head, d)) return false
    const to = step(head, d)
    // The Memory Leak's split drips are in the way, but harmless.
    const b = this.boss
    if (b?.kind === 'memory-leak' && b.hp === 1 && bossCells(b).includes(to))
      return false
    const g = this.glitchAt(to)
    if (!g) return true
    if (g.kind === 'bunny' || (g.kind === 'block' && !g.locked))
      return this.pushLanding(to, d) >= 0
    return !SOLID_GLITCHES.has(g.kind)
  }

  /** Whether a cell is cable that will still be there after this step. */
  private bodyBlocks(k: number): boolean {
    const i = this.body.indexOf(k)
    return i >= 0 && !(this.grow === 0 && i === this.body.length - 1)
  }

  private crawl() {
    const head = this.body[0]!
    let dir = this.want
    if (!this.plugCan(dir)) dir = this.dir
    if (!this.plugCan(dir)) {
      // A corner with only one way on: take it (but never into your own cable).
      const ways = DIRS.filter(
        (d) =>
          !reverseOf(d, this.dir) &&
          this.plugCan(d) &&
          !this.bodyBlocks(step(head, d)),
      )
      if (ways.length !== 1) {
        if (!ways.length && this.body.length > 1 && ++this.stuck >= STUCK_STEPS)
          this.tangled()
        return
      }
      dir = ways[0]!
    }
    this.stuck = 0
    const next = step(head, dir)
    if (this.bodyBlocks(next)) {
      if (this.insulation > 0) {
        // Insulation: one free pass over your own cable.
        this.insulation--
        this.floaters.push({
          x: px(next),
          y: py(next) - 10,
          text: 'INSULATED!',
          life: 50,
        })
        this.sound.play('pickup')
      } else {
        if (this.saver) this.endSaver(false)
        else this.unplug('BIT YOUR OWN CABLE')
        return
      }
    }
    const pushed = this.glitchAt(next)
    if (pushed && (pushed.kind === 'bunny' || pushed.kind === 'block'))
      this.push(pushed, dir)
    this.dir = dir
    this.want = dir
    this.body.unshift(next)
    if (this.grow > 0) this.grow--
    else this.body.pop()
    this.landOn(next)
  }

  /** The plug has arrived on a cell: bugs and bosses bite, anything else is slurped. */
  private landOn(next: number) {
    if (this.glitchAt(next, 'bug')) {
      this.unplug('STATIC SHOCK!')
      return
    }
    if (this.glitchAt(next, 'echo')) {
      this.unplug('RAN INTO YOUR ECHO')
      return
    }
    if (this.boss && bossCells(this.boss).includes(next)) {
      this.unplug('BONKED BY THE BOSS')
      return
    }
    this.eat(next)
    if (this.magnet > 0)
      for (const d of DIRS) {
        const n = step(next, d)
        if (n >= 0 && this.sparks.has(n)) {
          this.arcs.push({ from: next, to: n, life: 10 })
          this.eat(n, true)
        }
      }
  }

  /** A boxed-in cable, with no way on at all, gives up. */
  private tangled() {
    if (this.saver) this.endSaver(false)
    else this.unplug('TANGLED UP')
  }

  private push(g: Glitch, d: Dir) {
    const to = this.pushLanding(g.k, d)
    if (to < 0) return
    g.k = to
    if (g.kind === 'block') {
      if (this.maze.bays.includes(to)) this.lockBlock(g)
      return
    }
    // A dust bunny rolls up any spark it is pushed over.
    if (this.sparks.delete(to)) {
      this.addScore(SPARK_POINTS * this.mult, px(to), py(to) - 8, false)
      this.sound.play('pop')
      this.afterSpark()
    }
  }

  /** `magnet`: a spark that jumped to the plug rather than one it crawled onto. */
  private eat(at: number, magnet = false) {
    const x = px(at)
    const y = py(at)
    if (this.sparks.delete(at)) {
      if (this.saver) {
        this.saver.caught++
        this.addScore(STAR_POINTS * this.mult, x, y - 8, false)
      } else {
        this.grow++
        this.addScore(SPARK_POINTS * this.mult, x, y - 8, false)
      }
      this.sound.play('blip')
      this.crumbs.burst(x, y, this.fxRng, {
        count: 3,
        speed: 0.9,
        colours: [RAMPS.gold[4], RAMPS.gold[3], RAMPS.sky[4]],
      })
      this.afterSpark()
    }
    if (magnet) return
    const mimic = this.glitchAt(at, 'mimic')
    if (mimic) {
      mimic.gone = true
      this.battery = Math.max(1, this.battery - MIMIC_SHORT)
      this.floaters.push({ x, y: y - 10, text: 'SHORTED -10S', life: 70 })
      this.burst(x, y, RAMPS.pink[3], 10)
      this.sound.play('warn')
    }
    if (this.byte?.shown && this.byte.k === at) this.takeByte()
    const pickup = this.pickups.find((p) => p.k === at)
    if (pickup) this.takePickup(pickup)
    if (this.saver) this.catchStars()
    const socket = this.sockets.find((s) => s.k === at)
    if (socket && socket.charge === 0 && this.clear === 0) this.surge(socket)
  }

  /** After any spark goes: the golden byte blinks in at half, and the last one clears the maze. */
  private afterSpark() {
    if (
      this.byte &&
      !this.byte.shown &&
      this.sparks.size * 2 <= this.totalSparks
    ) {
      this.byte.shown = true
      this.floaters.push({
        x: px(this.byte.k),
        y: py(this.byte.k) - 10,
        text: 'GOLDEN BYTE!',
        life: 80,
      })
      this.sound.play('pickup')
    }
    if (
      this.sparks.size === 0 &&
      this.stepNow.kind === 'maze' &&
      this.clear === 0
    )
      this.mazeClear()
  }

  private takeByte() {
    const b = this.byte!
    this.byte = null
    this.addScore(BYTE_POINTS * this.mult, px(b.k), py(b.k) - 8, true)
    this.fx.burst(px(b.k), py(b.k), this.fxRng, { count: 18, speed: 2.2 })
    this.sound.play('extra')
    this.earn(COPPER.byte)
    if (!this.demo) {
      this.bytes.add(this.maze.id)
      this.persist()
    }
  }

  private takePickup(p: Pickup) {
    this.pickups = this.pickups.filter((q) => q !== p)
    if (p.kind === 'capacitor')
      this.battery = Math.min(this.batteryMax, this.battery + CAPACITOR_TICKS)
    else if (p.kind === 'heatsink') this.slow = HEATSINK_TICKS
    else if (p.kind === 'insulation')
      this.insulation = Math.min(INSULATION_MAX, this.insulation + 1)
    else if (p.kind === 'coil')
      this.body.length = Math.max(2, this.body.length - COIL_CELLS)
    else this.magnet = MAGNET_TICKS
    this.floaters.push({
      x: px(p.k),
      y: py(p.k) - 10,
      text: PICKUP_NAMES[p.kind],
      life: 70,
    })
    this.fx.burst(px(p.k), py(p.k), this.fxRng, { count: 10, speed: 1.6 })
    this.sound.play('pickup')
  }

  /** Copper for the Workbench (never in the attract demo). */
  private earn(copper: number) {
    if (!this.demo) this.copper = Math.min(9999, this.copper + copper)
  }

  // --- the Plug-In Surge ----------------------------------------------------------------------

  private surge(socket: Socket) {
    socket.charge = SOCKET_RECHARGE
    const sweep = surgeSweep(
      this.body,
      this.walls,
      SURGE_REACH + this.reachBonus,
    )
    const swept = new Set(sweep)
    let chain = 0
    let rebooted = 0
    const from = (k: number) =>
      this.body.reduce(
        (best, b) => (manhattan(b, k) < manhattan(best, k) ? b : best),
        this.body[0]!,
      )
    for (const k of sweep) {
      if (this.sparks.delete(k)) {
        const points = chainPoints(chain++) * this.mult
        this.addScore(points, px(k), py(k) - 6, chain > 4 && chain % 3 === 0)
        this.arcs.push({ from: from(k), to: k, life: 18 + Math.min(chain, 12) })
        this.crumbs.burst(px(k), py(k), this.fxRng, {
          count: 2,
          speed: 0.8,
          colours: [RAMPS.gold[4], '#ffffff'],
        })
      }
      if (this.byte?.shown && this.byte.k === k) this.takeByte()
    }
    for (const g of this.glitches) {
      if (!glitchLive(g) || g.kind === 'block') continue
      // Gnats and echoes ride on the cable itself, which the sweep leaves out.
      const onCable =
        (g.kind === 'gnats' || g.kind === 'echo') && this.body.includes(g.k)
      if (!swept.has(g.k) && !onCable) continue
      rebooted++
      this.addScore(
        GLITCH_POINTS[g.kind] * this.mult,
        px(g.k),
        py(g.k) - 8,
        true,
      )
      this.arcs.push({ from: from(g.k), to: g.k, life: 26 })
      this.fx.burst(px(g.k), py(g.k), this.fxRng, {
        count: 8,
        colours: [RAMPS.teal[4], RAMPS.sky[4], '#ffffff'],
      })
      this.earn(COPPER.reboot)
      if (this.rng() < PICKUP_CHANCE && !this.body.includes(g.k))
        this.pickups.push({
          k: g.k,
          kind: pickupFor(this.rng()),
          life: PICKUP_LIFE,
        })
      if (WANDERERS.has(g.kind)) {
        g.down = g.kind === 'echo' ? ECHO_DOWN : BUG_DOWN
        g.age = 0
      } else g.gone = true
    }
    if (this.boss && hitBoss(this.boss, swept, this.body)) {
      const k = bossCell(this.boss)
      this.arcs.push({ from: from(k), to: k, life: 30 })
      this.addScore(BOSS_HIT_POINTS * this.mult, px(k), py(k) - 12, true)
      this.burst(px(k), py(k), RAMPS.gold[3], 20)
      this.sound.play('boom')
    }
    const topUp = this.body.length * SURGE_TOPUP_PER_CELL
    this.battery = Math.min(this.batteryMax, this.battery + topUp)
    this.surgeGlow = 40
    this.sound.play('extra')
    this.floaters.push({
      x: px(socket.k),
      y: py(socket.k) - 12,
      text: chain || rebooted ? `SURGE X${chain + rebooted}` : 'SURGE!',
      life: 70,
    })
    if (this.boss && this.boss.hp <= 0) this.bossDefeated()
    else if (this.sparks.size === 0 && this.stepNow.kind === 'maze')
      this.mazeClear()
    else if (chain) this.afterSpark()
  }

  // --- glitches and bosses --------------------------------------------------------------------

  /** Ticks per cell a wandering glitch moves. */
  private glitchStep(kind: GlitchKind): number {
    const quicker = Math.min(5, this.lap * 2)
    if (kind === 'crab') return CRAB_STEP - Math.min(4, this.lap)
    if (kind === 'drip') return DRIP_STEP - quicker
    if (kind === 'flipper') return FLIPPER_STEP - quicker
    return this.component.bugStep - quicker
  }

  private updateGlitches() {
    for (const g of this.glitches) {
      if (g.gone || g.locked) continue
      if (g.kind === 'echo') {
        this.updateEcho(g)
        if (this.dead > 0) return
        continue
      }
      if (g.down > 0) {
        if (--g.down === 0) {
          if (this.body.includes(g.home)) g.down = 30
          else {
            g.k = g.home
            g.booting = g.kind === 'hotspot' ? 0 : BUG_BOOT
          }
        }
        continue
      }
      if (g.booting > 0) {
        g.booting--
        continue
      }
      g.age++
      if (g.kind === 'gnats') {
        if (--g.timer <= 0) {
          g.timer = GNAT_STEP - Math.min(4, this.lap * 2)
          this.moveGnats(g)
        }
        continue
      }
      if (g.kind === 'crab') {
        if (--g.timer <= 0) {
          g.timer = this.glitchStep('crab')
          this.moveCrab(g)
          if (this.dead > 0) return
        }
        continue
      }
      if (g.kind !== 'bug' && g.kind !== 'flipper' && g.kind !== 'drip')
        continue
      if (--g.timer > 0) continue
      g.timer = this.glitchStep(g.kind)
      const head = this.body[0]!
      const way = bugWay(
        g,
        (k) => {
          if (this.isWall(k)) return 'wall'
          if (
            this.glitches.some(
              (o) => o !== g && !o.gone && o.down === 0 && o.k === k,
            )
          )
            return 'wall'
          if (this.boss && bossCells(this.boss).includes(k)) return 'wall'
          if (this.sockets.some((s) => s.k === k) && g.kind === 'drip')
            return 'wall'
          if (k === head) return 'head'
          return this.body.includes(k) ? 'body' : 'open'
        },
        this.rng,
      )
      if (!way) continue
      const next = step(g.k, way)
      if (next === head && g.kind === 'bug') {
        g.k = next
        this.unplug('STATIC SHOCK!')
        return
      }
      if (this.body.includes(next)) {
        // It bounces off the cable.
        g.dx = -way.dx || 0
        g.dy = -way.dy || 0
        continue
      }
      // A leak drip leaves goo where it was.
      if (g.kind === 'drip') this.goo.set(g.k, GOO_TICKS)
      g.k = next
      g.dx = way.dx
      g.dy = way.dy
      // A bit flipper turns round every diode it walks through.
      const diode = this.diodes.get(next)
      if (g.kind === 'flipper' && diode) {
        this.diodes.set(next, { dx: -diode.dx || 0, dy: -diode.dy || 0 })
        this.sound.play('blip')
      }
    }
  }

  /**
   * An echo retraces the plug's path from four seconds ago. It stays out of sight until there is
   * that much path to retrace, and walking into the plug unplugs it.
   */
  private updateEcho(g: Glitch) {
    if (g.down > 0) {
      if (--g.down === 0) g.booting = 60
      return
    }
    if (this.trail.length <= ECHO_DELAY) {
      g.booting = 1
      return
    }
    g.k = this.trail[0]!
    if (g.booting > 0) {
      g.booting--
      return
    }
    g.age++
    if (g.k === this.body[0]) this.unplug('RAN INTO YOUR ECHO')
  }

  /** Noise gnats drift toward a plug they can see and orbit it, wandering when it is far off. */
  private moveGnats(g: Glitch) {
    const head = this.body[0]!
    const here = manhattan(g.k, head)
    const open = DIRS.map((d) => ({ d, n: step(g.k, d) })).filter(
      ({ n }) => n >= 0 && !this.isWall(n),
    )
    if (here <= GNAT_SIGHT && open.length) {
      const pool =
        here <= 2
          ? open.filter(
              ({ n }) => manhattan(n, head) >= 1 && manhattan(n, head) <= 2,
            )
          : open.filter(({ n }) => manhattan(n, head) < here)
      const choose = pool.length ? pool : open
      const pick = choose[Math.floor(this.rng() * choose.length)]!
      g.k = pick.n
      g.dx = pick.d.dx
      g.dy = pick.d.dy
      return
    }
    const way = bugWay(g, (k) => (this.isWall(k) ? 'wall' : 'open'), this.rng)
    if (!way) return
    g.k = step(g.k, way)
    g.dx = way.dx
    g.dy = way.dy
  }

  /** A cache crab scuttles along its row; claws up, it snips the cable it runs into. */
  private moveCrab(g: Glitch) {
    const next = step(g.k, { dx: g.dx, dy: 0 })
    const turn = () => {
      g.dx = -g.dx || 0
    }
    if (next < 0 || this.isWall(next) || this.glitchAt(next)) return turn()
    if (this.boss && bossCells(this.boss).includes(next)) return turn()
    const i = this.body.indexOf(next)
    if (i === 0) return turn()
    if (i > 0) {
      if (!clawsUp(g)) return turn()
      // Snip: the tail end beyond the cut is gone.
      const keep = Math.max(SNIP_MIN, i)
      if (keep >= this.body.length) return turn()
      for (const k of this.body.slice(keep))
        this.crumbs.burst(px(k), py(k), this.fxRng, {
          count: 1,
          speed: 0.6,
          colours: [RAMPS.steel[3]],
        })
      this.body.length = keep
      this.grow = 0
      this.floaters.push({
        x: px(next),
        y: py(next) - 10,
        text: 'SNIP!',
        life: 60,
      })
      this.sound.play('pop')
      return turn()
    }
    g.k = next
  }

  private updateBossBoard() {
    const boss = this.boss!
    updateBoss(boss, {
      cable: (k) =>
        k === this.body[0] ? 'head' : this.body.includes(k) ? 'body' : null,
      bite: () => this.unplug('BONKED BY THE BOSS'),
      shuffleSockets: () => this.shuffleSockets(),
      wall: (k) => this.isWall(k),
      busy: (k) =>
        this.body.includes(k) ||
        this.glitches.some((g) => !g.gone && g.down === 0 && g.k === k) ||
        this.sockets.some((s) => s.k === k) ||
        this.pickups.some((p) => p.k === k) ||
        k === this.maze.start,
      setWalls: (walls) => {
        this.walls = walls
        for (const k of this.sparks) if (walls[k]) this.sparks.delete(k)
      },
      beat: (shockwave) => this.bossBeat(shockwave),
      drip: (k) => {
        const live = this.glitches.filter((g) => g.kind === 'drip' && !g.gone)
        if (live.length >= 3) return
        const d = newGlitch('drip', k)
        d.dx = cellX(k) < cellX(boss.center) ? -1 : 1
        d.dy = 0
        this.glitches.push(d)
      },
      rng: this.rng,
    })
    // The boss board keeps a few sparks about, so there is always cable to lay.
    if (this.sparks.size < BOSS_SPARKS && ++this.bossSparkTimer >= 80) {
      this.bossSparkTimer = 0
      const blocked = new Set(bossCells(boss))
      const free = this.maze.floor.filter(
        (k) =>
          !this.walls[k] &&
          !blocked.has(k) &&
          !this.sparks.has(k) &&
          !this.body.includes(k) &&
          !this.sockets.some((s) => s.k === k) &&
          !this.ring.includes(k) &&
          manhattan(k, boss.center) > 3 &&
          k !== this.maze.start,
      )
      if (free.length)
        this.sparks.add(free[Math.floor(this.rng() * free.length)]!)
    }
  }

  /** The boss pulls the sockets round the board, onto free slots. */
  private shuffleSockets() {
    const slots = [...this.maze.sockets, ...this.maze.slots]
    const taken = new Set<number>()
    for (const s of this.sockets) {
      const free = slots.filter(
        (k) => !taken.has(k) && k !== s.k && !this.body.includes(k),
      )
      if (free.length) s.k = free[Math.floor(this.rng() * free.length)]!
      taken.add(s.k)
    }
    this.sound.play('warn')
  }

  private bossDefeated() {
    const boss = this.boss!
    const k = bossCell(boss)
    this.addScore(BOSS_DEFEAT_POINTS * this.mult, px(k), py(k) - 14, true)
    for (let i = 0; i < 6; i++)
      this.fx.burst(
        px(k) + (this.fxRng() - 0.5) * 30,
        py(k) + (this.fxRng() - 0.5) * 30,
        this.fxRng,
        { count: 12, speed: 2.4 },
      )
    this.earn(COPPER.boss)
    // Saved straight away: a quit from here on comes back at the Workbench.
    if (!this.demo) this.save = this.snapshot(this.compIndex + 1, true)
    this.sound.play('level')
    this.clear = CLEAR_TICKS + 40
    this.banner = {
      text: 'REBOOTED!',
      sub: `${this.component.boss.name} IS FIXED`,
      ticks: CLEAR_TICKS + 40,
    }
  }

  // --- the Workbench --------------------------------------------------------------------------

  private updateBench(input: InputFrame) {
    const bench = this.bench!
    bench.t++
    if (this.demo) {
      if (bench.t > 90) this.leaveBench()
      return
    }
    const n = BENCH_ITEMS.length
    if (input.pressed.up) bench.cursor = (bench.cursor + n - 1) % n
    if (input.pressed.down) bench.cursor = (bench.cursor + 1) % n
    if (input.pressed.up || input.pressed.down) {
      bench.note = ''
      this.sound.play('blip')
    }
    if (input.pressed.b && bench.t > 20) return this.leaveBench()
    if (!(input.pressed.a || input.pressed.start) || bench.t < 20) return
    const item = BENCH_ITEMS[bench.cursor]!
    if (item.id === 'done') return this.leaveBench()
    const why = cannotBuy(this.kit, item.id)
    if (why) {
      bench.note = why
      this.sound.play('warn')
      return
    }
    const kit = buy(this.kit, item.id)
    this.copper = kit.copper
    this.lives = kit.lives
    this.reachBonus = kit.reach
    this.insulation = kit.insulation
    this.colour = kit.colour
    this.finder = kit.finder
    bench.note = `${item.name}: DONE!`
    this.sound.play('pickup')
    // Bought is kept, even if the player leaves now.
    if (this.save && !this.demo)
      this.save = {
        ...this.snapshot(this.compIndex + 1, true),
        continued: this.save.continued,
      }
  }

  private leaveBench() {
    this.bench = null
    this.sound.play('start')
    this.advance()
  }

  // --- the Screensavers -----------------------------------------------------------------------

  private updateSaver() {
    const s = this.saver!
    if (--s.ticks <= 0) {
      this.endSaver(true)
      return
    }
    if (s.kind === 'starfield') {
      if (--s.spawn <= 0 && s.ticks > 60) {
        s.spawn = STAR_EVERY
        const y = 1 + Math.floor(this.rng() * (ROWS - 2))
        s.stars.push({ k: cellKey(COLS - 2, y), t: STAR_STEP })
        s.total++
      }
      for (const star of s.stars) {
        if (--star.t > 0) continue
        star.t = STAR_STEP
        const x = cellX(star.k) - 1
        star.k = x < 1 ? -1 : cellKey(x, cellY(star.k))
      }
      s.stars = s.stars.filter((star) => star.k >= 0)
      this.catchStars()
    } else if (s.kind === 'equaliser') {
      for (const bar of s.bars) {
        bar.phase += bar.speed
        if (!bar.on && --bar.wait <= 0 && s.ticks > 60) {
          bar.on = true
          s.total++
        }
      }
      this.catchStars()
    } else if (s.kind === 'breeze') {
      // Flakes settle on the airflow loops for the cable to ride round and catch.
      if (--s.spawn <= 0 && s.ticks > 60 && this.sparks.size < BREEZE_MAX) {
        s.spawn = BREEZE_EVERY
        const lanes = [...this.maze.air.keys()].filter(
          (k) => !this.sparks.has(k) && !this.body.includes(k),
        )
        if (lanes.length) {
          this.sparks.add(lanes[Math.floor(this.rng() * lanes.length)]!)
          s.total++
        }
      }
    }
  }

  /** The cell a bar's spark sits on: it rides up and down the bar's column. */
  private barCell(bar: Saver['bars'][number]): number {
    const y = 2 + Math.round(((Math.sin(bar.phase) + 1) / 2) * (ROWS - 6))
    return cellKey(bar.x, y)
  }

  private catchStars() {
    const s = this.saver
    if (s?.kind === 'equaliser') {
      const at = this.body[0]!
      for (const bar of s.bars)
        if (bar.on && this.barCell(bar) === at) {
          bar.on = false
          bar.wait = EQ_WAIT
          s.caught++
          this.addScore(STAR_POINTS * this.mult, px(at), py(at) - 8, false)
          this.crumbs.burst(px(at), py(at), this.fxRng, {
            count: 5,
            speed: 1.2,
          })
          this.sound.play('blip')
        }
      return
    }
    if (!s || s.kind !== 'starfield') return
    const head = this.body[0]!
    s.stars = s.stars.filter((star) => {
      if (star.k !== head) return true
      s.caught++
      this.addScore(STAR_POINTS * this.mult, px(head), py(head) - 8, false)
      this.crumbs.burst(px(head), py(head), this.fxRng, {
        count: 5,
        speed: 1.2,
      })
      this.sound.play('blip')
      return false
    })
  }

  /** Defrag: a block pushed into a slot settles there for good. */
  private lockBlock(g: Glitch) {
    g.locked = true
    const s = this.saver
    if (!s) return
    s.caught++
    this.addScore(BAY_POINTS * this.mult, px(g.k), py(g.k) - 8, true)
    this.fx.burst(px(g.k), py(g.k), this.fxRng, { count: 10, speed: 1.8 })
    this.sound.play('pickup')
    if (s.caught >= s.total) this.endSaver(true)
  }

  /** The Screensaver ends: on time, or early if the cable bites itself (no cable lost). */
  private endSaver(onTime: boolean) {
    const s = this.saver!
    const perfect = onTime && s.caught === s.total && s.total > 0
    if (perfect) {
      this.addScore(SAVER_PERFECT * this.mult, W / 2, H / 2, true)
      this.earn(COPPER.saver)
    }
    this.sound.play(onTime ? 'level' : 'pop')
    this.clear = CLEAR_TICKS
    const what: Record<Saver['kind'], string> = {
      starfield: 'STARS CAUGHT',
      defrag: 'BLOCKS IN',
      breeze: 'FLAKES CAUGHT',
      equaliser: 'SPARKS CAUGHT',
    }
    this.banner = {
      text: onTime ? 'SCREEN WAKES!' : 'TANGLED: WAKING UP',
      sub: perfect
        ? `PERFECT! +${SAVER_PERFECT * this.mult}`
        : `${s.caught} OF ${s.total} ${what[s.kind]}`,
      ticks: CLEAR_TICKS,
    }
    s.stars = []
  }

  // --- clears and losses ----------------------------------------------------------------------

  private mazeClear() {
    const bonus = Math.ceil(this.battery / 60) * BATTERY_POINTS * this.mult
    this.addScore(bonus, W / 2, H / 2, true)
    this.earn(COPPER.maze)
    this.clear = CLEAR_TICKS
    for (let i = 0; i < 6; i++)
      this.fx.burst(
        TILE * 2 + this.fxRng() * (BOARD_W - TILE * 4),
        TILE * 2 + this.fxRng() * (BOARD_H - TILE * 4),
        this.fxRng,
        { count: 10, speed: 2 },
      )
    this.sound.play('level')
    this.banner = {
      text: 'MAZE CLEAR!',
      sub: `BATTERY BONUS +${bonus}`,
      ticks: CLEAR_TICKS,
    }
  }

  private unplug(why: string) {
    if (this.dead > 0 || this.clear > 0) return
    this.lives--
    this.dead = DEAD_TICKS
    const head = this.body[0]!
    this.burst(px(head), py(head), '#f87171', 18)
    this.fx.burst(px(head), py(head), this.fxRng, {
      count: 10,
      speed: 2.4,
      colours: [RAMPS.teal[4], RAMPS.sky[4], '#ffffff'],
    })
    this.sound.play('die')
    this.banner = {
      text: 'ZAP!',
      sub: this.lives > 0 ? `${why}  ${this.lives} LEFT` : why,
      ticks: DEAD_TICKS,
    }
  }

  // --- scoring and effects --------------------------------------------------------------------

  private addScore(points: number, x: number, y: number, show: boolean) {
    if (this.demo || points <= 0) return
    this.score += points
    if (show) this.floaters.push({ x, y, text: String(points), life: 50 })
    if (this.score >= this.nextExtra) {
      this.nextExtra +=
        this.nextExtra === EXTRA_FIRST ? EXTRA_EVERY - EXTRA_FIRST : EXTRA_EVERY
      if (this.lives < MAX_SAVED_LIVES) {
        this.lives++
        this.sound.play('extra')
      }
    }
  }

  private burst(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const a = this.fxRng() * Math.PI * 2
      const s = 0.4 + this.fxRng() * 1.6
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 22 + Math.floor(this.fxRng() * 14),
        color,
      })
    }
  }

  private updateEffects() {
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      p.vx *= 0.95
      p.vy *= 0.95
      p.life--
    }
    this.particles = this.particles.filter((p) => p.life > 0)
    for (const f of this.floaters) {
      f.y -= 0.3
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
    for (const a of this.arcs) a.life--
    this.arcs = this.arcs.filter((a) => a.life > 0)
    this.fx.update()
    this.crumbs.update()
  }

  // --- attract-mode pilot ---------------------------------------------------------------------

  /**
   * The attract pilot: steers by breadth-first search around its own cable and the glitches,
   * only into turns that leave room to move. It eats sparks, and when a ready socket would
   * sweep plenty (or a glitch or the boss lies along the cable), it heads for the socket. At the
   * Workbench it gets straight back to work.
   */
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
    if (this.bench) {
      frame.pressed.a = this.bench.t % 30 === 25
      return frame
    }
    const head = this.body[0]!
    if (
      !this.pilot ||
      this.pilot.head !== head ||
      this.tick - this.pilot.tick > 5
    )
      this.pilot = { head, tick: this.tick, dir: this.plan() }
    const best = this.pilot.dir
    if (best === UP) held.up = true
    else if (best === DOWN) held.down = true
    else if (best === LEFT) held.left = true
    else if (best === RIGHT) held.right = true
    return frame
  }

  /** Cells the pilot keeps the plug out of: its cable, the glitches and the boss's reach. */
  private hazards(bugReach: number): Set<number> {
    const out = new Set(this.body.slice(0, this.grow > 0 ? undefined : -1))
    const spread = (from: number, reach: number) => {
      let ring = [from]
      for (let r = 0; r < reach; r++) {
        const next: number[] = []
        for (const k of ring)
          for (const d of DIRS) {
            const n = step(k, d)
            if (n < 0 || this.isWall(n) || out.has(n)) continue
            out.add(n)
            next.push(n)
          }
        ring = next
      }
    }
    // Where the echo is bound for: the next stretch of the plug's own old path.
    for (const k of this.trail.slice(0, 45)) out.add(k)
    for (const g of this.glitches) {
      if (g.gone || g.down > 0) continue
      if (g.kind === 'hotspot' || g.kind === 'gnats') continue
      out.add(g.k)
      if (g.kind === 'bug') spread(g.k, bugReach)
      if (g.kind === 'crab')
        for (const dx of [-2, -1, 1, 2]) {
          const n = step(g.k, { dx, dy: 0 })
          if (n >= 0) out.add(n)
        }
    }
    if (this.boss && this.boss.hp > 0) {
      const b = this.boss
      if (b.kind === 'surge-protector') {
        const n = b.ring.length
        const reach = b.charging || b.tell ? 10 : 2
        for (let i = -1; i <= reach; i++)
          out.add(b.ring[(((b.at + b.dir * i) % n) + n) % n]!)
      } else {
        for (const k of bossCells(b)) {
          out.add(k)
          if (b.kind === 'memory-leak') spread(k, 1)
        }
        if (b.kind === 'big-whirr')
          for (const k of bladeCells(
            b.center,
            b.angle + (bossPhase(b) === 2 ? -1 : 1),
          ))
            out.add(k)
      }
    }
    return out
  }

  /**
   * The pilot's way: wide of the static bugs if it can get anywhere like that, closer if it
   * must, and failing all that off to shove a dust bunny out of the way.
   */
  private plan(): Dir | null {
    const head = this.body[0]!
    const legal = DIRS.filter(
      (d) =>
        !reverseOf(d, this.dir) &&
        this.plugCan(d) &&
        !this.bodyBlocks(step(head, d)),
    )
    if (legal.length === 0) return null
    const targets = this.pilotTargets()
    let fallback: Dir | null = null
    for (const reach of [2, 0]) {
      const blocked = this.hazards(reach)
      const clear = legal.filter((d) => !blocked.has(step(head, d)))
      const options = clear.length ? clear : legal
      const need = this.body.length + 6
      const room = (d: Dir) => this.area(step(head, d), blocked, need)
      // Safe: plenty of room, or a way back round to the tail end as it moves off.
      const safe = options.filter(
        (d) => room(d) >= need || this.reachesTail(step(head, d), blocked),
      )
      const pool = safe.length ? safe : options
      fallback ??= pool.sort((a, b) => room(b) - room(a))[0]!
      const best = this.nearest(pool, targets, blocked)
      if (best) return best
      if (reach > 0) continue
      const pushable = new Set(
        this.glitches
          .filter(
            (g) =>
              (g.kind === 'bunny' || g.kind === 'block') &&
              glitchLive(g) &&
              !g.locked,
          )
          .map((g) => g.k),
      )
      const open = new Set([...blocked].filter((k) => !pushable.has(k)))
      return this.nearest(pool, pushable, open) ?? fallback
    }
    return fallback
  }

  /** The way among `pool` with the shortest path to any of `targets`, if one is reachable. */
  private nearest(
    pool: Dir[],
    targets: Set<number>,
    blocked: Set<number>,
  ): Dir | null {
    const head = this.body[0]!
    let best: Dir | null = null
    let bestDist = Infinity
    for (const d of pool) {
      const dist = this.distTo(step(head, d), targets, blocked)
      if (dist < bestDist) {
        bestDist = dist
        best = d
      }
    }
    return best
  }

  /** Whether the plug, from `start`, could follow its cable round to the tail end. */
  private reachesTail(start: number, blocked: Set<number>): boolean {
    const tail = this.body[this.body.length - 1]!
    const seen = new Set([start])
    const stack = [start]
    while (stack.length) {
      const k = stack.pop()!
      for (const dir of DIRS) {
        const n = step(k, dir)
        if (n === tail && k !== start) return true
        if (n < 0 || seen.has(n) || blocked.has(n) || !this.canPass(k, dir))
          continue
        seen.add(n)
        stack.push(n)
      }
    }
    return false
  }

  private pilotTargets(): Set<number> {
    const s = this.saver
    if (s?.kind === 'starfield') {
      const out = new Set<number>()
      for (const star of s.stars) {
        out.add(star.k)
        const left = step(star.k, LEFT)
        if (left >= 0 && !this.isWall(left)) out.add(left)
      }
      return out.size ? out : new Set([cellKey(COLS >> 1, ROWS >> 1)])
    }
    if (s?.kind === 'equaliser') {
      const out = new Set<number>()
      for (const bar of s.bars) if (bar.on) out.add(this.barCell(bar))
      return out.size ? out : new Set([cellKey(COLS >> 1, ROWS >> 1)])
    }
    if (s?.kind === 'defrag') {
      // Get under a loose block and shove it up toward the slots.
      const out = new Set<number>()
      for (const g of this.glitches)
        if (g.kind === 'block' && !g.locked) {
          const below = step(g.k, DOWN)
          if (below >= 0 && !this.isWall(below)) out.add(below)
        }
      return out
    }
    const ready = this.sockets.filter(
      (sk) => sk.charge === 0 && !this.body.includes(sk.k),
    )
    const sweep = new Set(
      surgeSweep(this.body, this.walls, SURGE_REACH + this.reachBonus),
    )
    let value = 0
    for (const k of sweep) if (this.sparks.has(k)) value++
    const glitchNear = this.glitches.some(
      (g) => glitchLive(g) && g.kind !== 'block' && sweep.has(g.k),
    )
    const boss = this.boss
    const bossNear =
      !!boss &&
      boss.invuln === 0 &&
      !(boss.kind === 'subwoofer' && (boss.charging > 0 || boss.tell > 0)) &&
      (boss.kind === 'memory-leak' && boss.hp === 1
        ? boss.splits.every((sp) => sp.down === 0 && sweep.has(sp.k))
        : bossCells(boss).some((k) => sweep.has(k))) &&
      !(
        boss.kind === 'big-whirr' &&
        bossPhase(boss) === 3 &&
        wrapSides(boss, this.body) < 2
      )
    const lowBattery = this.battery < this.batteryMax * 0.3
    const enough = value >= Math.max(5, Math.min(12, this.sparks.size >> 2))
    if (ready.length && (enough || glitchNear || bossNear || lowBattery))
      return new Set(ready.map((sk) => sk.k))
    if (boss && this.body.length >= 12) {
      const out = new Set<number>()
      if (boss.kind === 'surge-protector') {
        // Lay the cable across the beetle's path, a little ahead of it.
        const n = boss.ring.length
        for (let i = 5; i <= 9; i++)
          out.add(boss.ring[(((boss.at + boss.dir * i) % n) + n) % n]!)
      } else if (boss.kind === 'big-whirr') {
        // Round the hub, on the ring the sockets sit on.
        for (let dy = -2; dy <= 2; dy++)
          for (let dx = -2; dx <= 2; dx++)
            if (Math.max(Math.abs(dx), Math.abs(dy)) === 2)
              out.add(cellKey(cellX(boss.center) + dx, cellY(boss.center) + dy))
      } else {
        for (const k of bossCells(boss))
          for (const d of DIRS) {
            const n = step(step(k, d), d)
            if (n >= 0 && !this.isWall(n)) out.add(n)
          }
      }
      for (const k of this.body) out.delete(k)
      if (out.size) return out
    }
    const out = new Set(this.sparks)
    if (this.byte?.shown) out.add(this.byte.k)
    for (const p of this.pickups) out.add(p.k)
    if (out.size === 0) for (const sk of ready) out.add(sk.k)
    return out
  }

  private distTo(
    start: number,
    targets: Set<number>,
    blocked: Set<number>,
  ): number {
    if (targets.has(start)) return 0
    const seen = new Set([start])
    let frontier = [start]
    // Cable the plug will have crawled clear of by the time it gets there is no obstacle.
    const clear = new Map<number, number>()
    this.body.forEach((k, i) =>
      clear.set(k, this.body.length - i + Math.max(0, this.grow)),
    )
    for (let d = 1; frontier.length && d < 90; d++) {
      const next: number[] = []
      for (const k of frontier)
        for (const dir of DIRS) {
          const n = step(k, dir)
          if (n < 0 || seen.has(n) || !this.canPass(k, dir)) continue
          if (blocked.has(n) && !((clear.get(n) ?? Infinity) <= d + 1)) continue
          if (targets.has(n)) return d
          seen.add(n)
          next.push(n)
        }
      frontier = next
    }
    return Infinity
  }

  /** Open cells reachable from `start`, counted up to `cap`. */
  private area(start: number, blocked: Set<number>, cap: number): number {
    const seen = new Set([start])
    const stack = [start]
    while (stack.length && seen.size < cap) {
      const k = stack.pop()!
      for (const dir of DIRS) {
        const n = step(k, dir)
        if (n < 0 || seen.has(n) || blocked.has(n) || !this.canPass(k, dir))
          continue
        seen.add(n)
        stack.push(n)
      }
    }
    return seen.size
  }

  // --- render ---------------------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    this.renderChassis(g)
    if (this.bench) {
      this.renderBench(g)
      this.renderHud(g)
      if (this.offer) this.renderOffer(g, this.offer)
      return
    }
    if (!this.boardArt || this.boardArt.walls !== this.walls) {
      const canvas = this.boardArt?.canvas ?? boardCanvas()
      const board = canvas?.getContext('2d')
      if (canvas && board) paintBoard(board, this.walls, this.component.look)
      this.boardArt = { walls: this.walls, canvas: board ? canvas : null }
    }
    g.save()
    g.translate(BX, BY)
    if (this.boardArt.canvas) {
      g.save()
      g.imageSmoothingEnabled = false
      g.drawImage(this.boardArt.canvas, 0, 0)
      g.restore()
    } else {
      paintBoard(g, this.walls, this.component.look)
    }
    this.renderFloor(g)
    this.renderBeat(g)
    if (this.saver?.kind === 'starfield') this.renderStarfield(g)
    if (this.saver?.kind === 'equaliser') this.renderEqualiser(g)
    this.renderSockets(g)
    if (this.body.length < this.startLen + 2)
      drawSprite(g, REEL_SPRITE, px(this.maze.start), py(this.maze.start))
    this.renderSparks(g)
    if (this.byte?.shown) this.renderByte(g, this.byte.k)
    for (const p of this.pickups)
      if (p.life > 90 || Math.floor(p.life / 6) % 2) {
        glow(g, px(p.k), py(p.k), 8, RAMPS.gold[4], 0.35)
        drawSprite(g, PICKUP_SPRITES[p.kind], px(p.k), py(p.k))
      }
    this.renderGlitches(g)
    this.crumbs.render(g)
    if (this.dead === 0 || Math.floor(this.dead / 5) % 2) this.renderCable(g)
    if (this.boss) this.renderBoss(g, this.boss)
    this.renderArcs(g)
    g.save()
    g.globalCompositeOperation = 'lighter'
    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, Math.min(1, p.life / 24))
      g.fillStyle = p.color
      g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 2, 2)
      g.fillStyle = '#ffffff'
      g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 1, 1)
    }
    g.restore()
    this.fx.render(g)
    for (const f of this.floaters)
      drawText(
        g,
        f.text,
        Math.max(
          measureText(f.text) / 2 + 2,
          Math.min(BOARD_W - measureText(f.text) / 2 - 2, f.x),
        ),
        f.y,
        { align: 'center', color: RAMPS.gold[4], outline: INK },
      )
    g.restore()
    vignette(g, W, H, 0.3)
    this.renderHud(g)
    if (this.banner && this.cardTicks === 0 && !this.offer) this.renderBanner(g)
    if (this.cardTicks > 0 && !this.offer) this.renderCard(g)
    if (this.offer) this.renderOffer(g, this.offer)
  }

  /** The Mainframe's chassis round the board: a steel case with vents. */
  private renderChassis(g: CanvasRenderingContext2D) {
    cachedLayer(g, 'cable-crawler-chassis', W, H, (k) => {
      bandedGradient(
        k,
        0,
        0,
        W,
        H,
        [RAMPS.steel[1], RAMPS.night[2], RAMPS.night[1], RAMPS.night[0]],
        6,
      )
      bevel(k, 1, BY - 4, W - 2, BOARD_H + 8, RAMPS.steel, { depth: 2 })
      k.fillStyle = INK
      k.fillRect(BX - 1, BY - 1, BOARD_W + 2, BOARD_H + 2)
      k.fillStyle = RAMPS.night[0]
      for (let x = 16; x < W - 16; x += 6) k.fillRect(x, H - 3, 3, 2)
    })
  }

  /**
   * What lies on the floor: diode arrows, airflow chevrons drifting with the wind, glowing heat
   * grates, goo puddles, Defrag's slots, flashing rows before a refresh and flashing sectors
   * before a fan turns.
   */
  private renderFloor(g: CanvasRenderingContext2D) {
    if (
      this.maze.refresh &&
      this.refreshTimer < REFRESH_TELL &&
      (this.tick >> 2) % 2
    ) {
      g.fillStyle = rgba(RAMPS.leaf[4], 0.12)
      for (let y = 1; y + 2 < ROWS - 1; y += 4) {
        g.fillRect(TILE, y * TILE, BOARD_W - TILE * 2, TILE)
        g.fillRect(TILE, (y + 2) * TILE, BOARD_W - TILE * 2, TILE)
      }
    }
    for (const fan of this.fans)
      if (fan.timer < FAN_TELL && (this.tick >> 2) % 2) {
        const x = (cellX(fan.hub) - 2) * TILE
        const y = (cellY(fan.hub) - 2) * TILE
        g.strokeStyle = RAMPS.sky[4]
        g.lineWidth = 1
        g.strokeRect(x + 0.5, y + 0.5, TILE * 5 - 1, TILE * 5 - 1)
      }
    for (const k of this.maze.heat) {
      const x = cellX(k) * TILE
      const y = cellY(k) * TILE
      const pulse = 0.5 + 0.5 * Math.sin(this.tick / 12 + k)
      g.fillStyle = rgba(RAMPS.ember[2], 0.25 + pulse * 0.2)
      g.fillRect(x + 1, y + 1, TILE - 2, TILE - 2)
      g.fillStyle = rgba(RAMPS.ember[4], 0.6)
      for (let i = 2; i < TILE - 1; i += 3)
        g.fillRect(x + 2, y + i, TILE - 4, 1)
    }
    for (const [k, t] of this.goo) {
      g.fillStyle = rgba(RAMPS.teal[2], Math.min(0.6, t / 200))
      g.fillRect(cellX(k) * TILE + 1, cellY(k) * TILE + 2, TILE - 2, TILE - 4)
      g.fillStyle = rgba(RAMPS.teal[4], Math.min(0.5, t / 300))
      g.fillRect(cellX(k) * TILE + 2, cellY(k) * TILE + 3, 3, 1)
    }
    for (const [k, w] of this.maze.air) {
      const x = px(k)
      const y = py(k)
      const t = (this.tick >> 2) % TILE
      g.fillStyle = rgba(RAMPS.sky[2], 0.2)
      g.fillRect(x - TILE / 2 + 1, y - TILE / 2 + 1, TILE - 2, TILE - 2)
      g.fillStyle = rgba(RAMPS.sky[4], 0.75)
      for (const off of [t - TILE / 2, t]) {
        const o = Math.round(off) - 2
        const cx = x + w.dx * o
        const cy = y + w.dy * o
        // A chevron pointing downwind.
        g.fillRect(
          cx - (w.dy ? 2 : 0) - w.dx,
          cy - (w.dx ? 2 : 0) - w.dy,
          w.dy ? 5 : 1,
          w.dx ? 5 : 1,
        )
        g.fillRect(cx, cy, 1, 1)
      }
    }
    for (const [k, w] of this.diodes) {
      const x = px(k)
      const y = py(k)
      g.fillStyle = INK
      g.fillRect(x - 4, y - 4, 8, 8)
      g.fillStyle = RAMPS.gold[2]
      g.fillRect(x - 3, y - 3, 6, 6)
      g.fillStyle = RAMPS.gold[4]
      // An arrow: a shaft and a head pointing the way through.
      g.fillRect(
        x - (w.dx ? 2 : 0),
        y - (w.dy ? 2 : 0),
        w.dx ? 4 : 1,
        w.dy ? 4 : 1,
      )
      g.fillRect(
        x + w.dx * 2 - (w.dy ? 2 : 0),
        y + w.dy * 2 - (w.dx ? 2 : 0),
        w.dy ? 5 : 1,
        w.dx ? 5 : 1,
      )
      g.fillRect(
        x + w.dx * 1 - (w.dy ? 1 : 0),
        y + w.dy * 1 - (w.dx ? 1 : 0),
        w.dy ? 3 : 1,
        w.dx ? 3 : 1,
      )
    }
    for (const k of this.maze.bays) {
      const x = cellX(k) * TILE
      const y = cellY(k) * TILE
      g.fillStyle = INK
      g.fillRect(x + 1, y + 1, TILE - 2, TILE - 2)
      g.fillStyle = RAMPS.leaf[1]
      g.fillRect(x + 2, y + 2, TILE - 4, TILE - 4)
      g.fillStyle = RAMPS.gold[3]
      for (let i = 2; i < TILE - 2; i += 2)
        g.fillRect(x + i, y + TILE - 3, 1, 1)
    }
  }

  /**
   * The Sound Card's beat: open gates show as a dashed doorway that flashes before they shut,
   * speaker cones glow before they fire, and rings of sound spread out from them.
   */
  private renderBeat(g: CanvasRenderingContext2D) {
    const boss = this.boss?.kind === 'subwoofer' ? this.boss : null
    const gateWarn =
      (boss ? boss.tell > 0 : this.gateTimer < GATE_TELL) &&
      (this.tick >> 2) % 2 === 0
    for (const k of this.maze.gates) {
      const x = cellX(k) * TILE
      const y = cellY(k) * TILE
      if (this.gateShut(k)) {
        if (gateWarn) {
          g.fillStyle = rgba(RAMPS.pink[3], 0.4)
          g.fillRect(x, y, TILE, TILE)
        }
        continue
      }
      g.fillStyle = rgba(gateWarn ? RAMPS.ember[3] : RAMPS.pink[3], 0.8)
      for (let i = 0; i < TILE; i += 3) {
        g.fillRect(x + i, y, 2, 1)
        g.fillRect(x + i, y + TILE - 1, 2, 1)
        g.fillRect(x, y + i, 1, 2)
        g.fillRect(x + TILE - 1, y + i, 1, 2)
      }
    }
    const coneWarn =
      (boss ? boss.tell > 0 : this.coneTimer < CONE_TELL) &&
      (this.tick >> 2) % 2 === 0
    for (const k of this.maze.cones) {
      const x = px(k)
      const y = py(k)
      if (coneWarn) glow(g, x, y, 11, RAMPS.pink[3], 0.5)
      shadedOrb(g, x, y, 4, RAMPS.steel, { outline: INK })
      g.fillStyle = INK
      g.fillRect(x - 1, y - 1, 3, 3)
      g.fillStyle = coneWarn ? RAMPS.pink[4] : RAMPS.steel[4]
      g.fillRect(x, y, 1, 1)
    }
    g.save()
    g.strokeStyle = RAMPS.pink[4]
    g.lineWidth = 1
    for (const w of this.waves) {
      const t = 1 - w.life / w.max
      g.globalAlpha = Math.max(0, w.life / w.max)
      g.beginPath()
      g.arc(w.x, w.y, 3 + t * (w.big ? TILE * 4 : TILE * 1.6), 0, Math.PI * 2)
      g.stroke()
    }
    g.restore()
  }

  /** The Equaliser: a lit bar under each rising and falling spark. */
  private renderEqualiser(g: CanvasRenderingContext2D) {
    const set = SPARK_SPRITES[this.component.look.spark]
    for (const bar of this.saver!.bars) {
      const k = this.barCell(bar)
      const x = px(k)
      const y = py(k)
      const bottom = (ROWS - 2) * TILE
      const lit = bar.on ? 1 : 0.35
      for (let yy = bottom; yy > y + 3; yy -= 4) {
        const frac = (bottom - yy) / Math.max(1, bottom - y)
        g.fillStyle = rgba(
          frac > 0.8
            ? RAMPS.ember[3]
            : frac > 0.5
              ? RAMPS.gold[3]
              : RAMPS.teal[3],
          0.55 * lit,
        )
        g.fillRect(x - 3, yy - 3, 7, 3)
      }
      if (!bar.on) continue
      glow(g, x, y, 9, RAMPS.pink[3], 0.45)
      drawSprite(g, set[(this.tick >> 3) % 2]!, x, y)
    }
  }

  private renderStarfield(g: CanvasRenderingContext2D) {
    // Far stars stream past, slower than the ones you catch.
    g.fillStyle = rgba(RAMPS.sky[4], 0.5)
    for (let i = 0; i < 40; i++) {
      const sx =
        (((i * 97 - this.tick * (1 + (i % 3))) % BOARD_W) + BOARD_W) % BOARD_W
      const sy = 6 + ((i * 53) % (BOARD_H - 12))
      g.fillRect(sx, sy, i % 4 === 0 ? 2 : 1, 1)
    }
    for (const star of this.saver!.stars) {
      const x = px(star.k)
      const y = py(star.k)
      glow(g, x, y, 8, RAMPS.sky[3], 0.4)
      drawSprite(g, SPARK_SPRITES.bolt[(this.tick >> 3) % 2]!, x, y)
      g.fillStyle = rgba(RAMPS.sky[4], 0.45)
      g.fillRect(x + 4, y, 6, 1)
    }
  }

  private renderSockets(g: CanvasRenderingContext2D) {
    const shuffling =
      this.boss?.kind === 'surge-protector' &&
      bossPhase(this.boss) >= 2 &&
      this.boss.shuffle < SHUFFLE_TELL
    for (const s of this.sockets) {
      const x = px(s.k)
      const y = py(s.k)
      if (shuffling && Math.floor(this.tick / 4) % 2) continue
      if (s.charge === 0)
        glow(g, x, y, 9 + Math.sin(this.tick / 8) * 2, RAMPS.teal[3], 0.5)
      drawSprite(g, SOCKET_SPRITE, x, y, { alpha: s.charge > 0 ? 0.6 : 1 })
      if (s.charge > 0) {
        // The recharge bar fills under the plate.
        const frac = 1 - s.charge / SOCKET_RECHARGE
        g.fillStyle = INK
        g.fillRect(x - 5, y + 5, 10, 2)
        g.fillStyle = RAMPS.ember[3]
        g.fillRect(x - 5, y + 5, Math.round(10 * frac), 2)
      }
    }
  }

  /** Every spark: a baked glow under it, and a twinkle running across the board. */
  private renderSparks(g: CanvasRenderingContext2D) {
    const set = SPARK_SPRITES[this.component.look.spark]
    const stamp = glowStamp(this.component.look.accent[3], 3, 0.45)
    if (stamp) {
      g.save()
      g.globalCompositeOperation = 'lighter'
      g.imageSmoothingEnabled = true
      for (const k of this.sparks)
        g.drawImage(stamp, px(k) - 6, py(k) - 6, 12, 12)
      g.restore()
    }
    for (const k of this.sparks) {
      const twinkle = (this.tick + k * 7) % 40 < 8
      drawSprite(g, set[twinkle ? 1 : 0], px(k), py(k))
    }
  }

  /** The golden byte: a spinning gold chip bobbing over its shadow, in a pulsing glow. */
  private renderByte(g: CanvasRenderingContext2D, k: number) {
    const x = px(k)
    const y = py(k)
    const pulse = 0.5 + 0.5 * Math.sin(this.tick / 5)
    const bob = Math.round(Math.sin(this.tick / 9) * 1.5)
    glow(g, x, y, 11 + pulse * 4, RAMPS.gold[3], 0.45 + pulse * 0.25)
    g.fillStyle = rgba(INK, 0.45)
    g.fillRect(x - 3, y + 4, 6, 2)
    const frame = Math.floor(this.tick / 10) % 4 === 3 ? 1 : 0
    drawSprite(g, BYTE_SPRITES[frame], x, y - 1 + bob)
  }

  private renderGlitches(g: CanvasRenderingContext2D) {
    const set = this.component.look.spark
    const head = this.body[0]!
    for (const gl of this.glitches) {
      if (gl.gone) continue
      const x = px(gl.k)
      const y = py(gl.k)
      if (gl.down > 0) {
        if (gl.down > BUG_DOWN - 50)
          drawSprite(g, REBOOT_SPRITE, x, y - (BUG_DOWN - gl.down) / 5, {
            alpha: gl.down / BUG_DOWN,
          })
        continue
      }
      if (gl.booting > 0 && Math.floor(gl.booting / 4) % 2) {
        drawSprite(g, REBOOT_SPRITE, x, y)
        continue
      }
      const frame = (this.tick >> 3) % 2
      if (gl.kind === 'mimic') {
        // Out of phase with the real sparks, and pink at the twinkle.
        const twinkle = (this.tick + 20) % 40 < 8
        drawSprite(
          g,
          twinkle ? MIMIC_TWINKLE[set] : SPARK_SPRITES[set][0],
          x,
          y,
        )
      } else if (gl.kind === 'bunny') {
        g.fillStyle = rgba(INK, 0.4)
        g.fillRect(x - 4, y + 3, 9, 2)
        drawSprite(g, BUNNY_SPRITES[(this.tick >> 5) % 2]!, x, y)
      } else if (gl.kind === 'block') {
        if (gl.locked) glow(g, x, y, 9, RAMPS.leaf[3], 0.5)
        drawSprite(g, BLOCK_SPRITE, x, y)
      } else if (gl.kind === 'crab') {
        const up = clawsUp(gl)
        if (up) glow(g, x, y, 9, RAMPS.ember[3], 0.35)
        drawSprite(g, CRAB_SPRITES[up ? 'up' : 'down'][frame]!, x, y)
      } else if (gl.kind === 'echo') {
        // A ghost plug in cold teal, and the next few cells of path it is bound for.
        g.save()
        g.globalAlpha = 0.45
        for (let i = 1; i <= 4; i++) {
          const ahead = this.trail[i * 6]
          if (ahead === undefined) break
          g.fillStyle = RAMPS.teal[3]
          g.fillRect(px(ahead) - 1, py(ahead) - 1, 3, 3)
        }
        g.restore()
        glow(g, x, y, 11, RAMPS.teal[3], 0.45)
        g.save()
        g.globalAlpha = 0.65 + 0.2 * Math.sin(this.tick / 5)
        shadedOrb(g, x, y, 4, RAMPS.teal, { outline: INK })
        g.restore()
        g.fillStyle = INK
        g.fillRect(x - 2, y - 1, 1, 2)
        g.fillRect(x + 1, y - 1, 1, 2)
      } else if (gl.kind === 'gnats') {
        // Three gnats circling their spot, buzzing in and out.
        for (let i = 0; i < 3; i++) {
          const a = this.tick / 6 + (i * Math.PI * 2) / 3
          const r = 4 + (i === 1 ? 1 : 0)
          g.fillStyle = INK
          g.fillRect(
            Math.round(x + Math.cos(a) * r) - 1,
            Math.round(y + Math.sin(a) * r * 0.7) - 1,
            3,
            3,
          )
          g.fillStyle = i === 0 ? RAMPS.gold[4] : RAMPS.pink[3]
          g.fillRect(
            Math.round(x + Math.cos(a) * r),
            Math.round(y + Math.sin(a) * r * 0.7),
            1,
            1,
          )
        }
        if (manhattan(gl.k, head) <= GNAT_SIGHT)
          glow(g, x, y, 8, RAMPS.pink[2], 0.25)
      } else if (gl.kind === 'flipper') {
        drawSprite(g, FLIPPER_SPRITES[frame]!, x, y)
      } else if (gl.kind === 'drip') {
        drawSprite(g, DRIP_SPRITES[(this.tick >> 4) % 2]!, x, y)
      } else if (gl.kind === 'hotspot') {
        // A warm glow, growing: everything inside it drains the battery.
        const r = hotRadius(gl)
        const pulse = 0.5 + 0.5 * Math.sin(this.tick / 9)
        glow(g, x, y, (r + 0.6) * TILE, RAMPS.ember[3], 0.28 + pulse * 0.12)
        g.fillStyle = rgba(RAMPS.ember[2], 0.12)
        for (let dy = -r; dy <= r; dy++)
          for (let dx = -r; dx <= r; dx++)
            if (Math.abs(dx) + Math.abs(dy) <= r)
              g.fillRect(
                x - TILE / 2 + dx * TILE,
                y - TILE / 2 + dy * TILE,
                TILE,
                TILE,
              )
        shadedOrb(g, x, y, 3, RAMPS.ember)
      } else {
        const near = manhattan(gl.k, head) <= CRACKLE_RANGE
        if (near) {
          // The tell: it crackles when the plug is close.
          glow(g, x, y, 10, RAMPS.sky[3], 0.5)
          g.fillStyle = '#ffffff'
          const r = this.fxRng
          for (let i = 0; i < 3; i++)
            g.fillRect(
              x - 6 + Math.floor(r() * 12),
              y - 6 + Math.floor(r() * 12),
              1,
              2,
            )
        }
        drawSprite(g, BUG_SPRITES[frame]!, x, y, { flipX: gl.dx < 0 })
      }
    }
  }

  private renderBoss(g: CanvasRenderingContext2D, b: Boss) {
    if (b.hp <= 0 && this.clear % 6 < 3) return
    if (b.kind === 'memory-leak') return this.renderLeak(g, b)
    if (b.kind === 'big-whirr') return this.renderWhirr(g, b)
    if (b.kind === 'subwoofer') return this.renderSubwoofer(g, b)
    const k = bossCell(b)
    const x = px(k)
    const y = py(k)
    const phase = bossPhase(b)
    if (b.tell > 0 || b.charging) glow(g, x, y, 16, RAMPS.ember[2], 0.6)
    else glow(g, x, y, 13, RAMPS.gold[3], 0.3)
    const sprite =
      FUSE_BEETLE[phase - 1]![b.stun > 0 ? 0 : (this.tick >> 3) % 2]!
    if (b.invuln > 0 && Math.floor(b.invuln / 4) % 2) return
    g.fillStyle = rgba(INK, 0.4)
    g.fillRect(x - 7, y + 6, 15, 2)
    drawSprite(
      g,
      sprite,
      x,
      y - 1 + (b.tell > 0 ? Math.round(Math.sin(this.tick)) : 0),
      { flipX: b.dir < 0 },
    )
    if (b.stun > 0) this.renderDizzy(g, x, y - 10)
  }

  private renderDizzy(g: CanvasRenderingContext2D, x: number, y: number) {
    for (let i = 0; i < 3; i++) {
      const a = this.tick / 8 + (i * Math.PI * 2) / 3
      g.fillStyle = RAMPS.gold[4]
      g.fillRect(
        Math.round(x + Math.cos(a) * 7),
        Math.round(y + Math.sin(a) * 2),
        2,
        2,
      )
    }
  }

  /** The Memory Leak: a wobbling teal blob of spilled memory, or its three split drips. */
  private renderLeak(g: CanvasRenderingContext2D, b: Boss) {
    if (b.invuln > 0 && Math.floor(b.invuln / 4) % 2) return
    const x = px(b.center)
    const y = py(b.center)
    if (b.hp > 1) {
      const r = blobRadius(b)
      glow(g, x, y, (r + 1.5) * TILE, RAMPS.teal[3], 0.35)
      for (const k of bossCells(b)) {
        const wob = Math.sin(this.tick / 7 + k) * 1.2
        shadedOrb(g, px(k), py(k) + wob, 6, RAMPS.teal, { outline: INK })
      }
      // Its face: two big eyes and a wobbly mouth.
      g.fillStyle = INK
      g.fillRect(x - 7, y - 6, 6, 6)
      g.fillRect(x + 1, y - 6, 6, 6)
      g.fillStyle = '#ffffff'
      g.fillRect(x - 6, y - 5, 4, 4)
      g.fillRect(x + 2, y - 5, 4, 4)
      g.fillStyle = INK
      g.fillRect(x - 4, y - 3, 2, 2)
      g.fillRect(x + 4, y - 3, 2, 2)
      g.fillRect(x - 4, y + 3 + Math.round(Math.sin(this.tick / 6)), 8, 2)
    } else
      for (const s of b.splits) {
        if (s.down > 0) continue
        glow(g, px(s.k), py(s.k), 10, RAMPS.teal[3], 0.5)
        drawSprite(g, DRIP_SPRITES[(this.tick >> 3) % 2]!, px(s.k), py(s.k), {
          scale: 2,
        })
      }
    if (b.stun > 0) this.renderDizzy(g, x, y - 18)
  }

  /** The Big Whirr's hub: a great fan boss with a face, its blades glowing before they turn. */
  private renderWhirr(g: CanvasRenderingContext2D, b: Boss) {
    const x = px(b.center)
    const y = py(b.center)
    if (b.timer < WHIRR_TELL || b.jam)
      for (const k of bladeCells(b.center, b.angle)) {
        g.fillStyle = rgba(b.jam ? RAMPS.ember[3] : RAMPS.sky[4], 0.35)
        g.fillRect(cellX(k) * TILE, cellY(k) * TILE, TILE, TILE)
      }
    if (b.invuln > 0 && Math.floor(b.invuln / 4) % 2) return
    const phase = bossPhase(b)
    glow(g, x, y, 22, phase === 3 ? RAMPS.ember[2] : RAMPS.sky[3], 0.45)
    shadedOrb(g, x, y, 14, RAMPS.steel, { outline: INK })
    shadedOrb(g, x, y, 9, phase === 3 ? RAMPS.ember : RAMPS.sky)
    // Little spinning vanes on the hub's face.
    const spin = (this.tick / (12 - phase * 3)) * (phase === 2 ? -1 : 1)
    g.fillStyle = RAMPS.steel[4]
    for (let i = 0; i < 4; i++) {
      const a = spin + (i * Math.PI) / 2
      g.fillRect(
        Math.round(x + Math.cos(a) * 11) - 1,
        Math.round(y + Math.sin(a) * 11) - 1,
        3,
        3,
      )
    }
    g.fillStyle = '#ffffff'
    g.fillRect(x - 5, y - 3, 3, 3)
    g.fillRect(x + 2, y - 3, 3, 3)
    g.fillStyle = INK
    g.fillRect(x - 4, y - 2, 1, 2)
    g.fillRect(x + 3, y - 2, 1, 2)
    g.fillRect(x - 2, y + 4, 4, 1)
    if (b.stun > 0) this.renderDizzy(g, x, y - 18)
  }

  /** The Subwoofer: a great speaker cabinet that swells on each beat and glows before one. */
  private renderSubwoofer(g: CanvasRenderingContext2D, b: Boss) {
    if (b.invuln > 0 && Math.floor(b.invuln / 4) % 2) return
    const x = px(b.center)
    const y = py(b.center)
    const phase = bossPhase(b)
    const beating = b.charging > 0
    const swell = beating
      ? Math.sin((b.charging / BEAT_PULSE) * Math.PI) * 2
      : 0
    glow(
      g,
      x,
      y,
      22 + swell * 2,
      b.tell > 0 || beating ? RAMPS.pink[3] : RAMPS.purple[3],
      b.tell > 0 || beating ? 0.6 : 0.35,
    )
    g.fillStyle = rgba(INK, 0.4)
    g.fillRect(x - 14, y + 14, 29, 3)
    bevel(g, x - 15, y - 15, 30, 30, RAMPS.steel, { depth: 2 })
    g.fillStyle = INK
    g.fillRect(x - 12, y - 12, 24, 24)
    shadedOrb(g, x, y + 1, Math.round(10 + swell), RAMPS.purple, {
      outline: INK,
    })
    shadedOrb(
      g,
      x,
      y + 1,
      Math.round(5 + swell / 2),
      phase === 3 ? RAMPS.ember : RAMPS.pink,
    )
    // Its tweeters watch you: two eyes in the cabinet's top corners.
    g.fillStyle = '#ffffff'
    g.fillRect(x - 11, y - 11, 4, 4)
    g.fillRect(x + 8, y - 11, 4, 4)
    g.fillStyle = INK
    g.fillRect(x - 9, y - 10, 2, 3)
    g.fillRect(x + 10, y - 10, 2, 3)
    if (b.stun > 0) this.renderDizzy(g, x, y - 20)
  }

  /** Surge bolts: a jagged line of light from the cable to what it slurps. */
  private renderArcs(g: CanvasRenderingContext2D) {
    if (!this.arcs.length) return
    g.save()
    g.globalCompositeOperation = 'lighter'
    const r = this.fxRng
    for (const a of this.arcs) {
      const x0 = px(a.from)
      const y0 = py(a.from)
      const x1 = px(a.to)
      const y1 = py(a.to)
      g.globalAlpha = Math.min(1, a.life / 12)
      g.fillStyle = RAMPS.gold[4]
      for (let i = 0; i <= 6; i++) {
        const t = i / 6
        const jx = i && i < 6 ? Math.round((r() - 0.5) * 3) : 0
        const jy = i && i < 6 ? Math.round((r() - 0.5) * 3) : 0
        g.fillRect(
          Math.round(x0 + (x1 - x0) * t) + jx,
          Math.round(y0 + (y1 - y0) * t) + jy,
          2,
          2,
        )
      }
      g.fillStyle = '#ffffff'
      g.fillRect(x1 - 1, y1 - 1, 2, 2)
    }
    g.restore()
  }

  /**
   * The cable as a shaded tube built from crisp runs: a drop shadow on the board, an ink
   * outline, insulation lit along its top and left in the colour the Workbench painted it, an
   * energy pulse lighting the core as it runs from tail to plug (the whole length glows gold in a
   * surge), pink cable ties every few cells, and the plug head sprite for its facing.
   */
  private renderCable(g: CanvasRenderingContext2D) {
    const coat = CABLE_COATS[this.colour] ?? CABLE_COATS[0]!
    const pts = this.body.map((k) => ({ x: px(k), y: py(k) }))
    const n = pts.length
    const run = (i: number, hw: number, dx = 0, dy = 0) => {
      const a = pts[i]!
      const b = pts[Math.min(n - 1, i + 1)]!
      g.fillRect(
        Math.min(a.x, b.x) - hw + dx,
        Math.min(a.y, b.y) - hw + dy,
        Math.abs(a.x - b.x) + hw * 2,
        Math.abs(a.y - b.y) + hw * 2,
      )
    }
    const surging = this.surgeGlow > 0
    const pulseAt = n - 1 - (Math.floor(this.tick / 2) % (n + 10))
    const lit = (i: number) => surging || (i >= pulseAt - 1 && i <= pulseAt + 1)
    g.fillStyle = rgba(INK, 0.4)
    for (let i = 0; i < n; i++) run(i, 3, 2, 2)
    const soft = glowStamp(
      surging ? RAMPS.gold[3] : coat.glow,
      4,
      surging ? 0.35 : 0.18,
    )
    const hot = glowStamp(RAMPS.sky[4], 5, 0.5)
    if (soft && hot) {
      g.save()
      g.globalCompositeOperation = 'lighter'
      g.imageSmoothingEnabled = true
      for (let i = 0; i < n; i += 2)
        g.drawImage(soft, pts[i]!.x - 12, pts[i]!.y - 12, 24, 24)
      if (!surging && pulseAt >= 0 && pulseAt < n)
        g.drawImage(hot, pts[pulseAt]!.x - 16, pts[pulseAt]!.y - 16, 32, 32)
      g.restore()
    }
    g.fillStyle = INK
    for (let i = 0; i < n; i++) run(i, 4)
    const tube = surging ? TUBE_SURGE : coat.lit
    const shade = (vertical: boolean) => {
      for (let i = 0; i < n; i++) {
        const a = pts[i]!
        const b = pts[Math.min(n - 1, i + 1)]!
        if ((a.x === b.x) !== vertical) continue
        const rows = lit(i) ? tube : coat.tube
        for (let r = 0; r < 6; r++) {
          g.fillStyle = rows[r]!
          if (vertical)
            g.fillRect(
              a.x - 3 + r,
              Math.min(a.y, b.y) - 3,
              1,
              Math.abs(a.y - b.y) + 6,
            )
          else
            g.fillRect(
              Math.min(a.x, b.x) - 3,
              a.y - 3 + r,
              Math.abs(a.x - b.x) + 6,
              1,
            )
        }
      }
    }
    shade(true)
    shade(false)
    for (let i = 1; i < n - 1; i++) {
      const p = pts[i]!
      const prev = pts[i - 1]!
      const next = pts[i + 1]!
      if (prev.x === next.x || prev.y === next.y) continue
      if (Math.abs(prev.x - next.x) > TILE || Math.abs(prev.y - next.y) > TILE)
        continue
      const side = prev.y === p.y ? prev : next
      const end = prev.x === p.x ? prev : next
      const elbows = surging
        ? ELBOWS_SURGE
        : lit(i) || lit(i - 1)
          ? coat.elbowsLit
          : coat.elbows
      const sprite =
        elbows[`${Math.sign(side.x - p.x)},${Math.sign(end.y - p.y)}`]
      if (sprite) drawSprite(g, sprite, p.x - 3, p.y - 3, { anchor: 'topleft' })
    }
    for (let i = 4; i < n - 1; i += 4) {
      const prev = pts[i - 1]!
      const p = pts[i]!
      const next = pts[i + 1]!
      const horizontal = prev.y === p.y && next.y === p.y
      const vertical = prev.x === p.x && next.x === p.x
      if (!horizontal && !vertical) continue
      g.fillStyle = INK
      if (horizontal) g.fillRect(p.x - 2, p.y - 4, 4, 8)
      else g.fillRect(p.x - 4, p.y - 2, 8, 4)
      g.fillStyle = RAMPS.pink[3]
      if (horizontal) g.fillRect(p.x - 1, p.y - 3, 1, 6)
      else g.fillRect(p.x - 3, p.y - 1, 6, 1)
      g.fillStyle = RAMPS.pink[1]
      if (horizontal) g.fillRect(p.x, p.y - 3, 1, 6)
      else g.fillRect(p.x - 3, p.y, 6, 1)
    }
    const head = pts[0]!
    const d = this.dir
    const facing: Facing = d.dy < 0 ? 'up' : d.dy > 0 ? 'down' : 'side'
    const chomp =
      this.dead === 0 && this.stepTimer < this.crawlTicks() / 2 ? 1 : 0
    const sprite = PLUG[facing][chomp]
    const left =
      facing === 'side' && d.dx < 0 ? head.x + 5 - sprite.width : head.x - 5
    const top = facing === 'up' ? head.y + 5 - sprite.height : head.y - 5
    if (this.insulation > 0) glow(g, head.x, head.y, 10, RAMPS.pink[3], 0.35)
    if (this.magnet > 0) glow(g, head.x, head.y, 14, RAMPS.ember[3], 0.3)
    glow(
      g,
      head.x + d.dx * 6,
      head.y + d.dy * 6,
      9,
      surging ? RAMPS.gold[3] : RAMPS.teal[3],
      chomp ? 0.5 : 0.25,
    )
    drawSprite(g, sprite, left, top, {
      anchor: 'topleft',
      flipX: facing === 'side' && d.dx < 0,
    })
  }

  private renderHud(g: CanvasRenderingContext2D) {
    const score = String(this.score).padStart(6, '0')
    const scoreW = measureText(score, 2) + 12
    hudPanel(g, 2, 2, scoreW, 20)
    drawText(g, score, 8, 5, { scale: 2, color: RAMPS.gold[3], outline: INK })
    const hi = `HI ${Math.max(this.hiScore, this.score)}`
    const where = this.boardTitle()
      .replace('!', '')
      .replace('SCREENSAVER', 'SAVER')
      .replace('WORKBENCH', 'BENCH')
    const rightW = Math.max(measureText(hi), measureText(where)) + 10
    const rightX = W - 2 - rightW
    hudPanel(g, rightX, 2, rightW, 20)
    drawText(g, hi, W - 7, 4, {
      align: 'right',
      color: RAMPS.pink[3],
      outline: INK,
    })
    drawText(g, where, W - 7, 13, {
      align: 'right',
      color: this.component.look.accent[3],
      outline: INK,
    })
    const midX = scoreW + 5
    const midW = rightX - 3 - midX
    hudPanel(g, midX, 2, midW, 20, RAMPS.night)
    const frac =
      this.saver || this.bench
        ? 1
        : this.batteryMax
          ? this.battery / this.batteryMax
          : 0
    const ramp =
      this.saver || this.bench
        ? RAMPS.sky
        : frac > 0.3
          ? RAMPS.leaf
          : frac > 0.15
            ? RAMPS.gold
            : RAMPS.ember
    const low = frac <= 0.15 && Math.floor(this.tick / 10) % 2 === 0
    const gaugeX = midX + 6
    const gaugeW = 32
    gauge(g, gaugeX, 8, gaugeW, 8, frac, ramp)
    bevel(g, gaugeX + gaugeW + 1, 10, 3, 4, RAMPS.steel, { depth: 1 })
    if (low) glow(g, gaugeX + gaugeW / 2, 12, 16, RAMPS.ember[2], 0.45)
    g.fillStyle = rgba(INK, 0.55)
    for (let i = 1; i < 4; i++)
      g.fillRect(gaugeX + Math.round((gaugeW * i) / 4), 8, 1, 8)
    const spares = Math.max(
      0,
      Math.min(this.lives - 1, Math.floor((midW - gaugeW - 16) / 9)),
    )
    for (let i = 0; i < spares; i++)
      drawSprite(g, LIFE_SPRITE, gaugeX + gaugeW + 12 + i * 9, 12)
  }

  private renderBanner(g: CanvasRenderingContext2D) {
    const b = this.banner!
    const bannerW =
      Math.max(measureText(b.text, 2), b.sub ? measureText(b.sub) : 0) + 16
    const y = BY + 74
    hudPanel(
      g,
      Math.round(W / 2 - bannerW / 2),
      y,
      bannerW,
      b.sub ? 38 : 26,
      this.component.look.accent,
    )
    drawText(g, b.text, W / 2, y + 6, {
      scale: 2,
      align: 'center',
      color: '#ffffff',
      outline: INK,
      shadow: this.component.look.accent[1],
    })
    if (b.sub)
      drawText(g, b.sub, W / 2, y + 26, {
        align: 'center',
        color: RAMPS.gold[4],
        outline: INK,
      })
  }

  /** The component's title card: its number and name over the dark board, then it powers up. */
  private renderCard(g: CanvasRenderingContext2D) {
    const c = this.component
    const t = CARD_TICKS - this.cardTicks
    g.save()
    g.fillStyle = rgba(INK, Math.min(0.85, 0.85 * (this.cardTicks / 30)))
    g.fillRect(BX, BY, BOARD_W, BOARD_H)
    g.restore()
    const y = BY + 46
    hudPanel(g, 18, y, W - 36, 96, c.look.accent)
    drawText(
      g,
      this.lap
        ? `COMPONENT ${c.number}  LAP ${this.lap + 1}`
        : `COMPONENT ${c.number}`,
      W / 2,
      y + 10,
      { align: 'center', color: c.look.accent[4], outline: INK },
    )
    drawText(g, c.name, W / 2, y + 26, {
      scale: 2,
      align: 'center',
      color: '#ffffff',
      outline: INK,
      shadow: c.look.accent[1],
    })
    drawText(g, c.tagline, W / 2, y + 50, {
      align: 'center',
      color: RAMPS.gold[4],
      outline: INK,
    })
    const found = c.mazes.filter((m) => this.bytes.has(m.id)).length
    drawText(
      g,
      `GOLDEN BYTES ${found}/${c.mazes.length}${this.finding ? '  FINDER ON' : ''}`,
      W / 2,
      y + 66,
      { align: 'center', color: RAMPS.gold[3], outline: INK },
    )
    // A power bar fills as the component boots.
    const frac = Math.min(1, t / (CARD_TICKS - 30))
    gauge(g, 40, y + 80, W - 80, 6, frac, RAMPS.teal)
  }

  /** The Workbench: a shop counter of parts, priced in copper, with the kit you have so far. */
  private renderBench(g: CanvasRenderingContext2D) {
    const bench = this.bench!
    bandedGradient(
      g,
      BX,
      BY,
      BOARD_W,
      BOARD_H,
      ['#3b2a1d', '#2c1f15', '#1f160f', '#140e0a'],
      6,
    )
    // The bench top: a wooden board with a pegboard of tools behind it.
    g.fillStyle = rgba(RAMPS.earth[3], 0.25)
    for (let y = BY + 6; y < BY + 40; y += 6)
      for (let x = BX + 6; x < BX + BOARD_W - 4; x += 6) g.fillRect(x, y, 1, 1)
    hudPanel(g, BX + 6, BY + 4, BOARD_W - 12, 22, RAMPS.rust)
    drawText(g, 'THE WORKBENCH', W / 2, BY + 8, {
      scale: 2,
      align: 'center',
      color: '#ffffff',
      outline: INK,
      shadow: RAMPS.rust[1],
    })
    drawText(g, `COPPER ${this.copper}`, BX + 10, BY + 32, {
      color: RAMPS.rust[4],
      outline: INK,
    })
    drawText(g, `CABLES ${this.lives}`, BX + BOARD_W - 10, BY + 32, {
      align: 'right',
      color: RAMPS.teal[3],
      outline: INK,
    })
    BENCH_ITEMS.forEach((item, i) => {
      const y = BY + 46 + i * 20
      const on = i === bench.cursor
      hudPanel(g, BX + 8, y, BOARD_W - 16, 17, on ? RAMPS.gold : RAMPS.night)
      const owned =
        (item.id === 'reach' && this.reachBonus > 0) ||
        (item.id === 'finder' && this.finder)
      const extra =
        item.id === 'insulation'
          ? ` ${this.insulation}/3`
          : owned
            ? ' OWNED'
            : ''
      drawText(g, `${on ? '>' : ' '}${item.name}${extra}`, BX + 12, y + 5, {
        color: on ? '#ffffff' : RAMPS.steel[3],
        outline: INK,
      })
      if (item.cost)
        drawText(g, `${item.cost}`, BX + BOARD_W - 14, y + 5, {
          align: 'right',
          color: this.copper >= item.cost ? RAMPS.rust[4] : RAMPS.ember[2],
          outline: INK,
        })
    })
    const sel = BENCH_ITEMS[bench.cursor]!
    drawText(g, bench.note || sel.note, W / 2, BY + BOARD_H - 22, {
      align: 'center',
      color: bench.note ? RAMPS.gold[4] : RAMPS.steel[3],
      outline: INK,
    })
    drawText(g, 'A: BUY / GO   B: GO', W / 2, BY + BOARD_H - 10, {
      align: 'center',
      color: RAMPS.steel[2],
      outline: INK,
    })
  }

  private renderOffer(g: CanvasRenderingContext2D, o: CableSave) {
    g.save()
    g.fillStyle = rgba(INK, 0.82)
    g.fillRect(0, 0, W, H)
    g.restore()
    hudPanel(g, 14, 50, W - 28, 128)
    const c = componentAt(o.comp)
    drawText(g, 'CONTINUE?', W / 2, 62, {
      scale: 2,
      align: 'center',
      color: RAMPS.gold[3],
      outline: INK,
    })
    drawText(
      g,
      `${o.bench ? 'WORKBENCH, THEN ' : ''}COMPONENT ${c.component.number}${c.lap ? ` LAP ${c.lap + 1}` : ''}`,
      W / 2,
      90,
      { align: 'center', color: '#ffffff', outline: INK },
    )
    drawText(g, c.component.name, W / 2, 102, {
      align: 'center',
      color: '#ffffff',
      outline: INK,
    })
    drawText(
      g,
      o.continued
        ? 'SCORE STARTS AGAIN AT ZERO'
        : `SCORE ${o.score}  CABLES ${o.lives}`,
      W / 2,
      120,
      { align: 'center', color: RAMPS.teal[3], outline: INK },
    )
    drawText(
      g,
      `GOLDEN BYTES ${o.bytes.length}  COPPER ${o.copper ?? 0}`,
      W / 2,
      134,
      {
        align: 'center',
        color: RAMPS.gold[4],
        outline: INK,
      },
    )
    drawText(g, 'A: CONTINUE   B: NEW RUN', W / 2, 160, {
      align: 'center',
      color: RAMPS.steel[3],
      outline: INK,
    })
  }
}

const cableCrawler: ArcadeGameModule = {
  create: (options) => new CableCrawler(options),
}

export const create = cableCrawler.create
export default cableCrawler
