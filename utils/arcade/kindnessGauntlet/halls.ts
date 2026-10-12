// /utils/arcade/kindnessGauntlet/halls.ts
//
// The Guardians of the middle wings (conductor kr-arcade t-053, depth-pass/CABINETS.md section 5,
// "The Guardians" 3 and 4); guardians.ts runs them through the same BossWorld as the Card Sorter and
// the Twin Reels.
//
//   The Attract Mode  a giant cabinet playing a demo of the earlier floors. Its screen projects ghost
//                     copies of old glitches; then it "plays" you, marching blocks of wall about the
//                     hall in demo patterns; then its game-over screen counts down, and the bots stand
//                     on its four coin slots to continue (solo, each slot holds for six seconds) and
//                     the cabinet turns friendly.
//   The Cloud Bank    a fluffy cloud of servers raining glitch drops, each on a tell; then wind shoves
//                     the bots toward the static vents along a wall; then lightning chases whoever
//                     holds the Hug Token, and the Token steers it back into the Bank.

import { drawText } from '../font'
import { INK, RAMPS, bevel, dropShadow, gauge, glow, rgba } from '../snes'
import type { BossWorld, BossZone, Guardian } from './guardians'

const T = 16

/** Ghost glitches the Attract Mode's screen projects, in turn: the earlier wings' cast. */
export const ATTRACT_GHOSTS = [
  'brute',
  'popup',
  'pickpocket',
  'imp',
  'worm',
  'glitch',
] as const
const GHOST_EVERY = 150
const PILLAR_STEP = 22
/** Its continue screen's countdown, and how long a coin slot stays lit for a lone bot. */
export const CONTINUE_TICKS = 12 * 60
export const SOLO_HOLD = 6 * 60
const DROP_EVERY = [48, 80]
export const DROP_TELL = 60
const DROP_SPLASH = 15
const WIND_SWAP = 5 * 60
export const BOLT_EVERY = 130
export const BOLT_TELL = 45
const BOLT_SPLASH = 16

export function attractAt(w: BossWorld) {
  const a = w.arena
  return { x: Math.floor((a.x0 + a.x1 + 1) / 2) * T + T / 2, y: a.y0 * T - 26 }
}

/** The four coin slots in front of the cabinet. */
export function coinSlots(w: BossWorld): Array<{ x: number; y: number }> {
  const c = attractAt(w)
  const y = w.arena.y0 * T + 40
  return [-56, -20, 20, 56].map((dx) => ({ x: c.x + dx, y }))
}

export function bankAt(g: Guardian, w: BossWorld) {
  return { x: g.bankX, y: w.arena.y0 * T + 26 }
}

/** The lightning's reach: the Bank is struck when a bolt lands under it. */
export function underBank(g: Guardian, w: BossWorld, x: number, y: number) {
  const b = bankAt(g, w)
  return Math.abs(x - b.x) < 36 && y < b.y + 80
}

export function setupHall(g: Guardian, w: BossWorld) {
  const a = w.arena
  if (g.kind === 'attract') {
    g.coins = [0, 0, 0, 0]
    g.countdown = CONTINUE_TICKS
    return
  }
  g.bankX = ((a.x0 + a.x1 + 1) / 2) * T
  g.windSide = 1
  g.bolt = { x: g.bankX, y: (a.y1 - 2) * T, t: BOLT_EVERY, tell: 0 }
}

export function hallZones(g: Guardian, w: BossWorld): BossZone[] {
  if (g.kind === 'attract') {
    if (g.phase === 3) return []
    const c = attractAt(w)
    return [{ x: c.x, y: c.y + 12, r: 24, id: 0 }]
  }
  if (g.phase === 3) return []
  const b = bankAt(g, w)
  return [{ x: b.x, y: b.y, r: 26, id: 0 }]
}

/** A phase begins: the Attract Mode sets out its pillars; the Cloud Bank drops the Hug Token. */
export function enterHallPhase(g: Guardian, w: BossWorld) {
  const a = w.arena
  if (g.kind === 'attract') {
    if (g.phase === 2) {
      g.pillars = [
        { x: a.x0 + 1, y: a.y0 + 4, dx: 1 },
        { x: a.x1 - 2, y: a.y0 + 7, dx: -1 },
        { x: a.x0 + 6, y: a.y0 + 10, dx: 1 },
      ]
      for (const p of g.pillars) setPillar(w, p, true)
    } else if (g.phase === 3) {
      for (const p of g.pillars) setPillar(w, p, false)
      g.pillars = []
      g.countdown = CONTINUE_TICKS
      g.coins = [0, 0, 0, 0]
    }
    return
  }
  if (g.phase === 3) {
    g.drops = []
    w.giveToken(((a.x0 + a.x1 + 1) / 2) * T, (a.y1 - 1) * T)
  }
}

