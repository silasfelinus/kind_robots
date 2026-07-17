// /server/utils/artJobRetry.ts
import {
  parseArtJobPayload,
  type ArtJobPayloadRecord,
} from './artJobPayload'

export type ArtJobRetryMode = 'NEW_OUTPUT' | 'OVERWRITE'

export const ART_JOB_RETRY_MODES = new Set<ArtJobRetryMode>([
  'NEW_OUTPUT',
  'OVERWRITE',
])

const SEED_KEYS = new Set(['seed', 'noise_seed'])

function asRecord(value: unknown): ArtJobPayloadRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as ArtJobPayloadRecord
}

function nextSeed(): number {
  return Math.floor(Math.random() * 1_000_000_000_000_000)
}

function refreshConcreteSeeds(value: unknown, key = ''): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => refreshConcreteSeeds(item))
  }

  if (!value || typeof value !== 'object') {
    if (SEED_KEYS.has(key)) {
      if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
        return nextSeed()
      }
      if (
        typeof value === 'string' &&
        value.trim() &&
        Number.isFinite(Number(value)) &&
        Number(value) >= 0
      ) {
        return String(nextSeed())
      }
    }
    return value
  }

  return Object.fromEntries(
    Object.entries(value as ArtJobPayloadRecord).map(([childKey, child]) => [
      childKey,
      refreshConcreteSeeds(child, childKey),
    ]),
  )
}

export function prepareArtJobRetryPayload(
  rawPayload: unknown,
  sourceJobId: number,
  sourceArtImageId: number | null,
  mode: ArtJobRetryMode,
  refreshSeed: boolean,
): ArtJobPayloadRecord {
  const cloned = structuredClone(parseArtJobPayload(rawPayload))
  const previousRetry = asRecord(cloned.retry)
  const rootJobId = Number(previousRetry.rootJobId) || sourceJobId

  delete cloned.curation

  const generationPayload = refreshSeed
    ? (refreshConcreteSeeds(cloned) as ArtJobPayloadRecord)
    : cloned

  generationPayload.retry = {
    mode,
    sourceJobId,
    rootJobId,
    targetArtImageId: mode === 'OVERWRITE' ? sourceArtImageId : null,
    refreshSeed,
    requestedAt: new Date().toISOString(),
  }

  return generationPayload
}
