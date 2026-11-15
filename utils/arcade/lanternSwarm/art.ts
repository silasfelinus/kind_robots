// /utils/arcade/lanternSwarm/art.ts
//
// Lantern Swarm's 16-bit sprites (utils/arcade/snes.ts), shared by the game and its Guardians:
// every moth kind with two flap frames facing up and sideways (down and right are flips), the
// Glow Stage dancers, the paper lantern, beams, dust and the festival charms.

import { INK, RAMPS, drawSprite, pixelSprite } from '../snes'
import type { PixelSprite, Ramp } from '../snes'
import type { Kind } from './zones'

/** A row-art grid turned a quarter: an up-facing sprite becomes a left-facing one. */
function transpose(rows: readonly string[]): string[] {
  const w = Math.max(...rows.map((r) => r.length))
  return Array.from({ length: w }, (_, x) =>
    rows.map((r) => r[x] ?? '.').join(''),
  )
}

/** The downstroke: both wings folded toward the body, same frame size so it stays centred. */
function foldWings(rows: readonly string[], body = 1): string[] {
  return rows.map((row) => {
    const mid = Math.floor(row.length / 2)
    const left = row.slice(0, mid - body)
    const right = row.slice(mid + body + 1)
    const keep = Math.ceil(left.length * 0.6)
    const pick = (wing: string, inner: (j: number) => number) =>
      Array.from({ length: keep }, (_, j) => wing[inner(j)] ?? '.').join('')
    const step = left.length / keep
    const l = pick(left, (j) => left.length - 1 - Math.round(j * step))
      .split('')
      .reverse()
      .join('')
    const r = pick(right, (j) => Math.round(j * step))
    const pad = '.'.repeat(left.length - keep)
    return pad + l + row.slice(mid - body, mid + body + 1) + r + pad
  })
}

export type MothSet = {
  up: readonly [PixelSprite, PixelSprite]
  side: readonly [PixelSprite, PixelSprite]
}

/** Up- and left-facing sprites, two flap frames each (down and right are flips). */
export function mothSet(
  rows: readonly string[],
  palette: Record<string, string>,
): MothSet {
  const folded = foldWings(rows)
  return {
    up: [pixelSprite(rows, palette), pixelSprite(folded, palette)],
    side: [
      pixelSprite(transpose(rows), palette),
      pixelSprite(transpose(folded), palette),
    ],
  }
}

/** Draw a moth set facing `heading` in quarter turns: flips, never a rotation. */
export function drawMoth(
  g: CanvasRenderingContext2D,
  set: MothSet,
  x: number,
  y: number,
  heading: number,
  flap: number,
  scale = 1,
) {
  const dx = Math.cos(heading)
  const dy = Math.sin(heading)
  if (Math.abs(dy) >= Math.abs(dx))
    drawSprite(g, set.up[flap % 2]!, x, y, { flipY: dy > 0, scale })
  else drawSprite(g, set.side[flap % 2]!, x, y, { flipX: dx > 0, scale })
}

