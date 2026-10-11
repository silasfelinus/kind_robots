// /utils/arcade/games/butterflyBlaster.ts
//
// Butterfly Blaster -- the Kind Robots Arcade's Asteroids riff (Silas,
// 2026-10-06: "rainbow butterflies to kill mosquitoes, a la our malaria
// project"). A rainbow butterfly turns, flutters and drifts around a wrapping
// night sky, sparkling mosquito swarms that split big -> small -> single. AMI,
// the Anti-Malaria Intelligence, flies over now and then and drops a bed net
// that shields the butterfly. A malaria cloud hunts the player from wave 3.
// Every wave cleared keeps one more village safe.

import { levelCurve } from '../curve'
import { drawText } from '../font'
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
  drawStars,
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
import type { Ramp } from '../snes'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'

const W = 480
const H = 360

const TURN = 0.075
const THRUST = 0.12
const MAX_SPEED = 4.2
const FRICTION = 0.992
const SHOT_SPEED = 6.5
const SHOT_LIFE = 48
const MAX_SHOTS = 5
const FIRE_COOLDOWN = 8
const AUTOFIRE_COOLDOWN = 14
const HOP_COOLDOWN = 60
const RESPAWN_TICKS = 120
const INVULN_TICKS = 150
const SHIELD_TICKS = 480
const EXTRA_LIFE_EVERY = 10_000
const START_LIVES = 3
const SHIP_RADIUS = 9

type Size = 1 | 2 | 3
const SWARM_RADIUS: Record<Size, number> = { 3: 26, 2: 15, 1: 7 }
const SWARM_POINTS: Record<Size, number> = { 3: 20, 2: 50, 1: 100 }
const SWARM_SPEED: Record<Size, number> = { 3: 0.6, 2: 1.0, 1: 1.5 }
const SWARM_COUNT: Record<Size, number> = { 3: 9, 2: 5, 1: 1 }

const RAINBOW = [
  '#ef4444',
  '#f97316',
  '#facc15',
  '#4ade80',
  '#38bdf8',
  '#a78bfa',
  '#f472b6',
]

type Vec = { x: number; y: number; vx: number; vy: number }
type Shot = Vec & { life: number; hue: number }
type Swarm = Vec & { size: Size; seed: number }
type Cloud = Vec & { small: boolean; fire: number; turn: number; hp: number }
type Drop = Vec & { life: number }
type Fairy = Vec & { dropAt: number; carrying: boolean }
type Net = Vec & { spin: number }
type Particle = Vec & { life: number; max: number; color: string }
type Floater = { x: number; y: number; text: string; life: number }
type Star = { x: number; y: number; r: number; phase: number }

export const BLASTER_CURVES = {
  bigSwarms: { start: 4, step: 1, limit: 11 },
  speed: { start: 1, step: 0.07, limit: 1.8 },
  cloudEvery: { start: 1500, step: -90, limit: 600 },
  cloudFire: { start: 90, step: -6, limit: 40 },
  cloudAimError: { start: 0.6, step: -0.06, limit: 0.08 },
  fairyEvery: { start: 1100, step: 120, limit: 2400 },
} as const

function wrap(v: Vec) {
  if (v.x < 0) v.x += W
  else if (v.x >= W) v.x -= W
  if (v.y < 0) v.y += H
  else if (v.y >= H) v.y -= H
}

