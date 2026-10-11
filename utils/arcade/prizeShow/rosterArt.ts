// /utils/arcade/prizeShow/rosterArt.ts
//
// Pixel art for Prize Show Panic's new crashers (conductor kr-arcade t-027), as rows of palette
// letters the game tints with each crasher's party colour (games/prizeShowPanic.ts crasherPalette):
// e a b c d run the party ramp shadow to highlight, 0-4 the steel ramp, k is ink, w white, W cream,
// y Y gold, r ember, R pink. ROSTER_EXTRAS adds the fixed colours (meat, sky glass, leaf, cream).
// Two frames each, drawn facing right; the game flips them to face their heading.

import { INK, RAMPS } from '../snes'
import type { CrasherKind } from './roster'

/** Fixed colours some crashers wear whatever their party colour. */
export const ROSTER_EXTRAS: Record<string, string> = {
  m: RAMPS.earth[1],
  M: RAMPS.earth[2],
  n: RAMPS.earth[3],
  N: RAMPS.earth[4],
  s: RAMPS.sky[2],
  S: RAMPS.sky[3],
  t: RAMPS.sky[1],
  T: RAMPS.sky[4],
  f: RAMPS.cream[2],
  F: RAMPS.cream[3],
  h: RAMPS.gold[4],
  u: RAMPS.ember[3],
  U: RAMPS.ember[1],
  v: RAMPS.purple[2],
  V: RAMPS.purple[3],
  K: INK,
}

/** The ramp step (0..4) a surface facing (nx, ny) catches, lit from the upper left. */
function litStep(nx: number, ny: number): number {
  const light = -(nx * 0.6 + ny * 0.8)
  return Math.max(0, Math.min(4, Math.round(2 + light * 1.6)))
}

/** A blank grid `w` wide and `h` tall. */
function blank(w: number, h: number): string[][] {
  return Array.from({ length: h }, () => new Array<string>(w).fill('.'))
}

/** Paint a lit oval of ramp letters (shadow to highlight) centred on (cx, cy). */
function oval(
  grid: string[][],
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  letters: string,
  ragged = 0,
) {
  for (let y = 0; y < grid.length; y++)
    for (let x = 0; x < grid[0]!.length; x++) {
      const nx = (x + 0.5 - cx) / rx
      const ny = (y + 0.5 - cy) / ry
      const edge = 1 + (ragged ? ((x * 7 + y * 13) % 3) * ragged : 0)
      if (nx * nx + ny * ny > edge) continue
      grid[y]![x] = letters[litStep(nx, ny)]!
    }
}

function put(grid: string[][], x: number, y: number, rows: readonly string[]) {
  rows.forEach((row, dy) => {
    for (let dx = 0; dx < row.length; dx++) {
      const ch = row[dx]!
      const line = grid[y + dy]
      if (ch !== '.' && line && x + dx >= 0 && x + dx < line.length)
        line[x + dx] = ch
    }
  })
}

function rows(grid: string[][]): string[] {
  return grid.map((line) => line.join(''))
}

/** Rows padded to one width, so hand-drawn art can't come out ragged. */
function even(art: readonly string[]): string[] {
  const w = Math.max(...art.map((r) => r.length))
  return art.map((r) => r.padEnd(w, '.'))
}

// A balloon bot: a party-coloured balloon with a grumpy face, its knot, a string and a little basket.
function popper(frame: number): string[] {
  const g = blank(13, 20)
  oval(g, 6.5, 6.5, 6, 6.5, 'eabcd')
  put(g, 3, 4, ['kk..kk', 'wk..wk'])
  put(g, 4, 8, ['kkkk'])
  put(g, 3, 2, ['w'])
  put(g, 5, 13, ['aea'])
  put(g, frame ? 7 : 5, 14, ['1'])
  put(g, 6, 15, ['1'])
  put(g, frame ? 5 : 7, 16, ['1'])
  put(g, 4, 17, ['32223', '21112'])
  return rows(g)
}

const TANK = [
  '.......4333........',
  '......433332.......',
  '....1222222221.ss..',
  '...1bcddcbbbb1STsS.',
  '..12kw222kw222yyy..',
  '..12kk222kk222yhy..',
  '..1222222222222yYy.',
  '..1111111111111yyy.',
]
const TANK_TREADS = [
  ['.122222222222221...', '1k3k3k3k3k3k3k3k1..', '.11111111111111....'],
  ['.122222222222221...', '13k3k3k3k3k3k3k31..', '.11111111111111....'],
]

