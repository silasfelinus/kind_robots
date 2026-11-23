// /utils/arcade/games/pixelHop.ts
//
// Pixel Hop -- the Kind Robots Arcade's Q*bert riff (conductor kr-arcade/t-009
// game factory, batch 3). Hop a board of tiles diagonally and repaint every
// top to the target colour. Gumballs drop in at the top and bounce down; a
// purple gumball hatches into Boing, a grumpy spring bot who follows you hop by
// hop. Hop off the edge onto a floating disc and it whisks you back to the
// top (and Boing, if he's right behind you, boings off after you). A green
// gumball freezes everyone for a few seconds; a repaint gremlin hops down
// undoing your work until you catch it.
//
// The Painted Planets (conductor kr-arcade t-084): the campaign hops from
// planet to planet, six rounds each, on boards of any shape (pyramids, rings,
// a tightrope bridge) authored as data in pixelHopPlanets.ts. Round 5 of each
// planet is a picture board, painted tile by tile in its own colours from paint
// pots, and finished pictures hang in the Gallery; round 6 is a boss. A rule
// demonstration opens every new rule, a title card every planet, and the run
// saves at each planet. Endless Pyramid keeps the classic marathon: the
// painting rule tightens every four rounds (one hop, two hops, flip back, both,
// cycle) and a new foe joins every four rounds.
//
// Arrows hop diagonally, the classic way round: Up hops up-right, Right
// down-right, Down down-left, Left up-left.

import { levelCurve } from '../curve'
import { drawText } from '../font'
import {
  INK,
  RAMPS,
  Sparkles,
  backdropRng,
  bandedGradient,
  cachedLayer,
  drawRidge,
  drawSprite,
  drawStars,
  dropShadow,
  gauge,
  glow,
  hudPanel,
  mix,
  pixelSprite,
  rgba,
  ridge,
  shadedOrb,
  starField,
  vignette,
} from '../snes'
import type { PixelSprite, Ramp } from '../snes'
import type { MusicLoop } from '../sound'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'
import {
  boardRows,
  cellKey,
  endlessFoes,
  endlessPressure,
  prismComplete,
  pyramidBoard,
  ruleDemo,
  RULES,
  sidewaysStep,
  speedPaintBonus,
  speedPaintPar,
  stripeComplete,
} from './pixelHopBoards'
import type { HopBoard, HopCell, RuleId } from './pixelHopBoards'
import {
  BOSS_MUSIC,
  GLOBE_CRACKS,
  MAP_PLANETS,
  MAX_PHASES,
  PICTURES,
  PLANETS,
  PLANET_START,
  RATTLE_DIZZY,
  RATTLE_LOOP,
  RATTLE_PHASES,
  RULE_CAPTIONS,
  SPIRAL_ENTRIES,
  STAGES,
  coinRing,
  firstOfRule,
  readHopSave,
} from './pixelHopPlanets'
import type { BossId, FoeId, HopSave, Picture, Scheme } from './pixelHopPlanets'

const W = 256
const H = 240
const CUBE_W = 28
const ROW_H = 21
const FACE_H = 14
const SIDE_H = 16
const APEX_X = W / 2
const APEX_Y = 44
const HOP_TICKS = 16
const SPRING_TICKS = 26
const START_LIVES = 3
const ROUND_CLEAR_TICKS = 140
const DEATH_TICKS = 100
const FREEZE_TICKS = 60 * 4
const ROUNDS_PER_LEVEL = 4
const EXTRA_EVERY = 12_000
const TITLE_TICKS = 170
const DEMO_LEAD = 40
const DEMO_HOP = 36
const DEMO_TICKS = DEMO_LEAD + DEMO_HOP * 5 + 60
const MAP_TICKS = 60 * 7
/** Endless round the campaign's encore picks up at, once every planet is painted. */
const ENCORE_ROUND = STAGES.length + 1

const PAINT_POINTS = 25
const STRIPE_POINTS = 150
const PRISM_POINTS = 100
const ROUND_BONUS = 1000
const BOING_LURE_POINTS = 500
const GREMLIN_POINTS = 300
const FREEZE_POINTS = 100
const PICTURE_POINTS = 2000
const GOLD_POINTS = 3000
const SNEEZE_POINTS = 1000
const RATTLE_BONK_POINTS = 1000
const BOSS_POINTS = 5000

export const HOP_CURVES = {
  /** Ticks between enemy hops (lower is faster). */
  enemyHop: { start: 30, step: -1.5, limit: 16 },
  /** Ticks between new gumballs. */
  dropEvery: { start: 260, step: -14, limit: 110 },
  /** Chance a new arrival is a repaint gremlin. */
  gremlinChance: { start: -0.15, step: 0.05, limit: 0.3 },
} as const

/** Endless Pyramid's colour schemes, a new one each round. */
const SCHEMES: readonly Scheme[] = [
  {
    id: 'space-blue',
    left: '#1e3a8a',
    right: '#172554',
    start: '#60a5fa',
    mid: '#a78bfa',
    target: '#fde047',
  },
  {
    id: 'space-lime',
    left: '#365314',
    right: '#1a2e05',
    start: '#a3e635',
    mid: '#2dd4bf',
    target: '#f472b6',
  },
  {
    id: 'space-ember',
    left: '#7c2d12',
    right: '#431407',
    start: '#fb923c',
    mid: '#facc15',
    target: '#38bdf8',
  },
  {
    id: 'space-grape',
    left: '#581c87',
    right: '#3b0764',
    start: '#c084fc',
    mid: '#f9a8d4',
    target: '#4ade80',
  },
]

type Cell = HopCell
/** Up-right, down-right, down-left, up-left. */
const MOVES: Array<[number, number]> = [
  [-1, 0],
  [1, 1],
  [1, 0],
  [-1, -1],
]
type Hopper = {
  r: number
  c: number
  /** Where the current hop started (and the timer through it). */
  fr: number
  fc: number
  hop: number
  /** Off the board: falling to the bottom of the screen. */
  falling: number
  /** Ticks the current hop lasts, and how high it arcs (a spring launch is longer and higher). */
  span?: number
  arc?: number
}
type EnemyKind =
  | 'gumball'
  | 'purple'
  | 'boing'
  | 'green'
  | 'gremlin'
  | 'skitter'
  | 'snowball'
  | 'frost'
/** `side` is a skitter's sliding direction along its row. */
type Enemy = Hopper & {
  kind: EnemyKind
  wait: number
  side?: -1 | 1
  size?: number
}
type Disc = { r: number; c: number; used: boolean }
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = { x: number; y: number; text: string; life: number }
type Mode = 'planets' | 'endless'
/** What a round plays on, whichever mode set it. */
type RoundSetup = {
  board: HopBoard
  rule: RuleId
  foes: readonly FoeId[]
  pace: number
  scheme: Scheme
  sky: 'space' | 'comet' | 'ring' | 'glacier'
  picture?: Picture
  boss?: BossId
}
/** The screens that hold play: the mode menu, Gallery, planet map, title card and rule demonstration. */
type Screen =
  | { kind: 'menu'; cursor: number }
  | { kind: 'gallery' }
  | { kind: 'map'; t: number; final: boolean }
  | { kind: 'title'; t: number }
  | { kind: 'demo'; t: number; rule: RuleId }
type MenuItem = 'continue' | 'planets' | 'endless' | 'gallery'
/** Gumball Machine Max: which ring he wants painted, and his volley clock. */
type MaxBoss = {
  kind: 'max'
  phase: number
  sneezes: number
  ring: Cell[]
  timer: number
  left: number
  volleys: number
  spiral: number
  sneeze: number
  spit: number
}
/** Ringmaster Rattle: where he is on his loop, which way he spins, and how dizzy he is. */
type RattleBoss = Hopper & {
  kind: 'rattle'
  phase: number
  bonks: number
  i: number
  dir: 1 | -1
  wait: number
  dizzy: number
  streak: number
}
/** Snow Globe: light four ice cracks in order while it shakes the moon. */
type GlobeBoss = {
  kind: 'globe'
  cracks: number
  timer: number
  shaking: number
}

type Boss = MaxBoss | RattleBoss | GlobeBoss
type Rule = {
  id: RuleId
  hops: 1 | 2
  flips: boolean
  cycle: boolean
  picture: boolean
}

function ruleOf(id: RuleId): Rule {
  return {
    id,
    hops: id === 'two' || id === 'both' ? 2 : 1,
    flips: id === 'flip' || id === 'both',
    cycle: id === 'cycle',
    picture: id === 'picture',
  }
}

// --- 16-bit art (utils/arcade/snes.ts) -------------------------------------------

/** A five-step ramp around `base`: cool deep shadows, warm creamy lights. */
function rampOf(base: string): Ramp {
  return [
    mix(base, '#0c0628', 0.62),
    mix(base, '#1c0e48', 0.32),
    base,
    mix(base, '#fff3d6', 0.42),
    mix(base, '#ffffff', 0.76),
  ]
}

/** Ramp letters for the top ('0'-'4'), the lit left side ('a'-'e') and the shaded right ('v'-'z'). */
function cubePalette(top: Ramp, left: Ramp, right: Ramp) {
  const out: Record<string, string> = {}
  for (let i = 0; i < 5; i++) {
    out[String(i)] = top[i]!
    out['abcde'[i]!] = left[i]!
    out['vwxyz'[i]!] = right[i]!
  }
  return out
}

/**
 * An isometric cube as sprite rows, `w` wide with a `faceH` diamond on top and `sideH` sides:
 * a glossy top lit from the upper left with a bevelled rim, a lit left side and a shaded right,
 * each with an engraved inset panel when `detail` is on.
 */
function cubeRows(w: number, faceH: number, sideH: number, detail: boolean) {
  const half = w / 2
  const top = faceH / 2
  const rows: string[] = []
  for (let py = 0; py < faceH + sideH; py++) {
    let row = ''
    for (let px = 0; px < w; px++) {
      const fx = px + 0.5 - half
      const fy = py + 0.5 - top
      const dither = (px + py) % 2 ? 0.07 : -0.07
      const u = fx / half
      const v = fy / top
      const d = Math.abs(u) + Math.abs(v)
      if (d <= 1) {
        // The top face: rim, gloss spot, then a lit-to-shadow sweep.
        if (d > 0.84) row += v < 0 ? (u <= 0 ? '4' : '3') : '1'
        else if (detail && (u + 0.3) ** 2 / 0.05 + (v + 0.3) ** 2 / 0.1 < 1)
          row += '4'
        else {
          const s = u * 0.4 + v * 0.6 + dither
          row += s < -0.38 ? '3' : s > 0.4 ? '1' : '2'
        }
        continue
      }
      const edge = top - Math.abs(fx) / 2
      const below = fy - edge
      const above = edge + sideH - fy
      if (fy < 0 || above < 0) {
        row += '.'
        continue
      }
      const inner = Math.abs(fx)
      const outer = half - Math.abs(fx)
      const left = fx < 0
      // A recessed panel set into each side: shadowed lip at the top and outer edge, lit lip
      // at the bottom and inner edge, its floor a step darker than the frame round it.
      const panel =
        detail && below > 3 && above > 2.5 && inner > 2.5 && outer > 2.5
      let k: number
      if (below <= 1) k = left ? 4 : 3
      else if (above <= 1) k = 0
      else if (left && inner < 1) k = 3
      else if (panel && (below <= 4 || outer <= 3.5)) k = 0
      else if (panel && (above <= 3.5 || inner <= 3.5)) k = left ? 3 : 2
      else if (panel) k = 1
      else if (detail) k = left ? 2 : 1
      else k = (left ? 3 : 2) - (below + dither * 8 < 4 ? 0 : 1)
      row += (left ? 'abcde' : 'vwxyz')[k]!
    }
    rows.push(row)
  }
  return rows
}

const CUBE_ROWS = cubeRows(CUBE_W, FACE_H, SIDE_H, true)
const MINI_ROWS = cubeRows(14, 8, 6, false)

const cubeCache = new Map<string, PixelSprite>()
/** A board cube with this top colour on this scheme's sides, built once and kept. */
function cubeSprite(top: string, scheme: Scheme): PixelSprite {
  const key = `${top}|${scheme.left}|${scheme.right}`
  let sprite = cubeCache.get(key)
  if (!sprite) {
    sprite = pixelSprite(
      CUBE_ROWS,
      cubePalette(rampOf(top), rampOf(scheme.left), rampOf(scheme.right)),
    )
    cubeCache.set(key, sprite)
  }
  return sprite
}

const miniCache = new Map<string, PixelSprite>()
/** A little cube for the HUD and the rule demonstration's legend. */
function miniCube(top: string, scheme: Scheme): PixelSprite {
  const key = `${top}|${scheme.left}|${scheme.right}`
  let sprite = miniCache.get(key)
  if (!sprite) {
    sprite = pixelSprite(
      MINI_ROWS,
      cubePalette(rampOf(top), rampOf(scheme.left), rampOf(scheme.right)),
    )
    miniCache.set(key, sprite)
  }
  return sprite
}

/** A picture cube still waiting for its colour: a faint wash of it over slate. */
const ghostOf = (colour: string) => mix(colour, '#3b4763', 0.62)

/** A white top face, added over a tile as it changes colour. */
const TOP_FLASH = pixelSprite(
  cubeRows(CUBE_W, FACE_H, 0, false).map((r) => r.replace(/[0-4]/g, 'w')),
  { w: '#ffffff' },
  { outline: null },
)

/** The escape disc: a spinning rainbow platter, four frames, with a rim underneath. */
const DISC_RAMPS = [RAMPS.ember, RAMPS.gold, RAMPS.leaf, RAMPS.sky] as const
const DISC_SPRITES = [0, 1, 2, 3].map((frame) => {
  const palette: Record<string, string> = { h: '#ffffff', H: RAMPS.gold[4] }
  DISC_RAMPS.forEach((ramp, i) =>
    ramp.forEach((c, k) => (palette[String.fromCharCode(65 + i * 5 + k)] = c)),
  )
  const inside = (fx: number, fy: number) =>
    (fx / 8.5) ** 2 + (fy / 3.6) ** 2 <= 1
  const rows: string[] = []
  for (let py = 0; py < 9; py++) {
    let row = ''
    for (let px = 0; px < 17; px++) {
      const fx = px - 8
      const fy = py - 3
      const top = inside(fx, fy)
      const rim = !top && fy > 0 && inside(fx, fy - 2)
      if (!top && !rim) {
        row += '.'
        continue
      }
      if (top && Math.abs(fx) <= 1 && Math.abs(fy) <= 0) {
        row += fx < 0 ? 'h' : 'H'
        continue
      }
      const sector = Math.floor(
        ((Math.atan2(fy * 2.4, fx) + Math.PI) / (Math.PI * 2)) * 8,
      )
      const band = (sector + frame) % 4
      const shade = rim
        ? inside(fx, fy - 1)
          ? 1
          : 0
        : !inside(fx, fy - 1)
          ? 4
          : fy < 0
            ? 3
            : 2
      row += String.fromCharCode(65 + band * 5 + shade)
    }
    rows.push(row)
  }
  return pixelSprite(rows, palette)
})

