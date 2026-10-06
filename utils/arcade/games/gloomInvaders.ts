// /utils/arcade/games/gloomInvaders.ts
//
// Gloom Invaders -- the Kind Robots Arcade's Space Invaders riff (conductor
// kr-arcade/t-009 game factory). Rows of grumpy gloom clouds march down the
// sky. Sunny, a little solar robot, shines sunbeams up at them: every cloud a
// beam reaches turns into a smiling rain cloud and drifts off to water the
// garden. Rainbow umbrellas shelter Sunny from the gloom drops, but they wear
// away (Sunny's own beams nibble them too).
//
// Each wave starts lower and marches faster, the last clouds of a wave hurry,
// and a rainbow kite crosses the top now and then for a mystery bonus. Left
// and right move; A (or Up) shines a sunbeam. One beam at a time, so aim. If
// the gloom reaches the ground Sunny loses a life and the wave regroups.

import { levelCurve } from '../curve'
import { drawText } from '../font'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'

const W = 288
const H = 384
const GROUND_Y = H - 18
const PLAYER_Y = H - 34
const PLAYER_HALF = 8
const PLAYER_SPEED = 2
const BEAM_SPEED = 6
const AUTOFIRE_COOLDOWN = 14

const COLS = 9
const ROWS = 5
const CELL_W = 24
const CELL_H = 18
const CLOUD_W = 18
const CLOUD_H = 12
const STEP_X = 4
const HURRY_STEP_X = 6
const DROP_Y = 8
const EDGE = 6
/** Top row is the storm cloud; the bottom rows are the small grumps. */
const ROW_POINTS = [30, 20, 20, 10, 10]

const UMBRELLAS = 4
const UMB_COLS = 22
const UMB_ROWS = 13
const UMB_CELL = 2
const UMBRELLA_Y = H - 84

const START_LIVES = 3
const FIRST_EXTRA = 1500
const EXTRA_EVERY = 10_000
const DEATH_TICKS = 100
const WAVE_CLEAR_TICKS = 130

const KITE_Y = 32
/** The rainbow kite's mystery values, picked by how many beams you've shone. */
const KITE_VALUES = [
  100, 50, 50, 100, 150, 100, 100, 50, 300, 100, 100, 100, 50, 150, 100,
]

const RAINBOW = [
  '#ef4444',
  '#f97316',
  '#facc15',
  '#4ade80',
  '#38bdf8',
  '#a78bfa',
]

export const GLOOM_CURVES = {
  /** Extra ticks between formation steps while the whole wave is alive. */
  march: { start: 34, step: -3, limit: 16 },
  /** Where the formation's top row starts: each wave a little lower. */
  startY: { start: 52, step: 8, limit: 100 },
  dropEvery: { start: 48, step: -4, limit: 16 },
  maxDrops: { start: 2, step: 0.5, limit: 6 },
  dropSpeed: { start: 2, step: 0.15, limit: 3.6 },
  kiteEvery: { start: 1500, step: -60, limit: 900 },
} as const

type Cloud = { col: number; row: number; alive: boolean }
type Drop = { x: number; y: number; speed: number }
type Happy = { x: number; y: number; life: number }
type Umbrella = { x: number; cells: boolean[] }
type Kite = { x: number; dir: 1 | -1 }
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = { x: number; y: number; text: string; life: number }

/** The umbrella bitmap: a dome canopy over a hooked handle. */
function umbrellaShape(): boolean[] {
  const cells: boolean[] = []
  const cx = (UMB_COLS - 1) / 2
  for (let r = 0; r < UMB_ROWS; r++) {
    for (let c = 0; c < UMB_COLS; c++) {
      let on: boolean
      if (r < 9) {
        const dx = (c - cx) / (UMB_COLS / 2)
        const dy = (8.5 - r) / 9
        on = dx * dx + dy * dy <= 1
        // Scalloped hem between the ribs.
        if (r === 8 && c % 5 === 2) on = false
      } else {
        on = c === 10 || c === 11
        if (r === UMB_ROWS - 1 && (c === 7 || c === 8 || c === 9)) on = true
        if (r === UMB_ROWS - 2 && c === 7) on = true
      }
      cells.push(on)
    }
  }
  return cells
}

