// /utils/arcade/games/butterflyJoust.ts
//
// Butterfly Joust -- the Kind Robots Arcade's riff on the 1982 flapping
// joust (conductor kr-arcade/t-009 game factory). The teal cat-eared robot
// rides a rainbow butterfly: tap A to flap, steer left and right, and the
// edges wrap around. Touch a grumpy moth rider while you are higher and you
// bonk them: they curl into a cocoon you can scoop up for points before it
// hatches into a tougher rider. Lower loses; level bounces both apart. Fall
// into the pond and you lose a butterfly. Dawdle and a storm cloud comes
// hunting -- bonk it from above to pop it. Every fifth wave is a cocoon wave.

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
const POND_Y = 322
const CEILING = 26
const THICK = 6
const GRAVITY = 0.1
const FLAP = 1.9
const MAX_RISE = -3.2
const MAX_FALL = 3
const AIR_ACCEL = 0.06
const AIR_MAX = 2.2
const WALK_MAX = 1.4
const HALF_W = 9
const HALF_H = 8
const START_LIVES = 3
const EXTRA_LIFE_EVERY = 20_000
const AUTO_FLAP_TICKS = 10
const SURVIVOR_BONUS = 3000
/** Riders within this many pixels of the same height bounce instead of bonking. */
const LEVEL_BAND = 6

type Ledge = { x0: number; x1: number; y: number }

/** Ledge tops (y) and spans; the bottom ledge crumbles in later waves. */
export const JOUST_LEDGES: Ledge[] = [
  { x0: 70, x1: 378, y: 304 },
  { x0: -20, x1: 92, y: 226 },
  { x0: 356, x1: W + 20, y: 226 },
  { x0: 168, x1: 280, y: 196 },
  { x0: 34, x1: 138, y: 126 },
  { x0: 310, x1: 414, y: 126 },
  { x0: 186, x1: 262, y: 74 },
]

const SPAWNS = [
  { x: 224, y: 196 },
  { x: 86, y: 126 },
  { x: 362, y: 126 },
  { x: 40, y: 226 },
  { x: 408, y: 226 },
]

export const JOUST_CURVES = {
  rivals: { start: 2, step: 1, limit: 8 },
  hunterShare: { start: 0, step: 0.15, limit: 0.6 },
  shadowShare: { start: -0.16, step: 0.08, limit: 0.35 },
  riderSpeed: { start: 1.2, step: 0.08, limit: 2 },
  hatchTicks: { start: 600, step: -40, limit: 300 },
  stormAfter: { start: 60 * 45, step: -60 * 3, limit: 60 * 25 },
  stormSpeed: { start: 0.9, step: 0.06, limit: 1.5 },
  crumble: { start: -16, step: 8, limit: 56 },
} as const

/** 0 drifter, 1 hunter, 2 shadow: points, colours and smarts all step up. */
type Tier = 0 | 1 | 2
const TIER_POINTS = [500, 750, 1500]
const TIER_WINGS = ['#f87171', '#a78bfa', '#475569']
const TIER_SPEED = [0.75, 1, 1.15]
const TIER_FLAP_GAP = [16, 12, 9]

type Body = {
  x: number
  y: number
  vx: number
  vy: number
  ground: Ledge | null
  flap: number
}
type Rival = Body & {
  tier: Tier
  dir: number
  targetY: number
  retarget: number
  cooldown: number
  /** Ticks left shimmering into the world; can't be bonked meanwhile. */
  spawn: number
}
type Cocoon = {
  x: number
  y: number
  vy: number
  ground: Ledge | null
  hatch: number
  tier: Tier
}
type Storm = { x: number; y: number; t: number }
type Spark = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = { x: number; y: number; text: string; life: number }

/** Shortest signed horizontal distance from a to b on the wrapping field. */
export function wrapDx(a: number, b: number): number {
  let d = b - a
  if (d > W / 2) d -= W
  if (d < -W / 2) d += W
  return d
}

