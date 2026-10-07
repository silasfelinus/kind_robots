// /utils/arcade/games/roverRamble.ts
//
// Rover Ramble -- the Kind Robots Arcade's Moon Patrol riff (conductor
// kr-arcade/t-009 game factory, batch 4). A six-wheeled rover rolls across a
// bumpy moon. Jump the craters, zap the boulders ahead, and shoot upward at
// the meteor sprites that swoop overhead dropping pebbles (a pebble that lands
// ahead of you digs a fresh crater). Checkpoint posts letter the route; reach
// each one for a bonus that grows the faster you got there.
//
// Big boulders take two zaps (the first knocks them down to a small one), and
// from section 4 some boulders roll toward you. Clearing an obstacle by
// jumping it pays too. Falling into a crater, bumping a boulder or catching a
// pebble costs a rover, and you roll again from the last checkpoint.
// ROVER_CURVES ramp the obstacles, the sprites and their pebbles.
//
// Right speeds up, left slows down, Up or B jumps, A zaps ahead and overhead.

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
const HUD_H = 24
const GROUND = 206
const SECTION = 2400
const BASE_SPEED = 1.6
const MIN_SPEED = 1
const MAX_SPEED = 2.6
const ACCEL = 0.03
const JUMP_V = 3.4
const GRAVITY = 0.16
const ROVER_HALF = 11
const SHOT_SPEED = 5
const SHOT_RANGE = 170
const MAX_UP_SHOTS = 3
const PEBBLE_SPEED = 1.4
const START_LIVES = 3
const CRASH_TICKS = 110
const EXTRA_AT = 10_000
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

const ROCK_POINTS = 50
const BIG_POINTS = 100
const JUMP_POINTS = 50
const SPRITE_POINTS = 150
const CHECKPOINT_POINTS = 500

export const ROVER_CURVES = {
  /** Distance between obstacles. */
  gap: { start: 230, step: -14, limit: 110 },
  /** Widest crater. */
  crater: { start: 26, step: 3, limit: 44 },
  /** Ticks between waves of meteor sprites (from section 2). */
  waveGap: { start: 520, step: -40, limit: 200 },
  /** Chance per tick a sprite drops a pebble. */
  pebble: { start: 0.006, step: 0.002, limit: 0.02 },
  /** Par time for a section, in seconds. */
  par: { start: 26, step: -0.5, limit: 20 },
} as const

type ObKind = 'crater' | 'rock' | 'big' | 'roller'
type Ob = {
  kind: ObKind
  x: number
  w: number
  hp: number
  passed: boolean
  gone: boolean
}
type Shot = { x: number; y: number; ox: number }
type Sprite = { x: number; y: number; baseY: number; vx: number; phase: number }
type Pebble = { x: number; y: number; vx: number }
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = { x: number; y: number; text: string; life: number }

const rockR = (o: Ob) => (o.kind === 'big' ? 9 : 6)

