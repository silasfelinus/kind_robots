// /utils/arcade/games/rescueRally.ts
//
// Rescue Rally -- the Kind Robots Arcade's arena-shooter riff (conductor
// kr-arcade/t-007). An android hero zips around a neon arena firing a kindness
// beam that reboots glitched drones into friendly bots, while wandering
// people, pets and little bots wait to be rescued for a growing multiplier.
// Moving aims; A fires; holding B strafes (keeps the aim while you move).

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
  dropShadow,
  drawSprite,
  gauge,
  glow,
  hudPanel,
  mix,
  pixelSprite,
  rgba,
  shadedOrb,
  vignette,
} from '../snes'
import type { PixelSprite, Ramp } from '../snes'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'

const W = 480
const H = 360
const ARENA = { left: 12, top: 28, right: W - 12, bottom: H - 16 }

const PLAYER_SPEED = 1.9
const PLAYER_RADIUS = 6
const SHOT_SPEED = 6.5
const SHOT_LIFE = 70
const MAX_SHOTS = 6
const FIRE_COOLDOWN = 6
const START_LIVES = 3
const EXTRA_LIFE_EVERY = 25_000
const RESCUE_STEP = 1000
const RESCUE_CAP = 5

export const RALLY_CURVES = {
  drones: { start: 14, step: 4, limit: 50 },
  droneSpeed: { start: 0.55, step: 0.08, limit: 1.4 },
  puddles: { start: 2, step: 2, limit: 14 },
  spawners: { start: 0, step: 0.75, limit: 5 },
  tanks: { start: -1, step: 0.75, limit: 5 },
  rescuees: { start: 4, step: 1, limit: 9 },
  spawnEvery: { start: 240, step: -15, limit: 90 },
} as const

type Kind = 'drone' | 'spawner' | 'seeker' | 'tank' | 'puddle'
type Foe = {
  kind: Kind
  x: number
  y: number
  vx: number
  vy: number
  hp: number
  timer: number
  seed: number
}
type RescueeKind = 'person' | 'cat' | 'dog' | 'bot'
type Rescuee = {
  kind: RescueeKind
  x: number
  y: number
  vx: number
  vy: number
  turn: number
  color: string
  skin: string
}
type Shot = { x: number; y: number; vx: number; vy: number; life: number }
type Spark = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  color: string
}
type Floater = {
  x: number
  y: number
  text: string
  life: number
  color: string
}

const FOE_RADIUS: Record<Kind, number> = {
  drone: 6,
  spawner: 9,
  seeker: 4,
  tank: 10,
  puddle: 6,
}
const FOE_POINTS: Record<Kind, number> = {
  drone: 100,
  spawner: 500,
  seeker: 150,
  tank: 300,
  puddle: 25,
}
const FOE_HP: Record<Kind, number> = {
  drone: 1,
  spawner: 3,
  seeker: 1,
  tank: 5,
  puddle: 1,
}

const SHIRTS = [
  '#f472b6',
  '#38bdf8',
  '#facc15',
  '#4ade80',
  '#fb923c',
  '#a78bfa',
]
const SKINS = ['#fde7d6', '#f1c27d', '#c68642', '#8d5524', '#5c3a21']

// --- 16-bit art (utils/arcade/snes.ts) -------------------------------------------

const TILE = 24
const ARENA_W = ARENA.right - ARENA.left
const ARENA_H = ARENA.bottom - ARENA.top

/** Glitch goo: a lime ramp the kit lacks. */
const LIME: Ramp = ['#1a2e05', '#365314', '#65a30d', '#a3e635', '#ecfccb']

/** Each wave lays a different floor: [band dark, band light], seam light, emblem ramp. */
const FLOOR_THEMES: ReadonlyArray<{
  bands: readonly [string, string]
  seam: string
  accent: Ramp
}> = [
  {
    bands: [RAMPS.night[1], RAMPS.night[3]],
    seam: RAMPS.purple[3],
    accent: RAMPS.teal,
  },
  {
    bands: ['#08202c', '#14485a'],
    seam: RAMPS.teal[3],
    accent: RAMPS.pink,
  },
  {
    bands: ['#220c2c', '#4a1c54'],
    seam: RAMPS.pink[3],
    accent: RAMPS.gold,
  },
]

const HERO_PALETTE = {
  A: RAMPS.gold[3],
  a: RAMPS.teal[1],
  P: RAMPS.pink[3],
  p: RAMPS.pink[2],
  q: RAMPS.pink[1],
  F: '#fde7d6',
  f: RAMPS.cream[2],
  c: RAMPS.pink[2],
  k: INK,
  w: '#ffffff',
  H: RAMPS.teal[4],
  T: RAMPS.teal[2],
  t: RAMPS.teal[1],
  d: RAMPS.teal[0],
  g: RAMPS.gold[3],
  s: RAMPS.steel[3],
  S: RAMPS.steel[1],
}
const HERO_FRONT_TOP = [
  '..A....A..',
  '..a....a..',
  '.pPPppPPp.',
  'pPPPPPPPPq',
  'pPFFFFFFPq',
  'pFkwFFkwFq',
  'qFkkFFkkFq',
  '.qcFFFFcq.',
  '...fFFf...',
  '..tTTTTd..',
  '.HTTggTTd.',
  'HTTTggTTtd',
  'FtTTTTTTdF',
  '..tTTTTd..',
]
const HERO_BACK_TOP = [
  '..A....A..',
  '..a....a..',
  '.pPPppPPp.',
  'pPPPPPPPPq',
  'pPPPPPPPPq',
  'pPPpPPpPPq',
  'qpPPPPPPpq',
  '.qpPPPPpq.',
  '...qppq...',
  '..tTTTTd..',
  '.HTsSSsTd.',
  'HTTsSgsTtd',
  'FtTsSSsTdF',
  '..tTTTTd..',
]
const HERO_SIDE_TOP = [
  '....A.....',
  '....a.....',
  '..pPPPp...',
  '.pPPPPPPp.',
  'pPPPPFFFF.',
  'pPPPFFFkw.',
  'qPPPFFFkk.',
  '.qqPFFFFc.',
  '...qfFFf..',
  '....tTTd..',
  '...HTTgTd.',
  '...HTTTTFg',
  '...tTTTd..',
  '....tTTd..',
]
const FRONT_LEGS = [
  ['..ss..ss..', '..SS..ss..', '......SS..'],
  ['..ss..ss..', '..ss..SS..', '..SS......'],
] as const
const SIDE_LEGS = [
  ['....s.s...', '...s...s..', '..SS...SS.'],
  ['....ss....', '....ss....', '....SSS...'],
] as const
const heroFrames = (
  top: readonly string[],
  legs: readonly (readonly string[])[],
) =>
  [
    pixelSprite([...top, ...legs[0]!], HERO_PALETTE),
    pixelSprite([...top, ...legs[1]!], HERO_PALETTE),
  ] as const
