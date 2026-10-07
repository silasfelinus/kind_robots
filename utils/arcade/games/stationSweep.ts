// /utils/arcade/games/stationSweep.ts
//
// Station Sweep -- the Kind Robots Arcade's Xenophobe riff (conductor
// kr-arcade/t-009 game factory: decks, lifts, critter growth, the station
// timer, and split-screen co-op). Mop, the station's cleaning robot, sweeps a
// station overrun by glitch critters, deck by deck. Egg sacs on the floor
// hatch rollers and biters, sacs on the ceiling drop crawlers, and a deck is
// clean once every sac is popped (or spent) and every critter swept up. Two
// lifts on every deck ride up and down (Up or Down while standing in one);
// clean every deck and the station is done.
//
// As in the classic, critters left alone grow (they glow just before): a big
// crawler takes three sweeps and nibbles harder, a big roller hits harder and
// takes two, and a big biter spits faster. And
// the station is on a clock: run it out and the station is lost, costing a
// spare Mop; time left over pays a bonus.
//
// As in the classic, height matters: rollers bowl along the floor under a
// standing shot, so crouch (Down) to sweep low. Crawlers drop and cling,
// draining charge until Mop jumps (Up or B) to shake them. Left/right walk,
// A fires the sweeper beam.
//
// Up to three can play on one device, as in the classic's split screen: one
// strip per Mop, player 1's (blue) on top, then player 2's (pink) and player
// 3's (green), each free to ride to a deck of their own. Every deck with a Mop on it is live. The score, the clock
// and the spare Mops are shared; a Mop that goes down reboots on a spare, and
// with no spares left it sits out until one is earned (back at the next
// station). The run ends when no Mop is left sweeping.

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
const CEILING = 70
const FLOOR = 206
const DECK_W = 1600
const WALK = 1.4
const GRAVITY = 0.25
const JUMP_VY = -4.2
const SHOT_SPEED = 5
const SHOT_LIFE = 34
const FIRE_COOLDOWN = 9
const MAX_HEALTH = 100
const CLEAR_TICKS = 150
const DEATH_TICKS = 110
const START_LIVES = 3
const EXTRA_EVERY = 25_000
/** Lift doors on every deck, at the same spots. */
const LIFTS = [180, DECK_W - 180]
const RIDE_TICKS = 50
/** Station clock: a base allowance plus time per deck. */
const STATION_BASE_SECS = 45
const SECS_PER_DECK = 24
const GLOW_TICKS = 150
const DECK_PANELS = ['#1f2937', '#241a44', '#13293d', '#2a2014']

/** Mops that can share a station, as in the classic. */
const MAX_PLAYERS = 3
/** Split screen: a short shared HUD, then one strip per Mop. */
const SPLIT_HUD = 22
/** Each strip shows the deck from the ceiling plating to just under the floor. */
const VIEW_TOP = CEILING - 14
const VIEW_SPAN = FLOOR + 10 - VIEW_TOP
/** Each Mop's colours: body, dome. */
const MOP_COLORS: Array<[string, string]> = [
  ['#0ea5e9', '#7dd3fc'],
  ['#ec4899', '#f9a8d4'],
  ['#16a34a', '#86efac'],
]
const SEAT_COLORS = ['#67e8f9', '#f9a8d4', '#bef264']

export const SWEEP_CURVES = {
  decks: { start: 2, step: 0.5, limit: 4 },
  floorSacs: { start: 3, step: 1, limit: 9 },
  ceilingSacs: { start: 1, step: 0.6, limit: 5 },
  hatchEvery: { start: 420, step: -35, limit: 110 },
  critterSpeed: { start: 1, step: 0.12, limit: 2.1 },
  biterChance: { start: 0.25, step: 0.08, limit: 0.6 },
  /** Ticks a crawler or roller lives before it grows into the next form. */
  growAfter: { start: 60 * 26, step: -60 * 2, limit: 60 * 10 },
} as const

