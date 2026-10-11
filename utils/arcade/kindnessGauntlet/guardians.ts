// /utils/arcade/kindnessGauntlet/guardians.ts
//
// The Guardians of the Deep Archive (conductor kr-arcade t-052, depth-pass/CABINETS.md section 5,
// "The Guardians"). Each wing ends in a Guardian's hall: a great old machine of its era, fought in
// three phases. The game hands each one a small BossWorld (its arena, the bots, the walls it may
// deal) and asks it where it can be hit; the rules, and the drawing, live here.
//
//   The Card Sorter   deals rows of card walls and reshuffles them on a whistle (find the gap),
//                     then fires fans of punch cards, then jams: spark its card slot while the
//                     walls are still.
//   The Twin Reels    two reels joined by a tape that sweeps the hall like a moving wall (ride the
//                     gaps), then spin apart to opposite corners with the tape drawn tight between
//                     them (each fought on its own), then the tape snaps and whips: spark both
//                     reels within three seconds of each other.
//
// Cartoon rules: a Guardian is never destroyed, it is reminded who it is. When the last phase ends
// it powers down with a happy chime and the stairs open.

import { drawText } from '../font'
import { INK, RAMPS, bevel, dropShadow, gauge, glow, rgba } from '../snes'
import type { ArcadeSoundName } from '../sound'
import type { GuardianKind } from './floors'
import type { Prey } from './roster'

const T = 16

export type Reel = {
  x: number
  y: number
  hp: number
  max: number
  /** Ticks left stalled at zero (phase 3), or forever downed (phase 2) while > 0. */
  stall: number
  flash: number
  /** Its whip's angle (phase 3). */
  spin: number
}

export type Guardian = {
  kind: GuardianKind
  phase: 1 | 2 | 3
  hp: number
  /** Hits this phase takes (scaled for the seats), and the seats' scale. */
  phaseHp: number
  scale: number
  t: number
  flash: number
  done: boolean
  /** The Card Sorter's deal rows (tile y) and each row's gap (tile x of its left half). */
  rows: number[]
  gaps: number[]
  /** Its card slot is open (phase 3), and its next fan's wind-up. */
  slot: number
  fanTell: number
  /** Ticks its hoppers hang open after a fan (phase 2: the only time it can be hit). */
  fanOpen: number
  reels: Reel[]
  /** The tape's sweep (phase 1): its height, its heading, and its two gaps (0..1 along it). */
  sweep: number
  heading: number
  holes: number[]
  /** Per-seat cooldown after the tape catches a bot. */
  caught: number[]
}

/** What a Guardian may sense and do: the game implements it. */
export interface BossWorld {
  readonly tick: number
  rng(): number
  /** The hall's open floor, in tiles (inclusive). */
  readonly arena: { x0: number; y0: number; x1: number; y1: number }
  bots(): Prey[]
  /** Deal (or lift) a card wall on a tile; a bot standing there is nudged off first. */
  deal(tx: number, ty: number, on: boolean): void
  /** A punch card flying from (x, y). */
  card(x: number, y: number, vx: number, vy: number): void
  drain(p: Prey, amount: number): void
  shove(p: Prey, dx: number, dy: number): void
  play(name: ArcadeSoundName): void
  /** The Mainframe has something to say about it. */
  phase(text: string): void
}

/** A hit zone: where a spark can land on the Guardian. */
export type BossZone = { x: number; y: number; r: number; id: number }

const SORTER_CYCLE = 260
const SORTER_WHISTLE = 70
const SLOT_OPEN = 130
const SLOT_CYCLE = 320
const FAN_EVERY = 110
const FAN_TELL = 32
const FAN_OPEN = 55
const REEL_R = 12
const TAPE_HALF = 5
const HOLE = 30
const WHIP = 74
const BOTH_WITHIN = 3 * 60
/**
 * Hits each phase takes from one bot: the Sorter's slot (phase 3) is small and only open now and
 * then; each Twin Reel takes its share in phases 2 and 3.
 */
const PHASE_HITS: Record<GuardianKind, readonly [number, number, number]> = {
  sorter: [30, 24, 16],
  reels: [32, 22, 16],
}

