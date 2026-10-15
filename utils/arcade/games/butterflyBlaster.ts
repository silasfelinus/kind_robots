// /utils/arcade/games/butterflyBlaster.ts
//
// Butterfly Blaster -- the Kind Robots Arcade's riff on the 1979 rock-splitting shooter (Silas,
// 2026-10-06: "rainbow butterflies to kill mosquitoes, a la our malaria project"; depth pass
// conductor kr-arcade/t-055.., spec: conductor projects/kr-arcade/depth-pass/CABINETS.md section 6,
// "The Rainy Season").
//
// A rainbow butterfly keeps the night watch down a river valley through the rainy season. It
// turns, flutters and drifts around a wrapping sky, sparkling mosquito swarms that split big ->
// medium -> single. The swarms are alive: they flock, hum toward light, regroup when split and
// left alone, and when they get hungry they head for the huts' lit windows and bite. Fluttering
// trails a rainbow ribbon; cross it to close the Rainbow Lasso and net every mosquito inside at
// once. B is a flutter-dash on a tap and the old risky long hop on a hold. Pools of standing water
// breed wrigglers; skimmers skate the ground and needles dash. AMI, the Anti-Malaria
// Intelligence, drops bed nets and the rest of her kit.
//
// Each night defends one village: two waves, then a dawn tally that thanks you for every hut that
// came through unbitten, in thank-you beads. The river map shows the route between nights, the
// season's regions bring their own skies, pests and special nights (butterflyBlaster/season.ts),
// AMI's Clinic between regions takes the beads, and a nest boss ends each Moon: the Hum, Old Puddle
// and the Night Queen. Dawn after the Queen rolls the credits; six golden threads open the Moonlit
// Lagoon and its true ending, Zero Night; then the Dry Season (New Game+) begins. Progress saves at
// every night, boss and Clinic, and the clear is recorded the moment an ending starts.

import { drawText } from '../font'
import {
  INK,
  RAMPS,
  Sparkles,
  backdropRng,
  cachedLayer,
  drawSprite,
  gauge,
  glow,
  hudPanel,
  shadedOrb,
  vignette,
} from '../snes'
import type { MusicLoop } from '../sound'
import { emptyInput } from '../types'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'
import {
  LIFE_SPRITE,
  RAINBOW,
  SICK,
  renderBag,
  renderButterfly,
  renderCloud,
  renderDashTrail,
  renderDawn,
  renderDriftingClouds,
  renderFairy,
  renderFireflies,
  renderLoopFlash,
  renderMesh,
  renderPest,
  renderPool,
  renderRibbon,
  renderSparkle,
  renderStars,
  renderSwarm,
  renderWindows,
} from '../butterflyBlaster/art'
import {
  BEADS,
  CLINIC,
  CLINIC_IDLE,
  CLINIC_ROWS,
  UPGRADES,
  clinicPrice,
} from '../butterflyBlaster/clinic'
import type { ClinicItem } from '../butterflyBlaster/clinic'
import {
  CREDITS_TICKS,
  SKIP_AFTER,
  renderEnding,
} from '../butterflyBlaster/endings'
import { Hum } from '../butterflyBlaster/hum'
import type { Boss, BossHost } from '../butterflyBlaster/hum'
import {
  BATS,
  FAN,
  KIT,
  LONG,
  LURE,
  RING,
  WINGMAN,
  pickKit,
} from '../butterflyBlaster/kit'
import {
  renderBats,
  renderCoins,
  renderEscort,
  renderFireflies2,
  renderFog,
  renderShelter,
  renderStalls,
  renderStorm,
  renderStrings,
  renderTide,
} from '../butterflyBlaster/laterArt'
import type { KitId } from '../butterflyBlaster/kit'
import {
  LASSO_POINTS,
  RIBBON_STEP,
  RIBBON_TICKS,
  Ribbon,
  insideLoop,
  lassoMultiplier,
} from '../butterflyBlaster/lasso'
import type { Loop } from '../butterflyBlaster/lasso'
import {
  BOSS_MUSIC,
  CLINIC_MUSIC,
  DAWN,
  ENDING,
  HEARTBEATS,
  RIVER,
  heartbeatTier,
} from '../butterflyBlaster/music'
import { endlessNight } from '../butterflyBlaster/nights'
import {
  MEDALS,
  MENU,
  classicNight,
  clock,
  longNightLevel,
  medalKey,
  medalsWon,
  openRegions,
  readMedals,
  readTimes,
  regionNights,
  renderMenu,
} from '../butterflyBlaster/modes'
import type {
  BestTimes,
  MedalBoard,
  MenuId,
  ModeId,
} from '../butterflyBlaster/modes'
import {
  BROODS,
  PEST_POINTS,
  PEST_RADIUS,
  PEST_TREE,
  movePest,
  newPest,
  newPool,
  pestHurts,
  struckBy,
  tickPool,
} from '../butterflyBlaster/pests'
import { Puddle } from '../butterflyBlaster/puddle'
import { Queen } from '../butterflyBlaster/queen'
import type { Pest, PestKind, Pool } from '../butterflyBlaster/pests'
import {
  BACKDROPS,
  renderDragonfly,
  renderFlags,
  renderGust,
  renderJar,
  renderKitDrop,
  renderLantern,
  renderLure,
  renderMist,
  renderRing,
} from '../butterflyBlaster/regionArt'
import {
  renderBossBar,
  renderClinic,
  renderMap,
  renderOffer,
  renderTitleCard,
} from '../butterflyBlaster/screens'
import {
  BOSS_NAMES,
  JAR_SPOTS,
  REGIONS,
  THREAD_REGIONS,
  campaignSteps,
  dryNight,
  isCheckpoint,
  isRegionStart,
  isSecret,
  regionAt,
} from '../butterflyBlaster/season'
import type {
  BossId,
  EndingKind,
  NightDef,
  RegionDef,
  RegionId,
  Step,
} from '../butterflyBlaster/season'
import {
  GROUND,
  H,
  SKY,
  W,
  angleDiff,
  clamp,
  limitSpeed,
  toward,
  wrap,
  wrapDist,
} from '../butterflyBlaster/sky'
import type { Body, Point } from '../butterflyBlaster/sky'
import {
  ESCORT,
  JAR,
  LANTERN,
  MARKET,
  SHELTER,
  SPECIAL_GOAL,
  moveEscort,
  newEscort,
  newJars,
  newLanterns,
  newStalls,
  specialLights,
  specialLine,
  specialMet,
  walkLanterns,
} from '../butterflyBlaster/specials'
import type { SpecialState } from '../butterflyBlaster/specials'
import {
  SHOO_TICKS,
  SWARM_POINTS,
  SWARM_RADIUS,
  SWARM_TREE,
  flySwarm,
  newSwarm,
  regroupSwarms,
  splitSwarm,
} from '../butterflyBlaster/swarm'
import type { Light, Size, Swarm } from '../butterflyBlaster/swarm'
import {
  TALLY,
  dawnTally,
  hutLights,
  hutLit,
  newVillage,
  reachesHut,
} from '../butterflyBlaster/village'
import type { Hut, TallyRow } from '../butterflyBlaster/village'
import {
  COINS,
  STORM,
  STRINGS,
  litForShade,
  newWeather,
  stringLights,
  stringY,
  tickWeather,
  tideLine,
} from '../butterflyBlaster/weather'
import type { Weather } from '../butterflyBlaster/weather'

import {
  COOP_LIVES_PER_EXTRA,
  MATE_TINTS,
  TEAM_BONUS,
  TEAM_MULTIPLIER,
  flyMate,
  layMate,
  newMates,
  teamLoop,
} from '../butterflyBlaster/coop'
import type { Mate } from '../butterflyBlaster/coop'

export { endlessNight, SWARM_RADIUS, SWARM_TREE }
export type { Pest, Pool, Swarm, Hut }

const TURN = 0.08
const THRUST = 0.12
const MAX_SPEED = 4.2
const FRICTION = 0.992
/** The ribbon streams behind a butterfly gliding at least this fast, fluttering or not. */
const RIBBON_SPEED = 2.2
/** How hard a flutter swings the drift toward the butterfly's heading. */
const GRIP = 0.08
const SHOT_SPEED = 6.5
const SHOT_LIFE = 48
const MAX_SHOTS = 5
const FIRE_COOLDOWN = 8
const AUTOFIRE_COOLDOWN = 14
const RESPAWN_TICKS = 120
const INVULN_TICKS = 150
export const SHIELD_TICKS = KIT.net.ticks
const START_LIVES = 3
const MAX_LIVES = 9
export const SHIP_RADIUS = 8
/** A swarm's haze is softer than its heart: it only hurts this far into its radius. */
const HURT = 0.72

/** B: a tap is a short aimed flutter-dash; a hold is the risky long hop. One cooldown for both. */
export const DASH = { distance: 58, cooldown: 60, invuln: 8, hold: 16 } as const
/** Land a long hop this close to a swarm and live this long for a Brave Hop. */
export const BRAVE = { reach: 40, ticks: 120, points: 500 } as const
/** Sparkle hits this close together chain, up to this multiplier. */
export const CHAIN = { ticks: 45, max: 4 } as const
/** Hang about an edge (or sit idle) this long and the malaria cloud comes for you. */
export const LURK = { ticks: 480, edge: 70 } as const
/** The second wave follows the first after this many ticks. */
const WAVE_GAP = 110
/** The dawn tally lasts this long (A skips it after a second). */
export const DAWN_TICKS = 330
/** The river map waits this long before it flies on by itself. */
export const MAP_TICKS = 300
/** Wind on the terraces: ticks between gusts, the flag tell, the gust, and its push. */
export const WIND = {
  every: [420, 300],
  tell: 90,
  gust: 150,
  push: 0.05,
} as const
/** A boss's score for being netted is in the boss; the village's thanks for it is here. */
const BOSS_DONE_TICKS = 120
/** A sticky swarm's gum on the wings: turning is this much slower until B shakes it off. */
export const STICKY = { ticks: 420, turn: 0.45 } as const
/** Soaked wings flutter this much weaker, and sag this much, at full soak. */
export const SOAK = { thrust: 0.5, sag: 0.03 } as const
/** A carried lantern lure follows the butterfly this long before it hangs where it is. */
export const LURE_CARRY = 300
/** A decoy glow that is caught bursts into this many hummers. */
const DECOY_HUMMERS = 4

type Shot = Body & { life: number; hue: number }
type Drop = Body & { life: number; fall: number }
type Cloud = Body & {
  small: boolean
  angry: boolean
  fire: number
  turn: number
}
type Fairy = Body & { dropAt: number; carrying: boolean; kit: KitId }
type KitDrop = Body & { spin: number; kit: KitId }
type Particle = Body & { life: number; max: number; color: string }
type Floater = {
  x: number
  y: number
  text: string
  life: number
  color: string
  scale: 1 | 2
}
type Bag = { x: number; y: number; count: number; life: number }

type Phase =
  | 'menu'
  | 'result'
  | 'offer'
  | 'map'
  | 'play'
  | 'gap'
  | 'dawn'
  | 'clinic'
  | 'bossDone'
  | 'ending'

type Dawn = {
  rows: TallyRow[]
  total: number
  perfect: boolean
  beads: number
  thread: boolean
}

/** A Butterfly Blaster save: where the season got to, and what the watch has earned. */
export type BlasterSave = {
  v: 1
  /** Campaign step to resume at (a night, a boss, the Clinic, or the endless river). */
  step: number
  score: number
  lives: number
  beads: number
  owned: ClinicItem[]
  hints: RegionId[]
  threads: RegionId[]
  /** Unbitten huts per finished night, as [step, unbitten]. */
  record: [number, number][]
  /** The night count, for a resume on the endless river. */
  level?: number
  /** The season has been cleared once (the ending started): the Dry Season is open. */
  cleared?: boolean
  /** Dry Season laps begun. */
  dry?: number
  /** Zero Night, the true ending, has been reached. */
  zero?: boolean
  /** Medals won per night (medalKey -> bits), and Region Time Attack bests, kept for every mode. */
  medals?: MedalBoard
  times?: BestTimes
}

const ONCE_ITEMS: readonly ClinicItem[] = [
  'ribbon',
  'dash',
  'startNet',
  'sturdyNet',
]
const REGION_IDS = Object.keys(REGIONS) as RegionId[]

/** A stored save, checked against this build; null when unusable. */
export function readBlasterSave(raw: unknown): BlasterSave | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const count = (v: unknown, max: number) =>
    typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= max
  if (r.v !== 1) return null
  const steps = campaignSteps()
  if (!count(r.step, steps.length - 1)) return null
  const kind = steps[r.step as number]?.kind
  if (
    !isCheckpoint(steps[r.step as number]) &&
    kind !== 'endless' &&
    kind !== 'ending' &&
    kind !== 'dry'
  )
    return null
  if (
    !count(r.score, 249_999_999) ||
    !count(r.lives, 99) ||
    !count(r.beads, 99_999)
  )
    return null
  const pick = <T extends string>(v: unknown, allowed: readonly T[]): T[] =>
    Array.isArray(v)
      ? [...new Set(v.filter((x): x is T => allowed.includes(x as T)))]
      : []
  const record = Array.isArray(r.record)
    ? r.record.filter(
        (e): e is [number, number] =>
          Array.isArray(e) && count(e[0], steps.length - 1) && count(e[1], 8),
      )
    : []
  return {
    v: 1,
    step: r.step as number,
    score: r.score as number,
    lives: Math.max(1, r.lives as number),
    beads: r.beads as number,
    owned: pick(r.owned, ONCE_ITEMS),
    hints: pick(r.hints, REGION_IDS),
    threads: pick(r.threads, REGION_IDS),
    record: record.map(([s, u]) => [s, u]),
    level: count(r.level, 99_999) ? (r.level as number) : undefined,
    cleared: r.cleared === true,
    dry: count(r.dry, 99) ? (r.dry as number) : 0,
    zero: r.zero === true,
    medals: readMedals(r.medals) ?? {},
    times: readTimes(r.times) ?? {},
  }
}

class ButterflyBlaster implements ArcadeGameInstance {
  score = 0
  level = 0
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private ship = { x: W / 2, y: SKY / 2, vx: 0, vy: 0, angle: 0 }
  /** Seats at the cabinet (1 to 4); Co-op Flight needs two. */
  private seats = 1
  /** Co-op Flight's other butterflies, one per extra seat. */
  private mates: Mate[] = []
  /** Every seated player's frame this tick, player 1 first. */
  private frames: InputFrame[] = []
  /** The butterfly's position before the sky wraps it: the ribbon is laid here. */
  private unwrapped = { x: W / 2, y: SKY / 2 }
  private alive = true
  private respawn = 0
  private invuln = INVULN_TICKS
  private shield = 0
  /** Hits the bed net has left in it (two with the sturdy net). */
  private shieldHits = 0
  private fireCooldown = 0
  private bCooldown = 0
  /** Ticks B has been held (-1: up; -2: held past a hop, waiting to be let go). */
  private bHeld = -1
  private brave = 0
  private flap = 0
  private thrusting = false
  private dashTrail: { from: Point; to: Point; t: number } | null = null

  private ribbon = new Ribbon()
  private lastLaid = -99
  private loopFlash: { loop: Loop; shift: Point; t: number } | null = null
  private bags: Bag[] = []

