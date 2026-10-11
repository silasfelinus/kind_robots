// /utils/arcade/games/rescueRally.ts
//
// Rescue Rally -- the Kind Robots Arcade's arena-shooter riff (conductor
// kr-arcade/t-007). An android hero zips around a neon arena firing a kindness
// beam that reboots glitched drones into friendly bots, while people, pets and
// little bots wait to be rescued for a growing multiplier.
//
// Depth slice 1 (t-035, depth-pass/CABINETS.md section 1, "Twin-stick and teeth") gives it teeth:
// - true twin-stick aim: a second stick (the right stick, the on-screen aim stick, or the arrows
//   while WASD moves) aims and fires on its own; single-stick players still move to aim, A to fire
//   and hold B to strafe;
// - the family is in danger: stompers (wind-up giants no beam can stop, only shove) knock rescuees
//   dizzy, so they wander off home without their bonus; hypnos glitch them into glitched friends
//   who chase the hero until a beam reboots them; sparkers flash, then fire at where the hero is
//   going; pylon posts stand in shapes (hearts, stars, K-I-N-D);
// - every rescue is a choice: touch to collect at once, or hold B to lead up to three in a parade
//   to the wave's beacon pad for double the bonus (a hit scatters the parade);
// - waves are scripts (rescueRally/waves.ts): their foes, entries, late vent arrivals, pylon
//   shapes, family spots and beacon, in place of the old random mix;
// - bigger actors with walk cycles (rescueRally/art.ts).
// The foes' rules live in rescueRally/roster.ts and the family's in rescueRally/family.ts.

import { drawText, measureText } from '../font'
import {
  INK,
  RAMPS,
  Sparkles,
  backdropRng,
  bandedGradient,
  bevel,
  cachedLayer,
  dropShadow,
  drawSprite,
  gauge,
  glow,
  hudPanel,
  mix,
  pixelSprite,
  rgba,
  shadedOrb,
  vignette,
} from '../snes'
import type { Ramp } from '../snes'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'
import {
  ARENA,
  ARENA_H,
  ARENA_W,
  CX,
  CY,
  H,
  VENTS,
  W,
  clampToArena,
  dist,
  toward,
} from '../rescueRally/arena'
import type { Point } from '../rescueRally/arena'
import {
  DRONE_SPRITES,
  FREED_SPRITES,
  GLITCH,
  HEART_SPRITE,
  HELP_SPRITE,
  HERO_SPRITES,
  LIME,
  PYLON_SPRITE,
  SEEKER_SPRITES,
  SHIRTS,
  SKINS,
  SPARKER_SPRITE,
  TANK_SPRITES,
  familySprites,
  glitchTint,
} from '../rescueRally/art'
import {
  PARADE_GAP,
  PARADE_MAX,
  RESCUEE_RADIUS,
  stepRescuee,
} from '../rescueRally/family'
import type { FamilyWorld, Rescuee, RescueeKind } from '../rescueRally/family'
import { pylonSpots } from '../rescueRally/pylons'
import {
  FOES,
  RUSH_MAX,
  RUSH_TICKS,
  STOMP_REWIND,
  newFoe,
  stepFoe,
} from '../rescueRally/roster'
import type { Foe, FoeKind, FoeWorld, Quarry } from '../rescueRally/roster'
import { groupSize, waveAt } from '../rescueRally/waves'
import type { Entry, WaveScript } from '../rescueRally/waves'

export { W, H }

const PLAYER_SPEED = 1.9
const HERO_RADIUS = 8
const SHOT_SPEED = 6.5
const SHOT_LIFE = 70
const MAX_SHOTS = 6
const FIRE_COOLDOWN = 6
const START_LIVES = 3
const EXTRA_LIFE_EVERY = 25_000
const RESCUE_STEP = 1000
const RESCUE_CAP = 5
/** Points for rebooting a glitched friend back into a rescuee (never for hurting one). */
const REBOOT_POINTS = 100
/** Below this a stick's push doesn't aim. */
const AIM_MIN = 0.3
/** Steps of footprints a hero keeps for its parade to follow. */
const TRAIL = (PARADE_MAX + 1) * PARADE_GAP + 2
const BEACON_RADIUS = 18
const BOLT_RADIUS = 3
const BOLT_LIFE = 200
const MAX_BOLTS = 30
const MAX_FOES = 140
/** A vent glows this long before a late group comes through it. */
const VENT_TELL = 70
/** A dizzy rescuee staggers for at least this long. */
const DIZZY_TICKS = 150

/** How a wave remembers its late arrivals. */
type Arrival = { tick: number; kind: FoeKind; count: number; from: Entry }

type Hero = {
  seat: number
  x: number
  y: number
  vx: number
  vy: number
  aimX: number
  aimY: number
  walk: number
  alive: boolean
  respawn: number
  invuln: number
  fireCooldown: number
  /** A second stick is pointing this tick. */
  aiming: boolean
  /** B is held: touching a rescuee invites them into the parade. */
  gathering: boolean
  /** Where the hero has been, newest last, for the parade to step in. */
  trail: Point[]
}
type Shot = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  seat: number
}
/** A sparker's spark. */
type Bolt = { x: number; y: number; vx: number; vy: number; life: number }
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

// --- 16-bit art (utils/arcade/snes.ts) -------------------------------------------

const TILE = 24

/** Each wave lays a different floor: [band dark, band light], seam light, emblem ramp. */
const FLOOR_THEMES: ReadonlyArray<{
  bands: readonly [string, string]
  seam: string
  accent: Ramp
}> = [
  {
    bands: [RAMPS.night[1], RAMPS.night[3]],
    seam: RAMPS.purple[3],
    accent: RAMPS.teal,
  },
  {
    bands: ['#08202c', '#14485a'],
    seam: RAMPS.teal[3],
    accent: RAMPS.pink,
  },
  {
    bands: ['#220c2c', '#4a1c54'],
    seam: RAMPS.pink[3],
    accent: RAMPS.gold,
  },
]

/** The beacon pad's little house: walk a parade here. */
const HOUSE_SPRITE = pixelSprite(
  [
    '....R....',
    '...RRR...',
    '..RRRRR..',
    '.RRRRRRR.',
    'rRRRRRRRr',
    '.WWWWWWW.',
    '.WkWWWYW.',
    '.WkWWWWW.',
    '.wkwwwww.',
  ],
  {
    R: RAMPS.pink[3],
    r: RAMPS.pink[1],
    W: RAMPS.cream[3],
    w: RAMPS.cream[2],
    k: RAMPS.earth[1],
    Y: RAMPS.gold[3],
  },
)