export function newGuardian(
  kind: GuardianKind,
  w: BossWorld,
  seats: number,
): Guardian {
  const scale = 1 + 0.5 * (seats - 1)
  const a = w.arena
  const g: Guardian = {
    kind,
    phase: 1,
    phaseHp: Math.round(PHASE_HITS[kind][0] * scale),
    scale,
    hp: 0,
    t: 0,
    flash: 0,
    done: false,
    rows: [],
    gaps: [],
    slot: 0,
    fanTell: 0,
    fanOpen: 0,
    reels: [],
    sweep: (a.y0 + 1) * T,
    heading: 1,
    holes: [0.3, 0.7],
    caught: [0, 0, 0, 0],
  }
  g.hp = g.phaseHp
  if (kind === 'sorter') {
    g.rows = [a.y0 + 3, a.y0 + 6, a.y0 + 9]
    shuffle(g, w)
  } else {
    const y = g.sweep
    g.reels = [reel((a.x0 + 1) * T, y), reel((a.x1 + 1) * T - T, y)]
    rollHoles(g, w)
  }
  return g
}

function reel(x: number, y: number): Reel {
  return { x, y, hp: 0, max: 0, stall: 0, flash: 0, spin: 0 }
}

/** The Card Sorter deals its rows anew, each with a two-tile gap somewhere else. */
function shuffle(g: Guardian, w: BossWorld) {
  const a = w.arena
  const span = a.x1 - a.x0 - 1
  g.rows.forEach((ty, i) => {
    const old = g.gaps[i]
    let gap = a.x0 + Math.floor(w.rng() * span)
    if (old !== undefined && Math.abs(gap - old) < 3)
      gap = a.x0 + ((gap - a.x0 + Math.floor(span / 2)) % span)
    g.gaps[i] = gap
    for (let tx = a.x0; tx <= a.x1; tx++)
      w.deal(tx, ty, tx !== gap && tx !== gap + 1)
  })
}

function rollHoles(g: Guardian, w: BossWorld) {
  const first = 0.15 + w.rng() * 0.3
  g.holes = [first, first + 0.3 + w.rng() * 0.25]
}

/** The sorter's body (top centre of its hall, its slot over a tile's middle). */
export function sorterAt(w: BossWorld) {
  const a = w.arena
  return { x: Math.floor((a.x0 + a.x1 + 1) / 2) * T + T / 2, y: a.y0 * T - 22 }
}

/** Where sparks can land this tick. */
export function bossZones(g: Guardian, w: BossWorld): BossZone[] {
  if (g.done) return []
  if (g.kind === 'sorter') {
    const s = sorterAt(w)
    if (g.phase === 1 || (g.phase === 2 && g.fanOpen > 0))
      return [{ x: s.x, y: s.y + 10, r: 22, id: 0 }]
    if (g.phase === 2) return []
    return g.slot > 0 ? [{ x: s.x, y: s.y + 16, r: 9, id: 0 }] : []
  }
  return g.reels
    .map((r, id) => ({ x: r.x, y: r.y, r: REEL_R, id, down: r.stall > 0 }))
    .filter((z) => !(z.down && g.phase === 2))
    .map(({ x, y, r, id }) => ({ x, y, r, id }))
}

/** A spark (or a jolt) lands on a zone. */
export function hitBoss(g: Guardian, w: BossWorld, id: number, damage: number) {
  if (g.done) return
  g.flash = 6
  w.play('blip')
  if (g.kind === 'sorter' || g.phase === 1) {
    g.hp -= damage
    if (g.kind === 'reels') for (const r of g.reels) r.flash = 6
    if (g.hp <= 0) nextPhase(g, w)
    return
  }
  const r = g.reels[id]
  if (!r || (r.stall > 0 && g.phase === 2)) return
  r.flash = 6
  if (r.hp <= 0) return
  r.hp = Math.max(0, r.hp - damage)
  if (r.hp > 0) return
  if (g.phase === 2) {
    r.stall = 1
    w.play('boom')
    if (g.reels.every((o) => o.stall > 0)) nextPhase(g, w)
    return
  }
  // Phase 3: it stalls; if its twin is already stalled, they both power down.
  r.stall = BOTH_WITHIN
  w.play('boom')
  if (g.reels.every((o) => o.stall > 0)) nextPhase(g, w)
  else w.phase('NOW THE OTHER ONE! QUICK!')
}

