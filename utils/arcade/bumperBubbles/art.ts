// /utils/arcade/bumperBubbles/art.ts
//
// Fizzwick Tower's 16-bit art (conductor kr-arcade/t-059), built on utils/arcade/snes.ts:
// the four bubble robots, a sprite set per grump (with an angry ember twin), the
// treat ladder, Old Flat Fizz, the Fizz Tap, and each wing's theme: its sky, its
// backdrop and the way its blocks are painted. Everything here is cosmetic and rolls
// only backdropRng dice.

import {
  INK,
  RAMPS,
  backdropRng,
  bandedGradient,
  bevel,
  drawCloud,
  drawRidge,
  drawStars,
  glow,
  mix,
  pixelSprite,
  rgba,
  ridge,
  shadedOrb,
  starField,
} from '../snes'
import type { PixelSprite, Ramp } from '../snes'
import type { GrumpKind } from './grumps'
import { COLS, Cell, H, ROWS, TILE, TOP, W, cellAt } from './tower'
import type { Flavour, Floor } from './tower'

// --- the robots ---------------------------------------------------------------------------------

/** Each seat's robot colour: teal, pink, gold and purple. */
export const ROBOT_RAMPS: readonly Ramp[] = [
  RAMPS.teal,
  RAMPS.pink,
  RAMPS.gold,
  RAMPS.purple,
]

const ROBOT_HEAD = [
  '.....YY.....',
  '.h....y...t.',
  '.hh...y..tt.',
  '.hHHHHHHHHt.',
  'hHTTTTTTTTTt',
]
const ROBOT_EYES = ['hTwvveeveeTt', 'hTvvveeveeTt', 'hTvvvvvvvvTt']
const ROBOT_BODY = [
  'hTTTTTTTTTtt',
  '.dttttttttd.',
  '..hTTgGTTt..',
  '.hTTTggTTTt.',
  '.hTTTTTTTtt.',
  '..dttttttd..',
]

export type RobotFrames = {
  stand: PixelSprite
  run: readonly [PixelSprite, PixelSprite]
  jump: PixelSprite
  blow: PixelSprite
  life: PixelSprite
}

function robotFrames(ramp: Ramp, antenna: Ramp): RobotFrames {
  const palette = {
    Y: antenna[4],
    y: antenna[2],
    H: ramp[4],
    h: ramp[3],
    T: ramp[2],
    t: ramp[1],
    d: ramp[0],
    v: RAMPS.night[1],
    w: RAMPS.sky[3],
    e: '#e6fff8',
    g: RAMPS.gold[3],
    G: RAMPS.gold[4],
    P: RAMPS.cream[3],
    p: RAMPS.cream[2],
    q: RAMPS.cream[1],
  }
  const make = (eyes: readonly string[], feet: readonly string[]) =>
    pixelSprite([...ROBOT_HEAD, ...eyes, ...ROBOT_BODY, ...feet], palette)
  return {
    stand: make(ROBOT_EYES, ['..Pp...Pp...', '..PPq..PPq..']),
    run: [
      make(ROBOT_EYES, ['.Pp.....Pp..', 'PPq.....PPq.']),
      make(ROBOT_EYES, ['...Pp.Pp....', '...PPqPPq...']),
    ],
    jump: make(ROBOT_EYES, ['...Pp..Pp...', '....q...q...']),
    // Cheeks puffed, eyes squeezed shut, lips pursed round a bubble.
    blow: make(
      ['hTwvvvvvvvTt', 'hTvveevveeTt', 'hTvvvvvvpPTt'],
      ['..Pp...Pp...', '..PPq..PPq..'],
    ),
    life: pixelSprite(
      [
        '.h..Y..t.',
        '.hh.y.tt.',
        'hHHHHHHHt',
        'hTwvvvvTt',
        'hTvveveTt',
        'hTTTTTTtt',
        '.dtttttd.',
      ],
      palette,
    ),
  }
}

/** Antenna colour by flavour: the light on top says what your bubbles do. */
export const FLAVOUR_RAMPS: Record<Flavour, Ramp> = {
  classic: RAMPS.gold,
  gum: RAMPS.pink,
  float: RAMPS.sky,
  fizz: RAMPS.teal,
  frost: ['#1c3a5a', '#3a78a8', '#8ecae6', '#d4f1ff', '#ffffff'],
}

const robotCache = new Map<string, RobotFrames>()
export function robotSprites(seat: number, flavour: Flavour): RobotFrames {
  const key = `${seat}:${flavour}`
  let frames = robotCache.get(key)
  if (!frames) {
    frames = robotFrames(
      ROBOT_RAMPS[seat % ROBOT_RAMPS.length]!,
      FLAVOUR_RAMPS[flavour],
    )
    robotCache.set(key, frames)
  }
  return frames
}

// --- the grumps ---------------------------------------------------------------------------------

/** Cork, for the Big Cork and its little corks. */
export const CORK_RAMP: Ramp = [
  '#3a2410',
  '#7a4e24',
  '#b88048',
  '#e0b07a',
  '#f6dcb4',
]

/** Each grump's colour ramp (and the gems and pops it leaves). */
export const GRUMP_RAMPS: Record<GrumpKind, Ramp> = {
  waddler: ['#0e3b2a', '#17803f', '#4ade80', '#a7f3c0', '#effff4'],
  hopper: ['#5a3a08', '#b07a0c', '#facc15', '#fde98a', '#fffbe0'],
  dasher: ['#0c2a5a', '#1c6aa8', '#38bdf8', '#a5e4ff', '#effaff'],
  climber: ['#3d0f4a', '#8a2a9e', '#e879f9', '#f5c2fc', '#fff0ff'],
  bouncer: RAMPS.rust,
  sprout: RAMPS.leaf,
  puffer: RAMPS.water,
  diver: ['#0b3a3a', '#11706a', '#22b8a0', '#86ecd6', '#e6fff8'],
  comet: RAMPS.gold,
  tick: ['#241a3a', '#4a3a6e', '#7e6aa8', '#bcaee0', '#f2ecff'],
  corklet: CORK_RAMP,
  grumbler: ['#3a1a1a', '#7a3a2a', '#c0644a', '#ec9c7a', '#fcd8c4'],
  toaster: ['#4a2a10', '#8a5a24', '#c8904a', '#ecc488', '#fff0d0'],
  flinger: ['#2a3a5a', '#6a84a8', '#b8cce4', '#e4eefa', '#ffffff'],
  skater: ['#3a1a4a', '#6a2a8a', '#a050c8', '#d49af0', '#f6e0ff'],
  cog: RAMPS.steel,
  windup: ['#3a2a1a', '#6a5a3a', '#a0906a', '#d4c8a0', '#f6f0dc'],
  phantom: ['#1a1a3a', '#3a3a7a', '#7a7ac8', '#b8b8f0', '#f0f0ff'],
  mimic: ['#4a0f3a', '#9a2a7a', '#e060b8', '#f8a8e0', '#fff0fa'],
  thunder: ['#2a2e3a', '#4a5268', '#7a8498', '#b0b8c8', '#e8ecf4'],
  glider: ['#4a1a1a', '#a02a2a', '#e04a4a', '#f89a8a', '#ffe8e0'],
  jellet: ['#3a0a3a', '#8a1a8a', '#d040d0', '#f090f0', '#ffe0ff'],
}

