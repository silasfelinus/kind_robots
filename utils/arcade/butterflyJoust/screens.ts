// /utils/arcade/butterflyJoust/screens.ts
//
// Butterfly Joust's cards (conductor kr-arcade/t-048): the mode card, an arena's title card, the
// Wing Garden between arenas, a champion's health bar and the versus result. Each draws from a
// plain view the game hands it.

import { drawText } from '../font'
import {
  INK,
  RAMPS,
  bandedGradient,
  drawSprite,
  gauge,
  glow,
  hudPanel,
  rgba,
  shadedOrb,
} from '../snes'
import { LIFE_SPRITE, seatFrames, type Frames, type WingSet } from './art'
import { H, W } from './field'
import {
  MEDALS,
  MEDAL_IDS,
  boardRows,
  boardTotal,
  cellMedals,
  drawMedal,
  type MedalBoard,
} from './medals'

export type MenuRow = { name: string; about: string }

/** The mode card: the tourney, the Classic Pond, versus, or a saved run to continue. */
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
  g.fillStyle = rgba(INK, 0.72)
  g.fillRect(0, 0, W, H)
  const rows = view.rows.length
  // A long card packs its rows closer and climbs the screen to fit.
  const step = rows > 4 ? 30 : 38
  const height = 96 + rows * step
  const top = Math.max(8, Math.min(64, Math.floor((H - height) / 2)))
  hudPanel(g, 60, top, W - 120, height)
  drawText(g, view.title, W / 2, top + 14, {
    scale: 3,
    align: 'center',
    color: '#ffffff',
    outline: INK,
    shadow: RAMPS.pink[1],
  })
  drawText(g, view.subtitle, W / 2, top + 44, {
    scale: 2,
    align: 'center',
    color: RAMPS.teal[4],
    outline: INK,
  })
  view.rows.forEach((row, i) => {
    const y = top + 72 + i * step
    const on = i === view.pick
    if (on) hudPanel(g, 72, y - 4, W - 144, step - 2, RAMPS.pink)
    drawText(g, on ? `< ${row.name} >` : row.name, W / 2, y, {
      scale: 2,
      align: 'center',
      color: on ? '#ffffff' : RAMPS.steel[3],
      outline: INK,
    })
    drawText(g, row.about, W / 2, y + (step > 30 ? 17 : 15), {
      align: 'center',
      color: on ? RAMPS.gold[4] : RAMPS.steel[2],
      outline: INK,
    })
  })
  drawText(g, 'UP/DOWN TO PICK, A TO START', W / 2, top + height - 16, {
    align: 'center',
    color: RAMPS.gold[3],
    outline: INK,
  })
}

/** An arena's title card as it opens. */
export function drawArenaCard(
  g: CanvasRenderingContext2D,
  view: { number: number; name: string; intro: string; lap: number; t: number },
) {
  const k = Math.min(1, view.t / 20)
  g.fillStyle = rgba(INK, 0.55 * k)
  g.fillRect(0, 96, W, 120)
  g.fillStyle = rgba(RAMPS.gold[3], 0.8 * k)
  g.fillRect(0, 96, W, 1)
  g.fillRect(0, 215, W, 1)
  drawText(
    g,
    view.lap > 0
      ? `ARENA ${view.number}  -  LAP ${view.lap + 1}`
      : `ARENA ${view.number}`,
    W / 2,
    108,
    { scale: 2, align: 'center', color: RAMPS.gold[4], outline: INK },
  )
  drawText(g, view.name, W / 2, 136, {
    scale: 4,
    align: 'center',
    color: '#ffffff',
    outline: INK,
    shadow: RAMPS.pink[1],
  })
  drawText(g, view.intro, W / 2, 182, {
    scale: 2,
    align: 'center',
    color: RAMPS.teal[4],
    outline: INK,
  })
}

/** A champion's name and health across the top of the arena. */
export function drawChampionBar(
  g: CanvasRenderingContext2D,
  name: string,
  hp: number,
  max: number,
) {
  hudPanel(g, 120, 28, W - 240, 20, RAMPS.ember)
  drawText(g, name, W / 2, 31, {
    align: 'center',
    color: '#ffffff',
    outline: INK,
  })
  gauge(g, 132, 41, W - 264, 3, hp / max, RAMPS.gold)
}