/** Shortest delta from a to b on the wrapping playfield. */
function wrapDelta(from: number, to: number, span: number): number {
  let d = to - from
  if (d > span / 2) d -= span
  else if (d < -span / 2) d += span
  return d
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function angleDiff(a: number, b: number): number {
  let d = b - a
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return d
}

// --- 16-bit art (utils/arcade/snes.ts) -------------------------------------------

/** The village sits on this line; the HUD's bottom boxes live on the ground below it. */
const GROUND = H - 22
const HUTS = 8
const hutX = (i: number) => 18 + i * ((W - 36) / (HUTS - 1))

/** The malaria cloud's sickly green, and the haze a swarm hums in. */
const SICK: Ramp = ['#1a2e05', '#3f6212', '#65a30d', '#a3e635', '#ecfccb']
/** Moonlit night clouds. */
const DUSK: Ramp = [
  RAMPS.night[0],
  RAMPS.night[2],
  RAMPS.night[3],
  mix(RAMPS.night[4], RAMPS.purple[2], 0.4),
  mix(RAMPS.purple[2], RAMPS.purple[3], 0.5),
]
/** Dim far stars, baked into the sky. */
const FAR_STAR: Ramp = [
  RAMPS.night[2],
  RAMPS.night[3],
  RAMPS.night[4],
  RAMPS.purple[2],
  RAMPS.purple[3],
]
/** Thatch and mud walls, dimmed for night. */
const NIGHT_THATCH = RAMPS.gold.map((c) =>
  mix(c, RAMPS.night[1], 0.62),
) as unknown as Ramp
const NIGHT_MUD = RAMPS.earth.map((c) =>
  mix(c, RAMPS.night[1], 0.55),
) as unknown as Ramp

const SKY_BANDS = [
  RAMPS.night[0],
  RAMPS.night[1],
  RAMPS.night[2],
  RAMPS.purple[0],
  mix(RAMPS.purple[0], RAMPS.pink[0], 0.6),
  mix(RAMPS.pink[0], RAMPS.rust[1], 0.3),
]

const FAR_STARS = starField(41, 150, W, GROUND - 40)
const FAR_RIDGE = ridge(43, W, 28, 4)
const NEAR_RIDGE = ridge(47, W, 14, 3)

/** The milky way: a diagonal band of dust, laid out once. */
const NEBULA = (() => {
  const rand = backdropRng(53)
  const colours = [RAMPS.purple[2], RAMPS.pink[1], RAMPS.night[4], RAMPS.sky[1]]
  return Array.from({ length: 700 }, () => {
    const t = rand()
    const spread = (rand() + rand() + rand() - 1.5) * 34
    return {
      x: Math.floor(t * W),
      y: Math.floor(GROUND - 60 - t * (GROUND - 110) + spread),
      colour: colours[Math.floor(rand() * colours.length)]!,
    }
  })
})()

const ACACIAS = [
  { x: 50, h: 28, w: 38 },
  { x: 176, h: 22, w: 30 },
  { x: 302, h: 32, w: 44 },
  { x: 430, h: 24, w: 34 },
]

const FIREFLIES = (() => {
  const rand = backdropRng(59)
  return Array.from({ length: 9 }, () => ({
    x: rand() * W,
    y: GROUND - 8 - rand() * 40,
    phase: rand() * Math.PI * 2,
    speed: 0.6 + rand() * 0.8,
  }))
})()

// Aedes mosquitoes: black with white bands, a red eye, glassy wings, two flap frames.
const SKEETER_PALETTE = {
  a: RAMPS.steel[0],
  w: RAMPS.steel[3],
  t: RAMPS.steel[1],
  T: RAMPS.steel[2],
  e: RAMPS.ember[2],
  p: RAMPS.steel[2],
  l: RAMPS.steel[1],
  W: 'rgba(214, 234, 255, 0.72)',
  V: '#ffffff',
}
const SKEETER_BIG = [
  pixelSprite(
    [
      '......VW.......',
      '.....VWW.......',
      '....VWWW.......',
      '.....WW........',
      'awawaTTTte.....',
      '.awawttttepppp.',
      '...l.l.l.......',
      '..l..l..l......',
    ],
    SKEETER_PALETTE,
  ),
  pixelSprite(
    [
      '...............',
      '...............',
      '..VVWW.........',
      '.VWWWWW........',
      'awawaTTTte.....',
      '.awawttttepppp.',
      '..l..l.l.......',
      '.l..l...l......',
    ],
    SKEETER_PALETTE,
  ),
] as const
const SKEETER_SMALL = [
  pixelSprite(
    ['....VW....', '...VWW....', 'awaTTte...', '.wattteppp', '..l.l.....'],
    SKEETER_PALETTE,
  ),
  pixelSprite(
    ['..........', '.VVWW.....', 'awaTTte...', '.wattteppp', '.l..l.....'],
    SKEETER_PALETTE,
  ),
] as const

// AMI, the Anti-Malaria Intelligence: a little robot fairy in a sky-blue dress.
const AMI_PALETTE = {
  g: RAMPS.gold[3],
  G: RAMPS.gold[4],
  H: RAMPS.sky[4],
  h: RAMPS.sky[3],
  s: RAMPS.sky[2],
  f: RAMPS.cream[3],
  c: RAMPS.pink[3],
  k: INK,
  D: RAMPS.sky[2],
  d: RAMPS.sky[1],
  L: RAMPS.sky[3],
  W: 'rgba(191, 233, 255, 0.7)',
}
const AMI_HEAD = [
  '......G......',
  '......g......',
  '....hHHhs....',
  '...hHffffs...',
  '...hfkffks...',
  '...sfcffcs...',
]
const AMI_SPRITES = [
  pixelSprite(
    [
      ...AMI_HEAD,
      'WW...ssss..WW',
      'WWW..dLDd.WWW',
      '.WWWdLDDDdWW.',
      '..WdLDDDDDdW.',
      '...dDDDDDDd..',
      '..dDDDDDDDDd.',
      '...d.d.d.d...',
    ],
    AMI_PALETTE,
  ),
  pixelSprite(
    [
      ...AMI_HEAD,
      '.....ssss....',
      '.W...dLDd...W',
      '.WW.dLDDDd.WW',
      '..WdLDDDDDdW.',
      '...dDDDDDDd..',
      '..dDDDDDDDDd.',
      '...d.d.d.d...',
    ],
    AMI_PALETTE,
  ),
] as const

/** A spare butterfly for the lives box. */
const LIFE_SPRITE = pixelSprite(
  [
    '.pp...pp.',
    'pPyp.pyPp',
    'pyyyByyyp',
    '.pyyByyp.',
    '..tvBvt..',
    '.tTtBtTt.',
    '.tt...tt.',
  ],
  {
    p: RAMPS.pink[2],
    P: RAMPS.pink[4],
    y: RAMPS.gold[3],
    B: RAMPS.purple[0],
    v: RAMPS.purple[2],
    t: RAMPS.teal[2],
    T: RAMPS.teal[4],
  },
)

/** The puffs drawCloud lays down, for an ink outline under them. */
const CLOUD_PUFFS: readonly (readonly [number, number, number])[] = [
  [-1.1, 0.25, 0.55],
  [-0.45, -0.15, 0.75],
  [0.35, -0.3, 0.85],
  [1.05, 0.15, 0.6],
  [0, 0.35, 0.7],
]

function cloudOutline(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  g.fillStyle = INK
  for (const [dx, dy, k] of CLOUD_PUFFS) {
    const r = size * k
    g.beginPath()
    g.arc(x + dx * size, y + dy * size + r * 0.12, r + 1.5, 0, Math.PI * 2)
    g.fill()
  }
}

class ButterflyBlaster implements ArcadeGameInstance {
  score = 0
  level = 0
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tickCount = 0
  private ship = { x: W / 2, y: H / 2, vx: 0, vy: 0, angle: 0 }
  private alive = true
  private respawn = 0
  private invuln = INVULN_TICKS
  private shield = 0
  private fireCooldown = 0
  private hopCooldown = 0
  private flap = 0
  private thrusting = false
  private shots: Shot[] = []
  private swarms: Swarm[] = []
  private cloud: Cloud | null = null
  private cloudTimer = 0
  private drops: Drop[] = []
  private fairy: Fairy | null = null
  private fairyTimer = 0
  private nets: Net[] = []
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private stars: Star[] = []
  private villages = 0
  private nextExtra = EXTRA_LIFE_EVERY
  private waveDelay = 0
  private banner: { text: string; sub?: string; ticks: number } | null = null
  private overTimer = 0
  // Cosmetic sparkles roll their own dice, so the game's seeded rng is untouched.
  private fx = new Sparkles()
  private fxRng = backdropRng(31)

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    for (let i = 0; i < 80; i++) {
      this.stars.push({
        x: this.rng() * W,
        y: this.rng() * (H - 40),
        r: this.rng() < 0.15 ? 1.6 : 0.8,
        phase: this.rng() * Math.PI * 2,
      })
    }
    this.startWave(1)
  }

  // --- setup -------------------------------------------------------------

  private startWave(wave: number) {
    this.level = wave
    const count = Math.round(levelCurve(wave, BLASTER_CURVES.bigSwarms))
    for (let i = 0; i < count; i++) {
      let x: number
      let y: number
      // Spawn along the edges, never on top of the butterfly.
      do {
        if (this.rng() < 0.5) {
          x = this.rng() * W
          y = this.rng() < 0.5 ? 0 : H - 1
        } else {
          x = this.rng() < 0.5 ? 0 : W - 1
          y = this.rng() * H
        }
      } while (dist({ x, y }, this.ship) < 120)
      this.swarms.push(this.makeSwarm(x, y, 3))
    }
    this.cloudTimer = Math.round(
      levelCurve(wave, BLASTER_CURVES.cloudEvery) / 2,
    )
    this.fairyTimer = Math.round(
      levelCurve(wave, BLASTER_CURVES.fairyEvery) / 2,
    )
    this.banner = { text: `WAVE ${wave}`, ticks: 90 }
  }

  private makeSwarm(x: number, y: number, size: Size): Swarm {
    const heading = this.rng() * Math.PI * 2
    const speed =
      SWARM_SPEED[size] *
      levelCurve(this.level, BLASTER_CURVES.speed) *
      (0.7 + this.rng() * 0.6)
    return {
      x,
      y,
      vx: Math.cos(heading) * speed,
      vy: Math.sin(heading) * speed,
      size,
      seed: this.rng() * 1000,
    }
  }

  // --- update ------------------------------------------------------------

  update(input: InputFrame) {
    this.tickCount++
    const controls = this.demo ? this.demoInput() : input

    if (this.alive) this.updateShip(controls)
    else this.tryRespawn()

    this.updateShots()
    this.updateSwarms()
    this.updateCloud()
    this.updateFairy()
    this.updateParticles()
    this.collide()
    this.fx.update()

    if (this.banner && --this.banner.ticks <= 0) this.banner = null

    if (!this.swarms.length && !this.over && this.lives > 0) {
      if (this.waveDelay === 0) {
        this.waveDelay = 150
        this.villages++
        this.fx.burst(
          hutX((this.villages - 1) % HUTS),
          GROUND - 12,
          this.fxRng,
          {
            count: 14,
            colours: [RAMPS.gold[4], RAMPS.gold[3], RAMPS.pink[3]],
          },
        )
        this.cloud = null
        this.drops = []
        this.sound.play('level')
        this.banner = {
          text: 'VILLAGE SAFE!',
          sub: `${this.villages} ${this.villages === 1 ? 'VILLAGE' : 'VILLAGES'} PROTECTED`,
          ticks: 140,
        }
      } else if (--this.waveDelay === 0) {
        this.startWave(this.level + 1)
      }
    }

    if (this.lives <= 0 && !this.alive && ++this.overTimer > 90) {
      this.over = true
    }
  }

  private updateShip(input: InputFrame) {
    const ship = this.ship
    if (input.held.left) ship.angle -= TURN
    if (input.held.right) ship.angle += TURN
    this.thrusting = input.held.up
    if (this.thrusting) {
      ship.vx += Math.sin(ship.angle) * THRUST
      ship.vy -= Math.cos(ship.angle) * THRUST
      const speed = Math.hypot(ship.vx, ship.vy)
      if (speed > MAX_SPEED) {
        ship.vx *= MAX_SPEED / speed
        ship.vy *= MAX_SPEED / speed
      }
      if (this.tickCount % 3 === 0) {
        this.particles.push({
          x: ship.x - Math.sin(ship.angle) * 8,
          y: ship.y + Math.cos(ship.angle) * 8,
          vx: -Math.sin(ship.angle) * 1.2 + (this.rng() - 0.5),
          vy: Math.cos(ship.angle) * 1.2 + (this.rng() - 0.5),
          life: 24,
          max: 24,
          color: RAINBOW[this.tickCount % RAINBOW.length]!,
        })
      }
    }
    ship.vx *= FRICTION
    ship.vy *= FRICTION
    ship.x += ship.vx
    ship.y += ship.vy
    wrap(ship)
    this.flap += this.thrusting ? 0.45 : 0.15

    if (this.fireCooldown > 0) this.fireCooldown--
    const wantsFire =
      (input.pressed.a && this.fireCooldown <= FIRE_COOLDOWN - 4) ||
      (input.held.a && this.fireCooldown === 0)
    if (wantsFire && this.shots.length < MAX_SHOTS) {
      this.shots.push({
        x: ship.x + Math.sin(ship.angle) * 10,
        y: ship.y - Math.cos(ship.angle) * 10,
        vx: ship.vx + Math.sin(ship.angle) * SHOT_SPEED,
        vy: ship.vy - Math.cos(ship.angle) * SHOT_SPEED,
        life: SHOT_LIFE,
        hue: this.tickCount,
      })
      this.fireCooldown = input.pressed.a ? FIRE_COOLDOWN : AUTOFIRE_COOLDOWN
      this.sound.play('shoot')
    }

    if (this.hopCooldown > 0) this.hopCooldown--
    if (input.pressed.b && this.hopCooldown === 0) {
      this.burst(ship.x, ship.y, 10, RAINBOW)
      ship.x = 20 + this.rng() * (W - 40)
      ship.y = 20 + this.rng() * (H - 60)
      ship.vx = 0
      ship.vy = 0
      this.hopCooldown = HOP_COOLDOWN
      this.burst(ship.x, ship.y, 10, RAINBOW)
      this.sound.play('blip')
    }

    if (this.invuln > 0) this.invuln--
    if (this.shield > 0) this.shield--
  }

  private tryRespawn() {
    if (this.lives <= 0) return
    if (this.respawn > 0) {
      this.respawn--
      return
    }
    const centre = { x: W / 2, y: H / 2 }
    const clear = this.swarms.every(
      (swarm) => dist(swarm, centre) > SWARM_RADIUS[swarm.size] + 60,
    )
    if (!clear) return
    Object.assign(this.ship, { x: W / 2, y: H / 2, vx: 0, vy: 0, angle: 0 })
    this.alive = true
    this.invuln = INVULN_TICKS
  }

  private updateShots() {
    for (const shot of this.shots) {
      shot.x += shot.vx
      shot.y += shot.vy
      wrap(shot)
      shot.life--
    }
    this.shots = this.shots.filter((shot) => shot.life > 0)
    for (const drop of this.drops) {
      drop.x += drop.vx
      drop.y += drop.vy
      wrap(drop)
      drop.life--
    }
    this.drops = this.drops.filter((drop) => drop.life > 0)
  }

  private updateSwarms() {
    for (const swarm of this.swarms) {
      swarm.x += swarm.vx
      swarm.y += swarm.vy
      wrap(swarm)
    }
  }

  private updateCloud() {
    if (this.level >= 3 && !this.cloud && this.swarms.length) {
      if (--this.cloudTimer <= 0) {
        const fromLeft = this.rng() < 0.5
        const small = this.level >= 6 && this.rng() < 0.5
        this.cloud = {
          x: fromLeft ? -20 : W + 20,
          y: 40 + this.rng() * (H - 120),
          vx: (fromLeft ? 1 : -1) * (small ? 1.6 : 1.2),
          vy: 0,
          small,
          fire: 60,
          turn: 60,
          hp: 1,
        }
        this.cloudTimer = Math.round(
          levelCurve(this.level, BLASTER_CURVES.cloudEvery),
        )
        this.sound.play('warn')
      }
    }
    const cloud = this.cloud
    if (!cloud) return
    cloud.x += cloud.vx
    cloud.y += cloud.vy
    if (--cloud.turn <= 0) {
      cloud.vy = (this.rng() - 0.5) * 1.6
      cloud.turn = 50 + Math.floor(this.rng() * 40)
    }
    cloud.y = Math.min(H - 70, Math.max(20, cloud.y))
    if (cloud.x < -40 || cloud.x > W + 40) {
      this.cloud = null
      return
    }
    if (--cloud.fire <= 0 && this.alive) {
      const aim = Math.atan2(this.ship.y - cloud.y, this.ship.x - cloud.x)
      const error = levelCurve(this.level, BLASTER_CURVES.cloudAimError)
      const angle =
        aim + (this.rng() - 0.5) * 2 * (cloud.small ? error / 2 : error)
      this.drops.push({
        x: cloud.x,
        y: cloud.y,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3,
        life: 90,
      })
      cloud.fire = Math.round(levelCurve(this.level, BLASTER_CURVES.cloudFire))
    }
  }

  private updateFairy() {
    if (!this.fairy && --this.fairyTimer <= 0 && this.swarms.length) {
      const fromLeft = this.rng() < 0.5
      this.fairy = {
        x: fromLeft ? -16 : W + 16,
        y: 28 + this.rng() * 20,
        vx: fromLeft ? 1.5 : -1.5,
        vy: 0,
        dropAt: 80 + this.rng() * (W - 160),
        carrying: true,
      }
      this.fairyTimer = Math.round(
        levelCurve(this.level, BLASTER_CURVES.fairyEvery),
      )
    }
    const fairy = this.fairy
    if (fairy) {
      fairy.x += fairy.vx
      fairy.y += Math.sin(this.tickCount / 10) * 0.4
      const passed =
        fairy.vx > 0 ? fairy.x >= fairy.dropAt : fairy.x <= fairy.dropAt
      if (fairy.carrying && passed) {
        fairy.carrying = false
        this.nets.push({ x: fairy.x, y: fairy.y + 10, vx: 0, vy: 0.8, spin: 0 })
      }
      if (fairy.x < -30 || fairy.x > W + 30) this.fairy = null
    }
    for (const net of this.nets) {
      net.y += net.vy
      net.x += Math.sin((this.tickCount + net.spin * 50) / 30) * 0.4
      net.spin += 0.02
    }
    this.nets = this.nets.filter((net) => net.y < H + 20)
  }

  private updateParticles() {
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      p.vx *= 0.97
      p.vy *= 0.97
      p.life--
    }
    this.particles = this.particles.filter((p) => p.life > 0)
    for (const f of this.floaters) {
      f.y -= 0.4
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
  }

  // --- collisions --------------------------------------------------------

  private addScore(points: number, x: number, y: number) {
    if (this.demo) return
    this.score += points
    this.floaters.push({ x, y, text: String(points), life: 40 })
    if (this.score >= this.nextExtra) {
      this.lives++
      this.nextExtra += EXTRA_LIFE_EVERY
      this.sound.play('extra')
      this.banner = { text: 'EXTRA BUTTERFLY!', ticks: 90 }
    }
  }

  private splitSwarm(index: number) {
    const swarm = this.swarms[index]!
    this.swarms.splice(index, 1)
    this.addScore(SWARM_POINTS[swarm.size], swarm.x, swarm.y)
    this.burst(swarm.x, swarm.y, swarm.size * 6, [
      '#a3e635',
      '#e2e8f0',
      '#94a3b8',
    ])
    this.sound.play('pop')
    this.fx.burst(swarm.x, swarm.y, this.fxRng, { count: 3 + swarm.size * 2 })
    if (swarm.size > 1) {
      const next = (swarm.size - 1) as Size
      this.swarms.push(this.makeSwarm(swarm.x, swarm.y, next))
      this.swarms.push(this.makeSwarm(swarm.x, swarm.y, next))
    }
  }

  private collide() {
    // Sparkles vs swarms and the cloud.
    for (const shot of this.shots) {
      if (shot.life <= 0) continue
      const hit = this.swarms.findIndex(
        (swarm) => dist(shot, swarm) < SWARM_RADIUS[swarm.size],
      )
      if (hit >= 0) {
        shot.life = 0
        this.splitSwarm(hit)
        continue
      }
      const cloud = this.cloud
      if (cloud && dist(shot, cloud) < (cloud.small ? 11 : 19)) {
        shot.life = 0
        this.addScore(cloud.small ? 1000 : 200, cloud.x, cloud.y)
        this.burst(cloud.x, cloud.y, 24, ['#65a30d', '#a3e635', '#d9f99d'])
        this.fx.burst(cloud.x, cloud.y, this.fxRng, { count: 16, speed: 2.2 })
        this.sound.play('boom')
        this.cloud = null
      }
    }
    this.shots = this.shots.filter((shot) => shot.life > 0)

    if (!this.alive) return
    const ship = this.ship

    // Catching AMI's bed net.
    const caught = this.nets.findIndex((net) => dist(net, ship) < 18)
    if (caught >= 0) {
      this.nets.splice(caught, 1)
      this.shield = SHIELD_TICKS
      this.addScore(250, ship.x, ship.y)
      this.sound.play('pickup')
      this.fx.burst(ship.x, ship.y, this.fxRng, {
        count: 14,
        colours: [RAMPS.sky[4], RAMPS.teal[3], '#ffffff'],
      })
      this.banner = { text: 'BED NET!', sub: 'THANK YOU, AMI', ticks: 70 }
    }

    if (this.invuln > 0) return

    const swarmHit = this.swarms.findIndex(
      (swarm) => dist(swarm, ship) < SWARM_RADIUS[swarm.size] + SHIP_RADIUS - 3,
    )
    const dropHit = this.drops.findIndex(
      (drop) => dist(drop, ship) < SHIP_RADIUS,
    )
    const cloudHit = this.cloud && dist(this.cloud, ship) < SHIP_RADIUS + 14
    if (swarmHit < 0 && dropHit < 0 && !cloudHit) return

    if (this.shield > 0) {
      // The net takes the hit, and catches what hit it.
      if (swarmHit >= 0) this.splitSwarm(swarmHit)
      if (dropHit >= 0) this.drops.splice(dropHit, 1)
      if (cloudHit) this.cloud = null
      this.shield = 0
      this.invuln = 60
      this.burst(ship.x, ship.y, 16, ['#ffffff', '#e0f2fe'])
      this.sound.play('pop')
      return
    }

    if (swarmHit >= 0) this.splitSwarm(swarmHit)
    if (dropHit >= 0) this.drops.splice(dropHit, 1)
    this.loseLife()
  }

  private loseLife() {
    this.alive = false
    this.lives--
    this.respawn = RESPAWN_TICKS
    this.burst(this.ship.x, this.ship.y, 40, RAINBOW)
    this.sound.play('die')
    if (this.lives <= 0) this.banner = { text: 'GAME OVER', ticks: 200 }
  }

  private burst(x: number, y: number, count: number, colors: string[]) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.5 + this.rng() * 2.5
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 30 + Math.floor(this.rng() * 30),
        max: 60,
        color: colors[i % colors.length]!,
      })
    }
  }

  // --- attract-mode pilot ------------------------------------------------

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
    const pressed = { ...held }
    const ship = this.ship
    let target: { x: number; y: number } | null = null
    let best = Infinity
    for (const swarm of this.swarms) {
      const d = Math.hypot(
        wrapDelta(ship.x, swarm.x, W),
        wrapDelta(ship.y, swarm.y, H),
      )
      if (d < best) {
        best = d
        target = swarm
      }
    }
    if (target) {
      const dx = wrapDelta(ship.x, target.x, W)
      const dy = wrapDelta(ship.y, target.y, H)
      const want = Math.atan2(dx, -dy)
      const diff = angleDiff(ship.angle, want)
      if (diff > 0.05) held.right = true
      else if (diff < -0.05) held.left = true
      if (Math.abs(diff) < 0.2 && this.tickCount % 10 === 0) pressed.a = true
      held.up = best > 170 && this.tickCount % 90 < 25
      if (best < 34 && this.hopCooldown === 0 && this.tickCount % 7 === 0) {
        pressed.b = true
      }
    }
    return { held, pressed }
  }

  // --- render ------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    this.renderSky(g)
    for (const net of this.nets) this.renderNet(g, net)
    if (this.fairy) this.renderFairy(g, this.fairy)
    for (const swarm of this.swarms) this.renderSwarm(g, swarm)
    if (this.cloud) this.renderCloud(g, this.cloud)
    for (const drop of this.drops) {
      glow(g, drop.x, drop.y, 9, SICK[3], 0.5)
      shadedOrb(g, drop.x, drop.y, 2.5, SICK, { glint: false })
    }
    for (const p of this.particles) {
      const x = Math.round(p.x)
      const y = Math.round(p.y)
      g.globalAlpha = Math.max(0, p.life / p.max)
      g.fillStyle = INK
      g.fillRect(x - 1, y - 1, 3, 3)
      g.fillStyle = p.color
      g.fillRect(x - 1, y - 1, 2, 2)
    }
    g.globalAlpha = 1
    for (const shot of this.shots) this.renderSparkle(g, shot)
    if (
      this.alive &&
      !(this.invuln > 0 && Math.floor(this.invuln / 6) % 2 === 0)
    ) {
      this.renderButterfly(g)
    }
    this.fx.render(g)
    for (const f of this.floaters) {
      drawText(g, f.text, f.x, f.y, {
        align: 'center',
        color: RAMPS.gold[3],
        outline: INK,
      })
    }
    vignette(g, W, H, 0.3)
    this.renderHud(g)
  }

  private renderSky(g: CanvasRenderingContext2D) {
    // The far sky, the milky way, the moon and the sleeping village: painted once.
    cachedLayer(g, 'butterfly-blaster-night', W, H, (k) => {
      bandedGradient(k, 0, 0, W, GROUND, SKY_BANDS, 6)
      k.save()
      k.globalAlpha = 0.18
      for (const [t, colour] of [
        [0.2, RAMPS.pink[1]],
        [0.5, RAMPS.purple[1]],
        [0.8, RAMPS.sky[1]],
      ] as const) {
        glow(k, t * W, GROUND - 60 - t * (GROUND - 110), 90, colour, 1)
      }
      k.restore()
      k.save()
      k.globalAlpha = 0.55
      for (const d of NEBULA) {
        k.fillStyle = d.colour
        k.fillRect(d.x, d.y, 1, 1)
      }
      k.restore()
      drawStars(k, FAR_STARS, 0, FAR_STAR)
      this.paintMoon(k, W - 46, 46, 16)
      // Two ridges of hills, rim-lit from the moon side.
      drawRidge(k, FAR_RIDGE, {
        base: GROUND - 16,
        bottom: GROUND,
        width: W,
        step: 4,
        fill: mix(RAMPS.night[2], RAMPS.purple[0], 0.5),
        rim: RAMPS.night[4],
      })
      drawRidge(k, NEAR_RIDGE, {
        base: GROUND - 3,
        bottom: GROUND,
        width: W,
        step: 3,
        fill: RAMPS.night[1],
        rim: RAMPS.night[3],
      })
      for (const tree of ACACIAS) this.paintAcacia(k, tree.x, tree.h, tree.w)
      // Packed-earth ground in bands.
      bandedGradient(
        k,
        0,
        GROUND,
        W,
        H - GROUND,
        [NIGHT_MUD[1], NIGHT_MUD[0], RAMPS.night[0]],
        2,
      )
      k.fillStyle = NIGHT_MUD[3]
      k.fillRect(0, GROUND, W, 1)
      for (let i = 0; i < HUTS; i++) this.paintHut(k, hutX(i))
    })

    // Twinkling near stars (laid out by the game at start-up).
    for (const star of this.stars) {
      const twinkle = Math.sin(star.phase + this.tickCount / 25)
      const x = Math.round(star.x)
      const y = Math.round(star.y)
      if (y >= GROUND - 20) continue
      g.fillStyle =
        twinkle > 0.6
          ? RAMPS.sky[4]
          : twinkle > -0.2
            ? RAMPS.sky[3]
            : RAMPS.purple[2]
      g.fillRect(x, y, 1, 1)
      if (star.r > 1 && twinkle > 0.7) {
        g.fillStyle = RAMPS.sky[3]
        g.fillRect(x - 1, y, 3, 1)
        g.fillRect(x, y - 1, 1, 3)
        if (twinkle > 0.93) {
          g.fillStyle = rgba(RAMPS.sky[3], 0.5)
          g.fillRect(x - 2, y, 1, 1)
          g.fillRect(x + 2, y, 1, 1)
          g.fillRect(x, y - 2, 1, 1)
          g.fillRect(x, y + 2, 1, 1)
        }
      }
    }

    // Moonlit clouds drifting past.
    g.save()
    g.globalAlpha = 0.55
    for (const [speed, offset, y, size] of [
      [0.12, 40, 116, 8],
      [0.07, 300, 196, 11],
    ] as const) {
      const span = W + 120
      const x =
        ((((this.tickCount * speed + offset) % span) + span) % span) - 60
      drawCloud(g, x, y, size, DUSK)
    }
    g.restore()

    // Lit windows: one more for every village kept safe.
    for (let i = 0; i < HUTS; i++) {
      const x = Math.round(hutX(i))
      const lit = i < this.villages % (HUTS + 1) || this.villages > HUTS
      const top = GROUND - 11
      g.fillStyle = INK
      g.fillRect(x - 4, top - 1, 8, 7)
      if (lit) {
        const flicker = 0.4 + 0.08 * Math.sin(this.tickCount / 7 + i * 1.7)
        glow(g, x, top + 2, 22, RAMPS.gold[3], flicker + 0.1)
        g.fillStyle = RAMPS.gold[2]
        g.fillRect(x - 3, top, 6, 5)
        g.fillStyle = RAMPS.gold[4]
        g.fillRect(x - 3, top, 6, 2)
        g.fillStyle = RAMPS.rust[2]
        g.fillRect(x, top, 1, 5)
      } else {
        g.fillStyle = RAMPS.night[2]
        g.fillRect(x - 3, top, 6, 5)
        g.fillStyle = RAMPS.night[3]
        g.fillRect(x - 3, top, 6, 1)
      }
    }

    // Fireflies over the village rooftops.
    g.save()
    g.globalCompositeOperation = 'lighter'
    for (const fly of FIREFLIES) {
      const t = this.tickCount / 60
      const on = Math.sin(t * fly.speed * 3 + fly.phase)
      if (on < 0.2) continue
      const x = Math.round(fly.x + Math.sin(t * fly.speed + fly.phase) * 14)
      const y = Math.round(fly.y + Math.cos(t * fly.speed * 1.3) * 5)
      g.globalAlpha = on
      g.fillStyle = rgba(RAMPS.leaf[3], 0.35)
      g.fillRect(x - 1, y - 1, 3, 3)
      g.fillStyle = RAMPS.gold[4]
      g.fillRect(x, y, 1, 1)
    }
    g.restore()
  }

  private paintMoon(
    k: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
  ) {
    glow(k, x, y, r * 3.2, RAMPS.cream[3], 0.28)
    shadedOrb(k, x, y, r, RAMPS.cream, { glint: false })
    // The night side, faint with earthshine, and a few craters.
    k.save()
    k.beginPath()
    k.arc(x, y, r, 0, Math.PI * 2)
    k.clip()
    k.fillStyle = RAMPS.cream[1]
    for (const [cx, cy, cr] of [
      [-8, 6, 2.5],
      [-11, -2, 1.5],
      [-4, 11, 1.5],
    ] as const) {
      k.beginPath()
      k.arc(x + cx, y + cy, cr, 0, Math.PI * 2)
      k.fill()
    }
    k.fillStyle = mix(RAMPS.night[2], RAMPS.night[3], 0.5)
    k.beginPath()
    k.arc(x + 7, y - 5, r - 2, 0, Math.PI * 2)
    k.fill()
    k.fillStyle = rgba(RAMPS.night[4], 0.35)
    k.fillRect(x + 1, y - 13, 6, 1)
    k.restore()
    k.fillStyle = '#ffffff'
    k.fillRect(x - 13, y + 2, 2, 2)
  }

  private paintAcacia(
    k: CanvasRenderingContext2D,
    x: number,
    h: number,
    w: number,
  ) {
    const base = GROUND
    k.fillStyle = INK
    k.fillRect(x - 2, base - h, 4, h)
    k.fillStyle = RAMPS.night[0]
    k.fillRect(x - 1, base - h, 2, h)
    // Forked branches up to a flat crown.
    k.fillStyle = INK
    for (let i = 0; i < 6; i++) {
      k.fillRect(x - 3 - i, base - h + 4 - i, 2, 2)
      k.fillRect(x + 1 + i, base - h + 3 - i, 2, 2)
    }
    const crown = (
      dx: number,
      dy: number,
      rw: number,
      ry: number,
      c: string,
    ) => {
      k.fillStyle = c
      k.beginPath()
      k.ellipse(x + dx, base - h - 4 + dy, rw, ry, 0, 0, Math.PI * 2)
      k.fill()
    }
    crown(0, 0, w / 2 + 1, 4, INK)
    crown(0, 0, w / 2, 3, RAMPS.night[1])
    crown(3, -1, w / 2 - 4, 2, RAMPS.night[2])
    k.fillStyle = RAMPS.night[4]
    k.fillRect(x + 4, base - h - 7, Math.round(w / 2) - 5, 1)
  }

  private paintHut(k: CanvasRenderingContext2D, cx: number) {
    const x = Math.round(cx)
    const wallTop = GROUND - 14
    // Mud walls: lit on the moon side (right), shadowed on the left.
    k.fillStyle = INK
    k.fillRect(x - 11, wallTop - 1, 22, 16)
    bandedGradient(
      k,
      x - 10,
      wallTop,
      20,
      14,
      [NIGHT_MUD[3], NIGHT_MUD[2], NIGHT_MUD[1]],
      2,
    )
    k.fillStyle = NIGHT_MUD[1]
    k.fillRect(x - 10, wallTop, 4, 14)
    k.fillStyle = NIGHT_MUD[4]
    k.fillRect(x + 9, wallTop, 1, 14)
    // Doorway.
    k.fillStyle = INK
    k.fillRect(x + 4, wallTop + 6, 4, 8)
    // A conical thatch roof in stripes, outlined.
    const apex = wallTop - 13
    const roof = (grow: number) => {
      k.beginPath()
      k.moveTo(x - 14 - grow, wallTop + 1 + grow * 0.5)
      k.lineTo(x, apex - grow)
      k.lineTo(x + 14 + grow, wallTop + 1 + grow * 0.5)
      k.closePath()
    }
    k.fillStyle = INK
    roof(1.5)
    k.fill()
    k.save()
    roof(0)
    k.clip()
    bandedGradient(
      k,
      x - 15,
      apex,
      30,
      wallTop - apex + 2,
      [NIGHT_THATCH[3], NIGHT_THATCH[2], NIGHT_THATCH[1]],
      3,
    )
    k.fillStyle = NIGHT_THATCH[0]
    for (let r = apex + 4; r < wallTop; r += 4) k.fillRect(x - 15, r, 30, 1)
    k.fillStyle = rgba(NIGHT_THATCH[0], 0.6)
    k.fillRect(x - 15, apex, 13, wallTop - apex + 2)
    k.restore()
    k.fillStyle = NIGHT_THATCH[4]
    for (let i = 0; i < 12; i++) {
      k.fillRect(x + 1 + i, apex + 1 + Math.round(i * 0.93), 1, 1)
    }
  }

  private renderButterfly(g: CanvasRenderingContext2D) {
    const ship = this.ship
    const open = 0.55 + 0.45 * Math.abs(Math.sin(this.flap))
    glow(g, ship.x, ship.y, 24, RAMPS.pink[3], 0.32)
    g.save()
    g.translate(ship.x, ship.y)
    g.rotate(ship.angle)
    const wings = () => {
      g.beginPath()
      g.ellipse(6, -4, 7, 6, -0.5, 0, Math.PI * 2)
      g.ellipse(5, 5, 5, 4, 0.5, 0, Math.PI * 2)
    }
    for (const side of [-1, 1]) {
      g.save()
      g.scale(side * open, 1)
      // Ink outline, then rainbow bands radiating from the body.
      g.strokeStyle = INK
      g.lineWidth = 2.4
      wings()
      g.stroke()
      g.save()
      wings()
      g.clip()
      RAINBOW.forEach((colour, i) => {
        g.fillStyle = colour
        g.beginPath()
        g.arc(0, 0, 16 - i * 2, 0, Math.PI * 2)
        g.fill()
      })
      // Hindwings sit in shadow; the forewing's leading edge catches the light.
      g.fillStyle = rgba(INK, 0.32)
      g.beginPath()
      g.ellipse(5, 7, 6, 4, 0.5, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = rgba('#ffffff', 0.35)
      g.beginPath()
      g.ellipse(7, -8, 5, 2, -0.5, 0, Math.PI * 2)
      g.fill()
      g.restore()
      // Wing veins and the white eyespots.
      g.strokeStyle = rgba(INK, 0.55)
      g.lineWidth = 0.8
      g.beginPath()
      g.moveTo(1, -1)
      g.lineTo(11, -8)
      g.moveTo(1, 1)
      g.lineTo(8, 6)
      g.stroke()
      g.fillStyle = INK
      g.beginPath()
      g.arc(9, -6, 1.8, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = '#ffffff'
      g.beginPath()
      g.arc(9, -6, 1.1, 0, Math.PI * 2)
      g.arc(6, 6, 0.9, 0, Math.PI * 2)
      g.fill()
      g.restore()
    }
    // A shaded, segmented body, a round head and gold-tipped antennae.
    g.fillStyle = INK
    g.beginPath()
    g.ellipse(0, 1, 2.8, 8.5, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = RAMPS.purple[1]
    g.beginPath()
    g.ellipse(0, 1, 1.8, 7.5, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = RAMPS.purple[3]
    g.beginPath()
    g.ellipse(-0.6, 0, 0.8, 5.5, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = INK
    for (const y of [2, 4.5, 7]) g.fillRect(-1.8, y, 3.6, 0.7)
    g.strokeStyle = INK
    g.lineWidth = 1.2
    g.beginPath()
    g.moveTo(-1, -8)
    g.quadraticCurveTo(-2, -12, -4.5, -13)
    g.moveTo(1, -8)
    g.quadraticCurveTo(2, -12, 4.5, -13)
    g.stroke()
    shadedOrb(g, -4.5, -13, 1.2, RAMPS.gold, { glint: false })
    shadedOrb(g, 4.5, -13, 1.2, RAMPS.gold, { glint: false })
    shadedOrb(g, 0, -7.5, 2.4, RAMPS.purple, { glint: false })
    g.restore()
    if (
      this.shield > 0 &&
      (this.shield > 90 || Math.floor(this.shield / 8) % 2 === 0)
    ) {
      glow(g, ship.x, ship.y, 22, RAMPS.teal[3], 0.3)
      this.renderMesh(g, ship.x, ship.y, 15, this.tickCount / 40)
    }
  }

  /** AMI's bed net: a shaded hoop with a fine mesh across it. */
  private renderMesh(
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
    spin: number,
  ) {
    g.save()
    g.translate(x, y)
    g.fillStyle = rgba(RAMPS.sky[4], 0.12)
    g.beginPath()
    g.arc(0, 0, r, 0, Math.PI * 2)
    g.fill()
    g.save()
    g.clip()
    g.rotate(spin)
    g.lineWidth = 1
    const mesh = (offset: number, colour: string) => {
      g.strokeStyle = colour
      g.beginPath()
      for (let i = -r + 4; i < r; i += 4) {
        g.moveTo(i + offset, -r)
        g.lineTo(i + offset, r)
        g.moveTo(-r, i + offset)
        g.lineTo(r, i + offset)
      }
      g.stroke()
    }
    mesh(0.8, rgba(INK, 0.45))
    mesh(0, rgba(RAMPS.cream[3], 0.75))
    g.restore()
    // The hoop: ink, then the cloth's lit and shadowed rims.
    g.lineWidth = 3
    g.strokeStyle = INK
    g.beginPath()
    g.arc(0, 0, r, 0, Math.PI * 2)
    g.stroke()
    g.lineWidth = 1.5
    g.strokeStyle = RAMPS.cream[1]
    g.beginPath()
    g.arc(0, 0, r, 0, Math.PI * 2)
    g.stroke()
    g.strokeStyle = RAMPS.cream[4]
    g.beginPath()
    g.arc(0, 0, r, Math.PI * 0.95, Math.PI * 1.7)
    g.stroke()
    g.restore()
  }

  private renderMosquito(
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    heading: number,
    big: boolean,
    buzz: number,
  ) {
    const frames = big ? SKEETER_BIG : SKEETER_SMALL
    drawSprite(g, buzz ? frames[0] : frames[1], x, y, {
      flipX: Math.cos(heading) < 0,
    })
  }

  private renderSwarm(g: CanvasRenderingContext2D, swarm: Swarm) {
    const r = SWARM_RADIUS[swarm.size]
    const heading = Math.atan2(swarm.vy, swarm.vx)
    if (swarm.size === 1) {
      this.renderMosquito(
        g,
        swarm.x,
        swarm.y,
        heading,
        true,
        this.tickCount % 4 < 2 ? 1 : 0,
      )
      return
    }
    // The sickly haze the swarm hums in.
    const haze = g.createRadialGradient(
      swarm.x,
      swarm.y,
      r * 0.2,
      swarm.x,
      swarm.y,
      r * 1.15,
    )
    haze.addColorStop(0, rgba(SICK[2], 0.2))
    haze.addColorStop(0.7, rgba(SICK[1], 0.12))
    haze.addColorStop(1, rgba(SICK[1], 0))
    g.fillStyle = haze
    g.beginPath()
    g.arc(swarm.x, swarm.y, r * 1.15, 0, Math.PI * 2)
    g.fill()
    const count = SWARM_COUNT[swarm.size]
    for (let i = 0; i < count; i++) {
      const orbit =
        swarm.seed + i * 2.4 + this.tickCount * (0.04 + (i % 3) * 0.015)
      const radius = r * (0.35 + ((i * 37) % 10) / 16)
      const mx =
        swarm.x +
        Math.cos(orbit) * radius +
        Math.sin(this.tickCount * 0.9 + i) * 1.2
      const my = swarm.y + Math.sin(orbit * 1.3) * radius * 0.8
      this.renderMosquito(
        g,
        mx,
        my,
        orbit + Math.PI / 2,
        false,
        (this.tickCount + i) % 4 < 2 ? 1 : 0,
      )
    }
  }

  private renderCloud(g: CanvasRenderingContext2D, cloud: Cloud) {
    const s = cloud.small ? 0.6 : 1
    const size = 13 * s
    const bob = Math.round(Math.sin(this.tickCount / 9) * 1.5)
    const y = cloud.y + bob
    glow(g, cloud.x, y, 34 * s, SICK[3], 0.3)
    cloudOutline(g, cloud.x, y, size)
    drawCloud(g, cloud.x, y, size, SICK)
    // A scowling face.
    g.save()
    g.translate(Math.round(cloud.x), Math.round(y))
    g.scale(s, s)
    g.fillStyle = INK
    g.fillRect(-8, -4, 6, 5)
    g.fillRect(2, -4, 6, 5)
    g.fillStyle = SICK[4]
    g.fillRect(-7, -3, 4, 3)
    g.fillRect(3, -3, 4, 3)
    g.fillStyle = RAMPS.ember[2]
    g.fillRect(-5, -2, 2, 2)
    g.fillRect(3, -2, 2, 2)
    g.fillStyle = INK
    // Angry brows and a jagged frown.
    g.fillRect(-9, -7, 3, 1)
    g.fillRect(-6, -6, 3, 1)
    g.fillRect(3, -6, 3, 1)
    g.fillRect(6, -7, 3, 1)
    g.fillRect(-5, 5, 10, 2)
    g.fillStyle = SICK[4]
    g.fillRect(-3, 5, 1, 1)
    g.fillRect(2, 5, 1, 1)
    g.restore()
  }

  private renderFairy(g: CanvasRenderingContext2D, fairy: Fairy) {
    const flutter = Math.floor(this.tickCount / 5) % 2
    const facing = fairy.vx > 0 ? 1 : -1
    const wand = { x: fairy.x + facing * 9, y: fairy.y + 2 }
    glow(g, fairy.x, fairy.y, 20, RAMPS.sky[3], 0.25)
    drawSprite(g, flutter ? AMI_SPRITES[1] : AMI_SPRITES[0], fairy.x, fairy.y, {
      flipX: facing < 0,
    })
    // The wand, with a twinkling star on its tip.
    const stick = Math.round(Math.min(fairy.x + facing * 3, wand.x))
    g.fillStyle = INK
    g.fillRect(stick - 1, Math.round(fairy.y + 2), 8, 3)
    g.fillStyle = RAMPS.gold[2]
    g.fillRect(stick, Math.round(fairy.y + 3), 6, 1)
    const pulse = 0.55 + 0.25 * Math.sin(this.tickCount / 4)
    glow(g, wand.x, wand.y, 10, RAMPS.gold[3], pulse)
    const wx = Math.round(wand.x)
    const wy = Math.round(wand.y)
    g.fillStyle = RAMPS.gold[4]
    g.fillRect(wx - 2, wy, 5, 1)
    g.fillRect(wx, wy - 2, 1, 5)
    g.fillStyle = '#ffffff'
    g.fillRect(wx, wy, 1, 1)
    if (fairy.carrying) this.renderMesh(g, fairy.x, fairy.y + 15, 6, 0)
  }

  private renderNet(g: CanvasRenderingContext2D, net: Net) {
    glow(g, net.x, net.y, 16, RAMPS.sky[4], 0.35)
    this.renderMesh(g, net.x, net.y, 9, net.spin)
    // A twinkle orbiting the falling net says "catch me".
    const a = this.tickCount / 8
    const tx = Math.round(net.x + Math.cos(a) * 12)
    const ty = Math.round(net.y + Math.sin(a) * 12)
    g.fillStyle = RAMPS.sky[4]
    g.fillRect(tx - 1, ty, 3, 1)
    g.fillRect(tx, ty - 1, 1, 3)
  }

  private renderSparkle(g: CanvasRenderingContext2D, shot: Shot) {
    const colour = RAINBOW[shot.hue % RAINBOW.length]!
    const x = Math.round(shot.x)
    const y = Math.round(shot.y)
    // A short comet tail of fading afterimages.
    for (let i = 3; i >= 1; i--) {
      g.globalAlpha = 0.18 * (4 - i)
      g.fillStyle = colour
      g.fillRect(
        Math.round(shot.x - shot.vx * i * 0.45),
        Math.round(shot.y - shot.vy * i * 0.45),
        2,
        2,
      )
    }
    g.globalAlpha = 1
    glow(g, x, y, 9, colour, 0.65)
    const diagonal = (this.tickCount + shot.hue) % 8 < 4
    g.fillStyle = INK
    g.fillRect(x - 1, y - 1, 3, 3)
    g.fillStyle = colour
    if (diagonal) {
      for (const d of [-2, 2]) {
        g.fillRect(x + d, y + d, 1, 1)
        g.fillRect(x + d, y - d, 1, 1)
      }
      g.fillRect(x - 1, y - 1, 3, 3)
    } else {
      g.fillRect(x - 3, y, 7, 1)
      g.fillRect(x, y - 3, 1, 7)
    }
    g.fillStyle = '#ffffff'
    g.fillRect(x, y, 1, 1)
  }

  private renderHud(g: CanvasRenderingContext2D) {
    hudPanel(g, 4, 3, 84, 21)
    drawText(g, String(this.score).padStart(6, '0'), 10, 7, {
      scale: 2,
      color: RAMPS.pink[3],
      shadow: INK,
    })
    const hi = Math.max(this.hiScore, this.score)
    hudPanel(g, W / 2 - 62, 3, 124, 21)
    drawText(g, `HI ${String(hi).padStart(6, '0')}`, W / 2, 7, {
      scale: 2,
      align: 'center',
      color: RAMPS.gold[3],
      shadow: INK,
    })
    const lives = Math.min(this.lives, 6)
    if (lives > 0) {
      hudPanel(g, W - 8 - lives * 14, 3, lives * 14 + 4, 21, RAMPS.pink)
      for (let i = 0; i < lives; i++) {
        const bob = Math.round(Math.sin(this.tickCount / 12 + i) * 0.6)
        drawSprite(g, LIFE_SPRITE, W - 13 - i * 14, 13 + bob)
      }
    }
    hudPanel(g, 4, H - 19, 60, 15)
    drawText(g, `WAVE ${this.level}`, 10, H - 15, {
      color: RAMPS.purple[4],
      outline: INK,
    })
    const safe = `VILLAGES SAFE ${this.villages}`
    const safeW = safe.length * 6 + 10
    hudPanel(g, W - 4 - safeW, H - 19, safeW, 15, RAMPS.gold)
    drawText(g, safe, W - 10, H - 15, {
      align: 'right',
      color: RAMPS.gold[4],
      outline: INK,
    })
    if (this.shield > 0) {
      hudPanel(g, W / 2 - 60, H - 19, 120, 15, RAMPS.teal)
      drawText(g, 'NET', W / 2 - 54, H - 15, {
        color: RAMPS.teal[4],
        outline: INK,
      })
      gauge(g, W / 2 - 30, H - 15, 84, 7, this.shield / SHIELD_TICKS, RAMPS.sky)
    }
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, H / 2 - 30, {
        scale: 3,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.pink[1],
      })
      if (this.banner.sub) {
        drawText(g, this.banner.sub, W / 2, H / 2 + 2, {
          scale: 2,
          align: 'center',
          color: RAMPS.gold[3],
          outline: INK,
        })
      }
    }
  }
}

const butterflyBlaster: ArcadeGameModule = {
  create: (options) => new ButterflyBlaster(options),
}

export const create = butterflyBlaster.create
export default butterflyBlaster
