// /utils/arcade/games/glitchGarden.ts
//
// Glitch Garden -- the Kind Robots Arcade's Centipede riff (conductor
// kr-arcade/t-009 game factory, batch 3). A long glitch-worm winds down
// through a garden of glitchy mushroom lamps. Spray fix-it beams up from the
// flowerbed: a fixed segment drops out of the worm as a sprout (the worm
// splits there, and the piece behind grows a new head), and lamps and sprouts
// sprayed enough times bloom into flowers. The worm turns at every lamp, so a
// crowded garden brings it down sooner.
//
// From wave 2 a beetle zig-zags through the flowerbed nibbling lamps, and a
// moth dives straight down planting new lamps when the bed runs bare. Later
// worms are faster and arrive with extra loose heads. Touching a worm segment
// or the beetle costs a sprayer; every 12,000 points earns one back.
//
// Arrows move the sprayer around the flowerbed; A (or B) sprays. One beam at a
// time, so get close to fire faster.

import { levelCurve } from '../curve'
import { drawText } from '../font'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'

const CELL = 8
const COLS = 30
const ROWS = 36
const HUD = 16
const W = COLS * CELL
const H = HUD + ROWS * CELL
/** The flowerbed: the bottom rows, where the sprayer roams. */
const BED_ROWS = 6
const BED_TOP = ROWS - BED_ROWS
const BEAM_SPEED = 9
const SPRAYER_SPEED = 1.6
const LAMP_HP = 4
const SPROUT_HP = 3
const START_LIVES = 3
const DEATH_TICKS = 110
const WAVE_CLEAR_TICKS = 110
const EXTRA_EVERY = 12_000

const HEAD_POINTS = 100
const BODY_POINTS = 10
const BLOOM_POINTS = 1
const MOTH_POINTS = 200

export const GARDEN_CURVES = {
  /** Pixels per tick the worm crawls (always divides the 8px cell). */
  speed: { start: 1, step: 0.5, limit: 2 },
  length: { start: 12, step: 0, limit: 12 },
  /** Extra one-segment heads that come with the worm. */
  looseHeads: { start: -1, step: 1, limit: 5 },
  lamps: { start: 34, step: 3, limit: 55 },
  beetleEvery: { start: 900, step: -90, limit: 360 },
} as const

type Obstacle = { hp: number; kind: 'lamp' | 'sprout' }
/** A worm: the head leads, and segment k sits k * spacing steps back along its trail. */
type Worm = {
  /** The head's past positions, newest first. */
  trail: Array<{ x: number; y: number }>
  segments: number
  dx: 1 | -1
  /** Down until the flowerbed floor, then back up and down within the bed. */
  dy: 1 | -1
}
type Beetle = { x: number; y: number; vx: number; vy: number; turn: number }
type Moth = { x: number; y: number; hp: number }
type Flower = { col: number; row: number; color: string }
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = { x: number; y: number; text: string; life: number }

const FLOWER_COLORS = [
  '#f9a8d4',
  '#fde047',
  '#c4b5fd',
  '#fdba74',
  '#86efac',
  '#67e8f9',
]

