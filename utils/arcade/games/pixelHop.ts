// /utils/arcade/games/pixelHop.ts
//
// Pixel Hop -- the Kind Robots Arcade's Q*bert riff (conductor kr-arcade/t-009
// game factory, batch 3). Hop a pyramid of tiles diagonally and repaint every
// top to the target colour. Gumballs drop in at the top and bounce down; a
// purple gumball hatches into Boing, a grumpy spring bot who follows you hop by
// hop. Hop off the edge onto a floating disc and it whisks you back to the
// top (and Boing, if he's right behind you, boings off after you). A green
// gumball freezes everyone for a few seconds; a repaint gremlin hops down
// undoing your work until you catch it.
//
// The painting rule tightens every four rounds: one hop paints a tile, then
// two hops (through a halfway colour), then a hop on a finished tile turns it
// back, then both at once. Hopping off the pyramid anywhere but a disc, or
// meeting a gumball or Boing, costs a life.
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
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'

const W = 256
const H = 240
const ROWS = 7
const CUBE_W = 28
const ROW_H = 21
const FACE_H = 14
const SIDE_H = 16
const APEX_X = W / 2
const APEX_Y = 44
const HOP_TICKS = 16
const START_LIVES = 3
const ROUND_CLEAR_TICKS = 140
const DEATH_TICKS = 100
const FREEZE_TICKS = 60 * 4
const ROUNDS_PER_LEVEL = 4
const EXTRA_EVERY = 12_000

const PAINT_POINTS = 25
const ROUND_BONUS = 1000
const BOING_LURE_POINTS = 500
const GREMLIN_POINTS = 300
const FREEZE_POINTS = 100

export const HOP_CURVES = {
  /** Ticks between enemy hops (lower is faster). */
  enemyHop: { start: 30, step: -1.5, limit: 16 },
  /** Ticks between new gumballs. */
  dropEvery: { start: 260, step: -14, limit: 110 },
  /** Chance a new arrival is a repaint gremlin. */
  gremlinChance: { start: -0.15, step: 0.05, limit: 0.3 },
} as const

/** Colour schemes per round: tile side colours, start, halfway and target tops. */
const SCHEMES = [
  {
    left: '#1e3a8a',
    right: '#172554',
    start: '#60a5fa',
    mid: '#a78bfa',
    target: '#fde047',
  },
  {
    left: '#365314',
    right: '#1a2e05',
    start: '#a3e635',
    mid: '#2dd4bf',
    target: '#f472b6',
  },
  {
    left: '#7c2d12',
    right: '#431407',
    start: '#fb923c',
    mid: '#facc15',
    target: '#38bdf8',
  },
  {
    left: '#581c87',
    right: '#3b0764',
    start: '#c084fc',
    mid: '#f9a8d4',
    target: '#4ade80',
  },
]

type Cell = { r: number; c: number }
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
  /** Off the pyramid: falling to the bottom of the screen. */
  falling: number
}
type EnemyKind = 'gumball' | 'purple' | 'boing' | 'green' | 'gremlin'
type Enemy = Hopper & { kind: EnemyKind; wait: number }
type Disc = { side: -1 | 1; row: number; used: boolean }
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = { x: number; y: number; text: string; life: number }

function onPyramid(r: number, c: number): boolean {
  return r >= 0 && r < ROWS && c >= 0 && c <= r
}

