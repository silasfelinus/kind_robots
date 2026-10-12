// /utils/arcade/butterflyBlaster/laterArt.ts
//
// The later regions' skies, weather and props (conductor kr-arcade/t-057): the Mangrove Delta's
// tide, fog and fireflies, Market Town's rooftops and festival strings, the Tea Hills' storm,
// the Great Swamp's reeds, the Moonlit Lagoon's mirrored sky and its coins of moonlight, and the
// special nights' firefly cloud, market stalls and pickers' shelter, and the bat squadron.

import { drawText } from '../font'
import {
  INK,
  RAMPS,
  backdropRng,
  bandedGradient,
  glow,
  mix,
  rgba,
  shadedOrb,
} from '../snes'
import type { Ramp } from '../snes'
import { paintGround, paintHut, paintSky } from './art'
import { GROUND, H, W } from './sky'
import type { Point } from './sky'
import type { Escort, Shelter, Stall } from './specials'
import { MARKET } from './specials'
import { HUT_COUNT, hutX } from './village'
import type { Weather } from './weather'
import { FIREFLY, FOG, STORM, STRINGS, stringY } from './weather'

const dim = (ramp: Ramp, k: number) =>
  ramp.map((c) => mix(c, RAMPS.night[1], k)) as unknown as Ramp

function huts(k: CanvasRenderingContext2D) {
  for (let i = 0; i < HUT_COUNT; i++) paintHut(k, hutX(i))
}

// --- backdrops -----------------------------------------------------------------------------------------

export function paintDelta(k: CanvasRenderingContext2D) {
  paintSky(k, [
    RAMPS.night[0],
    mix(RAMPS.night[1], RAMPS.water[0], 0.4),
    mix(RAMPS.night[2], RAMPS.water[0], 0.5),
    mix(RAMPS.water[0], RAMPS.teal[0], 0.5),
    mix(RAMPS.teal[0], RAMPS.night[2], 0.4),
    mix(RAMPS.teal[1], RAMPS.night[2], 0.6),
  ])
  // Mangroves on both banks: crowns on stilted, arching roots.
  const rand = backdropRng(91)
  for (const x0 of [0, W - 120]) {
    for (let i = 0; i < 4; i++) {
      const x = x0 + 14 + i * 30 + rand() * 10
      const top = GROUND - 60 - rand() * 30
      k.strokeStyle = INK
      k.lineWidth = 3
      for (let r = -2; r <= 2; r++) {
        k.beginPath()
        k.moveTo(x, top + 26)
        k.quadraticCurveTo(x + r * 8, GROUND - 22, x + r * 12, GROUND)
        k.stroke()
      }
      k.fillStyle = INK
      k.beginPath()
      k.ellipse(x, top + 10, 24, 16, 0, 0, Math.PI * 2)
      k.fill()
      k.fillStyle = mix(RAMPS.leaf[0], RAMPS.night[1], 0.4)
      k.beginPath()
      k.ellipse(x, top + 10, 22, 14, 0, 0, Math.PI * 2)
      k.fill()
      k.fillStyle = mix(RAMPS.leaf[1], RAMPS.night[2], 0.5)
      k.beginPath()
      k.ellipse(x + 4, top + 6, 14, 8, 0, 0, Math.PI * 2)
      k.fill()
    }
  }
  paintGround(k, dim(RAMPS.water, 0.5))
  huts(k)
}

export function paintMarket(k: CanvasRenderingContext2D) {
  paintSky(k, [
    RAMPS.night[0],
    RAMPS.night[1],
    mix(RAMPS.night[2], RAMPS.purple[0], 0.5),
    RAMPS.purple[0],
    mix(RAMPS.purple[1], RAMPS.rust[0], 0.5),
    mix(RAMPS.rust[1], RAMPS.night[2], 0.5),
  ])
  // The town's rooftops along the skyline, a lit window here and there.
  const rand = backdropRng(97)
  let x = 0
  while (x < W) {
    const w = 26 + Math.floor(rand() * 30)
    const h = 34 + Math.floor(rand() * 40)
    const top = GROUND - h
    k.fillStyle = INK
    k.fillRect(x, top - 1, w, h + 1)
    k.fillStyle = mix(RAMPS.night[2], RAMPS.rust[0], 0.3)
    k.fillRect(x + 1, top, w - 2, h)
    k.fillStyle = mix(RAMPS.rust[1], RAMPS.night[2], 0.4)
    k.fillRect(x + 1, top, w - 2, 3)
    for (let wy = top + 8; wy < GROUND - 12; wy += 10)
      for (let wx = x + 5; wx < x + w - 6; wx += 9)
        if (rand() < 0.3) {
          k.fillStyle = RAMPS.gold[2]
          k.fillRect(wx, wy, 3, 4)
        }
    x += w + 2
  }
  // The poles the light strings hang from.
  for (const px of [3, W - 4]) {
    k.fillStyle = INK
    k.fillRect(px - 2, 70, 4, GROUND - 70)
    k.fillStyle = RAMPS.earth[2]
    k.fillRect(px - 1, 70, 2, GROUND - 70)
  }
  paintGround(k, dim(RAMPS.earth, 0.5))
  huts(k)
}

