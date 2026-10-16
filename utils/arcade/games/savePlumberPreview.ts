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
} from './savePlumberLevels'
import {
  PLUMBER_ROSTER,
  actionPoses,
  rosterFor,
  rosterHeroine,
  rosterIndex,
  rosterPortrait,
  seedForRoster,
  type RosterHeroine,
} from './savePlumberRoster'
import { readPlumberSave, type PlumberSave } from './savePlumberSave'
import { drawSheetFrame, keyedSheet } from './savePlumberSheets'
import { PLUMBER_WORLDS, type PlumberWorld } from './savePlumberWorlds'

const W = 480
const H = 270
const GRAVITY = 0.43
const JUMP = -8.6
const SPRING = -12.2
const RUN = 2.85
const HALF = 11
const TALL = 26
const START_LIVES = 3
const HEARTS = 3
const LAST_WORLD = stageWorld(CAMPAIGN[CAMPAIGN.length - 1]!.code)

type Mode =
  'title' | 'select' | 'intro' | 'play' | 'dying' | 'clear' | 'victory' | 'over'

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
  dir: number
  state: 'idle' | 'walk' | 'stunned' | 'kicked' | 'flat' | 'swoop' | 'gone'
  timer: number
  fade: number
  flipped: boolean
  homeX: number
  homeY: number
  carry: number
  pad: Platform | null
}

type BossKind =
  'pressure' | 'anchor' | 'slam' | 'chime' | 'gale' | 'burrow' | 'dive'

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

