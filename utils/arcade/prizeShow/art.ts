// /utils/arcade/prizeShow/art.ts
//
// Prize Show Panic's set dressing for the season (conductor kr-arcade t-026): the floor mines
// (whoopee cushions and banana peels), the camera-wall turrets and their flashbulbs, the cake's
// candle sparks, golden tickets, the studio audience, and the small icons the season map is drawn
// with. Pixel art on the shared 16-bit kit (utils/arcade/snes.ts): five-step ramps, ink outlines.

import { INK, RAMPS, mix, pixelSprite } from '../snes'
import type { PixelSprite } from '../snes'

/** The ramp step (0..4) a surface facing (nx, ny) catches, lit from the upper left. */
function litStep(nx: number, ny: number, base = 2, spread = 1.6): number {
  const light = -(nx * 0.6 + ny * 0.8)
  return Math.max(0, Math.min(4, Math.round(base + light * spread)))
}

/** A lit oval of ramp letters (`letters` runs shadow to highlight). */
function ovalRows(
  w: number,
  h: number,
  rx: number,
  ry: number,
  letters: string,
): string[] {
  const cx = w / 2
  const cy = h / 2
  return Array.from({ length: h }, (_, y) =>
    Array.from({ length: w }, (_, x) => {
      const nx = (x + 0.5 - cx) / rx
      const ny = (y + 0.5 - cy) / ry
      if (nx * nx + ny * ny > 1) return '.'
      return letters[litStep(nx, ny)]!
    }).join(''),
  )
}

/** Stamp `rows` onto `grid` at (x, y), '.' clear. */
function stamp(grid: string[], x: number, y: number, rows: readonly string[]) {
  rows.forEach((row, dy) => {
    const line = grid[y + dy]
    if (line === undefined) return
    const chars = line.split('')
    for (let dx = 0; dx < row.length; dx++)
      if (row[dx] !== '.' && x + dx >= 0 && x + dx < chars.length)
        chars[x + dx] = row[dx]!
    grid[y + dy] = chars.join('')
  })
}

// --- floor mines ---------------------------------------------------------------------------------

const CUSHION_PALETTE = {
  a: RAMPS.pink[0],
  b: RAMPS.pink[1],
  c: RAMPS.pink[2],
  d: RAMPS.pink[3],
  e: RAMPS.pink[4],
  k: INK,
  n: RAMPS.rust[2],
  N: RAMPS.rust[3],
  W: '#ffffff',
}

/** A whoopee cushion: a pink rubber pillow with a seam and a nozzle; `puff` 0..2 inflates it. */
function cushionRows(puff: number): string[] {
  const w = 15 + puff * 2
  const h = 9 + puff * 2
  const grid = ovalRows(w, h, w / 2 - 0.5, h / 2 - 0.3, 'abcde')
  const seam = Math.floor(h / 2) + 1
  for (let x = 2; x < w - 3; x++) {
    const ch = grid[seam]![x]
    if (ch && ch !== '.') stamp(grid, x, seam, [x % 2 ? 'b' : 'a'])
  }
  stamp(grid, Math.floor(w / 2) - 2, Math.floor(h / 2) - 2, ['W.'])
  return grid
    .map((row) => row + '...')
    .map((row, y) => {
      if (y === seam - 1) return row.slice(0, w - 1) + 'nNn.'
      if (y === seam) return row.slice(0, w - 1) + 'nnN.'
      return row
    })
}

export const CUSHION_SPRITES: readonly PixelSprite[] = [0, 1, 2].map((puff) =>
  pixelSprite(cushionRows(puff), CUSHION_PALETTE),
)

/** A banana peel, stem up, three flaps splayed on the floor. */
export const PEEL_SPRITE = pixelSprite(
  [
    '.....kd......',
    '.....dYd.....',
    '....yYYYd....',
    '...yYWWWYd...',
    '..yYWWWWWYd..',
    '..yYWWWWWYd..',
    '.yYYdWWWdYYd.',
    'yYYd.dWd.dYYd',
    'yYd..yYd...Yd',
    'Yd...yYd....d',
    '.....yd......',
  ],
  {
    y: RAMPS.gold[3],
    Y: RAMPS.gold[2],
    d: RAMPS.gold[1],
    W: RAMPS.cream[3],
    k: RAMPS.earth[1],
  },
)

