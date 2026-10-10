// /utils/arcade/games/kindnessGauntlet.ts
//
// Kindness Gauntlet -- the Kind Robots Arcade's Gauntlet II riff (conductor
// kr-arcade/t-009 game factory: procedurally built floors, all four classes,
// keys with locked doors, and same-device co-op). A repair bot explores a
// glitchy old server dungeon floor by floor: wrench sparks fix the glitches
// that swarm out of broken generators, shut the generators down, free the bots
// trapped in cages, and find the stairs down.
//
// Up to four can play on one device, each picking a different bot. They share
// one screen (nobody can wander off it), one key ring and one score; each has
// a battery of their own. A bot whose battery runs flat stops where it stands
// until its partner rolls up and shares a charge, and a flat bot comes back
// with a little charge on the next floor. The run ends when every bot is flat.
// Bots chase the nearest partner's glitches together; generators wake for any.
//
// Four bots to choose from, after the classic's four heroes: Hugs (power: big
// sparks that hit generators twice and pass through a glitch), Fix (armor:
// clinging glitches drain the least), Sage (magic: three pulses, and each one
// jolts the generators on screen too) and Zip (speed: the fastest wheels and
// quickest sparks).
//
// From floor 2 a locked door cuts the way to the stairs. A key waits on the
// near side; keys carry over between floors, and walking into a door with one
// opens it.
//
// The battery drains all the time and faster when glitches cling on; snacks
// top it up and kindness pulses (B) fix every glitch on screen. The arrows
// move (eight ways), A throws sparks the way the bot is facing; while A is
// held the bot stands still and the arrows only turn, as in the classic.

import { levelCurve } from '../curve'
import { drawText, measureText } from '../font'
import {
  INK,
  RAMPS,
  type PixelSprite,
  type Ramp,
  Sparkles,
  backdropRng,
  bandedGradient,
  bevel,
  cachedLayer,
  dropShadow,
  drawSprite,
  gauge,
  glow,
  hudPanel,
  mix,
  pixelSprite,
  rgba,
  vignette,
} from '../snes'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'

const T = 16
const MW = 40
const MH = 30
const W = 320
const H = 240
const VIEW_Y = 16
const VIEW_H = H - VIEW_Y

const HALF = 5
const SPARK_SPEED = 4
const SPARK_LIFE = 45
const SELECT_TICKS = 60 * 15
const MAX_BATTERY = 300
const DRAIN_TICKS = 45
const CLING_TICKS = 20
const SNACK_CHARGE = 40
const GLITCH_RANGE = T * 14
const EXIT_TICKS = 120

const GLITCH_POINTS = 10
const GENERATOR_POINTS = 100
const RESCUE_POINTS = 250
const DOOR_POINTS = 100
/** walls[] values: open floor, wall, and a locked door (solid until opened). */
const OPEN = 0
const DOOR = 2
const FLOOR_POINTS = 500
/** Bots that can share a floor: one of each class. */
const MAX_PLAYERS = 4
/** Charge a partner hands over to bring a flat bot back. */
const SHARE_CHARGE = 50
/** How far apart any two bots may get: all stay on the one screen. */
const LEASH_X = W - 40
const LEASH_Y = VIEW_H - 40
const SEAT_COLORS = ['#fde047', '#f9a8d4', '#67e8f9', '#bef264']
/** Where each player's select cursor starts: Fix, Zip, Hugs, Sage. */
const START_CHOICE = [1, 3, 0, 2]

export const GAUNTLET_CURVES = {
  generators: { start: 3, step: 0.6, limit: 7 },
  generatorHp: { start: 3, step: 0.34, limit: 6 },
  spawnEvery: { start: 150, step: -12, limit: 50 },
  glitchSpeed: { start: 0.6, step: 0.07, limit: 1.35 },
  /** Battery a clinging glitch drains each bite. */
  clingCost: { start: 3, step: 0.5, limit: 9 },
  glitchCap: { start: 10, step: 2, limit: 26 },
  snacks: { start: 4, step: -0.34, limit: 1 },
  cages: { start: 1, step: 0.5, limit: 3 },
} as const

type BotClass = 'hugs' | 'fix' | 'sage' | 'zip'
type ClassSpec = {
  name: string
  role: string
  about: [string, string]
  speed: number
  cooldown: number
  maxSparks: number
  /** Generator damage per spark; above 1 a spark also passes through one glitch. */
  power: number
  /** Multiplies the battery a clinging glitch drains. */
  armor: number
  pulses: number
  /** Generator damage each pulse deals to every generator on screen. */
  magic: number
  body: string
  head: string
}
export const BOT_CLASSES: Record<BotClass, ClassSpec> = {
  hugs: {
    name: 'HUGS',
    role: 'POWER',
    about: ['BIG SPARKS HIT GENERATORS TWICE', 'AND PASS THROUGH A GLITCH'],
    speed: 1.2,
    cooldown: 14,
    maxSparks: 3,
    power: 2,
    armor: 1.1,
    pulses: 1,
    magic: 0,
    body: '#ea580c',
    head: '#fdba74',
  },
  fix: {
    name: 'FIX',
    role: 'ARMOR',
    about: ['A STURDY SHELL', 'CLINGING GLITCHES DRAIN THE LEAST'],
    speed: 1.5,
    cooldown: 10,
    maxSparks: 4,
    power: 1,
    armor: 0.6,
    pulses: 1,
    magic: 0,
    body: '#0d9488',
    head: '#5eead4',
  },
  sage: {
    name: 'SAGE',
    role: 'MAGIC',
    about: ['STARTS WITH THREE PULSES', 'EACH ONE JOLTS GENERATORS TOO'],
    speed: 1.4,
    cooldown: 11,
    maxSparks: 4,
    power: 1,
    armor: 1.3,
    pulses: 3,
    magic: 2,
    body: '#7c3aed',
    head: '#c4b5fd',
  },
  zip: {
    name: 'ZIP',
    role: 'SPEED',
    about: ['THE FASTEST WHEELS', 'AND THE QUICKEST SPARKS'],
    speed: 1.7,
    cooldown: 8,
    maxSparks: 4,
    power: 1,
    armor: 1.7,
    pulses: 1,
    magic: 0,
    body: '#16a34a',
    head: '#86efac',
  },
}
const CLASS_ORDER: BotClass[] = ['hugs', 'fix', 'sage', 'zip']

type Room = { x: number; y: number; w: number; h: number }
type Thing = { x: number; y: number }
type Generator = Thing & {
  hp: number
  maxHp: number
  timer: number
  flash: number
}
type Glitch = Thing & { cling: number; wobble: number }
type Spark = Thing & {
  vx: number
  vy: number
  life: number
  /** Glitches this spark can still pass through. */
  pierce: number
  /** The hero who threw it. */
  owner: Hero
}
/** One player's bot. */
type Hero = {
  seat: number
  cls: BotClass
  /** Select-screen cursor (an index into CLASS_ORDER), and whether it's locked in. */
  choice: number
  picked: boolean
  x: number
  y: number
  facing: number
  fireCooldown: number
  battery: number
  pulses: number
  /** Battery ran out: stopped until a partner shares a charge. */
  flat: boolean
}
type Item = Thing & { kind: 'snack' | 'pulse' | 'cage' | 'key' }
type Door = { tiles: number[]; open: boolean }
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = { x: number; y: number; text: string; life: number }

/** Eight facings, clockwise from up. */
const FACE_X = [0, 1, 1, 1, 0, -1, -1, -1]
const FACE_Y = [-1, -1, 0, 1, 1, 1, 0, -1]

function idleFrame(): InputFrame {
  const held = {
    up: false,
    down: false,
    left: false,
    right: false,
    a: false,
    b: false,
    start: false,
  }
  return { held, pressed: { ...held } }
}

function newHero(seat: number): Hero {
  const choice = START_CHOICE[seat] ?? 0
  return {
    seat,
    cls: CLASS_ORDER[choice]!,
    choice,
    picked: false,
    x: 0,
    y: 0,
    facing: 4,
    fireCooldown: 0,
    battery: MAX_BATTERY,
    pulses: 1,
    flat: false,
  }
}

// --- 16-bit art (utils/arcade/snes.ts) -------------------------------------------

/** walls[] value for a solid server rack (the floor is built all rack, then carved). */
const RACK = 1

type View = 'down' | 'up' | 'side'

/** Each bot's body and head ramps, around its class colours. */
const BOT_LOOKS: Record<BotClass, { body: Ramp; head: Ramp }> = {
  hugs: {
    body: ['#4a1606', '#8a2e0a', '#ea580c', '#fb923c', '#fed7aa'],
    head: ['#7a2c10', '#c2541b', '#fdba74', '#fed7aa', '#fff4e6'],
  },
  fix: {
    body: ['#0b3a4a', '#0f6b73', '#0d9488', '#2dd4bf', '#a7f3e4'],
    head: ['#0f6b73', '#14a3a0', '#5eead4', '#a7f3e4', '#e6fffa'],
  },
  sage: {
    body: ['#24124f', '#4c2a99', '#7c3aed', '#a78bfa', '#e9e1ff'],
    head: ['#4c2a99', '#7c5cf0', '#c4b5fd', '#e4dcff', '#ffffff'],
  },
  zip: {
    body: ['#123d2a', '#1d6b3a', '#16a34a', '#4ade80', '#d9ffe0'],
    head: ['#1d6b3a', '#3fa34d', '#86efac', '#c6f7d6', '#f0fff4'],
  },
}

function botPalette(cls: BotClass): Record<string, string> {
  const { body, head } = BOT_LOOKS[cls]
  return {
    D: head[0],
    S: head[1],
    B: head[2],
    L: head[3],
    H: head[4],
    d: body[0],
    s: body[1],
    b: body[2],
    l: body[3],
    h: body[4],
    k: INK,
    e: RAMPS.gold[3],
    w: '#ffffff',
    M: RAMPS.steel[3],
    m: RAMPS.steel[2],
    n: RAMPS.steel[1],
    p: RAMPS.pink[3],
    g: RAMPS.teal[3],
    q: RAMPS.pink[3],
    Q: RAMPS.gold[4],
  }
}

/** Stamp `art` into `grid` at (x, y); '.' in the art is see-through. */
function stamp(grid: string[][], x: number, y: number, art: readonly string[]) {
  art.forEach((line, dy) => {
    for (let dx = 0; dx < line.length; dx++) {
      const ch = line[dx]!
      const row = grid[y + dy]
      if (ch !== '.' && row && x + dx >= 0 && x + dx < row.length)
        row[x + dx] = ch
    }
  })
}

const BOT_HEAD: Record<View, readonly string[]> = {
  down: ['.HHHHHHHH.', 'HLLLLLLLLS', 'LkkkkkkkkS', 'LkeekkeekS', '.LBBBBBBS.'],
  up: ['.HHHHHHHH.', 'HLLLLLLLLS', 'LLBBBBBBBS', 'LBmMmMmMBS', '.BSSSSSSS.'],
  side: ['.HHHHHHH..', 'HLLLLLLLBS', 'LMLLLkkkkS', 'LmLLLkkeeS', '.LBBBBBBS.'],
}
const BOT_TORSO: Record<View, readonly string[]> = {
  down: ['lhhhhhhhbs', 'hlkkkkllbs', 'llkpgklbbs', 'lbbbbbbbsd', '.ssssssss.'],
  up: ['lhhhhhhhbs', 'hllllllbbs', 'llmMmMmbbs', 'lbbbbbbbsd', '.ssssssss.'],
  side: ['lhhhhhbs', 'hlllllks', 'lllbbkgs', 'lbbbbbsd', '.sssssd.'],
}
const BOT_LEGS: Record<View, readonly (readonly string[])[]> = {
  down: [
    ['..Mn..Mn..', '.Mnn...nn.'],
    ['..Mn..Mn..', '..nn..Mnn.'],
  ],
  up: [
    ['..Mn..Mn..', '.Mnn...nn.'],
    ['..Mn..Mn..', '..nn..Mnn.'],
  ],
  side: [
    ['.Mn..Mn.', 'Mnn..Mnn'],
    ['..MnMn..', '..nnnn..'],
  ],
}