type Kind = 'roller' | 'crawler' | 'biter'
/** One player's cleaning robot. */
type Mop = {
  seat: number
  x: number
  y: number
  vy: number
  onGround: boolean
  crouch: boolean
  facing: 1 | -1
  health: number
  fireCooldown: number
  hurt: number
  walkPhase: number
  camX: number
  /** Index into decks; deck 0 is the top of the station. */
  deck: number
  ride: { to: number; t: number } | null
  /** Ticks until a downed Mop reboots (0 while it's up). */
  dead: number
  /** No spare left to reboot on: sitting out until one comes free. */
  out: boolean
}
type Critter = {
  kind: Kind
  x: number
  y: number
  vx: number
  vy: number
  hp: number
  t: number
  /** Crawlers ride the ceiling until a Mop walks under, then drop and cling. */
  onCeiling: boolean
  /** The Mop a crawler is clinging to, if any. */
  clinging: Mop | null
  /** Only a crawler dropping from the ceiling can latch on; shaken off, it stays down. */
  canCling: boolean
  /** Grown: tougher and harder-hitting (and a big biter spits faster). */
  big: boolean
}
type Sac = {
  x: number
  ceiling: boolean
  hp: number
  timer: number
  hatches: number
  pulse: number
}
type Shot = { x: number; y: number; vx: number; life: number }
type Spit = { x: number; y: number; vx: number; life: number }
type Kit = { x: number; life: number }
type Deck = {
  sacs: Sac[]
  critters: Critter[]
  kits: Kit[]
  shots: Shot[]
  spits: Spit[]
  clean: boolean
}
type Particle = {
  deck: number
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = {
  deck: number
  x: number
  y: number
  text: string
  life: number
}

const POINTS: Record<Kind, number> = { roller: 100, crawler: 150, biter: 300 }

function idleFrame(): InputFrame {
  const held = {
    up: false,
    down: false,
    left: false,
    right: false,
    a: false,
    b: false,
    start: false,
  }
  return { held, pressed: { ...held } }
}

function newMop(seat: number): Mop {
  return {
    seat,
    x: 60 + seat * 40,
    y: FLOOR,
    vy: 0,
    onGround: true,
    crouch: false,
    facing: 1,
    health: MAX_HEALTH,
    fireCooldown: 0,
    hurt: 0,
    walkPhase: 0,
    camX: 0,
    deck: 0,
    ride: null,
    dead: 0,
    out: false,
  }
}

class StationSweep implements ArcadeGameInstance {
  score = 0
  level = 1
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private mops: Mop[]
  /** Spare Mops, shared by the team. */
  private spares = START_LIVES - 1
  private decks: Deck[] = []
  /** The deck being simulated or drawn right now (see the deck getters below). */
  private cur!: Deck
  private curIndex = 0
  /** Ticks left on the station clock. */
  private timer = 0
  private clear = 0
  private nextExtra = EXTRA_EVERY
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    const seats = this.demo
      ? 1
      : Math.max(1, Math.min(MAX_PLAYERS, Math.round(options.players ?? 1)))
    this.mops = Array.from({ length: seats }, (_, seat) => newMop(seat))
    this.startStation(1)
  }

  /** Mops still in play plus the spares behind them. */
  get lives(): number {
    return this.spares + this.mops.filter((m) => !m.out).length
  }

  private get duo(): boolean {
    return this.mops.length > 1
  }

  /** Split screen geometry: each strip's height, scale and world width. */
  private get stripH(): number {
    return (H - SPLIT_HUD) / this.mops.length
  }
  private get stripScale(): number {
    return this.stripH / VIEW_SPAN
  }
  private get viewW(): number {
    return this.duo ? W / this.stripScale : W
  }

  // The current deck's things, read and written through to the deck itself.
  private get sacs(): Sac[] {
    return this.cur.sacs
  }
  private set sacs(v: Sac[]) {
    this.cur.sacs = v
  }
  private get critters(): Critter[] {
    return this.cur.critters
  }
  private set critters(v: Critter[]) {
    this.cur.critters = v
  }
  private get kits(): Kit[] {
    return this.cur.kits
  }
  private set kits(v: Kit[]) {
    this.cur.kits = v
  }
  private get shots(): Shot[] {
    return this.cur.shots
  }
  private set shots(v: Shot[]) {
    this.cur.shots = v
  }
  private get spits(): Spit[] {
    return this.cur.spits
  }
  private set spits(v: Spit[]) {
    this.cur.spits = v
  }

  private use(index: number) {
    this.curIndex = index
    this.cur = this.decks[index]!
  }

  /** Mops up and sweeping on the current deck (not riding, rebooting or out). */
  private here(): Mop[] {
    return this.mops.filter(
      (m) => m.deck === this.curIndex && !m.out && m.dead === 0 && !m.ride,
    )
  }

  /** The nearest sweeping Mop on the current deck. */
  private nearest(x: number): Mop | undefined {
    let best: Mop | undefined
    for (const m of this.here())
      if (!best || Math.abs(m.x - x) < Math.abs(best.x - x)) best = m
    return best
  }

  // --- deck ----------------------------------------------------------------------

  private startStation(station: number) {
    this.level = station
    const count = Math.round(levelCurve(station, SWEEP_CURVES.decks))
    this.decks = []
    for (let d = 0; d < count; d++)
      this.decks.push({
        sacs: this.placeSacs(station),
        critters: [],
        kits: [],
        shots: [],
        spits: [],
        clean: false,
      })
    this.use(0)
    for (const m of this.mops) {
      // A Mop rebooting or sitting out comes back on a spare, if there is one.
      if (m.dead > 0 || m.out) {
        if (this.spares > 0) {
          this.spares--
          m.out = false
          m.health = MAX_HEALTH
        } else {
          m.out = true
        }
        m.dead = 0
      }
      m.deck = 0
      m.ride = null
      m.x = 60 + m.seat * 40
      m.y = FLOOR
      m.vy = 0
      m.onGround = true
      m.camX = 0
      // A short top-up between stations, not a full repair.
      m.health = Math.min(MAX_HEALTH, m.health + 25)
    }
    this.timer = 60 * (STATION_BASE_SECS + SECS_PER_DECK * count)
    this.banner = {
      text: `STATION ${station}`,
      sub: `${count} DECKS TO SWEEP`,
      ticks: 110,
    }
  }

  private placeSacs(station: number): Sac[] {
    const sacs: Sac[] = []
    const place = (count: number, ceiling: boolean) => {
      for (let i = 0; i < count; i++) {
        let x = 220 + ((DECK_W - 300) * (i + 0.3 + this.rng() * 0.4)) / count
        // Keep the lift doors clear.
        for (const lift of LIFTS) if (Math.abs(x - lift) < 24) x = lift + 30
        sacs.push({
          x,
          ceiling,
          hp: ceiling ? 999 : 3,
          timer: 120 + Math.floor(this.rng() * 240),
          hatches: ceiling ? 2 : 4,
          pulse: 0,
        })
      }
    }
    place(Math.round(levelCurve(station, SWEEP_CURVES.floorSacs)), false)
    place(Math.round(levelCurve(station, SWEEP_CURVES.ceilingSacs)), true)
    return sacs
  }

  /** Critters toughen per station, about as fast as they did per deck before lifts. */
  private get heat(): number {
    return 1 + (this.level - 1) * 3
  }

  private atLift(m: Mop): number | undefined {
    return LIFTS.find((l) => Math.abs(m.x - l) < 10)
  }

  private updateRide(m: Mop) {
    const ride = m.ride!
    ride.t--
    if (ride.t === Math.floor(RIDE_TICKS / 2)) {
      // Anything clinging to this Mop rides along.
      const from = this.decks[m.deck]!
      const riders = from.critters.filter((c) => c.clinging === m)
      from.critters = from.critters.filter((c) => c.clinging !== m)
      m.deck = ride.to
      this.decks[ride.to]!.critters.push(...riders)
    }
    if (ride.t > 0) return
    m.ride = null
    const d = this.decks[m.deck]!
    this.banner = {
      text: this.duo
        ? `${m.seat + 1}P DECK ${m.deck + 1}`
        : `DECK ${m.deck + 1}`,
      sub: d.clean ? 'ALREADY CLEAN' : 'SWEEP IT CLEAN',
      ticks: 70,
    }
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame, players?: InputFrame[]) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    if (this.demo) this.use(this.mops[0]!.deck)
    const frames = this.demo ? [this.demoInput()] : (players ?? [input])

    if (this.clear > 0) {
      if (--this.clear === 0) this.startStation(this.level + 1)
      return
    }
    // The clock runs while any Mop is out sweeping (not riding or rebooting).
    const sweeping = this.mops.some((m) => !m.out && m.dead === 0 && !m.ride)
    if (sweeping && --this.timer <= 0) {
      this.stationLost()
      return
    }

    for (const m of this.mops) this.updateMop(m, frames[m.seat] ?? idleFrame())
    for (let d = 0; d < this.decks.length; d++) {
      this.use(d)
      if (!this.here().length) continue
      this.updateShots()
      this.updateSacs()
      this.updateCritters()
      this.grow()
      this.updateSpits()
      this.updateKits()
      for (const m of this.here()) if (m.health <= 0) this.down(m)
      this.checkClean()
      if (this.clear > 0) break
    }
    const viewW = this.viewW
    for (const m of this.mops)
      m.camX = Math.max(0, Math.min(DECK_W - viewW, m.x - viewW / 2))
    if (this.mops.every((m) => m.out)) {
      this.over = true
      this.banner = { text: 'GAME OVER', ticks: 9999 }
    }
  }

  private updateMop(m: Mop, controls: InputFrame) {
    if (m.out) return
    if (m.ride) {
      this.updateRide(m)
      return
    }
    if (m.dead > 0) {
      if (--m.dead === 0) this.reboot(m)
      return
    }
    if (m.hurt > 0) m.hurt--
    if (m.fireCooldown > 0) m.fireCooldown--
    this.use(m.deck)
    this.move(m, controls)
    if (m.ride) return
    if (controls.pressed.a || (controls.held.a && m.fireCooldown === 0))
      this.fire(m)
  }

  /** Back up after a fall, on a spare if there is one; otherwise sit out. */
  private reboot(m: Mop) {
    if (this.spares <= 0) {
      m.out = true
      if (this.mops.some((o) => !o.out))
        this.banner = {
          text: `${m.seat + 1}P IS OUT`,
          sub: 'SWEEP ON',
          ticks: 90,
        }
      return
    }
    this.spares--
    m.health = MAX_HEALTH
    const d = this.decks[m.deck]!
    d.critters = d.critters.filter((c) => Math.abs(c.x - m.x) > 120)
    d.spits = []
  }

  private move(m: Mop, input: InputFrame) {
    m.crouch = m.onGround && input.held.down
    let vx = 0
    if (!m.crouch) {
      if (input.held.left) vx = -WALK
      if (input.held.right) vx = WALK
    }
    if (input.held.left) m.facing = -1
    if (input.held.right) m.facing = 1
    if (vx !== 0) m.walkPhase += 0.2
    m.x = Math.max(12, Math.min(DECK_W - 12, m.x + vx))
    // Standing in a lift, Up or a fresh press of Down rides a deck that way.
    const lift = m.onGround ? this.atLift(m) : undefined
    const to = input.pressed.up
      ? m.deck - 1
      : input.pressed.down
        ? m.deck + 1
        : -1
    if (lift !== undefined && to >= 0 && to < this.decks.length) {
      m.x = lift
      m.crouch = false
      m.ride = { to, t: RIDE_TICKS }
      // Leaving the deck to itself: its shots and spit settle.
      if (!this.here().length) {
        this.shots = []
        this.spits = []
      }
      this.sound.play('pickup')
      return
    }
    if (m.onGround && (input.pressed.up || input.pressed.b)) {
      m.vy = JUMP_VY
      m.onGround = false
      // A jump shakes off any crawler clinging to this Mop.
      for (const c of this.critters) {
        if (c.clinging === m) {
          c.clinging = null
          c.canCling = false
          c.vy = -2
          c.vx = -m.facing * 2
        }
      }
      this.sound.play('blip')
    }
    m.vy += GRAVITY
    m.y += m.vy
    if (m.y >= FLOOR) {
      m.y = FLOOR
      m.vy = 0
      m.onGround = true
    }
  }

  private fire(m: Mop) {
    m.fireCooldown = FIRE_COOLDOWN
    const y = m.crouch ? m.y - 5 : m.y - 15
    this.sound.play('shoot')
    // Point-blank: anything right at the nozzle is swept at once.
    const close = this.critters.find((c) => {
      if (c.onCeiling || c.clinging) return false
      const ahead = (c.x - m.x) * m.facing
      const top = c.y - this.critterHeight(c)
      return ahead > -6 && ahead < 12 && y >= top - 1 && y <= c.y + 1
    })
    if (close) {
      this.burst(close.x, y, 3, '#a5f3fc')
      if (--close.hp <= 0) this.sweep(close)
      return
    }
    this.shots.push({
      x: m.x + m.facing * 9,
      y,
      vx: m.facing * SHOT_SPEED,
      life: SHOT_LIFE,
    })
  }

  private updateShots() {
    for (const s of this.shots) {
      s.x += s.vx
      s.life--
      if (s.x < 0 || s.x > DECK_W) s.life = 0
      if (s.life <= 0) continue
      const critter = this.critters.find((c) => {
        if (c.onCeiling) return false
        const top = c.y - this.critterHeight(c)
        return Math.abs(c.x - s.x) < 7 && s.y >= top - 1 && s.y <= c.y + 1
      })
      if (critter) {
        s.life = 0
        this.burst(s.x, s.y, 3, '#a5f3fc')
        if (--critter.hp <= 0) this.sweep(critter)
        continue
      }
      const sac = this.sacs.find(
        (k) =>
          !k.ceiling && k.hp > 0 && Math.abs(k.x - s.x) < 8 && s.y > FLOOR - 18,
      )
      if (sac) {
        s.life = 0
        sac.hp--
        sac.pulse = 6
        this.sound.play('blip')
        if (sac.hp <= 0) this.popSac(sac)
      }
    }
    this.shots = this.shots.filter((s) => s.life > 0)
  }

  private critterHeight(c: Critter): number {
    return c.kind === 'roller'
      ? c.big
        ? 12
        : 8
      : c.kind === 'crawler'
        ? 7
        : 18
  }

  private sweep(c: Critter) {
    this.critters = this.critters.filter((o) => o !== c)
    this.addScore(POINTS[c.kind] * this.level, c.x, c.y - 20)
    this.burst(c.x, c.y - 6, 10, c.kind === 'biter' ? '#f472b6' : '#a3e635')
    this.sound.play('pop')
  }

  private popSac(sac: Sac) {
    sac.hatches = 0
    this.addScore(200 * this.level, sac.x, FLOOR - 26)
    this.burst(sac.x, FLOOR - 8, 14, '#a3e635')
    this.sound.play('boom')
    if (this.rng() < 0.25) this.kits.push({ x: sac.x, life: 60 * 10 })
  }

  private updateSacs() {
    const every = levelCurve(this.heat, SWEEP_CURVES.hatchEvery)
    const mops = this.here()
    for (const sac of this.sacs) {
      if (sac.pulse > 0) sac.pulse--
      if (sac.hatches <= 0 || (!sac.ceiling && sac.hp <= 0)) continue
      // Only sacs near a Mop hatch, so the far end doesn't fill up unseen.
      if (!mops.some((m) => Math.abs(sac.x - m.x) <= W)) continue
      if (--sac.timer > 0) continue
      sac.timer = Math.round(every * (0.7 + this.rng() * 0.6))
      sac.hatches--
      this.hatch(sac)
    }
  }

  private hatch(sac: Sac) {
    const speed = levelCurve(this.heat, SWEEP_CURVES.critterSpeed)
    if (sac.ceiling) {
      this.critters.push({
        kind: 'crawler',
        x: sac.x,
        y: CEILING + 8,
        vx: 0.4 * speed,
        vy: 0,
        hp: 1,
        t: 0,
        onCeiling: true,
        clinging: null,
        canCling: true,
        big: false,
      })
    } else {
      const biter = this.rng() < levelCurve(this.heat, SWEEP_CURVES.biterChance)
      const prey = this.nearest(sac.x)
      const dir = prey && prey.x < sac.x ? -1 : 1
      this.critters.push({
        kind: biter ? 'biter' : 'roller',
        x: sac.x + dir * 8,
        y: FLOOR,
        vx: dir * (biter ? 0.5 : 1.3) * speed,
        vy: 0,
        hp: biter ? 3 : 1,
        t: 0,
        onCeiling: false,
        clinging: null,
        canCling: false,
        big: false,
      })
    }
    this.burst(sac.x, sac.ceiling ? CEILING + 6 : FLOOR - 10, 5, '#d9f99d')
    this.sound.play('warn')
  }

  private updateCritters() {
    const speed = levelCurve(this.heat, SWEEP_CURVES.critterSpeed)
    const mops = this.here()
    for (const c of this.critters) {
      c.t++
      // Each critter goes after the nearest Mop on its deck.
      const prey = c.clinging ?? this.nearest(c.x)
      if (!prey) continue
      if (c.kind === 'crawler') {
        if (c.clinging) {
          // Riding the lift with its Mop: the deck it left is still live
          // (a partner is there), but the Mop isn't, so no nibbling in transit.
          if (prey.ride) continue
          c.x = prey.x
          c.y = prey.y - 18
          if (c.t % 10 === 0) this.damage(prey, 1)
          continue
        }
        if (c.onCeiling) {
          c.x += Math.sign(prey.x - c.x) * Math.abs(c.vx)
          // Drop when right above a Mop.
          if (Math.abs(c.x - prey.x) < 10) {
            c.onCeiling = false
            c.vy = 0
          }
          continue
        }
        c.vy += GRAVITY
        c.x += c.vx
        c.y += c.vy
        const landing = c.canCling
          ? mops.find(
              (m) =>
                c.y >= m.y - 18 &&
                Math.abs(c.x - m.x) < 9 &&
                m.y - 18 > CEILING,
            )
          : undefined
        if (landing) {
          c.clinging = landing
          this.sound.play('warn')
          continue
        }
        if (c.y >= FLOOR) {
          c.y = FLOOR
          c.vy = 0
          c.vx = Math.sign(prey.x - c.x) * 0.7 * speed
        }
        // On the floor it nibbles at a Mop's treads.
        if (c.y >= FLOOR && c.t % 30 === 0)
          for (const m of mops)
            if (this.touching(c, 7, m)) this.damage(m, c.big ? 6 : 3)
      } else if (c.kind === 'roller') {
        c.x += c.vx
        if (c.x < 8 || c.x > DECK_W - 8) c.vx = -c.vx
        // Rollers turn back toward a Mop once they've rolled past.
        if (
          Math.abs(c.x - prey.x) > 140 &&
          Math.sign(prey.x - c.x) !== Math.sign(c.vx)
        )
          c.vx = -c.vx
        const hit = mops.find((m) => this.touching(c, 8, m))
        if (hit) {
          this.damage(hit, c.big ? 12 : 8)
          c.vx = -c.vx * 1.5
          c.x += c.vx * 6
        }
      } else {
        // Biters stalk, then spit when lined up.
        const dist = prey.x - c.x
        if (Math.abs(dist) > 50) c.x += Math.sign(dist) * 0.5 * speed
        if (c.t % (c.big ? 70 : 110) === 0 && Math.abs(dist) < 150) {
          this.spits.push({
            x: c.x,
            y: FLOOR - 14,
            vx: Math.sign(dist) * 2.2,
            life: 90,
          })
          this.sound.play('blip')
        }
        if (c.t % 30 === 0)
          for (const m of mops) if (this.touching(c, 18, m)) this.damage(m, 12)
      }
    }
  }

  private touching(c: Critter, height: number, m: Mop): boolean {
    if (Math.abs(c.x - m.x) > 9) return false
    const myTop = m.y - (m.crouch ? 10 : 22)
    return c.y > myTop && c.y - height < m.y
  }

  private updateSpits() {
    const mops = this.here()
    for (const s of this.spits) {
      s.x += s.vx
      s.life--
      if (s.life <= 0) continue
      // A spit flies at waist height: crouch under it.
      const hit = mops.find(
        (m) => Math.abs(s.x - m.x) < 6 && !m.crouch && m.y > FLOOR - 4,
      )
      if (hit) {
        s.life = 0
        this.damage(hit, 6)
      }
    }
    this.spits = this.spits.filter((s) => s.life > 0)
  }

  private updateKits() {
    const mops = this.here()
    for (const k of this.kits) {
      k.life--
      const m = mops.find((o) => Math.abs(k.x - o.x) < 10 && o.y > FLOOR - 6)
      if (!m) continue
      k.life = 0
      m.health = Math.min(MAX_HEALTH, m.health + 30)
      this.floaters.push({
        deck: this.curIndex,
        x: k.x,
        y: FLOOR - 30,
        text: 'REPAIRED!',
        life: 45,
      })
      this.sound.play('pickup')
    }
    this.kits = this.kits.filter((k) => k.life > 0)
  }

  private damage(m: Mop, amount: number) {
    if (m.dead > 0) return
    m.health -= amount
    m.hurt = 10
    if (amount > 2) this.sound.play('warn')
  }

  /** The clock ran out: the station is lost, and a spare Mop with it. */
  private stationLost() {
    const lead = this.mops.find((m) => !m.out)
    if (lead) this.burstOn(lead.deck, lead.x, lead.y - 10, 18, '#f87171')
    this.sound.play('die')
    if (this.spares > 0) {
      this.spares--
    } else {
      // No spare to lose: the last Mop still in play sits out instead.
      const last = [...this.mops].reverse().find((m) => !m.out)
      if (last) last.out = true
    }
    if (this.mops.every((m) => m.out)) {
      this.over = true
      this.banner = { text: 'STATION LOST', sub: 'GAME OVER', ticks: 9999 }
      return
    }
    this.clear = CLEAR_TICKS
    this.banner = {
      text: 'STATION LOST',
      sub: 'ON TO THE NEXT ONE',
      ticks: CLEAR_TICKS,
    }
  }

  /** Critters left alone grow big: tougher, and harder-hitting. */
  private grow() {
    const after = levelCurve(this.heat, SWEEP_CURVES.growAfter)
    const speed = levelCurve(this.heat, SWEEP_CURVES.critterSpeed)
    for (const c of this.critters) {
      if (c.t < after) continue
      const prey = this.nearest(c.x)
      const dir = Math.sign((prey?.x ?? c.x) - c.x) || 1
      // Crawlers only grow once they're down on the floor.
      const loose =
        c.kind !== 'crawler' || (!c.onCeiling && !c.clinging && c.y >= FLOOR)
      if (c.big || !loose) continue
      c.big = true
      c.hp += 2
      if (c.kind === 'roller') c.vx = Math.sign(c.vx || dir) * 1.8 * speed
      c.t = 0
      this.burst(c.x, c.y - 8, 10, '#f0abfc')
      this.sound.play('warn')
    }
  }

  private down(m: Mop) {
    if (m.dead > 0) return
    m.dead = DEATH_TICKS
    for (const c of this.critters) if (c.clinging === m) c.clinging = null
    // Loose crawlers scatter; any clinging to a partner stay on (to be swept).
    this.critters = this.critters.filter(
      (c) => c.kind !== 'crawler' || c.onCeiling || c.clinging !== null,
    )
    this.burst(m.x, m.y - 10, 18, '#fde68a')
    this.sound.play('die')
    if (this.spares > 0)
      this.banner = {
        text: this.duo ? `${m.seat + 1}P NEEDS A REBOOT` : 'MOP NEEDS A REBOOT',
        ticks: 90,
      }
  }

  private checkClean() {
    const d = this.cur
    const sacsLeft = this.sacs.some(
      (s) => s.hatches > 0 && (s.ceiling || s.hp > 0),
    )
    const m = this.here()[0]
    const at = m ?? { x: DECK_W / 2, y: FLOOR }
    if (!d.clean && !sacsLeft && !this.critters.length) {
      d.clean = true
      const bonus = 1000 * this.level
      this.addScore(bonus, at.x, at.y - 40)
      if (this.decks.some((k) => !k.clean)) {
        this.banner = {
          text: 'DECK CLEAN!',
          sub: `BONUS ${bonus}  TO THE LIFT`,
          ticks: 110,
        }
        this.sound.play('extra')
      }
    }
    if (this.critters.length || this.decks.some((k) => !k.clean)) return
    const inPlay = this.mops.filter((o) => !o.out)
    const health =
      inPlay.reduce((sum, o) => sum + Math.max(0, o.health), 0) /
      Math.max(1, inPlay.length)
    const bonus =
      3000 * this.level +
      Math.round(health) * 10 +
      Math.floor(this.timer / 60) * 10 * this.level
    this.addScore(bonus, at.x, at.y - 50)
    this.clear = CLEAR_TICKS
    this.banner = {
      text: 'STATION CLEAN!',
      sub: `BONUS ${bonus}`,
      ticks: CLEAR_TICKS,
    }
    this.sound.play('level')
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x: number, y: number) {
    if (this.demo) return
    this.score += points
    this.floaters.push({
      deck: this.curIndex,
      x,
      y,
      text: String(points),
      life: 40,
    })
    if (this.score >= this.nextExtra) {
      this.spares++
      // Each spare takes longer to earn: 25k, 75k, 175k, 375k...
      this.nextExtra = this.nextExtra * 2 + EXTRA_EVERY
      this.banner = { text: 'SPARE MOP!', ticks: 90 }
      this.sound.play('extra')
    }
  }

  private burst(x: number, y: number, count: number, color: string) {
    this.burstOn(this.curIndex, x, y, count, color)
  }

  private burstOn(
    deck: number,
    x: number,
    y: number,
    count: number,
    color: string,
  ) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.5 + this.rng() * 1.5
      this.particles.push({
        deck,
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 0.4,
        life: 18 + Math.floor(this.rng() * 14),
        color,
      })
    }
  }

  private updateEffects() {
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.05
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

  /** Flies player 1's Mop alone (the attract demo seats one). */
  private demoInput(): InputFrame {
    const frame = idleFrame()
    const held = frame.held
    const me = this.mops[0]!
    // A clinging crawler: jump to shake it.
    if (this.critters.some((c) => c.clinging === me) && me.onGround) {
      frame.pressed.up = true
      return frame
    }
    // A spit coming in: crouch under it.
    if (
      this.spits.some(
        (s) =>
          Math.abs(s.x - me.x) < 40 &&
          Math.sign(me.x - s.x) === Math.sign(s.vx),
      )
    ) {
      held.down = true
      return frame
    }
    // Pick the nearest floor target: a critter first, then a live sac, then a kit if hurt.
    const targets: Array<{ x: number; low: boolean }> = [
      ...this.critters
        .filter((c) => !c.onCeiling && !c.clinging)
        .map((c) => ({ x: c.x, low: c.kind !== 'biter' })),
      ...this.sacs
        .filter((s) => !s.ceiling && s.hp > 0 && s.hatches > 0)
        .map((s) => ({ x: s.x, low: false })),
    ]
    if (me.health < 50 && this.kits.length)
      targets.unshift({ x: this.kits[0]!.x, low: false })
    // With nothing on the floor, walk under a ceiling sac to bring its crawlers down.
    if (!targets.length) {
      const sac = this.sacs.find((s) => s.ceiling && s.hatches > 0)
      if (sac) targets.push({ x: sac.x, low: false })
      // Same for a crawler still riding the ceiling: it keeps the deck dirty.
      for (const c of this.critters)
        if (c.onCeiling) targets.push({ x: c.x, low: false })
    }
    const target = targets.sort(
      (a, b) => Math.abs(a.x - me.x) - Math.abs(b.x - me.x),
    )[0]
    if (!target) return this.pilotToLift(me, frame)
    const dist = target.x - me.x
    const dir = dist > 0 ? 1 : -1
    // Too close to aim at: back off a step first.
    if (Math.abs(dist) < 6) {
      if (me.facing > 0) held.left = true
      else held.right = true
      return frame
    }
    if (Math.abs(dist) > 110 || dir !== me.facing) {
      if (dir > 0) held.right = true
      else held.left = true
      return frame
    }
    if (target.low) held.down = true
    held.a = true
    if (Math.abs(dist) > 50) {
      if (dir > 0) held.right = true
      else held.left = true
    }
    return frame
  }

  /** Walk to the nearest lift and ride toward the nearest deck still dirty. */
  private pilotToLift(me: Mop, frame: InputFrame): InputFrame {
    const dirty = this.decks
      .map((d, i) => (d.clean ? -1 : i))
      .filter((i) => i >= 0 && i !== me.deck)
      .sort((a, b) => Math.abs(a - me.deck) - Math.abs(b - me.deck))[0]
    if (dirty === undefined) return frame
    const lift = LIFTS.reduce((a, b) =>
      Math.abs(a - me.x) < Math.abs(b - me.x) ? a : b,
    )
    if (Math.abs(lift - me.x) > 4) {
      if (lift > me.x) frame.held.right = true
      else frame.held.left = true
      return frame
    }
    if (dirty < me.deck) frame.pressed.up = true
    else frame.pressed.down = true
    return frame
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    g.fillStyle = '#05030d'
    g.fillRect(0, 0, W, H)
    if (this.duo) {
      this.renderSplit(g)
      return
    }
    const me = this.mops[0]!
    g.save()
    g.translate(-Math.round(me.camX), 0)
    this.renderWorld(g, me.deck)
    g.restore()
    this.renderHud(g)
  }

  /** Everything on one deck, in world coordinates. */
  private renderWorld(g: CanvasRenderingContext2D, deck: number) {
    this.use(deck)
    this.renderDeck(g, deck)
    for (const lift of LIFTS) this.renderLift(g, lift, deck)
    for (const sac of this.sacs) this.renderSac(g, sac)
    for (const k of this.kits) this.renderKit(g, k)
    for (const c of this.critters) this.renderCritter(g, c)
    for (const s of this.spits) {
      g.fillStyle = '#d946ef'
      g.fillRect(s.x - 2, s.y - 1, 4, 3)
    }
    for (const s of this.shots) {
      g.fillStyle = '#67e8f9'
      g.fillRect(s.x - 4, s.y - 1, 8, 2)
      g.fillStyle = '#ecfeff'
      g.fillRect(s.x - 1, s.y - 1, 3, 2)
    }
    for (const m of this.mops) {
      if (m.deck !== deck || m.dead > 0 || m.out || this.over) continue
      // A Mop shows in the doorway while the lift doors are open.
      const inLift =
        m.ride && Math.abs(m.ride.t - RIDE_TICKS / 2) < RIDE_TICKS / 2 - 8
      if (!inLift) this.renderMop(g, m)
    }
    for (const p of this.particles) {
      if (p.deck !== deck) continue
      g.globalAlpha = Math.max(0, p.life / 30)
      g.fillStyle = p.color
      g.fillRect(p.x - 1, p.y - 1, 2, 2)
    }
    g.globalAlpha = 1
    for (const f of this.floaters)
      if (f.deck === deck)
        drawText(g, f.text, f.x, f.y, { align: 'center', color: '#fde68a' })
  }

  /** Split screen: a slim shared HUD, then a strip per Mop, player 1's on top. */
  private renderSplit(g: CanvasRenderingContext2D) {
    const stripH = this.stripH
    this.mops.forEach((m, i) => {
      const top = SPLIT_HUD + i * stripH
      g.save()
      g.beginPath()
      g.rect(0, top, W, stripH)
      g.clip()
      if (m.out) {
        g.fillStyle = '#0b1026'
        g.fillRect(0, top, W, stripH)
        drawText(g, `${m.seat + 1}P IS OUT`, W / 2, top + stripH / 2 - 8, {
          scale: 2,
          align: 'center',
          color: SEAT_COLORS[m.seat],
        })
        drawText(
          g,
          'A SPARE MOP BRINGS YOU BACK',
          W / 2,
          top + stripH / 2 + 12,
          {
            align: 'center',
            color: '#94a3b8',
          },
        )
      } else {
        g.translate(0, top)
        g.scale(this.stripScale, this.stripScale)
        g.translate(-Math.round(m.camX), -VIEW_TOP)
        this.renderWorld(g, m.deck)
      }
      g.restore()
      if (!m.out) this.renderViewHud(g, m, top)
    })
    g.fillStyle = '#334155'
    for (let i = 1; i < this.mops.length; i++)
      g.fillRect(0, SPLIT_HUD + i * stripH - 1, W, 2)
    this.renderSplitHud(g)
  }

  /** Over each view: whose Mop, its charge, its deck, and a map of that deck. */
  private renderViewHud(g: CanvasRenderingContext2D, m: Mop, top: number) {
    const shadow = '#0b1026'
    drawText(g, `${m.seat + 1}P`, 4, top + 3, {
      color: SEAT_COLORS[m.seat],
      shadow,
    })
    g.fillStyle = '#1f2937'
    g.fillRect(20, top + 4, 60, 4)
    const frac = Math.max(0, m.health) / MAX_HEALTH
    g.fillStyle = frac > 0.5 ? '#4ade80' : frac > 0.25 ? '#facc15' : '#ef4444'
    g.fillRect(20, top + 4, 60 * frac, 4)
    drawText(g, `DECK ${m.deck + 1}`, 86, top + 3, { color: '#bef264', shadow })
    if (m.dead > 0)
      drawText(g, 'REBOOTING', W - 6, top + 3, {
        align: 'right',
        color: '#fde68a',
        shadow,
      })
    const d = this.decks[m.deck]!
    const mapX = 130
    const mapW = W - 6 - mapX
    if (m.dead > 0) return
    g.fillStyle = '#1e293b'
    g.fillRect(mapX, top + 4, mapW, 4)
    for (const s of d.sacs) {
      if (s.hatches <= 0 || (!s.ceiling && s.hp <= 0)) continue
      g.fillStyle = '#84cc16'
      g.fillRect(
        mapX + (s.x / DECK_W) * mapW - 1,
        top + (s.ceiling ? 4 : 6),
        2,
        2,
      )
    }
    for (const c of d.critters) {
      g.fillStyle = '#f472b6'
      g.fillRect(mapX + (c.x / DECK_W) * mapW, top + 5, 1, 2)
    }
    for (const o of this.mops) {
      if (o.deck !== m.deck || o.out) continue
      g.fillStyle = SEAT_COLORS[o.seat]!
      g.fillRect(mapX + (o.x / DECK_W) * mapW - 1, top + 3, 3, 6)
    }
  }

  private renderSplitHud(g: CanvasRenderingContext2D) {
    const shadow = '#0b1026'
    g.fillStyle = '#0b1026'
    g.fillRect(0, 0, W, SPLIT_HUD)
    drawText(g, String(this.score).padStart(7, '0'), 4, 4, {
      scale: 2,
      color: '#67e8f9',
      shadow,
    })
    const secs = Math.max(0, Math.ceil(this.timer / 60))
    drawText(g, `TIME ${secs}`, 96, 3, {
      color:
        secs <= 20 && Math.floor(this.tick / 10) % 2 ? '#ef4444' : '#fde68a',
    })
    for (let i = 0; i < Math.min(this.spares, 5); i++) {
      g.fillStyle = '#0ea5e9'
      g.fillRect(96 + i * 9, 13, 6, 6)
    }
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W - 4, 3, {
      align: 'right',
      color: '#f9a8d4',
    })
    drawText(g, `STATION ${this.level}`, W - 4, 13, {
      align: 'right',
      color: '#bef264',
    })
    // The station, top deck first: clean green, dirty red, and who's on each.
    this.decks.forEach((d, i) => {
      const bx = 160 + i * 13
      g.fillStyle = d.clean ? '#22c55e' : '#be123c'
      g.fillRect(bx, 3, 10, 7)
      for (const m of this.mops) {
        if (m.out || m.deck !== i) continue
        g.fillStyle = SEAT_COLORS[m.seat]!
        g.fillRect(bx + m.seat * 4, 12, 3, 3)
      }
    })
    this.renderBanner(g, H / 2 - 10)
  }

  private renderBanner(g: CanvasRenderingContext2D, y: number) {
    if (!this.banner) return
    drawText(g, this.banner.text, W / 2, y, {
      scale: 2,
      align: 'center',
      color: '#ffffff',
      shadow: '#7c3aed',
    })
    if (this.banner.sub)
      drawText(g, this.banner.sub, W / 2, y + 20, {
        align: 'center',
        color: '#fde68a',
        shadow: '#0b1026',
      })
  }

  private renderDeck(g: CanvasRenderingContext2D, deck: number) {
    // Ceiling and floor plating, wall panels with portholes onto space.
    g.fillStyle = '#1e293b'
    g.fillRect(0, CEILING - 14, DECK_W, 14)
    g.fillRect(0, FLOOR, DECK_W, H - FLOOR)
    g.fillStyle = '#334155'
    g.fillRect(0, CEILING - 2, DECK_W, 2)
    g.fillRect(0, FLOOR, DECK_W, 3)
    g.fillStyle = '#111827'
    g.fillRect(0, CEILING, DECK_W, FLOOR - CEILING)
    for (let x = 0; x < DECK_W; x += 80) {
      g.fillStyle = DECK_PANELS[deck % DECK_PANELS.length]!
      g.fillRect(x + 2, CEILING + 4, 76, FLOOR - CEILING - 8)
      g.fillStyle = '#0b1026'
      g.beginPath()
      g.arc(x + 40, CEILING + 46, 14, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = '#e0e7ff'
      g.fillRect(x + 34 + ((x / 80) % 3) * 4, CEILING + 40, 1, 1)
      g.fillRect(x + 44, CEILING + 50 - ((x / 80) % 2) * 5, 1, 1)
      g.strokeStyle = '#475569'
      g.lineWidth = 2
      g.beginPath()
      g.arc(x + 40, CEILING + 46, 14, 0, Math.PI * 2)
      g.stroke()
      // Pipes and a blinking console light.
      g.fillStyle = '#374151'
      g.fillRect(x, CEILING + 92, 80, 3)
      g.fillStyle =
        (x / 80 + Math.floor(this.tick / 30)) % 3 === 0 ? '#22c55e' : '#14532d'
      g.fillRect(x + 64, CEILING + 80, 4, 3)
    }
    // Floor grating.
    g.fillStyle = '#0f172a'
    for (let x = 0; x < DECK_W; x += 10) g.fillRect(x, FLOOR + 6, 6, 2)
  }

  private renderLift(g: CanvasRenderingContext2D, x: number, deck: number) {
    const top = CEILING + 34
    g.fillStyle = '#0f172a'
    g.fillRect(x - 16, top - 4, 32, FLOOR - top + 4)
    // The doors slide open while a Mop steps in or out.
    const rider = this.mops.find(
      (m) => m.ride && m.deck === deck && Math.abs(m.x - x) < 2,
    )
    const t = rider?.ride ? rider.ride.t : 0
    const open = rider
      ? Math.max(0, Math.min(1, Math.abs(t - RIDE_TICKS / 2) / 10 - 1))
      : 0
    const gap = Math.round(open * 12)
    g.fillStyle = '#64748b'
    g.fillRect(x - 13, top, 13 - gap, FLOOR - top)
    g.fillRect(x + gap, top, 13 - gap, FLOOR - top)
    g.fillStyle = '#94a3b8'
    g.fillRect(x - 13, top, 13 - gap, 2)
    g.fillRect(x + gap, top, 13 - gap, 2)
    if (rider && open < 1) {
      g.fillStyle = '#7dd3fc'
      g.fillRect(x - 1, top + 6 + ((this.tick * 2) % 40), 2, 6)
    }
    // Arrows: lime toward a deck still dirty, grey toward a clean one.
    const arrow = (to: number, up: boolean) => {
      const d = this.decks[to]
      if (!d) return
      g.fillStyle = d.clean ? '#475569' : '#a3e635'
      const ay = up ? top - 14 : top - 7
      g.beginPath()
      g.moveTo(x + (up ? -5 : -5), ay + (up ? 5 : 0))
      g.lineTo(x + 5, ay + (up ? 5 : 0))
      g.lineTo(x, ay + (up ? 0 : 5))
      g.fill()
    }
    arrow(deck - 1, true)
    arrow(deck + 1, false)
  }

  private renderSac(g: CanvasRenderingContext2D, sac: Sac) {
    const spent = sac.hatches <= 0 || (!sac.ceiling && sac.hp <= 0)
    const wobble = Math.sin(this.tick / 12 + sac.x) * 1
    const y = sac.ceiling ? CEILING + 6 : FLOOR - 8
    if (spent) {
      g.fillStyle = '#3f6212'
      g.fillRect(sac.x - 6, sac.ceiling ? CEILING : FLOOR - 3, 12, 3)
      return
    }
    g.fillStyle = sac.pulse > 0 ? '#ffffff' : '#65a30d'
    g.beginPath()
    g.ellipse(sac.x, y, 7 + wobble, 9 - wobble, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#a3e635'
    g.beginPath()
    g.ellipse(sac.x - 2, y - 2, 2.5, 3.5, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#365314'
    g.fillRect(sac.x - 1, y + 1, 2, 2)
  }

  private renderKit(g: CanvasRenderingContext2D, k: Kit) {
    if (k.life < 90 && Math.floor(this.tick / 5) % 2) return
    g.fillStyle = '#f8fafc'
    g.fillRect(k.x - 5, FLOOR - 9, 10, 8)
    g.fillStyle = '#22c55e'
    g.fillRect(k.x - 1, FLOOR - 8, 2, 6)
    g.fillRect(k.x - 3, FLOOR - 6, 6, 2)
  }

  private renderCritter(g: CanvasRenderingContext2D, c: Critter) {
    const x = c.x
    const y = c.y
    const after = levelCurve(this.heat, SWEEP_CURVES.growAfter)
    const growing =
      !c.big &&
      (c.kind !== 'crawler' || (!c.onCeiling && !c.clinging)) &&
      c.t > after - GLOW_TICKS
    if (growing && Math.floor(this.tick / 6) % 2) {
      // About to grow: a pulsing halo.
      g.fillStyle = 'rgba(240, 171, 252, 0.45)'
      g.beginPath()
      g.arc(x, y - 5, 9, 0, Math.PI * 2)
      g.fill()
    }
    if (c.kind === 'roller') {
      const spin = Math.floor(c.t / 4) % 2
      g.fillStyle = '#84cc16'
      g.beginPath()
      g.arc(x, y - (c.big ? 6 : 4), c.big ? 6 : 4, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = '#ecfccb'
      g.fillRect(x - 2 + spin * 2, y - (c.big ? 9 : 6), 2, 2)
      return
    }
    if (c.kind === 'crawler') {
      // A wriggly glitch grub; upside down while it rides the ceiling.
      const flip = c.onCeiling ? -1 : 1
      g.fillStyle = c.big ? '#a855f7' : '#c084fc'
      const seg = c.big ? 6 : 4
      for (let i = 0; i < seg; i++) {
        const wig = Math.sin(c.t / 5 + i) * 1
        const tall = c.big ? 6 : 4
        g.fillRect(
          x - seg * 1.5 + i * 3,
          y - tall * flip + wig - (flip > 0 ? 0 : tall),
          3,
          tall,
        )
      }
      g.fillStyle = '#f5f3ff'
      g.fillRect(x + 4, y - 4 * flip - (flip > 0 ? 0 : 4), 2, 2)
      return
    }
    // Biter: a hunched glitch beast with a big jaw.
    const bob = Math.floor(c.t / 10) % 2
    if (c.big) {
      // Grown: a ridge of spikes along its back.
      g.fillStyle = '#831843'
      for (let i = 0; i < 3; i++) {
        g.beginPath()
        g.moveTo(x - 6 + i * 5, y - 15 + bob)
        g.lineTo(x - 4 + i * 5, y - 21 + bob)
        g.lineTo(x - 2 + i * 5, y - 15 + bob)
        g.fill()
      }
    }
    g.fillStyle = c.big ? '#be185d' : '#db2777'
    g.fillRect(x - 7, y - 16 + bob, 14, 14)
    g.fillStyle = '#9d174d'
    g.fillRect(x - 6, y - 4, 3, 4)
    g.fillRect(x + 3, y - 4, 3, 4)
    const face = Math.sign((this.nearest(x)?.x ?? x + 1) - x) || 1
    g.fillStyle = '#fef3c7'
    g.fillRect(x + face * 3 - 1, y - 13 + bob, 3, 3)
    g.fillStyle = '#ffffff'
    for (let i = 0; i < 3; i++)
      g.fillRect(x + face * 2 + i * 2 * face - 1, y - 7 + bob, 1, 2)
  }

  private renderMop(g: CanvasRenderingContext2D, m: Mop) {
    const x = Math.round(m.x)
    const y = Math.round(m.y)
    const f = m.facing
    const tall = m.crouch ? 10 : 20
    const flash = m.hurt > 0 && Math.floor(this.tick / 2) % 2
    const [body, dome] = MOP_COLORS[m.seat] ?? MOP_COLORS[0]!
    // Treads, a round body, a dome head with one big eye, and the sweeper nozzle.
    g.fillStyle = '#1f2937'
    g.fillRect(x - 7, y - 4, 14, 4)
    g.fillStyle = '#374151'
    for (let i = 0; i < 4; i++)
      g.fillRect(x - 6 + i * 4 + (Math.floor(m.walkPhase) % 2), y - 3, 2, 2)
    g.fillStyle = flash ? '#ffffff' : body
    g.fillRect(x - 6, y - tall, 12, tall - 4)
    g.fillStyle = flash ? '#ffffff' : dome
    g.beginPath()
    g.arc(x, y - tall, 6, Math.PI, 0)
    g.fill()
    g.fillStyle = '#0f172a'
    g.fillRect(x + f * 2 - 2, y - tall - 3, 4, 3)
    g.fillStyle = '#fde047'
    g.fillRect(x + f * 2 - 1, y - tall - 2, 2, 1)
    const gunY = m.crouch ? y - 5 : y - 15
    g.fillStyle = '#e5e7eb'
    g.fillRect(f > 0 ? x + 5 : x - 10, gunY - 1, 5, 3)
  }

  private renderHud(g: CanvasRenderingContext2D) {
    const shadow = '#0b1026'
    const me = this.mops[0]!
    g.fillStyle = '#0b1026'
    g.fillRect(0, 0, W, 50)
    drawText(g, String(this.score).padStart(7, '0'), 6, 6, {
      scale: 2,
      color: '#67e8f9',
      shadow,
    })
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W - 6, 4, {
      align: 'right',
      color: '#f9a8d4',
    })
    drawText(g, `STATION ${this.level}  DECK ${me.deck + 1}`, W - 6, 13, {
      align: 'right',
      color: '#bef264',
    })
    // The station, top deck first: clean decks green, dirty ones red, Mop's outlined.
    this.decks.forEach((d, i) => {
      const bx = W - 6 - (this.decks.length - i) * 12
      g.fillStyle = d.clean ? '#22c55e' : '#be123c'
      g.fillRect(bx, 26, 10, 7)
      if (i === me.deck) {
        g.strokeStyle = '#67e8f9'
        g.lineWidth = 1
        g.strokeRect(bx - 0.5, 25.5, 11, 8)
      }
    })
    const secs = Math.max(0, Math.ceil(this.timer / 60))
    drawText(g, `TIME ${secs}`, 100, 8, {
      color:
        secs <= 20 && Math.floor(this.tick / 10) % 2 ? '#ef4444' : '#fde68a',
    })
    drawText(g, 'CHARGE', 6, 26, { color: '#bbf7d0' })
    g.fillStyle = '#1f2937'
    g.fillRect(48, 27, 90, 5)
    const frac = Math.max(0, me.health) / MAX_HEALTH
    g.fillStyle = frac > 0.5 ? '#4ade80' : frac > 0.25 ? '#facc15' : '#ef4444'
    g.fillRect(48, 27, 90 * frac, 5)
    for (let i = 0; i < Math.min(this.spares, 5); i++) {
      g.fillStyle = '#0ea5e9'
      g.fillRect(150 + i * 10, 26, 7, 7)
    }
    // Deck map: sacs left (green), critters (pink), Mop (cyan).
    this.use(me.deck)
    const mapX = 6
    const mapW = W - 12
    g.fillStyle = '#1e293b'
    g.fillRect(mapX, 40, mapW, 4)
    for (const s of this.sacs) {
      if (s.hatches <= 0 || (!s.ceiling && s.hp <= 0)) continue
      g.fillStyle = '#84cc16'
      g.fillRect(mapX + (s.x / DECK_W) * mapW - 1, s.ceiling ? 40 : 42, 2, 2)
    }
    for (const c of this.critters) {
      g.fillStyle = '#f472b6'
      g.fillRect(mapX + (c.x / DECK_W) * mapW, 41, 1, 2)
    }
    g.fillStyle = '#67e8f9'
    g.fillRect(mapX + (me.x / DECK_W) * mapW - 1, 39, 3, 6)
    this.renderBanner(g, 110)
  }
}

const stationSweep: ArcadeGameModule = {
  create: (options) => new StationSweep(options),
}

export const create = stationSweep.create
export default stationSweep
