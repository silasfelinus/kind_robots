/**
 * Pixel Hop: The Painted Planets (conductor kr-arcade t-084, slice 2). The
 * campaign as data: the planets, their twelve rounds, the picture boards and
 * the Gallery, the two bosses' phase tables, the rule demonstrations and the
 * save. Pure and deterministic; the cabinet (pixelHop.ts) plays it.
 */
import type { MusicLoop } from '../sound'
import {
  boardConnected,
  boardFromArt,
  cellKey,
  pyramidBoard,
  ringBoard,
  ringLoop,
  twinPeaksBoard,
  withDiscs,
  withSpecial,
} from './pixelHopBoards'
import type { HopBoard, HopCell, RuleId } from './pixelHopBoards'

/** A round's cube colours: lit and shaded sides, then the start, halfway and target tops. */
export type Scheme = {
  id: string
  left: string
  right: string
  start: string
  mid: string
  target: string
}

/** The foes a round may drop in ('purple' hatches into Boing, 'mint' is the freeze). */
export type FoeId =
  'gumball' | 'purple' | 'mint' | 'gremlin' | 'skitter' | 'snowball' | 'frost'

export type BossId = 'max' | 'rattle' | 'globe'

export type Picture = {
  id: string
  name: string
  /** Target colours, palette index 1 first. */
  palette: readonly string[]
}

export type Stage = {
  /** The planet's index in PLANETS. */
  planet: number
  /** Round within the planet, 1-6. */
  round: number
  name: string
  board: HopBoard
  rule: RuleId
  foes: readonly FoeId[]
  /** Difficulty step for the hop and drop curves (the old endless round number). */
  pace: number
  picture?: Picture
  boss?: BossId
}

export type Planet = {
  id: string
  name: string
  /** Up to 9 letters: the HUD's round label. */
  short: string
  /** Title-card lines. */
  card: readonly string[]
  schemes: readonly Scheme[]
  /** Backdrop dressing drawn behind the board. */
  sky: 'comet' | 'ring' | 'glacier'
  /** The planet's orb on the map: body and ring colours. */
  orb: { body: string; ring: string }
  music: MusicLoop
}

// --- planets --------------------------------------------------------------------------------

const CANDY_SCHEMES: readonly Scheme[] = [
  {
    id: 'candy-floss',
    left: '#9d2a6e',
    right: '#5b1446',
    start: '#f9a8d4',
    mid: '#fde68a',
    target: '#5eead4',
  },
  {
    id: 'candy-grape',
    left: '#4c2a99',
    right: '#24124f',
    start: '#b9a5ff',
    mid: '#f9a8d4',
    target: '#fde047',
  },
  {
    id: 'candy-cherry',
    left: '#a3172f',
    right: '#4a0d1a',
    start: '#fb7185',
    mid: '#fdba74',
    target: '#a3e635',
  },
]

const RONDO_SCHEMES: readonly Scheme[] = [
  {
    id: 'rondo-teal',
    left: '#0f6b73',
    right: '#0b3a4a',
    start: '#5eead4',
    mid: '#fde68a',
    target: '#ef4444',
  },
  {
    id: 'rondo-gold',
    left: '#a65f12',
    right: '#5a2a0c',
    start: '#fde68a',
    mid: '#fb923c',
    target: '#7c5cf0',
  },
  {
    id: 'rondo-red',
    left: '#a3172f',
    right: '#4a0d1a',
    start: '#fca5a5',
    mid: '#fef08a',
    target: '#38bdf8',
  },
]

const GLACIER_SCHEMES: readonly Scheme[] = [
  {
    id: 'glacier-aurora',
    left: '#155e75',
    right: '#164e63',
    start: '#7dd3fc',
    mid: '#a5f3fc',
    target: '#fef08a',
  },
  {
    id: 'glacier-lilac',
    left: '#4c1d95',
    right: '#312e81',
    start: '#c4b5fd',
    mid: '#67e8f9',
    target: '#fbcfe8',
  },
  {
    id: 'glacier-sapphire',
    left: '#1e40af',
    right: '#172554',
    start: '#93c5fd',
    mid: '#f0f9ff',
    target: '#bef264',
  },
]

