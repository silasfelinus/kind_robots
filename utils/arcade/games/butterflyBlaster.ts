// /utils/arcade/games/butterflyBlaster.ts
//
// Butterfly Blaster -- the Kind Robots Arcade's Asteroids riff (Silas,
// 2026-10-06: "rainbow butterflies to kill mosquitoes, a la our malaria
// project"). A rainbow butterfly turns, flutters and drifts around a wrapping
// night sky, sparkling mosquito swarms that split big -> small -> single. AMI,
// the Anti-Malaria Intelligence, flies over now and then and drops a bed net
// that shields the butterfly. A malaria cloud hunts the player from wave 3.
// Every wave cleared keeps one more village safe.

import { levelCurve } from '../curve'
import { drawText } from '../font'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'

const W = 480
const H = 360

const TURN = 0.075
const THRUST = 0.12
const MAX_SPEED = 4.2
const FRICTION = 0.992
const SHOT_SPEED = 6.5
const SHOT_LIFE = 48
const MAX_SHOTS = 5
const FIRE_COOLDOWN = 8
const AUTOFIRE_COOLDOWN = 14
const HOP_COOLDOWN = 60
const RESPAWN_TICKS = 120
const INVULN_TICKS = 150
const SHIELD_TICKS = 480
const EXTRA_LIFE_EVERY = 10_000
const START_LIVES = 3
const SHIP_RADIUS = 9

type Size = 1 | 2 | 3
const SWARM_RADIUS: Record<Size, number> = { 3: 26, 2: 15, 1: 7 }
const SWARM_POINTS: Record<Size, number> = { 3: 20, 2: 50, 1: 100 }
const SWARM_SPEED: Record<Size, number> = { 3: 0.6, 2: 1.0, 1: 1.5 }
const SWARM_COUNT: Record<Size, number> = { 3: 9, 2: 5, 1: 1 }

const RAINBOW = [
  '#ef4444',
  '#f97316',
  '#facc15',
  '#4ade80',
  '#38bdf8',
  '#a78bfa',
  '#f472b6',
]

type Vec = { x: number; y: number; vx: number; vy: number }
type Shot = Vec & { life: number; hue: number }
type Swarm = Vec & { size: Size; seed: number }
type Cloud = Vec & { small: boolean; fire: number; turn: number; hp: number }
type Drop = Vec & { life: number }
type Fairy = Vec & { dropAt: number; carrying: boolean }
type Net = Vec & { spin: number }
type Particle = Vec & { life: number; max: number; color: string }
type Floater = { x: number; y: number; text: string; life: number }
type Star = { x: number; y: number; r: number; phase: number }

export const BLASTER_CURVES = {
  bigSwarms: { start: 4, step: 1, limit: 11 },
  speed: { start: 1, step: 0.07, limit: 1.8 },
  cloudEvery: { start: 1500, step: -90, limit: 600 },
  cloudFire: { start: 90, step: -6, limit: 40 },
  cloudAimError: { start: 0.6, step: -0.06, limit: 0.08 },
  fairyEvery: { start: 1100, step: 120, limit: 2400 },
} as const

function wrap(v: Vec) {
  if (v.x < 0) v.x += W
  else if (v.x >= W) v.x -= W
  if (v.y < 0) v.y += H
  else if (v.y >= H) v.y -= H
}