export function paintTea(k: CanvasRenderingContext2D) {
  paintSky(k, [
    mix(RAMPS.night[0], RAMPS.steel[0], 0.4),
    mix(RAMPS.night[1], RAMPS.steel[0], 0.5),
    mix(RAMPS.night[2], RAMPS.steel[1], 0.4),
    mix(RAMPS.steel[1], RAMPS.night[2], 0.5),
    mix(RAMPS.steel[1], RAMPS.leaf[0], 0.4),
    mix(RAMPS.leaf[0], RAMPS.night[2], 0.4),
  ])
  // Storm clouds banked along the top.
  k.save()
  k.globalAlpha = 0.7
  for (let i = 0; i < 9; i++) {
    k.fillStyle = mix(RAMPS.steel[0], RAMPS.night[1], 0.4)
    k.beginPath()
    k.ellipse(i * 60, 24 + (i % 2) * 10, 60, 26, 0, 0, Math.PI * 2)
    k.fill()
  }
  k.restore()
  // Rolling tea hills in rows, with the summit in the middle.
  for (const [base, amp, col] of [
    [GROUND - 30, 26, mix(RAMPS.leaf[0], RAMPS.night[1], 0.5)],
    [GROUND - 6, 18, mix(RAMPS.leaf[1], RAMPS.night[1], 0.55)],
  ] as const) {
    k.fillStyle = col
    for (let x = 0; x < W; x += 2) {
      const h = amp * (1 - Math.abs(x - W / 2) / (W / 2)) + Math.sin(x / 31) * 4
      k.fillRect(x, base - h, 2, GROUND - base + h)
    }
  }
  k.fillStyle = rgba(RAMPS.leaf[2], 0.35)
  for (let y = GROUND - 50; y < GROUND; y += 6)
    for (let x = (y * 3) % 12; x < W; x += 12) k.fillRect(x, y, 6, 1)
  paintGround(k, dim(RAMPS.leaf, 0.55))
  huts(k)
}

export function paintSwamp(k: CanvasRenderingContext2D) {
  paintSky(k, [
    RAMPS.night[0],
    mix(RAMPS.night[1], RAMPS.leaf[0], 0.3),
    mix(RAMPS.night[2], RAMPS.leaf[0], 0.5),
    mix(RAMPS.leaf[0], RAMPS.night[2], 0.3),
    mix(RAMPS.leaf[1], RAMPS.night[2], 0.6),
    mix(RAMPS.leaf[1], RAMPS.earth[1], 0.5),
  ])
  const rand = backdropRng(101)
  // Dead trees, leaning.
  for (const x of [40, 190, 330, 450]) {
    const h = 60 + rand() * 40
    k.strokeStyle = INK
    k.lineWidth = 4
    k.beginPath()
    k.moveTo(x, GROUND)
    k.lineTo(x + 8, GROUND - h)
    k.lineTo(x + 22, GROUND - h - 14)
    k.moveTo(x + 6, GROUND - h * 0.6)
    k.lineTo(x - 12, GROUND - h * 0.8)
    k.stroke()
    k.strokeStyle = mix(RAMPS.earth[1], RAMPS.night[1], 0.4)
    k.lineWidth = 2
    k.stroke()
  }
  // Reeds along the water.
  for (let i = 0; i < 140; i++) {
    const x = rand() * W
    const h = 8 + rand() * 18
    k.fillStyle = mix(RAMPS.leaf[1], RAMPS.night[1], 0.4)
    k.fillRect(Math.round(x), GROUND - h, 1, h)
    if (rand() < 0.2) {
      k.fillStyle = RAMPS.earth[1]
      k.fillRect(Math.round(x) - 1, GROUND - h - 4, 3, 5)
    }
  }
  paintGround(k, dim(RAMPS.leaf, 0.6))
  huts(k)
}

