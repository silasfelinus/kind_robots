// /utils/arcade/seedLander/bossArt.ts
//
// Seed Lander's bosses drawn in world units (conductor kr-arcade/t-070): Old Scarecrow on his
// post with a pumpkin-bot head and patched coat, his hands the pads (a crow perched on one is
// the last phase's tell), and the Gale Mill's storm face on a tall mill with a platform on each
// sail tip. Cosmetic only; the boss rules are in bosses.ts.

import {
  INK,
  RAMPS,
  bevel,
  drawSprite,
  glow,
  pixelSprite,
  rgba,
  shadedOrb,
} from '../snes'
import type { Boss } from './bosses'
import {
  GALE_MILL,
  GaleMill,
  GeyserTortoise,
  GlowwormQueen,
  OldScarecrow,
  SCARECROW,
  TORTOISE,
} from './bosses'

const PERCHED_CROW = pixelSprite(
  ['..KK..', '.KkkKR', 'KkkkK.', '.KKK..', '.K.K..'],
  { K: RAMPS.night[2], k: RAMPS.steel[1], R: RAMPS.gold[3] },
)

export function drawBoss(
  g: CanvasRenderingContext2D,
  boss: Boss,
  ground: (x: number) => number,
  tick: number,
) {
  if (boss instanceof OldScarecrow) drawScarecrow(g, boss, ground, tick)
  if (boss instanceof GaleMill) drawGaleMill(g, boss, ground, tick)
  if (boss instanceof GeyserTortoise) drawTortoise(g, boss, tick)
  if (boss instanceof GlowwormQueen) drawQueen(g, boss, tick)
}

function drawScarecrow(
  g: CanvasRenderingContext2D,
  b: OldScarecrow,
  ground: (x: number) => number,
  tick: number,
) {
  const x = b.x
  const sy = SCARECROW.shoulderY
  // The post.
  bevel(g, x - 4, sy - 10, 8, ground(x) - sy + 12, RAMPS.earth, { depth: 1 })
  // Arms: sleeves from each shoulder to its hand.
  b.pads.forEach((p, i) => {
    const sx = x + (i === 0 ? -SCARECROW.shoulder : SCARECROW.shoulder)
    const hx = (p.x0 + p.x1) / 2
    const hy = p.y + 4
    g.strokeStyle = INK
    g.lineWidth = 9
    g.beginPath()
    g.moveTo(sx, sy)
    g.lineTo(hx, hy)
    g.stroke()
    g.strokeStyle = i === 0 ? RAMPS.sky[2] : RAMPS.rust[2]
    g.lineWidth = 6
    g.stroke()
    // Straw tufts at the cuff.
    g.fillStyle = RAMPS.gold[3]
    for (let k = -2; k <= 2; k++) g.fillRect(hx + k * 3 - 1, hy + 2, 2, 4)
  })
  // The coat: a patched trapezoid, buttons.
  g.fillStyle = INK
  g.beginPath()
  g.moveTo(x - SCARECROW.shoulder - 3, sy - 6)
  g.lineTo(x + SCARECROW.shoulder + 3, sy - 6)
  g.lineTo(x + 18, sy + 50)
  g.lineTo(x - 18, sy + 50)
  g.closePath()
  g.fill()
  g.fillStyle = RAMPS.leaf[1]
  g.beginPath()
  g.moveTo(x - SCARECROW.shoulder, sy - 4)
  g.lineTo(x + SCARECROW.shoulder, sy - 4)
  g.lineTo(x + 16, sy + 48)
  g.lineTo(x - 16, sy + 48)
  g.closePath()
  g.fill()
  g.fillStyle = RAMPS.rust[3]
  g.fillRect(x - 12, sy + 14, 8, 8)
  g.fillStyle = RAMPS.sky[3]
  g.fillRect(x + 4, sy + 26, 7, 7)
  g.fillStyle = RAMPS.gold[4]
  for (let k = 0; k < 3; k++) g.fillRect(x - 1, sy + 4 + k * 12, 3, 3)
  // The head: a pumpkin-bot with a straw hat, eyes glowing harder each phase.
  const hy = sy - 26
  shadedOrb(g, x, hy, SCARECROW.head, RAMPS.rust)
  const eye = [RAMPS.gold[3], RAMPS.gold[4], '#ffffff'][Math.min(2, b.phase)]!
  glow(g, x - 6, hy - 2, 6, eye, 0.5)
  glow(g, x + 6, hy - 2, 6, eye, 0.5)
  g.fillStyle = INK
  g.fillRect(x - 9, hy - 5, 6, 5)
  g.fillRect(x + 3, hy - 5, 6, 5)
  g.fillStyle = eye
  g.fillRect(x - 8, hy - 4, 4, 3)
  g.fillRect(x + 4, hy - 4, 4, 3)
  g.fillStyle = INK
  for (let k = -2; k <= 2; k++)
    g.fillRect(x + k * 3 - 1, hy + 6 + (k % 2 ? 1 : 0), 2, 2)
  g.fillStyle = INK
  g.fillRect(x - 22, hy - 15, 44, 5)
  g.fillRect(x - 11, hy - 24, 22, 11)
  g.fillStyle = RAMPS.gold[2]
  g.fillRect(x - 21, hy - 14, 42, 3)
  g.fillRect(x - 10, hy - 23, 20, 9)
  g.fillStyle = RAMPS.ember[2]
  g.fillRect(x - 10, hy - 16, 20, 2)
  // Crows sitting on his hands (the last phase).
  b.pads.forEach((p) => {
    if (!p.blocked) return
    const cx = (p.x0 + p.x1) / 2
    drawSprite(g, PERCHED_CROW, cx, p.y - 1, {
      anchor: 'feet',
      flipX: Math.floor(tick / 40) % 2 === 0,
    })
  })
}

