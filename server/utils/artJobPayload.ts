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
