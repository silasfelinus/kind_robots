// /utils/arcade/games/rainbowLoadouts.ts
//
// Rainbow Bullet Hell Space Princess, conductor rainbow t-010: the four ships' focused weapon families,
// the per-Act medals, the cabinet's mastery ladder, and the save a long campaign keeps at each checkpoint.
// Pure data and checks (no canvas), so the arcade registry can import the ladder.

import { ARCADE_DIFFICULTIES } from '../types'
import type { ArcadeDifficulty, ArcadeMasteryGoal } from '../types'
import type { RainbowCheckpoint } from './rainbowCheckpoints'
import { lighthouseCheckpointValid } from './rainbowSunkenLighthouse'
import { nurseryFlightCheckpointValid } from './rainbowLanternNursery'
import { mirrorShoalCheckpointValid } from './rainbowMirrorShoal'

/**
 * What each ship fires while its pilot holds B (WORLD-BIBLE ships). Unfocused fire stays each ship's wide
 * spread; focus trades it for the family's precise weapon.
 */
export const RAINBOW_LOADOUTS = [
  {
    ship: 'Petal Wing',
    focus: 'Rose Needle',
    special: 'Petal Shield',
    evade: 'Barrel Roll',
  },
  {
    ship: 'Prism Lance',
    focus: 'Prism Thread',
    special: 'Prism Beam',
    evade: 'Prism Dash',
  },
  {
    ship: 'Halo Fin',
    focus: 'Halo Link',
    special: 'Halo Pulse',
    evade: 'Halo Blink',
  },
  {
    ship: 'Comet Crown',
    focus: 'Comet Arc',
    special: 'Comet Volley',
    evade: 'Comet Boost',
  },
] as const

/**
 * The four-button cabinet (Silas, 2026-10-17: "a fire button, super button, unique special, and unique
 * movement evade"): X fires each pilot's special on a cooldown, Y her evade, which no pellet or craft can touch.
 */
export const RAINBOW_SPECIAL = {
  cooldown: 360,
  /** Maribel: petals orbit the ship and eat every pellet that reaches them. */
  shield: { frames: 150, radius: 26 },
  /** Azure: a beam down her lane, a piercing shot every few frames. */
  beam: { frames: 48, every: 3, speed: 16, damage: 1 },
  /** Solenne: a pulse that clears the pellets around her and hurts the craft it reaches. */
  pulse: { radius: 84, damage: 5 },
  /** Vivi: a fan of sparks that glance off the walls once. */
  volley: { count: 7, spread: 0.5, speed: 8, damage: 2 },
} as const
export const RAINBOW_EVADE = {
  cooldown: 84,
  /** Maribel: a barrel roll, untouchable while it spins. */
  roll: 30,
  /** Azure: a dash in the held direction (forward by default). */
  dash: { frames: 10, step: 6.5 },
  /** Solenne: a blink in the held direction (up by default), and a beat untouchable after. */
  blink: { reach: 56, safe: 22 },
  /** Vivi: a boost at double speed. */
  boost: { frames: 26, speed: 2 },
} as const

/** Focused fire, by seat (the World Bible's numbers; craft health is 1 to 12). */
export const RAINBOW_FOCUS = {
  /** Petal Wing: one fast needle that hits harder than the spray it replaces. */
  needle: { speed: 12, damage: 2, cooldown: 7 },
  /** Prism Lance: a thread that passes through this many craft before it stops. */
  thread: { speed: 11, damage: 2, pierce: 2, cooldown: 9 },
  /** Halo Fin: the two orbit drones fire inward and their shots cross this far ahead. */
  link: { speed: 9, offset: 9, crossAt: 72, cooldown: 8 },
  /** Comet Crown: two sparks thrown up and down that glance off the walls this many times. */
  arc: { speed: 9, rise: 2.6, bounces: 2, cooldown: 7 },
} as const

/** The cabinet's names for the three difficulties, easiest first. */
export const RAINBOW_DIFFICULTY_NAMES = ['Cadet', 'Pilot', 'Ace'] as const

export type RainbowMedal = 'gold' | 'silver' | 'bronze'

/** An Act's medal: gold for no hits, silver for no continues, bronze for clearing it at all. */
export function rainbowMedal(hits: number, continues: number): RainbowMedal {
  return hits === 0 ? 'gold' : continues === 0 ? 'silver' : 'bronze'
}

/** The three endings of the final choice, as mastery parts. */
export const RAINBOW_ENDING_PARTS = [
  'ending-restore',
  'ending-evacuate',
  'ending-sever',
] as const

