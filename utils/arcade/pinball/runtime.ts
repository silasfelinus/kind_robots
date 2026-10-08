// /utils/arcade/pinball/runtime.ts
//
// The pinball runtime (conductor kind-pinball/t-004): the one object the
// arcade cabinet talks to. It wires input -> physics -> rules -> effects ->
// renderer/audio, and implements the cabinet's ArcadeWebGLGameInstance:
// mount, resize, update, render, dispose. Each layer stays behind its own
// module; nothing here reaches into another layer's internals.
//
// Fixed 60 Hz arcade ticks run two 1/120 s physics steps each.

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
import {
  initialRules,
  stepRules,
  type PinballRulesState,
  type RulesEvent,
} from './rules/engine'
import { lampStates } from './rules/lamps'
import { goalsMet, MASTERY_GOALS, masteryEffects } from './rules/mastery'
import { partsComplete } from '../mastery'
import { musicFor } from './rules/subTable'
import { delivered, toyPose } from './rules/toys'
import type { PinballMusicBed } from './audio/catalog'
import {
  applyShows,
  attractShow,
  liveShows,
  showTriggers,
  type LightShow,
} from './rules/lightShows'
import type { CameraPresetId, RuleEffect, TableDef } from './types'

const STEPS_PER_TICK = PHYSICS_HZ / 60
/** Ms of DMD time per arcade tick. */
const TICK_MS = 1000 / 60
/** Ticks to hold Down for a full plunger pull. */
const PULL_TICKS = 45
/** A ball this slow for this long, off the plunger, gets a small shove. */
const STILL_SPEED = 0.01
const STILL_TICKS = 60 * 4
/** How far past a held flipper's length a resting ball counts as cradled. */
const CRADLE_REACH = 0.03
/** The sub-table's centre line, for the attract pilot. */
const ROOM_PILOT_X = 0.02
/** How often the attract pilot makes a save it goes for. */
const PILOT_SKILL = 0.8
/** Multiball and ball-save balls: ticks between them, and on the plunger before launch. */
const ADD_BALL_GAP = 90
const AUTO_LAUNCH_TICKS = 30
/** The skill shot's lit arrow flashes this often. */
const SKILL_PULSE_TICKS = 24

/**
 * The camera preset the balls call for: the sub-table's only while every
 * ball on the table is in there, so a ball on the main table is never off
 * screen.
 */
export function cameraViewFor(balls: BallView[]): CameraPresetId {
  return balls.length > 0 && balls.every((b) => b.zone === 'sub-table')
    ? 'sub-table'
    : 'main'
}

/**
 * The camera preset for the moment (t-010): the room's while every ball is
 * in it; a higher eye through multiball and the wizard mode, so every ball
 * stays in view; a lean toward the shooter lane while a lone ball waits on
 * the plunger; the main view otherwise. All but the room's frame the whole
 * field, and the scene eases between them.
 */
export function cameraPresetFor(
  view: CameraPresetId,
  rules: PinballRulesState,
  onPlunger: boolean,
): CameraPresetId {
  if (view === 'sub-table') return view
  if (rules.play.multiball.running || rules.play.wizard.running)
    return 'multiball'
  if (onPlunger && rules.ballsInPlay <= 1) return 'plunge'
  return 'main'
}

/** A sling kicker's switch: its rubber flexes when it fires. */
const SLING_KICKER = /^sling-.+-kicker$/

export class PinballRuntime implements ArcadeWebGLGameInstance {
  readonly renderMode = 'webgl' as const
  readonly level = 1

