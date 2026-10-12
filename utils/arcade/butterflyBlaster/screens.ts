// /utils/arcade/butterflyBlaster/screens.ts
//
// The season's screens between nights (conductor kr-arcade/t-056): the river map, AMI's Clinic,
// the offer to continue a saved season, a region's title card and a boss's bar.

import { drawText, measureText } from '../font'
import {
  INK,
  RAMPS,
  bandedGradient,
  drawSprite,
  gauge,
  glow,
  hudPanel,
  mix,
  rgba,
  shadedOrb,
} from '../snes'
import { LIFE_SPRITE, renderButterfly, renderFairy, renderMesh } from './art'
import { CLINIC, CLINIC_ROWS, clinicPrice } from './clinic'
import type { ClinicItem } from './clinic'
import { BOSS_NAMES, MOONS, REGIONS } from './season'
import type { RegionDef, Step } from './season'
import { H, W } from './sky'
import type { Point } from './sky'

// --- the river map ----------------------------------------------------------------------------------

export type MapNode = {
  step: number
  at: Point
  kind: 'night' | 'boss'
  region?: RegionDef
  night?: number
}

const ROWS = [118, 196, 274]

/** Where each night and boss of the season sits on the river (a serpentine, a Moon per row). */
export function mapNodes(steps: readonly Step[]): MapNode[] {
  const nodes: MapNode[] = []
  const perMoon = new Map<number, number[]>()
  steps.forEach((s, i) => {
    if (s.kind !== 'night' && s.kind !== 'boss') return
    const moon = s.kind === 'boss' ? s.moon : REGIONS[s.region].moon
    const list = perMoon.get(moon) ?? []
    list.push(i)
    perMoon.set(moon, list)
  })
  for (const [moon, list] of perMoon) {
    const row = ROWS[(moon - 1) % ROWS.length]!
    list.forEach((step, k) => {
      const t = list.length > 1 ? k / (list.length - 1) : 0.5
      const x = moon % 2 === 1 ? 52 + t * (W - 104) : W - 52 - t * (W - 104)
      const s = steps[step]!
      nodes.push({
        step,
        at: { x, y: row + Math.sin(t * Math.PI * 3) * 8 },
        kind: s.kind === 'boss' ? 'boss' : 'night',
        region: s.kind === 'night' ? REGIONS[s.region] : undefined,
        night: s.kind === 'night' ? s.night : undefined,
      })
    })
  }
  return nodes
}

export type MapView = {
  steps: readonly Step[]
  /** The step about to be played. */
  current: number
  /** Unbitten huts per finished night, by step. */
  record: ReadonlyMap<number, number>
  /** Steps whose special night earned its golden thread. */
  threads: ReadonlySet<number>
  title: string
  sub: string
  score: number
  beads: number
  t: number
}

function paintRiver(g: CanvasRenderingContext2D, nodes: readonly MapNode[]) {
  if (nodes.length < 2) return
  for (const [width, colour] of [
    [16, INK],
    [13, RAMPS.water[1]],
    [7, RAMPS.water[2]],
    [2, rgba(RAMPS.water[4], 0.6)],
  ] as const) {
    g.strokeStyle = colour
    g.lineWidth = width
    g.lineCap = 'round'
    g.lineJoin = 'round'
    g.beginPath()
    g.moveTo(nodes[0]!.at.x - 30, nodes[0]!.at.y)
    for (const n of nodes) g.lineTo(n.at.x, n.at.y)
    const last = nodes.at(-1)!
    g.lineTo(last.at.x + (last.at.x > W / 2 ? 30 : -30), last.at.y + 40)
    g.stroke()
  }
}

function paintHutIcon(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  lit: boolean,
  dim: boolean,
) {
  const wall = dim ? RAMPS.night[2] : RAMPS.earth[2]
  const roof = dim ? RAMPS.night[3] : RAMPS.gold[1]
  g.fillStyle = INK
  g.fillRect(x - 6, y - 4, 12, 9)
  g.fillStyle = wall
  g.fillRect(x - 5, y - 3, 10, 7)
  g.fillStyle = INK
  g.beginPath()
  g.moveTo(x - 8, y - 2)
  g.lineTo(x, y - 11)
  g.lineTo(x + 8, y - 2)
  g.closePath()
  g.fill()
  g.fillStyle = roof
  g.beginPath()
  g.moveTo(x - 6, y - 3)
  g.lineTo(x, y - 9)
  g.lineTo(x + 6, y - 3)
  g.closePath()
  g.fill()
  g.fillStyle = lit ? RAMPS.gold[3] : RAMPS.night[1]
  g.fillRect(x - 1, y - 1, 3, 3)
}

