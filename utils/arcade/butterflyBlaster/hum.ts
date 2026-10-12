// /utils/arcade/butterflyBlaster/hum.ts
//
// Boss 1, The Hum (conductor kr-arcade/t-056, CABINETS.md section 6 "Moon 1"): a mega-swarm the
// size of a cloud that holds shapes, a ring, a spiral and a grinning face, turning slowly.
//
//   Phase 1  its outer orbit of mosquitoes blocks sparkles. Shoot gaps in it to reach the core.
//            Gaps fill back in, one mosquito at a time.
//   Phase 2  it splits into four sub-swarms that circle whichever hut the butterfly is nearest,
//            and take turns diving at its window. Pop all four.
//   Phase 3  the core, a fat swarm-in-training, rests, then bolts in straight dashes on a
//            rising-buzz tell. Sparkles only daze it, holding it still. Lasso it.
//
// When it is netted it bonks off, grumbling, and the sky is quiet.

import { drawText } from '../font'
import { INK, RAMPS, drawSprite, glow, rgba, shadedOrb } from '../snes'
import { GNAT, SICK, flapFrame } from './art'
import { GROUND, SKY, W, clamp, toward, wrapDist } from './sky'
import type { Point } from './sky'
import type { Hut } from './village'
import { WINDOW_Y, hutLit } from './village'

export type BossSound = 'warn' | 'boom' | 'pop' | 'blip' | 'level' | 'extra'

/** What a boss needs from the game. */
export interface BossHost {
  rng(): number
  /** The butterfly, while it is in the sky. */
  ship(): Point | null
  readonly huts: readonly Hut[]
  bite(hut: Hut): void
  score(points: number, at: Point, label?: string): void
  sound(name: BossSound): void
  burst(at: Point, count: number): void
  /** A lone mosquito set loose in the sky. */
  spawn(at: Point): void
}

/** What the game asks of any boss. */
export interface Boss {
  readonly name: string
  /** 0..1 of the fight left, for the HUD bar. */
  readonly health: number
  /** What to do now, under the bar. */
  readonly hint: string
  readonly defeated: boolean
  /** Gone: the game moves on. */
  readonly done: boolean
  update(host: BossHost): void
  /** A sparkle reached this point: true if the boss took it. */
  shot(at: Point, host: BossHost): boolean
  /** A lasso closed; `inside` asks whether a point is in it. True if it caught the boss. */
  lasso(inside: (p: Point) => boolean, host: BossHost): boolean
  /** Does the boss touch a body of radius r here? */
  touches(at: Point, r: number): boolean
  render(g: CanvasRenderingContext2D, tick: number): void
  /** For the attract pilot: what to keep clear of, what to shoot, and what to lasso. */
  threats(): { at: Point; r: number }[]
  targets(): Point[]
  lassoMark(): Point | null
}

type Shape = 'ring' | 'spiral' | 'face'
const SHAPES: readonly Shape[] = ['ring', 'spiral', 'face']
export const HUM = {
  motes: 36,
  ringR: 62,
  coreR: 16,
  /** Core hits to break the shell. */
  coreHp: 8,
  shapeTicks: 360,
  regrow: 80,
  subs: 4,
  subR: 20,
  subHp: 4,
  diveEvery: 200,
  /** Phase 3: the core's rest, tell and dash. */
  rest: 130,
  tell: 50,
  dash: 46,
  dashSpeed: 5.2,
  /** Each dash after the first is this much faster, up to dashMax, and rests less. */
  dashGain: 0.25,
  dashMax: 7.5,
  restMin: 70,
  daze: 90,
  fatR: 18,
} as const

type Mote = { x: number; y: number; alive: boolean }
type Sub = {
  x: number
  y: number
  hp: number
  angle: number
  /** Ticks into a dive at the window (0: circling). */
  dive: number
  seed: number
}

