// /utils/arcade/cocoaCounter/bonus.ts
//
// Cocoa Counter depth pass, slice 2 (conductor kr-arcade/t-123): the bonus rounds between venues.
// Marshmallow Mix-up (the Snowdrop Cafe's shell game: a marshmallow hides under one of six mugs,
// the mugs shuffle, pick the right one) and Catch the Coconuts (the Seaside Smoothie Shack: catch
// coconuts dropping from the palms in a mug; golden ones pay into the Cafe Fund). Each is a small
// self-contained state machine on the game's seeded rng, with its own attract pilot.

import { drawText } from '../font'
import { INK, RAMPS, bevel, glow, hudPanel, rgba, shadedOrb } from '../snes'
import { emptyInput } from '../types'
import type { InputFrame } from '../types'
import { BONUSES } from './tables'
import type { BonusId } from './tables'
import { followCup, shuffleSwaps } from './rules'

export type BonusResult = { points: number; coins: number; note: string }

export interface BonusRound {
  readonly id: BonusId
  readonly done: boolean
  readonly result: BonusResult | null
  update(input: InputFrame): void
  /** What the attract pilot presses. */
  pilot(): InputFrame
  render(g: CanvasRenderingContext2D, tick: number): void
}

const W = 320

export const MIXUP = {
  cups: 6,
  showTicks: 100,
  pickTicks: 600,
  revealTicks: 100,
  winPoints: 3000,
  winCoins: 3,
  missPoints: 500,
} as const

export const COCONUTS = {
  ticks: 1200,
  catcherY: 196,
  catchRange: 13,
  speed: 2.6,
  points: 150,
  goldenPoints: 500,
  /** One coin per this many coconuts, plus one per golden coconut. */
  perCoin: 6,
  wobble: 30,
} as const

const cupX = (slot: number) => 70 + slot * 36

// --- Marshmallow Mix-up -------------------------------------------------------------------------

type MixupPhase = 'show' | 'shuffle' | 'pick' | 'reveal'

export class MarshmallowMixup implements BonusRound {
  readonly id = 'mixup' as const
  done = false
  result: BonusResult | null = null
  phase: MixupPhase = 'show'
  timer: number = MIXUP.showTicks
  /** cupAt[slot] = which cup stands there. */
  cupAt: number[] = Array.from({ length: MIXUP.cups }, (_, i) => i)
  /** The cup holding the marshmallow. */
  readonly prize: number
  readonly swaps: [number, number][]
  readonly swapTicks: number
  swapIndex = 0
  cursor = 0
  picked = -1

  constructor(rng: () => number, level: number) {
    this.prize = Math.floor(rng() * MIXUP.cups)
    this.swaps = shuffleSwaps(rng, MIXUP.cups, 7 + level * 3)
    this.swapTicks = Math.max(12, 26 - level * 4)
  }

  /** The slot the marshmallow's cup is in once the shuffle is over. */
  get answer(): number {
    return followCup(this.prize, this.swaps)
  }

  update(input: InputFrame) {
    if (this.done) return
    if (this.phase === 'show') {
      if (--this.timer <= 0) {
        this.phase = 'shuffle'
        this.timer = this.swapTicks
      }
    } else if (this.phase === 'shuffle') {
      if (--this.timer <= 0) {
        const [a, b] = this.swaps[this.swapIndex]!
        ;[this.cupAt[a], this.cupAt[b]] = [this.cupAt[b]!, this.cupAt[a]!]
        this.swapIndex++
        this.timer = this.swapTicks
        if (this.swapIndex >= this.swaps.length) {
          this.phase = 'pick'
          this.timer = MIXUP.pickTicks
        }
      }
    } else if (this.phase === 'pick') {
      if (input.pressed.left)
        this.cursor = (this.cursor + MIXUP.cups - 1) % MIXUP.cups
      if (input.pressed.right) this.cursor = (this.cursor + 1) % MIXUP.cups
      if (input.pressed.a || --this.timer <= 0) {
        this.picked = this.cursor
        const win = this.cupAt[this.picked] === this.prize
        this.result = win
          ? {
              points: MIXUP.winPoints,
              coins: MIXUP.winCoins,
              note: 'FOUND IT! A SWEET BONUS',
            }
          : {
              points: MIXUP.missPoints,
              coins: 0,
              note: 'SO CLOSE! IT WAS HERE',
            }
        this.phase = 'reveal'
        this.timer = MIXUP.revealTicks
      }
    } else if (--this.timer <= 0) this.done = true
  }

