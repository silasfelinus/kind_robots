import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'
import { emptyInput } from '../types'
import {
  PLUMBER_ART,
  drawSprite,
  plumberHeroine,
  plumberStageArt,
  loopingVideo,
  stagePlate,
  tilePattern,
} from './savePlumberArt'
import { ENEMY_ANIMATIONS, bossAnimation } from './savePlumberAnimations'
import { drawHeroine } from './savePlumberHeroineArt'
import {
  SOLID_BELT_LEFT,
  SOLID_BELT_RIGHT,
  SOLID_BLOCK,
  SOLID_BRIDGE,
  SOLID_CRATE,
  SOLID_GATE,
  SOLID_GROUND,
  SOLID_LEDGE,
  SOLID_PIPE,
  SOLID_WATER,
  TILE,
  CAMPAIGN,
  parseStage,
  stageWorld,
  type Stage,
  type StageDef,
} from './savePlumberLevels'
import {
  PLUMBER_ROSTER,
  type PlumberSpecial,
  actionPoses,
  rosterFor,
  rosterHeroine,
  rosterIndex,
  rosterPortrait,
  seedForRoster,
  type RosterHeroine,
} from './savePlumberRoster'
import {
  SLOT_COUNT,
  readPlumberFile,
  readPlumberSave,
  type PlumberFile,
  type PlumberSave,
  type PlumberSlot,
} from './savePlumberSave'
import {
  completionPercent,
  mapNode,
  newlyOpened,
  nodeReachable,
  nodeBuilt,
  startId,
  stageNode,
  warpHeading,
  stepFrom,
  worldCompletion,
  worldMap,
  openPaths,
  type MapDirection,
  type MapNode,
  type MapPath,
  type MapProgress,
  type NodeKind,
} from './savePlumberOverworld'
import { drawSheetFrame, keyedSheet } from './savePlumberSheets'
import { PLUMBER_WORLDS, type PlumberWorld } from './savePlumberWorlds'
import { ENDLESS_PAD, buildEndlessZone } from './savePlumberEndless'

const W = 480
const H = 270
const GRAVITY = 0.43
const JUMP = -8.6
/** Springstep power: a higher jump, and a float while A is held on the way down. */
const SPRING_JUMP = -10.2
const FLOAT = 0.6
const SPRING = -12.2
const RUN = 2.85
/** Campaign top speed while B is held with a direction. */
const RUN_FAST = 4.2
/** Crawling speed while ducked in the campaign. */
const CRAWL = 1.2
/** Runner pace for each world: she runs on her own, faster as the campaign goes. */
const RUNNER_SPEED = [2.9, 3.0, 3.1, 3.2, 3.35, 3.5, 3.65, 3.8]
/** The Endless run's top pace, reached in its fifteenth zone. */
const ENDLESS_TOP = 4.6
/** Ducking lowers her head by this much; a slide fits under a one-tile beam. */
const DUCK = 6
/** Pinned against a wall this long, a runner loses a life instead of soft-locking. */
const PINNED = 45
/**
 * The heroine's hitbox: about a tile and a quarter tall, so a leg can stack
 * routes two tiles apart. Her sprite stands a little over two tiles.
 */
const HALF = 9
const TALL = 20
/** Her sprite's height in pixels (before her roster scale). */
const HERO_SPRITE = 36
const START_LIVES = 3
const HEARTS = 3
const LAST_WORLD = stageWorld(CAMPAIGN[CAMPAIGN.length - 1]!.code)

/** The opening: painted cutscene, then two caption lines; `{name}` is the heroine. */
const STORY: { art: string; lines: [string, string] }[] = [
  {
    art: 'intro-discovery',
    lines: [
      'Dawn in the Bluebell Pipeworks. Teo, plumber and tinkerer,',
      'looks up from his bench: every river is flowing into the sky.',
    ],
  },
  {
    art: 'intro-capture',
    lines: [
      'Brass claws from a floating waterworks snatch him off the roof.',
      'Teo jams his wrench in the gears and scatters brass tokens as a trail.',
    ],
  },
  {
    art: 'intro-capture',
    lines: [
      '{name} catches the first token and picks up her own wrench.',
      'Follow the trail. Bring the rivers, and Teo, home.',
    ],
  },
]
const STORY_PANEL = 330
/** Ticks to walk one world-map path, and to draw a newly opened one. */
const MAP_WALK = 26
const MAP_REVEAL = 50
/** Where a warp leaves the map, by heading. */
const MAP_EDGE: Record<
  MapDirection,
  (n: { x: number; y: number }) => { x: number; y: number }
> = {
  right: (n) => ({ x: W + 20, y: n.y }),
  left: (n) => ({ x: -20, y: n.y }),
  up: (n) => ({ x: n.x, y: -20 }),
  down: (n) => ({ x: n.x, y: H + 20 }),
}
/** The letter on a map node: its course number, or what kind of place it is. */
const NODE_GLYPH: Record<NodeKind, (n: MapNode) => string> = {
  start: () => '',
  level: (n) => n.id.split('-')[1] ?? '',
  castle: () => '♜',
  fortress: () => 'F',
  house: () => 'H',
  bonus: () => 'B',
  shop: () => '$',
  chapel: () => 'V',
  special: (n) => n.id.split('-')[1] ?? '★',
}

type Mode =
  | 'title'
  | 'files'
  | 'select'
  | 'map'
  | 'story'
  | 'intro'
  | 'play'
  | 'dying'
  | 'clear'
  | 'victory'
  | 'over'

type Body = { x: number; y: number; vx: number; vy: number }

type Platform = {
  kind: 'piston' | 'lift' | 'raft' | 'lantern' | 'cargo'
  x: number
  y: number
  w: number
  baseX: number
  baseY: number
  sign: number
  dx: number
  dy: number
}

type FoeKind =
  | 'pumpbug'
  | 'rivet-roller'
  | 'minnow'
  | 'cork-crab'
  | 'glass-gull'
  | 'moss-lantern'
  | 'spring-hare'
  | 'gasket-golem'
  | 'paper-kite'
  | 'umbrella-mite'
  | 'puddle-mimic'
  | 'siphon-sprite'
  | 'chimney-spirit'
  | 'tea-kettle-knight'

type Foe = Body & {
  kind: FoeKind
  giant?: boolean
  giantHits?: number
  dir: number
  state: 'idle' | 'walk' | 'stunned' | 'kicked' | 'flat' | 'swoop' | 'gone'
  timer: number
  fade: number
  flipped: boolean
  homeX: number
  homeY: number
  carry: number
  pad: Platform | null
  /** A runner glider: flies straight at her at head height; duck, swing or stomp. */
  glide?: boolean
}

type BossKind =
  | 'pressure'
  | 'anchor'
  | 'slam'
  | 'chime'
  | 'gale'
  | 'burrow'
  | 'dive'
  | 'spigot'

/** The toy-box animation each in-game family plays (savePlumberAnimations). */
export const FOE_ANIMATION: Record<FoeKind, string> = {
  pumpbug: 'pumpbug',
  'rivet-roller': 'rivet-roller',
  minnow: 'clockwork-minnow',
  'cork-crab': 'cork-crab',
  'glass-gull': 'glass-gull',
  'moss-lantern': 'moss-lantern',
  'spring-hare': 'spring-hare',
  'gasket-golem': 'gasket-golem',
  'paper-kite': 'paper-kite',
  'umbrella-mite': 'umbrella-mite',
  'puddle-mimic': 'puddle-mimic',
  'siphon-sprite': 'siphon-sprite',
  'chimney-spirit': 'chimney-spirit',
  'tea-kettle-knight': 'tea-kettle-knight',
}

/** Each world's head-height glider, drawn from its own flyers. */
const GLIDERS: FoeKind[] = [
  'glass-gull',
  'glass-gull',
  'paper-kite',
  'paper-kite',
  'paper-kite',
  'siphon-sprite',
  'paper-kite',
  'siphon-sprite',
]

/** Steps a boss takes in each world (the world's index into this list). */
const BOSS_KINDS: BossKind[] = [
  'pressure',
  'anchor',
  'slam',
  'chime',
  'gale',
  'burrow',
  'dive',
  'spigot',
]

/** How far Lady Spigot's water jet reaches from her side. */
const JET = 140

/** Conveyor belt speed, and the push of a headwind gust in a wind corridor. */
const BELT = 1.1
const GUST = 0.9
/** Crystal bridges glow for BRIDGE_LIT ticks of every BRIDGE_CYCLE. */
const BRIDGE_CYCLE = 270
const BRIDGE_LIT = 180

type Vent = { x: number; y: number; offset: number }
type Spring = { x: number; y: number; squash: number }
type Token = { x: number; y: number; taken: boolean }
type Checkpoint = { x: number; y: number; reached: boolean }
type Wave = { x: number; y: number; dir: number }
type Soot = { x: number; y: number; vx: number; vy: number }
export type PlumberPower = 'springstep' | 'bottled-storm' | 'pocket-lift'
type Pickup = {
  x: number
  y: number
  kind: PlumberPower | 'heart'
  taken: boolean
}
type Gust = { x: number; y: number; dir: number; life: number }
type Cargo = {
  x: number
  /** Where its crates start falling from. */
  top: number
  y: number
  vy: number
  offset: number
  state: 'wait' | 'fall' | 'landed'
  pad: Platform | null
  timer: number
}

type Boss = {
  kind: BossKind
  name: string
  x: number
  y: number
  vy: number
  dir: number
  hp: number
  state: 'wait' | 'walk' | 'tell' | 'burst' | 'recover' | 'hurt' | 'defeat'
  timer: number
  speed: number
  vx: number
  floor: number
  home: number
}

/** Options for tests: start on a stage, and let the autopilot play it. */
/** The heroine's hitbox height and half-width, for tests and tools. */
export const HERO_TALL = TALL
export const HERO_HALF = HALF

export type PlumberRunOptions = {
  stage?: number
  autopilot?: boolean
  /** Start straight into an Endless run (with autopilot: the Endless pilot). */
  endless?: boolean
  /** The Endless run's zone seed (default: drawn from the rng). */
  endlessSeed?: number
  /** A Maker playtest: run this actual course without touching campaign save slots. */
  customLevel?: StageDef
}

const isWall = (s: number) =>
  s === SOLID_GROUND ||
  s === SOLID_BLOCK ||
  s === SOLID_GATE ||
  s === SOLID_PIPE ||
  s === SOLID_CRATE ||
  s === SOLID_BELT_LEFT ||
  s === SOLID_BELT_RIGHT

export class PlumberRun implements ArcadeGameInstance {
  score = 0
  lives = START_LIVES
  over = false
  mode: Mode = 'title'
  stageIndex = 0
  stage!: Stage
  /** Stages cleared this game, for tests and the demo loop. */
  cleared: string[] = []
  heroineSeed: number
  tokens = 0
  hearts = HEARTS
  tick = 0
  modeTimer = 0
  menu = 0
  storyPanel = 0
  /** Maker runs use the normal physics but never alter campaign progress. */
  readonly customLevel: StageDef | null
  /** An Endless run: zone after zone, faster each time, scored in metres. */
  endless = false
  /** The Endless zone she is running (0 is the first). */
  zone = 0
  /** Metres run in this Endless run (a metre is a tile). */
  distance = 0
  endlessBest = 0
  private zoneSeed = 0
  /** Metres run before this zone began. */
  private zoneStart = 0
  /** Heroine select leads into an Endless run rather than the campaign. */
  private pickEndless = false
  cursor: number
  readonly demo: boolean
  readonly autopilot: boolean
  private sound: ArcadeGameOptions['sound']
  private rng: () => number
  /** The cabinet's three save slots (Gen-2, conductor save-the-plumber t-011). */
  private file: PlumberFile
  private resume: PlumberSave | null
  /** File select: the highlighted slot, and whether Y has armed an erase. */
  slotCursor = 0
  eraseArmed = false
  /** World map: the node she stands on, a walk in progress, and paths being drawn in. */
  mapNodeId = startId(1)
  mapWalk: { from: string; to: string; path: MapPath; t: number } | null = null
  mapReveal: MapPath[] = []
  mapRevealTimer = 0
  /** Ticks left on the map's "coming soon" note. */
  mapToast = 0
  /** This slot's memory: stages cleared by normal and secret exits, deaths, play time. */
  done = new Set<string>()
  secrets = new Set<string>()
  deaths = 0
  private playFrames = 0
  private timeBase = 0

  hero: Body = { x: 0, y: 0, vx: 0, vy: 0 }
  ground = false
  grace = 0
  jumpBuffer = 0
  jumpHeld = false
  facing: 1 | -1 = 1
  stride = 0
  landed = 0
  immune = 0
  cooldown = 0
  swing = 0
  riding: Platform | null = null
  sprung = false
  checkpoint = { x: 0, y: 0 }
  camera = 0
  /** Vertical scroll: 0 shows the top of the stage; the lowest view frames the ground. */
  cameraY = 0
  locked = false

  platforms: Platform[] = []
  foes: Foe[] = []
  vents: Vent[] = []
  springs: Spring[] = []
  tokensOnMap: Token[] = []
  checkpoints: Checkpoint[] = []
  goal: { x: number; y: number } | null = null
  valves: { x: number; y: number; open: boolean }[] = []
  boss: Boss | null = null
  waves: Wave[] = []
  cargo: Cargo[] = []
  soot: Soot[] = []
  pickups: Pickup[] = []
  gusts: Gust[] = []
  /** Crates in flight from the Pocket Lift. */
  thrown: Soot[] = []
  /** This stage's Golden Gear, and the stages whose gear has ever been found. */
  gear: { x: number; y: number; taken: boolean } | null = null
  gears = new Set<string>()
  gearFlash = 0
  /** The power the heroine carries; a hit costs it instead of a heart. */
  power: PlumberPower | null = null
  carrying = false
  /** The heroine's special on Y: ticks left in it, its cooldown, and one use per airtime. */
  specialTimer = 0
  specialCooldown = 0
  airSpecial = false
  running = false
  floating = false
  /** Down (or B in Endless) held on the ground: a slide under beams and gliders. */
  ducking = false
  /** This frame's duck input, so a landing can drop straight into a slide. */
  private duckHeld = false
  pinned = 0
  /** One flag per column: 1 where a wind corridor blows. */
  windy: Uint8Array = new Uint8Array(0)
  private solid!: Uint8Array
  /** The tick tile lookups answer for; the jump predictor sets it ahead. */
  private clock: number | null = null
  private pilotStuck = 0
  private pilotBest = 0
  private pilotHold = 0
  private pilotRight = true
  private pilotSeek: number | null = null

  constructor(options: ArcadeGameOptions, run: PlumberRunOptions = {}) {
    this.demo = options.demo
    this.customLevel = run.customLevel ?? null
    this.autopilot = options.demo || run.autopilot === true
    this.sound = options.sound
    this.rng = options.rng
    this.file = readPlumberFile(this.demo ? null : options.resume)
    this.resume = readPlumberSave(this.file)
    this.slotCursor = this.file.active
    this.heroineSeed = this.resume?.heroine ?? plumberHeroine().seed
    this.cursor = rosterIndex(this.heroineSeed)
    this.endlessBest = this.file.endlessBest
    this.loadSlotMemory(this.resume)
    if (this.customLevel) {
      this.loadDef(this.customLevel)
      this.stageIndex = 0
      this.mode = 'play'
    } else if (run.endless) {
      this.beginEndless(run.endlessSeed)
      if (this.autopilot) this.mode = 'play'
    } else if (this.autopilot) {
      this.stageIndex = Math.max(
        0,
        Math.min(CAMPAIGN.length - 1, run.stage ?? 0),
      )
      this.loadStage(this.stageIndex)
      this.mode = 'play'
    }
  }

  get level() {
    return this.stageIndex + 1
  }

  /** What the cabinet keeps: the three-slot file, or null before anything is worth keeping. */
  get save(): PlumberFile | null | undefined {
    if (this.demo || this.customLevel) return undefined
    const empty = this.file.slots.every((slot) => !slot)
    return empty && !this.file.endlessBest ? null : this.file
  }

  private get slot(): PlumberSlot | null {
    return this.file.slots[this.file.active] ?? null
  }

  /** The map's view of this slot's progress. */
  get progress(): MapProgress {
    return {
      done: [...this.done],
      secrets: [...this.secrets],
      gears: [...this.gears],
    }
  }

  /** Load a slot's memory into the run (or clear it for a new slot). */
  private loadSlotMemory(slot: PlumberSlot | null) {
    this.gears = new Set(slot?.gears ?? [])
    this.done = new Set(slot?.done ?? [])
    this.secrets = new Set(slot?.secrets ?? [])
    this.deaths = slot?.deaths ?? 0
    this.timeBase = slot?.time ?? 0
    this.playFrames = 0
    const node = mapNode(slot?.node)
    this.mapNodeId = node ? node.id : startId(1)
  }

  get world(): number {
    return stageWorld(this.stage.code)
  }

  get worldDef(): PlumberWorld {
    return PLUMBER_WORLDS[this.world - 1]!
  }

  get member(): RosterHeroine {
    return rosterFor(rosterHeroine(this.heroineSeed))
  }

  private get menuItems(): ('play' | 'endless')[] {
    return ['play', 'endless']
  }

  /** Write the run into the active slot. */
  private remember(extra: Partial<PlumberSlot> = {}) {
    const slots = this.file.slots.slice()
    slots[this.file.active] = {
      heroine: this.heroineSeed,
      stage: this.stageIndex,
      node: this.mapNodeId,
      done: [...this.done],
      secrets: [...this.secrets],
      score: this.score,
      lives: Math.max(1, this.lives),
      tokens: this.tokens,
      cleared: this.slot?.cleared === true,
      gears: [...this.gears],
      deaths: this.deaths,
      time: this.timeBase + Math.floor(this.playFrames / 60),
      ...extra,
    }
    this.file = { ...this.file, slots }
  }

  /** Keep a new Endless best beside (never inside) the save slots. */
  private rememberEndless() {
    if (this.distance <= this.endlessBest) return
    this.endlessBest = this.distance
    this.file = { ...this.file, endlessBest: this.endlessBest }
  }

  private setMode(mode: Mode, timer = 0) {
    this.mode = mode
    this.modeTimer = timer
  }

  update(input: InputFrame) {
    if (this.over) return
    this.tick++
    if (this.modeTimer > 0) this.modeTimer--
    const keys = this.autopilot ? this.pilotInput() : input
    if (!this.endless && (this.mode === 'play' || this.mode === 'map'))
      this.playFrames++
    switch (this.mode) {
      case 'title':
        return this.updateTitle(keys)
      case 'files':
        return this.updateFiles(keys)
      case 'map':
        return this.updateMap(keys)
      case 'select':
        return this.updateSelect(keys)
      case 'story':
        return this.updateStory(keys)
      case 'intro':
        if (!this.modeTimer || keys.pressed.start || keys.pressed.a)
          this.setMode('play')
        return
      case 'play':
        return this.updatePlay(keys)
      case 'dying':
        if (!this.modeTimer) this.afterDeath()
        return
      case 'clear':
        if (!this.modeTimer) {
          if (this.customLevel) this.over = true
          else this.nextStage()
        }
        return
      case 'victory':
        if (
          !this.modeTimer ||
          (this.modeTimer < 420 && (keys.pressed.start || keys.pressed.a))
        ) {
          if (this.stageIndex + 1 < CAMPAIGN.length)
            this.enterMap(this.mapReveal)
          else this.over = true
        }
        return
      case 'over':
        if (!this.modeTimer) this.over = true
    }
  }

  private updateTitle(keys: InputFrame) {
    const items = this.menuItems
    if (keys.pressed.up || keys.pressed.down) {
      const step = keys.pressed.up ? items.length - 1 : 1
      this.menu = (this.menu + step) % items.length
      this.sound.play('blip')
    }
    if (!(keys.pressed.a || keys.pressed.start)) return
    this.sound.play('pickup')
    if (items[this.menu] === 'play') {
      this.slotCursor = this.file.active
      this.eraseArmed = false
      this.setMode('files')
    } else {
      this.pickEndless = true
      this.setMode('select')
    }
  }

  /** File select: three slots; A plays one (or starts a new one), Y twice erases, B goes back. */
  private updateFiles(keys: InputFrame) {
    if (keys.pressed.up || keys.pressed.down) {
      const step = keys.pressed.up ? SLOT_COUNT - 1 : 1
      this.slotCursor = (this.slotCursor + step) % SLOT_COUNT
      this.eraseArmed = false
      this.sound.play('blip')
    }
    const chosen = this.file.slots[this.slotCursor] ?? null
    if (keys.pressed.b) {
      if (this.eraseArmed) this.eraseArmed = false
      else this.setMode('title')
      return
    }
    if (keys.pressed.y && chosen) {
      if (!this.eraseArmed) {
        this.eraseArmed = true
        this.sound.play('blip')
        return
      }
      const slots = this.file.slots.slice()
      slots[this.slotCursor] = null
      this.file = { ...this.file, slots }
      this.eraseArmed = false
      this.sound.play('warn')
      return
    }
    if (!(keys.pressed.a || keys.pressed.start)) return
    this.eraseArmed = false
    this.file = { ...this.file, active: this.slotCursor }
    this.sound.play('pickup')
    if (!chosen) {
      this.pickEndless = false
      this.setMode('select')
      return
    }
    this.resume = readPlumberSave(this.file)
    this.loadSlotMemory(chosen)
    this.heroineSeed = chosen.heroine
    this.cursor = rosterIndex(this.heroineSeed)
    this.score = chosen.score
    this.lives = chosen.lives
    this.tokens = chosen.tokens
    this.enterMap()
  }

