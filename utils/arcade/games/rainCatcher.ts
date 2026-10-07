// /utils/arcade/games/rainCatcher.ts
//
// Rain Catcher -- the Kind Robots Arcade's Missile Command riff (conductor
// kr-arcade/t-009 game factory, batch 3). Storm clouds drop hailstones toward
// six seedling beds. Steer the sight and pop rainbow umbrella bursts from the
// three sprout launchers: a burst blooms where the sight was and catches any
// hail that drifts into it. Hail that gets through makes a bed droop, and a
// second hit wilts it (or it soaks a launcher until the next wave).
//
// Each wave brings more and faster hail; from wave 2 hail can split in two
// and a grumpy thunder-goose flies across dropping more; from wave 5 zippy
// lightning sprites swerve around blooms. Unused umbrellas and saved beds pay
// a bonus between waves, and every 10,000 points a wilted bed grows back. The
// game ends when every bed has wilted.
//
// Arrows move the sight (it speeds up while held); A or B fires from the
// nearest launcher that still has umbrellas.

import { levelCurve } from '../curve'
import { drawText } from '../font'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'

const W = 320
const H = 240
const GROUND = 214
const SKY_TOP = 16
const SIGHT_MIN_Y = 26
const SIGHT_MAX_Y = 196
const AMMO = 10
const SHOT_SPEED = 5
const BLOOM_GROW = 18
const BLOOM_HOLD = 10
const BLOOM_FADE = 14
const BLOOM_RADIUS = 16
const WAVE_CLEAR_TICKS = 170
const WAVE_READY_TICKS = 80
const END_TICKS = 200
const BONUS_BED_EVERY = 10_000
/** Hits a bed takes: the first makes it droop, the second wilts it. */
const BED_HEALTH = 2

const HAIL_POINTS = 25
const GOOSE_POINTS = 100
const SPRITE_POINTS = 125
const AMMO_BONUS = 5
const BED_BONUS = 100

/** Launchers left, middle, right; beds in the two gaps between them. */
const LAUNCHERS = [22, 160, 298]
const BEDS = [54, 86, 118, 202, 234, 266]

export const RAIN_CURVES = {
  /** Hailstones per wave (not counting splits or the goose's drops). */
  hail: { start: 10, step: 3, limit: 40 },
  /** Pixels per tick a hailstone falls (along its path). */
  speed: { start: 0.3, step: 0.06, limit: 1.1 },
  /** Hail in the air at once before the clouds hold back. */
  inFlight: { start: 4, step: 1, limit: 10 },
  /** Ticks between volleys. */
  volleyEvery: { start: 120, step: -8, limit: 50 },
  splitChance: { start: 0, step: 0.06, limit: 0.35 },
  geese: { start: 0, step: 1, limit: 3 },
  sprites: { start: -3, step: 1, limit: 4 },
} as const

type Hail = {
  x0: number
  y0: number
  x: number
  y: number
  tx: number
  ty: number
  vx: number
  vy: number
  /** A lightning sprite: swerves around blooms. */
  sprite: boolean
  split: boolean
}
type Shot = {
  x: number
  y: number
  tx: number
  ty: number
  vx: number
  vy: number
  from: number
}
type Bloom = { x: number; y: number; t: number }
type Goose = { x: number; y: number; vx: number; dropTimer: number }
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = { x: number; y: number; text: string; life: number }

const RAINBOW = [
  '#f87171',
  '#fb923c',
  '#facc15',
  '#4ade80',
  '#38bdf8',
  '#a78bfa',
]

