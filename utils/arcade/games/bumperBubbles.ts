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
// are (gum ledges, float elevators, fizz rockets, frost bowling blocks); special
// bubbles drift in (Splash, Zap, Toasty); F-R-I-E-N-D letters spell out an extra
// robot; hidden-condition items appear when the robots have quietly earned them
// (bumperBubbles/items.ts); bosses hold floors 25, 50, 75 and 100; and a floor
// cleared without a robot lost opens a Secret Pantry with a recipe card. The climb
// saves at every wing. Wings 8-10 (t-062) add the Haunted Pantry's dark floors and the Jelly
// Mould, the Storm Rooftop's wind, rain and lightning, the Carbonator's remixes and the Grumble
// Fizz King on floor 100, and the three endings: solo, co-op and the true one (co-op with all
// five recipe cards).
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
  BOLT_TICKS,
  GRUMPS,
  GRUMP_LETTERS,
  disguised,
  grumpCentre,
  harmful,
  makeGrump,
  trappable,
  updateGrump,
} from '../bumperBubbles/grumps'
import type { Grump, GrumpKind, Hazard } from '../bumperBubbles/grumps'
import {
  BOSSES,
  bossAlive,
  bossCanBeHurt,
  bossHarms,
  bossHazards,
  bossSpecials,
  bossTouches,
  hurtBoss,
  makeBoss,
  stunBoss,
  updateBoss,
} from '../bumperBubbles/bosses'
import type { Boss, BossHost, HurtKind } from '../bumperBubbles/bosses'
import {
  CARD_SPRITE,
  DOOR_SPRITE,
  ITEM_SPRITES,
  SPECIAL_ICONS,
  SPECIAL_TINT,
  paintBolt,
  paintBoss,
  paintBossHazards,
  paintLift,
  paintLiveTiles,
  paintPushBlock,
  paintToaster,
  paintFire,
  paintHazard,
  paintIce,
  paintWater,
  paintWave,
} from '../bumperBubbles/effectsArt'
import {
  ITEMS,
  ITEM_POWER,
  UMBRELLA_SKIPS,
  earned,
  noStats,
} from '../bumperBubbles/items'
import type { ItemId, Stats } from '../bumperBubbles/items'
import {
  PANTRY_FLOORS,
  PANTRY_TICKS,
  nextPantryFloor,
  pantryFor,
} from '../bumperBubbles/pantries'
import type { PantryDef } from '../bumperBubbles/pantries'
import {
  freeze,
  noEffects,
  unleash,
  updateEffects as updateSpecials,
} from '../bumperBubbles/specials'
import type { Effects, EffectHost } from '../bumperBubbles/specials'
import {
  LAMP_RADIUS,
  LAMP_WIDE,
  paintDarkness,
  paintRain,
} from '../bumperBubbles/slice4Art'
import { HURRY_MUSIC, MUSIC } from '../bumperBubbles/music'
import {
  MENU,
  PARTY_BONUS,
  PARTY_HOLD,
  PARTY_LAST,
  clock,
  emptyStars,
  fizzClock,
  partyFloor,
  readBest,
  readStars,
  renderMenu,
  renderResult,
  selectableFloors,
  starsAt,
  starsEarned,
  trialMedal,
  trialPar,
  trialWings,
  withStars,
} from '../bumperBubbles/modes'
import type { BestTimes, ModeId } from '../bumperBubbles/modes'
import {
  FLOOR_Y,
  H,
  JUMP_V,
  TOP,
  W,
  WALL_L,
  WALL_R,
  Cell,
  currentAt,
  groundBelow,
  setDoors,
  navOf,
  parseFloor,
  reachableSegments,
  route,
  segmentKey,
  solidAt,
  segmentUnder,
  slide,
  stepBody,
} from '../bumperBubbles/tower'
import type {
  Body,
  Flavour,
  Floor,
  LiftDef,
  Ledge,
  SpecialKind,
  Spot,
} from '../bumperBubbles/tower'
import {
  BUILT_FLOORS,
  FLOORS_PER_WING,
  WINGS,
  floorPlan,
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
/** A Float bubble is big and slow. */
export const FLOAT_R = 10
/** Special bubbles drift in this often (and no more than two at once). */
export const SPECIAL_EVERY = 540
/** A Secret Pantry's door waits this long after the floor is cleared. */
export const DOOR_TICKS = 60 * 8
export const CARD_POINTS = 10_000
/** The top of the tower: clearing this floor ends the climb. */
export const TOWER_TOP = 100
/** What the endings pay, and how long each plays before the cabinet finishes. */
export const ENDING_BONUS = { solo: 50_000, coop: 100_000, true: 250_000 }
export const ENDING_TICKS = { solo: 60 * 9, coop: 60 * 12, true: 60 * 26 }
export type Ending = keyof typeof ENDING_BONUS
/** The Storm Rooftop's lightning: a flash and a tell, then a bolt down a column. */
export const STORM = { every: 330, jitter: 200, warn: 50 }
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
  /** Items kept until this robot is lost. */
  items: ItemId[]
  /** What it rides, if it stands on one: a Float bubble, or a lift. */
  on: Bubble | Lift | null
  /** Standing on ice: it slides. */
  ice: boolean
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
  /** A special bubble's kind, or null. */
  special: SpecialKind | null
  /** A Fizz shot rises: its climb speed (0 for every other bubble). */
  vy: number
  owner: number
}

/** A push block of ice: shove it and it slides until it hits something, bowling grumps over. */
export type PushBlock = Body & { sliding: boolean; dir: -1 | 1; hits: number }

/** A lift, where it is now. */
export type Lift = { def: LiftDef; x: number; w: number; top: number }

/** Hot plates: cool most of the beat, glowing (the tell), then puffing steam. */
export const HOT_PLATE = { beat: 300, glow: 200, puff: 260 } as const
/** Wind-up doors: shut, the key glints, then open for a while. */
export const WIND_DOOR = { beat: 300, tell: 160, open: 200 } as const
export const PUSH_SPEED = 2.4

/** A hidden-condition item, waiting where it appeared. */
export type Pickup = Body & { id: ItemId; t: number; skip: number }

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

type Phase = 'card' | 'ready' | 'play' | 'clear' | 'climb' | 'ending'

/** Where the last floor was, for the climb's scroll. */
type ClimbFrom = {
  key: string
  floor: Floor
  theme: string
  robots: Array<{ x: number; y: number }>
}

/** A Bumper Bubbles save: the wing the climb got to, and what it carried. */
export type BumperSave = {
  v: 1
  /** The wing to resume at (its first floor). */
  wing: number
  /** The score when the wing began (a continue keeps half). */
  score: number
  /** FRIEND letters held. */
  letters: string
  /** Recipe cards found, by their pantry's floor. */
  cards?: number[]
  /** A star digit (0-3) for each of the hundred floors. */
  stars?: string
  /** Best Time Trial ticks by wing number. */
  best?: BestTimes
}

