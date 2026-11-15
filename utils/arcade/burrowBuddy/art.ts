// /utils/arcade/burrowBuddy/art.ts
//
// Burrow Buddy's new 16-bit sprites (conductor kr-arcade/t-106): the pill bug and its curled ball,
// the mole cricket, stones and cracked stones, the six bubble-tool icons and the twelve-veggie
// ladder with its Golden Beet. Every grump has a calm and a restless palette so its mood reads at a
// glance.

import { INK, RAMPS, pixelSprite } from '../snes'
import type { PixelSprite, Ramp } from '../snes'
import type { ToolKind } from './gardens'
import { VEGGIE_LADDER } from './rules'

type Frames = readonly [PixelSprite, PixelSprite]

const shellPalette = (r: Ramp) => ({
  h: r[4],
  L: r[3],
  M: r[2],
  m: r[1],
  d: r[0],
  k: INK,
  w: '#ffffff',
  a: RAMPS.cream[2],
  C: RAMPS.gold[3],
})

const PILLBUG_BODY = [
  '....hhLLL...',
  '..hLLMLLMM..',
  '.hLMLLMLLMm.',
  'hLLMLLMLLMmm',
  'LLMMLMMLMwka',
  'MMMmMMmMMmmm',
  '.mmdmmdmmdd.',
]
const PILLBUG_LEGS = ['.d.d.d.d.d..', 'd.d.d.d.d...'] as const
const PILLBUG_BALL = [
  '...hhLL...',
  '..hLLMMM..',
  '.hLMLLMMm.',
  'hLMLLMMLmm',
  'LMLLMMLMmm',
  'LMLMMLMMmd',
  'MMLMLMMmmd',
  '.MmMMmMmd.',
  '..mmdmmd..',
  '...dddd...',
]

const CRICKET_BODY = [
  '..........a..',
  '....LLLL.a...',
  '..LhhhLLLLM..',
  '.LhLLLLMMMwk.',
  'LLLMMMMMMMMMC',
  'mMMmMMmMMMmCC',
  '.mmmmmmmmmCC.',
]
const CRICKET_LEGS = ['..d.d.d..dC..', '.d.d.d...d.C.'] as const

const frames = (body: string[], legs: readonly [string, string], r: Ramp) =>
  [
    pixelSprite([...body, legs[0]], shellPalette(r)),
    pixelSprite([...body, legs[1]], shellPalette(r)),
  ] as const

export const PILLBUG_SPRITES: { calm: Frames; restless: Frames } = {
  calm: frames(PILLBUG_BODY, PILLBUG_LEGS, RAMPS.steel),
  restless: frames(PILLBUG_BODY, PILLBUG_LEGS, RAMPS.purple),
}
export const PILLBUG_BALL_SPRITE = pixelSprite(
  PILLBUG_BALL,
  shellPalette(RAMPS.steel),
)
export const CRICKET_SPRITES: { calm: Frames; restless: Frames } = {
  calm: frames(CRICKET_BODY, CRICKET_LEGS, RAMPS.earth),
  restless: frames(CRICKET_BODY, CRICKET_LEGS, RAMPS.rust),
}

export const HAPPY_FACE = [
  '.HHPp.',
  'HhPPPp',
  'PkPPkp',
  'PPPPPp',
  'pkkkpd',
  '.pppd.',
]
export const happySprite = (r: Ramp) =>
  pixelSprite(HAPPY_FACE, {
    H: r[3],
    h: r[4],
    P: r[2],
    p: r[1],
    d: r[0],
    k: INK,
  })

// --- stones ----------------------------------------------------------------------------------

const STONE_ROWS = [
  '...hhLLL....',
  '..hLLLLMMm..',
  '.hLLLLMMMMm.',
  'hLLLMMMMMMmm',
  'LLLMMMMMMMmm',
  'LLMMMMMMMmmm',
  'LMMMMMMMmmmd',
  'MMMMMMMmmmmd',
  '.MMMmmmmmmd.',
  '..mmmmmddd..',
]
const CRACKED_ROWS = [
  '...hhLkL....',
  '..hLLLkMMm..',
  '.hLLLkkMMMm.',
  'hLLLMkGMMMmm',
  'LLLMMkGGMMmm',
  'LLMMMMkMMmmm',
  'LMMMMMkkMmmd',
  'MMMMMMMkmmmd',
  '.MMMmmmmkmd.',
  '..mmmmmddd..',
]
const stonePalette = {
  h: RAMPS.steel[4],
  L: RAMPS.steel[3],
  M: RAMPS.steel[2],
  m: RAMPS.steel[1],
  d: RAMPS.steel[0],
  k: INK,
}

export const TOOL_COLOURS: Record<ToolKind, Ramp> = {
  wide: RAMPS.water,
  long: RAMPS.teal,
  quick: RAMPS.gold,
  drill: RAMPS.rust,
  headlamp: RAMPS.cream,
  sprinkler: RAMPS.sky,
}

export const BOULDER_SPRITE = pixelSprite(STONE_ROWS, stonePalette)
export const CRACKED_SPRITES = Object.fromEntries(
  (Object.keys(TOOL_COLOURS) as ToolKind[]).map((tool) => [
    tool,
    pixelSprite(CRACKED_ROWS, { ...stonePalette, G: TOOL_COLOURS[tool][3] }),
  ]),
) as Record<ToolKind, PixelSprite>

// --- bubble tools ------------------------------------------------------------------------------

const toolIcon = (rows: string[], tool: ToolKind) => {
  const r = TOOL_COLOURS[tool]
  return pixelSprite(rows, {
    w: '#ffffff',
    W: r[4],
    B: r[3],
    b: r[2],
    s: RAMPS.steel[3],
    S: RAMPS.steel[2],
    Y: RAMPS.gold[4],
    k: RAMPS.steel[1],
  })
}