  /** Stand on the world map at the current node, drawing in any paths just opened. */
  private enterMap(reveal: MapPath[] = []) {
    const node = mapNode(this.mapNodeId) ?? mapNode(startId(1))!
    this.mapNodeId = node.id
    if (node.stage)
      this.stageIndex = CAMPAIGN.findIndex((s) => s.code === node.stage)
    else {
      // A trailhead or a node not built yet: the world's first stage (the
      // Upstream Sky has none, so she keeps the stage she came from).
      const first = CAMPAIGN.findIndex((s) => stageWorld(s.code) === node.world)
      if (first >= 0) this.stageIndex = first
    }
    this.loadStage(this.stageIndex)
    this.mapWalk = null
    this.mapToast = 0
    this.mapReveal = reveal
    this.mapRevealTimer = reveal.length ? MAP_REVEAL : 0
    this.hero.vx = 0
    this.ground = true
    this.remember()
    this.setMode('map')
  }

  private updateMap(keys: InputFrame) {
    if (this.mapToast > 0) this.mapToast--
    if (this.mapRevealTimer > 0) {
      this.mapRevealTimer--
      if (!this.mapRevealTimer) this.mapReveal = []
      return
    }
    const walk = this.mapWalk
    if (walk) {
      walk.t++
      this.stride++
      this.hero.vx = 1
      if (walk.t >= MAP_WALK) {
        this.mapNodeId = walk.to
        this.mapWalk = null
        this.hero.vx = 0
        this.enterMap()
      }
      return
    }
    const dirs: MapDirection[] = ['up', 'down', 'left', 'right']
    const dir = dirs.find((d) => keys.pressed[d] || keys.held[d])
    if (dir) {
      const step = stepFrom(this.mapNodeId, dir, this.progress)
      if (step) {
        const here = mapNode(this.mapNodeId)!
        const heading = warpHeading(step.path, here.id)
        const dx = heading
          ? heading === 'right'
            ? 1
            : heading === 'left'
              ? -1
              : 0
          : step.to.x - here.x
        if (dx) this.facing = dx > 0 ? 1 : -1
        this.mapWalk = { from: here.id, to: step.to.id, path: step.path, t: 0 }
        this.sound.play('blip')
      }
      return
    }
    if (!(keys.pressed.a || keys.pressed.start)) return
    const node = mapNode(this.mapNodeId)
    if (!node || node.kind === 'start') return
    if (!node.stage) {
      // Designed (GEN2-WORLDS.md) but not built yet: say so, never block.
      this.mapToast = 90
      this.sound.play('warn')
      return
    }
    this.sound.play('level')
    this.beginStage(CAMPAIGN.findIndex((s) => s.code === node.stage))
  }

  private updateSelect(keys: InputFrame) {
    const n = PLUMBER_ROSTER.length
    const before = this.cursor
    if (keys.pressed.left) this.cursor = (this.cursor + n - 1) % n
    if (keys.pressed.right) this.cursor = (this.cursor + 1) % n
    if (keys.pressed.up || keys.pressed.down)
      this.cursor = (this.cursor + 4) % n
    if (keys.pressed.b)
      this.cursor = (this.cursor + 1 + Math.floor(this.rng() * (n - 1))) % n
    if (this.cursor !== before) this.sound.play('blip')
    if (!(keys.pressed.a || keys.pressed.start)) return
    this.sound.play('level')
    this.heroineSeed = seedForRoster(this.cursor, this.rng)
    if (this.pickEndless) return this.beginEndless()
    this.score = 0
    this.lives = START_LIVES
    this.tokens = 0
    this.loadSlotMemory(null)
    this.stageIndex = 0
    this.loadStage(0)
    this.remember()
    this.storyPanel = 0
    this.setMode('story', STORY_PANEL)
  }

  private updateStory(keys: InputFrame) {
    if (keys.pressed.start) return this.enterMap()
    if (this.modeTimer && !keys.pressed.a) return
    this.storyPanel++
    this.sound.play('blip')
    if (this.storyPanel >= STORY.length) this.enterMap()
    else this.modeTimer = STORY_PANEL
  }

  /** An Endless run: one life, the first zone, the pace of World 1. */
  private beginEndless(seed?: number) {
    this.endless = true
    this.zoneSeed = seed ?? Math.floor(this.rng() * 1e6)
    this.zone = 0
    this.zoneStart = 0
    this.distance = 0
    this.score = 0
    this.lives = 1
    this.tokens = 0
    this.loadDef(buildEndlessZone(this.zoneSeed, 0))
    this.setMode('intro', 90)
  }

  /** Hand her to the next zone on the shared flat strip, mid-stride. */
  private nextZone() {
    const shift = (this.stage.cols - ENDLESS_PAD) * TILE
    const keep = {
      hero: { ...this.hero, x: this.hero.x - shift },
      ground: this.ground,
      hearts: this.hearts,
      immune: this.immune,
      camera: this.camera - shift,
      cameraY: this.cameraY,
    }
    this.zoneStart += this.stage.cols - ENDLESS_PAD
    this.zone++
    this.loadDef(buildEndlessZone(this.zoneSeed, this.zone))
    Object.assign(this, keep)
    this.sound.play('level')
  }

  private beginStage(index: number) {
    this.stageIndex = index
    this.loadStage(index)
    const node = stageNode(this.stage.code)
    if (node) this.mapNodeId = node.id
    this.remember()
    this.setMode('intro', 150)
  }

  /**
   * A stage cleared by `exit`: remember it, and hand back to the world map with
   * the paths it opened (a boss stage plays its world-clear scene first).
   */
  private nextStage(exit: 'normal' | 'secret' = 'normal') {
    const last = this.stageIndex + 1 >= CAMPAIGN.length
    if (this.autopilot)
      return this.beginDemoStage(last ? 0 : this.stageIndex + 1)
    const node = stageNode(this.stage.code)
    if (node) this.mapNodeId = node.id
    const before = this.progress
    ;(exit === 'secret' ? this.secrets : this.done).add(
      node?.id ?? this.stage.code,
    )
    const opened = newlyOpened(before, this.progress)
    if (this.boss) {
      this.mapReveal = opened
      this.remember({ cleared: this.slot?.cleared === true || last })
      this.setMode('victory', last ? 900 : 600)
      return
    }
    this.enterMap(opened)
  }

  private beginDemoStage(index: number) {
    this.stageIndex = index
    this.loadStage(index)
    this.setMode('play')
  }

  loadStage(index: number) {
    this.stageIndex = index
    this.loadDef(CAMPAIGN[index]!)
  }

  private loadDef(def: StageDef) {
    const stage = parseStage(def)
    this.stage = stage
    this.solid = stage.solid.slice()
    this.platforms = []
    this.foes = []
    this.vents = []
    this.springs = []
    this.tokensOnMap = []
    this.checkpoints = []
    this.valves = []
    this.waves = []
    this.cargo = []
    this.soot = []
    this.pickups = []
    this.gear = null
    this.gusts = []
    this.thrown = []
    this.carrying = false
    this.windy = new Uint8Array(stage.cols)
    this.goal = null
    this.boss = null
    this.locked = false
    let lift = 0
    for (const spawn of stage.spawns) {
      const cx = spawn.col * TILE + TILE / 2
      const bottom = (spawn.row + 1) * TILE
      switch (spawn.kind) {
        case 'token':
          this.tokensOnMap.push({
            x: cx,
            y: spawn.row * TILE + 8,
            taken: false,
          })
          break
        case 'pumpbug':
        case 'rivet-roller':
        case 'minnow':
        case 'cork-crab':
        case 'glass-gull':
        case 'moss-lantern':
        case 'spring-hare':
        case 'gasket-golem':
        case 'paper-kite':
        case 'umbrella-mite':
        case 'puddle-mimic':
        case 'siphon-sprite':
        case 'chimney-spirit':
        case 'tea-kettle-knight':
          this.foes.push({
            kind: spawn.kind,
            giant: spawn.giant === true,
            giantHits: 0,
            x: cx,
            y: bottom,
            vx: 0,
            vy: 0,
            dir: -1,
            state:
              spawn.kind === 'rivet-roller' || spawn.kind === 'puddle-mimic'
                ? 'idle'
                : 'walk',
            timer:
              spawn.kind === 'minnow' || spawn.kind === 'chimney-spirit'
                ? spawn.col * 13
                : 0,
            fade: 0,
            flipped: false,
            homeX: cx,
            homeY: bottom,
            carry: 0,
            pad: null,
          })
          break
        case 'raft': {
          const x = spawn.col * TILE - TILE
          const y = spawn.row * TILE + 4
          this.platforms.push({
            kind: 'raft',
            x,
            y,
            w: TILE * 3,
            baseX: x,
            baseY: y,
            sign: spawn.col % 2 ? 1 : -1,
            dx: 0,
            dy: 0,
          })
          break
        }
        case 'wind':
          this.windy[spawn.col] = 1
          break
        case 'glider':
          this.foes.push({
            kind: GLIDERS[stageWorld(stage.code) - 1] ?? 'glass-gull',
            x: cx,
            y: bottom - 16,
            vx: 0,
            vy: 0,
            dir: -1,
            state: 'walk',
            timer: 0,
            fade: 0,
            flipped: false,
            homeX: cx,
            homeY: bottom - 16,
            carry: 0,
            pad: null,
            glide: true,
          })
          break
        case 'gear':
          this.gear = {
            x: cx,
            y: bottom - 8,
            taken: this.gears.has(stage.code),
          }
          break
        case 'power-springstep':
        case 'power-storm':
        case 'power-lift':
        case 'heart':
          this.pickups.push({
            x: cx,
            y: bottom - 8,
            kind:
              spawn.kind === 'heart'
                ? 'heart'
                : spawn.kind === 'power-springstep'
                  ? 'springstep'
                  : spawn.kind === 'power-storm'
                    ? 'bottled-storm'
                    : 'pocket-lift',
            taken: false,
          })
          break
        case 'cargo':
          this.cargo.push({
            x: cx,
            top: spawn.row * TILE,
            y: 0,
            vy: 0,
            offset: spawn.col * 23,
            state: 'wait',
            pad: null,
            timer: 0,
          })
          break
        case 'steam-vent':
          this.vents.push({ x: cx, y: bottom, offset: spawn.col * 7 })
          break
        case 'springstep':
          this.springs.push({ x: cx, y: bottom, squash: 0 })
          break
        case 'piston':
        case 'lift': {
          const x = spawn.col * TILE - TILE
          const y = spawn.row * TILE
          this.platforms.push({
            kind: spawn.kind,
            x,
            y,
            w: TILE * 3,
            baseX: x,
            baseY: y,
            sign: spawn.kind === 'lift' ? (lift++ % 2 ? -1 : 1) : 1,
            dx: 0,
            dy: 0,
          })
          break
        }
        case 'checkpoint':
          this.checkpoints.push({ x: cx, y: bottom, reached: false })
          break
        case 'goal':
          this.goal = { x: cx, y: bottom }
          break
        case 'valve':
          this.valves.push({ x: cx, y: bottom, open: false })
          break
        case 'boss': {
          const world = stageWorld(stage.code)
          this.boss = {
            kind: BOSS_KINDS[world - 1] ?? 'pressure',
            name: PLUMBER_WORLDS[world - 1]!.boss.name,
            x: cx,
            y: bottom,
            vy: 0,
            dir: -1,
            hp: 3,
            state: 'wait',
            timer: 0,
            speed: 0.8,
            vx: 0,
            floor: bottom,
            home: cx,
          }
        }
      }
    }
    this.checkpoint = {
      x: stage.start.col * TILE + TILE / 2,
      y: (stage.start.row + 1) * TILE - TALL,
    }
    this.placeHero()
  }

  private placeHero() {
    this.hero = { x: this.checkpoint.x, y: this.checkpoint.y, vx: 0, vy: 0 }
    this.ground = false
    this.riding = null
    this.hearts = HEARTS
    this.immune = 60
    this.facing = 1
    this.camera = this.cameraTarget()
    this.cameraY = this.cameraTargetY()
  }

  solidAt(col: number, row: number): number {
    if (col < 0 || col >= this.stage.cols) return SOLID_BLOCK
    if (row < 0 || row >= this.stage.rows) return 0
    const s = this.solid[row * this.stage.cols + col]!
    if (s === SOLID_BRIDGE && !this.bridgeLit(this.clock ?? this.tick)) return 0
    return s
  }

  bridgeLit(t: number): boolean {
    return t % BRIDGE_CYCLE < BRIDGE_LIT
  }

  /** Ticks of light the crystal bridges have left (0 while dark). */
  private bridgeLeft(): number {
    const phase = this.tick % BRIDGE_CYCLE
    return phase < BRIDGE_LIT ? BRIDGE_LIT - phase : 0
  }

  private setSolid(col: number, row: number, value: number) {
    if (col < 0 || col >= this.stage.cols || row < 0 || row >= this.stage.rows)
      return
    this.solid[row * this.stage.cols + col] = value
  }

  /** Move a box horizontally against walls; returns true when it hit one. */
  private moveX(body: Body, half: number, tall: number, dx: number): boolean {
    body.x += dx
    const top = Math.floor((body.y + 1) / TILE)
    const bottom = Math.floor((body.y + tall - 1) / TILE)
    if (dx > 0) {
      const col = Math.floor((body.x + half) / TILE)
      for (let row = top; row <= bottom; row++)
        if (isWall(this.solidAt(col, row))) {
          body.x = col * TILE - half - 0.01
          return true
        }
    } else if (dx < 0) {
      const col = Math.floor((body.x - half) / TILE)
      for (let row = top; row <= bottom; row++)
        if (isWall(this.solidAt(col, row))) {
          body.x = (col + 1) * TILE + half + 0.01
          return true
        }
    }
    return false
  }

  /** Move a box vertically; returns 'land', 'bump' or null. */
  private moveY(body: Body, half: number, tall: number, dy: number) {
    const prevBottom = body.y + tall
    body.y += dy
    const left = Math.floor((body.x - half + 1) / TILE)
    const right = Math.floor((body.x + half - 1) / TILE)
    if (dy > 0) {
      const row = Math.floor((body.y + tall) / TILE)
      for (let col = left; col <= right; col++) {
        const s = this.solidAt(col, row)
        if (
          isWall(s) ||
          ((s === SOLID_LEDGE || s === SOLID_BRIDGE) &&
            prevBottom <= row * TILE + 0.5)
        ) {
          body.y = row * TILE - tall
          return 'land' as const
        }
      }
    } else if (dy < 0) {
      const row = Math.floor(body.y / TILE)
      for (let col = left; col <= right; col++)
        if (isWall(this.solidAt(col, row))) {
          body.y = (row + 1) * TILE
          return 'bump' as const
        }
    }
    return null
  }

  private updatePlatforms() {
    const t = this.tick
    for (const p of this.platforms) {
      const ox = p.x
      const oy = p.y
      const at = this.platformAt(p, t)
      p.x = at.x
      p.y = at.y
      p.dx = p.x - ox
      p.dy = p.y - oy
    }
  }

  private updatePlay(keys: InputFrame) {
    this.updatePlatforms()
    if (this.immune) this.immune--
    if (this.cooldown) this.cooldown--
    if (this.swing) this.swing--
    if (this.specialCooldown) this.specialCooldown--
    const hero = this.hero
    if (this.riding) {
      this.moveX(hero, HALF, TALL, this.riding.dx)
      hero.y += this.riding.dy
    }
    const runner = this.runnerOn
    const move = runner ? 1 : Number(keys.held.right) - Number(keys.held.left)
    this.updateDuck(keys, move)
    this.running = runner || (keys.held.b === true && move !== 0)
    const top = runner ? this.runSpeed : this.running ? RUN_FAST : RUN
    if (runner) hero.vx += (top - hero.vx) * 0.25
    // A crouch keeps a run's momentum as a slide, then crawls.
    else if (this.ducking && this.ground) {
      if (Math.abs(hero.vx) > CRAWL) hero.vx *= 0.95
      else hero.vx = move * CRAWL
    } else if (move) {
      let next = hero.vx + move * (this.running ? 0.5 : 0.44)
      if (Math.abs(next) > top)
        next = Math.sign(next) * Math.max(top, Math.abs(hero.vx) * 0.94)
      hero.vx = next
    } else hero.vx *= 0.77
    if (Math.abs(hero.vx) < 0.05) hero.vx = 0
    if (move && !this.specialTimer) this.facing = move > 0 ? 1 : -1
    if (keys.pressed.y) this.useSpecial()
    this.driveSpecial(keys)
    if (this.ground) this.stride += Math.abs(hero.vx) * 0.17
    const blocked = this.heroMoveX(hero.vx)
    if (blocked) hero.vx = 0
    const push = this.windAt(hero.x, this.tick) + this.beltUnder(hero)
    if (push) this.heroMoveX(push)
    if (runner && blocked && !this.specialTimer) {
      if (++this.pinned > PINNED) {
        this.pinned = 0
        this.sound.play('warn')
        return this.die()
      }
    } else this.pinned = 0
    if (this.ground) this.grace = 7
    else if (this.grace) this.grace--
    const jumpDown = keys.pressed.a || keys.pressed.up
    this.jumpHeld = keys.held.a || keys.held.up
    if (jumpDown) this.jumpBuffer = 7
    else if (this.jumpBuffer) this.jumpBuffer--
    if (this.jumpBuffer && this.grace) {
      hero.vy = this.power === 'springstep' ? SPRING_JUMP : JUMP
      this.ground = false
      this.riding = null
      this.grace = 0
      this.jumpBuffer = 0
      this.sound.play('blip')
    }
    if (hero.vy >= 0) this.sprung = false
    if (!this.jumpHeld && !this.sprung && hero.vy < -3.4) hero.vy = -3.4
    const floating = this.power === 'springstep' && this.jumpHeld && hero.vy > 0
    hero.vy = Math.min(
      floating ? 4 : 9,
      hero.vy + GRAVITY * (floating ? FLOAT : 1),
    )
    const prevBottom = hero.y + TALL
    const wasGround = this.ground
    this.ground = false
    this.riding = null
    const hit = this.heroMoveY(hero.vy)
    if (hit === 'land') {
      hero.vy = 0
      this.ground = true
    } else if (hit === 'bump') hero.vy = 0.5
    if (hero.vy >= 0) {
      for (const p of this.platforms) {
        if (prevBottom > p.y - p.dy + 0.6) continue
        if (
          hero.y + TALL < p.y ||
          hero.x + HALF < p.x ||
          hero.x - HALF > p.x + p.w
        )
          continue
        hero.y = p.y - TALL
        hero.vy = 0
        this.ground = true
        this.riding = p
        break
      }
    }
    if (this.ground && !wasGround) {
      this.landed = 6
      if (this.duckHeld) this.ducking = true
      this.airSpecial = false
      if (this.specialKind === 'pound' && this.specialTimer) this.poundLands()
    } else if (this.landed) this.landed--
    this.updateSprings(prevBottom)
    if (keys.pressed.down && this.ground) this.tryDoor()
    if (keys.pressed.x && !this.cooldown) this.useTool()
    this.collectTokens()
    this.collectPickups()
    this.updateFoes(prevBottom)
    this.updateVents()
    this.updateCargo()
    this.updateSoot()
    this.updateGusts()
    this.updateThrown()
    if (this.boss) this.updateBoss(prevBottom)
    this.updateCheckpoints()
    if (hero.y > this.stage.rows * TILE + 40) return this.die()
    const wet = this.solidAt(
      Math.floor(hero.x / TILE),
      Math.floor((hero.y + TALL - 6) / TILE),
    )
    if (wet === SOLID_WATER) {
      this.sound.play('pop')
      return this.die()
    }
    if (this.endless) {
      this.distance = Math.max(
        this.distance,
        this.zoneStart + Math.floor(hero.x / TILE),
      )
      if (hero.x > (this.stage.cols - ENDLESS_PAD / 2) * TILE)
        return this.nextZone()
    }
    if (
      this.goal &&
      Math.abs(this.goal.x - hero.x) < 16 &&
      hero.y + TALL > this.goal.y - 48
    )
      return this.stageClear()
    if (this.stage.gate !== null && !this.locked) {
      const gateX = (this.stage.gate + 1) * TILE + HALF
      if (hero.x > gateX + TILE) {
        this.locked = true
        for (let row = 1; row < this.groundRow; row++)
          this.setSolid(this.stage.gate, row, SOLID_BLOCK)
        // The arena is the boss's: strays that rolled or wandered in are cleared.
        for (const foe of this.foes) if (foe.x > gateX) foe.state = 'gone'
        if (this.boss) this.boss.state = 'walk'
        this.sound.play('extra')
      }
    }
    const target = this.cameraTarget()
    this.camera += (target - this.camera) * 0.2
    this.cameraY += (this.cameraTargetY() - this.cameraY) * 0.14
  }

  /** In an Endless run she runs on her own (the campaign moves freely). */
  get runnerOn(): boolean {
    return this.endless && !this.locked
  }

  get runSpeed(): number {
    if (this.endless) return Math.min(ENDLESS_TOP, 2.9 + 0.12 * this.zone)
    return RUNNER_SPEED[Math.min(RUNNER_SPEED.length, this.world) - 1] ?? 3
  }

  /** The top of her hitbox: lower while she slides. */
  get heroTop(): number {
    return this.hero.y + (this.ducking ? DUCK : 0)
  }