/** A stored save, checked against this build; null when unusable. */
export function readBumperSave(raw: unknown): BumperSave | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (r.v !== 1) return null
  const int = (v: unknown, lo: number, hi: number) =>
    typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi
  if (!int(r.wing, 1, WINGS.length) || !int(r.score, 0, 249_999_999))
    return null
  const letters = typeof r.letters === 'string' ? r.letters : ''
  if (
    letters.length > FRIEND.length ||
    [...letters].some(
      (ch, i) => !FRIEND.includes(ch) || letters.indexOf(ch) !== i,
    )
  )
    return null
  const cards = r.cards === undefined ? [] : r.cards
  if (
    !Array.isArray(cards) ||
    cards.some(
      (c, i) =>
        !(PANTRY_FLOORS as readonly unknown[]).includes(c) ||
        cards.indexOf(c) !== i,
    )
  )
    return null
  const stars = readStars(r.stars)
  const best = readBest(r.best)
  if (stars === null || best === null) return null
  return {
    v: 1,
    wing: r.wing as number,
    score: r.score as number,
    letters,
    cards: cards as number[],
    stars,
    best,
  }
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
  /** How the climb ended, once floor 100 is cleared. */
  private ending: Ending | null = null
  /** Ticks to the storm's next lightning, and the flash it leaves. */
  private strikeIn = -1
  private flash = 0
  /** The wing the robots are in (a new one shows its card and saves). */
  private wingNow = 0
  private cardDue = false
  private climbFrom: ClimbFrom | null = null
  private effects: Effects = noEffects()
  private hazards: Hazard[] = []
  private boss: Boss | null = null
  private pickups: Pickup[] = []
  private stats: Stats = noStats()
  /** Items earned and not yet picked up (they wait on the next floor if missed). */
  private owed: ItemId[] = []
  /** The Clock: ticks the grumps stand frozen. */
  private frozen = 0
  private specialAt = -1
  /** Recipe cards found, by their pantry's floor. */
  private cards = new Set<number>()
  /** Inside a Secret Pantry. */
  private pantry: PantryDef | null = null
  /** The pantry door is showing on this cleared floor. */
  private door = false
  /** The recipe card waiting in this pantry. */
  private recipe: Spot | null = null
  private blocks: PushBlock[] = []
  private lifts: Lift[] = []
  private doorsOpen = false
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null
  private offer: BumperSave | null = null
  /** The mode being played, and the menu that picks it (null once begun). */
  private mode: ModeId = 'climb'
  private menu: {
    cursor: number
    floor: number
    wing: number
    board: boolean
    ticks: number
  } | null = null
  private result: { title: string; lines: string[]; ticks: number } | null =
    null
  private stars = emptyStars()
  private best: BestTimes = {}
  private lostThisFloor = false
  private trialWing = 1
  private trialTicks = 0
  private saveData: BumperSave | null = null
  private overTimer = 0
  private pilotMemo = {
    lastX: 0,
    still: 0,
    wander: 1 as -1 | 1,
    aim: null as number | null,
    touch: null as Spot | null,
    idle: 0,
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
      items: [],
      on: null,
      ice: false,
    }))
    const stored = this.demo ? null : readBumperSave(options.resume)
    this.startFloor(1)
    if (stored) {
      this.stars = stored.stars ?? emptyStars()
      this.best = { ...stored.best }
      this.saveData = stored
    }
    if (stored && stored.wing >= 2) this.offer = stored
    else if (!this.demo) this.openMenu()
  }

  get save(): BumperSave | null | undefined {
    return this.demo ? undefined : this.saveData
  }

  get music(): MusicLoop | null {
    if (this.over || this.offer || this.menu) return null
    if (this.phase === 'ending') return MUSIC.carbonator!
    if (this.boss && this.boss.state !== 'done') return MUSIC.boss!
    const id = this.plan.wing.music
    return this.roundTicks >= this.hurryClock()[0] &&
      this.phase === 'play' &&
      !this.pantry
      ? HURRY_MUSIC[id]!
      : MUSIC[id]!
  }

  private get wing(): WingDef {
    return this.plan.wing
  }

  // --- the climb ---------------------------------------------------------------------------------

  private startFloor(n: number) {
    this.menu = null
    this.lostThisFloor = false
    this.level = n
    this.plan = floorPlan(n)
    // A floor's own parse: its wind-up doors open and shut for this game alone.
    this.floor = parseFloor(this.plan.def)
    this.doorsOpen = false
    this.blocks = this.floor.pushBlocks.map((p) => ({
      x: p.x,
      y: p.y,
      vx: 0,
      vy: 0,
      onGround: true,
      sliding: false,
      dir: 1,
      hits: 0,
    }))
    this.lifts = this.floor.lifts.map((def) => ({
      def,
      x: def.c * 8,
      w: def.w * 8,
      top: TOP + def.r * 8,
    }))
    this.pantry = null
    this.recipe = null
    this.door = false
    this.bubbles = []
    this.treats = []
    this.fizz = null
    this.effects = noEffects()
    this.hazards = []
    this.pickups = []
    this.frozen = 0
    this.stats.zaps = 0
    this.roundTicks = 0
    this.flash = 0
    this.strikeIn = this.floor.storm ? STORM.every : -1
    this.boss = this.floor.boss ? makeBoss(this.floor.boss) : null
    this.boost = this.nextBoost
    this.nextBoost = 0
    this.grumps = this.floor.spawns.map((s) =>
      makeGrump(GRUMP_LETTERS[s.letter]!, s, this.rng),
    )
    this.letterAt =
      this.boss || this.rng() >= 0.7 ? -1 : 360 + Math.floor(this.rng() * 900)
    this.specialAt =
      this.floor.specials.length || this.boss
        ? 300 + Math.floor(this.rng() * 300)
        : -1
    for (const r of this.robots) this.placeRobot(r)
    // Items earned and missed wait on this floor instead.
    for (const id of this.owed) this.placePickup(id)
    const wing = this.wing
    this.cardDue = wing.n !== this.wingNow
    if (this.cardDue) {
      this.wingNow = wing.n
      this.lostThisWing = false
      // A save at the start of every wing (past the top of the built tower, the replayed
      // floors don't overwrite it; nor do the side modes, nor a Floor Select climb that starts
      // below the wing already saved).
      if (
        wing.n > 1 &&
        n <= BUILT_FLOORS &&
        (this.mode === 'climb' ||
          (this.mode === 'select' && wing.n >= (this.saveData?.wing ?? 0)))
      )
        this.writeSave(wing.n)
    }
    if (this.mode === 'party') this.bubbleEveryGrump()
    this.setPhase(this.cardDue ? 'card' : 'ready')
  }

  /** Floor 100 is cleared: how the climb ends depends on who made it and what they found. */
  private beginEnding() {
    const together = this.robots.filter((r) => !r.out).length
    const everyCard = PANTRY_FLOORS.every((f) => this.cards.has(f))
    this.ending = together >= 2 ? (everyCard ? 'true' : 'coop') : 'solo'
    this.addScore(ENDING_BONUS[this.ending])
    // The climb is won: there is no wing left to continue from, but the stars stay.
    this.saveData = null
    this.keepRecords()
    this.banner = null
    this.hazards = []
    this.grumps = []
    this.setPhase('ending')
    this.sound.play('extra')
  }

  private updateEnding(frames: InputFrame[]) {
    const kind = this.ending ?? 'solo'
    if (this.phaseTicks % 18 === 0)
      this.fx.burst(
        WALL_L + 20 + this.rng() * (WALL_R - WALL_L - 40),
        TOP + 30 + this.rng() * 90,
        this.fxRng,
        { count: 14, colours: [RAMPS.gold[4], RAMPS.pink[3], '#ffffff'] },
      )
    const skip =
      this.phaseTicks > 150 &&
      frames.some((f) => f.pressed.a || f.pressed.start)
    if (skip || this.phaseTicks >= ENDING_TICKS[kind]) this.over = true
  }

  // --- modes, menu and stars ---------------------------------------------------------------------

  private hurryClock(): [number, number] {
    return this.mode === 'fizz'
      ? fizzClock(this.level)
      : [HURRY_WARN, HURRY_TICKS]
  }

  private openMenu() {
    this.menu = { cursor: 0, floor: 1, wing: 1, board: false, ticks: 0 }
    this.banner = null
  }

  private selectMax() {
    return selectableFloors(this.stars, this.saveData?.wing ?? 1)
  }

  private trialMax() {
    return trialWings(this.stars, this.saveData?.wing ?? 1)
  }

  private updateMenu(input: InputFrame) {
    const m = this.menu!
    m.ticks++
    if (m.board) {
      if (
        m.ticks > 10 &&
        (input.pressed.a || input.pressed.b || input.pressed.start)
      )
        m.board = false
      return
    }
    if (input.pressed.up) m.cursor = (m.cursor + MENU.length - 1) % MENU.length
    if (input.pressed.down) m.cursor = (m.cursor + 1) % MENU.length
    if (input.pressed.up || input.pressed.down) this.sound.play('blip')
    const id = MENU[m.cursor]!.id
    if (id === 'select') {
      const max = this.selectMax()
      if (input.pressed.left) m.floor = m.floor <= 1 ? max : m.floor - 1
      if (input.pressed.right) m.floor = m.floor >= max ? 1 : m.floor + 1
    }
    if (id === 'trial') {
      const max = this.trialMax()
      if (input.pressed.left) m.wing = m.wing <= 1 ? max : m.wing - 1
      if (input.pressed.right) m.wing = m.wing >= max ? 1 : m.wing + 1
    }
    if (m.ticks < 8 || (!input.pressed.a && !input.pressed.start)) return
    if (id === 'stars') {
      m.board = true
      m.ticks = 0
      return
    }
    this.begin(id, id === 'select' ? m.floor : m.wing)
  }

  /** Start a mode from the menu (`arg`: the floor for Floor Select, the wing for Time Trial). */
  private begin(
    id: Exclude<(typeof MENU)[number]['id'], 'stars'>,
    arg: number,
  ) {
    this.menu = null
    this.mode = id
    this.sound.play('start')
    if (id === 'climb') {
      this.startFloor(1)
    } else if (id === 'select') {
      this.startFloor(Math.min(arg, this.selectMax()))
    } else if (id === 'party') {
      this.startFloor(partyFloor(1))
    } else if (id === 'fizz') {
      this.startFloor(1)
    } else {
      this.trialWing = Math.min(arg, this.trialMax())
      this.trialTicks = 0
      this.startFloor(wingFirstFloor(this.trialWing))
    }
  }

  /** Every grump of a Pop Party floor starts already held in a bubble. */
  private bubbleEveryGrump() {
    for (const g of this.grumps) {
      const c = grumpCentre(g)
      this.bubbles.push({
        x: c.x,
        y: c.y,
        vx: 0,
        age: 0,
        flight: 0,
        held: g,
        holdLeft: PARTY_HOLD,
        flavour: 'classic',
        stuck: 0,
        letter: null,
        special: null,
        vy: 0,
        owner: 0,
      })
    }
    this.grumps = []
  }

  /** One to three stars for the floor just cleared, kept for the climb's modes. */
  private earnStars() {
    if (this.mode === 'party' || this.mode === 'fizz') return
    const n = starsEarned({
      lost: this.lostThisFloor,
      ticks: this.roundTicks,
    })
    if (n > starsAt(this.stars, this.level)) {
      this.stars = withStars(this.stars, this.level, n)
      this.keepRecords()
    }
    // The stars take the banner's second line unless a door is waiting there.
    if (this.banner && !this.door)
      this.banner.sub = `${'*'.repeat(n)}${'-'.repeat(3 - n)}`
  }

  /** The clear is shown: on to the next floor, or the end of the mode. */
  private afterClear() {
    if (this.mode === 'party') {
      if (this.level >= PARTY_LAST) this.finishParty()
      else this.climb(this.level + FLOORS_PER_WING)
      return
    }
    if (this.mode === 'trial') {
      if (this.level >= wingFirstFloor(this.trialWing) + FLOORS_PER_WING - 1)
        this.finishTrial()
      else this.climb()
      return
    }
    if (this.mode === 'fizz') {
      this.climb()
      return
    }
    if (this.level >= TOWER_TOP) this.beginEnding()
    else this.climb()
  }

  private finishParty() {
    this.addScore(PARTY_BONUS)
    this.result = {
      title: 'PARTY OVER!',
      lines: [`SCORE ${this.score}`, 'ONE FLOOR FROM EVERY WING', 'A: DONE'],
      ticks: 0,
    }
    this.sound.play('extra')
  }

  private finishTrial() {
    const wing = this.trialWing
    const ticks = this.trialTicks
    const medal = trialMedal(ticks, wing)
    const old = this.best[String(wing)]
    const record = old === undefined || ticks < old
    if (record) {
      this.best[String(wing)] = Math.max(1, Math.round(ticks))
      this.keepRecords()
    }
    this.addScore(Math.max(0, trialPar(wing) - ticks) * 2)
    this.result = {
      title: `WING ${wing} TRIAL`,
      lines: [
        `TIME ${clock(ticks)}`,
        `${['', 'BRONZE', 'SILVER', 'GOLD'][medal]} MEDAL  PAR ${clock(trialPar(wing))}`,
        record ? 'NEW BEST!' : `BEST ${clock(old!)}`,
        'A: DONE',
      ],
      ticks: 0,
    }
    this.sound.play('extra')
  }

  private writeSave(wing: number) {
    if (this.demo) return
    this.saveData = {
      v: 1,
      wing,
      score: Math.min(249_999_999, this.score),
      letters: [...FRIEND].filter((ch) => this.letters.has(ch)).join(''),
      cards: [...this.cards].sort((a, b) => a - b),
      stars: this.stars,
      best: { ...this.best },
    }
  }

  /** Stars and best times belong to the pilot: they ride along even when no climb is saved. */
  private keepRecords() {
    if (this.demo) return
    this.saveData = {
      ...(this.saveData ?? {
        v: 1,
        wing: 1,
        score: 0,
        letters: '',
        cards: [],
      }),
      stars: this.stars,
      best: { ...this.best },
    }
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
    this.cards = new Set(s.cards ?? [])
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
    r.on = null
    r.ice = false
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
        // Pick a way to play instead; the save stays until the next wing.
        this.offer = null
        this.openMenu()
      }
      return
    }
    if (this.menu) {
      this.updateMenu(input)
      return
    }
    if (this.result) {
      const r = this.result
      if (++r.ticks > 120 && (input.pressed.a || input.pressed.start))
        this.over = true
      else if (r.ticks > 60 * 14) this.over = true
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
          this.setPhase(this.cardDue ? 'card' : 'ready')
        }
        return
      case 'clear':
        this.updateRobots(frames)
        this.updateWorld(false)
        this.collectTreats()
        if (this.door && this.phase === 'clear') {
          if (this.robots.some((r) => this.active(r) && this.atDoor(r)))
            this.enterPantry()
          else if (this.phaseTicks >= DOOR_TICKS) this.climb()
        } else if (this.phaseTicks >= CLEAR_TICKS) {
          this.afterClear()
        }
        return
      case 'ending':
        this.updateEnding(frames)
        return
      case 'play':
        this.play(frames)
    }
  }

  private play(frames: InputFrame[]) {
    this.roundTicks++
    if (this.mode === 'trial') this.trialTicks++
    // A boss is pressure enough: no hurry on a boss floor (or in a pantry).
    const hurry = !this.boss && !this.pantry
    const [warnAt, fizzAt] = this.hurryClock()
    if (hurry && this.roundTicks === warnAt) {
      this.banner = { text: 'HURRY!', ticks: 90 }
      this.sound.play('warn')
    }
    if (hurry && this.roundTicks === fizzAt) {
      this.fizz = { x: W / 2, y: TOP + 6, t: 0, leaving: false }
      this.sound.play('warn')
    }
    if (this.roundTicks === this.letterAt) this.spawnLetter()
    if (this.roundTicks === this.specialAt) {
      const kinds = this.boss ? bossSpecials(this.boss) : this.floor.specials
      if (kinds.length && this.bubbles.filter((b) => b.special).length < 2)
        this.spawnSpecial(kinds)
      this.specialAt +=
        (this.boss ? SPECIAL_EVERY / 2 : SPECIAL_EVERY) +
        Math.floor(this.rng() * 300)
    }
    this.updateRobots(frames)
    this.updateWorld(true)
    this.checkHits()
    if (this.pantry) {
      this.playPantry()
      return
    }
    for (const id of earned(this.stats, new Set(this.owed))) {
      // A hidden condition met: the item appears somewhere on the floor.
      this.owed.push(id)
      this.stats[ITEMS[id].stat] = 0
      this.placePickup(id)
      this.sound.play('extra')
    }
    if (
      this.grumps.length === 0 &&
      !this.bubbles.some((b) => b.held) &&
      this.effects.ice.length === 0 &&
      this.effects.waves.every((w) => w.carried.length === 0) &&
      (!this.boss || this.boss.state === 'done') &&
      this.robots.some((r) => this.active(r))
    ) {
      const speedy = this.roundTicks < SPEEDY_TICKS
      this.stats.speedies = speedy ? this.stats.speedies + 1 : 0
      const pantry = pantryFor(this.level)
      this.door =
        (this.mode === 'climb' || this.mode === 'select') &&
        !!pantry &&
        !!this.floor.door &&
        !this.lostThisWing &&
        !this.cards.has(this.level)
      this.banner = {
        text: 'FLOOR CLEAR',
        sub: this.door
          ? 'A DOOR HAS APPEARED...'
          : speedy
            ? 'SPEEDY!'
            : undefined,
        ticks: CLEAR_TICKS - 20,
      }
      if (speedy) this.addScore(2000 * this.wing.n)
      this.earnStars()
      if (this.fizz) this.fizz.leaving = true
      this.sound.play('level')
      const lead = this.robots.find((r) => this.active(r))!
      this.fx.burst(lead.x, lead.y - 8, this.fxRng, { count: 24, speed: 2.4 })
      this.setPhase('clear')
    }
  }

  // --- the Secret Pantries -----------------------------------------------------------------------

  private atDoor(r: Robot) {
    const d = this.floor.door
    return !!d && Math.abs(r.x - d.x) < 9 && Math.abs(r.y - d.y) < 12
  }

  private enterPantry() {
    const def = pantryFor(this.level)!
    const from = this.climbSnapshot()
    this.pantry = def
    this.door = false
    this.floor = pantryFloor(def)
    this.bubbles = []
    this.treats = this.floor.treatSpots.map((p, i) => ({
      x: p.x,
      y: p.y,
      vx: 0,
      vy: 0,
      onGround: true,
      tier: 2 + (i % 5),
      value: TREAT_LADDER[2 + (i % 5)]!,
      spin: false,
    }))
    this.recipe = this.floor.card
    this.fizz = null
    this.effects = noEffects()
    this.hazards = []
    this.pickups = []
    this.roundTicks = 0
    this.letterAt = -1
    this.specialAt = -1
    for (const r of this.robots) this.placeRobot(r)
    this.climbFrom = from
    this.cardDue = false
    this.banner = { text: 'SECRET PANTRY', sub: def.name, ticks: 150 }
    this.sound.play('extra')
    this.setPhase('climb')
  }

  /** In a pantry: collect what you can before the tower calls you back. */
  private playPantry() {
    const recipe = this.recipe
    if (recipe) {
      for (const r of this.robots) {
        if (!this.active(r)) continue
        if (Math.abs(r.x - recipe.x) < 10 && Math.abs(r.y - recipe.y) < 14) {
          this.takeCard()
          break
        }
      }
    }
    if (
      (this.recipe === null && this.treats.length === 0) ||
      this.roundTicks >= PANTRY_TICKS
    )
      this.climb()
  }

  private takeCard() {
    const def = this.pantry!
    this.recipe = null
    this.cards.add(def.floor)
    this.addScore(CARD_POINTS)
    this.banner = { text: 'RECIPE CARD!', sub: def.card, ticks: 150 }
    this.sound.play('extra')
    // Kept at once, so a quit straight after finding it doesn't lose it.
    if (this.saveData)
      this.saveData = {
        ...this.saveData,
        cards: [...this.cards].sort((a, b) => a - b),
      }
    else if (this.wing.n > 1) this.writeSave(this.wing.n)
  }

  private climbSnapshot(): ClimbFrom {
    return {
      key: this.stageKey(),
      floor: this.floor,
      theme: this.wing.theme,
      robots: this.robots.map((r) => ({ x: r.x, y: r.y })),
    }
  }

  /** The floor scrolls away and the next one rises into place, robots riding bubbles to their starts. */
  private climb(to = this.level + 1) {
    const from = this.climbSnapshot()
    for (const r of this.robots) {
      if (r.down > 0) {
        r.down = 0
        if (!this.respawnAllowed(r)) r.out = true
      }
    }
    this.startFloor(to)
    this.climbFrom = from
    this.setPhase('climb')
  }

  // --- robots ------------------------------------------------------------------------------------

  /** Gum stuck to walls, and Float bubbles: things to stand on. */
  private gumLedges(): Ledge[] {
    const out: Ledge[] = []
    for (const b of this.bubbles) {
      if (b.stuck > 0)
        out.push({ x: b.x, top: b.y - BUBBLE_R + 1, half: BUBBLE_R })
      else if (this.isFloat(b))
        out.push({ x: b.x, top: b.y - FLOAT_R + 1, half: FLOAT_R, ref: b })
    }
    for (const k of this.blocks)
      out.push({ x: k.x, top: k.y - 14, half: 7, ref: k })
    for (const l of this.lifts)
      out.push({ x: l.x + l.w / 2, top: l.top, half: l.w / 2, ref: l })
    return out
  }

  /** A Float bubble a robot can ride (an empty one that has stopped flying). */
  private isFloat(b: Bubble) {
    return (
      b.flavour === 'float' &&
      !b.held &&
      !b.letter &&
      !b.special &&
      b.flight === 0
    )
  }

  private radius(b: Bubble) {
    return b.flavour === 'float' && !b.letter && !b.special ? FLOAT_R : BUBBLE_R
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
      const kept = (id: ItemId) => r.items.includes(id)
      const want = dir * WALK * (kept('shoes') ? ITEM_POWER.shoes : 1)
      // On ice a robot only slowly gathers speed, and slowly loses it.
      r.vx = r.ice && r.onGround ? r.vx + (want - r.vx) * 0.05 : want
      if (dir !== 0) r.face = dir < 0 ? -1 : 1
      if ((f.pressed.up || f.pressed.b) && r.onGround) {
        r.vy = JUMP_V
        r.onGround = false
        this.sound.play('blip')
        this.stats.hops++
        if (kept('necklace')) this.addScore(ITEM_POWER.necklace, r.x, r.y - 18)
      }
      const x0 = r.x
      const step = stepBody(this.floor, r, ROBOT_HALF, { ledges })
      if (r.onGround) this.stats.walked += Math.abs(r.x - x0) / 8
      const ref = step.ledge?.ref
      r.on =
        ref &&
        (this.bubbles.includes(ref as Bubble) ||
          this.lifts.includes(ref as Lift))
          ? (ref as Bubble | Lift)
          : null
      r.ice = step.ground === Cell.Ice
      if (dir !== 0 && r.onGround) this.shove(r, dir < 0 ? -1 : 1)
      if (step.sprang) this.sound.play('blip')
      if (r.onGround && !step.ledge) r.rides = 0
      if (r.cooldown > 0) r.cooldown--
      if (f.pressed.a && r.cooldown === 0 && this.phase === 'play') {
        r.cooldown = SHOT_COOLDOWN - (kept('sugar') ? 4 : 0)
        this.blow(r)
        this.sound.play('shoot')
      }
      this.touchTap(r)
      this.touchBubbles(r, f.held.up || f.held.b)
    }
  }

  /** Walking into a push block shoves it off sliding (it never lets a robot walk through it). */
  private shove(r: Robot, dir: -1 | 1) {
    for (const k of this.blocks) {
      if (Math.abs(k.y - r.y) > 2) continue
      const gap = (k.x - r.x) * dir
      if (gap < 0 || gap > 7 + ROBOT_HALF + 1) continue
      r.x = k.x - dir * (7 + ROBOT_HALF + 1)
      if (!k.sliding && k.onGround) {
        k.sliding = true
        k.dir = dir
        k.hits = 0
        this.sound.play('blip')
      }
    }
  }

  /** A robot's bubble, as its flavour makes it. */
  private blow(r: Robot) {
    const kept = (id: ItemId) => r.items.includes(id)
    const speed = SHOT_SPEED * (kept('sugar') ? ITEM_POWER.sugar : 1)
    const range = SHOT_RANGE * (kept('chew') ? ITEM_POWER.chew : 1)
    const fizz = r.flavour === 'fizz'
    const float = r.flavour === 'float'
    this.bubbles.push({
      x: fizz ? r.x : r.x + r.face * (float ? 12 : 9),
      y: fizz ? r.y - 18 : r.y - (float ? 11 : 9),
      vx: fizz ? 0 : r.face * (float ? 2.2 : speed),
      // A Fizz shot rockets straight up until it meets a ceiling.
      vy: fizz ? -4 : 0,
      age: 0,
      flight: fizz ? 240 : Math.round(float ? 16 : range),
      held: null,
      holdLeft: 0,
      flavour: r.flavour,
      stuck: 0,
      letter: null,
      special: null,
      owner: r.seat,
    })
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
      const rad = this.radius(b)
      if (
        Math.abs(b.x - r.x) >= rad + ROBOT_HALF ||
        Math.abs(b.y - (r.y - 7)) >= rad + 7
      )
        continue
      // Standing on a Float bubble rides it, never pops it.
      if (this.isFloat(b) && (r.on === b || r.y <= b.y - rad + 3)) continue
      if (hopHeld && r.vy >= 0 && r.y <= b.y - 2) {
        r.y = b.y - BUBBLE_R
        r.vy = JUMP_V * 0.95
        r.onGround = false
        r.rides++
        this.stats.rideStreak = Math.max(this.stats.rideStreak, r.rides)
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
        if (
          Math.hypot(a.x - b.x, a.y - b.y) <
          this.radius(a) + this.radius(b) + 3
        )
          cluster.push(b)
      }
    }
    this.bubbles = this.bubbles.filter((b) => !cluster.includes(b))
    const popper = this.robots[seat]
    let caught = 0
    for (const b of cluster) {
      if (b.held) {
        const tier = Math.min(TREAT_LADDER.length - 1, this.boost + caught)
        caught++
        this.dropTreat(b, tier)
        // A minion's bubble popped against a boss knocks a chunk off it.
        if (
          this.boss &&
          bossCanBeHurt(this.boss, 'pop') &&
          bossTouches(this.boss, b.x, b.y, BOSSES[this.boss.id].popReach)
        )
          this.hitBoss()
      } else if (b.letter) {
        this.collectLetter(b)
      } else if (b.special) {
        const dir = popper && popper.x > b.x ? -1 : 1
        unleash(this.effects, this.floor, b.special, b, dir)
        if (b.special === 'zap') this.stats.zaps++
        this.sound.play(b.special === 'zap' ? 'warn' : 'boom')
        this.fx.burst(b.x, b.y, this.fxRng, {
          count: 14,
          colours: [SPECIAL_TINT[b.special], '#ffffff'],
        })
      } else {
        this.addScore(10)
        this.stats.emptyPops++
        this.burst(b.x, b.y, 5, RAMPS.water[3])
      }
    }
    this.stats.bigPop = Math.max(this.stats.bigPop, caught)
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
    if (g.kind === 'mimic') {
      // Popping a mimic drops a real gem as well.
      const gem = Math.min(TREAT_LADDER.length - 1, tier + 2)
      this.treats.push({
        x: b.x,
        y: b.y + 4,
        vx: (this.rng() - 0.5) * 2.4,
        vy: -3.4,
        onGround: false,
        tier: gem,
        value: TREAT_LADDER[gem]!,
        spin: true,
      })
    }
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
    this.stats.letters++
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
      special: null,
      vy: 0,
      owner: -1,
    })
  }

  /** A special bubble drifting in from a wall: one of the floor's kinds. */
  private spawnSpecial(kinds: readonly SpecialKind[]) {
    const special = kinds[Math.floor(this.rng() * kinds.length)]!
    const fromLeft = this.rng() < 0.5
    this.bubbles.push({
      x: fromLeft ? WALL_L + BUBBLE_R : WALL_R - BUBBLE_R,
      y: TOP + 40 + Math.floor(this.rng() * 140),
      vx: fromLeft ? 0.8 : -0.8,
      age: 0,
      flight: 60,
      held: null,
      holdLeft: 0,
      flavour: 'classic',
      stuck: 0,
      letter: null,
      special,
      vy: 0,
      owner: -1,
    })
  }

  private updateBubbles(live: boolean) {
    const hold = Math.round(levelCurve(this.level, TOWER_CURVES.hold))
    const released: Grump[] = []
    const gone = new Set<Bubble>()
    // Low gravity: everything drifts slower.
    const slow = this.floor.gravity < 0.2 ? 0.6 : 1
    for (const b of this.bubbles) {
      const r = this.radius(b) - 1
      b.age++
      if (b.stuck > 0) {
        if (--b.stuck === 0) {
          gone.add(b)
          this.burst(b.x, b.y, 6, RAMPS.pink[3])
        }
        continue
      }
      if (b.flight > 0 && b.vy < 0) {
        // A Fizz rocket: straight up until a ceiling bursts it into a trapping shower.
        b.flight--
        const hit = slide(this.floor, b, 0, b.vy, r)
        if (hit.y || b.flight === 0) {
          gone.add(b)
          this.fizzShower(b, hold)
        }
        continue
      }
      if (b.flight > 0) {
        b.flight--
        const hit = slide(this.floor, b, b.vx, 0, r)
        if (hit.x || b.x <= WALL_L + r || b.x >= WALL_R - r) {
          if (b.flavour === 'gum' && !b.held && !b.letter && !b.special)
            this.stick(b)
          b.flight = 0
        }
        if (b.flight === 0) b.vx = 0
      } else {
        const speed =
          slow * (this.isFloat(b) ? 0.3 : b.held ? 0.32 : b.letter ? 0.4 : 0.5)
        const y0 = b.y
        const cur = currentAt(this.floor, b.x, b.y)
        let dx = cur
          ? cur.x * speed
          : Math.sin((b.age + b.x) / 18) * 0.25 + this.floor.wind * speed * 0.9
        const dy = cur ? cur.y * speed : -speed
        const hit = slide(this.floor, b, dx, dy, r)
        // A robot riding a Float bubble goes up with it.
        if (this.isFloat(b) && b.y !== y0)
          for (const rb of this.robots)
            if (rb.on === b && rb.onGround) rb.y = b.y - FLOAT_R + 1
        if (hit.y && dy < 0) {
          if (b.flavour === 'gum' && !b.held && !b.letter && !b.special)
            this.stick(b)
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
      } else if (
        b.letter || b.special
          ? b.age > LETTER_LIFE
          : b.age > EMPTY_LIFE * (this.isFloat(b) ? 1.5 : 1)
      ) {
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
        const min = this.radius(a) + this.radius(b) - 1
        if (d >= min) continue
        const ux = d > 0.01 ? (a.x - b.x) / d : 1
        const uy = d > 0.01 ? (a.y - b.y) / d : 0
        const push = (min - d) / 2
        slide(this.floor, a, ux * push, uy * push, this.radius(a) - 1)
        slide(this.floor, b, -ux * push, -uy * push, this.radius(b) - 1)
      }
    }
    if (gone.size) this.bubbles = this.bubbles.filter((b) => !gone.has(b))
    if (released.length) {
      this.grumps.push(...released)
      this.sound.play('boom')
    }
    if (live) this.trapGrumps(hold)
    // A minion's bubble that floats into a boss bursts against it.
    const boss = this.boss
    if (boss && bossCanBeHurt(boss, 'pop'))
      for (const b of [...this.bubbles])
        if (b.held && bossTouches(boss, b.x, b.y, BUBBLE_R + 3)) {
          this.popCluster(b, -1)
        }
  }

  /** A Fizz rocket bursts at the ceiling: a shower that traps every grump beneath it. */
  private fizzShower(b: Bubble, hold: number) {
    this.burst(b.x, b.y, 14, FLAVOUR_RAMPS.fizz[3])
    this.fx.burst(b.x, b.y, this.fxRng, {
      count: 16,
      speed: 2,
      colours: [FLAVOUR_RAMPS.fizz[3], '#ffffff'],
    })
    this.sound.play('pop')
    for (const g of [...this.grumps]) {
      const c = grumpCentre(g)
      if (
        !trappable(g) ||
        Math.abs(c.x - b.x) > 22 ||
        c.y < b.y ||
        c.y > b.y + 120
      )
        continue
      this.grumps.splice(this.grumps.indexOf(g), 1)
      this.stats.traps++
      this.bubbles.push({
        x: c.x,
        y: c.y,
        vx: 0,
        age: 0,
        flight: 0,
        held: g,
        holdLeft: hold,
        flavour: 'fizz',
        stuck: 0,
        letter: null,
        special: null,
        vy: 0,
        owner: b.owner,
      })
    }
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
    const frozen = new Set<Bubble>()
    for (const b of this.bubbles) {
      if (b.held || b.stuck > 0 || b.letter || b.special) continue
      const rad = this.radius(b)
      for (let i = 0; i < this.grumps.length; i++) {
        const g = this.grumps[i]!
        if (!trappable(g)) continue
        const c = grumpCentre(g)
        if (Math.abs(b.x - c.x) < rad + 5 && Math.abs(b.y - c.y) < rad + 6) {
          this.grumps.splice(i, 1)
          this.stats.traps++
          this.sound.play('pickup')
          if (b.flavour === 'frost') {
            // Frost: the grump freezes solid and drops, to bowl along the platform.
            const owner = this.robots[b.owner]
            freeze(this.effects, g, b, owner ? owner.face : 1)
            frozen.add(b)
            break
          }
          b.held = g
          b.holdLeft = hold
          b.flight = 0
          b.vx = 0
          b.vy = 0
          break
        }
      }
    }
    if (frozen.size) this.bubbles = this.bubbles.filter((b) => !frozen.has(b))
  }

  // --- the world ---------------------------------------------------------------------------------

  private updateWorld(live: boolean) {
    const robots = this.robots.filter((r) => this.active(r))
    this.updateMachines()
    if (live) {
      if (this.frozen > 0) this.frozen--
      const world = {
        floor: this.floor,
        rng: this.rng,
        speed: levelCurve(this.level, TOWER_CURVES.speed),
        hop: levelCurve(this.level, TOWER_CURVES.hop),
        robots,
        ledges: this.gumLedges(),
        hazards: this.hazards,
        frozen: this.frozen > 0,
      }
      for (const g of this.grumps) updateGrump(g, world)
      if (this.boss) {
        const boss = this.boss
        updateBoss(boss, this.bossHost(robots))
        if (boss.state === 'done' && boss.t === 91) this.bossBeaten(boss)
      }
    }
    this.updateBubbles(live)
    updateSpecials(this.effects, this.effectHost())
    this.updateStorm()
    this.updateHazards()
    for (const t of this.treats) {
      const was = t.onGround
      stepBody(this.floor, t, 4)
      if (t.onGround && !was) t.spin = false
      if (t.onGround) t.vx = 0
    }
    for (const p of this.pickups) {
      p.t++
      stepBody(this.floor, p, 4)
    }
    if (this.fizz) this.updateFizz()
  }

  private effectHost(): EffectHost {
    return {
      floor: this.floor,
      grumps: this.grumps,
      defeat: (g, x, y, count) => this.defeat(g, x, y, count),
      // Each boss is hurt only by what its phase allows (the Big Cork: only its own corks).
      strikeBoss: (x, y, kind) => this.strikeBoss(x, y, kind),
    }
  }

  /** A grump taken by a wave, a bolt, flames or an ice block tumbles out as a treat. */
  private defeat(g: Grump, x: number, y: number, count: number) {
    const tier = Math.min(TREAT_LADDER.length - 1, this.boost + count)
    this.burst(x, y, 12, GRUMP_RAMPS[g.kind][2])
    this.sound.play('boom')
    this.treats.push({
      x: Math.max(WALL_L + 6, Math.min(WALL_R - 6, x)),
      y,
      vx: (this.rng() - 0.5) * 2,
      vy: -2.4,
      onGround: false,
      tier,
      value: TREAT_LADDER[tier]!,
      spin: true,
    })
  }

  private bossHost(robots: readonly Spot[]): BossHost {
    const boss = this.boss!
    const minion = BOSSES[boss.id].minion
    return {
      floor: this.floor,
      rng: this.rng,
      robots,
      minions: this.grumps.filter((g) => g.kind === minion).length,
      spawnMinion: (at, dir, kind) => {
        const g = makeGrump(kind, at, this.rng)
        g.dir = dir
        g.vy = -2.5
        g.vx = dir * 1.5
        this.grumps.push(g)
      },
      cap: (x, y, vx, vy) =>
        this.hazards.push({
          kind: 'cap',
          x,
          y,
          vx,
          vy,
          life: 360,
          x0: 0,
          x1: 0,
        }),
      cue: (what) => {
        if (what === 'creak' || what === 'phase' || what === 'rattle')
          this.sound.play('warn')
        else if (what === 'slam' || what === 'blast') this.sound.play('boom')
        else this.sound.play('blip')
        if (what === 'phase' && boss.phase > 1)
          this.banner = {
            ...BOSSES[boss.id].phases[boss.phase as 2 | 3],
            ticks: 110,
          }
      },
    }
  }

  /** A hit of this kind where it touches the boss: true if it landed. */
  private strikeBoss(x: number, y: number, kind: HurtKind): boolean {
    const boss = this.boss
    if (!boss || !bossCanBeHurt(boss, kind) || !bossTouches(boss, x, y, 8))
      return false
    if (kind === 'zap') stunBoss(boss)
    return this.hitBoss()
  }

  private hitBoss(): boolean {
    const boss = this.boss
    if (!boss) return false
    if (!hurtBoss(boss, this.bossHost([]))) return false
    this.sound.play('boom')
    this.fx.burst(boss.x, boss.y, this.fxRng, { count: 20, speed: 2.4 })
    this.floaters.push({
      x: boss.x,
      y: boss.y - boss.r - 6,
      text: 'BONK!',
      life: 50,
      color: '#ffffff',
    })
    return true
  }

  /** The boss pops: its prize, a shower of treats, and every minion it spat out besides. */
  private bossBeaten(boss: Boss) {
    this.addScore(BOSSES[boss.id].prize, boss.x, boss.y)
    this.banner = { text: `${boss.name}`, sub: 'POPPED!', ticks: 150 }
    this.sound.play('extra')
    for (let i = 0; i < TREAT_LADDER.length; i++)
      this.treats.push({
        x: boss.x + (i - 3) * 6,
        y: boss.y,
        vx: (i - 3) * 0.5,
        vy: -3 - (i % 3),
        onGround: false,
        tier: i,
        value: TREAT_LADDER[i]!,
        spin: true,
      })
    for (const g of [...this.grumps]) {
      this.grumps.splice(this.grumps.indexOf(g), 1)
      this.defeat(g, g.x, g.y - 6, 0)
    }
    for (const b of this.bubbles.filter((x) => x.held)) this.popCluster(b, -1)
  }

  /** Hot plates (read live), wind-up doors, push blocks and lifts. */
  private updateMachines() {
    const f = this.floor
    if (f.doors.length) {
      const open = this.roundTicks % WIND_DOOR.beat >= WIND_DOOR.open
      if (open !== this.doorsOpen) {
        this.doorsOpen = open
        setDoors(f, open)
        this.sound.play('blip')
      }
    }
    for (const k of this.blocks) {
      k.vx = k.sliding ? k.dir * PUSH_SPEED : 0
      const step = stepBody(f, k, 7)
      if (!k.sliding) continue
      for (const g of [...this.grumps]) {
        const c = grumpCentre(g)
        if (Math.abs(c.x - k.x) < 13 && Math.abs(c.y - (k.y - 7)) < 12) {
          this.grumps.splice(this.grumps.indexOf(g), 1)
          this.defeat(g, g.x, g.y - 6, k.hits++)
        }
      }
      if (step.bumped) {
        k.sliding = false
        this.sound.play('pop')
      }
    }
    for (const l of this.lifts) {
      const was = l.top
      const d = l.def
      const phase = (this.roundTicks % d.period) / d.period
      l.top =
        TOP + d.r * 8 - d.rise * 8 * (0.5 - 0.5 * Math.cos(phase * Math.PI * 2))
      if (l.top === was) continue
      // Whatever stands on it rides with it.
      const riding = (b: Body) =>
        b.onGround &&
        Math.abs(b.y - was) < 1.5 &&
        b.x > l.x - 3 &&
        b.x < l.x + l.w + 3
      for (const r of this.robots) if (r.on === l || riding(r)) r.y = l.top
      for (const g of this.grumps) if (riding(g)) g.y = l.top
      for (const t of this.treats) if (riding(t)) t.y = l.top
    }
  }

  /** A hot plate's state now. */
  private hotState(i: number): 'cool' | 'glow' | 'puff' {
    const t = (this.roundTicks + (i % 32) * 13) % HOT_PLATE.beat
    return t >= HOT_PLATE.puff ? 'puff' : t >= HOT_PLATE.glow ? 'glow' : 'cool'
  }

  /** The Storm Rooftop: now and then lightning picks a column near a robot, flashes, then strikes. */
  private updateStorm() {
    if (this.flash > 0) this.flash--
    if (!this.floor.storm || this.strikeIn < 0 || --this.strikeIn > 0) return
    this.strikeIn = STORM.every + Math.floor(this.rng() * STORM.jitter)
    const live = this.robots.filter((r) => this.active(r))
    const pick = live[Math.floor(this.rng() * live.length)]
    const x = Math.max(
      WALL_L + 8,
      Math.min(WALL_R - 8, (pick?.x ?? W / 2) + (this.rng() - 0.5) * 60),
    )
    let y1 = TOP + 16
    while (y1 < FLOOR_Y && !solidAt(this.floor, x, y1)) y1 += 2
    this.hazards.push({
      kind: 'bolt',
      x,
      y: TOP + 8,
      vx: 0,
      life: STORM.warn + BOLT_TICKS,
      x0: 0,
      x1: 0,
      y1,
      warn: STORM.warn,
    })
  }

  private updateHazards() {
    for (const h of this.hazards) {
      h.life--
      if (h.kind === 'bolt') {
        if ((h.warn ?? 0) > 0 && --h.warn! === 0) {
          this.flash = 60
          this.sound.play('boom')
        }
      } else if (h.kind === 'cap') {
        h.x += h.vx
        h.y += h.vy ?? 0
        if (
          h.x < WALL_L ||
          h.x > WALL_R ||
          h.y > H ||
          h.y < TOP ||
          solidAt(this.floor, h.x, h.y)
        )
          h.life = 0
      } else if (h.kind === 'jet' || h.kind === 'steam') {
        h.x += h.vx
        if (h.x < WALL_L || h.x > WALL_R || solidAt(this.floor, h.x, h.y))
          h.life = 0
      } else if (h.kind === 'snowball') {
        h.vy = (h.vy ?? 0) + 0.15
        h.x += h.vx
        h.y += h.vy
        if (
          h.x < WALL_L ||
          h.x > WALL_R ||
          h.y > H ||
          (h.vy > 0 && solidAt(this.floor, h.x, h.y + 2))
        )
          h.life = 0
      }
    }
    this.hazards = this.hazards.filter((h) => h.life > 0)
  }

  /** An earned item appears on a surface the robots can reach. */
  private placePickup(id: ItemId) {
    const f = this.floor
    const reached = reachableSegments(f)
    const segs = navOf(f).segs.filter((sg) => reached.has(segmentKey(sg)))
    const seg = segs[Math.floor(this.rng() * segs.length)]
    if (!seg) return
    const c = seg.c0 + Math.floor(this.rng() * (seg.c1 - seg.c0 + 1))
    this.pickups = this.pickups.filter((p) => p.id !== id)
    this.pickups.push({
      id,
      x: c * 8 + 4,
      y: TOP + seg.r * 8 - 20,
      vx: 0,
      vy: 0,
      onGround: false,
      t: 0,
      skip: UMBRELLA_SKIPS[Math.floor(this.rng() * UMBRELLA_SKIPS.length)]!,
    })
  }

  private takePickup(r: Robot, p: Pickup) {
    this.pickups = this.pickups.filter((x) => x !== p)
    this.owed = this.owed.filter((id) => id !== p.id)
    const item = ITEMS[p.id]
    this.sound.play('extra')
    this.fx.burst(p.x, p.y - 6, this.fxRng, {
      count: 16,
      colours: [item.ramp[4], item.ramp[3], '#ffffff'],
    })
    this.addScore(1000, p.x, p.y - 12)
    this.banner = { text: item.name, sub: item.does, ticks: 110 }
    if (item.kept) {
      if (!r.items.includes(p.id)) r.items.push(p.id)
      return
    }
    if (p.id === 'clock') this.frozen = ITEM_POWER.clockTicks
    else if (p.id === 'party') this.party()
    else if (p.id === 'star') this.starRain()
    else if (p.id === 'umbrella') this.umbrella(p.skip)
  }

  /** The party popper: treats rain onto every surface. */
  private party() {
    const segs = navOf(this.floor).segs
    for (let i = 0; i < 14; i++) {
      const seg = segs[Math.floor(this.rng() * segs.length)]!
      const tier = 1 + (i % 4)
      this.treats.push({
        x: (seg.c0 + this.rng() * (seg.c1 - seg.c0 + 1)) * 8,
        y: TOP + seg.r * 8 - 30,
        vx: 0,
        vy: -1,
        onGround: false,
        tier,
        value: TREAT_LADDER[tier]!,
        spin: true,
      })
    }
  }

  /** The lucky star: bolts across six rows, alternately from each wall. */
  private starRain() {
    for (let i = 0; i < ITEM_POWER.starBolts; i++) {
      const y = TOP + 24 + i * 32
      const fromLeft = i % 2 === 0
      this.effects.bolts.push({
        x: fromLeft ? WALL_L : WALL_R,
        y,
        dir: fromLeft ? 1 : -1,
        t: 0,
        hits: 0,
      })
    }
  }

  /** An umbrella floats the robots up past some floors (never past a boss). */
  private umbrella(skip: number) {
    let to = this.level + skip
    for (let n = this.level + 1; n < to; n++)
      if (floorPlan(n).def.boss) {
        to = n
        break
      }
    this.banner = {
      text: 'UMBRELLA!',
      sub: `UP ${to - this.level} FLOORS`,
      ticks: 130,
    }
    this.grumps = []
    this.bubbles = []
    this.climb(to)
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
          this.stats.treats++
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
      if (!this.active(r)) continue
      for (const p of this.pickups)
        if (Math.abs(p.x - r.x) < 9 && Math.abs(p.y - r.y) < 12) {
          this.takePickup(r, p)
          break
        }
    }
    for (const r of this.robots) {
      if (!this.active(r) || r.invuln > 0 || this.demo) continue
      const hazard =
        this.hazards.some((h) =>
          h.kind === 'bolt'
            ? (h.warn ?? 0) <= 0 &&
              Math.abs(h.x - r.x) < 6 &&
              r.y >= h.y &&
              r.y - 12 <= (h.y1 ?? FLOOR_Y) + 2
            : h.kind === 'beam'
              ? r.x > h.x0 - 4 &&
                r.x < h.x1 + 4 &&
                Math.abs(h.y - (r.y - 7)) < 8
              : Math.abs(h.x - r.x) < (h.kind === 'steam' ? 10 : 7) &&
                Math.abs(h.y - (r.y - 7)) < (h.kind === 'steam' ? 11 : 9),
        ) ||
        this.floor.hotPlates.some((i) => {
          if (this.hotState(i) !== 'puff') return false
          const x = (i % 32) * 8
          const top = TOP + Math.floor(i / 32) * 8
          return r.x > x - 3 && r.x < x + 11 && r.y <= top + 1 && r.y > top - 22
        }) ||
        (!!this.boss &&
          bossHazards(this.boss).some(
            (z) => r.x > z.x0 && r.x < z.x1 && r.y > z.y0 && r.y - 12 < z.y1,
          ))
      const boss =
        !!this.boss &&
        bossHarms(this.boss) &&
        bossTouches(this.boss, r.x, r.y - 7, 6)
      if (hazard || boss) {
        this.bonk(r)
        continue
      }
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
    r.items = []
    r.on = null
    this.lives = Math.max(0, this.lives - 1)
    this.lostThisWing = true
    this.lostThisFloor = true
    this.burst(r.x, r.y - 7, 14, RAMPS.teal[3])
    this.sound.play('die')
    this.banner = {
      text: this.lives > 0 ? 'BONK!' : 'GAME OVER',
      ticks: 70,
    }
    // The floor timer starts again, and Old Flat Fizz goes home. Letters and specials still
    // to come keep their place on the new clock.
    const was = this.roundTicks
    if (this.letterAt > was) this.letterAt -= was
    if (this.specialAt >= 0) this.specialAt = Math.max(1, this.specialAt - was)
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
    // Off a hot plate that is about to puff.
    const plate = this.floor.hotPlates.find((i) => {
      const x = (i % 32) * 8
      return (
        this.hotState(i) !== 'cool' &&
        Math.abs(TOP + Math.floor(i / 32) * 8 - r.y) < 2 &&
        r.x > x - 6 &&
        r.x < x + 14
      )
    })
    if (plate !== undefined && r.onGround) {
      go(r.x < (plate % 32) * 8 + 4 ? -1 : 1, 0)
      return frame
    }
    // A cloud of steam or a snowball close by: get out from under it.
    const strike = this.hazards.find(
      (h) => h.kind === 'bolt' && Math.abs(h.x - r.x) < 24 && r.y >= h.y,
    )
    if (strike) {
      go(r.x - strike.x || 1, 0)
      return frame
    }
    const blast = this.hazards.find(
      (h) =>
        (h.kind === 'steam' || h.kind === 'snowball' || h.kind === 'cap') &&
        Math.abs(h.x - r.x) < 30 &&
        Math.abs(h.y - (r.y - 7)) < 30,
    )
    if (blast) {
      go(r.x - blast.x, 0)
      return frame
    }
    // A jet flying at us, or a beam about to light our row: hop it.
    const level = (y: number) => Math.abs(y - (r.y - 7)) < 10
    const jet = this.hazards.some(
      (h) =>
        h.kind === 'jet' &&
        level(h.y) &&
        Math.sign(r.x - h.x) === Math.sign(h.vx) &&
        Math.abs(r.x - h.x) < 56,
    )
    const glint = this.grumps.some(
      (g) =>
        g.state === 'windup' &&
        GRUMPS[g.kind].attack?.kind === 'beam' &&
        level(g.y - 6),
    )
    if (
      jet ||
      glint ||
      this.hazards.some((h) => h.kind === 'beam' && level(h.y))
    ) {
      hop(r.x + r.face * 24)
      if (!r.onGround && memo.aim !== null) go(memo.aim - r.x, 1)
      return frame
    }
    // Keep clear of a boss, and never stand under one that creaks.
    const boss = this.boss
    if (boss && bossAlive(boss)) {
      // The Kettle: out of where the steam will blast, and up out of the flood.
      if (
        (boss.state === 'rattle' || boss.state === 'blast') &&
        Math.abs(r.x - boss.target) < 30
      ) {
        go(r.x < boss.target ? -1 : 1, 0)
        if (
          boss.state === 'blast' &&
          r.x > boss.target - 24 &&
          r.x < boss.target + 24
        )
          hop(r.x + (r.x < boss.target ? -40 : 40))
        return frame
      }
      if (
        (boss.phase === 2 || boss.flood > 0) &&
        r.onGround &&
        r.y > FLOOR_Y - 30
      ) {
        const here = segmentUnder(this.floor, r.x, r.y)
        const nav = navOf(this.floor)
        const up = nav.segs.findIndex((sg) => sg.r <= 21 && sg.r >= 15)
        const way = up >= 0 ? route(this.floor, here, up) : null
        if (way) {
          if (way.kind === 'up' && Math.abs(way.launch - r.x) < 3) hop(way.aim)
          else go(way.launch - r.x, 0)
          return frame
        }
      }
    }
    if (boss && boss.state !== 'done' && boss.state !== 'popping') {
      const near =
        Math.hypot(boss.x - r.x, boss.y - (r.y - 7)) <
        boss.r + (boss.id === 'kettle' ? 12 : 28)
      const under =
        boss.state === 'creak' && Math.abs(boss.x - r.x) < boss.r + 10
      if (near || under) {
        let away = r.x < boss.x ? -1 : 1
        if (away < 0 ? r.x < WALL_L + 24 : r.x > WALL_R - 24) away = -away
        go(away, 0)
        if (boss.y > r.y - 24 && near) hop(r.x + away * 40)
        return frame
      }
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
    // Something to touch: a trapped grump, a letter, a nearby treat. The one it was already
    // heading for counts as nearer, so two equal choices don't leave it dithering between them.
    let touch: { x: number; y: number } | null = null
    let best = Infinity
    const was = memo.touch
    const keep = (x: number, y: number) =>
      was && Math.abs(was.x - x) < 8 && Math.abs(was.y - y) < 8 ? 40 : 0
    for (const b of this.bubbles) {
      if (b.flight > 0 || b.stuck > 0 || (!b.held && !b.letter && !b.special))
        continue
      // A cork bubble near the Big Cork is better left to float into it.
      if (
        this.boss?.id === 'cork' &&
        b.held &&
        Math.abs(b.x - this.boss.x) < 40
      )
        continue
      const d = Math.abs(b.x - r.x) + Math.abs(b.y - r.y) * 0.7 - keep(b.x, b.y)
      if (d < best) {
        best = d
        touch = { x: b.x, y: b.y + BUBBLE_R + 6 }
      }
    }
    const anywhere = this.grumps.length === 0 || !!this.pantry
    for (const t of [...this.treats, ...this.pickups]) {
      const d = Math.abs(t.x - r.x) + Math.abs(t.y - r.y) * 0.7 - keep(t.x, t.y)
      if (d < best && (d < 90 || anywhere)) {
        best = d
        touch = t
      }
    }
    // A pantry's recipe card, and the door to it, come first.
    const door = this.door ? this.floor.door : null
    if (this.recipe && (this.treats.length === 0 || this.roundTicks > 300))
      touch = this.recipe
    else if (door) touch = door
    memo.touch = touch ? { x: touch.x, y: touch.y } : null
    // The nearest grump to trap.
    let prey: Grump | null = null
    let preyD = Infinity
    for (const g of this.grumps) {
      if (!trappable(g)) continue
      const c = grumpCentre(g)
      const d = Math.abs(c.x - r.x) + Math.abs(c.y - r.y) * 0.8
      if (d < preyD) {
        preyD = d
        prey = g
      }
    }
    // Nothing trappable left but grumps hiding (in a toaster, under a girder, under water):
    // wait beside one, leaving bubbles over it for when it shows itself.
    let lurk: Spot | null = null
    if (!prey && !touch) {
      let d0 = Infinity
      for (const g of this.grumps) {
        const d = Math.abs(g.x - r.x) + Math.abs(g.y - r.y) * 0.8
        if (d < d0) {
          d0 = d
          const side = r.x < g.x ? -1 : 1
          lurk = { x: g.x + side * 30, y: g.y }
        }
      }
      if (lurk && Math.abs(lurk.y - r.y) < 12 && Math.abs(lurk.x - r.x) < 20) {
        if (this.tick % 40 === 0) blow(lurk.x < r.x ? 1 : -1)
        else if (Math.sign(-(lurk.x - r.x)) !== r.face)
          go(r.x > lurk.x ? 1 : -1, 0)
        return frame
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
    const goal = touch ?? (prey ? grumpCentre(prey) : lurk)
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
        // A walk onto a gumdrop, or off an edge, keeps going; a hop waits for its spot.
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
    // Standing about with nothing to do (a hop held back by something overhead): wander off.
    if (!held.left && !held.right && !pressed.up && !pressed.a && r.onGround) {
      if (++memo.idle > 50) {
        go(memo.wander, 0)
        if (memo.idle > 110) {
          memo.idle = 0
          memo.wander = memo.wander > 0 ? -1 : 1
        }
      }
    } else memo.idle = 0
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
      this.paintStage(g, old.key, old.floor, old.theme)
      paintWater(g, old.floor, this.tick)
      g.restore()
      g.save()
      g.translate(0, shift - (H - TOP))
      this.paintStage(g, this.stageKey(), this.floor, this.wing.theme)
      paintWater(g, this.floor, this.tick)
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
      this.paintStage(g, this.stageKey(), this.floor, this.wing.theme)
      paintLiveTiles(
        g,
        this.floor,
        this.tick,
        (i) => this.hotState(i),
        !this.doorsOpen && this.roundTicks % WIND_DOOR.beat >= WIND_DOOR.tell,
      )
      paintCurrents(g, this.floor, theme.current, this.tick)
      for (const l of this.lifts) paintLift(g, l.x, l.top, l.w)
      for (const k of this.blocks) paintPushBlock(g, k)
      for (const gr of this.grumps)
        if (gr.kind === 'toaster')
          paintToaster(
            g,
            gr.home.x,
            gr.home.y,
            gr.state === 'toast' && gr.t > 110,
            this.tick,
          )
      this.renderTap(g)
      if (this.door && this.floor.door) {
        const d = this.floor.door
        glow(
          g,
          d.x,
          d.y - 8,
          18,
          RAMPS.gold[3],
          0.35 + 0.15 * Math.sin(this.tick / 6),
        )
        drawSprite(g, DOOR_SPRITE, d.x, d.y, { anchor: 'feet' })
      }
      if (this.recipe) {
        const bob = Math.round(Math.sin(this.tick / 9) * 2)
        glow(g, this.recipe.x, this.recipe.y - 8, 16, RAMPS.pink[3], 0.45)
        drawSprite(g, CARD_SPRITE, this.recipe.x, this.recipe.y - 4 + bob, {
          anchor: 'feet',
        })
      }
      for (const p of this.pickups) {
        glow(
          g,
          p.x,
          p.y - 5,
          12,
          ITEMS[p.id].ramp[3],
          0.4 + 0.15 * Math.sin(this.tick / 5),
        )
        drawSprite(g, ITEM_SPRITES[p.id], p.x, p.y, { anchor: 'feet' })
      }
      for (const t of this.treats) this.renderTreat(g, t)
      for (const fire of this.effects.fires) paintFire(g, fire, this.tick)
      if (this.phase !== 'card')
        for (const gr of this.grumps) this.renderGrump(g, gr)
      if (this.boss) {
        paintBossHazards(g, this.boss, this.tick)
        paintBoss(g, this.boss, this.tick)
      }
      for (const ice of this.effects.ice) paintIce(g, ice)
      for (const b of this.bubbles) this.renderBubble(g, b)
      paintWater(g, this.floor, this.tick)
      for (const w of this.effects.waves) paintWave(g, w, this.tick)
      for (const r of this.robots) {
        if (!this.active(r)) continue
        if (r.invuln > 0 && Math.floor(this.tick / 4) % 2) continue
        this.renderRobot(g, r, r.x, r.y)
      }
      for (const b of this.effects.bolts) paintBolt(g, b, this.tick)
      for (const h of this.hazards) paintHazard(g, h, this.tick)
      if (this.fizz) this.renderFizz(g, this.fizz)
      if (this.floor.dark && this.phase !== 'card')
        paintDarkness(g, this.lights())
      if (this.floor.storm) paintRain(g, this.tick, this.floor.wind, this.flash)
      if (this.frozen > 0) {
        g.fillStyle = rgba(RAMPS.sky[3], 0.08)
        g.fillRect(0, TOP, W, H - TOP)
      }
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
    if (this.phase === 'card' && !this.offer && !this.menu) this.renderCard(g)
    if (this.phase === 'ending') this.renderEnding(g)
    if (this.offer) this.renderOffer(g, this.offer)
    if (this.result) renderResult(g, this.result)
    if (this.menu)
      renderMenu(
        g,
        {
          cursor: this.menu.cursor,
          floor: this.menu.floor,
          floors: this.selectMax(),
          wing: this.menu.wing,
          wings: this.trialMax(),
          stars: this.stars,
          best: this.best,
          board: this.menu.board,
        },
        this.tick,
      )
  }

  /** Pools of light on a dark floor: the robots' glowing antennae (a Lamp widens them) and anything that crackles. */
  private lights(): Array<{ x: number; y: number; r: number }> {
    const out: Array<{ x: number; y: number; r: number }> = []
    for (const r of this.robots)
      if (this.active(r))
        out.push({
          x: r.x,
          y: r.y - 14,
          r: r.items.includes('lamp') ? LAMP_WIDE : LAMP_RADIUS,
        })
    for (const b of this.bubbles)
      if (b.special) out.push({ x: b.x, y: b.y, r: 16 })
    for (const h of this.hazards) out.push({ x: h.x, y: h.y, r: 18 })
    return out
  }

  private renderEnding(g: CanvasRenderingContext2D) {
    const kind = this.ending ?? 'solo'
    const t = this.phaseTicks
    g.fillStyle = rgba(INK, Math.min(0.82, t / 80))
    g.fillRect(0, 0, W, H)
    const line = (text: string, y: number, color = '#ffffff', scale = 1) =>
      drawText(g, text, W / 2, y, {
        align: 'center',
        color,
        outline: INK,
        scale,
      })
    if (kind === 'true') {
      // The credits roll down the tower, floor by floor, with every grump as a guest.
      const rows: Array<[string, string]> = [
        ['THE KING BAKES THE LOST RECIPE', RAMPS.gold[3]],
        ['AND THE TOWER FIZZES BACK TO LIFE', '#ffffff'],
        ['', '#ffffff'],
        ...WINGS.slice()
          .reverse()
          .map(
            (w) =>
              [
                `FLOORS ${wingFirstFloor(w.n)}-${wingFirstFloor(w.n) + 9}  ${w.name}`,
                RAMPS.teal[3],
              ] as [string, string],
          ),
        ['', '#ffffff'],
        ['EVERY GRUMP YOU POPPED IS A GUEST', RAMPS.pink[3]],
        ['AT A HUNDRED-FLOOR CELEBRATION', RAMPS.pink[3]],
        ['', '#ffffff'],
        ['THANK YOU FOR CLIMBING', RAMPS.gold[3]],
      ]
      const y0 = H - t * 0.55
      rows.forEach(([text, color], i) => {
        const y = y0 + i * 14
        if (y > TOP - 6 && y < H) line(text, Math.round(y), color)
      })
      const guests = (Object.keys(GRUMPS) as GrumpKind[]).filter(
        (k) => k !== 'corklet' && k !== 'jellet',
      )
      guests.forEach((kind2, i) => {
        const x = 14 + ((i * 29 + t * 0.6) % (W + 20))
        const hop = Math.abs(Math.sin((t + i * 11) / 9)) * 8
        drawSprite(
          g,
          GRUMP_FRAMES[kind2].walk[Math.floor((t + i * 7) / 10) % 2]!,
          x - 10,
          H - 8 - hop,
          { anchor: 'feet' },
        )
      })
    } else {
      line(
        kind === 'coop'
          ? 'THE TOWER THROWS A PARTY!'
          : 'THE CARBONATOR RESTARTS!',
        64,
        RAMPS.gold[3],
        2,
      )
      line('YOU CLIMBED ALL 100 FLOORS', 96)
      if (kind === 'coop') {
        line('EVERY ROBOT GETS A SLICE OF CAKE.', 116)
        line(
          `RECIPE CARDS: ${this.cards.size} OF ${PANTRY_FLOORS.length}`,
          140,
          RAMPS.pink[3],
        )
        line('FIND ALL FIVE FOR THE TRUE ENDING.', 154, RAMPS.pink[3])
      } else {
        line('THE TOWER IS FIZZING AGAIN, BUT', 116)
        line('THE TREAT SHOP STAYS SHUT.', 128)
        line('BRING A FRIEND FOR THE PARTY.', 152, RAMPS.pink[3])
      }
    }
    line(
      `ENDING BONUS ${ENDING_BONUS[kind].toLocaleString('en-US')}`,
      H - 22,
      RAMPS.gold[3],
    )
  }

  private paintStage(
    g: CanvasRenderingContext2D,
    key: string,
    floor: Floor,
    themeId: string,
  ) {
    const theme = THEMES[themeId]!
    cachedLayer(g, key, W, H, (k) =>
      paintTiles(k, floor, theme, 97 + key.length * 31 + floor.name.length * 7),
    )
  }

  /** The cached layer name for the floor in play (a pantry's room has its own). */
  private stageKey() {
    return this.pantry
      ? `bumper-pantry-${this.pantry.floor}`
      : `bumper-floor-${this.plan.map}`
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
    if (gr.state === 'toast') {
      // Down in its toaster: just the top of the toast showing over the slot.
      drawSprite(g, set.walk[0], gr.x, gr.y - 6, { anchor: 'feet', alpha: 0.9 })
      return
    }
    if (gr.state === 'cling') {
      // Upside down along the underside of the girder.
      drawSprite(g, set.walk[Math.floor(this.tick / 8) % 2]!, gr.x, gr.y + 7, {
        anchor: 'center',
        flipY: true,
        flipX: gr.dir === -1,
      })
      return
    }
    if (gr.state === 'swim') {
      // Under water: a dim shape and a trail of bubbles.
      drawSprite(g, set.walk[0], gr.x, gr.y + 1, {
        anchor: 'feet',
        flipX: gr.dir === -1,
        alpha: 0.45,
      })
      if (this.tick % 20 < 10) {
        g.fillStyle = rgba('#ffffff', 0.7)
        g.fillRect(
          Math.round(gr.x),
          Math.round(gr.y - 14 - ((this.tick >> 2) % 5)),
          1,
          1,
        )
      }
      return
    }
    if (
      gr.state === 'ghost' ||
      gr.state === 'solid' ||
      gr.state === 'cloud' ||
      gr.state === 'charge'
    ) {
      const frame = Math.floor(this.tick / 8) % 2
      const flip = gr.dir === -1
      if (gr.state === 'ghost') {
        // See-through and drifting: it can't be trapped.
        const alpha = 0.28 + 0.1 * Math.sin(this.tick / 6)
        drawSprite(g, set.walk[frame]!, gr.x, gr.y + 5, { flipX: flip, alpha })
      } else if (gr.state === 'solid') {
        // The tell: it turns opaque.
        glow(g, gr.x, gr.y, 12, RAMPS.cream[3], 0.3)
        drawSprite(g, set.walk[frame]!, gr.x, gr.y + 5, { flipX: flip })
      } else if (gr.state === 'charge') {
        // Storm-dark, crackling: keep off the column beneath it.
        const shake = this.tick % 4 < 2 ? 0 : 1
        glow(g, gr.x, gr.y, 14 + (gr.t % 10), RAMPS.gold[3], 0.5)
        drawSprite(
          g,
          ANGRY_FRAMES[gr.kind].walk[frame]!,
          gr.x + shake,
          gr.y + 5,
          {
            flipX: flip,
          },
        )
        if (this.tick % 6 < 3) {
          g.fillStyle = RAMPS.gold[4]
          g.fillRect(Math.round(gr.x) - 1, Math.round(gr.y) + 10, 2, 4)
        }
      } else {
        drawSprite(g, set.walk[frame]!, gr.x, gr.y + 5, { flipX: flip })
      }
      return
    }
    if (gr.state === 'fly' || gr.state === 'comet') {
      const frame = Math.floor(this.tick / 6) % 2
      if (gr.state === 'comet')
        glow(g, gr.x - gr.dir * 6, gr.y, 12, RAMPS.gold[3], 0.35)
      drawSprite(g, set.walk[frame]!, gr.x, gr.y, { flipX: gr.dir === -1 })
    } else if (gr.state === 'rewind') {
      // Stopped, its key turning round.
      this.castShadow(g, gr.x, gr.y, 6)
      drawSprite(g, set.walk[0], gr.x, gr.y + 1, {
        anchor: 'feet',
        flipX: gr.dir === -1,
      })
      const turn = Math.floor(this.tick / 6) % 2
      g.fillStyle = RAMPS.gold[3]
      g.fillRect(
        Math.round(gr.x - gr.dir * 4) - (turn ? 3 : 0),
        Math.round(gr.y - 16),
        turn ? 7 : 1,
        turn ? 1 : 5,
      )
    } else if (gr.state === 'windup') {
      // The tell: puffed cheeks, or a lens glinting before the beam.
      this.castShadow(g, gr.x, gr.y, 6)
      const sprite = set.puffed ?? set.walk[0]
      const shake = this.tick % 6 < 3 ? 0 : 1
      drawSprite(g, sprite, gr.x + shake, gr.y + 1, {
        anchor: 'feet',
        flipX: gr.dir === -1,
      })
      if (gr.kind === 'grumbler') {
        // The red nose glowing before the puff.
        glow(
          g,
          gr.x + gr.dir * 4,
          gr.y - 9,
          6 + (gr.t % 8),
          RAMPS.ember[2],
          0.6,
        )
      }
      if (gr.kind === 'tick') {
        const lx = Math.round(gr.x + gr.dir * 6)
        const ly = Math.round(gr.y - 13)
        glow(g, lx, ly, 8 + (gr.t % 10), '#ffffff', 0.6)
        g.fillStyle = '#ffffff'
        g.fillRect(lx - 2, ly, 5, 1)
        g.fillRect(lx, ly - 2, 1, 5)
      }
    } else {
      this.castShadow(g, gr.x, gr.y, 6)
      const rising = gr.state === 'rise'
      const moving = gr.onGround && gr.vx !== 0 && this.phase === 'play'
      const frame =
        gr.kind === 'mimic'
          ? disguised(gr)
            ? 0
            : 1
          : moving
            ? Math.floor((this.tick + gr.x) / 8) % 2
            : 0
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
    const grow =
      b.flight > 0 && !b.letter && !b.special
        ? Math.min(1, 0.45 + b.age / 10)
        : 1
    const r = (this.radius(b) + (b.held ? 3 : 0)) * grow
    const warn = b.held !== null && b.holdLeft < 90
    const flicker = warn && Math.floor(this.tick / 4) % 2 === 1
    const tint =
      b.letter !== null
        ? RAMPS.gold[3]
        : b.special
          ? SPECIAL_TINT[b.special]
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
    if (b.vy < 0) {
      // A Fizz rocket's sparkling wake.
      g.fillStyle = rgba(FLAVOUR_RAMPS.fizz[4], 0.7)
      for (let i = 1; i < 4; i++)
        g.fillRect(
          Math.round(b.x + ((b.age + i) % 3) - 1),
          Math.round(b.y + r + i * 3),
          1,
          2,
        )
    }
    this.renderBubbleFilm(g, b.x, b.y, r, tint, flicker)
    if (b.special) drawSprite(g, SPECIAL_ICONS[b.special], b.x, b.y)
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
    hudPanel(g, 85, 2, 84, 20, ramp)
    const shown = Math.min(this.lives, 4)
    const life = robotSprites(0, 'classic').life
    for (let i = 0; i < shown; i++)
      drawSprite(g, life, 89 + i * 11, 3, { anchor: 'topleft' })
    if (this.lives > 4)
      drawText(g, `+${this.lives - 4}`, 133, 4, {
        color: '#ffffff',
        outline: INK,
      })
    // The five recipe cards: lit when found.
    PANTRY_FLOORS.forEach((floor, i) => {
      const found = this.cards.has(floor)
      g.fillStyle = INK
      g.fillRect(140 + i * 5, 4, 5, 7)
      g.fillStyle = found ? RAMPS.cream[3] : rgba('#ffffff', 0.15)
      g.fillRect(141 + i * 5, 5, 3, 5)
      if (found) {
        g.fillStyle = RAMPS.pink[2]
        g.fillRect(141 + i * 5, 5, 3, 1)
      }
    })
    ;[...FRIEND].forEach((ch, i) => {
      const lit = this.letters.has(ch)
      drawText(g, ch, 90 + i * 8, 13, {
        color: lit ? RAMPS.gold[4] : rgba('#ffffff', 0.25),
        outline: lit ? INK : undefined,
      })
    })
    if (this.boost > 0)
      drawText(g, `X${2 ** this.boost}`, 164, 13, {
        align: 'right',
        color: RAMPS.pink[3],
        outline: INK,
      })
    const hi = `HI ${Math.max(this.hiScore, this.score)}`
    // The Map points to the next pantry floor.
    const next = this.robots.some((r) => r.items.includes('map'))
      ? nextPantryFloor(this.level + 1)
      : null
    const fl = this.pantry
      ? 'PANTRY'
      : next
        ? `FLOOR ${this.level} P${next}`
        : `FLOOR ${this.level}`
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
    if (wing.grumps.length)
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
    const tap = wing.tap && wing.tap !== 'classic' ? wing.tap : null
    const special = wing.special
    if (tap) {
      const x = special ? 40 : 70
      drawSprite(g, tapSprite(tap), x, 196, { anchor: 'feet' })
      drawText(g, `${tap.toUpperCase()} TAP`, x + 12, 182, {
        color: FLAVOUR_RAMPS[tap][3],
        outline: INK,
      })
      drawText(g, special ? 'TOUCH IT' : 'TOUCH IT TO CHANGE', x + 12, 191, {
        color: '#ffffff',
        outline: INK,
      })
    }
    if (special) {
      const x = tap ? 136 : 80
      this.renderBubbleFilm(g, x, 188, BUBBLE_R, SPECIAL_TINT[special])
      drawSprite(g, SPECIAL_ICONS[special], x, 188)
      drawText(g, `${special.toUpperCase()} BUBBLES`, x + 12, 182, {
        color: SPECIAL_TINT[special],
        outline: INK,
      })
      drawText(g, 'POP ONE!', x + 12, 191, { color: '#ffffff', outline: INK })
    }
    if (!tap && !special) {
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

const pantryFloors = new Map<PantryDef, Floor>()
/** A pantry room's parse, kept once. */
function pantryFloor(def: PantryDef): Floor {
  let f = pantryFloors.get(def)
  if (!f) {
    f = parseFloor(def.room)
    pantryFloors.set(def, f)
  }
  return f
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
    ...[0, 1, 2].map((page): ArcadeGuidePage => ({
      title: `THE GRUMPS ${page + 1}/3`,
      scale: 1,
      lines: (Object.keys(GRUMPS) as GrumpKind[])
        .slice(page * 8, page * 8 + 8)
        .flatMap((k) => [
          `${GRUMPS[k].name}${GRUMPS[k].tell ? `: ${GRUMPS[k].tell}` : ''}`,
          `  ${GRUMPS[k].answer}`,
        ]),
    })),
    {
      title: 'THE TOWER ENDS AT 100',
      scale: 1,
      lines: [
        'DARK FLOORS: YOUR ANTENNAE GLOW. A LAMP WIDENS THEM.',
        'RAIN FLOORS: A FLASH MEANS A BOLT IS COMING.',
        'THE JELLY MOULD SPLITS: POP THE PIECES AGAINST IT.',
        'THE FIZZ KING: ZAP HIM. CLIMB AHEAD OF THE FIZZ.',
        'CLEAR FLOOR 100 ALONE: THE TOWER RESTARTS.',
        'CLEAR IT WITH A FRIEND: THE TOWER THROWS A PARTY.',
        'FIVE RECIPE CARDS AND A FRIEND: THE TRUE ENDING.',
      ],
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
