// /utils/arcade/bumperBubbles/slice4Art.ts
//
// Art for Fizzwick Tower's last three wings (conductor kr-arcade/t-062): the Jelly Mould and the
// Grumble Fizz King, the dark floors' lamplight, the rooftop's rain and lightning, the Fizz
// King's bottle caps and the thunder puffs' bolts, and the endings' credits.

import { INK, RAMPS, glow, rgba, shadedOrb } from '../snes'
import type { Ramp } from '../snes'
import { KING } from './bosses'
import type { Boss } from './bosses'
import type { Hazard } from './grumps'
import { FLOOR_Y, H, TOP, W } from './tower'

const JELLY: Ramp = ['#3a0a3a', '#8a1a8a', '#d040d0', '#f090f0', '#ffe0ff']
const GLASS: Ramp = ['#0e3b2a', '#17803f', '#4ade80', '#a7f3c0', '#effff4']

/** How far a robot's antennae light a dark floor (a Lamp item widens it). */
export const LAMP_RADIUS = 34
export const LAMP_WIDE = 62

/** The Jelly Mould: a wobbling mound with a glowing core that only lamplight shows. */
export function paintJelly(
  g: CanvasRenderingContext2D,
  b: Boss,
  tick: number,
  alpha = 1,
) {
  g.save()
  g.globalAlpha *= alpha
  const wob = Math.sin(tick / 8) * 1.5
  const x = b.x
  const y = b.y + wob * 0.5
  shadedOrb(g, x, y, b.r + wob * 0.4, JELLY, { outline: INK })
  // The core: a bright seed inside, glinting.
  glow(g, x, y, b.r * 0.6, RAMPS.gold[3], 0.35 + 0.15 * Math.sin(tick / 5))
  g.fillStyle = RAMPS.gold[4]
  g.fillRect(Math.round(x) - 2, Math.round(y) - 2, 4, 4)
  // Sulky eyes.
  const e = Math.max(3, b.r * 0.35)
  for (const s of [-1, 1]) {
    g.fillStyle = '#ffffff'
    g.fillRect(Math.round(x + s * e) - 2, Math.round(y - b.r * 0.3) - 2, 4, 4)
    g.fillStyle = INK
    g.fillRect(
      Math.round(x + s * e) - 1 + (b.vx > 0 ? 1 : 0),
      Math.round(y - b.r * 0.3) - 1,
      2,
      3,
    )
  }
  g.restore()
}

/** The Grumble Fizz King: a huge sulking bottle with a cap, a crown of crates behind; tiny and cheerful at the end. */
export function paintKing(
  g: CanvasRenderingContext2D,
  b: Boss,
  tick: number,
  alpha = 1,
) {
  g.save()
  g.globalAlpha *= alpha
  const x = Math.round(b.x)
  const y = Math.round(b.y)
  const tiny = b.phase === 3
  const shake =
    b.phase === 2 || (b.phase === 1 && b.t % 120 > 120 - KING.tell)
      ? tick % 4 < 2
        ? -1
        : 1
      : 0
  if (!tiny) {
    // The throne of crates.
    for (let i = -2; i <= 2; i++) {
      const cx = x + i * 14
      g.fillStyle = INK
      g.fillRect(cx - 7, FLOOR_Y - 14, 14, 14)
      g.fillStyle = RAMPS.earth[2]
      g.fillRect(cx - 6, FLOOR_Y - 13, 12, 12)
      g.fillStyle = RAMPS.earth[3]
      g.fillRect(cx - 6, FLOOR_Y - 13, 12, 2)
      g.fillStyle = RAMPS.earth[1]
      g.fillRect(cx - 1, FLOOR_Y - 13, 2, 12)
    }
  }
  const r = b.r
  // The bottle: body, shoulders, neck.
  shadedOrb(g, x + shake, y + 2, r, GLASS, { outline: INK })
  if (!tiny) {
    g.fillStyle = INK
    g.fillRect(x - 8 + shake, y - r - 12, 16, 14)
    g.fillStyle = GLASS[2]
    g.fillRect(x - 7 + shake, y - r - 11, 14, 12)
    g.fillStyle = GLASS[3]
    g.fillRect(x - 6 + shake, y - r - 11, 3, 12)
    // The cap, popping off in phase 3 (then he is the tiny bot).
    g.fillStyle = INK
    g.fillRect(x - 9 + shake, y - r - 18, 18, 7)
    g.fillStyle = RAMPS.gold[3]
    g.fillRect(x - 8 + shake, y - r - 17, 16, 5)
    g.fillStyle = RAMPS.gold[4]
    g.fillRect(x - 8 + shake, y - r - 17, 16, 1)
    // Fizz bubbling up inside.
    for (let i = 0; i < 4; i++) {
      g.fillStyle = rgba('#ffffff', 0.6)
      g.fillRect(
        x - 8 + ((i * 7 + tick / 3) % 16),
        y + r - 4 - ((tick + i * 9) % (r * 1.6)),
        1,
        1,
      )
    }
  }
  // The face: a sulk, or a grin once the cap is off.
  const ey = y - Math.round(r * 0.1)
  for (const s of [-1, 1]) {
    g.fillStyle = '#ffffff'
    g.fillRect(x + s * Math.round(r * 0.4) - 2, ey - 2, 4, 4)
    g.fillStyle = INK
    g.fillRect(x + s * Math.round(r * 0.4) - 1, ey - 1, 2, 3)
  }
  g.fillStyle = INK
  if (tiny) {
    g.fillRect(x - 2, ey + 4, 5, 1)
    g.fillRect(x - 3, ey + 3, 1, 1)
    g.fillRect(x + 3, ey + 3, 1, 1)
    // A little party cap.
    g.fillStyle = RAMPS.pink[3]
    g.fillRect(x - 2, y - r - 3, 5, 3)
    g.fillStyle = RAMPS.gold[4]
    g.fillRect(x, y - r - 5, 1, 2)
  } else {
    g.fillRect(x - 4, ey + 8, 9, 1)
    g.fillRect(x - 5, ey + 9, 1, 1)
    g.fillRect(x + 5, ey + 9, 1, 1)
    // Heavy brows.
    g.fillRect(x - 10, ey - 5, 7, 1)
    g.fillRect(x + 4, ey - 5, 7, 1)
  }
  g.restore()
}

