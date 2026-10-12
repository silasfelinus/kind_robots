// /utils/arcade/butterflyBlaster/queen.ts
//
// The finale, the Night Queen (conductor kr-arcade/t-057, CABINETS.md section 6 "Finale"): a giant
// mosquito matriarch, the cartoon queen of the swamp, all crown and pout.
//
//   Phase 1  she circles the sky dropping egg rafts on the water, and while her eggs are safe she
//            shrugs sparkles off. Sink a raft before it hatches into a swarm and she reels, dazed,
//            for a moment: sparkle her then.
//   Phase 2  her wings stay folded round her like a shield, and open only to fan gusts that push
//            every sparkle sideways: sparkle her while they are open, leading your aim into the wind.
//
// Each sparkle that lands makes her flinch for a few ticks, and a flinching Queen shrugs the next
// one off, so a fast trigger cannot melt her.
//   Phase 3  she dives at the village. AMI arrives with every ally (bats, dragonflies, swallows)
//            and they hold her still in turns; the ribbon runs sky-long, and one rainbow lasso
//            round her ends the season's last night.

import { drawText } from '../font'
import { INK, RAMPS, glow, rgba, shadedOrb } from '../snes'
import type { Boss, BossHost } from './hum'
import { GROUND, W, clamp, toward, wrapDist } from './sky'
import type { Point } from './sky'
import { POOL_SPOTS } from './nights'
import { WINDOW_Y, hutLit } from './village'

/** Rafts float on the standing water between the huts, where the pools lie. */
const RAFT_Y = GROUND + 3

function nearestPool(x: number): number {
  let best = POOL_SPOTS[0]!.x
  for (const p of POOL_SPOTS)
    if (Math.abs(p.x - x) < Math.abs(best - x)) best = p.x
  return best
}

export const QUEEN = {
  r: 24,
  hp: 24,
  /** Ticks a landed sparkle makes her flinch, shrugging off the next. */
  flinch: 12,
  /** Phase 1: a raft every so often, hatching unless sparkled; sinking one dazes her. */
  raftEvery: 200,
  firstRaft: 60,
  hatch: 360,
  daze: 120,
  /** Phase 2: the wings' tell, then the gust and its push on every sparkle. */
  fanEvery: 200,
  fanTell: 40,
  gust: 110,
  push: 0.22,
  /** Phase 3: the dive, the allies' hold, and the sky-long ribbon. */
  diveEvery: 220,
  holdEvery: 300,
  hold: 170,
  ribbon: 300,
} as const

type Raft = { x: number; t: number; alive: boolean }
type Ally = {
  kind: 'bat' | 'dragonfly' | 'swallow'
  a: number
  r: number
  speed: number
}

export class Queen implements Boss {
  readonly name = 'THE NIGHT QUEEN'
  phase: 1 | 2 | 3 = 1
  t = 0
  x = W / 2
  y = 100
  vx = 0
  vy = 0
  hp: number = QUEEN.hp
  rafts: Raft[] = []
  /** Phase 2: ticks into a fan (tell then gust), and which way it blows. */
  fan = 0
  fanDir = 1
  /** Phase 3: diving at a hut, held by the allies. */
  diving = 0
  held = 0
  allies: Ally[] = []
  flash = 0
  /** Phase 1: ticks left reeling after a raft is sunk (her only opening). */
  daze = 0
  /** Ticks left flinching from the last sparkle that landed. */
  flinch = 0
  exit = 0
  defeated = false

  get done() {
    return this.defeated && this.exit > 180
  }

  get health() {
    if (this.defeated) return 0
    if (this.phase === 3) return 1 / 3
    return (this.phase === 1 ? 2 / 3 : 1 / 3) + this.hp / QUEEN.hp / 3
  }

  get hint() {
    if (this.defeated) return 'NETTED! THE RAINS ARE OVER'
    if (this.phase === 1)
      return this.daze > 0
        ? 'SHE REELS! SPARKLE THE QUEEN'
        : 'SINK AN EGG RAFT TO MAKE HER REEL'
    if (this.phase === 2)
      return this.fan > 0
        ? 'WINGS OPEN! SPARKLE HER, INTO THE WIND'
        : 'WAIT FOR HER WINGS TO OPEN'
    return this.held > 0
      ? 'THE ALLIES HOLD HER: LASSO THE QUEEN!'
      : 'AMI AND THE ALLIES ARE HERE: WAIT FOR THE HOLD'
  }