/** Where shape slot i sits (unrotated), for `count` slots. */
export function shapeSlot(shape: Shape, i: number, count: number): Point {
  const t = i / count
  if (shape === 'ring') {
    const a = t * Math.PI * 2
    return { x: Math.cos(a) * HUM.ringR, y: Math.sin(a) * HUM.ringR }
  }
  if (shape === 'spiral') {
    const a = t * Math.PI * 4
    const r = 26 + t * 46
    return { x: Math.cos(a) * r, y: Math.sin(a) * r }
  }
  // The grinning face: a head outline, two eyes and a wide grin.
  if (i < 22) {
    const a = (i / 22) * Math.PI * 2
    return { x: Math.cos(a) * HUM.ringR, y: Math.sin(a) * HUM.ringR }
  }
  if (i < 28) {
    const k = i - 22
    const side = k < 3 ? -1 : 1
    return { x: side * 22 + ((k % 3) - 1) * 5, y: -18 + (k % 3 === 1 ? -4 : 0) }
  }
  const k = (i - 28) / 7
  const a = Math.PI * (0.15 + k * 0.7)
  return { x: Math.cos(a) * 36, y: 8 + Math.sin(a) * 22 }
}

export class Hum implements Boss {
  readonly name = 'THE HUM'
  phase: 1 | 2 | 3 = 1
  x = W / 2
  y = 120
  vx = 0
  vy = 0
  coreHp: number = HUM.coreHp
  motes: Mote[] = []
  subs: Sub[] = []
  /** Phase 3's beat: resting, telling, dashing. */
  mode: 'rest' | 'tell' | 'dash' = 'rest'
  modeTicks: number = HUM.rest
  heading = 0
  dashes = 0
  dazed = 0
  flash = 0
  t = 0
  shapeIndex = 0
  spin = 0
  /** The hut the sub-swarms circle. */
  target: Hut | null = null
  exit = 0
  defeated = false

  constructor() {
    for (let i = 0; i < HUM.motes; i++) {
      const s = shapeSlot('ring', i, HUM.motes)
      this.motes.push({ x: this.x + s.x, y: this.y + s.y, alive: true })
    }
  }

  get done() {
    return this.defeated && this.exit > 150
  }

  get health() {
    if (this.defeated) return 0
    if (this.phase === 1) return 2 / 3 + this.coreHp / HUM.coreHp / 3
    if (this.phase === 2) {
      const hp = this.subs.reduce((n, s) => n + Math.max(0, s.hp), 0)
      return 1 / 3 + hp / (HUM.subs * HUM.subHp) / 3
    }
    return 1 / 3
  }

  get hint() {
    if (this.defeated) return 'NETTED!'
    if (this.phase === 1) return 'SHOOT GAPS IN ITS ORBIT, THEN THE CORE'
    if (this.phase === 2) return 'POP THE FOUR SWARMS AROUND THE HUT'
    return 'SPARKLES DAZE IT: LASSO THE CORE!'
  }

  private get shape(): Shape {
    return SHAPES[this.shapeIndex % SHAPES.length]!
  }

  update(host: BossHost) {
    this.t++
    if (this.flash > 0) this.flash--
    if (this.defeated) {
      this.exit++
      this.y -= 1.2
      return
    }
    const ship = host.ship()
    if (this.phase === 1) this.updateShell(host, ship)
    else if (this.phase === 2) this.updateSubs(host, ship)
    else this.updateCore(host, ship)
  }

  private updateShell(host: BossHost, ship: Point | null) {
    // Drift about the upper sky, leaning toward the butterfly.
    const wantX = W / 2 + Math.sin(this.t / 170) * 150
    const wantY = 120 + Math.sin(this.t / 110) * 40
    const lean = ship ? toward(this, ship) : { x: 0, y: 0 }
    this.vx += (wantX + lean.x * 0.15 - this.x) * 0.002 - this.vx * 0.02
    this.vy += (wantY + lean.y * 0.1 - this.y) * 0.002 - this.vy * 0.02
    this.x += this.vx
    this.y = clamp(this.y + this.vy, 80, SKY - 110)
    this.spin += 0.012
    if (this.t % HUM.shapeTicks === 0) {
      this.shapeIndex++
      host.sound('blip')
    }
    const c = Math.cos(this.spin)
    const s = Math.sin(this.spin)
    this.motes.forEach((m, i) => {
      const slot = shapeSlot(this.shape, i, HUM.motes)
      const rx = this.shape === 'face' ? slot.x : slot.x * c - slot.y * s
      const ry = this.shape === 'face' ? slot.y : slot.x * s + slot.y * c
      m.x += (this.x + rx - m.x) * 0.08
      m.y += (this.y + ry - m.y) * 0.08
    })
    if (this.t % HUM.regrow === 0) {
      const gap = this.motes.find((m) => !m.alive)
      if (gap) gap.alive = true
    }
  }

