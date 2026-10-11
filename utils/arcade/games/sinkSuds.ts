// /utils/arcade/games/sinkSuds.ts
//
// Sink Suds -- the Kind Robots Arcade's riff on the 1982 sink-bubble game
// (conductor kr-arcade/t-009; depth pass t-043.., spec: conductor
// projects/kr-arcade/depth-pass/CABINETS.md section 3). You are a soap bubble
// washing a robot house. Every basin has its own shape and water (utils/
// arcade/sinkSuds/basins.ts) and starts under a film of grime that comes clean
// wherever you roll. Crumbs, grease and grime feed you; your size is your
// health (a hit shrinks you), your weapon (big bubbles eat mites and tip
// brushes), your ammunition (B blows a soap shot that traps a pest, at the cost
// of a stage) and the drain key (full size opens it). A gives a puff of speed.

import { levelCurve } from '../curve'
import { drawText } from '../font'
import {
  INK,
  RAMPS,
  Sparkles,
  backdropRng,
  dropShadow,
  drawSprite,
  gauge,
  hudPanel,
  shadedOrb,
  vignette,
} from '../snes'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  ArcadeGuidePage,
  InputFrame,
} from '../types'
import {
  BASINS,
  BASIN_PLAYLIST,
  H,
  W,
  basinBounds,
  carry,
  clearPath,
  dialAt,
  flowAt,
  insideBasin,
  keepInside,
} from '../sinkSuds/basins'
import type { BasinDef, Point } from '../sinkSuds/basins'
import { Grime, SQUEAKY } from '../sinkSuds/grime'
import {
  BRUSH_TURN,
  GREMLIN_OUT,
  GURGLE_TICKS,
  PESTS,
  TIP_TICKS,
  TRAP_POINTS,
} from '../sinkSuds/pests'
import type { PestKind, Touch } from '../sinkSuds/pests'
import {
  BRUSH_SPRITE,
  BRUSH_TIPPED,
  CEREAL_SPRITE,
  CRUMB_SPRITE,
  DRIP_SPRITE,
  GREMLIN_SPRITES,
  GrimeLayer,
  MITE_SPRITES,
  SPONGE_SPRITES,
  renderBasin,
  renderBubble,
  renderDial,
  renderDizzy,
  renderDrain,
  renderFaucet,
  renderKitchen,
  renderShot,
  renderTrap,
} from '../sinkSuds/art'

export { BASINS, BASIN_PLAYLIST, PESTS, TRAP_POINTS }
export type { PestKind }

const ACCEL = 0.09
const MAX_SPEED = 2.3
const PUFF_SPEED = 4.2
const PUFF_COOLDOWN = 70
const START_LIVES = 3
const EXTRA_LIFE_EVERY = 15_000
export const MAX_STAGE = 5
export const STAGE_RADIUS = [0, 7, 9.5, 12, 14.5, 17] as const
export const GROWTH_PER_STAGE = 12
/** Grime cells the bubble scrubs for one point of growth. */
export const SCRUB_PER_GROWTH = 60
/** A soap shot needs this stage, and leaves the bubble one smaller (never below stage 2). */
export const SHOT_STAGE = 3
const SHOT_SPEED = 3.2
const SHOT_LIFE = 110
const SHOT_R = 5
/** Eat or trap within this many ticks of the last for the next chain step (x2, x3, x4). */
export const CHAIN_TICKS = 60
export const MAX_CHAIN = 4
/** Points for a Squeaky Clean basin, on top of 20 a percent. */
export const SQUEAKY_BONUS = 5_000
const HUNT_RANGE = 120
/** Growth for swallowing a pest. */
const EAT_GROWTH = 3
/** Fewer crumbs than this and the tap drips faster. */
const HUNGRY_MESS = 8

export const SUDS_CURVES = {
  messStart: { start: 24, step: 3, limit: 54 },
  mites: { start: 2, step: 0.6, limit: 10 },
  miteSpeed: { start: 0.55, step: 0.05, limit: 1.35 },
  brushes: { start: 0, step: 0.5, limit: 4 },
  brushSpeed: { start: 0.45, step: 0.04, limit: 1.05 },
  sponges: { start: 0, step: 0.35, limit: 3 },
  spongeSpeed: { start: 0.3, step: 0.02, limit: 0.6 },
  gremlins: { start: 0, step: 0.5, limit: 1 },
  gremlinRest: { start: 600, step: -25, limit: 240 },
  gremlinSpeed: { start: 1.3, step: 0.06, limit: 2.2 },
  dripEvery: { start: 150, step: -8, limit: 40 },
  /** Scrub passes a grime cell needs: one, then thicker grime from sink 11. */
  dirt: { start: 1, step: 0.1, limit: 3 },
} as const

type Mess = { x: number; y: number; kind: 'crumb' | 'grease'; r: number }
type PestState = 'roam' | 'tipped' | 'hidden' | 'gurgle' | 'out' | 'home'
export type Pest = {
  kind: PestKind
  x: number
  y: number
  vx: number
  vy: number
  heading: number
  /** Ticks to the next change of mind. */
  turn: number
  /** The state's timer (tipped, hidden, gurgling, out). */
  t: number
  state: PestState
  /** 0 while free; once trapped, the chain it was caught on. */
  trap: number
  target: Point | null
}
export type Bubble = {
  seat: number
  x: number
  y: number
  vx: number
  vy: number
  wobble: number
  stage: number
  growth: number
  /** Grime cells scrubbed toward the next point of growth. */
  scrub: number
  puff: number
  invuln: number
  hurt: number
  alive: boolean
  respawn: number
  /** The way it faces (and shoots). */
  faceX: number
  faceY: number
}
type Shot = { x: number; y: number; vx: number; vy: number; life: number }
type Drip = { x: number; y: number; vy: number; landY: number }
type Pop = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = {
  x: number
  y: number
  text: string
  life: number
  color?: string
}

