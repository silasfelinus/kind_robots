// /utils/arcade/games/kindnessGauntlet.ts
//
// Kindness Gauntlet -- the Kind Robots Arcade's Gauntlet II riff (conductor
// kr-arcade/t-009 game factory, slice 1 of 4: one class on procedurally
// built floors; the other three classes, keys and locked doors, and
// same-device co-op come in later slices). Fix, a repair android, explores a
// glitchy old server dungeon floor by floor: wrench sparks fix the glitches
// that swarm out of broken generators, shut the generators down, free the
// bots trapped in cages, and find the stairs down.
//
// Fix's battery drains all the time and faster when glitches cling on; snacks
// top it up and kindness pulses (B) fix every glitch on screen. The arrows
// move (eight ways), A throws sparks the way Fix is facing; while A is held
// Fix stands still and the arrows only turn, as in the classic.

import { levelCurve } from '../curve'
import { drawText } from '../font'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'

const T = 16
const MW = 40
const MH = 30
const W = 320
const H = 240
const VIEW_Y = 16
const VIEW_H = H - VIEW_Y

const SPEED = 1.5
const HALF = 5
const SPARK_SPEED = 4
const SPARK_LIFE = 45
const MAX_SPARKS = 4
const FIRE_COOLDOWN = 10
const MAX_BATTERY = 300
const DRAIN_TICKS = 60
const CLING_TICKS = 20
const SNACK_CHARGE = 40
const GLITCH_RANGE = T * 14
const EXIT_TICKS = 120

const GLITCH_POINTS = 10
const GENERATOR_POINTS = 100
const RESCUE_POINTS = 250
const FLOOR_POINTS = 500

export const GAUNTLET_CURVES = {
  generators: { start: 3, step: 0.6, limit: 7 },
  generatorHp: { start: 3, step: 0.34, limit: 6 },
  spawnEvery: { start: 150, step: -12, limit: 50 },
  glitchSpeed: { start: 0.6, step: 0.07, limit: 1.35 },
  /** Battery a clinging glitch drains each bite. */
  clingCost: { start: 3, step: 0.5, limit: 9 },
  glitchCap: { start: 10, step: 2, limit: 26 },
  snacks: { start: 4, step: -0.34, limit: 1 },
  cages: { start: 1, step: 0.5, limit: 3 },
} as const

type Room = { x: number; y: number; w: number; h: number }
type Thing = { x: number; y: number }
type Generator = Thing & {
  hp: number
  maxHp: number
  timer: number
  flash: number
}
type Glitch = Thing & { cling: number; wobble: number }
type Spark = Thing & { vx: number; vy: number; life: number }
type Item = Thing & { kind: 'snack' | 'pulse' | 'cage' }
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = { x: number; y: number; text: string; life: number }

/** Eight facings, clockwise from up. */
const FACE_X = [0, 1, 1, 1, 0, -1, -1, -1]
const FACE_Y = [-1, -1, 0, 1, 1, 1, 0, -1]

