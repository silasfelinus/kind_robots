// /utils/arcade/games/lanternSwarm.ts
//
// Lantern Swarm -- the Kind Robots Arcade's Galaga riff (conductor
// kr-arcade/t-009 game factory, batch 4). Night moths swirl in along looping
// flight paths and settle into a swaying formation above your paper lantern.
// Then they peel off and dive at you, dropping dust. Beam each one with light
// and it flutters home happy; one that dives past you loops back to its place.
//
// Queen moths take two beams. Sometimes a queen glides down and shines a
// tractor glow: get caught in it and she carries your lantern off (that costs
// a lantern). Beam her down later and the rescued lantern docks beside your
// new one for twin beams; while twinned, a hit only knocks one off.
//
// Every third stage is a glow stage: the swarm just flies through, no dust and
// no diving, with a bonus for every moth beamed and a big one for all forty.
// SWARM_CURVES ramp the dives, their speed and the dust.
//
// Left/right move, A beams.

import { levelCurve } from '../curve'
import { drawText } from '../font'
import {
  INK,
  RAMPS,
  Sparkles,
  backdropRng,
  bandedGradient,
  cachedLayer,
  drawSprite,
  glow,
  hudPanel,
  mix,
  pixelSprite,
  rgba,
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

const W = 224
const H = 288
const HUD_H = 22
const SHIP_Y = H - 30
const SHIP_SPEED = 1.9
const BEAM_SPEED = 5.5
const BEAMS_PER_SHIP = 2
const DUST_SPEED = 1.9
const SLOT_X = 18
const SLOT_Y = 15
const FORM_TOP = HUD_H + 26
const ENTER_SPEED = 2.4
const SPAWN_GAP = 9
const GROUP_GAP = 160
const RESPAWN_TICKS = 130
const SAFE_TICKS = 70
const CLEAR_TICKS = 120
const BEAM_TICKS = 150
const START_LIVES = 3
const FIRST_EXTRA = 20_000
const NEXT_EXTRA = 70_000
const GLOW_EVERY = 3
const GLOW_POINTS = 100
const GLOW_PERFECT = 10_000
const RESCUE_POINTS = 1000

export const SWARM_CURVES = {
  /** Ticks between dives once the swarm is in formation. */
  diveGap: { start: 170, step: -14, limit: 45 },
  /** Most moths diving at once. */
  divers: { start: 2, step: 1, limit: 7 },
  /** Diving speed. */
  diveSpeed: { start: 1.7, step: 0.12, limit: 3 },
  /** Chance per tick that a diving moth drops dust. */
  dust: { start: 0.012, step: 0.003, limit: 0.04 },
} as const

type Kind = 'moth' | 'luna' | 'queen'
type Mode = 'wait' | 'enter' | 'home' | 'form' | 'dive' | 'beam' | 'glow'
type Pt = { x: number; y: number }
type Moth = {
  kind: Kind
  hp: number
  col: number
  row: number
  x: number
  y: number
  heading: number
  speed: number
  mode: Mode
  path: Pt[]
  step: number
  /** Ticks spent heading for the current path point. */
  stepTicks: number
  spawnAt: number
  timer: number
  /** A queen holding a captured lantern. */
  holding: boolean
  gone: boolean
}
type Shot = { x: number; y: number; vx: number }
type Drifter = { x: number; y: number; tx: number; ty: number; dock: boolean }
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = { x: number; y: number; text: string; life: number }

const POINTS: Record<Kind, [number, number]> = {
  moth: [50, 100],
  luna: [80, 160],
  queen: [150, 400],
}

const mirror = (path: Pt[]): Pt[] => path.map((p) => ({ x: W - p.x, y: p.y }))
const TOP_L: Pt[] = [
  { x: W / 2 - 10, y: -10 },
  { x: W / 2 - 10, y: 110 },
  { x: 50, y: 190 },
  { x: 28, y: 140 },
  { x: 64, y: 112 },
]
const SIDE_L: Pt[] = [
  { x: -10, y: 230 },
  { x: 70, y: 215 },
  { x: 120, y: 165 },
  { x: 96, y: 120 },
  { x: 54, y: 142 },
]
const PATHS = {
  topL: TOP_L,
  topR: mirror(TOP_L),
  sideL: SIDE_L,
  sideR: mirror(SIDE_L),
}
type PathName = keyof typeof PATHS

/** The entrance: five groups, forty moths (queens on the top row). */
const GROUPS: Array<{ path: PathName; kinds: Kind[]; at: number }> = [
  { path: 'topL', kinds: ['luna', 'luna', 'luna', 'luna'], at: 0 },
  { path: 'topR', kinds: ['moth', 'moth', 'moth', 'moth'], at: 0 },
  {
    path: 'sideL',
    kinds: ['queen', 'luna', 'queen', 'luna', 'queen', 'luna', 'queen', 'luna'],
    at: 1,
  },
  {
    path: 'sideR',
    kinds: ['luna', 'luna', 'luna', 'luna', 'luna', 'luna', 'luna', 'luna'],
    at: 2,
  },
  {
    path: 'topL',
    kinds: ['moth', 'moth', 'moth', 'moth', 'moth', 'moth', 'moth', 'moth'],
    at: 3,
  },
  {
    path: 'topR',
    kinds: ['moth', 'moth', 'moth', 'moth', 'moth', 'moth', 'moth', 'moth'],
    at: 4,
  },
]

/** Formation rows for each kind: queens 4 wide, lunas 8, moths 10. */
const ROWS_FOR: Record<Kind, Array<{ row: number; cols: number[] }>> = {
  queen: [{ row: 0, cols: [3, 4, 5, 6] }],
  luna: [
    { row: 1, cols: [1, 2, 3, 4, 5, 6, 7, 8] },
    { row: 2, cols: [1, 2, 3, 4, 5, 6, 7, 8] },
  ],
  moth: [
    { row: 3, cols: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] },
    { row: 4, cols: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] },
  ],
}

