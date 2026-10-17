import type {
  ArcadeDifficulty,
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'
import { ARCADE_DIFFICULTIES } from '../types'
import {
  PINKWAKE,
  pinkwakeDialogue,
  PINKWAKE_GUARDIAN,
  PINKWAKE_SECTIONS,
  PINKWAKE_WAVES,
  PINKWAKE_WAVE_SIZES,
  pinkwakeScene,
  pinkwakeSpawns,
  pinkwakeStage,
  type PinkwakeEnemy,
} from './rainbowPinkwake'
import {
  BOSS_MAX_HP,
  bossTelegraph,
  createPinkwakeBoss,
  rainbowBossHp,
  stepPinkwakeBoss,
  type PinkwakeBoss,
} from './rainbowPinkwakeBoss'
import {
  addCoopSeats,
  availableCoopTargets,
  coopEnemyHealth,
  haloRevive,
} from './rainbowLocalCoop'
import { enemyBulletContact } from './rainbowHitGeometry'
import {
  drawRainbowBossSprite,
  drawRainbowCommsPortrait,
  drawRainbowEnemySprite,
  drawRainbowGuardianSprite,
  drawRainbowPickupSprite,
  drawRainbowShipSprite,
  drawRainbowStageCard,
  drawRainbowStageStrip,
  drawRainbowSuperCutin,
} from './rainbowGameArt'
import { RAINBOW_PILOTS } from './rainbowPilots'
import {
  MOONJELLY,
  moonjellyDialogue,
  MOONJELLY_GUARDIAN,
  MOONJELLY_SECTIONS,
  MOONJELLY_WAVES,
  MOONJELLY_WAVE_SIZES,
  moonjellyScene,
  moonjellySpawns,
  moonjellyStage,
  type MoonjellyEnemy,
} from './rainbowMoonjelly'
import { RAINBOW_LANES } from './rainbowFormations'
import {
  TRENCH,
  TRENCH_ALL_WAVES,
  TRENCH_FORK,
  TRENCH_GUARDIAN,
  TRENCH_SECTIONS,
  TRENCH_WAVE_SIZES,
  trenchDialogue,
  trenchRouteFor,
  trenchScene,
  trenchSections,
  trenchSpawns,
  trenchStage,
  type TrenchEnemy,
  type TrenchRoute,
  type TrenchSceneId,
} from './rainbowTrench'
import {
  ROSEFIN,
  ROSEFIN_ESCORT,
  ROSEFIN_GUARDIAN,
  ROSEFIN_SECTIONS,
  ROSEFIN_WAVES,
  ROSEFIN_WAVE_SIZES,
  rosefinDialogue,
  rosefinScene,
  rosefinSpawns,
  rosefinSpeed,
  rosefinStage,
  type RosefinEnemy,
  type RosefinSceneId,
} from './rainbowRosefin'
import {
  DELPHION,
  DELPHION_MAX_HP,
  createDelphionBoss,
  delphionCore,
  delphionExposed,
  delphionLeapLanes,
  delphionTwins,
  delphionWarning,
  stepDelphionBoss,
  type DelphionBoss,
} from './rainbowDelphion'
import {
  WRECK,
  WRECK_ALL_WAVES,
  WRECK_FORK,
  WRECK_GUARDIAN,
  WRECK_SECTIONS,
  WRECK_WAVE_SIZES,
  wreckDialogue,
  wreckPodFrames,
  wreckRouteFor,
  wreckScene,
  wreckSpawns,
  wreckStage,
  type WreckEnemy,
  type WreckRoute,
  type WreckSceneId,
} from './rainbowWreckyard'
import {
  SAWTOOTH,
  SAWTOOTH_MAX_HP,
  createSawtoothBoss,
  sawtoothChargeWarning,
  sawtoothExposed,
  sawtoothJaw,
  sawtoothWarning,
  stepSawtoothBoss,
  type SawtoothBoss,
} from './rainbowSawtooth'
import {
  CROWN_REEF,
  CROWN_REEF_ALL_WAVES,
  CROWN_REEF_FORK,
  CROWN_REEF_GUARDIAN,
  CROWN_REEF_PYLONS,
  CROWN_REEF_SECTIONS,
  CROWN_REEF_WAVE_SIZES,
  reefDialogue,
  reefRouteFor,
  reefScene,
  reefSpawns,
  reefStage,
  type ReefEnemy,
  type ReefRoute,
  type ReefSceneId,
} from './rainbowCrownReef'
import {
  LANTERN_RAY,
  LANTERN_RAY_MAX_HP,
  createLanternRayBoss,
  lanternRayBeacon,
  lanternRayExposed,
  lanternRayNurseries,
  lanternRayWarning,
  stepLanternRayBoss,
  type LanternRayBoss,
} from './rainbowLanternRay'
import {
  GLASS,
  GLASS_GUARDIAN,
  GLASS_NAVIGATOR,
  GLASS_SECTIONS,
  GLASS_WAVES,
  GLASS_WAVE_SIZES,
  glassDialogue,
  glassNavigatorY,
  glassScene,
  glassSpawns,
  glassStage,
  type GlassEnemy,
  type GlassSceneId,
} from './rainbowGlassCurrent'
import {
  GLASS_EEL,
  GLASS_EEL_MAX_HP,
  createGlassEelBoss,
  glassEelExposed,
  glassEelWarning,
  stepGlassEelBoss,
  type GlassEelBoss,
} from './rainbowGlassEel'
import {
  PALACE,
  PALACE_CAPTIVE,
  PALACE_CAPTIVES,
  PALACE_GUARDIAN,
  PALACE_SECTIONS,
  PALACE_WAVES,
  PALACE_WAVE_SIZES,
  palaceAllies,
  palaceDialogue,
  palaceScene,
  palaceSpawns,
  palaceStage,
  type PalaceEnemy,
  type PalaceFlags,
  type PalaceSceneId,
} from './rainbowEclipsePalace'
import {
  PRISM_LEVIATHAN,
  PRISM_LEVIATHAN_MAX_HP,
  createPrismLeviathanBoss,
  prismLeviathanExposed,
  prismLeviathanGem,
  prismLeviathanLocks,
  prismLeviathanTidal,
  prismLeviathanWarning,
  stepPrismLeviathanBoss,
  type PrismLeviathanBoss,
} from './rainbowPrismLeviathan'
import {
  ECLIPSE_CROWN,
  ECLIPSE_CROWN_MAX_HP,
  ECLIPSE_ESCAPE,
  createEclipseCrownBoss,
  eclipseCrownSpokes,
  eclipseCrownWarning,
  eclipseEscapeGapY,
  eclipseEscapeWall,
  stepEclipseCrownBoss,
  type EclipseCrownBoss,
} from './rainbowEclipseCrown'
import {
  FINALE,
  FINALE_ENDING_FRAMES,
  FINALE_LANES,
  FINALE_SECTIONS,
  finaleChoiceFor,
  finaleCredits,
  finaleDialogue,
  finaleScene,
  finaleStage,
  type FinaleChoice,
  type FinaleFlags,
  type FinaleSceneId,
} from './rainbowEclipseFinale'
import {
  CLAWBURST_MAX_HP,
  clawburstExposed,
  clawburstWarning,
  createClawburstBoss,
  stepClawburstBoss,
  type ClawburstBoss,
} from './rainbowClawburst'
import {
  createRainbowGuardian,
  RAINBOW_GUARDIAN,
  rainbowGuardianGone,
  rainbowGuardianMarksLanes,
  rainbowGuardianWarning,
  stepRainbowGuardian,
  type RainbowGuardian,
  type RainbowGuardianSection,
} from './rainbowGuardian'
import {
  actCheckpoints,
  checkpointLabel,
  continueSeconds,
  RAINBOW_CONTINUE,
  resumeTick,
  type RainbowCheckpoint,
} from './rainbowCheckpoints'
import {
  RAINBOW_DIFFICULTY_NAMES,
  RAINBOW_FOCUS,
  RAINBOW_MASTERY,
  rainbowMedal,
  readRainbowSave,
} from './rainbowLoadouts'
import type { RainbowMedal, RainbowSave } from './rainbowLoadouts'
import {
  AURELIA_MAX_HP,
  createMoonjellyBoss,
  moonjellyBossWarning,
  stepMoonjellyBoss,
  type MoonjellyBoss,
} from './rainbowMoonjellyBoss'

const W = 480
const H = 270
const SPEED = 2.6
const FOCUS_SPEED = SPEED * 0.55
const CORE_RADIUS = 4
const GRAZE_RADIUS = 15
const PILOT_COLORS = ['#ffd2ef', '#b8f8ff', '#ffe99f', '#b9a9ff'] as const
const SHIP_NAMES = ['PETAL', 'PRISM', 'HALO', 'COMET'] as const
const BURST_FRAMES = 42
const CUTIN_FADE_FRAMES = 10
const POPUP_FRAMES = 50
/** Frames before the continue/new menu takes an A press. */
const RESUME_MENU_GRACE = 20
const INTRO_FRAMES = 160
const STRIP_HEIGHT = 50
const STRIP_SPEED = 0.55
const ACT_ONE_CHECKPOINTS = actCheckpoints(
  PINKWAKE_SECTIONS,
  PINKWAKE.bossStarts,
)
const ACT_TWO_CHECKPOINTS = actCheckpoints(
  MOONJELLY_SECTIONS,
  MOONJELLY.bossStarts,
)
const ACT_THREE_CHECKPOINTS = actCheckpoints(TRENCH_SECTIONS, TRENCH.bossStarts)
const ACT_NUMERALS = [
  'ACT I',
  'ACT II',
  'ACT III',
  'ACT IV',
  'ACT V',
  'ACT VI',
  'ACT VII',
  'ACT VIII',
  'FINALE',
] as const
const ACT_SEVEN_CHECKPOINTS = actCheckpoints(GLASS_SECTIONS, GLASS.bossStarts)
const ACT_EIGHT_CHECKPOINTS = actCheckpoints(PALACE_SECTIONS, PALACE.bossStarts)
const FINALE_CHECKPOINTS = actCheckpoints(FINALE_SECTIONS, FINALE.bossStarts)
/** E23 crystal squids glint for this long, then fire a pellet that splits in three after its fuse. */
const SQUID = { glintFrames: 36, splitFuse: 60 } as const
/** E24 harbingers warm their prism, then alternate a lane bolt and a ring bubble. */
const HARBINGER = { warmFrames: 40, reloadFrames: 120 } as const
/** Prism pylons glow for the warning, then refract a fan; one cycle per this many frames. */
const PRISM = { cycle: 140, glowFrom: 100 } as const
const ACT_SIX_CHECKPOINTS = actCheckpoints(
  CROWN_REEF_SECTIONS,
  CROWN_REEF.bossStarts,
)
/** E19 broodships darken their wings this long, then launch two drones. */
const BROOD_SHADOW_FRAMES = 40
/** E20 turrets unfold for the warning, fire, then fold to reload. */
const TURRET = { unfoldFrames: 40, reloadFrames: 110 } as const
/** E21 bulwarks: a 150-frame shell cycle, glowing for 30 frames before the window opens for 60. */
const BULWARK = { cycle: 150, glowFrom: 60, openFrom: 90 } as const
const ACT_FIVE_CHECKPOINTS = actCheckpoints(WRECK_SECTIONS, WRECK.bossStarts)
/** E16 cutters open their jaws twice while sliding onto the locked lane, then charge down it. */
const CUTTER = { jawFrames: 36, chargeSpeed: 5 } as const
/** E17 hammerheads lock both fin pods before each fires; a pod sits this far above or below the body. */
const HAMMERHEAD = { lockFrames: 36, podReach: 14 } as const
/** E18 salvagers point four arms before they fire along them and grab the nearest loose pickup. */
const SALVAGER = { armFrames: 36, grabReach: 110, grabArmour: 3 } as const
const ACT_FOUR_CHECKPOINTS = actCheckpoints(
  ROSEFIN_SECTIONS,
  ROSEFIN.bossStarts,
)
/** E13 dolphins: beacon, dive toward the middle, stagger there (double damage), dive out across. */
const DOLPHIN = {
  beaconFrames: 30,
  diveIn: 30,
  stagger: 42,
  diveOut: 34,
} as const
/** E14 couriers flicker their cargo light this long before they dash. */
const COURIER_FLICKER_FRAMES = 40
/** E15 eels: a barrier this tall, lit as a warning first; only its bright ends take damage. */
const EEL = { warningFrames: 40, half: 30, endReach: 10 } as const
/** A clawstrike shows its lane for this long before the bolt. */
const CLAWSTRIKE_CHARGE_FRAMES = 36
/** The trench walls a glassfin skate pellet glances off. */
const WALL_TOP = 34
const WALL_BOTTOM = 252
const BASE_HEALTH: Record<string, number> = {
  picket: 2,
  spiral: 3,
  anchor: 4,
  lantern: 3,
  relay: 4,
  skimmer: 3,
  coral: 6,
  urchin: 5,
  clawstrike: 4,
  pistol: 5,
  angler: 4,
  skate: 3,
  dolphin: 4,
  courier: 3,
  eel: 6,
  cutter: 4,
  hammerhead: 5,
  salvager: 6,
  scrap: 1,
  brood: 9,
  drone: 1,
  turret: 5,
  bulwark: 8,
  gate: 1,
  pylon: 12,
  mirror: 4,
  squid: 5,
  harbinger: 7,
  prism: 10,
  captive: 6,
}

/**
 * A pistol bubble bursts into an eight-pellet ring; an angler lure into a four-way cross; a split pellet
 * into three along its heading.
 */
function burstShots(bullet: EnemyShot): EnemyShot[] {
  if (bullet.burst === 'split') {
    const heading = Math.atan2(bullet.vy, bullet.vx)
    return [-0.5, 0, 0.5].map((spread) => ({
      x: bullet.x,
      y: bullet.y,
      vx: Math.cos(heading + spread) * 1.6,
      vy: Math.sin(heading + spread) * 1.6,
      grazed: 0,
    }))
  }
  const ring = bullet.burst === 'ring'
  const count = ring ? 8 : 4
  const speed = ring ? 1.35 : 1.6
  return Array.from({ length: count }, (_, i) => {
    const theta = (i / count) * Math.PI * 2 + (ring ? Math.PI / 8 : 0)
    return {
      x: bullet.x,
      y: bullet.y,
      vx: Math.cos(theta) * speed,
      vy: Math.sin(theta) * speed,
      grazed: 0,
    }
  })
}
/** Presses this soon after the crew falls are fire-button carry-over, not a choice to continue. */
const CONTINUE_GRACE_FRAMES = 30
/**
 * Difficulty (conductor rainbow t-010): Cadet, Pilot and Ace. Cadet flies with five lives, slower enemy
 * pellets and softer craft and bosses; Ace with faster pellets and tougher craft and bosses. Every attack keeps
 * its full warning at every level. The score scales with the level, so one leaderboard stays fair.
 */
export const RAINBOW_DIFFICULTY: Record<
  ArcadeDifficulty,
  {
    lives: number
    bulletSpeed: number
    craftHp: number
    bossHp: number
    score: number
  }
> = {
  easy: { lives: 5, bulletSpeed: 0.8, craftHp: 0.8, bossHp: 0.7, score: 0.5 },
  normal: { lives: 3, bulletSpeed: 1, craftHp: 1, bossHp: 1, score: 1 },
  hard: { lives: 3, bulletSpeed: 1.15, craftHp: 1.25, bossHp: 1.3, score: 1.5 },
}
/** HUD text clears the cabinet's corner chips (close/fullscreen left, pause right). */
const HUD_LEFT = 44
const HUD_RIGHT = W - 26

type Ship = {
  x: number
  y: number
  shield: number
  cooldown: number
  invulnerable: number
  power: number
  charge: number
  graze: number
  lives: number
  focus: boolean
}
type Shot = {
  x: number
  y: number
  vx: number
  vy: number
  seat: number
  damage: number
  /** A focused weapon's shot (t-010), drawn in its family's shape; unfocused fire leaves it out. */
  kind?: 'needle' | 'thread' | 'link' | 'arc'
  /** A Prism Thread passes through this many more craft, never the same one twice. */
  pierce?: number
  struck?: Reef[]
  /** A Comet Arc spark glances off the corridor walls this many more times. */
  bounces?: number
}
type Reef = {
  x: number
  y: number
  phase: number
  health: number
  kind:
    | PinkwakeEnemy
    | MoonjellyEnemy
    | TrenchEnemy
    | RosefinEnemy
    | WreckEnemy
    | ReefEnemy
    | GlassEnemy
    | PalaceEnemy
  fired: boolean
  /**
   * A clawstrike's lane mark, a dolphin's beacon, a courier's cargo flicker or an eel's barrier warning:
   * frames left before it acts.
   */
  charge?: number
  /** A dolphin's lane before it dives, and frames since its dive began. */
  homeY?: number
  dive?: number
  /** A hammerhead's fin pods still attached: bit 1 the upper pod, bit 2 the lower. */
  pods?: number
  /** A salvager hit while its arms were out: its grab is jammed. */
  jammed?: boolean
  /** A harbinger's volleys so far: even ones are lane bolts, odd ones ring bubbles. */
  volleys?: number
  /** A captive whose collar has been broken: it flies free and nothing touches it. */
  freed?: boolean
  wave: number | null
}
type EnemyShot = {
  x: number
  y: number
  vx: number
  vy: number
  grazed: number
  /** Frames until a pistol bubble or angler lure bursts. */
  fuse?: number
  burst?: 'ring' | 'cross' | 'split'
  /** Wall glances left for a glassfin skate pellet. */
  bounces?: number
  /** A phantom pellet (mirror eel, Mirror guardian, Glass Eel afterimage): only light, it never hits. */
  ghost?: boolean
}
type Pickup = { x: number; y: number; kind: 'power' | 'shield' | 'charge' }
type GuardianOutcome = 'waiting' | 'defeated' | 'escaped'

export type RainbowCombatSnapshot = {
  tick: number
  score: number
  ships: ReadonlyArray<Readonly<Ship>>
  shots: ReadonlyArray<Readonly<Shot>>
  /** Medals won so far, by Act (t-010). */
  medals: Readonly<
    Partial<Record<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9, RainbowMedal>>
  >
  /** Mastery goals this run has met (the attract demo's too, which it never reports). */
  earned: readonly string[]
  difficulty: ArcadeDifficulty
  /** The continue/new menu's highlighted line (0 continue, 1 new flight), or null when it is not shown. */
  resumeMenu: 0 | 1 | null
  enemies: ReadonlyArray<Readonly<Reef>>
  enemyShots: ReadonlyArray<Readonly<EnemyShot>>
  pickups: ReadonlyArray<Readonly<Pickup>>
  act: 'S01' | 'S02' | 'S03' | 'S04' | 'S05' | 'S06' | 'S07' | 'S08' | 'S09'
  stage:
    | ReturnType<typeof pinkwakeStage>
    | ReturnType<typeof moonjellyStage>
    | ReturnType<typeof trenchStage>
    | ReturnType<typeof rosefinStage>
    | ReturnType<typeof wreckStage>
    | ReturnType<typeof reefStage>
    | ReturnType<typeof glassStage>
    | ReturnType<typeof palaceStage>
    | ReturnType<typeof finaleStage>
  sceneId:
    | 'A01.OPEN'
    | 'A01.TURN'
    | 'A01.AFTER'
    | 'A02.OPEN'
    | 'A02.TURN'
    | 'A02.AFTER'
    | 'A03.OPEN'
    | 'A03.FORK'
    | 'A03.TURN'
    | 'A03.AFTER'
    | RosefinSceneId
    | WreckSceneId
    | ReefSceneId
    | GlassSceneId
    | PalaceSceneId
    | FinaleSceneId
    | null
  boss: Readonly<PinkwakeBoss> | null
  moonBoss: Readonly<MoonjellyBoss> | null
  clawBoss: Readonly<ClawburstBoss> | null
  delphion: Readonly<DelphionBoss> | null
  sawtooth: Readonly<SawtoothBoss> | null
  lanternRay: Readonly<LanternRayBoss> | null
  glassEel: Readonly<GlassEelBoss> | null
  leviathan: Readonly<PrismLeviathanBoss> | null
  crown: Readonly<EclipseCrownBoss> | null
  guardian: Readonly<RainbowGuardian> | null
  /** Each Act's guardian: still to come (or in play), destroyed, or escaped. */
  guardians: Readonly<Record<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8, GuardianOutcome>>
  rescuedNemi: boolean
  /** Act III's route: null until the fork, then the vault gauntlet or the safe passage. */
  trenchRoute: TrenchRoute | null
  /** The story flag the vault route earns once the crew rejoins with its salvage. */
  securedSalvage: boolean
  /** Act IV's escort pod while it runs the rails, and whether it got through. */
  escort: Readonly<{ x: number; y: number; hull: number }> | null
  rescuedCourier: boolean
  actTwoFrame: number
  actThreeFrame: number
  actFourFrame: number
  actFiveFrame: number
  /** Act V's route: null until the fork, then the survivor depot or the armory. */
  wreckRoute: WreckRoute | null
  /** Survivor pods reached on the depot route, the pods still drifting, and the story flag it earns. */
  podsSaved: number
  survivors: ReadonlyArray<Readonly<{ x: number; y: number }>>
  freedDepot: boolean
  actSixFrame: number
  /** Frames the crew has rested at Act V's memorial, or null when not resting. */
  resting: number | null
  /** Act VI's route, the relay pylons broken, and the story flag the relay earns. */
  reefRoute: ReefRoute | null
  pylonsDown: number
  stoppedRelay: boolean
  actSevenFrame: number
  /** Act VII's Lost Navigator pod while it drifts, and whether the crew reached it. */
  navigator: Readonly<{ x: number; y: number }> | null
  rescuedNavigator: boolean
  actEightFrame: number
  /** Act VIII's captives freed so far, and the allies earlier rescues bring to the council. */
  captivesFreed: number
  allies: readonly string[]
  /** The finale: its clock, the choice window and the escape (frames in, or null), and the choice made. */
  finaleFrame: number
  choiceFrame: number | null
  escapeFrame: number | null
  endingFrame: number | null
  finalChoice: FinaleChoice | null
  /** Frames the crew has rested at Act III's salvage dock, or null when not docked. */
  docked: number | null
  rescuedStation: boolean
  defeatedAt: number | null
  activePlayers: number
  schoolBonuses: number
  checkpoint: Readonly<RainbowCheckpoint>
  continueLeft: number
  continues: number
}

/** The preview's deterministic 60 Hz combat layer; stages and bosses are separate work. */
export function createRainbowPrincessPreview(
  options: ArcadeGameOptions,
): ArcadeGameInstance & { readonly snapshot: RainbowCombatSnapshot } {
  const count = Math.max(1, Math.min(4, options.players ?? 1))
  let activePlayers = count
  let difficulty: ArcadeDifficulty =
    options.difficulty && options.difficulty in RAINBOW_DIFFICULTY
      ? options.difficulty
      : 'normal'
  let level = RAINBOW_DIFFICULTY[difficulty]
  /** A boss's hull for this crew at this difficulty. */
  const bossHp = (base: number) =>
    Math.max(1, Math.round(rainbowBossHp(base, activePlayers) * level.bossHp))
  const createShip = (seat: number): Ship => ({
    x: 65,
    y: 80 + seat * 32,
    shield: 3,
    cooldown: 0,
    invulnerable: 120,
    power: 1,
    charge: 0,
    graze: 0,
    lives: level.lives,
    focus: false,
  })
  const ships: Ship[] = Array.from({ length: count }, (_, seat) =>
    createShip(seat),
  )
  const shots: Shot[] = []
  const reefs: Reef[] = []
  const enemyShots: EnemyShot[] = []
  const pickups: Pickup[] = []
  let tick = 0
  let score = 0
  let over = false
  let clearCount = 0
  let supers = 0
  const bursts: Array<{ seat: number; x: number; y: number; age: number }> = []
  let boss: PinkwakeBoss | null = null
  let defeatedAt: number | null = null
  let rescuedStation = false
  let station: { x: number; y: number } | null = null
  let moonStart: number | null = null
  let moonBoss: MoonjellyBoss | null = null
  // A continue mid-fight brings the boss back as damaged as the crew left it, so every attempt counts.
  let bossCarryHp: number | null = null
  let guardian: RainbowGuardian | null = null
  const guardians: Record<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8, GuardianOutcome> = {
    1: 'waiting',
    2: 'waiting',
    3: 'waiting',
    4: 'waiting',
    5: 'waiting',
    6: 'waiting',
    7: 'waiting',
    8: 'waiting',
  }
  const guardianSections = {
    1: PINKWAKE_GUARDIAN,
    2: MOONJELLY_GUARDIAN,
    3: TRENCH_GUARDIAN,
    4: ROSEFIN_GUARDIAN,
    5: WRECK_GUARDIAN,
    6: CROWN_REEF_GUARDIAN,
    7: GLASS_GUARDIAN,
    8: PALACE_GUARDIAN,
  } as const
  let moonBossCarryHp: number | null = null
  let moonDefeatedFrame: number | null = null
  let trenchStart: number | null = null
  let clawBoss: ClawburstBoss | null = null
  let clawBossCarryHp: number | null = null
  let trenchDefeatedFrame: number | null = null
  let rosefinStart: number | null = null
  let delphion: DelphionBoss | null = null
  let delphionCarryHp: number | null = null
  let rosefinDefeatedFrame: number | null = null
  let rescuedCourier = false
  let escort: { x: number; y: number; hull: number } | null = null
  let escortDone = false
  let wreckStart: number | null = null
  let sawtooth: SawtoothBoss | null = null
  let sawtoothCarryHp: number | null = null
  let wreckDefeatedFrame: number | null = null
  let wreckRoute: WreckRoute | null = null
  let wreckSettled = false
  let podsSaved = 0
  const survivors: Array<{ x: number; y: number }> = []
  let reefStart: number | null = null
  let lanternRay: LanternRayBoss | null = null
  let lanternRayCarryHp: number | null = null
  let reefDefeatedFrame: number | null = null
  let reefRoute: ReefRoute | null = null
  let reefSettled = false
  let pylonsDown = 0
  let glassStart: number | null = null
  let glassEel: GlassEelBoss | null = null
  let glassEelCarryHp: number | null = null
  let glassDefeatedFrame: number | null = null
  let rescuedNavigator = false
  let navigator: { x: number; y: number } | null = null
  let navigatorDone = false
  let palaceStart: number | null = null
  let leviathan: PrismLeviathanBoss | null = null
  let leviathanCarryHp: number | null = null
  let palaceDefeatedFrame: number | null = null
  let captivesFreed = 0
  let finaleStart: number | null = null
  let crown: EclipseCrownBoss | null = null
  let crownCarryHp: number | null = null
  let choiceFrame: number | null = null
  let escapeFrame: number | null = null
  let endingFrame: number | null = null
  let finalChoice: FinaleChoice | null = null
  let rescuedNemi = false
  let trenchRoute: TrenchRoute | null = null
  let routeSettled = false
  let nemi: { x: number; y: number } | null = null
  const waveSpawned = new Map<number, number>()
  const waveLeft = new Map<number, number>()
  const brokenWaves = new Set<number>()
  let schoolBonuses = 0
  let checkpoint: RainbowCheckpoint = {
    act: 1,
    frame: 0,
    score: 0,
    rescuedStation: false,
    rescuedNemi: false,
    trenchRoute: null,
    routeSettled: false,
    rescuedCourier: false,
    wreckRoute: null,
    wreckSettled: false,
    podsSaved: 0,
    reefRoute: null,
    reefSettled: false,
    pylonsDown: 0,
    rescuedNavigator: false,
    captivesFreed: 0,
    schoolBonuses: 0,
  }
  let continueLeft = 0
  let continues = 0
  const popups: Array<{ x: number; y: number; text: string; age: number }> = []
  /** Medals won by Act, and the hits taken and continues spent in the Act under way (t-010). */
  const medals: Partial<
    Record<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9, RainbowMedal>
  > = {}
  let actHits = 0
  let actContinues = 0
  /** Mastery goals earned this game. */
  const earned: string[] = []
  /** The progress the cabinet keeps: written at each Act start, cleared at THE END. */
  let saveRecord: RainbowSave | null | undefined = undefined
  /** A saved flight to offer before the game begins: continue from its Act, or start a new one. */
  const offered = options.demo ? null : readRainbowSave(options.resume)
  let resumeMenu: { save: RainbowSave; pick: 0 | 1; frame: number } | null =
    offered ? { save: offered, pick: 0, frame: 0 } : null
  function moonFrame() {
    return moonStart === null ? 0 : tick - moonStart
  }
  function trenchFrame() {
    return trenchStart === null ? 0 : tick - trenchStart
  }
  function rosefinFrame() {
    return rosefinStart === null ? 0 : tick - rosefinStart
  }
  function wreckFrame() {
    return wreckStart === null ? 0 : tick - wreckStart
  }
  function reefFrame() {
    return reefStart === null ? 0 : tick - reefStart
  }
  function glassFrame() {
    return glassStart === null ? 0 : tick - glassStart
  }
  function palaceFrame() {
    return palaceStart === null ? 0 : tick - palaceStart
  }
  function finaleFrame() {
    return finaleStart === null ? 0 : tick - finaleStart
  }
  function currentAct(): 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 {
    return finaleStart !== null
      ? 9
      : palaceStart !== null
        ? 8
        : glassStart !== null
          ? 7
          : reefStart !== null
            ? 6
            : wreckStart !== null
              ? 5
              : rosefinStart !== null
                ? 4
                : trenchStart !== null
                  ? 3
                  : moonStart !== null
                    ? 2
                    : 1
  }
  /** The Act's own clock: Act I runs on the global tick, later Acts count from their first frame. */
  function actFrame(act: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9) {
    return act === 1
      ? tick
      : act === 2
        ? moonFrame()
        : act === 3
          ? trenchFrame()
          : act === 4
            ? rosefinFrame()
            : act === 5
              ? wreckFrame()
              : act === 6
                ? reefFrame()
                : act === 7
                  ? glassFrame()
                  : act === 8
                    ? palaceFrame()
                    : finaleFrame()
  }
  /** The six rescue flags and the armada count, for the ending and the credits. */
  function finaleFlags(): FinaleFlags {
    return {
      ...palaceFlags(),
      securedSalvage: trenchRoute === 'vault' && routeSettled,
    }
  }
  /** What the crew carries into the palace from earlier Acts. */
  function palaceFlags(): PalaceFlags {
    return {
      rescuedNemi,
      rescuedCourier,
      freedDepot:
        wreckRoute === 'depot' &&
        wreckSettled &&
        podsSaved >= WRECK_FORK.podsToFree,
      stoppedRelay:
        reefRoute === 'relay' && reefSettled && pylonsDown >= CROWN_REEF_PYLONS,
      rescuedNavigator,
      captivesFreed,
    }
  }
  function livingShips() {
    return ships.slice(0, activePlayers).filter((ship) => ship.lives > 0)
  }
  /** Frames rested at Act V's memorial, or null before it (or once Act VI has launched). */
  function restingFrames() {
    if (wreckDefeatedFrame === null || reefStart !== null) return null
    const rested = wreckFrame() - wreckDefeatedFrame - WRECK.aftermathFrames
    return rested >= 0 ? rested : null
  }

  /** Leave the memorial for Act VI: one bounded repair (a shield each), then the Crown Reef. */
  function launchCrownReef() {
    reefStart = tick
    shots.length = 0
    pickups.length = 0
    enemyShots.length = 0
    survivors.length = 0
    for (const ship of livingShips()) ship.shield = Math.min(3, ship.shield + 1)
  }

  /** Act VI's fork: where the living crew flies at the decision frame picks the route. */
  function chooseReefRoute() {
    reefRoute = reefRouteFor(livingShips().map((ship) => ship.y))
    popups.push({
      x: W / 2,
      y: 92,
      text: reefRoute === 'relay' ? 'DAMAGE RELAY' : 'SHIELD CACHE',
      age: 0,
    })
  }

  /** The rejoin: a broken relay pays out and powers the crew up; the cache refills every shield. */
  function settleReefRoute() {
    reefSettled = true
    const stopped = reefRoute === 'relay' && pylonsDown >= CROWN_REEF_PYLONS
    if (reefRoute === 'relay') {
      if (stopped) score += CROWN_REEF_FORK.relayScore
      for (const ship of livingShips()) ship.power = Math.min(3, ship.power + 1)
    } else {
      for (const ship of livingShips()) {
        ship.shield = 3
        ship.charge = Math.min(100, ship.charge + 50)
      }
    }
    popups.push({
      x: W / 2,
      y: 92,
      text:
        reefRoute === 'relay'
          ? stopped
            ? `RELAY STOPPED +${CROWN_REEF_FORK.relayScore} · POWER UP`
            : `RELAY STILL LIVE · POWER UP`
          : 'SHIELD CACHE · SHIELDS FULL',
      age: 0,
    })
    options.sound.play('pickup')
  }

  /** The Crown's heart is spent: its weapons fall silent and the final choice opens. */
  function subdueCrown() {
    if (!crown) return
    crown = null
    choiceFrame = 0
    enemyShots.length = 0
    score += 9000
    for (const ship of ships.slice(0, activePlayers))
      ship.invulnerable = Math.max(ship.invulnerable, 240)
    options.sound.play('level')
  }

  /** The whole crew fell in the prism corridors: the escape starts again, the choice kept. */
  function restartEscape() {
    escapeFrame = 0
    shots.length = 0
    enemyShots.length = 0
    pickups.length = 0
    for (let seat = 0; seat < activePlayers; seat++) {
      Object.assign(ships[seat]!, createShip(seat), {
        invulnerable: RAINBOW_CONTINUE.invulnerableFrames,
      })
    }
    options.sound.play('level')
  }

  function defeatLeviathan() {
    if (!leviathan || palaceDefeatedFrame !== null) return
    leviathan = null
    palaceDefeatedFrame = palaceFrame()
    // The freed whale fleet takes every captive still in the palace with it.
    for (const reef of reefs)
      if (reef.kind === 'captive' && !reef.freed) captivesFreed++
    reefs.length = 0
    enemyShots.length = 0
    score += 7000
    for (const ship of ships.slice(0, activePlayers)) {
      ship.invulnerable = Math.max(ship.invulnerable, 240)
    }
    options.sound.play('level')
  }

  /** A broken collar frees its captive: it lifts away and nothing touches it again. */
  function freeCaptive(reef: Reef) {
    if (reef.freed) return
    reef.freed = true
    captivesFreed++
    score += PALACE_CAPTIVE.freeScore
    popups.push({
      x: reef.x,
      y: reef.y - PALACE_CAPTIVE.collarOffset,
      text: `CAPTIVE FREED ${captivesFreed}`,
      age: 0,
    })
    options.sound.play('pickup')
  }

  /** The council (Act VIII's mid-Act TURN): every ally earlier rescues earned adds a shield and charge. */
  function convene() {
    const allies = palaceAllies(palaceFlags()).length
    if (!allies) return
    for (const ship of livingShips()) {
      ship.shield = Math.min(3, ship.shield + 1)
      ship.charge = Math.min(100, ship.charge + 15 * allies)
    }
    popups.push({
      x: W / 2,
      y: 92,
      text: `ALLIES ANSWER ×${allies}`,
      age: 0,
    })
    options.sound.play('pickup')
  }

  function defeatGlassEel() {
    if (!glassEel || glassDefeatedFrame !== null) return
    glassEel = null
    glassDefeatedFrame = glassFrame()
    reefs.length = 0
    enemyShots.length = 0
    score += 6500
    for (const ship of ships.slice(0, activePlayers)) {
      ship.invulnerable = Math.max(ship.invulnerable, 240)
    }
    options.sound.play('level')
  }

  /** Act VII's craft move by their own rules. */
  function stepGlassCraft(reef: Reef) {
    if (reef.kind === 'mirror') {
      // Mirror eels weave fast through the canyon and fire once, a solid fan beside its reflection.
      reef.x -= 1.3
      reef.y += Math.sin(tick / 22 + reef.phase) * 0.6
      if (!reef.fired && reef.x < W - 90) {
        reef.fired = true
        fireEnemy(reef)
      }
      return
    }
    if (reef.kind === 'squid') {
      reef.x -= 0.75
      reef.y += Math.sin(tick / 30 + reef.phase) * 0.4
      if (reef.charge === undefined) {
        if (reef.x < W - 80) reef.charge = SQUID.glintFrames
      } else if (reef.charge > 0 && --reef.charge === 0) fireEnemy(reef)
      return
    }
    if (reef.kind === 'harbinger') {
      // The prism warms for the whole warning, then fires; it reloads, then warms again.
      reef.x -= 0.5
      if (reef.charge === undefined) {
        if (reef.x < W - 60) reef.charge = HARBINGER.warmFrames
      } else if (reef.charge > 0) {
        if (--reef.charge === 0) {
          fireEnemy(reef)
          reef.volleys = (reef.volleys ?? 0) + 1
          reef.dive = HARBINGER.reloadFrames
        }
      } else if (reef.dive !== undefined && --reef.dive === 0) {
        reef.charge = HARBINGER.warmFrames
      }
      return
    }
    // Prism pylon: drifts slowly, glows, then refracts a fan.
    reef.x -= 0.4
    reef.dive = (reef.dive ?? 0) + 1
    if (reef.dive % PRISM.cycle === 0) fireEnemy(reef)
  }

  function defeatLanternRay() {
    if (!lanternRay || reefDefeatedFrame !== null) return
    lanternRay = null
    reefDefeatedFrame = reefFrame()
    reefs.length = 0
    enemyShots.length = 0
    score += 6000
    for (const ship of ships.slice(0, activePlayers)) {
      ship.invulnerable = Math.max(ship.invulnerable, 240)
    }
    options.sound.play('level')
  }

  /** True while a bulwark's shell window is open: only then does its spiral eye take damage. */
  function bulwarkOpen(reef: Reef) {
    return (
      reef.kind === 'bulwark' &&
      reef.dive !== undefined &&
      reef.dive % BULWARK.cycle >= BULWARK.openFrom
    )
  }

  /** Act VI's craft move by their own rules. */
  function stepReefCraft(reef: Reef) {
    if (reef.kind === 'gate') {
      reef.x -= 0.8
      return
    }
    if (reef.kind === 'pylon') {
      reef.x -= 0.45
      return
    }
    if (reef.kind === 'drone') {
      // Interceptors weave toward the nearest pilot and fire once.
      reef.x -= 1.8
      const living = livingShips()
      const target = living.reduce(
        (best, ship) =>
          Math.abs(ship.y - reef.y) < Math.abs(best.y - reef.y) ? ship : best,
        living[0] ?? { y: reef.y },
      )
      reef.y += Math.sign(target.y - reef.y) * 0.45
      if (!reef.fired && reef.x < W - 120) {
        reef.fired = true
        fireEnemy(reef)
      }
      return
    }
    if (reef.kind === 'brood') {
      reef.x -= 0.6
      reef.y += Math.sin(tick / 40 + reef.phase) * 0.25
      if (reef.charge === undefined && reef.x < W - 70)
        reef.charge = BROOD_SHADOW_FRAMES
      else if (
        reef.charge !== undefined &&
        reef.charge > 0 &&
        --reef.charge === 0
      )
        for (const side of [-1, 1]) spawn('drone', reef.y + side * 18, null)
      return
    }
    if (reef.kind === 'turret') {
      reef.x -= 0.55
      if (reef.charge === undefined) {
        if (reef.x < W - 60) reef.charge = TURRET.unfoldFrames
      } else if (reef.charge > 0) {
        if (--reef.charge === 0) {
          fireEnemy(reef)
          reef.dive = TURRET.reloadFrames
        }
      } else if (reef.dive !== undefined && --reef.dive === 0) {
        reef.charge = TURRET.unfoldFrames
      }
      return
    }
    // Bulwark: a steady shell cycle; the window opens on a sweeping barrier.
    reef.x -= 0.5
    reef.dive = (reef.dive ?? 0) + 1
    if (reef.dive % BULWARK.cycle === BULWARK.openFrom) fireEnemy(reef)
  }

  /** Act V's fork: where the living crew flies at the decision frame picks the route. */
  function chooseWreckRoute() {
    wreckRoute = wreckRouteFor(livingShips().map((ship) => ship.y))
    popups.push({
      x: W / 2,
      y: 92,
      text:
        wreckRoute === 'depot' ? 'SURVIVOR DEPOT · 40 SECONDS' : 'ARMORY RAID',
      age: 0,
    })
  }

  /** The rejoin: the depot frees its survivors (and repairs shields), the armory arms the crew. */
  function settleWreckRoute() {
    wreckSettled = true
    survivors.length = 0
    if (wreckRoute === 'depot') {
      score += podsSaved * WRECK_FORK.podScore
      for (const ship of livingShips())
        ship.shield = Math.min(3, ship.shield + 1)
    } else {
      score += WRECK_FORK.armoryScore
      for (const ship of livingShips()) {
        ship.power = Math.min(3, ship.power + 1)
        ship.charge = 100
      }
    }
    popups.push({
      x: W / 2,
      y: 92,
      text:
        wreckRoute === 'depot'
          ? `${podsSaved} SURVIVORS · ${podsSaved >= WRECK_FORK.podsToFree ? 'DEPOT FREED' : 'DEPOT LOST'}`
          : `ARMORY RAIDED +${WRECK_FORK.armoryScore} · POWER UP`,
      age: 0,
    })
    options.sound.play('pickup')
  }

  function defeatSawtooth() {
    if (!sawtooth || wreckDefeatedFrame !== null) return
    sawtooth = null
    wreckDefeatedFrame = wreckFrame()
    reefs.length = 0
    enemyShots.length = 0
    score += 5500
    for (const ship of ships.slice(0, activePlayers)) {
      ship.invulnerable = Math.max(ship.invulnerable, 240)
    }
    options.sound.play('level')
  }

  /** Act V's craft move by their own rules. */
  function stepWreckCraft(reef: Reef) {
    if (reef.kind === 'scrap') {
      reef.x -= 0.6
      reef.y += Math.sin(tick / 50 + reef.phase) * 0.3
      return
    }
    if (reef.kind === 'cutter') {
      if (reef.dive !== undefined) {
        reef.x -= CUTTER.chargeSpeed
        return
      }
      if (reef.charge === undefined) {
        reef.x -= 1.2
        if (reef.x < W - 60) {
          // Lock the nearest pilot's lane: the jaws open twice while the cutter slides onto it.
          const living = livingShips()
          const target = living.reduce(
            (best, ship) =>
              Math.abs(ship.y - reef.y) < Math.abs(best.y - reef.y)
                ? ship
                : best,
            living[0] ?? { y: reef.y },
          )
          reef.homeY = Math.max(50, Math.min(220, target.y))
          reef.charge = CUTTER.jawFrames
        }
        return
      }
      reef.x -= 0.2
      reef.y += (reef.homeY! - reef.y) * 0.15
      if (--reef.charge === 0) {
        reef.y = reef.homeY!
        reef.dive = 0
      }
      return
    }
    if (reef.kind === 'hammerhead') {
      reef.pods ??= 3
      if (reef.charge === undefined) {
        reef.x -= 0.9
        if (reef.x < W - 70) reef.charge = HAMMERHEAD.lockFrames
      } else if (reef.charge > 0) {
        reef.x -= 0.3
        if (--reef.charge === 0) fireEnemy(reef)
      } else reef.x -= 0.9
      reef.y += Math.sin(tick / 30 + reef.phase) * 0.3
      return
    }
    // Salvager: drifts in, points its arms, then fires along them and grabs unless a hit jammed it.
    if (reef.charge === undefined) {
      reef.x -= 0.75
      if (reef.x < W - 80) reef.charge = SALVAGER.armFrames
    } else if (reef.charge > 0) {
      reef.x -= 0.25
      if (--reef.charge === 0) {
        fireEnemy(reef)
        if (!reef.jammed) {
          let best = -1
          for (const [i, pickup] of pickups.entries())
            if (
              Math.hypot(pickup.x - reef.x, pickup.y - reef.y) <
                SALVAGER.grabReach &&
              (best < 0 ||
                Math.hypot(pickup.x - reef.x, pickup.y - reef.y) <
                  Math.hypot(
                    pickups[best]!.x - reef.x,
                    pickups[best]!.y - reef.y,
                  ))
            )
              best = i
          if (best >= 0) {
            pickups.splice(best, 1)
            reef.health += SALVAGER.grabArmour
            popups.push({ x: reef.x, y: reef.y - 16, text: 'GRABBED', age: 0 })
          }
        }
      }
    } else reef.x -= 0.75
  }
  /** Frames rested at Act III's salvage dock, or null before it (or once Act IV has launched). */
  function dockedFrames() {
    if (trenchDefeatedFrame === null || rosefinStart !== null) return null
    const docked = trenchFrame() - trenchDefeatedFrame - TRENCH.aftermathFrames
    return docked >= 0 ? docked : null
  }

  /** Leave the salvage dock for Act IV: one bounded repair (a shield each), then the express. */
  function launchRosefin() {
    rosefinStart = tick
    shots.length = 0
    pickups.length = 0
    enemyShots.length = 0
    for (const ship of ships.slice(0, activePlayers))
      if (ship.lives > 0) ship.shield = Math.min(3, ship.shield + 1)
  }

  function defeatDelphion() {
    if (!delphion || rosefinDefeatedFrame !== null) return
    delphion = null
    rosefinDefeatedFrame = rosefinFrame()
    reefs.length = 0
    enemyShots.length = 0
    score += 5000
    for (const ship of ships.slice(0, activePlayers)) {
      ship.invulnerable = Math.max(ship.invulnerable, 240)
    }
    options.sound.play('level')
  }

  /** True while a dolphin hangs in the middle after its dive: it takes double damage. */
  function dolphinStaggered(reef: Reef) {
    return (
      reef.kind === 'dolphin' &&
      reef.dive !== undefined &&
      reef.dive > DOLPHIN.diveIn &&
      reef.dive <= DOLPHIN.diveIn + DOLPHIN.stagger
    )
  }

  /** Act IV's craft move by their own rules, and the express current's surges speed them up. */
  function stepRosefinCraft(reef: Reef) {
    const surge = 1 + (rosefinSpeed(rosefinFrame()) - 1) * 0.6
    if (reef.kind === 'dolphin') {
      reef.homeY ??= reef.y
      if (reef.dive === undefined) {
        reef.x -= 1.05 * surge
        reef.y = reef.homeY + Math.sin(tick / 24 + reef.phase) * 3
        if (!reef.fired && reef.x < W - 70) {
          reef.fired = true
          reef.charge = DOLPHIN.beaconFrames
        } else if (
          reef.charge !== undefined &&
          reef.charge > 0 &&
          --reef.charge === 0
        ) {
          // The beacons have shown for the full warning: fan out and dive.
          reef.dive = 0
          fireEnemy(reef)
        }
        return
      }
      reef.dive++
      const side = reef.homeY < H / 2 ? -1 : 1
      const middle = H / 2 + side * 9
      const across = H - reef.homeY
      const ease = (t: number) => (1 - Math.cos(Math.PI * Math.min(1, t))) / 2
      const out = reef.dive - DOLPHIN.diveIn - DOLPHIN.stagger
      if (reef.dive <= DOLPHIN.diveIn) {
        reef.y =
          reef.homeY + (middle - reef.homeY) * ease(reef.dive / DOLPHIN.diveIn)
        reef.x -= 1.3 * surge
      } else if (out <= 0) {
        reef.y = middle + Math.sin(reef.dive / 3) * 1.5
        reef.x -= 0.35 * surge
      } else {
        reef.y = middle + (across - middle) * ease(out / DOLPHIN.diveOut)
        reef.x -= 1.5 * surge
      }
      return
    }
    if (reef.kind === 'courier') {
      if (reef.charge === undefined) {
        reef.x -= 0.6 * surge
        if (reef.x < W - 24) reef.charge = COURIER_FLICKER_FRAMES
      } else if (reef.charge > 0) {
        // The cargo light flickers while the courier all but holds still.
        reef.charge--
        reef.x -= 0.25
      } else {
        reef.x -= 3.2 * surge
        if (!reef.fired && reef.x < W / 2 + 20) {
          reef.fired = true
          fireEnemy(reef)
        }
      }
      return
    }
    // Eel: drifts in with its barrier lit as a warning, then the barrier goes live.
    reef.x -= (reef.charge === 0 ? 0.75 : 0.9) * surge
    if (reef.charge === undefined && reef.x < W - 20)
      reef.charge = EEL.warningFrames
    else if (reef.charge !== undefined && reef.charge > 0) reef.charge--
  }

  /** The fork: where the living crew flies at the decision frame picks the route. */
  function chooseTrenchRoute() {
    trenchRoute = trenchRouteFor(
      ships
        .slice(0, activePlayers)
        .filter((ship) => ship.lives > 0)
        .map((ship) => ship.y),
    )
    popups.push({
      x: W / 2,
      y: 92,
      text: trenchRoute === 'vault' ? 'SALVAGE VAULT' : 'SAFE PASSAGE',
      age: 0,
    })
  }

  /** The rejoin: the vault pays out its salvage, the safe passage a shield repair. */
  function settleTrenchRoute() {
    routeSettled = true
    const living = ships
      .slice(0, activePlayers)
      .filter((ship) => ship.lives > 0)
    if (trenchRoute === 'vault') {
      score += TRENCH_FORK.salvageScore
      for (const ship of living) ship.power = Math.min(3, ship.power + 1)
    } else {
      for (const ship of living) ship.shield = Math.min(3, ship.shield + 1)
    }
    popups.push({
      x: W / 2,
      y: 92,
      text:
        trenchRoute === 'vault'
          ? `SALVAGE SECURED +${TRENCH_FORK.salvageScore} · POWER UP`
          : 'SAFE PASSAGE · SHIELDS REPAIRED',
      age: 0,
    })
    options.sound.play('pickup')
  }

  function defeatClawBoss() {
    if (!clawBoss || trenchDefeatedFrame !== null) return
    clawBoss = null
    trenchDefeatedFrame = trenchFrame()
    reefs.length = 0
    enemyShots.length = 0
    score += 4500
    for (const ship of ships.slice(0, activePlayers)) {
      ship.invulnerable = Math.max(ship.invulnerable, 240)
    }
    options.sound.play('level')
  }

  function defeatMoonBoss() {
    if (!moonBoss || moonDefeatedFrame !== null) return
    moonBoss = null
    moonDefeatedFrame = moonFrame()
    reefs.length = 0
    enemyShots.length = 0
    score += 3500
    for (const ship of ships.slice(0, activePlayers)) {
      ship.invulnerable = Math.max(ship.invulnerable, 240)
    }
    options.sound.play('level')
  }

  function setPlayers(requested: number) {
    activePlayers = addCoopSeats(ships, requested, createShip)
    for (let i = shots.length - 1; i >= 0; i--) {
      if (shots[i]!.seat >= activePlayers) shots.splice(i, 1)
    }
  }

  function spawn(
    kind:
      | PinkwakeEnemy
      | MoonjellyEnemy
      | TrenchEnemy
      | RosefinEnemy
      | WreckEnemy
      | ReefEnemy
      | GlassEnemy
      | PalaceEnemy,
    y?: number,
    wave: number | null = null,
  ) {
    if (wave !== null) {
      waveSpawned.set(wave, (waveSpawned.get(wave) ?? 0) + 1)
      waveLeft.set(wave, (waveLeft.get(wave) ?? 0) + 1)
    }
    reefs.push({
      x: W + 18,
      y: y ?? 40 + options.rng() * (H - 80),
      phase: wave === null ? options.rng() * Math.PI * 2 : wave * 0.9,
      health: Math.max(
        1,
        Math.round(
          coopEnemyHealth(BASE_HEALTH[kind] ?? 5, activePlayers) *
            level.craftHp,
        ),
      ),
      kind,
      fired: false,
      wave,
    })
  }

  /** A formation that loses no craft to escape or ramming pays a school bonus on its last kill. */
  function creditWave(reef: Reef) {
    if (reef.wave === null) return
    const left = (waveLeft.get(reef.wave) ?? 1) - 1
    waveLeft.set(reef.wave, left)
    const size =
      (reef.wave >= WRECK.waveBase
        ? reef.wave >= PALACE.waveBase
          ? PALACE_WAVE_SIZES[reef.wave - PALACE.waveBase]
          : reef.wave >= GLASS.waveBase
            ? GLASS_WAVE_SIZES[reef.wave - GLASS.waveBase]
            : reef.wave >= CROWN_REEF.waveBase
              ? CROWN_REEF_WAVE_SIZES[reef.wave - CROWN_REEF.waveBase]
              : WRECK_WAVE_SIZES[reef.wave - WRECK.waveBase]
        : reef.wave >= ROSEFIN.waveBase
          ? ROSEFIN_WAVE_SIZES[reef.wave - ROSEFIN.waveBase]
          : reef.wave >= TRENCH.waveBase
            ? TRENCH_WAVE_SIZES[reef.wave - TRENCH.waveBase]
            : reef.wave >= MOONJELLY.waveBase
              ? MOONJELLY_WAVE_SIZES[reef.wave - MOONJELLY.waveBase]
              : PINKWAKE_WAVE_SIZES[reef.wave]) ?? 0
    if (
      left > 0 ||
      size < RAINBOW_LANES.schoolSize ||
      waveSpawned.get(reef.wave) !== size ||
      brokenWaves.has(reef.wave)
    )
      return
    const bonus = size * RAINBOW_LANES.schoolBonusPerCraft
    score += bonus
    schoolBonuses++
    popups.push({ x: reef.x, y: reef.y, text: `SCHOOL +${bonus}`, age: 0 })
  }

  /** Remember the run as it stands when the Act clock reaches one of its checkpoints. */
  function passCheckpoint(
    act: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
    frame: number,
  ) {
    if (
      !(
        act === 1
          ? ACT_ONE_CHECKPOINTS
          : act === 2
            ? ACT_TWO_CHECKPOINTS
            : act === 3
              ? ACT_THREE_CHECKPOINTS
              : act === 4
                ? ACT_FOUR_CHECKPOINTS
                : act === 5
                  ? ACT_FIVE_CHECKPOINTS
                  : act === 6
                    ? ACT_SIX_CHECKPOINTS
                    : act === 7
                      ? ACT_SEVEN_CHECKPOINTS
                      : act === 8
                        ? ACT_EIGHT_CHECKPOINTS
                        : FINALE_CHECKPOINTS
      ).includes(frame)
    )
      return
    if (checkpoint.act === act && frame <= checkpoint.frame) return
    checkpoint = {
      act,
      frame,
      score,
      rescuedStation,
      rescuedNemi,
      trenchRoute,
      routeSettled,
      rescuedCourier,
      wreckRoute,
      wreckSettled,
      podsSaved,
      reefRoute,
      reefSettled,
      pylonsDown,
      rescuedNavigator,
      captivesFreed,
      schoolBonuses,
    }
    if (frame > 0) popups.push({ x: W / 2, y: 74, text: 'CHECKPOINT', age: 0 })
    if (frame === 0 && act >= 2) {
      awardMedal((act - 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8)
      if (act === 9) {
        const flags = palaceFlags()
        if (
          rescuedStation &&
          flags.rescuedNemi &&
          flags.rescuedCourier &&
          flags.freedDepot &&
          flags.stoppedRelay &&
          flags.rescuedNavigator &&
          flags.captivesFreed >= PALACE_CAPTIVES
        )
          earn('no-one-left')
      }
      // The demo keeps one too (the cabinet never stores a demo's), so the flythrough proves it.
      writeSave()
    }
  }

  /** Earn a mastery goal (once a game); the game announces it only the first time ever. */
  function earn(id: string) {
    if (earned.includes(id)) return
    earned.push(id)
    if (options.demo || options.mastery?.includes(id)) return
    const goal = RAINBOW_MASTERY.find((rung) => rung.id === id)
    if (goal)
      popups.push({ x: W / 2, y: 112, text: `MASTERY · ${goal.title}`, age: 0 })
  }

  /** An Act's medal: gold for no hits, silver for no continues, bronze for the clear. */
  function awardMedal(act: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9) {
    const medal = rainbowMedal(actHits, actContinues)
    medals[act] = medal
    actHits = 0
    actContinues = 0
    popups.push({
      x: W / 2,
      y: 96,
      text: `${ACT_NUMERALS[act - 1]} · ${medal.toUpperCase()} MEDAL`,
      age: 0,
    })
    if (act === 1) earn('first-light')
    if (medal === 'gold') earn('gold-wing')
  }

  /** Keep this Act start for the cabinet: the checkpoint, the difficulty, the guardians met and the medals. */
  function writeSave() {
    const met: RainbowSave['guardians'] = {}
    for (const act of [1, 2, 3, 4, 5, 6, 7, 8] as const)
      if (guardians[act] !== 'waiting')
        met[act] = guardians[act] as 'defeated' | 'escaped'
    saveRecord = {
      v: 1,
      difficulty,
      checkpoint: { ...checkpoint },
      guardians: met,
      medals: { ...medals },
    }
  }

  /**
   * Continue a saved flight: its difficulty, score, rescues, routes, guardians and medals, with every Act
   * before it flown and its own Act about to begin (its first update is its frame 0).
   */
  function continueFrom(save: RainbowSave) {
    difficulty = save.difficulty
    level = RAINBOW_DIFFICULTY[difficulty]
    for (const ship of ships) ship.lives = level.lives
    const c = save.checkpoint
    score = c.score
    rescuedStation = c.rescuedStation
    rescuedNemi = c.rescuedNemi
    trenchRoute = c.trenchRoute
    routeSettled = c.routeSettled
    rescuedCourier = c.rescuedCourier
    escortDone = c.act > 4
    wreckRoute = c.wreckRoute
    wreckSettled = c.wreckSettled
    podsSaved = c.podsSaved
    reefRoute = c.reefRoute
    reefSettled = c.reefSettled
    pylonsDown = c.pylonsDown
    rescuedNavigator = c.rescuedNavigator
    navigatorDone = c.act > 7
    captivesFreed = c.captivesFreed
    schoolBonuses = c.schoolBonuses
    for (const act of [1, 2, 3, 4, 5, 6, 7, 8] as const)
      guardians[act] =
        save.guardians[act] ?? (act < c.act ? 'escaped' : 'waiting')
    Object.assign(medals, save.medals)
    const n = c.act
    const start = (act: number) => (act < n ? 0 : act === n ? 1 : null)
    const beaten = (act: number) => (act < n ? 0 : null)
    defeatedAt = beaten(1)
    moonDefeatedFrame = beaten(2)
    trenchDefeatedFrame = beaten(3)
    rosefinDefeatedFrame = beaten(4)
    wreckDefeatedFrame = beaten(5)
    reefDefeatedFrame = beaten(6)
    glassDefeatedFrame = beaten(7)
    palaceDefeatedFrame = beaten(8)
    moonStart = start(2)
    trenchStart = start(3)
    rosefinStart = start(4)
    wreckStart = start(5)
    reefStart = start(6)
    glassStart = start(7)
    palaceStart = start(8)
    finaleStart = start(9)
    checkpoint = { ...c }
  }

  /**
   * Continue: rewind the Act clock to the last checkpoint so its authored waves replay, restore every
   * seated pilot, and put the score back where the checkpoint found it. A crew that falls after the boss
   * is already beaten keeps its clear and simply relaunches.
   */
  function resumeFromCheckpoint() {
    continueLeft = 0
    continues++
    actContinues++
    if (escapeFrame !== null) {
      restartEscape()
      return
    }
    const cleared =
      checkpoint.act === 1
        ? defeatedAt !== null
        : checkpoint.act === 2
          ? moonDefeatedFrame !== null
          : checkpoint.act === 3
            ? trenchDefeatedFrame !== null
            : checkpoint.act === 4
              ? rosefinDefeatedFrame !== null
              : checkpoint.act === 5
                ? wreckDefeatedFrame !== null
                : checkpoint.act === 6
                  ? reefDefeatedFrame !== null
                  : checkpoint.act === 7
                    ? glassDefeatedFrame !== null
                    : checkpoint.act === 8
                      ? palaceDefeatedFrame !== null
                      : choiceFrame !== null || finalChoice !== null
    if (!cleared) {
      const waves: ReadonlyArray<{ at: number }> =
        checkpoint.act === 1
          ? PINKWAKE_WAVES
          : checkpoint.act === 2
            ? MOONJELLY_WAVES
            : checkpoint.act === 3
              ? TRENCH_ALL_WAVES
              : checkpoint.act === 4
                ? ROSEFIN_WAVES
                : checkpoint.act === 5
                  ? WRECK_ALL_WAVES
                  : checkpoint.act === 6
                    ? CROWN_REEF_ALL_WAVES
                    : checkpoint.act === 7
                      ? GLASS_WAVES
                      : checkpoint.act === 8
                        ? PALACE_WAVES
                        : []
      const base =
        checkpoint.act === 1
          ? 0
          : checkpoint.act === 2
            ? MOONJELLY.waveBase
            : checkpoint.act === 3
              ? TRENCH.waveBase
              : checkpoint.act === 4
                ? ROSEFIN.waveBase
                : checkpoint.act === 5
                  ? WRECK.waveBase
                  : checkpoint.act === 6
                    ? CROWN_REEF.waveBase
                    : checkpoint.act === 7
                      ? GLASS.waveBase
                      : PALACE.waveBase
      waves.forEach((entry, index) => {
        const id = base + index
        if (entry.at >= checkpoint.frame) {
          waveSpawned.delete(id)
          waveLeft.delete(id)
          brokenWaves.delete(id)
        } else if ((waveLeft.get(id) ?? 0) > 0) brokenWaves.add(id)
      })
      tick = resumeTick(
        checkpoint,
        moonStart,
        trenchStart,
        rosefinStart,
        wreckStart,
        reefStart,
        glassStart,
        palaceStart,
        finaleStart,
      )
      // A guardian whose section lies after the checkpoint flies again; one already behind it does not.
      guardian = null
      // The finale has no guardian.
      if (
        checkpoint.act !== 9 &&
        checkpoint.frame <= guardianSections[checkpoint.act].from
      )
        guardians[checkpoint.act] = 'waiting'
      if (boss) bossCarryHp = boss.hp
      if (moonBoss) moonBossCarryHp = moonBoss.hp
      if (clawBoss) clawBossCarryHp = clawBoss.hp
      if (delphion) delphionCarryHp = delphion.hp
      if (sawtooth) sawtoothCarryHp = sawtooth.hp
      if (lanternRay) lanternRayCarryHp = lanternRay.hp
      if (glassEel) glassEelCarryHp = glassEel.hp
      if (leviathan) leviathanCarryHp = leviathan.hp
      if (crown) crownCarryHp = crown.hp
      boss = null
      moonBoss = null
      clawBoss = null
      delphion = null
      sawtooth = null
      lanternRay = null
      glassEel = null
      leviathan = null
      crown = null
      navigator = null
      escort = null
      survivors.length = 0
      station = null
      nemi = null
      score = checkpoint.score
      rescuedStation = checkpoint.rescuedStation
      rescuedNemi = checkpoint.rescuedNemi
      trenchRoute = checkpoint.trenchRoute
      routeSettled = checkpoint.routeSettled
      rescuedCourier = checkpoint.rescuedCourier
      // The escort replays when the checkpoint is before the pod set off.
      if (checkpoint.act === 4 && checkpoint.frame <= ROSEFIN_ESCORT.podAppears)
        escortDone = rescuedCourier
      wreckRoute = checkpoint.wreckRoute
      wreckSettled = checkpoint.wreckSettled
      podsSaved = checkpoint.podsSaved
      reefRoute = checkpoint.reefRoute
      reefSettled = checkpoint.reefSettled
      pylonsDown = checkpoint.pylonsDown
      rescuedNavigator = checkpoint.rescuedNavigator
      // The navigator drifts out again when the checkpoint is before the pod appeared.
      if (
        checkpoint.act === 7 &&
        checkpoint.frame <= GLASS_NAVIGATOR.podAppears
      )
        navigatorDone = rescuedNavigator
      captivesFreed = checkpoint.captivesFreed
      schoolBonuses = checkpoint.schoolBonuses
    }
    reefs.length = 0
    shots.length = 0
    enemyShots.length = 0
    pickups.length = 0
    bursts.length = 0
    popups.length = 0
    for (let seat = 0; seat < activePlayers; seat++) {
      Object.assign(ships[seat]!, createShip(seat), {
        invulnerable: RAINBOW_CONTINUE.invulnerableFrames,
      })
    }
    options.sound.play('level')
  }

  function defeatBoss() {
    if (!boss || defeatedAt !== null) return
    boss = null
    defeatedAt = tick
    enemyShots.length = 0
    reefs.length = 0
    score += 2500
    for (const ship of ships.slice(0, activePlayers))
      ship.invulnerable = Math.max(ship.invulnerable, 210)
    options.sound.play('level')
  }

  /** Each ship's focused weapon family (t-010): precise fire that trades away the spread. */
  function fireFocused(ship: Ship, seat: number) {
    const power = ship.power
    if (seat === 0) {
      // Petal Wing's Rose Needle: one fast needle, a twin from power 2.
      const { speed, damage, cooldown } = RAINBOW_FOCUS.needle
      for (const dy of power >= 2 ? [-2, 2] : [0])
        shots.push({
          x: ship.x + 15,
          y: ship.y + dy,
          vx: speed,
          vy: 0,
          seat,
          damage,
          kind: 'needle',
        })
      ship.cooldown = cooldown
    } else if (seat === 1) {
      // Prism Lance's Prism Thread: pierces craft, one more per power level.
      const { speed, damage, pierce, cooldown } = RAINBOW_FOCUS.thread
      shots.push({
        x: ship.x + 15,
        y: ship.y,
        vx: speed,
        vy: 0,
        seat,
        damage,
        kind: 'thread',
        pierce: pierce + power - 1,
      })
      ship.cooldown = cooldown
    } else if (seat === 2) {
      // Halo Fin's Halo Link: the orbit drones' shots cross on the line ahead; power 3 hits harder.
      const { speed, offset, crossAt, cooldown } = RAINBOW_FOCUS.link
      shots.push({
        x: ship.x + 15,
        y: ship.y,
        vx: speed,
        vy: 0,
        seat,
        damage: 1,
        kind: 'link',
      })
      for (const side of [-1, 1])
        shots.push({
          x: ship.x + 10,
          y: ship.y + side * offset,
          vx: speed,
          vy: (-side * offset * speed) / crossAt,
          seat,
          damage: power >= 3 ? 2 : 1,
          kind: 'link',
        })
      ship.cooldown = cooldown
    } else {
      // Comet Crown's Comet Arc: sparks thrown up and down that glance off the walls; power 3 hits harder.
      const { speed, rise, bounces, cooldown } = RAINBOW_FOCUS.arc
      shots.push({
        x: ship.x + 15,
        y: ship.y,
        vx: speed + 1,
        vy: 0,
        seat,
        damage: 1,
        kind: 'arc',
      })
      for (const side of power >= 2 ? [-1, 1] : [-1])
        shots.push({
          x: ship.x + 12,
          y: ship.y,
          vx: speed,
          vy: side * rise,
          seat,
          damage: power >= 3 ? 2 : 1,
          kind: 'arc',
          bounces,
        })
      ship.cooldown = cooldown
    }
  }

  function fire(ship: Ship, seat: number) {
    if (ship.focus) {
      fireFocused(ship, seat)
      return
    }
    const power = ship.power
    const speed = seat === 1 ? 10 : seat === 3 ? 9 : 8
    const damage = seat === 1 ? 2 : 1
    shots.push({ x: ship.x + 15, y: ship.y, vx: speed, vy: 0, seat, damage })
    if (!ship.focus && power >= 2) {
      const spread = seat === 0 ? 1.8 : 1.1
      shots.push({
        x: ship.x + 12,
        y: ship.y - 3,
        vx: 7.4,
        vy: -spread,
        seat,
        damage: 1,
      })
      shots.push({
        x: ship.x + 12,
        y: ship.y + 3,
        vx: 7.4,
        vy: spread,
        seat,
        damage: 1,
      })
    }
    if (power >= 3 && (seat === 2 || seat === 3)) {
      shots.push({
        x: ship.x + 10,
        y: ship.y - 10,
        vx: 8,
        vy: 0,
        seat,
        damage: 1,
      })
      shots.push({
        x: ship.x + 10,
        y: ship.y + 10,
        vx: 8,
        vy: 0,
        seat,
        damage: 1,
      })
    }
    ship.cooldown = ship.focus ? 8 : seat === 3 ? 7 : 11
  }

  function superAttack(seat: number) {
    const ship = ships[seat]!
    if (ship.charge < 100) return
    ship.charge = 0
    supers++
    bursts.push({ seat, x: ship.x, y: ship.y, age: 0 })
    enemyShots.length = 0
    if (boss && boss.frame > 85) {
      boss.hp -= seat === 1 ? 28 : 20
      if (boss.hp <= 0) defeatBoss()
    }
    if (moonBoss && moonBoss.frame > 85) {
      moonBoss.hp -= seat === 1 ? 28 : 20
      if (moonBoss.hp <= 0) defeatMoonBoss()
    }
    if (clawBoss && clawBoss.frame > 85) {
      clawBoss.hp -= seat === 1 ? 28 : 20
      if (clawBoss.hp <= 0) defeatClawBoss()
    }
    if (delphion && delphion.frame > 85) {
      delphion.hp -= seat === 1 ? 28 : 20
      if (delphion.hp <= 0) defeatDelphion()
    }
    if (sawtooth && sawtooth.frame > 85) {
      sawtooth.hp -= seat === 1 ? 28 : 20
      if (sawtooth.hp <= 0) defeatSawtooth()
    }
    if (lanternRay && lanternRay.frame > 85) {
      lanternRay.hp -= seat === 1 ? 28 : 20
      if (lanternRay.hp <= 0) defeatLanternRay()
    }
    if (glassEel && glassEel.frame > 85) {
      glassEel.hp -= seat === 1 ? 28 : 20
      if (glassEel.hp <= 0) defeatGlassEel()
    }
    if (leviathan && leviathan.frame > 85) {
      leviathan.hp -= seat === 1 ? 28 : 20
      if (leviathan.hp <= 0) defeatLeviathan()
    }
    if (crown && crown.frame > 85) {
      crown.hp -= seat === 1 ? 28 : 20
      if (crown.hp <= 0) subdueCrown()
    }
    if (guardian && guardian.frame > 60) {
      guardian.hp -= seat === 1 ? 28 : 20
      if (guardian.hp <= 0) defeatGuardian(seat)
    }
    for (let i = reefs.length - 1; i >= 0; i--) {
      const reef = reefs[i]!
      if (seat === 1 && reef.x < ship.x) continue
      if (reef.kind === 'captive') {
        freeCaptive(reef)
        continue
      }
      reef.health -= seat === 1 ? 8 : 5
      if (reef.health <= 0) defeat(i, seat)
    }
    if (seat === 2) {
      haloRevive(ships, activePlayers, seat)
      for (const ally of ships.slice(0, activePlayers)) {
        ally.shield = Math.min(3, ally.shield + 1)
        ally.invulnerable = Math.max(ally.invulnerable, 60)
      }
    }
    options.sound.play('extra')
  }

  function defeat(index: number, seat: number) {
    const reef = reefs[index]!
    reefs.splice(index, 1)
    score += reef.kind === 'urchin' ? 250 : 125
    if (reef.kind === 'pylon' && reefRoute === 'relay') {
      pylonsDown++
      popups.push({
        x: reef.x,
        y: reef.y,
        text: `PYLON ${pylonsDown}/${CROWN_REEF_PYLONS}`,
        age: 0,
      })
    }
    creditWave(reef)
    clearCount++
    const ship = ships[seat]!
    ship.charge = Math.min(
      100,
      ship.charge + (reef.kind === 'urchin' ? 24 : 12),
    )
    if (clearCount % 3 === 0) {
      const kinds: Pickup['kind'][] = ['power', 'shield', 'charge']
      pickups.push({
        x: reef.x,
        y: reef.y,
        kind: kinds[(clearCount / 3 - 1) % 3]!,
      })
    }
    options.sound.play('pop')
  }

  function fireEnemy(reef: Reef) {
    const active = availableCoopTargets(ships, activePlayers)
    if (!active.length) return
    const nearestShip = active.reduce(
      (best, ship) =>
        Math.abs(ship.y - reef.y) < Math.abs(best.y - reef.y) ? ship : best,
      active[0]!,
    )
    // During the escort the craft go for the courier pod whenever it is the nearer target.
    const target =
      escort && Math.abs(escort.y - reef.y) < Math.abs(nearestShip.y - reef.y)
        ? escort
        : nearestShip
    const dx = target.x - reef.x
    const dy = target.y - reef.y
    const length = Math.hypot(dx, dy) || 1
    if (reef.kind === 'dolphin') {
      // A three-pellet fan as the dive begins.
      const theta = Math.atan2(dy, dx)
      for (const spread of [-0.24, 0, 0.24])
        enemyShots.push({
          x: reef.x - 8,
          y: reef.y,
          vx: Math.cos(theta + spread) * 1.8,
          vy: Math.sin(theta + spread) * 1.8,
          grazed: 0,
        })
      return
    }
    if (reef.kind === 'courier') {
      // The dash drops a cargo mine that drifts with the current and bursts into a ring.
      enemyShots.push({
        x: reef.x,
        y: reef.y,
        vx: -0.6,
        vy: 0,
        grazed: 0,
        fuse: 70,
        burst: 'ring',
      })
      return
    }
    if (
      reef.kind === 'eel' ||
      reef.kind === 'cutter' ||
      reef.kind === 'scrap' ||
      reef.kind === 'gate' ||
      reef.kind === 'pylon' ||
      reef.kind === 'brood' ||
      reef.kind === 'captive'
    )
      return
    if (reef.kind === 'mirror') {
      // A solid three-pellet fan, and its reflection across the eel's line: the reflection is only light.
      const theta = Math.atan2(dy, dx)
      for (const ghost of [false, true])
        for (const spread of [-0.2, 0, 0.2]) {
          const angle = ghost ? -(theta + spread) : theta + spread
          enemyShots.push({
            x: reef.x - 8,
            y: reef.y,
            vx: Math.cos(angle) * 1.9,
            vy: Math.sin(angle) * 1.9,
            grazed: 0,
            ...(ghost ? { ghost: true } : {}),
          })
        }
      return
    }
    if (reef.kind === 'squid') {
      // A slow lens pellet that splits in three after a fixed delay.
      enemyShots.push({
        x: reef.x - 8,
        y: reef.y,
        vx: (dx / length) * 1.3,
        vy: (dy / length) * 1.3,
        grazed: 0,
        fuse: SQUID.splitFuse,
        burst: 'split',
      })
      return
    }
    if (reef.kind === 'harbinger') {
      // An old pattern each volley: a lane bolt down the marked line, then a ring bubble at the target.
      if ((reef.volleys ?? 0) % 2 === 0)
        enemyShots.push({
          x: reef.x - 12,
          y: reef.y,
          vx: -4.4,
          vy: 0,
          grazed: 0,
        })
      else
        enemyShots.push({
          x: reef.x - 10,
          y: reef.y,
          vx: (dx / length) * 1.15,
          vy: (dy / length) * 1.15,
          grazed: 0,
          fuse: 75,
          burst: 'ring',
        })
      return
    }
    if (reef.kind === 'prism') {
      // A refracted fan: three pellets toward the target, spread wide.
      const theta = Math.atan2(dy, dx)
      for (const spread of [-0.38, 0, 0.38])
        enemyShots.push({
          x: reef.x - 8,
          y: reef.y,
          vx: Math.cos(theta + spread) * 1.6,
          vy: Math.sin(theta + spread) * 1.6,
          grazed: 0,
        })
      return
    }
    if (reef.kind === 'drone') {
      enemyShots.push({
        x: reef.x - 6,
        y: reef.y,
        vx: (dx / length) * 2.3,
        vy: (dy / length) * 2.3,
        grazed: 0,
      })
      return
    }
    if (reef.kind === 'turret') {
      // A five-petal barrage at the target.
      const theta = Math.atan2(dy, dx)
      for (let i = -2; i <= 2; i++)
        enemyShots.push({
          x: reef.x - 6,
          y: reef.y - 8,
          vx: Math.cos(theta + i * 0.16) * 1.7,
          vy: Math.sin(theta + i * 0.16) * 1.7,
          grazed: 0,
        })
      return
    }
    if (reef.kind === 'bulwark') {
      // A slow upright barrier sweeping out of the open window.
      for (let row = -3; row <= 3; row++)
        enemyShots.push({
          x: reef.x - 10,
          y: reef.y + row * 12,
          vx: -1.15,
          vy: row * 0.06,
          grazed: 0,
        })
      return
    }
    if (reef.kind === 'hammerhead') {
      // A missile from each fin pod still attached, curling in from above and below.
      for (const [bit, side] of [
        [1, -1],
        [2, 1],
      ] as const) {
        if (!((reef.pods ?? 0) & bit)) continue
        const y = reef.y + side * HAMMERHEAD.podReach
        const theta = Math.atan2(target.y - y, target.x - reef.x)
        enemyShots.push({
          x: reef.x - 6,
          y,
          vx: Math.cos(theta - side * 0.18) * 1.75,
          vy: Math.sin(theta - side * 0.18) * 1.75,
          grazed: 0,
        })
      }
      return
    }
    if (reef.kind === 'salvager') {
      // Pellets along its four arms, on the diagonals.
      for (let arm = 0; arm < 4; arm++) {
        const theta = Math.PI / 4 + (arm * Math.PI) / 2
        enemyShots.push({
          x: reef.x,
          y: reef.y,
          vx: Math.cos(theta) * 1.6,
          vy: Math.sin(theta) * 1.6,
          grazed: 0,
        })
      }
      return
    }
    if (reef.kind === 'pistol') {
      enemyShots.push({
        x: reef.x - 8,
        y: reef.y,
        vx: (dx / length) * 1.15,
        vy: (dy / length) * 1.15,
        grazed: 0,
        fuse: 75,
        burst: 'ring',
      })
      return
    }
    if (reef.kind === 'angler') {
      // The lure drifts like a pickup and flashes its cross for its last 36 frames.
      enemyShots.push({
        x: reef.x - 8,
        y: reef.y,
        vx: -0.9,
        vy: 0,
        grazed: 0,
        fuse: 100,
        burst: 'cross',
      })
      return
    }
    if (reef.kind === 'skate') {
      // Aim at the pilot's reflection in the nearer wall, so the pellet glances off it once.
      const wall = target.y < H / 2 ? WALL_TOP : WALL_BOTTOM
      const mx = target.x - reef.x
      const my = 2 * wall - target.y - reef.y
      const reach = Math.hypot(mx, my) || 1
      enemyShots.push({
        x: reef.x - 8,
        y: reef.y,
        vx: (mx / reach) * 2.1,
        vy: (my / reach) * 2.1,
        grazed: 0,
        bounces: 1,
      })
      return
    }
    const vx = (dx / length) * 2.15
    const vy = (dy / length) * 2.15
    enemyShots.push({ x: reef.x - 8, y: reef.y, vx, vy, grazed: 0 })
    if (reef.kind === 'lantern') {
      const theta = Math.atan2(vy, vx)
      for (const spread of [-0.6, -0.3, 0.3, 0.6]) {
        enemyShots.push({
          x: reef.x - 8,
          y: reef.y,
          vx: Math.cos(theta + spread) * 1.65,
          vy: Math.sin(theta + spread) * 1.65,
          grazed: 0,
        })
      }
    } else if (reef.kind === 'relay') {
      enemyShots.push({
        x: reef.x - 8,
        y: reef.y,
        vx: vx * 0.7,
        vy: vy * 0.7 + 0.85,
        grazed: 0,
      })
    } else if (reef.kind === 'skimmer') {
      enemyShots.push({
        x: reef.x - 8,
        y: reef.y - 11,
        vx: -1.25,
        vy: 1.1,
        grazed: 0,
      })
    } else if (reef.kind === 'coral') {
      enemyShots.push({
        x: reef.x - 8,
        y: reef.y + 13,
        vx: -1.35,
        vy: -0.8,
        grazed: 0,
      })
    }
    if (reef.kind === 'spiral') {
      for (const offset of [-0.45, 0.45]) {
        const angle = Math.atan2(vy, vx) + offset
        enemyShots.push({
          x: reef.x - 8,
          y: reef.y,
          vx: Math.cos(angle) * 1.7,
          vy: Math.sin(angle) * 1.7,
          grazed: 0,
        })
      }
    }
    if (reef.kind === 'anchor') {
      enemyShots.push({ x: reef.x - 8, y: reef.y, vx: -0.75, vy: 0, grazed: 0 })
    }
    if (reef.kind === 'urchin') {
      enemyShots.push({
        x: reef.x - 8,
        y: reef.y,
        vx: vx * 0.9 - vy * 0.4,
        vy: vy * 0.9 + vx * 0.4,
        grazed: 0,
      })
      enemyShots.push({
        x: reef.x - 8,
        y: reef.y,
        vx: vx * 0.9 + vy * 0.4,
        vy: vy * 0.9 - vx * 0.4,
        grazed: 0,
      })
    }
  }

  /** Bring on the Act's guardian once its section opens, unless it was already destroyed or escaped. */
  function summonGuardian(
    act: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
    frame: number,
    section: RainbowGuardianSection,
  ) {
    if (guardian || guardians[act] !== 'waiting') return
    if (
      frame >= section.from &&
      frame < section.to - RAINBOW_GUARDIAN.escapeLead
    ) {
      guardian = createRainbowGuardian(section.kind, activePlayers)
      guardian.maxHp = guardian.hp = Math.max(
        1,
        Math.round(guardian.maxHp * level.bossHp),
      )
    }
  }

  function defeatGuardian(seat: number) {
    if (!guardian) return
    const { x, y } = guardian
    guardian = null
    const act = currentAct()
    // The finale has no guardian of its own.
    if (act !== 9) guardians[act] = 'defeated'
    if (Object.values(guardians).every((outcome) => outcome === 'defeated'))
      earn('guardian-breaker')
    // Like a boss, a destroyed guardian takes its pellets with it.
    enemyShots.length = 0
    score += RAINBOW_GUARDIAN.bonus
    const ship = ships[seat]
    if (ship) ship.charge = Math.min(100, ship.charge + 30)
    const kinds: Pickup['kind'][] = ['power', 'shield', 'charge']
    kinds.forEach((kind, i) =>
      pickups.push({ x: x - 12 + i * 12, y: y - 12 + i * 12, kind }),
    )
    options.sound.play('extra')
  }

  function hitShip(ship: Ship) {
    // The attract-mode flythrough must be able to reach its authored boss and
    // second Act rather than silently losing every autonomous pilot.
    if (options.demo || ship.invulnerable > 0) return
    actHits++
    ship.invulnerable = 90
    ship.shield--
    if (ship.shield <= 0) {
      ship.lives--
      ship.shield = 3
      ship.power = Math.max(1, ship.power - 1)
      if (
        !options.demo &&
        ships.slice(0, activePlayers).every((candidate) => candidate.lives <= 0)
      )
        continueLeft = RAINBOW_CONTINUE.countdownFrames
    }
    options.sound.play('pop')
  }

  function update(input: InputFrame, seated = [input]) {
    if (over) return
    if (resumeMenu) {
      // Up or down picks; A (after a beat, so the press that started the game doesn't choose) confirms.
      const keys = [input, ...seated]
      if (keys.some((frame) => frame?.pressed.up || frame?.pressed.down))
        resumeMenu.pick = resumeMenu.pick ? 0 : 1
      if (
        ++resumeMenu.frame > RESUME_MENU_GRACE &&
        keys.some((frame) => frame?.pressed.a)
      ) {
        const chosen = resumeMenu
        resumeMenu = null
        if (chosen.pick === 0) continueFrom(chosen.save)
        options.sound.play('blip')
      }
      return
    }
    // The whole crew is down: the world holds still while the CONTINUE? countdown runs.
    if (continueLeft > 0) {
      const waited =
        RAINBOW_CONTINUE.countdownFrames - continueLeft >= CONTINUE_GRACE_FRAMES
      if (waited && [input, ...seated].some((keys) => keys?.pressed.a))
        resumeFromCheckpoint()
      else if (--continueLeft === 0) over = true
      return
    }
    tick++
    for (let i = bursts.length - 1; i >= 0; i--)
      if (++bursts[i]!.age > BURST_FRAMES) bursts.splice(i, 1)
    for (let i = popups.length - 1; i >= 0; i--)
      if (++popups[i]!.age > POPUP_FRAMES) popups.splice(i, 1)
    if (
      moonStart === null &&
      defeatedAt !== null &&
      tick - defeatedAt >= PINKWAKE.aftermathFrames
    ) {
      moonStart = tick
      shots.length = 0
      pickups.length = 0
      station = null
    }
    if (
      trenchStart === null &&
      moonDefeatedFrame !== null &&
      moonFrame() - moonDefeatedFrame >= MOONJELLY.aftermathFrames
    ) {
      trenchStart = tick
      shots.length = 0
      pickups.length = 0
      nemi = null
    }
    if (
      wreckStart === null &&
      rosefinDefeatedFrame !== null &&
      rosefinFrame() - rosefinDefeatedFrame >= ROSEFIN.aftermathFrames
    ) {
      // ACT-STRUCTURE: the convoy leads directly into the wreckage.
      wreckStart = tick
      shots.length = 0
      pickups.length = 0
      escort = null
    }
    if (
      finaleStart === null &&
      palaceDefeatedFrame !== null &&
      palaceFrame() - palaceDefeatedFrame >= PALACE.aftermathFrames
    ) {
      // ACT-STRUCTURE: one authored safe transition from the palace straight into the finale.
      finaleStart = tick
      shots.length = 0
      pickups.length = 0
    }
    if (
      palaceStart === null &&
      glassDefeatedFrame !== null &&
      glassFrame() - glassDefeatedFrame >= GLASS.aftermathFrames
    ) {
      // ACT-STRUCTURE: the mirror corridor turns straight into the palace approach.
      palaceStart = tick
      shots.length = 0
      pickups.length = 0
    }
    if (
      glassStart === null &&
      reefDefeatedFrame !== null &&
      reefFrame() - reefDefeatedFrame >= CROWN_REEF.aftermathFrames
    ) {
      // ACT-STRUCTURE: reef glass refracts the fleet straight on into the Glass Current.
      glassStart = tick
      shots.length = 0
      pickups.length = 0
    }
    const rested = restingFrames()
    if (
      rested !== null &&
      (rested >= CROWN_REEF.restMaxFrames ||
        (rested >= CROWN_REEF.restMinFrames &&
          [input, ...seated].some((keys) => keys?.pressed.a)))
    )
      launchCrownReef()
    const docked = dockedFrames()
    if (
      docked !== null &&
      (docked >= ROSEFIN.dockMaxFrames ||
        (docked >= ROSEFIN.dockMinFrames &&
          [input, ...seated].some((keys) => keys?.pressed.a)))
    )
      launchRosefin()
    if (moonStart === null) {
      const stage = pinkwakeStage(tick, defeatedAt)
      if (defeatedAt === null) {
        passCheckpoint(1, tick)
        summonGuardian(1, tick, PINKWAKE_GUARDIAN)
      }
      if (stage === 'waves') {
        for (const entry of pinkwakeSpawns(tick)) {
          spawn(entry.kind, entry.y, entry.wave)
        }
        if (tick === PINKWAKE.stationAppears) station = { x: W + 18, y: 190 }
      } else if (stage === 'turn' && tick === PINKWAKE.turnStarts) {
        reefs.length = 0
        enemyShots.length = 0
      } else if (stage === 'boss' && !boss) {
        boss = createPinkwakeBoss(bossHp(BOSS_MAX_HP))
        if (bossCarryHp !== null) boss.hp = Math.min(boss.hp, bossCarryHp)
      }
    } else if (trenchStart === null) {
      const frame = moonFrame()
      const stage = moonjellyStage(frame, moonDefeatedFrame)
      if (moonDefeatedFrame === null) {
        passCheckpoint(2, frame)
        summonGuardian(2, frame, MOONJELLY_GUARDIAN)
      }
      if (stage === 'waves' || stage === 'remix') {
        for (const entry of moonjellySpawns(frame)) {
          spawn(entry.kind, entry.y, entry.wave)
        }
        if (frame === MOONJELLY.nemiAppears) {
          nemi = { x: W + 16, y: 158 }
        }
      } else if (
        (stage === 'turn' && frame === MOONJELLY.turnStarts) ||
        (stage === 'approach' && frame === MOONJELLY.approachStarts)
      ) {
        reefs.length = 0
        enemyShots.length = 0
      } else if (stage === 'boss' && !moonBoss && moonDefeatedFrame === null) {
        moonBoss = createMoonjellyBoss(bossHp(AURELIA_MAX_HP))
        if (moonBossCarryHp !== null)
          moonBoss.hp = Math.min(moonBoss.hp, moonBossCarryHp)
      }
    } else if (rosefinStart === null) {
      const frame = trenchFrame()
      const stage = trenchStage(frame, trenchDefeatedFrame)
      if (trenchDefeatedFrame === null) {
        // Route before checkpoint, so a checkpoint on the fork or rejoin frame keeps what it decided.
        if (frame === TRENCH_FORK.decideAt && trenchRoute === null)
          chooseTrenchRoute()
        if (
          frame === TRENCH_FORK.rejoinAt &&
          trenchRoute !== null &&
          !routeSettled
        )
          settleTrenchRoute()
        passCheckpoint(3, frame)
        summonGuardian(3, frame, TRENCH_GUARDIAN)
      }
      if (stage === 'waves') {
        for (const entry of trenchSpawns(frame, trenchRoute)) {
          spawn(entry.kind, entry.y, entry.wave)
        }
      } else if (stage === 'turn' && frame === TRENCH.turnStarts) {
        reefs.length = 0
        enemyShots.length = 0
      } else if (
        stage === 'boss' &&
        !clawBoss &&
        trenchDefeatedFrame === null
      ) {
        clawBoss = createClawburstBoss(bossHp(CLAWBURST_MAX_HP))
        if (clawBossCarryHp !== null)
          clawBoss.hp = Math.min(clawBoss.hp, clawBossCarryHp)
      }
    } else if (wreckStart === null) {
      const frame = rosefinFrame()
      const stage = rosefinStage(frame, rosefinDefeatedFrame)
      if (rosefinDefeatedFrame === null) {
        passCheckpoint(4, frame)
        summonGuardian(4, frame, ROSEFIN_GUARDIAN)
      }
      if (stage === 'waves') {
        for (const entry of rosefinSpawns(frame)) {
          spawn(entry.kind, entry.y, entry.wave)
        }
        if (frame === ROSEFIN_ESCORT.podAppears && !escortDone && !escort)
          escort = {
            x: W + 16,
            y: ROSEFIN_ESCORT.podY,
            hull: ROSEFIN_ESCORT.podHull,
          }
      } else if (stage === 'turn' && frame === ROSEFIN.turnStarts) {
        reefs.length = 0
        enemyShots.length = 0
      } else if (
        stage === 'boss' &&
        !delphion &&
        rosefinDefeatedFrame === null
      ) {
        delphion = createDelphionBoss(bossHp(DELPHION_MAX_HP))
        if (delphionCarryHp !== null)
          delphion.hp = Math.min(delphion.hp, delphionCarryHp)
      }
    } else if (reefStart === null) {
      const frame = wreckFrame()
      const stage = wreckStage(frame, wreckDefeatedFrame)
      if (wreckDefeatedFrame === null) {
        // Route before checkpoint, so a checkpoint on the fork or rejoin frame keeps what it decided.
        if (frame === WRECK_FORK.decideAt && wreckRoute === null)
          chooseWreckRoute()
        if (
          frame === WRECK_FORK.rejoinAt &&
          wreckRoute !== null &&
          !wreckSettled
        )
          settleWreckRoute()
        passCheckpoint(5, frame)
        summonGuardian(5, frame, WRECK_GUARDIAN)
      }
      if (stage === 'waves') {
        for (const entry of wreckSpawns(frame, wreckRoute)) {
          spawn(entry.kind, entry.y, entry.wave)
        }
        const pod = wreckPodFrames().indexOf(frame)
        if (wreckRoute === 'depot' && !wreckSettled && pod >= 0)
          survivors.push({ x: W + 14, y: 62 + ((pod * 37) % 90) })
      } else if (stage === 'turn' && frame === WRECK.turnStarts) {
        reefs.length = 0
        enemyShots.length = 0
      } else if (stage === 'boss' && !sawtooth && wreckDefeatedFrame === null) {
        sawtooth = createSawtoothBoss(bossHp(SAWTOOTH_MAX_HP))
        if (sawtoothCarryHp !== null)
          sawtooth.hp = Math.min(sawtooth.hp, sawtoothCarryHp)
      }
    } else if (glassStart === null) {
      const frame = reefFrame()
      const stage = reefStage(frame, reefDefeatedFrame)
      if (reefDefeatedFrame === null) {
        // Route before checkpoint, so a checkpoint on the fork or rejoin frame keeps what it decided.
        if (frame === CROWN_REEF_FORK.decideAt && reefRoute === null)
          chooseReefRoute()
        if (
          frame === CROWN_REEF_FORK.rejoinAt &&
          reefRoute !== null &&
          !reefSettled
        )
          settleReefRoute()
        passCheckpoint(6, frame)
        summonGuardian(6, frame, CROWN_REEF_GUARDIAN)
      }
      if (stage === 'waves') {
        for (const entry of reefSpawns(frame, reefRoute)) {
          spawn(entry.kind, entry.y, entry.wave)
        }
      } else if (stage === 'turn' && frame === CROWN_REEF.turnStarts) {
        reefs.length = 0
        enemyShots.length = 0
      } else if (
        stage === 'boss' &&
        !lanternRay &&
        reefDefeatedFrame === null
      ) {
        lanternRay = createLanternRayBoss(bossHp(LANTERN_RAY_MAX_HP))
        if (lanternRayCarryHp !== null)
          lanternRay.hp = Math.min(lanternRay.hp, lanternRayCarryHp)
      }
    } else if (palaceStart === null) {
      const frame = glassFrame()
      const stage = glassStage(frame, glassDefeatedFrame)
      if (glassDefeatedFrame === null) {
        passCheckpoint(7, frame)
        summonGuardian(7, frame, GLASS_GUARDIAN)
        if (
          frame === GLASS_NAVIGATOR.podAppears &&
          !navigatorDone &&
          !navigator
        )
          navigator = { x: W + 16, y: glassNavigatorY(frame) }
      }
      if (stage === 'waves') {
        for (const entry of glassSpawns(frame)) {
          spawn(entry.kind, entry.y, entry.wave)
        }
      } else if (stage === 'turn' && frame === GLASS.turnStarts) {
        reefs.length = 0
        enemyShots.length = 0
        navigator = null
      } else if (stage === 'boss' && !glassEel && glassDefeatedFrame === null) {
        glassEel = createGlassEelBoss(bossHp(GLASS_EEL_MAX_HP))
        if (glassEelCarryHp !== null)
          glassEel.hp = Math.min(glassEel.hp, glassEelCarryHp)
      }
    } else if (finaleStart === null) {
      const frame = palaceFrame()
      const stage = palaceStage(frame, palaceDefeatedFrame)
      if (palaceDefeatedFrame === null) {
        if (frame === PALACE.councilAt) convene()
        passCheckpoint(8, frame)
        summonGuardian(8, frame, PALACE_GUARDIAN)
      }
      if (stage === 'waves') {
        // Captives are not a school: they never count toward (or break) a formation bonus.
        for (const entry of palaceSpawns(frame)) {
          spawn(
            entry.kind,
            entry.y,
            entry.kind === 'captive' ? null : entry.wave,
          )
        }
      } else if (stage === 'turn' && frame === PALACE.turnStarts) {
        // Hostile craft clear for the approach; captives still drifting keep drifting.
        for (let i = reefs.length - 1; i >= 0; i--)
          if (reefs[i]!.kind !== 'captive') reefs.splice(i, 1)
        enemyShots.length = 0
      } else if (
        stage === 'boss' &&
        !leviathan &&
        palaceDefeatedFrame === null
      ) {
        leviathan = createPrismLeviathanBoss(bossHp(PRISM_LEVIATHAN_MAX_HP))
        if (leviathanCarryHp !== null)
          leviathan.hp = Math.min(leviathan.hp, leviathanCarryHp)
      }
    } else {
      const frame = finaleFrame()
      if (
        choiceFrame === null &&
        escapeFrame === null &&
        finalChoice === null
      ) {
        passCheckpoint(9, frame)
        if (frame >= FINALE.bossStarts && !crown) {
          crown = createEclipseCrownBoss(bossHp(ECLIPSE_CROWN_MAX_HP))
          if (crownCarryHp !== null) crown.hp = Math.min(crown.hp, crownCarryHp)
        }
      } else if (choiceFrame !== null) {
        // The final choice: nothing fires while the crew flies to its lane.
        for (const ship of livingShips())
          ship.invulnerable = Math.max(ship.invulnerable, 2)
        if (++choiceFrame >= FINALE.choiceFrames) {
          finalChoice = finaleChoiceFor(livingShips().map((ship) => ship.y))
          choiceFrame = null
          escapeFrame = 0
          popups.push({
            x: W / 2,
            y: 92,
            text: finalChoice.toUpperCase(),
            age: 0,
          })
          options.sound.play('extra')
        }
      } else if (escapeFrame !== null) {
        enemyShots.push(...eclipseEscapeWall(escapeFrame, W + 10))
        if (++escapeFrame >= ECLIPSE_ESCAPE.frames) {
          escapeFrame = null
          endingFrame = 0
          enemyShots.length = 0
          score += FINALE.completeScore
          awardMedal(9)
          earn('the-end')
          earn(`ending-${finalChoice ?? 'evacuate'}`)
          if (difficulty === 'hard') earn('ace-of-eclipse')
          // The campaign is over: there is no Act left to continue from.
          saveRecord = null
          for (const ship of ships.slice(0, activePlayers))
            ship.invulnerable = Math.max(ship.invulnerable, 99999)
          options.sound.play('level')
        }
      } else if (endingFrame !== null) {
        // The ending, then the credits, then THE END: A closes the run, or it closes by itself.
        endingFrame++
        const shown = endingFrame - FINALE_ENDING_FRAMES - FINALE.creditFrames
        if (
          shown >= FINALE.endHoldFrames ||
          (shown >= FINALE.endMinFrames &&
            [input, ...seated].some((keys) => keys?.pressed.a))
        )
          over = true
      }
    }

    for (let seat = 0; seat < activePlayers; seat++) {
      const ship = ships[seat]!
      const keys = seated[seat] ?? (options.demo || seat === 0 ? input : null)
      if (!keys) continue
      if (ship.lives <= 0) continue
      ship.focus = !options.demo && keys.held.b
      if (options.demo) {
        ship.y = 135 + Math.sin(tick / 33 + seat) * 56
        // At the Act III fork the attract demo shows both routes: odd crews fly up into the vault,
        // even crews down the safe passage, easing into the channel and back out after the choice.
        const fork = trenchStart === null ? -1 : trenchFrame()
        const lead = Math.min(
          fork - TRENCH_FORK.markFrom,
          TRENCH_FORK.decideAt + 60 - fork,
        )
        if (lead >= 0) {
          const lane =
            (activePlayers % 2 === 1 ? 88 : 182) +
            Math.sin(tick / 33 + seat) * 14
          ship.y += (lane - ship.y) * Math.min(1, lead / 60)
        }
        const wreck = wreckStart === null ? -1 : wreckFrame()
        const wreckLead = Math.min(
          wreck - WRECK_FORK.markFrom,
          (wreckRoute === 'depot' ? WRECK_FORK.rejoinAt : WRECK_FORK.decideAt) +
            60 -
            wreck,
        )
        if (wreckLead >= 0) {
          const lane =
            (activePlayers % 2 === 1 ? 92 : 182) +
            Math.sin(tick / 33 + seat) * (wreckRoute === 'depot' ? 34 : 14)
          ship.y += (lane - ship.y) * Math.min(1, wreckLead / 60)
        }
        const reef = reefStart === null ? -1 : reefFrame()
        const reefLead = Math.min(
          reef - CROWN_REEF_FORK.markFrom,
          CROWN_REEF_FORK.decideAt + 60 - reef,
        )
        if (reefLead >= 0) {
          const lane =
            (activePlayers % 2 === 1 ? 88 : 182) +
            Math.sin(tick / 33 + seat) * 14
          ship.y += (lane - ship.y) * Math.min(1, reefLead / 60)
        }
        if (navigator) {
          // The rescue is optional, so the demo shows both: odd crews meet the pod, even crews hug the
          // floor below the lowest point of its weave and let it drift past.
          const ease = Math.min(1, (W - navigator.x) / 120)
          const lane =
            activePlayers % 2 === 1 ? navigator.y + seat * 6 : 243 - seat * 4
          ship.y += (lane - ship.y) * ease
        }
        if (choiceFrame !== null) {
          // The attract demo shows every ending: one pilot restores, two evacuate, three sever.
          const lane =
            FINALE_LANES[
              (['restore', 'evacuate', 'sever'] as const)[
                (activePlayers - 1) % 3
              ]!
            ]
          ship.y +=
            (lane + (seat - 1.5) * 6 - ship.y) * Math.min(1, choiceFrame / 90)
        } else if (escapeFrame !== null) {
          // Fly the gap of the wall about to reach the ship, easing from the wall before it.
          const lead = (W + 10 - ship.x) / ECLIPSE_ESCAPE.wallSpeed
          const k = Math.max(
            0,
            Math.ceil((escapeFrame - lead) / ECLIPSE_ESCAPE.wallEvery),
          )
          const next = eclipseEscapeGapY(k * ECLIPSE_ESCAPE.wallEvery)
          const prev = eclipseEscapeGapY(
            Math.max(0, k - 1) * ECLIPSE_ESCAPE.wallEvery,
          )
          const t = Math.min(
            1,
            Math.max(
              0,
              1 -
                (k * ECLIPSE_ESCAPE.wallEvery + lead - escapeFrame) /
                  ECLIPSE_ESCAPE.wallEvery,
            ),
          )
          ship.y = prev + (next - prev) * t + (seat - 1.5) * 4
        }
        // Freeing captives is a choice too: odd crews line up on each collar, even crews fly past.
        const collar = reefs.find(
          (reef) => reef.kind === 'captive' && !reef.freed && reef.x < W - 40,
        )
        if (collar && activePlayers % 2 === 1) {
          const lane = collar.y - PALACE_CAPTIVE.collarOffset + seat * 4
          ship.y += (lane - ship.y) * Math.min(1, (W - 40 - collar.x) / 40)
        }
      } else {
        const dx = Number(keys.held.right) - Number(keys.held.left)
        const dy = Number(keys.held.down) - Number(keys.held.up)
        const length = Math.hypot(dx, dy) || 1
        const speed = ship.focus ? FOCUS_SPEED : SPEED
        ship.x = Math.max(20, Math.min(W - 40, ship.x + (dx / length) * speed))
        ship.y = Math.max(34, Math.min(H - 25, ship.y + (dy / length) * speed))
      }
      if (ship.cooldown > 0) ship.cooldown--
      if (ship.invulnerable > 0) ship.invulnerable--
      if ((options.demo || keys.held.a) && ship.cooldown === 0) fire(ship, seat)
      if (!options.demo && keys.pressed.b) superAttack(seat)
    }

    for (const shot of shots) {
      shot.x += shot.vx
      shot.y += shot.vy
      if (shot.bounces && (shot.y < WALL_TOP || shot.y > WALL_BOTTOM)) {
        shot.vy = -shot.vy
        shot.y = Math.max(WALL_TOP, Math.min(WALL_BOTTOM, shot.y))
        shot.bounces--
      }
    }
    for (const reef of reefs) {
      if (
        reef.kind === 'dolphin' ||
        reef.kind === 'courier' ||
        reef.kind === 'eel'
      ) {
        stepRosefinCraft(reef)
        continue
      }
      if (
        reef.kind === 'cutter' ||
        reef.kind === 'hammerhead' ||
        reef.kind === 'salvager' ||
        reef.kind === 'scrap'
      ) {
        stepWreckCraft(reef)
        continue
      }
      if (
        reef.kind === 'brood' ||
        reef.kind === 'drone' ||
        reef.kind === 'turret' ||
        reef.kind === 'bulwark' ||
        reef.kind === 'gate' ||
        reef.kind === 'pylon'
      ) {
        stepReefCraft(reef)
        continue
      }
      if (
        reef.kind === 'mirror' ||
        reef.kind === 'squid' ||
        reef.kind === 'harbinger' ||
        reef.kind === 'prism'
      ) {
        stepGlassCraft(reef)
        continue
      }
      if (reef.kind === 'captive') {
        // A captive drifts with the palace current; once freed it lifts away out of the fight.
        if (reef.freed) {
          reef.x -= 1.2
          reef.y -= 0.9
          if (reef.y < -30) reef.x = -40
        } else {
          reef.x -= PALACE_CAPTIVE.speed
          reef.y += Math.sin(tick / 50 + reef.phase) * 0.2
        }
        continue
      }
      reef.x -=
        reef.kind === 'clawstrike'
          ? 0.7
          : reef.kind === 'pistol'
            ? 0.95
            : reef.kind === 'angler'
              ? 0.8
              : reef.kind === 'skate'
                ? 1.35
                : reef.kind === 'anchor'
                  ? 0.65
                  : reef.kind === 'coral'
                    ? 0.8
                    : reef.kind === 'urchin'
                      ? 0.9
                      : 1.25
      // A clawstrike holds its lane steady so the mark it shows is the lane its bolt flies.
      if (reef.kind !== 'clawstrike')
        reef.y +=
          Math.sin(tick / (reef.kind === 'spiral' ? 14 : 24) + reef.phase) *
          (reef.kind === 'spiral' ? 1.3 : 0.55)
      if (!reef.fired && reef.x < W - 50) {
        reef.fired = true
        if (reef.kind === 'clawstrike') reef.charge = CLAWSTRIKE_CHARGE_FRAMES
        else fireEnemy(reef)
      } else if (
        reef.charge !== undefined &&
        reef.charge > 0 &&
        --reef.charge === 0
      )
        // The mark is drawn for the full 36 frames, then the bolt flies down it.
        enemyShots.push({
          x: reef.x - 10,
          y: reef.y,
          vx: -4.4,
          vy: 0,
          grazed: 0,
        })
    }
    if (boss) {
      enemyShots.push(...stepPinkwakeBoss(boss, ships.slice(0, activePlayers)))
    }
    const guardianAct = currentAct()
    if (guardian && guardianAct !== 9) {
      const act = guardianAct
      const section = guardianSections[act]
      const frame = actFrame(act)
      enemyShots.push(
        ...stepRainbowGuardian(
          guardian,
          ships.slice(0, activePlayers),
          frame >= section.to - RAINBOW_GUARDIAN.escapeLead,
        ),
      )
      if (rainbowGuardianGone(guardian)) {
        guardian = null
        guardians[act] = 'escaped'
      }
    }
    if (moonBoss) {
      enemyShots.push(
        ...stepMoonjellyBoss(moonBoss, ships.slice(0, activePlayers)),
      )
    }
    if (clawBoss) {
      enemyShots.push(
        ...stepClawburstBoss(clawBoss, ships.slice(0, activePlayers)),
      )
    }
    if (delphion) {
      enemyShots.push(
        ...stepDelphionBoss(delphion, ships.slice(0, activePlayers)),
      )
    }
    if (sawtooth) {
      enemyShots.push(
        ...stepSawtoothBoss(sawtooth, ships.slice(0, activePlayers)),
      )
      // Phase 2 calls a hammerhead escort above and below the Regent, never more than two at once.
      const escorts = reefs.filter(
        (reef) => reef.kind === 'hammerhead' && reef.wave === null,
      ).length
      for (const y of [70, 200].slice(
        0,
        Math.max(0, sawtooth.summon - escorts),
      ))
        spawn('hammerhead', y, null)
    }
    if (lanternRay) {
      enemyShots.push(
        ...stepLanternRayBoss(lanternRay, ships.slice(0, activePlayers)),
      )
      // Each surviving nursery launches an interceptor, never more than four at once.
      const drones = reefs.filter(
        (reef) => reef.kind === 'drone' && reef.wave === null,
      ).length
      for (const y of lanternRay.launches.slice(0, Math.max(0, 4 - drones)))
        spawn('drone', y, null)
    }
    if (glassEel) {
      enemyShots.push(
        ...stepGlassEelBoss(glassEel, ships.slice(0, activePlayers)),
      )
    }
    if (leviathan) {
      enemyShots.push(
        ...stepPrismLeviathanBoss(leviathan, ships.slice(0, activePlayers)),
      )
    }
    if (crown) {
      enemyShots.push(
        ...stepEclipseCrownBoss(crown, ships.slice(0, activePlayers)),
      )
    }
    if (navigator) {
      // The Lost Navigator's pod drifts out of the glass; touching it brings the navigator aboard.
      navigator.x -= GLASS_NAVIGATOR.podSpeed
      navigator.y = glassNavigatorY(glassFrame())
      if (navigator.x < -20) {
        navigator = null
        navigatorDone = true
      } else if (
        livingShips().some(
          (ship) =>
            Math.hypot(ship.x - navigator!.x, ship.y - navigator!.y) <
            GLASS_NAVIGATOR.podReach,
        )
      ) {
        popups.push({
          x: navigator.x,
          y: navigator.y,
          text: `NAVIGATOR ABOARD +${GLASS_NAVIGATOR.rescueScore}`,
          age: 0,
        })
        navigator = null
        navigatorDone = true
        rescuedNavigator = true
        score += GLASS_NAVIGATOR.rescueScore
        for (const ship of livingShips())
          ship.shield = Math.min(3, ship.shield + 1)
        options.sound.play('pickup')
      }
    }
    for (let i = survivors.length - 1; i >= 0; i--) {
      const pod = survivors[i]!
      pod.x -= 0.8
      if (pod.x < -16) survivors.splice(i, 1)
      else if (
        livingShips().some(
          (ship) => Math.hypot(ship.x - pod.x, ship.y - pod.y) < 24,
        )
      ) {
        survivors.splice(i, 1)
        podsSaved++
        popups.push({
          x: pod.x,
          y: pod.y,
          text: `SURVIVOR ${podsSaved}`,
          age: 0,
        })
        options.sound.play('pickup')
      }
    }
    if (escort) {
      // The courier pod rides the rails; shots that reach it wear its hull down.
      escort.x -= ROSEFIN_ESCORT.podSpeed
      escort.y = ROSEFIN_ESCORT.podY + Math.sin(rosefinFrame() / 40) * 14
      for (let bi = enemyShots.length - 1; bi >= 0; bi--) {
        const bullet = enemyShots[bi]!
        if (
          Math.hypot(bullet.x - escort.x, bullet.y - escort.y) <
          ROSEFIN_ESCORT.podRadius
        ) {
          enemyShots.splice(bi, 1)
          escort.hull--
        }
      }
      if (escort.hull <= 0) {
        popups.push({
          x: escort.x,
          y: escort.y,
          text: 'COURIER POD LOST',
          age: 0,
        })
        escort = null
        escortDone = true
        options.sound.play('pop')
      } else if (escort.x < -20) {
        escort = null
        escortDone = true
        rescuedCourier = true
        score += ROSEFIN_ESCORT.rescueScore
        for (const ship of ships.slice(0, activePlayers))
          ship.charge = Math.min(100, ship.charge + 20)
        popups.push({
          x: 60,
          y: ROSEFIN_ESCORT.podY,
          text: `COURIER SAFE +${ROSEFIN_ESCORT.rescueScore}`,
          age: 0,
        })
        options.sound.play('pickup')
      }
    }
    if (nemi) {
      nemi.x -= 0.95
      if (nemi.x < -16) nemi = null
      else if (
        ships
          .slice(0, activePlayers)
          .some(
            (ship) =>
              ship.lives > 0 &&
              Math.hypot(ship.x - nemi!.x, ship.y - nemi!.y) < 24,
          )
      ) {
        nemi = null
        rescuedNemi = true
        score += 750
        for (const ship of ships.slice(0, activePlayers)) {
          ship.charge = Math.min(100, ship.charge + 20)
        }
        options.sound.play('pickup')
      }
    }
    if (station) {
      station.x -= 0.75
      if (station.x < -18) station = null
      else if (
        ships
          .slice(0, activePlayers)
          .some(
            (ship) =>
              ship.lives > 0 &&
              Math.hypot(ship.x - station!.x, ship.y - station!.y) < 24,
          )
      ) {
        station = null
        rescuedStation = true
        score += 500
        for (const ship of ships.slice(0, activePlayers))
          ship.shield = Math.min(3, ship.shield + 1)
        options.sound.play('pickup')
      }
    }
    for (let bi = enemyShots.length - 1; bi >= 0; bi--) {
      const bullet = enemyShots[bi]!
      bullet.x += bullet.vx * level.bulletSpeed
      bullet.y += bullet.vy * level.bulletSpeed
      if (bullet.bounces && (bullet.y < WALL_TOP || bullet.y > WALL_BOTTOM)) {
        bullet.vy = -bullet.vy
        bullet.y = Math.max(WALL_TOP, Math.min(WALL_BOTTOM, bullet.y))
        bullet.bounces--
      }
      if (bullet.fuse !== undefined && --bullet.fuse <= 0) {
        enemyShots.splice(bi, 1)
        enemyShots.push(...burstShots(bullet))
      }
    }
    for (const pickup of pickups) pickup.x -= 0.8

    for (let si = shots.length - 1; si >= 0; si--) {
      const shot = shots[si]!
      if (shot.x > W + 15 || shot.y < 25 || shot.y > H + 10) {
        shots.splice(si, 1)
        continue
      }
      const captive = reefs.find(
        (reef) =>
          reef.kind === 'captive' &&
          !reef.freed &&
          Math.abs(reef.x - shot.x) < PALACE_CAPTIVE.hullHalfWidth &&
          shot.y >
            reef.y -
              PALACE_CAPTIVE.collarOffset -
              PALACE_CAPTIVE.collarRadius &&
          shot.y < reef.y + PALACE_CAPTIVE.hullHalfHeight,
      )
      if (captive) {
        shots.splice(si, 1)
        // Only the collar takes damage; the hull soaks every shot, so a captive is never harmed.
        if (
          Math.hypot(
            shot.x - captive.x,
            shot.y - (captive.y - PALACE_CAPTIVE.collarOffset),
          ) < PALACE_CAPTIVE.collarRadius
        ) {
          captive.health -= shot.damage
          if (captive.health <= 0) freeCaptive(captive)
        }
        continue
      }
      const hitIndex = reefs.findIndex((reef) =>
        shot.struck?.includes(reef) || reef.kind === 'captive'
          ? false
          : reef.kind === 'eel'
            ? Math.abs(reef.x - shot.x) < 8 &&
              Math.abs(reef.y - shot.y) < EEL.half + 6
            : Math.abs(reef.x - shot.x) < 14 &&
              Math.abs(reef.y - shot.y) <
                (reef.kind === 'hammerhead' ||
                reef.kind === 'scrap' ||
                reef.kind === 'bulwark' ||
                reef.kind === 'pylon'
                  ? 20
                  : 13),
      )
      if (hitIndex >= 0) {
        const reef = reefs[hitIndex]!
        // A Prism Thread passes through craft, but whatever soaks shots stops it like any other.
        const soaks =
          (reef.kind === 'eel' &&
            Math.abs(shot.y - reef.y) < EEL.half - EEL.endReach) ||
          reef.kind === 'scrap' ||
          reef.kind === 'gate' ||
          (reef.kind === 'bulwark' && !bulwarkOpen(reef))
        if (shot.pierce && !soaks) {
          shot.pierce--
          ;(shot.struck ??= []).push(reef)
        } else shots.splice(si, 1)
        // An eel's body soaks shots; only its bright ends take damage.
        if (
          reef.kind === 'eel' &&
          Math.abs(shot.y - reef.y) < EEL.half - EEL.endReach
        )
          continue
        // Wreck slabs soak every shot.
        if (reef.kind === 'scrap' || reef.kind === 'gate') continue
        // A closed bulwark shell soaks every shot.
        if (reef.kind === 'bulwark' && !bulwarkOpen(reef)) continue
        // A reef turret's stem breaks at double damage.
        if (reef.kind === 'turret' && shot.y > reef.y + 4) {
          reef.health -= shot.damage
          if (reef.health <= 0) {
            defeat(hitIndex, shot.seat)
            continue
          }
        }
        // A shot at a hammerhead's fin pod knocks that pod off instead of hurting the body.
        if (reef.kind === 'hammerhead') {
          const bit = shot.y < reef.y - 7 ? 1 : shot.y > reef.y + 7 ? 2 : 0
          if (bit && (reef.pods ?? 0) & bit) {
            reef.pods = (reef.pods ?? 0) & ~bit
            continue
          }
        }
        // A hit while a salvager's arms are out jams its grab.
        if (reef.kind === 'salvager' && reef.charge && reef.charge > 0)
          reef.jammed = true
        reef.health -= shot.damage * (dolphinStaggered(reef) ? 2 : 1)
        if (reef.health <= 0) defeat(hitIndex, shot.seat)
        continue
      }
      if (
        guardian &&
        Math.hypot(shot.x - guardian.x, shot.y - guardian.y) <
          RAINBOW_GUARDIAN.hitRadius
      ) {
        shots.splice(si, 1)
        guardian.hp -= shot.damage
        if (guardian.hp <= 0) defeatGuardian(shot.seat)
        continue
      }
      if (
        boss &&
        boss.frame > 85 &&
        Math.hypot(shot.x - (boss.x - 17), shot.y - boss.y) < 37
      ) {
        shots.splice(si, 1)
        boss.hp -= shot.damage
        if (boss.hp <= 0) defeatBoss()
      }
      if (
        moonBoss &&
        moonBoss.frame > 85 &&
        Math.hypot(shot.x - (moonBoss.x - 17), shot.y - moonBoss.y) < 43
      ) {
        shots.splice(si, 1)
        moonBoss.hp -= shot.damage
        if (moonBoss.hp <= 0) defeatMoonBoss()
      }
      if (
        clawBoss &&
        clawBoss.frame > 85 &&
        Math.hypot(shot.x - (clawBoss.x - 17), shot.y - clawBoss.y) < 40
      ) {
        shots.splice(si, 1)
        // The cracked cannon after a punch takes double damage.
        clawBoss.hp -= shot.damage * (clawburstExposed(clawBoss) ? 2 : 1)
        if (clawBoss.hp <= 0) defeatClawBoss()
        continue
      }
      if (delphion && delphion.frame > 85) {
        const core = delphionCore(delphion)
        const onCore =
          delphionExposed(delphion) &&
          Math.hypot(shot.x - core.x, shot.y - core.y) < DELPHION.coreRadius
        if (
          onCore ||
          delphionTwins(delphion).some(
            (twin) =>
              Math.hypot(shot.x - twin.x, shot.y - twin.y) <
              DELPHION.twinRadius,
          )
        ) {
          shots.splice(si, 1)
          // The exposed link core takes double damage.
          delphion.hp -= shot.damage * (onCore ? 2 : 1)
          if (delphion.hp <= 0) defeatDelphion()
          continue
        }
      }
      if (sawtooth && sawtooth.frame > 85) {
        const jaw = sawtoothJaw(sawtooth)
        const onJaw =
          sawtoothExposed(sawtooth) &&
          Math.hypot(shot.x - jaw.x, shot.y - jaw.y) < SAWTOOTH.jawRadius
        if (
          onJaw ||
          Math.hypot(shot.x - sawtooth.x, shot.y - sawtooth.y) <
            SAWTOOTH.bodyRadius
        ) {
          shots.splice(si, 1)
          // The open jaw hinge takes double damage.
          sawtooth.hp -= shot.damage * (onJaw ? 2 : 1)
          if (sawtooth.hp <= 0) defeatSawtooth()
          continue
        }
      }
      if (lanternRay && lanternRay.frame > 85) {
        const beacon = lanternRayBeacon(lanternRay)
        const onBeacon =
          lanternRayExposed(lanternRay) &&
          Math.hypot(shot.x - beacon.x, shot.y - beacon.y) <
            LANTERN_RAY.beaconRadius
        const nursery = lanternRayNurseries(lanternRay).findIndex(
          (wing, i) =>
            lanternRay!.nurseries[i]! > 0 &&
            Math.hypot(shot.x - wing.x, shot.y - wing.y) <
              LANTERN_RAY.nurseryRadius,
        )
        if (
          onBeacon ||
          nursery >= 0 ||
          Math.hypot(shot.x - lanternRay.x, shot.y - lanternRay.y) <
            LANTERN_RAY.bodyRadius
        ) {
          shots.splice(si, 1)
          // A nursery takes the hit (and the hull with it); the exposed beacon takes double.
          if (nursery >= 0) {
            lanternRay.nurseries[nursery] = Math.max(
              0,
              lanternRay.nurseries[nursery]! - shot.damage,
            )
            if (lanternRay.nurseries[nursery] === 0)
              popups.push({
                x: lanternRay.x,
                y: lanternRayNurseries(lanternRay)[nursery]!.y,
                text: 'NURSERY OPEN',
                age: 0,
              })
          }
          lanternRay.hp -= shot.damage * (onBeacon ? 2 : 1)
          if (lanternRay.hp <= 0) defeatLanternRay()
          continue
        }
      }
      // Only the outlined Glass Eel is solid: shots pass through its afterimages.
      if (
        glassEel &&
        glassEel.frame > 85 &&
        Math.hypot(shot.x - glassEel.x, shot.y - glassEel.y) <
          GLASS_EEL.bodyRadius
      ) {
        shots.splice(si, 1)
        glassEel.hp -= shot.damage * (glassEelExposed(glassEel) ? 2 : 1)
        if (glassEel.hp <= 0) defeatGlassEel()
        continue
      }
      if (crown && crown.frame > 85) {
        const onHeart =
          Math.hypot(shot.x - crown.heartX, shot.y - crown.heartY) <
          ECLIPSE_CROWN.heartRadius
        const onRing =
          Math.hypot(shot.x - crown.x, shot.y - crown.y) <
          ECLIPSE_CROWN.ringRadius
        if (onHeart || onRing) {
          shots.splice(si, 1)
          // While the heart is free, the crown's ring soaks every shot; only the heart takes damage.
          if (crown.phase === 1 || onHeart) {
            crown.hp -= shot.damage
            if (crown.hp <= 0) subdueCrown()
          }
          continue
        }
      }
      if (leviathan && leviathan.frame > 85) {
        const gem = prismLeviathanGem(leviathan)
        const onGem =
          prismLeviathanExposed(leviathan) &&
          Math.hypot(shot.x - gem.x, shot.y - gem.y) < PRISM_LEVIATHAN.gemRadius
        const lock = prismLeviathanLocks(leviathan).findIndex(
          (spire, i) =>
            leviathan!.locks[i]! > 0 &&
            Math.hypot(shot.x - spire.x, shot.y - spire.y) <
              PRISM_LEVIATHAN.lockRadius,
        )
        if (
          onGem ||
          lock >= 0 ||
          Math.hypot(shot.x - leviathan.x, shot.y - leviathan.y) <
            PRISM_LEVIATHAN.bodyRadius
        ) {
          shots.splice(si, 1)
          // A spire lock takes the hit (and the hull with it); the exposed gem takes double.
          if (lock >= 0) {
            leviathan.locks[lock] = Math.max(
              0,
              leviathan.locks[lock]! - shot.damage,
            )
            if (leviathan.locks[lock] === 0)
              popups.push({
                x: prismLeviathanLocks(leviathan)[lock]!.x,
                y: prismLeviathanLocks(leviathan)[lock]!.y - 8,
                text: `LOCK ${leviathan.locks.filter((l) => l === 0).length}/4 OPEN`,
                age: 0,
              })
          }
          leviathan.hp -= shot.damage * (onGem ? 2 : 1)
          if (leviathan.hp <= 0) defeatLeviathan()
          continue
        }
      }
    }

    for (let ei = reefs.length - 1; ei >= 0; ei--) {
      const reef = reefs[ei]!
      if (reef.x < -25) {
        if (reef.wave !== null) brokenWaves.add(reef.wave)
        reefs.splice(ei, 1)
        continue
      }
      if (reef.kind === 'captive') continue
      const ship = ships
        .slice(0, activePlayers)
        .find(
          (candidate) =>
            candidate.lives > 0 &&
            candidate.invulnerable === 0 &&
            (reef.kind === 'eel' && reef.charge === 0
              ? Math.abs(candidate.x - reef.x) < CORE_RADIUS + 5 &&
                Math.abs(candidate.y - reef.y) < EEL.half + CORE_RADIUS
              : Math.hypot(candidate.x - reef.x, candidate.y - reef.y) <
                CORE_RADIUS + 10),
        )
      if (ship) {
        if (reef.wave !== null) brokenWaves.add(reef.wave)
        reefs.splice(ei, 1)
        hitShip(ship)
      }
    }

    if (crown) {
      for (const ship of livingShips()) {
        if (
          ship.invulnerable === 0 &&
          (Math.hypot(ship.x - crown.x, ship.y - crown.y) <
            ECLIPSE_CROWN.ringRadius ||
            Math.hypot(ship.x - crown.heartX, ship.y - crown.heartY) <
              ECLIPSE_CROWN.heartRadius)
        )
          hitShip(ship)
      }
    }
    if (leviathan) {
      for (const ship of livingShips()) {
        if (
          ship.invulnerable === 0 &&
          Math.hypot(ship.x - leviathan.x, ship.y - leviathan.y) <
            PRISM_LEVIATHAN.bodyRadius
        )
          hitShip(ship)
      }
    }
    if (glassEel) {
      for (const ship of livingShips()) {
        if (
          ship.invulnerable === 0 &&
          Math.hypot(ship.x - glassEel.x, ship.y - glassEel.y) <
            GLASS_EEL.bodyRadius
        )
          hitShip(ship)
      }
    }
    if (lanternRay) {
      for (const ship of livingShips()) {
        if (
          ship.invulnerable === 0 &&
          Math.hypot(ship.x - lanternRay.x, ship.y - lanternRay.y) <
            LANTERN_RAY.bodyRadius
        )
          hitShip(ship)
      }
    }
    if (sawtooth) {
      for (const ship of livingShips()) {
        if (
          ship.invulnerable === 0 &&
          Math.hypot(ship.x - sawtooth.x, ship.y - sawtooth.y) <
            SAWTOOTH.bodyRadius
        )
          hitShip(ship)
      }
    }
    if (delphion) {
      for (const ship of ships.slice(0, activePlayers)) {
        if (
          ship.lives > 0 &&
          ship.invulnerable === 0 &&
          delphionTwins(delphion).some(
            (twin) =>
              Math.hypot(ship.x - twin.x, ship.y - twin.y) <
              DELPHION.twinRadius,
          )
        )
          hitShip(ship)
      }
    }
    if (guardian) {
      for (const ship of ships.slice(0, activePlayers)) {
        if (
          ship.lives > 0 &&
          ship.invulnerable === 0 &&
          Math.hypot(ship.x - guardian.x, ship.y - guardian.y) <
            RAINBOW_GUARDIAN.hitRadius
        )
          hitShip(ship)
      }
    }

    for (let bi = enemyShots.length - 1; bi >= 0; bi--) {
      const bullet = enemyShots[bi]!
      if (
        bullet.x < -12 ||
        bullet.x > W + 12 ||
        bullet.y < 22 ||
        bullet.y > H + 12
      ) {
        enemyShots.splice(bi, 1)
        continue
      }
      // A phantom pellet is only light: it neither hits nor grazes.
      if (bullet.ghost) continue
      let consumed = false
      for (let seat = 0; seat < activePlayers; seat++) {
        const ship = ships[seat]!
        if (ship.lives <= 0) continue
        const distance = Math.hypot(ship.x - bullet.x, ship.y - bullet.y)
        const contact = enemyBulletContact(
          distance,
          ship.invulnerable > 0,
          CORE_RADIUS + 3,
          GRAZE_RADIUS,
        )
        if (contact === 'hit') {
          hitShip(ship)
          enemyShots.splice(bi, 1)
          consumed = true
          break
        }
        if (contact === 'protected') {
          bullet.grazed |= 1 << seat
          continue
        }
        if (contact === 'graze' && (bullet.grazed & (1 << seat)) === 0) {
          bullet.grazed |= 1 << seat
          ship.graze++
          ship.charge = Math.min(100, ship.charge + 2)
          score += 5
        }
      }
      if (consumed) continue
    }

    for (let pi = pickups.length - 1; pi >= 0; pi--) {
      const pickup = pickups[pi]!
      if (pickup.x < -15) {
        pickups.splice(pi, 1)
        continue
      }
      const ship = ships
        .slice(0, activePlayers)
        .find(
          (candidate) =>
            candidate.lives > 0 &&
            Math.hypot(candidate.x - pickup.x, candidate.y - pickup.y) < 18,
        )
      if (!ship) continue
      pickups.splice(pi, 1)
      if (pickup.kind === 'power') ship.power = Math.min(3, ship.power + 1)
      else if (pickup.kind === 'shield')
        ship.shield = Math.min(3, ship.shield + 1)
      else ship.charge = Math.min(100, ship.charge + 35)
      score += 25
      options.sound.play('pickup')
    }
  }

  return {
    /** The score the cabinet records: scaled by difficulty, so every level shares one board. */
    get score() {
      return Math.round(score * level.score)
    },
    get level() {
      return currentAct()
    },
    get lives() {
      return ships
        .slice(0, activePlayers)
        .reduce((total, ship) => total + Math.max(0, ship.lives), 0)
    },
    get over() {
      return over
    },
    /** Mastery goals earned this game (t-010). */
    get mastered() {
      return options.demo ? [] : earned
    },
    /** The last Act start, for the cabinet to keep; null once the campaign is over. */
    get save() {
      return saveRecord
    },
    setPlayers,
    get snapshot(): RainbowCombatSnapshot {
      return {
        tick,
        score,
        ships: ships.slice(0, activePlayers).map((ship) => ({ ...ship })),
        activePlayers,
        shots: shots.map((shot) => ({ ...shot })),
        medals: { ...medals },
        earned: [...earned],
        difficulty,
        resumeMenu: resumeMenu ? resumeMenu.pick : null,
        enemies: reefs.map((reef) => ({ ...reef })),
        enemyShots: enemyShots.map((bullet) => ({ ...bullet })),
        pickups: pickups.map((pickup) => ({ ...pickup })),
        act: (
          [
            'S01',
            'S02',
            'S03',
            'S04',
            'S05',
            'S06',
            'S07',
            'S08',
            'S09',
          ] as const
        )[currentAct() - 1]!,
        stage:
          currentAct() === 1
            ? pinkwakeStage(tick, defeatedAt)
            : currentAct() === 2
              ? moonjellyStage(moonFrame(), moonDefeatedFrame)
              : currentAct() === 3
                ? trenchStage(trenchFrame(), trenchDefeatedFrame)
                : currentAct() === 4
                  ? rosefinStage(rosefinFrame(), rosefinDefeatedFrame)
                  : currentAct() === 5
                    ? wreckStage(wreckFrame(), wreckDefeatedFrame)
                    : currentAct() === 6
                      ? reefStage(reefFrame(), reefDefeatedFrame)
                      : currentAct() === 7
                        ? glassStage(glassFrame(), glassDefeatedFrame)
                        : currentAct() === 8
                          ? palaceStage(palaceFrame(), palaceDefeatedFrame)
                          : finaleStage(
                              finaleFrame(),
                              choiceFrame,
                              escapeFrame,
                              endingFrame,
                            ),
        sceneId:
          currentAct() === 1
            ? (pinkwakeScene(tick, defeatedAt)?.id ?? null)
            : currentAct() === 2
              ? (moonjellyScene(moonFrame(), moonDefeatedFrame)?.id ?? null)
              : currentAct() === 3
                ? (trenchScene(trenchFrame(), trenchDefeatedFrame)?.id ?? null)
                : currentAct() === 4
                  ? (rosefinScene(rosefinFrame(), rosefinDefeatedFrame)?.id ??
                    null)
                  : currentAct() === 5
                    ? (wreckScene(wreckFrame(), wreckDefeatedFrame)?.id ?? null)
                    : currentAct() === 6
                      ? (reefScene(reefFrame(), reefDefeatedFrame)?.id ?? null)
                      : currentAct() === 7
                        ? (glassScene(glassFrame(), glassDefeatedFrame)?.id ??
                          null)
                        : currentAct() === 8
                          ? (palaceScene(palaceFrame(), palaceDefeatedFrame)
                              ?.id ?? null)
                          : (finaleScene(
                              finaleFrame(),
                              choiceFrame,
                              escapeFrame,
                              endingFrame,
                            )?.id ?? null),
        boss: boss ? { ...boss } : null,
        moonBoss: moonBoss ? { ...moonBoss } : null,
        clawBoss: clawBoss ? { ...clawBoss } : null,
        delphion: delphion ? { ...delphion } : null,
        sawtooth: sawtooth ? { ...sawtooth } : null,
        lanternRay: lanternRay
          ? { ...lanternRay, nurseries: [...lanternRay.nurseries] }
          : null,
        glassEel: glassEel
          ? { ...glassEel, ghosts: [...glassEel.ghosts] }
          : null,
        leviathan: leviathan
          ? { ...leviathan, locks: [...leviathan.locks] }
          : null,
        crown: crown ? { ...crown } : null,
        guardian: guardian ? { ...guardian } : null,
        guardians: { ...guardians },
        rescuedNemi,
        trenchRoute,
        securedSalvage: trenchRoute === 'vault' && routeSettled,
        actTwoFrame: moonFrame(),
        actThreeFrame: trenchFrame(),
        actFourFrame: rosefinFrame(),
        actFiveFrame: wreckFrame(),
        actSixFrame: reefFrame(),
        resting: restingFrames(),
        reefRoute,
        pylonsDown,
        stoppedRelay:
          reefRoute === 'relay' &&
          reefSettled &&
          pylonsDown >= CROWN_REEF_PYLONS,
        actSevenFrame: glassFrame(),
        navigator: navigator ? { ...navigator } : null,
        rescuedNavigator,
        actEightFrame: palaceFrame(),
        captivesFreed,
        allies: palaceAllies(palaceFlags()),
        finaleFrame: finaleFrame(),
        choiceFrame,
        escapeFrame,
        endingFrame,
        finalChoice,
        wreckRoute,
        podsSaved,
        survivors: survivors.map((pod) => ({ ...pod })),
        freedDepot:
          wreckRoute === 'depot' &&
          wreckSettled &&
          podsSaved >= WRECK_FORK.podsToFree,
        docked: dockedFrames(),
        escort: escort ? { ...escort } : null,
        rescuedCourier,
        rescuedStation,
        defeatedAt,
        schoolBonuses,
        checkpoint: { ...checkpoint },
        continueLeft,
        continues,
      }
    },
    update,
    render(g: CanvasRenderingContext2D) {
      const sky = g.createLinearGradient(0, 0, 0, H)
      const palette = [
        ['#100d40', '#6d427e', '#ed9dbb'],
        ['#072f50', '#357a91', '#ae9fe3'],
        ['#0b0626', '#2a1a55', '#7a2f52'],
        ['#160a3a', '#4f2470', '#c9649e'],
        ['#140a24', '#4a2440', '#b86a78'],
        ['#160f08', '#5a4016', '#b8863e'],
        ['#06101e', '#1f3a5e', '#8fb8d9'],
        ['#0a0418', '#3a1450', '#c9708e'],
        ['#05030f', '#24083a', '#6a2a6a'],
      ][currentAct() - 1]!
      sky.addColorStop(0, palette[0]!)
      sky.addColorStop(0.55, palette[1]!)
      sky.addColorStop(1, palette[2]!)
      g.fillStyle = sky
      g.fillRect(0, 0, W, H)
      for (let plane = 0; plane < 4; plane++) {
        g.fillStyle = ['#f2d6ff88', '#9ffffa44', '#fff5c444', '#ffe6f277'][
          plane
        ]!
        const speed = [0.15, 0.34, 0.72, 1.3][plane]!
        for (let i = 0; i < 16; i++) {
          const x =
            (((i * (47 + plane * 8) - tick * speed) % (W + 65)) + W + 65) %
            (W + 65)
          const y = 36 + ((i * 73 + plane * 29) % (H - 65))
          g.beginPath()
          g.ellipse(x, y, 2 + plane * 1.5, 1.3 + plane, 0, 0, Math.PI * 2)
          g.fill()
        }
      }
      g.fillStyle = '#f6c4e655'
      for (let i = 0; i < 6; i++) {
        const x = ((((i * 108 - tick * 0.28) % 640) + 640) % 640) - 60
        g.beginPath()
        g.ellipse(x, 244 + Math.sin(i) * 12, 56, 25, 0, 0, Math.PI * 2)
        g.fill()
      }
      if (finaleStart !== null) {
        // The machine nerve halo: slow stained-glass rings turning behind the Crown, and crown fragments.
        const frame = finaleFrame()
        g.save()
        g.translate(352, 135)
        for (let ring = 0; ring < 3; ring++) {
          const radius = 70 + ring * 38
          const turn = (frame / (400 + ring * 200)) * (ring % 2 ? -1 : 1)
          for (let pane = 0; pane < 12; pane++) {
            const from = turn + (pane / 12) * Math.PI * 2
            g.strokeStyle = ['#ff9fd855', '#9fd8ff44', '#ffd27a44'][
              (pane + ring) % 3
            ]!
            g.lineWidth = 10 - ring * 2
            g.beginPath()
            g.arc(0, 0, radius, from + 0.04, from + Math.PI / 6 - 0.04)
            g.stroke()
          }
        }
        g.restore()
        g.fillStyle = '#ffd27a55'
        for (let i = 0; i < 10; i++) {
          const x = ((((i * 97 - frame * 0.9) % 560) + 560) % 560) - 40
          const y = 40 + ((i * 59) % 200)
          g.beginPath()
          g.moveTo(x, y - 5)
          g.lineTo(x + 4, y + 4)
          g.lineTo(x - 4, y + 4)
          g.closePath()
          g.fill()
        }
      } else if (palaceStart !== null) {
        // Eclipse Palace: an eclipsed sun with a corona, and heart spires climbing past.
        const frame = palaceFrame()
        g.save()
        const corona = g.createRadialGradient(360, 78, 36, 360, 78, 70)
        corona.addColorStop(0, '#fff2b8')
        corona.addColorStop(0.25, '#ffb35acc')
        corona.addColorStop(1, '#ff5ac800')
        g.fillStyle = corona
        g.globalAlpha = 0.8 + 0.2 * Math.sin(frame / 40)
        g.beginPath()
        g.arc(360, 78, 70, 0, Math.PI * 2)
        g.fill()
        g.globalAlpha = 1
        g.fillStyle = '#0a0418'
        g.beginPath()
        g.arc(360, 78, 38, 0, Math.PI * 2)
        g.fill()
        g.restore()
        for (let plane = 0; plane < 2; plane++) {
          const speed = 0.25 + plane * 0.35
          g.fillStyle = ['#5a2a6a66', '#8a3a7a88'][plane]!
          for (let i = 0; i < 4; i++) {
            const x =
              ((((i * 190 + plane * 70 - frame * speed) % 760) + 760) % 760) -
              100
            const tall = 90 + ((i * 37 + plane * 23) % 60) + plane * 20
            g.beginPath()
            g.moveTo(x - 12, H)
            g.lineTo(x, H - tall)
            g.lineTo(x + 12, H)
            g.closePath()
            g.fill()
            // A heart glow at the spire's tip.
            g.fillStyle = '#ff9fd8'
            g.globalAlpha = 0.5 + 0.3 * Math.sin(frame / 20 + i)
            g.beginPath()
            g.arc(x, H - tall + 8, 3, 0, Math.PI * 2)
            g.fill()
            g.globalAlpha = 1
            g.fillStyle = ['#5a2a6a66', '#8a3a7a88'][plane]!
          }
        }
      } else if (glassStart !== null) {
        // Glass Current: crystalline strata as slanted shards, and beams fracturing across the canyon.
        const frame = glassFrame()
        for (let plane = 0; plane < 3; plane++) {
          const speed = 0.18 + plane * 0.3
          g.fillStyle = ['#bfe6ff22', '#d8c4ff33', '#f0faff44'][plane]!
          for (let i = 0; i < 5; i++) {
            const x =
              ((((i * 150 + plane * 55 - frame * speed) % 750) + 750) % 750) -
              100
            const top = i % 2 === 0
            const y = top ? 30 : H
            const reach = 60 + plane * 18 + ((i * 23) % 30)
            g.beginPath()
            g.moveTo(x, y)
            g.lineTo(x + 26 + plane * 8, y)
            g.lineTo(x + 10, top ? y + reach : y - reach)
            g.closePath()
            g.fill()
          }
        }
        g.save()
        g.strokeStyle = '#e8f6ff'
        g.lineWidth = 1
        for (let i = 0; i < 4; i++) {
          const x = ((((i * 170 - frame * 0.6) % 680) + 680) % 680) - 100
          g.globalAlpha = 0.18 + 0.12 * Math.sin(frame / 30 + i * 2)
          g.beginPath()
          g.moveTo(x, 40)
          g.lineTo(x + 70, 135)
          g.lineTo(x + 30, 230)
          g.stroke()
        }
        g.restore()
      } else if (reefStart !== null) {
        // Crown Reef: gold nebula, coral megastructure arches and bioluminescent motes.
        const frame = reefFrame()
        for (let plane = 0; plane < 3; plane++) {
          const speed = 0.14 + plane * 0.24
          g.strokeStyle = ['#ffd27a40', '#ffb35a66', '#ff9fd888'][plane]!
          g.lineWidth = 6 + plane * 3
          for (let i = 0; i < 3; i++) {
            const x =
              ((((i * 260 + plane * 90 - frame * speed) % 780) + 780) % 780) -
              120
            const r = 70 + plane * 22 + ((i * 31) % 30)
            g.beginPath()
            g.arc(x, H + 10, r, Math.PI, 2 * Math.PI)
            g.stroke()
          }
        }
        g.fillStyle = '#c7ffe6'
        for (let i = 0; i < 18; i++) {
          const x = ((((i * 61 - frame * 0.4) % 520) + 520) % 520) - 20
          const y = 50 + ((i * 47) % 170) + Math.sin(frame / 50 + i) * 6
          g.globalAlpha = 0.35 + 0.3 * Math.sin(frame / 25 + i * 1.3)
          g.fillRect(x, y, 2, 2)
        }
        g.globalAlpha = 1
      } else if (wreckStart !== null) {
        // Blossom Wreckyard: petal-hull wreck slabs at three depths and dock cranes against a rust sky.
        const frame = wreckFrame()
        for (let plane = 0; plane < 3; plane++) {
          const speed = 0.15 + plane * 0.25
          g.fillStyle = ['#3a1c3a88', '#5a2a48aa', '#2a1028cc'][plane]!
          for (let i = 0; i < 4; i++) {
            const x =
              ((((i * 173 + plane * 57 - frame * speed) % 720) + 720) % 720) -
              100
            const top = H - 60 - ((i * 41 + plane * 23) % 70) - plane * 14
            g.beginPath()
            g.moveTo(x, H)
            g.lineTo(x + 8, top + 12)
            g.quadraticCurveTo(x + 40, top - 18, x + 74, top + 6)
            g.lineTo(x + 92, H)
            g.closePath()
            g.fill()
          }
        }
        g.strokeStyle = '#ffb3c855'
        g.lineWidth = 2
        for (let i = 0; i < 3; i++) {
          const x = ((((i * 230 - frame * 0.3) % 690) + 690) % 690) - 60
          g.beginPath()
          g.moveTo(x, H - 40)
          g.lineTo(x, 70)
          g.lineTo(x + 70, 70)
          g.lineTo(x + 70, 92)
          g.stroke()
        }
      } else if (rosefinStart !== null) {
        // Rosefin Express: aurora ribbons overhead and light rails whose markers race past faster in a surge.
        const frame = rosefinFrame()
        const speed = rosefinSpeed(frame)
        for (let band = 0; band < 3; band++) {
          g.strokeStyle = ['#ff9fd855', '#9ff3ff44', '#ffd36e3a'][band]!
          g.lineWidth = 12 - band * 3
          g.beginPath()
          for (let x = 0; x <= W; x += 20) {
            const y = 58 + band * 30 + Math.sin(x / 70 + frame / 90 + band) * 12
            if (x === 0) g.moveTo(x, y)
            else g.lineTo(x, y)
          }
          g.stroke()
        }
        for (let rail = 0; rail < 3; rail++) {
          const y = [118, 170, 214][rail]!
          g.strokeStyle = '#ffb3e660'
          g.lineWidth = 1.5
          g.beginPath()
          g.moveTo(0, y)
          g.lineTo(W, y)
          g.stroke()
          g.fillStyle = '#fff0fbcc'
          for (let i = 0; i < 8; i++) {
            const x =
              ((((i * 70 - frame * (1.2 + rail * 0.4) * speed) % 560) + 560) %
                560) -
              40
            g.fillRect(x, y - 1, 10 + (speed - 1) * 30, 2)
          }
        }
      } else if (trenchStart !== null) {
        // Chromatic Trench: indigo void, rock ribs and volcanic vents breathing heat.
        const frame = trenchFrame()
        for (let plane = 0; plane < 3; plane++) {
          const speed = 0.18 + plane * 0.3
          g.fillStyle = ['#3a225c88', '#4b2a6aaa', '#2a1440cc'][plane]!
          for (let i = 0; i < 5; i++) {
            const x =
              ((((i * 137 + plane * 41 - frame * speed) % 700) + 700) % 700) -
              90
            const height = 70 + ((i * 53 + plane * 31) % 60) + plane * 18
            g.beginPath()
            g.moveTo(x, H)
            g.lineTo(x + 22, H - height)
            g.lineTo(x + 48, H - height + 18)
            g.lineTo(x + 70, H)
            g.closePath()
            g.fill()
          }
        }
        for (let i = 0; i < 4; i++) {
          const x = ((((i * 160 - frame * 0.55) % 640) + 640) % 640) - 40
          const glow = 0.35 + 0.25 * Math.sin(frame / 20 + i * 1.7)
          g.fillStyle = `rgba(255, 140, 90, ${glow.toFixed(3)})`
          g.beginPath()
          g.ellipse(x, H - 30, 10, 60, 0, 0, Math.PI * 2)
          g.fill()
        }
      }
      if (moonStart !== null && trenchStart === null) {
        for (let plane = 0; plane < 4; plane++) {
          const speed = 0.12 + plane * 0.21
          g.lineWidth = 1 + plane * 0.8
          g.strokeStyle = ['#f1b9fc55', '#a6ffe766', '#ecdbff88', '#bdf9ff99'][
            plane
          ]!
          g.fillStyle = ['#ebbeff25', '#b8ffef30', '#d1d0ff38', '#bbf6ff48'][
            plane
          ]!
          for (let i = 0; i < 6; i++) {
            const x =
              ((((i * 111 - moonFrame() * speed) % 650) + 650) % 650) - 42
            const y = 45 + ((i * 73 + plane * 39) % 170)
            g.beginPath()
            g.ellipse(
              x,
              y,
              18 + plane * 5,
              9 + plane * 2,
              0,
              Math.PI,
              2 * Math.PI,
            )
            g.fill()
            g.stroke()
            for (let arm = -2; arm <= 2; arm++) {
              g.beginPath()
              g.moveTo(x + arm * 6, y)
              g.quadraticCurveTo(
                x + arm * 7 + Math.sin(moonFrame() / 45 + i + arm) * 6,
                y + 21,
                x + arm * 8,
                y + 29 + plane * 4,
              )
              g.stroke()
            }
          }
        }
      }
      // Near coral plane: keyed painted strip along the floor, behind every enemy, shot and ship.
      g.save()
      g.globalAlpha = 0.92
      drawRainbowStageStrip(
        g,
        (
          [
            's01',
            's02',
            's03',
            's04',
            's05',
            's06',
            's07',
            's08',
            's08',
          ] as const
        )[currentAct() - 1]!,
        actFrame(currentAct()) * STRIP_SPEED,
        H - STRIP_HEIGHT,
        STRIP_HEIGHT,
        W,
      )
      g.restore()
      for (const reef of reefs) {
        if (reef.kind !== 'clawstrike' || !reef.charge) continue
        g.save()
        g.strokeStyle = '#ffb38a'
        g.globalAlpha =
          0.45 + 0.4 * (1 - reef.charge / CLAWSTRIKE_CHARGE_FRAMES)
        g.lineWidth = 2
        g.setLineDash([6, 5])
        g.beginPath()
        g.moveTo(reef.x - 12, reef.y)
        g.lineTo(0, reef.y)
        g.stroke()
        g.restore()
      }
      for (const reef of reefs) {
        if (reef.kind !== 'eel') continue
        // The eel's barrier: dashed while it lights, then live current between two bright ends.
        const live = reef.charge === 0
        g.save()
        g.strokeStyle = live ? '#9ff3ff' : '#d8fbff'
        g.globalAlpha = live ? 0.85 + 0.15 * Math.sin(tick / 2) : 0.55
        g.lineWidth = live ? 3 : 2
        if (!live) g.setLineDash([5, 4])
        g.beginPath()
        g.moveTo(reef.x, reef.y - EEL.half)
        for (let k = 1; k <= 6; k++)
          g.lineTo(
            reef.x + (live ? Math.sin(tick + k * 2) * 2.5 : 0),
            reef.y - EEL.half + (k * EEL.half) / 3,
          )
        g.stroke()
        g.setLineDash([])
        g.globalAlpha = 1
        g.fillStyle = '#fffbd6'
        g.shadowColor = '#9ff3ff'
        g.shadowBlur = 12
        for (const end of [-1, 1]) {
          g.beginPath()
          g.arc(reef.x, reef.y + end * EEL.half, 5, 0, Math.PI * 2)
          g.fill()
        }
        g.restore()
      }
      for (const reef of reefs) {
        if (reef.kind === 'cutter' && reef.charge && reef.dive === undefined) {
          // The locked lane, marked for the whole jaw warning.
          g.save()
          g.strokeStyle = '#ff9e9e'
          g.globalAlpha = 0.6
          g.lineWidth = 2
          g.setLineDash([7, 5])
          g.beginPath()
          g.moveTo(reef.x - 16, reef.homeY!)
          g.lineTo(0, reef.homeY!)
          g.stroke()
          g.restore()
        }
        if (reef.kind === 'salvager' && reef.charge) {
          // Four arms point along the diagonals they will fire down.
          g.save()
          g.strokeStyle = reef.jammed ? '#8a7a9a' : '#ffd36e'
          g.globalAlpha = 0.7
          g.lineWidth = 2
          for (let arm = 0; arm < 4; arm++) {
            const theta = Math.PI / 4 + (arm * Math.PI) / 2
            g.beginPath()
            g.moveTo(reef.x, reef.y)
            g.lineTo(
              reef.x + Math.cos(theta) * 34,
              reef.y + Math.sin(theta) * 34,
            )
            g.stroke()
          }
          g.restore()
        }
        if (reef.kind === 'captive') {
          g.save()
          g.translate(reef.x, reef.y)
          if (reef.freed) {
            // A freed captive glows as it lifts away.
            g.globalAlpha = 0.85
            g.shadowColor = '#ff9fd8'
            g.shadowBlur = 14
          }
          // The painted hull when it has loaded; until then a simple whale shape.
          if (!drawRainbowEnemySprite(g, 'captive', 1400)) {
            g.fillStyle = reef.freed ? '#fff0fa' : '#b9b3cf'
            g.strokeStyle = reef.freed ? '#ff9fd8' : '#5a4a7a'
            g.lineWidth = 2
            g.beginPath()
            g.ellipse(0, 0, 20, 11, 0, 0, Math.PI * 2)
            g.fill()
            g.stroke()
            g.beginPath()
            g.moveTo(17, 0)
            g.lineTo(28, -8)
            g.lineTo(28, 8)
            g.closePath()
            g.fill()
            g.stroke()
            g.fillStyle = '#1b163e'
            g.beginPath()
            g.arc(-11, -2, 2, 0, Math.PI * 2)
            g.fill()
          }
          g.shadowBlur = 0
          if (!reef.freed) {
            // The chain up to the collar, and the collar itself: the only part to shoot.
            g.strokeStyle = '#8a7aa8'
            g.lineWidth = 1.5
            g.setLineDash([3, 2])
            g.beginPath()
            g.moveTo(0, -11)
            g.lineTo(
              0,
              -PALACE_CAPTIVE.collarOffset + PALACE_CAPTIVE.collarRadius,
            )
            g.stroke()
            g.setLineDash([])
            g.strokeStyle = '#ff5ac8'
            g.lineWidth = 3
            g.globalAlpha = 0.75 + 0.25 * Math.sin(tick / 6)
            g.beginPath()
            g.arc(
              0,
              -PALACE_CAPTIVE.collarOffset,
              PALACE_CAPTIVE.collarRadius - 2,
              0,
              Math.PI * 2,
            )
            g.stroke()
          }
          g.restore()
          continue
        }
        if (reef.kind === 'prism') {
          // A prism pylon: a tall crystal that glows before it refracts its fan.
          const glow = (reef.dive ?? 0) % PRISM.cycle >= PRISM.glowFrom
          g.save()
          g.translate(reef.x, reef.y)
          g.fillStyle = '#bfe6ffcc'
          g.strokeStyle = glow ? '#fffbb6' : '#e8f6ff'
          g.lineWidth = glow ? 3 : 1.5
          g.beginPath()
          g.moveTo(0, -22)
          g.lineTo(10, 0)
          g.lineTo(0, 22)
          g.lineTo(-10, 0)
          g.closePath()
          g.fill()
          g.stroke()
          g.fillStyle = '#ffffff'
          g.globalAlpha = 0.5 + (glow ? 0.4 * Math.sin(tick / 3) : 0)
          g.beginPath()
          g.moveTo(0, -14)
          g.lineTo(4, 0)
          g.lineTo(0, 14)
          g.closePath()
          g.fill()
          g.restore()
          continue
        }
        if (reef.kind === 'gate' || reef.kind === 'pylon') {
          g.save()
          g.translate(reef.x, reef.y)
          if (reef.kind === 'gate') {
            // A coral gate pillar.
            g.fillStyle = '#c4566e'
            g.strokeStyle = '#ffd27a'
            g.lineWidth = 1.5
            g.beginPath()
            g.roundRect(-9, -16, 18, 32, 7)
            g.fill()
            g.stroke()
            g.fillStyle = '#ff9fd8'
            g.beginPath()
            g.arc(0, -8, 3, 0, Math.PI * 2)
            g.arc(2, 6, 2.5, 0, Math.PI * 2)
            g.fill()
          } else {
            // A relay pylon, its signal light pulsing.
            g.fillStyle = '#4a3a6a'
            g.strokeStyle = '#ffd27a'
            g.lineWidth = 2
            g.beginPath()
            g.moveTo(-8, 18)
            g.lineTo(-3, -16)
            g.lineTo(3, -16)
            g.lineTo(8, 18)
            g.closePath()
            g.fill()
            g.stroke()
            g.fillStyle = '#ffd27a'
            g.globalAlpha = 0.6 + 0.4 * Math.sin(tick / 6)
            g.beginPath()
            g.arc(0, -19, 5, 0, Math.PI * 2)
            g.fill()
          }
          g.restore()
          continue
        }
        if (reef.kind !== 'scrap') continue
        g.save()
        g.translate(reef.x, reef.y)
        g.rotate(Math.sin(reef.phase) + tick / 200)
        g.fillStyle = '#5e4a66'
        g.strokeStyle = '#ffc6d9'
        g.lineWidth = 1.5
        g.beginPath()
        g.moveTo(-15, -8)
        g.lineTo(-4, -14)
        g.lineTo(13, -9)
        g.lineTo(16, 6)
        g.lineTo(2, 14)
        g.lineTo(-13, 9)
        g.closePath()
        g.fill()
        g.stroke()
        g.fillStyle = '#ff9fc4'
        g.beginPath()
        g.ellipse(-3, -2, 5, 3, 0.6, 0, Math.PI * 2)
        g.fill()
        g.restore()
      }
      for (const reef of reefs) {
        if (
          reef.kind === 'scrap' ||
          reef.kind === 'gate' ||
          reef.kind === 'pylon' ||
          reef.kind === 'prism' ||
          reef.kind === 'captive'
        )
          continue
        if (
          reef.kind === 'harbinger' &&
          reef.charge &&
          (reef.volleys ?? 0) % 2 === 0
        ) {
          // The lane its bolt will fly down is marked for the whole warm-up.
          g.save()
          g.strokeStyle = '#ffb38a'
          g.globalAlpha = 0.6
          g.lineWidth = 2
          g.setLineDash([6, 5])
          g.beginPath()
          g.moveTo(reef.x - 18, reef.y)
          g.lineTo(0, reef.y)
          g.stroke()
          g.restore()
        }
        g.save()
        g.translate(reef.x, reef.y)
        if (reef.kind === 'eel') g.rotate(-Math.PI / 2)
        if (reef.kind === 'brood') g.scale(1.6, 1.6)
        if (reef.kind === 'drone') g.scale(0.65, 0.65)
        g.shadowColor = reef.kind === 'urchin' ? '#ffe38a' : '#ffa3e6'
        g.shadowBlur = 12
        g.fillStyle =
          reef.kind === 'urchin'
            ? '#ffd38a'
            : reef.kind === 'anchor'
              ? '#ffb3d1'
              : reef.kind === 'spiral'
                ? '#94e7ff'
                : reef.kind === 'lantern'
                  ? '#afffea'
                  : reef.kind === 'relay'
                    ? '#f9a8e9'
                    : reef.kind === 'skimmer'
                      ? '#f9e7af'
                      : reef.kind === 'coral'
                        ? '#e4c0ff'
                        : '#d09ffd'
        if (
          !drawRainbowEnemySprite(g, reef.kind) &&
          !(reef.kind === 'drone' && drawRainbowEnemySprite(g, 'skimmer'))
        ) {
          g.beginPath()
          g.ellipse(
            0,
            0,
            reef.kind === 'urchin' ? 14 : 16,
            10,
            0,
            0,
            Math.PI * 2,
          )
          g.fill()
          g.fillStyle = '#fce7ff'
          g.beginPath()
          g.ellipse(-6, -2, 6, 4, 0, 0, Math.PI * 2)
          g.fill()
          g.strokeStyle = '#b5fbff'
          g.lineWidth = 3
          g.beginPath()
          g.moveTo(9, -5)
          g.quadraticCurveTo(23, -15, 17, -22)
          g.stroke()
        }
        if (reef.kind === 'mirror') {
          // The solid eel is outlined; its reflection never is.
          g.strokeStyle = '#ffffff'
          g.lineWidth = 1.5
          g.beginPath()
          g.ellipse(0, 0, 17, 11, 0, 0, Math.PI * 2)
          g.stroke()
        }
        if (reef.kind === 'squid' && reef.charge) {
          // The lens glint before it fires.
          g.fillStyle = '#ffffff'
          g.globalAlpha = 0.6 + 0.4 * Math.sin(reef.charge / 2)
          g.beginPath()
          g.arc(
            -8,
            -4,
            3 + (1 - reef.charge / SQUID.glintFrames) * 4,
            0,
            Math.PI * 2,
          )
          g.fill()
          g.globalAlpha = 1
        }
        if (reef.kind === 'harbinger' && reef.charge) {
          // The crown prism warms.
          g.strokeStyle = '#fffbb6'
          g.lineWidth = 2.5
          g.globalAlpha = 0.6 + 0.4 * Math.sin(reef.charge / 3)
          g.beginPath()
          g.arc(
            0,
            -10,
            6 + (1 - reef.charge / HARBINGER.warmFrames) * 6,
            0,
            Math.PI * 2,
          )
          g.stroke()
          g.globalAlpha = 1
        }
        if (reef.kind === 'brood' && reef.charge) {
          // The wing shadow before the drones launch.
          g.fillStyle = '#100820'
          g.globalAlpha = 0.5
          g.beginPath()
          g.ellipse(0, 4, 26, 12, 0, 0, Math.PI * 2)
          g.fill()
          g.globalAlpha = 1
        }
        if (reef.kind === 'turret' && reef.charge) {
          // The flower unfolds over the warning.
          const open = 1 - reef.charge / TURRET.unfoldFrames
          g.fillStyle = '#ffb3e6'
          for (let petal = 0; petal < 5; petal++) {
            const theta = (petal / 5) * Math.PI * 2
            g.beginPath()
            g.ellipse(
              Math.cos(theta) * 6 * open,
              -10 + Math.sin(theta) * 6 * open,
              4,
              2 + 3 * open,
              theta,
              0,
              Math.PI * 2,
            )
            g.fill()
          }
        }
        if (reef.kind === 'bulwark' && reef.dive !== undefined) {
          const cycle = reef.dive % BULWARK.cycle
          if (cycle >= BULWARK.glowFrom) {
            // The shell glows before the window opens, and the spiral eye shows while it is open.
            g.strokeStyle = cycle >= BULWARK.openFrom ? '#ff7ad9' : '#fff49c'
            g.lineWidth = 2.5
            g.beginPath()
            g.arc(-4, 0, cycle >= BULWARK.openFrom ? 9 : 14, 0, Math.PI * 2)
            g.stroke()
          }
        }
        if (reef.kind === 'hammerhead') {
          // The fin pods still attached; they glow while they lock.
          for (const [bit, side] of [
            [1, -1],
            [2, 1],
          ] as const) {
            if (!((reef.pods ?? 3) & bit)) continue
            g.fillStyle = reef.charge ? '#fff49c' : '#9fd8ff'
            g.beginPath()
            g.arc(-2, side * HAMMERHEAD.podReach, 4, 0, Math.PI * 2)
            g.fill()
          }
        }
        if (reef.kind === 'cutter' && reef.charge && reef.dive === undefined) {
          // The jaws open twice during the warning.
          if (Math.floor(reef.charge / 9) % 2 === 1) {
            g.fillStyle = '#ff5f7e'
            g.beginPath()
            g.moveTo(-16, 0)
            g.lineTo(-4, -6)
            g.lineTo(-4, 6)
            g.closePath()
            g.fill()
          }
        }
        if (reef.kind === 'dolphin' && reef.charge) {
          // Twin beacons pulse for the whole warning before the dive.
          g.fillStyle = '#fff49c'
          g.globalAlpha = 0.6 + 0.4 * Math.sin(reef.charge / 2)
          for (const side of [-1, 1]) {
            g.beginPath()
            g.arc(2, side * 9 - 6, 3.5, 0, Math.PI * 2)
            g.fill()
          }
          g.globalAlpha = 1
        } else if (dolphinStaggered(reef)) {
          g.strokeStyle = '#fff49c'
          g.lineWidth = 2
          g.beginPath()
          g.arc(0, 0, 17 + Math.sin(tick / 3) * 2, 0, Math.PI * 2)
          g.stroke()
        } else if (reef.kind === 'courier' && reef.charge) {
          // The cargo light flickers before the dash.
          if (Math.floor(reef.charge / 5) % 2 === 0) {
            g.fillStyle = '#ffd36e'
            g.shadowColor = '#ffd36e'
            g.shadowBlur = 14
            g.beginPath()
            g.arc(-2, -4, 5, 0, Math.PI * 2)
            g.fill()
          }
        }
        g.restore()
      }
      for (const pod of survivors) {
        g.save()
        g.translate(pod.x, pod.y)
        g.shadowColor = '#c7ffe6'
        g.shadowBlur = 14
        g.fillStyle = '#1f4a4a'
        g.strokeStyle = '#c7ffe6'
        g.lineWidth = 2
        g.beginPath()
        g.arc(0, 0, 11, 0, Math.PI * 2)
        g.fill()
        g.stroke()
        g.shadowBlur = 0
        g.fillStyle = '#eafff6'
        g.font = 'bold 7px monospace'
        g.textAlign = 'center'
        g.fillText('SOS', 0, 3)
        g.restore()
      }
      if (escort) {
        g.save()
        g.translate(escort.x, escort.y)
        g.shadowColor = '#ffd9f2'
        g.shadowBlur = 16
        g.fillStyle = '#ffd1ec'
        g.strokeStyle = '#7a2f6b'
        g.lineWidth = 2
        g.beginPath()
        g.ellipse(0, 0, 18, 10, 0, 0, Math.PI * 2)
        g.fill()
        g.stroke()
        g.shadowBlur = 0
        g.fillStyle = '#7a2f6b'
        for (const x of [-8, 0, 8]) {
          g.beginPath()
          g.arc(x, -1, 2.4, 0, Math.PI * 2)
          g.fill()
        }
        g.fillStyle = '#240c42'
        g.fillRect(-15, -18, 30, 4)
        g.fillStyle = '#9fffcf'
        g.fillRect(-14, -17, (28 * escort.hull) / ROSEFIN_ESCORT.podHull, 2)
        g.font = 'bold 7px monospace'
        g.textAlign = 'center'
        g.fillStyle = '#fff0fb'
        g.fillText('COURIER', 0, 20)
        g.restore()
      }
      if (nemi) {
        g.save()
        g.translate(nemi.x, nemi.y)
        g.shadowColor = '#a7ffdf'
        g.shadowBlur = 18
        g.fillStyle = '#173f53'
        g.strokeStyle = '#e0ffbc'
        g.lineWidth = 3
        g.beginPath()
        g.arc(0, 0, 15, 0, 2 * Math.PI)
        g.fill()
        g.stroke()
        g.shadowBlur = 0
        g.fillStyle = '#f1ffda'
        g.font = 'bold 9px monospace'
        g.textAlign = 'center'
        g.fillText('NEMI', 0, 3)
        g.restore()
      }
      if (guardian) {
        g.save()
        g.translate(guardian.x, guardian.y)
        if (
          rainbowGuardianMarksLanes(guardian) &&
          rainbowGuardianWarning(guardian)
        ) {
          // Every lane it will fire down is marked for the whole charge.
          g.save()
          g.strokeStyle = '#ffb38a'
          g.globalAlpha = 0.6
          g.lineWidth = 2
          g.setLineDash([6, 5])
          for (const lane of guardian.lanes) {
            g.beginPath()
            g.moveTo(-18, lane - guardian.y)
            g.lineTo(-guardian.x, lane - guardian.y)
            g.stroke()
          }
          g.restore()
        }
        if (!drawRainbowGuardianSprite(g, guardian.kind)) {
          g.save()
          g.scale(2.3, 2.3)
          // The Herald is a harbinger grown huge until its own picture lands.
          if (
            !drawRainbowEnemySprite(
              g,
              guardian.kind === 'herald' ? 'harbinger' : guardian.kind,
            )
          ) {
            g.fillStyle =
              guardian.kind === 'urchin'
                ? '#d09ffd'
                : guardian.kind === 'lantern'
                  ? '#afffea'
                  : guardian.kind === 'courier'
                    ? '#ffd1ec'
                    : guardian.kind === 'mirror'
                      ? '#c9f2ff'
                      : '#ff9e7a'
            g.beginPath()
            g.arc(0, 0, 11, 0, Math.PI * 2)
            g.fill()
          }
          g.restore()
        }
        // Same charge cue as the bosses: a pulsing ring that never fades below three quarters.
        if (rainbowGuardianWarning(guardian)) {
          g.strokeStyle = '#fffbb6'
          g.lineWidth = 4
          g.globalAlpha = 0.75 + 0.25 * Math.sin(guardian.frame / 3)
          g.beginPath()
          g.arc(0, 0, RAINBOW_GUARDIAN.hitRadius + 6, 0, Math.PI * 2)
          g.stroke()
          g.globalAlpha = 1
        }
        g.fillStyle = '#240c42'
        g.fillRect(-26, -42, 52, 6)
        g.fillStyle = '#ffe58a'
        g.fillRect(-25, -41, 50 * Math.max(0, guardian.hp / guardian.maxHp), 4)
        g.restore()
      }
      if (station) {
        g.save()
        g.translate(station.x, station.y)
        g.strokeStyle = '#b3ffdf'
        g.fillStyle = '#163b46'
        g.lineWidth = 3
        g.beginPath()
        g.arc(0, 0, 16, 0, Math.PI * 2)
        g.fill()
        g.stroke()
        g.font = 'bold 9px monospace'
        g.fillStyle = '#b3ffdf'
        g.textAlign = 'center'
        g.fillText('SOS', 0, 3)
        g.restore()
      }
      if (boss) {
        g.save()
        g.translate(boss.x, boss.y)
        const glow = bossTelegraph(boss)
        g.shadowColor = glow ? '#fff7a7' : '#ffaff1'
        g.shadowBlur = glow ? 25 : 9
        // The painted seahorse carries the escape pod in its coil; the vector body carries it at its belly.
        const painted = drawRainbowBossSprite(g, 'b01', boss.phase, -10, 0, 116)
        const pod = painted ? { x: 23, y: 2, rx: 11, ry: 13 } : null
        if (painted) {
          g.shadowBlur = 0
          // The ring pulses but never fades below half strength, so a phone-sized canvas still shows it.
          if (glow) {
            g.strokeStyle = '#fffbb6'
            g.lineWidth = 4
            g.globalAlpha = 0.75 + 0.25 * Math.sin(boss.frame / 3)
            g.beginPath()
            g.arc(-17, 0, 41, 0, Math.PI * 2)
            g.stroke()
            g.globalAlpha = 1
          }
        } else {
          g.fillStyle = boss.phase === 3 ? '#c791ff' : '#ffd0ef'
          g.beginPath()
          g.ellipse(0, 0, 38, 49, -0.2, 0, Math.PI * 2)
          g.fill()
          g.strokeStyle = glow ? '#fffbb6' : '#724aab'
          g.lineWidth = glow ? 5 : 3
          g.beginPath()
          g.moveTo(12, -32)
          g.quadraticCurveTo(-54, -72, -41, -22)
          g.quadraticCurveTo(-12, 1, -30, 42)
          g.quadraticCurveTo(-10, 70, 15, 40)
          g.stroke()
          g.shadowBlur = 0
          g.fillStyle = '#3d205a'
          g.beginPath()
          g.arc(-16, -19, 6, 0, Math.PI * 2)
          g.fill()
        }
        const {
          x: podX,
          y: podY,
          rx,
          ry,
        } = pod ?? {
          x: -9,
          y: 16,
          rx: 13,
          ry: 19,
        }
        g.fillStyle = '#e2fff6'
        g.beginPath()
        g.ellipse(podX, podY, rx, ry, -0.1, 0, Math.PI * 2)
        g.fill()
        g.strokeStyle = '#5bdac8'
        g.lineWidth = 2
        g.stroke()
        g.fillStyle = '#3d8b94'
        g.font = `bold ${painted ? 7 : 9}px monospace`
        g.textAlign = 'center'
        g.fillText('POD', podX, podY + (painted ? 2 : 3))
        g.restore()
        g.fillStyle = '#240c42'
        g.fillRect(148, 30, 184, 14)
        g.fillStyle = '#ffb9e6'
        g.fillRect(150, 32, 180 * Math.max(0, boss.hp / boss.maxHp), 10)
        g.strokeStyle = '#fff7cf'
        g.lineWidth = 1
        g.strokeRect(148, 30, 184, 14)
        g.fillStyle = '#fff7cf'
        g.textAlign = 'center'
        g.font = 'bold 8px monospace'
        g.fillText('B01 PEARL SEAHORSE', 240, 53)
        g.textAlign = 'left'
      }
      if (moonBoss) {
        const warn = moonjellyBossWarning(moonBoss)
        g.save()
        g.translate(moonBoss.x, moonBoss.y)
        g.shadowColor = warn ? '#fff49c' : '#affff7'
        g.shadowBlur = warn ? 25 : 12
        if (
          drawRainbowBossSprite(
            g,
            'b02',
            moonBoss.phase,
            -10,
            4 + Math.sin(moonBoss.frame / 24) * 2,
            102,
          )
        ) {
          g.shadowBlur = 0
          // The ring pulses but never fades below half strength, so a phone-sized canvas still shows it.
          if (warn) {
            g.strokeStyle = '#fff3a2'
            g.lineWidth = 4
            g.globalAlpha = 0.75 + 0.25 * Math.sin(moonBoss.frame / 3)
            g.beginPath()
            g.arc(-17, 0, 47, 0, Math.PI * 2)
            g.stroke()
            g.globalAlpha = 1
          }
        } else {
          g.fillStyle = '#b4f4f1b8'
          g.strokeStyle = warn ? '#fff3a2' : '#c5f7ff'
          g.lineWidth = warn ? 5 : 3
          g.beginPath()
          g.ellipse(0, -9, 42, 38, 0, Math.PI, 2 * Math.PI)
          g.fill()
          g.stroke()
          g.shadowBlur = 0
          for (let arm = -3; arm <= 3; arm++) {
            g.beginPath()
            g.moveTo(arm * 10, -8)
            g.quadraticCurveTo(
              arm * 14 + Math.sin(moonBoss.frame / 24 + arm) * 8,
              41,
              arm * 9,
              55,
            )
            g.stroke()
          }
          g.fillStyle = '#edffff'
          g.beginPath()
          g.arc(-11, -23, 7, 0, 2 * Math.PI)
          g.fill()
        }
        g.restore()
        g.fillStyle = '#1d2750'
        g.fillRect(148, 30, 184, 14)
        g.fillStyle = '#c2fff4'
        g.fillRect(150, 32, 180 * Math.max(0, moonBoss.hp / moonBoss.maxHp), 10)
        g.strokeStyle = '#fff4c4'
        g.lineWidth = 1
        g.strokeRect(148, 30, 184, 14)
        g.textAlign = 'center'
        g.font = 'bold 8px monospace'
        g.fillStyle = '#fff4c4'
        g.fillText('B02 AURELIA ARRAY', 240, 53)
        g.textAlign = 'left'
      }
      if (crown) {
        const warn = eclipseCrownWarning(crown)
        if (warn && crown.phase === 1) {
          // Every spoke the volley will fire down is drawn for the whole warning; the wedges are safe.
          g.save()
          g.strokeStyle = '#ff9fd8'
          g.globalAlpha = 0.5 + 0.2 * Math.sin(crown.frame / 3)
          g.lineWidth = 3
          g.setLineDash([8, 6])
          for (const angle of eclipseCrownSpokes(crown)) {
            g.beginPath()
            g.moveTo(crown.x, crown.y)
            g.lineTo(
              crown.x + Math.cos(angle) * 520,
              crown.y + Math.sin(angle) * 520,
            )
            g.stroke()
          }
          g.restore()
        }
        g.save()
        g.translate(crown.x, crown.y)
        g.shadowColor = warn ? '#fff49c' : '#ff9fd8'
        g.shadowBlur = warn ? 24 : 12
        if (
          !drawRainbowBossSprite(g, 'b09', crown.phase === 1 ? 1 : 2, 0, 0, 160)
        ) {
          g.fillStyle = '#2a1a4a'
          g.beginPath()
          g.arc(0, 0, ECLIPSE_CROWN.ringRadius, 0, Math.PI * 2)
          g.fill()
        }
        g.shadowBlur = 0
        // The crown ring itself.
        g.strokeStyle = crown.phase === 1 ? '#ffd27a' : '#8a7aa8'
        g.lineWidth = 3
        g.beginPath()
        g.arc(0, 0, ECLIPSE_CROWN.ringRadius, 0, Math.PI * 2)
        g.stroke()
        if (warn) {
          g.strokeStyle = '#fffbb6'
          g.lineWidth = 4
          g.globalAlpha = 0.75 + 0.25 * Math.sin(crown.frame / 3)
          g.beginPath()
          g.arc(0, 0, ECLIPSE_CROWN.ringRadius + 8, 0, Math.PI * 2)
          g.stroke()
          g.globalAlpha = 1
        }
        g.restore()
        // The heart node: home in the crown, then drifting free and open to every shot.
        g.save()
        g.translate(crown.heartX, crown.heartY)
        g.fillStyle = crown.phase === 2 ? '#ff5ac8' : '#c9708e'
        g.shadowColor = '#ff9fd8'
        g.shadowBlur = crown.phase === 2 ? 18 : 6
        g.beginPath()
        g.moveTo(0, 8)
        g.bezierCurveTo(-14, -2, -8, -14, 0, -6)
        g.bezierCurveTo(8, -14, 14, -2, 0, 8)
        g.fill()
        if (crown.phase === 2) {
          g.strokeStyle = '#ffffff'
          g.lineWidth = 2
          g.beginPath()
          g.arc(0, 0, ECLIPSE_CROWN.heartRadius, 0, Math.PI * 2)
          g.stroke()
        }
        g.restore()
        g.fillStyle = '#1a0a30'
        g.fillRect(148, 30, 184, 14)
        g.fillStyle = '#ff5ac8'
        g.fillRect(150, 32, 180 * Math.max(0, crown.hp / crown.maxHp), 10)
        g.strokeStyle = '#ffe2fa'
        g.lineWidth = 1
        g.strokeRect(148, 30, 184, 14)
        g.textAlign = 'center'
        g.font = 'bold 8px monospace'
        g.fillStyle = '#ffffff'
        g.fillText(
          crown.phase === 2
            ? 'B09 ECLIPSE CROWN · HEART FREE'
            : 'B09 ECLIPSE CROWN',
          240,
          41,
        )
        g.textAlign = 'left'
      }
      if (choiceFrame !== null) {
        // The final choice: three lanes, each named; the crew flies to one.
        const lanes = [
          ['restore', 'RESTORE ITS FIRST RULE', '#ffd27a'],
          ['evacuate', 'EVACUATE EVERYONE', '#9ff3ff'],
          ['sever', 'SEVER ITS CONTROL', '#ff9fd8'],
        ] as const
        g.save()
        for (const [choice, label, color] of lanes) {
          const y = FINALE_LANES[choice]
          g.globalAlpha = 0.18
          g.fillStyle = color
          g.fillRect(0, y - 24, W, 48)
          g.globalAlpha = 1
          g.fillStyle = color
          g.font = 'bold 10px monospace'
          g.textAlign = 'right'
          g.fillText(label, W - 10, y + 4)
        }
        g.fillStyle = '#180d38d9'
        g.fillRect(W / 2 - 70, H - 21, 140, 15)
        g.textAlign = 'center'
        g.fillStyle = '#ffffff'
        g.font = 'bold 9px monospace'
        g.fillText(
          `CHOOSE TOGETHER · ${Math.ceil((FINALE.choiceFrames - choiceFrame) / 60)}`,
          W / 2,
          H - 10,
        )
        g.restore()
      }
      if (escapeFrame !== null) {
        // How far the crew has flown through the closing corridors.
        g.fillStyle = '#1a0a30'
        g.fillRect(148, 30, 184, 10)
        g.fillStyle = '#9ff3ff'
        g.fillRect(
          150,
          32,
          180 * Math.min(1, escapeFrame / ECLIPSE_ESCAPE.frames),
          6,
        )
        g.textAlign = 'center'
        g.font = 'bold 8px monospace'
        g.fillStyle = '#ffffff'
        g.fillText('ESCAPE · FOLLOW THE LIGHT', 240, 50)
        g.textAlign = 'left'
      }
      if (leviathan) {
        const warn = prismLeviathanWarning(leviathan)
        const exposed = prismLeviathanExposed(leviathan)
        if (warn && prismLeviathanTidal(leviathan)) {
          // The tidal wall's gap is lit for the whole warning; everywhere else the wall will roll.
          g.save()
          g.fillStyle = '#ff5ac8'
          g.globalAlpha = 0.16
          g.fillRect(0, 30, W, leviathan.gapY - PRISM_LEVIATHAN.gapHalf - 30)
          g.fillRect(
            0,
            leviathan.gapY + PRISM_LEVIATHAN.gapHalf,
            W,
            H - leviathan.gapY - PRISM_LEVIATHAN.gapHalf,
          )
          g.globalAlpha = 0.8
          g.strokeStyle = '#c7ffe6'
          g.lineWidth = 2
          g.setLineDash([8, 6])
          for (const edge of [-1, 1]) {
            g.beginPath()
            g.moveTo(0, leviathan.gapY + edge * PRISM_LEVIATHAN.gapHalf)
            g.lineTo(W, leviathan.gapY + edge * PRISM_LEVIATHAN.gapHalf)
            g.stroke()
          }
          g.restore()
        }
        g.save()
        g.translate(leviathan.x, leviathan.y)
        g.shadowColor = exposed ? '#ff7ad9' : warn ? '#fff49c' : '#9fd8ff'
        g.shadowBlur = warn || exposed ? 24 : 10
        if (!drawRainbowBossSprite(g, 'b08', leviathan.phase, 0, 0, 170)) {
          g.fillStyle = '#2a4a8a'
          g.beginPath()
          g.ellipse(0, 0, 70, 28, 0, 0, Math.PI * 2)
          g.fill()
        }
        g.shadowBlur = 0
        for (const [i, offset] of PRISM_LEVIATHAN.lockOffsets.entries()) {
          if (leviathan.locks[i]! <= 0) continue
          // A spire lock on its back: shoot it off.
          g.fillStyle = '#ffd27a'
          g.strokeStyle = '#7a3a1a'
          g.lineWidth = 2
          g.beginPath()
          g.moveTo(offset - 7, -PRISM_LEVIATHAN.lockRise + 9)
          g.lineTo(offset, -PRISM_LEVIATHAN.lockRise - 10)
          g.lineTo(offset + 7, -PRISM_LEVIATHAN.lockRise + 9)
          g.closePath()
          g.fill()
          g.stroke()
        }
        if (warn) {
          g.strokeStyle = '#fffbb6'
          g.lineWidth = 4
          g.globalAlpha = 0.75 + 0.25 * Math.sin(leviathan.frame / 3)
          g.beginPath()
          g.arc(0, 0, PRISM_LEVIATHAN.bodyRadius + 8, 0, Math.PI * 2)
          g.stroke()
          g.globalAlpha = 1
        }
        if (exposed) {
          g.strokeStyle = '#ff7ad9'
          g.lineWidth = 3
          g.beginPath()
          g.arc(
            -PRISM_LEVIATHAN.gemOffset,
            -4,
            PRISM_LEVIATHAN.gemRadius + 2 * Math.sin(leviathan.frame / 2),
            0,
            Math.PI * 2,
          )
          g.stroke()
        }
        g.restore()
        g.fillStyle = '#1a0a30'
        g.fillRect(148, 30, 184, 14)
        g.fillStyle = '#c9708e'
        g.fillRect(
          150,
          32,
          180 * Math.max(0, leviathan.hp / leviathan.maxHp),
          10,
        )
        g.strokeStyle = '#ffe2fa'
        g.lineWidth = 1
        g.strokeRect(148, 30, 184, 14)
        g.textAlign = 'center'
        g.font = 'bold 8px monospace'
        g.fillStyle = '#ffffff'
        g.fillText(
          exposed ? 'B08 PRISM LEVIATHAN · GEM OPEN' : 'B08 PRISM LEVIATHAN',
          240,
          41,
        )
        g.textAlign = 'left'
      }
      if (navigator) {
        // The Lost Navigator's pod: a silver capsule with a blinking beacon.
        g.save()
        g.translate(navigator.x, navigator.y)
        g.fillStyle = '#dfe8f5'
        g.strokeStyle = '#7ad3ff'
        g.lineWidth = 2
        g.beginPath()
        g.ellipse(0, 0, 13, 9, 0, 0, Math.PI * 2)
        g.fill()
        g.stroke()
        g.fillStyle = tick % 30 < 15 ? '#7ad3ff' : '#ffffff'
        g.beginPath()
        g.arc(-4, -1, 3, 0, Math.PI * 2)
        g.fill()
        g.restore()
        g.font = 'bold 8px monospace'
        g.textAlign = 'center'
        g.fillStyle = '#c9f2ff'
        g.fillText('NAVIGATOR', navigator.x, navigator.y - 16)
        g.textAlign = 'left'
      }
      if (glassEel) {
        const warn = glassEelWarning(glassEel)
        const exposed = glassEelExposed(glassEel)
        const body = (y: number, solid: boolean) => {
          g.save()
          g.translate(glassEel!.x, y)
          if (!solid) g.globalAlpha = 0.35
          g.shadowColor =
            exposed && solid ? '#ff7ad9' : warn ? '#fff49c' : '#c9f2ff'
          g.shadowBlur = solid && (warn || exposed) ? 24 : 10
          if (!drawRainbowBossSprite(g, 'b07', glassEel!.phase, 0, 0, 140)) {
            g.fillStyle = '#9fb8d9'
            g.beginPath()
            g.ellipse(0, 0, 56, 20, 0, 0, Math.PI * 2)
            g.fill()
          }
          g.shadowBlur = 0
          if (solid) {
            // Only the true eel carries the outline.
            g.strokeStyle = exposed ? '#ff7ad9' : '#ffffff'
            g.lineWidth = exposed ? 3 : 2
            g.beginPath()
            g.arc(0, 0, GLASS_EEL.bodyRadius, 0, Math.PI * 2)
            g.stroke()
          }
          if (warn && solid) {
            g.strokeStyle = '#fffbb6'
            g.lineWidth = 4
            g.globalAlpha = 0.75 + 0.25 * Math.sin(glassEel!.frame / 3)
            g.beginPath()
            g.arc(0, 0, GLASS_EEL.bodyRadius + 8, 0, Math.PI * 2)
            g.stroke()
          }
          g.restore()
        }
        for (const ghost of glassEel.ghosts) body(ghost, false)
        body(glassEel.y, true)
        g.fillStyle = '#0c1a30'
        g.fillRect(148, 30, 184, 14)
        g.fillStyle = '#4f8fc0'
        g.fillRect(150, 32, 180 * Math.max(0, glassEel.hp / glassEel.maxHp), 10)
        g.strokeStyle = '#e8f6ff'
        g.lineWidth = 1
        g.strokeRect(148, 30, 184, 14)
        g.textAlign = 'center'
        g.font = 'bold 8px monospace'
        g.fillStyle = '#ffffff'
        g.fillText(
          exposed ? 'B07 GLASS EEL · CORE OPEN' : 'B07 GLASS EEL',
          240,
          41,
        )
        g.textAlign = 'left'
      }
      if (lanternRay) {
        const warn = lanternRayWarning(lanternRay)
        const exposed = lanternRayExposed(lanternRay)
        if (warn && lanternRay.phase === 1) {
          // Two broad shadow lanes, dark for the whole warning; the pellet walls race down them.
          g.save()
          g.fillStyle = '#0a0414'
          g.globalAlpha = 0.45 + 0.1 * Math.sin(lanternRay.frame / 3)
          for (const lane of lanternRay.lanes)
            g.fillRect(
              0,
              lane - LANTERN_RAY.laneHalf,
              W,
              LANTERN_RAY.laneHalf * 2,
            )
          g.restore()
        }
        g.save()
        g.translate(lanternRay.x, lanternRay.y)
        g.shadowColor = exposed ? '#ff7ad9' : warn ? '#fff49c' : '#ffd27a'
        g.shadowBlur = warn || exposed ? 24 : 10
        if (!drawRainbowBossSprite(g, 'b06', lanternRay.phase, 0, 0, 150)) {
          g.fillStyle = '#2a3a6a'
          g.beginPath()
          g.ellipse(0, 0, 60, 24, 0, 0, Math.PI * 2)
          g.fill()
        }
        g.shadowBlur = 0
        for (const [i, side] of [-1, 1].entries()) {
          if (lanternRay.nurseries[i]! <= 0) continue
          // A wing nursery: shoot it off and it stops launching drones.
          g.fillStyle = '#ffd27a'
          g.strokeStyle = '#7a3a1a'
          g.lineWidth = 2
          g.beginPath()
          g.arc(
            10,
            side * LANTERN_RAY.nurseryOffset,
            LANTERN_RAY.nurseryRadius - 3,
            0,
            Math.PI * 2,
          )
          g.fill()
          g.stroke()
        }
        if (warn) {
          g.strokeStyle = '#fffbb6'
          g.lineWidth = 4
          g.globalAlpha = 0.75 + 0.25 * Math.sin(lanternRay.frame / 3)
          g.beginPath()
          g.arc(0, 0, LANTERN_RAY.bodyRadius + 8, 0, Math.PI * 2)
          g.stroke()
          g.globalAlpha = 1
        }
        if (exposed) {
          g.strokeStyle = '#ff7ad9'
          g.lineWidth = 3
          g.beginPath()
          g.arc(
            0,
            LANTERN_RAY.beaconOffset,
            LANTERN_RAY.beaconRadius + 2 * Math.sin(lanternRay.frame / 2),
            0,
            Math.PI * 2,
          )
          g.stroke()
        }
        g.restore()
        g.fillStyle = '#2a0f30'
        g.fillRect(148, 30, 184, 14)
        g.fillStyle = '#b8672a'
        g.fillRect(
          150,
          32,
          180 * Math.max(0, lanternRay.hp / lanternRay.maxHp),
          10,
        )
        g.strokeStyle = '#fff4c4'
        g.lineWidth = 1
        g.strokeRect(148, 30, 184, 14)
        g.textAlign = 'center'
        g.font = 'bold 8px monospace'
        g.fillStyle = '#fff4c4'
        g.fillText(
          exposed ? 'B06 LANTERN RAY · BEACON OPEN' : 'B06 LANTERN RAY',
          240,
          41,
        )
        g.textAlign = 'left'
      }
      if (sawtooth) {
        const warn = sawtoothWarning(sawtooth)
        const exposed = sawtoothExposed(sawtooth)
        if (sawtoothChargeWarning(sawtooth)) {
          // The charge lane: the band the Regent's body will sweep, marked for the whole jaw warning.
          g.save()
          g.fillStyle = '#ff6b8a'
          g.globalAlpha = 0.14 + 0.08 * Math.sin(sawtooth.frame / 3)
          g.fillRect(
            0,
            sawtooth.aimY - SAWTOOTH.bodyRadius,
            W,
            SAWTOOTH.bodyRadius * 2,
          )
          g.globalAlpha = 0.7
          g.strokeStyle = '#ff9e9e'
          g.lineWidth = 2
          g.setLineDash([8, 6])
          for (const edge of [-1, 1]) {
            g.beginPath()
            g.moveTo(0, sawtooth.aimY + edge * SAWTOOTH.bodyRadius)
            g.lineTo(W, sawtooth.aimY + edge * SAWTOOTH.bodyRadius)
            g.stroke()
          }
          g.restore()
        }
        g.save()
        g.translate(sawtooth.x, sawtooth.y)
        g.shadowColor = exposed ? '#ff7a6b' : warn ? '#fff49c' : '#9fd8ff'
        g.shadowBlur = warn || exposed ? 24 : 10
        if (!drawRainbowBossSprite(g, 'b05', sawtooth.phase, 0, 0, 120)) {
          g.fillStyle = '#4a6a9a'
          g.beginPath()
          g.moveTo(-50, 0)
          g.lineTo(30, -26)
          g.lineTo(46, 0)
          g.lineTo(30, 26)
          g.closePath()
          g.fill()
        }
        g.shadowBlur = 0
        if (warn) {
          g.strokeStyle = '#fffbb6'
          g.lineWidth = 4
          g.globalAlpha = 0.75 + 0.25 * Math.sin(sawtooth.frame / 3)
          g.beginPath()
          g.arc(0, 0, SAWTOOTH.bodyRadius + 8, 0, Math.PI * 2)
          g.stroke()
          g.globalAlpha = 1
        }
        if (exposed) {
          g.strokeStyle = '#ff7a6b'
          g.lineWidth = 3
          g.beginPath()
          g.arc(
            SAWTOOTH.jawOffset,
            0,
            SAWTOOTH.jawRadius + 2 * Math.sin(sawtooth.frame / 2),
            0,
            Math.PI * 2,
          )
          g.stroke()
        }
        g.restore()
        g.fillStyle = '#2a0f30'
        g.fillRect(148, 30, 184, 14)
        g.fillStyle = '#9fd8ff'
        g.fillRect(150, 32, 180 * Math.max(0, sawtooth.hp / sawtooth.maxHp), 10)
        g.strokeStyle = '#fff4c4'
        g.lineWidth = 1
        g.strokeRect(148, 30, 184, 14)
        g.textAlign = 'center'
        g.font = 'bold 8px monospace'
        g.fillStyle = '#fff4c4'
        g.fillText(
          exposed ? 'B05 SAWTOOTH REGENT · JAW OPEN' : 'B05 SAWTOOTH REGENT',
          240,
          41,
        )
        g.textAlign = 'left'
      }
      if (delphion) {
        const warn = delphionWarning(delphion)
        const exposed = delphionExposed(delphion)
        if (warn && delphion.phase === 2) {
          // The leap fires down the lanes its warning marks.
          g.save()
          g.strokeStyle = '#ffd1f0'
          g.globalAlpha = 0.6
          g.lineWidth = 3
          g.setLineDash([8, 6])
          for (const lane of delphionLeapLanes(delphion)) {
            g.beginPath()
            g.moveTo(delphion.x - 30, lane)
            g.lineTo(0, lane)
            g.stroke()
          }
          g.restore()
        }
        const twins = delphionTwins(delphion)
        const core = delphionCore(delphion)
        g.save()
        // The rear coupling between the twins, with its link core.
        g.strokeStyle = exposed ? '#ff7ad9' : '#c8a8ff'
        g.lineWidth = 4
        g.beginPath()
        g.moveTo(twins[0]!.x + 26, twins[0]!.y)
        g.lineTo(core.x, core.y)
        g.lineTo(twins[1]!.x + 26, twins[1]!.y)
        g.stroke()
        g.fillStyle = exposed ? '#ff7ad9' : '#6b4a9a'
        g.shadowColor = '#ff7ad9'
        g.shadowBlur = exposed ? 22 : 0
        g.beginPath()
        g.arc(
          core.x,
          core.y,
          exposed ? 9 + 2 * Math.sin(delphion.frame / 2) : 7,
          0,
          Math.PI * 2,
        )
        g.fill()
        if (warn && delphion.phase === 3) {
          g.strokeStyle = '#fffbb6'
          g.lineWidth = 3
          g.globalAlpha = 0.75 + 0.25 * Math.sin(delphion.frame / 3)
          g.beginPath()
          g.arc(core.x, core.y, DELPHION.coreRadius + 6, 0, Math.PI * 2)
          g.stroke()
          g.globalAlpha = 1
        }
        g.shadowBlur = 0
        for (const twin of twins) {
          g.save()
          g.translate(twin.x, twin.y)
          g.shadowColor = warn ? '#fff49c' : '#9ff3ff'
          g.shadowBlur = warn ? 22 : 10
          if (!drawRainbowBossSprite(g, 'b04', delphion.phase, 0, 0, 96)) {
            g.fillStyle = delphion.phase === 3 ? '#ff9fd8' : '#7fd8ff'
            g.beginPath()
            g.ellipse(0, 0, 34, 16, 0, 0, Math.PI * 2)
            g.fill()
          }
          g.shadowBlur = 0
          if (warn && delphion.phase === 1) {
            // Beacons: the same never-below-three-quarters pulse as every boss cue.
            g.strokeStyle = '#fffbb6'
            g.lineWidth = 3
            g.globalAlpha = 0.75 + 0.25 * Math.sin(delphion.frame / 3)
            g.beginPath()
            g.arc(0, 0, DELPHION.twinRadius + 4, 0, Math.PI * 2)
            g.stroke()
            g.globalAlpha = 1
          }
          g.restore()
        }
        g.restore()
        g.fillStyle = '#2a0f30'
        g.fillRect(148, 30, 184, 14)
        g.fillStyle = '#ff9fd8'
        g.fillRect(150, 32, 180 * Math.max(0, delphion.hp / delphion.maxHp), 10)
        g.strokeStyle = '#fff4c4'
        g.lineWidth = 1
        g.strokeRect(148, 30, 184, 14)
        g.textAlign = 'center'
        g.font = 'bold 8px monospace'
        g.fillStyle = '#fff4c4'
        g.fillText(
          exposed ? 'B04 DELPHION · LINK CORE OPEN' : 'B04 DELPHION',
          240,
          41,
        )
        g.textAlign = 'left'
      }
      if (clawBoss) {
        const warn = clawburstWarning(clawBoss)
        const exposed = clawburstExposed(clawBoss)
        if (warn && clawBoss.phase !== 2) {
          // The rail and the punch fire down the lane their warning marks.
          g.save()
          g.strokeStyle = '#ffd1a8'
          g.globalAlpha = 0.55
          g.lineWidth = 3
          g.setLineDash([8, 6])
          g.beginPath()
          g.moveTo(clawBoss.x - 34, clawBoss.y)
          g.lineTo(80, clawBoss.aimY)
          g.stroke()
          g.restore()
        }
        g.save()
        g.translate(clawBoss.x, clawBoss.y)
        g.shadowColor = exposed ? '#ff7a6b' : warn ? '#fff49c' : '#ffb38a'
        g.shadowBlur = warn || exposed ? 25 : 12
        if (drawRainbowBossSprite(g, 'b03', clawBoss.phase, -10, 0, 110)) {
          g.shadowBlur = 0
          // The ring pulses but never fades below three quarters, so a phone-sized canvas still shows it.
          if (warn) {
            g.strokeStyle = '#fffbb6'
            g.lineWidth = 4
            g.globalAlpha = 0.75 + 0.25 * Math.sin(clawBoss.frame / 3)
            g.beginPath()
            g.arc(-17, 0, 47, 0, Math.PI * 2)
            g.stroke()
            g.globalAlpha = 1
          }
        } else {
          g.fillStyle = clawBoss.phase === 3 ? '#ff8f7a' : '#ffb38a'
          g.strokeStyle = warn ? '#fffbb6' : '#6b2f4a'
          g.lineWidth = warn ? 5 : 3
          g.beginPath()
          g.ellipse(0, 0, 44, 30, 0, 0, Math.PI * 2)
          g.fill()
          g.stroke()
          g.fillRect(-58, -6, 22, 12)
        }
        if (exposed) {
          g.strokeStyle = '#ff7a6b'
          g.lineWidth = 3
          g.beginPath()
          g.arc(-34, 0, 14 + 3 * Math.sin(clawBoss.frame / 2), 0, Math.PI * 2)
          g.stroke()
        }
        g.restore()
        g.fillStyle = '#2a0f30'
        g.fillRect(148, 30, 184, 14)
        g.fillStyle = '#ffb38a'
        g.fillRect(150, 32, 180 * Math.max(0, clawBoss.hp / clawBoss.maxHp), 10)
        g.strokeStyle = '#fff4c4'
        g.lineWidth = 1
        g.strokeRect(148, 30, 184, 14)
        g.textAlign = 'center'
        g.font = 'bold 8px monospace'
        g.fillStyle = '#fff4c4'
        g.fillText(
          exposed ? 'B03 CLAWBURST · CANNON OPEN' : 'B03 CLAWBURST',
          240,
          53,
        )
        g.textAlign = 'left'
      }
      for (const bullet of enemyShots) {
        if (bullet.ghost) {
          g.save()
          g.globalAlpha = 0.35
          g.strokeStyle = '#c9f2ff'
          g.lineWidth = 1
          g.setLineDash([2, 2])
          g.beginPath()
          g.arc(bullet.x, bullet.y, 4.5, 0, Math.PI * 2)
          g.stroke()
          g.restore()
          continue
        }
        if (bullet.burst === 'split' && bullet.fuse !== undefined) {
          // A lens pellet: three facets that brighten as it nears its split.
          g.fillStyle = bullet.fuse < 20 ? '#ffffff' : '#bfe6ff'
          g.beginPath()
          g.moveTo(bullet.x - 6, bullet.y)
          g.lineTo(bullet.x + 3, bullet.y - 5)
          g.lineTo(bullet.x + 3, bullet.y + 5)
          g.closePath()
          g.fill()
          g.strokeStyle = '#1b163e'
          g.lineWidth = 1.5
          g.stroke()
          continue
        }
        if (bullet.burst === 'cross' && bullet.fuse !== undefined) {
          // Angler lure: a false pickup halo that flashes the cross it is about to fire.
          if (bullet.fuse <= 36) {
            g.save()
            g.strokeStyle = '#ff8a8a'
            g.globalAlpha = 0.5 + 0.3 * Math.sin(bullet.fuse / 2)
            g.lineWidth = 2
            g.beginPath()
            g.moveTo(bullet.x - 70, bullet.y)
            g.lineTo(bullet.x + 70, bullet.y)
            g.moveTo(bullet.x, bullet.y - 70)
            g.lineTo(bullet.x, bullet.y + 70)
            g.stroke()
            g.restore()
          }
          g.fillStyle = '#ffe08a'
          g.beginPath()
          g.arc(bullet.x, bullet.y, 6, 0, Math.PI * 2)
          g.fill()
          g.strokeStyle = '#ffffff'
          g.lineWidth = 2
          g.beginPath()
          g.arc(
            bullet.x,
            bullet.y,
            9 + (bullet.fuse % 12 < 6 ? 2 : 0),
            0,
            Math.PI * 2,
          )
          g.stroke()
          continue
        }
        if (bullet.burst === 'ring' && bullet.fuse !== undefined) {
          // Pistol bubble: swells as it ripens into its ring.
          const r = 6 + (1 - bullet.fuse / 75) * 6
          g.fillStyle = '#9ee7ff55'
          g.beginPath()
          g.arc(bullet.x, bullet.y, r, 0, Math.PI * 2)
          g.fill()
          g.strokeStyle = bullet.fuse < 20 ? '#ffffff' : '#9ee7ff'
          g.lineWidth = 2
          g.stroke()
          continue
        }
        if (bullet.bounces) {
          // Skate glass: a diamond that has not yet glanced off the wall.
          g.fillStyle = '#a6fff0'
          g.beginPath()
          g.moveTo(bullet.x, bullet.y - 6)
          g.lineTo(bullet.x + 5, bullet.y)
          g.lineTo(bullet.x, bullet.y + 6)
          g.lineTo(bullet.x - 5, bullet.y)
          g.closePath()
          g.fill()
          g.strokeStyle = '#1b163e'
          g.lineWidth = 1.5
          g.stroke()
          continue
        }
        g.fillStyle = '#1b163e'
        g.beginPath()
        g.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2)
        g.fill()
        g.strokeStyle = '#fff5b3'
        g.lineWidth = 2
        g.stroke()
      }
      for (const pickup of pickups) {
        if (drawRainbowPickupSprite(g, pickup.kind, pickup.x, pickup.y))
          continue
        g.fillStyle =
          pickup.kind === 'power'
            ? '#a5f3fc'
            : pickup.kind === 'shield'
              ? '#f9a8d4'
              : '#fde68a'
        g.beginPath()
        g.arc(pickup.x, pickup.y, 9, 0, Math.PI * 2)
        g.fill()
        g.fillStyle = '#21133b'
        g.font = 'bold 10px sans-serif'
        g.textAlign = 'center'
        g.fillText(
          pickup.kind === 'power' ? 'P' : pickup.kind === 'shield' ? 'S' : '★',
          pickup.x,
          pickup.y + 4,
        )
        g.textAlign = 'left'
      }
      for (const shot of shots) {
        g.fillStyle = PILOT_COLORS[shot.seat]!
        if (shot.kind === 'needle') {
          // Rose Needle: a long thin needle with a white point.
          g.fillRect(shot.x - 4, shot.y - 1, 16, 2)
          g.fillStyle = '#fff'
          g.fillRect(shot.x + 9, shot.y - 1, 4, 2)
        } else if (shot.kind === 'thread') {
          // Prism Thread: a bright beam segment with a white core.
          g.fillRect(shot.x - 10, shot.y - 2, 24, 4)
          g.fillStyle = '#fff'
          g.fillRect(shot.x - 8, shot.y - 0.5, 22, 1)
        } else if (shot.kind === 'link' || shot.kind === 'arc') {
          // Halo Link orbs and Comet Arc sparks.
          g.beginPath()
          g.arc(
            shot.x + 4,
            shot.y,
            shot.kind === 'arc' ? 3 : 3.5,
            0,
            Math.PI * 2,
          )
          g.fill()
          g.fillStyle = '#fff'
          g.fillRect(shot.x + 3, shot.y - 1, 2, 2)
        } else {
          g.fillRect(shot.x, shot.y - 2, 12, 4)
          g.fillStyle = '#fff'
          g.fillRect(shot.x + 8, shot.y - 1, 5, 2)
        }
      }
      for (let seat = 0; seat < activePlayers; seat++) {
        const ship = ships[seat]!
        // Ships blink while invulnerable, except at the final choice, where nothing fires and every
        // pilot needs to see where they are flying.
        if (
          ship.lives <= 0 ||
          (ship.invulnerable &&
            choiceFrame === null &&
            Math.floor(tick / 6) % 2 === 0)
        )
          continue
        g.save()
        g.translate(ship.x, ship.y)
        g.shadowColor = PILOT_COLORS[seat]!
        g.shadowBlur = 10
        if (!drawRainbowShipSprite(g, seat)) {
          g.fillStyle = PILOT_COLORS[seat]!
          g.shadowBlur = 15
          g.beginPath()
          g.moveTo(16, 0)
          g.lineTo(-13, -11)
          g.lineTo(-6, 0)
          g.lineTo(-13, 11)
          g.closePath()
          g.fill()
          g.strokeStyle = '#fff7fc'
          g.lineWidth = 2
          g.stroke()
        }
        g.shadowBlur = 0
        g.fillStyle = '#44235c'
        g.fillRect(-3, -3, 6, 6)
        g.strokeStyle = PILOT_COLORS[seat]!
        g.lineWidth = 1
        g.strokeRect(-3, -3, 6, 6)
        if (ship.focus) {
          g.strokeStyle = '#fff'
          g.beginPath()
          g.arc(0, 0, CORE_RADIUS, 0, Math.PI * 2)
          g.stroke()
        }
        g.strokeStyle = '#fff'
        g.font = 'bold 9px sans-serif'
        g.strokeText(String(seat + 1), -3, -17)
        if (ship.charge >= 100 && Math.floor(tick / 10) % 2 === 0) {
          g.fillStyle = PILOT_COLORS[seat]!
          g.font = 'bold 7px monospace'
          g.textAlign = 'center'
          g.fillText('SUPER READY · TAP B', 0, 24)
          g.textAlign = 'left'
        }
        g.restore()
      }
      for (const burst of bursts) {
        const t = burst.age / BURST_FRAMES
        const fade = 1 - t
        const color = PILOT_COLORS[burst.seat]!
        g.save()
        if (burst.age < 8) {
          g.globalAlpha = (8 - burst.age) / 16
          g.fillStyle = color
          g.fillRect(0, 0, W, H)
        }
        g.globalAlpha = fade
        g.strokeStyle = color
        g.fillStyle = color
        g.shadowColor = color
        g.shadowBlur = 18
        if (burst.seat === 0) {
          const r = 20 + t * 170
          for (let petal = 0; petal < 8; petal++) {
            const a = (petal / 8) * Math.PI * 2 + t * 1.5
            g.beginPath()
            g.ellipse(
              burst.x + Math.cos(a) * r,
              burst.y + Math.sin(a) * r,
              14 * fade + 4,
              6 * fade + 2,
              a,
              0,
              Math.PI * 2,
            )
            g.fill()
          }
        } else if (burst.seat === 1) {
          const half = 22 * fade + 2
          g.fillRect(burst.x, burst.y - half, W - burst.x, half * 2)
          g.fillStyle = '#ffffff'
          g.fillRect(burst.x, burst.y - half / 3, W - burst.x, (half * 2) / 3)
        } else if (burst.seat === 2) {
          g.lineWidth = 4 * fade + 1
          for (const scale of [1, 0.6]) {
            g.beginPath()
            g.arc(burst.x, burst.y, (24 + t * 140) * scale, 0, Math.PI * 2)
            g.stroke()
          }
        } else {
          for (let comet = 0; comet < 7; comet++) {
            const y = burst.y + (comet - 3) * 18
            const x = burst.x + t * (W - burst.x + 60) - comet * 6
            g.beginPath()
            g.moveTo(x, y)
            g.lineTo(x - 46, y - 3)
            g.lineTo(x - 46, y + 3)
            g.closePath()
            g.fill()
          }
        }
        g.restore()
      }
      // Act intro splash: the painted title card fades in under the opening comms while no craft spawn.
      const act = currentAct()
      const introFrame = actFrame(act)
      if (introFrame < INTRO_FRAMES && (moonStart !== null || !defeatedAt)) {
        const stage = (
          [
            's01',
            's02',
            's03',
            's04',
            's05',
            's06',
            's07',
            's08',
            's08',
          ] as const
        )[act - 1]!
        const top = 33 + Math.max(0, activePlayers - 1) * 10 + 60
        g.save()
        g.globalAlpha =
          Math.min(1, introFrame / 15) *
          Math.min(1, (INTRO_FRAMES - introFrame) / 30)
        const height = drawRainbowStageCard(g, stage, W / 2 - 100, top, 200)
        const bandY = top + Math.max(height, 40) - 22
        g.fillStyle = '#180d38d9'
        g.fillRect(W / 2 - 100, bandY, 200, 22)
        g.fillStyle = '#ffe7f5'
        g.textAlign = 'center'
        g.font = 'bold 8px monospace'
        g.fillText(ACT_NUMERALS[act - 1]!, W / 2, bandY + 9)
        g.font = 'bold 10px monospace'
        g.fillText(
          [
            'PINKWAKE ESTUARY',
            'MOONJELLY FIELDS',
            'CHROMATIC TRENCH',
            'ROSEFIN EXPRESS',
            'BLOSSOM WRECKYARD',
            'CROWN REEF',
            'GLASS CURRENT',
            'ECLIPSE PALACE',
            'ECLIPSE CROWN',
          ][act - 1]!,
          W / 2,
          bandY + 19,
        )
        g.restore()
      }
      g.fillStyle = '#180d38e8'
      g.fillRect(0, 0, W, 29)
      g.fillStyle = '#ffe7f5'
      g.font = 'bold 10px monospace'
      g.fillText(
        [
          'ACT I / PINKWAKE',
          'ACT II / MOONJELLY',
          'ACT III / TRENCH',
          'ACT IV / EXPRESS',
          'ACT V / WRECKYARD',
          'ACT VI / CROWN REEF',
          'ACT VII / GLASS CURRENT',
          'ACT VIII / ECLIPSE PALACE',
          'FINALE / ECLIPSE CROWN',
        ][act - 1]!,
        HUD_LEFT,
        12,
      )
      g.font = '9px monospace'
      g.fillText('A FIRE · HOLD B FOCUS · TAP B AT 100% = SUPER', HUD_LEFT, 24)
      g.textAlign = 'right'
      g.fillText(`SHOALS ${clearCount}  ·  NOVAS ${supers}`, HUD_RIGHT, 12)
      if (activePlayers > 1) {
        g.fillStyle = '#180d38e8'
        g.fillRect(HUD_RIGHT - 150, 29, 158, (activePlayers - 1) * 10 + 4)
      }
      for (let seat = 0; seat < activePlayers; seat++) {
        const ship = ships[seat]!
        g.fillStyle = PILOT_COLORS[seat]!
        g.fillText(
          `${SHIP_NAMES[seat]} ${ship.lives}♥ ${ship.shield}◇ P${ship.power} ${ship.charge}%`,
          HUD_RIGHT,
          24 + seat * 10,
        )
      }
      g.textAlign = 'left'
      const scene =
        act === 1
          ? pinkwakeScene(tick, defeatedAt)
          : act === 2
            ? moonjellyScene(moonFrame(), moonDefeatedFrame)
            : act === 3
              ? trenchScene(trenchFrame(), trenchDefeatedFrame)
              : act === 4
                ? rosefinScene(rosefinFrame(), rosefinDefeatedFrame)
                : act === 5
                  ? wreckScene(wreckFrame(), wreckDefeatedFrame)
                  : act === 6
                    ? reefScene(reefFrame(), reefDefeatedFrame)
                    : act === 7
                      ? glassScene(glassFrame(), glassDefeatedFrame)
                      : act === 8
                        ? palaceScene(palaceFrame(), palaceDefeatedFrame)
                        : finaleScene(
                            finaleFrame(),
                            choiceFrame,
                            escapeFrame,
                            endingFrame,
                          )
      const dialogue = scene
        ? act === 9
          ? finaleDialogue(
              scene.id as FinaleSceneId,
              scene.elapsed,
              activePlayers,
              finaleFlags(),
              finalChoice,
            )
          : act === 8
            ? palaceDialogue(
                scene.id as PalaceSceneId,
                scene.elapsed,
                activePlayers,
                palaceFlags(),
              )
            : act === 7
              ? glassDialogue(
                  scene.id as GlassSceneId,
                  scene.elapsed,
                  activePlayers,
                  rescuedNavigator,
                )
              : act === 6
                ? reefDialogue(
                    scene.id as ReefSceneId,
                    scene.elapsed,
                    activePlayers,
                    reefRoute,
                    reefRoute === 'relay' && pylonsDown >= CROWN_REEF_PYLONS,
                  )
                : act === 5
                  ? wreckDialogue(
                      scene.id as WreckSceneId,
                      scene.elapsed,
                      activePlayers,
                      wreckRoute,
                      wreckRoute === 'depot' &&
                        podsSaved >= WRECK_FORK.podsToFree,
                    )
                  : act === 4
                    ? rosefinDialogue(
                        scene.id as RosefinSceneId,
                        scene.elapsed,
                        activePlayers,
                        rescuedCourier,
                      )
                    : act === 3
                      ? trenchDialogue(
                          scene.id as TrenchSceneId,
                          scene.elapsed,
                          activePlayers,
                          trenchRoute,
                        )
                      : act === 1
                        ? pinkwakeDialogue(
                            scene.id as 'A01.OPEN' | 'A01.TURN' | 'A01.AFTER',
                            scene.elapsed,
                            activePlayers,
                            rescuedStation,
                          )
                        : moonjellyDialogue(
                            scene.id as 'A02.OPEN' | 'A02.TURN' | 'A02.AFTER',
                            scene.elapsed,
                            activePlayers,
                            rescuedNemi,
                          )
        : null
      const commsTop = 33 + Math.max(0, activePlayers - 1) * 10
      if (dialogue) {
        g.fillStyle = '#160b34e8'
        g.fillRect(15, commsTop, W - 30, 51)
        g.strokeStyle = '#ffe2fa'
        g.lineWidth = 1
        g.strokeRect(15, commsTop, W - 30, 51)
        const portrait = drawRainbowCommsPortrait(
          g,
          dialogue.speaker,
          19,
          commsTop + 4,
          43,
        )
        if (portrait) {
          g.strokeStyle = '#aef6f0'
          g.strokeRect(19, commsTop + 4, 43, 43)
        }
        const textX = portrait ? 70 : 24
        const wrap = portrait ? 57 : 65
        g.fillStyle = '#aef6f0'
        g.font = 'bold 10px monospace'
        g.fillText(
          `${scene!.id} / ${dialogue.speaker.toUpperCase()}`,
          textX,
          commsTop + 16,
        )
        const words = dialogue.text.split(' ')
        const lines = ['']
        for (const word of words) {
          const i = lines.length - 1
          if (lines[i]!.length + word.length + 1 > wrap) lines.push(word)
          else lines[i] = (lines[i] ? lines[i] + ' ' : '') + word
        }
        g.fillStyle = '#fff4fa'
        g.font = '9px monospace'
        for (let line = 0; line < Math.min(lines.length, 2); line++) {
          g.fillText(lines[line]!, textX, commsTop + 30 + line * 12)
        }
      } else if (restingFrames() !== null) {
        // ACT-STRUCTURE: Act V ends on a recovery and memorial tableau, the second quiet intermission.
        g.fillStyle = '#180d38d9'
        g.fillRect(40, commsTop, W - 80, 33)
        g.fillStyle = '#ffd1ec'
        g.textAlign = 'center'
        g.font = 'bold 11px monospace'
        g.fillText(
          'SAWTOOTH REGENT DISABLED · ACT V PREVIEW CLEAR',
          W / 2,
          commsTop + 19,
        )
        g.font = '8px monospace'
        g.fillText(
          restingFrames()! >= CROWN_REEF.restMinFrames
            ? `Shields +1 at launch · PRESS A for the Crown Reef (${Math.ceil((CROWN_REEF.restMaxFrames - restingFrames()!) / 60)})`
            : `A memorial for the lost ships · ${wreckRoute === 'depot' ? `${podsSaved} survivors home` : 'armory raided'}`,
          W / 2,
          commsTop + 30,
        )
        g.textAlign = 'left'
      } else if (dockedFrames() !== null) {
        // ACT-STRUCTURE: Act III ends on a quiet salvage-dock tableau: a bounded repair, then the crew launches.
        const docked = dockedFrames()!
        g.fillStyle = '#180d38d9'
        g.fillRect(40, commsTop, W - 80, 33)
        g.fillStyle = '#ffd9b8'
        g.textAlign = 'center'
        g.font = 'bold 11px monospace'
        g.fillText(
          'CLAWBURST PILOT RESCUED · SALVAGE DOCK',
          W / 2,
          commsTop + 19,
        )
        g.font = '8px monospace'
        g.fillText(
          docked >= ROSEFIN.dockMinFrames
            ? `Shields +1 at launch · PRESS A for the Rosefin Express (${Math.ceil((ROSEFIN.dockMaxFrames - docked) / 60)})`
            : 'A quiet moment: breathe, repair, then follow the orders upstream',
          W / 2,
          commsTop + 30,
        )
        g.textAlign = 'left'
      } else if (moonStart === null && defeatedAt !== null) {
        g.fillStyle = '#180d38d9'
        g.fillRect(65, commsTop, W - 130, 33)
        g.fillStyle = '#c7ffe6'
        g.textAlign = 'center'
        g.font = 'bold 11px monospace'
        g.fillText('POD RESCUED · ACT I PREVIEW CLEAR', W / 2, commsTop + 19)
        g.font = '8px monospace'
        g.fillText(
          'Moonjelly Fields incoming: shields and power persist',
          W / 2,
          commsTop + 30,
        )
        g.textAlign = 'left'
      }
      if (endingFrame !== null && endingFrame >= FINALE_ENDING_FRAMES) {
        // The credits roll over the halo, naming the crew and the rescued; then THE END.
        const rolled = endingFrame - FINALE_ENDING_FRAMES
        g.save()
        g.fillStyle = '#05030fe6'
        g.fillRect(0, 0, W, H)
        g.textAlign = 'center'
        if (rolled < FINALE.creditFrames) {
          const lines = finaleCredits(
            finaleFlags(),
            activePlayers,
            finalChoice ?? 'evacuate',
          )
          const top =
            H + 10 - (rolled / FINALE.creditFrames) * (lines.length * 16 + H)
          for (const [i, line] of lines.entries()) {
            const y = top + i * 16
            if (y < -10 || y > H + 10) continue
            const heading = line === line.toUpperCase() && line.length > 0
            g.fillStyle = heading ? '#ffd27a' : '#ffe7f5'
            g.font = heading ? 'bold 10px monospace' : '9px monospace'
            g.fillText(line, W / 2, y)
          }
        } else {
          g.fillStyle = '#ffd1ec'
          g.font = 'bold 26px monospace'
          g.fillText('THE END', W / 2, 112)
          g.fillStyle = '#ffe7f5'
          g.font = '10px monospace'
          g.fillText(
            `FINAL SCORE ${Math.round(score * level.score)} · ${(finalChoice ?? 'evacuate').toUpperCase()}`,
            W / 2,
            140,
          )
          if (rolled - FINALE.creditFrames >= FINALE.endMinFrames) {
            g.font = 'bold 9px monospace'
            g.fillStyle = '#9ff3ff'
            g.fillText('THANK YOU FOR FLYING · PRESS A', W / 2, 166)
          }
        }
        g.restore()
      }
      if (act === 8 && palaceDefeatedFrame === null) {
        // The armada count sits on a dark chip so it reads over the bright palace floor.
        g.save()
        g.fillStyle = '#180d38d9'
        g.fillRect(W - 112, H - 19, 108, 14)
        g.font = '8px monospace'
        g.textAlign = 'right'
        g.fillStyle = '#ffd1ec'
        g.fillText(`CAPTIVES FREED ${captivesFreed}`, W - 8, H - 8)
        g.restore()
      }
      if (act === 6 && reefDefeatedFrame === null) {
        const frame = reefFrame()
        if (
          frame >= CROWN_REEF_FORK.markFrom &&
          frame < CROWN_REEF_FORK.decideAt
        ) {
          // The fork: the relay above the line, the shield cache below it.
          g.save()
          g.globalAlpha = 0.6 + 0.25 * Math.sin(frame / 8)
          g.strokeStyle = '#ffe2fa'
          g.lineWidth = 1
          g.setLineDash([8, 6])
          g.beginPath()
          g.moveTo(W - 170, CROWN_REEF_FORK.splitY)
          g.lineTo(W, CROWN_REEF_FORK.splitY)
          g.stroke()
          g.setLineDash([])
          g.font = 'bold 9px monospace'
          g.textAlign = 'right'
          g.fillStyle = '#ffd27a'
          g.fillText('▲ DAMAGE RELAY', W - 8, CROWN_REEF_FORK.splitY - 8)
          g.fillStyle = '#9ff3ff'
          g.fillText('▼ SHIELD CACHE', W - 8, CROWN_REEF_FORK.splitY + 16)
          g.restore()
        } else if (
          reefRoute !== null &&
          frame >= CROWN_REEF_FORK.decideAt &&
          frame < CROWN_REEF_FORK.rejoinAt
        ) {
          g.save()
          g.font = '8px monospace'
          g.textAlign = 'right'
          g.fillStyle = reefRoute === 'relay' ? '#ffd27a' : '#9ff3ff'
          g.fillText(
            reefRoute === 'relay'
              ? `ROUTE · DAMAGE RELAY · PYLONS ${pylonsDown}/${CROWN_REEF_PYLONS}`
              : 'ROUTE · SHIELD CACHE',
            W - 8,
            H - 8,
          )
          g.restore()
        }
      }
      if (act === 5 && wreckDefeatedFrame === null) {
        const frame = wreckFrame()
        if (frame >= WRECK_FORK.markFrom && frame < WRECK_FORK.decideAt) {
          // The fork: the depot above the line, the armory below it.
          g.save()
          g.globalAlpha = 0.6 + 0.25 * Math.sin(frame / 8)
          g.strokeStyle = '#ffe2fa'
          g.lineWidth = 1
          g.setLineDash([8, 6])
          g.beginPath()
          g.moveTo(W - 170, WRECK_FORK.splitY)
          g.lineTo(W, WRECK_FORK.splitY)
          g.stroke()
          g.setLineDash([])
          g.font = 'bold 9px monospace'
          g.textAlign = 'right'
          g.fillStyle = '#c7ffe6'
          g.fillText('▲ SURVIVOR DEPOT', W - 8, WRECK_FORK.splitY - 8)
          g.fillStyle = '#ffb38a'
          g.fillText('▼ ARMORY', W - 8, WRECK_FORK.splitY + 16)
          g.restore()
        } else if (
          wreckRoute !== null &&
          frame >= WRECK_FORK.decideAt &&
          frame < WRECK_FORK.rejoinAt
        ) {
          // Solenne's forty-second boundary, counted down.
          g.save()
          g.font = '8px monospace'
          g.textAlign = 'right'
          g.fillStyle = wreckRoute === 'depot' ? '#c7ffe6' : '#ffb38a'
          g.fillText(
            `${wreckRoute === 'depot' ? `DEPOT · SURVIVORS ${podsSaved}` : 'ARMORY RAID'} · ${Math.ceil((WRECK_FORK.rejoinAt - frame) / 60)}s`,
            W - 8,
            H - 8,
          )
          g.restore()
        }
      }
      if (act === 3 && trenchDefeatedFrame === null) {
        const frame = trenchFrame()
        if (frame >= TRENCH_FORK.markFrom && frame < TRENCH_FORK.decideAt) {
          // The fork: a channel line with the vault above it and the safe passage below.
          g.save()
          g.globalAlpha = 0.6 + 0.25 * Math.sin(frame / 8)
          g.strokeStyle = '#ffe2fa'
          g.lineWidth = 1
          g.setLineDash([8, 6])
          g.beginPath()
          g.moveTo(W - 170, TRENCH_FORK.splitY)
          g.lineTo(W, TRENCH_FORK.splitY)
          g.stroke()
          g.setLineDash([])
          g.font = 'bold 9px monospace'
          g.textAlign = 'right'
          g.fillStyle = '#ffd36e'
          g.fillText('▲ SALVAGE VAULT', W - 8, TRENCH_FORK.splitY - 8)
          g.fillStyle = '#9ff3ff'
          g.fillText('▼ SAFE PASSAGE', W - 8, TRENCH_FORK.splitY + 16)
          g.restore()
        } else if (
          trenchRoute !== null &&
          frame >= TRENCH_FORK.decideAt &&
          frame < TRENCH_FORK.rejoinAt
        ) {
          g.save()
          g.font = '8px monospace'
          g.textAlign = 'right'
          g.fillStyle = trenchRoute === 'vault' ? '#ffd36e' : '#9ff3ff'
          g.fillText(
            trenchRoute === 'vault'
              ? 'ROUTE · SALVAGE VAULT'
              : 'ROUTE · SAFE PASSAGE',
            W - 8,
            H - 8,
          )
          g.restore()
        }
      }
      for (const popup of popups) {
        g.save()
        g.globalAlpha = Math.max(0, 1 - popup.age / POPUP_FRAMES)
        g.fillStyle = '#fff2a8'
        g.strokeStyle = '#2a1450'
        g.lineWidth = 3
        g.font = 'bold 9px monospace'
        g.textAlign = 'center'
        const y = Math.max(46, popup.y - popup.age * 0.4)
        g.strokeText(popup.text, Math.min(W - 40, popup.x), y)
        g.fillText(popup.text, Math.min(W - 40, popup.x), y)
        g.restore()
      }
      // Super cut-in: the newest burst's pilot slides in where comms sit, clear of the touch controls. A
      // super has just cleared every enemy shot, so the banner hides no threat while it plays.
      const cut = bursts[bursts.length - 1]
      if (cut) {
        const pilot = RAINBOW_PILOTS[cut.seat % RAINBOW_PILOTS.length]!
        const slide = Math.min(1, cut.age / 6)
        const x = 15 - (1 - slide) * 200
        // A ship flying under the banner stays visible through it.
        const covers = ships
          .slice(0, activePlayers)
          .some(
            (ship) =>
              ship.lives > 0 &&
              ship.x > x - 18 &&
              ship.x < x + 288 &&
              ship.y > commsTop - 18 &&
              ship.y < commsTop + 70,
          )
        g.save()
        g.globalAlpha =
          Math.max(
            0,
            Math.min(1, (BURST_FRAMES - cut.age) / CUTIN_FADE_FRAMES),
          ) * (covers ? 0.55 : 1)
        g.fillStyle = '#160b34ee'
        g.fillRect(x, commsTop, 270, 52)
        const artWidth = drawRainbowSuperCutin(
          g,
          cut.seat,
          x + 2,
          commsTop + 2,
          48,
        )
        g.strokeStyle = PILOT_COLORS[cut.seat]!
        g.lineWidth = 2
        g.strokeRect(x, commsTop, 270, 52)
        const textX = x + artWidth + 10
        g.fillStyle = '#fff4fa'
        g.font = 'bold 8px monospace'
        g.fillText(
          `P${cut.seat + 1} ${pilot.name.split(' ')[0]!.toUpperCase()}`,
          textX,
          commsTop + 17,
        )
        g.fillStyle = PILOT_COLORS[cut.seat]!
        g.font = 'bold 13px monospace'
        g.fillText(`${pilot.superName.toUpperCase()}!`, textX, commsTop + 34)
        g.restore()
      }
      if (continueLeft > 0) {
        const where =
          checkpoint.act === 1
            ? checkpointLabel(
                PINKWAKE_SECTIONS,
                PINKWAKE.bossStarts,
                checkpoint.frame,
              )
            : checkpoint.act === 2
              ? checkpointLabel(
                  MOONJELLY_SECTIONS,
                  MOONJELLY.bossStarts,
                  checkpoint.frame,
                )
              : checkpoint.act === 3
                ? checkpointLabel(
                    trenchSections(checkpoint.trenchRoute),
                    TRENCH.bossStarts,
                    checkpoint.frame,
                  )
                : checkpoint.act === 4
                  ? checkpointLabel(
                      ROSEFIN_SECTIONS,
                      ROSEFIN.bossStarts,
                      checkpoint.frame,
                    )
                  : checkpoint.act === 5
                    ? checkpointLabel(
                        WRECK_SECTIONS,
                        WRECK.bossStarts,
                        checkpoint.frame,
                      )
                    : checkpoint.act === 6
                      ? checkpointLabel(
                          CROWN_REEF_SECTIONS,
                          CROWN_REEF.bossStarts,
                          checkpoint.frame,
                        )
                      : checkpoint.act === 7
                        ? checkpointLabel(
                            GLASS_SECTIONS,
                            GLASS.bossStarts,
                            checkpoint.frame,
                          )
                        : checkpoint.act === 8
                          ? checkpointLabel(
                              PALACE_SECTIONS,
                              PALACE.bossStarts,
                              checkpoint.frame,
                            )
                          : escapeFrame !== null
                            ? 'Escape'
                            : checkpointLabel(
                                FINALE_SECTIONS,
                                FINALE.bossStarts,
                                checkpoint.frame,
                              )
        g.save()
        g.fillStyle = '#0c0620d0'
        g.fillRect(0, 0, W, H)
        g.textAlign = 'center'
        g.fillStyle = '#ffd2ef'
        g.font = 'bold 22px monospace'
        g.fillText('CONTINUE?', W / 2, 104)
        g.fillStyle = '#fff2a8'
        g.font = 'bold 40px monospace'
        g.fillText(String(continueSeconds(continueLeft)), W / 2, 148)
        g.fillStyle = '#e8ddff'
        g.font = 'bold 9px monospace'
        g.fillText(
          `PRESS A · ${ACT_NUMERALS[checkpoint.act - 1]} · ${where}`,
          W / 2,
          172,
        )
        g.font = '8px monospace'
        g.fillText(
          `SCORE RETURNS TO ${checkpoint.score}${continues ? ` · CONTINUES ${continues}` : ''}`,
          W / 2,
          186,
        )
        g.restore()
      }
      if (resumeMenu) {
        const saved = resumeMenu.save
        const won = Object.values(saved.medals)
        g.save()
        g.fillStyle = '#0c0620e0'
        g.fillRect(0, 0, W, H)
        g.textAlign = 'center'
        g.fillStyle = '#ffd2ef'
        g.font = 'bold 18px monospace'
        g.fillText('FLIGHT LOG', W / 2, 88)
        const lines = [
          `CONTINUE · ${ACT_NUMERALS[saved.checkpoint.act - 1]}`,
          'NEW FLIGHT · ACT I',
        ]
        lines.forEach((line, i) => {
          const picked = resumeMenu!.pick === i
          g.fillStyle = picked ? '#fff2a8' : '#9b8fc4'
          g.font = `bold ${picked ? 13 : 11}px monospace`
          g.fillText(`${picked ? '▶ ' : ''}${line}`, W / 2, 124 + i * 22)
        })
        g.fillStyle = '#e8ddff'
        g.font = '8px monospace'
        g.fillText(
          `SCORE ${Math.round(saved.checkpoint.score * RAINBOW_DIFFICULTY[saved.difficulty].score)} · ${RAINBOW_DIFFICULTY_NAMES[ARCADE_DIFFICULTIES.indexOf(saved.difficulty)]!.toUpperCase()} · MEDALS ${won.filter((m) => m === 'gold').length} GOLD ${won.filter((m) => m === 'silver').length} SILVER ${won.filter((m) => m === 'bronze').length} BRONZE`,
          W / 2,
          178,
        )
        g.fillText('UP / DOWN TO CHOOSE · A TO FLY', W / 2, 192)
        g.restore()
      }
    },
  }
}

const module: ArcadeGameModule = { create: createRainbowPrincessPreview }
export default module
export const create = createRainbowPrincessPreview