function nextPhase(g: Guardian, w: BossWorld) {
  if (g.phase === 3) {
    g.done = true
    g.flash = 30
    if (g.kind === 'sorter') {
      const a = w.arena
      for (const ty of g.rows)
        for (let tx = a.x0; tx <= a.x1; tx++) w.deal(tx, ty, false)
    }
    w.play('level')
    return
  }
  g.phase = (g.phase + 1) as 2 | 3
  g.phaseHp = Math.round(PHASE_HITS[g.kind][g.phase - 1]! * g.scale)
  g.hp = g.phaseHp
  g.t = 0
  g.flash = 20
  w.play('boom')
  if (g.kind === 'sorter') {
    w.phase(
      g.phase === 2
        ? 'IT IS DEALING CARDS AT YOU!'
        : 'IT JAMMED! SPARK THE SLOT!',
    )
    return
  }
  const a = w.arena
  for (const r of g.reels) {
    r.max = g.phaseHp
    r.hp = r.max
    r.stall = 0
  }
  w.phase(
    g.phase === 2
      ? 'THE REELS SPLIT UP! TAKE ONE EACH!'
      : 'THE TAPE SNAPPED! SPARK BOTH AT ONCE!',
  )
  if (g.phase === 2) {
    g.reels[0]!.y = (a.y0 + 1) * T
    g.reels[1]!.y = (a.y1 + 1) * T - T
  }
}

/** One tick of the Guardian's own rules. */
export function updateGuardian(g: Guardian, w: BossWorld) {
  if (g.flash > 0) g.flash--
  for (const r of g.reels) if (r.flash > 0) r.flash--
  for (let i = 0; i < g.caught.length; i++) if (g.caught[i]! > 0) g.caught[i]!--
  if (g.done) return
  g.t++
  if (g.kind === 'sorter') sorter(g, w)
  else reels(g, w)
}

function sorter(g: Guardian, w: BossWorld) {
  if (g.phase === 1) {
    const at = g.t % SORTER_CYCLE
    if (at === SORTER_CYCLE - SORTER_WHISTLE) w.play('warn')
    if (at === 0) {
      shuffle(g, w)
      w.play('pop')
    }
    return
  }
  if (g.phase === 2) {
    if (g.t % FAN_EVERY === FAN_EVERY - FAN_TELL) {
      g.fanTell = FAN_TELL
      w.play('warn')
    }
    if (g.fanTell > 0 && --g.fanTell === 0) {
      fan(g, w)
      g.fanOpen = FAN_OPEN
    }
    if (g.fanOpen > 0) g.fanOpen--
    return
  }
  // Phase 3, jammed: the slot opens with the walls still, then closes and the walls reshuffle.
  const at = g.t % SLOT_CYCLE
  if (at === 1) {
    g.slot = SLOT_OPEN
    w.play('pickup')
  }
  if (g.slot > 0) g.slot--
  if (at === SLOT_CYCLE - SORTER_WHISTLE) w.play('warn')
  if (at === 0) shuffle(g, w)
}

/** A fan of five punch cards toward the nearest bot. */
function fan(g: Guardian, w: BossWorld) {
  const s = sorterAt(w)
  const bots = w.bots()
  if (!bots.length) return
  const near = bots.reduce((a, b) =>
    Math.hypot(a.x - s.x, a.y - s.y) <= Math.hypot(b.x - s.x, b.y - s.y)
      ? a
      : b,
  )
  const base = Math.atan2(near.y - (s.y + 22), near.x - s.x)
  for (let i = -2; i <= 2; i++) {
    const a = base + i * 0.26
    w.card(s.x, s.y + 24, Math.cos(a) * 1.6, Math.sin(a) * 1.6)
  }
  w.play('shoot')
}

/** The two tape ends this tick (the whole tape in phases 1 and 2). */
export function tapeOf(
  g: Guardian,
): Array<{ ax: number; ay: number; bx: number; by: number }> {
  if (g.kind !== 'reels' || g.done) return []
  const [l, r] = g.reels as [Reel, Reel]
  if (g.phase < 3) return [{ ax: l.x, ay: l.y, bx: r.x, by: r.y }]
  return g.reels
    .filter((reel) => reel.stall <= 0)
    .map((reel) => ({
      ax: reel.x,
      ay: reel.y,
      bx: reel.x + Math.cos(reel.spin) * WHIP,
      by: reel.y + Math.sin(reel.spin) * WHIP,
    }))
}

