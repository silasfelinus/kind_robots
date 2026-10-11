// /utils/arcade/games/bumperBubbles.ts
//
// Bumper Bubbles -- the Kind Robots Arcade's Bubble Bobble-style riff (conductor
// kr-arcade/t-009 game factory, from the approved 2026-10-08 daily pitch). A small
// robot hops between platforms blowing bubbles. A bubble that touches a drifting
// gremlin traps it; bump the bubble to pop it for points and a falling gem.
// Leave a trapped gremlin too long and it bursts free, angrier and faster.
//
// Each round adds gremlins (and new kinds), quickens them and shortens the time a
// bubble holds one. Pops in quick succession build a chain multiplier.
// Arrows move, UP or B hops (hop up through a platform from underneath),
// A blows a bubble.

import { levelCurve } from '../curve'
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
  drawRidge,
  drawSprite,
  drawStars,
  dropShadow,
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
const FLOOR_Y = 224
const TOP_Y = 28

const START_LIVES = 3
const READY_TICKS = 90
const DEATH_TICKS = 90
const CLEAR_TICKS = 120
const INVULN_TICKS = 120
const SHOT_COOLDOWN = 16
const SHOT_RANGE = 26
const BUBBLE_R = 7
const EMPTY_BUBBLE_LIFE = 420
const CHAIN_WINDOW = 70
const HURRY_TICKS = 1800
const EXTRA_EVERY = 25_000

const GRAVITY = 0.2
const MAX_FALL = 4
const JUMP_V = -5.1
const WALK = 1.3

export const BUBBLE_CURVES = {
  gremlins: { start: 3, step: 1, limit: 9 },
  /** Pixels per tick for a walking gremlin. */
  speed: { start: 0.5, step: 0.04, limit: 1.0 },
  /** Chance per tick that a gremlin hops. */
  hop: { start: 0.004, step: 0.0015, limit: 0.016 },
  /** Ticks a bubble holds a gremlin before it bursts free. */
  hold: { start: 520, step: -30, limit: 240 },
} as const

type Platform = { x: number; y: number; w: number }
/** Four layouts; the round number picks one. Every gap is within a hop. */
const LAYOUTS: Platform[][] = [
  [
    { x: 16, y: 176, w: 72 },
    { x: 168, y: 176, w: 72 },
    { x: 72, y: 128, w: 112 },
    { x: 16, y: 80, w: 72 },
    { x: 168, y: 80, w: 72 },
  ],
  [
    { x: 0, y: 180, w: 96 },
    { x: 160, y: 180, w: 96 },
    { x: 48, y: 132, w: 160 },
    { x: 0, y: 84, w: 72 },
    { x: 184, y: 84, w: 72 },
  ],
  [
    { x: 40, y: 178, w: 56 },
    { x: 160, y: 178, w: 56 },
    { x: 0, y: 130, w: 64 },
    { x: 192, y: 130, w: 64 },
    { x: 88, y: 130, w: 80 },
    { x: 48, y: 82, w: 160 },
  ],
  [
    { x: 0, y: 176, w: 112 },
    { x: 144, y: 128, w: 112 },
    { x: 0, y: 80, w: 112 },
    { x: 176, y: 176, w: 80 },
  ],
]
const KIND_COLORS = ['#4ade80', '#f87171', '#facc15', '#38bdf8', '#e879f9']

type Body = {
  x: number
  /** Feet (bottom centre). */
  y: number
  vx: number
  vy: number
  onGround: boolean
}
type Gremlin = Body & {
  kind: number
  dir: -1 | 1
  angry: boolean
}
type Bubble = {
  x: number
  y: number
  vx: number
  vy: number
  age: number
  /** Ticks of the shot flight left before it starts to rise. */
  flight: number
  held: Gremlin | null
  holdLeft: number
}
type Gem = Body & { life: number; color: string }
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = { x: number; y: number; text: string; life: number }

function platformsFor(round: number): Platform[] {
  return LAYOUTS[(round - 1) % LAYOUTS.length]!
}

// --- 16-bit art (utils/arcade/snes.ts) -------------------------------------------

/** One ramp per gremlin kind, built around KIND_COLORS so gems and pops match. */
const KIND_RAMPS: readonly Ramp[] = [
  ['#0e3b2a', '#17803f', '#4ade80', '#a7f3c0', '#effff4'],
  ['#4a1024', '#a3304a', '#f87171', '#fcb4b4', '#fff0f0'],
  ['#5a3a08', '#b07a0c', '#facc15', '#fde98a', '#fffbe0'],
  ['#0c2a5a', '#1c6aa8', '#38bdf8', '#a5e4ff', '#effaff'],
  ['#3d0f4a', '#8a2a9e', '#e879f9', '#f5c2fc', '#fff0ff'],
]

/** Backdrop bodies, muted so the actors in front of them still pop. */
const MOON: Ramp = ['#3a3048', '#6a5a70', '#a898a0', '#d8cfc8', '#f4efe8']
const PLANET: Ramp = ['#2a0f3a', '#4a1f5a', '#7a3a7a', '#a8609a', '#d090c0']

/** Each round's stage: banded sky, a far and a near parallax ridge, and its decor. */
type Theme = {
  sky: readonly string[]
  plat: Ramp
  far: { fill: string; rim: string }
  near: { fill: string; rim: string }
  stars: Ramp | null
  clouds: Ramp | null
  orb: { x: number; y: number; r: number; ramp: Ramp; ring: boolean } | null
  rays: boolean
  decor: string
}