  pilot(): InputFrame {
    const f = emptyInput()
    if (this.phase !== 'pick') return f
    if (this.cursor === this.answer) f.pressed.a = f.held.a = true
    else f.pressed.right = f.held.right = true
    return f
  }

  render(g: CanvasRenderingContext2D, tick: number) {
    bonusBackdrop(g, BONUSES.mixup.name, BONUSES.mixup.lines)
    bevel(g, 40, 162, 240, 10, [
      '#3b1d0b',
      '#5c2e12',
      '#7c3f17',
      '#a0582a',
      '#c47a3e',
    ])
    // Cups mid-swap glide on an arc between their slots.
    const swap =
      this.phase === 'shuffle' ? this.swaps[this.swapIndex] : undefined
    const t = swap ? 1 - this.timer / this.swapTicks : 0
    for (let slot = 0; slot < MIXUP.cups; slot++) {
      const cup = this.cupAt[slot]!
      let x = cupX(slot)
      let lift = 0
      if (swap && (slot === swap[0] || slot === swap[1])) {
        const other = slot === swap[0] ? swap[1] : swap[0]
        x = cupX(slot) + (cupX(other) - cupX(slot)) * t
        lift = Math.sin(t * Math.PI) * (slot === swap[0] ? 14 : -6)
      }
      const reveal =
        this.phase === 'reveal' ||
        (this.phase === 'show' && this.timer < MIXUP.showTicks - 20)
      // The prize cup lifts to show the marshmallow, then settles before the shuffle.
      const up = !reveal
        ? 0
        : this.phase === 'reveal'
          ? Math.min(14, (MIXUP.revealTicks - this.timer) / 2 + 6)
          : cup === this.prize
            ? Math.min(14, this.timer * 0.7)
            : 0
      if (up > 0 && cup === this.prize) marshmallow(g, x, 160)
      cupShape(g, x, 160 - lift - up)
    }
    if (this.phase === 'show' && this.timer > MIXUP.showTicks - 24) {
      const y = 110 + (MIXUP.showTicks - this.timer) * 2
      marshmallow(g, cupX(this.prize), y)
    }
    if (this.phase === 'pick') {
      const x = cupX(this.cursor)
      const bob = Math.floor(tick / 8) % 2
      drawText(g, 'V', x, 118 + bob, {
        align: 'center',
        scale: 2,
        color: RAMPS.gold[4],
        outline: INK,
      })
      drawText(g, 'LEFT/RIGHT, THEN A', W / 2, 200, {
        align: 'center',
        color: RAMPS.cream[4],
        outline: INK,
      })
    }
    if (this.phase === 'reveal' && this.result) {
      glow(g, cupX(this.picked), 150, 20, RAMPS.gold[3], 0.4)
      drawText(g, this.result.note, W / 2, 200, {
        align: 'center',
        color: RAMPS.gold[3],
        outline: INK,
      })
    }
  }
}

function cupShape(g: CanvasRenderingContext2D, x: number, bottom: number) {
  const left = Math.round(x - 11)
  const top = Math.round(bottom - 22)
  g.fillStyle = INK
  g.fillRect(left - 1, top - 1, 24, 24)
  g.fillStyle = RAMPS.cream[3]
  g.fillRect(left, top, 22, 22)
  g.fillStyle = '#ffffff'
  g.fillRect(left + 2, top + 2, 3, 17)
  g.fillStyle = RAMPS.cream[1]
  g.fillRect(left + 18, top, 4, 22)
  g.fillStyle = RAMPS.ember[2]
  g.fillRect(left, top + 7, 22, 4)
  g.fillStyle = RAMPS.cream[0]
  g.fillRect(left - 2, top + 20, 26, 3)
}

