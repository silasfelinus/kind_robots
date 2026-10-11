// /utils/arcade/sinkSuds/mossback.ts
//
// Mossback: Sink Suds' second boss (conductor kr-arcade/t-045), an old giant snail covered in
// algae, living in the fish tank.
//
//   Phase 1  it crawls round the glass shedding algae puffs. Pop all six to drive it off the glass.
//   Phase 2  it hides in its shell and rolls along the gravel, bouncing wall to wall; the tank's
//            buoyancy lets the bubble float up out of its way. Five bounces and it is dazed.
//   Phase 3  the shell opens: scrub its mossy back at full size until it shines. Now and then it
//            shakes and tucks in; touch it tucked and it bonks.

import { INK, RAMPS, mix, rgba, shadedOrb } from '../snes'
import type { Point } from './basins'
import type { BossBody, BossHost, SudsBoss } from './boss'
import { nearest } from './boss'

export const SHELL_R = 30
/** Algae puffs it sheds in phase 1. */
export const MOSS_PUFFS = 8
export const ROLL_BOUNCES = 6
const CRAWL_SPEED = 0.6
const SHED_EVERY = 160
const ROLL_SPEED = 2.8
/** Moss scrubbed off per tick of a full bubble on its back. */
export const MOSS_SCRUB = 0.003
const TUCK_EVERY = 60 * 6
const SHAKE_TICKS = 45
const TUCK_TICKS = 70
const FLOOR = 312
/** The crawl round the glass, inset from the tank walls. */
const LOOP: readonly Point[] = [
  { x: 64, y: 90 },
  { x: 356, y: 90 },
  { x: 356, y: 280 },
  { x: 64, y: 280 },
]

type State =
  | 'crawl'
  | 'drop'
  | 'roll'
  | 'dazed'
  | 'open'
  | 'shake'
  | 'tuck'
  | 'shine'
  | 'gone'

export class Mossback implements SudsBoss {
  readonly name = 'MOSSBACK'
  readonly maxHp = 3
  phase: 1 | 2 | 3 = 1
  state: State = 'crawl'
  t = 0
  x = LOOP[0]!.x
  y = LOOP[0]!.y
  vx = 0
  /** Moss left on its back, 1..0 (phase 3). */
  moss = 1
  shed = 0
  bounces = 0
  private leg = 1
  private shedTimer = 90
  private tuckTimer = TUCK_EVERY
  private spin = 0
  private scrubbing = 0

  get hp() {
    return this.defeated ? 0 : 4 - this.phase
  }

  get defeated() {
    return this.state === 'shine' || this.state === 'gone'
  }

  get done() {
    return this.state === 'gone'
  }

  get hint() {
    if (this.phase === 1)
      return `POP THE ALGAE PUFFS ${Math.min(this.shed, MOSS_PUFFS)}/${MOSS_PUFFS}`
    if (this.phase === 2) return 'FLOAT UP OUT OF ITS WAY'
    if (this.defeated) return ''
    return `FULL SIZE: SCRUB ITS BACK ${Math.round((1 - this.moss) * 100)}%`
  }

  /** Is its shell shut (rolling, dazed, tucked): every touch bonks or shoves. */
  get armoured() {
    return this.state !== 'open' && this.state !== 'shake'
  }

  update(host: BossHost, bubbles: BossBody[]) {
    this.t++
    if (this.state === 'gone') return
    if (this.state === 'shine') {
      if (this.t > 150) this.state = 'gone'
      return
    }
    switch (this.phase) {
      case 1:
        this.crawl(host)
        break
      case 2:
        this.roll(host)
        break
      default:
        this.open(host)
    }
    for (const b of bubbles) if (b.alive) this.touch(host, b)
  }

  private crawl(host: BossHost) {
    const to = LOOP[this.leg]!
    const d = Math.hypot(to.x - this.x, to.y - this.y)
    if (d < CRAWL_SPEED) {
      this.leg = (this.leg + 1) % LOOP.length
    } else {
      this.x += ((to.x - this.x) / d) * CRAWL_SPEED
      this.y += ((to.y - this.y) / d) * CRAWL_SPEED
    }
    const alive = host.living('algae').length
    if (this.shed < MOSS_PUFFS && --this.shedTimer <= 0 && alive < 4) {
      this.shedTimer = SHED_EVERY
      this.shed++
      // A puff floats off its shell toward the middle of the tank.
      const cx = 210 + (this.x - 210) * 0.6
      const cy = 190 + (this.y - 190) * 0.6
      host.spawn('algae', { x: cx, y: cy })
      host.sound('pop')
    }
    if (this.shed >= MOSS_PUFFS && alive === 0) {
      this.phase = 2
      this.state = 'drop'
      this.t = 0
      host.sound('level')
      host.score(3_000, { x: this.x, y: this.y - 30 })
      host.dropCrumbs({ x: 210, y: 180 }, 10)
    }
  }

