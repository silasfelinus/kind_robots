// /utils/arcade/seedLander/screens.ts
//
// Seed Lander's screens (conductor kr-arcade/t-069): the cockpit HUD across the top, the strip
// along the bottom (beds planted, the island minimap, the Feather streak and the tier), the mode
// card, a mission's title card and the tally when a mission is cleared. Each draws from a plain
// view the game hands it.

import { drawText, measureText } from '../font'
import { INK, RAMPS, drawSprite, gauge, glow, hudPanel, rgba } from '../snes'
import { PAD_RAMP, POD_ICON } from './art'
import type { FlightTier, Pod } from './flight'
import { SAFE, streakMultiplier } from './flight'
import { H, HUD_H, W } from './missions'
import type { Cargo } from './tether'
import type { Terrain } from './terrain'

const DANGER = '#ff9a8a'

export type HudView = {
  score: number
  hi: number
  /** Sun left, 0..1 of the mission's tank. */
  sun: number
  wind: number
  vx: number
  vy: number
  tilt: number
  lives: number
  /** The mission's short name (HILL 7, MEADOW 3). */
  label: string
  planted: number
  seeds: number
  streak: number
  tier: FlightTier
  hopsLeft: number
  zoom: number
  map: {
    terrain: Terrain
    pods: readonly Pod[]
    cargo: readonly Cargo[]
    view: { x0: number; y0: number; x1: number; y1: number }
  }
  tick: number
}

/** The cockpit strip across the top and the garden strip along the bottom. */
export function drawHud(g: CanvasRenderingContext2D, v: HudView) {
  hudPanel(g, 0, 0, W, HUD_H - 1)
  for (const x of [77, 149, 213, 261]) {
    g.fillStyle = INK
    g.fillRect(x, 3, 1, HUD_H - 7)
    g.fillStyle = RAMPS.purple[3]
    g.fillRect(x + 1, 3, 1, HUD_H - 7)
  }
  drawText(g, String(v.score).padStart(6, '0'), 5, 6, {
    scale: 2,
    color: RAMPS.gold[3],
    shadow: INK,
  })
  const sunny = v.sun > 0.25
  drawText(g, 'SUN', 82, 4, {
    color: sunny ? RAMPS.gold[3] : RAMPS.rust[3],
    shadow: INK,
  })
  gauge(g, 102, 5, 44, 5, v.sun, sunny ? RAMPS.gold : RAMPS.ember)
  if (!sunny && v.tick % 30 < 15) glow(g, 124, 7, 10, RAMPS.ember[2], 0.45)
  drawText(g, 'WIND', 82, 15, { color: RAMPS.sky[4], shadow: INK })
  const windPx = Math.max(-20, Math.min(20, Math.round(v.wind * 2500)))
  const cx = 126
  if (Math.abs(windPx) >= 2) {
    const x0 = Math.min(cx, cx + windPx)
    const dir = windPx > 0 ? 1 : -1
    const tip = cx + windPx
    g.fillStyle = INK
    g.fillRect(x0 - 1, 16, Math.abs(windPx) + 2, 4)
    g.fillRect(tip - (dir > 0 ? 2 : 1), 14, 4, 8)
    g.fillStyle = RAMPS.sky[3]
    g.fillRect(x0, 17, Math.abs(windPx), 2)
    g.fillStyle = RAMPS.sky[4]
    g.fillRect(x0, 17, Math.abs(windPx), 1)
    g.fillRect(tip - (dir > 0 ? 1 : 0), 15, 2, 6)
  } else {
    g.fillStyle = INK
    g.fillRect(cx - 2, 16, 4, 4)
    g.fillStyle = RAMPS.sky[3]
    g.fillRect(cx - 1, 17, 2, 2)
  }
  const lamp = (x: number, y: number, ok: boolean) => {
    const ramp = ok ? RAMPS.leaf : RAMPS.ember
    glow(g, x, y, 6, ramp[3], ok ? 0.45 : 0.6)
    g.fillStyle = INK
    g.fillRect(x - 2, y - 2, 5, 5)
    g.fillStyle = ramp[1]
    g.fillRect(x - 1, y - 1, 3, 3)
    g.fillStyle = ramp[3]
    g.fillRect(x - 1, y - 1, 2, 2)
    g.fillStyle = ramp[4]
    g.fillRect(x - 1, y - 1, 1, 1)
  }
  const hSafe = Math.abs(v.vx) <= SAFE.vx
  const vSafe = v.vy <= SAFE.vy
  const tSafe = Math.abs(v.tilt) <= SAFE.tilt
  lamp(155, 7, hSafe)
  drawText(g, `ACROSS ${Math.abs(v.vx * 10).toFixed(0)}`, 160, 4, {
    color: hSafe ? RAMPS.leaf[3] : DANGER,
    shadow: INK,
  })
  lamp(155, 18, vSafe)
  drawText(g, `DOWN ${Math.max(0, v.vy * 10).toFixed(0)}`, 160, 15, {
    color: vSafe ? RAMPS.leaf[3] : DANGER,
    shadow: INK,
  })
  lamp(219, 7, tSafe)
  drawText(g, tSafe ? 'LEVEL' : 'TILTED', 224, 4, {
    color: tSafe ? RAMPS.leaf[3] : DANGER,
    shadow: INK,
  })
  for (let i = 0; i < Math.min(v.lives - 1, 4); i++)
    drawSprite(g, POD_ICON, 220 + i * 9, 18)
  drawText(g, `HI ${v.hi}`, W - 5, 4, {
    align: 'right',
    color: RAMPS.pink[3],
    shadow: INK,
  })
  drawText(g, v.label, W - 5, 15, {
    align: 'right',
    color: RAMPS.leaf[3],
    shadow: INK,
  })
  drawStrip(g, v)
}

