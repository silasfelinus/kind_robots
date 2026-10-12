// /utils/arcade/butterflyBlaster/regionArt.ts
//
// The regions' own skies and props (conductor kr-arcade/t-056): the Rice Terraces' stepped paddies,
// mist and wind flags, the Lantern Walk's villagers, Tip the Pots' water jars, and AMI's kit in
// flight (the repellent ring, the dragonfly wingman, the lantern lure, the kit she drops).

import { drawText } from '../font'
import {
  INK,
  RAMPS,
  backdropRng,
  bandedGradient,
  drawSprite,
  glow,
  mix,
  pixelSprite,
  rgba,
  shadedOrb,
} from '../snes'
import type { Ramp } from '../snes'
import { paintGround, paintHut, paintNight, paintSky } from './art'
import type { KitId } from './kit'
import { KIT, RING } from './kit'
import type { BackdropId } from './season'
import { GROUND, W } from './sky'
import type { Point } from './sky'
import type { Jar, Lantern } from './specials'
import { LANTERN } from './specials'
import { HUT_COUNT, hutX } from './village'

// --- the Rice Terraces --------------------------------------------------------------------------------

const TERRACE_SKY = [
  RAMPS.night[0],
  mix(RAMPS.night[1], RAMPS.teal[0], 0.3),
  mix(RAMPS.night[2], RAMPS.teal[0], 0.45),
  mix(RAMPS.teal[0], RAMPS.night[2], 0.4),
  mix(RAMPS.teal[1], RAMPS.night[2], 0.55),
  mix(RAMPS.leaf[1], RAMPS.night[2], 0.5),
]
const PADDY_MUD = RAMPS.leaf.map((c) =>
  mix(c, RAMPS.night[1], 0.6),
) as unknown as Ramp

/** The terrace steps, left side (the right mirrors it): x where the step ends, and its top. */
export const TERRACE_STEPS = [
  { to: 56, top: GROUND - 56 },
  { to: 100, top: GROUND - 40 },
  { to: 136, top: GROUND - 26 },
] as const

const RICE = (() => {
  const rand = backdropRng(71)
  return Array.from({ length: 90 }, () => ({
    t: rand(),
    h: 2 + Math.floor(rand() * 3),
  }))
})()

function paintStep(
  k: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  top: number,
) {
  k.fillStyle = INK
  k.fillRect(x0, top - 1, x1 - x0, GROUND - top + 1)
  bandedGradient(
    k,
    x0,
    top,
    x1 - x0,
    GROUND - top,
    [PADDY_MUD[2], PADDY_MUD[1], PADDY_MUD[0]],
    3,
  )
  // The paddy on top: a strip of still water catching the moon.
  k.fillStyle = RAMPS.water[1]
  k.fillRect(x0 + 1, top, x1 - x0 - 2, 3)
  k.fillStyle = rgba(RAMPS.water[4], 0.6)
  for (let x = x0 + 4; x < x1 - 4; x += 9) k.fillRect(x, top + 1, 3, 1)
  k.fillStyle = PADDY_MUD[3]
  k.fillRect(x0, top + 3, x1 - x0, 1)
  // Rice tufts.
  k.fillStyle = RAMPS.leaf[2]
  for (const r of RICE) {
    const x = Math.round(x0 + 3 + r.t * (x1 - x0 - 6))
    if ((x * 7) % 5 === 0) k.fillRect(x, top - r.h, 1, r.h)
  }
}

export function paintTerraces(k: CanvasRenderingContext2D) {
  paintSky(k, TERRACE_SKY)
  // Far hills, misted.
  k.fillStyle = mix(RAMPS.night[2], RAMPS.teal[0], 0.5)
  for (let x = 0; x < W; x += 4) {
    const h = 26 + Math.sin(x / 47) * 10 + Math.sin(x / 19) * 4
    k.fillRect(x, GROUND - h, 4, h)
  }
  k.save()
  k.globalAlpha = 0.18
  bandedGradient(
    k,
    0,
    GROUND - 50,
    W,
    50,
    [RAMPS.teal[3], RAMPS.teal[2], RAMPS.teal[1]],
    4,
  )
  k.restore()
  let x0 = 0
  for (const step of TERRACE_STEPS) {
    paintStep(k, x0, step.to, step.top)
    paintStep(k, W - step.to, W - x0, step.top)
    x0 = step.to - 8
  }
  paintGround(k, PADDY_MUD)
  for (let i = 0; i < HUT_COUNT; i++) paintHut(k, hutX(i))
}