const bars = (...b: string[]) => b.join(' ')

/** Candy Comet: a skippy major-key bounce in C, gumdrop plinks on top. */
const CANDY_MUSIC: MusicLoop = {
  bpm: 138,
  tracks: [
    {
      type: 'triangle',
      vol: 0.07,
      steps: bars(
        'C3 . G3 . E3 . G3 .',
        'A2 . E3 . C3 . E3 .',
        'F2 . C3 . A2 . C3 .',
        'G2 . D3 . B2 . D3 .',
        'C3 . G3 . E3 . G3 .',
        'A2 . E3 . C3 . E3 .',
        'F2 . C3 . G2 . D3 .',
        'C3 . G2 . C3 - - .',
      ),
    },
    {
      type: 'square',
      vol: 0.022,
      steps: bars(
        'E5 . G5 . C6 . G5 .',
        'A5 . G5 . E5 . C5 .',
        'F5 . A5 . C6 . A5 .',
        'B5 - G5 . D5 . G5 .',
        'E5 . G5 . C6 . E6 .',
        'D6 . C6 . A5 . E5 .',
        'F5 . A5 . B5 . D6 .',
        'C6 - - - . . . .',
      ),
    },
    {
      noise: true,
      vol: 0.012,
      steps: bars(...Array(8).fill('x . . . x . x .')),
    },
  ],
}

/** Rondo Ring: an oom-pah circus march in F, a calliope whistling the tune. */
const RONDO_MUSIC: MusicLoop = {
  bpm: 152,
  tracks: [
    {
      type: 'triangle',
      vol: 0.07,
      steps: bars(
        'F2 . C3 . F2 . C3 .',
        'C2 . G2 . C2 . G2 .',
        'D2 . A2 . D2 . A2 .',
        'A#1 . F2 . C2 . G2 .',
        'F2 . C3 . F2 . C3 .',
        'C2 . G2 . C2 . G2 .',
        'A#1 . F2 . C2 . E2 .',
        'F2 . C3 . F2 - - .',
      ),
    },
    {
      type: 'square',
      vol: 0.02,
      steps: bars(
        'A5 . C6 . F6 - C6 .',
        'G5 . E5 . C5 - . .',
        'D6 . C6 . A5 . F5 .',
        'A#5 . A5 . G5 - . .',
        'A5 . C6 . F6 . A6 .',
        'G6 . F6 . E6 . C6 .',
        'D6 . A#5 . G5 . E5 .',
        'F5 - - - . . . .',
      ),
    },
    {
      noise: true,
      vol: 0.013,
      steps: bars(...Array(8).fill('x . . . . . x .')),
    },
  ],
}

/** Glacier Moon: a drifting waltz beneath a shimmering northern sky. */
const GLACIER_MUSIC: MusicLoop = {
  bpm: 120,
  tracks: [
    {
      type: 'triangle',
      vol: 0.06,
      steps: bars(
        'D3 . A3 . F3 . A3 .',
        'G2 . D3 . B2 . D3 .',
        'A2 . E3 . C#3 . E3 .',
        'D3 . A2 . D3 - - .',
        'B2 . F#3 . D3 . F#3 .',
        'G2 . D3 . B2 . D3 .',
        'A2 . E3 . G2 . C#3 .',
        'D3 - A2 . D3 - - .',
      ),
    },
    {
      type: 'sine',
      vol: 0.025,
      steps: bars(
        'F5 - A5 . D6 - A5 .',
        'B5 - A5 . G5 - D5 .',
        'E5 - G5 . C#6 - E6 .',
        'D6 - A5 . F5 - - .',
        'D5 - F#5 . B5 - A5 .',
        'G5 - B5 . D6 - B5 .',
        'C#6 . B5 . A5 . E5 .',
        'F#5 - - - D5 - - .',
      ),
    },
    {
      noise: true,
      vol: 0.008,
      steps: bars(...Array(8).fill('x . . . . . x .')),
    },
  ],
}

