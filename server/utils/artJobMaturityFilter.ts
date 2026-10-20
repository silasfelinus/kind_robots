// /server/utils/artJobMaturityFilter.ts
//
// The ArtJob queue's three-way display filter (Both / Mature / Not mature),
// shared by the queue dashboard and the slideshow through GET /api/art/queue.
//
// An ArtJob has no maturity column: the requested maturity lives in
// payload.save.isMature, serialized with JSON.stringify, so a mature job's
// LongText always carries the exact marker below. Matching the marker keeps
// the filter in the query, so pagination counts stay true. A finished image
// later re-marked mature is still covered on its card by
// applyCurrentArtImageState(); this filter only decides which jobs are listed.
import type { Prisma } from '~/prisma/generated/prisma/client'
import type { GalleryMaturityFilter } from '~/server/utils/artImageAccess'

export const MATURE_PAYLOAD_MARKER = '"isMature":true'

export function buildArtJobMaturityWhere(
  maturity: GalleryMaturityFilter,
): Prisma.ArtJobWhereInput {
  if (maturity === 'mature') {
    return { payload: { contains: MATURE_PAYLOAD_MARKER } }
  }
  if (maturity === 'safe') {
    return { NOT: { payload: { contains: MATURE_PAYLOAD_MARKER } } }
  }
  return {}
}
