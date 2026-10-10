// /utils/arcade/ghostTrail/worldArt.ts
//
// Zuzu: Ghost Trail's campaign pieces that the slice's art modules don't draw yet (conductor kr-arcade
// t-015): solid blocks of any size, moving platforms, ground hazards, updraft columns, the tide, the
// hostile bolts, the act title cards and story pages, and the credits. Also the stand-in bodies for
// foes and bosses whose dedicated art has not landed: each still reads its state (its tell glows) so
// the game is playable while the roster's portraits are painted.
//
// Pure drawing from the arguments; deterministic; headless-safe (plain canvas calls only).

import { drawText } from '../font'
import { INK, glow, mix, rgba } from '../snes'
import type { Bolt } from './foes'
import type { Block, Hazard, Mover, StageTheme, Updraft } from './world'

type G = CanvasRenderingContext2D

const W = 320
const H = 240

/** Each theme's stone: shadow, body, light, and the trim colour. */
const STONE: Record<StageTheme, [string, string, string, string]> = {
  town: ['#3a2618', '#6b4a2c', '#a07a45', '#d6b25e'],
  boneyard: ['#2e2a2a', '#58524c', '#8f877c', '#e7e0cf'],
  waterhole: ['#1c2e2c', '#3b5650', '#6d8f84', '#a7d3c4'],
  stormpass: ['#232838', '#454c63', '#7b84a0', '#c7d2fe'],
  belltower: ['#2b1e2a', '#5a3d4d', '#8e6577', '#f0b77c'],
  abbey: ['#1d1424', '#3e2a4a', '#6c4f7a', '#e879f9'],
}

function stoneFor(theme: StageTheme) {
  return STONE[theme] ?? STONE.town
}

/** A solid block (world space): bevelled stone, a grave, a crate stack, a pillar or a boulder. */
export function drawBlock(g: G, b: Block, top: number, theme: StageTheme) {
  const [dark, body, light, trim] = stoneFor(theme)
  const x = Math.round(b.x)
  const y = Math.round(top)
  g.save()
  g.fillStyle = rgba(INK, 0.35)
  g.fillRect(x + 2, y + 2, b.w, b.h)
  if (b.look === 'crate') {
    g.fillStyle = '#5b3a1e'
    g.fillRect(x, y, b.w, b.h)
    g.fillStyle = '#8a5a2b'
    g.fillRect(x + 1, y + 1, b.w - 2, b.h - 2)
    g.strokeStyle = '#3a2412'
    g.lineWidth = 1
    for (let yy = y + 8; yy < y + b.h; yy += 8) {
      g.beginPath()
      g.moveTo(x, yy + 0.5)
      g.lineTo(x + b.w, yy + 0.5)
      g.stroke()
    }
    g.beginPath()
    g.moveTo(x + 1, y + 1)
    g.lineTo(x + b.w - 1, y + b.h - 1)
    g.stroke()
  } else if (b.look === 'pillar') {
    const grad = g.createLinearGradient(x, 0, x + b.w, 0)
    grad.addColorStop(0, dark)
    grad.addColorStop(0.35, light)
    grad.addColorStop(1, dark)
    g.fillStyle = grad
    g.fillRect(x + 2, y + 4, b.w - 4, b.h - 4)
    g.fillStyle = body
    g.fillRect(x, y, b.w, 5)
    g.fillRect(x, y + b.h - 4, b.w, 4)
    g.fillStyle = trim
    g.fillRect(x, y, b.w, 1)
  } else if (b.look === 'rock') {
    g.fillStyle = dark
    g.beginPath()
    g.moveTo(x, y + b.h)
    g.lineTo(x + 2, y + 4)
    g.lineTo(x + b.w * 0.4, y)
    g.lineTo(x + b.w - 3, y + 2)
    g.lineTo(x + b.w, y + b.h)
    g.closePath()
    g.fill()
    g.fillStyle = body
    g.beginPath()
    g.moveTo(x + 3, y + b.h - 2)
    g.lineTo(x + 4, y + 5)
    g.lineTo(x + b.w * 0.4, y + 2)
    g.lineTo(x + b.w * 0.6, y + b.h * 0.6)
    g.closePath()
    g.fill()
    g.fillStyle = light
    g.fillRect(x + b.w * 0.4 - 1, y + 1, 4, 1)
  } else {
    // Dressed stone (and graves, which the slice's terrain draws when 12x16).
    g.fillStyle = dark
    g.fillRect(x, y, b.w, b.h)
    g.fillStyle = body
    g.fillRect(x + 1, y + 1, b.w - 2, b.h - 2)
    g.fillStyle = mix(body, dark, 0.35)
    for (let yy = y + 8; yy < y + b.h - 1; yy += 8) {
      g.fillRect(x + 1, yy, b.w - 2, 1)
      const off = ((yy - y) / 8) % 2 ? 8 : 0
      for (let xx = x + 4 + off; xx < x + b.w - 2; xx += 16)
        g.fillRect(xx, yy - 7, 1, 7)
    }
    g.fillStyle = light
    g.fillRect(x + 1, y + 1, b.w - 2, 1)
    g.fillRect(x + 1, y + 1, 1, b.h - 2)
    g.fillStyle = trim
    g.fillRect(x, y, b.w, 1)
  }
  g.restore()
}

