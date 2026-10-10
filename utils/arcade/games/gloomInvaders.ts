// /utils/arcade/games/gloomInvaders.ts
//
// Gloom Invaders -- the Kind Robots Arcade's Space Invaders riff (conductor
// kr-arcade/t-009 game factory). Rows of grumpy gloom clouds march down the
// sky. Sunny, a little solar robot, shines sunbeams up at them: every cloud a
// beam reaches turns into a smiling rain cloud and drifts off to water the
// garden. Rainbow umbrellas shelter Sunny from the gloom drops, but they wear
// away (Sunny's own beams nibble them too).
//
// Each wave starts lower and marches faster, the last clouds of a wave hurry,
// and a rainbow kite crosses the top now and then for a mystery bonus. Left
// and right move; A (or Up) shines a sunbeam. One beam at a time, so aim. If
// the gloom reaches the ground Sunny loses a life and the wave regroups.

import { levelCurve } from '../curve'
import { drawText, measureText } from '../font'
import {
  INK,
  RAMPS,
  Sparkles,
  backdropRng,
  bandedGradient,
  cachedLayer,
  drawCloud,
  drawRidge,
  drawSprite,
  dropShadow,
  glow,
  hudPanel,
  mirrorSprite,
  mix,
  pixelSprite,
  rgba,
  ridge,
  shadedOrb,
  vignette,
} from '../snes'
import type { Ramp } from '../snes'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'

const W = 288
const H = 384
const GROUND_Y = H - 18
const PLAYER_Y = H - 34
const PLAYER_HALF = 8
const PLAYER_SPEED = 2
const BEAM_SPEED = 6
const AUTOFIRE_COOLDOWN = 14

const COLS = 9
const ROWS = 5
const CELL_W = 24
const CELL_H = 18
const CLOUD_W = 18
const CLOUD_H = 12
const STEP_X = 4
const HURRY_STEP_X = 6
const DROP_Y = 8
const EDGE = 6
/** Top row is the storm cloud; the bottom rows are the small grumps. */
const ROW_POINTS = [30, 20, 20, 10, 10]

const UMBRELLAS = 4
const UMB_COLS = 22
const UMB_ROWS = 13
const UMB_CELL = 2
const UMBRELLA_Y = H - 84

const START_LIVES = 3
const FIRST_EXTRA = 1500
const EXTRA_EVERY = 10_000
const DEATH_TICKS = 100
const WAVE_CLEAR_TICKS = 130

const KITE_Y = 32
/** The rainbow kite's mystery values, picked by how many beams you've shone. */
const KITE_VALUES = [
  100, 50, 50, 100, 150, 100, 100, 50, 300, 100, 100, 100, 50, 150, 100,
]

const RAINBOW = [
  '#ef4444',
  '#f97316',
  '#facc15',
  '#4ade80',
  '#38bdf8',
  '#a78bfa',
]

export const GLOOM_CURVES = {
  /** Extra ticks between formation steps while the whole wave is alive. */
  march: { start: 34, step: -3, limit: 16 },
  /** Where the formation's top row starts: each wave a little lower. */
  startY: { start: 52, step: 8, limit: 100 },
  dropEvery: { start: 48, step: -4, limit: 16 },
  maxDrops: { start: 2, step: 0.5, limit: 6 },
  dropSpeed: { start: 2, step: 0.15, limit: 3.6 },
  kiteEvery: { start: 1500, step: -60, limit: 900 },
} as const

type Cloud = { col: number; row: number; alive: boolean }
type Drop = { x: number; y: number; speed: number }
type Happy = { x: number; y: number; life: number }
type Umbrella = { x: number; cells: boolean[] }
type Kite = { x: number; dir: 1 | -1 }
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = { x: number; y: number; text: string; life: number }

/** The umbrella bitmap: a dome canopy over a hooked handle. */
function umbrellaShape(): boolean[] {
  const cells: boolean[] = []
  const cx = (UMB_COLS - 1) / 2
  for (let r = 0; r < UMB_ROWS; r++) {
    for (let c = 0; c < UMB_COLS; c++) {
      let on: boolean
      if (r < 9) {
        const dx = (c - cx) / (UMB_COLS / 2)
        const dy = (8.5 - r) / 9
        on = dx * dx + dy * dy <= 1
        // Scalloped hem between the ribs.
        if (r === 8 && c % 5 === 2) on = false
      } else {
        on = c === 10 || c === 11
        if (r === UMB_ROWS - 1 && (c === 7 || c === 8 || c === 9)) on = true
        if (r === UMB_ROWS - 2 && c === 7) on = true
      }
      cells.push(on)
    }
  }
  return cells
}

// --- 16-bit art (utils/arcade/snes.ts) -------------------------------------------

/** How many sky stages there are: the sky brightens one stage per cleared wave. */
const SKY_STAGES = 6

/** Gloom-cloud ramps by row type: the storm, the grey middle rows, the dark grumps. */
const GLOOM_RAMPS: readonly Ramp[] = [
  ['#1c0f3d', '#36206e', '#5a3aa6', '#8a6fdc', '#c9bbff'],
  ['#1c2338', '#353f5c', '#58658a', '#8a97b8', '#c4cde0'],
  ['#141a2e', '#262f4c', '#414d6e', '#6d7a9c', '#a6b2cc'],
]
const HAPPY_RAMP: Ramp = [
  RAMPS.purple[1],
  RAMPS.purple[3],
  '#e4dcff',
  RAMPS.purple[4],
  '#ffffff',
]
/** The six umbrella and flower colours, red to violet, as shading ramps. */
const RAINBOW_RAMPS: readonly Ramp[] = [
  ['#4a0d1a', '#a3172f', '#e8383d', '#f87171', '#fecaca'],
  RAMPS.rust,
  RAMPS.gold,
  RAMPS.leaf,
  RAMPS.sky,
  RAMPS.purple,
]

type Puff = readonly [x: number, y: number, r: number]
/** Puff layouts per row type: a tall storm anvil, the classic puff, a squat grump. */
const GLOOM_SHAPES: readonly (readonly Puff[])[] = [
  [
    [4.5, 7, 4.5],
    [9.5, 4.5, 6],
    [14, 6.5, 4.5],
  ],
  [
    [5, 7, 5],
    [10, 5, 6],
    [14, 7, 4.5],
  ],
  [
    [5.5, 7.5, 4.5],
    [10.5, 6, 5],
    [14, 8, 3.5],
  ],
]

