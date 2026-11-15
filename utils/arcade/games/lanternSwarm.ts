// /utils/arcade/games/lanternSwarm.ts
//
// Lantern Swarm -- the Kind Robots Arcade's Galaga riff (conductor
// kr-arcade/t-009 game factory, batch 4; depth pass kr-arcade/t-093).
// Night moths swirl in along looping flight paths and settle into a swaying
// formation above your paper lantern. Then they peel off and dive at you,
// dropping dust. Beam each one with light and it flutters home happy; one that
// dives past you loops back to its place.
//
// The Long Night Festival (lanternSwarm/zones.ts): the night is a run of zones,
// one per Watch, each six stages long -- three formation stages, a Glow Stage,
// a remix and a Guardian. Every stage scripts its own entrance (groups, paths,
// fill order and entry fire), its formation, its dive shapes (lanternSwarm/
// dives.ts) and its tuning. Slice 1 brings the Dusk Watch, the Rooftop Festival:
//
// - Queens dive with escort lunas; beam both escorts and then the queen for an
//   escort bonus that climbs 800, 1,600, 3,200 through the Watch.
// - The last three moths of a stage dive without stopping, faster each pass.
// - A queen's tractor glow can carry your lantern off. The captive then flies
//   with her and turns on you, dropping embers; beam the queen to win it back
//   for twin beams, but beam the captive itself and it is lost for good.
// - The Glow Stage is Paper Cranes, a figure-of-eight weave.
// - The Guardian is the Grand Lantern Moth (lanternSwarm/guardian.ts).
// - After each Watch a results card shows shots, hits and the hit ratio; game
//   over shows the whole night's ratio.
//
// Left/right move, A beams.

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
import { planDive } from '../lanternSwarm/dives'
import {
  GUARDIAN,
  gripShare,
  hitGuardian,
  newGuardian,
  renderGuardian,
  ringPos,
  updateGuardian,
  type Guardian,
  type GuardianHit,
} from '../lanternSwarm/guardian'
import {
  escortBonus,
  newTally,
  ratioText,
  resultRows,
  type Tally,
} from '../lanternSwarm/results'
import {
  GLOW_CHOREOGRAPHIES,
  H,
  PATHS,
  W,
  mirrorPath,
  slotsFor,
  stageAt,
  tuneFor,
  type FormationStage,
  type GlowName,
  type Kind,
  type Pt,
  type Slot,
  type StagePlace,
  type Tuning,
  type Zone,
} from '../lanternSwarm/zones'

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
const GLOW_POINTS = 100
/** The perfect Glow bonus climbs each lap of the night. */
const GLOW_PERFECT = 10_000
const GLOW_PERFECT_STEP = 5_000
const GLOW_PERFECT_MAX = 20_000
const RESCUE_POINTS = 1000
/** The last few moths of a stage dive without stopping, faster each pass. */
const FRENZY_COUNT = 3
const FRENZY_STEP = 0.14
const FRENZY_TOP = 3.6
const ESCORT_OFFSET = 13
const ESCORT_REACH = SLOT_X * 3.5
const RESULTS_TICKS = 420
const RESULTS_SKIP = 90
const TITLE_TICKS = 150
/** Glow and Guardian stages have no formation of their own; their dust and dives use this. */
const OPEN_SKY: Tuning = {
  diveGap: 150,
  divers: 0,
  diveSpeed: 2.1,
  dust: 0.016,
  capture: 0,
}

type Mode =
  'wait' | 'enter' | 'home' | 'form' | 'dive' | 'beam' | 'escort' | 'glow'
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
  /** Dust dropped flying in, as a share of the stage's dive dust. */
  fire: number
  /** Dive waypoints that lean toward the lantern. */
  track: number[]
  /** This dive comes back up from below on its own. */
  returns: boolean
  /** An escort's queen, and the side it flies on. */
  leader: Moth | null
  offset: number
  /** A diving queen's escorts, and how many of them were beamed. */
  escorts: number
  escortsBeamed: number
  /** Last-moth frenzy passes flown. */
  passes: number
}
type Shot = { x: number; y: number; vx: number }
type Dust = Shot & { ember: boolean }
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
type Banner = { text: string; sub?: string; sub2?: string; ticks: number }
type Results = { ticks: number; tally: Tally; zone: Zone }