/** A moving platform at its current position (world space). */
export function drawMover(
  g: G,
  m: Mover,
  x: number,
  y: number,
  theme: StageTheme,
  tick: number,
) {
  const [dark, body, light, trim] = stoneFor(theme)
  const px = Math.round(x)
  const py = Math.round(y)
  g.save()
  if (m.look === 'raft') {
    g.fillStyle = '#4a2f18'
    g.fillRect(px, py, m.w, 5)
    g.fillStyle = '#7a5230'
    for (let i = 0; i < m.w; i += 6) g.fillRect(px + i, py, 5, 4)
    g.fillStyle = '#a8794a'
    g.fillRect(px, py, m.w, 1)
  } else if (m.look === 'bell') {
    // A bell hung from a beam: the beam is the platform, the bell swings under it.
    g.strokeStyle = '#2a1d16'
    g.beginPath()
    g.moveTo(px + m.w / 2, py)
    g.lineTo(px + m.w / 2, 0)
    g.stroke()
    g.fillStyle = '#4b3220'
    g.fillRect(px, py, m.w, 4)
    g.fillStyle = '#7a5230'
    g.fillRect(px, py, m.w, 1)
    const sway = Math.sin(tick / 20) * 2
    const cx = px + m.w / 2 + sway
    const bell = g.createLinearGradient(cx - 9, 0, cx + 9, 0)
    bell.addColorStop(0, '#6b4a12')
    bell.addColorStop(0.4, '#e3b341')
    bell.addColorStop(1, '#6b4a12')
    g.fillStyle = bell
    g.beginPath()
    g.moveTo(cx - 5, py + 4)
    g.quadraticCurveTo(cx - 6, py + 14, cx - 10, py + 19)
    g.lineTo(cx + 10, py + 19)
    g.quadraticCurveTo(cx + 6, py + 14, cx + 5, py + 4)
    g.closePath()
    g.fill()
  } else {
    g.fillStyle = rgba(INK, 0.4)
    g.fillRect(px + 2, py + 3, m.w, 6)
    g.fillStyle = dark
    g.fillRect(px, py, m.w, 6)
    g.fillStyle = body
    g.fillRect(px + 1, py + 1, m.w - 2, 3)
    g.fillStyle = light
    g.fillRect(px + 1, py + 1, m.w - 2, 1)
    g.fillStyle = trim
    g.fillRect(px + 2, py + 4, 2, 1)
    g.fillRect(px + m.w - 4, py + 4, 2, 1)
    if (m.look === 'lift') {
      g.strokeStyle = rgba('#d6d3d1', 0.5)
      g.beginPath()
      g.moveTo(px + 3.5, py)
      g.lineTo(px + 3.5, 0)
      g.moveTo(px + m.w - 3.5, py)
      g.lineTo(px + m.w - 3.5, 0)
      g.stroke()
    }
  }
  g.restore()
}

