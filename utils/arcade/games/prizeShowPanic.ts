// /utils/arcade/games/prizeShowPanic.ts
//
// Prize Show Panic -- the Kind Robots Arcade's Smash TV riff (conductor
// kr-arcade/t-009 game factory). Sparkle, a contestant robot on a game show,
// is stuck in a studio that floods with party crashers. Confetti cannons make
// the crashers happy (they dance off the set), prizes drop for the grabbing,
// and the exit door opens once the room is clear: reach it before the host's
// countdown runs out. Every fourth studio ends in a parade float boss.
//
// The arrows move (eight ways) and A fires confetti the way Sparkle faces.
// Hold B to lock the aim while moving, the single-stick stand-in for the
// classic's twin sticks: strafe one way, spray another.

import { levelCurve } from '../curve'
import { drawText } from '../font'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'

const W = 320
const H = 240
const HUD = 16
const WALL = 10
const LEFT = WALL
const RIGHT = W - WALL
const TOP = HUD + WALL
const BOTTOM = H - WALL
const DOOR = 18
const CX = W / 2
const CY = (TOP + BOTTOM) / 2

const SPEED = 1.6
const HALF = 5
const SHOT_SPEED = 4.5
const SHOT_LIFE = 50
const FIRE_COOLDOWN = 7
const RAPID_COOLDOWN = 4
const POWER_TICKS = 60 * 10
const SHIELD_TICKS = 60 * 8
const ROOM_TICKS = 60 * 60
const START_LIVES = 3
const EXTRA_EVERY = 50_000
const DEATH_TICKS = 100
const TRANSITION_TICKS = 70
const INVULN_TICKS = 120
const PRIZE_LIFE = 60 * 7

export const PANIC_CURVES = {
  /** Ticks of crashers streaming in at the start of each room. */
  waveTicks: { start: 60 * 22, step: 60 * 2, limit: 60 * 36 },
  spawnEvery: { start: 55, step: -4, limit: 18 },
  grabberSpeed: { start: 0.55, step: 0.05, limit: 1.1 },
  bossHp: { start: 50, step: 25, limit: 200 },
} as const

type Dir = { x: number; y: number }
type Kind = 'grabber' | 'bouncer' | 'conga' | 'thrower'
type Crasher = {
  kind: Kind
  x: number
  y: number
  vx: number
  vy: number
  hp: number
  t: number
  /** Conga dancers follow the one in front. */
  leader: Crasher | null
  color: string
}
type Dancer = { x: number; y: number; vx: number; life: number; color: string }
type Shot = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  hue: number
}
type Streamer = { x: number; y: number; vx: number; vy: number; life: number }
type PrizeKind = 'cash' | 'toaster' | 'car' | 'spread' | 'rapid' | 'shield'
type Prize = { x: number; y: number; kind: PrizeKind; life: number }
type Boss = {
  x: number
  y: number
  vx: number
  hp: number
  maxHp: number
  t: number
  flash: number
}
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = { x: number; y: number; text: string; life: number }

const CONFETTI = [
  '#f472b6',
  '#facc15',
  '#4ade80',
  '#38bdf8',
  '#a78bfa',
  '#fb923c',
]
const PRIZE_POINTS: Record<PrizeKind, number> = {
  cash: 500,
  toaster: 1000,
  car: 5000,
  spread: 250,
  rapid: 250,
  shield: 250,
}
const KIND_POINTS: Record<Kind, number> = {
  grabber: 100,
  bouncer: 150,
  conga: 75,
  thrower: 250,
}
/** The four doors, by side: where crashers come in and the exit opens. */
const DOORS: Array<{ x: number; y: number; side: number }> = [
  { x: CX, y: TOP, side: 0 },
  { x: RIGHT, y: CY, side: 1 },
  { x: CX, y: BOTTOM, side: 2 },
  { x: LEFT, y: CY, side: 3 },
]

