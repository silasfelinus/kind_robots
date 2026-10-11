// /utils/arcade/sinkSuds/bristleton.ts
//
// Bristleton, the Big Brush: Sink Suds' first boss (conductor kr-arcade/t-044), a scrub brush as
// long as the tub. Three bumps on the handle end at full size tip it into the bath.
//
//   Phase 1  it sweeps arcs across the tub, pivoting on its handle; the bristles' shadow shows the
//            arc first. Only the bristles bonk; the wooden handle and shaft just shove.
//   Phase 2  it spins like a top in the middle, throwing suds rings with gaps to slip through,
//            then stops dizzy: that is the moment to bump it.
//   Phase 3  it sweeps faster and sheds mini-brushes as it goes.
//
// Every bump knocks the suds out of the bubble (back to stage 3) and shakes crumbs loose from the
// bristles, so the bubble eats its way back up for the next one.

import { INK, RAMPS, bevel, mix, rgba, shadedOrb } from '../snes'
import type { Point } from './basins'
import { segDist } from './boss'
import type { BossBody, BossHost, SudsBoss } from './boss'

export type { BossBody, BossHost }

export const BOSS_HP = 3
/** Brush length, pivot (handle end) to bristle tip. */
export const BRUSH_LEN = 140
const HALF_W = 13
/** How far from the handle end a bump counts as on the handle. */
export const HANDLE_ZONE = 26
/** Where along the brush the bristles start (fraction of its length). */
export const BRISTLE_FROM = 0.42
export const BUMP_POINTS = 2_000
export const DEFEAT_POINTS = 10_000

type Sweep = { pivot: Point; a0: number; a1: number }

/** Pivot spots round the tub, each with the arc it sweeps (radians). */
export const SWEEPS: readonly Sweep[] = [
  { pivot: { x: 64, y: 192 }, a0: -0.75, a1: 0.75 },
  { pivot: { x: 220, y: 106 }, a0: 0.35, a1: Math.PI - 0.35 },
  { pivot: { x: 376, y: 192 }, a0: Math.PI + 0.75, a1: Math.PI - 0.75 },
  { pivot: { x: 220, y: 278 }, a0: -0.35, a1: -Math.PI + 0.35 },
]

type State =
  'aim' | 'sweep' | 'rest' | 'move' | 'spin' | 'dizzy' | 'tipping' | 'gone'

export type Ring = { x: number; y: number; r: number; gap: number }

const TIMING = {
  1: { aim: 60, sweep: 62, rest: 70, move: 70 },
  3: { aim: 44, sweep: 46, rest: 56, move: 56 },
} as const
const SPIN_TICKS = 240
const DIZZY_TICKS = 150
const RING_EVERY = 100
const RING_SPEED = 1.3
/** Half the width of each of a suds ring's two gaps (radians). */
export const RING_GAP = 0.8
const SPIN_SPEED = 0.034
const CENTRE = { x: 220, y: 192 }

function wrap(a: number) {
  while (a > Math.PI) a -= Math.PI * 2
  while (a < -Math.PI) a += Math.PI * 2
  return a
}

export class Bristleton implements SudsBoss {
  readonly name = 'BRISTLETON'
  readonly maxHp = BOSS_HP
  hp = BOSS_HP
  phase: 1 | 2 | 3 = 1
  state: State = 'move'
  t = 70
  /** The handle end and the way the bristles point. */
  pivot: Point = { x: 220, y: 192 }
  angle = 0
  rings: Ring[] = []
  flash = 0
  private sweep = 0
  private from: { pivot: Point; angle: number } = {
    pivot: { x: 220, y: 192 },
    angle: 0,
  }
  private ringTimer = RING_EVERY
  private bumpCooldown = 0

  constructor() {
    // It starts lying along the tub, handle at the tap end.
    this.pivot = { x: 70, y: 192 }
    this.angle = 0
    this.from = { pivot: { ...this.pivot }, angle: 0 }
  }

  get done() {
    return this.state === 'gone'
  }