/** The bosses share a tense tune, while each planet has its own overworld theme. */
export const BOSS_MUSIC: MusicLoop = {
  bpm: 150,
  tracks: [
    {
      type: 'sawtooth',
      vol: 0.026,
      steps: bars(
        'A2 A2 . A2 C3 . A2 .',
        'A2 A2 . A2 E3 . D3 .',
        'F2 F2 . F2 A2 . F2 .',
        'G2 G2 . G2 B2 . D3 .',
        'A2 A2 . A2 C3 . A2 .',
        'A2 A2 . A2 E3 . G3 .',
        'F2 F2 . F2 E2 . D2 .',
        'E2 - E2 . G#2 . B2 .',
      ),
    },
    {
      type: 'square',
      vol: 0.018,
      steps: bars(
        'E5 . . . A5 . C6 .',
        'B5 . A5 . G#5 . A5 .',
        'F5 . . . A5 . C6 .',
        'D6 - B5 . G5 . B5 .',
        'E5 . . . A5 . C6 .',
        'E6 . D6 . C6 . B5 .',
        'A5 . F5 . A5 . D6 .',
        'B5 - - - G#5 - - .',
      ),
    },
    {
      noise: true,
      vol: 0.016,
      steps: bars(...Array(8).fill('x . x . x . x x')),
    },
  ],
}

export const PLANETS: readonly Planet[] = [
  {
    id: 'candy-comet',
    name: 'CANDY COMET',
    short: 'CANDY',
    card: [
      'A COMET MADE OF GUMDROPS',
      'PAINT EVERY TOP',
      'LURE BOING OFF A DISC',
    ],
    schemes: CANDY_SCHEMES,
    sky: 'comet',
    orb: { body: '#f9a8d4', ring: '#5eead4' },
    music: CANDY_MUSIC,
  },
  {
    id: 'rondo-ring',
    name: 'RONDO RING',
    short: 'RONDO',
    card: [
      'A CIRCUS ROUND A RINGED WORLD',
      'SPRINGS LAUNCH YOU TWO CUBES',
      'SKITTER AND SCOOT RUN SIDEWAYS',
    ],
    schemes: RONDO_SCHEMES,
    sky: 'ring',
    orb: { body: '#5eead4', ring: '#fde68a' },
    music: RONDO_MUSIC,
  },
  {
    id: 'glacier-moon',
    name: 'GLACIER MOON',
    short: 'GLACIER',
    card: [
      'TWO SUMMITS IN THE AURORA',
      'ICE SLIDES PIP ONE MORE TILE',
      'FIND THE FOUR GLOWING CRACKS',
    ],
    schemes: GLACIER_SCHEMES,
    sky: 'glacier',
    orb: { body: '#bae6fd', ring: '#c4b5fd' },
    music: GLACIER_MUSIC,
  },
]

/** All six planets on the map; the ones still being painted show as question marks. */
export const MAP_PLANETS: ReadonlyArray<{ x: number; y: number }> = [
  { x: 44, y: 150 },
  { x: 96, y: 108 },
  { x: 150, y: 168 },
  { x: 204, y: 118 },
  { x: 158, y: 70 },
  { x: 96, y: 54 },
]

// --- pictures -------------------------------------------------------------------------------

export const PICTURES: readonly Picture[] = [
  {
    id: 'smiley',
    name: 'SUNNY SMILEY',
    palette: ['#fde047', '#4c2a99', '#f472b6'],
  },
  {
    id: 'flower',
    name: 'RING FLOWER',
    palette: ['#f472b6', '#facc15', '#4ade80'],
  },
  {
    id: 'snowflake',
    name: 'AURORA SNOWFLAKE',
    palette: ['#e0f2fe', '#67e8f9', '#c4b5fd'],
  },
]