/** The cabinet's mastery ladder (utils/arcade/mastery.ts), easiest first. */
export const RAINBOW_MASTERY: readonly ArcadeMasteryGoal[] = [
  {
    id: 'first-light',
    title: 'FIRST LIGHT',
    hint: 'Clear Act I, Pinkwake Estuary',
  },
  {
    id: 'gold-wing',
    title: 'GOLD WING',
    hint: 'Win a gold medal: clear an Act without a hit',
  },
  {
    id: 'the-end',
    title: 'THE END',
    hint: 'Fly the whole campaign to the Eclipse Crown and beyond',
  },
  {
    id: 'guardian-breaker',
    title: 'GUARDIAN BREAKER',
    hint: 'Defeat all eight Act guardians in one flight',
  },
  {
    id: 'no-one-left',
    title: 'NO ONE LEFT BEHIND',
    hint: 'Make every rescue in one flight, every captive included',
  },
  {
    id: 'every-ending',
    title: 'EVERY ENDING',
    hint: 'See all three endings of the final choice',
    parts: RAINBOW_ENDING_PARTS,
  },
  {
    id: 'ace-of-eclipse',
    title: 'ACE OF THE ECLIPSE',
    hint: 'Reach THE END at Ace difficulty',
    secret: true,
  },
]

/** The progress the cabinet keeps: the last checkpoint passed, at what difficulty, and how it went. */
export type RainbowSave = {
  v: 1
  difficulty: ArcadeDifficulty
  checkpoint: RainbowCheckpoint
  /** The Act guardians already met: defeated or escaped. */
  guardians: Partial<
    Record<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8, 'defeated' | 'escaped'>
  >
  /** Medals won so far, by Act. */
  medals: Partial<Record<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9, RainbowMedal>>
  /** P1's pilot (the select screen); older saves leave it out and fly Maribel. */
  pilot?: number
  /** Ordered crew identities, independent of local seat numbers; absent in older saves. */
  pilots?: number[]
}

/** Progress-only gallery state. Unvisited seas remain visible as silhouettes, not fake clears. */
export function rainbowSeaLogbook(
  save: RainbowSave | null,
  mastery: readonly string[],
  collectedMedals: Partial<
    Record<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8, RainbowMedal>
  > = {},
): { explored: boolean; medal: RainbowMedal | null; label: string }[] {
  const reached =
    save?.checkpoint.act ?? (mastery.includes('first-light') ? 2 : 1)
  return Array.from({ length: 8 }, (_, index) => {
    const act = index + 1
    const medal = collectedMedals[act as 1] ?? save?.medals[act as 1] ?? null
    const explored = act <= reached || medal !== null
    return {
      explored,
      medal,
      label: medal
        ? `${medal.toUpperCase()} MEDAL`
        : act === reached && save
          ? 'IN FLIGHT'
          : explored
            ? 'DISCOVERED'
            : 'UNDISCOVERED',
    }
  })
}

/** Route intel earned by actually flying each fork. Never infer a branch from Act reach alone. */
export function rainbowRouteIntel(
  save: RainbowSave | null,
): { act: number; label: string; discovered: boolean }[] {
  const checkpoint = save?.checkpoint
  return [
    {
      act: 3,
      label:
        checkpoint?.trenchRoute === 'vault'
          ? 'Vault passage'
          : checkpoint?.trenchRoute === 'safe'
            ? 'Safe passage'
            : 'Route undiscovered',
      discovered:
        checkpoint?.routeSettled === true &&
        (checkpoint.trenchRoute === 'vault' ||
          checkpoint.trenchRoute === 'safe'),
    },
    {
      act: 5,
      label:
        checkpoint?.wreckRoute === 'depot'
          ? 'Depot passage'
          : checkpoint?.wreckRoute === 'armory'
            ? 'Armory passage'
            : 'Route undiscovered',
      discovered:
        checkpoint?.wreckSettled === true &&
        (checkpoint.wreckRoute === 'depot' ||
          checkpoint.wreckRoute === 'armory'),
    },
    {
      act: 6,
      label:
        checkpoint?.reefRoute === 'relay'
          ? 'Relay passage'
          : checkpoint?.reefRoute === 'cache'
            ? 'Cache passage'
            : 'Route undiscovered',
      discovered:
        checkpoint?.reefSettled === true &&
        (checkpoint.reefRoute === 'relay' || checkpoint.reefRoute === 'cache'),
    },
  ].map((route) => {
    if (!route.discovered) return { ...route, label: 'Route undiscovered' }
    const outcome =
      route.act === 3 && checkpoint?.trenchRoute === 'safe'
        ? checkpoint.nurseryGuardianOutcome
        : route.act === 5 && checkpoint?.wreckRoute === 'armory'
          ? checkpoint.armoryGuardianOutcome
          : null
    const guardian =
      outcome === 'defeated'
        ? ' · Guardian defeated'
        : outcome === 'escaped'
          ? ' · Guardian escaped'
          : ''
    return { ...route, label: `${route.label}${guardian}` }
  })
}