/** A sphere lit from the upper left, as ramp letters '0'-'4'. */
function orbRows(w: number, h: number): string[] {
  const rows: string[] = []
  for (let py = 0; py < h; py++) {
    let row = ''
    for (let px = 0; px < w; px++) {
      const nx = (px + 0.5 - w / 2) / (w / 2)
      const ny = (py + 0.5 - h / 2) / (h / 2)
      const rr = nx * nx + ny * ny
      if (rr > 1) {
        row += '.'
        continue
      }
      const l = nx * -0.5 + ny * -0.6 + Math.sqrt(1 - rr) * 0.62
      row +=
        l > 0.9 ? '4' : l > 0.62 ? '3' : l > 0.2 ? '2' : l > -0.2 ? '1' : '0'
    }
    rows.push(row)
  }
  return rows
}

/** `rows` with `art` laid over it at (x, y); '.' in the art leaves the row alone. */
function stamp(rows: readonly string[], x: number, y: number, art: string[]) {
  const out = [...rows]
  art.forEach((line, dy) => {
    const row = out[y + dy]
    if (row === undefined) return
    let next = ''
    for (let i = 0; i < row.length; i++) {
      const ch = line[i - x]
      next += ch && ch !== '.' && i >= x ? ch : row[i]!
    }
    out[y + dy] = next
  })
  return out
}

function rampPalette(ramp: Ramp): Record<string, string> {
  return { 0: ramp[0], 1: ramp[1], 2: ramp[2], 3: ramp[3], 4: ramp[4] }
}

/** Gumballs per kind: round in the air, squashed as they land. */
const GUMBALL_LOOKS = {
  gumball: { ramp: RAMPS.ember, eyes: false },
  purple: { ramp: RAMPS.purple, eyes: true },
  green: { ramp: RAMPS.leaf, eyes: false },
  skitter: { ramp: RAMPS.water, eyes: true },
  snowball: { ramp: RAMPS.sky, eyes: false },
  frost: { ramp: RAMPS.cream, eyes: true },
} as const
const GUMBALL_SPRITES = Object.fromEntries(
  Object.entries(GUMBALL_LOOKS).map(([kind, look]) => {
    const palette = { ...rampPalette(look.ramp), w: '#ffffff', k: INK }
    const round = orbRows(10, 10)
    const squash = orbRows(12, 8)
    return [
      kind,
      [
        pixelSprite(
          look.eyes ? stamp(round, 3, 3, ['wk.wk', 'kk.kk']) : round,
          palette,
        ),
        pixelSprite(
          look.eyes ? stamp(squash, 4, 2, ['wk.wk', 'kk.kk']) : squash,
          palette,
        ),
      ],
    ]
  }),
) as Record<
  'gumball' | 'purple' | 'green' | 'skitter' | 'snowball' | 'frost',
  [PixelSprite, PixelSprite]
>

/** Pip: a round tangerine pixel-bot with a snorkel nose and big purple sneakers. */
const PIP_RAMP: Ramp = ['#4a1606', '#9a3a0c', '#f07a1f', '#ffb15e', '#fff1d0']
const PIP_PALETTE = {
  d: PIP_RAMP[0],
  o: PIP_RAMP[1],
  O: PIP_RAMP[2],
  L: PIP_RAMP[3],
  H: PIP_RAMP[4],
  N: '#ffe0b0',
  n: RAMPS.rust[3],
  s: RAMPS.rust[2],
  w: '#ffffff',
  k: INK,
  c: RAMPS.pink[3],
  F: RAMPS.purple[3],
  f: RAMPS.purple[2],
  g: RAMPS.purple[1],
}
const PIP_FRONT = [
  '....OOOOO.......',
  '..OLLLOOOOO.....',
  '.OLHwwwOwwwo....',
  '.OLHwkkOwkko....',
  'OLLLwkkOwkkoo...',
  'OLLOwwwOwwwoNN..',
  'OOOOOOOOOOOnNNNk',
  'oOcOOOOOOcOosss.',
  'oOOOOOOOOOOo....',
  '.ooOOOOOOOoo....',
  '..oooooooood....',
  '....ddddd.......',
]
const PIP_BACK = [
  '....OOOOO.......',
  '..OLLLOOOOO.....',
  '.OLHHLOOOOOoNn..',
  '.OLHLOOOOOOoNNs.',
  'OLLLOOOOOOOoss..',
  'OLLOOOOOOOOOo...',
  'Ooooooooooooo...',
  'oOLOOOOOOOOOo...',
  'oOOOOOOOOOOo....',
  '.ooOOOOOOOoo....',
  '..oooooooood....',
  '....ddddd.......',
]
const PIP_STAND = ['....d.....d.....', '..fFFFf.fFFFf...', '..ggggg.ggggg...']
const PIP_HOP = [
  '....d.....d.....',
  '....d.....d.....',
  '...fFf...fFf....',
  '...ggg...ggg....',
]
const pad = (rows: string[]) => rows.map((r) => `...${r}`)
/** [front, back] x [stand, hop], all facing right. */
const PIP_SPRITES = [PIP_FRONT, PIP_BACK].map((body) =>
  [PIP_STAND, PIP_HOP].map((legs) =>
    pixelSprite(pad([...body, ...legs]), PIP_PALETTE),
  ),
)
const PIP_LIFE = pixelSprite(
  [
    '..OOOO...',
    '.OLHOOO..',
    'OLwkOwkON',
    'OOOOOOOnn',
    '.oOOOOo..',
    '..dddd...',
  ],
  PIP_PALETTE,
)

/** Boing: a grumpy purple head on a steel spring, coiled on the ground, sprung in the air. */
const BOING_PALETTE = {
  ...rampPalette(RAMPS.purple),
  w: '#ffffff',
  k: INK,
  h: RAMPS.steel[4],
  S: RAMPS.steel[3],
  s: RAMPS.steel[2],
  t: RAMPS.steel[1],
}
const BOING_HEAD = [
  '...23332...',
  '..2344322..',
  '.2kk332kk1.',
  '.23wk2kw21.',
  '2332w2w2221',
  '22222222211',
  '.12kkkkk21.',
  '..1111111..',
]
const BOING_SPRITES = [
  [
    ...BOING_HEAD,
    '...hSSs....',
    '..tsssst...',
    '...hSSs....',
    '..tsssst...',
    '..ttttttt..',
  ],
  [
    ...BOING_HEAD,
    '....hSs....',
    '.....sSs...',
    '....hSs....',
    '.....sSs...',
    '....hSs....',
    '.....sSs...',
    '...ttttt...',
  ],
].map((rows) => pixelSprite(rows, BOING_PALETTE))

/** The repaint gremlin, per scheme (its brush is dipped in the start colour), two steps. */
const GREMLIN_BODY = [
  '.2333332......',
  '23443332......',
  '24wk3wk31.....',
  '23ww3ww31.....',
  '233kwkw31..pBB',
  '1222222hhhhBBb',
  '.1111111...Bb.',
]
const gremlinCache = new Map<string, PixelSprite[]>()
function gremlinSprites(scheme: Scheme): PixelSprite[] {
  let sprites = gremlinCache.get(scheme.id)
  if (!sprites) {
    const brush = rampOf(scheme.start)
    const palette = {
      ...rampPalette(RAMPS.leaf),
      w: '#ffffff',
      k: INK,
      h: RAMPS.earth[3],
      p: brush[4],
      B: brush[2],
      b: brush[1],
    }
    sprites = [
      [...GREMLIN_BODY, '.0..0.........'],
      [...GREMLIN_BODY, '..0..0........'],
    ].map((rows) => pixelSprite(rows, palette))
    gremlinCache.set(scheme.id, sprites)
  }
  return sprites
}

/** A paint pot on a picture board's cube: a tin with its colour brimming over. */
function potSprite(colour: string): PixelSprite {
  const key = `pot|${colour}`
  let sprite = cubeCache.get(key)
  if (!sprite) {
    const paint = rampOf(colour)
    sprite = pixelSprite(
      [
        '..43333..',
        '.4322221.',
        'sSSSSSSSt',
        'sSSSSSSSt',
        '.sSSSSSt.',
        '.ttttttt.',
      ],
      {
        ...rampPalette(paint),
        S: RAMPS.steel[3],
        s: RAMPS.steel[4],
        t: RAMPS.steel[1],
      },
    )
    cubeCache.set(key, sprite)
  }
  return sprite
}

/** A spring set into a cube top: a red cap on a steel coil. */
const SPRING_SPRITE = pixelSprite(
  ['.43332.', '1222221', '.hSSs..', '..sSSs.', '.hSSs..'],
  {
    ...rampPalette(RAMPS.ember),
    h: RAMPS.steel[4],
    S: RAMPS.steel[3],
    s: RAMPS.steel[2],
  },
)

/** Gumball Machine Max's coin, glinting in his slot on the board. */
const COIN_SPRITE = pixelSprite(['.344.', '32243', '32223', '.211.'], {
  ...rampPalette(RAMPS.gold),
})

/** A golden brush: the prize for a picture painted without losing a hopper. */
const BRUSH_SPRITE = pixelSprite(
  ['......44', '.....43.', '....hh..', '...hh...', '.233....', '2332....'],
  { ...rampPalette(RAMPS.gold), h: RAMPS.earth[3] },
)

/** Which way a hopper faces: away from the screen on an upward hop, flipped for leftward. */
function facing(h: Hopper): { back: boolean; left: boolean } {
  const dr = h.r - h.fr
  return { back: dr < 0 && h.fr >= 0, left: h.c - h.fc - dr / 2 < 0 }
}

const SKY_STARS = starField(41, 46, W, 200)
const DUST = starField(43, 22, W, 200)
const FAR_CRAGS = ridge(17, W, 22, 4)
const NEAR_CRAGS = ridge(23, W, 14, 4)
const NEBULA = (() => {
  const rand = backdropRng(31)
  return Array.from({ length: 7 }, () => ({
    x: 20 + rand() * (W - 40),
    y: 40 + rand() * 120,
    rx: 30 + rand() * 50,
    ry: 10 + rand() * 18,
  }))
})()

/** Where a board's cubes sit on screen: centred across, and with room for tall rings. */
function boardOrigin(board: HopBoard): { x: number; y: number } {
  let minX = Infinity
  let maxX = -Infinity
  let minR = Infinity
  let maxR = -Infinity
  for (const cell of board.cells) {
    const x = cell.c - cell.r / 2
    minX = Math.min(minX, x)
    maxX = Math.max(maxX, x)
    minR = Math.min(minR, cell.r)
    maxR = Math.max(maxR, cell.r)
  }
  const span = maxR - minR + 1
  const top = span >= 9 ? 36 : APEX_Y + (Math.max(0, 7 - span) * ROW_H) / 2
  return {
    x: APEX_X - ((minX + maxX) / 2) * CUBE_W,
    y: top - minR * ROW_H,
  }
}

/** Draw a picture's targets small: done cubes in their colour, the rest faint. */
function drawPicture(
  g: CanvasRenderingContext2D,
  board: HopBoard,
  palette: readonly string[],
  x: number,
  y: number,
  size: number,
  done: (cell: Cell) => boolean,
) {
  const target = board.target ?? {}
  let minX = Infinity
  let maxX = -Infinity
  let minR = Infinity
  for (const cell of board.cells) {
    const cx = cell.c - cell.r / 2
    minX = Math.min(minX, cx)
    maxX = Math.max(maxX, cx)
    minR = Math.min(minR, cell.r)
  }
  const left = x - ((maxX - minX + 1) * size) / 2
  for (const cell of board.cells) {
    const colour = target[cellKey(cell.r, cell.c)]
    if (!colour) continue
    const px = Math.round(left + (cell.c - cell.r / 2 - minX) * size)
    const py = Math.round(y + (cell.r - minR) * size * 0.75)
    const ink = palette[colour - 1]!
    g.fillStyle = done(cell) ? ink : ghostOf(ink)
    g.fillRect(px, py, size, Math.max(1, Math.round(size * 0.75)))
  }
}

