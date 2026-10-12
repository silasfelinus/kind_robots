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
// length of the cable, slurping every spark touching its sides as a climbing chain, rebooting
// every glitch it touches and topping the battery up by the cable's length. The longer the cable
// you dare lay across the maze, the bigger the sweep.
//
// Mazes, components, glitches, bosses, art and music live in utils/arcade/cableCrawler/. Arrows
// steer.

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
  BOARD_H,
  BOARD_W,
  BUG_SPRITES,
  BUNNY_SPRITES,
  BYTE_SPRITES,
  ELBOWS,
  ELBOWS_LIT,
  ELBOWS_SURGE,
  FUSE_BEETLE,
  type Facing,
  LIFE_SPRITE,
  MIMIC_TWINKLE,
  PLUG,
  REBOOT_SPRITE,
  REEL_SPRITE,
  SOCKET_SPRITE,
  SPARK_SPRITES,
  TILE,
  TUBE,
  TUBE_LIT,
  TUBE_SURGE,
  boardCanvas,
  glowStamp,
  paintBoard,
} from '../cableCrawler/art'
import {
  BOSS_HIT_POINTS,
  BOSS_DEFEAT_POINTS,
  SHUFFLE_TELL,
  type Boss,
  bossCell,
  bossPhase,
  hitBoss,
  newBoss,
  updateBoss,
} from '../cableCrawler/bosses'
import {
  BOSS_MUSIC,
  COMPONENTS,
  SCREENSAVER_MUSIC,
  type Component,
  type Step,
  componentAt,
  componentSteps,
} from '../cableCrawler/components'
import {
  BUG_BOOT,
  BUG_DOWN,
  CRACKLE_RANGE,
  GLITCH_POINTS,
  MIMIC_SHORT,
  type Glitch,
  bugWay,
  glitchLive,
  newGlitch,
} from '../cableCrawler/glitches'
import {
  COLS,
  ROWS,
  type Maze,
  cellKey,
  cellX,
  cellY,
  parseMaze,
  ringOf,
} from '../cableCrawler/mazes'
import { type CableSave, readCableSave } from '../cableCrawler/save'
import {
  SOCKET_RECHARGE,
  SURGE_TOPUP_PER_CELL,
  chainPoints,
  surgeSweep,
} from '../cableCrawler/surge'

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

const SPARK_POINTS = 10
const BYTE_POINTS = 1000
const BATTERY_POINTS = 10
const STAR_POINTS = 50
const SAVER_PERFECT = 5000
const SAVER_TICKS = 60 * 20
const STAR_EVERY = 26
const STAR_STEP = 9
/** Sparks a boss board keeps topped up, so there is always cable to lay. */
const BOSS_SPARKS = 14

type Dir = { dx: number; dy: number }
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
  ticks: number
  stars: Array<{ k: number; t: number }>
  spawn: number
  caught: number
  total: number
}

