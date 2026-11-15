// /utils/arcade/brickBloom/art.ts
//
// Code-drawn 16-bit art for Brick Bloom's Cactus Dome and Lily Pond House (conductor
// kr-arcade/t-080, depth-pass CABINETS.md section 11, slice 3): the pond water, the new crates'
// marks, the pests, the Vent and Duo Paddle seeds, Sunny Saguaro and Queen Koi. Pure drawing in
// the cabinet's style (an ink outline, a lit top, a glow); the cabinet decides what and where.

import { INK, RAMPS, dropShadow, glow, rgba } from '../snes'
import {
  WHIRL_CENTRE,
  armTips,
  crownCount,
  crownOpen,
  whirling,
} from './bosses'
import type { Boss } from './bosses'
import {
  BUMPER_R,
  BUMPER_TICKS,
  WATER_BOTTOM,
  WATER_TOP,
  sandLeft,
} from './crates'
import type { Bumper } from './crates'
import { BEETLE_H, BEETLE_W, FROG_R, TUMBLE_R, TUMBLE_Y } from './pests'
import type { Beetle, Frog, Ghost, MirrorBug, Tumbleweed } from './pests'
import { BALL_R, LEFT, RIGHT } from './rules'

type G = CanvasRenderingContext2D

// --- the pond --------------------------------------------------------------------------------

/** The water over the lower wall: a lit surface line, slow bands and a few glints. */
export function drawWater(g: G, tick: number) {
  g.fillStyle = rgba(RAMPS.water[2], 0.3)
  g.fillRect(LEFT, WATER_TOP, RIGHT - LEFT, WATER_BOTTOM - WATER_TOP)
  g.fillStyle = rgba(RAMPS.water[1], 0.18)
  for (let y = WATER_TOP + 12; y < WATER_BOTTOM; y += 18) {
    const off = Math.round(Math.sin(tick / 40 + y) * 6)
    g.fillRect(LEFT, y + off / 3, RIGHT - LEFT, 3)
  }
  for (let x = LEFT; x < RIGHT; x += 4) {
    const wave = Math.round(Math.sin(tick / 18 + x / 9) * 1.2)
    g.fillStyle = rgba(RAMPS.water[4], 0.7)
    g.fillRect(x, WATER_TOP + wave, 3, 1)
  }
  g.fillStyle = rgba('#ffffff', 0.5)
  for (let i = 0; i < 5; i++) {
    const gx = LEFT + ((i * 53 + tick * 0.3) % (RIGHT - LEFT))
    const gy = WATER_TOP + 20 + ((i * 37) % 80)
    if ((tick + i * 17) % 60 < 30) g.fillRect(Math.round(gx), gy, 2, 1)
  }
}

// --- crate marks ---------------------------------------------------------------------------

/** Prickle crate: little spines on every edge. */
export function markPrickle(g: G, x: number, y: number, w: number, h: number) {
  g.fillStyle = RAMPS.cream[4]
  for (let px = x + 2; px < x + w - 1; px += 4) {
    g.fillRect(px, y - 1, 1, 2)
    g.fillRect(px + 1, y + h - 1, 1, 2)
  }
  g.fillRect(x - 1, y + 3, 2, 1)
  g.fillRect(x + w - 1, y + 4, 2, 1)
}

/** Sand-timer crate: an hourglass, its top bulb draining; flipped open, it shines. */
export function markSand(
  g: G,
  x: number,
  y: number,
  w: number,
  tick: number,
  offset: number,
) {
  const cx = x + Math.floor(w / 2)
  const left = sandLeft(tick, offset)
  const open = left === 0
  g.fillStyle = INK
  g.fillRect(cx - 4, y, 9, 1)
  g.fillRect(cx - 4, y + 7, 9, 1)
  g.fillRect(cx - 3, y + 1, 1, 2)
  g.fillRect(cx + 3, y + 1, 1, 2)
  g.fillRect(cx - 3, y + 5, 1, 2)
  g.fillRect(cx + 3, y + 5, 1, 2)
  g.fillRect(cx - 1, y + 3, 3, 2)
  g.fillStyle = RAMPS.gold[3]
  const top = Math.round(left * 2)
  if (top > 0) g.fillRect(cx - 2, y + 3 - top, 5, top)
  const bottom = open ? 2 : Math.round((1 - left) * 2)
  if (bottom > 0) g.fillRect(cx - 2, y + 7 - bottom, 5, bottom)
  if (!open && Math.floor(tick / 6) % 2) g.fillRect(cx, y + 4, 1, 2)
  if (open) {
    glow(g, cx, y + 4, 10, RAMPS.gold[4], 0.35)
    g.fillStyle = '#ffffff'
    g.fillRect(cx - 5, y + 1, 1, 1)
  }
}