export function paintLagoon(k: CanvasRenderingContext2D) {
  paintSky(k, [
    RAMPS.night[0],
    RAMPS.night[1],
    mix(RAMPS.night[2], RAMPS.sky[0], 0.4),
    mix(RAMPS.sky[0], RAMPS.purple[0], 0.5),
    mix(RAMPS.purple[1], RAMPS.sky[1], 0.5),
    mix(RAMPS.sky[1], RAMPS.teal[1], 0.5),
  ])
  // The lagoon below mirrors the sky: a reflected band, the moon's road, and lilies.
  const top = GROUND - 48
  k.save()
  k.globalAlpha = 0.75
  bandedGradient(
    k,
    0,
    top,
    W,
    48,
    [RAMPS.sky[1], RAMPS.sky[0], RAMPS.night[1]],
    4,
  )
  k.restore()
  k.fillStyle = rgba(RAMPS.cream[4], 0.5)
  for (let y = top + 3; y < GROUND; y += 4) {
    const w = 18 - (y - top) / 4
    k.fillRect(W - 46 - w / 2, y, w, 1)
  }
  const rand = backdropRng(103)
  for (let i = 0; i < 40; i++) {
    k.fillStyle = rgba(RAMPS.sky[4], 0.6)
    k.fillRect(Math.round(rand() * W), Math.round(top + rand() * 46), 1, 1)
  }
  paintGround(k, dim(RAMPS.sky, 0.6))
  huts(k)
}

// --- weather ---------------------------------------------------------------------------------------------

/** The tide's water, risen over the ground, with a wavy surface. */
export function renderTide(
  g: CanvasRenderingContext2D,
  y: number,
  tick: number,
) {
  if (y >= GROUND) return
  g.save()
  g.fillStyle = rgba(RAMPS.water[1], 0.62)
  g.beginPath()
  g.moveTo(0, GROUND)
  for (let x = 0; x <= W; x += 8)
    g.lineTo(x, y + Math.sin(x / 20 + tick / 18) * 2)
  g.lineTo(W, GROUND)
  g.closePath()
  g.fill()
  g.strokeStyle = rgba(RAMPS.water[4], 0.7)
  g.lineWidth = 1
  g.beginPath()
  for (let x = 0; x <= W; x += 8) {
    const yy = y + Math.sin(x / 20 + tick / 18) * 2
    if (x) g.lineTo(x, yy)
    else g.moveTo(x, yy)
  }
  g.stroke()
  g.restore()
}

/** Fog banks: drawn over everything in them. */
export function renderFog(
  g: CanvasRenderingContext2D,
  w: Weather,
  lights: readonly Point[],
) {
  for (const f of w.fog) {
    const grad = g.createRadialGradient(f.x, f.y, 6, f.x, f.y, FOG.radius)
    grad.addColorStop(0, rgba(RAMPS.steel[3], 0.85))
    grad.addColorStop(0.7, rgba(RAMPS.steel[2], 0.6))
    grad.addColorStop(1, rgba(RAMPS.steel[2], 0))
    g.fillStyle = grad
    g.fillRect(
      f.x - FOG.radius,
      f.y - FOG.radius,
      FOG.radius * 2,
      FOG.radius * 2,
    )
  }
  // The fireflies' light lifts the fog where it shines.
  for (const l of lights) glow(g, l.x, l.y, FIREFLY.reach, RAMPS.gold[4], 0.18)
}

export function renderFireflies2(
  g: CanvasRenderingContext2D,
  w: Weather,
  tick: number,
) {
  for (const f of w.fireflies) {
    glow(g, f.x, f.y, 22, RAMPS.leaf[3], 0.35)
    g.fillStyle = Math.floor(tick / 6 + f.x) % 3 ? RAMPS.gold[4] : RAMPS.leaf[3]
    g.fillRect(Math.round(f.x) - 1, Math.round(f.y) - 1, 2, 2)
  }
}

export function renderStrings(
  g: CanvasRenderingContext2D,
  w: Weather,
  tick: number,
) {
  w.strings.forEach((s, i) => {
    g.strokeStyle = INK
    g.lineWidth = 1
    g.beginPath()
    for (let x = 0; x <= W; x += 8) {
      const y = stringY(s.y, x)
      if (x) g.lineTo(x, y)
      else g.moveTo(x, y)
    }
    g.stroke()
    for (let b = 0; b < STRINGS.bulbs * 3; b++) {
      const x = ((b + 0.5) / (STRINGS.bulbs * 3)) * W
      const y = stringY(s.y, x) + 3
      const lit = s.dim === 0
      const colour = [
        RAMPS.ember[2],
        RAMPS.gold[3],
        RAMPS.teal[3],
        RAMPS.pink[3],
      ][(b + i) % 4]!
      if (lit) glow(g, x, y, 9, colour, 0.45 + 0.1 * Math.sin(tick / 9 + b))
      g.fillStyle = INK
      g.fillRect(Math.round(x) - 2, Math.round(y) - 2, 5, 5)
      g.fillStyle = lit ? colour : RAMPS.night[3]
      g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3)
    }
  })
}