export const TOOL_ICONS: Record<ToolKind, PixelSprite> = {
  wide: toolIcon(['.ww..ww', 'wWBwwWB', 'wBBwwBB', '.BB..BB'], 'wide'),
  long: toolIcon(
    ['....w..', '.ww.WW.', 'wWBWWWW', 'wBB.WW.', '.BB.W..'],
    'long',
  ),
  quick: toolIcon(
    ['...BB.', '..BB..', '.BBBB.', '...BB.', '..BB..', '.BB...'],
    'quick',
  ),
  drill: toolIcon(
    ['.BB...', '.BB...', '.BB...', '.BBBb.', 'BBBBBb', 'k.k.k.'],
    'drill',
  ),
  headlamp: toolIcon(
    ['.ssss.', 'sYYYYs', 'sYwwYs', 'sYYYYs', '.ssss.'],
    'headlamp',
  ),
  sprinkler: toolIcon(
    ['....B.', '.ss.B.', 'ssssB.', 'sSSss.', 'sSSs..', '.ss...'],
    'sprinkler',
  ),
}

// --- the veggie ladder -----------------------------------------------------------------------------

const veg = (rows: string[], body: Ramp, leaf: Ramp = RAMPS.leaf) =>
  pixelSprite(rows, {
    l: leaf[2],
    L: leaf[3],
    d: leaf[1],
    h: body[4],
    O: body[3],
    o: body[2],
    q: body[1],
    w: '#ffffff',
    c: RAMPS.cream[3],
    C: RAMPS.cream[2],
  })

const ROUND = [
  '....d....',
  '..lLdLl..',
  '...LdL...',
  '.hOOOOOo.',
  'hOOOOOOOo',
  'hOOOOOOoq',
  'OOOOOOOoq',
  '.OOOOOoq.',
  '..oooqq..',
]

const VEGGIE_ART: Record<string, PixelSprite> = {
  RADISH: veg(
    [
      '..l.L.l..',
      '...lLl...',
      '....d....',
      '..hOOOo..',
      '.hOOOOoq.',
      '.OOOOOoq.',
      '..OOooq..',
      '...oqq...',
      '....c....',
    ],
    RAMPS.pink,
  ),
  CARROT: veg(
    [
      '.l..L..l.',
      '..lLLLl..',
      '...dLd...',
      '..hOOOo..',
      '..OOOOo..',
      '..hOOoq..',
      '...OOo...',
      '...hOq...',
      '...Ooq...',
      '....o....',
      '....q....',
    ],
    RAMPS.rust,
  ),
  'TURNIP GREENS': veg(
    [
      '.L.l.L.l.',
      'LhLlLhLl.',
      'LLhLLLhLl',
      '.LLLhLLl.',
      '..lLLLl..',
      '...ldl...',
      '...ccC...',
      '....C....',
    ],
    RAMPS.leaf,
    RAMPS.leaf,
  ),
  MUSHROOM: veg(
    [
      '..hOOOo..',
      '.hOwOOwo.',
      'hOOOOOwoq',
      'OOwOOOOoq',
      '.qqqqqqq.',
      '...cCc...',
      '...cCc...',
      '..ccCcc..',
    ],
    RAMPS.ember,
  ),
  CUCUMBER: veg(
    [
      '....hOOOOo...',
      '..hOOoOOoOOq.',
      '.OOOOOOOOOOoq',
      '..OoOOoOOoqq.',
      '....qqqqqq...',
    ],
    RAMPS.leaf,
  ),
  EGGPLANT: veg(
    [
      '...lLl...',
      '..lLLLl..',
      '...hOo...',
      '..hOOOo..',
      '.hOOOOOo.',
      '.OOOOOOoq',
      '.OOOOOooq',
      '..OOOooq.',
      '...qqqq..',
    ],
    RAMPS.purple,
  ),
  PEPPER: veg(
    [
      '....d....',
      '...ld....',
      '.hOOOOOo.',
      'hOOhOOOoq',
      'OOOOOOOoq',
      'OOOOOOooq',
      '.OOOOOoq.',
      '.OoOOooq.',
      '..q..qq..',
    ],
    RAMPS.ember,
  ),
  TOMATO: veg(ROUND, RAMPS.ember),
  ONION: veg(
    [
      '....d....',
      '....l....',
      '...hOo...',
      '..hOOOo..',
      '.hOOOOoq.',
      '.OOOOOOoq',
      '.OOOOOoq.',
      '..qOOoq..',
      '...c.c...',
    ],
    RAMPS.cream,
  ),
  PUMPKIN: veg(ROUND, RAMPS.rust),
  WATERMELON: veg(
    [
      '..hOOOo..',
      '.hOoOoOo.',
      'hOoOoOoOq',
      'OoOoOoOoq',
      'OoOoOoOoq',
      '.oOoOoOq.',
      '..qqqqq..',
    ],
    RAMPS.leaf,
  ),
  'STAR FRUIT': veg(
    [
      '....h....',
      '...hO....',
      'hhhOOOooo',
      '.hOOOOoq.',
      '..OOOoq..',
      '.OOo.Ooq.',
      'Oo.....oq',
    ],
    RAMPS.gold,
  ),
  'GOLDEN BEET': veg(ROUND, RAMPS.gold),
}

export const VEGGIE_SPRITES: Record<string, PixelSprite> = VEGGIE_ART

/** Every rung of the ladder has its own art. */
export const LADDER_HAS_ART = VEGGIE_LADDER.every((r) => VEGGIE_ART[r.name])