const pictureById = (id: string) => PICTURES.find((p) => p.id === id)!

// --- boards ---------------------------------------------------------------------------------

/** A sunny smiley: yellow face, purple eyes and grin, pink cheeks. */
const SMILEY = boardFromArt('smiley', [
  '      1 1 1',
  ' o   1 1 1 1   o',
  '  A 1 2 1 2 1 B',
  '   3 1 1 1 1 3',
  '    2 1 1 1 2',
  '     1 2 2 1',
  '    C 1 1 1',
])

/** A flower: pink petals round a gold heart, a green stem and leaves. */
const FLOWER = boardFromArt('flower', [
  '      1 1 1',
  '   o 1 2 2 1 o',
  '    1 2 2 2 1',
  '   A 1 2 2 1 B',
  '      1 3 1',
  '       3 3',
  '    3 3 3 3 3',
  '     C 3 3 3',
])

/** Two little diamond islands and the zig-zag tightrope between them. */
const TIGHTROPE = boardFromArt('tightrope', [
  '  #           #',
  ' # #   o     # #',
  '# # # # # # # # #',
  ' # # # # # # # #',
  '  #     o     #',
])

/** The thin ring: springs halfway along each side, a disc inside and one out. */
const THIN_RING = withDiscs(
  withSpecial(ringBoard(5, 1), [
    [2, 2, 'spring'],
    [2, 0, 'spring'],
    [6, 4, 'spring'],
    [6, 2, 'spring'],
  ]),
  [
    { r: 2, c: 1 },
    { r: 3, c: 4 },
  ],
)

/** The thick ring: one cube's hole in the middle, holding a disc. */
const THICK_RING = withDiscs(ringBoard(5, 2), [
  { r: 4, c: 2 },
  { r: 1, c: -1 },
])

/** The thick ring with a spring on two opposite sides. */
const SPRING_RING = withSpecial(THICK_RING, [
  [2, 2, 'spring'],
  [6, 2, 'spring'],
])

/** Glacier Moon: slippery banks, twin peaks and a paintable snowflake. */
const ICE_SLOPE = withSpecial(pyramidBoard(7), [
  [2, 1, 'ice'],
  [3, 2, 'ice'],
  [4, 2, 'ice'],
  [5, 3, 'ice'],
])

const SNOWY_PEAKS = withSpecial(twinPeaksBoard(), [
  [2, 1, 'ice'],
  [2, 7, 'ice'],
  [3, 3, 'ice'],
  [3, 6, 'ice'],
])

const AURORA_CYCLE = withSpecial(pyramidBoard(8), [
  [2, 1, 'ice'],
  [4, 3, 'ice'],
  [5, 4, 'ice'],
])

const SNOWFLAKE: HopBoard = (() => {
  const board = pyramidBoard(7)
  const target: Record<string, number> = {}
  const pots: Record<string, number> = {}
  for (const cell of board.cells) {
    const key = cellKey(cell.r, cell.c)
    if (cell.r === 6 && [0, 3, 6].includes(cell.c)) {
      pots[key] = [0, 3, 6].indexOf(cell.c) + 1
    } else {
      target[key] =
        cell.r === 3 || cell.c === Math.floor(cell.r / 2)
          ? 2
          : (cell.r + cell.c) % 2 === 0
            ? 1
            : 3
    }
  }
  return { ...board, id: 'snowflake', target, pots }
})()

export const GLOBE_CRACKS: readonly HopCell[] = [
  { r: 1, c: 1 },
  { r: 3, c: 6 },
  { r: 5, c: 3 },
  { r: 2, c: 7 },
]

/** Ringmaster Rattle's circuit: the thick ring's outside edge. */
export const RATTLE_LOOP: readonly HopCell[] = ringLoop(5)