const THEMES: readonly Theme[] = [
  // Candy night under a big cream moon.
  {
    sky: [
      RAMPS.night[0],
      RAMPS.night[1],
      RAMPS.purple[0],
      mix(RAMPS.purple[1], RAMPS.pink[0], 0.6),
    ],
    plat: RAMPS.pink,
    far: {
      fill: mix(RAMPS.purple[0], RAMPS.pink[0], 0.5),
      rim: RAMPS.pink[1],
    },
    near: { fill: RAMPS.night[1], rim: RAMPS.purple[1] },
    stars: RAMPS.purple,
    clouds: null,
    orb: { x: 196, y: 58, r: 15, ramp: MOON, ring: false },
    rays: false,
    decor: RAMPS.pink[3],
  },
  // A sunken lagoon: light shafts and kelp hills.
  {
    sky: ['#030d18', '#06213a', RAMPS.water[0], RAMPS.teal[0]],
    plat: RAMPS.teal,
    far: { fill: mix(RAMPS.teal[0], RAMPS.water[0], 0.4), rim: '#14505a' },
    near: { fill: '#04161e', rim: RAMPS.teal[0] },
    stars: null,
    clouds: null,
    orb: null,
    rays: true,
    decor: RAMPS.water[4],
  },
  // Deep space, a ringed planet and gold stars.
  {
    sky: [
      RAMPS.night[0],
      RAMPS.night[0],
      RAMPS.night[1],
      RAMPS.purple[0],
      RAMPS.night[2],
    ],
    plat: RAMPS.purple,
    far: { fill: '#1a0f40', rim: RAMPS.night[3] },
    near: { fill: RAMPS.night[0], rim: RAMPS.night[2] },
    stars: RAMPS.gold,
    clouds: null,
    orb: { x: 54, y: 56, r: 14, ramp: PLANET, ring: true },
    rays: false,
    decor: RAMPS.purple[3],
  },
  // Ember sunset with drifting dusk clouds.
  {
    sky: ['#1a0618', RAMPS.ember[0], '#7a1f2a', RAMPS.rust[1], RAMPS.rust[2]],
    plat: RAMPS.gold,
    far: { fill: mix(RAMPS.ember[0], RAMPS.rust[0], 0.5), rim: '#7a1f2a' },
    near: { fill: '#1a0612', rim: RAMPS.ember[0] },
    stars: null,
    clouds: ['#2a0c1e', '#6a1f3a', '#a83a4a', '#e0705a', '#ffc08a'],
    orb: { x: 128, y: 168, r: 30, ramp: RAMPS.gold, ring: false },
    rays: false,
    decor: RAMPS.gold[4],
  },
]

const STARS = starField(47, 44, W, 160)
const FAR_RIDGE = ridge(53, W, 58)
const NEAR_RIDGE = ridge(59, W, 30, 3)
const CLOUDS = (() => {
  const rand = backdropRng(61)
  return Array.from({ length: 4 }, (_, i) => ({
    x: i * 74 + rand() * 30,
    y: 44 + rand() * 70,
    size: 7 + rand() * 5,
    speed: 0.04 + rand() * 0.05,
  }))
})()
/** Little bubbles rising through the backdrop: it is Bubble Bobble, after all. */
const DECOR_BUBBLES = (() => {
  const rand = backdropRng(67)
  return Array.from({ length: 16 }, () => ({
    x: rand() * W,
    y: rand() * (H + 20),
    r: 1.5 + rand() * 3.5,
    speed: 0.12 + rand() * 0.25,
    phase: rand() * Math.PI * 2,
  }))
})()

const SHEEN = [
  'rgba(244, 114, 182, 0.6)',
  'rgba(250, 204, 21, 0.55)',
  'rgba(94, 234, 212, 0.55)',
  'rgba(167, 139, 250, 0.6)',
]

// The robot: a teal cat-eared bot with a gold antenna light, facing right.
const ROBOT_PALETTE = {
  Y: RAMPS.gold[4],
  y: RAMPS.gold[2],
  H: RAMPS.teal[4],
  h: RAMPS.teal[3],
  T: RAMPS.teal[2],
  t: RAMPS.teal[1],
  d: RAMPS.teal[0],
  v: RAMPS.night[1],
  w: RAMPS.sky[3],
  e: '#e6fff8',
  g: RAMPS.gold[3],
  G: RAMPS.gold[4],
  P: RAMPS.pink[3],
  p: RAMPS.pink[2],
  q: RAMPS.pink[1],
}
const ROBOT_HEAD = [
  '.....YY.....',
  '.h....y...t.',
  '.hh...y..tt.',
  '.hHHHHHHHHt.',
  'hHTTTTTTTTTt',
]
const ROBOT_EYES = ['hTwvveeveeTt', 'hTvvveeveeTt', 'hTvvvvvvvvTt']
const ROBOT_BODY = [
  'hTTTTTTTTTtt',
  '.dttttttttd.',
  '..hTTgGTTt..',
  '.hTTTggTTTt.',
  '.hTTTTTTTtt.',
  '..dttttttd..',
]
function robot(eyes: readonly string[], feet: readonly string[]): PixelSprite {
  return pixelSprite(
    [...ROBOT_HEAD, ...eyes, ...ROBOT_BODY, ...feet],
    ROBOT_PALETTE,
  )
}
const ROBOT = {
  stand: robot(ROBOT_EYES, ['..Pp...Pp...', '..PPq..PPq..']),
  run: [
    robot(ROBOT_EYES, ['.Pp.....Pp..', 'PPq.....PPq.']),
    robot(ROBOT_EYES, ['...Pp.Pp....', '...PPqPPq...']),
  ] as const,
  jump: robot(ROBOT_EYES, ['...Pp..Pp...', '....q...q...']),
  // Cheeks puffed, eyes squeezed shut, lips pursed round a bubble.
  blow: robot(
    ['hTwvvvvvvvTt', 'hTvveevveeTt', 'hTvvvvvvpPTt'],
    ['..Pp...Pp...', '..PPq..PPq..'],
  ),
}
const LIFE_SPRITE = pixelSprite(
  [
    '.h..Y..t.',
    '.hh.y.tt.',
    'hHHHHHHHt',
    'hTwvvvvTt',
    'hTvveveTt',
    'hTTTTTTtt',
    '.dtttttd.',
  ],
  ROBOT_PALETTE,
)