function cubeTop(r: number, c: number): { x: number; y: number } {
  return { x: APEX_X + (c - r / 2) * CUBE_W, y: APEX_Y + r * ROW_H }
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

/** Per colour scheme: a cube per paint state (start, halfway, target). */
const CUBE_SPRITES = SCHEMES.map((s) => {
  const left = rampOf(s.left)
  const right = rampOf(s.right)
  return [s.start, s.mid, s.target].map((top) =>
    pixelSprite(CUBE_ROWS, cubePalette(rampOf(top), left, right)),
  )
})

/** A little target cube for the HUD. */
const MINI_CUBES = SCHEMES.map((s) =>
  pixelSprite(
    cubeRows(14, 8, 6, false),
    cubePalette(rampOf(s.target), rampOf(s.left), rampOf(s.right)),
  ),
)

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
) as Record<'gumball' | 'purple' | 'green', [PixelSprite, PixelSprite]>

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
const GREMLIN_SPRITES = SCHEMES.map((s) => {
  const brush = rampOf(s.start)
  const palette = {
    ...rampPalette(RAMPS.leaf),
    w: '#ffffff',
    k: INK,
    h: RAMPS.earth[3],
    p: brush[4],
    B: brush[2],
    b: brush[1],
  }
  return [
    [...GREMLIN_BODY, '.0..0.........'],
    [...GREMLIN_BODY, '..0..0........'],
  ].map((rows) => pixelSprite(rows, palette))
})

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
  private round = 1
  /** Each tile's paint: 0 start, 1 halfway, 2 target. */
  private paint: number[][] = []
  private me: Hopper = { r: 0, c: 0, fr: 0, fc: 0, hop: 0, falling: 0 }
  private queued = -1
  private riding: { t: number; side: -1 | 1; row: number } | null = null
  private enemies: Enemy[] = []
  private discs: Disc[] = []
  private dropTimer = 120
  private freeze = 0
  private clear = 0
  private dead = 0
  private nextExtra = EXTRA_EVERY
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null
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
    this.startRound(1)
  }

  private get scheme() {
    return SCHEMES[(this.round - 1) % SCHEMES.length]!
  }

  /** The painting rule: hops to finish a tile, and whether a finished tile turns back. */
  private get rule(): { hops: 1 | 2; flips: boolean } {
    const tier = (this.level - 1) % 4
    return { hops: tier === 1 || tier === 3 ? 2 : 1, flips: tier >= 2 }
  }

  // --- rounds ------------------------------------------------------------------

  private startRound(round: number) {
    this.round = round
    this.level = 1 + Math.floor((round - 1) / ROUNDS_PER_LEVEL)
    this.paint = Array.from({ length: ROWS }, (_, r) => Array(r + 1).fill(0))
    this.discs = [
      { side: -1, row: 2 + Math.floor(this.rng() * 4), used: false },
      { side: 1, row: 2 + Math.floor(this.rng() * 4), used: false },
    ]
    this.resetPositions()
    const rule = this.rule
    this.banner = {
      text: `LEVEL ${this.level}  ROUND ${((round - 1) % ROUNDS_PER_LEVEL) + 1}`,
      sub:
        rule.hops === 2 && rule.flips
          ? 'TWO HOPS, AND DONE TILES FLIP BACK'
          : rule.hops === 2
            ? 'TWO HOPS PAINT A TILE'
            : rule.flips
              ? 'DONE TILES FLIP BACK'
              : 'HOP EVERY TILE',
      ticks: 100,
    }
  }

  private resetPositions() {
    this.me = { r: 0, c: 0, fr: 0, fc: 0, hop: 0, falling: 0 }
    this.queued = -1
    this.riding = null
    this.enemies = []
    this.dropTimer = 120
    this.freeze = 0
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    const controls = this.demo ? this.demoInput() : input
    if (this.clear > 0) {
      if (--this.clear === 0) this.startRound(this.round + 1)
      return
    }
    if (this.dead > 0) {
      if (--this.dead === 0) {
        if (this.lives <= 0) {
          this.over = true
          this.banner = { text: 'GAME OVER', ticks: 9999 }
        } else {
          // Back on the pyramid where you were (or the top after a fall).
          const r = onPyramid(this.me.r, this.me.c) ? this.me.r : 0
          const c = onPyramid(this.me.r, this.me.c) ? this.me.c : 0
          this.me = { r, c, fr: r, fc: c, hop: 0, falling: 0 }
          this.enemies = []
          this.dropTimer = 90
        }
      }
      return
    }
    this.readInput(controls)
    this.moveMe()
    if (this.freeze > 0) this.freeze--
    else this.moveEnemies()
    this.spawn()
    this.collide()
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
        me.r = 0
        me.c = 0
        me.fr = 0
        me.fc = 0
        me.hop = 0
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
    this.sound.play('blip')
  }

  /** Landed at the end of a hop: on a tile, onto a disc, or off into the air. */
  private arrive() {
    const me = this.me
    if (onPyramid(me.r, me.c)) {
      this.land()
      return
    }
    // A disc beside the row we just left?
    const side: -1 | 1 = me.c < 0 || me.c < me.r / 2 ? -1 : 1
    const disc = this.discs.find(
      (d) =>
        !d.used && d.side === side && d.row === me.fr && me.r === me.fr - 1,
    )
    if (disc) {
      disc.used = true
      this.riding = { t: 90, side, row: disc.row }
      const spot = this.discPos(side, disc.row)
      this.fx.burst(spot.x, spot.y, this.fxRng, { count: 8 })
      this.sound.play('extra')
      // Boing, hot on your heels, boings straight off after you.
      for (const e of this.enemies) {
        if (e.kind !== 'boing' || e.hop > 0) continue
        if (Math.abs(e.r - me.fr) + Math.abs(e.c - me.fc) <= 1) {
          e.falling = 50
          const at = cubeTop(e.r, e.c)
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
    const rule = this.rule
    const tile = this.paint[r]![c]!
    let next = tile
    if (tile < 2) next = rule.hops === 1 ? 2 : tile + 1
    else if (rule.flips) next = rule.hops === 1 ? 0 : 1
    if (next !== tile) {
      this.paint[r]![c] = next
      this.tileFx(r, c, next > tile, next === 2)
      if (next > tile) {
        const at = cubeTop(r, c)
        this.addScore(PAINT_POINTS, at.x, at.y - 14)
      }
    }
    if (this.paint.every((row) => row.every((t) => t === 2))) this.roundClear()
  }

  private roundClear() {
    const bonus = ROUND_BONUS + 250 * (this.round - 1)
    const unused = this.discs.filter((d) => !d.used).length
    this.addScore(bonus + unused * 50, W / 2, 120)
    this.clear = ROUND_CLEAR_TICKS
    this.enemies = []
    for (let r = 0; r < ROWS; r += 2)
      for (let c = 0; c <= r; c++) {
        const at = cubeTop(r, c)
        this.fx.burst(at.x, at.y, this.fxRng, { count: 3 })
      }
    this.banner = {
      text: 'PYRAMID PAINTED!',
      sub: `BONUS ${bonus}${unused ? `  DISCS ${unused * 50}` : ''}`,
      ticks: ROUND_CLEAR_TICKS,
    }
    this.sound.play('level')
  }

  private spawn() {
    if (--this.dropTimer > 0) return
    this.dropTimer = Math.round(levelCurve(this.round, HOP_CURVES.dropEvery))
    if (this.enemies.length >= 4) return
    const roll = this.rng()
    const hasBoing = this.enemies.some(
      (e) => e.kind === 'boing' || e.kind === 'purple',
    )
    let kind: EnemyKind = 'gumball'
    if (!hasBoing && roll < 0.35) kind = 'purple'
    else if (
      roll <
      0.35 + Math.max(0, levelCurve(this.round, HOP_CURVES.gremlinChance))
    )
      kind = 'gremlin'
    else if (roll > 0.9) kind = 'green'
    // Drops in onto the second row, left or right.
    const c = this.rng() < 0.5 ? 0 : 1
    this.enemies.push({
      kind,
      r: 1,
      c,
      fr: -1,
      fc: 0,
      hop: HOP_TICKS,
      falling: 0,
      wait: 20,
    })
  }

  private moveEnemies() {
    const every = Math.round(levelCurve(this.round, HOP_CURVES.enemyHop))
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
      (e) => !(e.falling === 1 || e.r > ROWS + 2),
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
        if (!onPyramid(r, c)) continue
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
    // Everything else bounces down, left or right at random.
    return this.rng() < 0.5 ? [1, 0] : [1, 1]
  }

  private enemyArrive(e: Enemy) {
    if (!onPyramid(e.r, e.c)) {
      e.falling = 40
      return
    }
    if (e.kind === 'purple' && e.r === ROWS - 1) {
      // At the bottom the purple gumball hatches into Boing.
      e.kind = 'boing'
      this.burst(cubeTop(e.r, e.c).x, cubeTop(e.r, e.c).y, 10, '#c084fc')
      this.sound.play('warn')
    }
    if (e.kind === 'gremlin' && this.paint[e.r]![e.c]! > 0) {
      this.paint[e.r]![e.c]!--
      this.tileFx(e.r, e.c, false, false)
    }
  }

  private collide() {
    const me = this.me
    if (this.riding || me.falling > 0) return
    const mine = this.pos(me)
    for (const e of [...this.enemies]) {
      if (e.falling > 0) continue
      const at = this.pos(e)
      if (Math.hypot(at.x - mine.x, at.y - mine.y) > 10) continue
      if (e.kind === 'green') {
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
    this.dead = DEATH_TICKS
    const at = this.pos(this.me)
    this.burst(at.x, at.y, 16, '#fb923c')
    this.sound.play('die')
    this.banner = { text: '#?%!', sub: why, ticks: DEATH_TICKS }
  }

  /** Screen position of a hopper's feet, arcing through its current hop. */
  private pos(h: Hopper): { x: number; y: number } {
    const to = cubeTop(h.r, h.c)
    if (h.hop <= 0) {
      if (h.falling > 0) return { x: to.x, y: to.y + (50 - h.falling) * 3 }
      return to
    }
    const from = h.fr < 0 ? { x: to.x, y: to.y - 50 } : cubeTop(h.fr, h.fc)
    const t = 1 - h.hop / HOP_TICKS
    return {
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t - Math.sin(t * Math.PI) * 14,
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
      for (const [dr, dc] of e.kind === 'boing' ? MOVES : MOVES.slice(1, 3))
        cells.add(`${e.r + dr},${e.c + dc}`)
    }
    return cells
  }

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
    const me = this.me
    if (me.hop > 0 || this.riding || me.falling > 0) return frame
    const keys: Array<keyof typeof held> = ['up', 'right', 'down', 'left']
    const danger = this.danger()
    // Boing right next to us and a disc on this row: take it.
    const boingNear = this.enemies.some(
      (e) =>
        e.kind === 'boing' && Math.abs(e.r - me.r) + Math.abs(e.c - me.c) <= 2,
    )
    if (boingNear) {
      for (const d of this.discs) {
        if (d.used || d.row !== me.r) continue
        if (d.side === -1 && me.c === 0) return this.press(frame, 'left')
        if (d.side === 1 && me.c === me.r) return this.press(frame, 'up')
      }
    }
    // Breadth-first to the nearest tile that still wants paint, avoiding danger.
    const want = (r: number, c: number) => this.paint[r]![c]! < 2
    const start = `${me.r},${me.c}`
    const prev = new Map<string, { from: string; dir: number }>([
      [start, { from: '', dir: -1 }],
    ])
    const queue: Cell[] = [{ r: me.r, c: me.c }]
    let goal: string | null = null
    while (queue.length && !goal) {
      const cur = queue.shift()!
      for (let dir = 0; dir < 4; dir++) {
        const [dr, dc] = MOVES[dir]!
        const r = cur.r + dr
        const c = cur.c + dc
        const key = `${r},${c}`
        if (!onPyramid(r, c) || prev.has(key) || danger.has(key)) continue
        prev.set(key, { from: `${cur.r},${cur.c}`, dir })
        if (want(r, c)) {
          goal = key
          break
        }
        queue.push({ r, c })
      }
    }
    if (!goal) {
      // Nowhere wanted is safe: just step somewhere safe.
      for (let dir = 0; dir < 4; dir++) {
        const [dr, dc] = MOVES[dir]!
        const key = `${me.r + dr},${me.c + dc}`
        if (onPyramid(me.r + dr, me.c + dc) && !danger.has(key))
          return this.press(frame, keys[dir]!)
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
    this.renderSky(g)
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c <= r; c++) this.renderCube(g, r, c)
    for (const d of this.discs)
      if (!d.used) this.renderDisc(g, d.side, d.row, false)
    if (this.riding) this.renderRide(g)
    const drawn: Array<{ y: number; draw: () => void }> = []
    for (const e of this.enemies) {
      const at = this.pos(e)
      this.renderShadow(g, e)
      drawn.push({ y: at.y, draw: () => this.renderEnemy(g, e, at) })
    }
    if (!this.riding && this.dead === 0) {
      const at = this.pos(this.me)
      this.renderShadow(g, this.me)
      drawn.push({ y: at.y, draw: () => this.renderMe(g, at) })
    }
    // Things lower on the pyramid draw last (in front).
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
    this.renderHud(g)
  }

  private renderSky(g: CanvasRenderingContext2D) {
    const index = (this.round - 1) % SCHEMES.length
    const s = this.scheme
    // Deep space in HDMA bands, tinted by the round, with nebula, a moon and a ringed planet.
    cachedLayer(g, `pixel-hop-sky-${index}`, W, H, (k) => {
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
      // The pyramid's own light on the space behind it.
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

  private renderCube(g: CanvasRenderingContext2D, r: number, c: number) {
    const { x, y } = cubeTop(r, c)
    const index = (this.round - 1) % SCHEMES.length
    const tile = this.paint[r]![c]!
    const left = x - CUBE_W / 2 - 1
    const top = y - FACE_H / 2 - 1
    drawSprite(g, CUBE_SPRITES[index]![tile]!, left, top, {
      anchor: 'topleft',
    })
    // A fresh coat flashes white and fades into its new ramp.
    const since = this.tick - (this.flashes.get(`${r},${c}`) ?? -99)
    let shine = since < 14 ? 1 - since / 14 : 0
    // Done tiles catch a glint sweeping across the pyramid now and then
    // (the whole pyramid strobes when it is finished).
    if (this.clear > 0) {
      if ((r + c + Math.floor(this.tick / 4)) % 4 === 0) shine = 0.7
    } else if (tile === 2) {
      const sweep = ((this.tick % 200) / 200) * (W + 160) - 80
      shine = Math.max(shine, 0.4 - Math.abs(x + y * 0.5 - sweep) / 30)
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
  }

  private discPos(side: -1 | 1, row: number) {
    const edge = cubeTop(row, side < 0 ? 0 : row)
    return { x: edge.x + side * CUBE_W * 0.9, y: edge.y - ROW_H * 0.6 }
  }

  private renderDisc(
    g: CanvasRenderingContext2D,
    side: -1 | 1,
    row: number,
    lit: boolean,
  ) {
    const { x, y } = this.discPos(side, row)
    this.drawDisc(g, x, y, lit)
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
    const from = this.discPos(ride.side, ride.row)
    const to = { x: APEX_X, y: APEX_Y - 26 }
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
    const to = cubeTop(h.r, h.c)
    let x = to.x
    let y = to.y
    let lift = 0
    if (h.hop > 0) {
      const t = 1 - h.hop / HOP_TICKS
      if (h.fr < 0) lift = (1 - t) * 50 + Math.sin(t * Math.PI) * 14
      else {
        // Hopping off the edge: no tile to land the shadow on past halfway.
        if (!onPyramid(h.r, h.c) && t > 0.5) return
        const from = cubeTop(h.fr, h.fc)
        x = from.x + (to.x - from.x) * t
        y = from.y + (to.y - from.y) * t
        lift = Math.sin(t * Math.PI) * 14
      }
    } else if (!onPyramid(h.r, h.c)) return
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
  }

  private renderEnemy(
    g: CanvasRenderingContext2D,
    e: Enemy,
    at: { x: number; y: number },
  ) {
    const face = facing(e)
    const airborne = e.hop > 0 || e.falling > 0
    const every = Math.round(levelCurve(this.round, HOP_CURVES.enemyHop))
    const landing =
      !airborne && (e.wait > every - 5 || this.freeze > 0 || this.dead > 0)
    const x = at.x
    const y = at.y + 1
    let sprite: PixelSprite
    if (e.kind === 'boing') {
      sprite = BOING_SPRITES[airborne ? 1 : 0]!
    } else if (e.kind === 'gremlin') {
      const index = (this.round - 1) % SCHEMES.length
      sprite =
        GREMLIN_SPRITES[index]![airborne ? Math.floor(this.tick / 4) % 2 : 0]!
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

  private renderHud(g: CanvasRenderingContext2D) {
    const index = (this.round - 1) % SCHEMES.length
    // Score, and the colour to paint, in one box at the upper left.
    hudPanel(g, 4, 3, 82, 36)
    drawText(g, String(this.score).padStart(6, '0'), 9, 6, {
      scale: 2,
      color: RAMPS.gold[3],
      shadow: INK,
    })
    drawText(g, 'PAINT', 9, 26, { color: RAMPS.teal[4], outline: INK })
    const pulse = 0.5 + 0.5 * Math.sin(this.tick / 10)
    glow(g, 50, 28, 9, this.scheme.target, 0.25 + 0.25 * pulse)
    drawSprite(g, MINI_CUBES[index]!, 50, 29)
    // Hi score, level and spare hoppers at the upper right.
    hudPanel(g, W - 84, 3, 80, 36)
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W - 9, 7, {
      align: 'right',
      color: RAMPS.pink[3],
      outline: INK,
    })
    drawText(g, `LEVEL ${this.level}`, W - 9, 17, {
      align: 'right',
      color: RAMPS.teal[3],
      outline: INK,
    })
    for (let i = 0; i < Math.min(this.lives - 1, 5); i++)
      drawSprite(g, PIP_LIFE, W - 15 - i * 12, 31)
    // Freeze time left, while it lasts.
    if (this.freeze > 0) {
      hudPanel(g, 4, H - 17, 68, 13)
      drawText(g, 'ICE', 9, H - 14, { color: RAMPS.water[4], outline: INK })
      gauge(g, 30, H - 13, 37, 5, this.freeze / FREEZE_TICKS, RAMPS.water)
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

  // --- cosmetic effects (never touch the game's rng) ------------------------------

  /** A tile changed colour: flash it, and sparkle in the new colour when it went the right way. */
  private tileFx(r: number, c: number, better: boolean, done: boolean) {
    this.flashes.set(`${r},${c}`, this.tick)
    if (!better) return
    const at = cubeTop(r, c)
    const ramp = rampOf(done ? this.scheme.target : this.scheme.mid)
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
