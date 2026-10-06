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
import { drawText } from '../font'
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
      if (perfect) this.addScore(5000, W / 2, 140)
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
    g.fillStyle = '#0b0620'
    g.fillRect(0, -4, W, H + 8)
    // Brick wall backdrop.
    g.fillStyle = '#1e1b4b'
    for (let y = 20; y < H; y += 16) {
      for (let x = (y / 16) % 2 ? -12 : 0; x < W; x += 24)
        g.fillRect(x + 1, y + 1, 22, 14)
    }
    this.renderPipes(g)
    this.renderFloors(g)
    this.renderKindBlock(g)
    for (const coin of this.coins) this.renderCoin(g, coin)
    for (const c of this.critters) this.renderCritter(g, c)
    if (
      this.alive &&
      !(this.invuln > 0 && Math.floor(this.invuln / 6) % 2 === 0)
    ) {
      this.renderPlayer(g)
    }
    for (const s of this.sparks) {
      g.globalAlpha = Math.max(0, s.life / 30)
      g.fillStyle = s.color
      g.fillRect(s.x - 1, s.y - 1, 2, 2)
    }
    g.globalAlpha = 1
    for (const f of this.floaters) {
      drawText(g, f.text, f.x, f.y, { align: 'center', color: '#fde68a' })
    }
    g.restore()
    this.renderHud(g)
  }

  private renderPipes(g: CanvasRenderingContext2D) {
    g.fillStyle = '#16a34a'
    for (const pipe of TOP_PIPES) {
      const x = pipe.dir > 0 ? 0 : W - 32
      g.fillRect(x, pipe.y - 22, 32, 18)
      g.fillStyle = '#4ade80'
      g.fillRect(pipe.dir > 0 ? 28 : W - 32, pipe.y - 26, 4, 26)
      g.fillStyle = '#16a34a'
    }
    // Bottom pipes.
    g.fillRect(0, 286, 22, 24)
    g.fillRect(W - 22, 286, 22, 24)
    g.fillStyle = '#4ade80'
    g.fillRect(18, 282, 6, 28)
    g.fillRect(W - 24, 282, 6, 28)
  }

  private renderFloors(g: CanvasRenderingContext2D) {
    for (const s of PIPE_LEVELS) {
      for (let x = s.x0; x < s.x1; x += 8) {
        let lift = 0
        if (
          this.bump &&
          this.bump.y === s.y &&
          Math.abs(x + 4 - this.bump.x) < BUMP_REACH
        ) {
          lift = Math.sin((this.bump.ticks / BUMP_TICKS) * Math.PI) * 5
        }
        g.fillStyle = s.y === 310 ? '#7c3aed' : '#2dd4bf'
        g.fillRect(x, s.y - lift, 8, THICK)
        g.fillStyle = s.y === 310 ? '#a78bfa' : '#99f6e4'
        g.fillRect(x, s.y - lift, 8, 2)
      }
    }
  }

  private renderKindBlock(g: CanvasRenderingContext2D) {
    if (this.kindBlockUses <= 0) return
    const kb = KIND_BLOCK
    const squash = this.kindShake > 0 ? 3 : 0
    g.fillStyle = '#ec4899'
    g.fillRect(kb.x, kb.y + squash, kb.w, kb.h - squash)
    g.fillStyle = '#fbcfe8'
    g.fillRect(kb.x + 2, kb.y + 2 + squash, kb.w - 4, 2)
    drawText(g, '*', kb.x + kb.w / 2, kb.y + 5 + squash, {
      align: 'center',
      color: '#ffffff',
    })
    for (let i = 0; i < this.kindBlockUses; i++) {
      g.fillStyle = '#fde68a'
      g.fillRect(kb.x + 5 + i * 6, kb.y + kb.h - 3, 3, 2)
    }
  }

  private renderCoin(g: CanvasRenderingContext2D, coin: Coin) {
    const w = 3 + Math.abs(Math.sin(this.tick / 6)) * 3
    g.fillStyle = '#facc15'
    g.beginPath()
    g.ellipse(coin.x, coin.y, w, 6, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#fef08a'
    g.fillRect(coin.x - 1, coin.y - 4, 2, 8)
  }

  private renderPlayer(g: CanvasRenderingContext2D) {
    const p = this.player
    const step = p.onGround && Math.abs(p.vx) > 0.3 ? Math.floor(p.run) % 2 : 0
    const x = Math.round(p.x)
    const y = Math.round(p.y)
    // Legs, body, head, cat ears, headphones.
    g.fillStyle = '#0f766e'
    g.fillRect(x - 4 + step, y - 5, 3, 5)
    g.fillRect(x + 1 - step, y - 5, 3, 5)
    g.fillStyle = '#2dd4bf'
    g.fillRect(x - 5, y - 11, 10, 7)
    g.fillStyle = '#5eead4'
    g.beginPath()
    g.arc(x, y - 14, 4, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#14b8a6'
    g.beginPath()
    g.moveTo(x - 4, y - 16)
    g.lineTo(x - 3, y - 21)
    g.lineTo(x - 1, y - 17)
    g.moveTo(x + 4, y - 16)
    g.lineTo(x + 3, y - 21)
    g.lineTo(x + 1, y - 17)
    g.fill()
    g.fillStyle = '#facc15'
    g.fillRect(x - 5, y - 15, 2, 3)
    g.fillRect(x + 3, y - 15, 2, 3)
    g.fillStyle = '#1e1b4b'
    g.fillRect(x + p.face * 1.5 - 0.5, y - 15, 1.5, 1.5)
  }

  private renderCritter(g: CanvasRenderingContext2D, c: Critter) {
    const x = Math.round(c.x)
    const y = Math.round(c.y)
    const upside = c.flipped > 0 || c.kicked
    const warning =
      c.flipped > 0 && c.flipped < 120 && Math.floor(c.flipped / 8) % 2 === 0
    const shell =
      c.kind === 'crab'
        ? c.angry
          ? '#ef4444'
          : '#fb923c'
        : c.rage > 0
          ? '#f472b6'
          : '#a3e635'
    g.save()
    g.translate(x, y - CRITTER_H / 2)
    if (upside) g.scale(1, -1)
    g.fillStyle = warning ? '#ffffff' : shell
    g.beginPath()
    g.ellipse(0, -1, CRITTER_W / 2, CRITTER_H / 2 - 1, 0, Math.PI, 0)
    g.fill()
    g.fillRect(-CRITTER_W / 2, -1, CRITTER_W, 4)
    g.fillStyle = '#1e1b4b'
    const legs = Math.floor(this.tick / 6) % 2
    g.fillRect(-5 + legs, 3, 2, 3)
    g.fillRect(3 - legs, 3, 2, 3)
    if (c.kind === 'crab') {
      g.fillStyle = shell
      g.fillRect(-9, -3, 3, 3)
      g.fillRect(6, -3, 3, 3)
    }
    g.fillStyle = '#fef9c3'
    g.fillRect(c.dir > 0 ? 2 : -4, -4, 2, 2)
    g.restore()
  }

  private renderHud(g: CanvasRenderingContext2D) {
    const shadow = '#1e1b4b'
    drawText(g, String(this.score).padStart(6, '0'), 8, 4, {
      scale: 2,
      color: '#2dd4bf',
      shadow,
    })
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W / 2, 4, {
      scale: 2,
      align: 'center',
      color: '#fde68a',
      shadow,
    })
    for (let i = 0; i < Math.min(this.lives, 5); i++) {
      drawText(g, '*', W - 14 - i * 14, 4, {
        scale: 2,
        color: '#2dd4bf',
        shadow,
      })
    }
    drawText(
      g,
      this.bonusRound > 0
        ? `BONUS ${Math.ceil(this.bonusRound / 60)}`
        : `PHASE ${this.level}`,
      30,
      H - 12,
      {
        color: '#c4b5fd',
      },
    )
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, 140, {
        scale: 3,
        align: 'center',
        color: '#ffffff',
        shadow: '#15803d',
      })
      if (this.banner.sub) {
        drawText(g, this.banner.sub, W / 2, 170, {
          scale: 2,
          align: 'center',
          color: '#fde68a',
          shadow,
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