const px = (k: number) => cellX(k) * TILE + TILE / 2
const py = (k: number) => cellY(k) * TILE + TILE / 2
const step = (k: number, d: Dir) => {
  const x = cellX(k) + d.dx
  const y = cellY(k) + d.dy
  return x < 0 || y < 0 || x >= COLS || y >= ROWS ? -1 : cellKey(x, y)
}
const reverseOf = (a: Dir, b: Dir) => a.dx === -b.dx && a.dy === -b.dy

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
  // The board in play.
  private maze!: Maze
  private ring: number[] = []
  private sparks = new Set<number>()
  private totalSparks = 0
  private sockets: Socket[] = []
  private glitches: Glitch[] = []
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
  /** This instance's board, painted once per maze onto one reused canvas. */
  private boardArt: { maze: Maze; canvas: HTMLCanvasElement | null } | null =
    null
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
    return this.component.music
  }

  // --- the campaign -------------------------------------------------------------------------

  /** The score multiplier: the component's number, plus a lap of the Mainframe each time round. */
  private get mult(): number {
    return this.component.number + this.lap * COMPONENTS.length
  }

  private get stepNow(): Step {
    return this.steps[this.stepIndex]!
  }

  private beginComponent(index: number) {
    const { component, lap } = componentAt(index)
    this.compIndex = index
    this.component = component
    this.lap = lap
    this.steps = componentSteps(component)
    this.stepIndex = 0
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
    this.level++
    this.maze = parseMaze(s.layout)
    this.ring = s.kind === 'boss' ? ringOf(this.maze) : []
    this.sparks = new Set(this.maze.sparks)
    this.totalSparks = this.sparks.size
    this.sockets = this.maze.sockets.map((k) => ({ k, charge: 0 }))
    this.glitches = [
      ...this.maze.bugs.map((k) => newGlitch('bug', k)),
      ...this.maze.bunnies.map((k) => newGlitch('bunny', k)),
      ...this.maze.mimics.map((k) => newGlitch('mimic', k)),
    ]
    this.boss =
      s.kind === 'boss' && this.ring.length
        ? newBoss(
            this.component.boss.kind,
            this.ring,
            this.maze.boss ?? this.ring[0]!,
          )
        : null
    this.byte =
      s.kind === 'maze' && this.maze.byte !== null
        ? { k: this.maze.byte, shown: false }
        : null
    this.saver =
      s.kind === 'screensaver'
        ? { ticks: SAVER_TICKS, stars: [], spawn: 30, caught: 0, total: 0 }
        : null
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
    this.banner = {
      text: this.boardTitle(),
      sub:
        s.kind === 'maze'
          ? `${this.maze.name}  ${this.totalSparks} SPARKS`
          : s.kind === 'boss'
            ? c.boss.name
            : 'CATCH THE STREAMING STARS',
      ticks: 110,
    }
  }

  /** The board's label: MAZE 1-3, SCREENSAVER or BOSS. */
  private boardTitle(): string {
    const s = this.stepNow
    if (s.kind === 'maze') return `MAZE ${this.component.number}-${s.index + 1}`
    return s.kind === 'boss' ? 'BOSS!' : 'SCREENSAVER'
  }

  /** Ticks per cell the plug crawls on this board. */
  private stepTicks(): number {
    const s = this.stepNow
    if (s.kind === 'screensaver') return 6
    const index = s.kind === 'maze' ? s.index : 4
    return Math.max(3, this.component.step - index * 0.25 - this.lap)
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
    this.pilot = null
    for (const g of this.glitches) {
      if (g.kind !== 'bug' || g.gone) continue
      g.k = g.home
      g.timer = 40
      if (g.down === 0) g.booting = BUG_BOOT
    }
    if (this.boss) {
      this.boss.at = Math.max(
        0,
        this.ring.indexOf(this.maze.boss ?? this.ring[0]!),
      )
      this.boss.stun = 90
      this.boss.charging = 0
      this.boss.tell = 0
      this.boss.blocked = 0
    }
  }

  /** Remember the run at this component's start (a real campaign game only). */
  private keep() {
    if (this.demo || this.offer) return
    this.save = {
      v: 1,
      comp: this.compIndex,
      score: this.score,
      lives: Math.max(1, this.lives),
      continued: false,
      bytes: [...this.bytes],
      reached: this.reached,
    }
  }

  /** Keep what is earned for good (the golden bytes) the moment it is earned. */
  private persist() {
    if (this.demo) return
    const base: CableSave = this.save ?? {
      v: 1,
      comp: 0,
      score: 0,
      lives: START_LIVES,
      continued: false,
      bytes: [],
      reached: 1,
    }
    this.save = { ...base, bytes: [...this.bytes], reached: this.reached }
  }

  /** Pick a saved run back up at the start of its component. */
  private resumeFrom(s: CableSave) {
    this.score = s.continued ? 0 : s.score
    this.lives = s.continued ? START_LIVES : s.lives
    this.nextExtra = EXTRA_FIRST
    while (this.nextExtra <= this.score) this.nextExtra += EXTRA_EVERY
    this.level = s.comp * 7
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
    for (const s of this.sockets) if (s.charge > 0) s.charge--
    if (this.saver) {
      this.updateSaver()
      if (this.clear > 0 || this.dead > 0) return
    } else if (--this.battery <= 0) {
      this.unplug('THE BATTERY RAN FLAT')
      return
    }
    this.updateGlitches()
    if (this.dead > 0) return
    if (this.boss) {
      this.updateBossBoard()
      if (this.dead > 0 || this.clear > 0) return
    }
    if (++this.stepTimer >= this.stepTicks()) {
      this.stepTimer = 0
      this.crawl()
    }
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
  private glitchAt(k: number, kind?: Glitch['kind']): Glitch | undefined {
    return this.glitches.find(
      (g) => g.k === k && glitchLive(g) && (!kind || g.kind === kind),
    )
  }

  private isWall(k: number): boolean {
    return k < 0 || this.maze.walls[k] === true
  }

  /** Where a dust bunny pushed off `k` the way `d` would land, or -1 if it can't go. */
  private bunnyLanding(k: number, d: Dir): number {
    const to = step(k, d)
    if (to < 0 || this.isWall(to)) return -1
    if (this.body.includes(to) || this.glitchAt(to)) return -1
    if (this.sockets.some((s) => s.k === to) || to === this.maze.start)
      return -1
    if (this.byte?.shown && this.byte.k === to) return -1
    if (this.boss && bossCell(this.boss) === to) return -1
    return to
  }

  /** Whether the plug can crawl from its cell the way `d` (its own body aside). */
  private plugCan(d: Dir): boolean {
    const to = step(this.body[0]!, d)
    if (to < 0 || this.isWall(to)) return false
    const bunny = this.glitchAt(to, 'bunny')
    return !bunny || this.bunnyLanding(to, d) >= 0
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
        const boxed = !DIRS.some(
          (d) =>
            !reverseOf(d, this.dir) &&
            this.plugCan(d) &&
            !this.bodyBlocks(step(head, d)),
        )
        if (boxed && this.body.length > 1 && ++this.stuck >= STUCK_STEPS)
          this.tangled()
        return
      }
      dir = ways[0]!
    }
    this.stuck = 0
    const next = step(head, dir)
    if (this.bodyBlocks(next)) {
      if (this.saver) this.endSaver(false)
      else this.unplug('BIT YOUR OWN CABLE')
      return
    }
    const bunny = this.glitchAt(next, 'bunny')
    if (bunny) this.pushBunny(bunny, dir)
    this.dir = dir
    this.want = dir
    this.body.unshift(next)
    if (this.grow > 0) this.grow--
    else this.body.pop()
    if (this.glitchAt(next, 'bug')) {
      this.unplug('STATIC SHOCK!')
      return
    }
    if (this.boss && bossCell(this.boss) === next && this.boss.hp > 0) {
      this.unplug('BONKED BY THE BOSS')
      return
    }
    this.eat(next)
  }

  /** A boxed-in cable, with no way on at all, gives up. */
  private tangled() {
    if (this.saver) this.endSaver(false)
    else this.unplug('TANGLED UP')
  }

  private pushBunny(bunny: Glitch, d: Dir) {
    const to = this.bunnyLanding(bunny.k, d)
    if (to < 0) return
    bunny.k = to
    // A dust bunny rolls up any spark it is pushed over.
    if (this.sparks.delete(to)) {
      this.addScore(SPARK_POINTS * this.mult, px(to), py(to) - 8, false)
      this.sound.play('pop')
      this.afterSpark()
    }
  }

  private eat(at: number) {
    const x = px(at)
    const y = py(at)
    if (this.sparks.delete(at)) {
      this.grow++
      this.addScore(SPARK_POINTS * this.mult, x, y - 8, false)
      this.sound.play('blip')
      this.crumbs.burst(x, y, this.fxRng, {
        count: 3,
        speed: 0.9,
        colours: [RAMPS.gold[4], RAMPS.gold[3], RAMPS.sky[4]],
      })
      this.afterSpark()
    }
    const mimic = this.glitchAt(at, 'mimic')
    if (mimic) {
      mimic.gone = true
      this.battery = Math.max(1, this.battery - MIMIC_SHORT)
      this.floaters.push({ x, y: y - 10, text: 'SHORTED -10S', life: 70 })
      this.burst(x, y, RAMPS.pink[3], 10)
      this.sound.play('warn')
    }
    if (this.byte?.shown && this.byte.k === at) this.takeByte()
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
    if (!this.demo) {
      this.bytes.add(this.maze.id)
      this.persist()
    }
  }

  // --- the Plug-In Surge ----------------------------------------------------------------------

  private surge(socket: Socket) {
    socket.charge = SOCKET_RECHARGE
    const sweep = surgeSweep(this.body, this.maze.walls)
    const swept = new Set(sweep)
    let chain = 0
    let rebooted = 0
    const from = (k: number) =>
      this.body.find(
        (b) =>
          Math.abs(cellX(b) - cellX(k)) + Math.abs(cellY(b) - cellY(k)) === 1,
      ) ?? this.body[0]!
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
      if (!glitchLive(g) || !swept.has(g.k)) continue
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
      if (g.kind === 'bug') g.down = BUG_DOWN
      else g.gone = true
    }
    if (this.boss && swept.has(bossCell(this.boss)) && hitBoss(this.boss)) {
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

  private updateGlitches() {
    for (const g of this.glitches) {
      if (g.gone) continue
      if (g.down > 0) {
        if (--g.down === 0) {
          if (this.body.includes(g.home)) g.down = 30
          else {
            g.k = g.home
            g.booting = BUG_BOOT
          }
        }
        continue
      }
      if (g.booting > 0) {
        g.booting--
        continue
      }
      if (g.kind !== 'bug' || --g.timer > 0) continue
      g.timer = this.component.bugStep - Math.min(5, this.lap * 2)
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
          if (this.boss && bossCell(this.boss) === k) return 'wall'
          if (k === head) return 'head'
          return this.body.includes(k) ? 'body' : 'open'
        },
        this.rng,
      )
      if (!way) continue
      const next = step(g.k, way)
      if (next === head) {
        g.k = next
        this.unplug('STATIC SHOCK!')
        return
      }
      if (this.body.includes(next)) {
        // It bounces off the cable's body.
        g.dx = -way.dx || 0
        g.dy = -way.dy || 0
        continue
      }
      g.k = next
      g.dx = way.dx
      g.dy = way.dy
    }
  }

  private updateBossBoard() {
    const boss = this.boss!
    updateBoss(boss, {
      cable: (k) =>
        k === this.body[0] ? 'head' : this.body.includes(k) ? 'body' : null,
      bite: () => this.unplug('BONKED BY THE BOSS'),
      shuffleSockets: () => this.shuffleSockets(),
    })
    // The fuse box keeps a few sparks about, so there is always cable to lay.
    if (this.sparks.size < BOSS_SPARKS && ++this.bossSparkTimer >= 80) {
      this.bossSparkTimer = 0
      const free = this.maze.floor.filter(
        (k) =>
          !this.sparks.has(k) &&
          !this.body.includes(k) &&
          !this.sockets.some((s) => s.k === k) &&
          !this.ring.includes(k) &&
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
        {
          count: 12,
          speed: 2.4,
        },
      )
    this.sound.play('level')
    this.clear = CLEAR_TICKS + 40
    this.banner = {
      text: 'REBOOTED!',
      sub: `${this.component.boss.name} IS FIXED`,
      ticks: CLEAR_TICKS + 40,
    }
  }

  // --- the Screensaver ------------------------------------------------------------------------

  private updateSaver() {
    const s = this.saver!
    if (--s.ticks <= 0) {
      this.endSaver(true)
      return
    }
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
  }

  private catchStars() {
    const s = this.saver
    if (!s) return
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

  /** The Screensaver ends: on time, or early if the cable bites itself (no cable lost). */
  private endSaver(onTime: boolean) {
    const s = this.saver!
    const perfect = onTime && s.caught === s.total && s.total > 0
    if (perfect) this.addScore(SAVER_PERFECT * this.mult, W / 2, H / 2, true)
    this.sound.play(onTime ? 'level' : 'pop')
    this.clear = CLEAR_TICKS
    this.banner = {
      text: onTime ? 'SCREEN WAKES!' : 'TANGLED: WAKING UP',
      sub: perfect
        ? `EVERY STAR! +${SAVER_PERFECT * this.mult}`
        : `${s.caught} OF ${s.total} STARS CAUGHT`,
      ticks: CLEAR_TICKS,
    }
    s.stars = []
  }

  // --- clears and losses ----------------------------------------------------------------------

  private mazeClear() {
    const bonus = Math.ceil(this.battery / 60) * BATTERY_POINTS * this.mult
    this.addScore(bonus, W / 2, H / 2, true)
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
      this.lives++
      this.sound.play('extra')
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
   * sweep plenty (or a glitch or the boss lies along the cable), it heads for the socket.
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
    for (const g of this.glitches) {
      if (g.gone || g.down > 0) continue
      out.add(g.k)
      if (g.kind !== 'bug') continue
      // A static bug's reach along the corridors.
      let ring = [g.k]
      for (let r = 0; r < bugReach; r++) {
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
    if (this.boss && this.boss.hp > 0) {
      const b = this.boss
      const n = b.ring.length
      const reach = b.charging || b.tell ? 10 : 2
      for (let i = -1; i <= reach; i++)
        out.add(b.ring[(((b.at + b.dir * i) % n) + n) % n]!)
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
      const bunnies = new Set(
        this.glitches
          .filter((g) => g.kind === 'bunny' && glitchLive(g))
          .map((g) => g.k),
      )
      const open = new Set([...blocked].filter((k) => !bunnies.has(k)))
      return this.nearest(pool, bunnies, open) ?? fallback
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
        if (n < 0 || seen.has(n) || blocked.has(n) || this.isWall(n)) continue
        seen.add(n)
        stack.push(n)
      }
    }
    return false
  }

  private pilotTargets(): Set<number> {
    if (this.saver) {
      const out = new Set<number>()
      for (const s of this.saver.stars) {
        out.add(s.k)
        const left = step(s.k, LEFT)
        if (left >= 0 && !this.isWall(left)) out.add(left)
      }
      return out.size ? out : new Set([cellKey(COLS >> 1, ROWS >> 1)])
    }
    const ready = this.sockets.filter(
      (s) => s.charge === 0 && !this.body.includes(s.k),
    )
    const sweep = new Set(surgeSweep(this.body, this.maze.walls))
    let value = 0
    for (const k of sweep) if (this.sparks.has(k)) value++
    const glitchNear = this.glitches.some(
      (g) => glitchLive(g) && sweep.has(g.k),
    )
    const bossNear =
      !!this.boss && sweep.has(bossCell(this.boss)) && this.boss.invuln === 0
    const lowBattery = this.battery < this.batteryMax * 0.3
    const enough = value >= Math.max(5, Math.min(12, this.sparks.size >> 2))
    if (ready.length && (enough || glitchNear || bossNear || lowBattery))
      return new Set(ready.map((s) => s.k))
    if (this.boss && this.body.length >= 16) {
      // Lay the cable across the beetle's path, a little ahead of it.
      const b = this.boss
      const n = b.ring.length
      const out = new Set<number>()
      for (let i = 5; i <= 9; i++)
        out.add(b.ring[(((b.at + b.dir * i) % n) + n) % n]!)
      return out
    }
    const out = new Set(this.sparks)
    if (this.byte?.shown) out.add(this.byte.k)
    if (out.size === 0) for (const s of ready) out.add(s.k)
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
    for (let d = 1; frontier.length && d < 90; d++) {
      const next: number[] = []
      for (const k of frontier)
        for (const dir of DIRS) {
          const n = step(k, dir)
          if (n < 0 || seen.has(n) || blocked.has(n) || this.isWall(n)) continue
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
        if (n < 0 || seen.has(n) || blocked.has(n) || this.isWall(n)) continue
        seen.add(n)
        stack.push(n)
      }
    }
    return seen.size
  }

  // --- render ---------------------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    this.renderChassis(g)
    if (!this.boardArt || this.boardArt.maze !== this.maze) {
      const canvas = boardCanvas()
      const board = canvas?.getContext('2d')
      if (canvas && board)
        paintBoard(board, this.maze.walls, this.component.look)
      this.boardArt = { maze: this.maze, canvas: board ? canvas : null }
    }
    g.save()
    g.translate(BX, BY)
    if (this.boardArt.canvas) {
      g.save()
      g.imageSmoothingEnabled = false
      g.drawImage(this.boardArt.canvas, 0, 0)
      g.restore()
    } else {
      paintBoard(g, this.maze.walls, this.component.look)
    }
    if (this.saver) this.renderStarfield(g)
    this.renderSockets(g)
    if (this.body.length < this.startLen + 2)
      drawSprite(g, REEL_SPRITE, px(this.maze.start), py(this.maze.start))
    this.renderSparks(g)
    if (this.byte?.shown) this.renderByte(g, this.byte.k)
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
        {
          align: 'center',
          color: RAMPS.gold[4],
          outline: INK,
        },
      )
    g.restore()
    vignette(g, W, H, 0.3)
    this.renderHud(g)
    if (this.banner && this.cardTicks === 0 && !this.offer) this.renderBanner(g)
    if (this.cardTicks > 0 && !this.offer) this.renderCard(g)
    if (this.offer) this.renderOffer(g, this.offer)
  }

  /** The Mainframe's chassis round the board: a steel case with vents and a power lamp. */
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
      this.boss && bossPhase(this.boss) >= 2 && this.boss.shuffle < SHUFFLE_TELL
    for (const s of this.sockets) {
      const x = px(s.k)
      const y = py(s.k)
      if (shuffling && Math.floor(this.tick / 4) % 2) continue
      if (s.charge === 0)
        glow(g, x, y, 9 + Math.sin(this.tick / 8) * 2, RAMPS.teal[3], 0.5)
      drawSprite(g, SOCKET_SPRITE, x, y, { alpha: s.charge > 0 ? 0.6 : 1 })
      if (s.charge > 0) {
        // The recharge ring fills round the plate.
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
    const stamp = glowStamp(RAMPS.gold[3], 3, 0.45)
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
      } else {
        const near =
          Math.abs(cellX(gl.k) - cellX(head)) +
            Math.abs(cellY(gl.k) - cellY(head)) <=
          CRACKLE_RANGE
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
        drawSprite(g, BUG_SPRITES[(this.tick >> 3) % 2]!, x, y, {
          flipX: gl.dx < 0,
        })
      }
    }
  }

  private renderBoss(g: CanvasRenderingContext2D, b: Boss) {
    if (b.hp <= 0 && this.clear % 6 < 3) return
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
    if (b.stun > 0) {
      for (let i = 0; i < 3; i++) {
        const a = this.tick / 8 + (i * Math.PI * 2) / 3
        g.fillStyle = RAMPS.gold[4]
        g.fillRect(
          Math.round(x + Math.cos(a) * 7),
          Math.round(y - 10 + Math.sin(a) * 2),
          2,
          2,
        )
      }
    }
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
   * outline, insulation lit along its top and left, an energy pulse lighting the core as it runs
   * from tail to plug (the whole length glows gold in a surge), pink cable ties every few cells,
   * and the plug head sprite for its facing.
   */
  private renderCable(g: CanvasRenderingContext2D) {
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
      surging ? RAMPS.gold[3] : RAMPS.sky[3],
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
    const tube = surging ? TUBE_SURGE : TUBE_LIT
    const shade = (vertical: boolean) => {
      for (let i = 0; i < n; i++) {
        const a = pts[i]!
        const b = pts[Math.min(n - 1, i + 1)]!
        if ((a.x === b.x) !== vertical) continue
        const rows = lit(i) ? tube : TUBE
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
      const side = prev.y === p.y ? prev : next
      const end = prev.x === p.x ? prev : next
      const elbows = surging
        ? ELBOWS_SURGE
        : lit(i) || lit(i - 1)
          ? ELBOWS_LIT
          : ELBOWS
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
      this.dead === 0 && this.stepTimer < this.stepTicks() / 2 ? 1 : 0
    const sprite = PLUG[facing][chomp]
    const left =
      facing === 'side' && d.dx < 0 ? head.x + 5 - sprite.width : head.x - 5
    const top = facing === 'up' ? head.y + 5 - sprite.height : head.y - 5
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
    const frac = this.saver
      ? 1
      : this.batteryMax
        ? this.battery / this.batteryMax
        : 0
    const ramp = this.saver
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
      {
        align: 'center',
        color: c.look.accent[4],
        outline: INK,
      },
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
    drawText(g, `GOLDEN BYTES ${found}/${c.mazes.length}`, W / 2, y + 66, {
      align: 'center',
      color: RAMPS.gold[3],
      outline: INK,
    })
    // A power bar fills as the component boots.
    const frac = Math.min(1, t / (CARD_TICKS - 30))
    gauge(g, 40, y + 80, W - 80, 6, frac, RAMPS.teal)
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
      `COMPONENT ${c.component.number}${c.lap ? ` LAP ${c.lap + 1}` : ''}`,
      W / 2,
      90,
      {
        align: 'center',
        color: '#ffffff',
        outline: INK,
      },
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
      {
        align: 'center',
        color: RAMPS.teal[3],
        outline: INK,
      },
    )
    drawText(g, `GOLDEN BYTES ${o.bytes.length}`, W / 2, 134, {
      align: 'center',
      color: RAMPS.gold[4],
      outline: INK,
    })
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