// Moths are drawn head-up; formation and dives flip them to face their heading.
const MOTH_ROWS = [
  '....a.....a....',
  '.....a...a.....',
  '.HHLL.kBk.LLMM.',
  'HLLMLLbBbLLMLMS',
  'HLeLMLbBbLMLeMS',
  '.LLLLMbBbMLLMS.',
  '..OOOkbBbkOoo..',
  '..OokObBbOkoo..',
  '...oo..b..oo...',
]
const LUNA_ROWS = [
  '....a.....a....',
  '.....a...a.....',
  '.PPPP.kWk.PPPP.',
  'HHLLLLwWwLLLLMS',
  'HLeLLLwWwLLLeMS',
  '.LLLLMwWwMLLMS.',
  '..LMMSwWwSMMS..',
  '...LM.wWw.MS...',
  '...LS..w..MS...',
  '...LS.....MS...',
  '....T.....T....',
  '....T.....T....',
]
const QUEEN_ROWS = [
  '....a..g.g..a....',
  '.....a.gGg.a.....',
  '.HHLL.gGGGg.LLMM.',
  'HLLLLLkBBBkLLLLMS',
  'HLeeLLbBBBbLLeeMS',
  'HLeeLLbBBBbLLeeMS',
  '.LLLLMbBBBbMLLMS.',
  '..LLMMbBBBbMMMS..',
  '..MMMS.bBb.SMMS..',
  '...MS..bBb..SM...',
  '....S...b...S....',
]
/** A firefly sparker: glassy wings and a tail lamp that blinks on the beat. */
const SPARKER_ROWS = [
  '....a...a....',
  '.....a.a.....',
  '..WW.kHk.WW..',
  '.WWWWkHkWWWW.',
  '..WWWkHkWWW..',
  '.....bBb.....',
  '.....bBb.....',
  '.....LYL.....',
  '.....YwY.....',
  '......Y......',
]
/** A skimmer: long flat wings for gliding a hand's breadth over the water. */
const SKIMMER_ROWS = [
  '.......a.a.......',
  '........k........',
  'HLLLLMMkBkMMLLLLH',
  '.SLLLMMbBbMMLLLS.',
  '...SSMMbBbMMSS...',
  '.......bBb.......',
  '........b........',
]
/** A dust duster: big fuzzy wings that shake loose a curtain of dust. */
const DUSTER_ROWS = [
  '...a.......a...',
  '....a.....a....',
  '.FFFF.kBk.FFFF.',
  'FFOFFFbBbFFFOFF',
  'FOOOFFbBbFFOOOF',
  'FFOFFFbBbFFFOFF',
  '.FFFfFbBbFfFFF.',
  '..FfffbBbfffF..',
  '...ff..b..ff...',
]
/** A moonlet: one of the three quick little moths a cocoon splits into. */
const MOONLET_ROWS = [
  '..a...a..',
  '.LL.k.LL.',
  'LLMLBLMLL',
  '.LMLBLML.',
  '..S.b.S..',
]
/** A cocoon moth wrapped in its silk, just before it splits. */
const WRAP_ROWS = [
  '..sSs..',
  '.sSWSs.',
  'sSWWWSs',
  'sSWSWSs',
  'sSWWWSs',
  '.sSWSs.',
  '..sSs..',
]
/** A folded paper crane, the Rooftop Festival's Glow Stage dancers. */
const CRANE_ROWS = [
  '......P......',
  '.....PpP.....',
  'W....PpP....W',
  'WW..WPpPW..WW',
  '.WWWWwPwWWWW.',
  '..WWwwPwwWW..',
  '....wwPww....',
  '.....wPw.....',
  '......t......',
]
/** An orchard leaf, the Falling Leaves dancers. */
const LEAF_ROWS = [
  '......s......',
  '.....LsL.....',
  '....LLsLL....',
  '...LLMsMLL...',
  '..LLMMsMMLL..',
  '..LMMMsMMML..',
  '...MMDsDMM...',
  '....MDsDM....',
  '.....DsD.....',
  '......s......',
]
/** A fish kite with its streamers, the Fish Kites dancers. */
const FISH_ROWS = [
  '.....HHH.....',
  '....HeHeH....',
  '...LLLLLLL...',
  '..LLMLLLMLL..',
  '...LMMLMML...',
  '....LMMML....',
  '.....MSM.....',
  '....T.S.T....',
  '...T..S..T...',
  '..T...S...T..',
]

const wingsOf = (ramp: Ramp) => ({
  H: ramp[4],
  L: ramp[3],
  M: ramp[2],
  S: ramp[1],
})

