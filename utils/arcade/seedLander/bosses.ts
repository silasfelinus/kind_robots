// /utils/arcade/seedLander/bosses.ts
//
// Seed Lander's boss set-pieces (conductor kr-arcade/t-070..t-072): each is a landing puzzle
// that moves. A boss owns live pads (terrain.addLivePad) that it swings about every tick; planting
// them all moves it on a phase, and the last phase's last planting wins the island. Landings on
// a moving pad are judged relative to its speed, and a resting pod rides it.
//
//   Old Scarecrow (Meadow Isle): a giant scarecrow-bot whose hands are the pads. Plant on both
//   hands as he waves; each phase waves faster, and in the last, crows take turns sitting on his
//   hands, so you land between them.
//   The Gale Mill (Windmill Downs): a storm-faced windmill with a platform on each sail tip. They
//   turn slowest at the top of each turn; land then. The wind reverses each phase and the last
//   phase spins the other way.
//   The Geyser Tortoise (Waterfall Gorge): its shell is a pad on top of a geyser. It rises,
//   calms at the top and sinks again; land on the calm. In phase 2 it swims across the pool, in
//   phase 3 it surfaces in three places in turn.
//   The Glowworm Queen (Firefly Caverns): a cave-long worm whose lit segment is the only pad. The
//   light runs down her body in a sequence you learn, and each phase speeds it up.

import type { Pad, Terrain } from './terrain'
import { segmentDistance } from './hazards'

export type BossId = 'scarecrow' | 'galemill' | 'tortoise' | 'queen'

export type BossView = {
  id: BossId
  phase: number
  phases: number
  /** Plantings this phase, and how many the phase needs. */
  got: number
  need: number
}

export interface Boss {
  readonly id: BossId
  readonly name: string
  readonly title: string
  readonly phases: number
  phase: number
  done: boolean
  pads: Pad[]
  /** The steady wind the boss blows, if it sets one (the Gale Mill). */
  wind: number | null
  update(tick: number): void
  /** A boss pad was just planted. Returns true when that ends a phase. */
  planted(pad: Pad): boolean
  /** What the pod hit on the boss's body (a bonk's reason), or null. */
  hits(x: number, y: number): string | null
  view(): BossView
}

/** Old Scarecrow's shape and pace. */
export const SCARECROW = {
  /** The post's foot, the shoulders' height, and how far apart they are. */
  shoulderY: 112,
  shoulder: 22,
  arm: 66,
  hand: 26,
  head: 15,
  /** Wave speed (radians of the wave's cycle a tick) by phase. */
  wave: [0.009, 0.013, 0.017],
  /** How far the arms swing (radians). */
  swing: 0.45,
  /** The last phase: a crow sits on a hand this long, then is off it this long. */
  crowOn: 120,
  crowOff: 200,
} as const

export class OldScarecrow implements Boss {
  readonly id = 'scarecrow' as const
  readonly name = 'OLD SCARECROW'
  readonly title = 'PLANT ON HIS WAVING HANDS'
  readonly phases = 3
  phase = 0
  done = false
  pads: Pad[]
  wind: number | null = null
  private t = 0
  private wave = 0

  constructor(
    private terrain: Terrain,
    readonly x: number,
  ) {
    this.pads = ['left', 'right'].map((side) =>
      terrain.addLivePad({
        id: `hand-${side}`,
        x0: 0,
        x1: SCARECROW.hand,
        y: SCARECROW.shoulderY,
        mult: 3,
        kind: 'seed',
        grows: 'flower',
        reach: [],
      }),
    )
    this.place()
    for (const p of this.pads) {
      p.vx = 0
      p.vy = 0
    }
  }

  /** Hand centres for the wave so far: the arms swing in counterpoint. */
  handAt(side: 0 | 1, wave = this.wave): { x: number; y: number } {
    const swing = Math.sin(wave + side * Math.PI) * SCARECROW.swing
    const base = side === 0 ? Math.PI + 0.25 : -0.25
    const a = side === 0 ? base - swing : base + swing
    const sx = this.x + (side === 0 ? -SCARECROW.shoulder : SCARECROW.shoulder)
    return {
      x: sx + Math.cos(a) * SCARECROW.arm,
      y: SCARECROW.shoulderY + Math.sin(a) * SCARECROW.arm,
    }
  }

