// /utils/arcade/games/butterflyBlaster.ts
//
// Butterfly Blaster -- the Kind Robots Arcade's riff on the 1979 rock-splitting shooter (Silas,
// 2026-10-06: "rainbow butterflies to kill mosquitoes, a la our malaria project"; depth pass
// conductor kr-arcade/t-055.., spec: conductor projects/kr-arcade/depth-pass/CABINETS.md section 6,
// "The Rainy Season").
//
// A rainbow butterfly keeps the night watch over a village. It turns, flutters and drifts around a
// wrapping sky, sparkling mosquito swarms that split big -> medium -> single. The swarms are alive:
// they flock, hum toward light, regroup when split and left alone, and when they get hungry they
// head for the huts' lit windows and bite. Fluttering trails a rainbow ribbon; cross it to close the
// Rainbow Lasso and net every mosquito inside at once. B is a flutter-dash on a tap and the old
// risky long hop on a hold. Pools of standing water breed wrigglers; skimmers skate the ground and
// needles dash. AMI, the Anti-Malaria Intelligence, drops bed nets. Each night is two waves and a
// dawn tally that thanks you for every hut that came through unbitten.

import { drawText } from '../font'
import {
  INK,
  RAMPS,
  Sparkles,
  backdropRng,
  cachedLayer,
  drawSprite,
  gauge,
  glow,
  hudPanel,
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
  LIFE_SPRITE,
  RAINBOW,
  SICK,
  paintNight,
  renderBag,
  renderButterfly,
  renderCloud,
  renderDashTrail,
  renderDawn,
  renderDriftingClouds,
  renderFairy,
  renderFireflies,
  renderLoopFlash,
  renderMesh,
  renderNet,
  renderPest,
  renderPool,
  renderRibbon,
  renderSparkle,
  renderStars,
  renderSwarm,
  renderWindows,
} from '../butterflyBlaster/art'
import {
  LASSO_POINTS,
  RIBBON_STEP,
  Ribbon,
  insideLoop,
  lassoMultiplier,
} from '../butterflyBlaster/lasso'
import type { Loop } from '../butterflyBlaster/lasso'
import { DAWN, HEARTBEAT, heartbeatTier } from '../butterflyBlaster/music'
import { endlessNight } from '../butterflyBlaster/nights'
import type { NightPlan } from '../butterflyBlaster/nights'
import {
  PEST_POINTS,
  PEST_RADIUS,
  movePest,
  newPest,
  newPool,
  pestHurts,
  tickPool,
} from '../butterflyBlaster/pests'
import type { Pest, PestKind, Pool } from '../butterflyBlaster/pests'
import {
  GROUND,
  H,
  SKY,
  W,
  angleDiff,
  clamp,
  toward,
  wrap,
  wrapDist,
} from '../butterflyBlaster/sky'
import type { Body, Point } from '../butterflyBlaster/sky'
import {
  SHOO_TICKS,
  SWARM_POINTS,
  SWARM_RADIUS,
  SWARM_TREE,
  flySwarm,
  newSwarm,
  regroupSwarms,
  splitSwarm,
} from '../butterflyBlaster/swarm'
import type { Size, Swarm } from '../butterflyBlaster/swarm'
import {
  dawnTally,
  hutLights,
  hutLit,
  newVillage,
  reachesHut,
} from '../butterflyBlaster/village'
import type { Hut, Tally } from '../butterflyBlaster/village'

export { endlessNight, SWARM_RADIUS, SWARM_TREE }
export type { Pest, Pool, Swarm, Hut }

const TURN = 0.08
const THRUST = 0.12
const MAX_SPEED = 4.2
const FRICTION = 0.992
/** How hard a flutter swings the drift toward the butterfly's heading. */
const GRIP = 0.08
const SHOT_SPEED = 6.5
const SHOT_LIFE = 48
const MAX_SHOTS = 5
const FIRE_COOLDOWN = 8
const AUTOFIRE_COOLDOWN = 14
const RESPAWN_TICKS = 120
const INVULN_TICKS = 150
const SHIELD_TICKS = 480
const START_LIVES = 3
const MAX_LIVES = 9
export const SHIP_RADIUS = 8
/** A swarm's haze is softer than its heart: it only hurts this far into its radius. */
const HURT = 0.72

/** B: a tap is a short aimed flutter-dash; a hold is the risky long hop. One cooldown for both. */
export const DASH = { distance: 58, cooldown: 60, invuln: 8, hold: 16 } as const
/** Land a long hop this close to a swarm and live this long for a Brave Hop. */
export const BRAVE = { reach: 40, ticks: 120, points: 500 } as const
/** Sparkle hits this close together chain, up to this multiplier. */
export const CHAIN = { ticks: 45, max: 4 } as const
/** Hang about an edge (or sit idle) this long and the malaria cloud comes for you. */
export const LURK = { ticks: 480, edge: 70 } as const
/** The second wave follows the first after this many ticks. */
const WAVE_GAP = 110
/** The dawn tally lasts this long (A skips it after a second). */
export const DAWN_TICKS = 330

type Shot = Body & { life: number; hue: number }
type Drop = Body & { life: number; fall: number }
type Cloud = Body & {
  small: boolean
  angry: boolean
  fire: number
  turn: number
}
type Fairy = Body & { dropAt: number; carrying: boolean }
type Net = Body & { spin: number }
type Particle = Body & { life: number; max: number; color: string }
type Floater = {
  x: number
  y: number
  text: string
  life: number
  color: string
  scale: 1 | 2
}
type Bag = { x: number; y: number; count: number; life: number }

type Phase = 'play' | 'gap' | 'dawn'

class ButterflyBlaster implements ArcadeGameInstance {
  score = 0
  level = 0
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private ship = { x: W / 2, y: SKY / 2, vx: 0, vy: 0, angle: 0 }
  /** The butterfly's position before the sky wraps it: the ribbon is laid here. */
  private unwrapped = { x: W / 2, y: SKY / 2 }
  private alive = true
  private respawn = 0
  private invuln = INVULN_TICKS
  private shield = 0
  private fireCooldown = 0
  private bCooldown = 0
  /** Ticks B has been held (-1: up; -2: held past a hop, waiting to be let go). */
  private bHeld = -1
  private brave = 0
  private flap = 0
  private thrusting = false
  private dashTrail: { from: Point; to: Point; t: number } | null = null

