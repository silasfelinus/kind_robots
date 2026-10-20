// /utils/arcade/games/seedLander.ts
//
// Seed Lander -- the Kind Robots Arcade's Lunar Lander riff (conductor kr-arcade/t-009, depth
// pass t-069..t-073: "The Great Replanting", depth-pass CABINETS.md section 9). Pilot a seed pod
// across a wide island several screens across, leaning and puffing sunlight, and set it down
// soft, slow and level on the garden beds to plant them. The camera scrolls with the pod and zooms
// in close below about 40 px of altitude, so the last pixels of a touchdown are easy to read.
//
// Landings rank Feather, Soft, Bumpy or Bonk; a run of Feathers builds a streak multiplier that
// carries from mission to mission. Beds run x1 to x5, the x5s tucked into narrow valleys, on
// peaks, or up where only a beanstalk reaches. Each mission has its own sun tank, topped up at
// sunflowers; running dry opens the pod's leaf cap as a parachute (steer it onto a sunflower to be
// saved) and otherwise the mission is tried again with a spare pod. B hops (the classic's abort:
// upright and one strong puff, for a lot of sun), and holding DOWN over a seed crate hooks it on
// the tether winch.
//
// The Great Replanting is the campaign: island by island (seedLander/islands.ts), five missions
// (Plant, Deliver, Ring Race...) and a boss set-piece each, with an island map between missions,
// living gardens (what a bed grows changes the island), golden acorns, medals, and the Pod Shed
// between islands; progress saves as it is earned. Free Flight builds an endless run of hills from
// the seeded rng and unlocks a new hazard every 4 hills. The flight tier is chosen at the start.
//
// Left/right lean the pod; Up or A puffs; B hops; DOWN works the winch.

import { drawText } from '../font'
import {
  INK,
  RAMPS,
  Sparkles,
  backdropRng,
  glow,
  rgba,
  vignette,
} from '../snes'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'
import {
  BLOOM_COLOURS,
  FLOWER_SPARKS,
  PAD_RAMP,
  drawBloom,
  drawCargo,
  drawPadLive,
  drawPod,
  drawVent,
  paintSky,
  paintTerrain,
} from '../seedLander/art'
import { drawBoss } from '../seedLander/bossArt'
import {
  GALE_MILL,
  GeyserTortoise,
  GlowwormQueen,
  QUEEN,
  TORTOISE,
  THUNDERHEAD,
  Thunderhead,
  OldLander,
  OLD_LANDER,
  makeBoss,
} from '../seedLander/bosses'
import type { Boss } from '../seedLander/bosses'
import { Camera, VIEW_H } from '../seedLander/camera'
import {
  LANTERN,
  LIGHT,
  SPORE,
  crystalBump,
  lanternReached,
  sporeTriggered,
} from '../seedLander/cavern'
import type { LightSource } from '../seedLander/cavern'
import {
  GALE_MAX,
  MEDAL,
  UPGRADES,
  UPGRADE_EFFECT,
  UPGRADE_MAX,
  emptyShed,
  galeMission,
  readLanderSave,
  upgradeCost,
} from '../seedLander/campaign'
import type { LanderSave, Shed } from '../seedLander/campaign'
import {
  BUMPY,
  POD_FEET,
  POD_HALF,
  POD_TOP,
  RANK_NAMES,
  RANK_PAY,
  SAFE,
  SETTLE_TICKS,
  TIERS,
  TIER_ORDER,
  newPod,
  nextStreak,
  predictArc,
  rankLanding,
  steerPod,
  streakMultiplier,
} from '../seedLander/flight'
import type { LandingRank, Pod, PodMods, TierId } from '../seedLander/flight'
import { PLANT_NAMES, bounceSpeed, grow } from '../seedLander/gardens'
import type { Growth } from '../seedLander/gardens'
import {
  CROW,
  DRIP,
  FALL,
  FLUFF,
  PEBBLE,
  STORM,
  crowHits,
  dripAt,
  driftFluff,
  fallPush,
  flyCrow,
  hitsWindmill,
  inFall,
  lanePush,
  pebbleAt,
  stormCloudAt,
  boltHits,
  soakStep,
  newCrow,
  newWindmill,
  rise,
  spawnFluff,
} from '../seedLander/hazards'
import type { Crow, Fluff, Windmill } from '../seedLander/hazards'
import {
  drawAcorn,
  drawCrow,
  drawCrystal,
  drawDarkness,
  drawDrip,
  drawFall,
  drawFirefly,
  drawFluff,
  drawLantern,
  drawSpore,
  fireflies,
  drawGrowsMark,
  drawGrowth,
  drawPebble,
  drawStormCloud,
  drawPodFluff,
  drawRings,
  drawWindmill,
} from '../seedLander/islandArt'
import {
  ALL_ACORNS,
  ISLANDS,
  MISSIONS_PER_ISLAND,
  VAULT_INDEX,
  islandAt,
} from '../seedLander/islands'
import { H, HAZARD_NAMES, HUD_H, W, freeHill } from '../seedLander/missions'
import type { MissionSpec, VentSpec } from '../seedLander/missions'
import {
  clock,
  dailyHill,
  TRIAL_MAX_TICKS,
  dailyHillNumber,
  dateKey,
  masteryPoints,
  masteryRank,
  trialMedal,
  trialMissions,
} from '../seedLander/modes'
import type { DailyBest } from '../seedLander/modes'
import { pilotInput } from '../seedLander/pilot'
import type { PilotGoal } from '../seedLander/pilot'
import {
  drawHud,
  drawIslandMap,
  drawMenu,
  drawMissionCard,
  drawShed,
  drawSoon,
  drawTally,
} from '../seedLander/screens'
import type { MenuRow, TallyLine } from '../seedLander/screens'
import {
  WINCH,
  canHook,
  dropCargo,
  groundCargo,
  newCargo,
  swingCargo,
} from '../seedLander/tether'
import type { Cargo } from '../seedLander/tether'
import { Terrain } from '../seedLander/terrain'
import type { Pad } from '../seedLander/terrain'

export const START_PODS = 3
export const MAX_PODS = 5
/** Free Flight hands out a spare pod every this many hills cleared. */
export const EXTRA_POD_HILLS = 4
/** A bonk's scattered seeds still sprout a few wildflowers: this times the level. */
export const BONK_POINTS = 25
/** A delivered crate pays this per seedling still in it. */
export const DELIVERY_POINTS = 400
/** A spare pod after a bonk never starts with less than this share of the mission's sun. */
export const SPARE_SUN = 0.25
/** Sunflowers refuel a resting pod this much a tick. */
export const SUN_REFILL = 6
/** A planting tops the tank up by this share. */
export const PLANT_SUN = 0.15
/** Points for a boss phase, and for beating one. */
export const BOSS_PHASE_POINTS = 2000
export const BOSS_POINTS = 10000
/** A golden acorn's points and nectar. */
export const ACORN_POINTS = 1500
export const ACORN_NECTAR = 5
/** Nectar for a new medal, and for beating a boss. */
export const MEDAL_NECTAR = 3
export const BOSS_NECTAR = 10

const BONK_TICKS = 110
const DRY_TICKS = 100
const CLEAR_TICKS = 200
const PLANT_SETTLE = 40
const CARD_TICKS = 150

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
  kind: 'puff' | 'chip' | 'streamer' | 'lane'
}
type Floater = {
  x: number
  y: number
  text: string
  life: number
  color: string
}
/** A bloom on a bed; on a moving pad it rides along at `dx` from the pad's centre. */
type Bloom = {
  x: number
  y: number
  colour: string
  age: number
  pad?: string
  dx?: number
}
type Phase = 'fly' | 'bonk' | 'dry' | 'clear'
type Mode = 'free' | 'campaign' | 'daily' | 'trial'
type Screen = 'map' | 'shed' | 'soon'
type MenuId = 'continue' | 'campaign' | 'free' | 'daily' | 'trial' | 'tier'

