import type { ArtJob } from '~/prisma/generated/prisma/client'

export type ArtJobPayloadRecord = Record<string, unknown>

export type DecodedArtJob<T extends Pick<ArtJob, 'payload'>> = Omit<
  T,
  'payload'
> & {
  payload: ArtJobPayloadRecord
}

function asRecord(value: unknown): ArtJobPayloadRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as ArtJobPayloadRecord
}

export function parseArtJobPayload(value: unknown): ArtJobPayloadRecord {
  if (typeof value === 'string') {
    try {
      return asRecord(JSON.parse(value))
    } catch {
      return {}
    }
  }

  return asRecord(value)
}

export function serializeArtJobPayload(value: unknown): string {
  return JSON.stringify(parseArtJobPayload(value))
}

export function decodeArtJobPayload<T extends Pick<ArtJob, 'payload'>>(
  job: T,
): DecodedArtJob<T> {
  return {
    ...job,
    payload: parseArtJobPayload(job.payload),
  }
}

// The concrete seed a Comfy graph render actually used. For the graph engines
// the seed is resolved (randomized when unset) at build time and baked into the
// KSampler `seed` / RandomNoise `noise_seed` input — it is NOT otherwise stored,
// so ArtImage.seed can end up -1 unless the relay echoes it. This walks the
// workflow to recover the real seed so completion can persist it. Returns the
// first concrete non-negative seed found (there is one sampler per graph), or
// null when the payload carries no workflow (e.g. raw A1111 jobs).
const WORKFLOW_SEED_KEYS = new Set(['seed', 'noise_seed'])

export function extractWorkflowSeed(payload: unknown): number | null {
  const workflow = parseArtJobPayload(payload).workflow
  if (!workflow || typeof workflow !== 'object') return null

  let found: number | null = null

  const visit = (value: unknown, key = ''): void => {
    if (found !== null) return
    if (Array.isArray(value)) {
      for (const item of value) visit(item)
      return
    }
    if (value && typeof value === 'object') {
      for (const [childKey, child] of Object.entries(value)) {
        visit(child, childKey)
        if (found !== null) return
      }
      return
    }
    if (
      WORKFLOW_SEED_KEYS.has(key) &&
      typeof value === 'number' &&
      Number.isFinite(value) &&
      value >= 0
    ) {
      found = Math.floor(value)
    }
  }

  visit(workflow)
  return found
}