function drawGaleMill(
  g: CanvasRenderingContext2D,
  b: GaleMill,
  ground: (x: number) => number,
  tick: number,
) {
  const x = b.x
  const hy = GALE_MILL.hubY
  const base = ground(x)
  // The mill: a tapering tower of boards.
  g.fillStyle = INK
  g.beginPath()
  g.moveTo(x - 14, hy + 6)
  g.lineTo(x + 14, hy + 6)
  g.lineTo(x + 26, base + 2)
  g.lineTo(x - 26, base + 2)
  g.closePath()
  g.fill()
  g.fillStyle = RAMPS.cream[2]
  g.beginPath()
  g.moveTo(x - 12, hy + 8)
  g.lineTo(x + 12, hy + 8)
  g.lineTo(x + 24, base)
  g.lineTo(x - 24, base)
  g.closePath()
  g.fill()
  g.fillStyle = RAMPS.cream[1]
  for (let y = hy + 18; y < base; y += 10) g.fillRect(x - 24, y, 48, 1)
  bevel(g, x - 6, base - 20, 12, 20, RAMPS.earth, { depth: 1 })
  // The storm face on the cap: a scowl that softens each phase.
  shadedOrb(g, x, hy, 13, RAMPS.steel)
  g.fillStyle = INK
  const scowl = 2 - Math.min(2, b.phase)
  g.fillRect(x - 8, hy - 5 - scowl, 6, 2)
  g.fillRect(x + 2, hy - 5 + scowl, 6, 2)
  g.fillRect(x - 6, hy - 2, 3, 3)
  g.fillRect(x + 3, hy - 2, 3, 3)
  g.fillRect(x - 4, hy + 5, 8, 2)
  // Breath: a gust blowing the way the wind goes.
  const dir = Math.sign(b.wind ?? 0)
  if (dir)
    for (let k = 0; k < 3; k++) {
      const len = 6 + ((tick + k * 9) % 18)
      g.fillStyle = rgba('#ffffff', 0.6)
      g.fillRect(dir > 0 ? x + 14 : x - 14 - len, hy + 3 + k * 3, len, 1)
    }
  // Sails: arms with cloth, a platform at each tip.
  for (let i = 0; i < GALE_MILL.sails; i++) {
    const a = b.sailAngle(i)
    const reach = GALE_MILL.sail - GALE_MILL.tip / 2
    const ex = x + Math.cos(a) * reach
    const ey = hy + Math.sin(a) * reach
    g.strokeStyle = INK
    g.lineWidth = 4
    g.beginPath()
    g.moveTo(x, hy)
    g.lineTo(ex, ey)
    g.stroke()
    g.strokeStyle = RAMPS.earth[3]
    g.lineWidth = 2
    g.stroke()
    const nx = -Math.sin(a)
    const ny = Math.cos(a)
    g.fillStyle = rgba(RAMPS.sky[4], 0.75)
    g.beginPath()
    g.moveTo(x + Math.cos(a) * 16, hy + Math.sin(a) * 16)
    g.lineTo(ex, ey)
    g.lineTo(ex + nx * 9, ey + ny * 9)
    g.lineTo(x + Math.cos(a) * 16 + nx * 9, hy + Math.sin(a) * 16 + ny * 9)
    g.closePath()
    g.fill()
  }
  shadedOrb(g, x, hy, 4, RAMPS.rust)
}

