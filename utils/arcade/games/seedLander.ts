// /utils/arcade/games/seedLander.ts
//
// Seed Lander -- the Kind Robots Arcade's Lunar Lander riff (conductor
// kr-arcade/t-009 game factory, batch 3). Pilot a seed pod down onto the
// garden pads of a windy hillside. Puffs of air slow the fall and push the pod
// the way it leans; land soft, slow and level on a pad to plant the seed. The
// narrower the pad, the bigger the bloom (and the points).
//
// A bumpy touchdown on a pad (a bit too fast) still plants, for fewer points.
// Touch down much too fast, too tilted, or off a pad and the pod bonks: its
// seeds scatter (a few wildflowers sprout) and a spare pod drops in. Every planting refills a little sunlight
// (the puff fuel) and moves on to a new hillside: rougher ground, narrower
// pads, gustier wind (LANDER_CURVES). The run ends when the pods run out.
//
// Left/right lean the pod; Up or A puffs (B too). The gauges go green when the
// speed is safe to land.

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
const HUD_H = 26
const GRAVITY = 0.011
const THRUST = 0.03
const TURN = 0.045
const MAX_TILT = Math.PI / 2
const FUEL_MAX = 900
const FUEL_REFILL = 260
const START_PODS = 3
const SAFE_VY = 0.55
const SAFE_VX = 0.4
const SAFE_TILT = 0.22
/** Up to this much faster than safe still plants, as a bumpy landing. */
const BUMPY = 1.7
const BONK_POINTS = 15
const POD_HALF = 5
const POD_FEET = 6
const PLANT_TICKS = 140
const BONK_TICKS = 110
const SEGMENTS = 32

export const LANDER_CURVES = {
  /** How far the ground rises and falls between points. */
  rough: { start: 18, step: 4, limit: 46 },
  /** Pad widths, widest first. */
  padWide: { start: 46, step: -3, limit: 26 },
  padNarrow: { start: 22, step: -2, limit: 12 },
  /** Strongest gust (horizontal push per tick). */
  wind: { start: 0, step: 0.0012, limit: 0.008 },
} as const

type Pad = { x0: number; x1: number; y: number; mult: number }
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = { x: number; y: number; text: string; life: number }

