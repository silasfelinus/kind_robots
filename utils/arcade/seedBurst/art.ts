// /utils/arcade/seedBurst/art.ts
//
// Seed Burst's depth-pass sprites (conductor kr-arcade/t-136): the six seed varieties, the golden
// seed, the new grumps with their tells, and the compost heap. Code-drawn pixel art in the
// cabinet's 16-bit style (utils/arcade/snes.ts), lit from the upper left with an ink outline.

import { INK, RAMPS, pixelSprite } from '../snes'
import type { PixelSprite, Ramp } from '../snes'
import type { Variety } from './pouch'

/** One icon per variety: seed packets, the seat badges and the swap floater. */
export const VARIETY_SPRITES: Record<Variety, PixelSprite> = {
  sunflower: pixelSprite(
    [
      '..yYy..',
      '.yYYYy.',
      'yYbbbYy',
      'YYbBbYY',
      'yYbbbYy',
      '.yYYYy.',
      '..yYy..',
    ],
    {
      y: RAMPS.gold[2],
      Y: RAMPS.gold[3],
      b: RAMPS.earth[1],
      B: RAMPS.earth[2],
    },
  ),
  clover: pixelSprite(
    [
      '.Ll.lL.',
      'LHl.lHL',
      '.lLgLl.',
      '...g...',
      '.lLgLl.',
      'LHl.lHL',
      '.Ll.lL.',
    ],
    { L: RAMPS.leaf[3], H: RAMPS.leaf[4], l: RAMPS.leaf[2], g: RAMPS.leaf[1] },
  ),
  dandelion: pixelSprite(
    [
      '.w.W.w.',
      'w.WWW.w',
      '.WWcWW.',
      'w.WWW.w',
      '.w.g.w.',
      '...g...',
      '..gg...',
    ],
    {
      W: '#ffffff',
      w: RAMPS.steel[3],
      c: RAMPS.gold[3],
      g: RAMPS.leaf[2],
    },
  ),
  pumpkin: pixelSprite(
    [
      '...g...',
      '..gG...',
      '.oOoOo.',
      'oOHoOOo',
      'oOOoOOo',
      'oOOoOOo',
      '.qoqoq.',
    ],
    {
      o: RAMPS.rust[2],
      O: RAMPS.rust[3],
      H: RAMPS.rust[4],
      q: RAMPS.rust[1],
      g: RAMPS.leaf[2],
      G: RAMPS.leaf[3],
    },
  ),
  bramble: pixelSprite(
    [
      't..g..t',
      '.t.g.t.',
      '..pPp..',
      '.pPHPp.',
      '.pPPPp.',
      '..pPp..',
      '.t...t.',
    ],
    {
      p: RAMPS.purple[1],
      P: RAMPS.purple[2],
      H: RAMPS.purple[4],
      t: RAMPS.earth[2],
      g: RAMPS.leaf[2],
    },
  ),
  puffcap: pixelSprite(
    [
      '..rRr..',
      '.rWRRr.',
      'rRRRWRr',
      'rWRRRRr',
      '.sssss.',
      '..cCc..',
      '..cCc..',
    ],
    {
      r: RAMPS.ember[1],
      R: RAMPS.ember[2],
      W: '#ffffff',
      s: RAMPS.cream[1],
      c: RAMPS.cream[3],
      C: RAMPS.cream[4],
    },
  ),
}

/** Each variety's pod husk. */
export const VARIETY_RAMPS: Record<Variety, Ramp> = {
  sunflower: ['#3a1a0a', '#6b3a14', '#a8641e', '#e0a040', '#fff0c0'],
  clover: RAMPS.leaf,
  dandelion: RAMPS.steel,
  pumpkin: RAMPS.rust,
  bramble: RAMPS.purple,
  puffcap: RAMPS.ember,
}

export const GOLDEN_SEED_SPRITE = pixelSprite(
  ['...h...', '..hHg..', '.hHHHg.', '.HHHHg.', '.HHHgg.', '..ggg..'],
  { h: RAMPS.gold[4], H: RAMPS.gold[3], g: RAMPS.gold[2] },
)

/** The sulky slug in its shell, then bare and hurrying (both face right). */
export const SLUG_SPRITES = [
  pixelSprite(
    [
      '....sSSs....',
      '...sSHHSs...',
      '..sShssHSs..',
      '..sSHhSSSs.k',
      '..sSSSSSs..k',
      '.bbsssssbbbB',
      'bBBBBBBBBBBb',
      '.bbbbbbbbbb.',
    ],
    {
      S: RAMPS.rust[2],
      s: RAMPS.rust[1],
      H: RAMPS.rust[3],
      h: RAMPS.gold[3],
      b: RAMPS.cream[1],
      B: RAMPS.cream[2],
      k: INK,
    },
  ),
  pixelSprite(
    [
      '.........k.k',
      '..........B.',
      '.....BBBBBBB',
      '...BBPPPPPBb',
      '.BBPPPPPPPBb',
      'bBBBBBBBBBBb',
      '.bbbbbbbbbb.',
    ],
    { P: RAMPS.pink[3], B: RAMPS.pink[2], b: RAMPS.pink[1], k: INK },
  ),
] as const