  /**
   * Duck: slide on the ground (staying down under a low ceiling), drop fast in
   * the air. In Endless that is B; in the campaign it is Down, or B with no
   * direction held (B with a direction runs).
   */
  private updateDuck(keys: InputFrame, move: number) {
    const hero = this.hero
    const down = keys.held.down === true
    const want = this.runnerOn
      ? keys.held.b === true
      : down || (keys.held.b === true && !move)
    this.duckHeld = want
    if (!this.ground) {
      this.ducking = false
      const drop = this.runnerOn ? keys.held.b === true : down
      if (drop && hero.vy > -2) hero.vy = Math.max(hero.vy, 6)
      return
    }
    if (want) this.ducking = true
    else if (this.ducking && this.headroom()) this.ducking = false
  }

  /** Room to stand up: nothing solid where her head would go. */
  private headroom(): boolean {
    const hero = this.hero
    const row = Math.floor((hero.y + 1) / TILE)
    for (
      let col = Math.floor((hero.x - HALF + 1) / TILE);
      col <= Math.floor((hero.x + HALF - 1) / TILE);
      col++
    )
      if (isWall(this.solidAt(col, row))) return false
    return true
  }

  /** Move the heroine with her current hitbox (shorter while ducking). */
  private heroMoveX(dx: number): boolean {
    if (!this.ducking) return this.moveX(this.hero, HALF, TALL, dx)
    const body: Body = { ...this.hero, y: this.hero.y + DUCK }
    const hit = this.moveX(body, HALF, TALL - DUCK, dx)
    this.hero.x = body.x
    return hit
  }

  private heroMoveY(dy: number) {
    if (!this.ducking) return this.moveY(this.hero, HALF, TALL, dy)
    const body: Body = { ...this.hero, y: this.hero.y + DUCK }
    const hit = this.moveY(body, HALF, TALL - DUCK, dy)
    this.hero.y = body.y - DUCK
    return hit
  }

  get specialKind(): PlumberSpecial {
    return this.member.special.key
  }

  /** Y: start the heroine's special, if it is ready here. */
  private useSpecial() {
    const hero = this.hero
    const kind = this.specialKind
    if (this.specialCooldown || this.specialTimer) return
    const air = !this.ground
    if (air && this.airSpecial) return
    switch (kind) {
      case 'dash':
        this.specialTimer = 12
        this.specialCooldown = 40
        break
      case 'double-jump':
        if (!air) {
          this.jumpBuffer = 7
          return
        }
        hero.vy = JUMP * 0.92
        this.sprung = true
        this.specialCooldown = 10
        break
      case 'pound':
        if (!air) {
          this.shock(hero.x, hero.y + TALL, 48)
          this.specialCooldown = 45
          return
        }
        this.specialTimer = 90
        hero.vx = 0
        hero.vy = 9
        break
      case 'charge':
        this.specialTimer = 22
        this.specialCooldown = 50
        break
      case 'float':
        return
      case 'spin':
        this.specialTimer = 18
        this.specialCooldown = 36
        if (air) hero.vy = Math.min(hero.vy, -1.5)
        this.shock(hero.x, hero.y + TALL / 2, 40)
        break
      case 'roll':
        if (air) return
        this.specialTimer = 24
        this.specialCooldown = 40
        break
      case 'vault':
        if (air) return
        hero.vy = SPRING * 0.95
        this.sprung = true
        this.ground = false
        this.riding = null
        this.specialCooldown = 50
        break
    }
    if (air) this.airSpecial = true
    this.sound.play(kind === 'pound' || kind === 'charge' ? 'boom' : 'extra')
  }

  /** While a special runs it steers the heroine; returns nothing, moves her in place. */
  private driveSpecial(keys: InputFrame) {
    const hero = this.hero
    const kind = this.specialKind
    this.floating = kind === 'float' && !this.ground && keys.held.y === true
    if (this.floating && hero.vy > 1.2) hero.vy = 1.2
    if (!this.specialTimer) return
    this.specialTimer--
    if (kind === 'dash') {
      hero.vx = this.facing * 6.4
      hero.vy = Math.min(hero.vy, 0)
    } else if (kind === 'charge' || kind === 'roll') {
      hero.vx = this.facing * (kind === 'charge' ? 5 : 4.6)
      if (kind === 'charge') this.smashAhead()
    } else if (kind === 'pound') {
      hero.vx = 0
      hero.vy = 9
    } else if (kind === 'spin' && this.specialTimer === 9)
      this.shock(hero.x, hero.y + TALL / 2, 40)
  }

  /** Nothing hurts a heroine mid-charge or mid-roll. */
  private get shielded(): boolean {
    return (
      this.specialTimer > 0 &&
      (this.specialKind === 'charge' || this.specialKind === 'roll')
    )
  }

  private poundLands() {
    this.specialTimer = 0
    this.specialCooldown = 45
    const hero = this.hero
    this.shock(hero.x, hero.y + TALL, 56)
    const row = Math.floor((hero.y + TALL + 2) / TILE)
    for (let dx = -1; dx <= 1; dx++) {
      const col = Math.floor(hero.x / TILE) + dx
      if (this.solidAt(col, row) === SOLID_CRATE) {
        this.setSolid(col, row, 0)
        this.score += 70
        this.tokens++
      }
    }
    this.sound.play('boom')
  }

  /** A charge breaks the crate in front of the heroine. */
  private smashAhead() {
    const hero = this.hero
    const col = Math.floor((hero.x + this.facing * (HALF + 3)) / TILE)
    for (
      let row = Math.floor(hero.y / TILE);
      row <= Math.floor((hero.y + TALL - 1) / TILE);
      row++
    )
      if (this.solidAt(col, row) === SOLID_CRATE) {
        this.setSolid(col, row, 0)
        this.score += 70
        this.tokens++
        this.sound.play('pop')
      }
  }

  /** A shockwave: strikes every foe within `radius`, and turns valves. */
  private shock(x: number, y: number, radius: number) {
    for (const foe of this.foes) {
      if (foe.state === 'gone' || foe.fade) continue
      if (foe.kind === 'minnow' && foe.y >= foe.homeY) continue
      if (Math.hypot(foe.x - x, foe.y - 10 - y) > radius) continue
      this.strikeFoe(foe)
    }
    for (const valve of this.valves)
      if (!valve.open && Math.hypot(valve.x - x, valve.y - 8 - y) < radius) {
        valve.open = true
        this.score += 200
        for (let i = 0; i < this.solid.length; i++)
          if (this.solid[i] === SOLID_GATE) this.solid[i] = 0
        this.sound.play('extra')
      }
    const boss = this.boss
    if (boss && boss.state === 'recover' && Math.abs(boss.x - x) < radius)
      this.hitBoss()
  }

  /** The headwind push at `x` on tick `t`: gusts blow for half of every cycle. */
  windAt(x: number, t: number): number {
    const col = Math.floor(x / TILE)
    if (!this.windy[col]) return 0
    return t % 300 < 150 ? -GUST : 0
  }

  private beltUnder(body: Body): number {
    if (!this.ground || this.riding) return 0
    const s = this.solidAt(
      Math.floor(body.x / TILE),
      Math.floor((body.y + TALL + 1) / TILE),
    )
    return s === SOLID_BELT_LEFT ? -BELT : s === SOLID_BELT_RIGHT ? BELT : 0
  }

  cargoPhase(cargo: Cargo): number {
    return (this.tick + cargo.offset) % 240
  }

  private updateCargo() {
    const hero = this.hero
    for (const cargo of this.cargo) {
      if (cargo.state === 'wait') {
        if (this.cargoPhase(cargo) === 0) {
          cargo.state = 'fall'
          cargo.y = cargo.top - TILE
          cargo.vy = 0
        }
        continue
      }
      if (cargo.state === 'landed') {
        if (--cargo.timer > 0) continue
        this.platforms = this.platforms.filter((p) => p !== cargo.pad)
        if (this.riding === cargo.pad) this.riding = null
        cargo.pad = null
        cargo.state = 'wait'
        continue
      }
      cargo.vy = Math.min(5, cargo.vy + 0.18)
      const body: Body = { x: cargo.x, y: cargo.y, vx: 0, vy: cargo.vy }
      const hit = this.moveY(body, 7, TILE, cargo.vy)
      cargo.y = body.y
      if (
        Math.abs(hero.x - cargo.x) < HALF + 7 &&
        hero.y < cargo.y + TILE &&
        hero.y + TALL > cargo.y + 4
      )
        this.hurt(hero.x < cargo.x ? -1 : 1)
      if (hit === 'land') {
        cargo.state = 'landed'
        cargo.timer = 260
        cargo.pad = {
          kind: 'cargo',
          x: cargo.x - 9,
          y: cargo.y,
          w: 18,
          baseX: cargo.x - 9,
          baseY: cargo.y,
          sign: 1,
          dx: 0,
          dy: 0,
        }
        this.platforms.push(cargo.pad)
        this.sound.play('boom')
      } else if (cargo.y > this.stage.rows * TILE) cargo.state = 'wait'
    }
  }

  private updateSoot() {
    const hero = this.hero
    for (const puff of this.soot) {
      puff.vy += 0.2
      puff.x += puff.vx
      puff.y += puff.vy
      if (
        Math.abs(puff.x - hero.x) < HALF + 5 &&
        puff.y > this.heroTop &&
        puff.y < hero.y + TALL
      ) {
        this.hurt(puff.vx < 0 ? -1 : 1)
        puff.y = this.stage.rows * TILE + 99
      }
    }
    this.soot = this.soot.filter(
      (p) =>
        p.y < this.stage.rows * TILE &&
        !isWall(this.solidAt(Math.floor(p.x / TILE), Math.floor(p.y / TILE))),
    )
  }

  /** The stage's ground surface row: three rows above the bottom, in every stage. */
  get groundRow(): number {
    return this.stage.rows - 3
  }

  /** Follow the heroine up; on the ground the view sits at the bottom of the stage. */
  private cameraTargetY() {
    const max = Math.max(0, this.stage.rows * TILE - H)
    if (this.locked) return max
    return Math.max(0, Math.min(max, this.hero.y + TALL / 2 - H * 0.55))
  }

  private cameraTarget() {
    const max = this.stage.cols * TILE - W
    if (this.locked) return max
    return Math.max(0, Math.min(max, this.hero.x - W * 0.4))
  }

  private updateSprings(prevBottom: number) {
    const hero = this.hero
    for (const spring of this.springs) {
      if (spring.squash) spring.squash--
      if (hero.vy < 0 && !this.ground) continue
      if (Math.abs(hero.x - spring.x) > 12) continue
      const top = spring.y - 10
      const feet = hero.y + TALL
      const landing = prevBottom <= top + 1 && feet >= top
      const stepping =
        this.ground &&
        Math.abs(hero.x - spring.x) < 9 &&
        Math.abs(feet - spring.y) < 2
      if (landing || stepping) {
        hero.y = top - TALL
        hero.vy = SPRING
        this.sprung = true
        this.ground = false
        this.riding = null
        spring.squash = 12
        this.sound.play('extra')
      }
    }
  }

  private tryDoor() {
    const hero = this.hero
    const feet = Math.round(hero.y + TALL)
    const doors = this.stage.doors
    for (const door of doors) {
      if (feet !== door.row * TILE) continue
      if (Math.abs(hero.x - (door.col * TILE + TILE / 2)) > 10) continue
      const to = doors[door.to]!
      hero.x = to.col * TILE + TILE / 2
      hero.y = to.row * TILE - TALL
      hero.vx = hero.vy = 0
      this.camera = this.cameraTarget()
      this.sound.play('extra')
      return
    }
  }

  private toolBox() {
    const hero = this.hero
    const near = hero.x + this.facing * 6
    const far = hero.x + this.facing * 42
    return {
      left: Math.min(near, far),
      right: Math.max(near, far),
      top: hero.y + 2,
      bottom: hero.y + TALL,
    }
  }

  private useTool() {
    this.cooldown = 20
    this.swing = 14
    const hero = this.hero
    if (this.carrying) {
      this.carrying = false
      this.thrown.push({
        x: hero.x + this.facing * 12,
        y: hero.y - 4,
        vx: this.facing * 4.2 + hero.vx * 0.3,
        vy: -3.2,
      })
      this.sound.play('shoot')
      return
    }
    if (this.power === 'bottled-storm')
      this.gusts.push({
        x: hero.x + this.facing * 16,
        y: hero.y + 12,
        dir: this.facing,
        life: 48,
      })
    const box = this.toolBox()
    const inBox = (x: number, y: number) =>
      x >= box.left - 10 &&
      x <= box.right + 10 &&
      y >= box.top - 6 &&
      y <= box.bottom + 18
    let struck = false
    for (const foe of this.foes) {
      if (foe.state === 'gone' || foe.fade) continue
      if (!inBox(foe.x, foe.y - 8)) continue
      if (foe.kind === 'minnow' && foe.y >= foe.homeY) continue
      struck = true
      this.strikeFoe(foe)
    }
    for (const valve of this.valves)
      if (!valve.open && inBox(valve.x, valve.y - 8)) {
        valve.open = true
        struck = true
        this.score += 200
        for (let i = 0; i < this.solid.length; i++)
          if (this.solid[i] === SOLID_GATE) this.solid[i] = 0
        this.sound.play('extra')
      }
    const rowTop = Math.floor(box.top / TILE)
    const rowBottom = Math.floor((box.bottom - 1) / TILE)
    let lifted = false
    for (
      let col = Math.floor(box.left / TILE);
      col <= Math.floor(box.right / TILE);
      col++
    )
      for (let row = rowTop - 1; row <= rowBottom; row++)
        if (this.solidAt(col, row) === SOLID_CRATE && !lifted) {
          this.setSolid(col, row, 0)
          struck = true
          if (this.power === 'pocket-lift') {
            this.carrying = lifted = true
            this.score += 20
            continue
          }
          this.score += 70
          this.tokens++
        }
    const boss = this.boss
    if (
      boss &&
      boss.state === 'recover' &&
      Math.abs(boss.x - (box.left + box.right) / 2) < 46
    ) {
      this.hitBoss()
      struck = true
    }
    this.sound.play(struck ? 'pop' : 'shoot')
  }

  /** A wrench or a gust landing on a foe. */
  private strikeFoe(foe: Foe) {
    if (foe.kind === 'moss-lantern') {
      if (foe.state !== 'flat') this.flatten(foe)
    } else if (foe.kind === 'gasket-golem' && foe.state !== 'stunned')
      this.loosen(foe)
    else if (foe.kind !== 'rivet-roller') this.defeat(foe, true, 150)
    else if (foe.state === 'stunned') this.kick(foe, this.facing)
    else {
      foe.state = 'stunned'
      foe.timer = 300
      foe.vx = 0
      this.score += 100
    }
  }

  private collectPickups() {
    const hero = this.hero
    if (this.gearFlash) this.gearFlash--
    const gear = this.gear
    if (
      gear &&
      !gear.taken &&
      Math.abs(gear.x - hero.x) < 16 &&
      gear.y > hero.y - 12 &&
      gear.y < hero.y + TALL + 10
    ) {
      gear.taken = true
      this.gears.add(this.stage.code)
      this.score += 1000
      this.gearFlash = 120
      if (!this.demo) this.remember()
      this.sound.play('level')
    }
    for (const pickup of this.pickups) {
      if (pickup.taken) continue
      if (Math.abs(pickup.x - hero.x) > 15) continue
      if (pickup.y < hero.y - 10 || pickup.y > hero.y + TALL + 8) continue
      pickup.taken = true
      this.score += 100
      if (pickup.kind === 'heart')
        this.hearts = Math.min(HEARTS, this.hearts + 1)
      else {
        this.power = pickup.kind
        this.carrying = false
      }
      this.sound.play('level')
    }
  }

  private updateGusts() {
    for (const gust of this.gusts) {
      gust.x += gust.dir * 4.2
      gust.life--
      const col = Math.floor(gust.x / TILE)
      const row = Math.floor(gust.y / TILE)
      const s = this.solidAt(col, row)
      if (s === SOLID_CRATE) {
        this.setSolid(col, row, 0)
        this.score += 70
        this.tokens++
        gust.life = 0
      } else if (isWall(s)) gust.life = 0
      for (const foe of this.foes) {
        if (!gust.life || foe.state === 'gone' || foe.fade) continue
        if (foe.kind === 'minnow' && foe.y >= foe.homeY) continue
        if (Math.abs(foe.x - gust.x) > 14 || Math.abs(foe.y - 10 - gust.y) > 20)
          continue
        this.strikeFoe(foe)
        gust.life = 0
      }
      for (const valve of this.valves)
        if (!valve.open && Math.abs(valve.x - gust.x) < 14) {
          valve.open = true
          this.score += 200
          for (let i = 0; i < this.solid.length; i++)
            if (this.solid[i] === SOLID_GATE) this.solid[i] = 0
          this.sound.play('extra')
        }
      const boss = this.boss
      if (
        gust.life &&
        boss &&
        boss.state === 'recover' &&
        Math.abs(boss.x - gust.x) < 26
      ) {
        this.hitBoss()
        gust.life = 0
      }
    }
    this.gusts = this.gusts.filter((g) => g.life > 0)
  }

  private updateThrown() {
    const hero = this.hero
    for (const crate of this.thrown) {
      crate.vy = Math.min(9, crate.vy + GRAVITY)
      crate.x += crate.vx
      crate.y += crate.vy
      const col = Math.floor(crate.x / TILE)
      const row = Math.floor((crate.y + 8) / TILE)
      let done = false
      for (const foe of this.foes) {
        if (done || foe.state === 'gone' || foe.fade) continue
        if (
          Math.abs(foe.x - crate.x) > 16 ||
          Math.abs(foe.y - 10 - crate.y) > 18
        )
          continue
        this.defeat(foe, true, 200)
        done = true
      }
      const boss = this.boss
      if (
        !done &&
        boss &&
        boss.state === 'recover' &&
        Math.abs(boss.x - crate.x) < 26 &&
        crate.y > boss.y - 70
      ) {
        this.hitBoss()
        done = true
      }
      const s = this.solidAt(col, row)
      if (!done && s === SOLID_CRATE) {
        this.setSolid(col, row, 0)
        this.score += 70
        this.tokens++
        done = true
      } else if (!done && (isWall(s) || s === SOLID_LEDGE)) {
        const restRow = row - 1
        const overHero =
          Math.abs(hero.x - (col * TILE + 8)) < HALF + 8 &&
          hero.y < (restRow + 1) * TILE &&
          hero.y + TALL > restRow * TILE
        if (crate.vy > 0 && !this.solidAt(col, restRow) && !overHero)
          this.setSolid(col, restRow, SOLID_CRATE)
        done = true
        this.sound.play('boom')
      }
      if (done || crate.y > this.stage.rows * TILE) crate.y = 1e9
    }
    this.thrown = this.thrown.filter((c) => c.y < 1e8)
  }

  private collectTokens() {
    const hero = this.hero
    for (const token of this.tokensOnMap) {
      if (token.taken) continue
      if (Math.abs(token.x - hero.x) > 15) continue
      if (token.y < hero.y - 10 || token.y > hero.y + TALL + 8) continue
      token.taken = true
      this.score += 50
      this.tokens++
      if (this.tokens >= 100) {
        this.tokens -= 100
        this.lives++
        this.sound.play('level')
      } else this.sound.play('pickup')
    }
  }

  private kick(foe: Foe, dir: number) {
    foe.state = 'kicked'
    foe.dir = dir
    foe.timer = 420
    foe.vx = dir * 4.6
    this.score += 100
    this.sound.play('boom')
  }

  private defeat(foe: Foe, flipped: boolean, points: number) {
    foe.fade = 30
    foe.flipped = flipped
    this.score += points + (foe.giant ? 200 : 0)
    if (foe.carry) {
      this.tokens += foe.carry
      foe.carry = 0
    }
    this.sound.play('pop')
  }

  private flatten(foe: Foe) {
    foe.state = 'flat'
    foe.timer = 360
    foe.pad = {
      kind: 'lantern',
      x: foe.x - 16,
      y: foe.y - 9,
      w: 32,
      baseX: foe.x - 16,
      baseY: foe.y - 9,
      sign: 1,
      dx: 0,
      dy: 0,
    }
    this.platforms.push(foe.pad)
    this.score += 50
    this.sound.play('pop')
  }

  /** A gasket golem's first hit knocks its armour plate loose. */
  private loosen(foe: Foe) {
    foe.state = 'stunned'
    foe.timer = 180
    this.score += 100
    this.sound.play('pop')
  }

  /** Walk, fall and turn; returns true when it is standing on something. */
  private walkFoe(
    foe: Foe,
    speed: number,
    turnAtEdge: boolean,
    fall = 9,
  ): boolean {
    foe.vx = foe.dir * speed
    const halfWidth = foe.giant ? 14 : 9
    const height = foe.giant ? 32 : 16
    const body: Body = { x: foe.x, y: foe.y - height, vx: foe.vx, vy: foe.vy }
    if (speed && this.moveX(body, halfWidth, height, foe.vx)) foe.dir *= -1
    else if (speed && turnAtEdge && foe.vy === 0) {
      const aheadCol = Math.floor((body.x + foe.dir * 10) / TILE)
      const belowRow = Math.floor((foe.y + 2) / TILE)
      const s = this.solidAt(aheadCol, belowRow)
      if (!isWall(s) && s !== SOLID_LEDGE && s !== SOLID_BRIDGE) foe.dir *= -1
    }
    body.vy = Math.min(fall, foe.vy + GRAVITY)
    const landed = this.moveY(body, halfWidth, height, body.vy) === 'land'
    if (landed) body.vy = 0
    foe.x = body.x
    foe.y = body.y + height
    foe.vy = body.vy
    return landed
  }