  private shots: Shot[] = []
  private swarms: Swarm[] = []
  private pests: Pest[] = []
  private pools: Pool[] = []
  private drops: Drop[] = []
  private cloud: Cloud | null = null
  private cloudTimer = 0
  private fairy: Fairy | null = null
  private fairyTimer = 0
  private kitDrops: KitDrop[] = []
  private kit: { id: KitId; ticks: number } | null = null
  private ringAngle = 0
  private ringRest = [0, 0, 0]
  private wingman: (Body & { ticks: number }) | null = null
  private lure: (Point & { ticks: number; carry: number }) | null = null
  private bats: Body[] = []
  /** Gum from a sticky swarm on the wings (ticks left). */
  private sticky = 0
  /** Rain in the wings (0 .. STORM.soaked). */
  private soak = 0
  /** AMI's sky-long ribbon for the finale: ticks left, and the ribbon's life meanwhile. */
  private boost = { ticks: 0, life: 0 }
  /** A kit a boss has asked AMI to bring next. */
  private kitWanted: KitId | null = null
  private weather: Weather = newWeather({}, () => 0.5)
  /** Ticks into tonight's play, for weather that builds. */
  private nightTicks = 0
  private wind = { timer: 0, tell: 0, gust: 0, dir: 1 }
  private huts: Hut[] = newVillage()
  private special: SpecialState | null = null
  private boss: Boss | null = null
  private bossId: BossId | null = null

  // The season.
  private steps: Step[] = campaignSteps()
  private stepIndex = 0
  private inEndless = false
  private region: RegionDef = REGIONS.riverbend
  private plan: NightDef = REGIONS.riverbend.nights[0]!
  private wave = 0
  private phase: Phase = 'play'
  private phaseTicks = 0
  /** Mosquitoes the wave began with (the heartbeat's measure). */
  private waveTotal = 1
  private dawn: Dawn | null = null
  private card: { region: RegionDef; t: number } | null = null
  private beads = 0
  private owned = new Set<ClinicItem>()
  private hints = new Set<RegionId>()
  private threads = new Set<RegionId>()
  private record = new Map<number, number>()
  private clinic: {
    cursor: number
    message: string
    t: number
    idle: number
  } | null = null
  private offer: BlasterSave | null = null
  private saveData: BlasterSave | null = null
  private ending: { kind: EndingKind; t: number } | null = null
  /** The season cleared (the Dry Season is open), Dry Season laps begun, Zero Night reached. */
  private cleared = false
  private dry = 0
  private zero = false

  // The modes (butterflyBlaster/modes.ts).
  private mode: ModeId = 'season'
  private menu: {
    cursor: number
    region: number
    board: boolean
    ticks: number
  } | null = null
  private medals: MedalBoard = {}
  private times: BestTimes = {}
  /** The most mosquitoes one loop netted tonight (the Lasso Master medal). */
  private biggestLoop = 0
  /** Region Time Attack: the region, the night in it, ticks on the clock, and the finished time. */
  private attack = { region: 0, night: 0, ticks: 0, done: 0 }
  /** Medals won tonight, for the dawn tally. */
  private nightMedals = 0