/** The bottom strip: beds planted, the minimap, the streak and the tier's hops. */
function drawStrip(g: CanvasRenderingContext2D, v: HudView) {
  const top = H - 13
  g.fillStyle = rgba(INK, 0.72)
  g.fillRect(0, top, W, 13)
  g.fillStyle = rgba(RAMPS.purple[3], 0.6)
  g.fillRect(0, top, W, 1)
  drawText(g, `BEDS ${v.planted}/${v.seeds}`, 4, top + 3, {
    color: v.planted >= v.seeds ? RAMPS.leaf[3] : RAMPS.cream[3],
  })
  // The minimap: the island's outline, its beds, the view and the pod.
  const mx = 92
  const mw = 136
  const mh = 9
  const my = top + 2
  const t = v.map.terrain
  g.fillStyle = rgba(RAMPS.night[0], 0.9)
  g.fillRect(mx - 1, my - 1, mw + 2, mh + 2)
  const sy = (y: number) => my + Math.max(0, Math.min(mh - 1, (y / t.h) * mh))
  const sx = (x: number) => mx + (x / t.w) * mw
  g.fillStyle = RAMPS.leaf[2]
  for (let i = 0; i < mw; i++) {
    const y = Math.round(sy(t.groundAt(((i + 0.5) / mw) * t.w)))
    g.fillRect(mx + i, y, 1, my + mh - y)
  }
  if (t.roof) {
    g.fillStyle = RAMPS.earth[2]
    for (let i = 0; i < mw; i++) {
      const y = Math.round(sy(t.roofAt(((i + 0.5) / mw) * t.w)))
      g.fillRect(mx + i, my, 1, Math.max(0, y - my))
    }
  }
  for (const p of t.pads) {
    const colour =
      p.kind === 'sun'
        ? RAMPS.gold[4]
        : p.kind === 'drop'
          ? RAMPS.steel[4]
          : p.planted
            ? RAMPS.leaf[4]
            : (PAD_RAMP[p.mult] ?? RAMPS.teal)[3]
    g.fillStyle = colour
    g.fillRect(
      Math.round(sx((p.x0 + p.x1) / 2)) - 1,
      Math.round(sy(p.y)) - 1,
      3,
      2,
    )
  }
  for (const c of v.map.cargo) {
    if (c.delivered) continue
    g.fillStyle = RAMPS.rust[3]
    g.fillRect(Math.round(sx(c.x)), Math.round(sy(c.y)) - 1, 2, 2)
  }
  const view = v.map.view
  g.strokeStyle = rgba(RAMPS.sky[4], 0.7)
  g.lineWidth = 1
  g.strokeRect(
    Math.round(sx(Math.max(0, view.x0))) + 0.5,
    my - 0.5,
    Math.max(
      2,
      Math.round(((Math.min(t.w, view.x1) - Math.max(0, view.x0)) / t.w) * mw) -
        1,
    ),
    mh + 1,
  )
  if (v.tick % 20 < 14)
    for (const pod of v.map.pods) {
      g.fillStyle = '#ffffff'
      g.fillRect(Math.round(sx(pod.x)) - 1, Math.round(sy(pod.y)) - 1, 2, 2)
    }
  // The streak, then the tier (with Gale's hop left).
  const mult = streakMultiplier(v.streak)
  const streak = v.streak > 0 ? `X${mult.toFixed(1)}` : ''
  if (streak)
    drawText(g, streak, 236, top + 3, {
      color: v.streak >= 5 ? RAMPS.teal[3] : RAMPS.sky[4],
    })
  const tier = v.tier.hops < 9 ? `${v.tier.name} ${v.hopsLeft}` : v.tier.name
  drawText(g, tier, W - 4, top + 3, {
    align: 'right',
    color:
      v.tier.id === 'gale'
        ? RAMPS.rust[3]
        : v.tier.id === 'breezy'
          ? RAMPS.teal[3]
          : RAMPS.cream[3],
  })
}