  /** Is she shrugging sparkles off now (eggs safe, wings folded, or still flinching)? */
  get guarded(): boolean {
    if (this.phase === 1) return this.daze <= 0 || this.flinch > 0
    if (this.phase === 2) return this.fan === 0 || this.flinch > 0
    return true
  }

  /** The wind her wings blow now (sideways push per tick on sparkles), or 0. */
  get gust(): number {
    return this.phase === 2 && this.fan > QUEEN.fanTell
      ? this.fanDir * QUEEN.push
      : 0
  }

  update(host: BossHost) {
    this.t++
    if (this.flash > 0) this.flash--
    if (this.flinch > 0) this.flinch--
    if (this.daze > 0) this.daze--
    for (const a of this.allies) a.a += a.speed
    if (this.defeated) {
      this.exit++
      this.y -= 0.8
      return
    }
    const ship = host.ship()
    if (this.phase === 1) {
      // A wide loop of the sky.
      this.x = W / 2 + Math.cos(this.t / 120) * 170
      this.y = 145 + Math.sin(this.t / 60) * 45
      if (this.t % QUEEN.raftEvery === QUEEN.firstRaft) {
        const x = nearestPool(this.x)
        if (!this.rafts.some((r) => r.alive && r.x === x))
          this.rafts.push({ x, t: 0, alive: true })
        host.sound('blip')
      }
      for (const r of this.rafts) {
        if (!r.alive) continue
        if (++r.t >= QUEEN.hatch) {
          r.alive = false
          host.spawn({ x: r.x, y: GROUND - 24 }, 2)
          host.sound('warn')
        }
      }
      this.rafts = this.rafts.filter((r) => r.alive)
      return
    }
    if (this.phase === 2) {
      this.x += (W / 2 + Math.sin(this.t / 90) * 140 - this.x) * 0.03
      this.y += (100 - this.y) * 0.03
      if (this.fan > 0) {
        this.fan++
        if (this.fan === QUEEN.fanTell) host.sound('warn')
        if (this.gust) host.pushShots(this.gust)
        if (this.fan > QUEEN.fanTell + QUEEN.gust) this.fan = 0
      } else if (this.t % QUEEN.fanEvery === 0) {
        this.fan = 1
        this.fanDir = host.rng() < 0.5 ? -1 : 1
      }
      return
    }
    // Phase 3: dives at the village, held in turns by AMI's allies, ready to be lassoed.
    host.ribbonBoost(2, QUEEN.ribbon)
    if (this.held > 0) {
      this.held--
      this.vx *= 0.85
      this.vy *= 0.85
    } else if (this.t % QUEEN.holdEvery === 0) {
      this.held = QUEEN.hold
      this.diving = 0
      host.sound('extra')
    } else if (this.diving > 0) {
      this.diving++
      const hut = this.target(host)
      const goal = hut ? { x: hut.x, y: WINDOW_Y - 6 } : { x: this.x, y: 90 }
      const d = toward(this, goal)
      const m = Math.hypot(d.x, d.y) || 1
      this.vx += ((d.x / m) * 3.4 - this.vx) * 0.08
      this.vy += ((d.y / m) * 3.4 - this.vy) * 0.08
      if (hut && m < 16) {
        host.bite(hut)
        this.diving = 0
        this.vy = -3
      } else if (this.diving > 150) {
        this.diving = 0
      }
    } else {
      // Back up to the sky between dives, drifting after the butterfly.
      const tx = ship ? ship.x : W / 2
      this.vx += ((tx - this.x) * 0.004 - this.vx) * 0.05
      this.vy += ((100 - this.y) * 0.01 - this.vy) * 0.05
      if (this.t % QUEEN.diveEvery === 0) {
        this.diving = 1
        host.sound('warn')
      }
    }
    this.x = clamp(this.x + this.vx, 20, W - 20)
    this.y = clamp(this.y + this.vy, 96, GROUND - 30)
  }

  private target(host: BossHost) {
    const lit = host.huts.filter(hutLit)
    let best = lit[0] ?? null
    for (const h of lit)
      if (Math.abs(h.x - this.x) < Math.abs((best?.x ?? 0) - this.x)) best = h
    return best
  }