class PrizeShowPanic implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private px = CX
  private py = CY + 30
  private aim: Dir = { x: 0, y: -1 }
  private fireCooldown = 0
  private spread = 0
  private rapid = 0
  private shield = 0
  private invuln = INVULN_TICKS
  private shots: Shot[] = []
  private crashers: Crasher[] = []
  private dancers: Dancer[] = []
  private streamers: Streamer[] = []
  private prizes: Prize[] = []
  private boss: Boss | null = null
  private roomTimer = ROOM_TICKS
  private waveTimer = 0
  private spawnTimer = 0
  private exitDoor = -1
  private entryDoor = 2
  private transition = 0
  private dead = 0
  private nextExtra = EXTRA_EVERY
  private haul = 0
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.startRoom(1)
  }

  private bossRoom(room = this.level): boolean {
    return room % 4 === 0
  }

  private unlocked(): Kind[] {
    const kinds: Kind[] = ['grabber']
    if (this.level >= 2) kinds.push('bouncer')
    if (this.level >= 3) kinds.push('conga')
    if (this.level >= 5) kinds.push('thrower')
    return kinds
  }

  // --- rooms -------------------------------------------------------------------

  private startRoom(room: number) {
    this.level = room
    this.crashers = []
    this.streamers = []
    this.shots = []
    this.prizes = []
    this.exitDoor = -1
    this.roomTimer = ROOM_TICKS
    this.waveTimer = Math.round(levelCurve(room, PANIC_CURVES.waveTicks))
    this.spawnTimer = 60
    this.invuln = INVULN_TICKS
    const entry = DOORS[this.entryDoor]!
    this.px = entry.x + (CX - entry.x) * 0.25
    this.py = entry.y + (CY - entry.y) * 0.25
    this.boss = null
    if (this.bossRoom(room)) {
      const hp = Math.round(levelCurve(room / 4, PANIC_CURVES.bossHp))
      this.boss = { x: CX, y: TOP + 28, vx: 0.8, hp, maxHp: hp, t: 0, flash: 0 }
      this.waveTimer = Math.round(this.waveTimer / 2)
      this.banner = {
        text: 'PARADE FLOAT!',
        sub: 'CONFETTI IT INTO A PARTY',
        ticks: 110,
      }
    } else {
      this.banner = { text: `STUDIO ${room}`, sub: 'CLEAR THE SET', ticks: 90 }
    }
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    const controls = this.demo ? this.demoInput() : input

    if (this.transition > 0) {
      if (--this.transition === 0) this.startRoom(this.level + 1)
      return
    }
    if (this.dead > 0) {
      if (--this.dead === 0) {
        if (this.lives <= 0) {
          this.over = true
          this.banner = {
            text: 'GAME OVER',
            sub: `PRIZES WON ${this.haul}`,
            ticks: 9999,
          }
        } else {
          this.startRoom(this.level)
        }
      }
      return
    }

    if (this.invuln > 0) this.invuln--
    if (this.spread > 0) this.spread--
    if (this.rapid > 0) this.rapid--
    if (this.shield > 0) this.shield--
    if (--this.roomTimer <= 0) {
      this.loseLife("TIME'S UP!")
      return
    }

    this.move(controls)
    if (this.fireCooldown > 0) this.fireCooldown--
    if (controls.held.a && this.fireCooldown === 0) this.fire()
    this.spawn()
    this.updateShots()
    this.updateCrashers()
    this.updateBoss()
    this.updateStreamers()
    this.updatePrizes()
    this.checkExit()
  }

  private move(input: InputFrame) {
    let dx = 0
    let dy = 0
    if (input.held.left) dx -= 1
    if (input.held.right) dx += 1
    if (input.held.up) dy -= 1
    if (input.held.down) dy += 1
    if (dx === 0 && dy === 0) return
    // Holding B locks the aim so Sparkle can strafe.
    if (!input.held.b) this.aim = { x: dx, y: dy }
    const len = Math.hypot(dx, dy)
    this.px = Math.max(
      LEFT + HALF,
      Math.min(RIGHT - HALF, this.px + (dx / len) * SPEED),
    )
    this.py = Math.max(
      TOP + HALF,
      Math.min(BOTTOM - HALF, this.py + (dy / len) * SPEED),
    )
  }

  private fire() {
    this.fireCooldown = this.rapid > 0 ? RAPID_COOLDOWN : FIRE_COOLDOWN
    const base = Math.atan2(this.aim.y, this.aim.x)
    const angles = this.spread > 0 ? [base - 0.25, base, base + 0.25] : [base]
    for (const a of angles) {
      this.shots.push({
        x: this.px + Math.cos(a) * 7,
        y: this.py + Math.sin(a) * 7,
        vx: Math.cos(a) * SHOT_SPEED,
        vy: Math.sin(a) * SHOT_SPEED,
        life: SHOT_LIFE,
        hue: Math.floor(this.rng() * CONFETTI.length),
      })
    }
    if (this.tick % 3 === 0) this.sound.play('shoot')
  }

  private spawn() {
    if (this.waveTimer <= 0) return
    this.waveTimer--
    if (--this.spawnTimer > 0) return
    this.spawnTimer = Math.round(
      levelCurve(this.level, PANIC_CURVES.spawnEvery),
    )
    const doors = DOORS.filter((_, i) => i !== this.entryDoor || this.level > 1)
    const door = doors[Math.floor(this.rng() * doors.length)]!
    const kinds = this.unlocked()
    const kind = kinds[Math.floor(this.rng() * kinds.length)]!
    if (kind === 'conga') {
      let leader: Crasher | null = null
      const length = 4 + Math.min(4, Math.floor(this.level / 3))
      for (let i = 0; i < length; i++) {
        const c = this.makeCrasher('conga', door.x, door.y)
        c.leader = leader
        leader = c
      }
    } else if (kind === 'grabber') {
      const group = 2 + Math.floor(this.rng() * 3)
      for (let i = 0; i < group; i++) {
        this.makeCrasher(
          'grabber',
          door.x + (this.rng() - 0.5) * 16,
          door.y + (this.rng() - 0.5) * 16,
        )
      }
    } else {
      this.makeCrasher(kind, door.x, door.y)
    }
  }

  private makeCrasher(kind: Kind, x: number, y: number): Crasher {
    const a = Math.atan2(CY - y, CX - x) + (this.rng() - 0.5)
    const c: Crasher = {
      kind,
      x: Math.max(LEFT + 4, Math.min(RIGHT - 4, x)),
      y: Math.max(TOP + 4, Math.min(BOTTOM - 4, y)),
      vx: kind === 'bouncer' ? Math.cos(a) * 1.4 : 0,
      vy: kind === 'bouncer' ? Math.sin(a) * 1.4 : 0,
      hp: kind === 'thrower' ? 3 : kind === 'bouncer' ? 2 : 1,
      t: Math.floor(this.rng() * 60),
      leader: null,
      color: CONFETTI[Math.floor(this.rng() * CONFETTI.length)]!,
    }
    this.crashers.push(c)
    return c
  }

  private updateShots() {
    for (const s of this.shots) {
      s.x += s.vx
      s.y += s.vy
      s.life--
      if (s.x < LEFT || s.x > RIGHT || s.y < TOP || s.y > BOTTOM) s.life = 0
      if (s.life <= 0) continue
      const hit = this.crashers.find(
        (c) => Math.abs(c.x - s.x) < 7 && Math.abs(c.y - s.y) < 8,
      )
      if (hit) {
        s.life = 0
        this.burst(s.x, s.y, 3, CONFETTI[s.hue]!)
        if (--hit.hp <= 0) this.cheer(hit)
        continue
      }
      const b = this.boss
      if (b && Math.abs(b.x - s.x) < 40 && Math.abs(b.y - s.y) < 18) {
        s.life = 0
        b.hp--
        b.flash = 4
        this.burst(s.x, s.y, 2, CONFETTI[s.hue]!)
        if (b.hp <= 0) this.bossDown()
      }
      // Confetti knocks streamers out of the air too.
      const streamer = this.streamers.find(
        (st) => Math.abs(st.x - s.x) < 5 && Math.abs(st.y - s.y) < 5,
      )
      if (streamer) {
        streamer.life = 0
        s.life = 0
      }
    }
    this.shots = this.shots.filter((s) => s.life > 0)
  }

  /** Confetti'd: the crasher gets happy and dances off the set. */
  private cheer(c: Crasher) {
    this.crashers = this.crashers.filter((other) => other !== c)
    for (const other of this.crashers)
      if (other.leader === c) other.leader = c.leader
    this.dancers.push({
      x: c.x,
      y: c.y,
      vx: this.rng() < 0.5 ? -1.2 : 1.2,
      life: 50,
      color: c.color,
    })
    this.addScore(
      KIND_POINTS[c.kind] * Math.ceil(this.level / 2),
      c.x,
      c.y - 10,
    )
    this.burst(c.x, c.y, 8, c.color)
    this.sound.play('pop')
    if (this.rng() < 0.12) this.dropPrize(c.x, c.y)
  }

  private dropPrize(x: number, y: number) {
    const roll = this.rng()
    const kind: PrizeKind =
      roll < 0.35
        ? 'cash'
        : roll < 0.55
          ? 'toaster'
          : roll < 0.62
            ? 'car'
            : roll < 0.76
              ? 'spread'
              : roll < 0.9
                ? 'rapid'
                : 'shield'
    this.prizes.push({ x, y, kind, life: PRIZE_LIFE })
  }

  private updateCrashers() {
    const speed = levelCurve(this.level, PANIC_CURVES.grabberSpeed)
    for (const c of this.crashers) {
      c.t++
      if (c.kind === 'grabber') {
        const dx = this.px - c.x
        const dy = this.py - c.y
        const d = Math.hypot(dx, dy) || 1
        c.x += (dx / d) * speed + Math.sin(c.t / 7) * 0.3
        c.y += (dy / d) * speed
      } else if (c.kind === 'bouncer') {
        c.x += c.vx
        c.y += c.vy
        if (c.x < LEFT + 6 || c.x > RIGHT - 6) c.vx = -c.vx
        if (c.y < TOP + 6 || c.y > BOTTOM - 6) c.vy = -c.vy
      } else if (c.kind === 'conga') {
        if (c.leader) {
          const dx = c.leader.x - c.x
          const dy = c.leader.y - c.y
          const d = Math.hypot(dx, dy) || 1
          if (d > 11) {
            c.x += (dx / d) * speed * 1.3
            c.y += (dy / d) * speed * 1.3
          }
        } else {
          // The head of the line weaves toward Sparkle.
          const a =
            Math.atan2(this.py - c.y, this.px - c.x) + Math.sin(c.t / 20) * 0.9
          c.x += Math.cos(a) * speed * 1.1
          c.y += Math.sin(a) * speed * 1.1
        }
      } else {
        // Throwers keep their distance and fling streamers.
        const dx = this.px - c.x
        const dy = this.py - c.y
        const d = Math.hypot(dx, dy) || 1
        const away = d < 70 ? -1 : d > 110 ? 1 : 0
        c.x += (dx / d) * speed * 0.6 * away + Math.cos(c.t / 30) * 0.4
        c.y += (dy / d) * speed * 0.6 * away + Math.sin(c.t / 30) * 0.4
        if (c.t % 90 === 0) this.throwStreamer(c.x, c.y)
      }
      c.x = Math.max(LEFT + 4, Math.min(RIGHT - 4, c.x))
      c.y = Math.max(TOP + 4, Math.min(BOTTOM - 4, c.y))
      if (this.touching(c.x, c.y, 8)) {
        this.loseLife('MOBBED!')
        return
      }
    }
  }

  private throwStreamer(x: number, y: number) {
    const a = Math.atan2(this.py - y, this.px - x) + (this.rng() - 0.5) * 0.3
    this.streamers.push({
      x,
      y,
      vx: Math.cos(a) * 1.8,
      vy: Math.sin(a) * 1.8,
      life: 160,
    })
    this.sound.play('blip')
  }

  private updateStreamers() {
    for (const s of this.streamers) {
      s.x += s.vx
      s.y += s.vy
      s.life--
      if (s.x < LEFT || s.x > RIGHT || s.y < TOP || s.y > BOTTOM) s.life = 0
      if (s.life > 0 && this.touching(s.x, s.y, 4)) {
        s.life = 0
        this.loseLife('TANGLED!')
      }
    }
    this.streamers = this.streamers.filter((s) => s.life > 0)
  }

  private updateBoss() {
    const b = this.boss
    if (!b) return
    b.t++
    if (b.flash > 0) b.flash--
    b.x += b.vx
    if (b.x < LEFT + 50 || b.x > RIGHT - 50) b.vx = -b.vx
    // Volleys of streamers, and a few grabbers hopping off the float.
    if (b.t % 70 === 0) {
      for (const off of [-0.35, 0, 0.35]) {
        const a = Math.atan2(this.py - b.y, this.px - b.x) + off
        this.streamers.push({
          x: b.x,
          y: b.y + 14,
          vx: Math.cos(a) * 2,
          vy: Math.sin(a) * 2,
          life: 160,
        })
      }
      this.sound.play('blip')
    }
    if (b.t % 240 === 0 && this.crashers.length < 8) {
      this.makeCrasher('grabber', b.x - 20, b.y + 20)
      this.makeCrasher('grabber', b.x + 20, b.y + 20)
    }
    if (this.touching(b.x, b.y, 30)) this.loseLife('RUN OVER BY A FLOAT!')
  }

  private bossDown() {
    const b = this.boss!
    this.boss = null
    const bonus = 10_000 * (this.level / 4)
    this.addScore(bonus, b.x, b.y)
    for (let i = 0; i < 6; i++)
      this.burst(b.x + (i - 3) * 12, b.y, 10, CONFETTI[i]!)
    this.banner = {
      text: 'BEST FLOAT EVER!',
      sub: `BONUS ${bonus}`,
      ticks: 120,
    }
    this.sound.play('level')
    for (let i = 0; i < 3; i++) this.dropPrize(b.x + (i - 1) * 24, b.y + 20)
  }

  private updatePrizes() {
    for (const p of this.prizes) {
      p.life--
      if (!this.touching(p.x, p.y, 9)) continue
      p.life = 0
      this.addScore(PRIZE_POINTS[p.kind], p.x, p.y - 10)
      if (p.kind === 'spread') this.spread = POWER_TICKS
      if (p.kind === 'rapid') this.rapid = POWER_TICKS
      if (p.kind === 'shield') this.shield = SHIELD_TICKS
      if (p.kind === 'cash' || p.kind === 'toaster' || p.kind === 'car')
        this.haul++
      this.floaters.push({
        x: p.x,
        y: p.y - 20,
        text: PRIZE_NAMES[p.kind],
        life: 45,
      })
      this.sound.play('pickup')
    }
    this.prizes = this.prizes.filter((p) => p.life > 0)
  }

  private checkExit() {
    const clear =
      this.waveTimer <= 0 && this.crashers.length === 0 && !this.boss
    if (!clear) return
    if (this.exitDoor < 0) {
      const options = DOORS.map((_, i) => i).filter((i) => i !== this.entryDoor)
      this.exitDoor = options[Math.floor(this.rng() * options.length)]!
      this.streamers = []
      this.banner = { text: 'ROOM CLEAR!', sub: 'GET TO THE EXIT', ticks: 80 }
      this.sound.play('extra')
    }
    const door = DOORS[this.exitDoor]!
    if (Math.hypot(door.x - this.px, door.y - this.py) < 16) {
      const timeBonus = Math.floor(this.roomTimer / 60) * 50
      this.addScore(timeBonus, this.px, this.py - 12)
      this.entryDoor = (this.exitDoor + 2) % 4
      this.transition = TRANSITION_TICKS
      this.banner = {
        text: 'NEXT STUDIO!',
        sub: timeBonus ? `TIME BONUS ${timeBonus}` : undefined,
        ticks: TRANSITION_TICKS,
      }
      this.sound.play('level')
    }
  }

  private touching(x: number, y: number, r: number): boolean {
    return Math.abs(x - this.px) < r && Math.abs(y - this.py) < r
  }

  private loseLife(text: string) {
    if (this.invuln > 0 || this.dead > 0) return
    if (this.shield > 0) {
      // The shield pops instead.
      this.shield = 0
      this.invuln = 60
      this.burst(this.px, this.py, 10, '#a5f3fc')
      this.sound.play('warn')
      return
    }
    this.lives--
    this.dead = DEATH_TICKS
    this.burst(this.px, this.py, 18, '#fde68a')
    this.sound.play('die')
    if (this.lives > 0) this.banner = { text, ticks: 80 }
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x: number, y: number) {
    if (this.demo) return
    this.score += points
    this.floaters.push({ x, y, text: String(points), life: 40 })
    if (this.score >= this.nextExtra) {
      this.lives++
      // Each extra contestant takes longer to earn: 50k, 150k, 350k, 750k...
      this.nextExtra = this.nextExtra * 2 + EXTRA_EVERY
      this.banner = { text: 'EXTRA CONTESTANT!', ticks: 90 }
      this.sound.play('extra')
    }
  }

  private burst(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.5 + this.rng() * 1.8
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 0.5,
        life: 20 + Math.floor(this.rng() * 16),
        color,
      })
    }
  }

  private updateEffects() {
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.04
      p.life--
    }
    this.particles = this.particles.filter((p) => p.life > 0)
    for (const d of this.dancers) {
      d.x += d.vx
      d.life--
    }
    this.dancers = this.dancers.filter((d) => d.life > 0)
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
    const threats: Array<{ x: number; y: number }> = [
      ...this.crashers,
      ...this.streamers,
    ]
    if (this.boss) threats.push(this.boss)
    // Step away from whatever is closest; aim at the nearest crasher (or the float).
    let mx = 0
    let my = 0
    for (const t of threats) {
      const d = Math.hypot(t.x - this.px, t.y - this.py)
      if (d < 50) {
        mx -= (t.x - this.px) / (d || 1)
        my -= (t.y - this.py) / (d || 1)
      }
    }
    let goal: { x: number; y: number } | null = null
    if (this.exitDoor >= 0) goal = DOORS[this.exitDoor]!
    else if (this.prizes.length) goal = this.prizes[0]!
    if (goal && Math.abs(mx) + Math.abs(my) < 0.5) {
      mx = goal.x - this.px
      my = goal.y - this.py
    }
    // Drift back toward the middle when nothing else calls.
    if (Math.abs(mx) + Math.abs(my) < 0.3) {
      mx = (CX - this.px) * 0.02
      my = (CY - this.py) * 0.02
    }
    if (mx < -0.2) held.left = true
    if (mx > 0.2) held.right = true
    if (my < -0.2) held.up = true
    if (my > 0.2) held.down = true
    const target = [...this.crashers, ...(this.boss ? [this.boss] : [])].sort(
      (a, b) =>
        Math.hypot(a.x - this.px, a.y - this.py) -
        Math.hypot(b.x - this.px, b.y - this.py),
    )[0]
    if (target) {
      // Point the cannon (it locks while B is held) and spray.
      const a = Math.atan2(target.y - this.py, target.x - this.px)
      const f = Math.round(a / (Math.PI / 4))
      this.aim = {
        x: Math.round(Math.cos((f * Math.PI) / 4)),
        y: Math.round(Math.sin((f * Math.PI) / 4)),
      }
      held.b = true
      held.a = true
    }
    return frame
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    this.renderStudio(g)
    for (const p of this.prizes) this.renderPrize(g, p)
    if (this.boss) this.renderBoss(g, this.boss)
    for (const c of this.crashers) this.renderCrasher(g, c)
    for (const d of this.dancers) this.renderDancer(g, d)
    for (const s of this.streamers) {
      g.fillStyle = Math.floor(this.tick / 4) % 2 ? '#f472b6' : '#fde047'
      g.fillRect(s.x - 1, s.y - 3, 2, 6)
    }
    for (const s of this.shots) {
      g.fillStyle =
        CONFETTI[(s.hue + Math.floor(this.tick / 3)) % CONFETTI.length]!
      g.fillRect(s.x - 1.5, s.y - 1.5, 3, 3)
    }
    if (this.dead === 0 && !this.over) this.renderSparkle(g)
    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, p.life / 30)
      g.fillStyle = p.color
      g.fillRect(p.x - 1, p.y - 1, 2, 2)
    }
    g.globalAlpha = 1
    for (const f of this.floaters) {
      drawText(g, f.text, f.x, f.y, { align: 'center', color: '#fde68a' })
    }
    this.renderHud(g)
  }

  private renderStudio(g: CanvasRenderingContext2D) {
    g.fillStyle = '#0b0620'
    g.fillRect(0, 0, W, H)
    // A checkerboard stage floor with a spotlight in the middle.
    for (let y = TOP; y < BOTTOM; y += 16) {
      for (let x = LEFT; x < RIGHT; x += 16) {
        g.fillStyle = ((x + y) / 16) % 2 ? '#2e1065' : '#3b0764'
        g.fillRect(x, y, 16, 16)
      }
    }
    const glow = g.createRadialGradient(CX, CY, 10, CX, CY, 110)
    glow.addColorStop(0, 'rgba(253, 224, 71, 0.18)')
    glow.addColorStop(1, 'rgba(253, 224, 71, 0)')
    g.fillStyle = glow
    g.fillRect(LEFT, TOP, RIGHT - LEFT, BOTTOM - TOP)
    // Walls with chaser lights.
    g.fillStyle = '#7c3aed'
    g.fillRect(0, HUD, W, WALL)
    g.fillRect(0, BOTTOM, W, WALL)
    g.fillRect(0, HUD, WALL, H - HUD)
    g.fillRect(RIGHT, HUD, WALL, H - HUD)
    for (let i = 0; i < 40; i++) {
      const lit = (i + Math.floor(this.tick / 6)) % 4 === 0
      g.fillStyle = lit ? '#fde047' : '#a16207'
      const t = i / 40
      g.fillRect(4 + t * (W - 8), HUD + 4, 2, 2)
      g.fillRect(W - 6 - t * (W - 8), BOTTOM + 4, 2, 2)
    }
    // Doors: the exit glows green once it opens.
    DOORS.forEach((d, i) => {
      const exit = i === this.exitDoor
      g.fillStyle = exit
        ? Math.floor(this.tick / 8) % 2
          ? '#4ade80'
          : '#22c55e'
        : '#1e1b4b'
      if (d.side % 2 === 0)
        g.fillRect(d.x - DOOR, d.side === 0 ? HUD : BOTTOM, DOOR * 2, WALL)
      else g.fillRect(d.side === 3 ? 0 : RIGHT, d.y - DOOR, WALL, DOOR * 2)
      if (exit) {
        drawText(
          g,
          'EXIT',
          d.x + (d.side === 1 ? -22 : d.side === 3 ? 22 : 0),
          d.y + (d.side === 0 ? 6 : d.side === 2 ? -12 : -3),
          { align: 'center', color: '#bbf7d0' },
        )
      }
    })
  }

  private renderSparkle(g: CanvasRenderingContext2D) {
    if (this.invuln > 0 && Math.floor(this.tick / 4) % 2) return
    const x = this.px
    const y = this.py
    if (this.shield > 0) {
      g.strokeStyle = '#a5f3fc'
      g.lineWidth = 1
      g.beginPath()
      g.arc(x, y, 10, 0, Math.PI * 2)
      g.stroke()
    }
    // A sparkly gold contestant bot with a bow tie and a confetti cannon.
    g.fillStyle = '#facc15'
    g.fillRect(x - 5, y - 4, 10, 9)
    g.fillStyle = '#fef08a'
    g.fillRect(x - 4, y - 8, 8, 5)
    g.fillStyle = '#0f172a'
    g.fillRect(x - 3, y - 7, 2, 2)
    g.fillRect(x + 1, y - 7, 2, 2)
    g.fillStyle = '#ec4899'
    g.fillRect(x - 3, y - 3, 2, 2)
    g.fillRect(x + 1, y - 3, 2, 2)
    g.fillRect(x - 1, y - 2, 2, 1)
    g.fillStyle = '#e5e7eb'
    g.fillRect(x + this.aim.x * 7 - 2, y + this.aim.y * 7 - 2, 4, 4)
  }

  private renderCrasher(g: CanvasRenderingContext2D, c: Crasher) {
    const bob = Math.sin(c.t / 5) * 1
    const x = c.x
    const y = c.y + bob
    // Party crashers: party hats, grumpy faces, and a kazoo.
    g.fillStyle =
      c.kind === 'thrower'
        ? '#475569'
        : c.kind === 'bouncer'
          ? '#64748b'
          : '#334155'
    g.fillRect(x - 5, y - 4, 10, 10)
    g.fillStyle = c.color
    g.beginPath()
    g.moveTo(x - 4, y - 4)
    g.lineTo(x, y - 11)
    g.lineTo(x + 4, y - 4)
    g.fill()
    g.fillStyle = '#ffffff'
    g.fillRect(x - 1, y - 12, 2, 2)
    g.fillStyle = '#f8fafc'
    g.fillRect(x - 4, y - 2, 3, 2)
    g.fillRect(x + 1, y - 2, 3, 2)
    g.fillStyle = '#0f172a'
    g.fillRect(x - 3, y - 1, 1, 1)
    g.fillRect(x + 2, y - 1, 1, 1)
    g.fillRect(x - 2, y + 3, 4, 1)
    if (c.kind === 'bouncer') {
      g.strokeStyle = c.color
      g.beginPath()
      g.arc(x, y + 1, 8, 0, Math.PI * 2)
      g.stroke()
    }
    if (c.kind === 'thrower') {
      g.fillStyle = '#f472b6'
      g.fillRect(x + 5, y - 2 + (c.t % 20 < 10 ? 0 : 2), 3, 2)
    }
  }

  private renderDancer(g: CanvasRenderingContext2D, d: Dancer) {
    g.globalAlpha = Math.min(1, d.life / 25)
    const hop = Math.abs(Math.sin(d.life / 4)) * 4
    g.fillStyle = '#fbcfe8'
    g.fillRect(d.x - 4, d.y - 4 - hop, 8, 8)
    g.fillStyle = d.color
    g.fillRect(d.x - 6, d.y - 7 - hop, 2, 3)
    g.fillRect(d.x + 4, d.y - 7 - hop, 2, 3)
    // A happy face.
    g.fillStyle = '#0f172a'
    g.fillRect(d.x - 2, d.y - 2 - hop, 1, 1)
    g.fillRect(d.x + 1, d.y - 2 - hop, 1, 1)
    g.fillRect(d.x - 2, d.y + 1 - hop, 4, 1)
    g.fillRect(d.x - 3, d.y - hop, 1, 1)
    g.fillRect(d.x + 2, d.y - hop, 1, 1)
    g.globalAlpha = 1
  }

  private renderBoss(g: CanvasRenderingContext2D, b: Boss) {
    const x = b.x
    const y = b.y
    g.fillStyle = b.flash > 0 ? '#ffffff' : '#be185d'
    g.fillRect(x - 40, y - 8, 80, 22)
    g.fillStyle = '#facc15'
    for (let i = 0; i < 8; i++) g.fillRect(x - 38 + i * 10, y + 14, 6, 3)
    // A giant grumpy cake on top.
    g.fillStyle = '#fbcfe8'
    g.fillRect(x - 20, y - 22, 40, 14)
    g.fillStyle = '#f472b6'
    g.fillRect(x - 20, y - 22, 40, 3)
    g.fillStyle = '#0f172a'
    g.fillRect(x - 10, y - 17, 4, 3)
    g.fillRect(x + 6, y - 17, 4, 3)
    g.fillRect(x - 6, y - 11, 12, 1)
    for (let i = 0; i < 4; i++) {
      g.fillStyle = '#fde68a'
      g.fillRect(x - 15 + i * 10, y - 28, 2, 6)
      g.fillStyle = Math.floor(this.tick / 5 + i) % 2 ? '#f97316' : '#facc15'
      g.fillRect(x - 15 + i * 10, y - 31, 2, 3)
    }
    // Health bar.
    g.fillStyle = '#1f2937'
    g.fillRect(x - 40, y - 36, 80, 3)
    g.fillStyle = '#4ade80'
    g.fillRect(x - 40, y - 36, (80 * b.hp) / b.maxHp, 3)
  }

  private renderPrize(g: CanvasRenderingContext2D, p: Prize) {
    if (p.life < 90 && Math.floor(this.tick / 5) % 2) return
    const { x, y } = p
    switch (p.kind) {
      case 'cash':
        g.fillStyle = '#22c55e'
        g.fillRect(x - 5, y - 3, 10, 6)
        g.fillStyle = '#bbf7d0'
        g.fillRect(x - 1, y - 2, 2, 4)
        break
      case 'toaster':
        g.fillStyle = '#cbd5e1'
        g.fillRect(x - 5, y - 3, 10, 7)
        g.fillStyle = '#92400e'
        g.fillRect(x - 3, y - 6, 2, 3)
        g.fillRect(x + 1, y - 6, 2, 3)
        break
      case 'car':
        g.fillStyle = '#ef4444'
        g.fillRect(x - 7, y - 2, 14, 5)
        g.fillRect(x - 4, y - 5, 8, 3)
        g.fillStyle = '#0f172a'
        g.fillRect(x - 5, y + 3, 3, 2)
        g.fillRect(x + 2, y + 3, 3, 2)
        break
      default:
        g.fillStyle =
          p.kind === 'spread'
            ? '#a78bfa'
            : p.kind === 'rapid'
              ? '#fb923c'
              : '#22d3ee'
        g.beginPath()
        g.arc(x, y, 5, 0, Math.PI * 2)
        g.fill()
        drawText(g, p.kind[0]!.toUpperCase(), x, y - 3, {
          align: 'center',
          color: '#0f172a',
        })
    }
  }

  private renderHud(g: CanvasRenderingContext2D) {
    const shadow = '#1e1b4b'
    drawText(g, String(this.score).padStart(7, '0'), 4, 2, {
      scale: 2,
      color: '#fde047',
      shadow,
    })
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W - 4, 1, {
      align: 'right',
      color: '#f9a8d4',
    })
    drawText(g, `STUDIO ${this.level}`, W - 4, 9, {
      align: 'right',
      color: '#a5f3fc',
    })
    const seconds = Math.ceil(this.roomTimer / 60)
    const urgent = seconds <= 10 && Math.floor(this.tick / 10) % 2 === 0
    drawText(g, `TIME ${seconds}`, CX - 30, 1, {
      color: urgent ? '#ef4444' : '#fde68a',
    })
    for (let i = 0; i < Math.min(this.lives - 1, 5); i++) {
      g.fillStyle = '#facc15'
      g.fillRect(CX - 30 + i * 9, 10, 6, 5)
    }
    const powers = [
      this.spread > 0 ? 'S' : '',
      this.rapid > 0 ? 'R' : '',
      this.shield > 0 ? 'D' : '',
    ].join('')
    if (powers) drawText(g, powers, CX + 30, 5, { color: '#c4b5fd' })
    if (this.banner) {
      drawText(g, this.banner.text, CX, 90, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        shadow: '#7c3aed',
      })
      if (this.banner.sub)
        drawText(g, this.banner.sub, CX, 110, {
          align: 'center',
          color: '#fde68a',
          shadow,
        })
    }
  }
}

const PRIZE_NAMES: Record<PrizeKind, string> = {
  cash: 'CASH!',
  toaster: 'A TOASTER!',
  car: 'A NEW CAR!',
  spread: 'SPREAD SHOT!',
  rapid: 'RAPID FIRE!',
  shield: 'SHIELD!',
}

const prizeShowPanic: ArcadeGameModule = {
  create: (options) => new PrizeShowPanic(options),
}

export const create = prizeShowPanic.create
export default prizeShowPanic
