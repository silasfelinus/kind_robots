// /utils/arcade/rescueRally/art.ts
//
// Rescue Rally's sprites (conductor kr-arcade t-035, depth-pass/CABINETS.md section 1, "Bigger
// actors"): the hero, the roster and the family, redrawn at about one and a half times the first
// cabinet's size, each with a walk cycle. Built on utils/arcade/snes.ts: palette letters on ramps,
// an ink outline, two frames a walk. The stomper and the hypno are big and move a lot, so the game
// paints them from shapes (games/rescueRally.ts) rather than from a sheet.

import { INK, RAMPS, mix, pixelSprite } from '../snes'
import type { PixelSprite, Ramp } from '../snes'
import type { RescueeKind } from './family'

/** Glitch goo: a lime ramp the kit lacks. */
export const LIME: Ramp = [
  '#1a2e05',
  '#365314',
  '#65a30d',
  '#a3e635',
  '#ecfccb',
]
/** The glitch's own colour, what a hypno's swirl and a glitched friend's tint are made of. */
export const GLITCH: Ramp = [
  '#2a0838',
  '#5b1470',
  '#a21caf',
  '#e879f9',
  '#fae8ff',
]

// --- the hero --------------------------------------------------------------------------------------

const HERO_PALETTE = {
  A: RAMPS.gold[3],
  a: RAMPS.teal[1],
  P: RAMPS.pink[3],
  p: RAMPS.pink[2],
  q: RAMPS.pink[1],
  F: '#fde7d6',
  f: RAMPS.cream[2],
  c: RAMPS.pink[2],
  m: RAMPS.pink[1],
  k: INK,
  w: '#ffffff',
  H: RAMPS.teal[4],
  T: RAMPS.teal[2],
  t: RAMPS.teal[1],
  d: RAMPS.teal[0],
  g: RAMPS.gold[3],
  s: RAMPS.steel[3],
  S: RAMPS.steel[1],
}
const HERO_FRONT = [
  '....A......A....',
  '....a......a....',
  '.....a....a.....',
  '...pPPPppPPPp...',
  '..pPPPPPPPPPPq..',
  '.pPPPPPPPPPPPPq.',
  '.pPPFFFFFFFFPPq.',
  '.pPFFFFFFFFFFPq.',
  '.qPFkwFFFFkwFPq.',
  '.qPFkkFFFFkkFPq.',
  '..qFcFFFFFFcFq..',
  '...qFFFmmFFFq...',
  '.....fFFFFf.....',
  '....tTTTTTTd....',
  '...HTTTggTTTd...',
  '..HTTTTggTTTTd..',
  '.FHTTTTTTTTTTdF.',
  '.F.tTTTTTTTTd.F.',
  '....tTTTTTTd....',
  '....dddddddd....',
]
const HERO_BACK = [
  '....A......A....',
  '....a......a....',
  '.....a....a.....',
  '...pPPPppPPPp...',
  '..pPPPPPPPPPPq..',
  '.pPPPPPPPPPPPPq.',
  '.pPPPPPPPPPPPPq.',
  '.pPPPpPPPPpPPPq.',
  '.qPPPPPPPPPPPPq.',
  '.qpPPPPPPPPPPpq.',
  '..qpPPPPPPPPpq..',
  '...qppPPPPppq...',
  '.....qppppq.....',
  '....tTTTTTTd....',
  '...HTsSSSSsTd...',
  '..HTTsSggSsTTd..',
  '.FHTTsSSSSsTTdF.',
  '.F.tTsssssstd.F.',
  '....tTTTTTTd....',
  '....dddddddd....',
]
const HERO_SIDE = [
  '.......A........',
  '.......a........',
  '......a.........',
  '....pPPPPp......',
  '...pPPPPPPPp....',
  '..pPPPPPPPPPp...',
  '..pPPPPPFFFFF...',
  '.pPPPPPFFFFFFF..',
  '.pPPPPPFFFFkwF..',
  '.qPPPPPFFFFkkF..',
  '..qPPPPFFFFFcF..',
  '...qqPPFFFFmF...',
  '......qfFFFf....',
  '.......tTTd.....',
  '......HTTTgTd...',
  '......HTTTTTTFg.',
  '......HTTTTTd...',
  '......tTTTTd....',
  '......tTTTTd....',
  '......dddddd....',
]
const FRONT_LEGS = [
  ['....ss....ss....', '....ss....SS....', '...SSS..........'],
  ['....ss....ss....', '....SS....ss....', '..........SSS...'],
] as const
const SIDE_LEGS = [
  ['.......s.s......', '......s...s.....', '.....SS...SS....'],
  ['.......ss.......', '.......ss.......', '.......SSS......'],
] as const