  private moveFoe(foe: Foe) {
    const hero = this.hero
    if (foe.glide) {
      if (hero.x > foe.x - 400) foe.x -= 1.3
      foe.y = foe.homeY + Math.sin(this.tick / 9) * 1.5
      foe.dir = -1
      return
    }
    switch (foe.kind) {
      case 'pumpbug':
      case 'cork-crab':
        this.walkFoe(foe, foe.kind === 'pumpbug' ? 0.6 : 0.8, true)
        return
      case 'rivet-roller': {
        if (foe.state === 'idle' && Math.abs(hero.x - foe.x) < 190) {
          foe.state = 'walk'
          foe.dir = hero.x < foe.x ? -1 : 1
        }
        if (foe.state === 'stunned' && --foe.timer <= 0) foe.state = 'walk'
        if (foe.state === 'kicked' && --foe.timer <= 0) {
          foe.fade = 20
          return
        }
        const speed =
          foe.state === 'kicked' ? 4.6 : foe.state === 'walk' ? 1.5 : 0
        this.walkFoe(foe, speed, false)
        return
      }
      case 'minnow': {
        foe.timer++
        if (foe.y >= foe.homeY && foe.timer % 170 === 0) foe.vy = -9.6
        if (foe.vy || foe.y < foe.homeY) {
          foe.vy += GRAVITY * 0.9
          foe.y += foe.vy
          if (foe.y >= foe.homeY) {
            foe.y = foe.homeY
            foe.vy = 0
          }
        }
        foe.x = foe.homeX + Math.sin(foe.timer / 30) * 6
        return
      }
      case 'glass-gull': {
        foe.timer = Math.max(0, foe.timer - 1)
        if (foe.state === 'swoop') {
          foe.x += foe.vx
          foe.y += foe.vy
          if (!foe.timer || foe.y > foe.homeY + 150) {
            foe.state = 'walk'
            foe.timer = 120
          }
          return
        }
        const speed = foe.carry ? 2 : 1.1
        if (foe.carry) foe.dir = foe.x < hero.x ? -1 : 1
        else if (Math.abs(foe.x - foe.homeX) > 120)
          foe.dir = foe.x < foe.homeX ? 1 : -1
        foe.x += foe.dir * speed
        const rest = foe.homeY + Math.sin(this.tick / 20 + foe.homeX) * 6
        foe.y += Math.max(-1.6, Math.min(1.6, rest - foe.y))
        const dx = hero.x - foe.x
        const dy = hero.y + 8 - foe.y
        if (!foe.carry && !foe.timer && Math.abs(dx) < 70 && dy > 20) {
          const d = Math.hypot(dx, dy) || 1
          foe.state = 'swoop'
          foe.vx = (dx / d) * 2.6
          foe.vy = (dy / d) * 2.6
          foe.timer = 70
          foe.dir = dx < 0 ? -1 : 1
        }
        return
      }
      case 'moss-lantern':
        if (foe.state === 'flat') {
          if (--foe.timer <= 0) {
            foe.state = 'walk'
            this.platforms = this.platforms.filter((p) => p !== foe.pad)
            if (this.riding === foe.pad) this.riding = null
            foe.pad = null
          }
          return
        }
        foe.timer++
        if (foe.vy === 0 && foe.timer % 90 === 0) foe.vy = -4
        this.walkFoe(foe, 0, false)
        return
      case 'gasket-golem':
        if (foe.state === 'stunned') {
          if (--foe.timer <= 0) foe.state = 'walk'
          this.walkFoe(foe, 0, true)
          return
        }
        this.walkFoe(foe, 0.45, true)
        return
      case 'umbrella-mite':
        this.walkFoe(foe, 0.7, false, 1.1)
        return
      case 'puddle-mimic': {
        const dx = hero.x - foe.x
        if (foe.state === 'idle') {
          if (Math.abs(dx) < 70 && Math.abs(hero.y + TALL - foe.y) < 40) {
            foe.state = 'walk'
            foe.timer = 110
            foe.dir = dx < 0 ? -1 : 1
          }
          this.walkFoe(foe, 0, false)
          return
        }
        if (--foe.timer <= 0) foe.state = 'idle'
        this.walkFoe(foe, foe.timer < 95 ? 1.5 : 0, true)
        return
      }
      case 'siphon-sprite': {
        foe.timer++
        const dx = hero.x - foe.x
        if (Math.abs(dx) < 160) foe.dir = dx < 0 ? -1 : 1
        if (Math.abs(dx) < 160) foe.x += foe.dir * 0.55
        foe.y = foe.homeY + Math.sin(foe.timer / 18) * 10
        return
      }
      case 'chimney-spirit': {
        foe.timer++
        foe.dir = hero.x < foe.x ? -1 : 1
        const phase = foe.timer % 200
        if (phase === 0 && Math.abs(hero.x - foe.x) < 240) {
          this.soot.push({
            x: foe.x,
            y: foe.y - 24,
            vx: Math.max(-2.4, Math.min(2.4, (hero.x - foe.x) / 55)),
            vy: -5,
          })
          this.sound.play('shoot')
        }
        this.walkFoe(foe, 0, false)
        return
      }
      case 'tea-kettle-knight': {
        const dx = hero.x - foe.x
        if (foe.state === 'swoop') {
          if (--foe.timer <= 0) {
            foe.state = 'idle'
            foe.timer = 70
          }
          this.walkFoe(foe, 3.1, true)
          return
        }
        if (foe.state === 'stunned') {
          if (--foe.timer <= 0) {
            foe.state = 'swoop'
            foe.timer = 32
            this.sound.play('warn')
          }
          this.walkFoe(foe, 0, true)
          return
        }
        if (foe.state === 'idle' && --foe.timer <= 0) foe.state = 'walk'
        if (Math.abs(dx) < 150) foe.dir = dx < 0 ? -1 : 1
        if (foe.state === 'walk' && Math.abs(dx) < 84) {
          foe.state = 'stunned'
          foe.timer = 45
        }
        this.walkFoe(foe, 0.5, true)
        return
      }
      case 'paper-kite': {
        foe.timer++
        if (Math.abs(foe.x - foe.homeX) > 88)
          foe.dir = foe.x < foe.homeX ? 1 : -1
        foe.x += foe.dir * 1.0
        foe.y = foe.homeY + Math.sin(foe.timer / 26 + foe.homeX) * 20
        return
      }
      case 'spring-hare': {
        if (foe.state === 'stunned') {
          if (--foe.timer <= 0) foe.state = 'walk'
          this.walkFoe(foe, 0, false)
          return
        }
        const grounded = foe.vy === 0
        if (grounded && --foe.timer <= 0) {
          foe.vy = -7.4
          foe.dir = hero.x < foe.x ? -1 : 1
          foe.timer = 60
        }
        this.walkFoe(foe, grounded ? 0 : 1.3, false)
        return
      }
    }
  }

  private updateFoes(prevBottom: number) {
    const hero = this.hero
    for (const foe of this.foes) {
      if (foe.fade) {
        foe.fade--
        if (!foe.fade) foe.state = 'gone'
        continue
      }
      if (foe.state === 'gone') continue
      this.moveFoe(foe)
      if (foe.fade) continue
      if (foe.y > this.stage.rows * TILE + 40) {
        foe.state = 'gone'
        continue
      }
      if (foe.state === 'kicked')
        for (const other of this.foes)
          if (
            other !== foe &&
            !other.fade &&
            other.state !== 'gone' &&
            Math.abs(other.x - foe.x) < 18 &&
            Math.abs(other.y - foe.y) < 18
          ) {
            this.defeat(other, true, 200)
          }
      if (foe.kind === 'minnow' && foe.y >= foe.homeY) continue
      if (foe.kind === 'moss-lantern' && foe.state === 'flat') continue
      if (foe.kind === 'puddle-mimic' && foe.state === 'idle') continue
      const overlap =
        Math.abs(foe.x - hero.x) < HALF + (foe.giant ? 16 : 9) &&
        hero.y + TALL > foe.y - (foe.giant ? 36 : 18) &&
        this.heroTop < foe.y
      if (!overlap || this.mode !== 'play') continue
      const stomp = hero.vy > 0.5 && prevBottom <= foe.y - (foe.giant ? 26 : 10)
      if (this.shielded && !stomp) {
        if (this.specialKind === 'charge') this.strikeFoe(foe)
        continue
      }
      if (stomp && this.specialKind === 'pound' && this.specialTimer) {
        this.defeat(foe, true, 200)
        continue
      }
      if (stomp) {
        hero.vy = this.jumpHeld ? -7.6 : -5.4
        this.ground = false
        if (foe.giant && !foe.giantHits) {
          foe.giantHits = 1
          this.score += 50
          this.sound.play('pop')
          continue
        }
        if (foe.kind === 'rivet-roller') {
          if (foe.state === 'stunned') this.kick(foe, hero.x < foe.x ? 1 : -1)
          else {
            foe.state = 'stunned'
            foe.timer = 300
            this.score += 100
            this.sound.play('pop')
          }
        } else if (foe.kind === 'moss-lantern') this.flatten(foe)
        else if (foe.kind === 'gasket-golem' && foe.state !== 'stunned')
          this.loosen(foe)
        else if (foe.kind === 'spring-hare') {
          hero.vy = SPRING * 0.92
          this.sprung = true
          foe.state = 'stunned'
          foe.timer = 40
          this.score += 50
          this.sound.play('extra')
        } else this.defeat(foe, foe.kind !== 'pumpbug', 100)
      } else if (foe.kind === 'rivet-roller' && foe.state === 'stunned')
        this.kick(foe, hero.x < foe.x ? 1 : -1)
      else if (foe.kind === 'spring-hare' && foe.state === 'stunned') continue
      else if (foe.kind === 'gasket-golem' && foe.state === 'stunned') continue
      else if (foe.kind === 'glass-gull' && this.tokens > 0 && !foe.carry) {
        if (this.immune) continue
        foe.carry = Math.min(5, this.tokens)
        this.tokens -= foe.carry
        foe.state = 'walk'
        foe.timer = 200
        this.immune = 50
        this.sound.play('warn')
      } else if (foe.kind === 'glass-gull' && foe.carry) continue
      else if (foe.state !== 'kicked' || foe.timer < 400)
        this.hurt(foe.x < hero.x ? 1 : -1)
    }
  }

  ventActive(vent: Vent): number {
    return this.ventActiveAt(vent, this.tick)
  }

  ventActiveAt(vent: Vent, tick: number): number {
    const phase = (tick + vent.offset) % 180
    if (phase >= 120) return 2
    if (phase >= 100) return 1
    return 0
  }

  private updateVents() {
    const hero = this.hero
    for (const vent of this.vents) {
      if (this.ventActive(vent) !== 2) continue
      if (Math.abs(hero.x - vent.x) > HALF + 7) continue
      if (hero.y + TALL < vent.y - 60) continue
      this.hurt(hero.x < vent.x ? -1 : 1)
    }
    for (const wave of this.waves) {
      wave.x += wave.dir * 2.7
      if (Math.abs(wave.x - hero.x) < HALF + 10 && hero.y + TALL > wave.y - 22)
        this.hurt(wave.dir)
    }
    const left = (this.stage.gate ?? 0) * TILE
    const right = this.stage.cols * TILE
    this.waves = this.waves.filter((w) => w.x > left && w.x < right)
  }

  private updateCheckpoints() {
    for (const flag of this.checkpoints) {
      if (flag.reached || this.hero.x < flag.x - 8) continue
      flag.reached = true
      this.checkpoint = { x: flag.x, y: flag.y - TALL }
      this.score += 100
      this.sound.play('extra')
    }
  }

  private updateBoss(prevBottom: number) {
    const boss = this.boss!
    const hero = this.hero
    boss.timer--
    const left = ((this.stage.gate ?? 0) + 3) * TILE
    const right = (this.stage.cols - 2) * TILE
    switch (boss.state) {
      case 'wait':
        return
      case 'walk': {
        boss.dir = hero.x < boss.x ? -1 : 1
        const step =
          boss.kind === 'gale' || boss.kind === 'spigot' || boss.kind === 'dive'
            ? Math.max(-boss.speed, Math.min(boss.speed, boss.home - boss.x))
            : boss.dir * boss.speed
        boss.x = Math.max(left, Math.min(right, boss.x + step))
        if (boss.timer <= 0) {
          boss.state = 'tell'
          boss.timer = boss.kind === 'chime' ? 80 : 60
          if (boss.kind === 'burrow')
            boss.x = Math.max(left, Math.min(right, hero.x))
          if (boss.kind === 'spigot') {
            boss.dir = this.rng() < 0.5 ? -1 : 1
            boss.timer = 70
          }
        }
        break
      }
      case 'tell':
        if (boss.kind === 'chime' && boss.timer % 20 === 0 && boss.timer > 0)
          this.sound.play('blip')
        if (boss.kind === 'spigot' && boss.timer % 14 === 0)
          this.sound.play('warn')
        if (boss.timer <= 0) this.bossAttack(boss)
        break
      case 'burst':
        if (boss.kind === 'dive') {
          const lo = left + 24
          const hi = right - 30
          boss.x = Math.max(lo, Math.min(hi, boss.x + boss.vx))
          if (boss.x <= lo || boss.x >= hi) {
            boss.state = 'recover'
            boss.timer = 130
            this.sound.play('boom')
          }
        } else if (boss.kind === 'slam') {
          boss.x = Math.max(left, Math.min(right, boss.x + boss.vx))
          boss.vy += GRAVITY
          boss.y += boss.vy
          if (boss.y >= boss.floor) {
            boss.y = boss.floor
            boss.vy = 0
            this.waves.push(
              { x: boss.x - 28, y: boss.y, dir: -1 },
              { x: boss.x + 28, y: boss.y, dir: 1 },
            )
            this.sound.play('boom')
            boss.state = 'recover'
            boss.timer = 130
          }
        } else if (boss.timer <= 0) {
          boss.state = 'recover'
          boss.timer = 120
          if (boss.kind === 'spigot')
            this.waves.push(
              { x: boss.x - 26, y: boss.y, dir: -1 },
              { x: boss.x + 26, y: boss.y, dir: 1 },
            )
          if (boss.kind === 'anchor' || boss.kind === 'chime')
            this.waves.push({
              x: boss.x + boss.dir * 40,
              y: boss.y,
              dir: boss.dir,
            })
        }
        break
      case 'recover':
        if (boss.timer <= 0) {
          boss.state = 'walk'
          boss.timer = 100 + Math.floor(this.rng() * 60)
        }
        break
      case 'hurt':
        if (boss.timer <= 0) {
          boss.state = boss.hp > 0 ? 'walk' : 'defeat'
          boss.timer = boss.hp > 0 ? 80 : 170
        }
        return
      case 'defeat':
        if (boss.timer <= 0) this.stageClear()
        return
    }
    if (boss.state === 'burst' && boss.kind === 'anchor') {
      const reachA = boss.x
      const reachB = boss.x + boss.dir * 96
      const inReach =
        hero.x + HALF > Math.min(reachA, reachB) &&
        hero.x - HALF < Math.max(reachA, reachB) &&
        hero.y + TALL > boss.y - 56 &&
        hero.y < boss.y - 8
      if (inReach) this.hurt(boss.dir)
    }
    if (boss.state === 'burst' && boss.kind === 'chime') {
      const swing = Math.abs(hero.x - boss.x) < 84
      if (swing && hero.y + TALL > boss.y - 30)
        this.hurt(hero.x < boss.x ? -1 : 1)
    }
    if (boss.state === 'burst' && boss.kind === 'spigot') {
      const reach = (hero.x - boss.x) * boss.dir
      if (reach > 4 && reach < JET + HALF && hero.y + TALL > boss.y - 72)
        this.hurt(boss.dir)
    }
    if (boss.state === 'burst' && boss.kind === 'gale')
      this.moveX(hero, HALF, TALL, hero.x < boss.x ? -1.5 : 1.5)
    if (boss.kind === 'burrow' && boss.state === 'tell') return
    const top =
      boss.y - (boss.kind === 'dive' && boss.state === 'burst' ? 34 : 66)
    const close =
      Math.abs(boss.x - hero.x) < HALF + 18 &&
      hero.y + TALL > top &&
      hero.y < boss.y
    if (!close) {
      if (
        boss.kind === 'pressure' &&
        boss.state === 'burst' &&
        Math.hypot(boss.x - hero.x, boss.y - 30 - (hero.y + 14)) < 62
      )
        this.hurt(hero.x < boss.x ? -1 : 1)
      return
    }
    const stomp = hero.vy > 0.5 && prevBottom <= top + 12
    if (stomp && boss.state === 'recover') {
      hero.vy = -7.2
      this.hitBoss()
    } else if (stomp) {
      hero.vy = -6
      hero.vx = hero.x < boss.x ? -3 : 3
    } else if (boss.state !== 'recover') this.hurt(hero.x < boss.x ? -1 : 1)
  }

  private bossAttack(boss: Boss) {
    boss.state = 'burst'
    if (boss.kind === 'pressure') {
      boss.timer = 36
      this.waves.push(
        { x: boss.x - 24, y: boss.y, dir: -1 },
        { x: boss.x + 24, y: boss.y, dir: 1 },
      )
      this.sound.play('boom')
    } else if (boss.kind === 'anchor') {
      boss.timer = 40
      boss.dir = this.hero.x < boss.x ? -1 : 1
      this.sound.play('shoot')
    } else if (boss.kind === 'chime') {
      boss.timer = 36
      boss.dir = this.hero.x < boss.x ? -1 : 1
      this.sound.play('boom')
    } else if (boss.kind === 'spigot') {
      boss.timer = 50
      this.sound.play('boom')
    } else if (boss.kind === 'burrow') {
      boss.timer = 24
      this.waves.push(
        { x: boss.x - 24, y: boss.y, dir: -1 },
        { x: boss.x + 24, y: boss.y, dir: 1 },
      )
      this.sound.play('boom')
    } else if (boss.kind === 'dive') {
      boss.timer = 999
      boss.dir = this.hero.x < boss.x ? -1 : 1
      boss.vx = boss.dir * 4.4
      this.sound.play('shoot')
    } else if (boss.kind === 'gale') {
      boss.timer = 90
      boss.dir = this.hero.x < boss.x ? -1 : 1
      this.waves.push({ x: boss.x + boss.dir * 30, y: boss.y, dir: boss.dir })
      this.sound.play('warn')
    } else {
      boss.vy = -9.6
      boss.vx = Math.max(-3.4, Math.min(3.4, (this.hero.x - boss.x) / 44))
      boss.dir = boss.vx < 0 ? -1 : 1
      this.sound.play('blip')
    }
  }

  private hitBoss() {
    const boss = this.boss!
    boss.hp--
    boss.state = 'hurt'
    boss.timer = 50
    boss.speed *= 1.25
    this.score += 1000
    this.sound.play('boom')
  }

  private hurt(dir: number) {
    if (this.immune || this.shielded || this.mode !== 'play') return
    if (this.power) {
      this.power = null
      this.carrying = false
    } else this.hearts--
    this.immune = 90
    this.hero.vx = dir * 3.2
    this.hero.vy = -4.4
    this.ground = false
    this.riding = null
    this.sound.play('warn')
    if (this.hearts <= 0) this.die()
  }

  private die() {
    this.specialTimer = 0
    this.power = null
    this.carrying = false
    this.sound.play('die')
    this.setMode('dying', 80)
  }

  private afterDeath() {
    if (this.endless) {
      this.rememberEndless()
      this.lives = 0
      this.setMode('over', 220)
      return
    }
    if (!this.autopilot) {
      this.lives--
      this.deaths++
    }
    if (this.lives <= 0) {
      if (!this.customLevel)
        this.remember({ lives: START_LIVES, score: 0, tokens: 0 })
      this.setMode('over', 220)
      return
    }
    const flags = this.checkpoints.map((f) => f.reached)
    const stageCheckpoint = this.checkpoint
    if (this.customLevel) this.loadDef(this.customLevel)
    else this.loadStage(this.stageIndex)
    this.checkpoints.forEach((f, i) => {
      f.reached = flags[i] ?? false
    })
    this.checkpoint = stageCheckpoint
    this.placeHero()
    this.setMode('play')
  }

  private stageClear() {
    if (this.mode !== 'play') return
    this.cleared.push(this.stage.code)
    this.score += 1000 + this.hearts * 200
    this.sound.play('level')
    this.setMode('clear', this.autopilot ? 30 : 170)
  }

