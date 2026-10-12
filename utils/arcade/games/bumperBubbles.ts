// /utils/arcade/games/bumperBubbles.ts
//
// Bumper Bubbles: The Hundred Floors of Fizzwick Tower -- the Kind Robots Arcade's
// Bubble Bobble-style riff (conductor kr-arcade/t-009 game factory; depth pass m8,
// t-059 onward, spec: conductor projects/kr-arcade/depth-pass/CABINETS.md section 7).
//
// The tower's Carbonator has broken and everything inside has gone flat and grumpy.
// Up to four bubble robots climb it floor by floor: blow a bubble to trap a grump,
// bump the bubble to pop it, and the grump tumbles out as a treat. Popping a bubble
// pops every bubble touching it, and a cluster of trapped grumps drops treats up the
// ladder from 1,000 to 64,000. Bubbles are platforms too: hold HOP as you land on one
// to bounce up it. Floors are ASCII data with air currents that steer the bubbles
// (bumperBubbles/tower.ts), a gap in the floor drops you back in through the ceiling,
// and a robot who dawdles meets Old Flat Fizz. Fizz Taps change what your bubbles
// are; F-R-I-E-N-D letters spell out an extra robot. The climb saves at every wing.
//
// Arrows move, UP or B hops, A blows a bubble.

import { levelCurve } from '../curve'
import { drawText, measureText } from '../font'
import {
  INK,
  RAMPS,
  Sparkles,
  backdropRng,
  cachedLayer,
  drawSprite,
  dropShadow,
  glow,
  hudPanel,
  rgba,
  vignette,
} from '../snes'
import type { MusicLoop } from '../sound'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  ArcadeGuidePage,
  InputFrame,
} from '../types'
import { emptyInput } from '../types'
import {
  ANGRY_FRAMES,
  FLAT_FIZZ,
  FLAVOUR_RAMPS,
  GRUMP_FRAMES,
  GRUMP_RAMPS,
  THEMES,
  TREAT_SPRITES,
  paintBackdrop,
  paintCurrents,
  paintSky,
  paintTiles,
  robotSprites,
  tapSprite,
} from '../bumperBubbles/art'
import {
  GRUMPS,
  GRUMP_LETTERS,
  grumpCentre,
  harmful,
  makeGrump,
  updateGrump,
} from '../bumperBubbles/grumps'
import type { Grump, GrumpKind } from '../bumperBubbles/grumps'
import { HURRY_MUSIC, MUSIC } from '../bumperBubbles/music'
import {
  FLOOR_Y,
  H,
  JUMP_V,
  TOP,
  W,
  WALL_L,
  WALL_R,
  currentAt,
  groundBelow,
  route,
  solidAt,
  segmentUnder,
  slide,
  stepBody,
} from '../bumperBubbles/tower'
import type { Body, Flavour, Floor, Ledge } from '../bumperBubbles/tower'
import {
  FLOORS_PER_WING,
  WINGS,
  floorPlan,
  parsedFloor,
  wingStarting,
} from '../bumperBubbles/wings'
import type { FloorPlan, WingDef } from '../bumperBubbles/wings'

export { BUILT_FLOORS, WINGS, floorPlan } from '../bumperBubbles/wings'

/** How the tower's pace climbs with the floor: it keeps rising all the way to floor 100. */
export const TOWER_CURVES = {
  /** Base walk speed in px a tick. */
  speed: { start: 0.52, step: 0.006, limit: 1.12 },
  /** Base chance a tick that a walker hops. */
  hop: { start: 0.004, step: 0.0001, limit: 0.014 },
  /** Ticks a bubble holds a grump before it bursts free. */
  hold: { start: 540, step: -3, limit: 250 },
} as const

/** Treats for a cluster pop: the first grump's treat, the second's, ... the seventh's. */
export const TREAT_LADDER = [
  1000, 2000, 4000, 8000, 16000, 32000, 64000,
] as const
export const FRIEND = 'FRIEND'
export const START_LIVES = 3
/** The floor timer: HURRY! at 25 s, Old Flat Fizz at 30 s. */
export const HURRY_WARN = 1500
export const HURRY_TICKS = 1800
/** A floor cleared this fast pays SPEEDY. */
export const SPEEDY_TICKS = 1200
/** Gum ledges hang this long. */
export const GUM_TICKS = 600
export const MAX_GUM = 8
export const EMPTY_LIFE = 480
export const LETTER_LIFE = 1200
export const BUBBLE_R = 7
export const EXTRA_FIRST = 100_000
export const EXTRA_EVERY = 200_000

const READY_TICKS = 70
const CARD_TICKS = 220
const CLEAR_TICKS = 180
const CLIMB_TICKS = 96
const DEATH_TICKS = 90
const INVULN_TICKS = 120
const OVER_TICKS = 110
const SHOT_COOLDOWN = 14
const SHOT_RANGE = 24
const SHOT_SPEED = 3.2
const WALK = 1.3
const ROBOT_HALF = 5

export type Robot = Body & {
  seat: number
  face: -1 | 1
  cooldown: number
  flavour: Flavour
  /** Ticks until a bonked robot comes back (0 while it plays). */
  down: number
  /** Out of the climb (no robots left to send back in). */
  out: boolean
  invuln: number
  /** Bubbles ridden in a row without touching a block. */
  rides: number
}

export type Bubble = {
  x: number
  y: number
  vx: number
  age: number
  /** Ticks of the shot's flight left before it starts to float. */
  flight: number
  held: Grump | null
  holdLeft: number
  flavour: Flavour
  /** Ticks a stuck gum bubble still hangs as a ledge (0 when it isn't stuck). */
  stuck: number
  /** A letter of FRIEND, or null. */
  letter: string | null
  owner: number
}

export type Treat = Body & { tier: number; value: number; spin: boolean }

export type FlatFizz = { x: number; y: number; t: number; leaving: boolean }

type Particle = {
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
  color: string
}

type Phase = 'card' | 'ready' | 'play' | 'clear' | 'climb'

/** A Bumper Bubbles save: the wing the climb got to, and what it carried. */
export type BumperSave = {
  v: 1
  /** The wing to resume at (its first floor). */
  wing: number
  /** The score when the wing began (a continue keeps half). */
  score: number
  /** FRIEND letters held. */
  letters: string
}

/** A stored save, checked against this build; null when unusable. */
export function readBumperSave(raw: unknown): BumperSave | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (r.v !== 1) return null
  const int = (v: unknown, lo: number, hi: number) =>
    typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi
  if (!int(r.wing, 2, WINGS.length) || !int(r.score, 0, 249_999_999))
    return null
  const letters = typeof r.letters === 'string' ? r.letters : ''
  if (
    letters.length > FRIEND.length ||
    [...letters].some(
      (ch, i) => !FRIEND.includes(ch) || letters.indexOf(ch) !== i,
    )
  )
    return null
  return { v: 1, wing: r.wing as number, score: r.score as number, letters }
}

