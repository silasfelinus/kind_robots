// /utils/arcade/pinball/guide.ts
//
// AMI Village Rescue's table guide (conductor kind-pinball/t-015), the
// FX3-style rules card: a shot map with numbered arrows, then the villages
// (each its own mode), multiball, the rest of the scoring, the Malaria-Free
// wizard mode and the mastery ladder, a few lines each. The cabinet pages
// through it from the attract loop and the pause screen.
//
// The hidden sub-table stays a secret: until the player has found it once
// (their mastery record holds 'secret'), the map shows only a question mark
// where it hides and no page mentions it. Once found, it gets its own page.
// Every line is built from the rules' own constants, so the card can't
// drift from the game.

import type { ArcadeGuidePage } from '../types'
import { drawText } from '../font'
import { masteryLine, masteryProgress } from '../mastery'
import { MASTERY_GOALS } from './rules/mastery'
import { HURRY_SECONDS, keysNeeded, NET_TARGETS } from './rules/subTable'
import {
  EXTRA_BALL_AT,
  FIRST_MULTIBALL_LOCKS,
  JACKPOTS_FOR_SUPER,
  LOCKS_FOR_MULTIBALL,
  MULTIBALL_ADDS,
  RAMPS_TO_RELIGHT,
  SKILL_STEPS,
  BALL_SAVE_STEPS,
  VILLAGES,
  WIZARD_ADDS,
  WIZARD_AT,
  WIZARD_NAME,
} from './rules/village'
import { PHYSICS_HZ } from './clock'
import { AMI_VILLAGE_GREYBOX } from './tables/amiVillage/table'
import type { BoxCollider, TableDef } from './types'

/** The main-table shots, in the order the map numbers them (left to right). */
export const MAP_SHOTS = [
  'left-orbit',
  'left-ramp',
  'upper-feed',
  'lock',
  'spinner',
  'right-ramp',
  'right-orbit',
  'award',
] as const

/** True once the player has found the hidden sub-table in any game. */
export const foundSecret = (earned: ReadonlySet<string>) => earned.has('secret')

const seconds = (steps: number) => Math.round(steps / PHYSICS_HZ)
const MAP_HEIGHT = 330