function wrapX(x: number): number {
  return ((x % W) + W) % W
}

function onLedge(l: Ledge, x: number): boolean {
  return (
    (x >= l.x0 && x <= l.x1) ||
    (x + W >= l.x0 && x + W <= l.x1) ||
    (x - W >= l.x0 && x - W <= l.x1)
  )
}

class ButterflyJoust implements ArcadeGameInstance {
  score = 0
  level = 0
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private player: Body & { facing: number } = {
    x: W / 2,
    y: 304 - HALF_H,
    vx: 0,
    vy: 0,
    ground: null,
    flap: 0,
    facing: 1,
  }
  private autoFlap = 0
  private alive = true
  private respawn = 0
  private invuln = 0
  private rivals: Rival[] = []
  private cocoons: Cocoon[] = []
  private storm: Storm | null = null
  private sparks: Spark[] = []
  private floaters: Floater[] = []
  private ledges: Ledge[] = JOUST_LEDGES.map((l) => ({ ...l }))
  private waveTicks = 0
  private collected = 0
  private diedThisWave = false
  private clearing = 0
  private cocoonWave = false
  private overTimer = 0
  private nextExtra = EXTRA_LIFE_EVERY
  private banner: { text: string; sub?: string; ticks: number } | null = null

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.startWave(1)
  }

  // --- setup ------------------------------------------------------------------

  private startWave(wave: number) {
    this.level = wave
    this.rivals = []
    this.cocoons = []
    this.storm = null
    this.waveTicks = 0
    this.collected = 0
    this.diedThisWave = false
    this.clearing = 0
    // The bottom ledge crumbles in from both ends as the waves go on.
    const crumble = Math.max(0, levelCurve(wave, JOUST_CURVES.crumble))
    this.ledges = JOUST_LEDGES.map((l, i) =>
      i === 0 ? { ...l, x0: l.x0 + crumble, x1: l.x1 - crumble } : { ...l },
    )
    this.cocoonWave = everyNthLevel(wave, 5)
    if (this.cocoonWave) {
      // Cocoon wave: scoop them all up before they hatch.
      const hatch = Math.round(levelCurve(wave, JOUST_CURVES.hatchTicks)) + 480
      for (let i = 0; i < 8; i++) {
        const ledge = this.ledges[1 + (i % (this.ledges.length - 1))]!
        const span = ledge.x1 - ledge.x0
        const x = wrapX(ledge.x0 + span * (0.25 + (0.5 * ((i * 37) % 7)) / 7))
        this.cocoons.push({
          x,
          y: ledge.y - 5,
          vy: 0,
          ground: ledge,
          hatch: hatch + i * 30,
          tier: 0,
        })
      }
      this.banner = {
        text: 'COCOON WAVE!',
        sub: 'SCOOP THEM ALL UP',
        ticks: 120,
      }
    } else {
      const count = Math.floor(levelCurve(wave, JOUST_CURVES.rivals))
      const hunters = levelCurve(wave, JOUST_CURVES.hunterShare)
      const shadows = Math.max(0, levelCurve(wave, JOUST_CURVES.shadowShare))
      for (let i = 0; i < count; i++) {
        const roll = this.rng()
        const tier: Tier = roll < shadows ? 2 : roll < shadows + hunters ? 1 : 0
        this.addRival(tier, i * 40)
      }
      this.banner = { text: `WAVE ${wave}`, ticks: 90 }
    }
    this.placePlayer()
  }

  private addRival(tier: Tier, delay = 0, at?: { x: number; y: number }) {
    const spot = at ?? SPAWNS[Math.floor(this.rng() * SPAWNS.length)]!
    this.rivals.push({
      x: spot.x,
      y: spot.y - HALF_H,
      vx: 0,
      vy: 0,
      ground: null,
      flap: 0,
      tier,
      dir: this.rng() < 0.5 ? -1 : 1,
      targetY: 120,
      retarget: 0,
      cooldown: 20,
      spawn: 50 + delay,
    })
  }

  private placePlayer() {
    const p = this.player
    const bottom = this.ledges[0]!
    Object.assign(p, {
      x: (bottom.x0 + bottom.x1) / 2,
      y: bottom.y - HALF_H,
      vx: 0,
      vy: 0,
      ground: bottom,
      flap: 0,
      facing: 1,
    })
    this.invuln = 120
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    if (this.lives <= 0 && !this.alive) {
      if (++this.overTimer > 100) this.over = true
      return
    }
    if (this.clearing > 0) {
      if (--this.clearing <= 0) this.startWave(this.level + 1)
      return
    }
    if (!this.alive) {
      if (--this.respawn <= 0) {
        this.alive = true
        this.placePlayer()
      }
      this.moveRivals()
      this.moveCocoons()
      return
    }

    this.waveTicks++
    const controls = this.demo ? this.demoInput() : input
    this.movePlayer(controls)
    this.moveRivals()
    this.moveCocoons()
    this.moveStorm()
    this.collide()
    this.checkWave()
  }

  private flapBody(b: Body) {
    b.vy = Math.max(MAX_RISE, b.vy - FLAP)
    b.ground = null
    b.flap = 8
  }

  /** Gravity, ledges, ceiling and wrap for any flier. Returns true if it fell in the pond. */
  private physics(b: Body, maxSpeed: number): boolean {
    if (b.flap > 0) b.flap--
    if (b.ground) {
      b.vx = Math.max(-WALK_MAX, Math.min(WALK_MAX, b.vx))
      b.x = wrapX(b.x + b.vx)
      if (!onLedge(b.ground, b.x)) b.ground = null
      else {
        b.y = b.ground.y - HALF_H
        b.vy = 0
        return false
      }
    }
    b.vx = Math.max(-maxSpeed, Math.min(maxSpeed, b.vx * 0.995))
    b.vy = Math.min(MAX_FALL, b.vy + GRAVITY)
    const prevTop = b.y - HALF_H
    const prevBottom = b.y + HALF_H
    b.x = wrapX(b.x + b.vx)
    b.y += b.vy
    for (const l of this.ledges) {
      if (!onLedge(l, b.x)) continue
      if (b.vy >= 0 && prevBottom <= l.y && b.y + HALF_H >= l.y) {
        b.y = l.y - HALF_H
        b.vy = 0
        b.ground = l
      } else if (
        b.vy < 0 &&
        prevTop >= l.y + THICK &&
        b.y - HALF_H <= l.y + THICK
      ) {
        b.y = l.y + THICK + HALF_H
        b.vy = 0.6
      }
    }
    if (b.y - HALF_H < CEILING) {
      b.y = CEILING + HALF_H
      b.vy = Math.abs(b.vy) * 0.4
    }
    return b.y > POND_Y
  }

  private movePlayer(input: InputFrame) {
    const p = this.player
    if (this.invuln > 0) this.invuln--
    let dx = 0
    if (input.held.left) dx -= 1
    if (input.held.right) dx += 1
    if (dx) p.facing = dx
    if (p.ground) {
      p.vx = dx ? p.vx + dx * 0.15 : p.vx * 0.8
    } else if (dx) {
      p.vx += dx * AIR_ACCEL
    }
    // Tap A to flap; holding A keeps flapping at a steady beat for touch players.
    if (this.autoFlap > 0) this.autoFlap--
    if (input.pressed.a || (input.held.a && this.autoFlap === 0)) {
      this.flapBody(p)
      this.autoFlap = AUTO_FLAP_TICKS
      if (this.tick % 2 === 0) this.sound.play('blip')
    }
    if (this.physics(p, AIR_MAX)) this.splash(p.x)
  }

  private moveRivals() {
    const p = this.player
    const speed = levelCurve(this.level, JOUST_CURVES.riderSpeed)
    for (const r of this.rivals) {
      if (r.spawn > 0) {
        r.spawn--
        continue
      }
      if (--r.retarget <= 0) {
        r.retarget = 60 + Math.floor(this.rng() * 60)
        if (r.tier === 0) {
          r.targetY = 60 + this.rng() * 200
          if (this.rng() < 0.25) r.dir = -r.dir
        }
      }
      if (r.tier > 0 && this.alive) {
        // Hunters chase your height; shadows try to get above you.
        r.targetY = p.y - (r.tier === 2 ? 28 : 6)
        const toward = Math.sign(wrapDx(r.x, p.x)) || r.dir
        if (r.retarget % 20 === 0) r.dir = toward
      }
      const max = speed * TIER_SPEED[r.tier]!
      r.vx += r.dir * (r.ground ? 0.15 : 0.05)
      if (r.cooldown > 0) r.cooldown--
      const wantsUp = r.y > r.targetY + 4 || (r.y > POND_Y - 50 && r.vy > 0)
      if (wantsUp && r.cooldown === 0) {
        this.flapBody(r)
        r.cooldown = TIER_FLAP_GAP[r.tier]! + Math.floor(this.rng() * 6)
      }
      if (this.physics(r, max)) {
        r.spawn = -1
        this.burst(r.x, POND_Y, 10, '#7dd3fc')
        this.sound.play('pop')
      }
    }
    this.rivals = this.rivals.filter((r) => r.spawn >= 0)
  }

  private moveCocoons() {
    for (const c of this.cocoons) {
      c.hatch--
      if (c.ground) {
        if (!onLedge(c.ground, c.x)) c.ground = null
      } else {
        const prev = c.y
        c.vy = Math.min(MAX_FALL, c.vy + GRAVITY)
        c.y += c.vy
        for (const l of this.ledges) {
          if (onLedge(l, c.x) && prev + 5 <= l.y && c.y + 5 >= l.y) {
            c.y = l.y - 5
            c.vy = 0
            c.ground = l
          }
        }
      }
      if (c.hatch === 60) this.sound.play('warn')
      if (c.hatch <= 0) {
        // Out pops a tougher rider.
        const tier = Math.min(2, c.tier + 1) as Tier
        this.addRival(tier, -20, { x: c.x, y: c.y + 5 })
        c.hatch = -999
      }
    }
    this.cocoons = this.cocoons.filter((c) => c.hatch > -999 && c.y < POND_Y)
  }

  private moveStorm() {
    const after = levelCurve(this.level, JOUST_CURVES.stormAfter)
    if (
      !this.storm &&
      !this.cocoonWave &&
      this.waveTicks === Math.round(after)
    ) {
      this.storm = { x: this.rng() < 0.5 ? -20 : W + 20, y: 40, t: 0 }
      this.banner = { text: 'STORM CLOUD!', sub: 'DONT DAWDLE', ticks: 90 }
      this.sound.play('warn')
    }
    const s = this.storm
    if (!s) return
    s.t++
    const speed = levelCurve(this.level, JOUST_CURVES.stormSpeed)
    const p = this.player
    const dx = wrapDx(s.x, p.x)
    const dy = p.y - s.y
    const len = Math.hypot(dx, dy) || 1
    s.x = wrapX(s.x + (dx / len) * speed)
    s.y += (dy / len) * speed + Math.sin(s.t / 12) * 0.4
  }

  private collide() {
    const p = this.player
    // Storm cloud: deadly, unless you bonk it from above.
    const s = this.storm
    if (s && Math.abs(wrapDx(p.x, s.x)) < 22 && Math.abs(p.y - s.y) < 18) {
      if (p.y < s.y - 8 && p.vy > 0) {
        this.addScore(2000, s.x, s.y - 16)
        this.burst(s.x, s.y, 30, '#93c5fd')
        this.sound.play('boom')
        this.storm = null
        p.vy = -2.5
      } else if (this.invuln <= 0) {
        this.loseLife()
        return
      }
    }
    for (const r of this.rivals) {
      if (r.spawn > 0) continue
      const dx = wrapDx(p.x, r.x)
      const dy = r.y - p.y
      if (Math.abs(dx) > HALF_W * 2 - 2 || Math.abs(dy) > HALF_H * 2 - 2)
        continue
      if (Math.abs(dy) < LEVEL_BAND) {
        // Level joust: both bounce apart.
        const push = Math.sign(dx) || 1
        p.vx = -push * 2
        r.vx = push * 2
        r.dir = push
        this.sound.play('blip')
      } else if (dy > 0) {
        this.bonk(r)
      } else if (this.invuln <= 0) {
        this.loseLife()
        return
      }
    }
    for (let i = this.cocoons.length - 1; i >= 0; i--) {
      const c = this.cocoons[i]!
      if (Math.abs(wrapDx(p.x, c.x)) < 13 && Math.abs(c.y - p.y) < 14) {
        this.cocoons.splice(i, 1)
        this.collected++
        let points = Math.min(1000, 250 * this.collected)
        if (!c.ground) points += 500
        this.addScore(points, c.x, c.y - 12)
        this.sound.play('pickup')
      }
    }
  }

  private bonk(r: Rival) {
    this.rivals = this.rivals.filter((other) => other !== r)
    this.addScore(TIER_POINTS[r.tier]!, r.x, r.y - 14)
    this.burst(r.x, r.y, 14, TIER_WINGS[r.tier]!)
    this.sound.play('shoot')
    this.player.vy = Math.min(this.player.vy, -1.2)
    this.cocoons.push({
      x: r.x,
      y: r.y,
      vy: -1,
      ground: null,
      hatch: Math.round(levelCurve(this.level, JOUST_CURVES.hatchTicks)),
      tier: r.tier,
    })
  }

  private splash(x: number) {
    this.burst(x, POND_Y, 16, '#7dd3fc')
    this.loseLife(true)
  }

  private loseLife(splashed = false) {
    if (!this.alive) return
    this.alive = false
    this.lives--
    this.diedThisWave = true
    this.respawn = 90
    if (!splashed) this.burst(this.player.x, this.player.y, 24, '#5eead4')
    this.sound.play('die')
    if (this.lives <= 0) this.banner = { text: 'GAME OVER', ticks: 9999 }
  }

  private checkWave() {
    if (this.rivals.length || this.cocoons.length) return
    if (!this.diedThisWave && !this.cocoonWave) {
      this.addScore(SURVIVOR_BONUS, W / 2, 150)
      this.banner = { text: 'WAVE CLEAR!', sub: 'SURVIVOR BONUS', ticks: 90 }
    } else {
      this.banner = { text: 'WAVE CLEAR!', ticks: 90 }
    }
    this.sound.play('level')
    this.storm = null
    this.clearing = 90
  }

  private addScore(points: number, x?: number, y?: number) {
    if (this.demo) return
    this.score += points
    if (x !== undefined && y !== undefined) {
      this.floaters.push({ x, y, text: String(points), life: 50 })
    }
    if (this.score >= this.nextExtra) {
      this.lives++
      this.nextExtra += EXTRA_LIFE_EVERY
      this.sound.play('extra')
      this.banner = { text: 'EXTRA BUTTERFLY!', ticks: 90 }
    }
  }

  private burst(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.5 + this.rng() * 2
      this.sparks.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 25 + Math.floor(this.rng() * 20),
        color,
      })
    }
  }

  private updateEffects() {
    for (const s of this.sparks) {
      s.x += s.vx
      s.y += s.vy
      s.vy += 0.05
      s.life--
    }
    this.sparks = this.sparks.filter((s) => s.life > 0)
    for (const f of this.floaters) {
      f.y -= 0.35
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
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
    let goalX = W / 2
    let goalY = 140
    const s = this.storm
    const cocoon = this.cocoons
      .slice()
      .sort(
        (a, b) => Math.abs(wrapDx(p.x, a.x)) - Math.abs(wrapDx(p.x, b.x)),
      )[0]
    // Prefer riders level with or below us: the ones above are the danger.
    const cost = (r: Rival) =>
      Math.abs(wrapDx(p.x, r.x)) + Math.max(0, p.y - r.y) * 1.5
    const rival = this.rivals
      .filter((r) => r.spawn <= 0)
      .sort((a, b) => cost(a) - cost(b))[0]
    if (s && Math.abs(wrapDx(p.x, s.x)) < 90 && Math.abs(s.y - p.y) < 70) {
      // Get above the storm and drop on it.
      goalX = s.x
      goalY = s.y - 34
    } else if (cocoon && (!rival || cocoon.hatch < 200)) {
      goalX = cocoon.x
      goalY = cocoon.y - 4
    } else if (rival) {
      goalX = rival.x
      goalY = rival.y - 22
    }
    // Back away from any rider bearing down from above.
    const threat = this.rivals.find(
      (r) =>
        r.spawn <= 0 &&
        r.y < p.y - 3 &&
        p.y - r.y < 70 &&
        Math.abs(wrapDx(p.x, r.x)) < 50,
    )
    if (threat) goalX = wrapX(p.x - Math.sign(wrapDx(p.x, threat.x)) * 60)
    const dx = wrapDx(p.x, goalX)
    if (dx < -6) held.left = true
    else if (dx > 6) held.right = true
    const low = p.y > goalY + 4 || (p.y > POND_Y - 60 && !p.ground)
    if (low && !threat && p.vy > -1 && this.tick % 4 === 0) {
      frame.pressed.a = true
    }
    return frame
  }

  // --- render ------------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    this.renderSky(g)
    for (const l of this.ledges) this.renderLedge(g, l)
    this.renderPond(g)
    for (const c of this.cocoons)
      this.wrapDraw(c.x, (x) => this.renderCocoon(g, c, x))
    for (const r of this.rivals)
      this.wrapDraw(r.x, (x) => this.renderRival(g, r, x))
    if (
      this.alive &&
      !(this.invuln > 0 && Math.floor(this.invuln / 6) % 2 === 0)
    ) {
      const p = this.player
      this.wrapDraw(p.x, (x) =>
        this.renderRider(g, x, p.y, p.facing, p.flap, null, '#5eead4'),
      )
    }
    if (this.storm) this.wrapDraw(this.storm.x, (x) => this.renderStorm(g, x))
    for (const s of this.sparks) {
      g.globalAlpha = Math.max(0, s.life / 45)
      g.fillStyle = s.color
      g.fillRect(s.x - 1, s.y - 1, 2, 2)
    }
    g.globalAlpha = 1
    for (const f of this.floaters) {
      drawText(g, f.text, f.x, f.y, { align: 'center', color: '#fde68a' })
    }
    this.renderHud(g)
  }

  /** Draw something twice when it straddles the wrapping edge. */
  private wrapDraw(x: number, draw: (x: number) => void) {
    draw(x)
    if (x < 24) draw(x + W)
    if (x > W - 24) draw(x - W)
  }

  private renderSky(g: CanvasRenderingContext2D) {
    const sky = g.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, '#1e1b4b')
    sky.addColorStop(0.7, '#5b21b6')
    sky.addColorStop(1, '#db2777')
    g.fillStyle = sky
    g.fillRect(0, 0, W, H)
    g.fillStyle = '#fef9c3'
    for (let i = 0; i < 36; i++) {
      const x = (i * 89) % W
      const y = 30 + ((i * 47) % 220)
      if ((i + Math.floor(this.tick / 25)) % 6) g.fillRect(x, y, 1, 1)
    }
    // Soft cloud puffs drifting behind everything.
    g.fillStyle = 'rgba(244, 114, 182, 0.18)'
    for (let i = 0; i < 4; i++) {
      const x = wrapX(i * 130 + this.tick * 0.1)
      const y = 60 + i * 55
      g.beginPath()
      g.ellipse(x, y, 40, 10, 0, 0, Math.PI * 2)
      g.ellipse(x + 22, y - 6, 24, 9, 0, 0, Math.PI * 2)
      g.fill()
    }
  }

  private renderLedge(g: CanvasRenderingContext2D, l: Ledge) {
    const x0 = Math.max(-2, l.x0)
    const x1 = Math.min(W + 2, l.x1)
    g.fillStyle = '#6d28d9'
    g.fillRect(x0, l.y, x1 - x0, THICK)
    // A rainbow stripe along the top of every ledge.
    const bands = ['#f87171', '#facc15', '#4ade80', '#38bdf8']
    bands.forEach((color, i) => {
      g.fillStyle = color
      g.fillRect(x0, l.y + i * 1, x1 - x0, 1)
    })
    g.fillStyle = '#4c1d95'
    for (let x = x0 + 4; x < x1 - 4; x += 14) g.fillRect(x, l.y + THICK, 6, 3)
  }

  private renderPond(g: CanvasRenderingContext2D) {
    g.fillStyle = '#0c4a6e'
    g.fillRect(0, POND_Y, W, H - POND_Y)
    g.fillStyle = '#38bdf8'
    for (let x = 0; x < W; x += 16) {
      const y = POND_Y + 2 + Math.sin((x + this.tick) / 10) * 1.5
      g.fillRect(x + 2, y, 8, 1)
    }
  }

  private renderRider(
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    facing: number,
    flap: number,
    wings: string | null,
    rider: string,
  ) {
    const up = flap > 4 || Math.floor(this.tick / 8) % 2 === 0
    g.save()
    g.translate(x, y)
    g.scale(1.25, 1.25)
    // Wings: rainbow for you, a tier colour for the moth riders.
    const wingY = up ? -9 : 1
    const colors = wings
      ? [wings, wings, '#1e1b4b']
      : ['#f472b6', '#facc15', '#38bdf8']
    g.fillStyle = colors[0]!
    g.beginPath()
    g.ellipse(-6, wingY, 7, up ? 7 : 4, -0.4, 0, Math.PI * 2)
    g.ellipse(6, wingY, 7, up ? 7 : 4, 0.4, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = colors[1]!
    g.beginPath()
    g.ellipse(-5, wingY + 1, 4, up ? 4 : 2, -0.4, 0, Math.PI * 2)
    g.ellipse(5, wingY + 1, 4, up ? 4 : 2, 0.4, 0, Math.PI * 2)
    g.fill()
    if (!wings) {
      g.fillStyle = colors[2]!
      g.fillRect(-7, wingY - 1, 2, 2)
      g.fillRect(5, wingY - 1, 2, 2)
    }
    // Body of the mount.
    g.fillStyle = '#1e1b4b'
    g.fillRect(-7, 2, 14, 4)
    g.fillRect(facing > 0 ? 6 : -9, 0, 3, 3)
    // Rider with cat ears.
    g.fillStyle = rider
    g.fillRect(-3, -8, 7, 10)
    g.beginPath()
    g.moveTo(-3, -8)
    g.lineTo(-2, -12)
    g.lineTo(0, -8)
    g.moveTo(1, -8)
    g.lineTo(3, -12)
    g.lineTo(4, -8)
    g.fill()
    g.fillStyle = wings ? '#fecaca' : '#facc15'
    g.fillRect(facing > 0 ? 2 : -3, -5, 2, 2)
    // Lance.
    g.fillStyle = '#e2e8f0'
    g.fillRect(facing > 0 ? 3 : -11, -2, 9, 1)
    g.restore()
  }

  private renderRival(g: CanvasRenderingContext2D, r: Rival, x: number) {
    if (r.spawn > 0) {
      g.globalAlpha = 0.3 + 0.3 * Math.sin(this.tick / 3)
    }
    this.renderRider(
      g,
      x,
      r.y,
      Math.sign(r.vx) || r.dir,
      r.flap,
      TIER_WINGS[r.tier]!,
      ['#fda4af', '#c4b5fd', '#94a3b8'][r.tier]!,
    )
    g.globalAlpha = 1
  }

  private renderCocoon(g: CanvasRenderingContext2D, c: Cocoon, x: number) {
    const wiggle =
      c.hatch < 120 ? Math.sin(this.tick / (c.hatch < 60 ? 1.5 : 3)) * 0.3 : 0
    g.save()
    g.translate(x, c.y)
    g.rotate(wiggle)
    g.fillStyle =
      c.hatch < 60 && Math.floor(this.tick / 5) % 2 ? '#fde68a' : '#d9f99d'
    g.beginPath()
    g.ellipse(0, 0, 4, 6, 0, 0, Math.PI * 2)
    g.fill()
    g.strokeStyle = '#65a30d'
    g.lineWidth = 1
    g.beginPath()
    g.moveTo(-3, -2)
    g.lineTo(3, -1)
    g.moveTo(-3, 2)
    g.lineTo(3, 3)
    g.stroke()
    g.restore()
  }

  private renderStorm(g: CanvasRenderingContext2D, x: number) {
    const s = this.storm!
    g.fillStyle = '#334155'
    g.beginPath()
    g.ellipse(x - 10, s.y, 14, 10, 0, 0, Math.PI * 2)
    g.ellipse(x + 8, s.y - 4, 16, 12, 0, 0, Math.PI * 2)
    g.ellipse(x + 2, s.y + 4, 18, 8, 0, 0, Math.PI * 2)
    g.fill()
    // Angry eyes, and a crackle of lightning every so often.
    g.fillStyle = '#fde68a'
    g.fillRect(x - 6, s.y - 3, 3, 2)
    g.fillRect(x + 4, s.y - 3, 3, 2)
    if (Math.floor(s.t / 10) % 4 === 0) {
      g.strokeStyle = '#fde047'
      g.lineWidth = 2
      g.beginPath()
      g.moveTo(x, s.y + 10)
      g.lineTo(x - 4, s.y + 18)
      g.lineTo(x + 2, s.y + 18)
      g.lineTo(x - 3, s.y + 28)
      g.stroke()
    }
  }

  private renderHud(g: CanvasRenderingContext2D) {
    const shadow = '#1e1b4b'
    drawText(g, String(this.score).padStart(6, '0'), 8, 6, {
      scale: 2,
      color: '#f9a8d4',
      shadow,
    })
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W / 2, 6, {
      scale: 2,
      align: 'center',
      color: '#fde68a',
      shadow,
    })
    for (let i = 0; i < Math.min(this.lives, 5); i++) {
      drawText(g, '*', W - 14 - i * 14, 6, {
        scale: 2,
        color: '#5eead4',
        shadow,
      })
    }
    drawText(g, `WAVE ${this.level}`, 8, H - 10, { color: '#bae6fd' })
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, H / 2 - 60, {
        scale: 3,
        align: 'center',
        color: '#ffffff',
        shadow: '#9d174d',
      })
      if (this.banner.sub) {
        drawText(g, this.banner.sub, W / 2, H / 2 - 28, {
          scale: 2,
          align: 'center',
          color: '#fde68a',
          shadow,
        })
      }
    }
  }
}

const butterflyJoust: ArcadeGameModule = {
  create: (options) => new ButterflyJoust(options),
}

export const create = butterflyJoust.create
export default butterflyJoust