export const MOTHS = mothSet(MOTH_ROWS, {
  a: RAMPS.cream[1],
  k: INK,
  H: '#ffffff',
  L: RAMPS.cream[3],
  M: RAMPS.cream[2],
  S: RAMPS.cream[1],
  e: RAMPS.earth[2],
  B: RAMPS.gold[3],
  b: RAMPS.gold[1],
  O: RAMPS.rust[3],
  o: RAMPS.rust[2],
})
export const LUNAS = mothSet(LUNA_ROWS, {
  a: RAMPS.leaf[3],
  k: INK,
  ...wingsOf(RAMPS.leaf),
  e: RAMPS.pink[2],
  W: '#ffffff',
  w: RAMPS.cream[2],
  T: RAMPS.pink[2],
  P: RAMPS.pink[1],
})
/** Escort lunas wear the festival's rose and gold, the queen's own colours. */
export const ESCORTS = mothSet(LUNA_ROWS, {
  a: RAMPS.gold[3],
  k: INK,
  ...wingsOf(RAMPS.pink),
  e: RAMPS.gold[3],
  W: '#ffffff',
  w: RAMPS.gold[3],
  T: RAMPS.gold[3],
  P: RAMPS.rust[3],
})
const queenPalette = (wings: Ramp, body: Ramp) => ({
  a: RAMPS.gold[3],
  g: RAMPS.gold[3],
  G: RAMPS.gold[4],
  k: INK,
  ...wingsOf(wings),
  e: RAMPS.gold[3],
  B: body[3],
  b: body[1],
})
export const QUEENS = mothSet(
  QUEEN_ROWS,
  queenPalette(RAMPS.purple, RAMPS.pink),
)
/** A queen with one beam in her goes blue, as in the original. */
export const QUEENS_HURT = mothSet(
  QUEEN_ROWS,
  queenPalette(RAMPS.sky, RAMPS.teal),
)
/** Cocoon moths: silk-white with teal, the colour of the thread they spin. */
export const COCOONS = mothSet(MOTH_ROWS, {
  a: RAMPS.teal[3],
  k: INK,
  H: '#ffffff',
  L: RAMPS.steel[3],
  M: RAMPS.teal[3],
  S: RAMPS.teal[2],
  e: RAMPS.teal[1],
  B: RAMPS.steel[4],
  b: RAMPS.steel[2],
  O: RAMPS.teal[3],
  o: RAMPS.teal[2],
})
const sparkerPalette = (lit: boolean) => ({
  a: RAMPS.earth[3],
  k: INK,
  W: RAMPS.sky[3],
  H: RAMPS.ember[2],
  b: RAMPS.earth[2],
  B: RAMPS.earth[3],
  L: lit ? RAMPS.leaf[4] : RAMPS.leaf[1],
  Y: lit ? RAMPS.gold[4] : RAMPS.earth[1],
  w: lit ? '#ffffff' : RAMPS.earth[2],
})
export const SPARKERS = mothSet(SPARKER_ROWS, sparkerPalette(true))
export const SPARKERS_DARK = mothSet(SPARKER_ROWS, sparkerPalette(false))
export const SKIMMERS = mothSet(SKIMMER_ROWS, {
  a: RAMPS.water[3],
  k: INK,
  ...wingsOf(RAMPS.water),
  B: RAMPS.sky[4],
  b: RAMPS.sky[2],
})
export const DUSTERS = mothSet(DUSTER_ROWS, {
  a: RAMPS.earth[3],
  k: INK,
  F: RAMPS.gold[2],
  f: RAMPS.earth[3],
  O: RAMPS.rust[2],
  B: RAMPS.earth[4],
  b: RAMPS.earth[2],
})
export const MOONLETS = mothSet(MOONLET_ROWS, {
  a: RAMPS.purple[4],
  k: INK,
  L: RAMPS.purple[4],
  M: RAMPS.purple[3],
  S: RAMPS.purple[2],
  B: RAMPS.gold[4],
  b: RAMPS.gold[2],
})
export const WRAP = pixelSprite(WRAP_ROWS, {
  s: RAMPS.steel[2],
  S: RAMPS.steel[3],
  W: '#ffffff',
})
const paperPalette = (paper: Ramp) => ({
  W: paper[4],
  w: paper[3],
  P: paper[2],
  p: paper[3],
  t: paper[1],
})
export const CRANES = [
  mothSet(CRANE_ROWS, paperPalette(RAMPS.pink)),
  mothSet(CRANE_ROWS, paperPalette(RAMPS.sky)),
] as const
export const LEAVES = [
  mothSet(LEAF_ROWS, {
    s: RAMPS.earth[2],
    ...wingsOf(RAMPS.leaf),
    D: RAMPS.leaf[1],
  }),
  mothSet(LEAF_ROWS, {
    s: RAMPS.earth[2],
    ...wingsOf(RAMPS.gold),
    D: RAMPS.rust[2],
  }),
] as const
export const FISH = [
  mothSet(FISH_ROWS, {
    e: INK,
    ...wingsOf(RAMPS.ember),
    T: RAMPS.gold[3],
  }),
  mothSet(FISH_ROWS, {
    e: INK,
    ...wingsOf(RAMPS.water),
    T: RAMPS.pink[3],
  }),
] as const

/** Each kind's art (a sparker's is its lit frame; SPARKERS_DARK is the dark one). */
export const KIND_ART: Record<Kind, MothSet> = {
  moth: MOTHS,
  luna: LUNAS,
  escort: ESCORTS,
  queen: QUEENS,
  cocoon: COCOONS,
  sparker: SPARKERS,
  skimmer: SKIMMERS,
  duster: DUSTERS,
  moonlet: MOONLETS,
}

// --- the lantern ------------------------------------------------------------------------------

