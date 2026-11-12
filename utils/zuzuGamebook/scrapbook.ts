import { BOOK } from './book'
import type { Run } from './types'

export const SCRAPBOOK_KEY = 'kr-zuzu-gamebook-scrapbook-v1'
export const SCRAPBOOK_LIMIT = 16

export type JourneyMemory = {
  id: string
  endedAt: string
  ending: string | null
  sceneId: string
  pages: number
  health: number
  flags: string[]
  trail: string[]
}

export function captureJourney(run: Run, endedAt: string): JourneyMemory {
  return {
    id: `${run.originSeed ?? run.seed}:${run.visited.length}:${run.sceneId}`,
    endedAt,
    ending: BOOK[run.sceneId]?.ending ? run.sceneId : null,
    sceneId: run.sceneId,
    pages: run.visited.length,
    health: run.health,
    flags: [...run.flags],
    trail: [...new Set(run.visited)].slice(-9),
  }
}

function validMemory(raw: unknown): raw is JourneyMemory {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false
  const record = raw as Partial<JourneyMemory>
  return (
    typeof record.id === 'string' &&
    typeof record.endedAt === 'string' &&
    typeof record.sceneId === 'string' &&
    record.sceneId in BOOK &&
    (record.ending === null ||
      (typeof record.ending === 'string' && !!BOOK[record.ending]?.ending)) &&
    typeof record.pages === 'number' &&
    Number.isInteger(record.pages) &&
    record.pages >= 1 &&
    typeof record.health === 'number' &&
    Number.isFinite(record.health) &&
    Array.isArray(record.flags) &&
    record.flags.every((flag) => typeof flag === 'string') &&
    Array.isArray(record.trail) &&
    record.trail.every((id) => typeof id === 'string' && id in BOOK)
  )
}

export function decodeScrapbook(text: string | null): JourneyMemory[] {
  if (!text) return []
  try {
    const parsed: unknown = JSON.parse(text)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
      return []
    const record = parsed as { version?: unknown; runs?: unknown }
    if (record.version !== 1 || !Array.isArray(record.runs)) return []
    return record.runs.filter(validMemory).slice(0, SCRAPBOOK_LIMIT)
  } catch {
    return []
  }
}

export function addJourney(
  existing: readonly JourneyMemory[],
  latest: JourneyMemory,
): JourneyMemory[] {
  return [latest, ...existing.filter((record) => record.id !== latest.id)].slice(
    0,
    SCRAPBOOK_LIMIT,
  )
}
