// /utils/arcade/lanternSwarm/sky.ts
//
// Lantern Swarm's skies (conductor kr-arcade/t-093, t-094), one per zone, all cosmetic (laid out on
// backdropRng, never the game's rng):
//
// - Rooftop Festival: the night sky, paper lanterns rising through the parallax, rooftops below.
// - Orchard Canopy: a green dusk, fireflies blinking across the screen, treetops along the bottom.
// - River of Lights: a blue night over a river that reflects the swarm along the bottom.
//
// Glow Stages fly under an aurora. Back layers go under the moths; the front layer goes over the
// game's own near stars but under the moths.

import {
  RAMPS,
  backdropRng,
  bandedGradient,
  cachedLayer,
  drawRidge,
  glow,
  mix,
  rgba,
  ridge,
  starField,
} from '../snes'
import { H, W, type Pt, type SkyName } from './zones'

/** Where the river's surface starts (the lantern floats on it). */
export const RIVER_TOP = H - 40

const NIGHT_BANDS = [
  RAMPS.night[0],
  RAMPS.night[0],
  RAMPS.night[1],
  RAMPS.night[2],
  mix(RAMPS.night[2], RAMPS.purple[0], 0.6),
  RAMPS.purple[0],
  mix(RAMPS.purple[0], RAMPS.pink[0], 0.55),
  mix(RAMPS.pink[0], RAMPS.rust[0], 0.4),
]
const ORCHARD_BANDS = [
  RAMPS.night[0],
  RAMPS.night[1],
  mix(RAMPS.night[2], RAMPS.leaf[0], 0.5),
  RAMPS.leaf[0],
  mix(RAMPS.leaf[0], RAMPS.purple[0], 0.4),
  mix(RAMPS.leaf[1], RAMPS.rust[0], 0.5),
]
const RIVER_BANDS = [
  RAMPS.night[0],
  RAMPS.night[1],
  RAMPS.sky[0],
  mix(RAMPS.sky[0], RAMPS.purple[0], 0.5),
  mix(RAMPS.purple[0], RAMPS.water[0], 0.5),
  RAMPS.water[0],
]
const AURORA_BANDS = [
  RAMPS.night[0],
  mix(RAMPS.night[1], RAMPS.teal[0], 0.5),
  RAMPS.teal[0],
  mix(RAMPS.teal[0], RAMPS.purple[0], 0.5),
  RAMPS.purple[0],
  mix(RAMPS.purple[0], RAMPS.pink[0], 0.5),
]
const BANDS: Record<SkyName, string[]> = {
  rooftop: NIGHT_BANDS,
  orchard: ORCHARD_BANDS,
  river: RIVER_BANDS,
}
const HAZE: Record<SkyName, string> = {
  rooftop: RAMPS.rust[2],
  orchard: RAMPS.leaf[2],
  river: RAMPS.water[2],
}

const FAR_STARS = starField(61, 90, W, H)
const MID_STARS = starField(67, 40, W, H)
const FAR_SPEED = 0.08
const MID_SPEED = 0.3
const NEBULA_SPEED = 0.05

/** Nebula wisps: long stepped streaks of coloured haze, laid out once. */
const WISPS = (() => {
  const rand = backdropRng(71)
  const ramps = [RAMPS.purple, RAMPS.pink, RAMPS.teal, RAMPS.sky, RAMPS.purple]
  return ramps.map((ramp, i) => ({
    x: 20 + rand() * (W - 40),
    y: (i / ramps.length) * H + rand() * 30,
    len: 80 + rand() * 90,
    thick: 7 + Math.round(rand() * 7),
    slant: (rand() - 0.5) * 3,
    phase: rand() * Math.PI * 2,
    ramp,
  }))
})()

/** The festival's paper lanterns rising through the sky, far (small, slow) and near. */
const SKY_LANTERNS = (() => {
  const rand = backdropRng(97)
  return Array.from({ length: 18 }, (_, i) => {
    const near = i >= 11
    return {
      x: 8 + rand() * (W - 16),
      y: rand() * (H + 30),
      speed: near ? 0.32 + rand() * 0.12 : 0.1 + rand() * 0.06,
      phase: rand() * Math.PI * 2,
      near,
      ramp: rand() < 0.5 ? RAMPS.rust : RAMPS.ember,
    }
  })
})()