/** Lily pad: a notch cut into the pad and a little flower bud. */
export function markLily(g: G, x: number, y: number, w: number) {
  g.fillStyle = INK
  g.fillRect(x + Math.floor(w / 2), y + 1, 1, 3)
  g.fillStyle = RAMPS.pink[3]
  g.fillRect(x + 3, y + 2, 2, 2)
  g.fillStyle = RAMPS.pink[4]
  g.fillRect(x + 3, y + 2, 1, 1)
}

/** Bubble crate: a round glint on its glass. */
export function markBubble(g: G, x: number, y: number, w: number) {
  g.fillStyle = rgba('#ffffff', 0.8)
  g.fillRect(x + w - 6, y + 1, 2, 1)
  g.fillRect(x + w - 7, y + 2, 1, 2)
  g.strokeStyle = rgba(RAMPS.water[4], 0.8)
  g.lineWidth = 1
  g.beginPath()
  g.arc(x + w / 2, y + 4, 3, 0, Math.PI * 2)
  g.stroke()
}

/** A bubble bumper, wobbling and fading as its time runs out. */
export function drawBumper(g: G, b: Bumper, tick: number) {
  const fade = Math.min(1, b.ticks / 60)
  const r = BUMPER_R + (b.cool > 0 ? 2 : 0) + Math.sin(tick / 5) * 0.6
  g.globalAlpha = fade
  glow(g, b.x, b.y, r + 6, RAMPS.water[3], 0.35)
  g.fillStyle = rgba(RAMPS.water[3], 0.35)
  g.beginPath()
  g.arc(b.x, b.y, r, 0, Math.PI * 2)
  g.fill()
  g.strokeStyle = b.cool > 0 ? '#ffffff' : RAMPS.water[4]
  g.lineWidth = 1.5
  g.stroke()
  g.fillStyle = '#ffffff'
  g.fillRect(Math.round(b.x - r / 2), Math.round(b.y - r / 2), 2, 2)
  if (b.ticks < BUMPER_TICKS / 4 && Math.floor(tick / 4) % 2) {
    g.fillStyle = rgba('#ffffff', 0.5)
    g.fillRect(Math.round(b.x) - 1, Math.round(b.y) - 1, 2, 2)
  }
  g.globalAlpha = 1
}

// --- pests -----------------------------------------------------------------------------------

export function drawTumbleweed(g: G, t: Tumbleweed, tick: number) {
  if (t.tell > 0) {
    // The tell: a dust puff curling up at the glass.
    const x = Math.round(t.x)
    for (let i = 0; i < 4; i++) {
      const r = 3 + ((tick / 4 + i * 3) % 6)
      g.fillStyle = rgba(RAMPS.cream[3], 0.5 - i * 0.1)
      g.beginPath()
      g.arc(x + t.dir * i * 3, TUMBLE_Y - i * 3, r, 0, Math.PI * 2)
      g.fill()
    }
    return
  }
  const x = Math.round(t.x)
  const y = TUMBLE_Y
  dropShadow(g, x, y + TUMBLE_R, TUMBLE_R, 1.5, 0.35)
  g.fillStyle = INK
  g.beginPath()
  g.arc(x, y, TUMBLE_R + 1, 0, Math.PI * 2)
  g.fill()
  g.strokeStyle = RAMPS.earth[3]
  g.lineWidth = 1
  for (let i = 0; i < 4; i++) {
    const a = t.spin + (i * Math.PI) / 4
    g.beginPath()
    g.moveTo(x - Math.cos(a) * TUMBLE_R, y - Math.sin(a) * TUMBLE_R)
    g.lineTo(x + Math.cos(a) * TUMBLE_R, y + Math.sin(a) * TUMBLE_R)
    g.stroke()
  }
  g.strokeStyle = RAMPS.cream[3]
  g.beginPath()
  g.arc(x, y, TUMBLE_R - 1, t.spin, t.spin + Math.PI * 1.2)
  g.stroke()
}