/** Each backdrop, painted once into its cached layer. */
export const BACKDROPS: Record<
  BackdropId,
  (k: CanvasRenderingContext2D) => void
> = {
  savanna: paintNight,
  terraces: paintTerraces,
}

/** Low mist drifting across the terraces. */
export function renderMist(g: CanvasRenderingContext2D, tick: number) {
  g.save()
  for (let i = 0; i < 3; i++) {
    const x = ((tick * (0.15 + i * 0.05) + i * 170) % (W + 200)) - 100
    const y = GROUND - 30 - i * 14
    const grad = g.createRadialGradient(x, y, 4, x, y, 90)
    grad.addColorStop(0, rgba(RAMPS.teal[4], 0.12))
    grad.addColorStop(1, rgba(RAMPS.teal[4], 0))
    g.fillStyle = grad
    g.fillRect(x - 90, y - 30, 180, 60)
  }
  g.restore()
}

/** Wind flags on the top steps: they flap harder on the tell and stream with the gust. */
export function renderFlags(
  g: CanvasRenderingContext2D,
  tick: number,
  wind: { tell: number; gust: number; dir: number },
) {
  for (const x of [22, W - 22]) {
    const top = TERRACE_STEPS[0].top
    g.fillStyle = INK
    g.fillRect(x - 1, top - 30, 3, 30)
    g.fillStyle = RAMPS.cream[2]
    g.fillRect(x, top - 30, 1, 30)
    const strong = wind.tell > 0 || wind.gust > 0
    const dir = wind.gust > 0 || wind.tell > 0 ? wind.dir : 1
    const flap = Math.sin(tick / (strong ? 2 : 7)) * (strong ? 3 : 1.5)
    const len = strong ? 18 : 10
    g.fillStyle = INK
    g.beginPath()
    g.moveTo(x, top - 30)
    g.lineTo(x + dir * len, top - 27 + flap)
    g.lineTo(x, top - 22)
    g.closePath()
    g.fill()
    g.fillStyle =
      wind.tell > 0 && Math.floor(tick / 5) % 2 === 0
        ? RAMPS.gold[3]
        : RAMPS.ember[2]
    g.beginPath()
    g.moveTo(x + dir, top - 29)
    g.lineTo(x + dir * (len - 2), top - 27 + flap)
    g.lineTo(x + dir, top - 23)
    g.closePath()
    g.fill()
  }
  if (wind.tell > 0 && Math.floor(tick / 8) % 2 === 0) {
    drawText(g, wind.dir > 0 ? 'WIND >>' : '<< WIND', W / 2, 48, {
      align: 'center',
      color: RAMPS.teal[4],
      outline: INK,
    })
  }
}

/** Streaks across the sky while a gust blows. */
export function renderGust(
  g: CanvasRenderingContext2D,
  tick: number,
  dir: number,
) {
  const rand = backdropRng(81)
  g.save()
  g.strokeStyle = rgba(RAMPS.teal[4], 0.35)
  g.lineWidth = 1
  for (let i = 0; i < 18; i++) {
    const y = 40 + rand() * (GROUND - 80)
    const speed = 6 + rand() * 5
    const x =
      ((((rand() * W + dir * tick * speed) % (W + 60)) + W + 60) % (W + 60)) -
      30
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(x - dir * 22, y)
    g.stroke()
  }
  g.restore()
}

// --- the Lantern Walk -------------------------------------------------------------------------------

