// /utils/arcade/sinkSuds/modeArt.ts
//
// Sink Suds' mode menu, medal board and result cards (conductor kr-arcade/t-046).

import { drawText } from '../font'
import { INK, RAMPS, hudPanel, rgba, shadedOrb } from '../snes'
import { W, H } from './basins'
import { MEDAL, SEAT_COLOURS } from './modes'
import type { ModeDef } from './modes'

export type MenuView = {
  modes: readonly ModeDef[]
  mode: number
  row: number
  rows: readonly ('mode' | 'room' | 'basin')[]
  room: string
  basin: number
  best: string | null
  seats: number
  tick: number
}

/** The mode menu over the first basin. */
export function renderMenu(g: CanvasRenderingContext2D, v: MenuView) {
  g.fillStyle = rgba(INK, 0.72)
  g.fillRect(0, 0, W, H)
  hudPanel(g, 34, 26, W - 68, H - 52, RAMPS.teal)
  drawText(g, 'SINK SUDS', W / 2, 38, {
    scale: 3,
    align: 'center',
    color: '#ffffff',
    outline: INK,
    shadow: RAMPS.teal[1],
  })
  drawText(
    g,
    v.seats > 1 ? `${v.seats} BUBBLES SEATED` : 'ONE BRAVE BUBBLE',
    W / 2,
    66,
    {
      align: 'center',
      color: RAMPS.gold[3],
      outline: INK,
    },
  )
  // Bubbles bobbing along the top, one per seat.
  for (let i = 0; i < v.seats; i++) {
    const x = W / 2 - (v.seats - 1) * 14 + i * 28
    shadedOrb(g, x, 88 + Math.sin(v.tick / 12 + i) * 2, 8, RAMPS.water)
    g.strokeStyle = SEAT_COLOURS[i]!
    g.beginPath()
    g.arc(x, 88 + Math.sin(v.tick / 12 + i) * 2, 10, 0, Math.PI * 2)
    g.stroke()
  }
  v.modes.forEach((m, i) => {
    const y = 108 + i * 24
    const on = i === v.mode
    if (on) {
      g.fillStyle = rgba(RAMPS.gold[3], v.rows[v.row] === 'mode' ? 0.3 : 0.15)
      g.fillRect(48, y - 4, W - 96, 18)
      drawText(g, '>', 54, y, { scale: 1, color: RAMPS.gold[4], outline: INK })
    }
    const name = m.id === 'campaign' && v.seats > 1 ? 'BUBBLE BUDDIES' : m.name
    drawText(g, name, 66, y, {
      color: on ? '#ffffff' : RAMPS.teal[4],
      outline: INK,
    })
    if (on)
      drawText(g, m.about[0], W - 54, y, {
        align: 'right',
        color: RAMPS.cream[3],
        outline: INK,
      })
  })
  const mode = v.modes[v.mode]!
  const foot = H - 78
  drawText(g, mode.about[1], W / 2, foot - 14, {
    align: 'center',
    color: RAMPS.cream[3],
    outline: INK,
  })
  if (v.rows.includes('room')) {
    drawText(g, `< ${v.room} >`, W / 2, foot + 4, {
      align: 'center',
      color: RAMPS.gold[4],
      outline: INK,
    })
    drawText(g, v.best ? `BEST ${v.best}` : 'NO TIME YET', W / 2, foot + 18, {
      align: 'center',
      color: RAMPS.leaf[3],
      outline: INK,
    })
  }
  drawText(g, 'A PLAY   B MEDALS', W / 2, H - 40, {
    align: 'center',
    color: RAMPS.teal[4],
    outline: INK,
  })
}

export type BoardRow = { name: string; medals: readonly number[] }

/** The medal board: a row per room, three medals for each of its four basins. */
export function renderBoard(
  g: CanvasRenderingContext2D,
  rows: readonly BoardRow[],
  tick: number,
) {
  g.fillStyle = rgba(INK, 0.8)
  g.fillRect(0, 0, W, H)
  hudPanel(g, 24, 20, W - 48, H - 40, RAMPS.purple)
  drawText(g, 'MEDALS', W / 2, 30, {
    scale: 2,
    align: 'center',
    color: RAMPS.gold[4],
    outline: INK,
  })
  const x0 = 170
  for (let b = 0; b < 4; b++)
    drawText(g, `${b + 1}`, x0 + b * 52 + 14, 58, {
      align: 'center',
      color: RAMPS.cream[3],
      outline: INK,
    })
  rows.forEach((row, i) => {
    const y = 76 + i * 30
    drawText(g, row.name, 36, y, { color: '#ffffff', outline: INK })
    row.medals.forEach((bits, b) => {
      const x = x0 + b * 52
      const kinds: Array<[number, typeof RAMPS.gold]> = [
        [MEDAL.squeaky, RAMPS.gold],
        [MEDAL.noPop, RAMPS.teal],
        [MEDAL.quick, RAMPS.pink],
      ]
      kinds.forEach(([bit, ramp], k) => {
        if (bits & bit) shadedOrb(g, x + k * 12 + 2, y + 3, 4, ramp)
        else {
          g.strokeStyle = rgba(RAMPS.steel[3], 0.6)
          g.beginPath()
          g.arc(x + k * 12 + 2, y + 3, 4, 0, Math.PI * 2)
          g.stroke()
        }
      })
    })
  })
  const legend = 76 + rows.length * 30 + 6
  const items: Array<[string, typeof RAMPS.gold]> = [
    ['SQUEAKY CLEAN', RAMPS.gold],
    ['NO POP', RAMPS.teal],
    ['QUICK RINSE', RAMPS.pink],
  ]
  items.forEach(([name, ramp], i) => {
    const x = 50 + i * 118
    shadedOrb(g, x, legend + 3, 4, ramp)
    drawText(g, name, x + 8, legend, { color: RAMPS.cream[3], outline: INK })
  })
  if (Math.floor(tick / 30) % 2 === 0)
    drawText(g, 'B BACK', W / 2, H - 34, {
      align: 'center',
      color: RAMPS.teal[4],
      outline: INK,
    })
}

/** A result card: a title, lines, and a press-on prompt once it can be skipped. */
export function renderResult(
  g: CanvasRenderingContext2D,
  title: string,
  lines: readonly { text: string; colour?: string }[],
  skip: boolean,
) {
  g.fillStyle = rgba(INK, 0.7)
  g.fillRect(0, 0, W, H)
  hudPanel(g, 50, 70, W - 100, 60 + lines.length * 18, RAMPS.gold)
  drawText(g, title, W / 2, 84, {
    scale: 2,
    align: 'center',
    color: '#ffffff',
    outline: INK,
  })
  lines.forEach((l, i) => {
    drawText(g, l.text, W / 2, 112 + i * 18, {
      align: 'center',
      color: l.colour ?? RAMPS.cream[4],
      outline: INK,
    })
  })
  if (skip)
    drawText(g, 'A TO FINISH', W / 2, 112 + lines.length * 18 + 4, {
      align: 'center',
      color: RAMPS.teal[4],
      outline: INK,
    })
}