// --- 16-bit art (utils/arcade/snes.ts) -------------------------------------------

/** The night sky in HDMA bands: ink at the zenith, a warm festival haze low down. */
const NIGHT_BANDS = [
  RAMPS.night[0],
  RAMPS.night[0],
  RAMPS.night[1],
  RAMPS.night[2],
  mix(RAMPS.night[2], RAMPS.purple[0], 0.6),
  RAMPS.purple[0],
  mix(RAMPS.purple[0], RAMPS.pink[0], 0.55),
  mix(RAMPS.pink[0], RAMPS.rust[0], 0.4),
]
/** Glow stages fly under an aurora. */
const AURORA_BANDS = [
  RAMPS.night[0],
  mix(RAMPS.night[1], RAMPS.teal[0], 0.5),
  RAMPS.teal[0],
  mix(RAMPS.teal[0], RAMPS.purple[0], 0.5),
  RAMPS.purple[0],
  mix(RAMPS.purple[0], RAMPS.pink[0], 0.5),
]

/** Two backdrop star layers under the game's own (nearest, fastest) stars. */
const FAR_STARS = starField(61, 90, W, H)
const MID_STARS = starField(67, 40, W, H)
const FAR_SPEED = 0.08
const MID_SPEED = 0.3
const NEBULA_SPEED = 0.05

/** Nebula wisps: long stepped streaks of coloured haze, laid out once. */
const WISPS = (() => {
  const rand = backdropRng(71)
  const ramps = [RAMPS.purple, RAMPS.pink, RAMPS.teal, RAMPS.sky, RAMPS.purple]
  return ramps.map((ramp, i) => ({
    x: 20 + rand() * (W - 40),
    y: (i / ramps.length) * H + rand() * 30,
    len: 80 + rand() * 90,
    thick: 7 + Math.round(rand() * 7),
    slant: (rand() - 0.5) * 3,
    phase: rand() * Math.PI * 2,
    ramp,
  }))
})()

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

type MothSet = {
  up: readonly [PixelSprite, PixelSprite]
  side: readonly [PixelSprite, PixelSprite]
}

