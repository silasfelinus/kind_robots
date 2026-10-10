// /utils/arcade/games/pipePals.ts
//
// Pipe Pals -- the Kind Robots Arcade's single-screen platform riff (conductor
// kr-arcade/t-009 game factory). The teal cat-eared android from the logo
// keeps a plumbing system tidy: grumpy critters crawl out of the top pipes,
// and bumping the platform under one from below flips it over; touch a
// flipped critter to kick it out of the pipes for good. Crab bots need two
// bumps. The KIND block flips everything that is standing on a floor. Left
// and right edges wrap around. A jumps.

import { everyNthLevel, levelCurve } from '../curve'
import { drawText, measureText } from '../font'
import {
  INK,
  RAMPS,
  Sparkles,
  backdropRng,
  bandedGradient,
  bevel,
  cachedLayer,
  drawCloud,
  drawSprite,
  drawStars,
  dropShadow,
  gauge,
  glow,
  hudPanel,
  mix,
  pixelSprite,
  rgba,
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

const W = 448
const H = 336

const GRAVITY = 0.35
const JUMP_SPEED = -7.2
const RUN_ACCEL = 0.28
const RUN_MAX = 2.1
const RUN_FRICTION = 0.78
const PLAYER_W = 12
const PLAYER_H = 16
const CRITTER_W = 14
const CRITTER_H = 12
const START_LIVES = 3
const EXTRA_LIFE_AT = 20_000
const BUMP_TICKS = 12
const BUMP_REACH = 20

type Segment = { x0: number; x1: number; y: number }

/** Floor tops (y) and their solid spans. Platforms are 8 px thick. */
export const PIPE_LEVELS: Segment[] = [
  { x0: 0, x1: W, y: 310 },
  { x0: 0, x1: 170, y: 244 },
  { x0: 278, x1: W, y: 244 },
  { x0: 0, x1: 92, y: 178 },
  { x0: 138, x1: 310, y: 178 },
  { x0: 356, x1: W, y: 178 },
  { x0: 0, x1: 176, y: 112 },
  { x0: 272, x1: W, y: 112 },
]
const THICK = 8
const KIND_BLOCK = { x: W / 2 - 12, y: 262, w: 24, h: 16 }
const TOP_PIPES = [
  { x: 18, y: 88, dir: 1 },
  { x: W - 18, y: 88, dir: -1 },
]

export const PIPE_CURVES = {
  critters: { start: 3, step: 1, limit: 9 },
  crawlerSpeed: { start: 0.6, step: 0.07, limit: 1.4 },
  crabEvery: { start: 0, step: 0.34, limit: 3 },
  recoverTicks: { start: 600, step: -40, limit: 240 },
  releaseEvery: { start: 150, step: -10, limit: 60 },
} as const

type Kind = 'crawler' | 'crab'
type Critter = {
  kind: Kind
  x: number
  y: number
  vx: number
  vy: number
  dir: number
  onGround: boolean
  flipped: number
  angry: boolean
  rage: number
  kicked: boolean
  hits: number
}
type Coin = { x: number; y: number; vx: number; vy: number; life: number }
type Spark = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = { x: number; y: number; text: string; life: number }

function wrapX(x: number) {
  if (x < -8) return x + W + 16
  if (x > W + 8) return x - W - 16
  return x
}

function segmentUnder(
  x: number,
  w: number,
  footY: number,
  tolerance: number,
): Segment | null {
  for (const s of PIPE_LEVELS) {
    if (
      Math.abs(footY - s.y) <= tolerance &&
      x + w / 2 > s.x0 &&
      x - w / 2 < s.x1
    )
      return s
  }
  return null
}

// --- 16-bit art (utils/arcade/snes.ts) -------------------------------------------

/** The bonus round's full length, for the HUD timer gauge (startPhase sets it). */
const BONUS_FULL = 60 * 20
/** Where the city stands: the bottom floor's underside. */
const GROUND_Y = 310 + THICK
const MOON = { x: 372, y: 50, r: 12 }

const SKY_STOPS = [
  RAMPS.night[0],
  RAMPS.night[1],
  RAMPS.night[2],
  mix(RAMPS.night[3], RAMPS.purple[1], 0.5),
  mix(RAMPS.purple[1], RAMPS.pink[1], 0.55),
]
const CITY_FAR = mix(RAMPS.night[2], RAMPS.purple[1], 0.45)
const CITY_FAR_RIM = mix(CITY_FAR, RAMPS.purple[3], 0.35)
const CITY_NEAR = mix(RAMPS.night[1], RAMPS.night[0], 0.4)
const CITY_NEAR_RIM = mix(CITY_NEAR, RAMPS.purple[2], 0.35)
/** The back plumbing: steel sunk into the dusk, so it reads as scenery, not as floor. */
const PIPE_DARK = RAMPS.steel.map((c) =>
  mix(c, RAMPS.night[1], 0.72),
) as unknown as Ramp
const DUSK_CLOUD: Ramp = [
  RAMPS.night[0],
  RAMPS.night[2],
  RAMPS.night[3],
  mix(RAMPS.purple[1], RAMPS.pink[1], 0.4),
  mix(RAMPS.purple[2], RAMPS.pink[2], 0.3),
]
const CLOUDS = [
  { x: 40, y: 40, size: 11, speed: 0.05 },
  { x: 300, y: 74, size: 8, speed: 0.08 },
]
const STARS = starField(17, 64, W, 190).filter(
  (s) => Math.hypot(s.x - MOON.x, s.y - MOON.y) > MOON.r + 6,
)

/** Which ramp step a line across a round pipe takes: lit high on the curve, shadowed below. */
function pipeShade(f: number): 0 | 1 | 2 | 3 | 4 {
  if (f < 0.1) return 1
  if (f < 0.22) return 3
  if (f < 0.36) return 4
  if (f < 0.5) return 3
  if (f < 0.78) return 2
  if (f < 0.92) return 1
  return 0
}

/**
 * A straight pipe run shaded across its girth: a horizontal run ('rows') shades top to bottom,
 * a vertical one ('cols') left to right, with an ink outline unless `outline` is null.
 */
function pipeRun(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  ramp: Ramp,
  across: 'rows' | 'cols',
  outline: string | null = INK,
) {
  if (outline) {
    g.fillStyle = outline
    g.fillRect(x - 1, y - 1, w + 2, h + 2)
  }
  const n = across === 'rows' ? h : w
  for (let i = 0; i < n; i++) {
    g.fillStyle = ramp[pipeShade((i + 0.5) / n)]
    if (across === 'rows') g.fillRect(x, y + i, w, 1)
    else g.fillRect(x + i, y, 1, h)
  }
}

/** A side pipe sticking out of the wall: a shaded run, a chrome clamp and a lipped mouth. */
function wallPipe(
  g: CanvasRenderingContext2D,
  mouthX: number,
  mouthTop: number,
  mouthH: number,
  bodyH: number,
  facing: 1 | -1,
) {
  const lipW = 10
  const bodyTop = mouthTop + Math.round((mouthH - bodyH) / 2)
  const lipX = facing > 0 ? mouthX - lipW : mouthX
  const bodyX = facing > 0 ? 0 : mouthX + lipW - 2
  const bodyW = facing > 0 ? mouthX - lipW + 2 : W - bodyX
  pipeRun(g, bodyX, bodyTop, bodyW, bodyH, RAMPS.leaf, 'rows')
  // A chrome clamp bolted round the run.
  const clampX = facing > 0 ? 5 : W - 9
  pipeRun(g, clampX, bodyTop - 2, 4, bodyH + 4, RAMPS.steel, 'rows')
  g.fillStyle = RAMPS.steel[4]
  g.fillRect(clampX + 1, bodyTop, 1, 1)
  g.fillRect(clampX + 1, bodyTop + bodyH - 2, 1, 1)
  // The lip, its lit face toward the room and the dark throat inside.
  pipeRun(g, lipX, mouthTop, lipW, mouthH, RAMPS.leaf, 'rows')
  const face = facing > 0 ? lipX + lipW - 1 : lipX
  g.fillStyle = INK
  g.fillRect(face - (facing > 0 ? 3 : -1), mouthTop + 3, 3, mouthH - 6)
  g.fillStyle = RAMPS.leaf[0]
  g.fillRect(face - (facing > 0 ? 4 : -4), mouthTop + 3, 1, mouthH - 6)
  g.fillStyle = RAMPS.leaf[4]
  g.fillRect(facing > 0 ? lipX : lipX + lipW - 1, mouthTop + 2, 1, mouthH - 5)
}

const BRICK_ROWS = [
  'HHHHHHHH',
  'LBBBBBBD',
  'BBBBBBSD',
  'SSSSSSSD',
  'BBDLBBBB',
  'BBDBBBBB',
  'SSDSSSSS',
  'DDDDDDDD',
]
function brickTile(ramp: Ramp): PixelSprite {
  return pixelSprite(
    BRICK_ROWS,
    { D: ramp[0], S: ramp[1], B: ramp[2], L: ramp[3], H: ramp[4] },
    { outline: null },
  )
}
const LEDGE_TILE = brickTile(RAMPS.teal)
const GROUND_TILE = brickTile(RAMPS.purple)

// The two pals from the Kind Robots logo: the teal cat-eared android (the player) and the
// pink-haired android girl (she keeps the spare lives in the HUD).
const TEAL_PALETTE = {
  h: RAMPS.teal[4],
  L: RAMPS.teal[3],
  T: RAMPS.teal[2],
  t: RAMPS.teal[1],
  d: RAMPS.teal[0],
  y: RAMPS.gold[3],
  Y: RAMPS.gold[2],
  g: RAMPS.gold[4],
  p: RAMPS.pink[3],
  k: INK,
  w: '#ffffff',
}
const TEAL_HEAD = [
  '..h......h..',
  '.hL.....hLt.',
  '.hLTTTTTTLt.',
  '.LhhLLLLLLt.',
  'yhLLLLLLLLTy',
  'YLLLwkLLLwkY',
  'YLLLkkLLLkkY',
  '.TLLLLLppLt.',
  '..tTTTTTTt..',
]
const TEAL_BODY = [
  '...dTTTTd...',
  '..hLLLLLLTt.',
  '.hLLgLLLLTTt',
  '.TLLLLLLLTtt',
  '.tTTTTTTTTtd',
  '..dttttttd..',
]
const pal = (legs: string[]) =>
  pixelSprite([...TEAL_HEAD, ...TEAL_BODY, ...legs], TEAL_PALETTE)
const PLAYER_SPRITES = {
  stand: pal(['...TL..TL...', '...Tt..Tt...', '...TTt..TTt.']),
  run: [
    pal(['..TL....TL..', '.TL......Tt.', 'Tt........TT']),
    pal(['....TLT.....', '....Tt.Tt...', '...TTt..t...']),
  ],
  jump: pal(['...TL.TL....', '..TL...Tt...', '..T.....TTt.']),
} as const
const TEAL_FACE = pixelSprite(TEAL_HEAD, TEAL_PALETTE)
const PINK_FACE = pixelSprite(
  [
    '...pPPPPp...',
    '..pHhhPPPp..',
    '.pHhPPPPPPp.',
    '.PHPPPPPPPPp',
    'PPccccccPPPp',
    'PPcwkccwkcPp',
    'PpckkcckkcPp',
    'pPcqcccqcCPd',
    'pd.CCCCCC.dp',
    'd..........d',
  ],
  {
    h: RAMPS.pink[4],
    H: RAMPS.pink[3],
    P: RAMPS.pink[2],
    p: RAMPS.pink[1],
    d: RAMPS.pink[0],
    c: RAMPS.cream[3],
    C: RAMPS.cream[2],
    q: RAMPS.pink[3],
    k: INK,
    w: '#ffffff',
  },
)

// Grumpy critters: a shell crawler and a clawed crab bot, two walk frames each, recoloured for
// rage and for the white flash before a flipped critter rights itself.
const FLASH: Ramp = ['#6b7a99', '#b4c0d8', '#e6eef8', '#ffffff', '#ffffff']
const CRAWLER_BODY = [
  '....HHLLL.......',
  '..HHLLLLLLB.....',
  '.HLLSLLLSLLB.kk.',
  '.LLSSSLSSSLBcccc',
  'HLLLSLLLSLLBcwkc',
  'LLLLLLLLLLBBcccC',
  'SBBBBBBBBBBS.CC.',
  '.DSSSSSSSSD.....',
]
const CRAWLER_LEGS = ['.CC..CC..CC.....', '..CC..CC..CC....'] as const
const CRAB_BODY = [
  '.HH..........HH.',
  'HLLH..w..w..HLLS',
  'LLLS..k..k..SLLS',
  '.LS...B..B...SS.',
  '..S.HHLLLLLL.S..',
  '...HLLLLLLLLB...',
  '..HLLSLLLLSLLB..',
  '..LLLLLLLLLLBB..',
  '..SBBBBBBBBBBS..',
  '...DDSSSSSSDD...',
]
const CRAB_LEGS = ['..S.S.S..S.S.S..', '.S.S.S....S.S.S.'] as const
function critterFrames(
  body: readonly string[],
  legs: readonly [string, string],
  ramp: Ramp,
): readonly [PixelSprite, PixelSprite] {
  const palette = {
    D: ramp[0],
    S: ramp[1],
    B: ramp[2],
    L: ramp[3],
    H: ramp[4],
    c: RAMPS.cream[3],
    C: RAMPS.cream[2],
    k: INK,
    w: '#ffffff',
  }
  return [
    pixelSprite([...body, legs[0]], palette),
    pixelSprite([...body, legs[1]], palette),
  ]
}
const CRAWLER_SPRITES = {
  calm: critterFrames(CRAWLER_BODY, CRAWLER_LEGS, RAMPS.leaf),
  rage: critterFrames(CRAWLER_BODY, CRAWLER_LEGS, RAMPS.pink),
  flash: critterFrames(CRAWLER_BODY, CRAWLER_LEGS, FLASH),
}
const CRAB_SPRITES = {
  calm: critterFrames(CRAB_BODY, CRAB_LEGS, RAMPS.rust),
  angry: critterFrames(CRAB_BODY, CRAB_LEGS, RAMPS.ember),
  flash: critterFrames(CRAB_BODY, CRAB_LEGS, FLASH),
}

const COIN_PALETTE = {
  w: '#ffffff',
  h: RAMPS.gold[4],
  Y: RAMPS.gold[3],
  g: RAMPS.gold[2],
  d: RAMPS.gold[1],
}
/** A spinning coin: face, three-quarter, edge (the three-quarter frame mirrors on the way back). */
const COIN_SPRITES = [
  pixelSprite(
    [
      '..hYYg..',
      '.hYYYYg.',
      'hYYwYYYg',
      'hYYwYYgd',
      'hYYwYYgd',
      'hYYwYYgd',
      'hYYwYYgd',
      '.hYYYgd.',
      '..ggdd..',
    ],
    COIN_PALETTE,
  ),
  pixelSprite(
    [
      '.hYg.',
      'hYwYg',
      'hYwgd',
      'hYwgd',
      'hYwgd',
      'hYwgd',
      'hYwgd',
      'hYYgd',
      '.ggd.',
    ],
    COIN_PALETTE,
  ),
  pixelSprite(
    ['hd', 'Yd', 'Yd', 'Yd', 'Yd', 'Yd', 'Yd', 'Yd', 'gd'],
    COIN_PALETTE,
  ),
] as const

/** The far city: two rows of towers with lit windows, then the dark plumbing in front. */
function paintCity(k: CanvasRenderingContext2D) {
  const rand = backdropRng(41)
  const towers = (
    tall: number,
    least: number,
    widest: number,
    fill: string,
    rim: string,
    windows: (x: number, w: number, top: number) => void,
  ) => {
    for (let x = -6; x < W;) {
      const w = 12 + Math.floor(rand() * (widest - 12))
      const h = least + Math.floor(rand() * (tall - least))
      const top = GROUND_Y - h
      k.fillStyle = fill
      k.fillRect(x, top, w, h)
      k.fillStyle = rim
      k.fillRect(x, top, w, 1)
      k.fillRect(x, top, 1, h)
      if (rand() < 0.35) {
        k.fillRect(x + Math.floor(w / 2), top - 6, 1, 6)
      }
      windows(x, w, top)
      x += w + 1 + Math.floor(rand() * 5)
    }
  }
  towers(130, 56, 30, CITY_FAR, CITY_FAR_RIM, (x, w, top) => {
    k.fillStyle = rgba(RAMPS.gold[3], 0.32)
    for (let wy = top + 4; wy < GROUND_Y - 4; wy += 5)
      for (let wx = x + 2; wx < x + w - 2; wx += 3)
        if (rand() < 0.28) k.fillRect(wx, wy, 1, 2)
  })
  const neon = [RAMPS.gold[2], RAMPS.teal[3], RAMPS.pink[3]] as const
  towers(66, 24, 44, CITY_NEAR, CITY_NEAR_RIM, (x, w, top) => {
    for (let wy = top + 5; wy < GROUND_Y - 6; wy += 7)
      for (let wx = x + 3; wx < x + w - 4; wx += 6)
        if (rand() < 0.22) {
          k.fillStyle = neon[Math.floor(rand() * neon.length)]!
          k.fillRect(wx, wy, 2, 2)
        }
  })
  // Back plumbing: risers and a header pipe with a valve wheel, sunk into the dusk.
  for (const x of [92, 346]) {
    pipeRun(k, x, 128, 10, GROUND_Y - 128, PIPE_DARK, 'cols')
    pipeRun(k, x - 2, 124, 14, 6, PIPE_DARK, 'cols')
  }
  pipeRun(k, 102, 198, 244, 9, PIPE_DARK, 'rows')
  pipeRun(k, W / 2 - 5, 207, 10, GROUND_Y - 207, PIPE_DARK, 'cols')
  for (const x of [92, 219, 346]) bevel(k, x - 2, 195, 14, 15, PIPE_DARK)
  shadedOrb(k, 160, 202, 7, PIPE_DARK)
  k.fillStyle = PIPE_DARK[0]
  k.fillRect(153, 201, 15, 2)
  k.fillRect(159, 195, 2, 15)
  // The ground under the bottom floor.
  bandedGradient(
    k,
    0,
    GROUND_Y,
    W,
    H - GROUND_Y,
    [RAMPS.night[2], RAMPS.night[1], RAMPS.night[0]],
    3,
  )
}

/** One floor segment's bricks, clipped to its solid span. */
function brickRun(
  g: CanvasRenderingContext2D,
  s: Segment,
  from: number,
  to: number,
  lift: number,
) {
  const tile = s.y === 310 ? GROUND_TILE : LEDGE_TILE
  g.save()
  g.beginPath()
  g.rect(s.x0, s.y - lift - 1, s.x1 - s.x0, THICK + 2)
  g.clip()
  for (let x = from; x < to; x += 8)
    drawSprite(g, tile, x, s.y - lift, { anchor: 'topleft' })
  g.restore()
}

class PipePals implements ArcadeGameInstance {
  score = 0
  level = 0
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private player = {
    x: W / 2,
    y: 310,
    vx: 0,
    vy: 0,
    onGround: true,
    face: 1,
    run: 0,
  }
  private alive = true
  private respawn = 0
  private invuln = 0
  private critters: Critter[] = []
  private queue: Kind[] = []
  private releaseTimer = 0
  private bump: { x: number; y: number; ticks: number } | null = null
  private kindBlockUses = 3
  private kindShake = 0
  private coins: Coin[] = []
  private bonusRound = 0
  private sparks: Spark[] = []
  private floaters: Floater[] = []
  private phaseDelay = 0
  private overTimer = 0
  private pilotClimb: { dir: number; targetY: number } | null = null
  private nextExtra = EXTRA_LIFE_AT
  private banner: { text: string; sub?: string; ticks: number } | null = null
  // Cosmetic sparkles roll their own dice, so the game's seeded rng is untouched.
  private fx = new Sparkles()
  private fxRng = backdropRng(53)

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.startPhase(1)
  }

  // --- setup ----------------------------------------------------------------

  private startPhase(phase: number) {
    this.level = phase
    this.critters = []
    this.coins = []
    this.bump = null
    Object.assign(this.player, {
      x: W / 2,
      y: 310,
      vx: 0,
      vy: 0,
      onGround: true,
    })
    if (phase > 1 && everyNthLevel(phase - 1, 4)) {
      // Bonus round: grab the coins before the timer runs out.
      this.bonusRound = 60 * 20
      for (const s of PIPE_LEVELS.slice(1)) {
        for (let x = s.x0 + 20; x < s.x1 - 10; x += 44) {
          this.coins.push({ x, y: s.y - 10, vx: 0, vy: 0, life: Infinity })
        }
      }
      this.banner = { text: 'BONUS ROUND', sub: 'GRAB EVERY COIN', ticks: 120 }
      this.queue = []
      return
    }
    this.bonusRound = 0
    const total = Math.round(levelCurve(phase, PIPE_CURVES.critters))
    const crabs = Math.floor(levelCurve(phase, PIPE_CURVES.crabEvery))
    this.queue = Array.from({ length: total }, (_, i) =>
      i < crabs ? 'crab' : 'crawler',
    )
    // Shuffle so crabs are mixed in.
    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1))
      ;[this.queue[i], this.queue[j]] = [this.queue[j]!, this.queue[i]!]
    }
    this.releaseTimer = 60
    this.invuln = 90
    this.banner = { text: `PHASE ${phase}`, ticks: 100 }
  }

  private release() {
    const kind = this.queue.shift()
    if (!kind) return
    const pipe = TOP_PIPES[this.critters.length % 2]!
    this.critters.push({
      kind,
      x: pipe.x,
      y: pipe.y,
      vx: 0,
      vy: 0,
      dir: pipe.dir,
      onGround: false,
      flipped: 0,
      angry: false,
      rage: 0,
      kicked: false,
      hits: 0,
    })
    this.sound.play('warn')
  }

  // --- update -------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.kindShake > 0) this.kindShake--
    if (this.bump && --this.bump.ticks <= 0) this.bump = null
    if (this.over) return
    if (this.lives <= 0 && !this.alive) {
      if (++this.overTimer > 100) this.over = true
      return
    }
    if (this.phaseDelay > 0) {
      if (--this.phaseDelay === 0) this.startPhase(this.level + 1)
      return
    }
    if (!this.alive) {
      if (--this.respawn <= 0) this.revive()
      return
    }

    const controls = this.demo ? this.demoInput() : input
    this.movePlayer(controls)
    if (this.bonusRound > 0) {
      this.updateBonus()
      return
    }
    if (this.queue.length && --this.releaseTimer <= 0) {
      this.release()
      this.releaseTimer = Math.round(
        levelCurve(this.level, PIPE_CURVES.releaseEvery),
      )
    }
    this.moveCritters()
    this.moveCoins()
    this.collide()
    if (!this.queue.length && this.critters.every((c) => c.kicked)) {
      this.critters = []
      this.phaseDelay = 120
      this.sound.play('level')
      this.banner = { text: 'PIPES CLEAR!', ticks: 110 }
      this.fx.burst(W / 2, 150, this.fxRng, { count: 20, speed: 2.4 })
    }
  }

  private movePlayer(input: InputFrame) {
    const p = this.player
    if (input.held.left) {
      p.vx -= RUN_ACCEL
      p.face = -1
    } else if (input.held.right) {
      p.vx += RUN_ACCEL
      p.face = 1
    } else {
      p.vx *= RUN_FRICTION
    }
    p.vx = Math.max(-RUN_MAX, Math.min(RUN_MAX, p.vx))
    if ((input.pressed.a || input.pressed.up) && p.onGround) {
      p.vy = JUMP_SPEED
      p.onGround = false
      this.sound.play('blip')
    }
    p.vy += GRAVITY
    const headBefore = p.y - PLAYER_H
    p.x = wrapX(p.x + p.vx)
    p.y += p.vy
    // Head bumps from below.
    if (p.vy < 0) {
      const head = p.y - PLAYER_H
      for (const s of PIPE_LEVELS.slice(1)) {
        const underside = s.y + THICK
        if (
          headBefore >= underside &&
          head < underside &&
          p.x > s.x0 &&
          p.x < s.x1
        ) {
          p.y = underside + PLAYER_H
          p.vy = 1
          this.bumpAt(p.x, s.y)
          break
        }
      }
      const kb = KIND_BLOCK
      const under = kb.y + kb.h
      if (
        this.kindBlockUses > 0 &&
        headBefore >= under &&
        head < under &&
        p.x > kb.x - 4 &&
        p.x < kb.x + kb.w + 4
      ) {
        p.y = under + PLAYER_H
        p.vy = 1
        this.kindBlock()
      }
    }
    // Land on floors.
    p.onGround = false
    if (p.vy >= 0) {
      const s = segmentUnder(p.x, PLAYER_W, p.y, Math.max(4, p.vy + 1))
      if (s && p.y - p.vy <= s.y + 1) {
        p.y = s.y
        p.vy = 0
        p.onGround = true
      }
    }
    if (p.y > H + 20) Object.assign(p, { y: 310, vy: 0 })
    p.run += Math.abs(p.vx) * 0.25
    if (this.invuln > 0) this.invuln--
  }

  private bumpAt(x: number, floorY: number) {
    this.bump = { x, y: floorY, ticks: BUMP_TICKS }
    this.sound.play('pop')
    this.fx.burst(x, floorY + THICK, this.fxRng, {
      count: 4,
      speed: 0.9,
      colours: [RAMPS.teal[4], RAMPS.steel[4]],
    })
    for (const c of this.critters) {
      if (c.kicked || !c.onGround) continue
      if (Math.abs(c.y - floorY) > 2 || Math.abs(c.x - x) > BUMP_REACH) continue
      this.hitCritter(c)
    }
    // Bumping a coin from below collects it.
    for (const coin of this.coins) {
      if (
        Math.abs(coin.y - (floorY - 10)) < 8 &&
        Math.abs(coin.x - x) < BUMP_REACH
      ) {
        coin.life = 0
        this.addScore(800, coin.x, coin.y)
        this.sound.play('pickup')
        this.fx.burst(coin.x, coin.y, this.fxRng, {
          count: 8,
          colours: [RAMPS.gold[4], RAMPS.gold[3], '#ffffff'],
        })
      }
    }
  }

  private hitCritter(c: Critter) {
    if (c.flipped > 0) {
      // Bumping a flipped critter rights it again.
      c.flipped = 0
      c.vy = -2.5
      return
    }
    c.hits++
    if (c.kind === 'crab' && c.hits === 1) {
      c.angry = true
      c.vy = -2.5
      this.addScore(10, c.x, c.y - 14)
      return
    }
    c.flipped = Math.round(levelCurve(this.level, PIPE_CURVES.recoverTicks))
    c.vy = -3
    c.vx = 0
    this.addScore(10, c.x, c.y - 14)
  }

  private kindBlock() {
    this.kindBlockUses--
    this.kindShake = 24
    this.sound.play('boom')
    this.fx.burst(
      KIND_BLOCK.x + KIND_BLOCK.w / 2,
      KIND_BLOCK.y + KIND_BLOCK.h / 2,
      this.fxRng,
      {
        count: 16,
        speed: 2.2,
        colours: [RAMPS.pink[3], RAMPS.pink[4], RAMPS.gold[4]],
      },
    )
    for (const c of this.critters) {
      if (!c.kicked && c.onGround) this.hitCritter(c)
    }
  }

  private moveCritters() {
    const base = levelCurve(this.level, PIPE_CURVES.crawlerSpeed)
    for (const c of this.critters) {
      if (c.kicked) {
        c.vy += GRAVITY
        c.y += c.vy
        c.x += c.vx
        continue
      }
      if (c.flipped > 0) {
        c.flipped--
        if (c.flipped === 0) {
          // Recovers madder and faster.
          c.rage++
          c.angry = true
          c.hits = c.kind === 'crab' ? 1 : 0
          c.vy = -2
          this.sound.play('warn')
        }
      }
      const speed =
        c.flipped > 0
          ? 0
          : base * (1 + c.rage * 0.3) * (c.kind === 'crab' && c.angry ? 1.4 : 1)
      c.vx = c.dir * speed
      c.vy += GRAVITY
      c.x += c.vx
      c.y += c.vy
      c.onGround = false
      if (c.vy >= 0) {
        const s = segmentUnder(c.x, CRITTER_W, c.y, Math.max(4, c.vy + 1))
        if (s && c.y - c.vy <= s.y + 1) {
          c.y = s.y
          c.vy = 0
          c.onGround = true
        }
      }
      // On the bottom floor, critters leave through the bottom pipes and
      // come back out of the top ones.
      if (c.y >= 309 && (c.x < 6 || c.x > W - 6)) {
        const pipe = c.x < 6 ? TOP_PIPES[1]! : TOP_PIPES[0]!
        Object.assign(c, { x: pipe.x, y: pipe.y, vy: 0, dir: pipe.dir })
        continue
      }
      c.x = wrapX(c.x)
    }
    this.critters = this.critters.filter((c) => !(c.kicked && c.y > H + 30))
  }

  private moveCoins() {
    for (const coin of this.coins) {
      if (coin.life !== Infinity) coin.life--
      coin.vy += GRAVITY * 0.5
      coin.x = wrapX(coin.x + coin.vx)
      coin.y += coin.vy
      const s = segmentUnder(coin.x, 8, coin.y + 6, Math.max(4, coin.vy + 1))
      if (s && coin.vy >= 0) {
        coin.y = s.y - 6
        coin.vy = 0
      }
    }
    this.coins = this.coins.filter((c) => c.life > 0)
  }

  private updateBonus() {
    this.bonusRound--
    this.moveCoins()
    this.collectCoins()
    if (!this.coins.length || this.bonusRound <= 0) {
      const perfect = !this.coins.length
      if (perfect) {
        this.addScore(5000, W / 2, 140)
        this.fx.burst(W / 2, 150, this.fxRng, { count: 24, speed: 2.6 })
      }
      this.bonusRound = 0
      this.coins = []
      this.phaseDelay = 100
      this.sound.play('level')
      this.banner = { text: perfect ? 'PERFECT!' : 'TIME UP', ticks: 100 }
    }
  }

  private collectCoins() {
    const p = this.player
    for (const coin of this.coins) {
      if (Math.abs(coin.x - p.x) < 10 && Math.abs(coin.y - (p.y - 8)) < 14) {
        coin.life = 0
        this.addScore(800, coin.x, coin.y)
        this.sound.play('pickup')
        this.fx.burst(coin.x, coin.y, this.fxRng, {
          count: 8,
          colours: [RAMPS.gold[4], RAMPS.gold[3], '#ffffff'],
        })
      }
    }
    this.coins = this.coins.filter((c) => c.life > 0)
  }

  private collide() {
    this.collectCoins()
    const p = this.player
    for (const c of this.critters) {
      if (c.kicked) continue
      const overlap =
        Math.abs(c.x - p.x) < (CRITTER_W + PLAYER_W) / 2 - 2 &&
        Math.abs(c.y - CRITTER_H / 2 - (p.y - PLAYER_H / 2)) <
          (CRITTER_H + PLAYER_H) / 2 - 2
      if (!overlap) continue
      if (c.flipped > 0) {
        c.kicked = true
        c.vx = p.face * 2.5
        c.vy = -4
        this.addScore(800, c.x, c.y - 14)
        this.sound.play('extra')
        this.burst(c.x, c.y - 6, c.kind === 'crab' ? '#f87171' : '#a3e635')
        this.fx.burst(c.x, c.y - 6, this.fxRng, { count: 12 })
        // A kicked critter sometimes leaves a coin behind in the pipes.
        if (this.rng() < 0.35) {
          const pipe = TOP_PIPES[Math.floor(this.rng() * 2)]!
          this.coins.push({
            x: pipe.x,
            y: pipe.y,
            vx: pipe.dir * 1.2,
            vy: 0,
            life: 900,
          })
        }
      } else if (this.invuln <= 0) {
        this.loseLife()
        return
      }
    }
  }

  private loseLife() {
    this.alive = false
    this.lives--
    this.respawn = 110
    this.burst(this.player.x, this.player.y - 8, '#2dd4bf')
    this.sound.play('die')
    if (this.lives <= 0) this.banner = { text: 'GAME OVER', ticks: 9999 }
  }

  private revive() {
    Object.assign(this.player, {
      x: W / 2,
      y: 112,
      vx: 0,
      vy: 0,
      onGround: true,
    })
    this.alive = true
    this.invuln = 150
  }

  private addScore(points: number, x: number, y: number) {
    if (this.demo) return
    this.score += points
    this.floaters.push({ x, y, text: String(points), life: 45 })
    if (this.score >= this.nextExtra) {
      this.lives++
      this.nextExtra += EXTRA_LIFE_AT
      this.sound.play('extra')
      this.banner = { text: 'EXTRA PAL!', ticks: 90 }
      this.fx.burst(this.player.x, this.player.y - 10, this.fxRng, {
        count: 14,
      })
    }
  }

  private burst(x: number, y: number, color: string) {
    for (let i = 0; i < 14; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.6 + this.rng() * 2
      this.sparks.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 30,
        color,
      })
    }
  }

  private updateEffects() {
    this.fx.update()
    for (const s of this.sparks) {
      s.x += s.vx
      s.y += s.vy
      s.vy += 0.08
      s.life--
    }
    this.sparks = this.sparks.filter((s) => s.life > 0)
    for (const f of this.floaters) {
      f.y -= 0.4
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
  }

  // --- attract-mode pilot --------------------------------------------------------
  //
  // Floors are 66 px apart. To climb, the pilot stands just inside a gap in
  // the floor above, jumps straight up, and only steers onto the platform once
  // its feet are above it (steering early bonks its head on the underside).

  private floorOf(y: number): number {
    let best = 310
    for (const s of PIPE_LEVELS)
      if (Math.abs(s.y - y) < Math.abs(best - y)) best = s.y
    return best
  }

  /** Spots on my floor right under a gap in the floor above, with the side the platform is on. */
  private climbSpots(fromY: number): Array<{ x: number; dir: number }> {
    const aboveY = fromY - 66
    const spots: Array<{ x: number; dir: number }> = []
    for (const s of PIPE_LEVELS) {
      if (s.y !== aboveY) continue
      if (s.x0 > 0) spots.push({ x: s.x0 - 9, dir: 1 })
      if (s.x1 < W) spots.push({ x: s.x1 + 9, dir: -1 })
    }
    return spots.filter((spot) => segmentUnder(spot.x, 1, fromY, 1))
  }

  private steerToward(frame: InputFrame, x: number, slack = 5) {
    const p = this.player
    if (x < p.x - slack) frame.held.left = true
    else if (x > p.x + slack) frame.held.right = true
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
    const p = this.player
    // Mid-climb: rise straight, then steer onto the platform near the top.
    if (this.pilotClimb && !p.onGround) {
      if (p.y < this.pilotClimb.targetY - 1) {
        if (this.pilotClimb.dir > 0) held.right = true
        else held.left = true
      }
      return frame
    }
    this.pilotClimb = null
    const myFloor = this.floorOf(p.y)
    const live = this.critters.filter((c) => !c.kicked && c.onGround)
    const coin = this.coins[0]
    // Danger on my own floor: back away.
    const threat = live.find(
      (c) =>
        c.flipped === 0 &&
        c.y === myFloor &&
        Math.abs(c.x - p.x) < 34 &&
        Math.sign(c.dir) === Math.sign(p.x - c.x),
    )
    if (threat && this.invuln <= 0) {
      if (threat.x > p.x) held.left = true
      else held.right = true
      return frame
    }
    // Pick a job: kick a flipped critter, else bump the nearest walker from below, else chase a coin.
    const flipped = live
      .filter((c) => c.flipped > 0)
      .sort((a, b) => Math.abs(a.y - myFloor) - Math.abs(b.y - myFloor))[0]
    const walker = live
      .filter((c) => c.flipped === 0 && c.y < 300)
      .sort(
        (a, b) => Math.abs(a.y + 66 - myFloor) - Math.abs(b.y + 66 - myFloor),
      )[0]
    let goalFloor: number | null = null
    let goalX = p.x
    let jumpWhenUnder = false
    if (flipped) {
      goalFloor = flipped.y
      goalX = flipped.x
    } else if (walker) {
      goalFloor = walker.y + 66
      goalX = walker.x
      jumpWhenUnder = true
    } else if (coin) {
      goalFloor = this.floorOf(coin.y + 10)
      goalX = coin.x
    }
    if (goalFloor === null) {
      this.steerToward(frame, W / 2)
      return frame
    }
    if (goalFloor === myFloor) {
      this.steerToward(frame, goalX, jumpWhenUnder ? 4 : 2)
      if (jumpWhenUnder && Math.abs(goalX - p.x) < 8) frame.pressed.a = true
      return frame
    }
    if (goalFloor < myFloor) {
      // Climb: walk to the nearest spot under a gap, then jump.
      const spots = this.climbSpots(myFloor)
      const spot = spots.sort(
        (a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x),
      )[0]
      if (!spot) {
        this.steerToward(frame, goalX)
        return frame
      }
      if (Math.abs(spot.x - p.x) <= 2 && Math.abs(p.vx) < 0.6) {
        frame.pressed.a = true
        this.pilotClimb = { dir: spot.dir, targetY: myFloor - 66 }
      } else {
        this.steerToward(frame, spot.x, 1)
      }
      return frame
    }
    // Descend: walk off the nearer interior edge of this floor.
    const seg = segmentUnder(p.x, 1, myFloor, 1)
    if (seg) {
      const edges = [
        seg.x0 > 0 ? seg.x0 - 12 : null,
        seg.x1 < W ? seg.x1 + 12 : null,
      ].filter((x): x is number => x !== null)
      const edge = edges.sort(
        (a, b) => Math.abs(a - p.x) - Math.abs(b - p.x),
      )[0]
      this.steerToward(frame, edge ?? goalX, 1)
    }
    return frame
  }

  // --- render ----------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    const shake = this.kindShake > 0 ? Math.sin(this.tick * 3) * 2 : 0
    g.save()
    g.translate(0, shake)
    g.fillStyle = RAMPS.night[0]
    g.fillRect(0, -4, W, H + 8)
    this.renderBackdrop(g)
    this.renderFloors(g)
    this.renderKindBlock(g)
    const visible =
      this.alive && !(this.invuln > 0 && Math.floor(this.invuln / 6) % 2 === 0)
    this.renderShadows(g, visible)
    for (const coin of this.coins) this.renderCoin(g, coin)
    for (const c of this.critters) this.renderCritter(g, c)
    // The pipes stand in front, so critters crawl in and out of them.
    cachedLayer(g, 'pipe-pals-pipes', W, H, (k) => this.paintPipes(k))
    if (visible) this.renderPlayer(g)
    for (const s of this.sparks) {
      const x = Math.round(s.x)
      const y = Math.round(s.y)
      g.globalAlpha = Math.max(0, s.life / 30)
      g.fillStyle = INK
      g.fillRect(x - 1, y - 1, 3, 3)
      g.fillStyle = s.color
      g.fillRect(x - 1, y - 1, 2, 2)
    }
    g.globalAlpha = 1
    this.fx.render(g)
    for (const f of this.floaters) {
      drawText(g, f.text, f.x, f.y, {
        align: 'center',
        color: RAMPS.gold[3],
        outline: INK,
      })
    }
    g.restore()
    vignette(g, W, H, 0.3)
    this.renderHud(g)
  }

  private renderBackdrop(g: CanvasRenderingContext2D) {
    // HDMA dusk sky and the moon, painted once.
    cachedLayer(g, 'pipe-pals-sky', W, H, (k) => {
      bandedGradient(k, 0, 0, W, GROUND_Y, SKY_STOPS, 4)
      glow(k, MOON.x, MOON.y, MOON.r * 3.5, RAMPS.cream[3], 0.3)
      shadedOrb(k, MOON.x, MOON.y, MOON.r, RAMPS.cream, { outline: null })
      k.fillStyle = RAMPS.cream[1]
      k.fillRect(MOON.x + 2, MOON.y + 3, 3, 2)
      k.fillRect(MOON.x - 5, MOON.y + 5, 2, 2)
      k.fillRect(MOON.x + 5, MOON.y - 3, 2, 1)
    })
    drawStars(g, STARS, this.tick, RAMPS.purple)
    // Smog clouds drifting past at their own speeds: the parallax layer.
    g.save()
    g.globalAlpha = 0.35
    for (const c of CLOUDS) {
      const x = ((c.x + this.tick * c.speed) % (W + 80)) - 40
      drawCloud(g, Math.round(x), c.y, c.size, DUSK_CLOUD)
    }
    g.restore()
    // The city skyline and the back plumbing, painted once.
    cachedLayer(g, 'pipe-pals-city', W, H, paintCity)
  }

  private paintPipes(k: CanvasRenderingContext2D) {
    // Top pipes: critters drop out of these mouths.
    wallPipe(k, 34, 61, 28, 18, 1)
    wallPipe(k, W - 34, 61, 28, 18, -1)
    // Bottom pipes, sitting on the floor: critters leave through these.
    wallPipe(k, 26, 284, 26, 18, 1)
    wallPipe(k, W - 26, 284, 26, 18, -1)
  }

  private renderFloors(g: CanvasRenderingContext2D) {
    // Bevelled bricks at rest, painted once; a bumped stretch is redrawn lifted on top.
    cachedLayer(g, 'pipe-pals-floors', W, H, (k) => {
      for (const s of PIPE_LEVELS) {
        k.fillStyle = INK
        k.fillRect(s.x0 - 1, s.y - 1, s.x1 - s.x0 + 2, THICK + 2)
        brickRun(k, s, s.x0, s.x1, 0)
        // Lit and shadowed end faces.
        const ramp = s.y === 310 ? RAMPS.purple : RAMPS.teal
        k.fillStyle = ramp[3]
        k.fillRect(s.x0, s.y + 1, 1, THICK - 2)
        k.fillStyle = ramp[0]
        k.fillRect(s.x1 - 1, s.y + 1, 1, THICK - 1)
      }
    })
    const bump = this.bump
    if (!bump) return
    const lift = Math.round(Math.sin((bump.ticks / BUMP_TICKS) * Math.PI) * 5)
    for (const s of PIPE_LEVELS) {
      if (s.y !== bump.y) continue
      for (let x = s.x0; x < s.x1; x += 8) {
        if (Math.abs(x + 4 - bump.x) >= BUMP_REACH || lift <= 0) continue
        g.fillStyle = INK
        g.fillRect(Math.max(x, s.x0), s.y, Math.min(8, s.x1 - x), THICK)
        brickRun(g, s, x, x + 8, lift)
      }
    }
    glow(
      g,
      bump.x,
      bump.y + THICK,
      16,
      RAMPS.gold[4],
      (0.5 * bump.ticks) / BUMP_TICKS,
    )
  }

  private renderKindBlock(g: CanvasRenderingContext2D) {
    if (this.kindBlockUses <= 0) return
    const kb = KIND_BLOCK
    const squash = this.kindShake > 0 ? 3 : 0
    glow(
      g,
      kb.x + kb.w / 2,
      kb.y + kb.h / 2,
      28,
      RAMPS.pink[3],
      0.28 + 0.1 * Math.sin(this.tick / 10),
    )
    bevel(g, kb.x, kb.y + squash, kb.w, kb.h - squash, RAMPS.pink, {
      depth: 2,
    })
    drawText(g, '*', kb.x + kb.w / 2, kb.y + 3 + squash, {
      align: 'center',
      color: '#ffffff',
      outline: INK,
    })
    // One gold stud per use left.
    for (let i = 0; i < this.kindBlockUses; i++) {
      const x = kb.x + 5 + i * 6
      const y = kb.y + kb.h - 3
      g.fillStyle = INK
      g.fillRect(x - 1, y - 1, 5, 3)
      g.fillStyle = RAMPS.gold[3]
      g.fillRect(x, y, 3, 1)
      g.fillStyle = RAMPS.gold[4]
      g.fillRect(x, y, 1, 1)
    }
  }

  private renderShadows(g: CanvasRenderingContext2D, playerVisible: boolean) {
    const p = this.player
    if (playerVisible && p.onGround) dropShadow(g, p.x, p.y, 7, 1.5, 0.4)
    for (const c of this.critters) {
      if (c.onGround && !c.kicked) dropShadow(g, c.x, c.y, 8, 1.5, 0.35)
    }
  }

  private renderCoin(g: CanvasRenderingContext2D, coin: Coin) {
    const spin = Math.floor(this.tick / 6) % 4
    const sprite =
      spin === 0
        ? COIN_SPRITES[0]
        : spin === 2
          ? COIN_SPRITES[2]
          : COIN_SPRITES[1]
    glow(g, coin.x, coin.y, 13, RAMPS.gold[3], 0.4)
    drawSprite(g, sprite, coin.x, coin.y, { flipX: spin === 3 })
    // A glint that hops between coins.
    const twinkle = (this.tick + Math.round(coin.x) * 3) % 48
    if (twinkle < 8) {
      const arm = twinkle < 4 ? 2 : 1
      const x = Math.round(coin.x) + 3
      const y = Math.round(coin.y) - 4
      g.fillStyle = '#ffffff'
      g.fillRect(x - arm, y, arm * 2 + 1, 1)
      g.fillRect(x, y - arm, 1, arm * 2 + 1)
    }
  }

  private renderPlayer(g: CanvasRenderingContext2D) {
    const p = this.player
    const sprite = !p.onGround
      ? PLAYER_SPRITES.jump
      : Math.abs(p.vx) > 0.3
        ? PLAYER_SPRITES.run[Math.floor(p.run / 1.6) % 2]!
        : PLAYER_SPRITES.stand
    drawSprite(g, sprite, p.x, p.y + 1, { anchor: 'feet', flipX: p.face < 0 })
  }

  private renderCritter(g: CanvasRenderingContext2D, c: Critter) {
    const upside = c.flipped > 0 || c.kicked
    const warning =
      c.flipped > 0 && c.flipped < 120 && Math.floor(c.flipped / 8) % 2 === 0
    const set =
      c.kind === 'crab'
        ? warning
          ? CRAB_SPRITES.flash
          : c.angry
            ? CRAB_SPRITES.angry
            : CRAB_SPRITES.calm
        : warning
          ? CRAWLER_SPRITES.flash
          : c.rage > 0
            ? CRAWLER_SPRITES.rage
            : CRAWLER_SPRITES.calm
    // Flipped critters kick their legs in the air, twice as fast.
    const frame = set[Math.floor(this.tick / (upside ? 3 : 6)) % 2]!
    drawSprite(g, frame, c.x, c.y + 1, {
      anchor: 'feet',
      flipX: c.dir < 0,
      flipY: upside,
    })
    if (c.flipped > 0 && !c.kicked) {
      // Dizzy stars circling a flipped critter: kick it now.
      for (let i = 0; i < 2; i++) {
        const a = this.tick / 7 + i * Math.PI
        const x = Math.round(c.x + Math.cos(a) * 8)
        const y = Math.round(c.y - 15 + Math.sin(a) * 2)
        g.fillStyle = INK
        g.fillRect(x - 1, y - 1, 3, 3)
        g.fillStyle = i ? RAMPS.gold[4] : RAMPS.teal[4]
        g.fillRect(x, y, 1, 1)
      }
    }
  }

  private renderHud(g: CanvasRenderingContext2D) {
    hudPanel(g, 4, 3, 82, 20)
    drawText(g, String(this.score).padStart(6, '0'), 10, 6, {
      scale: 2,
      color: RAMPS.teal[4],
      shadow: INK,
    })
    const hi = `HI ${Math.max(this.hiScore, this.score)}`
    const hiW = measureText(hi, 2) + 14
    hudPanel(g, Math.round(W / 2 - hiW / 2), 3, hiW, 20)
    drawText(g, hi, W / 2, 6, {
      scale: 2,
      align: 'center',
      color: RAMPS.gold[3],
      shadow: INK,
    })
    // Spare pals, teal and pink in turn.
    const lives = Math.min(this.lives, 5)
    if (lives > 0) {
      hudPanel(g, W - 8 - lives * 16, 3, lives * 16 + 4, 20)
      for (let i = 0; i < lives; i++) {
        drawSprite(g, i % 2 ? PINK_FACE : TEAL_FACE, W - 14 - i * 16, 13)
      }
    }
    const label =
      this.bonusRound > 0
        ? `BONUS ${Math.ceil(this.bonusRound / 60)}`
        : `PHASE ${this.level}`
    hudPanel(g, 26, H - 16, measureText(label) + 14, 13)
    drawText(g, label, 33, H - 13, {
      color: RAMPS.purple[4],
      outline: INK,
    })
    if (this.bonusRound > 0) {
      hudPanel(g, W - 112, H - 16, 86, 13)
      gauge(g, W - 106, H - 12, 74, 5, this.bonusRound / BONUS_FULL, RAMPS.gold)
    }
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, 140, {
        scale: 3,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.leaf[1],
      })
      if (this.banner.sub) {
        drawText(g, this.banner.sub, W / 2, 170, {
          scale: 2,
          align: 'center',
          color: RAMPS.gold[3],
          outline: INK,
        })
      }
    }
  }
}

const pipePals: ArcadeGameModule = {
  create: (options) => new PipePals(options),
}

export const create = pipePals.create
export default pipePals