function setPillar(w: BossWorld, p: { x: number; y: number }, on: boolean) {
  for (let dy = 0; dy < 2; dy++)
    for (let dx = 0; dx < 2; dx++) w.deal(p.x + dx, p.y + dy, on)
}

/** One tick of the hall's Guardian. Returns true when the Attract Mode's slots are all lit. */
export function updateHall(g: Guardian, w: BossWorld): boolean {
  return g.kind === 'attract' ? attract(g, w) : bank(g, w)
}

function attract(g: Guardian, w: BossWorld): boolean {
  const c = attractAt(w)
  if (g.phase === 1) {
    // Its screen projects a ghost of an earlier glitch, one after another.
    if (g.t % GHOST_EVERY === GHOST_EVERY - 1) {
      const kind =
        ATTRACT_GHOSTS[Math.floor(g.t / GHOST_EVERY) % ATTRACT_GHOSTS.length]!
      w.spawn(kind, c.x + (w.rng() - 0.5) * 60, w.arena.y0 * T + 12, true)
      w.play('blip')
    }
    return false
  }
  if (g.phase === 2) {
    // It plays you: blocks of wall march to and fro across the hall.
    if (g.t % PILLAR_STEP === 0)
      for (const p of g.pillars) {
        const a = w.arena
        if (p.x + p.dx < a.x0 || p.x + 1 + p.dx > a.x1) p.dx = -p.dx
        setPillar(w, p, false)
        p.x += p.dx
        setPillar(w, p, true)
      }
    if (g.t % 200 === 199) {
      const kind =
        ATTRACT_GHOSTS[Math.floor(g.t / 200) % ATTRACT_GHOSTS.length]!
      w.spawn(kind, c.x, w.arena.y0 * T + 12, true)
    }
    return false
  }
  // Phase 3: CONTINUE? Every coin slot lit at once and it turns friendly.
  const slots = coinSlots(w)
  const hold = w.seats() > 1 ? 20 : SOLO_HOLD
  slots.forEach((s, i) => {
    if (w.bots().some((b) => Math.hypot(b.x - s.x, b.y - s.y) < 11)) {
      if (g.coins[i]! <= 0) w.play('pickup')
      g.coins[i] = hold
    } else if (g.coins[i]! > 0) g.coins[i]!--
  })
  if (g.coins.every((c) => c > 0)) return true
  if (--g.countdown <= 0) {
    // Out of time: a burst of static, and the countdown starts over.
    for (const b of w.bots()) w.drain(b, 20)
    g.countdown = CONTINUE_TICKS
    g.coins = [0, 0, 0, 0]
    g.flash = 20
    w.play('boom')
    w.phase('GAME OVER... JUST KIDDING. CONTINUE?')
  }
  return false
}