// --- the camera wall -------------------------------------------------------------------------------

const CAMERA_PALETTE = {
  '0': RAMPS.steel[0],
  '1': RAMPS.steel[1],
  '2': RAMPS.steel[2],
  '3': RAMPS.steel[3],
  '4': RAMPS.steel[4],
  k: INK,
  b: RAMPS.sky[1],
  B: RAMPS.sky[2],
  c: RAMPS.sky[3],
  W: '#ffffff',
  r: RAMPS.ember[2],
  p: RAMPS.pink[2],
}

/** A studio camera looking down from the top wall, its lens barrel toward the floor. */
const CAMERA_DOWN = [
  '..1111111..',
  '.433333332.',
  '.3222222p1.',
  '.32r222221.',
  '.322222221.',
  '.211111110.',
  '...0kkk0...',
  '..kbBBBbk..',
  '..kBcWcBk..',
  '..kbBcBbk..',
  '...kkkkk...',
]

/** The lens glass lit red while the camera charges a flash. */
const CAMERA_HOT_PALETTE = {
  ...CAMERA_PALETTE,
  b: RAMPS.ember[1],
  B: RAMPS.ember[2],
  c: RAMPS.ember[3],
}

function turn(rows: readonly string[]): string[] {
  const w = Math.max(...rows.map((r) => r.length))
  return Array.from({ length: w }, (_, x) =>
    rows.map((r) => r[x] ?? '.').join(''),
  )
}

/** By the wall the camera hangs on: drawn looking into the room (sides flip the turned art). */
export const CAMERA_SPRITES = {
  down: pixelSprite(CAMERA_DOWN, CAMERA_PALETTE),
  downHot: pixelSprite(CAMERA_DOWN, CAMERA_HOT_PALETTE),
  side: pixelSprite(turn(CAMERA_DOWN), CAMERA_PALETTE),
  sideHot: pixelSprite(turn(CAMERA_DOWN), CAMERA_HOT_PALETTE),
}

/** The flashbulb pop a camera fires: a white-hot bulb that pulses, rays out, then rounds. */
export const FLASH_SPRITES = [
  pixelSprite(
    [
      '...y...',
      '...w...',
      '..wWw..',
      'ywWWWwy',
      '..wWw..',
      '...w...',
      '...y...',
    ],
    { w: RAMPS.gold[4], W: '#ffffff', y: RAMPS.gold[3] },
    { outline: RAMPS.gold[1] },
  ),
  pixelSprite(
    ['..y..', '.wWw.', 'yWWWy', '.wWw.', '..y..'],
    { w: RAMPS.gold[4], W: '#ffffff', y: RAMPS.gold[3] },
    { outline: RAMPS.gold[1] },
  ),
]

/** A spark off the cake's candles: a teardrop of flame. */
export const SPARK_SPRITES = [
  pixelSprite(['..y..', '.yWy.', 'yWWWy', 'oyWyo', '.ooo.', '..r..'], {
    y: RAMPS.gold[3],
    W: RAMPS.gold[4],
    o: RAMPS.ember[3],
    r: RAMPS.ember[2],
  }),
  pixelSprite(['.y...', '.yWy.', 'yWWWy', 'oyWyo', '.ooo.', '...r.'], {
    y: RAMPS.gold[3],
    W: RAMPS.gold[4],
    o: RAMPS.ember[3],
    r: RAMPS.ember[2],
  }),
]

// --- golden tickets --------------------------------------------------------------------------------

const TICKET_PALETTE = {
  h: RAMPS.gold[4],
  H: RAMPS.gold[3],
  G: RAMPS.gold[2],
  g: RAMPS.gold[1],
  d: RAMPS.gold[0],
  s: RAMPS.ember[2],
  S: RAMPS.ember[3],
  W: '#ffffff',
}

export const TICKET_SPRITE = pixelSprite(
  [
    '.hhhhhhhhhhhhh.',
    'hHHHHHHHHHHHHHg',
    'HGG.GGGSGGG.GGg',
    '.GG.GGSSSGG.GG.',
    '.GG.GSSWSSG.GG.',
    '.GG.GGSSSGG.GG.',
    'HGG.GGGSGGG.GGg',
    'gggggggggggggg.',
  ],
  TICKET_PALETTE,
)