function heroFrames(
  top: readonly string[],
  legs: readonly (readonly string[])[],
  palette: Record<string, string>,
) {
  return [
    pixelSprite([...top, ...legs[0]!], palette),
    pixelSprite([...top, ...legs[1]!], palette),
  ] as const
}

export type HeroSprites = {
  front: readonly [PixelSprite, PixelSprite]
  back: readonly [PixelSprite, PixelSprite]
  side: readonly [PixelSprite, PixelSprite]
}

/** The hero in a suit colour (co-op seats each wear their own; seat 0 is teal). */
export function heroSprites(suit: Ramp = RAMPS.teal): HeroSprites {
  const palette = {
    ...HERO_PALETTE,
    a: suit[1],
    H: suit[4],
    T: suit[2],
    t: suit[1],
    d: suit[0],
  }
  return {
    front: heroFrames(HERO_FRONT, FRONT_LEGS, palette),
    back: heroFrames(HERO_BACK, FRONT_LEGS, palette),
    side: heroFrames(HERO_SIDE, SIDE_LEGS, palette),
  }
}
export const HERO_SPRITES = heroSprites()

// --- the roster ------------------------------------------------------------------------------------

const DRONE_PALETTE = {
  R: RAMPS.ember[3],
  r: RAMPS.ember[2],
  h: RAMPS.purple[4],
  H: RAMPS.purple[3],
  P: RAMPS.purple[2],
  p: RAMPS.purple[1],
  d: RAMPS.purple[0],
  k: INK,
  c: RAMPS.teal[3],
}
const DRONE_TOP = [
  '.......RR.......',
  '.......pp.......',
  '...hHHHHHHHHp...',
  '..hHPPPPPPcPPp..',
  '.hHPPPPPPPPPPPp.',
  '.HPkkkkkkkkkkPp.',
  '.HPkRrrkkRrrkPp.',
  '.HPkkkkkkkkkkPp.',
  '.HPPPPPPPPPPPPd.',
  '.pPPPPPPPPPPPpd.',
  '..pppppppppddd..',
]
export const DRONE_SPRITES = [
  pixelSprite(
    [...DRONE_TOP, '...pd......pd...', '..dd........dd..'],
    DRONE_PALETTE,
  ),
  pixelSprite(
    [...DRONE_TOP, '....pd....pd....', '....dd....dd....'],
    DRONE_PALETTE,
  ),
] as const

/** A drone after the beam reboots it: same chassis, friendly green, happy eyes. */
export const FREED_SPRITES = [0, 1].map((frame) =>
  pixelSprite(
    [
      '.......YY.......',
      '.......ll.......',
      '...hHHHHHHHHl...',
      '..hHLLLLLLLLLl..',
      '.hHLLLLLLLLLLLl.',
      '.HLkkkkkkkkkkLl.',
      '.HLkkYkkkkYkkLl.',
      '.HLkYkYkkYkYkLl.',
      '.lLLLLLLLLLLLLd.',
      '..llllllllllld..',
      frame ? '...y........y...' : '....y......y....',
    ],
    {
      Y: RAMPS.gold[4],
      y: RAMPS.gold[3],
      h: RAMPS.leaf[4],
      H: RAMPS.leaf[3],
      L: RAMPS.leaf[2],
      l: RAMPS.leaf[1],
      d: RAMPS.leaf[0],
      k: INK,
    },
  ),
)