type Shape = { body: readonly string[]; feet: readonly [string[], string[]] }

const FEET: readonly [string[], string[]] = [['..dd....dd..'], ['...dd..dd...']]

const SHAPES: Record<GrumpKind, Shape> = {
  // A sulky soda drop with a fizz curl on top.
  waddler: {
    body: [
      '.....LH.....',
      '....LB......',
      '...LBBBBb...',
      '..LBBBBBBb..',
      '.LHkkBBkkBb.',
      '.LBwkBBwkBb.',
      'LBBBBBBBBBbd',
      'LBBBkkkkBBbd',
      'bBBkBBBBkBbd',
      '.bBBBBBBBbd.',
      '..bbbbbbdd..',
    ],
    feet: FEET,
  },
  // Long ears, and a coil spring for legs.
  hopper: {
    body: [
      '.L........L.',
      '.LB......LB.',
      '..LB....Lb..',
      '..LBBBBBBb..',
      '.LHkkBBkkBb.',
      '.LBwkBBwkBb.',
      '.BBBBBBBBBb.',
      '.BBBkkkkBBb.',
      '..bBBBBBBb..',
      '...bbbbbb...',
    ],
    feet: [
      ['...nNNNn....', '....nnn.....', '...nNNNn....'],
      ['....nNn.....', '...nNNNn....', '....nnn.....'],
    ],
  },
  // Sleek, with a visor and sneakers.
  dasher: {
    body: [
      '...LLLLLL...',
      '..LHBBBBBBb.',
      '.LBBBBBBBBBb',
      '.Bkkkkkkkkkb',
      '.BkwkkkkwkBb',
      'LBBBBBBBBBbd',
      'BBBBkkkkBBbd',
      '.bBBBBBBBbd.',
      '..bbbbbbbd..',
    ],
    feet: [['.nNn....nNn.'], ['...nNnnNn...']],
  },
  // Long arms up, sucker hands ready.
  climber: {
    body: [
      'g..........g',
      'Lg........gL',
      '.L.LBBBBb.L.',
      '..LBBBBBBbb.',
      '.LHkkBBkkBb.',
      '.LBwkBBwkBb.',
      '.BBBBBBBBBb.',
      '.BBBkkkkBBb.',
      '..bBBBBBBb..',
      '...bbbbbb...',
    ],
    feet: FEET,
  },
  // A gumball with flapping candy wings; it never lands.
  bouncer: {
    body: [
      '....LLLL....',
      '..LHBBBBbb..',
      'n.LBBBBBBb.n',
      'NnLkkBBkkbnN',
      'NNBwkBBwkbNN',
      '.nBBBBBBBbn.',
      '..BBkkkkBb..',
      '..bBBBBBBb..',
      '...bbbbbb...',
    ],
    feet: [[], []],
  },
  // A leafy grump wearing the flower it hides as.
  sprout: {
    body: [
      '....pPp.....',
      '...PpYpP....',
      '....pPp.....',
      '.....g......',
      '...LBBBBb...',
      '..LHkkBkkb..',
      '.LBwkBBwkBb.',
      '.BBBBBBBBBb.',
      '.BBBkkkkBBb.',
      '..bBBBBBBb..',
      '...bbbbbb...',
    ],
    feet: FEET,
  },
  // A round little puffer, fins out, lips pursed.
  puffer: {
    body: [
      '....LLLL....',
      '..LHBBBBbb..',
      '.LBBBBBBBBb.',
      'LLkkBBBkkBbL',
      'LBwkBBBwkBbL',
      '.BBBBBBBBBb.',
      '.BBBBkkBBBb.',
      '..bBBBBBBb..',
      '...bbbbbb...',
    ],
    feet: FEET,
  },
  // Goggles on, flippers ready.
  diver: {
    body: [
      '...LLLLLL...',
      '..LHBBBBBb..',
      '.LkwkBBkwkb.',
      '.BkkkBBkkkb.',
      'LBBBBBBBBBbd',
      'BBBBkkkkBBbd',
      '.bBBBBBBBbd.',
      '..bbbbbbbd..',
    ],
    feet: [['.nnN....Nnn.'], ['..nNn..nNn..']],
  },
  // A grumpy star dragging its tail.
  comet: {
    body: [
      '.....H......',
      '....HLH.....',
      'NnnLBBBL....',
      '.NnBkBkBBL..',
      'NnnBwBwBBBL.',
      '.NnBBkkBBL..',
      'NnnLBBBL....',
      '....HLH.....',
      '.....H......',
    ],
    feet: [[], []],
  },
  // A little cork, sulking.
  corklet: {
    body: [
      '..LLLLLLL...',
      '.LHBdBBdBb..',
      '.LBBBBBBBb..',
      '.LkkBBBkkb..',
      '.BwkBBBwkb..',
      '.BBBBBBBBb..',
      '.BBBkkkBBb..',
      '.BdBBBBdBb..',
      '..bbbbbbb...',
    ],
    feet: FEET,
  },
  // A teapot grump, red nose and all.
  grumbler: {
    body: [
      '....LLLL....',
      '...LHBBBb...',
      '..LBBBBBBb..',
      '.LBkkBBkkBb.',
      '.BBwkBBwkBbn',
      '.BBBBRRBBBbn',
      'LBBBkkkkBBbn',
      '.bBBBBBBBbd.',
      '..bbbbbbdd..',
    ],
    feet: FEET,
  },
  // A grumpy slice of toast.
  toaster: {
    body: [
      '..LLLLLLLL..',
      '.LHBBBBBBBL.',
      'LBBBBBBBBBBL',
      'LBkkBBBBkkBL',
      'LBwkBBBBwkBL',
      'LBBBBBBBBBBL',
      'LBBBkkkkBBBL',
      'LBBBBBBBBBBL',
      '.LLLLLLLLLL.',
    ],
    feet: FEET,
  },
  // A snowy grump in mittens.
  flinger: {
    body: [
      '....LLLL....',
      '...LHHBBb...',
      '...LBkBkb...',
      '...LBBkBb...',
      '..LLBBBBbb..',
      '.nLBBBBBBbn.',
      'nnBBBBBBBBnn',
      '.LBBBkkBBBb.',
      '..bBBBBBBb..',
      '...bbbbbb...',
    ],
    feet: FEET,
  },
  // A skater in a red scarf.
  skater: {
    body: [
      '...LLLLL....',
      '..LHBBBBb...',
      '.LBkkBkkBb..',
      '.BBwkBwkBb..',
      '.BBBBBBBBb..',
      'RRRRRRRRRb..',
      '.BBBkkkBBb..',
      '..bBBBBBb...',
    ],
    feet: [['..nnn.nnn...'], ['.nnn..nnn...']],
  },
  // A sheet-ghost with a wavy hem; it turns solid for a moment.
  phantom: {
    body: [
      '...LLLLLL...',
      '..LHHHHHHb..',
      '.LHBBBBBBBb.',
      '.LBkkBBkkBb.',
      '.LBwkBBwkBb.',
      '.BBBBkkBBBb.',
      '.BBBBBBBBBb.',
      '.BBBBBBBBBb.',
      '.BBb.BBb.BBb',
    ],
    feet: [['..b...b...b.'], ['.b...b...b..']],
  },
  // A gem with eyes that open off-beat (its plain gem face is frame 0).
  mimic: {
    body: [
      '....LLLL....',
      '...LHHHHb...',
      '..LHBBBBBb..',
      '.LHBkBBkBBb.',
      '.LBBwBBwBBb.',
      '..LBBkkBBb..',
      '...bBBBBb...',
      '....bbbb....',
    ],
    feet: [['..dd....dd..'], ['...dd..dd...']],
  },
  // One of the Jelly Mould's pieces.
  jellet: {
    body: [
      '....LLLL....',
      '...LHHHHb...',
      '..LHBBBBBb..',
      '.LHBkBBkBBb.',
      '.LBBwBBwBBb.',
      'LBBBBBBBBBBb',
      'LBBBkkkkBBBb',
      'bBBBBBBBBBBb',
      '.bbbbbbbbbb.',
    ],
    feet: FEET,
  },
  // A small storm cloud with a cross little face.
  thunder: {
    body: [
      '....LLL.....',
      '..LLHHHLL...',
      '.LHBBBBBBL..',
      'LHBBkBBkBBb.',
      'LBBBwBBwBBb.',
      'LBBBBkkBBBb.',
      '.bBBBBBBBb..',
      '..bbbbbbb...',
    ],
    feet: [['............'], ['............']],
  },
  // Gliding down under a little umbrella.
  glider: {
    body: [
      '..LLLLLLLL..',
      '.LHHHHHHHHb.',
      'LHBBBBBBBBBb',
      '.....dd.....',
      '....LBBb....',
      '...LkBBkb...',
      '...LBwwBb...',
      '...bBBBBb...',
      '....bbbb....',
    ],
    feet: FEET,
  },
  // A cog with teeth all round.
  cog: {
    body: [
      '..L.LL.L....',
      '.LLBBBBLL...',
      '.LBkkBkkB...',
      'LBBwkBwkBL..',
      '.BBBBBBBB...',
      'LBBkkkkBBL..',
      '.LBBBBBBL...',
      '.L.bbbb.L...',
    ],
    feet: [['.d.d..d.d...'], ['d.d..d.d....']],
  },
  // A clockwork mouse with a key in its back.
  windup: {
    body: [
      '.......nNn..',
      '........n...',
      '..LLLLLLL...',
      '.LHBBBBBBb..',
      'LBkkBBBkkb..',
      'LBwkBBBwkb..',
      'BBBBBBBBBbd.',
      '.BBkkkkBBbd.',
      '..bbbbbbbd..',
    ],
    feet: [['..dd..dd....'], ['..d.d.d.d...']],
  },
  // A beetle peering down a telescope.
  tick: {
    body: [
      '.......nNN..',
      '.....LLnNNw.',
      '...LHBBnN...',
      '..LBBBBBBb..',
      '.LBkkBBBBBb.',
      '.BBwkBBBBBb.',
      '.BBBBBkkBBb.',
      '..bBBBBBBb..',
      '...bbbbbb...',
    ],
    feet: [['.d.d.d..d.d.'], ['d.d.d..d.d..']],
  },
}