/** The HUD's and the map's small ticket. */
export const TICKET_ICON = pixelSprite(
  ['hhhhhhh', 'HG.S.Gg', '.GSWSG.', 'HG.S.Gg', 'ggggggg'],
  TICKET_PALETTE,
)
export const TICKET_ICON_EMPTY = pixelSprite(
  ['hhhhhhh', 'HG.S.Gg', '.GSWSG.', 'HG.S.Gg', 'ggggggg'],
  Object.fromEntries(
    Object.keys(TICKET_PALETTE).map((key) => [key, RAMPS.night[3]]),
  ),
  { outline: RAMPS.night[0] },
)

// --- the studio audience -----------------------------------------------------------------------------

/** A fan in the front row: a round head over the wall, arms up on frame 1. */
export function audienceSprites(hex: string): readonly PixelSprite[] {
  const palette = {
    a: mix(hex, INK, 0.5),
    b: hex,
    c: mix(hex, '#ffffff', 0.4),
    s: RAMPS.steel[3],
    S: RAMPS.steel[2],
    k: INK,
  }
  return [
    pixelSprite(
      ['..csc..', '.csSSb.', '.ckSkb.', '.sSSSa.', 'bbbbbbb', 'abbbbba'],
      palette,
    ),
    pixelSprite(
      ['s.csc.s', 's.sSSbs', 'bcskSkb', '.sSSSa.', 'bbbbbbb', 'abbbbba'],
      palette,
    ),
  ]
}

// Prizes: a stack of cash, a chrome toaster and the new car, all shaded and outlined.
export const CASH_SPRITE = pixelSprite(
  [
    '34444444443',
    '42322222321',
    '4222uUv2221',
    '4222Uvv2221',
    '42322222321',
    '31111111110',
  ],
  {
    '0': RAMPS.leaf[0],
    '1': RAMPS.leaf[1],
    '2': RAMPS.leaf[2],
    '3': RAMPS.leaf[3],
    '4': RAMPS.leaf[4],
    u: RAMPS.gold[4],
    U: RAMPS.gold[3],
    v: RAMPS.gold[2],
  },
)
export const TOASTER_SPRITE = pixelSprite(
  [
    '..ttt..ttt..',
    '..tTt..tTt..',
    '.4444444443.',
    '.4333333321.',
    '.4322222221k',
    '.4322222221.',
    '.3222222211.',
    '..00....00..',
  ],
  {
    '0': RAMPS.steel[0],
    '1': RAMPS.steel[1],
    '2': RAMPS.steel[2],
    '3': RAMPS.steel[3],
    '4': RAMPS.steel[4],
    t: RAMPS.earth[3],
    T: RAMPS.cream[3],
    k: INK,
  },
)
export const CAR_SPRITE = pixelSprite(
  [
    '....43333332....',
    '...43sSS3sSS2...',
    '.44333333333332.',
    '4322222222222221',
    '3222222222222221',
    '.21kkk1111kkk11.',
    '...kWk....kWk...',
  ],
  {
    '1': RAMPS.ember[1],
    '2': RAMPS.ember[2],
    '3': RAMPS.ember[3],
    '4': RAMPS.ember[4],
    s: RAMPS.sky[4],
    S: RAMPS.sky[2],
    k: INK,
    W: RAMPS.steel[3],
  },
)
// --- season map icons ------------------------------------------------------------------------------

const ICON_PALETTE = {
  '1': RAMPS.steel[1],
  '2': RAMPS.steel[2],
  '3': RAMPS.steel[3],
  k: INK,
  w: '#ffffff',
  p: RAMPS.pink[2],
  P: RAMPS.pink[3],
  q: RAMPS.pink[1],
  y: RAMPS.gold[3],
  Y: RAMPS.gold[2],
  o: RAMPS.gold[1],
  t: RAMPS.teal[3],
  T: RAMPS.teal[2],
  r: RAMPS.ember[2],
  R: RAMPS.ember[3],
  c: RAMPS.cream[3],
  C: RAMPS.cream[2],
  v: RAMPS.purple[3],
  V: RAMPS.purple[2],
}