function bank(g: Guardian, w: BossWorld): boolean {
  const a = w.arena
  // It drifts to and fro along the top of its hall.
  const left = (a.x0 + 3) * T
  const right = (a.x1 - 2) * T
  const span = right - left
  const phase = (g.t * (g.phase === 3 ? 0.0012 : 0.005)) % 2
  g.bankX = left + span * (phase < 1 ? phase : 2 - phase)
  if (g.phase < 3) {
    const every = DROP_EVERY[g.phase - 1]!
    if (g.t % every === 0) {
      const bots = w.bots()
      const b = bots[Math.floor(w.rng() * bots.length)]
      if (b)
        g.drops.push({
          x: b.x + (w.rng() - 0.5) * 40,
          y: b.y + (w.rng() - 0.5) * 40,
          t: DROP_TELL,
        })
    }
    for (const d of g.drops) {
      if (--d.t > 0) continue
      for (const b of w.bots())
        if (Math.hypot(b.x - d.x, b.y - d.y) < DROP_SPLASH) w.drain(b, 12)
      if (w.rng() < 0.34) w.spawn('glitch', d.x, d.y, false)
      w.play('pop')
    }
    g.drops = g.drops.filter((d) => d.t > 0)
  }
  if (g.phase === 2) {
    // The wind swaps sides; it shoves every bot toward the vents along that wall.
    if (g.t % WIND_SWAP === 0) {
      g.windSide = -g.windSide
      w.play('warn')
    }
    const wall = g.windSide > 0 ? (a.x1 + 1) * T : a.x0 * T
    for (const b of w.bots()) {
      w.push(b, g.windSide * 0.7, 0)
      if (Math.abs(b.x - wall) < 20 && g.t % 6 === 0) w.drain(b, 1)
    }
    return false
  }
  if (g.phase !== 3) return false
  // Phase 3: lightning chases the Token's holder (or the Token, or the nearest bot).
  const bolt = g.bolt
  if (bolt.tell > 0) {
    if (--bolt.tell === 0) {
      for (const b of w.bots())
        if (Math.hypot(b.x - bolt.x, b.y - bolt.y) < BOLT_SPLASH) w.drain(b, 15)
      w.play('boom')
      g.flash = 8
      if (underBank(g, w, bolt.x, bolt.y)) {
        g.hp -= Math.ceil(g.phaseHp / 3)
        w.phase('RIGHT INTO THE BANK!')
      }
      bolt.t = BOLT_EVERY
    }
    return false
  }
  const target = w.holder() ?? w.bots()[0]
  if (target) {
    const dx = target.x - bolt.x
    const dy = target.y - bolt.y
    const d = Math.hypot(dx, dy) || 1
    bolt.x += (dx / d) * Math.min(d, 1.2)
    bolt.y += (dy / d) * Math.min(d, 1.2)
  }
  if (--bolt.t <= 0) {
    // It locks on: the mark jumps to its quarry if it is close, then flashes before it strikes.
    if (target && Math.hypot(target.x - bolt.x, target.y - bolt.y) < 48) {
      bolt.x = target.x
      bolt.y = target.y
    }
    bolt.tell = BOLT_TELL
    w.play('warn')
  }
  return false
}

// --- drawing ---------------------------------------------------------------------------------------

export function renderHall(
  c: CanvasRenderingContext2D,
  g: Guardian,
  w: BossWorld,
) {
  if (g.kind === 'attract') renderAttract(c, g, w)
  else renderBank(c, g, w)
}