export function drawBeetle(g: G, b: Beetle) {
  const x = Math.round(b.x)
  const y = Math.round(b.y)
  const lit = b.flash > 0 && Math.floor(b.flash / 2) % 2 === 0
  glow(g, x, y, 10, RAMPS.teal[3], 0.2)
  g.fillStyle = INK
  g.fillRect(
    x - BEETLE_W - 1,
    y - BEETLE_H - 1,
    BEETLE_W * 2 + 2,
    BEETLE_H * 2 + 2,
  )
  // The shell, its front armour plate brighter, toward where it walks.
  g.fillStyle = lit ? '#ffffff' : RAMPS.teal[1]
  g.fillRect(x - BEETLE_W, y - BEETLE_H, BEETLE_W * 2, BEETLE_H * 2)
  g.fillStyle = RAMPS.teal[2]
  g.fillRect(x - BEETLE_W + 1, y - BEETLE_H + 1, BEETLE_W * 2 - 2, 3)
  g.fillStyle = RAMPS.steel[3]
  const front = b.dir > 0 ? x + BEETLE_W - 4 : x - BEETLE_W
  g.fillRect(front, y - BEETLE_H, 4, BEETLE_H * 2)
  g.fillStyle = RAMPS.steel[4]
  g.fillRect(front + 1, y - BEETLE_H + 1, 1, BEETLE_H * 2 - 2)
  g.fillStyle = INK
  g.fillRect(x, y - BEETLE_H, 1, BEETLE_H * 2)
  g.fillStyle = RAMPS.gold[3]
  g.fillRect(front + (b.dir > 0 ? 1 : 2), y - 2, 1, 1)
}

export function drawFrog(g: G, f: Frog, tick: number) {
  const x = Math.round(f.x)
  const y = Math.round(f.y)
  if (f.tongue > 0) {
    g.strokeStyle = RAMPS.pink[2]
    g.lineWidth = 2
    g.beginPath()
    g.moveTo(x, y + 1)
    g.lineTo(f.tx, f.ty)
    g.stroke()
  }
  dropShadow(g, x, WATER_TOP + 1, FROG_R, 1.5, 0.3)
  const puff = f.puff > 0
  g.fillStyle = INK
  g.fillRect(x - FROG_R - 1, y - 5, FROG_R * 2 + 2, 11)
  g.fillStyle = RAMPS.leaf[2]
  g.fillRect(x - FROG_R, y - 4, FROG_R * 2, 9)
  g.fillStyle = RAMPS.leaf[3]
  g.fillRect(x - FROG_R, y - 4, FROG_R * 2, 2)
  // Bulging eyes on top, and puffed cheeks as the tell.
  for (const ex of [x - 4, x + 3]) {
    g.fillStyle = INK
    g.fillRect(ex - 1, y - 8, 4, 4)
    g.fillStyle = '#ffffff'
    g.fillRect(ex, y - 7, 2, 2)
    g.fillStyle = INK
    g.fillRect(ex + (tick % 120 < 60 ? 1 : 0), y - 6, 1, 1)
  }
  if (puff) {
    const swell = 2 + (Math.floor(tick / 6) % 2)
    glow(g, x, y + 3, 10, RAMPS.gold[3], 0.4)
    g.fillStyle = RAMPS.gold[4]
    g.fillRect(x - FROG_R - swell, y + 1, swell + 2, 4)
    g.fillRect(x + FROG_R - 2, y + 1, swell + 2, 4)
  }
}