export type GardenRow = {
  name: string
  about: string
  /** What it costs now (null: owned, or not for sale). */
  price: number | null
  /** What the row's button does now. */
  action: string
  affordable: boolean
}

/** The Wing Garden: a flower bower where pollen buys spare butterflies, upgrades and wings. */
export function drawGarden(
  g: CanvasRenderingContext2D,
  view: {
    pollen: number
    lives: number
    rows: readonly GardenRow[]
    pick: number
    wear: WingSet
    next: string
    tick: number
  },
) {
  bandedGradient(
    g,
    0,
    0,
    W,
    H,
    ['#2a1a4a', '#4c2a6e', '#7a3d7e', '#b4588a', '#e88aa0', '#f8c8a8'],
    4,
  )
  // Hanging wisteria and a ring of flowers round the bower.
  for (let i = 0; i < 24; i++) {
    const x = 8 + i * 19
    const len = 20 + ((i * 37) % 26)
    for (let j = 0; j < len; j += 5) {
      g.fillStyle = j % 10 ? RAMPS.purple[3] : RAMPS.purple[2]
      g.fillRect(x + Math.round(Math.sin((j + i) / 4) * 2), j, 4, 4)
    }
  }
  for (let i = 0; i < 18; i++) {
    const x = 12 + i * 25
    const y = H - 18 - ((i * 13) % 10)
    const sway = Math.sin(view.tick / 30 + i) * 2
    g.fillStyle = RAMPS.leaf[2]
    g.fillRect(x, y, 2, H - y)
    shadedOrb(
      g,
      x + 1 + sway,
      y - 3,
      5,
      i % 3 === 0 ? RAMPS.pink : i % 3 === 1 ? RAMPS.gold : RAMPS.sky,
    )
  }
  drawText(g, 'THE WING GARDEN', W / 2, 40, {
    scale: 3,
    align: 'center',
    color: '#ffffff',
    outline: INK,
    shadow: RAMPS.purple[1],
  })
  drawText(g, `NEXT: ${view.next}`, W / 2, 70, {
    align: 'center',
    color: RAMPS.teal[4],
    outline: INK,
  })
  // The pollen purse and the butterflies in hand.
  hudPanel(g, 24, 86, 128, 46, RAMPS.gold)
  glow(g, 42, 109, 12, RAMPS.gold[4], 0.5)
  shadedOrb(g, 42, 109, 6, RAMPS.gold)
  drawText(g, String(view.pollen), 56, 98, {
    scale: 2,
    color: '#ffffff',
    outline: INK,
  })
  drawText(g, 'POLLEN', 56, 118, { color: RAMPS.gold[4], outline: INK })
  hudPanel(g, 24, 140, 128, 26, RAMPS.teal)
  const shown = Math.min(view.lives, 7)
  for (let i = 0; i < shown; i++) drawSprite(g, LIFE_SPRITE, 38 + i * 15, 153)
  // The robot showing off the wings it wears.
  const frames = seatFrames(0, view.wear)
  glow(g, 88, 214, 44, RAMPS.pink[3], 0.35)
  drawSprite(g, frames[Math.floor(view.tick / 10) % 2]!, 88, 212, {
    scale: 2,
  })
  drawText(g, view.wear.toUpperCase(), 88, 250, {
    align: 'center',
    color: RAMPS.pink[4],
    outline: INK,
  })
  // The wares.
  view.rows.forEach((row, i) => {
    const y = 80 + i * 23
    const on = i === view.pick
    hudPanel(g, 168, y, W - 190, 22, on ? RAMPS.pink : RAMPS.purple)
    drawText(g, row.name, 176, y + 3, {
      color: on ? '#ffffff' : row.affordable ? RAMPS.steel[4] : RAMPS.steel[2],
      outline: INK,
    })
    drawText(g, row.about, 176, y + 12, {
      color: on ? RAMPS.gold[4] : RAMPS.steel[3],
      outline: INK,
    })
    const tag = row.price === null ? row.action : `${row.price}`
    drawText(g, tag, W - 30, y + 7, {
      align: 'right',
      color:
        row.price === null
          ? RAMPS.teal[4]
          : row.affordable
            ? RAMPS.gold[4]
            : RAMPS.ember[3],
      outline: INK,
    })
  })
  drawText(g, 'UP/DOWN TO BROWSE, A TO PICK', W / 2, H - 34, {
    align: 'center',
    color: '#ffffff',
    outline: INK,
  })
}