class SeedLander implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = START_PODS
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private ground: number[] = []
  private pads: Pad[] = []
  private planted: Array<{ x: number; y: number; color: string }> = []
  private x = 0
  private y = 0
  private vx = 0
  private vy = 0
  private tilt = 0
  private fuel = FUEL_MAX
  private puffing = false
  private wind = 0
  private windTarget = 0
  private plant = 0
  private bonk = 0
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.buildHill(1)
  }

  // --- the hillside --------------------------------------------------------------

  private buildHill(hill: number) {
    this.level = hill
    const rough = levelCurve(hill, LANDER_CURVES.rough)
    const step = W / SEGMENTS
    let y = H - 40 - this.rng() * 30
    this.ground = []
    for (let i = 0; i <= SEGMENTS; i++) {
      this.ground.push(y)
      y += (this.rng() - 0.5) * rough
      y = Math.max(HUD_H + 90, Math.min(H - 12, y))
    }
    // Flatten pads into the slope: a wide one, a middling one, a narrow one.
    const widths = [
      levelCurve(hill, LANDER_CURVES.padWide),
      (levelCurve(hill, LANDER_CURVES.padWide) +
        levelCurve(hill, LANDER_CURVES.padNarrow)) /
        2,
      levelCurve(hill, LANDER_CURVES.padNarrow),
    ]
    const mults = [1, 2, 4]
    this.pads = []
    const slots = [0, 1, 2, 3, 4].sort(() => this.rng() - 0.5).slice(0, 3)
    widths.forEach((width, i) => {
      const slot = slots[i]!
      const cx = 30 + slot * ((W - 60) / 4) + (this.rng() - 0.5) * 20
      const x0 = Math.max(4, cx - width / 2)
      const x1 = Math.min(W - 4, cx + width / 2)
      const i0 = Math.floor(x0 / step)
      const i1 = Math.ceil(x1 / step)
      const padY = this.ground[Math.round((i0 + i1) / 2)]!
      for (let k = i0; k <= i1 && k <= SEGMENTS; k++) this.ground[k] = padY
      this.pads.push({
        x0: i0 * step,
        x1: Math.min(W, i1 * step),
        y: padY,
        mult: mults[i]!,
      })
    })
    this.planted = []
    this.windTarget = 0
    this.wind = 0
    this.spawn()
    this.banner = {
      text: `HILLSIDE ${hill}`,
      sub: 'LAND SOFT AND LEVEL',
      ticks: 100,
    }
  }

  private spawn() {
    this.x = 40 + this.rng() * (W - 80)
    this.y = HUD_H + 10
    this.vx = (this.rng() - 0.5) * 0.8
    this.vy = 0
    this.tilt = 0
  }

  private groundAt(x: number): number {
    const step = W / SEGMENTS
    const i = Math.max(0, Math.min(SEGMENTS - 1, Math.floor(x / step)))
    const t = (x - i * step) / step
    return this.ground[i]! + (this.ground[i + 1]! - this.ground[i]!) * t
  }

  private padUnder(x: number): Pad | undefined {
    return this.pads.find((p) => x - 3 >= p.x0 && x + 3 <= p.x1)
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    const controls = this.demo ? this.demoInput() : input
    if (this.plant > 0) {
      if (--this.plant === 0) this.buildHill(this.level + 1)
      return
    }
    if (this.bonk > 0) {
      if (--this.bonk === 0) {
        if (this.lives <= 0) {
          this.over = true
          this.banner = { text: 'OUT OF PODS', sub: 'GAME OVER', ticks: 9999 }
        } else this.spawn()
      }
      return
    }
    this.fly(controls)
    this.touchDown()
  }

  private fly(input: InputFrame) {
    if (input.held.left) this.tilt = Math.max(-MAX_TILT, this.tilt - TURN)
    if (input.held.right) this.tilt = Math.min(MAX_TILT, this.tilt + TURN)
    this.puffing =
      (input.held.up || input.held.a || input.held.b) && this.fuel > 0
    if (this.puffing) {
      this.fuel = Math.max(0, this.fuel - 1)
      this.vx += Math.sin(this.tilt) * THRUST
      this.vy -= Math.cos(this.tilt) * THRUST
      if (this.tick % 3 === 0) {
        const a = this.tilt + Math.PI / 2 + (this.rng() - 0.5) * 0.5
        this.particles.push({
          x: this.x - Math.sin(this.tilt) * POD_FEET,
          y: this.y + Math.cos(this.tilt) * POD_FEET,
          vx: Math.cos(a) * 0.3 - Math.sin(this.tilt) * 0.8,
          vy: Math.sin(a) * 0.3 + Math.cos(this.tilt) * 0.8,
          life: 18,
          color: '#e0f2fe',
        })
      }
    }
    // Gusts drift toward a new strength every few seconds.
    const maxWind = levelCurve(this.level, LANDER_CURVES.wind)
    if (this.tick % 180 === 0) this.windTarget = (this.rng() * 2 - 1) * maxWind
    this.wind += (this.windTarget - this.wind) * 0.02
    this.vx += this.wind
    this.vy += GRAVITY
    this.x += this.vx
    this.y += this.vy
    // The hillside wraps around, as if it goes on round the world.
    if (this.x < 0) this.x += W
    if (this.x > W) this.x -= W
    if (this.y < HUD_H + 4) {
      this.y = HUD_H + 4
      this.vy = Math.max(0, this.vy)
    }
  }

  private touchDown() {
    const feet = this.y + POD_FEET
    // Either foot on the ground counts.
    const left = this.groundAt(this.x - POD_HALF)
    const right = this.groundAt(this.x + POD_HALF)
    if (feet < Math.min(left, right)) return
    const pad = this.padUnder(this.x)
    const level = Math.abs(this.tilt) <= SAFE_TILT
    const soft = this.vy <= SAFE_VY && Math.abs(this.vx) <= SAFE_VX
    const bumpy =
      this.vy <= SAFE_VY * BUMPY && Math.abs(this.vx) <= SAFE_VX * BUMPY
    if (pad && level && (soft || bumpy)) this.land(pad, !soft)
    else
      this.crash(!pad ? 'MISSED THE PAD' : !level ? 'TOO TILTED' : 'TOO FAST')
  }

  private land(pad: Pad, bumpy: boolean) {
    this.y = pad.y - POD_FEET
    // Softer touchdowns pay more; a bumpy one pays a third.
    const gentle = bumpy ? 1 / 3 : 1 + (SAFE_VY - this.vy) / SAFE_VY
    const points = Math.round(50 * pad.mult * gentle) * 10
    const fuelBonus = Math.round(this.fuel / 10) * 5
    this.addScore(points, this.x, pad.y - 22)
    this.addScore(fuelBonus, this.x, pad.y - 32)
    this.fuel = Math.min(FUEL_MAX, this.fuel + FUEL_REFILL)
    const color = ['#f9a8d4', '#fde047', '#c4b5fd', '#fdba74'][
      Math.floor(this.rng() * 4)
    ]!
    this.planted.push({ x: this.x, y: pad.y, color })
    this.burst(this.x, pad.y - 4, 16, color)
    this.plant = PLANT_TICKS
    this.banner = {
      text: bumpy
        ? 'BUMPY LANDING'
        : pad.mult > 1
          ? `PLANTED  X${pad.mult}`
          : 'PLANTED!',
      sub: `${points} + SUNLIGHT ${fuelBonus}`,
      ticks: PLANT_TICKS,
    }
    this.sound.play('level')
  }

  private crash(why: string) {
    this.lives--
    // The scattered seeds still sprout a few wildflowers.
    this.addScore(BONK_POINTS * this.level, this.x, this.y - 12)
    this.bonk = BONK_TICKS
    this.burst(this.x, this.y, 22, '#a3e635')
    this.burst(this.x, this.y, 10, '#fde047')
    this.sound.play('die')
    this.banner = {
      text: 'BONK!',
      sub:
        this.lives > 0
          ? `${why}  ${this.lives} POD${this.lives > 1 ? 'S' : ''} LEFT`
          : why,
      ticks: BONK_TICKS,
    }
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x: number, y: number) {
    if (this.demo || points <= 0) return
    this.score += points
    this.floaters.push({ x, y, text: String(points), life: 50 })
  }

  private burst(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.4 + this.rng() * 1.6
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 0.6,
        life: 24 + Math.floor(this.rng() * 18),
        color,
      })
    }
  }

  private updateEffects() {
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.03
      p.life--
    }
    this.particles = this.particles.filter((p) => p.life > 0)
    for (const f of this.floaters) {
      f.y -= 0.3
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
  }

  // --- attract-mode pilot -----------------------------------------------------

  /** Picks a pad, drifts over it, then lets the pod down gently and upright. */
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
    const pad = [...this.pads].sort(
      (a, b) =>
        Math.abs((a.x0 + a.x1) / 2 - this.x) / a.mult -
        Math.abs((b.x0 + b.x1) / 2 - this.x) / b.mult,
    )[0]
    if (!pad) return frame
    const dx = (pad.x0 + pad.x1) / 2 - this.x
    const height = pad.y - (this.y + POD_FEET)
    // Lean toward the speed we want, and stand up straight for the last bit.
    const wantVx = Math.max(-1.2, Math.min(1.2, dx / 50))
    let wantTilt = Math.max(-0.5, Math.min(0.5, (wantVx - this.vx) * 1.4))
    if (height < 18 && Math.abs(dx) < (pad.x1 - pad.x0) / 2) wantTilt = 0
    if (wantTilt < this.tilt - 0.03) held.left = true
    if (wantTilt > this.tilt + 0.03) held.right = true
    // Fall no faster than the height allows; keep clear of hills on the way.
    const wantVy = Math.min(1.4, 0.25 + Math.max(0, height) / 90)
    const ahead = this.groundAt(this.x + this.vx * 30) - (this.y + POD_FEET)
    const tooLow = ahead < 22 && Math.abs(dx) > (pad.x1 - pad.x0) / 2
    if (
      this.vy > wantVy ||
      tooLow ||
      (Math.abs(this.tilt) > 0.25 && this.vy > 0.2)
    )
      held.a = true
    return frame
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    const sky = g.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, '#0c4a6e')
    sky.addColorStop(0.6, '#38bdf8')
    sky.addColorStop(1, '#bae6fd')
    g.fillStyle = sky
    g.fillRect(0, 0, W, H)
    // A low sun and drifting clouds (they lean with the wind).
    g.fillStyle = '#fde68a'
    g.beginPath()
    g.arc(W - 46, HUD_H + 34, 14, 0, Math.PI * 2)
    g.fill()
    for (let i = 0; i < 4; i++) {
      const cx =
        ((((i * 97 + this.tick * (0.1 + this.wind * 40)) % (W + 60)) + W + 60) %
          (W + 60)) -
        30
      g.fillStyle = 'rgba(255, 255, 255, 0.75)'
      g.beginPath()
      g.ellipse(cx, HUD_H + 18 + i * 13, 18, 5, 0, 0, Math.PI * 2)
      g.fill()
    }
    this.renderHill(g)
    for (const p of this.planted) this.renderBloom(g, p.x, p.y, p.color)
    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, p.life / 30)
      g.fillStyle = p.color
      g.fillRect(p.x - 1, p.y - 1, 2, 2)
    }
    g.globalAlpha = 1
    if (this.bonk === 0 && !this.over) this.renderPod(g)
    for (const f of this.floaters)
      drawText(g, f.text, f.x, f.y, {
        align: 'center',
        color: '#fef3c7',
        shadow: '#1e3a8a',
      })
    this.renderHud(g)
  }

  private renderHill(g: CanvasRenderingContext2D) {
    const step = W / SEGMENTS
    g.fillStyle = '#4d7c0f'
    g.beginPath()
    g.moveTo(0, H)
    for (let i = 0; i <= SEGMENTS; i++) g.lineTo(i * step, this.ground[i]!)
    g.lineTo(W, H)
    g.closePath()
    g.fill()
    g.strokeStyle = '#84cc16'
    g.lineWidth = 2
    g.beginPath()
    for (let i = 0; i <= SEGMENTS; i++) {
      if (i === 0) g.moveTo(0, this.ground[0]!)
      else g.lineTo(i * step, this.ground[i]!)
    }
    g.stroke()
    for (const pad of this.pads) {
      // A tilled garden pad with its multiplier.
      g.fillStyle = '#78350f'
      g.fillRect(pad.x0, pad.y - 1, pad.x1 - pad.x0, 4)
      g.fillStyle = '#a16207'
      for (let x = pad.x0 + 2; x < pad.x1 - 2; x += 5)
        g.fillRect(x, pad.y, 2, 1)
      if (pad.mult > 1)
        drawText(g, `X${pad.mult}`, (pad.x0 + pad.x1) / 2, pad.y + 6, {
          align: 'center',
          color: '#fef08a',
          shadow: '#365314',
        })
    }
  }

  private renderBloom(
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
  ) {
    g.fillStyle = '#15803d'
    g.fillRect(x, y - 10, 1, 9)
    g.fillRect(x - 3, y - 5, 3, 1)
    g.fillStyle = color
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      g.fillRect(x + Math.cos(a) * 3 - 1, y - 12 + Math.sin(a) * 3 - 1, 3, 3)
    }
    g.fillStyle = '#fde047'
    g.fillRect(x - 1, y - 13, 3, 3)
  }

  private renderPod(g: CanvasRenderingContext2D) {
    g.save()
    g.translate(this.x, this.y)
    g.rotate(this.tilt)
    // A seed pod: an acorn-ish body, a leafy cap and two little legs.
    g.fillStyle = '#a16207'
    g.beginPath()
    g.ellipse(0, 0, POD_HALF, 6, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#65a30d'
    g.beginPath()
    g.ellipse(0, -4, POD_HALF + 1, 3, 0, Math.PI, 0)
    g.fill()
    g.fillRect(-1, -9, 2, 3)
    g.fillStyle = '#fef3c7'
    g.fillRect(-3, -1, 2, 2)
    g.fillRect(1, -1, 2, 2)
    g.fillStyle = '#422006'
    g.fillRect(-POD_HALF, 4, 1, 3)
    g.fillRect(POD_HALF - 1, 4, 1, 3)
    if (this.puffing && Math.floor(this.tick / 3) % 2) {
      g.fillStyle = '#e0f2fe'
      g.fillRect(-2, 7, 4, 3)
    }
    g.restore()
  }

  private renderHud(g: CanvasRenderingContext2D) {
    const shadow = '#0c4a6e'
    g.fillStyle = 'rgba(12, 74, 110, 0.85)'
    g.fillRect(0, 0, W, HUD_H)
    drawText(g, String(this.score).padStart(6, '0'), 4, 3, {
      scale: 2,
      color: '#fde047',
      shadow,
    })
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W - 4, 2, {
      align: 'right',
      color: '#f9a8d4',
    })
    drawText(g, `HILL ${this.level}`, W - 4, 10, {
      align: 'right',
      color: '#bef264',
    })
    for (let i = 0; i < Math.min(this.lives - 1, 4); i++) {
      g.fillStyle = '#a16207'
      g.fillRect(W - 10 - i * 8, 19, 5, 5)
    }
    // Sunlight (puff fuel).
    drawText(g, 'SUN', 4, 18, { color: '#fde68a' })
    g.fillStyle = '#1e293b'
    g.fillRect(24, 19, 56, 4)
    g.fillStyle = this.fuel > FUEL_MAX * 0.25 ? '#fde047' : '#f97316'
    g.fillRect(24, 19, (56 * this.fuel) / FUEL_MAX, 4)
    // Speed gauges: green when slow enough to land.
    const hSafe = Math.abs(this.vx) <= SAFE_VX
    const vSafe = this.vy <= SAFE_VY
    const tSafe = Math.abs(this.tilt) <= SAFE_TILT
    drawText(g, `ACROSS ${Math.abs(this.vx * 10).toFixed(0)}`, 92, 2, {
      color: hSafe ? '#86efac' : '#fca5a5',
    })
    drawText(g, `DOWN ${Math.max(0, this.vy * 10).toFixed(0)}`, 92, 10, {
      color: vSafe ? '#86efac' : '#fca5a5',
    })
    drawText(g, tSafe ? 'LEVEL' : 'TILTED', 92, 18, {
      color: tSafe ? '#86efac' : '#fca5a5',
    })
    // Wind arrow.
    const windPx = Math.round(this.wind * 2500)
    if (Math.abs(windPx) >= 2) {
      drawText(g, 'WIND', 168, 2, { color: '#e0f2fe' })
      g.fillStyle = '#e0f2fe'
      const cx = 184
      g.fillRect(Math.min(cx, cx + windPx), 12, Math.abs(windPx), 2)
      g.fillRect(cx + windPx - (windPx > 0 ? 2 : 0), 11, 2, 4)
    }
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, 70, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        shadow: '#1e3a8a',
      })
      if (this.banner.sub)
        drawText(g, this.banner.sub, W / 2, 90, {
          align: 'center',
          color: '#fef3c7',
          shadow: '#1e3a8a',
        })
    }
  }
}

const seedLander: ArcadeGameModule = {
  create: (options) => new SeedLander(options),
}

export const create = seedLander.create
export default seedLander
