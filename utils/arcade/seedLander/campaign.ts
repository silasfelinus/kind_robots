// /utils/arcade/seedLander/campaign.ts
//
// The Great Replanting's progress (conductor kr-arcade/t-070): where the campaign got to (the
// island and the mission to resume at), the nectar earned in play and what it bought at the Pod
// Shed, the golden acorns found, each mission's medals, and Free Flight's best hill. Saved on this
// device through utils/arcade/saves.ts; a stored save is untrusted, so it is validated field by
// field and anything unusable is dropped.

import type { TierId } from './flight'
import { TIER_ORDER } from './flight'
import type { MissionSpec } from './missions'

/** The Pod Shed's upgrades. */
export type UpgradeId = 'tank' | 'legs' | 'gyros' | 'lamp' | 'winch'
export const UPGRADES: ReadonlyArray<{
  id: UpgradeId
  name: string
  about: string
}> = [
  { id: 'tank', name: 'SUN TANK', about: '+15% SUN EVERY MISSION' },
  { id: 'legs', name: 'SPRINGY LEGS', about: 'BUMPY LANDINGS FORGIVE MORE' },
  { id: 'gyros', name: 'STEADY GYROS', about: 'LEAN FASTER, LEVEL ITSELF' },
  { id: 'lamp', name: 'BRIGHT LAMP', about: 'SEE FURTHER IN THE CAVES' },
  { id: 'winch', name: 'LONG WINCH', about: 'A LONGER TETHER LINE' },
]
export const UPGRADE_MAX = 3
/** Nectar for the next level of an upgrade at `level`. */
export function upgradeCost(level: number): number {
  return 8 * (level + 1)
}

/** What each upgrade level does. */
export const UPGRADE_EFFECT = {
  /** Sun budget times 1 + this per level. */
  tank: 0.15,
  /** Bumpy tolerance plus this per level. */
  legs: 0.25,
  /** Lean speed times 1 + this per level. */
  gyros: 0.18,
  /** Cave light radius plus this per level. */
  lamp: 14,
  /** Tether line plus this per level. */
  winch: 8,
} as const

export type Shed = Record<UpgradeId, number>
export function emptyShed(): Shed {
  return { tank: 0, legs: 0, gyros: 0, lamp: 0, winch: 0 }
}

/** Medals per mission, as bits. */
export const MEDAL = { feather: 1, thrifty: 2, swift: 4 } as const

/** A Seed Lander save. */
export type LanderSave = {
  v: 1
  /** An active campaign checkpoint, distinct from a Free Flight-only profile. */
  campaignStarted?: boolean
  tier: TierId
  /** The island and the mission in it to resume at (mission 5 is the boss). */
  island: number
  mission: number
  score: number
  lives: number
  nectar: number
  shed: Shed
  /** Golden acorns found, by id. */
  acorns: string[]
  /** Medal bits by mission id. */
  medals: Record<string, number>
  /** Islands whose boss has been beaten. */
  cleared: number[]
  /** Free Flight's furthest hill. */
  bestHill: number
  /** Gale Season rounds begun (New Game+ after the true ending); 0 on the first run. */
  gale?: number
}

export const GALE_MAX = 9

/**
 * Gale Season: the whole campaign again with the sky turned up. Each round adds wind, weight and
 * a little gravity to every mission; the gust ceiling grows with it, and bosses ride the same
 * gravity. Round 0 returns the mission untouched.
 */
export function galeMission(spec: MissionSpec, gale: number): MissionSpec {
  const n = Math.max(0, Math.min(GALE_MAX, Math.floor(gale)))
  if (n === 0) return spec
  return {
    ...spec,
    wind: Math.min(0.012, spec.wind * (1 + 0.4 * n) + 0.0005 * n),
    gravity: (spec.gravity ?? 1) * (1 + 0.03 * n),
  }
}

export function freshSave(tier: TierId = 'standard'): LanderSave {
  return {
    v: 1,
    campaignStarted: false,
    tier,
    island: 0,
    mission: 0,
    score: 0,
    lives: 3,
    nectar: 0,
    shed: emptyShed(),
    acorns: [],
    medals: {},
    cleared: [],
    bestHill: 0,
    gale: 0,
  }
}

const ID = /^[a-z0-9-]{1,32}$/

/**
 * A stored save, checked against this build: null when unusable. `islands` is how many islands
 * the build has (a save may point one past the last, waiting for more islands).
 */
export function readLanderSave(
  raw: unknown,
  islands: number,
  missionsPer: number,
): LanderSave | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const r = raw as Record<string, unknown>
  const count = (v: unknown, max: number) =>
    typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= max
  if (r.v !== 1) return null
  if (r.campaignStarted !== undefined && typeof r.campaignStarted !== 'boolean')
    return null
  if (!TIER_ORDER.includes(r.tier as TierId)) return null
  if (!count(r.island, islands) || !count(r.mission, missionsPer - 1))
    return null
  if (!count(r.score, 249_999_999) || !count(r.lives, 9) || r.lives === 0)
    return null
  if (!count(r.nectar, 99_999) || !count(r.bestHill ?? 0, 9_999)) return null
  const shed = emptyShed()
  if (r.shed && typeof r.shed === 'object') {
    const s = r.shed as Record<string, unknown>
    for (const u of UPGRADES)
      if (count(s[u.id], UPGRADE_MAX)) shed[u.id] = s[u.id] as number
  }
  const acorns = Array.isArray(r.acorns)
    ? [
        ...new Set(
          r.acorns.filter(
            (a): a is string => typeof a === 'string' && ID.test(a),
          ),
        ),
      ].slice(0, 64)
    : []
  const medals: Record<string, number> = {}
  if (r.medals && typeof r.medals === 'object' && !Array.isArray(r.medals))
    for (const [id, bits] of Object.entries(r.medals))
      if (ID.test(id) && count(bits, 7)) medals[id] = bits as number
  const cleared = Array.isArray(r.cleared)
    ? [...new Set(r.cleared.filter((i): i is number => count(i, islands)))]
    : []
  return {
    v: 1,
    // Legacy v1 saves had no marker. Campaign-only position/resources can recover a
    // first mission; permanent acorns/medals and Free Flight best alone cannot.
    campaignStarted:
      typeof r.campaignStarted === 'boolean'
        ? r.campaignStarted
        : (r.island as number) > 0 ||
          (r.mission as number) > 0 ||
          (r.nectar as number) > 0 ||
          Object.values(shed).some((n) => n > 0) ||
          cleared.length > 0,
    tier: r.tier as TierId,
    island: r.island as number,
    mission: r.mission as number,
    score: r.score as number,
    lives: r.lives as number,
    nectar: r.nectar as number,
    shed,
    acorns,
    medals,
    cleared,
    bestHill: (r.bestHill as number | undefined) ?? 0,
    gale: count(r.gale, GALE_MAX) ? (r.gale as number) : 0,
  }
}

/** How many medals a bit set holds. */
export function medalCount(bits: number): number {
  return (bits & 1) + ((bits >> 1) & 1) + ((bits >> 2) & 1)
}
