// /utils/arcade/prizeShow/commercials.ts
//
// Prize Show Panic's commercial breaks (conductor kr-arcade t-033, depth-pass/ASSESSMENT.md section 2,
// "Commercial breaks"): a short mini-game between episodes, and one halfway through the Live Finale,
// each an original take on a TV game-show staple, each paying out in prizes for the next Prize Swap.
//
//   Spin the Wheel     a timing game: the wheel spins, A brakes it, and it always coasts the same
//                      distance after the press, so a steady hand learns where it lands. Three spins.
//   Catch the Prizes   run under the prizes falling from the rafters (every contestant at once).
//   Pie Dodge          pies arc in from the wings at whoever is standing still; the fewer splats,
//                      the better the prize.
//   Higher or Lower    a price is shown; guess whether the next one is higher or lower. Five cards.
//
// The game owns the payout (games/prizeShowPanic.ts); this keeps each break's state, steps it with
// every seat's input and the game's dice, and draws it (contestants through a callback).

import { drawText } from '../font'
import {
  INK,
  RAMPS,
  bevel,
  dropShadow,
  drawSprite,
  glow,
  hudPanel,
  rgba,
  shadedOrb,
} from '../snes'
import type { ArcadeSoundName } from '../sound'
import { emptyInput } from '../types'
import type { InputFrame } from '../types'
import { CAR_SPRITE, CASH_SPRITE, TOASTER_SPRITE } from './art'
import { CX, H, W } from './stage'

export type BreakKind = 'wheel' | 'catch' | 'pies' | 'higher'
export type BreakPrize = 'cash' | 'toaster' | 'car'

/** The breaks take turns, in this order. */
export const BREAK_ORDER: readonly BreakKind[] = [
  'wheel',
  'catch',
  'pies',
  'higher',
]

export const BREAK_TITLES: Record<BreakKind, { title: string; how: string }> = {
  wheel: {
    title: 'SPIN THE WHEEL',
    how: 'A BRAKES. IT ALWAYS COASTS THE SAME',
  },
  catch: { title: 'CATCH THE PRIZES', how: 'RUN UNDER WHAT FALLS' },
  pies: { title: 'PIE DODGE', how: 'KEEP MOVING. FEWEST SPLATS WINS' },
  higher: { title: 'HIGHER OR LOWER', how: 'UP: HIGHER   DOWN: LOWER' },
}

export const BREAK = {
  /** Ticks of title card before play, and of results after. */
  intro: 90,
  outro: 120,
  wheel: {
    spins: 3,
    speed: 0.12,
    /** Ticks it takes to stop once braked (it slows evenly: 0.12 * 90 / 2 radians of coast). */
    brake: 90,
    /** It brakes itself if nobody presses A for this long. */
    wait: 60 * 5,
    pause: 70,
  },
  catch: { ticks: 60 * 20, speed: 2.2, y: 200, reach: 12 },
  pies: { ticks: 60 * 20, speed: 1.8, flight: 50, splat: 12 },
  higher: { cards: 5, wait: 60 * 6, reveal: 60 },
} as const

type Seat = {
  x: number
  y: number
  splats: number
  caught: number
  face: 1 | -1
  moving: boolean
}

type Faller = { x: number; y: number; vy: number; kind: BreakPrize }
type Pie = { x0: number; y0: number; x1: number; y1: number; t: number }

export type WheelSlot = {
  label: string
  prize: BreakPrize | null
  points: number
}

export type BreakState = {
  kind: BreakKind
  /** Ticks since the break began (play starts after BREAK.intro). */
  ticks: number
  /** Ticks since play finished (the results), or -1 while it plays. */
  over: number
  seats: Seat[]
  /** What the break has paid out so far. */
  won: BreakPrize[]
  points: number
  // Spin the Wheel.
  slots: WheelSlot[]
  angle: number
  /** Ticks into the braking (-1: spinning freely), and the spin it is on. */
  braking: number
  spin: number
  /** Ticks since the last spin landed (it pauses on the result), or -1. */
  landed: number
  idle: number
  // Catch the Prizes.
  falling: Faller[]
  // Pie Dodge.
  pies: Pie[]
  splatsShown: Array<{ x: number; y: number; life: number }>
  // Higher or Lower.
  cards: number[]
  card: number
  guess: 'up' | 'down' | null
  reveal: number
  right: number
}