// --- the campaign ---------------------------------------------------------------------------

const CLASSIC: readonly FoeId[] = ['gumball', 'purple', 'mint', 'gremlin']

export const STAGES: readonly Stage[] = [
  {
    planet: 0,
    round: 1,
    name: 'GUMDROP HILL',
    board: pyramidBoard(7),
    rule: 'one',
    foes: ['gumball', 'mint'],
    pace: 1,
  },
  {
    planet: 0,
    round: 2,
    name: 'BOING HATCHERY',
    board: pyramidBoard(7),
    rule: 'one',
    foes: CLASSIC,
    pace: 2,
  },
  {
    planet: 0,
    round: 3,
    name: 'THE WIDE SWEET',
    board: pyramidBoard(8),
    rule: 'two',
    foes: ['gumball', 'purple', 'mint'],
    pace: 3,
  },
  {
    planet: 0,
    round: 4,
    name: 'SUGAR RUSH',
    board: pyramidBoard(7),
    rule: 'two',
    foes: CLASSIC,
    pace: 4,
  },
  {
    planet: 0,
    round: 5,
    name: 'PICTURE: SUNNY SMILEY',
    board: SMILEY,
    rule: 'picture',
    foes: ['gumball', 'mint'],
    pace: 3,
    picture: pictureById('smiley'),
  },
  {
    planet: 0,
    round: 6,
    name: 'GUMBALL MACHINE MAX',
    board: pyramidBoard(8),
    rule: 'one',
    foes: [],
    pace: 4,
    boss: 'max',
  },
  {
    planet: 1,
    round: 1,
    name: 'THE BIG RING',
    board: THIN_RING,
    rule: 'one',
    foes: ['gumball', 'mint'],
    pace: 4,
  },
  {
    planet: 1,
    round: 2,
    name: 'FLIP FLOP RING',
    board: THICK_RING,
    rule: 'flip',
    foes: ['gumball', 'purple', 'mint', 'skitter'],
    pace: 5,
  },
  {
    planet: 1,
    round: 3,
    name: 'THE TIGHTROPE',
    board: TIGHTROPE,
    rule: 'flip',
    foes: ['gumball', 'gremlin', 'mint', 'skitter'],
    pace: 6,
  },
  {
    planet: 1,
    round: 4,
    name: 'SPRING SPECTACULAR',
    board: SPRING_RING,
    rule: 'flip',
    foes: ['gumball', 'purple', 'mint', 'skitter'],
    pace: 5,
  },
  {
    planet: 1,
    round: 5,
    name: 'PICTURE: RING FLOWER',
    board: FLOWER,
    rule: 'picture',
    foes: ['gumball', 'mint', 'skitter'],
    pace: 5,
    picture: pictureById('flower'),
  },
  {
    planet: 1,
    round: 6,
    name: 'RINGMASTER RATTLE',
    board: THICK_RING,
    rule: 'flip',
    foes: ['mint'],
    pace: 6,
    boss: 'rattle',
  },
  {
    planet: 2,
    round: 1,
    name: 'ICE LANDING',
    board: ICE_SLOPE,
    rule: 'one',
    foes: ['gumball', 'snowball', 'mint'],
    pace: 6,
  },
  {
    planet: 2,
    round: 2,
    name: 'SLIPSTREAM',
    board: ICE_SLOPE,
    rule: 'two',
    foes: ['snowball', 'frost', 'mint'],
    pace: 7,
  },
  {
    planet: 2,
    round: 3,
    name: 'THE TWIN PEAKS',
    board: SNOWY_PEAKS,
    rule: 'one',
    foes: ['gumball', 'snowball', 'skitter'],
    pace: 7,
  },
  {
    planet: 2,
    round: 4,
    name: 'AURORA CYCLE',
    board: AURORA_CYCLE,
    rule: 'cycle',
    foes: ['snowball', 'frost', 'purple', 'mint'],
    pace: 8,
  },
  {
    planet: 2,
    round: 5,
    name: 'PICTURE: AURORA SNOWFLAKE',
    board: SNOWFLAKE,
    rule: 'picture',
    foes: ['frost', 'mint', 'snowball'],
    pace: 7,
    picture: pictureById('snowflake'),
  },
  {
    planet: 2,
    round: 6,
    name: 'THE SNOW GLOBE',
    board: SNOWY_PEAKS,
    rule: 'one',
    foes: ['snowball', 'frost', 'mint'],
    pace: 8,
    boss: 'globe',
  },
]