  get defeated() {
    return this.state === 'tipping' || this.state === 'gone'
  }

  /** The bristle tip. */
  get head(): Point {
    return {
      x: this.pivot.x + Math.cos(this.angle) * BRUSH_LEN,
      y: this.pivot.y + Math.sin(this.angle) * BRUSH_LEN,
    }
  }

  /** The current sweep (for the shadow tell and the pilot). */
  get arc(): Sweep {
    return SWEEPS[this.sweep]!
  }

  /** Can a full bubble bump the handle right now? */
  get bumpable() {
    if (this.defeated || this.bumpCooldown > 0) return false
    return this.phase === 2 ? this.state === 'dizzy' : true
  }

  update(host: BossHost, bubbles: BossBody[]) {
    if (this.flash > 0) this.flash--
    if (this.bumpCooldown > 0) this.bumpCooldown--
    this.moveRings(host, bubbles)
    if (this.state === 'gone') return
    if (this.state === 'tipping') {
      this.angle += 0.05
      if (--this.t <= 0) this.state = 'gone'
      return
    }
    if (this.phase === 2) this.updateSpin(host)
    else this.updateSweeps(host)
    for (const b of bubbles) if (b.alive) this.touch(host, b)
  }

  private updateSweeps(host: BossHost) {
    const timing = TIMING[this.phase === 3 ? 3 : 1]
    const arc = this.arc
    this.t--
    switch (this.state) {
      case 'move': {
        const k = 1 - Math.max(0, this.t) / timing.move
        const ease = k * k * (3 - 2 * k)
        this.pivot = {
          x: this.from.pivot.x + (arc.pivot.x - this.from.pivot.x) * ease,
          y: this.from.pivot.y + (arc.pivot.y - this.from.pivot.y) * ease,
        }
        this.angle = this.from.angle + wrap(arc.a0 - this.from.angle) * ease
        if (this.t <= 0) {
          this.state = 'aim'
          this.t = timing.aim
          host.sound('warn')
        }
        return
      }
      case 'aim':
        if (this.t <= 0) {
          this.state = 'sweep'
          this.t = timing.sweep
        }
        return
      case 'sweep': {
        const k = 1 - Math.max(0, this.t) / timing.sweep
        this.angle = arc.a0 + (arc.a1 - arc.a0) * k
        if (this.t <= 0) {
          this.state = 'rest'
          this.t = timing.rest
          if (this.phase === 3 && host.living('minibrush').length < 2)
            host.spawn('minibrush', this.head)
        }
        return
      }
      default:
        if (this.t <= 0) this.nextSweep(host)
    }
  }

  private nextSweep(host: BossHost) {
    this.from = { pivot: { ...this.pivot }, angle: this.angle }
    let next = Math.floor(host.rng() * (SWEEPS.length - 1))
    if (next >= this.sweep) next++
    this.sweep = next
    this.state = 'move'
    this.t = TIMING[this.phase === 3 ? 3 : 1].move
  }

  private updateSpin(host: BossHost) {
    if (this.state === 'move') {
      // Glide to the middle first, standing on end.
      this.t--
      const k = 1 - Math.max(0, this.t) / 70
      const centre = {
        x: CENTRE.x - (Math.cos(this.angle) * BRUSH_LEN) / 2,
        y: CENTRE.y - (Math.sin(this.angle) * BRUSH_LEN) / 2,
      }
      this.pivot = {
        x: this.from.pivot.x + (centre.x - this.from.pivot.x) * k,
        y: this.from.pivot.y + (centre.y - this.from.pivot.y) * k,
      }
      if (this.t <= 0) {
        this.state = 'spin'
        this.t = SPIN_TICKS
        this.ringTimer = 30
      }
      return
    }
    if (this.state === 'dizzy') {
      if (--this.t <= 0) {
        this.state = 'spin'
        this.t = SPIN_TICKS
        host.sound('warn')
      }
      return
    }
    // Spinning about its middle like a top.
    this.angle += SPIN_SPEED
    this.pivot = {
      x: CENTRE.x - (Math.cos(this.angle) * BRUSH_LEN) / 2,
      y: CENTRE.y - (Math.sin(this.angle) * BRUSH_LEN) / 2,
    }
    if (--this.ringTimer <= 0) {
      this.ringTimer = RING_EVERY
      this.rings.push({ ...CENTRE, r: 20, gap: host.rng() * Math.PI * 2 })
      host.sound('pop')
    }
    if (--this.t <= 0) {
      this.state = 'dizzy'
      this.t = DIZZY_TICKS
    }
  }

