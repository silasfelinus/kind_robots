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
import {
  INK,
  RAMPS,
  Sparkles,
  backdropRng,
  bandedGradient,
  bevel,
  cachedLayer,
  drawCloud,
  drawRidge,
  drawSprite,
  drawStars,
  dropShadow,
  gauge,
  glow,
  hudPanel,
  mirrorSprite,
  mix,
  pixelSprite,
  ridge,
  rgba,
  shadedOrb,
  starField,
  vignette,
} from '../snes'
import type { PixelSprite, Ramp } from '../snes'
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

// --- 16-bit art (utils/arcade/snes.ts) -------------------------------------------

/** A dawn sky over the garden world: deep violet overhead down to a warm gold horizon. */
const SKY_BANDS = [
  RAMPS.night[2],
  '#3a2a85',
  '#6b3fa0',
  '#b04f9a',
  '#ec7f8c',
  '#f9b77a',
  RAMPS.gold[3],
] as const
const SKY_STARS = starField(5, 60, W, 96).filter((s) => s.y > HUD_H + 2)
const STAR_RAMP: Ramp = ['#24124f', '#4c2a99', '#9a8ad8', '#e6dcff', '#ffffff']

/** Clouds lit pink from below by the low sun. */
const CLOUD_RAMP: Ramp = ['#24124f', '#9a5aa8', '#f0a0b8', '#ffd0c8', '#fff4e8']
const CLOUD_SIZES = [6, 5, 7, 5]

/** Four hillside backdrops (they cycle with the hill number): far peaks and nearer downs. */
const FAR_RIDGES = [0, 1, 2, 3].map((i) => ridge(101 + i * 7, W, 44, 4))
const MID_RIDGES = [0, 1, 2, 3].map((i) => ridge(203 + i * 11, W, 30, 3))
const FAR_FILL = mix('#6b3fa0', '#b04f9a', 0.35)
const MID_FILL = mix(RAMPS.leaf[1], '#3a2a85', 0.55)

/** The planter boxes' wood. */
const WOOD: Ramp = ['#2e160c', '#5c2e14', '#93501f', '#c98a4a', '#f2c98e']

/** The turf's top rows, by which way the slope faces the (upper-left) light. */
const TURF: Record<'lit' | 'flat' | 'shade', readonly string[]> = {
  lit: [RAMPS.leaf[4], RAMPS.leaf[3], RAMPS.leaf[3], RAMPS.leaf[2]],
  flat: [RAMPS.leaf[3], RAMPS.leaf[3], RAMPS.leaf[2], RAMPS.leaf[2]],
  shade: [RAMPS.leaf[2], RAMPS.leaf[2], RAMPS.leaf[1], RAMPS.leaf[1]],
}
/** Below the turf, bands of soil by depth: [from row, colour]. */
const SOIL: readonly (readonly [number, string])[] = [
  [4, RAMPS.leaf[1]],
  [7, RAMPS.leaf[0]],
  [8, RAMPS.earth[2]],
  [22, RAMPS.earth[1]],
  [46, mix(RAMPS.earth[1], RAMPS.earth[0], 0.5)],
  [76, RAMPS.earth[0]],
]

/** Each pad's beacon and multiplier colour, by multiplier. */
const PAD_RAMP: Record<number, Ramp> = {
  1: RAMPS.teal,
  2: RAMPS.gold,
  4: RAMPS.pink,
}

const DANGER = mix(RAMPS.ember[2], '#ffffff', 0.35)
const PUFF_COLOR = '#e0f2fe'

/** The spare-pod icon for the HUD (the flying pod leans, so it is drawn as shaded vector art). */
const POD_ICON = pixelSprite(
  ['.LLL.', 'LllLd', 'dddd.', 'EeeeE', 'EeEeE', '.EEE.'],
  {
    L: RAMPS.leaf[3],
    l: RAMPS.leaf[2],
    d: RAMPS.leaf[1],
    E: RAMPS.earth[1],
    e: RAMPS.earth[3],
  },
)