function marshmallow(g: CanvasRenderingContext2D, x: number, bottom: number) {
  const left = Math.round(x - 5)
  const top = Math.round(bottom - 9)
  g.fillStyle = INK
  g.fillRect(left - 1, top - 1, 12, 11)
  g.fillStyle = RAMPS.pink[4]
  g.fillRect(left, top, 10, 9)
  g.fillStyle = '#ffffff'
  g.fillRect(left + 1, top + 1, 4, 3)
}

// --- Catch the Coconuts -------------------------------------------------------------------------

type Coconut = {
  x: number
  y: number
  vy: number
  golden: boolean
  /** Ticks left wobbling in the palm before it drops (the tell). */
  wobble: number
  state: 'hang' | 'fall' | 'caught' | 'bonk'
  life: number
}

export class CatchTheCoconuts implements BonusRound {
  readonly id = 'coconuts' as const
  done = false
  result: BonusResult | null = null
  timer: number = COCONUTS.ticks
  x = W / 2
  nuts: Coconut[] = []
  caught = 0
  golden = 0
  private next = 40
  private rng: () => number
  private level: number

  constructor(rng: () => number, level: number) {
    this.rng = rng
    this.level = level
  }

  update(input: InputFrame) {
    if (this.done) return
    if (this.timer > 0) {
      this.timer--
      if (input.held.left) this.x = Math.max(24, this.x - COCONUTS.speed)
      if (input.held.right) this.x = Math.min(W - 24, this.x + COCONUTS.speed)
      if (--this.next <= 0 && this.timer > 90) {
        this.nuts.push({
          x: 30 + this.rng() * (W - 60),
          y: 46,
          vy: 0.3,
          golden: this.rng() < 1 / 7,
          wobble: COCONUTS.wobble,
          state: 'hang',
          life: 30,
        })
        this.next = Math.round(
          Math.max(18, 44 - this.level * 6) * (0.7 + this.rng() * 0.6),
        )
      }
    }
    for (const nut of this.nuts) {
      if (nut.state === 'hang') {
        if (--nut.wobble <= 0) nut.state = 'fall'
      } else if (nut.state === 'fall') {
        nut.vy += 0.07
        nut.y += nut.vy
        if (
          nut.y >= COCONUTS.catcherY - 4 &&
          nut.y <= COCONUTS.catcherY + 6 &&
          Math.abs(nut.x - this.x) <= COCONUTS.catchRange
        ) {
          nut.state = 'caught'
          if (nut.golden) this.golden++
          else this.caught++
        } else if (nut.y > 218) nut.state = 'bonk'
      } else nut.life--
    }
    this.nuts = this.nuts.filter((n) => n.life > 0)
    if (
      this.timer <= 0 &&
      !this.nuts.some((n) => n.state === 'hang' || n.state === 'fall')
    ) {
      const total = this.caught + this.golden
      this.result = {
        points:
          this.caught * COCONUTS.points + this.golden * COCONUTS.goldenPoints,
        coins: this.golden + Math.floor(total / COCONUTS.perCoin),
        note: `${total} COCONUTS CAUGHT!`,
      }
      this.done = true
    }
  }

  /** Where a falling (or wobbling) coconut will meet the catcher, in ticks. */
  private eta(nut: Coconut): number {
    let y = nut.y
    let vy = nut.vy
    let t = nut.state === 'hang' ? nut.wobble : 0
    while (y < COCONUTS.catcherY && t < 600) {
      vy += 0.07
      y += vy
      t++
    }
    return t
  }