  private chain = 0
  private chainTimer = 0
  private lurk = 0
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null
  private overTimer = 0
  private pilot = {
    loop: 0,
    side: 'right' as 'left' | 'right',
    hold: 0,
    mark: null as Swarm | null,
  }
  // Cosmetic sparkles roll their own dice, so the game's seeded rng is untouched.
  private fx = new Sparkles()
  private fxRng = backdropRng(31)

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.seats = this.demo
      ? 1
      : Math.max(1, Math.min(4, Math.round(options.players ?? 1)))
    const stored = this.demo ? null : readBlasterSave(options.resume)
    // Earned history belongs to the pilot, including a fresh season's step-zero save.
    if (stored) {
      this.threads = new Set(stored.threads)
      this.cleared = stored.cleared === true
      this.zero = stored.zero === true
      this.medals = { ...stored.medals }
      this.times = { ...stored.times }
      this.record = new Map(stored.record)
      this.saveData = stored
    }
    this.beginStep(0)
    if (stored && (stored.step > 0 || (stored.dry ?? 0) > 0)) {
      this.offer = stored
      this.phase = 'offer'
    } else if (!this.demo) this.openMenu()
  }

  get save(): BlasterSave | null | undefined {
    return this.demo ? undefined : this.saveData
  }

  get music(): MusicLoop | null {
    if (
      this.over ||
      this.demo ||
      this.phase === 'offer' ||
      this.phase === 'menu' ||
      this.phase === 'result'
    )
      return null
    if (this.phase === 'map') return RIVER
    if (this.phase === 'clinic') return CLINIC_MUSIC
    if (this.phase === 'ending') return ENDING
    if (this.phase === 'dawn' || this.phase === 'bossDone') return DAWN
    if (this.bossId) return BOSS_MUSIC[this.bossId]
    const left = this.mosquitoesLeft() / Math.max(1, this.waveTotal)
    return HEARTBEATS[this.region.theme][heartbeatTier(left, this.sprinting())]!
  }

  // --- the season --------------------------------------------------------------------------------

  /** Nights and bosses up to and including step i: the level shown and kept on the board. */
  private levelAt(i: number): number {
    const count = (list: readonly Step[]) =>
      list.filter((s) => s.kind === 'night' || s.kind === 'boss').length
    return count(this.steps.slice(0, i + 1)) + this.dry * count(this.steps)
  }

  /** Every golden thread found: the Moonlit Lagoon is open. */
  private get allThreads(): boolean {
    return THREAD_REGIONS.every((r) => this.threads.has(r))
  }

  private get moon(): number {
    return this.region.moon
  }

  /** Start campaign step i: a night, a boss, the Clinic or the endless river. */
  private beginStep(i: number) {
    this.stepIndex = i
    this.boss = null
    this.bossId = null
    this.clinic = null
    this.dawn = null
    this.card = null
    this.ending = null
    const step = this.steps[i]
    // The Lagoon and Zero Night are only there for a watch with all six golden threads.
    if (isSecret(step) && !this.allThreads) {
      this.beginStep(i + 1)
      return
    }
    if (step?.kind === 'dry') {
      // Round again: the Dry Season, remixed and faster.
      this.dry++
      this.beginStep(0)
      return
    }
    if (step?.kind === 'ending') {
      this.region = regionAt(this.steps, i)
      this.phase = 'ending'
      this.ending = { kind: step.ending, t: 0 }
      // The clear counts the moment the ending starts, whatever happens during the credits.
      this.cleared = true
      if (step.ending === 'zero') this.zero = true
      this.sound.play('extra')
      this.keep()
      return
    }
    if (!step || step.kind === 'endless') {
      this.inEndless = true
      this.level = Math.max(this.level + 1, this.levelAt(i))
      this.region = regionAt(this.steps, i)
      this.plan = {
        ...endlessNight(this.level),
        title: `NIGHT ${this.level}`,
        wind: this.level % 3 === 0,
      }
      this.setupNight()
      this.keep()
      return
    }
    this.inEndless = false
    if (step.kind === 'clinic') {
      this.region = regionAt(this.steps, i)
      this.phase = 'clinic'
      this.clinic = { cursor: 0, message: '', t: 0, idle: 0 }
      this.sound.play('start')
      this.keep()
      return
    }
    this.level = this.levelAt(i)
    if (step.kind === 'boss') {
      this.region = regionAt(this.steps, i)
      this.plan = {
        ...endlessNight(this.level),
        title: BOSS_NAMES[step.boss].name,
        waves: [],
      }
      this.bossId = step.boss
      this.setupNight()
      this.keep()
      return
    }
    this.region = REGIONS[step.region]
    this.plan = dryNight(this.region.nights[step.night]!, this.dry)
    this.setupNight()
    this.keep()
  }

  private advance() {
    if (this.mode === 'timeattack') {
      if (
        ++this.attack.night <
        regionNights(THREAD_REGIONS[this.attack.region]!).length
      ) {
        this.nextModeNight()
        return
      }
      // The region is cleared: its time goes on the board, then the run is done.
      const id = THREAD_REGIONS[this.attack.region]!
      this.attack.done = this.attack.ticks
      const best = this.times[id]
      if (best === undefined || this.attack.ticks < best)
        this.times = { ...this.times, [id]: this.attack.ticks }
      this.keepRecords()
      this.phase = 'result'
      this.phaseTicks = 0
      this.sound.play('extra')
      return
    }
    if (
      this.mode === 'longnight' ||
      this.mode === 'classic' ||
      this.mode === 'coop'
    ) {
      this.nextModeNight()
      return
    }
    if (this.inEndless) {
      this.beginStep(this.stepIndex)
      return
    }
    this.beginStep(this.stepIndex + 1)
  }

  /** A fresh village for the night ahead; the river map shows the way first. */
  private setupNight() {
    this.huts = newVillage()
    this.pools = this.plan.pools.map((spot) =>
      newPool(spot, this.plan.poolEvery, this.rng),
    )
    this.swarms = []
    this.pests = []
    this.biggestLoop = 0
    this.drops = []
    this.shots = []
    this.cloud = null
    this.fairy = null
    this.kitDrops = []
    this.lure = null
    this.wingman = null
    this.wind = { timer: this.windWait(), tell: 0, gust: 0, dir: 1 }
    this.weather = newWeather(this.plan, this.rng)
    this.bats = []
    this.soak = 0
    this.sticky = 0
    this.boost = { ticks: 0, life: 0 }
    this.nightTicks = 0
    this.applyUpgrades()
    this.special = null
    const sp = this.plan.special
    if (sp === 'lanterns')
      this.special = { kind: 'lanterns', lanterns: newLanterns() }
    else if (sp === 'pots')
      this.special = { kind: 'pots', jars: newJars(JAR_SPOTS) }
    else if (sp === 'escort')
      this.special = { kind: 'escort', escort: newEscort() }
    else if (sp === 'market')
      this.special = { kind: 'market', stalls: newStalls(), lit: 0, t: 0 }
    else if (sp === 'hill')
      this.special = {
        kind: 'hill',
        shelter: { x: SHELTER.x, y: SHELTER.y, bites: 0, flicker: 0 },
      }
    else if (sp === 'long') this.special = { kind: 'long' }
    this.wave = 0
    this.phase = 'map'
    this.phaseTicks = 0
    this.banner = null
  }

  private windWait(): number {
    return WIND.every[0] + Math.round(this.rng() * WIND.every[1])
  }

  /** The map is done: the night (or the nest) begins. */
  private startPlay() {
    this.phase = 'play'
    this.phaseTicks = 0
    Object.assign(this.ship, { x: W / 2, y: SKY / 2, vx: 0, vy: 0, angle: 0 })
    this.unwrapped = { x: W / 2, y: SKY / 2 }
    this.ribbon.clear()
    this.invuln = Math.max(this.invuln, 90)
    this.seatMates()
    if (this.owned.has('startNet')) this.giveNet()
    if (isRegionStart(this.steps[this.stepIndex]))
      this.card = { region: this.region, t: 0 }
    if (this.bossId) {
      this.boss =
        this.bossId === 'puddle'
          ? new Puddle()
          : this.bossId === 'queen'
            ? new Queen()
            : new Hum()
      const title = BOSS_NAMES[this.bossId]
      this.banner = { text: title.name, sub: title.title, ticks: 150 }
      this.fairyTimer = Math.round(this.plan.amiEvery / 2)
      this.waveTotal = 1
      return
    }
    this.startWave(0)
    const goal = this.plan.special ? SPECIAL_GOAL[this.plan.special] : null
    if (!this.card)
      this.banner = {
        text: this.plan.title,
        sub:
          goal ??
          (this.inEndless ? 'THE RIVER RUNS ON' : 'KEEP THE VILLAGE SAFE'),
        ticks: 130,
      }
    else if (goal)
      this.banner = { text: this.plan.title, sub: goal, ticks: 130 }
  }

  /** Write the save: where the season is, and what the watch has earned. */
  private keep() {
    if (this.demo) return
    if (this.mode !== 'season') return this.keepRecords()
    this.saveData = {
      v: 1,
      step: this.stepIndex,
      score: this.score,
      lives: Math.max(1, this.lives),
      beads: this.beads,
      owned: [...this.owned].filter((o) => ONCE_ITEMS.includes(o)),
      hints: [...this.hints],
      threads: [...this.threads],
      record: [...this.record],
      level: this.inEndless ? this.level : undefined,
      cleared: this.cleared,
      dry: this.dry,
      zero: this.zero,
      medals: { ...this.medals },
      times: { ...this.times },
    }
  }

  // --- the menu of modes -------------------------------------------------------------------------

  private openMenu() {
    this.menu = { cursor: 0, region: 0, board: false, ticks: 0 }
    this.phase = 'menu'
    this.banner = null
  }

  private openRegionList(): RegionId[] {
    return openRegions(this.record, this.cleared)
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
    if (MENU[m.cursor]!.id === 'timeattack') {
      const n = THREAD_REGIONS.length
      if (input.pressed.left) m.region = (m.region + n - 1) % n
      if (input.pressed.right) m.region = (m.region + 1) % n
    }
    if (m.ticks < 8 || (!input.pressed.a && !input.pressed.start)) return
    const id = MENU[m.cursor]!.id
    if (id === 'board') {
      m.board = true
      m.ticks = 0
      return
    }
    if (id === 'coop' && this.seats < 2) {
      // Co-op Flight wants a second butterfly in the air.
      this.sound.play('warn')
      return
    }
    if (
      id === 'timeattack' &&
      !this.openRegionList().includes(THREAD_REGIONS[m.region]!)
    ) {
      this.sound.play('warn')
      return
    }
    this.begin(id, m.region)
  }

  /** Start a mode from the menu (Time Attack in a region). */
  private begin(id: Exclude<MenuId, 'board'>, region = 0) {
    this.menu = null
    this.mode = id
    this.score = 0
    this.level = 0
    this.mates = id === 'coop' ? newMates(this.seats) : []
    this.lives = START_LIVES + this.mates.length * COOP_LIVES_PER_EXTRA
    this.beads = 0
    this.owned = new Set()
    this.attack = { region, night: 0, ticks: 0, done: 0 }
    this.sound.play('start')
    if (id === 'season') {
      this.inEndless = false
      this.beginStep(0)
      return
    }
    this.keepRecords()
    this.nextModeNight()
  }

  /** The next night of Long Night, Classic Night or the Time Attack region. */
  private nextModeNight() {
    this.boss = null
    this.bossId = null
    this.dawn = null
    this.card = null
    this.ending = null
    if (this.mode === 'timeattack') {
      this.inEndless = false
      const id = THREAD_REGIONS[this.attack.region]!
      this.region = REGIONS[id]
      this.level = this.attack.night + 1
      this.plan = regionNights(id)[this.attack.night]!
    } else if (this.mode === 'classic') {
      this.inEndless = true
      this.level++
      this.region = REGIONS.riverbend
      this.plan = classicNight(this.level)
    } else {
      this.inEndless = true
      this.level++
      const from = THREAD_REGIONS[(this.level - 1) % THREAD_REGIONS.length]!
      this.region = REGIONS[from]
      const look = this.region.nights[this.region.nights.length - 1]!
      this.plan = {
        ...endlessNight(longNightLevel(this.level)),
        title: `NIGHT ${this.level}`,
        wind: this.level % 3 === 0,
        tide: look.tide,
        fog: look.fog,
        strings: look.strings,
        storm: look.storm,
      }
    }
    this.setupNight()
    // Classic Night has no river map: straight onto the sky.
    if (this.mode === 'classic') this.startPlay()
  }

  /** A save at the season's start: what a watch with no season under way keeps. */
  private freshSave(): BlasterSave {
    return {
      v: 1,
      step: 0,
      score: 0,
      lives: START_LIVES,
      beads: 0,
      owned: [],
      hints: [],
      threads: [...this.threads],
      record: [...this.record],
    }
  }

  /** Medals and bests live in the save for every mode; a Season's own progress is left as it was. */
  private keepRecords() {
    if (this.demo) return
    const base = this.saveData ?? this.freshSave()
    this.saveData = {
      ...base,
      cleared: this.cleared || base.cleared === true,
      zero: this.zero || base.zero === true,
      medals: { ...this.medals },
      times: { ...this.times },
    }
  }

  private resumeFrom(s: BlasterSave) {
    this.score = s.score
    this.lives = s.lives
    this.beads = s.beads
    this.owned = new Set(s.owned)
    this.hints = new Set(s.hints)
    this.threads = new Set(s.threads)
    this.record = new Map(s.record)
    this.cleared = s.cleared === true
    this.dry = s.dry ?? 0
    this.zero = s.zero === true
    this.medals = { ...s.medals }
    this.times = { ...s.times }
    this.applyUpgrades()
    if (this.steps[s.step]?.kind === 'endless')
      this.level = Math.max(0, (s.level ?? this.levelAt(s.step)) - 1)
    this.beginStep(s.step)
  }

  private applyUpgrades() {
    const base = RIBBON_TICKS + (this.owned.has('ribbon') ? UPGRADES.ribbon : 0)
    this.ribbon.life =
      this.boost.ticks > 0 ? Math.max(base, this.boost.life) : base
  }

  private get dashCooldown(): number {
    return this.owned.has('dash') ? UPGRADES.dashCooldown : DASH.cooldown
  }

  private hunger(): number {
    const [least, spread] = this.plan.hunger
    return Math.round(least + this.rng() * spread)
  }

  /** A spot on the sky's edge, well away from the butterfly. */
  private edgeSpot(): Point {
    for (let attempt = 0; attempt < 40; attempt++) {
      const p =
        this.rng() < 0.4
          ? { x: this.rng() * W, y: 4 }
          : {
              x: this.rng() < 0.5 ? 2 : W - 2,
              y: 20 + this.rng() * (GROUND - 110),
            }
      if (wrapDist(p, this.ship) > 140) return p
    }
    return { x: 2, y: 20 }
  }

  private startWave(i: number) {
    this.wave = i
    this.phase = 'play'
    const wave = this.plan.waves[i]!
    const add = (size: Size) => {
      const p = this.edgeSpot()
      this.swarms.push(newSwarm(p.x, p.y, size, this.rng, this.hunger()))
    }
    for (let k = 0; k < wave.big; k++) add(3)
    for (let k = 0; k < wave.medium; k++) add(2)
    for (let k = 0; k < wave.needles; k++) {
      const p = this.edgeSpot()
      this.pests.push(newPest('needle', p.x, p.y, this.rng))
    }
    for (let k = 0; k < wave.skimmers; k++) {
      const x = k % 2 === 0 ? 150 : W - 150
      this.pests.push(newPest('skimmer', x, 0, this.rng))
    }
    const addKind = (count: number | undefined, kind: Swarm['kind']) => {
      for (let k = 0; k < (count ?? 0); k++) {
        const p = this.edgeSpot()
        const s = newSwarm(p.x, p.y, 2, this.rng, this.hunger())
        s.kind = kind
        this.swarms.push(s)
      }
    }
    addKind(wave.shade, 'shade')
    addKind(wave.sticky, 'sticky')
    const addPest = (
      count: number | undefined,
      kind: PestKind,
      top = false,
    ) => {
      for (let k = 0; k < (count ?? 0); k++) {
        const p = top
          ? { x: 30 + this.rng() * (W - 60), y: 6 }
          : this.edgeSpot()
        this.pests.push(newPest(kind, p.x, p.y, this.rng))
      }
    }
    addPest(wave.blooms, 'bloom')
    addPest(wave.hummers, 'hummer')
    addPest(wave.storms, 'storm', true)
    addPest(wave.decoys, 'decoy', true)
    for (const pool of this.pools) pool.broods = BROODS
    this.cloudTimer = Math.round(this.plan.cloudEvery / 2)
    this.fairyTimer = Math.round(this.plan.amiEvery / 2)
    this.waveTotal = this.mosquitoesLeft()
  }

  /** Mosquitoes still in the sky (a swarm counts its whole split tree). */
  private mosquitoesLeft(): number {
    let n = 0
    for (const s of this.swarms) n += SWARM_TREE[s.size]
    for (const p of this.pests) n += PEST_TREE[p.kind]
    return n
  }

  /** The last mosquito of the night sprints. */
  private sprinting(): boolean {
    return (
      this.phase === 'play' &&
      !this.boss &&
      this.wave === this.plan.waves.length - 1 &&
      this.swarms.length === 1 &&
      this.swarms[0]!.size === 1 &&
      this.pests.every((p) => p.kind === 'skimmer')
    )
  }

  private waveClear(): boolean {
    return !this.boss && !this.swarms.length && !this.pests.length
  }

  private endWave() {
    this.cloud = null
    this.drops = []
    this.ribbon.clear()
    if (this.mode === 'classic') {
      // The original had no village to thank you: the next wave just comes.
      this.sound.play('level')
      this.advance()
      return
    }
    if (this.wave < this.plan.waves.length - 1) {
      this.phase = 'gap'
      this.phaseTicks = WAVE_GAP
      this.sound.play('level')
      this.banner = {
        text: 'HERE THEY COME',
        sub: this.wave === 0 ? 'THE SECOND SWARM' : 'THE THIRD SWARM',
        ticks: 90,
      }
      return
    }
    this.startDawn()
  }

  /** Dawn: the village counts its huts and thanks the watch, in points and beads. */
  private startDawn() {
    const tally = dawnTally(this.huts)
    const rows = [...tally.rows]
    let total = tally.total
    let beads =
      tally.unbitten * BEADS.hut + (tally.perfect ? BEADS.notABite : 0)
    let thread = false
    if (this.special) {
      const met = specialMet(this.special)
      const label = {
        lanterns: 'LANTERNS KEPT LIT',
        pots: 'ALL THE POTS TIPPED',
        escort: 'THE FIREFLIES GOT ACROSS',
        market: 'THE MARKET STAYED OPEN',
        hill: 'THE SHELTER HELD',
        long: 'THE LONG NIGHT IS DONE',
      }[this.special.kind]
      if (met) {
        rows.push({ label, count: 1, each: 3000, bonus: true })
        total += 3000
        beads += BEADS.special
        thread = tally.perfect
      }
    }
    if (this.bossId) {
      rows.push({
        label: `${BOSS_NAMES[this.bossId].name} NETTED`,
        count: 1,
        each: 0,
      })
      beads += BEADS.boss
    }
    this.dawn = { rows, total, perfect: tally.perfect, beads, thread }
    this.phase = 'dawn'
    this.phaseTicks = DAWN_TICKS
    this.banner = null
    this.kitDrops = []
    this.fairy = null
    this.sound.play('level')
    this.awardMedals(tally.perfect)
    if (this.mode === 'season') this.record.set(this.stepIndex, tally.unbitten)
    if (thread && this.mode === 'season' && !this.inEndless)
      this.threads.add(this.region.id)
    this.beads += beads
    if (!this.demo) {
      this.score += total
      if (tally.perfect) {
        this.lives = Math.min(MAX_LIVES, this.lives + 1)
        this.sound.play('extra')
      }
    }
    for (const hut of this.huts) {
      if (hut.bites === 0)
        this.fx.burst(hut.x, GROUND - 12, this.fxRng, {
          count: 10,
          colours: [RAMPS.gold[4], RAMPS.gold[3], RAMPS.pink[3]],
        })
    }
  }

  /** Tonight's medals: Not a Bite, Lasso Master and Swift Night, kept on the board per region. */
  private awardMedals(perfect: boolean) {
    this.nightMedals = 0
    if (this.demo) return
    let key: string | null = null
    if (this.mode === 'timeattack')
      key = medalKey(THREAD_REGIONS[this.attack.region]!, this.attack.night)
    else if (this.mode === 'season' && !this.inEndless) {
      const step = this.steps[this.stepIndex]
      if (step?.kind === 'night') key = medalKey(step.region, step.night)
    }
    if (!key || this.bossId) return
    const bits = medalsWon({
      perfect,
      biggestLoop: this.biggestLoop,
      ticks: this.nightTicks,
      night: this.plan,
    })
    this.nightMedals = bits
    this.medals = { ...this.medals, [key]: (this.medals[key] ?? 0) | bits }
    // The board is written now; the season's own place waits for the next night.
    this.saveData = {
      ...(this.saveData ?? this.freshSave()),
      medals: { ...this.medals },
    }
  }

  // --- update ------------------------------------------------------------------------------------

  update(input: InputFrame, players?: InputFrame[]) {
    this.frames = players?.length ? players : [input]
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    const controls = this.demo ? this.demoInput() : input

    if (this.phase === 'menu') {
      this.updateMenu(controls)
      return
    }
    if (this.phase === 'result') {
      if (++this.phaseTicks > 60 && (input.pressed.a || input.pressed.start))
        this.over = true
      return
    }
    if (this.phase === 'offer') {
      this.updateOffer(controls)
      return
    }
    if (this.phase === 'map') {
      this.phaseTicks++
      const skip =
        this.phaseTicks > 30 && (controls.pressed.a || controls.pressed.start)
      if (skip || this.phaseTicks > (this.demo ? 120 : MAP_TICKS))
        this.startPlay()
      return
    }
    if (this.phase === 'clinic') {
      this.updateClinic(controls)
      return
    }
    if (this.phase === 'dawn') {
      this.phaseTicks--
      const skip =
        !this.demo &&
        this.phaseTicks < DAWN_TICKS - 60 &&
        (input.pressed.a || input.pressed.start)
      if (this.phaseTicks <= 0 || skip) this.advance()
      return
    }
    if (this.phase === 'bossDone') {
      if (--this.phaseTicks <= 0) {
        // The Night Queen's dawn is the season's: no tally, straight into the ending.
        if (this.bossId === 'queen') this.advance()
        else this.startDawn()
      }
      return
    }
    if (this.phase === 'ending') {
      const e = this.ending!
      e.t++
      const skip =
        !this.demo &&
        e.t > SKIP_AFTER &&
        (input.pressed.a || input.pressed.start)
      if (skip || e.t > (this.demo ? 300 : CREDITS_TICKS)) this.advance()
      return
    }

    if (this.card && ++this.card.t > 150) this.card = null
    if (this.alive) this.updateShip(controls)
    else this.tryRespawn()
    this.updateMates()

    this.nightTicks++
    this.attack.ticks++
    this.updateWind()
    this.updateWeather()
    this.updateShots()
    this.updateSwarms()
    this.updatePests()
    this.updateSpecial()
    this.updateCloud()
    this.updateFairy()
    this.updateKit()
    this.updateBoss()
    this.collide()

    if (this.phase === 'gap') {
      if (--this.phaseTicks <= 0) this.startWave(this.wave + 1)
    } else if (this.waveClear() && this.anyoneUp()) {
      this.endWave()
    }

    if (this.lives <= 0 && !this.anyoneUp() && ++this.overTimer > 90) {
      this.over = true
    }
  }

  private updateOffer(input: InputFrame) {
    const s = this.offer
    if (!s) return
    if (input.pressed.a || input.pressed.start) {
      this.offer = null
      this.resumeFrom(s)
    } else if (input.pressed.b) {
      // A new season: threads and ending history stay, the river starts again.
      this.offer = null
      this.saveData = {
        ...s,
        step: 0,
        score: 0,
        beads: 0,
        owned: [],
        hints: [],
        record: [],
        level: undefined,
      }
      this.threads = new Set(s.threads)
      this.record = new Map()
      this.beginStep(0)
      this.openMenu()
    }
  }

  private updateEffects() {
    this.fx.update()
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      p.vx *= 0.97
      p.vy *= 0.97
      p.life--
    }
    this.particles = this.particles.filter((p) => p.life > 0)
    for (const f of this.floaters) {
      f.y -= 0.4
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
    for (const b of this.bags) {
      b.y -= 0.7
      b.life--
    }
    this.bags = this.bags.filter((b) => b.life > 0 && b.y > -40)
    if (this.loopFlash && (this.loopFlash.t -= 1 / 30) <= 0)
      this.loopFlash = null
    if (this.dashTrail && (this.dashTrail.t -= 1 / 14) <= 0)
      this.dashTrail = null
    for (const hut of this.huts) if (hut.flicker > 0) hut.flicker--
    if (this.chainTimer > 0 && --this.chainTimer === 0) this.chain = 0
  }

  private updateShip(input: InputFrame) {
    const ship = this.ship
    const turn = this.sticky > 0 ? TURN * STICKY.turn : TURN
    if (input.held.left) ship.angle -= turn
    if (input.held.right) ship.angle += turn
    const wet = this.soak / STORM.soaked
    this.thrusting = input.held.up
    if (this.thrusting) {
      // Wings bite the air: a flutter swings the drift round toward where the butterfly faces,
      // so fluttering through a turn sweeps an arc (the lasso's loop) instead of skidding.
      const speed0 = Math.hypot(ship.vx, ship.vy)
      ship.vx += (Math.sin(ship.angle) * speed0 - ship.vx) * GRIP
      ship.vy += (-Math.cos(ship.angle) * speed0 - ship.vy) * GRIP
      const thrust = THRUST * (1 - SOAK.thrust * wet)
      ship.vx += Math.sin(ship.angle) * thrust
      ship.vy -= Math.cos(ship.angle) * thrust
      limitSpeed(ship, MAX_SPEED)
    }
    ship.vy += SOAK.sag * wet
    if (this.sticky > 0) this.sticky--
    if (this.boost.ticks > 0 && --this.boost.ticks === 0) this.applyUpgrades()
    if (this.wind.gust > 0) ship.vx += this.wind.dir * WIND.push
    ship.vx *= FRICTION
    ship.vy *= FRICTION
    ship.x += ship.vx
    ship.y += ship.vy
    this.unwrapped.x += ship.vx
    this.unwrapped.y += ship.vy
    wrap(ship)
    this.flap += this.thrusting ? 0.45 : 0.15

    // The ribbon: laid while the butterfly flutters, or glides fast on a flutter's way.
    this.ribbon.age(this.tick)
    if (!this.ribbon.points.length) {
      this.unwrapped.x = ship.x
      this.unwrapped.y = ship.y
    }
    const streaming = Math.hypot(ship.vx, ship.vy) >= RIBBON_SPEED
    if ((this.thrusting || streaming) && this.tick % RIBBON_STEP === 0)
      this.layRibbon()

    if (this.fireCooldown > 0) this.fireCooldown--
    const wantsFire =
      (input.pressed.a && this.fireCooldown <= FIRE_COOLDOWN - 4) ||
      (input.held.a && this.fireCooldown === 0)
    const fan = this.kit?.id === 'fan'
    if (wantsFire && this.shots.length < (fan ? FAN.shots : MAX_SHOTS)) {
      const life = Math.round(SHOT_LIFE * (this.kit?.id === 'long' ? LONG : 1))
      for (const turn of fan ? [-FAN.spread, 0, FAN.spread] : [0]) {
        const a = ship.angle + turn
        this.shots.push({
          x: ship.x + Math.sin(a) * 13,
          y: ship.y - Math.cos(a) * 13,
          vx: ship.vx + Math.sin(a) * SHOT_SPEED,
          vy: ship.vy - Math.cos(a) * SHOT_SPEED,
          life,
          hue: this.tick,
        })
      }
      this.fireCooldown = input.pressed.a ? FIRE_COOLDOWN : AUTOFIRE_COOLDOWN
      this.sound.play('shoot')
    }

    this.updateB(input.held.b || input.pressed.b)

    if (this.brave > 0 && --this.brave === 0) {
      this.addScore(BRAVE.points, ship.x, ship.y - 16, 'BRAVE HOP!')
      this.sound.play('pickup')
    }
    this.updateLurk()
    if (this.invuln > 0) this.invuln--
    if (this.shield > 0 && --this.shield === 0) this.shieldHits = 0
  }

  /** B: tap to flutter-dash, hold to long-hop. */
  private updateB(held: boolean) {
    if (this.bCooldown > 0) this.bCooldown--
    if (held) {
      if (this.bHeld === -2) return
      this.bHeld = this.bHeld < 0 ? 0 : this.bHeld + 1
      if (this.bHeld >= DASH.hold) {
        this.bHeld = -2
        if (this.bCooldown === 0) this.longHop()
      }
      return
    }
    if (this.bHeld >= 0 && this.bCooldown === 0) this.dash()
    this.bHeld = -1
  }

  private dash() {
    const ship = this.ship
    const from = { x: ship.x, y: ship.y }
    const dx = Math.sin(ship.angle) * DASH.distance
    const dy = -Math.cos(ship.angle) * DASH.distance
    ship.x += dx
    ship.y += dy
    this.unwrapped.x += dx
    this.unwrapped.y += dy
    ship.vx += Math.sin(ship.angle) * 1.2
    ship.vy -= Math.cos(ship.angle) * 1.2
    limitSpeed(ship, MAX_SPEED)
    wrap(ship)
    this.dashTrail = { from, to: { x: from.x + dx, y: from.y + dy }, t: 1 }
    this.shakeOff()
    this.invuln = Math.max(this.invuln, DASH.invuln)
    this.bCooldown = this.dashCooldown
    // A dash mid-flutter carries the ribbon with it: a straight cut that can close a loop.
    if (this.tick - this.lastLaid <= RIBBON_STEP + 1) this.layRibbon()
    this.sound.play('blip')
  }

  private longHop() {
    const ship = this.ship
    this.burst(ship.x, ship.y, 10, RAINBOW)
    ship.x = 20 + this.rng() * (W - 40)
    ship.y = 20 + this.rng() * (SKY - 60)
    ship.vx = 0
    ship.vy = 0
    this.ribbon.clear()
    this.unwrapped = { x: ship.x, y: ship.y }
    this.bCooldown = this.dashCooldown
    this.shakeOff()
    this.burst(ship.x, ship.y, 10, RAINBOW)
    this.sound.play('blip')
    const near = this.swarms.some(
      (s) => wrapDist(s, ship) - SWARM_RADIUS[s.size] < BRAVE.reach,
    )
    this.brave = near ? BRAVE.ticks : 0
  }

  /** B shakes a sticky swarm's gum off the wings. */
  private shakeOff() {
    if (this.sticky <= 0) return
    this.sticky = 0
    this.floater(
      this.ship.x,
      this.ship.y - 20,
      'SHAKEN OFF!',
      RAMPS.gold[4],
      50,
    )
  }

  private layRibbon() {
    const joined = this.tick - this.lastLaid <= RIBBON_STEP + 1
    const loop = this.ribbon.lay(
      this.unwrapped.x,
      this.unwrapped.y,
      this.tick,
      joined,
    )
    this.lastLaid = this.tick
    if (loop) this.closeLoop(loop)
  }

  /** Hanging about an edge, or sitting idle, brings the malaria cloud early and sharper. */
  private updateLurk() {
    const ship = this.ship
    const speed = Math.hypot(ship.vx, ship.vy)
    const edge =
      ship.x < LURK.edge || ship.x > W - LURK.edge || ship.y < LURK.edge
    const lurking = (edge && speed < 1.6) || (speed < 0.3 && !this.thrusting)
    this.lurk = lurking ? this.lurk + 1 : Math.max(0, this.lurk - 2)
    if (
      this.lurk < LURK.ticks ||
      this.phase !== 'play' ||
      this.boss ||
      !this.swarms.length
    )
      return
    this.lurk = 0
    if (this.cloud) this.cloud.angry = true
    else this.spawnCloud(true)
    this.floater(ship.x, ship.y - 20, 'NO LURKING!', SICK[3], 70)
  }

  private tryRespawn() {
    if (this.lives <= 0) return
    if (this.respawn > 0) {
      this.respawn--
      return
    }
    const centre = { x: W / 2, y: SKY / 2 }
    const clear =
      this.swarms.every(
        (s) => wrapDist(s, centre) > SWARM_RADIUS[s.size] + 60,
      ) &&
      this.pests.every(
        (p) => p.kind !== 'needle' || wrapDist(p, centre) > 70,
      ) &&
      !this.boss?.touches(centre, 40)
    if (!clear) return
    Object.assign(this.ship, { x: W / 2, y: SKY / 2, vx: 0, vy: 0, angle: 0 })
    this.unwrapped = { x: W / 2, y: SKY / 2 }
    this.ribbon.clear()
    this.alive = true
    this.invuln = INVULN_TICKS
    this.lurk = 0
  }

  /** The later regions' weather: tide, fog, light strings, the storm, moonlight coins. */
  private updateWeather() {
    if (this.phase !== 'play' && this.phase !== 'gap') return
    const w = this.weather
    const ship = this.ship
    const build = Math.min(1, this.nightTicks / 5400)
    const ev = tickWeather(w, this.rng, build, this.alive ? ship : null)
    if (ev.strikeTell !== undefined) this.sound.play('warn')
    if (ev.strike !== undefined) this.lightning(ev.strike)
    if (w.tide) {
      const tide = tideLine(w)
      if (this.alive && ship.y > tide - 8) {
        ship.y = tide - 8
        ship.vy = -Math.abs(ship.vy) * 0.6 - 0.3
      }
      for (const s of this.swarms) {
        const r = SWARM_RADIUS[s.size] * 0.5
        if (s.y > tide - r) {
          s.y = tide - r
          s.vy = -Math.abs(s.vy)
        }
      }
      for (const p of this.pests) {
        if (p.kind === 'wriggler' || p.kind === 'skimmer') continue
        if (p.y > tide - PEST_RADIUS[p.kind]) {
          p.y = tide - PEST_RADIUS[p.kind]
          p.vy = -Math.abs(p.vy)
        }
      }
      for (const shot of this.shots) if (shot.y > tide) shot.life = 0
    }
    // A swarm lingering at a lit string of bulbs lays a new mosquito there.
    w.strings.forEach((str) => {
      if (str.dim > 0) return
      const near = this.swarms.find(
        (s) => Math.abs(s.y - stringY(str.y, s.x)) < STRINGS.reach,
      )
      str.linger = near ? str.linger + 1 : Math.max(0, str.linger - 1)
      if (near && str.linger >= STRINGS.lay) {
        str.linger = 0
        this.swarms.push(newSwarm(near.x, near.y, 1, this.rng, this.hunger()))
        this.waveTotal += 1
        this.floater(near.x, near.y - 14, 'LAID ONE!', RAMPS.ember[3], 50)
      }
    })
    if (w.storm.on && this.alive) {
      this.soak = Math.min(STORM.soaked, this.soak + STORM.soak)
      if (
        w.storm.updrafts.some(
          (u) => Math.abs(ship.x - u.x) < STORM.updraftReach,
        )
      ) {
        if (this.soak > 120)
          this.floater(ship.x, ship.y - 20, 'DRIED!', RAMPS.sky[4], 40)
        this.soak = 0
        ship.vy -= 0.15
      }
    }
    if (this.alive) {
      for (const c of w.coins) {
        if (wrapDist(c, ship) >= COINS.reach) continue
        this.addScore(COINS.points, c.x, c.y)
        this.sound.play('pickup')
        c.x = 20 + this.rng() * (W - 40)
        c.y = 40 + this.rng() * (GROUND - 120)
      }
    }
  }

  /** A lightning strike lands: it zaps whatever is in its column, the butterfly included. */
  private lightning(x: number) {
    this.sound.play('boom')
    const inColumn = (p: Point) =>
      Math.abs(toward({ x, y: p.y }, p).x) < STORM.reach
    for (let i = this.swarms.length - 1; i >= 0; i--)
      if (inColumn(this.swarms[i]!)) this.hitSwarm(i, false)
    for (let i = this.pests.length - 1; i >= 0; i--)
      if (inColumn(this.pests[i]!) && this.pests[i]!.kind !== 'storm')
        this.hitPest(i, false)
    if (this.alive && inColumn(this.ship)) this.hurtShip()
  }

  /** Terraces wind: the flags tell, then a gust pushes everything sideways. */
  private updateWind() {
    if (!this.plan.wind || this.phase !== 'play') return
    const w = this.wind
    if (w.gust > 0) {
      w.gust--
      if (!w.gust) w.timer = this.windWait()
      return
    }
    if (w.tell > 0) {
      if (--w.tell === 0) w.gust = WIND.gust
      return
    }
    if (--w.timer <= 0) {
      w.tell = WIND.tell
      w.dir = this.rng() < 0.5 ? -1 : 1
      this.sound.play('warn')
    }
  }

  private updateShots() {
    const gust = this.wind.gust > 0 ? this.wind.dir * WIND.push : 0
    for (const shot of this.shots) {
      shot.vx += gust
      shot.x += shot.vx
      shot.y += shot.vy
      wrap(shot)
      shot.life--
    }
    this.shots = this.shots.filter((shot) => shot.life > 0)
    for (const drop of this.drops) {
      drop.vy += drop.fall
      drop.vx += gust
      drop.x += drop.vx
      drop.y += drop.vy
      if (drop.fall) {
        if (drop.y > GROUND) drop.life = 0
        if (drop.x < 0) drop.x += W
        else if (drop.x >= W) drop.x -= W
      } else {
        wrap(drop)
      }
      drop.life--
    }
    this.drops = this.drops.filter((drop) => drop.life > 0)
  }

  /** Everything a swarm is drawn to this tick: lit huts, the lanterns, AMI's lure. */
  private lights(): Light[] {
    const lights = hutLights(this.huts)
    if (this.special) lights.push(...specialLights(this.special))
    lights.push(...stringLights(this.weather))
    if (this.lure)
      lights.push({
        x: this.lure.x,
        y: this.lure.y,
        pull: LURE.pull,
        grounded: false,
        id: 200,
      })
    return lights
  }

  private updateSwarms() {
    if (this.phase !== 'play') return
    const sprint = this.sprinting()
    const lights = this.lights()
    const gust = this.wind.gust > 0 ? this.wind.dir * WIND.push * 0.7 : 0
    for (const s of this.swarms) {
      s.sprint = sprint
      if (sprint || (this.lure && s.mode !== 'shoo')) s.hunger = 0
      if (this.lure && s.mode === 'wander') s.mode = 'seek'
      flySwarm(s, {
        swarms: this.swarms,
        lights,
        glow: this.alive ? this.ship : null,
        speed: this.plan.speed,
        rng: this.rng,
      })
      s.x += gust * 8
      wrap(s)
    }
    // Bites: a hungry swarm that reaches a lit window or a lantern.
    for (const s of this.swarms) {
      if (s.mode !== 'seek') continue
      const r = SWARM_RADIUS[s.size]
      const hut = this.huts.find((h) => hutLit(h) && reachesHut(h, s.x, s.y, r))
      if (hut) {
        this.bite(hut, s)
        continue
      }
      if (this.biteSpecial(s, r)) continue
      if (this.special?.kind === 'lanterns') {
        const lantern = this.special.lanterns.find(
          (l) =>
            !l.bitten &&
            Math.abs(l.x - s.x) < 8 + r * 0.6 &&
            Math.abs(LANTERN.y - s.y) < 10 + r * 0.6,
        )
        if (lantern) {
          lantern.bitten = true
          lantern.flicker = 60
          this.shoo(s)
          this.floater(
            lantern.x,
            LANTERN.y - 26,
            'LANTERN OUT',
            RAMPS.ember[3],
            70,
          )
        }
      }
    }
    const { swarms, merged } = regroupSwarms(this.swarms)
    this.swarms = swarms
    for (const m of merged)
      this.floater(
        m.x,
        m.y - SWARM_RADIUS[m.size] - 6,
        'REGROUPED',
        SICK[3],
        50,
      )
  }

  /** A hungry swarm at the night's special light: the firefly cloud, the lit stall, the shelter. */
  private biteSpecial(s: Swarm, r: number): boolean {
    const sp = this.special
    if (!sp) return false
    const reach = (x: number, y: number, extra: number) =>
      Math.abs(toward(s, { x, y }).x) < extra + r * 0.6 &&
      Math.abs(y - s.y) < extra + r * 0.6
    if (sp.kind === 'escort') {
      const e = sp.escort
      if (e.arrived || e.health <= 0 || !reach(e.x, e.y, ESCORT.reach))
        return false
      e.health--
      e.flicker = 50
      this.shoo(s)
      this.floater(
        e.x,
        e.y - 24,
        e.health ? 'FIREFLIES DIM' : 'THEY SCATTERED',
        RAMPS.ember[3],
        60,
      )
      return true
    }
    if (sp.kind === 'market') {
      const stall = sp.stalls[sp.lit]!
      if (!reach(stall.x, MARKET.y, 12)) return false
      stall.bites++
      stall.flicker = 50
      this.shoo(s)
      return true
    }
    if (sp.kind === 'hill') {
      const sh = sp.shelter
      if (!reach(sh.x, sh.y, 14)) return false
      sh.bites++
      sh.flicker = 60
      this.shoo(s)
      this.floater(sh.x, sh.y - 30, 'THE SHELTER!', RAMPS.ember[3], 60)
      return true
    }
    return false
  }

  private shoo(s: Swarm) {
    s.mode = 'shoo'
    s.modeTicks = SHOO_TICKS
    s.hunger = this.hunger()
    s.vy = -1.6
    this.sound.play('warn')
  }

  private bite(hut: Hut, s: Swarm | null) {
    hut.bites++
    hut.flicker = 60
    if (s) this.shoo(s)
    else this.sound.play('warn')
    if (!hutLit(hut))
      this.floater(hut.x, GROUND - 44, 'NETS UP', RAMPS.sky[3], 80)
  }

  private updatePests() {
    if (this.phase !== 'play') return
    const host = {
      rng: this.rng,
      target: this.alive ? this.ship : null,
      spray: (x: number, y: number, vx: number, vy: number) => {
        this.drops.push({ x, y, vx, vy, life: 150, fall: 0.05 })
      },
    }
    const hatched: Pest[] = []
    for (const p of this.pests) {
      const event = movePest(p, host)
      if (event === 'hatch') hatched.push(p)
      else if (event === 'dash' || event === 'crackle') this.sound.play('warn')
      else if (event === 'strike') this.sound.play('boom')
      if (this.wind.gust > 0 && p.kind !== 'skimmer')
        p.x += this.wind.dir * WIND.push * 6
    }
    // A decoy that reaches the ground fizzles out.
    this.pests = this.pests.filter(
      (p) => p.kind !== 'decoy' || p.y < GROUND - 6,
    )
    for (const p of hatched) {
      this.pests.splice(this.pests.indexOf(p), 1)
      const s = newSwarm(p.x, p.y, 2, this.rng, 30)
      s.vy = -0.6
      this.swarms.push(s)
      this.waveTotal += SWARM_TREE[2]
      this.floater(p.x, p.y - 22, 'HATCHED!', RAMPS.ember[3], 60)
      this.sound.play('warn')
    }
    // Standing water breeds while the swarms are out.
    if (!this.swarms.length) return
    for (const pool of this.pools) {
      if (tickPool(pool, this.plan.poolEvery, this.rng)) {
        this.pests.push(newPest('wriggler', pool.x, pool.y - 8, this.rng))
        this.waveTotal += 1
      }
    }
  }

  private updateSpecial() {
    const s = this.special
    if (!s || this.phase === 'dawn') return
    if (s.kind === 'lanterns') walkLanterns(s.lanterns)
    else if (s.kind === 'pots') {
      for (const jar of s.jars) if (jar.tipped) jar.tip++
    } else if (s.kind === 'escort') {
      const was = s.escort.arrived
      moveEscort(s.escort, this.alive ? this.ship : null)
      if (!was && s.escort.arrived) {
        this.sound.play('extra')
        this.floater(
          s.escort.x,
          s.escort.y - 30,
          'THE FIREFLIES ARE ACROSS!',
          RAMPS.gold[4],
          90,
        )
      }
    } else if (s.kind === 'market') {
      for (const st of s.stalls) if (st.flicker > 0) st.flicker--
      if (++s.t >= MARKET.lit) {
        s.t = 0
        s.lit = (s.lit + 1) % s.stalls.length
        this.sound.play('blip')
      }
    } else if (s.kind === 'hill') {
      if (s.shelter.flicker > 0) s.shelter.flicker--
    }
  }

  private spawnCloud(angry: boolean) {
    const fromLeft = this.rng() < 0.5
    // The small, sharp cloud turns up more as the score climbs.
    const smallChance =
      this.level < 2 ? 0 : clamp(0.1 + this.score / 60_000, 0, 0.75)
    const small = angry || this.rng() < smallChance
    this.cloud = {
      x: fromLeft ? -24 : W + 24,
      y: 40 + this.rng() * (SKY - 140),
      vx: (fromLeft ? 1 : -1) * (small ? 1.6 : 1.1),
      vy: 0,
      small,
      angry,
      fire: 60,
      turn: 60,
    }
    const quicken = 1 - Math.min(0.35, this.score / 150_000)
    this.cloudTimer = Math.round(this.plan.cloudEvery * quicken)
    this.sound.play('warn')
  }

  private updateCloud() {
    if (this.phase !== 'play') return
    const wave = this.plan.waves[this.wave]
    if (wave?.cloud && !this.cloud && this.swarms.length) {
      if (--this.cloudTimer <= 0) this.spawnCloud(false)
    }
    const cloud = this.cloud
    if (!cloud) return
    cloud.x += cloud.vx
    cloud.y += cloud.vy
    if (--cloud.turn <= 0) {
      cloud.vy = (this.rng() - 0.5) * 1.6
      cloud.turn = 50 + Math.floor(this.rng() * 40)
    }
    cloud.y = clamp(cloud.y, 24, SKY - 80)
    if (cloud.x < -44 || cloud.x > W + 44) {
      this.cloud = null
      return
    }
    if (--cloud.fire <= 0 && this.alive) {
      const d = toward(cloud, this.ship)
      const aim = Math.atan2(d.y, d.x)
      const error =
        this.plan.cloudAim * (cloud.angry ? 0.25 : cloud.small ? 0.5 : 1)
      const angle = aim + (this.rng() - 0.5) * 2 * error
      this.drops.push({
        x: cloud.x,
        y: cloud.y,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3,
        life: 90,
        fall: 0,
      })
      cloud.fire = Math.round(this.plan.cloudFire * (cloud.angry ? 0.6 : 1))
    }
  }

  /** The kit AMI may bring tonight. */
  private kitChoices(): readonly KitId[] {
    if (this.boss || this.inEndless)
      return ['net', 'ring', 'fan', 'wingman', 'lure', 'long', 'bats']
    return this.region.kit
  }

  private updateFairy() {
    if (this.phase === 'dawn') return
    const busy = this.swarms.length > 0 || !!this.boss
    if (!this.fairy && this.kitWanted) this.fairyTimer = 0
    if (!this.fairy && --this.fairyTimer <= 0 && busy) {
      const fromLeft = this.rng() < 0.5
      this.fairy = {
        x: fromLeft ? -16 : W + 16,
        y: 34 + this.rng() * 20,
        vx: fromLeft ? 1.5 : -1.5,
        vy: 0,
        dropAt: 80 + this.rng() * (W - 160),
        carrying: true,
        kit: this.kitWanted ?? pickKit(this.rng, this.kitChoices()),
      }
      this.kitWanted = null
      this.fairyTimer = this.plan.amiEvery
    }
    const fairy = this.fairy
    if (fairy) {
      fairy.x += fairy.vx
      fairy.y += Math.sin(this.tick / 10) * 0.4
      const passed =
        fairy.vx > 0 ? fairy.x >= fairy.dropAt : fairy.x <= fairy.dropAt
      if (fairy.carrying && passed) {
        fairy.carrying = false
        this.kitDrops.push({
          x: fairy.x,
          y: fairy.y + 10,
          vx: 0,
          vy: 0.8,
          spin: 0,
          kit: fairy.kit,
        })
      }
      if (fairy.x < -30 || fairy.x > W + 30) this.fairy = null
    }
    for (const drop of this.kitDrops) {
      drop.y += drop.vy
      drop.x += Math.sin((this.tick + drop.spin * 50) / 30) * 0.4
      drop.spin += 0.02
    }
    this.kitDrops = this.kitDrops.filter((d) => d.y < GROUND)
  }

  private giveNet() {
    this.shield = SHIELD_TICKS
    this.shieldHits = this.owned.has('sturdyNet') ? 2 : 1
  }

  /** Catch what AMI dropped. */
  private takeKit(id: KitId) {
    const ship = this.ship
    this.addScore(KIT[id].points, ship.x, ship.y)
    this.sound.play('pickup')
    this.fx.burst(ship.x, ship.y, this.fxRng, {
      count: 14,
      colours: [KIT[id].ramp[4], KIT[id].ramp[3], '#ffffff'],
    })
    this.banner = { text: KIT[id].name, sub: 'THANK YOU, AMI', ticks: 70 }
    if (id === 'net') {
      this.giveNet()
    } else if (id === 'lure') {
      // The butterfly carries the lantern a while (the flock follows it), then hangs it up.
      this.lure = {
        x: ship.x,
        y: clamp(ship.y, 50, GROUND - 70),
        ticks: KIT.lure.ticks,
        carry: LURE_CARRY,
      }
    } else if (id === 'bats') {
      const fromLeft = ship.x > W / 2
      this.bats = Array.from({ length: BATS.count }, (_, i) => ({
        x: fromLeft ? -20 - (i % 2) * 18 : W + 20 + (i % 2) * 18,
        y: 40 + i * ((GROUND - 100) / (BATS.count - 1)),
        vx: (fromLeft ? 1 : -1) * BATS.speed,
        vy: 0,
      }))
    } else if (id === 'wingman') {
      this.wingman = {
        x: ship.x,
        y: ship.y,
        vx: 0,
        vy: -1,
        ticks: KIT.wingman.ticks,
      }
    } else {
      this.kit = { id, ticks: KIT[id].ticks }
      this.ringRest = [0, 0, 0]
    }
  }

  private updateKit() {
    if (this.phase !== 'play' && this.phase !== 'gap') return
    if (this.kit && --this.kit.ticks <= 0) this.kit = null
    if (this.lure && --this.lure.ticks <= 0) this.lure = null
    if (this.lure && this.lure.carry > 0) {
      this.lure.carry--
      if (this.alive) {
        this.lure.x = this.ship.x
        this.lure.y = clamp(this.ship.y, 50, GROUND - 60)
      } else {
        this.lure.carry = 0
      }
    }
    // The bat squadron sweeps across, gobbling lone mosquitoes and small pests.
    for (const b of this.bats) {
      b.x += b.vx
      b.y += Math.sin((this.tick + b.x) / 20) * 0.6
      for (let i = this.swarms.length - 1; i >= 0; i--) {
        const s = this.swarms[i]!
        if (s.size === 1 && wrapDist(s, b) < BATS.reach) this.hitSwarm(i, false)
      }
      for (let i = this.pests.length - 1; i >= 0; i--) {
        const q = this.pests[i]!
        if (
          q.kind !== 'bloom' &&
          q.kind !== 'storm' &&
          wrapDist(q, b) < BATS.reach
        )
          this.hitPest(i, false)
      }
    }
    this.bats = this.bats.filter((b) => b.x > -60 && b.x < W + 60)
    // The repellent ring's orbs pop what they touch.
    if (this.kit?.id === 'ring' && this.alive) {
      this.ringAngle += RING.spin
      for (let i = 0; i < RING.orbs; i++) {
        if (this.ringRest[i]! > 0) {
          this.ringRest[i]!--
          continue
        }
        const a = this.ringAngle + (i * Math.PI * 2) / RING.orbs
        const orb = {
          x: this.ship.x + Math.cos(a) * RING.radius,
          y: this.ship.y + Math.sin(a) * RING.radius,
        }
        const s = this.swarms.findIndex(
          (w) => wrapDist(w, orb) < SWARM_RADIUS[w.size] * 0.6 + RING.reach,
        )
        if (s >= 0) {
          this.hitSwarm(s, true)
          this.ringRest[i] = RING.rest
          continue
        }
        const p = this.pests.findIndex(
          (q) => wrapDist(q, orb) < PEST_RADIUS[q.kind] + RING.reach,
        )
        if (p >= 0) {
          this.hitPest(p, true)
          this.ringRest[i] = RING.rest
        }
      }
    }
    // The dragonfly hunts lone mosquitoes, then pests, then the smallest swarm.
    const d = this.wingman
    if (d) {
      d.ticks--
      let prey: Point | null = null
      let best = Infinity
      for (const s of this.swarms) {
        const dist = wrapDist(d, s) + (s.size - 1) * 160
        if (dist < best) {
          best = dist
          prey = s
        }
      }
      for (const p of this.pests) {
        const dist = wrapDist(d, p) + 60
        if (dist < best) {
          best = dist
          prey = p
        }
      }
      const want = d.ticks <= 0 || !prey ? { x: d.x, y: -40 } : prey
      const v = toward(d, want)
      const m = Math.hypot(v.x, v.y) || 1
      d.vx += ((v.x / m) * WINGMAN.speed - d.vx) * WINGMAN.turn
      d.vy += ((v.y / m) * WINGMAN.speed - d.vy) * WINGMAN.turn
      d.x += d.vx
      d.y += d.vy
      if (d.ticks <= 0) {
        if (d.y < -20) this.wingman = null
      } else {
        wrap(d)
        const s = this.swarms.findIndex(
          (w) => wrapDist(w, d) < SWARM_RADIUS[w.size] * 0.6 + WINGMAN.reach,
        )
        if (s >= 0) this.hitSwarm(s, false)
        const p = this.pests.findIndex(
          (q) => wrapDist(q, d) < PEST_RADIUS[q.kind] + WINGMAN.reach,
        )
        if (p >= 0) this.hitPest(p, false)
      }
    }
  }

  private bossHost(): BossHost {
    return {
      rng: this.rng,
      ship: () => (this.alive ? this.ship : null),
      huts: this.huts,
      bite: (hut) => this.bite(hut, null),
      score: (points, at, label) => this.addScore(points, at.x, at.y, label),
      sound: (name) => this.sound.play(name),
      spawn: (at, size = 1) => {
        const s = newSwarm(at.x, at.y, size, this.rng, this.hunger())
        this.swarms.push(s)
      },
      spawnPest: (kind, at) => {
        this.pests.push(newPest(kind, at.x, at.y, this.rng))
      },
      addPool: (at) => {
        const pool = newPool(at, this.plan.poolEvery, this.rng)
        this.pools.push(pool)
      },
      dropKit: (kit) => {
        this.kitWanted = kit
      },
      lure: () =>
        this.lure
          ? { x: this.lure.x, y: this.lure.y, carried: this.lure.carry > 0 }
          : null,
      pushShots: (dx) => {
        for (const shot of this.shots) shot.vx += dx
      },
      ribbonBoost: (ticks, life) => {
        this.boost = { ticks: Math.max(this.boost.ticks, ticks), life }
        this.applyUpgrades()
      },
      burst: (at, count) =>
        this.fx.burst(at.x, at.y, this.fxRng, {
          count,
          colours: [...RAINBOW],
          speed: 2.4,
        }),
    }
  }

  private updateBoss() {
    const boss = this.boss
    if (!boss || this.phase !== 'play') return
    boss.update(this.bossHost())
    if (boss.done) {
      this.phase = 'bossDone'
      this.phaseTicks = BOSS_DONE_TICKS
      this.cloud = null
      this.drops = []
      this.banner =
        this.bossId === 'queen'
          ? {
              text: 'DAWN AT LAST',
              sub: 'THE RAINS ARE OVER',
              ticks: BOSS_DONE_TICKS,
            }
          : {
              text: 'THE NEST IS QUIET',
              sub: 'THE VILLAGE CHEERS',
              ticks: BOSS_DONE_TICKS,
            }
    }
  }

  // --- the Clinic --------------------------------------------------------------------------------

  /** The region the next night belongs to (for the thread hint). */
  private nextRegion(): RegionDef | null {
    for (let i = this.stepIndex + 1; i < this.steps.length; i++) {
      const s = this.steps[i]!
      if (s.kind === 'night') return REGIONS[s.region]
    }
    return null
  }

  private updateClinic(input: InputFrame) {
    const c = this.clinic
    if (!c) return
    c.t++
    const touched =
      input.pressed.up ||
      input.pressed.down ||
      input.pressed.a ||
      input.pressed.b
    c.idle = touched ? 0 : c.idle + 1
    if (input.pressed.up)
      c.cursor = (c.cursor + CLINIC_ROWS.length - 1) % CLINIC_ROWS.length
    if (input.pressed.down) c.cursor = (c.cursor + 1) % CLINIC_ROWS.length
    if (input.pressed.up || input.pressed.down) {
      c.message = ''
      this.sound.play('blip')
    }
    const row = CLINIC_ROWS[c.cursor]!
    const leave =
      input.pressed.b ||
      input.pressed.start ||
      (input.pressed.a && row === 'leave') ||
      c.idle > CLINIC_IDLE
    if (leave && c.t > 20) {
      this.clinic = null
      this.advance()
      return
    }
    if (input.pressed.a && row !== 'leave' && c.t > 20) this.buy(row)
  }

  private buy(item: ClinicItem) {
    const c = this.clinic!
    const price = clinicPrice(item, this.moon)
    if (CLINIC[item].once && this.owned.has(item)) {
      c.message = 'ALREADY YOURS'
      return
    }
    const next = this.nextRegion()
    if (item === 'hint' && !next) {
      c.message = 'NO REGION DOWNRIVER YET'
      return
    }
    if (item === 'hint' && next && this.hints.has(next.id)) {
      c.message = next.threadHint
      return
    }
    if (this.beads < price) {
      c.message = 'NOT ENOUGH BEADS YET'
      this.sound.play('warn')
      return
    }
    this.beads -= price
    this.sound.play('pickup')
    if (item === 'butterfly') {
      this.lives = Math.min(MAX_LIVES, this.lives + 1)
      c.message = 'ONE MORE BUTTERFLY FOR THE WATCH'
    } else if (item === 'hint' && next) {
      this.hints.add(next.id)
      c.message = next.threadHint
    } else {
      this.owned.add(item)
      this.applyUpgrades()
      c.message = 'THANK YOU! IT IS YOURS'
    }
    this.keep()
  }

  // --- scoring and hits ----------------------------------------------------------------------------

  private floater(
    x: number,
    y: number,
    text: string,
    color: string,
    life: number,
  ) {
    this.floaters.push({ x, y, text, life, color, scale: 1 })
  }

  private addScore(points: number, x: number, y: number, label?: string) {
    if (this.demo) return
    this.score += points
    this.floater(
      x,
      y,
      label ? `${label} ${points}` : String(points),
      RAMPS.gold[3],
      45,
    )
  }

  /** A sparkle hit: the chain grows if the last one was under a second ago. */
  private chainUp(): number {
    this.chain = this.chainTimer > 0 ? Math.min(CHAIN.max, this.chain + 1) : 1
    this.chainTimer = CHAIN.ticks
    return this.chain
  }

  private hitSwarm(index: number, byShot: boolean) {
    const swarm = this.swarms[index]!
    this.swarms.splice(index, 1)
    const chain = byShot ? this.chainUp() : 1
    this.addScore(SWARM_POINTS[swarm.size] * chain, swarm.x, swarm.y)
    if (chain > 1) this.chainFloater(swarm.x, swarm.y - 12, chain)
    this.burst(swarm.x, swarm.y, swarm.size * 6, [
      '#a3e635',
      '#e2e8f0',
      '#94a3b8',
    ])
    this.sound.play('pop')
    this.fx.burst(swarm.x, swarm.y, this.fxRng, { count: 3 + swarm.size * 2 })
    const halves = splitSwarm(swarm, this.rng, this.hunger())
    if (halves) this.swarms.push(...halves)
  }

  private chainFloater(x: number, y: number, chain: number) {
    // One chain call on screen at a time: the newest replaces the last.
    this.floaters = this.floaters.filter((f) => !f.text.startsWith('CHAIN'))
    this.floaters.push({
      x,
      y,
      text: `CHAIN X${chain}`,
      life: 40 + chain * 6,
      color: RAINBOW[chain % RAINBOW.length]!,
      scale: chain >= CHAIN.max ? 2 : 1,
    })
  }

  private hitPest(index: number, byShot: boolean) {
    const p = this.pests[index]!
    if (byShot && p.hp > 1) {
      // A tough pest takes more than one sparkle.
      p.hp--
      this.sound.play('blip')
      this.burst(p.x, p.y, 4, [RAMPS.cream[3], '#ffffff'])
      return
    }
    this.pests.splice(index, 1)
    if (p.kind === 'bloom') this.scatterHummers(p, 6)
    const chain = byShot ? this.chainUp() : 1
    const label = p.kind === 'wriggler' ? 'NIPPED' : undefined
    this.addScore(PEST_POINTS[p.kind] * chain, p.x, p.y, label)
    if (chain > 1) this.chainFloater(p.x, p.y - 12, chain)
    this.burst(p.x, p.y, 10, [RAMPS.water[3], '#e2e8f0', RAMPS.ember[3]])
    this.fx.burst(p.x, p.y, this.fxRng, { count: 6 })
    this.sound.play('pop')
  }

  /** A bloom cluster broken, or a decoy caught: hummers scatter out of it. */
  private scatterHummers(at: Point, n: number) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      const h = newPest(
        'hummer',
        at.x + Math.cos(a) * 10,
        at.y + Math.sin(a) * 10,
        this.rng,
      )
      h.vx = Math.cos(a) * 1.2
      h.vy = Math.sin(a) * 1.2
      this.pests.push(h)
    }
    this.waveTotal += n
  }

  /** Something hurt the butterfly: the bed net takes it if there is one. */
  private hurtShip() {
    if (!this.alive || this.invuln > 0) return
    const ship = this.ship
    if (this.shield > 0) {
      if (--this.shieldHits <= 0) this.shield = 0
      this.invuln = 60
      this.burst(ship.x, ship.y, 16, ['#ffffff', '#e0f2fe'])
      this.sound.play('pop')
      return
    }
    this.loseLife()
  }

  /** The Rainbow Lasso closes: every mosquito inside is netted at once. */
  private closeLoop(loop: Loop, via?: Point, team = false) {
    const shift = via ?? {
      x: this.ship.x - this.unwrapped.x,
      y: this.ship.y - this.unwrapped.y,
    }
    this.loopFlash = { loop, shift, t: 1 }
    let count = 0
    let cx = 0
    let cy = 0
    let caught = 0
    const inside = (p: Point) => insideLoop(loop, p.x - shift.x, p.y - shift.y)
    this.swarms = this.swarms.filter((s) => {
      if (!inside(s)) return true
      count += SWARM_TREE[s.size]
      cx += s.x
      cy += s.y
      caught++
      return false
    })
    this.pests = this.pests.filter((p) => {
      if (!inside(p)) return true
      count += PEST_TREE[p.kind]
      cx += p.x
      cy += p.y
      caught++
      return false
    })
    const bossCaught = this.boss?.lasso(inside, this.bossHost()) ?? false
    if (!count) {
      this.sound.play(bossCaught ? 'extra' : 'blip')
      return
    }
    this.biggestLoop = Math.max(this.biggestLoop, count)
    cx /= caught
    cy /= caught
    const mult = lassoMultiplier(count) * (team ? TEAM_MULTIPLIER : 1)
    const points = LASSO_POINTS * count * mult + (team ? TEAM_BONUS * count : 0)
    this.addScore(points, cx, cy + 14, team ? 'TEAM LASSO' : undefined)
    this.floaters.push({
      x: cx,
      y: cy - 18,
      text:
        mult > 1
          ? `${team ? 'TEAM ' : ''}NETTED ${count} X${mult}`
          : `NETTED ${count}`,
      life: 70,
      color: RAMPS.sky[4],
      scale: count >= 7 ? 2 : 1,
    })
    this.bags.push({ x: cx, y: cy, count, life: 140 })
    this.fx.burst(cx, cy, this.fxRng, {
      count: 10 + Math.min(20, count * 2),
      colours: [...RAINBOW],
      speed: 2.4,
    })
    this.sound.play('extra')
  }

  /** A sparkle on one of the night's jars: two taps tip it, and its paddy runs dry. */
  private shootJar(shot: Shot): boolean {
    if (this.special?.kind !== 'pots') return false
    const jar = this.special.jars.find(
      (j) => !j.tipped && wrapDist(j, shot) < JAR.radius,
    )
    if (!jar) return false
    jar.hits++
    this.sound.play('blip')
    if (jar.hits >= JAR.hits) {
      jar.tipped = true
      const pool = this.pools[jar.pool]
      if (pool) {
        pool.dry = true
        pool.ripple = 0
      }
      this.addScore(JAR.points, jar.x, jar.y - 12, 'TIPPED!')
      this.sound.play('pickup')
      this.burst(jar.x, jar.y, 12, [
        RAMPS.water[3],
        RAMPS.water[4],
        RAMPS.rust[3],
      ])
    }
    return true
  }

  private collide() {
    const host = this.boss ? this.bossHost() : null
    for (const shot of this.shots) {
      if (shot.life <= 0) continue
      if (this.boss && host && this.boss.shot(shot, host)) {
        shot.life = 0
        continue
      }
      const hit = this.swarms.findIndex(
        (s) => wrapDist(shot, s) < SWARM_RADIUS[s.size],
      )
      if (hit >= 0) {
        shot.life = 0
        this.hitSwarm(hit, true)
        continue
      }
      const pest = this.pests.findIndex(
        (p) => wrapDist(shot, p) < PEST_RADIUS[p.kind] + 2,
      )
      if (pest >= 0) {
        shot.life = 0
        this.hitPest(pest, true)
        continue
      }
      if (this.shootJar(shot)) {
        shot.life = 0
        continue
      }
      const string = this.weather.strings.find(
        (str) => str.dim === 0 && Math.abs(shot.y - stringY(str.y, shot.x)) < 4,
      )
      if (string) {
        // A sparkle dims a string of bulbs, and the flock goes elsewhere.
        shot.life = 0
        string.dim = STRINGS.dim
        string.linger = 0
        this.floater(shot.x, shot.y - 10, 'DIMMED', RAMPS.sky[4], 40)
        this.sound.play('blip')
        continue
      }
      const cloud = this.cloud
      if (cloud && wrapDist(shot, cloud) < (cloud.small ? 14 : 24)) {
        shot.life = 0
        const chain = this.chainUp()
        this.addScore((cloud.small ? 1000 : 200) * chain, cloud.x, cloud.y)
        this.burst(cloud.x, cloud.y, 24, ['#65a30d', '#a3e635', '#d9f99d'])
        this.fx.burst(cloud.x, cloud.y, this.fxRng, { count: 16, speed: 2.2 })
        this.sound.play('boom')
        this.cloud = null
      }
    }
    this.shots = this.shots.filter((shot) => shot.life > 0)

    if (!this.alive) return
    const ship = this.ship

    const caught = this.kitDrops.findIndex((d) => wrapDist(d, ship) < 20)
    if (caught >= 0) {
      const [drop] = this.kitDrops.splice(caught, 1)
      this.takeKit(drop!.kit)
    }
    // A decoy glow looks like a falling net; catch it and it bursts into hummers.
    const decoy = this.pests.findIndex(
      (p) => p.kind === 'decoy' && wrapDist(p, ship) < 18,
    )
    if (decoy >= 0) {
      const [d] = this.pests.splice(decoy, 1)
      this.scatterHummers(d!, DECOY_HUMMERS)
      // A breath to get clear of the burst.
      this.invuln = Math.max(this.invuln, 45)
      this.banner = { text: 'A DECOY!', sub: 'IT BLINKED TWICE', ticks: 70 }
      this.sound.play('warn')
    }

    if (this.invuln > 0) return
    if (this.pests.some((p) => struckBy(p, ship))) {
      this.hurtShip()
      return
    }

    const swarmHit = this.swarms.findIndex(
      (s) => wrapDist(s, ship) < SWARM_RADIUS[s.size] * HURT + SHIP_RADIUS - 2,
    )
    const pestHit = this.pests.findIndex(
      (p) =>
        pestHurts(p) &&
        wrapDist(p, ship) < PEST_RADIUS[p.kind] + SHIP_RADIUS - 3,
    )
    const dropHit = this.drops.findIndex(
      (drop) => wrapDist(drop, ship) < SHIP_RADIUS - 1,
    )
    const cloudHit =
      this.cloud &&
      wrapDist(this.cloud, ship) < SHIP_RADIUS + (this.cloud.small ? 10 : 18)
    const bossHit = this.boss?.touches(ship, SHIP_RADIUS - 2) ?? false
    if (swarmHit < 0 && pestHit < 0 && dropHit < 0 && !cloudHit && !bossHit)
      return
    // A sticky swarm gums the wings instead of knocking the butterfly down.
    if (
      swarmHit >= 0 &&
      this.swarms[swarmHit]!.kind === 'sticky' &&
      this.shield <= 0
    ) {
      const [gum] = this.swarms.splice(swarmHit, 1)
      this.sticky = STICKY.ticks
      this.invuln = 40
      this.floater(gum!.x, gum!.y - 20, 'STUCK! TAP B', RAMPS.earth[3], 70)
      this.sound.play('warn')
      return
    }

    if (this.shield > 0) {
      // The net takes the hit, and catches what hit it.
      if (swarmHit >= 0) this.hitSwarm(swarmHit, false)
      else if (pestHit >= 0) this.hitPest(pestHit, false)
      if (dropHit >= 0) this.drops.splice(dropHit, 1)
      if (cloudHit) this.cloud = null
      if (--this.shieldHits <= 0) this.shield = 0
      this.invuln = 60
      this.burst(ship.x, ship.y, 16, ['#ffffff', '#e0f2fe'])
      this.sound.play('pop')
      return
    }

    if (swarmHit >= 0) this.hitSwarm(swarmHit, false)
    else if (pestHit >= 0) this.hitPest(pestHit, false)
    if (dropHit >= 0) this.drops.splice(dropHit, 1)
    this.loseLife()
  }

  private loseLife() {
    this.alive = false
    this.lives--
    this.respawn = RESPAWN_TICKS
    this.brave = 0
    this.chain = 0
    this.chainTimer = 0
    this.kit = null
    this.sticky = 0
    this.soak = 0
    this.ribbon.clear()
    this.burst(this.ship.x, this.ship.y, 40, RAINBOW)
    this.sound.play('die')
    if (this.lives <= 0 && !this.mates.some((m) => m.alive))
      this.banner = { text: 'GAME OVER', ticks: 200 }
  }

  /** Is any butterfly flying, or one still to come back? */
  private anyoneUp(): boolean {
    return this.lives > 0 || this.alive || this.mates.some((m) => m.alive)
  }

  // --- Co-op Flight -------------------------------------------------------------------------------

  /** Put every wingmate back by the first butterfly (a night begins). */
  private seatMates() {
    this.mates = this.mates.length ? newMates(this.mates.length + 1) : []
    for (const m of this.mates) m.invuln = 90
  }

  /** The wingmates fly their own frames, sparkle into the shared sky and lasso with the team. */
  private updateMates() {
    if (!this.mates.length || this.phase !== 'play') return
    const flight = {
      turn: this.sticky > 0 ? TURN * STICKY.turn : TURN,
      thrust: THRUST,
      grip: GRIP,
      friction: FRICTION,
      maxSpeed: MAX_SPEED,
      ribbonSpeed: RIBBON_SPEED,
    }
    const push = this.wind.gust > 0 ? this.wind.dir * WIND.push : 0
    for (const m of this.mates) {
      const frame = this.frames[m.seat] ?? emptyInput()
      if (!m.alive) {
        this.tryRespawnMate(m)
        continue
      }
      if (flyMate(m, frame.held, flight, push, this.tick)) {
        const loop = layMate(m, this.tick)
        if (loop)
          this.closeLoop(loop, {
            x: m.x - m.unwrapped.x,
            y: m.y - m.unwrapped.y,
          })
      }
      if (m.fireCooldown > 0) m.fireCooldown--
      const wantsFire =
        (frame.pressed.a && m.fireCooldown <= FIRE_COOLDOWN - 4) ||
        (frame.held.a && m.fireCooldown === 0)
      if (
        wantsFire &&
        this.shots.length < MAX_SHOTS * (1 + this.mates.length)
      ) {
        this.shots.push({
          x: m.x + Math.sin(m.angle) * 13,
          y: m.y - Math.cos(m.angle) * 13,
          vx: m.vx + Math.sin(m.angle) * SHOT_SPEED,
          vy: m.vy - Math.cos(m.angle) * SHOT_SPEED,
          life: SHOT_LIFE,
          hue: this.tick + m.seat * 90,
        })
        m.fireCooldown = frame.pressed.a ? FIRE_COOLDOWN : AUTOFIRE_COOLDOWN
        this.sound.play('shoot')
      }
      if (m.invuln > 0) m.invuln--
      this.mateStrike(m)
    }
    this.teamLasso()
  }

  /** Ribbons that cross between two butterflies close a loop worth double. */
  private teamLasso() {
    const trails = [
      {
        ribbon: this.ribbon,
        shift: {
          x: this.ship.x - this.unwrapped.x,
          y: this.ship.y - this.unwrapped.y,
        },
        live: this.alive,
      },
      ...this.mates.map((m) => ({
        ribbon: m.ribbon,
        shift: { x: m.x - m.unwrapped.x, y: m.y - m.unwrapped.y },
        live: m.alive,
      })),
    ]
    for (let i = 0; i < trails.length; i++) {
      for (let j = i + 1; j < trails.length; j++) {
        const a = trails[i]!
        const b = trails[j]!
        if (!a.live || !b.live) continue
        const loop = teamLoop(a, b)
        if (!loop) continue
        this.closeLoop(loop, a.shift, true)
        a.ribbon.clear()
        b.ribbon.clear()
        return
      }
    }
  }

  private tryRespawnMate(m: Mate) {
    if (this.lives <= 0) return
    if (m.respawn > 0) {
      m.respawn--
      return
    }
    const at = { x: this.ship.x + 30, y: this.ship.y }
    const clear =
      this.swarms.every((s) => wrapDist(s, at) > SWARM_RADIUS[s.size] + 50) &&
      this.pests.every((p) => p.kind !== 'needle' || wrapDist(p, at) > 70)
    if (!clear) return
    Object.assign(m, { x: at.x, y: at.y, vx: 0, vy: 0, angle: 0 })
    wrap(m)
    m.unwrapped = { x: m.x, y: m.y }
    m.ribbon.clear()
    m.alive = true
    m.invuln = INVULN_TICKS
  }

  /** A wingmate touched something that hurts: a shared life goes, and it flutters back soon. */
  private mateStrike(m: Mate) {
    if (m.invuln > 0) return
    const swarm = this.swarms.findIndex(
      (s) => wrapDist(s, m) < SWARM_RADIUS[s.size] * HURT + SHIP_RADIUS - 2,
    )
    const pest = this.pests.findIndex(
      (p) =>
        pestHurts(p) && wrapDist(p, m) < PEST_RADIUS[p.kind] + SHIP_RADIUS - 3,
    )
    const cloud =
      this.cloud !== null &&
      wrapDist(this.cloud, m) < SHIP_RADIUS + (this.cloud.small ? 10 : 18)
    if (swarm < 0 && pest < 0 && !cloud) return
    if (swarm >= 0) this.hitSwarm(swarm, false)
    else if (pest >= 0) this.hitPest(pest, false)
    m.alive = false
    m.respawn = RESPAWN_TICKS
    m.ribbon.clear()
    this.lives--
    this.burst(m.x, m.y, 30, MATE_TINTS[m.seat % 4]!)
    this.sound.play('die')
    if (this.lives <= 0 && !this.alive && !this.mates.some((o) => o.alive))
      this.banner = { text: 'GAME OVER', ticks: 200 }
  }

  private burst(
    x: number,
    y: number,
    count: number,
    colors: readonly string[],
  ) {
    for (let i = 0; i < count; i++) {
      const a = this.fxRng() * Math.PI * 2
      const s = 0.5 + this.fxRng() * 2.5
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 30 + Math.floor(this.fxRng() * 30),
        max: 60,
        color: colors[i % colors.length]!,
      })
    }
  }

  // --- attract-mode pilot ------------------------------------------------------------------------

  /** The nearest thing that can hurt the butterfly, and how far its edge is. */
  private nearestDanger(
    skip: Swarm | null = null,
  ): { at: Point; gap: number } | null {
    const ship = this.ship
    let best: { at: Point; gap: number } | null = null
    const consider = (at: Point, r: number) => {
      const gap = wrapDist(at, ship) - r
      if (!best || gap < best.gap) best = { at, gap }
    }
    for (const s of this.swarms)
      if (s !== skip) consider(s, SWARM_RADIUS[s.size])
    for (const p of this.pests) {
      if (!pestHurts(p)) continue
      consider(p, PEST_RADIUS[p.kind])
      if (p.kind === 'needle' && p.state !== 'drift') {
        // Stand off a needle's locked line.
        const d = toward(p, ship)
        const along = d.x * Math.cos(p.heading) + d.y * Math.sin(p.heading)
        const across = Math.abs(
          -d.x * Math.sin(p.heading) + d.y * Math.cos(p.heading),
        )
        if (along > 0 && along < 380 && across < 18)
          consider(
            {
              x: ship.x - Math.cos(p.heading) * 20,
              y: ship.y - Math.sin(p.heading) * 20,
            },
            0,
          )
      }
    }
    for (const d of this.drops) consider(d, 2)
    if (this.cloud) consider(this.cloud, this.cloud.small ? 12 : 20)
    for (const t of this.boss?.threats() ?? []) consider(t.at, t.r)
    return best
  }

  /** The pilot at AMI's Clinic: an extra butterfly or a starting net when it can, then on. */
  private clinicPilot(frame: InputFrame): InputFrame {
    const c = this.clinic!
    if (c.t % 20 !== 19) return frame
    const want = (
      ['butterfly', 'startNet', 'sturdyNet', 'ribbon'] as const
    ).find(
      (item) =>
        !(CLINIC[item].once && this.owned.has(item)) &&
        clinicPrice(item, this.moon) <= this.beads,
    )
    const target = CLINIC_ROWS.indexOf(want ?? 'leave')
    if (c.cursor !== target) frame.pressed.down = true
    else frame.pressed.a = true
    return frame
  }

  /** Somewhere the pilot should fly rather than shoot. */
  private pilotGoal(): Point | null {
    const ship = this.ship
    if (this.boss?.goal) {
      const g = this.boss.goal(this.bossHost())
      if (g) return g
    }
    if (this.special?.kind === 'escort') {
      const e = this.special.escort
      if (!e.arrived && e.health > 0) {
        const lead = { x: Math.min(W - 10, e.x + 36), y: e.y }
        if (wrapDist(ship, lead) > 22) return lead
      }
    }
    if (this.soak > STORM.soaked * 0.6) {
      const u = this.weather.storm.updrafts[0]
      if (u) return { x: u.x, y: ship.y }
    }
    return null
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
    const pressed = { ...held }
    const frame = { held, pressed }
    if (this.phase === 'offer') {
      pressed.a = true
      return frame
    }
    if (this.phase === 'map') {
      pressed.a = this.phaseTicks === 60
      return frame
    }
    if (this.phase === 'clinic') return this.clinicPilot(frame)
    if (!this.alive || (this.phase !== 'play' && this.phase !== 'gap'))
      return frame
    const ship = this.ship
    const pilot = this.pilot
    const danger = this.nearestDanger(pilot.loop > 0 ? pilot.mark : null)

    // A loop is dropped the moment something gets close.
    if (danger && danger.gap < 22) pilot.loop = 0
    if (pilot.hold > 0) {
      pilot.hold--
      held.b = true
      return frame
    }
    if (danger && danger.gap < 30 && this.bCooldown === 0) {
      const d = toward(ship, danger.at)
      const diff = angleDiff(ship.angle, Math.atan2(d.x, -d.y))
      if (Math.abs(diff) > 1.4) {
        // The threat is behind or beside: dash on, away from it.
        held.b = true
        pressed.b = true
        return frame
      }
      if (danger.gap < 10) {
        pilot.hold = DASH.hold + 1
        held.b = true
        pressed.b = true
        return frame
      }
    }

    // A lasso: circle round a swarm (or a boss's core) with the ribbon out.
    if (pilot.loop > 0) {
      pilot.loop--
      // Flutter round, coasting when fast, so the wings grip and the turn stays tight.
      held.up = Math.hypot(ship.vx, ship.vy) < 3.3
      // Orbit the mark: fly tangent to a circle about 40 px round it, so the ribbon closes on it.
      const mark =
        this.boss?.lassoMark() ??
        (pilot.mark && this.swarms.includes(pilot.mark) ? pilot.mark : null)
      if (!mark) {
        held[pilot.side] = true
        return frame
      }
      const d = toward(ship, mark)
      const dist = Math.hypot(d.x, d.y)
      const s = pilot.side === 'right' ? 1 : -1
      const corr = clamp((dist - 36) / 12, -0.9, 0.9)
      const want = Math.atan2(d.x, -d.y) - s * (Math.PI / 2 - corr)
      const diff = angleDiff(ship.angle, want)
      if (diff > 0.04) held.right = true
      else if (diff < -0.04) held.left = true
      return frame
    }
    if (!danger || danger.gap > 50 || this.boss?.lassoMark()) {
      const mark =
        this.boss?.lassoMark() ??
        this.swarms.find((s) => {
          const dist = wrapDist(ship, s)
          return dist > 45 && dist < 90
        })
      const dist = mark ? wrapDist(ship, mark) : 0
      const window = this.boss?.lassoMark() || this.tick % 360 < 60
      if (mark && dist > 40 && dist < 100 && window) {
        const d = toward(ship, mark)
        pilot.loop = 120
        pilot.mark = this.boss ? null : (mark as Swarm)
        pilot.side =
          angleDiff(ship.angle, Math.atan2(d.x, -d.y)) > 0 ? 'right' : 'left'
        held.up = true
        held[pilot.side] = true
        return frame
      }
    }

    // A job to fly to: the sunbeam with Old Puddle's lantern, ahead of the fireflies, an updraft.
    const goal = this.pilotGoal()
    if (goal && (!danger || danger.gap > 36)) {
      const d = toward(ship, goal)
      const dist = Math.hypot(d.x, d.y)
      const speed = Math.hypot(ship.vx, ship.vy)
      // Close in, and brake (face back along the drift and flutter) so as not to overshoot.
      const braking = dist < 70 && speed > 1
      const want = braking
        ? Math.atan2(-ship.vx, ship.vy)
        : Math.atan2(d.x, -d.y)
      const diff = angleDiff(ship.angle, want)
      if (diff > 0.05) held.right = true
      else if (diff < -0.05) held.left = true
      held.up = (braking || dist > 26) && Math.abs(diff) < 0.6
      if (this.tick % 10 === 0) pressed.a = true
      return frame
    }

    // Catch a falling kit when it is handy.
    const close = danger && danger.gap < 60 ? danger.at : null
    const net = close
      ? undefined
      : this.kitDrops.find(
          (n) => wrapDist(n, ship) < (this.bossId === 'puddle' ? 999 : 150),
        )
    let target: Point | null = close ?? net ?? null
    if (!target) {
      // Wrigglers and jars first, then whatever is hungriest, then the nearest.
      let best = Infinity
      const consider = (p: Point, bonus: number) => {
        const d = wrapDist(p, ship) - bonus
        if (d < best) {
          best = d
          target = p
        }
      }
      for (const p of this.pests) consider(p, p.kind === 'wriggler' ? 120 : 0)
      for (const s of this.swarms) consider(s, s.mode === 'seek' ? 80 : 0)
      if (this.special?.kind === 'pots')
        for (const j of this.special.jars) if (!j.tipped) consider(j, 60)
      for (const t of this.boss?.targets() ?? []) consider(t, 0)
      if (!target && this.cloud) target = this.cloud
    }
    if (!target) return frame
    const d = toward(ship, target)
    const dist = Math.hypot(d.x, d.y)
    const want = Math.atan2(d.x, -d.y)
    const diff = angleDiff(ship.angle, want)
    if (diff > 0.05) held.right = true
    else if (diff < -0.05) held.left = true
    if (!net && Math.abs(diff) < 0.25 && (close || this.tick % 8 === 0))
      pressed.a = true
    held.up =
      (net ? dist > 20 : dist > 170) &&
      Math.abs(diff) < 0.6 &&
      this.tick % 60 < 30
    return frame
  }

  // --- render ------------------------------------------------------------------------------------

  /** Where the ribbon's unwrapped coordinates sit on the sky. */
  private ribbonShift(): Point {
    return {
      x: this.ship.x - this.unwrapped.x,
      y: this.ship.y - this.unwrapped.y,
    }
  }

  private mapThreads(): Set<number> {
    const out = new Set<number>()
    this.steps.forEach((s, i) => {
      if (s.kind !== 'night' || !this.threads.has(s.region)) return
      if (REGIONS[s.region].nights[s.night]?.special) out.add(i)
    })
    return out
  }

  /** Lights that reveal shade swarms and lift fog, besides the fireflies. */
  private revealers(): Point[] {
    const out: Point[] = []
    if (this.lure) out.push(this.lure)
    if (this.special?.kind === 'escort' && this.special.escort.health > 0)
      out.push(this.special.escort)
    return out
  }

  render(g: CanvasRenderingContext2D) {
    if (this.phase === 'menu' && this.menu) {
      renderMenu(
        g,
        {
          cursor: this.menu.cursor,
          region: this.menu.region,
          open: this.openRegionList(),
          times: this.times,
          board: this.menu.board,
          medals: this.medals,
        },
        this.tick,
      )
      return
    }
    if (this.phase === 'result') {
      this.renderResult(g)
      return
    }
    if (this.phase === 'ending' && this.ending) {
      renderEnding(
        g,
        this.ending.kind,
        this.ending.t,
        THREAD_REGIONS.filter((r) => this.threads.has(r)).length,
        this.tick,
      )
      return
    }
    if (this.phase === 'map' || this.phase === 'offer') {
      const step = this.steps[this.stepIndex]
      const title = this.offer
        ? 'WELCOME BACK'
        : step?.kind === 'boss'
          ? BOSS_NAMES[step.boss].name
          : this.inEndless
            ? `NIGHT ${this.level}`
            : this.plan.title
      const sub = this.offer
        ? 'THE NIGHT WATCH WAITS FOR YOU'
        : step?.kind === 'boss'
          ? BOSS_NAMES[step.boss].title
          : this.inEndless
            ? 'THE RIVER RUNS ON PAST THE MAP'
            : `${this.region.name}  NIGHT ${(step?.kind === 'night' ? step.night : 0) + 1} OF 4`
      renderMap(
        g,
        {
          steps: this.steps,
          current: this.offer?.step ?? this.stepIndex,
          record: this.offer ? new Map(this.offer.record) : this.record,
          threads: this.mapThreads(),
          title,
          sub,
          score: this.score,
          beads: this.offer?.beads ?? this.beads,
          t: this.phaseTicks,
          secretOpen: this.allThreads,
        },
        this.tick,
      )
      if (this.phase === 'offer' && this.offer)
        this.renderOfferCard(g, this.offer)
      return
    }
    if (this.phase === 'clinic' && this.clinic) {
      renderClinic(
        g,
        {
          cursor: this.clinic.cursor,
          beads: this.beads,
          moon: this.moon,
          owned: this.owned,
          lives: this.lives,
          message: this.clinic.message,
          t: this.clinic.t,
        },
        this.tick,
      )
      return
    }
    const backdrop = this.region.backdrop
    cachedLayer(g, `butterfly-blaster-${backdrop}`, W, H, BACKDROPS[backdrop])
    renderStars(g, this.tick)
    renderDriftingClouds(g, this.tick)
    if (backdrop === 'terraces' || backdrop === 'swamp')
      renderMist(g, this.tick)
    for (const pool of this.pools) renderPool(g, pool, this.tick)
    renderWindows(g, this.huts, this.tick)
    renderFireflies(g, this.tick)
    const w = this.weather
    if (w.tide) renderTide(g, tideLine(w), this.tick)
    if (w.strings.length) renderStrings(g, w, this.tick)
    if (w.fireflies.length) renderFireflies2(g, w, this.tick)
    if (w.coins.length) renderCoins(g, w, this.tick)
    const sp = this.special
    if (sp?.kind === 'escort') renderEscort(g, sp.escort, this.tick)
    if (sp?.kind === 'market') renderStalls(g, sp.stalls, sp.lit, this.tick)
    if (sp?.kind === 'hill') renderShelter(g, sp.shelter, this.tick)
    if (this.plan.wind) renderFlags(g, this.tick, this.wind)
    if (this.special?.kind === 'pots')
      for (const j of this.special.jars) renderJar(g, j, this.tick)
    if (this.special?.kind === 'lanterns')
      for (const l of this.special.lanterns) renderLantern(g, l, this.tick)
    if (this.phase === 'dawn' || this.phase === 'bossDone')
      renderDawn(g, this.phase === 'dawn' ? DAWN_TICKS - this.phaseTicks : 0)
    if (this.lure) renderLure(g, this.lure, this.lure.ticks, this.tick)

    if (this.loopFlash)
      renderLoopFlash(
        g,
        this.loopFlash.loop,
        this.loopFlash.shift,
        this.loopFlash.t,
      )
    if (this.alive) renderRibbon(g, this.ribbon, this.ribbonShift(), this.tick)
    for (const m of this.mates)
      if (m.alive)
        renderRibbon(
          g,
          m.ribbon,
          { x: m.x - m.unwrapped.x, y: m.y - m.unwrapped.y },
          this.tick,
        )
    for (const d of this.kitDrops) renderKitDrop(g, d, d.kit, d.spin, this.tick)
    if (this.fairy)
      renderFairy(
        g,
        this.fairy.x,
        this.fairy.y,
        this.fairy.vx > 0 ? 1 : -1,
        this.fairy.carrying,
        this.tick,
      )
    for (const p of this.pests) renderPest(g, p, this.tick)
    const reveal = this.revealers()
    for (const swarm of this.swarms) {
      // A shade swarm is only a shimmer outside firefly light or a lightning flash.
      if (swarm.kind === 'shade' && !litForShade(w, swarm, reveal)) {
        g.save()
        g.globalAlpha = 0.14
        renderSwarm(g, swarm, this.tick)
        g.restore()
      } else {
        renderSwarm(g, swarm, this.tick)
      }
    }
    this.boss?.render(g, this.tick)
    if (w.fog.length) renderFog(g, w, [...w.fireflies, ...reveal])
    renderStorm(g, w, this.tick)
    if (this.cloud)
      renderCloud(
        g,
        this.cloud.x,
        this.cloud.y,
        this.cloud.small,
        this.cloud.angry,
        this.tick,
      )
    for (const drop of this.drops) {
      const ramp = drop.fall ? RAMPS.water : SICK
      glow(g, drop.x, drop.y, 9, ramp[3], 0.5)
      shadedOrb(g, drop.x, drop.y, 2.5, ramp, { glint: false })
    }
    if (this.wind.gust > 0) renderGust(g, this.tick, this.wind.dir)
    for (const p of this.particles) {
      const x = Math.round(p.x)
      const y = Math.round(p.y)
      g.globalAlpha = Math.max(0, p.life / p.max)
      g.fillStyle = INK
      g.fillRect(x - 1, y - 1, 3, 3)
      g.fillStyle = p.color
      g.fillRect(x - 1, y - 1, 2, 2)
    }
    g.globalAlpha = 1
    for (const shot of this.shots) renderSparkle(g, shot, this.tick)
    if (this.dashTrail)
      renderDashTrail(
        g,
        this.dashTrail.from,
        this.dashTrail.to,
        this.dashTrail.t,
      )
    if (this.wingman) renderDragonfly(g, this.wingman, this.tick)
    if (this.bats.length) renderBats(g, this.bats, this.tick)
    if (
      this.alive &&
      !(this.invuln > DASH.invuln && Math.floor(this.invuln / 6) % 2 === 0)
    ) {
      renderButterfly(g, this.ship.x, this.ship.y, this.ship.angle, this.flap)
      if (this.kit?.id === 'ring')
        renderRing(g, this.ship, this.ringAngle, this.tick)
      if (this.sticky > 0) {
        // Gum on the wings.
        for (let i = 0; i < 4; i++) {
          const a = this.ship.angle + i * 1.7
          shadedOrb(
            g,
            this.ship.x + Math.cos(a) * 10,
            this.ship.y + Math.sin(a) * 8,
            2.5,
            RAMPS.earth,
            { glint: false },
          )
        }
      }
      if (
        this.shield > 0 &&
        (this.shield > 90 || Math.floor(this.shield / 8) % 2 === 0)
      ) {
        glow(g, this.ship.x, this.ship.y, 26, RAMPS.teal[3], 0.3)
        renderMesh(g, this.ship.x, this.ship.y, 20, this.tick / 40)
        if (this.shieldHits > 1)
          renderMesh(g, this.ship.x, this.ship.y, 15, -this.tick / 30)
      }
      if (this.brave > 0) {
        drawText(g, 'BRAVE!', this.ship.x, this.ship.y - 30, {
          align: 'center',
          color: RAMPS.gold[4],
          outline: INK,
        })
      }
    }
    for (const m of this.mates) {
      if (!m.alive) continue
      if (m.invuln > 0 && Math.floor(m.invuln / 6) % 2 === 0) continue
      renderButterfly(g, m.x, m.y, m.angle, m.flap, MATE_TINTS[m.seat % 4])
      drawText(g, `P${m.seat + 1}`, m.x, m.y - 24, {
        align: 'center',
        color: MATE_TINTS[m.seat % 4]![0]!,
        outline: INK,
      })
    }
    for (const bag of this.bags)
      renderBag(g, bag.x, bag.y, bag.count, this.tick)
    this.fx.render(g)
    for (const f of this.floaters) {
      drawText(g, f.text, f.x, f.y, {
        align: 'center',
        color: f.color,
        outline: INK,
        scale: f.scale,
      })
    }
    vignette(g, W, H, 0.3)
    this.renderHud(g)
    if (this.card)
      renderTitleCard(
        g,
        this.card.region,
        this.card.t,
        this.hints.has(this.card.region.id)
          ? this.card.region.threadHint
          : null,
      )
    if (this.dawn) this.renderTally(g, this.dawn)
  }

  private renderOfferCard(g: CanvasRenderingContext2D, s: BlasterSave) {
    const step = this.steps[s.step]
    const where =
      step?.kind === 'night'
        ? REGIONS[step.region].name
        : step?.kind === 'boss'
          ? BOSS_NAMES[step.boss].name
          : step?.kind === 'clinic'
            ? "AMI'S CLINIC"
            : step?.kind === 'ending'
              ? 'THE CREDITS'
              : step?.kind === 'dry'
                ? 'THE DRY SEASON'
                : 'THE OPEN RIVER'
    const night =
      step?.kind === 'night'
        ? `NIGHT ${step.night + 1}: ${REGIONS[step.region].nights[step.night]!.title}`
        : step?.kind === 'boss'
          ? 'THE NEST AT THE END OF THE MOON'
          : step?.kind === 'clinic'
            ? 'RESTING BETWEEN REGIONS'
            : `NIGHT ${s.level ?? ''}`
    renderOffer(
      g,
      { where, night, score: s.score, lives: s.lives, beads: s.beads },
      this.tick,
    )
  }

  private renderHud(g: CanvasRenderingContext2D) {
    hudPanel(g, 4, 3, 84, 21)
    drawText(g, String(this.score).padStart(6, '0'), 10, 7, {
      scale: 2,
      color: RAMPS.pink[3],
      shadow: INK,
    })
    const hi = Math.max(this.hiScore, this.score)
    hudPanel(g, W / 2 - 62, 3, 124, 21)
    drawText(g, `HI ${String(hi).padStart(6, '0')}`, W / 2, 7, {
      scale: 2,
      align: 'center',
      color: RAMPS.gold[3],
      shadow: INK,
    })
    const lives = Math.min(this.lives, 6)
    if (lives > 0) {
      hudPanel(g, W - 8 - lives * 14, 3, lives * 14 + 4, 21, RAMPS.pink)
      for (let i = 0; i < lives; i++) {
        const bob = Math.round(Math.sin(this.tick / 12 + i) * 0.6)
        drawSprite(g, LIFE_SPRITE, W - 13 - i * 14, 13 + bob)
      }
    }
    const night = this.bossId
      ? `NIGHT ${this.level}  NEST`
      : `NIGHT ${this.level}  ${this.wave + 1}/${this.plan.waves.length}`
    const nightW = night.length * 6 + 10
    hudPanel(g, 4, H - 19, nightW, 15)
    drawText(g, night, 10, H - 15, { color: RAMPS.purple[4], outline: INK })
    const unbitten = this.huts.filter((h) => h.bites === 0).length
    const safe = `UNBITTEN ${unbitten}`
    const safeW = safe.length * 6 + 10
    hudPanel(g, W - 4 - safeW, H - 19, safeW, 15, RAMPS.gold)
    drawText(g, safe, W - 10, H - 15, {
      align: 'right',
      color: RAMPS.gold[4],
      outline: INK,
    })
    let row = 27
    if (this.special) {
      const line = specialLine(this.special)
      const met = specialMet(this.special)
      const w = line.length * 6 + 10
      hudPanel(g, 4, row, w, 15, met ? RAMPS.leaf : RAMPS.rust)
      drawText(g, line, 10, row + 4, { color: '#ffffff', outline: INK })
      row += 18
    }
    if (this.weather.storm.on) {
      // Rain in the wings: fly through a rainbow updraft to dry them.
      hudPanel(g, 4, row, 92, 15, RAMPS.sky)
      drawText(g, 'WINGS', 10, row + 4, { color: '#ffffff', outline: INK })
      gauge(g, 44, row + 4, 46, 7, 1 - this.soak / STORM.soaked, RAMPS.gold)
    }
    if (this.dry > 0) {
      const tag = `DRY SEASON ${this.dry}`
      hudPanel(
        g,
        W - 10 - tag.length * 6,
        27,
        tag.length * 6 + 6,
        15,
        RAMPS.rust,
      )
      drawText(g, tag, W - 7, 31, {
        align: 'right',
        color: RAMPS.gold[4],
        outline: INK,
      })
    }
    if (this.boss) {
      renderBossBar(g, this.boss.name, this.boss.health, this.boss.hint)
      return
    }
    // The net, AMI's kit and B's cooldown sit under the high score, clear of the pools below.
    const kit =
      this.kit ??
      (this.wingman
        ? { id: 'wingman' as const, ticks: this.wingman.ticks }
        : null) ??
      (this.lure ? { id: 'lure' as const, ticks: this.lure.ticks } : null)
    if (this.shield > 0) {
      hudPanel(g, W / 2 - 60, 27, 120, 15, RAMPS.teal)
      drawText(g, 'NET', W / 2 - 54, 31, { color: RAMPS.teal[4], outline: INK })
      gauge(g, W / 2 - 30, 31, 84, 7, this.shield / SHIELD_TICKS, RAMPS.sky)
    } else if (kit && kit.ticks > 0) {
      const name = KIT[kit.id].name
      const w = name.length * 6 + 70
      hudPanel(g, W / 2 - w / 2, 27, w, 15, KIT[kit.id].ramp)
      drawText(g, name, W / 2 - w / 2 + 6, 31, {
        color: '#ffffff',
        outline: INK,
      })
      gauge(
        g,
        W / 2 + w / 2 - 58,
        31,
        52,
        7,
        kit.ticks / KIT[kit.id].ticks,
        KIT[kit.id].ramp,
      )
    } else if (this.bCooldown > 0) {
      hudPanel(g, W / 2 - 40, 27, 80, 15, RAMPS.purple)
      drawText(g, 'B', W / 2 - 34, 31, { color: RAMPS.purple[4], outline: INK })
      gauge(
        g,
        W / 2 - 24,
        31,
        58,
        7,
        1 - this.bCooldown / this.dashCooldown,
        RAMPS.pink,
      )
    }
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, H / 2 - 40, {
        scale: 3,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.pink[1],
      })
      if (this.banner.sub) {
        drawText(g, this.banner.sub, W / 2, H / 2 - 8, {
          scale: 2,
          align: 'center',
          color: RAMPS.gold[3],
          outline: INK,
        })
      }
    }
  }

  private renderResult(g: CanvasRenderingContext2D) {
    g.fillStyle = INK
    g.fillRect(0, 0, W, H)
    hudPanel(g, 60, 80, W - 120, 200, RAMPS.gold)
    drawText(g, 'REGION CLEARED', W / 2, 98, {
      scale: 2,
      align: 'center',
      color: '#ffffff',
      outline: INK,
    })
    drawText(g, this.region.name, W / 2, 130, {
      align: 'center',
      color: RAMPS.gold[4],
      outline: INK,
    })
    drawText(g, clock(this.attack.done), W / 2, 156, {
      scale: 3,
      align: 'center',
      color: '#ffffff',
      outline: INK,
    })
    const best = this.times[this.region.id]
    drawText(
      g,
      best === this.attack.done ? 'A NEW BEST!' : `BEST ${clock(best ?? 0)}`,
      W / 2,
      192,
      { align: 'center', color: RAMPS.sky[4], outline: INK },
    )
    drawText(g, 'A: DONE', W / 2, 240, {
      align: 'center',
      color: Math.floor(this.tick / 20) % 2 === 0 ? RAMPS.gold[4] : '#ffffff',
      outline: INK,
    })
  }

  private renderTally(g: CanvasRenderingContext2D, tally: Dawn) {
    const t = DAWN_TICKS - this.phaseTicks
    const x = W / 2 - 150
    const y = 60
    const rows = tally.rows.length
    const h =
      96 + rows * 18 + (tally.perfect ? 18 : 0) + (this.nightMedals ? 18 : 0)
    hudPanel(g, x, y, 300, h, RAMPS.gold)
    drawText(g, 'DAWN', W / 2, y + 8, {
      scale: 3,
      align: 'center',
      color: '#ffffff',
      outline: INK,
      shadow: RAMPS.rust[1],
    })
    drawText(g, `NIGHT ${this.level} IS OVER`, W / 2, y + 37, {
      align: 'center',
      color: RAMPS.gold[4],
      outline: INK,
    })
    tally.rows.forEach((row, i) => {
      if (t < 40 + i * 30) return
      const ry = y + 54 + i * 18
      drawText(g, row.label, x + 14, ry, {
        color: RAMPS.cream[3],
        outline: INK,
      })
      const text =
        row.each === 0
          ? ''
          : row.bonus
            ? `+${row.each}`
            : `${row.count} X ${row.each}`
      drawText(g, text, x + 286, ry, {
        align: 'right',
        color: RAMPS.gold[4],
        outline: INK,
      })
    })
    if (t >= 40 + rows * 30) {
      let ry = y + 54 + rows * 18
      if (tally.perfect) {
        drawText(g, '+1 BUTTERFLY FROM THE VILLAGE', W / 2, ry, {
          align: 'center',
          color: RAMPS.pink[3],
          outline: INK,
        })
        ry += 18
      }
      if (this.nightMedals) {
        const names = MEDALS.filter((m) => this.nightMedals & m.bit)
          .map((m) => m.name)
          .join('  ')
        drawText(g, `MEDALS: ${names}`, W / 2, ry + 44, {
          align: 'center',
          color: RAMPS.leaf[3],
          outline: INK,
        })
      }
      drawText(g, `THANK YOU! ${tally.total}`, W / 2, ry + 2, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        outline: INK,
      })
      drawText(
        g,
        tally.thread
          ? `+${tally.beads} BEADS  AND A GOLDEN THREAD!`
          : `+${tally.beads} THANK-YOU BEADS`,
        W / 2,
        ry + 22,
        {
          align: 'center',
          color: tally.thread ? RAMPS.gold[4] : RAMPS.teal[4],
          outline: INK,
        },
      )
    }
  }
}

/** Every pest kind the game knows, for tests. */
export const PEST_KINDS: readonly PestKind[] = ['wriggler', 'skimmer', 'needle']
export { TALLY }

const butterflyBlaster: ArcadeGameModule = {
  create: (options) => new ButterflyBlaster(options),
}

export const create = butterflyBlaster.create
export default butterflyBlaster