/** How far (x, y) is from a tape, and where along it (0..1). */
export function nearTape(
  seg: { ax: number; ay: number; bx: number; by: number },
  x: number,
  y: number,
): { d: number; t: number } {
  const dx = seg.bx - seg.ax
  const dy = seg.by - seg.ay
  const len2 = dx * dx + dy * dy || 1
  const t = Math.max(
    0,
    Math.min(1, ((x - seg.ax) * dx + (y - seg.ay) * dy) / len2),
  )
  return { d: Math.hypot(seg.ax + dx * t - x, seg.ay + dy * t - y), t }
}

/** Is this point of the phase-1 tape one of its gaps? */
export function inHole(g: Guardian, t: number, length: number): boolean {
  if (g.phase !== 1) return false
  return g.holes.some((h) => Math.abs(t - h) * length < HOLE / 2)
}

function reels(g: Guardian, w: BossWorld) {
  const a = w.arena
  const [l, r] = g.reels as [Reel, Reel]
  if (g.phase === 1) {
    // The tape sweeps the hall top to bottom and back, its gaps moving each pass.
    g.sweep += 0.42 * g.heading
    const top = (a.y0 + 0.6) * T
    const bottom = (a.y1 + 0.4) * T
    if (g.sweep > bottom || g.sweep < top) {
      g.heading = -g.heading
      g.sweep = Math.max(top, Math.min(bottom, g.sweep))
      rollHoles(g, w)
      w.play('blip')
    }
    l.y = r.y = g.sweep
  } else if (g.phase === 3) {
    // Snapped: each live reel whips its tape round and creeps after the bots.
    g.reels.forEach((reel, i) => {
      if (reel.stall > 0) {
        if (--reel.stall === 0) {
          reel.hp = Math.round(reel.max * 0.4)
          w.phase('IT WOUND ITSELF BACK UP!')
        }
        return
      }
      reel.spin += i === 0 ? 0.035 : -0.04
      const bots = w.bots()
      const prey = bots[i % Math.max(1, bots.length)]
      if (prey) {
        const dx = prey.x - reel.x
        const dy = prey.y - reel.y
        const d = Math.hypot(dx, dy) || 1
        reel.x = Math.max(
          (a.x0 + 1) * T,
          Math.min(a.x1 * T, reel.x + (dx / d) * 0.3),
        )
        reel.y = Math.max(
          (a.y0 + 1) * T,
          Math.min(a.y1 * T, reel.y + (dy / d) * 0.3),
        )
      }
    })
  }
  // The tape catches any bot it crosses (not in a gap), and shoves it along.
  for (const seg of tapeOf(g)) {
    const length = Math.hypot(seg.bx - seg.ax, seg.by - seg.ay)
    for (const p of w.bots()) {
      if ((g.caught[p.seat] ?? 0) > 0) continue
      const near = nearTape(seg, p.x, p.y)
      if (near.d > TAPE_HALF + 4 || inHole(g, near.t, length)) continue
      g.caught[p.seat] = 45
      w.drain(p, 12)
      if (g.phase === 1) w.shove(p, 0, g.heading)
      else {
        const nx = -(seg.by - seg.ay) / (length || 1)
        const ny = (seg.bx - seg.ax) / (length || 1)
        const side = (p.x - seg.ax) * nx + (p.y - seg.ay) * ny >= 0 ? 1 : -1
        w.shove(p, nx * side, ny * side)
      }
      w.play('warn')
    }
  }
}

// --- drawing ---------------------------------------------------------------------------------------

/** The Guardian, its tape or rows, and a health bar per phase. */
export function renderGuardian(
  c: CanvasRenderingContext2D,
  g: Guardian,
  w: BossWorld,
) {
  if (g.kind === 'sorter') renderSorter(c, g, w)
  else renderReels(c, g)
}

