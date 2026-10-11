// /utils/arcade/games/sinkSuds.ts
//
// Sink Suds -- the Kind Robots Arcade's riff on the 1982 sink-bubble game
// (conductor kr-arcade/t-009; depth pass t-043.., spec: conductor
// projects/kr-arcade/depth-pass/CABINETS.md section 3, "The Big House Wash").
// You are a soap bubble washing a robot house, room by room
// (utils/arcade/sinkSuds/rooms.ts). Every basin has its own shape and water
// (basins.ts) and starts under a film of grime that comes clean wherever you
// roll. Crumbs, grease and grime feed you; your size is your health (a hit
// shrinks you), your weapon (big bubbles eat mites and tip brushes), your
// ammunition (B blows a soap shot that traps a pest, at the cost of a stage)
// and the drain key (full size opens it). A gives a puff of speed. Power-ups
// float up out of the drain, soap bars buy upgrades in the Soap Shop between
// rooms, and each Wash Cycle ends on a boss. Progress saves at each room.

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
import type { MusicLoop } from '../sound'
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
import type { BasinDef, BasinId, Point } from '../sinkSuds/basins'
import { Grime, SQUEAKY } from '../sinkSuds/grime'
import {
  BRUSH_TURN,
  GREMLIN_OUT,
  GURGLE_TICKS,
  PESTS,
  TIP_TICKS,
  TRAIL_DRAG,
  TRAIL_TICKS,
  TRAP_POINTS,
} from '../sinkSuds/pests'
import type { PestKind, Touch } from '../sinkSuds/pests'
import {
  CYCLES,
  DUCK_PEN,
  PLATE_SPOTS,
  ROOMS,
  ROUNDUP_DUCKS,
  campaignSteps,
  isRoomStart,
} from '../sinkSuds/rooms'
import type { Backdrop, BasinPlan, Box, RoomDef, Step } from '../sinkSuds/rooms'
import {
  BARS,
  BOMB_REACH,
  FLOAT_EVERY,
  FLOAT_LIFE,
  POWERS,
  POWER_KINDS,
  PUFF,
  SHOP_ITEMS,
  SKIN_TINTS,
  SOAP_SHARE,
  SQUEEGEE_BAND,
} from '../sinkSuds/shop'
import type { PowerKind, ShopItem, SkinId } from '../sinkSuds/shop'
import { MUSIC } from '../sinkSuds/music'
import {
  BUMP_POINTS,
  Bristleton,
  DEFEAT_POINTS,
  RING_GAP,
} from '../sinkSuds/bristleton'
import type { BossHost } from '../sinkSuds/bristleton'
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
  clipBasin,
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
import {
  LOOFAH_SPRITE,
  MINIBRUSH_SPRITE,
  SLUG_SPRITES,
  renderBathroom,
  renderDuck,
  renderFloat,
  renderGuard,
  renderIcon,
  renderPlate,
  renderRack,
  renderShop,
  renderSlick,
  renderTrail,
} from '../sinkSuds/roomArt'

export { BASINS, BASIN_PLAYLIST, PESTS, ROOMS, SHOP_ITEMS, TRAP_POINTS }
export type { PestKind }

const ACCEL = 0.09
const MAX_SPEED = 2.3
const START_LIVES = 3
const EXTRA_LIFE_EVERY = 25_000
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
/** Points for finishing a special basin's objective. */
export const SPECIAL_BONUS = 3_000
const HUNT_RANGE = 120
/** Growth for swallowing a pest. */
const EAT_GROWTH = 3
/** Fewer crumbs than this and the tap drips faster. */
const HUNGRY_MESS = 8
/** A slick: faster top speed, slipperier water, a stronger push. */
const SLICK = { cap: 1.45, friction: 0.985, accel: 1.3 }
const PLATE_R = 20
const DUCK_R = 11
/** The Soap Shop closes itself after this long. */
const SHOP_CLOSE = 60 * 45

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
  slugSpeed: { start: 0.3, step: 0.02, limit: 0.6 },
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
  /** A timed power-up it carries (the duck or the magnet). */
  power: { kind: PowerKind; ticks: number } | null
  /** Super Suds: ticks left at full size, and the stage to go back to. */
  superTicks: number
  superFrom: number
  /** Stuck in slug trail this tick. */
  sticky: boolean
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
export type Plate = {
  x: number
  y: number
  vx: number
  vy: number
  dirt: number
}
export type Duck = {
  x: number
  y: number
  vx: number
  vy: number
  /** A bumper bobs round its home; a Round-up duck has none. */
  home: Point | null
  penned: boolean
}
type Blob = { x: number; y: number; life: number }
export type Float = {
  kind: PowerKind | 'soap'
  x: number
  y: number
  vx: number
  vy: number
  life: number
}
type ShopState = { cursor: number; t: number; message: string }

/** A Sink Suds save: where the wash got to, and what the bubble has bought. */
export type SudsSave = {
  v: 1
  /** Campaign step to resume at (a room's first basin, or a boss). */
  step: number
  score: number
  lives: number
  bars: number
  puff: boolean
  stage2: boolean
  shield: number
  skins: SkinId[]
  skin: SkinId
  golden: string[]
}

const SKINS: readonly SkinId[] = ['plain', 'rainbow', 'starry', 'frosted']

/** A stored save, checked against this build; null when unusable. */
export function readSudsSave(raw: unknown): SudsSave | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const count = (v: unknown, max: number) =>
    typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= max
  if (r.v !== 1) return null
  const steps = campaignSteps()
  if (!count(r.step, steps.length - 1)) return null
  const step = steps[r.step as number]
  if (!isRoomStart(step) && step?.kind !== 'boss') return null
  if (
    !count(r.score, 249_999_999) ||
    !count(r.lives, 99) ||
    !count(r.bars, 9_999)
  )
    return null
  const roomIds = new Set(ROOMS.map((room) => room.id))
  const skins = Array.isArray(r.skins)
    ? r.skins.filter((s): s is SkinId => SKINS.includes(s as SkinId))
    : []
  const skin = SKINS.includes(r.skin as SkinId) ? (r.skin as SkinId) : 'plain'
  return {
    v: 1,
    step: r.step as number,
    score: r.score as number,
    lives: Math.max(1, r.lives as number),
    bars: r.bars as number,
    puff: r.puff === true,
    stage2: r.stage2 === true,
    shield: count(r.shield, 1) ? (r.shield as number) : 0,
    skins: [...new Set(skins)],
    skin: skin === 'plain' || skins.includes(skin) ? skin : 'plain',
    golden: Array.isArray(r.golden)
      ? [
          ...new Set(
            r.golden.filter(
              (g): g is string => typeof g === 'string' && roomIds.has(g),
            ),
          ),
        ]
      : [],
  }
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

function inBox(p: Point, box: Box) {
  return (
    p.x >= box.x && p.x <= box.x + box.w && p.y >= box.y && p.y <= box.y + box.h
  )
}

/** The basin the endless sink plays at this level. */
export function basinForLevel(level: number): BasinDef {
  return BASINS[BASIN_PLAYLIST[(level - 1) % BASIN_PLAYLIST.length]!]
}