class KindnessGauntlet implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = 1
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private walls = new Uint8Array(MW * MH)
  private seen = new Uint8Array(MW * MH)
  private px = 0
  private py = 0
  private facing = 4
  private fireCooldown = 0
  private battery = MAX_BATTERY
  private pulses = 1
  private pulseFlash = 0
  private generators: Generator[] = []
  private glitches: Glitch[] = []
  private sparks: Spark[] = []
  private items: Item[] = []
  private exit: Thing = { x: 0, y: 0 }
  private leaving = 0
  private rescued = 0
  private camX = 0
  private camY = 0
  private path: Array<{ x: number; y: number }> = []
  private pathTimer = 0
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.buildFloor(1)
  }

  // --- the floor ---------------------------------------------------------------------

  private idx(tx: number, ty: number): number {
    return ty * MW + tx
  }

  private wallAt(tx: number, ty: number): boolean {
    if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) return true
    return this.walls[this.idx(tx, ty)] === 1
  }

  private solid(x: number, y: number): boolean {
    return this.wallAt(Math.floor(x / T), Math.floor(y / T))
  }

  private centre(r: Room): Thing {
    return {
      x: (r.x + Math.floor(r.w / 2)) * T + T / 2,
      y: (r.y + Math.floor(r.h / 2)) * T + T / 2,
    }
  }

  private carve(x0: number, y0: number, x1: number, y1: number) {
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) {
      for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) {
        if (x > 0 && y > 0 && x < MW - 1 && y < MH - 1)
          this.walls[this.idx(x, y)] = 0
      }
    }
  }

  private buildFloor(floor: number) {
    this.level = floor
    this.walls.fill(1)
    this.seen.fill(0)
    const rooms: Room[] = []
    for (let tries = 0; tries < 300 && rooms.length < 9; tries++) {
      const w = 5 + Math.floor(this.rng() * 5)
      const h = 4 + Math.floor(this.rng() * 4)
      const x = 1 + Math.floor(this.rng() * (MW - w - 2))
      const y = 1 + Math.floor(this.rng() * (MH - h - 2))
      const clash = rooms.some(
        (r) =>
          x < r.x + r.w + 2 &&
          x + w + 2 > r.x &&
          y < r.y + r.h + 2 &&
          y + h + 2 > r.y,
      )
      if (clash) continue
      rooms.push({ x, y, w, h })
    }
    rooms.sort((a, b) => a.x + a.y * 0.5 - (b.x + b.y * 0.5))
    for (const r of rooms) this.carve(r.x, r.y, r.x + r.w - 1, r.y + r.h - 1)
    // Two-wide corridors joining each room to the one before it.
    for (let i = 1; i < rooms.length; i++) {
      const a = this.centre(rooms[i - 1]!)
      const b = this.centre(rooms[i]!)
      const ax = Math.floor(a.x / T)
      const ay = Math.floor(a.y / T)
      const bx = Math.floor(b.x / T)
      const by = Math.floor(b.y / T)
      this.carve(ax, ay, bx, ay + 1)
      this.carve(bx, ay, bx + 1, by)
    }
    const start = this.centre(rooms[0]!)
    this.px = start.x
    this.py = start.y
    // The stairs go in the room farthest from the start, by walking distance.
    const dist = this.distances(
      Math.floor(start.x / T),
      Math.floor(start.y / T),
    )
    const far = rooms
      .slice(1)
      .map((r) => {
        const c = this.centre(r)
        return {
          r,
          d: dist[this.idx(Math.floor(c.x / T), Math.floor(c.y / T))] ?? -1,
        }
      })
      .sort((a, b) => b.d - a.d)[0]
    this.exit = this.centre(far?.r ?? rooms[rooms.length - 1]!)

    const spots = (count: number) => {
      const out: Thing[] = []
      for (let tries = 0; tries < 400 && out.length < count; tries++) {
        const r = rooms[1 + Math.floor(this.rng() * (rooms.length - 1))]!
        const tx = r.x + Math.floor(this.rng() * r.w)
        const ty = r.y + Math.floor(this.rng() * r.h)
        const x = tx * T + T / 2
        const y = ty * T + T / 2
        const taken = [
          ...this.generators,
          ...this.items,
          this.exit,
          ...out,
        ].some((o) => Math.abs(o.x - x) < T * 2 && Math.abs(o.y - y) < T * 2)
        if (!taken) out.push({ x, y })
      }
      return out
    }
    this.generators = []
    this.items = []
    const hp = Math.round(levelCurve(floor, GAUNTLET_CURVES.generatorHp))
    for (const s of spots(
      Math.round(levelCurve(floor, GAUNTLET_CURVES.generators)),
    )) {
      this.generators.push({
        ...s,
        hp,
        maxHp: hp,
        timer: 60 + Math.floor(this.rng() * 90),
        flash: 0,
      })
    }
    for (const s of spots(
      Math.round(levelCurve(floor, GAUNTLET_CURVES.snacks)),
    )) {
      this.items.push({ ...s, kind: 'snack' })
    }
    for (const s of spots(
      Math.round(levelCurve(floor, GAUNTLET_CURVES.cages)),
    )) {
      this.items.push({ ...s, kind: 'cage' })
    }
    for (const s of spots(1)) this.items.push({ ...s, kind: 'pulse' })
    this.glitches = []
    this.sparks = []
    this.leaving = 0
    this.path = []
    this.reveal()
    this.banner = { text: `FLOOR ${floor}`, sub: 'FIX THE GLITCHES', ticks: 90 }
  }

  /** Walking distance in tiles from (sx, sy) to every open tile. */
  private distances(sx: number, sy: number): Int16Array {
    const dist = new Int16Array(MW * MH).fill(-1)
    const queue = [sx, sy]
    dist[this.idx(sx, sy)] = 0
    for (let head = 0; head < queue.length; head += 2) {
      const x = queue[head]!
      const y = queue[head + 1]!
      const d = dist[this.idx(x, y)]!
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const) {
        const nx = x + dx
        const ny = y + dy
        if (this.wallAt(nx, ny) || dist[this.idx(nx, ny)] !== -1) continue
        dist[this.idx(nx, ny)] = d + 1
        queue.push(nx, ny)
      }
    }
    return dist
  }

  /** Light up the tiles around Fix (the map is dark until explored). */
  private reveal() {
    const tx = Math.floor(this.px / T)
    const ty = Math.floor(this.py / T)
    for (let y = ty - 6; y <= ty + 6; y++) {
      for (let x = tx - 8; x <= tx + 8; x++) {
        if (x >= 0 && y >= 0 && x < MW && y < MH) this.seen[this.idx(x, y)] = 1
      }
    }
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    const controls = this.demo ? this.demoInput() : input

    if (this.leaving > 0) {
      if (--this.leaving === 0) this.buildFloor(this.level + 1)
      return
    }
    if (this.tick % DRAIN_TICKS === 0) this.battery--
    if (this.fireCooldown > 0) this.fireCooldown--
    if (this.pulseFlash > 0) this.pulseFlash--

    this.move(controls)
    if (controls.pressed.a || (controls.held.a && this.fireCooldown === 0))
      this.fire()
    if (controls.pressed.b) this.pulse()
    this.updateSparks()
    this.updateGenerators()
    this.updateGlitches()
    this.pickUp()
    this.reveal()

    if (Math.hypot(this.exit.x - this.px, this.exit.y - this.py) < 10) {
      const bonus = FLOOR_POINTS + 100 * this.level
      this.addScore(bonus, this.px, this.py - 16)
      this.leaving = EXIT_TICKS
      this.banner = {
        text: 'DOWN THE STAIRS!',
        sub: `FLOOR BONUS ${bonus}`,
        ticks: EXIT_TICKS,
      }
      this.sound.play('level')
    }
    if (this.battery <= 0) {
      this.over = true
      this.battery = 0
      this.banner = { text: 'BATTERY FLAT', sub: 'GAME OVER', ticks: 9999 }
      this.sound.play('die')
    }
    this.camX = Math.max(0, Math.min(MW * T - W, this.px - W / 2))
    this.camY = Math.max(0, Math.min(MH * T - VIEW_H, this.py - VIEW_H / 2))
  }

  private move(input: InputFrame) {
    let dx = 0
    let dy = 0
    if (input.held.left) dx -= 1
    if (input.held.right) dx += 1
    if (input.held.up) dy -= 1
    if (input.held.down) dy += 1
    if (dx === 0 && dy === 0) return
    for (let f = 0; f < 8; f++) {
      if (FACE_X[f] === dx && FACE_Y[f] === dy) this.facing = f
    }
    // As in the classic, holding fire plants Fix in place: the arrows only turn.
    if (input.held.a) return
    const len = Math.hypot(dx, dy)
    const to = this.slide(
      this.px,
      this.py,
      (dx / len) * SPEED,
      (dy / len) * SPEED,
      HALF,
    )
    this.px = to.x
    this.py = to.y
  }

  /** Where a body at (x, y) ends up moving by (vx, vy), one axis at a time. */
  private slide(x: number, y: number, vx: number, vy: number, half: number) {
    const nx = this.boxHits(x + vx, y, half) ? x : x + vx
    const ny = this.boxHits(nx, y + vy, half) ? y : y + vy
    return { x: nx, y: ny }
  }

  private boxHits(x: number, y: number, half: number): boolean {
    return (
      this.solid(x - half, y - half) ||
      this.solid(x + half, y - half) ||
      this.solid(x - half, y + half) ||
      this.solid(x + half, y + half)
    )
  }

  private fire() {
    if (this.sparks.length >= MAX_SPARKS) return
    this.fireCooldown = FIRE_COOLDOWN
    const fx = FACE_X[this.facing]!
    const fy = FACE_Y[this.facing]!
    const len = Math.hypot(fx, fy)
    this.sparks.push({
      x: this.px + fx * 6,
      y: this.py + fy * 6,
      vx: (fx / len) * SPARK_SPEED,
      vy: (fy / len) * SPARK_SPEED,
      life: SPARK_LIFE,
    })
    this.sound.play('shoot')
  }

  /** A kindness pulse fixes every glitch on screen. */
  private pulse() {
    if (this.pulses <= 0) return
    this.pulses--
    this.pulseFlash = 20
    const onScreen = this.glitches.filter((g) => this.visible(g))
    for (const g of onScreen) this.fixGlitch(g)
    this.sound.play('extra')
  }

  private visible(t: Thing): boolean {
    return (
      t.x > this.camX - 8 &&
      t.x < this.camX + W + 8 &&
      t.y > this.camY - 8 &&
      t.y < this.camY + VIEW_H + 8
    )
  }

  private updateSparks() {
    for (const s of this.sparks) {
      s.x += s.vx
      s.y += s.vy
      s.life--
      if (this.solid(s.x, s.y)) s.life = 0
      if (s.life <= 0) continue
      const glitch = this.glitches.find(
        (g) => Math.hypot(g.x - s.x, g.y - s.y) < 7,
      )
      if (glitch) {
        this.fixGlitch(glitch)
        s.life = 0
        continue
      }
      const gen = this.generators.find(
        (g) => Math.abs(g.x - s.x) < 8 && Math.abs(g.y - s.y) < 8,
      )
      if (gen) {
        s.life = 0
        gen.hp--
        gen.flash = 6
        this.sound.play('blip')
        if (gen.hp <= 0) {
          this.generators = this.generators.filter((g) => g !== gen)
          this.addScore(GENERATOR_POINTS * this.level, gen.x, gen.y - 12)
          this.burst(gen.x, gen.y, 14, '#a5f3fc')
          this.sound.play('boom')
        }
      }
    }
    this.sparks = this.sparks.filter((s) => s.life > 0)
  }

  private fixGlitch(g: Glitch) {
    this.glitches = this.glitches.filter((other) => other !== g)
    this.addScore(GLITCH_POINTS, g.x, g.y - 8)
    this.burst(g.x, g.y, 5, '#f0abfc')
    this.sound.play('pop')
  }

  private updateGenerators() {
    const every = Math.round(levelCurve(this.level, GAUNTLET_CURVES.spawnEvery))
    const cap = Math.round(levelCurve(this.level, GAUNTLET_CURVES.glitchCap))
    for (const gen of this.generators) {
      if (gen.flash > 0) gen.flash--
      if (Math.hypot(gen.x - this.px, gen.y - this.py) > GLITCH_RANGE) continue
      if (--gen.timer > 0) continue
      gen.timer = every
      if (this.glitches.length >= cap) continue
      // Glitches leak out of a free side of the generator.
      for (const [dx, dy] of [
        [0, 1],
        [1, 0],
        [0, -1],
        [-1, 0],
      ] as const) {
        const x = gen.x + dx * T
        const y = gen.y + dy * T
        if (!this.boxHits(x, y, HALF)) {
          this.glitches.push({ x, y, cling: 0, wobble: this.rng() * 6 })
          break
        }
      }
    }
  }

  private updateGlitches() {
    const speed = levelCurve(this.level, GAUNTLET_CURVES.glitchSpeed)
    for (const g of this.glitches) {
      const dx = this.px - g.x
      const dy = this.py - g.y
      const d = Math.hypot(dx, dy)
      if (d > GLITCH_RANGE) continue
      if (d < 9) {
        // Clinging on: drains Fix's battery.
        if (--g.cling <= 0) {
          g.cling = CLING_TICKS
          this.battery -= Math.round(
            levelCurve(this.level, GAUNTLET_CURVES.clingCost),
          )
          this.sound.play('warn')
        }
        continue
      }
      const jitter = Math.sin(this.tick / 9 + g.wobble) * 0.3
      const to = this.slide(
        g.x,
        g.y,
        (dx / d) * speed + jitter,
        (dy / d) * speed - jitter,
        4,
      )
      g.x = to.x
      g.y = to.y
    }
  }

  private pickUp() {
    for (const item of [...this.items]) {
      if (Math.hypot(item.x - this.px, item.y - this.py) > 10) continue
      this.items = this.items.filter((other) => other !== item)
      if (item.kind === 'snack') {
        this.battery = Math.min(MAX_BATTERY, this.battery + SNACK_CHARGE)
        this.floaters.push({
          x: item.x,
          y: item.y - 10,
          text: 'SNACK!',
          life: 40,
        })
        this.sound.play('pickup')
      } else if (item.kind === 'pulse') {
        this.pulses++
        this.floaters.push({
          x: item.x,
          y: item.y - 10,
          text: 'PULSE!',
          life: 40,
        })
        this.sound.play('pickup')
      } else {
        this.rescued++
        this.addScore(RESCUE_POINTS * this.level, item.x, item.y - 10)
        this.burst(item.x, item.y, 12, '#fde68a')
        this.banner = { text: 'BOT RESCUED!', ticks: 60 }
        this.sound.play('extra')
      }
    }
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x: number, y: number) {
    if (this.demo) return
    this.score += points
    this.floaters.push({ x, y, text: String(points), life: 40 })
  }

  private burst(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.5 + this.rng() * 1.5
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 16 + Math.floor(this.rng() * 14),
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
    // Swamped: use a pulse.
    const close = this.glitches.filter(
      (g) => Math.hypot(g.x - this.px, g.y - this.py) < 40,
    )
    if (close.length >= 5 && this.pulses > 0) {
      frame.pressed.b = true
      return frame
    }
    // Something to fix nearby: face it and spark it.
    const targets: Thing[] = [...this.glitches, ...this.generators]
    const aim = targets
      .filter(
        (t) =>
          Math.hypot(t.x - this.px, t.y - this.py) < 90 && this.clearShot(t),
      )
      .sort(
        (a, b) =>
          Math.hypot(a.x - this.px, a.y - this.py) -
          Math.hypot(b.x - this.px, b.y - this.py),
      )[0]
    if (aim) {
      const ang = Math.atan2(aim.y - this.py, aim.x - this.px)
      const f = (Math.round((ang + Math.PI / 2) / (Math.PI / 4)) + 8) % 8
      if (FACE_X[f]! < 0) held.left = true
      if (FACE_X[f]! > 0) held.right = true
      if (FACE_Y[f]! < 0) held.up = true
      if (FACE_Y[f]! > 0) held.down = true
      held.a = true
      return frame
    }
    // Otherwise walk the path to the next goal: snacks when low, cages, generators, then the stairs.
    if (--this.pathTimer <= 0 || this.path.length === 0) {
      this.pathTimer = 30
      this.path = this.planPath()
    }
    const next = this.path[0]
    if (!next) return frame
    const nx = next.x * T + T / 2
    const ny = next.y * T + T / 2
    if (Math.abs(nx - this.px) < 3 && Math.abs(ny - this.py) < 3) {
      this.path.shift()
      return frame
    }
    if (nx < this.px - 1) held.left = true
    if (nx > this.px + 1) held.right = true
    if (ny < this.py - 1) held.up = true
    if (ny > this.py + 1) held.down = true
    return frame
  }

  /** A straight, unblocked spark line to the target along one of the eight facings. */
  private clearShot(t: Thing): boolean {
    const dx = t.x - this.px
    const dy = t.y - this.py
    const d = Math.hypot(dx, dy)
    const ang = Math.atan2(dy, dx)
    const snapped = Math.round(ang / (Math.PI / 4)) * (Math.PI / 4)
    // Off the eight lines by more than the target's half-width: the spark would miss.
    if (Math.abs(Math.sin(ang - snapped)) * d > 5) return false
    // Follow the spark's own path (the snapped facing), not the exact line.
    const ux = Math.cos(snapped)
    const uy = Math.sin(snapped)
    for (let s = 6; s < d - 6; s += 2) {
      if (this.solid(this.px + ux * s, this.py + uy * s)) return false
    }
    return true
  }

  private planPath(): Array<{ x: number; y: number }> {
    const sx = Math.floor(this.px / T)
    const sy = Math.floor(this.py / T)
    const dist = this.distances(sx, sy)
    const goals: Thing[] =
      this.battery < 120
        ? this.items.filter((i) => i.kind === 'snack')
        : [...this.items.filter((i) => i.kind !== 'snack'), ...this.generators]
    const pool = goals.length ? goals : [this.exit]
    let best: Thing | null = null
    let bestD = Infinity
    for (const g of pool) {
      const d = dist[this.idx(Math.floor(g.x / T), Math.floor(g.y / T))]!
      if (d >= 0 && d < bestD) {
        bestD = d
        best = g
      }
    }
    if (!best) best = this.exit
    // Walk back from the goal along decreasing distance.
    let x = Math.floor(best.x / T)
    let y = Math.floor(best.y / T)
    const path: Array<{ x: number; y: number }> = []
    for (let guard = 0; guard < 400; guard++) {
      path.unshift({ x, y })
      const d = dist[this.idx(x, y)]!
      if (d <= 0) break
      let moved = false
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const) {
        if (
          dist[this.idx(x + dx, y + dy)] === d - 1 &&
          !this.wallAt(x + dx, y + dy)
        ) {
          x += dx
          y += dy
          moved = true
          break
        }
      }
      if (!moved) break
    }
    return path.slice(1)
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    g.fillStyle = '#05030d'
    g.fillRect(0, 0, W, H)
    g.save()
    g.beginPath()
    g.rect(0, VIEW_Y, W, VIEW_H)
    g.clip()
    g.translate(-Math.round(this.camX), VIEW_Y - Math.round(this.camY))
    this.renderMap(g)
    this.renderExit(g)
    for (const item of this.items) this.renderItem(g, item)
    for (const gen of this.generators) this.renderGenerator(g, gen)
    for (const gl of this.glitches) this.renderGlitch(g, gl)
    for (const s of this.sparks) {
      g.fillStyle = this.tick % 4 < 2 ? '#fde047' : '#ffffff'
      g.fillRect(s.x - 2, s.y - 2, 4, 4)
    }
    this.renderFix(g)
    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, p.life / 30)
      g.fillStyle = p.color
      g.fillRect(p.x - 1, p.y - 1, 2, 2)
    }
    g.globalAlpha = 1
    for (const f of this.floaters) {
      drawText(g, f.text, f.x, f.y, { align: 'center', color: '#fde68a' })
    }
    g.restore()
    if (this.pulseFlash > 0) {
      g.globalAlpha = this.pulseFlash / 30
      g.fillStyle = '#fbcfe8'
      g.fillRect(0, VIEW_Y, W, VIEW_H)
      g.globalAlpha = 1
    }
    this.renderHud(g)
  }

  private renderMap(g: CanvasRenderingContext2D) {
    const x0 = Math.max(0, Math.floor(this.camX / T))
    const y0 = Math.max(0, Math.floor(this.camY / T))
    const x1 = Math.min(MW - 1, x0 + Math.ceil(W / T) + 1)
    const y1 = Math.min(MH - 1, y0 + Math.ceil(VIEW_H / T) + 1)
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (!this.seen[this.idx(tx, ty)]) continue
        const x = tx * T
        const y = ty * T
        if (this.wallAt(tx, ty)) {
          g.fillStyle = '#4c1d95'
          g.fillRect(x, y, T, T)
          g.fillStyle = '#6d28d9'
          g.fillRect(x, y, T, 2)
          g.fillRect(x + ((ty % 2) * T) / 2, y + 8, 1, 8)
          g.fillStyle = '#2e1065'
          g.fillRect(x, y + 7, T, 1)
        } else {
          g.fillStyle = (tx + ty) % 2 ? '#111827' : '#0f172a'
          g.fillRect(x, y, T, T)
        }
      }
    }
  }

  private renderExit(g: CanvasRenderingContext2D) {
    const e = this.exit
    if (!this.seen[this.idx(Math.floor(e.x / T), Math.floor(e.y / T))]) return
    for (let i = 0; i < 4; i++) {
      g.fillStyle = i % 2 ? '#22d3ee' : '#0e7490'
      g.fillRect(e.x - 8 + i, e.y - 8 + i * 4, 16 - i * 2, 4)
    }
    if (Math.floor(this.tick / 15) % 2 === 0) {
      drawText(g, 'EXIT', e.x, e.y - 18, { align: 'center', color: '#a5f3fc' })
    }
  }

  private renderItem(g: CanvasRenderingContext2D, item: Item) {
    const { x, y } = item
    if (item.kind === 'snack') {
      // A frosted donut.
      g.fillStyle = '#f59e0b'
      g.beginPath()
      g.arc(x, y, 5, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = '#f472b6'
      g.beginPath()
      g.arc(x, y - 1, 4, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = '#111827'
      g.fillRect(x - 1, y - 2, 2, 2)
    } else if (item.kind === 'pulse') {
      g.fillStyle = Math.floor(this.tick / 8) % 2 ? '#f9a8d4' : '#fbcfe8'
      g.beginPath()
      g.moveTo(x, y + 5)
      g.lineTo(x - 5, y - 1)
      g.lineTo(x - 2, y - 4)
      g.lineTo(x, y - 2)
      g.lineTo(x + 2, y - 4)
      g.lineTo(x + 5, y - 1)
      g.fill()
    } else {
      // A trapped bot behind bars.
      g.fillStyle = '#facc15'
      g.fillRect(x - 4, y - 4, 8, 8)
      g.fillStyle = '#0f172a'
      g.fillRect(x - 2, y - 2, 1, 1)
      g.fillRect(x + 1, y - 2, 1, 1)
      g.fillStyle = '#94a3b8'
      for (let i = -6; i <= 6; i += 3) g.fillRect(x + i, y - 7, 1, 14)
      g.fillRect(x - 7, y - 7, 15, 1)
      g.fillRect(x - 7, y + 6, 15, 1)
    }
  }

  private renderGenerator(g: CanvasRenderingContext2D, gen: Generator) {
    const { x, y } = gen
    g.fillStyle = gen.flash > 0 ? '#ffffff' : '#334155'
    g.fillRect(x - 7, y - 7, 14, 14)
    // Static on its little screen.
    for (let i = 0; i < 6; i++) {
      g.fillStyle = (this.tick + i * 3) % 5 < 2 ? '#f0abfc' : '#22d3ee'
      g.fillRect(
        x - 5 + ((i * 7 + this.tick) % 10),
        y - 5 + ((i * 5) % 8),
        2,
        2,
      )
    }
    g.fillStyle = '#1f2937'
    g.fillRect(x - 7, y + 8, 14, 2)
    g.fillStyle = '#4ade80'
    g.fillRect(x - 7, y + 8, (14 * gen.hp) / gen.maxHp, 2)
  }

  private renderGlitch(g: CanvasRenderingContext2D, gl: Glitch) {
    const shift = (Math.floor(this.tick / 3 + gl.wobble) % 3) - 1
    g.fillStyle = '#22d3ee'
    g.fillRect(gl.x - 4 + shift, gl.y - 4, 7, 7)
    g.fillStyle = '#e879f9'
    g.fillRect(gl.x - 3 - shift, gl.y - 3, 7, 7)
    g.fillStyle = '#ffffff'
    g.fillRect(gl.x - 2, gl.y - 1, 2, 2)
    g.fillRect(gl.x + 1, gl.y - 1, 2, 2)
  }

  private renderFix(g: CanvasRenderingContext2D) {
    const x = this.px
    const y = this.py
    g.fillStyle = '#0d9488'
    g.fillRect(x - 5, y - 4, 10, 9)
    g.fillStyle = '#5eead4'
    g.fillRect(x - 4, y - 7, 8, 5)
    g.fillStyle = '#0f172a'
    g.fillRect(x - 3, y - 6, 6, 2)
    g.fillStyle = '#fde047'
    g.fillRect(x - 2 + FACE_X[this.facing]!, y - 6, 1, 1)
    g.fillRect(x + 1 + FACE_X[this.facing]!, y - 6, 1, 1)
    // The wrench points the way Fix is facing.
    g.fillStyle = '#e5e7eb'
    g.fillRect(
      x + FACE_X[this.facing]! * 7 - 1,
      y + FACE_Y[this.facing]! * 7 - 1,
      3,
      3,
    )
  }

  private renderHud(g: CanvasRenderingContext2D) {
    const shadow = '#1e1b4b'
    drawText(g, String(this.score).padStart(6, '0'), 4, 2, {
      scale: 2,
      color: '#fde047',
      shadow,
    })
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W - 4, 1, {
      align: 'right',
      color: '#f9a8d4',
    })
    drawText(g, `FLOOR ${this.level}`, W - 4, 9, {
      align: 'right',
      color: '#a5f3fc',
    })
    drawText(g, 'BATTERY', 84, 1, { color: '#bbf7d0' })
    g.fillStyle = '#1f2937'
    g.fillRect(84, 9, 70, 5)
    const frac = Math.max(0, this.battery) / MAX_BATTERY
    g.fillStyle = frac > 0.4 ? '#4ade80' : frac > 0.2 ? '#facc15' : '#ef4444'
    g.fillRect(84, 9, 70 * frac, 5)
    drawText(g, `PULSE ${this.pulses}`, 162, 1, { color: '#fbcfe8' })
    drawText(g, `SAVED ${this.rescued}`, 162, 9, { color: '#fde68a' })
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, 90, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        shadow: '#7c3aed',
      })
      if (this.banner.sub) {
        drawText(g, this.banner.sub, W / 2, 110, {
          align: 'center',
          color: '#fde68a',
          shadow,
        })
      }
    }
  }
}

const kindnessGauntlet: ArcadeGameModule = {
  create: (options) => new KindnessGauntlet(options),
}

export const create = kindnessGauntlet.create
export default kindnessGauntlet