  private toPhase3(host: BossHost) {
    this.phase = 3
    this.rafts = []
    this.held = QUEEN.hold
    this.allies = [
      ...Array.from({ length: 4 }, (_, i) => ({
        kind: 'bat' as const,
        a: i * 1.6,
        r: 44,
        speed: 0.05,
      })),
      ...Array.from({ length: 3 }, (_, i) => ({
        kind: 'dragonfly' as const,
        a: i * 2.1,
        r: 58,
        speed: -0.04,
      })),
      ...Array.from({ length: 3 }, (_, i) => ({
        kind: 'swallow' as const,
        a: i * 2.1 + 1,
        r: 72,
        speed: 0.03,
      })),
    ]
    host.sound('extra')
    host.dropKit('net')
  }

  shot(at: Point, host: BossHost): boolean {
    if (this.defeated) return false
    if (this.phase === 1) {
      const raft = this.rafts.find(
        (r) => r.alive && Math.hypot(r.x - at.x, RAFT_Y - at.y) < 11,
      )
      if (raft) {
        raft.alive = false
        host.score(200, at, 'SUNK')
        host.sound('pop')
        this.daze = QUEEN.daze
        return true
      }
    }
    if (wrapDist(this, at) > QUEEN.r) return false
    if (this.guarded) {
      // Shrugged off: the sparkle is spent, she is not hurt.
      if (this.flash === 0) this.flash = 3
      host.sound('blip')
      return true
    }
    this.hp--
    this.flash = 8
    this.flinch = QUEEN.flinch
    host.score(250, at)
    host.sound('pop')
    if (this.hp <= 0) {
      if (this.phase === 1) {
        this.phase = 2
        this.hp = QUEEN.hp
        this.rafts = []
        this.daze = 0
        host.sound('boom')
      } else {
        this.toPhase3(host)
      }
    }
    return true
  }

  lasso(inside: (p: Point) => boolean, host: BossHost): boolean {
    if (this.defeated || this.phase !== 3 || !inside(this)) return false
    this.defeated = true
    host.score(50_000, this, 'THE NIGHT QUEEN IS NETTED')
    host.sound('extra')
    host.burst(this, 60)
    return true
  }

  touches(at: Point, r: number): boolean {
    if (this.defeated || this.held > 0) return false
    return wrapDist(this, at) < QUEEN.r * 0.8 + r
  }

  threats() {
    if (this.defeated || this.held > 0) return []
    return [{ at: { x: this.x, y: this.y }, r: QUEEN.r }]
  }

  targets(): Point[] {
    if (this.phase === 1) {
      if (this.daze > 0) return [this]
      const raft = this.rafts.find((r) => r.alive)
      return raft ? [{ x: raft.x, y: RAFT_Y }] : []
    }
    return this.phase === 2 && this.fan > 0 ? [this] : []
  }

  lassoMark(): Point | null {
    return this.phase === 3 && this.held > 0 && !this.defeated
      ? { x: this.x, y: this.y }
      : null
  }

  render(g: CanvasRenderingContext2D, tick: number) {
    // Egg rafts bobbing on the water.
    for (const r of this.rafts) {
      const hot = r.t > QUEEN.hatch * 0.75 && Math.floor(tick / 5) % 2 === 0
      g.fillStyle = INK
      g.fillRect(Math.round(r.x) - 9, RAFT_Y - 3, 18, 6)
      g.fillStyle = hot ? RAMPS.ember[3] : RAMPS.cream[2]
      for (let k = 0; k < 6; k++)
        g.fillRect(Math.round(r.x) - 8 + k * 3, RAFT_Y - 2, 2, 4)
    }
    // The allies circling her.
    for (const a of this.allies) {
      const ax = this.x + Math.cos(a.a) * a.r
      const ay = this.y + Math.sin(a.a) * a.r * 0.6
      const flap = Math.floor(tick / 4) % 2
      g.fillStyle = INK
      if (a.kind === 'bat') {
        g.fillRect(Math.round(ax) - 6, Math.round(ay) - (flap ? 2 : 0), 12, 3)
        g.fillStyle = RAMPS.purple[2]
        g.fillRect(Math.round(ax) - 1, Math.round(ay) - 1, 3, 4)
      } else if (a.kind === 'dragonfly') {
        g.fillStyle = RAMPS.teal[3]
        g.fillRect(Math.round(ax) - 5, Math.round(ay), 10, 2)
        g.fillStyle = rgba(RAMPS.teal[4], 0.7)
        g.fillRect(Math.round(ax) - 2, Math.round(ay) - 3 + flap, 4, 2)
      } else {
        g.fillRect(Math.round(ax) - 5, Math.round(ay) - flap, 10, 2)
        g.fillStyle = RAMPS.sky[2]
        g.fillRect(Math.round(ax) - 2, Math.round(ay) - 1, 4, 3)
      }
    }
    if (this.held > 0) {
      glow(g, this.x, this.y, 50, RAMPS.gold[3], 0.35)
      drawText(g, 'HELD!', this.x, this.y - 44, {
        align: 'center',
        color: RAMPS.gold[4],
        outline: INK,
      })
    }
    this.renderQueen(g, tick)
  }