  pilot(): InputFrame {
    const f = emptyInput()
    let best: Coconut | null = null
    let soonest = Infinity
    for (const nut of this.nuts) {
      if (nut.state !== 'fall' && nut.state !== 'hang') continue
      const eta = this.eta(nut)
      const reach = Math.abs(nut.x - this.x) / COCONUTS.speed
      if (reach > eta + 4) continue
      const score = eta + (nut.golden ? -30 : 0)
      if (score < soonest) {
        soonest = score
        best = nut
      }
    }
    if (best) {
      if (best.x < this.x - 2) f.held.left = true
      else if (best.x > this.x + 2) f.held.right = true
    }
    return f
  }

  render(g: CanvasRenderingContext2D, tick: number) {
    bonusBackdrop(g, BONUSES.coconuts.name, BONUSES.coconuts.lines)
    // Palms along the top, sand along the bottom.
    g.fillStyle = RAMPS.gold[2]
    g.fillRect(0, 210, W, 30)
    g.fillStyle = RAMPS.gold[3]
    g.fillRect(0, 210, W, 2)
    for (let px = 20; px < W; px += 56) {
      g.fillStyle = RAMPS.leaf[2]
      g.fillRect(px - 18, 38, 36, 4)
      g.fillRect(px - 12, 34, 24, 4)
      g.fillStyle = RAMPS.leaf[1]
      g.fillRect(px - 20, 42, 8, 3)
      g.fillRect(px + 12, 42, 8, 3)
    }
    for (const nut of this.nuts) {
      const shake =
        nut.state === 'hang' ? (Math.floor(tick / 3) % 2 ? 1 : -1) : 0
      if (nut.state === 'bonk') {
        g.fillStyle = rgba(RAMPS.cream[3], nut.life / 30)
        g.fillRect(Math.round(nut.x) - 6, 212, 12, 2)
        drawText(g, 'BONK', nut.x, 196, {
          align: 'center',
          color: RAMPS.cream[3],
          outline: INK,
        })
        continue
      }
      if (nut.state === 'caught') {
        drawText(
          g,
          nut.golden ? '+500' : '+150',
          nut.x,
          180 - (30 - nut.life),
          {
            align: 'center',
            color: RAMPS.gold[3],
            outline: INK,
          },
        )
        continue
      }
      if (nut.golden) glow(g, nut.x, nut.y, 10, RAMPS.gold[3], 0.5)
      shadedOrb(
        g,
        nut.x + shake,
        nut.y,
        5,
        nut.golden ? RAMPS.gold : RAMPS.earth,
      )
    }
    // The mug-bot's catching mug.
    const cx = Math.round(this.x)
    g.fillStyle = INK
    g.fillRect(cx - 13, COCONUTS.catcherY - 1, 26, 12)
    g.fillStyle = RAMPS.cream[3]
    g.fillRect(cx - 12, COCONUTS.catcherY, 24, 10)
    g.fillStyle = RAMPS.ember[2]
    g.fillRect(cx - 12, COCONUTS.catcherY + 4, 24, 3)
    g.fillStyle = RAMPS.steel[3]
    g.fillRect(cx - 4, COCONUTS.catcherY + 10, 8, 4)
    hudPanel(g, W - 92, 28, 88, 12, RAMPS.earth)
    drawText(
      g,
      `TIME ${Math.ceil(this.timer / 60)}  ${this.caught + this.golden}`,
      W - 10,
      30,
      { align: 'right', color: RAMPS.cream[4], outline: INK },
    )
  }
}

function bonusBackdrop(
  g: CanvasRenderingContext2D,
  title: string,
  lines: readonly string[],
) {
  g.fillStyle = rgba(INK, 0.72)
  g.fillRect(0, 26, W, 214)
  drawText(g, `BONUS: ${title}`, W / 2, 54, {
    align: 'center',
    color: RAMPS.gold[3],
    outline: INK,
  })
  lines.forEach((line, i) =>
    drawText(g, line, W / 2, 68 + i * 10, {
      align: 'center',
      color: RAMPS.cream[3],
      outline: INK,
    }),
  )
}

export function createBonus(
  id: BonusId,
  rng: () => number,
  level: number,
): BonusRound {
  return id === 'mixup'
    ? new MarshmallowMixup(rng, level)
    : new CatchTheCoconuts(rng, level)
}