/** The table guide's pages for a player with these mastery goals earned. */
export function pinballGuide(
  earned: ReadonlySet<string>,
  table: TableDef = AMI_VILLAGE_GREYBOX,
): ArcadeGuidePage[] {
  const found = foundSecret(earned)
  const name = (id: string) =>
    table.shots.find((s) => s.id === id)?.displayName ?? id.toUpperCase()
  const legend: string[] = []
  for (let i = 0; i < MAP_SHOTS.length; i += 2) {
    const pair = MAP_SHOTS.slice(i, i + 2).map((id, j) =>
      `${i + j + 1} ${name(id)}`.padEnd(16, ' '),
    )
    legend.push(pair.join('  ').trimEnd())
  }
  if (!found) legend.push('?  ...')

  const pages: ArcadeGuidePage[] = [
    {
      title: 'SHOT MAP',
      scale: 1,
      lines: legend,
      diagram: {
        height: MAP_HEIGHT,
        draw: (g, x, y, w, h) => drawShotMap(g, table, found, x, y, w, h),
      },
    },
    {
      title: 'VILLAGES',
      scale: 1,
      lines: [
        'SHOOT THE LIT AWARD SAUCER (8)',
        'TO START A VILLAGE. EACH ONE IS',
        'ITS OWN MODE: MAKE ITS SHOTS IN',
        'TIME TO SAVE IT.',
        `${RAMPS_TO_RELIGHT} RAMPS OR ORBITS RELIGHT THE SAUCER.`,
        '',
        ...VILLAGES.map((v) => `${v.name} - ${v.hint}`),
      ],
    },
    {
      title: 'MULTIBALL',
      lines: [
        'KNOCK DOWN THE A-M-I',
        'TARGETS TO LIGHT THE',
        'LOCK (4).',
        '',
        `LOCK ${FIRST_MULTIBALL_LOCKS} BALLS FOR YOUR`,
        'FIRST AMI MULTIBALL,',
        `${LOCKS_FOR_MULTIBALL} AFTER THAT. IT ADDS`,
        `${MULTIBALL_ADDS} BALLS.`,
        '',
        'EVERY RAMP (2, 6) IS A',
        'JACKPOT, EACH WORTH MORE.',
        `${JACKPOTS_FOR_SUPER} JACKPOTS LIGHT THE`,
        'SUPER JACKPOT AT THE LOCK.',
      ],
    },
    {
      title: 'MORE SCORING',
      lines: [
        'SKILL SHOT: THE PLUNGE',
        'LIGHTS AN ARROW. MAKE IT',
        `FIRST, WITHIN ${seconds(SKILL_STEPS)} SECONDS.`,
        '',
        'COMBOS: CHAIN RAMPS AND',
        'ORBITS QUICKLY.',
        '',
        `BALL SAVE: ${seconds(BALL_SAVE_STEPS)} SECONDS`,
        'AFTER EACH PLUNGE.',
        '',
        `EXTRA BALL: VISIT ${EXTRA_BALL_AT}`,
        'VILLAGES, THEN SHOOT THE',
        'UPPER FEED (3).',
        '',
        'BONUS: RAMPS, ORBITS,',
        'LOCKS AND VILLAGES COUNT',
        'AT THE END OF EACH BALL.',
      ],
    },
    {
      title: WIZARD_NAME,
      lines: [
        `VISIT ${WIZARD_AT} VILLAGES AND`,
        'THE AWARD SAUCER (8)',
        `LIGHTS ${WIZARD_NAME},`,
        'THE WIZARD MODE.',
        '',
        `IT ADDS ${WIZARD_ADDS} BALLS. EVERY`,
        'ARROW RESCUES A VILLAGE,',
        'EACH WORTH MORE THAN THE',
        'LAST.',
        '',
        'WHEN IT ENDS, THE MAP',
        'STARTS AGAIN.',
      ],
    },
  ]
  if (found)
    pages.push({
      title: 'SECRET VILLAGE',
      lines: [
        'A SHOT TO THE LOCK (4)',
        'OPENS A DOOR AT THE TOP',
        'OF THE UPPER FEED (3).',
        `NEXT TIME IT TAKES ${keysNeeded(1)},`,
        `THEN ${keysNeeded(9)} LOCKS.`,
        '',
        `NET RUN: ${HURRY_SECONDS} SECONDS.`,
        `HIT THE ${NET_TARGETS.length} NETS, THEN`,
        'SHOOT HOME.',
        '',
        'HOME: THE HURRY-UP, +1X',
        'BONUS, THE SAUCER RELIT.',
        'ALL NETS: +1X MORE, A',
        'VILLAGE SAVED, DOUBLE',
        'JACKPOTS.',
      ],
    })
  const progress = masteryProgress(MASTERY_GOALS, earned)
  pages.push({
    title: 'MASTERY',
    scale: 1,
    lines: [
      `${progress.earned} OF ${progress.total} EARNED. KEPT FOR GOOD.`,
      '',
      ...MASTERY_GOALS.map((goal) =>
        earned.has(goal.id)
          ? `* ${masteryLine(goal, earned)}`
          : masteryLine(goal, earned),
      ),
    ],
  })
  return pages
}

/**
 * The shot map: the main table from above, its walls, posts and ramps, and
 * a numbered arrow from each shot's insert to the shot. Nothing of the
 * hidden room is drawn; until it is found, a question mark marks the spot.
 */
