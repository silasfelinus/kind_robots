import {
  BRIAR_CROSS_MAP_KEYS,
  BRIAR_CROSS_MAP_PUZZLES,
} from '../memoryDungeonWaves'

export type CrossMapSealKey = (typeof BRIAR_CROSS_MAP_KEYS)[number]
export type SealInspectionWorld = 'e01' | 'e02'
export interface CrossMapSealChronicle {
  version: 1
  /** A named first-map position has been identified, independently of solving it. */
  seen: CrossMapSealKey[]
  /** The original first-world monument has been examined in person. */
  inspected: CrossMapSealKey[]
  /** A changed representation of the same landmark was examined in Dark Briar. */
  mirrorSeen: CrossMapSealKey[]
  /** Its geographically separate future counterpart was visited and examined. */
  counterpartSeen: CrossMapSealKey[]
  /** Actual counterpart puzzle solved; never unlocked by early inspection. */
  matched: CrossMapSealKey[]
  /** Final multi-world puzzle accepted a previously matched seal. */
  resolved: CrossMapSealKey[]
}

export const FIRST_MAP_SEAL_RECOVERY: Readonly<
  Record<CrossMapSealKey, { earthClue: string; alteredEarthClue: string }>
> = {
  '5,2': {
    earthClue: 'A pressed leaf in an office notebook has a split vein exactly matching the northern Briar sigil.',
    alteredEarthClue: 'A mirrored root grows around a train-station sign with the same asymmetric leaf.',
  },
  '1,1': {
    earthClue: 'An old star chart marks a seven-point northern star with one point missing.',
    alteredEarthClue: 'Two different north stars appear above the altered city; one bears the old stone notch.',
  },
  '8,1': {
    earthClue: 'A photograph of a migrating gull reveals the absent feather in the northeastern marker.',
    alteredEarthClue: 'The enchanted birds cast paired feather shadows over a northeastern route.',
  },
  '8,8': {
    earthClue: 'An ordinary transit-tunnel cable is knotted exactly like the southeast Briar root.',
    alteredEarthClue: 'Living underground roots braid around the cable in the opposite direction.',
  },
}

export function newCrossMapSealChronicle(): CrossMapSealChronicle {
  return {
    version: 1,
    seen: [],
    inspected: [],
    mirrorSeen: [],
    counterpartSeen: [],
    matched: [],
    resolved: [],
  }
}

const valid = (value: unknown): CrossMapSealKey[] =>
  Array.isArray(value)
    ? [
        ...new Set(
          value.filter(
            (key): key is CrossMapSealKey =>
              typeof key === 'string' &&
              (BRIAR_CROSS_MAP_KEYS as readonly string[]).includes(key),
          ),
        ),
      ]
    : []

export function restoreCrossMapSealChronicle(value: unknown): CrossMapSealChronicle {
  const initial = newCrossMapSealChronicle()
  if (!value || typeof value !== 'object') return initial
  const old = value as Partial<CrossMapSealChronicle>
  const inspected = valid(old.inspected)
  const mirrorSeen = valid(old.mirrorSeen)
  const seen = [...new Set([...valid(old.seen), ...inspected, ...mirrorSeen])]
  const counterpartSeen = valid(old.counterpartSeen)
  const matched = valid(old.matched).filter((key) => counterpartSeen.includes(key) && inspected.includes(key))
  const resolved = valid(old.resolved).filter((key) => matched.includes(key))
  return { version: 1, seen, inspected, mirrorSeen, counterpartSeen, matched, resolved }
}

export function inspectCrossMapSeal(
  chronicle: CrossMapSealChronicle,
  key: string,
  world: SealInspectionWorld,
): CrossMapSealChronicle {
  if (!(BRIAR_CROSS_MAP_KEYS as readonly string[]).includes(key)) return chronicle
  const seal = key as CrossMapSealKey
  return {
    ...chronicle,
    seen: [...new Set([...chronicle.seen, seal])],
    inspected:
      world === 'e01'
        ? [...new Set([...chronicle.inspected, seal])]
        : chronicle.inspected,
    mirrorSeen:
      world === 'e02'
        ? [...new Set([...chronicle.mirrorSeen, seal])]
        : chronicle.mirrorSeen,
  }
}

export function crossMapSealProgress(chronicle: CrossMapSealChronicle) {
  return {
    identified: chronicle.seen.length,
    originalInspected: chronicle.inspected.length,
    reflected: chronicle.mirrorSeen.length,
    matched: chronicle.matched.length,
    resolved: chronicle.resolved.length,
    total: BRIAR_CROSS_MAP_KEYS.length,
  }
}

export function missingFirstMapSeals(chronicle: CrossMapSealChronicle) {
  return BRIAR_CROSS_MAP_KEYS.filter((key) => !chronicle.inspected.includes(key)).map(
    (key) => ({
      key,
      title: BRIAR_CROSS_MAP_PUZZLES[key].title,
      coordinate: key,
      destination: BRIAR_CROSS_MAP_PUZZLES[key].counterpart,
      earthClue: FIRST_MAP_SEAL_RECOVERY[key].earthClue,
      alteredEarthClue: FIRST_MAP_SEAL_RECOVERY[key].alteredEarthClue,
    }),
  )
}

/** Future e04 implementation gate: completion of that experience must require
 * four original-world inspections, with a playable revisit for anything missed.
 * This function only checks discovery and never grants it automatically. */
export function firstMapRecoveryComplete(chronicle: CrossMapSealChronicle): boolean {
  return BRIAR_CROSS_MAP_KEYS.every((key) => chronicle.inspected.includes(key))
}