  private place() {
    this.pads.forEach((p, i) => {
      const h = this.handAt(i as 0 | 1)
      this.terrain.movePad(p, h.x, h.y)
    })
  }

  update() {
    if (this.done) return
    this.t++
    this.wave += SCARECROW.wave[Math.min(this.phase, 2)]!
    this.place()
    // The last phase: crows take turns sitting on his hands.
    if (this.phase === 2) {
      const cycle = SCARECROW.crowOn + SCARECROW.crowOff
      this.pads.forEach((p, i) => {
        const at = (this.t + i * Math.round(cycle / 2)) % cycle
        p.blocked = !p.planted && at < SCARECROW.crowOn
      })
    }
  }

  planted(): boolean {
    if (!this.pads.every((p) => p.planted)) return false
    this.phase++
    if (this.phase >= this.phases) {
      this.done = true
      for (const p of this.pads) p.blocked = false
      return true
    }
    for (const p of this.pads) p.planted = false
    return true
  }

  hits(x: number, y: number): string | null {
    // His pumpkin head and the post he stands on.
    if (
      Math.hypot(x - this.x, y - (SCARECROW.shoulderY - 26)) <
      SCARECROW.head + 5
    )
      return 'BUMPED THE SCARECROW'
    if (Math.abs(x - this.x) < 8 && y > SCARECROW.shoulderY - 10)
      return 'BUMPED THE SCARECROW'
    return null
  }

  view(): BossView {
    return {
      id: this.id,
      phase: this.phase,
      phases: this.phases,
      got: this.pads.filter((p) => p.planted).length,
      need: this.pads.length,
    }
  }
}

/** The Gale Mill's shape and pace. */
export const GALE_MILL = {
  hubY: 140,
  sail: 72,
  tip: 24,
  sails: 4,
  /** Turn speed (radians a tick, before the slow-at-the-top ease) by phase. */
  turn: [0.012, 0.015, -0.016],
  /** Each phase's wind (the storm face blows; it reverses each phase). */
  wind: [0.0025, -0.003, 0.003],
  /** Tip platforms to plant each phase. */
  need: 2,
} as const

export class GaleMill implements Boss {
  readonly id = 'galemill' as const
  readonly name = 'THE GALE MILL'
  readonly title = 'LAND ON THE SAILS AT THE TOP'
  readonly phases = 3
  phase = 0
  done = false
  pads: Pad[]
  wind: number | null = GALE_MILL.wind[0]
  angle = -Math.PI / 2 + 0.3
  private got = 0

  constructor(
    private terrain: Terrain,
    readonly x: number,
  ) {
    this.pads = Array.from({ length: GALE_MILL.sails }, (_, i) =>
      terrain.addLivePad({
        id: `sail${i}`,
        x0: 0,
        x1: GALE_MILL.tip,
        y: GALE_MILL.hubY,
        mult: 4,
        kind: 'seed',
        grows: 'flower',
        reach: [],
      }),
    )
    this.place()
    for (const p of this.pads) {
      p.vx = 0
      p.vy = 0
    }
  }

  sailAngle(i: number): number {
    return this.angle + (i * Math.PI * 2) / GALE_MILL.sails
  }

  /** How fast the sails turn now: slowest when a sail stands at the top. */
  turnSpeed(): number {
    const base = GALE_MILL.turn[Math.min(this.phase, 2)]!
    const ease = Math.abs(Math.sin((this.angle + Math.PI / 2) * 2))
    return base * (0.04 + 0.96 * ease ** 2)
  }