  private roll(host: BossHost) {
    if (this.state === 'drop') {
      // Into its shell and down to the gravel.
      this.y = Math.min(FLOOR - SHELL_R, this.y + 2)
      if (this.y >= FLOOR - SHELL_R) {
        this.state = 'roll'
        this.vx = this.x < 210 ? ROLL_SPEED : -ROLL_SPEED
        host.sound('warn')
      }
      return
    }
    if (this.state === 'dazed') {
      if (this.t > 100) {
        this.phase = 3
        this.state = 'open'
        this.t = 0
        host.sound('level')
        host.score(3_000, { x: this.x, y: this.y - 30 })
        host.dropCrumbs({ x: 210, y: 160 }, 12)
      }
      return
    }
    this.x += this.vx
    this.spin += this.vx / SHELL_R
    if (this.x < 28 + SHELL_R || this.x > 392 - SHELL_R) {
      this.x = Math.max(28 + SHELL_R, Math.min(392 - SHELL_R, this.x))
      this.vx = -this.vx
      this.bounces++
      host.sound('boom')
      host.soil({ x: this.x, y: this.y }, 26)
      if (this.bounces >= ROLL_BOUNCES) {
        this.state = 'dazed'
        this.t = 0
      }
    }
  }

  private open(host: BossHost) {
    if (this.state === 'shake') {
      if (this.t > SHAKE_TICKS) {
        this.state = 'tuck'
        this.t = 0
        host.sound('warn')
      }
      return
    }
    if (this.state === 'tuck') {
      if (this.t > TUCK_TICKS) {
        this.state = 'open'
        this.t = 0
        this.tuckTimer = TUCK_EVERY
      }
      return
    }
    // Inching along the gravel, back and forth.
    this.y = FLOOR - SHELL_R
    if (!this.vx) this.vx = 0.35
    this.x += this.vx
    if (this.x < 70 || this.x > 350) this.vx = -this.vx
    if (--this.tuckTimer <= 0) {
      this.state = 'shake'
      this.t = 0
    }
  }

  private touch(host: BossHost, b: BossBody) {
    const r = host.radiusOf(b)
    const dx = b.x - this.x
    const dy = b.y - this.y
    const d = Math.hypot(dx, dy) || 1
    if (d > SHELL_R + r) return
    const shove = (k = 2.4) => {
      b.vx = (dx / d) * k
      b.vy = (dy / d) * k
      b.x = this.x + (dx / d) * (SHELL_R + r + 1)
      b.y = this.y + (dy / d) * (SHELL_R + r + 1)
    }
    if (this.phase === 3 && !this.armoured && b.stage >= 5 && !this.defeated) {
      // Scrubbing the mossy back.
      this.moss -= MOSS_SCRUB
      this.scrubbing = 8
      if (this.t % 12 === 0) host.sound('blip')
      if (this.moss <= 0) {
        this.moss = 0
        this.state = 'shine'
        this.t = 0
        host.sound('level')
      }
      b.vx *= 0.9
      b.vy *= 0.9
      return
    }
    if (this.phase === 3 && !this.armoured) {
      shove(1.6)
      return
    }
    if (b.invuln <= 0) host.hurt(b, { x: this.x, y: this.y }, 'hit')
    shove()
  }