/**
 * A cloud body as shade digits '0'..'4' (ramp steps): each pixel lit by the puff it sits highest
 * on, from the upper left, with the flat underside in shadow. `wobble` breathes the puffs.
 */
function cloudRows(puffs: readonly Puff[], wobble: number): string[] {
  const rows: string[] = []
  for (let r = 0; r < CLOUD_H; r++) {
    let row = ''
    for (let c = 0; c < CLOUD_W; c++) {
      const px = c + 0.5
      const py = r + 0.5
      let light = -Infinity
      puffs.forEach(([cx, cy, pr], i) => {
        const rr = pr + (i % 2 ? -wobble : wobble)
        const nx = (px - cx) / rr
        const ny = (py - cy) / rr
        const d2 = nx * nx + ny * ny
        if (d2 > 1) return
        light = Math.max(light, 0.4 * Math.sqrt(1 - d2) - 0.55 * ny - 0.3 * nx)
      })
      if (light === -Infinity && px >= 2 && px <= 17 && py >= 7) light = -0.6
      if (light !== -Infinity) light -= Math.max(0, py - 8.5) * 0.18
      row +=
        light === -Infinity
          ? '.'
          : light > 0.5
            ? '4'
            : light > 0.18
              ? '3'
              : light > -0.15
                ? '2'
                : light > -0.45
                  ? '1'
                  : '0'
    }
    rows.push(row)
  }
  return rows
}

/** Paint single pixels (x, y, palette letter) over sprite rows, growing them as needed. */
function overlay(
  rows: string[],
  marks: readonly (readonly [number, number, string])[],
): string[] {
  const out = [...rows]
  for (const [x, y, ch] of marks) {
    while (out.length <= y) out.push('.'.repeat(CLOUD_W))
    const row = out[y]!.padEnd(x + 1, '.')
    out[y] = row.slice(0, x) + ch + row.slice(x + 1)
  }
  return out
}

const GRUMP_EYES = [
  [6, 5, 'w'],
  [7, 5, 'k'],
  [6, 6, 'k'],
  [7, 6, 'k'],
  [11, 5, 'k'],
  [12, 5, 'w'],
  [11, 6, 'k'],
  [12, 6, 'k'],
] as const
const FROWN = [
  [7, 9, 'k'],
  [8, 9, 'k'],
  [9, 9, 'k'],
  [10, 9, 'k'],
  [11, 9, 'k'],
  [6, 10, 'k'],
  [12, 10, 'k'],
] as const
const STORM_BROWS = [
  [5, 3, 'k'],
  [6, 3, 'k'],
  [7, 4, 'k'],
  [12, 3, 'k'],
  [13, 3, 'k'],
  [11, 4, 'k'],
] as const
const BOLT = [
  [10, 12, 'Y'],
  [9, 13, 'Y'],
  [10, 13, 'y'],
  [8, 14, 'Y'],
  [9, 14, 'y'],
  [8, 15, 'y'],
] as const

function drizzle(off: number) {
  return [
    [4 + off, 13, 'r'],
    [4 + off, 14, 'R'],
    [11 + off, 13, 'r'],
    [11 + off, 14, 'R'],
  ] as const
}

function rampPalette(ramp: Ramp): Record<string, string> {
  return {
    '0': ramp[0],
    '1': ramp[1],
    '2': ramp[2],
    '3': ramp[3],
    '4': ramp[4],
  }
}

/** GLOOM_SPRITES[row type][march frame]: 18x12 body art (+ drizzle or a bolt below), outlined. */
const GLOOM_SPRITES = GLOOM_SHAPES.map((puffs, kind) =>
  [0, 1].map((frame) => {
    let rows = cloudRows(puffs, frame ? 0.6 : -0.6)
    rows = overlay(rows, [...GRUMP_EYES, ...FROWN])
    if (kind === 0) {
      rows = overlay(rows, STORM_BROWS)
      if (frame) rows = overlay(rows, BOLT)
    } else {
      rows = overlay(rows, drizzle(frame ? 0 : 3))
    }
    return pixelSprite(rows, {
      ...rampPalette(GLOOM_RAMPS[kind]!),
      k: INK,
      w: '#ffffff',
      Y: RAMPS.gold[4],
      y: RAMPS.gold[3],
      r: RAMPS.purple[3],
      R: RAMPS.purple[2],
    })
  }),
)

/** A cloud the sunbeam reached: lit up, smiling, rosy-cheeked. */
const HAPPY_SPRITE = pixelSprite(
  overlay(cloudRows(GLOOM_SHAPES[1]!, 0), [
    [6, 5, 'k'],
    [7, 5, 'k'],
    [6, 6, 'k'],
    [7, 6, 'w'],
    [11, 5, 'k'],
    [12, 5, 'k'],
    [11, 6, 'w'],
    [12, 6, 'k'],
    [6, 9, 'k'],
    [12, 9, 'k'],
    [7, 10, 'k'],
    [8, 10, 'k'],
    [9, 10, 'k'],
    [10, 10, 'k'],
    [11, 10, 'k'],
    [4, 8, 'c'],
    [5, 8, 'c'],
    [13, 8, 'c'],
    [14, 8, 'c'],
  ]),
  { ...rampPalette(HAPPY_RAMP), k: INK, w: '#ffffff', c: RAMPS.pink[3] },
)

const DROP_SPRITES = (() => {
  const drop = pixelSprite(['.h..', '.lb.', '..bs', '.bs.', '.ss.'], {
    h: RAMPS.purple[4],
    l: RAMPS.purple[3],
    b: RAMPS.purple[2],
    s: RAMPS.purple[1],
  })
  return [drop, mirrorSprite(drop)] as const
})()

const SUNNY_PALETTE = {
  h: RAMPS.teal[4],
  T: RAMPS.teal[2],
  t: RAMPS.teal[1],
  d: RAMPS.teal[0],
  k: INK,
  E: RAMPS.gold[4],
  p: RAMPS.pink[3],
  s: RAMPS.steel[2],
  S: RAMPS.steel[3],
  n: RAMPS.steel[1],
}
const SUNNY_BODY = [
  '.......nn.......',
  '..hhhhhhhhhhhh..',
  '.hTTTTTTTTTTTTt.',
  'hTkkkkkkkkkkkkTt',
  'hTkEEkkkkkkEEkTt',
  'hTkkkkkkkkkkkkTt',
  'hTpTTTTTTTTTpTtd',
  '.ttttttttttttdd.',
]
/** Sunny, the solar robot: two tread frames, so the wheels roll as Sunny drives. */
const SUNNY_SPRITES = [
  pixelSprite(
    [...SUNNY_BODY, '.sSsS......sSsS.', '.SsSs......SsSs.', '..nn........nn..'],
    SUNNY_PALETTE,
  ),
  pixelSprite(
    [...SUNNY_BODY, '.SsSs......SsSs.', '.sSsS......sSsS.', '..nn........nn..'],
    SUNNY_PALETTE,
  ),
] as const