  private place() {
    this.pads.forEach((p, i) => {
      const a = this.sailAngle(i)
      this.terrain.movePad(
        p,
        this.x + Math.cos(a) * GALE_MILL.sail,
        GALE_MILL.hubY + Math.sin(a) * GALE_MILL.sail - 3,
      )
    })
  }

  update() {
    if (this.done) return
    this.angle += this.turnSpeed()
    this.place()
  }

  planted(): boolean {
    this.got++
    if (this.got < GALE_MILL.need) return false
    this.got = 0
    this.phase++
    if (this.phase >= this.phases) {
      this.done = true
      this.wind = 0
      return true
    }
    this.wind = GALE_MILL.wind[this.phase]!
    for (const p of this.pads) p.planted = false
    return true
  }

  hits(x: number, y: number): string | null {
    if (Math.hypot(x - this.x, y - GALE_MILL.hubY) < 12)
      return 'BUMPED THE MILL'
    if (Math.abs(x - this.x) < 9 && y > GALE_MILL.hubY + 8)
      return 'BUMPED THE MILL'
    for (let i = 0; i < GALE_MILL.sails; i++) {
      const a = this.sailAngle(i)
      // The sail's arm, short of the platform at its tip.
      const reach = GALE_MILL.sail - GALE_MILL.tip / 2 - 2
      if (
        segmentDistance(
          x,
          y,
          this.x,
          GALE_MILL.hubY,
          this.x + Math.cos(a) * reach,
          GALE_MILL.hubY + Math.sin(a) * reach,
        ) < 4
      )
        return 'CLIPPED A SAIL'
    }
    return null
  }

  view(): BossView {
    return {
      id: this.id,
      phase: this.phase,
      phases: this.phases,
      got: this.got,
      need: GALE_MILL.need,
    }
  }
}

/** The Geyser Tortoise's pool and pace. */
export const TORTOISE = {
  /** The shell's top when the geyser is down, and at the top of the surge. */
  lowY: 206,
  highY: 104,
  shell: 42,
  /** Ticks in one surge by phase. */
  cycle: [440, 360, 320],
  /** The calm at the top of the surge, as a share of the cycle, by phase: [from, to]. */
  calm: [
    [0.26, 0.74],
    [0.28, 0.7],
    [0.3, 0.66],
  ],
  /** Phase 2: how far it swims either side of the middle. */
  swim: 36,
  /** Phase 3: where it surfaces (offsets from the middle), in turn. */
  spots: [0, -48, 48],
  /** Plantings each phase needs. */
  need: 2,
  /** Ticks under water at the start of each new phase. */
  hold: 90,
} as const

export class GeyserTortoise implements Boss {
  readonly id = 'tortoise' as const
  readonly name = 'THE GEYSER TORTOISE'
  readonly title = 'LAND ON THE SHELL WHEN THE GEYSER CALMS'
  readonly phases = 3
  phase = 0
  done = false
  pads: Pad[]
  wind: number | null = null
  private t = 0
  private got = 0
  /** Ticks the shell stays under after a phase begins (a breath to line up). */
  private hold = 0

  constructor(
    private terrain: Terrain,
    readonly x: number,
  ) {
    this.pads = [
      terrain.addLivePad({
        id: 'shell',
        x0: 0,
        x1: TORTOISE.shell,
        y: TORTOISE.lowY,
        mult: 4,
        kind: 'seed',
        grows: 'flower',
        reach: [],
      }),
    ]
    this.place()
    this.pads[0]!.vx = 0
    this.pads[0]!.vy = 0
  }

  /** How far through this surge it is (0..1). */
  surge(t = this.t): number {
    const c = TORTOISE.cycle[Math.min(this.phase, 2)]!
    return (t % c) / c
  }

  /** Is the geyser calm at the top (the time to land)? */
  calm(t = this.t): boolean {
    const [a, b] = TORTOISE.calm[Math.min(this.phase, 2)]!
    const u = this.surge(t)
    return u >= a && u <= b
  }