  private nearestHut(host: BossHost, ship: Point | null): Hut | null {
    const lit = host.huts.filter(hutLit)
    const pool = lit.length ? lit : host.huts
    let best: Hut | null = null
    let d = Infinity
    for (const h of pool) {
      const dx = Math.abs((ship?.x ?? W / 2) - h.x)
      if (dx < d) {
        d = dx
        best = h
      }
    }
    return best
  }

  private updateSubs(host: BossHost, ship: Point | null) {
    this.target = this.nearestHut(host, ship)
    const hut = this.target
    // The core sulks up high while its swarms work.
    this.x += (W / 2 - this.x) * 0.02
    this.y += (50 - this.y) * 0.02
    const live = this.subs.filter((s) => s.hp > 0)
    if (this.t % HUM.diveEvery === 0 && live.length) {
      const diver = live[this.t % live.length]!
      if (!diver.dive) {
        diver.dive = 1
        host.sound('warn')
      }
    }
    for (const sub of live) {
      sub.angle += 0.03
      const cx = hut?.x ?? W / 2
      let tx = cx + Math.cos(sub.angle) * 54
      let ty = GROUND - 90 + Math.sin(sub.angle) * 34
      if (sub.dive) {
        sub.dive++
        tx = cx
        ty = WINDOW_Y - 4
        if (
          hut &&
          sub.dive > 20 &&
          Math.abs(sub.y - ty) < 12 &&
          Math.abs(sub.x - tx) < 14
        ) {
          if (hutLit(hut)) host.bite(hut)
          sub.dive = 0
          sub.y -= 30
        } else if (sub.dive > 160) {
          sub.dive = 0
        }
      }
      const k = sub.dive ? 0.05 : 0.04
      sub.x += (tx - sub.x) * k
      sub.y += (ty - sub.y) * k
    }
  }

  private updateCore(host: BossHost, ship: Point | null) {
    if (this.dazed > 0) {
      this.dazed--
      this.vx *= 0.9
      this.vy *= 0.9
    } else if (--this.modeTicks <= 0) {
      if (this.mode === 'rest') {
        this.mode = 'tell'
        this.modeTicks = HUM.tell
        const d = ship ? toward(this, ship) : { x: 1, y: 0 }
        this.heading = Math.atan2(d.y, d.x)
        host.sound('warn')
      } else if (this.mode === 'tell') {
        this.mode = 'dash'
        this.modeTicks = HUM.dash
        this.vx = Math.cos(this.heading) * this.dashSpeed
        this.vy = Math.sin(this.heading) * this.dashSpeed
      } else {
        // Every dash it grows bolder, and shakes a mosquito loose.
        this.dashes++
        this.mode = 'rest'
        this.modeTicks = Math.max(HUM.restMin, HUM.rest - this.dashes * 8)
        host.spawn({ x: this.x, y: this.y })
      }
    }
    if (this.mode === 'rest' && !this.dazed) {
      this.vx += Math.cos(this.t / 40) * 0.02
      this.vy += Math.sin(this.t / 53) * 0.02
      this.vx *= 0.96
      this.vy *= 0.96
    } else if (this.mode === 'tell') {
      this.vx *= 0.8
      this.vy *= 0.8
    }
    this.x += this.vx
    this.y += this.vy
    if (this.x < 0) this.x += W
    else if (this.x >= W) this.x -= W
    if (this.y < 24) {
      this.y = 24
      this.vy = Math.abs(this.vy)
    } else if (this.y > GROUND - 40) {
      this.y = GROUND - 40
      this.vy = -Math.abs(this.vy)
    }
  }