/**
 * A bot as rows of palette letters: 16 wide, feet on the bottom row. All four share Fix's
 * head and frame, each with its own silhouette: Hugs's big hugging arms, Fix's shoulder pads
 * and treads, Sage's antenna and robe, Zip's slim body, fin and wheel. `frame` is the walk step.
 */
function botRows(cls: BotClass, view: View, frame: 0 | 1): string[] {
  const grid = Array.from({ length: 16 }, () => new Array<string>(16).fill('.'))
  const side = view === 'side'
  const tx = side ? 4 : 3
  if (cls === 'hugs' && side) stamp(grid, 2, 10 + frame, ['SS.', 'DS.'])
  if (cls === 'zip' && side)
    stamp(grid, 0, 5, ['..H', '.HL', 'HLB', 'LBS', '.S.'])
  if (cls === 'zip' && !side) stamp(grid, 7, 2, ['HL', 'LB'])
  if (cls === 'sage') stamp(grid, 6, 1, ['.Q.', 'QqQ', '.M.'])
  stamp(grid, 3, 4, BOT_HEAD[view])
  if (cls === 'zip' && !side) {
    stamp(
      grid,
      4,
      9,
      view === 'down'
        ? ['lhhhhhbs', 'hlkkkkbs', 'llkpgkbs', 'lbbbbbsd', '.ssssss.']
        : ['lhhhhhbs', 'hllllbbs', 'lmMmMmbs', 'lbbbbbsd', '.ssssss.'],
    )
  } else {
    stamp(grid, tx, 9, BOT_TORSO[view])
  }
  if (cls === 'sage') {
    const hem = frame ? '.dsdsdsdsds.' : '.sdsdsdsdsd.'
    if (side) stamp(grid, 3, 12, ['lbbbbbbbsd', hem.slice(1, 11)])
    else stamp(grid, 2, 12, ['lbbbbbbbbbsd', hem])
  }
  if (cls === 'fix') {
    if (side) stamp(grid, 5, 9, ['MMm', 'mmn'])
    else {
      stamp(grid, 1, 9, ['MMM', 'mmn'])
      stamp(grid, 12, 9, ['MMm', 'mnn'])
    }
    const tread = frame ? 'mMmMmMmMmM' : 'MmMmMmMmMm'
    stamp(grid, 3, 14, [side ? `.${tread.slice(1, 9)}.` : tread, 'nnnnnnnnnn'])
  } else if (cls === 'zip') {
    if (side)
      stamp(
        grid,
        5,
        13,
        frame ? ['.nmMn.', 'nMkwMn', '.nMmn.'] : ['.nMMn.', 'nMwkMn', '.nmmn.'],
      )
    else
      stamp(
        grid,
        6,
        13,
        frame ? ['nmmn', 'nMMn', '.nn.'] : ['nMMn', 'nmmn', '.nn.'],
      )
  } else {
    stamp(grid, tx, 14, BOT_LEGS[view][frame]!)
  }
  if (cls === 'hugs') {
    const lift = frame
    if (side) stamp(grid, 10, 10 + lift, ['.LLB', 'LBBS', '.SSD'])
    else {
      stamp(grid, 0, 9 + lift, ['.HS', 'HLS', 'HLS', 'LBS', '.SD'])
      stamp(grid, 13, 10 - lift, ['LB.', 'LBS', 'LBS', 'BSD', '.D.'])
    }
  }
  return grid.map((row) => row.join(''))
}

type BotSprites = Record<View, readonly [PixelSprite, PixelSprite]>

const BOT_SPRITES = Object.fromEntries(
  CLASS_ORDER.map((cls) => {
    const palette = botPalette(cls)
    const views = (['down', 'up', 'side'] as const).map(
      (view) =>
        [
          view,
          [
            pixelSprite(botRows(cls, view, 0), palette),
            pixelSprite(botRows(cls, view, 1), palette),
          ] as const,
        ] as const,
    )
    return [cls, Object.fromEntries(views) as BotSprites]
  }),
) as Record<BotClass, BotSprites>

/** The aiming wrench nut, shown the exact way (of eight) the bot faces. */
const WRENCH_SPRITE = pixelSprite(['MM.', 'MwM', '.Mm'], {
  M: RAMPS.steel[3],
  m: RAMPS.steel[2],
  w: '#ffffff',
})

/** An empty battery blinking over a flat bot. */
const FLAT_SPRITE = pixelSprite(
  ['MMMMMMM.', 'Mr....MM', 'Mr....MM', 'MMMMMMM.'],
  {
    M: RAMPS.steel[3],
    r: RAMPS.ember[2],
  },
)

const GLITCH_PALETTE = {
  d: '#3b0a45',
  s: '#86198f',
  b: '#d946ef',
  l: '#f0abfc',
  h: '#fdf4ff',
  c: '#22d3ee',
  C: '#a5f3fc',
  w: '#ffffff',
  k: INK,
}
const GLITCH_ROWS = [
  [
    '..sbbbs..',
    '.sblhlbs.',
    'sbllbbbbs',
    'bwwbbwwbs',
    'bwkbbwkbs',
    'sbbbbbbbc',
    'sbkbkbkbs',
    '.sbsbsbs.',
    '..s.s.s..',
  ],
  [
    '..sbbbs..',
    '.sblhlbs.',
    'sbllbbbbs',
    'bwwbbwwbC',
    'bkwbbkwbs',
    'Csbbbbbbb',
    'sbkbkbkbs',
    '.sbs.sbs.',
    '.s..s..s.',
  ],
] as const
const GLITCH_SPRITES = GLITCH_ROWS.map((rows) =>
  pixelSprite(rows, GLITCH_PALETTE),
)
/** The cyan ghost each glitch smears beside itself (chromatic split). */
const GLITCH_GHOSTS = GLITCH_ROWS.map((rows) =>
  pixelSprite(
    rows,
    Object.fromEntries(
      Object.keys(GLITCH_PALETTE).map((key) => [key, RAMPS.teal[3]]),
    ),
    { outline: null },
  ),
)

/** Rows of palette letters from a per-pixel painter ('.' is clear). */
function raster(
  w: number,
  h: number,
  paint: (x: number, y: number) => string,
): string[] {
  return Array.from({ length: h }, (_, y) =>
    Array.from({ length: w }, (_, x) => paint(x, y)).join(''),
  )
}

/** A glitch generator: a battered steel cabinet with a static-filled screen and a vent. */
const GENERATOR_ROWS = raster(14, 14, (x, y) => {
  const edge = (x === 0 || x === 13) && (y === 0 || y === 13)
  if (edge) return '.'
  if (y === 13 || x === 13) return '0'
  if (y === 12 || x === 12) return '1'
  if (y === 0 || x === 0) return '4'
  if (y === 1 || x === 1) return '3'
  if (y >= 2 && y <= 7 && x >= 2 && x <= 11) return 'k'
  if ((y === 9 || y === 10) && x >= 3 && x <= 10 && x % 2 === 1) return 'v'
  return '2'
})
const GENERATOR_SPRITE = pixelSprite(GENERATOR_ROWS, {
  0: RAMPS.steel[0],
  1: RAMPS.steel[1],
  2: RAMPS.steel[2],
  3: RAMPS.steel[3],
  4: RAMPS.steel[4],
  k: INK,
  v: RAMPS.night[0],
})
const GENERATOR_FLASH = pixelSprite(GENERATOR_ROWS, {
  0: '#ffffff',
  1: '#ffffff',
  2: '#ffffff',
  3: '#ffffff',
  4: '#ffffff',
  k: RAMPS.pink[4],
  v: '#ffffff',
})

const PINK_PALETTE = {
  h: RAMPS.pink[4],
  P: RAMPS.pink[3],
  p: RAMPS.pink[2],
  q: RAMPS.pink[1],
}
const GOLD_PALETTE = {
  y: '#ffffff',
  G: RAMPS.gold[4],
  g: RAMPS.gold[3],
  o: RAMPS.gold[2],
  O: RAMPS.gold[1],
}

/** A frosted donut snack with sprinkles. */
const SNACK_SPRITE = pixelSprite(
  [
    '..hhPPPp..',
    '.hPtPPwPp.',
    'hPPPppPyPq',
    'PwPp..qPPq',
    'gPPq..qPtq',
    'ogPPqqPPqO',
    '.oggqqqgO.',
    '..OooooO..',
  ],
  {
    ...PINK_PALETTE,
    t: RAMPS.teal[3],
    w: '#ffffff',
    y: RAMPS.gold[4],
    g: RAMPS.gold[3],
    o: RAMPS.gold[2],
    O: RAMPS.gold[1],
  },
)

const KEY_SPRITE = pixelSprite(
  ['.yGg.......', 'yG.gGGGGGGg', 'Gg.oooooooo', '.go....oo.o', '.......O..O'],
  GOLD_PALETTE,
)

/** A kindness pulse: a pink heart. */
const HEART_SPRITE = pixelSprite(
  [
    '.PP...PP.',
    'PhhP.PPPp',
    'PhPPPPPPp',
    'PPPPPPPPp',
    '.PPPPPPp.',
    '..pPPPq..',
    '...ppq...',
    '....q....',
  ],
  PINK_PALETTE,
)

/** A little gold bot trapped in a cage, waving for help (two frames). */
const CAGED_PALETTE = {
  H: RAMPS.gold[4],
  L: RAMPS.gold[3],
  B: RAMPS.gold[2],
  S: RAMPS.gold[1],
  k: INK,
  e: '#ffffff',
  p: RAMPS.pink[3],
}
const CAGED_BODY = ['.LkekekS.', '.LBBpBBS.', '..SSSSS..']
const CAGED_SPRITES = [
  pixelSprite(
    [
      '..HHHHH..',
      '.HLLLLLS.',
      ...CAGED_BODY,
      'LLBBBBBSS',
      'L.BBBBBS.',
      '..S...S..',
    ],
    CAGED_PALETTE,
  ),
  pixelSprite(
    [
      'L.HHHHH.S',
      'LHLLLLLSS',
      ...CAGED_BODY,
      '.LBBBBBS.',
      '.LBBBBBS.',
      '..S...S..',
    ],
    CAGED_PALETTE,
  ),
]
const CAGE_BARS = pixelSprite(
  raster(13, 15, (x, y) => {
    if (y === 0) return 'W'
    if (y === 1) return 'M'
    if (y === 2 || y === 12) return 'k'
    if (y === 13) return 'm'
    if (y === 14) return 'n'
    return x % 3 === 0 ? 'M' : '.'
  }),
  {
    W: RAMPS.steel[4],
    M: RAMPS.steel[3],
    m: RAMPS.steel[2],
    n: RAMPS.steel[1],
    k: INK,
  },
  { outline: null },
)

/** A locked door tile: shaded gold bars and a crossbar over the dark, with a keyhole plate. */
const DOOR_SPRITE = pixelSprite(
  raster(16, 16, (x, y) => {
    if (y === 0) return 'W'
    if (y === 1) return 'M'
    if (y === 14) return 'm'
    if (y === 15) return 'k'
    if (x >= 5 && x <= 9 && y >= 9 && y <= 13) {
      if (x === 7 && y >= 10 && y <= 12) return 'k'
      return x === 5 || y === 9 ? 'G' : x === 9 || y === 13 ? 'o' : 'g'
    }
    if (y === 6) return 'G'
    if (y === 7) return 'g'
    if (y === 8) return 'O'
    const bar = x % 5
    if (x === 0 || x === 15 || bar === 0 || bar === 4) return 'v'
    return bar === 1 ? 'G' : bar === 2 ? 'g' : 'O'
  }),
  {
    ...GOLD_PALETTE,
    W: RAMPS.steel[4],
    M: RAMPS.steel[3],
    m: RAMPS.steel[1],
    k: INK,
    v: '#1c1520',
  },
  { outline: null },
)

const SPARK_PALETTE = { h: RAMPS.gold[3], Y: RAMPS.gold[4], w: '#ffffff' }
const SPARK_SPRITES = [
  pixelSprite(['..h..', '.hYh.', 'hYwYh', '.hYh.', '..h..'], SPARK_PALETTE, {
    outline: RAMPS.rust[1],
  }),
  pixelSprite(['h...h', '.hYh.', '.YwY.', '.hYh.', 'h...h'], SPARK_PALETTE, {
    outline: RAMPS.rust[1],
  }),
]
/** Hugs's big sparks. */
const BIG_SPARK_SPRITES = [
  pixelSprite(
    [
      '...h...',
      '..hYh..',
      '.hYwYh.',
      'hYwwwYh',
      '.hYwYh.',
      '..hYh..',
      '...h...',
    ],
    SPARK_PALETTE,
    { outline: RAMPS.rust[1] },
  ),
  pixelSprite(
    [
      'h..h..h',
      '.hYYYh.',
      '.YwwwY.',
      'hYwwwYh',
      '.YwwwY.',
      '.hYYYh.',
      'h..h..h',
    ],
    SPARK_PALETTE,
    { outline: RAMPS.rust[1] },
  ),
]