// Gremlins: horned fuzzballs with a toothy grin, facing right. Angry ones go ember red.
const GREMLIN_TOP = ['.N........N.', '.nn......nn.', '..LLLLLLLL..']
type GremlinFrames = {
  walk: readonly [PixelSprite, PixelSprite]
  trapped: PixelSprite
}
function gremlinFrames(ramp: Ramp, angry: boolean): GremlinFrames {
  const palette = {
    d: ramp[0],
    b: ramp[1],
    B: ramp[2],
    L: ramp[3],
    H: ramp[4],
    n: RAMPS.cream[2],
    N: RAMPS.cream[4],
    w: '#ffffff',
    k: INK,
  }
  const brow = angry ? '.LHkkBBkkBb.' : '.LHLBBBBBBb.'
  const face = [
    brow,
    'LHBwwBBBwwBb',
    'LBBwkBBBwkBb',
    'BBBBBBBBBBbb',
    'BBkwkwkwkBbd',
    'bBBkkkkkkBbd',
    '.bbbbbbbbbd.',
  ]
  const make = (feet: string) =>
    pixelSprite([...GREMLIN_TOP, ...face, feet], palette)
  return {
    walk: [make('..dd....dd..'), make('...dd..dd...')],
    // Caught: eyes rolled up at the bubble wall, mouth an "o", feet tucked.
    trapped: pixelSprite(
      [
        ...GREMLIN_TOP,
        brow,
        'LHBwkBBBwkBb',
        'LBBwwBBBwwBb',
        'BBBBBBBBBBbb',
        'BBBBBkkBBBbd',
        'bBBBBkkBBBbd',
        '.bbbbbbbbbd.',
        '...dd..dd...',
      ],
      palette,
    ),
  }
}
const GREMLIN_FRAMES = KIND_RAMPS.map((r) => gremlinFrames(r, false))
const ANGRY_FRAMES = gremlinFrames(RAMPS.ember, true)

const GEM_SPRITES = KIND_RAMPS.map((r) =>
  pixelSprite(['.HLLB.', 'HLLBBb', 'bBBbbd', '.bBbd.', '..bd..'], {
    H: r[4],
    L: r[3],
    B: r[2],
    b: r[1],
    d: r[0],
  }),
)

/** A darker twin of a ramp, for the checkered candy tiles. */
function deeper(ramp: Ramp): Ramp {
  return [
    ramp[0],
    mix(ramp[0], ramp[1], 0.5),
    ramp[1],
    mix(ramp[1], ramp[2], 0.6),
    ramp[3],
  ]
}

/**
 * A candy slab: checkered bevelled tiles in an ink frame, frosted on top with drips, and a
 * soft shadow cast on the backdrop below. Bricks offset row to row when `rows` > 1.
 */
function paintSlab(
  k: CanvasRenderingContext2D,
  x0: number,
  y: number,
  w: number,
  rows: number,
  ramp: Ramp,
  seed: number,
) {
  const h = rows * 8
  const dark = deeper(ramp)
  const rand = backdropRng(seed)
  k.fillStyle = rgba(INK, 0.4)
  k.fillRect(x0 + 3, y + h + 1, w, 3)
  k.fillStyle = INK
  k.fillRect(x0 - 1, y - 1, w + 2, h + 2)
  for (let row = 0; row < rows; row++) {
    const shift = row % 2 ? 4 : 0
    for (let x = x0 - shift, i = 0; x < x0 + w; x += 8, i++) {
      const left = Math.max(x, x0)
      const right = Math.min(x + 8, x0 + w)
      if (right - left <= 0) continue
      const tile = (i + row) % 2 ? dark : ramp
      bevel(k, left, y + row * 8, right - left, 8, tile, {
        depth: 1,
        outline: null,
      })
      if (right - left >= 6 && rand() < 0.5) {
        k.fillStyle = tile[4]
        k.fillRect(left + 2, y + row * 8 + 3, 1, 1)
      }
    }
  }
  // Frosting along the top, dripping down the tiles here and there.
  k.fillStyle = RAMPS.cream[4]
  k.fillRect(x0, y, w, 1)
  k.fillStyle = RAMPS.cream[3]
  k.fillRect(x0, y + 1, w, 1)
  for (let x = x0 + 1; x < x0 + w - 1; x++) {
    if (rand() < 0.14) {
      const len = 1 + Math.floor(rand() * 3)
      k.fillStyle = RAMPS.cream[3]
      k.fillRect(x, y + 2, 1, len)
      k.fillStyle = RAMPS.cream[2]
      k.fillRect(x, y + 2 + len, 1, 1)
    }
  }
}