  /** Demo and test pilot: predicts each jump against the tiles and the moving platforms. */
  private pilotInput(): InputFrame {
    const input = emptyInput()
    if (this.mode !== 'play') return input
    const boss = this.boss
    if (boss && this.locked && boss.state !== 'defeat')
      return this.pilotBoss(input)
    if (this.runnerOn) return this.pilotRunner(input)
    const hero = this.hero
    const feet = hero.y + TALL
    if (!this.ground) {
      input.held.a = this.pilotHold > 0
      if (this.pilotHold) this.pilotHold--
      input.held.right = this.pilotRight
      return input
    }
    if (this.pilotSeek !== null) {
      if (hero.x > this.pilotSeek) {
        input.held.left = true
        return input
      }
      this.pilotSeek = null
    }
    let go = true
    let turn = false
    let jump: { hold: number; right: boolean } | null = null
    const footRow = Math.floor((feet + 1) / TILE)
    const aheadCol = Math.floor((hero.x + HALF + 4) / TILE)
    const bodyRows = [
      Math.floor((hero.y + 2) / TILE),
      Math.floor((feet - 2) / TILE),
    ]
    let wall = 0
    for (let row = bodyRows[0]!; row <= bodyRows[1]!; row++) {
      const s = this.solidAt(aheadCol, row)
      if (isWall(s)) wall = s
    }
    // Only her head is blocked: duck and crawl under it.
    let low = false
    for (
      let row = Math.floor((hero.y + DUCK + 2) / TILE);
      row <= bodyRows[1]!;
      row++
    )
      if (isWall(this.solidAt(aheadCol, row))) low = true
    if ((wall && !low) || (this.ducking && !this.headroom())) {
      input.held.down = true
      input.held.right = true
      return input
    }
    const gate = this.gateAhead()
    // The gate's own switch: the nearest valve still shut.
    const valve = this.valves
      .filter((v) => !v.open)
      .sort((a, b) => Math.abs(a.x - hero.x) - Math.abs(b.x - hero.x))[0]
    if (gate !== null && valve && valve.x < hero.x + 40) {
      const dx = valve.x - hero.x
      if (dx < 6) {
        input.held.left = true
        go = false
      } else if (dx < 40) {
        go = false
        // Face the switch first: a step back to it leaves her facing away.
        if (this.facing < 0) turn = true
        else if (!this.cooldown) input.pressed.x = true
      }
    } else if (wall === SOLID_CRATE) {
      go = false
      if (!this.cooldown) input.pressed.x = true
    } else if (wall && this.carrying && !this.cooldown) {
      input.pressed.x = true
    } else if (wall) {
      jump = this.pickJump(
        (land) => land.feet < feet - 4 || land.x > hero.x + 24,
      )
      if (!jump) {
        const spring = this.springs.find(
          (s) => s.x < hero.x && hero.x - s.x < TILE * 9,
        )
        if (spring) {
          this.pilotSeek = spring.x - TILE * 2
          input.held.left = true
          return input
        } else jump = { hold: 16, right: true }
      }
    }
    const edge = !this.supportedAt(hero.x + HALF + 6, feet, footRow)
    const springNear = this.springs.some(
      (s) =>
        s.x > hero.x - 4 && s.x - hero.x < TILE * 3 && Math.abs(s.y - feet) < 6,
    )
    if (edge && !jump && go && !springNear) {
      jump = this.pickJump(
        (land) => land.x > hero.x + 12 || land.feet < feet - 12,
      )
      if (!jump) go = false
    }
    // A glider at head height: duck and let it pass (crawling, never off an edge).
    const glider = this.foes.find(
      (f) =>
        f.glide &&
        !f.fade &&
        f.state !== 'gone' &&
        f.x - hero.x > -24 &&
        f.x - hero.x < 100 &&
        Math.abs(f.y - (feet - 16)) < 14,
    )
    if (glider && !jump) {
      input.held.down = true
      // Ducked, a walker ahead gets the wrench instead of a crawl into it.
      const walker = this.foes.find(
        (f) =>
          !f.glide &&
          !f.fade &&
          f.state !== 'gone' &&
          f.x - hero.x > -8 &&
          f.x - hero.x < 64 &&
          Math.abs(f.y - feet) < 20,
      )
      if (walker && !this.cooldown) input.pressed.x = true
      input.held.right = go && !edge && !walker
      return input
    }
    for (const foe of this.foes) {
      if (foe.state === 'gone' || foe.fade) continue
      if (foe.kind === 'minnow') continue
      if (foe.kind === 'moss-lantern' && foe.state === 'flat') continue
      const dx = foe.x - hero.x
      if (
        foe.kind === 'glass-gull' ||
        foe.kind === 'paper-kite' ||
        foe.kind === 'siphon-sprite'
      ) {
        if (
          Math.abs(dx) < 64 &&
          Math.abs(foe.y - 9 - (hero.y + 13)) < 46 &&
          !this.cooldown
        ) {
          if (dx * this.facing < 0) input.held.left = dx < 0
          input.pressed.x = true
        }
        continue
      }
      if (foe.kind === 'rivet-roller') {
        // Rollers come fast: swing early, and jump one kicked back at her.
        const coming =
          foe.state === 'kicked' && Math.sign(foe.vx) === Math.sign(-dx)
        if (dx < (coming ? -56 : -10) || dx > 110) continue
        if (Math.abs(foe.y - feet) > 34) continue
        if (foe.state === 'walk' && !this.cooldown && dx < 76)
          input.pressed.x = true
        else if (
          !jump &&
          ((coming && Math.abs(dx) < 70) ||
            (foe.state === 'stunned' && dx < 34))
        )
          jump = this.pickJump((land) => land.x > foe.x + 16)
        continue
      }
      if (dx < -10 || dx > 70 || Math.abs(foe.y - feet) > 34) continue
      if (
        foe.kind === 'gasket-golem' ||
        foe.kind === 'tea-kettle-knight' ||
        foe.kind === 'chimney-spirit' ||
        foe.kind === 'puddle-mimic'
      ) {
        if (!this.cooldown && dx < 54) input.pressed.x = true
        continue
      }
      if (foe.state === 'stunned' || foe.state === 'kicked') {
        if (dx < 34 && foe.state === 'stunned' && !jump)
          jump = this.pickJump((land) => land.x > foe.x + 12)
      } else if (!this.cooldown && dx < 54) input.pressed.x = true
    }
    const aheadBridge = [1, 2, 3].some(
      (k) =>
        this.solid[
          footRow * this.stage.cols + Math.floor(hero.x / TILE) + k
        ] === SOLID_BRIDGE,
    )
    const onBridge =
      this.solid[footRow * this.stage.cols + Math.floor(hero.x / TILE)] ===
      SOLID_BRIDGE
    if (aheadBridge && !onBridge && this.bridgeLeft() < 120) {
      go = false
      jump = null
    }
    for (const cargo of this.cargo) {
      const dx = cargo.x - hero.x
      const phase = this.cargoPhase(cargo)
      const coming =
        (cargo.state === 'fall' && cargo.y + TILE < feet) ||
        (cargo.state === 'wait' && phase > 200)
      if (!coming || dx < -24 || dx > 64) continue
      if (Math.abs(dx) < 24) {
        input.held.left = true
        input.held.right = false
        return input
      }
      go = false
      jump = null
    }
    for (const vent of this.vents) {
      const dx = vent.x - hero.x
      if (dx < -HALF - 10 || dx > 46 || Math.abs(vent.y - feet) > 20) continue
      const phase = (this.tick + vent.offset) % 180
      if (phase >= 64 && dx > 6) {
        go = false
        jump = null
      }
    }
    if (hero.x > this.pilotBest + 2) {
      this.pilotBest = hero.x
      this.pilotStuck = 0
    } else if (go && ++this.pilotStuck > 240) {
      jump = { hold: 16, right: true }
      this.pilotStuck = 0
    }
    if (jump) {
      input.pressed.a = true
      input.held.a = true
      // The press frame already holds A: hold for the rest of the simulated frames.
      this.pilotHold = Math.max(0, jump.hold - 1)
      this.pilotRight = jump.right
      input.held.right = jump.right
      return input
    }
    input.held.right = (go || turn) && !input.held.left
    return input
  }

  /** Extras the pilot reaches for: the gear, powers and hearts still waiting ahead. */
  private pilotTarget(): Pickup | null {
    const hero = this.hero
    const ahead = (p: { x: number; y: number }) =>
      p.x > hero.x + 4 && p.x < hero.x + 220
    const gear = this.gear
    if (gear && !gear.taken && ahead(gear))
      return { x: gear.x, y: gear.y, kind: 'heart', taken: false }
    return this.pickups.find((p) => !p.taken && ahead(p)) ?? null
  }

  /** Runner pilot: she runs on her own, so the pilot only jumps, ducks and swings. */
  private pilotRunner(input: InputFrame): InputFrame {
    const hero = this.hero
    const feet = hero.y + TALL
    const glider = this.foes.find(
      (f) =>
        f.glide &&
        !f.fade &&
        f.state !== 'gone' &&
        f.x - hero.x > -24 &&
        f.x - hero.x < 120,
    )
    if (!this.ground) {
      input.held.a = this.pilotHold > 0
      if (this.pilotHold) this.pilotHold--
      if (glider && hero.vy > 0 && glider.x - hero.x < 90) input.held.b = true
      // A valve passing under a hop still gets its swing.
      const lever = this.valves.find(
        (v) => !v.open && v.x > hero.x && v.x - hero.x < 40,
      )
      if (lever && !this.cooldown && !this.carrying) input.pressed.x = true
      return input
    }
    const ahead = (dx: number, row: number) =>
      this.solidAt(Math.floor((hero.x + HALF + dx) / TILE), row)
    const headRow = Math.floor((feet - TALL + 1) / TILE)
    const footRow = Math.floor((feet - 2) / TILE)
    let wall = 0
    let beam = false
    for (const dx of [2, 10, 18, 26]) {
      const head = ahead(dx, headRow)
      const foot = ahead(dx, footRow)
      if (isWall(foot)) {
        if (!wall && dx <= 18) wall = foot
      } else if (isWall(head) && !wall) beam = true
    }
    let jump: number | null = null
    const choose = (good: (land: { x: number; feet: number }) => boolean) => {
      for (const hold of [16, 12, 8, 4, 1]) {
        const land = this.simulateJump(hold, true)
        if (
          land &&
          good(land) &&
          !land.scorched &&
          !this.ventAt(land.x, land.feet)
        )
          return hold
      }
      return null
    }
    // Extras first: a jump whose arc touches the target, or a climb toward it.
    const target = this.pilotTarget()
    // A pickup on the running line comes to her; only jump for raised ones.
    if (target && target.y < feet - 20 && !beam && !this.ducking) {
      for (const hold of [16, 14, 12, 10, 8, 6, 4, 2]) {
        const land = this.simulateJump(hold, true, target)
        if (land?.touched && !this.ventAt(land.x, land.feet)) {
          jump = hold
          break
        }
      }
      if (jump === null && target.y < feet - 40 && target.x - hero.x < 140)
        jump = choose((land) => land.feet < feet - 8 && land.x < target.x + 24)
    }
    // Swing at what the wrench can clear.
    const valve = this.valves.find(
      (v) => !v.open && v.x > hero.x - 4 && v.x - hero.x < 96,
    )
    // A carried crate goes first: X throws it, and a valve needs the wrench.
    if (this.carrying && !this.cooldown) input.pressed.x = true
    else if (valve && valve.x - hero.x < 40 && !this.cooldown)
      input.pressed.x = true
    // With Pocket Lift a swing lifts the crate, and a carried crate would cost
    // the swing a valve needs: near a valve, hop crates instead.
    const liftNearValve =
      this.power === 'pocket-lift' &&
      this.valves.some((v) => !v.open && v.x > hero.x && v.x - hero.x < 240)
    if (wall === SOLID_CRATE && !this.cooldown && !valve && !liftNearValve)
      input.pressed.x = true
    for (const foe of this.foes) {
      if (foe.state === 'gone' || foe.fade || foe.kind === 'minnow') continue
      if (foe.kind === 'moss-lantern' && foe.state === 'flat') continue
      const dx = foe.x - hero.x
      if (dx < -6 || dx > 60) continue
      if (foe.glide) continue
      if (Math.abs(foe.y - feet) > 30) continue
      if (!this.cooldown && dx < 52 && !valve) input.pressed.x = true
    }
    if (jump === null && wall === SOLID_CRATE && liftNearValve)
      // The lowest hop that clears it, so the wrench still reaches the lever.
      for (const hold of [1, 3, 5, 8]) {
        const land = this.simulateJump(hold, true)
        if (land && land.x > hero.x + 24) {
          jump = hold
          break
        }
      }
    if (jump === null && wall && wall !== SOLID_CRATE && wall !== SOLID_GATE)
      jump = choose((land) => land.feet < feet - 4 || land.x > hero.x + 24)
    const below = Math.floor((feet + 1) / TILE)
    const next = Math.floor((hero.x + HALF + 6) / TILE)
    // A crystal bridge may fade under her mid-crossing, so jump it like a gap.
    const bridge = this.solid[below * this.stage.cols + next] === SOLID_BRIDGE
    const edge = bridge || !this.supportedAt(hero.x + HALF + 6, feet, below)
    if (jump === null && edge)
      jump =
        choose((land) => land.x > hero.x + 12 || land.feet < feet - 12) ?? 16
    for (const vent of this.vents) {
      const dx = vent.x - hero.x
      if (jump !== null || dx < 4 || dx > 48 || Math.abs(vent.y - feet) > 20)
        continue
      const arrive = Math.floor((dx - HALF - 7) / this.runSpeed)
      const leave = Math.ceil((dx + HALF + 7) / this.runSpeed)
      let hot = false
      for (let k = Math.max(0, arrive); k <= leave; k++)
        if (this.ventActiveAt(vent, this.tick + k) === 2) hot = true
      if (hot) jump = choose((land) => land.x > vent.x + HALF + 6)
    }
    if (glider && Math.abs(glider.y - (feet - 16)) < 14) {
      const reach = glider.x - hero.x
      if (reach < 100 || (jump !== null && !edge)) jump = null
      if (reach < 100) beam = true
    }
    if (jump !== null && !beam) {
      input.pressed.a = true
      input.held.a = true
      this.pilotHold = jump
      return input
    }
    input.held.b = beam
    return input
  }

  private gateAhead(): number | null {
    const from = Math.floor(this.hero.x / TILE)
    for (let col = from; col < from + 10; col++)
      for (let row = 0; row < this.stage.rows; row++)
        if (this.solidAt(col, row) === SOLID_GATE) return col
    return null
  }

  private supportedAt(x: number, feet: number, footRow: number): boolean {
    const col = Math.floor(x / TILE)
    for (let row = footRow; row <= footRow + 2; row++) {
      const s = this.solidAt(col, row)
      if (isWall(s) || s === SOLID_LEDGE || s === SOLID_BRIDGE) return true
    }
    return this.platforms.some(
      (p) => x >= p.x && x <= p.x + p.w && Math.abs(p.y - feet) < 6,
    )
  }

  platformAt(p: Platform, t: number): { x: number; y: number } {
    if (p.kind === 'lantern' || p.kind === 'cargo') return { x: p.x, y: p.y }
    if (p.kind === 'raft')
      return {
        x: p.baseX,
        y: p.baseY + p.sign * 5 * Math.sin((t * Math.PI * 2) / 150),
      }
    if (p.kind === 'piston')
      return {
        x: p.baseX,
        y: p.baseY + 64 * (0.5 - 0.5 * Math.cos((t * Math.PI * 2) / 220)),
      }
    return {
      x: p.baseX + p.sign * 80 * Math.sin((t * Math.PI * 2) / 280),
      y: p.baseY,
    }
  }

  /** The first jump whose simulated landing is solid and passes `good`. */
  private pickJump(
    good: (land: { x: number; feet: number }) => boolean,
  ): { hold: number; right: boolean } | null {
    for (const option of [
      { hold: 16, right: true },
      { hold: 8, right: true },
      { hold: 3, right: true },
      { hold: 16, right: false },
    ]) {
      const land = this.simulateJump(option.hold, option.right)
      if (land && good(land) && !this.ventAt(land.x, land.feet)) return option
    }
    return null
  }

  private ventAt(x: number, feet: number): boolean {
    return this.vents.some(
      (v) => Math.abs(v.x - x) < HALF + 9 && Math.abs(v.y - feet) < 4,
    )
  }

  private simulateJump(hold: number, right: boolean, target?: Pickup | null) {
    try {
      return this.predictJump(hold, right, target)
    } finally {
      this.clock = null
    }
  }

  private predictJump(hold: number, right: boolean, target?: Pickup | null) {
    const body: Body = { ...this.hero }
    let touched = false
    let scorched = false
    let vx = right ? body.vx : body.vx * 0.5
    const spring = this.power === 'springstep'
    let vy = spring ? SPRING_JUMP : JUMP
    for (let k = 1; k <= 120; k++) {
      this.clock = this.tick + k
      vx = this.runnerOn
        ? this.runSpeed
        : right
          ? Math.min(RUN, vx + 0.44)
          : vx * 0.77
      if (this.moveX(body, HALF, TALL, vx)) vx = 0
      const gust = this.windAt(body.x, this.tick + k)
      if (gust) this.moveX(body, HALF, TALL, gust)
      if (k > hold && vy < -3.4) vy = -3.4
      const floating = spring && k <= hold && vy > 0
      vy = Math.min(floating ? 4 : 9, vy + GRAVITY * (floating ? FLOAT : 1))
      const prevBottom = body.y + TALL
      const hit = this.moveY(body, HALF, TALL, vy)
      for (const vent of this.vents)
        if (
          Math.abs(body.x - vent.x) < HALF + 7 &&
          body.y + TALL > vent.y - 62 &&
          this.ventActiveAt(vent, this.tick + k) === 2
        )
          scorched = true
      if (
        target &&
        Math.abs(target.x - body.x) < 15 &&
        target.y > body.y - 10 &&
        target.y < body.y + TALL + 8
      )
        touched = true
      if (hit === 'land')
        return { x: body.x, feet: body.y + TALL, touched, scorched }
      if (hit === 'bump') vy = 0.5
      if (vy >= 0)
        for (const p of this.platforms) {
          const at = this.platformAt(p, this.tick + k)
          const before = this.platformAt(p, this.tick + k - 1)
          if (prevBottom > before.y + 0.6) continue
          if (
            body.y + TALL < at.y ||
            body.x + HALF < at.x + 2 ||
            body.x - HALF > at.x + p.w - 2
          )
            continue
          return { x: body.x, feet: at.y, touched, scorched }
        }
      if (body.y > this.stage.rows * TILE) return null
    }
    return null
  }

  private pilotBoss(input: InputFrame): InputFrame {
    const hero = this.hero
    const boss = this.boss!
    const dx = boss.x - hero.x
    const wave = this.waves.find(
      (w) => Math.abs(w.x - hero.x) < 56 && Math.sign(hero.x - w.x) === w.dir,
    )
    const keep =
      boss.kind === 'anchor' ? 130 : boss.kind === 'chime' ? 116 : 100
    if (
      boss.kind === 'spigot' &&
      (boss.state === 'tell' || boss.state === 'burst')
    ) {
      const reach = (hero.x - boss.x) * boss.dir
      if (reach > -6 && reach < JET + 24) {
        if (boss.dir > 0) input.held.right = true
        else input.held.left = true
      }
      if (wave && this.ground) {
        input.pressed.a = true
        input.held.a = true
      }
      if (!this.ground && hero.vy < 0) input.held.a = true
      return input
    }
    if (boss.kind === 'dive') {
      const coming =
        boss.state === 'burst' && Math.sign(hero.x - boss.x) === boss.dir
      if (coming && Math.abs(dx) < 84 && this.ground) {
        input.pressed.a = true
        input.held.a = true
      } else if (boss.state === 'recover') {
        if (dx > 4) input.held.right = true
        else if (dx < -4) input.held.left = true
        if (Math.abs(dx) < 52 && this.ground) input.pressed.a = true
        input.held.a = true
      } else if (boss.state !== 'burst' && Math.abs(dx) < keep) {
        if (dx > 0) input.held.left = true
        else input.held.right = true
      }
      if (!this.ground && hero.vy < 0) input.held.a = true
      return input
    }
    const flee = () => {
      const away = dx > 0 ? -1 : 1
      const row = Math.floor((hero.y + TALL - 4) / TILE)
      const cornered = [1, 2, 3, 4].some((k) =>
        isWall(
          this.solidAt(Math.floor((hero.x + away * k * TILE) / TILE), row),
        ),
      )
      // Pinned against the arena wall: hop over the boss instead.
      if (cornered) {
        if (boss.state !== 'walk' || Math.abs(dx) < 56) return
        if (away < 0) input.held.right = true
        else input.held.left = true
        if (this.ground) input.pressed.a = true
        input.held.a = true
      } else if (away < 0) input.held.left = true
      else input.held.right = true
    }
    if (boss.state === 'recover' || boss.state === 'hurt') {
      if (boss.state === 'recover') {
        if (dx > 4) input.held.right = true
        else if (dx < -4) input.held.left = true
        if (Math.abs(dx) < 52 && this.ground) input.pressed.a = true
        input.held.a = true
      } else if (Math.abs(dx) < keep) flee()
    } else if (
      boss.state === 'tell' ||
      boss.state === 'burst' ||
      Math.abs(dx) < keep
    )
      flee()
    if (wave && this.ground) {
      input.pressed.a = true
      input.held.a = true
    }
    if (!this.ground && hero.vy < 0) input.held.a = true
    return input
  }

  render(g: CanvasRenderingContext2D) {
    switch (this.mode) {
      case 'title':
        return this.renderTitle(g)
      case 'files':
        return this.renderFiles(g)
      case 'map':
        return this.renderMap(g)
      case 'select':
        return this.renderSelect(g)
      case 'victory':
        return this.renderVictory(g)
      case 'story':
        return this.renderStory(g)
      default:
        this.renderStage(g)
        if (this.mode === 'intro') this.renderIntro(g)
        if (this.mode === 'clear')
          this.renderBanner(g, 'STAGE CLEAR', `+${1000 + this.hearts * 200}`)
        if (this.mode === 'over' && this.endless)
          this.renderBanner(
            g,
            this.distance >= this.endlessBest ? 'NEW BEST!' : 'RUN OVER',
            `${this.distance} m · zone ${this.zone + 1} · best ${this.endlessBest} m`,
          )
        else if (this.mode === 'over')
          this.renderBanner(
            g,
            'GAME OVER',
            this.customLevel
              ? 'Try this course again from the Maker'
              : `Your file keeps ${this.stage.code} on the world map`,
          )
    }
  }