/** HUD icons: a pulse heart, a rescued bot and a key. */
const HUD_HEART = pixelSprite(
  ['hP.PP', 'PPPPq', '.PPq.', '..q..'],
  PINK_PALETTE,
)
const HUD_BOT = pixelSprite(['HLLLS', 'LkLkS', 'LBBBS', '.S.S.'], CAGED_PALETTE)
const HUD_KEY = pixelSprite(['.Gg...', 'G.Gggg', '.go.oO'], GOLD_PALETTE)

/** The raised floor of the server room: cool steel panels. */
const FLOOR_RAMP: Ramp = ['#0a0a1e', '#131735', '#1c2248', '#2a3363', '#414d8a']
/** The rack walls' colours change every floor, so a long run doesn't look like one dungeon. */
const WALL_THEMES: readonly Ramp[] = [
  RAMPS.purple,
  RAMPS.sky,
  RAMPS.pink,
  RAMPS.steel,
]
const CABLE_RAMPS: readonly Ramp[] = [RAMPS.pink, RAMPS.teal, RAMPS.gold]
const LED_COLOURS = [
  RAMPS.leaf[3],
  RAMPS.teal[3],
  RAMPS.leaf[3],
  RAMPS.gold[3],
  RAMPS.ember[3],
]
const FOG = RAMPS.night[0]
const FOG_BANDS = [rgba(FOG, 0.75), rgba(FOG, 0.48), rgba(FOG, 0.22)]
const AO_BANDS = [rgba(INK, 0.6), rgba(INK, 0.38), rgba(INK, 0.18)]

/** A steady per-tile dice roll for floor and rack details (never the game's rng). */
function tileHash(tx: number, ty: number, level: number): number {
  let h =
    Math.imul(tx + 1, 374761393) +
    Math.imul(ty + 1, 668265263) +
    Math.imul(level, 1274126177)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

function rackAt(walls: Uint8Array, tx: number, ty: number): boolean {
  if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) return true
  return walls[ty * MW + tx] === RACK
}

function wallTheme(level: number): Ramp {
  return WALL_THEMES[(level - 1) % WALL_THEMES.length]!
}

/**
 * The static floor plan, tiles (x0..x1, y0..y1): banded raised-floor panels (some perforated,
 * some vented) with cable runs along the foot of the walls and the walls' shadows, then the
 * walls as server racks seen from above: bevelled tops with vents, lit where they meet the
 * floor, and a rack front of drive bays, grilles or fans wherever floor lies below. Doors are
 * painted as floor; they're drawn live over it while locked.
 */
function paintFloor(
  k: CanvasRenderingContext2D,
  walls: Uint8Array,
  level: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
) {
  const theme = wallTheme(level)
  const rack = (tx: number, ty: number) => rackAt(walls, tx, ty)
  for (let ty = y0; ty <= y1; ty++) {
    // Each row of wall-foot cable is one run, so it reads as laid, not scattered.
    const cabled = tileHash(0, ty, level + 7) < 0.6
    const cable = CABLE_RAMPS[Math.floor(tileHash(1, ty, level) * 3)]!
    for (let tx = x0; tx <= x1; tx++) {
      if (rack(tx, ty)) continue
      const x = tx * T
      const y = ty * T
      bandedGradient(k, x, y, T, T, [FLOOR_RAMP[2], FLOOR_RAMP[1]], 2)
      k.fillStyle = FLOOR_RAMP[3]
      k.fillRect(x, y, T - 1, 1)
      k.fillRect(x, y, 1, T - 1)
      k.fillStyle = FLOOR_RAMP[0]
      k.fillRect(x, y + T - 1, T, 1)
      k.fillRect(x + T - 1, y, 1, T)
      const h = tileHash(tx, ty, level)
      if (h < 0.12) {
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            k.fillStyle = FLOOR_RAMP[0]
            k.fillRect(x + 3 + i * 4, y + 3 + j * 4, 2, 2)
            k.fillStyle = FLOOR_RAMP[3]
            k.fillRect(x + 3 + i * 4, y + 5 + j * 4, 2, 1)
          }
        }
      } else if (h > 0.95) {
        for (let i = 0; i < 4; i++) {
          k.fillStyle = INK
          k.fillRect(x + 3, y + 4 + i * 2, 10, 1)
          k.fillStyle = FLOOR_RAMP[3]
          k.fillRect(x + 3, y + 5 + i * 2, 10, 1)
        }
      }
      const wallAbove = rack(tx, ty - 1)
      if (wallAbove && cabled) {
        k.fillStyle = cable[3]
        k.fillRect(x, y + 4, T, 1)
        k.fillStyle = cable[1]
        k.fillRect(x, y + 5, T, 1)
        k.fillStyle = RAMPS.teal[1]
        k.fillRect(x, y + 7, T, 1)
        k.fillStyle = RAMPS.night[0]
        k.fillRect(x, y + 8, T, 1)
        if (h > 0.5) {
          k.fillStyle = RAMPS.steel[3]
          k.fillRect(x + Math.floor(h * 12) + 2, y + 3, 1, 4)
        }
      }
      if (wallAbove) {
        AO_BANDS.forEach((band, i) => {
          k.fillStyle = band
          k.fillRect(x, y + i, T, 1)
        })
      }
      if (rack(tx - 1, ty)) {
        k.fillStyle = AO_BANDS[0]!
        k.fillRect(x, y, 1, T)
        k.fillStyle = AO_BANDS[2]!
        k.fillRect(x + 1, y, 1, T)
      }
    }
  }
  const face = mix(theme[0], RAMPS.steel[0], 0.5)
  const faceLit = mix(theme[1], RAMPS.steel[1], 0.5)
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (!rack(tx, ty)) continue
      const x = tx * T
      const y = ty * T
      const up = !rack(tx, ty - 1)
      const down = !rack(tx, ty + 1)
      const left = !rack(tx - 1, ty)
      const right = !rack(tx + 1, ty)
      const h = tileHash(tx, ty, level)
      const topH = down ? 8 : T
      // The rack's lid: a panel with vent slots, seamed from its neighbours. Lids
      // along the floor catch the light; deep in a block of racks they sink into shade.
      let deep = true
      for (let dy = -1; dy <= 1 && deep; dy++)
        for (let dx = -1; dx <= 1; dx++)
          if (!rack(tx + dx, ty + dy)) deep = false
      const lid = deep ? mix(theme[0], theme[1], 0.5) : theme[1]
      const seam = deep ? theme[1] : theme[2]
      k.fillStyle = theme[0]
      k.fillRect(x, y, T, topH)
      k.fillStyle = lid
      k.fillRect(x + 1, y + 1, T - 2, topH - 2)
      k.fillStyle = seam
      k.fillRect(x + 1, y + 1, T - 2, 1)
      k.fillRect(x + 1, y + 1, 1, topH - 2)
      if (!down) {
        if (h < 0.4) {
          for (let i = 0; i < 3; i++) {
            k.fillStyle = theme[0]
            k.fillRect(x + 4, y + 4 + i * 3, 8, 1)
            k.fillStyle = seam
            k.fillRect(x + 4, y + 5 + i * 3, 8, 1)
          }
        } else if (h < 0.7) {
          k.fillStyle = theme[0]
          k.fillRect(x + 7, y + 7, 2, 2)
          k.fillStyle = seam
          k.fillRect(x + 7, y + 7, 1, 1)
        }
      } else {
        // The rack front, facing the floor below: a lit lip, then the bays.
        k.fillStyle = theme[4]
        k.fillRect(x, y + 7, T, 1)
        k.fillStyle = face
        k.fillRect(x, y + 8, T, 8)
        k.fillStyle = faceLit
        k.fillRect(x, y + 8, T, 1)
        const variant = Math.floor(h * 3)
        if (variant === 0) {
          for (const b of [9, 12]) {
            k.fillStyle = faceLit
            k.fillRect(x + 2, y + b, 9, 1)
            k.fillStyle = INK
            k.fillRect(x + 2, y + b + 1, 9, 1)
            k.fillStyle = RAMPS.steel[3]
            k.fillRect(x + 5, y + b + 1, 3, 1)
          }
        } else if (variant === 1) {
          for (let i = 0; i < 5; i++) {
            k.fillStyle = INK
            k.fillRect(x + 2 + i * 2, y + 9, 1, 5)
            k.fillStyle = faceLit
            k.fillRect(x + 3 + i * 2, y + 9, 1, 5)
          }
        } else {
          k.fillStyle = INK
          k.fillRect(x + 3, y + 9, 6, 5)
          k.fillStyle = faceLit
          k.fillRect(x + 4, y + 10, 4, 3)
          k.fillStyle = RAMPS.steel[2]
          k.fillRect(x + 5, y + 10, 2, 3)
          k.fillRect(x + 4, y + 11, 4, 1)
          k.fillStyle = INK
          k.fillRect(x + 5, y + 11, 2, 1)
        }
        k.fillStyle = INK
        k.fillRect(x + 11, y + 9, 3, 5)
        k.fillRect(x, y + 15, T, 1)
      }
      k.fillStyle = INK
      if (up) {
        k.fillRect(x, y, T, 1)
        k.fillStyle = theme[4]
        k.fillRect(x + (left ? 1 : 0), y + 1, T - (left ? 1 : 0), 1)
        k.fillStyle = INK
      }
      if (left) {
        k.fillRect(x, y, 1, T)
        k.fillStyle = theme[3]
        k.fillRect(x + 1, y + 1, 1, topH - 1)
        k.fillStyle = INK
      }
      if (right) {
        k.fillRect(x + T - 1, y, 1, T)
        k.fillStyle = theme[0]
        k.fillRect(x + T - 2, y + 1, 1, topH - 1)
      }
    }
  }
}

/** The LED pair on a rack front (paintFloor leaves a dark socket at x+11..13). */
function rackFaces(walls: Uint8Array, tx: number, ty: number): boolean {
  return rackAt(walls, tx, ty) && !rackAt(walls, tx, ty + 1)
}

const floorLayers: Array<{ key: string; canvas: HTMLCanvasElement }> = []

/**
 * The floor plan, painted once per floor layout to an offscreen canvas the size of the whole
 * floor and copied each frame under the camera. Like snes.ts cachedLayer, but it keeps only
 * the two latest layouts (every floor is a new one, so a long run would otherwise pile up
 * canvases). Headless it paints just the tiles on screen.
 */
function floorLayer(
  g: CanvasRenderingContext2D,
  key: string,
  paintAll: (k: CanvasRenderingContext2D) => void,
  paintVisible: () => void,
) {
  if (typeof document === 'undefined') {
    paintVisible()
    return
  }
  let layer = floorLayers.find((l) => l.key === key)
  if (!layer) {
    const canvas =
      floorLayers.length >= 2
        ? floorLayers.shift()!.canvas
        : document.createElement('canvas')
    canvas.width = MW * T
    canvas.height = MH * T
    const k = canvas.getContext('2d')
    if (!k) {
      paintVisible()
      return
    }
    paintAll(k)
    layer = { key, canvas }
    floorLayers.push(layer)
  }
  g.save()
  g.imageSmoothingEnabled = false
  g.drawImage(layer.canvas, 0, 0)
  g.restore()
}

