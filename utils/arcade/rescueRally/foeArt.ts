// /utils/arcade/rescueRally/foeArt.ts
//
// Rescue Rally's roster on screen (conductor kr-arcade t-035/t-036): the pixel-sprite foes and the
// ones painted from shapes (the stomper's legs and key, the hypno's dome and swirly eyes, the
// spawner's throbbing gem, the glitch puddles, the crates), with every tell the roster's rules show.

import { drawText } from '../font'
import {
  INK,
  RAMPS,
  bevel,
  dropShadow,
  drawSprite,
  glow,
  rgba,
  shadedOrb,
} from '../snes'
import type { Ramp } from '../snes'
import {
  DRONE_SPRITES,
  GLITCH,
  LIME,
  PYLON_SPRITE,
  SEEKER_SPRITES,
  SPARKER_SPRITE,
  TANK_SPRITES,
  WINDUP_SPRITES,
} from './art'
import { STOMP_REWIND } from './roster'
import type { Foe } from './roster'

export function renderFoe(g: CanvasRenderingContext2D, f: Foe, tick: number) {
  switch (f.kind) {
    case 'drone': {
      const step = f.timer % 12 < 7 ? 1 : 0
      const sprite = DRONE_SPRITES[step]
      dropShadow(g, f.x, f.y + 9, 8, 2.2, 0.35)
      drawSprite(g, sprite, f.x, f.y + step)
      // Every so often the glitch tears a scanline sideways.
      const glitch = (tick + Math.floor(f.seed * 13)) % 53
      if (glitch < 3) {
        const band = Math.round(f.y) - 4 + glitch * 3
        g.save()
        g.beginPath()
        g.rect(f.x - 11, band, 22, 2)
        g.clip()
        drawSprite(g, sprite, f.x + (glitch % 2 ? 3 : -3), f.y + step)
        g.restore()
        g.fillStyle = rgba(RAMPS.teal[3], 0.85)
        g.fillRect(Math.round(f.x) - 11, band, 2, 1)
        g.fillStyle = rgba(RAMPS.ember[2], 0.85)
        g.fillRect(Math.round(f.x) + 9, band + 1, 2, 1)
      }
      break
    }
    case 'seeker': {
      const sprite = SEEKER_SPRITES[Math.floor(tick / 4) % 2 ? 1 : 0]
      glow(g, f.x, f.y, 11, RAMPS.pink[3], 0.45)
      drawSprite(g, sprite, f.x - f.vx * 3, f.y - f.vy * 3, { alpha: 0.35 })
      dropShadow(g, f.x, f.y + 8, 4, 1.2, 0.3)
      drawSprite(g, sprite, f.x, f.y)
      break
    }
    case 'tank': {
      const sprite = TANK_SPRITES[Math.floor(tick / 5) % 3]!
      dropShadow(g, f.x, f.y + 10, 15, 3, 0.4)
      drawSprite(g, sprite, f.x, f.y)
      // The turret dome, and a scanning eye across it: red while healthy, gold when nearly rebooted.
      shadedOrb(g, f.x, f.y - 2, 6, RAMPS.steel)
      const eye = f.hp <= 2 ? RAMPS.gold : RAMPS.ember
      const ex = Math.round(f.x + Math.sin(tick / 14 + f.seed) * 3)
      const ey = Math.round(f.y - 2)
      glow(g, ex, ey, 10, eye[3], 0.55)
      g.fillStyle = eye[2]
      g.fillRect(ex - 3, ey - 1, 7, 3)
      g.fillStyle = eye[4]
      g.fillRect(ex - 1, ey - 1, 2, 1)
      break
    }
    case 'spawner':
      renderSpawner(g, f)
      break
    case 'stomper':
      renderStomper(g, f, tick)
      break
    case 'hypno':
      renderHypno(g, f, tick)
      break
    case 'sparker': {
      const flashing = f.mode === 1
      const on = flashing && Math.floor(tick / 3) % 2 === 0
      dropShadow(g, f.x, f.y + 9, 7, 2, 0.35)
      const hover = Math.round(Math.sin(tick / 9 + f.seed) * 1.5)
      glow(
        g,
        f.x,
        f.y - 9 + hover,
        flashing ? 22 : 9,
        RAMPS.gold[3],
        flashing ? 0.8 : 0.4,
      )
      drawSprite(g, SPARKER_SPRITE, f.x, f.y + hover)
      if (on) {
        // The tell: the coil flares white and crackles.
        g.fillStyle = '#ffffff'
        g.fillRect(Math.round(f.x) - 3, Math.round(f.y) - 9 + hover, 6, 3)
        g.strokeStyle = RAMPS.gold[4]
        g.lineWidth = 1
        for (let k = 0; k < 3; k++) {
          const a = (tick / 3 + k * 2.1) % (Math.PI * 2)
          g.beginPath()
          g.moveTo(f.x, f.y - 8 + hover)
          g.lineTo(f.x + Math.cos(a) * 8, f.y - 8 + hover + Math.sin(a) * 6)
          g.stroke()
        }
      }
      break
    }
    case 'pylon': {
      const hum = (tick + Math.floor(f.seed * 3)) % 90 < 45
      glow(g, f.x, f.y - 8, 9, RAMPS.teal[3], hum ? 0.45 : 0.3)
      dropShadow(g, f.x, f.y + 5, 5, 1.5, 0.4)
      drawSprite(g, PYLON_SPRITE, f.x, f.y + 6, { anchor: 'feet' })
      break
    }
    case 'windup': {
      const sprite = WINDUP_SPRITES[Math.floor(tick / 5) % 2]!
      dropShadow(g, f.x, f.y + 6, 5, 1.5, 0.35)
      drawSprite(g, sprite, f.x, f.y)
      break
    }
    case 'crate':
      renderCrate(g, f)
      break
    case 'puddle':
      break
  }
}