function dist(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function angleTo(from: number, to: number, step: number) {
  let d = to - from
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return from + Math.max(-step, Math.min(step, d))
}

/** The basin the endless sink plays at this level. */
export function basinForLevel(level: number): BasinDef {
  return BASINS[BASIN_PLAYLIST[(level - 1) % BASIN_PLAYLIST.length]!]
}

/** Is (x, y) inside the first basin (kept for the older tests and tools)? */
export function insideSink(x: number, y: number, margin = 0): boolean {
  return insideBasin(BASINS.oval, x, y, margin)
}

function newBubble(seat: number, at: Point): Bubble {
  return {
    seat,
    x: at.x,
    y: at.y,
    vx: 0,
    vy: 0,
    wobble: 0,
    stage: 1,
    growth: 0,
    scrub: 0,
    puff: 0,
    invuln: 90,
    hurt: 0,
    alive: true,
    respawn: 0,
    faceX: 0,
    faceY: -1,
  }
}

class SinkSuds implements ArcadeGameInstance {
  score = 0
  level = 0
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private basin: BasinDef = BASINS.oval
  private grime: Grime = new Grime(BASINS.oval)
  /** The drum's speed now (eased toward its dial) and how far it has turned. */
  private spin = 0
  private drumAngle = 0
  private bubbles: Bubble[] = [newBubble(0, BASINS.oval.start)]
  private mess: Mess[] = []
  private pests: Pest[] = []
  private shots: Shot[] = []
  private drips: Drip[] = []
  private pops: Pop[] = []
  private floaters: Floater[] = []
  private dripTimer = 0
  private chain = 0
  private chainTimer = 0
  private draining = 0
  private overTimer = 0
  private nextExtra = EXTRA_LIFE_EVERY
  private shotHint = false
  private banner: { text: string; sub?: string; ticks: number } | null = null
  private pilotGoal: Point | null = null
  private pilotRetarget = 0
  // Cosmetic sparkles roll their own dice, so the game's seeded rng is untouched.
  private fx = new Sparkles()
  private fxRng = backdropRng(29)
  private grimeLayer = new GrimeLayer()

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.startLevel(1)
  }

  /** The first bubble (tests and the pilot read it). */
  private get bubble(): Bubble {
    return this.bubbles[0]!
  }

  private radiusOf(b: Bubble) {
    return STAGE_RADIUS[b.stage]!
  }

  // --- setup ------------------------------------------------------------------

  private spot(margin: number, awayFrom?: Point, minDistance = 0): Point {
    const { x0, y0, x1, y1 } = basinBounds(this.basin)
    for (let attempt = 0; attempt < 80; attempt++) {
      const p = {
        x: x0 + this.rng() * (x1 - x0),
        y: y0 + this.rng() * (y1 - y0),
      }
      if (!insideBasin(this.basin, p.x, p.y, margin)) continue
      if (dist(p, this.basin.drain) < 30) continue
      if (awayFrom && dist(p, awayFrom) < minDistance) continue
      return p
    }
    return { ...this.basin.start }
  }

  private addMess(at?: Point) {
    const p = at ?? this.spot(14)
    const grease = this.rng() < 0.3
    this.mess.push({
      x: p.x,
      y: p.y,
      kind: grease ? 'grease' : 'crumb',
      r: grease ? 5 : 3,
    })
  }

  private newPest(kind: PestKind, at: Point): Pest {
    return {
      kind,
      x: at.x,
      y: at.y,
      vx: 0,
      vy: 0,
      heading: this.rng() * Math.PI * 2,
      turn: 0,
      t: 0,
      state: 'roam',
      trap: 0,
      target: null,
    }
  }

  private count(spec: { start: number; step: number; limit: number }) {
    return Math.max(0, Math.floor(levelCurve(this.level, spec)))
  }

  private startLevel(level: number) {
    this.level = level
    this.basin = basinForLevel(level)
    this.grime = new Grime(this.basin, this.count(SUDS_CURVES.dirt))
    this.spin = 0
    this.mess = []
    this.pests = []
    this.shots = []
    this.drips = []
    this.draining = 0
    this.chain = 0
    this.chainTimer = 0
    this.pilotGoal = null
    for (const b of this.bubbles) {
      Object.assign(b, {
        x: this.basin.start.x,
        y: this.basin.start.y,
        vx: 0,
        vy: 0,
        stage: 1,
        growth: 0,
        scrub: 0,
        invuln: 90,
      })
    }
    const home = this.basin.start
    for (let i = 0; i < this.count(SUDS_CURVES.messStart); i++) this.addMess()
    for (let i = 0; i < this.count(SUDS_CURVES.mites); i++)
      this.pests.push(this.newPest('mite', this.spot(16, home, 90)))
    for (let i = 0; i < this.count(SUDS_CURVES.brushes); i++)
      this.pests.push(this.newPest('brush', this.spot(24, home, 140)))
    for (let i = 0; i < this.count(SUDS_CURVES.sponges); i++)
      this.pests.push(this.newPest('sponge', this.spot(24, home, 120)))
    for (let i = 0; i < this.count(SUDS_CURVES.gremlins); i++) {
      const g = this.newPest('gremlin', this.basin.drain)
      g.state = 'hidden'
      g.t = Math.round(levelCurve(level, SUDS_CURVES.gremlinRest))
      this.pests.push(g)
    }
    this.dripTimer = Math.round(levelCurve(level, SUDS_CURVES.dripEvery))
    this.banner = { text: `SINK ${level}`, sub: this.basin.name, ticks: 100 }
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.chainTimer > 0 && --this.chainTimer === 0) this.chain = 0
    if (this.over) return
    if (this.lives <= 0 && !this.bubbles.some((b) => b.alive)) {
      if (++this.overTimer > 100) this.over = true
      return
    }
    if (this.draining > 0) {
      this.updateDraining()
      return
    }
    for (const b of this.bubbles) {
      if (b.alive || this.lives <= 0) continue
      if (--b.respawn <= 0) this.revive(b)
    }
    if (!this.bubbles.some((b) => b.alive)) return

    const controls = this.demo ? this.demoInput() : input
    this.updateWater()
    for (const b of this.bubbles) if (b.alive) this.moveBubble(b, controls)
    this.carryMess()
    this.movePests()
    this.moveShots()
    this.moveDrips()
    for (const b of this.bubbles) if (b.alive) this.collide(b)
  }

  private updateDraining() {
    // Spiral down the drain, then rinse into the next sink.
    this.draining++
    const t = this.draining / 70
    const d = this.basin.drain
    for (const b of this.bubbles) {
      b.x = d.x + Math.cos(this.draining / 4) * 20 * (1 - t)
      b.y = d.y + Math.sin(this.draining / 4) * 20 * (1 - t)
    }
    if (this.draining > 70) {
      const left = this.mess.length
      const percent = this.grime.percent
      const bonus = Math.max(0, 1000 * this.level - left * 50) + percent * 20
      const squeaky = percent >= SQUEAKY
      this.addScore(bonus + (squeaky ? SQUEAKY_BONUS : 0), W / 2, H / 2 - 40)
      this.startLevel(this.level + 1)
      if (squeaky)
        this.banner = {
          text: 'SQUEAKY CLEAN!',
          sub: `SINK ${this.level}: ${this.basin.name}`,
          ticks: 120,
        }
    }
  }

  private updateWater() {
    const p = this.basin.physics
    if (p.kind !== 'spin') return
    const { now } = dialAt(p, this.tick)
    this.spin += (now - this.spin) * 0.02
    this.drumAngle += this.spin * 0.0035
  }

  private moveBubble(b: Bubble, input: InputFrame) {
    let ax = 0
    let ay = 0
    if (input.held.left) ax -= 1
    if (input.held.right) ax += 1
    if (input.held.up) ay -= 1
    if (input.held.down) ay += 1
    const len = Math.hypot(ax, ay)
    const grip = this.basin.grip
    if (len) {
      b.faceX = ax / len
      b.faceY = ay / len
      let push = ACCEL * grip
      const phys = this.basin.physics
      // In the tank, pushing down against the bubble's own lift is hard work.
      if (phys.kind === 'buoyancy' && ay > 0) push *= phys.downEffort
      b.vx += (ax / len) * ACCEL * grip
      b.vy += (ay / len) * push
    }
    const flow = flowAt(this.basin, b.x, b.y, this.spin, b.stage)
    b.vx += flow.x
    b.vy += flow.y
    if (b.puff > 0) b.puff--
    if (
      input.pressed.a &&
      b.puff === 0 &&
      (len || Math.hypot(b.vx, b.vy) > 0.2)
    ) {
      const sp = Math.hypot(b.vx, b.vy) || 1
      const dx = len ? ax / len : b.vx / sp
      const dy = len ? ay / len : b.vy / sp
      b.vx = dx * PUFF_SPEED
      b.vy = dy * PUFF_SPEED
      b.puff = PUFF_COOLDOWN
      this.sound.play('blip')
    }
    if (input.pressed.b) this.fireShot(b)
    const speed = Math.hypot(b.vx, b.vy)
    const cap = b.puff > PUFF_COOLDOWN - 15 ? PUFF_SPEED : MAX_SPEED
    if (speed > cap) {
      b.vx *= cap / speed
      b.vy *= cap / speed
    }
    b.vx *= this.basin.friction
    b.vy *= this.basin.friction
    b.x += b.vx
    b.y += b.vy
    keepInside(this.basin, b, this.radiusOf(b))
    b.wobble += 0.12 + speed * 0.05
    if (b.invuln > 0) b.invuln--
    if (b.hurt > 0) b.hurt--
    // Wherever the bubble rolls, the basin comes clean, and the grime feeds it.
    const cleaned = this.grime.scrub(b.x, b.y, this.radiusOf(b))
    if (cleaned) {
      this.addScore(cleaned)
      b.scrub += cleaned
      while (b.scrub >= SCRUB_PER_GROWTH) {
        b.scrub -= SCRUB_PER_GROWTH
        this.grow(b, 1)
      }
    }
  }

  /** B: blow a soap shot the way the bubble faces, paying a stage of growth for it. */
  private fireShot(b: Bubble) {
    if (b.stage < SHOT_STAGE) {
      this.sound.play('warn')
      return
    }
    b.stage--
    const r = this.radiusOf(b)
    this.shots.push({
      x: b.x + b.faceX * (r + SHOT_R),
      y: b.y + b.faceY * (r + SHOT_R),
      vx: b.faceX * SHOT_SPEED + b.vx * 0.3,
      vy: b.faceY * SHOT_SPEED + b.vy * 0.3,
      life: SHOT_LIFE,
    })
    this.sound.play('shoot')
  }

  private carryMess() {
    const kind = this.basin.physics.kind
    if (kind !== 'spin' && kind !== 'conveyor') return
    for (const m of this.mess) {
      const to = carry(this.basin, m, this.spin)
      m.x = to.x
      m.y = to.y
      if (!insideBasin(this.basin, m.x, m.y, 6)) keepInside(this.basin, m, 6, 0)
    }
  }

  private nearestMess(from: Point): Mess | null {
    let best: Mess | null = null
    let bestDistance = Infinity
    for (const m of this.mess) {
      const d = dist(m, from)
      if (d < bestDistance) {
        bestDistance = d
        best = m
      }
    }
    return best
  }

  /** The live bubble nearest to (x, y), if any. */
  private nearestBubble(from: Point): Bubble | null {
    let best: Bubble | null = null
    let bestD = Infinity
    for (const b of this.bubbles) {
      if (!b.alive) continue
      const d = dist(b, from)
      if (d < bestD) {
        bestD = d
        best = b
      }
    }
    return best
  }

  // --- pests -------------------------------------------------------------------

  private movePests() {
    for (const p of this.pests) {
      if (p.trap) {
        this.driftTrapped(p)
        continue
      }
      if (p.kind === 'mite') this.moveMite(p)
      else if (p.kind === 'brush') this.moveBrush(p)
      else if (p.kind === 'sponge') this.moveSponge(p)
      else this.moveGremlin(p)
      const rule = PESTS[p.kind]
      if (rule.cleans && p.state !== 'tipped')
        this.grime.scrub(p.x, p.y, rule.cleans)
      if (rule.eatsMess && p.state !== 'tipped') {
        const eaten = this.mess.findIndex((m) => dist(m, p) < rule.radius + 2)
        if (eaten >= 0) this.mess.splice(eaten, 1)
      }
    }
    this.pests = this.pests.filter(
      (p) => !(p.trap && dist(p, this.basin.drain) < 6),
    )
  }

  /** A trapped pest floats to the drain and goes down it for the chain it was caught on. */
  private driftTrapped(p: Pest) {
    const d = this.basin.drain
    const a = Math.atan2(d.y - p.y, d.x - p.x)
    const flow = flowAt(this.basin, p.x, p.y, this.spin)
    p.x += Math.cos(a) * 0.9 + flow.x * 8
    p.y += Math.sin(a) * 0.9 + flow.y * 8
    if (dist(p, d) < 6) {
      this.addScore(TRAP_POINTS * p.trap, d.x, d.y - 16)
      this.fx.burst(d.x, d.y, this.fxRng, { count: 12 })
      this.sound.play('pickup')
    }
  }

  private moveMite(m: Pest) {
    const speed = levelCurve(this.level, SUDS_CURVES.miteSpeed)
    if (--m.turn <= 0) {
      // Mites mostly wander, sometimes scuttle toward the nearest crumb.
      const target = this.rng() < 0.4 ? this.nearestMess(m) : null
      const a = target
        ? Math.atan2(target.y - m.y, target.x - m.x)
        : this.rng() * Math.PI * 2
      m.vx = Math.cos(a) * speed
      m.vy = Math.sin(a) * speed
      m.turn = 30 + Math.floor(this.rng() * 50)
    }
    m.x += m.vx
    m.y += m.vy
    if (keepInside(this.basin, m, 8, 2)) m.turn = 0
  }

  private moveBrush(br: Pest) {
    if (br.state === 'tipped') {
      if (--br.t <= 0) {
        br.state = 'roam'
        this.sound.play('warn')
      }
      return
    }
    const speed = levelCurve(this.level, SUDS_CURVES.brushSpeed)
    // Brushes turn toward a bubble that comes close, otherwise scrub toward the mess.
    const prey = this.nearestBubble(br)
    let target: Point | null = prey && dist(prey, br) < HUNT_RANGE ? prey : null
    if (!target) {
      if (--br.turn <= 0 || !br.target) {
        br.target =
          this.nearestMess(br) ?? this.grime.nearestDirty(br.x, br.y, 20)
        br.turn = 40
      }
      target = br.target
    }
    if (target) {
      const want = Math.atan2(target.y - br.y, target.x - br.x)
      br.heading = angleTo(br.heading, want, BRUSH_TURN)
    }
    br.vx = Math.cos(br.heading) * speed
    br.vy = Math.sin(br.heading) * speed
    br.x += br.vx
    br.y += br.vy
    if (keepInside(this.basin, br, 14, 2)) {
      br.heading = Math.atan2(br.vy, br.vx)
      br.target = null
    }
  }

  private moveSponge(s: Pest) {
    const speed = levelCurve(this.level, SUDS_CURVES.spongeSpeed)
    if (--s.turn <= 0 || !s.target) {
      s.target = this.nearestMess(s) ?? this.grime.nearestDirty(s.x, s.y, 25)
      s.turn = 60
    }
    if (s.target) {
      const a = Math.atan2(s.target.y - s.y, s.target.x - s.x)
      s.heading = angleTo(s.heading, a, 0.05)
    }
    s.vx = Math.cos(s.heading) * speed
    s.vy = Math.sin(s.heading) * speed
    s.x += s.vx
    s.y += s.vy
    if (keepInside(this.basin, s, 14, 2)) s.target = null
  }

  private moveGremlin(g: Pest) {
    const d = this.basin.drain
    if (g.state === 'hidden') {
      g.x = d.x
      g.y = d.y
      if (--g.t <= 0) {
        g.state = 'gurgle'
        g.t = GURGLE_TICKS
        this.sound.play('warn')
      }
      return
    }
    if (g.state === 'gurgle') {
      if (--g.t <= 0) {
        g.state = 'out'
        g.t = GREMLIN_OUT
        g.turn = 0
        this.sound.play('pop')
        // Out it pops: anything loitering over the drain gets bonked.
        for (const b of this.bubbles)
          if (b.alive && dist(b, d) < this.radiusOf(b) + 14)
            this.hurtBubble(b, 'hit', g)
      }
      return
    }
    const speed = levelCurve(this.level, SUDS_CURVES.gremlinSpeed)
    if (g.state === 'out') {
      if (--g.turn <= 0) {
        // It darts in straight lines, half the time at the nearest bubble.
        const prey = this.nearestBubble(g)
        g.heading =
          prey && this.rng() < 0.5
            ? Math.atan2(prey.y - g.y, prey.x - g.x)
            : this.rng() * Math.PI * 2
        g.turn = 40 + Math.floor(this.rng() * 40)
      }
      if (--g.t <= 0) g.state = 'home'
    } else {
      g.heading = Math.atan2(d.y - g.y, d.x - g.x)
      if (dist(g, d) < 4) {
        g.state = 'hidden'
        g.t = Math.round(levelCurve(this.level, SUDS_CURVES.gremlinRest))
        return
      }
    }
    g.vx = Math.cos(g.heading) * speed
    g.vy = Math.sin(g.heading) * speed
    g.x += g.vx
    g.y += g.vy
    if (keepInside(this.basin, g, 8, 2)) {
      g.heading = Math.atan2(g.vy, g.vx)
    }
  }

  /** Can this pest touch (or be touched) right now? */
  private solid(p: Pest) {
    return !p.trap && p.state !== 'hidden' && p.state !== 'gurgle'
  }

  // --- shots -------------------------------------------------------------------

  private moveShots() {
    for (const s of this.shots) {
      s.x += s.vx
      s.y += s.vy
      s.life--
      if (!insideBasin(this.basin, s.x, s.y, SHOT_R)) s.life = 0
      if (s.life <= 0) {
        this.fx.burst(s.x, s.y, this.fxRng, { count: 4, speed: 0.8 })
        continue
      }
      for (const p of this.pests) {
        if (!this.solid(p) || !PESTS[p.kind].trappable) continue
        if (dist(p, s) < PESTS[p.kind].radius + SHOT_R) {
          this.trapPest(p)
          s.life = 0
          break
        }
      }
    }
    this.shots = this.shots.filter((s) => s.life > 0)
  }

  private trapPest(p: Pest) {
    p.trap = this.chainUp()
    p.state = 'roam'
    this.sound.play('pickup')
    this.floaters.push({
      x: p.x,
      y: p.y - 14,
      text: p.trap > 1 ? `TRAPPED X${p.trap}` : 'TRAPPED!',
      life: 50,
      color: RAMPS.teal[3],
    })
  }

  /** Count an eat or a trap toward the chain; returns the multiplier it earns. */
  private chainUp(): number {
    this.chain = this.chainTimer > 0 ? Math.min(MAX_CHAIN, this.chain + 1) : 1
    this.chainTimer = CHAIN_TICKS
    return this.chain
  }

  private moveDrips() {
    // A basin picked bare by the cleaners drips three times as fast, so a hungry bubble can refill.
    this.dripTimer -= this.mess.length < HUNGRY_MESS ? 3 : 1
    if (this.dripTimer <= 0) {
      const land = this.spot(16)
      const f = this.basin.faucet
      this.drips.push({
        x: land.x,
        y: f ? Math.min(f.y, land.y - 40) : basinBounds(this.basin).y0 - 20,
        vy: 2.5,
        landY: land.y,
      })
      this.dripTimer = Math.round(levelCurve(this.level, SUDS_CURVES.dripEvery))
    }
    for (const d of this.drips) d.y += d.vy
    const landed = this.drips.filter((d) => d.y >= d.landY)
    for (const d of landed) {
      this.addMess({ x: d.x, y: d.landY })
      this.grime.soil(d.x, d.landY, 7)
    }
    this.drips = this.drips.filter((d) => d.y < d.landY)
  }

  // --- growth and contact --------------------------------------------------------

  private grow(b: Bubble, amount: number) {
    if (b.stage >= MAX_STAGE) return
    b.growth += amount
    while (b.growth >= GROWTH_PER_STAGE && b.stage < MAX_STAGE) {
      b.growth -= GROWTH_PER_STAGE
      b.stage++
      this.sound.play('pickup')
      if (b.stage === SHOT_STAGE && !this.shotHint) {
        this.shotHint = true
        this.banner = {
          text: 'BIG ENOUGH!',
          sub: 'B BLOWS A SOAP SHOT',
          ticks: 110,
        }
      }
      if (b.stage === MAX_STAGE) {
        b.growth = 0
        this.banner = {
          text: 'FULL OF SUDS!',
          sub: 'SAIL DOWN THE DRAIN',
          ticks: 120,
        }
        this.sound.play('level')
      }
    }
  }

  private collide(b: Bubble) {
    const r = this.radiusOf(b)
    for (let i = this.mess.length - 1; i >= 0; i--) {
      const m = this.mess[i]!
      if (dist(m, b) < r + m.r) {
        this.mess.splice(i, 1)
        this.fx.burst(m.x, m.y, this.fxRng, { count: 4, speed: 1 })
        const chain = this.chainUp()
        this.addScore((m.kind === 'grease' ? 25 : 10) * chain)
        this.grow(b, m.kind === 'grease' ? 2 : 1)
        if (this.tick % 2 === 0) this.sound.play('blip')
      }
    }
    if (b.stage >= MAX_STAGE && dist(b, this.basin.drain) < 17) {
      this.draining = 1
      this.sound.play('extra')
      return
    }
    for (let i = this.pests.length - 1; i >= 0; i--) {
      const p = this.pests[i]!
      if (!this.solid(p)) continue
      const rule = PESTS[p.kind]
      if (dist(p, b) >= r + rule.radius) continue
      if (p.kind === 'brush' && p.state === 'tipped') continue
      if (rule.edibleFrom && b.stage >= rule.edibleFrom) {
        this.pests.splice(i, 1)
        const chain = this.chainUp()
        this.addScore(rule.points * chain, p.x, p.y)
        this.burst(p.x, p.y, 8, RAMPS.rust[2])
        this.fx.burst(p.x, p.y, this.fxRng, { count: 10 })
        this.sound.play('pop')
        this.grow(b, EAT_GROWTH)
        // A swallowed mite drops a crumb somewhere else: the sink is never quite done.
        this.addMess()
        continue
      }
      if (p.kind === 'brush' && b.stage >= MAX_STAGE && this.behind(p, b)) {
        // Bumped from behind at full size: over it goes.
        p.state = 'tipped'
        p.t = TIP_TICKS
        this.addScore(rule.points * this.chainUp(), p.x, p.y)
        this.fx.burst(p.x, p.y, this.fxRng, { count: 12 })
        this.sound.play('boom')
        const a = Math.atan2(b.y - p.y, b.x - p.x)
        b.vx += Math.cos(a) * 1.5
        b.vy += Math.sin(a) * 1.5
        continue
      }
      if (b.invuln > 0) continue
      this.hurtBubble(b, rule.touch, p)
      if (!b.alive) return
    }
  }

  /** Is the bubble behind the brush (against the way it is heading)? */
  private behind(br: Pest, b: Bubble) {
    const dx = b.x - br.x
    const dy = b.y - br.y
    const d = Math.hypot(dx, dy) || 1
    return (Math.cos(br.heading) * dx + Math.sin(br.heading) * dy) / d < -0.15
  }

  /**
   * A pest touched the bubble. Growth is health: a soak takes a stage, a hit
   * on a big bubble splashes off two, and a hit on a small one pops it.
   */
  private hurtBubble(b: Bubble, touch: Touch, from: Point) {
    if (b.invuln > 0) return
    const a = Math.atan2(b.y - from.y, b.x - from.x)
    const knock = () => {
      b.vx = Math.cos(a) * 3
      b.vy = Math.sin(a) * 3
    }
    if (touch === 'soak') {
      if (b.stage > 1) b.stage--
      b.growth = 0
      b.invuln = 60
      b.hurt = 30
      knock()
      this.sound.play('warn')
      this.floaters.push({
        x: b.x,
        y: b.y - 20,
        text: 'SOAKED!',
        life: 45,
        color: RAMPS.gold[3],
      })
      return
    }
    if (touch === 'hit' && b.stage >= 3) {
      b.stage -= 2
      b.growth = 0
      b.invuln = 90
      b.hurt = 40
      knock()
      this.burst(b.x, b.y, 12, '#e0f2fe')
      this.sound.play('pop')
      this.floaters.push({
        x: b.x,
        y: b.y - 20,
        text: 'SPLASH!',
        life: 45,
        color: RAMPS.water[4],
      })
      return
    }
    this.popBubble(b)
  }

  private popBubble(b: Bubble) {
    b.alive = false
    this.lives--
    b.respawn = 100
    this.burst(b.x, b.y, 30, '#e0f2fe')
    this.sound.play('die')
    if (this.lives <= 0 && !this.bubbles.some((o) => o.alive))
      this.banner = { text: 'GAME OVER', ticks: 9999 }
  }

  private revive(b: Bubble) {
    Object.assign(b, {
      x: this.basin.start.x,
      y: this.basin.start.y,
      vx: 0,
      vy: 0,
      stage: Math.max(1, b.stage - 1),
      growth: 0,
      alive: true,
      invuln: 120,
      hurt: 0,
    })
  }

  private addScore(points: number, x?: number, y?: number) {
    if (this.demo || points <= 0) return
    this.score += points
    if (x !== undefined && y !== undefined) {
      this.floaters.push({ x, y, text: String(points), life: 50 })
    }
    if (this.score >= this.nextExtra) {
      this.lives++
      this.nextExtra += EXTRA_LIFE_EVERY
      this.sound.play('extra')
      this.banner = { text: 'EXTRA BUBBLE!', ticks: 90 }
    }
  }

  private burst(x: number, y: number, count: number, color: string) {
    // Cosmetic: the burst's dice are the sparkles' own, never the game's rng.
    const rand = this.fxRng
    for (let i = 0; i < count; i++) {
      const a = rand() * Math.PI * 2
      const s = 0.5 + rand() * 2
      this.pops.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 25 + Math.floor(rand() * 20),
        color,
      })
    }
  }

  private updateEffects() {
    this.fx.update()
    for (const p of this.pops) {
      p.x += p.vx
      p.y += p.vy
      p.vx *= 0.93
      p.vy *= 0.93
      p.life--
    }
    this.pops = this.pops.filter((p) => p.life > 0)
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
    const b = this.bubble
    if (!b.alive) return frame
    let goal: Point | null
    if (b.stage >= MAX_STAGE) goal = this.basin.drain
    else {
      const food = this.nearestMess(b)
      if (food && dist(food, b) < 140) goal = food
      else {
        if (
          --this.pilotRetarget <= 0 ||
          !this.pilotGoal ||
          !this.grime.isDirty(this.pilotGoal.x, this.pilotGoal.y)
        ) {
          this.pilotGoal = this.grime.nearestDirty(b.x, b.y) ?? food
          this.pilotRetarget = 20
        }
        goal = this.pilotGoal ?? food
      }
    }
    // Round the divider through the overflow gap when the goal is on the other side.
    if (
      goal &&
      this.basin.gaps &&
      !clearPath(this.basin, b, goal, this.radiusOf(b))
    ) {
      let best = Infinity
      for (const gap of this.basin.gaps) {
        const d = dist(gap, b)
        if (d < best) {
          best = d
          goal = d < 12 ? goal : gap
        }
      }
    }
    let steerX = goal ? goal.x - b.x : 0
    let steerY = goal ? goal.y - b.y : 0
    const scale = Math.hypot(steerX, steerY) || 1
    steerX /= scale
    steerY /= scale
    // Lean against the water's push, so the current and the drum don't carry it off.
    const flow = flowAt(this.basin, b.x, b.y, this.spin, b.stage)
    steerX -= flow.x * 12
    steerY -= flow.y * 12
    // Shy away from anything that could pop or soak the bubble.
    const threats: Point[] = []
    for (const p of this.pests) {
      if (!this.solid(p)) continue
      if (p.kind === 'mite' && b.stage >= 3) continue
      if (p.kind === 'brush' && p.state === 'tipped') continue
      threats.push(p)
    }
    const gurgling = this.pests.some(
      (p) =>
        p.kind === 'gremlin' &&
        (p.state === 'gurgle' || (p.state === 'hidden' && p.t < 40)),
    )
    if (gurgling) threats.push(this.basin.drain)
    let closest = Infinity
    let fleeX = 0
    let fleeY = 0
    for (const t of threats) {
      const d = dist(t, b) || 1
      if (d < 70) {
        steerX += (((b.x - t.x) / d) * (70 - d)) / 25
        steerY += (((b.y - t.y) / d) * (70 - d)) / 25
      }
      if (d < closest) {
        closest = d
        fleeX = (b.x - t.x) / d
        fleeY = (b.y - t.y) / d
      }
    }
    // Something about to touch: puff clear of it, along the wall if the wall is behind.
    if (closest < this.radiusOf(b) + 26 && b.puff === 0) {
      const ahead = { x: b.x + fleeX * 30, y: b.y + fleeY * 30 }
      if (!insideBasin(this.basin, ahead.x, ahead.y, this.radiusOf(b))) {
        const side = fleeX * steerY - fleeY * steerX >= 0 ? 1 : -1
        const fx = -fleeY * side
        fleeY = fleeX * side
        fleeX = fx
      }
      steerX = fleeX * 2
      steerY = fleeY * 2
      held.a = true
      frame.pressed.a = true
    }
    // Trap a brush, sponge or gremlin lined up ahead, while there is size to spare.
    if (b.stage >= 4) {
      for (const p of this.pests) {
        if (!this.solid(p) || p.kind === 'mite') continue
        if (p.kind === 'brush' && p.state === 'tipped') continue
        const d = dist(p, b)
        if (d > 110 || d < 1) continue
        if (((p.x - b.x) * b.faceX + (p.y - b.y) * b.faceY) / d > 0.9) {
          held.b = true
          frame.pressed.b = this.tick % 20 === 0
          break
        }
      }
    }
    const lead = 0.3
    if (steerX < -lead) held.left = true
    if (steerX > lead) held.right = true
    if (steerY < -lead) held.up = true
    if (steerY > lead) held.down = true
    return frame
  }

  // --- render ------------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    renderKitchen(g, this.basin)
    renderBasin(g, this.basin, this.tick, this.drumAngle)
    this.grimeLayer.draw(g, this.grime, this.basin)
    renderFaucet(g, this.basin)
    renderDial(g, this.basin, this.tick)
    const gurgle = this.pests.some(
      (p) => p.kind === 'gremlin' && p.state === 'gurgle',
    )
    renderDrain(
      g,
      this.basin,
      this.tick,
      this.bubbles.some((b) => b.stage >= MAX_STAGE),
      gurgle ? 1 : 0,
    )
    for (const m of this.mess) this.renderMess(g, m)
    for (const d of this.drips) drawSprite(g, DRIP_SPRITE, d.x, d.y)
    for (const p of this.pests) if (!p.trap) this.renderPest(g, p)
    for (const p of this.pests) {
      if (!p.trap) continue
      this.renderPest(g, p)
      renderTrap(g, p.x, p.y, PESTS[p.kind].radius + 6, this.tick)
    }
    for (const s of this.shots) renderShot(g, s.x, s.y, SHOT_R, this.tick)
    for (const p of this.pops) {
      g.globalAlpha = Math.max(0, p.life / 45)
      g.fillStyle = INK
      g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 3, 3)
      g.fillStyle = p.color
      g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 2, 2)
    }
    g.globalAlpha = 1
    for (const b of this.bubbles) {
      if (!b.alive) continue
      if (b.invuln > 0 && Math.floor(b.invuln / 6) % 2 === 0) continue
      const base = this.radiusOf(b)
      const r =
        this.draining > 0 ? base * Math.max(0.1, 1 - this.draining / 70) : base
      dropShadow(g, b.x + r * 0.35, b.y + r * 0.95, r * 0.8, r * 0.28, 0.3)
      const sp = Math.hypot(b.vx, b.vy)
      renderBubble(g, {
        x: b.x,
        y: b.y,
        r,
        wobble: b.wobble,
        stage: b.stage,
        hurt: b.hurt,
        lookX: sp > 0.3 ? b.vx / sp : b.faceX,
        lookY: sp > 0.3 ? b.vy / sp : b.faceY,
        tick: this.tick,
      })
    }
    this.fx.render(g)
    for (const f of this.floaters) {
      drawText(g, f.text, f.x, f.y, {
        align: 'center',
        color: f.color ?? RAMPS.gold[3],
        outline: INK,
      })
    }
    vignette(g, W, H, 0.3)
    this.renderHud(g)
  }

  private renderMess(g: CanvasRenderingContext2D, m: Mess) {
    if (m.kind === 'grease') {
      const tilt = (m.x + m.y) % 3
      g.fillStyle = 'rgba(122, 44, 16, 0.55)'
      g.beginPath()
      g.ellipse(m.x, m.y, 7, 5, tilt, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = 'rgba(194, 84, 27, 0.6)'
      g.beginPath()
      g.ellipse(m.x - 1, m.y - 1, 5, 3, tilt, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = 'rgba(255, 224, 194, 0.8)'
      g.fillRect(Math.round(m.x) - 3, Math.round(m.y) - 2, 2, 1)
    } else {
      const sprite =
        (Math.round(m.x) + Math.round(m.y)) % 2 ? CRUMB_SPRITE : CEREAL_SPRITE
      drawSprite(g, sprite, m.x, m.y)
    }
  }

  private renderPest(g: CanvasRenderingContext2D, p: Pest) {
    const frame = Math.floor(this.tick / 6) % 2
    switch (p.kind) {
      case 'mite':
        dropShadow(g, p.x, p.y + 5, 5, 1.5, 0.3)
        drawSprite(g, MITE_SPRITES[frame]!, p.x, p.y, { flipX: p.vx < 0 })
        return
      case 'brush': {
        dropShadow(g, p.x, p.y + 9, 11, 2.5, 0.35)
        if (p.state === 'tipped') {
          drawSprite(g, BRUSH_TIPPED, p.x, p.y + 2)
          renderDizzy(g, p.x, p.y - 8, this.tick)
          return
        }
        const bob = Math.round(Math.sin(this.tick / 6) * 1.5)
        drawSprite(g, BRUSH_SPRITE, p.x, p.y + bob, {
          flipX: Math.cos(p.heading) < 0,
        })
        g.fillStyle = RAMPS.water[4]
        const f = Math.floor(this.tick / 4) % 3
        g.fillRect(Math.round(p.x) - 9 + f * 6, Math.round(p.y) + 8, 2, 1)
        g.fillRect(Math.round(p.x) + 5 - f * 4, Math.round(p.y) + 9, 1, 1)
        return
      }
      case 'sponge':
        dropShadow(g, p.x, p.y + 7, 10, 2, 0.35)
        drawSprite(
          g,
          SPONGE_SPRITES[Math.floor(this.tick / 20) % 2]!,
          p.x,
          p.y,
          {
            flipX: p.vx < 0,
          },
        )
        return
      default: {
        if (p.state === 'hidden') return
        if (p.state === 'gurgle') {
          // Eyes peering up through the grate.
          if (p.t < GURGLE_TICKS / 2) {
            g.fillStyle = RAMPS.gold[3]
            g.fillRect(Math.round(p.x) - 4, Math.round(p.y) - 1, 2, 2)
            g.fillRect(Math.round(p.x) + 2, Math.round(p.y) - 1, 2, 2)
          }
          return
        }
        dropShadow(g, p.x, p.y + 7, 6, 2, 0.3)
        drawSprite(g, GREMLIN_SPRITES[frame]!, p.x, p.y, { flipX: p.vx < 0 })
      }
    }
  }

  private renderHud(g: CanvasRenderingContext2D) {
    hudPanel(g, 4, 3, 86, 31)
    drawText(g, String(this.score).padStart(6, '0'), 10, 6, {
      scale: 2,
      color: RAMPS.teal[4],
      shadow: INK,
    })
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, 10, 24, {
      color: RAMPS.gold[3],
      outline: INK,
    })
    const lives = Math.min(this.lives, 5)
    if (lives > 0) {
      hudPanel(g, W - 8 - lives * 14, 3, lives * 14 + 4, 20)
      for (let i = 0; i < lives; i++) {
        shadedOrb(g, W - 13 - i * 14, 13, 4.5, RAMPS.water)
      }
    }
    if (this.chain >= 2) {
      hudPanel(g, W - 56, 26, 52, 15, RAMPS.pink)
      drawText(g, `CHAIN X${this.chain}`, W - 30, 30, {
        align: 'center',
        color: RAMPS.gold[4],
        outline: INK,
      })
    }
    hudPanel(g, 4, H - 19, 58, 15)
    drawText(g, `SINK ${this.level}`, 10, H - 15, {
      color: RAMPS.purple[4],
      outline: INK,
    })
    // How clean the basin is: the Squeaky Clean bonus waits at 95%.
    const percent = this.grime.percent
    hudPanel(
      g,
      68,
      H - 19,
      114,
      15,
      percent >= SQUEAKY ? RAMPS.gold : RAMPS.purple,
    )
    drawText(g, 'CLEAN', 74, H - 15, { color: RAMPS.teal[4], outline: INK })
    gauge(
      g,
      108,
      H - 14,
      40,
      5,
      percent / 100,
      percent >= SQUEAKY ? RAMPS.gold : RAMPS.leaf,
    )
    drawText(g, `${percent}%`, 176, H - 15, {
      align: 'right',
      color: RAMPS.cream[3],
      outline: INK,
    })
    // Suds meter: the bubble's size, in five stages; the notches are what a soap shot costs.
    const b = this.bubble
    const filled =
      b.stage >= MAX_STAGE
        ? 1
        : (b.stage - 1 + b.growth / GROWTH_PER_STAGE) / (MAX_STAGE - 1)
    hudPanel(g, W - 152, H - 19, 148, 15)
    drawText(g, 'SUDS', W - 146, H - 15, {
      color: RAMPS.teal[4],
      outline: INK,
    })
    gauge(
      g,
      W - 112,
      H - 15,
      102,
      7,
      filled,
      filled >= 1
        ? RAMPS.gold
        : b.stage >= SHOT_STAGE
          ? RAMPS.teal
          : RAMPS.water,
    )
    g.fillStyle = INK
    for (let i = 1; i < MAX_STAGE - 1; i++)
      g.fillRect(
        W - 112 + Math.round((102 * i) / (MAX_STAGE - 1)),
        H - 15,
        1,
        7,
      )
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, H / 2 - 50, {
        scale: 3,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.teal[1],
      })
      if (this.banner.sub) {
        drawText(g, this.banner.sub, W / 2, H / 2 - 18, {
          scale: 2,
          align: 'center',
          color: RAMPS.gold[3],
          outline: INK,
        })
      }
    }
  }
}