export function drawMirror(g: G, m: MirrorBug, tick: number) {
  const x = Math.round(m.x)
  const y = Math.round(m.y)
  const flap = Math.floor(tick / 4) % 2
  if (m.shimmer > 0) glow(g, x, y, 14 + (m.shimmer % 8), '#ffffff', 0.45)
  glow(g, x, y, 8, RAMPS.sky[3], 0.3)
  g.fillStyle = INK
  g.fillRect(x - 3, y - 3, 7, 7)
  g.fillStyle = RAMPS.sky[3]
  g.fillRect(x - 2, y - 2, 5, 5)
  g.fillStyle = '#ffffff'
  g.fillRect(x - 2, y - 2, 2, 2)
  // Mirror-glass wings.
  g.fillStyle = rgba(RAMPS.steel[4], 0.85)
  g.fillRect(x - 8, y - 4 + flap, 4, 3)
  g.fillRect(x + 5, y - 4 + flap, 4, 3)
}

/** A ghost ball: a pale see-through copy, with no shadow on the glass. */
export function drawGhost(g: G, ghost: Ghost) {
  const a = Math.min(0.6, ghost.life / 120)
  g.globalAlpha = a
  glow(g, ghost.x, ghost.y, 8, RAMPS.sky[4], 0.4)
  g.fillStyle = RAMPS.sky[4]
  g.fillRect(Math.round(ghost.x) - 2, Math.round(ghost.y) - 2, 5, 5)
  g.globalAlpha = 1
}

/** Only the real ball casts a shadow on the glass behind it. */
export function drawBallShadow(g: G, x: number, y: number) {
  g.fillStyle = rgba(INK, 0.45)
  g.beginPath()
  g.arc(x + 4, y + 5, BALL_R + 0.5, 0, Math.PI * 2)
  g.fill()
}

// --- seeds -----------------------------------------------------------------------------------

export const VENT_Y0 = 150
export const VENT_Y1 = 196

/** The Vent seed: a hatch open in the side frame, with arrows pointing out. */
export function drawVent(g: G, side: 0 | 1, ticks: number, tick: number) {
  if (ticks < 120 && Math.floor(tick / 6) % 2) return
  const x = side === 0 ? 0 : RIGHT
  g.fillStyle = INK
  g.fillRect(x, VENT_Y0, LEFT, VENT_Y1 - VENT_Y0)
  glow(g, x + LEFT / 2, (VENT_Y0 + VENT_Y1) / 2, 18, '#fbbf24', 0.4)
  g.fillStyle = '#fbbf24'
  for (let y = VENT_Y0 + 6; y < VENT_Y1 - 4; y += 10) {
    const off = (tick / 3) % 4
    const ax = side === 0 ? LEFT - 2 - off : RIGHT + 2 + off
    g.fillRect(Math.round(ax), y, 2, 2)
    g.fillRect(Math.round(ax + (side === 0 ? 2 : -2)), y - 2, 2, 2)
    g.fillRect(Math.round(ax + (side === 0 ? 2 : -2)), y + 2, 2, 2)
  }
}

/** The Duo Paddle: a smaller helper paddle bot hovering on its jets. */
export function drawDuo(g: G, x: number, y: number, w: number, tick: number) {
  const left = Math.round(x - w / 2)
  glow(g, x, y + 4, w / 2 + 4, '#a5b4fc', 0.25)
  g.fillStyle = RAMPS.ember[2]
  const jet = 1 + (Math.floor(tick / 3) % 2)
  g.fillRect(left + 2, y + 5, 2, jet + 1)
  g.fillRect(left + w - 4, y + 5, 2, jet + 1)
  g.fillStyle = INK
  g.fillRect(left - 1, y - 1, w + 2, 7)
  g.fillStyle = RAMPS.purple[3]
  g.fillRect(left, y, w, 5)
  g.fillStyle = RAMPS.purple[4]
  g.fillRect(left, y, w, 1)
  g.fillStyle = INK
  g.fillRect(Math.round(x) - 4, y + 1, 8, 3)
  g.fillStyle = RAMPS.gold[3]
  g.fillRect(Math.round(x) - 3, y + 2, 2, 1)
  g.fillRect(Math.round(x) + 1, y + 2, 2, 1)
}

// --- the bosses ------------------------------------------------------------------------------