  private moveRings(host: BossHost, bubbles: BossBody[]) {
    for (const ring of this.rings) {
      ring.r += RING_SPEED
      for (const b of bubbles) {
        if (!b.alive || b.invuln > 0) continue
        const d = Math.hypot(b.x - ring.x, b.y - ring.y)
        if (Math.abs(d - ring.r) > host.radiusOf(b) + 3) continue
        // Two gaps opposite each other to slip through.
        const a = Math.atan2(b.y - ring.y, b.x - ring.x)
        const off = Math.abs(wrap(a - ring.gap))
        if (off < RING_GAP || Math.abs(off - Math.PI) < RING_GAP) continue
        // Suds rings soak rather than pop.
        host.hurt(b, { x: ring.x, y: ring.y }, 'soak')
      }
    }
    this.rings = this.rings.filter((r) => r.r < 300)
  }

  /** The bubble against the brush: bristles bonk, the shaft shoves, the handle can be bumped. */
  private touch(host: BossHost, b: BossBody) {
    const r = host.radiusOf(b)
    const { d, t } = segDist(b, this.pivot, this.head)
    if (d > r + HALF_W) return
    const along = t * BRUSH_LEN
    const shove = () => {
      const a = Math.atan2(
        b.y - (this.pivot.y + (this.head.y - this.pivot.y) * t),
        b.x - (this.pivot.x + (this.head.x - this.pivot.x) * t),
      )
      b.vx = Math.cos(a) * 2.6
      b.vy = Math.sin(a) * 2.6
      b.x += Math.cos(a) * 2
      b.y += Math.sin(a) * 2
    }
    if (along < HANDLE_ZONE) {
      if (b.stage >= 5 && this.bumpable) {
        this.bump(host, b)
        return
      }
      shove()
      return
    }
    const spinning = this.phase === 2 && this.state === 'spin'
    // Gliding to its next spot it only shoves: the bristles bonk when they sweep or spin.
    if ((t >= BRISTLE_FROM || spinning) && this.state !== 'move') {
      if (b.invuln > 0) {
        shove()
        return
      }
      host.hurt(b, this.pivot, 'hit')
      shove()
      return
    }
    shove()
  }

  private bump(host: BossHost, b: BossBody) {
    this.hp--
    this.flash = 40
    this.bumpCooldown = 90
    host.bumped(b, { ...this.pivot })
    host.dropCrumbs(this.head, 10)
    host.sound('boom')
    const a = Math.atan2(b.y - this.pivot.y, b.x - this.pivot.x)
    b.vx = Math.cos(a) * 4
    b.vy = Math.sin(a) * 4
    if (this.hp <= 0) {
      this.state = 'tipping'
      this.t = 150
      this.rings = []
      return
    }
    this.phase = this.hp === 2 ? 2 : 3
    this.from = { pivot: { ...this.pivot }, angle: this.angle }
    this.state = 'move'
    this.t = 70
  }