  private physics: PinballPhysics
  private rules: PinballRulesState
  private scene: PinballScene | null = null
  private mixer: PinballMixer
  private rng: () => number
  /** The attract pilot is tracking a ball coming down at the flippers. */
  private pilotApproach = false
  /** ...and has decided to miss this one. */
  private pilotMisses = false
  private demo: boolean
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
  /** Ticks each ball (by id) has sat still, for the ball search. */
  private still = new Map<number, number>()
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
  ) {
    this.rng = options.rng
    this.demo = options.demo
    this.factory = factory
    this.hiScore = options.hiScore
    this.earnedBefore = new Set(options.mastery ?? [])
    this.mixer = new PinballMixer(options.sound)
    this.physics = new PinballPhysics(R, table)
    this.rules = initialRules(table.balls, Math.floor(this.rng() * 0x100000000))
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
    if (!this.demo && Object.values(input.pressed).some(Boolean)) {
      this.mixer.unlock()
    }
    const controls = this.demo ? this.pilot() : input
    const both = controls.held.a && !this.physics.ballOnPlunger()
    // A tilted machine's flippers are dead until the ball drains.
    const live = !this.rules.tilted
    const left = live && (controls.held.left || both)
    const right = live && (controls.held.right || both)
    if ((controls.pressed.left || controls.pressed.right) && !this.demo) {
      this.mixer.play('flipper')
    }
    this.physics.setFlipper('left', left)
    this.physics.setFlipper('right', right)
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
    this.music()
    this.scene?.setView(
      cameraPresetFor(this.view(), this.rules, this.physics.ballOnPlunger()),
    )
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
      },
      this.dmdQueue.now,
    )
  }

  /** Play the music the rules call for; a bed that could not start yet is retried. */
  private music() {
    const bed = this.demo ? null : musicFor(this.rules)
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
      : applyShows(lampStates(this.rules, table), this.shows, table, this.tick)
    this.scene.setLamps(frame.lamps, frame.gi)
    // The skill shot's arrow flashes until the first shot after the plunge.
    const skill = this.rules.play.skill
    if (!this.demo && skill.armed && this.tick % SKILL_PULSE_TICKS === 0)
      this.scene.pulse(skill.target)
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
    return cameraViewFor(this.physics.ballViews())
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
   * Ball search: a ball that has sat still somewhere odd for a while gets the
   * table shaken, as a real machine pulses its coils. Each ball is watched on
   * its own, so one moving ball cannot hide another that is stuck. A ball on
   * the plunger, in a scoop, or cradled on a held flipper is not stuck; a
   * held flipper only vouches for a ball within its reach, so a player (or
   * the attract pilot) flipping cannot hide a ball stuck elsewhere.
   */
  private unstick(held: { left: boolean; right: boolean }) {
    const balls = this.physics.ballViews()
    const plunger = this.physics.table.plunger.rest
    const flippers = this.physics.table.flippers.filter((f) => held[f.side])
    let search = false
    for (const ball of balls) {
      const onPlunger =
        Math.abs(ball.position[0] - plunger[0]) < 0.012 &&
        Math.abs(ball.position[2] - plunger[2]) < 0.03
      const cradled = flippers.some(
        (f) =>
          Math.hypot(
            ball.position[0] - f.pivot[0],
            ball.position[2] - f.pivot[2],
          ) <
          f.length + CRADLE_REACH,
      )
      if (ball.captured || onPlunger || cradled || ball.speed > STILL_SPEED) {
        this.still.set(ball.id, 0)
        continue
      }
      const ticks = (this.still.get(ball.id) ?? 0) + 1
      this.still.set(ball.id, ticks)
      if (ticks >= STILL_TICKS) {
        search = true
        this.still.set(ball.id, 0)
      }
    }
    for (const id of this.still.keys()) {
      if (!balls.some((b) => b.id === id)) this.still.delete(id)
    }
    if (search) this.physics.nudge((this.rng() - 0.5) * 0.2, -0.25)
  }

  private apply(event: RulesEvent) {
    const { state, effects } = stepRules(this.rules, event, {
      shots: this.physics.table.shots,
    })
    // A made shot flashes its arrow and fires its flasher.
    for (const [shot, made] of Object.entries(state.shotsMade)) {
      if (made > (this.rules.shotsMade[shot] ?? 0)) this.scene?.pulse(shot)
    }
    this.shows.push(...showTriggers(this.rules, state, this.tick))
    this.toys(event, state, effects)
    const goals = this.demo ? [] : goalsMet(this.rules, state, effects)
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
  private toys(
    event: RulesEvent,
    state: PinballRulesState,
    effects: RuleEffect[],
  ) {
    const scene = this.scene
    if (!scene) return
    scene.setToys(toyPose(state))
    if (delivered(this.rules, state)) scene.deliver()
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
    if (this.earnedNow.includes(goal)) return
    this.earnedNow.push(goal)
    if (this.earnedBefore.has(goal)) return
    const earned = new Set([...this.earnedBefore, ...this.earnedNow])
    const rungs = MASTERY_GOALS.filter((g) => earned.has(g.id)).length
    for (const effect of masteryEffects(goal, rungs)) this.effect(effect)
    for (const done of partsComplete(MASTERY_GOALS, earned)) this.master(done)
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
      // The sub-table's flippers sit on the same buttons, further up.
      const room = ball.zone === 'sub-table'
      const near = room ? z > -1.15 && z < -1.08 : z > -0.08 && z < 0.0
      const mid = room ? ROOM_PILOT_X : 0
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
    this.scene.sync(this.physics.ballViews(), this.physics.flipperAngles(), {
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