const bool = (value: unknown) => typeof value === 'boolean'
const count = (value: unknown, max: number) =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= 0 &&
  value <= max
const oneOf = (value: unknown, choices: readonly unknown[]) =>
  choices.includes(value)

/**
 * A saved checkpoint, or null if `raw` is not one: the cabinet hands the save back untrusted, so every field
 * is checked and only a real checkpoint is ever continued from. `isCheckpoint` names the checkpoints the
 * campaign has (the engine passes its own); left out, only an Act start from Act II on is accepted.
 */
export function readRainbowSave(
  raw: unknown,
  isCheckpoint: (
    act: number,
    frame: number,
    c?: RainbowCheckpoint,
  ) => boolean = (act, frame) => act >= 2 && frame === 0,
): RainbowSave | null {
  if (!raw || typeof raw !== 'object') return null
  const save = raw as Record<string, unknown>
  if (save.v !== 1 || !oneOf(save.difficulty, ARCADE_DIFFICULTIES)) return null
  const c = save.checkpoint as Record<string, unknown> | null
  if (!c || typeof c !== 'object') return null
  if (!count(c.act, 9) || !count(c.frame, 1e6)) return null
  if (
    c.nurseryFrame !== undefined &&
    (!nurseryFlightCheckpointValid(
      c.act as number,
      c.frame as number,
      c as RainbowCheckpoint,
    ) ||
      !count(c.nurseryHits, 999))
  )
    return null
  if (
    c.nurseryFrame === undefined &&
    (c.nurseryStartedAt !== undefined || c.nurseryHits !== undefined)
  )
    return null
  if (
    c.nurseryFrame !== undefined &&
    (c.lighthouseFrame !== undefined || c.shoalFrame !== undefined)
  )
    return null
  if (
    c.lighthouseFrame !== undefined &&
    (!lighthouseCheckpointValid(
      c.act as number,
      c.frame as number,
      c as RainbowCheckpoint,
    ) ||
      !count(c.lighthouseLamps, 63) ||
      !count(c.lighthouseHits, 999) ||
      !oneOf(c.lighthouseGuardianOutcome, ['waiting', 'defeated', 'escaped']))
  )
    return null
  if (
    c.lighthouseFrame === undefined &&
    (c.lighthouseStartedAt !== undefined ||
      c.lighthouseLamps !== undefined ||
      c.lighthouseGuardianOutcome !== undefined ||
      c.lighthouseHits !== undefined)
  )
    return null
  if (c.lighthouseFrame !== undefined && c.shoalFrame !== undefined) return null
  if (
    c.shoalFrame !== undefined &&
    (!mirrorShoalCheckpointValid(
      c.act as number,
      c.frame as number,
      c as RainbowCheckpoint,
    ) ||
      !count(c.shoalHits, 999) ||
      !oneOf(c.shoalGuardianOutcome, ['waiting', 'defeated', 'escaped']))
  )
    return null
  if (c.shoalFrame === undefined && c.shoalStartedAt !== undefined) return null
  if (c.actContinues !== undefined && !count(c.actContinues, 999)) return null
  if (!isCheckpoint(c.act as number, c.frame as number, c as RainbowCheckpoint))
    return null
  if (!count(c.score, 1e9)) return null
  for (const key of [
    'rescuedStation',
    'rescuedNemi',
    'routeSettled',
    'rescuedCourier',
    'wreckSettled',
    'reefSettled',
    'rescuedNavigator',
  ])
    if (!bool(c[key])) return null
  if (!oneOf(c.trenchRoute, ['vault', 'safe', null])) return null
  if (
    !oneOf(c.nurseryGuardianOutcome, [
      'waiting',
      'defeated',
      'escaped',
      undefined,
    ])
  )
    return null
  if (!oneOf(c.wreckRoute, ['depot', 'armory', null])) return null
  if (
    !oneOf(c.armoryGuardianOutcome, [
      'waiting',
      'defeated',
      'escaped',
      undefined,
    ])
  )
    return null
  if (!oneOf(c.reefRoute, ['relay', 'cache', null])) return null
  if (
    !oneOf(c.pearlWardenOutcome, ['waiting', 'defeated', 'escaped', undefined])
  )
    return null
  if (!oneOf(c.allegiance, ['rebel', 'loyal', null, undefined])) return null
  for (const key of [
    'podsSaved',
    'pylonsDown',
    'captivesFreed',
    'schoolBonuses',
  ])
    if (!count(c[key], 999)) return null
  const guardians: RainbowSave['guardians'] = {}
  if (save.guardians && typeof save.guardians === 'object')
    for (const [act, outcome] of Object.entries(save.guardians)) {
      const n = Number(act)
      if (n >= 1 && n <= 8 && (outcome === 'defeated' || outcome === 'escaped'))
        guardians[n as 1] = outcome
    }
  const medals: RainbowSave['medals'] = {}
  if (save.medals && typeof save.medals === 'object')
    for (const [act, medal] of Object.entries(save.medals)) {
      const n = Number(act)
      if (n >= 1 && n <= 9 && oneOf(medal, ['gold', 'silver', 'bronze']))
        medals[n as 1] = medal as RainbowMedal
    }
  const selectedPilots =
    Array.isArray(save.pilots) &&
    save.pilots.length >= 1 &&
    save.pilots.length <= 4 &&
    save.pilots.every((pilot) => count(pilot, 3)) &&
    new Set(save.pilots).size === save.pilots.length &&
    (!count(save.pilot, 3) || save.pilots[0] === save.pilot)
      ? (save.pilots as number[])
      : null
  const saved = c as RainbowCheckpoint
  return {
    v: 1,
    difficulty: save.difficulty as ArcadeDifficulty,
    // Only the checkpoint's own fields come back in.
    checkpoint: {
      act: saved.act,
      frame: saved.frame,
      score: saved.score,
      rescuedStation: saved.rescuedStation,
      rescuedNemi: saved.rescuedNemi,
      trenchRoute: saved.trenchRoute,
      routeSettled: saved.routeSettled,
      nurseryGuardianOutcome: saved.nurseryGuardianOutcome ?? 'waiting',
      ...(saved.nurseryFrame !== undefined
        ? {
            nurseryStartedAt: saved.nurseryStartedAt,
            nurseryFrame: saved.nurseryFrame,
            nurseryHits: saved.nurseryHits,
          }
        : {}),
      rescuedCourier: saved.rescuedCourier,
      wreckRoute: saved.wreckRoute,
      armoryGuardianOutcome:
        saved.armoryGuardianOutcome ?? (saved.act > 5 ? 'escaped' : 'waiting'),
      pearlWardenOutcome:
        saved.pearlWardenOutcome ?? (saved.act > 6 ? 'escaped' : 'waiting'),
      wreckSettled: saved.wreckSettled,
      podsSaved: saved.podsSaved,
      reefRoute: saved.reefRoute,
      reefSettled: saved.reefSettled,
      pylonsDown: saved.pylonsDown,
      rescuedNavigator: saved.rescuedNavigator,
      ...(saved.actContinues !== undefined
        ? { actContinues: saved.actContinues }
        : {}),
      ...(saved.lighthouseFrame !== undefined
        ? {
            lighthouseStartedAt: saved.lighthouseStartedAt,
            lighthouseFrame: saved.lighthouseFrame,
            lighthouseLamps: saved.lighthouseLamps,
            lighthouseGuardianOutcome: saved.lighthouseGuardianOutcome,
            lighthouseHits: saved.lighthouseHits,
          }
        : {}),
      ...(saved.shoalFrame !== undefined
        ? {
            shoalStartedAt: saved.shoalStartedAt,
            shoalFrame: saved.shoalFrame,
            shoalGuardianOutcome: saved.shoalGuardianOutcome,
            shoalHits: saved.shoalHits,
          }
        : {}),
      captivesFreed: saved.captivesFreed,
      allegiance: saved.allegiance ?? null,
      schoolBonuses: saved.schoolBonuses,
    },
    guardians,
    medals,
    ...(count(save.pilot, 3) ? { pilot: save.pilot as number } : {}),
    ...(selectedPilots ? { pilots: [...selectedPilots] } : {}),
  }
}