/** A rescuee's starting look, rolled on the game's rng. */
const KIND_CYCLE: readonly RescueeKind[] = [
  'person',
  'person',
  'cat',
  'dog',
  'bot',
]

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
  private heroes: Hero[] = []
  private shots: Shot[] = []
  private bolts: Bolt[] = []
  private foes: Foe[] = []
  private family: Rescuee[] = []
  private arrivals: Arrival[] = []
  private script: WaveScript
  private loop = 1
  private waveTick = 0
  private beacon: Point | null = null
  private nextId = 1
  private sparks: Spark[] = []
  private floaters: Floater[] = []
  private freed: Array<{ x: number; y: number; life: number }> = []
  private multiplier = 1
  private nextExtra = EXTRA_LIFE_EVERY
  private waveDelay = 0
  /** This wave's family: how many came, how many the hero got home. */
  private familyTotal = 0
  private familySaved = 0
  private banner: { text: string; sub?: string; ticks: number } | null = null
  private overTimer = 0
  // Cosmetic sparkles, bursts and rescue rings roll their own dice, so the seeded rng is untouched.
  private fx = new Sparkles()
  private fxRng = backdropRng(41)
  private rings: Array<{ x: number; y: number; life: number; color: string }> =
    []
  private foeWorld: FoeWorld
  /** The pilot's second stick, held between looks. */
  private pilotAim: Point | null = null
  private familyWorld: FamilyWorld

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.heroes = [this.newHero(0)]
    this.foeWorld = this.makeFoeWorld()
    this.familyWorld = this.makeFamilyWorld()
    this.script = waveAt(1).script
    this.startWave(1)
  }

  private newHero(seat: number): Hero {
    return {
      seat,
      x: CX,
      y: CY,
      vx: 0,
      vy: 0,
      aimX: 0,
      aimY: -1,
      walk: 0,
      alive: true,
      respawn: 0,
      invuln: 0,
      fireCooldown: 0,
      aiming: false,
      gathering: false,
      trail: [],
    }
  }

  // --- the worlds the roster and the family see ------------------------------------

  private nearestHero(from: Point): Hero | null {
    let best: Hero | null = null
    let bestD = Infinity
    for (const h of this.heroes) {
      if (!h.alive) continue
      const d = dist(h, from)
      if (d < bestD) {
        best = h
        bestD = d
      }
    }
    return best
  }

  private makeFoeWorld(): FoeWorld {
    return {
      rng: () => this.rng(),
      heat: 1,
      rush: 1,
      hero: (from) => {
        const h = this.nearestHero(from)
        return h ? ({ x: h.x, y: h.y, vx: h.vx, vy: h.vy } as Quarry) : null
      },
      family: (from) => {
        let best: Rescuee | null = null
        let bestD = Infinity
        for (const r of this.family) {
          if ((r.state !== 'calm' && r.state !== 'parade') || r.immune > 0)
            continue
          const d = dist(r, from)
          if (d < bestD) {
            best = r
            bestD = d
          }
        }
        return best
      },
      bonk: (r, by) => this.bonk(r, by),
      glitch: (r) => this.glitch(r),
      fire: (x, y, vx, vy) => {
        if (this.bolts.length < MAX_BOLTS)
          this.bolts.push({ x, y, vx, vy, life: BOLT_LIFE })
      },
      hatch: (kind, at) => {
        if (this.foes.length < MAX_FOES)
          this.foes.push(newFoe(kind, at, this.rng))
      },
      sound: (name) => this.sound.play(name),
    }
  }

  private makeFamilyWorld(): FamilyWorld {
    return {
      rng: () => this.rng(),
      heat: 1,
      hero: (from) => this.nearestHero(from),
      trail: (seat, slot) => {
        const h = this.heroes[seat]
        if (!h || !h.alive) return null
        const back = (slot + 1) * PARADE_GAP
        const at = h.trail[Math.max(0, h.trail.length - 1 - back)]
        return at ?? h
      },
      post: (at, r) => {
        for (const f of this.foes) {
          if (f.kind === 'pylon' && dist(f, at) < r + FOES.pylon.radius)
            return f
        }
        return null
      },
    }
  }

  // --- the family under threat -------------------------------------------------------

  private leaveParade(r: Rescuee) {
    if (r.state !== 'parade') return
    const seat = r.seat
    r.state = 'calm'
    this.reslot(seat)
  }

  private reslot(seat: number) {
    let slot = 0
    for (const m of this.family)
      if (m.state === 'parade' && m.seat === seat) m.slot = slot++
  }

  private parade(seat: number): Rescuee[] {
    return this.family.filter((r) => r.state === 'parade' && r.seat === seat)
  }

  /** A stomper walked into one: dizzy, off home without a bonus (never hurt). */
  private bonk(r: Rescuee, by: Point) {
    this.leaveParade(r)
    r.state = 'dizzy'
    r.clock = DIZZY_TICKS
    const u = toward(by, r)
    r.x += u.x * 6
    r.y += u.y * 6
    this.floaters.push({
      x: r.x,
      y: r.y - 16,
      text: 'DIZZY!',
      life: 50,
      color: RAMPS.gold[3],
    })
    this.sound.play('warn')
  }

  /** A hypno reached one: a glitched friend, until a beam reboots them. */
  private glitch(r: Rescuee) {
    this.leaveParade(r)
    r.state = 'glitched'
    r.vx = 0
    r.vy = 0
    this.floaters.push({
      x: r.x,
      y: r.y - 16,
      text: 'GLITCHED!',
      life: 50,
      color: GLITCH[3],
    })
    this.rings.push({ x: r.x, y: r.y, life: 24, color: GLITCH[3] })
    this.sound.play('warn')
  }

  /** A beam reached a glitched friend: back to themselves, a moment dazed and safe from hypnos. */
  private reboot(r: Rescuee) {
    r.state = 'calm'
    r.clock = 40
    r.immune = 180
    r.turn = 0
    this.addScore(REBOOT_POINTS, r.x, r.y - 12, GLITCH[4])
    this.floaters.push({
      x: r.x,
      y: r.y - 24,
      text: 'REBOOT!',
      life: 40,
      color: RAMPS.leaf[3],
    })
    this.rings.push({ x: r.x, y: r.y, life: 24, color: RAMPS.leaf[3] })
    this.fx.burst(r.x, r.y - 6, this.fxRng, {
      count: 8,
      speed: 1.4,
      colours: [RAMPS.leaf[3], GLITCH[4], RAMPS.gold[4]],
    })
    this.sound.play('pickup')
  }

  // --- setup ---------------------------------------------------------------------------

  private clearOfPylons(p: Point, r: number) {
    return !this.foes.some(
      (f) => f.kind === 'pylon' && dist(f, p) < r + FOES.pylon.radius,
    )
  }

  private scatterSpot(minDistance: number, clearance = 12): Point {
    const from = this.heroes[0]!
    for (let attempt = 0; attempt < 60; attempt++) {
      const p = {
        x: ARENA.left + 18 + this.rng() * (ARENA_W - 36),
        y: ARENA.top + 18 + this.rng() * (ARENA_H - 36),
      }
      if (dist(p, from) >= minDistance && this.clearOfPylons(p, clearance))
        return p
    }
    return { x: ARENA.left + 24, y: ARENA.top + 24 }
  }

  /** Where the i-th of n comes in through an entry. */
  private entrySpot(from: Entry, i: number, n: number): Point {
    const hero = this.heroes[0]!
    const inset = 22
    const jitter = (k: number) => (this.rng() - 0.5) * k
    const L = ARENA.left + inset
    const R = ARENA.right - inset
    const T = ARENA.top + inset
    const B = ARENA.bottom - inset
    const along = (a: number, b: number) =>
      a + ((i + 0.5 + jitter(0.6)) / n) * (b - a)
    let p: Point
    switch (from) {
      case 'scatter':
        return this.scatterSpot(110)
      case 'edges': {
        // Round the walls clockwise from the top-left, spread out evenly.
        const perimeter = 2 * (R - L) + 2 * (B - T)
        let t = ((i + 0.5 + jitter(0.5)) / n) * perimeter
        if (t < R - L) p = { x: L + t, y: T }
        else if ((t -= R - L) < B - T) p = { x: R, y: T + t }
        else if ((t -= B - T) < R - L) p = { x: R - t, y: B }
        else p = { x: L, y: B - (t - (R - L)) }
        break
      }
      case 'corners': {
        const c = i % 4
        p = {
          x: (c === 0 || c === 3 ? L + 14 : R - 14) + jitter(36),
          y: (c < 2 ? T + 14 : B - 14) + jitter(36),
        }
        break
      }
      case 'ring': {
        const a = (i / n) * Math.PI * 2 + jitter(0.3)
        p = {
          x: hero.x + Math.cos(a) * 135,
          y: hero.y + Math.sin(a) * 110,
        }
        break
      }
      case 'vents': {
        const v = VENTS[i % VENTS.length]!
        p = { x: v.x + jitter(20), y: v.y + jitter(20) }
        break
      }
      case 'top':
        p = { x: along(L, R), y: T + jitter(10) }
        break
      case 'bottom':
        p = { x: along(L, R), y: B + jitter(10) }
        break
      case 'left':
        p = { x: L + jitter(10), y: along(T, B) }
        break
      case 'right':
        p = { x: R + jitter(10), y: along(T, B) }
        break
    }
    clampToArena(p, 14)
    return p
  }

  private place(kind: FoeKind, count: number, from: Entry) {
    for (let i = 0; i < count && this.foes.length < MAX_FOES; i++)
      this.foes.push(newFoe(kind, this.entrySpot(from, i, count), this.rng))
  }

  private startWave(n: number) {
    const { script, loop } = waveAt(n)
    this.level = n
    this.script = script
    this.loop = loop
    this.foeWorld.heat = n
    this.familyWorld.heat = n
    this.foes = []
    this.shots = []
    this.bolts = []
    this.family = []
    this.arrivals = []
    this.multiplier = 1
    this.waveTick = 0
    this.beacon = script.beacon
    const start = script.hero ?? { x: CX, y: CY }
    for (const h of this.heroes) {
      Object.assign(h, { x: start.x, y: start.y, vx: 0, vy: 0 })
      h.trail = []
    }
    // The pylon garden first, so nothing else is placed on a post.
    for (const place of script.pylons ?? []) {
      for (const p of pylonSpots(place)) {
        const inside =
          p.x > ARENA.left + 8 &&
          p.x < ARENA.right - 8 &&
          p.y > ARENA.top + 8 &&
          p.y < ARENA.bottom - 8
        if (inside && dist(p, start) > 26)
          this.foes.push(newFoe('pylon', p, this.rng))
      }
    }
    for (let i = 0; i < (script.puddles ?? 0); i++)
      this.foes.push(newFoe('puddle', this.scatterSpot(60, 16), this.rng))
    for (const group of script.groups) {
      const count = groupSize(group, loop)
      if (!group.at) {
        this.place(group.kind, count, group.from)
        continue
      }
      for (let k = 0; k < (group.times ?? 1); k++) {
        this.arrivals.push({
          tick: group.at + k * (group.every ?? 0),
          kind: group.kind,
          count,
          from: group.from,
        })
      }
    }
    this.placeFamily(script, loop)
    for (const h of this.heroes) h.invuln = 90
    this.banner = { text: `WAVE ${n}`, sub: script.name, ticks: 110 }
  }

  private placeFamily(script: WaveScript, loop: number) {
    const count = script.family.count + Math.min(3, loop - 1)
    const kinds = script.family.kinds ?? KIND_CYCLE
    const shapes = (script.pylons ?? []).filter(
      (p) => p.shape !== 'row' && p.shape !== 'column',
    )
    for (let i = 0; i < count; i++) {
      let p: Point
      switch (script.family.at) {
        case 'center':
          p = {
            x: CX + (this.rng() - 0.5) * 120,
            y: CY + (this.rng() - 0.5) * 80,
          }
          break
        case 'corners':
          p = this.entrySpot('corners', i, count)
          break
        case 'ring': {
          const a = (i / count) * Math.PI * 2
          p = { x: CX + Math.cos(a) * 110, y: CY + Math.sin(a) * 90 }
          break
        }
        case 'shapes': {
          // Half wait inside the shapes (behind the posts), the rest out on the floor.
          const shape = shapes[i % Math.max(1, shapes.length)]
          p =
            shape && i < shapes.length * 2
              ? {
                  x: shape.x + (this.rng() - 0.5) * 12,
                  y: shape.y + (this.rng() - 0.5) * 8,
                }
              : this.scatterSpot(50, 14)
          break
        }
        default:
          p = this.scatterSpot(50, 14)
      }
      clampToArena(p, 12)
      if (!this.clearOfPylons(p, RESCUEE_RADIUS + 2))
        p = this.scatterSpot(50, 14)
      this.family.push({
        id: this.nextId++,
        kind: kinds[i % kinds.length]!,
        x: p.x,
        y: p.y,
        vx: 0,
        vy: 0,
        turn: 0,
        color: SHIRTS[Math.floor(this.rng() * SHIRTS.length)]!,
        skin: SKINS[Math.floor(this.rng() * SKINS.length)]!,
        state: 'calm',
        clock: 0,
        immune: 0,
        seat: 0,
        slot: 0,
      })
    }
    this.familyTotal = count
    this.familySaved = 0
  }

  // --- update ----------------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    if (this.lives <= 0 && !this.heroes.some((h) => h.alive)) {
      if (++this.overTimer > 100) this.over = true
      return
    }
    if (this.waveDelay > 0) {
      if (--this.waveDelay === 0) this.startWave(this.level + 1)
      return
    }

    const controls = this.demo ? this.demoInput() : input
    for (const h of this.heroes) this.stepHero(h, controls)
    this.waveTick++
    this.foeWorld.rush =
      1 + (RUSH_MAX - 1) * Math.min(1, this.waveTick / RUSH_TICKS)
    this.arrive()
    for (let i = 0; i < this.foes.length; i++)
      stepFoe(this.foes[i]!, this.foeWorld)
    this.moveFamily()
    this.moveShots()
    this.collide()

    const busy =
      this.arrivals.length > 0 ||
      this.foes.some((f) => FOES[f.kind].hostile) ||
      this.family.some((r) => r.state === 'glitched')
    if (!busy && this.waveDelay === 0) this.clearWave()
  }

  private clearWave() {
    // Anyone still in a parade walks home with the hero, at the plain bonus.
    for (const h of this.heroes) {
      for (const r of this.parade(h.seat)) this.collect(r, 1)
    }
    this.waveDelay = 120
    this.sound.play('level')
    const all = this.familySaved >= this.familyTotal
    this.banner = {
      text: 'WAVE CLEAR!',
      sub: all
        ? 'EVERYONE HOME!'
        : `SAVED ${this.familySaved} OF ${this.familyTotal}`,
      ticks: 120,
    }
  }

  private arrive() {
    for (const a of this.arrivals) {
      if (this.waveTick === a.tick - VENT_TELL) this.sound.play('warn')
      if (this.waveTick >= a.tick) this.place(a.kind, a.count, a.from)
    }
    this.arrivals = this.arrivals.filter((a) => this.waveTick < a.tick)
  }

  private stepHero(h: Hero, input: InputFrame) {
    if (!h.alive) {
      if (this.lives > 0 && --h.respawn <= 0) this.revive(h)
      return
    }
    const stick =
      input.aim && Math.hypot(input.aim.x, input.aim.y) >= AIM_MIN
        ? input.aim
        : null
    let dx = 0
    let dy = 0
    if (input.held.left) dx -= 1
    if (input.held.right) dx += 1
    if (input.held.up) dy -= 1
    if (input.held.down) dy += 1
    const fromX = h.x
    const fromY = h.y
    if (dx || dy) {
      const len = Math.hypot(dx, dy)
      h.x += (dx / len) * PLAYER_SPEED
      h.y += (dy / len) * PLAYER_SPEED
      h.walk += 0.3
      // Moving aims, unless B holds the aim (strafe) or a second stick is aiming.
      if (!input.held.b && !stick) {
        h.aimX = dx / len
        h.aimY = dy / len
      }
    }
    clampToArena(h, HERO_RADIUS)
    h.vx = h.x - fromX
    h.vy = h.y - fromY
    if (h.vx || h.vy) {
      h.trail.push({ x: h.x, y: h.y })
      if (h.trail.length > TRAIL) h.trail.shift()
    }
    h.aiming = stick !== null
    if (stick) {
      const len = Math.hypot(stick.x, stick.y)
      h.aimX = stick.x / len
      h.aimY = stick.y / len
    }
    h.gathering = input.held.b
    if (h.fireCooldown > 0) h.fireCooldown--
    const mine = this.shots.reduce((n, s) => n + (s.seat === h.seat ? 1 : 0), 0)
    if (
      (input.held.a || h.aiming) &&
      h.fireCooldown === 0 &&
      mine < MAX_SHOTS
    ) {
      this.shots.push({
        x: h.x + h.aimX * 10,
        y: h.y - 4 + h.aimY * 10,
        vx: h.aimX * SHOT_SPEED,
        vy: h.aimY * SHOT_SPEED,
        life: SHOT_LIFE,
        seat: h.seat,
      })
      h.fireCooldown = FIRE_COOLDOWN
      this.sound.play('shoot')
    }
    if (h.invuln > 0) h.invuln--
  }

  private moveFamily() {
    const home: Rescuee[] = []
    for (const r of this.family) {
      if (stepRescuee(r, this.familyWorld)) home.push(r)
    }
    for (const r of home) {
      // A dizzy one wandered off: home safe, but no bonus this wave.
      this.family.splice(this.family.indexOf(r), 1)
      this.floaters.push({
        x: r.x,
        y: Math.max(ARENA.top + 12, r.y - 10),
        text: 'HOME SAFE',
        life: 45,
        color: RAMPS.sky[3],
      })
    }
  }

  private moveShots() {
    const out = (o: Point) =>
      o.x < ARENA.left ||
      o.x > ARENA.right ||
      o.y < ARENA.top ||
      o.y > ARENA.bottom
    for (const s of this.shots) {
      s.x += s.vx
      s.y += s.vy
      s.life--
      if (out(s)) s.life = 0
    }
    this.shots = this.shots.filter((s) => s.life > 0)
    for (const b of this.bolts) {
      b.x += b.vx
      b.y += b.vy
      b.life--
      if (out(b)) b.life = 0
    }
    this.bolts = this.bolts.filter((b) => b.life > 0)
  }

  private collide() {
    for (const s of this.shots) {
      // A beam meets a spark: both fizzle.
      const bolt = this.bolts.find((b) => dist(b, s) < BOLT_RADIUS + 4)
      if (bolt) {
        bolt.life = 0
        s.life = 0
        this.burst(s.x, s.y, 5, [RAMPS.gold[4], '#ffffff'])
        continue
      }
      // A glitched friend in the way is rebooted, never harmed.
      const friend = this.family.find(
        (r) => r.state === 'glitched' && dist(r, { x: s.x, y: s.y + 4 }) < 9,
      )
      if (friend) {
        s.life = 0
        this.reboot(friend)
        continue
      }
      const hit = this.foes.findIndex(
        (f) => dist(s, f) < FOES[f.kind].radius + 2,
      )
      if (hit < 0) continue
      s.life = 0
      this.hitFoe(hit, s)
    }
    this.shots = this.shots.filter((s) => s.life > 0)
    this.bolts = this.bolts.filter((b) => b.life > 0)

    for (const h of this.heroes) {
      if (!h.alive) continue
      this.touchFamily(h)
      this.touchBeacon(h)
      if (h.invuln > 0) continue
      const touched =
        this.foes.some(
          (f) => dist(f, h) < FOES[f.kind].radius + HERO_RADIUS - 2,
        ) ||
        this.family.some(
          (r) =>
            r.state === 'glitched' &&
            dist(r, h) < RESCUEE_RADIUS + HERO_RADIUS - 2,
        ) ||
        this.bolts.some((b) => dist(b, h) < BOLT_RADIUS + HERO_RADIUS - 2)
      if (touched) this.loseLife(h)
    }
  }

  private hitFoe(index: number, s: Shot) {
    const foe = this.foes[index]!
    const spec = FOES[foe.kind]
    if (spec.shove) {
      const len = Math.hypot(s.vx, s.vy) || 1
      foe.pushX += (s.vx / len) * spec.shove
      foe.pushY += (s.vy / len) * spec.shove
    }
    if (spec.hp === 0) {
      // Nothing reboots a stomper: the beam only shoves it.
      this.burst(s.x, s.y, 3, [RAMPS.steel[4], RAMPS.gold[3]])
      this.sound.play('blip')
      return
    }
    if (--foe.hp > 0) {
      this.sound.play('blip')
      return
    }
    this.foes.splice(index, 1)
    this.addScore(spec.points, foe.x, foe.y, '#fde68a')
    const colours =
      foe.kind === 'puddle'
        ? ['#a3e635', '#4d7c0f']
        : foe.kind === 'pylon'
          ? [RAMPS.teal[3], RAMPS.pink[3], '#ffffff']
          : foe.kind === 'hypno'
            ? [GLITCH[3], GLITCH[4], RAMPS.leaf[3]]
            : ['#a78bfa', '#86efac', '#e0e7ff']
    this.burst(foe.x, foe.y, foe.kind === 'drone' ? 8 : 16, colours)
    if (
      foe.kind === 'drone' ||
      foe.kind === 'tank' ||
      foe.kind === 'hypno' ||
      foe.kind === 'sparker'
    ) {
      this.freed.push({ x: foe.x, y: foe.y, life: 60 })
      this.fx.burst(foe.x, foe.y, this.fxRng, {
        count: 6,
        speed: 1.2,
        colours: [RAMPS.leaf[3], RAMPS.teal[3], RAMPS.gold[4]],
      })
    }
    this.sound.play(
      foe.kind === 'spawner' || foe.kind === 'hypno' ? 'boom' : 'pop',
    )
  }

  private touchFamily(h: Hero) {
    for (const r of [...this.family]) {
      if (dist(r, h) >= HERO_RADIUS + RESCUEE_RADIUS) continue
      if (r.state === 'calm') {
        const parade = this.parade(h.seat)
        if (h.gathering && this.beacon && parade.length < PARADE_MAX) {
          r.state = 'parade'
          r.seat = h.seat
          r.slot = parade.length
          this.floaters.push({
            x: r.x,
            y: r.y - 16,
            text: 'FOLLOW ME!',
            life: 40,
            color: RAMPS.pink[3],
          })
          this.sound.play('blip')
        } else {
          this.collect(r, 1)
        }
      } else if (r.state === 'dizzy') {
        // Caught before they wandered off: safe, though the bonus is gone for this wave.
        this.family.splice(this.family.indexOf(r), 1)
        this.familySaved++
        this.floaters.push({
          x: r.x,
          y: r.y - 14,
          text: 'SAFE!',
          life: 40,
          color: RAMPS.sky[3],
        })
        this.rings.push({ x: r.x, y: r.y, life: 24, color: RAMPS.sky[3] })
        this.sound.play('pickup')
      }
    }
  }

  private touchBeacon(h: Hero) {
    if (!this.beacon || dist(h, this.beacon) > BEACON_RADIUS) return
    const parade = this.parade(h.seat)
    if (!parade.length) return
    for (const r of parade) this.collect(r, 2)
    this.floaters.push({
      x: this.beacon.x,
      y: this.beacon.y - 26,
      text: 'DOUBLE!',
      life: 60,
      color: RAMPS.gold[4],
    })
    this.rings.push({
      x: this.beacon.x,
      y: this.beacon.y,
      life: 24,
      color: RAMPS.gold[3],
    })
    this.sound.play('extra')
  }

  /** A rescue: the bonus (doubled at the beacon), and the multiplier climbs. */
  private collect(r: Rescuee, times: number) {
    const i = this.family.indexOf(r)
    if (i >= 0) this.family.splice(i, 1)
    this.familySaved++
    const points = RESCUE_STEP * this.multiplier * times
    this.addScore(points, r.x, r.y, times > 1 ? RAMPS.gold[4] : '#86efac')
    this.multiplier = Math.min(RESCUE_CAP, this.multiplier + 1)
    this.sound.play('pickup')
    this.fx.burst(r.x, r.y - 4, this.fxRng, { count: 14, speed: 1.8 })
    this.rings.push({ x: r.x, y: r.y, life: 24, color: RAMPS.leaf[3] })
  }

  private loseLife(h: Hero) {
    h.alive = false
    this.lives--
    h.respawn = 90
    this.multiplier = 1
    this.shots = this.shots.filter((s) => s.seat !== h.seat)
    this.bolts = []
    // The parade scatters: back to wandering, a little shaken.
    for (const r of this.parade(h.seat)) {
      r.state = 'calm'
      const u = toward(h, r)
      r.vx = u.x * 1.5
      r.vy = u.y * 1.5
      r.clock = 30
    }
    this.burst(h.x, h.y, 30, ['#f472b6', '#2dd4bf', '#fde68a'])
    this.sound.play('die')
    if (this.lives <= 0 && !this.heroes.some((o) => o.alive))
      this.banner = { text: 'GAME OVER', ticks: 9999 }
  }

  private revive(h: Hero) {
    const start = this.script.hero ?? { x: CX, y: CY }
    Object.assign(h, { x: start.x, y: start.y, vx: 0, vy: 0 })
    h.trail = []
    // Move anything crowding the spot back out toward the walls.
    for (const f of this.foes) {
      if (f.kind === 'puddle' || f.kind === 'pylon' || dist(f, h) >= 100)
        continue
      const a = Math.atan2(f.y - h.y, f.x - h.x)
      f.x = h.x + Math.cos(a) * 140
      f.y = h.y + Math.sin(a) * 120
      clampToArena(f, FOES[f.kind].radius)
    }
    for (const r of this.family) {
      if (r.state === 'glitched' && dist(r, h) < 80) {
        const u = toward(h, r)
        r.x = h.x + u.x * 110
        r.y = h.y + u.y * 90
        clampToArena(r, RESCUEE_RADIUS)
      }
    }
    h.alive = true
    h.invuln = 120
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

  private burst(
    x: number,
    y: number,
    count: number,
    colors: readonly string[],
  ) {
    for (let i = 0; i < count; i++) {
      const a = this.fxRng() * Math.PI * 2
      const s = 0.5 + this.fxRng() * 2.2
      this.sparks.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 20 + Math.floor(this.fxRng() * 25),
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
    this.fx.update()
    for (const r of this.rings) r.life--
    this.rings = this.rings.filter((r) => r.life > 0)
  }

  // --- attract-mode pilot ------------------------------------------------------------------

  /**
   * The attract demo's pilot (and the probes' stand-in player): steps away from whatever is close
   * and out of the line of any spark, heads for the nearest of the family (leading a parade to the
   * beacon when there is one), and aims its second stick at what matters most: a glitched friend to
   * reboot, a hypno on the hunt, then whatever is nearest.
   */
  demoInput(): InputFrame {
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
    const h = this.heroes[0]!
    if (!h.alive) return frame
    let mx = 0
    let my = 0
    const away = (p: Point, reach: number, weight = 1) => {
      const d = dist(p, h)
      if (d >= reach) return
      if (d < 0.5) {
        mx += h.x <= CX ? 1 : -1
        my += h.y <= CY ? 0.5 : -0.5
        return
      }
      const k = weight * (1 - d / reach) * 2
      mx += ((h.x - p.x) / d) * k
      my += ((h.y - p.y) / d) * k
    }
    for (const f of this.foes) {
      const r = FOES[f.kind].radius
      if (f.kind === 'pylon' || f.kind === 'puddle') away(f, r + 16, 1.6)
      else if (f.kind === 'stomper') away(f, r + 44, 1.4)
      else away(f, r + 46)
    }
    for (const r of this.family) if (r.state === 'glitched') away(r, 50)
    // Sidestep any spark flying this way, off the line it is flying along.
    for (const b of this.bolts) {
      const rx = h.x - b.x
      const ry = h.y - b.y
      if (Math.hypot(rx, ry) > 90) continue
      const speed = Math.hypot(b.vx, b.vy) || 1
      const ux = b.vx / speed
      const uy = b.vy / speed
      if (rx * ux + ry * uy < 0) continue
      const off = ry * ux - rx * uy
      if (Math.abs(off) > 14) continue
      const side = off >= 0 ? 1 : -1
      const push = 2.4 * (1 - Math.abs(off) / 14)
      mx += -uy * side * push
      my += ux * side * push
    }
    // Keep off the walls while dodging, so a corner never pins the pilot.
    if (Math.abs(mx) + Math.abs(my) > 0.4) {
      if (h.x < ARENA.left + 24) mx += 0.8
      if (h.x > ARENA.right - 24) mx -= 0.8
      if (h.y < ARENA.top + 24) my += 0.8
      if (h.y > ARENA.bottom - 24) my -= 0.8
    }
    const parade = this.parade(h.seat)
    const waiting = this.family.filter(
      (r) => r.state === 'calm' || r.state === 'dizzy',
    )
    const nearest = (list: readonly Point[]) =>
      list.reduce<Point | null>(
        (best, p) => (!best || dist(p, h) < dist(best, h) ? p : best),
        null,
      )
    const banking =
      this.beacon &&
      parade.length > 0 &&
      (parade.length >= PARADE_MAX || !waiting.length)
    const goal: Point | null = banking ? this.beacon : nearest(waiting)
    // Lead a parade whenever there's a pad to walk it to.
    held.b = !!this.beacon && parade.length < PARADE_MAX
    if (goal) {
      const d = dist(goal, h) || 1
      const pull = Math.abs(mx) + Math.abs(my) < 0.4 ? 1.2 : 0.7
      mx += ((goal.x - h.x) / d) * pull
      my += ((goal.y - h.y) / d) * pull
    } else if (Math.abs(mx) + Math.abs(my) < 0.3) {
      mx = (CX - h.x) * 0.02
      my = (CY - h.y) * 0.02
    }
    if (mx < -0.25) held.left = true
    if (mx > 0.25) held.right = true
    if (my < -0.25) held.up = true
    if (my > 0.25) held.down = true

    // The second stick: the most urgent thing in reach.
    let target: Point | null = null
    let best = Infinity
    const consider = (p: Point, weight: number) => {
      const d = dist(p, h) * weight
      if (d < best && dist(p, h) < 260) {
        best = d
        target = p
      }
    }
    for (const r of this.family) if (r.state === 'glitched') consider(r, 0.5)
    for (const f of this.foes) {
      if (f.kind === 'pylon' || f.kind === 'puddle') continue
      if (f.kind === 'stomper') {
        // Shove a stomper only when it's closing on the family or the pilot.
        const prey = this.foeWorld.family(f)
        if ((prey && dist(prey, f) < 60) || dist(f, h) < 70) consider(f, 1.1)
        continue
      }
      consider(f, f.kind === 'hypno' ? 0.45 : f.kind === 'tank' ? 1.6 : 1)
    }
    // A post between the pilot and the family it wants: pop it.
    if (!target && goal) {
      for (const f of this.foes) {
        if (f.kind !== 'pylon') continue
        if (onSegment(f, h, goal, 14)) consider(f, 1)
      }
    }
    // Like a person, it settles on a target for a few ticks before it looks again.
    if (target && (this.tick % 6 === 0 || !this.pilotAim)) {
      const u = toward(h, target as Point)
      this.pilotAim = { x: u.x, y: u.y }
    } else if (!target) this.pilotAim = null
    if (this.pilotAim) frame.aim = { ...this.pilotAim }
    return frame
  }

  // --- render ------------------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    this.renderArena(g)
    this.renderVents(g)
    if (this.beacon) this.renderBeacon(g, this.beacon)
    for (const f of this.foes) if (f.kind === 'puddle') this.renderPuddle(g, f)
    // Everything that stands up is drawn back to front.
    const actors: Array<{ y: number; draw: () => void }> = []
    for (const f of this.foes) {
      if (f.kind === 'puddle') continue
      actors.push({ y: f.y, draw: () => this.renderFoe(g, f) })
    }
    for (const r of this.family)
      actors.push({ y: r.y, draw: () => this.renderRescuee(g, r) })
    for (const h of this.heroes) {
      if (!h.alive || (h.invuln > 0 && Math.floor(h.invuln / 5) % 2 === 0))
        continue
      actors.push({ y: h.y, draw: () => this.renderHero(g, h) })
    }
    actors.sort((a, b) => a.y - b.y)
    for (const a of actors) a.draw()
    for (const f of this.freed) this.renderFreed(g, f)
    this.renderBolts(g)
    this.renderShots(g)
    g.save()
    g.globalCompositeOperation = 'lighter'
    for (const s of this.sparks) {
      const t = Math.max(0, s.life / s.max)
      const size = t > 0.5 ? 2 : 1
      g.globalAlpha = Math.min(1, t * 1.6)
      g.fillStyle = s.color
      g.fillRect(Math.round(s.x) - 1, Math.round(s.y) - 1, size + 1, size + 1)
      if (size > 1) {
        g.fillStyle = '#ffffff'
        g.fillRect(Math.round(s.x), Math.round(s.y), 1, 1)
      }
    }
    g.restore()
    this.renderRings(g)
    this.fx.render(g)
    for (const f of this.floaters) {
      drawText(g, f.text, f.x, f.y, {
        align: 'center',
        color: f.color,
        outline: INK,
      })
    }
    vignette(g, W, H, 0.3)
    this.renderHud(g)
  }

  private renderArena(g: CanvasRenderingContext2D) {
    const theme = (Math.max(1, this.level) - 1) % FLOOR_THEMES.length
    const look = FLOOR_THEMES[theme]!
    // Plated walls, a raised bevelled rim and a tiled floor, painted once per theme.
    cachedLayer(g, `rescue-rally-arena-${theme}`, W, H, (k) => {
      bandedGradient(
        k,
        0,
        0,
        W,
        H,
        [RAMPS.night[0], RAMPS.night[1], RAMPS.night[0]],
        4,
      )
      // Wall plating seams and rivets in the margins around the arena.
      for (let y = 0; y < H; y += TILE) {
        k.fillStyle = INK
        k.fillRect(0, y, ARENA.left - 4, 1)
        k.fillRect(ARENA.right + 4, y, W - ARENA.right - 4, 1)
        k.fillStyle = RAMPS.night[3]
        k.fillRect(0, y + 1, ARENA.left - 4, 1)
        k.fillRect(ARENA.right + 4, y + 1, W - ARENA.right - 4, 1)
        k.fillStyle = RAMPS.steel[1]
        k.fillRect(3, y + 12, 2, 2)
        k.fillRect(W - 5, y + 12, 2, 2)
        k.fillStyle = RAMPS.steel[3]
        k.fillRect(3, y + 12, 1, 1)
        k.fillRect(W - 5, y + 12, 1, 1)
      }
      // The raised rim: lit on the top and left, shadowed bottom and right.
      bevel(
        k,
        ARENA.left - 4,
        ARENA.top - 4,
        ARENA_W + 8,
        ARENA_H + 8,
        RAMPS.purple,
        { depth: 2 },
      )
      k.fillStyle = INK
      k.fillRect(ARENA.left - 1, ARENA.top - 1, ARENA_W + 2, ARENA_H + 2)
      // The floor: HDMA bands, lighter under the overhead lamps in the middle.
      bandedGradient(k, ARENA.left, ARENA.top, ARENA_W, ARENA_H, [
        look.bands[0],
        look.bands[1],
        mix(look.bands[0], look.bands[1], 0.4),
        look.bands[0],
      ])
      for (let ty = 0, j = 0; ty < ARENA_H; ty += TILE, j++) {
        for (let tx = 0, i = 0; tx < ARENA_W; tx += TILE, i++) {
          const x = ARENA.left + tx
          const y = ARENA.top + ty
          const w = Math.min(TILE, ARENA_W - tx)
          const h = Math.min(TILE, ARENA_H - ty)
          if ((i + j) % 2) {
            k.fillStyle = rgba(INK, 0.16)
            k.fillRect(x, y, w, h)
          }
          k.fillStyle = rgba(look.seam, 0.2)
          k.fillRect(x, y, w, 1)
          k.fillRect(x, y, 1, h)
          k.fillStyle = rgba(INK, 0.45)
          k.fillRect(x, y + h - 1, w, 1)
          k.fillRect(x + w - 1, y, 1, h)
          k.fillStyle = rgba(look.seam, 0.45)
          k.fillRect(x + 1, y + 1, 1, 1)
        }
      }
      // Floor furniture: vent grilles and little lamp panels, laid out by a fixed seed.
      const rand = backdropRng(97 + theme)
      for (let n = 0; n < 16; n++) {
        const tx = ARENA.left + Math.floor(rand() * 19) * TILE
        const ty = ARENA.top + Math.floor(rand() * 13) * TILE
        if (n % 3 === 0) {
          // A recessed floor lamp, dim so it never reads as a pickup.
          const lamp: Ramp = [
            INK,
            look.accent[0],
            look.accent[1],
            look.accent[2],
            look.accent[3],
          ]
          bevel(k, tx + 8, ty + 8, 8, 8, RAMPS.steel, {
            depth: 1,
            outline: INK,
          })
          bevel(k, tx + 10, ty + 10, 4, 4, lamp, { depth: 1, outline: null })
          glow(k, tx + 12, ty + 12, 9, look.accent[2], 0.12)
        } else {
          for (let v = 0; v < 3; v++) {
            k.fillStyle = rgba(INK, 0.6)
            k.fillRect(tx + 5, ty + 7 + v * 4, 14, 2)
            k.fillStyle = rgba(look.seam, 0.25)
            k.fillRect(tx + 5, ty + 9 + v * 4, 14, 1)
          }
        }
      }
      // Hazard stripes in the four corners.
      for (const [cx, cy] of [
        [ARENA.left, ARENA.top],
        [ARENA.right - TILE, ARENA.top],
        [ARENA.left, ARENA.bottom - TILE],
        [ARENA.right - TILE, ARENA.bottom - TILE],
      ] as const) {
        k.save()
        k.beginPath()
        k.rect(cx + 3, cy + 3, TILE - 6, TILE - 6)
        k.clip()
        for (let s = -TILE; s < TILE; s += 6) {
          k.fillStyle = rgba(RAMPS.gold[2], 0.35)
          k.beginPath()
          k.moveTo(cx + s, cy + TILE)
          k.lineTo(cx + s + 3, cy + TILE)
          k.lineTo(cx + s + 3 + TILE, cy)
          k.lineTo(cx + s + TILE, cy)
          k.fill()
        }
        k.restore()
      }
      // The Kind Robots heart emblem painted on the middle of the floor.
      const cx = CX
      const cy = CY
      k.lineWidth = 3
      k.strokeStyle = rgba(look.accent[2], 0.2)
      k.beginPath()
      k.arc(cx, cy, 44, 0, Math.PI * 2)
      k.stroke()
      k.lineWidth = 1
      k.strokeStyle = rgba(look.accent[3], 0.2)
      k.beginPath()
      k.arc(cx, cy, 38, 0, Math.PI * 2)
      k.stroke()
      const heart = (size: number) => {
        k.beginPath()
        k.moveTo(cx, cy + size * 0.9)
        k.bezierCurveTo(
          cx - size * 1.4,
          cy - size * 0.1,
          cx - size * 0.7,
          cy - size * 1.1,
          cx,
          cy - size * 0.4,
        )
        k.bezierCurveTo(
          cx + size * 0.7,
          cy - size * 1.1,
          cx + size * 1.4,
          cy - size * 0.1,
          cx,
          cy + size * 0.9,
        )
        k.closePath()
      }
      heart(24)
      k.fillStyle = rgba(look.accent[1], 0.22)
      k.fill()
      k.lineWidth = 2
      k.strokeStyle = rgba(look.accent[3], 0.22)
      k.stroke()
      // Ambient occlusion where the floor meets the rim, light catching the far lip.
      k.fillStyle = rgba(INK, 0.5)
      k.fillRect(ARENA.left, ARENA.top, ARENA_W, 3)
      k.fillRect(ARENA.left, ARENA.top, 3, ARENA_H)
      k.fillStyle = rgba(INK, 0.25)
      k.fillRect(ARENA.left, ARENA.top + 3, ARENA_W, 3)
      k.fillRect(ARENA.left + 3, ARENA.top, 3, ARENA_H)
      k.fillStyle = rgba(look.seam, 0.3)
      k.fillRect(ARENA.left, ARENA.bottom - 1, ARENA_W, 1)
      k.fillRect(ARENA.right - 1, ARENA.top, 1, ARENA_H)
    })
    // The rim's inner edge breathes teal, and chase lights run around it.
    const pulse = 0.6 + 0.4 * Math.sin(this.tick / 20)
    g.fillStyle = rgba(RAMPS.teal[3], 0.55 * pulse)
    g.fillRect(ARENA.left - 1, ARENA.top - 1, ARENA_W + 2, 1)
    g.fillRect(ARENA.left - 1, ARENA.bottom, ARENA_W + 2, 1)
    g.fillRect(ARENA.left - 1, ARENA.top, 1, ARENA_H)
    g.fillRect(ARENA.right, ARENA.top, 1, ARENA_H)
    const chase = Math.floor(this.tick / 6)
    const light = (x: number, y: number, i: number) => {
      const lit = (i + chase) % 4 === 0
      g.fillStyle = INK
      g.fillRect(x - 1, y - 1, 3, 3)
      g.fillStyle = lit
        ? i % 2
          ? RAMPS.pink[4]
          : RAMPS.teal[4]
        : i % 2
          ? RAMPS.pink[1]
          : RAMPS.teal[1]
      g.fillRect(x, y, 1, 1)
      if (lit) glow(g, x, y, 6, i % 2 ? RAMPS.pink[3] : RAMPS.teal[3], 0.6)
    }
    let i = 0
    for (let x = ARENA.left + TILE / 2; x < ARENA.right; x += TILE, i++) {
      light(x, ARENA.top - 3, i)
      light(ARENA.right + ARENA.left - x, ARENA.bottom + 2, i)
    }
    for (let y = ARENA.top + TILE / 2; y < ARENA.bottom; y += TILE, i++) {
      light(ARENA.right + 2, y, i)
      light(ARENA.left - 3, ARENA.bottom + ARENA.top - y, i)
    }
  }

  /** The four wall vents; one glows red before a late group comes through. */
  private renderVents(g: CanvasRenderingContext2D) {
    const due = this.arrivals.some(
      (a) => a.tick - this.waveTick <= VENT_TELL && a.tick > this.waveTick,
    )
    const hot = due && Math.floor(this.tick / 6) % 2 === 0
    VENTS.forEach((v, i) => {
      const horizontal = i % 2 === 0
      const w = horizontal ? 28 : 8
      const h = horizontal ? 8 : 28
      const x = Math.round(v.x - w / 2 + (i === 1 ? 6 : i === 3 ? -6 : 0))
      const y = Math.round(v.y - h / 2 + (i === 0 ? -6 : i === 2 ? 6 : 0))
      bevel(g, x, y, w, h, RAMPS.steel, { depth: 1 })
      g.fillStyle = hot ? RAMPS.ember[2] : INK
      for (let s = 2; s < (horizontal ? w : h) - 2; s += 3) {
        if (horizontal) g.fillRect(x + s, y + 2, 1, h - 4)
        else g.fillRect(x + 2, y + s, w - 4, 1)
      }
      if (due) glow(g, v.x, v.y, 22, RAMPS.ember[3], hot ? 0.7 : 0.35)
    })
  }

  private renderBeacon(g: CanvasRenderingContext2D, b: Point) {
    const h = this.heroes[0]!
    const leading = this.parade(h.seat).length > 0
    const pulse = 0.5 + 0.5 * Math.sin(this.tick / 10)
    dropShadow(g, b.x, b.y + 2, BEACON_RADIUS + 2, 7, 0.4)
    g.fillStyle = INK
    g.beginPath()
    g.ellipse(b.x, b.y, BEACON_RADIUS + 1, 10, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = RAMPS.steel[1]
    g.beginPath()
    g.ellipse(b.x, b.y, BEACON_RADIUS, 9, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = leading ? RAMPS.gold[2] : RAMPS.teal[1]
    g.beginPath()
    g.ellipse(b.x, b.y - 1, BEACON_RADIUS - 3, 7, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = leading ? RAMPS.gold[3] : RAMPS.teal[2]
    g.beginPath()
    g.ellipse(b.x - 2, b.y - 2, BEACON_RADIUS - 8, 4, 0, 0, Math.PI * 2)
    g.fill()
    glow(
      g,
      b.x,
      b.y - 4,
      28,
      leading ? RAMPS.gold[3] : RAMPS.teal[3],
      0.25 + 0.25 * pulse,
    )
    drawSprite(g, HOUSE_SPRITE, b.x, b.y - 2, { anchor: 'feet' })
    if (leading) {
      // Rings rise off the pad while a parade is on its way.
      g.save()
      g.globalCompositeOperation = 'lighter'
      for (let k = 0; k < 2; k++) {
        const t = ((this.tick / 40 + k / 2) % 1) as number
        g.globalAlpha = 1 - t
        g.strokeStyle = RAMPS.gold[3]
        g.lineWidth = 1
        g.beginPath()
        g.ellipse(
          b.x,
          b.y - t * 18,
          BEACON_RADIUS * (1 - t * 0.3),
          6,
          0,
          0,
          Math.PI * 2,
        )
        g.stroke()
      }
      g.restore()
    }
  }

  private renderHero(g: CanvasRenderingContext2D, h: Hero) {
    const bob = Math.sin(h.walk) > 0.5 ? -1 : 0
    const frame = Math.floor(h.walk / 1.2) % 2
    // Facing comes from the aim; pixel sprites flip, never rotate.
    const vertical = Math.abs(h.aimY) > Math.abs(h.aimX) * 1.2
    const set = vertical
      ? h.aimY > 0
        ? HERO_SPRITES.front
        : HERO_SPRITES.back
      : HERO_SPRITES.side
    glow(g, h.x, h.y, 30, RAMPS.teal[3], 0.16)
    dropShadow(g, h.x, h.y + 9, 8, 2.5, 0.4)
    drawSprite(g, set[frame ? 1 : 0], h.x, h.y + 10 + bob, {
      anchor: 'feet',
      flipX: !vertical && h.aimX < 0,
    })
    // The beam emitter's aim pip.
    const ax = Math.round(h.x + h.aimX * 16)
    const ay = Math.round(h.y - 4 + h.aimY * 16)
    glow(g, ax, ay, 5, RAMPS.gold[3], 0.6)
    g.fillStyle = RAMPS.gold[3]
    g.fillRect(ax - 1, ay, 3, 1)
    g.fillRect(ax, ay - 1, 1, 3)
    g.fillStyle = '#ffffff'
    g.fillRect(ax, ay, 1, 1)
    if (h.gathering && this.beacon) {
      // Arms out: a parade will follow. A little arrow points the way to the pad.
      const u = toward(h, this.beacon)
      const px = Math.round(h.x + u.x * 22)
      const py = Math.round(h.y - 2 + u.y * 22)
      g.fillStyle = INK
      g.fillRect(px - 2, py - 2, 5, 5)
      g.fillStyle = RAMPS.gold[3]
      g.fillRect(px - 1, py - 1, 3, 3)
    }
  }

  private renderShots(g: CanvasRenderingContext2D) {
    if (!this.shots.length) return
    for (const s of this.shots) glow(g, s.x, s.y, 9, RAMPS.pink[3], 0.5)
    g.save()
    g.globalCompositeOperation = 'lighter'
    g.lineCap = 'round'
    for (const s of this.shots) {
      const tx = s.x - s.vx * 1.6
      const ty = s.y - s.vy * 1.6
      g.strokeStyle = rgba(RAMPS.pink[2], 0.6)
      g.lineWidth = 4
      g.beginPath()
      g.moveTo(tx, ty)
      g.lineTo(s.x, s.y)
      g.stroke()
      g.strokeStyle = RAMPS.gold[3]
      g.lineWidth = 2
      g.beginPath()
      g.moveTo(s.x - s.vx * 0.9, s.y - s.vy * 0.9)
      g.lineTo(s.x, s.y)
      g.stroke()
    }
    g.restore()
    g.fillStyle = '#ffffff'
    for (const s of this.shots) {
      g.fillRect(Math.round(s.x) - 1, Math.round(s.y) - 1, 2, 2)
    }
  }

  /** A sparker's spark: a crackling gold ball with a jagged tail. */
  private renderBolts(g: CanvasRenderingContext2D) {
    for (const b of this.bolts) {
      glow(g, b.x, b.y, 10, RAMPS.gold[3], 0.6)
      g.strokeStyle = RAMPS.gold[3]
      g.lineWidth = 1
      g.beginPath()
      g.moveTo(b.x, b.y)
      for (let k = 1; k <= 3; k++) {
        const zig = ((b.life + k) % 2 ? 1 : -1) * 2
        g.lineTo(
          b.x - b.vx * k * 1.6 - b.vy * zig * 0.4,
          b.y - b.vy * k * 1.6 + b.vx * zig * 0.4,
        )
      }
      g.stroke()
      shadedOrb(g, b.x, b.y, BOLT_RADIUS, RAMPS.gold, { glint: false })
      g.fillStyle = '#ffffff'
      g.fillRect(Math.round(b.x) - 1, Math.round(b.y) - 1, 2, 2)
    }
  }

  private renderFoe(g: CanvasRenderingContext2D, f: Foe) {
    switch (f.kind) {
      case 'drone': {
        const step = f.timer % 12 < 7 ? 1 : 0
        const sprite = DRONE_SPRITES[step]
        dropShadow(g, f.x, f.y + 9, 8, 2.2, 0.35)
        drawSprite(g, sprite, f.x, f.y + step)
        // Every so often the glitch tears a scanline sideways.
        const glitch = (this.tick + Math.floor(f.seed * 13)) % 53
        if (glitch < 3) {
          const band = Math.round(f.y) - 4 + glitch * 3
          g.save()
          g.beginPath()
          g.rect(f.x - 11, band, 22, 2)
          g.clip()
          drawSprite(g, sprite, f.x + (glitch % 2 ? 3 : -3), f.y + step)
          g.restore()
          g.fillStyle = rgba(RAMPS.teal[3], 0.85)
          g.fillRect(Math.round(f.x) - 11, band, 2, 1)
          g.fillStyle = rgba(RAMPS.ember[2], 0.85)
          g.fillRect(Math.round(f.x) + 9, band + 1, 2, 1)
        }
        break
      }
      case 'seeker': {
        const sprite = SEEKER_SPRITES[Math.floor(this.tick / 4) % 2 ? 1 : 0]
        glow(g, f.x, f.y, 11, RAMPS.pink[3], 0.45)
        drawSprite(g, sprite, f.x - f.vx * 3, f.y - f.vy * 3, { alpha: 0.35 })
        dropShadow(g, f.x, f.y + 8, 4, 1.2, 0.3)
        drawSprite(g, sprite, f.x, f.y)
        break
      }
      case 'tank': {
        const sprite = TANK_SPRITES[Math.floor(this.tick / 5) % 3]!
        dropShadow(g, f.x, f.y + 10, 15, 3, 0.4)
        drawSprite(g, sprite, f.x, f.y)
        // The turret dome, and a scanning eye across it: red while healthy, gold when nearly rebooted.
        shadedOrb(g, f.x, f.y - 2, 6, RAMPS.steel)
        const eye = f.hp <= 2 ? RAMPS.gold : RAMPS.ember
        const ex = Math.round(f.x + Math.sin(this.tick / 14 + f.seed) * 3)
        const ey = Math.round(f.y - 2)
        glow(g, ex, ey, 10, eye[3], 0.55)
        g.fillStyle = eye[2]
        g.fillRect(ex - 3, ey - 1, 7, 3)
        g.fillStyle = eye[4]
        g.fillRect(ex - 1, ey - 1, 2, 1)
        break
      }
      case 'spawner':
        this.renderSpawner(g, f)
        break
      case 'stomper':
        this.renderStomper(g, f)
        break
      case 'hypno':
        this.renderHypno(g, f)
        break
      case 'sparker': {
        const flashing = f.mode === 1
        const on = flashing && Math.floor(this.tick / 3) % 2 === 0
        dropShadow(g, f.x, f.y + 9, 7, 2, 0.35)
        const hover = Math.round(Math.sin(this.tick / 9 + f.seed) * 1.5)
        glow(
          g,
          f.x,
          f.y - 9 + hover,
          flashing ? 22 : 9,
          RAMPS.gold[3],
          flashing ? 0.8 : 0.4,
        )
        drawSprite(g, SPARKER_SPRITE, f.x, f.y + hover)
        if (on) {
          // The tell: the coil flares white and crackles.
          g.fillStyle = '#ffffff'
          g.fillRect(Math.round(f.x) - 3, Math.round(f.y) - 9 + hover, 6, 3)
          g.strokeStyle = RAMPS.gold[4]
          g.lineWidth = 1
          for (let k = 0; k < 3; k++) {
            const a = (this.tick / 3 + k * 2.1) % (Math.PI * 2)
            g.beginPath()
            g.moveTo(f.x, f.y - 8 + hover)
            g.lineTo(f.x + Math.cos(a) * 8, f.y - 8 + hover + Math.sin(a) * 6)
            g.stroke()
          }
        }
        break
      }
      case 'pylon': {
        const hum = (this.tick + Math.floor(f.seed * 3)) % 90 < 45
        glow(g, f.x, f.y - 8, 9, RAMPS.teal[3], hum ? 0.45 : 0.3)
        dropShadow(g, f.x, f.y + 5, 5, 1.5, 0.4)
        drawSprite(g, PYLON_SPRITE, f.x, f.y + 6, { anchor: 'feet' })
        break
      }
      case 'puddle':
        break
    }
  }

  /** The stomper: a tin wind-up giant, painted from blocks so its legs, arms and key can move. */
  private renderStomper(g: CanvasRenderingContext2D, f: Foe) {
    const rewinding = f.mode === 1
    const beat = f.timer % 20
    const lift = rewinding ? 0 : beat < 10 ? 1 : -1
    const x = Math.round(f.x)
    const y = Math.round(f.y)
    dropShadow(g, x, y + 13, 14, 3.5, 0.45)
    // The wind-up key behind it: spins steadily while walking, a blur while rewinding.
    const spin = this.tick * (rewinding ? 0.5 : 0.12) + f.seed
    const kw = Math.max(1, Math.round(Math.abs(Math.cos(spin)) * 8))
    g.fillStyle = INK
    g.fillRect(x - 1, y - 26, 3, 8)
    g.fillStyle = RAMPS.gold[2]
    g.fillRect(x, y - 25, 1, 7)
    for (const side of [-1, 1]) {
      const lx = side < 0 ? x - kw : x + 1
      g.fillStyle = INK
      g.fillRect(lx - 1, y - 30, kw + 2, 7)
      g.fillStyle = RAMPS.gold[3]
      g.fillRect(lx, y - 29, kw, 5)
      g.fillStyle = RAMPS.gold[4]
      g.fillRect(lx, y - 29, kw, 1)
    }
    // Legs, stamping in turn.
    const leg = (dx: number, up: number) =>
      bevel(g, x + dx, y + 4 - up * 2, 6, 9, RAMPS.steel, { depth: 1 })
    leg(-8, Math.max(0, lift))
    leg(2, Math.max(0, -lift))
    // Arms swing opposite the legs.
    bevel(g, x - 15, y - 12 + lift, 4, 12, RAMPS.steel, { depth: 1 })
    bevel(g, x + 11, y - 12 - lift, 4, 12, RAMPS.steel, { depth: 1 })
    // The tin body: red paint, rivets, a gold panel.
    bevel(g, x - 11, y - 14, 22, 19, RAMPS.rust, { depth: 2 })
    g.fillStyle = RAMPS.rust[4]
    for (const [rx, ry] of [
      [-9, -12],
      [8, -12],
      [-9, 2],
      [8, 2],
    ] as const)
      g.fillRect(x + rx, y + ry, 1, 1)
    bevel(g, x - 5, y - 9, 10, 8, RAMPS.gold, { depth: 1 })
    g.fillStyle = RAMPS.gold[1]
    g.fillRect(x - 3, y - 6, 6, 1)
    g.fillRect(x - 3, y - 4, 6, 1)
    // The head and its visor: eyes dim while it rewinds.
    bevel(g, x - 8, y - 25, 16, 11, RAMPS.steel, { depth: 2 })
    g.fillStyle = INK
    g.fillRect(x - 6, y - 22, 12, 5)
    const eye = rewinding ? RAMPS.ember[1] : RAMPS.ember[3]
    g.fillStyle = eye
    g.fillRect(x - 5, y - 21, 3, 2)
    g.fillRect(x + 2, y - 21, 3, 2)
    if (!rewinding) glow(g, x, y - 20, 12, RAMPS.ember[3], 0.35)
    if (rewinding) {
      // Click, click: the rewind shows as little ticks off the key.
      const t = STOMP_REWIND - f.clock
      if (t % 10 < 5) {
        drawText(g, 'CLICK', x, y - 40, {
          align: 'center',
          color: RAMPS.gold[3],
          outline: INK,
        })
      }
    } else if (beat === 0 || beat === 10) {
      // A stomp puffs dust off the floor.
      this.burst(x + (beat ? 5 : -5), y + 12, 2, [
        RAMPS.steel[3],
        RAMPS.steel[2],
      ])
    }
  }

  /** The hypno: a brain-dome bot whose swirly eyes turn; it pulses rings while in its trance. */
  private renderHypno(g: CanvasRenderingContext2D, f: Foe) {
    const x = Math.round(f.x)
    const y = Math.round(f.y + Math.sin(this.tick / 10 + f.seed) * 1.5)
    const trance = f.mode === 1
    dropShadow(g, f.x, f.y + 11, 9, 2.5, 0.4)
    glow(g, x, y - 4, trance ? 26 : 16, GLITCH[3], trance ? 0.55 : 0.3)
    if (trance) {
      g.save()
      g.globalCompositeOperation = 'lighter'
      for (let k = 0; k < 2; k++) {
        const t = (this.tick / 24 + k / 2) % 1
        g.globalAlpha = 1 - t
        g.strokeStyle = GLITCH[3]
        g.beginPath()
        g.arc(x, y - 2, 6 + t * 22, 0, Math.PI * 2)
        g.stroke()
      }
      g.restore()
    }
    // The saucer base.
    g.fillStyle = INK
    g.beginPath()
    g.ellipse(x, y + 5, 11, 5, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = RAMPS.steel[2]
    g.beginPath()
    g.ellipse(x, y + 4, 10, 4, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = RAMPS.steel[4]
    g.fillRect(x - 6, y + 2, 8, 1)
    // The brain dome, folds and all.
    shadedOrb(g, x, y - 4, 9, GLITCH)
    g.strokeStyle = GLITCH[1]
    g.lineWidth = 1
    for (const [ax, ay, r, s] of [
      [-3, -8, 3, 0],
      [3, -7, 3, 2],
      [0, -3, 4, 3.5],
    ] as const) {
      g.beginPath()
      g.arc(x + ax, y + ay, r, s, s + 2.4)
      g.stroke()
    }
    // The face band and the swirly eyes.
    g.fillStyle = INK
    g.fillRect(x - 8, y - 2, 16, 6)
    for (const side of [-1, 1]) {
      const ex = x + side * 4
      const ey = y + 1
      g.fillStyle = '#ffffff'
      g.fillRect(ex - 2, ey - 2, 5, 5)
      const a = (this.tick / 5) * side
      g.fillStyle = GLITCH[2]
      for (let k = 0; k < 3; k++) {
        const r = 0.6 + k * 0.7
        g.fillRect(
          Math.round(ex + Math.cos(a + k * 2.1) * r),
          Math.round(ey + Math.sin(a + k * 2.1) * r),
          1,
          1,
        )
      }
    }
  }

  private renderSpawner(g: CanvasRenderingContext2D, f: Foe) {
    // It throbs, so it is a shaded vector gem rather than a pixel sprite.
    const r = 11 + Math.sin(f.timer / 8) * 1.8
    const x = f.x
    const y = f.y
    const ramp = RAMPS.purple
    glow(g, x, y, r + 14, ramp[3], 0.45)
    dropShadow(g, x, y + 15, 8, 2, 0.3)
    const diamond = (k: number, colour: string) => {
      g.fillStyle = colour
      g.beginPath()
      g.moveTo(x, y - k)
      g.lineTo(x + k, y)
      g.lineTo(x, y + k)
      g.lineTo(x - k, y)
      g.closePath()
      g.fill()
    }
    diamond(r + 1.5, INK)
    diamond(r, ramp[2])
    // Lit upper-left facet, shadowed lower-right facet.
    g.fillStyle = ramp[3]
    g.beginPath()
    g.moveTo(x, y - r)
    g.lineTo(x - r, y)
    g.lineTo(x, y)
    g.closePath()
    g.fill()
    g.fillStyle = ramp[1]
    g.beginPath()
    g.moveTo(x, y + r)
    g.lineTo(x + r, y)
    g.lineTo(x, y)
    g.closePath()
    g.fill()
    g.fillStyle = ramp[0]
    g.beginPath()
    g.moveTo(x, y + r)
    g.lineTo(x + r * 0.5, y + r * 0.5)
    g.lineTo(x, y + r * 0.6)
    g.closePath()
    g.fill()
    g.fillStyle = ramp[4]
    g.fillRect(Math.round(x - r * 0.5), Math.round(y - r * 0.5), 2, 1)
    shadedOrb(g, x, y, 3, RAMPS.gold)
    glow(g, x, y, 7, RAMPS.gold[3], 0.5)
    // Glitch shards orbit it.
    for (let i = 0; i < 3; i++) {
      const a = f.timer / 14 + (i * Math.PI * 2) / 3
      const ox = Math.round(x + Math.cos(a) * (r + 7))
      const oy = Math.round(y + Math.sin(a) * (r + 7))
      g.fillStyle = INK
      g.fillRect(ox - 1, oy - 1, 3, 3)
      g.fillStyle = i % 2 ? RAMPS.teal[3] : RAMPS.ember[3]
      g.fillRect(ox, oy, 1, 1)
    }
  }

  private renderPuddle(g: CanvasRenderingContext2D, f: Foe) {
    const on = (this.tick + f.seed * 10) % 30 < 20
    const x = f.x
    const y = f.y
    const ramp = on ? LIME : ([INK, LIME[0], LIME[1], LIME[2], LIME[3]] as Ramp)
    const blob = (dx: number, dy: number, rx: number, ry: number) => {
      g.beginPath()
      g.ellipse(x + dx, y + dy, rx, ry, 0, 0, Math.PI * 2)
      g.fill()
    }
    if (on) glow(g, x, y, 14, LIME[3], 0.3)
    g.fillStyle = INK
    blob(0, 0, 9, 6.5)
    g.fillStyle = ramp[1]
    blob(0, 0, 8, 5.5)
    g.fillStyle = ramp[2]
    blob(-1, -0.5, 6, 4)
    g.fillStyle = ramp[3]
    blob(-2, -1.5, 3, 1.8)
    g.fillStyle = INK
    blob(1.5, 1, 2.5, 1.5)
    // Bubbles pop on the surface while it is live.
    if (on) {
      const b = Math.floor((this.tick + f.seed * 7) / 5) % 4
      g.fillStyle = LIME[4]
      g.fillRect(Math.round(x) - 4 + b * 2, Math.round(y) - 2 + (b % 2), 1, 1)
      g.fillStyle = LIME[3]
      g.fillRect(Math.round(x) + 3 - b, Math.round(y) + 2, 1, 1)
    }
  }

  private renderRescuee(g: CanvasRenderingContext2D, r: Rescuee) {
    const moving = Math.abs(r.vx) + Math.abs(r.vy) > 0.05
    const bob = moving ? Math.abs(Math.sin(this.tick / 6 + r.id)) * 1.2 : 0
    const x = r.x
    const y = r.y - bob
    const frame = moving ? Math.floor(this.tick / 7 + r.id) % 2 : 0
    const sprites = familySprites(r.kind, r.color, r.skin)
    let sprite = sprites[frame]!
    if (r.state === 'glitched') sprite = glitchTint(sprite)
    dropShadow(g, r.x, r.y + 8, 6, 1.8, 0.35)
    const jolt =
      r.state === 'glitched' && (this.tick + r.id * 7) % 41 < 3
        ? this.tick % 2
          ? 2
          : -2
        : 0
    drawSprite(g, sprite, x + jolt, y + 8, {
      anchor: 'feet',
      flipX: r.vx < 0,
    })
    const top = y - sprite.height + 6
    switch (r.state) {
      case 'calm':
        if (r.clock > 0 && Math.floor(this.tick / 4) % 2 === 0) {
          glow(g, x, top + 4, 10, RAMPS.leaf[3], 0.5)
        } else if (Math.floor((this.tick + r.id * 5) / 20) % 2 === 0) {
          glow(g, x, top - 6, 6, RAMPS.pink[3], 0.45)
          drawSprite(g, HELP_SPRITE, x, top - 6)
        }
        break
      case 'parade':
        glow(g, x, top - 5, 6, RAMPS.gold[3], 0.5)
        drawSprite(g, HEART_SPRITE, x, top - 5)
        break
      case 'dizzy':
        // Stars go round their head.
        for (let k = 0; k < 3; k++) {
          const a = this.tick / 8 + (k * Math.PI * 2) / 3
          const sx = Math.round(x + Math.cos(a) * 7)
          const sy = Math.round(top - 3 + Math.sin(a) * 2.5)
          g.fillStyle = INK
          g.fillRect(sx - 1, sy - 1, 3, 3)
          g.fillStyle = RAMPS.gold[4]
          g.fillRect(sx, sy - 1, 1, 3)
          g.fillRect(sx - 1, sy, 3, 1)
        }
        break
      case 'glitched': {
        // A swirl over their head, turning.
        glow(g, x, top - 5, 9, GLITCH[3], 0.55)
        const a = this.tick / 4
        for (let k = 0; k < 5; k++) {
          const rr = 1 + k * 0.9
          g.fillStyle = k % 2 ? GLITCH[4] : GLITCH[2]
          g.fillRect(
            Math.round(x + Math.cos(a + k * 1.3) * rr),
            Math.round(top - 5 + Math.sin(a + k * 1.3) * rr * 0.7),
            1,
            1,
          )
        }
        break
      }
    }
  }

  private renderFreed(
    g: CanvasRenderingContext2D,
    f: { x: number; y: number; life: number },
  ) {
    const fade = Math.max(0, f.life / 60)
    glow(g, f.x, f.y, 14, RAMPS.leaf[3], 0.45 * fade)
    drawSprite(g, FREED_SPRITES[Math.floor(f.life / 4) % 2]!, f.x, f.y, {
      alpha: fade,
    })
  }

  private renderRings(g: CanvasRenderingContext2D) {
    if (!this.rings.length) return
    g.save()
    g.globalCompositeOperation = 'lighter'
    for (const r of this.rings) {
      const t = 1 - r.life / 24
      g.globalAlpha = 1 - t
      g.strokeStyle = r.color
      g.lineWidth = 2
      g.beginPath()
      g.arc(r.x, r.y, 4 + t * 20, 0, Math.PI * 2)
      g.stroke()
      g.strokeStyle = RAMPS.gold[4]
      g.lineWidth = 1
      g.beginPath()
      g.arc(r.x, r.y, 2 + t * 12, 0, Math.PI * 2)
      g.stroke()
    }
    g.restore()
  }

  private renderHud(g: CanvasRenderingContext2D) {
    // Score, high score and lives sit in boxes in the strip above the rim.
    hudPanel(g, 4, 3, 96, 18)
    drawText(g, String(this.score).padStart(7, '0'), 11, 5, {
      scale: 2,
      color: RAMPS.teal[4],
      shadow: INK,
    })
    const hi = `HI ${Math.max(this.hiScore, this.score)}`
    const hiW = measureText(hi, 2) + 14
    hudPanel(g, Math.round(W / 2 - hiW / 2), 3, hiW, 18)
    drawText(g, hi, W / 2, 5, {
      scale: 2,
      align: 'center',
      color: RAMPS.gold[3],
      shadow: INK,
    })
    const lives = Math.min(this.lives, 6)
    if (lives > 0) {
      const w = lives * 17 + 5
      hudPanel(g, W - 4 - w, 3, w, 18)
      for (let i = 0; i < lives; i++) {
        drawSprite(g, HEART_SPRITE, W - 15 - i * 17, 12, { scale: 2 })
      }
    }
    // The wave and its name, the parade and the rescue multiplier sit in boxes below the rim.
    const wave = `WAVE ${this.level}  ${this.script.name}`
    hudPanel(g, 4, H - 13, measureText(wave) + 14, 11)
    drawText(g, wave, 11, H - 10, {
      color: RAMPS.purple[4],
      outline: INK,
    })
    if (this.beacon) {
      const seat = this.heroes[0]!.seat
      const n = this.parade(seat).length
      const pw = 14 + PARADE_MAX * 9
      const px = W / 2 - pw / 2 + 40
      hudPanel(g, px, H - 13, pw, 11)
      for (let i = 0; i < PARADE_MAX; i++) {
        drawSprite(g, HEART_SPRITE, px + 11 + i * 9, H - 7, {
          alpha: i < n ? 1 : 0.25,
        })
      }
    }
    const rescue = `RESCUE X${this.multiplier}`
    const rescueW = measureText(rescue)
    const panelW = rescueW + 74
    hudPanel(g, W - 4 - panelW, H - 13, panelW, 11)
    drawText(g, rescue, W - 4 - panelW + 7, H - 10, {
      color: RAMPS.leaf[3],
      outline: INK,
    })
    gauge(
      g,
      W - 63,
      H - 10,
      52,
      6,
      this.multiplier / RESCUE_CAP,
      this.multiplier >= RESCUE_CAP ? RAMPS.gold : RAMPS.leaf,
    )
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, H / 2 - 28, {
        scale: 3,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.pink[1],
      })
      if (this.banner.sub) {
        drawText(g, this.banner.sub, W / 2, H / 2 + 4, {
          scale: 2,
          align: 'center',
          color: RAMPS.leaf[3],
          outline: INK,
        })
      }
    }
  }
}

/** True when `p` lies within `reach` of the segment a-b (and between its ends). */
function onSegment(p: Point, a: Point, b: Point, reach: number) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len2 = dx * dx + dy * dy || 1
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2
  if (t < 0 || t > 1) return false
  return Math.hypot(a.x + dx * t - p.x, a.y + dy * t - p.y) < reach
}

const rescueRally: ArcadeGameModule = {
  create: (options) => new RescueRally(options),
}

export const create = rescueRally.create
export default rescueRally
