// /utils/arcade/games/petalPost.ts
//
// Petal Post -- the Kind Robots Arcade's Paperboy riff (conductor
// kr-arcade/t-009 game factory, batch 4). A delivery bot scoots up a scrolling
// street tossing seed packets to the houses on its route. Bright houses with
// flower boxes subscribe: land a packet in their mailbox (best) or on their
// doorstep. Grey houses don't subscribe; a packet in their garden still
// sprouts a flower for a few points.
//
// Dodge skateboarding cats, rolling bins, parked cars and lawn sprinklers.
// Bundles of packets lie along the way (you carry ten). Miss a subscriber and
// they cancel at the end of the day; deliver to everyone and a neighbour
// signs up. Each day ends with a bonus run past targets where a crash only
// ends the run. Lose every subscriber or every bot and the round is over.
// POST_CURVES ramp the traffic.
//
// Up rides faster, down slower, left/right steer, A tosses a packet.

import { levelCurve } from '../curve'
import { drawText } from '../font'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'

const W = 256
const H = 240
const HUD_H = 24
const BOT_Y = 190
const SIDEWALK = 104
const STREET_L = 132
const STREET_R = 236
const MIN_X = SIDEWALK + 2
const MAX_X = STREET_R - 8
const MAILBOX_X = 96
const DOOR_X = 64
const HOUSES = 12
const HOUSE_GAP = 110
const FIRST_HOUSE = 220
const BONUS_LEN = 700
const BASE_SPEED = 1.3
const MIN_SPEED = 0.7
const MAX_SPEED = 2.2
const STEER = 1.6
const TOSS_VX = 2.6
const TOSS_TICKS = 40
const CARRY = 10
const START_LIVES = 3
const CRASH_TICKS = 100
const SAFE_TICKS = 70
const DAY_END_TICKS = 170
const SUBSCRIBE_CHANCE = 0.6

const MAILBOX_POINTS = 250
const DOOR_POINTS = 100
const GARDEN_POINTS = 25
const TARGET_POINTS = 250
const PERFECT_POINTS = 1000

export const POST_CURVES = {
  /** Hazards per house gap. */
  hazards: { start: 0.7, step: 0.15, limit: 1.8 },
  /** Cat and bin speed. */
  traffic: { start: 0.7, step: 0.08, limit: 1.4 },
} as const

type House = {
  y: number
  subscriber: boolean
  delivered: boolean
  color: string
}
type HazardKind = 'cat' | 'bin' | 'car' | 'sprinkler'
type Hazard = {
  kind: HazardKind
  x: number
  y: number
  vx: number
  vy: number
  w: number
  h: number
  gone: boolean
}
type Packet = { x: number; y: number; vy: number; t: number }
type Target = { x: number; y: number; hit: boolean }
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = { x: number; y: number; text: string; life: number }

const HOUSE_COLORS = [
  '#f472b6',
  '#38bdf8',
  '#facc15',
  '#a78bfa',
  '#4ade80',
  '#fb923c',
]