const HERO_SPRITES = {
  front: heroFrames(HERO_FRONT_TOP, FRONT_LEGS),
  back: heroFrames(HERO_BACK_TOP, FRONT_LEGS),
  side: heroFrames(HERO_SIDE_TOP, SIDE_LEGS),
}

const DRONE_PALETTE = {
  R: RAMPS.ember[3],
  h: RAMPS.purple[4],
  H: RAMPS.purple[3],
  P: RAMPS.purple[2],
  p: RAMPS.purple[1],
  d: RAMPS.purple[0],
  k: INK,
  r: RAMPS.ember[2],
  c: RAMPS.teal[3],
}
const DRONE_TOP = [
  '.....RR.....',
  '.....pp.....',
  '..hHHHHHHp..',
  '.hHPPPcPPPp.',
  '.HPkkkkkkPp.',
  '.HPkRrrrRkp.',
  '.HPkkkkkkPp.',
  '.pPPPPPPPpd.',
  '..pppppddd..',
]
const DRONE_SPRITES = [
  pixelSprite([...DRONE_TOP, '..pd....pd..', '.dd......dd.'], DRONE_PALETTE),
  pixelSprite([...DRONE_TOP, '...pd..pd...', '...dd..dd...'], DRONE_PALETTE),
] as const

/** A drone after the beam reboots it: same chassis, friendly green, happy eyes. */
const FREED_SPRITES = [0, 1].map((frame) =>
  pixelSprite(
    [
      '.....YY.....',
      '.....ll.....',
      '..hHHHHHHl..',
      '.hHLLLLLLLl.',
      '.HLkkkkkkLl.',
      '.HLkYkkYkLl.',
      '.HLkkYYkkLl.',
      '.lLLLLLLLld.',
      '..llllllld..',
      frame ? '...y....y...' : '....y..y....',
    ],
    {
      Y: RAMPS.gold[4],
      y: RAMPS.gold[3],
      h: RAMPS.leaf[4],
      H: RAMPS.leaf[3],
      L: RAMPS.leaf[2],
      l: RAMPS.leaf[1],
      d: RAMPS.leaf[0],
      k: INK,
    },
  ),
)

const SEEKER_PALETTE = {
  h: RAMPS.pink[4],
  H: RAMPS.pink[3],
  r: RAMPS.pink[2],
  d: RAMPS.pink[1],
  w: '#ffffff',
}
const SEEKER_SPRITES = [
  pixelSprite(
    [
      '...h...',
      '..hHr..',
      '.hHwrr.',
      'hHwrrrd',
      '.rrrrd.',
      '..rdd..',
      '...d...',
    ],
    SEEKER_PALETTE,
  ),
  pixelSprite(
    [
      '...h...',
      '..hrr..',
      '.hrHrr.',
      'hrHwHrd',
      '.rrHrd.',
      '..rdd..',
      '...d...',
    ],
    SEEKER_PALETTE,
  ),
] as const

/** Top-down tank, treads above and below; three tread frames so they roll. */
const TANK_SPRITES = [0, 1, 2].map((frame) => {
  const tread = (row: number) =>
    Array.from({ length: 22 }, (_, i) =>
      (i + row + 3 - frame) % 3 === 0 ? 't' : 'T',
    ).join('')
  return pixelSprite(
    [
      tread(0),
      tread(1),
      tread(0),
      '.hHHHHHHHHHHHHHHHHHHs.',
      '.HSSSSSSSSSSSSSSSSSSd.',
      '.HSSkkkkkkkkkkkkkkSSd.',
      '.HSSkkkkkkkkkkkkkkSSd.',
      '.HSSkkkkkkkkkkkkkkSSd.',
      '.HSSSSSSSSSSSSSSSSSSd.',
      '.dddddddddddddddddddd.',
      tread(0),
      tread(1),
      tread(0),
    ],
    {
      h: RAMPS.steel[4],
      H: RAMPS.steel[3],
      S: RAMPS.steel[2],
      s: RAMPS.steel[1],
      d: RAMPS.steel[1],
      T: RAMPS.steel[1],
      t: RAMPS.steel[0],
      k: INK,
    },
  )
})

const HAIRS = ['#3b2417', '#6b3a1e', '#1f1a2e', '#b45309', '#f5d0a0']
/** Every shirt and skin pairing, two walk frames each, baked once. */
const PEOPLE = new Map<string, readonly [PixelSprite, PixelSprite]>()
SHIRTS.forEach((shirt, si) =>
  SKINS.forEach((skin, ki) => {
    const top = [
      '..hhh..',
      '.hhhhh.',
      '.hSkSk.',
      '.hSSSS.',
      '..sSs..',
      '.CCCCc.',
      'CCCCCcc',
      'SCCCCcS',
      '.CCCcc.',
    ]
    const palette = {
      h: HAIRS[(si + ki) % HAIRS.length]!,
      S: skin,
      s: mix(skin, INK, 0.3),
      k: INK,
      C: shirt,
      c: mix(shirt, INK, 0.35),
      b: RAMPS.sky[1],
      B: RAMPS.sky[0],
    }
    PEOPLE.set(`${shirt}|${skin}`, [
      pixelSprite([...top, '.bb.bB.', '.B...B.'], palette),
      pixelSprite([...top, '..bbB..', '..BB...'], palette),
    ])
  }),
)

const CAT_PALETTE = {
  H: RAMPS.gold[3],
  G: RAMPS.gold[2],
  s: RAMPS.rust[2],
  d: RAMPS.gold[1],
  k: INK,
  p: RAMPS.pink[3],
}
const CAT_TOP = [
  '.......G.G.',
  'G......GGGG',
  'G......GkGk',
  '.G.....GGpG',
  '.GHHHHHHGd.',
  '..GsGsGGGd.',
  '..ddddddd..',
]
const CAT_SPRITES = [
  pixelSprite([...CAT_TOP, '..d.d..d.d.'], CAT_PALETTE),
  pixelSprite([...CAT_TOP, '...d.d..d.d'], CAT_PALETTE),
] as const

const DOG_PALETTE = {
  W: RAMPS.cream[3],
  w: RAMPS.cream[2],
  c: RAMPS.cream[1],
  e: RAMPS.earth[2],
  b: RAMPS.earth[3],
  k: INK,
}
const DOG_TOP = [
  '........WWW.',
  'w......eWkWW',
  'w......eWWWk',
  '.wWWWWWWWWW.',
  '.WWWbbWWWWc.',
  '.ccccccccc..',
]
const DOG_SPRITES = [
  pixelSprite([...DOG_TOP, '.c.c....c.c.'], DOG_PALETTE),
  pixelSprite([...DOG_TOP, '..c.c..c.c..'], DOG_PALETTE),
] as const