function renderAttract(c: CanvasRenderingContext2D, g: Guardian, w: BossWorld) {
  const { x, y } = attractAt(w)
  const white = g.flash > 0 && g.flash % 2 === 0
  const friendly = g.done
  glow(c, x, y, 70, friendly ? RAMPS.leaf[3] : RAMPS.pink[3], 0.25)
  // The cabinet: a marquee, a big screen, a control panel.
  bevel(c, x - 46, y - 30, 92, 62, white ? RAMPS.steel : RAMPS.purple, {
    depth: 2,
  })
  c.fillStyle = friendly ? RAMPS.leaf[3] : RAMPS.pink[3]
  c.fillRect(x - 40, y - 27, 80, 7)
  drawText(c, friendly ? 'FRIENDS' : 'PLAY ME', x, y - 27, {
    align: 'center',
    color: INK,
  })
  c.fillStyle = INK
  c.fillRect(x - 36, y - 17, 72, 36)
  // On its screen: the demo, a game-over, or a happy face.
  if (g.phase === 3 && !friendly) {
    c.fillStyle = RAMPS.night[1]
    c.fillRect(x - 34, y - 15, 68, 32)
    drawText(c, 'CONTINUE?', x, y - 12, {
      align: 'center',
      color: RAMPS.ember[3],
    })
    drawText(c, String(Math.ceil(g.countdown / 60)), x, y, {
      align: 'center',
      scale: 2,
      color: '#ffffff',
    })
  } else if (friendly) {
    c.fillStyle = RAMPS.leaf[1]
    c.fillRect(x - 34, y - 15, 68, 32)
    c.fillStyle = RAMPS.leaf[4]
    c.fillRect(x - 12, y - 8, 4, 4)
    c.fillRect(x + 8, y - 8, 4, 4)
    c.fillRect(x - 12, y + 5, 24, 2)
    c.fillRect(x - 14, y + 3, 2, 2)
    c.fillRect(x + 12, y + 3, 2, 2)
  } else {
    c.fillStyle = RAMPS.night[2]
    c.fillRect(x - 34, y - 15, 68, 32)
    // A tiny demo: a maze and a little bot chasing a little glitch.
    c.fillStyle = RAMPS.purple[3]
    for (let i = 0; i < 4; i++)
      c.fillRect(x - 30 + i * 16, y - 8 + (i % 2) * 10, 10, 2)
    const t = g.t / 20
    c.fillStyle = RAMPS.teal[3]
    c.fillRect(
      Math.round(x + Math.cos(t) * 22),
      Math.round(y + Math.sin(t * 2) * 8),
      3,
      3,
    )
    c.fillStyle = RAMPS.pink[3]
    c.fillRect(
      Math.round(x + Math.cos(t - 0.6) * 22),
      Math.round(y + Math.sin(t * 2 - 1.2) * 8),
      3,
      3,
    )
    c.fillStyle = rgba('#ffffff', 0.15)
    c.fillRect(x - 34, y - 15 + (g.t % 32), 68, 1)
  }
  c.fillStyle = RAMPS.steel[2]
  c.fillRect(x - 40, y + 22, 80, 6)
  c.fillStyle = RAMPS.ember[3]
  c.fillRect(x - 20, y + 23, 4, 4)
  c.fillStyle = RAMPS.gold[3]
  c.fillRect(x + 16, y + 23, 4, 4)
  if (g.phase === 3 && !friendly)
    coinSlots(w).forEach((s, i) => {
      const lit = g.coins[i]! > 0
      if (lit) glow(c, s.x, s.y, 14, RAMPS.gold[4], 0.6)
      bevel(c, s.x - 7, s.y - 7, 14, 14, lit ? RAMPS.gold : RAMPS.steel, {
        depth: 1,
      })
      c.fillStyle = INK
      c.fillRect(s.x - 1, s.y - 4, 2, 8)
      if (lit && w.seats() === 1)
        gauge(c, s.x - 6, s.y + 9, 12, 2, g.coins[i]! / SOLO_HOLD, RAMPS.gold)
      if (!lit && Math.floor(g.t / 15) % 2 === 0)
        drawText(c, 'COIN', s.x, s.y - 17, {
          align: 'center',
          color: RAMPS.gold[4],
          outline: INK,
        })
    })
  if (!g.done && g.phase < 3) bar(c, g, x, y - 40)
  // The marching blocks: drawn as cabinets on their sides.
  for (const p of g.pillars) {
    const px = p.x * T
    const py = p.y * T
    bevel(c, px, py, T * 2, T * 2, RAMPS.purple, { depth: 2 })
    c.fillStyle = INK
    c.fillRect(px + 5, py + 5, T * 2 - 10, 12)
    c.fillStyle = RAMPS.teal[3]
    c.fillRect(px + 6, py + 6 + ((g.t >> 3) % 10), T * 2 - 12, 1)
    drawText(c, p.dx > 0 ? '>' : '<', px + T, py + 21, {
      align: 'center',
      color: RAMPS.pink[3],
    })
  }
}