const SEEKER_PALETTE = {
  h: RAMPS.pink[4],
  H: RAMPS.pink[3],
  r: RAMPS.pink[2],
  d: RAMPS.pink[1],
  w: '#ffffff',
}
export const SEEKER_SPRITES = [
  pixelSprite(
    [
      '....h....',
      '...hHr...',
      '..hHwrr..',
      '.hHwwrrr.',
      'hHwwrrrrd',
      '.rrrrrrd.',
      '..rrrrd..',
      '...rdd...',
      '....d....',
    ],
    SEEKER_PALETTE,
  ),
  pixelSprite(
    [
      '....h....',
      '...hrr...',
      '..hrHrr..',
      '.hrHwHrd.',
      'hrrHwHrrd',
      '.rrrHrrd.',
      '..rrrrd..',
      '...rdd...',
      '....d....',
    ],
    SEEKER_PALETTE,
  ),
] as const

/** Top-down tank, treads above and below; three tread frames so they roll. */
export const TANK_SPRITES = [0, 1, 2].map((frame) => {
  const width = 28
  const tread = (row: number) =>
    Array.from({ length: width }, (_, i) =>
      (i + row + 3 - frame) % 3 === 0 ? 't' : 'T',
    ).join('')
  const body = (fill: string, inner?: string) =>
    '.H' +
    (inner
      ? fill.repeat(4) + inner.repeat(width - 12) + fill.repeat(4)
      : fill.repeat(width - 4)) +
    'd.'
  const rivets =
    '.H' +
    Array.from({ length: width - 4 }, (_, i) => (i % 5 === 2 ? 'r' : 'S')).join(
      '',
    ) +
    'd.'
  return pixelSprite(
    [
      tread(0),
      tread(1),
      tread(0),
      '.h' + 'H'.repeat(width - 4) + 's.',
      rivets,
      body('S'),
      body('S', 'k'),
      body('S', 'k'),
      body('S', 'k'),
      body('S'),
      rivets,
      '.' + 'd'.repeat(width - 2) + '.',
      tread(0),
      tread(1),
      tread(0),
    ],
    {
      h: RAMPS.steel[4],
      H: RAMPS.steel[3],
      S: RAMPS.steel[2],
      s: RAMPS.steel[1],
      d: RAMPS.steel[1],
      r: RAMPS.steel[4],
      T: RAMPS.steel[1],
      t: RAMPS.steel[0],
      k: INK,
    },
  )
})

export const SPARKER_SPRITE = pixelSprite(
  [
    '.....gGGg.....',
    '....gGWWGg....',
    '.....gGGg.....',
    '......ss......',
    '.....sSSs.....',
    '....hHHHHs....',
    '...hHkkkkHs...',
    '...HkYkkYkHd..',
    '...HkkkkkkHd..',
    '..hHHHHHHHHHs.',
    '.hHSSSSSSSSSHd',
    '.HSsSsSsSsSSHd',
    '.dSSSSSSSSSSd.',
    '..ddd....ddd..',
  ],
  {
    g: RAMPS.gold[3],
    G: RAMPS.gold[4],
    W: '#ffffff',
    s: RAMPS.steel[2],
    S: RAMPS.sky[2],
    h: RAMPS.sky[4],
    H: RAMPS.sky[3],
    d: RAMPS.sky[0],
    k: INK,
    Y: RAMPS.ember[3],
  },
)