/** The mimic's gem face, its eyes and mouth shut (rows 3 to 5 of its body). */
const MIMIC_PLAIN = ['.LHBBBBBBBb.', '.LBBBBBBBBb.', '..LBBBBBBb..']

/** The puddle puffer swollen up for its jet. */
const PUFFER_PUFFED = [
  '...LLLLLL...',
  '.LHBBBBBBbb.',
  'LBBBBBBBBBBb',
  'LBkkBBBBkkBb',
  'BBwkBBBBwkBb',
  'BBBBBBBBBBBb',
  'BBBBBkkBBBBb',
  '.bBBBkkBBBb.',
  '..bbbbbbbb..',
  '..dd....dd..',
]

/** The bouncer's wings down. */
const BOUNCER_DOWN = [
  '....LLLL....',
  '..LHBBBBbb..',
  '..LBBBBBBb..',
  'n.LkkBBkkb.n',
  'NnBwkBBwkbnN',
  'NNBBBBBBBbNN',
  '.nBBkkkkBbn.',
  '..bBBBBBBb..',
  '...bbbbbb...',
]

/** The sprout sneak hiding as a flower. */
const FLOWER = [
  '....pPp.....',
  '...PpYpP....',
  '..PpYYYpP...',
  '...PpYpP....',
  '....pPp.....',
  '.....g......',
  '...gLg......',
  '.....g.gL...',
  '.....g.g....',
  '....dddd....',
]

export type GrumpFrames = {
  walk: readonly [PixelSprite, PixelSprite]
  flower: PixelSprite | null
  /** The puffer's puffed-up wind-up. */
  puffed: PixelSprite | null
}

function grumpFrames(kind: GrumpKind, ramp: Ramp): GrumpFrames {
  const palette = {
    d: ramp[0],
    b: ramp[1],
    B: ramp[2],
    L: ramp[3],
    H: ramp[4],
    n: RAMPS.cream[2],
    N: RAMPS.cream[4],
    g: RAMPS.leaf[2],
    p: RAMPS.pink[2],
    P: RAMPS.pink[3],
    Y: RAMPS.gold[3],
    R: RAMPS.ember[2],
    w: '#ffffff',
    k: INK,
  }
  const shape = SHAPES[kind]
  const walk: [PixelSprite, PixelSprite] = [
    pixelSprite(
      // A mimic gem's first frame is the plain gem, eyes shut.
      kind === 'mimic'
        ? [
            ...shape.body.map((row, i) =>
              i === 3 || i === 4 || i === 5 ? MIMIC_PLAIN[i - 3]! : row,
            ),
            ...shape.feet[0],
          ]
        : [...shape.body, ...shape.feet[0]],
      palette,
    ),
    pixelSprite(
      kind === 'bouncer'
        ? BOUNCER_DOWN
        : kind === 'comet'
          ? shape.body.map((row) =>
              row.replace(/Nnn/g, '.Nn').replace(/\.Nn/g, 'nN.'),
            )
          : [...shape.body, ...shape.feet[1]],
      palette,
    ),
  ]
  return {
    walk,
    flower: kind === 'sprout' ? pixelSprite(FLOWER, palette) : null,
    puffed: kind === 'puffer' ? pixelSprite(PUFFER_PUFFED, palette) : null,
  }
}