/** The orchard's fireflies, wandering and blinking. */
const FIREFLIES = (() => {
  const rand = backdropRng(131)
  return Array.from({ length: 26 }, (_, i) => ({
    x: rand() * W,
    y: 30 + rand() * (H - 60),
    phase: rand() * Math.PI * 2,
    near: i >= 16,
  }))
})()

/** The rooftops of the festival town along the bottom of the sky. */
const ROOFS = (() => {
  const rand = backdropRng(101)
  const roofs: Array<{
    x: number
    w: number
    h: number
    peak: number
    windows: Pt[]
  }> = []
  let x = -6
  while (x < W + 6) {
    const w = 18 + Math.round(rand() * 18)
    const h = 12 + Math.round(rand() * 22)
    const peak = rand() < 0.55 ? 6 + Math.round(rand() * 6) : 0
    const windows: Pt[] = []
    for (let i = 0; i < 3; i++)
      if (rand() < 0.6)
        windows.push({
          x: x + 3 + Math.round(rand() * (w - 8)),
          y: H - h + 3 + Math.round(rand() * (h - 8)),
        })
    roofs.push({ x, w, h, peak, windows })
    x += w + Math.round(rand() * 3)
  }
  return roofs
})()

const TREES_FAR = ridge(141, W, 22, 4)
const TREES_NEAR = ridge(149, W, 30, 3)
const FRUIT = (() => {
  const rand = backdropRng(151)
  return Array.from({ length: 14 }, () => ({
    x: Math.round(rand() * W),
    y: H - 8 - Math.round(rand() * 26),
  }))
})()

function paintNebula(k: CanvasRenderingContext2D) {
  const rand = backdropRng(73)
  for (const w of WISPS) {
    for (const wrap of [-H, 0, H]) {
      for (let row = -w.thick; row <= w.thick; row += 2) {
        const t = row / w.thick
        const width = w.len * (1 - t * t)
        const cx = w.x + row * w.slant + Math.sin(row * 0.35 + w.phase) * 7
        const y = Math.round(w.y + row + wrap)
        const passes: [string, number, number][] = [
          [w.ramp[1], 0.14, 1],
          [w.ramp[2], 0.1, 0.62],
          [w.ramp[3], 0.08, 0.3],
        ]
        for (const [colour, alpha, k2] of passes) {
          k.fillStyle = rgba(colour, alpha)
          k.fillRect(
            Math.round(cx - (width * k2) / 2),
            y,
            Math.round(width * k2),
            2,
          )
        }
      }
      // A glitter of brighter dust through the haze.
      k.fillStyle = rgba(w.ramp[3], 0.35)
      for (let i = 0; i < 26; i++) {
        const row = (rand() * 2 - 1) * w.thick
        const t = row / w.thick
        const along = (rand() - 0.5) * w.len * (1 - t * t)
        k.fillRect(
          Math.round(w.x + row * w.slant + along),
          Math.round(w.y + row + wrap),
          1,
          1,
        )
      }
    }
  }
}