export type BreakEvent = {
  prize?: BreakPrize
  points?: number
  sound?: ArcadeSoundName
  x?: number
  y?: number
  text?: string
}

const WHEEL_SLOTS: readonly WheelSlot[] = [
  { label: 'CASH', prize: 'cash', points: 0 },
  { label: 'TOASTER', prize: 'toaster', points: 0 },
  { label: 'CASH', prize: 'cash', points: 0 },
  { label: 'CAR', prize: 'car', points: 0 },
  { label: 'CASH', prize: 'cash', points: 0 },
  { label: 'TOASTER', prize: 'toaster', points: 0 },
  { label: 'BONUS', prize: null, points: 5000 },
  { label: 'CASH', prize: 'cash', points: 0 },
]

export function newBreak(
  kind: BreakKind,
  rng: () => number,
  seats: number,
): BreakState {
  const n = Math.max(1, seats)
  // The wheel's slots in a new order each time (the car never next to itself).
  const slots = [...WHEEL_SLOTS]
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[slots[i], slots[j]] = [slots[j]!, slots[i]!]
  }
  const cards = Array.from(
    { length: BREAK.higher.cards + 1 },
    () => (1 + Math.floor(rng() * 99)) * 10,
  )
  return {
    kind,
    ticks: 0,
    over: -1,
    seats: Array.from({ length: n }, (_, i) => ({
      x: CX + (i - (n - 1) / 2) * 40,
      y: kind === 'pies' ? 140 : BREAK.catch.y,
      splats: 0,
      caught: 0,
      face: 1,
      moving: false,
    })),
    won: [],
    points: 0,
    slots,
    angle: rng() * Math.PI * 2,
    braking: -1,
    spin: 0,
    landed: -1,
    idle: 0,
    falling: [],
    pies: [],
    splatsShown: [],
    cards,
    card: 0,
    guess: null,
    reveal: 0,
    right: 0,
  }
}

const WHEEL_N = WHEEL_SLOTS.length