function sinkGuide(): ArcadeGuidePage[] {
  return [
    {
      title: 'SIZE IS EVERYTHING',
      scale: 1,
      lines: [
        'CRUMBS, GREASE AND GRIME FEED THE BUBBLE: FIVE SIZES.',
        'A HIT SHRINKS A BIG BUBBLE TWO SIZES; IT POPS A SMALL ONE.',
        'FROM SIZE 3, B BLOWS A SOAP SHOT FOR ONE SIZE.',
        'A SHOT TRAPS A PEST: IT FLOATS TO THE DRAIN FOR 300 X CHAIN.',
        'EAT OR TRAP WITHIN A SECOND FOR X2, X3, X4.',
        'FULL SIZE LIGHTS THE DRAIN: SAIL DOWN IT.',
        'SCRUB THE BASIN 95% CLEAN FOR SQUEAKY CLEAN.',
      ],
    },
    {
      title: 'THE PESTS',
      scale: 1,
      lines: (Object.keys(PESTS) as PestKind[]).flatMap((k) => [
        `${PESTS[k].name}: ${PESTS[k].tell}`,
        `  ${PESTS[k].answer}`,
      ]),
    },
  ]
}

const sinkSuds: ArcadeGameModule = {
  create: (options) => new SinkSuds(options),
  guide: () => sinkGuide(),
}

export const create = sinkSuds.create
export default sinkSuds
