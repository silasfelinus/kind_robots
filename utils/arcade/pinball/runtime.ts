// /utils/arcade/pinball/runtime.ts
//
// The pinball runtime (conductor kind-pinball/t-004): the one object the
// arcade cabinet talks to. It wires input -> physics -> rules -> effects ->
// renderer/audio, and implements the cabinet's ArcadeWebGLGameInstance:
// mount, resize, update, render, dispose. Each layer stays behind its own
// module; nothing here reaches into another layer's internals.
//
// Fixed 60 Hz arcade ticks run two 1/120 s physics steps each.

import { attractLeds, prefersReducedMotion } from './rules/leds'
import type {
  ArcadeGameOptions,
  ArcadeWebGLGameInstance,
  InputFrame,
} from '../types'
import { PinballMixer } from './audio/mixer'
import { Dmd } from './dmd'
import { DmdQueue, type DmdRequest } from './dmdQueue'
import { drawDmd } from './dmdScenes'
import {
  PinballPhysics,
  PHYSICS_HZ,
  type BallView,
  type RapierModule,
} from './physics/world'
import {
  PinballScene,
  createWebGLRenderer,
  type RenderStats,
  type RendererFactory,
} from './render/scene'
import type { QualityTier } from './render/quality'
import type { PinballRulesState, RulesEvent } from './rules/engine'
import {
  AMI_RULESET,
  type CoreRulesState,
  type PinballRuleset,
} from './rules/ruleset'
import { partsComplete } from '../mastery'
import type { PinballMusicBed } from './audio/catalog'
import {
  applyShows,
  attractShow,
  liveShows,
  type LightShow,
} from './rules/lightShows'
import type { CameraPresetId, RuleEffect, TableDef } from './types'

const STEPS_PER_TICK = PHYSICS_HZ / 60
/** Ms of DMD time per arcade tick. */
const TICK_MS = 1000 / 60
/** Ticks to hold Down for a full plunger pull. */
const PULL_TICKS = 45
/**
 * The ball search (kind-pinball t-035). A ball that has not left a spot this
 * size (m) for this long, off the plunger, is stuck: sitting still, or
 * rattling in a pocket it cannot get out of.
 */
const TRAP_RADIUS = 0.02
const STILL_TICKS = 60 * 4
/** Ticks between searches while the same ball stays stuck. */
const SEARCH_GAP_TICKS = 60 * 3
/** Searches, each harder than the last, before the ball is rescued. */
const SEARCHES = 3
/** How far past a held flipper's length a resting ball counts as cradled. */
const CRADLE_REACH = 0.03
/** How often the attract pilot makes a save it goes for. */
const PILOT_SKILL = 0.8
/** Multiball and ball-save balls: ticks between them, and on the plunger before launch. */
const ADD_BALL_GAP = 90
const AUTO_LAUNCH_TICKS = 30
/** The skill shot's lit arrow flashes this often. */
const SKILL_PULSE_TICKS = 24

/**
 * The view the balls call for (t-026): the one from the flippers, unless
 * every ball on the table is in a bonus area (the hidden room, the Ridge),
 * so a ball on the main field is never off screen.
 */
export function cameraViewFor(balls: BallView[]): CameraPresetId {
  if (!balls.length) return 'main'
  if (balls.every((b) => b.zone === 'sub-table')) return 'sub-table'
  if (balls.every((b) => b.zone === 'ridge')) return 'upper-playfield'
  return 'main'
}

/**
 * The camera sweeps (zuzu-pinball/t-012), on a table with the presets for
 * them: over the shooter lane while the only ball waits on the plunger,
 * pulled back over the whole field while more than one ball is in play.
 * Each frames the whole playfield, so the flippers are never off screen. A
 * bonus area's view always wins, and a still camera never sweeps.
 */
export function sweepViewFor(
  balls: BallView[],
  onPlunger: boolean,
  cameras: ReadonlyArray<{ id: CameraPresetId }>,
  still: boolean,
): CameraPresetId {
  const need = cameraViewFor(balls)
  if (need !== 'main' || still) return need
  const has = (id: CameraPresetId) => cameras.some((c) => c.id === id)
  if (balls.length > 1 && has('multiball')) return 'multiball'
  if (balls.length === 1 && onPlunger && has('plunge')) return 'plunge'
  return 'main'
}