const POINTS: Record<Kind, [number, number]> = {
  moth: [50, 100],
  luna: [80, 160],
  escort: [80, 160],
  queen: [150, 400],
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

/** The festival's paper lanterns rising through the sky, far (small, slow) and near. */
const SKY_LANTERNS = (() => {
  const rand = backdropRng(97)
  return Array.from({ length: 18 }, (_, i) => {
    const near = i >= 11
    return {
      x: 8 + rand() * (W - 16),
      y: rand() * (H + 30),
      speed: near ? 0.32 + rand() * 0.12 : 0.1 + rand() * 0.06,
      phase: rand() * Math.PI * 2,
      near,
      ramp: rand() < 0.5 ? RAMPS.rust : RAMPS.ember,
    }
  })
})()

/** The rooftops of the festival town along the bottom of the sky. */
const ROOFS = (() => {
  const rand = backdropRng(101)
  const roofs: Array<{
    x: number
    w: number
    h: number
    peak: number
    windows: Pt[]
  }> = []
  let x = -6
  while (x < W + 6) {
    const w = 18 + Math.round(rand() * 18)
    const h = 12 + Math.round(rand() * 22)
    const peak = rand() < 0.55 ? 6 + Math.round(rand() * 6) : 0
    const windows: Pt[] = []
    for (let i = 0; i < 3; i++)
      if (rand() < 0.6)
        windows.push({
          x: x + 3 + Math.round(rand() * (w - 8)),
          y: H - h + 3 + Math.round(rand() * (h - 8)),
        })
    roofs.push({ x, w, h, peak, windows })
    x += w + Math.round(rand() * 3)
  }
  return roofs
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
/** Escort lunas wear the festival's rose and gold, the queen's own colours. */
const ESCORTS = mothSet(LUNA_ROWS, {
  a: RAMPS.gold[3],
  k: INK,
  H: RAMPS.pink[4],
  L: RAMPS.pink[3],
  M: RAMPS.pink[2],
  S: RAMPS.pink[1],
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
const cranePalette = (paper: Ramp) => ({
  W: paper[4],
  w: paper[3],
  P: paper[2],
  p: paper[3],
  t: paper[1],
})
const CRANES = [
  mothSet(CRANE_ROWS, cranePalette(RAMPS.pink)),
  mothSet(CRANE_ROWS, cranePalette(RAMPS.sky)),
] as const

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
/** A turncoat captive's embers: the same mote, burning red. */
const EMBER_SPRITES = [
  pixelSprite(['.p.', 'pPp', '.p.'], { p: RAMPS.ember[2], P: RAMPS.ember[4] }),
  pixelSprite(['.P.', 'PpP', '.P.'], { p: RAMPS.ember[3], P: RAMPS.ember[1] }),
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

/** The festival town: dark roofs, a few lit windows and strings of lights between the eaves. */
function paintRooftops(k: CanvasRenderingContext2D) {
  const wall = mix(RAMPS.night[1], RAMPS.purple[0], 0.45)
  const rim = mix(RAMPS.night[3], RAMPS.rust[1], 0.35)
  for (const r of ROOFS) {
    k.fillStyle = wall
    k.fillRect(r.x, H - r.h, r.w, r.h)
    k.fillStyle = rim
    k.fillRect(r.x, H - r.h, r.w, 1)
    for (let i = 0; i < r.peak; i++) {
      const inset = Math.round((i * r.w) / (r.peak * 2.2))
      k.fillStyle = wall
      k.fillRect(r.x + inset, H - r.h - i - 1, r.w - inset * 2, 1)
      k.fillStyle = rim
      k.fillRect(r.x + inset, H - r.h - i - 1, 1, 1)
    }
    for (const w of r.windows) {
      k.fillStyle = RAMPS.gold[2]
      k.fillRect(w.x, w.y, 2, 3)
      k.fillStyle = rgba(RAMPS.gold[3], 0.25)
      k.fillRect(w.x - 1, w.y - 1, 4, 5)
    }
  }
  // Festival lights strung from roof to roof, sagging in between.
  for (let i = 0; i + 1 < ROOFS.length; i++) {
    const a = ROOFS[i]!
    const b = ROOFS[i + 1]!
    const ax = a.x + a.w - 2
    const ay = H - a.h - a.peak + 2
    const bx = b.x + 2
    const by = H - b.h - b.peak + 2
    const span = Math.max(1, bx - ax)
    for (let x = ax; x <= bx + 14; x += 3) {
      const t = Math.min(1, (x - ax) / (span + 14))
      const y = Math.round(ay + (by - ay) * t + Math.sin(t * Math.PI) * 6)
      k.fillStyle = [RAMPS.pink[3], RAMPS.gold[3], RAMPS.teal[3]][
        Math.floor(x / 3) % 3
      ]!
      k.fillRect(x, y, 1, 1)
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
  private stageIndex = 0
  private place: StagePlace = stageAt(0)
  private tune: Tuning = OPEN_SKY
  private x = W / 2
  private alive = true
  private twin = false
  private respawn = 0
  private safe = 0
  private beams: Shot[] = []
  private dust: Dust[] = []
  private moths: Moth[] = []
  private drifters: Drifter[] = []
  private guardian: Guardian | null = null
  private diveTimer = 0
  private clear = 0
  private glow = false
  private glowHits = 0
  private glowTotal = 0
  private frenzy = false
  /** Escort bonuses earned this Watch: each pays more than the last. */
  private escortChain = 0
  private tally: Tally = newTally()
  private night = { shots: 0, hits: 0 }
  private results: Results | null = null
  private nextExtra = FIRST_EXTRA
  private stars: Array<{ x: number; y: number; s: number }> = []
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: Banner | null = null
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
    this.startStage(0)
  }

  // --- stages -------------------------------------------------------------------

  private startStage(index: number) {
    this.stageIndex = index
    this.place = stageAt(index)
    const { stage, zone, stageIndex, lap } = this.place
    this.level = index + 1
    this.glow = stage.kind === 'glow'
    this.stageTick = 0
    this.moths = []
    this.dust = []
    this.beams = []
    this.guardian = null
    this.frenzy = false
    this.diveTimer = 120
    if (stageIndex === 0) {
      this.tally = newTally()
      this.escortChain = 0
    }
    this.tune =
      stage.kind === 'formation'
        ? tuneFor(stage.tune, lap)
        : tuneFor(OPEN_SKY, lap)
    if (stage.kind === 'formation') this.buildEntrance(stage)
    else if (stage.kind === 'glow') this.buildGlow(stage.choreography)
    else this.guardian = newGuardian(lap)
    this.glowHits = 0
    this.glowTotal = this.moths.length
    if (stageIndex === 0)
      this.banner = {
        text: `${zone.watch} WATCH`,
        sub: lap > 1 ? `${zone.name}  NIGHT ${lap}` : zone.name,
        ticks: TITLE_TICKS,
      }
    else if (stage.kind === 'glow')
      this.banner = { text: 'GLOW STAGE', sub: stage.name, ticks: 120 }
    else if (stage.kind === 'guardian')
      this.banner = { text: 'GUARDIAN!', sub: stage.name, ticks: 140 }
    else
      this.banner = { text: `STAGE ${this.level}`, sub: stage.name, ticks: 100 }
  }

  private formationStage(): FormationStage | null {
    const stage = this.place.stage
    return stage.kind === 'formation' ? stage : null
  }

  private newMoth(
    kind: Kind,
    slot: Slot,
    path: readonly Pt[],
    spawnAt: number,
    fire: number,
  ): Moth {
    return {
      kind,
      hp: kind === 'queen' ? 2 : 1,
      col: slot.col,
      row: slot.row,
      x: path[0]!.x,
      y: path[0]!.y,
      heading: Math.PI / 2,
      speed: ENTER_SPEED,
      mode: 'wait',
      path: path.map((p) => ({ ...p })),
      step: 1,
      stepTicks: 0,
      spawnAt,
      timer: 0,
      holding: false,
      gone: false,
      fire,
      track: [],
      returns: false,
      leader: null,
      offset: 0,
      escorts: 0,
      escortsBeamed: 0,
      passes: 0,
    }
  }

  /** The stage's scripted entrance: each group flies its path, filling slots in the stage's order. */
  private buildEntrance(stage: FormationStage) {
    const kinds: Kind[] = ['queen', 'escort', 'luna', 'moth']
    const slots = Object.fromEntries(
      kinds.map((k) => [k, slotsFor(stage.layout, k, stage.fill)]),
    ) as Record<Kind, Slot[]>
    const used: Record<Kind, number> = { queen: 0, escort: 0, luna: 0, moth: 0 }
    for (const group of stage.entrance) {
      group.kinds.forEach((kind, i) => {
        const list = slots[kind]
        const slot = list[used[kind]++ % list.length]!
        const twin = group.pair && i % 2 === 1
        const path = PATHS[twin ? mirrorPath(group.path) : group.path]
        const order = group.pair ? Math.floor(i / 2) : i
        const at = 30 + Math.round(group.at * GROUP_GAP) + order * SPAWN_GAP
        this.moths.push(this.newMoth(kind, slot, path, at, group.fire ?? 0))
      })
    }
  }

  /** A Glow Stage: forty dancers fly the choreography through and away, no dives and no dust. */
  private buildGlow(name: GlowName) {
    GLOW_CHOREOGRAPHIES[name].forEach((group, gi) => {
      for (let i = 0; i < group.count; i++) {
        const at = 30 + Math.round(group.at * GROUP_GAP) + i * SPAWN_GAP
        this.moths.push(
          this.newMoth('moth', { row: gi, col: i }, group.path, at, 0),
        )
      }
    })
  }

  private nextStage() {
    const { stageIndex, zone } = this.place
    if (stageIndex === zone.stages.length - 1) {
      this.results = { ticks: 0, tally: this.tally, zone }
      this.banner = null
      this.sound.play('level')
      return
    }
    this.startStage(this.stageIndex + 1)
  }

  private updateResults(input: InputFrame) {
    const r = this.results!
    r.ticks++
    if (
      (r.ticks >= RESULTS_SKIP && input.pressed.a) ||
      r.ticks >= RESULTS_TICKS
    ) {
      this.results = null
      this.startStage(this.stageIndex + 1)
    }
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
    const controls = this.demo ? this.demoInput() : input
    if (this.results) {
      this.updateResults(controls)
      return
    }
    if (this.clear > 0) {
      if (--this.clear === 0) this.nextStage()
      return
    }
    this.stageTick++
    this.updateShip(controls)
    if (this.guardian) this.updateGuardianStage(this.guardian)
    else this.updateMoths()
    this.updateShots()
    this.updateDrifters()
    this.checkStageEnd()
  }

  private updateShip(input: InputFrame) {
    if (!this.alive) {
      if (this.respawn > 0 && --this.respawn === 0) {
        if (this.lives <= 0) {
          this.over = true
          this.banner = {
            text: 'LIGHTS OUT',
            sub: 'GAME OVER',
            sub2: `NIGHT HIT RATIO ${ratioText(this.night)}`,
            ticks: 9999,
          }
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
        this.tally.shots += guns.length
        this.night.shots += guns.length
        this.sound.play('shoot')
      }
    }
  }

  private countHit() {
    this.tally.hits++
    this.night.hits++
  }

  private updateMoths() {
    const stage = this.formationStage()
    const live = this.moths.filter((m) => !m.gone)
    const diving = live.filter(
      (m) => m.mode === 'dive' || m.mode === 'beam',
    ).length
    const entering = live.some((m) => m.mode === 'wait' || m.mode === 'enter')
    if (
      stage &&
      !this.frenzy &&
      !entering &&
      live.length > 0 &&
      live.length <= FRENZY_COUNT
    ) {
      this.frenzy = true
      this.floaters.push({ x: W / 2, y: 136, text: 'LAST FLUTTER!', life: 70 })
    }
    for (const m of this.moths) {
      if (m.gone) continue
      switch (m.mode) {
        case 'wait':
          if (this.stageTick >= m.spawnAt) m.mode = this.glow ? 'glow' : 'enter'
          break
        case 'enter':
        case 'glow':
          if (m.mode === 'enter' && m.fire > 0) this.maybeDust(m, m.fire)
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
          if (this.frenzy) this.launchDive(m)
          break
        }
        case 'dive':
          this.dive(m)
          break
        case 'beam':
          this.tractor(m)
          break
        case 'escort':
          this.escortFly(m)
          break
      }
    }
    if (!stage) return
    // Launch a new dive now and then (on some stages, even mid-entrance).
    const early = !!stage.earlyDives && this.stageTick > 30 + 2 * GROUP_GAP
    if (
      !this.frenzy &&
      (!entering || early) &&
      this.alive &&
      --this.diveTimer <= 0
    ) {
      this.diveTimer = Math.round(this.tune.diveGap * (0.6 + this.rng() * 0.8))
      if (diving < this.tune.divers) this.launchDive()
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

  /** Sends `chosen` (or a moth picked at random from the formation) on a dive. */
  private launchDive(chosen?: Moth) {
    const stage = this.formationStage()
    if (!stage) return
    let m = chosen
    if (!m) {
      const ready = this.moths.filter((x) => x.mode === 'form' && !x.gone)
      if (ready.length === 0) return
      m = ready[Math.floor(this.rng() * ready.length)]!
    }
    const side = m.x < W / 2 ? -1 : 1
    if (this.frenzy) {
      m.passes++
      m.speed = Math.min(
        FRENZY_TOP,
        this.tune.diveSpeed * (1 + FRENZY_STEP * m.passes),
      )
    } else m.speed = this.tune.diveSpeed
    m.step = 0
    m.stepTicks = 0
    m.heading = -Math.PI / 2
    m.escorts = 0
    m.escortsBeamed = 0
    // A queen without a captive sometimes comes down to shine her glow.
    if (
      m.kind === 'queen' &&
      !m.holding &&
      !this.twin &&
      !this.frenzy &&
      this.rng() < this.tune.capture
    ) {
      m.mode = 'beam'
      m.timer = -1
      m.track = []
      m.path = [
        { x: m.x + side * 26, y: m.y - 16 },
        { x: this.x, y: H - 120 },
      ]
      return
    }
    const plan = planDive(stage.dives, {
      x: m.x,
      y: m.y,
      side,
      lanternX: this.x,
      shipY: SHIP_Y,
      rng: this.rng,
    })
    m.mode = 'dive'
    m.path = plan.path
    m.track = plan.track
    m.returns = plan.returns
    if (m.kind === 'queen' && !this.frenzy) this.callEscorts(m)
    this.sound.play('warn')
  }

  /** Up to two escort lunas near a diving queen peel off with her, one on each side. */
  private callEscorts(q: Moth) {
    const dist = (e: Moth) => Math.hypot(e.x - q.x, e.y - q.y)
    const near = this.moths
      .filter(
        (e) =>
          !e.gone &&
          e.kind === 'escort' &&
          e.mode === 'form' &&
          dist(e) < ESCORT_REACH,
      )
      .sort((a, b) => dist(a) - dist(b))
      .slice(0, 2)
      .sort((a, b) => a.x - b.x)
    near.forEach((e, i) => {
      e.mode = 'escort'
      e.leader = q
      e.speed = q.speed
      e.heading = q.heading
      e.offset =
        near.length === 2
          ? (i === 0 ? -1 : 1) * ESCORT_OFFSET
          : (Math.sign(e.x - q.x) || 1) * ESCORT_OFFSET
    })
    q.escorts = near.length
  }

  private escortFly(m: Moth) {
    const lead = m.leader
    if (lead && !lead.gone && lead.mode === 'dive') {
      m.x += (lead.x + m.offset - m.x) * 0.3
      m.y += (lead.y + 3 - m.y) * 0.3
      m.heading = lead.heading
      this.maybeDust(m)
      return
    }
    m.leader = null
    if (lead && !lead.gone) {
      // Her dive is over: back to the swarm too (round from the top when off the bottom).
      if (m.y > H) {
        m.y = -12
        m.x = this.slotPos(m).x
        m.heading = Math.PI / 2
      }
      m.mode = 'home'
      return
    }
    // Its queen was beamed: it flies the rest of her dive alone.
    m.mode = 'dive'
    m.speed = Math.max(m.speed, lead?.speed ?? this.tune.diveSpeed)
    m.path = lead
      ? lead.path.slice(lead.step).map((p) => ({ x: p.x + m.offset, y: p.y }))
      : []
    if (m.path.length === 0) m.path = [{ x: m.x, y: H + 30 }]
    m.step = 0
    m.stepTicks = 0
    m.track = []
    m.returns = lead?.returns ?? false
  }

  private dive(m: Moth) {
    // The tracking waypoints lean toward the lantern as the moth comes down.
    for (const i of m.track) {
      const p = m.path[i]
      if (p && m.step <= i) p.x += Math.sign(this.x - p.x) * 0.5
    }
    const done = this.followPath(m, 0.11)
    this.maybeDust(m)
    if (m.holding) {
      const c = this.captivePos(m)
      this.dropDust(c.x, c.y, this.tune.dust * 0.8, true)
    }
    if (done || (!m.returns && m.y > H + 20)) {
      if (!m.returns) {
        // Loop back in from the top and settle into its place.
        m.y = -12
        m.x = this.slotPos(m).x
        m.heading = Math.PI / 2
      }
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

  /**
   * Where a queen's captive lantern flies: over her in the swarm, and trailing off her shoulder in
   * a dive, where a careless beam can reach it.
   */
  private captivePos(m: Moth): Pt {
    if (m.mode === 'form' || m.mode === 'home' || m.mode === 'beam')
      return { x: m.x, y: m.y - 14 }
    const h = m.heading
    return {
      x: m.x - Math.cos(h) * 10 - Math.sin(h) * 9,
      y: m.y - Math.sin(h) * 10 + Math.cos(h) * 9,
    }
  }

  private maybeDust(m: Moth, share = 1) {
    this.dropDust(m.x, m.y, this.tune.dust * share, false)
  }

  private dropDust(x: number, y: number, chance: number, ember: boolean) {
    if (!this.alive || y > SHIP_Y - 50 || y < HUD_H) return
    if (this.rng() >= chance) return
    // Dust drifts a little toward the lantern.
    const ticks = (SHIP_Y - y) / DUST_SPEED
    const vx = Math.max(-0.7, Math.min(0.7, (this.x - x) / ticks))
    this.dust.push({ x, y: y + 6, vx, ember })
  }

  private updateGuardianStage(gd: Guardian) {
    updateGuardian(gd, {
      rng: this.rng,
      lanternX: this.x,
      shipY: SHIP_Y,
      open: this.alive && this.safe === 0,
      diveSpeed: this.tune.diveSpeed,
      dust: (x, y, vx) => {
        if (this.alive) this.dust.push({ x, y, vx, ember: false })
      },
      caught: (x) => this.guardianCaught(gd, x),
      crash: (x) => this.loseShip(x),
      sound: (name) => this.sound.play(name),
    })
  }

  /** The Guardian's glow took hold: a twin is knocked loose, a lone lantern is carried off. */
  private guardianCaught(gd: Guardian, x: number): boolean {
    if (this.twin) {
      this.loseShip(x)
      return false
    }
    this.alive = false
    this.lives--
    this.respawn = RESPAWN_TICKS
    this.beams = []
    this.drifters.push({ x, y: SHIP_Y, tx: gd.x, ty: gd.y + 18, dock: false })
    this.sound.play('die')
    this.banner = {
      text: 'CAUGHT!',
      sub: 'CALM THE GUARDIAN TO WIN IT BACK',
      ticks: 110,
    }
    return true
  }

  private guardianHit(gd: Guardian, hit: GuardianHit) {
    this.countHit()
    if (hit.kind === 'shrug') {
      this.fx.burst(hit.x, hit.y + 10, this.fxRng, {
        count: 3,
        speed: 0.8,
        colours: [RAMPS.steel[3], RAMPS.gold[3]],
      })
      this.sound.play('blip')
      return
    }
    if (hit.points > 0) this.addScore(hit.points, hit.x, hit.y - 8)
    if (hit.kind === 'ring') this.sparkle(hit.x, hit.y, 'escort')
    else if (hit.points > 0) {
      this.fx.burst(hit.x, hit.y, this.fxRng, {
        count: 14,
        speed: 2,
        colours: [RAMPS.gold[4], RAMPS.rust[3], RAMPS.pink[3]],
      })
      this.sound.play('pop')
    } else {
      this.fx.burst(hit.x, hit.y, this.fxRng, { count: 4, speed: 1 })
      this.sound.play('blip')
    }
    if (hit.calmed) {
      this.tally.guardians++
      this.banner = {
        text: 'AT PEACE!',
        sub: 'THE GRAND LANTERN MOTH FLOATS HOME',
        ticks: 170,
      }
      this.fx.burst(gd.x, gd.y, this.fxRng, {
        count: 30,
        speed: 2.6,
        colours: [RAMPS.gold[4], RAMPS.gold[3], RAMPS.pink[3]],
      })
      this.sound.play('extra')
      if (gd.holding) {
        gd.holding = false
        this.rescue(gd.x, gd.y + 18, true)
      }
    } else if (hit.phaseOver)
      this.banner =
        gd.phase === 2
          ? { text: 'WINGS DOWN!', sub: 'SLIP THROUGH ITS GLOW', ticks: 90 }
          : { text: 'IT DIVES!', sub: 'MIND ITS RING OF ESCORTS', ticks: 90 }
  }

  private updateShots() {
    for (const b of this.beams) {
      b.y -= BEAM_SPEED
      if (this.guardian) {
        const hit = hitGuardian(this.guardian, b.x, b.y)
        if (hit) {
          b.y = -99
          this.guardianHit(this.guardian, hit)
        }
        continue
      }
      const hit = this.moths.find(
        (m) =>
          !m.gone &&
          m.mode !== 'wait' &&
          Math.abs(m.x - b.x) < 7 &&
          Math.abs(m.y - b.y) < 7,
      )
      if (hit) {
        b.y = -99
        this.countHit()
        this.hitMoth(hit)
        continue
      }
      const captive = this.moths.find((m) => {
        if (m.gone || !m.holding) return false
        const c = this.captivePos(m)
        return Math.abs(c.x - b.x) < 5 && Math.abs(c.y - b.y) < 6
      })
      if (captive) {
        b.y = -99
        this.countHit()
        this.loseCaptive(captive)
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
          (m.mode === 'dive' || m.mode === 'home' || m.mode === 'escort') &&
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
    const lead = m.leader
    if (!crash && m.mode === 'escort' && lead && !lead.gone)
      lead.escortsBeamed++
    if (
      !crash &&
      m.kind === 'queen' &&
      m.mode === 'dive' &&
      m.escorts === 2 &&
      m.escortsBeamed >= 2
    )
      this.payEscortBonus(m)
    this.sparkle(m.x, m.y, m.kind)
    this.sound.play('pop')
    if (m.holding) {
      m.holding = false
      this.rescue(m.x, m.y - 10, !crash)
    }
  }

  /** Both escorts first, then their queen: the bonus climbs through the Watch. */
  private payEscortBonus(q: Moth) {
    const bonus = escortBonus(this.escortChain++)
    this.tally.escortBonuses++
    this.addScore(bonus, q.x, q.y - 18)
    this.floaters.push({ x: q.x, y: q.y - 28, text: 'ESCORT BONUS', life: 60 })
    this.sound.play('extra')
  }

  /** A freed lantern drifts down to dock as a twin, or waits as a spare. */
  private rescue(x: number, y: number, paid: boolean) {
    const dock = this.alive && !this.twin
    this.drifters.push({ x, y, tx: this.x + 14, ty: SHIP_Y, dock })
    if (paid) this.addScore(RESCUE_POINTS, x, y - 8)
    this.fx.burst(x, y, this.fxRng, {
      count: 16,
      speed: 2.2,
      colours: [RAMPS.gold[4], RAMPS.gold[3], RAMPS.rust[3]],
    })
    this.banner = { text: 'RESCUED!', ticks: 80 }
    if (!dock) this.lives++
  }

  /** Beaming the turncoat captive itself loses it for good. */
  private loseCaptive(m: Moth) {
    m.holding = false
    const c = this.captivePos(m)
    this.fx.burst(c.x, c.y, this.fxRng, {
      count: 12,
      speed: 1.6,
      colours: [RAMPS.ember[2], RAMPS.ember[3], RAMPS.steel[3]],
    })
    this.sound.play('boom')
    this.banner = {
      text: 'LANTERN LOST',
      sub: 'BEAM THE QUEEN, NOT HER CAPTIVE',
      ticks: 100,
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
    if (this.guardian) {
      if (!this.guardian.done) return
      this.clear = CLEAR_TICKS
      this.banner = {
        text: 'WATCH CLEAR!',
        sub: 'THE FESTIVAL CHEERS',
        ticks: CLEAR_TICKS,
      }
      this.sound.play('level')
      return
    }
    if (this.moths.some((m) => !m.gone)) return
    this.clear = CLEAR_TICKS
    if (this.glow) {
      const perfect = this.glowHits === this.glowTotal
      this.tally.glows++
      if (perfect) this.tally.perfectGlows++
      const bonus = perfect
        ? Math.min(
            GLOW_PERFECT_MAX,
            GLOW_PERFECT + GLOW_PERFECT_STEP * (this.place.lap - 1),
          )
        : 0
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
        : kind === 'escort'
          ? ['#f9a8d4', '#fde68a']
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
   * Dodges dust, divers, the queen's glow and the Guardian's sweep (dashing through it); otherwise
   * lines up under the nearest moth, wing panel or Guardian and beams it.
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
    if (!this.alive || this.results || this.clear > 0) return frame
    const half = this.twin ? 12 : 6
    // Threats: dust about to land near us, divers low and close, a glow.
    let push = 0
    const threat = (x: number, y: number, reach: number) => {
      if (y > SHIP_Y - 60 && y < SHIP_Y + 10 && Math.abs(x - this.x) < reach)
        push += x < this.x ? 1 : -1
    }
    for (const d of this.dust)
      if (
        d.y > SHIP_Y - 70 &&
        d.y < SHIP_Y + 4 &&
        Math.abs(d.x - this.x) < half + 8
      )
        push += d.x < this.x ? 1 : -1
    for (const m of this.moths) {
      if (m.gone) continue
      if (m.mode === 'dive' || m.mode === 'home' || m.mode === 'escort')
        threat(m.x, m.y, half + 14)
      if (m.mode === 'beam' && Math.abs(m.x - this.x) < this.beamHalf(m) + 12)
        push += m.x < this.x ? 1 : -1
    }
    const gd = this.guardian
    if (gd && gd.phase === 3 && gd.act === 'dive') {
      threat(gd.x, gd.y, half + 18)
      for (const a of gd.ring) {
        const p = ringPos(gd, a)
        threat(p.x, p.y, half + 12)
      }
    }
    if (gd && gd.phase === 2) {
      const ahead = (this.x - gd.sweepX) * gd.sweepDir
      // Clear of the sweep's starting edge while the guide line shows; then dash through it.
      if (gd.act === 'tell' && Math.abs(this.x - gd.sweepX) < 50)
        push += gd.sweepDir * 3
      if (gd.act === 'sweep' && ahead > -GUARDIAN.sweepHalf && ahead < 46)
        push -= gd.sweepDir * 3
    }
    let aim: number | null = null
    if (gd && gd.phase < 4 && gd.act !== 'enter') {
      const panels = gd.panels.filter((p) => p.hp > 0)
      aim =
        gd.phase === 1 && panels.length > 0
          ? panels
              .map((p) => gd.x + p.dx)
              .sort((a, b) => Math.abs(a - this.x) - Math.abs(b - this.x))[0]!
          : gd.x
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
        targets
          .filter((m) => m.mode === 'dive' || m.mode === 'escort')
          .sort((a, b) => b.y - a.y)[0] ??
        targets.sort(
          (a, b) =>
            Math.abs(a.x - this.x) - Math.abs(b.x - this.x) || b.y - a.y,
        )[0]
      if (target) {
        const lead = target.mode === 'form' ? 0 : Math.cos(target.heading) * 10
        aim = target.x + lead
      }
      if (aim !== null) {
        const dx = aim - this.x
        if (dx > 2) held.right = true
        if (dx < -2) held.left = true
      }
    }
    // Beam whenever something is roughly overhead.
    const overhead =
      (gd !== null && aim !== null && Math.abs(aim - this.x) < 10) ||
      this.moths.some(
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
    if (this.results) {
      this.renderResults(g, this.results)
      vignette(g, W, H, 0.3)
      this.renderHud(g)
      return
    }
    // (A beamed-down queen's glow goes out with her.)
    for (const m of this.moths)
      if (m.mode === 'beam' && !m.gone) this.renderGlow(g, m)
    if (this.guardian) this.renderGuardianStage(g, this.guardian)
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
      glow(g, d.x, d.y, 6, d.ember ? RAMPS.ember[2] : RAMPS.pink[2], 0.4)
      drawSprite(g, (d.ember ? EMBER_SPRITES : DUST_SPRITES)[mote]!, d.x, d.y)
    }
    if (this.alive && (this.safe === 0 || Math.floor(this.safe / 4) % 2)) {
      const grip = this.guardian ? gripShare(this.guardian) : 0
      if (grip > 0) glow(g, this.x, SHIP_Y, 20, RAMPS.purple[3], 0.6 * grip)
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
    this.renderSkyLanterns(g, false)
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
    this.renderSkyLanterns(g, true)
    cachedLayer(g, 'lantern-swarm-rooftops', W, H, paintRooftops)
  }

  /** The festival's paper lanterns, rising and swaying: the far ones dim, the near ones glowing. */
  private renderSkyLanterns(g: CanvasRenderingContext2D, near: boolean) {
    const span = H + 30
    for (const s of SKY_LANTERNS) {
      if (s.near !== near) continue
      const y =
        Math.round((((s.y - this.tick * s.speed) % span) + span) % span) - 15
      const x = Math.round(s.x + Math.sin(this.tick / 60 + s.phase) * 3)
      if (near) {
        glow(g, x, y + 2, 8, s.ramp[3], 0.3)
        g.fillStyle = s.ramp[1]
        g.fillRect(x - 2, y - 1, 5, 1)
        g.fillStyle = s.ramp[3]
        g.fillRect(x - 2, y, 5, 5)
        g.fillStyle = RAMPS.gold[4]
        g.fillRect(x, y + 2, 1, 2)
      } else {
        glow(g, x, y + 1, 4, s.ramp[2], 0.25)
        g.fillStyle = rgba(s.ramp[2], 0.75)
        g.fillRect(x - 1, y, 2, 3)
      }
    }
  }

  private renderGuardianStage(g: CanvasRenderingContext2D, gd: Guardian) {
    renderGuardian(g, gd, this.tick, SHIP_Y)
    const flap = Math.floor(this.tick / 8) % 2
    for (const a of gd.ring) {
      const p = ringPos(gd, a)
      drawSprite(g, ESCORTS.up[flap]!, p.x, p.y, { flipY: true })
    }
    if (gd.holding) {
      glow(g, gd.x, gd.y + 19, 10, RAMPS.ember[2], 0.35)
      this.renderLantern(g, gd.x, gd.y + 20, true)
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
    const set = this.glow
      ? CRANES[(m.row + m.col) % 2]!
      : m.kind === 'queen'
        ? m.hp > 1
          ? QUEENS
          : QUEENS_HURT
        : m.kind === 'escort'
          ? ESCORTS
          : m.kind === 'luna'
            ? LUNAS
            : MOTHS
    // Face the heading in quarter turns: flips of the up and side frames, never a rotation.
    const facing = m.mode === 'form' ? Math.PI / 2 : m.heading
    const dx = Math.cos(facing)
    const dy = Math.sin(facing)
    if (m.kind === 'queen' && !this.glow)
      glow(g, m.x, m.y, 14, RAMPS.purple[3], 0.25)
    // The last moths of a stage burn with a warning glow while they dive non-stop.
    if (this.frenzy) glow(g, m.x, m.y, 11, RAMPS.ember[3], 0.3)
    if (Math.abs(dy) >= Math.abs(dx))
      drawSprite(g, set.up[flap]!, m.x, m.y, { flipY: dy > 0 })
    else drawSprite(g, set.side[flap]!, m.x, m.y, { flipX: dx > 0 })
    if (m.kind === 'queen' && m.holding && m.mode !== 'beam') {
      const c = this.captivePos(m)
      glow(g, c.x, c.y - 1, 10, RAMPS.ember[2], 0.35)
      this.renderLantern(g, c.x, c.y, true)
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

  /** The Watch's results card: shots, hits and hit ratio, perfect Glows and escort bonuses. */
  private renderResults(g: CanvasRenderingContext2D, r: Results) {
    const x = 20
    const y = 56
    const w = W - 40
    const h = 172
    hudPanel(g, x, y, w, h)
    drawText(g, `${r.zone.watch} WATCH`, W / 2, y + 8, {
      scale: 2,
      align: 'center',
      color: RAMPS.gold[4],
      outline: INK,
    })
    drawText(g, r.zone.name, W / 2, y + 28, {
      align: 'center',
      color: RAMPS.pink[3],
      outline: INK,
    })
    resultRows(r.tally).forEach(([label, value], i) => {
      const ry = y + 48 + i * 15
      const show = r.ticks > 20 + i * 12
      if (!show) return
      drawText(g, label, x + 8, ry, { color: RAMPS.purple[4], outline: INK })
      drawText(g, value, x + w - 8, ry, {
        align: 'right',
        color: '#ffffff',
        outline: INK,
      })
    })
    if (r.ticks >= RESULTS_SKIP && Math.floor(this.tick / 20) % 2 === 0)
      drawText(g, 'PRESS A TO FLY ON', W / 2, y + h - 16, {
        align: 'center',
        color: RAMPS.gold[3],
        outline: INK,
      })
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
    // Stage badges: one pip per stage of this Watch, lit as they are cleared.
    const stages = this.place.zone.stages
    for (let i = 0; i < stages.length; i++) {
      const lit =
        i < this.place.stageIndex ||
        (i === this.place.stageIndex && this.clear > 0)
      const kind = stages[i]!.kind
      g.fillStyle = INK
      g.fillRect(W - 66 + i * 6, 21, 5, 4)
      g.fillStyle = lit
        ? kind === 'guardian'
          ? RAMPS.gold[4]
          : kind === 'glow'
            ? RAMPS.purple[3]
            : RAMPS.teal[3]
        : i === this.place.stageIndex
          ? RAMPS.steel[3]
          : RAMPS.night[3]
      g.fillRect(W - 65 + i * 6, 22, 3, 2)
    }
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
      if (this.banner.sub2)
        drawText(g, this.banner.sub2, W / 2, 182, {
          align: 'center',
          color: RAMPS.teal[3],
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