export function renderMap(
  g: CanvasRenderingContext2D,
  view: MapView,
  tick: number,
) {
  bandedGradient(
    g,
    0,
    0,
    W,
    H,
    [
      mix(RAMPS.leaf[0], RAMPS.night[1], 0.5),
      mix(RAMPS.leaf[1], RAMPS.night[1], 0.6),
      mix(RAMPS.leaf[0], RAMPS.night[0], 0.4),
    ],
    8,
  )
  // Grass flecks and a few reeds.
  g.fillStyle = rgba(RAMPS.leaf[3], 0.25)
  for (let i = 0; i < 160; i++) g.fillRect((i * 97) % W, (i * 53) % H, 1, 2)
  const nodes = mapNodes(view.steps)
  paintRiver(g, nodes)
  // Each Moon's name over its stretch of river, and each region's name under its nights.
  for (const m of MOONS) {
    drawText(
      g,
      `MOON ${m.n}: ${m.name}`,
      24,
      ROWS[(m.n - 1) % ROWS.length]! - 48,
      {
        color: RAMPS.sky[4],
        outline: INK,
      },
    )
  }
  const labelled = new Set<string>()
  for (const n of nodes) {
    if (n.kind === 'night' && n.region && !labelled.has(n.region.id)) {
      labelled.add(n.region.id)
      drawText(
        g,
        n.region.name,
        n.at.x + (n.at.x > W / 2 ? -66 : 66),
        n.at.y + 22,
        {
          align: 'center',
          color: RAMPS.cream[3],
          outline: INK,
        },
      )
    }
  }
  for (const n of nodes) {
    const done = view.record.get(n.step)
    const here = n.step === view.current
    const past = n.step < view.current
    if (n.kind === 'boss') {
      // A nest: a dark swirl.
      const spin = tick / 20
      glow(g, n.at.x, n.at.y, 18, past ? RAMPS.gold[3] : RAMPS.ember[2], 0.4)
      shadedOrb(
        g,
        n.at.x,
        n.at.y,
        8,
        past
          ? RAMPS.gold
          : (['#0d1505', '#1a2e05', '#3f6212', '#65a30d', '#a3e635'] as const),
      )
      g.strokeStyle = past ? RAMPS.gold[4] : '#a3e635'
      g.lineWidth = 1
      g.beginPath()
      for (let k = 0; k < 14; k++) {
        const a = spin + k * 0.6
        const r = 2 + k * 0.6
        if (k) g.lineTo(n.at.x + Math.cos(a) * r, n.at.y + Math.sin(a) * r)
        else g.moveTo(n.at.x + Math.cos(a) * r, n.at.y + Math.sin(a) * r)
      }
      g.stroke()
      continue
    }
    paintHutIcon(
      g,
      n.at.x,
      n.at.y,
      past ? (done ?? 0) > 0 : true,
      !past && !here,
    )
    if (past && done !== undefined) {
      // Its health: unbitten huts out of eight, and a festival lantern if none was bitten.
      gauge(g, n.at.x - 8, n.at.y + 8, 16, 3, done / 8, RAMPS.gold)
      if (done === 8) {
        glow(g, n.at.x + 9, n.at.y - 12, 10, RAMPS.gold[3], 0.6)
        g.fillStyle = INK
        g.fillRect(n.at.x + 6, n.at.y - 16, 6, 7)
        g.fillStyle = RAMPS.ember[2]
        g.fillRect(n.at.x + 7, n.at.y - 15, 4, 5)
      }
      if (view.threads.has(n.step)) {
        g.fillStyle = RAMPS.gold[4]
        g.fillRect(n.at.x - 11, n.at.y - 14, 2, 8)
        g.fillRect(n.at.x - 12, n.at.y - 13, 4, 1)
      }
    }
    if (here) {
      const bob = Math.sin(tick / 10) * 2
      glow(g, n.at.x, n.at.y - 22, 20, RAMPS.pink[3], 0.4)
      renderButterfly(g, n.at.x, n.at.y - 24 + bob, 0, tick / 4)
    }
  }
  hudPanel(g, 4, 3, 160, 21)
  drawText(g, 'THE RIVER', 12, 7, {
    scale: 2,
    color: RAMPS.sky[4],
    shadow: INK,
  })
  hudPanel(g, W - 132, 3, 128, 21, RAMPS.gold)
  drawText(g, `BEADS ${view.beads}`, W - 12, 10, {
    align: 'right',
    color: RAMPS.gold[4],
    outline: INK,
  })
  const panelY = H - 52
  hudPanel(g, 24, panelY, W - 48, 44, RAMPS.teal)
  drawText(g, view.title, W / 2, panelY + 7, {
    scale: 2,
    align: 'center',
    color: '#ffffff',
    outline: INK,
  })
  drawText(g, view.sub, W / 2, panelY + 28, {
    align: 'center',
    color: RAMPS.teal[4],
    outline: INK,
  })
  if (view.t > 30 && Math.floor(tick / 20) % 2 === 0) {
    drawText(g, 'A: FLY ON', W - 30, panelY - 12, {
      align: 'right',
      color: RAMPS.cream[3],
      outline: INK,
    })
  }
}