/** The festival town: dark roofs, a few lit windows and strings of lights between the eaves. */
function paintRooftops(k: CanvasRenderingContext2D) {
  const wall = mix(RAMPS.night[1], RAMPS.purple[0], 0.45)
  const rim = mix(RAMPS.night[3], RAMPS.rust[1], 0.35)
  for (const r of ROOFS) {
    k.fillStyle = wall
    k.fillRect(r.x, H - r.h, r.w, r.h)
    k.fillStyle = rim
    k.fillRect(r.x, H - r.h, r.w, 1)
    for (let i = 0; i < r.peak; i++) {
      const inset = Math.round((i * r.w) / (r.peak * 2.2))
      k.fillStyle = wall
      k.fillRect(r.x + inset, H - r.h - i - 1, r.w - inset * 2, 1)
      k.fillStyle = rim
      k.fillRect(r.x + inset, H - r.h - i - 1, 1, 1)
    }
    for (const w of r.windows) {
      k.fillStyle = RAMPS.gold[2]
      k.fillRect(w.x, w.y, 2, 3)
      k.fillStyle = rgba(RAMPS.gold[3], 0.25)
      k.fillRect(w.x - 1, w.y - 1, 4, 5)
    }
  }
  // Festival lights strung from roof to roof, sagging in between.
  for (let i = 0; i + 1 < ROOFS.length; i++) {
    const a = ROOFS[i]!
    const b = ROOFS[i + 1]!
    const ax = a.x + a.w - 2
    const ay = H - a.h - a.peak + 2
    const bx = b.x + 2
    const by = H - b.h - b.peak + 2
    const span = Math.max(1, bx - ax)
    for (let x = ax; x <= bx + 14; x += 3) {
      const t = Math.min(1, (x - ax) / (span + 14))
      const y = Math.round(ay + (by - ay) * t + Math.sin(t * Math.PI) * 6)
      k.fillStyle = [RAMPS.pink[3], RAMPS.gold[3], RAMPS.teal[3]][
        Math.floor(x / 3) % 3
      ]!
      k.fillRect(x, y, 1, 1)
    }
  }
}

/** Two rows of treetops, the near one darker, with lanterns hung like fruit in the branches. */
function paintTreetops(k: CanvasRenderingContext2D) {
  drawRidge(k, TREES_FAR, {
    base: H - 18,
    bottom: H,
    width: W,
    step: 4,
    fill: mix(RAMPS.leaf[0], RAMPS.night[1], 0.4),
    rim: RAMPS.leaf[1],
  })
  drawRidge(k, TREES_NEAR, {
    base: H - 4,
    bottom: H,
    width: W,
    step: 3,
    fill: mix(RAMPS.leaf[0], RAMPS.night[0], 0.6),
    rim: mix(RAMPS.leaf[1], RAMPS.leaf[0], 0.5),
  })
  for (const f of FRUIT) {
    k.fillStyle = rgba(RAMPS.gold[3], 0.3)
    k.fillRect(f.x - 1, f.y - 1, 4, 4)
    k.fillStyle = RAMPS.rust[3]
    k.fillRect(f.x, f.y, 2, 2)
  }
}

/** The river: banded water with a lit far bank. */
function paintRiver(k: CanvasRenderingContext2D) {
  bandedGradient(
    k,
    0,
    RIVER_TOP,
    W,
    H - RIVER_TOP,
    [RAMPS.water[1], RAMPS.water[0], mix(RAMPS.water[0], RAMPS.night[0], 0.5)],
    2,
  )
  k.fillStyle = RAMPS.water[3]
  k.fillRect(0, RIVER_TOP, W, 1)
  const rand = backdropRng(161)
  for (let i = 0; i < 22; i++) {
    k.fillStyle = [RAMPS.gold[3], RAMPS.pink[3], RAMPS.teal[3]][i % 3]!
    k.fillRect(Math.round(rand() * W), RIVER_TOP - 2, 1, 1)
  }
}

function renderSkyLanterns(
  g: CanvasRenderingContext2D,
  near: boolean,
  tick: number,
) {
  const span = H + 30
  for (const s of SKY_LANTERNS) {
    if (s.near !== near) continue
    const y = Math.round((((s.y - tick * s.speed) % span) + span) % span) - 15
    const x = Math.round(s.x + Math.sin(tick / 60 + s.phase) * 3)
    if (near) {
      glow(g, x, y + 2, 8, s.ramp[3], 0.3)
      g.fillStyle = s.ramp[1]
      g.fillRect(x - 2, y - 1, 5, 1)
      g.fillStyle = s.ramp[3]
      g.fillRect(x - 2, y, 5, 5)
      g.fillStyle = RAMPS.gold[4]
      g.fillRect(x, y + 2, 1, 2)
    } else {
      glow(g, x, y + 1, 4, s.ramp[2], 0.25)
      g.fillStyle = rgba(s.ramp[2], 0.75)
      g.fillRect(x - 1, y, 2, 3)
    }
  }
}