  /** Points the pilot steers clear of: the bristles now and, while it aims, where they will sweep. */
  threats(): Point[] {
    if (this.defeated) return []
    const out: Point[] = []
    const along = (angle: number, pivot: Point) => {
      for (let k = BRISTLE_FROM; k <= 1.001; k += 0.15)
        out.push({
          x: pivot.x + Math.cos(angle) * BRUSH_LEN * k,
          y: pivot.y + Math.sin(angle) * BRUSH_LEN * k,
        })
    }
    along(this.angle, this.pivot)
    if (this.state === 'aim' || this.state === 'sweep') {
      const arc = this.arc
      for (let s = 0; s <= 1.001; s += 0.25)
        along(arc.a0 + (arc.a1 - arc.a0) * s, arc.pivot)
    }
    if (this.phase === 2 && this.state === 'spin')
      for (let a = 0; a < Math.PI * 2; a += 0.6)
        out.push({
          x: CENTRE.x + Math.cos(a) * BRUSH_LEN * 0.4,
          y: CENTRE.y + Math.sin(a) * BRUSH_LEN * 0.4,
        })
    return out
  }

  get hint() {
    if (this.defeated) return ''
    if (this.phase === 2)
      return this.state === 'dizzy'
        ? 'DIZZY! BUMP THE HANDLE'
        : 'SLIP THROUGH THE GAPS'
    return 'FULL SIZE: BUMP THE HANDLE'
  }

  goal(b: BossBody, r: number): Point | null {
    return b.stage >= 5 ? this.bumpSpot(r) : null
  }

  /** Where a full bubble should go to bump the handle, if it can now. */
  bumpSpot(r: number): Point | null {
    if (!this.bumpable || this.state === 'move') return null
    return {
      x: this.pivot.x - Math.cos(this.angle) * (r + 4),
      y: this.pivot.y - Math.sin(this.angle) * (r + 4),
    }
  }

  // --- art ----------------------------------------------------------------------------------

  render(g: CanvasRenderingContext2D, tick: number) {
    if (this.state === 'gone') return
    if (this.state === 'aim' || (this.state === 'sweep' && this.phase !== 2))
      this.renderShadow(g, tick)
    for (const ring of this.rings) this.renderRing(g, ring, tick)
    g.save()
    if (this.state === 'tipping') {
      const k = this.t / 150
      g.globalAlpha = Math.max(0, k)
    }
    if (this.phase === 2 && this.state === 'spin') {
      // Motion ghosts while it spins.
      for (let i = 1; i <= 2; i++) {
        g.save()
        g.globalAlpha *= 0.25 / i
        this.renderBody(g, this.angle - i * SPIN_SPEED * 3, tick, true)
        g.restore()
      }
    }
    this.renderBody(g, this.angle, tick, false)
    g.restore()
    if (this.state === 'dizzy') {
      const c = { x: CENTRE.x, y: CENTRE.y - 18 }
      for (let i = 0; i < 4; i++) {
        const a = tick / 9 + (i * Math.PI) / 2
        g.fillStyle = i % 2 ? RAMPS.gold[4] : RAMPS.pink[3]
        const sx = Math.round(c.x + Math.cos(a) * 16)
        const sy = Math.round(c.y + Math.sin(a) * 5)
        g.fillRect(sx - 1, sy, 3, 1)
        g.fillRect(sx, sy - 1, 1, 3)
      }
    }
  }

  private renderShadow(g: CanvasRenderingContext2D, tick: number) {
    const arc = this.arc
    const lo = Math.min(arc.a0, arc.a1)
    const hi = Math.max(arc.a0, arc.a1)
    g.save()
    g.fillStyle = rgba(
      INK,
      this.state === 'aim' ? 0.18 + 0.1 * Math.sin(tick / 4) : 0.12,
    )
    g.beginPath()
    g.arc(arc.pivot.x, arc.pivot.y, BRUSH_LEN + 6, lo, hi)
    g.arc(arc.pivot.x, arc.pivot.y, BRUSH_LEN * BRISTLE_FROM, hi, lo, true)
    g.closePath()
    g.fill()
    g.strokeStyle = rgba(RAMPS.ember[3], 0.7)
    g.setLineDash?.([4, 4])
    g.beginPath()
    g.arc(arc.pivot.x, arc.pivot.y, BRUSH_LEN + 6, lo, hi)
    g.stroke()
    g.setLineDash?.([])
    g.restore()
  }