class BumperBubbles implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private platforms: Platform[] = []
  private player: Body & { face: -1 | 1; cooldown: number } = {
    x: 40,
    y: FLOOR_Y,
    vx: 0,
    vy: 0,
    onGround: true,
    face: 1,
    cooldown: 0,
  }
  private gremlins: Gremlin[] = []
  private bubbles: Bubble[] = []
  private gems: Gem[] = []
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private ready = 0
  private dead = 0
  private clear = 0
  private invuln = 0
  private roundTicks = 0
  private chain = 0
  private chainLeft = 0
  private nextExtra = EXTRA_EVERY
  private banner: { text: string; sub?: string; ticks: number } | null = null
  // Cosmetic sparkles roll their own dice, so the game's seeded rng is untouched.
  private fx = new Sparkles()
  private fxRng = backdropRng(71)

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.startRound(1)
  }

  // --- setup ------------------------------------------------------------------

  private startRound(round: number) {
    this.level = round
    this.platforms = platformsFor(round)
    this.bubbles = []
    this.gems = []
    this.gremlins = []
    this.roundTicks = 0
    this.chain = 0
    this.chainLeft = 0
    const count = Math.round(levelCurve(round, BUBBLE_CURVES.gremlins))
    const kinds = Math.min(KIND_COLORS.length, 1 + Math.floor(round / 2))
    const slots = this.platforms.filter((p) => p.y < FLOOR_Y - 20)
    for (let i = 0; i < count; i++) {
      const p = slots[i % slots.length]!
      const x = p.x + 8 + this.rng() * Math.max(1, p.w - 16)
      this.gremlins.push({
        x,
        y: p.y,
        vx: 0,
        vy: 0,
        onGround: true,
        kind: Math.floor(this.rng() * kinds),
        dir: this.rng() < 0.5 ? -1 : 1,
        angry: false,
      })
    }
    this.respawnPlayer()
    this.ready = READY_TICKS
    this.banner = {
      text: `ROUND ${round}`,
      sub: `${count} GREMLINS  GET READY`,
      ticks: READY_TICKS,
    }
  }

  private respawnPlayer() {
    const p = this.player
    p.x = W / 2
    p.y = FLOOR_Y
    p.vx = 0
    p.vy = 0
    p.onGround = true
    p.face = 1
    p.cooldown = 0
    this.invuln = INVULN_TICKS
  }

  // --- physics ----------------------------------------------------------------

  /** Move a body one tick: gravity, one-way platforms, floor, side walls. */
  private step(b: Body, halfW: number, dropThrough = false) {
    const prevY = b.y
    b.vy = Math.min(MAX_FALL, b.vy + GRAVITY)
    b.x += b.vx
    b.y += b.vy
    if (b.x < halfW) b.x = halfW
    if (b.x > W - halfW) b.x = W - halfW
    b.onGround = false
    if (b.y >= FLOOR_Y) {
      b.y = FLOOR_Y
      b.vy = 0
      b.onGround = true
      return
    }
    if (b.vy < 0 || dropThrough) return
    for (const p of this.platforms) {
      if (
        b.x + halfW > p.x &&
        b.x - halfW < p.x + p.w &&
        prevY <= p.y + 0.01 &&
        b.y >= p.y
      ) {
        b.y = p.y
        b.vy = 0
        b.onGround = true
        return
      }
    }
  }

  // --- update -----------------------------------------------------------------

  update(input: InputFrame) {
    if (this.over) return
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.dead > 0) {
      if (--this.dead === 0) {
        if (this.lives <= 0) this.over = true
        else this.respawnPlayer()
      }
      this.updateWorld()
      return
    }
    if (this.ready > 0) {
      this.ready--
      this.updateWorld(false)
      return
    }
    if (this.clear > 0) {
      if (--this.clear === 0) this.startRound(this.level + 1)
      this.updateWorld(false)
      return
    }
    const frame = this.demo ? this.demoInput() : input
    this.roundTicks++
    if (this.roundTicks === HURRY_TICKS) {
      this.banner = { text: 'HURRY!', ticks: 80 }
      this.sound.play('warn')
      for (const g of this.gremlins) g.angry = true
    }
    if (this.invuln > 0) this.invuln--
    this.updatePlayer(frame)
    this.updateWorld()
    this.checkPlayerHits()
    if (this.chainLeft > 0 && --this.chainLeft === 0) this.chain = 0
    if (
      this.dead === 0 &&
      this.clear === 0 &&
      this.gremlins.length === 0 &&
      !this.bubbles.some((b) => b.held)
    ) {
      this.clear = CLEAR_TICKS
      this.banner = {
        text: 'ROUND CLEAR',
        sub: this.roundTicks < 1500 ? 'SPEEDY BONUS' : undefined,
        ticks: CLEAR_TICKS,
      }
      if (this.roundTicks < 1500) this.addScore(1000 * this.level)
      this.sound.play('level')
      this.fx.burst(this.player.x, this.player.y - 8, this.fxRng, {
        count: 24,
        speed: 2.4,
      })
    }
  }

  private updatePlayer(input: InputFrame) {
    const p = this.player
    const h = input.held
    let dir = 0
    if (h.left) dir -= 1
    if (h.right) dir += 1
    p.vx = dir * WALK
    if (dir !== 0) p.face = dir < 0 ? -1 : 1
    if ((input.pressed.up || input.pressed.b) && p.onGround) {
      p.vy = JUMP_V
      p.onGround = false
      this.sound.play('blip')
    }
    this.step(p, 6)
    if (p.cooldown > 0) p.cooldown--
    if (input.pressed.a && p.cooldown === 0) {
      p.cooldown = SHOT_COOLDOWN
      this.bubbles.push({
        x: p.x + p.face * 9,
        y: p.y - 9,
        vx: p.face * 3,
        vy: 0,
        age: 0,
        flight: SHOT_RANGE,
        held: null,
        holdLeft: 0,
      })
      this.sound.play('shoot')
    }
  }

  private updateWorld(live = true) {
    // Gremlins.
    const speed = levelCurve(this.level, BUBBLE_CURVES.speed)
    const hop = levelCurve(this.level, BUBBLE_CURVES.hop)
    if (live) {
      for (const g of this.gremlins) {
        const mult = g.angry ? 1.5 : 1
        if (g.onGround) {
          g.vx = g.dir * speed * mult * (g.kind === 3 ? 1.25 : 1)
          let jump = this.rng() < hop * (g.kind === 2 ? 2 : 1) * mult
          // A hopper (kind 4) hops toward the player's level if it is above.
          if (g.kind === 4 && this.player.y < g.y - 24 && this.rng() < 0.02) {
            jump = true
            g.dir = this.player.x < g.x ? -1 : 1
          }
          if (jump) {
            g.vy = JUMP_V
            g.onGround = false
          }
        }
        this.step(g, 6)
        if (g.x <= 6) g.dir = 1
        else if (g.x >= W - 6) g.dir = -1
        else if (g.onGround && this.rng() < 0.004) g.dir = g.dir === 1 ? -1 : 1
      }
    }
    // Bubbles.
    for (const b of this.bubbles) {
      b.age++
      if (b.flight > 0) {
        b.flight--
        if (b.flight === 0) b.vx = 0
      } else {
        b.vy = b.held ? -0.3 : -0.45
        b.vx = Math.sin((b.age + b.x) / 18) * 0.35
      }
      b.x = Math.max(BUBBLE_R, Math.min(W - BUBBLE_R, b.x + b.vx))
      b.y = Math.max(TOP_Y, b.y + b.vy)
      if (b.held) {
        b.holdLeft--
        if (b.holdLeft === 60) this.sound.play('warn')
      }
    }
    if (live) this.trapGremlins()
    const released: Gremlin[] = []
    this.bubbles = this.bubbles.filter((b) => {
      if (b.held && b.holdLeft <= 0) {
        b.held.x = b.x
        b.held.y = b.y + 6
        b.held.vx = 0
        b.held.vy = 0
        b.held.angry = true
        b.held.onGround = false
        released.push(b.held)
        this.burst(b.x, b.y, 8, '#e0f2fe')
        return false
      }
      if (!b.held && b.age > EMPTY_BUBBLE_LIFE) {
        this.burst(b.x, b.y, 5, '#bae6fd')
        return false
      }
      return true
    })
    if (released.length) {
      this.gremlins.push(...released)
      this.sound.play('boom')
    }
    // Gems.
    for (const gem of this.gems) {
      gem.life--
      this.step(gem, 4)
    }
    this.gems = this.gems.filter((gem) => gem.life > 0)
  }

  private trapGremlins() {
    for (const b of this.bubbles) {
      if (b.held) continue
      for (let i = 0; i < this.gremlins.length; i++) {
        const g = this.gremlins[i]!
        if (
          Math.abs(b.x - g.x) < BUBBLE_R + 5 &&
          Math.abs(b.y - (g.y - 6)) < BUBBLE_R + 6
        ) {
          this.gremlins.splice(i, 1)
          b.held = g
          b.holdLeft = Math.round(levelCurve(this.level, BUBBLE_CURVES.hold))
          b.flight = 0
          b.vx = 0
          this.sound.play('pickup')
          break
        }
      }
    }
  }

  private checkPlayerHits() {
    const p = this.player
    // Bump bubbles.
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i]!
      if (b.flight > 0) continue
      if (
        Math.abs(b.x - p.x) < BUBBLE_R + 5 &&
        Math.abs(b.y - (p.y - 7)) < BUBBLE_R + 7
      ) {
        this.bubbles.splice(i, 1)
        if (b.held) this.popHeld(b)
        else {
          this.addScore(10, b.x, b.y)
          this.burst(b.x, b.y, 6, '#bae6fd')
          this.fx.burst(b.x, b.y, this.fxRng, {
            count: 4,
            speed: 1,
            colours: [RAMPS.water[4], RAMPS.water[3]],
          })
          this.sound.play('pop')
        }
      }
    }
    // Collect gems.
    this.gems = this.gems.filter((gem) => {
      if (Math.abs(gem.x - p.x) < 9 && Math.abs(gem.y - p.y) < 12) {
        this.addScore(300, gem.x, gem.y - 8)
        this.sound.play('pickup')
        this.fx.burst(gem.x, gem.y - 5, this.fxRng, {
          count: 10,
          colours: [RAMPS.gold[4], RAMPS.gold[3], '#ffffff'],
        })
        return false
      }
      return true
    })
    // Touch a free gremlin.
    if (this.invuln === 0 && !this.demo) {
      for (const g of this.gremlins) {
        if (Math.abs(g.x - p.x) < 9 && Math.abs(g.y - p.y) < 12) {
          this.lives--
          this.dead = DEATH_TICKS
          this.burst(p.x, p.y - 7, 14, '#5eead4')
          this.sound.play('die')
          this.banner = {
            text: this.lives > 0 ? 'OUCH!' : 'GAME OVER',
            ticks: 70,
          }
          return
        }
      }
    }
  }

  private popHeld(b: Bubble) {
    this.chain = Math.min(4, this.chainLeft > 0 ? this.chain + 1 : 1)
    this.chainLeft = CHAIN_WINDOW
    const points = 200 * this.chain
    this.addScore(points, b.x, b.y)
    this.burst(b.x, b.y, 12, KIND_COLORS[b.held!.kind]!)
    const ramp = KIND_RAMPS[b.held!.kind]!
    this.fx.burst(b.x, b.y, this.fxRng, {
      count: 6 + this.chain * 4,
      speed: 1.3 + this.chain * 0.3,
      colours: [ramp[4], ramp[3], RAMPS.gold[4]],
    })
    this.sound.play('boom')
    this.gems.push({
      x: b.x,
      y: b.y,
      vx: 0,
      vy: -2,
      onGround: false,
      life: 480,
      color: KIND_COLORS[b.held!.kind]!,
    })
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x?: number, y?: number) {
    if (this.demo) return
    this.score += points
    if (x !== undefined && y !== undefined) {
      this.floaters.push({ x, y, text: String(points), life: 40 })
    }
    if (this.score >= this.nextExtra) {
      this.lives++
      this.nextExtra += EXTRA_EVERY
      this.banner = { text: 'EXTRA LIFE!', ticks: 90 }
      this.sound.play('extra')
      this.fx.burst(this.player.x, this.player.y - 8, this.fxRng, {
        count: 16,
      })
    }
  }

  private burst(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.5 + this.rng() * 2
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
    this.fx.update()
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      p.vx *= 0.95
      p.vy *= 0.95
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
    // Chase a trapped gremlin first, else the nearest free one.
    const popTarget = this.bubbles.find((b) => b.held && b.flight === 0)
    let tx = p.x
    let ty = p.y
    if (popTarget) {
      tx = popTarget.x
      ty = popTarget.y + 7
    } else {
      let best = Infinity
      for (const g of this.gremlins) {
        const d = Math.abs(g.x - p.x) + Math.abs(g.y - p.y) * 0.5
        if (d < best) {
          best = d
          tx = g.x
          ty = g.y
        }
      }
    }
    const dx = tx - p.x
    if (Math.abs(dx) > 4) {
      const key = dx < 0 ? 'left' : 'right'
      held[key] = true
    }
    const sameRow = Math.abs(ty - p.y) < 20
    const facing = (dx < 0 ? -1 : 1) === p.face
    if (
      !popTarget &&
      sameRow &&
      facing &&
      Math.abs(dx) < 90 &&
      this.tick % 20 === 0
    ) {
      frame.pressed.a = true
    }
    if (ty < p.y - 24 && p.onGround && this.tick % 25 === 0) {
      frame.pressed.up = true
    } else if (p.onGround && this.tick % 90 === 0) {
      frame.pressed.up = true
    }
    return frame
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    const ti = (this.level - 1) % THEMES.length
    const theme = THEMES[ti]!
    this.renderBackdrop(g, ti, theme)
    this.renderStage(g, ti, theme)
    for (const gem of this.gems) this.renderGem(g, gem)
    for (const gr of this.gremlins) this.renderGremlin(g, gr)
    for (const b of this.bubbles) this.renderBubble(g, b)
    this.renderPlayer(g)
    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, p.life / 28)
      g.fillStyle = INK
      g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 3, 3)
      g.fillStyle = p.color
      g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 2, 2)
    }
    g.globalAlpha = 1
    this.fx.render(g)
    for (const f of this.floaters) {
      // Kept on screen: a pop at the wall still shows its points whole.
      const half = measureText(f.text) / 2 + 2
      const x = Math.max(half, Math.min(W - half, f.x))
      drawText(g, f.text, x, f.y, {
        align: 'center',
        color: RAMPS.gold[3],
        outline: INK,
      })
    }
    // HURRY: the whole stage flushes red while the gremlins rage.
    if (this.roundTicks >= HURRY_TICKS && this.clear === 0) {
      g.fillStyle = rgba(RAMPS.ember[2], 0.06 + 0.04 * Math.sin(this.tick / 8))
      g.fillRect(0, 0, W, H)
    }
    vignette(g, W, H, 0.3)
    this.renderHud(g)
  }

  /** Where a body at (x, y) would land: the nearest platform top below it, or the floor. */
  private surfaceBelow(x: number, y: number): number {
    let best = FLOOR_Y
    for (const p of this.platforms) {
      if (x >= p.x && x <= p.x + p.w && p.y >= y - 0.5 && p.y < best) best = p.y
    }
    return best
  }

  /** A shadow on whatever is underneath, shrinking and fading as the body rises. */
  private castShadow(
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    rx: number,
  ) {
    const ground = this.surfaceBelow(x, y)
    const lift = ground - y
    if (lift > 80) return
    const k = 1 - lift / 100
    dropShadow(g, x, ground, Math.max(2, rx * k), 1.5, 0.35 * k)
  }

  private renderBackdrop(
    g: CanvasRenderingContext2D,
    ti: number,
    theme: Theme,
  ) {
    // The banded sky and its moon, planet, sun or light shafts, painted once per theme.
    cachedLayer(g, `bumper-bubbles-sky-${ti}`, W, H, (k) => {
      bandedGradient(k, 0, 0, W, H, theme.sky, 4)
      if (theme.rays) {
        for (let i = 0; i < 5; i++) {
          const x = 20 + i * 52
          k.fillStyle = rgba(RAMPS.water[4], 0.05 + (i % 2) * 0.03)
          k.beginPath()
          k.moveTo(x, 0)
          k.lineTo(x + 18 + (i % 3) * 6, 0)
          k.lineTo(x + 70, H)
          k.lineTo(x + 34, H)
          k.closePath()
          k.fill()
        }
      }
      const orb = theme.orb
      if (orb) {
        glow(k, orb.x, orb.y, orb.r * 2.6, orb.ramp[3], 0.22)
        if (orb.ring) {
          k.strokeStyle = RAMPS.gold[0]
          k.lineWidth = 2
          k.beginPath()
          k.ellipse(orb.x, orb.y, orb.r * 1.8, orb.r * 0.45, -0.3, Math.PI, 0)
          k.stroke()
        }
        shadedOrb(k, orb.x, orb.y, orb.r, orb.ramp, { outline: null })
        if (orb.ring) {
          k.strokeStyle = RAMPS.gold[1]
          k.lineWidth = 2
          k.beginPath()
          k.ellipse(orb.x, orb.y, orb.r * 1.8, orb.r * 0.45, -0.3, 0, Math.PI)
          k.stroke()
        } else if (orb.ramp === MOON) {
          // Moon craters.
          k.fillStyle = rgba(MOON[1], 0.6)
          k.fillRect(orb.x + 3, orb.y + 2, 4, 3)
          k.fillRect(orb.x - 6, orb.y + 6, 3, 2)
          k.fillRect(orb.x + 6, orb.y - 6, 2, 2)
        }
      }
    })
    if (theme.stars) drawStars(g, STARS, this.tick, theme.stars)
    if (theme.clouds) {
      for (const c of CLOUDS) {
        const x = ((c.x + this.tick * c.speed) % (W + 60)) - 30
        drawCloud(g, x, c.y, c.size, theme.clouds)
      }
    }
    // Two parallax ridges drifting at different speeds.
    drawRidge(g, FAR_RIDGE, {
      base: 206,
      bottom: FLOOR_Y,
      width: W,
      offset: this.tick * 0.04,
      fill: theme.far.fill,
      rim: theme.far.rim,
    })
    drawRidge(g, NEAR_RIDGE, {
      base: 222,
      bottom: FLOOR_Y,
      width: W,
      offset: this.tick * 0.11,
      step: 3,
      fill: theme.near.fill,
      rim: theme.near.rim,
    })
    // Bubbles rising through the backdrop, wobbling as they go.
    g.lineWidth = 1
    for (const d of DECOR_BUBBLES) {
      const y =
        ((((d.y - this.tick * d.speed) % (H + 20)) + H + 20) % (H + 20)) - 10
      const x = d.x + Math.sin(this.tick / 30 + d.phase) * 3
      g.strokeStyle = rgba(theme.decor, 0.35)
      g.beginPath()
      g.arc(x, y, d.r, 0, Math.PI * 2)
      g.stroke()
      g.fillStyle = rgba('#ffffff', 0.5)
      g.fillRect(Math.round(x - d.r * 0.5), Math.round(y - d.r * 0.5), 1, 1)
    }
  }

  private renderStage(g: CanvasRenderingContext2D, ti: number, theme: Theme) {
    // Candy platforms and the brick floor, painted once per layout and theme.
    const li = (this.level - 1) % LAYOUTS.length
    cachedLayer(g, `bumper-bubbles-stage-${li}-${ti}`, W, H, (k) => {
      this.platforms.forEach((p, i) => {
        paintSlab(k, p.x, p.y, p.w, 1, theme.plat, li * 31 + i * 7 + 3)
      })
      paintSlab(k, 0, FLOOR_Y, W, 2, theme.plat, li * 31 + 97)
    })
  }

  private renderGem(g: CanvasRenderingContext2D, gem: Gem) {
    if (gem.life < 90 && Math.floor(this.tick / 4) % 2) return
    const kind = Math.max(0, KIND_COLORS.indexOf(gem.color))
    const ramp = KIND_RAMPS[kind]!
    const bob = gem.onGround
      ? Math.round(Math.sin(this.tick / 10 + gem.x) * 1.2)
      : 0
    this.castShadow(g, gem.x, gem.y, 4)
    glow(
      g,
      gem.x,
      gem.y - 5 + bob,
      11,
      ramp[3],
      0.35 + 0.15 * Math.sin(this.tick / 6),
    )
    drawSprite(g, GEM_SPRITES[kind]!, gem.x, gem.y - 1 + bob, {
      anchor: 'feet',
    })
    // A glint flares across the facets now and then.
    if ((this.tick + kind * 9) % 48 < 10) {
      const x = Math.round(gem.x) - 2
      const y = Math.round(gem.y) - 7 + bob
      g.fillStyle = '#ffffff'
      g.fillRect(x - 1, y, 3, 1)
      g.fillRect(x, y - 1, 1, 3)
    }
  }

  private renderGremlin(g: CanvasRenderingContext2D, gr: Gremlin) {
    const set = gr.angry ? ANGRY_FRAMES : GREMLIN_FRAMES[gr.kind]!
    this.castShadow(g, gr.x, gr.y, 6)
    if (gr.angry) {
      glow(
        g,
        gr.x,
        gr.y - 6,
        13,
        RAMPS.ember[2],
        0.25 + 0.12 * Math.sin(this.tick / 5),
      )
    }
    const moving = gr.onGround && gr.vx !== 0 && this.ready === 0
    const frame = moving ? Math.floor((this.tick + gr.kind * 3) / 8) % 2 : 0
    drawSprite(g, set.walk[frame]!, gr.x, gr.y + 1, {
      anchor: 'feet',
      flipX: gr.dir === -1,
    })
    if (gr.angry) {
      // Steam puffing from the horns.
      const t = Math.floor(this.tick / 5) % 4
      g.fillStyle = rgba('#ffffff', 0.7 - t * 0.15)
      g.fillRect(Math.round(gr.x) - 6, Math.round(gr.y) - 15 - t, 2, 2)
      g.fillRect(Math.round(gr.x) + 5, Math.round(gr.y) - 17 + t / 2, 2, 2)
    }
  }

  private renderBubble(g: CanvasRenderingContext2D, b: Bubble) {
    // A fresh bubble swells out of the robot's mouth (looks only; the hitbox is unchanged).
    const grow = b.flight > 0 ? Math.min(1, 0.45 + b.age / 10) : 1
    const r = (BUBBLE_R + (b.held ? 3 : 0)) * grow
    const warn = b.held !== null && b.holdLeft < 90
    const flicker = warn && Math.floor(this.tick / 4) % 2 === 1
    if (b.held) {
      if (warn) glow(g, b.x, b.y, r + 9, RAMPS.ember[2], 0.4)
      const set = b.held.angry ? ANGRY_FRAMES : GREMLIN_FRAMES[b.held.kind]!
      const jiggle = warn ? (Math.floor(this.tick / 3) % 2 ? 1 : -1) : 0
      drawSprite(g, set.trapped, b.x + jiggle, b.y + 1, {
        flipX: b.held.dir === -1,
      })
    }
    const wob = Math.sin((b.age + b.x) / 7) * 0.06
    g.save()
    g.translate(b.x, b.y)
    g.scale(1 + wob, 1 - wob)
    const film = g.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r)
    film.addColorStop(0, 'rgba(255, 255, 255, 0.55)')
    film.addColorStop(0.45, rgba(RAMPS.water[4], 0.1))
    if (flicker) {
      film.addColorStop(0.8, rgba(RAMPS.ember[3], 0.35))
      film.addColorStop(1, rgba(RAMPS.ember[2], 0.8))
    } else {
      film.addColorStop(0.8, rgba(RAMPS.teal[3], 0.25))
      film.addColorStop(1, rgba(RAMPS.sky[3], 0.75))
    }
    g.fillStyle = film
    g.beginPath()
    g.arc(0, 0, r, 0, Math.PI * 2)
    g.fill()
    // The rainbow sheen swirling round the film.
    const spin = this.tick / 16 + b.x / 30
    g.lineWidth = r > 8 ? 1.5 : 1
    SHEEN.forEach((colour, i) => {
      g.strokeStyle = colour
      g.beginPath()
      g.arc(0, 0, r * 0.78, spin + i * 0.5, spin + i * 0.5 + 0.5)
      g.stroke()
    })
    g.lineWidth = 1
    g.strokeStyle = INK
    g.beginPath()
    g.arc(0, 0, r + 0.5, 0, Math.PI * 2)
    g.stroke()
    g.strokeStyle = flicker ? RAMPS.ember[4] : 'rgba(255, 255, 255, 0.9)'
    g.beginPath()
    g.arc(0, 0, r - 0.5, Math.PI * 0.95, Math.PI * 1.6)
    g.stroke()
    g.strokeStyle = 'rgba(255, 255, 255, 0.4)'
    g.beginPath()
    g.arc(0, 0, r - 1.5, Math.PI * 0.15, Math.PI * 0.45)
    g.stroke()
    // The window highlight every 16-bit bubble has.
    g.fillStyle = '#ffffff'
    g.fillRect(Math.round(-r * 0.55), Math.round(-r * 0.6), 2, 2)
    g.fillRect(Math.round(-r * 0.65), Math.round(-r * 0.25), 1, 1)
    g.restore()
  }

  private renderPlayer(g: CanvasRenderingContext2D) {
    const p = this.player
    if (this.dead > 0) return
    this.castShadow(g, p.x, p.y, 6)
    if (this.invuln > 0 && Math.floor(this.tick / 4) % 2) return
    const still = this.ready > 0 || this.clear > 0
    let sprite = ROBOT.stand
    if (p.cooldown > SHOT_COOLDOWN - 8) sprite = ROBOT.blow
    else if (!p.onGround) sprite = ROBOT.jump
    else if (p.vx !== 0 && !still)
      sprite = ROBOT.run[Math.floor(this.tick / 6) % 2]!
    drawSprite(g, sprite, p.x, p.y + 1, {
      anchor: 'feet',
      flipX: p.face === -1,
    })
    // The antenna light pulses.
    glow(
      g,
      Math.round(p.x),
      p.y - 15,
      6,
      RAMPS.gold[3],
      0.4 + 0.25 * Math.sin(this.tick / 7),
    )
  }

  private renderHud(g: CanvasRenderingContext2D) {
    hudPanel(g, 3, 2, 80, 20)
    drawText(g, String(this.score).padStart(6, '0'), 8, 5, {
      scale: 2,
      color: RAMPS.gold[3],
      shadow: INK,
    })
    // Lives as little robot heads, with the chain count beneath while one runs.
    hudPanel(g, 88, 2, 62, 20)
    for (let i = 0; i < Math.min(this.lives, 5); i++) {
      drawSprite(g, LIFE_SPRITE, 92 + i * 11, 3, { anchor: 'topleft' })
    }
    if (this.chain > 1 && this.chainLeft > 0) {
      drawText(g, `CHAIN X${this.chain}`, 92, 14, {
        color: Math.floor(this.tick / 6) % 2 ? RAMPS.gold[4] : RAMPS.gold[3],
        outline: INK,
      })
    }
    const hi = `HI ${Math.max(this.hiScore, this.score)}`
    const round = `ROUND ${this.level}`
    const pw = Math.max(measureText(hi), measureText(round)) + 12
    hudPanel(g, W - 3 - pw, 2, pw, 20)
    drawText(g, hi, W - 9, 4, {
      align: 'right',
      color: RAMPS.pink[3],
      outline: INK,
    })
    drawText(g, round, W - 9, 13, {
      align: 'right',
      color: RAMPS.teal[3],
      outline: INK,
    })
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, 100, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.purple[1],
      })
      if (this.banner.sub) {
        drawText(g, this.banner.sub, W / 2, 120, {
          align: 'center',
          color: RAMPS.gold[3],
          outline: INK,
        })
      }
    }
  }
}

const bumperBubbles: ArcadeGameModule = {
  create: (options) => new BumperBubbles(options),
}

export const create = bumperBubbles.create
export default bumperBubbles