/** The choose-your-bot stage: a banded server hall with racks along the back. */
function paintSelect(k: CanvasRenderingContext2D) {
  bandedGradient(
    k,
    0,
    0,
    W,
    H,
    [RAMPS.night[0], RAMPS.night[2], RAMPS.purple[0], RAMPS.night[1]],
    4,
  )
  const rand = backdropRng(61)
  for (let x = -6; x < W; x += 22) {
    const top = 34 + Math.floor(rand() * 10)
    bevel(k, x, top, 20, 150 - top, RAMPS.night, { depth: 1 })
    for (let y = top + 6; y < 146; y += 7) {
      k.fillStyle = RAMPS.night[0]
      k.fillRect(x + 3, y, 14, 2)
      k.fillStyle = rand() < 0.5 ? RAMPS.night[4] : RAMPS.purple[1]
      k.fillRect(x + 14, y, 2, 1)
    }
  }
  bandedGradient(
    k,
    0,
    150,
    W,
    H - 150,
    [RAMPS.purple[1], RAMPS.night[1], RAMPS.night[0]],
    3,
  )
  k.fillStyle = rgba(RAMPS.purple[3], 0.18)
  for (let x = 0; x < W; x += 20) k.fillRect(x, 150, 1, H - 150)
  for (const y of [158, 170, 186, 206, 232]) k.fillRect(0, y, W, 1)
}