/** Sunny Saguaro: a ribbed cactus robot, arms spinning, his crown counting down to bloom. */
export function drawSaguaro(g: G, b: Boss, tick: number) {
  const x = Math.round(b.x)
  const top = Math.round(b.y - b.h / 2)
  const hurt = b.hurt > 0 && Math.floor(b.hurt / 3) % 2 === 0
  const ramp = hurt ? RAMPS.cream : RAMPS.leaf
  dropShadow(g, x, top + b.h + 4, b.w / 2, 3, 0.35)
  // The trunk, ribbed, with spines down the ribs.
  g.fillStyle = INK
  g.fillRect(x - b.w / 2 - 1, top - 1, b.w + 2, b.h + 2)
  g.fillStyle = ramp[1]
  g.fillRect(x - b.w / 2, top, b.w, b.h)
  for (let rx = x - b.w / 2 + 3; rx < x + b.w / 2 - 2; rx += 6) {
    g.fillStyle = ramp[2]
    g.fillRect(rx, top + 2, 3, b.h - 4)
    g.fillStyle = ramp[3]
    g.fillRect(rx, top + 2, 1, b.h - 4)
    g.fillStyle = RAMPS.cream[4]
    for (let sy = top + 6; sy < top + b.h - 4; sy += 8)
      g.fillRect(rx + 3, sy, 1, 1)
  }
  // A friendly visor face.
  g.fillStyle = INK
  g.fillRect(x - 9, top + 14, 18, 8)
  g.fillStyle = b.defeated ? RAMPS.leaf[4] : RAMPS.gold[3]
  g.fillRect(x - 7, top + 16, 4, 3)
  g.fillRect(x + 3, top + 16, 4, 3)
  g.fillStyle = INK
  g.fillRect(x - 4, top + 25, 8, 1)
  if (b.defeated || crownOpen(b)) g.fillRect(x - 5, top + 24, 1, 1)
  // His arms spin out past the trunk, drawn over it so their reach always reads.
  for (const tip of armTips(b)) {
    const steps = 8
    for (let i = 4; i <= steps; i++) {
      const t = i / steps
      const px = Math.round(b.x + (tip.x - b.x) * t)
      const py = Math.round(b.y + (tip.y - b.y) * t)
      g.fillStyle = INK
      g.fillRect(px - 3, py - 3, 7, 7)
      g.fillStyle = ramp[2]
      g.fillRect(px - 2, py - 2, 5, 5)
      g.fillStyle = ramp[3]
      g.fillRect(px - 2, py - 2, 5, 1)
    }
    g.fillStyle = RAMPS.cream[4]
    g.fillRect(Math.round(tip.x) - 1, Math.round(tip.y) - 4, 1, 2)
    g.fillRect(Math.round(tip.x) + 2, Math.round(tip.y), 2, 1)
  }
  // The crown: shut buds counting down, or a full bloom while he can be hit.
  const open = b.defeated || crownOpen(b)
  if (open) {
    glow(g, x, top - 4, 16, RAMPS.pink[3], 0.5)
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + tick / 30
      const px = Math.round(x + Math.cos(a) * 6)
      const py = Math.round(top - 4 + Math.sin(a) * 4)
      g.fillStyle = INK
      g.fillRect(px - 3, py - 3, 6, 6)
      g.fillStyle = RAMPS.pink[3]
      g.fillRect(px - 2, py - 2, 4, 4)
    }
    g.fillStyle = RAMPS.gold[4]
    g.fillRect(x - 2, top - 6, 4, 4)
  } else {
    const count = crownCount(b)
    for (let i = 0; i < 3; i++) {
      const px = x - 8 + i * 7
      g.fillStyle = INK
      g.fillRect(px - 2, top - 7, 6, 7)
      g.fillStyle = i < count ? RAMPS.pink[1] : RAMPS.pink[3]
      g.fillRect(px - 1, top - 6, 4, 5)
    }
  }
}