/** Shortest delta from a to b on the wrapping playfield. */
function wrapDelta(from: number, to: number, span: number): number {
  let d = to - from
  if (d > span / 2) d -= span
  else if (d < -span / 2) d += span
  return d
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function angleDiff(a: number, b: number): number {
  let d = b - a
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return d
}

class ButterflyBlaster implements ArcadeGameInstance {
  score = 0
  level = 0
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tickCount = 0
  private ship = { x: W / 2, y: H / 2, vx: 0, vy: 0, angle: 0 }
  private alive = true
  private respawn = 0
  private invuln = INVULN_TICKS
  private shield = 0
  private fireCooldown = 0
  private hopCooldown = 0
  private flap = 0
  private thrusting = false
  private shots: Shot[] = []
  private swarms: Swarm[] = []
  private cloud: Cloud | null = null
  private cloudTimer = 0
  private drops: Drop[] = []
  private fairy: Fairy | null = null
  private fairyTimer = 0
  private nets: Net[] = []
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private stars: Star[] = []
  private villages = 0
  private nextExtra = EXTRA_LIFE_EVERY
  private waveDelay = 0
  private banner: { text: string; sub?: string; ticks: number } | null = null
  private overTimer = 0

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    for (let i = 0; i < 80; i++) {
      this.stars.push({
        x: this.rng() * W,
        y: this.rng() * (H - 40),
        r: this.rng() < 0.15 ? 1.6 : 0.8,
        phase: this.rng() * Math.PI * 2,
      })
    }
    this.startWave(1)
  }

  // --- setup -------------------------------------------------------------

  private startWave(wave: number) {
    this.level = wave
    const count = Math.round(levelCurve(wave, BLASTER_CURVES.bigSwarms))
    for (let i = 0; i < count; i++) {
      let x: number
      let y: number
      // Spawn along the edges, never on top of the butterfly.
      do {
        if (this.rng() < 0.5) {
          x = this.rng() * W
          y = this.rng() < 0.5 ? 0 : H - 1
        } else {
          x = this.rng() < 0.5 ? 0 : W - 1
          y = this.rng() * H
        }
      } while (dist({ x, y }, this.ship) < 120)
      this.swarms.push(this.makeSwarm(x, y, 3))
    }
    this.cloudTimer = Math.round(
      levelCurve(wave, BLASTER_CURVES.cloudEvery) / 2,
    )
    this.fairyTimer = Math.round(
      levelCurve(wave, BLASTER_CURVES.fairyEvery) / 2,
    )
    this.banner = { text: `WAVE ${wave}`, ticks: 90 }
  }

  private makeSwarm(x: number, y: number, size: Size): Swarm {
    const heading = this.rng() * Math.PI * 2
    const speed =
      SWARM_SPEED[size] *
      levelCurve(this.level, BLASTER_CURVES.speed) *
      (0.7 + this.rng() * 0.6)
    return {
      x,
      y,
      vx: Math.cos(heading) * speed,
      vy: Math.sin(heading) * speed,
      size,
      seed: this.rng() * 1000,
    }
  }

  // --- update ------------------------------------------------------------

  update(input: InputFrame) {
    this.tickCount++
    const controls = this.demo ? this.demoInput() : input

    if (this.alive) this.updateShip(controls)
    else this.tryRespawn()

    this.updateShots()
    this.updateSwarms()
    this.updateCloud()
    this.updateFairy()
    this.updateParticles()
    this.collide()

    if (this.banner && --this.banner.ticks <= 0) this.banner = null

    if (!this.swarms.length && !this.over && this.lives > 0) {
      if (this.waveDelay === 0) {
        this.waveDelay = 150
        this.villages++
        this.cloud = null
        this.drops = []
        this.sound.play('level')
        this.banner = {
          text: 'VILLAGE SAFE!',
          sub: `${this.villages} ${this.villages === 1 ? 'VILLAGE' : 'VILLAGES'} PROTECTED`,
          ticks: 140,
        }
      } else if (--this.waveDelay === 0) {
        this.startWave(this.level + 1)
      }
    }

    if (this.lives <= 0 && !this.alive && ++this.overTimer > 90) {
      this.over = true
    }
  }

  private updateShip(input: InputFrame) {
    const ship = this.ship
    if (input.held.left) ship.angle -= TURN
    if (input.held.right) ship.angle += TURN
    this.thrusting = input.held.up
    if (this.thrusting) {
      ship.vx += Math.sin(ship.angle) * THRUST
      ship.vy -= Math.cos(ship.angle) * THRUST
      const speed = Math.hypot(ship.vx, ship.vy)
      if (speed > MAX_SPEED) {
        ship.vx *= MAX_SPEED / speed
        ship.vy *= MAX_SPEED / speed
      }
      if (this.tickCount % 3 === 0) {
        this.particles.push({
          x: ship.x - Math.sin(ship.angle) * 8,
          y: ship.y + Math.cos(ship.angle) * 8,
          vx: -Math.sin(ship.angle) * 1.2 + (this.rng() - 0.5),
          vy: Math.cos(ship.angle) * 1.2 + (this.rng() - 0.5),
          life: 24,
          max: 24,
          color: RAINBOW[this.tickCount % RAINBOW.length]!,
        })
      }
    }
    ship.vx *= FRICTION
    ship.vy *= FRICTION
    ship.x += ship.vx
    ship.y += ship.vy
    wrap(ship)
    this.flap += this.thrusting ? 0.45 : 0.15

    if (this.fireCooldown > 0) this.fireCooldown--
    const wantsFire =
      (input.pressed.a && this.fireCooldown <= FIRE_COOLDOWN - 4) ||
      (input.held.a && this.fireCooldown === 0)
    if (wantsFire && this.shots.length < MAX_SHOTS) {
      this.shots.push({
        x: ship.x + Math.sin(ship.angle) * 10,
        y: ship.y - Math.cos(ship.angle) * 10,
        vx: ship.vx + Math.sin(ship.angle) * SHOT_SPEED,
        vy: ship.vy - Math.cos(ship.angle) * SHOT_SPEED,
        life: SHOT_LIFE,
        hue: this.tickCount,
      })
      this.fireCooldown = input.pressed.a ? FIRE_COOLDOWN : AUTOFIRE_COOLDOWN
      this.sound.play('shoot')
    }

    if (this.hopCooldown > 0) this.hopCooldown--
    if (input.pressed.b && this.hopCooldown === 0) {
      this.burst(ship.x, ship.y, 10, RAINBOW)
      ship.x = 20 + this.rng() * (W - 40)
      ship.y = 20 + this.rng() * (H - 60)
      ship.vx = 0
      ship.vy = 0
      this.hopCooldown = HOP_COOLDOWN
      this.burst(ship.x, ship.y, 10, RAINBOW)
      this.sound.play('blip')
    }

    if (this.invuln > 0) this.invuln--
    if (this.shield > 0) this.shield--
  }

  private tryRespawn() {
    if (this.lives <= 0) return
    if (this.respawn > 0) {
      this.respawn--
      return
    }
    const centre = { x: W / 2, y: H / 2 }
    const clear = this.swarms.every(
      (swarm) => dist(swarm, centre) > SWARM_RADIUS[swarm.size] + 60,
    )
    if (!clear) return
    Object.assign(this.ship, { x: W / 2, y: H / 2, vx: 0, vy: 0, angle: 0 })
    this.alive = true
    this.invuln = INVULN_TICKS
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
      drop.x += drop.vx
      drop.y += drop.vy
      wrap(drop)
      drop.life--
    }
    this.drops = this.drops.filter((drop) => drop.life > 0)
  }

  private updateSwarms() {
    for (const swarm of this.swarms) {
      swarm.x += swarm.vx
      swarm.y += swarm.vy
      wrap(swarm)
    }
  }

  private updateCloud() {
    if (this.level >= 3 && !this.cloud && this.swarms.length) {
      if (--this.cloudTimer <= 0) {
        const fromLeft = this.rng() < 0.5
        const small = this.level >= 6 && this.rng() < 0.5
        this.cloud = {
          x: fromLeft ? -20 : W + 20,
          y: 40 + this.rng() * (H - 120),
          vx: (fromLeft ? 1 : -1) * (small ? 1.6 : 1.2),
          vy: 0,
          small,
          fire: 60,
          turn: 60,
          hp: 1,
        }
        this.cloudTimer = Math.round(
          levelCurve(this.level, BLASTER_CURVES.cloudEvery),
        )
        this.sound.play('warn')
      }
    }
    const cloud = this.cloud
    if (!cloud) return
    cloud.x += cloud.vx
    cloud.y += cloud.vy
    if (--cloud.turn <= 0) {
      cloud.vy = (this.rng() - 0.5) * 1.6
      cloud.turn = 50 + Math.floor(this.rng() * 40)
    }
    cloud.y = Math.min(H - 70, Math.max(20, cloud.y))
    if (cloud.x < -40 || cloud.x > W + 40) {
      this.cloud = null
      return
    }
    if (--cloud.fire <= 0 && this.alive) {
      const aim = Math.atan2(this.ship.y - cloud.y, this.ship.x - cloud.x)
      const error = levelCurve(this.level, BLASTER_CURVES.cloudAimError)
      const angle =
        aim + (this.rng() - 0.5) * 2 * (cloud.small ? error / 2 : error)
      this.drops.push({
        x: cloud.x,
        y: cloud.y,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3,
        life: 90,
      })
      cloud.fire = Math.round(levelCurve(this.level, BLASTER_CURVES.cloudFire))
    }
  }

  private updateFairy() {
    if (!this.fairy && --this.fairyTimer <= 0 && this.swarms.length) {
      const fromLeft = this.rng() < 0.5
      this.fairy = {
        x: fromLeft ? -16 : W + 16,
        y: 28 + this.rng() * 20,
        vx: fromLeft ? 1.5 : -1.5,
        vy: 0,
        dropAt: 80 + this.rng() * (W - 160),
        carrying: true,
      }
      this.fairyTimer = Math.round(
        levelCurve(this.level, BLASTER_CURVES.fairyEvery),
      )
    }
    const fairy = this.fairy
    if (fairy) {
      fairy.x += fairy.vx
      fairy.y += Math.sin(this.tickCount / 10) * 0.4
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
      net.x += Math.sin((this.tickCount + net.spin * 50) / 30) * 0.4
      net.spin += 0.02
    }
    this.nets = this.nets.filter((net) => net.y < H + 20)
  }

  private updateParticles() {
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
  }

  // --- collisions --------------------------------------------------------

  private addScore(points: number, x: number, y: number) {
    if (this.demo) return
    this.score += points
    this.floaters.push({ x, y, text: String(points), life: 40 })
    if (this.score >= this.nextExtra) {
      this.lives++
      this.nextExtra += EXTRA_LIFE_EVERY
      this.sound.play('extra')
      this.banner = { text: 'EXTRA BUTTERFLY!', ticks: 90 }
    }
  }

  private splitSwarm(index: number) {
    const swarm = this.swarms[index]!
    this.swarms.splice(index, 1)
    this.addScore(SWARM_POINTS[swarm.size], swarm.x, swarm.y)
    this.burst(swarm.x, swarm.y, swarm.size * 6, [
      '#a3e635',
      '#e2e8f0',
      '#94a3b8',
    ])
    this.sound.play('pop')
    if (swarm.size > 1) {
      const next = (swarm.size - 1) as Size
      this.swarms.push(this.makeSwarm(swarm.x, swarm.y, next))
      this.swarms.push(this.makeSwarm(swarm.x, swarm.y, next))
    }
  }

  private collide() {
    // Sparkles vs swarms and the cloud.
    for (const shot of this.shots) {
      if (shot.life <= 0) continue
      const hit = this.swarms.findIndex(
        (swarm) => dist(shot, swarm) < SWARM_RADIUS[swarm.size],
      )
      if (hit >= 0) {
        shot.life = 0
        this.splitSwarm(hit)
        continue
      }
      const cloud = this.cloud
      if (cloud && dist(shot, cloud) < (cloud.small ? 11 : 19)) {
        shot.life = 0
        this.addScore(cloud.small ? 1000 : 200, cloud.x, cloud.y)
        this.burst(cloud.x, cloud.y, 24, ['#65a30d', '#a3e635', '#d9f99d'])
        this.sound.play('boom')
        this.cloud = null
      }
    }
    this.shots = this.shots.filter((shot) => shot.life > 0)

    if (!this.alive) return
    const ship = this.ship

    // Catching AMI's bed net.
    const caught = this.nets.findIndex((net) => dist(net, ship) < 18)
    if (caught >= 0) {
      this.nets.splice(caught, 1)
      this.shield = SHIELD_TICKS
      this.addScore(250, ship.x, ship.y)
      this.sound.play('pickup')
      this.banner = { text: 'BED NET!', sub: 'THANK YOU, AMI', ticks: 70 }
    }

    if (this.invuln > 0) return

    const swarmHit = this.swarms.findIndex(
      (swarm) => dist(swarm, ship) < SWARM_RADIUS[swarm.size] + SHIP_RADIUS - 3,
    )
    const dropHit = this.drops.findIndex(
      (drop) => dist(drop, ship) < SHIP_RADIUS,
    )
    const cloudHit = this.cloud && dist(this.cloud, ship) < SHIP_RADIUS + 14
    if (swarmHit < 0 && dropHit < 0 && !cloudHit) return

    if (this.shield > 0) {
      // The net takes the hit, and catches what hit it.
      if (swarmHit >= 0) this.splitSwarm(swarmHit)
      if (dropHit >= 0) this.drops.splice(dropHit, 1)
      if (cloudHit) this.cloud = null
      this.shield = 0
      this.invuln = 60
      this.burst(ship.x, ship.y, 16, ['#ffffff', '#e0f2fe'])
      this.sound.play('pop')
      return
    }

    if (swarmHit >= 0) this.splitSwarm(swarmHit)
    if (dropHit >= 0) this.drops.splice(dropHit, 1)
    this.loseLife()
  }

  private loseLife() {
    this.alive = false
    this.lives--
    this.respawn = RESPAWN_TICKS
    this.burst(this.ship.x, this.ship.y, 40, RAINBOW)
    this.sound.play('die')
    if (this.lives <= 0) this.banner = { text: 'GAME OVER', ticks: 200 }
  }

  private burst(x: number, y: number, count: number, colors: string[]) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.5 + this.rng() * 2.5
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 30 + Math.floor(this.rng() * 30),
        max: 60,
        color: colors[i % colors.length]!,
      })
    }
  }

  // --- attract-mode pilot ------------------------------------------------

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
    const ship = this.ship
    let target: { x: number; y: number } | null = null
    let best = Infinity
    for (const swarm of this.swarms) {
      const d = Math.hypot(
        wrapDelta(ship.x, swarm.x, W),
        wrapDelta(ship.y, swarm.y, H),
      )
      if (d < best) {
        best = d
        target = swarm
      }
    }
    if (target) {
      const dx = wrapDelta(ship.x, target.x, W)
      const dy = wrapDelta(ship.y, target.y, H)
      const want = Math.atan2(dx, -dy)
      const diff = angleDiff(ship.angle, want)
      if (diff > 0.05) held.right = true
      else if (diff < -0.05) held.left = true
      if (Math.abs(diff) < 0.2 && this.tickCount % 10 === 0) pressed.a = true
      held.up = best > 170 && this.tickCount % 90 < 25
      if (best < 34 && this.hopCooldown === 0 && this.tickCount % 7 === 0) {
        pressed.b = true
      }
    }
    return { held, pressed }
  }

  // --- render ------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    this.renderSky(g)
    for (const net of this.nets) this.renderNet(g, net)
    if (this.fairy) this.renderFairy(g, this.fairy)
    for (const swarm of this.swarms) this.renderSwarm(g, swarm)
    if (this.cloud) this.renderCloud(g, this.cloud)
    for (const drop of this.drops) {
      g.fillStyle = 'rgba(163, 230, 53, 0.35)'
      g.beginPath()
      g.arc(drop.x, drop.y, 4, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = '#d9f99d'
      g.fillRect(drop.x - 1, drop.y - 1, 2, 2)
    }
    for (const shot of this.shots) this.renderSparkle(g, shot)
    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, p.life / p.max)
      g.fillStyle = p.color
      g.fillRect(p.x - 1, p.y - 1, 2, 2)
    }
    g.globalAlpha = 1
    if (
      this.alive &&
      !(this.invuln > 0 && Math.floor(this.invuln / 6) % 2 === 0)
    ) {
      this.renderButterfly(g)
    }
    for (const f of this.floaters) {
      drawText(g, f.text, f.x, f.y, { align: 'center', color: '#fde68a' })
    }
    this.renderHud(g)
  }

  private renderSky(g: CanvasRenderingContext2D) {
    const sky = g.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, '#0b0620')
    sky.addColorStop(1, '#2e1065')
    g.fillStyle = sky
    g.fillRect(0, 0, W, H)
    for (const star of this.stars) {
      const twinkle = 0.5 + 0.5 * Math.sin(star.phase + this.tickCount / 25)
      g.globalAlpha = 0.35 + twinkle * 0.65
      g.fillStyle = '#ffffff'
      g.fillRect(star.x, star.y, star.r, star.r)
    }
    g.globalAlpha = 1
    // Crescent moon.
    g.fillStyle = '#fef3c7'
    g.beginPath()
    g.arc(W - 46, 46, 16, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#0d0724'
    g.beginPath()
    g.arc(W - 40, 41, 15, 0, Math.PI * 2)
    g.fill()
    // The village the butterfly is protecting.
    g.fillStyle = '#1e1b4b'
    g.fillRect(0, H - 14, W, 14)
    const huts = 8
    for (let i = 0; i < huts; i++) {
      const x = 18 + i * ((W - 36) / (huts - 1))
      g.fillStyle = '#1e1b4b'
      g.fillRect(x - 10, H - 26, 20, 14)
      g.beginPath()
      g.moveTo(x - 13, H - 26)
      g.lineTo(x, H - 37)
      g.lineTo(x + 13, H - 26)
      g.closePath()
      g.fill()
      const lit = i < this.villages % (huts + 1) || this.villages > huts
      g.fillStyle = lit ? '#fde68a' : '#312e81'
      g.fillRect(x - 3, H - 21, 6, 5)
    }
  }

  private renderButterfly(g: CanvasRenderingContext2D) {
    const ship = this.ship
    const open = 0.55 + 0.45 * Math.abs(Math.sin(this.flap))
    g.save()
    g.translate(ship.x, ship.y)
    g.rotate(ship.angle)
    const wing = g.createLinearGradient(-12, -10, 12, 10)
    RAINBOW.forEach((color, i) =>
      wing.addColorStop(i / (RAINBOW.length - 1), color),
    )
    g.fillStyle = wing
    for (const side of [-1, 1]) {
      g.save()
      g.scale(side * open, 1)
      g.beginPath()
      g.ellipse(6, -4, 7, 6, -0.5, 0, Math.PI * 2)
      g.fill()
      g.beginPath()
      g.ellipse(5, 5, 5, 4, 0.5, 0, Math.PI * 2)
      g.fill()
      g.restore()
    }
    g.fillStyle = '#3b0764'
    g.beginPath()
    g.ellipse(0, 0, 2, 8, 0, 0, Math.PI * 2)
    g.fill()
    g.strokeStyle = '#3b0764'
    g.lineWidth = 1
    g.beginPath()
    g.moveTo(-1, -7)
    g.lineTo(-4, -12)
    g.moveTo(1, -7)
    g.lineTo(4, -12)
    g.stroke()
    g.restore()
    if (
      this.shield > 0 &&
      (this.shield > 90 || Math.floor(this.shield / 8) % 2 === 0)
    ) {
      this.renderMesh(g, ship.x, ship.y, 15, this.tickCount / 40)
    }
  }

  private renderMesh(
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
    spin: number,
  ) {
    g.save()
    g.translate(x, y)
    g.rotate(spin)
    g.strokeStyle = 'rgba(255, 255, 255, 0.75)'
    g.lineWidth = 1
    g.beginPath()
    g.arc(0, 0, r, 0, Math.PI * 2)
    for (let i = -r + 5; i < r; i += 5) {
      const half = Math.sqrt(r * r - i * i)
      g.moveTo(i, -half)
      g.lineTo(i, half)
      g.moveTo(-half, i)
      g.lineTo(half, i)
    }
    g.stroke()
    g.restore()
  }

  private renderMosquito(
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    heading: number,
    scale: number,
    buzz: number,
  ) {
    g.save()
    g.translate(x, y)
    g.rotate(heading)
    g.scale(scale, scale)
    g.fillStyle =
      buzz > 0 ? 'rgba(226, 232, 240, 0.7)' : 'rgba(226, 232, 240, 0.4)'
    g.beginPath()
    g.ellipse(-2, -3, 4, 2, -0.6, 0, Math.PI * 2)
    g.ellipse(-2, 3, 4, 2, 0.6, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#475569'
    g.beginPath()
    g.ellipse(-3, 0, 4, 1.6, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#1e293b'
    g.beginPath()
    g.arc(2, 0, 2, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#f87171'
    g.fillRect(2.5, -1.2, 1, 1)
    g.strokeStyle = '#1e293b'
    g.lineWidth = 0.8
    g.beginPath()
    g.moveTo(4, 0)
    g.lineTo(8, 0)
    g.stroke()
    g.restore()
  }

  private renderSwarm(g: CanvasRenderingContext2D, swarm: Swarm) {
    const r = SWARM_RADIUS[swarm.size]
    const heading = Math.atan2(swarm.vy, swarm.vx)
    if (swarm.size === 1) {
      this.renderMosquito(
        g,
        swarm.x,
        swarm.y,
        heading,
        1.1,
        this.tickCount % 4 < 2 ? 1 : 0,
      )
      return
    }
    g.fillStyle = 'rgba(132, 204, 22, 0.08)'
    g.beginPath()
    g.arc(swarm.x, swarm.y, r, 0, Math.PI * 2)
    g.fill()
    const count = SWARM_COUNT[swarm.size]
    for (let i = 0; i < count; i++) {
      const orbit =
        swarm.seed + i * 2.4 + this.tickCount * (0.04 + (i % 3) * 0.015)
      const radius = r * (0.35 + ((i * 37) % 10) / 16)
      const mx =
        swarm.x +
        Math.cos(orbit) * radius +
        Math.sin(this.tickCount * 0.9 + i) * 1.2
      const my = swarm.y + Math.sin(orbit * 1.3) * radius * 0.8
      this.renderMosquito(
        g,
        mx,
        my,
        orbit + Math.PI / 2,
        0.75,
        (this.tickCount + i) % 4 < 2 ? 1 : 0,
      )
    }
  }

  private renderCloud(g: CanvasRenderingContext2D, cloud: Cloud) {
    const s = cloud.small ? 0.6 : 1
    g.save()
    g.translate(cloud.x, cloud.y)
    g.scale(s, s)
    g.fillStyle = 'rgba(77, 124, 15, 0.85)'
    for (const [cx, cy, cr] of [
      [-12, 2, 10],
      [0, -4, 13],
      [13, 2, 10],
      [0, 6, 11],
    ] as const) {
      g.beginPath()
      g.arc(cx, cy, cr, 0, Math.PI * 2)
      g.fill()
    }
    g.fillStyle = '#ecfccb'
    g.fillRect(-7, -3, 4, 3)
    g.fillRect(3, -3, 4, 3)
    g.fillStyle = '#1a2e05'
    g.fillRect(-6, -2, 2, 2)
    g.fillRect(4, -2, 2, 2)
    g.fillRect(-8, -6, 5, 1)
    g.fillRect(3, -6, 5, 1)
    g.restore()
  }

  private renderFairy(g: CanvasRenderingContext2D, fairy: Fairy) {
    const flutter = Math.abs(Math.sin(this.tickCount / 4))
    g.save()
    g.translate(fairy.x, fairy.y)
    g.fillStyle = 'rgba(147, 197, 253, 0.6)'
    g.beginPath()
    g.ellipse(-6, -2, 6 * flutter + 1, 4, -0.4, 0, Math.PI * 2)
    g.ellipse(6, -2, 6 * flutter + 1, 4, 0.4, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#3b82f6'
    g.beginPath()
    g.moveTo(-4, 8)
    g.lineTo(0, -2)
    g.lineTo(4, 8)
    g.closePath()
    g.fill()
    g.fillStyle = '#93c5fd'
    g.beginPath()
    g.arc(0, -5, 3.5, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = 'rgba(253, 224, 71, 0.9)'
    g.beginPath()
    g.arc(fairy.vx > 0 ? 7 : -7, 2, 2.5 + flutter, 0, Math.PI * 2)
    g.fill()
    g.restore()
    if (fairy.carrying) this.renderMesh(g, fairy.x, fairy.y + 13, 6, 0)
  }

  private renderNet(g: CanvasRenderingContext2D, net: Net) {
    g.fillStyle = 'rgba(255, 255, 255, 0.12)'
    g.beginPath()
    g.arc(net.x, net.y, 11, 0, Math.PI * 2)
    g.fill()
    this.renderMesh(g, net.x, net.y, 8, net.spin)
  }

  private renderSparkle(g: CanvasRenderingContext2D, shot: Shot) {
    const color = shot.hue % 2 ? '#f9a8d4' : '#fde68a'
    g.fillStyle = 'rgba(253, 230, 138, 0.25)'
    g.beginPath()
    g.arc(shot.x, shot.y, 4, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = color
    g.fillRect(shot.x - 3, shot.y - 0.5, 6, 1)
    g.fillRect(shot.x - 0.5, shot.y - 3, 1, 6)
    g.fillStyle = '#ffffff'
    g.fillRect(shot.x - 1, shot.y - 1, 2, 2)
  }

  private renderHud(g: CanvasRenderingContext2D) {
    const shadow = '#1e1b4b'
    drawText(g, String(this.score).padStart(6, '0'), 8, 8, {
      scale: 2,
      color: '#f9a8d4',
      shadow,
    })
    const hi = Math.max(this.hiScore, this.score)
    drawText(g, `HI ${String(hi).padStart(6, '0')}`, W / 2, 8, {
      scale: 2,
      align: 'center',
      color: '#fde68a',
      shadow,
    })
    for (let i = 0; i < Math.min(this.lives, 6); i++) {
      drawText(g, '*', W - 14 - i * 14, 8, {
        scale: 2,
        color: '#f472b6',
        shadow,
      })
    }
    drawText(g, `WAVE ${this.level}`, 8, H - 10, { color: '#c4b5fd' })
    drawText(g, `VILLAGES SAFE ${this.villages}`, W - 8, H - 10, {
      align: 'right',
      color: '#fde68a',
    })
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, H / 2 - 30, {
        scale: 3,
        align: 'center',
        color: '#ffffff',
        shadow: '#db2777',
      })
      if (this.banner.sub) {
        drawText(g, this.banner.sub, W / 2, H / 2 + 2, {
          scale: 2,
          align: 'center',
          color: '#fde68a',
          shadow,
        })
      }
    }
  }
}

const butterflyBlaster: ArcadeGameModule = {
  create: (options) => new ButterflyBlaster(options),
}

export const create = butterflyBlaster.create
export default butterflyBlaster
