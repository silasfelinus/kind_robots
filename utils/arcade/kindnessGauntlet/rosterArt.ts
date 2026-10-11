// /utils/arcade/kindnessGauntlet/rosterArt.ts
//
// The glitches' own sprites and the generators that release them (conductor kr-arcade t-051). Every
// kind has a silhouette of its own, so a crowded floor still reads at a glance: the boxy static
// brute, the antennaed pop-up, the horned firewall imp, the masked pickpocket, the battery-backed
// leech, the coffee spill, the bug swarm's specks and the mimic snack that is a snack until it
// blinks. All original pixel art on utils/arcade/snes.ts.

import { INK, RAMPS, type PixelSprite, pixelSprite } from '../snes'
import type { GeneratorLook, GlitchKind } from './roster'

/** A frosted donut snack with sprinkles: the real one, and the face a mimic copies. */
export const SNACK_ROWS = [
  '..hhPPPp..',
  '.hPtPPwPp.',
  'hPPPppPyPq',
  'PwPp..qPPq',
  'gPPq..qPtq',
  'ogPPqqPPqO',
  '.oggqqqgO.',
  '..OooooO..',
] as const

export const SNACK_PALETTE = {
  h: RAMPS.pink[4],
  P: RAMPS.pink[3],
  p: RAMPS.pink[2],
  q: RAMPS.pink[1],
  t: RAMPS.teal[3],
  w: '#ffffff',
  y: RAMPS.gold[4],
  g: RAMPS.gold[3],
  o: RAMPS.gold[2],
  O: RAMPS.gold[1],
}

export const SNACK_SPRITE = pixelSprite(SNACK_ROWS, SNACK_PALETTE)

const MIMIC_PALETTE = {
  ...SNACK_PALETTE,
  k: INK,
  W: '#ffffff',
  r: RAMPS.ember[2],
}

/** The mimic: a snack (frame 0), a snack mid-blink (frame 1), and a snack with teeth (awake). */
const MIMIC_BLINK_ROWS = [
  '..hhPPPp..',
  '.hWkPPWkp.',
  'hPPPppPyPq',
  'PwPp..qPPq',
  'gPPq..qPtq',
  'ogPPqqPPqO',
  '.oggqqqgO.',
  '..OooooO..',
]
const MIMIC_AWAKE_ROWS = [
  '..hhPPPp..',
  '.hWkPPWkp.',
  'hPPPppPyPq',
  'PwPkkkkPPq',
  'gPPWkWkPtq',
  'ogPrrrrPqO',
  '.oggqqqgO.',
  '..OooooO..',
]
const MIMIC_SPRITES = [
  SNACK_SPRITE,
  pixelSprite(MIMIC_BLINK_ROWS, MIMIC_PALETTE),
  pixelSprite(MIMIC_AWAKE_ROWS, MIMIC_PALETTE),
]

const STATIC = {
  d: '#1c2338',
  s: '#3b4763',
  b: '#5d6b8c',
  l: '#9aa8c6',
  x: '#a5f3fc',
  w: '#ffffff',
  k: INK,
  L: '#c7d2fe',
  r: RAMPS.ember[3],
}
const BRUTE_ROWS = [
  [
    '...sbbbbbs...',
    '..sbxblbxbs..',
    '.sbbbbbbbbbs.',
    '.bwkbbbbbkwb.',
    '.bbkkbbbkkbb.',
    'ssbbbbxbbbbss',
    'LLsbbbbbbbsLL',
    'LLbsxbbbxsbLL',
    '.LsbbbbbbbsL.',
    '..sbbbbbbbs..',
    '..ss.....ss..',
    '.sss.....sss.',
  ],
  [
    'LL.sbbbbbs.LL',
    'LLsbxblbxbsLL',
    '.Ldbbbbbbbsl.',
    '.bwkbbbbbkwb.',
    '.bbkkbrbbkkb.',
    'ssbbbbxbbbbss',
    '.dsbbbbbbbsd.',
    '..bsxbbbxsb..',
    '..sbbbbbbbs..',
    '..sbbbbbbbs..',
    '..ss.....ss..',
    '.sss.....sss.',
  ],
]