/** A bottle cap flying, and a bolt of lightning (a thunder puff's, or the storm's). */
export function paintHazardExtra(
  g: CanvasRenderingContext2D,
  h: Hazard,
  tick: number,
): boolean {
  if (h.kind === 'cap') {
    const x = Math.round(h.x)
    const y = Math.round(h.y)
    g.fillStyle = INK
    g.fillRect(x - 3, y - 3, 7, 7)
    g.fillStyle = RAMPS.gold[3]
    g.fillRect(x - 2, y - 2, 5, 5)
    g.fillStyle = tick % 6 < 3 ? RAMPS.gold[4] : '#ffffff'
    g.fillRect(x - 2, y - 2, 2, 1)
    return true
  }
  if (h.kind === 'bolt') {
    const y0 = Math.round(h.y)
    const y1 = Math.round(h.y1 ?? FLOOR_Y)
    if ((h.warn ?? 0) > 0) {
      // The tell: a flickering line of light, then the sky flashing.
      if (tick % 4 < 2) {
        g.fillStyle = rgba('#ffffff', 0.35)
        g.fillRect(Math.round(h.x), y0, 1, y1 - y0)
      }
      return true
    }
    g.strokeStyle = INK
    g.lineWidth = 4
    const path = () => {
      g.beginPath()
      g.moveTo(h.x, y0)
      for (let y = y0 + 8; y < y1; y += 8)
        g.lineTo(h.x + ((y * 7 + tick * 3) % 9) - 4, y)
      g.lineTo(h.x, y1)
    }
    path()
    g.stroke()
    g.strokeStyle = RAMPS.gold[4]
    g.lineWidth = 2
    path()
    g.stroke()
    glow(g, h.x, (y0 + y1) / 2, 28, '#ffffff', 0.35)
    return true
  }
  return false
}

/** Rain: slanted streaks falling with the wind, and a flash when lightning is about to strike. */
export function paintRain(
  g: CanvasRenderingContext2D,
  tick: number,
  wind: number,
  flash: number,
) {
  g.fillStyle = rgba('#cfe0ff', 0.55)
  for (let i = 0; i < 46; i++) {
    const sx = (i * 53) % W
    const speed = 5 + (i % 4)
    const y = (tick * speed + i * 37) % (H + 20)
    const x = (sx + y * 0.25 * (wind === 0 ? 0.4 : wind) + W) % W
    g.fillRect(Math.round(x), Math.round(y) - 10, 1, 4)
  }
  if (flash > 0) {
    g.fillStyle = rgba('#ffffff', Math.min(0.35, flash / 120))
    g.fillRect(0, TOP, W, H - TOP)
  }
}

/**
 * The Haunted Pantry's dark: the floor fades to near black except round the robots' antennae
 * (and any glowing thing). `lights` are the pools of light; a Lamp makes them wide.
 */
export function paintDarkness(
  g: CanvasRenderingContext2D,
  lights: ReadonlyArray<{ x: number; y: number; r: number }>,
) {
  const layer =
    typeof document !== 'undefined' ? document.createElement('canvas') : null
  const k = layer?.getContext('2d')
  if (!layer || !k) {
    // Headless: a plain dim veil with no pools.
    g.fillStyle = rgba('#05030c', 0.72)
    g.fillRect(0, TOP, W, H - TOP)
    return
  }
  layer.width = W
  layer.height = H
  k.fillStyle = rgba('#05030c', 0.86)
  k.fillRect(0, 0, W, H)
  k.globalCompositeOperation = 'destination-out'
  for (const l of lights) {
    const grad = k.createRadialGradient(l.x, l.y, 2, l.x, l.y, l.r)
    grad.addColorStop(0, 'rgba(0,0,0,1)')
    grad.addColorStop(0.65, 'rgba(0,0,0,0.75)')
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    k.fillStyle = grad
    k.beginPath()
    k.arc(l.x, l.y, l.r, 0, Math.PI * 2)
    k.fill()
  }
  g.drawImage(layer, 0, 0)
}