  private plate(g: CanvasRenderingContext2D, code: string, pan: number) {
    const back = g.createLinearGradient(0, 0, 0, H)
    back.addColorStop(0, '#76d8d6')
    back.addColorStop(0.55, '#d6f7dc')
    back.addColorStop(1, '#ffe5c8')
    g.fillStyle = back
    g.fillRect(0, 0, W, H)
    const path = plumberStageArt(code)
    const plate = path ? stagePlate(path) : null
    if (!plate) return
    const cover =
      Math.max(W / plate.naturalWidth, H / plate.naturalHeight) * 1.18
    const pw = plate.naturalWidth * cover
    const ph = plate.naturalHeight * cover
    g.drawImage(plate, -pan * (pw - W), H - ph, pw, ph)
  }

  private text(
    g: CanvasRenderingContext2D,
    words: string,
    x: number,
    y: number,
    size: number,
    color = '#fff4dc',
    align: CanvasTextAlign = 'center',
  ) {
    g.font = `900 ${size}px "Lilita One", system-ui, sans-serif`
    g.textAlign = align
    g.lineJoin = 'round'
    g.lineWidth = Math.max(3, size / 5)
    g.strokeStyle = '#1b3440'
    g.strokeText(words, x, y)
    g.fillStyle = color
    g.fillText(words, x, y)
    g.textAlign = 'left'
  }

  private renderTitle(g: CanvasRenderingContext2D) {
    this.plate(g, '1-1', (Math.sin(this.tick / 400) + 1) / 2)
    g.fillStyle = 'rgba(12, 40, 52, 0.35)'
    g.fillRect(0, 0, W, H)
    this.text(g, 'SAVE THE', W / 2, 70, 26, '#ffd98a')
    this.text(g, 'PLUMBER', W / 2, 112, 46, '#fff4dc')
    this.text(
      g,
      `Worlds 1–${LAST_WORLD} · Bluebell Pipeworks to ${PLUMBER_WORLDS[LAST_WORLD - 1]!.name}`,
      W / 2,
      140,
      12,
      '#bdf0e6',
    )
    const items = this.menuItems
    items.forEach((item, i) => {
      const label =
        item === 'endless'
          ? `ENDLESS${this.endlessBest ? `  BEST ${this.endlessBest} M` : ''}`
          : this.file.slots.some(Boolean)
            ? 'PLAY  ·  CHOOSE A FILE'
            : 'NEW GAME'
      const y = 172 + i * 24
      const on = i === this.menu
      if (on) {
        g.fillStyle = 'rgba(255, 217, 138, 0.25)'
        g.fillRect(W / 2 - 112, y - 18, 224, 24)
      }
      this.text(
        g,
        `${on ? '▶ ' : ''}${label}`,
        W / 2,
        y,
        16,
        on ? '#ffd98a' : '#fff4dc',
      )
    })
    this.text(
      g,
      'A  JUMP     B  RUN     ↓  DUCK     X  WRENCH     Y  SPECIAL',
      W / 2,
      256,
      10,
      '#d6f2ee',
    )
  }

  private renderFiles(g: CanvasRenderingContext2D) {
    this.plate(g, '1-1', 0.35)
    g.fillStyle = 'rgba(12, 40, 52, 0.62)'
    g.fillRect(0, 0, W, H)
    this.text(g, 'CHOOSE A FILE', W / 2, 40, 24, '#ffd98a')
    for (let i = 0; i < SLOT_COUNT; i++) {
      const slot = this.file.slots[i] ?? null
      const y = 66 + i * 58
      const on = i === this.slotCursor
      g.fillStyle = on
        ? 'rgba(255, 217, 138, 0.28)'
        : 'rgba(255, 244, 220, 0.1)'
      g.fillRect(48, y, W - 96, 50)
      if (on) {
        g.strokeStyle = '#ffd98a'
        g.lineWidth = 2
        g.strokeRect(48, y, W - 96, 50)
      }
      this.text(
        g,
        `FILE ${i + 1}`,
        62,
        y + 20,
        14,
        on ? '#ffd98a' : '#fff4dc',
        'left',
      )
      if (!slot) {
        this.text(g, 'NEW ADVENTURE', W / 2 + 30, y + 31, 14, '#d6f2ee')
        continue
      }
      const member = rosterFor(rosterHeroine(slot.heroine))
      const node = mapNode(slot.node)
      const progress = {
        done: slot.done ?? [],
        secrets: slot.secrets,
        gears: slot.gears,
      }
      const minutes = Math.floor((slot.time ?? 0) / 60)
      const where = node?.stage ?? `World ${node?.world ?? 1}`
      this.text(g, member.name.toUpperCase(), 62, y + 40, 12, '#d6f2ee', 'left')
      this.text(
        g,
        `${completionPercent(progress)}%`,
        W - 64,
        y + 22,
        18,
        '#ffd98a',
        'right',
      )
      this.text(
        g,
        this.eraseArmed && on
          ? 'PRESS Y AGAIN TO ERASE  ·  B KEEPS IT'
          : `${where}  ·  ⚙ ${slot.gears?.length ?? 0}  ·  ×${slot.lives}  ·  ${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`,
        W / 2 + 40,
        y + 40,
        11,
        this.eraseArmed && on ? '#ff9f8a' : '#fff4dc',
      )
    }
    this.text(g, 'A  PLAY     Y  ERASE     B  BACK', W / 2, 256, 10, '#d6f2ee')
  }

  /** Where she stands on the map this tick (mid-walk along a path, or on her node). */
  private mapHeroPoint(): { x: number; y: number } {
    const here = mapNode(this.mapNodeId)!
    const walk = this.mapWalk
    if (!walk) return { x: here.x, y: here.y }
    const from = mapNode(walk.from)!
    const to = mapNode(walk.to)!
    const t = walk.t / MAP_WALK
    const heading = warpHeading(walk.path, walk.from)
    if (!heading)
      return {
        x: from.x + (to.x - from.x) * t,
        y: from.y + (to.y - from.y) * t,
      }
    // A warp walks off this map's edge; the next map is drawn on arrival.
    const edge = MAP_EDGE[heading](from)
    return {
      x: from.x + (edge.x - from.x) * t,
      y: from.y + (edge.y - from.y) * t,
    }
  }