const BOT_PALETTE = {
  Y: RAMPS.gold[3],
  a: RAMPS.steel[3],
  h: RAMPS.sky[4],
  H: RAMPS.sky[3],
  S: RAMPS.sky[2],
  s: RAMPS.sky[1],
  d: RAMPS.sky[0],
  k: INK,
}
const BOT_TOP = [
  '...Y...',
  '...a...',
  '.hHHHs.',
  'hHYHYSd',
  'HSSSSSd',
  '.sSSSd.',
]
const BOT_SPRITES = [
  pixelSprite([...BOT_TOP, '.d...d.', '.k...k.'], BOT_PALETTE),
  pixelSprite([...BOT_TOP, '..d.d..', '..k.k..'], BOT_PALETTE),
] as const

const HEART_PALETTE = { P: RAMPS.pink[2], H: RAMPS.pink[4], p: RAMPS.pink[1] }
const HEART_SPRITE = pixelSprite(
  ['.PP.PP.', 'PHPPPPp', 'PPPPPPp', '.PPPPp.', '..PPp..', '...p...'],
  HEART_PALETTE,
)
/** The little "help!" heart that blinks over anyone waiting for rescue. */
const HELP_SPRITE = pixelSprite(
  ['HP.Pp', 'PPPPp', '.PPp.', '..p..'],
  HEART_PALETTE,
)