const RAIN = (() => {
  const rand = backdropRng(107)
  return Array.from({ length: 70 }, () => ({
    x: rand() * W,
    y: rand() * H,
    s: 5 + rand() * 3,
  }))
})()

export function renderStorm(
  g: CanvasRenderingContext2D,
  w: Weather,
  tick: number,
) {
  const st = w.storm
  if (!st.on) return
  // Rain.
  g.save()
  g.strokeStyle = rgba(RAMPS.sky[3], 0.4)
  g.lineWidth = 1
  g.beginPath()
  for (const r of RAIN) {
    const y = (r.y + tick * r.s) % GROUND
    g.moveTo(r.x, y)
    g.lineTo(r.x - 2, y + 7)
  }
  g.stroke()
  g.restore()
  // Rainbow updrafts that dry the wings.
  for (const u of st.updrafts) {
    const a = Math.min(1, u.t / 60, (STORM.updraft - u.t) / 30 + 0.2)
    g.save()
    g.globalAlpha = 0.28 * a
    const colours = ['#ef4444', '#facc15', '#4ade80', '#38bdf8', '#a78bfa']
    colours.forEach((c, i) => {
      g.fillStyle = c
      g.fillRect(u.x - STORM.updraftReach + i * 6, 0, 6, GROUND)
    })
    g.restore()
    const y = GROUND - ((tick * 2) % GROUND)
    g.fillStyle = rgba('#ffffff', 0.6 * a)
    g.fillRect(Math.round(u.x) - 1, y, 2, 6)
  }
  // A strike glowing on the ground before it lands, then the bolt.
  if (st.strike) {
    const k = 1 - st.strike.t / STORM.tell
    glow(g, st.strike.x, GROUND - 4, 16 + k * 20, RAMPS.gold[3], 0.3 + 0.5 * k)
    g.fillStyle = rgba(RAMPS.gold[4], 0.12 + 0.2 * k)
    g.fillRect(st.strike.x - STORM.reach, 0, STORM.reach * 2, GROUND)
  }
  if (st.struck) {
    g.strokeStyle = '#ffffff'
    g.lineWidth = 3
    g.beginPath()
    let x = st.struck.x
    g.moveTo(x, 0)
    for (let y = 18; y < GROUND; y += 18) {
      x = st.struck.x + (((y * 13) % 17) - 8)
      g.lineTo(x, y)
    }
    g.stroke()
  }
  if (st.flash > 0) {
    g.fillStyle = rgba('#ffffff', (st.flash / STORM.flash) * 0.35)
    g.fillRect(0, 0, W, GROUND)
  }
}