/** The endless sink's plan for a level: every shape in turn, the pests rising on curves. */
export function endlessPlan(level: number): BasinPlan {
  const n = (spec: { start: number; step: number; limit: number }) =>
    Math.max(0, Math.floor(levelCurve(level, spec)))
  return {
    title: `SINK ${level}`,
    basin: BASIN_PLAYLIST[(level - 1) % BASIN_PLAYLIST.length]! as BasinId,
    pests: {
      mite: n(SUDS_CURVES.mites),
      brush: n(SUDS_CURVES.brushes),
      sponge: n(SUDS_CURVES.sponges),
      gremlin: n(SUDS_CURVES.gremlins),
    },
    mess: n(SUDS_CURVES.messStart),
    drip: Math.round(levelCurve(level, SUDS_CURVES.dripEvery)),
    heat: level,
    dirt: n(SUDS_CURVES.dirt),
    par: 90,
  }
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
    power: null,
    superTicks: 0,
    superFrom: 1,
    sticky: false,
  }
}

const BOSS_PLAN: BasinPlan = {
  title: 'BRISTLETON',
  basin: 'tub',
  pests: {},
  mess: 30,
  drip: 100,
  heat: 5,
  par: 150,
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
  private steps: Step[] = campaignSteps()
  private stepIndex = 0
  private inEndless = false
  private room: RoomDef | null = null
  private plan: BasinPlan = endlessPlan(1)
  private backdrop: Backdrop = 'kitchen'
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
  private plates: Plate[] = []
  private ducks: Duck[] = []
  private trail: Blob[] = []
  private floats: Float[] = []
  private floatTimer = FLOAT_EVERY
  private specialDone = false
  private basinTicks = 0
  private boss: Bristleton | null = null
  private bossDone = 0
  private shop: ShopState | null = null
  private offer: SudsSave | null = null
  private saveData: SudsSave | null = null
  /** Pests flee the bubble while this runs (Lemon Zest). */
  private flee = 0
  private shield = 0
  private bars = 0
  private upgrades = { puff: false, stage2: false }
  private skins = new Set<SkinId>()
  private skin: SkinId = 'plain'
  private golden = new Set<string>()
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
    const stored = this.demo ? null : readSudsSave(options.resume)
    this.beginStep(0)
    if (stored && stored.step > 0) {
      this.offer = stored
      this.saveData = stored
    }
  }

  get save(): SudsSave | null | undefined {
    return this.demo ? undefined : this.saveData
  }

  get music(): MusicLoop | null {
    if (this.over || this.offer) return null
    if (this.shop) return MUSIC.shop
    if (this.boss) return MUSIC.boss
    return MUSIC[this.room?.music ?? 'kitchen']
  }

  /** The first bubble (tests and the pilot read it). */
  private get bubble(): Bubble {
    return this.bubbles[0]!
  }

  private radiusOf(b: Bubble) {
    return STAGE_RADIUS[b.stage]!
  }

  // --- the campaign ------------------------------------------------------------

  /** Start campaign step i: a room's basin, the shop, a boss, or the endless sink. */
  private beginStep(i: number) {
    this.stepIndex = i
    this.shop = null
    this.boss = null
    this.inEndless = false
    const step = this.steps[i]
    if (!step || step.kind === 'endless') {
      this.startLevel(this.level + 1)
      return
    }
    if (step.kind === 'shop') {
      this.shop = { cursor: 0, t: 0, message: '' }
      this.sound.play('start')
      return
    }
    this.level++
    if (step.kind === 'boss') {
      this.room =
        ROOMS.find((r) => r.id === CYCLES[step.cycle]!.rooms.at(-1)) ?? null
      this.startBasin(BOSS_PLAN, 'bath')
      this.boss = new Bristleton()
      this.banner = { text: 'BRISTLETON', sub: 'THE BIG BRUSH', ticks: 150 }
      this.keep()
      return
    }
    const room = ROOMS[step.room]!
    this.room = room
    const plan = room.basins[step.basin]!
    this.startBasin(plan, room.backdrop)
    this.banner = {
      text: plan.title,
      sub: plan.goal ?? `${room.name} ${step.basin + 1}/4`,
      ticks: 120,
    }
    if (step.basin === 0) {
      this.banner = {
        text: room.name,
        sub: `${CYCLES[room.cycle - 1]?.name ?? ''}`,
        ticks: 150,
      }
      this.keep()
    }
  }

  private advance() {
    if (this.inEndless) {
      this.startLevel(this.level + 1)
      return
    }
    this.beginStep(this.stepIndex + 1)
  }

  /** The endless sink at this level (every shape in turn, rising on curves). */
  private startLevel(level: number) {
    this.level = level
    this.room = null
    this.boss = null
    this.shop = null
    this.startBasin(endlessPlan(level), 'kitchen')
    this.inEndless = true
    this.banner = { text: `SINK ${level}`, sub: this.basin.name, ticks: 100 }
  }

  /** Write the save: where the wash is (a room's start or a boss) and what the bubble owns. */
  private keep() {
    if (this.demo) return
    this.saveData = {
      v: 1,
      step: this.stepIndex,
      score: this.score,
      lives: Math.max(1, this.lives),
      bars: this.bars,
      puff: this.upgrades.puff,
      stage2: this.upgrades.stage2,
      shield: this.shield,
      skins: [...this.skins],
      skin: this.skin,
      golden: [...this.golden],
    }
  }

  private resumeFrom(s: SudsSave) {
    this.score = s.score
    this.lives = s.lives
    this.bars = s.bars
    this.upgrades = { puff: s.puff, stage2: s.stage2 }
    this.shield = s.shield
    this.skins = new Set(s.skins)
    this.skin = s.skin
    this.golden = new Set(s.golden)
    this.nextExtra =
      (Math.floor(s.score / EXTRA_LIFE_EVERY) + 1) * EXTRA_LIFE_EVERY
    this.level = this.steps
      .slice(0, s.step)
      .filter((st) => st.kind === 'basin' || st.kind === 'boss').length
    this.beginStep(s.step)
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

  /** Lay out a basin from its plan: grime, mess, pests, props and the special's pieces. */
  private startBasin(plan: BasinPlan, backdrop: Backdrop) {
    this.plan = plan
    this.backdrop = backdrop
    this.basin = BASINS[plan.basin]
    this.grime = new Grime(this.basin, plan.dirt ?? 1)
    this.spin = 0
    this.mess = []
    this.pests = []
    this.shots = []
    this.drips = []
    this.trail = []
    this.floats = []
    this.plates = []
    this.ducks = []
    this.floatTimer = FLOAT_EVERY
    this.specialDone = false
    this.basinTicks = 0
    this.draining = 0
    this.chain = 0
    this.chainTimer = 0
    this.flee = 0
    this.bossDone = 0
    this.pilotGoal = null
    const startStage = this.upgrades.stage2 ? 2 : 1
    for (const b of this.bubbles) {
      Object.assign(b, {
        x: this.basin.start.x,
        y: this.basin.start.y,
        vx: 0,
        vy: 0,
        stage: startStage,
        growth: 0,
        scrub: 0,
        invuln: 90,
        power: null,
        superTicks: 0,
      })
    }
    const home = this.basin.start
    for (let i = 0; i < plan.mess; i++) this.addMess()
    const keep: Record<PestKind, number> = {
      mite: 90,
      brush: 140,
      sponge: 120,
      gremlin: 0,
      slug: 110,
      loofah: 130,
      minibrush: 120,
    }
    for (const [kind, n] of Object.entries(plan.pests) as [
      PestKind,
      number,
    ][]) {
      for (let i = 0; i < n; i++) {
        if (kind === 'gremlin') {
          const g = this.newPest('gremlin', this.basin.drain)
          g.state = 'hidden'
          g.t = Math.round(levelCurve(plan.heat, SUDS_CURVES.gremlinRest))
          this.pests.push(g)
          continue
        }
        this.pests.push(
          this.newPest(
            kind,
            this.spot(PESTS[kind].radius + 12, home, keep[kind]),
          ),
        )
      }
    }
    for (const at of plan.ducks ?? [])
      this.ducks.push({
        x: at.x,
        y: at.y,
        vx: 0,
        vy: 0,
        home: at,
        penned: false,
      })
    if (plan.special === 'dish-stack') {
      for (const at of PLATE_SPOTS) {
        const a = this.rng() * Math.PI * 2
        this.plates.push({
          x: at.x,
          y: at.y,
          vx: Math.cos(a) * 0.25,
          vy: Math.sin(a) * 0.25,
          dirt: 1,
        })
      }
    }
    if (plan.special === 'duck-roundup') {
      for (const at of ROUNDUP_DUCKS)
        this.ducks.push({
          x: at.x,
          y: at.y,
          vx: 0,
          vy: 0,
          home: null,
          penned: false,
        })
    }
    this.dripTimer = plan.drip
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.chainTimer > 0 && --this.chainTimer === 0) this.chain = 0
    if (this.over) return
    if (this.offer) {
      if (input.pressed.a || input.pressed.start) {
        const s = this.offer
        this.offer = null
        this.resumeFrom(s)
      } else if (input.pressed.b) {
        // A new wash: the golden soaps and skins stay, the house starts dirty again.
        this.offer = null
        this.saveData = null
      }
      return
    }
    if (this.lives <= 0 && !this.bubbles.some((b) => b.alive)) {
      if (++this.overTimer > 100) this.over = true
      return
    }
    if (this.shop) {
      this.updateShop(this.demo ? this.shopPilot() : input)
      return
    }
    if (this.draining > 0) {
      this.updateDraining()
      return
    }
    if (this.bossDone > 0) {
      if (--this.bossDone === 0) this.advance()
      return
    }
    for (const b of this.bubbles) {
      if (b.alive || this.lives <= 0) continue
      if (--b.respawn <= 0) this.revive(b)
    }
    if (!this.bubbles.some((b) => b.alive)) return

    this.basinTicks++
    const controls = this.demo ? this.demoInput() : input
    this.updateWater()
    for (const b of this.bubbles) if (b.alive) this.moveBubble(b, controls)
    this.carryMess()
    this.updateDucks()
    this.updatePlates()
    this.movePests()
    this.moveShots()
    this.moveDrips()
    this.updateFloats()
    this.updateBoss()
    for (const b of this.bubbles) if (b.alive) this.collide(b)
  }

  private updateDraining() {
    // Spiral down the drain, then rinse into the next basin.
    this.draining++
    const t = this.draining / 70
    const d = this.basin.drain
    for (const b of this.bubbles) {
      b.x = d.x + Math.cos(this.draining / 4) * 20 * (1 - t)
      b.y = d.y + Math.sin(this.draining / 4) * 20 * (1 - t)
    }
    if (this.draining <= 70) return
    const left = this.mess.length
    const percent = this.grime.percent
    const squeaky = percent >= SQUEAKY
    const bonus = Math.max(0, 1000 * this.level - left * 50) + percent * 20
    this.addScore(bonus + (squeaky ? SQUEAKY_BONUS : 0), W / 2, H / 2 - 40)
    let bars = BARS.basin + (squeaky ? BARS.squeaky : 0)
    let golden = false
    if (this.plan.special) {
      bars += BARS.special
      if (squeaky && this.room && !this.golden.has(this.room.id)) {
        this.golden.add(this.room.id)
        golden = true
      }
    }
    if (!this.demo) this.bars += bars
    this.advance()
    if (golden)
      this.banner = {
        text: 'GOLDEN SOAP!',
        sub: 'HIDDEN IN THE SUDS',
        ticks: 150,
      }
    else if (squeaky)
      this.banner = {
        text: 'SQUEAKY CLEAN!',
        sub: this.banner?.sub,
        ticks: 120,
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
    const slick = this.plan.slicks?.some((s) => inBox(b, s)) ?? false
    const grip =
      this.basin.grip * (slick ? SLICK.accel : 1) * (b.sticky ? 0.5 : 1)
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
    const puff = this.upgrades.puff ? PUFF.long : PUFF.base
    if (b.puff > 0) b.puff--
    if (
      input.pressed.a &&
      b.puff === 0 &&
      (len || Math.hypot(b.vx, b.vy) > 0.2)
    ) {
      const sp = Math.hypot(b.vx, b.vy) || 1
      const dx = len ? ax / len : b.vx / sp
      const dy = len ? ay / len : b.vy / sp
      b.vx = dx * puff.speed
      b.vy = dy * puff.speed
      b.puff = puff.cooldown
      this.sound.play('blip')
    }
    if (input.pressed.b) this.fireShot(b)
    const speed = Math.hypot(b.vx, b.vy)
    const cap =
      (b.puff > puff.cooldown - 15 ? puff.speed : MAX_SPEED) *
      (slick ? SLICK.cap : 1)
    if (speed > cap) {
      b.vx *= cap / speed
      b.vy *= cap / speed
    }
    const friction = slick ? SLICK.friction : this.basin.friction
    b.vx *= friction
    b.vy *= friction
    // Scum slug trail: sticky going.
    b.sticky = this.trail.some((t) => dist(t, b) < this.radiusOf(b) + 4)
    if (b.sticky) {
      b.vx *= TRAIL_DRAG
      b.vy *= TRAIL_DRAG
    }
    b.x += b.vx
    b.y += b.vy
    keepInside(this.basin, b, this.radiusOf(b))
    b.wobble += 0.12 + speed * 0.05
    if (b.invuln > 0) b.invuln--
    if (b.hurt > 0) b.hurt--
    if (b.power && --b.power.ticks <= 0) b.power = null
    if (b.superTicks > 0 && --b.superTicks === 0) {
      b.stage = Math.min(b.stage, b.superFrom)
      b.growth = 0
    }
    // Wherever the bubble rolls, the basin comes clean, and the grime feeds it.
    this.scrubFor(b, this.grime.scrub(b.x, b.y, this.radiusOf(b)))
  }

  /** Credit a bubble with grime it scrubbed: a point a cell, and growth. */
  private scrubFor(b: Bubble, cleaned: number) {
    if (!cleaned) return
    this.addScore(cleaned)
    b.scrub += cleaned
    while (b.scrub >= SCRUB_PER_GROWTH) {
      b.scrub -= SCRUB_PER_GROWTH
      this.grow(b, 1)
    }
  }

  /** B: blow a soap shot the way the bubble faces, paying a stage of growth for it. */
  private fireShot(b: Bubble) {
    if (b.stage < SHOT_STAGE) {
      this.sound.play('warn')
      return
    }
    b.stage--
    if (b.superTicks > 0) b.superFrom = Math.min(b.superFrom, b.stage)
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
    if (kind === 'spin' || kind === 'conveyor') {
      for (const m of this.mess) {
        const to = carry(this.basin, m, this.spin)
        m.x = to.x
        m.y = to.y
        if (!insideBasin(this.basin, m.x, m.y, 6))
          keepInside(this.basin, m, 6, 0)
      }
    }
    // The Magnet Sponge pulls crumbs in.
    for (const b of this.bubbles) {
      if (!b.alive || b.power?.kind !== 'magnet') continue
      for (const m of this.mess) {
        const d = dist(m, b)
        if (d < 130 && d > 1) {
          m.x += ((b.x - m.x) / d) * 1.4
          m.y += ((b.y - m.y) / d) * 1.4
        }
      }
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

  // --- props and the special basins -----------------------------------------------

  /** Rubber ducks: bumpers bob round home; Round-up ducks drift on the current until penned. */
  private updateDucks() {
    for (const d of this.ducks) {
      if (d.penned) continue
      if (d.home) {
        d.vx += (d.home.x - d.x) * 0.02
        d.vy += (d.home.y - d.y) * 0.02
        d.vx *= 0.85
        d.vy *= 0.85
      } else {
        const flow = flowAt(this.basin, d.x, d.y, this.spin)
        d.vx = (d.vx + flow.x * 0.35) * 0.97
        d.vy = (d.vy + flow.y * 0.35) * 0.97
        // Loose ducks jostle apart rather than stacking up.
        for (const o of this.ducks) {
          if (o === d) continue
          const dd = dist(o, d)
          if (dd < DUCK_R * 2 && dd > 0.01) {
            d.x += ((d.x - o.x) / dd) * (DUCK_R * 2 - dd) * 0.5
            d.y += ((d.y - o.y) / dd) * (DUCK_R * 2 - dd) * 0.5
          }
        }
      }
      d.x += d.vx
      d.y += d.vy
      // Loose ducks bob a little off the wall, where a bubble can get round them.
      keepInside(this.basin, d, d.home ? DUCK_R : DUCK_R + 12, 1.4)
      for (const b of this.bubbles) {
        if (!b.alive) continue
        const r = this.radiusOf(b) + DUCK_R
        const dd = dist(d, b)
        if (dd >= r || dd < 0.01) continue
        const nx = (d.x - b.x) / dd
        const ny = (d.y - b.y) / dd
        const push = r - dd
        if (d.home) {
          // A bumper: the bubble bounces off.
          b.x -= nx * push
          b.y -= ny * push
          const dot = b.vx * nx + b.vy * ny
          if (dot > 0) {
            b.vx -= 2.2 * dot * nx
            b.vy -= 2.2 * dot * ny
          }
          if (dot > 0.5) this.sound.play('blip')
        } else {
          // A Round-up duck: nudged along the way the bubble pushes it.
          d.x += nx * push
          d.y += ny * push
          const dot = Math.max(0, b.vx * nx + b.vy * ny)
          d.vx += nx * (dot * 0.9 + 0.2)
          d.vy += ny * (dot * 0.9 + 0.2)
          b.vx *= 0.9
          b.vy *= 0.9
        }
      }
      if (
        !d.home &&
        this.plan.special === 'duck-roundup' &&
        dist(d, DUCK_PEN) < DUCK_PEN.r - 8
      ) {
        d.penned = true
        d.vx = 0
        d.vy = 0
        this.addScore(500, d.x, d.y - 12)
        this.fx.burst(d.x, d.y, this.fxRng, { count: 10 })
        this.sound.play('pickup')
        if (this.ducks.every((x) => x.penned || x.home)) this.completeSpecial()
      }
    }
  }

  /** Dish Stack's plates drift about; a bubble sitting on one scrubs it. */
  private updatePlates() {
    for (const p of this.plates) {
      p.x += p.vx
      p.y += p.vy
      keepInside(this.basin, p, PLATE_R, 2)
      if (p.dirt <= 0) continue
      for (const b of this.bubbles) {
        if (!b.alive || dist(p, b) > PLATE_R + this.radiusOf(b) * 0.4) continue
        p.dirt -= 0.003 + b.stage * 0.0015
        if (this.tick % 6 === 0)
          this.fx.burst(p.x, p.y, this.fxRng, { count: 1, speed: 0.6 })
        if (p.dirt <= 0) {
          p.dirt = 0
          this.addScore(250, p.x, p.y - 16)
          this.sound.play('pickup')
          if (this.plates.every((x) => x.dirt <= 0)) this.completeSpecial()
        }
      }
    }
  }

  private completeSpecial() {
    if (this.specialDone) return
    this.specialDone = true
    this.addScore(SPECIAL_BONUS, W / 2, H / 2)
    this.sound.play('level')
    this.banner = { text: 'ALL DONE!', sub: 'THE DRAIN IS OPEN', ticks: 120 }
  }

  /** Can this bubble go down the drain now? */
  private drainOpenFor(b: Bubble) {
    if (this.boss) return false
    if (this.plan.special) return this.specialDone
    return b.stage >= MAX_STAGE
  }

  // --- power-ups and soap bars ---------------------------------------------------

  private updateFloats() {
    if (this.flee > 0) this.flee--
    if (--this.floatTimer <= 0) {
      this.floatTimer = FLOAT_EVERY
      if (this.floats.length < 2) {
        const kind =
          this.rng() < SOAP_SHARE
            ? 'soap'
            : POWER_KINDS[Math.floor(this.rng() * POWER_KINDS.length)]!
        const a = this.rng() * Math.PI * 2
        this.floats.push({
          kind,
          x: this.basin.drain.x,
          y: this.basin.drain.y,
          vx: Math.cos(a) * 1.1,
          vy: Math.sin(a) * 1.1,
          life: FLOAT_LIFE,
        })
        this.sound.play('blip')
      }
    }
    for (const f of this.floats) {
      f.x += f.vx
      f.y += f.vy
      f.vx *= 0.985
      f.vy *= 0.985
      keepInside(this.basin, f, 12, 1.8)
      f.life--
      for (const b of this.bubbles) {
        if (!b.alive || f.life <= 0) continue
        if (dist(f, b) < this.radiusOf(b) + 10) {
          this.pickUp(b, f.kind)
          f.life = 0
        }
      }
    }
    this.floats = this.floats.filter((f) => f.life > 0)
  }

  private pickUp(b: Bubble, kind: PowerKind | 'soap') {
    this.sound.play('pickup')
    this.fx.burst(b.x, b.y, this.fxRng, { count: 10 })
    if (kind === 'soap') {
      if (!this.demo) this.bars++
      this.floaters.push({
        x: b.x,
        y: b.y - 20,
        text: 'SOAP BAR!',
        life: 50,
        color: RAMPS.pink[3],
      })
      return
    }
    const def = POWERS[kind]
    this.floaters.push({
      x: b.x,
      y: b.y - 20,
      text: def.name,
      life: 60,
      color: RAMPS.gold[4],
    })
    switch (kind) {
      case 'lemon':
        this.flee = def.ticks
        return
      case 'supersuds':
        if (b.superTicks <= 0) b.superFrom = b.stage
        b.superTicks = def.ticks
        b.stage = MAX_STAGE
        return
      case 'squeegee': {
        // A wipe right across the basin at the bubble's height.
        const { x0, x1 } = basinBounds(this.basin)
        let cleaned = 0
        for (let x = x0; x <= x1; x += 4)
          cleaned += this.grime.scrub(x, b.y, SQUEEGEE_BAND / 2)
        this.scrubFor(b, cleaned)
        for (let x = x0; x <= x1; x += 24)
          this.fx.burst(x, b.y, this.fxRng, { count: 1, speed: 0.5 })
        return
      }
      case 'bathbomb':
        for (const p of this.pests)
          if (
            this.solid(p) &&
            PESTS[p.kind].trappable &&
            dist(p, b) < BOMB_REACH
          )
            this.trapPest(p)
        this.fx.burst(b.x, b.y, this.fxRng, {
          count: 24,
          speed: 2.4,
          colours: [RAMPS.pink[3], RAMPS.purple[3], '#ffffff'],
        })
        return
      default:
        b.power = { kind, ticks: def.ticks }
    }
  }

  // --- pests -------------------------------------------------------------------

  private movePests() {
    for (const p of this.pests) {
      if (p.trap) {
        this.driftTrapped(p)
        continue
      }
      if (this.flee > 0 && this.solid(p)) this.fleeFrom(p)
      else if (p.kind === 'mite') this.moveMite(p)
      else if (p.kind === 'brush')
        this.moveBrush(
          p,
          HUNT_RANGE,
          levelCurve(this.plan.heat, SUDS_CURVES.brushSpeed),
        )
      else if (p.kind === 'minibrush') this.moveBrush(p, 90, 0.95)
      else if (p.kind === 'sponge')
        this.moveSponge(p, levelCurve(this.plan.heat, SUDS_CURVES.spongeSpeed))
      else if (p.kind === 'loofah') this.moveSponge(p, 0.22)
      else if (p.kind === 'slug') this.moveSlug(p)
      else this.moveGremlin(p)
      const rule = PESTS[p.kind]
      if (rule.cleans && p.state !== 'tipped')
        this.grime.scrub(p.x, p.y, rule.cleans)
      if (rule.eatsMess && p.state !== 'tipped') {
        const eaten = this.mess.findIndex((m) => dist(m, p) < rule.radius + 2)
        if (eaten >= 0) this.mess.splice(eaten, 1)
      }
      this.guardShove(p)
    }
    this.pests = this.pests.filter(
      (p) => !(p.trap && dist(p, this.basin.drain) < 6),
    )
    for (const t of this.trail) t.life--
    this.trail = this.trail.filter((t) => t.life > 0)
  }

  /** The Rubber Duck bodyguard shoves away any pest it meets. */
  private guardShove(p: Pest) {
    if (!this.solid(p)) return
    for (const b of this.bubbles) {
      if (!b.alive || b.power?.kind !== 'duck') continue
      const g = this.guardAt(b)
      const d = dist(g, p)
      if (d > PESTS[p.kind].radius + DUCK_R || d < 0.01) continue
      p.x += ((p.x - g.x) / d) * 6
      p.y += ((p.y - g.y) / d) * 6
      p.heading = Math.atan2(p.y - b.y, p.x - b.x)
      keepInside(this.basin, p, PESTS[p.kind].radius + 2, 0)
      if (this.tick % 8 === 0) this.sound.play('blip')
    }
  }

  private guardAt(b: Bubble): Point {
    const a = this.tick * 0.08
    const r = this.radiusOf(b) + 16
    return { x: b.x + Math.cos(a) * r, y: b.y + Math.sin(a) * r }
  }

  /** Lemon Zest: every pest scurries away from the nearest bubble. */
  private fleeFrom(p: Pest) {
    if (p.kind === 'gremlin' && (p.state === 'hidden' || p.state === 'gurgle'))
      return
    const b = this.nearestBubble(p)
    if (!b) return
    const a = Math.atan2(p.y - b.y, p.x - b.x)
    p.heading = a
    p.vx = Math.cos(a) * 1.1
    p.vy = Math.sin(a) * 1.1
    p.x += p.vx
    p.y += p.vy
    keepInside(this.basin, p, PESTS[p.kind].radius + 2, 2)
  }

  /** A trapped pest floats to the drain and goes down it for the chain it was caught on. */
  private driftTrapped(p: Pest) {
    const d = this.basin.drain
    const a = Math.atan2(d.y - p.y, d.x - p.x)
    const flow = flowAt(this.basin, p.x, p.y, this.spin)
    p.x += Math.cos(a) * 0.9 + flow.x * 8
    p.y += Math.sin(a) * 0.9 + flow.y * 8
    if (dist(p, d) < 6) {
      this.addScore(
        TRAP_POINTS * p.trap * (PESTS[p.kind].trapBonus ?? 1),
        d.x,
        d.y - 16,
      )
      this.fx.burst(d.x, d.y, this.fxRng, { count: 12 })
      this.sound.play('pickup')
    }
  }

  private moveMite(m: Pest) {
    const speed = levelCurve(this.plan.heat, SUDS_CURVES.miteSpeed)
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

  private moveBrush(br: Pest, range: number, speed: number) {
    if (br.state === 'tipped') {
      if (--br.t <= 0) {
        br.state = 'roam'
        this.sound.play('warn')
      }
      return
    }
    // Brushes turn toward a bubble that comes close, otherwise scrub toward the mess.
    const prey = this.nearestBubble(br)
    let target: Point | null = prey && dist(prey, br) < range ? prey : null
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
    if (keepInside(this.basin, br, PESTS[br.kind].radius + 4, 2)) {
      br.heading = Math.atan2(br.vy, br.vx)
      br.target = null
    }
  }

  /** Sponges and loofahs: slow cleaners heading for the mess, soaking up grime on the way. */
  private moveSponge(s: Pest, speed: number) {
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
    if (keepInside(this.basin, s, PESTS[s.kind].radius + 4, 2)) s.target = null
  }

  /** The scum slug crawls about, leaving a sticky trail. */
  private moveSlug(s: Pest) {
    const speed = levelCurve(this.plan.heat, SUDS_CURVES.slugSpeed)
    if (--s.turn <= 0) {
      s.target = this.spot(20)
      s.turn = 120 + Math.floor(this.rng() * 80)
    }
    if (s.target)
      s.heading = angleTo(
        s.heading,
        Math.atan2(s.target.y - s.y, s.target.x - s.x),
        0.03,
      )
    s.vx = Math.cos(s.heading) * speed
    s.vy = Math.sin(s.heading) * speed
    s.x += s.vx
    s.y += s.vy
    if (keepInside(this.basin, s, 10, 2)) s.turn = 0
    if (this.tick % 10 === 0)
      this.trail.push({ x: s.x, y: s.y + 2, life: TRAIL_TICKS })
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
    const speed = levelCurve(this.plan.heat, SUDS_CURVES.gremlinSpeed)
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
        g.t = Math.round(levelCurve(this.plan.heat, SUDS_CURVES.gremlinRest))
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

  // --- the boss ----------------------------------------------------------------

  private bossHost(): BossHost {
    return {
      rng: this.rng,
      radiusOf: (b) => this.radiusOf(b as Bubble),
      hit: (b, from, soak) =>
        this.hurtBubble(b as Bubble, soak ? 'soak' : 'hit', from),
      bumped: (b, at) => {
        const bubble = b as Bubble
        this.addScore(BUMP_POINTS, at.x, at.y - 20)
        bubble.superTicks = 0
        bubble.stage = Math.min(bubble.stage, 3)
        bubble.growth = 0
        bubble.invuln = 60
        this.fx.burst(at.x, at.y, this.fxRng, { count: 16 })
      },
      shed: (at) => {
        const p = this.newPest('minibrush', at)
        keepInside(this.basin, p, 12, 0)
        this.pests.push(p)
      },
      dropCrumbs: (at, count) => {
        for (let i = 0; i < count; i++) {
          const p = {
            x: at.x + (this.rng() * 2 - 1) * 60,
            y: at.y + (this.rng() * 2 - 1) * 50,
          }
          keepInside(this.basin, p, 12, 0)
          this.addMess(p)
        }
      },
      sound: (name) => this.sound.play(name),
      minis: () =>
        this.pests.filter((p) => p.kind === 'minibrush' && !p.trap).length,
    }
  }

  private updateBoss() {
    const boss = this.boss
    if (!boss) return
    boss.update(this.bossHost(), this.bubbles)
    if (boss.done && this.bossDone === 0) {
      this.addScore(DEFEAT_POINTS, W / 2, H / 2 - 30)
      if (!this.demo) this.bars += BARS.boss
      this.pests = this.pests.filter((p) => p.kind !== 'minibrush')
      this.banner = {
        text: 'TIPPED IN!',
        sub: 'BRISTLETON IS ALL WASHED UP',
        ticks: 160,
      }
      this.sound.play('extra')
      this.bossDone = 160
    }
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
      this.dripTimer = this.plan.drip
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
        if (!this.plan.special && !this.boss) {
          this.banner = {
            text: 'FULL OF SUDS!',
            sub: 'SAIL DOWN THE DRAIN',
            ticks: 120,
          }
          this.sound.play('level')
        }
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
    if (this.drainOpenFor(b) && dist(b, this.basin.drain) < 17) {
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
        if (p.kind === 'mite') this.addMess()
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
      // Scared pests (Lemon Zest) are all bluster.
      if (b.invuln > 0 || this.flee > 0) continue
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
   * on a big bubble splashes off two, and a hit on a small one pops it. A
   * Sturdy Film or Super Suds takes the hit instead.
   */
  private hurtBubble(b: Bubble, touch: Touch, from: Point) {
    if (b.invuln > 0) return
    const a = Math.atan2(b.y - from.y, b.x - from.x)
    const knock = () => {
      b.vx = Math.cos(a) * 3
      b.vy = Math.sin(a) * 3
    }
    if (b.superTicks > 0 || this.shield > 0) {
      if (b.superTicks > 0) {
        b.superTicks = 0
        b.stage = b.superFrom
      } else this.shield--
      b.invuln = 90
      b.hurt = 20
      knock()
      this.sound.play('warn')
      this.floaters.push({
        x: b.x,
        y: b.y - 20,
        text: 'SAVED!',
        life: 45,
        color: RAMPS.teal[4],
      })
      return
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
    b.power = null
    b.superTicks = 0
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
      stage: Math.max(this.upgrades.stage2 ? 2 : 1, b.stage - 1),
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

  // --- the Soap Shop -------------------------------------------------------------

  private owns(item: ShopItem): boolean {
    if (item.id === 'puff') return this.upgrades.puff
    if (item.id === 'stage2') return this.upgrades.stage2
    if (item.id === 'rainbow' || item.id === 'starry' || item.id === 'frosted')
      return this.skins.has(item.id)
    return false
  }

  /** The next room's golden soap hint (or the boss's room when a boss is next). */
  private nextHint(): string {
    for (let i = this.stepIndex + 1; i < this.steps.length; i++) {
      const s = this.steps[i]!
      if (s.kind !== 'basin') continue
      const room = ROOMS[s.room]!
      if (this.golden.has(room.id)) continue
      return `${room.name}: ${room.hint}`
    }
    return 'NO GOLDEN SOAP LEFT TO FIND HERE'
  }

  private updateShop(input: InputFrame) {
    const s = this.shop!
    s.t++
    const n = SHOP_ITEMS.length
    if (input.pressed.up) {
      s.cursor = (s.cursor + n - 1) % n
      s.message = ''
      this.sound.play('blip')
    }
    if (input.pressed.down) {
      s.cursor = (s.cursor + 1) % n
      s.message = ''
      this.sound.play('blip')
    }
    if (input.pressed.a && s.t > 20) this.buy(SHOP_ITEMS[s.cursor]!)
    if (
      this.shop &&
      (input.pressed.b || input.pressed.start || s.t > SHOP_CLOSE)
    )
      this.leaveShop()
  }

  private buy(item: ShopItem) {
    const s = this.shop!
    if (item.id === 'done') {
      this.leaveShop()
      return
    }
    if (this.owns(item)) {
      if (
        item.id === 'rainbow' ||
        item.id === 'starry' ||
        item.id === 'frosted'
      ) {
        this.skin = this.skin === item.id ? 'plain' : item.id
        s.message =
          this.skin === 'plain'
            ? 'BACK TO THE PLAIN FILM'
            : `WEARING ${item.name}`
        this.sound.play('blip')
      } else s.message = 'ALREADY YOURS'
      return
    }
    if (item.id === 'sturdy' && this.shield > 0) {
      s.message = 'YOUR FILM IS ALREADY STURDY'
      return
    }
    if (this.bars < item.price) {
      s.message = 'NOT ENOUGH SOAP BARS'
      this.sound.play('warn')
      return
    }
    this.bars -= item.price
    this.sound.play('pickup')
    switch (item.id) {
      case 'spare':
        this.lives++
        s.message = 'ONE MORE BUBBLE'
        break
      case 'puff':
        this.upgrades.puff = true
        s.message = 'PUFF, PUFF, AWAY!'
        break
      case 'stage2':
        this.upgrades.stage2 = true
        s.message = 'EVERY BASIN STARTS AT SIZE 2'
        break
      case 'sturdy':
        this.shield = 1
        s.message = 'THE NEXT HIT IS FREE'
        break
      case 'hint':
        s.message = this.nextHint()
        break
      default:
        this.skins.add(item.id as SkinId)
        this.skin = item.id as SkinId
        s.message = `WEARING ${item.name}`
    }
  }

  private leaveShop() {
    this.shop = null
    this.sound.play('start')
    this.advance()
  }

  /** The attract pilot's shopping: a spare bubble when it can, then back to work. */
  private shopPilot(): InputFrame {
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
    const s = this.shop!
    if (s.t % 15 !== 0 || s.t < 40) return frame
    const want = this.bars >= 6 ? 0 : SHOP_ITEMS.length - 1
    if (s.cursor !== want) frame.pressed.down = true
    else frame.pressed.a = true
    return frame
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
    if (this.shop) return this.shopPilot()
    const b = this.bubble
    if (!b.alive) return frame
    const r = this.radiusOf(b)
    let goal: Point | null = null
    let pushing = false
    if (this.drainOpenFor(b)) goal = this.basin.drain
    else if (this.boss && b.stage >= MAX_STAGE) goal = this.boss.bumpSpot(r)
    if (!goal && this.plan.special === 'dish-stack') {
      let best = Infinity
      for (const p of this.plates) {
        const d = dist(p, b)
        if (p.dirt > 0 && d < best) {
          best = d
          goal = p
        }
      }
    }
    if (!goal && this.plan.special === 'duck-roundup') {
      // Get behind the nearest loose duck and push it toward the pen.
      let best = Infinity
      let duck: Duck | null = null
      for (const d of this.ducks) {
        const dd = dist(d, b)
        if (!d.penned && !d.home && dd < best) {
          best = dd
          duck = d
        }
      }
      if (duck) {
        // Push toward the pen; a duck against the wall gets worked along it instead.
        const base = Math.atan2(duck.y - DUCK_PEN.y, duck.x - DUCK_PEN.x)
        const reach = r + DUCK_R + 3
        let behind: Point | null = null
        for (const turn of [0, 0.5, -0.5, 1, -1, 1.5, -1.5, 2, -2, 2.4, -2.4]) {
          const at = {
            x: duck.x + Math.cos(base + turn) * reach,
            y: duck.y + Math.sin(base + turn) * reach,
          }
          if (insideBasin(this.basin, at.x, at.y, r * 0.7)) {
            behind = at
            break
          }
        }
        if (behind) {
          const through = {
            x: duck.x + (duck.x - behind.x) * 3,
            y: duck.y + (duck.y - behind.y) * 3,
          }
          pushing = dist(behind, b) <= 9
          goal = pushing ? through : behind
        }
      }
    }
    if (!goal) {
      const float = this.floats.find((f) => dist(f, b) < 120)
      const food = this.nearestMess(b)
      if (float) goal = float
      else if (food && dist(food, b) < 140) goal = food
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
    if (goal && this.basin.gaps && !clearPath(this.basin, b, goal, r)) {
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
    if (this.flee <= 0 && b.superTicks <= 0) {
      for (const p of this.pests) {
        if (!this.solid(p)) continue
        const rule = PESTS[p.kind]
        if (rule.edibleFrom && b.stage >= rule.edibleFrom) continue
        if (p.kind === 'brush' && p.state === 'tipped') continue
        threats.push(p)
      }
    }
    const gurgling = this.pests.some(
      (p) =>
        p.kind === 'gremlin' &&
        (p.state === 'gurgle' || (p.state === 'hidden' && p.t < 40)),
    )
    if (gurgling) threats.push(this.basin.drain)
    if (this.boss) {
      threats.push(...this.boss.threats())
      // A suds ring coming: slide round to the nearer of its gaps.
      for (const ring of this.boss.rings) {
        const d = dist(ring, b)
        if (d - ring.r < -4 || d - ring.r > 90) continue
        const a = Math.atan2(b.y - ring.y, b.x - ring.x)
        let off = a - ring.gap
        while (off > Math.PI / 2) off -= Math.PI
        while (off < -Math.PI / 2) off += Math.PI
        if (Math.abs(off) < RING_GAP * 0.5) continue
        const side = off > 0 ? -1 : 1
        steerX += -Math.sin(a) * side * 1.5
        steerY += Math.cos(a) * side * 1.5
      }
    }
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
    // Slug trail: steer round the nearest blob of it.
    for (const t of this.trail) {
      const d = dist(t, b) || 1
      if (d < r + 14) {
        steerX += ((b.x - t.x) / d) * 0.4
        steerY += ((b.y - t.y) / d) * 0.4
      }
    }
    // Something about to touch: puff clear of it, along the wall if the wall is behind.
    if (closest < r + 26 && b.puff === 0) {
      const ahead = { x: b.x + fleeX * 30, y: b.y + fleeY * 30 }
      if (!insideBasin(this.basin, ahead.x, ahead.y, r)) {
        const side = fleeX * steerY - fleeY * steerX >= 0 ? 1 : -1
        const fx = -fleeY * side
        fleeY = fleeX * side
        fleeX = fx
      }
      steerX = fleeX * 2
      steerY = fleeY * 2
      held.a = true
      frame.pressed.a = true
    } else if (pushing && b.puff === 0 && this.tick % 40 === 0) {
      held.a = true
      frame.pressed.a = true
    }
    // Trap a pest lined up ahead, while there is size to spare (never while saving up for a bump).
    if (b.stage >= 4 && !this.boss) {
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
    if (this.backdrop === 'bath') renderBathroom(g, this.basin)
    else renderKitchen(g, this.basin)
    renderBasin(g, this.basin, this.tick, this.drumAngle)
    this.grimeLayer.draw(g, this.grime, this.basin)
    for (const s of this.plan.slicks ?? []) renderSlick(g, s, this.tick)
    if (this.plan.special === 'duck-roundup') this.renderPen(g)
    renderFaucet(g, this.basin)
    renderDial(g, this.basin, this.tick)
    const gurgle = this.pests.some(
      (p) => p.kind === 'gremlin' && p.state === 'gurgle',
    )
    renderDrain(
      g,
      this.basin,
      this.tick,
      this.bubbles.some((b) => b.alive && this.drainOpenFor(b)),
      gurgle ? 1 : 0,
    )
    for (const t of this.trail) renderTrail(g, t.x, t.y, t.life)
    for (const m of this.mess) this.renderMess(g, m)
    for (const p of this.plates)
      renderPlate(g, p.x, p.y, PLATE_R, p.dirt, PLATE_SPOTS.length)
    for (const d of this.drips) drawSprite(g, DRIP_SPRITE, d.x, d.y)
    for (const p of this.pests) if (!p.trap) this.renderPest(g, p)
    if (this.plan.shadows) renderRack(g, this.plan.shadows)
    for (const d of this.ducks)
      renderDuck(g, d.x, d.y, this.tick, d.penned, d.vx > 0.05)
    for (const f of this.floats)
      renderFloat(g, f.kind, f.x, f.y, this.tick, f.life)
    if (this.boss) {
      // The brush and its rings dip under the rim rather than over the floor.
      g.save()
      clipBasin(g, this.basin)
      this.boss.render(g, this.tick)
      g.restore()
    }
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
    for (const b of this.bubbles) this.renderOneBubble(g, b)
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
    if (this.shop) {
      renderShop(g, {
        items: SHOP_ITEMS,
        cursor: this.shop.cursor,
        bars: this.bars,
        owned: (item) => this.owns(item),
        wearing: (item) => item.id === this.skin,
        message: this.shop.message,
        golden: this.golden.size,
        goldenTotal: ROOMS.length,
        tick: this.tick,
      })
    }
    if (this.offer) this.renderOffer(g, this.offer)
  }

  private renderOneBubble(g: CanvasRenderingContext2D, b: Bubble) {
    if (!b.alive) return
    if (b.invuln > 0 && Math.floor(b.invuln / 6) % 2 === 0) return
    const base = this.radiusOf(b)
    const r =
      this.draining > 0 ? base * Math.max(0.1, 1 - this.draining / 70) : base
    dropShadow(g, b.x + r * 0.35, b.y + r * 0.95, r * 0.8, r * 0.28, 0.3)
    if (b.superTicks > 0) {
      g.strokeStyle =
        Math.floor(this.tick / 4) % 2 ? RAMPS.gold[4] : RAMPS.sky[4]
      g.beginPath()
      g.arc(b.x, b.y, r + 3, 0, Math.PI * 2)
      g.stroke()
    }
    if (this.shield > 0 && b.seat === 0) {
      g.strokeStyle = 'rgba(255, 255, 255, 0.5)'
      g.beginPath()
      g.arc(b.x, b.y, r + 2, 0, Math.PI * 2)
      g.stroke()
    }
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
      tint: SKIN_TINTS[this.skin],
    })
    if (this.skin === 'starry') {
      g.fillStyle = '#ffffff'
      for (let i = 0; i < 4; i++) {
        const a = i * 1.7 + this.tick / 40
        g.fillRect(
          Math.round(b.x + Math.cos(a) * r * 0.6),
          Math.round(b.y + Math.sin(a) * r * 0.6),
          1,
          1,
        )
      }
    }
    if (b.sticky) {
      g.fillStyle = 'rgba(155, 227, 107, 0.6)'
      g.fillRect(
        Math.round(b.x - r * 0.5),
        Math.round(b.y + r - 2),
        Math.round(r),
        2,
      )
    }
    if (b.power?.kind === 'duck') {
      const at = this.guardAt(b)
      renderGuard(g, at.x, at.y, this.tick)
    }
    if (b.power?.kind === 'magnet') {
      g.strokeStyle = `rgba(239, 68, 68, ${0.25 + 0.15 * Math.sin(this.tick / 5)})`
      g.beginPath()
      g.arc(b.x, b.y, r + 10 + ((this.tick / 2) % 12), 0, Math.PI * 2)
      g.stroke()
    }
  }

  private renderPen(g: CanvasRenderingContext2D) {
    g.save()
    g.fillStyle = `rgba(250, 204, 21, ${0.12 + 0.05 * Math.sin(this.tick / 10)})`
    g.beginPath()
    g.arc(DUCK_PEN.x, DUCK_PEN.y, DUCK_PEN.r, 0, Math.PI * 2)
    g.fill()
    g.strokeStyle = RAMPS.gold[3]
    g.setLineDash([5, 4])
    g.beginPath()
    g.arc(DUCK_PEN.x, DUCK_PEN.y, DUCK_PEN.r, 0, Math.PI * 2)
    g.stroke()
    g.setLineDash([])
    g.restore()
    const penned = this.ducks.filter((d) => d.penned).length
    drawText(g, `${penned}/5`, DUCK_PEN.x, DUCK_PEN.y - DUCK_PEN.r - 12, {
      align: 'center',
      color: RAMPS.gold[4],
      outline: INK,
    })
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
    const scared = this.flee > 0 && !p.trap
    switch (p.kind) {
      case 'mite':
        dropShadow(g, p.x, p.y + 5, 5, 1.5, 0.3)
        drawSprite(g, MITE_SPRITES[frame]!, p.x, p.y, { flipX: p.vx < 0 })
        break
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
        break
      }
      case 'minibrush':
        dropShadow(g, p.x, p.y + 5, 6, 1.5, 0.3)
        drawSprite(g, MINIBRUSH_SPRITE, p.x, p.y + (frame ? 1 : 0), {
          flipX: Math.cos(p.heading) < 0,
        })
        break
      case 'sponge':
        dropShadow(g, p.x, p.y + 7, 10, 2, 0.35)
        drawSprite(
          g,
          SPONGE_SPRITES[Math.floor(this.tick / 20) % 2]!,
          p.x,
          p.y,
          { flipX: p.vx < 0 },
        )
        break
      case 'loofah':
        dropShadow(g, p.x, p.y + 11, 14, 3, 0.35)
        drawSprite(
          g,
          LOOFAH_SPRITE,
          p.x,
          p.y + (Math.floor(this.tick / 24) % 2),
          { flipX: p.vx < 0 },
        )
        break
      case 'slug':
        dropShadow(g, p.x, p.y + 4, 6, 1.5, 0.3)
        drawSprite(g, SLUG_SPRITES[Math.floor(this.tick / 16) % 2]!, p.x, p.y, {
          flipX: p.vx < 0,
        })
        break
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
    if (scared && Math.floor(this.tick / 8) % 2 === 0) {
      g.fillStyle = RAMPS.sky[4]
      g.fillRect(Math.round(p.x) + 6, Math.round(p.y) - 10, 2, 3)
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
    const b = this.bubble
    // A power-up in hand, under the score.
    const power =
      b.power ??
      (b.superTicks > 0
        ? { kind: 'supersuds' as const, ticks: b.superTicks }
        : null)
    const lemon =
      this.flee > 0 ? { kind: 'lemon' as const, ticks: this.flee } : null
    const shown = power ?? lemon
    if (shown) {
      hudPanel(g, 4, 37, 86, 14, RAMPS.gold)
      renderIcon(g, shown.kind, 13, 44)
      gauge(
        g,
        24,
        41,
        60,
        5,
        shown.ticks / POWERS[shown.kind].ticks,
        RAMPS.gold,
      )
    }
    const lives = Math.min(this.lives, 5)
    if (lives > 0) {
      hudPanel(g, W - 8 - lives * 14, 3, lives * 14 + 4, 20)
      for (let i = 0; i < lives; i++)
        shadedOrb(g, W - 13 - i * 14, 13, 4.5, RAMPS.water)
    }
    hudPanel(g, W - 56, 26, 52, 15, RAMPS.pink)
    renderIcon(g, 'soap', W - 44, 33)
    drawText(g, String(this.bars), W - 10, 30, {
      align: 'right',
      color: RAMPS.cream[4],
      outline: INK,
    })
    if (this.chain >= 2) {
      hudPanel(g, W - 56, 44, 52, 15, RAMPS.purple)
      drawText(g, `CHAIN X${this.chain}`, W - 30, 48, {
        align: 'center',
        color: RAMPS.gold[4],
        outline: INK,
      })
    }
    if (this.boss && !this.boss.done) {
      hudPanel(g, W / 2 - 66, 3, 132, 17, RAMPS.ember)
      drawText(g, 'BRISTLETON', W / 2 - 58, 8, {
        color: '#ffffff',
        outline: INK,
      })
      for (let i = 0; i < 3; i++)
        shadedOrb(
          g,
          W / 2 + 34 + i * 11,
          11,
          4,
          i < this.boss.hp ? RAMPS.gold : RAMPS.steel,
        )
    }
    const step = this.steps[this.stepIndex]
    const label = this.inEndless
      ? `SINK ${this.level}`
      : step?.kind === 'boss'
        ? 'BOSS'
        : step?.kind === 'basin'
          ? `BASIN ${step.room + 1}-${step.basin + 1}`
          : 'SHOP'
    hudPanel(g, 4, H - 19, 58, 15)
    drawText(g, label, 33, H - 15, {
      align: 'center',
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
    const filled =
      b.stage >= MAX_STAGE
        ? 1
        : (b.stage - 1 + b.growth / GROWTH_PER_STAGE) / (MAX_STAGE - 1)
    hudPanel(g, W - 152, H - 19, 148, 15)
    drawText(g, 'SUDS', W - 146, H - 15, { color: RAMPS.teal[4], outline: INK })
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
    if (this.banner && !this.shop) {
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

  private renderOffer(g: CanvasRenderingContext2D, s: SudsSave) {
    g.fillStyle = 'rgba(20, 10, 38, 0.75)'
    g.fillRect(0, 0, W, H)
    hudPanel(g, 50, 96, W - 100, 150, RAMPS.teal)
    const step = this.steps[s.step]
    const where =
      step?.kind === 'boss'
        ? 'BRISTLETON'
        : step?.kind === 'basin'
          ? ROOMS[step.room]!.name
          : ''
    drawText(g, 'CONTINUE THE WASH?', W / 2, 110, {
      scale: 2,
      align: 'center',
      color: '#ffffff',
      outline: INK,
    })
    drawText(g, where, W / 2, 140, {
      scale: 2,
      align: 'center',
      color: RAMPS.gold[3],
      outline: INK,
    })
    drawText(
      g,
      `SCORE ${s.score}   BUBBLES ${s.lives}   SOAP ${s.bars}`,
      W / 2,
      172,
      {
        align: 'center',
        color: RAMPS.cream[3],
        outline: INK,
      },
    )
    drawText(g, `GOLDEN SOAP ${s.golden.length}/${ROOMS.length}`, W / 2, 188, {
      align: 'center',
      color: RAMPS.gold[4],
      outline: INK,
    })
    drawText(g, 'A CONTINUE    B NEW WASH', W / 2, 218, {
      align: 'center',
      color: RAMPS.teal[4],
      outline: INK,
    })
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
      lines: (Object.keys(PESTS) as PestKind[])
        .filter((k) => !PESTS[k].hidden)
        .flatMap((k) => [
          `${PESTS[k].name}: ${PESTS[k].tell}`,
          `  ${PESTS[k].answer}`,
        ]),
    },
    {
      title: 'FROM THE DRAIN',
      scale: 1,
      lines: [
        ...POWER_KINDS.map((k) => `${POWERS[k].name}: ${POWERS[k].does}`),
        'SOAP BARS: SPEND THEM IN THE SOAP SHOP',
        'BETWEEN ROOMS. BOSSES PAY FIVE.',
      ],
    },
    {
      title: 'THE BIG HOUSE WASH',
      scale: 1,
      lines: [
        'EVERY ROOM HAS FOUR BASINS. BASIN 3 IS SPECIAL:',
        'DO ITS JOB AND THE DRAIN OPENS.',
        "FINISH IT 95% CLEAN FOR THE ROOM'S GOLDEN SOAP.",
        ...ROOMS.flatMap((r) => [`${r.name}: ${r.basins[2].title}`]),
        'BRISTLETON: BUMP THE HANDLE AT FULL SIZE.',
        'PROGRESS SAVES AT EVERY ROOM.',
      ],
    },
  ]
}

const sinkSuds: ArcadeGameModule = {
  create: (options) => new SinkSuds(options),
  guide: () => sinkGuide(),
}

export const create = sinkSuds.create
export default sinkSuds