/** A spare Sunny for the lives box. */
const LIFE_SPRITE = pixelSprite(
  ['..yy..', '.yYYy.', 'tTTTTt', 'tkEEkt', '.s..s.'],
  {
    y: RAMPS.gold[3],
    Y: RAMPS.gold[4],
    T: RAMPS.teal[3],
    t: RAMPS.teal[2],
    k: INK,
    E: RAMPS.gold[4],
    s: RAMPS.steel[2],
  },
)

/** The rainbow kite: a diamond banded red to violet, lit on the left, with its spars. */
const KITE_SPRITE = (() => {
  const palette: Record<string, string> = {
    z: RAMPS.earth[3],
    Z: RAMPS.earth[2],
  }
  const rows: string[] = []
  for (let r = 0; r < 12; r++) {
    const half = Math.round(8 - Math.abs(r - 5.5) * 1.4)
    const band = Math.floor(r / 2)
    const ramp = RAINBOW_RAMPS[band]!
    let row = ''
    for (let c = 0; c < 17; c++) {
      const dx = c - 8
      if (Math.abs(dx) > half) {
        row += '.'
        continue
      }
      if (c === 8) {
        row += 'z'
        continue
      }
      if (r === 5) {
        row += 'Z'
        continue
      }
      const shade =
        dx === -half && r < 6
          ? 4
          : dx < -half * 0.3
            ? 3
            : dx > half * 0.5
              ? 1
              : 2
      const key = String.fromCharCode(97 + band * 5 + shade)
      palette[key] = ramp[shade]!
      row += key
    }
    rows.push(row)
  }
  return pixelSprite(rows, palette)
})()

const BOW_SPRITES = [RAMPS.pink, RAMPS.gold].map((ramp) =>
  pixelSprite(['h.p', 'hkp', 'h.p'], { h: ramp[3], p: ramp[2], k: ramp[1] }),
)

const FLOWER_ROWS = [
  '..hPp...',
  '.hPPPp..',
  'hPPOPPp.',
  'PPOoOpd.',
  '.pPOpd..',
  '..pdd...',
  '...g....',
  'Ll.g....',
  '.LLg.Ll.',
  '...gLl..',
  '...g....',
]
/** FLOWER_SPRITES[colour][sway frame]: the head nods one pixel in the breeze. */
const FLOWER_SPRITES = RAINBOW_RAMPS.map((ramp) => {
  const palette = {
    h: ramp[4],
    P: ramp[3],
    p: ramp[2],
    d: ramp[1],
    O: RAMPS.gold[4],
    o: RAMPS.rust[2],
    g: RAMPS.leaf[2],
    L: RAMPS.leaf[3],
    l: RAMPS.leaf[1],
  }
  const sway = FLOWER_ROWS.map((row, i) =>
    i < 6 ? '.' + row.slice(0, 7) : i === 6 ? '....g...' : row,
  )
  return [
    pixelSprite(FLOWER_ROWS, palette),
    pixelSprite(sway, palette),
  ] as const
})

/** Sky bands, hill colours and the sun's height for each sky stage, darkest first. */
const SKIES = Array.from({ length: SKY_STAGES + 1 }, (_, stage) => {
  const t = stage / SKY_STAGES
  return {
    t,
    bands: [
      mix('#0b0a24', RAMPS.sky[1], t),
      mix(RAMPS.night[2], RAMPS.sky[2], t),
      mix('#3a1f6e', RAMPS.sky[3], t),
      mix('#6b2a7a', RAMPS.gold[3], t),
    ],
    far: mix('#2a1f5c', '#5a7fc0', t),
    farRim: mix('#4a3a8a', '#a9c8ef', t),
    near: mix('#15233a', RAMPS.leaf[1], t),
    nearRim: mix('#2b4a52', RAMPS.leaf[3], t),
    haze: [
      mix(RAMPS.night[1], RAMPS.purple[1], t),
      mix(RAMPS.night[1], RAMPS.purple[1], t),
      mix(RAMPS.night[2], RAMPS.sky[2], t),
      mix(RAMPS.night[3], RAMPS.sky[3], t),
      mix(RAMPS.night[4], '#ffffff', t),
    ] as Ramp,
  }
})

const FAR_HILLS = ridge(17, W, 30, 4)
const NEAR_HILLS = ridge(41, W, 16, 4)
const HAZE_CLOUDS = (() => {
  const rand = backdropRng(23)
  return Array.from({ length: 3 }, (_, i) => ({
    x: (W / 3) * i + rand() * 60,
    y: 262 + rand() * 18,
    size: 6 + rand() * 3,
    speed: 0.05 + rand() * 0.05,
  }))
})()

/** A canvas painted once (null headless, where the caller paints straight onto the screen). */
function bakeCanvas(
  w: number,
  h: number,
  paint: (k: CanvasRenderingContext2D) => void,
): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const k = canvas.getContext('2d')
  if (!k) return null
  paint(k)
  return canvas
}

/**
 * An umbrella as shaded 2x2 cells: each rainbow stripe on its own ramp, lit across the dome from
 * the upper left, every exposed top edge catching the light and every eroded underside in
 * shadow, all wrapped in an ink outline so the bites stay readable.
 */
