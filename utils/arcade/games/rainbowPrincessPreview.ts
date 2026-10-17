import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'
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
const ACT_NUMERALS = ['ACT I', 'ACT II', 'ACT III', 'ACT IV'] as const
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
}

/** A pistol bubble bursts into an eight-pellet ring; an angler lure into a four-way cross. */
function burstShots(bullet: EnemyShot): EnemyShot[] {
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
}
type Reef = {
  x: number
  y: number
  phase: number
  health: number
  kind: PinkwakeEnemy | MoonjellyEnemy | TrenchEnemy | RosefinEnemy
  fired: boolean
  /**
   * A clawstrike's lane mark, a dolphin's beacon, a courier's cargo flicker or an eel's barrier warning:
   * frames left before it acts.
   */
  charge?: number
  /** A dolphin's lane before it dives, and frames since its dive began. */
  homeY?: number
  dive?: number
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
  burst?: 'ring' | 'cross'
  /** Wall glances left for a glassfin skate pellet. */
  bounces?: number
}
type Pickup = { x: number; y: number; kind: 'power' | 'shield' | 'charge' }
type GuardianOutcome = 'waiting' | 'defeated' | 'escaped'

export type RainbowCombatSnapshot = {
  tick: number
  score: number
  ships: ReadonlyArray<Readonly<Ship>>
  shots: ReadonlyArray<Readonly<Shot>>
  enemies: ReadonlyArray<Readonly<Reef>>
  enemyShots: ReadonlyArray<Readonly<EnemyShot>>
  pickups: ReadonlyArray<Readonly<Pickup>>
  act: 'S01' | 'S02' | 'S03' | 'S04'
  stage:
    | ReturnType<typeof pinkwakeStage>
    | ReturnType<typeof moonjellyStage>
    | ReturnType<typeof trenchStage>
    | ReturnType<typeof rosefinStage>
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
    | null
  boss: Readonly<PinkwakeBoss> | null
  moonBoss: Readonly<MoonjellyBoss> | null
  clawBoss: Readonly<ClawburstBoss> | null
  delphion: Readonly<DelphionBoss> | null
  guardian: Readonly<RainbowGuardian> | null
  /** Each Act's guardian: still to come (or in play), destroyed, or escaped. */
  guardians: Readonly<Record<1 | 2 | 3 | 4, GuardianOutcome>>
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
  const createShip = (seat: number): Ship => ({
    x: 65,
    y: 80 + seat * 32,
    shield: 3,
    cooldown: 0,
    invulnerable: 120,
    power: 1,
    charge: 0,
    graze: 0,
    lives: 3,
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
  const guardians: Record<1 | 2 | 3 | 4, GuardianOutcome> = {
    1: 'waiting',
    2: 'waiting',
    3: 'waiting',
    4: 'waiting',
  }
  const guardianSections = {
    1: PINKWAKE_GUARDIAN,
    2: MOONJELLY_GUARDIAN,
    3: TRENCH_GUARDIAN,
    4: ROSEFIN_GUARDIAN,
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
    schoolBonuses: 0,
  }
  let continueLeft = 0
  let continues = 0
  const popups: Array<{ x: number; y: number; text: string; age: number }> = []
  function moonFrame() {
    return moonStart === null ? 0 : tick - moonStart
  }
  function trenchFrame() {
    return trenchStart === null ? 0 : tick - trenchStart
  }
  function rosefinFrame() {
    return rosefinStart === null ? 0 : tick - rosefinStart
  }
  function currentAct(): 1 | 2 | 3 | 4 {
    return rosefinStart !== null
      ? 4
      : trenchStart !== null
        ? 3
        : moonStart !== null
          ? 2
          : 1
  }
  /** The Act's own clock: Act I runs on the global tick, later Acts count from their first frame. */
  function actFrame(act: 1 | 2 | 3 | 4) {
    return act === 1
      ? tick
      : act === 2
        ? moonFrame()
        : act === 3
          ? trenchFrame()
          : rosefinFrame()
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
    kind: PinkwakeEnemy | MoonjellyEnemy | TrenchEnemy | RosefinEnemy,
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
      health: coopEnemyHealth(BASE_HEALTH[kind] ?? 5, activePlayers),
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
      (reef.wave >= ROSEFIN.waveBase
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
  function passCheckpoint(act: 1 | 2 | 3 | 4, frame: number) {
    if (
      !(
        act === 1
          ? ACT_ONE_CHECKPOINTS
          : act === 2
            ? ACT_TWO_CHECKPOINTS
            : act === 3
              ? ACT_THREE_CHECKPOINTS
              : ACT_FOUR_CHECKPOINTS
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
      schoolBonuses,
    }
    if (frame > 0) popups.push({ x: W / 2, y: 74, text: 'CHECKPOINT', age: 0 })
  }

  /**
   * Continue: rewind the Act clock to the last checkpoint so its authored waves replay, restore every
   * seated pilot, and put the score back where the checkpoint found it. A crew that falls after the boss
   * is already beaten keeps its clear and simply relaunches.
   */
  function resumeFromCheckpoint() {
    continueLeft = 0
    continues++
    const cleared =
      checkpoint.act === 1
        ? defeatedAt !== null
        : checkpoint.act === 2
          ? moonDefeatedFrame !== null
          : checkpoint.act === 3
            ? trenchDefeatedFrame !== null
            : rosefinDefeatedFrame !== null
    if (!cleared) {
      const waves: ReadonlyArray<{ at: number }> =
        checkpoint.act === 1
          ? PINKWAKE_WAVES
          : checkpoint.act === 2
            ? MOONJELLY_WAVES
            : checkpoint.act === 3
              ? TRENCH_ALL_WAVES
              : ROSEFIN_WAVES
      const base =
        checkpoint.act === 1
          ? 0
          : checkpoint.act === 2
            ? MOONJELLY.waveBase
            : checkpoint.act === 3
              ? TRENCH.waveBase
              : ROSEFIN.waveBase
      waves.forEach((entry, index) => {
        const id = base + index
        if (entry.at >= checkpoint.frame) {
          waveSpawned.delete(id)
          waveLeft.delete(id)
          brokenWaves.delete(id)
        } else if ((waveLeft.get(id) ?? 0) > 0) brokenWaves.add(id)
      })
      tick = resumeTick(checkpoint, moonStart, trenchStart, rosefinStart)
      // A guardian whose section lies after the checkpoint flies again; one already behind it does not.
      guardian = null
      if (checkpoint.frame <= guardianSections[checkpoint.act].from)
        guardians[checkpoint.act] = 'waiting'
      if (boss) bossCarryHp = boss.hp
      if (moonBoss) moonBossCarryHp = moonBoss.hp
      if (clawBoss) clawBossCarryHp = clawBoss.hp
      if (delphion) delphionCarryHp = delphion.hp
      boss = null
      moonBoss = null
      clawBoss = null
      delphion = null
      escort = null
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

  function fire(ship: Ship, seat: number) {
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
    if (guardian && guardian.frame > 60) {
      guardian.hp -= seat === 1 ? 28 : 20
      if (guardian.hp <= 0) defeatGuardian(seat)
    }
    for (let i = reefs.length - 1; i >= 0; i--) {
      const reef = reefs[i]!
      if (seat === 1 && reef.x < ship.x) continue
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
    if (reef.kind === 'eel') return
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
    act: 1 | 2 | 3 | 4,
    frame: number,
    section: RainbowGuardianSection,
  ) {
    if (guardian || guardians[act] !== 'waiting') return
    if (
      frame >= section.from &&
      frame < section.to - RAINBOW_GUARDIAN.escapeLead
    )
      guardian = createRainbowGuardian(section.kind, activePlayers)
  }

  function defeatGuardian(seat: number) {
    if (!guardian) return
    const { x, y } = guardian
    guardian = null
    guardians[currentAct()] = 'defeated'
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
        boss = createPinkwakeBoss(rainbowBossHp(BOSS_MAX_HP, activePlayers))
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
        moonBoss = createMoonjellyBoss(
          rainbowBossHp(AURELIA_MAX_HP, activePlayers),
        )
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
        clawBoss = createClawburstBoss(
          rainbowBossHp(CLAWBURST_MAX_HP, activePlayers),
        )
        if (clawBossCarryHp !== null)
          clawBoss.hp = Math.min(clawBoss.hp, clawBossCarryHp)
      }
    } else {
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
        delphion = createDelphionBoss(
          rainbowBossHp(DELPHION_MAX_HP, activePlayers),
        )
        if (delphionCarryHp !== null)
          delphion.hp = Math.min(delphion.hp, delphionCarryHp)
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
    if (guardian) {
      const act = currentAct()
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
      bullet.x += bullet.vx
      bullet.y += bullet.vy
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
      const hitIndex = reefs.findIndex((reef) =>
        reef.kind === 'eel'
          ? Math.abs(reef.x - shot.x) < 8 &&
            Math.abs(reef.y - shot.y) < EEL.half + 6
          : Math.abs(reef.x - shot.x) < 14 && Math.abs(reef.y - shot.y) < 13,
      )
      if (hitIndex >= 0) {
        shots.splice(si, 1)
        const reef = reefs[hitIndex]!
        // An eel's body soaks shots; only its bright ends take damage.
        if (
          reef.kind === 'eel' &&
          Math.abs(shot.y - reef.y) < EEL.half - EEL.endReach
        )
          continue
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
    }

    for (let ei = reefs.length - 1; ei >= 0; ei--) {
      const reef = reefs[ei]!
      if (reef.x < -25) {
        if (reef.wave !== null) brokenWaves.add(reef.wave)
        reefs.splice(ei, 1)
        continue
      }
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
    get score() {
      return score
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
    setPlayers,
    get snapshot(): RainbowCombatSnapshot {
      return {
        tick,
        score,
        ships: ships.slice(0, activePlayers).map((ship) => ({ ...ship })),
        activePlayers,
        shots: shots.map((shot) => ({ ...shot })),
        enemies: reefs.map((reef) => ({ ...reef })),
        enemyShots: enemyShots.map((bullet) => ({ ...bullet })),
        pickups: pickups.map((pickup) => ({ ...pickup })),
        act: (['S01', 'S02', 'S03', 'S04'] as const)[currentAct() - 1]!,
        stage:
          currentAct() === 1
            ? pinkwakeStage(tick, defeatedAt)
            : currentAct() === 2
              ? moonjellyStage(moonFrame(), moonDefeatedFrame)
              : currentAct() === 3
                ? trenchStage(trenchFrame(), trenchDefeatedFrame)
                : rosefinStage(rosefinFrame(), rosefinDefeatedFrame),
        sceneId:
          currentAct() === 1
            ? (pinkwakeScene(tick, defeatedAt)?.id ?? null)
            : currentAct() === 2
              ? (moonjellyScene(moonFrame(), moonDefeatedFrame)?.id ?? null)
              : currentAct() === 3
                ? (trenchScene(trenchFrame(), trenchDefeatedFrame)?.id ?? null)
                : (rosefinScene(rosefinFrame(), rosefinDefeatedFrame)?.id ??
                  null),
        boss: boss ? { ...boss } : null,
        moonBoss: moonBoss ? { ...moonBoss } : null,
        clawBoss: clawBoss ? { ...clawBoss } : null,
        delphion: delphion ? { ...delphion } : null,
        guardian: guardian ? { ...guardian } : null,
        guardians: { ...guardians },
        rescuedNemi,
        trenchRoute,
        securedSalvage: trenchRoute === 'vault' && routeSettled,
        actTwoFrame: moonFrame(),
        actThreeFrame: trenchFrame(),
        actFourFrame: rosefinFrame(),
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
      if (rosefinStart !== null) {
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
        (['s01', 's02', 's03', 's04'] as const)[currentAct() - 1]!,
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
        g.save()
        g.translate(reef.x, reef.y)
        if (reef.kind === 'eel') g.rotate(-Math.PI / 2)
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
        if (!drawRainbowEnemySprite(g, reef.kind)) {
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
          guardian.kind === 'clawstrike' &&
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
          if (!drawRainbowEnemySprite(g, guardian.kind)) {
            g.fillStyle =
              guardian.kind === 'urchin'
                ? '#d09ffd'
                : guardian.kind === 'lantern'
                  ? '#afffea'
                  : guardian.kind === 'courier'
                    ? '#ffd1ec'
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
        g.fillRect(shot.x, shot.y - 2, 12, 4)
        g.fillStyle = '#fff'
        g.fillRect(shot.x + 8, shot.y - 1, 5, 2)
      }
      for (let seat = 0; seat < activePlayers; seat++) {
        const ship = ships[seat]!
        if (
          ship.lives <= 0 ||
          (ship.invulnerable && Math.floor(tick / 6) % 2 === 0)
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
        const stage = (['s01', 's02', 's03', 's04'] as const)[act - 1]!
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
              : rosefinScene(rosefinFrame(), rosefinDefeatedFrame)
      const dialogue = scene
        ? act === 4
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
      } else if (
        rosefinDefeatedFrame !== null &&
        rosefinFrame() - rosefinDefeatedFrame >= ROSEFIN.aftermathFrames
      ) {
        // ACT-STRUCTURE: Act IV runs straight on into the wreckage; Act V is still to come.
        g.fillStyle = '#180d38d9'
        g.fillRect(40, commsTop, W - 80, 33)
        g.fillStyle = '#ffd1ec'
        g.textAlign = 'center'
        g.font = 'bold 11px monospace'
        g.fillText(
          'DELPHION UNCOUPLED · ACT IV PREVIEW CLEAR',
          W / 2,
          commsTop + 19,
        )
        g.font = '8px monospace'
        g.fillText(
          `${rescuedCourier ? 'Courier safe' : 'Courier lost'} · Blossom Wreckyard (Act V) in production`,
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
                : checkpointLabel(
                    ROSEFIN_SECTIONS,
                    ROSEFIN.bossStarts,
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
    },
  }
}

const module: ArcadeGameModule = { create: createRainbowPrincessPreview }
export default module
export const create = createRainbowPrincessPreview