class PetalPost implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  /** World y grows downward; the bot rides toward smaller y. */
  private by = 0
  private bx = SIDEWALK + 10
  private speed = BASE_SPEED
  private carry = CARRY
  private houses: House[] = []
  private hazards: Hazard[] = []
  private bundles: Array<{ x: number; y: number; gone: boolean }> = []
  private targets: Target[] = []
  private packets: Packet[] = []
  private routeEnd = 0
  private bonusEnd = 0
  private inBonus = false
  private crash = 0
  private safe = 0
  private dayEnd = 0
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    for (let i = 0; i < HOUSES; i++)
      this.houses.push({
        y: 0,
        subscriber: this.rng() < SUBSCRIBE_CHANCE || i === 0,
        delivered: false,
        color: HOUSE_COLORS[i % HOUSE_COLORS.length]!,
      })
    this.startDay(1)
  }

  private get camera(): number {
    return this.by - BOT_Y
  }

  // --- the route ----------------------------------------------------------------

  private startDay(day: number) {
    this.level = day
    this.by = 0
    this.bx = SIDEWALK + 10
    this.speed = BASE_SPEED
    this.carry = CARRY
    this.packets = []
    this.inBonus = false
    this.houses.forEach((h, i) => {
      h.y = -FIRST_HOUSE - i * HOUSE_GAP
      h.delivered = false
    })
    this.routeEnd = -FIRST_HOUSE - HOUSES * HOUSE_GAP
    this.bonusEnd = this.routeEnd - BONUS_LEN
    this.hazards = []
    this.bundles = []
    this.targets = []
    const per = levelCurve(day, POST_CURVES.hazards)
    const traffic = levelCurve(day, POST_CURVES.traffic)
    for (
      let y = -FIRST_HOUSE + 60;
      y > this.bonusEnd + 60;
      y -= HOUSE_GAP / 2
    ) {
      if (this.rng() < per / 2) this.addHazard(y - this.rng() * 40, traffic)
      if (y > this.routeEnd && this.rng() < 0.22)
        this.bundles.push({
          x: SIDEWALK + 10 + this.rng() * 80,
          y: y - 30,
          gone: false,
        })
    }
    for (let i = 0; i < 8; i++)
      this.targets.push({
        x: 30 + (i % 3) * 22,
        y: this.routeEnd - 60 - i * 80,
        hit: false,
      })
    const subs = this.houses.filter((h) => h.subscriber).length
    this.banner = {
      text: `DAY ${day}`,
      sub: `${subs} HOUSES ON YOUR ROUTE`,
      ticks: 110,
    }
  }

  private addHazard(y: number, traffic: number) {
    const roll = this.rng()
    const kind: HazardKind =
      roll < 0.3
        ? 'cat'
        : roll < 0.55
          ? 'bin'
          : roll < 0.8
            ? 'car'
            : 'sprinkler'
    if (kind === 'cat')
      this.hazards.push({
        kind,
        x: STREET_L + this.rng() * 80,
        y,
        vx: (this.rng() < 0.5 ? -1 : 1) * traffic,
        vy: 0,
        w: 12,
        h: 8,
        gone: false,
      })
    else if (kind === 'bin')
      this.hazards.push({
        kind,
        x: STREET_L + 10 + this.rng() * 70,
        y,
        vx: 0,
        vy: traffic * 0.8,
        w: 10,
        h: 12,
        gone: false,
      })
    else if (kind === 'car')
      this.hazards.push({
        kind,
        x: STREET_R - 26 + this.rng() * 6,
        y,
        vx: 0,
        vy: 0,
        w: 18,
        h: 32,
        gone: false,
      })
    else
      this.hazards.push({
        kind,
        x: 92,
        y,
        vx: 0,
        vy: 0,
        w: 4,
        h: 4,
        gone: false,
      })
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    if (this.dayEnd > 0) {
      if (--this.dayEnd === 0) this.startDay(this.level + 1)
      return
    }
    if (this.crash > 0) {
      if (--this.crash === 0) {
        if (this.lives <= 0) this.gameOver('OUT OF DELIVERY BOTS')
        else this.safe = SAFE_TICKS
      }
      return
    }
    if (this.safe > 0) this.safe--
    const controls = this.demo ? this.demoInput() : input
    this.ride(controls)
    this.updateHazards()
    this.updatePackets()
    if (!this.inBonus && this.by < this.routeEnd) {
      this.inBonus = true
      this.banner = {
        text: 'BONUS RUN!',
        sub: 'TOSS AT THE TARGETS',
        ticks: 90,
      }
      this.sound.play('start')
    }
    if (this.by < this.bonusEnd) this.endDay()
  }

  private ride(input: InputFrame) {
    if (input.held.up) this.speed = Math.min(MAX_SPEED, this.speed + 0.04)
    else if (input.held.down)
      this.speed = Math.max(MIN_SPEED, this.speed - 0.05)
    else this.speed += (BASE_SPEED - this.speed) * 0.03
    if (input.held.left) this.bx = Math.max(MIN_X, this.bx - STEER)
    if (input.held.right) this.bx = Math.min(MAX_X, this.bx + STEER)
    this.by -= this.speed
    if (input.pressed.a && this.carry > 0) {
      this.carry--
      this.packets.push({
        x: this.bx - 6,
        y: this.by - 4,
        vy: -this.speed,
        t: 0,
      })
      this.sound.play('shoot')
    }
    for (const b of this.bundles) {
      if (
        b.gone ||
        Math.abs(b.x - this.bx) > 10 ||
        Math.abs(b.y - this.by) > 10
      )
        continue
      b.gone = true
      this.carry = CARRY
      this.floaters.push({
        x: this.bx,
        y: BOT_Y - 16,
        text: 'REFILL',
        life: 40,
      })
      this.sound.play('pickup')
    }
  }

  private updateHazards() {
    for (const h of this.hazards) {
      if (h.gone) continue
      // Things only start moving once they are nearly on screen.
      const sy = h.y - this.camera
      if (sy > -40) {
        h.x += h.vx
        h.y += h.vy
        if (h.kind === 'cat' && (h.x < SIDEWALK || h.x > STREET_R - 10))
          h.vx = -h.vx
      }
      if (this.safe > 0) continue
      if (h.kind === 'sprinkler') {
        // The spray sweeps out over the sidewalk half the time.
        const on = Math.floor((this.tick + h.y) / 90) % 2 === 0
        if (on && this.bx < SIDEWALK + 18 && Math.abs(h.y - this.by) < 10)
          this.crashBot('SOAKED BY A SPRINKLER', h)
        continue
      }
      if (
        Math.abs(h.x - this.bx) < h.w / 2 + 5 &&
        Math.abs(h.y - this.by) < h.h / 2 + 7
      )
        this.crashBot(
          h.kind === 'cat'
            ? 'A CAT ON A SKATEBOARD!'
            : h.kind === 'bin'
              ? 'HIT A ROLLING BIN'
              : 'BUMPED A PARKED CAR',
          h,
        )
    }
    this.hazards = this.hazards.filter(
      (h) => !h.gone && h.y - this.camera < H + 60,
    )
  }

  private updatePackets() {
    for (const p of this.packets) {
      p.t++
      p.x -= TOSS_VX
      p.y += p.vy
      // A mailbox catches it on the way past, then the doorstep, then the garden.
      for (const h of this.houses) {
        if (h.delivered && h.subscriber) continue
        const mailY = h.y + 22
        if (
          h.subscriber &&
          Math.abs(p.x - MAILBOX_X) < 5 &&
          Math.abs(p.y - mailY) < 9
        ) {
          this.deliver(h, MAILBOX_POINTS, 'MAILBOX!', p)
          break
        }
      }
      for (const t of this.targets) {
        if (!t.hit && Math.abs(p.x - t.x) < 7 && Math.abs(p.y - t.y) < 7) {
          t.hit = true
          p.t = 999
          this.addScore(TARGET_POINTS, t.x, t.y - this.camera - 10)
          this.sparkle(t.x, t.y - this.camera, '#fde047')
          this.sound.play('pop')
        }
      }
      if (p.t === TOSS_TICKS) this.land(p)
    }
    this.packets = this.packets.filter((p) => p.t < TOSS_TICKS)
  }

  private land(p: Packet) {
    const house = this.houses.find((h) => Math.abs(p.y - h.y) < 30)
    if (!house || p.x > MAILBOX_X) return
    if (house.subscriber && !house.delivered) {
      if (Math.abs(p.x - DOOR_X) < 14 && Math.abs(p.y - house.y) < 14)
        this.deliver(house, DOOR_POINTS, 'DOORSTEP', p)
      else this.deliver(house, GARDEN_POINTS * 2, 'ON THE LAWN', p)
    } else if (!house.subscriber) {
      this.addScore(GARDEN_POINTS, p.x, p.y - this.camera - 8)
      this.sparkle(p.x, p.y - this.camera, '#86efac')
    }
  }

  private deliver(h: House, points: number, label: string, p: Packet) {
    h.delivered = true
    p.t = 999
    this.addScore(points, p.x, p.y - this.camera - 10)
    this.floaters.push({
      x: Math.max(40, p.x + 4),
      y: p.y - this.camera - 20,
      text: label,
      life: 40,
    })
    this.sparkle(p.x, p.y - this.camera, h.color)
    this.sound.play('pickup')
  }

  private endDay() {
    if (this.dayEnd > 0 || this.over) return
    let missed = 0
    for (const h of this.houses)
      if (h.subscriber && !h.delivered) {
        h.subscriber = false
        missed++
      }
    const subs = this.houses.filter((h) => h.subscriber).length
    let sub = `${missed} CANCELLED`
    if (missed === 0) {
      const bonus = PERFECT_POINTS * this.level
      this.addScore(bonus, W / 2, 120)
      const grey = this.houses.filter((h) => !h.subscriber)
      if (grey.length)
        grey[Math.floor(this.rng() * grey.length)]!.subscriber = true
      sub = `PERFECT DAY  +${bonus}  A NEIGHBOUR SIGNS UP`
    }
    this.sound.play('level')
    if (subs === 0) {
      this.gameOver('NO SUBSCRIBERS LEFT')
      return
    }
    this.dayEnd = DAY_END_TICKS
    this.banner = { text: 'END OF THE DAY', sub, ticks: DAY_END_TICKS }
  }

  private crashBot(why: string, h: Hazard) {
    this.sparkle(this.bx, BOT_Y, '#fb923c')
    this.sound.play('die')
    if (h.kind !== 'sprinkler' && h.kind !== 'car') h.gone = true
    if (this.inBonus) {
      // On the bonus run a crash just ends the run.
      this.by = this.bonusEnd - 1
      this.endDay()
      return
    }
    this.lives--
    this.crash = CRASH_TICKS
    // Step back onto the sidewalk to carry on.
    if (h.kind === 'car') this.bx = SIDEWALK + 10
    this.banner = {
      text: 'CRASH!',
      sub: this.lives > 0 ? `${why}  ${this.lives} LEFT` : why,
      ticks: CRASH_TICKS,
    }
  }

  private gameOver(why: string) {
    this.over = true
    this.banner = { text: why, sub: 'GAME OVER', ticks: 9999 }
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x: number, y: number) {
    if (this.demo || points <= 0) return
    this.score += points
    // Keep labels clear of the screen edges.
    this.floaters.push({
      x: Math.max(20, Math.min(W - 20, x)),
      y,
      text: String(points),
      life: 45,
    })
  }

  private sparkle(x: number, y: number, color: string) {
    for (let i = 0; i < 10; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.4 + this.rng() * 1.4
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 0.5,
        life: 22 + Math.floor(this.rng() * 12),
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
    for (const f of this.floaters) {
      f.y -= 0.3
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
  }

  // --- attract-mode pilot -----------------------------------------------------

  /**
   * Rides the sidewalk at an even pace, sidesteps whatever is ahead, grabs
   * bundles when low, and tosses so the packet crosses each subscriber's
   * mailbox (or a bonus target) on the way past.
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
    // Where would a packet thrown now cross the mailbox line?
    const ticks = (this.bx - 6 - MAILBOX_X) / TOSS_VX
    const crossY = this.by - 4 - this.speed * ticks
    const flying = this.packets.length > 0
    for (const h of this.houses) {
      if (!h.subscriber || h.delivered || flying) continue
      if (Math.abs(crossY - (h.y + 22)) < 4) {
        held.a = true
        frame.pressed.a = true
      }
    }
    for (const t of this.targets) {
      if (t.hit || flying) continue
      const tt = (this.bx - 6 - t.x) / TOSS_VX
      if (
        tt > 0 &&
        tt < TOSS_TICKS &&
        Math.abs(this.by - 4 - this.speed * tt - t.y) < 4
      ) {
        held.a = true
        frame.pressed.a = true
      }
    }
    // Lane choice: the sidewalk by default, a bundle when running low.
    let wantX = SIDEWALK + 22
    const bundle = this.bundles.find(
      (b) => !b.gone && b.y < this.by && this.by - b.y < 120,
    )
    if (bundle && this.carry < 4) wantX = bundle.x
    // Dodge anything in the way over the next stretch.
    for (const hz of this.hazards) {
      if (hz.gone) continue
      const ahead = this.by - hz.y
      if (ahead < -10 || ahead > 70) continue
      if (hz.kind === 'sprinkler') {
        if (Math.floor((this.tick + hz.y) / 90) % 2 === 0 || ahead < 40)
          wantX = Math.max(wantX, SIDEWALK + 26)
        continue
      }
      const futureX = hz.x + hz.vx * (ahead / this.speed)
      if (Math.abs(futureX - wantX) < hz.w / 2 + 12)
        wantX =
          futureX > (MIN_X + MAX_X) / 2
            ? futureX - hz.w / 2 - 16
            : futureX + hz.w / 2 + 16
    }
    wantX = Math.max(MIN_X, Math.min(MAX_X, wantX))
    if (wantX < this.bx - 2) held.left = true
    if (wantX > this.bx + 2) held.right = true
    return frame
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    const cam = this.camera
    // Lawn, sidewalk, curb, street.
    g.fillStyle = '#4d7c0f'
    g.fillRect(0, 0, SIDEWALK, H)
    g.fillStyle = '#d6d3d1'
    g.fillRect(SIDEWALK, 0, STREET_L - SIDEWALK, H)
    g.fillStyle = '#a8a29e'
    for (let y = (((-cam % 16) + 16) % 16) - 16; y < H; y += 16)
      g.fillRect(SIDEWALK, y, STREET_L - SIDEWALK, 1)
    g.fillStyle = '#e7e5e4'
    g.fillRect(STREET_L - 2, 0, 2, H)
    g.fillStyle = '#44403c'
    g.fillRect(STREET_L, 0, W - STREET_L, H)
    g.fillStyle = '#fde047'
    for (let y = (((-cam % 30) + 30) % 30) - 30; y < H; y += 30)
      g.fillRect(STREET_L + 52, y, 2, 14)
    g.fillStyle = '#78716c'
    g.fillRect(STREET_R, 0, W - STREET_R, H)
    for (const h of this.houses) this.renderHouse(g, h.y - cam, h)
    for (const t of this.targets) this.renderTarget(g, t)
    for (const b of this.bundles) {
      if (b.gone) continue
      const sy = b.y - cam
      if (sy < -10 || sy > H + 10) continue
      g.fillStyle = '#fbcfe8'
      g.fillRect(b.x - 5, sy - 4, 10, 8)
      g.fillStyle = '#be185d'
      g.fillRect(b.x - 5, sy - 1, 10, 2)
    }
    for (const hz of this.hazards) this.renderHazard(g, hz)
    for (const p of this.packets) {
      const sy = p.y - cam
      const lift = Math.sin((p.t / TOSS_TICKS) * Math.PI) * 10
      g.fillStyle = 'rgba(0, 0, 0, 0.25)'
      g.fillRect(p.x - 2, sy, 4, 2)
      g.fillStyle = '#fbcfe8'
      g.fillRect(p.x - 3, sy - lift - 2, 6, 4)
      g.fillStyle = '#16a34a'
      g.fillRect(p.x - 1, sy - lift - 2, 2, 4)
    }
    if (this.crash === 0 && (this.safe === 0 || Math.floor(this.safe / 4) % 2))
      this.renderBot(g)
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
        shadow: '#1c1917',
      })
    this.renderHud(g)
  }

  private renderHouse(g: CanvasRenderingContext2D, sy: number, h: House) {
    if (sy < -60 || sy > H + 60) return
    const sub = h.subscriber
    // Roof, walls, door, flower box and mailbox.
    g.fillStyle = sub ? h.color : '#78716c'
    g.fillRect(8, sy - 30, 50, 48)
    g.fillStyle = sub ? '#7c2d12' : '#57534e'
    g.fillRect(4, sy - 36, 58, 8)
    g.fillStyle = sub ? '#fef3c7' : '#a8a29e'
    g.fillRect(16, sy - 18, 10, 8)
    g.fillRect(36, sy - 18, 10, 8)
    g.fillStyle = '#44403c'
    g.fillRect(56, sy - 6, 6, 14)
    g.fillStyle = '#a8a29e'
    g.fillRect(DOOR_X - 2, sy - 2, 18, 8)
    if (sub) {
      g.fillStyle = '#16a34a'
      g.fillRect(14, sy - 9, 14, 3)
      g.fillStyle = h.delivered ? '#fde047' : '#f472b6'
      for (let i = 0; i < 4; i++) g.fillRect(15 + i * 3, sy - 11, 2, 2)
    }
    // The mailbox by the sidewalk, flag up once delivered.
    const my = sy + 22
    g.fillStyle = '#57534e'
    g.fillRect(MAILBOX_X - 1, my, 2, 8)
    g.fillStyle = sub ? '#e2e8f0' : '#a8a29e'
    g.fillRect(MAILBOX_X - 4, my - 5, 8, 6)
    if (sub && h.delivered) {
      g.fillStyle = '#ef4444'
      g.fillRect(MAILBOX_X + 4, my - 8, 2, 5)
    }
  }

  private renderTarget(g: CanvasRenderingContext2D, t: Target) {
    const sy = t.y - this.camera
    if (sy < -12 || sy > H + 12) return
    g.fillStyle = t.hit ? '#a8a29e' : '#f8fafc'
    g.beginPath()
    g.arc(t.x, sy, 7, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = t.hit ? '#78716c' : '#ef4444'
    g.beginPath()
    g.arc(t.x, sy, 4, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#f8fafc'
    g.fillRect(t.x - 1, sy - 1, 2, 2)
  }

  private renderHazard(g: CanvasRenderingContext2D, hz: Hazard) {
    const sy = hz.y - this.camera
    if (sy < -40 || sy > H + 40) return
    if (hz.kind === 'cat') {
      g.fillStyle = '#7c2d12'
      g.fillRect(hz.x - 6, sy + 3, 12, 2)
      g.fillStyle = '#1e293b'
      g.fillRect(hz.x - 5, sy + 5, 2, 2)
      g.fillRect(hz.x + 3, sy + 5, 2, 2)
      g.fillStyle = '#f97316'
      g.fillRect(hz.x - 4, sy - 4, 8, 7)
      g.fillRect(hz.x + (hz.vx > 0 ? 2 : -6), sy - 7, 4, 4)
      g.fillStyle = '#fff7ed'
      g.fillRect(hz.x + (hz.vx > 0 ? 3 : -5), sy - 6, 1, 1)
    } else if (hz.kind === 'bin') {
      g.fillStyle = '#15803d'
      g.fillRect(hz.x - 5, sy - 6, 10, 12)
      g.fillStyle = '#166534'
      g.fillRect(hz.x - 6, sy - 7, 12, 3)
      g.fillStyle = '#1e293b'
      g.fillRect(hz.x - 5, sy + 5, 3, 2)
      g.fillRect(hz.x + 2, sy + 5, 3, 2)
    } else if (hz.kind === 'car') {
      g.fillStyle = '#3b82f6'
      g.fillRect(hz.x - 9, sy - 16, 18, 32)
      g.fillStyle = '#bfdbfe'
      g.fillRect(hz.x - 7, sy - 12, 14, 6)
      g.fillRect(hz.x - 7, sy + 6, 14, 5)
      g.fillStyle = '#1e293b'
      g.fillRect(hz.x - 10, sy - 12, 2, 6)
      g.fillRect(hz.x + 8, sy - 12, 2, 6)
      g.fillRect(hz.x - 10, sy + 6, 2, 6)
      g.fillRect(hz.x + 8, sy + 6, 2, 6)
    } else {
      g.fillStyle = '#64748b'
      g.fillRect(hz.x - 2, sy - 2, 4, 4)
      if (Math.floor((this.tick + hz.y) / 90) % 2 === 0) {
        g.fillStyle = 'rgba(125, 211, 252, 0.55)'
        const sweep = Math.sin(this.tick / 8) * 6
        g.beginPath()
        g.moveTo(hz.x, sy)
        g.lineTo(SIDEWALK + 20, sy - 8 + sweep)
        g.lineTo(SIDEWALK + 20, sy + 8 + sweep)
        g.closePath()
        g.fill()
      }
    }
  }

  private renderBot(g: CanvasRenderingContext2D) {
    const x = Math.round(this.bx)
    const y = BOT_Y
    const wob = Math.floor(this.tick / 6) % 2
    // Scooter deck and wheels.
    g.fillStyle = '#1e293b'
    g.fillRect(x - 2, y + 6, 4, 3)
    g.fillRect(x - 2, y - 9, 4, 3)
    g.fillStyle = '#ec4899'
    g.fillRect(x - 3, y - 7, 6, 14)
    // Handlebar and the bot.
    g.fillStyle = '#94a3b8'
    g.fillRect(x - 6, y - 8, 12, 2)
    g.fillStyle = '#e2e8f0'
    g.fillRect(x - 5, y - 4 + wob, 10, 9)
    g.fillStyle = '#38bdf8'
    g.fillRect(x - 3, y - 2 + wob, 6, 3)
    // The satchel of packets.
    g.fillStyle = '#a16207'
    g.fillRect(x - 8, y, 4, 6)
  }

  private renderHud(g: CanvasRenderingContext2D) {
    const shadow = '#1c1917'
    g.fillStyle = 'rgba(28, 25, 23, 0.9)'
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
    drawText(g, `DAY ${this.level}`, W - 4, 12, {
      align: 'right',
      color: '#bef264',
    })
    const subs = this.houses.filter((h) => h.subscriber).length
    drawText(g, `HOMES ${subs}`, 88, 3, { color: '#fbcfe8' })
    // Packets left.
    for (let i = 0; i < this.carry; i++) {
      g.fillStyle = '#fbcfe8'
      g.fillRect(88 + i * 6, 14, 4, 5)
      g.fillStyle = '#16a34a'
      g.fillRect(89 + i * 6, 14, 2, 5)
    }
    for (let i = 0; i < Math.min(this.lives - 1, 4); i++) {
      g.fillStyle = '#ec4899'
      g.fillRect(156 + i * 8, 6, 4, 8)
      g.fillStyle = '#e2e8f0'
      g.fillRect(155 + i * 8, 4, 6, 4)
    }
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, 92, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        shadow,
      })
      if (this.banner.sub)
        drawText(g, this.banner.sub, W / 2, 112, {
          align: 'center',
          color: '#fef9c3',
          shadow,
        })
    }
  }
}

const petalPost: ArcadeGameModule = {
  create: (options) => new PetalPost(options),
}

export const create = petalPost.create
export default petalPost