function renderFireflies(
  g: CanvasRenderingContext2D,
  near: boolean,
  tick: number,
) {
  for (const f of FIREFLIES) {
    if (f.near !== near) continue
    const blink = Math.sin(tick / 20 + f.phase * 3)
    if (blink < 0.3) continue
    const x = Math.round(f.x + Math.sin(tick / 80 + f.phase) * 14)
    const y = Math.round(f.y + Math.cos(tick / 60 + f.phase) * 10)
    glow(g, x, y, near ? 9 : 5, RAMPS.leaf[4], 0.35 * blink)
    g.fillStyle = blink > 0.8 ? '#ffffff' : RAMPS.leaf[4]
    g.fillRect(x, y, 1, 1)
  }
}

const scrolling = new Map<string, HTMLCanvasElement | null>()

/**
 * A static layer that scrolls down the screen and wraps: painted once at logical size (it must
 * tile vertically), then copied twice a frame with nearest filtering. Headless it paints direct.
 */
function scrollingLayer(
  g: CanvasRenderingContext2D,
  key: string,
  offset: number,
  paint: (layer: CanvasRenderingContext2D) => void,
) {
  let canvas = scrolling.get(key)
  if (canvas === undefined) {
    canvas = null
    if (typeof document !== 'undefined') {
      const made = document.createElement('canvas')
      made.width = W
      made.height = H
      const lg = made.getContext('2d')
      if (lg) {
        paint(lg)
        canvas = made
      }
    }
    scrolling.set(key, canvas)
  }
  const y = Math.floor(((offset % H) + H) % H)
  g.save()
  if (!canvas) {
    g.beginPath()
    g.rect(0, 0, W, H)
    g.clip()
    g.translate(0, y)
    paint(g)
    g.translate(0, -H)
    paint(g)
  } else {
    g.imageSmoothingEnabled = false
    g.drawImage(canvas, 0, y)
    g.drawImage(canvas, 0, y - H)
  }
  g.restore()
}

/** A little window onto a zone's sky, for its Sky Chart card. */
export function skyPreview(
  g: CanvasRenderingContext2D,
  sky: SkyName,
  x: number,
  y: number,
  w: number,
  h: number,
  tick: number,
) {
  bandedGradient(g, x, y, w, h, BANDS[sky], 3)
  const ground = y + h - 8
  if (sky === 'rooftop') {
    g.fillStyle = mix(RAMPS.night[1], RAMPS.purple[0], 0.45)
    for (let i = 0; i < w; i += 9)
      g.fillRect(x + i, ground - ((i * 7) % 6), 8, 8 + ((i * 7) % 6))
    for (let i = 0; i < 4; i++) {
      const ly = y + h - 14 - ((tick * 0.3 + i * 13) % (h - 14))
      g.fillStyle = RAMPS.rust[3]
      g.fillRect(x + 8 + i * Math.round(w / 4), Math.round(ly), 3, 4)
    }
  } else if (sky === 'orchard') {
    g.fillStyle = mix(RAMPS.leaf[0], RAMPS.night[0], 0.5)
    for (let i = 0; i < w; i += 3)
      g.fillRect(
        x + i,
        ground - Math.round(Math.abs(Math.sin(i / 7)) * 8),
        3,
        16,
      )
    for (let i = 0; i < 6; i++)
      if (Math.sin(tick / 15 + i * 2) > 0.2) {
        g.fillStyle = RAMPS.leaf[4]
        g.fillRect(
          x + 6 + ((i * 37) % (w - 12)),
          y + 8 + ((i * 23) % (h - 24)),
          1,
          1,
        )
      }
  } else {
    g.fillStyle = RAMPS.water[1]
    g.fillRect(x, ground, w, 8)
    g.fillStyle = RAMPS.water[3]
    g.fillRect(x, ground, w, 1)
    for (let i = 0; i < 3; i++) {
      const cx = x + ((i * 31 + tick * 0.3) % w)
      g.fillStyle = RAMPS.gold[4]
      g.fillRect(Math.round(cx), ground - 3, 1, 2)
    }
  }
}