class RainCatcher implements ArcadeGameInstance {
  score = 0
  level = 1
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private sightX = W / 2
  private sightY = 110
  private held = 0
  /** Each bed's health: BED_HEALTH growing, 1 drooping, 0 wilted. */
  private beds: number[] = BEDS.map(() => BED_HEALTH)
  private ammo: number[] = LAUNCHERS.map(() => AMMO)
  private soaked: boolean[] = LAUNCHERS.map(() => false)
  private hail: Hail[] = []
  private shots: Shot[] = []
  private blooms: Bloom[] = []
  private geese: Goose[] = []
  private toRelease = 0
  private geeseLeft = 0
  private spritesLeft = 0
  private volleyTimer = 0
  private ready = WAVE_READY_TICKS
  private clear = 0
  private ending = 0
  private nextBonusBed = BONUS_BED_EVERY
  private bonusBeds = 0
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.startWave(1)
  }

  /** Beds still growing (the cabinet shows these as lives). */
  get lives(): number {
    return this.beds.filter((b) => b > 0).length
  }

  private get multiplier(): number {
    return Math.min(6, 1 + Math.floor((this.level - 1) / 2))
  }

  // --- waves -------------------------------------------------------------------

  private startWave(wave: number) {
    this.level = wave
    this.ammo = LAUNCHERS.map(() => AMMO)
    this.soaked = LAUNCHERS.map(() => false)
    this.hail = []
    this.shots = []
    this.blooms = []
    this.geese = []
    this.toRelease = Math.round(levelCurve(wave, RAIN_CURVES.hail))
    this.geeseLeft = Math.round(levelCurve(wave, RAIN_CURVES.geese))
    this.spritesLeft = Math.max(
      0,
      Math.round(levelCurve(wave, RAIN_CURVES.sprites)),
    )
    this.volleyTimer = 30
    this.ready = WAVE_READY_TICKS
    this.banner = {
      text: `WAVE ${wave}`,
      sub:
        this.multiplier > 1 ? `${this.multiplier}X POINTS` : 'CATCH THE HAIL',
      ticks: WAVE_READY_TICKS,
    }
  }

  /** Something on the ground for a hailstone to aim at: a growing bed or a launcher. */
  private pickTarget(): { x: number; y: number } {
    const targets: number[] = []
    BEDS.forEach((x, i) => {
      if (this.beds[i]! > 0) targets.push(x)
    })
    LAUNCHERS.forEach((x, i) => {
      if (!this.soaked[i]) targets.push(x)
    })
    if (!targets.length) targets.push(...BEDS)
    const x = targets[Math.floor(this.rng() * targets.length)]!
    return { x: x + (this.rng() - 0.5) * 6, y: GROUND - 4 }
  }

  /** A hailstone (or lightning sprite) falling from (x0, y0) at something on the ground. */
  private makeHail(x0: number, y0: number, sprite = false): Hail {
    const t = this.pickTarget()
    const speed =
      levelCurve(this.level, RAIN_CURVES.speed) * (sprite ? 1.25 : 1)
    const dx = t.x - x0
    const dy = t.y - y0
    const d = Math.hypot(dx, dy) || 1
    return {
      x0,
      y0,
      x: x0,
      y: y0,
      tx: t.x,
      ty: t.y,
      vx: (dx / d) * speed,
      vy: (dy / d) * speed,
      sprite,
      split: false,
    }
  }

  private launchHail(x0: number, y0: number, sprite = false) {
    this.hail.push(this.makeHail(x0, y0, sprite))
  }

  private release() {
    const cap = Math.round(levelCurve(this.level, RAIN_CURVES.inFlight))
    if (--this.volleyTimer > 0) return
    this.volleyTimer = Math.round(
      levelCurve(this.level, RAIN_CURVES.volleyEvery),
    )
    let volley = 1 + Math.floor(this.rng() * 3)
    while (volley-- > 0 && this.toRelease > 0 && this.hail.length < cap) {
      this.toRelease--
      this.launchHail(8 + this.rng() * (W - 16), SKY_TOP + 2)
    }
    if (this.spritesLeft > 0 && this.rng() < 0.35) {
      this.spritesLeft--
      this.launchHail(8 + this.rng() * (W - 16), SKY_TOP + 2, true)
    }
    if (this.geeseLeft > 0 && !this.geese.length && this.rng() < 0.3) {
      this.geeseLeft--
      const fromLeft = this.rng() < 0.5
      this.geese.push({
        x: fromLeft ? -12 : W + 12,
        y: 48 + this.rng() * 40,
        vx: (fromLeft ? 1 : -1) * (0.45 + this.level * 0.04),
        dropTimer: 60,
      })
      this.sound.play('warn')
    }
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    if (this.ending > 0) {
      if (--this.ending === 0) this.over = true
      return
    }
    const controls = this.demo ? this.demoInput() : input
    this.moveSight(controls)
    if (this.clear > 0) {
      if (--this.clear === 0) this.startWave(this.level + 1)
      return
    }
    if (this.ready > 0) {
      this.ready--
      return
    }
    if (controls.pressed.a || controls.pressed.b) this.fire()
    this.release()
    this.updateGeese()
    this.updateShots()
    this.updateBlooms()
    this.updateHail()
    if (!this.beds.some((b) => b > 0)) {
      this.ending = END_TICKS
      this.banner = {
        text: 'THE GARDEN IS SOAKED',
        sub: 'GAME OVER',
        ticks: 9999,
      }
      this.sound.play('die')
      return
    }
    const quiet =
      !this.toRelease &&
      !this.hail.length &&
      !this.geese.length &&
      !this.geeseLeft &&
      !this.spritesLeft &&
      !this.shots.length &&
      !this.blooms.length
    if (quiet) this.waveClear()
  }

  private moveSight(input: InputFrame) {
    const dx = (input.held.right ? 1 : 0) - (input.held.left ? 1 : 0)
    const dy = (input.held.down ? 1 : 0) - (input.held.up ? 1 : 0)
    if (!dx && !dy) {
      this.held = 0
      return
    }
    // Held longer, the sight glides faster.
    this.held++
    const speed = Math.min(4.5, 1.6 + this.held * 0.09)
    const len = Math.hypot(dx, dy)
    this.sightX = Math.max(6, Math.min(W - 6, this.sightX + (dx / len) * speed))
    this.sightY = Math.max(
      SIGHT_MIN_Y,
      Math.min(SIGHT_MAX_Y, this.sightY + (dy / len) * speed),
    )
  }

  private fire() {
    // The nearest launcher that still has an umbrella.
    let best = -1
    for (let i = 0; i < LAUNCHERS.length; i++) {
      if (this.soaked[i] || this.ammo[i]! <= 0) continue
      if (
        best < 0 ||
        Math.abs(LAUNCHERS[i]! - this.sightX) <
          Math.abs(LAUNCHERS[best]! - this.sightX)
      )
        best = i
    }
    if (best < 0) {
      this.sound.play('blip')
      return
    }
    this.ammo[best]!--
    const x = LAUNCHERS[best]!
    const y = GROUND - 10
    const dx = this.sightX - x
    const dy = this.sightY - y
    const d = Math.hypot(dx, dy) || 1
    const speed = SHOT_SPEED + (best === 1 ? 1.5 : 0)
    this.shots.push({
      x,
      y,
      tx: this.sightX,
      ty: this.sightY,
      vx: (dx / d) * speed,
      vy: (dy / d) * speed,
      from: best,
    })
    this.sound.play('shoot')
  }

  private updateShots() {
    for (const s of this.shots) {
      s.x += s.vx
      s.y += s.vy
      if ((s.tx - s.x) * s.vx + (s.ty - s.y) * s.vy <= 0) {
        this.blooms.push({ x: s.tx, y: s.ty, t: 0 })
        s.vx = 0
        s.vy = 0
      }
    }
    this.shots = this.shots.filter((s) => s.vx !== 0 || s.vy !== 0)
  }

  private bloomRadius(b: Bloom): number {
    if (b.t < BLOOM_GROW) return (BLOOM_RADIUS * b.t) / BLOOM_GROW
    if (b.t < BLOOM_GROW + BLOOM_HOLD) return BLOOM_RADIUS
    return (
      (BLOOM_RADIUS * (BLOOM_GROW + BLOOM_HOLD + BLOOM_FADE - b.t)) / BLOOM_FADE
    )
  }

  private updateBlooms() {
    for (const b of this.blooms) b.t++
    this.blooms = this.blooms.filter(
      (b) => b.t < BLOOM_GROW + BLOOM_HOLD + BLOOM_FADE,
    )
    for (const b of this.blooms) {
      const r = this.bloomRadius(b)
      for (const h of this.hail) {
        if (Math.hypot(h.x - b.x, h.y - b.y) > r) continue
        this.catchHail(h)
      }
      for (const goose of this.geese) {
        if (Math.hypot(goose.x - b.x, goose.y - b.y) > r + 6) continue
        goose.vx = 0
        this.addScore(GOOSE_POINTS * this.multiplier, goose.x, goose.y - 10)
        this.burst(goose.x, goose.y, 14, '#e5e7eb')
        this.sound.play('pop')
      }
      this.geese = this.geese.filter((goose) => goose.vx !== 0)
    }
    this.hail = this.hail.filter((h) => h.vy !== 0 || h.vx !== 0)
  }

  private catchHail(h: Hail) {
    if (h.vx === 0 && h.vy === 0) return
    h.vx = 0
    h.vy = 0
    const points = (h.sprite ? SPRITE_POINTS : HAIL_POINTS) * this.multiplier
    this.addScore(points, h.x, h.y - 8)
    this.burst(h.x, h.y, 6, h.sprite ? '#fde047' : '#e0f2fe')
    this.sound.play('pop')
  }

  private updateGeese() {
    for (const goose of this.geese) {
      goose.x += goose.vx
      if (--goose.dropTimer <= 0 && goose.x > 20 && goose.x < W - 20) {
        goose.dropTimer = 70 + Math.floor(this.rng() * 50)
        this.launchHail(goose.x, goose.y + 6)
      }
    }
    this.geese = this.geese.filter((goose) => goose.x > -20 && goose.x < W + 20)
  }

  private updateHail() {
    const splitChance = levelCurve(this.level, RAIN_CURVES.splitChance)
    const born: Hail[] = []
    for (const h of this.hail) {
      if (h.sprite) this.swerve(h)
      h.x += h.vx
      h.y += h.vy
      // Midway down, a stone may split in two (once).
      if (
        !h.split &&
        !h.sprite &&
        h.y > 70 &&
        h.y < 130 &&
        this.rng() < splitChance / 60
      ) {
        h.split = true
        const child = this.makeHail(h.x, h.y)
        child.split = true
        born.push(child)
      }
      if (h.y >= h.ty) this.land(h)
    }
    this.hail = [...this.hail, ...born].filter((h) => h.vx !== 0 || h.vy !== 0)
  }

  /** A lightning sprite sidesteps a bloom in its way. */
  private swerve(h: Hail) {
    const near = this.blooms.find(
      (b) => Math.hypot(h.x - b.x, h.y + 10 - b.y) < BLOOM_RADIUS + 14,
    )
    if (!near) return
    const away = Math.sign(h.x - near.x) || 1
    h.x += away * 1.2
    // Re-aim at the target from the new spot.
    const dx = h.tx - h.x
    const dy = h.ty - h.y
    const d = Math.hypot(dx, dy) || 1
    const speed = Math.hypot(h.vx, h.vy)
    h.vx = (dx / d) * speed
    h.vy = (dy / d) * speed
  }

  private land(h: Hail) {
    h.vx = 0
    h.vy = 0
    const bed = BEDS.findIndex((x) => Math.abs(x - h.x) < 12)
    const launcher = LAUNCHERS.findIndex((x) => Math.abs(x - h.x) < 12)
    if (bed >= 0 && this.beds[bed]! > 0) {
      this.beds[bed]!--
      this.burst(h.x, GROUND - 4, 14, '#93c5fd')
      this.sound.play(this.beds[bed] ? 'warn' : 'boom')
    } else if (launcher >= 0 && !this.soaked[launcher]) {
      this.soaked[launcher] = true
      this.ammo[launcher] = 0
      this.burst(h.x, GROUND - 6, 12, '#93c5fd')
      this.sound.play('boom')
    } else {
      this.burst(h.x, GROUND - 2, 4, '#bfdbfe')
    }
  }

  private waveClear() {
    const umbrellas = this.ammo.reduce((sum, a) => sum + a, 0)
    const beds = this.lives
    const bonus = (umbrellas * AMMO_BONUS + beds * BED_BONUS) * this.multiplier
    this.addScore(bonus, W / 2, 120)
    // A drooping bed perks up between waves; bonus beds regrow wilted ones.
    this.beds = this.beds.map((b) => (b > 0 ? BED_HEALTH : 0))
    let regrown = 0
    while (this.bonusBeds > 0) {
      const wilted = this.beds.findIndex((b) => b === 0)
      if (wilted < 0) break
      this.beds[wilted] = BED_HEALTH
      this.bonusBeds--
      regrown++
    }
    this.clear = WAVE_CLEAR_TICKS
    this.banner = {
      text: 'WAVE CLEAR!',
      sub: regrown ? `BONUS ${bonus}  A BED GROWS BACK` : `BONUS ${bonus}`,
      ticks: WAVE_CLEAR_TICKS,
    }
    this.sound.play(regrown ? 'extra' : 'level')
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x: number, y: number) {
    if (this.demo) return
    this.score += points
    this.floaters.push({ x, y, text: String(points), life: 40 })
    while (this.score >= this.nextBonusBed) {
      this.nextBonusBed += BONUS_BED_EVERY
      this.bonusBeds++
    }
  }

  private burst(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.4 + this.rng() * 1.4
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 0.3,
        life: 16 + Math.floor(this.rng() * 14),
        color,
      })
    }
  }

  private updateEffects() {
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.04
      p.life--
    }
    this.particles = this.particles.filter((p) => p.life > 0)
    for (const f of this.floaters) {
      f.y -= 0.4
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
  }

  // --- attract-mode pilot -----------------------------------------------------

  /** Aims ahead of the most urgent hailstone and fires once the sight is on it. */
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
    const covered = (x: number, y: number) =>
      this.blooms.some(
        (b) =>
          b.t < BLOOM_GROW + BLOOM_HOLD && Math.hypot(b.x - x, b.y - y) < 14,
      ) || this.shots.some((s) => Math.hypot(s.tx - x, s.ty - y) < 14)
    const threats = this.hail
      .map((h) => ({ h, eta: (h.ty - h.y) / Math.max(0.01, h.vy) }))
      .sort((a, b) => a.eta - b.eta)
    for (const { h } of threats) {
      // Lead the stone by the time a burst would take to get there and bloom.
      let px = h.x
      let py = h.y
      for (let i = 0; i < 3; i++) {
        const launcher = LAUNCHERS.reduce((a, b) =>
          Math.abs(a - px) < Math.abs(b - px) ? a : b,
        )
        const t =
          Math.hypot(px - launcher, py - (GROUND - 10)) / SHOT_SPEED +
          BLOOM_GROW * 0.6
        px = h.x + h.vx * t
        py = h.y + h.vy * t
      }
      if (py > SIGHT_MAX_Y || py < SIGHT_MIN_Y + 10 || covered(px, py)) continue
      const dx = px - this.sightX
      const dy = py - this.sightY
      if (dx < -2) held.left = true
      if (dx > 2) held.right = true
      if (dy < -2) held.up = true
      if (dy > 2) held.down = true
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6 && this.tick % 6 === 0)
        frame.pressed.a = true
      return frame
    }
    return frame
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    this.renderSky(g)
    for (const goose of this.geese) this.renderGoose(g, goose)
    for (const h of this.hail) this.renderHail(g, h)
    for (const s of this.shots) {
      g.strokeStyle = 'rgba(255, 255, 255, 0.35)'
      g.lineWidth = 1
      g.beginPath()
      g.moveTo(LAUNCHERS[s.from]!, GROUND - 10)
      g.lineTo(s.x, s.y)
      g.stroke()
      g.fillStyle = '#ffffff'
      g.fillRect(s.x - 1, s.y - 1, 3, 3)
    }
    for (const b of this.blooms) this.renderBloom(g, b)
    this.renderGround(g)
    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, p.life / 30)
      g.fillStyle = p.color
      g.fillRect(p.x - 1, p.y - 1, 2, 2)
    }
    g.globalAlpha = 1
    for (const f of this.floaters)
      drawText(g, f.text, f.x, f.y, { align: 'center', color: '#fde68a' })
    if (!this.over && this.ending === 0) this.renderSight(g)
    this.renderHud(g)
  }

  private renderSky(g: CanvasRenderingContext2D) {
    const sky = g.createLinearGradient(0, 0, 0, GROUND)
    sky.addColorStop(0, '#1e1b4b')
    sky.addColorStop(1, '#3b4a7a')
    g.fillStyle = sky
    g.fillRect(0, 0, W, H)
    // Storm clouds along the top.
    for (let i = 0; i < 9; i++) {
      const x = ((i * 41 + this.tick * 0.08) % (W + 40)) - 20
      g.fillStyle = i % 2 ? '#475569' : '#334155'
      g.beginPath()
      g.ellipse(x, SKY_TOP + 2, 26, 9, 0, 0, Math.PI * 2)
      g.fill()
    }
  }

  private renderHail(g: CanvasRenderingContext2D, h: Hail) {
    g.strokeStyle = h.sprite
      ? 'rgba(253, 224, 71, 0.5)'
      : 'rgba(186, 230, 253, 0.4)'
    g.lineWidth = 1
    g.beginPath()
    g.moveTo(h.x0, h.y0)
    g.lineTo(h.x, h.y)
    g.stroke()
    if (h.sprite) {
      // A zippy little lightning sprite.
      g.fillStyle = Math.floor(this.tick / 4) % 2 ? '#fde047' : '#fef9c3'
      g.beginPath()
      g.moveTo(h.x - 2, h.y - 4)
      g.lineTo(h.x + 2, h.y - 1)
      g.lineTo(h.x, h.y)
      g.lineTo(h.x + 2, h.y + 4)
      g.lineTo(h.x - 2, h.y + 1)
      g.lineTo(h.x, h.y)
      g.fill()
      return
    }
    g.fillStyle = '#e0f2fe'
    g.fillRect(h.x - 1.5, h.y - 1.5, 3, 3)
    g.fillStyle = '#ffffff'
    g.fillRect(h.x - 0.5, h.y - 1.5, 1, 1)
  }

  private renderBloom(g: CanvasRenderingContext2D, b: Bloom) {
    const r = this.bloomRadius(b)
    if (r <= 0.5) return
    // A rainbow umbrella burst: rings of colour.
    for (let i = 0; i < RAINBOW.length; i++) {
      const ring = r * (1 - i / RAINBOW.length)
      if (ring <= 0.5) continue
      g.fillStyle = RAINBOW[(i + Math.floor(this.tick / 4)) % RAINBOW.length]!
      g.globalAlpha = 0.55
      g.beginPath()
      g.arc(b.x, b.y, ring, 0, Math.PI * 2)
      g.fill()
    }
    g.globalAlpha = 1
  }

  private renderGoose(g: CanvasRenderingContext2D, goose: Goose) {
    const flap = Math.floor(this.tick / 8) % 2
    const dir = Math.sign(goose.vx) || 1
    g.fillStyle = '#e5e7eb'
    g.fillRect(goose.x - 6, goose.y - 3, 12, 6)
    g.fillStyle = '#d1d5db'
    g.fillRect(goose.x - 3, goose.y - 3 - (flap ? 4 : -2), 7, 3)
    // Grumpy head and orange beak.
    g.fillStyle = '#374151'
    g.fillRect(goose.x + dir * 6 - 2, goose.y - 6, 4, 4)
    g.fillStyle = '#fb923c'
    g.fillRect(goose.x + dir * 9 - 1, goose.y - 5, 3, 2)
    // A little storm cloud trailing it.
    g.fillStyle = 'rgba(71, 85, 105, 0.8)'
    g.beginPath()
    g.ellipse(goose.x - dir * 10, goose.y + 6, 6, 3, 0, 0, Math.PI * 2)
    g.fill()
  }

  private renderGround(g: CanvasRenderingContext2D) {
    g.fillStyle = '#14532d'
    g.fillRect(0, GROUND, W, H - GROUND)
    g.fillStyle = '#166534'
    for (let x = 0; x < W; x += 8) g.fillRect(x, GROUND, 4, 2)
    BEDS.forEach((x, i) => this.renderBed(g, x, this.beds[i]!))
    LAUNCHERS.forEach((x, i) => this.renderLauncher(g, x, i))
  }

  private renderBed(g: CanvasRenderingContext2D, x: number, health: number) {
    g.fillStyle = '#78350f'
    g.fillRect(x - 10, GROUND - 3, 20, 5)
    if (health === 0) {
      // Wilted: flattened grey stalks in a puddle.
      g.fillStyle = 'rgba(147, 197, 253, 0.6)'
      g.fillRect(x - 11, GROUND - 1, 22, 2)
      g.fillStyle = '#6b7280'
      g.fillRect(x - 7, GROUND - 4, 6, 1)
      g.fillRect(x + 1, GROUND - 4, 6, 1)
      return
    }
    // Three seedlings swaying (bent over and paler while drooping).
    const droop = health < BED_HEALTH
    for (let s = -1; s <= 1; s++) {
      const sx = x + s * 6
      const sway = droop ? 2 : Math.round(Math.sin(this.tick / 20 + sx) * 1)
      const tall = droop ? 4 : 6
      g.fillStyle = droop ? '#a3a35a' : '#4ade80'
      g.fillRect(sx, GROUND - 3 - tall, 1, tall)
      g.fillStyle = droop ? '#bef264' : '#86efac'
      g.fillRect(sx - 2 + sway, GROUND - 4 - tall, 2, 2)
      g.fillRect(sx + 1 + sway, GROUND - 5 - tall + (droop ? 2 : 0), 2, 2)
    }
  }

  private renderLauncher(g: CanvasRenderingContext2D, x: number, i: number) {
    const soaked = this.soaked[i]
    // A sprout launcher: a pot with a big leafy cannon.
    g.fillStyle = soaked ? '#475569' : '#b45309'
    g.fillRect(x - 9, GROUND - 8, 18, 8)
    g.fillStyle = soaked ? '#64748b' : '#22c55e'
    g.beginPath()
    g.arc(x, GROUND - 10, 6, Math.PI, 0)
    g.fill()
    g.fillRect(x - 1, GROUND - 20, 3, 10)
    // Umbrella pips.
    const ammo = this.ammo[i]!
    for (let k = 0; k < ammo; k++) {
      g.fillStyle = RAINBOW[k % RAINBOW.length]!
      g.fillRect(x - 9 + (k % 5) * 4, GROUND + 4 + Math.floor(k / 5) * 4, 3, 3)
    }
    if (soaked && Math.floor(this.tick / 20) % 2 === 0)
      drawText(g, 'SOAKED', x, GROUND - 30, {
        align: 'center',
        color: '#93c5fd',
      })
  }

  private renderSight(g: CanvasRenderingContext2D) {
    const x = Math.round(this.sightX)
    const y = Math.round(this.sightY)
    g.strokeStyle = '#fde047'
    g.lineWidth = 1
    g.strokeRect(x - 5.5, y - 5.5, 11, 11)
    g.fillStyle = '#fde047'
    g.fillRect(x - 9, y, 4, 1)
    g.fillRect(x + 6, y, 4, 1)
    g.fillRect(x, y - 9, 1, 4)
    g.fillRect(x, y + 6, 1, 4)
  }

  private renderHud(g: CanvasRenderingContext2D) {
    const shadow = '#1e1b4b'
    drawText(g, String(this.score).padStart(6, '0'), 4, 3, {
      scale: 2,
      color: '#fde047',
      shadow,
    })
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W - 4, 2, {
      align: 'right',
      color: '#f9a8d4',
      shadow,
    })
    drawText(g, `WAVE ${this.level}`, W - 4, 10, {
      align: 'right',
      color: '#a5f3fc',
      shadow,
    })
    if (this.multiplier > 1)
      drawText(g, `${this.multiplier}X`, 84, 6, { color: '#fdba74', shadow })
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, 92, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        shadow: '#7c3aed',
      })
      if (this.banner.sub)
        drawText(g, this.banner.sub, W / 2, 112, {
          align: 'center',
          color: '#fde68a',
          shadow,
        })
    }
  }
}

const rainCatcher: ArcadeGameModule = {
  create: (options) => new RainCatcher(options),
}

export const create = rainCatcher.create
export default rainCatcher