/** Ground that hurts (world space); `live` false shows a timed hazard cooling (its tell). */
export function drawHazard(
  g: G,
  h: Hazard,
  groundY: number,
  live: boolean,
  warm: boolean,
  tick: number,
) {
  g.save()
  if (h.kind === 'spikes') {
    g.fillStyle = '#d6d3d1'
    for (let x = h.x; x < h.x + h.w; x += 6) {
      g.beginPath()
      g.moveTo(x, groundY)
      g.lineTo(x + 3, groundY - 8)
      g.lineTo(x + 6, groundY)
      g.closePath()
      g.fill()
    }
    g.fillStyle = '#78716c'
    for (let x = h.x; x < h.x + h.w; x += 6)
      g.fillRect(x + 3, groundY - 6, 1, 6)
  } else {
    const hot = h.kind === 'ritual' ? '#e879f9' : '#f97316'
    const base = h.kind === 'ritual' ? '#581c87' : '#7c2d12'
    g.fillStyle = base
    g.fillRect(h.x, groundY - 3, h.w, 3)
    if (live || warm) {
      const a = live ? 1 : 0.35 + 0.25 * Math.sin(tick / 3)
      g.globalAlpha = a
      for (let x = h.x + 2; x < h.x + h.w - 2; x += 5) {
        const f = 5 + ((x * 7 + tick) % 9)
        g.fillStyle = hot
        g.fillRect(x, groundY - f, 3, f)
        g.fillStyle = '#fde68a'
        g.fillRect(x + 1, groundY - f + 2, 1, f - 3)
      }
      g.globalAlpha = 1
      if (live) glow(g, h.x + h.w / 2, groundY - 4, h.w * 0.6, hot, 0.35)
    }
  }
  g.restore()
}

/** A column of rising air (world space): streaks drifting up. */
export function drawUpdraft(g: G, u: Updraft, groundY: number, tick: number) {
  g.save()
  const grad = g.createLinearGradient(0, u.top, 0, groundY)
  grad.addColorStop(0, rgba('#c7d2fe', 0))
  grad.addColorStop(1, rgba('#c7d2fe', 0.16))
  g.fillStyle = grad
  g.fillRect(u.x, u.top, u.w, groundY - u.top)
  g.fillStyle = rgba('#e0e7ff', 0.55)
  for (let i = 0; i < Math.max(3, u.w / 8); i++) {
    const x = u.x + ((i * 37) % u.w)
    const span = groundY - u.top
    const y = groundY - ((tick * 2 + i * 53) % span)
    g.fillRect(x, y, 1, 6)
  }
  g.restore()
}

/** The water line across the screen (world space, caller translated); `warning` ripples it. */
export function drawWater(
  g: G,
  camX: number,
  y: number,
  warning: boolean,
  tick: number,
) {
  g.save()
  const top = Math.round(y)
  const grad = g.createLinearGradient(0, top, 0, H)
  grad.addColorStop(0, rgba('#2dd4bf', 0.42))
  grad.addColorStop(1, rgba('#0f3d3e', 0.72))
  g.fillStyle = grad
  g.fillRect(camX - 4, top, W + 8, H - top)
  g.fillStyle = rgba(warning ? '#fde68a' : '#a7f3d0', warning ? 0.9 : 0.6)
  for (let x = camX - (camX % 8) - 8; x < camX + W + 8; x += 8) {
    const dy = Math.sin((x + tick * 1.5) / 9) * 1.5
    g.fillRect(x, top + dy, 5, 1)
  }
  g.restore()
}