  private renderRing(g: CanvasRenderingContext2D, ring: Ring, tick: number) {
    g.save()
    g.lineWidth = 4
    for (const half of [0, Math.PI]) {
      const from = ring.gap + half + RING_GAP
      const to = ring.gap + half + Math.PI - RING_GAP
      g.strokeStyle = rgba('#ffffff', 0.85)
      g.beginPath()
      g.arc(ring.x, ring.y, ring.r, from, to)
      g.stroke()
      g.strokeStyle = rgba(RAMPS.sky[3], 0.6)
      g.lineWidth = 2
      g.beginPath()
      g.arc(ring.x, ring.y, ring.r - 2, from + Math.sin(tick / 6) * 0.05, to)
      g.stroke()
      g.lineWidth = 4
    }
    g.restore()
  }

  private renderBody(
    g: CanvasRenderingContext2D,
    angle: number,
    tick: number,
    ghost: boolean,
  ) {
    const L = BRUSH_LEN
    const head0 = L * BRISTLE_FROM
    g.save()
    g.translate(this.pivot.x, this.pivot.y)
    g.rotate(angle)
    if (!ghost) {
      g.fillStyle = rgba(INK, 0.3)
      g.fillRect(4, -HALF_W + 6, L, HALF_W * 2)
    }
    // The wooden shaft.
    bevel(g, 6, -6, head0, 12, RAMPS.earth, { depth: 2 })
    // The head: a teal back with a gold bristle fringe either side.
    const flash = this.flash > 0 && Math.floor(this.flash / 4) % 2 === 0
    const back = flash
      ? (['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff'] as const)
      : RAMPS.teal
    for (const side of [-1, 1]) {
      for (let x = head0; x < L; x += 3) {
        const wig = Math.sin(tick / 3 + x) > 0 ? 1 : 0
        g.fillStyle = (x / 3) % 2 ? RAMPS.gold[3] : RAMPS.gold[2]
        g.fillRect(
          Math.round(x),
          side < 0 ? -HALF_W - wig : HALF_W - 4 + wig,
          2,
          4,
        )
      }
    }
    bevel(g, head0, -HALF_W + 3, L - head0, HALF_W * 2 - 6, back, { depth: 2 })
    g.fillStyle = mix(RAMPS.teal[1], RAMPS.teal[0], 0.5)
    g.fillRect(head0 + 4, -1, L - head0 - 8, 2)
    // A grumpy face on the back.
    const ex = head0 + (L - head0) * 0.62
    for (const side of [-1, 1]) {
      g.fillStyle = '#ffffff'
      g.fillRect(Math.round(ex - 3), side * 5 - 3, 6, 6)
      g.fillStyle = INK
      if (this.state === 'dizzy' || this.defeated) {
        g.fillRect(Math.round(ex - 2), side * 5 - 2, 1, 1)
        g.fillRect(Math.round(ex + 1), side * 5 + 1, 1, 1)
        g.fillRect(Math.round(ex - 1), side * 5 - 1, 2, 2)
      } else {
        g.fillRect(Math.round(ex), side * 5 - 1, 2, 3)
        // Cross brows.
        g.fillRect(Math.round(ex - 5), side * 5 - (side < 0 ? 5 : -4), 8, 1)
      }
    }
    g.fillStyle = INK
    g.fillRect(Math.round(ex + 10), -3, 2, 6)
    g.restore()
    // The handle knob: the spot to bump, glowing gold when it can be bumped.
    if (!ghost) {
      const ramp = this.bumpable ? RAMPS.gold : RAMPS.earth
      shadedOrb(g, this.pivot.x, this.pivot.y, 9, ramp)
      if (this.bumpable && Math.floor(tick / 10) % 2 === 0) {
        g.strokeStyle = RAMPS.gold[4]
        g.beginPath()
        g.arc(this.pivot.x, this.pivot.y, 13, 0, Math.PI * 2)
        g.stroke()
      }
    }
  }
}
