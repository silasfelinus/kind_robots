// /utils/arcade/rescueRally/bossArt.ts
//
// Rescue Rally's bosses on screen (conductor kr-arcade t-036): each is painted from lit blocks and
// shaded orbs (utils/arcade/snes.ts) so its parts can move, and every tell its rules show (a stomp's
// floor cracks, the Jack's shadow and lunge line, the die's face) is drawn here.

import { drawText } from '../font'
import { INK, RAMPS, bevel, dropShadow, glow, rgba, shadedOrb } from '../snes'
import type { Ramp } from '../snes'
import {
  CRACK_TELL,
  DOWN_TICKS,
  LUNGE_REACH,
  LUNGE_TELL,
  SHADOW_TELL,
  SHOCK_GAP,
  inGap,
  jackHead,
} from './bosses'
import {
  LINK_APART,
  PETALS,
  SHIELD_PLATE,
  SHIELD_RADIUS,
  WHIP_LIVE,
  WHIP_TELL,
  petalSpot,
  whipLive,
} from './bossesLate'
import { GLITCH } from './art'
import type { Boss } from './bosses'

/** The shockwaves on the floor, under everything that stands. */
export function renderShocks(g: CanvasRenderingContext2D, b: Boss) {
  // Root whips: a dotted line across the floor first, then the lash.
  for (const wp of b.whips) {
    const live = whipLive(wp)
    g.save()
    if (live) {
      g.strokeStyle = INK
      g.lineWidth = 7
      g.beginPath()
      g.moveTo(wp.x0, wp.y0)
      g.lineTo(wp.x1, wp.y1)
      g.stroke()
      g.strokeStyle = RAMPS.leaf[2]
      g.lineWidth = 5
      g.stroke()
      g.strokeStyle = RAMPS.leaf[4]
      g.lineWidth = 1
      g.stroke()
    } else {
      g.strokeStyle = rgba(
        RAMPS.ember[3],
        0.35 + 0.4 * (1 - (wp.clock - WHIP_LIVE) / WHIP_TELL),
      )
      g.lineWidth = 2
      g.setLineDash([3, 5])
      g.beginPath()
      g.moveTo(wp.x0, wp.y0)
      g.lineTo(wp.x1, wp.y1)
      g.stroke()
    }
    g.restore()
  }
  for (const s of b.shocks) {
    const fade = 1 - s.r / s.max
    glow(g, s.x, s.y, s.r + 10, RAMPS.gold[3], 0.12 * fade)
    g.save()
    g.globalAlpha = 0.4 + 0.6 * fade
    // The ring, drawn as arcs round its gaps.
    const arcs: Array<[number, number]> = []
    const sorted = [...s.gaps].sort((a, b) => a - b)
    sorted.forEach((gap, i) => {
      const nextGap =
        sorted[(i + 1) % sorted.length]! +
        (i + 1 === sorted.length ? Math.PI * 2 : 0)
      arcs.push([gap + SHOCK_GAP, nextGap - SHOCK_GAP])
    })
    if (!arcs.length) arcs.push([0, Math.PI * 2])
    for (const [w, c] of [
      [5, INK],
      [3, RAMPS.gold[3]],
      [1, '#ffffff'],
    ] as const) {
      g.strokeStyle = c
      g.lineWidth = w
      for (const [a0, a1] of arcs) {
        g.beginPath()
        g.arc(s.x, s.y, s.r, a0, a1)
        g.stroke()
      }
    }
    g.restore()
  }
}

export function renderBoss(g: CanvasRenderingContext2D, b: Boss, tick: number) {
  switch (b.kind) {
    case 'windup':
      return renderWindup(g, b, tick)
    case 'jack':
      return renderJack(g, b, tick)
    case 'overgrowth':
      return renderOvergrowth(g, b, tick)
    case 'twins':
      return renderTwins(g, b, tick)
    case 'core':
      return renderCore(g, b, tick)
  }
}