function clampToArena(o: { x: number; y: number }, r: number) {
  o.x = Math.min(ARENA.right - r, Math.max(ARENA.left + r, o.x))
  o.y = Math.min(ARENA.bottom - r, Math.max(ARENA.top + r, o.y))
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

class RescueRally implements ArcadeGameInstance {
  score = 0
  level = 0
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private player = { x: W / 2, y: H / 2, aimX: 0, aimY: -1, walk: 0 }
  private alive = true
  private respawn = 0
  private invuln = 0
  private fireCooldown = 0
  private shots: Shot[] = []
  private foes: Foe[] = []
  private rescuees: Rescuee[] = []
  private sparks: Spark[] = []
  private floaters: Floater[] = []
  private freed: Array<{ x: number; y: number; life: number }> = []
  private multiplier = 1
  private nextExtra = EXTRA_LIFE_EVERY
  private waveDelay = 0
  private banner: { text: string; sub?: string; ticks: number } | null = null
  private overTimer = 0
  // Cosmetic sparkles and rescue rings roll their own dice, so the seeded rng is untouched.
  private fx = new Sparkles()
  private fxRng = backdropRng(41)
  private rings: Array<{ x: number; y: number; life: number }> = []

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.startWave(1)
  }

  // --- setup ---------------------------------------------------------------

  private spot(minDistance: number): { x: number; y: number } {
    for (let attempt = 0; attempt < 50; attempt++) {
      const p = {
        x: ARENA.left + 16 + this.rng() * (ARENA.right - ARENA.left - 32),
        y: ARENA.top + 16 + this.rng() * (ARENA.bottom - ARENA.top - 32),
      }
      if (dist(p, this.player) >= minDistance) return p
    }
    return { x: ARENA.left + 20, y: ARENA.top + 20 }
  }

  private addFoe(kind: Kind, at?: { x: number; y: number }) {
    const p = at ?? this.spot(kind === 'puddle' ? 60 : 110)
    this.foes.push({
      kind,
      x: p.x,
      y: p.y,
      vx: 0,
      vy: 0,
      hp: FOE_HP[kind],
      timer: Math.floor(this.rng() * 120),
      seed: this.rng() * 100,
    })
  }

  private startWave(wave: number) {
    this.level = wave
    this.foes = []
    this.shots = []
    this.rescuees = []
    this.multiplier = 1
    Object.assign(this.player, { x: W / 2, y: H / 2 })
    const count = (spec: { start: number; step: number; limit: number }) =>
      Math.max(0, Math.floor(levelCurve(wave, spec)))
    for (let i = 0; i < count(RALLY_CURVES.drones); i++) this.addFoe('drone')
    for (let i = 0; i < count(RALLY_CURVES.puddles); i++) this.addFoe('puddle')
    for (let i = 0; i < count(RALLY_CURVES.spawners); i++)
      this.addFoe('spawner')
    for (let i = 0; i < count(RALLY_CURVES.tanks); i++) this.addFoe('tank')
    const kinds: RescueeKind[] = ['person', 'person', 'cat', 'dog', 'bot']
    for (let i = 0; i < count(RALLY_CURVES.rescuees); i++) {
      const p = this.spot(50)
      this.rescuees.push({
        kind: kinds[i % kinds.length]!,
        x: p.x,
        y: p.y,
        vx: 0,
        vy: 0,
        turn: 0,
        color: SHIRTS[Math.floor(this.rng() * SHIRTS.length)]!,
        skin: SKINS[Math.floor(this.rng() * SKINS.length)]!,
      })
    }
    this.invuln = 90
    this.banner = { text: `WAVE ${wave}`, ticks: 90 }
  }

  // --- update ----------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    if (this.lives <= 0 && !this.alive) {
      if (++this.overTimer > 100) this.over = true
      return
    }
    if (this.waveDelay > 0) {
      if (--this.waveDelay === 0) this.startWave(this.level + 1)
      return
    }
    if (!this.alive) {
      if (--this.respawn <= 0) this.revive()
      return
    }

    const controls = this.demo ? this.demoInput() : input
    this.movePlayer(controls)
    this.moveFoes()
    this.moveRescuees()
    this.moveShots()
    this.collide()

    const hostile = this.foes.some((f) => f.kind !== 'puddle')
    if (!hostile && this.waveDelay === 0) {
      this.waveDelay = 120
      this.sound.play('level')
      this.banner = {
        text: 'WAVE CLEAR!',
        sub: this.rescuees.length ? 'EVERYONE WALKS HOME SAFE' : 'ALL RESCUED!',
        ticks: 120,
      }
    }
  }

  private movePlayer(input: InputFrame) {
    const p = this.player
    let dx = 0
    let dy = 0
    if (input.held.left) dx -= 1
    if (input.held.right) dx += 1
    if (input.held.up) dy -= 1
    if (input.held.down) dy += 1
    if (dx || dy) {
      const len = Math.hypot(dx, dy)
      p.x += (dx / len) * PLAYER_SPEED
      p.y += (dy / len) * PLAYER_SPEED
      p.walk += 0.3
      if (!input.held.b) {
        p.aimX = dx / len
        p.aimY = dy / len
      }
    }
    clampToArena(p, PLAYER_RADIUS)
    if (this.fireCooldown > 0) this.fireCooldown--
    if (
      input.held.a &&
      this.fireCooldown === 0 &&
      this.shots.length < MAX_SHOTS
    ) {
      this.shots.push({
        x: p.x + p.aimX * 8,
        y: p.y + p.aimY * 8,
        vx: p.aimX * SHOT_SPEED,
        vy: p.aimY * SHOT_SPEED,
        life: SHOT_LIFE,
      })
      this.fireCooldown = FIRE_COOLDOWN
      this.sound.play('shoot')
    }
    if (this.invuln > 0) this.invuln--
  }

  private moveFoes() {
    const p = this.player
    const droneSpeed = levelCurve(this.level, RALLY_CURVES.droneSpeed)
    const spawnEvery = Math.round(
      levelCurve(this.level, RALLY_CURVES.spawnEvery),
    )
    const born: Foe[] = []
    for (const f of this.foes) {
      f.timer++
      const toX = p.x - f.x
      const toY = p.y - f.y
      const len = Math.hypot(toX, toY) || 1
      switch (f.kind) {
        case 'drone': {
          // Shuffle toward the hero in little steps, like a wind-up toy.
          if (f.timer % 12 === 0) {
            const jitter = (this.rng() - 0.5) * 0.6
            f.vx = (toX / len + jitter) * droneSpeed * 2
            f.vy = (toY / len - jitter) * droneSpeed * 2
          }
          const stepping = f.timer % 12 < 7
          f.x += stepping ? f.vx : 0
          f.y += stepping ? f.vy : 0
          break
        }
        case 'seeker':
          f.vx = f.vx * 0.94 + (toX / len) * 0.22
          f.vy = f.vy * 0.94 + (toY / len) * 0.22
          f.x += f.vx
          f.y += f.vy
          break
        case 'tank':
          f.x += (toX / len) * droneSpeed * 0.45
          f.y += (toY / len) * droneSpeed * 0.45
          break
        case 'spawner':
          f.x += Math.cos(f.timer / 60 + f.seed) * 0.4
          f.y += Math.sin(f.timer / 47 + f.seed) * 0.4
          if (f.timer % spawnEvery === 0) {
            born.push({
              kind: 'seeker',
              x: f.x,
              y: f.y,
              vx: 0,
              vy: 0,
              hp: 1,
              timer: 0,
              seed: 0,
            })
            this.sound.play('warn')
          }
          break
        case 'puddle':
          break
      }
      clampToArena(f, FOE_RADIUS[f.kind])
    }
    this.foes.push(...born)
  }

  private moveRescuees() {
    for (const r of this.rescuees) {
      if (--r.turn <= 0) {
        const a = this.rng() * Math.PI * 2
        const speed = r.kind === 'bot' ? 0.5 : 0.35
        r.vx = Math.cos(a) * speed
        r.vy = Math.sin(a) * speed
        r.turn = 60 + Math.floor(this.rng() * 90)
      }
      r.x += r.vx
      r.y += r.vy
      if (r.x < ARENA.left + 6 || r.x > ARENA.right - 6) r.vx *= -1
      if (r.y < ARENA.top + 6 || r.y > ARENA.bottom - 6) r.vy *= -1
      clampToArena(r, 6)
    }
  }

  private moveShots() {
    for (const s of this.shots) {
      s.x += s.vx
      s.y += s.vy
      s.life--
      if (
        s.x < ARENA.left ||
        s.x > ARENA.right ||
        s.y < ARENA.top ||
        s.y > ARENA.bottom
      ) {
        s.life = 0
      }
    }
    this.shots = this.shots.filter((s) => s.life > 0)
  }

  private collide() {
    for (const s of this.shots) {
      const hit = this.foes.findIndex(
        (f) => dist(s, f) < FOE_RADIUS[f.kind] + 2,
      )
      if (hit < 0) continue
      s.life = 0
      const foe = this.foes[hit]!
      if (foe.kind === 'tank') {
        // Tanks get nudged back by the beam.
        foe.x += s.vx * 1.5
        foe.y += s.vy * 1.5
      }
      if (--foe.hp > 0) {
        this.sound.play('blip')
        continue
      }
      this.foes.splice(hit, 1)
      this.addScore(FOE_POINTS[foe.kind], foe.x, foe.y, '#fde68a')
      this.burst(foe.x, foe.y, foe.kind === 'drone' ? 8 : 16, foe.kind)
      if (foe.kind === 'drone' || foe.kind === 'tank') {
        this.freed.push({ x: foe.x, y: foe.y, life: 60 })
        this.fx.burst(foe.x, foe.y, this.fxRng, {
          count: 6,
          speed: 1.2,
          colours: [RAMPS.leaf[3], RAMPS.teal[3], RAMPS.gold[4]],
        })
      }
      this.sound.play(foe.kind === 'spawner' ? 'boom' : 'pop')
    }
    this.shots = this.shots.filter((s) => s.life > 0)

    const p = this.player
    for (let i = this.rescuees.length - 1; i >= 0; i--) {
      const r = this.rescuees[i]!
      if (dist(r, p) < PLAYER_RADIUS + 6) {
        this.rescuees.splice(i, 1)
        const points = RESCUE_STEP * this.multiplier
        this.addScore(points, r.x, r.y, '#86efac')
        this.multiplier = Math.min(RESCUE_CAP, this.multiplier + 1)
        this.sound.play('pickup')
        this.fx.burst(r.x, r.y - 4, this.fxRng, { count: 14, speed: 1.8 })
        this.rings.push({ x: r.x, y: r.y, life: 24 })
      }
    }

    if (this.invuln > 0) return
    const touched = this.foes.some(
      (f) => dist(f, p) < FOE_RADIUS[f.kind] + PLAYER_RADIUS - 2,
    )
    if (touched) this.loseLife()
  }

  private loseLife() {
    this.alive = false
    this.lives--
    this.respawn = 90
    this.multiplier = 1
    this.shots = []
    this.burst(this.player.x, this.player.y, 30, 'player')
    this.sound.play('die')
    if (this.lives <= 0) this.banner = { text: 'GAME OVER', ticks: 9999 }
  }

  private revive() {
    Object.assign(this.player, { x: W / 2, y: H / 2 })
    // Move anything crowding the middle back out to the edges.
    for (const f of this.foes) {
      if (f.kind !== 'puddle' && dist(f, this.player) < 100) {
        const a = Math.atan2(f.y - this.player.y, f.x - this.player.x)
        f.x = this.player.x + Math.cos(a) * 140
        f.y = this.player.y + Math.sin(a) * 120
        clampToArena(f, FOE_RADIUS[f.kind])
      }
    }
    this.alive = true
    this.invuln = 120
  }

  private addScore(points: number, x: number, y: number, color: string) {
    if (this.demo) return
    this.score += points
    this.floaters.push({ x, y, text: String(points), life: 50, color })
    if (this.score >= this.nextExtra) {
      this.lives++
      this.nextExtra += EXTRA_LIFE_EVERY
      this.sound.play('extra')
      this.banner = { text: 'EXTRA HERO!', ticks: 90 }
    }
  }

  private burst(x: number, y: number, count: number, kind: Kind | 'player') {
    const colors =
      kind === 'player'
        ? ['#f472b6', '#2dd4bf', '#fde68a']
        : kind === 'puddle'
          ? ['#a3e635', '#4d7c0f']
          : ['#a78bfa', '#86efac', '#e0e7ff']
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.5 + this.rng() * 2.2
      this.sparks.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 20 + Math.floor(this.rng() * 25),
        max: 45,
        color: colors[i % colors.length]!,
      })
    }
  }

  private updateEffects() {
    for (const s of this.sparks) {
      s.x += s.vx
      s.y += s.vy
      s.vx *= 0.94
      s.vy *= 0.94
      s.life--
    }
    this.sparks = this.sparks.filter((s) => s.life > 0)
    for (const f of this.floaters) {
      f.y -= 0.35
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
    for (const f of this.freed) {
      f.y -= 0.6
      f.life--
    }
    this.freed = this.freed.filter((f) => f.life > 0)
    this.fx.update()
    for (const r of this.rings) r.life--
    this.rings = this.rings.filter((r) => r.life > 0)
  }

  // --- attract-mode pilot --------------------------------------------------------

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
    let threat: Foe | null = null
    let threatDistance = Infinity
    let target: Foe | null = null
    let targetDistance = Infinity
    for (const f of this.foes) {
      const d = dist(f, p)
      if (f.kind !== 'puddle' && d < threatDistance) {
        threat = f
        threatDistance = d
      }
      if (d < targetDistance && f.kind !== 'tank') {
        target = f
        targetDistance = d
      }
    }
    let moveX = 0
    let moveY = 0
    if (threat && threatDistance < 70) {
      moveX = p.x - threat.x
      moveY = p.y - threat.y
    } else {
      const friend = this.rescuees.reduce<Rescuee | null>(
        (best, r) => (!best || dist(r, p) < dist(best, p) ? r : best),
        null,
      )
      if (friend) {
        moveX = friend.x - p.x
        moveY = friend.y - p.y
      }
    }
    if (target) {
      // Face the target this tick, then strafe so the movement below keeps it.
      const ax = target.x - p.x
      const ay = target.y - p.y
      const len = Math.hypot(ax, ay) || 1
      p.aimX = ax / len
      p.aimY = ay / len
      held.a = targetDistance < 220
    }
    held.b = true
    const threshold = 6
    if (moveX < -threshold) held.left = true
    if (moveX > threshold) held.right = true
    if (moveY < -threshold) held.up = true
    if (moveY > threshold) held.down = true
    return frame
  }

  // --- render ------------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    this.renderArena(g)
    for (const f of this.foes) if (f.kind === 'puddle') this.renderPuddle(g, f)
    for (const r of this.rescuees) this.renderRescuee(g, r)
    for (const f of this.freed) this.renderFreed(g, f)
    for (const f of this.foes) if (f.kind !== 'puddle') this.renderFoe(g, f)
    this.renderShots(g)
    g.save()
    g.globalCompositeOperation = 'lighter'
    for (const s of this.sparks) {
      const t = Math.max(0, s.life / s.max)
      const size = t > 0.5 ? 2 : 1
      g.globalAlpha = Math.min(1, t * 1.6)
      g.fillStyle = s.color
      g.fillRect(Math.round(s.x) - 1, Math.round(s.y) - 1, size + 1, size + 1)
      if (size > 1) {
        g.fillStyle = '#ffffff'
        g.fillRect(Math.round(s.x), Math.round(s.y), 1, 1)
      }
    }
    g.restore()
    if (
      this.alive &&
      !(this.invuln > 0 && Math.floor(this.invuln / 5) % 2 === 0)
    ) {
      this.renderHero(g)
    }
    this.renderRings(g)
    this.fx.render(g)
    for (const f of this.floaters) {
      drawText(g, f.text, f.x, f.y, {
        align: 'center',
        color: f.color,
        outline: INK,
      })
    }
    vignette(g, W, H, 0.3)
    this.renderHud(g)
  }

  private renderArena(g: CanvasRenderingContext2D) {
    const theme = (Math.max(1, this.level) - 1) % FLOOR_THEMES.length
    const look = FLOOR_THEMES[theme]!
    // Plated walls, a raised bevelled rim and a tiled floor, painted once per theme.
    cachedLayer(g, `rescue-rally-arena-${theme}`, W, H, (k) => {
      bandedGradient(
        k,
        0,
        0,
        W,
        H,
        [RAMPS.night[0], RAMPS.night[1], RAMPS.night[0]],
        4,
      )
      // Wall plating seams and rivets in the margins around the arena.
      for (let y = 0; y < H; y += TILE) {
        k.fillStyle = INK
        k.fillRect(0, y, ARENA.left - 4, 1)
        k.fillRect(ARENA.right + 4, y, W - ARENA.right - 4, 1)
        k.fillStyle = RAMPS.night[3]
        k.fillRect(0, y + 1, ARENA.left - 4, 1)
        k.fillRect(ARENA.right + 4, y + 1, W - ARENA.right - 4, 1)
        k.fillStyle = RAMPS.steel[1]
        k.fillRect(3, y + 12, 2, 2)
        k.fillRect(W - 5, y + 12, 2, 2)
        k.fillStyle = RAMPS.steel[3]
        k.fillRect(3, y + 12, 1, 1)
        k.fillRect(W - 5, y + 12, 1, 1)
      }
      // The raised rim: lit on the top and left, shadowed bottom and right.
      bevel(
        k,
        ARENA.left - 4,
        ARENA.top - 4,
        ARENA_W + 8,
        ARENA_H + 8,
        RAMPS.purple,
        { depth: 2 },
      )
      k.fillStyle = INK
      k.fillRect(ARENA.left - 1, ARENA.top - 1, ARENA_W + 2, ARENA_H + 2)
      // The floor: HDMA bands, lighter under the overhead lamps in the middle.
      bandedGradient(k, ARENA.left, ARENA.top, ARENA_W, ARENA_H, [
        look.bands[0],
        look.bands[1],
        mix(look.bands[0], look.bands[1], 0.4),
        look.bands[0],
      ])
      for (let ty = 0, j = 0; ty < ARENA_H; ty += TILE, j++) {
        for (let tx = 0, i = 0; tx < ARENA_W; tx += TILE, i++) {
          const x = ARENA.left + tx
          const y = ARENA.top + ty
          const w = Math.min(TILE, ARENA_W - tx)
          const h = Math.min(TILE, ARENA_H - ty)
          if ((i + j) % 2) {
            k.fillStyle = rgba(INK, 0.16)
            k.fillRect(x, y, w, h)
          }
          k.fillStyle = rgba(look.seam, 0.2)
          k.fillRect(x, y, w, 1)
          k.fillRect(x, y, 1, h)
          k.fillStyle = rgba(INK, 0.45)
          k.fillRect(x, y + h - 1, w, 1)
          k.fillRect(x + w - 1, y, 1, h)
          k.fillStyle = rgba(look.seam, 0.45)
          k.fillRect(x + 1, y + 1, 1, 1)
        }
      }
      // Floor furniture: vent grilles and little lamp panels, laid out by a fixed seed.
      const rand = backdropRng(97 + theme)
      for (let n = 0; n < 16; n++) {
        const tx = ARENA.left + Math.floor(rand() * 19) * TILE
        const ty = ARENA.top + Math.floor(rand() * 13) * TILE
        if (n % 3 === 0) {
          // A recessed floor lamp, dim so it never reads as a pickup.
          const lamp: Ramp = [
            INK,
            look.accent[0],
            look.accent[1],
            look.accent[2],
            look.accent[3],
          ]
          bevel(k, tx + 8, ty + 8, 8, 8, RAMPS.steel, {
            depth: 1,
            outline: INK,
          })
          bevel(k, tx + 10, ty + 10, 4, 4, lamp, { depth: 1, outline: null })
          glow(k, tx + 12, ty + 12, 9, look.accent[2], 0.12)
        } else {
          for (let v = 0; v < 3; v++) {
            k.fillStyle = rgba(INK, 0.6)
            k.fillRect(tx + 5, ty + 7 + v * 4, 14, 2)
            k.fillStyle = rgba(look.seam, 0.25)
            k.fillRect(tx + 5, ty + 9 + v * 4, 14, 1)
          }
        }
      }
      // Hazard stripes in the four corners.
      for (const [cx, cy] of [
        [ARENA.left, ARENA.top],
        [ARENA.right - TILE, ARENA.top],
        [ARENA.left, ARENA.bottom - TILE],
        [ARENA.right - TILE, ARENA.bottom - TILE],
      ] as const) {
        k.save()
        k.beginPath()
        k.rect(cx + 3, cy + 3, TILE - 6, TILE - 6)
        k.clip()
        for (let s = -TILE; s < TILE; s += 6) {
          k.fillStyle = rgba(RAMPS.gold[2], 0.35)
          k.beginPath()
          k.moveTo(cx + s, cy + TILE)
          k.lineTo(cx + s + 3, cy + TILE)
          k.lineTo(cx + s + 3 + TILE, cy)
          k.lineTo(cx + s + TILE, cy)
          k.fill()
        }
        k.restore()
      }
      // The Kind Robots heart emblem painted on the middle of the floor.
      const cx = ARENA.left + ARENA_W / 2
      const cy = ARENA.top + ARENA_H / 2
      k.lineWidth = 3
      k.strokeStyle = rgba(look.accent[2], 0.2)
      k.beginPath()
      k.arc(cx, cy, 44, 0, Math.PI * 2)
      k.stroke()
      k.lineWidth = 1
      k.strokeStyle = rgba(look.accent[3], 0.2)
      k.beginPath()
      k.arc(cx, cy, 38, 0, Math.PI * 2)
      k.stroke()
      const heart = (size: number) => {
        k.beginPath()
        k.moveTo(cx, cy + size * 0.9)
        k.bezierCurveTo(
          cx - size * 1.4,
          cy - size * 0.1,
          cx - size * 0.7,
          cy - size * 1.1,
          cx,
          cy - size * 0.4,
        )
        k.bezierCurveTo(
          cx + size * 0.7,
          cy - size * 1.1,
          cx + size * 1.4,
          cy - size * 0.1,
          cx,
          cy + size * 0.9,
        )
        k.closePath()
      }
      heart(24)
      k.fillStyle = rgba(look.accent[1], 0.22)
      k.fill()
      k.lineWidth = 2
      k.strokeStyle = rgba(look.accent[3], 0.22)
      k.stroke()
      // Ambient occlusion where the floor meets the rim, light catching the far lip.
      k.fillStyle = rgba(INK, 0.5)
      k.fillRect(ARENA.left, ARENA.top, ARENA_W, 3)
      k.fillRect(ARENA.left, ARENA.top, 3, ARENA_H)
      k.fillStyle = rgba(INK, 0.25)
      k.fillRect(ARENA.left, ARENA.top + 3, ARENA_W, 3)
      k.fillRect(ARENA.left + 3, ARENA.top, 3, ARENA_H)
      k.fillStyle = rgba(look.seam, 0.3)
      k.fillRect(ARENA.left, ARENA.bottom - 1, ARENA_W, 1)
      k.fillRect(ARENA.right - 1, ARENA.top, 1, ARENA_H)
    })
    // The rim's inner edge breathes teal, and chase lights run around it.
    const pulse = 0.6 + 0.4 * Math.sin(this.tick / 20)
    g.fillStyle = rgba(RAMPS.teal[3], 0.55 * pulse)
    g.fillRect(ARENA.left - 1, ARENA.top - 1, ARENA_W + 2, 1)
    g.fillRect(ARENA.left - 1, ARENA.bottom, ARENA_W + 2, 1)
    g.fillRect(ARENA.left - 1, ARENA.top, 1, ARENA_H)
    g.fillRect(ARENA.right, ARENA.top, 1, ARENA_H)
    const chase = Math.floor(this.tick / 6)
    const light = (x: number, y: number, i: number) => {
      const lit = (i + chase) % 4 === 0
      g.fillStyle = INK
      g.fillRect(x - 1, y - 1, 3, 3)
      g.fillStyle = lit
        ? i % 2
          ? RAMPS.pink[4]
          : RAMPS.teal[4]
        : i % 2
          ? RAMPS.pink[1]
          : RAMPS.teal[1]
      g.fillRect(x, y, 1, 1)
      if (lit) glow(g, x, y, 6, i % 2 ? RAMPS.pink[3] : RAMPS.teal[3], 0.6)
    }
    let i = 0
    for (let x = ARENA.left + TILE / 2; x < ARENA.right; x += TILE, i++) {
      light(x, ARENA.top - 3, i)
      light(ARENA.right + ARENA.left - x, ARENA.bottom + 2, i)
    }
    for (let y = ARENA.top + TILE / 2; y < ARENA.bottom; y += TILE, i++) {
      light(ARENA.right + 2, y, i)
      light(ARENA.left - 3, ARENA.bottom + ARENA.top - y, i)
    }
  }

  private renderHero(g: CanvasRenderingContext2D) {
    const p = this.player
    const bob = Math.sin(p.walk) > 0.5 ? -1 : 0
    const frame = Math.floor(p.walk / 1.2) % 2
    // Facing comes from the aim; pixel sprites flip, never rotate.
    const vertical = Math.abs(p.aimY) > Math.abs(p.aimX) * 1.2
    const set = vertical
      ? p.aimY > 0
        ? HERO_SPRITES.front
        : HERO_SPRITES.back
      : HERO_SPRITES.side
    glow(g, p.x, p.y + 4, 26, RAMPS.teal[3], 0.16)
    dropShadow(g, p.x, p.y + 8, 6, 2, 0.4)
    drawSprite(g, set[frame ? 1 : 0], p.x, p.y + 8 + bob, {
      anchor: 'feet',
      flipX: !vertical && p.aimX < 0,
    })
    // The beam emitter's aim pip.
    const ax = Math.round(p.x + p.aimX * 12)
    const ay = Math.round(p.y + p.aimY * 12)
    glow(g, ax, ay, 5, RAMPS.gold[3], 0.6)
    g.fillStyle = RAMPS.gold[3]
    g.fillRect(ax - 1, ay, 3, 1)
    g.fillRect(ax, ay - 1, 1, 3)
    g.fillStyle = '#ffffff'
    g.fillRect(ax, ay, 1, 1)
  }

  private renderShots(g: CanvasRenderingContext2D) {
    if (!this.shots.length) return
    for (const s of this.shots) glow(g, s.x, s.y, 9, RAMPS.pink[3], 0.5)
    g.save()
    g.globalCompositeOperation = 'lighter'
    g.lineCap = 'round'
    for (const s of this.shots) {
      const tx = s.x - s.vx * 1.6
      const ty = s.y - s.vy * 1.6
      g.strokeStyle = rgba(RAMPS.pink[2], 0.6)
      g.lineWidth = 4
      g.beginPath()
      g.moveTo(tx, ty)
      g.lineTo(s.x, s.y)
      g.stroke()
      g.strokeStyle = RAMPS.gold[3]
      g.lineWidth = 2
      g.beginPath()
      g.moveTo(s.x - s.vx * 0.9, s.y - s.vy * 0.9)
      g.lineTo(s.x, s.y)
      g.stroke()
    }
    g.restore()
    g.fillStyle = '#ffffff'
    for (const s of this.shots) {
      g.fillRect(Math.round(s.x) - 1, Math.round(s.y) - 1, 2, 2)
    }
  }

  private renderFoe(g: CanvasRenderingContext2D, f: Foe) {
    switch (f.kind) {
      case 'drone': {
        const step = f.timer % 12 < 7 ? 1 : 0
        const sprite = DRONE_SPRITES[step]
        dropShadow(g, f.x, f.y + 7, 6, 1.8, 0.35)
        drawSprite(g, sprite, f.x, f.y + step)
        // Every so often the glitch tears a scanline sideways.
        const glitch = (this.tick + Math.floor(f.seed * 13)) % 53
        if (glitch < 3) {
          const band = Math.round(f.y) - 3 + glitch * 2
          g.save()
          g.beginPath()
          g.rect(f.x - 9, band, 18, 2)
          g.clip()
          drawSprite(g, sprite, f.x + (glitch % 2 ? 3 : -3), f.y + step)
          g.restore()
          g.fillStyle = rgba(RAMPS.teal[3], 0.85)
          g.fillRect(Math.round(f.x) - 9, band, 2, 1)
          g.fillStyle = rgba(RAMPS.ember[2], 0.85)
          g.fillRect(Math.round(f.x) + 7, band + 1, 2, 1)
        }
        break
      }
      case 'seeker': {
        const sprite = SEEKER_SPRITES[Math.floor(this.tick / 4) % 2 ? 1 : 0]
        glow(g, f.x, f.y, 9, RAMPS.pink[3], 0.45)
        drawSprite(g, sprite, f.x - f.vx * 3, f.y - f.vy * 3, { alpha: 0.35 })
        dropShadow(g, f.x, f.y + 7, 3, 1, 0.3)
        drawSprite(g, sprite, f.x, f.y)
        break
      }
      case 'tank': {
        const sprite = TANK_SPRITES[Math.floor(this.tick / 5) % 3]!
        dropShadow(g, f.x, f.y + 8, 12, 2.5, 0.4)
        drawSprite(g, sprite, f.x, f.y)
        // A scanning eye in the visor slot: red while healthy, gold when it is nearly rebooted.
        const eye = f.hp <= 2 ? RAMPS.gold : RAMPS.ember
        const ex = Math.round(f.x + Math.sin(this.tick / 14 + f.seed) * 4)
        const ey = Math.round(f.y)
        glow(g, ex, ey, 9, eye[3], 0.55)
        g.fillStyle = eye[2]
        g.fillRect(ex - 3, ey - 1, 6, 3)
        g.fillStyle = eye[4]
        g.fillRect(ex - 1, ey - 1, 2, 1)
        break
      }
      case 'spawner':
        this.renderSpawner(g, f)
        break
      case 'puddle':
        break
    }
  }

  private renderSpawner(g: CanvasRenderingContext2D, f: Foe) {
    // It throbs, so it is a shaded vector gem rather than a pixel sprite.
    const r = 9 + Math.sin(f.timer / 8) * 1.5
    const x = f.x
    const y = f.y
    const ramp = RAMPS.purple
    glow(g, x, y, r + 12, ramp[3], 0.45)
    dropShadow(g, x, y + 13, 7, 2, 0.3)
    const diamond = (k: number, colour: string) => {
      g.fillStyle = colour
      g.beginPath()
      g.moveTo(x, y - k)
      g.lineTo(x + k, y)
      g.lineTo(x, y + k)
      g.lineTo(x - k, y)
      g.closePath()
      g.fill()
    }
    diamond(r + 1.5, INK)
    diamond(r, ramp[2])
    // Lit upper-left facet, shadowed lower-right facet.
    g.fillStyle = ramp[3]
    g.beginPath()
    g.moveTo(x, y - r)
    g.lineTo(x - r, y)
    g.lineTo(x, y)
    g.closePath()
    g.fill()
    g.fillStyle = ramp[1]
    g.beginPath()
    g.moveTo(x, y + r)
    g.lineTo(x + r, y)
    g.lineTo(x, y)
    g.closePath()
    g.fill()
    g.fillStyle = ramp[0]
    g.beginPath()
    g.moveTo(x, y + r)
    g.lineTo(x + r * 0.5, y + r * 0.5)
    g.lineTo(x, y + r * 0.6)
    g.closePath()
    g.fill()
    g.fillStyle = ramp[4]
    g.fillRect(Math.round(x - r * 0.5), Math.round(y - r * 0.5), 2, 1)
    shadedOrb(g, x, y, 2.5, RAMPS.gold)
    glow(g, x, y, 6, RAMPS.gold[3], 0.5)
    // Glitch shards orbit it.
    for (let i = 0; i < 3; i++) {
      const a = f.timer / 14 + (i * Math.PI * 2) / 3
      const ox = Math.round(x + Math.cos(a) * (r + 6))
      const oy = Math.round(y + Math.sin(a) * (r + 6))
      g.fillStyle = INK
      g.fillRect(ox - 1, oy - 1, 3, 3)
      g.fillStyle = i % 2 ? RAMPS.teal[3] : RAMPS.ember[3]
      g.fillRect(ox, oy, 1, 1)
    }
  }

  private renderPuddle(g: CanvasRenderingContext2D, f: Foe) {
    const on = (this.tick + f.seed * 10) % 30 < 20
    const x = f.x
    const y = f.y
    const ramp = on ? LIME : ([INK, LIME[0], LIME[1], LIME[2], LIME[3]] as Ramp)
    const blob = (dx: number, dy: number, rx: number, ry: number) => {
      g.beginPath()
      g.ellipse(x + dx, y + dy, rx, ry, 0, 0, Math.PI * 2)
      g.fill()
    }
    if (on) glow(g, x, y, 13, LIME[3], 0.3)
    g.fillStyle = INK
    blob(0, 0, 8, 6)
    g.fillStyle = ramp[1]
    blob(0, 0, 7, 5)
    g.fillStyle = ramp[2]
    blob(-1, -0.5, 5.5, 3.5)
    g.fillStyle = ramp[3]
    blob(-2, -1.5, 2.5, 1.5)
    g.fillStyle = INK
    blob(1, 1, 2.5, 1.5)
    // Bubbles pop on the surface while it is live.
    if (on) {
      const b = Math.floor((this.tick + f.seed * 7) / 5) % 4
      g.fillStyle = LIME[4]
      g.fillRect(Math.round(x) - 4 + b * 2, Math.round(y) - 2 + (b % 2), 1, 1)
      g.fillStyle = LIME[3]
      g.fillRect(Math.round(x) + 3 - b, Math.round(y) + 2, 1, 1)
    }
  }

  private renderRescuee(g: CanvasRenderingContext2D, r: Rescuee) {
    const bob = Math.abs(Math.sin(this.tick / 6 + r.x)) * 1.2
    const x = r.x
    const y = r.y - bob
    const frame = Math.floor(this.tick / 7 + (r.vy > 0 ? 1 : 0)) % 2
    let sprites: readonly PixelSprite[]
    switch (r.kind) {
      case 'person':
        sprites = PEOPLE.get(`${r.color}|${r.skin}`)!
        break
      case 'cat':
        sprites = CAT_SPRITES
        break
      case 'dog':
        sprites = DOG_SPRITES
        break
      case 'bot':
        sprites = BOT_SPRITES
        break
    }
    dropShadow(g, r.x, r.y + 6, 5, 1.5, 0.35)
    drawSprite(g, sprites[frame]!, x, y + 6, {
      anchor: 'feet',
      flipX: r.vx < 0,
    })
    if (Math.floor(this.tick / 20) % 2 === 0) {
      glow(g, x, y - 14, 6, RAMPS.pink[3], 0.45)
      drawSprite(g, HELP_SPRITE, x, y - 14)
    }
  }

  private renderFreed(
    g: CanvasRenderingContext2D,
    f: { x: number; y: number; life: number },
  ) {
    const fade = Math.max(0, f.life / 60)
    glow(g, f.x, f.y, 12, RAMPS.leaf[3], 0.45 * fade)
    drawSprite(g, FREED_SPRITES[Math.floor(f.life / 4) % 2]!, f.x, f.y, {
      alpha: fade,
    })
  }

  private renderRings(g: CanvasRenderingContext2D) {
    if (!this.rings.length) return
    g.save()
    g.globalCompositeOperation = 'lighter'
    for (const r of this.rings) {
      const t = 1 - r.life / 24
      g.globalAlpha = 1 - t
      g.strokeStyle = RAMPS.leaf[3]
      g.lineWidth = 2
      g.beginPath()
      g.arc(r.x, r.y, 4 + t * 20, 0, Math.PI * 2)
      g.stroke()
      g.strokeStyle = RAMPS.gold[4]
      g.lineWidth = 1
      g.beginPath()
      g.arc(r.x, r.y, 2 + t * 12, 0, Math.PI * 2)
      g.stroke()
    }
    g.restore()
  }

  private renderHud(g: CanvasRenderingContext2D) {
    // Score, high score and lives sit in boxes in the strip above the rim.
    hudPanel(g, 4, 3, 96, 18)
    drawText(g, String(this.score).padStart(7, '0'), 11, 5, {
      scale: 2,
      color: RAMPS.teal[4],
      shadow: INK,
    })
    const hi = `HI ${Math.max(this.hiScore, this.score)}`
    const hiW = measureText(hi, 2) + 14
    hudPanel(g, Math.round(W / 2 - hiW / 2), 3, hiW, 18)
    drawText(g, hi, W / 2, 5, {
      scale: 2,
      align: 'center',
      color: RAMPS.gold[3],
      shadow: INK,
    })
    const lives = Math.min(this.lives, 6)
    if (lives > 0) {
      const w = lives * 17 + 5
      hudPanel(g, W - 4 - w, 3, w, 18)
      for (let i = 0; i < lives; i++) {
        drawSprite(g, HEART_SPRITE, W - 15 - i * 17, 12, { scale: 2 })
      }
    }
    // Wave and the rescue multiplier sit in boxes below the rim.
    const wave = `WAVE ${this.level}`
    hudPanel(g, 4, H - 13, measureText(wave) + 14, 11)
    drawText(g, wave, 11, H - 10, {
      color: RAMPS.purple[4],
      outline: INK,
    })
    const rescue = `RESCUE X${this.multiplier}`
    const rescueW = measureText(rescue)
    const panelW = rescueW + 74
    hudPanel(g, W - 4 - panelW, H - 13, panelW, 11)
    drawText(g, rescue, W - 4 - panelW + 7, H - 10, {
      color: RAMPS.leaf[3],
      outline: INK,
    })
    gauge(
      g,
      W - 63,
      H - 10,
      52,
      6,
      this.multiplier / RESCUE_CAP,
      this.multiplier >= RESCUE_CAP ? RAMPS.gold : RAMPS.leaf,
    )
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, H / 2 - 28, {
        scale: 3,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.pink[1],
      })
      if (this.banner.sub) {
        drawText(g, this.banner.sub, W / 2, H / 2 + 4, {
          scale: 2,
          align: 'center',
          color: RAMPS.leaf[3],
          outline: INK,
        })
      }
    }
  }
}

const rescueRally: ArcadeGameModule = {
  create: (options) => new RescueRally(options),
}

export const create = rescueRally.create
export default rescueRally
