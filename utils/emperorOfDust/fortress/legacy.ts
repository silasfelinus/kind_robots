import { endingOf } from './endings'
import type { FortressRun } from './types'

/**
 * A modest legacy reward, deliberately smaller than a market purchase.
 * The veteran's writ is earned by completing any reign and may be declined
 * on subsequent runs. It never changes the earned ending or save format.
 */
export const LEGACY_KEY = 'kr-emperor-of-dust-legacy-v1'
export const LEGACY_BRASS = 5

export type LegacyRecord = { endings: string[]; useWrit: boolean }
export const emptyLegacy = (): LegacyRecord => ({ endings: [], useWrit: false })

export function decodeLegacy(
  raw: string | null | undefined,
): LegacyRecord | null {
  if (!raw) return emptyLegacy()
  try {
    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== 'object' || Array.isArray(value))
      return null
    const record = value as Record<string, unknown>
    if (
      !Array.isArray(record.endings) ||
      !record.endings.every((id) => typeof id === 'string')
    )
      return null
    return {
      endings: [...new Set(record.endings.filter((id) => id.length <= 80))].slice(
        0,
        8,
      ),
      useWrit: record.useWrit === true,
    }
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
  if (!record.useWrit || record.endings.length === 0) return run
  return { ...run, brass: run.brass + LEGACY_BRASS }
}