function renderSorter(c: CanvasRenderingContext2D, g: Guardian, w: BossWorld) {
  const s = sorterAt(w)
  const x = Math.round(s.x)
  const y = Math.round(s.y)
  const lit = g.flash > 0 && g.flash % 2 === 0
  // A great beige card machine set into the wall: hoppers, a card slot, a lamp per phase.
  glow(
    c,
    x,
    y + 4,
    60,
    g.done ? RAMPS.leaf[3] : RAMPS.gold[3],
    g.done ? 0.35 : 0.2,
  )
  const body: readonly [string, string, string, string, string] = lit
    ? ['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff']
    : ['#3a2a20', '#7a5c44', '#c9a77f', '#e8d3b0', '#fff5e0']
  bevel(c, x - 60, y - 26, 120, 50, body, { depth: 2 })
  for (let i = 0; i < 5; i++) {
    const hx = x - 52 + i * 22
    bevel(c, hx, y - 22, 16, 14, RAMPS.earth, { depth: 1 })
    // Cards fanned in each hopper, riffling while it shuffles.
    const riffle =
      g.phase === 1 && g.t % 260 > 190 ? Math.floor(g.t / 3) % 3 : 0
    for (let k = 0; k < 3; k++) {
      c.fillStyle = k === riffle ? RAMPS.cream[4] : RAMPS.cream[3]
      c.fillRect(hx + 2 + k * 4, y - 26 - k, 3, 8)
      c.fillStyle = INK
      c.fillRect(hx + 3 + k * 4, y - 23 - k, 1, 1)
    }
  }
  // Two lamp eyes and the slot mouth.
  for (const ex of [x - 24, x + 24]) {
    c.fillStyle = INK
    c.fillRect(ex - 5, y - 4, 10, 8)
    c.fillStyle = g.done
      ? RAMPS.leaf[3]
      : g.phase === 3
        ? RAMPS.ember[3]
        : RAMPS.gold[4]
    c.fillRect(ex - 4, y - 3, 8, 6)
    c.fillStyle = '#ffffff'
    c.fillRect(ex - 3, y - 2, 2, 2)
  }
  const open = g.phase === 3 && g.slot > 0
  c.fillStyle = INK
  c.fillRect(x - 14, y + 12, 28, open ? 8 : 3)
  if (open) {
    glow(c, x, y + 16, 14 + Math.sin(g.t / 4) * 2, RAMPS.ember[3], 0.6)
    c.fillStyle = RAMPS.ember[3]
    c.fillRect(x - 12, y + 14, 24, 4)
    if (Math.floor(g.t / 8) % 2 === 0)
      drawText(c, 'SLOT!', x, y + 26, {
        align: 'center',
        color: RAMPS.gold[4],
        outline: INK,
      })
  }
  if (g.fanTell > 0) glow(c, x, y + 20, 18, RAMPS.gold[4], 0.7)
  if (g.fanOpen > 0) {
    // Its hoppers hang open after a fan: the moment to spark it.
    glow(c, x, y - 14, 40, RAMPS.ember[3], 0.35 + 0.15 * Math.sin(g.t / 3))
    if (Math.floor(g.t / 8) % 2 === 0)
      drawText(c, 'OPEN!', x, y + 26, {
        align: 'center',
        color: RAMPS.gold[4],
        outline: INK,
      })
  }
  if (!g.done) {
    const a = w.arena
    const whistle =
      g.phase !== 2 &&
      g.t % (g.phase === 1 ? 260 : 320) > (g.phase === 1 ? 190 : 250)
    if (whistle && Math.floor(g.t / 6) % 2 === 0)
      drawText(c, 'TWEET!', x + 70, y - 10, {
        align: 'center',
        color: RAMPS.sky[4],
        outline: INK,
      })
    // The rows' gaps glow, so the way through reads at a glance.
    for (let i = 0; i < g.rows.length; i++) {
      const gx = (g.gaps[i]! + 1) * T
      const gy = g.rows[i]! * T + T / 2
      if (gx > a.x0 * T) glow(c, gx, gy, 14, RAMPS.leaf[3], 0.25)
    }
    bossBar(c, g, x, y - 34)
  }
}

function bossBar(
  c: CanvasRenderingContext2D,
  g: Guardian,
  x: number,
  y: number,
) {
  c.fillStyle = INK
  c.fillRect(x - 31, y - 1, 62, 5)
  gauge(
    c,
    x - 30,
    y,
    60,
    3,
    Math.max(0, g.hp) / g.phaseHp,
    g.phase === 3 ? RAMPS.ember : g.phase === 2 ? RAMPS.gold : RAMPS.leaf,
  )
  for (let i = 0; i < 3; i++) {
    c.fillStyle = i < 4 - g.phase ? RAMPS.pink[3] : RAMPS.night[2]
    c.fillRect(x + 34 + i * 4, y, 3, 3)
  }
}