  private renderMap(g: CanvasRenderingContext2D) {
    const here = mapNode(this.mapNodeId)!
    const world = here.world
    const map = worldMap(world)
    const def = PLUMBER_WORLDS[world - 1]
    const progress = this.progress
    const open = openPaths(progress)
    const pal = def?.palette ?? {
      skyTop: '#2b3a7a',
      skyBottom: '#f2b8e6',
      far: '#8fc7f2',
      ground: '#c9e9ff',
      accent: '#5fb7ff',
      ink: '#1b3440',
    }
    // The painted plate (conductor art/GEN2-ROUND-1, Krea 2) over a code-drawn land.
    const sky = g.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, pal.skyTop)
    sky.addColorStop(1, pal.skyBottom)
    g.fillStyle = sky
    g.fillRect(0, 0, W, H)
    // The plate's motion loop when it has shipped and loaded, else the still plate.
    const clip = map.clip ? loopingVideo(map.clip) : null
    const plate = map.plate ? stagePlate(map.plate) : null
    if (clip) g.drawImage(clip, 0, 0, W, H)
    else if (plate) g.drawImage(plate, 0, 0, W, H)
    else {
      g.fillStyle = pal.far
      for (let i = 0; i < 6; i++) {
        g.beginPath()
        g.ellipse(
          40 + i * 90,
          250 - (i % 2) * 18,
          90,
          70 + (i % 3) * 12,
          0,
          0,
          Math.PI * 2,
        )
        g.fill()
      }
    }
    // Paths: open ones dotted in cream (pink for secret exits); new ones drawn in.
    const reveal = new Set(this.mapReveal)
    const grow = this.mapRevealTimer ? 1 - this.mapRevealTimer / MAP_REVEAL : 1
    const ends = (path: MapPath, id: string) => {
      const node = mapNode(id)!
      if (node.world === world) return node
      const other = mapNode(id === path.from ? path.to : path.from)!
      const heading = warpHeading(path, other.id)!
      return MAP_EDGE[heading](other)
    }
    g.lineCap = 'round'
    for (const path of open) {
      const a = mapNode(path.from)!
      const b = mapNode(path.to)!
      if (a.world !== world && b.world !== world) continue
      const p = ends(path, path.from)
      const q = ends(path, path.to)
      const k = reveal.has(path) ? grow : 1
      g.setLineDash([5, 6])
      // The dots march along the trail.
      g.lineDashOffset = -(this.tick % 44) / 4
      g.lineWidth = 6
      g.strokeStyle = 'rgba(27, 52, 64, 0.55)'
      g.beginPath()
      g.moveTo(p.x, p.y)
      g.lineTo(p.x + (q.x - p.x) * k, p.y + (q.y - p.y) * k)
      g.stroke()
      g.lineWidth = 3
      g.strokeStyle = path.unlock?.exit === 'secret' ? '#ff9fd6' : '#fff4dc'
      g.stroke()
      g.setLineDash([])
      g.lineDashOffset = 0
    }
    // The node she stands on pulses when there is a stage to enter.
    if (here.stage && !this.mapWalk) {
      const pulse = (this.tick % 60) / 60
      g.strokeStyle = `rgba(255, 217, 138, ${0.9 - pulse * 0.9})`
      g.lineWidth = 3
      g.beginPath()
      g.arc(here.x, here.y, 14 + pulse * 12, 0, Math.PI * 2)
      g.stroke()
    }
    for (const node of map.nodes) {
      const reachable = nodeReachable(node.id, progress)
      if (node.kind === 'start') {
        if (!reachable) continue
        g.fillStyle = '#fff4dc'
        g.strokeStyle = pal.ink
        g.lineWidth = 2
        g.beginPath()
        g.arc(node.x, node.y, 6, 0, Math.PI * 2)
        g.fill()
        g.stroke()
        continue
      }
      // Secret-only nodes stay hidden until a path reaches them.
      const secretOnly =
        !open.some((p) => p.to === node.id || p.from === node.id) &&
        map.paths.every((p) => p.to !== node.id || p.unlock?.exit === 'secret')
      if (!reachable && secretOnly) continue
      const built = nodeBuilt(node)
      const cleared =
        progress.done.includes(node.id) || !!progress.secrets?.includes(node.id)
      g.globalAlpha = reachable ? 1 : 0.4
      const size = node.kind === 'castle' ? 26 : node.kind === 'level' ? 20 : 18
      g.fillStyle = cleared
        ? '#5fc48a'
        : !built
          ? '#c8c2b4'
          : node.kind === 'castle'
            ? '#9a6bd1'
            : pal.accent
      g.strokeStyle = pal.ink
      g.lineWidth = 3
      g.beginPath()
      if (node.kind === 'level' || node.kind === 'castle')
        g.roundRect(node.x - size / 2, node.y - size / 2, size, size, 6)
      else g.arc(node.x, node.y, size / 2, 0, Math.PI * 2)
      g.fill()
      if (!built) g.setLineDash([3, 3])
      g.stroke()
      g.setLineDash([])
      if (node.kind === 'castle') {
        g.fillStyle = pal.ink
        for (let i = -1; i <= 1; i++)
          g.fillRect(node.x + i * 8 - 2, node.y - size / 2 - 6, 4, 6)
      }
      g.globalAlpha = 1
      if (!reachable) continue
      this.text(
        g,
        cleared ? '✔' : NODE_GLYPH[node.kind](node),
        node.x,
        node.y + 5,
        11,
        '#fff4dc',
      )
      if (node.stage && progress.gears?.includes(node.stage)) {
        g.fillStyle = '#ffd24a'
        g.beginPath()
        g.arc(node.x + size / 2, node.y - size / 2, 4, 0, Math.PI * 2)
        g.fill()
      }
    }
    const at = this.mapHeroPoint()
    // Standing, she breathes and bobs; walking, her run cycle plays.
    const idle = !this.mapWalk
    const bob = idle ? Math.abs(Math.sin(this.tick / 14)) * 2 : 0
    g.fillStyle = 'rgba(12, 24, 32, 0.35)'
    g.beginPath()
    g.ellipse(at.x, at.y - 7, 10 - bob, 3, 0, 0, Math.PI * 2)
    g.fill()
    this.drawHeroSprite(
      g,
      at.x,
      at.y - 8 - bob,
      null,
      1.35 + (idle ? Math.sin(this.tick / 14) * 0.015 : 0),
    )
    // Header: the world; footer: where she stands and how much of the world is done.
    g.fillStyle = 'rgba(12, 40, 52, 0.66)'
    g.fillRect(0, 0, W, 26)
    g.fillRect(0, H - 34, W, 34)
    this.text(
      g,
      `${map.special ? 'SECRET' : `WORLD ${world}`}  ·  ${map.name.toUpperCase()}`,
      10,
      18,
      13,
      '#ffd98a',
      'left',
    )
    this.text(
      g,
      `${completionPercent(progress)}%`,
      W - 10,
      18,
      13,
      '#ffd98a',
      'right',
    )
    const c = worldCompletion(world, progress)
    const soon = !nodeBuilt(here) && here.kind !== 'start'
    this.text(
      g,
      `${here.kind === 'start' ? '' : `${here.id.toUpperCase()}  `}${here.name.toUpperCase()}${soon ? '  ·  COMING SOON' : ''}`,
      10,
      H - 14,
      12,
      soon ? '#d6f2ee' : '#fff4dc',
      'left',
    )
    this.text(
      g,
      `STAGES ${c.stagesDone}/${c.stages}  ·  ⚙ ${c.gearsFound}/${c.gears}${c.secrets ? `  ·  SECRETS ${c.secretsFound}/${c.secrets}` : ''}`,
      W - 10,
      H - 14,
      11,
      '#d6f2ee',
      'right',
    )
    if (this.mapToast)
      this.renderBanner(
        g,
        'COMING SOON',
        `${here.name} is designed and on its way. Walk on!`,
      )
    else if (here.stage && !this.mapWalk) {
      const hop = Math.abs(Math.sin(this.tick / 10)) * 4
      g.fillStyle = '#ffd98a'
      g.strokeStyle = '#1b3440'
      g.lineWidth = 2
      g.beginPath()
      g.moveTo(at.x - 6, at.y - 58 - hop)
      g.lineTo(at.x + 6, at.y - 58 - hop)
      g.lineTo(at.x, at.y - 50 - hop)
      g.closePath()
      g.fill()
      g.stroke()
      if (Math.floor(this.tick / 30) % 2)
        this.text(g, 'A  ENTER', at.x, at.y - 64 - hop, 10, '#ffd98a')
    }
  }

  private renderSelect(g: CanvasRenderingContext2D) {
    this.plate(g, '1-1', 0.2)
    g.fillStyle = 'rgba(12, 40, 52, 0.62)'
    g.fillRect(0, 0, W, H)
    this.text(g, 'CHOOSE YOUR HEROINE', W / 2, 30, 20, '#ffd98a')
    const cw = 66
    const ch = 92
    PLUMBER_ROSTER.forEach((member, i) => {
      const x = 16 + (i % 4) * (cw + 8)
      const y = 46 + Math.floor(i / 4) * (ch + 10)
      const on = i === this.cursor
      g.fillStyle = on ? '#ffd98a' : '#fff4dc'
      g.fillRect(x - 3, y - 3, cw + 6, ch + 6)
      g.fillStyle = '#d6f2ee'
      g.fillRect(x, y, cw, ch)
      const portrait = stagePlate(rosterPortrait(member))
      if (portrait) {
        const s =
          Math.max(cw / portrait.naturalWidth, ch / portrait.naturalHeight) *
          1.25
        const pw = portrait.naturalWidth * s
        g.save()
        g.beginPath()
        g.rect(x, y, cw, ch)
        g.clip()
        g.drawImage(
          portrait,
          x + (cw - pw) / 2,
          y - 4,
          pw,
          portrait.naturalHeight * s,
        )
        g.restore()
      } else if (typeof Path2D !== 'undefined')
        drawHeroine(
          g,
          rosterHeroine(seedForRoster(i, () => 0)),
          x + cw / 2,
          y + ch - 6,
          70,
          {
            stride: 0,
            run: 0,
            airborne: false,
            rising: false,
            facing: 1,
            tick: this.tick,
          },
        )
      g.fillStyle = 'rgba(27, 52, 64, 0.78)'
      g.fillRect(x, y + ch - 16, cw, 16)
      this.text(
        g,
        member.name,
        x + cw / 2,
        y + ch - 4,
        11,
        on ? '#ffd98a' : '#fff4dc',
      )
    })
    const member = PLUMBER_ROSTER[this.cursor]!
    const px = 330
    this.text(g, member.name, px + 70, 70, 24, '#ffd98a')
    this.text(g, member.build, px + 70, 90, 11, '#d6f2ee')
    this.text(g, member.signature, px + 70, 106, 10, '#d6f2ee')
    this.text(g, `Y · ${member.special.name}`, px + 70, 124, 11, '#ffd98a')
    const frame = Math.floor(this.tick / 6) % 6
    const runReady = keyedSheet(member.run, 6) !== null
    const drawn = drawSheetFrame(
      g,
      runReady ? member.run : member.actions,
      6,
      runReady ? frame : actionPoses(member).idle,
      px + 70,
      206,
      80 * member.scale,
    )
    if (!drawn && typeof Path2D !== 'undefined')
      drawHeroine(
        g,
        rosterHeroine(seedForRoster(this.cursor, () => 0)),
        px + 70,
        206,
        66,
        {
          stride: this.tick / 4,
          run: 1,
          airborne: false,
          rising: false,
          facing: 1,
          tick: this.tick,
        },
      )
    this.text(
      g,
      '◀ ▶  CHOOSE    A  START    B  SURPRISE',
      W / 2,
      260,
      10,
      '#fff4dc',
    )
  }

  private renderStory(g: CanvasRenderingContext2D) {
    const panel = STORY[Math.min(this.storyPanel, STORY.length - 1)]!
    const art = stagePlate(PLUMBER_ART.cutscene(panel.art))
    const t = 1 - this.modeTimer / STORY_PANEL
    if (art) {
      const zoom = 1.04 + t * 0.06
      const w = W * zoom
      const h = H * zoom
      const drift = this.storyPanel === 2 ? 1 : 0
      g.drawImage(art, (W - w) * (drift ? 1 - t : t), (H - h) * 0.5, w, h)
    } else {
      g.fillStyle = '#1c2946'
      g.fillRect(0, 0, W, H)
    }
    g.fillStyle = 'rgba(12, 24, 40, 0.68)'
    g.fillRect(0, H - 62, W, 62)
    const name = this.member.name
    panel.lines.forEach((line, i) =>
      this.text(
        g,
        line.replace('{name}', name),
        W / 2,
        H - 40 + i * 18,
        12,
        i ? '#d6f2ee' : '#fff4dc',
      ),
    )
    if (Math.floor(this.tick / 30) % 2)
      this.text(g, 'A ▶   START SKIP', W - 62, 16, 9, '#ffd98a')
  }

  private renderIntro(g: CanvasRenderingContext2D) {
    g.fillStyle = 'rgba(12, 40, 52, 0.72)'
    g.fillRect(0, 86, W, 96)
    this.text(
      g,
      this.endless ? 'ENDLESS RUN' : `WORLD ${this.stage.code}`,
      W / 2,
      118,
      18,
      '#ffd98a',
    )
    this.text(
      g,
      this.endless
        ? this.worldDef.name.toUpperCase()
        : this.stage.name.toUpperCase(),
      W / 2,
      150,
      28,
    )
    this.text(
      g,
      this.endless
        ? `${this.member.name}  ·  ONE LIFE  ·  HOW FAR CAN YOU RUN?`
        : `${this.member.name}  ×${this.lives}`,
      W / 2,
      172,
      12,
      '#d6f2ee',
    )
  }

  private renderBanner(
    g: CanvasRenderingContext2D,
    title: string,
    line: string,
  ) {
    g.fillStyle = 'rgba(12, 40, 52, 0.66)'
    g.fillRect(0, 96, W, 78)
    this.text(g, title, W / 2, 136, 30, '#ffd98a')
    this.text(g, line, W / 2, 160, 12, '#d6f2ee')
  }

  private renderVictory(g: CanvasRenderingContext2D) {
    if (this.stageIndex + 1 >= CAMPAIGN.length) return this.renderFinale(g)
    const world = this.worldDef
    const next = PLUMBER_WORLDS[world.id]
    this.plate(g, this.stage.code, 1)
    g.fillStyle = 'rgba(12, 40, 52, 0.55)'
    g.fillRect(0, 0, W, H)
    this.text(g, `WORLD ${world.id} CLEAR!`, W / 2, 46, 30, '#ffd98a')
    const teo = drawSprite(g, PLUMBER_ART.cast('teo-helping'), 150, 230, 150)
    if (!teo) drawSprite(g, PLUMBER_ART.cast('teo-caged'), 150, 230, 150)
    this.drawHeroSprite(g, 320, 230, 'cheer', 2.2)
    this.text(
      g,
      `${world.boss.name} lets the river go.`,
      W / 2,
      74,
      13,
      '#fff4dc',
    )
    this.text(
      g,
      this.stageIndex + 1 < CAMPAIGN.length && next
        ? `Teo’s trail leads on to ${next.name}.`
        : 'Teo’s trail goes on. More worlds are on the way.',
      W / 2,
      92,
      13,
      '#d6f2ee',
    )
    this.text(
      g,
      `SCORE ${this.score}   ·   GOLDEN GEARS ${this.gears.size} / ${CAMPAIGN.length}`,
      W / 2,
      256,
      13,
      '#ffd98a',
    )
  }

  private renderFinale(g: CanvasRenderingContext2D) {
    const art = stagePlate(PLUMBER_ART.cutscene('finale-reversal'))
    if (art) g.drawImage(art, 0, 0, W, H)
    else {
      g.fillStyle = '#1c2946'
      g.fillRect(0, 0, W, H)
    }
    g.fillStyle = 'rgba(12, 24, 40, 0.45)'
    g.fillRect(0, 0, W, 104)
    g.fillRect(0, H - 34, W, 34)
    this.text(g, 'THE RIVERS RUN HOME!', W / 2, 40, 28, '#ffd98a')
    this.text(
      g,
      `Lady Spigot lets the last river go, and ${this.member.name} frees Teo.`,
      W / 2,
      66,
      12,
      '#fff4dc',
    )
    this.text(
      g,
      'Every stolen stream tumbles back down to the land.',
      W / 2,
      84,
      12,
      '#d6f2ee',
    )
    const teo = drawSprite(g, PLUMBER_ART.cast('teo-helping'), 160, 236, 120)
    if (!teo) drawSprite(g, PLUMBER_ART.cast('teo-caged'), 160, 236, 120)
    this.drawHeroSprite(g, 320, 236, 'cheer', 1.95)
    this.text(
      g,
      `FINAL SCORE ${this.score}   ·   GOLDEN GEARS ${this.gears.size} / ${CAMPAIGN.length}`,
      W / 2,
      258,
      13,
      '#ffd98a',
    )
  }

  private renderStage(g: CanvasRenderingContext2D) {
    const max = Math.max(1, this.stage.cols * TILE - W)
    this.plate(g, this.stage.code, this.camera / max)
    const wash = g.createLinearGradient(0, 0, 0, H)
    wash.addColorStop(0, 'rgba(214, 247, 236, 0.08)')
    wash.addColorStop(1, 'rgba(255, 236, 214, 0.22)')
    g.fillStyle = wash
    g.fillRect(0, 0, W, H)
    g.save()
    g.translate(-Math.round(this.camera), -Math.round(this.cameraY))
    this.renderTiles(g)
    this.renderThings(g)
    this.renderFoes(g)
    if (this.boss) this.renderBoss(g)
    this.renderSpecial(g, false)
    const blink = this.immune && Math.floor(this.tick / 5) % 2
    if (this.ducking && this.mode === 'play' && !blink) {
      const feet = this.hero.y + TALL + 1
      g.save()
      g.translate(this.hero.x, feet)
      g.scale(1.1, (TALL - DUCK) / TALL)
      g.translate(-this.hero.x, -feet)
      this.drawHeroSprite(g, this.hero.x, feet, null)
      g.restore()
    } else if (!blink || this.mode === 'dying')
      this.drawHeroSprite(
        g,
        this.hero.x,
        this.hero.y + TALL + 1,
        this.mode === 'dying'
          ? 'dazed'
          : this.mode === 'clear'
            ? 'cheer'
            : null,
      )
    this.renderSpecial(g, true)
    g.restore()
    if (this.stage.dark) this.renderDark(g)
    this.renderHud(g)
  }

  /** Cues for running and the special: behind the heroine, then in front. */
  private renderSpecial(g: CanvasRenderingContext2D, front: boolean) {
    if (this.mode !== 'play') return
    const hero = this.hero
    const t = this.tick
    const kind = this.specialKind
    const active = this.specialTimer > 0
    const mid = hero.y + TALL / 2
    if (!front) {
      const streaking =
        active && (kind === 'dash' || kind === 'charge' || kind === 'roll')
      if (
        streaking ||
        (this.running && this.ground && Math.abs(hero.vx) > 3.3)
      ) {
        g.fillStyle = streaking
          ? 'rgba(255, 244, 220, 0.8)'
          : 'rgba(255, 244, 220, 0.45)'
        for (let k = 0; k < (streaking ? 4 : 2); k++) {
          const len = 8 + ((t * 3 + k * 5) % 8)
          const x = hero.x - this.facing * (HALF + 4 + k * 6)
          g.fillRect(
            Math.min(x, x - this.facing * len),
            hero.y + 5 + k * 5,
            len,
            2,
          )
        }
      }
      if (active && kind === 'pound')
        for (let k = 0; k < 3; k++) {
          g.fillStyle = 'rgba(255, 255, 255, 0.7)'
          g.fillRect(
            hero.x - 8 + k * 7,
            hero.y - 18 - ((t * 4 + k * 6) % 14),
            2,
            12,
          )
        }
      return
    }
    g.lineWidth = 2
    if (active && kind === 'spin') {
      g.strokeStyle = 'rgba(255, 217, 138, 0.9)'
      for (let k = 0; k < 3; k++) {
        const a = t / 2 + (k * Math.PI * 2) / 3
        g.beginPath()
        g.arc(hero.x, mid, 22, a, a + 1.1)
        g.stroke()
      }
    }
    if (active && kind === 'roll') {
      g.strokeStyle = 'rgba(200, 238, 255, 0.85)'
      g.beginPath()
      g.arc(hero.x, mid + 2, 15, t / 2, t / 2 + 4.2)
      g.stroke()
    }
    if (active && kind === 'charge') {
      g.strokeStyle = 'rgba(255, 159, 120, 0.9)'
      g.beginPath()
      g.arc(hero.x + this.facing * 6, mid, 16, -0.9, 0.9)
      if (this.facing < 0) {
        g.beginPath()
        g.arc(hero.x - 6, mid, 16, Math.PI - 0.9, Math.PI + 0.9)
      }
      g.stroke()
    }
    if (this.floating) {
      const top = hero.y - 26
      g.fillStyle = '#ef8fb4'
      g.beginPath()
      g.arc(hero.x, top + 6, 15, Math.PI, 0)
      g.closePath()
      g.fill()
      g.strokeStyle = '#7a3a55'
      g.lineWidth = 1.5
      g.beginPath()
      g.moveTo(hero.x, top + 6)
      g.lineTo(hero.x, hero.y + 6)
      g.stroke()
    }
    if (
      kind === 'double-jump' &&
      this.airSpecial &&
      !this.ground &&
      hero.vy < -4
    ) {
      g.strokeStyle = 'rgba(255, 255, 255, 0.7)'
      g.beginPath()
      g.ellipse(hero.x, hero.y + TALL + 6, 12, 3, 0, 0, Math.PI * 2)
      g.stroke()
    }
  }

  private shade: HTMLCanvasElement | null = null

  private renderDark(g: CanvasRenderingContext2D) {
    if (typeof document === 'undefined') return
    this.shade ??= document.createElement('canvas')
    const shade = this.shade
    shade.width = W
    shade.height = H
    const s = shade.getContext('2d')
    if (!s) return
    s.fillStyle = 'rgba(10, 6, 24, 0.8)'
    s.fillRect(0, 0, W, H)
    s.globalCompositeOperation = 'destination-out'
    const cam = Math.round(this.camera)
    const camY = Math.round(this.cameraY)
    const light = (x: number, worldY: number, r: number, strength = 1) => {
      const y = worldY - camY
      const glow = s.createRadialGradient(x, y, 0, x, y, r)
      glow.addColorStop(0, `rgba(0, 0, 0, ${strength})`)
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
      s.fillStyle = glow
      s.beginPath()
      s.arc(x, y, r, 0, Math.PI * 2)
      s.fill()
    }
    light(this.hero.x - cam, this.hero.y + 12, 92)
    for (const foe of this.foes)
      if (foe.kind === 'moss-lantern' && foe.state !== 'gone')
        light(foe.x - cam, foe.y - 12, foe.state === 'flat' ? 34 : 72, 0.95)
    for (const token of this.tokensOnMap)
      if (!token.taken) light(token.x - cam, token.y, 16, 0.8)
    for (const flag of this.checkpoints)
      light(flag.x - cam, flag.y - 16, 30, 0.7)
    if (this.goal) light(this.goal.x - cam, this.goal.y - 20, 46, 0.8)
    if (this.bridgeLeft()) {
      const first = Math.max(0, Math.floor(cam / TILE))
      const last = Math.min(this.stage.cols - 1, first + Math.ceil(W / TILE))
      for (let row = 0; row < this.stage.rows; row++)
        for (let col = first; col <= last; col += 2)
          if (this.solid[row * this.stage.cols + col] === SOLID_BRIDGE)
            light(col * TILE + 8 - cam, row * TILE, 26, 0.6)
    }
    for (const foe of this.foes)
      if (foe.kind === 'siphon-sprite' && foe.state !== 'gone')
        light(foe.x - cam, foe.y - 10, 30, 0.6)
    g.drawImage(shade, 0, 0)
  }

  private renderTiles(g: CanvasRenderingContext2D) {
    const first = Math.max(0, Math.floor(this.camera / TILE))
    const last = Math.min(this.stage.cols - 1, first + Math.ceil(W / TILE) + 1)
    const world = this.world
    const ground = tilePattern(g, PLUMBER_ART.tile(world), 32)
    const block = tilePattern(
      g,
      `/images/arcade/save-the-plumber/tiles/world-${world}-block.webp`,
      32,
    )
    const ledge = tilePattern(
      g,
      `/images/arcade/save-the-plumber/tiles/world-${world}-ledge.webp`,
      32,
    )
    const top = Math.max(0, Math.floor(this.cameraY / TILE))
    const bottom = Math.min(this.stage.rows - 1, top + Math.ceil(H / TILE) + 1)
    for (let row = top; row <= bottom; row++)
      for (let col = first; col <= last; col++) {
        const s = this.solid[row * this.stage.cols + col]!
        if (!s) continue
        const x = col * TILE
        const y = row * TILE
        const above = this.solidAt(col, row - 1)
        if (s === SOLID_WATER) {
          g.fillStyle = 'rgba(46, 128, 196, 0.86)'
          g.fillRect(x, y, TILE, TILE)
          if (above !== SOLID_WATER) {
            const wave = Math.sin(this.tick / 14 + col) * 1.5
            g.fillStyle = 'rgba(200, 238, 255, 0.85)'
            g.fillRect(x, y + 1 + wave, TILE, 2)
            g.fillStyle = 'rgba(120, 200, 240, 0.6)'
            g.fillRect(x + ((this.tick / 3 + col * 5) % TILE), y + 5, 4, 1)
          }
          continue
        }
        if (s === SOLID_GROUND) {
          g.fillStyle = ground ?? '#2f6f68'
          g.fillRect(x, y, TILE, TILE)
          if (above !== SOLID_GROUND) {
            g.fillStyle = '#c7a473'
            g.fillRect(x, y, TILE, 5)
            g.fillStyle = '#f3e4a2'
            if (col % 3 === 0) g.fillRect(x + 5, y + 1, 5, 2)
          }
        } else if (s === SOLID_BLOCK) {
          g.fillStyle = block ?? ground ?? '#356b7b'
          g.fillRect(x, y, TILE, TILE)
          g.fillStyle = 'rgba(12, 40, 52, 0.28)'
          g.fillRect(x, y + TILE - 2, TILE, 2)
          g.fillRect(x + TILE - 2, y, 2, TILE)
          if (!ground && !block) {
            g.fillStyle = '#5a93a0'
            g.fillRect(x + 2, y + 2, TILE - 4, 3)
          }
        } else if (s === SOLID_LEDGE) {
          g.fillStyle = ledge ?? '#c99a52'
          g.fillRect(x, y, TILE, 7)
          g.fillStyle = '#7a5a2f'
          g.fillRect(x, y + 6, TILE, 2)
          g.fillStyle = '#f3e4a2'
          g.fillRect(x + 3, y + 1, 3, 2)
        } else if (s === SOLID_BRIDGE) {
          const left = this.bridgeLeft()
          const flicker = left > 0 && left < 45 && this.tick % 10 < 5
          g.fillStyle =
            left && !flicker
              ? 'rgba(201, 182, 255, 0.85)'
              : 'rgba(201, 182, 255, 0.18)'
          g.fillRect(x, y, TILE, 6)
          g.fillStyle = left ? '#f1eaff' : 'rgba(241, 234, 255, 0.3)'
          g.fillRect(x + 2, y + 1, 4, 2)
          g.fillRect(x + 9, y + 2, 3, 1)
        } else if (s === SOLID_BELT_LEFT || s === SOLID_BELT_RIGHT) {
          g.fillStyle = block ?? '#8e4a43'
          g.fillRect(x, y, TILE, TILE)
          g.fillStyle = '#3a2422'
          g.fillRect(x, y, TILE, 6)
          const dir = s === SOLID_BELT_RIGHT ? 1 : -1
          const run = (((this.tick * BELT * dir) % 8) + 8) % 8
          g.fillStyle = '#ffe08a'
          for (let k = -8; k < TILE; k += 8)
            g.fillRect(x + k + run, y + 2, 4, 2)
        } else if (s === SOLID_GATE) {
          g.fillStyle = 'rgba(94, 209, 195, 0.55)'
          g.fillRect(x + 2, y, TILE - 4, TILE)
          g.fillStyle = '#bdf0e6'
          g.fillRect(x + 4 + ((this.tick / 3 + row * 5) % 8), y, 2, TILE)
        } else if (s === SOLID_CRATE) {
          if (
            !drawSprite(
              g,
              PLUMBER_ART.prop('wooden-crate'),
              x + 8,
              y + TILE + 1,
              18,
            )
          ) {
            g.fillStyle = '#b07a3e'
            g.fillRect(x + 1, y + 1, TILE - 2, TILE - 2)
            g.strokeStyle = '#6a4321'
            g.strokeRect(x + 2.5, y + 2.5, TILE - 5, TILE - 5)
          }
        } else if (s === SOLID_PIPE && above !== SOLID_PIPE) {
          let depth = 1
          while (this.solidAt(col, row + depth) === SOLID_PIPE) depth++
          const tall = depth * TILE
          if (
            !drawSprite(
              g,
              '/images/arcade/save-the-plumber/props/pipe-door.webp',
              x + 8,
              y + tall + 2,
              tall + 10,
            )
          ) {
            g.fillStyle = '#2f9a7f'
            g.fillRect(x - 2, y, TILE + 4, 6)
            g.fillRect(x, y + 6, TILE, tall - 6)
            g.fillStyle = '#1b5c4c'
            g.fillRect(x + 3, y + 1, TILE - 6, 3)
          }
        }
      }
  }

  private renderThings(g: CanvasRenderingContext2D) {
    const t = this.tick
    for (const p of this.platforms) {
      if (p.kind === 'lantern' || p.kind === 'cargo') continue
      if (p.kind === 'raft') {
        g.fillStyle = '#9c6b3e'
        g.fillRect(p.x, p.y, p.w, 7)
        g.fillStyle = '#c9965c'
        for (let k = 2; k < p.w; k += 12) g.fillRect(p.x + k, p.y + 1, 9, 2)
        g.fillStyle = '#5c3b21'
        g.fillRect(p.x + 4, p.y + 6, p.w - 8, 2)
        continue
      }
      if (p.kind === 'piston') {
        g.fillStyle = '#8f6a3a'
        g.fillRect(
          p.x + p.w / 2 - 4,
          p.y + 8,
          8,
          Math.max(0, this.stage.rows * TILE - p.y),
        )
      }
      if (
        !drawSprite(
          g,
          '/images/arcade/save-the-plumber/props/brass-lift.webp',
          p.x + p.w / 2,
          p.y + 14,
          20,
        )
      ) {
        g.fillStyle = '#d9a441'
        g.fillRect(p.x, p.y, p.w, 8)
        g.fillStyle = '#2f9a7f'
        g.fillRect(p.x, p.y + 6, p.w, 3)
      }
    }
    for (const token of this.tokensOnMap) {
      if (token.taken) continue
      const lift = Math.sin(t / 17 + token.x) * 2
      if (
        drawSprite(
          g,
          PLUMBER_ART.prop('brass-token'),
          token.x,
          token.y + 9 + lift,
          16,
        )
      )
        continue
      g.fillStyle = '#f7b83b'
      g.beginPath()
      g.ellipse(token.x, token.y + lift, 5, 7, 0, 0, Math.PI * 2)
      g.fill()
    }
    for (const spring of this.springs) {
      const squash = spring.squash ? 0.7 : 1
      if (
        drawSprite(g, PLUMBER_ART.prop('springstep'), spring.x, spring.y, 20, {
          squash,
        })
      )
        continue
      g.fillStyle = '#d9a441'
      g.fillRect(spring.x - 9, spring.y - 10 * squash, 18, 10 * squash)
    }
    for (const vent of this.vents) {
      const state = this.ventActive(vent)
      if (
        !drawSprite(
          g,
          '/images/arcade/save-the-plumber/props/steam-vent.webp',
          vent.x,
          vent.y,
          16,
        )
      ) {
        g.fillStyle = '#9b7a45'
        g.fillRect(vent.x - 9, vent.y - 5, 18, 5)
      }
      if (state) {
        const tall = state === 2 ? 60 : 14
        for (let i = 0; i < 6; i++) {
          const k = (t * 2 + i * 11) % tall
          g.fillStyle = `rgba(255, 255, 255, ${state === 2 ? 0.75 : 0.4})`
          g.beginPath()
          g.ellipse(
            vent.x + Math.sin(k / 6 + i) * 3,
            vent.y - 6 - k,
            6 + k / 8,
            5 + k / 10,
            0,
            0,
            Math.PI * 2,
          )
          g.fill()
        }
      }
    }
    for (const valve of this.valves) {
      const turn = valve.open ? 0.8 : 0
      g.save()
      g.translate(valve.x, valve.y)
      if (
        !drawSprite(
          g,
          '/images/arcade/save-the-plumber/props/valve-switch.webp',
          0,
          0,
          24,
        )
      ) {
        g.fillStyle = '#2f9a7f'
        g.fillRect(-3, -14, 6, 14)
        g.rotate(turn)
        g.strokeStyle = valve.open ? '#8ad66b' : '#e8705f'
        g.lineWidth = 3
        g.beginPath()
        g.arc(0, -16, 7, 0, Math.PI * 2)
        g.stroke()
      }
      g.restore()
    }
    for (const flag of this.checkpoints) {
      const drawn = drawSprite(
        g,
        PLUMBER_ART.prop('checkpoint-pennant'),
        flag.x,
        flag.y,
        flag.reached ? 34 : 28,
        {
          alpha: flag.reached ? 1 : 0.7,
        },
      )
      if (!drawn) {
        g.fillStyle = '#fff4dc'
        g.fillRect(flag.x - 1, flag.y - 30, 3, 30)
        g.fillStyle = flag.reached ? '#8ad66b' : '#e6798b'
        g.fillRect(flag.x + 2, flag.y - 30, 12, 8)
      }
    }
    if (
      this.goal &&
      !drawSprite(
        g,
        PLUMBER_ART.prop('goal-valve'),
        this.goal.x,
        this.goal.y,
        48,
      )
    ) {
      g.fillStyle = '#ffe5a6'
      g.fillRect(this.goal.x - 3, this.goal.y - 50, 6, 50)
      g.fillStyle = '#e6798b'
      g.fillRect(this.goal.x + 3, this.goal.y - 50, 20, 12)
    }
    if (this.stage.gate !== null) {
      const x = this.stage.gate * TILE + TILE / 2
      drawSprite(
        g,
        '/images/arcade/save-the-plumber/props/boss-gate.webp',
        x,
        this.groundRow * TILE,
        this.locked ? 60 : 44,
        {
          alpha: this.locked ? 1 : 0.85,
        },
      )
    }
    this.renderWindAndCargo(g)
    this.renderPowers(g)
    this.renderGear(g)
    for (const puff of this.soot) {
      g.fillStyle = 'rgba(52, 44, 66, 0.85)'
      g.beginPath()
      g.arc(puff.x, puff.y, 6, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = 'rgba(255, 159, 120, 0.7)'
      g.fillRect(puff.x - 1, puff.y - 1, 2, 2)
    }
    for (const wave of this.waves) {
      for (let i = 0; i < 4; i++) {
        g.fillStyle = 'rgba(255, 255, 255, 0.8)'
        g.beginPath()
        g.ellipse(
          wave.x - wave.dir * i * 5,
          wave.y - 8 - i * 3,
          9 - i,
          8 - i,
          0,
          0,
          Math.PI * 2,
        )
        g.fill()
      }
    }
  }

  /** A gold cog: the painted prop once it is delivered, drawn teeth until then. */
  private drawCog(
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
    turn: number,
    ghost = false,
  ) {
    if (
      !ghost &&
      drawSprite(g, PLUMBER_ART.prop('golden-gear'), x, y + r, r * 2.2)
    )
      return
    g.save()
    g.translate(x, y)
    g.rotate(turn)
    g.beginPath()
    for (let k = 0; k < 16; k++) {
      const a = (k * Math.PI) / 8
      const rad = k % 2 ? r : r * 1.28
      g.lineTo(Math.cos(a) * rad, Math.sin(a) * rad)
    }
    g.closePath()
    g.fillStyle = ghost ? 'rgba(255, 217, 138, 0.25)' : '#f5c542'
    g.strokeStyle = ghost ? 'rgba(255, 244, 220, 0.45)' : '#8a5a12'
    g.lineWidth = 1.5
    g.fill()
    g.stroke()
    g.beginPath()
    g.arc(0, 0, r * 0.42, 0, Math.PI * 2)
    g.fillStyle = ghost ? 'rgba(27, 52, 64, 0.4)' : '#8a5a12'
    g.fill()
    g.restore()
  }

  private renderGear(g: CanvasRenderingContext2D) {
    const gear = this.gear
    if (!gear) return
    const t = this.tick
    const bob = Math.sin(t / 18) * 2
    if (gear.taken) {
      this.drawCog(g, gear.x, gear.y + bob, 7, t / 40, true)
      return
    }
    const glow = g.createRadialGradient(gear.x, gear.y, 0, gear.x, gear.y, 20)
    glow.addColorStop(0, 'rgba(255, 224, 138, 0.55)')
    glow.addColorStop(1, 'rgba(255, 224, 138, 0)')
    g.fillStyle = glow
    g.fillRect(gear.x - 20, gear.y - 20, 40, 40)
    this.drawCog(g, gear.x, gear.y + bob, 8, t / 30)
    if (t % 40 < 8) {
      g.fillStyle = '#fffbe8'
      g.fillRect(gear.x + 6, gear.y - 10 + bob, 2, 2)
    }
  }

  private renderPowers(g: CanvasRenderingContext2D) {
    const t = this.tick
    for (const pickup of this.pickups) {
      if (pickup.taken) continue
      const bob = Math.sin(t / 15 + pickup.x) * 2
      const key = pickup.kind === 'heart' ? 'water-heart' : pickup.kind
      g.fillStyle = 'rgba(255, 244, 220, 0.35)'
      g.beginPath()
      g.arc(pickup.x, pickup.y + bob - 4, 12, 0, Math.PI * 2)
      g.fill()
      if (
        !drawSprite(g, PLUMBER_ART.prop(key), pickup.x, pickup.y + 6 + bob, 20)
      ) {
        g.fillStyle = pickup.kind === 'heart' ? '#5ec8ef' : '#ffd98a'
        g.fillRect(pickup.x - 6, pickup.y - 10 + bob, 12, 12)
      }
    }
    for (const gust of this.gusts) {
      g.strokeStyle = 'rgba(200, 238, 255, 0.85)'
      g.lineWidth = 2
      for (let k = 0; k < 3; k++) {
        g.beginPath()
        g.arc(
          gust.x - gust.dir * k * 6,
          gust.y,
          7 - k * 2,
          t / 3 + k,
          t / 3 + k + 4,
        )
        g.stroke()
      }
    }
    const crate = (x: number, y: number) => {
      if (!drawSprite(g, PLUMBER_ART.prop('wooden-crate'), x, y + 9, 18)) {
        g.fillStyle = '#b07a3e'
        g.fillRect(x - 8, y - 8, TILE, TILE)
      }
    }
    for (const thrown of this.thrown) crate(thrown.x, thrown.y)
    if (this.carrying && this.mode === 'play')
      crate(this.hero.x, this.hero.y - 8)
  }

  /** The first solid surface under a point, for drop shadows. */
  private floorBelow(x: number, y: number): number {
    const col = Math.floor(x / TILE)
    for (
      let row = Math.max(0, Math.floor(y / TILE));
      row < this.stage.rows;
      row++
    ) {
      const s = this.solidAt(col, row)
      if (isWall(s) || s === SOLID_LEDGE) return row * TILE
    }
    return this.stage.rows * TILE
  }

  private renderWindAndCargo(g: CanvasRenderingContext2D) {
    const t = this.tick
    if (t % 300 < 150) {
      const first = Math.max(0, Math.floor(this.camera / TILE))
      const last = Math.min(
        this.stage.cols - 1,
        first + Math.ceil(W / TILE) + 1,
      )
      g.strokeStyle = 'rgba(255, 255, 255, 0.55)'
      g.lineWidth = 1.5
      for (let col = first; col <= last; col++) {
        if (!this.windy[col]) continue
        for (let k = 0; k < 3; k++) {
          const y = this.cameraY + 30 + ((col * 37 + k * 71) % 180)
          const x = col * TILE + TILE - ((t * 3 + k * 9 + col * 5) % TILE)
          g.beginPath()
          g.moveTo(x, y)
          g.lineTo(x + 10, y)
          g.stroke()
        }
      }
    }
    for (const cargo of this.cargo) {
      if (cargo.state === 'wait') {
        if (this.cargoPhase(cargo) > 170) {
          g.fillStyle = 'rgba(30, 20, 40, 0.25)'
          g.beginPath()
          g.ellipse(
            cargo.x,
            this.floorBelow(cargo.x, cargo.top) - 1,
            10,
            3,
            0,
            0,
            Math.PI * 2,
          )
          g.fill()
        }
        continue
      }
      const alpha =
        cargo.state === 'landed' && cargo.timer < 60 && t % 8 < 4 ? 0.5 : 1
      if (
        drawSprite(
          g,
          PLUMBER_ART.prop('wooden-crate'),
          cargo.x,
          cargo.y + TILE + 1,
          18,
          { alpha },
        )
      )
        continue
      g.fillStyle = '#b07a3e'
      g.fillRect(cargo.x - 8, cargo.y, TILE, TILE)
    }
  }

  private foeFrame(foe: Foe): number {
    const anim = ENEMY_ANIMATIONS[FOE_ANIMATION[foe.kind]]!
    const cycle = (n = 8) =>
      anim.loop[Math.floor(this.tick / n + foe.homeX / 40) % anim.loop.length]!
    switch (foe.kind) {
      case 'pumpbug':
        return foe.fade ? (foe.flipped ? 5 : 4) : cycle()
      case 'rivet-roller':
        return foe.state === 'stunned' || foe.fade
          ? 4
          : foe.state === 'idle'
            ? 0
            : Math.floor(this.tick / 4) % 2
      case 'minnow':
        return foe.fade ? 5 : foe.vy < -2 ? 2 : foe.vy > 2 ? 4 : 3
      case 'cork-crab':
        return foe.fade ? 5 : cycle(10)
      case 'glass-gull':
        return foe.fade
          ? 5
          : foe.state === 'swoop'
            ? 2
            : foe.carry
              ? 4
              : cycle(10)
      case 'moss-lantern':
        return foe.state === 'flat' ? 4 : foe.fade ? 5 : cycle(14)
      case 'gasket-golem':
        return foe.fade
          ? 5
          : foe.state === 'stunned'
            ? 4
            : Math.abs(foe.x - this.hero.x) < 40
              ? 3
              : 1 + (Math.floor(this.tick / 14 + foe.homeX / 40) % 2)
      case 'paper-kite':
        return foe.fade ? 4 : cycle(10)
      case 'umbrella-mite':
        return foe.fade
          ? 5
          : foe.vy > 0.5
            ? 0
            : 1 + (Math.floor(this.tick / 12 + foe.homeX / 40) % 2)
      case 'puddle-mimic':
        return foe.fade
          ? 4
          : foe.state === 'idle'
            ? Math.abs(foe.x - this.hero.x) < 120
              ? 1
              : 0
            : foe.timer > 95
              ? 2
              : 3
      case 'siphon-sprite':
        return foe.fade ? 4 : cycle(9)
      case 'chimney-spirit':
        return foe.fade
          ? 4
          : foe.timer % 200 > 160
            ? 2
            : foe.timer % 200 < 14
              ? 3
              : cycle(16)
      case 'tea-kettle-knight':
        return foe.fade
          ? 4
          : foe.state === 'stunned'
            ? 2
            : foe.state === 'swoop'
              ? 3
              : cycle(12)
      case 'spring-hare':
        return foe.fade || foe.state === 'stunned'
          ? 5
          : foe.vy === 0
            ? 0
            : foe.vy < -2
              ? 1
              : foe.vy > 2
                ? 3
                : 2
    }
  }

  private renderFoes(g: CanvasRenderingContext2D) {
    const sizes: Record<FoeKind, number> = {
      pumpbug: 22,
      'rivet-roller': 24,
      minnow: 22,
      'cork-crab': 24,
      'glass-gull': 26,
      'moss-lantern': 26,
      'spring-hare': 34,
      'gasket-golem': 32,
      'paper-kite': 28,
      'umbrella-mite': 26,
      'puddle-mimic': 24,
      'siphon-sprite': 24,
      'chimney-spirit': 34,
      'tea-kettle-knight': 34,
    }
    for (const foe of this.foes) {
      if (foe.state === 'gone') continue
      if (foe.kind === 'minnow' && foe.y >= foe.homeY && !foe.fade) {
        g.fillStyle = 'rgba(220, 245, 255, 0.7)'
        g.fillRect(
          foe.x - 6 + Math.sin(this.tick / 6) * 2,
          foe.homeY - 14,
          12,
          2,
        )
        continue
      }
      const anim = ENEMY_ANIMATIONS[FOE_ANIMATION[foe.kind]]!
      const alpha = foe.fade ? Math.min(1, foe.fade / 12) : 1
      const frame = this.foeFrame(foe)
      const tall = sizes[foe.kind] * (foe.giant ? 2 : 1)
      const flipX = foe.dir < 0
      if (
        drawSheetFrame(
          g,
          anim.src,
          anim.frames,
          frame,
          foe.x,
          foe.y + 2,
          tall,
          { flipX, alpha },
        )
      )
        continue
      if (drawSprite(g, anim.still, foe.x, foe.y + 2, tall, { flipX, alpha }))
        continue
      g.globalAlpha = alpha
      g.fillStyle = foe.kind === 'pumpbug' ? '#d65a7d' : '#7d8a96'
      g.beginPath()
      g.arc(
        foe.x,
        foe.y - (foe.giant ? 18 : 9),
        foe.giant ? 18 : 9,
        0,
        Math.PI * 2,
      )
      g.fill()
      g.globalAlpha = 1
    }
  }

  private renderBoss(g: CanvasRenderingContext2D) {
    const boss = this.boss!
    const anim = bossAnimation(boss.name)
    const frame = {
      wait: 0,
      walk: 0,
      tell: 1,
      burst: 2,
      recover: 3,
      hurt: 4,
      defeat: 5,
    }[boss.state]
    const shake = boss.state === 'tell' ? Math.sin(this.tick) * 1.5 : 0
    const tall =
      boss.kind === 'slam' || boss.kind === 'dive'
        ? 80
        : boss.kind === 'gale'
          ? 78
          : 72
    if (boss.kind === 'burrow' && boss.state === 'tell') {
      const glow = 0.4 + 0.4 * Math.sin(this.tick / 3)
      g.fillStyle = `rgba(201, 182, 255, ${glow})`
      g.beginPath()
      g.ellipse(boss.x, boss.y - 2, 26, 6, 0, 0, Math.PI * 2)
      g.fill()
      g.strokeStyle = 'rgba(241, 234, 255, 0.6)'
      g.lineWidth = 2
      for (let k = 0; k < 3; k++) {
        const ray = boss.x - 30 + k * 30
        g.beginPath()
        g.moveTo(ray + (k - 1) * 20, boss.y - 120)
        g.lineTo(ray, boss.y - 6)
        g.stroke()
      }
      return
    }
    const ok = drawSheetFrame(
      g,
      anim.src,
      anim.frames,
      frame,
      boss.x + shake,
      boss.y + 2,
      tall,
      {
        flipX: boss.dir < 0,
        alpha: boss.state === 'hurt' && this.tick % 6 < 3 ? 0.5 : 1,
      },
    )
    if (!ok) {
      const pose =
        boss.state === 'tell' || boss.state === 'burst' ? 'tell' : 'idle'
      if (
        !drawSprite(
          g,
          anim.still.replace('-idle.webp', `-${pose}.webp`),
          boss.x + shake,
          boss.y + 2,
          tall,
          { flipX: boss.dir < 0 },
        )
      ) {
        g.fillStyle = '#b8743a'
        g.fillRect(boss.x - 18, boss.y - 66, 36, 66)
        g.fillStyle = boss.state === 'tell' ? '#e8705f' : '#8ad66b'
        g.beginPath()
        g.arc(boss.x, boss.y - 56, 12, 0, Math.PI * 2)
        g.fill()
      }
    }
    if (boss.state === 'burst' && boss.kind === 'anchor') {
      g.strokeStyle = 'rgba(140, 240, 230, 0.75)'
      g.lineWidth = 4
      g.beginPath()
      const sweep = 1 - boss.timer / 40
      g.arc(
        boss.x,
        boss.y - 34,
        70,
        boss.dir > 0 ? -1.2 + sweep * 1.6 : Math.PI + 1.2 - sweep * 1.6,
        boss.dir > 0 ? -0.6 + sweep * 1.6 : Math.PI + 0.6 - sweep * 1.6,
        boss.dir < 0,
      )
      g.stroke()
    }
    if (boss.state === 'burst' && boss.kind === 'chime') {
      const swing = Math.sin((1 - boss.timer / 36) * Math.PI * 2) * 1.1
      g.strokeStyle = 'rgba(255, 224, 138, 0.85)'
      g.lineWidth = 3
      g.beginPath()
      g.moveTo(boss.x, boss.y - 60)
      g.lineTo(
        boss.x + Math.sin(swing) * 80,
        boss.y - 60 + Math.cos(swing) * 56,
      )
      g.stroke()
      g.fillStyle = '#ffe08a'
      g.beginPath()
      g.arc(
        boss.x + Math.sin(swing) * 80,
        boss.y - 60 + Math.cos(swing) * 56,
        9,
        0,
        Math.PI * 2,
      )
      g.fill()
    }
    if (boss.state === 'tell' && boss.kind === 'chime') {
      const chimes = 4 - Math.floor(boss.timer / 20)
      for (let i = 0; i < 4; i++) {
        g.fillStyle = i < chimes ? '#ffe08a' : 'rgba(255,255,255,0.3)'
        g.fillRect(boss.x - 15 + i * 8, boss.y - 92, 5, 5)
      }
    }
    if (boss.kind === 'spigot' && boss.state === 'tell') {
      for (let k = 0; k < 4; k++) {
        const rise = (this.tick * 1.5 + k * 9) % 30
        g.fillStyle = `rgba(255, 255, 255, ${0.7 - rise / 50})`
        g.beginPath()
        g.arc(
          boss.x + boss.dir * (20 + rise / 3),
          boss.y - 40 - rise,
          4 + rise / 6,
          0,
          Math.PI * 2,
        )
        g.fill()
      }
    }
    if (boss.kind === 'spigot' && boss.state === 'burst') {
      const from = boss.x + boss.dir * 16
      const wobble = Math.sin(this.tick / 2) * 3
      g.fillStyle = 'rgba(120, 214, 255, 0.55)'
      g.fillRect(Math.min(from, from + boss.dir * JET), boss.y - 70, JET, 70)
      g.fillStyle = 'rgba(230, 250, 255, 0.8)'
      for (let k = 0; k < 6; k++) {
        const x = from + boss.dir * ((this.tick * 6 + k * 23) % JET)
        g.fillRect(x, boss.y - 60 + k * 9 + wobble, 10, 3)
      }
    }
    if (boss.state === 'burst' && boss.kind === 'gale') {
      g.strokeStyle = 'rgba(255, 255, 255, 0.6)'
      g.lineWidth = 2
      for (let k = 0; k < 6; k++) {
        const y = boss.y - 10 - k * 12
        const x = boss.x + boss.dir * (30 + ((this.tick * 5 + k * 23) % 160))
        g.beginPath()
        g.moveTo(x, y)
        g.lineTo(x + boss.dir * 16, y)
        g.stroke()
      }
    }
    if (this.locked && boss.state !== 'defeat') {
      for (let i = 0; i < 3; i++) {
        g.fillStyle = i < boss.hp ? '#e8705f' : 'rgba(255,255,255,0.35)'
        g.beginPath()
        g.arc(boss.x - 12 + i * 12, boss.y - 80, 4, 0, Math.PI * 2)
        g.fill()
      }
    }
  }

  private drawHeroSprite(
    g: CanvasRenderingContext2D,
    x: number,
    feet: number,
    special: 'cheer' | 'dazed' | null,
    zoom = 1,
  ) {
    const member = this.member
    const poses = actionPoses(member)
    const moves = PLUMBER_ART.anim(`heroine-${member.key}-moves`)
    const height = HERO_SPRITE * member.scale * zoom
    const flipX = this.facing < 0
    if (special) {
      if (
        drawSheetFrame(
          g,
          moves,
          6,
          special === 'cheer' ? 4 : 5,
          x,
          feet,
          height,
          { flipX },
        )
      )
        return
      if (
        drawSheetFrame(
          g,
          member.actions,
          6,
          special === 'cheer' ? poses.rise : 5,
          x,
          feet,
          height,
          { flipX },
        )
      )
        return
    }
    if (this.swing && !special) {
      if (
        drawSheetFrame(g, moves, 6, this.swing > 8 ? 0 : 1, x, feet, height, {
          flipX,
        })
      ) {
        this.drawSplash(g, x, feet)
        return
      }
    }
    const runReady = keyedSheet(member.run, 6) !== null
    if (keyedSheet(member.actions, 6) !== null) {
      const running = this.ground && Math.abs(this.hero.vx) > 0.4
      const bob =
        running && !runReady ? Math.abs(Math.sin(this.stride / 2)) * 3 : 0
      const pose = !this.ground
        ? {
            src: member.actions,
            frame: this.hero.vy < 0 ? poses.rise : poses.fall,
          }
        : this.landed
          ? { src: member.actions, frame: poses.land }
          : running && runReady
            ? { src: member.run, frame: Math.floor(this.stride / 1.8) % 6 }
            : running
              ? {
                  src: member.actions,
                  frame:
                    Math.floor(this.stride / 3) % 2 ? poses.rise : poses.fall,
                }
              : { src: member.actions, frame: poses.idle }
      drawSheetFrame(g, pose.src, 6, pose.frame, x, feet - bob, height, {
        flipX,
      })
      if (this.swing) this.drawSplash(g, x, feet)
      return
    }
    if (typeof Path2D !== 'undefined')
      drawHeroine(g, rosterHeroine(this.heroineSeed), x, feet, 29 * zoom, {
        stride: this.stride,
        run: Math.min(1, Math.abs(this.hero.vx) / 2.2),
        airborne: !this.ground,
        rising: this.hero.vy < 0,
        facing: this.facing,
        tick: this.tick,
      })
    if (this.swing) this.drawSplash(g, x, feet)
  }

  private drawSplash(g: CanvasRenderingContext2D, x: number, feet: number) {
    const reach = 14 - this.swing
    for (let i = 0; i < 5; i++) {
      g.fillStyle = 'rgba(158, 225, 245, 0.85)'
      g.beginPath()
      g.arc(
        x + this.facing * (14 + reach * 2 + i * 4),
        feet - 14 - Math.sin(i + reach) * 4,
        3 - i * 0.3,
        0,
        Math.PI * 2,
      )
      g.fill()
    }
  }

  private renderHud(g: CanvasRenderingContext2D) {
    g.fillStyle = 'rgba(28, 63, 82, 0.82)'
    g.fillRect(0, 0, W, 24)
    // Long stage names shrink to stay clear of the hearts.
    const title = this.endless
      ? `ZONE ${this.zone + 1}  ${this.worldDef.name.toUpperCase()}`
      : `${this.stage.code}  ${this.stage.name.toUpperCase()}`
    g.font = '900 12px "Lilita One", system-ui, sans-serif'
    const wide = g.measureText(title).width
    const size = wide > 172 ? Math.max(8, (12 * 172) / wide) : 12
    this.text(g, title, 10, 17, size, '#fff1ce', 'left')
    for (let i = 0; i < HEARTS; i++) {
      const x = 196 + i * 16
      g.fillStyle = i < this.hearts ? '#ef5d7a' : 'rgba(255,255,255,0.25)'
      g.beginPath()
      g.moveTo(x, 9)
      g.bezierCurveTo(x - 7, 2, x - 9, 12, x, 18)
      g.bezierCurveTo(x + 9, 12, x + 7, 2, x, 9)
      g.fill()
    }
    this.text(g, `◎ ${this.tokens}`, 256, 17, 12, '#ffd98a', 'left')
    this.text(
      g,
      this.endless
        ? `BEST ${Math.max(this.endlessBest, this.distance)}`
        : `${this.member.name} ×${this.lives}`,
      316,
      17,
      this.endless ? 10 : 12,
      '#fff1ce',
      'left',
    )
    // Endless zones hide no Golden Gear.
    if (!this.endless) this.drawCog(g, 244, 12, 6, 0, !this.gear?.taken)
    if (this.gearFlash) this.text(g, 'GOLDEN GEAR!', W / 2, 46, 18, '#ffd98a')
    if (this.power) {
      g.fillStyle = 'rgba(255, 244, 220, 0.25)'
      g.beginPath()
      g.arc(392, 12, 10, 0, Math.PI * 2)
      g.fill()
      drawSprite(g, PLUMBER_ART.prop(this.power), 392, 21, 18)
    }
    this.text(
      g,
      this.endless ? `${this.distance} m` : `${this.score}`,
      W - 10,
      17,
      12,
      '#fff1ce',
      'right',
    )
  }
}

export function createSavePlumberPreview(
  options: ArcadeGameOptions,
  run: PlumberRunOptions = {},
): PlumberRun {
  return new PlumberRun(options, run)
}

const module: ArcadeGameModule = {
  create: (options) => createSavePlumberPreview(options),
}
export default module
export const create = createSavePlumberPreview