// --- the Clinic ---------------------------------------------------------------------------------------

export type ClinicView = {
  cursor: number
  beads: number
  moon: number
  owned: ReadonlySet<ClinicItem>
  lives: number
  message: string
  t: number
}

export function clinicOwned(item: ClinicItem, owned: ReadonlySet<ClinicItem>) {
  return CLINIC[item].once && owned.has(item)
}

export function renderClinic(
  g: CanvasRenderingContext2D,
  view: ClinicView,
  tick: number,
) {
  // A warm tent: lamplight, canvas walls and bed nets hung to air.
  bandedGradient(
    g,
    0,
    0,
    W,
    H,
    [RAMPS.rust[1], RAMPS.rust[0], mix(RAMPS.rust[0], RAMPS.night[0], 0.5)],
    10,
  )
  g.fillStyle = rgba(RAMPS.cream[2], 0.08)
  for (let x = 0; x < W; x += 24) g.fillRect(x, 0, 2, H)
  glow(g, W / 2, 30, 160, RAMPS.gold[3], 0.35)
  for (const [x, y, r] of [
    [52, 88, 26],
    [428, 88, 26],
    [40, 170, 18],
    [440, 170, 18],
  ] as const) {
    renderMesh(g, x, y, r, Math.sin(tick / 90 + x) * 0.2)
  }
  // AMI herself, drawn large, keeping the clinic.
  g.save()
  g.translate(58, 250 + Math.sin(tick / 12) * 2)
  g.scale(3, 3)
  renderFairy(g, 0, 0, 1, false, tick)
  g.restore()
  drawText(g, "AMI'S CLINIC", W / 2, 10, {
    scale: 3,
    align: 'center',
    color: '#ffffff',
    outline: INK,
    shadow: RAMPS.rust[1],
  })
  drawText(g, 'SPEND THE THANK-YOU BEADS', W / 2, 40, {
    align: 'center',
    color: RAMPS.gold[4],
    outline: INK,
  })
  const x0 = 116
  const y0 = 60
  CLINIC_ROWS.forEach((row, i) => {
    const y = y0 + i * 30
    const on = i === view.cursor
    hudPanel(g, x0, y, 270, 24, on ? RAMPS.gold : RAMPS.purple)
    if (row === 'leave') {
      drawText(g, 'ON DOWN THE RIVER', x0 + 135, y + 8, {
        align: 'center',
        color: '#ffffff',
        outline: INK,
      })
      return
    }
    const item = CLINIC[row]
    const owned = clinicOwned(row, view.owned)
    const price = clinicPrice(row, view.moon)
    drawText(g, item.name, x0 + 10, y + 8, {
      color: owned ? RAMPS.night[4] : '#ffffff',
      outline: INK,
    })
    const tag = owned ? 'GOT IT' : `${price}`
    drawText(g, tag, x0 + 260, y + 8, {
      align: 'right',
      color: owned
        ? RAMPS.leaf[3]
        : price <= view.beads
          ? RAMPS.gold[4]
          : RAMPS.ember[3],
      outline: INK,
    })
  })
  if (Math.floor(tick / 16) % 2 === 0) {
    const y = y0 + view.cursor * 30 + 8
    drawText(g, '>', x0 - 12, y, { color: RAMPS.gold[4], outline: INK })
  }
  const row = CLINIC_ROWS[view.cursor]
  const line =
    view.message ||
    (row && row !== 'leave' ? CLINIC[row].line : 'A: LEAVE THE CLINIC')
  hudPanel(g, 24, H - 40, W - 48, 30, RAMPS.teal)
  drawText(g, line, W / 2, H - 29, {
    align: 'center',
    color: '#ffffff',
    outline: INK,
  })
  hudPanel(g, W - 118, H - 70, 114, 21, RAMPS.gold)
  drawText(g, `BEADS ${view.beads}`, W - 12, H - 63, {
    align: 'right',
    color: RAMPS.gold[4],
    outline: INK,
  })
  hudPanel(g, 4, H - 70, 30 + Math.min(6, view.lives) * 12, 21, RAMPS.pink)
  for (let i = 0; i < Math.min(6, view.lives); i++)
    drawSprite(g, LIFE_SPRITE, 14 + i * 12, H - 59)
}