function renderReels(c: CanvasRenderingContext2D, g: Guardian) {
  // The tape first, under the reels.
  for (const seg of tapeOf(g)) {
    const length = Math.hypot(seg.bx - seg.ax, seg.by - seg.ay)
    const steps = Math.ceil(length / 2)
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      if (inHole(g, t, length)) continue
      const px = seg.ax + (seg.bx - seg.ax) * t
      const py = seg.ay + (seg.by - seg.ay) * t
      c.fillStyle = INK
      c.fillRect(Math.round(px) - 1, Math.round(py) - 3, 3, 6)
      c.fillStyle =
        (i + Math.floor(g.t / 3)) % 6 < 3 ? RAMPS.earth[2] : RAMPS.earth[1]
      c.fillRect(Math.round(px) - 1, Math.round(py) - 2, 2, 4)
    }
    // The gaps' edges shine, so riders can line up on them.
    if (g.phase === 1)
      for (const h of g.holes) {
        const hx = seg.ax + (seg.bx - seg.ax) * h
        const hy = seg.ay + (seg.by - seg.ay) * h
        glow(c, hx, hy, 12, RAMPS.leaf[3], 0.35)
      }
  }
  g.reels.forEach((r) => {
    const x = Math.round(r.x)
    const y = Math.round(r.y)
    const down = r.stall > 0
    dropShadow(c, x, y + 13, 12, 3, 0.45)
    glow(c, x, y, 20, down ? RAMPS.leaf[3] : RAMPS.rust[3], 0.3)
    const white = r.flash > 0 && r.flash % 2 === 0
    c.fillStyle = INK
    c.beginPath()
    c.arc(x, y, REEL_R + 1, 0, Math.PI * 2)
    c.fill()
    c.fillStyle = white ? '#ffffff' : RAMPS.steel[3]
    c.beginPath()
    c.arc(x, y, REEL_R, 0, Math.PI * 2)
    c.fill()
    c.fillStyle = white ? '#ffffff' : RAMPS.earth[1]
    c.beginPath()
    c.arc(x, y, REEL_R - 3, 0, Math.PI * 2)
    c.fill()
    // Three spokes turning (stopped while stalled).
    const turn = down ? 0 : g.t / (g.phase === 3 ? 4 : 8)
    for (let k = 0; k < 3; k++) {
      const a = turn + (k * Math.PI * 2) / 3
      c.fillStyle = RAMPS.steel[4]
      c.fillRect(
        Math.round(x + Math.cos(a) * 5) - 1,
        Math.round(y + Math.sin(a) * 5) - 1,
        3,
        3,
      )
    }
    c.fillStyle = INK
    c.fillRect(x - 2, y - 2, 4, 4)
    // Eyes on the rim: worried when stalled.
    for (const ex of [-4, 4]) {
      c.fillStyle = '#ffffff'
      c.fillRect(x + ex - 1, y - REEL_R + 2, 3, 3)
      c.fillStyle = INK
      c.fillRect(x + ex, y - REEL_R + (down ? 4 : 3), 1, 1)
    }
    if (g.phase > 1 && !g.done) {
      c.fillStyle = INK
      c.fillRect(x - 13, y + REEL_R + 3, 26, 4)
      gauge(
        c,
        x - 12,
        y + REEL_R + 4,
        24,
        2,
        r.max ? r.hp / r.max : 0,
        RAMPS.ember,
      )
      if (g.phase === 3 && down)
        gauge(
          c,
          x - 12,
          y - REEL_R - 7,
          24,
          2,
          r.stall / BOTH_WITHIN,
          RAMPS.sky,
        )
    }
  })
  if (g.phase === 1 && !g.done) {
    const [l, r] = g.reels as [Reel, Reel]
    bossBar(c, g, (l.x + r.x) / 2, l.y - 20)
  }
  if (g.done)
    for (const r of g.reels) {
      c.fillStyle = rgba(RAMPS.leaf[4], 0.6)
      c.fillRect(Math.round(r.x) - 1, Math.round(r.y) - 20, 2, 4)
    }
}