/** Queen Koi: a dim shape under the pads, rippling before a leap; gold and scaled mid-leap. */
export function drawKoi(g: G, b: Boss, tick: number) {
  const x = Math.round(b.x)
  const y = Math.round(b.y)
  if (whirling(b)) drawWhirl(g, tick)
  if (b.tell > 0) {
    // Ripples: she is about to leap.
    for (let i = 0; i < 3; i++) {
      const r = 6 + ((tick / 2 + i * 6) % 18)
      g.strokeStyle = rgba('#ffffff', 0.6 - r / 40)
      g.lineWidth = 1
      g.beginPath()
      g.ellipse(x, WATER_TOP + 2, r, r / 3, 0, 0, Math.PI * 2)
      g.stroke()
    }
  }
  const leaping = b.leap > 0 || b.defeated
  const hurt = b.hurt > 0 && Math.floor(b.hurt / 3) % 2 === 0
  const body = hurt ? RAMPS.cream : RAMPS.ember
  g.save()
  if (!leaping) g.globalAlpha = 0.45
  g.translate(x, y)
  const dir =
    b.leap > 0
      ? Math.sign(b.leapTo - b.leapFrom) || 1
      : Math.cos(b.t / 80) >= 0
        ? 1
        : -1
  const tilt = b.leap > 0 ? (b.leap / 96 - 0.5) * 1.4 * dir : 0
  g.rotate(tilt)
  g.scale(dir, 1)
  // Tail, body with gold scales, fins and a kind eye.
  g.fillStyle = INK
  g.beginPath()
  g.moveTo(-b.w / 2 - 8, -7)
  g.lineTo(-b.w / 2 + 2, 0)
  g.lineTo(-b.w / 2 - 8, 7)
  g.fill()
  g.fillStyle = body[3]
  g.beginPath()
  g.moveTo(-b.w / 2 - 6, -5)
  g.lineTo(-b.w / 2 + 1, 0)
  g.lineTo(-b.w / 2 - 6, 5)
  g.fill()
  g.fillStyle = INK
  g.beginPath()
  g.ellipse(0, 0, b.w / 2 + 1, b.h / 2 + 1, 0, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = body[2]
  g.beginPath()
  g.ellipse(0, 0, b.w / 2, b.h / 2, 0, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = '#ffffff'
  g.fillRect(-6, -b.h / 2 + 2, 10, 4)
  g.fillStyle = RAMPS.gold[3]
  for (let sx = -12; sx < 10; sx += 5) g.fillRect(sx, 0, 2, 2)
  g.fillStyle = INK
  g.fillRect(b.w / 2 - 8, -3, 3, 3)
  g.fillStyle = '#ffffff'
  g.fillRect(b.w / 2 - 8, -3, 1, 1)
  // Her little clockwork crown.
  g.fillStyle = RAMPS.gold[3]
  g.fillRect(2, -b.h / 2 - 4, 8, 3)
  g.fillRect(2, -b.h / 2 - 6, 2, 2)
  g.fillRect(8, -b.h / 2 - 6, 2, 2)
  g.restore()
  if (b.leap > 0 && b.leap < 10) {
    g.fillStyle = rgba('#ffffff', 0.7)
    for (let i = -2; i <= 2; i++)
      g.fillRect(
        Math.round(b.leapFrom) + i * 5,
        WATER_TOP - 3 - Math.abs(i),
        2,
        2,
      )
  }
}

function drawWhirl(g: G, tick: number) {
  const { x, y } = WHIRL_CENTRE
  g.strokeStyle = rgba(RAMPS.water[4], 0.45)
  g.lineWidth = 1
  for (let arm = 0; arm < 3; arm++) {
    g.beginPath()
    for (let i = 0; i < 40; i++) {
      const a = tick / 20 + arm * ((Math.PI * 2) / 3) + i * 0.18
      const r = 4 + i * 1.6
      const px = x + Math.cos(a) * r
      const py = y + Math.sin(a) * r * 0.45
      if (i === 0) g.moveTo(px, py)
      else g.lineTo(px, py)
    }
    g.stroke()
  }
}

/** The Cactus Dome's own glass dressing: little cacti along the hedge line. */
export function paintCacti(k: G) {
  for (const [cx, h] of [
    [30, 16],
    [84, 11],
    [150, 18],
    [210, 13],
    [240, 9],
  ] as const) {
    const base = 300
    k.fillStyle = RAMPS.leaf[1]
    k.fillRect(cx - 2, base - h, 5, h)
    k.fillRect(cx - 6, base - h + 4, 4, 2)
    k.fillRect(cx - 6, base - h, 2, 5)
    k.fillRect(cx + 3, base - h + 6, 4, 2)
    k.fillRect(cx + 5, base - h + 2, 2, 5)
    k.fillStyle = RAMPS.leaf[2]
    k.fillRect(cx - 1, base - h, 1, h)
  }
}
