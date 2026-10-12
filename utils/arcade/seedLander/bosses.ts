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

import type { Pad, Terrain } from './terrain'
import { segmentDistance } from './hazards'

export type BossId = 'scarecrow' | 'galemill'

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

/** Build a boss on its arena's terrain, standing at x. */
export function makeBoss(id: BossId, terrain: Terrain, x: number): Boss {
  switch (id) {
    case 'scarecrow':
      return new OldScarecrow(terrain, x)
    case 'galemill':
      return new GaleMill(terrain, x)
  }
}

export const BOSS_NAMES: Record<BossId, string> = {
  scarecrow: 'OLD SCARECROW',
  galemill: 'THE GALE MILL',
}