/** A planted seed grows: sprout, bud, then a full bloom (swaying in two frames). */
function flowerSprites(ramp: Ramp): {
  sprout: PixelSprite
  bud: PixelSprite
  bloom: readonly [PixelSprite, PixelSprite]
} {
  const leaves = {
    L: RAMPS.leaf[3],
    l: RAMPS.leaf[2],
    d: RAMPS.leaf[1],
    s: RAMPS.leaf[2],
  }
  const petals = {
    h: ramp[4],
    P: ramp[3],
    p: ramp[2],
    q: ramp[1],
    c: RAMPS.gold[2],
    Y: RAMPS.gold[4],
  }
  const sprout = pixelSprite(
    ['LL...LL', 'lLl.lLl', '.dlsld.', '...s...', '...s...'],
    leaves,
  )
  const bud = pixelSprite(
    [
      '...hP...',
      '..hPPp..',
      '..PPpq..',
      '...pq...',
      '...s....',
      '.Lls....',
      'Llds.lL.',
      '...sllL.',
      '...s....',
    ],
    { ...leaves, ...petals },
  )
  const bloom = pixelSprite(
    [
      '..hh.hP..',
      '.hPPhPPp.',
      'hPPcYcPPp',
      'PPpYYYpPq',
      'hPPcYcPpq',
      '.PPpPPpq.',
      '..pq.qq..',
      '....s....',
      '.Ll.s....',
      'Lllss....',
      '.dds..lL.',
      '....sllL.',
      '....sdd..',
      '....s....',
    ],
    { ...leaves, ...petals },
  )
  return { sprout, bud, bloom: [bloom, mirrorSprite(bloom)] }
}