function renderBank(c: CanvasRenderingContext2D, g: Guardian, w: BossWorld) {
  const a = w.arena
  // Wind (phase 2): streaks across the hall, and the vents glowing on the lee wall.
  if (g.phase === 2 && !g.done) {
    const wall = g.windSide > 0 ? (a.x1 + 1) * T - 6 : a.x0 * T
    c.fillStyle = rgba(RAMPS.sky[3], 0.25)
    c.fillRect(wall, a.y0 * T, 6, (a.y1 - a.y0 + 1) * T)
    c.fillStyle = rgba(RAMPS.sky[4], 0.35)
    for (let i = 0; i < 18; i++) {
      const sy = a.y0 * T + ((i * 37) % ((a.y1 - a.y0 + 1) * T))
      const sx =
        a.x0 * T +
        ((((i * 53 + g.t * 3 * g.windSide) % ((a.x1 - a.x0 + 1) * T)) +
          (a.x1 - a.x0 + 1) * T) %
          ((a.x1 - a.x0 + 1) * T))
      c.fillRect(Math.round(sx), sy, 8, 1)
    }
  }
  // Drops: a growing shadow (the tell), then the drop itself falling into it.
  for (const d of g.drops) {
    const f = 1 - d.t / DROP_TELL
    c.strokeStyle = rgba(RAMPS.sky[3], 0.4 + 0.5 * f)
    c.lineWidth = 1
    c.beginPath()
    c.ellipse(
      d.x,
      d.y + 2,
      DROP_SPLASH * (0.4 + 0.6 * f),
      DROP_SPLASH * 0.5 * (0.4 + 0.6 * f),
      0,
      0,
      Math.PI * 2,
    )
    c.stroke()
    const fy = d.y - (1 - f) * 70
    c.fillStyle = INK
    c.fillRect(Math.round(d.x) - 3, Math.round(fy) - 4, 6, 8)
    c.fillStyle = RAMPS.purple[3]
    c.fillRect(Math.round(d.x) - 2, Math.round(fy) - 3, 4, 6)
  }
  // The lightning's mark (phase 3): following, then flashing before it strikes.
  if (g.phase === 3 && !g.done) {
    const b = g.bolt
    const telling = b.tell > 0
    c.strokeStyle = rgba(
      telling && b.tell % 6 < 3 ? '#ffffff' : RAMPS.gold[4],
      0.8,
    )
    c.lineWidth = 1
    c.beginPath()
    c.ellipse(b.x, b.y + 2, BOLT_SPLASH, BOLT_SPLASH * 0.5, 0, 0, Math.PI * 2)
    c.stroke()
    if (telling && b.tell < 10) {
      const { x, y } = bankAt(g, w)
      c.strokeStyle = '#ffffff'
      c.lineWidth = 2
      c.beginPath()
      c.moveTo(x, y + 14)
      c.lineTo(b.x + 6, (y + b.y) / 2)
      c.lineTo(b.x - 4, (y + b.y) / 2 + 10)
      c.lineTo(b.x, b.y)
      c.stroke()
    }
  }
  const { x, y } = bankAt(g, w)
  const white = g.flash > 0 && g.flash % 2 === 0
  dropShadow(c, x, y + 60, 30, 5, 0.3)
  glow(c, x, y, 52, g.done ? RAMPS.leaf[3] : RAMPS.sky[3], 0.3)
  // A cloud made of soft servers: puffs, with rack fronts peeking out.
  const puffs = [
    [-26, 4, 14],
    [-10, -6, 17],
    [10, -4, 16],
    [27, 5, 13],
    [0, 8, 16],
  ] as const
  for (const [dx, dy, r] of puffs) {
    c.fillStyle = INK
    c.beginPath()
    c.arc(x + dx, y + dy, r + 1, 0, Math.PI * 2)
    c.fill()
  }
  for (const [dx, dy, r] of puffs) {
    c.fillStyle = white ? '#ffffff' : RAMPS.steel[3]
    c.beginPath()
    c.arc(x + dx, y + dy, r, 0, Math.PI * 2)
    c.fill()
    c.fillStyle = white ? '#ffffff' : RAMPS.steel[4]
    c.beginPath()
    c.arc(x + dx - 3, y + dy - 4, r * 0.55, 0, Math.PI * 2)
    c.fill()
  }
  for (let i = -2; i <= 2; i++) {
    c.fillStyle = RAMPS.steel[1]
    c.fillRect(x + i * 10 - 3, y + 6, 7, 6)
    c.fillStyle = (g.t + i * 7) % 20 < 10 ? RAMPS.leaf[3] : RAMPS.sky[3]
    c.fillRect(x + i * 10 + 1, y + 8, 1, 1)
  }
  // Sleepy eyes, wide awake in the storm.
  for (const ex of [-9, 9]) {
    c.fillStyle = INK
    c.fillRect(x + ex - 2, y - 6, 5, g.done ? 1 : 4)
  }
  if (!g.done && g.phase < 3) bar(c, g, x, y - 30)
  if (!g.done && g.phase === 3) {
    c.fillStyle = INK
    c.fillRect(x - 31, y - 31, 62, 5)
    gauge(c, x - 30, y - 30, 60, 3, Math.max(0, g.hp) / g.phaseHp, RAMPS.gold)
  }
}

function bar(c: CanvasRenderingContext2D, g: Guardian, x: number, y: number) {
  c.fillStyle = INK
  c.fillRect(x - 31, y - 1, 62, 5)
  gauge(
    c,
    x - 30,
    y,
    60,
    3,
    Math.max(0, g.hp) / g.phaseHp,
    g.phase === 2 ? RAMPS.gold : RAMPS.leaf,
  )
  for (let i = 0; i < 3; i++) {
    c.fillStyle = i < 4 - g.phase ? RAMPS.pink[3] : RAMPS.night[2]
    c.fillRect(x + 34 + i * 4, y, 3, 3)
  }
}