const ROUTER = {
  s: '#1f2a44',
  b: '#334766',
  l: '#5b7aa6',
  a: RAMPS.steel[3],
  g: RAMPS.leaf[3],
  y: RAMPS.gold[4],
  w: '#ffffff',
  k: INK,
  m: RAMPS.ember[2],
}
const POPUP_ROWS = [
  [
    '.a.......a.',
    '.a.......a.',
    '.a.......a.',
    'sbbbbbbbbbs',
    'blwkbbbwklb',
    'blkkbbbkklb',
    'bbbbbmbbbbb',
    'sgbgbgbgbgs',
    '.sssssssss.',
  ],
  [
    '.y.......y.',
    '.a.......a.',
    '.a.......a.',
    'sbbbbbbbbbs',
    'blwkbbbwklb',
    'blkkbbbkklb',
    'bbbbmmmbbbb',
    'sbgbgbgbgbs',
    '.sssssssss.',
  ],
]

const IMP = {
  h: RAMPS.gold[4],
  o: RAMPS.ember[1],
  r: RAMPS.ember[2],
  R: RAMPS.ember[3],
  y: RAMPS.ember[4],
  w: '#ffffff',
  k: INK,
}
const IMP_ROWS = [
  [
    '.h.......h.',
    '.oh.....ho.',
    '..ooRRRoo..',
    '.oRRRRRRRo.',
    'oRwkRRRwkRo',
    'oRRRRRRRRRo',
    '.oRRyyyRRo.',
    '..oRRRRRo..',
    '...o.o.o...',
  ],
  [
    '.h.......h.',
    '.oh.....ho.',
    '..ooRRRoo..',
    '.oRRRRRRRo.',
    'oRkwRRRkwRo',
    'oRRRRRRRRRo',
    '.oRRRyRRRo.',
    '..oRRRRRo..',
    '..o.o.o.o..',
  ],
]
const IMP_INHALE_ROWS = [
  '.h.......h.',
  '.oh.....ho.',
  '..ooyyyoo..',
  '.oyyyyyyyo.',
  'oywkyyywkyo',
  'oyyyyyyyyyo',
  '.oyykkkyyo.',
  '..oyyyyyo..',
  '...o.o.o...',
]

const BANDIT = {
  p: RAMPS.purple[1],
  P: RAMPS.purple[2],
  L: RAMPS.purple[3],
  k: INK,
  w: '#ffffff',
  g: RAMPS.gold[4],
  s: RAMPS.earth[2],
  S: RAMPS.earth[3],
}
const PICKPOCKET_ROWS = [
  [
    '...pppp...',
    '..pLLLLp..',
    '.pkkkkkkp.',
    '.pwkPPwkp.',
    '.pPPPPPPp.',
    '..pPggPp..',
    '..pPPPPp..',
    '.ppPPPPpp.',
    '.p.p..p.p.',
  ],
  [
    '...pppp...',
    '..pLLLLp..',
    '.pkkkkkkp.',
    '.pkwPPkwp.',
    '.pPPPPPPp.',
    '..pgggPp..',
    '..pPPPPp..',
    '.ppPPPPpp.',
    '..p.pp.p..',
  ],
]
/** The sack a pickpocket runs off with. */
export const LOOT_SACK = pixelSprite(['.S.', 'sSs', 'sss'], BANDIT)

const LEECH = {
  g: RAMPS.leaf[1],
  G: RAMPS.leaf[2],
  L: RAMPS.leaf[3],
  b: RAMPS.steel[1],
  B: RAMPS.steel[3],
  y: RAMPS.gold[4],
  w: '#ffffff',
  k: INK,
}
const LEECH_ROWS = [
  [
    '....gggg....',
    '..gGGLLGg...',
    '.gGGBBBBGg..',
    'gGwkGByyBGg.',
    'gGGGGBBBBGGg',
    '.ggGGGGGGGgg',
    '...g.g..g.g.',
  ],
  [
    '...gggg.....',
    '.gGGLLGgg...',
    'gGGGBBBBGg..',
    'gwkGGByyBGgg',
    'gGGGGBBBBGGg',
    '.ggGGGGGGGg.',
    '..g.g..g.g..',
  ],
]

const BUG = {
  b: RAMPS.leaf[2],
  B: RAMPS.gold[3],
  w: RAMPS.sky[4],
  k: INK,
}
const BUG_ROWS = [
  ['w.w', 'bBb', '.b.'],
  ['.w.', 'bBb', 'b.b'],
]