  /** Where the shell sits for surge number `k` of this phase (it is level with it at the calm). */
  private spot(k: number): number {
    // Each phase starts where the last left off (the middle), then goes to one bank and the other.
    if (this.phase === 1)
      return this.x + (k === 0 ? 0 : k % 2 ? -TORTOISE.swim : TORTOISE.swim)
    if (this.phase === 2)
      return this.x + TORTOISE.spots[k % TORTOISE.spots.length]!
    return this.x
  }

  /**
   * The shell's centre x now. Phase 2 swims across the pool underwater, after the shell sinks;
   * phase 3 surfaces in three places in turn. It stays put for the whole surge and the calm.
   */
  shellX(t = this.t): number {
    const c = TORTOISE.cycle[Math.min(this.phase, 2)]!
    const k = Math.floor(t / c)
    if (this.phase !== 1) return this.spot(k)
    const [, b] = TORTOISE.calm[1]!
    const e = Math.max(0, Math.min(1, (this.surge(t) - b) / (1 - b)))
    return (
      this.spot(k) + (this.spot(k + 1) - this.spot(k)) * (e * e * (3 - 2 * e))
    )
  }

  /** Ticks of calm left at the top of this surge (0 when not calm). */
  calmLeft(): number {
    if (!this.calm()) return 0
    const c = TORTOISE.cycle[Math.min(this.phase, 2)]!
    const [, b] = TORTOISE.calm[Math.min(this.phase, 2)]!
    return Math.max(0, Math.round((b - this.surge()) * c))
  }

  /** Where the shell will be at the next (or current) calm: where a pilot should wait. */
  calmX(): number {
    const c = TORTOISE.cycle[Math.min(this.phase, 2)]!
    const [, b] = TORTOISE.calm[Math.min(this.phase, 2)]!
    const k = Math.floor(this.t / c)
    return this.spot(this.surge() > b ? k + 1 : k)
  }

  /** The shell's top now: down in the pool, up on the geyser, level at the calm. */
  shellY(t = this.t): number {
    const [a, b] = TORTOISE.calm[Math.min(this.phase, 2)]!
    const u = this.surge(t)
    const { lowY, highY } = TORTOISE
    const ease = (v: number) => v * v * (3 - 2 * v)
    if (u < a) return lowY + (highY - lowY) * ease(u / a)
    if (u <= b) return highY + Math.sin(t * 0.08) * 0.6
    const down = (u - b) / (1 - b)
    return highY + (lowY - highY) * ease(Math.min(1, down * 1.25))
  }

  private place() {
    const p = this.pads[0]!
    this.terrain.movePad(p, this.shellX(), this.shellY())
    // Only the calm is landable; below it the shell is just a shell in the water.
    p.blocked = !p.planted && !this.calm()
  }

  update() {
    if (this.done) return
    if (this.hold > 0) this.hold--
    else this.t++
    this.place()
  }

  planted(): boolean {
    this.pads[0]!.planted = false
    this.got++
    if (this.got < TORTOISE.need) return false
    this.got = 0
    this.phase++
    if (this.phase >= this.phases) {
      this.done = true
      this.pads[0]!.blocked = false
    }
    this.t = 0
    this.hold = TORTOISE.hold
    return true
  }

  hits(x: number, y: number): string | null {
    const p = this.pads[0]!
    const cx = (p.x0 + p.x1) / 2
    // The shell's flanks and the head poking out of the pool.
    if (y > p.y + 3 && y < TORTOISE.lowY + 14 && Math.abs(x - cx) < 18)
      return 'BUMPED THE TORTOISE'
    return null
  }

  view(): BossView {
    return {
      id: this.id,
      phase: this.phase,
      phases: this.phases,
      got: this.got,
      need: TORTOISE.need,
    }
  }
}

/** The Glowworm Queen's body and pace. */
export const QUEEN = {
  /** Segments, their pad width and spacing. */
  segments: 5,
  pad: 34,
  gap: 58,
  /** Each segment's top (an arch). */
  ys: [176, 166, 160, 166, 176],
  /** The order the light runs down her body, by phase. */
  sequences: [
    [0, 1, 2, 3, 4],
    [0, 2, 4, 3, 1],
    [0, 4, 1, 3, 2, 3, 1, 4],
  ],
  /** Ticks each segment stays lit, by phase. */
  step: [110, 84, 62],
  /** Plantings each phase needs. */
  need: 2,
  /** Ticks dark at the start of each new phase. */
  hold: 90,
} as const