/** The sky behind everything: bands, haze, nebula, far stars, the zone's far lights, mid stars. */
export function renderSkyBack(
  g: CanvasRenderingContext2D,
  sky: SkyName,
  aurora: boolean,
  tick: number,
) {
  cachedLayer(g, `lantern-swarm-sky-${aurora ? 'aurora' : sky}`, W, H, (k) => {
    bandedGradient(k, 0, 0, W, H, aurora ? AURORA_BANDS : BANDS[sky], 4)
    glow(k, W / 2, H + 30, 150, HAZE[sky], 0.22)
    if (!aurora) return
    glow(k, W * 0.3, H * 0.3, 90, RAMPS.teal[2], 0.12)
    glow(k, W * 0.75, H * 0.45, 80, RAMPS.leaf[2], 0.1)
    // Aurora curtains: hanging rays along a wavy hem.
    for (let x = 0; x < W; x += 2) {
      const hem = 70 + Math.sin(x / 23) * 18 + Math.sin(x / 7) * 4
      const tall = 30 + Math.sin(x / 13 + 1) * 14
      const ramp = Math.sin(x / 31) > 0 ? RAMPS.teal : RAMPS.leaf
      k.fillStyle = rgba(ramp[3], 0.07 + 0.05 * Math.sin(x / 3) ** 2)
      k.fillRect(x, Math.round(hem - tall), 2, Math.round(tall))
      k.fillStyle = rgba(ramp[4], 0.16)
      k.fillRect(x, Math.round(hem) - 2, 2, 2)
    }
  })
  scrollingLayer(g, 'lantern-swarm-nebula', tick * NEBULA_SPEED, paintNebula)
  g.fillStyle = RAMPS.night[4]
  for (const s of FAR_STARS) {
    const y = Math.floor((s.y + tick * FAR_SPEED) % H)
    g.fillRect(s.x, y, 1, 1)
  }
  if (sky === 'rooftop') renderSkyLanterns(g, false, tick)
  if (sky === 'orchard') renderFireflies(g, false, tick)
  for (const s of MID_STARS) {
    const y = Math.floor((s.y + tick * MID_SPEED) % H)
    const twinkle = Math.sin(tick / 24 + s.phase)
    g.fillStyle =
      twinkle > 0.5
        ? RAMPS.purple[4]
        : twinkle > -0.3
          ? RAMPS.purple[3]
          : RAMPS.purple[2]
    g.fillRect(s.x, y, 1, 1)
    if (s.size === 2 && twinkle > 0.7) {
      g.fillStyle = RAMPS.purple[3]
      g.fillRect(s.x - 1, y, 3, 1)
      g.fillRect(s.x, y - 1, 1, 3)
    }
  }
}

/** The zone's near layer: rising lanterns and rooftops, fireflies and treetops, or the river. */
export function renderSkyFront(
  g: CanvasRenderingContext2D,
  sky: SkyName,
  tick: number,
) {
  if (sky === 'rooftop') {
    renderSkyLanterns(g, true, tick)
    cachedLayer(g, 'lantern-swarm-rooftops', W, H, paintRooftops)
  } else if (sky === 'orchard') {
    renderFireflies(g, true, tick)
    cachedLayer(g, 'lantern-swarm-treetops', W, H, paintTreetops)
  } else {
    cachedLayer(g, 'lantern-swarm-river', W, H, paintRiver)
    // Glints sliding along the current.
    for (let i = 0; i < 12; i++) {
      const x = Math.round((i * 37 + tick * 0.4) % (W + 20)) - 10
      const y = RIVER_TOP + 4 + ((i * 7) % (H - RIVER_TOP - 6))
      g.fillStyle = rgba(RAMPS.water[4], 0.35)
      g.fillRect(x, y, 4 + (i % 3) * 2, 1)
    }
  }
}
