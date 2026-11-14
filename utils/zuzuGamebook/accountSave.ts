import { ENDING_IDS, isSavedRun, type Run } from './adventure'
import { decodeCastCollection, type BookOneCastId } from './cast'
import {
  SCRAPBOOK_LIMIT,
  decodeScrapbook,
  type JourneyMemory,
} from './scrapbook'

/** A private account backup. It cannot award achievements or unlock discoveries. */
export type ZuzuAccountSave = {
  version: 1
  run: Run
  recoverable: Run | null
  endings: string[]
  played: string[]
  cast: BookOneCastId[]
  scrapbook: JourneyMemory[]
}

const validEndings = new Set(ENDING_IDS)
const MAX_BACKUP_BYTES = 256_000

function endingList(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= ENDING_IDS.length &&
    value.every((id) => typeof id === 'string' && validEndings.has(id)) &&
    new Set(value).size === value.length
  )
}

/** Strict enough to keep corrupt or oversized account writes off the server. */
export function validZuzuAccountSave(value: unknown): value is ZuzuAccountSave {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return false
  const candidate = value as Partial<ZuzuAccountSave>
  if (
    candidate.version !== 1 ||
    !isSavedRun(candidate.run) ||
    (candidate.recoverable !== null && !isSavedRun(candidate.recoverable)) ||
    !endingList(candidate.endings) ||
    !endingList(candidate.played) ||
    !Array.isArray(candidate.cast) ||
    candidate.cast.length !==
      decodeCastCollection({ version: 1, ids: candidate.cast }).length ||
    !Array.isArray(candidate.scrapbook) ||
    candidate.scrapbook.length > SCRAPBOOK_LIMIT
  )
    return false

  try {
    const validMemories = decodeScrapbook(
      JSON.stringify({ version: 1, runs: candidate.scrapbook }),
    )
    if (validMemories.length !== candidate.scrapbook.length) return false
    return JSON.stringify(value).length <= MAX_BACKUP_BYTES
  } catch {
    return false
  }
}