class RoverRamble implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private wx = 40
  private speed = BASE_SPEED
  private alt = 0
  private vy = 0
  private sectionStart = 0
  private sectionTicks = 0
  private obstacles: Ob[] = []
  private fwd: Shot | null = null
  private ups: Shot[] = []
  private sprites: Sprite[] = []
  private pebbles: Pebble[] = []
  private waveTimer = 0
  private crash = 0
  private nextExtra = EXTRA_AT
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.startSection(1, 0)
  }

  private get roverX(): number {
    return 60 + (this.speed - MIN_SPEED) * 26
  }

  private get camera(): number {
    return this.wx - this.roverX
  }

  // --- the course ---------------------------------------------------------------

  /** `rewind` puts the rover back at the start (after a crash). */
  private startSection(section: number, start: number, rewind = true) {
    this.level = section
    this.sectionStart = start
    this.sectionTicks = 0
    if (rewind) {
      this.wx = start + 40
      this.speed = BASE_SPEED
      this.alt = 0
      this.vy = 0
    }
    this.fwd = null
    this.ups = []
    this.sprites = []
    this.pebbles = []
    this.waveTimer = 240
    this.obstacles = []
    const gap = levelCurve(section, ROVER_CURVES.gap)
    const widest = levelCurve(section, ROVER_CURVES.crater)
    let x = start + 260
    while (x < start + SECTION - 120) {
      const roll = this.rng()
      const kind: ObKind =
        roll < 0.4
          ? 'crater'
          : roll < 0.65
            ? 'rock'
            : section >= 2 && roll < 0.85
              ? 'big'
              : section >= 4
                ? 'roller'
                : 'rock'
      const w = kind === 'crater' ? 16 + this.rng() * (widest - 16) : 0
      this.obstacles.push({
        kind,
        x,
        w,
        hp: kind === 'big' ? 2 : 1,
        passed: false,
        gone: false,
      })
      // From section 3, craters sometimes come in pairs.
      if (kind === 'crater' && section >= 3 && this.rng() < 0.3) {
        x += w + 70
        this.obstacles.push({
          kind: 'crater',
          x,
          w: 16 + this.rng() * 8,
          hp: 1,
          passed: false,
          gone: false,
        })
      }
      x += w + gap * (0.75 + this.rng() * 0.6)
    }
    const letter = LETTERS[(section - 1) % LETTERS.length]!
    this.banner = {
      text: `SECTION ${letter}`,
      sub: `PAR ${Math.round(levelCurve(section, ROVER_CURVES.par))} SECONDS`,
      ticks: 100,
    }
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    if (this.crash > 0) {
      if (--this.crash === 0) {
        if (this.lives <= 0) {
          this.over = true
          this.banner = {
            text: 'END OF THE ROAD',
            sub: 'GAME OVER',
            ticks: 9999,
          }
        } else this.startSection(this.level, this.sectionStart)
      }
      return
    }
    const controls = this.demo ? this.demoInput() : input
    this.sectionTicks++
    this.drive(controls)
    this.updateObstacles()
    this.updateShots()
    this.updateSprites()
    this.updatePebbles()
    if (this.crash === 0 && this.wx >= this.sectionStart + SECTION)
      this.checkpoint()
  }

  private drive(input: InputFrame) {
    if (input.held.right) this.speed = Math.min(MAX_SPEED, this.speed + ACCEL)
    else if (input.held.left)
      this.speed = Math.max(MIN_SPEED, this.speed - ACCEL)
    else this.speed += (BASE_SPEED - this.speed) * 0.02
    this.wx += this.speed
    if (
      this.alt === 0 &&
      (input.pressed.up || input.pressed.b || input.held.up)
    ) {
      this.vy = JUMP_V
      this.alt = 0.01
      this.sound.play('blip')
    }
    if (this.alt > 0) {
      this.alt += this.vy
      this.vy -= GRAVITY
      if (this.alt <= 0) {
        this.alt = 0
        this.vy = 0
      }
    }
    if (input.pressed.a) this.fire()
  }

  private fire() {
    let fired = false
    if (!this.fwd) {
      this.fwd = {
        x: this.wx + ROVER_HALF,
        y: GROUND - 8 - this.alt,
        ox: this.wx,
      }
      fired = true
    }
    if (this.ups.length < MAX_UP_SHOTS) {
      this.ups.push({ x: this.wx - 4, y: GROUND - 14 - this.alt, ox: 0 })
      fired = true
    }
    if (fired) this.sound.play('shoot')
  }

  private updateObstacles() {
    for (const o of this.obstacles) {
      if (o.gone) continue
      if (o.kind === 'roller') o.x -= 0.6
      if (o.kind === 'crater') {
        // On the ground with the rover's middle over the hole: in it goes.
        if (this.alt === 0 && this.wx > o.x + 4 && this.wx < o.x + o.w - 4) {
          this.crashRover('FELL IN A CRATER')
          return
        }
        if (!o.passed && this.wx - ROVER_HALF > o.x + o.w) {
          o.passed = true
          this.addScore(JUMP_POINTS, this.roverX, GROUND - 30)
        }
      } else {
        const r = rockR(o)
        if (
          Math.abs(o.x - this.wx) < ROVER_HALF + r - 3 &&
          this.alt < r * 2 - 2
        ) {
          this.crashRover(
            o.kind === 'roller' ? 'A BOULDER ROLLED IN' : 'BUMPED A BOULDER',
          )
          return
        }
        if (!o.passed && o.x + r < this.wx - ROVER_HALF) {
          o.passed = true
          this.addScore(JUMP_POINTS, this.roverX, GROUND - 30)
        }
      }
    }
    this.obstacles = this.obstacles.filter(
      (o) => !o.gone && o.x + o.w > this.camera - 60,
    )
  }

  private updateShots() {
    if (this.fwd) {
      this.fwd.x += SHOT_SPEED
      const rock = this.obstacles.find(
        (o) =>
          !o.gone &&
          o.kind !== 'crater' &&
          Math.abs(o.x - this.fwd!.x) < rockR(o) + 2 &&
          this.fwd!.y > GROUND - rockR(o) * 2 - 2,
      )
      if (rock) {
        this.zapRock(rock)
        this.fwd = null
      } else if (this.fwd.x - this.fwd.ox > SHOT_RANGE) this.fwd = null
    }
    for (const s of this.ups) {
      s.y -= SHOT_SPEED
      const sx = s.x - this.camera
      const hit = this.sprites.find(
        (sp) => Math.abs(sp.x - sx) < 9 && Math.abs(sp.y - s.y) < 7,
      )
      if (hit) {
        s.y = -99
        hit.y = -999
        this.addScore(SPRITE_POINTS, hit.x, hit.baseY - 10)
        this.sparks(hit.x, hit.baseY, '#c4b5fd', 12)
        this.sound.play('pop')
      }
      const pebble = this.pebbles.find(
        (p) => Math.abs(p.x - sx) < 5 && Math.abs(p.y - s.y) < 6,
      )
      if (pebble) {
        s.y = -99
        pebble.y = H + 99
        this.sparks(pebble.x, pebble.y, '#d6d3d1', 4)
      }
    }
    this.ups = this.ups.filter((s) => s.y > HUD_H)
    this.sprites = this.sprites.filter((sp) => sp.y > -900)
  }

  private zapRock(o: Ob) {
    const sx = o.x - this.camera
    if (o.kind === 'big' && o.hp > 1) {
      o.hp--
      o.kind = 'rock'
      this.addScore(BIG_POINTS, sx, GROUND - 26)
      this.sparks(sx, GROUND - 10, '#a8a29e', 10)
      this.sound.play('blip')
      return
    }
    o.gone = true
    this.addScore(
      o.kind === 'roller' ? BIG_POINTS : ROCK_POINTS,
      sx,
      GROUND - 22,
    )
    this.sparks(sx, GROUND - 6, '#a8a29e', 14)
    this.sound.play('boom')
  }

  private updateSprites() {
    if (this.level >= 2 && --this.waveTimer <= 0) {
      this.waveTimer = Math.round(levelCurve(this.level, ROVER_CURVES.waveGap))
      const fromLeft = this.rng() < 0.5
      const baseY = HUD_H + 26 + this.rng() * 40
      for (let i = 0; i < 3; i++)
        this.sprites.push({
          x: fromLeft ? -20 - i * 22 : W + 20 + i * 22,
          y: baseY,
          baseY,
          vx: fromLeft ? 1.3 : -1.3,
          phase: i * 0.9,
        })
      this.sound.play('warn')
    }
    const pebble = levelCurve(this.level, ROVER_CURVES.pebble)
    for (const sp of this.sprites) {
      sp.x += sp.vx
      sp.y = sp.baseY + Math.sin(this.tick / 18 + sp.phase) * 14
      if (sp.x > 20 && sp.x < W - 20 && this.rng() < pebble)
        this.pebbles.push({ x: sp.x, y: sp.y + 6, vx: 0 })
    }
    this.sprites = this.sprites.filter((sp) => sp.x > -90 && sp.x < W + 90)
  }

  private updatePebbles() {
    const rx = this.roverX
    for (const p of this.pebbles) {
      p.y += PEBBLE_SPEED
      p.x -= this.speed * 0.15
      const top = GROUND - 14 - this.alt
      if (
        Math.abs(p.x - rx) < ROVER_HALF &&
        p.y > top &&
        p.y < GROUND - this.alt
      ) {
        this.crashRover('HIT BY A PEBBLE')
        return
      }
      if (p.y >= GROUND) {
        p.y = H + 99
        this.sparks(p.x, GROUND, '#a8a29e', 6)
        // A pebble landing well ahead digs a little crater.
        const wx = p.x + this.camera
        if (
          wx > this.wx + 40 &&
          !this.obstacles.some((o) => Math.abs(o.x - wx) < 50)
        )
          this.obstacles.push({
            kind: 'crater',
            x: wx - 8,
            w: 16,
            hp: 1,
            passed: false,
            gone: false,
          })
      }
    }
    this.pebbles = this.pebbles.filter((p) => p.y < H)
  }

  private checkpoint() {
    const par = levelCurve(this.level, ROVER_CURVES.par) * 60
    const spare = Math.max(0, Math.round((par - this.sectionTicks) / 60))
    const bonus = CHECKPOINT_POINTS * this.level + spare * 100
    this.addScore(bonus, W / 2, 120)
    this.sound.play('level')
    const letter = LETTERS[(this.level - 1) % LETTERS.length]!
    const next = this.level + 1
    this.startSection(next, this.sectionStart + SECTION, false)
    this.banner = {
      text: `CHECKPOINT ${letter}!`,
      sub: spare > 0 ? `${spare} SECONDS UNDER PAR  +${bonus}` : `+${bonus}`,
      ticks: 110,
    }
  }

  private crashRover(why: string) {
    if (this.crash > 0) return
    this.lives--
    this.crash = CRASH_TICKS
    this.sparks(this.roverX, GROUND - 8 - this.alt, '#fb923c', 20)
    this.sparks(this.roverX, GROUND - 8 - this.alt, '#e2e8f0', 10)
    this.sound.play('die')
    this.banner = {
      text: 'CRASH!',
      sub: this.lives > 0 ? `${why}  ${this.lives} LEFT` : why,
      ticks: CRASH_TICKS,
    }
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x: number, y: number) {
    if (this.demo || points <= 0) return
    this.score += points
    this.floaters.push({ x, y, text: String(points), life: 45 })
    if (this.score >= this.nextExtra) {
      this.nextExtra += EXTRA_AT * 2
      this.lives++
      this.sound.play('extra')
    }
  }

  private sparks(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.4 + this.rng() * 1.6
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 0.8,
        life: 22 + Math.floor(this.rng() * 14),
        color,
      })
    }
  }

  private updateEffects() {
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.05
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

  /**
   * Zaps ahead and overhead whenever it can, jumps craters (and any boulder it
   * cannot zap in time), and eases off when a pebble is about to land on it.
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
    if (this.tick % 5 === 0) {
      held.a = true
      frame.pressed.a = true
    }
    // A pebble coming down on the rover: change pace to slip out from under it.
    const rx = this.roverX
    const danger = this.pebbles.find(
      (p) => Math.abs(p.x - rx) < 22 && p.y > GROUND - 90 && p.y < GROUND - 10,
    )
    if (danger) {
      if (danger.x >= rx) held.left = true
      else held.right = true
    }
    if (this.alt > 0) return frame
    const front = this.wx + ROVER_HALF
    for (const o of this.obstacles) {
      if (o.gone || o.passed) continue
      if (o.kind === 'crater') {
        const lead = this.speed * 6 + 4
        if (o.x - front < lead && o.x + o.w > this.wx - 4) {
          held.up = true
          frame.pressed.up = true
          break
        }
      } else {
        const r = rockR(o)
        const dist = o.x - r - front
        // Too close to zap away in time (a big one needs two): jump it.
        const needed = (o.kind === 'big' ? 40 : 18) + this.speed * 6
        if (dist > 0 && dist < needed && (this.fwd || o.kind === 'big')) {
          held.up = true
          frame.pressed.up = true
          break
        }
      }
    }
    return frame
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    const sky = g.createLinearGradient(0, 0, 0, GROUND)
    sky.addColorStop(0, '#0f172a')
    sky.addColorStop(1, '#312e81')
    g.fillStyle = sky
    g.fillRect(0, 0, W, H)
    // Stars and a big blue world on the horizon.
    for (let i = 0; i < 40; i++) {
      const sx = (((i * 73 - this.camera * 0.05) % W) + W) % W
      g.fillStyle = i % 3 ? '#a5b4fc' : '#e0e7ff'
      g.fillRect(sx, HUD_H + ((i * 37) % 90), 1, 1)
    }
    g.fillStyle = '#38bdf8'
    g.beginPath()
    g.arc(250, HUD_H + 40, 18, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#4ade80'
    g.fillRect(240, HUD_H + 32, 8, 6)
    g.fillRect(254, HUD_H + 44, 7, 5)
    this.renderHills(g, 0.15, 150, 30, '#4338ca')
    this.renderHills(g, 0.35, 172, 18, '#3730a3')
    this.renderGround(g)
    for (const o of this.obstacles)
      if (!o.gone && o.kind !== 'crater') this.renderRock(g, o)
    this.renderPost(g)
    for (const sp of this.sprites) this.renderSprite(g, sp)
    for (const p of this.pebbles) {
      g.fillStyle = '#d6d3d1'
      g.fillRect(p.x - 2, p.y - 2, 4, 4)
    }
    if (this.fwd) {
      g.fillStyle = '#fde047'
      g.fillRect(this.fwd.x - this.camera - 3, this.fwd.y - 1, 6, 2)
    }
    for (const s of this.ups) {
      g.fillStyle = '#a5f3fc'
      g.fillRect(s.x - this.camera - 1, s.y - 3, 2, 6)
    }
    if (this.crash === 0 || this.crash > CRASH_TICKS - 8) this.renderRover(g)
    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, p.life / 30)
      g.fillStyle = p.color
      g.fillRect(p.x - 1, p.y - 1, 2, 2)
    }
    g.globalAlpha = 1
    for (const f of this.floaters)
      drawText(g, f.text, f.x, f.y, {
        align: 'center',
        color: '#fef9c3',
        shadow: '#1e1b4b',
      })
    this.renderHud(g)
  }

  private renderHills(
    g: CanvasRenderingContext2D,
    rate: number,
    base: number,
    height: number,
    color: string,
  ) {
    const shift = this.camera * rate
    g.fillStyle = color
    g.beginPath()
    g.moveTo(0, GROUND)
    for (let x = 0; x <= W; x += 8) {
      const wx = x + shift
      const y =
        base -
        height * (0.5 + 0.3 * Math.sin(wx / 47) + 0.2 * Math.sin(wx / 19))
      g.lineTo(x, y)
    }
    g.lineTo(W, GROUND)
    g.closePath()
    g.fill()
  }

  private renderGround(g: CanvasRenderingContext2D) {
    g.fillStyle = '#a8a29e'
    g.fillRect(0, GROUND, W, H - GROUND)
    g.fillStyle = '#d6d3d1'
    g.fillRect(0, GROUND, W, 2)
    // Pock marks scroll with the ground.
    g.fillStyle = '#78716c'
    for (let i = 0; i < 24; i++) {
      const x = ((((i * 61 - this.camera) % (W + 40)) + W + 40) % (W + 40)) - 20
      g.fillRect(x, GROUND + 8 + ((i * 13) % 22), 5, 2)
    }
    for (const o of this.obstacles) {
      if (o.kind !== 'crater' || o.gone) continue
      const sx = o.x - this.camera
      g.fillStyle = '#1c1917'
      g.beginPath()
      g.moveTo(sx, GROUND)
      g.lineTo(sx + o.w, GROUND)
      g.lineTo(sx + o.w - 4, GROUND + 14)
      g.lineTo(sx + 4, GROUND + 14)
      g.closePath()
      g.fill()
      g.fillStyle = '#57534e'
      g.fillRect(sx - 3, GROUND - 2, 4, 2)
      g.fillRect(sx + o.w - 1, GROUND - 2, 4, 2)
    }
  }

  private renderRock(g: CanvasRenderingContext2D, o: Ob) {
    const sx = o.x - this.camera
    const r = rockR(o)
    const spin = o.kind === 'roller' ? -this.tick * 0.1 : 0
    g.save()
    g.translate(sx, GROUND - r)
    g.rotate(spin)
    g.fillStyle = o.kind === 'roller' ? '#92400e' : '#78716c'
    g.beginPath()
    g.arc(0, 0, r, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = o.kind === 'roller' ? '#b45309' : '#a8a29e'
    g.fillRect(-r / 2, -r / 2, r / 2, r / 3)
    g.fillStyle = '#44403c'
    g.fillRect(r / 4, r / 6, 2, 2)
    g.restore()
  }

  private renderPost(g: CanvasRenderingContext2D) {
    const sx = this.sectionStart + SECTION - this.camera
    if (sx < -20 || sx > W + 20) return
    const letter = LETTERS[(this.level - 1) % LETTERS.length]!
    g.fillStyle = '#e2e8f0'
    g.fillRect(sx, GROUND - 40, 2, 40)
    g.fillStyle = '#f472b6'
    g.fillRect(sx + 2, GROUND - 40, 14, 12)
    drawText(g, letter, sx + 9, GROUND - 37, {
      align: 'center',
      color: '#ffffff',
    })
  }

  private renderSprite(g: CanvasRenderingContext2D, sp: Sprite) {
    const glow = Math.floor((this.tick + sp.phase * 10) / 6) % 2
    g.fillStyle = glow ? '#c4b5fd' : '#a78bfa'
    g.beginPath()
    g.ellipse(sp.x, sp.y, 8, 4, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#ede9fe'
    g.fillRect(sp.x - 3, sp.y - 6, 6, 3)
    g.fillStyle = '#facc15'
    g.fillRect(sp.x - 5, sp.y, 2, 1)
    g.fillRect(sp.x + 3, sp.y, 2, 1)
  }

  private renderRover(g: CanvasRenderingContext2D) {
    const x = Math.round(this.roverX)
    const y = Math.round(GROUND - this.alt)
    const bounce = this.alt === 0 ? Math.floor(this.tick / 5) % 2 : 0
    // Body, cab and antenna.
    g.fillStyle = '#f97316'
    g.fillRect(x - ROVER_HALF, y - 12 - bounce, ROVER_HALF * 2, 6)
    g.fillStyle = '#e2e8f0'
    g.fillRect(x - 5, y - 18 - bounce, 10, 6)
    g.fillStyle = '#38bdf8'
    g.fillRect(x - 3, y - 17 - bounce, 6, 3)
    g.fillStyle = '#94a3b8'
    g.fillRect(x - 9, y - 22 - bounce, 1, 10)
    g.fillStyle = '#f87171'
    g.fillRect(x - 10, y - 24 - bounce, 3, 2)
    // Six wheels.
    g.fillStyle = '#1e293b'
    for (let i = 0; i < 3; i++) {
      const wx = x - 8 + i * 8
      const lift =
        this.alt === 0 && (i + Math.floor(this.tick / 4)) % 3 === 0 ? 1 : 0
      g.fillRect(wx - 3, y - 6 - lift, 6, 6)
      g.fillStyle = '#64748b'
      g.fillRect(wx - 1, y - 4 - lift, 2, 2)
      g.fillStyle = '#1e293b'
    }
  }

  private renderHud(g: CanvasRenderingContext2D) {
    const shadow = '#1e1b4b'
    g.fillStyle = 'rgba(15, 23, 42, 0.9)'
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
    const letter = LETTERS[(this.level - 1) % LETTERS.length]!
    drawText(g, `SECTION ${letter}`, W - 4, 12, {
      align: 'right',
      color: '#a5f3fc',
    })
    const secs = Math.floor(this.sectionTicks / 60)
    const par = Math.round(levelCurve(this.level, ROVER_CURVES.par))
    drawText(g, `TIME ${secs}  PAR ${par}`, 96, 3, {
      color: secs <= par ? '#bbf7d0' : '#fca5a5',
    })
    // Progress along the section.
    const progress = Math.min(1, (this.wx - this.sectionStart) / SECTION)
    g.fillStyle = '#334155'
    g.fillRect(96, 14, 90, 4)
    g.fillStyle = '#f472b6'
    g.fillRect(96, 14, 90 * progress, 4)
    for (let i = 0; i < Math.min(this.lives - 1, 4); i++) {
      g.fillStyle = '#f97316'
      g.fillRect(196 + i * 12, 14, 9, 4)
      g.fillStyle = '#1e293b'
      g.fillRect(196 + i * 12, 18, 2, 2)
      g.fillRect(203 + i * 12, 18, 2, 2)
    }
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, 84, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        shadow,
      })
      if (this.banner.sub)
        drawText(g, this.banner.sub, W / 2, 104, {
          align: 'center',
          color: '#fef9c3',
          shadow,
        })
    }
  }
}

const roverRamble: ArcadeGameModule = {
  create: (options) => new RoverRamble(options),
}

export const create = roverRamble.create
export default roverRamble