/** The burrow mole above ground, and the dirt mound that wobbles before it pops up. */
export const MOLE_SPRITE = pixelSprite(
  [
    '..dDDDDd..',
    '.dDHDDHDd.',
    '.DkDDDDkD.',
    '.DDDppDDD.',
    'dDDDppDDDd',
    '.cDDDDDDc.',
    'cc.dDDd.cc',
  ],
  {
    D: RAMPS.earth[2],
    d: RAMPS.earth[1],
    H: RAMPS.earth[3],
    k: INK,
    p: RAMPS.pink[3],
    c: RAMPS.cream[3],
  },
)
export const MOUND_SPRITE = pixelSprite(
  ['....eE....', '..eEEEEe..', '.eEhEEqEe.', 'eEEEqEEEEe', 'qqEqqEEqqq'],
  {
    e: RAMPS.earth[2],
    E: RAMPS.earth[3],
    h: RAMPS.earth[4],
    q: RAMPS.earth[1],
  },
)

const HOPPER_PALETTE = {
  g: RAMPS.teal[1],
  G: RAMPS.teal[3],
  L: RAMPS.teal[2],
  l: RAMPS.teal[1],
  k: INK,
  y: RAMPS.gold[3],
}
/** The hedge hopper standing, then crouched and winding its legs (its tell); both face right. */
export const HOPPER_SPRITES = [
  pixelSprite(
    [
      '.....gGG..',
      '....gGkGg.',
      '.lllgGGGG.',
      'lLLLLGGyG.',
      '.lLLLLGGg.',
      '..l..l.l..',
      '.l...l..l.',
    ],
    HOPPER_PALETTE,
  ),
  pixelSprite(
    ['.....gGG..', '.lllgGkGg.', 'lLLLLGGyG.', '.llLLLLGg.', 'lll.ll.ll.'],
    HOPPER_PALETTE,
  ),
] as const

/** The buzz bully, two wing frames. */
export const BULLY_SPRITES = [
  pixelSprite(
    [
      '.a......a.',
      '..a....a..',
      '.WwddddwW.',
      'WwdYYYYdwW',
      '.dYrYYrYd.',
      '.dYYYYYYd.',
      '.dddYYddd.',
      '..dYYYYd..',
      '...dddd...',
    ],
    {
      a: RAMPS.steel[3],
      W: '#ffffff',
      w: RAMPS.steel[3],
      Y: RAMPS.gold[2],
      d: RAMPS.earth[0],
      r: RAMPS.ember[2],
    },
  ),
  pixelSprite(
    [
      '.a......a.',
      '..a....a..',
      '...dddd...',
      'WwdYYYYdwW',
      'WdYrYYrYdW',
      '.dYYYYYYd.',
      '.dddYYddd.',
      '..dYYYYd..',
      '...dddd...',
    ],
    {
      a: RAMPS.steel[3],
      W: '#ffffff',
      Y: RAMPS.gold[2],
      d: RAMPS.earth[0],
      r: RAMPS.ember[2],
      w: RAMPS.steel[3],
    },
  ),
] as const

/** The seed thief (a masked little raccoon), and the sack it carries loot in. */
export const THIEF_SPRITE = pixelSprite(
  [
    '.G......G.',
    '.GG....GG.',
    '..GGGGGG..',
    '.GkkGGkkG.',
    '.kwkGGkwk.',
    '..GGnnGG..',
    '...gGGg...',
    '..gGGGGg..',
    '..g.gg.g..',
  ],
  {
    G: RAMPS.steel[2],
    g: RAMPS.steel[1],
    k: INK,
    w: '#ffffff',
    n: RAMPS.pink[3],
  },
)
export const SACK_SPRITE = pixelSprite(
  ['..t..', '.sSs.', 'sSHSs', 'sSSSs', '.sss.'],
  {
    s: RAMPS.earth[2],
    S: RAMPS.earth[3],
    H: RAMPS.earth[4],
    t: RAMPS.earth[1],
  },
)

/** The puffball, and the spore gnats it bursts into. */
export const PUFFBALL_SPRITE = pixelSprite(
  [
    '...pPPp...',
    '..pPHHPp..',
    '.pPHPPPPp.',
    '.PkPPPkPp.',
    'pPPPPPPPPp',
    'pPPdPPdPPp',
    '.pPPPPPPp.',
    '..ppppp...',
  ],
  {
    P: RAMPS.purple[3],
    p: RAMPS.purple[2],
    H: RAMPS.purple[4],
    d: RAMPS.purple[1],
    k: INK,
  },
)
export const SPORE_SPRITES = [
  pixelSprite(['w.pP.w', 'wpPHpw', '.pPPp.', '..pp..'], {
    p: RAMPS.purple[2],
    P: RAMPS.purple[3],
    H: RAMPS.purple[4],
    w: RAMPS.pink[4],
  }),
  pixelSprite(['..pP..', 'wpPHpw', 'wpPPpw', '..pp..'], {
    p: RAMPS.purple[2],
    P: RAMPS.purple[3],
    H: RAMPS.purple[4],
    w: RAMPS.pink[4],
  }),
] as const

/** The compost heap the gate bell calls grumps out of. */
export const HEAP_SPRITE = pixelSprite(
  [
    '.....lG.....',
    '...qEeleEq..',
    '..qEeEEhEeq.',
    '.qEEeEoEEEeq',
    'qEEoEEEEeEEq',
    'qqqqqqqqqqqq',
  ],
  {
    q: RAMPS.earth[0],
    E: RAMPS.earth[1],
    e: RAMPS.earth[2],
    h: RAMPS.earth[3],
    o: RAMPS.rust[2],
    l: RAMPS.leaf[2],
    G: RAMPS.leaf[3],
  },
)

/** The Grumble Cloud's colours: a sulky rain cloud nobody can bloom. */
export const GRUMBLE_RAMP: Ramp = [
  '#141024',
  '#2a2440',
  '#3e3658',
  '#5a5078',
  '#7a7098',
]