export const GRUMP_FRAMES = Object.fromEntries(
  (Object.keys(SHAPES) as GrumpKind[]).map((k) => [
    k,
    grumpFrames(k, GRUMP_RAMPS[k]),
  ]),
) as Record<GrumpKind, GrumpFrames>

/** The same grumps steamed up and ember red. */
export const ANGRY_FRAMES = Object.fromEntries(
  (Object.keys(SHAPES) as GrumpKind[]).map((k) => [
    k,
    grumpFrames(k, RAMPS.ember),
  ]),
) as Record<GrumpKind, GrumpFrames>

// --- treats -------------------------------------------------------------------------------------

const TREAT_PALETTE = {
  R: '#ef4444',
  r: '#991b1b',
  H: '#fecaca',
  g: RAMPS.leaf[2],
  G: RAMPS.leaf[3],
  P: RAMPS.pink[2],
  p: RAMPS.pink[1],
  w: '#ffffff',
  W: RAMPS.cream[3],
  c: RAMPS.earth[2],
  C: RAMPS.earth[3],
  n: RAMPS.cream[1],
  y: RAMPS.gold[1],
  Y: RAMPS.gold[3],
}

/** The treat ladder's sprites, cheapest first: one for each rung up to the 64,000 soda. */
export const TREAT_SPRITES: readonly PixelSprite[] = [
  // Cherry fizz.
  [
    '......gg..',
    '.....g.g..',
    '....g...g.',
    '...g....g.',
    '.RRr...g..',
    'RHRRr.RRr.',
    'RRRRrRHRRr',
    '.rrr.RRRRr',
    '......rrr.',
  ],
  // A swirl lollipop.
  [
    '..PPPP....',
    '.PwPPpP...',
    'PPPwwPpP..',
    'PpPPPwPP..',
    '.PPpPPP...',
    '..PPPP....',
    '....n.....',
    '.....n....',
    '......n...',
  ],
  // A sprinkled donut.
  [
    '..pPPPPp..',
    '.pPwPPYPp.',
    'pPPP..PPwp',
    'pYP....PPp',
    'cpPP..PPpc',
    '.ccpPPpcc.',
    '..cccccc..',
  ],
  // A cupcake with a cherry.
  [
    '....R.....',
    '...wwww...',
    '..wwPwww..',
    '.wwwwwYww.',
    '.wwwwwwww.',
    '.cCcCcCcC.',
    '..cCcCcC..',
    '..cCcCcC..',
    '...cccc...',
  ],
  // A sundae in a glass.
  [
    '....R.....',
    '...pPp....',
    '..pPPPpw..',
    '.wwWwwWww.',
    '.WwwWwwWw.',
    '..gGGGGg..',
    '...gGGg...',
    '....gg....',
    '...gGGg...',
  ],
  // A layer cake with candles.
  [
    '..Y..Y..Y.',
    '..R..R..R.',
    '.PPPPPPPPP',
    '.wwwwwwwww',
    '.PpPpPpPpP',
    '.cccccccc.',
    '.wwwwwwwww',
    '.cccccccc.',
  ],
  // The golden soda.
  [
    '....YY....',
    '....yy....',
    '...yYYy...',
    '...yYYy...',
    '..yYwYYy..',
    '..yYwYYy..',
    '..yRRRRy..',
    '..yYYYYy..',
    '..yYYYYy..',
    '...yyyy...',
  ],
].map((rows) => pixelSprite(rows, TREAT_PALETTE))

// --- Old Flat Fizz, the tap ---------------------------------------------------------------------

export const FLAT_FIZZ = pixelSprite(
  [
    '......cCCc......',
    '.....oOOOOo.....',
    '....oOOOOOOo....',
    '...oOOOOOOOOo...',
    '..oOOwwOOwwOOo..',
    '..oOwkkOOkkwOo..',
    '..oOOOOOOOOOOo..',
    '..oOOOkkkkOOOo..',
    '..oOOkOOOOkOOo..',
    '..oOOOOOOOOOOo..',
    '...oOOOOOOOOOo..',
    '..oOOOOOOOOOo...',
    '.oOOoOOOoOOOo...',
    '.oo..oo..oo.....',
  ],
  {
    c: RAMPS.steel[2],
    C: RAMPS.steel[3],
    o: '#4a4060',
    O: '#8a7fa0',
    w: '#e8e0f0',
    k: INK,
  },
)

/** A soda fountain tap; `F` is filled with the flavour's colour. */
export function tapSprite(flavour: Flavour): PixelSprite {
  const ramp = FLAVOUR_RAMPS[flavour]
  return pixelSprite(
    [
      '..sSSs..',
      '.sSHSSs.',
      '..sSSs..',
      '...ss...',
      'sSSSSSSs',
      'sSFfFFSs',
      'sSFFFFSs',
      'sSFFfFSs',
      'sSSSSSSs',
      '...sS...',
      '..sSSs..',
      '...ss...',
    ],
    {
      s: RAMPS.steel[1],
      S: RAMPS.steel[3],
      H: '#ffffff',
      F: ramp[2],
      f: ramp[4],
    },
  )
}

// --- themes -------------------------------------------------------------------------------------

export type Theme = {
  id: string
  sky: readonly string[]
  /** Block colour, the floor's frosting, the walls. */
  block: Ramp
  frosting: Ramp
  wall: Ramp
  /** Gumdrop springs cycle through these. */
  drops: readonly Ramp[]
  far: { fill: string; rim: string }
  near: { fill: string; rim: string }
  stars: Ramp | null
  clouds: Ramp | null
  orb: { x: number; y: number; r: number; ramp: Ramp } | null
  /** Silhouettes along the far ridge. */
  props:
    'bottles' | 'lollipops' | 'kelp' | 'domes' | 'pots' | 'icicles' | 'gears'
  /** Light shafts slanting down through the backdrop. */
  rays: boolean
  /** A ring round the orb (a planet). */
  ring: boolean
  /** Rising backdrop bubbles. */
  decor: string
  /** Air-current streamers. */
  current: string
  /** HUD panels. */
  hud: Ramp
}

