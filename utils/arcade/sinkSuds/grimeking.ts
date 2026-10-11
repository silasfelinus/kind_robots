// /utils/arcade/sinkSuds/grimeking.ts
//
// The Grime King: Sink Suds' finale (conductor kr-arcade/t-045), at the town fountain.
//
//   Phase 1  the fountain's jets push the bubble about (each lights on the rim first) while grime
//            minions guard the King. Eat or trap every minion.
//   Phase 2  the King splits into grime drops that drift back together to re-form him. Swallow
//            them all before they do; if they gather, he re-forms and splits again.
//   Phase 3  the fountain runs clear and the bubble, filled past full, becomes a giant bubble as
//            wide as the basin. Sweep the King down the drain.

import { INK, RAMPS, glow, mix, rgba, shadedOrb } from '../snes'
import type { Point } from './basins'
import type { BossBody, BossHost, SudsBoss } from './boss'
import { nearest } from './boss'

export const KING_R = 28
export const SMALL_KING_R = 18
export const MINIONS = 8
export const DROPS = 6
/** Radius of the finale's giant bubble. */
export const GIANT_R = 50
const JET_EVERY = 150
const JET_TELL = 55
const JET_BLAST = 40
const JET_PUSH = 0.32
const JET_CONE = 0.42
/** Drops this close to their middle for this long re-form the King. */
const REFORM_SPREAD = 28
const REFORM_TICKS = 150
const FOUNTAIN = { cx: 210, cy: 196, rx: 184, ry: 138 }

type State = 'guarded' | 'split' | 'reformed' | 'giant' | 'draining' | 'gone'

export type Jet = { a: number; t: number }

export class GrimeKing implements SudsBoss {
  readonly name = 'THE GRIME KING'
  readonly maxHp = 3
  phase: 1 | 2 | 3 = 1
  state: State = 'guarded'
  t = 0
  x = FOUNTAIN.cx
  y = FOUNTAIN.cy
  vx = 0
  vy = 0
  jets: Jet[] = []
  private started = false
  private jetTimer = 90
  private gathered = 0
  private drops = DROPS
  /** Phase 3: caught inside the giant bubble. */
  caught = false

  get hp() {
    return this.defeated ? 0 : 4 - this.phase
  }

  get defeated() {
    return this.state === 'draining' || this.state === 'gone'
  }

  get done() {
    return this.state === 'gone'
  }

  get hint() {
    if (this.phase === 1) return 'EAT HIS GRIME MINIONS'
    if (this.phase === 2)
      return this.state === 'reformed' ? 'HE RE-FORMED!' : 'SWALLOW THE DROPS'
    if (this.defeated) return ''
    return this.caught
      ? 'CARRY HIM DOWN THE DRAIN'
      : 'CATCH HIM IN THE GIANT BUBBLE'
  }

  get radius() {
    return this.phase === 3 ? SMALL_KING_R : KING_R
  }

  /** Is the King himself on the board (not split into drops)? */
  get whole() {
    return this.state !== 'split' && this.state !== 'gone'
  }

  update(host: BossHost, bubbles: BossBody[]) {
    this.t++
    if (this.state === 'gone') return
    if (this.state === 'draining') {
      // Round and round and down.
      const k = Math.max(0, 1 - this.t / 120)
      this.x = host.drain.x + Math.cos(this.t / 5) * 24 * k
      this.y = host.drain.y + Math.sin(this.t / 5) * 24 * k
      if (this.t > 120) {
        this.state = 'gone'
        for (const b of bubbles) host.giant(b, false)
      }
      return
    }
    if (this.phase === 1) this.guarded(host, bubbles)
    else if (this.phase === 2) this.split(host)
    else this.giant(host, bubbles)
    if (this.whole && this.phase !== 3)
      for (const b of bubbles) if (b.alive) this.touch(host, b)
  }

  private guarded(host: BossHost, bubbles: BossBody[]) {
    if (!this.started) {
      this.started = true
      for (let i = 0; i < MINIONS; i++) {
        const a = (i / MINIONS) * Math.PI * 2
        host.spawn('minion', {
          x: this.x + Math.cos(a) * 70,
          y: this.y + Math.sin(a) * 52,
        })
      }
    }
    this.x = FOUNTAIN.cx + Math.sin(this.t / 60) * 6
    this.y = FOUNTAIN.cy + Math.cos(this.t / 45) * 4
    this.updateJets(host, bubbles)
    if (host.living('minion').length === 0) {
      this.phase = 2
      this.state = 'split'
      this.t = 0
      this.jets = []
      host.score(4_000, { x: this.x, y: this.y - 30 })
      host.sound('level')
      this.burst(host, DROPS)
    }
  }