export type MenuRow = { name: string; about: string; picker?: boolean }

/** The mode card: the modes, and the flight tier to pick with left and right. */
export function drawMenu(
  g: CanvasRenderingContext2D,
  view: {
    title: string
    subtitle: string
    rows: readonly MenuRow[]
    pick: number
    tick: number
  },
) {
  g.fillStyle = rgba(INK, 0.66)
  g.fillRect(0, 0, W, H)
  const rows = view.rows.length
  const height = 86 + rows * 36
  const top = Math.round((H - height) / 2)
  hudPanel(g, 30, top, W - 60, height)
  drawText(g, view.title, W / 2, top + 10, {
    scale: 3,
    align: 'center',
    color: '#ffffff',
    outline: INK,
    shadow: RAMPS.leaf[1],
  })
  drawText(g, view.subtitle, W / 2, top + 38, {
    align: 'center',
    color: RAMPS.leaf[3],
    outline: INK,
  })
  view.rows.forEach((row, i) => {
    const y = top + 56 + i * 36
    const on = i === view.pick
    if (on) hudPanel(g, 46, y - 5, W - 92, 32, RAMPS.leaf)
    const name = row.picker && on ? `< ${row.name} >` : row.name
    drawText(g, name, W / 2, y, {
      scale: 2,
      align: 'center',
      color: on ? '#ffffff' : RAMPS.steel[3],
      outline: INK,
    })
    drawText(g, row.about, W / 2, y + 17, {
      align: 'center',
      color: on ? RAMPS.gold[4] : RAMPS.steel[2],
      outline: INK,
    })
  })
  drawText(g, 'UP/DOWN PICK  LEFT/RIGHT TIER  A GO', W / 2, top + height - 14, {
    align: 'center',
    color: RAMPS.gold[3],
    outline: INK,
  })
}

/** A mission's title card as it opens (fading out as play starts). */
export function drawMissionCard(
  g: CanvasRenderingContext2D,
  view: {
    name: string
    brief: string
    unlocked: readonly string[]
    t: number
    left: number
  },
) {
  const k = Math.min(1, view.t / 15, view.left / 20)
  const lines = view.unlocked.length
  const h = 54 + lines * 12
  const y = 58
  g.fillStyle = rgba(INK, 0.6 * k)
  g.fillRect(0, y, W, h)
  g.fillStyle = rgba(RAMPS.gold[3], 0.8 * k)
  g.fillRect(0, y, W, 1)
  g.fillRect(0, y + h - 1, W, 1)
  if (k < 0.35) return
  drawText(g, view.name, W / 2, y + 8, {
    scale: 3,
    align: 'center',
    color: '#ffffff',
    outline: INK,
    shadow: RAMPS.leaf[1],
  })
  drawText(g, view.brief, W / 2, y + 36, {
    align: 'center',
    color: RAMPS.gold[4],
    outline: INK,
  })
  view.unlocked.forEach((line, i) => {
    drawText(g, line, W / 2, y + 50 + i * 12, {
      align: 'center',
      color: view.t % 30 < 20 ? RAMPS.pink[3] : RAMPS.pink[4],
      outline: INK,
    })
  })
}

export type TallyLine = { label: string; value: string }

/** The tally when a mission is cleared: sun left, the medals, a spare pod. */
export function drawTally(
  g: CanvasRenderingContext2D,
  view: { title: string; lines: readonly TallyLine[]; t: number },
) {
  const k = Math.min(1, view.t / 15)
  const h = 44 + view.lines.length * 13
  const y = 56
  const w = Math.max(200, measureText(view.title, 2) + 24)
  const x = Math.round((W - w) / 2)
  g.fillStyle = rgba(INK, 0.4 * k)
  g.fillRect(0, HUD_H, W, H - HUD_H)
  hudPanel(g, x, y, w, h, RAMPS.leaf)
  drawText(g, view.title, W / 2, y + 10, {
    scale: 2,
    align: 'center',
    color: '#ffffff',
    outline: INK,
  })
  view.lines.forEach((line, i) => {
    if (view.t < 25 + i * 18) return
    const ly = y + 34 + i * 13
    drawText(g, line.label, x + 14, ly, { color: RAMPS.cream[3], outline: INK })
    drawText(g, line.value, x + w - 14, ly, {
      align: 'right',
      color: line.value === '-' ? RAMPS.steel[2] : RAMPS.gold[4],
      outline: INK,
    })
  })
}