  private split(host: BossHost) {
    this.phase = 2
    this.subs = Array.from({ length: HUM.subs }, (_, i) => ({
      x: this.x,
      y: this.y,
      hp: HUM.subHp,
      angle: (i / HUM.subs) * Math.PI * 2,
      dive: 0,
      seed: i * 97,
    }))
    for (const m of this.motes) m.alive = false
    host.sound('boom')
    host.burst(this, 30)
  }

  shot(at: Point, host: BossHost): boolean {
    if (this.defeated) return false
    if (this.phase === 1) {
      const mote = this.motes.find((m) => m.alive && wrapDist(m, at) < 7)
      if (mote) {
        mote.alive = false
        host.score(10, mote)
        host.sound('pop')
        return true
      }
      if (wrapDist(this, at) < HUM.coreR) {
        this.coreHp--
        this.flash = 10
        host.score(100, at)
        host.sound('pop')
        if (this.coreHp <= 0) this.split(host)
        return true
      }
      return false
    }
    if (this.phase === 2) {
      const sub = this.subs.find((s) => s.hp > 0 && wrapDist(s, at) < HUM.subR)
      if (!sub) return false
      sub.hp--
      host.sound('pop')
      if (sub.hp <= 0) {
        host.score(300, sub, 'POPPED')
        host.burst(sub, 14)
        if (this.subs.every((s) => s.hp <= 0)) {
          this.phase = 3
          this.mode = 'rest'
          this.modeTicks = HUM.rest
          this.vx = 0
          this.vy = 1
          host.sound('boom')
        }
      } else {
        host.score(50, at)
      }
      return true
    }
    if (wrapDist(this, at) < HUM.fatR) {
      // Sparkles bounce off the core, but they daze it.
      this.dazed = HUM.daze
      this.mode = 'rest'
      this.modeTicks = Math.max(this.modeTicks, 40)
      this.flash = 6
      host.sound('blip')
      return true
    }
    return false
  }

  lasso(inside: (p: Point) => boolean, host: BossHost): boolean {
    if (this.defeated) return false
    if (this.phase === 2) {
      // A loop round a sub-swarm nets it outright.
      let caught = false
      for (const sub of this.subs) {
        if (sub.hp > 0 && inside(sub)) {
          sub.hp = 0
          caught = true
          host.score(600, sub, 'NETTED')
        }
      }
      if (caught && this.subs.every((s) => s.hp <= 0)) {
        this.phase = 3
        this.mode = 'rest'
        this.modeTicks = HUM.rest
      }
      return caught
    }
    if (this.phase !== 3 || !inside(this)) return false
    this.defeated = true
    host.score(10_000, this, 'THE HUM IS NETTED')
    host.sound('extra')
    host.burst(this, 40)
    return true
  }

  touches(at: Point, r: number): boolean {
    if (this.defeated) return false
    if (this.phase === 1) {
      if (wrapDist(this, at) < HUM.coreR + r) return true
      return this.motes.some((m) => m.alive && wrapDist(m, at) < 5 + r)
    }
    if (this.phase === 2)
      return this.subs.some(
        (s) => s.hp > 0 && wrapDist(s, at) < HUM.subR * 0.7 + r,
      )
    return wrapDist(this, at) < HUM.fatR + r - 2
  }

  private get dashSpeed() {
    return Math.min(HUM.dashMax, HUM.dashSpeed + this.dashes * HUM.dashGain)
  }

  threats() {
    if (this.phase === 1)
      return [{ at: { x: this.x, y: this.y }, r: HUM.ringR + 6 }]
    if (this.phase === 2)
      return this.subs
        .filter((s) => s.hp > 0)
        .map((s) => ({ at: s, r: HUM.subR }))
    // At rest or dazed the core is something to lasso, not to run from.
    if (this.mode === 'rest' || this.dazed || this.defeated) return []
    return [{ at: { x: this.x, y: this.y }, r: HUM.fatR }]
  }

  targets(): Point[] {
    if (this.phase === 1) {
      // Gaps in the orbit facing the butterfly, else the motes.
      return [{ x: this.x, y: this.y }, ...this.motes.filter((m) => m.alive)]
    }
    if (this.phase === 2) return this.subs.filter((s) => s.hp > 0)
    return [{ x: this.x, y: this.y }]
  }