/** Up- and left-facing sprites, two flap frames each (down and right are flips). */
function mothSet(
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

const MOTHS = mothSet(MOTH_ROWS, {
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
const LUNAS = mothSet(LUNA_ROWS, {
  a: RAMPS.leaf[3],
  k: INK,
  H: RAMPS.leaf[4],
  L: RAMPS.leaf[3],
  M: RAMPS.leaf[2],
  S: RAMPS.leaf[1],
  e: RAMPS.pink[2],
  W: '#ffffff',
  w: RAMPS.cream[2],
  T: RAMPS.pink[2],
  P: RAMPS.pink[1],
})
const queenPalette = (wings: Ramp, body: Ramp) => ({
  a: RAMPS.gold[3],
  g: RAMPS.gold[3],
  G: RAMPS.gold[4],
  k: INK,
  H: wings[4],
  L: wings[3],
  M: wings[2],
  S: wings[1],
  e: RAMPS.gold[3],
  B: body[3],
  b: body[1],
})
const QUEENS = mothSet(QUEEN_ROWS, queenPalette(RAMPS.purple, RAMPS.pink))
/** A queen with one beam in her goes blue, as in the original. */
const QUEENS_HURT = mothSet(QUEEN_ROWS, queenPalette(RAMPS.sky, RAMPS.teal))

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
const LIFE_SPRITE = pixelSprite(
  ['..n..', '.CCe.', 'RyYyq', 'RYwYq', 'RyYyq', '.cee.'],
  lanternPalette(RAMPS.rust, RAMPS.gold),
)

/** The lantern's beam of light: no outline, it glows instead. */
const BEAM_SPRITE = pixelSprite(
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

/** Moth dust: a glittering lilac mote. */
const DUST_SPRITES = [
  pixelSprite(['.p.', 'pPp', '.p.'], { p: RAMPS.pink[2], P: '#ffffff' }),
  pixelSprite(['.P.', 'PpP', '.P.'], { p: RAMPS.pink[3], P: RAMPS.purple[3] }),
] as const

/** The queen's tractor glow, banded light stepping down the beam. */
const TRACTOR = [RAMPS.purple[2], RAMPS.purple[3], RAMPS.teal[3]] as const

function paintNebula(k: CanvasRenderingContext2D) {
  const rand = backdropRng(73)
  for (const w of WISPS) {
    for (const wrap of [-H, 0, H]) {
      for (let row = -w.thick; row <= w.thick; row += 2) {
        const t = row / w.thick
        const width = w.len * (1 - t * t)
        const cx = w.x + row * w.slant + Math.sin(row * 0.35 + w.phase) * 7
        const y = Math.round(w.y + row + wrap)
        const passes: [string, number, number][] = [
          [w.ramp[1], 0.14, 1],
          [w.ramp[2], 0.1, 0.62],
          [w.ramp[3], 0.08, 0.3],
        ]
        for (const [colour, alpha, k2] of passes) {
          k.fillStyle = rgba(colour, alpha)
          k.fillRect(
            Math.round(cx - (width * k2) / 2),
            y,
            Math.round(width * k2),
            2,
          )
        }
      }
      // A glitter of brighter dust through the haze.
      k.fillStyle = rgba(w.ramp[3], 0.35)
      for (let i = 0; i < 26; i++) {
        const row = (rand() * 2 - 1) * w.thick
        const t = row / w.thick
        const along = (rand() - 0.5) * w.len * (1 - t * t)
        k.fillRect(
          Math.round(w.x + row * w.slant + along),
          Math.round(w.y + row + wrap),
          1,
          1,
        )
      }
    }
  }
}

const scrolling = new Map<string, HTMLCanvasElement | null>()

/**
 * A static layer that scrolls down the screen and wraps: painted once at logical size (it must
 * tile vertically), then copied twice a frame with nearest filtering. Headless it paints direct.
 * (A scrolling cousin of the kit's cachedLayer.)
 */
function scrollingLayer(
  g: CanvasRenderingContext2D,
  key: string,
  w: number,
  h: number,
  offset: number,
  paint: (layer: CanvasRenderingContext2D) => void,
) {
  let canvas = scrolling.get(key)
  if (canvas === undefined) {
    canvas = null
    if (typeof document !== 'undefined') {
      const made = document.createElement('canvas')
      made.width = w
      made.height = h
      const lg = made.getContext('2d')
      if (lg) {
        paint(lg)
        canvas = made
      }
    }
    scrolling.set(key, canvas)
  }
  const y = Math.floor(((offset % h) + h) % h)
  g.save()
  if (!canvas) {
    g.beginPath()
    g.rect(0, 0, w, h)
    g.clip()
    g.translate(0, y)
    paint(g)
    g.translate(0, -h)
    paint(g)
  } else {
    g.imageSmoothingEnabled = false
    g.drawImage(canvas, 0, y)
    g.drawImage(canvas, 0, y - h)
  }
  g.restore()
}

class LanternSwarm implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private stageTick = 0
  private x = W / 2
  private alive = true
  private twin = false
  private respawn = 0
  private safe = 0
  private beams: Shot[] = []
  private dust: Shot[] = []
  private moths: Moth[] = []
  private drifters: Drifter[] = []
  private diveTimer = 0
  private clear = 0
  private glow = false
  private glowHits = 0
  private glowTotal = 0
  private nextExtra = FIRST_EXTRA
  private stars: Array<{ x: number; y: number; s: number }> = []
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null
  // Cosmetic sparkles roll their own dice, so the game's seeded rng is untouched.
  private fx = new Sparkles()
  private fxRng = backdropRng(83)

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    for (let i = 0; i < 50; i++)
      this.stars.push({
        x: this.rng() * W,
        y: this.rng() * H,
        s: 0.2 + this.rng() * 0.8,
      })
    this.startStage(1)
  }

  // --- stages -------------------------------------------------------------------

  private startStage(stage: number) {
    this.level = stage
    this.glow = stage % GLOW_EVERY === 0
    this.stageTick = 0
    this.moths = []
    this.dust = []
    this.beams = []
    this.diveTimer = 120
    const used: Record<Kind, number> = { queen: 0, luna: 0, moth: 0 }
    for (const group of GROUPS) {
      group.kinds.forEach((kind, i) => {
        const slots = ROWS_FOR[kind].flatMap((r) =>
          r.cols.map((col) => ({ row: r.row, col })),
        )
        const slot = slots[used[kind]++ % slots.length]!
        const path = PATHS[group.path]
        const exit = this.glow
          ? [{ x: path[path.length - 1]!.x < W / 2 ? W + 20 : -20, y: 60 }]
          : []
        this.moths.push({
          kind,
          hp: kind === 'queen' ? 2 : 1,
          col: slot.col,
          row: slot.row,
          x: path[0]!.x,
          y: path[0]!.y,
          heading: Math.PI / 2,
          speed: ENTER_SPEED,
          mode: 'wait',
          path: [...path, ...exit],
          step: 1,
          stepTicks: 0,
          spawnAt: 30 + group.at * GROUP_GAP + i * SPAWN_GAP,
          timer: 0,
          holding: false,
          gone: false,
        })
      })
    }
    this.glowHits = 0
    this.glowTotal = this.moths.length
    this.banner = this.glow
      ? { text: 'GLOW STAGE', sub: 'BEAM AS MANY AS YOU CAN', ticks: 120 }
      : { text: `STAGE ${stage}`, ticks: 100 }
  }

  private slotPos(m: Moth): Pt {
    const sway = Math.sin(this.tick / 70) * 12
    return {
      x: W / 2 + (m.col - 4.5) * SLOT_X + sway,
      y: FORM_TOP + m.row * SLOT_Y,
    }
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    this.fx.update()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    for (const s of this.stars) {
      s.y += s.s
      if (s.y > H) s.y -= H
    }
    if (this.over) return
    if (this.clear > 0) {
      if (--this.clear === 0) this.startStage(this.level + 1)
      return
    }
    this.stageTick++
    const controls = this.demo ? this.demoInput() : input
    this.updateShip(controls)
    this.updateMoths()
    this.updateShots()
    this.updateDrifters()
    this.checkStageEnd()
  }

  private updateShip(input: InputFrame) {
    if (!this.alive) {
      if (this.respawn > 0 && --this.respawn === 0) {
        if (this.lives <= 0) {
          this.over = true
          this.banner = { text: 'LIGHTS OUT', sub: 'GAME OVER', ticks: 9999 }
          return
        }
        this.alive = true
        this.x = W / 2
        this.safe = SAFE_TICKS
      }
      return
    }
    if (this.safe > 0) this.safe--
    const half = this.twin ? 14 : 7
    if (input.held.left) this.x = Math.max(half, this.x - SHIP_SPEED)
    if (input.held.right) this.x = Math.min(W - half, this.x + SHIP_SPEED)
    if (input.pressed.a) {
      const guns = this.twin ? [this.x - 7, this.x + 7] : [this.x]
      if (this.beams.length + guns.length <= BEAMS_PER_SHIP * guns.length) {
        for (const gx of guns) this.beams.push({ x: gx, y: SHIP_Y - 8, vx: 0 })
        this.sound.play('shoot')
      }
    }
  }

  private updateMoths() {
    const diving = this.moths.filter(
      (m) => !m.gone && (m.mode === 'dive' || m.mode === 'beam'),
    ).length
    const entering = this.moths.some(
      (m) => !m.gone && (m.mode === 'wait' || m.mode === 'enter'),
    )
    for (const m of this.moths) {
      if (m.gone) continue
      switch (m.mode) {
        case 'wait':
          if (this.stageTick >= m.spawnAt) m.mode = this.glow ? 'glow' : 'enter'
          break
        case 'enter':
        case 'glow':
          if (m.mode === 'enter' && this.level >= 2) this.maybeDust(m, 0.4)
          if (this.followPath(m, 0.13)) {
            if (m.mode === 'glow') m.gone = true
            else m.mode = 'home'
          }
          break
        case 'home': {
          const slot = this.slotPos(m)
          this.steer(m, slot, 0.2, 2.2)
          if (Math.hypot(slot.x - m.x, slot.y - m.y) < 4) {
            m.mode = 'form'
            m.heading = Math.PI / 2
          }
          break
        }
        case 'form': {
          const slot = this.slotPos(m)
          m.x = slot.x
          m.y = slot.y
          break
        }
        case 'dive':
          this.dive(m)
          break
        case 'beam':
          this.tractor(m)
          break
      }
    }
    // Launch a new dive now and then (from stage 2, even mid-entrance).
    const early = this.level >= 2 && this.stageTick > 30 + 2 * GROUP_GAP
    if (
      !this.glow &&
      (!entering || early) &&
      this.alive &&
      --this.diveTimer <= 0
    ) {
      this.diveTimer = Math.round(
        levelCurve(this.level, SWARM_CURVES.diveGap) * (0.6 + this.rng() * 0.8),
      )
      if (diving < levelCurve(this.level, SWARM_CURVES.divers))
        this.launchDive()
    }
  }

  /** Steers along the moth's path; true when the last point is reached. */
  private followPath(m: Moth, turn: number): boolean {
    const target = m.path[m.step]
    if (!target) return true
    this.steer(m, target, turn, m.speed)
    // Close enough, or circling it too long: on to the next point.
    if (
      Math.hypot(target.x - m.x, target.y - m.y) < m.speed * 4 + 6 ||
      ++m.stepTicks > 110
    ) {
      m.step++
      m.stepTicks = 0
    }
    return m.step >= m.path.length
  }

  private steer(m: Moth, target: Pt, turn: number, speed: number) {
    const want = Math.atan2(target.y - m.y, target.x - m.x)
    let diff = want - m.heading
    while (diff > Math.PI) diff -= Math.PI * 2
    while (diff < -Math.PI) diff += Math.PI * 2
    m.heading += Math.max(-turn, Math.min(turn, diff))
    m.x += Math.cos(m.heading) * speed
    m.y += Math.sin(m.heading) * speed
  }

  private launchDive() {
    const ready = this.moths.filter((m) => m.mode === 'form' && !m.gone)
    if (ready.length === 0) return
    const m = ready[Math.floor(this.rng() * ready.length)]!
    const side = m.x < W / 2 ? -1 : 1
    const speed = levelCurve(this.level, SWARM_CURVES.diveSpeed)
    m.speed = speed
    m.step = 0
    m.stepTicks = 0
    m.heading = -Math.PI / 2
    // A queen without a captive sometimes comes down to shine her glow.
    if (m.kind === 'queen' && !m.holding && !this.twin && this.rng() < 0.45) {
      m.mode = 'beam'
      m.timer = -1
      m.path = [
        { x: m.x + side * 26, y: m.y - 16 },
        { x: this.x, y: H - 120 },
      ]
      return
    }
    m.mode = 'dive'
    m.path = [
      { x: m.x + side * 26, y: m.y - 16 },
      { x: m.x + side * 46, y: m.y + 30 },
      { x: this.x + (this.rng() - 0.5) * 40, y: H * 0.6 },
      { x: this.x, y: SHIP_Y },
      { x: this.x - side * 30, y: H + 30 },
    ]
    this.sound.play('warn')
  }

  private dive(m: Moth) {
    // Sweep toward the lantern's side as they pass.
    // Sweep toward the lantern as they come down.
    for (const i of [2, 3])
      if (m.step <= i) m.path[i]!.x += Math.sign(this.x - m.path[i]!.x) * 0.5
    const done = this.followPath(m, 0.11)
    this.maybeDust(m)
    if (done || m.y > H + 20) {
      // Loop back in from the top and settle into its place.
      m.y = -12
      m.x = this.slotPos(m).x
      m.heading = Math.PI / 2
      m.mode = 'home'
    }
  }

  private tractor(m: Moth) {
    if (m.timer < 0) {
      if (this.followPath(m, 0.13)) {
        m.timer = BEAM_TICKS
        m.heading = Math.PI / 2
        this.sound.play('warn')
      }
      return
    }
    m.timer--
    const reach = this.beamReach(m)
    if (
      this.alive &&
      this.safe === 0 &&
      !this.twin &&
      reach > 0.8 &&
      Math.abs(this.x - m.x) < this.beamHalf(m)
    ) {
      // Caught! The lantern floats up to the queen.
      this.alive = false
      this.lives--
      this.respawn = RESPAWN_TICKS
      this.drifters.push({
        x: this.x,
        y: SHIP_Y,
        tx: m.x,
        ty: m.y - 10,
        dock: false,
      })
      m.holding = true
      m.timer = 0
      this.sound.play('die')
      this.banner = {
        text: 'CAUGHT!',
        sub: 'BEAM THE QUEEN TO GET IT BACK',
        ticks: 110,
      }
    }
    if (m.timer <= 0) {
      m.mode = 'home'
      m.speed = 2
    }
  }

  /** 0..1: how far down the queen's glow has spread. */
  private beamReach(m: Moth): number {
    if (m.mode !== 'beam' || m.timer < 0) return 0
    const t = BEAM_TICKS - m.timer
    return Math.min(1, t / 40, m.timer / 20)
  }

  private beamHalf(m: Moth): number {
    return 6 + 14 * this.beamReach(m)
  }

  private maybeDust(m: Moth, share = 1) {
    if (!this.alive || m.y > SHIP_Y - 50 || m.y < HUD_H) return
    if (this.rng() >= levelCurve(this.level, SWARM_CURVES.dust) * share) return
    // Dust drifts a little toward the lantern.
    const ticks = (SHIP_Y - m.y) / DUST_SPEED
    const vx = Math.max(-0.7, Math.min(0.7, (this.x - m.x) / ticks))
    this.dust.push({ x: m.x, y: m.y + 6, vx })
  }

  private updateShots() {
    for (const b of this.beams) {
      b.y -= BEAM_SPEED
      const hit = this.moths.find(
        (m) =>
          !m.gone &&
          m.mode !== 'wait' &&
          Math.abs(m.x - b.x) < 7 &&
          Math.abs(m.y - b.y) < 7,
      )
      if (hit) {
        b.y = -99
        this.hitMoth(hit)
      }
    }
    this.beams = this.beams.filter((b) => b.y > HUD_H - 4)
    for (const d of this.dust) {
      d.y += DUST_SPEED
      d.x += d.vx
      if (this.alive && this.safe === 0 && this.shipHit(d.x, d.y, 3)) {
        d.y = H + 99
        this.loseShip(d.x)
      }
    }
    this.dust = this.dust.filter((d) => d.y < H)
    // Diving moths that fly into the lantern.
    if (this.alive && this.safe === 0)
      for (const m of this.moths)
        if (
          !m.gone &&
          (m.mode === 'dive' || m.mode === 'home') &&
          this.shipHit(m.x, m.y, 6)
        ) {
          this.hitMoth(m, true)
          this.loseShip(m.x)
          break
        }
  }

  /** Is (x, y) touching the lantern (or either twin)? */
  private shipHit(x: number, y: number, r: number): boolean {
    if (Math.abs(y - SHIP_Y) > 6 + r) return false
    const guns = this.twin ? [this.x - 7, this.x + 7] : [this.x]
    return guns.some((gx) => Math.abs(gx - x) < 5 + r)
  }

  private hitMoth(m: Moth, crash = false) {
    if (!crash && --m.hp > 0) {
      this.fx.burst(m.x, m.y, this.fxRng, {
        count: 4,
        speed: 1,
        colours: [RAMPS.sky[4], RAMPS.purple[3]],
      })
      this.sound.play('blip')
      return
    }
    m.gone = true
    const diving = m.mode !== 'form' && m.mode !== 'home'
    const points = this.glow ? GLOW_POINTS : POINTS[m.kind][diving ? 1 : 0]
    if (!crash) this.addScore(points, m.x, m.y - 8)
    if (this.glow) this.glowHits++
    this.sparkle(m.x, m.y, m.kind)
    this.sound.play('pop')
    if (m.holding) {
      m.holding = false
      // The rescued lantern drifts down to dock, or becomes a spare.
      const dock = this.alive && !this.twin
      this.drifters.push({
        x: m.x,
        y: m.y - 10,
        tx: this.x + 14,
        ty: SHIP_Y,
        dock,
      })
      if (!crash) this.addScore(RESCUE_POINTS, m.x, m.y - 18)
      this.fx.burst(m.x, m.y - 10, this.fxRng, {
        count: 16,
        speed: 2.2,
        colours: [RAMPS.gold[4], RAMPS.gold[3], RAMPS.rust[3]],
      })
      this.banner = { text: 'RESCUED!', ticks: 80 }
      if (!dock) this.lives++
    }
  }

  private loseShip(x: number) {
    this.sparkle(x, SHIP_Y, 'queen')
    this.sound.play('die')
    if (this.twin) {
      // One of the pair is knocked off; the other carries on in the middle.
      this.twin = false
      this.x = x < this.x ? this.x + 7 : this.x - 7
      this.safe = 40
      return
    }
    this.alive = false
    this.lives--
    this.respawn = RESPAWN_TICKS
    this.beams = []
  }

  private updateDrifters() {
    for (const d of this.drifters) {
      if (d.dock) {
        d.tx = this.x + 14
        d.ty = SHIP_Y
      }
      d.x += (d.tx - d.x) * 0.06
      d.y += (d.ty - d.y) * 0.06
      if (Math.hypot(d.tx - d.x, d.ty - d.y) < 2) {
        if (d.dock && this.alive && !this.twin) {
          this.twin = true
          this.x = Math.min(W - 14, this.x + 7)
          this.fx.burst(d.x, d.y, this.fxRng, { count: 12 })
          this.sound.play('extra')
          this.banner = { text: 'TWIN BEAMS!', ticks: 80 }
        } else if (d.dock) {
          // Lost the lantern it was flying to: it waits as a spare instead.
          this.lives++
          this.sound.play('extra')
          this.fx.burst(d.x, d.y, this.fxRng, { count: 8 })
        }
        d.dock = false
        d.tx = -99
      }
    }
    this.drifters = this.drifters.filter((d) => d.tx !== -99)
  }

  private checkStageEnd() {
    const left = this.moths.some((m) => !m.gone)
    if (left) return
    this.clear = CLEAR_TICKS
    if (this.glow) {
      const perfect = this.glowHits === this.glowTotal
      const bonus = perfect ? GLOW_PERFECT : 0
      this.addScore(bonus, W / 2, 140)
      this.banner = {
        text: perfect ? 'PERFECT GLOW!' : 'GLOW STAGE OVER',
        sub: `${this.glowHits} OF ${this.glowTotal} BEAMED`,
        ticks: CLEAR_TICKS,
      }
    } else {
      this.banner = { text: 'STAGE CLEAR!', ticks: CLEAR_TICKS }
    }
    this.sound.play('level')
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x: number, y: number) {
    if (this.demo || points <= 0) return
    this.score += points
    this.floaters.push({ x, y, text: String(points), life: 45 })
    if (this.score >= this.nextExtra) {
      this.nextExtra += NEXT_EXTRA
      this.lives++
      this.sound.play('extra')
    }
  }

  private sparkle(x: number, y: number, kind: Kind) {
    const colors =
      kind === 'queen'
        ? ['#c4b5fd', '#fde047']
        : kind === 'luna'
          ? ['#bbf7d0', '#fef9c3']
          : ['#fde68a', '#fef3c7']
    for (let i = 0; i < 12; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.4 + this.rng() * 1.6
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 0.6,
        life: 22 + Math.floor(this.rng() * 14),
        color: colors[i % 2]!,
      })
    }
    this.fx.burst(x, y, this.fxRng, { count: 6, colours: colors })
  }

  private updateEffects() {
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      p.vy -= 0.01
      p.life--
    }
    this.particles = this.particles.filter((p) => p.life > 0)
    for (const f of this.floaters) {
      f.y -= 0.3
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
  }

  // --- attract-mode pilot -----------------------------------------------------

  /**
   * Dodges dust, divers and the queen's glow; otherwise lines up under the
   * nearest moth and beams it.
   */
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
    if (!this.alive) return frame
    const half = this.twin ? 12 : 6
    // Threats: dust about to land near us, divers low and close, a glow.
    let push = 0
    for (const d of this.dust)
      if (
        d.y > SHIP_Y - 70 &&
        d.y < SHIP_Y + 4 &&
        Math.abs(d.x - this.x) < half + 8
      )
        push += d.x < this.x ? 1 : -1
    for (const m of this.moths) {
      if (m.gone) continue
      if (
        (m.mode === 'dive' || m.mode === 'home') &&
        m.y > SHIP_Y - 60 &&
        Math.abs(m.x - this.x) < half + 14
      )
        push += m.x < this.x ? 1 : -1
      if (m.mode === 'beam' && Math.abs(m.x - this.x) < this.beamHalf(m) + 12)
        push += m.x < this.x ? 1 : -1
    }
    if (push !== 0) {
      if (push > 0 && this.x < W - half - 2) held.right = true
      else if (push < 0 && this.x > half + 2) held.left = true
      else if (push > 0) held.left = true
      else held.right = true
    } else {
      // Aim: a diver first (worth double), then the lowest moth in formation.
      const targets = this.moths.filter(
        (m) => !m.gone && m.mode !== 'wait' && m.y > HUD_H,
      )
      const target =
        targets.find((m) => m.holding) ??
        targets.filter((m) => m.mode === 'dive').sort((a, b) => b.y - a.y)[0] ??
        targets.sort(
          (a, b) =>
            Math.abs(a.x - this.x) - Math.abs(b.x - this.x) || b.y - a.y,
        )[0]
      if (target) {
        const lead = target.mode === 'form' ? 0 : Math.cos(target.heading) * 10
        const dx = target.x + lead - this.x
        if (dx > 2) held.right = true
        if (dx < -2) held.left = true
      }
    }
    // Beam whenever something is roughly overhead.
    const overhead = this.moths.some(
      (m) =>
        !m.gone &&
        m.mode !== 'wait' &&
        Math.abs(m.x - this.x) < 8 &&
        m.y < SHIP_Y - 10,
    )
    if (overhead && this.tick % 6 === 0) {
      held.a = true
      frame.pressed.a = true
    }
    return frame
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    this.renderSky(g)
    // (A beamed-down queen's glow goes out with her.)
    for (const m of this.moths)
      if (m.mode === 'beam' && !m.gone) this.renderGlow(g, m)
    for (const m of this.moths)
      if (!m.gone && m.mode !== 'wait') this.renderMoth(g, m)
    for (const d of this.drifters) {
      glow(g, d.x, d.y - 2, 14, d.dock ? RAMPS.gold[3] : RAMPS.ember[2], 0.4)
      this.renderLantern(g, d.x, d.y, !d.dock)
    }
    for (const b of this.beams) {
      glow(g, b.x, b.y, 9, RAMPS.gold[3], 0.55)
      drawSprite(g, BEAM_SPRITE, b.x, b.y)
    }
    const mote = Math.floor(this.tick / 4) % 2
    for (const d of this.dust) {
      glow(g, d.x, d.y, 6, RAMPS.pink[2], 0.4)
      drawSprite(g, DUST_SPRITES[mote]!, d.x, d.y)
    }
    if (this.alive && (this.safe === 0 || Math.floor(this.safe / 4) % 2)) {
      if (this.twin) {
        this.renderShip(g, this.x - 7)
        this.renderShip(g, this.x + 7)
      } else this.renderShip(g, this.x)
    }
    // The game's own bursts, drawn as additive embers.
    g.save()
    g.globalCompositeOperation = 'lighter'
    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, Math.min(1, p.life / 30))
      g.fillStyle = p.color
      g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 2, 2)
    }
    g.restore()
    this.fx.render(g)
    for (const f of this.floaters)
      drawText(g, f.text, f.x, f.y, {
        align: 'center',
        color: RAMPS.gold[4],
        outline: INK,
      })
    vignette(g, W, H, 0.3)
    this.renderHud(g)
  }

  private renderSky(g: CanvasRenderingContext2D) {
    // Banded sky and the warm haze over the festival far below; painted once per sky.
    const aurora = this.glow
    cachedLayer(
      g,
      `lantern-swarm-sky-${aurora ? 'aurora' : 'night'}`,
      W,
      H,
      (k) => {
        bandedGradient(k, 0, 0, W, H, aurora ? AURORA_BANDS : NIGHT_BANDS, 4)
        glow(k, W / 2, H + 30, 150, RAMPS.rust[2], 0.22)
        if (aurora) {
          glow(k, W * 0.3, H * 0.3, 90, RAMPS.teal[2], 0.12)
          glow(k, W * 0.75, H * 0.45, 80, RAMPS.leaf[2], 0.1)
          // Aurora curtains: hanging rays along a wavy hem.
          for (let x = 0; x < W; x += 2) {
            const hem = 70 + Math.sin(x / 23) * 18 + Math.sin(x / 7) * 4
            const tall = 30 + Math.sin(x / 13 + 1) * 14
            const ramp = Math.sin(x / 31) > 0 ? RAMPS.teal : RAMPS.leaf
            k.fillStyle = rgba(ramp[3], 0.07 + 0.05 * Math.sin(x / 3) ** 2)
            k.fillRect(x, Math.round(hem - tall), 2, Math.round(tall))
            k.fillStyle = rgba(ramp[4], 0.16)
            k.fillRect(x, Math.round(hem) - 2, 2, 2)
          }
        }
      },
    )
    // Nebula wisps, then two star layers, each scrolling slower than the next.
    scrollingLayer(
      g,
      'lantern-swarm-nebula',
      W,
      H,
      this.tick * NEBULA_SPEED,
      paintNebula,
    )
    g.fillStyle = RAMPS.night[4]
    for (const s of FAR_STARS) {
      const y = Math.floor((s.y + this.tick * FAR_SPEED) % H)
      g.fillRect(s.x, y, 1, 1)
    }
    for (const s of MID_STARS) {
      const y = Math.floor((s.y + this.tick * MID_SPEED) % H)
      const twinkle = Math.sin(this.tick / 24 + s.phase)
      g.fillStyle =
        twinkle > 0.5
          ? RAMPS.purple[4]
          : twinkle > -0.3
            ? RAMPS.purple[3]
            : RAMPS.purple[2]
      g.fillRect(s.x, y, 1, 1)
      if (s.size === 2 && twinkle > 0.7) {
        g.fillStyle = RAMPS.purple[3]
        g.fillRect(s.x - 1, y, 3, 1)
        g.fillRect(s.x, y - 1, 1, 3)
      }
    }
    // The nearest stars streak past.
    for (const s of this.stars) {
      const x = Math.round(s.x)
      const y = Math.round(s.y)
      if (s.s > 0.7) {
        g.fillStyle = RAMPS.sky[2]
        g.fillRect(x, y - 2, 1, 2)
        g.fillStyle = RAMPS.sky[4]
        g.fillRect(x, y, 1, 1)
      } else {
        g.fillStyle = s.s > 0.45 ? RAMPS.sky[3] : RAMPS.purple[3]
        g.fillRect(x, y, 1, 1)
      }
    }
  }

  private renderGlow(g: CanvasRenderingContext2D, m: Moth) {
    const reach = this.beamReach(m)
    if (reach <= 0) return
    const top = Math.round(m.y + 8)
    const bottom = Math.round(top + (SHIP_Y + 8 - top) * reach)
    const span = Math.max(1, bottom - top)
    const half = this.beamHalf(m)
    // Banded light (colour math) pulsing down the cone, its edges brighter than its heart.
    g.save()
    g.globalCompositeOperation = 'lighter'
    for (let y = top; y < bottom; y += 2) {
      const t = (y - top) / span
      const w = Math.round(4 + (half - 4) * t)
      const band = Math.floor((y - top - this.tick * 1.5) / 6)
      const colour = TRACTOR[((band % 3) + 3) % 3]!
      g.fillStyle = rgba(colour, 0.26)
      g.fillRect(Math.round(m.x) - w, y, w * 2, 2)
      g.fillStyle = rgba(RAMPS.purple[4], 0.45)
      g.fillRect(Math.round(m.x) - w, y, 1, 2)
      g.fillRect(Math.round(m.x) + w - 1, y, 1, 2)
    }
    // Motes riding up the beam.
    g.fillStyle = rgba(RAMPS.teal[4], 0.8)
    for (let i = 0; i < 8; i++) {
      const py = bottom - ((this.tick * 1.2 + i * 29) % span)
      const t = (py - top) / span
      const px =
        m.x + Math.sin(this.tick / 9 + i * 1.7) * (4 + (half - 4) * t) * 0.8
      g.fillRect(Math.round(px), Math.round(py), 1, 1)
    }
    g.restore()
    glow(g, m.x, top, 12, RAMPS.purple[3], 0.5)
    glow(g, m.x, bottom, half + 6, RAMPS.teal[3], 0.3 * reach)
  }

  private renderMoth(g: CanvasRenderingContext2D, m: Moth) {
    const flap = Math.floor((this.tick + m.col * 7) / 8) % 2
    const set =
      m.kind === 'queen'
        ? m.hp > 1
          ? QUEENS
          : QUEENS_HURT
        : m.kind === 'luna'
          ? LUNAS
          : MOTHS
    // Face the heading in quarter turns: flips of the up and side frames, never a rotation.
    const facing = m.mode === 'form' ? Math.PI / 2 : m.heading
    const dx = Math.cos(facing)
    const dy = Math.sin(facing)
    if (m.kind === 'queen') glow(g, m.x, m.y, 14, RAMPS.purple[3], 0.25)
    if (Math.abs(dy) >= Math.abs(dx))
      drawSprite(g, set.up[flap]!, m.x, m.y, { flipY: dy > 0 })
    else drawSprite(g, set.side[flap]!, m.x, m.y, { flipX: dx > 0 })
    if (m.kind === 'queen' && m.holding && m.mode !== 'beam') {
      glow(g, m.x, m.y - 15, 10, RAMPS.ember[2], 0.35)
      this.renderLantern(g, m.x, m.y - 14, true)
    }
  }

  private renderShip(g: CanvasRenderingContext2D, x: number) {
    const flicker = Math.sin(this.tick / 5 + x) * 2
    glow(g, x, SHIP_Y - 1, 22 + flicker, RAMPS.gold[3], 0.42)
    glow(g, x, SHIP_Y - 1, 9, RAMPS.gold[4], 0.35)
    this.renderLantern(g, x, SHIP_Y, false)
  }

  private renderLantern(
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    captive: boolean,
  ) {
    const sprite = captive
      ? LANTERN_CAPTIVE
      : LANTERN[Math.floor(this.tick / 6 + x) % 2]!
    drawSprite(g, sprite, Math.round(x), Math.round(y) - 2)
  }

  private renderHud(g: CanvasRenderingContext2D) {
    hudPanel(g, 2, 2, 82, 18)
    drawText(g, String(this.score).padStart(6, '0'), 7, 4, {
      scale: 2,
      color: RAMPS.gold[3],
      shadow: INK,
    })
    hudPanel(g, W - 66, 2, 64, 18)
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W - 5, 3, {
      align: 'right',
      color: RAMPS.pink[3],
      outline: INK,
    })
    drawText(g, `STAGE ${this.level}`, W - 5, 11, {
      align: 'right',
      color: this.glow ? RAMPS.purple[3] : RAMPS.teal[3],
      outline: INK,
    })
    const spares = Math.min(this.lives - (this.alive ? 1 : 0), 6)
    if (spares > 0) {
      hudPanel(g, 2, H - 14, spares * 9 + 4, 12)
      for (let i = 0; i < spares; i++)
        drawSprite(g, LIFE_SPRITE, 8 + i * 9, H - 8)
    }
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, 150, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.purple[1],
      })
      if (this.banner.sub)
        drawText(g, this.banner.sub, W / 2, 170, {
          align: 'center',
          color: RAMPS.gold[4],
          outline: INK,
        })
    }
  }
}

const lanternSwarm: ArcadeGameModule = {
  create: (options) => new LanternSwarm(options),
}

export const create = lanternSwarm.create
export default lanternSwarm
