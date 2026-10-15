// /utils/arcade/cableCrawler/mazesGraphics.ts
//
// Component 5, the Graphics Card (conductor kr-arcade/t-066): picture boards whose sparks are the
// pixels of an image, scanlines that sweep the board and cut off a cable's tail, glitch sprites
// that teleport onto the spark you are heading for, and z-fighter walls that flicker between
// solid and passable. Its boss room is The Glitch's; its Screensaver is Paint. Legend in mazes.ts.
// The five mazes were generated (a braided lattice maze with items on its loops) and checked
// with mazeProblems; `scan` is the ticks per row the scanline sweeps.

import { COLS, ROWS, openBoard, type MazeLayout } from './mazes'
import { PAINT_ART, PAINT_X0, PAINT_Y0 } from './pictures'

export const GRAPHICS_CARD_MAZES: readonly MazeLayout[] = [
  {
    id: 'gc-1',
    name: 'PIXEL PUSHER',
    picture: 'sunrise',
    rows: [
      '#######################',
      '#. . .#. . . . .#. . .#',
      '# # # # ### # # # # # #',
      '#. .#.#  . . $#. .#  .#',
      '# # # ####### # ### # #',
      '#.#.z #.z. . .#. . .#.#',
      '# ##### ####### ### # #',
      '#.#. . .  #. . .#. .#.#',
      '# # ### # # ##### ### #',
      '#.#. S .#.#.#. . .#. .#',
      '# ##### # # # # ### ###',
      '#. .   S#. .# #.#.   .#',
      '####### # # # # # ### #',
      '#. . .#.#.#. . . .#. .#',
      '# # # # # # ### # # # #',
      '#. .#.#. .#. .#  . . .#',
      '# # # # # ### # # ### #',
      '#. . . S . P .#.   . .#',
      '#######################',
    ],
  },
  {
    id: 'gc-2',
    name: 'SCANLINE ALLEY',
    scan: 46,
    picture: 'lake',
    rows: [
      '#######################',
      '#. . .#. .   .#. . . .#',
      '# # # # # # # # ##### #',
      '#$#S#S .# #. .#. . .  #',
      '# # ### # ### # # #z# #',
      '#.#. .#.#. s . .#. . .#',
      '# ### # ### # # ### # #',
      '#. .#.#.#. .#. . . . .#',
      '# # # # # #z# # ##### #',
      '#.#. . .# #  .#. . .#.#',
      '# # # # # ### # ### # #',
      '#.   . .#.#. .#. .#. .#',
      '# ### ### # # # # #####',
      '#. .#.#. .#.#  . . S .#',
      '# # # # # # # ####### #',
      '#. . . . . .#. . . . .#',
      '# ##### # ### # ##### #',
      '#. . .   . P .   . . .#',
      '#######################',
    ],
  },
  {
    id: 'gc-3',
    name: 'FRAME RATE',
    scan: 40,
    picture: 'robot',
    rows: [
      '#######################',
      '#. . . .  #. . $ . . .#',
      '# # # ### # # ##### # #',
      '#. .#. .#. S#. . .#.#.#',
      '# ##### ### # # # # # #',
      '#. .#. s#  .#. . .#S .#',
      '# # # # # # # ### # ###',
      '#.#. b#.#.  #. .#.#. .#',
      '# ### # # ### # # # # #',
      '#. . . .#. S   .#.#.#.#',
      '# ########### # # # # #',
      '#.   . .z. . . .z.#. .#',
      '# ##### # ##### # # # #',
      '#.#  . . . .  #. .#.#.#',
      '# # # # ### # ##### # #',
      '#. . .#. .#.#. . . . .#',
      '# ### ### #z# # ##### #',
      '#.   . . . P#. . .   .#',
      '#######################',
    ],
  },
  {
    id: 'gc-4',
    name: 'TEXTURE MAP',
    scan: 35,
    picture: 'moon',
    rows: [
      '#######################',
      '#.z. .#. . . .#. . .  #',
      '# # # # # # # # # ### #',
      '#.#. . .# #. b . s .# #',
      '# # # ### # # ### # # #',
      '#. . . . .#. . . .#. S#',
      '####### # # ####### ###',
      '#. .#. . . .#. . .#. .#',
      '# # # # ### # ### ### #',
      '#.# #  .#  . .z.#. . .#',
      '# # ### # # ### # # ###',
      '#  . $ .#. . . S . . .#',
      '# ####### ### # ### # #',
      '#.     . . . . .#. s .#',
      '### # # # ### # # # #z#',
      '#S .#. .#. . . S .#. .#',
      '# # # ### # ##### ### #',
      '#. .     .#P . . .   .#',
      '#######################',
    ],
  },
  {
    id: 'gc-5',
    name: 'RENDER FARM',
    scan: 30,
    picture: 'rainbow',
    rows: [
      '#######################',
      '#. .#. . . . . . . . .#',
      '# # #z# # # # # ##### #',
      '#.#. .#. . .#. . . . .#',
      '# ### # ### # ##### # #',
      '#. .  #. $#. . . . b#.#',
      '# # # ### # # # # # # #',
      '#. S#. . .#. .#. . .#S#',
      '### ##### ### # # # # #',
      '#. . . . .   . . . .# #',
      '# ### # # ### # #z### #',
      '#s . . s#.   . .#. .#.#',
      '# # # # ### # ##### # #',
      '#.  #. . . .#.#. .#. .#',
      '# # # # ### # # # # # #',
      '# z #. .     . .#. . S#',
      '# ##### # # # # # # # #',
      '#. . S . . P . .#.   .#',
      '#######################',
    ],
  },
]

/** The Glitch's room: the ring corridor of the fuse box, with z-fighters in the inner walls. */
export const GLITCH_ROOM: MazeLayout = {
  id: 'gc-boss',
  name: 'THE GLITCH',
  mirror: true,
  rows: [
    '############',
    '#. . . . . B',
    '# ###z###z# ',
    '#.#. .#. .#.',
    '# # # # #S# ',
    '#. .#. .#. .',
    '# ### ### ##',
    '#.#o .#. . .',
    '# # # # ### ',
    '#. .#o#. .#.',
    '# ### ### # ',
    '#.#. . .#. .',
    '# # ### # # ',
    '#. .#o .#.#.',
    '# ### ### # ',
    '#.#S . . .#.',
    '# # ##### # ',
    '#. . . . . P',
    '############',
  ],
}

/** Paint: an open board with the heart's pixels set out as sparks, two cells apart. */
function paintBoard(): MazeLayout {
  const base = openBoard('gc-saver', 'PAINT')
  const rows = base.rows.map((r) => [...r])
  PAINT_ART.forEach((line, j) =>
    [...line].forEach((ch, i) => {
      if (ch === ' ') return
      const x = PAINT_X0 + i * 2
      const y = PAINT_Y0 + j * 2
      if (x < COLS - 1 && y < ROWS - 1) rows[y]![x] = '.'
    }),
  )
  return { ...base, rows: rows.map((r) => r.join('')) }
}

export const PAINT = paintBoard()