/** The first floor of wing n. */
export function wingFirstFloor(n: number): number {
  return (n - 1) * FLOORS_PER_WING + 1
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
  private seats: number

  private tick = 0
  private plan!: FloorPlan
  private floor!: Floor
  private phase: Phase = 'ready'
  private phaseTicks = 0
  private roundTicks = 0
  private robots: Robot[] = []
  private grumps: Grump[] = []
  private bubbles: Bubble[] = []
  private treats: Treat[] = []
  private fizz: FlatFizz | null = null
  private letters = new Set<string>()
  private letterAt = -1
  /** Treat-ladder rungs added this floor (a FRIEND spelling raises the next floor's). */
  private boost = 0
  private nextBoost = 0
  private nextExtra = EXTRA_FIRST
  private lostThisWing = false
  private climbFrom: {
    map: number
    theme: string
    robots: Array<{ x: number; y: number }>
  } | null = null
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null
  private offer: BumperSave | null = null
  private saveData: BumperSave | null = null
  private overTimer = 0
  private pilotMemo = {
    lastX: 0,
    still: 0,
    wander: 1 as -1 | 1,
    aim: null as number | null,
  }
  // Cosmetic sparkles roll their own dice, so the game's seeded rng is untouched.
  private fx = new Sparkles()
  private fxRng = backdropRng(71)

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.seats = this.demo
      ? 1
      : Math.max(1, Math.min(4, Math.floor(options.players ?? 1)))
    this.lives = START_LIVES + this.seats - 1
    this.robots = Array.from({ length: this.seats }, (_, seat) => ({
      seat,
      x: 0,
      y: FLOOR_Y,
      vx: 0,
      vy: 0,
      onGround: true,
      face: seat % 2 ? -1 : 1,
      cooldown: 0,
      flavour: 'classic',
      down: 0,
      out: false,
      invuln: 0,
      rides: 0,
    }))
    const stored = this.demo ? null : readBumperSave(options.resume)
    this.startFloor(1)
    if (stored) {
      this.offer = stored
      this.saveData = stored
    }
  }

  get save(): BumperSave | null | undefined {
    return this.demo ? undefined : this.saveData
  }

  get music(): MusicLoop | null {
    if (this.over || this.offer) return null
    const id = this.plan.wing.music
    return this.roundTicks >= HURRY_WARN && this.phase === 'play'
      ? HURRY_MUSIC[id]!
      : MUSIC[id]!
  }

  private get wing(): WingDef {
    return this.plan.wing
  }

  // --- the climb ---------------------------------------------------------------------------------

  private startFloor(n: number) {
    this.level = n
    this.plan = floorPlan(n)
    this.floor = parsedFloor(this.plan.map)
    this.bubbles = []
    this.treats = []
    this.fizz = null
    this.roundTicks = 0
    this.boost = this.nextBoost
    this.nextBoost = 0
    this.grumps = this.floor.spawns.map((s) =>
      makeGrump(GRUMP_LETTERS[s.letter]!, s, this.rng),
    )
    this.letterAt = this.rng() < 0.7 ? 360 + Math.floor(this.rng() * 900) : -1
    for (const r of this.robots) this.placeRobot(r)
    const wing = wingStarting(n)
    if (wing) {
      this.lostThisWing = false
      if (n > 1 && !this.demo)
        this.saveData = {
          v: 1,
          wing: wing.n,
          score: Math.min(249_999_999, this.score),
          letters: [...FRIEND].filter((ch) => this.letters.has(ch)).join(''),
        }
      this.setPhase('card')
    } else this.setPhase('ready')
  }

  private resumeFrom(s: BumperSave) {
    this.score = Math.floor(s.score / 2)
    this.nextExtra =
      this.score < EXTRA_FIRST
        ? EXTRA_FIRST
        : EXTRA_FIRST +
          (Math.floor((this.score - EXTRA_FIRST) / EXTRA_EVERY) + 1) *
            EXTRA_EVERY
    this.letters = new Set(s.letters)
    this.startFloor(wingFirstFloor(s.wing))
    // The wing's save stays as it was: a quit straight after a continue doesn't halve it again.
    this.saveData = s
  }

  private setPhase(phase: Phase) {
    this.phase = phase
    this.phaseTicks = 0
  }

  private placeRobot(r: Robot) {
    const start = this.floor.starts[r.seat]!
    r.x = start.x
    r.y = start.y
    r.vx = 0
    r.vy = 0
    r.onGround = true
    r.face = start.x > W / 2 ? -1 : 1
    r.cooldown = 0
    r.rides = 0
  }

  private active(r: Robot) {
    return !r.out && r.down === 0
  }

  // --- update ------------------------------------------------------------------------------------

  update(input: InputFrame, players?: InputFrame[]) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    if (this.offer) {
      if (input.pressed.a || input.pressed.start) {
        const s = this.offer
        this.offer = null
        this.resumeFrom(s)
      } else if (input.pressed.b) {
        // A new climb from the ground floor; the save stays until the next wing.
        this.offer = null
      }
      return
    }
    const frames = this.robots.map((r) =>
      this.demo
        ? this.pilot(r)
        : (players?.[r.seat] ?? (r.seat === 0 ? input : emptyInput())),
    )
    this.phaseTicks++
    if (this.robots.every((r) => r.out)) {
      if (++this.overTimer > OVER_TICKS) this.over = true
      this.updateWorld(false)
      return
    }
    switch (this.phase) {
      case 'card': {
        const skip =
          this.phaseTicks > 40 &&
          frames.some((f) => f.pressed.a || f.pressed.start)
        if (skip || this.phaseTicks >= CARD_TICKS) this.setPhase('ready')
        return
      }
      case 'ready':
        if (this.phaseTicks === 1)
          this.banner = {
            text: `FLOOR ${this.level}`,
            sub: this.floor.name,
            ticks: READY_TICKS + 30,
          }
        if (this.phaseTicks >= READY_TICKS) this.setPhase('play')
        return
      case 'climb':
        if (this.phaseTicks >= CLIMB_TICKS) {
          this.climbFrom = null
          this.setPhase(wingStarting(this.level) ? 'card' : 'ready')
        }
        return
      case 'clear':
        this.updateRobots(frames)
        this.updateWorld(false)
        this.collectTreats()
        if (this.phaseTicks >= CLEAR_TICKS) this.climb()
        return
      case 'play':
        this.play(frames)
    }
  }

  private play(frames: InputFrame[]) {
    this.roundTicks++
    if (this.roundTicks === HURRY_WARN) {
      this.banner = { text: 'HURRY!', ticks: 90 }
      this.sound.play('warn')
    }
    if (this.roundTicks === HURRY_TICKS) {
      this.fizz = { x: W / 2, y: TOP + 6, t: 0, leaving: false }
      this.sound.play('warn')
    }
    if (this.roundTicks === this.letterAt) this.spawnLetter()
    this.updateRobots(frames)
    this.updateWorld(true)
    this.checkHits()
    if (
      this.grumps.length === 0 &&
      !this.bubbles.some((b) => b.held) &&
      this.robots.some((r) => this.active(r))
    ) {
      const speedy = this.roundTicks < SPEEDY_TICKS
      this.banner = {
        text: 'FLOOR CLEAR',
        sub: speedy ? 'SPEEDY!' : undefined,
        ticks: CLEAR_TICKS - 20,
      }
      if (speedy) this.addScore(2000 * this.wing.n)
      if (this.fizz) this.fizz.leaving = true
      this.sound.play('level')
      const lead = this.robots.find((r) => this.active(r))!
      this.fx.burst(lead.x, lead.y - 8, this.fxRng, { count: 24, speed: 2.4 })
      this.setPhase('clear')
    }
  }

  /** The floor scrolls away and the next one rises into place, robots riding bubbles to their starts. */
  private climb() {
    const from = {
      map: this.plan.map,
      theme: this.wing.theme,
      robots: this.robots.map((r) => ({ x: r.x, y: r.y })),
    }
    for (const r of this.robots) {
      if (r.down > 0) {
        r.down = 0
        if (!this.respawnAllowed(r)) r.out = true
      }
    }
    this.startFloor(this.level + 1)
    this.climbFrom = from
    this.setPhase('climb')
  }

  // --- robots ------------------------------------------------------------------------------------

  private gumLedges(): Ledge[] {
    return this.bubbles
      .filter((b) => b.stuck > 0)
      .map((b) => ({ x: b.x, top: b.y - BUBBLE_R + 1, half: BUBBLE_R }))
  }

  private updateRobots(frames: InputFrame[]) {
    const ledges = this.gumLedges()
    for (const r of this.robots) {
      if (r.out) continue
      if (r.down > 0) {
        if (--r.down === 0) {
          if (this.respawnAllowed(r)) {
            this.placeRobot(r)
            r.invuln = INVULN_TICKS
          } else r.out = true
        }
        continue
      }
      const f = frames[r.seat]!
      if (r.invuln > 0) r.invuln--
      let dir = 0
      if (f.held.left) dir -= 1
      if (f.held.right) dir += 1
      r.vx = dir * WALK
      if (dir !== 0) r.face = dir < 0 ? -1 : 1
      if ((f.pressed.up || f.pressed.b) && r.onGround) {
        r.vy = JUMP_V
        r.onGround = false
        this.sound.play('blip')
      }
      const step = stepBody(this.floor, r, ROBOT_HALF, { ledges })
      if (step.sprang) this.sound.play('blip')
      if (r.onGround && !step.ledge) r.rides = 0
      if (r.cooldown > 0) r.cooldown--
      if (f.pressed.a && r.cooldown === 0 && this.phase === 'play') {
        r.cooldown = SHOT_COOLDOWN
        this.bubbles.push({
          x: r.x + r.face * 9,
          y: r.y - 9,
          vx: r.face * SHOT_SPEED,
          age: 0,
          flight: SHOT_RANGE,
          held: null,
          holdLeft: 0,
          flavour: r.flavour,
          stuck: 0,
          letter: null,
          owner: r.seat,
        })
        this.sound.play('shoot')
      }
      this.touchTap(r)
      this.touchBubbles(r, f.held.up || f.held.b)
    }
  }

  /** A bonked robot comes back if there is a robot to spare for it (lives are shared). */
  private respawnAllowed(r: Robot) {
    const others = this.robots.filter((o) => o !== r && this.active(o)).length
    return this.lives > others
  }

  private touchTap(r: Robot) {
    const tap = this.floor.tap
    const flavour = this.floor.flavour
    if (!tap || !flavour || r.flavour === flavour) return
    if (Math.abs(r.x - tap.x) < 8 && Math.abs(r.y - tap.y) < 10) {
      r.flavour = flavour
      this.banner = {
        text: `${flavour.toUpperCase()} BUBBLES!`,
        sub: flavour === 'gum' ? 'THEY STICK TO WALLS' : undefined,
        ticks: 100,
      }
      this.sound.play('extra')
      const ramp = FLAVOUR_RAMPS[flavour]
      this.fx.burst(tap.x, tap.y - 8, this.fxRng, {
        count: 14,
        colours: [ramp[4], ramp[3], ramp[2]],
      })
    }
  }

  /** Bump a bubble to pop it (and everything touching it); hold HOP as you land on one to ride it. */
  private touchBubbles(r: Robot, hopHeld: boolean) {
    for (const b of [...this.bubbles]) {
      if (b.flight > 0 || b.stuck > 0 || !this.bubbles.includes(b)) continue
      if (
        Math.abs(b.x - r.x) >= BUBBLE_R + ROBOT_HALF ||
        Math.abs(b.y - (r.y - 7)) >= BUBBLE_R + 7
      )
        continue
      if (hopHeld && r.vy >= 0 && r.y <= b.y - 2) {
        r.y = b.y - BUBBLE_R
        r.vy = JUMP_V * 0.95
        r.onGround = false
        r.rides++
        b.y = Math.min(FLOOR_Y - BUBBLE_R, b.y + 2)
        this.sound.play('blip')
        continue
      }
      this.popCluster(b, r.seat)
    }
  }

  // --- bubbles -----------------------------------------------------------------------------------

  /** Pop a bubble and every bubble touching it, and every one touching those. */
  private popCluster(start: Bubble, seat: number) {
    const cluster = [start]
    for (let i = 0; i < cluster.length; i++) {
      const a = cluster[i]!
      for (const b of this.bubbles) {
        if (cluster.includes(b) || b.flight > 0) continue
        if (Math.hypot(a.x - b.x, a.y - b.y) < BUBBLE_R * 2 + 3) cluster.push(b)
      }
    }
    this.bubbles = this.bubbles.filter((b) => !cluster.includes(b))
    let caught = 0
    for (const b of cluster) {
      if (b.held) {
        const tier = Math.min(TREAT_LADDER.length - 1, this.boost + caught)
        caught++
        this.dropTreat(b, tier)
      } else if (b.letter) {
        this.collectLetter(b)
      } else {
        this.addScore(10)
        this.burst(b.x, b.y, 5, RAMPS.water[3])
      }
    }
    if (caught > 0) {
      this.sound.play('boom')
      if (caught > 1) {
        this.floaters.push({
          x: start.x,
          y: start.y - 12,
          text: `${caught} POP!`,
          life: 60,
          color: RAMPS.pink[3],
        })
      }
      this.fx.burst(start.x, start.y, this.fxRng, {
        count: 6 + caught * 4,
        speed: 1.3 + caught * 0.3,
      })
    } else this.sound.play('pop')
    void seat
  }

  private dropTreat(b: Bubble, tier: number) {
    const g = b.held!
    const ramp = GRUMP_RAMPS[g.kind]
    this.burst(b.x, b.y, 12, ramp[2])
    this.treats.push({
      x: b.x,
      y: b.y + 4,
      vx: (this.rng() - 0.5) * 2.4,
      vy: -2.6 - this.rng() * 1.2,
      onGround: false,
      tier,
      value: TREAT_LADDER[tier]!,
      spin: true,
    })
  }

  private collectLetter(b: Bubble) {
    const ch = b.letter!
    this.letters.add(ch)
    this.addScore(500, b.x, b.y)
    this.sound.play('pickup')
    this.fx.burst(b.x, b.y, this.fxRng, {
      count: 12,
      colours: [RAMPS.gold[4], RAMPS.pink[3], '#ffffff'],
    })
    if ([...FRIEND].every((c) => this.letters.has(c))) {
      this.letters.clear()
      this.lives++
      this.nextBoost = Math.min(TREAT_LADDER.length - 1, this.nextBoost + 1)
      this.banner = { text: 'FRIEND!', sub: 'AN EXTRA ROBOT', ticks: 120 }
      this.sound.play('extra')
    }
  }

  private spawnLetter() {
    const left = [...FRIEND].filter((c) => !this.letters.has(c))
    const letter = left[Math.floor(this.rng() * left.length)] ?? 'F'
    const fromLeft = this.rng() < 0.5
    this.bubbles.push({
      x: fromLeft ? WALL_L + BUBBLE_R : WALL_R - BUBBLE_R,
      y: TOP + 48 + Math.floor(this.rng() * 120),
      vx: fromLeft ? 0.9 : -0.9,
      age: 0,
      flight: 70,
      held: null,
      holdLeft: 0,
      flavour: 'classic',
      stuck: 0,
      letter,
      owner: -1,
    })
  }

  private updateBubbles(live: boolean) {
    const hold = Math.round(levelCurve(this.level, TOWER_CURVES.hold))
    const released: Grump[] = []
    const gone = new Set<Bubble>()
    const r = BUBBLE_R - 1
    for (const b of this.bubbles) {
      b.age++
      if (b.stuck > 0) {
        if (--b.stuck === 0) {
          gone.add(b)
          this.burst(b.x, b.y, 6, RAMPS.pink[3])
        }
        continue
      }
      if (b.flight > 0) {
        b.flight--
        const hit = slide(this.floor, b, b.vx, 0, r)
        if (hit.x || b.x <= WALL_L + r || b.x >= WALL_R - r) {
          if (b.flavour === 'gum' && !b.held && !b.letter) this.stick(b)
          b.flight = 0
        }
        if (b.flight === 0) b.vx = 0
      } else {
        const speed = b.held ? 0.32 : b.letter ? 0.4 : 0.5
        const cur = currentAt(this.floor, b.x, b.y)
        let dx = cur ? cur.x * speed : Math.sin((b.age + b.x) / 18) * 0.25
        const dy = cur ? cur.y * speed : -speed
        const hit = slide(this.floor, b, dx, dy, r)
        if (hit.y && dy < 0) {
          if (b.flavour === 'gum' && !b.held && !b.letter) this.stick(b)
          else {
            // Pinned under a ceiling: drift toward the floor's gathering point.
            const toward = this.floor.gather - b.x
            dx = Math.abs(toward) > 2 ? Math.sign(toward) * 0.35 : 0
            if (dx) slide(this.floor, b, dx, 0, r)
          }
        }
      }
      if (b.held) {
        b.holdLeft--
        if (b.holdLeft === 60) this.sound.play('warn')
        if (b.holdLeft <= 0) {
          const g = b.held
          g.x = b.x
          g.y = g.state === 'fly' ? b.y : b.y + 6
          g.vx = 0
          g.vy = 0
          g.angry = true
          g.onGround = false
          if (g.state === 'hidden' || g.state === 'rise') g.state = 'walk'
          released.push(g)
          gone.add(b)
          this.burst(b.x, b.y, 8, '#e0f2fe')
        }
      } else if (b.letter ? b.age > LETTER_LIFE : b.age > EMPTY_LIFE) {
        gone.add(b)
        this.burst(b.x, b.y, 5, RAMPS.water[4])
      }
    }
    // Floating bubbles jostle apart, so a crowd packs into a touching cluster.
    const floating = this.bubbles.filter(
      (b) => !gone.has(b) && b.flight === 0 && b.stuck === 0,
    )
    for (let i = 0; i < floating.length; i++) {
      for (let j = i + 1; j < floating.length; j++) {
        const a = floating[i]!
        const b = floating[j]!
        const d = Math.hypot(a.x - b.x, a.y - b.y)
        const min = BUBBLE_R * 2 - 1
        if (d >= min) continue
        const ux = d > 0.01 ? (a.x - b.x) / d : 1
        const uy = d > 0.01 ? (a.y - b.y) / d : 0
        const push = (min - d) / 2
        slide(this.floor, a, ux * push, uy * push, r)
        slide(this.floor, b, -ux * push, -uy * push, r)
      }
    }
    if (gone.size) this.bubbles = this.bubbles.filter((b) => !gone.has(b))
    if (released.length) {
      this.grumps.push(...released)
      this.sound.play('boom')
    }
    if (live) this.trapGrumps(hold)
  }

  private stick(b: Bubble) {
    b.stuck = GUM_TICKS
    b.flight = 0
    b.vx = 0
    this.sound.play('pop')
    const stuck = this.bubbles.filter((o) => o.stuck > 0)
    if (stuck.length > MAX_GUM) {
      const oldest = stuck.reduce((a, o) => (o.stuck < a.stuck ? o : a))
      oldest.stuck = 1
    }
  }

  private trapGrumps(hold: number) {
    for (const b of this.bubbles) {
      if (b.held || b.stuck > 0 || b.letter) continue
      for (let i = 0; i < this.grumps.length; i++) {
        const g = this.grumps[i]!
        const c = grumpCentre(g)
        if (
          Math.abs(b.x - c.x) < BUBBLE_R + 5 &&
          Math.abs(b.y - c.y) < BUBBLE_R + 6
        ) {
          this.grumps.splice(i, 1)
          b.held = g
          b.holdLeft = hold
          b.flight = 0
          b.vx = 0
          this.sound.play('pickup')
          break
        }
      }
    }
  }

  // --- the world ---------------------------------------------------------------------------------

  private updateWorld(live: boolean) {
    if (live) {
      const world = {
        floor: this.floor,
        rng: this.rng,
        speed: levelCurve(this.level, TOWER_CURVES.speed),
        hop: levelCurve(this.level, TOWER_CURVES.hop),
        robots: this.robots.filter((r) => this.active(r)),
        ledges: this.gumLedges(),
      }
      for (const g of this.grumps) updateGrump(g, world)
    }
    this.updateBubbles(live)
    for (const t of this.treats) {
      const was = t.onGround
      stepBody(this.floor, t, 4)
      if (t.onGround && !was) t.spin = false
      if (t.onGround) t.vx = 0
    }
    if (this.fizz) this.updateFizz()
  }

  private updateFizz() {
    const f = this.fizz!
    f.t++
    if (f.leaving) {
      f.y -= 1.2
      if (f.y < TOP - 20) this.fizz = null
      return
    }
    let target: Robot | null = null
    let best = Infinity
    for (const r of this.robots) {
      if (!this.active(r)) continue
      const d = Math.hypot(r.x - f.x, r.y - 7 - f.y)
      if (d < best) {
        best = d
        target = r
      }
    }
    if (!target) return
    const speed = Math.min(1.1, 0.4 + f.t / 2400)
    const dx = target.x - f.x
    const dy = target.y - 7 - f.y
    const d = Math.max(1, Math.hypot(dx, dy))
    f.x += (dx / d) * speed
    f.y += (dy / d) * speed
  }

  private collectTreats() {
    for (const r of this.robots) {
      if (!this.active(r)) continue
      this.treats = this.treats.filter((t) => {
        if (Math.abs(t.x - r.x) < 9 && Math.abs(t.y - r.y) < 12) {
          this.addScore(t.value, t.x, t.y - 10)
          this.sound.play('pickup')
          this.fx.burst(t.x, t.y - 5, this.fxRng, {
            count: 8 + t.tier * 2,
            colours: [RAMPS.gold[4], RAMPS.gold[3], '#ffffff'],
          })
          return false
        }
        return true
      })
    }
  }

  private checkHits() {
    this.collectTreats()
    for (const r of this.robots) {
      if (!this.active(r) || r.invuln > 0 || this.demo) continue
      const bonked =
        this.grumps.some(
          (g) =>
            harmful(g) &&
            Math.abs(grumpCentre(g).x - r.x) < 9 &&
            Math.abs(grumpCentre(g).y - (r.y - 7)) < 11,
        ) ||
        (!!this.fizz &&
          !this.fizz.leaving &&
          Math.abs(this.fizz.x - r.x) < 10 &&
          Math.abs(this.fizz.y - (r.y - 7)) < 12)
      if (bonked) this.bonk(r)
    }
  }

  private bonk(r: Robot) {
    r.down = DEATH_TICKS
    r.flavour = 'classic'
    r.rides = 0
    this.lives = Math.max(0, this.lives - 1)
    this.lostThisWing = true
    this.burst(r.x, r.y - 7, 14, RAMPS.teal[3])
    this.sound.play('die')
    this.banner = {
      text: this.lives > 0 ? 'BONK!' : 'GAME OVER',
      ticks: 70,
    }
    // The floor timer starts again, and Old Flat Fizz goes home.
    this.roundTicks = 0
    this.fizz = null
  }

  // --- scoring and effects -----------------------------------------------------------------------

  private addScore(points: number, x?: number, y?: number) {
    if (this.demo) return
    this.score += points
    if (x !== undefined && y !== undefined) {
      this.floaters.push({
        x,
        y,
        text: String(points),
        life: 45,
        color: RAMPS.gold[3],
      })
    }
    if (this.score >= this.nextExtra) {
      this.lives++
      this.nextExtra += EXTRA_EVERY
      this.banner = { text: 'EXTRA ROBOT!', ticks: 90 }
      this.sound.play('extra')
    }
  }

  private burst(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const a = this.fxRng() * Math.PI * 2
      const s = 0.5 + this.fxRng() * 2
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 18 + Math.floor(this.fxRng() * 14),
        color,
      })
    }
  }

  private updateEffects() {
    this.fx.update()
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

  // --- attract-mode pilot ------------------------------------------------------------------------

  /** The attract pilot (and the probes' player): pop, chase, trap, run from the Fizz. */
  private pilot(r: Robot): InputFrame {
    const frame = emptyInput()
    const { held, pressed } = frame
    if (!this.active(r) || this.phase === 'card' || this.phase === 'climb')
      return frame
    const memo = this.pilotMemo
    const go = (dx: number, dead = 3) => {
      if (dx < -dead) held.left = true
      else if (dx > dead) held.right = true
    }
    const harmfulNear = (x0: number, x1: number, y0: number, y1: number) =>
      this.grumps.some((g) => {
        if (!harmful(g)) return false
        const c = grumpCentre(g)
        return c.x > x0 && c.x < x1 && c.y > y0 && c.y < y1
      })
    /** Hop (steering for `aim`) only when nothing waits overhead to bonk into. */
    const hop = (aim: number) => {
      if (r.onGround && !harmfulNear(r.x - 18, r.x + 18, r.y - 64, r.y - 4)) {
        pressed.up = true
        memo.aim = aim
      }
    }
    const blow = (dx: number) => {
      if (Math.sign(dx) !== r.face && Math.abs(dx) > 2) go(dx, 0)
      else if (r.cooldown === 0) pressed.a = true
    }
    // Run from Old Flat Fizz.
    const fizz = this.fizz
    if (fizz && !fizz.leaving && Math.hypot(fizz.x - r.x, fizz.y - r.y) < 60) {
      // Away from it, unless that is into a corner: then duck past underneath.
      let away = r.x < fizz.x ? -1 : 1
      if (away < 0 ? r.x < WALL_L + 40 : r.x > WALL_R - 40) away = -away
      go(away, 0)
      if (fizz.y > r.y - 20) hop(r.x + away * 40)
      return frame
    }
    // A grump right beside us: blow at it point-blank, or back off while reloading.
    let threat: Grump | null = null
    for (const g of this.grumps) {
      if (!harmful(g)) continue
      const c = grumpCentre(g)
      if (Math.abs(c.x - r.x) < 30 && Math.abs(c.y - (r.y - 7)) < 18) {
        if (
          !threat ||
          Math.abs(c.x - r.x) < Math.abs(grumpCentre(threat).x - r.x)
        )
          threat = g
      }
    }
    if (threat) {
      const dx = grumpCentre(threat).x - r.x
      if (r.cooldown === 0 || Math.sign(dx) !== r.face) blow(dx)
      else go(-dx, 0)
      return frame
    }
    // Something to touch: a trapped grump, a letter, a nearby treat.
    let touch: { x: number; y: number } | null = null
    let best = Infinity
    for (const b of this.bubbles) {
      if (b.flight > 0 || b.stuck > 0 || (!b.held && !b.letter)) continue
      const d = Math.abs(b.x - r.x) + Math.abs(b.y - r.y) * 0.7
      if (d < best) {
        best = d
        touch = { x: b.x, y: b.y + BUBBLE_R + 6 }
      }
    }
    for (const t of this.treats) {
      const d = Math.abs(t.x - r.x) + Math.abs(t.y - r.y) * 0.7
      if (d < best && (d < 90 || this.grumps.length === 0)) {
        best = d
        touch = t
      }
    }
    // The nearest grump to trap.
    let prey: Grump | null = null
    let preyD = Infinity
    for (const g of this.grumps) {
      const c = grumpCentre(g)
      const d = Math.abs(c.x - r.x) + Math.abs(c.y - r.y) * 0.8
      if (d < preyD) {
        preyD = d
        prey = g
      }
    }
    if (prey && (preyD < best || !touch)) {
      const c = grumpCentre(prey)
      const dx = c.x - r.x
      const dy = c.y - (r.y - 9)
      if (Math.abs(dy) < 12 && Math.abs(dx) < 120) {
        // On our level: face it and blow.
        blow(dx)
        return frame
      }
      let open = true
      for (let y = r.y - 16; y > c.y + 6; y -= 4)
        if (solidAt(this.floor, c.x, y)) open = false
      if (open && dy < 0 && dy > -70 && Math.abs(dx) < 56) {
        // Just above: blow bubbles under it and let them rise into it.
        if (Math.abs(dx) < 12) go(-dx || memo.wander, 0)
        else blow(dx)
        return frame
      }
    }
    const goal = touch ?? (prey ? grumpCentre(prey) : null)
    if (!r.onGround) {
      // In the air: steer for where the last hop was headed.
      if (memo.aim !== null) go(memo.aim - r.x, 1)
      return frame
    }
    memo.aim = null
    if (goal) {
      const here = segmentUnder(this.floor, r.x, r.y)
      const there = segmentUnder(
        this.floor,
        goal.x,
        groundBelow(this.floor, goal.x, goal.y - 2, 4),
      )
      const way = here === there ? null : route(this.floor, here, there)
      if (way) {
        const dx = way.launch - r.x
        if (way.kind === 'up' && Math.abs(dx) < 3) hop(way.aim)
        else {
          go(dx, way.kind === 'up' ? 1 : 0)
          memo.aim = way.aim
        }
      } else {
        const dx = goal.x - r.x
        const dy = goal.y - r.y
        go(dx, touch ? 2 : 6)
        if (dy < -20 && Math.abs(dx) < 10) hop(goal.x)
      }
    } else if (this.tick % 90 === 0) memo.wander = memo.wander > 0 ? -1 : 1
    // Stuck against something: turn round and hop.
    if (Math.abs(r.x - memo.lastX) < 0.2 && (held.left || held.right)) {
      if (++memo.still > 40) {
        memo.wander = memo.wander > 0 ? -1 : 1
        memo.still = 0
        hop(r.x + memo.wander * 40)
      }
    } else memo.still = 0
    memo.lastX = r.x
    return frame
  }

  // --- render ------------------------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    const theme = THEMES[this.wing.theme]!
    cachedLayer(g, `bumper-sky-${theme.id}`, W, H, (k) => paintSky(k, theme))
    paintBackdrop(g, theme, this.tick)
    if (this.phase === 'climb' && this.climbFrom) {
      const p = this.phaseTicks / CLIMB_TICKS
      const ease = p * p * (3 - 2 * p)
      const shift = Math.round(ease * (H - TOP))
      const old = this.climbFrom
      // The floors slide under the status band, never over it.
      g.save()
      g.beginPath()
      g.rect(0, TOP, W, H - TOP)
      g.clip()
      g.save()
      g.translate(0, shift)
      this.paintStage(g, old.map, old.theme)
      g.restore()
      g.save()
      g.translate(0, shift - (H - TOP))
      this.paintStage(g, this.plan.map, this.wing.theme)
      g.restore()
      g.restore()
      this.robots.forEach((r, i) => {
        if (r.out) return
        const from = old.robots[i]!
        const x = from.x + (r.x - from.x) * ease
        const y = from.y + (r.y - from.y) * ease
        this.renderRobot(g, r, x, y)
        this.renderBubbleFilm(g, x, y - 8, 11, null)
      })
    } else {
      this.paintStage(g, this.plan.map, this.wing.theme)
      paintCurrents(g, this.floor, theme.current, this.tick)
      this.renderTap(g)
      for (const t of this.treats) this.renderTreat(g, t)
      if (this.phase !== 'card')
        for (const gr of this.grumps) this.renderGrump(g, gr)
      for (const b of this.bubbles) this.renderBubble(g, b)
      for (const r of this.robots) {
        if (!this.active(r)) continue
        if (r.invuln > 0 && Math.floor(this.tick / 4) % 2) continue
        this.renderRobot(g, r, r.x, r.y)
      }
      if (this.fizz) this.renderFizz(g, this.fizz)
    }
    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, p.life / 28)
      g.fillStyle = INK
      g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 3, 3)
      g.fillStyle = p.color
      g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 2, 2)
    }
    g.globalAlpha = 1
    this.fx.render(g)
    for (const f of this.floaters) {
      const half = measureText(f.text) / 2 + 2
      const x = Math.max(WALL_L + half, Math.min(WALL_R - half, f.x))
      drawText(g, f.text, x, f.y, {
        align: 'center',
        color: f.color,
        outline: INK,
      })
    }
    if (this.fizz && !this.fizz.leaving) {
      g.fillStyle = rgba(RAMPS.purple[1], 0.07 + 0.04 * Math.sin(this.tick / 8))
      g.fillRect(0, TOP, W, H - TOP)
    }
    vignette(g, W, H, 0.28)
    this.renderHud(g, theme.hud)
    if (this.phase === 'card' && !this.offer) this.renderCard(g)
    if (this.offer) this.renderOffer(g, this.offer)
  }

  private paintStage(
    g: CanvasRenderingContext2D,
    map: number,
    themeId: string,
  ) {
    const theme = THEMES[themeId]!
    cachedLayer(g, `bumper-floor-${map}`, W, H, (k) =>
      paintTiles(k, parsedFloor(map), theme, 97 + map * 31),
    )
  }

  private castShadow(
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    rx: number,
  ) {
    const ground = groundBelow(this.floor, x, y)
    const lift = ground - y
    if (lift > 80 || lift < 0) return
    const k = 1 - lift / 100
    dropShadow(g, x, ground, Math.max(2, rx * k), 1.5, 0.35 * k)
  }

  private renderTap(g: CanvasRenderingContext2D) {
    const tap = this.floor.tap
    const flavour = this.floor.flavour
    if (!tap || !flavour) return
    const ramp = FLAVOUR_RAMPS[flavour]
    glow(g, tap.x, tap.y - 8, 14, ramp[3], 0.3 + 0.12 * Math.sin(this.tick / 9))
    drawSprite(g, tapSprite(flavour), tap.x, tap.y, { anchor: 'feet' })
    // A drip forming at the nozzle.
    const drip = (this.tick % 50) / 50
    g.fillStyle = ramp[3]
    g.fillRect(Math.round(tap.x), Math.round(tap.y - 2 + drip * 3), 1, 2)
  }

  private renderTreat(g: CanvasRenderingContext2D, t: Treat) {
    const sprite = TREAT_SPRITES[t.tier]!
    this.castShadow(g, t.x, t.y, 4)
    if (t.tier >= 3) glow(g, t.x, t.y - 5, 12, RAMPS.gold[3], 0.3)
    if (t.spin) {
      const flip = Math.floor(this.tick / 4) % 2 === 0
      drawSprite(g, sprite, t.x, t.y, { anchor: 'feet', flipX: flip })
    } else {
      const bob = Math.round(Math.sin(this.tick / 10 + t.x) * 1.2)
      drawSprite(g, sprite, t.x, t.y + bob, { anchor: 'feet' })
    }
  }

  private renderGrump(g: CanvasRenderingContext2D, gr: Grump) {
    const set = gr.angry ? ANGRY_FRAMES[gr.kind] : GRUMP_FRAMES[gr.kind]
    if (gr.state === 'hidden' && set.flower) {
      const twitch = gr.twitch && Math.floor(this.tick / 5) % 2 ? 1 : 0
      drawSprite(g, set.flower, gr.x + twitch, gr.y + 1, { anchor: 'feet' })
      return
    }
    if (gr.state === 'fly') {
      const frame = Math.floor(this.tick / 6) % 2
      drawSprite(g, set.walk[frame]!, gr.x, gr.y, { flipX: gr.dir === -1 })
    } else {
      this.castShadow(g, gr.x, gr.y, 6)
      const rising = gr.state === 'rise'
      const moving = gr.onGround && gr.vx !== 0 && this.phase === 'play'
      const frame = moving ? Math.floor((this.tick + gr.x) / 8) % 2 : 0
      drawSprite(
        g,
        set.walk[frame]!,
        gr.x,
        gr.y + 1 + (rising ? Math.max(0, 8 - gr.t / 2) : 0),
        {
          anchor: 'feet',
          flipX: gr.dir === -1,
        },
      )
    }
    if (gr.angry) {
      glow(
        g,
        gr.x,
        gr.y - 6,
        13,
        RAMPS.ember[2],
        0.22 + 0.1 * Math.sin(this.tick / 5),
      )
    }
  }

  private renderBubbleFilm(
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
    tint: string | null,
    warn = false,
  ) {
    const wob = Math.sin((this.tick + x) / 7) * 0.06
    g.save()
    g.translate(x, y)
    g.scale(1 + wob, 1 - wob)
    const film = g.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r)
    film.addColorStop(0, 'rgba(255, 255, 255, 0.55)')
    film.addColorStop(0.45, rgba(tint ?? RAMPS.water[4], 0.12))
    if (warn) {
      film.addColorStop(0.8, rgba(RAMPS.ember[3], 0.35))
      film.addColorStop(1, rgba(RAMPS.ember[2], 0.8))
    } else {
      film.addColorStop(0.8, rgba(tint ?? RAMPS.teal[3], 0.25))
      film.addColorStop(1, rgba(tint ?? RAMPS.sky[3], 0.75))
    }
    g.fillStyle = film
    g.beginPath()
    g.arc(0, 0, r, 0, Math.PI * 2)
    g.fill()
    g.lineWidth = 1
    g.strokeStyle = INK
    g.beginPath()
    g.arc(0, 0, r + 0.5, 0, Math.PI * 2)
    g.stroke()
    g.strokeStyle = warn ? RAMPS.ember[4] : 'rgba(255, 255, 255, 0.9)'
    g.beginPath()
    g.arc(0, 0, r - 0.5, Math.PI * 0.95, Math.PI * 1.6)
    g.stroke()
    g.fillStyle = '#ffffff'
    g.fillRect(Math.round(-r * 0.55), Math.round(-r * 0.6), 2, 2)
    g.restore()
  }

  private renderBubble(g: CanvasRenderingContext2D, b: Bubble) {
    const grow = b.flight > 0 && !b.letter ? Math.min(1, 0.45 + b.age / 10) : 1
    const r = (BUBBLE_R + (b.held ? 3 : 0)) * grow
    const warn = b.held !== null && b.holdLeft < 90
    const flicker = warn && Math.floor(this.tick / 4) % 2 === 1
    const tint =
      b.letter !== null
        ? RAMPS.gold[3]
        : b.flavour === 'classic'
          ? null
          : FLAVOUR_RAMPS[b.flavour][3]
    if (b.held) {
      if (warn) glow(g, b.x, b.y, r + 9, RAMPS.ember[2], 0.4)
      const set = b.held.angry
        ? ANGRY_FRAMES[b.held.kind]
        : GRUMP_FRAMES[b.held.kind]
      const sprite =
        set.flower && b.held.state === 'hidden' ? set.flower : set.walk[0]
      const jiggle = warn ? (Math.floor(this.tick / 3) % 2 ? 1 : -1) : 0
      // Trapped grumps turn slowly round inside the film.
      drawSprite(g, sprite, b.x + jiggle, b.y + 1, {
        flipX: Math.floor((this.tick + b.age) / 24) % 2 === 1,
      })
    }
    if (b.stuck > 0) {
      this.renderGum(g, b)
      return
    }
    this.renderBubbleFilm(g, b.x, b.y, r, tint, flicker)
    if (b.letter) {
      drawText(g, b.letter, b.x + 1, b.y - 3, {
        align: 'center',
        color: RAMPS.gold[4],
        outline: INK,
      })
    }
  }

  /** A gum ledge: an opaque, chewed-flat pink blob with a flat top, blinking as it lets go. */
  private renderGum(g: CanvasRenderingContext2D, b: Bubble) {
    if (b.stuck < 90 && Math.floor(this.tick / 4) % 2) return
    const ramp = FLAVOUR_RAMPS.gum
    const x = Math.round(b.x)
    const top = Math.round(b.y - BUBBLE_R) + 1
    g.fillStyle = INK
    g.fillRect(x - 8, top, 16, 10)
    g.fillRect(x - 7, top - 1, 14, 12)
    g.fillStyle = ramp[1]
    g.fillRect(x - 7, top + 1, 14, 9)
    g.fillStyle = ramp[2]
    g.fillRect(x - 7, top, 14, 7)
    g.fillStyle = ramp[3]
    g.fillRect(x - 6, top, 9, 2)
    g.fillStyle = ramp[4]
    g.fillRect(x - 5, top, 3, 1)
    // A gum strand or two sagging underneath.
    g.fillStyle = ramp[2]
    g.fillRect(x - 3, top + 10, 1, 2 + ((b.age >> 4) % 2))
    g.fillRect(x + 4, top + 10, 1, 3)
  }

  private renderRobot(
    g: CanvasRenderingContext2D,
    r: Robot,
    x: number,
    y: number,
  ) {
    const frames = robotSprites(r.seat, r.flavour)
    if (this.phase !== 'climb') this.castShadow(g, x, y, 6)
    const still = this.phase !== 'play' && this.phase !== 'clear'
    let sprite = frames.stand
    if (r.cooldown > SHOT_COOLDOWN - 8) sprite = frames.blow
    else if (!r.onGround) sprite = frames.jump
    else if (r.vx !== 0 && !still)
      sprite = frames.run[Math.floor(this.tick / 6) % 2]!
    drawSprite(g, sprite, x, y + 1, { anchor: 'feet', flipX: r.face === -1 })
    const ramp = FLAVOUR_RAMPS[r.flavour]
    glow(
      g,
      Math.round(x),
      y - 15,
      6,
      ramp[3],
      0.4 + 0.25 * Math.sin(this.tick / 7),
    )
  }

  private renderFizz(g: CanvasRenderingContext2D, f: FlatFizz) {
    const bob = Math.sin(this.tick / 10) * 2
    const alpha = f.leaving ? 0.5 : 0.85 + 0.15 * Math.sin(this.tick / 6)
    glow(g, f.x, f.y + bob, 20, RAMPS.purple[2], 0.25)
    drawSprite(g, FLAT_FIZZ, f.x, f.y + bob, {
      flipX: Math.floor(this.tick / 30) % 2 === 1,
      alpha,
    })
  }

  private renderHud(
    g: CanvasRenderingContext2D,
    ramp: (typeof THEMES)[string]['hud'],
  ) {
    hudPanel(g, 3, 2, 78, 20, ramp)
    drawText(g, String(this.score).padStart(6, '0'), 8, 5, {
      scale: 2,
      color: RAMPS.gold[3],
      shadow: INK,
    })
    hudPanel(g, 85, 2, 80, 20, ramp)
    const shown = Math.min(this.lives, 6)
    const life = robotSprites(0, 'classic').life
    for (let i = 0; i < shown; i++)
      drawSprite(g, life, 89 + i * 11, 3, { anchor: 'topleft' })
    if (this.lives > 6)
      drawText(g, `+${this.lives - 6}`, 156, 4, {
        color: '#ffffff',
        outline: INK,
      })
    ;[...FRIEND].forEach((ch, i) => {
      const lit = this.letters.has(ch)
      drawText(g, ch, 90 + i * 8, 13, {
        color: lit ? RAMPS.gold[4] : rgba('#ffffff', 0.25),
        outline: lit ? INK : undefined,
      })
    })
    if (this.boost > 0)
      drawText(g, `X${2 ** this.boost}`, 160, 13, {
        align: 'right',
        color: RAMPS.pink[3],
        outline: INK,
      })
    const hi = `HI ${Math.max(this.hiScore, this.score)}`
    const fl = `FLOOR ${this.level}`
    const pw = Math.max(measureText(hi), measureText(fl)) + 12
    hudPanel(g, W - 3 - pw, 2, pw, 20, ramp)
    drawText(g, hi, W - 9, 4, {
      align: 'right',
      color: RAMPS.pink[3],
      outline: INK,
    })
    drawText(g, fl, W - 9, 13, {
      align: 'right',
      color: RAMPS.teal[3],
      outline: INK,
    })
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, 96, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.purple[1],
      })
      if (this.banner.sub) {
        drawText(g, this.banner.sub, W / 2, 116, {
          align: 'center',
          color: RAMPS.gold[3],
          outline: INK,
        })
      }
    }
  }

  /** A wing's title card: its name, what it teaches, its new grumps and its tap. */
  private renderCard(g: CanvasRenderingContext2D) {
    const wing = this.wing
    g.fillStyle = rgba(INK, 0.72)
    g.fillRect(0, TOP, W, H - TOP)
    hudPanel(g, 20, 44, W - 40, 168, THEMES[wing.theme]!.hud)
    drawText(
      g,
      `WING ${wing.n}  FLOORS ${wingFirstFloor(wing.n)}-${wingFirstFloor(wing.n) + 9}`,
      W / 2,
      52,
      {
        align: 'center',
        color: RAMPS.teal[3],
        outline: INK,
      },
    )
    drawText(g, wing.name, W / 2, 66, {
      scale: 2,
      align: 'center',
      color: '#ffffff',
      outline: INK,
      shadow: RAMPS.purple[1],
    })
    drawText(g, wing.motto, W / 2, 88, {
      align: 'center',
      color: RAMPS.gold[3],
      outline: INK,
    })
    drawText(g, 'NEW GRUMPS', W / 2, 104, {
      align: 'center',
      color: RAMPS.pink[3],
      outline: INK,
    })
    const kinds = wing.grumps
    const step = Math.min(56, (W - 60) / kinds.length)
    kinds.forEach((kind: GrumpKind, i) => {
      const x = W / 2 + (i - (kinds.length - 1) / 2) * step
      drawSprite(
        g,
        GRUMP_FRAMES[kind].walk[Math.floor(this.tick / 12) % 2]!,
        x,
        138,
        {
          anchor: 'feet',
        },
      )
      const name = GRUMPS[kind].name.split(' ')
      name.forEach((word, j) =>
        drawText(g, word, x, 142 + j * 9, {
          align: 'center',
          color: '#ffffff',
          outline: INK,
        }),
      )
    })
    if (wing.tap && wing.tap !== 'classic') {
      drawSprite(g, tapSprite(wing.tap), 70, 196, { anchor: 'feet' })
      drawText(g, `${wing.tap.toUpperCase()} TAP`, 82, 182, {
        color: FLAVOUR_RAMPS[wing.tap][3],
        outline: INK,
      })
      drawText(g, 'TOUCH IT TO CHANGE', 82, 191, {
        color: '#ffffff',
        outline: INK,
      })
    } else {
      drawText(g, 'POP A CLUSTER FOR BIG TREATS', W / 2, 186, {
        align: 'center',
        color: '#ffffff',
        outline: INK,
      })
    }
  }

  private renderOffer(g: CanvasRenderingContext2D, s: BumperSave) {
    g.fillStyle = rgba(INK, 0.8)
    g.fillRect(0, 0, W, H)
    hudPanel(g, 16, 64, W - 32, 112, RAMPS.purple)
    const wing = WINGS[s.wing - 1]!
    drawText(g, 'WELCOME BACK', W / 2, 74, {
      scale: 2,
      align: 'center',
      color: '#ffffff',
      outline: INK,
    })
    drawText(g, `WING ${s.wing}: ${wing.name}`, W / 2, 98, {
      align: 'center',
      color: RAMPS.teal[3],
      outline: INK,
    })
    drawText(g, `A  CONTINUE WITH ${Math.floor(s.score / 2)}`, W / 2, 124, {
      align: 'center',
      color: RAMPS.gold[3],
      outline: INK,
    })
    drawText(g, 'B  NEW CLIMB FROM FLOOR 1', W / 2, 144, {
      align: 'center',
      color: RAMPS.pink[3],
      outline: INK,
    })
  }
}

