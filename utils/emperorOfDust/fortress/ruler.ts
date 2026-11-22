// Emperor of Dust t-075: a light ruler creator. No portrait (the art only
// ever shows a gloved forearm); identity lives mostly in follower choices.
// The player picks a name, a style of address and a temperament at New Reign.
// Only a handful of interface strings read the title; authored prose keeps
// "Your Majesty".
import { RULER_ADDRESSES, RULER_TEMPERAMENTS } from './types'
import type {
  FortressRun,
  KingdomFactionId,
  LocalFactionId,
  RulerAddress,
  RulerIdentity,
  RulerTemperament,
} from './types'

export const RULER_NAME_MAX = 24

export const DEFAULT_RULER: Readonly<RulerIdentity> = Object.freeze({
  address: 'emperor',
  temperament: 'none',
})

export const RULER_TITLES: Record<RulerAddress, string> = {
  emperor: 'Emperor',
  empress: 'Empress',
  sovereign: 'Sovereign',
}

export type TemperamentNudge = {
  brass?: number
  local?: Partial<Record<LocalFactionId, number>>
  affinity?: Partial<Record<KingdomFactionId, number>>
}

export type TemperamentDef = {
  id: RulerTemperament
  label: string
  /** What the court notices on Day 1, shown beside the choice. */
  description: string
  nudge: TemperamentNudge
}

/**
 * Each temperament trades a little standing for a little standing elsewhere,
 * applied once at the start of the reign. 'none' is today's start exactly.
 */
export const TEMPERAMENTS: Record<RulerTemperament, TemperamentDef> = {
  none: {
    id: 'none',
    label: 'None',
    description: 'No reputation yet. The court will make up its own mind.',
    nudge: {},
  },
  merciful: {
    id: 'merciful',
    label: 'Merciful',
    description: 'Yard +2 and Abbey +2; the Gate Watch −2 doubts a soft hand.',
    nudge: {
      local: { yard: 2, 'gate-watch': -2 },
      affinity: { abbey: 2 },
    },
  },
  iron: {
    id: 'iron',
    label: 'Iron',
    description: 'Gate Watch +2 and Jackalwire +2; the Yard −2 fears the lash.',
    nudge: {
      local: { 'gate-watch': 2, yard: -2 },
      affinity: { jackalwire: 2 },
    },
  },
  cunning: {
    id: 'cunning',
    label: 'Cunning',
    description: '+10 brass in the strongbox; the Lamplight Archive −2.',
    nudge: { brass: 10, local: { lamplight: -2 } },
  },
}

const NAME_DROP = /[^\p{L}\p{M} '’.-]/gu

/**
 * A ruler's name as the court will write it: letters, spaces and '-. only,
 * single-spaced, trimmed, at most 24 characters. Empty when nothing usable
 * remains (no letter at all).
 */
export const sanitizeRulerName = (raw: unknown): string => {
  if (typeof raw !== 'string') return ''
  const cleaned = raw
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .replace(NAME_DROP, '')
    .replace(/ {2,}/g, ' ')
    .trim()
    .slice(0, RULER_NAME_MAX)
    .trim()
  return /\p{L}/u.test(cleaned) ? cleaned : ''
}

const isAddress = (value: unknown): value is RulerAddress =>
  (RULER_ADDRESSES as readonly unknown[]).includes(value)

const isTemperament = (value: unknown): value is RulerTemperament =>
  (RULER_TEMPERAMENTS as readonly unknown[]).includes(value)

/** Any input, from the form or an old save, as a clean identity. */
export const normalizeRuler = (value: unknown): RulerIdentity => {
  const source =
    typeof value === 'object' && value !== null
      ? (value as Record<string, unknown>)
      : {}
  const name = sanitizeRulerName(source.name)
  return {
    ...(name ? { name } : {}),
    address: isAddress(source.address) ? source.address : 'emperor',
    temperament: isTemperament(source.temperament)
      ? source.temperament
      : 'none',
  }
}

export const isDefaultRuler = (ruler: RulerIdentity): boolean =>
  !ruler.name &&
  ruler.address === DEFAULT_RULER.address &&
  ruler.temperament === DEFAULT_RULER.temperament

/** The run's ruler; runs and saves without one are the default Emperor. */
export const rulerOf = (run: Pick<FortressRun, 'ruler'>): RulerIdentity =>
  normalizeRuler(run.ruler)

/** True when a saved ruler is exactly what the creator could have written. */
export const validRuler = (value: unknown): boolean => {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return false
  const record = value as Record<string, unknown>
  if (
    !Object.keys(record).every((key) =>
      ['name', 'address', 'temperament'].includes(key),
    )
  )
    return false
  if (!isAddress(record.address) || !isTemperament(record.temperament))
    return false
  return (
    record.name === undefined ||
    (typeof record.name === 'string' &&
      record.name.length > 0 &&
      sanitizeRulerName(record.name) === record.name)
  )
}

/** "Emperor", "Empress" or "Sovereign". */
export const rulerTitle = (ruler: RulerIdentity): string =>
  RULER_TITLES[ruler.address] ?? RULER_TITLES.emperor

/** "Empress Ash", or the bare title when the ruler has no name. */
export const rulerStyle = (ruler: RulerIdentity): string =>
  ruler.name ? `${rulerTitle(ruler)} ${ruler.name}` : rulerTitle(ruler)

/**
 * The ruler's style for interface lines that are new with t-075, or '' for
 * the default ruler so every existing line reads as it always has.
 */
export const customRulerStyle = (run: Pick<FortressRun, 'ruler'>): string => {
  const ruler = rulerOf(run)
  return isDefaultRuler(ruler) ? '' : rulerStyle(ruler)
}

const shift = (
  run: FortressRun,
  nudge: TemperamentNudge,
  sign: 1 | -1,
): void => {
  if (nudge.brass) run.brass += sign * nudge.brass
  for (const [id, delta] of Object.entries(nudge.local ?? {}) as [
    LocalFactionId,
    number,
  ][])
    run.local[id] += sign * delta
  for (const [id, delta] of Object.entries(nudge.affinity ?? {}) as [
    KingdomFactionId,
    number,
  ][])
    run.affinity[id] += sign * delta
}

/**
 * The ruler may be chosen (or chosen again) only before the reign has begun:
 * Day 1, nobody heard, hired, dispatched, bought or talked to yet.
 */
export const rulerCanBeChosen = (run: FortressRun): boolean =>
  run.day === 1 &&
  run.branch === 0 &&
  run.roster.length === 0 &&
  run.audiencesHeard.length === 0 &&
  run.active.length === 0 &&
  run.inventory.length === 0 &&
  !run.market &&
  !run.talksHeard?.length &&
  !run.dailyEventOutcome &&
  !run.rumourChallenges?.length &&
  !run.audienceBeats

/**
 * The run with this ruler crowned. A ruler chosen earlier is replaced, not
 * stacked: its temperament nudge is taken back before the new one is given,
 * so the nudge applies exactly once. The default ruler leaves no field, so a
 * default run is byte-for-byte today's Day 1.
 */
export const applyRuler = (run: FortressRun, choice: unknown): FortressRun => {
  const ruler = normalizeRuler(choice)
  const next: FortressRun = {
    ...run,
    local: { ...run.local },
    affinity: { ...run.affinity },
  }
  shift(next, TEMPERAMENTS[rulerOf(run).temperament].nudge, -1)
  shift(next, TEMPERAMENTS[ruler.temperament].nudge, 1)
  delete next.ruler
  return isDefaultRuler(ruler) ? next : { ...next, ruler }
}