function paintUmbrella(
  k: CanvasRenderingContext2D,
  cells: readonly boolean[],
  x0: number,
  y0: number,
) {
  const on = (r: number, c: number) =>
    r >= 0 &&
    r < UMB_ROWS &&
    c >= 0 &&
    c < UMB_COLS &&
    !!cells[r * UMB_COLS + c]
  k.fillStyle = INK
  for (let r = 0; r < UMB_ROWS; r++)
    for (let c = 0; c < UMB_COLS; c++)
      if (on(r, c))
        k.fillRect(
          x0 + c * UMB_CELL - 1,
          y0 + r * UMB_CELL - 1,
          UMB_CELL + 2,
          UMB_CELL + 2,
        )
  const stripe = UMB_COLS / RAINBOW_RAMPS.length
  for (let r = 0; r < UMB_ROWS; r++) {
    for (let c = 0; c < UMB_COLS; c++) {
      if (!on(r, c)) continue
      let colour: string
      if (r < 9) {
        const ramp =
          RAINBOW_RAMPS[
            Math.min(RAINBOW_RAMPS.length - 1, Math.floor(c / stripe))
          ]!
        const dx = (c - (UMB_COLS - 1) / 2) / (UMB_COLS / 2)
        let shade = dx < -0.4 ? 3 : dx > 0.5 ? 1 : 2
        if (r >= 7) shade = Math.max(1, shade - 1)
        if (!on(r - 1, c)) shade = dx < 0.3 ? 4 : 3
        else if (r === 8 || !on(r + 1, c)) shade = Math.min(shade, 1)
        colour = ramp[shade]!
      } else {
        colour = !on(r - 1, c)
          ? RAMPS.cream[4]
          : c === 10
            ? RAMPS.cream[3]
            : c === 11
              ? RAMPS.cream[1]
              : RAMPS.cream[2]
      }
      k.fillStyle = colour
      k.fillRect(x0 + c * UMB_CELL, y0 + r * UMB_CELL, UMB_CELL, UMB_CELL)
    }
  }
}