export function renderCoins(
  g: CanvasRenderingContext2D,
  w: Weather,
  tick: number,
) {
  for (const c of w.coins) {
    const bob = Math.sin(tick / 15 + c.phase) * 2
    const squash = Math.abs(Math.cos(tick / 20 + c.phase))
    glow(g, c.x, c.y + bob, 12, RAMPS.cream[4], 0.45)
    g.fillStyle = INK
    g.beginPath()
    g.ellipse(c.x, c.y + bob, 5 * squash + 1, 6, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = RAMPS.cream[3]
    g.beginPath()
    g.ellipse(c.x, c.y + bob, 4 * squash + 0.5, 5, 0, 0, Math.PI * 2)
    g.fill()
  }
}

// --- the special nights ----------------------------------------------------------------------------------

export function renderEscort(
  g: CanvasRenderingContext2D,
  e: Escort,
  tick: number,
) {
  if (e.health <= 0) return
  const lit = !(e.flicker > 0 && Math.floor(e.flicker / 4) % 2 === 0)
  glow(g, e.x, e.y, 46, RAMPS.leaf[3], lit ? 0.45 : 0.15)
  const rand = backdropRng(113)
  for (let i = 0; i < 8 + e.health * 4; i++) {
    const a = rand() * Math.PI * 2 + tick / (30 + i)
    const r = 6 + rand() * 18
    const x = e.x + Math.cos(a) * r
    const y = e.y + Math.sin(a * 1.3) * r * 0.7
    g.fillStyle = (i + Math.floor(tick / 8)) % 3 ? RAMPS.gold[4] : RAMPS.leaf[3]
    g.fillRect(Math.round(x), Math.round(y), 2, 2)
  }
  if (e.arrived)
    drawText(g, 'ACROSS!', e.x, e.y - 30, {
      align: 'center',
      color: RAMPS.gold[4],
      outline: INK,
    })
}

export function renderStalls(
  g: CanvasRenderingContext2D,
  stalls: readonly Stall[],
  lit: number,
  tick: number,
) {
  stalls.forEach((s, i) => {
    const on = i === lit
    const x = Math.round(s.x)
    const y = MARKET.y
    if (on) glow(g, x, y, 40, RAMPS.gold[3], 0.45 + 0.1 * Math.sin(tick / 6))
    g.fillStyle = INK
    g.fillRect(x - 14, y - 6, 28, 14)
    g.fillStyle = RAMPS.earth[2]
    g.fillRect(x - 13, y - 5, 26, 12)
    // A striped awning.
    for (let k = 0; k < 7; k++) {
      g.fillStyle = INK
      g.fillRect(x - 16 + k * 4, y - 12, 4, 7)
      g.fillStyle =
        k % 2
          ? on
            ? RAMPS.gold[3]
            : RAMPS.night[3]
          : on
            ? RAMPS.ember[2]
            : RAMPS.night[2]
      g.fillRect(x - 15 + k * 4, y - 11, 3, 5)
    }
    if (on) {
      g.fillStyle = RAMPS.gold[4]
      g.fillRect(x - 8, y - 2, 4, 3)
      g.fillRect(x + 4, y - 2, 4, 3)
    }
    if (s.flicker > 0)
      drawText(g, 'BZZ', x, y - 24, {
        align: 'center',
        color: RAMPS.ember[3],
        outline: INK,
      })
  })
}

export function renderShelter(
  g: CanvasRenderingContext2D,
  s: Shelter,
  tick: number,
) {
  const x = Math.round(s.x)
  const y = Math.round(s.y)
  const lit = !(s.flicker > 0 && Math.floor(s.flicker / 4) % 2 === 0)
  if (lit) glow(g, x, y, 34, RAMPS.gold[3], 0.4)
  g.fillStyle = INK
  g.fillRect(x - 15, y - 2, 30, 14)
  g.fillStyle = RAMPS.earth[2]
  g.fillRect(x - 14, y - 1, 28, 12)
  g.beginPath()
  g.fillStyle = INK
  g.moveTo(x - 19, y)
  g.lineTo(x, y - 14)
  g.lineTo(x + 19, y)
  g.closePath()
  g.fill()
  g.fillStyle = RAMPS.leaf[1]
  g.beginPath()
  g.moveTo(x - 17, y - 1)
  g.lineTo(x, y - 12)
  g.lineTo(x + 17, y - 1)
  g.closePath()
  g.fill()
  g.fillStyle = lit ? RAMPS.gold[3] : RAMPS.night[2]
  g.fillRect(x - 3, y + 2, 6, 6)
  // Two tea pickers peeking out.
  shadedOrb(g, x - 9, y + 4, 2.5, RAMPS.earth, { glint: false })
  shadedOrb(g, x + 9, y + 4, 2.5, RAMPS.earth, { glint: false })
  if (s.flicker > 0)
    drawText(g, 'BZZ', x, y - 26, {
      align: 'center',
      color: RAMPS.ember[3],
      outline: INK,
    })
  void tick
}

/** The bat squadron sweeping across the sky. */
export function renderBats(
  g: CanvasRenderingContext2D,
  bats: readonly Point[],
  tick: number,
) {
  for (const b of bats) {
    const flap = Math.floor(tick / 4) % 2
    const x = Math.round(b.x)
    const y = Math.round(b.y)
    g.fillStyle = INK
    g.fillRect(x - 8, y - (flap ? 3 : 0), 6, 3)
    g.fillRect(x + 2, y - (flap ? 3 : 0), 6, 3)
    g.fillRect(x - 3, y - 2, 6, 5)
    g.fillStyle = RAMPS.purple[1]
    g.fillRect(x - 2, y - 1, 4, 3)
    g.fillStyle = RAMPS.ember[3]
    g.fillRect(x - 1, y - 1, 1, 1)
    g.fillRect(x + 1, y - 1, 1, 1)
  }
}