class KindnessGauntlet implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = 1
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private heroes: Hero[]
  /** Ticks left on the choose-your-bot screen (0 once every bot is chosen). */
  private selecting = SELECT_TICKS
  private walls = new Uint8Array(MW * MH)
  private seen = new Uint8Array(MW * MH)
  /** The team's key ring. */
  private keys = 0
  private doors: Door[] = []
  private pulseFlash = 0
  private generators: Generator[] = []
  private glitches: Glitch[] = []
  private sparks: Spark[] = []
  private items: Item[] = []
  private exit: Thing = { x: 0, y: 0 }
  private leaving = 0
  private rescued = 0
  private camX = 0
  private camY = 0
  private path: Array<{ x: number; y: number }> = []
  private pathTimer = 0
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null
  // Cosmetic only: sparkles roll their own dice, so the game's seeded rng is untouched.
  private fx = new Sparkles()
  private fxRng = backdropRng(57)
  /** How far each seat's bot has rolled: its walk cycle. */
  private strides: number[] = []
  /** Where the last kindness pulse went off. */
  private pulseAt: Thing = { x: 0, y: 0 }

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    const seats = this.demo
      ? 1
      : Math.max(1, Math.min(MAX_PLAYERS, Math.round(options.players ?? 1)))
    this.heroes = Array.from({ length: seats }, (_, seat) => newHero(seat))
    this.buildFloor(1)
    // The attract pilot picks a bot at random and skips the selection screen.
    if (this.demo) {
      const lead = this.heroes[0]!
      lead.choice = Math.floor(this.rng() * 4)
      this.choose(lead)
    }
  }

  /** Player 1's bot: the attract pilot flies it, and a solo HUD shows it. */
  private get lead(): Hero {
    return this.heroes[0]!
  }

  private specOf(hero: Hero): ClassSpec {
    return BOT_CLASSES[hero.cls]
  }

  /** Bots still rolling (not flat). */
  private get standing(): Hero[] {
    return this.heroes.filter((h) => !h.flat)
  }

  /** Is this bot (by CLASS_ORDER index) already locked in by someone else? */
  private takenBy(index: number, hero: Hero): boolean {
    return this.heroes.some((o) => o !== hero && o.picked && o.choice === index)
  }

  /** The next bot along (step 1 right, 3 left) that nobody else has locked in. */
  private nextFree(hero: Hero, step: number): number {
    let index = hero.choice
    for (let i = 0; i < 4; i++) {
      index = (index + step) % 4
      if (!this.takenBy(index, hero)) return index
    }
    return hero.choice
  }

  private choose(hero: Hero) {
    if (this.takenBy(hero.choice, hero)) hero.choice = this.nextFree(hero, 1)
    hero.cls = CLASS_ORDER[hero.choice]!
    hero.picked = true
    hero.pulses = this.specOf(hero).pulses
    for (const other of this.heroes)
      if (!other.picked && other.choice === hero.choice)
        other.choice = this.nextFree(other, 1)
    if (this.heroes.some((h) => !h.picked)) return
    this.selecting = 0
    const names = this.heroes.map((h) => this.specOf(h).name)
    this.banner = {
      text:
        names.length > 2
          ? `${names.length === 3 ? 'THREE' : 'ALL FOUR'} BOTS ENTER`
          : names.length > 1
            ? `${names.join(' AND ')} ENTER`
            : `${names[0]} ENTERS`,
      sub: 'FIX THE GLITCHES',
      ticks: 90,
    }
  }

  private updateSelect(frames: InputFrame[]) {
    const timeUp = --this.selecting <= 0
    for (const hero of this.heroes) {
      if (hero.picked) continue
      const input = frames[hero.seat] ?? idleFrame()
      const step = input.pressed.left ? 3 : input.pressed.right ? 1 : 0
      if (step) {
        hero.choice = this.nextFree(hero, step)
        this.sound.play('blip')
      }
      if (input.pressed.a || input.pressed.start || timeUp) {
        this.choose(hero)
        this.sound.play('pickup')
      }
    }
  }

  // --- the floor ---------------------------------------------------------------------

  private idx(tx: number, ty: number): number {
    return ty * MW + tx
  }

  private wallAt(tx: number, ty: number): boolean {
    if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) return true
    return this.walls[this.idx(tx, ty)] !== OPEN
  }

  private solid(x: number, y: number): boolean {
    return this.wallAt(Math.floor(x / T), Math.floor(y / T))
  }

  private centre(r: Room): Thing {
    return {
      x: (r.x + Math.floor(r.w / 2)) * T + T / 2,
      y: (r.y + Math.floor(r.h / 2)) * T + T / 2,
    }
  }

  private carve(x0: number, y0: number, x1: number, y1: number) {
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) {
      for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) {
        if (x > 0 && y > 0 && x < MW - 1 && y < MH - 1)
          this.walls[this.idx(x, y)] = OPEN
      }
    }
  }

  private buildFloor(floor: number) {
    this.level = floor
    this.walls.fill(1)
    this.seen.fill(0)
    const rooms: Room[] = []
    for (let tries = 0; tries < 300 && rooms.length < 9; tries++) {
      const w = 5 + Math.floor(this.rng() * 5)
      const h = 4 + Math.floor(this.rng() * 4)
      const x = 1 + Math.floor(this.rng() * (MW - w - 2))
      const y = 1 + Math.floor(this.rng() * (MH - h - 2))
      const clash = rooms.some(
        (r) =>
          x < r.x + r.w + 2 &&
          x + w + 2 > r.x &&
          y < r.y + r.h + 2 &&
          y + h + 2 > r.y,
      )
      if (clash) continue
      rooms.push({ x, y, w, h })
    }
    rooms.sort((a, b) => a.x + a.y * 0.5 - (b.x + b.y * 0.5))
    for (const r of rooms) this.carve(r.x, r.y, r.x + r.w - 1, r.y + r.h - 1)
    // Two-wide corridors joining each room to the one before it.
    for (let i = 1; i < rooms.length; i++) {
      const a = this.centre(rooms[i - 1]!)
      const b = this.centre(rooms[i]!)
      const ax = Math.floor(a.x / T)
      const ay = Math.floor(a.y / T)
      const bx = Math.floor(b.x / T)
      const by = Math.floor(b.y / T)
      this.carve(ax, ay, bx, ay + 1)
      this.carve(bx, ay, bx + 1, by)
    }
    const start = this.centre(rooms[0]!)
    this.heroes.forEach((hero, i) => {
      // Huddled at the start, two by two (a flat bot is back with a little charge).
      const x = start.x + (i % 2 ? T : 0)
      const y = start.y + (i >= 2 ? T : 0)
      hero.x = this.solid(x, start.y) ? start.x : x
      hero.y = this.solid(hero.x, y) ? start.y : y
      if (hero.flat) {
        hero.flat = false
        hero.battery = Math.max(hero.battery, MAX_BATTERY / 4)
      }
    })
    // The stairs go in the room farthest from the start, by walking distance.
    const dist = this.distances(
      Math.floor(start.x / T),
      Math.floor(start.y / T),
    )
    const far = rooms
      .slice(1)
      .map((r) => {
        const c = this.centre(r)
        return {
          r,
          d: dist[this.idx(Math.floor(c.x / T), Math.floor(c.y / T))] ?? -1,
        }
      })
      .sort((a, b) => b.d - a.d)[0]
    this.exit = this.centre(far?.r ?? rooms[rooms.length - 1]!)
    this.doors = []
    const keyRooms = floor >= 2 ? this.lockTheWay(rooms, start) : []

    const spots = (count: number) => {
      const out: Thing[] = []
      for (let tries = 0; tries < 400 && out.length < count; tries++) {
        const r = rooms[1 + Math.floor(this.rng() * (rooms.length - 1))]!
        const tx = r.x + Math.floor(this.rng() * r.w)
        const ty = r.y + Math.floor(this.rng() * r.h)
        const x = tx * T + T / 2
        const y = ty * T + T / 2
        const taken = [
          ...this.generators,
          ...this.items,
          this.exit,
          ...out,
        ].some((o) => Math.abs(o.x - x) < T * 2 && Math.abs(o.y - y) < T * 2)
        if (!taken) out.push({ x, y })
      }
      return out
    }
    this.generators = []
    this.items = []
    const hp = Math.round(levelCurve(floor, GAUNTLET_CURVES.generatorHp))
    for (const s of spots(
      Math.round(levelCurve(floor, GAUNTLET_CURVES.generators)),
    )) {
      this.generators.push({
        ...s,
        hp,
        maxHp: hp,
        timer: 60 + Math.floor(this.rng() * 90),
        flash: 0,
      })
    }
    for (const s of spots(
      Math.round(levelCurve(floor, GAUNTLET_CURVES.snacks)),
    )) {
      this.items.push({ ...s, kind: 'snack' })
    }
    for (const s of spots(
      Math.round(levelCurve(floor, GAUNTLET_CURVES.cages)),
    )) {
      this.items.push({ ...s, kind: 'cage' })
    }
    for (const s of spots(1)) this.items.push({ ...s, kind: 'pulse' })
    // The key goes in a room on the near side of the door.
    for (let tries = 0; tries < 200 && keyRooms.length; tries++) {
      const r = keyRooms[Math.floor(this.rng() * keyRooms.length)]!
      const x = (r.x + Math.floor(this.rng() * r.w)) * T + T / 2
      const y = (r.y + Math.floor(this.rng() * r.h)) * T + T / 2
      const taken = [...this.generators, ...this.items].some(
        (o) => Math.abs(o.x - x) < T * 2 && Math.abs(o.y - y) < T * 2,
      )
      if (
        taken ||
        (Math.abs(x - start.x) < T * 2 && Math.abs(y - start.y) < T * 2)
      )
        continue
      this.items.push({ x, y, kind: 'key' })
      break
    }
    this.glitches = []
    this.sparks = []
    this.leaving = 0
    this.path = []
    this.reveal()
    this.lives = this.standing.length
    this.banner = { text: `FLOOR ${floor}`, sub: 'FIX THE GLITCHES', ticks: 90 }
  }

  /**
   * Lock a door across a corridor on the way to the stairs, where it truly cuts
   * the floor in two. Returns the rooms still reachable from the start (where
   * the key can go), or none when no clean cut exists on this floor.
   */
  private lockTheWay(rooms: Room[], start: Thing): Room[] {
    const sx = Math.floor(start.x / T)
    const sy = Math.floor(start.y / T)
    const dist = this.distances(sx, sy)
    // The walking route from the stairs back to the start.
    let x = Math.floor(this.exit.x / T)
    let y = Math.floor(this.exit.y / T)
    const route: Array<[number, number]> = []
    for (let guard = 0; guard < 600; guard++) {
      route.push([x, y])
      const d = dist[this.idx(x, y)]!
      if (d <= 0) break
      const step = (
        [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ] as const
      ).find(([dx, dy]) => dist[this.idx(x + dx, y + dy)] === d - 1)
      if (!step) break
      x += step[0]
      y += step[1]
    }
    const inRoom = (tx: number, ty: number) =>
      rooms.some(
        (r) =>
          tx >= r.x - 1 && tx <= r.x + r.w && ty >= r.y - 1 && ty <= r.y + r.h,
      )
    const n = route.length
    for (let i = Math.floor(n * 0.25); i < Math.floor(n * 0.65); i++) {
      const [cx, cy] = route[i]!
      if (inRoom(cx, cy)) continue
      const [nx] = route[i + 1] ?? route[i - 1]!
      // Span the corridor's width, across the direction of travel.
      const across: Array<[number, number]> =
        nx !== cx
          ? [
              [cx, cy - 1],
              [cx, cy + 1],
            ]
          : [
              [cx - 1, cy],
              [cx + 1, cy],
            ]
      const tiles = [this.idx(cx, cy)]
      for (const [ax, ay] of across)
        if (!this.wallAt(ax, ay) && !inRoom(ax, ay))
          tiles.push(this.idx(ax, ay))
      for (const t of tiles) this.walls[t] = DOOR
      const cut = this.distances(sx, sy)
      const exitTile = this.idx(
        Math.floor(this.exit.x / T),
        Math.floor(this.exit.y / T),
      )
      if (cut[exitTile] === -1) {
        this.doors.push({ tiles, open: false })
        return rooms.slice(1).filter((r) => {
          const c = this.centre(r)
          return cut[this.idx(Math.floor(c.x / T), Math.floor(c.y / T))]! > 0
        })
      }
      for (const t of tiles) this.walls[t] = OPEN
    }
    return []
  }

  /** Walking into a locked door with a key opens it. */
  private tryDoors(hero: Hero) {
    if (this.keys <= 0) return
    const reach = T / 2 + HALF + 3
    for (const door of this.doors) {
      if (door.open) continue
      const near = door.tiles.some((t) => {
        const cx = (t % MW) * T + T / 2
        const cy = Math.floor(t / MW) * T + T / 2
        return Math.abs(cx - hero.x) < reach && Math.abs(cy - hero.y) < reach
      })
      if (!near) continue
      this.keys--
      door.open = true
      for (const t of door.tiles) this.walls[t] = OPEN
      const t0 = door.tiles[0]!
      const dx = (t0 % MW) * T + T / 2
      const dy = Math.floor(t0 / MW) * T + T / 2
      this.addScore(DOOR_POINTS, dx, dy - 12)
      this.burst(dx, dy, 12, '#fbbf24')
      this.sparkle(dx, dy, 12)
      this.sound.play('pickup')
    }
  }

  /** Walking distance in tiles from (sx, sy) to every open tile. */
  private distances(sx: number, sy: number, throughDoors = false): Int16Array {
    const dist = new Int16Array(MW * MH).fill(-1)
    const queue = [sx, sy]
    dist[this.idx(sx, sy)] = 0
    for (let head = 0; head < queue.length; head += 2) {
      const x = queue[head]!
      const y = queue[head + 1]!
      const d = dist[this.idx(x, y)]!
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const) {
        const nx = x + dx
        const ny = y + dy
        const blocked =
          this.wallAt(nx, ny) &&
          !(throughDoors && this.walls[this.idx(nx, ny)] === DOOR)
        if (blocked || dist[this.idx(nx, ny)] !== -1) continue
        dist[this.idx(nx, ny)] = d + 1
        queue.push(nx, ny)
      }
    }
    return dist
  }

  /** Light up the tiles around each bot (the map is dark until explored). */
  private reveal() {
    for (const hero of this.heroes) {
      const tx = Math.floor(hero.x / T)
      const ty = Math.floor(hero.y / T)
      for (let y = ty - 6; y <= ty + 6; y++) {
        for (let x = tx - 8; x <= tx + 8; x++) {
          if (x >= 0 && y >= 0 && x < MW && y < MH)
            this.seen[this.idx(x, y)] = 1
        }
      }
    }
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame, players?: InputFrame[]) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    const frames = this.demo ? [this.demoInput()] : (players ?? [input])
    if (this.selecting > 0) {
      this.updateSelect(frames)
      return
    }

    if (this.leaving > 0) {
      if (--this.leaving === 0) this.buildFloor(this.level + 1)
      return
    }
    if (this.pulseFlash > 0) this.pulseFlash--

    for (const hero of this.standing) {
      if (this.tick % DRAIN_TICKS === 0) hero.battery--
      if (hero.fireCooldown > 0) hero.fireCooldown--
      const controls = frames[hero.seat] ?? idleFrame()
      const fromX = hero.x
      const fromY = hero.y
      this.move(hero, controls)
      this.strides[hero.seat] =
        (this.strides[hero.seat] ?? 0) +
        Math.abs(hero.x - fromX) +
        Math.abs(hero.y - fromY)
      this.tryDoors(hero)
      if (controls.pressed.a || (controls.held.a && hero.fireCooldown === 0))
        this.fire(hero)
      if (controls.pressed.b) this.pulse(hero)
    }
    this.shareCharge()
    this.updateSparks()
    this.updateGenerators()
    this.updateGlitches()
    this.pickUp()
    this.reveal()

    const atExit = this.standing.find(
      (h) => Math.hypot(this.exit.x - h.x, this.exit.y - h.y) < 10,
    )
    if (atExit) {
      const bonus = FLOOR_POINTS + 100 * this.level
      this.addScore(bonus, atExit.x, atExit.y - 16)
      this.leaving = EXIT_TICKS
      this.banner = {
        text: 'DOWN THE STAIRS!',
        sub: `FLOOR BONUS ${bonus}`,
        ticks: EXIT_TICKS,
      }
      this.sound.play('level')
    }
    for (const hero of this.standing) {
      if (hero.battery > 0) continue
      hero.battery = 0
      hero.flat = true
      this.burst(hero.x, hero.y, 10, '#94a3b8')
      this.sound.play('die')
      if (this.standing.length)
        this.banner = {
          text: `${this.specOf(hero).name} IS FLAT`,
          sub: 'ROLL OVER AND SHARE A CHARGE',
          ticks: 120,
        }
    }
    this.lives = this.standing.length
    if (!this.standing.length) {
      this.over = true
      this.banner = { text: 'BATTERY FLAT', sub: 'GAME OVER', ticks: 9999 }
      return
    }
    this.followCamera()
  }

  /** Centre the one shared screen on the bots still rolling. */
  private followCamera() {
    const group = this.standing.length ? this.standing : this.heroes
    const xs = group.map((h) => h.x)
    const ys = group.map((h) => h.y)
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2
    this.camX = Math.max(0, Math.min(MW * T - W, cx - W / 2))
    this.camY = Math.max(0, Math.min(MH * T - VIEW_H, cy - VIEW_H / 2))
  }

  /** Would a bot at (x, y) still share the screen with its rolling partners? */
  private onLeash(hero: Hero, x: number, y: number): boolean {
    return this.standing.every((o) => {
      if (o === hero) return true
      const dx = Math.abs(o.x - x)
      const dy = Math.abs(o.y - y)
      if (dx <= LEASH_X && dy <= LEASH_Y) return true
      // Already too far apart (a partner was revived out past the leash):
      // any step that doesn't widen the gap is fine, so they can close it.
      return dx <= Math.abs(o.x - hero.x) && dy <= Math.abs(o.y - hero.y)
    })
  }

  /** A rolling bot next to a flat partner hands over some of its charge. */
  private shareCharge() {
    for (const flat of this.heroes) {
      if (!flat.flat) continue
      const helper = this.standing.find(
        (h) =>
          h.battery > SHARE_CHARGE + 10 &&
          Math.hypot(h.x - flat.x, h.y - flat.y) < 14,
      )
      if (!helper) continue
      helper.battery -= SHARE_CHARGE
      flat.battery = SHARE_CHARGE
      flat.flat = false
      this.floaters.push({
        x: flat.x,
        y: flat.y - 12,
        text: 'SHARED!',
        life: 50,
      })
      this.burst(flat.x, flat.y, 12, '#bbf7d0')
      this.sparkle(flat.x, flat.y, 12, [
        RAMPS.leaf[3],
        RAMPS.leaf[4],
        '#ffffff',
      ])
      this.sound.play('extra')
    }
  }

  private move(hero: Hero, input: InputFrame) {
    let dx = 0
    let dy = 0
    if (input.held.left) dx -= 1
    if (input.held.right) dx += 1
    if (input.held.up) dy -= 1
    if (input.held.down) dy += 1
    if (dx === 0 && dy === 0) return
    for (let f = 0; f < 8; f++) {
      if (FACE_X[f] === dx && FACE_Y[f] === dy) hero.facing = f
    }
    // As in the classic, holding fire plants the bot in place: the arrows only turn.
    if (input.held.a) return
    const len = Math.hypot(dx, dy)
    const speed = this.specOf(hero).speed
    const to = this.slide(
      hero.x,
      hero.y,
      (dx / len) * speed,
      (dy / len) * speed,
      HALF,
    )
    // Partners share one screen: neither can roll off it.
    if (this.onLeash(hero, to.x, hero.y)) hero.x = to.x
    if (this.onLeash(hero, hero.x, to.y)) hero.y = to.y
  }

  /** Where a body at (x, y) ends up moving by (vx, vy), one axis at a time. */
  private slide(x: number, y: number, vx: number, vy: number, half: number) {
    const nx = this.boxHits(x + vx, y, half) ? x : x + vx
    const ny = this.boxHits(nx, y + vy, half) ? y : y + vy
    return { x: nx, y: ny }
  }

  private boxHits(x: number, y: number, half: number): boolean {
    return (
      this.solid(x - half, y - half) ||
      this.solid(x + half, y - half) ||
      this.solid(x - half, y + half) ||
      this.solid(x + half, y + half)
    )
  }

  private fire(hero: Hero) {
    const spec = this.specOf(hero)
    const mine = this.sparks.filter((s) => s.owner === hero).length
    if (mine >= spec.maxSparks) return
    hero.fireCooldown = spec.cooldown
    const fx = FACE_X[hero.facing]!
    const fy = FACE_Y[hero.facing]!
    const len = Math.hypot(fx, fy)
    this.sparks.push({
      x: hero.x + fx * 6,
      y: hero.y + fy * 6,
      vx: (fx / len) * SPARK_SPEED,
      vy: (fy / len) * SPARK_SPEED,
      life: SPARK_LIFE,
      pierce: spec.power - 1,
      owner: hero,
    })
    this.sound.play('shoot')
  }

  /** A kindness pulse fixes every glitch on screen. */
  private pulse(hero: Hero) {
    if (hero.pulses <= 0) return
    hero.pulses--
    this.pulseFlash = 20
    this.pulseAt = { x: hero.x, y: hero.y }
    this.sparkle(hero.x, hero.y, 16, [RAMPS.pink[3], RAMPS.pink[4], '#ffffff'])
    const onScreen = this.glitches.filter((g) => this.visible(g))
    for (const g of onScreen) this.fixGlitch(g)
    const magic = this.specOf(hero).magic
    if (magic > 0)
      for (const gen of this.generators.filter((g) => this.visible(g)))
        this.damageGenerator(gen, magic)
    this.sound.play('extra')
  }

  private visible(t: Thing): boolean {
    return (
      t.x > this.camX - 8 &&
      t.x < this.camX + W + 8 &&
      t.y > this.camY - 8 &&
      t.y < this.camY + VIEW_H + 8
    )
  }

  private updateSparks() {
    for (const s of this.sparks) {
      s.x += s.vx
      s.y += s.vy
      s.life--
      if (this.solid(s.x, s.y)) s.life = 0
      if (s.life <= 0) continue
      const glitch = this.glitches.find(
        (g) => Math.hypot(g.x - s.x, g.y - s.y) < 7,
      )
      if (glitch) {
        this.fixGlitch(glitch)
        if (s.pierce-- <= 0) s.life = 0
        continue
      }
      const gen = this.generators.find(
        (g) => Math.abs(g.x - s.x) < 8 && Math.abs(g.y - s.y) < 8,
      )
      if (gen) {
        s.life = 0
        this.damageGenerator(gen, this.specOf(s.owner).power)
      }
    }
    this.sparks = this.sparks.filter((s) => s.life > 0)
  }

  private damageGenerator(gen: Generator, damage: number) {
    gen.hp -= damage
    gen.flash = 6
    this.sound.play('blip')
    if (gen.hp > 0) return
    this.generators = this.generators.filter((g) => g !== gen)
    this.addScore(GENERATOR_POINTS * this.level, gen.x, gen.y - 12)
    this.burst(gen.x, gen.y, 14, '#a5f3fc')
    this.sparkle(gen.x, gen.y, 14, [RAMPS.teal[3], RAMPS.teal[4], '#ffffff'])
    this.sound.play('boom')
  }

  private fixGlitch(g: Glitch) {
    this.glitches = this.glitches.filter((other) => other !== g)
    this.addScore(GLITCH_POINTS, g.x, g.y - 8)
    this.burst(g.x, g.y, 5, '#f0abfc')
    this.sparkle(g.x, g.y, 4, [RAMPS.pink[3], RAMPS.teal[3], '#ffffff'])
    this.sound.play('pop')
  }

  private updateGenerators() {
    const every = Math.round(levelCurve(this.level, GAUNTLET_CURVES.spawnEvery))
    const cap = Math.round(levelCurve(this.level, GAUNTLET_CURVES.glitchCap))
    for (const gen of this.generators) {
      if (gen.flash > 0) gen.flash--
      const near = this.standing.some(
        (h) => Math.hypot(gen.x - h.x, gen.y - h.y) <= GLITCH_RANGE,
      )
      if (!near) continue
      if (--gen.timer > 0) continue
      gen.timer = every
      if (this.glitches.length >= cap) continue
      // Glitches leak out of a free side of the generator.
      for (const [dx, dy] of [
        [0, 1],
        [1, 0],
        [0, -1],
        [-1, 0],
      ] as const) {
        const x = gen.x + dx * T
        const y = gen.y + dy * T
        if (!this.boxHits(x, y, HALF)) {
          this.glitches.push({ x, y, cling: 0, wobble: this.rng() * 6 })
          break
        }
      }
    }
  }

  private updateGlitches() {
    const speed = levelCurve(this.level, GAUNTLET_CURVES.glitchSpeed)
    for (const g of this.glitches) {
      // Each glitch goes for the nearest bot still rolling.
      const prey = this.nearestStanding(g)
      if (!prey) continue
      const dx = prey.x - g.x
      const dy = prey.y - g.y
      const d = Math.hypot(dx, dy)
      if (d > GLITCH_RANGE) continue
      if (d < 9) {
        // Clinging on: drains that bot's battery.
        if (--g.cling <= 0) {
          g.cling = CLING_TICKS
          prey.battery -= Math.round(
            levelCurve(this.level, GAUNTLET_CURVES.clingCost) *
              this.specOf(prey).armor,
          )
          this.sound.play('warn')
        }
        continue
      }
      const jitter = Math.sin(this.tick / 9 + g.wobble) * 0.3
      const to = this.slide(
        g.x,
        g.y,
        (dx / d) * speed + jitter,
        (dy / d) * speed - jitter,
        4,
      )
      g.x = to.x
      g.y = to.y
    }
  }

  private nearestStanding(t: Thing): Hero | undefined {
    let best: Hero | undefined
    let bestD = Infinity
    for (const h of this.standing) {
      const d = Math.hypot(h.x - t.x, h.y - t.y)
      if (d < bestD) {
        bestD = d
        best = h
      }
    }
    return best
  }

  private pickUp() {
    for (const item of [...this.items]) {
      const hero = this.standing.find(
        (h) => Math.hypot(item.x - h.x, item.y - h.y) <= 10,
      )
      if (!hero) continue
      this.items = this.items.filter((other) => other !== item)
      if (item.kind === 'snack') {
        hero.battery = Math.min(MAX_BATTERY, hero.battery + SNACK_CHARGE)
        this.sparkle(item.x, item.y, 8, [RAMPS.pink[3], RAMPS.gold[4]])
        this.floaters.push({
          x: item.x,
          y: item.y - 10,
          text: 'SNACK!',
          life: 40,
        })
        this.sound.play('pickup')
      } else if (item.kind === 'key') {
        this.keys++
        this.sparkle(item.x, item.y, 10)
        this.floaters.push({
          x: item.x,
          y: item.y - 10,
          text: 'KEY!',
          life: 40,
        })
        this.sound.play('pickup')
      } else if (item.kind === 'pulse') {
        hero.pulses++
        this.sparkle(item.x, item.y, 10, [RAMPS.pink[3], RAMPS.pink[4]])
        this.floaters.push({
          x: item.x,
          y: item.y - 10,
          text: 'PULSE!',
          life: 40,
        })
        this.sound.play('pickup')
      } else {
        this.rescued++
        this.addScore(RESCUE_POINTS * this.level, item.x, item.y - 10)
        this.burst(item.x, item.y, 12, '#fde68a')
        this.sparkle(item.x, item.y, 16)
        this.banner = { text: 'BOT RESCUED!', ticks: 60 }
        this.sound.play('extra')
      }
    }
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x: number, y: number) {
    if (this.demo) return
    this.score += points
    this.floaters.push({ x, y, text: String(points), life: 40 })
  }

  private burst(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.5 + this.rng() * 1.5
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 16 + Math.floor(this.rng() * 14),
        color,
      })
    }
  }

  /** A cosmetic sparkle burst (its own dice, never the game's). */
  private sparkle(
    x: number,
    y: number,
    count: number,
    colours: readonly string[] = [RAMPS.gold[4], RAMPS.gold[3], '#ffffff'],
  ) {
    this.fx.burst(x, y, this.fxRng, { count, colours })
  }

  private updateEffects() {
    this.fx.update()
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      p.life--
    }
    this.particles = this.particles.filter((p) => p.life > 0)
    for (const f of this.floaters) {
      f.y -= 0.4
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
  }

  // --- attract-mode pilot -----------------------------------------------------

  private demoInput(): InputFrame {
    const held = {
      up: false,
      down: false,
      left: false,
      right: false,
      a: false,
      b: false,
      start: false,
    }
    const frame: InputFrame = { held, pressed: { ...held } }
    if (this.selecting > 0) {
      frame.pressed.a = true
      return frame
    }
    const me = this.lead
    // Swamped: use a pulse (Sage, with pulses to spare, uses them sooner).
    const close = this.glitches.filter(
      (g) => Math.hypot(g.x - me.x, g.y - me.y) < 40,
    )
    if (close.length >= (me.pulses > 1 ? 3 : 5) && me.pulses > 0) {
      frame.pressed.b = true
      return frame
    }
    // Something to fix nearby: face it and spark it.
    const targets: Thing[] = [...this.glitches, ...this.generators]
    const aim = targets
      .filter(
        (t) => Math.hypot(t.x - me.x, t.y - me.y) < 90 && this.clearShot(t),
      )
      .sort(
        (a, b) =>
          Math.hypot(a.x - me.x, a.y - me.y) -
          Math.hypot(b.x - me.x, b.y - me.y),
      )[0]
    if (aim) {
      const ang = Math.atan2(aim.y - me.y, aim.x - me.x)
      const f = (Math.round((ang + Math.PI / 2) / (Math.PI / 4)) + 8) % 8
      if (FACE_X[f]! < 0) held.left = true
      if (FACE_X[f]! > 0) held.right = true
      if (FACE_Y[f]! < 0) held.up = true
      if (FACE_Y[f]! > 0) held.down = true
      held.a = true
      return frame
    }
    // Otherwise walk the path to the next goal: snacks when low, cages, generators, then the stairs.
    if (--this.pathTimer <= 0 || this.path.length === 0) {
      this.pathTimer = 30
      this.path = this.planPath()
    }
    const next = this.path[0]
    if (!next) return frame
    const nx = next.x * T + T / 2
    const ny = next.y * T + T / 2
    if (Math.abs(nx - me.x) < 3 && Math.abs(ny - me.y) < 3) {
      this.path.shift()
      return frame
    }
    if (nx < me.x - 1) held.left = true
    if (nx > me.x + 1) held.right = true
    if (ny < me.y - 1) held.up = true
    if (ny > me.y + 1) held.down = true
    return frame
  }

  /** A straight, unblocked spark line to the target along one of the eight facings. */
  private clearShot(t: Thing): boolean {
    // Replay the spark's exact flight along the nearest of the eight facings:
    // sampling the line instead can step over a wall corner the spark clips.
    const me = this.lead
    const ang = Math.atan2(t.y - me.y, t.x - me.x)
    const f = (Math.round((ang + Math.PI / 2) / (Math.PI / 4)) + 8) % 8
    const fx = FACE_X[f]!
    const fy = FACE_Y[f]!
    const len = Math.hypot(fx, fy)
    let x = me.x + fx * 6
    let y = me.y + fy * 6
    for (let i = 0; i < SPARK_LIFE; i++) {
      x += (fx / len) * SPARK_SPEED
      y += (fy / len) * SPARK_SPEED
      if (this.solid(x, y)) return false
      if (Math.abs(t.x - x) < 6 && Math.abs(t.y - y) < 6) return true
    }
    return false
  }

  private planPath(): Array<{ x: number; y: number }> {
    const sx = Math.floor(this.lead.x / T)
    const sy = Math.floor(this.lead.y / T)
    const dist = this.distances(sx, sy, this.keys > 0)
    const goals: Thing[] =
      this.lead.battery < 120
        ? this.items.filter((i) => i.kind === 'snack')
        : [...this.items.filter((i) => i.kind !== 'snack'), ...this.generators]
    const pool = goals.length ? goals : [this.exit]
    let best: Thing | null = null
    let bestD = Infinity
    for (const g of pool) {
      const d = dist[this.idx(Math.floor(g.x / T), Math.floor(g.y / T))]!
      if (d >= 0 && d < bestD) {
        bestD = d
        best = g
      }
    }
    if (!best) best = this.exit
    // Walk back from the goal along decreasing distance.
    let x = Math.floor(best.x / T)
    let y = Math.floor(best.y / T)
    const path: Array<{ x: number; y: number }> = []
    for (let guard = 0; guard < 400; guard++) {
      path.unshift({ x, y })
      const d = dist[this.idx(x, y)]!
      if (d <= 0) break
      let moved = false
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const) {
        if (dist[this.idx(x + dx, y + dy)] === d - 1) {
          x += dx
          y += dy
          moved = true
          break
        }
      }
      if (!moved) break
    }
    return path.slice(1)
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    if (this.selecting > 0) {
      this.renderSelect(g)
      return
    }
    g.fillStyle = FOG
    g.fillRect(0, 0, W, H)
    g.save()
    g.beginPath()
    g.rect(0, VIEW_Y, W, VIEW_H)
    g.clip()
    g.translate(-Math.round(this.camX), VIEW_Y - Math.round(this.camY))
    const x0 = Math.max(0, Math.floor(this.camX / T))
    const y0 = Math.max(0, Math.floor(this.camY / T))
    const x1 = Math.min(MW - 1, x0 + Math.ceil(W / T) + 1)
    const y1 = Math.min(MH - 1, y0 + Math.ceil(VIEW_H / T) + 1)
    floorLayer(
      g,
      this.floorKey(),
      (k) => paintFloor(k, this.walls, this.level, 0, 0, MW - 1, MH - 1),
      () => paintFloor(g, this.walls, this.level, x0, y0, x1, y1),
    )
    this.renderFog(g, x0, y0, x1, y1)
    this.renderLeds(g, x0, y0, x1, y1)
    this.renderDoors(g)
    this.renderExit(g)
    for (const item of this.items) this.renderItem(g, item)
    for (const gen of this.generators) this.renderGenerator(g, gen)
    for (const gl of this.glitches) this.renderGlitch(g, gl)
    this.renderSparks(g)
    this.renderHeroes(g)
    this.renderZaps(g)
    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, Math.min(1, p.life / 16))
      g.fillStyle = INK
      g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 3, 3)
      g.fillStyle = p.color
      g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 2, 2)
    }
    g.globalAlpha = 1
    this.fx.render(g)
    if (this.pulseFlash > 0) this.renderPulse(g)
    for (const f of this.floaters) {
      drawText(g, f.text, f.x, f.y, {
        align: 'center',
        color: RAMPS.gold[3],
        outline: INK,
      })
    }
    g.restore()
    vignette(g, W, H, 0.3)
    this.renderHud(g)
  }

  /** The floor plan's cache key: its rack layout (doors count as floor) and its theme. */
  private floorKey(): string {
    let h = 2166136261
    for (let i = 0; i < this.walls.length; i++)
      h = Math.imul(h ^ (this.walls[i] === RACK ? 1 : 0) ^ (i & 7), 16777619)
    return `kindness-gauntlet-floor-${this.level}-${h >>> 0}`
  }

  /**
   * Unexplored tiles stay dark, with the darkness feathering a few banded steps into the
   * explored floor along its edge.
   */
  private renderFog(
    g: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
  ) {
    const hidden = (tx: number, ty: number) =>
      tx >= 0 && ty >= 0 && tx < MW && ty < MH && !this.seen[this.idx(tx, ty)]
    g.fillStyle = FOG
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (hidden(tx, ty)) g.fillRect(tx * T, ty * T, T, T)
      }
    }
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (hidden(tx, ty)) continue
        const x = tx * T
        const y = ty * T
        const up = hidden(tx, ty - 1)
        const down = hidden(tx, ty + 1)
        const left = hidden(tx - 1, ty)
        const right = hidden(tx + 1, ty)
        if (!up && !down && !left && !right) continue
        FOG_BANDS.forEach((band, i) => {
          g.fillStyle = band
          const d = i * 2
          if (up) g.fillRect(x, y + d, T, 2)
          if (down) g.fillRect(x, y + T - 2 - d, T, 2)
          if (left) g.fillRect(x + d, y, 2, T)
          if (right) g.fillRect(x + T - 2 - d, y, 2, T)
        })
      }
    }
  }

  /** Blinking status LEDs on every rack front in view, each with its own rhythm. */
  private renderLeds(
    g: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
  ) {
    g.save()
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (!this.seen[this.idx(tx, ty)] || !rackFaces(this.walls, tx, ty))
          continue
        const h = tileHash(tx, ty, this.level + 3)
        const x = tx * T + 12
        const y = ty * T
        for (let i = 0; i < 2; i++) {
          const beat = Math.floor(this.tick / (10 + i * 7) + h * 40 + i * 3)
          if (beat % (3 + i) === 0) continue
          const colour = LED_COLOURS[Math.floor(h * 97 + i * 2) % 5]!
          const ly = y + 10 + i * 2
          g.globalCompositeOperation = 'lighter'
          g.fillStyle = rgba(colour, 0.28)
          g.fillRect(x - 1, ly - 1, 3, 3)
          g.globalCompositeOperation = 'source-over'
          g.fillStyle = colour
          g.fillRect(x, ly, 1, 1)
          g.fillStyle = '#ffffff'
          g.fillRect(x, ly, 1, 1)
          g.fillStyle = colour
          g.fillRect(x + 1, ly, 1, 1)
        }
      }
    }
    g.restore()
  }

  private renderDoors(g: CanvasRenderingContext2D) {
    const ready = this.keys > 0
    for (const door of this.doors) {
      if (door.open) continue
      for (const t of door.tiles) {
        if (!this.seen[t]) continue
        const x = (t % MW) * T
        const y = Math.floor(t / MW) * T
        drawSprite(g, DOOR_SPRITE, x, y, { anchor: 'topleft' })
        if (ready)
          glow(
            g,
            x + T / 2,
            y + 11,
            12,
            RAMPS.gold[3],
            0.25 + 0.15 * Math.sin(this.tick / 8),
          )
      }
    }
  }

  /** The stairs down: lit steps sinking into the dark, with motes of light rising. */
  private renderExit(g: CanvasRenderingContext2D) {
    const e = this.exit
    if (!this.seen[this.idx(Math.floor(e.x / T), Math.floor(e.y / T))]) return
    const x = Math.round(e.x)
    const y = Math.round(e.y)
    glow(g, x, y, 18 + Math.sin(this.tick / 10) * 3, RAMPS.teal[3], 0.4)
    bevel(g, x - 8, y - 8, 16, 16, RAMPS.steel, { depth: 1 })
    const ramp = RAMPS.teal
    for (let i = 0; i < 4; i++) {
      const left = x - 6 + i
      const w = 12 - i * 2
      const top = y - 6 + i * 3
      g.fillStyle = ramp[3 - i]!
      g.fillRect(left, top, w, 3)
      g.fillStyle = ramp[4 - i]!
      g.fillRect(left, top, w, 1)
      g.fillStyle = INK
      g.fillRect(left, top + 2, w, 1)
    }
    g.fillStyle = INK
    g.fillRect(x - 2, y + 6, 4, 1)
    g.save()
    g.globalCompositeOperation = 'lighter'
    for (let i = 0; i < 3; i++) {
      const t = ((this.tick + i * 23) % 60) / 60
      g.globalAlpha = 1 - t
      g.fillStyle = RAMPS.teal[4]
      g.fillRect(x - 4 + i * 4, Math.round(y + 2 - t * 18), 1, 2)
    }
    g.restore()
    if (Math.floor(this.tick / 15) % 2 === 0) {
      drawText(g, 'EXIT', x, y - 19, {
        align: 'center',
        color: RAMPS.teal[4],
        outline: INK,
      })
    }
  }

  private renderItem(g: CanvasRenderingContext2D, item: Item) {
    const { x, y } = item
    const bob = Math.round(Math.sin(this.tick / 10 + x * 0.1) * 1.2)
    if (item.kind === 'snack') {
      dropShadow(g, x, y + 5, 5, 1.5, 0.4)
      drawSprite(g, SNACK_SPRITE, x, y - 1 + bob)
    } else if (item.kind === 'key') {
      glow(g, x, y, 10 + Math.sin(this.tick / 7) * 2, RAMPS.gold[3], 0.45)
      dropShadow(g, x, y + 5, 5, 1.5, 0.4)
      drawSprite(g, KEY_SPRITE, x, y - 1 + bob)
      const glint = this.tick % 50
      if (glint < 8) {
        const gx = Math.round(x - 4 + glint)
        const gy = y - 3 + bob
        g.fillStyle = '#ffffff'
        g.fillRect(gx - 1, gy, 3, 1)
        g.fillRect(gx, gy - 1, 1, 3)
      }
    } else if (item.kind === 'pulse') {
      glow(g, x, y, 11 + Math.sin(this.tick / 6) * 2, RAMPS.pink[3], 0.5)
      dropShadow(g, x, y + 6, 4, 1.4, 0.4)
      drawSprite(g, HEART_SPRITE, x, y - 1 + bob)
    } else {
      // A trapped bot behind bars, waving for help.
      dropShadow(g, x, y + 8, 8, 2, 0.45)
      const wave = Math.floor(this.tick / 12 + x) % 2
      drawSprite(g, CAGED_SPRITES[wave]!, x, y + 1)
      drawSprite(g, CAGE_BARS, x, y)
    }
  }

  /** A glitch generator: glowing hotter as its next glitch is due, static on its screen. */
  private renderGenerator(g: CanvasRenderingContext2D, gen: Generator) {
    const x = Math.round(gen.x)
    const y = Math.round(gen.y)
    const due = 1 - Math.min(1, gen.timer / 90)
    const throb = 0.5 + 0.5 * Math.sin(this.tick / (8 - due * 5))
    glow(g, x, y, 16 + throb * 4, GLITCH_PALETTE.b, 0.22 + 0.3 * due * throb)
    dropShadow(g, x, y + 8, 8, 2, 0.45)
    drawSprite(g, gen.flash > 0 ? GENERATOR_FLASH : GENERATOR_SPRITE, x, y)
    if (gen.flash <= 0) {
      for (let i = 0; i < 6; i++) {
        g.fillStyle =
          (this.tick + i * 3) % 5 < 2 ? GLITCH_PALETTE.l : GLITCH_PALETTE.c
        g.fillRect(
          x - 5 + ((i * 7 + this.tick) % 9),
          y - 5 + ((i * 5) % 5),
          2,
          1,
        )
      }
      g.fillStyle = rgba(RAMPS.teal[3], 0.35)
      g.fillRect(x - 5, y - 5 + (Math.floor(this.tick / 3) % 6), 10, 1)
    }
    // The warning lamp on top blinks faster as a glitch gets ready.
    const lit = Math.floor(this.tick / (12 - due * 8)) % 2 === 0
    g.fillStyle = INK
    g.fillRect(x - 3, y - 10, 6, 3)
    g.fillStyle = lit ? RAMPS.ember[3] : RAMPS.ember[1]
    g.fillRect(x - 2, y - 9, 4, 2)
    g.fillStyle = lit ? RAMPS.ember[4] : RAMPS.ember[2]
    g.fillRect(x - 2, y - 9, 2, 1)
    if (lit) glow(g, x, y - 8, 7, RAMPS.ember[2], 0.6)
    const hp = gen.hp / gen.maxHp
    gauge(
      g,
      x - 7,
      y + 10,
      14,
      2,
      hp,
      hp > 0.5 ? RAMPS.leaf : hp > 0.25 ? RAMPS.gold : RAMPS.ember,
    )
  }

  private renderGlitch(g: CanvasRenderingContext2D, gl: Glitch) {
    const shift = (Math.floor(this.tick / 3 + gl.wobble) % 3) - 1
    const frame = Math.floor(this.tick / 8 + gl.wobble) % 2
    const x = Math.round(gl.x)
    const y = Math.round(gl.y)
    dropShadow(g, x, y + 5, 4, 1.4, 0.4)
    g.save()
    g.globalCompositeOperation = 'lighter'
    drawSprite(g, GLITCH_GHOSTS[frame]!, x - shift * 2, y, { alpha: 0.45 })
    g.restore()
    drawSprite(g, GLITCH_SPRITES[frame]!, x + shift, y)
  }

  /** Wrench sparks: a hot glow, a trail in the thrower's colour, and a twinkling star. */
  private renderSparks(g: CanvasRenderingContext2D) {
    const frame = Math.floor(this.tick / 3) % 2
    for (const s of this.sparks) {
      const big = this.specOf(s.owner).power > 1
      const trail = BOT_LOOKS[s.owner.cls].head[3]
      glow(g, s.x, s.y, big ? 10 : 7, RAMPS.gold[3], 0.55)
      g.fillStyle = rgba(trail, 0.7)
      g.fillRect(
        Math.round(s.x - s.vx * 1.5) - 1,
        Math.round(s.y - s.vy * 1.5) - 1,
        2,
        2,
      )
      g.fillStyle = rgba(trail, 0.35)
      g.fillRect(
        Math.round(s.x - s.vx * 2.6),
        Math.round(s.y - s.vy * 2.6),
        1,
        1,
      )
      drawSprite(g, (big ? BIG_SPARK_SPRITES : SPARK_SPRITES)[frame]!, s.x, s.y)
    }
  }

  private renderHeroes(g: CanvasRenderingContext2D) {
    const duo = this.heroes.length > 1
    for (const hero of [...this.heroes].sort((a, b) => a.y - b.y)) {
      const x = Math.round(hero.x)
      const y = Math.round(hero.y)
      if (duo) {
        g.strokeStyle = rgba(SEAT_COLORS[hero.seat]!, 0.8)
        g.lineWidth = 1
        g.beginPath()
        g.ellipse(x, y + 7, 7, 2.5, 0, 0, Math.PI * 2)
        g.stroke()
      }
      if (!hero.flat) glow(g, x, y, 14, BOT_LOOKS[hero.cls].head[3], 0.2)
      dropShadow(g, x, y + 7, 6, 2, 0.45)
      if (hero.flat) {
        // Flat: dimmed, with a blinking empty battery overhead.
        this.drawBot(g, hero.cls, x, y, 4, 0, 1, 0.45)
        if (Math.floor(this.tick / 15) % 2 === 0)
          drawSprite(g, FLAT_SPRITE, x, y - 15)
        continue
      }
      const step = Math.floor((this.strides[hero.seat] ?? 0) / 6) % 2
      const fx = FACE_X[hero.facing]!
      const fy = FACE_Y[hero.facing]!
      const wrench = () =>
        drawSprite(g, WRENCH_SPRITE, x + fx * 8, y + 1 + fy * 7)
      if (fy < 0) wrench()
      this.drawBot(g, hero.cls, x, y, hero.facing, step as 0 | 1)
      if (fy >= 0) wrench()
      if (hero.cls === 'sage') {
        // Sage's antenna tip glows, pink then gold.
        const pink = Math.floor(this.tick / 10) % 2 === 1
        const colour = pink ? RAMPS.pink[3] : RAMPS.gold[4]
        glow(g, x, y - 7, 6, colour, 0.6)
        g.fillStyle = colour
        g.fillRect(x - 1, y - 8, 1, 1)
      }
      // 1P/2P tags above their bots, 3P/4P below (they start a row lower).
      if (duo)
        drawText(g, `${hero.seat + 1}P`, x, y + (hero.seat >= 2 ? 11 : -19), {
          align: 'center',
          color: SEAT_COLORS[hero.seat],
          outline: INK,
        })
    }
  }

  /** A bot sprite for a facing (of eight) and walk step, its body centred on (x, y). */
  private drawBot(
    g: CanvasRenderingContext2D,
    cls: BotClass,
    x: number,
    y: number,
    facing: number,
    step: 0 | 1,
    scale = 1,
    alpha?: number,
  ) {
    const view: View = facing === 0 ? 'up' : facing === 4 ? 'down' : 'side'
    drawSprite(g, BOT_SPRITES[cls][view][step], x, y + 8 * scale, {
      anchor: 'feet',
      flipX: FACE_X[facing]! < 0,
      scale,
      alpha,
    })
  }

  /** A clinging glitch zaps the bot it's draining: a flickering arc between them. */
  private renderZaps(g: CanvasRenderingContext2D) {
    if (this.tick % 4 >= 3) return
    g.save()
    g.globalCompositeOperation = 'lighter'
    for (const gl of this.glitches) {
      const prey = this.nearestStanding(gl)
      if (!prey || Math.hypot(prey.x - gl.x, prey.y - gl.y) >= 9) continue
      const flick = (this.tick + Math.floor(gl.wobble * 5)) % 3
      const mx = (gl.x + prey.x) / 2 + (flick - 1) * 2
      const my = (gl.y + prey.y) / 2 - 3 + flick
      g.strokeStyle = rgba(GLITCH_PALETTE.l, 0.9)
      g.lineWidth = 1
      g.beginPath()
      g.moveTo(gl.x, gl.y)
      g.lineTo(mx, my)
      g.lineTo(prey.x, prey.y - 2)
      g.stroke()
      g.fillStyle = '#ffffff'
      g.fillRect(Math.round(mx), Math.round(my), 1, 1)
    }
    g.restore()
  }

  /** A kindness pulse: rings of pink light racing out from the bot that sent it. */
  private renderPulse(g: CanvasRenderingContext2D) {
    const t = 1 - this.pulseFlash / 20
    const { x, y } = this.pulseAt
    g.save()
    g.globalCompositeOperation = 'lighter'
    g.fillStyle = rgba(RAMPS.pink[2], 0.22 * (1 - t))
    g.fillRect(this.camX - 8, this.camY - 8, W + 16, VIEW_H + 16)
    for (let i = 0; i < 3; i++) {
      const r = 8 + (t * 260 - i * 26)
      if (r <= 2) continue
      g.strokeStyle = rgba(
        [RAMPS.pink[4], RAMPS.pink[3], RAMPS.gold[3]][i]!,
        0.75 * (1 - t),
      )
      g.lineWidth = 5 - i * 1.5
      g.beginPath()
      g.arc(x, y, r, 0, Math.PI * 2)
      g.stroke()
    }
    g.restore()
    glow(g, x, y, 30 * (1 - t) + 6, RAMPS.pink[4], 0.6 * (1 - t))
  }

  private renderSelect(g: CanvasRenderingContext2D) {
    const duo = this.heroes.length > 1
    cachedLayer(g, 'kindness-gauntlet-select', W, H, paintSelect)
    drawText(g, duo ? 'CHOOSE YOUR BOTS' : 'CHOOSE YOUR BOT', W / 2, 12, {
      scale: 2,
      align: 'center',
      color: RAMPS.gold[4],
      outline: INK,
      shadow: RAMPS.purple[1],
    })
    CLASS_ORDER.forEach((cls, i) => {
      const spec = BOT_CLASSES[cls]
      const look = BOT_LOOKS[cls]
      const cx = 44 + i * 77
      const here = this.heroes.filter((h) => h.choice === i)
      const lit = here.length > 0
      const frame = lit
        ? duo
          ? SEAT_COLORS[here[0]!.seat]!
          : look.head[3]
        : RAMPS.night[3]
      g.fillStyle = frame
      g.fillRect(cx - 36, 42, 72, 112)
      hudPanel(g, cx - 34, 44, 68, 108, lit ? RAMPS.purple : RAMPS.night)
      // A pedestal, and the bot on it (turning and stepping while chosen).
      bevel(g, cx - 18, 103, 36, 6, RAMPS.steel, { depth: 1 })
      if (lit) {
        glow(g, cx, 80, 34, look.body[3], 0.35)
        glow(g, cx, 104, 18, look.head[4], 0.3)
      }
      dropShadow(g, cx, 105, 15, 3, 0.5)
      const facing = lit ? 3 + (Math.floor(this.tick / 20) % 3) : 4
      const step = lit ? Math.floor(this.tick / 10) % 2 : 0
      this.drawBot(g, cls, cx, 81, facing, step as 0 | 1, 3, lit ? 1 : 0.6)
      if (cls === 'sage') {
        const tip =
          Math.floor(this.tick / 10) % 2 ? RAMPS.pink[3] : RAMPS.gold[4]
        glow(g, cx, 60, 10, tip, lit ? 0.6 : 0.3)
      }
      drawText(g, spec.name, cx, 120, {
        scale: 2,
        align: 'center',
        color: lit ? '#ffffff' : RAMPS.steel[2],
        outline: INK,
      })
      drawText(g, spec.role, cx, 140, {
        align: 'center',
        color: lit ? look.head[3] : RAMPS.steel[1],
        outline: INK,
      })
      // Whose cursor is on this card (1P/2P above it, 3P/4P below), and who
      // has locked it in.
      if (duo)
        for (const h of here) {
          const left = h.seat % 2 === 0
          drawText(
            g,
            h.picked ? `${h.seat + 1}P READY` : `${h.seat + 1}P`,
            left ? cx - 33 : cx + 33,
            h.seat < 2 ? 32 : 157,
            {
              align: left ? 'left' : 'right',
              color: SEAT_COLORS[h.seat],
              outline: INK,
            },
          )
        }
    })
    if (duo) {
      const step = this.heroes.length > 2 ? 9 : 10
      hudPanel(g, 8, 166, W - 16, 2 + this.heroes.length * step, RAMPS.night)
      for (const h of this.heroes) {
        const spec = BOT_CLASSES[CLASS_ORDER[h.choice]!]
        drawText(
          g,
          `${h.seat + 1}P ${spec.name}: ${spec.about[0]}`,
          W / 2,
          168 + h.seat * step,
          {
            align: 'center',
            color: SEAT_COLORS[h.seat],
            outline: INK,
          },
        )
      }
    } else {
      const spec = BOT_CLASSES[CLASS_ORDER[this.lead.choice]!]
      hudPanel(g, 40, 168, W - 80, 24, RAMPS.night)
      drawText(g, spec.about[0], W / 2, 172, {
        align: 'center',
        color: RAMPS.steel[4],
        outline: INK,
      })
      drawText(g, spec.about[1], W / 2, 182, {
        align: 'center',
        color: RAMPS.steel[4],
        outline: INK,
      })
    }
    if (Math.floor(this.tick / 20) % 2 === 0)
      drawText(
        g,
        duo
          ? 'EACH PICK A DIFFERENT BOT   A TO GO'
          : 'LEFT/RIGHT TO PICK   A TO GO',
        W / 2,
        206,
        { align: 'center', color: RAMPS.teal[3], outline: INK },
      )
    const secs = `${Math.ceil(this.selecting / 60)}`
    const sw = measureText(secs) + 10
    hudPanel(g, W / 2 - sw / 2, 219, sw, 12, RAMPS.night)
    drawText(g, secs, W / 2, 221, {
      align: 'center',
      color: RAMPS.steel[3],
      outline: INK,
    })
    vignette(g, W, H, 0.3)
  }

  // --- HUD ---------------------------------------------------------------------

  private renderHud(g: CanvasRenderingContext2D) {
    cachedLayer(g, 'kindness-gauntlet-hud', W, VIEW_Y, (k) => {
      bandedGradient(k, 0, 0, W, VIEW_Y, [RAMPS.night[2], RAMPS.night[0]], 2)
      k.fillStyle = INK
      k.fillRect(0, VIEW_Y - 1, W, 1)
    })
    hudPanel(g, 2, 1, 78, 14)
    drawText(g, String(this.score).padStart(6, '0'), 6, 1, {
      scale: 2,
      color: RAMPS.gold[4],
      shadow: INK,
    })
    // On the right: the high score over the floor number.
    const hi = `HI ${Math.max(this.hiScore, this.score)}`
    const floor = `FLOOR ${this.level}`
    const rightW = Math.max(measureText(hi), measureText(floor)) + 8
    const rightX = W - 2 - rightW
    hudPanel(g, rightX, 1, rightW, 14)
    drawText(g, hi, W - 6, 1, {
      align: 'right',
      color: RAMPS.pink[3],
      shadow: INK,
    })
    drawText(g, floor, W - 6, 8, {
      align: 'right',
      color: RAMPS.teal[3],
      shadow: INK,
    })
    // Beside it: bots rescued, and the team's keys while a door is locked.
    const infoX = rightX - 3 - 28
    hudPanel(g, infoX, 1, 28, 14)
    drawSprite(g, HUD_BOT, infoX + 6, 4)
    drawText(g, String(this.rescued), infoX + 11, 1, {
      color: RAMPS.gold[3],
      shadow: INK,
    })
    if (this.keys > 0 || this.doors.some((d) => !d.open)) {
      drawSprite(g, HUD_KEY, infoX + 6, 11)
      drawText(g, String(this.keys), infoX + 11, 8, {
        color: RAMPS.gold[4],
        shadow: INK,
      })
    }
    this.renderSeats(g, 84, infoX - 3)
    if (this.banner) {
      // A dimmed band behind the banner keeps it legible over the busy dungeon.
      const tall = this.banner.sub ? 34 : 22
      g.fillStyle = rgba(INK, 0.55)
      g.fillRect(0, 86, W, tall)
      g.fillStyle = rgba(RAMPS.purple[3], 0.6)
      g.fillRect(0, 86, W, 1)
      g.fillRect(0, 86 + tall - 1, W, 1)
      drawText(g, this.banner.text, W / 2, 90, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.purple[1],
      })
      if (this.banner.sub) {
        drawText(g, this.banner.sub, W / 2, 110, {
          align: 'center',
          color: RAMPS.gold[3],
          outline: INK,
        })
      }
    }
  }

  /**
   * A boxed panel per seated bot between `left` and `right`: whose it is (and which bot, when
   * there's room), its pulses, and its battery gauge (FLAT, blinking, once it runs out).
   */
  private renderSeats(
    g: CanvasRenderingContext2D,
    left: number,
    right: number,
  ) {
    const count = this.heroes.length
    const gap = 3
    const pw = Math.floor((right - left - gap * (count - 1)) / count)
    for (const hero of this.heroes) {
      const x = left + hero.seat * (pw + gap)
      const spec = this.specOf(hero)
      hudPanel(g, x, 1, pw, 14)
      const label =
        count === 1
          ? `${spec.name} BATTERY`
          : count === 2
            ? `${hero.seat + 1}P ${spec.name}`
            : `${hero.seat + 1}P`
      drawText(g, label, x + 4, 1, {
        color: count === 1 ? RAMPS.leaf[4] : SEAT_COLORS[hero.seat],
        shadow: INK,
      })
      const pulses = String(hero.pulses)
      drawText(g, pulses, x + pw - 4, 1, {
        align: 'right',
        color: RAMPS.pink[4],
        shadow: INK,
      })
      drawSprite(g, HUD_HEART, x + pw - 8 - measureText(pulses), 4)
      if (hero.flat) {
        if (Math.floor(this.tick / 15) % 2 === 0)
          drawText(g, 'FLAT', x + 4, 8, { color: RAMPS.ember[3], shadow: INK })
      } else {
        const frac = Math.max(0, hero.battery) / MAX_BATTERY
        gauge(
          g,
          x + 4,
          10,
          pw - 8,
          3,
          frac,
          frac > 0.4 ? RAMPS.leaf : frac > 0.2 ? RAMPS.gold : RAMPS.ember,
        )
      }
    }
  }
}

const kindnessGauntlet: ArcadeGameModule = {
  create: (options) => new KindnessGauntlet(options),
}

export const create = kindnessGauntlet.create
export default kindnessGauntlet
