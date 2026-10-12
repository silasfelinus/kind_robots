// /utils/arcade/kindnessGauntlet/finale.ts
//
// The Old Mainframe (conductor kr-arcade t-054, depth-pass/CABINETS.md section 5, "The Guardians" 5):
// the Deep Archive's finale, a wall of tape drives with a face. guardians.ts runs her through the
// same BossWorld as the other four.
//
//   Phase 1, memory recall  the four earlier Guardians return one at a time at half strength (an echo
//                           of each one's first phase, played out by guardians.ts itself).
//   Phase 2, defrag         blocks of the hall slide and swap on a timer while she fires bits.
//   Phase 3, reboot         hold her four terminals while her boot bar fills (one bot a terminal in
//                           co-op; alone, each terminal holds for six seconds after a touch). Her old
//                           immune system sends glitches the while.
//
// When the bar is full she wakes up herself again, and thanks the bots.

import { drawText } from '../font'
import { INK, RAMPS, bevel, drawSprite, gauge, glow, rgba } from '../snes'
import type { GuardianKind } from './floors'
import type { BossWorld, BossZone, Guardian } from './guardians'
import { MAINFRAME_FACE } from './voice'

const T = 16

/** The Guardians she recalls, in order. */
export const RECALLED: readonly GuardianKind[] = [
  'sorter',
  'reels',
  'attract',
  'bank',
]
export const DEFRAG_EVERY = 200
export const DEFRAG_TELL = 50
const BITS_EVERY = 120
export const TERMINAL_HOLD = 6 * 60
/** Ticks of all four terminals lit that her boot bar needs. */
export const BOOT_TICKS = 10 * 60
const IMMUNE_EVERY = 150

export function mainframeAt(w: BossWorld) {
  const a = w.arena
  return { x: Math.floor((a.x0 + a.x1 + 1) / 2) * T + T / 2, y: a.y0 * T - 30 }
}

/** Her four terminals, in a ring in the middle of the hall. */
export function terminals(w: BossWorld): Array<{ x: number; y: number }> {
  const a = w.arena
  const cx = Math.floor((a.x0 + a.x1 + 1) / 2) * T + T / 2
  const cy = Math.floor((a.y0 + a.y1 + 1) / 2) * T + T / 2
  return [
    { x: cx - 56, y: cy },
    { x: cx, y: cy - 40 },
    { x: cx + 56, y: cy },
    { x: cx, y: cy + 40 },
  ]
}

/** The six defrag blocks' home sections (tile x, y of each 2x2 block's corner). */
function sections(w: BossWorld): Array<{ x: number; y: number }> {
  const a = w.arena
  const out: Array<{ x: number; y: number }> = []
  const cols = 4
  for (let r = 0; r < 2; r++)
    for (let c = 0; c < cols; c++)
      out.push({
        x: a.x0 + 2 + Math.floor(((a.x1 - a.x0 - 4) * c) / (cols - 1)),
        y: a.y0 + 3 + r * 5,
      })
  return out
}

function setBlock(w: BossWorld, b: { x: number; y: number }, on: boolean) {
  for (let dy = 0; dy < 2; dy++)
    for (let dx = 0; dx < 2; dx++) w.deal(b.x + dx, b.y + dy, on)
}

/** Lift every dealt card and block from the hall (an echo or a phase ends). */
function clearHall(w: BossWorld) {
  const a = w.arena
  for (let ty = a.y0; ty <= a.y1; ty++)
    for (let tx = a.x0; tx <= a.x1; tx++) w.deal(tx, ty, false)
}

export type Echo = { kind: GuardianKind; g: Guardian }

/** Phase 1 begins (or moves on): the next recalled Guardian, at half strength. */
export function recallNext(
  g: Guardian,
  w: BossWorld,
  make: (kind: GuardianKind) => Guardian,
): boolean {
  clearHall(w)
  w.clearToken()
  const kind = RECALLED[g.recalled]
  if (!kind) {
    g.echo = null
    return false
  }
  const echo = make(kind)
  echo.phaseHp = Math.max(1, Math.round(echo.phaseHp / 2))
  echo.hp = echo.phaseHp
  g.echo = echo
  w.phase(
    [
      'I REMEMBER THE CARD SORTER...',
      'I REMEMBER THE TWIN REELS...',
      'I REMEMBER THE ATTRACT MODE...',
      'I REMEMBER THE CLOUD BANK...',
    ][g.recalled] ?? 'I REMEMBER...',
  )
  return true
}