/** A toy crate: planks and a painted star, cracking as it takes hits. */
export function renderCrate(g: CanvasRenderingContext2D, f: Foe) {
  const x = Math.round(f.x) - 7
  const y = Math.round(f.y) - 7
  dropShadow(g, f.x, f.y + 8, 8, 2, 0.4)
  bevel(g, x, y, 14, 14, RAMPS.earth, { depth: 2 })
  g.fillStyle = RAMPS.earth[1]
  g.fillRect(x + 2, y + 4, 10, 1)
  g.fillRect(x + 2, y + 9, 10, 1)
  g.fillStyle = RAMPS.gold[3]
  g.fillRect(x + 6, y + 5, 2, 4)
  g.fillRect(x + 5, y + 6, 4, 2)
  if (f.hp < 3) {
    g.fillStyle = INK
    g.fillRect(x + 3, y + 2, 1, 4)
    g.fillRect(x + 4, y + 5, 1, 3)
  }
  if (f.hp < 2) {
    g.fillRect(x + 10, y + 7, 1, 5)
    g.fillRect(x + 9, y + 11, 1, 2)
  }
}

/** The stomper: a tin wind-up giant, painted from blocks so its legs, arms and key can move. */
export function renderStomper(
  g: CanvasRenderingContext2D,
  f: Foe,
  tick: number,
) {
  const rewinding = f.mode === 1
  const beat = f.timer % 20
  const lift = rewinding ? 0 : beat < 10 ? 1 : -1
  const x = Math.round(f.x)
  const y = Math.round(f.y)
  dropShadow(g, x, y + 13, 14, 3.5, 0.45)
  // The wind-up key behind it: spins steadily while walking, a blur while rewinding.
  const spin = tick * (rewinding ? 0.5 : 0.12) + f.seed
  const kw = Math.max(1, Math.round(Math.abs(Math.cos(spin)) * 8))
  g.fillStyle = INK
  g.fillRect(x - 1, y - 26, 3, 8)
  g.fillStyle = RAMPS.gold[2]
  g.fillRect(x, y - 25, 1, 7)
  for (const side of [-1, 1]) {
    const lx = side < 0 ? x - kw : x + 1
    g.fillStyle = INK
    g.fillRect(lx - 1, y - 30, kw + 2, 7)
    g.fillStyle = RAMPS.gold[3]
    g.fillRect(lx, y - 29, kw, 5)
    g.fillStyle = RAMPS.gold[4]
    g.fillRect(lx, y - 29, kw, 1)
  }
  // Legs, stamping in turn.
  const leg = (dx: number, up: number) =>
    bevel(g, x + dx, y + 4 - up * 2, 6, 9, RAMPS.steel, { depth: 1 })
  leg(-8, Math.max(0, lift))
  leg(2, Math.max(0, -lift))
  // Arms swing opposite the legs.
  bevel(g, x - 15, y - 12 + lift, 4, 12, RAMPS.steel, { depth: 1 })
  bevel(g, x + 11, y - 12 - lift, 4, 12, RAMPS.steel, { depth: 1 })
  // The tin body: red paint, rivets, a gold panel.
  bevel(g, x - 11, y - 14, 22, 19, RAMPS.rust, { depth: 2 })
  g.fillStyle = RAMPS.rust[4]
  for (const [rx, ry] of [
    [-9, -12],
    [8, -12],
    [-9, 2],
    [8, 2],
  ] as const)
    g.fillRect(x + rx, y + ry, 1, 1)
  bevel(g, x - 5, y - 9, 10, 8, RAMPS.gold, { depth: 1 })
  g.fillStyle = RAMPS.gold[1]
  g.fillRect(x - 3, y - 6, 6, 1)
  g.fillRect(x - 3, y - 4, 6, 1)
  // The head and its visor: eyes dim while it rewinds.
  bevel(g, x - 8, y - 25, 16, 11, RAMPS.steel, { depth: 2 })
  g.fillStyle = INK
  g.fillRect(x - 6, y - 22, 12, 5)
  const eye = rewinding ? RAMPS.ember[1] : RAMPS.ember[3]
  g.fillStyle = eye
  g.fillRect(x - 5, y - 21, 3, 2)
  g.fillRect(x + 2, y - 21, 3, 2)
  if (!rewinding) glow(g, x, y - 20, 12, RAMPS.ember[3], 0.35)
  if (rewinding) {
    // Click, click: the rewind shows as little ticks off the key.
    const t = STOMP_REWIND - f.clock
    if (t % 10 < 5) {
      drawText(g, 'CLICK', x, y - 40, {
        align: 'center',
        color: RAMPS.gold[3],
        outline: INK,
      })
    }
  } else if (beat < 4 || (beat >= 10 && beat < 14)) {
    // A stomp puffs dust off the floor.
    const side = beat < 10 ? -5 : 5
    g.fillStyle = rgba(RAMPS.steel[3], 0.6)
    g.fillRect(x + side - 3, y + 11 - (beat % 10), 2, 2)
    g.fillRect(x + side + 2, y + 12 - (beat % 10), 2, 2)
  }
}