export const PYLON_SPRITE = pixelSprite(
  [
    '...hs...',
    '..hWWs..',
    '..HWWd..',
    '..hHHs..',
    '..PPPP..',
    '.hHHHHs.',
    '.HWWWWd.',
    '.PPPPPP.',
    'hHHHHHHs',
    'HPPPPPPd',
    'dddddddd',
  ],
  {
    h: RAMPS.teal[4],
    H: RAMPS.teal[3],
    s: RAMPS.teal[2],
    d: RAMPS.teal[1],
    W: '#ffffff',
    P: RAMPS.pink[3],
  },
)

// --- the family ------------------------------------------------------------------------------------

export const SHIRTS = [
  '#f472b6',
  '#38bdf8',
  '#facc15',
  '#4ade80',
  '#fb923c',
  '#a78bfa',
]
export const SKINS = ['#fde7d6', '#f1c27d', '#c68642', '#8d5524', '#5c3a21']
const HAIRS = ['#3b2417', '#6b3a1e', '#1f1a2e', '#b45309', '#f5d0a0']

const PERSON_TOP = [
  '...hhhh...',
  '..hhhhhh..',
  '.hhSSSShh.',
  '.hSkSSkSh.',
  '.hSSSSSSh.',
  '..sSmmSs..',
  '...sSSs...',
  '..CCCCCc..',
  '.CCCCCCCc.',
  'SCCCCCCCcS',
  'S.CCCCCc.S',
  '..CCCCcc..',
]
/** Every shirt and skin pairing, two walk frames each, baked once. */
const PEOPLE = new Map<string, readonly [PixelSprite, PixelSprite]>()
SHIRTS.forEach((shirt, si) =>
  SKINS.forEach((skin, ki) => {
    const palette = {
      h: HAIRS[(si + ki) % HAIRS.length]!,
      S: skin,
      s: mix(skin, INK, 0.3),
      m: RAMPS.pink[1],
      k: INK,
      C: shirt,
      c: mix(shirt, INK, 0.35),
      b: RAMPS.sky[1],
      B: RAMPS.sky[0],
    }
    PEOPLE.set(`${shirt}|${skin}`, [
      pixelSprite([...PERSON_TOP, '..bb..bb..', '.BB....BB.'], palette),
      pixelSprite([...PERSON_TOP, '...bbbb...', '...BBBB...'], palette),
    ])
  }),
)

const CAT_PALETTE = {
  H: RAMPS.gold[3],
  G: RAMPS.gold[2],
  s: RAMPS.rust[2],
  d: RAMPS.gold[1],
  k: INK,
  p: RAMPS.pink[3],
}
const CAT_TOP = [
  '..........G..G',
  'G.........GGGG',
  'G.........GkGk',
  '.G........GGpG',
  '.GGHHHHHHHGGd.',
  '..GHHHHHHHGGd.',
  '..GsGsGsGGGd..',
  '..dddddddddd..',
]
const CAT_SPRITES = [
  pixelSprite([...CAT_TOP, '..d.d...d.d...'], CAT_PALETTE),
  pixelSprite([...CAT_TOP, '...d.d...d.d..'], CAT_PALETTE),
] as const

const DOG_PALETTE = {
  W: RAMPS.cream[3],
  w: RAMPS.cream[2],
  c: RAMPS.cream[1],
  e: RAMPS.earth[2],
  b: RAMPS.earth[3],
  k: INK,
}
const DOG_TOP = [
  '..........WWWW.',
  'w........eWWkWW',
  'w........eWWWWk',
  '.w.......eWWWW.',
  '.wWWWWWWWWWWWc.',
  '.WWWbbbWWWWWWc.',
  '.WWWWWWWWWWWc..',
  '..cccccccccc...',
]
const DOG_SPRITES = [
  pixelSprite([...DOG_TOP, '..c.c....c.c...'], DOG_PALETTE),
  pixelSprite([...DOG_TOP, '...c.c..c.c....'], DOG_PALETTE),
] as const