  /** The fountain's jets: two light on the rim, then blast toward the middle. */
  private updateJets(host: BossHost, bubbles: BossBody[]) {
    if (--this.jetTimer <= 0) {
      this.jetTimer = JET_EVERY
      const a = host.rng() * Math.PI * 2
      this.jets = [
        { a, t: 0 },
        { a: a + Math.PI, t: 0 },
      ]
      host.sound('warn')
    }
    for (const jet of this.jets) {
      jet.t++
      if (jet.t < JET_TELL || jet.t > JET_TELL + JET_BLAST) continue
      // Blowing in from the rim toward the far side.
      const dir = jet.a + Math.PI
      for (const b of bubbles) {
        if (!b.alive) continue
        const from = this.jetAt(jet)
        const ang = Math.atan2(b.y - from.y, b.x - from.x)
        let off = ang - dir
        while (off > Math.PI) off -= Math.PI * 2
        while (off < -Math.PI) off += Math.PI * 2
        if (Math.abs(off) > JET_CONE) continue
        b.vx += Math.cos(dir) * JET_PUSH
        b.vy += Math.sin(dir) * JET_PUSH
      }
    }
    this.jets = this.jets.filter((j) => j.t <= JET_TELL + JET_BLAST)
  }

  /** Where a jet sits on the fountain's rim. */
  jetAt(jet: Jet): Point {
    return {
      x: FOUNTAIN.cx + Math.cos(jet.a) * (FOUNTAIN.rx - 6),
      y: FOUNTAIN.cy + Math.sin(jet.a) * (FOUNTAIN.ry - 6),
    }
  }