const PLAIN_GLITCH = {
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
export const GLITCH_PALETTE = PLAIN_GLITCH
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

const TAPE = {
  d: RAMPS.earth[0],
  s: RAMPS.earth[1],
  b: RAMPS.earth[2],
  l: RAMPS.earth[3],
  h: RAMPS.cream[3],
  w: '#ffffff',
  k: INK,
  r: RAMPS.rust[3],
}
const WORM_HEAD_ROWS = [
  [
    '..sbbbs..',
    '.sblllbs.',
    'sbwkblwkb',
    'sbkkbbkkb',
    'sbbbbbbbs',
    '.sbrrrbs.',
    '..sbbbs..',
  ],
  [
    '..sbbbs..',
    '.sblllbs.',
    'sbkwblkwb',
    'sbkkbbkkb',
    'sbbbbbbbs',
    '.sbbrbbs.',
    '..sbbbs..',
  ],
]
/** A worm segment: a little reel of tape. */
export const WORM_SEGMENT = pixelSprite(
  ['.sbbs.', 'sbhlbs', 'blkkhb', 'bhkklb', 'sblhbs', '.sbbs.'],
  TAPE,
)

const SCREEN = {
  c: RAMPS.steel[1],
  C: RAMPS.steel[2],
  L: RAMPS.steel[3],
  H: RAMPS.steel[4],
  b: RAMPS.sky[1],
  B: RAMPS.sky[2],
  l: RAMPS.sky[3],
  w: '#ffffff',
  k: INK,
  s: RAMPS.night[1],
}
/** The Big Bluescreen: a hulking old monitor showing a sad blue face, on stubby legs. */
function bluescreenRows(fill: boolean): string[] {
  return raster(30, 24, (x, y) => {
    if (y >= 21) return x === 6 || x === 7 || x === 22 || x === 23 ? 'c' : '.'
    const edge = (x === 0 || x === 29) && (y === 0 || y === 20)
    if (edge) return '.'
    if (y === 0 || x === 0) return 'H'
    if (y === 20 || x === 29) return 'c'
    if (y === 1 || x === 1) return 'L'
    if (y === 19 || x === 28) return 'C'
    if (y === 18 && x > 3 && x < 26) return x % 3 ? 'C' : 'k'
    if (x < 3 || x > 26 || y < 3 || y > 16) return 'C'
    // The screen: blue, a frowning face, scanlines (all paler while it fills to breathe).
    const eye =
      (y === 7 || y === 8) && (x === 10 || x === 11 || x === 18 || x === 19)
    if (eye) return 'w'
    const mouth =
      (y === 12 && x >= 11 && x <= 18) || (y === 13 && (x === 10 || x === 19))
    if (mouth) return 'w'
    if (y % 3 === 0) return fill ? 'l' : 'b'
    return fill ? 'l' : 'B'
  })
}
const BLUESCREEN_FRAMES = [
  pixelSprite(bluescreenRows(false), SCREEN),
  pixelSprite(bluescreenRows(true), SCREEN),
]

/** Each kind's two walk frames. */
export const GLITCH_FRAMES: Record<GlitchKind, readonly PixelSprite[]> = {
  glitch: GLITCH_ROWS.map((r) => pixelSprite(r, PLAIN_GLITCH)),
  brute: BRUTE_ROWS.map((r) => pixelSprite(r, STATIC)),
  popup: POPUP_ROWS.map((r) => pixelSprite(r, ROUTER)),
  imp: IMP_ROWS.map((r) => pixelSprite(r, IMP)),
  pickpocket: PICKPOCKET_ROWS.map((r) => pixelSprite(r, BANDIT)),
  leech: LEECH_ROWS.map((r) => pixelSprite(r, LEECH)),
  spill: [],
  bug: BUG_ROWS.map((r) => pixelSprite(r, BUG)),
  mimic: MIMIC_SPRITES,
  worm: WORM_HEAD_ROWS.map((r) => pixelSprite(r, TAPE)),
  bluescreen: BLUESCREEN_FRAMES,
}

/** The cyan ghost the plain glitch smears beside itself (chromatic split). */
export const GLITCH_GHOSTS = GLITCH_ROWS.map((rows) =>
  pixelSprite(
    rows,
    Object.fromEntries(
      Object.keys(PLAIN_GLITCH).map((key) => [key, RAMPS.teal[3]]),
    ),
    { outline: null },
  ),
)

/** The firewall imp mid-inhale: its tell, glowing white-hot. */
export const IMP_INHALE = pixelSprite(IMP_INHALE_ROWS, IMP)

/** Any sprite all white: the hit flash. */
export function whiteOf(sprite: PixelSprite): PixelSprite {
  return {
    width: sprite.width,
    height: sprite.height,
    pixels: sprite.pixels.map((p) =>
      p ? (p === INK ? INK : '#ffffff') : null,
    ),
  }
}

export const GLITCH_FLASH: Record<GlitchKind, readonly PixelSprite[]> =
  Object.fromEntries(
    Object.entries(GLITCH_FRAMES).map(([k, frames]) => [
      k,
      frames.map(whiteOf),
    ]),
  ) as unknown as Record<GlitchKind, readonly PixelSprite[]>

// --- the generators ---------------------------------------------------------------------------

/** Rows of palette letters from a per-pixel painter ('.' is clear). */
export function raster(
  w: number,
  h: number,
  paint: (x: number, y: number) => string,
): string[] {
  return Array.from({ length: h }, (_, y) =>
    Array.from({ length: w }, (_, x) => paint(x, y)).join(''),
  )
}

/** A bevelled box: the shell every machine is built on (0..4 dark to light, '.' clear corners). */
function shell(x: number, y: number, w: number, h: number): string | null {
  const edge = (x === 0 || x === w - 1) && (y === 0 || y === h - 1)
  if (edge) return '.'
  if (y === h - 1 || x === w - 1) return '0'
  if (y === h - 2 || x === w - 2) return '1'
  if (y === 0 || x === 0) return '4'
  if (y === 1 || x === 1) return '3'
  return null
}

const LOOK_ROWS: Record<GeneratorLook, string[]> = {
  // The plain glitch cabinet: a battered steel box with a static screen and a vent.
  cabinet: raster(14, 14, (x, y) => {
    const s = shell(x, y, 14, 14)
    if (s) return s
    if (y >= 2 && y <= 7 && x >= 2 && x <= 11) return 'k'
    if ((y === 9 || y === 10) && x >= 3 && x <= 10 && x % 2 === 1) return 'v'
    return '2'
  }),
  // A card feeder: a beige hopper with punched cards fanned out of its slot.
  feeder: raster(14, 14, (x, y) => {
    if (y <= 3) {
      if (x >= 3 && x <= 10 && y >= 1) return (x + y) % 3 === 0 ? 'v' : 'c'
      return '.'
    }
    const s = shell(x, y - 4, 14, 10)
    if (s) return s
    if (y === 6 && x >= 3 && x <= 10) return 'k'
    if (y >= 8 && y <= 10 && x >= 3 && x <= 6) return 'k'
    if (y === 9 && x >= 8 && x <= 10) return 'v'
    return '2'
  }),
  // A router: a low dark box on legs with two antennas and a row of lamps.
  router: raster(14, 14, (x, y) => {
    if (y <= 4) return x === 2 || x === 11 ? (y === 0 ? 'c' : '3') : '.'
    if (y >= 12) return x === 2 || x === 11 ? '1' : '.'
    const s = shell(x, y - 5, 14, 7)
    if (s) return s
    if (y === 8 && x >= 3 && x <= 10) return x % 2 ? 'c' : 'k'
    return '2'
  }),
  // A tape reel on a stand: a round reel with three spokes over a little plinth.
  reel: raster(14, 14, (x, y) => {
    const dx = x - 6.5
    const dy = y - 5.5
    const r = Math.hypot(dx, dy)
    if (y >= 11)
      return x >= 3 && x <= 10 ? (y === 13 ? '0' : y === 11 ? '4' : '2') : '.'
    if (r > 6) return '.'
    if (r > 5.2) return '1'
    if (r < 1.3) return 'k'
    const a = Math.atan2(dy, dx)
    const spoke = Math.abs(Math.sin(a * 1.5)) < 0.35
    if (r < 4 && spoke) return '4'
    if (r < 4) return 'k'
    return r > 4.6 ? '3' : 'c'
  }),
  // A coffee urn: a tall drum with a lid, a tap and a dribble.
  urn: raster(14, 14, (x, y) => {
    if (y === 0) return x >= 5 && x <= 8 ? '4' : '.'
    if (y === 1) return x >= 3 && x <= 10 ? '3' : '.'
    if (y >= 2 && y <= 11 && x >= 3 && x <= 10) {
      if (x === 3) return '4'
      if (x === 10) return '0'
      if (x === 9) return '1'
      if (y >= 5 && y <= 7 && x >= 5 && x <= 7) return 'c'
      return '2'
    }
    if (y === 8 && (x === 11 || x === 12)) return 'k'
    if (y >= 9 && y <= 10 && x === 12) return 'v'
    if (y >= 12 && x >= 2 && x <= 11) return y === 13 ? '0' : '1'
    return '.'
  }),
  // A bug nest: a domed box riddled with holes.
  nest: raster(14, 14, (x, y) => {
    const dx = x - 6.5
    if (y < 3 && Math.abs(dx) > 2 + y * 2) return '.'
    const s = shell(x, y, 14, 14)
    if (s && y > 2) return s
    if (y <= 1) return '3'
    if ((x + y * 3) % 5 === 0 && y > 2 && y < 12 && x > 1 && x < 12) return 'k'
    return y % 3 === 0 ? 'c' : '2'
  }),
  // A snack vending machine: a tall glass front full of snacks, and a coin slot.
  vending: raster(14, 14, (x, y) => {
    const s = shell(x, y, 14, 14)
    if (s) return s
    if (x >= 2 && x <= 8 && y >= 2 && y <= 10) {
      if (y % 3 === 1) return '1'
      return (x + y) % 3 === 0 ? 'v' : 'k'
    }
    if (x === 10 && y >= 3 && y <= 5) return 'c'
    if (y >= 11 && x >= 2 && x <= 8) return 'k'
    return '2'
  }),
}

/** Each look's colour scheme (the shell ramp and its accents). */
const LOOK_PALETTE: Record<GeneratorLook, Record<string, string>> = {
  cabinet: {
    ...rampKeys(RAMPS.steel),
    k: INK,
    v: RAMPS.night[0],
    c: RAMPS.teal[3],
  },
  feeder: {
    ...rampKeys(RAMPS.cream),
    k: INK,
    v: RAMPS.earth[2],
    c: RAMPS.cream[3],
  },
  router: {
    ...rampKeys(RAMPS.night),
    k: INK,
    v: RAMPS.night[0],
    c: RAMPS.leaf[3],
  },
  reel: {
    ...rampKeys(RAMPS.earth),
    k: INK,
    v: RAMPS.night[0],
    c: RAMPS.rust[3],
  },
  urn: { ...rampKeys(RAMPS.rust), k: INK, v: RAMPS.earth[1], c: RAMPS.gold[3] },
  nest: {
    ...rampKeys(RAMPS.leaf),
    k: INK,
    v: RAMPS.night[0],
    c: RAMPS.leaf[3],
  },
  vending: {
    ...rampKeys(RAMPS.pink),
    k: INK,
    v: RAMPS.gold[3],
    c: RAMPS.gold[4],
  },
}

function rampKeys(ramp: readonly string[]): Record<string, string> {
  return { 0: ramp[0]!, 1: ramp[1]!, 2: ramp[2]!, 3: ramp[3]!, 4: ramp[4]! }
}

export const GENERATOR_SPRITES = Object.fromEntries(
  (Object.keys(LOOK_ROWS) as GeneratorLook[]).map((look) => {
    const sprite = pixelSprite(LOOK_ROWS[look], LOOK_PALETTE[look])
    return [look, { sprite, flash: whiteOf(sprite) }]
  }),
) as Record<GeneratorLook, { sprite: PixelSprite; flash: PixelSprite }>

/** Where a generator's screen or mouth sits, for its static and its tier lamps. */
export const LOOK_SCREEN: Record<
  GeneratorLook,
  { x: number; y: number } | null
> = {
  cabinet: { x: 0, y: -2 },
  feeder: { x: -2, y: 2 },
  router: null,
  reel: null,
  urn: null,
  nest: null,
  vending: null,
}

/** The three tiers' lamp colours: tier 3 releases the toughest. */
export const TIER_COLOURS = [
  RAMPS.leaf[3],
  RAMPS.gold[3],
  RAMPS.ember[3],
] as const