const BOT_PALETTE = {
  Y: RAMPS.gold[3],
  a: RAMPS.steel[3],
  h: RAMPS.sky[4],
  H: RAMPS.sky[3],
  S: RAMPS.sky[2],
  s: RAMPS.sky[1],
  d: RAMPS.sky[0],
  k: INK,
}
const BOT_TOP = [
  '....Y.....',
  '....a.....',
  '..hHHHHs..',
  '.hHHHHHHs.',
  '.HSYSSYSd.',
  '.HSSSSSSd.',
  '.HSSkkSSd.',
  '..sSSSSd..',
  '...sSSd...',
]
const BOT_SPRITES = [
  pixelSprite([...BOT_TOP, '..d....d..', '..k....k..'], BOT_PALETTE),
  pixelSprite([...BOT_TOP, '...d..d...', '...k..k...'], BOT_PALETTE),
] as const

/** A rescuee's two walk frames. */
export function familySprites(
  kind: RescueeKind,
  color: string,
  skin: string,
): readonly PixelSprite[] {
  switch (kind) {
    case 'person':
      return PEOPLE.get(`${color}|${skin}`) ?? PEOPLE.values().next().value!
    case 'cat':
      return CAT_SPRITES
    case 'dog':
      return DOG_SPRITES
    case 'bot':
      return BOT_SPRITES
  }
}

const tinted = new WeakMap<PixelSprite, PixelSprite>()
/** The sprite washed in the glitch's purple (a glitched friend), baked once per sprite. */
export function glitchTint(sprite: PixelSprite): PixelSprite {
  const hit = tinted.get(sprite)
  if (hit) return hit
  const out: PixelSprite = {
    width: sprite.width,
    height: sprite.height,
    pixels: sprite.pixels.map((c) =>
      c && c !== INK ? mix(c, GLITCH[2], 0.55) : c,
    ),
  }
  tinted.set(sprite, out)
  return out
}

// --- small things ----------------------------------------------------------------------------------

const HEART_PALETTE = { P: RAMPS.pink[2], H: RAMPS.pink[4], p: RAMPS.pink[1] }
export const HEART_SPRITE = pixelSprite(
  ['.PP.PP.', 'PHPPPPp', 'PPPPPPp', '.PPPPp.', '..PPp..', '...p...'],
  HEART_PALETTE,
)
/** The little "help!" heart that blinks over anyone waiting for rescue. */
export const HELP_SPRITE = pixelSprite(
  ['HP.Pp', 'PPPPp', '.PPp.', '..p..'],
  HEART_PALETTE,
)

/** A little wind-up toy from the Big Wind-Up's hatch: tin body, key on top. */
export const WINDUP_SPRITES = [0, 1].map((frame) =>
  pixelSprite(
    [
      frame ? '...YYYY...' : '....YY....',
      '....yy....',
      '..hHHHHs..',
      '.hHkHHkHs.',
      '.HHHHHHHd.',
      '.HHmmmmHd.',
      '..dHHHHd..',
      frame ? '..d....d..' : '...d..d...',
    ],
    {
      Y: RAMPS.gold[3],
      y: RAMPS.gold[1],
      h: RAMPS.rust[4],
      H: RAMPS.rust[3],
      s: RAMPS.rust[2],
      d: RAMPS.rust[1],
      m: RAMPS.rust[1],
      k: INK,
    },
  ),
)

/** A Reboot Squad bot: a small friendly drone that orbits the hero. */
export const SQUAD_SPRITE = pixelSprite(
  [
    '....Y....',
    '..hHHHs..',
    '.hHkLkHs.',
    '.HLLLLLd.',
    '..dLLLd..',
    '...d.d...',
  ],
  {
    Y: RAMPS.gold[4],
    h: RAMPS.leaf[4],
    H: RAMPS.leaf[3],
    L: RAMPS.leaf[2],
    s: RAMPS.leaf[1],
    d: RAMPS.leaf[0],
    k: INK,
  },
)