// The paper lantern: lit from inside, so the glow is in the middle and the rims are shaded.
const LANTERN_ROWS = [
  '....nmn....',
  '....n.n....',
  '..CCCCCCe..',
  '.cceeeeeed.',
  '.RooyyyooqD',
  'RoyYYYYYyoq',
  'RoyYwwwYyoq',
  'RoyYwwwYyoq',
  'RoyYYwYYyoq',
  'RooyyYyyooq',
  '.RoooooooqD',
  '..ceeeeed..',
  '....RoR....',
  '.....o.....',
]
const lanternPalette = (paper: Ramp, light: Ramp) => ({
  n: RAMPS.steel[1],
  m: RAMPS.steel[3],
  C: RAMPS.earth[3],
  c: RAMPS.earth[2],
  e: RAMPS.earth[1],
  d: RAMPS.earth[0],
  D: paper[0],
  R: paper[3],
  o: paper[2],
  q: paper[1],
  y: light[2],
  Y: light[3],
  w: light[4],
})
/** The flame gutters: the bright core shrinks on the second frame. */
const LANTERN_DIM_ROWS = LANTERN_ROWS.map((row, i) =>
  i === 6 || i === 8 ? row.replace(/w/g, 'Y') : row,
)
const LANTERN = [
  pixelSprite(LANTERN_ROWS, lanternPalette(RAMPS.rust, RAMPS.gold)),
  pixelSprite(LANTERN_DIM_ROWS, lanternPalette(RAMPS.rust, RAMPS.gold)),
] as const
/** A captured lantern burns low and red. */
const LANTERN_CAPTIVE = pixelSprite(
  LANTERN_DIM_ROWS,
  lanternPalette(RAMPS.ember, RAMPS.pink),
)
export const LIFE_SPRITE = pixelSprite(
  ['..n..', '.CCe.', 'RyYyq', 'RYwYq', 'RyYyq', '.cee.'],
  lanternPalette(RAMPS.rust, RAMPS.gold),
)

export function drawLantern(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  captive: boolean,
  tick: number,
) {
  const sprite = captive
    ? LANTERN_CAPTIVE
    : LANTERN[Math.floor(tick / 6 + x) % 2]!
  drawSprite(g, sprite, Math.round(x), Math.round(y) - 2)
}

/** The lantern's beam of light: no outline, it glows instead. */
export const BEAM_SPRITE = pixelSprite(
  ['.w.', 'wWw', 'YWY', 'YwY', 'yYy', '.y.', '.o.', '.o.'],
  {
    w: '#ffffff',
    W: RAMPS.gold[4],
    Y: RAMPS.gold[3],
    y: RAMPS.gold[2],
    o: RAMPS.rust[3],
  },
  { outline: null },
)
/** A Flock moth's beam: smaller, in the friend's own colour. */
export const FRIEND_BEAM_SPRITES = {
  straight: pixelSprite(
    ['w', 'Y', 'Y', 'y'],
    {
      w: '#ffffff',
      Y: RAMPS.cream[3],
      y: RAMPS.cream[2],
    },
    { outline: null },
  ),
  angled: pixelSprite(
    ['w', 'Y', 'y'],
    {
      w: '#ffffff',
      Y: RAMPS.leaf[4],
      y: RAMPS.leaf[3],
    },
    { outline: null },
  ),
  pierce: pixelSprite(
    ['.w.', 'wPw', 'PpP', '.p.', '.p.'],
    {
      w: '#ffffff',
      P: RAMPS.purple[3],
      p: RAMPS.purple[2],
    },
    { outline: null },
  ),
} as const

/** Moth dust: a glittering lilac mote. */
export const DUST_SPRITES = [
  pixelSprite(['.p.', 'pPp', '.p.'], { p: RAMPS.pink[2], P: '#ffffff' }),
  pixelSprite(['.P.', 'PpP', '.P.'], { p: RAMPS.pink[3], P: RAMPS.purple[3] }),
] as const
/** A turncoat captive's embers: the same mote, burning red. */
export const EMBER_SPRITES = [
  pixelSprite(['.p.', 'pPp', '.p.'], { p: RAMPS.ember[2], P: RAMPS.ember[4] }),
  pixelSprite(['.P.', 'PpP', '.P.'], { p: RAMPS.ember[3], P: RAMPS.ember[1] }),
] as const

/** The festival charms, each a little token that floats down to be caught. */
export const CHARM_SPRITES = {
  crane: pixelSprite(
    ['...P...', 'W.PpP.W', 'WWwPwWW', '.WwPwW.', '...t...'],
    paperPalette(RAMPS.pink),
  ),
  sparkler: pixelSprite(
    ['Y.y.Y', '.YwY.', 'yw#wy', '.YwY.', 'Y.s.Y', '..s..', '..s..'],
    {
      Y: RAMPS.gold[4],
      y: RAMPS.gold[3],
      w: '#ffffff',
      '#': RAMPS.ember[4],
      s: RAMPS.steel[3],
    },
  ),
  mirror: pixelSprite(['.sss.', 'sMMms', 'sMmms', 'smmms', '.sss.'], {
    s: RAMPS.steel[3],
    M: '#ffffff',
    m: RAMPS.sky[3],
  }),
  kite: pixelSprite(
    ['..K..', '.KkK.', 'KkKkK', '.KkK.', '..K..', '..t..', '.t...', '..t..'],
    { K: RAMPS.teal[3], k: RAMPS.teal[2], t: RAMPS.cream[3] },
  ),
} as const
