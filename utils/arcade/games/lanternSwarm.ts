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
          this.sound.play('extra')
          this.banner = { text: 'TWIN BEAMS!', ticks: 80 }
        } else if (d.dock) {
          // Lost the lantern it was flying to: it waits as a spare instead.
          this.lives++
          this.sound.play('extra')
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
    g.fillStyle = '#0b1026'
    g.fillRect(0, 0, W, H)
    for (const s of this.stars) {
      g.fillStyle = s.s > 0.7 ? '#e0e7ff' : '#6366f1'
      g.fillRect(s.x, s.y, 1, 1)
    }
    for (const m of this.moths) if (m.mode === 'beam') this.renderGlow(g, m)
    for (const m of this.moths)
      if (!m.gone && m.mode !== 'wait') this.renderMoth(g, m)
    for (const d of this.drifters) this.renderLantern(g, d.x, d.y, !d.dock)
    for (const b of this.beams) {
      g.fillStyle = '#fef08a'
      g.fillRect(b.x - 1, b.y - 4, 2, 7)
      g.fillStyle = '#fffbeb'
      g.fillRect(b.x - 0.5, b.y - 4, 1, 3)
    }
    for (const d of this.dust) {
      g.fillStyle = Math.floor(this.tick / 4) % 2 ? '#d6d3d1' : '#a8a29e'
      g.fillRect(d.x - 1, d.y - 2, 2, 4)
    }
    if (this.alive && (this.safe === 0 || Math.floor(this.safe / 4) % 2)) {
      if (this.twin) {
        this.renderLantern(g, this.x - 7, SHIP_Y, false)
        this.renderLantern(g, this.x + 7, SHIP_Y, false)
      } else this.renderLantern(g, this.x, SHIP_Y, false)
    }
    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, p.life / 30)
      g.fillStyle = p.color
      g.fillRect(p.x - 1, p.y - 1, 2, 2)
    }
    g.globalAlpha = 1
    for (const f of this.floaters)
      drawText(g, f.text, f.x, f.y, {
        align: 'center',
        color: '#fef9c3',
        shadow: '#1e1b4b',
      })
    this.renderHud(g)
  }

  private renderGlow(g: CanvasRenderingContext2D, m: Moth) {
    const reach = this.beamReach(m)
    if (reach <= 0) return
    const top = m.y + 8
    const bottom = top + (SHIP_Y + 8 - top) * reach
    const half = this.beamHalf(m)
    g.fillStyle =
      Math.floor(this.tick / 3) % 2
        ? 'rgba(196, 181, 253, 0.35)'
        : 'rgba(167, 139, 250, 0.28)'
    g.beginPath()
    g.moveTo(m.x - 4, top)
    g.lineTo(m.x + 4, top)
    g.lineTo(m.x + half, bottom)
    g.lineTo(m.x - half, bottom)
    g.closePath()
    g.fill()
    g.strokeStyle = 'rgba(237, 233, 254, 0.5)'
    g.lineWidth = 1
    for (let y = top + ((this.tick * 2) % 10); y < bottom; y += 10) {
      const w = 4 + (half - 4) * ((y - top) / (bottom - top || 1))
      g.beginPath()
      g.moveTo(m.x - w, y)
      g.lineTo(m.x + w, y)
      g.stroke()
    }
  }

  private renderMoth(g: CanvasRenderingContext2D, m: Moth) {
    const flap = Math.floor((this.tick + m.col * 7) / 8) % 2
    const x = Math.round(m.x)
    const y = Math.round(m.y)
    const wing = flap ? 5 : 3
    if (m.kind === 'queen') {
      g.fillStyle = m.hp > 1 ? '#a78bfa' : '#60a5fa'
      g.fillRect(x - 3 - wing, y - 4, wing, 7)
      g.fillRect(x + 3, y - 4, wing, 7)
      g.fillStyle = m.hp > 1 ? '#6d28d9' : '#1d4ed8'
      g.fillRect(x - 3, y - 6, 6, 11)
      g.fillStyle = '#fde047'
      g.fillRect(x - 3, y - 9, 1, 3)
      g.fillRect(x + 2, y - 9, 1, 3)
      g.fillRect(x - 1, y - 8, 2, 2)
      if (m.holding && m.mode !== 'beam') this.renderLantern(g, x, y - 14, true)
    } else if (m.kind === 'luna') {
      g.fillStyle = '#86efac'
      g.fillRect(x - 2 - wing, y - 4, wing, 5)
      g.fillRect(x + 2, y - 4, wing, 5)
      g.fillStyle = '#4ade80'
      g.fillRect(x - 2 - wing + 1, y + 1, 2, 4)
      g.fillRect(x + 2 + wing - 3, y + 1, 2, 4)
      g.fillStyle = '#f0fdf4'
      g.fillRect(x - 2, y - 5, 4, 8)
    } else {
      g.fillStyle = '#d6d3d1'
      g.fillRect(x - 2 - wing, y - 3, wing, 5)
      g.fillRect(x + 2, y - 3, wing, 5)
      g.fillStyle = '#a16207'
      g.fillRect(x - 2, y - 4, 4, 7)
    }
    g.fillStyle = '#0f172a'
    g.fillRect(x - 2, y - 3, 1, 1)
    g.fillRect(x + 1, y - 3, 1, 1)
  }

  private renderLantern(
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    captive: boolean,
  ) {
    const lx = Math.round(x)
    const ly = Math.round(y)
    if (!captive) {
      g.fillStyle = 'rgba(253, 224, 71, 0.18)'
      g.beginPath()
      g.arc(lx, ly, 11, 0, Math.PI * 2)
      g.fill()
    }
    g.fillStyle = '#44403c'
    g.fillRect(lx - 1, ly - 9, 2, 2)
    g.fillRect(lx - 4, ly - 7, 8, 2)
    g.fillStyle = captive ? '#f87171' : '#fb923c'
    g.fillRect(lx - 5, ly - 5, 10, 9)
    g.fillStyle = captive ? '#fecaca' : '#fde047'
    g.fillRect(lx - 3, ly - 4, 6, 7)
    g.fillStyle = '#44403c'
    g.fillRect(lx - 4, ly + 4, 8, 2)
    g.fillStyle = captive ? '#fca5a5' : '#fb923c'
    g.fillRect(lx - 5, ly - 2, 10, 1)
  }

  private renderHud(g: CanvasRenderingContext2D) {
    const shadow = '#1e1b4b'
    g.fillStyle = 'rgba(11, 16, 38, 0.92)'
    g.fillRect(0, 0, W, HUD_H)
    drawText(g, String(this.score).padStart(6, '0'), 4, 3, {
      scale: 2,
      color: '#fde047',
      shadow,
    })
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W - 4, 2, {
      align: 'right',
      color: '#f9a8d4',
    })
    drawText(g, `STAGE ${this.level}`, W - 4, 11, {
      align: 'right',
      color: this.glow ? '#c4b5fd' : '#a5f3fc',
    })
    for (let i = 0; i < Math.min(this.lives - (this.alive ? 1 : 0), 6); i++) {
      g.fillStyle = '#fb923c'
      g.fillRect(4 + i * 9, H - 9, 6, 6)
      g.fillStyle = '#fde047'
      g.fillRect(5 + i * 9, H - 8, 4, 4)
    }
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, 150, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        shadow,
      })
      if (this.banner.sub)
        drawText(g, this.banner.sub, W / 2, 170, {
          align: 'center',
          color: '#fef9c3',
          shadow,
        })
    }
  }
}

const lanternSwarm: ArcadeGameModule = {
  create: (options) => new LanternSwarm(options),
}

export const create = lanternSwarm.create
export default lanternSwarm