// --- the Big Wind-Up -------------------------------------------------------------------------------

function renderWindup(g: CanvasRenderingContext2D, b: Boss, tick: number) {
  const down = b.down > 0
  const fade = down ? Math.min(1, b.down / 40) : 1
  const x = Math.round(b.x)
  const y = Math.round(b.y)
  g.save()
  g.globalAlpha *= fade
  if (b.mode === 'crack' && !down) {
    // The tell: cracks run out across the floor from its feet, everywhere but the safe lanes.
    const t = 1 - b.clock / CRACK_TELL
    g.strokeStyle = INK
    g.lineWidth = 2
    for (let k = 0; k < 18; k++) {
      const a = (k / 18) * Math.PI * 2 + b.seed
      if (inGap(b.gaps, a)) continue
      let px = x
      let py = y + 8
      g.beginPath()
      g.moveTo(px, py)
      for (let s = 1; s <= 4; s++) {
        const len = t * 14
        const bend = (s % 2 ? 0.25 : -0.25) * ((k % 3) - 1)
        px += Math.cos(a + bend) * len
        py += Math.sin(a + bend) * len
        g.lineTo(px, py)
      }
      g.stroke()
    }
    for (const gap of b.gaps) {
      // The safe lanes glow.
      g.strokeStyle = rgba(RAMPS.teal[3], 0.25 + 0.35 * t)
      g.lineWidth = 6
      g.beginPath()
      g.moveTo(x + Math.cos(gap) * 24, y + 8 + Math.sin(gap) * 24)
      g.lineTo(
        x + Math.cos(gap) * (40 + t * 50),
        y + 8 + Math.sin(gap) * (40 + t * 50),
      )
      g.stroke()
    }
    glow(g, x, y + 8, 30 + t * 20, RAMPS.ember[3], 0.25 + t * 0.3)
  }
  dropShadow(g, x, y + 12, 28, 6, 0.45)
  const lift = down ? 0 : b.mode === 'crack' ? 4 : b.timer % 24 < 12 ? 2 : -2
  // The key, behind it: steady while it walks, fast in phase 2, slowing as it winds down.
  const spinRate = down ? 0 : b.phase === 0 ? 0.1 : b.phase === 1 ? 0.32 : 0.05
  const spin = tick * spinRate + b.seed
  const kw = Math.max(2, Math.round(Math.abs(Math.cos(spin)) * 14))
  const ky = y - 52
  if (b.phase === 2 && !down) {
    // Phase 3's weak point: the key glows and a ring marks it.
    glow(g, x, ky, 22, RAMPS.gold[3], 0.5 + 0.3 * Math.sin(tick / 5))
    g.strokeStyle = rgba(RAMPS.gold[4], 0.8)
    g.lineWidth = 1
    g.beginPath()
    g.arc(x, ky, 12 + Math.sin(tick / 4) * 2, 0, Math.PI * 2)
    g.stroke()
  }
  g.fillStyle = INK
  g.fillRect(x - 2, ky, 5, 16)
  g.fillStyle = RAMPS.gold[2]
  g.fillRect(x - 1, ky + 1, 3, 15)
  for (const side of [-1, 1]) {
    const lx = side < 0 ? x - kw - 1 : x + 2
    g.fillStyle = INK
    g.fillRect(lx - 1, ky - 6, kw + 2, 12)
    g.fillStyle = RAMPS.gold[3]
    g.fillRect(lx, ky - 5, kw, 10)
    g.fillStyle = RAMPS.gold[4]
    g.fillRect(lx, ky - 5, kw, 2)
    g.fillStyle = RAMPS.gold[1]
    g.fillRect(lx, ky + 3, kw, 2)
  }
  // Legs (folded when it sits down).
  const wobble = b.phase === 2 && !down ? Math.round(Math.sin(tick / 6) * 3) : 0
  if (down) {
    bevel(g, x - 18, y + 2, 14, 8, RAMPS.steel, { depth: 1 })
    bevel(g, x + 4, y + 2, 14, 8, RAMPS.steel, { depth: 1 })
  } else {
    bevel(g, x - 14, y - 4 - Math.max(0, lift), 10, 16, RAMPS.steel, {
      depth: 2,
    })
    bevel(g, x + 4, y - 4 - Math.max(0, -lift), 10, 16, RAMPS.steel, {
      depth: 2,
    })
  }
  const bodyY = down ? y - 24 : y - 32
  // Arms swing opposite the legs.
  bevel(g, x - 30 + wobble, bodyY + 4 + lift, 8, 24, RAMPS.steel, { depth: 2 })
  bevel(g, x + 22 + wobble, bodyY + 4 - lift, 8, 24, RAMPS.steel, { depth: 2 })
  shadedOrb(g, x - 26 + wobble, bodyY + 30 + lift, 4, RAMPS.steel)
  shadedOrb(g, x + 26 + wobble, bodyY + 30 - lift, 4, RAMPS.steel)
  // The tin body: red paint, rivets, a gold hatch.
  const paint: Ramp = b.flash >= 5 ? RAMPS.cream : RAMPS.rust
  bevel(g, x - 22 + wobble, bodyY, 44, 30, paint, { depth: 3 })
  g.fillStyle = RAMPS.rust[4]
  for (const [rx, ry] of [
    [-19, 3],
    [17, 3],
    [-19, 25],
    [17, 25],
  ] as const)
    g.fillRect(x + rx + wobble, bodyY + ry, 2, 2)
  const hatchOpen = b.phase === 1 && !down && b.timer % 80 > 66
  bevel(g, x - 9 + wobble, bodyY + 8, 18, 14, RAMPS.gold, { depth: 2 })
  if (hatchOpen) {
    g.fillStyle = INK
    g.fillRect(x - 7 + wobble, bodyY + 10, 14, 10)
    glow(g, x + wobble, bodyY + 15, 12, RAMPS.ember[3], 0.6)
  } else {
    g.fillStyle = RAMPS.gold[1]
    g.fillRect(x - 6 + wobble, bodyY + 13, 12, 1)
    g.fillRect(x - 6 + wobble, bodyY + 16, 12, 1)
  }
  // Head and visor.
  const headY = bodyY - 16
  bevel(
    g,
    x - 14 + wobble,
    headY,
    28,
    17,
    b.flash >= 5 ? RAMPS.cream : RAMPS.steel,
    {
      depth: 2,
    },
  )
  g.fillStyle = INK
  g.fillRect(x - 11 + wobble, headY + 4, 22, 8)
  if (down) {
    // Wound down and happy: curved green eyes.
    g.fillStyle = RAMPS.leaf[3]
    for (const ex of [-7, 3]) {
      g.fillRect(x + ex + wobble, headY + 8, 1, 1)
      g.fillRect(x + ex + 1 + wobble, headY + 7, 2, 1)
      g.fillRect(x + ex + 3 + wobble, headY + 8, 1, 1)
    }
  } else if (b.phase === 2) {
    // Staggering: swirly eyes.
    for (const ex of [-6, 6]) {
      const a = tick / 4
      g.fillStyle = RAMPS.ember[3]
      for (let k = 0; k < 4; k++) {
        g.fillRect(
          Math.round(x + ex + wobble + Math.cos(a + k * 1.6) * (0.5 + k * 0.6)),
          Math.round(headY + 8 + Math.sin(a + k * 1.6) * (0.5 + k * 0.5)),
          1,
          1,
        )
      }
    }
  } else {
    g.fillStyle = RAMPS.ember[3]
    g.fillRect(x - 9 + wobble, headY + 6, 6, 4)
    g.fillRect(x + 3 + wobble, headY + 6, 6, 4)
    g.fillStyle = RAMPS.ember[4]
    g.fillRect(x - 8 + wobble, headY + 6, 2, 1)
    g.fillRect(x + 4 + wobble, headY + 6, 2, 1)
    glow(g, x + wobble, headY + 8, 16, RAMPS.ember[3], 0.4)
  }
  if (down) heartsUp(g, x, headY - 6, DOWN_TICKS - b.down)
  g.restore()
}