  private renderQueen(g: CanvasRenderingContext2D, tick: number) {
    const x = this.x
    const y = this.y
    const fanning = this.phase === 2 && this.fan > 0
    const folded = this.phase === 2 && !fanning
    const span = fanning
      ? 46 + Math.sin(tick / 2) * 8
      : folded
        ? 20 + Math.sin(tick / 6) * 2
        : 34 + Math.sin(tick / 3) * 6
    if (this.phase === 1 && this.daze <= 0)
      // Her eggs are safe: a pale shell of light she shrugs sparkles off.
      glow(g, x, y, 38, RAMPS.cream[3], 0.22 + Math.sin(tick / 8) * 0.06)
    // Glassy wings.
    for (const side of [-1, 1]) {
      g.fillStyle = INK
      g.beginPath()
      g.ellipse(
        x + side * span * 0.6,
        y - 14,
        span * 0.62,
        11,
        side * -0.4,
        0,
        Math.PI * 2,
      )
      g.fill()
      g.fillStyle = rgba(
        fanning && this.fan < QUEEN.fanTell ? RAMPS.gold[4] : RAMPS.sky[4],
        0.75,
      )
      g.beginPath()
      g.ellipse(
        x + side * span * 0.6,
        y - 14,
        span * 0.6 - 1,
        9,
        side * -0.4,
        0,
        Math.PI * 2,
      )
      g.fill()
    }
    // A banded body, a big head with a crown and red cartoon eyes, a long proboscis.
    g.fillStyle = INK
    g.beginPath()
    g.ellipse(x, y + 10, 12, 24, 0, 0, Math.PI * 2)
    g.fill()
    for (let k = 0; k < 5; k++) {
      g.fillStyle = k % 2 ? RAMPS.steel[3] : RAMPS.steel[1]
      g.beginPath()
      g.ellipse(x, y + 2 + k * 7, 10 - k, 4, 0, 0, Math.PI * 2)
      g.fill()
    }
    shadedOrb(g, x, y - 14, 13, this.flash ? RAMPS.ember : RAMPS.purple, {
      glint: true,
    })
    for (const side of [-1, 1]) {
      g.fillStyle = '#ffffff'
      g.beginPath()
      g.arc(x + side * 5, y - 16, 4, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = RAMPS.ember[2]
      g.beginPath()
      g.arc(x + side * 5, y - 15, 2.4, 0, Math.PI * 2)
      g.fill()
    }
    g.fillStyle = INK
    g.fillRect(Math.round(x) - 1, Math.round(y) - 8, 2, 16)
    // The crown.
    g.fillStyle = INK
    g.fillRect(Math.round(x) - 9, Math.round(y) - 31, 18, 6)
    g.fillStyle = RAMPS.gold[3]
    for (const dx of [-8, -3, 2, 7])
      g.fillRect(Math.round(x) + dx, Math.round(y) - 33, 2, 6)
    g.fillRect(Math.round(x) - 8, Math.round(y) - 29, 16, 3)
    g.fillStyle = RAMPS.pink[3]
    g.fillRect(Math.round(x) - 1, Math.round(y) - 30, 2, 2)
    if (this.phase === 1 && this.daze > 0) {
      // Reeling: little stars round her crown.
      for (let k = 0; k < 3; k++) {
        const a = tick / 10 + (k * Math.PI * 2) / 3
        g.fillStyle = RAMPS.gold[4]
        g.fillRect(
          Math.round(x + Math.cos(a) * 16) - 1,
          Math.round(y - 30 + Math.sin(a) * 4) - 1,
          3,
          3,
        )
      }
    }
    if (this.diving > 0 && this.diving < 20) {
      drawText(g, '!', x, y - 46, {
        align: 'center',
        color: RAMPS.ember[3],
        outline: INK,
        scale: 2,
      })
    }
  }
}