/** The slot under the pointer (straight up) at a wheel angle. */
export function slotAt(angle: number): number {
  // Slot i spans [i, i+1) * 2PI/N from the wheel's zero; the pointer sits at -PI/2.
  const rel =
    (((-Math.PI / 2 - angle) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
  return Math.floor(rel / ((Math.PI * 2) / WHEEL_N)) % WHEEL_N
}

/** How far the wheel coasts once braked. */
export const WHEEL_COAST = (BREAK.wheel.speed * BREAK.wheel.brake) / 2

function finish(b: BreakState) {
  if (b.over < 0) b.over = 0
}

function pay(
  b: BreakState,
  out: BreakEvent[],
  prize: BreakPrize,
  x: number,
  y: number,
) {
  b.won.push(prize)
  out.push({ prize, x, y, sound: 'pickup' })
}

/** One tick of the break, with every seat's input. Returns what it paid out. */
export function updateBreak(
  b: BreakState,
  inputs: readonly InputFrame[],
  rng: () => number,
): BreakEvent[] {
  const out: BreakEvent[] = []
  b.ticks++
  if (b.over >= 0) {
    b.over++
    return out
  }
  if (b.ticks <= BREAK.intro) return out
  const t = b.ticks - BREAK.intro
  const input = (i: number) => inputs[i] ?? emptyInput()
  switch (b.kind) {
    case 'wheel': {
      const cfg = BREAK.wheel
      if (b.landed >= 0) {
        if (++b.landed >= cfg.pause) {
          b.landed = -1
          if (++b.spin >= cfg.spins) finish(b)
          b.idle = 0
        }
        break
      }
      if (b.braking < 0) {
        b.angle += cfg.speed
        b.idle++
        if (
          inputs.some((f) => f.pressed.a || f.pressed.start) ||
          b.idle >= cfg.wait
        ) {
          b.braking = 0
          out.push({ sound: 'blip' })
        }
        break
      }
      // Braking: it slows evenly to a stop, always the same distance on.
      b.braking++
      b.angle += cfg.speed * (1 - b.braking / cfg.brake)
      if (b.braking >= cfg.brake) {
        b.braking = -1
        b.landed = 0
        const slot = b.slots[slotAt(b.angle)]!
        if (slot.prize) pay(b, out, slot.prize, CX, 60)
        else {
          b.points += slot.points
          out.push({ points: slot.points, x: CX, y: 60, sound: 'extra' })
        }
      }
      break
    }
    case 'catch': {
      const cfg = BREAK.catch
      b.seats.forEach((s, i) => {
        const f = input(i)
        const dx = (f.held.right ? 1 : 0) - (f.held.left ? 1 : 0)
        s.moving = dx !== 0
        if (dx) s.face = dx > 0 ? 1 : -1
        s.x = Math.max(30, Math.min(W - 30, s.x + dx * cfg.speed))
      })
      // Prizes drop from the rafters, faster and thicker as it goes.
      const every = Math.max(12, 30 - Math.floor(t / 90))
      if (t % every === 0) {
        const r = rng()
        b.falling.push({
          x: 30 + rng() * (W - 60),
          y: 34,
          vy: 1 + rng() * (0.8 + t / 1200),
          kind: r < 0.6 ? 'cash' : r < 0.9 ? 'toaster' : 'car',
        })
      }
      for (const f of b.falling) {
        f.y += f.vy
        const s = b.seats.find(
          (seat) =>
            Math.abs(seat.x - f.x) < cfg.reach &&
            Math.abs(seat.y - 8 - f.y) < cfg.reach,
        )
        if (s) {
          s.caught++
          pay(b, out, f.kind, f.x, f.y)
          f.y = H + 50
        }
      }
      b.falling = b.falling.filter((f) => f.y < H)
      if (t >= cfg.ticks) finish(b)
      break
    }
    case 'pies': {
      const cfg = BREAK.pies
      b.seats.forEach((s, i) => {
        const f = input(i)
        const dx = (f.held.right ? 1 : 0) - (f.held.left ? 1 : 0)
        const dy = (f.held.down ? 1 : 0) - (f.held.up ? 1 : 0)
        const len = Math.hypot(dx, dy) || 1
        s.moving = dx !== 0 || dy !== 0
        if (dx) s.face = dx > 0 ? 1 : -1
        s.x = Math.max(40, Math.min(W - 40, s.x + (dx / len) * cfg.speed))
        s.y = Math.max(70, Math.min(206, s.y + (dy / len) * cfg.speed))
      })
      // Pies arc in from the wings at whoever is standing there (the shadow tells where).
      const every = Math.max(16, 42 - Math.floor(t / 60))
      if (t % every === 0) {
        const target = b.seats[Math.floor(rng() * b.seats.length)]!
        const left = rng() < 0.5
        b.pies.push({
          x0: left ? 0 : W,
          y0: 60 + rng() * 120,
          x1: Math.max(40, Math.min(W - 40, target.x + (rng() - 0.5) * 30)),
          y1: Math.max(70, Math.min(206, target.y + (rng() - 0.5) * 24)),
          t: 0,
        })
      }
      for (const p of b.pies) {
        if (++p.t < cfg.flight) continue
        b.splatsShown.push({ x: p.x1, y: p.y1, life: 50 })
        out.push({ sound: 'pop' })
        for (const s of b.seats)
          if (Math.hypot(s.x - p.x1, s.y - p.y1) < cfg.splat) {
            s.splats++
            out.push({ text: 'SPLAT!', x: s.x, y: s.y - 20 })
          }
      }
      b.pies = b.pies.filter((p) => p.t < cfg.flight)
      for (const s of b.splatsShown) s.life--
      b.splatsShown = b.splatsShown.filter((s) => s.life > 0)
      if (t >= cfg.ticks) {
        // The cleaner the contestant, the better the prize.
        b.seats.forEach((s) => {
          const prize: BreakPrize | null =
            s.splats === 0
              ? 'car'
              : s.splats <= 2
                ? 'toaster'
                : s.splats <= 4
                  ? 'cash'
                  : null
          if (prize) pay(b, out, prize, s.x, s.y - 20)
        })
        finish(b)
      }
      break
    }
    case 'higher': {
      const cfg = BREAK.higher
      if (b.reveal > 0) {
        if (--b.reveal > 0) break
        b.card++
        b.guess = null
        b.idle = 0
        if (b.card >= cfg.cards) {
          if (b.right === cfg.cards) pay(b, out, 'car', CX, 100)
          finish(b)
        }
        break
      }
      b.idle++
      const up = inputs.some((f) => f.pressed.up)
      const down = inputs.some((f) => f.pressed.down)
      if (!up && !down && b.idle < cfg.wait) break
      b.guess = down && !up ? 'down' : 'up'
      const now = b.cards[b.card]!
      const next = b.cards[b.card + 1]!
      const right = b.guess === 'up' ? next >= now : next <= now
      if (right) {
        b.right++
        pay(b, out, next >= 700 ? 'toaster' : 'cash', CX, 110)
      } else out.push({ sound: 'warn', text: 'NOPE!', x: CX, y: 110 })
      b.reveal = cfg.reveal
      break
    }
  }
  return out
}

/** The break is over and its results have been on screen long enough. */
export function breakDone(b: BreakState): boolean {
  return b.over >= BREAK.outro
}

/** How the attract pilot plays each break, seat by seat. */
export function breakPilot(b: BreakState, seat: number): InputFrame {
  const frame = emptyInput()
  if (b.ticks <= BREAK.intro || b.over >= 0) return frame
  const s = b.seats[seat]!
  switch (b.kind) {
    case 'wheel': {
      // Brake when the car is the coast's distance short of the pointer.
      const car = b.slots.findIndex((slot) => slot.prize === 'car')
      if (
        seat === 0 &&
        b.braking < 0 &&
        b.landed < 0 &&
        slotAt(b.angle + WHEEL_COAST) === car
      )
        frame.pressed.a = true
      break
    }
    case 'catch': {
      const target = b.falling
        .filter((f) => f.y < s.y)
        .sort((a, c) => (s.y - a.y) / a.vy - (s.y - c.y) / c.vy)[0]
      if (target) {
        if (target.x < s.x - 4) frame.held.left = true
        if (target.x > s.x + 4) frame.held.right = true
      }
      break
    }
    case 'pies': {
      // Step away from every shadow, and back toward the middle when nothing is coming.
      let mx = 0
      let my = 0
      for (const p of b.pies) {
        const d = Math.hypot(s.x - p.x1, s.y - p.y1)
        if (d < 34) {
          mx += (s.x - p.x1) / (d || 1)
          my += (s.y - p.y1) / (d || 1)
        }
      }
      if (Math.abs(mx) + Math.abs(my) < 0.2) {
        mx = (CX + (seat - 1.5) * 40 - s.x) * 0.02
        my = (140 - s.y) * 0.02
      }
      if (mx < -0.2) frame.held.left = true
      if (mx > 0.2) frame.held.right = true
      if (my < -0.2) frame.held.up = true
      if (my > 0.2) frame.held.down = true
      break
    }
    case 'higher':
      if (seat === 0 && b.reveal === 0 && b.idle > 40) {
        if (b.cards[b.card]! < 500) frame.pressed.up = true
        else frame.pressed.down = true
      }
      break
  }
  return frame
}

const PRIZE_SPRITES = {
  cash: CASH_SPRITE,
  toaster: TOASTER_SPRITE,
  car: CAR_SPRITE,
}
const SLOT_RAMPS = [RAMPS.pink, RAMPS.teal, RAMPS.gold, RAMPS.purple] as const

/** Draws a contestant for a seat at (x, y) (her feet), facing `face`, mid-stride if `moving`. */
export type DrawSeat = (
  g: CanvasRenderingContext2D,
  seat: number,
  x: number,
  y: number,
  face: 1 | -1,
  moving: boolean,
) => void

export function renderBreak(
  g: CanvasRenderingContext2D,
  b: BreakState,
  tick: number,
  drawSeat: DrawSeat,
) {
  // A commercial's own bright set: candy stripes and a sponsor banner.
  for (let x = 0; x < W; x += 20) {
    g.fillStyle = (x / 20) % 2 ? RAMPS.pink[1] : RAMPS.purple[1]
    g.fillRect(x, 0, 20, H)
  }
  g.fillStyle = rgba(INK, 0.35)
  g.fillRect(0, 0, W, H)
  const title = BREAK_TITLES[b.kind]
  hudPanel(g, 8, 4, W - 16, 24, RAMPS.gold)
  drawText(g, title.title, CX, 9, {
    align: 'center',
    scale: 2,
    color: '#ffffff',
    outline: INK,
  })
  drawText(g, 'COMMERCIAL BREAK', 14, 30, {
    color: RAMPS.gold[4],
    outline: INK,
  })
  switch (b.kind) {
    case 'wheel':
      renderWheel(g, b, tick)
      break
    case 'catch':
      bevel(g, 10, BREAK.catch.y + 2, W - 20, 8, RAMPS.gold)
      for (const f of b.falling) {
        glow(g, f.x, f.y, 8, RAMPS.gold[3], 0.3)
        drawSprite(g, PRIZE_SPRITES[f.kind], f.x, f.y)
      }
      b.seats.forEach((s, i) => drawSeat(g, i, s.x, s.y, s.face, s.moving))
      break
    case 'pies':
      bevel(g, 30, 60, W - 60, 156, RAMPS.cream, { depth: 1 })
      g.fillStyle = rgba(RAMPS.cream[4], 0.3)
      g.fillRect(32, 62, W - 64, 152)
      for (const sp of b.splatsShown) {
        g.fillStyle = rgba(RAMPS.pink[3], 0.55 * (sp.life / 50))
        g.beginPath()
        g.ellipse(sp.x, sp.y, 12, 6, 0, 0, Math.PI * 2)
        g.fill()
      }
      for (const p of b.pies) {
        const k = p.t / BREAK.pies.flight
        dropShadow(g, p.x1, p.y1, 4 + k * 8, 2 + k * 3, 0.2 + k * 0.4)
      }
      b.seats.forEach((s, i) => {
        drawSeat(g, i, s.x, s.y, s.face, s.moving)
        if (s.splats)
          drawText(g, `${s.splats}`, s.x, s.y - 30, {
            align: 'center',
            color: RAMPS.cream[4],
            outline: INK,
          })
      })
      for (const p of b.pies) {
        const k = p.t / BREAK.pies.flight
        const x = p.x0 + (p.x1 - p.x0) * k
        const y = p.y0 + (p.y1 - p.y0) * k - Math.sin(k * Math.PI) * 50
        shadedOrb(g, x, y, 4, RAMPS.cream)
        g.fillStyle = RAMPS.pink[3]
        g.fillRect(Math.round(x) - 3, Math.round(y) - 4, 6, 2)
      }
      break
    case 'higher':
      renderCards(g, b, tick)
      break
  }
  if (b.ticks <= BREAK.intro) {
    hudPanel(g, 40, 90, W - 80, 50, RAMPS.purple)
    drawText(g, title.how, CX, 108, {
      align: 'center',
      color: RAMPS.gold[4],
      outline: INK,
    })
    drawText(g, 'GET READY...', CX, 122, {
      align: 'center',
      color: '#ffffff',
      outline: INK,
    })
  }
  // The haul so far, along the bottom.
  const counts = { cash: 0, toaster: 0, car: 0 }
  for (const p of b.won) counts[p]++
  hudPanel(g, 8, H - 22, W - 16, 18)
  let x = 22
  for (const kind of ['cash', 'toaster', 'car'] as const) {
    drawSprite(g, PRIZE_SPRITES[kind], x, H - 13)
    drawText(g, `X${counts[kind]}`, x + 12, H - 16, {
      color: '#ffffff',
      shadow: INK,
    })
    x += 56
  }
  if (b.points)
    drawText(g, `+${b.points}`, x + 4, H - 16, {
      color: RAMPS.gold[4],
      shadow: INK,
    })
  if (b.over >= 0)
    drawText(g, "THAT'S THE BREAK! BACK TO THE SHOW", CX, H - 34, {
      align: 'center',
      color: RAMPS.gold[4],
      outline: INK,
    })
}

function renderWheel(g: CanvasRenderingContext2D, b: BreakState, tick: number) {
  const x = CX
  const y = 128
  const r = 64
  g.fillStyle = INK
  g.beginPath()
  g.arc(x, y, r + 3, 0, Math.PI * 2)
  g.fill()
  b.slots.forEach((slot, i) => {
    const a0 = b.angle + (i / WHEEL_N) * Math.PI * 2
    const a1 = a0 + (Math.PI * 2) / WHEEL_N
    const ramp =
      slot.prize === 'car'
        ? RAMPS.ember
        : slot.prize === null
          ? RAMPS.leaf
          : SLOT_RAMPS[i % SLOT_RAMPS.length]!
    g.fillStyle = ramp[2]
    g.beginPath()
    g.moveTo(x, y)
    g.arc(x, y, r, a0, a1)
    g.closePath()
    g.fill()
    const mid = (a0 + a1) / 2
    const sprite = slot.prize ? PRIZE_SPRITES[slot.prize] : null
    if (sprite)
      drawSprite(
        g,
        sprite,
        x + Math.cos(mid) * r * 0.66,
        y + Math.sin(mid) * r * 0.66,
      )
    else
      drawText(
        g,
        '+5K',
        x + Math.cos(mid) * r * 0.66,
        y + Math.sin(mid) * r * 0.66 - 3,
        { align: 'center', color: '#ffffff', outline: INK },
      )
    g.fillStyle = (Math.floor(tick / 6) + i) % 2 ? RAMPS.gold[4] : RAMPS.gold[2]
    g.fillRect(
      Math.round(x + Math.cos(a0) * (r - 3)) - 1,
      Math.round(y + Math.sin(a0) * (r - 3)) - 1,
      3,
      3,
    )
  })
  shadedOrb(g, x, y, 10, RAMPS.gold)
  // The pointer, at the top.
  g.fillStyle = INK
  g.beginPath()
  g.moveTo(x - 7, y - r - 10)
  g.lineTo(x + 7, y - r - 10)
  g.lineTo(x, y - r + 4)
  g.closePath()
  g.fill()
  g.fillStyle = RAMPS.gold[4]
  g.beginPath()
  g.moveTo(x - 5, y - r - 9)
  g.lineTo(x + 5, y - r - 9)
  g.lineTo(x, y - r + 1)
  g.closePath()
  g.fill()
  const slot = b.slots[slotAt(b.angle)]!
  drawText(
    g,
    `SPIN ${Math.min(b.spin + 1, BREAK.wheel.spins)}/${BREAK.wheel.spins}`,
    20,
    44,
    { color: '#ffffff', outline: INK },
  )
  if (b.landed >= 0)
    drawText(
      g,
      slot.prize ? `A ${slot.label}!` : `BONUS ${slot.points}!`,
      CX,
      200,
      { align: 'center', scale: 2, color: RAMPS.gold[4], outline: INK },
    )
  else if (b.braking < 0)
    drawText(g, 'PRESS A TO BRAKE', CX, 204, {
      align: 'center',
      color: Math.floor(tick / 15) % 2 ? RAMPS.gold[4] : '#ffffff',
      outline: INK,
    })
}

function renderCards(g: CanvasRenderingContext2D, b: BreakState, tick: number) {
  const cfg = BREAK.higher
  const card = Math.min(b.card, cfg.cards - 1)
  const showNext = b.reveal > 0
  const draw = (x: number, value: number | null, lit: boolean) => {
    bevel(g, x - 34, 70, 68, 90, lit ? RAMPS.gold : RAMPS.cream)
    g.fillStyle = RAMPS.cream[4]
    g.fillRect(x - 30, 74, 60, 82)
    if (value === null) {
      drawText(g, '?', x, 104, {
        align: 'center',
        scale: 2,
        color: RAMPS.purple[2],
      })
      return
    }
    drawText(g, 'PRICE', x, 92, { align: 'center', color: RAMPS.purple[2] })
    drawText(g, `${value}`, x, 108, { align: 'center', scale: 2, color: INK })
  }
  draw(CX - 50, b.cards[card]!, true)
  draw(CX + 50, showNext ? b.cards[card + 1]! : null, showNext)
  drawText(g, `CARD ${card + 1}/${cfg.cards}   RIGHT ${b.right}`, CX, 50, {
    align: 'center',
    color: '#ffffff',
    outline: INK,
  })
  if (b.reveal === 0 && b.over < 0)
    drawText(g, 'UP: HIGHER   DOWN: LOWER', CX, 176, {
      align: 'center',
      color: Math.floor(tick / 15) % 2 ? RAMPS.gold[4] : '#ffffff',
      outline: INK,
    })
  else if (b.guess)
    drawText(g, b.guess === 'up' ? 'HIGHER!' : 'LOWER!', CX, 176, {
      align: 'center',
      color: RAMPS.teal[3],
      outline: INK,
    })
  if (b.right === cfg.cards && b.over >= 0)
    drawText(g, 'A PERFECT RUN: A CAR!', CX, 192, {
      align: 'center',
      color: RAMPS.gold[4],
      outline: INK,
    })
}