// --- the Jack-in-the-Box ---------------------------------------------------------------------------

const PIPS: Record<number, ReadonlyArray<readonly [number, number]>> = {
  1: [[0, 0]],
  2: [
    [-1, -1],
    [1, 1],
  ],
  3: [
    [-1, -1],
    [0, 0],
    [1, 1],
  ],
  4: [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ],
  5: [
    [-1, -1],
    [1, -1],
    [0, 0],
    [-1, 1],
    [1, 1],
  ],
  6: [
    [-1, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [1, 1],
  ],
}

function renderJack(g: CanvasRenderingContext2D, b: Boss, tick: number) {
  const down = b.down > 0
  const fade = down ? Math.min(1, b.down / 40) : 1
  g.save()
  g.globalAlpha *= fade
  if (b.mode === 'hide') {
    // Only its shadow, growing where it will pop up.
    if (b.next) {
      const t = 1 - Math.max(0, b.clock) / SHADOW_TELL
      dropShadow(
        g,
        b.next.x,
        b.next.y + 8,
        6 + t * 16,
        3 + t * 6,
        0.3 + t * 0.4,
      )
      if (Math.floor(tick / 6) % 2 === 0)
        drawText(g, '!', b.next.x, b.next.y - 22, {
          scale: 2,
          align: 'center',
          color: RAMPS.ember[3],
          outline: INK,
        })
    }
    g.restore()
    return
  }
  const x = Math.round(b.x)
  const y = Math.round(b.y)
  if (b.mode === 'aim') {
    // The lunge line, blinking faster as the head is about to fly.
    const t = 1 - b.clock / LUNGE_TELL
    if (Math.floor(tick / (t > 0.6 ? 2 : 5)) % 2 === 0) {
      g.strokeStyle = rgba(RAMPS.ember[3], 0.8)
      g.lineWidth = 2
      g.setLineDash([4, 4])
      g.beginPath()
      g.moveTo(x, y - 14)
      g.lineTo(x + b.aim.x * LUNGE_REACH, y - 14 + b.aim.y * LUNGE_REACH)
      g.stroke()
      g.setLineDash([])
    }
  }
  const rolling = b.mode === 'roll' || b.mode === 'land'
  dropShadow(g, x, y + 14, 20, 5, 0.45)
  if (rolling) {
    // A big toy die, tumbling; its top face shows the pips.
    const squash = b.mode === 'roll' ? Math.round(Math.sin(tick / 3) * 2) : 0
    const ramp = b.flash >= 5 ? RAMPS.gold : RAMPS.cream
    bevel(
      g,
      x - 16 - squash,
      y - 20 + squash,
      32 + squash * 2,
      32 - squash,
      ramp,
      {
        depth: 3,
      },
    )
    g.fillStyle = b.mode === 'land' ? RAMPS.ember[2] : RAMPS.purple[1]
    for (const [px, py] of PIPS[b.face] ?? PIPS[1]!) {
      g.fillRect(x + px * 8 - 2, y - 4 + py * 8 - 2, 5, 5)
    }
    if (b.mode === 'land') glow(g, x, y - 4, 30, RAMPS.gold[3], 0.5)
    g.restore()
    return
  }
  const open =
    b.mode !== 'close' && b.mode !== 'pop'
      ? 1
      : b.mode === 'pop'
        ? 1 - b.clock / 22
        : b.clock / 16
  // The spring and the head, out along the lunge line (or bobbing on top).
  const head =
    b.reach > 0
      ? jackHead(b)
      : { x, y: y - 22 - open * 14 + Math.sin(tick / 6) * 2 }
  if (open > 0.2 && !down) {
    g.strokeStyle = INK
    g.lineWidth = 3
    springLine(g, x, y - 16, head.x, head.y)
    g.strokeStyle = RAMPS.steel[3]
    g.lineWidth = 1
    springLine(g, x, y - 16, head.x, head.y)
  }
  // The box, a toy chest of pink panels and gold trim with star stickers.
  const box: Ramp = b.flash >= 5 ? RAMPS.cream : RAMPS.pink
  bevel(g, x - 16, y - 16, 32, 30, box, { depth: 3 })
  g.fillStyle = RAMPS.gold[3]
  g.fillRect(x - 16, y - 2, 32, 2)
  g.fillRect(x - 1, y - 16, 2, 30)
  for (const [sx, sy] of [
    [-9, -9],
    [8, 6],
  ] as const) {
    g.fillStyle = RAMPS.gold[4]
    g.fillRect(x + sx - 1, y + sy, 3, 1)
    g.fillRect(x + sx, y + sy - 1, 1, 3)
  }
  // The lid, flipped back when open.
  const lidH = Math.round(4 + open * 6)
  bevel(g, x - 17, y - 18 - lidH, 34, lidH, RAMPS.purple, { depth: 1 })
  if (!down && open > 0.2) {
    // The head: a round, grinning, jingle-capped face.
    const hx = Math.round(head.x)
    const hy = Math.round(head.y)
    g.fillStyle = INK
    g.beginPath()
    g.moveTo(hx - 9, hy - 4)
    g.lineTo(hx - 13, hy - 16)
    g.lineTo(hx, hy - 8)
    g.lineTo(hx + 13, hy - 16)
    g.lineTo(hx + 9, hy - 4)
    g.fill()
    g.fillStyle = RAMPS.teal[3]
    g.beginPath()
    g.moveTo(hx - 8, hy - 5)
    g.lineTo(hx - 12, hy - 14)
    g.lineTo(hx - 1, hy - 7)
    g.fill()
    g.fillStyle = RAMPS.purple[3]
    g.beginPath()
    g.moveTo(hx + 8, hy - 5)
    g.lineTo(hx + 12, hy - 14)
    g.lineTo(hx + 1, hy - 7)
    g.fill()
    shadedOrb(g, hx - 12, hy - 15, 2, RAMPS.gold)
    shadedOrb(g, hx + 12, hy - 15, 2, RAMPS.gold)
    shadedOrb(g, hx, hy, 9, b.flash >= 5 ? RAMPS.cream : RAMPS.gold)
    g.fillStyle = INK
    g.fillRect(hx - 5, hy - 3, 3, 3)
    g.fillRect(hx + 3, hy - 3, 3, 3)
    g.fillStyle = '#ffffff'
    g.fillRect(hx - 5, hy - 3, 1, 1)
    g.fillRect(hx + 3, hy - 3, 1, 1)
    shadedOrb(g, hx, hy + 1, 2, RAMPS.ember)
    g.fillStyle = INK
    g.fillRect(hx - 4, hy + 4, 9, 1)
    g.fillRect(hx - 5, hy + 3, 1, 1)
    g.fillRect(hx + 5, hy + 3, 1, 1)
  }
  if (b.mode === 'fan' && Math.floor(tick / 3) % 2 === 0)
    glow(g, x, y - 20, 24, RAMPS.pink[3], 0.5)
  if (down) heartsUp(g, x, y - 30, DOWN_TICKS - b.down)
  g.restore()
}

function springLine(
  g: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
) {
  const len = Math.hypot(x1 - x0, y1 - y0) || 1
  const nx = -(y1 - y0) / len
  const ny = (x1 - x0) / len
  const coils = Math.max(3, Math.round(len / 6))
  g.beginPath()
  g.moveTo(x0, y0)
  for (let i = 1; i <= coils; i++) {
    const t = i / coils
    const side = i === coils ? 0 : i % 2 ? 4 : -4
    g.lineTo(x0 + (x1 - x0) * t + nx * side, y0 + (y1 - y0) * t + ny * side)
  }
  g.stroke()
}

/** Hearts drifting up off a beaten boss as it reboots into a friend. */
function heartsUp(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number,
) {
  for (let k = 0; k < 5; k++) {
    const age = (t + k * 17) % 60
    const hx = x + Math.sin((t + k * 40) / 9) * 14 + (k - 2) * 6
    const hy = y - age * 0.7
    g.fillStyle = rgba(RAMPS.pink[3], 1 - age / 60)
    g.fillRect(Math.round(hx) - 2, Math.round(hy), 2, 2)
    g.fillRect(Math.round(hx) + 1, Math.round(hy), 2, 2)
    g.fillRect(Math.round(hx) - 1, Math.round(hy) + 2, 3, 1)
    g.fillRect(Math.round(hx), Math.round(hy) + 3, 1, 1)
  }
}

// --- Overgrowth ------------------------------------------------------------------------------------

function renderOvergrowth(g: CanvasRenderingContext2D, b: Boss, tick: number) {
  const down = b.down > 0
  g.save()
  g.globalAlpha *= down ? Math.min(1, b.down / 40) : 1
  const x = Math.round(b.x)
  const y = Math.round(b.y)
  dropShadow(g, x, y + 10, 26, 6, 0.45)
  // Roots: planted, or scrabbling along when it has uprooted.
  const walking = b.phase === 2 && !down
  g.strokeStyle = RAMPS.earth[1]
  g.lineWidth = 3
  for (let k = 0; k < 5; k++) {
    const a = Math.PI * (0.15 + k * 0.175)
    const wig = walking ? Math.sin(tick / 4 + k) * 4 : 0
    g.beginPath()
    g.moveTo(x, y)
    g.quadraticCurveTo(
      x + Math.cos(a) * 12 + wig,
      y + 8,
      x + Math.cos(a) * 24 + wig,
      y + Math.sin(a) * 10 + 6,
    )
    g.stroke()
  }
  // The stem and leaves.
  bevel(g, x - 4, y - 14, 8, 16, RAMPS.leaf, { depth: 1 })
  for (const side of [-1, 1]) {
    g.fillStyle = INK
    g.beginPath()
    g.ellipse(x + side * 12, y - 4, 10, 4, side * 0.4, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = RAMPS.leaf[2]
    g.beginPath()
    g.ellipse(x + side * 12, y - 5, 9, 3, side * 0.4, 0, Math.PI * 2)
    g.fill()
  }
  // The petals: turrets, each going grey as it breaks.
  if (b.phase === 0 || down) {
    for (let k = 0; k < PETALS; k++) {
      const p = petalSpot(b, k)
      const alive = (b.petals[k] ?? 0) > 0
      g.fillStyle = INK
      g.beginPath()
      g.arc(p.x, p.y, 9, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = alive ? RAMPS.pink[2] : RAMPS.steel[1]
      g.beginPath()
      g.arc(p.x, p.y, 8, 0, Math.PI * 2)
      g.fill()
      if (alive) {
        g.fillStyle = RAMPS.pink[4]
        g.fillRect(Math.round(p.x) - 3, Math.round(p.y) - 4, 2, 2)
        g.fillStyle = INK
        g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 3, 3)
      }
    }
  }
  // The face: a sunflower head with a bot's eyes.
  const head = b.flash >= 5 ? RAMPS.cream : RAMPS.gold
  shadedOrb(g, x, y - 18, 13, head)
  g.fillStyle = RAMPS.earth[1]
  g.beginPath()
  g.arc(x, y - 18, 8, 0, Math.PI * 2)
  g.fill()
  if (down) {
    g.fillStyle = RAMPS.leaf[3]
    g.fillRect(x - 5, y - 20, 3, 1)
    g.fillRect(x + 2, y - 20, 3, 1)
  } else {
    g.fillStyle = b.phase === 0 ? RAMPS.leaf[3] : RAMPS.ember[3]
    g.fillRect(x - 5, y - 21, 3, 3)
    g.fillRect(x + 2, y - 21, 3, 3)
    if (b.phase > 0) glow(g, x, y - 18, 22, RAMPS.ember[3], 0.35)
  }
  if (down) heartsUp(g, x, y - 34, DOWN_TICKS - b.down)
  g.restore()
}

// --- the Static Twins ------------------------------------------------------------------------------

function renderTwins(g: CanvasRenderingContext2D, b: Boss, tick: number) {
  const down = b.down > 0
  g.save()
  g.globalAlpha *= down ? Math.min(1, b.down / 40) : 1
  const [t0, t1] = b.twins
  if (b.phase === 0 && !down) {
    // The crackling link: jagged, brighter when it can be broken.
    const apart = Math.hypot(t0!.x - t1!.x, t0!.y - t1!.y)
    const weak = apart >= LINK_APART
    g.save()
    g.globalCompositeOperation = 'lighter'
    g.strokeStyle = weak ? RAMPS.gold[3] : RAMPS.sky[3]
    g.lineWidth = 2
    g.beginPath()
    g.moveTo(t0!.x, t0!.y)
    const steps = 10
    for (let k = 1; k < steps; k++) {
      const t = k / steps
      const jitter = ((tick * 7 + k * 13) % 7) - 3
      g.lineTo(
        t0!.x + (t1!.x - t0!.x) * t + jitter * ((t1!.y - t0!.y) / apart),
        t0!.y + (t1!.y - t0!.y) * t - jitter * ((t1!.x - t0!.x) / apart),
      )
    }
    g.lineTo(t1!.x, t1!.y)
    g.stroke()
    g.restore()
    const mx = (t0!.x + t1!.x) / 2
    const my = (t0!.y + t1!.y) / 2
    glow(
      g,
      mx,
      my,
      weak ? 16 : 9,
      weak ? RAMPS.gold[3] : RAMPS.sky[3],
      weak ? 0.8 : 0.4,
    )
    if (weak) {
      g.strokeStyle = RAMPS.gold[4]
      g.lineWidth = 1
      g.beginPath()
      g.arc(mx, my, 9 + Math.sin(tick / 4) * 2, 0, Math.PI * 2)
      g.stroke()
    }
  }
  b.twins.forEach((t, i) => {
    if (t.hp <= 0 && !down) return
    const x = Math.round(t.x)
    const y = Math.round(t.y)
    const enraged = b.phase === 2 && t.hp > 0
    dropShadow(g, x, y + 12, 10, 2.5, 0.4)
    const ramp = b.flash >= 5 ? RAMPS.cream : i === 0 ? RAMPS.sky : RAMPS.pink
    bevel(g, x - 10, y - 10, 20, 18, ramp, { depth: 2 })
    // A tall antenna each, crackling.
    g.fillStyle = INK
    g.fillRect(x - 1, y - 18, 3, 8)
    g.fillStyle = RAMPS.steel[3]
    g.fillRect(x, y - 17, 1, 7)
    glow(
      g,
      x,
      y - 18,
      enraged ? 14 : 8,
      enraged ? RAMPS.ember[3] : RAMPS.sky[3],
      0.7,
    )
    g.fillStyle = INK
    g.fillRect(x - 7, y - 5, 14, 5)
    g.fillStyle = down ? RAMPS.leaf[3] : enraged ? RAMPS.ember[3] : '#ffffff'
    g.fillRect(x - 5, y - 4, 3, 3)
    g.fillRect(x + 2, y - 4, 3, 3)
  })
  if (down) heartsUp(g, b.x, b.y - 24, DOWN_TICKS - b.down)
  g.restore()
}

// --- the Glitch Core -------------------------------------------------------------------------------

function renderCore(g: CanvasRenderingContext2D, b: Boss, tick: number) {
  const down = b.down > 0
  g.save()
  const x = Math.round(b.x)
  const y = Math.round(b.y)
  if (b.mode === 'crack' && !down) {
    // Its echo of the Big Wind-Up's stomp: the same cracks and safe lanes.
    g.strokeStyle = INK
    g.lineWidth = 2
    for (let k = 0; k < 18; k++) {
      const a = (k / 18) * Math.PI * 2
      if (inGap(b.gaps, a)) continue
      g.beginPath()
      g.moveTo(x, y)
      g.lineTo(x + Math.cos(a) * 40, y + Math.sin(a) * 40)
      g.stroke()
    }
    for (const gap of b.gaps) {
      g.strokeStyle = rgba(RAMPS.teal[3], 0.5)
      g.lineWidth = 6
      g.beginPath()
      g.moveTo(x + Math.cos(gap) * 20, y + Math.sin(gap) * 20)
      g.lineTo(x + Math.cos(gap) * 70, y + Math.sin(gap) * 70)
      g.stroke()
    }
  }
  dropShadow(g, x, y + 30, 18, 4, 0.35)
  if (down) {
    // Rebooted: a friendly bot, glowing gold, hearts rising.
    glow(g, x, y, 40, RAMPS.gold[3], 0.6)
    shadedOrb(g, x, y, 13, RAMPS.gold)
    g.fillStyle = RAMPS.leaf[3]
    g.fillRect(x - 5, y - 2, 3, 1)
    g.fillRect(x + 2, y - 2, 3, 1)
    g.fillRect(x - 3, y + 4, 6, 1)
    heartsUp(g, x, y - 20, DOWN_TICKS - b.down)
    g.restore()
    return
  }
  const shut = b.phase === 1 && b.guard
  glow(g, x, y, 34, shut ? RAMPS.purple[3] : GLITCH[3], 0.5)
  // The four shield plates, turning, with gaps between.
  if (b.phase === 0) {
    for (let k = 0; k < 4; k++) {
      const mid = b.rings[0]! + (k * Math.PI) / 2 + Math.PI / 4
      g.strokeStyle = INK
      g.lineWidth = 6
      g.beginPath()
      g.arc(x, y, SHIELD_RADIUS, mid - SHIELD_PLATE, mid + SHIELD_PLATE)
      g.stroke()
      g.strokeStyle = k % 2 ? RAMPS.purple[3] : RAMPS.teal[3]
      g.lineWidth = 4
      g.stroke()
      g.strokeStyle = '#ffffff'
      g.lineWidth = 1
      g.beginPath()
      g.arc(x, y, SHIELD_RADIUS - 1, mid - SHIELD_PLATE + 0.1, mid - 0.1)
      g.stroke()
    }
  }
  if (shut) {
    // Shut tight until every rescuee is rebooted.
    g.strokeStyle = RAMPS.purple[4]
    g.lineWidth = 2
    g.beginPath()
    g.arc(x, y, 18 + Math.sin(tick / 6) * 2, 0, Math.PI * 2)
    g.stroke()
  }
  const core = b.flash >= 5 ? RAMPS.cream : GLITCH
  shadedOrb(g, x, y, 13, core)
  // A glitchy eye that tears sideways now and then.
  const tear = tick % 41 < 3 ? 3 : 0
  g.fillStyle = INK
  g.fillRect(x - 6 + tear, y - 3, 12, 6)
  g.fillStyle = RAMPS.ember[3]
  g.fillRect(x - 2 + tear + Math.round(Math.sin(tick / 15) * 3), y - 2, 4, 4)
  g.restore()
}