const MOON: Ramp = ['#3a3048', '#6a5a70', '#a898a0', '#d8cfc8', '#f4efe8']
const SUN: Ramp = ['#f0c890', '#f6dca8', '#fbecc4', '#fff6e0', '#ffffff']
const PLANET: Ramp = ['#2a0f3a', '#4a1f5a', '#7a3a7a', '#a8609a', '#d090c0']
const MOSS: Ramp = ['#1a3a1a', '#2e5e2a', '#4a8a3a', '#8ac46a', '#d0f0b0']
const ICE: Ramp = ['#2a4a6a', '#5a8ab0', '#9ccce8', '#d4f0fc', '#ffffff']
const SNOW: Ramp = ['#8aa8c4', '#b8cce0', '#dce8f4', '#f2f8fc', '#ffffff']
const MINT: Ramp = ['#0f3b33', '#1f7a62', '#34c79a', '#9ef0cf', '#eafff6']

export const THEMES: Record<string, Theme> = {
  // Candy night over the bottling lines, a cream moon over rows of bottles.
  bottling: {
    id: 'bottling',
    sky: [
      RAMPS.night[0],
      RAMPS.night[1],
      RAMPS.purple[0],
      mix(RAMPS.purple[1], RAMPS.pink[0], 0.6),
    ],
    block: RAMPS.pink,
    frosting: RAMPS.cream,
    wall: RAMPS.purple,
    drops: [RAMPS.pink, RAMPS.gold, RAMPS.teal],
    far: { fill: mix(RAMPS.purple[0], RAMPS.pink[0], 0.5), rim: RAMPS.pink[1] },
    near: { fill: RAMPS.night[1], rim: RAMPS.purple[1] },
    stars: RAMPS.purple,
    clouds: null,
    orb: { x: 196, y: 62, r: 15, ramp: MOON },
    props: 'bottles',
    rays: false,
    ring: false,
    decor: RAMPS.pink[3],
    current: RAMPS.sky[3],
    hud: RAMPS.purple,
  },
  // A pastel afternoon over gumdrop hills and lollipop trees.
  gardens: {
    id: 'gardens',
    sky: ['#3b6fd1', '#5b8fe6', '#8fb8f2', '#c9d8f5', '#f5d0e6'],
    block: MINT,
    frosting: RAMPS.pink,
    wall: RAMPS.leaf,
    drops: [RAMPS.pink, RAMPS.gold, RAMPS.rust, RAMPS.purple],
    far: { fill: '#7cc49a', rim: '#b6ecc4' },
    near: { fill: '#3d8a5c', rim: '#79c98f' },
    stars: null,
    clouds: ['#9ab4e0', '#c4d4f0', '#e4ecfa', '#f6f9ff', '#ffffff'],
    orb: { x: 206, y: 52, r: 11, ramp: SUN },
    props: 'lollipops',
    rays: false,
    ring: false,
    decor: '#ffffff',
    current: '#ffffff',
    hud: RAMPS.leaf,
  },
  // A flooded cellar: green-blue gloom, light shafts and kelp, mossy stone.
  lagoon: {
    id: 'lagoon',
    sky: ['#030d18', '#06213a', RAMPS.water[0], RAMPS.teal[0]],
    block: RAMPS.steel,
    frosting: MOSS,
    wall: ['#0e2630', '#1a4450', '#2a6670', '#5a9a98', '#a6d8d0'],
    drops: [RAMPS.teal, RAMPS.water, RAMPS.sky],
    far: { fill: mix(RAMPS.teal[0], RAMPS.water[0], 0.4), rim: '#14505a' },
    near: { fill: '#04161e', rim: RAMPS.teal[0] },
    stars: null,
    clouds: null,
    orb: null,
    props: 'kelp',
    rays: true,
    ring: false,
    decor: RAMPS.water[4],
    current: RAMPS.water[4],
    hud: ['#0a2a3a', '#13506a', '#2a8fa9', '#7cd3f2', '#e0fbff'],
  },
  // The observatory at night: a ringed planet, gold stars, brass and violet.
  observatory: {
    id: 'observatory',
    sky: [
      RAMPS.night[0],
      RAMPS.night[0],
      RAMPS.night[1],
      RAMPS.purple[0],
      RAMPS.night[2],
    ],
    block: RAMPS.purple,
    frosting: RAMPS.gold,
    wall: RAMPS.night,
    drops: [RAMPS.gold, RAMPS.purple, RAMPS.sky],
    far: { fill: '#1a0f40', rim: RAMPS.night[3] },
    near: { fill: RAMPS.night[0], rim: RAMPS.night[2] },
    stars: RAMPS.gold,
    clouds: null,
    orb: { x: 58, y: 60, r: 14, ramp: PLANET },
    props: 'domes',
    rays: false,
    ring: true,
    decor: RAMPS.purple[3],
    current: RAMPS.gold[3],
    hud: RAMPS.purple,
  },
  // A huge warm kitchen: copper pots hanging in the glow of the ovens.
  kitchen: {
    id: 'kitchen',
    sky: ['#1a0806', '#3a120a', '#5a1e10', '#7a2e14', '#9a4a1e'],
    block: ['#2a1a1a', '#5a2e24', '#8a4434', '#c06a50', '#ecaa8a'],
    frosting: RAMPS.cream,
    wall: RAMPS.earth,
    drops: [RAMPS.gold, RAMPS.rust, RAMPS.pink],
    far: { fill: '#2a0e08', rim: '#6a2a14' },
    near: { fill: '#1a0604', rim: '#4a1a0c' },
    stars: null,
    clouds: null,
    orb: null,
    props: 'pots',
    rays: false,
    ring: false,
    decor: RAMPS.cream[3],
    current: RAMPS.cream[4],
    hud: RAMPS.rust,
  },
  // The freezer: blue cold, icicles from the ceiling, snow on every ledge.
  freezer: {
    id: 'freezer',
    sky: ['#06142a', '#0c2a4a', '#164a6e', '#3a7aa0', '#8ac0dc'],
    block: ICE,
    frosting: SNOW,
    wall: RAMPS.steel,
    drops: [RAMPS.sky, RAMPS.teal, RAMPS.purple],
    far: { fill: '#163a5a', rim: '#4a7ea8' },
    near: { fill: '#0a1e34', rim: '#2a5070' },
    stars: RAMPS.sky,
    clouds: null,
    orb: null,
    props: 'icicles',
    rays: false,
    ring: false,
    decor: '#ffffff',
    current: '#ffffff',
    hud: RAMPS.sky,
  },
  // The Haunted Pantry: a dim, purple larder under a pale moon, copper pots on a rail.
  haunted: {
    id: 'haunted',
    sky: ['#07050f', '#100a22', '#1c1238', '#2c1c50', '#3e2a6a'],
    block: ['#1a1424', '#2e2442', '#4a3a6a', '#6a5a90', '#9a8ac0'],
    frosting: RAMPS.cream,
    wall: RAMPS.purple,
    drops: [RAMPS.purple, RAMPS.teal, RAMPS.pink],
    far: { fill: '#1a1030', rim: '#4a3a70' },
    near: { fill: '#0c0818', rim: '#2a1e48' },
    stars: RAMPS.purple,
    clouds: null,
    orb: { x: 64, y: 62, r: 14, ramp: MOON },
    props: 'pots',
    rays: true,
    ring: false,
    decor: RAMPS.cream[3],
    current: RAMPS.cream[4],
    hud: RAMPS.purple,
  },
  // The Storm Rooftop: slate cloud, cold light and rain.
  storm: {
    id: 'storm',
    sky: ['#0a0e1a', '#16203a', '#2a3a5c', '#4a5a80', '#6a7aa0'],
    block: RAMPS.steel,
    frosting: SNOW,
    wall: RAMPS.steel,
    drops: [RAMPS.sky, RAMPS.steel, RAMPS.teal],
    far: { fill: '#16203a', rim: '#4a5a80' },
    near: { fill: '#0a1020', rim: '#2a3a5c' },
    stars: null,
    clouds: ICE,
    orb: null,
    props: 'domes',
    rays: false,
    ring: false,
    decor: '#bcd0f0',
    current: '#ffffff',
    hud: RAMPS.steel,
  },
  // The Carbonator: the tower's heart, hot pink and gold, the bottles all fizzing.
  carbonator: {
    id: 'carbonator',
    sky: ['#1a0830', '#3a1050', '#6a1a70', '#a82a80', '#e04a90'],
    block: RAMPS.pink,
    frosting: RAMPS.cream,
    wall: RAMPS.purple,
    drops: [RAMPS.gold, RAMPS.teal, RAMPS.pink],
    far: { fill: '#4a1458', rim: '#c04a98' },
    near: { fill: '#26082e', rim: '#7a2a78' },
    stars: RAMPS.gold,
    clouds: null,
    orb: { x: 196, y: 62, r: 15, ramp: SUN },
    props: 'bottles',
    rays: true,
    ring: false,
    decor: '#ffffff',
    current: RAMPS.gold[4],
    hud: RAMPS.pink,
  },
  // The gearworks: brass, steel and turning wheels in the gloom.
  gearworks: {
    id: 'gearworks',
    sky: ['#0e0c0a', '#1e1a14', '#2e281e', '#3e3628', '#4e4432'],
    block: RAMPS.steel,
    frosting: RAMPS.gold,
    wall: RAMPS.earth,
    drops: [RAMPS.gold, RAMPS.rust, RAMPS.steel],
    far: { fill: '#2a2418', rim: '#5a4a2a' },
    near: { fill: '#141008', rim: '#3a301a' },
    stars: null,
    clouds: null,
    orb: null,
    props: 'gears',
    rays: false,
    ring: false,
    decor: RAMPS.gold[3],
    current: RAMPS.gold[4],
    hud: RAMPS.gold,
  },
}