class GloomInvaders implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private px = W / 2
  private beam: { x: number; y: number } | null = null
  private fireCooldown = 0
  private beamsShone = 0
  private clouds: Cloud[] = []
  private fx = 0
  private fy = 0
  private dir: 1 | -1 = 1
  private stepTimer = 0
  private frame = 0
  private lastBeat = 0
  private drops: Drop[] = []
  private dropTimer = 0
  private umbrellas: Umbrella[] = []
  private kite: Kite | null = null
  private kiteTimer = 0
  private happies: Happy[] = []
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private dead = 0
  private waveClear = 0
  /** Waves cleared this game: each one grows a flower in the garden. */
  private cleared = 0
  private nextExtra = FIRST_EXTRA
  private banner: { text: string; sub?: string; ticks: number } | null = null
  private stars: Array<{ x: number; y: number; phase: number }> = []

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    for (let i = 0; i < 40; i++) {
      this.stars.push({
        x: this.rng() * W,
        y: 20 + this.rng() * (UMBRELLA_Y - 40),
        phase: this.rng() * Math.PI * 2,
      })
    }
    this.startWave(1)
  }

  // --- setup -------------------------------------------------------------------

  private startWave(wave: number) {
    this.level = wave
    this.clouds = []
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        this.clouds.push({ col, row, alive: true })
      }
    }
    this.umbrellas = Array.from({ length: UMBRELLAS }, (_, i) => ({
      x: Math.round((W * (i + 0.5)) / UMBRELLAS - (UMB_COLS * UMB_CELL) / 2),
      cells: umbrellaShape(),
    }))
    this.regroup()
    this.kite = null
    this.kiteTimer = Math.round(levelCurve(wave, GLOOM_CURVES.kiteEvery))
    this.banner = { text: `WAVE ${wave}`, sub: 'SHINE ON THE GLOOM', ticks: 90 }
  }

  /** Put the formation back at the wave's starting height. */
  private regroup() {
    this.fx = Math.round((W - ((COLS - 1) * CELL_W + CLOUD_W)) / 2)
    this.fy = Math.round(levelCurve(this.level, GLOOM_CURVES.startY))
    this.dir = 1
    this.stepTimer = 30
    this.drops = []
    this.dropTimer = 60
    this.beam = null
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    const controls = this.demo ? this.demoInput() : input

    if (this.dead > 0) {
      if (--this.dead === 0) {
        if (this.lives <= 0) {
          this.over = true
          this.banner = { text: 'GAME OVER', ticks: 9999 }
        } else {
          this.px = W / 2
          this.drops = []
        }
      }
      return
    }
    if (this.waveClear > 0) {
      this.movePlayer(controls)
      if (--this.waveClear === 0) this.startWave(this.level + 1)
      return
    }

    this.movePlayer(controls)
    this.fire(controls)
    this.updateBeam()
    this.march()
    if (this.dead > 0) return
    this.updateDrops()
    this.updateKite()
    if (this.clouds.every((c) => !c.alive)) this.clearWave()
  }

  private movePlayer(input: InputFrame) {
    if (input.held.left) this.px -= PLAYER_SPEED
    if (input.held.right) this.px += PLAYER_SPEED
    this.px = Math.max(PLAYER_HALF + 4, Math.min(W - PLAYER_HALF - 4, this.px))
  }

  private fire(input: InputFrame) {
    if (this.fireCooldown > 0) this.fireCooldown--
    if (this.beam) return
    const pressed = input.pressed.a || input.pressed.up
    const held = (input.held.a || input.held.up) && this.fireCooldown === 0
    if (!pressed && !held) return
    this.beam = { x: this.px, y: PLAYER_Y - 10 }
    this.beamsShone++
    this.fireCooldown = AUTOFIRE_COOLDOWN
    this.sound.play('shoot')
  }

  private updateBeam() {
    const beam = this.beam
    if (!beam) return
    // Check every couple of pixels so a fast beam never skips a cloud edge.
    for (let i = 0; i < BEAM_SPEED; i += 2) {
      beam.y -= 2
      if (beam.y < 20) {
        this.beam = null
        return
      }
      const hit = this.umbrellaCell(beam.x, beam.y)
      if (hit) {
        this.erode(hit[0], hit[1], 1.6)
        this.beam = null
        return
      }
      if (this.kite && Math.abs(beam.x - this.kite.x) < 10) {
        if (Math.abs(beam.y - KITE_Y) < 7) {
          this.hitKite()
          this.beam = null
          return
        }
      }
      for (const cloud of this.clouds) {
        if (!cloud.alive) continue
        const x = this.fx + cloud.col * CELL_W
        const y = this.fy + cloud.row * CELL_H
        if (beam.x < x || beam.x > x + CLOUD_W) continue
        if (beam.y < y || beam.y > y + CLOUD_H) continue
        this.hitCloud(cloud, x, y)
        this.beam = null
        return
      }
      for (const [j, drop] of this.drops.entries()) {
        if (Math.abs(drop.x - beam.x) < 3 && Math.abs(drop.y - beam.y) < 5) {
          // A sunbeam evaporates a gloom drop on the way up.
          this.drops.splice(j, 1)
          this.burst(beam.x, beam.y, 4, '#fde68a')
          this.beam = null
          return
        }
      }
    }
  }

  private hitCloud(cloud: Cloud, x: number, y: number) {
    cloud.alive = false
    this.addScore(ROW_POINTS[cloud.row] ?? 10, x + CLOUD_W / 2, y)
    this.happies.push({ x, y, life: 60 })
    this.burst(x + CLOUD_W / 2, y + CLOUD_H / 2, 6, '#fde68a')
    this.sound.play('pop')
  }

  private hitKite() {
    const kite = this.kite!
    const value = KITE_VALUES[this.beamsShone % KITE_VALUES.length]!
    this.addScore(value, kite.x, KITE_Y + 10)
    for (let i = 0; i < RAINBOW.length; i++) {
      this.burst(kite.x, KITE_Y, 2, RAINBOW[i]!)
    }
    this.kite = null
    this.sound.play('pickup')
  }

  private aliveClouds(): Cloud[] {
    return this.clouds.filter((c) => c.alive)
  }

  private march() {
    if (--this.stepTimer > 0) return
    const alive = this.aliveClouds()
    if (!alive.length) return
    const total = COLS * ROWS
    const pace = levelCurve(this.level, GLOOM_CURVES.march)
    const hurry = alive.length <= 1
    this.stepTimer = hurry
      ? 1
      : Math.max(1, Math.round(1 + (pace * (alive.length - 1)) / (total - 1)))
    const dx = (hurry ? HURRY_STEP_X : STEP_X) * this.dir
    const minCol = Math.min(...alive.map((c) => c.col))
    const maxCol = Math.max(...alive.map((c) => c.col))
    const left = this.fx + minCol * CELL_W + dx
    const right = this.fx + maxCol * CELL_W + CLOUD_W + dx
    if (left < EDGE || right > W - EDGE) {
      this.fy += DROP_Y
      this.dir = this.dir === 1 ? -1 : 1
    } else {
      this.fx += dx
    }
    this.frame ^= 1
    if (this.tick - this.lastBeat >= 10) {
      this.lastBeat = this.tick
      this.sound.play('blip')
    }
    // Clouds low enough to touch the umbrellas soak them away.
    const maxRow = Math.max(...alive.map((c) => c.row))
    const bottom = this.fy + maxRow * CELL_H + CLOUD_H
    if (bottom >= UMBRELLA_Y) {
      for (const cloud of alive) {
        const x = this.fx + cloud.col * CELL_W
        const y = this.fy + cloud.row * CELL_H
        this.soak(x, y)
      }
    }
    if (bottom >= PLAYER_Y - 6) this.invaded()
  }

  private invaded() {
    this.lives--
    this.dead = DEATH_TICKS
    this.burst(this.px, PLAYER_Y, 16, '#94a3b8')
    this.banner = { text: 'THE GLOOM LANDED', sub: 'REGROUPING', ticks: 100 }
    this.sound.play('die')
    this.regroup()
  }

  private updateDrops() {
    const speedCap = levelCurve(this.level, GLOOM_CURVES.dropSpeed)
    for (const drop of this.drops) drop.y += drop.speed
    this.drops = this.drops.filter((drop) => {
      if (drop.y > GROUND_Y) {
        this.burst(drop.x, GROUND_Y, 2, '#7c3aed')
        return false
      }
      const hit = this.umbrellaCell(drop.x, drop.y + 3)
      if (hit) {
        this.erode(hit[0], hit[1], 1.8)
        return false
      }
      if (
        Math.abs(drop.x - this.px) < PLAYER_HALF &&
        drop.y + 3 > PLAYER_Y - 6 &&
        drop.y < PLAYER_Y + 6
      ) {
        this.playerHit()
        return false
      }
      return true
    })
    if (this.dead > 0) return
    if (--this.dropTimer > 0) return
    this.dropTimer = Math.round(levelCurve(this.level, GLOOM_CURVES.dropEvery))
    const maxDrops = Math.round(levelCurve(this.level, GLOOM_CURVES.maxDrops))
    if (this.drops.length >= maxDrops) return
    const alive = this.aliveClouds()
    if (!alive.length) return
    // A third of the drops come from the column over Sunny.
    let col: number
    if (this.rng() < 0.34) {
      col = alive.reduce((best, c) => {
        const d = Math.abs(this.fx + c.col * CELL_W + CLOUD_W / 2 - this.px)
        const bd = Math.abs(this.fx + best.col * CELL_W + CLOUD_W / 2 - this.px)
        return d < bd ? c : best
      }).col
    } else {
      col = alive[Math.floor(this.rng() * alive.length)]!.col
    }
    const lowest = alive
      .filter((c) => c.col === col)
      .reduce((a, b) => (b.row > a.row ? b : a))
    this.drops.push({
      x: this.fx + col * CELL_W + CLOUD_W / 2,
      y: this.fy + lowest.row * CELL_H + CLOUD_H,
      speed: speedCap * (0.75 + this.rng() * 0.25),
    })
  }

  private playerHit() {
    this.lives--
    this.dead = DEATH_TICKS
    this.beam = null
    this.burst(this.px, PLAYER_Y, 18, '#facc15')
    this.burst(this.px, PLAYER_Y, 10, '#7c3aed')
    this.sound.play('die')
    if (this.lives > 0) {
      this.banner = { text: 'SUNNY GOT SOAKED', ticks: 90 }
    }
  }

  private updateKite() {
    if (this.kite) {
      this.kite.x += this.kite.dir * 1.2
      if (this.kite.x < -16 || this.kite.x > W + 16) this.kite = null
      return
    }
    if (--this.kiteTimer > 0) return
    this.kiteTimer = Math.round(levelCurve(this.level, GLOOM_CURVES.kiteEvery))
    // Like the classic saucer, the kite stays away once the wave is nearly done.
    if (this.aliveClouds().length < 8) return
    const dir = this.rng() < 0.5 ? 1 : -1
    this.kite = { x: dir === 1 ? -14 : W + 14, dir }
    this.sound.play('warn')
  }

  private clearWave() {
    this.cleared++
    this.waveClear = WAVE_CLEAR_TICKS
    this.drops = []
    this.beam = null
    this.kite = null
    this.addScore(100 * this.level, W / 2, 150)
    this.banner = {
      text: 'SKY CLEARED!',
      sub: 'THE GARDEN GETS RAIN',
      ticks: WAVE_CLEAR_TICKS,
    }
    this.sound.play('level')
  }

  // --- umbrellas ----------------------------------------------------------------

  private umbrellaCell(x: number, y: number): [Umbrella, number] | null {
    if (y < UMBRELLA_Y || y >= UMBRELLA_Y + UMB_ROWS * UMB_CELL) return null
    const r = Math.floor((y - UMBRELLA_Y) / UMB_CELL)
    for (const u of this.umbrellas) {
      const c = Math.floor((x - u.x) / UMB_CELL)
      if (c < 0 || c >= UMB_COLS) continue
      const index = r * UMB_COLS + c
      if (u.cells[index]) return [u, index]
    }
    return null
  }

  /** Knock a ragged hole in an umbrella around one cell. */
  private erode(u: Umbrella, index: number, radius: number) {
    const r0 = Math.floor(index / UMB_COLS)
    const c0 = index % UMB_COLS
    const reach = Math.ceil(radius)
    for (let dr = -reach; dr <= reach; dr++) {
      for (let dc = -reach; dc <= reach; dc++) {
        const r = r0 + dr
        const c = c0 + dc
        if (r < 0 || r >= UMB_ROWS || c < 0 || c >= UMB_COLS) continue
        if (dr * dr + dc * dc > radius * radius + this.rng() * 1.5) continue
        u.cells[r * UMB_COLS + c] = false
      }
    }
    this.burst(u.x + c0 * UMB_CELL, UMBRELLA_Y + r0 * UMB_CELL, 2, '#f9a8d4')
  }

  /** A cloud low enough to touch an umbrella soaks those cells away. */
  private soak(x: number, y: number) {
    for (const u of this.umbrellas) {
      for (let r = 0; r < UMB_ROWS; r++) {
        const cy = UMBRELLA_Y + r * UMB_CELL
        if (cy < y || cy > y + CLOUD_H) continue
        for (let c = 0; c < UMB_COLS; c++) {
          const cx = u.x + c * UMB_CELL
          if (cx >= x && cx <= x + CLOUD_W) u.cells[r * UMB_COLS + c] = false
        }
      }
    }
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x: number, y: number) {
    if (this.demo) return
    this.score += points
    this.floaters.push({ x, y, text: String(points), life: 40 })
    if (this.score >= this.nextExtra) {
      this.lives++
      this.nextExtra =
        this.nextExtra === FIRST_EXTRA
          ? EXTRA_EVERY
          : this.nextExtra + EXTRA_EVERY
      this.banner = { text: 'EXTRA SUNNY!', ticks: 90 }
      this.sound.play('extra')
    }
  }

  private burst(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.4 + this.rng() * 1.6
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 18 + Math.floor(this.rng() * 14),
        color,
      })
    }
  }

  private updateEffects() {
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      p.life--
    }
    this.particles = this.particles.filter((p) => p.life > 0)
    for (const f of this.floaters) {
      f.y -= 0.4
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
    for (const h of this.happies) {
      h.y -= 0.5
      h.life--
    }
    this.happies = this.happies.filter((h) => h.life > 0)
  }

  // --- attract-mode pilot -----------------------------------------------------

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
    // Dodge a gloom drop that is about to land on Sunny.
    const threat = this.drops.find(
      (d) =>
        Math.abs(d.x - this.px) < PLAYER_HALF + 6 &&
        d.y > PLAYER_Y - 110 &&
        d.y < PLAYER_Y,
    )
    if (threat) {
      const goLeft = threat.x >= this.px ? this.px > 30 : this.px > W - 30
      if (goLeft) held.left = true
      else held.right = true
      return frame
    }
    // Otherwise line up under the lowest column and shine.
    const alive = this.aliveClouds()
    if (!alive.length) return frame
    const target = alive.reduce((a, b) =>
      b.row > a.row || (b.row === a.row && this.rng() < 0.1) ? b : a,
    )
    const tx =
      this.fx + target.col * CELL_W + CLOUD_W / 2 + this.dir * STEP_X * 2
    if (tx < this.px - 3) held.left = true
    else if (tx > this.px + 3) held.right = true
    else held.a = true
    return frame
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    this.renderSky(g)
    this.renderGarden(g)
    this.renderUmbrellas(g)
    for (const cloud of this.clouds) {
      if (!cloud.alive) continue
      this.renderGloom(
        g,
        this.fx + cloud.col * CELL_W,
        this.fy + cloud.row * CELL_H,
        cloud.row,
      )
    }
    for (const h of this.happies) this.renderHappy(g, h)
    if (this.kite) this.renderKite(g, this.kite)
    for (const d of this.drops) this.renderDrop(g, d)
    if (this.beam) {
      g.fillStyle = 'rgba(253, 224, 71, 0.35)'
      g.fillRect(this.beam.x - 2, this.beam.y - 1, 4, 10)
      g.fillStyle = '#fef08a'
      g.fillRect(this.beam.x - 1, this.beam.y, 2, 8)
    }
    if (this.dead === 0 && !this.over) this.renderSunny(g, this.px, PLAYER_Y)
    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, p.life / 30)
      g.fillStyle = p.color
      g.fillRect(p.x - 1, p.y - 1, 2, 2)
    }
    g.globalAlpha = 1
    for (const f of this.floaters) {
      drawText(g, f.text, f.x, f.y, { align: 'center', color: '#fde68a' })
    }
    this.renderHud(g)
  }

  private renderSky(g: CanvasRenderingContext2D) {
    const sky = g.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, '#0b1026')
    sky.addColorStop(0.7, '#1e1b4b')
    sky.addColorStop(1, '#4c1d95')
    g.fillStyle = sky
    g.fillRect(0, 0, W, H)
    for (const s of this.stars) {
      const twinkle = 0.4 + 0.4 * Math.sin(this.tick / 25 + s.phase)
      g.globalAlpha = twinkle
      g.fillStyle = '#e0e7ff'
      g.fillRect(s.x, s.y, 1, 1)
    }
    g.globalAlpha = 1
  }

  private renderGarden(g: CanvasRenderingContext2D) {
    g.fillStyle = '#14532d'
    g.fillRect(0, GROUND_Y, W, H - GROUND_Y)
    g.fillStyle = '#4ade80'
    g.fillRect(0, GROUND_Y, W, 2)
    // One flower for every wave cleared, up to a full row.
    const flowers = Math.min(this.cleared, 11)
    for (let i = 0; i < flowers; i++) {
      const x = 92 + i * 12
      g.fillStyle = '#22c55e'
      g.fillRect(x, GROUND_Y - 6, 1, 6)
      g.fillStyle = RAINBOW[i % RAINBOW.length]!
      g.fillRect(x - 2, GROUND_Y - 9, 5, 3)
      g.fillRect(x - 1, GROUND_Y - 10, 3, 5)
      g.fillStyle = '#fef9c3'
      g.fillRect(x, GROUND_Y - 8, 1, 1)
    }
  }

  private renderUmbrellas(g: CanvasRenderingContext2D) {
    const stripe = UMB_COLS / RAINBOW.length
    for (const u of this.umbrellas) {
      for (let r = 0; r < UMB_ROWS; r++) {
        for (let c = 0; c < UMB_COLS; c++) {
          if (!u.cells[r * UMB_COLS + c]) continue
          g.fillStyle =
            r < 9
              ? RAINBOW[Math.min(RAINBOW.length - 1, Math.floor(c / stripe))]!
              : '#e5e7eb'
          g.fillRect(
            u.x + c * UMB_CELL,
            UMBRELLA_Y + r * UMB_CELL,
            UMB_CELL,
            UMB_CELL,
          )
        }
      }
    }
  }

  private puff(
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    wobble: number,
  ) {
    g.beginPath()
    g.arc(x + 5, y + 7, 5 + wobble, 0, Math.PI * 2)
    g.arc(x + 10, y + 5, 6 - wobble, 0, Math.PI * 2)
    g.arc(x + 14, y + 7, 4.5 + wobble, 0, Math.PI * 2)
    g.fill()
    g.fillRect(x + 2, y + 7, 15, 5)
  }

  private renderGloom(
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    row: number,
  ) {
    const wobble = this.frame ? 0.6 : -0.6
    g.fillStyle = row === 0 ? '#4c1d95' : row < 3 ? '#475569' : '#334155'
    this.puff(g, x, y, wobble)
    // Grumpy face: two eyes and a frown with drooping corners.
    g.fillStyle = '#0f172a'
    g.fillRect(x + 6, y + 5, 2, 2)
    g.fillRect(x + 11, y + 5, 2, 2)
    g.fillRect(x + 7, y + 9, 5, 1)
    g.fillRect(x + 6, y + 10, 1, 1)
    g.fillRect(x + 12, y + 10, 1, 1)
    if (row === 0) {
      // The storm cloud flickers a little lightning on alternate steps.
      if (this.frame) {
        g.fillStyle = '#fde047'
        g.fillRect(x + 9, y + 12, 2, 2)
        g.fillRect(x + 8, y + 14, 2, 2)
      }
    } else {
      g.fillStyle = '#7c3aed'
      const off = this.frame ? 0 : 3
      g.fillRect(x + 4 + off, y + 13, 1, 2)
      g.fillRect(x + 11 + off, y + 13, 1, 2)
    }
  }

  private renderHappy(g: CanvasRenderingContext2D, h: Happy) {
    g.globalAlpha = Math.min(1, h.life / 30)
    g.fillStyle = '#f5f3ff'
    this.puff(g, h.x, h.y, 0)
    g.fillStyle = '#7c3aed'
    g.fillRect(h.x + 6, h.y + 5, 2, 2)
    g.fillRect(h.x + 11, h.y + 5, 2, 2)
    // A smile: corners up.
    g.fillStyle = '#ec4899'
    g.fillRect(h.x + 7, h.y + 10, 5, 1)
    g.fillRect(h.x + 6, h.y + 9, 1, 1)
    g.fillRect(h.x + 12, h.y + 9, 1, 1)
    // Gentle rain for the garden.
    g.fillStyle = '#38bdf8'
    for (let i = 0; i < 3; i++) {
      const fall = (60 - h.life + i * 7) % 14
      g.fillRect(h.x + 4 + i * 5, h.y + 13 + fall, 1, 3)
    }
    g.globalAlpha = 1
  }

  private renderKite(g: CanvasRenderingContext2D, kite: Kite) {
    const x = kite.x
    const y = KITE_Y
    RAINBOW.forEach((color, i) => {
      g.fillStyle = color
      const half = 8 - Math.abs(i - 2.5) * 2.4
      g.fillRect(x - half, y - 6 + i * 2, half * 2, 2)
    })
    // The tail flutters behind.
    g.fillStyle = '#f9a8d4'
    for (let i = 1; i <= 4; i++) {
      const tx = x - kite.dir * i * 4
      const ty = y + 6 + Math.sin(this.tick / 5 + i) * 2 + i
      g.fillRect(tx, ty, 2, 2)
    }
  }

  private renderDrop(g: CanvasRenderingContext2D, d: Drop) {
    const zig = Math.floor(this.tick / 4) % 2 === 0 ? 1 : -1
    g.fillStyle = '#a855f7'
    g.fillRect(d.x - 1, d.y, 2, 2)
    g.fillRect(d.x - 1 + zig, d.y + 2, 2, 2)
    g.fillRect(d.x - 1, d.y + 4, 2, 2)
    g.fillStyle = '#581c87'
    g.fillRect(d.x - 1 - zig, d.y + 6, 2, 1)
  }

  private renderSunny(g: CanvasRenderingContext2D, x: number, y: number) {
    // Wheels, body, and a sun dish on top with turning rays.
    g.fillStyle = '#0f172a'
    g.fillRect(x - 8, y + 4, 4, 3)
    g.fillRect(x + 4, y + 4, 4, 3)
    g.fillStyle = '#14b8a6'
    g.fillRect(x - 8, y - 2, 16, 7)
    g.fillStyle = '#5eead4'
    g.fillRect(x - 6, y - 1, 12, 2)
    g.fillStyle = '#0f172a'
    g.fillRect(x - 4, y + 1, 2, 2)
    g.fillRect(x + 2, y + 1, 2, 2)
    g.fillStyle = '#facc15'
    g.beginPath()
    g.arc(x, y - 6, 4, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#fde68a'
    for (let i = 0; i < 6; i++) {
      const a = this.tick / 20 + (i * Math.PI) / 3
      g.fillRect(
        x + Math.cos(a) * 7 - 0.5,
        y - 6 + Math.sin(a) * 7 - 0.5,
        1.5,
        1.5,
      )
    }
  }

  private renderHud(g: CanvasRenderingContext2D) {
    const shadow = '#1e1b4b'
    drawText(g, String(this.score).padStart(6, '0'), 6, 4, {
      scale: 2,
      color: '#fde047',
      shadow,
    })
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W - 6, 4, {
      align: 'right',
      color: '#f9a8d4',
      shadow,
    })
    // Spare Sunnies wait in the garden.
    for (let i = 0; i < Math.min(this.lives - 1, 5); i++) {
      g.fillStyle = '#14b8a6'
      g.fillRect(8 + i * 12, GROUND_Y + 8, 8, 4)
      g.fillStyle = '#facc15'
      g.fillRect(10 + i * 12, GROUND_Y + 5, 4, 3)
    }
    drawText(g, `WAVE ${this.level}`, W - 6, GROUND_Y + 6, {
      align: 'right',
      color: '#bbf7d0',
    })
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, 170, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        shadow: '#7c3aed',
      })
      if (this.banner.sub) {
        drawText(g, this.banner.sub, W / 2, 190, {
          align: 'center',
          color: '#fde68a',
          shadow,
        })
      }
    }
  }
}

const gloomInvaders: ArcadeGameModule = {
  create: (options) => new GloomInvaders(options),
}

export const create = gloomInvaders.create
export default gloomInvaders