/** The first stage of each planet. */
export const PLANET_START: readonly number[] = PLANETS.map((_, p) =>
  STAGES.findIndex((s) => s.planet === p),
)

/** Whether this stage is the first time its rule appears: it opens with a demonstration. */
export function firstOfRule(index: number): boolean {
  const stage = STAGES[index]
  if (!stage || stage.boss) return false
  return !STAGES.slice(0, index).some((s) => !s.boss && s.rule === stage.rule)
}

/** The rule demonstration's caption, two lines. */
export const RULE_CAPTIONS: Record<RuleId, readonly [string, string]> = {
  one: ['ONE HOP PAINTS A TILE', 'PAINT EVERY TOP TO WIN'],
  two: ['TWO HOPS PAINT A TILE', 'THE FIRST ONLY GETS HALFWAY'],
  flip: ['DONE TILES FLIP BACK', 'IF YOU HOP ON THEM AGAIN'],
  both: ['TWO HOPS, AND DONE', 'TILES FLIP BACK'],
  cycle: ['EVERY HOP CYCLES', 'THE COLOUR. END ON THE GLOW'],
  picture: ['DIP YOUR BRUSH IN A POT', 'THEN PAINT ITS MATCHING TILES'],
}

// --- bosses ---------------------------------------------------------------------------------

export type MaxPhase = {
  /** The coin slot: its six neighbouring cubes are the ring to paint. */
  slot: HopCell
  /** How the ring takes paint this phase. */
  rule: 'one' | 'two'
  /** Gumballs per volley, ticks between them, and ticks between volleys. */
  volley: number
  gap: number
  rest: number
  pattern: 'line' | 'spiral'
}

/**
 * Gumball Machine Max on the wide pyramid: three sneezes, each spitting faster. His gumballs
 * smear gum over any ring cube they bounce on, so the ring has to be painted quicker than he
 * can gum it up.
 */
export const MAX_PHASES: readonly MaxPhase[] = [
  {
    slot: { r: 3, c: 1 },
    rule: 'one',
    volley: 3,
    gap: 16,
    rest: 190,
    pattern: 'line',
  },
  {
    slot: { r: 5, c: 3 },
    rule: 'two',
    volley: 4,
    gap: 12,
    rest: 160,
    pattern: 'line',
  },
  {
    slot: { r: 4, c: 2 },
    rule: 'two',
    volley: 6,
    gap: 9,
    rest: 140,
    pattern: 'spiral',
  },
]

/** Where a spiral volley's gumballs land, one after another round the top of the board. */
export const SPIRAL_ENTRIES: readonly HopCell[] = [
  { r: 1, c: 0 },
  { r: 2, c: 0 },
  { r: 3, c: 0 },
  { r: 3, c: 1 },
  { r: 3, c: 2 },
  { r: 3, c: 3 },
  { r: 2, c: 2 },
  { r: 1, c: 1 },
]

/** The ring of six cubes round a coin slot, as they sit on screen. */
export function coinRing(slot: HopCell): HopCell[] {
  const { r, c } = slot
  return [
    { r: r - 1, c: c - 1 },
    { r: r - 1, c },
    { r, c: c - 1 },
    { r, c: c + 1 },
    { r: r + 1, c },
    { r: r + 1, c: c + 1 },
  ]
}