const STARS = starField(47, 44, W, 160)
const FAR_RIDGE = ridge(53, W, 40)
const NEAR_RIDGE = ridge(59, W, 22, 3)
const CLOUDS = (() => {
  const rand = backdropRng(61)
  return Array.from({ length: 5 }, (_, i) => ({
    x: i * 64 + rand() * 30,
    y: 40 + rand() * 80,
    size: 7 + rand() * 5,
    speed: 0.04 + rand() * 0.05,
  }))
})()
/** Bubbles rising through the backdrop. */
const DECOR_BUBBLES = (() => {
  const rand = backdropRng(67)
  return Array.from({ length: 14 }, () => ({
    x: rand() * W,
    y: rand() * (H + 20),
    r: 1.5 + rand() * 3,
    speed: 0.12 + rand() * 0.25,
    phase: rand() * Math.PI * 2,
  }))
})()

/** The sky, its moon or sun, the prop silhouettes: painted once into a cached layer. */
export function paintSky(k: CanvasRenderingContext2D, theme: Theme) {
  bandedGradient(k, 0, 0, W, H, theme.sky, 4)
  if (theme.rays) {
    for (let i = 0; i < 5; i++) {
      const x = 20 + i * 52
      k.fillStyle = rgba(RAMPS.water[4], 0.05 + (i % 2) * 0.03)
      k.beginPath()
      k.moveTo(x, 0)
      k.lineTo(x + 18 + (i % 3) * 6, 0)
      k.lineTo(x + 70, H)
      k.lineTo(x + 34, H)
      k.closePath()
      k.fill()
    }
  }
  const orb = theme.orb
  if (orb) {
    glow(k, orb.x, orb.y, orb.r * 2.6, orb.ramp[3], 0.22)
    if (theme.ring) {
      k.strokeStyle = RAMPS.gold[0]
      k.lineWidth = 2
      k.beginPath()
      k.ellipse(orb.x, orb.y, orb.r * 1.8, orb.r * 0.45, -0.3, Math.PI, 0)
      k.stroke()
    }
    k.save()
    k.globalAlpha = orb.ramp === SUN ? 0.55 : 1
    shadedOrb(k, orb.x, orb.y, orb.r, orb.ramp, { outline: null })
    k.restore()
    if (theme.ring) {
      k.strokeStyle = RAMPS.gold[1]
      k.lineWidth = 2
      k.beginPath()
      k.ellipse(orb.x, orb.y, orb.r * 1.8, orb.r * 0.45, -0.3, 0, Math.PI)
      k.stroke()
    }
    if (orb.ramp === MOON) {
      k.fillStyle = rgba(MOON[1], 0.6)
      k.fillRect(orb.x + 3, orb.y + 2, 4, 3)
      k.fillRect(orb.x - 6, orb.y + 6, 3, 2)
    }
  }
  const rand = backdropRng(71 + theme.id.length)
  if (theme.props === 'pots') {
    // Copper pots and ladles hanging on a rail.
    k.fillStyle = rgba(INK, 0.6)
    k.fillRect(0, 48, W, 2)
    for (let x = 14; x < W; x += 26 + Math.floor(rand() * 14)) {
      const r = 6 + Math.floor(rand() * 5)
      const drop = 8 + Math.floor(rand() * 16)
      k.fillStyle = rgba(RAMPS.rust[1], 0.55)
      k.fillRect(x, 50, 1, drop)
      k.beginPath()
      k.arc(x, 50 + drop + r, r, 0, Math.PI)
      k.fill()
      k.fillRect(x - r, 50 + drop + r - 2, r * 2, 2)
      k.fillStyle = rgba(RAMPS.gold[2], 0.35)
      k.fillRect(x - r + 2, 50 + drop + r + 1, 2, 2)
    }
    return
  }
  if (theme.props === 'icicles') {
    // Icicles hanging from the freezer's roof, and frost on the far wall.
    for (let x = 4; x < W; x += 6 + Math.floor(rand() * 8)) {
      const h = 6 + Math.floor(rand() * 22)
      k.fillStyle = rgba('#dff4ff', 0.35)
      k.beginPath()
      k.moveTo(x, 24)
      k.lineTo(x + 4, 24)
      k.lineTo(x + 2, 24 + h)
      k.closePath()
      k.fill()
    }
    for (let i = 0; i < 40; i++) {
      k.fillStyle = rgba('#ffffff', 0.12 + rand() * 0.2)
      k.fillRect(Math.floor(rand() * W), 60 + Math.floor(rand() * 120), 1, 1)
    }
    return
  }
  if (theme.props === 'gears') {
    // Great gears turning in the dark (painted still, rimmed in brass).
    for (const [x, y, r] of [
      [40, 80, 30],
      [92, 130, 22],
      [196, 70, 36],
      [226, 160, 18],
    ] as const) {
      k.fillStyle = rgba(RAMPS.earth[1], 0.55)
      k.beginPath()
      k.arc(x, y, r, 0, Math.PI * 2)
      k.fill()
      for (let a = 0; a < 12; a++) {
        const ang = (a / 12) * Math.PI * 2
        k.fillRect(
          Math.round(x + Math.cos(ang) * (r + 2)) - 2,
          Math.round(y + Math.sin(ang) * (r + 2)) - 2,
          5,
          5,
        )
      }
      k.fillStyle = rgba(INK, 0.6)
      k.beginPath()
      k.arc(x, y, r * 0.35, 0, Math.PI * 2)
      k.fill()
      k.strokeStyle = rgba(RAMPS.gold[1], 0.4)
      k.lineWidth = 1
      k.beginPath()
      k.arc(x, y, r - 3, 0, Math.PI * 2)
      k.stroke()
    }
    return
  }
  if (theme.props === 'kelp') {
    // Kelp swaying up from the cellar floor (painted still; the water moves in front).
    for (let x = 8; x < W; x += 20 + Math.floor(rand() * 16)) {
      const h = 40 + Math.floor(rand() * 60)
      k.strokeStyle = rgba(RAMPS.leaf[1], 0.45)
      k.lineWidth = 3
      k.beginPath()
      k.moveTo(x, H)
      for (let y = H; y > H - h; y -= 6)
        k.lineTo(x + Math.sin(y / 9 + x) * 4, y)
      k.stroke()
    }
    return
  }
  if (theme.props === 'domes') {
    // Observatory domes on the far ridge, their slits open to the stars.
    for (let x = 24; x < W; x += 64 + Math.floor(rand() * 30)) {
      const r = 12 + Math.floor(rand() * 8)
      const base = 176
      k.fillStyle = rgba(RAMPS.night[2], 0.95)
      k.fillRect(x - r, base, r * 2, 24)
      k.beginPath()
      k.arc(x, base, r, Math.PI, 0)
      k.fill()
      k.strokeStyle = rgba(RAMPS.night[4], 0.8)
      k.lineWidth = 1
      k.beginPath()
      k.arc(x, base, r, Math.PI, 0)
      k.stroke()
      // The slit, open to the stars, and a telescope peeking out.
      k.fillStyle = rgba(RAMPS.night[0], 0.95)
      k.fillRect(x - 2, base - r + 2, 4, r - 2)
      k.fillStyle = rgba(RAMPS.gold[2], 0.7)
      k.fillRect(x - 1, base - r - 3, 2, 6)
    }
    return
  }
  if (theme.props === 'bottles') {
    // Bottles marching along a conveyor high in the hall.
    k.fillStyle = rgba(INK, 0.55)
    k.fillRect(0, 150, W, 3)
    for (let x = 6; x < W; x += 18 + Math.floor(rand() * 6)) {
      const h = 14 + Math.floor(rand() * 8)
      k.fillStyle = rgba(theme.far.fill, 0.9)
      k.fillRect(x, 150 - h, 8, h)
      k.fillRect(x + 2, 150 - h - 5, 4, 5)
      k.fillStyle = rgba(theme.far.rim, 0.8)
      k.fillRect(x + 2, 150 - h - 6, 4, 1)
      k.fillRect(x + 1, 150 - h + 3, 1, h - 5)
    }
  } else {
    // Lollipop trees on the far hills: flat, hazy swirls, so nothing reads as a bubble or a treat.
    for (let x = 12; x < W; x += 30 + Math.floor(rand() * 14)) {
      const h = 18 + Math.floor(rand() * 14)
      const top = 196 - h
      const colour = mix(
        [RAMPS.pink[2], RAMPS.gold[2], RAMPS.purple[2]][
          Math.floor(rand() * 3)
        ]!,
        theme.sky[2]!,
        0.55,
      )
      k.fillStyle = rgba('#ffffff', 0.35)
      k.fillRect(x, top, 1, h)
      k.fillStyle = colour
      k.beginPath()
      k.arc(x + 0.5, top, 5, 0, Math.PI * 2)
      k.fill()
      k.strokeStyle = rgba('#ffffff', 0.45)
      k.lineWidth = 1
      k.beginPath()
      k.arc(x + 0.5, top, 2.5, 0, Math.PI * 1.5)
      k.stroke()
    }
  }
}