/** The versus result. */
export function drawResult(
  g: CanvasRenderingContext2D,
  lines: readonly string[],
) {
  g.fillStyle = rgba(INK, 0.7)
  g.fillRect(0, 0, W, H)
  hudPanel(g, 70, 96, W - 140, 130, RAMPS.pink)
  drawText(g, 'TIME!', W / 2, 110, {
    scale: 3,
    align: 'center',
    color: '#ffffff',
    outline: INK,
  })
  lines.forEach((line, i) => {
    drawText(g, line, W / 2, 152 + i * 28, {
      scale: 2,
      align: 'center',
      color: i === 0 ? RAMPS.gold[4] : RAMPS.teal[4],
      outline: INK,
    })
  })
}

/** The ending: the moth riders lower their lances and everyone flies together; then the credits. */
export function drawEnding(
  g: CanvasRenderingContext2D,
  view: {
    t: number
    truly: boolean
    score: number
    petals: number
    tick: number
    fliers: readonly Frames[]
    credits: readonly string[]
  },
) {
  bandedGradient(
    g,
    0,
    0,
    W,
    H,
    view.truly
      ? ['#ff8fb4', '#ffb38a', '#ffe08a', '#b8f08a', '#8ad8ff', '#b8a0ff']
      : ['#1a1240', '#3d2470', '#7a2f8f', '#d9466f', '#f59e5b', '#fde68a'],
    6,
  )
  // Everyone flies together: riders and moths in one great loop.
  view.fliers.forEach((frames, i) => {
    const a = view.tick / 90 + (i / view.fliers.length) * Math.PI * 2
    const x = W / 2 + Math.cos(a) * 170
    const y = 150 + Math.sin(a * 2) * 50 + Math.sin(a) * 20
    const facing = -Math.sin(a)
    drawSprite(
      g,
      frames[Math.floor((view.tick + i * 5) / 8) % 2]!,
      Math.round(x) - 16,
      Math.round(y) - 17,
      {
        anchor: 'topleft',
        flipX: facing < 0,
      },
    )
  })
  const fade = Math.min(1, view.t / 40)
  g.fillStyle = rgba(INK, 0.45 * fade)
  g.fillRect(0, 0, W, H)
  if (view.t < 60 * 8) {
    const lines = [
      'THE MOTH RIDERS LOWER THEIR LANCES,',
      'AND THE TOURNEY BECOMES A FESTIVAL',
      'WHERE EVERYONE FLIES TOGETHER.',
    ]
    drawText(
      g,
      view.truly ? 'THE TRUE ENDING' : 'THE TOURNEY IS WON',
      W / 2,
      60,
      {
        scale: 3,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.pink[1],
      },
    )
    lines.forEach((line, i) =>
      drawText(g, line, W / 2, 120 + i * 22, {
        scale: 2,
        align: 'center',
        color: RAMPS.gold[4],
        outline: INK,
      }),
    )
    if (view.truly)
      drawText(g, 'THE RAINBOW LISTS ARE YOURS', W / 2, 200, {
        scale: 2,
        align: 'center',
        color: RAMPS.pink[4],
        outline: INK,
      })
  } else {
    // The credits roll up the screen.
    const scroll = (view.t - 60 * 8) * 0.55
    view.credits.forEach((line, i) => {
      const y = H + i * 20 - scroll
      if (y < 28 || y > H - 30) return
      const head = line === line.toUpperCase() && line.startsWith('-')
      drawText(g, head ? line.slice(1) : line, W / 2, Math.round(y), {
        scale: 2,
        align: 'center',
        color: head ? RAMPS.gold[4] : '#ffffff',
        outline: INK,
      })
    })
  }
  hudPanel(g, 4, 3, 140, 21)
  drawText(g, String(view.score).padStart(7, '0'), 12, 7, {
    scale: 2,
    color: RAMPS.pink[3],
    shadow: INK,
  })
  if (view.t > 60 * 6)
    drawText(g, 'A TO FINISH', W - 10, H - 14, {
      align: 'right',
      color: RAMPS.gold[3],
      outline: INK,
    })
}