class GlitchGarden implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private grid: Array<Obstacle | null> = new Array(COLS * ROWS).fill(null)
  private flowers: Flower[] = []
  private worms: Worm[] = []
  private px = W / 2
  private py = HUD + (ROWS - 2) * CELL
  private beam: { x: number; y: number } | null = null
  private beetle: Beetle | null = null
  private beetleTimer = 0
  private moth: Moth | null = null
  private speed = 1
  private dead = 0
  private clear = 0
  private nextExtra = EXTRA_EVERY
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.plantLamps(Math.round(levelCurve(1, GARDEN_CURVES.lamps)))
    this.startWave(1)
  }

  private get spacing(): number {
    return Math.round(CELL / this.speed)
  }

  private idx(col: number, row: number): number {
    return row * COLS + col
  }

  private at(col: number, row: number): Obstacle | null {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return null
    return this.grid[this.idx(col, row)]!
  }

  private plantLamps(count: number) {
    for (let tries = 0; tries < count * 6 && count > 0; tries++) {
      const col = Math.floor(this.rng() * COLS)
      // Fewer lamps in the flowerbed, none on the top row.
      const row = 1 + Math.floor(this.rng() * (ROWS - 2))
      if (row >= BED_TOP && this.rng() < 0.7) continue
      if (this.at(col, row)) continue
      this.grid[this.idx(col, row)] = { hp: LAMP_HP, kind: 'lamp' }
      count--
    }
  }

  // --- waves -------------------------------------------------------------------

  private startWave(wave: number) {
    this.level = wave
    this.speed = levelCurve(wave, GARDEN_CURVES.speed)
    this.worms = []
    const length = Math.round(levelCurve(wave, GARDEN_CURVES.length))
    this.spawnWorm(Math.floor(COLS / 2) * CELL, length, 1)
    const loose = Math.max(
      0,
      Math.round(levelCurve(wave, GARDEN_CURVES.looseHeads)),
    )
    for (let i = 0; i < loose; i++)
      this.spawnWorm(
        Math.floor(this.rng() * COLS) * CELL,
        1,
        this.rng() < 0.5 ? 1 : -1,
      )
    this.beetleTimer = Math.round(levelCurve(wave, GARDEN_CURVES.beetleEvery))
    this.banner = {
      text: `WAVE ${wave}`,
      sub: 'FIX THE GLITCH-WORM',
      ticks: 80,
    }
  }

  private spawnWorm(x: number, segments: number, dx: 1 | -1) {
    // A worm enters at the top, its body trailing off the screen above.
    const trail: Array<{ x: number; y: number }> = []
    for (let i = 0; i < segments * this.spacing + 1; i++)
      trail.push({ x, y: HUD - Math.floor(i / this.spacing) * CELL - CELL })
    trail[0] = { x, y: HUD }
    this.worms.push({ trail, segments, dx, dy: 1 })
  }

  private segmentPos(w: Worm, k: number): { x: number; y: number } {
    return w.trail[Math.min(w.trail.length - 1, k * this.spacing)]!
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    const controls = this.demo ? this.demoInput() : input
    if (this.dead > 0) {
      if (--this.dead === 0) this.afterDeath()
      return
    }
    if (this.clear > 0) {
      if (--this.clear === 0) this.startWave(this.level + 1)
      return
    }
    this.moveSprayer(controls)
    if ((controls.held.a || controls.held.b) && !this.beam)
      this.beam = { x: this.px, y: this.py - 6 }
    this.updateBeam()
    this.moveWorms()
    this.updateBeetle()
    this.updateMoth()
    this.checkHits()
    if (!this.worms.length && this.dead === 0) {
      this.clear = WAVE_CLEAR_TICKS
      this.banner = { text: 'WAVE FIXED!', ticks: WAVE_CLEAR_TICKS }
      this.sound.play('level')
    }
  }

  private moveSprayer(input: InputFrame) {
    let dx = 0
    let dy = 0
    if (input.held.left) dx -= SPRAYER_SPEED
    if (input.held.right) dx += SPRAYER_SPEED
    if (input.held.up) dy -= SPRAYER_SPEED
    if (input.held.down) dy += SPRAYER_SPEED
    const minY = HUD + BED_TOP * CELL + 4
    const maxY = H - 5
    const nx = Math.max(4, Math.min(W - 4, this.px + dx))
    if (!this.blocked(nx, this.py)) this.px = nx
    const ny = Math.max(minY, Math.min(maxY, this.py + dy))
    if (!this.blocked(this.px, ny)) this.py = ny
  }

  private blocked(x: number, y: number): boolean {
    for (const [ox, oy] of [
      [-3, -3],
      [3, -3],
      [-3, 3],
      [3, 3],
    ] as const) {
      const col = Math.floor((x + ox) / CELL)
      const row = Math.floor((y + oy - HUD) / CELL)
      if (this.at(col, row)) return true
    }
    return false
  }

  private updateBeam() {
    const beam = this.beam
    if (!beam) return
    // Step in short hops so it can't skip a lamp.
    for (let s = 0; s < BEAM_SPEED; s += 4) {
      beam.y -= 4
      if (beam.y < HUD) {
        this.beam = null
        return
      }
      const col = Math.floor(beam.x / CELL)
      const row = Math.floor((beam.y - HUD) / CELL)
      if (
        this.hitWorm(beam.x, beam.y) ||
        this.hitMoth(beam.x, beam.y) ||
        this.hitBeetle(beam.x, beam.y)
      ) {
        this.beam = null
        return
      }
      const ob = this.at(col, row)
      if (ob) {
        this.beam = null
        this.water(col, row, ob)
        return
      }
    }
  }

  /** A lamp or sprout sprayed: once it's had enough, it blooms into a flower. */
  private water(col: number, row: number, ob: Obstacle) {
    ob.hp--
    this.sound.play('blip')
    if (ob.hp > 0) return
    this.grid[this.idx(col, row)] = null
    this.flowers.push({
      col,
      row,
      color: FLOWER_COLORS[Math.floor(this.rng() * FLOWER_COLORS.length)]!,
    })
    if (this.flowers.length > 120) this.flowers.shift()
    this.addScore(
      BLOOM_POINTS * (ob.kind === 'sprout' ? 5 : 1),
      col * CELL + 4,
      HUD + row * CELL,
    )
    this.burst(col * CELL + 4, HUD + row * CELL + 4, 4, '#bbf7d0')
  }

  private hitWorm(x: number, y: number): boolean {
    for (const w of this.worms) {
      for (let k = 0; k < w.segments; k++) {
        const p = this.segmentPos(w, k)
        if (p.y < HUD) continue
        if (x < p.x || x >= p.x + CELL || y < p.y || y >= p.y + CELL) continue
        this.fixSegment(w, k)
        return true
      }
    }
    return false
  }

  /** A fixed segment drops out as a sprout; the worm splits around it. */
  private fixSegment(w: Worm, k: number) {
    const p = this.segmentPos(w, k)
    const col = Math.floor((p.x + CELL / 2) / CELL)
    const row = Math.floor((p.y - HUD + CELL / 2) / CELL)
    if (row >= 0 && row < ROWS && col >= 0 && col < COLS && !this.at(col, row))
      this.grid[this.idx(col, row)] = { hp: SPROUT_HP, kind: 'sprout' }
    this.addScore(k === 0 ? HEAD_POINTS : BODY_POINTS, p.x + 4, p.y)
    this.burst(p.x + 4, p.y + 4, 8, k === 0 ? '#f0abfc' : '#a5f3fc')
    this.sound.play('pop')
    this.worms = this.worms.filter((o) => o !== w)
    if (k > 0)
      this.worms.push({
        ...w,
        segments: k,
        trail: w.trail.slice(0, k * this.spacing + 1),
      })
    if (k < w.segments - 1) {
      // The piece behind grows a head and carries on the way it was going.
      const start = (k + 1) * this.spacing
      const trail = w.trail.slice(start)
      if (!trail.length) return
      const here = trail[0]!
      const back = trail[1] ?? here
      const dx = Math.sign(here.x - back.x) || w.dx
      this.worms.push({
        trail,
        segments: w.segments - k - 1,
        dx: dx as 1 | -1,
        dy: w.dy,
      })
    }
  }

  private moveWorms() {
    for (const w of this.worms) {
      for (let s = 0; s < this.speed; s++) this.stepWorm(w)
    }
  }

  /** One pixel along: across the row, and down a row at a lamp or the edge. */
  private stepWorm(w: Worm) {
    const head = w.trail[0]!
    let { x, y } = head
    if (x % CELL === 0 && (y - HUD) % CELL === 0) {
      const col = x / CELL
      const row = (y - HUD) / CELL
      const nextCol = col + w.dx
      const blocked =
        nextCol < 0 || nextCol >= COLS || this.at(nextCol, row) !== null
      if (blocked) {
        // Turn: down a row (or up again, once it's bouncing in the flowerbed).
        if (row + w.dy >= ROWS) w.dy = -1
        else if (w.dy < 0 && row + w.dy < BED_TOP) w.dy = 1
        w.dx = (w.dx * -1) as 1 | -1
        y += w.dy * CELL
        w.trail.unshift({ x, y })
        this.trimTrail(w)
        return
      }
    }
    x += w.dx
    w.trail.unshift({ x, y })
    this.trimTrail(w)
  }

  private trimTrail(w: Worm) {
    const keep = w.segments * this.spacing + 1
    if (w.trail.length > keep) w.trail.length = keep
  }

  private updateBeetle() {
    if (this.level >= 2 && !this.beetle && --this.beetleTimer <= 0) {
      this.beetleTimer = Math.round(
        levelCurve(this.level, GARDEN_CURVES.beetleEvery),
      )
      const fromLeft = this.rng() < 0.5
      this.beetle = {
        x: fromLeft ? -6 : W + 6,
        y: HUD + (BED_TOP + 1) * CELL,
        vx: (fromLeft ? 1 : -1) * (0.8 + this.level * 0.05),
        vy: 1.2,
        turn: 20,
      }
      this.sound.play('warn')
    }
    const b = this.beetle
    if (!b) return
    b.x += b.vx
    b.y += b.vy
    const top = HUD + (BED_TOP - 2) * CELL
    if (b.y < top || b.y > H - 6) b.vy = -b.vy
    if (--b.turn <= 0) {
      b.turn = 12 + Math.floor(this.rng() * 30)
      b.vy = (this.rng() < 0.5 ? -1 : 1) * (0.6 + this.rng() * 1.2)
    }
    // It nibbles any lamp it scuttles over.
    const col = Math.floor(b.x / CELL)
    const row = Math.floor((b.y - HUD) / CELL)
    const ob = this.at(col, row)
    if (ob && this.rng() < 0.05) this.grid[this.idx(col, row)] = null
    if (b.x < -10 || b.x > W + 10) this.beetle = null
  }

  private hitBeetle(x: number, y: number): boolean {
    const b = this.beetle
    if (!b || Math.abs(b.x - x) > 7 || Math.abs(b.y - y) > 6) return false
    // Closer to the sprayer pays more.
    const gap = this.py - b.y
    const points = gap < 16 ? 900 : gap < 40 ? 600 : 300
    this.addScore(points, b.x, b.y - 8)
    this.burst(b.x, b.y, 12, '#fde047')
    this.sound.play('pop')
    this.beetle = null
    return true
  }

  private updateMoth() {
    if (!this.moth && this.level >= 2) {
      let bedLamps = 0
      for (let r = BED_TOP; r < ROWS; r++)
        for (let c = 0; c < COLS; c++) if (this.at(c, r)) bedLamps++
      if (bedLamps < 5 && this.rng() < 0.004)
        this.moth = {
          x: Math.floor(this.rng() * COLS) * CELL + 4,
          y: HUD,
          hp: 2,
        }
    }
    const m = this.moth
    if (!m) return
    const before = Math.floor((m.y - HUD) / CELL)
    m.y += m.hp > 1 ? 1.6 : 3.2
    const row = Math.floor((m.y - HUD) / CELL)
    const col = Math.floor(m.x / CELL)
    // It plants glitch lamps on the way down.
    if (
      row !== before &&
      row > 0 &&
      row < ROWS - 1 &&
      !this.at(col, row) &&
      this.rng() < 0.25
    )
      this.grid[this.idx(col, row)] = { hp: LAMP_HP, kind: 'lamp' }
    if (m.y > H) this.moth = null
  }

  private hitMoth(x: number, y: number): boolean {
    const m = this.moth
    if (!m || Math.abs(m.x - x) > 5 || Math.abs(m.y - y) > 6) return false
    m.hp--
    this.sound.play('blip')
    if (m.hp > 0) return true
    this.addScore(MOTH_POINTS, m.x, m.y - 8)
    this.burst(m.x, m.y, 10, '#e9d5ff')
    this.sound.play('pop')
    this.moth = null
    return true
  }

  private checkHits() {
    for (const w of this.worms) {
      for (let k = 0; k < w.segments; k++) {
        const p = this.segmentPos(w, k)
        if (
          Math.abs(p.x + 4 - this.px) < 6 &&
          Math.abs(p.y + 4 - this.py) < 6
        ) {
          this.lose()
          return
        }
      }
    }
    const b = this.beetle
    if (b && Math.abs(b.x - this.px) < 7 && Math.abs(b.y - this.py) < 6)
      this.lose()
    const m = this.moth
    if (m && Math.abs(m.x - this.px) < 6 && Math.abs(m.y - this.py) < 6)
      this.lose()
  }

  private lose() {
    this.lives--
    this.dead = DEATH_TICKS
    this.beam = null
    this.burst(this.px, this.py, 18, '#fde68a')
    this.sound.play('die')
    this.banner = { text: 'SPRAYER DOWN', ticks: DEATH_TICKS }
  }

  /** After a lost sprayer, half-sprayed lamps perk back up (and pay a little). */
  private afterDeath() {
    if (this.lives <= 0) {
      this.over = true
      this.banner = { text: 'GAME OVER', ticks: 9999 }
      return
    }
    for (const ob of this.grid) {
      if (ob && ob.hp < (ob.kind === 'lamp' ? LAMP_HP : SPROUT_HP)) {
        ob.hp = ob.kind === 'lamp' ? LAMP_HP : SPROUT_HP
        this.addScore(5, W / 2, H / 2)
      }
    }
    // The worms start the wave over from the top, the same lengths.
    const lengths = this.worms.map((w) => w.segments)
    this.worms = []
    lengths.forEach((n, i) =>
      this.spawnWorm(((i * 7 + 15) % COLS) * CELL, n, i % 2 ? -1 : 1),
    )
    this.beetle = null
    this.moth = null
    this.px = W / 2
    this.py = HUD + (ROWS - 2) * CELL
    // Clear a spot to stand in.
    for (let c = 13; c <= 16; c++)
      for (let r = ROWS - 3; r < ROWS; r++) this.grid[this.idx(c, r)] = null
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x: number, y: number) {
    if (this.demo) return
    this.score += points
    if (points >= 100)
      this.floaters.push({ x, y, text: String(points), life: 36 })
    if (this.score >= this.nextExtra) {
      this.nextExtra += EXTRA_EVERY
      this.lives++
      this.banner = { text: 'EXTRA SPRAYER!', ticks: 80 }
      this.sound.play('extra')
    }
  }

  private burst(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.4 + this.rng() * 1.3
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 14 + Math.floor(this.rng() * 12),
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
  }

  // --- attract-mode pilot -----------------------------------------------------

  /** Slides under the lowest worm segment, sidesteps the beetle, sprays away. */
  private demoInput(): InputFrame {
    const held = {
      up: false,
      down: false,
      left: false,
      right: false,
      a: true,
      b: false,
      start: false,
    }
    const frame: InputFrame = { held, pressed: { ...held } }
    let target: { x: number; y: number } | null = null
    for (const w of this.worms) {
      for (let k = 0; k < w.segments; k++) {
        const p = this.segmentPos(w, k)
        if (p.y < HUD) continue
        if (!target || p.y > target.y) target = { x: p.x + 4, y: p.y }
      }
    }
    // Danger close: get away from it first.
    const threats: Array<{ x: number; y: number }> = []
    if (this.beetle) threats.push(this.beetle)
    for (const w of this.worms)
      for (let k = 0; k < w.segments; k++) {
        const p = this.segmentPos(w, k)
        if (p.y >= HUD + (BED_TOP - 1) * CELL)
          threats.push({ x: p.x + 4, y: p.y + 4 })
      }
    const near = threats.find(
      (t) => Math.abs(t.x - this.px) < 22 && Math.abs(t.y - this.py) < 22,
    )
    if (near) {
      if (near.x < this.px) held.right = true
      else held.left = true
      if (near.y < this.py) held.down = true
      else held.up = true
      return frame
    }
    if (target) {
      if (target.x < this.px - 2) held.left = true
      if (target.x > this.px + 2) held.right = true
    }
    // Hang near the bottom of the bed.
    if (this.py < H - 14) held.down = true
    return frame
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    g.fillStyle = '#0a1a0f'
    g.fillRect(0, 0, W, H)
    // The flowerbed's soil.
    g.fillStyle = '#1c1917'
    g.fillRect(0, HUD + BED_TOP * CELL, W, BED_ROWS * CELL)
    g.fillStyle = '#292524'
    for (let x = 0; x < W; x += 6) g.fillRect(x, HUD + BED_TOP * CELL, 3, 1)
    for (const f of this.flowers) this.renderFlower(g, f)
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const ob = this.at(c, r)
        if (ob) this.renderObstacle(g, c, r, ob)
      }
    for (const w of this.worms) this.renderWorm(g, w)
    if (this.beetle) this.renderBeetle(g, this.beetle)
    if (this.moth) this.renderMoth(g, this.moth)
    if (this.beam) {
      g.fillStyle = '#a5f3fc'
      g.fillRect(this.beam.x - 1, this.beam.y - 4, 2, 6)
    }
    if (this.dead === 0) this.renderSprayer(g)
    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, p.life / 26)
      g.fillStyle = p.color
      g.fillRect(p.x - 1, p.y - 1, 2, 2)
    }
    g.globalAlpha = 1
    for (const f of this.floaters)
      drawText(g, f.text, f.x, f.y, { align: 'center', color: '#fde68a' })
    this.renderHud(g)
  }

  private renderFlower(g: CanvasRenderingContext2D, f: Flower) {
    const x = f.col * CELL + 4
    const y = HUD + f.row * CELL + 4
    g.fillStyle = f.color
    g.fillRect(x - 3, y - 1, 2, 2)
    g.fillRect(x + 1, y - 1, 2, 2)
    g.fillRect(x - 1, y - 3, 2, 2)
    g.fillRect(x - 1, y + 1, 2, 2)
    g.fillStyle = '#fde047'
    g.fillRect(x - 1, y - 1, 2, 2)
  }

  private renderObstacle(
    g: CanvasRenderingContext2D,
    c: number,
    r: number,
    ob: Obstacle,
  ) {
    const x = c * CELL
    const y = HUD + r * CELL
    if (ob.kind === 'sprout') {
      // A sprout with as many leaves as it has hp left.
      g.fillStyle = '#4ade80'
      g.fillRect(x + 3, y + 2, 2, 6)
      g.fillStyle = '#86efac'
      for (let i = 0; i < ob.hp; i++)
        g.fillRect(x + (i % 2 ? 5 : 0), y + 2 + i * 2, 3, 2)
      return
    }
    // A glitchy mushroom lamp: the cap shrinks as it's sprayed.
    const cap = ob.hp
    const flicker = (c * 7 + r * 3 + Math.floor(this.tick / 6)) % 11 === 0
    g.fillStyle = flicker ? '#f0abfc' : '#c026d3'
    g.fillRect(x + 4 - cap, y + 1, cap * 2, 3)
    g.fillStyle = '#fef3c7'
    g.fillRect(x + 3, y + 4, 2, 3)
    if (cap >= 3) {
      g.fillStyle = '#22d3ee'
      g.fillRect(x + 2, y + 2, 1, 1)
      g.fillRect(x + 5, y + 2, 1, 1)
    }
  }

  private renderWorm(g: CanvasRenderingContext2D, w: Worm) {
    for (let k = w.segments - 1; k >= 0; k--) {
      const p = this.segmentPos(w, k)
      if (p.y < HUD) continue
      const x = p.x
      const y = p.y
      const glitch = (k + Math.floor(this.tick / 4)) % 5 === 0
      g.fillStyle = k === 0 ? '#e879f9' : glitch ? '#22d3ee' : '#a855f7'
      g.fillRect(x + 1, y + 1, 6, 6)
      g.fillStyle = k === 0 ? '#fdf4ff' : '#d8b4fe'
      g.fillRect(x + 2, y + 2, 2, 2)
      if (k === 0) {
        g.fillStyle = '#111827'
        g.fillRect(x + (w.dx > 0 ? 5 : 1), y + 3, 2, 2)
      }
    }
  }

  private renderBeetle(g: CanvasRenderingContext2D, b: Beetle) {
    const leg = Math.floor(this.tick / 4) % 2
    g.fillStyle = '#ca8a04'
    g.fillRect(b.x - 4, b.y - 3, 8, 6)
    g.fillStyle = '#111827'
    g.fillRect(b.x, b.y - 3, 1, 6)
    g.fillStyle = '#78350f'
    for (const s of [-1, 1]) {
      g.fillRect(b.x + s * 5, b.y - 2 + leg, 2, 1)
      g.fillRect(b.x + s * 5, b.y + 1 - leg, 2, 1)
    }
  }

  private renderMoth(g: CanvasRenderingContext2D, m: Moth) {
    const flap = Math.floor(this.tick / 3) % 2
    g.fillStyle = '#e9d5ff'
    g.fillRect(m.x - 4 - flap, m.y - 3, 3, 4)
    g.fillRect(m.x + 1 + flap, m.y - 3, 3, 4)
    g.fillStyle = '#6b21a8'
    g.fillRect(m.x - 1, m.y - 4, 2, 7)
  }

  private renderSprayer(g: CanvasRenderingContext2D) {
    const x = Math.round(this.px)
    const y = Math.round(this.py)
    // A little gardening bot with a spray nozzle on top.
    g.fillStyle = '#0ea5e9'
    g.fillRect(x - 4, y - 2, 8, 6)
    g.fillStyle = '#e0f2fe'
    g.fillRect(x - 1, y - 5, 2, 4)
    g.fillStyle = '#fde047'
    g.fillRect(x - 3, y, 2, 2)
    g.fillRect(x + 1, y, 2, 2)
  }

  private renderHud(g: CanvasRenderingContext2D) {
    const shadow = '#052e16'
    g.fillStyle = '#052e16'
    g.fillRect(0, 0, W, HUD)
    drawText(g, String(this.score).padStart(6, '0'), 4, 1, {
      scale: 2,
      color: '#fde047',
      shadow,
    })
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W - 4, 1, {
      align: 'right',
      color: '#f9a8d4',
    })
    drawText(g, `WAVE ${this.level}`, W - 4, 9, {
      align: 'right',
      color: '#86efac',
    })
    for (let i = 0; i < Math.min(this.lives - 1, 5); i++) {
      g.fillStyle = '#0ea5e9'
      g.fillRect(84 + i * 10, 6, 7, 5)
    }
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, H / 2 - 20, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        shadow: '#7c3aed',
      })
      if (this.banner.sub)
        drawText(g, this.banner.sub, W / 2, H / 2, {
          align: 'center',
          color: '#fde68a',
          shadow,
        })
    }
  }
}

const glitchGarden: ArcadeGameModule = {
  create: (options) => new GlitchGarden(options),
}

export const create = glitchGarden.create
export default glitchGarden