/** The moving backdrop: stars, clouds, two ridges and rising bubbles. */
export function paintBackdrop(
  g: CanvasRenderingContext2D,
  theme: Theme,
  tick: number,
) {
  if (theme.stars) drawStars(g, STARS, tick, theme.stars)
  if (theme.clouds) {
    for (const c of CLOUDS) {
      const x = ((c.x + tick * c.speed) % (W + 60)) - 30
      drawCloud(g, x, c.y, c.size, theme.clouds)
    }
  }
  drawRidge(g, FAR_RIDGE, {
    base: 200,
    bottom: H,
    width: W,
    offset: tick * 0.04,
    fill: theme.far.fill,
    rim: theme.far.rim,
  })
  drawRidge(g, NEAR_RIDGE, {
    base: 222,
    bottom: H,
    width: W,
    offset: tick * 0.11,
    step: 3,
    fill: theme.near.fill,
    rim: theme.near.rim,
  })
  g.lineWidth = 1
  for (const d of DECOR_BUBBLES) {
    const y = ((((d.y - tick * d.speed) % (H + 20)) + H + 20) % (H + 20)) - 10
    const x = d.x + Math.sin(tick / 30 + d.phase) * 3
    g.strokeStyle = rgba(theme.decor, 0.3)
    g.beginPath()
    g.arc(x, y, d.r, 0, Math.PI * 2)
    g.stroke()
  }
}