export type RattlePhase = {
  /** Painted cubes in a row he must roll onto before he slips. */
  need: number
  /** Ticks between his rolls. */
  every: number
  /** +1 clockwise, -1 the other way. */
  dir: 1 | -1
  /** Skitter and Scoot join him. */
  twins: boolean
}

/** Ringmaster Rattle: slip him on wet paint, then hop on him. Three bonks. */
export const RATTLE_PHASES: readonly RattlePhase[] = [
  { need: 3, every: 26, dir: 1, twins: false },
  { need: 4, every: 22, dir: -1, twins: false },
  { need: 4, every: 19, dir: 1, twins: true },
]

/** Ticks Rattle stays dizzy after he slips. */
export const RATTLE_DIZZY = 200

// --- the save -------------------------------------------------------------------------------

/** A Pixel Hop save: the planet a run resumes at, and the Gallery it has painted. */
export type HopSave = {
  v: 1
  /** Planet the run resumes at (0 is a fresh start and is never offered). */
  planet: number
  score: number
  lives: number
  /** Pictures finished: 1 framed, 2 in a gold frame (painted without losing a hopper). */
  gallery: Record<string, 1 | 2>
  /** Planets whose golden brush is won (a gold-framed picture). */
  brushes: number[]
  /** The planets have all been cleared at least once. */
  cleared?: boolean
}

const MAX_SCORE = 3_000_000

/** A stored save, checked against this build; null when it cannot be used. */
export function readHopSave(raw: unknown): HopSave | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const s = raw as Record<string, unknown>
  const whole = (v: unknown, lo: number, hi: number) =>
    typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi
  if (s.v !== 1) return null
  if (!whole(s.planet, 0, PLANETS.length - 1)) return null
  if (!whole(s.score, 0, MAX_SCORE) || !whole(s.lives, 1, 30)) return null
  const gallery: Record<string, 1 | 2> = {}
  if (s.gallery && typeof s.gallery === 'object') {
    for (const [id, frame] of Object.entries(s.gallery)) {
      if (PICTURES.some((p) => p.id === id) && (frame === 1 || frame === 2))
        gallery[id] = frame
    }
  }
  const brushes = Array.isArray(s.brushes)
    ? [...new Set(s.brushes)].filter((b): b is number =>
        whole(b, 0, PLANETS.length - 1),
      )
    : []
  return {
    v: 1,
    planet: s.planet as number,
    score: s.score as number,
    lives: s.lives as number,
    gallery,
    brushes: brushes.sort((a, b) => a - b),
    ...(s.cleared === true ? { cleared: true } : {}),
  }
}

/** Every stage board is one piece, its pictures have a pot for every colour, and so on. */
export function auditStages(): string[] {
  const problems: string[] = []
  STAGES.forEach((stage, i) => {
    const b = stage.board
    if (!boardConnected(b)) problems.push(`stage ${i} board is in pieces`)
    if (stage.picture) {
      const wanted = new Set(Object.values(b.target ?? {}))
      const pots = new Set(Object.values(b.pots ?? {}))
      for (const colour of wanted)
        if (!pots.has(colour)) problems.push(`stage ${i} has no pot ${colour}`)
      if (Math.max(...wanted) > stage.picture.palette.length)
        problems.push(`stage ${i} paints past its palette`)
    }
    if (stage.boss === 'globe') {
      const known = new Set(b.cells.map((x) => cellKey(x.r, x.c)))
      for (const crack of GLOBE_CRACKS)
        if (!known.has(cellKey(crack.r, crack.c)))
          problems.push(`stage ${i} glacier crack is off the board`)
    }
    if (stage.boss === 'max') {
      const known = new Set(b.cells.map((x) => cellKey(x.r, x.c)))
      for (const phase of MAX_PHASES)
        for (const cell of [phase.slot, ...coinRing(phase.slot)])
          if (!known.has(cellKey(cell.r, cell.c)))
            problems.push(`stage ${i} coin ring is off the board`)
    }
  })
  return problems
}