/** Flower art per planted colour (the game picks one of these four). */
const FLOWERS: Record<string, ReturnType<typeof flowerSprites>> = {
  '#f9a8d4': flowerSprites(RAMPS.pink),
  '#fde047': flowerSprites(RAMPS.gold),
  '#c4b5fd': flowerSprites(RAMPS.purple),
  '#fdba74': flowerSprites(RAMPS.rust),
}
const FLOWER_SPARKS: Record<string, readonly string[]> = {
  '#f9a8d4': [RAMPS.pink[3], RAMPS.pink[4], RAMPS.gold[4]],
  '#fde047': [RAMPS.gold[3], RAMPS.gold[4], RAMPS.leaf[4]],
  '#c4b5fd': [RAMPS.purple[3], RAMPS.purple[4], RAMPS.teal[3]],
  '#fdba74': [RAMPS.rust[3], RAMPS.rust[4], RAMPS.gold[4]],
}

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
  // Cosmetic only: sparkles roll their own dice, so the game's seeded rng is untouched.
  private fx = new Sparkles()
  private fxRng = backdropRng(61)
  private bonkAt = { x: 0, y: 0 }
  /** The current hillside's terrain art, painted once per hill (keyed on its ground array). */
  private hillArt: HTMLCanvasElement | null = null
  private hillArtFor: number[] | null = null

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
    this.fx.burst(this.x, pad.y - 8, this.fxRng, {
      count: 14,
      colours: FLOWER_SPARKS[color],
      speed: 1.8,
    })
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
    this.bonkAt = { x: this.x, y: this.y }
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
    // A planted seed keeps twinkling while it grows.
    const seed = this.planted[this.planted.length - 1]
    if (seed && this.plant > 0 && this.tick % 9 === 0) {
      this.fx.burst(
        seed.x + (this.fxRng() - 0.5) * 18,
        seed.y - 6 - this.fxRng() * 14,
        this.fxRng,
        { count: 2, speed: 0.5, colours: FLOWER_SPARKS[seed.color] },
      )
    }
    this.fx.update()
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
    this.renderSky(g)
    this.renderHill(g)
    this.renderPads(g)
    this.renderParticles(g)
    if (this.bonk > BONK_TICKS - 24) {
      const t = (this.bonk - (BONK_TICKS - 24)) / 24
      glow(
        g,
        this.bonkAt.x,
        this.bonkAt.y,
        10 + 22 * (1 - t),
        RAMPS.gold[3],
        0.7 * t,
      )
    }
    if (this.bonk === 0 && !this.over) this.renderPod(g)
    // The seed sprouts in front of the pod that planted it.
    for (const p of this.planted) this.renderBloom(g, p.x, p.y, p.color)
    this.fx.render(g)
    for (const f of this.floaters)
      drawText(g, f.text, f.x, f.y, {
        align: 'center',
        color: RAMPS.gold[3],
        outline: INK,
      })
    vignette(g, W, H, 0.28)
    this.renderHud(g)
  }

  private renderSky(g: CanvasRenderingContext2D) {
    // The banded HDMA sky, painted once; the stars twinkle live over it.
    cachedLayer(g, 'seed-lander-sky', W, H, (k) => {
      bandedGradient(k, 0, 0, W, H, SKY_BANDS, 4)
    })
    drawStars(g, SKY_STARS, this.tick, STAR_RAMP)
    // A ringed planet, the sun and two ridges of hills, one backdrop per hill (cycling).
    const variant = (this.level - 1) % 4
    cachedLayer(g, `seed-lander-hills-${variant}`, W, H, (k) => {
      this.paintPlanet(k, 60, 62, 12)
      shadedOrb(k, W - 46, HUD_H + 34, 14, RAMPS.gold, { outline: null })
      // Each ridge twice: a sunlit band first, then its body two pixels lower.
      drawRidge(k, FAR_RIDGES[variant]!, {
        base: 152,
        bottom: H,
        width: W,
        step: 4,
        fill: mix(FAR_FILL, RAMPS.pink[2], 0.35),
        rim: RAMPS.pink[3],
      })
      drawRidge(k, FAR_RIDGES[variant]!, {
        base: 154,
        bottom: H,
        width: W,
        step: 4,
        fill: FAR_FILL,
      })
      // Morning haze pooled at the foot of the far peaks.
      k.fillStyle = rgba(RAMPS.pink[4], 0.12)
      for (let i = 0; i < 4; i++) k.fillRect(0, 138 + i * 4, W, 30 - i * 4)
      drawRidge(k, MID_RIDGES[variant]!, {
        base: 176,
        bottom: H,
        width: W,
        step: 3,
        fill: mix(MID_FILL, RAMPS.leaf[2], 0.5),
        rim: mix(RAMPS.leaf[3], RAMPS.pink[3], 0.4),
      })
      drawRidge(k, MID_RIDGES[variant]!, {
        base: 178,
        bottom: H,
        width: W,
        step: 3,
        fill: MID_FILL,
      })
      // Shadow still pooled in the valleys between the downs.
      for (let y = 186, i = 0; y < H; y += 4, i++) {
        k.fillStyle = rgba(RAMPS.night[1], Math.min(0.55, i * 0.05))
        k.fillRect(0, y, W, 4)
      }
    })
    // The sun breathes light over the sky (colour math).
    glow(
      g,
      W - 46,
      HUD_H + 34,
      40 + 3 * Math.sin(this.tick / 30),
      RAMPS.gold[3],
      0.42,
    )
    // Pink-lit clouds drift with the wind.
    for (let i = 0; i < 4; i++) {
      const cx =
        ((((i * 97 + this.tick * (0.1 + this.wind * 40)) % (W + 60)) + W + 60) %
          (W + 60)) -
        30
      drawCloud(g, cx, HUD_H + 18 + i * 13, CLOUD_SIZES[i]!, CLOUD_RAMP)
    }
  }

  private paintPlanet(
    k: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
  ) {
    const ring = (from: number, to: number) => {
      k.lineWidth = 3
      k.strokeStyle = INK
      k.beginPath()
      k.ellipse(x, y, r * 1.9, r * 0.45, -0.3, from, to)
      k.stroke()
      k.lineWidth = 1.5
      k.strokeStyle = RAMPS.gold[3]
      k.beginPath()
      k.ellipse(x, y, r * 1.9, r * 0.45, -0.3, from, to)
      k.stroke()
    }
    ring(Math.PI, Math.PI * 2)
    shadedOrb(k, x, y, r, RAMPS.teal)
    // The night side, away from the sun.
    k.save()
    k.beginPath()
    k.arc(x, y, r, 0, Math.PI * 2)
    k.clip()
    k.fillStyle = rgba(RAMPS.night[1], 0.45)
    k.beginPath()
    k.arc(x - r * 0.55, y + r * 0.35, r * 1.05, 0, Math.PI * 2)
    k.rect(x - r - 2, y - r - 2, r * 2 + 4, r * 2 + 4)
    k.fill('evenodd')
    k.restore()
    ring(0, Math.PI)
    shadedOrb(k, x + 30, y - 22, 3, RAMPS.purple)
  }

  private renderHill(g: CanvasRenderingContext2D) {
    // The terrain only changes with the hill, so it is painted once per hillside.
    if (typeof document === 'undefined') {
      this.paintHill(g)
      return
    }
    if (this.hillArtFor !== this.ground) {
      this.hillArtFor = this.ground
      const canvas = document.createElement('canvas')
      canvas.width = W
      canvas.height = H
      const k = canvas.getContext('2d')
      if (k) this.paintHill(k)
      this.hillArt = k ? canvas : null
    }
    if (!this.hillArt) {
      this.paintHill(g)
      return
    }
    g.save()
    g.imageSmoothingEnabled = false
    g.drawImage(this.hillArt, 0, 0)
    g.restore()
  }

  private paintHill(k: CanvasRenderingContext2D) {
    // Column by column: a turf rim lit by which way the slope faces, then soil in bands,
    // dithered where one band gives way to the next.
    for (let x = 0; x < W; x++) {
      const top = Math.round(this.groundAt(x + 0.5))
      const slope = this.groundAt(x + 2.5) - this.groundAt(x - 1.5)
      const turf = slope < -1 ? TURF.lit : slope > 1 ? TURF.shade : TURF.flat
      turf.forEach((colour, row) => {
        k.fillStyle = colour
        k.fillRect(x, top + row, 1, 1)
      })
      SOIL.forEach(([from, colour], i) => {
        const to = SOIL[i + 1]?.[0] ?? H
        if (top + from >= H) return
        k.fillStyle = colour
        k.fillRect(x, top + from, 1, to - from)
        if (i > 1 && x % 2) {
          k.fillStyle = SOIL[i - 1]![1]
          k.fillRect(x, top + from, 1, 1)
        }
      })
    }
    // Pebbles in the soil, grass tufts and a few wildflowers on top (cosmetic dice).
    const rand = backdropRng(31 + this.level * 13)
    const onPad = (x: number) =>
      this.pads.some((p) => x >= p.x0 - 2 && x <= p.x1 + 2)
    for (let i = 0; i < 70; i++) {
      const x = Math.floor(rand() * W)
      const y = Math.round(this.groundAt(x) + 12 + rand() * 70)
      if (y >= H - 2) continue
      k.fillStyle = RAMPS.earth[3]
      k.fillRect(x, y, 2, 1)
      k.fillStyle = RAMPS.earth[4]
      k.fillRect(x, y, 1, 1)
      k.fillStyle = RAMPS.earth[0]
      k.fillRect(x, y + 1, 2, 1)
    }
    const blossoms = [RAMPS.pink[3], RAMPS.gold[4], RAMPS.purple[3]]
    for (let i = 0; i < 46; i++) {
      const x = Math.floor(rand() * W)
      const flower = rand() < 0.25
      if (onPad(x)) continue
      const top = Math.round(this.groundAt(x + 0.5))
      k.fillStyle = RAMPS.leaf[2]
      k.fillRect(x, top - 1, 1, 1)
      if (flower) {
        k.fillRect(x, top - 2, 1, 1)
        k.fillStyle = blossoms[Math.floor(rand() * blossoms.length)]!
        k.fillRect(x - 1, top - 3, 3, 1)
        k.fillRect(x, top - 4, 1, 3)
        k.fillStyle = RAMPS.gold[4]
        k.fillRect(x, top - 3, 1, 1)
      } else {
        k.fillStyle = RAMPS.leaf[4]
        k.fillRect(x - 1, top - 2, 1, 1)
        k.fillRect(x + 1, top - 3, 1, 1)
        k.fillStyle = RAMPS.leaf[3]
        k.fillRect(x + 1, top - 2, 1, 1)
      }
    }
    // The garden pads: tilled soil in a bevelled wooden planter, a post at each end.
    for (const pad of this.pads) {
      const w = pad.x1 - pad.x0
      const y = pad.y
      k.fillStyle = INK
      k.fillRect(pad.x0 - 1, y - 2, w + 2, 10)
      k.fillStyle = RAMPS.earth[1]
      k.fillRect(pad.x0, y - 1, w, 2)
      for (let x = pad.x0 + 1; x < pad.x1 - 1; x += 3) {
        k.fillStyle = RAMPS.earth[3]
        k.fillRect(x, y - 1, 1, 1)
        k.fillStyle = RAMPS.earth[0]
        k.fillRect(x + 1, y, 1, 1)
      }
      bevel(k, pad.x0, y + 1, w, 6, WOOD, { depth: 1, outline: null })
      k.fillStyle = WOOD[1]
      for (let x = pad.x0 + 7; x < pad.x1 - 3; x += 8)
        k.fillRect(x, y + 2, 1, 4)
      for (const px of [pad.x0 - 1, pad.x1 - 1])
        bevel(k, px, y - 7, 2, 7, RAMPS.steel, { depth: 1 })
    }
  }

  private renderPads(g: CanvasRenderingContext2D) {
    this.pads.forEach((pad, i) => {
      const ramp = PAD_RAMP[pad.mult] ?? RAMPS.teal
      // Beacon lamps on the posts, pulsing; a brighter pulse means a bigger bloom.
      const pulse = 0.5 + 0.5 * Math.sin(this.tick / 9 + i * 2.1)
      for (const px of [pad.x0, pad.x1]) {
        const bx = px
        const by = pad.y - 9
        glow(g, bx, by, 7 + pulse * 5, ramp[3], 0.35 + pulse * 0.35)
        g.fillStyle = INK
        g.fillRect(bx - 2, by - 2, 4, 4)
        g.fillStyle = pulse > 0.5 ? ramp[3] : ramp[2]
        g.fillRect(bx - 1, by - 1, 2, 2)
        g.fillStyle = ramp[4]
        g.fillRect(bx - 1, by - 1, 1, 1)
      }
      if (pad.mult > 1)
        drawText(
          g,
          `X${pad.mult}`,
          (pad.x0 + pad.x1) / 2,
          Math.min(pad.y + 10, H - 9),
          { align: 'center', color: ramp[3], outline: INK },
        )
    })
  }

  private renderBloom(
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
  ) {
    const art = FLOWERS[color] ?? FLOWERS['#f9a8d4']!
    // The newest seed grows while the hill celebrates; earlier ones stand in full bloom.
    const latest = this.planted[this.planted.length - 1]
    const age =
      latest && latest.x === x && this.plant > 0
        ? PLANT_TICKS - this.plant
        : PLANT_TICKS
    glow(g, x, y - 8, 16, RAMPS.gold[3], 0.3 + 0.1 * Math.sin(this.tick / 7))
    dropShadow(g, x + 1, y, 5, 1.5, 0.35)
    const sprite =
      age < 24
        ? art.sprout
        : age < 52
          ? art.bud
          : art.bloom[Math.floor(this.tick / 20) % 2]!
    drawSprite(g, sprite, x, y, { anchor: 'feet' })
  }

  private renderParticles(g: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      const x = Math.round(p.x)
      const y = Math.round(p.y)
      if (p.color === PUFF_COLOR) {
        // A puff of air: a little cloud that swells and fades.
        const r = 1 + Math.floor((18 - p.life) / 6)
        g.globalAlpha = Math.max(0, (p.life / 18) * 0.7)
        g.fillStyle = RAMPS.cream[2]
        g.fillRect(x - r, y - r + 1, r * 2 + 1, r * 2 - 1)
        g.fillRect(x - r + 1, y - r, r * 2 - 1, r * 2 + 1)
        g.fillStyle = RAMPS.cream[4]
        g.fillRect(x - r + 1, y - r + 1, r * 2 - 2, r * 2 - 2)
        continue
      }
      // Seeds and petals: outlined chips with a lit corner.
      g.globalAlpha = Math.max(0, Math.min(1, p.life / 24))
      g.fillStyle = INK
      g.fillRect(x - 1, y - 1, 3, 3)
      g.fillStyle = p.color
      g.fillRect(x - 1, y - 1, 2, 2)
      g.fillStyle = '#ffffff'
      g.fillRect(x - 1, y - 1, 1, 1)
    }
    g.globalAlpha = 1
  }

  private renderPod(g: CanvasRenderingContext2D) {
    // Once planted, the pod burrows into the soil (shrinking at its feet) for the sprout.
    const sink =
      this.plant > 0 ? Math.max(0, 1 - (PLANT_TICKS - this.plant) / 24) : 1
    if (sink <= 0) return
    // A shadow on the hill below, sharper and darker as the pod comes down.
    const ground = this.groundAt(this.x)
    const near = Math.max(0, 1 - (ground - (this.y + POD_FEET)) / 110) * sink
    if (near > 0)
      dropShadow(g, this.x, ground + 1, 3 + near * 4, 1 + near, 0.45 * near)
    const flicker = Math.abs(Math.sin(this.tick * 0.9)) + (this.tick % 2) * 0.5
    if (this.puffing) {
      const jx = this.x - Math.sin(this.tilt) * (POD_FEET + 5)
      const jy = this.y + Math.cos(this.tilt) * (POD_FEET + 5)
      glow(g, jx, jy, 13 + flicker * 3, RAMPS.gold[3], 0.6)
    }
    // The pod leans, so it is shaded vector art (ramps + ink outline), never a rotated
    // pixel sprite; its shading is turned against the lean so the light stays upper left.
    const lx = -0.7 * Math.cos(this.tilt) - 0.7 * Math.sin(this.tilt)
    const ly = 0.7 * Math.sin(this.tilt) - 0.7 * Math.cos(this.tilt)
    const oval = (x: number, y: number, rx: number, ry: number) => {
      g.beginPath()
      g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
      g.fill()
    }
    const dome = (x: number, y: number, rx: number, ry: number) => {
      g.beginPath()
      g.ellipse(x, y, rx, ry, 0, Math.PI, 0)
      g.closePath()
      g.fill()
    }
    g.save()
    g.translate(this.x, this.y)
    g.rotate(this.tilt)
    g.translate(0, POD_FEET)
    g.scale(sink, sink)
    g.translate(0, -POD_FEET)
    if (this.puffing) {
      // A jet of sunlight: ember edge, gold heart, white-hot core.
      const len = 9 + flicker * 4
      const jet = (half: number, reach: number, colour: string) => {
        g.fillStyle = colour
        g.beginPath()
        g.moveTo(-half, 6)
        g.lineTo(half, 6)
        g.lineTo(0, 6 + reach)
        g.closePath()
        g.fill()
      }
      g.save()
      g.globalCompositeOperation = 'lighter'
      jet(3.5, len, rgba(RAMPS.ember[2], 0.85))
      g.restore()
      jet(2.4, len * 0.72, RAMPS.gold[3])
      jet(1.2, len * 0.4, '#ffffff')
    }
    // Legs and feet.
    g.strokeStyle = INK
    g.lineWidth = 2.2
    g.beginPath()
    g.moveTo(-3.5, 2)
    g.lineTo(-6.5, 6)
    g.moveTo(3.5, 2)
    g.lineTo(6.5, 6)
    g.stroke()
    g.strokeStyle = RAMPS.steel[2]
    g.lineWidth = 0.9
    g.stroke()
    g.fillStyle = INK
    g.fillRect(-9, 5, 5, 2.2)
    g.fillRect(4, 5, 5, 2.2)
    g.fillStyle = RAMPS.steel[3]
    g.fillRect(-8.5, 5.4, 4, 1)
    g.fillRect(4.5, 5.4, 4, 1)
    // The acorn body, shaded in bands toward the light.
    g.fillStyle = INK
    oval(0, 0.3, 6.2, 7.2)
    g.fillStyle = RAMPS.earth[1]
    oval(0, 0, 5.2, 6.2)
    g.fillStyle = RAMPS.earth[2]
    oval(lx * 0.9, ly * 0.9, 4.2, 5)
    g.fillStyle = RAMPS.earth[3]
    oval(lx * 2, ly * 2, 2.4, 3)
    g.fillStyle = RAMPS.earth[4]
    oval(lx * 3, ly * 3, 0.9, 1.3)
    // A shy face.
    g.fillStyle = INK
    g.fillRect(-3, -1, 1.6, 2.2)
    g.fillRect(1.4, -1, 1.6, 2.2)
    g.fillStyle = '#ffffff'
    g.fillRect(-3, -1, 0.8, 0.8)
    g.fillRect(1.4, -1, 0.8, 0.8)
    g.fillStyle = rgba(RAMPS.pink[2], 0.75)
    g.fillRect(-4.6, 1.8, 1.8, 1)
    g.fillRect(2.8, 1.8, 1.8, 1)
    // The leafy cap: ink dome, shaded dome, a lip along its base and a sprig on top.
    g.fillStyle = INK
    dome(0, -3, 7.4, 5)
    g.fillRect(-7.4, -3.4, 14.8, 2.2)
    g.fillStyle = RAMPS.leaf[1]
    dome(0, -3.2, 6.4, 4)
    g.fillStyle = RAMPS.leaf[2]
    dome(lx * 0.8, -3.4 + Math.min(0, ly) * 0.6, 5, 3.2)
    g.fillStyle = RAMPS.leaf[3]
    dome(lx * 1.8 - 1, -4, 2.4, 1.6)
    g.fillStyle = RAMPS.leaf[1]
    for (const [cx, cy] of [
      [-3.5, -4.2],
      [0, -5.6],
      [3.2, -4.4],
      [-1.6, -4.4],
      [1.8, -4.2],
    ] as const)
      g.fillRect(cx, cy, 1, 1)
    g.fillStyle = RAMPS.leaf[0]
    g.fillRect(-6.4, -2.6, 12.8, 1)
    g.fillStyle = RAMPS.leaf[3]
    g.fillRect(-6, -3.4, 11, 0.8)
    g.fillStyle = INK
    g.fillRect(-1.6, -10, 3.2, 4)
    g.beginPath()
    g.ellipse(3, -9.5, 3, 1.8, -0.5, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = RAMPS.leaf[2]
    g.fillRect(-0.8, -9.2, 1.6, 3)
    g.fillStyle = RAMPS.leaf[3]
    g.beginPath()
    g.ellipse(3, -9.5, 2, 1, -0.5, 0, Math.PI * 2)
    g.fill()
    g.restore()
  }

  private renderHud(g: CanvasRenderingContext2D) {
    // One boxed cockpit strip across the top, split into bays by lit dividers.
    hudPanel(g, 0, 0, W, HUD_H - 1)
    for (const x of [77, 149, 213, 261]) {
      g.fillStyle = INK
      g.fillRect(x, 3, 1, HUD_H - 7)
      g.fillStyle = RAMPS.purple[3]
      g.fillRect(x + 1, 3, 1, HUD_H - 7)
    }
    drawText(g, String(this.score).padStart(6, '0'), 5, 6, {
      scale: 2,
      color: RAMPS.gold[3],
      shadow: INK,
    })
    // Sunlight (puff fuel) and the wind.
    const sunny = this.fuel > FUEL_MAX * 0.25
    drawText(g, 'SUN', 82, 4, {
      color: sunny ? RAMPS.gold[3] : RAMPS.rust[3],
      shadow: INK,
    })
    gauge(
      g,
      102,
      5,
      44,
      5,
      this.fuel / FUEL_MAX,
      sunny ? RAMPS.gold : RAMPS.ember,
    )
    drawText(g, 'WIND', 82, 15, { color: RAMPS.sky[4], shadow: INK })
    const windPx = Math.max(-20, Math.min(20, Math.round(this.wind * 2500)))
    const cx = 126
    if (Math.abs(windPx) >= 2) {
      const x0 = Math.min(cx, cx + windPx)
      const dir = windPx > 0 ? 1 : -1
      const tip = cx + windPx
      g.fillStyle = INK
      g.fillRect(x0 - 1, 16, Math.abs(windPx) + 2, 4)
      g.fillRect(tip - (dir > 0 ? 2 : 1), 14, 4, 8)
      g.fillStyle = RAMPS.sky[3]
      g.fillRect(x0, 17, Math.abs(windPx), 2)
      g.fillStyle = RAMPS.sky[4]
      g.fillRect(x0, 17, Math.abs(windPx), 1)
      g.fillRect(tip - (dir > 0 ? 1 : 0), 15, 2, 6)
    } else {
      g.fillStyle = INK
      g.fillRect(cx - 2, 16, 4, 4)
      g.fillStyle = RAMPS.sky[3]
      g.fillRect(cx - 1, 17, 2, 2)
    }
    // Speed and lean readouts, each with a lamp: green when it is safe to land.
    const lamp = (x: number, y: number, ok: boolean) => {
      const ramp = ok ? RAMPS.leaf : RAMPS.ember
      glow(g, x, y, 6, ramp[3], ok ? 0.45 : 0.6)
      g.fillStyle = INK
      g.fillRect(x - 2, y - 2, 5, 5)
      g.fillStyle = ramp[1]
      g.fillRect(x - 1, y - 1, 3, 3)
      g.fillStyle = ramp[3]
      g.fillRect(x - 1, y - 1, 2, 2)
      g.fillStyle = ramp[4]
      g.fillRect(x - 1, y - 1, 1, 1)
    }
    const hSafe = Math.abs(this.vx) <= SAFE_VX
    const vSafe = this.vy <= SAFE_VY
    const tSafe = Math.abs(this.tilt) <= SAFE_TILT
    lamp(155, 7, hSafe)
    drawText(g, `ACROSS ${Math.abs(this.vx * 10).toFixed(0)}`, 160, 4, {
      color: hSafe ? RAMPS.leaf[3] : DANGER,
      shadow: INK,
    })
    lamp(155, 18, vSafe)
    drawText(g, `DOWN ${Math.max(0, this.vy * 10).toFixed(0)}`, 160, 15, {
      color: vSafe ? RAMPS.leaf[3] : DANGER,
      shadow: INK,
    })
    lamp(219, 7, tSafe)
    drawText(g, tSafe ? 'LEVEL' : 'TILTED', 224, 4, {
      color: tSafe ? RAMPS.leaf[3] : DANGER,
      shadow: INK,
    })
    // Spare pods waiting their turn.
    for (let i = 0; i < Math.min(this.lives - 1, 4); i++)
      drawSprite(g, POD_ICON, 220 + i * 9, 18)
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W - 5, 4, {
      align: 'right',
      color: RAMPS.pink[3],
      shadow: INK,
    })
    drawText(g, `HILL ${this.level}`, W - 5, 15, {
      align: 'right',
      color: RAMPS.leaf[3],
      shadow: INK,
    })
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, 70, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.purple[1],
      })
      if (this.banner.sub)
        drawText(g, this.banner.sub, W / 2, 92, {
          align: 'center',
          color: RAMPS.gold[3],
          outline: INK,
        })
    }
  }
}

const seedLander: ArcadeGameModule = {
  create: (options) => new SeedLander(options),
}

export const create = seedLander.create
export default seedLander