// --- the offer to continue ----------------------------------------------------------------------------

export type OfferView = {
  where: string
  night: string
  score: number
  lives: number
  beads: number
}

export function renderOffer(
  g: CanvasRenderingContext2D,
  view: OfferView,
  tick: number,
) {
  hudPanel(g, 60, 90, W - 120, 170, RAMPS.purple)
  drawText(g, 'THE SEASON GOES ON', W / 2, 104, {
    scale: 2,
    align: 'center',
    color: '#ffffff',
    outline: INK,
  })
  drawText(g, view.where, W / 2, 134, {
    scale: 2,
    align: 'center',
    color: RAMPS.gold[4],
    outline: INK,
  })
  drawText(g, view.night, W / 2, 158, {
    align: 'center',
    color: RAMPS.cream[3],
    outline: INK,
  })
  drawText(
    g,
    `SCORE ${view.score}   BEADS ${view.beads}   BUTTERFLIES ${view.lives}`,
    W / 2,
    180,
    {
      align: 'center',
      color: RAMPS.sky[4],
      outline: INK,
    },
  )
  const blink = Math.floor(tick / 20) % 2 === 0
  drawText(g, 'A: CARRY ON', W / 2, 210, {
    scale: 2,
    align: 'center',
    color: blink ? RAMPS.gold[4] : '#ffffff',
    outline: INK,
  })
  drawText(g, 'B: A NEW SEASON', W / 2, 236, {
    align: 'center',
    color: RAMPS.cream[3],
    outline: INK,
  })
}

// --- title cards and the boss bar ----------------------------------------------------------------------

export function renderTitleCard(
  g: CanvasRenderingContext2D,
  region: RegionDef,
  t: number,
  hint: string | null,
) {
  const moon = MOONS.find((m) => m.n === region.moon)
  const k = Math.min(1, t / 20, (150 - t) / 20)
  if (k <= 0) return
  g.save()
  g.globalAlpha = Math.max(0, k)
  const w = Math.max(260, measureText(region.name, 3) + 40)
  const h = hint ? 92 : 74
  hudPanel(g, W / 2 - w / 2, 96, w, h, RAMPS.teal)
  drawText(g, `MOON ${region.moon}: ${moon?.name ?? ''}`, W / 2, 104, {
    align: 'center',
    color: RAMPS.teal[4],
    outline: INK,
  })
  drawText(g, region.name, W / 2, 118, {
    scale: 3,
    align: 'center',
    color: '#ffffff',
    outline: INK,
    shadow: RAMPS.teal[0],
  })
  drawText(g, region.tagline, W / 2, 148, {
    align: 'center',
    color: RAMPS.gold[4],
    outline: INK,
  })
  if (hint)
    drawText(g, hint, W / 2, 166, {
      align: 'center',
      color: RAMPS.pink[3],
      outline: INK,
    })
  g.restore()
}

export function bossTitle(boss: 'hum') {
  return BOSS_NAMES[boss]
}

export function renderBossBar(
  g: CanvasRenderingContext2D,
  name: string,
  health: number,
  hint: string,
) {
  hudPanel(g, 96, 27, W - 192, 30, RAMPS.ember)
  drawText(g, name, 104, 31, { color: '#ffffff', outline: INK })
  gauge(
    g,
    104 + measureText(name, 1) + 8,
    32,
    W - 192 - measureText(name, 1) - 24,
    6,
    health,
    RAMPS.ember,
  )
  drawText(g, hint, W / 2, 44, {
    align: 'center',
    color: RAMPS.gold[4],
    outline: INK,
  })
}