function bumperGuide(): ArcadeGuidePage[] {
  return [
    {
      title: 'FIZZWICK TOWER',
      scale: 1,
      lines: [
        'BLOW A BUBBLE (A) TO TRAP A GRUMP, THEN BUMP IT TO POP IT.',
        'POPPING ONE BUBBLE POPS EVERY BUBBLE TOUCHING IT.',
        'EACH GRUMP IN A CLUSTER DROPS A BIGGER TREAT:',
        '1,000  2,000  4,000 ... UP TO 64,000 FOR SEVEN.',
        'HOLD HOP AS YOU LAND ON A BUBBLE TO RIDE IT UP.',
        'A GAP IN THE FLOOR DROPS YOU IN THROUGH THE CEILING.',
        'STREAMERS SHOW THE AIR CURRENTS THAT STEER BUBBLES.',
        'DAWDLE 30 SECONDS AND OLD FLAT FIZZ COMES FOR YOU.',
        'SPELL F-R-I-E-N-D FOR AN EXTRA ROBOT.',
        'THE CLIMB SAVES AT EVERY WING.',
      ],
    },
    {
      title: 'THE GRUMPS',
      scale: 1,
      lines: (Object.keys(GRUMPS) as GrumpKind[]).flatMap((k) => [
        `${GRUMPS[k].name}${GRUMPS[k].tell ? `: ${GRUMPS[k].tell}` : ''}`,
        `  ${GRUMPS[k].answer}`,
      ]),
    },
    {
      title: 'FIZZ TAPS',
      scale: 1,
      lines: [
        'TOUCH A TAP TO CHANGE YOUR BUBBLE FLAVOUR',
        'UNTIL YOU LOSE A ROBOT.',
        'GUM: STICKS TO WALLS AND CEILINGS FOR TEN',
        'SECONDS, A LEDGE YOU BUILD.',
        ...WINGS.map((w) => `WING ${w.n}: ${w.name}`),
      ],
    },
  ]
}

const bumperBubbles: ArcadeGameModule = {
  create: (options) => new BumperBubbles(options),
  guide: () => bumperGuide(),
}

export const create = bumperBubbles.create
export default bumperBubbles