/** A hostile projectile (world space). Pillars glow while arming: their tell. */
export function drawBolt(g: G, b: Bolt, tick: number) {
  g.save()
  const x = b.x
  const y = b.y
  switch (b.kind) {
    case 'bullet':
      g.fillStyle = '#fde68a'
      g.fillRect(x - 3, y - 1, 6, 2)
      g.fillStyle = rgba('#fde68a', 0.4)
      g.fillRect(x - 8 * Math.sign(b.vx || 1), y, 6, 1)
      break
    case 'orb':
      glow(g, x, y, 9, '#67e8f9', 0.5)
      g.fillStyle = '#cffafe'
      g.beginPath()
      g.arc(x, y, 3, 0, Math.PI * 2)
      g.fill()
      break
    case 'bone':
      g.translate(x, y)
      g.rotate(b.t / 4)
      g.fillStyle = '#f5f5f4'
      g.fillRect(-4, -1, 8, 2)
      g.fillRect(-5, -2, 2, 4)
      g.fillRect(3, -2, 2, 4)
      break
    case 'feather':
      g.translate(x, y)
      g.rotate(Math.atan2(b.vy, b.vx))
      g.fillStyle = '#334155'
      g.fillRect(-5, -1, 10, 2)
      g.fillStyle = '#94a3b8'
      g.fillRect(-5, -1, 10, 1)
      break
    case 'ember':
      glow(g, x, y, 8, '#f97316', 0.45)
      g.fillStyle = (tick + b.t) % 6 < 3 ? '#fdba74' : '#f97316'
      g.fillRect(
        x - Math.min(b.hw, 3),
        y - Math.min(b.hh, 3),
        Math.min(b.hw, 3) * 2,
        Math.min(b.hh, 3) * 2,
      )
      break
    case 'pillar': {
      if (b.arm > 0) {
        const a = 0.3 + 0.4 * ((tick % 8) / 8)
        g.fillStyle = rgba('#ef4444', a)
        g.fillRect(x - b.hw, y + b.hh - 3, b.hw * 2, 3)
      } else {
        const grad = g.createLinearGradient(0, y - b.hh, 0, y + b.hh)
        grad.addColorStop(0, rgba('#fecaca', 0.2))
        grad.addColorStop(1, '#dc2626')
        g.fillStyle = grad
        g.fillRect(x - b.hw, y - b.hh, b.hw * 2, b.hh * 2)
        glow(g, x, y + b.hh - 4, b.hw * 2, '#ef4444', 0.4)
      }
      break
    }
    case 'wave':
      g.fillStyle = rgba('#5eead4', 0.75)
      g.fillRect(x - b.hw, y - b.hh, b.hw * 2, b.hh * 2)
      g.fillStyle = '#ccfbf1'
      g.fillRect(x - b.hw, y - b.hh, b.hw * 2, 2)
      break
    case 'chain':
      g.strokeStyle = '#a8a29e'
      g.lineWidth = 2
      g.beginPath()
      g.moveTo(x - b.hw, y)
      g.lineTo(x + b.hw, y)
      g.stroke()
      break
    case 'anchor':
      g.fillStyle = '#57534e'
      g.fillRect(x - 2, y - b.hh, 4, b.hh * 2)
      g.fillRect(x - b.hw, y + b.hh - 3, b.hw * 2, 3)
      g.fillStyle = '#a8a29e'
      g.fillRect(x - 1, y - b.hh, 1, b.hh * 2)
      break
    default:
      g.fillStyle = '#7c5a32'
      g.beginPath()
      g.arc(x, y, 3, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = '#a07a45'
      g.fillRect(x - 1, y - 2, 2, 1)
  }
  g.restore()
}

/** Stand-in palettes for foes whose portraits are still being painted. */
const STAND_IN: Record<string, [string, string, string]> = {
  gunslinger: ['#e7e0cf', '#7c2d12', '#ef4444'],
  monk: ['#a5f3fc', '#164e63', '#67e8f9'],
  ghoul: ['#a3a380', '#3f3f2a', '#facc15'],
  drowned: ['#5eead4', '#134e4a', '#ccfbf1'],
  leech: ['#7f1d1d', '#450a0a', '#fca5a5'],
  harpy: ['#94a3b8', '#1e293b', '#fde68a'],
  wraith: ['#c7d2fe', '#3730a3', '#e0e7ff'],
  imp: ['#fb923c', '#7c2d12', '#fde68a'],
  acolyte: ['#dc2626', '#450a0a', '#fecaca'],
  shade: ['#6b21a8', '#1e1b4b', '#e879f9'],
  sister: ['#e7e5e4', '#44403c', '#fbbf24'],
}

export type StandInFoe = {
  kind: string
  x: number
  y: number
  t: number
  phase: string
  face: number
  hw: number
  cy: number
  hh: number
}

/** A simple shaded body for a foe the slice's foeArt doesn't draw yet; glows during its tell. */
export function drawStandInFoe(g: G, f: StandInFoe, tick: number) {
  const [body, dark, eye] = STAND_IN[f.kind] ?? [
    '#d6d3d1',
    '#44403c',
    '#fde68a',
  ]
  const cx = f.x
  const cy = f.y - f.cy
  const bob = Math.sin((f.t + tick) / 8) * 1
  g.save()
  if (f.phase === 'aim') glow(g, cx, cy, f.hw * 2.4, eye, 0.45)
  g.fillStyle = rgba(INK, 0.3)
  g.fillRect(cx - f.hw, f.y - 1, f.hw * 2, 2)
  const grad = g.createLinearGradient(cx - f.hw, 0, cx + f.hw, 0)
  grad.addColorStop(0, dark)
  grad.addColorStop(0.45, body)
  grad.addColorStop(1, dark)
  g.fillStyle = grad
  g.beginPath()
  g.ellipse(cx, cy + bob, f.hw, f.hh, 0, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = INK
  g.fillRect(cx + f.face * 3 - 2, cy - f.hh * 0.45 + bob, 5, 3)
  g.fillStyle = eye
  g.fillRect(cx + f.face * 4 - 1, cy - f.hh * 0.45 + bob + 1, 2, 1)
  g.restore()
}

export type StandInBoss = {
  x: number
  y: number
  hw: number
  height: number
  t: number
  flash: number
  mode: string
  face: number
  phase: number
}

/** A stand-in body for a boss whose portrait is still being painted. */
export function drawStandInBoss(
  g: G,
  b: StandInBoss,
  color: string,
  tick: number,
) {
  g.save()
  const cy = b.y - b.height / 2
  glow(g, b.x, cy, b.height, color, b.mode.startsWith('wind') ? 0.6 : 0.25)
  const grad = g.createLinearGradient(b.x - b.hw, 0, b.x + b.hw, 0)
  grad.addColorStop(0, mix(color, INK, 0.6))
  grad.addColorStop(0.5, b.flash > 0 ? '#ffffff' : color)
  grad.addColorStop(1, mix(color, INK, 0.6))
  g.fillStyle = grad
  g.beginPath()
  g.ellipse(
    b.x,
    cy + Math.sin(tick / 10) * 1.5,
    b.hw,
    b.height / 2,
    0,
    0,
    Math.PI * 2,
  )
  g.fill()
  g.fillStyle = '#fde68a'
  g.fillRect(b.x + b.face * 5 - 2, cy - b.height * 0.25, 4, 2)
  g.restore()
}

// --- cards ---------------------------------------------------------------------------------------

export type Card = {
  kind: 'title' | 'story' | 'credits'
  /** Big line (stage name), small line (act name), and the body text. */
  heading: string
  sub?: string
  lines: string[]
  /** Ticks shown so far. */
  age: number
}

/** Full-screen title card, story page or credits roll (screen space), over a dimmed scene. */
export function drawCard(g: G, card: Card) {
  g.save()
  const fade = Math.min(1, card.age / 20)
  g.fillStyle = rgba('#0b0614', 0.86 * fade)
  g.fillRect(0, 0, W, H)
  g.globalAlpha = fade
  if (card.kind === 'credits') {
    const y0 = H - card.age * 0.35
    drawText(g, card.heading, W / 2, y0, {
      align: 'center',
      color: '#fde68a',
      scale: 2,
    })
    card.lines.forEach((line, i) => {
      const y = y0 + 34 + i * 12
      if (y > -10 && y < H + 10)
        drawText(g, line, W / 2, y, {
          align: 'center',
          color:
            line === line.toUpperCase() && line.length < 28
              ? '#fbbf24'
              : '#e7e5e4',
        })
    })
  } else {
    // A rule frame like a book plate.
    g.strokeStyle = rgba('#d6b25e', 0.8)
    g.strokeRect(20.5, 34.5, W - 41, H - 69)
    g.strokeStyle = rgba('#d6b25e', 0.35)
    g.strokeRect(24.5, 38.5, W - 49, H - 77)
    if (card.sub)
      drawText(g, card.sub, W / 2, 52, { align: 'center', color: '#d6b25e' })
    drawText(g, card.heading, W / 2, 66, {
      align: 'center',
      color: '#fde68a',
      scale: 2,
    })
    const shown = Math.floor(card.age / 2)
    let budget = shown
    card.lines.forEach((line, i) => {
      if (budget <= 0) return
      const text = line.slice(0, budget)
      budget -= line.length
      drawText(g, text, W / 2, 98 + i * 12, {
        align: 'center',
        color: '#e7e5e4',
      })
    })
    if (card.age > 40 && Math.floor(card.age / 20) % 2 === 0)
      drawText(g, 'PRESS A', W / 2, H - 50, {
        align: 'center',
        color: '#a8a29e',
      })
  }
  g.restore()
}