export class GlowwormQueen implements Boss {
  readonly id = 'queen' as const
  readonly name = 'THE GLOWWORM QUEEN'
  readonly title = 'LAND ON THE LIT SEGMENT'
  readonly phases = 3
  phase = 0
  done = false
  pads: Pad[]
  wind: number | null = null
  private t = 0
  private got = 0
  private hold = 0

  constructor(
    terrain: Terrain,
    readonly x: number,
  ) {
    this.pads = Array.from({ length: QUEEN.segments }, (_, k) => {
      const cx = x + (k - (QUEEN.segments - 1) / 2) * QUEEN.gap
      return terrain.addLivePad({
        id: `segment${k}`,
        x0: cx - QUEEN.pad / 2,
        x1: cx + QUEEN.pad / 2,
        y: QUEEN.ys[k]!,
        mult: 3,
        kind: 'seed',
        grows: 'flower',
        reach: [],
      })
    })
    this.place()
  }

  private seq(): readonly number[] {
    return QUEEN.sequences[Math.min(this.phase, 2)]!
  }

  private stepTicks(): number {
    return QUEEN.step[Math.min(this.phase, 2)]!
  }

  /** The segment that is lit now, or -1 while a new phase gets its breath. */
  lit(): number {
    if (this.hold > 0) return -1
    const s = this.seq()
    return s[Math.floor(this.t / this.stepTicks()) % s.length]!
  }

  /** Ticks the lit segment has left. */
  litLeft(): number {
    if (this.hold > 0) return 0
    const n = this.stepTicks()
    return n - (this.t % n)
  }

  /** The segment that will be lit next. */
  next(): number {
    const s = this.seq()
    return s[(Math.floor(this.t / this.stepTicks()) + 1) % s.length]!
  }

  private place() {
    const lit = this.lit()
    this.pads.forEach((p, k) => {
      p.blocked = !p.planted && k !== lit
    })
  }

  update() {
    if (this.done) return
    if (this.hold > 0) this.hold--
    else this.t++
    this.place()
  }

  planted(pad: Pad): boolean {
    pad.planted = false
    this.got++
    if (this.got < QUEEN.need) return false
    this.got = 0
    this.phase++
    this.t = 0
    this.hold = QUEEN.hold
    if (this.phase >= this.phases) {
      this.done = true
      for (const p of this.pads) p.blocked = false
    } else this.place()
    return true
  }

  hits(x: number, y: number): string | null {
    const a = this.pads[0]!
    const b = this.pads[this.pads.length - 1]!
    // Her body runs under the pads: flying into the glowing belly bonks.
    if (x > a.x0 - 4 && x < b.x1 + 4 && y > 172 && y < 192)
      return 'BUMPED THE QUEEN'
    return null
  }

  view(): BossView {
    return {
      id: this.id,
      phase: this.phase,
      phases: this.phases,
      got: this.got,
      need: QUEEN.need,
    }
  }
}

/** Build a boss on its arena's terrain, standing at x. */
export function makeBoss(id: BossId, terrain: Terrain, x: number): Boss {
  switch (id) {
    case 'scarecrow':
      return new OldScarecrow(terrain, x)
    case 'galemill':
      return new GaleMill(terrain, x)
    case 'tortoise':
      return new GeyserTortoise(terrain, x)
    case 'queen':
      return new GlowwormQueen(terrain, x)
  }
}

export const BOSS_NAMES: Record<BossId, string> = {
  scarecrow: 'OLD SCARECROW',
  galemill: 'THE GALE MILL',
  tortoise: 'THE GEYSER TORTOISE',
  queen: 'THE GLOWWORM QUEEN',
}
