import type { ArtImage } from '~/prisma/generated/prisma/client'

export type ArtImageRecord = Partial<ArtImage> & Pick<ArtImage, 'id'>

const MEDIA_FIELDS = [
  'imageData',
  'thumbnailData',
  'heroData',
  'cardData',
  'iconData',
] as const satisfies readonly (keyof ArtImage)[]

/**
 * Merge a lean ArtImage response without erasing media that was deliberately
 * hydrated earlier. Explicit non-null media remains authoritative.
 */
export function mergeArtImageRecord(
  existing: ArtImageRecord | undefined,
  incoming: ArtImageRecord,
): ArtImageRecord {
  if (!existing) return { ...incoming }

  const merged: ArtImageRecord = { ...existing, ...incoming }

  for (const field of MEDIA_FIELDS) {
    const next = incoming[field]
    const previous = existing[field]

    if ((next === null || typeof next === 'undefined') && previous) {
      ;(merged as Record<string, unknown>)[field] = previous
    }
  }

  return merged
}

export function mergeArtImageRecords(
  existing: ArtImageRecord[],
  incoming: ArtImageRecord[],
): ArtImageRecord[] {
  const records = new Map<number, ArtImageRecord>()

  for (const image of existing) records.set(image.id, image)

  for (const image of incoming) {
    records.set(image.id, mergeArtImageRecord(records.get(image.id), image))
  }

  return Array.from(records.values())
}
