// /utils/arcade/games/rescueRally.ts
//
// Rescue Rally -- the Kind Robots Arcade's arena-shooter riff (conductor
// kr-arcade/t-007). An android hero zips around a neon arena firing a kindness
// beam that reboots glitched drones into friendly bots, while wandering
// people, pets and little bots wait to be rescued for a growing multiplier.
// Moving aims; A fires; holding B strafes (keeps the aim while you move).

import { levelCurve } from '../curve'
import { drawText } from '../font'
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
    g.fillStyle = '#0b0620'
    g.fillRect(0, 0, W, H)
    this.renderArena(g)
    for (const f of this.foes) if (f.kind === 'puddle') this.renderPuddle(g, f)
    for (const r of this.rescuees) this.renderRescuee(g, r)
    for (const f of this.freed) this.renderFreed(g, f)
    for (const f of this.foes) if (f.kind !== 'puddle') this.renderFoe(g, f)
    g.fillStyle = '#fde68a'
    for (const s of this.shots) {
      g.fillStyle = 'rgba(244, 114, 182, 0.35)'
      g.fillRect(s.x - s.vx * 0.6 - 1.5, s.y - s.vy * 0.6 - 1.5, 3, 3)
      g.fillStyle = '#fde68a'
      g.fillRect(s.x - 1.5, s.y - 1.5, 3, 3)
    }
    for (const s of this.sparks) {
      g.globalAlpha = Math.max(0, s.life / s.max)
      g.fillStyle = s.color
      g.fillRect(s.x - 1, s.y - 1, 2, 2)
    }
    g.globalAlpha = 1
    if (
      this.alive &&
      !(this.invuln > 0 && Math.floor(this.invuln / 5) % 2 === 0)
    ) {
      this.renderHero(g)
    }
    for (const f of this.floaters) {
      drawText(g, f.text, f.x, f.y, { align: 'center', color: f.color })
    }
    this.renderHud(g)
  }

  private renderArena(g: CanvasRenderingContext2D) {
    g.strokeStyle = 'rgba(167, 139, 250, 0.12)'
    g.lineWidth = 1
    g.beginPath()
    for (let x = ARENA.left; x <= ARENA.right; x += 24) {
      g.moveTo(x, ARENA.top)
      g.lineTo(x, ARENA.bottom)
    }
    for (let y = ARENA.top; y <= ARENA.bottom; y += 24) {
      g.moveTo(ARENA.left, y)
      g.lineTo(ARENA.right, y)
    }
    g.stroke()
    const pulse = 0.6 + 0.4 * Math.sin(this.tick / 20)
    g.strokeStyle = `rgba(45, 212, 191, ${pulse})`
    g.lineWidth = 2
    g.strokeRect(
      ARENA.left,
      ARENA.top,
      ARENA.right - ARENA.left,
      ARENA.bottom - ARENA.top,
    )
    g.strokeStyle = 'rgba(244, 114, 182, 0.4)'
    g.lineWidth = 4
    g.strokeRect(
      ARENA.left - 3,
      ARENA.top - 3,
      ARENA.right - ARENA.left + 6,
      ARENA.bottom - ARENA.top + 6,
    )
  }

  private renderHero(g: CanvasRenderingContext2D) {
    const p = this.player
    const bob = Math.sin(p.walk) * 1
    g.save()
    g.translate(p.x, p.y + bob)
    g.fillStyle = '#2dd4bf'
    g.fillRect(-3, -1, 6, 7)
    g.fillStyle = '#fde7d6'
    g.beginPath()
    g.arc(0, -4, 3, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#f472b6'
    g.beginPath()
    g.arc(-2, -6, 2.6, 0, Math.PI * 2)
    g.arc(2, -6, 2.6, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#14b8a6'
    g.beginPath()
    g.moveTo(-4, -7)
    g.lineTo(-3, -11)
    g.lineTo(-1, -8)
    g.moveTo(4, -7)
    g.lineTo(3, -11)
    g.lineTo(1, -8)
    g.fill()
    g.restore()
    g.strokeStyle = 'rgba(253, 230, 138, 0.8)'
    g.lineWidth = 1
    g.beginPath()
    g.moveTo(p.x + p.aimX * 7, p.y + p.aimY * 7)
    g.lineTo(p.x + p.aimX * 11, p.y + p.aimY * 11)
    g.stroke()
  }

  private renderFoe(g: CanvasRenderingContext2D, f: Foe) {
    switch (f.kind) {
      case 'drone': {
        const step = f.timer % 12 < 7 ? 1 : 0
        g.fillStyle = '#7c3aed'
        g.fillRect(f.x - 5, f.y - 5 + step, 10, 9)
        g.fillStyle = '#ef4444'
        g.fillRect(f.x - 4, f.y - 3 + step, 8, 2)
        g.fillStyle = '#c4b5fd'
        g.fillRect(f.x - 1, f.y - 8 + step, 2, 3)
        break
      }
      case 'seeker':
        g.fillStyle = '#fb7185'
        g.beginPath()
        g.moveTo(f.x, f.y - 5)
        g.lineTo(f.x + 4, f.y)
        g.lineTo(f.x, f.y + 5)
        g.lineTo(f.x - 4, f.y)
        g.closePath()
        g.fill()
        break
      case 'tank':
        g.fillStyle = '#64748b'
        g.fillRect(f.x - 10, f.y - 8, 20, 16)
        g.fillStyle = '#334155'
        g.fillRect(f.x - 11, f.y - 9, 22, 4)
        g.fillRect(f.x - 11, f.y + 5, 22, 4)
        g.fillStyle = f.hp <= 2 ? '#fbbf24' : '#ef4444'
        g.fillRect(f.x - 5, f.y - 2, 10, 3)
        break
      case 'spawner': {
        const pulse = 9 + Math.sin(f.timer / 8) * 1.5
        g.fillStyle = 'rgba(192, 132, 252, 0.3)'
        g.beginPath()
        g.arc(f.x, f.y, pulse + 3, 0, Math.PI * 2)
        g.fill()
        g.fillStyle = '#a855f7'
        g.beginPath()
        g.moveTo(f.x, f.y - pulse)
        g.lineTo(f.x + pulse, f.y)
        g.lineTo(f.x, f.y + pulse)
        g.lineTo(f.x - pulse, f.y)
        g.closePath()
        g.fill()
        g.fillStyle = '#fde68a'
        g.fillRect(f.x - 1.5, f.y - 1.5, 3, 3)
        break
      }
      case 'puddle':
        break
    }
  }

  private renderPuddle(g: CanvasRenderingContext2D, f: Foe) {
    const on = (this.tick + f.seed * 10) % 30 < 20
    g.fillStyle = on ? '#84cc16' : '#365314'
    g.fillRect(f.x - 5, f.y - 5, 10, 10)
    g.fillStyle = '#0b0620'
    g.fillRect(f.x - 2, f.y - 2, 4, 4)
  }

  private renderRescuee(g: CanvasRenderingContext2D, r: Rescuee) {
    const bob = Math.abs(Math.sin(this.tick / 6 + r.x)) * 1.2
    const x = r.x
    const y = r.y - bob
    switch (r.kind) {
      case 'person':
        g.fillStyle = r.color
        g.fillRect(x - 3, y - 1, 6, 7)
        g.fillStyle = r.skin
        g.beginPath()
        g.arc(x, y - 4, 3, 0, Math.PI * 2)
        g.fill()
        break
      case 'cat':
        g.fillStyle = '#f59e0b'
        g.fillRect(x - 4, y - 1, 8, 4)
        g.beginPath()
        g.moveTo(x + 2, y - 1)
        g.lineTo(x + 3, y - 5)
        g.lineTo(x + 5, y - 1)
        g.fill()
        break
      case 'dog':
        g.fillStyle = '#d6d3d1'
        g.fillRect(x - 5, y - 2, 9, 5)
        g.fillStyle = '#78716c'
        g.fillRect(x + 3, y - 4, 3, 3)
        break
      case 'bot':
        g.fillStyle = '#38bdf8'
        g.fillRect(x - 3, y - 4, 6, 7)
        g.fillStyle = '#fde68a'
        g.fillRect(x - 2, y - 2, 1, 1)
        g.fillRect(x + 1, y - 2, 1, 1)
        break
    }
    if (Math.floor(this.tick / 20) % 2 === 0) {
      drawText(g, '*', x, y - 14, { align: 'center', color: '#f9a8d4' })
    }
  }

  private renderFreed(
    g: CanvasRenderingContext2D,
    f: { x: number; y: number; life: number },
  ) {
    g.globalAlpha = Math.max(0, f.life / 60)
    g.fillStyle = '#4ade80'
    g.fillRect(f.x - 4, f.y - 4, 8, 8)
    g.fillStyle = '#0b0620'
    g.fillRect(f.x - 2, f.y - 2, 1, 1)
    g.fillRect(f.x + 1, f.y - 2, 1, 1)
    g.fillRect(f.x - 2, f.y + 1, 4, 1)
    g.globalAlpha = 1
  }

  private renderHud(g: CanvasRenderingContext2D) {
    const shadow = '#1e1b4b'
    drawText(g, String(this.score).padStart(7, '0'), 12, 8, {
      scale: 2,
      color: '#2dd4bf',
      shadow,
    })
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W / 2, 8, {
      scale: 2,
      align: 'center',
      color: '#fde68a',
      shadow,
    })
    for (let i = 0; i < Math.min(this.lives, 6); i++) {
      drawText(g, '*', W - 18 - i * 14, 8, {
        scale: 2,
        color: '#f472b6',
        shadow,
      })
    }
    drawText(g, `WAVE ${this.level}`, 14, H - 11, { color: '#c4b5fd' })
    drawText(g, `RESCUE X${this.multiplier}`, W - 14, H - 11, {
      align: 'right',
      color: '#86efac',
    })
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, H / 2 - 28, {
        scale: 3,
        align: 'center',
        color: '#ffffff',
        shadow: '#db2777',
      })
      if (this.banner.sub) {
        drawText(g, this.banner.sub, W / 2, H / 2 + 4, {
          scale: 2,
          align: 'center',
          color: '#86efac',
          shadow,
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
