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
import { drawText } from '../font'
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
const BACKDROPS = [
  { sky: '#1e1b4b', plat: '#f472b6', top: '#fbcfe8' },
  { sky: '#042f2e', plat: '#2dd4bf', top: '#99f6e4' },
  { sky: '#2e1065', plat: '#a78bfa', top: '#ddd6fe' },
  { sky: '#431407', plat: '#fb923c', top: '#fed7aa' },
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
        if (Math.abs(b.x - g.x) < BUBBLE_R + 5 && Math.abs(b.y - (g.y - 6)) < BUBBLE_R + 6) {
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
      if (Math.abs(b.x - p.x) < BUBBLE_R + 5 && Math.abs(b.y - (p.y - 7)) < BUBBLE_R + 7) {
        this.bubbles.splice(i, 1)
        if (b.held) this.popHeld(b)
        else {
          this.addScore(10, b.x, b.y)
          this.burst(b.x, b.y, 6, '#bae6fd')
          this.sound.play('pop')
        }
      }
    }
    // Collect gems.
    this.gems = this.gems.filter((gem) => {
      if (Math.abs(gem.x - p.x) < 9 && Math.abs(gem.y - p.y) < 12) {
        this.addScore(300, gem.x, gem.y - 8)
        this.sound.play('pickup')
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
          this.banner = { text: this.lives > 0 ? 'OUCH!' : 'GAME OVER', ticks: 70 }
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
    if (!popTarget && sameRow && facing && Math.abs(dx) < 90 && this.tick % 20 === 0) {
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
    const bd = BACKDROPS[(this.level - 1) % BACKDROPS.length]!
    g.fillStyle = bd.sky
    g.fillRect(0, 0, W, H)
    // Drifting backdrop dots.
    g.fillStyle = 'rgba(255,255,255,0.08)'
    for (let i = 0; i < 18; i++) {
      const x = (i * 53) % W
      const y = (i * 37 + this.tick * 0.1 * ((i % 3) + 1)) % H
      g.fillRect(x, y, 3, 3)
    }
    // Floor and platforms.
    g.fillStyle = bd.plat
    g.fillRect(0, FLOOR_Y, W, H - FLOOR_Y)
    g.fillStyle = bd.top
    g.fillRect(0, FLOOR_Y, W, 2)
    for (const p of this.platforms) {
      g.fillStyle = bd.plat
      g.fillRect(p.x, p.y, p.w, 8)
      g.fillStyle = bd.top
      g.fillRect(p.x, p.y, p.w, 2)
    }
    for (const gem of this.gems) {
      if (gem.life < 90 && Math.floor(this.tick / 4) % 2) continue
      g.fillStyle = gem.color
      g.fillRect(gem.x - 3, gem.y - 8, 6, 6)
      g.fillStyle = '#ffffff'
      g.fillRect(gem.x - 2, gem.y - 7, 2, 2)
    }
    for (const gr of this.gremlins) this.renderGremlin(g, gr, gr.x, gr.y, 1)
    for (const b of this.bubbles) this.renderBubble(g, b)
    this.renderPlayer(g)
    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, p.life / 28)
      g.fillStyle = p.color
      g.fillRect(p.x - 1, p.y - 1, 2, 2)
    }
    g.globalAlpha = 1
    for (const f of this.floaters) {
      drawText(g, f.text, f.x, f.y, { align: 'center', color: '#fde68a' })
    }
    this.renderHud(g)
  }

  private renderGremlin(
    g: CanvasRenderingContext2D,
    gr: Gremlin,
    x: number,
    y: number,
    scale: number,
  ) {
    const w = 12 * scale
    const h = 11 * scale
    g.fillStyle = gr.angry ? '#ef4444' : KIND_COLORS[gr.kind]!
    g.fillRect(x - w / 2, y - h, w, h)
    g.fillRect(x - w / 2 + 1, y - h - 2, 2, 2)
    g.fillRect(x + w / 2 - 3, y - h - 2, 2, 2)
    g.fillStyle = '#ffffff'
    g.fillRect(x - 4 * scale, y - h + 2, 3 * scale, 3 * scale)
    g.fillRect(x + 1 * scale, y - h + 2, 3 * scale, 3 * scale)
    g.fillStyle = '#111827'
    const look = gr.dir === 1 ? 1 : 0
    g.fillRect(x - 4 * scale + look, y - h + 3, 2, 2)
    g.fillRect(x + 1 * scale + look, y - h + 3, 2, 2)
  }

  private renderBubble(g: CanvasRenderingContext2D, b: Bubble) {
    const r = BUBBLE_R + (b.held ? 3 : 0)
    if (b.held) {
      this.renderGremlin(g, b.held, b.x, b.y + 6, 0.8)
    }
    const flicker = b.held && b.holdLeft < 90 && Math.floor(this.tick / 4) % 2
    g.fillStyle = flicker ? 'rgba(254,202,202,0.45)' : 'rgba(186,230,253,0.28)'
    g.beginPath()
    g.arc(b.x, b.y, r, 0, Math.PI * 2)
    g.fill()
    g.strokeStyle = flicker ? '#fca5a5' : '#e0f2fe'
    g.lineWidth = 1.5
    g.stroke()
    g.fillStyle = '#ffffff'
    g.fillRect(b.x - r / 2, b.y - r / 2, 2, 2)
  }

  private renderPlayer(g: CanvasRenderingContext2D) {
    const p = this.player
    if (this.dead > 0) return
    if (this.invuln > 0 && Math.floor(this.tick / 4) % 2) return
    const x = p.x
    const y = p.y
    g.fillStyle = '#2dd4bf'
    g.fillRect(x - 6, y - 13, 12, 12)
    g.fillStyle = '#0f766e'
    g.fillRect(x - 6, y - 4, 12, 4)
    // Cat ears and antenna.
    g.fillStyle = '#2dd4bf'
    g.fillRect(x - 6, y - 16, 3, 3)
    g.fillRect(x + 3, y - 16, 3, 3)
    g.fillStyle = '#facc15'
    g.fillRect(x - 1, y - 17, 2, 4)
    // Face looks the way it walks.
    g.fillStyle = '#ffffff'
    const ex = p.face === 1 ? 1 : -4
    g.fillRect(x + ex, y - 10, 3, 3)
    g.fillStyle = '#111827'
    g.fillRect(x + ex + (p.face === 1 ? 1 : 0), y - 9, 2, 2)
    // Walking feet.
    g.fillStyle = '#f472b6'
    const step = p.onGround && p.vx !== 0 ? Math.floor(this.tick / 6) % 2 : 0
    g.fillRect(x - 6 + step, y - 1, 4, 1)
    g.fillRect(x + 2 - step, y - 1, 4, 1)
  }

  private renderHud(g: CanvasRenderingContext2D) {
    const shadow = '#1e1b4b'
    drawText(g, String(this.score).padStart(6, '0'), 6, 5, {
      scale: 2,
      color: '#fde047',
      shadow,
    })
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W - 6, 3, {
      align: 'right',
      color: '#f9a8d4',
      shadow,
    })
    drawText(g, `ROUND ${this.level}`, W - 6, 13, {
      align: 'right',
      color: '#a5f3fc',
    })
    for (let i = 0; i < Math.min(this.lives, 5); i++) {
      g.fillStyle = '#2dd4bf'
      g.fillRect(100 + i * 9, 6, 6, 6)
    }
    if (this.chain > 1 && this.chainLeft > 0) {
      drawText(g, `CHAIN X${this.chain}`, 100, 16, { color: '#fde68a' })
    }
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, 100, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        shadow: '#7c3aed',
      })
      if (this.banner.sub) {
        drawText(g, this.banner.sub, W / 2, 120, {
          align: 'center',
          color: '#fde68a',
          shadow,
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