export function drawShotMap(
  g: CanvasRenderingContext2D,
  table: TableDef,
  found: boolean,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const hidden = (id: string) =>
    id.startsWith('sub') || id.startsWith('secret') || id === 'playfield'
  // The main field: every wall that is not the hidden room's or the glass.
  const boxes = table.colliders.filter(
    (c): c is BoxCollider =>
      c.kind === 'box' && !c.quat && !hidden(c.id) && c.id !== 'glass',
  )
  const xs = boxes.flatMap((c) => [c.at[0] - 0.02, c.at[0] + 0.02])
  const zs = boxes.flatMap((c) => [c.at[2] - 0.02, c.at[2] + 0.02])
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)]
  const [z0, z1] = [Math.min(...zs), Math.max(...zs)]
  const k = Math.min(w / (x1 - x0), h / (z1 - z0))
  const ox = x + (w - (x1 - x0) * k) / 2
  const oy = y + (h - (z1 - z0) * k) / 2
  const px = (vx: number) => ox + (vx - x0) * k
  const py = (vz: number) => oy + (vz - z0) * k

  g.save()
  g.fillStyle = 'rgba(15, 10, 40, 0.9)'
  g.fillRect(px(x0), py(z0), (x1 - x0) * k, (z1 - z0) * k)
  // Ramps: their floors, faint.
  g.fillStyle = 'rgba(244, 114, 182, 0.25)'
  for (const c of table.colliders) {
    if (c.kind !== 'mesh' || hidden(c.id) || !c.id.endsWith('-floor')) continue
    for (let i = 0; i < c.indices.length; i += 3) {
      g.beginPath()
      for (let j = 0; j < 3; j++) {
        const v = c.indices[i + j]! * 3
        const [vx, vz] = [c.vertices[v]!, c.vertices[v + 2]!]
        if (j === 0) g.moveTo(px(vx), py(vz))
        else g.lineTo(px(vx), py(vz))
      }
      g.fill()
    }
  }
  // Walls.
  g.fillStyle = '#94a3b8'
  for (const c of boxes) {
    g.save()
    g.translate(px(c.at[0]), py(c.at[2]))
    g.rotate(-(c.yaw ?? 0))
    const [hw, hd] = [
      Math.max(c.half[0] * k, 0.5),
      Math.max(c.half[2] * k, 0.5),
    ]
    g.fillRect(-hw, -hd, hw * 2, hd * 2)
    g.restore()
  }
  // Posts and pop bumpers.
  for (const c of table.colliders) {
    if (c.kind !== 'post' || hidden(c.id)) continue
    g.fillStyle = c.id.startsWith('pop') ? '#facc15' : '#94a3b8'
    g.beginPath()
    g.arc(px(c.at[0]), py(c.at[2]), Math.max(c.radius * k, 1.5), 0, Math.PI * 2)
    g.fill()
  }
  // Flippers.
  g.strokeStyle = '#fde68a'
  g.lineWidth = 3
  g.lineCap = 'round'
  for (const f of table.flippers) {
    if (hidden(f.id)) continue
    g.beginPath()
    g.moveTo(px(f.pivot[0]), py(f.pivot[2]))
    g.lineTo(
      px(f.pivot[0] + Math.cos(f.restAngle) * f.length),
      py(f.pivot[2] - Math.sin(f.restAngle) * f.length),
    )
    g.stroke()
  }
  // The shots: an arrow from each insert toward the shot, numbered.
  MAP_SHOTS.forEach((shot, i) => {
    const insert = table.inserts?.find((n) => n.shot === shot)
    const to = shotPoint(table, shot)
    if (!insert || !to) return
    const color = `#${insert.color.toString(16).padStart(6, '0')}`
    const [ax, ay] = [px(insert.at[0]), py(insert.at[1])]
    const [bx, by] = [px(to[0]), py(to[1])]
    drawArrow(g, ax, ay, bx, by, color)
    label(g, String(i + 1), bx, by - 8, color)
  })
  if (!found) {
    const hole = table.scoops.find((s) => s.id === 'secret-hole')
    if (hole) label(g, '?', px(hole.at[0]), py(hole.at[2]) - 8, '#c4b5fd')
  }
  g.restore()
}

/** Where a shot goes: its first switch on the table. */
function shotPoint(table: TableDef, id: string): [number, number] | null {
  const shot = table.shots.find((s) => s.id === id)
  const first = shot?.sensors[0]
  if (!first) return null
  const at =
    table.sensors.find((s) => s.id === first)?.at ??
    table.scoops.find((s) => s.id === first)?.at ??
    table.spinners.find((s) => s.id === first)?.at
  return at ? [at[0], at[2]] : null
}

function drawArrow(
  g: CanvasRenderingContext2D,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  color: string,
) {
  const angle = Math.atan2(by - ay, bx - ax)
  g.strokeStyle = color
  g.fillStyle = color
  g.lineWidth = 2
  g.beginPath()
  g.moveTo(ax, ay)
  g.lineTo(bx, by)
  g.stroke()
  g.beginPath()
  g.moveTo(bx, by)
  g.lineTo(bx - 7 * Math.cos(angle - 0.4), by - 7 * Math.sin(angle - 0.4))
  g.lineTo(bx - 7 * Math.cos(angle + 0.4), by - 7 * Math.sin(angle + 0.4))
  g.closePath()
  g.fill()
}

/** A number in a dark disc, readable over the walls. */
function label(
  g: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
) {
  g.fillStyle = 'rgba(11, 6, 32, 0.85)'
  g.beginPath()
  g.arc(x, y, 6, 0, Math.PI * 2)
  g.fill()
  drawText(g, text, x + 0.5, y - 3, { align: 'center', color })
}
