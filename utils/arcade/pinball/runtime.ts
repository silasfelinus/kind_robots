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
import {
  PinballPhysics,
  PHYSICS_HZ,
  type BallView,
  type RapierModule,
} from './physics/world'
import {
  PinballScene,
  createWebGLRenderer,
  type RendererFactory,
} from './render/scene'
import {
  initialRules,
  stepRules,
  type PinballRulesState,
  type RulesEvent,
} from './rules/engine'
import type { CameraPresetId, RuleEffect, TableDef } from './types'

const STEPS_PER_TICK = PHYSICS_HZ / 60
/** Ticks to hold Down for a full plunger pull. */
const PULL_TICKS = 45
/** A ball this slow for this long, off the plunger, gets a small shove. */
const STILL_SPEED = 0.01
const STILL_TICKS = 60 * 4
/** The sub-table's centre line, for the attract pilot. */
const ROOM_PILOT_X = 0.02
/** How often the attract pilot makes a save it goes for. */
const PILOT_SKILL = 0.8

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
  private still = 0
  private tick = 0
  /** Physics steps taken, the clock the shot recognizer times windows by. */
  private steps = 0
  private size = { width: 0, height: 0, dpr: 1 }
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
    this.mixer = new PinballMixer(options.sound)
    this.physics = new PinballPhysics(R, table)
    this.rules = initialRules(table.balls)
    this.apply({ type: 'start' })
  }

  get score() {
    return this.rules.score
  }

  get lives() {
    return this.rules.lives
  }

  get over() {
    return this.rules.over
  }

  get isDisposed() {
    return this.disposed
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
    const controls = this.demo ? this.pilot() : input
    const both = controls.held.a && !this.physics.ballOnPlunger()
    const left = controls.held.left || both
    const right = controls.held.right || both
    if ((controls.pressed.left || controls.pressed.right) && !this.demo) {
      this.mixer.play('flipper')
    }
    this.physics.setFlipper('left', left)
    this.physics.setFlipper('right', right)
    this.plunger(controls)
    if (this.nudgeCooldown > 0) this.nudgeCooldown--
    if (controls.pressed.up && this.nudgeCooldown === 0) {
      this.physics.nudge((this.rng() - 0.5) * 0.12, -0.12)
      this.nudgeCooldown = 45
      this.mixer.play('nudge')
    }
    for (let i = 0; i < STEPS_PER_TICK; i++) {
      this.steps++
      for (const event of this.physics.step())
        this.apply({ type: 'switch', event, tick: this.steps })
    }
    this.apply({ type: 'tick', tick: this.steps })
    this.unstick()
    this.scene?.setView(this.view())
  }

  /** The camera preset the balls on the table call for right now. */
  view(): CameraPresetId {
    return cameraViewFor(this.physics.ballViews())
  }

  private plunger(controls: InputFrame) {
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

  /** A ball resting somewhere odd (not on the plunger) gets a gentle shove. */
  private unstick() {
    const moving = this.physics
      .ballViews()
      .some((b) => b.captured || b.speed > STILL_SPEED)
    if (
      moving ||
      this.physics.ballOnPlunger() ||
      this.physics.ballCount === 0
    ) {
      this.still = 0
      return
    }
    if (++this.still < STILL_TICKS) return
    this.still = 0
    this.physics.nudge((this.rng() - 0.5) * 0.2, -0.25)
  }

  private apply(event: RulesEvent) {
    const { state, effects } = stepRules(this.rules, event, {
      shots: this.physics.table.shots,
    })
    this.rules = state
    for (const effect of effects) this.effect(effect)
  }

  private effect(effect: RuleEffect) {
    switch (effect.type) {
      case 'serve-ball':
        this.physics.serveBall()
        break
      case 'sound':
        if (!this.demo) this.mixer.play(effect.name)
        break
      case 'mechanism':
        if (effect.action === 'flash') this.scene?.pulse(effect.id)
        if (effect.action === 'reset') this.physics.resetDropBank(effect.id)
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