/** Steps a boss takes in each world (the world's index into this list). */
const BOSS_KINDS: BossKind[] = [
  'pressure',
  'anchor',
  'slam',
  'chime',
  'gale',
  'burrow',
  'dive',
]

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
type Cargo = {
  x: number
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
export type PlumberRunOptions = { stage?: number; autopilot?: boolean }

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
  cursor: number
  readonly demo: boolean
  readonly autopilot: boolean
  private sound: ArcadeGameOptions['sound']
  private rng: () => number
  private saveData: PlumberSave | null
  private resume: PlumberSave | null

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
    this.autopilot = options.demo || run.autopilot === true
    this.sound = options.sound
    this.rng = options.rng
    this.resume = this.demo ? null : readPlumberSave(options.resume)
    this.saveData = this.resume
    this.heroineSeed = this.resume?.heroine ?? plumberHeroine().seed
    this.cursor = rosterIndex(this.heroineSeed)
    if (this.autopilot) {
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

  get save(): PlumberSave | null | undefined {
    return this.demo ? undefined : this.saveData
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

  private get menuItems(): ('continue' | 'new')[] {
    return this.resume ? ['continue', 'new'] : ['new']
  }

  private remember(extra: Partial<PlumberSave> = {}) {
    this.saveData = {
      v: 1,
      heroine: this.heroineSeed,
      stage: this.stageIndex,
      score: this.score,
      lives: Math.max(1, this.lives),
      tokens: this.tokens,
      cleared: this.saveData?.cleared === true,
      ...extra,
    }
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
    switch (this.mode) {
      case 'title':
        return this.updateTitle(keys)
      case 'select':
        return this.updateSelect(keys)
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
        if (!this.modeTimer) this.nextStage()
        return
      case 'victory':
        if (
          !this.modeTimer ||
          (this.modeTimer < 420 && (keys.pressed.start || keys.pressed.a))
        ) {
          if (this.stageIndex + 1 < CAMPAIGN.length)
            this.beginStage(this.stageIndex + 1)
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
      this.menu = (this.menu + 1) % items.length
      this.sound.play('blip')
    }
    if (!(keys.pressed.a || keys.pressed.start)) return
    this.sound.play('pickup')
    if (items[this.menu] === 'continue' && this.resume) {
      this.score = this.resume.score
      this.lives = this.resume.lives
      this.tokens = this.resume.tokens
      this.heroineSeed = this.resume.heroine
      this.beginStage(this.resume.stage)
    } else this.setMode('select')
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
    this.score = 0
    this.lives = START_LIVES
    this.tokens = 0
    this.beginStage(0)
  }

  private beginStage(index: number) {
    this.stageIndex = index
    this.loadStage(index)
    this.remember()
    this.setMode('intro', 150)
  }

  private nextStage() {
    const last = this.stageIndex + 1 >= CAMPAIGN.length
    if (this.autopilot)
      return this.beginDemoStage(last ? 0 : this.stageIndex + 1)
    if (this.boss) {
      this.remember({
        stage: last ? 0 : this.stageIndex + 1,
        cleared: this.saveData?.cleared === true || last,
      })
      this.setMode('victory', 600)
      return
    }
    this.beginStage(this.stageIndex + 1)
  }

  private beginDemoStage(index: number) {
    this.stageIndex = index
    this.loadStage(index)
    this.setMode('play')
  }

  loadStage(index: number) {
    const stage = parseStage(CAMPAIGN[index]!)
    this.stageIndex = index
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
        case 'cargo':
          this.cargo.push({
            x: cx,
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
    const hero = this.hero
    if (this.riding) {
      this.moveX(hero, HALF, TALL, this.riding.dx)
      hero.y += this.riding.dy
    }
    const move = Number(keys.held.right) - Number(keys.held.left)
    hero.vx = move
      ? Math.max(-RUN, Math.min(RUN, hero.vx + move * 0.44))
      : hero.vx * 0.77
    if (Math.abs(hero.vx) < 0.05) hero.vx = 0
    if (move) this.facing = move > 0 ? 1 : -1
    if (this.ground) this.stride += Math.abs(hero.vx) * 0.17
    if (this.moveX(hero, HALF, TALL, hero.vx)) hero.vx = 0
    const push = this.windAt(hero.x, this.tick) + this.beltUnder(hero)
    if (push) this.moveX(hero, HALF, TALL, push)
    if (this.ground) this.grace = 7
    else if (this.grace) this.grace--
    const jumpDown = keys.pressed.a || keys.pressed.up
    this.jumpHeld = keys.held.a || keys.held.up
    if (jumpDown) this.jumpBuffer = 7
    else if (this.jumpBuffer) this.jumpBuffer--
    if (this.jumpBuffer && this.grace) {
      hero.vy = JUMP
      this.ground = false
      this.riding = null
      this.grace = 0
      this.jumpBuffer = 0
      this.sound.play('blip')
    }
    if (hero.vy >= 0) this.sprung = false
    if (!this.jumpHeld && !this.sprung && hero.vy < -3.4) hero.vy = -3.4
    hero.vy = Math.min(9, hero.vy + GRAVITY)
    const prevBottom = hero.y + TALL
    const wasGround = this.ground
    this.ground = false
    this.riding = null
    const hit = this.moveY(hero, HALF, TALL, hero.vy)
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
    if (this.ground && !wasGround) this.landed = 6
    else if (this.landed) this.landed--
    this.updateSprings(prevBottom)
    if (keys.pressed.down && this.ground) this.tryDoor()
    if (keys.pressed.b && !this.cooldown) this.useTool()
    this.collectTokens()
    this.updateFoes(prevBottom)
    this.updateVents()
    this.updateCargo()
    this.updateSoot()
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
        for (let row = 1; row < 14; row++)
          this.setSolid(this.stage.gate, row, SOLID_BLOCK)
        if (this.boss) this.boss.state = 'walk'
        this.sound.play('extra')
      }
    }
    const target = this.cameraTarget()
    this.camera += (target - this.camera) * 0.2
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
          cargo.y = -TILE
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
        puff.y > hero.y &&
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
    for (
      let col = Math.floor(box.left / TILE);
      col <= Math.floor(box.right / TILE);
      col++
    )
      for (let row = rowTop - 1; row <= rowBottom; row++)
        if (this.solidAt(col, row) === SOLID_CRATE) {
          this.setSolid(col, row, 0)
          this.score += 70
          this.tokens++
          struck = true
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
    this.score += points
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
    const body: Body = { x: foe.x, y: foe.y - 16, vx: foe.vx, vy: foe.vy }
    if (speed && this.moveX(body, 9, 16, foe.vx)) foe.dir *= -1
    else if (speed && turnAtEdge && foe.vy === 0) {
      const aheadCol = Math.floor((body.x + foe.dir * 10) / TILE)
      const belowRow = Math.floor((foe.y + 2) / TILE)
      const s = this.solidAt(aheadCol, belowRow)
      if (!isWall(s) && s !== SOLID_LEDGE && s !== SOLID_BRIDGE) foe.dir *= -1
    }
    body.vy = Math.min(fall, foe.vy + GRAVITY)
    const landed = this.moveY(body, 9, 16, body.vy) === 'land'
    if (landed) body.vy = 0
    foe.x = body.x
    foe.y = body.y + 16
    foe.vy = body.vy
    return landed
  }

  private moveFoe(foe: Foe) {
    const hero = this.hero
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
        Math.abs(foe.x - hero.x) < HALF + 9 &&
        hero.y + TALL > foe.y - 18 &&
        hero.y < foe.y
      if (!overlap || this.mode !== 'play') continue
      const stomp = hero.vy > 0.5 && prevBottom <= foe.y - 10
      if (stomp) {
        hero.vy = this.jumpHeld ? -7.6 : -5.4
        this.ground = false
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
    const phase = (this.tick + vent.offset) % 180
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
          boss.kind === 'gale'
            ? Math.max(-boss.speed, Math.min(boss.speed, boss.home - boss.x))
            : boss.dir * boss.speed
        boss.x = Math.max(left, Math.min(right, boss.x + step))
        if (boss.timer <= 0) {
          boss.state = 'tell'
          boss.timer = boss.kind === 'chime' ? 80 : 60
          if (boss.kind === 'burrow')
            boss.x = Math.max(left, Math.min(right, hero.x))
        }
        break
      }
      case 'tell':
        if (boss.kind === 'chime' && boss.timer % 20 === 0 && boss.timer > 0)
          this.sound.play('blip')
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
    if (this.immune || this.mode !== 'play') return
    this.hearts--
    this.immune = 90
    this.hero.vx = dir * 3.2
    this.hero.vy = -4.4
    this.ground = false
    this.riding = null
    this.sound.play('warn')
    if (this.hearts <= 0) this.die()
  }

  private die() {
    this.sound.play('die')
    this.setMode('dying', 80)
  }

  private afterDeath() {
    if (!this.autopilot) this.lives--
    if (this.lives <= 0) {
      this.remember({ lives: START_LIVES, score: 0, tokens: 0 })
      this.setMode('over', 220)
      return
    }
    const flags = this.checkpoints.map((f) => f.reached)
    const stageCheckpoint = this.checkpoint
    this.loadStage(this.stageIndex)
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
    const gate = this.gateAhead()
    const valve = this.valves.find((v) => !v.open)
    if (gate !== null && valve && valve.x < hero.x + 40) {
      const dx = valve.x - hero.x
      if (dx < 6) {
        input.held.left = true
        go = false
      } else if (dx < 40) {
        go = false
        if (!this.cooldown) input.pressed.b = true
      }
    } else if (wall === SOLID_CRATE) {
      go = false
      if (!this.cooldown) input.pressed.b = true
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
          input.pressed.b = true
        }
        continue
      }
      if (dx < -10 || dx > 70 || Math.abs(foe.y - feet) > 34) continue
      if (
        foe.kind === 'gasket-golem' ||
        foe.kind === 'tea-kettle-knight' ||
        foe.kind === 'chimney-spirit' ||
        foe.kind === 'puddle-mimic'
      ) {
        if (!this.cooldown && dx < 54) input.pressed.b = true
        continue
      }
      if (foe.state === 'stunned' || foe.state === 'kicked') {
        if (dx < 34 && foe.state === 'stunned' && !jump)
          jump = { hold: 12, right: true }
      } else if (!this.cooldown && dx < 54) input.pressed.b = true
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
      this.pilotHold = jump.hold
      this.pilotRight = jump.right
      input.held.right = jump.right
      return input
    }
    input.held.right = go && !input.held.left
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

  private simulateJump(hold: number, right: boolean) {
    try {
      return this.predictJump(hold, right)
    } finally {
      this.clock = null
    }
  }

  private predictJump(hold: number, right: boolean) {
    const body: Body = { ...this.hero }
    let vx = right ? body.vx : body.vx * 0.5
    let vy = JUMP
    for (let k = 1; k <= 120; k++) {
      this.clock = this.tick + k
      vx = right ? Math.min(RUN, vx + 0.44) : vx * 0.77
      if (this.moveX(body, HALF, TALL, vx)) vx = 0
      const gust = this.windAt(body.x, this.tick + k)
      if (gust) this.moveX(body, HALF, TALL, gust)
      if (k > hold && vy < -3.4) vy = -3.4
      vy = Math.min(9, vy + GRAVITY)
      const prevBottom = body.y + TALL
      const hit = this.moveY(body, HALF, TALL, vy)
      if (hit === 'land') return { x: body.x, feet: body.y + TALL }
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
          return { x: body.x, feet: at.y }
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
      if (dx > 0) input.held.left = true
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
      case 'select':
        return this.renderSelect(g)
      case 'victory':
        return this.renderVictory(g)
      default:
        this.renderStage(g)
        if (this.mode === 'intro') this.renderIntro(g)
        if (this.mode === 'clear')
          this.renderBanner(g, 'STAGE CLEAR', `+${1000 + this.hearts * 200}`)
        if (this.mode === 'over')
          this.renderBanner(
            g,
            'GAME OVER',
            `Continue from ${this.stage.code} on the title screen`,
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
        item === 'continue' && this.resume
          ? `CONTINUE  ${CAMPAIGN[this.resume.stage]!.code}`
          : 'NEW GAME'
      const y = 182 + i * 26
      const on = i === this.menu
      if (on) {
        g.fillStyle = 'rgba(255, 217, 138, 0.25)'
        g.fillRect(W / 2 - 92, y - 18, 184, 24)
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
    this.text(g, 'A  JUMP     B  TOOL     ↓  PIPES', W / 2, 256, 10, '#d6f2ee')
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

  private renderIntro(g: CanvasRenderingContext2D) {
    g.fillStyle = 'rgba(12, 40, 52, 0.72)'
    g.fillRect(0, 86, W, 96)
    this.text(g, `WORLD ${this.stage.code}`, W / 2, 118, 18, '#ffd98a')
    this.text(g, this.stage.name.toUpperCase(), W / 2, 150, 28)
    this.text(
      g,
      `${this.member.name}  ×${this.lives}`,
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
    const world = this.worldDef
    const next = PLUMBER_WORLDS[world.id]
    this.plate(g, this.stage.code, 1)
    g.fillStyle = 'rgba(12, 40, 52, 0.55)'
    g.fillRect(0, 0, W, H)
    this.text(g, `WORLD ${world.id} CLEAR!`, W / 2, 46, 30, '#ffd98a')
    const teo = drawSprite(g, PLUMBER_ART.cast('teo-helping'), 150, 230, 150)
    if (!teo) drawSprite(g, PLUMBER_ART.cast('teo-caged'), 150, 230, 150)
    this.drawHeroSprite(g, 320, 230, 'cheer', 1.6)
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
    this.text(g, `SCORE ${this.score}`, W / 2, 256, 14, '#ffd98a')
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
    g.translate(-Math.round(this.camera), 0)
    this.renderTiles(g)
    this.renderThings(g)
    this.renderFoes(g)
    if (this.boss) this.renderBoss(g)
    const blink = this.immune && Math.floor(this.tick / 5) % 2
    if (!blink || this.mode === 'dying')
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
    g.restore()
    if (this.stage.dark) this.renderDark(g)
    this.renderHud(g)
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
    const light = (x: number, y: number, r: number, strength = 1) => {
      const glow = s.createRadialGradient(x, y, 0, x, y, r)
      glow.addColorStop(0, `rgba(0, 0, 0, ${strength})`)
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
      s.fillStyle = glow
      s.beginPath()
      s.arc(x, y, r, 0, Math.PI * 2)
      s.fill()
    }
    const cam = Math.round(this.camera)
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
    for (let row = 0; row < this.stage.rows; row++)
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
        14 * TILE,
        this.locked ? 60 : 44,
        {
          alpha: this.locked ? 1 : 0.85,
        },
      )
    }
    this.renderWindAndCargo(g)
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
          const y = 30 + ((col * 37 + k * 71) % 180)
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
          g.ellipse(cargo.x, 14 * TILE - 1, 10, 3, 0, 0, Math.PI * 2)
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
      const tall = sizes[foe.kind]
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
      g.arc(foe.x, foe.y - 9, 9, 0, Math.PI * 2)
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
    const height = 50 * member.scale * zoom
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
      drawHeroine(g, rosterHeroine(this.heroineSeed), x, feet, 40 * zoom, {
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
    this.text(
      g,
      `${this.stage.code}  ${this.stage.name.toUpperCase()}`,
      10,
      17,
      12,
      '#fff1ce',
      'left',
    )
    for (let i = 0; i < HEARTS; i++) {
      const x = 196 + i * 16
      g.fillStyle = i < this.hearts ? '#ef5d7a' : 'rgba(255,255,255,0.25)'
      g.beginPath()
      g.moveTo(x, 9)
      g.bezierCurveTo(x - 7, 2, x - 9, 12, x, 18)
      g.bezierCurveTo(x + 9, 12, x + 7, 2, x, 9)
      g.fill()
    }
    this.text(g, `◎ ${this.tokens}`, 262, 17, 12, '#ffd98a', 'left')
    this.text(
      g,
      `${this.member.name} ×${this.lives}`,
      316,
      17,
      12,
      '#fff1ce',
      'left',
    )
    this.text(g, `${this.score}`, W - 10, 17, 12, '#fff1ce', 'right')
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