function deeper(ramp: Ramp): Ramp {
  return [
    ramp[0],
    mix(ramp[0], ramp[1], 0.5),
    ramp[1],
    mix(ramp[1], ramp[2], 0.6),
    ramp[3],
  ]
}

/** A gumdrop spring two tiles wide: a sugared dome swelling up out of the block row. */
function paintGumdrop(
  k: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  ramp: Ramp,
) {
  const top = y - 3
  const h = TILE + 3
  k.fillStyle = INK
  k.fillRect(x + 2, top - 1, w - 4, 1)
  k.fillRect(x, top + 1, w, h - 1)
  k.fillRect(x + 1, top, w - 2, 1)
  k.fillStyle = ramp[1]
  k.fillRect(x + 1, top + 1, w - 2, h - 2)
  k.fillStyle = ramp[2]
  k.fillRect(x + 1, top + 1, w - 2, h - 4)
  k.fillRect(x + 2, top, w - 4, 1)
  k.fillStyle = ramp[3]
  k.fillRect(x + 2, top + 1, Math.max(2, w / 2 - 2), 3)
  k.fillStyle = ramp[4]
  k.fillRect(x + 3, top + 1, 2, 1)
  // Sugar crystals.
  k.fillStyle = rgba('#ffffff', 0.8)
  for (let i = 5; i < w - 2; i += 4) {
    k.fillRect(x + i, top + 3 + (i % 3), 1, 1)
    k.fillRect(x + i - 2, top + 6 + (i % 2), 1, 1)
  }
}

/**
 * A floor's blocks: checkered bevelled candy tiles, frosted wherever something can stand,
 * dripping down the faces; pillar walls; gumdrop springs. Painted once per floor.
 */
export function paintTiles(
  k: CanvasRenderingContext2D,
  f: Floor,
  theme: Theme,
  seed: number,
) {
  const rand = backdropRng(seed)
  const dark = deeper(theme.block)
  const wallDark = deeper(theme.wall)
  // Shadows first, so every block casts one on the backdrop.
  k.fillStyle = rgba(INK, 0.35)
  for (let r = 0; r < ROWS; r++)
    for (let c = 2; c < COLS - 2; c++)
      if (cellAt(f, c, r) === Cell.Block)
        k.fillRect(c * TILE + 3, TOP + r * TILE + 3, TILE, TILE)
  // The walls.
  for (let r = 0; r < ROWS; r++) {
    const y = TOP + r * TILE
    for (const x of [0, W - 2 * TILE]) {
      bevel(k, x, y, 2 * TILE, TILE, r % 2 ? wallDark : theme.wall, {
        depth: 1,
        outline: null,
      })
      k.fillStyle = rgba(INK, 0.5)
      k.fillRect(x + (r % 2 ? 4 : 11), y, 1, TILE)
    }
  }
  k.fillStyle = INK
  k.fillRect(2 * TILE - 1, TOP, 1, H - TOP)
  k.fillRect(W - 2 * TILE, TOP, 1, H - TOP)
  // The blocks.
  for (let r = 0; r < ROWS; r++) {
    const y = TOP + r * TILE
    for (let c = 2; c < COLS - 2; c++) {
      const cell = cellAt(f, c, r)
      const x = c * TILE
      if (cell === Cell.Spring) {
        // One gumdrop per run of springs (painted from its first tile).
        if (cellAt(f, c - 1, r) === Cell.Spring) continue
        let end = c
        while (cellAt(f, end + 1, r) === Cell.Spring && end < COLS - 3) end++
        paintGumdrop(
          k,
          x,
          y,
          (end - c + 1) * TILE,
          theme.drops[(c + r) % theme.drops.length]!,
        )
        continue
      }
      if (cell === Cell.Door || cell === Cell.DoorOpen) continue
      if (
        cell === Cell.Hot ||
        cell === Cell.ConveyorLeft ||
        cell === Cell.ConveyorRight
      ) {
        // An iron hot plate, or a belt on its rollers (the glow and the belt move live).
        bevel(k, x, y, TILE, TILE, RAMPS.steel, { depth: 1, outline: INK })
        k.fillStyle = cell === Cell.Hot ? '#3a1a14' : '#1a1a22'
        k.fillRect(x, y, TILE, 3)
        continue
      }
      if (cell === Cell.Ice) {
        bevel(k, x, y, TILE, TILE, ICE, { depth: 1, outline: INK })
        k.fillStyle = rgba('#ffffff', 0.8)
        k.fillRect(x + 1, y + 1, 3, 1)
        k.fillRect(x + 1, y + 2, 1, 2)
        continue
      }
      if (cell !== Cell.Block) continue
      const tile = (c + r) % 2 ? dark : theme.block
      k.fillStyle = INK
      k.fillRect(x - (cellAt(f, c - 1, r) ? 0 : 1), y - 1, TILE + 1, TILE + 2)
      bevel(k, x, y, TILE, TILE, tile, { depth: 1, outline: null })
      if (rand() < 0.4) {
        k.fillStyle = tile[4]
        k.fillRect(x + 2 + Math.floor(rand() * 4), y + 3, 1, 1)
      }
      if (cellAt(f, c, r - 1) === Cell.Air && r > 0) {
        // Frosting on every top you can stand on, dripping down the face.
        k.fillStyle = theme.frosting[4]
        k.fillRect(x, y, TILE, 1)
        k.fillStyle = theme.frosting[3]
        k.fillRect(x, y + 1, TILE, 1)
        for (let i = 0; i < TILE; i++) {
          if (rand() < 0.16) {
            const len = 1 + Math.floor(rand() * 3)
            k.fillStyle = theme.frosting[3]
            k.fillRect(x + i, y + 2, 1, len)
            k.fillStyle = theme.frosting[2]
            k.fillRect(x + i, y + 2 + len, 1, 1)
          }
        }
      }
    }
  }
}

/** Air currents as faint streamers drifting the way they blow (so they can be read). */
export function paintCurrents(
  g: CanvasRenderingContext2D,
  f: Floor,
  colour: string,
  tick: number,
) {
  g.fillStyle = rgba(colour, 0.22)
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const code = f.currents[r * COLS + c]!
      if (!code) continue
      const phase = (tick / 3 + c * 3 + r * 5) % TILE
      const x = c * TILE
      const y = TOP + r * TILE
      if (code === 1) g.fillRect(x + 4, y + TILE - phase, 1, 3)
      else if (code === 2) g.fillRect(x + 4, y + phase - 2, 1, 3)
      else if (code === 3) g.fillRect(x + TILE - phase, y + 4, 3, 1)
      else g.fillRect(x + phase - 2, y + 4, 3, 1)
    }
  }
}