/** Views a sweep moves between; the camera holds each a while. */
const SWEEPS: ReadonlySet<CameraPresetId> = new Set([
  'main',
  'plunge',
  'multiball',
])
/** Ticks a sweep must be wanted in a row before the camera goes (no flapping). */
export const SWEEP_HOLD_TICKS = 45

/** A sling kicker's switch: its rubber flexes when it fires. */
const SLING_KICKER = /^sling-.+-kicker$/

export class PinballRuntime<
  S extends CoreRulesState = PinballRulesState,
> implements ArcadeWebGLGameInstance {
  readonly renderMode = 'webgl' as const
  readonly level = 1

  private physics: PinballPhysics
  /** The player's camera view (b / the VIEW chip cycles it) and its follower. */
  private rules: S
  /** The table's rules: AMI Village Rescue's unless the table brings its own. */
  private ruleset: PinballRuleset<S>
  private scene: PinballScene | null = null
  private mixer: PinballMixer
  private rng: () => number
  /** The attract pilot is tracking a ball coming down at the flippers. */
  private pilotApproach = false
  /** ...and has decided to miss this one. */
  private pilotMisses = false
  private demo: boolean
  /** Reduced motion: the LED rail holds its colours (rules/leds.ts). */
  private reducedMotion = prefersReducedMotion()
  /** The player's still camera (t-012): no sweeps, cuts for pans. */
  private stillCamera: boolean
  /** The view the camera is on, and ticks another has been wanted. */
  private shownView: CameraPresetId = 'main'
  private wantFor = 0
  private factory: RendererFactory
  private pull = 0
  private nudgeCooldown = 0
  /** Balls the rules asked for that are not on the table yet. */
  private ballsToAdd = 0
  private addGap = 0
  /** Ticks until the plunger fires a ball it served itself; 0 when none waits. */
  private autoLaunch = 0
  /** The music bed playing (rules/subTable.ts musicFor). */
  private bed: PinballMusicBed | null = null
  /**
   * For the ball search, each ball (by id): where it was last seen moving
   * from, ticks since, and the searches it has had there.
   */
  private still = new Map<
    number,
    { x: number; z: number; ticks: number; searches: number }
  >()
  private tick = 0
  /** Physics steps taken, the clock the shot recognizer times windows by. */
  private steps = 0
  private size = { width: 0, height: 0, dpr: 1 }
  /** Light shows playing over the lamp matrix. */
  private shows: LightShow[] = []
  /** The backbox DMD: its scene queue and the 128x32 frame it draws. */
  readonly dmdQueue = new DmdQueue()
  readonly dmd = new Dmd()
  private hiScore: number
  /** Mastery goals this player had earned before this game. */
  private earnedBefore: Set<string>
  /** ...and the goals earned this game, in the order they came. */
  private earnedNow: string[] = []
  private disposed = false

  constructor(
    options: ArcadeGameOptions,
    R: RapierModule,
    table: TableDef,
    factory: RendererFactory = createWebGLRenderer,
    ruleset: PinballRuleset<S> = AMI_RULESET as unknown as PinballRuleset<S>,
  ) {
    this.rng = options.rng
    this.demo = options.demo
    this.stillCamera = options.stillCamera ?? false
    this.factory = factory
    this.hiScore = options.hiScore
    this.earnedBefore = new Set(options.mastery ?? [])
    this.mixer = new PinballMixer(options.sound)
    this.physics = new PinballPhysics(R, table)
    this.ruleset = ruleset
    this.rules = ruleset.initial(
      table.balls,
      Math.floor(this.rng() * 0x100000000),
    )
    this.apply({ type: 'start' })
  }

  /** The attract demo plays the rules but never scores. */
  get score() {
    return this.demo ? 0 : this.rules.score
  }

  get lives() {
    return this.rules.lives
  }

  get over() {
    return this.rules.over
  }

  /** Mastery goals earned this game (none in the attract demo). */
  get mastered(): readonly string[] {
    return this.earnedNow
  }

  get isDisposed() {
    return this.disposed
  }

  unlockAudio() {
    if (!this.demo) this.mixer.unlock()
  }

  mount(canvas: HTMLCanvasElement) {
    if (this.disposed || this.scene) return
    this.scene = new PinballScene(this.physics.table, canvas, this.factory)
    this.scene.setStill(this.stillCamera)
    if (this.size.width > 0) {
      this.scene.resize(this.size.width, this.size.height, this.size.dpr)
    }
  }

  resize(width: number, height: number, dpr: number) {
    this.size = { width, height, dpr }
    this.scene?.resize(width, height, dpr)
  }

  update(input: InputFrame) {
    if (this.disposed || this.rules.over) return
    this.tick++
    this.mixer.syncMute()
    if (!this.demo && Object.values(input.pressed).some(Boolean)) {
      this.mixer.unlock()
    }
    const controls = this.demo ? this.pilot() : input
    // Never couple both coils to the face/launch button. Only the
    // corresponding shoulder/trigger, direction, or keyboard side fires.
    const live = !this.rules.tilted
    const left = live && controls.held.left
    const right = live && controls.held.right
    if ((controls.pressed.left || controls.pressed.right) && !this.demo) {
      this.mixer.play('flipper')
    }
    // Upper flippers (Zuzu's Abbey deck, t-006) follow the lower buttons;
    // holding B (Shift) flips the upper pair alone.
    const upperOnly = controls.held.b && this.physics.hasUpperFlippers
    this.physics.setFlipper('left', left && !upperOnly, 'lower')
    this.physics.setFlipper('right', right && !upperOnly, 'lower')
    this.physics.setFlipper('left', left, 'upper')
    this.physics.setFlipper('right', right, 'upper')
    this.plunger(controls)
    this.addBalls()
    if (this.nudgeCooldown > 0) this.nudgeCooldown--
    if (controls.pressed.up && this.nudgeCooldown === 0) {
      this.physics.nudge((this.rng() - 0.5) * 0.12, -0.12)
      this.nudgeCooldown = 45
      this.mixer.play('nudge')
      this.apply({ type: 'nudge', tick: this.steps })
    }
    for (let i = 0; i < STEPS_PER_TICK; i++) {
      this.steps++
      for (const event of this.physics.step())
        this.apply({ type: 'switch', event, tick: this.steps })
    }
    this.apply({ type: 'tick', tick: this.steps })
    this.unstick({ left, right })
    this.playMusicBed()
    this.scene?.setView(this.heldView())
    this.lamps()
    this.dmdQueue.tick(TICK_MS)
    this.drawDmd()
  }

  /** Draw the DMD's current scene (or the score, or attract pages). */
  private drawDmd() {
    drawDmd(
      this.dmd,
      this.demo ? null : this.dmdQueue.showing,
      {
        score: this.rules.score,
        ball: this.rules.ball,
        multiplier: this.rules.bonusMultiplier,
        attract: this.demo,
        highScore: this.hiScore,
        pages: this.physics.table.attract,
      },
      this.dmdQueue.now,
    )
  }

  /**
   * Play the music the rules call for; a bed that could not start yet is
   * retried. Not named `music`: the cabinet reads a game's `music` property
   * as its MusicLoop (2026-10-11: a method by that name froze the table).
   */
  private playMusicBed() {
    const bed = this.demo ? null : this.ruleset.music(this.rules)
    if (bed === this.bed) return
    if (!bed) {
      this.mixer.stopMusic()
      this.bed = null
    } else if (this.mixer.startMusic(bed)) {
      this.bed = bed
    }
  }

  /** Light the table from the rules, or run the attract show in a demo. */
  private lamps() {
    if (!this.scene) return
    const table = this.physics.table
    this.shows = liveShows(this.shows, this.tick)
    const frame = this.demo
      ? attractShow(table, this.tick)
      : applyShows(
          this.ruleset.lamps(this.rules, table),
          this.shows,
          table,
          this.tick,
        )
    this.scene.setLamps(frame.lamps, frame.gi)
    const rail = table.ledRail
    if (rail && this.ruleset.leds)
      this.scene.setLeds(
        this.demo
          ? attractLeds(rail.count, this.steps, this.reducedMotion)
          : this.ruleset.leds(
              this.rules,
              this.steps,
              rail.count,
              this.reducedMotion,
            ),
      )
    const poses = this.ruleset.animatronics?.(this.rules, this.steps)
    if (poses) this.scene.setAnimatronics(poses)
    // The skill shot's arrow flashes until the first shot after the plunge.
    const skill = this.ruleset.skillTarget(this.rules)
    if (!this.demo && skill && this.tick % SKILL_PULSE_TICKS === 0)
      this.scene.pulse(skill)
  }

  /** Pin the renderer's quality tier (screenshots, tests); null measures again. */
  forceQuality(tier: QualityTier | null) {
    this.scene?.forceQuality(tier)
  }

  /** The renderer's frame timing, tier and draw cost. */
  renderStats(): RenderStats | null {
    return this.scene?.stats() ?? null
  }

  /** The camera preset the balls on the table call for right now. */
  view(): CameraPresetId {
    return sweepViewFor(
      this.physics.ballViews(),
      this.physics.ballOnPlunger(),
      this.physics.table.cameras,
      this.stillCamera,
    )
  }

  /**
   * The view to show this tick: a bonus area's at once, but a sweep only
   * once it has been wanted SWEEP_HOLD_TICKS in a row, so a ball drained
   * and re-served in a multiball doesn't swing the camera.
   */
  private heldView(): CameraPresetId {
    const want = this.view()
    if (want === this.shownView) {
      this.wantFor = 0
      return want
    }
    this.wantFor++
    const sweep = SWEEPS.has(want) && SWEEPS.has(this.shownView)
    if (!sweep || this.stillCamera || this.wantFor >= SWEEP_HOLD_TICKS) {
      this.shownView = want
      this.wantFor = 0
    }
    return this.shownView
  }

  /** The player changed the still-camera choice mid-game. */
  setStillCamera(still: boolean) {
    this.stillCamera = still
    this.scene?.setStill(still)
  }

  /**
   * Put the balls the rules asked for (multiball, a ball save) on the
   * plunger one at a time, and fire each one up the lane as a real machine's
   * auto-plunger does.
   */
  private addBalls() {
    if (this.addGap > 0) this.addGap--
    if (this.autoLaunch > 0) {
      this.autoLaunch--
      if (this.autoLaunch === 0 && this.physics.launch(1))
        this.mixer.play('launch')
      return
    }
    if (this.ballsToAdd <= 0 || this.addGap > 0) return
    if (this.physics.ballOnPlunger()) return
    this.physics.serveBall()
    this.ballsToAdd--
    this.autoLaunch = AUTO_LAUNCH_TICKS
    this.addGap = ADD_BALL_GAP
  }

  private plunger(controls: InputFrame) {
    if (this.autoLaunch > 0) return
    if (!this.physics.ballOnPlunger()) {
      this.pull = 0
      return
    }
    // A finger dragging the plunger sets the pull directly (t-010 touch);
    // letting go fires it as releasing the key does.
    if (controls.plunger !== undefined) {
      const depth = Math.min(1, Math.max(0, controls.plunger))
      this.pull = Math.round(depth * PULL_TICKS)
      return
    }
    if (controls.held.down) {
      this.pull = Math.min(PULL_TICKS, this.pull + 1)
      return
    }
    const released = this.pull > 0
    if (released || controls.pressed.a) {
      const power = released ? this.pull / PULL_TICKS : 0.85
      if (this.physics.launch(power)) this.mixer.play('launch')
      this.pull = 0
    }
  }

  /**
   * Ball search: a ball that has not left one spot for a while (sitting
   * still, or rattling in a pocket) gets a coil pulse, as a real machine
   * pulses its coils, and then harder ones from alternate sides. A ball
   * still there after the last search is rescued: set back on the plunger
   * and fired, never lost, so no game can hang on a stuck ball. Each ball is
   * watched on its own, so one moving ball cannot hide another that is
   * stuck. A ball on the plunger, in a scoop, or cradled on a held flipper is
   * not stuck; a held flipper only vouches for a ball within its reach, so a
   * player (or the attract pilot) flipping cannot hide a ball stuck
   * elsewhere.
   */
  private unstick(held: { left: boolean; right: boolean }) {
    const balls = this.physics.ballViews()
    const plunger = this.physics.table.plunger.rest
    const flippers = this.physics.table.flippers.filter((f) => held[f.side])
    for (const ball of balls) {
      const [x, , z] = ball.position
      const onPlunger =
        Math.abs(x - plunger[0]) < 0.012 && Math.abs(z - plunger[2]) < 0.03
      const cradled = flippers.some(
        (f) =>
          Math.hypot(x - f.pivot[0], z - f.pivot[2]) < f.length + CRADLE_REACH,
      )
      const seen = this.still.get(ball.id)
      if (
        !seen ||
        ball.captured ||
        onPlunger ||
        cradled ||
        Math.hypot(x - seen.x, z - seen.z) > TRAP_RADIUS
      ) {
        this.still.set(ball.id, { x, z, ticks: 0, searches: 0 })
        continue
      }
      seen.ticks++
      const due = seen.searches === 0 ? STILL_TICKS : SEARCH_GAP_TICKS
      if (seen.ticks < due) continue
      seen.ticks = 0
      if (seen.searches < SEARCHES) {
        // Up the table, and across from alternate sides, harder each time.
        const k = seen.searches++
        const side = k % 2 ? 1 : -1
        const across = k === 0 ? (this.rng() - 0.5) * 0.2 : side * 0.15 * k
        this.physics.nudge(
          across,
          -0.25 - 0.2 * k,
          k === 0 ? undefined : ball.id,
        )
        continue
      }
      // The plunger is busy: try again next tick.
      if (this.autoLaunch > 0 || !this.physics.rescueBall(ball.id)) {
        seen.ticks = due
        continue
      }
      this.still.delete(ball.id)
      this.autoLaunch = AUTO_LAUNCH_TICKS
      this.effect({ type: 'dmd', text: 'BALL RESCUED', ms: 1500 })
    }
    for (const id of this.still.keys()) {
      if (!balls.some((b) => b.id === id)) this.still.delete(id)
    }
  }

  private apply(event: RulesEvent) {
    const { state, effects } = this.ruleset.step(this.rules, event, {
      shots: this.physics.table.shots,
    })
    // A made shot flashes its arrow and fires its flasher.
    for (const [shot, made] of Object.entries(state.shotsMade)) {
      if (made > (this.rules.shotsMade[shot] ?? 0)) this.scene?.pulse(shot)
    }
    this.shows.push(...this.ruleset.shows(this.rules, state, this.tick))
    this.toys(event, state, effects)
    const mastery = this.ruleset.mastery
    const goals =
      this.demo || !mastery ? [] : mastery.met(this.rules, state, effects)
    this.rules = state
    for (const effect of effects) this.effect(effect)
    for (const goal of goals) this.master(goal)
  }

  /**
   * The signature toys follow the rules (rules/toys.ts); the moments are
   * events: the drone's delivery, a jackpot's sparks over the shot that
   * scored it (or the beacon, for the lock's super jackpot), and a sling
   * rubber's flex when its kicker fires.
   */
  private toys(event: RulesEvent, state: S, effects: RuleEffect[]) {
    const scene = this.scene
    if (!scene) return
    const toys = this.ruleset.toys
    if (toys) {
      scene.setToys(toys.pose(state))
      if (toys.delivered(this.rules, state)) scene.deliver()
    }
    if (
      event.type === 'switch' &&
      event.event.type === 'contact' &&
      SLING_KICKER.test(event.event.id)
    )
      scene.kick(event.event.id)
    const jackpot = effects.some(
      (e) =>
        e.type === 'dmd' &&
        (e.scene === 'jackpot' || e.scene === 'super-jackpot'),
    )
    if (!jackpot) return
    const made = Object.entries(state.shotsMade)
      .filter(([shot, n]) => n > (this.rules.shotsMade[shot] ?? 0))
      .map(([shot]) => shot)
    for (const shot of made.length ? made : ['beacon'])
      scene.burst(shot === 'lock' ? 'beacon' : shot)
  }

  /**
   * A goal (or a part of one) met: kept for the store, and announced if it is
   * new to the player. The part that completes a goal earns the goal too.
   */
  private master(goal: string) {
    const mastery = this.ruleset.mastery
    if (!mastery || this.earnedNow.includes(goal)) return
    this.earnedNow.push(goal)
    if (this.earnedBefore.has(goal)) return
    const earned = new Set([...this.earnedBefore, ...this.earnedNow])
    const rungs = mastery.goals.filter((g) => earned.has(g.id)).length
    for (const effect of mastery.effects(goal, rungs)) this.effect(effect)
    for (const done of partsComplete(mastery.goals, earned)) this.master(done)
  }

  private effect(effect: RuleEffect) {
    switch (effect.type) {
      case 'serve-ball':
        this.physics.serveBall()
        break
      case 'add-ball':
        this.ballsToAdd += effect.count
        break
      case 'sound':
        if (!this.demo) this.mixer.play(effect.name)
        break
      case 'dmd': {
        const request: DmdRequest = {
          scene: effect.scene ?? 'message',
          text: effect.text,
          sub: effect.sub,
          value: effect.value,
          items: effect.items,
        }
        // A plain message keeps the length the rules asked for; named
        // scenes run their own timing.
        if (!effect.scene) request.ms = effect.ms
        this.dmdQueue.push(request)
        break
      }
      case 'dmd-clear':
        this.dmdQueue.clear(effect.scene)
        break
      case 'mechanism':
        if (effect.action === 'flash') this.scene?.pulse(effect.id)
        if (effect.action === 'reset') this.physics.resetDropBank(effect.id)
        if (effect.action === 'fire') this.physics.fireKicker(effect.id)
        if (effect.action === 'open') this.physics.setDoor(effect.id, true)
        if (effect.action === 'close') this.physics.setDoor(effect.id, false)
        if (effect.action === 'lock') this.physics.lockHeld(effect.id)
        if (effect.action === 'release') this.physics.releaseLocked(effect.id)
        if (effect.action === 'subway' && typeof effect.payload === 'string')
          this.physics.subwayHeld(effect.id, effect.payload)
        break
      default:
        break
    }
  }

  /** Attract-mode pilot: plunge, then flip when a ball comes down near a flipper. */
  private pilot(): InputFrame {
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
    if (this.physics.ballOnPlunger()) {
      frame.pressed.a = this.tick % 50 === 0
      return frame
    }
    // Flip only at a ball coming down toward the flippers; a ball at rest
    // gets the flippers dropped so it rolls on rather than being cradled forever.
    // The pilot misses now and then, as a player does, so the demo drains
    // its balls and the attract cycle comes round again.
    let approaching = false
    for (const ball of this.physics.ballViews()) {
      const [x, , z] = ball.position
      const coming = ball.velocity[2] > 0.08
      // The room's and the Ridge's flippers sit on the same buttons; each
      // ball is played on its own zone's pair.
      const pair = this.physics.table.flippers.filter(
        (f) => f.zone === ball.zone,
      )
      if (!pair.length) continue
      const pivotZ = pair.reduce((a, f) => a + f.pivot[2], 0) / pair.length
      const mid = pair.reduce((a, f) => a + f.pivot[0], 0) / pair.length
      const near = z > pivotZ - 0.04 && z < pivotZ + 0.04
      if (coming && near) {
        approaching = true
        if (!this.pilotApproach) {
          this.pilotApproach = true
          this.pilotMisses = this.rng() > PILOT_SKILL
        }
        if (this.pilotMisses) continue
        if (x < mid + 0.005) held.left = true
        if (x > mid - 0.005) held.right = true
      }
    }
    if (!approaching) this.pilotApproach = false
    return frame
  }

  render() {
    if (this.disposed || !this.scene) return
    const balls = [...this.physics.ballViews(), ...this.physics.captiveViews()]
    this.scene.sync(balls, this.physics.flipperAngles(), {
      drops: this.physics.dropStates(),
      spinners: this.physics.spinnerAngles(),
      doors: this.physics.doorStates(),
      toys: this.physics.toyAngles(),
    })
    this.scene.setDmd(this.dmd.buf)
    this.scene.render()
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    this.scene?.dispose()
    this.scene = null
    this.physics.dispose()
    this.mixer.dispose()
  }
}
