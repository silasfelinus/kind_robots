// /utils/arcade/games/sinkSuds.ts
//
// Sink Suds -- the Kind Robots Arcade's riff on the 1982 sink-bubble game
// (conductor kr-arcade/t-009, first game-factory cabinet). You are a soap
// bubble drifting around a robot's kitchen sink. Scrub up crumbs and grease
// to grow; rust mites pop a small bubble but a big one swallows them; scrub
// brushes hunt you and eat the mess too. At full size the drain glows: sail
// down it to clean the next sink. A gives a quick puff of speed.

import { levelCurve } from '../curve'
import { drawText } from '../font'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'

const W = 420
const H = 360
const SINK = { cx: W / 2, cy: H / 2 + 8, rx: 186, ry: 146 }
const DRAIN = { x: SINK.cx, y: SINK.cy, r: 13 }

const ACCEL = 0.09
const FRICTION = 0.965
const MAX_SPEED = 2.3
const PUFF_SPEED = 4.2
const PUFF_COOLDOWN = 70
const START_LIVES = 3
const EXTRA_LIFE_EVERY = 15_000
const MAX_STAGE = 5
const STAGE_RADIUS = [0, 7, 9.5, 12, 14.5, 17]
const GROWTH_PER_STAGE = 8

export const SUDS_CURVES = {
  messStart: { start: 26, step: 4, limit: 50 },
  mites: { start: 2, step: 1, limit: 9 },
  miteSpeed: { start: 0.55, step: 0.06, limit: 1.2 },
  brushes: { start: 0, step: 0.5, limit: 3 },
  brushSpeed: { start: 0.45, step: 0.05, limit: 0.95 },
  dripEvery: { start: 150, step: -10, limit: 50 },
} as const

type Mess = { x: number; y: number; kind: 'crumb' | 'grease'; r: number }
type Mite = { x: number; y: number; vx: number; vy: number; turn: number }
type Brush = { x: number; y: number; angle: number }
type Drip = { x: number; y: number; vy: number; landY: number }
type Pop = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = { x: number; y: number; text: string; life: number }