/**
 * The medal board: a row per garden, a cell per wave (and the champion's bout), and in each cell
 * the medals it offers, lit when won. Gardens not yet reached keep their names hidden.
 */
export function drawMedalBoard(
  g: CanvasRenderingContext2D,
  view: {
    board: MedalBoard
    /** Whether each of boardRows()' gardens has been reached. */
    open: readonly boolean[]
    endlessBest: number
    tick: number
  },
) {
  g.fillStyle = rgba(INK, 0.82)
  g.fillRect(0, 0, W, H)
  hudPanel(g, 6, 6, W - 12, H - 12)
  drawText(g, 'MEDAL BOARD', W / 2, 14, {
    scale: 2,
    align: 'center',
    color: '#ffffff',
    outline: INK,
    shadow: RAMPS.pink[1],
  })
  const { won, of } = boardTotal(view.board)
  drawText(g, `${won} OF ${of} WON`, W / 2, 33, {
    align: 'center',
    color: RAMPS.teal[4],
    outline: INK,
  })
  // The legend: each medal and what it asks.
  MEDAL_IDS.forEach((id, i) => {
    const x = 26 + i * 140
    drawMedal(g, x, 52, id, true, 4)
    drawText(g, MEDALS[id].title, x + 9, 46, { color: '#ffffff', outline: INK })
    drawText(g, MEDALS[id].blurb, x + 9, 55, {
      color: RAMPS.steel[3],
      outline: INK,
    })
  })
  const cellW = 36
  const left = 138
  boardRows().forEach((row, r) => {
    const y = 72 + r * 32
    const open = view.open[r] ?? false
    drawText(g, open ? row.arena.name : '? ? ?', 12, y + 8, {
      color: open ? RAMPS.gold[4] : RAMPS.steel[2],
      outline: INK,
    })
    row.cells.forEach((cell, c) => {
      const x = left + c * cellW
      const bits = view.board[cell.key] ?? 0
      const ids = cellMedals(cell)
      const full = ids.every((id) => (bits & MEDALS[id].bit) !== 0)
      g.fillStyle = INK
      g.fillRect(x, y, cellW - 4, 28)
      g.fillStyle = full
        ? rgba(RAMPS.gold[2], 0.45)
        : rgba(cell.bout ? RAMPS.ember[1] : RAMPS.purple[1], open ? 0.9 : 0.35)
      g.fillRect(x + 1, y + 1, cellW - 6, 26)
      drawText(
        g,
        cell.bout ? 'BOUT' : String(cell.wave),
        x + (cellW - 4) / 2,
        y + 3,
        {
          align: 'center',
          color: open ? '#ffffff' : RAMPS.steel[2],
          outline: INK,
        },
      )
      const mid = x + (cellW - 4) / 2
      ids.forEach((id, k) => {
        const off = (k - (ids.length - 1) / 2) * 9
        drawMedal(
          g,
          Math.round(mid + off),
          y + 19,
          id,
          (bits & MEDALS[id].bit) !== 0,
        )
      })
    })
  })
  drawText(
    g,
    view.endlessBest
      ? `ENDLESS POND BEST: WAVE ${view.endlessBest}`
      : 'ENDLESS POND: NOT FLOWN YET',
    16,
    H - 22,
    { color: RAMPS.teal[4], outline: INK },
  )
  drawText(g, 'A TO CLOSE', W - 16, H - 22, {
    align: 'right',
    color: Math.floor(view.tick / 30) % 2 ? RAMPS.gold[3] : RAMPS.gold[4],
    outline: INK,
  })
}