/** The Geyser Tortoise: a pool, a column of geyser water, and a shell with a flat top (the pad). */
function drawTortoise(
  g: CanvasRenderingContext2D,
  b: GeyserTortoise,
  tick: number,
) {
  const p = b.pads[0]!
  const cx = (p.x0 + p.x1) / 2
  const top = p.y
  const pool = TORTOISE.lowY + 4
  // The geyser column under the shell, wobbling while it surges and still at the calm.
  const calm = b.calm()
  const w = TORTOISE.shell - 8
  g.fillStyle = rgba(RAMPS.sky[4], calm ? 0.45 : 0.3)
  g.fillRect(cx - w / 2, top + 6, w, pool - top)
  for (let i = 0; i < 5; i++) {
    const wob = calm ? 0 : Math.sin((tick + i * 9) / 4) * 2
    g.fillStyle = i % 2 ? '#ffffff' : RAMPS.sky[4]
    g.fillRect(
      Math.round(cx - w / 2 + i * (w / 5) + wob),
      top + 8,
      2,
      Math.max(0, pool - top - 10),
    )
  }
  // The shell: a dome with plates, flat on top.
  bevel(
    g,
    cx - TORTOISE.shell / 2 - 3,
    top,
    TORTOISE.shell + 6,
    10,
    RAMPS.leaf,
    { depth: 1 },
  )
  g.fillStyle = INK
  for (let k = -1; k <= 1; k++)
    g.fillRect(Math.round(cx + k * 10), top + 3, 1, 6)
  // The head, looking up when the geyser calms and wincing when it surges.
  const hx =
    cx + (b.phase === 1 && b.calmX() < cx ? -1 : 1) * (TORTOISE.shell / 2 + 6)
  shadedOrb(g, hx, top + 7, 5, RAMPS.leaf)
  g.fillStyle = INK
  g.fillRect(Math.round(hx) - 1, Math.round(top + 5), 1, 2)
  g.fillRect(Math.round(hx) + 1, Math.round(top + 5), 1, 2)
  if (!calm) g.fillRect(Math.round(hx) - 1, Math.round(top + 9), 3, 1)
  // The pool itself, in front.
  g.fillStyle = rgba(RAMPS.sky[2], 0.55)
  g.fillRect(cx - 150, pool, 300, 40)
  for (let k = 0; k < 14; k++) {
    g.fillStyle = rgba('#ffffff', 0.5)
    g.fillRect(Math.round(cx - 150 + ((k * 23 + tick * 0.4) % 300)), pool, 4, 1)
  }
}

/** The Glowworm Queen: a long body of segments, the lit one glowing gold and the rest dim. */
function drawQueen(
  g: CanvasRenderingContext2D,
  b: GlowwormQueen,
  tick: number,
) {
  const lit = b.lit()
  const next = b.next()
  // The body between the segments.
  const first = b.pads[0]!
  const last = b.pads[b.pads.length - 1]!
  g.fillStyle = INK
  g.fillRect(first.x0 - 6, first.y + 2, last.x1 - first.x0 + 12, 14)
  g.fillStyle = RAMPS.purple[1]
  g.fillRect(first.x0 - 4, first.y + 4, last.x1 - first.x0 + 8, 10)
  b.pads.forEach((p, k) => {
    const cx = (p.x0 + p.x1) / 2
    const on = k === lit
    // The next segment pulses faintly: the sequence is learnable.
    const soon = k === next && lit >= 0 && b.litLeft() < 40
    if (on) glow(g, cx, p.y + 6, 30, RAMPS.gold[3], 0.6)
    else if (soon && tick % 10 < 5) glow(g, cx, p.y + 6, 16, RAMPS.gold[2], 0.3)
    bevel(
      g,
      p.x0 - 1,
      p.y,
      p.x1 - p.x0 + 2,
      14,
      on ? RAMPS.gold : RAMPS.purple,
      {
        depth: 1,
      },
    )
    if (on) {
      g.fillStyle = RAMPS.gold[4]
      g.fillRect(Math.round(cx) - 3, p.y + 3, 6, 2)
    }
  })
  // The head, at the right end, with a lure that swings above it.
  const hx = last.x1 + 12
  shadedOrb(g, hx, last.y + 9, 9, RAMPS.purple)
  g.fillStyle = INK
  g.fillRect(Math.round(hx) - 3, Math.round(last.y) + 6, 2, 3)
  g.fillRect(Math.round(hx) + 1, Math.round(last.y) + 6, 2, 3)
  const lx = hx - 4 + Math.sin(tick / 25) * 3
  g.fillRect(Math.round(hx) - 1, Math.round(last.y) - 8, 1, 8)
  glow(g, lx, last.y - 10, 8, RAMPS.gold[3], 0.6)
  g.fillStyle = RAMPS.gold[4]
  g.fillRect(Math.round(lx) - 1, Math.round(last.y) - 11, 2, 2)
}