/** Is (x, y) inside the sink basin, shrunk by `margin` pixels? */
export function insideSink(x: number, y: number, margin = 0): boolean {
  const dx = (x - SINK.cx) / (SINK.rx - margin)
  const dy = (y - SINK.cy) / (SINK.ry - margin)
  return dx * dx + dy * dy <= 1
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

class SinkSuds implements ArcadeGameInstance {
  score = 0
  level = 0
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private bubble = { x: SINK.cx, y: SINK.cy + 60, vx: 0, vy: 0, wobble: 0 }
  private growth = 0
  private stage = 1
  private puff = 0
  private alive = true
  private respawn = 0
  private invuln = 0
  private mess: Mess[] = []
  private mites: Mite[] = []
  private brushes: Brush[] = []
  private drips: Drip[] = []
  private pops: Pop[] = []
  private floaters: Floater[] = []
  private dripTimer = 0
  private draining = 0
  private overTimer = 0
  private nextExtra = EXTRA_LIFE_EVERY
  private banner: { text: string; sub?: string; ticks: number } | null = null

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.startLevel(1)
  }

  // --- setup ------------------------------------------------------------------

  private spot(
    margin: number,
    awayFrom?: { x: number; y: number },
    minDistance = 0,
  ) {
    for (let attempt = 0; attempt < 80; attempt++) {
      const p = {
        x: SINK.cx + (this.rng() * 2 - 1) * SINK.rx,
        y: SINK.cy + (this.rng() * 2 - 1) * SINK.ry,
      }
      if (!insideSink(p.x, p.y, margin)) continue
      if (dist(p, DRAIN) < 30) continue
      if (awayFrom && dist(p, awayFrom) < minDistance) continue
      return p
    }
    return { x: SINK.cx + 80, y: SINK.cy }
  }

  private addMess(at?: { x: number; y: number }) {
    const p = at ?? this.spot(14)
    const grease = this.rng() < 0.3
    this.mess.push({
      x: p.x,
      y: p.y,
      kind: grease ? 'grease' : 'crumb',
      r: grease ? 5 : 3,
    })
  }

  private startLevel(level: number) {
    this.level = level
    this.stage = 1
    this.growth = 0
    this.mess = []
    this.mites = []
    this.brushes = []
    this.drips = []
    this.draining = 0
    Object.assign(this.bubble, { x: SINK.cx, y: SINK.cy + 70, vx: 0, vy: 0 })
    const count = (spec: { start: number; step: number; limit: number }) =>
      Math.max(0, Math.floor(levelCurve(level, spec)))
    for (let i = 0; i < count(SUDS_CURVES.messStart); i++) this.addMess()
    for (let i = 0; i < count(SUDS_CURVES.mites); i++) {
      const p = this.spot(16, this.bubble, 90)
      this.mites.push({ x: p.x, y: p.y, vx: 0, vy: 0, turn: 0 })
    }
    for (let i = 0; i < count(SUDS_CURVES.brushes); i++) {
      const p = this.spot(24, this.bubble, 140)
      this.brushes.push({ x: p.x, y: p.y, angle: 0 })
    }
    this.dripTimer = Math.round(levelCurve(level, SUDS_CURVES.dripEvery))
    this.invuln = 90
    this.banner = { text: `SINK ${level}`, ticks: 90 }
  }

  private get radius() {
    return STAGE_RADIUS[this.stage]!
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    if (this.lives <= 0 && !this.alive) {
      if (++this.overTimer > 100) this.over = true
      return
    }
    if (this.draining > 0) {
      // Spiral down the drain, then rinse into the next sink.
      this.draining++
      const t = this.draining / 70
      this.bubble.x = DRAIN.x + Math.cos(this.draining / 4) * 20 * (1 - t)
      this.bubble.y = DRAIN.y + Math.sin(this.draining / 4) * 20 * (1 - t)
      if (this.draining > 70) {
        const left = this.mess.length
        const bonus = Math.max(0, 1000 * this.level - left * 50)
        if (bonus) this.addScore(bonus, SINK.cx, SINK.cy - 40)
        this.startLevel(this.level + 1)
      }
      return
    }
    if (!this.alive) {
      if (--this.respawn <= 0) this.revive()
      return
    }

    const controls = this.demo ? this.demoInput() : input
    this.moveBubble(controls)
    this.moveMites()
    this.moveBrushes()
    this.moveDrips()
    this.collide()
  }

  private moveBubble(input: InputFrame) {
    const b = this.bubble
    let ax = 0
    let ay = 0
    if (input.held.left) ax -= 1
    if (input.held.right) ax += 1
    if (input.held.up) ay -= 1
    if (input.held.down) ay += 1
    const len = Math.hypot(ax, ay)
    if (len) {
      b.vx += (ax / len) * ACCEL
      b.vy += (ay / len) * ACCEL
    }
    if (this.puff > 0) this.puff--
    if (
      input.pressed.a &&
      this.puff === 0 &&
      (len || Math.hypot(b.vx, b.vy) > 0.2)
    ) {
      const dx = len ? ax / len : b.vx / Math.hypot(b.vx, b.vy)
      const dy = len ? ay / len : b.vy / Math.hypot(b.vx, b.vy)
      b.vx = dx * PUFF_SPEED
      b.vy = dy * PUFF_SPEED
      this.puff = PUFF_COOLDOWN
      this.sound.play('blip')
    }
    const speed = Math.hypot(b.vx, b.vy)
    const cap = this.puff > PUFF_COOLDOWN - 15 ? PUFF_SPEED : MAX_SPEED
    if (speed > cap) {
      b.vx *= cap / speed
      b.vy *= cap / speed
    }
    b.vx *= FRICTION
    b.vy *= FRICTION
    b.x += b.vx
    b.y += b.vy
    // Bounce softly off the sink wall.
    if (!insideSink(b.x, b.y, this.radius)) {
      const nx = (b.x - SINK.cx) / (SINK.rx * SINK.rx)
      const ny = (b.y - SINK.cy) / (SINK.ry * SINK.ry)
      const nlen = Math.hypot(nx, ny) || 1
      const ux = nx / nlen
      const uy = ny / nlen
      const dot = b.vx * ux + b.vy * uy
      if (dot > 0) {
        b.vx -= 1.6 * dot * ux
        b.vy -= 1.6 * dot * uy
      }
      while (!insideSink(b.x, b.y, this.radius)) {
        b.x -= ux
        b.y -= uy
      }
    }
    b.wobble += 0.12 + speed * 0.05
    if (this.invuln > 0) this.invuln--
  }

  private moveMites() {
    const speed = levelCurve(this.level, SUDS_CURVES.miteSpeed)
    for (const m of this.mites) {
      if (--m.turn <= 0) {
        // Mites mostly wander, sometimes scuttle toward the nearest crumb.
        const target = this.rng() < 0.4 ? this.nearestMess(m) : null
        const a = target
          ? Math.atan2(target.y - m.y, target.x - m.x)
          : this.rng() * Math.PI * 2
        m.vx = Math.cos(a) * speed
        m.vy = Math.sin(a) * speed
        m.turn = 30 + Math.floor(this.rng() * 50)
      }
      m.x += m.vx
      m.y += m.vy
      if (!insideSink(m.x, m.y, 8)) {
        m.x -= m.vx * 2
        m.y -= m.vy * 2
        m.turn = 0
      }
    }
  }

  private moveBrushes() {
    const speed = levelCurve(this.level, SUDS_CURVES.brushSpeed)
    const b = this.bubble
    for (const br of this.brushes) {
      // Brushes chase the bubble when it is close, otherwise scrub the nearest mess.
      const near = dist(br, b) < 120
      const target = near ? b : (this.nearestMess(br) ?? b)
      const a = Math.atan2(target.y - br.y, target.x - br.x)
      br.angle += 0.08
      br.x += Math.cos(a) * speed
      br.y += Math.sin(a) * speed
      if (!insideSink(br.x, br.y, 14)) {
        br.x -= Math.cos(a) * speed * 2
        br.y -= Math.sin(a) * speed * 2
      }
      const eaten = this.mess.findIndex((m) => dist(m, br) < 12)
      if (eaten >= 0) this.mess.splice(eaten, 1)
    }
  }

  private moveDrips() {
    if (--this.dripTimer <= 0) {
      const land = this.spot(16)
      this.drips.push({
        x: land.x,
        y: SINK.cy - SINK.ry - 20,
        vy: 2.5,
        landY: land.y,
      })
      this.dripTimer = Math.round(levelCurve(this.level, SUDS_CURVES.dripEvery))
    }
    for (const d of this.drips) d.y += d.vy
    const landed = this.drips.filter((d) => d.y >= d.landY)
    for (const d of landed) this.addMess({ x: d.x, y: d.landY })
    this.drips = this.drips.filter((d) => d.y < d.landY)
  }

  private nearestMess(from: { x: number; y: number }): Mess | null {
    let best: Mess | null = null
    let bestDistance = Infinity
    for (const m of this.mess) {
      const d = dist(m, from)
      if (d < bestDistance) {
        bestDistance = d
        best = m
      }
    }
    return best
  }

  private grow(amount: number) {
    if (this.stage >= MAX_STAGE) return
    this.growth += amount
    if (this.growth >= GROWTH_PER_STAGE) {
      this.growth -= GROWTH_PER_STAGE
      this.stage++
      this.sound.play('pickup')
      if (this.stage === MAX_STAGE) {
        this.banner = {
          text: 'FULL OF SUDS!',
          sub: 'SAIL DOWN THE DRAIN',
          ticks: 120,
        }
        this.sound.play('level')
      }
    }
  }

  private collide() {
    const b = this.bubble
    const r = this.radius
    for (let i = this.mess.length - 1; i >= 0; i--) {
      const m = this.mess[i]!
      if (dist(m, b) < r + m.r) {
        this.mess.splice(i, 1)
        const points = m.kind === 'grease' ? 25 : 10
        this.addScore(points)
        this.grow(m.kind === 'grease' ? 2 : 1)
        if (this.tick % 2 === 0) this.sound.play('blip')
      }
    }
    if (this.stage >= MAX_STAGE && dist(b, DRAIN) < DRAIN.r + 4) {
      this.draining = 1
      this.sound.play('extra')
      return
    }
    if (this.invuln > 0) return
    for (let i = this.mites.length - 1; i >= 0; i--) {
      const m = this.mites[i]!
      if (dist(m, b) < r + 4) {
        if (this.stage >= 3) {
          this.mites.splice(i, 1)
          this.addScore(100, m.x, m.y)
          this.burst(m.x, m.y, 8, '#b45309')
          this.sound.play('pop')
          // A swallowed mite drops a crumb somewhere else: the sink is never quite done.
          this.addMess()
        } else {
          this.popBubble()
          return
        }
      }
    }
    for (const br of this.brushes) {
      if (dist(br, b) < r + 10) {
        this.popBubble()
        return
      }
    }
  }

  private popBubble() {
    this.alive = false
    this.lives--
    this.respawn = 100
    this.burst(this.bubble.x, this.bubble.y, 30, '#e0f2fe')
    this.sound.play('die')
    if (this.lives <= 0) this.banner = { text: 'GAME OVER', ticks: 9999 }
  }

  private revive() {
    Object.assign(this.bubble, { x: SINK.cx, y: SINK.cy + 70, vx: 0, vy: 0 })
    this.stage = Math.max(1, this.stage - 1)
    this.growth = 0
    this.alive = true
    this.invuln = 120
  }

  private addScore(points: number, x?: number, y?: number) {
    if (this.demo) return
    this.score += points
    if (x !== undefined && y !== undefined) {
      this.floaters.push({ x, y, text: String(points), life: 50 })
    }
    if (this.score >= this.nextExtra) {
      this.lives++
      this.nextExtra += EXTRA_LIFE_EVERY
      this.sound.play('extra')
      this.banner = { text: 'EXTRA BUBBLE!', ticks: 90 }
    }
  }

  private burst(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.5 + this.rng() * 2
      this.pops.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 25 + Math.floor(this.rng() * 20),
        color,
      })
    }
  }

  private updateEffects() {
    for (const p of this.pops) {
      p.x += p.vx
      p.y += p.vy
      p.vx *= 0.93
      p.vy *= 0.93
      p.life--
    }
    this.pops = this.pops.filter((p) => p.life > 0)
    for (const f of this.floaters) {
      f.y -= 0.35
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
  }

  // --- attract-mode pilot --------------------------------------------------------

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
    const b = this.bubble
    const goal: { x: number; y: number } | null =
      this.stage >= MAX_STAGE ? DRAIN : this.nearestMess(b)
    let steerX = goal ? goal.x - b.x : 0
    let steerY = goal ? goal.y - b.y : 0
    const scale = Math.hypot(steerX, steerY) || 1
    steerX /= scale
    steerY /= scale
    // Shy away from anything that could pop the bubble.
    const threats: Array<{ x: number; y: number }> = [...this.brushes]
    if (this.stage < 3) threats.push(...this.mites)
    for (const t of threats) {
      const d = dist(t, b)
      if (d < 70) {
        steerX += (((b.x - t.x) / d) * (70 - d)) / 25
        steerY += (((b.y - t.y) / d) * (70 - d)) / 25
      }
    }
    const lead = 0.3
    if (steerX < -lead) held.left = true
    if (steerX > lead) held.right = true
    if (steerY < -lead) held.up = true
    if (steerY > lead) held.down = true
    return frame
  }

  // --- render ------------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    this.renderKitchen(g)
    for (const m of this.mess) this.renderMess(g, m)
    for (const d of this.drips) {
      g.fillStyle = 'rgba(165, 243, 252, 0.8)'
      g.beginPath()
      g.ellipse(d.x, d.y, 2, 3.5, 0, 0, Math.PI * 2)
      g.fill()
    }
    for (const m of this.mites) this.renderMite(g, m)
    for (const br of this.brushes) this.renderBrush(g, br)
    for (const p of this.pops) {
      g.globalAlpha = Math.max(0, p.life / 45)
      g.fillStyle = p.color
      g.fillRect(p.x - 1, p.y - 1, 2, 2)
    }
    g.globalAlpha = 1
    if (
      this.alive &&
      !(this.invuln > 0 && Math.floor(this.invuln / 6) % 2 === 0)
    ) {
      this.renderBubble(g)
    }
    for (const f of this.floaters) {
      drawText(g, f.text, f.x, f.y, { align: 'center', color: '#fde68a' })
    }
    this.renderHud(g)
  }

  private renderKitchen(g: CanvasRenderingContext2D) {
    // Countertop tiles.
    g.fillStyle = '#312e81'
    g.fillRect(0, 0, W, H)
    g.fillStyle = '#3730a3'
    for (let y = 0; y < H; y += 24) {
      for (let x = (y / 24) % 2 ? 0 : 24; x < W; x += 48)
        g.fillRect(x, y, 24, 24)
    }
    // Faucet at the back of the sink.
    g.fillStyle = '#cbd5e1'
    g.fillRect(SINK.cx - 6, SINK.cy - SINK.ry - 26, 12, 22)
    g.fillRect(SINK.cx - 22, SINK.cy - SINK.ry - 30, 44, 7)
    // Basin rim and bowl.
    g.fillStyle = '#e2e8f0'
    g.beginPath()
    g.ellipse(SINK.cx, SINK.cy, SINK.rx + 9, SINK.ry + 9, 0, 0, Math.PI * 2)
    g.fill()
    const bowl = g.createRadialGradient(
      SINK.cx,
      SINK.cy - 30,
      20,
      SINK.cx,
      SINK.cy,
      SINK.rx,
    )
    bowl.addColorStop(0, '#f8fafc')
    bowl.addColorStop(1, '#94a3b8')
    g.fillStyle = bowl
    g.beginPath()
    g.ellipse(SINK.cx, SINK.cy, SINK.rx, SINK.ry, 0, 0, Math.PI * 2)
    g.fill()
    // The drain: it glows when the bubble is full of suds.
    const ready = this.stage >= MAX_STAGE
    if (ready) {
      g.fillStyle = `rgba(250, 204, 21, ${0.35 + 0.25 * Math.sin(this.tick / 6)})`
      g.beginPath()
      g.arc(DRAIN.x, DRAIN.y, DRAIN.r + 8, 0, Math.PI * 2)
      g.fill()
    }
    g.fillStyle = '#475569'
    g.beginPath()
    g.arc(DRAIN.x, DRAIN.y, DRAIN.r, 0, Math.PI * 2)
    g.fill()
    g.strokeStyle = '#1e293b'
    g.lineWidth = 2
    g.beginPath()
    for (let i = -1; i <= 1; i++) {
      g.moveTo(DRAIN.x - 8, DRAIN.y + i * 5)
      g.lineTo(DRAIN.x + 8, DRAIN.y + i * 5)
    }
    g.stroke()
  }

  private renderMess(g: CanvasRenderingContext2D, m: Mess) {
    if (m.kind === 'grease') {
      g.fillStyle = 'rgba(161, 98, 7, 0.55)'
      g.beginPath()
      g.ellipse(m.x, m.y, 6, 4, (m.x + m.y) % 3, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = 'rgba(253, 224, 71, 0.6)'
      g.fillRect(m.x - 1, m.y - 2, 2, 1)
    } else {
      g.fillStyle = '#b45309'
      g.fillRect(m.x - 2, m.y - 1.5, 4, 3)
      g.fillStyle = '#f59e0b'
      g.fillRect(m.x - 1, m.y - 1.5, 2, 1)
    }
  }

  private renderMite(g: CanvasRenderingContext2D, m: Mite) {
    const legs = Math.floor(this.tick / 5) % 2
    g.fillStyle = '#9a3412'
    g.beginPath()
    g.ellipse(m.x, m.y, 4, 3, Math.atan2(m.vy, m.vx), 0, Math.PI * 2)
    g.fill()
    g.strokeStyle = '#7c2d12'
    g.lineWidth = 1
    g.beginPath()
    for (const side of [-1, 1]) {
      g.moveTo(m.x - 2, m.y)
      g.lineTo(m.x - 4, m.y + side * (3 + legs))
      g.moveTo(m.x + 2, m.y)
      g.lineTo(m.x + 4, m.y + side * (4 - legs))
    }
    g.stroke()
    g.fillStyle = '#fde68a'
    g.fillRect(m.x + Math.cos(Math.atan2(m.vy, m.vx)) * 3 - 0.5, m.y - 1, 1, 1)
  }

  private renderBrush(g: CanvasRenderingContext2D, br: Brush) {
    g.save()
    g.translate(br.x, br.y)
    g.rotate(Math.sin(br.angle) * 0.3)
    g.fillStyle = '#14b8a6'
    g.fillRect(-10, -6, 20, 8)
    g.fillStyle = '#fde68a'
    for (let i = -9; i <= 9; i += 3) g.fillRect(i, 2, 1.5, 5)
    g.fillStyle = '#0f766e'
    g.fillRect(-6, -4, 3, 2)
    g.fillRect(3, -4, 3, 2)
    g.restore()
  }

  private renderBubble(g: CanvasRenderingContext2D) {
    const b = this.bubble
    const r =
      this.draining > 0
        ? this.radius * Math.max(0.1, 1 - this.draining / 70)
        : this.radius
    const wob = Math.sin(b.wobble) * 0.08
    g.save()
    g.translate(b.x, b.y)
    g.scale(1 + wob, 1 - wob)
    const film = g.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r)
    film.addColorStop(0, 'rgba(255, 255, 255, 0.85)')
    film.addColorStop(0.5, 'rgba(165, 243, 252, 0.35)')
    film.addColorStop(0.8, 'rgba(244, 114, 182, 0.35)')
    film.addColorStop(1, 'rgba(167, 139, 250, 0.7)')
    g.fillStyle = film
    g.beginPath()
    g.arc(0, 0, r, 0, Math.PI * 2)
    g.fill()
    g.strokeStyle = 'rgba(255, 255, 255, 0.8)'
    g.lineWidth = 1
    g.stroke()
    // A happy little face.
    g.fillStyle = '#1e1b4b'
    g.fillRect(-r * 0.35, -r * 0.15, 2, 2)
    g.fillRect(r * 0.2, -r * 0.15, 2, 2)
    g.beginPath()
    g.arc(0, r * 0.15, r * 0.25, 0.2, Math.PI - 0.2)
    g.stroke()
    g.restore()
  }

  private renderHud(g: CanvasRenderingContext2D) {
    const shadow = '#1e1b4b'
    drawText(g, String(this.score).padStart(6, '0'), 8, 6, {
      scale: 2,
      color: '#a5f3fc',
      shadow,
    })
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W / 2, 6, {
      scale: 2,
      align: 'center',
      color: '#fde68a',
      shadow,
    })
    for (let i = 0; i < Math.min(this.lives, 5); i++) {
      drawText(g, '*', W - 14 - i * 14, 6, {
        scale: 2,
        color: '#f9a8d4',
        shadow,
      })
    }
    drawText(g, `SINK ${this.level}`, 8, H - 12, { color: '#c4b5fd' })
    // Suds meter: how close the bubble is to full size.
    const filled =
      this.stage >= MAX_STAGE
        ? 1
        : (this.stage - 1 + this.growth / GROWTH_PER_STAGE) / (MAX_STAGE - 1)
    g.fillStyle = '#1e1b4b'
    g.fillRect(W - 110, H - 14, 100, 8)
    g.fillStyle = filled >= 1 ? '#facc15' : '#a5f3fc'
    g.fillRect(W - 110, H - 14, 100 * filled, 8)
    drawText(g, 'SUDS', W - 116, H - 13, { align: 'right', color: '#a5f3fc' })
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, H / 2 - 50, {
        scale: 3,
        align: 'center',
        color: '#ffffff',
        shadow: '#0e7490',
      })
      if (this.banner.sub) {
        drawText(g, this.banner.sub, W / 2, H / 2 - 18, {
          scale: 2,
          align: 'center',
          color: '#fde68a',
          shadow,
        })
      }
    }
  }
}

const sinkSuds: ArcadeGameModule = {
  create: (options) => new SinkSuds(options),
}

export const create = sinkSuds.create
export default sinkSuds