  private ribbon = new Ribbon()
  private lastLaid = -99
  private loopFlash: { loop: Loop; shift: Point; t: number } | null = null
  private bags: Bag[] = []

  private shots: Shot[] = []
  private swarms: Swarm[] = []
  private pests: Pest[] = []
  private pools: Pool[] = []
  private drops: Drop[] = []
  private cloud: Cloud | null = null
  private cloudTimer = 0
  private fairy: Fairy | null = null
  private fairyTimer = 0
  private nets: Net[] = []
  private huts: Hut[] = newVillage()

  private plan: NightPlan = endlessNight(1)
  private wave = 0
  private phase: Phase = 'play'
  private phaseTicks = 0
  /** Mosquitoes the wave began with (the heartbeat's measure). */
  private waveTotal = 1
  private tally: Tally | null = null
  private chain = 0
  private chainTimer = 0
  private lurk = 0

  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null
  private overTimer = 0
  private pilot = { loop: 0, side: 'right' as 'left' | 'right', hold: 0 }
  // Cosmetic sparkles roll their own dice, so the game's seeded rng is untouched.
  private fx = new Sparkles()
  private fxRng = backdropRng(31)

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.startNight(1)
  }

  get music(): MusicLoop | null {
    if (this.over || this.demo) return null
    if (this.phase === 'dawn') return DAWN
    const left = this.mosquitoesLeft() / Math.max(1, this.waveTotal)
    return HEARTBEAT[heartbeatTier(left, this.sprinting())]!
  }

  // --- the night ---------------------------------------------------------------------------------

  private startNight(n: number) {
    this.level = n
    this.plan = endlessNight(n)
    this.huts = newVillage()
    this.pools = this.plan.pools.map((x) =>
      newPool(x, this.plan.poolEvery, this.rng),
    )
    this.startWave(0)
    this.banner = {
      text: `NIGHT ${n}`,
      sub: n === 1 ? 'KEEP THE VILLAGE SAFE' : 'THE NEXT VILLAGE DOWNRIVER',
      ticks: 120,
    }
  }

  private hunger(): number {
    const [least, spread] = this.plan.hunger
    return Math.round(least + this.rng() * spread)
  }

  /** A spot on the sky's edge, well away from the butterfly. */
  private edgeSpot(): Point {
    for (let attempt = 0; attempt < 40; attempt++) {
      const p =
        this.rng() < 0.4
          ? { x: this.rng() * W, y: 4 }
          : {
              x: this.rng() < 0.5 ? 2 : W - 2,
              y: 20 + this.rng() * (GROUND - 110),
            }
      if (wrapDist(p, this.ship) > 140) return p
    }
    return { x: 2, y: 20 }
  }

  private startWave(i: number) {
    this.wave = i
    this.phase = 'play'
    const wave = this.plan.waves[i]!
    const add = (size: Size) => {
      const p = this.edgeSpot()
      this.swarms.push(newSwarm(p.x, p.y, size, this.rng, this.hunger()))
    }
    for (let k = 0; k < wave.big; k++) add(3)
    for (let k = 0; k < wave.medium; k++) add(2)
    for (let k = 0; k < wave.needles; k++) {
      const p = this.edgeSpot()
      this.pests.push(newPest('needle', p.x, p.y, this.rng))
    }
    for (let k = 0; k < wave.skimmers; k++) {
      const x = k % 2 === 0 ? 12 : W - 12
      this.pests.push(newPest('skimmer', x, 0, this.rng))
    }
    this.cloudTimer = Math.round(this.plan.cloudEvery / 2)
    this.fairyTimer = Math.round(this.plan.amiEvery / 2)
    this.waveTotal = this.mosquitoesLeft()
  }

  /** Mosquitoes still in the sky (a swarm counts its whole split tree). */
  private mosquitoesLeft(): number {
    let n = 0
    for (const s of this.swarms) n += SWARM_TREE[s.size]
    for (const p of this.pests) n += p.kind === 'skimmer' ? 1 : 1
    return n
  }

  /** The last mosquito of the night sprints. */
  private sprinting(): boolean {
    return (
      this.phase === 'play' &&
      this.wave === this.plan.waves.length - 1 &&
      this.swarms.length === 1 &&
      this.swarms[0]!.size === 1 &&
      this.pests.every((p) => p.kind === 'skimmer')
    )
  }

  private waveClear(): boolean {
    return !this.swarms.length && !this.pests.length
  }

  private endWave() {
    this.cloud = null
    this.drops = []
    this.ribbon.clear()
    if (this.wave < this.plan.waves.length - 1) {
      this.phase = 'gap'
      this.phaseTicks = WAVE_GAP
      this.sound.play('level')
      this.banner = {
        text: 'HERE THEY COME',
        sub: 'THE SECOND SWARM',
        ticks: 90,
      }
      return
    }
    this.phase = 'dawn'
    this.phaseTicks = DAWN_TICKS
    this.tally = dawnTally(this.huts)
    this.banner = null
    this.nets = []
    this.fairy = null
    this.sound.play('level')
    if (!this.demo) {
      this.score += this.tally.total
      if (this.tally.perfect) {
        this.lives = Math.min(MAX_LIVES, this.lives + 1)
        this.sound.play('extra')
      }
    }
    for (const hut of this.huts) {
      if (hut.bites === 0)
        this.fx.burst(hut.x, GROUND - 12, this.fxRng, {
          count: 10,
          colours: [RAMPS.gold[4], RAMPS.gold[3], RAMPS.pink[3]],
        })
    }
  }

  // --- update ------------------------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return

    if (this.phase === 'dawn') {
      this.phaseTicks--
      const skip =
        !this.demo &&
        this.phaseTicks < DAWN_TICKS - 60 &&
        (input.pressed.a || input.pressed.start)
      if (this.phaseTicks <= 0 || skip) {
        this.tally = null
        this.startNight(this.level + 1)
      }
      return
    }

    const controls = this.demo ? this.demoInput() : input
    if (this.alive) this.updateShip(controls)
    else this.tryRespawn()

    this.updateShots()
    this.updateSwarms()
    this.updatePests()
    this.updateCloud()
    this.updateFairy()
    this.collide()

    if (this.phase === 'gap') {
      if (--this.phaseTicks <= 0) this.startWave(this.wave + 1)
    } else if (this.waveClear() && this.lives > 0) {
      this.endWave()
    }

    if (this.lives <= 0 && !this.alive && ++this.overTimer > 90) {
      this.over = true
    }
  }

  private updateEffects() {
    this.fx.update()
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      p.vx *= 0.97
      p.vy *= 0.97
      p.life--
    }
    this.particles = this.particles.filter((p) => p.life > 0)
    for (const f of this.floaters) {
      f.y -= 0.4
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
    for (const b of this.bags) {
      b.y -= 0.7
      b.life--
    }
    this.bags = this.bags.filter((b) => b.life > 0 && b.y > -40)
    if (this.loopFlash && (this.loopFlash.t -= 1 / 30) <= 0)
      this.loopFlash = null
    if (this.dashTrail && (this.dashTrail.t -= 1 / 14) <= 0)
      this.dashTrail = null
    for (const hut of this.huts) if (hut.flicker > 0) hut.flicker--
    if (this.chainTimer > 0 && --this.chainTimer === 0) this.chain = 0
  }

  private updateShip(input: InputFrame) {
    const ship = this.ship
    if (input.held.left) ship.angle -= TURN
    if (input.held.right) ship.angle += TURN
    this.thrusting = input.held.up
    if (this.thrusting) {
      // Wings bite the air: a flutter swings the drift round toward where the butterfly faces,
      // so fluttering through a turn sweeps an arc (the lasso's loop) instead of skidding.
      const speed0 = Math.hypot(ship.vx, ship.vy)
      ship.vx += (Math.sin(ship.angle) * speed0 - ship.vx) * GRIP
      ship.vy += (-Math.cos(ship.angle) * speed0 - ship.vy) * GRIP
      ship.vx += Math.sin(ship.angle) * THRUST
      ship.vy -= Math.cos(ship.angle) * THRUST
      const speed = Math.hypot(ship.vx, ship.vy)
      if (speed > MAX_SPEED) {
        ship.vx *= MAX_SPEED / speed
        ship.vy *= MAX_SPEED / speed
      }
    }
    ship.vx *= FRICTION
    ship.vy *= FRICTION
    ship.x += ship.vx
    ship.y += ship.vy
    this.unwrapped.x += ship.vx
    this.unwrapped.y += ship.vy
    wrap(ship)
    this.flap += this.thrusting ? 0.45 : 0.15

    // The ribbon: laid while the butterfly flutters.
    this.ribbon.age(this.tick)
    if (!this.ribbon.points.length) {
      this.unwrapped.x = ship.x
      this.unwrapped.y = ship.y
    }
    if (this.thrusting && this.tick % RIBBON_STEP === 0) this.layRibbon()

    if (this.fireCooldown > 0) this.fireCooldown--
    const wantsFire =
      (input.pressed.a && this.fireCooldown <= FIRE_COOLDOWN - 4) ||
      (input.held.a && this.fireCooldown === 0)
    if (wantsFire && this.shots.length < MAX_SHOTS) {
      this.shots.push({
        x: ship.x + Math.sin(ship.angle) * 13,
        y: ship.y - Math.cos(ship.angle) * 13,
        vx: ship.vx + Math.sin(ship.angle) * SHOT_SPEED,
        vy: ship.vy - Math.cos(ship.angle) * SHOT_SPEED,
        life: SHOT_LIFE,
        hue: this.tick,
      })
      this.fireCooldown = input.pressed.a ? FIRE_COOLDOWN : AUTOFIRE_COOLDOWN
      this.sound.play('shoot')
    }

    this.updateB(input.held.b || input.pressed.b)

    if (this.brave > 0 && --this.brave === 0) {
      this.addScore(BRAVE.points, ship.x, ship.y - 16, 'BRAVE HOP!')
      this.sound.play('pickup')
    }
    this.updateLurk()
    if (this.invuln > 0) this.invuln--
    if (this.shield > 0) this.shield--
  }

  /** B: tap to flutter-dash, hold to long-hop. */
  private updateB(held: boolean) {
    if (this.bCooldown > 0) this.bCooldown--
    if (held) {
      if (this.bHeld === -2) return
      this.bHeld = this.bHeld < 0 ? 0 : this.bHeld + 1
      if (this.bHeld >= DASH.hold) {
        this.bHeld = -2
        if (this.bCooldown === 0) this.longHop()
      }
      return
    }
    if (this.bHeld >= 0 && this.bCooldown === 0) this.dash()
    this.bHeld = -1
  }

  private dash() {
    const ship = this.ship
    const from = { x: ship.x, y: ship.y }
    const dx = Math.sin(ship.angle) * DASH.distance
    const dy = -Math.cos(ship.angle) * DASH.distance
    ship.x += dx
    ship.y += dy
    this.unwrapped.x += dx
    this.unwrapped.y += dy
    ship.vx += Math.sin(ship.angle) * 1.2
    ship.vy -= Math.cos(ship.angle) * 1.2
    const speed = Math.hypot(ship.vx, ship.vy)
    if (speed > MAX_SPEED) {
      ship.vx *= MAX_SPEED / speed
      ship.vy *= MAX_SPEED / speed
    }
    wrap(ship)
    this.dashTrail = { from, to: { x: from.x + dx, y: from.y + dy }, t: 1 }
    this.invuln = Math.max(this.invuln, DASH.invuln)
    this.bCooldown = DASH.cooldown
    // A dash mid-flutter carries the ribbon with it: a straight cut that can close a loop.
    if (this.tick - this.lastLaid <= RIBBON_STEP + 1) this.layRibbon()
    this.sound.play('blip')
  }

  private longHop() {
    const ship = this.ship
    this.burst(ship.x, ship.y, 10, RAINBOW)
    ship.x = 20 + this.rng() * (W - 40)
    ship.y = 20 + this.rng() * (SKY - 60)
    ship.vx = 0
    ship.vy = 0
    this.ribbon.clear()
    this.unwrapped = { x: ship.x, y: ship.y }
    this.bCooldown = DASH.cooldown
    this.burst(ship.x, ship.y, 10, RAINBOW)
    this.sound.play('blip')
    const near = this.swarms.some(
      (s) => wrapDist(s, ship) - SWARM_RADIUS[s.size] < BRAVE.reach,
    )
    this.brave = near ? BRAVE.ticks : 0
  }

  private layRibbon() {
    const joined = this.tick - this.lastLaid <= RIBBON_STEP + 1
    const loop = this.ribbon.lay(
      this.unwrapped.x,
      this.unwrapped.y,
      this.tick,
      joined,
    )
    this.lastLaid = this.tick
    if (loop) this.closeLoop(loop)
  }

  /** Hanging about an edge, or sitting idle, brings the malaria cloud early and sharper. */
  private updateLurk() {
    const ship = this.ship
    const speed = Math.hypot(ship.vx, ship.vy)
    const edge =
      ship.x < LURK.edge || ship.x > W - LURK.edge || ship.y < LURK.edge
    const lurking = (edge && speed < 1.6) || (speed < 0.3 && !this.thrusting)
    this.lurk = lurking ? this.lurk + 1 : Math.max(0, this.lurk - 2)
    if (this.lurk < LURK.ticks || this.phase !== 'play' || !this.swarms.length)
      return
    this.lurk = 0
    if (this.cloud) {
      this.cloud.angry = true
    } else {
      this.spawnCloud(true)
    }
    this.floaters.push({
      x: ship.x,
      y: ship.y - 20,
      text: 'NO LURKING!',
      life: 70,
      color: SICK[3],
      scale: 1,
    })
  }

  private tryRespawn() {
    if (this.lives <= 0) return
    if (this.respawn > 0) {
      this.respawn--
      return
    }
    const centre = { x: W / 2, y: SKY / 2 }
    const clear =
      this.swarms.every(
        (swarm) => wrapDist(swarm, centre) > SWARM_RADIUS[swarm.size] + 60,
      ) &&
      this.pests.every((p) => p.kind !== 'needle' || wrapDist(p, centre) > 70)
    if (!clear) return
    Object.assign(this.ship, { x: W / 2, y: SKY / 2, vx: 0, vy: 0, angle: 0 })
    this.unwrapped = { x: W / 2, y: SKY / 2 }
    this.ribbon.clear()
    this.alive = true
    this.invuln = INVULN_TICKS
    this.lurk = 0
  }

  private updateShots() {
    for (const shot of this.shots) {
      shot.x += shot.vx
      shot.y += shot.vy
      wrap(shot)
      shot.life--
    }
    this.shots = this.shots.filter((shot) => shot.life > 0)
    for (const drop of this.drops) {
      drop.vy += drop.fall
      drop.x += drop.vx
      drop.y += drop.vy
      if (drop.fall) {
        if (drop.y > GROUND) drop.life = 0
        if (drop.x < 0) drop.x += W
        else if (drop.x >= W) drop.x -= W
      } else {
        wrap(drop)
      }
      drop.life--
    }
    this.drops = this.drops.filter((drop) => drop.life > 0)
  }

  private updateSwarms() {
    if (this.phase !== 'play') return
    const sprint = this.sprinting()
    const lights = hutLights(this.huts)
    for (const s of this.swarms) {
      s.sprint = sprint
      if (sprint) s.hunger = 0
      flySwarm(s, {
        swarms: this.swarms,
        lights,
        glow: this.alive ? this.ship : null,
        speed: this.plan.speed,
        rng: this.rng,
      })
    }
    // Bites: a hungry swarm that reaches a lit window.
    for (const s of this.swarms) {
      if (s.mode !== 'seek') continue
      const hut = this.huts.find(
        (h) => hutLit(h) && reachesHut(h, s.x, s.y, SWARM_RADIUS[s.size]),
      )
      if (hut) this.bite(hut, s)
    }
    const { swarms, merged } = regroupSwarms(this.swarms)
    this.swarms = swarms
    for (const m of merged) {
      this.floaters.push({
        x: m.x,
        y: m.y - SWARM_RADIUS[m.size] - 6,
        text: 'REGROUPED',
        life: 50,
        color: SICK[3],
        scale: 1,
      })
    }
  }

  private bite(hut: Hut, s: Swarm) {
    hut.bites++
    hut.flicker = 60
    s.mode = 'shoo'
    s.modeTicks = SHOO_TICKS
    s.hunger = this.hunger()
    s.vy = -1.6
    this.sound.play('warn')
    if (!hutLit(hut)) {
      this.floaters.push({
        x: hut.x,
        y: GROUND - 44,
        text: 'NETS UP',
        life: 80,
        color: RAMPS.sky[3],
        scale: 1,
      })
    }
  }

  private updatePests() {
    if (this.phase !== 'play') return
    const host = {
      rng: this.rng,
      target: this.alive ? this.ship : null,
      spray: (x: number, y: number, vx: number, vy: number) => {
        this.drops.push({ x, y, vx, vy, life: 150, fall: 0.05 })
      },
    }
    const hatched: Pest[] = []
    for (const p of this.pests) {
      const event = movePest(p, host)
      if (event === 'hatch') hatched.push(p)
      else if (event === 'dash') this.sound.play('warn')
    }
    for (const p of hatched) {
      this.pests.splice(this.pests.indexOf(p), 1)
      const s = newSwarm(p.x, p.y, 2, this.rng, 30)
      s.vy = -0.6
      this.swarms.push(s)
      this.waveTotal += SWARM_TREE[2]
      this.floaters.push({
        x: p.x,
        y: p.y - 22,
        text: 'HATCHED!',
        life: 60,
        color: RAMPS.ember[3],
        scale: 1,
      })
      this.sound.play('warn')
    }
    // Standing water breeds while the swarms are out.
    if (!this.swarms.length) return
    for (const pool of this.pools) {
      if (tickPool(pool, this.plan.poolEvery, this.rng)) {
        this.pests.push(newPest('wriggler', pool.x, GROUND - 4, this.rng))
        this.waveTotal += 1
      }
    }
  }

  private spawnCloud(angry: boolean) {
    const fromLeft = this.rng() < 0.5
    // The small, sharp cloud turns up more as the score climbs.
    const smallChance =
      this.level < 2 ? 0 : clamp(0.1 + this.score / 60_000, 0, 0.75)
    const small = angry || this.rng() < smallChance
    this.cloud = {
      x: fromLeft ? -24 : W + 24,
      y: 40 + this.rng() * (SKY - 140),
      vx: (fromLeft ? 1 : -1) * (small ? 1.6 : 1.1),
      vy: 0,
      small,
      angry,
      fire: 60,
      turn: 60,
    }
    const quicken = 1 - Math.min(0.35, this.score / 150_000)
    this.cloudTimer = Math.round(this.plan.cloudEvery * quicken)
    this.sound.play('warn')
  }

  private updateCloud() {
    if (this.phase !== 'play') return
    const wave = this.plan.waves[this.wave]!
    if (wave.cloud && !this.cloud && this.swarms.length) {
      if (--this.cloudTimer <= 0) this.spawnCloud(false)
    }
    const cloud = this.cloud
    if (!cloud) return
    cloud.x += cloud.vx
    cloud.y += cloud.vy
    if (--cloud.turn <= 0) {
      cloud.vy = (this.rng() - 0.5) * 1.6
      cloud.turn = 50 + Math.floor(this.rng() * 40)
    }
    cloud.y = clamp(cloud.y, 24, SKY - 80)
    if (cloud.x < -44 || cloud.x > W + 44) {
      this.cloud = null
      return
    }
    if (--cloud.fire <= 0 && this.alive) {
      const d = toward(cloud, this.ship)
      const aim = Math.atan2(d.y, d.x)
      const error =
        this.plan.cloudAim * (cloud.angry ? 0.25 : cloud.small ? 0.5 : 1)
      const angle = aim + (this.rng() - 0.5) * 2 * error
      this.drops.push({
        x: cloud.x,
        y: cloud.y,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3,
        life: 90,
        fall: 0,
      })
      cloud.fire = Math.round(this.plan.cloudFire * (cloud.angry ? 0.6 : 1))
    }
  }

  private updateFairy() {
    if (this.phase === 'dawn') return
    if (!this.fairy && --this.fairyTimer <= 0 && this.swarms.length) {
      const fromLeft = this.rng() < 0.5
      this.fairy = {
        x: fromLeft ? -16 : W + 16,
        y: 34 + this.rng() * 20,
        vx: fromLeft ? 1.5 : -1.5,
        vy: 0,
        dropAt: 80 + this.rng() * (W - 160),
        carrying: true,
      }
      this.fairyTimer = this.plan.amiEvery
    }
    const fairy = this.fairy
    if (fairy) {
      fairy.x += fairy.vx
      fairy.y += Math.sin(this.tick / 10) * 0.4
      const passed =
        fairy.vx > 0 ? fairy.x >= fairy.dropAt : fairy.x <= fairy.dropAt
      if (fairy.carrying && passed) {
        fairy.carrying = false
        this.nets.push({ x: fairy.x, y: fairy.y + 10, vx: 0, vy: 0.8, spin: 0 })
      }
      if (fairy.x < -30 || fairy.x > W + 30) this.fairy = null
    }
    for (const net of this.nets) {
      net.y += net.vy
      net.x += Math.sin((this.tick + net.spin * 50) / 30) * 0.4
      net.spin += 0.02
    }
    this.nets = this.nets.filter((net) => net.y < GROUND)
  }

  // --- scoring and hits ----------------------------------------------------------------------------

  private addScore(points: number, x: number, y: number, label?: string) {
    if (this.demo) return
    this.score += points
    this.floaters.push({
      x,
      y,
      text: label ? `${label} ${points}` : String(points),
      life: 45,
      color: RAMPS.gold[3],
      scale: 1,
    })
  }

  /** A sparkle hit: the chain grows if the last one was under a second ago. */
  private chainUp(): number {
    this.chain = this.chainTimer > 0 ? Math.min(CHAIN.max, this.chain + 1) : 1
    this.chainTimer = CHAIN.ticks
    return this.chain
  }

  private hitSwarm(index: number, byShot: boolean) {
    const swarm = this.swarms[index]!
    this.swarms.splice(index, 1)
    const chain = byShot ? this.chainUp() : 1
    this.addScore(SWARM_POINTS[swarm.size] * chain, swarm.x, swarm.y)
    if (chain > 1) this.chainFloater(swarm.x, swarm.y - 12, chain)
    this.burst(swarm.x, swarm.y, swarm.size * 6, [
      '#a3e635',
      '#e2e8f0',
      '#94a3b8',
    ])
    this.sound.play('pop')
    this.fx.burst(swarm.x, swarm.y, this.fxRng, { count: 3 + swarm.size * 2 })
    const halves = splitSwarm(swarm, this.rng, this.hunger())
    if (halves) this.swarms.push(...halves)
  }

  private chainFloater(x: number, y: number, chain: number) {
    // One chain call on screen at a time: the newest replaces the last.
    this.floaters = this.floaters.filter((f) => !f.text.startsWith('CHAIN'))
    this.floaters.push({
      x,
      y,
      text: `CHAIN X${chain}`,
      life: 40 + chain * 6,
      color: RAINBOW[chain % RAINBOW.length]!,
      scale: chain >= CHAIN.max ? 2 : 1,
    })
  }

  private hitPest(index: number, byShot: boolean) {
    const p = this.pests[index]!
    this.pests.splice(index, 1)
    const chain = byShot ? this.chainUp() : 1
    const label = p.kind === 'wriggler' ? 'NIPPED' : undefined
    this.addScore(PEST_POINTS[p.kind] * chain, p.x, p.y, label)
    if (chain > 1) this.chainFloater(p.x, p.y - 12, chain)
    this.burst(p.x, p.y, 10, [RAMPS.water[3], '#e2e8f0', RAMPS.ember[3]])
    this.fx.burst(p.x, p.y, this.fxRng, { count: 6 })
    this.sound.play('pop')
  }

  /** The Rainbow Lasso closes: every mosquito inside is netted at once. */
  private closeLoop(loop: Loop) {
    const shift = {
      x: this.ship.x - this.unwrapped.x,
      y: this.ship.y - this.unwrapped.y,
    }
    this.loopFlash = { loop, shift, t: 1 }
    let count = 0
    let cx = 0
    let cy = 0
    let caught = 0
    const inside = (p: Point) => insideLoop(loop, p.x - shift.x, p.y - shift.y)
    this.swarms = this.swarms.filter((s) => {
      if (!inside(s)) return true
      count += SWARM_TREE[s.size]
      cx += s.x
      cy += s.y
      caught++
      return false
    })
    this.pests = this.pests.filter((p) => {
      if (!inside(p)) return true
      count += 1
      cx += p.x
      cy += p.y
      caught++
      return false
    })
    if (!count) {
      this.sound.play('blip')
      return
    }
    cx /= caught
    cy /= caught
    const mult = lassoMultiplier(count)
    const points = LASSO_POINTS * count * mult
    this.addScore(points, cx, cy + 14)
    this.floaters.push({
      x: cx,
      y: cy - 18,
      text: mult > 1 ? `NETTED ${count} X${mult}` : `NETTED ${count}`,
      life: 70,
      color: RAMPS.sky[4],
      scale: count >= 7 ? 2 : 1,
    })
    this.bags.push({ x: cx, y: cy, count, life: 140 })
    this.fx.burst(cx, cy, this.fxRng, {
      count: 10 + Math.min(20, count * 2),
      colours: [...RAINBOW],
      speed: 2.4,
    })
    this.sound.play('extra')
  }

  private collide() {
    for (const shot of this.shots) {
      if (shot.life <= 0) continue
      const hit = this.swarms.findIndex(
        (s) => wrapDist(shot, s) < SWARM_RADIUS[s.size],
      )
      if (hit >= 0) {
        shot.life = 0
        this.hitSwarm(hit, true)
        continue
      }
      const pest = this.pests.findIndex(
        (p) => wrapDist(shot, p) < PEST_RADIUS[p.kind] + 2,
      )
      if (pest >= 0) {
        shot.life = 0
        this.hitPest(pest, true)
        continue
      }
      const cloud = this.cloud
      if (cloud && wrapDist(shot, cloud) < (cloud.small ? 14 : 24)) {
        shot.life = 0
        const chain = this.chainUp()
        this.addScore((cloud.small ? 1000 : 200) * chain, cloud.x, cloud.y)
        this.burst(cloud.x, cloud.y, 24, ['#65a30d', '#a3e635', '#d9f99d'])
        this.fx.burst(cloud.x, cloud.y, this.fxRng, { count: 16, speed: 2.2 })
        this.sound.play('boom')
        this.cloud = null
      }
    }
    this.shots = this.shots.filter((shot) => shot.life > 0)

    if (!this.alive) return
    const ship = this.ship

    const caught = this.nets.findIndex((net) => wrapDist(net, ship) < 20)
    if (caught >= 0) {
      this.nets.splice(caught, 1)
      this.shield = SHIELD_TICKS
      this.addScore(250, ship.x, ship.y)
      this.sound.play('pickup')
      this.fx.burst(ship.x, ship.y, this.fxRng, {
        count: 14,
        colours: [RAMPS.sky[4], RAMPS.teal[3], '#ffffff'],
      })
      this.banner = { text: 'BED NET!', sub: 'THANK YOU, AMI', ticks: 70 }
    }

    if (this.invuln > 0) return

    const swarmHit = this.swarms.findIndex(
      (s) => wrapDist(s, ship) < SWARM_RADIUS[s.size] * HURT + SHIP_RADIUS - 2,
    )
    const pestHit = this.pests.findIndex(
      (p) =>
        pestHurts(p) &&
        wrapDist(p, ship) < PEST_RADIUS[p.kind] + SHIP_RADIUS - 3,
    )
    const dropHit = this.drops.findIndex(
      (drop) => wrapDist(drop, ship) < SHIP_RADIUS - 1,
    )
    const cloudHit =
      this.cloud &&
      wrapDist(this.cloud, ship) < SHIP_RADIUS + (this.cloud.small ? 10 : 18)
    if (swarmHit < 0 && pestHit < 0 && dropHit < 0 && !cloudHit) return

    if (this.shield > 0) {
      // The net takes the hit, and catches what hit it.
      if (swarmHit >= 0) this.hitSwarm(swarmHit, false)
      else if (pestHit >= 0) this.hitPest(pestHit, false)
      if (dropHit >= 0) this.drops.splice(dropHit, 1)
      if (cloudHit) this.cloud = null
      this.shield = 0
      this.invuln = 60
      this.burst(ship.x, ship.y, 16, ['#ffffff', '#e0f2fe'])
      this.sound.play('pop')
      return
    }

    if (swarmHit >= 0) this.hitSwarm(swarmHit, false)
    else if (pestHit >= 0) this.hitPest(pestHit, false)
    if (dropHit >= 0) this.drops.splice(dropHit, 1)
    this.loseLife()
  }

  private loseLife() {
    this.alive = false
    this.lives--
    this.respawn = RESPAWN_TICKS
    this.brave = 0
    this.chain = 0
    this.chainTimer = 0
    this.ribbon.clear()
    this.burst(this.ship.x, this.ship.y, 40, RAINBOW)
    this.sound.play('die')
    if (this.lives <= 0) this.banner = { text: 'GAME OVER', ticks: 200 }
  }

  private burst(
    x: number,
    y: number,
    count: number,
    colors: readonly string[],
  ) {
    for (let i = 0; i < count; i++) {
      const a = this.fxRng() * Math.PI * 2
      const s = 0.5 + this.fxRng() * 2.5
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 30 + Math.floor(this.fxRng() * 30),
        max: 60,
        color: colors[i % colors.length]!,
      })
    }
  }

  // --- attract-mode pilot ------------------------------------------------------------------------

  /** The nearest thing that can hurt the butterfly, and how far its edge is. */
  private nearestDanger(): { at: Point; gap: number } | null {
    const ship = this.ship
    let best: { at: Point; gap: number } | null = null
    const consider = (at: Point, r: number) => {
      const gap = wrapDist(at, ship) - r
      if (!best || gap < best.gap) best = { at, gap }
    }
    for (const s of this.swarms) consider(s, SWARM_RADIUS[s.size])
    for (const p of this.pests) {
      if (!pestHurts(p)) continue
      consider(p, PEST_RADIUS[p.kind])
      if (p.kind === 'needle' && p.state !== 'drift') {
        // Stand off a needle's locked line.
        const d = toward(p, ship)
        const along = d.x * Math.cos(p.heading) + d.y * Math.sin(p.heading)
        const across = Math.abs(
          -d.x * Math.sin(p.heading) + d.y * Math.cos(p.heading),
        )
        if (along > 0 && along < 380 && across < 18)
          consider(
            {
              x: ship.x - Math.cos(p.heading) * 20,
              y: ship.y - Math.sin(p.heading) * 20,
            },
            0,
          )
      }
    }
    for (const d of this.drops) consider(d, 2)
    if (this.cloud) consider(this.cloud, this.cloud.small ? 12 : 20)
    return best
  }

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
    const pressed = { ...held }
    const frame = { held, pressed }
    if (!this.alive) return frame
    const ship = this.ship
    const pilot = this.pilot
    const danger = this.nearestDanger()

    // A loop is dropped the moment something gets close.
    if (danger && danger.gap < 22) pilot.loop = 0
    if (pilot.hold > 0) {
      pilot.hold--
      held.b = true
      return frame
    }
    if (danger && danger.gap < 30 && this.bCooldown === 0) {
      const d = toward(ship, danger.at)
      const diff = angleDiff(ship.angle, Math.atan2(d.x, -d.y))
      if (Math.abs(diff) > 1.4) {
        // The threat is behind or beside: dash on, away from it.
        held.b = true
        pressed.b = true
        return frame
      }
      if (danger.gap < 10) {
        pilot.hold = DASH.hold + 1
        held.b = true
        pressed.b = true
        return frame
      }
    }

    // A lasso: circle round a cluster with the ribbon out.
    if (pilot.loop > 0) {
      pilot.loop--
      held.up = true
      held[pilot.side] = true
      return frame
    }
    // Loop round a swarm off to one side: the circle's far side wraps behind it.
    if (!danger || danger.gap > 50) {
      const mark = this.swarms.find((s) => {
        const dist = wrapDist(ship, s)
        return dist > 45 && dist < 90
      })
      if (mark && this.tick % 360 < 60) {
        const d = toward(ship, mark)
        pilot.loop = 120
        pilot.side =
          angleDiff(ship.angle, Math.atan2(d.x, -d.y)) > 0 ? 'right' : 'left'
        held.up = true
        held[pilot.side] = true
        return frame
      }
    }

    // Catch a falling net when it is handy.
    const close = danger && danger.gap < 60 ? danger.at : null
    const net = close
      ? undefined
      : this.nets.find((n) => wrapDist(n, ship) < 150)
    let target: Point | null = close ?? net ?? null
    if (!target) {
      // Wrigglers first (before they hatch), then whatever is hungriest, then the nearest.
      let best = Infinity
      for (const p of this.pests) {
        const d = wrapDist(p, ship) - (p.kind === 'wriggler' ? 120 : 0)
        if (d < best) {
          best = d
          target = p
        }
      }
      for (const s of this.swarms) {
        const d = wrapDist(s, ship) - (s.mode === 'seek' ? 80 : 0)
        if (d < best) {
          best = d
          target = s
        }
      }
      if (!target && this.cloud) target = this.cloud
    }
    if (!target) return frame
    const d = toward(ship, target)
    const dist = Math.hypot(d.x, d.y)
    const want = Math.atan2(d.x, -d.y)
    const diff = angleDiff(ship.angle, want)
    if (diff > 0.05) held.right = true
    else if (diff < -0.05) held.left = true
    if (!net && Math.abs(diff) < 0.25 && (close || this.tick % 8 === 0))
      pressed.a = true
    held.up =
      (net ? dist > 20 : dist > 170) &&
      Math.abs(diff) < 0.6 &&
      this.tick % 60 < 30
    return frame
  }

  // --- render ------------------------------------------------------------------------------------

  /** Where the ribbon's unwrapped coordinates sit on the sky. */
  private ribbonShift(): Point {
    return {
      x: this.ship.x - this.unwrapped.x,
      y: this.ship.y - this.unwrapped.y,
    }
  }

  render(g: CanvasRenderingContext2D) {
    cachedLayer(g, 'butterfly-blaster-night', W, H, paintNight)
    renderStars(g, this.tick)
    renderDriftingClouds(g, this.tick)
    for (const pool of this.pools) renderPool(g, pool, this.tick)
    renderWindows(g, this.huts, this.tick)
    renderFireflies(g, this.tick)
    if (this.phase === 'dawn') renderDawn(g, DAWN_TICKS - this.phaseTicks)

    if (this.loopFlash)
      renderLoopFlash(
        g,
        this.loopFlash.loop,
        this.loopFlash.shift,
        this.loopFlash.t,
      )
    if (this.alive) renderRibbon(g, this.ribbon, this.ribbonShift(), this.tick)
    for (const net of this.nets) renderNet(g, net.x, net.y, net.spin, this.tick)
    if (this.fairy)
      renderFairy(
        g,
        this.fairy.x,
        this.fairy.y,
        this.fairy.vx > 0 ? 1 : -1,
        this.fairy.carrying,
        this.tick,
      )
    for (const p of this.pests) renderPest(g, p, this.tick)
    for (const swarm of this.swarms) renderSwarm(g, swarm, this.tick)
    if (this.cloud)
      renderCloud(
        g,
        this.cloud.x,
        this.cloud.y,
        this.cloud.small,
        this.cloud.angry,
        this.tick,
      )
    for (const drop of this.drops) {
      const ramp = drop.fall ? RAMPS.water : SICK
      glow(g, drop.x, drop.y, 9, ramp[3], 0.5)
      shadedOrb(g, drop.x, drop.y, 2.5, ramp, { glint: false })
    }
    for (const p of this.particles) {
      const x = Math.round(p.x)
      const y = Math.round(p.y)
      g.globalAlpha = Math.max(0, p.life / p.max)
      g.fillStyle = INK
      g.fillRect(x - 1, y - 1, 3, 3)
      g.fillStyle = p.color
      g.fillRect(x - 1, y - 1, 2, 2)
    }
    g.globalAlpha = 1
    for (const shot of this.shots) renderSparkle(g, shot, this.tick)
    if (this.dashTrail)
      renderDashTrail(
        g,
        this.dashTrail.from,
        this.dashTrail.to,
        this.dashTrail.t,
      )
    if (
      this.alive &&
      !(this.invuln > DASH.invuln && Math.floor(this.invuln / 6) % 2 === 0)
    ) {
      renderButterfly(g, this.ship.x, this.ship.y, this.ship.angle, this.flap)
      if (
        this.shield > 0 &&
        (this.shield > 90 || Math.floor(this.shield / 8) % 2 === 0)
      ) {
        glow(g, this.ship.x, this.ship.y, 26, RAMPS.teal[3], 0.3)
        renderMesh(g, this.ship.x, this.ship.y, 20, this.tick / 40)
      }
      if (this.brave > 0) {
        drawText(g, 'BRAVE!', this.ship.x, this.ship.y - 30, {
          align: 'center',
          color: RAMPS.gold[4],
          outline: INK,
        })
      }
    }
    for (const bag of this.bags)
      renderBag(g, bag.x, bag.y, bag.count, this.tick)
    this.fx.render(g)
    for (const f of this.floaters) {
      drawText(g, f.text, f.x, f.y, {
        align: 'center',
        color: f.color,
        outline: INK,
        scale: f.scale,
      })
    }
    vignette(g, W, H, 0.3)
    this.renderHud(g)
    if (this.tally) this.renderTally(g, this.tally)
  }

  private renderHud(g: CanvasRenderingContext2D) {
    hudPanel(g, 4, 3, 84, 21)
    drawText(g, String(this.score).padStart(6, '0'), 10, 7, {
      scale: 2,
      color: RAMPS.pink[3],
      shadow: INK,
    })
    const hi = Math.max(this.hiScore, this.score)
    hudPanel(g, W / 2 - 62, 3, 124, 21)
    drawText(g, `HI ${String(hi).padStart(6, '0')}`, W / 2, 7, {
      scale: 2,
      align: 'center',
      color: RAMPS.gold[3],
      shadow: INK,
    })
    const lives = Math.min(this.lives, 6)
    if (lives > 0) {
      hudPanel(g, W - 8 - lives * 14, 3, lives * 14 + 4, 21, RAMPS.pink)
      for (let i = 0; i < lives; i++) {
        const bob = Math.round(Math.sin(this.tick / 12 + i) * 0.6)
        drawSprite(g, LIFE_SPRITE, W - 13 - i * 14, 13 + bob)
      }
    }
    const night = `NIGHT ${this.level}  ${this.wave + 1}/${this.plan.waves.length}`
    const nightW = night.length * 6 + 10
    hudPanel(g, 4, H - 19, nightW, 15)
    drawText(g, night, 10, H - 15, { color: RAMPS.purple[4], outline: INK })
    const unbitten = this.huts.filter((h) => h.bites === 0).length
    const safe = `UNBITTEN ${unbitten}`
    const safeW = safe.length * 6 + 10
    hudPanel(g, W - 4 - safeW, H - 19, safeW, 15, RAMPS.gold)
    drawText(g, safe, W - 10, H - 15, {
      align: 'right',
      color: RAMPS.gold[4],
      outline: INK,
    })
    // The net and B's cooldown sit under the high score, clear of the pools on the ground.
    if (this.shield > 0) {
      hudPanel(g, W / 2 - 60, 27, 120, 15, RAMPS.teal)
      drawText(g, 'NET', W / 2 - 54, 31, { color: RAMPS.teal[4], outline: INK })
      gauge(g, W / 2 - 30, 31, 84, 7, this.shield / SHIELD_TICKS, RAMPS.sky)
    } else if (this.bCooldown > 0) {
      hudPanel(g, W / 2 - 40, 27, 80, 15, RAMPS.purple)
      drawText(g, 'B', W / 2 - 34, 31, { color: RAMPS.purple[4], outline: INK })
      gauge(
        g,
        W / 2 - 24,
        31,
        58,
        7,
        1 - this.bCooldown / DASH.cooldown,
        RAMPS.pink,
      )
    }
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, H / 2 - 40, {
        scale: 3,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.pink[1],
      })
      if (this.banner.sub) {
        drawText(g, this.banner.sub, W / 2, H / 2 - 8, {
          scale: 2,
          align: 'center',
          color: RAMPS.gold[3],
          outline: INK,
        })
      }
    }
  }

  private renderTally(g: CanvasRenderingContext2D, tally: Tally) {
    const t = DAWN_TICKS - this.phaseTicks
    const x = W / 2 - 150
    const y = 70
    const rows = tally.rows.length
    const h = 78 + rows * 18 + (tally.perfect ? 18 : 0)
    hudPanel(g, x, y, 300, h, RAMPS.gold)
    drawText(g, 'DAWN', W / 2, y + 8, {
      scale: 3,
      align: 'center',
      color: '#ffffff',
      outline: INK,
      shadow: RAMPS.rust[1],
    })
    drawText(g, `NIGHT ${this.level} IS OVER`, W / 2, y + 37, {
      align: 'center',
      color: RAMPS.gold[4],
      outline: INK,
    })
    tally.rows.forEach((row, i) => {
      if (t < 40 + i * 30) return
      const ry = y + 54 + i * 18
      drawText(g, row.label, x + 14, ry, {
        color: RAMPS.cream[3],
        outline: INK,
        scale: 1,
      })
      const text =
        row.count === 1 && row.label.endsWith('!')
          ? `+${row.each}`
          : `${row.count} X ${row.each}`
      drawText(g, text, x + 286, ry, {
        align: 'right',
        color: RAMPS.gold[4],
        outline: INK,
      })
    })
    if (t >= 40 + rows * 30) {
      const ry = y + 54 + rows * 18
      if (tally.perfect) {
        drawText(g, '+1 BUTTERFLY FROM THE VILLAGE', W / 2, ry, {
          align: 'center',
          color: RAMPS.pink[3],
          outline: INK,
        })
      }
      drawText(
        g,
        `THANK YOU! ${tally.total}`,
        W / 2,
        ry + (tally.perfect ? 18 : 2),
        {
          scale: 2,
          align: 'center',
          color: '#ffffff',
          outline: INK,
        },
      )
    }
  }
}

/** Every pest kind the game knows, for tests. */
export const PEST_KINDS: readonly PestKind[] = ['wriggler', 'skimmer', 'needle']

const butterflyBlaster: ArcadeGameModule = {
  create: (options) => new ButterflyBlaster(options),
}

export const create = butterflyBlaster.create
export default butterflyBlaster