const VILLAGER = [
  pixelSprite(['.hh.', '.ff.', 'cccc', '.cc.', '.cc.', '.l.l'], {
    h: RAMPS.earth[1],
    f: RAMPS.earth[3],
    c: RAMPS.sky[2],
    l: RAMPS.earth[1],
  }),
  pixelSprite(['.hh.', '.ff.', 'cccc', '.cc.', '.cc.', 'l..l'], {
    h: RAMPS.earth[1],
    f: RAMPS.earth[3],
    c: RAMPS.sky[2],
    l: RAMPS.earth[1],
  }),
]

export function renderLantern(
  g: CanvasRenderingContext2D,
  l: Lantern,
  tick: number,
) {
  const x = Math.round(l.x)
  const feet = GROUND
  drawSprite(g, VILLAGER[Math.floor((tick + l.seed * 10) / 12) % 2]!, x, feet, {
    anchor: 'feet',
    flipX: l.dir < 0,
    scale: 2,
  })
  // A pole held out in front, the lantern swinging on it.
  const hx = x + l.dir * 10
  const swing = Math.sin(tick / 14 + l.seed) * 1.5
  g.fillStyle = INK
  g.fillRect(Math.min(x, hx), LANTERN.y - 7, Math.abs(hx - x) + 1, 1)
  const lx = Math.round(hx + swing)
  const ly = LANTERN.y
  const lit =
    !l.bitten && !(l.flicker > 0 && Math.floor(l.flicker / 4) % 2 === 0)
  if (lit)
    glow(g, lx, ly, 20, RAMPS.gold[3], 0.55 + 0.1 * Math.sin(tick / 6 + l.seed))
  g.fillStyle = INK
  g.fillRect(lx - 3, ly - 6, 7, 9)
  g.fillStyle = lit ? RAMPS.gold[3] : RAMPS.night[3]
  g.fillRect(lx - 2, ly - 5, 5, 7)
  g.fillStyle = lit ? RAMPS.gold[4] : RAMPS.night[2]
  g.fillRect(lx - 1, ly - 4, 3, 2)
  g.fillStyle = RAMPS.rust[1]
  g.fillRect(lx - 2, ly - 6, 5, 1)
}

// --- Tip the Pots -----------------------------------------------------------------------------------

export function renderJar(g: CanvasRenderingContext2D, jar: Jar, tick: number) {
  const x = Math.round(jar.x)
  const y = Math.round(jar.y)
  g.save()
  g.translate(x, y)
  if (jar.tipped) {
    g.rotate(Math.min(1, jar.tip / 20) * (x < W / 2 ? -1.4 : 1.4))
  } else if (jar.hits > 0) {
    g.rotate(Math.sin(tick / 3) * 0.15)
  }
  // A round clay pot with a lip and a painted band.
  shadedOrb(g, 0, 0, 7, RAMPS.rust, { glint: false })
  g.fillStyle = INK
  g.fillRect(-5, -9, 10, 4)
  g.fillStyle = RAMPS.rust[3]
  g.fillRect(-4, -8, 8, 2)
  g.fillStyle = RAMPS.cream[3]
  g.fillRect(-6, 0, 12, 1)
  if (!jar.tipped) {
    g.fillStyle = RAMPS.water[3]
    g.fillRect(-3, -8, 6, 1)
  }
  g.restore()
  if (jar.tipped && jar.tip < 50) {
    // The water running out.
    g.fillStyle = rgba(RAMPS.water[3], 1 - jar.tip / 50)
    const dir = x < W / 2 ? -1 : 1
    for (let i = 0; i < 5; i++)
      g.fillRect(
        x + dir * (6 + i * 3),
        y + 2 + Math.round((i * i) / 3) + (jar.tip % 6),
        2,
        2,
      )
  }
  if (!jar.tipped && Math.floor(tick / 30) % 3 === 0) {
    g.fillStyle = RAMPS.gold[4]
    g.fillRect(x - 1, y - 14, 3, 1)
    g.fillRect(x, y - 15, 1, 3)
  }
}