/** The hypno: a brain-dome bot whose swirly eyes turn; it pulses rings while in its trance. */
export function renderHypno(g: CanvasRenderingContext2D, f: Foe, tick: number) {
  const x = Math.round(f.x)
  const y = Math.round(f.y + Math.sin(tick / 10 + f.seed) * 1.5)
  const trance = f.mode === 1
  dropShadow(g, f.x, f.y + 11, 9, 2.5, 0.4)
  glow(g, x, y - 4, trance ? 26 : 16, GLITCH[3], trance ? 0.55 : 0.3)
  if (trance) {
    g.save()
    g.globalCompositeOperation = 'lighter'
    for (let k = 0; k < 2; k++) {
      const t = (tick / 24 + k / 2) % 1
      g.globalAlpha = 1 - t
      g.strokeStyle = GLITCH[3]
      g.beginPath()
      g.arc(x, y - 2, 6 + t * 22, 0, Math.PI * 2)
      g.stroke()
    }
    g.restore()
  }
  // The saucer base.
  g.fillStyle = INK
  g.beginPath()
  g.ellipse(x, y + 5, 11, 5, 0, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = RAMPS.steel[2]
  g.beginPath()
  g.ellipse(x, y + 4, 10, 4, 0, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = RAMPS.steel[4]
  g.fillRect(x - 6, y + 2, 8, 1)
  // The brain dome, folds and all.
  shadedOrb(g, x, y - 4, 9, GLITCH)
  g.strokeStyle = GLITCH[1]
  g.lineWidth = 1
  for (const [ax, ay, r, s] of [
    [-3, -8, 3, 0],
    [3, -7, 3, 2],
    [0, -3, 4, 3.5],
  ] as const) {
    g.beginPath()
    g.arc(x + ax, y + ay, r, s, s + 2.4)
    g.stroke()
  }
  // The face band and the swirly eyes.
  g.fillStyle = INK
  g.fillRect(x - 8, y - 2, 16, 6)
  for (const side of [-1, 1]) {
    const ex = x + side * 4
    const ey = y + 1
    g.fillStyle = '#ffffff'
    g.fillRect(ex - 2, ey - 2, 5, 5)
    const a = (tick / 5) * side
    g.fillStyle = GLITCH[2]
    for (let k = 0; k < 3; k++) {
      const r = 0.6 + k * 0.7
      g.fillRect(
        Math.round(ex + Math.cos(a + k * 2.1) * r),
        Math.round(ey + Math.sin(a + k * 2.1) * r),
        1,
        1,
      )
    }
  }
}

export function renderSpawner(g: CanvasRenderingContext2D, f: Foe) {
  // It throbs, so it is a shaded vector gem rather than a pixel sprite.
  const r = 11 + Math.sin(f.timer / 8) * 1.8
  const x = f.x
  const y = f.y
  const ramp = RAMPS.purple
  glow(g, x, y, r + 14, ramp[3], 0.45)
  dropShadow(g, x, y + 15, 8, 2, 0.3)
  const diamond = (k: number, colour: string) => {
    g.fillStyle = colour
    g.beginPath()
    g.moveTo(x, y - k)
    g.lineTo(x + k, y)
    g.lineTo(x, y + k)
    g.lineTo(x - k, y)
    g.closePath()
    g.fill()
  }
  diamond(r + 1.5, INK)
  diamond(r, ramp[2])
  // Lit upper-left facet, shadowed lower-right facet.
  g.fillStyle = ramp[3]
  g.beginPath()
  g.moveTo(x, y - r)
  g.lineTo(x - r, y)
  g.lineTo(x, y)
  g.closePath()
  g.fill()
  g.fillStyle = ramp[1]
  g.beginPath()
  g.moveTo(x, y + r)
  g.lineTo(x + r, y)
  g.lineTo(x, y)
  g.closePath()
  g.fill()
  g.fillStyle = ramp[0]
  g.beginPath()
  g.moveTo(x, y + r)
  g.lineTo(x + r * 0.5, y + r * 0.5)
  g.lineTo(x, y + r * 0.6)
  g.closePath()
  g.fill()
  g.fillStyle = ramp[4]
  g.fillRect(Math.round(x - r * 0.5), Math.round(y - r * 0.5), 2, 1)
  shadedOrb(g, x, y, 3, RAMPS.gold)
  glow(g, x, y, 7, RAMPS.gold[3], 0.5)
  // Glitch shards orbit it.
  for (let i = 0; i < 3; i++) {
    const a = f.timer / 14 + (i * Math.PI * 2) / 3
    const ox = Math.round(x + Math.cos(a) * (r + 7))
    const oy = Math.round(y + Math.sin(a) * (r + 7))
    g.fillStyle = INK
    g.fillRect(ox - 1, oy - 1, 3, 3)
    g.fillStyle = i % 2 ? RAMPS.teal[3] : RAMPS.ember[3]
    g.fillRect(ox, oy, 1, 1)
  }
}

export function renderPuddle(
  g: CanvasRenderingContext2D,
  f: Foe,
  tick: number,
) {
  const on = (tick + f.seed * 10) % 30 < 20
  const x = f.x
  const y = f.y
  const ramp = on ? LIME : ([INK, LIME[0], LIME[1], LIME[2], LIME[3]] as Ramp)
  const blob = (dx: number, dy: number, rx: number, ry: number) => {
    g.beginPath()
    g.ellipse(x + dx, y + dy, rx, ry, 0, 0, Math.PI * 2)
    g.fill()
  }
  if (on) glow(g, x, y, 14, LIME[3], 0.3)
  g.fillStyle = INK
  blob(0, 0, 9, 6.5)
  g.fillStyle = ramp[1]
  blob(0, 0, 8, 5.5)
  g.fillStyle = ramp[2]
  blob(-1, -0.5, 6, 4)
  g.fillStyle = ramp[3]
  blob(-2, -1.5, 3, 1.8)
  g.fillStyle = INK
  blob(1.5, 1, 2.5, 1.5)
  // Bubbles pop on the surface while it is live.
  if (on) {
    const b = Math.floor((tick + f.seed * 7) / 5) % 4
    g.fillStyle = LIME[4]
    g.fillRect(Math.round(x) - 4 + b * 2, Math.round(y) - 2 + (b % 2), 1, 1)
    g.fillStyle = LIME[3]
    g.fillRect(Math.round(x) + 3 - b, Math.round(y) + 2, 1, 1)
  }
}