export function enterFinalePhase(g: Guardian, w: BossWorld) {
  clearHall(w)
  g.echo = null
  if (g.phase === 2) {
    g.pillars = sections(w)
      .slice(0, 6)
      .map((s) => ({ ...s, dx: 0 }))
    for (const b of g.pillars) setBlock(w, b, true)
    return
  }
  g.coins = [0, 0, 0, 0]
  g.boot = 0
}

export function finaleZones(g: Guardian, w: BossWorld): BossZone[] {
  if (g.phase === 3) return []
  const m = mainframeAt(w)
  return [{ x: m.x, y: m.y + 18, r: 24, id: 0 }]
}

/** One tick of her phases 2 and 3 (phase 1 is the echo's own rules). True when she has booted. */
export function updateFinale(g: Guardian, w: BossWorld): boolean {
  const m = mainframeAt(w)
  if (g.phase === 2) {
    const at = g.t % DEFRAG_EVERY
    if (at === DEFRAG_EVERY - DEFRAG_TELL) w.play('warn')
    if (at === 0) {
      // Defrag: every block slides to a fresh section, two at a time swapping places.
      const homes = sections(w)
      const order = homes.map((h, i) => ({ h, k: w.rng() + i * 0 }))
      order.sort((a, b) => a.k - b.k)
      for (const b of g.pillars) setBlock(w, b, false)
      g.pillars.forEach((b, i) => {
        const to = order[i]!.h
        b.x = to.x
        b.y = to.y
      })
      for (const b of g.pillars) setBlock(w, b, true)
      w.play('pop')
    }
    if (g.t % BITS_EVERY === BITS_EVERY - 1) {
      const bots = w.bots()
      const near = bots[Math.floor(w.rng() * bots.length)]
      if (near) {
        const base = Math.atan2(near.y - (m.y + 30), near.x - m.x)
        for (const off of [-0.3, 0, 0.3])
          w.card(
            m.x,
            m.y + 32,
            Math.cos(base + off) * 1.5,
            Math.sin(base + off) * 1.5,
          )
        w.play('shoot')
      }
    }
    return false
  }
  if (g.phase !== 3) return false
  const spots = terminals(w)
  const hold = w.seats() > 1 ? 20 : TERMINAL_HOLD
  spots.forEach((s, i) => {
    if (w.bots().some((b) => Math.hypot(b.x - s.x, b.y - s.y) < 12)) {
      if (g.coins[i]! <= 0) w.play('pickup')
      g.coins[i] = hold
    } else if (g.coins[i]! > 0) g.coins[i]!--
  })
  const lit = g.coins.filter((c) => c > 0).length
  g.boot = Math.max(
    0,
    Math.min(1, g.boot + (lit === 4 ? 1 / BOOT_TICKS : -1 / (BOOT_TICKS * 3))),
  )
  if (g.t % IMMUNE_EVERY === IMMUNE_EVERY - 1 && g.boot < 1) {
    w.spawn('glitch', m.x + (w.rng() - 0.5) * 80, w.arena.y0 * T + 10, false)
    w.play('blip')
  }
  return g.boot >= 1
}

// --- drawing ---------------------------------------------------------------------------------------