const STAGEHAND_HEAD = [
  '....cbbe.....',
  '...cbbbbe....',
  '..433333332..',
  '.4322222221..',
  '.32kk22kk21y.',
  '.32wk22wk21y.',
  '.3222222221Y.',
  '.32222kkk21..',
  '..21111111...',
]
const STAGEHAND_BODY = [
  [
    '..1000000001.',
    '..1000Y00001RR',
    '..1000000001RR',
    '...11...11...',
    '..00.....00..',
  ],
  [
    '..1000000001.',
    '..1000Y00001RR',
    '..1000000001RR',
    '....11.11....',
    '....00.00....',
  ],
]

const DRONE = [
  ['.4333....4333.', '...1......1...'],
  ['..33......33..', '...1......1...'],
]
const DRONE_BODY = [
  '...43333332...',
  '..4322222221..',
  '..32kkkkkk21..',
  '..32kRwuRk21..',
  '..32kkkkkk21..',
  '...21111111...',
  '....1....1....',
]

// The mascot: a big fuzzy costume, round head with ears, a cream belly and stubby feet.
function mascot(frame: number): string[] {
  const g = blank(24, 30)
  oval(g, 5, 3.5, 3, 3, 'eabcd')
  oval(g, 19, 3.5, 3, 3, 'eabcd')
  oval(g, 12, 9, 8.5, 7.5, 'eabcd', 0.05)
  put(g, 7, 7, ['kkk..kkk', 'kwk..kwk', 'kkk..kkk'])
  put(g, 9, 12, ['k....k', '.kkkk.'])
  oval(g, 12, 21, 9.5, 7, 'eabcd', 0.05)
  oval(g, 12, 21.5, 5.5, 4.5, 'fFWWW')
  put(g, 11, 18, ['y', '.', 'y'])
  put(g, frame ? 1 : 2, 17, ['ab', 'ab', 'a.'])
  put(g, frame ? 21 : 20, 17, ['ba', 'ba', '.a'])
  if (frame) {
    put(g, 4, 27, ['aaaa'])
    put(g, 15, 26, ['aaaa', 'eeee'])
  } else {
    put(g, 4, 26, ['aaaa', 'eeee'])
    put(g, 15, 27, ['aaaa'])
  }
  return rows(g)
}

const CHEF_HEAD = [
  '...WWWWW.....',
  '..WWWWWWW....',
  '..WwWWWWW....',
  '...FFFFF.....',
  '..433333332..',
  '.4322222221..',
  '.32kk22kk21..',
  '.32wk22wk21..',
  '.3kkkkkkk21..',
  '..21111111...',
]
const CHEF_BODY = [
  [
    '..WWWWWWWW...',
    '.2WWfWWWW2mMn',
    '..WWWWWWW.FFF',
    '...11...11...',
    '..00.....00..',
  ],
  [
    '..WWWWWWWW.FF',
    '.2WWfWWWWmMnF',
    '..WWWWWWW....',
    '....11.11....',
    '....00.00....',
  ],
]

// The egg-timer bot: a cream egg with a dial on its belly (the game draws the hand and the flash).
function timer(frame: number): string[] {
  const g = blank(13, 18)
  oval(g, 6.5, 8, 6, 7.5, 'fFFWW')
  oval(g, 6.5, 9.5, 3.5, 3.5, 'kkkkk')
  oval(g, 6.5, 9.5, 2.6, 2.6, 'WWWWW')
  put(g, 6, 7, ['r'])
  put(g, 4, 3, ['k..k'])
  put(g, 5, 0, ['yy'])
  put(g, 6, 1, ['Y'])
  put(g, frame ? 3 : 4, 15, ['1...1'])
  put(g, frame ? 2 : 3, 16, ['00..00'])
  return rows(g)
}

// The meatball roller: a lumpy ball of meat with a dab of sauce and furious eyes.
function meatball(frame: number): string[] {
  const g = blank(14, 14)
  oval(g, 7, 7, 6.5, 6.5, 'mmMnN', 0.06)
  const spots = frame
    ? [
        [3, 3],
        [9, 9],
        [10, 4],
      ]
    : [
        [4, 9],
        [9, 3],
        [3, 6],
      ]
  for (const [x, y] of spots) put(g, x!, y!, ['mm'])
  put(g, 6, 1, ['UuuU', '.uU.'])
  put(g, 4, 6, ['kk.kk', 'wk.wk'])
  put(g, 5, 9, ['kkk'])
  return rows(g)
}