  threats(): Point[] {
    if (this.defeated) return []
    if (this.phase === 3 && !this.armoured) return []
    const out: Point[] = [{ x: this.x, y: this.y }]
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 3)
      out.push({
        x: this.x + Math.cos(a) * SHELL_R * 0.8,
        y: this.y + Math.sin(a) * SHELL_R * 0.8,
      })
    if (this.state === 'roll') out.push({ x: this.x + this.vx * 18, y: this.y })
    return out
  }

  goal(b: BossBody, r: number, host: BossHost): Point | null {
    if (this.phase === 1) return nearest(b, host.living('algae'))
    if (this.phase === 3 && b.stage >= 5 && this.state === 'open')
      return { x: this.x, y: this.y - SHELL_R - r + 6 }
    return null
  }

  // --- art ----------------------------------------------------------------------------------

  render(g: CanvasRenderingContext2D, tick: number) {
    if (this.state === 'gone') return
    const x = this.x
    const y = this.y
    const shut = this.phase === 2 || this.state === 'tuck'
    if (this.scrubbing > 0) this.scrubbing--
    g.save()
    // The foot and head, unless it is shut in its shell.
    if (!shut) {
      const shake = this.state === 'shake' ? Math.sin(tick) * 2 : 0
      const face = this.phase === 3 ? (this.vx >= 0 ? 1 : -1) : 1
      g.fillStyle = mix(RAMPS.leaf[1], RAMPS.earth[2], 0.5)
      g.beginPath()
      g.ellipse(
        x + face * 8 + shake,
        y + SHELL_R - 6,
        SHELL_R + 14,
        9,
        0,
        0,
        Math.PI * 2,
      )
      g.fill()
      g.fillStyle = mix(RAMPS.leaf[2], RAMPS.cream[2], 0.4)
      g.beginPath()
      g.ellipse(
        x + face * (SHELL_R + 10) + shake,
        y + 6,
        12,
        14,
        0,
        0,
        Math.PI * 2,
      )
      g.fill()
      // Eye stalks with sleepy old eyes.
      for (const k of [-1, 1]) {
        const ex = x + face * (SHELL_R + 12 + k * 5) + shake
        g.strokeStyle = mix(RAMPS.leaf[1], RAMPS.cream[2], 0.4)
        g.lineWidth = 3
        g.beginPath()
        g.moveTo(ex, y - 2)
        g.lineTo(ex + face * 3, y - 18)
        g.stroke()
        g.lineWidth = 1
        shadedOrb(g, ex + face * 3, y - 20, 4, RAMPS.cream)
        g.fillStyle = INK
        g.fillRect(
          Math.round(ex + face * 4) - 1,
          y - 21,
          2,
          this.state === 'shine' ? 1 : 3,
        )
      }
    }
    // The shell: a big spiral, mossy until it is scrubbed.
    const spin = this.phase === 2 ? this.spin : 0
    shadedOrb(g, x, y, SHELL_R, RAMPS.earth)
    g.strokeStyle = RAMPS.earth[0]
    g.lineWidth = 2
    g.beginPath()
    for (let i = 0; i <= 40; i++) {
      const a = spin + i * 0.4
      const rr = (SHELL_R - 4) * (1 - i / 44)
      const px = x + Math.cos(a) * rr
      const py = y + Math.sin(a) * rr
      if (i === 0) g.moveTo(px, py)
      else g.lineTo(px, py)
    }
    g.stroke()
    g.lineWidth = 1
    const moss = this.phase < 3 ? 1 : this.moss
    if (moss > 0) {
      for (let i = 0; i < 14; i++) {
        const a = spin + i * 2.3
        const rr = ((i * 37) % 23) + 4
        g.fillStyle = rgba(
          i % 2 ? RAMPS.leaf[2] : RAMPS.leaf[1],
          0.85 * Math.min(1, moss * 1.4),
        )
        g.beginPath()
        g.arc(
          x + Math.cos(a) * rr,
          y - Math.abs(Math.sin(a)) * rr * 0.9,
          3 + (i % 3) * 2 * moss,
          0,
          Math.PI * 2,
        )
        g.fill()
      }
    }
    if (this.scrubbing > 0 || this.state === 'shine') {
      g.fillStyle = '#ffffff'
      for (let i = 0; i < 5; i++) {
        const a = tick / 7 + i * 1.3
        const sx = Math.round(x + Math.cos(a) * (SHELL_R - 6))
        const sy = Math.round(y + Math.sin(a) * (SHELL_R - 10))
        g.fillRect(sx - 1, sy, 3, 1)
        g.fillRect(sx, sy - 1, 1, 3)
      }
    }
    if (this.state === 'dazed') {
      for (let i = 0; i < 3; i++) {
        const a = tick / 9 + (i * Math.PI * 2) / 3
        g.fillStyle = RAMPS.gold[4]
        g.fillRect(
          Math.round(x + Math.cos(a) * 18),
          Math.round(y - SHELL_R - 6 + Math.sin(a) * 4),
          2,
          2,
        )
      }
    }
    g.restore()
  }
}
