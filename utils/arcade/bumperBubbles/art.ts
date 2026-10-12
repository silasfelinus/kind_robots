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

/** Each grump's colour ramp (and the gems and pops it leaves). */
export const GRUMP_RAMPS: Record<GrumpKind, Ramp> = {
  waddler: ['#0e3b2a', '#17803f', '#4ade80', '#a7f3c0', '#effff4'],
  hopper: ['#5a3a08', '#b07a0c', '#facc15', '#fde98a', '#fffbe0'],
  dasher: ['#0c2a5a', '#1c6aa8', '#38bdf8', '#a5e4ff', '#effaff'],
  climber: ['#3d0f4a', '#8a2a9e', '#e879f9', '#f5c2fc', '#fff0ff'],
  bouncer: RAMPS.rust,
  sprout: RAMPS.leaf,
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
}

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
    w: '#ffffff',
    k: INK,
  }
  const shape = SHAPES[kind]
  const walk: [PixelSprite, PixelSprite] = [
    pixelSprite([...shape.body, ...shape.feet[0]], palette),
    pixelSprite(
      kind === 'bouncer' ? BOUNCER_DOWN : [...shape.body, ...shape.feet[1]],
      palette,
    ),
  ]
  return {
    walk,
    flower: kind === 'sprout' ? pixelSprite(FLOWER, palette) : null,
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
  props: 'bottles' | 'lollipops'
  /** Rising backdrop bubbles. */
  decor: string
  /** Air-current streamers. */
  current: string
  /** HUD panels. */
  hud: Ramp
}

const MOON: Ramp = ['#3a3048', '#6a5a70', '#a898a0', '#d8cfc8', '#f4efe8']
const SUN: Ramp = ['#f0c890', '#f6dca8', '#fbecc4', '#fff6e0', '#ffffff']
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
    decor: '#ffffff',
    current: '#ffffff',
    hud: RAMPS.leaf,
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
  const orb = theme.orb
  if (orb) {
    glow(k, orb.x, orb.y, orb.r * 2.6, orb.ramp[3], 0.22)
    k.save()
    k.globalAlpha = orb.ramp === MOON ? 1 : 0.55
    shadedOrb(k, orb.x, orb.y, orb.r, orb.ramp, { outline: null })
    k.restore()
    if (orb.ramp === MOON) {
      k.fillStyle = rgba(MOON[1], 0.6)
      k.fillRect(orb.x + 3, orb.y + 2, 4, 3)
      k.fillRect(orb.x - 6, orb.y + 6, 3, 2)
    }
  }
  const rand = backdropRng(theme.id === 'bottling' ? 71 : 73)
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