/** What a door leads to, as drawn on the map. */
export const MAP_ICONS = {
  swarm: pixelSprite(
    [
      '....w.....',
      '....P.....',
      '...PpP....',
      '..PppqP...',
      '.32222221.',
      '.2kk22kk1.',
      '.2wk22wk1.',
      '.22222221.',
      '.22kkkk21.',
      '..111111..',
    ],
    ICON_PALETTE,
  ),
  trap: pixelSprite(
    [
      '..........',
      '...PPPP...',
      '.PPppppPP.',
      'PppwppppqP',
      'PpppppppqP',
      'qqpppppqqq',
      '.qqqqqqqyY',
      '..........',
    ],
    ICON_PALETTE,
  ),
  vault: pixelSprite(
    [
      '..rr.rr...',
      '.r.rRr.r..',
      '..rrRrr...',
      'ttttRtttt.',
      'tTTTRTTTT.',
      '.TTTRTTT..',
      '.TTTRTTT..',
      '.TTTRTTT..',
      '.TTTTTTT..',
    ],
    ICON_PALETTE,
  ),
  sponsor: pixelSprite(
    [
      '....y....',
      '....y....',
      '...yYy...',
      'yyyyYyyyy',
      '.yYYwYYy.',
      '..yYYYy..',
      '..yYoYy..',
      '.yYo.oYy.',
      '.yo...oy.',
    ],
    ICON_PALETTE,
  ),
  boss: pixelSprite(
    [
      '.y..y..y..',
      '.c..c..c..',
      'PPPPPPPPPP',
      'pqpqpqpqpq',
      'cCkcccCkcc',
      'cCcckkcccC',
      'CCCCCCCCCC',
      'YYYYYYYYYY',
    ],
    ICON_PALETTE,
  ),
  lamp: pixelSprite(
    [
      '.3333.....',
      '322221....',
      '32ww21....',
      '.2111yy...',
      '....yyYy..',
      '....yYYyy.',
      '.....yYYy.',
      '......yyY.',
    ],
    ICON_PALETTE,
  ),
  /** A hot plate: a stove ring glowing red. */
  hotplate: pixelSprite(
    [
      '..rRRRr...',
      '.R2222R...',
      'rR2RR2Rr..',
      'R2R..R2R..',
      'rR2RR2Rr..',
      '.R2222R...',
      '..rRRRr...',
    ],
    ICON_PALETTE,
  ),
  /** A conveyor counter: chevrons rolling along a belt. */
  belt: pixelSprite(
    [
      '1111111111',
      '1yy.yy.yy1',
      '1.yy.yy.y1',
      '1yy.yy.yy1',
      '1111111111',
      '.k......k.',
    ],
    ICON_PALETTE,
  ),
  /** A flour cloud. */
  flour: pixelSprite(
    ['...ww.....', '.wwccw.ww.', 'wcccccwccw', 'cccCcccccc', '.CCcCCCCc.'],
    ICON_PALETTE,
  ),
  /** A speaker stack. */
  speaker: pixelSprite(
    [
      '2222222.',
      '21kkk12.',
      '2k111k2.',
      '21kkk12.',
      '2222222.',
      '21kkk12.',
      '2k111k2.',
      '21kkk12.',
      '2222222.',
    ],
    ICON_PALETTE,
  ),
  /** A mosh pit: arrows chasing round a circle. */
  mosh: pixelSprite(
    [
      '..PPPP....',
      '.P....Pp..',
      'P......P..',
      'P......p..',
      'pP....P...',
      '..pPPP....',
    ],
    ICON_PALETTE,
  ),
  secret: pixelSprite(
    [
      '..vvvv..',
      '.vV..Vv.',
      '.V...Vv.',
      '....vV..',
      '...vV...',
      '...V....',
      '........',
      '...v....',
    ],
    ICON_PALETTE,
  ),
} as const

/** Each room's reward on the map: the prize itself. */
export const REWARD_ICONS = {
  cash: CASH_SPRITE,
  toaster: TOASTER_SPRITE,
  car: CAR_SPRITE,
  ticket: TICKET_SPRITE,
} as const

/** A tick for the map's cleared rooms. */
export const CHECK_SPRITE = pixelSprite(
  ['.....l', '....lL', 'l..lL.', 'LllL..', '.LL...'],
  { l: RAMPS.leaf[4], L: RAMPS.leaf[3] },
)