  private burst(host: BossHost, count: number) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + host.rng()
      host.spawn('drop', {
        x: this.x + Math.cos(a) * 50,
        y: this.y + Math.sin(a) * 40,
      })
    }
    this.drops = count
    host.sound('boom')
  }

  private split(host: BossHost) {
    if (this.state === 'reformed') {
      // Whole again for a moment, then he bursts back into drops.
      if (this.t > 120) {
        this.state = 'split'
        this.t = 0
        this.burst(host, this.drops)
      }
      return
    }
    const drops = host.living('drop')
    if (drops.length === 0) {
      this.phase = 3
      this.state = 'giant'
      this.t = 0
      this.x = FOUNTAIN.cx + 90
      this.y = FOUNTAIN.cy - 40
      host.score(4_000, { x: FOUNTAIN.cx, y: FOUNTAIN.cy - 40 })
      host.sound('level')
      return
    }
    this.drops = drops.length
    const cx = drops.reduce((s, d) => s + d.x, 0) / drops.length
    const cy = drops.reduce((s, d) => s + d.y, 0) / drops.length
    this.x = cx
    this.y = cy
    const spread = Math.max(...drops.map((d) => Math.hypot(d.x - cx, d.y - cy)))
    this.gathered =
      drops.length > 1 && spread < REFORM_SPREAD ? this.gathered + 1 : 0
    if (this.gathered > REFORM_TICKS) {
      host.clear('drop')
      this.state = 'reformed'
      this.t = 0
      this.gathered = 0
      host.sound('warn')
    }
  }

  private giant(host: BossHost, bubbles: BossBody[]) {
    for (const b of bubbles) if (b.alive) host.giant(b, true)
    const holder = this.caught ? bubbles.find((o) => o.alive) : null
    if (holder) {
      // Caught inside the giant bubble, kicking: carry him over the drain.
      this.x = holder.x + Math.sin(this.t / 5) * 6
      this.y = holder.y + Math.cos(this.t / 7) * 5
      if (this.t % 30 === 0) {
        const a = host.rng() * Math.PI * 2
        holder.vx += Math.cos(a) * 1.6
        holder.vy += Math.sin(a) * 1.6
      }
      if (Math.hypot(holder.x - host.drain.x, holder.y - host.drain.y) < 16) {
        this.state = 'draining'
        this.t = 0
        host.sound('extra')
        host.score(6_000, { x: host.drain.x, y: host.drain.y - 30 })
      }
      return
    }
    // Loose, he scurries away from the giant bubble.
    const b = bubbles.find((o) => o.alive)
    if (!b) return
    const d = Math.hypot(this.x - b.x, this.y - b.y) || 1
    this.vx = ((this.x - b.x) / d) * 0.7
    this.vy = ((this.y - b.y) / d) * 0.7
    this.x += this.vx
    this.y += this.vy
    host.keepIn(this, SMALL_KING_R)
    if (d < host.radiusOf(b) + SMALL_KING_R * 0.5) {
      this.caught = true
      this.t = 0
      host.sound('pop')
    }
  }

  private touch(host: BossHost, b: BossBody) {
    const r = host.radiusOf(b)
    const dx = b.x - this.x
    const dy = b.y - this.y
    const d = Math.hypot(dx, dy) || 1
    if (d > this.radius + r) return
    if (b.invuln <= 0) host.hurt(b, { x: this.x, y: this.y }, 'hit')
    b.vx = (dx / d) * 2.6
    b.vy = (dy / d) * 2.6
    b.x = this.x + (dx / d) * (this.radius + r + 1)
    b.y = this.y + (dy / d) * (this.radius + r + 1)
  }

  threats(): Point[] {
    const out: Point[] = []
    if (this.whole && this.phase !== 3 && !this.defeated)
      out.push({ x: this.x, y: this.y })
    return out
  }

  goal(b: BossBody, r: number, host: BossHost): Point | null {
    if (this.phase === 1) return nearest(b, host.living('minion'))
    if (this.phase === 2) return nearest(b, host.living('drop'))
    if (this.defeated) return null
    return this.caught ? host.drain : { x: this.x, y: this.y }
  }

  // --- art ----------------------------------------------------------------------------------

  render(g: CanvasRenderingContext2D, tick: number) {
    if (this.state === 'gone') return
    for (const jet of this.jets) this.renderJet(g, jet, tick)
    if (!this.whole) return
    const r =
      this.radius *
      (this.state === 'draining' ? Math.max(0.1, 1 - this.t / 120) : 1)
    const x = this.x
    const y = this.y
    if (this.phase === 1) glow(g, x, y, r + 26, RAMPS.leaf[2], 0.25)
    // A wobbling heap of grime with a crown.
    const wob = Math.sin(tick / 8) * 0.06
    g.save()
    g.translate(x, y)
    g.scale(1 + wob, 1 - wob)
    const body = [
      mix(RAMPS.earth[1], RAMPS.leaf[1], 0.4),
      mix(RAMPS.earth[2], RAMPS.leaf[2], 0.4),
      mix(RAMPS.earth[3], RAMPS.leaf[2], 0.3),
      RAMPS.leaf[3],
      RAMPS.cream[3],
    ] as const
    shadedOrb(g, 0, 0, r, body)
    for (let i = 0; i < 6; i++) {
      const a = i * 1.1 + tick / 40
      g.fillStyle = rgba(RAMPS.earth[0], 0.6)
      g.beginPath()
      g.arc(
        Math.cos(a) * r * 0.6,
        Math.sin(a) * r * 0.5 + 2,
        r * 0.12,
        0,
        Math.PI * 2,
      )
      g.fill()
    }
    // Drips off the bottom.
    g.fillStyle = body[1]
    for (let i = -2; i <= 2; i++)
      g.fillRect(
        Math.round(i * r * 0.3) - 1,
        Math.round(r * 0.85),
        3,
        4 + ((tick / 6 + i) % 3),
      )
    // Face: grumpy, then worried once he is small.
    const ey = -r * 0.15
    for (const k of [-1, 1]) {
      g.fillStyle = '#ffffff'
      g.fillRect(Math.round(k * r * 0.35) - 3, Math.round(ey) - 3, 6, 6)
      g.fillStyle = INK
      g.fillRect(Math.round(k * r * 0.35) - 1, Math.round(ey) - 1, 3, 3)
      if (this.phase < 3)
        g.fillRect(
          Math.round(k * r * 0.35) - 4,
          Math.round(ey) - 6 + (k > 0 ? 1 : 0),
          8,
          2,
        )
    }
    g.fillStyle = INK
    if (this.phase < 3)
      g.fillRect(
        -Math.round(r * 0.3),
        Math.round(r * 0.3),
        Math.round(r * 0.6),
        3,
      )
    else {
      g.beginPath()
      g.arc(0, r * 0.35, r * 0.15, 0, Math.PI * 2)
      g.fill()
    }
    // The crown.
    const cy = -r - 2
    g.fillStyle = RAMPS.gold[3]
    g.fillRect(-r * 0.5, cy, r, 6)
    for (let i = 0; i < 3; i++)
      g.fillRect(Math.round(-r * 0.5 + i * r * 0.4), Math.round(cy - 6), 4, 7)
    g.fillStyle = RAMPS.pink[3]
    g.fillRect(-2, Math.round(cy + 1), 4, 3)
    g.restore()
  }

  private renderJet(g: CanvasRenderingContext2D, jet: Jet, tick: number) {
    const at = this.jetAt(jet)
    if (jet.t < JET_TELL) {
      // The jet lights on the rim first.
      if (Math.floor(tick / 6) % 2 === 0)
        glow(g, at.x, at.y, 18, RAMPS.sky[3], 0.7)
      shadedOrb(g, at.x, at.y, 5, RAMPS.sky)
      return
    }
    const dir = jet.a + Math.PI
    g.save()
    g.strokeStyle = rgba(RAMPS.sky[4], 0.7)
    g.lineWidth = 3
    for (let i = 0; i < 5; i++) {
      const spread = (i - 2) * 0.12
      const len = 60 + ((tick * 4 + i * 23) % 90)
      g.beginPath()
      g.moveTo(at.x, at.y)
      g.lineTo(
        at.x + Math.cos(dir + spread) * len,
        at.y + Math.sin(dir + spread) * len,
      )
      g.stroke()
    }
    g.restore()
  }
}