class SeedLander implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = START_PODS
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  /** Rain wetness 0..1: a wet pod weighs more until it dries on a pad. */
  private wet = 0
  private menu: { pick: number } | null = null
  private mode: Mode = 'free'
  private screen: Screen | null = null
  private tier: TierId = 'standard'
  private mission!: MissionSpec
  private terrain!: Terrain
  private pods: Pod[] = []
  private cargo: Cargo[] = []
  private cargoTo = new Map<string, string>()
  /** Where each cargo started (a popped water bubble returns to its spring). */
  private cargoHome = new Map<string, number>()
  /** Firefly Caverns: lanterns relit so far, ticks each puffball waits to go off again, and
   *  ticks of blurred gauges left. */
  private lit = new Set<string>()
  private sporeWait: number[] = []
  private blur = 0
  private vents: VentSpec[] = []
  private windmills: Windmill[] = []
  private fluffs: Fluff[] = []
  private crows: Crow[] = []
  private boss: Boss | null = null
  private growths: Growth[] = []
  private blooms: Bloom[] = []
  private phase: Phase = 'fly'
  private phaseTicks = 0
  private card = 0
  private planted = 0
  private delivered = 0
  private ring = 0
  private ringTicks = 0
  private streak = 0
  private bestStreak = 0
  private missionTicks = 0
  /** Every landing this mission was a Feather (the Feather medal). */
  private allFeather = true
  private landings = 0
  private sunMax = 900
  private wind = 0
  private windTarget = 0
  private hillsCleared = 0
  private lastRank: LandingRank | null = null
  private tally: TallyLine[] = []
  private hookTicks = 0
  /** The HUD's name for the mission flying now. */
  private missionLabel = 'HILL 1'
  /** The bed the pilot has chosen. */
  private pilotPad = ''

  // The campaign: where it is, and what it has earned (saved through `save`).
  private island = 0
  private missionIndex = 0
  private nectar = 0
  private shed: Shed = emptyShed()
  private acorns = new Set<string>()
  private medals: Record<string, number> = {}
  private cleared = new Set<number>()
  private bestHill = 0
  /** Time Trial bests (ticks) by mission id, the best Daily Hill, and the trial being picked. */
  private trials: Record<string, number> = {}
  private daily: DailyBest | undefined
  private trialPick = 0
  private today = dateKey(new Date())
  private resumeScore = 0
  private resumeLives = START_PODS
  private campaignTier: TierId = 'standard'
  private campaignStarted = false
  private saveData: LanderSave | null = null
  /** Gale Season rounds begun: 0 on the first run through the campaign. */
  private gale = 0
  private offer: LanderSave | null = null
  private shedPick = 0
  private shedNote = ''

  private camera = new Camera()
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null
  // Cosmetic only: sparkles, puffs and bloom colours roll their own dice; the game's rng is untouched.
  private fx = new Sparkles()
  private fxRng = backdropRng(61)
  private bonkAt = { x: 0, y: 0 }
  private terrainArt: HTMLCanvasElement | null = null
  private terrainArtFor: { terrain: Terrain; version: number } | null = null

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    const stored = this.demo
      ? null
      : readLanderSave(options.resume, VAULT_INDEX + 1, MISSIONS_PER_ISLAND)
    if (stored) {
      this.saveData = stored
      this.adoptProgress(stored)
      if (stored.campaignStarted) this.offer = stored
    }
    if (!this.demo) this.menu = { pick: 0 }
    this.startHill(1)
  }

  get save(): LanderSave | null | undefined {
    return this.demo ? undefined : this.saveData
  }

  /** Player 1's pod. */
  private get pod(): Pod {
    return this.pods[0]!
  }

  private get flightTier() {
    return TIERS[this.tier]
  }

  /** The Pod Shed's upgrades apply in the campaign only (Free Flight is a level field). */
  private get upgrades(): Shed {
    return this.mode === 'campaign' ? this.shed : emptyShed()
  }

  private get podMods(): PodMods {
    const gyros = this.upgrades.gyros
    return { turn: 1 + UPGRADE_EFFECT.gyros * gyros, settle: 0.006 * gyros }
  }

  private get winchLine(): number {
    return WINCH.line + UPGRADE_EFFECT.winch * this.upgrades.winch
  }

  private get legs(): number {
    return BUMPY + UPGRADE_EFFECT.legs * this.upgrades.legs
  }

  private gravityFor(pod: Pod): number {
    return (
      this.gravity * (1 + FLUFF.weight * pod.fluff + STORM.weight * this.wet)
    )
  }

  private get gravity() {
    return this.flightTier.gravity * (this.mission.gravity ?? 1)
  }

  // --- saved progress --------------------------------------------------------------------

  private adoptProgress(s: LanderSave) {
    this.nectar = s.nectar
    this.shed = { ...s.shed }
    this.acorns = new Set(s.acorns)
    this.medals = { ...s.medals }
    this.cleared = new Set(s.cleared)
    this.bestHill = s.bestHill
    this.trials = { ...(s.trials ?? {}) }
    this.daily = s.daily
    this.island = s.island
    this.missionIndex = s.mission
    this.resumeScore = s.score
    this.resumeLives = s.lives
    this.campaignTier = s.tier
    this.campaignStarted = s.campaignStarted === true
    this.gale = s.gale ?? 0
  }

  /** Write the save: the campaign's resume point and everything earned so far. */
  private keep() {
    if (this.demo) return
    this.saveData = {
      v: 1,
      campaignStarted: this.campaignStarted,
      tier: this.campaignTier,
      island: this.island,
      mission: this.missionIndex,
      score: this.resumeScore,
      lives: Math.max(1, Math.min(9, this.resumeLives)),
      nectar: this.nectar,
      shed: { ...this.shed },
      acorns: [...this.acorns],
      medals: { ...this.medals },
      cleared: [...this.cleared],
      bestHill: this.bestHill,
      gale: this.gale,
      trials: { ...this.trials },
      daily: this.daily,
    }
  }

  // --- the mode card --------------------------------------------------------------------

  private menuRows(): Array<MenuRow & { id: MenuId }> {
    const t = this.flightTier
    const rows: Array<MenuRow & { id: MenuId }> = []
    if (this.offer) {
      const isle = islandAt(this.offer.island, new Set(this.offer.acorns))
      rows.push({
        id: 'continue',
        name: 'CONTINUE',
        about: isle
          ? `${isle.name}, MISSION ${this.offer.mission + 1}`
          : 'PAST THE LAST ISLAND',
      })
    }
    rows.push({
      id: 'campaign',
      name: 'THE GREAT REPLANTING',
      about: this.offer ? 'START THE ISLANDS AGAIN' : 'REPLANT THE SKY ISLANDS',
    })
    rows.push({
      id: 'free',
      name: 'FREE FLIGHT',
      about: this.bestHill
        ? `ENDLESS HILLS  BEST: HILL ${this.bestHill}`
        : 'ENDLESS HILLS, NEW HAZARDS',
    })
    const dayBest = this.daily?.date === this.today ? this.daily.score : 0
    rows.push({
      id: 'daily',
      name: 'DAILY HILL',
      about: dayBest
        ? `TODAY'S ISLAND  BEST: ${dayBest}`
        : 'ONE ISLAND, THE SAME FOR ALL TODAY',
    })
    const races = trialMissions(this.medals)
    if (races.length) {
      const m = races[this.trialPick % races.length]!
      const best = this.trials[m.id]
      rows.push({
        id: 'trial',
        name: `TRIAL: ${m.name}`,
        about: best
          ? `BEST ${clock(best)}  ${trialMedal(best, m.par.ticks).toUpperCase()}  PAR ${clock(m.par.ticks)}`
          : `NO TIME YET  PAR ${clock(m.par.ticks)}`,
        picker: true,
      })
    }
    rows.push({
      id: 'tier',
      name: `FLIGHT: ${t.name}`,
      about: t.about,
      picker: true,
    })
    return rows
  }

  private updateMenu(input: InputFrame) {
    const m = this.menu!
    const rows = this.menuRows()
    const step = input.pressed.up ? -1 : input.pressed.down ? 1 : 0
    if (step) {
      m.pick = (m.pick + step + rows.length) % rows.length
      this.sound.play('blip')
    }
    const row = rows[m.pick]!
    const turn = input.pressed.left ? -1 : input.pressed.right ? 1 : 0
    if (row.id === 'trial' && turn) {
      const n = trialMissions(this.medals).length
      this.trialPick = (this.trialPick + turn + n) % n
      this.sound.play('blip')
      return
    }
    if (row.id === 'tier' && (turn || input.pressed.a)) {
      const i = TIER_ORDER.indexOf(this.tier)
      const n = TIER_ORDER.length
      this.tier = TIER_ORDER[(i + (turn || 1) + n) % n]!
      this.sound.play('blip')
      return
    }
    if (!(input.pressed.a || input.pressed.start)) return
    this.menu = null
    this.sound.play('start')
    if (row.id === 'continue') this.continueCampaign()
    else if (row.id === 'campaign') this.newCampaign()
    else if (row.id === 'daily') this.startDaily()
    else if (row.id === 'trial') this.startTrial()
    else {
      this.mode = 'free'
      this.startHill(1)
    }
  }

  // --- the side modes ----------------------------------------------------------------------

  /** The Daily Hill: today's island, one set of pods, one clear. */
  private startDaily() {
    this.mode = 'daily'
    this.today = dateKey(new Date())
    this.score = 0
    this.lives = START_PODS
    this.hillsCleared = 0
    this.streak = 0
    const spec = dailyHill(this.today)
    this.level = dailyHillNumber(this.today)
    this.missionLabel = spec.name.toUpperCase()
    this.startMission(spec)
  }

  /** A Time Trial: a cleared mission again against the clock, with every retry free. */
  private startTrial() {
    const races = trialMissions(this.medals)
    const spec = races[this.trialPick % races.length]!
    this.mode = 'trial'
    this.score = 0
    this.lives = START_PODS
    this.streak = 0
    this.missionLabel = 'TRIAL'
    this.startMission(spec)
  }

  /** A Time Trial clear: the time against the best, then back to the mode card. */
  private finishTrial() {
    const id = this.mission.id
    const ticks = this.missionTicks
    const best = this.trials[id]
    const fresh = !best || ticks < best
    if (fresh && !this.demo) {
      this.trials[id] = Math.min(ticks, TRIAL_MAX_TICKS)
      this.keep()
    }
    this.tally.push({ label: 'TIME', value: clock(ticks) })
    this.tally.push({
      label: trialMedal(ticks, this.mission.par.ticks).toUpperCase(),
      value: fresh ? 'NEW BEST' : `BEST ${clock(best!)}`,
    })
  }

  /** Back from a side mode to the mode card, on a quiet Free Flight hill behind it. */
  private toMenu(pick: number) {
    this.mode = 'free'
    this.menu = { pick }
    this.score = 0
    this.lives = START_PODS
    this.startHill(1)
  }

  /** Today's mastery points and rank. */
  private mastery() {
    return masteryRank(
      masteryPoints({
        medals: this.medals,
        acorns: this.acorns.size,
        cleared: this.cleared.size,
        bestHill: this.bestHill,
        trials: this.trials,
      }),
    )
  }

  // --- the campaign ------------------------------------------------------------------------

  private newCampaign() {
    // A fresh replanting: the acorns, medals and Free Flight best are kept for good.
    this.mode = 'campaign'
    this.campaignStarted = true
    this.campaignTier = this.tier
    this.gale = 0
    this.island = 0
    this.missionIndex = 0
    this.nectar = 0
    this.shed = emptyShed()
    this.cleared = new Set()
    this.score = 0
    this.lives = START_PODS
    this.resumeScore = 0
    this.resumeLives = START_PODS
    this.offer = null
    this.keep()
    this.toMap()
  }

  private continueCampaign() {
    const s = this.offer!
    this.offer = null
    this.adoptProgress(s)
    this.mode = 'campaign'
    this.tier = s.tier
    this.score = s.score
    this.lives = s.lives
    this.toMap()
  }

  /** Gale Season: the islands again with the shed, acorns and medals kept and the wind turned up. */
  private beginGale() {
    this.gale += 1
    this.island = 0
    this.missionIndex = 0
    this.cleared = new Set()
    this.resumeScore = this.score
    this.resumeLives = Math.max(this.lives, START_PODS)
    this.lives = this.resumeLives
    this.sound.play('start')
    this.keep()
    this.toMap()
  }

  private toMap() {
    this.screen = islandAt(this.island, this.acorns) ? 'map' : 'soon'
    this.level = this.island * MISSIONS_PER_ISLAND + this.missionIndex + 1
  }

  private updateScreen(input: InputFrame) {
    const go = input.pressed.a || input.pressed.start
    if (this.screen === 'soon') {
      if (this.cleared.has(VAULT_INDEX) && this.gale < GALE_MAX) {
        // The true ending: A begins the next Gale Season, B finishes the run.
        if (go) this.beginGale()
        else if (input.pressed.b) this.endRun()
      } else if (go) this.endRun()
      return
    }
    if (this.screen === 'map') {
      if (go) {
        this.screen = null
        this.sound.play('start')
        this.startCampaignMission()
      }
      return
    }
    // The Pod Shed.
    const rows = UPGRADES.length + 1
    const step = input.pressed.up ? -1 : input.pressed.down ? 1 : 0
    if (step) {
      this.shedPick = (this.shedPick + step + rows) % rows
      this.shedNote = ''
      this.sound.play('blip')
    }
    if (input.pressed.b || (go && this.shedPick === UPGRADES.length)) {
      // The island was won (and saved) when its boss fell: on to the next one's map.
      this.toMap()
      return
    }
    if (!go) return
    const u = UPGRADES[this.shedPick]!
    const level = this.shed[u.id]
    const cost = upgradeCost(level)
    if (level >= UPGRADE_MAX) this.shedNote = 'ALREADY THE BEST THERE IS'
    else if (this.nectar < cost) this.shedNote = 'NOT ENOUGH NECTAR YET'
    else {
      this.nectar -= cost
      this.shed[u.id] = level + 1
      this.shedNote = `${u.name} UPGRADED`
      this.sound.play('extra')
      this.keep()
    }
  }

  private startCampaignMission() {
    const isle = islandAt(this.island, this.acorns)!
    const spec = isle.missions[this.missionIndex]!
    this.missionLabel = `${isle.id.toUpperCase()} ${spec.kind === 'boss' ? 'BOSS' : this.missionIndex + 1}${this.gale ? ` G${this.gale}` : ''}`
    this.level = this.island * MISSIONS_PER_ISLAND + this.missionIndex + 1
    // The resume point: this mission, with the score and pods it began with.
    this.resumeScore = this.score
    this.resumeLives = this.lives
    this.keep()
    this.startMission(galeMission(spec, this.gale))
  }

  // --- missions ---------------------------------------------------------------------------

  /** Free Flight hill `hill`: a fresh island from the seeded rng. */
  private startHill(hill: number) {
    this.level = hill
    this.missionLabel = `HILL ${hill}`
    if (
      !this.demo &&
      this.mode === 'free' &&
      !this.menu &&
      hill > this.bestHill
    ) {
      this.bestHill = hill
      this.keep()
    }
    this.startMission(freeHill(hill, this.rng))
  }

  /** Lay out a mission: its terrain, cargo, hazards and boss, a full tank and the pod at the start. */
  private startMission(spec: MissionSpec) {
    this.mission = spec
    this.terrain = new Terrain(spec.map)
    this.cargo = []
    this.cargoTo.clear()
    this.cargoHome.clear()
    this.lit.clear()
    this.sporeWait = (spec.spores ?? []).map(() => 0)
    this.blur = 0
    this.wet = 0
    ;(spec.cargo ?? []).forEach((c, i) => {
      const id = c.id ?? `cargo${i}`
      const crate = newCargo(id, c.kind, c.x, 0, c.seedlings ?? 3)
      crate.y = this.terrain.groundAt(c.x) - crate.r
      this.cargo.push(crate)
      this.cargoTo.set(id, c.to)
      this.cargoHome.set(id, c.x)
    })
    this.vents = (spec.vents ?? []).map((v) => ({ ...v }))
    this.windmills = (spec.windmills ?? []).map(newWindmill)
    this.crows = (spec.crows ?? []).map(newCrow)
    this.fluffs = []
    this.boss = spec.boss
      ? makeBoss(spec.boss.id, this.terrain, spec.boss.x)
      : null
    this.sunMax = Math.round(
      spec.sun *
        this.flightTier.sun *
        (1 + UPGRADE_EFFECT.tank * this.upgrades.tank),
    )
    this.pods = [newPod(0, spec.start.x, spec.start.y, this.sunMax)]
    this.growths = []
    this.blooms = []
    this.planted = 0
    this.delivered = 0
    this.ring = 0
    this.ringTicks = spec.time ?? 0
    this.missionTicks = 0
    this.allFeather = true
    this.landings = 0
    this.wind = 0
    this.windTarget = 0
    this.phase = 'fly'
    this.phaseTicks = 0
    this.card = CARD_TICKS
    this.camera.snap(
      spec.start.x,
      spec.start.y + 60,
      this.terrain.w,
      this.terrain.h,
    )
  }

  /** Try the same mission again: the same island, a full tank, beds unplanted. */
  private retryMission(why = 'A FULL TANK OF SUN') {
    this.startMission(this.mission)
    this.card = 0
    this.banner = { text: 'TRY AGAIN', sub: why, ticks: 100 }
  }

  /** Is the mission's goal met? */
  private goalMet(): boolean {
    const m = this.mission
    switch (m.kind) {
      case 'deliver':
      case 'water':
      case 'rescue':
        return this.delivered >= (m.deliveries ?? this.cargo.length)
      case 'lantern':
        return this.lit.size >= (m.lanterns?.length ?? 0)
      case 'rings':
        return this.ring >= (m.rings?.length ?? 0)
      case 'boss':
        return !!this.boss?.done
      default:
        return this.planted >= m.seeds
    }
  }

  /** The goal so far, for the HUD. */
  private goalText(): string {
    const m = this.mission
    switch (m.kind) {
      case 'deliver':
        return `CRATES ${this.delivered}/${m.deliveries ?? this.cargo.length}`
      case 'rescue':
        return `RESCUED ${this.delivered}/${m.deliveries ?? this.cargo.length}`
      case 'lantern':
        return `LANTERNS ${this.lit.size}/${m.lanterns?.length ?? 0}`
      case 'water':
        return `BEDS WATERED ${this.delivered}/${m.deliveries ?? this.cargo.length}`
      case 'rings':
        return `RINGS ${this.ring}/${m.rings?.length ?? 0} ${Math.ceil(this.ringTicks / 60)}S`
      case 'boss': {
        const v = this.boss?.view()
        return v ? `PHASE ${Math.min(v.phase + 1, v.phases)}/${v.phases}` : ''
      }
      default:
        return `BEDS ${this.planted}/${m.seeds}`
    }
  }

  // --- update ----------------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    if (this.menu) {
      this.updateMenu(input)
      return
    }
    if (this.screen) {
      this.updateScreen(this.demo ? this.demoInput() : input)
      return
    }
    const controls = this.demo ? this.demoInput() : input
    if (this.card > 0) {
      this.card--
      if (
        this.card < CARD_TICKS - 30 &&
        (controls.pressed.a || controls.pressed.start)
      )
        this.card = 0
    }
    this.missionTicks++
    this.updateWind()
    this.boss?.update(this.tick)
    for (const m of this.windmills) m.angle += m.speed
    switch (this.phase) {
      case 'fly':
        for (const pod of this.pods) this.flyPod(pod, controls)
        this.updateCargo()
        this.updateHazards()
        this.updateRace()
        break
      case 'bonk':
        this.updateCargo()
        this.updateHazards()
        if (++this.phaseTicks >= BONK_TICKS) this.afterBonk()
        break
      case 'dry':
        this.updateDry()
        break
      case 'clear':
        if (++this.phaseTicks >= CLEAR_TICKS) this.afterClear()
        break
    }
    for (const g of this.growths) g.age++
    this.followCamera()
  }

  private updateWind() {
    if (this.boss && this.boss.wind !== null) {
      this.wind += (this.boss.wind * this.flightTier.wind - this.wind) * 0.02
      return
    }
    const max = this.mission.wind * this.flightTier.wind
    if (this.tick % 180 === 0) this.windTarget = (this.rng() * 2 - 1) * max
    this.wind += (this.windTarget - this.wind) * 0.02
  }

  /** Outside pushes at a point: the wind and gust lanes, and lift in an updraft column. */
  private pushAt(x: number, y: number): { x: number; y: number } {
    let lift = 0
    for (const v of this.vents) {
      if (Math.abs(x - v.x) > v.w / 2) continue
      const ground = this.terrain.groundAt(v.x)
      if (y > ground - v.h && y < ground) lift += v.lift
    }
    return {
      x: this.wind + lanePush(this.mission.lanes ?? [], x, y),
      y: fallPush(this.mission.falls ?? [], x, y) - lift,
    }
  }

  private flyPod(pod: Pod, input: InputFrame) {
    const controls = {
      left: input.held.left,
      right: input.held.right,
      puff: input.held.up || input.held.a,
      hop: input.pressed.b,
    }
    this.workWinch(pod, input)
    if (pod.restOn) {
      this.rest(pod, controls.puff || controls.hop)
      return
    }
    const sunBefore = pod.sun
    const push = this.pushAt(pod.x, pod.y)
    if (pod.fluff) pod.vx *= 1 - FLUFF.drag * pod.fluff
    if (inFall(this.mission.falls ?? [], pod.x, pod.y)) pod.vx *= FALL.spray
    if (
      steerPod(
        pod,
        controls,
        this.flightTier,
        this.gravityFor(pod),
        push,
        this.podMods,
      )
    ) {
      this.sound.play('pickup')
      this.puffBurst(pod, 10, 1.4)
      if (pod.fluff) this.shakeFluff(pod, pod.fluff)
    }
    if (pod.puffing) {
      pod.puffRun++
      if (pod.fluff && pod.puffRun % FLUFF.shake === 0) this.shakeFluff(pod, 1)
      if (this.tick % 3 === 0) this.puffBurst(pod, 1, 0.8)
    } else pod.puffRun = 0
    // The island's edges are cliffs of air: the pod bumps gently back.
    if (pod.x < POD_HALF + 2) {
      pod.x = POD_HALF + 2
      pod.vx = Math.abs(pod.vx) * 0.3
    }
    if (pod.x > this.terrain.w - POD_HALF - 2) {
      pod.x = this.terrain.w - POD_HALF - 2
      pod.vx = -Math.abs(pod.vx) * 0.3
    }
    if (pod.y < POD_TOP + 2) {
      pod.y = POD_TOP + 2
      pod.vy = Math.max(0, pod.vy)
    }
    if (sunBefore > 0 && pod.sun <= 0 && !pod.chute) {
      pod.chute = true
      pod.puffing = false
      this.dropHooked(pod)
      this.sound.play('warn')
      this.banner = {
        text: 'OUT OF SUN',
        sub: 'STEER ONTO A SUNFLOWER',
        ticks: 120,
      }
    }
    this.collectAcorns(pod)
    if (!pod.chute) {
      if (this.windmills.some((m) => hitsWindmill(m, pod.x, pod.y)))
        return this.crash(pod, 'CLIPPED A SAIL')
      const hit = this.boss?.hits(pod.x, pod.y)
      if (hit) return this.crash(pod, hit)
    }
    this.touchDown(pod)
  }

  private shakeFluff(pod: Pod, count: number) {
    const n = Math.min(count, pod.fluff)
    pod.fluff -= n
    for (let i = 0; i < n * 3; i++)
      this.particles.push({
        x: pod.x,
        y: pod.y,
        vx: (this.fxRng() - 0.5) * 2,
        vy: -this.fxRng() * 1.2,
        life: 30,
        color: '#ffffff',
        kind: 'chip',
      })
  }

  /** Resting on a pad: sunflowers refuel; puffing (after a moment to settle) lifts off. */
  private rest(pod: Pod, lift: boolean) {
    const pad = this.terrain.pad(pod.restOn!)
    pod.rest++
    pod.puffing = false
    if (pad) {
      if (pad.live) pod.x += pad.vx
      pod.y = pad.y - POD_FEET
      if (pad.kind === 'sun' && pod.sun < this.sunMax) {
        pod.sun = Math.min(this.sunMax, pod.sun + SUN_REFILL)
        if (this.tick % 6 === 0)
          this.fx.burst(pod.x, pod.y - 4, this.fxRng, {
            count: 1,
            speed: 0.6,
            colours: [RAMPS.gold[3], RAMPS.gold[4]],
          })
      }
      if (pad.live) {
        // Riding a boss's hand or a sail into its body still bonks.
        const hit = this.boss?.hits(pod.x, pod.y)
        if (hit) return this.crash(pod, hit)
      }
    }
    // Dry on a pad with no sunflower: nothing to lift off with, so the mission is tried again.
    if (pod.sun <= 0 && pad?.kind !== 'sun' && pod.rest >= SETTLE_TICKS) {
      this.phase = 'dry'
      this.phaseTicks = 0
      this.banner = { text: 'OUT OF SUN', sub: 'NO SUNFLOWER HERE', ticks: 100 }
      return
    }
    if (lift && pod.rest >= SETTLE_TICKS && pod.sun > 0) {
      pod.restOn = null
      pod.rest = 0
      pod.vy = -0.35 + (pad?.live ? pad.vy : 0)
      pod.vx += pad?.live ? pad.vx : 0
      pod.y -= 2
    }
  }

  private touchDown(pod: Pod) {
    const t = this.terrain
    const feet = pod.y + POD_FEET
    const floorL = t.floorAt(pod.x - POD_HALF, pod.y)
    const floorR = t.floorAt(pod.x + POD_HALF, pod.y)
    const roof = Math.max(
      t.ceilingAt(pod.x, pod.y),
      t.ceilingAt(pod.x - POD_HALF, pod.y),
      t.ceilingAt(pod.x + POD_HALF, pod.y),
    )
    if (pod.y - POD_TOP <= roof) {
      if (pod.chute) pod.vy = Math.max(0, pod.vy)
      else return this.crash(pod, 'BUMPED THE ROOF')
    }
    if (
      !pod.chute &&
      (t.insideLedge(pod.x - POD_HALF, pod.y) ||
        t.insideLedge(pod.x + POD_HALF, pod.y))
    )
      return this.crash(pod, 'CLIPPED A LEDGE')
    if (feet < Math.min(floorL, floorR)) return
    // Climbing away with a foot brushing a slope is a scrape, not a touchdown.
    if (pod.vy < 0 && feet < t.floorAt(pod.x, pod.y) - 1) return
    const floor = Math.min(floorL, floorR)
    const pad = t.padUnder(pod.x, POD_HALF, floor)
    if (pod.chute) {
      // Floated down onto a sunflower: saved, and refuelling.
      if (pad?.kind === 'sun') {
        pod.chute = false
        this.land(pod, pad, 'soft')
        this.banner = {
          text: 'SAVED!',
          sub: 'A SUNFLOWER CATCHES THE POD',
          ticks: 100,
        }
        return
      }
      pod.y = floor - POD_FEET
      pod.vx = 0
      pod.vy = 0
      this.phase = 'dry'
      this.phaseTicks = 0
      return
    }
    if (pad?.kind === 'bounce') {
      // A mushroom: boing, back up again.
      pod.y = pad.y - POD_FEET - 1
      pod.vy = bounceSpeed(pod.vy - pad.vy)
      this.sound.play('pop')
      this.floaters.push({
        x: pod.x,
        y: pad.y - 16,
        text: 'BOING!',
        life: 40,
        color: RAMPS.ember[3],
      })
      return
    }
    if (pad?.blocked)
      return this.crash(
        pod,
        this.boss?.id === 'tortoise'
          ? 'THE GEYSER WAS STILL SURGING'
          : this.boss?.id === 'queen'
            ? 'THAT SEGMENT WAS DARK'
            : this.boss?.id === 'thunderhead'
              ? 'LIGHTNING STRUCK THAT TOP'
              : this.boss?.id === 'oldlander'
                ? 'A METEOR LANDED THERE'
                : 'A CROW WAS SITTING THERE',
      )
    const rank = pad
      ? rankLanding(pod.vx - pad.vx, pod.vy - pad.vy, pod.tilt, this.legs)
      : 'bonk'
    if (!pad || rank === 'bonk')
      return this.crash(
        pod,
        !pad
          ? 'MISSED THE PAD'
          : Math.abs(pod.tilt) > SAFE.tilt
            ? 'TOO TILTED'
            : 'TOO FAST',
      )
    this.land(pod, pad, rank)
  }

  private land(pod: Pod, pad: Pad, rank: LandingRank) {
    // Settle both feet onto the bed.
    if (pad.x1 - pad.x0 >= POD_HALF * 2)
      pod.x = Math.max(pad.x0 + POD_HALF, Math.min(pad.x1 - POD_HALF, pod.x))
    pod.y = pad.y - POD_FEET
    pod.vx = 0
    pod.vy = 0
    pod.tilt = 0
    pod.puffing = false
    pod.restOn = pad.id
    pod.rest = 0
    this.lastRank = rank
    this.landings++
    if (rank !== 'feather') this.allFeather = false
    const cx = Math.max(pad.x0 + 3, Math.min(pad.x1 - 3, pod.x))
    if (pad.kind === 'seed' && !pad.planted) {
      this.plant(pod, pad, rank, cx)
      return
    }
    this.relight(cx)
    // Any other pad: a rest stop. Sunflowers refuel; the shed and planted beds just hold the pod.
    this.floaters.push({
      x: cx,
      y: pad.y - 18,
      text: RANK_NAMES[rank],
      life: 50,
      color: rank === 'feather' ? RAMPS.teal[3] : RAMPS.cream[3],
    })
    if (pad.kind === 'sun') {
      this.banner = {
        text: 'SUNFLOWER',
        sub: 'REFUELLING: PUFF TO LIFT OFF',
        ticks: 90,
      }
      this.sound.play('pickup')
    } else this.sound.play('blip')
  }

  /** Landing beside an unlit cave lantern relights it. */
  private relight(cx: number) {
    for (const l of this.mission.lanterns ?? []) {
      if (this.lit.has(l.id) || !lanternReached(l, cx)) continue
      this.lit.add(l.id)
      this.earnNectar(1)
      this.addScore(300, l.x, this.terrain.groundAt(l.x) - 30, RAMPS.gold[3])
      this.fx.burst(l.x, this.terrain.groundAt(l.x) - 20, this.fxRng, {
        count: 14,
        colours: [RAMPS.gold[3], RAMPS.gold[4], '#ffffff'],
      })
      this.banner = {
        text: 'LANTERN LIT!',
        sub: `${this.lit.size}/${this.mission.lanterns?.length ?? 0}`,
        ticks: 90,
      }
      this.sound.play('extra')
    }
    if (this.mission.kind === 'lantern' && this.goalMet()) this.clearMission()
  }

  private plant(pod: Pod, pad: Pad, rank: LandingRank, cx: number) {
    this.streak = nextStreak(this.streak, rank)
    this.bestStreak = Math.max(this.bestStreak, this.streak)
    const mult = streakMultiplier(this.streak)
    const points = Math.round(50 * pad.mult * RANK_PAY[rank] * mult) * 10
    pad.planted = true
    this.planted++
    this.earnNectar(pad.mult)
    // A planting breathes a little sunlight back into the tank.
    pod.sun = Math.min(
      this.sunMax,
      pod.sun + Math.round(this.sunMax * PLANT_SUN),
    )
    pod.rest = SETTLE_TICKS - PLANT_SETTLE
    this.addScore(points, cx, pad.y - 22, RAMPS.gold[3])
    const colour =
      BLOOM_COLOURS[Math.floor(this.fxRng() * BLOOM_COLOURS.length)]!
    if (pad.grows === 'flower')
      this.blooms.push({
        x: cx,
        y: pad.y,
        colour,
        age: 0,
        pad: pad.live ? pad.id : undefined,
        dx: cx - (pad.x0 + pad.x1) / 2,
      })
    else this.growths.push(grow(this.terrain, pad))
    this.fx.burst(cx, pad.y - 8, this.fxRng, {
      count: 14,
      colours: FLOWER_SPARKS[colour],
      speed: 1.8,
    })
    this.banner = {
      text: `${RANK_NAMES[rank]} LANDING`,
      sub:
        pad.grows !== 'flower'
          ? `A ${PLANT_NAMES[pad.grows]} GROWS!  ${points}`
          : `${pad.mult > 1 ? `X${pad.mult} BED  ` : ''}${points}` +
            (this.streak > 1 ? `  STREAK X${mult.toFixed(1)}` : ''),
      ticks: 110,
    }
    this.sound.play('level')
    if (this.boss && this.boss.pads.includes(pad)) this.bossPlanted(pad)
    if (this.goalMet()) this.clearMission()
  }

  private bossPlanted(pad: Pad) {
    const boss = this.boss!
    if (!boss.planted(pad)) return
    this.addScore(BOSS_PHASE_POINTS, pad.x0, pad.y - 34, RAMPS.gold[4])
    this.sound.play('extra')
    if (boss.done) return
    // A new phase: the boss tosses off any pod riding it, and its blooms wilt back to beds.
    for (const pod of this.pods) {
      const on = pod.restOn ? this.terrain.pad(pod.restOn) : undefined
      if (!on || !boss.pads.includes(on)) continue
      pod.restOn = null
      pod.rest = 0
      pod.vy = -1.2
      pod.vx = on.vx * 2
      pod.y -= 3
    }
    this.blooms = this.blooms.filter(
      (b) => !b.pad || !!this.terrain.pad(b.pad)?.planted,
    )
    this.banner = {
      text: `PHASE ${boss.phase + 1}`,
      sub:
        boss.id === 'scarecrow'
          ? boss.phase === 2
            ? 'CROWS PERCH ON HIS HANDS'
            : 'HE WAVES FASTER'
          : boss.id === 'tortoise'
            ? boss.phase === 2
              ? 'HE SURFACES IN THREE PLACES'
              : 'HE SWIMS ACROSS THE POOL'
            : boss.id === 'queen'
              ? boss.phase === 2
                ? 'THE LIGHT RACES BACK AND FORTH'
                : 'THE LIGHT SKIPS ALONG'
              : boss.id === 'thunderhead'
                ? boss.phase === 2
                  ? 'HAIL! THE TOPS BOUNCE'
                  : 'THE TOPS CRACKLE BEFORE A STRIKE'
                : boss.id === 'oldlander'
                  ? boss.phase === 2
                    ? 'METEORS FALL FASTER'
                    : 'STREAKS MARK THE NEXT METEOR'
                  : 'THE WIND TURNS',
      ticks: 140,
    }
  }

  private earnNectar(n: number) {
    if (this.demo || this.mode !== 'campaign') return
    this.nectar += n
    this.keep()
  }

  private collectAcorns(pod: Pod) {
    if (this.mode !== 'campaign') return
    for (const a of this.mission.acorns ?? []) {
      if (this.acorns.has(a.id)) continue
      if (Math.hypot(pod.x - a.x, pod.y - a.y) > 11) continue
      this.acorns.add(a.id)
      if (!this.demo) this.nectar += ACORN_NECTAR
      this.addScore(ACORN_POINTS, a.x, a.y - 12, RAMPS.gold[4])
      this.fx.burst(a.x, a.y, this.fxRng, {
        count: 16,
        colours: [RAMPS.gold[3], RAMPS.gold[4], '#ffffff'],
      })
      const found = ALL_ACORNS.filter((id) => this.acorns.has(id)).length
      this.banner = {
        text: 'GOLDEN ACORN!',
        sub: `${found} OF 18 FOUND`,
        ticks: 110,
      }
      this.sound.play('extra')
      this.keep()
    }
  }

  private crash(pod: Pod, why: string) {
    if (this.mode !== 'trial') this.lives--
    this.streak = 0
    this.lastRank = 'bonk'
    this.allFeather = false
    this.dropHooked(pod)
    pod.restOn = null
    this.addScore(
      BONK_POINTS * Math.min(this.level, 40),
      pod.x,
      pod.y - 12,
      RAMPS.leaf[3],
    )
    this.phase = 'bonk'
    this.phaseTicks = 0
    this.bonkAt = { x: pod.x, y: pod.y }
    this.chips(pod.x, pod.y, 22, '#a3e635')
    this.chips(pod.x, pod.y, 10, '#fde047')
    pod.puffing = false
    this.sound.play('die')
    this.banner = {
      text: 'BONK!',
      sub:
        this.lives > 0
          ? `${why}  ${this.lives} POD${this.lives > 1 ? 'S' : ''} LEFT`
          : why,
      ticks: BONK_TICKS,
    }
  }

  /** After a bonk: a spare pod drops in at the start (or the run ends). */
  private afterBonk() {
    if (this.lives <= 0) {
      this.endRun()
      return
    }
    const old = this.pod
    const pod = newPod(
      0,
      this.mission.start.x,
      this.mission.start.y,
      Math.max(old.sun, Math.round(this.sunMax * SPARE_SUN)),
    )
    pod.hops = old.hops
    this.pods[0] = pod
    this.phase = 'fly'
    this.phaseTicks = 0
  }

  /** The leaf-cap parachute has set down (or time ran out): try again with a spare pod. */
  private updateDry() {
    if (++this.phaseTicks < DRY_TICKS) return
    if (this.mode !== 'trial') this.lives--
    if (this.lives <= 0) {
      this.endRun()
      return
    }
    this.retryMission(
      this.mission.kind === 'rings' && this.ringTicks <= 0
        ? 'THE RINGS ARE BACK'
        : 'A FULL TANK OF SUN',
    )
  }

  /** The day's best Daily Hill score, kept when this run beats it. */
  private keepDaily() {
    if (this.demo) return
    if (this.daily?.date === this.today && this.daily.score >= this.score)
      return
    this.daily = { date: this.today, score: this.score }
    this.keep()
  }

  private endRun() {
    this.over = true
    this.banner = { text: 'OUT OF PODS', sub: 'GAME OVER', ticks: 9999 }
    if (this.mode === 'daily') this.keepDaily()
    if (this.mode === 'campaign' && !this.demo) {
      // The campaign's place is kept; a new run from it starts its score afresh.
      this.resumeScore = 0
      this.resumeLives = START_PODS
      this.keep()
    }
  }

  private clearMission() {
    this.phase = 'clear'
    this.phaseTicks = 0
    this.hillsCleared++
    const pod = this.pod
    const sunUsed = this.sunMax - pod.sun
    const bonus = Math.round((pod.sun / this.sunMax) * 100) * 10
    const thrifty = sunUsed <= this.mission.par.sun * this.flightTier.sun
    const swift = this.missionTicks <= this.mission.par.ticks
    const feather = this.allFeather && this.landings > 0
    const each = 250 * Math.min(10, this.level)
    const medals = (thrifty ? 1 : 0) + (swift ? 1 : 0) + (feather ? 1 : 0)
    this.tally = [
      { label: 'SUN LEFT', value: `${bonus}` },
      {
        label: feather ? 'FEATHER' : 'NOT ALL FEATHERS',
        value: feather ? `${each}` : '-',
      },
      {
        label: thrifty ? 'THRIFTY' : 'SUN OVER PAR',
        value: thrifty ? `${each}` : '-',
      },
      {
        label: swift ? 'SWIFT' : 'TIME OVER PAR',
        value: swift ? `${each}` : '-',
      },
    ]
    this.addScore(bonus + medals * each, pod.x, pod.y - 34, RAMPS.gold[4])
    if (this.boss?.done) {
      this.addScore(BOSS_POINTS, pod.x, pod.y - 46, RAMPS.gold[4])
      this.tally.push({ label: this.boss.name, value: `${BOSS_POINTS}` })
    }
    if (this.mode === 'campaign' && !this.demo) {
      const bits =
        (feather ? MEDAL.feather : 0) |
        (thrifty ? MEDAL.thrifty : 0) |
        (swift ? MEDAL.swift : 0)
      const had = this.medals[this.mission.id] ?? 0
      const fresh = bits & ~had
      this.medals[this.mission.id] = had | bits
      let nectar = 0
      for (let b = fresh; b; b >>= 1) nectar += (b & 1) * MEDAL_NECTAR
      if (this.islandWon) {
        nectar += BOSS_NECTAR
        this.cleared.add(this.island)
        if (this.lives < MAX_PODS) {
          this.lives++
          this.tally.push({ label: 'SPARE POD', value: '+1' })
        }
      }
      this.nectar += nectar
      if (nectar) this.tally.push({ label: 'NECTAR', value: `+${nectar}` })
      // Earned now, kept now: the next mission (or the Pod Shed's island) is the resume point.
      if (this.islandWon) {
        this.island++
        this.missionIndex = 0
      } else this.missionIndex++
      this.resumeScore = this.score
      this.resumeLives = this.lives
      this.keep()
    } else if (
      this.mode === 'free' &&
      this.hillsCleared % EXTRA_POD_HILLS === 0 &&
      this.lives < MAX_PODS
    ) {
      this.lives++
      this.tally.push({ label: 'SPARE POD', value: '+1' })
    }
    if (this.mode === 'trial') this.finishTrial()
    this.sound.play(this.islandWon ? 'extra' : 'level')
    this.banner = null
  }

  /** The mission just cleared replants its island: a boss fell, or the Seed Vault's finale. */
  private get islandWon(): boolean {
    return !!this.boss?.done || !!this.mission.finale
  }

  private afterClear() {
    if (this.mode === 'trial') {
      this.toMenu(this.menuRows().findIndex((r) => r.id === 'trial'))
      return
    }
    if (this.mode === 'daily') {
      this.keepDaily()
      this.over = true
      this.banner = {
        text: 'DAILY HILL CLEARED',
        sub: `SCORE ${this.score}`,
        ticks: 9999,
      }
      return
    }
    if (this.mode === 'free') {
      this.startHill(this.level + 1)
      return
    }
    if (this.islandWon) {
      // The island is replanted: the Pod Shed, then on to the next island.
      this.screen = 'shed'
      this.shedPick = 0
      this.shedNote = ''
      return
    }
    this.toMap()
  }

  // --- the race ----------------------------------------------------------------------------

  private updateRace() {
    const rings = this.mission.rings
    if (!rings || this.phase !== 'fly') return
    const pod = this.pod
    const next = rings[this.ring]
    if (next && Math.hypot(pod.x - next.x, pod.y - next.y) < next.r) {
      this.ring++
      this.addScore(100 * this.ring, next.x, next.y - next.r - 6, RAMPS.pink[3])
      this.fx.burst(next.x, next.y, this.fxRng, {
        count: 10,
        colours: [RAMPS.pink[3], RAMPS.gold[4]],
      })
      this.sound.play('pickup')
      if (this.goalMet()) {
        this.clearMission()
        return
      }
    }
    if (--this.ringTicks <= 0) {
      this.ringTicks = 0
      this.phase = 'dry'
      this.phaseTicks = 0
      this.banner = { text: 'TIME UP', sub: 'THE PETALS FALL', ticks: 100 }
      this.sound.play('warn')
    }
  }

  // --- hazards -----------------------------------------------------------------------------

  private updateHazards() {
    const pod = this.pod
    // Dandelion fluff: blown across; it sticks to a flying pod.
    for (const field of this.mission.fluff ?? []) {
      const f = spawnFluff(field, this.tick, this.rng)
      if (f) this.fluffs.push(f)
    }
    for (const f of this.fluffs) driftFluff(f, this.tick)
    if (this.phase === 'fly' && !pod.restOn && !pod.chute)
      for (const f of this.fluffs) {
        if (f.life <= 0 || pod.fluff >= FLUFF.max) continue
        if (Math.hypot(f.x - pod.x, f.y - pod.y) >= FLUFF.reach) continue
        f.life = 0
        pod.fluff++
        if (pod.fluff === 1)
          this.floaters.push({
            x: pod.x,
            y: pod.y - 18,
            text: 'FLUFF! PUFF TO SHAKE',
            life: 60,
            color: '#ffffff',
          })
      }
    this.fluffs = this.fluffs.filter((f) => f.life > 0)
    // Crow-bots: towed cargo first, else a pod in the air.
    const towed = this.cargo.find((c) => c.hookedBy >= 0)
    const flying = this.phase === 'fly' && !pod.restOn && !pod.chute
    const quarry = towed ?? (flying ? pod : null)
    for (const c of this.crows) {
      if (flyCrow(c, quarry) === 'caw') this.sound.play('warn')
      if (c.state !== 'dive') continue
      if (c.y > this.terrain.floorAt(c.x, c.y - 4) - 4) {
        rise(c)
        continue
      }
      if (towed && crowHits(c, towed.x, towed.y)) {
        rise(c)
        if (towed.seedlings > 0) {
          towed.seedlings--
          this.floaters.push({
            x: towed.x,
            y: towed.y - 14,
            text: 'A CROW TOOK A SEEDLING',
            life: 60,
            color: RAMPS.rust[3],
          })
          this.sound.play('pop')
        }
      } else if (flying && crowHits(c, pod.x, pod.y)) {
        rise(c)
        const dir = c.vx >= 0 ? 1 : -1
        pod.tilt += CROW.knock * dir
        pod.vx += 0.8 * dir
        this.floaters.push({
          x: pod.x,
          y: pod.y - 16,
          text: 'BUMP!',
          life: 40,
          color: RAMPS.rust[3],
        })
        this.sound.play('pop')
      }
    }
    // Crystal bumpers bounce a flying pod gently; a puffball it brushes blurs the gauges.
    if (this.blur > 0) this.blur--
    this.sporeWait = this.sporeWait.map((w) => Math.max(0, w - 1))
    if (this.phase === 'fly' && !pod.chute && !pod.restOn) {
      for (const c of this.mission.crystals ?? []) {
        const v = crystalBump(c, pod.x, pod.y, pod.vx, pod.vy)
        if (!v) continue
        pod.vx = v.vx
        pod.vy = v.vy
        this.sound.play('blip')
        this.fx.burst(c.x, c.y, this.fxRng, {
          count: 4,
          colours: [RAMPS.teal[3], RAMPS.teal[4]],
        })
      }
      ;(this.mission.spores ?? []).forEach((sp, i) => {
        if ((this.sporeWait[i] ?? 0) > 0 || !sporeTriggered(sp, pod.x, pod.y))
          return
        this.sporeWait[i] = SPORE.cool
        this.blur = SPORE.blur
        this.floaters.push({
          x: sp.x,
          y: sp.y - 16,
          text: 'SPORES! GAUGES BLURRED',
          life: 60,
          color: RAMPS.pink[3],
        })
        this.fx.burst(sp.x, sp.y, this.fxRng, {
          count: 10,
          colours: [RAMPS.pink[3], RAMPS.pink[4]],
        })
        this.sound.play('pop')
      })
    }
    if (this.mission.rain && this.phase === 'fly')
      this.wet = soakStep(this.wet, !pod.restOn)
    // Stalactite drips and pebble rollers knock a flying pod about, and bonk a resting one.
    if (this.phase === 'fly' && !pod.chute) {
      for (const d of this.mission.drips ?? []) {
        const v = dripAt(d, this.tick, this.terrain.groundAt(d.x))
        if (
          v.state === 'swell' &&
          this.tick % 30 === 0 &&
          d.x > this.camera.x - 20
        )
          this.sound.play('blip')
        if (
          v.state !== 'fall' ||
          Math.hypot(v.x - pod.x, v.y - pod.y) > DRIP.hit
        )
          continue
        if (pod.restOn) continue
        this.knockPod(pod, v.x < pod.x ? 1 : -1, DRIP.knock, 'DRIP!')
      }
      for (const c of this.mission.clouds ?? []) {
        const v = stormCloudAt(c, this.tick)
        if (
          v.state === 'charge' &&
          this.tick % 12 === 0 &&
          c.x > this.camera.x - 20
        )
          this.sound.play('blip')
        if (!pod.restOn && boltHits(c, this.tick, pod.x, pod.y))
          this.knockPod(pod, c.x < pod.x ? 1 : -1, STORM.knock, 'ZAP!')
      }
      for (const p of this.mission.pebbles ?? []) {
        const v = pebbleAt(p, this.tick, (x) => this.terrain.groundAt(x))
        if (!v?.rolling) continue
        const near = Math.hypot(v.x - pod.x, v.y - pod.y) < PEBBLE.hit + 4
        if (!near) continue
        if (pod.restOn) return this.crash(pod, 'ROLLED OVER BY A PEBBLE')
        this.knockPod(pod, p.x1 > p.x0 ? 1 : -1, PEBBLE.knock, 'BUMP!')
      }
    }
    // Sails knock crates about too.
    for (const c of this.cargo) {
      if (c.delivered || c.bumpCool > 0) continue
      if (!this.windmills.some((m) => hitsWindmill(m, c.x, c.y))) continue
      c.bumpCool = 40
      c.vx = -c.vx - 0.6
      if (c.seedlings > 0) c.seedlings--
      this.sound.play('pop')
    }
  }

  private knockPod(pod: Pod, dir: number, knock: number, text: string) {
    pod.tilt += knock * dir
    pod.vx += 0.7 * dir
    this.floaters.push({
      x: pod.x,
      y: pod.y - 16,
      text,
      life: 40,
      color: RAMPS.rust[3],
    })
    this.sound.play('pop')
  }

  // --- the tether winch -------------------------------------------------------------------

  private workWinch(pod: Pod, input: InputFrame) {
    const hooked = this.cargo.find((c) => c.hookedBy === pod.seat)
    if (hooked) {
      this.hookTicks++
      if (input.pressed.down && this.hookTicks > 20) {
        hooked.hookedBy = -1
        this.sound.play('blip')
      }
      return
    }
    if (!input.held.down || pod.chute) return
    const crate = this.cargo.find((c) => canHook(pod, c, this.winchLine))
    if (!crate) return
    crate.hookedBy = pod.seat
    crate.resting = false
    this.hookTicks = 0
    this.sound.play('pickup')
    this.floaters.push({
      x: crate.x,
      y: crate.y - 14,
      text: 'HOOKED',
      life: 40,
      color: RAMPS.cream[3],
    })
  }

  private dropHooked(pod: Pod) {
    for (const c of this.cargo) if (c.hookedBy === pod.seat) c.hookedBy = -1
  }

  private updateCargo() {
    for (const c of this.cargo) {
      if (c.delivered) continue
      const pod = this.pods.find((p) => p.seat === c.hookedBy)
      const wind = this.wind + lanePush(this.mission.lanes ?? [], c.x, c.y)
      if (pod && !pod.restOn)
        swingCargo(pod, c, this.winchLine, this.gravity, wind)
      else if (pod) {
        c.resting = false
        dropCargo(c, this.gravity)
      } else dropCargo(c, this.gravity)
      c.x = Math.max(c.r, Math.min(this.terrain.w - c.r, c.x))
      const result = groundCargo(c, this.terrain.floorAt(c.x, c.y))
      if (result === 'bump' && c.kind === 'water') {
        this.popBubble(c)
        continue
      }
      if (result === 'bump') {
        this.sound.play('pop')
        this.floaters.push({
          x: c.x,
          y: c.y - 14,
          text: c.seedlings > 0 ? 'BUMP! -1 SEEDLING' : 'BUMP!',
          life: 50,
          color: RAMPS.rust[3],
        })
      }
      if (result === 'land') this.checkDelivery(c)
    }
  }

  /** A water bubble that lands hard bursts, and a fresh one wells up at its spring. */
  private popBubble(c: Cargo) {
    this.fx.burst(c.x, c.y, this.fxRng, {
      count: 12,
      colours: [RAMPS.sky[3], RAMPS.sky[4], '#ffffff'],
    })
    this.floaters.push({
      x: c.x,
      y: c.y - 14,
      text: 'POP! A NEW BUBBLE WELLS UP',
      life: 60,
      color: RAMPS.sky[4],
    })
    this.sound.play('pop')
    c.hookedBy = -1
    c.vx = 0
    c.vy = 0
    c.x = this.cargoHome.get(c.id) ?? c.x
    c.y = this.terrain.groundAt(c.x) - c.r
    c.resting = true
  }

  private checkDelivery(c: Cargo) {
    const pad = this.terrain.pad(this.cargoTo.get(c.id) ?? '')
    if (!pad || c.x < pad.x0 || c.x > pad.x1 || Math.abs(c.y + c.r - pad.y) > 3)
      return
    c.delivered = true
    c.hookedBy = -1
    c.resting = true
    this.delivered++
    const points = DELIVERY_POINTS * c.seedlings + 100
    this.addScore(points, c.x, c.y - 18, RAMPS.gold[3])
    this.earnNectar(c.seedlings)
    this.fx.burst(c.x, c.y - 6, this.fxRng, { count: 12 })
    this.banner = {
      text:
        c.kind === 'water'
          ? 'WATERED!'
          : c.kind === 'sprout'
            ? 'RESCUED!'
            : 'DELIVERED!',
      sub:
        c.kind === 'water'
          ? `THE BED DRINKS  ${points}`
          : c.kind === 'sprout'
            ? `A SPROUT-BOT IS HOME  ${points}`
            : `${c.seedlings} SEEDLINGS  ${points}`,
      ticks: 100,
    }
    this.sound.play('extra')
    if (
      (this.mission.kind === 'deliver' ||
        this.mission.kind === 'water' ||
        this.mission.kind === 'rescue') &&
      this.goalMet()
    )
      this.clearMission()
  }

  // --- scoring and effects ---------------------------------------------------------------

  private addScore(points: number, x: number, y: number, color: string) {
    if (this.demo || points <= 0 || this.mode === 'trial') return
    this.score += points
    this.floaters.push({ x, y, text: String(points), life: 50, color })
  }

  private puffBurst(pod: Pod, count: number, speed: number) {
    for (let i = 0; i < count; i++) {
      const a = pod.tilt + Math.PI / 2 + (this.fxRng() - 0.5) * 0.9
      this.particles.push({
        x: pod.x - Math.sin(pod.tilt) * POD_FEET,
        y: pod.y + Math.cos(pod.tilt) * POD_FEET,
        vx: Math.cos(a) * 0.3 * speed - Math.sin(pod.tilt) * 0.8,
        vy: Math.sin(a) * 0.3 * speed + Math.cos(pod.tilt) * 0.8,
        life: 18,
        color: '#e0f2fe',
        kind: 'puff',
      })
    }
  }

  private chips(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const a = this.fxRng() * Math.PI * 2
      const s = 0.4 + this.fxRng() * 1.6
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 0.6,
        life: 24 + Math.floor(this.fxRng() * 18),
        color,
        kind: 'chip',
      })
    }
  }

  private updateEffects() {
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      if (p.kind === 'chip') p.vy += 0.03
      p.life--
    }
    this.particles = this.particles.filter((p) => p.life > 0)
    if (this.mission && !this.menu && !this.screen) {
      // Gust streamers: ribbons of air blowing across the view, as many as the wind is strong.
      const v = this.camera.view()
      if (
        Math.abs(this.wind) > 0.0015 &&
        this.tick % Math.max(3, Math.round(0.03 / Math.abs(this.wind))) === 0
      ) {
        const fromLeft = this.wind > 0
        this.particles.push({
          x: fromLeft ? v.x0 - 10 : v.x1 + 10,
          y: v.y0 + this.fxRng() * (v.y1 - v.y0),
          vx: this.wind * 260,
          vy: (this.fxRng() - 0.5) * 0.2,
          life: Math.round(
            (v.x1 - v.x0 + 40) / Math.max(0.4, Math.abs(this.wind * 260)),
          ),
          color: RAMPS.cream[4],
          kind: 'streamer',
        })
      }
      // Gust lanes show as bands of streamers.
      for (const l of this.mission.lanes ?? []) {
        if (this.tick % 4 !== 0 || l.x1 < v.x0 || l.x0 > v.x1) continue
        const speed = Math.max(0.5, Math.abs(l.push * 200))
        this.particles.push({
          x: l.push > 0 ? Math.max(l.x0, v.x0 - 10) : Math.min(l.x1, v.x1 + 10),
          y: l.y0 + this.fxRng() * (l.y1 - l.y0),
          vx: l.push * 200,
          vy: 0,
          life: Math.round(Math.min(l.x1 - l.x0, v.x1 - v.x0 + 20) / speed),
          color: '#ffffff',
          kind: 'lane',
        })
      }
    }
    for (const f of this.floaters) {
      f.y -= 0.3
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
    for (const b of this.blooms) {
      b.age++
      if (b.age < 140 && this.tick % 9 === 0) {
        const at = this.bloomAt(b)
        this.fx.burst(
          at.x + (this.fxRng() - 0.5) * 18,
          at.y - 6 - this.fxRng() * 14,
          this.fxRng,
          { count: 2, speed: 0.5, colours: FLOWER_SPARKS[b.colour] },
        )
      }
    }
    this.fx.update()
  }

  /** Where a bloom stands now (one on a moving pad rides it). */
  private bloomAt(b: Bloom): { x: number; y: number } {
    if (!b.pad) return b
    const pad = this.terrain.pad(b.pad)
    if (!pad) return b
    return { x: (pad.x0 + pad.x1) / 2 + (b.dx ?? 0), y: pad.y }
  }

  private followCamera() {
    const pod = this.pod
    const floor = this.terrain.floorAt(pod.x, pod.y)
    const altitude = floor - (pod.y + POD_FEET)
    // Lean the view down toward the ground under the pod, keeping the pod well inside it.
    const halfH = VIEW_H / 2 / this.camera.zoom
    const y = Math.max(pod.y, Math.min(floor - halfH + 30, pod.y + halfH - 30))
    this.camera.follow(
      pod.x,
      y,
      altitude,
      this.terrain.w,
      this.terrain.h,
      pod.vx * 30,
    )
  }

  // --- attract-mode pilot ----------------------------------------------------------------

  /** What the pilot goes for now: refuel when low, else the mission's next goal. */
  pilotGoal(): PilotGoal | null {
    const pod = this.pod
    const pads = this.terrain.pads
    const far = (x: number) => Math.abs(x - pod.x)
    const mid = (p: Pad) => (p.x0 + p.x1) / 2
    if (pod.restOn) {
      const on = this.terrain.pad(pod.restOn)
      if (on?.kind === 'sun' && pod.sun < this.sunMax * 0.95)
        return { kind: 'land', pad: on }
    }
    const towed = this.cargo.find((c) => c.hookedBy === pod.seat)
    let goal: PilotGoal | null = null
    let goalX = pod.x
    if (towed) {
      const pad = this.terrain.pad(this.cargoTo.get(towed.id) ?? '')
      if (pad) {
        goal = {
          kind: 'deliver',
          pad,
          hang: this.winchLine + towed.r * 2 - POD_FEET + 2,
        }
        goalX = mid(pad)
      }
    } else if (this.mission.kind === 'lantern') {
      // Land on the pad beside the nearest lantern that is still dark.
      const lamp = [...(this.mission.lanterns ?? [])]
        .filter((l) => !this.lit.has(l.id))
        .sort((a, b) => far(a.x) - far(b.x))[0]
      const pad = lamp
        ? pads.find((q) => q.x0 <= lamp.x && q.x1 >= lamp.x)
        : undefined
      if (pad) {
        goal = { kind: 'land', pad }
        goalX = mid(pad)
      }
    } else if (
      this.mission.kind === 'deliver' ||
      this.mission.kind === 'water' ||
      this.mission.kind === 'rescue'
    ) {
      const crate = [...this.cargo]
        .filter((c) => !c.delivered)
        .sort((a, b) => far(a.x) - far(b.x))[0]
      if (crate) {
        goal = { kind: 'hook', x: crate.x, y: crate.y - crate.r - 14 }
        goalX = crate.x
      }
    } else if (this.mission.kind === 'rings') {
      const ring = this.mission.rings?.[this.ring]
      if (ring) {
        goal = { kind: 'pass', x: ring.x, y: ring.y }
        goalX = ring.x
      }
    } else {
      // Stick with the bed already chosen while it still wants planting.
      const kept = this.terrain.pad(this.pilotPad)
      const bed =
        kept?.kind === 'seed' && !kept.planted
          ? kept
          : [...pads.filter((p) => p.kind === 'seed' && !p.planted)].sort(
              (a, b) =>
                far(mid(a)) / (4 + a.mult) -
                far(mid(b)) / (4 + b.mult) +
                (a.blocked ? 1e4 : 0) -
                (b.blocked ? 1e4 : 0),
            )[0]
      this.pilotPad = bed?.id ?? ''
      const mill = this.mission.boss?.id === 'galemill' ? this.boss : null
      if (mill) {
        // The Gale Mill: wait over the top of the turn for a sail to come up slow.
        const top = [...mill.pads]
          .filter((p) => !p.planted)
          .sort((a, b) => a.y - b.y)[0]
        const hub = this.mission.boss!.x
        if (top && top.y < GALE_MILL.hubY - GALE_MILL.sail * 0.8) {
          goal = { kind: 'land', pad: top }
          goalX = mid(top)
        } else {
          goal = {
            kind: 'hover',
            x: hub,
            y: GALE_MILL.hubY - GALE_MILL.sail - 14,
          }
          goalX = hub
        }
      } else if (this.boss instanceof GeyserTortoise) {
        // The Geyser Tortoise: hover over the shell's spot until the column calms, then land.
        const shell = this.boss.pads[0]!
        const late = this.boss.calmLeft() < 60 && this.pod.y < shell.y - 22
        if (shell.blocked || late) {
          goal = {
            kind: 'hover',
            x: (this.boss.calmX() + this.boss.x * 3) / 4,
            y: TORTOISE.highY - 24,
          }
        } else goal = { kind: 'land', pad: shell }
        goalX = mid(shell)
      } else if (this.boss instanceof Thunderhead) {
        // Thunderhead: land on the nearest top that is not charging, else hover over it.
        const storm = this.boss
        const open = storm.pads
          .filter((p, k) => !p.planted && k !== storm.charging())
          .sort((p, q) => Math.abs(mid(p) - pod.x) - Math.abs(mid(q) - pod.x))
        const top = open[0] ?? this.boss.pads[0]!
        if (Math.abs(mid(top) - pod.x) < 40 && pod.y > top.y - 70)
          goal = { kind: 'land', pad: top }
        else goal = { kind: 'hover', x: mid(top), y: THUNDERHEAD.y - 50 }
        goalX = pod.x
      } else if (this.boss instanceof OldLander) {
        // The Old Lander: land on the nearest footpad not under a streak, else hover over it.
        const old = this.boss
        const open = old.pads
          .filter((p, k) => !p.planted && k !== old.streaking())
          .sort((p, q) => Math.abs(mid(p) - pod.x) - Math.abs(mid(q) - pod.x))
        const leg = open[0] ?? this.boss.pads[0]!
        if (Math.abs(mid(leg) - pod.x) < 40 && pod.y > leg.y - 70)
          goal = { kind: 'land', pad: leg }
        else goal = { kind: 'hover', x: mid(leg), y: OLD_LANDER.y - 60 }
        goalX = pod.x
      } else if (this.boss instanceof GlowwormQueen) {
        // The Glowworm Queen: land on the lit segment while it has time left, else hover over
        // the one lit next.
        const q = this.boss
        const lit = q.pads[q.lit()]
        const near = lit ? Math.abs(mid(lit) - pod.x) < 60 : false
        if (lit && q.litLeft() > 50 && near) goal = { kind: 'land', pad: lit }
        else {
          const aim = q.pads[lit && q.litLeft() > 50 ? q.lit() : q.next()]!
          goal = { kind: 'hover', x: mid(aim), y: QUEEN.ys[0]! - 46 }
        }
        goalX = pod.x
      } else if (bed?.blocked) {
        // A crow sits on it: hover close by until it flies off.
        goal = { kind: 'hover', x: mid(bed), y: bed.y - 52 }
        goalX = mid(bed)
      } else if (bed) {
        goal = { kind: 'land', pad: bed }
        goalX = mid(bed)
      }
    }
    const sun = pads
      .filter((p) => p.kind === 'sun')
      .sort((a, b) => far(mid(a)) - far(mid(b)))[0]
    // Refuel first when the goal is further than the tank comfortably reaches, or when there
    // is only just enough left to make it back to the sunflower.
    const toSun = sun ? far(mid(sun)) : 0
    const need = Math.min(far(goalX) * 0.6 + 280, toSun * 0.5 + 160)
    if (sun && pod.sun < need) return { kind: 'land', pad: sun }
    return goal
  }

  /** The pilot: through the screens with A, then flying toward pilotGoal. */
  demoInput(): InputFrame {
    const pod = this.pod
    if (this.screen || this.phase !== 'fly' || !pod) {
      const f = pilotInput(pod, this.terrain, null, this.flightTier)
      if (this.screen && this.tick % 20 === 0) {
        // Through the map with A; out of the Pod Shed with B.
        const key = this.screen === 'shed' ? 'b' : 'a'
        f.pressed[key] = true
        f.held[key] = true
      }
      return f
    }
    return pilotInput(
      pod,
      this.terrain,
      this.pilotGoal(),
      this.flightTier,
      (x) => this.obstacleTop(x),
      this.pushAt(pod.x, pod.y).x,
    )
  }

  /** The top of what the pilot must fly over besides the ground: windmill sails. */
  private obstacleTop(x: number): number {
    let top = Infinity
    for (const m of this.windmills)
      if (Math.abs(x - m.x) < m.r + 10) top = Math.min(top, m.y - m.r - 12)
    // Old Scarecrow's hat.
    const b = this.mission.boss
    if (b?.id === 'scarecrow' && Math.abs(x - b.x) < 30) top = Math.min(top, 50)
    return top
  }

  // --- render ----------------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    if (this.screen) {
      this.renderScreen(g)
      return
    }
    const theme = this.mission.theme
    paintSky(g, theme, this.tick, this.camera.x, this.camera.y, this.wind)
    g.save()
    g.beginPath()
    g.rect(0, HUD_H, W, H - HUD_H)
    g.clip()
    this.camera.apply(g)
    this.renderTerrain(g)
    const ground = (x: number) => this.terrain.groundAt(x)
    for (const v of this.vents) drawVent(g, v, ground(v.x), this.tick)
    for (const m of this.windmills) drawWindmill(g, m, ground(m.x), this.tick)
    for (const d of this.mission.drips ?? [])
      drawDrip(g, d, ground(d.x), this.tick)
    for (const c of this.mission.clouds ?? [])
      drawStormCloud(g, c, ground(c.x), this.tick)
    for (const p of this.mission.pebbles ?? [])
      drawPebble(g, p, ground, this.tick)
    if (this.boss) drawBoss(g, this.boss, ground, this.tick)
    for (const growth of this.growths)
      drawGrowth(g, growth, (id) => this.terrain.pad(id), this.tick)
    this.terrain.pads.forEach((p, i) => {
      drawPadLive(g, p, this.tick, i, p.kind === 'seed')
      drawGrowsMark(g, p, this.tick)
    })
    for (const b of this.blooms) {
      const at = this.bloomAt(b)
      drawBloom(g, at.x, at.y, b.colour, b.age, this.tick)
    }
    if (this.mission.rings)
      drawRings(g, this.mission.rings, this.ring, this.tick)
    if (this.mode === 'campaign')
      for (const a of this.mission.acorns ?? [])
        if (!this.acorns.has(a.id)) drawAcorn(g, a, this.tick)
    if (this.flightTier.arc && this.phase === 'fly' && !this.pod.restOn)
      this.renderArc(g)
    for (const c of this.cargo)
      drawCargo(
        g,
        c,
        this.pods.find((p) => p.seat === c.hookedBy) ?? null,
        this.tick,
      )
    this.renderParticles(g)
    for (const f of this.fluffs) drawFluff(g, f, this.tick)
    if (this.phase === 'bonk' && this.phaseTicks < 24) {
      const t = 1 - this.phaseTicks / 24
      glow(
        g,
        this.bonkAt.x,
        this.bonkAt.y,
        10 + 22 * (1 - t),
        RAMPS.gold[3],
        0.7 * t,
      )
    }
    if (this.phase !== 'bonk' && !this.over)
      for (const pod of this.pods) {
        const floor = this.terrain.floorAt(pod.x, pod.y)
        const near = Math.max(0, 1 - (floor - (pod.y + POD_FEET)) / 110)
        if (near > 0) {
          g.fillStyle = 'rgba(20, 10, 38, 0.35)'
          g.beginPath()
          g.ellipse(pod.x, floor + 1, 3 + near * 4, 1 + near, 0, 0, Math.PI * 2)
          g.fill()
        }
        drawPod(g, pod, this.tick)
        if (pod.fluff) drawPodFluff(g, pod.x, pod.y, pod.fluff, this.tick)
      }
    for (const f of this.mission.falls ?? []) drawFall(g, f, this.tick)
    this.renderCave(g)
    for (const c of this.crows)
      drawCrow(g, c, (x) => this.terrain.floorAt(x, c.y), this.tick)
    this.fx.render(g)
    for (const f of this.floaters)
      drawText(g, f.text, f.x, f.y, {
        align: 'center',
        color: f.color,
        outline: INK,
      })
    g.restore()
    this.renderPointers(g)
    vignette(g, W, H, 0.24)
    this.renderHud(g)
    if (this.blur > 0) this.renderBlur(g)
    if (this.card > 0 && !this.menu && this.phase === 'fly')
      drawMissionCard(g, {
        name: this.mission.name,
        brief: this.mission.brief,
        unlocked: (this.mission.unlocked ?? [])
          .filter((h) => h !== 'gust' || this.level > 1)
          .map((h) => `NEW: ${HAZARD_NAMES[h]}`),
        t: CARD_TICKS - this.card,
        left: this.card,
      })
    if (this.phase === 'clear')
      drawTally(g, {
        title:
          this.mission.kind === 'boss'
            ? 'ISLAND REPLANTED!'
            : `${this.mission.name} DONE`,
        lines: this.tally,
        t: this.phaseTicks,
      })
    if (this.banner && this.phase !== 'clear') {
      drawText(g, this.banner.text, W / 2, 70, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.purple[1],
      })
      if (this.banner.sub)
        drawText(g, this.banner.sub, W / 2, 92, {
          align: 'center',
          color: RAMPS.gold[3],
          outline: INK,
        })
    }
    if (this.menu)
      drawMenu(g, {
        title: 'SEED LANDER',
        subtitle: `${this.mastery().rank.name}${this.mastery().next === null ? '' : `  ${this.mastery().next} TO RANK UP`}`,
        rows: this.menuRows(),
        pick: this.menu.pick,
        tick: this.tick,
      })
  }

  /** Firefly Caverns' things in the world, then the dark over them (lit by the glows). */
  private renderCave(g: CanvasRenderingContext2D) {
    const m = this.mission
    const ground = (x: number) => this.terrain.groundAt(x)
    for (const c of m.crystals ?? []) drawCrystal(g, c, this.tick)
    for (const sp of m.spores ?? [])
      drawSpore(g, sp, this.pod.x, this.pod.y, this.tick)
    for (const l of m.lanterns ?? [])
      drawLantern(g, l, ground(l.x), this.lit.has(l.id), this.tick)
    if (!m.dark) return
    const flies = fireflies(this.terrain.w, this.terrain.h, this.tick)
    for (const f of flies) drawFirefly(g, f, this.tick)
    const lights: LightSource[] = flies.map((f) => ({
      x: f.x,
      y: f.y,
      r: LIGHT.firefly,
    }))
    for (const pod of this.pods)
      lights.push({
        x: pod.x,
        y: pod.y,
        r:
          LIGHT.pod * (1 + 0.15 * this.upgrades.lamp) +
          (pod.puffing ? LIGHT.puff : 0),
      })
    for (const l of m.lanterns ?? [])
      if (this.lit.has(l.id))
        lights.push({ x: l.x, y: ground(l.x) - 18, r: LANTERN.light })
    if (this.boss instanceof GlowwormQueen) {
      const lit = this.boss.pads[this.boss.lit()]
      if (lit)
        lights.push({ x: (lit.x0 + lit.x1) / 2, y: lit.y, r: LANTERN.light })
    }
    drawDarkness(g, this.camera.view(), lights)
  }

  /** Spores: the HUD strip smears for a moment. */
  private renderBlur(g: CanvasRenderingContext2D) {
    const fade = Math.min(1, this.blur / 20)
    for (let i = 0; i < 18; i++) {
      g.fillStyle = rgba(RAMPS.pink[2], 0.35 * fade)
      g.fillRect(
        ((i * 37 + this.tick * 3) % (W + 40)) - 20,
        (i * 5) % HUD_H,
        40,
        3,
      )
    }
    g.fillStyle = rgba(RAMPS.pink[3], 0.35 * fade)
    g.fillRect(0, 0, W, HUD_H)
  }

  private renderHud(g: CanvasRenderingContext2D) {
    const pod = this.pod
    const label =
      this.mode === 'trial'
        ? `TRIAL ${clock(this.missionTicks)}`
        : this.missionLabel
    drawHud(g, {
      score: this.score,
      hi: Math.max(this.hiScore, this.score),
      sun: pod.sun / Math.max(1, this.sunMax),
      wind: this.wind,
      vx: pod.vx,
      vy: pod.vy,
      tilt: pod.tilt,
      lives: this.lives,
      label,
      goal: this.goalText(),
      goalDone: this.goalMet(),
      streak: this.streak,
      tier: this.flightTier,
      hopsLeft: Math.max(0, this.flightTier.hops - pod.hops),
      zoom: this.camera.zoom,
      map: {
        terrain: this.terrain,
        pods: this.pods,
        cargo: this.cargo,
        view: this.camera.view(),
      },
      tick: this.tick,
    })
  }

  private renderScreen(g: CanvasRenderingContext2D) {
    if (this.screen === 'soon') {
      drawSoon(g, this.tick, {
        got: ALL_ACORNS.filter((a) => this.acorns.has(a)).length,
        total: ALL_ACORNS.length,
        vault: this.cleared.has(VAULT_INDEX),
        gale: this.gale,
        another: this.gale < GALE_MAX,
      })
      return
    }
    if (this.screen === 'shed') {
      drawShed(g, {
        rows: [
          ...UPGRADES.map((u) => ({
            name: u.name,
            about: u.about,
            level: this.shed[u.id],
            max: UPGRADE_MAX,
            cost: upgradeCost(this.shed[u.id]),
          })),
          {
            name: 'ON TO THE NEXT ISLAND',
            about: 'B ALSO LEAVES',
            level: 0,
            max: 0,
            cost: 0,
          },
        ],
        pick: this.shedPick,
        nectar: this.nectar,
        note: this.shedNote,
        tick: this.tick,
      })
      return
    }
    const isle = islandAt(this.island, this.acorns)!
    const islandAcorns = isle.missions.flatMap((m) => m.acorns ?? [])
    drawIslandMap(g, {
      islands: Array.from({ length: 6 }, (_, i) => {
        const built = ISLANDS[i]
        return {
          name: built?.name ?? 'WILTED ISLAND',
          about: built?.about ?? '',
          built: !!built,
          cleared: this.cleared.has(i),
        }
      }),
      here: this.island,
      missions: isle.missions.map((m, i) => ({
        name: m.kind === 'boss' ? `BOSS: ${m.name}` : m.name,
        medals: this.medals[m.id] ?? 0,
        done: i < this.missionIndex,
      })),
      next: this.missionIndex,
      acorns: {
        got: islandAcorns.filter((a) => this.acorns.has(a.id)).length,
        total: islandAcorns.length,
      },
      nectar: this.nectar,
      tick: this.tick,
    })
  }

  private renderTerrain(g: CanvasRenderingContext2D) {
    const t = this.terrain
    const theme = this.mission.theme
    const v = this.camera.view()
    if (typeof document === 'undefined') {
      paintTerrain(g, t, theme, v.x0 - 2, v.x1 + 2)
      return
    }
    const key = this.terrainArtFor
    if (!key || key.terrain !== t || key.version !== t.version) {
      this.terrainArtFor = { terrain: t, version: t.version }
      const canvas = document.createElement('canvas')
      canvas.width = t.w
      canvas.height = t.h + 80
      const k = canvas.getContext('2d')
      if (k) {
        k.translate(0, 40)
        paintTerrain(k, t, theme)
      }
      this.terrainArt = k ? canvas : null
    }
    if (!this.terrainArt) {
      paintTerrain(g, t, theme, v.x0 - 2, v.x1 + 2)
      return
    }
    g.save()
    g.imageSmoothingEnabled = false
    g.drawImage(this.terrainArt, 0, -40)
    g.restore()
  }

  private renderArc(g: CanvasRenderingContext2D) {
    const pod = this.pod
    const points = predictArc(pod, this.gravityFor(pod), this.wind, (x) =>
      this.terrain.floorAt(x, pod.y),
    )
    points.forEach((p, i) => {
      const last = i === points.length - 1
      g.fillStyle = INK
      g.fillRect(
        Math.round(p.x) - 1,
        Math.round(p.y + POD_FEET) - 1,
        last ? 5 : 3,
        3,
      )
      g.fillStyle = last ? RAMPS.gold[4] : RAMPS.teal[3]
      g.fillRect(Math.round(p.x), Math.round(p.y + POD_FEET), last ? 3 : 1, 1)
    })
  }

  /** Arrows at the screen's edge toward goals out of view: beds, the drop pad, the next ring. */
  private renderPointers(g: CanvasRenderingContext2D) {
    const v = this.camera.view()
    type Goal = { x: number; y: number; label: string; ramp: readonly string[] }
    const goals: Goal[] = []
    const towing = this.cargo.filter((c) => c.hookedBy >= 0)
    for (const p of this.terrain.pads) {
      const x = (p.x0 + p.x1) / 2
      if (p.kind === 'seed' && !p.planted)
        goals.push({
          x,
          y: p.y,
          label: `${p.mult}`,
          ramp: PAD_RAMP[p.mult] ?? RAMPS.teal,
        })
      else if (
        p.kind === 'drop' &&
        towing.some((c) => this.cargoTo.get(c.id) === p.id)
      )
        goals.push({ x, y: p.y, label: 'S', ramp: RAMPS.steel })
      else if (p.kind === 'sun' && this.pod.sun < this.sunMax * 0.3)
        goals.push({ x, y: p.y, label: '*', ramp: RAMPS.gold })
    }
    if (
      (this.mission.kind === 'deliver' || this.mission.kind === 'rescue') &&
      !towing.length
    )
      for (const c of this.cargo)
        if (!c.delivered)
          goals.push({ x: c.x, y: c.y, label: 'C', ramp: RAMPS.rust })
    const ring = this.mission.rings?.[this.ring]
    if (ring) goals.push({ x: ring.x, y: ring.y, label: 'O', ramp: RAMPS.pink })
    const marks = goals.flatMap((goal) => {
      if (goal.x >= v.x0 && goal.x <= v.x1 && goal.y >= v.y0 && goal.y <= v.y1)
        return []
      const s = this.camera.toScreen(goal.x, goal.y)
      return [
        {
          goal,
          x: Math.max(10, Math.min(W - 10, s.x)),
          y: Math.max(HUD_H + 10, Math.min(H - 22, s.y)),
          dir: s.x < 0 ? -1 : s.x > W ? 1 : 0,
        },
      ]
    })
    // Marks on the same edge stack apart rather than overlapping.
    marks.sort((a, b) => a.y - b.y)
    marks.forEach((m, i) => {
      for (const prev of marks.slice(0, i))
        if (Math.abs(m.x - prev.x) < 11 && Math.abs(m.y - prev.y) < 11)
          m.y = prev.y + 11
    })
    const bob = Math.sin(this.tick / 8) > 0 ? 1 : 0
    for (const { goal, x: mx, y, dir } of marks) {
      const x = mx + dir * bob
      const ramp = goal.ramp
      g.fillStyle = INK
      g.fillRect(x - 4, y - 4, 9, 9)
      g.fillStyle = ramp[3]!
      g.fillRect(x - 3, y - 3, 7, 7)
      drawText(g, goal.label, x + 1, y - 3, { align: 'center', color: INK })
      if (dir) {
        const tipX = dir > 0 ? x + 6 : x - 7
        g.fillStyle = INK
        g.fillRect(tipX, y - 2, 2, 5)
        g.fillStyle = ramp[4]!
        g.fillRect(tipX, y - 1, 1, 3)
      }
    }
  }

  private renderParticles(g: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      const x = Math.round(p.x)
      const y = Math.round(p.y)
      if (p.kind === 'lane') {
        // A gust lane's streamer: a white ribbon with a shadow, readable on a bright sky.
        const len = 14
        const x0 = p.vx > 0 ? x - len : x
        g.globalAlpha = 0.55
        g.fillStyle = RAMPS.sky[1]
        g.fillRect(x0, y + 1, len, 1)
        g.globalAlpha = 0.9
        g.fillStyle = p.color
        g.fillRect(x0, y, len, 1)
        g.fillRect(p.vx > 0 ? x - 3 : x, y - 1, 3, 1)
        continue
      }
      if (p.kind === 'streamer') {
        g.globalAlpha = 0.35
        g.fillStyle = p.color
        const len = Math.min(18, Math.abs(p.vx) * 8 + 4)
        g.fillRect(p.vx > 0 ? x - len : x, y, len, 1)
        continue
      }
      if (p.kind === 'puff') {
        const r = 1 + Math.floor((18 - p.life) / 6)
        g.globalAlpha = Math.max(0, (p.life / 18) * 0.7)
        g.fillStyle = RAMPS.cream[2]
        g.fillRect(x - r, y - r + 1, r * 2 + 1, r * 2 - 1)
        g.fillRect(x - r + 1, y - r, r * 2 - 1, r * 2 + 1)
        g.fillStyle = RAMPS.cream[4]
        g.fillRect(x - r + 1, y - r + 1, r * 2 - 2, r * 2 - 2)
        continue
      }
      g.globalAlpha = Math.max(0, Math.min(1, p.life / 24))
      g.fillStyle = INK
      g.fillRect(x - 1, y - 1, 3, 3)
      g.fillStyle = p.color
      g.fillRect(x - 1, y - 1, 2, 2)
      g.fillStyle = '#ffffff'
      g.fillRect(x - 1, y - 1, 1, 1)
    }
    g.globalAlpha = 1
  }
}

const seedLander: ArcadeGameModule = {
  create: (options) => new SeedLander(options),
}

export const create = seedLander.create
export default seedLander