  lassoMark(): Point | null {
    const still = this.mode === 'rest' || this.dazed > 0
    return this.phase === 3 && !this.defeated && still
      ? { x: this.x, y: this.y }
      : null
  }

  render(g: CanvasRenderingContext2D, tick: number) {
    if (this.phase === 1 && !this.defeated) {
      glow(g, this.x, this.y, HUM.ringR + 26, SICK[2], 0.22)
      this.motes.forEach((m, i) => {
        if (m.alive) drawSprite(g, GNAT[flapFrame(tick + i)]!, m.x, m.y)
      })
    }
    if (this.phase === 2) {
      for (const sub of this.subs) {
        if (sub.hp <= 0) continue
        glow(g, sub.x, sub.y, 26, sub.dive ? RAMPS.ember[2] : SICK[2], 0.35)
        for (let i = 0; i < 6; i++) {
          const a = sub.seed + i * 1.05 + tick * 0.07
          drawSprite(
            g,
            GNAT[flapFrame(tick + i)]!,
            sub.x + Math.cos(a) * 12,
            sub.y + Math.sin(a * 1.3) * 9,
          )
        }
      }
    }
    this.renderCore(g, tick)
  }

  private renderCore(g: CanvasRenderingContext2D, tick: number) {
    const fat = this.phase === 3
    const r = fat ? HUM.fatR : this.phase === 2 ? 10 : HUM.coreR
    let x = this.x
    const y = this.y
    if (this.mode === 'tell' && fat) {
      x += Math.sin(tick * 1.7) * 2
      glow(
        g,
        x,
        y,
        40,
        RAMPS.ember[2],
        0.3 + 0.4 * (1 - this.modeTicks / HUM.tell),
      )
      g.save()
      g.strokeStyle = rgba(RAMPS.ember[3], 0.5)
      g.setLineDash([3, 5])
      g.beginPath()
      g.moveTo(x, y)
      g.lineTo(
        x + Math.cos(this.heading) * this.dashSpeed * HUM.dash,
        y + Math.sin(this.heading) * this.dashSpeed * HUM.dash,
      )
      g.stroke()
      g.restore()
    }
    glow(g, x, y, r * 2.2, SICK[3], 0.35)
    shadedOrb(
      g,
      x,
      y,
      r,
      this.flash
        ? RAMPS.ember
        : (['#0d1505', '#1a2e05', '#3f6212', '#65a30d', '#a3e635'] as const),
    )
    // Two big cross eyes and a pout.
    const e = r * 0.38
    for (const side of [-1, 1]) {
      g.fillStyle = '#ffffff'
      g.beginPath()
      g.arc(x + side * e, y - r * 0.2, r * 0.26, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = this.dazed ? RAMPS.gold[3] : RAMPS.ember[2]
      g.beginPath()
      g.arc(
        x + side * e + (this.dazed ? Math.sin(tick / 3) * 2 : 0),
        y - r * 0.16,
        r * 0.13,
        0,
        Math.PI * 2,
      )
      g.fill()
      g.fillStyle = INK
      g.fillRect(
        Math.round(x + side * e - r * 0.3),
        Math.round(y - r * 0.55 - side * 1),
        Math.round(r * 0.6),
        2,
      )
    }
    g.fillStyle = INK
    g.fillRect(
      Math.round(x - r * 0.25),
      Math.round(y + r * 0.35),
      Math.round(r * 0.5),
      2,
    )
    if (this.dazed) {
      for (let i = 0; i < 3; i++) {
        const a = tick / 8 + (i * Math.PI * 2) / 3
        g.fillStyle = RAMPS.gold[4]
        g.fillRect(
          Math.round(x + Math.cos(a) * (r + 5)),
          Math.round(y - r - 4 + Math.sin(a) * 3),
          2,
          2,
        )
      }
    }
    if (this.defeated) {
      drawText(g, 'BONK!', x, y - r - 16, {
        align: 'center',
        color: RAMPS.gold[4],
        outline: INK,
      })
    }
  }
}