class PixelHop implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private roundStart = 0
  /** Rounds played this run (the endless round number). */
  private round = 1
  private mode: Mode = 'planets'
  /** The campaign stage being played, and its planet. */
  private stage = 0
  private planet = 0
  private screens: Screen[] = []
  // The round in play.
  private board: HopBoard = pyramidBoard(7)
  private cellSet = new Set<string>()
  private origin = { x: APEX_X, y: APEX_Y }
  private home: Cell = { r: 0, c: 0 }
  private rule: Rule = ruleOf('one')
  private foes = new Set<FoeId>()
  private pace = 1
  private scheme: Scheme = SCHEMES[0]!
  private sky: RoundSetup['sky'] = 'space'
  private picture: Picture | null = null
  /** The colour on Pip's brush, on a picture board. */
  private brush = 1
  private boss: Boss | null = null
  /** Hoppers lost this round: a picture painted without one earns the gold frame. */
  private lostThisRound = 0
  /** Each tile's paint by [row][column]: 0 start, 1 halfway, 2 target (or a picture tile done). */
  private paint: number[][] = []
  private me: Hopper = { r: 0, c: 0, fr: 0, fc: 0, hop: 0, falling: 0 }
  private queued = -1
  private riding: { t: number; from: { x: number; y: number } } | null = null
  private enemies: Enemy[] = []
  private discs: Disc[] = []
  private dropTimer = 120
  private freeze = 0
  private stun = 0
  private clear = 0
  private dead = 0
  private nextExtra = EXTRA_EVERY
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null
  // The Gallery and the save.
  private gallery: Record<string, 1 | 2> = {}
  private brushes = new Set<number>()
  private cleared = false
  private stored: HopSave | null = null
  private saveData: HopSave | null = null
  // Cosmetic sparkles roll their own dice, so the game's seeded rng is untouched.
  private fx = new Sparkles()
  private fxRng = backdropRng(47)
  /** When each tile last changed colour, for its flash ("r,c" -> tick). */
  private flashes = new Map<string, number>()

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    const stored = this.demo ? null : readHopSave(options.resume)
    if (stored) {
      this.stored = stored
      this.saveData = stored
      this.gallery = { ...stored.gallery }
      this.brushes = new Set(stored.brushes)
      this.cleared = stored.cleared === true
    }
    if (this.demo) {
      // The attract demo shows off a round from anywhere in the campaign.
      const index = Math.floor(this.rng() * STAGES.length)
      this.planet = STAGES[index]!.planet
      this.startStage(index)
      this.screens = [{ kind: 'title', t: 0 }]
    } else if (options.selectScreen) {
      this.startStage(0)
      this.screens = [{ kind: 'menu', cursor: 0 }]
    } else if (stored && stored.planet > 0) {
      this.resumeFrom(stored)
    } else {
      this.beginPlanet(0, false)
    }
  }

  get save(): HopSave | null | undefined {
    return this.demo ? undefined : this.saveData
  }

  get music(): MusicLoop | null {
    if (this.demo || this.over || this.mode !== 'planets') return null
    const screen = this.screens[0]?.kind
    if (screen === 'menu' || screen === 'gallery') return null
    if (this.boss && !screen) return BOSS_MUSIC
    return PLANETS[this.planet]!.music
  }

  // --- the campaign ---------------------------------------------------------------------------

  private get menuItems(): MenuItem[] {
    const items: MenuItem[] = []
    if (this.stored && this.stored.planet > 0) items.push('continue')
    items.push('planets', 'endless', 'gallery')
    return items
  }

  private choose(item: MenuItem) {
    this.screens = []
    if (item === 'gallery') {
      this.screens = [{ kind: 'gallery' }]
      return
    }
    if (item === 'continue' && this.stored) {
      this.resumeFrom(this.stored)
      return
    }
    this.score = 0
    this.lives = START_LIVES
    this.nextExtra = EXTRA_EVERY
    if (item === 'endless') {
      this.startRound(1)
      return
    }
    this.beginPlanet(0, true)
  }

  private resumeFrom(s: HopSave) {
    this.score = s.score
    this.lives = s.lives
    this.nextExtra = (Math.floor(s.score / EXTRA_EVERY) + 1) * EXTRA_EVERY
    this.beginPlanet(s.planet, true)
  }

  /** A planet starts: the map, its title card, then its first round. Saved here. */
  private beginPlanet(p: number, showMap: boolean) {
    this.planet = p
    this.startStage(PLANET_START[p]!)
    const lead: Screen[] = []
    if (showMap && !this.demo) lead.push({ kind: 'map', t: 0, final: false })
    lead.push({ kind: 'title', t: 0 })
    this.screens = [...lead, ...this.screens]
    this.keep()
  }

  private startStage(index: number) {
    const stage = STAGES[index]!
    const planet = PLANETS[stage.planet]!
    this.mode = 'planets'
    this.stage = index
    this.planet = stage.planet
    this.round = index + 1
    this.level = 1 + Math.floor(index / ROUNDS_PER_LEVEL)
    this.screens = []
    this.setRound({
      board: stage.board,
      rule: stage.rule,
      foes: stage.foes,
      pace: stage.pace,
      scheme: planet.schemes[(stage.round - 1) % planet.schemes.length]!,
      sky: planet.sky,
      picture: stage.picture,
      boss: stage.boss,
    })
    if (firstOfRule(index)) {
      this.screens.push({ kind: 'demo', t: 0, rule: stage.rule })
    }
    this.banner = {
      text: stage.boss ? 'BOSS ROUND!' : `${planet.short} ${stage.round}/6`,
      sub: stage.name,
      ticks: 110,
    }
  }

  /** Endless Pyramid round `round`: the classic rules, tightening every four rounds. */
  private startRound(round: number) {
    this.mode = 'endless'
    this.screens = []
    this.round = round
    this.level = 1 + Math.floor((round - 1) / ROUNDS_PER_LEVEL)
    const tier = (this.level - 1) % 5
    const rule: RuleId =
      tier === 4
        ? 'cycle'
        : tier === 3
          ? 'both'
          : tier === 2
            ? 'flip'
            : tier === 1
              ? 'two'
              : 'one'
    const unlocked = endlessFoes(round)
    const foes: FoeId[] = ['gumball', 'purple', 'mint', 'gremlin']
    if (unlocked.includes('skitter')) foes.push('skitter')
    this.setRound({
      board: pyramidBoard(boardRows(round)),
      rule,
      foes,
      pace: round,
      scheme: SCHEMES[(round - 1) % SCHEMES.length]!,
      sky: 'space',
    })
    const r = this.rule
    this.banner = {
      text: `LEVEL ${this.level}  ROUND ${((round - 1) % ROUNDS_PER_LEVEL) + 1}`,
      sub: r.cycle
        ? 'EVERY HOP CYCLES THE COLOUR. END ON THE GLOW'
        : r.hops === 2 && r.flips
          ? 'TWO HOPS, AND DONE TILES FLIP BACK'
          : r.hops === 2
            ? 'TWO HOPS PAINT A TILE'
            : r.flips
              ? 'DONE TILES FLIP BACK'
              : 'HOP EVERY TILE',
      ticks: 100,
    }
  }

  /** Lay out a round: its board, rule, foes, paint and discs. */
  private setRound(setup: RoundSetup) {
    this.board = { ...setup.board, special: { ...setup.board.special } }
    this.cellSet = new Set(setup.board.cells.map((x) => cellKey(x.r, x.c)))
    this.origin = boardOrigin(setup.board)
    this.rule = ruleOf(setup.rule)
    this.foes = new Set(setup.foes)
    this.pace = setup.pace
    this.scheme = setup.scheme
    this.sky = setup.sky
    this.picture = setup.picture ?? null
    this.brush = 1
    this.lostThisRound = 0
    this.roundStart = this.tick
    // Home is the top cube (the middle one, if the top row has several).
    const minR = Math.min(...setup.board.cells.map((x) => x.r))
    const top = this.rowCells(minR)
    this.home = top[Math.floor((top.length - 1) / 2)]!
    this.paint = []
    for (const cell of setup.board.cells) {
      const row = (this.paint[cell.r] ??= [])
      row[cell.c] = this.potAt(cell.r, cell.c) ? 2 : 0
    }
    if (setup.board.discCells) {
      this.discs = setup.board.discCells.map((d) => ({ ...d, used: false }))
    } else {
      // A pyramid hangs one disc each side, on a row picked at random.
      const left = 2 + Math.floor(this.rng() * 4)
      const right = 2 + Math.floor(this.rng() * 4)
      this.discs = [
        { r: left - 1, c: -1, used: false },
        { r: right - 1, c: right, used: false },
      ]
    }
    this.boss = null
    if (setup.boss === 'max') {
      const phase = MAX_PHASES[0]!
      this.boss = {
        kind: 'max',
        phase: 0,
        sneezes: 0,
        ring: coinRing(phase.slot),
        timer: 70,
        left: 0,
        volleys: 0,
        spiral: 0,
        sneeze: 0,
        spit: 0,
      }
    } else if (setup.boss === 'rattle') {
      const at = Math.floor(RATTLE_LOOP.length / 2)
      const cell = RATTLE_LOOP[at]!
      this.boss = {
        kind: 'rattle',
        phase: 0,
        bonks: 0,
        i: at,
        dir: RATTLE_PHASES[0]!.dir,
        wait: 90,
        dizzy: 0,
        streak: 0,
        r: cell.r,
        c: cell.c,
        fr: cell.r,
        fc: cell.c,
        hop: 0,
        falling: 0,
      }
    }
    if (setup.boss === 'globe') {
      this.boss = { kind: 'globe', cracks: 0, timer: 180, shaking: 0 }
    }
    this.resetPositions()
  }

  private resetPositions() {
    const { r, c } = this.home
    this.me = { r, c, fr: r, fc: c, hop: 0, falling: 0 }
    this.queued = -1
    this.riding = null
    this.enemies = []
    this.dropTimer = 120
    this.freeze = 0
    this.stun = 0
  }

  /** The round is over: on to the next round, the next planet, or the encore. */
  private nextRound() {
    if (this.mode === 'endless') {
      this.startRound(this.round + 1)
      return
    }
    const next = this.stage + 1
    if (next >= STAGES.length) {
      // Every planet painted: the save keeps the Gallery, and the run plays on.
      this.cleared = true
      this.keep(true)
      this.startRound(ENCORE_ROUND)
      if (!this.demo) this.screens = [{ kind: 'map', t: 0, final: true }]
      this.banner = {
        text: 'ENCORE!',
        sub: 'ENDLESS PYRAMID, FOR AS LONG AS YOU CAN HOP',
        ticks: 140,
      }
      return
    }
    if (STAGES[next]!.planet !== this.planet) {
      this.beginPlanet(STAGES[next]!.planet, true)
      return
    }
    this.startStage(next)
  }

  /**
   * Write the save: the planet this run resumes at, with its score and hoppers, and the Gallery.
   * `fresh` keeps only the Gallery (a run that is over or past the planets starts again at 1).
   */
  private keep(fresh = false) {
    if (this.demo) return
    const resume = !fresh && this.mode === 'planets'
    const base = this.saveData
    this.saveData = {
      v: 1,
      planet: resume ? this.planet : 0,
      score: resume ? this.score : 0,
      lives: resume ? Math.max(1, this.lives) : START_LIVES,
      gallery: { ...this.gallery },
      brushes: [...this.brushes].sort((a, b) => a - b),
      ...(this.cleared || base?.cleared ? { cleared: true } : {}),
    }
  }

  /** The Gallery changed mid-planet: keep the resume point and add the picture. */
  private keepGallery() {
    if (this.demo) return
    const base = this.saveData
    if (!base) {
      this.keep()
      return
    }
    this.saveData = {
      ...base,
      gallery: { ...this.gallery },
      brushes: [...this.brushes].sort((a, b) => a - b),
    }
  }

  // --- board geometry ---------------------------------------------------------------------

  private onBoard(r: number, c: number): boolean {
    return this.cellSet.has(cellKey(r, c))
  }

  private potAt(r: number, c: number): number {
    return this.board.pots?.[cellKey(r, c)] ?? 0
  }

  private targetAt(r: number, c: number): number {
    return this.board.target?.[cellKey(r, c)] ?? 0
  }

  /** A row's cubes, left to right. */
  private rowCells(r: number): Cell[] {
    return this.board.cells.filter((x) => x.r === r).sort((a, b) => a.c - b.c)
  }

  /** Where a cube's top sits on screen. */
  private at(r: number, c: number): { x: number; y: number } {
    return {
      x: this.origin.x + (c - r / 2) * CUBE_W,
      y: this.origin.y + r * ROW_H,
    }
  }

  /** Whether a gumball here has anywhere further down to bounce. */
  private hasDown(r: number, c: number): boolean {
    return this.onBoard(r + 1, c) || this.onBoard(r + 1, c + 1)
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.screens.length) {
      this.updateScreen(this.demo ? this.idleFrame() : input)
      return
    }
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    const controls = this.demo ? this.demoInput() : input
    if (this.clear > 0) {
      if (--this.clear === 0) this.nextRound()
      return
    }
    if (this.dead > 0) {
      if (--this.dead === 0) {
        if (this.lives <= 0) {
          this.over = true
          this.banner = { text: 'GAME OVER', ticks: 9999 }
        } else {
          // Back on the board where you were (or home after a fall).
          const back = this.onBoard(this.me.r, this.me.c)
          const r = back ? this.me.r : this.home.r
          const c = back ? this.me.c : this.home.c
          this.me = { r, c, fr: r, fc: c, hop: 0, falling: 0 }
          this.enemies = []
          this.dropTimer = 90
          this.calmBoss()
        }
      }
      return
    }
    if (this.stun > 0) {
      this.stun--
      this.queued = -1
    } else {
      this.readInput(controls)
    }
    this.moveMe()
    if (this.freeze > 0) this.freeze--
    else {
      this.moveEnemies()
      this.moveBoss()
    }
    this.spawn()
    this.collide()
  }

  private idleFrame(): InputFrame {
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

  private updateScreen(input: InputFrame) {
    const s = this.screens[0]!
    const go = input.pressed.a || input.pressed.start
    if (s.kind === 'menu') {
      const items = this.menuItems
      if (input.pressed.up) {
        s.cursor = (s.cursor + items.length - 1) % items.length
        this.sound.play('blip')
      } else if (input.pressed.down) {
        s.cursor = (s.cursor + 1) % items.length
        this.sound.play('blip')
      } else if (go) {
        this.sound.play('start')
        this.choose(items[Math.min(s.cursor, items.length - 1)]!)
      }
      return
    }
    if (s.kind === 'gallery') {
      if (go || input.pressed.b) this.screens = [{ kind: 'menu', cursor: 0 }]
      return
    }
    s.t++
    const limit =
      s.kind === 'map'
        ? MAP_TICKS
        : s.kind === 'title'
          ? TITLE_TICKS
          : DEMO_TICKS
    if ((s.t > 24 && go) || s.t >= limit) {
      this.screens.shift()
      if (!this.screens.length) this.roundStart = this.tick
    }
  }

  private readInput(input: InputFrame) {
    const pressed = input.pressed
    const held = input.held
    const dir =
      pressed.up || held.up
        ? 0
        : pressed.right || held.right
          ? 1
          : pressed.down || held.down
            ? 2
            : pressed.left || held.left
              ? 3
              : -1
    if (dir >= 0) this.queued = dir
  }

  private moveMe() {
    const me = this.me
    if (this.riding) {
      if (--this.riding.t <= 0) {
        this.riding = null
        const { r, c } = this.home
        this.me = { r, c, fr: r, fc: c, hop: 0, falling: 0 }
        this.land()
      }
      return
    }
    if (me.falling > 0) {
      if (--me.falling === 0) this.lose('OFF THE EDGE')
      return
    }
    if (me.hop > 0) {
      if (--me.hop === 0) this.arrive()
      return
    }
    if (this.queued < 0) return
    const [dr, dc] = MOVES[this.queued]!
    this.queued = -1
    me.fr = me.r
    me.fc = me.c
    me.r += dr
    me.c += dc
    me.hop = HOP_TICKS
    me.span = undefined
    me.arc = undefined
    this.sound.play('blip')
  }

  /** Landed at the end of a hop: on a tile, onto a disc, or off into the air. */
  private arrive() {
    const me = this.me
    if (this.onBoard(me.r, me.c)) {
      this.land()
      return
    }
    const disc = this.discs.find((d) => !d.used && d.r === me.r && d.c === me.c)
    if (disc) {
      disc.used = true
      const spot = this.discPos(disc)
      this.riding = { t: 90, from: spot }
      this.fx.burst(spot.x, spot.y, this.fxRng, { count: 8 })
      this.sound.play('extra')
      // Boing, hot on your heels, boings straight off after you.
      for (const e of this.enemies) {
        if (e.kind !== 'boing' || e.hop > 0) continue
        if (Math.abs(e.r - me.fr) + Math.abs(e.c - me.fc) <= 1) {
          e.falling = 50
          const at = this.at(e.r, e.c)
          this.addScore(BOING_LURE_POINTS, at.x, at.y - 20)
          this.fx.burst(at.x, at.y - 12, this.fxRng, { count: 12 })
          this.banner = { text: 'BOING BOINGED OFF!', ticks: 70 }
        }
      }
      return
    }
    me.falling = 50
    this.sound.play('die')
  }

  private land() {
    const { r, c } = this.me
    if (this.rule.picture) {
      this.landPicture(r, c)
    } else {
      const rule = this.rule
      const tile = this.paint[r]![c]!
      let next = tile
      if (rule.cycle) next = (tile + 1) % 3
      else if (tile < 2) next = rule.hops === 1 ? 2 : tile + 1
      else if (rule.flips) next = rule.hops === 1 ? 0 : 1
      if (next !== tile) {
        this.paint[r]![c] = next
        this.tileFx(r, c, next > tile, next === 2)
        if (next > tile || (rule.cycle && next === 2)) {
          const at = this.at(r, c)
          this.addScore(PAINT_POINTS, at.x, at.y - 14)
          if (next === 2) this.hopCombos(r, c)
        }
      }
    }
    if (this.boss?.kind === 'max') {
      this.checkSneeze(this.boss)
      return
    }
    if (this.boss?.kind === 'globe') {
      this.checkGlobe(r, c, this.boss)
      this.tileMove(r, c)
      return
    }
    if (this.boss) return
    if (this.board.cells.every((x) => this.paint[x.r]![x.c] === 2)) {
      this.roundClear()
      return
    }
    this.tileMove(r, c)
  }

  /** A spring jumps two cubes; slippery ice and conveyors each push one. */
  private tileMove(r: number, c: number) {
    const tile = this.board.special[cellKey(r, c)]
    if (tile !== 'spring' && tile !== 'ice' && tile !== 'conveyor') return
    const me = this.me
    const dr = tile === 'conveyor' ? 1 : r - me.fr
    const dc = tile === 'conveyor' ? 1 : c - me.fc
    if (tile !== 'conveyor' && Math.abs(dr) !== 1) return
    me.fr = r
    me.fc = c
    const steps = tile === 'spring' ? 2 : 1
    me.r = r + dr * steps
    me.c = c + dc * steps
    me.hop = tile === 'spring' ? SPRING_TICKS : HOP_TICKS
    me.span = me.hop
    me.arc = tile === 'spring' ? 34 : 6
    const at = this.at(r, c)
    this.fx.burst(at.x, at.y, this.fxRng, {
      count: tile === 'spring' ? 6 : 3,
      colours:
        tile === 'spring'
          ? [RAMPS.steel[4], RAMPS.ember[3], '#ffffff']
          : [RAMPS.water[4], RAMPS.sky[3], '#ffffff'],
    })
    this.sound.play('pickup')
  }

  /** Picture rule: a pot dips the brush; a tile takes the paint only if it is its colour. */
  private landPicture(r: number, c: number) {
    const at = this.at(r, c)
    const pot = this.potAt(r, c)
    if (pot) {
      if (pot !== this.brush) {
        this.brush = pot
        const ramp = rampOf(this.picture!.palette[pot - 1]!)
        this.fx.burst(at.x, at.y - 4, this.fxRng, {
          count: 8,
          colours: [ramp[2], ramp[3], ramp[4]],
        })
        this.sound.play('pickup')
      }
      return
    }
    if (this.paint[r]![c] === 2) return
    if (this.targetAt(r, c) === this.brush) {
      this.paint[r]![c] = 2
      this.tileFx(r, c, true, true)
      this.addScore(PAINT_POINTS, at.x, at.y - 14)
      this.hopCombos(r, c)
    } else {
      // Wrong colour: the paint beads off, and the tile shows what it wants.
      this.flashes.set(cellKey(r, c), this.tick - 6)
      this.fx.burst(at.x, at.y, this.fxRng, {
        count: 3,
        colours: [RAMPS.steel[3], RAMPS.steel[4]],
        speed: 0.6,
      })
    }
  }

  /** Stripe (a whole row done) and Prism (a 3-cube triangle done) bonuses. */
  private hopCombos(r: number, c: number) {
    const board = this.board
    const done = board.cells.map((cell) => this.paint[cell.r]![cell.c] === 2)
    const landed = { r, c }
    const at = this.at(r, c)
    if (this.rowCells(r).length > 1 && stripeComplete(board, done, landed)) {
      this.addScore(STRIPE_POINTS, at.x, at.y - 28)
    } else if (prismComplete(board, done, landed)) {
      this.addScore(PRISM_POINTS, at.x, at.y - 28)
    }
  }

  private roundClear() {
    const bonus = ROUND_BONUS + 250 * (this.round - 1)
    const unused = this.discs.filter((d) => !d.used).length
    const rule = this.rule
    const par = speedPaintPar(
      this.board,
      rule.hops === 2 || rule.cycle || rule.picture ? RULES.two : RULES.one,
    )
    const swift = speedPaintBonus(this.tick - this.roundStart, par)
    this.clear = ROUND_CLEAR_TICKS
    this.enemies = []
    for (const cell of this.board.cells) {
      if (cell.r % 2) continue
      const at = this.at(cell.r, cell.c)
      this.fx.burst(at.x, at.y, this.fxRng, { count: 3 })
    }
    this.sound.play('level')
    if (this.picture) {
      const gold = this.lostThisRound === 0
      const id = this.picture.id
      const was = this.gallery[id] ?? 0
      this.gallery[id] = gold || was === 2 ? 2 : 1
      const newBrush = gold && !this.brushes.has(this.planet)
      if (gold) this.brushes.add(this.planet)
      this.keepGallery()
      this.addScore(
        bonus + PICTURE_POINTS + (gold ? GOLD_POINTS : 0) + swift,
        W / 2,
        120,
      )
      this.banner = {
        text: `${this.picture.name}!`,
        sub: newBrush
          ? `GOLD FRAME AND GOLDEN BRUSH ${this.brushes.size}/6`
          : gold
            ? 'GOLD FRAME! HUNG IN THE GALLERY'
            : 'HUNG IN THE GALLERY',
        ticks: ROUND_CLEAR_TICKS,
      }
      return
    }
    this.addScore(bonus + unused * 50 + swift, W / 2, 120)
    this.banner = {
      text: this.mode === 'endless' ? 'PYRAMID PAINTED!' : 'BOARD PAINTED!',
      sub: `BONUS ${bonus}${unused ? `  DISCS ${unused * 50}` : ''}${swift ? `  SPEED ${swift}` : ''}`,
      ticks: ROUND_CLEAR_TICKS,
    }
  }

  // --- bosses -----------------------------------------------------------------------

  private moveBoss() {
    const boss = this.boss
    if (!boss) return
    if (boss.kind === 'max') this.moveMax(boss)
    else if (boss.kind === 'rattle') this.moveRattle(boss)
    else this.moveGlobe(boss)
  }

  /** Max spits volleys of gumballs from his spout: lines, then a spiral. */
  private moveMax(max: MaxBoss) {
    if (max.spit > 0) max.spit--
    if (max.sneeze > 0) {
      max.sneeze--
      return
    }
    if (max.sneezes >= MAX_PHASES.length) return
    if (--max.timer > 0) return
    const phase = MAX_PHASES[max.phase]!
    if (this.enemies.length >= 8) {
      max.timer = phase.gap
      return
    }
    if (max.left <= 0) {
      max.left = phase.volley
      max.volleys++
    }
    // A line comes straight out of the spout onto the apex; a spiral sprays round the top.
    const entry =
      phase.pattern === 'spiral'
        ? SPIRAL_ENTRIES[max.spiral++ % SPIRAL_ENTRIES.length]!
        : { r: 0, c: 0 }
    // Every third volley ends on a mint gumball, so there is always a breather coming.
    const mint = max.left === 1 && max.volleys % 3 === 0
    this.enemies.push({
      kind: mint ? 'green' : 'gumball',
      r: entry.r,
      c: entry.c,
      fr: -1,
      fc: 0,
      hop: HOP_TICKS,
      falling: 0,
      wait: 18,
    })
    max.left--
    max.timer = max.left > 0 ? phase.gap : phase.rest
    max.spit = 10
    this.sound.play('pop')
  }

  /** The coin ring painted: Max sneezes, his gumballs pop, and the slot moves on. */
  private checkSneeze(max: MaxBoss) {
    if (max.sneeze > 0) return
    if (!max.ring.every((x) => this.paint[x.r]?.[x.c] === 2)) return
    max.sneezes++
    max.sneeze = 100
    max.left = 0
    for (const e of this.enemies) {
      const at = this.pos(e)
      this.fx.burst(at.x, at.y - 4, this.fxRng, { count: 5 })
    }
    this.enemies = []
    const top = this.at(0, 0)
    this.addScore(SNEEZE_POINTS, top.x, top.y - 30)
    this.sound.play('boom')
    if (max.sneezes >= MAX_PHASES.length) {
      this.bossBeaten('MAX IS ALL SNEEZED OUT!')
      return
    }
    max.phase = max.sneezes
    const phase = MAX_PHASES[max.phase]!
    max.ring = coinRing(phase.slot)
    this.rule = ruleOf(phase.rule)
    for (const cell of max.ring) {
      this.paint[cell.r]![cell.c] = 0
      this.flashes.set(cellKey(cell.r, cell.c), this.tick)
    }
    // The sneeze itself is the breather; he is spitting again as soon as it is over.
    max.timer = 30
    const left = MAX_PHASES.length - max.sneezes
    this.banner = {
      text: 'AH-CHOO!',
      sub: `${left} MORE${phase.rule === 'two' ? ', AND NOW TWO HOPS A TILE' : ''}`,
      ticks: 100,
    }
  }

  /** Rattle spins round the ring's outside edge, scuffing paint until he slips on it. */
  private moveRattle(b: RattleBoss) {
    if (b.hop > 0) {
      if (--b.hop === 0) this.rattleArrive(b)
      return
    }
    if (b.dizzy > 0) {
      b.dizzy--
      return
    }
    if (--b.wait > 0) return
    const phase = RATTLE_PHASES[b.phase]!
    b.wait = phase.every
    const n = RATTLE_LOOP.length
    b.i = (b.i + b.dir + n) % n
    const next = RATTLE_LOOP[b.i]!
    b.fr = b.r
    b.fc = b.c
    b.r = next.r
    b.c = next.c
    b.hop = 10
    b.span = 10
    b.arc = 0
  }

  private rattleArrive(b: RattleBoss) {
    const row = this.paint[b.r]
    if (!row || row[b.c] === undefined) return
    if (row[b.c] !== 2) {
      b.streak = 0
      return
    }
    b.streak++
    const need = RATTLE_PHASES[b.phase]!.need
    if (b.streak >= need) {
      // Wet paint all the way: he skids and spins out, dizzy.
      b.streak = 0
      b.dizzy = RATTLE_DIZZY
      this.banner = { text: 'RATTLE SLIPPED!', sub: 'HOP ON HIM!', ticks: 80 }
      this.sound.play('warn')
      return
    }
    row[b.c] = 0
    this.tileFx(b.r, b.c, false, false)
  }

  private bonkRattle(b: RattleBoss) {
    b.bonks++
    b.dizzy = 0
    b.streak = 0
    const at = this.pos(b)
    this.addScore(RATTLE_BONK_POINTS, at.x, at.y - 24)
    this.fx.burst(at.x, at.y - 10, this.fxRng, { count: 14 })
    this.sound.play('boom')
    if (b.bonks >= RATTLE_PHASES.length) {
      this.bossBeaten('RATTLE TAKES A BOW!')
      return
    }
    b.phase = b.bonks
    const phase = RATTLE_PHASES[b.phase]!
    b.dir = phase.dir
    // Bonked clean across the ring, he lands on the far side and starts again.
    const n = RATTLE_LOOP.length
    b.i = (b.i + Math.floor(n / 2)) % n
    const cell = RATTLE_LOOP[b.i]!
    b.fr = b.r
    b.fc = b.c
    b.r = cell.r
    b.c = cell.c
    b.hop = 30
    b.span = 30
    b.arc = 40
    b.wait = 50
    this.banner = {
      text: 'BONK!',
      sub: phase.twins
        ? 'HERE COME SKITTER AND SCOOT'
        : `${RATTLE_PHASES.length - b.bonks} TO GO, AND HE SPINS THE OTHER WAY`,
      ticks: 90,
    }
  }

  /** Glacier's living globe shakes new ice onto the board every few seconds. */
  private moveGlobe(boss: GlobeBoss) {
    if (boss.shaking > 0) boss.shaking--
    if (--boss.timer > 0) return
    boss.timer = Math.max(120, 210 - boss.cracks * 25)
    boss.shaking = 35
    const candidates = this.board.cells.filter(
      (cell) =>
        !this.board.special[cellKey(cell.r, cell.c)] &&
        !(cell.r === this.me.r && cell.c === this.me.c),
    )
    for (let i = 0; i < Math.min(3, candidates.length); i++) {
      const at = Math.floor(this.rng() * candidates.length)
      const cell = candidates.splice(at, 1)[0]!
      this.board.special[cellKey(cell.r, cell.c)] = 'ice'
    }
    this.banner = {
      text: 'SNOW GLOBE SHAKE!',
      sub: 'FIND THE GLOWING CRACK',
      ticks: 70,
    }
    this.sound.play('warn')
  }

  /** Landing on each glowing crack lightens the globe until it opens. */
  private checkGlobe(r: number, c: number, boss: GlobeBoss) {
    const crack = GLOBE_CRACKS[boss.cracks]
    if (!crack || crack.r !== r || crack.c !== c) return
    const at = this.at(r, c)
    this.fx.burst(at.x, at.y - 8, this.fxRng, { count: 14 })
    this.addScore(1000, at.x, at.y - 18)
    boss.cracks++
    this.sound.play('boom')
    if (boss.cracks >= GLOBE_CRACKS.length) {
      this.bossBeaten('THE SNOW GLOBE IS OPEN!')
    } else {
      this.banner = {
        text: 'ICE CRACK!',
        sub: `${GLOBE_CRACKS.length - boss.cracks} GLOWING CRACKS LEFT`,
        ticks: 90,
      }
    }
  }

  /** After Pip is bonked, the boss gives him room: Rattle backs off round the ring. */
  private calmBoss() {
    const b = this.boss
    if (b?.kind === 'max') {
      b.timer = Math.max(b.timer, 120)
      b.left = 0
      return
    }
    if (b?.kind === 'globe') {
      b.timer = 180
      this.stun = 0
      return
    }
    if (b?.kind !== 'rattle') return
    const n = RATTLE_LOOP.length
    let far = b.i
    let best = -1
    RATTLE_LOOP.forEach((cell, i) => {
      const d = Math.abs(cell.r - this.me.r) + Math.abs(cell.c - this.me.c)
      if (d > best) {
        best = d
        far = i
      }
    })
    b.i = far % n
    const cell = RATTLE_LOOP[b.i]!
    b.r = b.fr = cell.r
    b.c = b.fc = cell.c
    b.hop = 0
    b.dizzy = 0
    b.streak = 0
    b.wait = 90
  }

  private bossBeaten(text: string) {
    const top = this.at(this.home.r, this.home.c)
    this.addScore(BOSS_POINTS * (this.planet + 1), top.x, top.y - 20)
    this.enemies = []
    this.clear = ROUND_CLEAR_TICKS + 80
    for (const cell of this.board.cells) {
      const at = this.at(cell.r, cell.c)
      this.fx.burst(at.x, at.y, this.fxRng, { count: 2 })
    }
    this.banner = {
      text: 'BOSS CLEAR!',
      sub: text,
      ticks: ROUND_CLEAR_TICKS + 80,
    }
    this.sound.play('level')
  }

  // --- foes -------------------------------------------------------------------------

  private spawn() {
    if (--this.dropTimer > 0) return
    const press = endlessPressure(this.pace)
    this.dropTimer =
      Math.round(levelCurve(this.pace, HOP_CURVES.dropEvery)) - press.dropTrim
    if (this.boss?.kind === 'max') return
    if (this.enemies.length >= press.maxEnemies) return
    const roll = this.rng()
    const hasBoing = this.enemies.some(
      (e) => e.kind === 'boing' || e.kind === 'purple',
    )
    // Skitter & Scoot slide along a row: one at a time, from round 5 in Endless.
    const twins =
      this.foes.has('skitter') ||
      (this.boss?.kind === 'rattle' && RATTLE_PHASES[this.boss.phase]!.twins)
    const hasSkitter = this.enemies.some((e) => e.kind === 'skitter')
    if (!hasSkitter && twins && this.rng() < 0.25) {
      const side: -1 | 1 = this.rng() < 0.5 ? 1 : -1
      const rows = [...new Set(this.board.cells.map((x) => x.r))].sort(
        (a, b) => b - a,
      )
      const row = rows[Math.floor(this.rng() * Math.min(3, rows.length))]!
      const cells = this.rowCells(row)
      const start = side === 1 ? cells[0]! : cells[cells.length - 1]!
      this.enemies.push({
        kind: 'skitter',
        r: start.r,
        c: start.c,
        fr: -1,
        fc: 0,
        hop: HOP_TICKS,
        falling: 0,
        wait: 30,
        side,
      })
      return
    }
    const gremlinChance =
      Math.max(
        this.mode === 'planets' ? 0.12 : 0,
        levelCurve(this.pace, HOP_CURVES.gremlinChance),
      ) + press.gremlinBonus
    let kind: EnemyKind = 'gumball'
    if (roll > 0.86 && this.foes.has('frost')) kind = 'frost'
    else if (roll > 0.56 && this.foes.has('snowball')) kind = 'snowball'
    else if (!hasBoing && roll < 0.35 && this.foes.has('purple')) kind = 'purple'
    else if (roll < 0.35 + gremlinChance && this.foes.has('gremlin'))
      kind = 'gremlin'
    else if (roll > 0.9 && this.foes.has('mint')) kind = 'green'
    if (kind === 'gumball' && !this.foes.has('gumball')) return
    // Drops in onto the second row (the top one if the board starts narrow).
    const minR = Math.min(...this.board.cells.map((x) => x.r))
    let entries = this.rowCells(minR + 1)
    if (!entries.length) entries = this.rowCells(minR)
    const at = entries[Math.floor(this.rng() * entries.length)]!
    this.enemies.push({
      kind,
      r: at.r,
      c: at.c,
      fr: -1,
      fc: 0,
      hop: HOP_TICKS,
      falling: 0,
      wait: 20,
    })
  }

  /** Ticks between enemy hops; keeps tightening past the old round-12 plateau. */
  private hopEvery(): number {
    return (
      Math.round(levelCurve(this.pace, HOP_CURVES.enemyHop)) -
      endlessPressure(this.pace).hopTrim
    )
  }

  private moveEnemies() {
    const every = this.hopEvery()
    const bottom = Math.max(...this.board.cells.map((x) => x.r))
    for (const e of this.enemies) {
      if (e.falling > 0) {
        e.falling--
        continue
      }
      if (e.hop > 0) {
        if (--e.hop === 0) this.enemyArrive(e)
        continue
      }
      if (--e.wait > 0) continue
      e.wait = every
      const [dr, dc] = this.enemyMove(e)
      e.fr = e.r
      e.fc = e.c
      e.r += dr
      e.c += dc
      e.hop = HOP_TICKS
    }
    this.enemies = this.enemies.filter(
      (e) => !(e.falling === 1 || e.r > bottom + 2),
    )
  }

  private enemyMove(e: Enemy): [number, number] {
    if (e.kind === 'boing') {
      // Boing hops toward you, the shortest way round.
      let best: [number, number] = MOVES[0]!
      let bestD = Infinity
      for (const [dr, dc] of MOVES) {
        const r = e.r + dr
        const c = e.c + dc
        if (!this.onBoard(r, c)) continue
        const d =
          Math.abs(r - this.me.r) +
          Math.abs(c - r / 2 - (this.me.c - this.me.r / 2))
        if (d < bestD) {
          bestD = d
          best = [dr, dc]
        }
      }
      return best
    }
    if (e.kind === 'skitter') {
      // Skitter & Scoot slide sideways along a row, then drop off its end.
      const next = sidewaysStep(this.board, { r: e.r, c: e.c }, e.side ?? 1)
      return next ? [0, next.c - e.c] : [0, e.side ?? 1]
    }
    // Everything else bounces down, left or right at random (staying on the board if it can).
    const first: [number, number] = this.rng() < 0.5 ? [1, 0] : [1, 1]
    const other: [number, number] = first[1] ? [1, 0] : [1, 1]
    if (this.onBoard(e.r + first[0], e.c + first[1])) return first
    if (this.onBoard(e.r + other[0], e.c + other[1])) return other
    return first
  }

  private enemyArrive(e: Enemy) {
    if (!this.onBoard(e.r, e.c)) {
      e.falling = 40
      return
    }
    if (e.kind === 'purple' && !this.hasDown(e.r, e.c)) {
      // At the bottom the purple gumball hatches into Boing.
      e.kind = 'boing'
      const at = this.at(e.r, e.c)
      this.burst(at.x, at.y, 10, '#c084fc')
      this.sound.play('warn')
    }
    // Max's gumballs leave gum on his coin ring: a painted ring cube loses a coat.
    const gum =
      e.kind === 'gumball' &&
      this.boss?.kind === 'max' &&
      this.boss.ring.some((x) => x.r === e.r && x.c === e.c)
    if (e.kind === 'snowball') e.size = Math.min(3, (e.size ?? 1) + 1)
    if (
      (e.kind === 'gremlin' || e.kind === 'snowball' || gum) &&
      this.paint[e.r]![e.c]! > 0 &&
      !this.potAt(e.r, e.c)
    ) {
      this.paint[e.r]![e.c]!--
      this.tileFx(e.r, e.c, false, false)
    }
  }

  private collide() {
    const me = this.me
    if (this.riding || me.falling > 0) return
    const mine = this.pos(me)
    const boss = this.boss
    // Rattle bonked across the ring is out of play until he lands.
    const flying = boss?.kind === 'rattle' && boss.hop > 0 && boss.span === 30
    if (boss?.kind === 'rattle' && !flying) {
      const at = this.pos(boss)
      if (Math.hypot(at.x - mine.x, at.y - mine.y) <= 10) {
        if (boss.dizzy > 0 && me.hop === 0) {
          this.bonkRattle(boss)
          return
        }
        if (boss.dizzy === 0 && this.freeze === 0) {
          this.lose('RATTLED!')
          return
        }
      }
    }
    for (const e of [...this.enemies]) {
      if (e.falling > 0) continue
      const at = this.pos(e)
      if (Math.hypot(at.x - mine.x, at.y - mine.y) > 10) continue
      if (e.kind === 'frost') {
        this.enemies = this.enemies.filter((o) => o !== e)
        this.stun = 60
        this.queued = -1
        this.banner = {
          text: 'FROST FLAKE!',
          sub: 'HOPS FROZEN FOR ONE SECOND',
          ticks: 65,
        }
        this.sound.play('warn')
      } else if (e.kind === 'green') {
        this.enemies = this.enemies.filter((o) => o !== e)
        this.freeze = FREEZE_TICKS
        this.addScore(FREEZE_POINTS, at.x, at.y - 16)
        this.banner = { text: 'FREEZE!', ticks: 60 }
        this.fx.burst(at.x, at.y - 6, this.fxRng, {
          count: 10,
          colours: [RAMPS.water[4], RAMPS.water[3], '#ffffff'],
        })
        this.sound.play('pickup')
      } else if (e.kind === 'gremlin') {
        this.enemies = this.enemies.filter((o) => o !== e)
        this.addScore(GREMLIN_POINTS, at.x, at.y - 16)
        this.burst(at.x, at.y, 10, '#86efac')
        this.fx.burst(at.x, at.y - 6, this.fxRng, { count: 8 })
        this.sound.play('pop')
      } else if (this.freeze === 0) {
        this.lose(e.kind === 'boing' ? 'BOING GOT YOU' : 'BONKED')
        return
      }
    }
  }

  private lose(why: string) {
    this.lives--
    this.lostThisRound++
    this.dead = DEATH_TICKS
    const at = this.pos(this.me)
    this.burst(at.x, at.y, 16, '#fb923c')
    this.sound.play('die')
    this.banner = { text: '#?%!', sub: why, ticks: DEATH_TICKS }
  }

  /** Screen position of a hopper's feet, arcing through its current hop. */
  private pos(h: Hopper): { x: number; y: number } {
    const to = this.at(h.r, h.c)
    if (h.hop <= 0) {
      if (h.falling > 0) return { x: to.x, y: to.y + (50 - h.falling) * 3 }
      return to
    }
    const span = h.span ?? HOP_TICKS
    const from = h.fr < 0 ? { x: to.x, y: to.y - 50 } : this.at(h.fr, h.fc)
    const t = 1 - h.hop / span
    return {
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t - Math.sin(t * Math.PI) * (h.arc ?? 14),
    }
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x: number, y: number) {
    if (this.demo) return
    this.score += points
    if (points >= 100)
      this.floaters.push({ x, y, text: String(points), life: 40 })
    if (this.score >= this.nextExtra) {
      this.nextExtra += EXTRA_EVERY
      this.lives++
      this.banner = { text: 'EXTRA HOPPER!', ticks: 80 }
      this.sound.play('extra')
    }
  }

  private burst(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.4 + this.rng() * 1.4
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 0.5,
        life: 18 + Math.floor(this.rng() * 14),
        color,
      })
    }
  }

  private updateEffects() {
    this.fx.update()
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.05
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

  /** Where an enemy will be (or is landing) soon: cells to keep clear of. */
  private danger(): Set<string> {
    const cells = new Set<string>()
    for (const e of this.enemies) {
      if (e.falling > 0 || e.kind === 'green' || e.kind === 'gremlin') continue
      cells.add(`${e.r},${e.c}`)
      // Where it might hop next.
      if (e.kind === 'skitter') {
        cells.add(`${e.r},${e.c + (e.side ?? 1)}`)
        continue
      }
      for (const [dr, dc] of e.kind === 'boing' ? MOVES : MOVES.slice(1, 3))
        cells.add(`${e.r + dr},${e.c + dc}`)
    }
    const b = this.boss
    if (b?.kind === 'globe') {
      const crack = GLOBE_CRACKS[b.cracks]
      if (crack) cells.add(cellKey(crack.r, crack.c))
    }
    if (b?.kind === 'rattle' && b.dizzy === 0) {
      const n = RATTLE_LOOP.length
      cells.add(`${b.r},${b.c}`)
      for (let k = 1; k <= 2; k++) {
        const cell = RATTLE_LOOP[(b.i + b.dir * k + n * 2) % n]!
        cells.add(`${cell.r},${cell.c}`)
      }
    }
    return cells
  }

  /** The cubes the pilot wants to hop onto next. */
  private pilotWants(): (r: number, c: number) => boolean {
    const b = this.boss
    if (b?.kind === 'rattle') {
      if (b.dizzy > 0) return (r, c) => r === b.r && c === b.c
      const n = RATTLE_LOOP.length
      const ahead = new Set<string>()
      const need = RATTLE_PHASES[b.phase]!.need
      for (let k = 2; k <= need + 2; k++) {
        const cell = RATTLE_LOOP[(b.i + b.dir * k + n * 3) % n]!
        if (this.paint[cell.r]![cell.c] !== 2)
          ahead.add(cellKey(cell.r, cell.c))
      }
      return (r, c) => ahead.has(cellKey(r, c))
    }
    if (b?.kind === 'globe') {
      const crack = GLOBE_CRACKS[b.cracks]
      return (r, c) => r === crack?.r && c === crack?.c
    }
    if (b?.kind === 'max') {
      const ring = new Set(
        b.ring
          .filter((x) => this.paint[x.r]![x.c] !== 2)
          .map((x) => cellKey(x.r, x.c)),
      )
      return (r, c) => ring.has(cellKey(r, c))
    }
    if (this.rule.picture) {
      const left = new Set<number>()
      for (const cell of this.board.cells) {
        const t = this.targetAt(cell.r, cell.c)
        if (t && this.paint[cell.r]![cell.c] !== 2) left.add(t)
      }
      if (left.has(this.brush))
        return (r, c) =>
          this.targetAt(r, c) === this.brush && this.paint[r]![c] !== 2
      return (r, c) => left.has(this.potAt(r, c))
    }
    return (r, c) => this.paint[r]![c]! < 2
  }

  /** Where a hop from `from` ends up (after a spring), or null off the board. */
  private landing(from: Cell, dir: number): { mid: Cell; end: Cell } | null {
    const [dr, dc] = MOVES[dir]!
    const mid = { r: from.r + dr, c: from.c + dc }
    if (!this.onBoard(mid.r, mid.c)) return null
    const kind = this.board.special[cellKey(mid.r, mid.c)]
    if (kind !== 'spring' && kind !== 'ice' && kind !== 'conveyor')
      return { mid, end: mid }
    const steps = kind === 'spring' ? 2 : 1
    const end = {
      r: mid.r + (kind === 'conveyor' ? 1 : dr * steps),
      c: mid.c + (kind === 'conveyor' ? 1 : dc * steps),
    }
    return this.onBoard(end.r, end.c) ? { mid, end } : null
  }

  private demoInput(): InputFrame {
    const frame = this.idleFrame()
    const me = this.me
    if (me.hop > 0 || this.riding || me.falling > 0) return frame
    const keys: Array<keyof InputFrame['held']> = [
      'up',
      'right',
      'down',
      'left',
    ]
    const danger = this.danger()
    // Boing right next to us and a disc beside: take it.
    const boingNear = this.enemies.some(
      (e) =>
        e.kind === 'boing' && Math.abs(e.r - me.r) + Math.abs(e.c - me.c) <= 2,
    )
    if (boingNear) {
      for (const d of this.discs) {
        if (d.used) continue
        for (let dir = 0; dir < 4; dir++) {
          const [dr, dc] = MOVES[dir]!
          if (me.r + dr === d.r && me.c + dc === d.c)
            return this.press(frame, keys[dir]!)
        }
      }
    }
    // Breadth-first to the nearest tile that still wants paint, avoiding danger (and, where done
    // tiles flip back, avoiding done tiles too unless there is no other way).
    const want = this.pilotWants()
    const start = `${me.r},${me.c}`
    const careful = this.rule.flips && !this.boss
    let prev = new Map<string, { from: string; dir: number }>()
    let goal: string | null = null
    for (const avoidDone of careful ? [true, false] : [false]) {
      prev = new Map([[start, { from: '', dir: -1 }]])
      const queue: Cell[] = [{ r: me.r, c: me.c }]
      while (queue.length && !goal) {
        const cur = queue.shift()!
        for (let dir = 0; dir < 4; dir++) {
          const hop = this.landing(cur, dir)
          if (!hop) continue
          const key = `${hop.end.r},${hop.end.c}`
          const midKey = `${hop.mid.r},${hop.mid.c}`
          if (prev.has(key) || danger.has(key) || danger.has(midKey)) continue
          if (want(hop.end.r, hop.end.c) || want(hop.mid.r, hop.mid.c)) {
            prev.set(key, { from: `${cur.r},${cur.c}`, dir })
            goal = key
            break
          }
          if (avoidDone && this.paint[hop.end.r]![hop.end.c] === 2) continue
          prev.set(key, { from: `${cur.r},${cur.c}`, dir })
          queue.push(hop.end)
        }
      }
      if (goal) break
    }
    if (!goal) {
      // Nowhere wanted is safe: just step somewhere safe.
      for (let dir = 0; dir < 4; dir++) {
        const hop = this.landing(me, dir)
        if (!hop) continue
        const key = `${hop.end.r},${hop.end.c}`
        if (!danger.has(key)) return this.press(frame, keys[dir]!)
      }
      return frame
    }
    // Walk back to the first step.
    let step = goal
    while (prev.get(step)!.from !== start) step = prev.get(step)!.from
    return this.press(frame, keys[prev.get(step)!.dir]!)
  }

  private press(frame: InputFrame, key: keyof InputFrame['held']): InputFrame {
    frame.held[key] = true
    frame.pressed[key] = true
    return frame
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    const screen = this.screens[0]
    if (
      screen &&
      (screen.kind === 'menu' ||
        screen.kind === 'gallery' ||
        screen.kind === 'map')
    ) {
      this.renderSky(g)
      if (screen.kind === 'menu') this.renderMenu(g, screen.cursor)
      else if (screen.kind === 'gallery') this.renderGallery(g)
      else this.renderMap(g, screen.t, screen.final)
      vignette(g, W, H, 0.4)
      return
    }
    this.renderSky(g)
    if (this.boss?.kind === 'max') this.renderMax(g, this.boss)
    if (this.boss?.kind === 'globe') this.renderGlobe(g, this.boss)
    for (const cell of this.board.cells) this.renderCube(g, cell.r, cell.c)
    for (const d of this.discs) if (!d.used) this.renderDisc(g, d)
    if (this.riding) this.renderRide(g)
    const drawn: Array<{ y: number; draw: () => void }> = []
    for (const e of this.enemies) {
      const at = this.pos(e)
      this.renderShadow(g, e)
      drawn.push({ y: at.y, draw: () => this.renderEnemy(g, e, at) })
    }
    const boss = this.boss
    if (boss?.kind === 'rattle') {
      const at = this.pos(boss)
      this.renderShadow(g, boss)
      drawn.push({ y: at.y, draw: () => this.renderRattle(g, boss, at) })
    }
    if (!this.riding && this.dead === 0) {
      const at = this.pos(this.me)
      this.renderShadow(g, this.me)
      drawn.push({ y: at.y, draw: () => this.renderMe(g, at) })
    }
    // Things lower on the board draw last (in front).
    for (const d of drawn.sort((a, b) => a.y - b.y)) d.draw()
    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, p.life / 30)
      g.fillStyle = INK
      g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 3, 3)
      g.fillStyle = p.color
      g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 2, 2)
    }
    g.globalAlpha = 1
    this.fx.render(g)
    for (const f of this.floaters)
      drawText(g, f.text, f.x, f.y, {
        align: 'center',
        color: RAMPS.gold[3],
        outline: INK,
      })
    if (this.freeze > 0) {
      // Frost: an icy wash that flickers as the freeze runs out.
      const fading = this.freeze < 60 && Math.floor(this.tick / 6) % 2
      g.fillStyle = rgba(RAMPS.water[4], fading ? 0.04 : 0.1)
      g.fillRect(0, 0, W, H)
    }
    vignette(g, W, H, 0.4)
    if (screen?.kind === 'title') {
      this.renderTitle(g, screen.t)
      return
    }
    if (screen?.kind === 'demo') {
      this.renderHud(g)
      this.renderRuleDemo(g, screen.t, screen.rule)
      return
    }
    this.renderHud(g)
  }

  private renderSky(g: CanvasRenderingContext2D) {
    const s = this.scheme
    const sky = this.sky
    // Deep space in HDMA bands, tinted by the round, with nebula and the planet's own dressing.
    cachedLayer(g, `pixel-hop-sky-${s.id}-${sky}`, W, H, (k) => {
      bandedGradient(
        k,
        0,
        0,
        W,
        H,
        [
          RAMPS.night[0],
          RAMPS.night[1],
          mix(RAMPS.night[2], s.left, 0.25),
          mix(RAMPS.night[3], s.left, 0.45),
        ],
        6,
      )
      for (const n of NEBULA) {
        k.fillStyle = rgba(mix(s.mid, RAMPS.night[3], 0.5), 0.07)
        for (const grow of [1, 0.7, 0.4]) {
          k.beginPath()
          k.ellipse(n.x, n.y, n.rx * grow, n.ry * grow, -0.25, 0, Math.PI * 2)
          k.fill()
        }
      }
      if (sky === 'comet') {
        // A gumdrop comet streaking past, its tail candy-striped.
        for (let i = 9; i >= 0; i--) {
          const x = 30 + i * 9
          const y = 72 - i * 4
          k.fillStyle = rgba(i % 2 ? '#ffffff' : s.start, 0.55 - i * 0.045)
          k.beginPath()
          k.arc(x, y, 7 - i * 0.5, 0, Math.PI * 2)
          k.fill()
        }
        shadedOrb(k, 30, 72, 8, rampOf(s.target), { outline: RAMPS.night[0] })
        shadedOrb(k, 226, 64, 6, rampOf(s.mid), { outline: RAMPS.night[0] })
      } else if (sky === 'glacier') {
        // Aurora ribbons curve over a cratered blue moon.
        shadedOrb(k, 225, 67, 22, RAMPS.sky, {
          outline: RAMPS.night[0],
        })
        for (let i = 0; i < 6; i++) {
          k.strokeStyle = rgba(i % 2 ? s.mid : s.target, 0.3)
          k.lineWidth = 2 + (i % 3)
          k.beginPath()
          k.moveTo(0, 31 + i * 5)
          k.bezierCurveTo(70, 12 + i * 7, 120, 82 - i * 4, W, 34 + i * 6)
          k.stroke()
        }
        shadedOrb(k, 23, 72, 7, RAMPS.cream, {
          outline: RAMPS.night[0],
        })
      } else if (sky === 'ring') {
        // A big ringed world, its ring painted in circus stripes.
        const ring = rampOf(s.target)
        shadedOrb(k, 222, 70, 18, rampOf(s.start), { outline: RAMPS.night[0] })
        k.lineWidth = 3
        for (let i = 0; i < 12; i++) {
          k.strokeStyle = i % 2 ? '#fff7ed' : ring[2]
          k.beginPath()
          const a0 = (i / 12) * Math.PI * 2
          k.ellipse(222, 70, 34, 8, -0.25, a0, a0 + Math.PI / 6)
          k.stroke()
        }
        shadedOrb(k, 26, 58, 7, RAMPS.steel, { outline: RAMPS.night[0] })
      } else {
        // A distant moon, upper left, and a ringed planet, upper right.
        shadedOrb(k, 26, 66, 8, RAMPS.steel, { outline: RAMPS.night[0] })
        k.fillStyle = rgba(RAMPS.night[0], 0.75)
        k.beginPath()
        k.arc(30, 63, 7, 0, Math.PI * 2)
        k.fill()
        const ring = rampOf(s.target)
        k.lineWidth = 2
        k.strokeStyle = ring[1]
        k.beginPath()
        k.ellipse(232, 62, 22, 5, -0.3, Math.PI, Math.PI * 2)
        k.stroke()
        shadedOrb(k, 232, 62, 12, rampOf(s.start), {
          outline: RAMPS.night[0],
        })
        k.strokeStyle = ring[3]
        k.beginPath()
        k.ellipse(232, 62, 22, 5, -0.3, 0, Math.PI)
        k.stroke()
      }
      // The board's own light on the space behind it.
      glow(k, APEX_X, 130, 120, s.target, 0.12)
    })
    drawStars(g, SKY_STARS, this.tick, RAMPS.purple)
    // Space dust drifting past, nearer, so a touch faster and brighter.
    const drift = (this.tick * 0.2) % W
    g.save()
    for (const shift of [-drift, W - drift]) {
      g.translate(shift, 0)
      drawStars(g, DUST, this.tick + 40, RAMPS.sky)
      g.translate(-shift, 0)
    }
    g.restore()
    // Two ranges of floating crags far below, the nearer one sliding faster.
    drawRidge(g, FAR_CRAGS, {
      base: H - 18,
      bottom: H,
      width: W,
      offset: this.tick * 0.12,
      fill: mix(RAMPS.night[2], s.left, 0.35),
      rim: mix(RAMPS.night[4], s.left, 0.35),
    })
    drawRidge(g, NEAR_CRAGS, {
      base: H - 4,
      bottom: H,
      width: W,
      offset: this.tick * 0.3,
      fill: RAMPS.night[1],
      rim: RAMPS.night[3],
    })
  }

  /** The sprite for a cube in its current state. */
  private cubeFor(r: number, c: number): PixelSprite {
    const s = this.scheme
    const tile = this.paint[r]![c]!
    if (this.picture) {
      const pot = this.potAt(r, c)
      if (pot) return cubeSprite(this.picture.palette[pot - 1]!, s)
      const colour = this.picture.palette[this.targetAt(r, c) - 1] ?? s.start
      return cubeSprite(tile === 2 ? colour : ghostOf(colour), s)
    }
    return cubeSprite([s.start, s.mid, s.target][tile]!, s)
  }

  private renderCube(g: CanvasRenderingContext2D, r: number, c: number) {
    const { x, y } = this.at(r, c)
    const tile = this.paint[r]![c]!
    const left = x - CUBE_W / 2 - 1
    const top = y - FACE_H / 2 - 1
    drawSprite(g, this.cubeFor(r, c), left, top, { anchor: 'topleft' })
    // A fresh coat flashes white and fades into its new ramp.
    const since = this.tick - (this.flashes.get(cellKey(r, c)) ?? -99)
    let shine = since < 14 ? 1 - since / 14 : 0
    // Done tiles catch a glint sweeping across the board now and then
    // (the whole board strobes when it is finished).
    if (this.clear > 0) {
      if ((r + c + Math.floor(this.tick / 4)) % 4 === 0) shine = 0.7
    } else if (tile === 2 && !this.potAt(r, c)) {
      const sweep = ((this.tick % 200) / 200) * (W + 160) - 80
      shine = Math.max(shine, 0.4 - Math.abs(x + y * 0.5 - sweep) / 30)
    }
    // Max's coin ring pulses until it is painted.
    const max = this.boss?.kind === 'max' ? this.boss : null
    if (
      max &&
      tile !== 2 &&
      max.ring.some((cell) => cell.r === r && cell.c === c)
    ) {
      shine = Math.max(shine, 0.25 + 0.2 * Math.sin(this.tick / 6))
    }
    if (shine > 0) {
      g.save()
      g.globalCompositeOperation = 'lighter'
      drawSprite(g, TOP_FLASH, left + 1, top + 1, {
        anchor: 'topleft',
        alpha: shine * 0.8,
      })
      g.restore()
    }
    const pot = this.potAt(r, c)
    if (pot && this.picture) {
      drawSprite(g, potSprite(this.picture.palette[pot - 1]!), x, y + 1)
    }
    const special = this.board.special[cellKey(r, c)]
    if (special === 'spring') {
      drawSprite(g, SPRING_SPRITE, x, y + 1)
    } else if (special === 'ice' || special === 'conveyor') {
      g.fillStyle = rgba(RAMPS.water[4], 0.75)
      g.fillRect(x - 6, y - 2, 12, 2)
      g.fillStyle = RAMPS.sky[3]
      g.fillRect(x - 3, y - 5, 2, 2)
      g.fillRect(x + 2, y - 4, 2, 2)
    }
    if (this.boss?.kind === 'globe') {
      const crack = GLOBE_CRACKS[this.boss.cracks]
      if (crack?.r === r && crack?.c === c) {
        glow(g, x, y - 4, 16, RAMPS.gold[3], 0.45)
        drawSprite(g, COIN_SPRITE, x, y - 2)
      }
    }
    if (max && !max.sneeze) {
      const slot = MAX_PHASES[max.phase]!.slot
      if (slot.r === r && slot.c === c) {
        const bob = Math.round(Math.sin(this.tick / 8))
        glow(g, x, y, 10, RAMPS.gold[3], 0.35)
        drawSprite(g, COIN_SPRITE, x, y - 1 + bob)
      }
    }
  }

  private discPos(d: Cell) {
    const at = this.at(d.r, d.c)
    return { x: at.x, y: at.y + 6 }
  }

  private renderDisc(g: CanvasRenderingContext2D, d: Cell) {
    const { x, y } = this.discPos(d)
    this.drawDisc(g, x, y, false)
  }

  private drawDisc(
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    lit: boolean,
  ) {
    const frame = Math.floor(this.tick / 5) % DISC_SPRITES.length
    const hue = DISC_RAMPS[frame]!
    glow(g, x, y + 1, lit ? 20 : 13, hue[3], lit ? 0.6 : 0.35)
    // It hovers: a little bob over its own faint shadow.
    const bob = Math.round(Math.sin(this.tick / 9 + x) * 1)
    if (!lit) dropShadow(g, x, y + 7, 6, 1.5, 0.3)
    drawSprite(g, DISC_SPRITES[frame]!, x, y + 1 + bob)
  }

  private renderRide(g: CanvasRenderingContext2D) {
    const ride = this.riding!
    const from = ride.from
    const home = this.at(this.home.r, this.home.c)
    const to = { x: home.x, y: home.y - 26 }
    const t = 1 - ride.t / 90
    // A comet trail of fading afterimages back down the path.
    g.save()
    g.globalCompositeOperation = 'lighter'
    for (let i = 1; i <= 5; i++) {
      const tt = Math.max(0, t - i * 0.03)
      const tx = from.x + (to.x - from.x) * tt
      const ty = from.y + (to.y - from.y) * tt
      g.fillStyle = rgba(DISC_RAMPS[(i + this.tick) % 4]![3], 0.5 - i * 0.08)
      g.fillRect(Math.round(tx) - 6 + i, Math.round(ty) + 1, 12 - i * 2, 2)
    }
    g.restore()
    const x = from.x + (to.x - from.x) * t
    const y = from.y + (to.y - from.y) * t
    this.drawDisc(g, x, y, true)
    this.renderMe(g, { x, y: y - 2 })
  }

  /** A soft shadow on the tile under a hopper, smaller the higher it hops. */
  private renderShadow(g: CanvasRenderingContext2D, h: Hopper) {
    if (h.falling > 0) return
    const to = this.at(h.r, h.c)
    let x = to.x
    let y = to.y
    let lift = 0
    if (h.hop > 0) {
      const span = h.span ?? HOP_TICKS
      const t = 1 - h.hop / span
      const arc = h.arc ?? 14
      if (h.fr < 0) lift = (1 - t) * 50 + Math.sin(t * Math.PI) * arc
      else {
        // Hopping off the edge: no tile to land the shadow on past halfway.
        if (!this.onBoard(h.r, h.c) && t > 0.5) return
        const from = this.at(h.fr, h.fc)
        x = from.x + (to.x - from.x) * t
        y = from.y + (to.y - from.y) * t
        lift = Math.sin(t * Math.PI) * arc
      }
    } else if (!this.onBoard(h.r, h.c)) return
    const k = Math.max(0.35, 1 - lift / 40)
    dropShadow(g, x, y + 1, 7 * k, 2.5 * k, 0.45 * k)
  }

  private renderMe(g: CanvasRenderingContext2D, at: { x: number; y: number }) {
    const me = this.me
    const face = facing(me)
    const airborne = me.hop > 0 || me.falling > 0
    const sprite = PIP_SPRITES[face.back ? 1 : 0]![airborne ? 1 : 0]!
    drawSprite(g, sprite, at.x + (face.left ? -2 : 2), at.y + 2, {
      anchor: 'feet',
      flipX: face.left,
    })
    if (this.picture) {
      // The brush Pip carries, dripping its colour.
      const ramp = rampOf(this.picture.palette[this.brush - 1]!)
      const bx = Math.round(at.x + (face.left ? 9 : -9))
      const by = Math.round(at.y - 15)
      g.fillStyle = INK
      g.fillRect(bx - 2, by - 1, 5, 9)
      g.fillStyle = RAMPS.earth[3]
      g.fillRect(bx - 1, by, 3, 4)
      g.fillStyle = ramp[2]
      g.fillRect(bx - 1, by + 4, 3, 3)
      g.fillStyle = ramp[4]
      g.fillRect(bx - 1, by + 4, 1, 1)
    }
  }

  private renderEnemy(
    g: CanvasRenderingContext2D,
    e: Enemy,
    at: { x: number; y: number },
  ) {
    const face = facing(e)
    const airborne = e.hop > 0 || e.falling > 0
    const every = this.hopEvery()
    const landing =
      !airborne && (e.wait > every - 5 || this.freeze > 0 || this.dead > 0)
    const x = at.x
    const y = at.y + 1
    let sprite: PixelSprite
    if (e.kind === 'boing') {
      sprite = BOING_SPRITES[airborne ? 1 : 0]!
    } else if (e.kind === 'gremlin') {
      sprite = gremlinSprites(this.scheme)[
        airborne ? Math.floor(this.tick / 4) % 2 : 0
      ]!
    } else {
      if (e.kind === 'green')
        glow(
          g,
          x,
          y - 5,
          12,
          RAMPS.leaf[3],
          0.3 + 0.15 * Math.sin(this.tick / 5),
        )
      sprite = GUMBALL_SPRITES[e.kind][landing ? 1 : 0]
    }
    drawSprite(g, sprite, x, y, { anchor: 'feet', flipX: face.left })
    if (this.freeze > 0) {
      // Frozen solid: an icy sheen over the sprite.
      g.save()
      g.globalCompositeOperation = 'lighter'
      drawSprite(g, sprite, x, y, {
        anchor: 'feet',
        flipX: face.left,
        alpha: 0.35,
      })
      g.restore()
      g.fillStyle = RAMPS.water[4]
      if (Math.floor(this.tick / 10 + e.c) % 3 === 0)
        g.fillRect(Math.round(x) + 2, Math.round(y) - sprite.height + 2, 1, 1)
    }
  }

  /** Gumball Machine Max: a glass globe of gumballs on a cherry-red dispenser, above the apex. */
  private renderMax(g: CanvasRenderingContext2D, max: MaxBoss) {
    const apex = this.at(0, 0)
    const shake =
      max.sneeze > 60 ? Math.round(Math.sin(this.tick * 1.9) * 2) : 0
    const beaten = max.sneezes >= MAX_PHASES.length
    const cx = Math.round(apex.x + shake)
    const base = Math.round(
      apex.y - 26 + (beaten ? 0 : Math.sin(this.tick / 14)),
    )
    glow(g, cx, base - 6, 26, RAMPS.pink[3], 0.25)
    // The globe, its gumballs and the gold knob on top.
    shadedOrb(g, cx, base - 8, 10, RAMPS.sky, { outline: INK })
    const balls = ['#ef4444', '#facc15', '#4ade80', '#c084fc', '#38bdf8']
    for (let i = 0; i < 9 - max.sneezes * 2; i++) {
      const a = i * 2.3 + (max.sneeze ? this.tick / 3 : 0)
      const bx = cx + Math.round(Math.cos(a) * (2 + (i % 3) * 2))
      const by = base - 6 + Math.round(Math.sin(a) * 2) + (i % 3)
      g.fillStyle = balls[i % balls.length]!
      g.fillRect(bx - 1, by - 1, 2, 2)
    }
    g.fillStyle = 'rgba(255, 255, 255, 0.7)'
    g.fillRect(cx - 6, base - 14, 2, 3)
    shadedOrb(g, cx, base - 19, 3, RAMPS.gold, { outline: INK })
    // The cherry-red dispenser: face, coin slot and spout.
    g.fillStyle = INK
    g.fillRect(cx - 14, base - 1, 28, 12)
    g.fillStyle = RAMPS.ember[2]
    g.fillRect(cx - 13, base, 26, 10)
    g.fillStyle = RAMPS.ember[3]
    g.fillRect(cx - 13, base, 26, 2)
    g.fillStyle = RAMPS.ember[1]
    g.fillRect(cx - 13, base + 8, 26, 2)
    // Eyes: cross while he spits, squeezed shut mid-sneeze, happy once beaten.
    g.fillStyle = '#ffffff'
    g.fillRect(cx - 9, base + 3, 4, 3)
    g.fillRect(cx - 3, base + 3, 4, 3)
    g.fillStyle = INK
    if (beaten || max.sneeze > 0) {
      g.fillRect(cx - 9, base + 4, 4, 1)
      g.fillRect(cx - 3, base + 4, 4, 1)
    } else {
      g.fillRect(cx - 7, base + 4, 2, 2)
      g.fillRect(cx - 3, base + 4, 2, 2)
      g.fillRect(cx - 10, base + 2, 3, 1)
      g.fillRect(cx, base + 2, 3, 1)
    }
    g.fillStyle = INK
    g.fillRect(cx + 6, base + 2, 2, 6)
    g.fillStyle = RAMPS.gold[3]
    g.fillRect(cx + 7, base + 2, 1, 2)
    // The spout opens as he spits.
    g.fillStyle = INK
    g.fillRect(cx - 4, base + 10, 8, max.spit > 0 ? 5 : 3)
    g.fillStyle = RAMPS.steel[3]
    g.fillRect(cx - 3, base + 10, 6, max.spit > 0 ? 4 : 2)
    if (max.sneeze > 40)
      drawText(g, 'AH-CHOO!', cx + 30, base - 14, {
        align: 'center',
        color: '#ffffff',
        outline: INK,
      })
  }

  /** A glass dome with drifting snow; its fractures light up as Pip paints. */
  private renderGlobe(g: CanvasRenderingContext2D, boss: GlobeBoss) {
    const offset = boss.shaking > 0 ? Math.round(Math.sin(this.tick) * 2) : 0
    const x = this.at(this.home.r, this.home.c).x + offset
    const y = this.at(this.home.r, this.home.c).y - 27
    glow(g, x, y, 26, RAMPS.sky[3], 0.35)
    shadedOrb(g, x, y, 14, RAMPS.sky, { outline: INK })
    g.fillStyle = rgba('#ffffff', 0.8)
    for (let i = 0; i < 8; i++) {
      const a = i * 2.4 + this.tick * 0.04
      g.fillRect(
        Math.round(x + Math.cos(a) * 10),
        Math.round(y + Math.sin(a) * 8),
        2,
        2,
      )
    }
    g.fillStyle = RAMPS.gold[4]
    for (let i = 0; i < boss.cracks; i++) {
      g.fillRect(x - 8 + i * 5, y + 12, 3, 2)
    }
  }

  /** Ringmaster Rattle: a striped spinning top in a little top hat. */
  private renderRattle(
    g: CanvasRenderingContext2D,
    b: RattleBoss,
    at: { x: number; y: number },
  ) {
    const dizzy = b.dizzy > 0
    const wobble = dizzy ? Math.round(Math.sin(this.tick / 4) * 2) : 0
    const x = Math.round(at.x + wobble)
    const y = Math.round(at.y)
    const spin = dizzy ? this.tick * 0.15 : this.tick * 0.6 * b.dir
    // The top: an ink outline, then red and cream stripes rolling round it.
    g.fillStyle = INK
    g.fillRect(x - 1, y - 2, 3, 3)
    for (let px = -10; px <= 10; px++) {
      const half = Math.round(Math.sqrt(Math.max(0, 1 - (px / 10.5) ** 2)) * 6)
      if (half <= 0) continue
      g.fillStyle = INK
      g.fillRect(x + px, y - 9 - half, 1, half * 2 + 2)
    }
    for (let px = -9; px <= 9; px++) {
      const h = Math.round(Math.sqrt(Math.max(0, 1 - (px / 10) ** 2)) * 6)
      if (h <= 0) continue
      const band = Math.floor((px + spin + 30) / 3) % 2
      const lit = px < 0 ? 1 : 0
      g.fillStyle = band
        ? lit
          ? '#fff7ed'
          : RAMPS.cream[2]
        : lit
          ? RAMPS.ember[3]
          : RAMPS.ember[2]
      g.fillRect(x + px, y - 8 - h, 1, h * 2)
    }
    g.fillStyle = RAMPS.gold[3]
    g.fillRect(x - 9, y - 9, 19, 1)
    // His face and a tiny top hat.
    shadedOrb(g, x, y - 18, 5, RAMPS.cream, { outline: INK })
    g.fillStyle = INK
    if (dizzy) {
      g.fillRect(x - 3, y - 19, 2, 1)
      g.fillRect(x + 1, y - 19, 2, 1)
      g.fillRect(x - 1, y - 16, 2, 1)
    } else {
      g.fillRect(x - 2, y - 20, 1, 2)
      g.fillRect(x + 2, y - 20, 1, 2)
      g.fillRect(x - 2, y - 16, 5, 1)
    }
    g.fillRect(x - 5, y - 24, 11, 2)
    g.fillRect(x - 3, y - 30, 7, 7)
    g.fillStyle = RAMPS.ember[2]
    g.fillRect(x - 2, y - 26, 5, 2)
    g.fillStyle = RAMPS.purple[1]
    g.fillRect(x - 2, y - 29, 5, 3)
    if (dizzy) {
      // Stars circling his head.
      for (let i = 0; i < 3; i++) {
        const a = this.tick / 8 + (i * Math.PI * 2) / 3
        g.fillStyle = RAMPS.gold[4]
        g.fillRect(
          Math.round(x + Math.cos(a) * 9),
          Math.round(y - 30 + Math.sin(a) * 3),
          2,
          2,
        )
      }
    }
  }

  private renderHud(g: CanvasRenderingContext2D) {
    // Score, and the colour to paint (or the brush's colour), in one box at the upper left.
    hudPanel(g, 4, 3, 82, 36)
    drawText(g, String(this.score).padStart(6, '0'), 9, 6, {
      scale: 2,
      color: RAMPS.gold[3],
      shadow: INK,
    })
    const picture = this.picture
    const colour = picture
      ? picture.palette[this.brush - 1]!
      : this.scheme.target
    drawText(g, picture ? 'BRUSH' : 'PAINT', 9, 26, {
      color: RAMPS.teal[4],
      outline: INK,
    })
    const pulse = 0.5 + 0.5 * Math.sin(this.tick / 10)
    glow(g, 50, 28, 9, colour, 0.25 + 0.25 * pulse)
    drawSprite(g, miniCube(colour, this.scheme), 50, 29)
    for (
      let i = 0;
      i < this.brushes.size && this.mode === 'planets' && i < 3;
      i++
    )
      drawSprite(g, BRUSH_SPRITE, 64 + i * 8, 29)
    // Hi score, the round and spare hoppers at the upper right.
    hudPanel(g, W - 84, 3, 80, 36)
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W - 9, 7, {
      align: 'right',
      color: RAMPS.pink[3],
      outline: INK,
    })
    const stage = STAGES[this.stage]!
    drawText(
      g,
      this.mode === 'planets'
        ? `${PLANETS[stage.planet]!.short} ${stage.round}/6`
        : `LEVEL ${this.level}`,
      W - 9,
      17,
      { align: 'right', color: RAMPS.teal[3], outline: INK },
    )
    for (let i = 0; i < Math.min(this.lives - 1, 5); i++)
      drawSprite(g, PIP_LIFE, W - 15 - i * 12, 31)
    // Freeze time left, while it lasts.
    if (this.freeze > 0) {
      hudPanel(g, 4, H - 17, 68, 13)
      drawText(g, 'ICE', 9, H - 14, { color: RAMPS.water[4], outline: INK })
      gauge(g, 30, H - 13, 37, 5, this.freeze / FREEZE_TICKS, RAMPS.water)
    }
    if (picture) {
      // The picture being painted, as a mini-map at the lower right.
      hudPanel(g, W - 52, H - 44, 48, 40)
      drawPicture(
        g,
        this.board,
        picture.palette,
        W - 28,
        H - 39,
        4,
        (cell) => this.paint[cell.r]![cell.c] === 2,
      )
    }
    const boss = this.boss
    if (boss) {
      const hits =
        boss.kind === 'max'
          ? boss.sneezes
          : boss.kind === 'rattle'
            ? boss.bonks
            : boss.cracks
      const total =
        boss.kind === 'max'
          ? MAX_PHASES.length
          : boss.kind === 'rattle'
            ? RATTLE_PHASES.length
            : GLOBE_CRACKS.length
      hudPanel(g, W - 84, H - 19, 80, 15)
      drawText(
        g,
        boss.kind === 'max'
          ? 'MAX'
          : boss.kind === 'rattle'
            ? 'RATTLE'
            : 'GLOBE',
        W - 79,
        H - 15,
        {
        color: RAMPS.ember[3],
          outline: INK,
        },
      )
      for (let i = 0; i < total; i++) {
        g.fillStyle = INK
        g.fillRect(W - 37 + i * 10, H - 16, 8, 8)
        g.fillStyle = i < hits ? RAMPS.leaf[3] : RAMPS.ember[2]
        g.fillRect(W - 36 + i * 10, H - 15, 6, 6)
      }
    }
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, H - 44, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.purple[1],
      })
      if (this.banner.sub)
        drawText(g, this.banner.sub, W / 2, H - 24, {
          align: 'center',
          color: RAMPS.gold[3],
          outline: INK,
        })
    }
  }

  // --- screens --------------------------------------------------------------------

  private renderMenu(g: CanvasRenderingContext2D, cursor: number) {
    drawText(g, 'PIXEL HOP', W / 2, 28, {
      scale: 3,
      align: 'center',
      color: RAMPS.gold[3],
      outline: INK,
      shadow: RAMPS.ember[1],
    })
    drawText(g, 'THE PAINTED PLANETS', W / 2, 58, {
      align: 'center',
      color: RAMPS.pink[3],
      outline: INK,
    })
    const labels: Record<MenuItem, string> = {
      continue: `CONTINUE: ${PLANETS[this.stored?.planet ?? 0]!.name}`,
      planets: 'THE PAINTED PLANETS',
      endless: 'ENDLESS PYRAMID',
      gallery: 'THE GALLERY',
    }
    const notes: Record<MenuItem, string> = {
      continue: `SCORE ${this.stored?.score ?? 0}`,
      planets: 'HOP PLANET TO PLANET',
      endless: 'THE CLASSIC MARATHON',
      gallery: `${Object.keys(this.gallery).length}/${PICTURES.length} PICTURES  ${this.brushes.size}/6 BRUSHES`,
    }
    const items = this.menuItems
    hudPanel(g, 22, 76, W - 44, 30 + items.length * 26)
    items.forEach((item, i) => {
      const y = 88 + i * 26
      const on = i === cursor
      if (on) {
        const bob = Math.round(Math.sin(this.tick / 6))
        drawSprite(g, PIP_LIFE, 36 + bob, y + 4)
      }
      drawText(g, labels[item], 48, y, {
        color: on ? '#ffffff' : RAMPS.steel[3],
        outline: INK,
      })
      drawText(g, notes[item], 48, y + 10, {
        color: on ? RAMPS.teal[3] : RAMPS.steel[2],
        outline: INK,
      })
    })
    if (Math.floor(this.tick / 30) % 2)
      drawText(g, 'UP/DOWN, THEN A', W / 2, H - 22, {
        align: 'center',
        color: RAMPS.gold[4],
        outline: INK,
      })
  }

  private renderGallery(g: CanvasRenderingContext2D) {
    drawText(g, 'THE GALLERY', W / 2, 16, {
      scale: 2,
      align: 'center',
      color: RAMPS.gold[3],
      outline: INK,
    })
    PICTURES.forEach((picture, i) => {
      const x = 28 + i * 104
      const y = 50
      const frame = this.gallery[picture.id] ?? 0
      hudPanel(g, x, y, 96, 100, frame === 2 ? RAMPS.gold : RAMPS.purple)
      const stage = STAGES.find((s) => s.picture?.id === picture.id)!
      if (frame) {
        drawPicture(
          g,
          stage.board,
          picture.palette,
          x + 48,
          y + 12,
          9,
          () => true,
        )
      } else {
        drawText(g, '?', x + 48, y + 34, {
          scale: 3,
          align: 'center',
          color: RAMPS.steel[2],
          outline: INK,
        })
      }
      drawText(g, frame ? picture.name : '???', x + 48, y + 106, {
        align: 'center',
        color: frame === 2 ? RAMPS.gold[3] : '#ffffff',
        outline: INK,
      })
      drawText(
        g,
        frame === 2
          ? 'GOLD FRAME'
          : frame
            ? 'FRAMED'
            : PLANETS[stage.planet]!.name,
        x + 48,
        y + 116,
        { align: 'center', color: RAMPS.teal[3], outline: INK },
      )
    })
    drawText(g, `GOLDEN BRUSHES ${this.brushes.size}/6`, W / 2, 186, {
      align: 'center',
      color: RAMPS.gold[4],
      outline: INK,
    })
    for (let i = 0; i < 6; i++) {
      const has = this.brushes.has(i)
      drawSprite(g, BRUSH_SPRITE, W / 2 - 50 + i * 20, 204, {
        alpha: has ? 1 : 0.25,
      })
    }
    drawText(g, 'MORE PICTURES ON PLANETS YET TO COME', W / 2, 220, {
      align: 'center',
      color: RAMPS.steel[3],
      outline: INK,
    })
  }

  private renderMap(g: CanvasRenderingContext2D, t: number, final: boolean) {
    g.fillStyle = rgba(RAMPS.night[0], 0.45)
    g.fillRect(0, 0, W, H)
    drawText(g, 'THE PAINTED PLANETS', W / 2, 12, {
      scale: 2,
      align: 'center',
      color: RAMPS.gold[3],
      outline: INK,
    })
    // The hop path between the planets, a dot at a time.
    for (let i = 0; i < MAP_PLANETS.length - 1; i++) {
      const a = MAP_PLANETS[i]!
      const b = MAP_PLANETS[i + 1]!
      for (let k = 1; k < 8; k++) {
        const x = a.x + ((b.x - a.x) * k) / 8
        const y = a.y + ((b.y - a.y) * k) / 8 - Math.sin((k / 8) * Math.PI) * 10
        g.fillStyle = i < PLANETS.length - 1 ? RAMPS.gold[3] : RAMPS.steel[1]
        g.fillRect(Math.round(x), Math.round(y), 2, 2)
      }
    }
    MAP_PLANETS.forEach((spot, i) => {
      const planet = PLANETS[i]
      if (planet) {
        glow(g, spot.x, spot.y, 22, planet.orb.body, 0.3)
        g.lineWidth = 2
        g.strokeStyle = planet.orb.ring
        g.beginPath()
        g.ellipse(spot.x, spot.y, 20, 5, -0.3, Math.PI, Math.PI * 2)
        g.stroke()
        shadedOrb(g, spot.x, spot.y, 12, rampOf(planet.orb.body))
        g.beginPath()
        g.ellipse(spot.x, spot.y, 20, 5, -0.3, 0, Math.PI)
        g.stroke()
        drawText(g, planet.name, spot.x, spot.y + 18, {
          align: 'center',
          color: '#ffffff',
          outline: INK,
        })
        if (this.brushes.has(i))
          drawSprite(g, BRUSH_SPRITE, spot.x + 14, spot.y - 12)
      } else {
        shadedOrb(g, spot.x, spot.y, 9, RAMPS.steel)
        drawText(g, '?', spot.x, spot.y - 3, {
          align: 'center',
          color: RAMPS.night[1],
        })
      }
    })
    // Pip, bouncing on the planet the run is bound for.
    const here = MAP_PLANETS[final ? PLANETS.length - 1 : this.planet]!
    const bounce = Math.abs(Math.sin(t / 10)) * 8
    drawSprite(
      g,
      PIP_SPRITES[0]![bounce > 2 ? 1 : 0]!,
      here.x,
      here.y - 12 - bounce,
      {
        anchor: 'feet',
      },
    )
    // Pictures painted so far.
    PICTURES.forEach((picture, i) => {
      const x = 16 + i * 40
      const frame = this.gallery[picture.id] ?? 0
      hudPanel(g, x, H - 40, 34, 30, frame === 2 ? RAMPS.gold : RAMPS.purple)
      const stage = STAGES.find((s) => s.picture?.id === picture.id)!
      if (frame)
        drawPicture(
          g,
          stage.board,
          picture.palette,
          x + 17,
          H - 35,
          3,
          () => true,
        )
      else
        drawText(g, '?', x + 17, H - 29, {
          align: 'center',
          color: RAMPS.steel[2],
          outline: INK,
        })
    })
    drawText(
      g,
      final
        ? 'MORE PLANETS ARE BEING PAINTED'
        : `NEXT: ${PLANETS[this.planet]!.name}`,
      W - 10,
      H - 36,
      { align: 'right', color: RAMPS.pink[3], outline: INK },
    )
    if (Math.floor(t / 30) % 2)
      drawText(g, final ? 'A: ENCORE' : 'A: HOP ON', W - 10, H - 22, {
        align: 'right',
        color: RAMPS.gold[4],
        outline: INK,
      })
  }

  private renderTitle(g: CanvasRenderingContext2D, t: number) {
    const planet = PLANETS[this.planet]!
    const fade = Math.min(1, t / 20, (TITLE_TICKS - t) / 20)
    g.fillStyle = rgba(RAMPS.night[0], 0.72 * Math.max(0, fade))
    g.fillRect(0, 0, W, H)
    if (fade <= 0) return
    g.save()
    g.globalAlpha = Math.max(0, fade)
    const slide = Math.round((1 - Math.min(1, t / 24)) * 40)
    glow(g, W / 2, 86, 40, planet.orb.body, 0.4)
    g.lineWidth = 3
    g.strokeStyle = planet.orb.ring
    g.beginPath()
    g.ellipse(W / 2, 86, 46, 10, -0.25, Math.PI, Math.PI * 2)
    g.stroke()
    shadedOrb(g, W / 2, 86, 26, rampOf(planet.orb.body))
    g.beginPath()
    g.ellipse(W / 2, 86, 46, 10, -0.25, 0, Math.PI)
    g.stroke()
    drawText(g, `PLANET ${this.planet + 1}`, W / 2, 30 - slide, {
      align: 'center',
      color: RAMPS.teal[3],
      outline: INK,
    })
    drawText(g, planet.name, W / 2, 128 + slide, {
      scale: 2,
      align: 'center',
      color: RAMPS.gold[3],
      outline: INK,
      shadow: RAMPS.ember[1],
    })
    planet.card.forEach((line, i) =>
      drawText(g, line, W / 2, 156 + i * 12, {
        align: 'center',
        color: i ? '#ffffff' : RAMPS.pink[3],
        outline: INK,
      }),
    )
    g.restore()
  }

  /**
   * The rule demonstration: Pip hops a three-row pyramid in a speech panel and shows what the
   * new rule does to one tile, before the round begins.
   */
  private renderRuleDemo(g: CanvasRenderingContext2D, t: number, rule: RuleId) {
    const panel = { x: 28, y: 48, w: W - 56, h: 150 }
    hudPanel(g, panel.x, panel.y, panel.w, panel.h, RAMPS.teal)
    drawText(g, 'NEW RULE!', W / 2, panel.y + 7, {
      scale: 2,
      align: 'center',
      color: RAMPS.gold[3],
      outline: INK,
    })
    const s = this.scheme
    const state = this.demoState(t, rule)
    const ox = W / 2
    const oy = panel.y + 44
    const where = (r: number, c: number) => ({
      x: ox + (c - r / 2) * CUBE_W,
      y: oy + r * ROW_H,
    })
    for (let r = 0; r < 3; r++)
      for (let c = 0; c <= r; c++) {
        const { x, y } = where(r, c)
        const top = state.tops.get(cellKey(r, c)) ?? s.start
        drawSprite(
          g,
          cubeSprite(top, s),
          x - CUBE_W / 2 - 1,
          y - FACE_H / 2 - 1,
          {
            anchor: 'topleft',
          },
        )
        if (state.pot && state.pot.r === r && state.pot.c === c)
          drawSprite(g, potSprite(state.potColour), x, y + 1)
      }
    const a = where(state.from.r, state.from.c)
    const b = where(state.to.r, state.to.c)
    const x = a.x + (b.x - a.x) * state.p
    const y = a.y + (b.y - a.y) * state.p - Math.sin(state.p * Math.PI) * 14
    const back = state.to.r < state.from.r
    const left = state.to.c - state.from.c - (state.to.r - state.from.r) / 2 < 0
    drawSprite(
      g,
      PIP_SPRITES[back ? 1 : 0]![state.p > 0 && state.p < 1 ? 1 : 0]!,
      x + (left ? -2 : 2),
      y + 2,
      { anchor: 'feet', flipX: left },
    )
    const [one, two] = RULE_CAPTIONS[rule]
    drawText(g, one, W / 2, panel.y + 120, {
      align: 'center',
      color: '#ffffff',
      outline: INK,
    })
    drawText(g, two, W / 2, panel.y + 132, {
      align: 'center',
      color: RAMPS.teal[3],
      outline: INK,
    })
  }

  /**
   * Where the rule demonstration is at tick `t`: Pip's hop, and every tile's top colour. Pure:
   * it replays the scripted landings up to `t`, so it never touches the game.
   */
  private demoState(
    t: number,
    rule: RuleId,
  ): {
    from: Cell
    to: Cell
    p: number
    tops: Map<string, string>
    pot: Cell | null
    potColour: string
  } {
    const s = this.scheme
    const picture = rule === 'picture'
    const palette = picture
      ? (this.picture?.palette ?? [s.target, s.mid, s.start])
      : []
    // The picture demo: a pot of colour 2 at the top, tiles wanting colour 2 below it.
    const pot = picture ? { r: 0, c: 0 } : null
    const path: Cell[] = picture
      ? [
          { r: 1, c: 1 },
          { r: 0, c: 0 },
          { r: 1, c: 0 },
          { r: 2, c: 1 },
          { r: 1, c: 1 },
          { r: 2, c: 2 },
        ]
      : [
          { r: 0, c: 0 },
          { r: 1, c: 0 },
          { r: 0, c: 0 },
          { r: 1, c: 0 },
          { r: 0, c: 0 },
          { r: 1, c: 0 },
        ]
    const hops = Math.max(0, Math.floor((t - DEMO_LEAD) / DEMO_HOP))
    const done = Math.min(path.length - 1, hops)
    const p =
      hops >= path.length - 1
        ? 1
        : Math.min(1, ((t - DEMO_LEAD) % DEMO_HOP) / (DEMO_HOP * 0.55))
    const from = path[Math.min(done, path.length - 1)]!
    const to = path[Math.min(done + 1, path.length - 1)]!
    const tops = new Map<string, string>()
    if (picture) {
      const want: Record<string, number> = {
        '1,0': 2,
        '1,1': 1,
        '2,0': 1,
        '2,1': 2,
        '2,2': 1,
      }
      for (const [key, colour] of Object.entries(want))
        tops.set(key, ghostOf(palette[colour - 1]!))
      tops.set('1,1', palette[0]!)
      tops.set('0,0', palette[1]!)
      let brush = 1
      for (let i = 1; i <= done && t >= DEMO_LEAD; i++) {
        const cell = path[i]!
        const key = cellKey(cell.r, cell.c)
        if (cell.r === 0) brush = 2
        else if (want[key] === brush) tops.set(key, palette[brush - 1]!)
      }
    } else {
      const steps = RULES[rule].steps
      const tone = (level: number) =>
        level >= steps ? s.target : level > 0 ? s.mid : s.start
      tops.set('0,0', s.target)
      const levels = ruleDemo(RULES[rule]).levels
      let landed = 0
      for (let i = 1; i <= done && t >= DEMO_LEAD; i++)
        if (path[i]!.r === 1) landed++
      tops.set('1,0', landed ? tone(levels[landed - 1]!) : s.start)
    }
    return {
      from,
      to,
      p: t < DEMO_LEAD ? 0 : p,
      tops,
      pot,
      potColour: palette[1] ?? s.target,
    }
  }

  // --- cosmetic effects (never touch the game's rng) ------------------------------

  /** A tile changed colour: flash it, and sparkle in the new colour when it went the right way. */
  private tileFx(r: number, c: number, better: boolean, done: boolean) {
    this.flashes.set(cellKey(r, c), this.tick)
    if (!better) return
    const at = this.at(r, c)
    const colour =
      this.picture && done
        ? this.picture.palette[this.targetAt(r, c) - 1]!
        : done
          ? this.scheme.target
          : this.scheme.mid
    const ramp = rampOf(colour)
    this.fx.burst(at.x, at.y, this.fxRng, {
      count: done ? 9 : 5,
      colours: [ramp[3], ramp[4], RAMPS.gold[4]],
      speed: done ? 1.5 : 1,
    })
  }
}

const pixelHop: ArcadeGameModule = {
  create: (options) => new PixelHop(options),
}

export const create = pixelHop.create
export default pixelHop