export function renderFinale(
  c: CanvasRenderingContext2D,
  g: Guardian,
  w: BossWorld,
) {
  const { x, y } = mainframeAt(w)
  const white = g.flash > 0 && g.flash % 2 === 0
  const awake = g.done
  glow(c, x, y, 90, awake ? RAMPS.leaf[3] : RAMPS.gold[3], 0.25)
  // A wall of tape drives: two banks of reels either side of her face.
  for (const side of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      const bx = x + side * (52 + k * 28) - 12
      bevel(c, bx, y - 34, 24, 64, white ? RAMPS.steel : RAMPS.cream, {
        depth: 1,
      })
      for (const ry of [y - 22, y + 4]) {
        const spin = awake || g.phase === 3 ? g.t / 5 : g.t / 20
        c.fillStyle = INK
        c.beginPath()
        c.arc(bx + 12, ry, 8, 0, Math.PI * 2)
        c.fill()
        c.fillStyle = RAMPS.steel[3]
        c.beginPath()
        c.arc(bx + 12, ry, 7, 0, Math.PI * 2)
        c.fill()
        c.fillStyle = INK
        for (let s = 0; s < 3; s++) {
          const a = spin * side + (s * Math.PI * 2) / 3
          c.fillRect(
            Math.round(bx + 12 + Math.cos(a) * 4) - 1,
            Math.round(ry + Math.sin(a) * 4) - 1,
            2,
            2,
          )
        }
      }
    }
  }
  // Her face, four times life size; it talks while she fights.
  drawSprite(c, MAINFRAME_FACE[Math.floor(g.t / 10) % 2]!, x, y, { scale: 4 })
  if (!awake && g.phase === 3) {
    // The boot screen across her brow.
    c.fillStyle = INK
    c.fillRect(x - 40, y - 46, 80, 10)
    gauge(c, x - 38, y - 44, 76, 6, g.boot, RAMPS.leaf)
    drawText(c, 'BOOTING', x, y - 56, {
      align: 'center',
      color: RAMPS.leaf[4],
      outline: INK,
    })
    terminals(w).forEach((s, i) => {
      const lit = g.coins[i]! > 0
      if (lit) glow(c, s.x, s.y, 16, RAMPS.leaf[3], 0.6)
      bevel(c, s.x - 8, s.y - 8, 16, 16, lit ? RAMPS.leaf : RAMPS.steel, {
        depth: 1,
      })
      c.fillStyle = INK
      c.fillRect(s.x - 5, s.y - 5, 10, 6)
      c.fillStyle = lit ? RAMPS.leaf[4] : RAMPS.night[2]
      c.fillRect(s.x - 4, s.y - 4, 8, 4)
      if (lit && w.seats() === 1)
        gauge(
          c,
          s.x - 7,
          s.y + 10,
          14,
          2,
          g.coins[i]! / TERMINAL_HOLD,
          RAMPS.leaf,
        )
      if (!lit && Math.floor(g.t / 15) % 2 === 0)
        drawText(c, 'HOLD', s.x, s.y - 18, {
          align: 'center',
          color: RAMPS.leaf[4],
          outline: INK,
        })
    })
  }
  if (g.phase === 2 && !awake) {
    const telling = g.t % DEFRAG_EVERY > DEFRAG_EVERY - DEFRAG_TELL
    for (const b of g.pillars) {
      const px = b.x * T
      const py = b.y * T
      bevel(c, px, py, T * 2, T * 2, RAMPS.cream, { depth: 2 })
      c.fillStyle = telling && g.t % 8 < 4 ? RAMPS.ember[3] : RAMPS.sky[2]
      for (let k = 0; k < 4; k++)
        c.fillRect(
          px + 4 + (k % 2) * 13,
          py + 4 + Math.floor(k / 2) * 13,
          11,
          10,
        )
    }
  }
  if (g.phase < 3 && !awake) {
    c.fillStyle = INK
    c.fillRect(x - 31, y - 49, 62, 5)
    const echo = g.echo
    const hp = echo
      ? Math.max(0, echo.hp) / echo.phaseHp
      : Math.max(0, g.hp) / g.phaseHp
    gauge(c, x - 30, y - 48, 60, 3, hp, g.phase === 2 ? RAMPS.gold : RAMPS.sky)
    if (g.phase === 1)
      for (let i = 0; i < RECALLED.length; i++) {
        c.fillStyle = i < g.recalled ? RAMPS.night[2] : RAMPS.sky[3]
        c.fillRect(x - 30 + i * 8, y - 42, 6, 2)
      }
  }
  if (awake) {
    c.fillStyle = rgba(RAMPS.leaf[4], 0.5)
    c.fillRect(x - 2, y - 52, 4, 6)
  }
}
