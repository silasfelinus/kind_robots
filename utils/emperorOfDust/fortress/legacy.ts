import { ENDINGS, endingOf } from './endings'
import type { EndingId } from './endings'
import type {
  FortressRun,
  KingdomFactionId,
  LocalFactionId,
} from './types'

export const LEGACY_KEY = 'kr-emperor-of-dust-legacy-v1'
export const LEGACY_BRASS = 5
export const LEGACY_FAVOR_BONUS = 3

export type LegacyFavor = {
  id: EndingId
  name: string
  description: string
} & (
  | { kind: 'local'; faction: LocalFactionId }
  | { kind: 'affinity'; faction: KingdomFactionId }
)

/**
 * Every ending unlocks one modest starting allegiance. Players may choose
 * one favor or the veteran writ; rewards never stack or alter existing saves.
 */
export const LEGACY_FAVORS: Record<EndingId, LegacyFavor> = {
  'bell-restored': {
    id: 'bell-restored',
    name: 'Bellkeeper’s word',
    description: '+3 Hollow Bell affinity at the next dawn.',
    kind: 'affinity',
    faction: 'hollow-bell',
  },
  'open-roads': {
    id: 'open-roads',
    name: 'Road charter',
    description: '+3 Saltroad affinity at the next dawn.',
    kind: 'affinity',
    faction: 'saltroad',
  },
  'iron-peace': {
    id: 'iron-peace',
    name: 'Watch commission',
    description: '+3 Gate Watch support at the next dawn.',
    kind: 'local',
    faction: 'gate-watch',
  },
  'crows-bargain': {
    id: 'crows-bargain',
    name: 'Rain covenant',
    description: '+3 Storm Crow affinity at the next dawn.',
    kind: 'affinity',
    faction: 'storm-crows',
  },
  'witchwater-throne': {
    id: 'witchwater-throne',
    name: 'Fen token',
    description: '+3 Mire Mothers affinity at the next dawn.',
    kind: 'affinity',
    faction: 'mire-mothers',
  },
  'tunnels-and-councils': {
    id: 'tunnels-and-councils',
    name: 'Assembly mark',
    description: '+3 Mole affinity at the next dawn.',
    kind: 'affinity',
    faction: 'moles',
  },
  'long-night': {
    id: 'long-night',
    name: 'Night lantern',
    description: '+3 Lamplight support at the next dawn.',
    kind: 'local',
    faction: 'lamplight',
  },
  'hundred-candles': {
    id: 'hundred-candles',
    name: 'Memorial duty',
    description: '+3 Yard support at the next dawn.',
    kind: 'local',
    faction: 'yard',
  },
}

export type LegacyRecord = {
  endings: EndingId[]
  useWrit: boolean
  selectedFavor: EndingId | null
}

export const emptyLegacy = (): LegacyRecord => ({
  endings: [],
  useWrit: false,
  selectedFavor: null,
})

const isEndingId = (id: string): id is EndingId =>
  Object.prototype.hasOwnProperty.call(ENDINGS, id)

export function decodeLegacy(
  raw: string | null | undefined,
): LegacyRecord | null {
  if (!raw) return emptyLegacy()
  try {
    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null
    const record = value as Record<string, unknown>
    if (
      !Array.isArray(record.endings) ||
      !record.endings.every((id) => typeof id === 'string')
    )
      return null
    const endings = [...new Set(record.endings.filter(isEndingId))].slice(0, 8)
    const useWrit = record.useWrit === true && endings.length > 0
    const selectedFavor =
      !useWrit &&
      typeof record.selectedFavor === 'string' &&
      isEndingId(record.selectedFavor) &&
      endings.includes(record.selectedFavor)
        ? record.selectedFavor
        : null
    return { endings, useWrit, selectedFavor }
  } catch {
    return null
  }
}

export const encodeLegacy = (record: LegacyRecord): string =>
  JSON.stringify(record)

export function earnLegacy(
  record: LegacyRecord,
  finished: FortressRun,
): LegacyRecord {
  if (finished.day <= 50) return record
  const id = endingOf(finished).id
  if (record.endings.includes(id)) return record
  return { ...record, endings: [...record.endings, id] }
}

export function applyLegacy(
  run: FortressRun,
  record: LegacyRecord,
): FortressRun {
  if (!record.endings.length) return run
  if (record.useWrit) return { ...run, brass: run.brass + LEGACY_BRASS }
  const favor =
    record.selectedFavor && record.endings.includes(record.selectedFavor)
      ? LEGACY_FAVORS[record.selectedFavor]
      : null
  if (!favor) return run
  if (favor.kind === 'local')
    return {
      ...run,
      local: {
        ...run.local,
        [favor.faction]: run.local[favor.faction] + LEGACY_FAVOR_BONUS,
      },
    }
  return {
    ...run,
    affinity: {
      ...run.affinity,
      [favor.faction]: run.affinity[favor.faction] + LEGACY_FAVOR_BONUS,
    },
  }
}