// --- AMI's kit ----------------------------------------------------------------------------------------

const DRAGONFLY = [
  pixelSprite(
    ['..W...W..', '.WWW.WWW.', 'tTTTTTTTTTe', '.WWW.WWW.', '..W...W..'],
    {
      W: 'rgba(209, 255, 245, 0.75)',
      t: RAMPS.teal[1],
      T: RAMPS.teal[3],
      e: RAMPS.gold[3],
    },
  ),
  pixelSprite(
    ['.........', 'WWWW.WWWW', 'tTTTTTTTTTe', 'WWWW.WWWW', '.........'],
    {
      W: 'rgba(209, 255, 245, 0.75)',
      t: RAMPS.teal[1],
      T: RAMPS.teal[3],
      e: RAMPS.gold[3],
    },
  ),
]

export function renderDragonfly(
  g: CanvasRenderingContext2D,
  d: Point & { vx: number },
  tick: number,
) {
  glow(g, d.x, d.y, 14, RAMPS.teal[3], 0.35)
  drawSprite(g, DRAGONFLY[Math.floor(tick / 2) % 2]!, d.x, d.y, {
    flipX: d.vx < 0,
  })
}

export function renderRing(
  g: CanvasRenderingContext2D,
  at: Point,
  angle: number,
  tick: number,
) {
  for (let i = 0; i < RING.orbs; i++) {
    const a = angle + (i * Math.PI * 2) / RING.orbs
    const x = at.x + Math.cos(a) * RING.radius
    const y = at.y + Math.sin(a) * RING.radius
    glow(g, x, y, 12, RAMPS.leaf[3], 0.5)
    shadedOrb(g, x, y, 3.5, RAMPS.leaf, { glint: true })
    g.fillStyle = RAMPS.gold[4]
    if (Math.floor(tick / 4 + i) % 2 === 0)
      g.fillRect(Math.round(x) - 1, Math.round(y) - 6, 2, 2)
  }
}

export function renderLure(
  g: CanvasRenderingContext2D,
  at: Point,
  t: number,
  tick: number,
) {
  const pulse = 0.6 + 0.2 * Math.sin(tick / 5)
  glow(g, at.x, at.y, 40, RAMPS.gold[3], pulse * Math.min(1, t / 60))
  g.fillStyle = INK
  g.fillRect(Math.round(at.x) - 1, Math.round(at.y) - 16, 2, 9)
  g.fillRect(Math.round(at.x) - 5, Math.round(at.y) - 8, 11, 13)
  g.fillStyle = RAMPS.gold[3]
  g.fillRect(Math.round(at.x) - 4, Math.round(at.y) - 7, 9, 11)
  g.fillStyle = RAMPS.gold[4]
  g.fillRect(Math.round(at.x) - 2, Math.round(at.y) - 5, 5, 4)
  g.fillStyle = RAMPS.ember[2]
  g.fillRect(Math.round(at.x) - 5, Math.round(at.y) - 9, 11, 2)
}

/** The kit AMI drops: a bubble with the item's colour and initial, falling to be caught. */
export function renderKitDrop(
  g: CanvasRenderingContext2D,
  at: Point,
  kit: KitId,
  spin: number,
  tick: number,
) {
  const ramp = KIT[kit].ramp
  glow(g, at.x, at.y, 18, ramp[3], 0.4)
  shadedOrb(g, at.x, at.y, 9, ramp, { glint: true })
  const letter = {
    net: 'N',
    ring: 'R',
    fan: 'F',
    wingman: 'D',
    lure: 'L',
    long: 'S',
  }[kit]
  drawText(g, letter, at.x + 1, at.y - 3, {
    align: 'center',
    color: '#ffffff',
    outline: INK,
  })
  const a = tick / 8 + spin
  g.fillStyle = ramp[4]
  g.fillRect(
    Math.round(at.x + Math.cos(a) * 13),
    Math.round(at.y + Math.sin(a) * 13),
    2,
    2,
  )
}