class GloomInvaders implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private px = W / 2
  private beam: { x: number; y: number } | null = null
  private fireCooldown = 0
  private beamsShone = 0
  private clouds: Cloud[] = []
  private fx = 0
  private fy = 0
  private dir: 1 | -1 = 1
  private stepTimer = 0
  private frame = 0
  private lastBeat = 0
  private drops: Drop[] = []
  private dropTimer = 0
  private umbrellas: Umbrella[] = []
  private kite: Kite | null = null
  private kiteTimer = 0
  private happies: Happy[] = []
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private dead = 0
  private waveClear = 0
  /** Waves cleared this game: each one grows a flower in the garden. */
  private cleared = 0
  private nextExtra = FIRST_EXTRA
  private banner: { text: string; sub?: string; ticks: number } | null = null
  private stars: Array<{ x: number; y: number; phase: number }> = []
  // Cosmetic sparkles roll their own dice, so the game's seeded rng is untouched.
  private sparkles = new Sparkles()
  private sparkRng = backdropRng(41)
  private umbrellaArt = new WeakMap<
    Umbrella,
    { left: number; canvas: HTMLCanvasElement | null }
  >()

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    for (let i = 0; i < 40; i++) {
      this.stars.push({
        x: this.rng() * W,
        y: 20 + this.rng() * (UMBRELLA_Y - 40),
        phase: this.rng() * Math.PI * 2,
      })
    }
    this.startWave(1)
  }

  // --- setup -------------------------------------------------------------------

  private startWave(wave: number) {
    this.level = wave
    this.clouds = []
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        this.clouds.push({ col, row, alive: true })
      }
    }
    this.umbrellas = Array.from({ length: UMBRELLAS }, (_, i) => ({
      x: Math.round((W * (i + 0.5)) / UMBRELLAS - (UMB_COLS * UMB_CELL) / 2),
      cells: umbrellaShape(),
    }))
    this.regroup()
    this.kite = null
    this.kiteTimer = Math.round(levelCurve(wave, GLOOM_CURVES.kiteEvery))
    this.banner = { text: `WAVE ${wave}`, sub: 'SHINE ON THE GLOOM', ticks: 90 }
  }

  /** Put the formation back at the wave's starting height. */
  private regroup() {
    this.fx = Math.round((W - ((COLS - 1) * CELL_W + CLOUD_W)) / 2)
    this.fy = Math.round(levelCurve(this.level, GLOOM_CURVES.startY))
    this.dir = 1
    this.stepTimer = 30
    this.drops = []
    this.dropTimer = 60
    this.beam = null
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    const controls = this.demo ? this.demoInput() : input

    if (this.dead > 0) {
      if (--this.dead === 0) {
        if (this.lives <= 0) {
          this.over = true
          this.banner = { text: 'GAME OVER', ticks: 9999 }
        } else {
          this.px = W / 2
          this.drops = []
        }
      }
      return
    }
    if (this.waveClear > 0) {
      this.movePlayer(controls)
      if (--this.waveClear === 0) this.startWave(this.level + 1)
      return
    }

    this.movePlayer(controls)
    this.fire(controls)
    this.updateBeam()
    this.march()
    if (this.dead > 0) return
    this.updateDrops()
    this.updateKite()
    if (this.clouds.every((c) => !c.alive)) this.clearWave()
  }

  private movePlayer(input: InputFrame) {
    if (input.held.left) this.px -= PLAYER_SPEED
    if (input.held.right) this.px += PLAYER_SPEED
    this.px = Math.max(PLAYER_HALF + 4, Math.min(W - PLAYER_HALF - 4, this.px))
  }

  private fire(input: InputFrame) {
    if (this.fireCooldown > 0) this.fireCooldown--
    if (this.beam) return
    const pressed = input.pressed.a || input.pressed.up
    const held = (input.held.a || input.held.up) && this.fireCooldown === 0
    if (!pressed && !held) return
    this.beam = { x: this.px, y: PLAYER_Y - 10 }
    this.beamsShone++
    this.fireCooldown = AUTOFIRE_COOLDOWN
    this.sound.play('shoot')
  }

  private updateBeam() {
    const beam = this.beam
    if (!beam) return
    // Check every couple of pixels so a fast beam never skips a cloud edge.
    for (let i = 0; i < BEAM_SPEED; i += 2) {
      beam.y -= 2
      if (beam.y < 20) {
        this.beam = null
        return
      }
      const hit = this.umbrellaCell(beam.x, beam.y)
      if (hit) {
        this.erode(hit[0], hit[1], 1.6)
        this.beam = null
        return
      }
      if (this.kite && Math.abs(beam.x - this.kite.x) < 10) {
        if (Math.abs(beam.y - KITE_Y) < 7) {
          this.hitKite()
          this.beam = null
          return
        }
      }
      for (const cloud of this.clouds) {
        if (!cloud.alive) continue
        const x = this.fx + cloud.col * CELL_W
        const y = this.fy + cloud.row * CELL_H
        if (beam.x < x || beam.x > x + CLOUD_W) continue
        if (beam.y < y || beam.y > y + CLOUD_H) continue
        this.hitCloud(cloud, x, y)
        this.beam = null
        return
      }
      for (const [j, drop] of this.drops.entries()) {
        if (Math.abs(drop.x - beam.x) < 3 && Math.abs(drop.y - beam.y) < 5) {
          // A sunbeam evaporates a gloom drop on the way up.
          this.drops.splice(j, 1)
          this.burst(beam.x, beam.y, 4, '#fde68a')
          this.sparkles.burst(beam.x, beam.y, this.sparkRng, {
            count: 3,
            speed: 1,
          })
          this.beam = null
          return
        }
      }
    }
  }

  private hitCloud(cloud: Cloud, x: number, y: number) {
    cloud.alive = false
    this.addScore(ROW_POINTS[cloud.row] ?? 10, x + CLOUD_W / 2, y)
    this.happies.push({ x, y, life: 60 })
    this.burst(x + CLOUD_W / 2, y + CLOUD_H / 2, 6, '#fde68a')
    this.sparkles.burst(x + CLOUD_W / 2, y + CLOUD_H / 2, this.sparkRng, {
      count: 7,
      colours: [RAMPS.gold[4], RAMPS.gold[3], RAMPS.pink[3]],
    })
    this.sound.play('pop')
  }

  private hitKite() {
    const kite = this.kite!
    const value = KITE_VALUES[this.beamsShone % KITE_VALUES.length]!
    this.addScore(value, kite.x, KITE_Y + 10)
    for (let i = 0; i < RAINBOW.length; i++) {
      this.burst(kite.x, KITE_Y, 2, RAINBOW[i]!)
    }
    this.sparkles.burst(kite.x, KITE_Y, this.sparkRng, {
      count: 16,
      colours: RAINBOW,
      speed: 2.2,
    })
    this.kite = null
    this.sound.play('pickup')
  }

  private aliveClouds(): Cloud[] {
    return this.clouds.filter((c) => c.alive)
  }

  private march() {
    if (--this.stepTimer > 0) return
    const alive = this.aliveClouds()
    if (!alive.length) return
    const total = COLS * ROWS
    const pace = levelCurve(this.level, GLOOM_CURVES.march)
    const hurry = alive.length <= 1
    this.stepTimer = hurry
      ? 1
      : Math.max(1, Math.round(1 + (pace * (alive.length - 1)) / (total - 1)))
    const dx = (hurry ? HURRY_STEP_X : STEP_X) * this.dir
    const minCol = Math.min(...alive.map((c) => c.col))
    const maxCol = Math.max(...alive.map((c) => c.col))
    const left = this.fx + minCol * CELL_W + dx
    const right = this.fx + maxCol * CELL_W + CLOUD_W + dx
    if (left < EDGE || right > W - EDGE) {
      this.fy += DROP_Y
      this.dir = this.dir === 1 ? -1 : 1
    } else {
      this.fx += dx
    }
    this.frame ^= 1
    if (this.tick - this.lastBeat >= 10) {
      this.lastBeat = this.tick
      this.sound.play('blip')
    }
    // Clouds low enough to touch the umbrellas soak them away.
    const maxRow = Math.max(...alive.map((c) => c.row))
    const bottom = this.fy + maxRow * CELL_H + CLOUD_H
    if (bottom >= UMBRELLA_Y) {
      for (const cloud of alive) {
        const x = this.fx + cloud.col * CELL_W
        const y = this.fy + cloud.row * CELL_H
        this.soak(x, y)
      }
    }
    if (bottom >= PLAYER_Y - 6) this.invaded()
  }

  private invaded() {
    this.lives--
    this.dead = DEATH_TICKS
    this.burst(this.px, PLAYER_Y, 16, '#94a3b8')
    this.banner = { text: 'THE GLOOM LANDED', sub: 'REGROUPING', ticks: 100 }
    this.sound.play('die')
    this.regroup()
  }

  private updateDrops() {
    const speedCap = levelCurve(this.level, GLOOM_CURVES.dropSpeed)
    for (const drop of this.drops) drop.y += drop.speed
    this.drops = this.drops.filter((drop) => {
      if (drop.y > GROUND_Y) {
        this.burst(drop.x, GROUND_Y, 2, '#7c3aed')
        return false
      }
      const hit = this.umbrellaCell(drop.x, drop.y + 3)
      if (hit) {
        this.erode(hit[0], hit[1], 1.8)
        return false
      }
      if (
        Math.abs(drop.x - this.px) < PLAYER_HALF &&
        drop.y + 3 > PLAYER_Y - 6 &&
        drop.y < PLAYER_Y + 6
      ) {
        this.playerHit()
        return false
      }
      return true
    })
    if (this.dead > 0) return
    if (--this.dropTimer > 0) return
    this.dropTimer = Math.round(levelCurve(this.level, GLOOM_CURVES.dropEvery))
    const maxDrops = Math.round(levelCurve(this.level, GLOOM_CURVES.maxDrops))
    if (this.drops.length >= maxDrops) return
    const alive = this.aliveClouds()
    if (!alive.length) return
    // A third of the drops come from the column over Sunny.
    let col: number
    if (this.rng() < 0.34) {
      col = alive.reduce((best, c) => {
        const d = Math.abs(this.fx + c.col * CELL_W + CLOUD_W / 2 - this.px)
        const bd = Math.abs(this.fx + best.col * CELL_W + CLOUD_W / 2 - this.px)
        return d < bd ? c : best
      }).col
    } else {
      col = alive[Math.floor(this.rng() * alive.length)]!.col
    }
    const lowest = alive
      .filter((c) => c.col === col)
      .reduce((a, b) => (b.row > a.row ? b : a))
    this.drops.push({
      x: this.fx + col * CELL_W + CLOUD_W / 2,
      y: this.fy + lowest.row * CELL_H + CLOUD_H,
      speed: speedCap * (0.75 + this.rng() * 0.25),
    })
  }

  private playerHit() {
    this.lives--
    this.dead = DEATH_TICKS
    this.beam = null
    this.burst(this.px, PLAYER_Y, 18, '#facc15')
    this.burst(this.px, PLAYER_Y, 10, '#7c3aed')
    this.sound.play('die')
    if (this.lives > 0) {
      this.banner = { text: 'SUNNY GOT SOAKED', ticks: 90 }
    }
  }

  private updateKite() {
    if (this.kite) {
      this.kite.x += this.kite.dir * 1.2
      if (this.kite.x < -16 || this.kite.x > W + 16) this.kite = null
      return
    }
    if (--this.kiteTimer > 0) return
    this.kiteTimer = Math.round(levelCurve(this.level, GLOOM_CURVES.kiteEvery))
    // Like the classic saucer, the kite stays away once the wave is nearly done.
    if (this.aliveClouds().length < 8) return
    const dir = this.rng() < 0.5 ? 1 : -1
    this.kite = { x: dir === 1 ? -14 : W + 14, dir }
    this.sound.play('warn')
  }

  private clearWave() {
    this.cleared++
    this.waveClear = WAVE_CLEAR_TICKS
    this.drops = []
    this.beam = null
    this.kite = null
    this.addScore(100 * this.level, W / 2, 150)
    if (this.cleared <= 11) {
      // The new flower pops up in the garden.
      this.sparkles.burst(
        92 + (this.cleared - 1) * 12,
        GROUND_Y - 6,
        this.sparkRng,
        { count: 12, colours: RAINBOW },
      )
    }
    this.banner = {
      text: 'SKY CLEARED!',
      sub: 'THE GARDEN GETS RAIN',
      ticks: WAVE_CLEAR_TICKS,
    }
    this.sound.play('level')
  }

  // --- umbrellas ----------------------------------------------------------------

  private umbrellaCell(x: number, y: number): [Umbrella, number] | null {
    if (y < UMBRELLA_Y || y >= UMBRELLA_Y + UMB_ROWS * UMB_CELL) return null
    const r = Math.floor((y - UMBRELLA_Y) / UMB_CELL)
    for (const u of this.umbrellas) {
      const c = Math.floor((x - u.x) / UMB_CELL)
      if (c < 0 || c >= UMB_COLS) continue
      const index = r * UMB_COLS + c
      if (u.cells[index]) return [u, index]
    }
    return null
  }

  /** Knock a ragged hole in an umbrella around one cell. */
  private erode(u: Umbrella, index: number, radius: number) {
    const r0 = Math.floor(index / UMB_COLS)
    const c0 = index % UMB_COLS
    const reach = Math.ceil(radius)
    for (let dr = -reach; dr <= reach; dr++) {
      for (let dc = -reach; dc <= reach; dc++) {
        const r = r0 + dr
        const c = c0 + dc
        if (r < 0 || r >= UMB_ROWS || c < 0 || c >= UMB_COLS) continue
        if (dr * dr + dc * dc > radius * radius + this.rng() * 1.5) continue
        u.cells[r * UMB_COLS + c] = false
      }
    }
    this.burst(u.x + c0 * UMB_CELL, UMBRELLA_Y + r0 * UMB_CELL, 2, '#f9a8d4')
  }

  /** A cloud low enough to touch an umbrella soaks those cells away. */
  private soak(x: number, y: number) {
    for (const u of this.umbrellas) {
      for (let r = 0; r < UMB_ROWS; r++) {
        const cy = UMBRELLA_Y + r * UMB_CELL
        if (cy < y || cy > y + CLOUD_H) continue
        for (let c = 0; c < UMB_COLS; c++) {
          const cx = u.x + c * UMB_CELL
          if (cx >= x && cx <= x + CLOUD_W) u.cells[r * UMB_COLS + c] = false
        }
      }
    }
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x: number, y: number) {
    if (this.demo) return
    this.score += points
    this.floaters.push({ x, y, text: String(points), life: 40 })
    if (this.score >= this.nextExtra) {
      this.lives++
      this.nextExtra =
        this.nextExtra === FIRST_EXTRA
          ? EXTRA_EVERY
          : this.nextExtra + EXTRA_EVERY
      this.banner = { text: 'EXTRA SUNNY!', ticks: 90 }
      this.sparkles.burst(this.px, PLAYER_Y - 6, this.sparkRng, { count: 14 })
      this.sound.play('extra')
    }
  }

  private burst(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.4 + this.rng() * 1.6
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 18 + Math.floor(this.rng() * 14),
        color,
      })
    }
  }

  private updateEffects() {
    this.sparkles.update()
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      p.life--
    }
    this.particles = this.particles.filter((p) => p.life > 0)
    for (const f of this.floaters) {
      f.y -= 0.4
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
    for (const h of this.happies) {
      h.y -= 0.5
      h.life--
    }
    this.happies = this.happies.filter((h) => h.life > 0)
  }

  // --- attract-mode pilot -----------------------------------------------------

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
    // Dodge a gloom drop that is about to land on Sunny.
    const threat = this.drops.find(
      (d) =>
        Math.abs(d.x - this.px) < PLAYER_HALF + 6 &&
        d.y > PLAYER_Y - 110 &&
        d.y < PLAYER_Y,
    )
    if (threat) {
      const goLeft = threat.x >= this.px ? this.px > 30 : this.px > W - 30
      if (goLeft) held.left = true
      else held.right = true
      return frame
    }
    // Otherwise line up under the lowest column and shine.
    const alive = this.aliveClouds()
    if (!alive.length) return frame
    const target = alive.reduce((a, b) =>
      b.row > a.row || (b.row === a.row && this.rng() < 0.1) ? b : a,
    )
    const tx =
      this.fx + target.col * CELL_W + CLOUD_W / 2 + this.dir * STEP_X * 2
    if (tx < this.px - 3) held.left = true
    else if (tx > this.px + 3) held.right = true
    else held.a = true
    return frame
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    const sky = SKIES[Math.min(this.cleared, SKY_STAGES)]!
    this.renderSky(g, sky)
    this.renderGarden(g)
    this.renderUmbrellas(g)
    for (const cloud of this.clouds) {
      if (!cloud.alive) continue
      this.renderGloom(
        g,
        this.fx + cloud.col * CELL_W,
        this.fy + cloud.row * CELL_H,
        cloud.row,
      )
    }
    for (const h of this.happies) this.renderHappy(g, h)
    if (this.kite) this.renderKite(g, this.kite)
    for (const d of this.drops) {
      drawSprite(
        g,
        DROP_SPRITES[Math.floor(this.tick / 4) % 2]!,
        d.x - 3,
        d.y - 1,
        {
          anchor: 'topleft',
        },
      )
    }
    if (this.beam) this.renderBeam(g, this.beam.x, this.beam.y)
    if (this.dead === 0 && !this.over) this.renderSunny(g, this.px, PLAYER_Y)
    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, Math.min(1, p.life / 30))
      g.fillStyle = INK
      g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 3, 3)
      g.fillStyle = p.color
      g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 2, 2)
    }
    g.globalAlpha = 1
    this.sparkles.render(g)
    for (const f of this.floaters) {
      drawText(g, f.text, f.x, f.y, {
        align: 'center',
        color: RAMPS.gold[3],
        outline: INK,
      })
    }
    vignette(g, W, H, 0.28)
    this.renderHud(g)
  }

  private renderSky(g: CanvasRenderingContext2D, sky: (typeof SKIES)[number]) {
    // The banded sky, the horizon glow and (once a wave is cleared) the rising sun: one layer
    // per sky stage, painted once.
    const stage = Math.min(this.cleared, SKY_STAGES)
    cachedLayer(g, `gloom-invaders-sky-${stage}`, W, H, (k) => {
      bandedGradient(k, 0, 0, W, GROUND_Y, sky.bands, 6)
      glow(k, W / 2, GROUND_Y - 30, 170, RAMPS.pink[2], 0.12 + 0.18 * sky.t)
      if (stage > 0) {
        const sunY = GROUND_Y - 44 - sky.t * 96
        glow(k, W / 2 + 40, sunY, 60, RAMPS.gold[3], 0.5)
        shadedOrb(k, W / 2 + 40, sunY, 16, RAMPS.gold, { outline: null })
      }
    })
    // Stars fade as the sky brightens; the bright ones flare into crosses.
    const fade = 1 - sky.t * 0.85
    this.stars.forEach((s, i) => {
      const twinkle = Math.sin(this.tick / 25 + s.phase)
      g.globalAlpha = fade * (twinkle > -0.3 ? 1 : 0.5)
      g.fillStyle =
        twinkle > 0.6
          ? RAMPS.purple[4]
          : twinkle > -0.2
            ? RAMPS.purple[3]
            : RAMPS.purple[2]
      const x = Math.round(s.x)
      const y = Math.round(s.y)
      g.fillRect(x, y, 1, 1)
      if (i % 6 === 0 && twinkle > 0.75) {
        g.fillRect(x - 1, y, 3, 1)
        g.fillRect(x, y - 1, 1, 3)
      }
    })
    g.globalAlpha = 1
    // Haze clouds drift over the far hills; the hills themselves scroll at two speeds.
    g.save()
    g.globalAlpha = 0.3 + 0.4 * sky.t
    for (const c of HAZE_CLOUDS) {
      const x =
        ((((c.x + this.tick * c.speed) % (W + 60)) + W + 60) % (W + 60)) - 30
      drawCloud(g, x, c.y, c.size, sky.haze)
    }
    g.restore()
    drawRidge(g, FAR_HILLS, {
      base: GROUND_Y - 34,
      bottom: GROUND_Y,
      width: W,
      offset: this.tick * 0.06,
      fill: sky.far,
      rim: sky.farRim,
    })
    drawRidge(g, NEAR_HILLS, {
      base: GROUND_Y - 4,
      bottom: GROUND_Y,
      width: W,
      offset: this.tick * 0.15,
      fill: sky.near,
      rim: sky.nearRim,
    })
  }

  private renderGarden(g: CanvasRenderingContext2D) {
    cachedLayer(g, 'gloom-invaders-ground', W, H, (k) => {
      bandedGradient(
        k,
        0,
        GROUND_Y,
        W,
        H - GROUND_Y,
        [RAMPS.earth[2], RAMPS.earth[1], RAMPS.earth[0]],
        3,
      )
      k.fillStyle = INK
      k.fillRect(0, GROUND_Y - 1, W, 1)
      k.fillStyle = RAMPS.leaf[1]
      k.fillRect(0, GROUND_Y, W, 4)
      k.fillStyle = RAMPS.leaf[2]
      k.fillRect(0, GROUND_Y, W, 2)
      k.fillStyle = RAMPS.leaf[3]
      k.fillRect(0, GROUND_Y, W, 1)
      const rand = backdropRng(53)
      for (let x = 0; x < W; x += 3) {
        const tall = rand()
        k.fillStyle = RAMPS.leaf[2]
        if (tall > 0.45) k.fillRect(x, GROUND_Y - 2, 1, 2)
        k.fillStyle = RAMPS.leaf[3]
        if (tall > 0.8) k.fillRect(x + 1, GROUND_Y - 3, 1, 3)
        k.fillStyle = RAMPS.leaf[0]
        k.fillRect(x + 1, GROUND_Y + 4, 1, 1)
        k.fillStyle = rand() < 0.5 ? RAMPS.earth[3] : RAMPS.earth[0]
        k.fillRect(
          x + Math.floor(rand() * 3),
          GROUND_Y + 7 + Math.floor(rand() * 9),
          1,
          1,
        )
      }
    })
    // One flower for every wave cleared, up to a full row, nodding in the breeze.
    const flowers = Math.min(this.cleared, 11)
    for (let i = 0; i < flowers; i++) {
      const x = 92 + i * 12
      const sway = Math.floor(this.tick / 32 + i * 0.7) % 2
      const sprite = FLOWER_SPRITES[i % FLOWER_SPRITES.length]![sway]!
      dropShadow(g, x, GROUND_Y + 1, 4, 1, 0.35)
      drawSprite(g, sprite, x - 4, GROUND_Y + 1 - sprite.height, {
        anchor: 'topleft',
      })
    }
  }

  private renderUmbrellas(g: CanvasRenderingContext2D) {
    const w = UMB_COLS * UMB_CELL + 2
    const h = UMB_ROWS * UMB_CELL + 2
    for (const u of this.umbrellas) {
      // Cells only ever wear away, so the count of what's left names the bake.
      const left = u.cells.reduce((n, on) => n + (on ? 1 : 0), 0)
      let art = this.umbrellaArt.get(u)
      if (!art || art.left !== left) {
        art = {
          left,
          canvas: bakeCanvas(w, h, (k) => paintUmbrella(k, u.cells, 1, 1)),
        }
        this.umbrellaArt.set(u, art)
      }
      if (art.canvas) {
        g.save()
        g.imageSmoothingEnabled = false
        g.drawImage(art.canvas, u.x - 1, UMBRELLA_Y - 1)
        g.restore()
      } else {
        paintUmbrella(g, u.cells, u.x, UMBRELLA_Y)
      }
    }
  }

  private renderGloom(
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    row: number,
  ) {
    const kind = row === 0 ? 0 : row < 3 ? 1 : 2
    const sprite = GLOOM_SPRITES[kind]![this.frame]!
    drawSprite(g, sprite, x - 1, y - 1, { anchor: 'topleft' })
    // The storm cloud's lightning lights up the sky on alternate steps.
    if (kind === 0 && this.frame) glow(g, x + 9, y + 14, 8, RAMPS.gold[3], 0.55)
  }

  private renderHappy(g: CanvasRenderingContext2D, h: Happy) {
    const alpha = Math.min(1, h.life / 30)
    glow(g, h.x + 9, h.y + 6, 14, RAMPS.gold[3], 0.25 * alpha)
    drawSprite(g, HAPPY_SPRITE, h.x - 1, h.y - 1, { anchor: 'topleft', alpha })
    // Gentle rain for the garden.
    g.globalAlpha = alpha
    for (let i = 0; i < 3; i++) {
      const fall = (60 - h.life + i * 7) % 14
      const rx = Math.round(h.x) + 4 + i * 5
      const ry = Math.round(h.y) + 13 + fall
      g.fillStyle = RAMPS.water[2]
      g.fillRect(rx, ry, 1, 3)
      g.fillStyle = RAMPS.water[4]
      g.fillRect(rx, ry + 2, 1, 1)
    }
    g.globalAlpha = 1
  }

  private renderKite(g: CanvasRenderingContext2D, kite: Kite) {
    const x = Math.round(kite.x)
    const y = KITE_Y
    glow(g, x, y, 22, RAMPS.pink[3], 0.35 + 0.1 * Math.sin(this.tick / 6))
    // The tail string waves behind, tied with bows.
    const tail = (j: number) => ({
      x: Math.round(x - kite.dir * j * 1.5),
      y: Math.round(y + 7 + j * 0.4 + Math.sin(this.tick / 5 + j / 2) * 2),
    })
    for (let j = 0; j <= 12; j++) {
      const p = tail(j)
      g.fillStyle = INK
      g.fillRect(p.x, p.y, 1, 2)
      g.fillStyle = RAMPS.cream[3]
      g.fillRect(p.x, p.y, 1, 1)
    }
    for (let j = 4; j <= 12; j += 4) {
      const p = tail(j)
      drawSprite(g, BOW_SPRITES[(j / 4) % 2]!, p.x, p.y)
    }
    drawSprite(g, KITE_SPRITE, x, y)
  }

  private renderBeam(g: CanvasRenderingContext2D, x: number, y: number) {
    glow(g, x, y + 4, 12, RAMPS.gold[3], 0.6)
    // A fading trail, then the bright core with a white-hot tip.
    for (let i = 0; i < 4; i++) {
      g.fillStyle = rgba(RAMPS.gold[3], 0.5 - i * 0.12)
      g.fillRect(x - 1, y + 9 + i * 3, 2, 3)
    }
    g.fillStyle = rgba(RAMPS.gold[2], 0.6)
    g.fillRect(x - 2, y - 1, 4, 10)
    g.fillStyle = RAMPS.gold[4]
    g.fillRect(x - 1, y, 2, 8)
    g.fillStyle = '#ffffff'
    g.fillRect(x - 1, y, 2, 3)
  }

  private renderSunny(g: CanvasRenderingContext2D, x: number, y: number) {
    dropShadow(g, x, y + 10, 9, 2, 0.4)
    // Treads roll as Sunny drives.
    const tread = Math.floor(x / 3) % 2
    drawSprite(g, SUNNY_SPRITES[tread]!, x - 9, y - 4, { anchor: 'topleft' })
    // The sun dish on top, glowing, with its rays turning.
    glow(g, x, y - 7, 16, RAMPS.gold[3], 0.45 + 0.1 * Math.sin(this.tick / 8))
    shadedOrb(g, x, y - 7, 4, RAMPS.gold)
    for (let i = 0; i < 6; i++) {
      const a = this.tick / 20 + (i * Math.PI) / 3
      const rx = Math.round(x + Math.cos(a) * 8)
      const ry = Math.round(y - 7 + Math.sin(a) * 8)
      g.fillStyle = RAMPS.gold[3]
      g.fillRect(rx - 1, ry, 3, 1)
      g.fillRect(rx, ry - 1, 1, 3)
      g.fillStyle = '#ffffff'
      g.fillRect(rx, ry, 1, 1)
    }
  }

  private renderHud(g: CanvasRenderingContext2D) {
    // Score and high score in boxes along the top, clear of the kite's lane.
    hudPanel(g, 4, 3, 80, 19)
    drawText(g, String(this.score).padStart(6, '0'), 9, 6, {
      scale: 2,
      color: RAMPS.gold[3],
      shadow: INK,
    })
    const hi = `HI ${Math.max(this.hiScore, this.score)}`
    const hiW = measureText(hi) + 12
    hudPanel(g, W - 4 - hiW, 3, hiW, 13)
    drawText(g, hi, W - 10, 6, {
      align: 'right',
      color: RAMPS.pink[3],
      outline: INK,
    })
    // Spare Sunnies wait in a box in the soil.
    const spares = Math.min(this.lives - 1, 5)
    if (spares > 0) {
      hudPanel(g, 4, GROUND_Y + 4, spares * 12 + 6, 12, RAMPS.teal)
      for (let i = 0; i < spares; i++) {
        drawSprite(g, LIFE_SPRITE, 8 + i * 12, GROUND_Y + 6, {
          anchor: 'topleft',
        })
      }
    }
    const wave = `WAVE ${this.level}`
    const waveW = measureText(wave) + 12
    hudPanel(g, W - 4 - waveW, GROUND_Y + 4, waveW, 12, RAMPS.leaf)
    drawText(g, wave, W - 10, GROUND_Y + 7, {
      align: 'right',
      color: RAMPS.leaf[4],
      outline: INK,
    })
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, 170, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.purple[1],
      })
      if (this.banner.sub) {
        drawText(g, this.banner.sub, W / 2, 190, {
          align: 'center',
          color: RAMPS.gold[3],
          outline: INK,
        })
      }
    }
  }
}

const gloomInvaders: ArcadeGameModule = {
  create: (options) => new GloomInvaders(options),
}

export const create = gloomInvaders.create
export default gloomInvaders