const ROADIE_HEAD = [
  '...bbbbbbe...',
  '..cbbbbbbbbb.',
  '..433333332..',
  '.4322222221..',
  '.32kk22kk21..',
  '.32wk22wk21..',
  '.3222222221..',
  '.32222kkk21..',
  '..21111111...',
]
const ROADIE_BODY = [
  [
    '..10000000033',
    '..1000000003.',
    '..10000000033',
    '...11...11...',
    '..00.....00..',
  ],
  [
    '..1000000003.',
    '..10000000033',
    '..1000000003.',
    '....11.11....',
    '....00.00....',
  ],
]

const DIVER_HEAD = [
  '.b.c.b.c.....',
  '..bcbcbcb....',
  '..433333332..',
  '.4322222221..',
  '.3kkkkkkkk1..',
  '.3kkk22kkk1..',
  '.3222222221..',
  '.32222kk221..',
  '..21111111...',
]
const DIVER_BODY = [
  [
    '.3bbbbbbbb3..',
    '..bcddcbbb...',
    '..bbbbbbbb...',
    '...11...11...',
    '..00.....00..',
  ],
  [
    '3.bbbbbbbb.3.',
    '3.bcddcbbb.3.',
    '..bbbbbbbb...',
    '...1.....1...',
    '..0.......0..',
  ],
]

const HECKLER_HEAD = [
  '....cbbe.....',
  '...cbbbbe....',
  '..433333332..',
  '.4322222221..',
  '.3kk22kk221..',
  '.3wk22wk221..',
  '.3222222221..',
  '.32222kkk21..',
  '..21111111...',
]
const HECKLER_BODY = [
  [
    '..ebbbbbbbe..',
    '..cbddbb3yyyy',
    '..ebbbbbbbYhy',
    '..ebbbbbbbe..',
    '...11...11...',
    '..00.....00..',
  ],
  [
    '..ebbbbbbbe3y',
    '..cbddbb.3yhy',
    '..ebbbbbbbyyy',
    '..ebbbbbbbe..',
    '...11...11...',
    '..00.....00..',
  ],
]

const SAUCER = [
  [
    '.....sSTSs......',
    '....sSkkSSs.....',
    '...2sSkRkSs2....',
    '.43333333333332.',
    '4222222222222221',
    '.2yy2yy2yy2yy21.',
    '..111111111111..',
  ],
  [
    '.....sSTSs......',
    '....sSkkSSs.....',
    '...2sSkRkSs2....',
    '.43333333333332.',
    '4222222222222221',
    '.2rr2rr2rr2rr21.',
    '..111111111111..',
  ],
]

// A fluffball: a ragged pompom in its party colour with two bright eyes.
function fluffball(frame: number): string[] {
  const g = blank(12, 12)
  oval(g, 6, 6, 5.2 + frame * 0.4, 5 - frame * 0.3, 'eabcd', 0.12)
  put(g, 3, 4, ['wk.wk', 'kk.kk'])
  put(g, 5, 8, ['ab'])
  return rows(g)
}

/** Two frames of rows for each new crasher that has its own art (the crane uses the camera's). */
export const ROSTER_ROWS: Partial<Record<CrasherKind, readonly string[][]>> = {
  popper: [popper(0), popper(1)],
  tank: TANK_TREADS.map((t) => even([...TANK, ...t])),
  stagehand: STAGEHAND_BODY.map((b) => even([...STAGEHAND_HEAD, ...b])),
  drone: DRONE.map((r) => even([...r, ...DRONE_BODY])),
  mascot: [mascot(0), mascot(1)],
  chef: CHEF_BODY.map((b) => even([...CHEF_HEAD, ...b])),
  timer: [timer(0), timer(1)],
  meatball: [meatball(0), meatball(1)],
  roadie: ROADIE_BODY.map((b) => even([...ROADIE_HEAD, ...b])),
  diver: DIVER_BODY.map((b) => even([...DIVER_HEAD, ...b])),
  heckler: HECKLER_BODY.map((b) => even([...HECKLER_HEAD, ...b])),
  saucer: SAUCER.map(even),
  fluffball: [fluffball(0), fluffball(1)],
}

/** A flight case: a ribbed black road case with steel corners (drawn at 22x14). */
export const CASE_ROWS = even([
  '3311111111111111111133',
  '3K00000000000000000K13',
  '1K0444444444444444401.',
  '1K0400000000000000401.',
  '1K0400y0000000y000401.',
  '1K0444444444444444401.',
  '1K0000000000000000001.',
  '1K0444444444444444401.',
  '1K0400000000000000401.',
  '1K0444444444444444401.',
  '3K00000000000000000K13',
  '3311111111111111111133',
])
