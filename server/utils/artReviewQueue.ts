// /server/utils/artReviewQueue.ts
//
// Which art the Rebel Button may show a given viewer: public art or their own,
// never art they have already reacted to, with the same maturity gate every
// other art surface uses (buildArtImageWhere), narrowed further so an admin is
// not handed other people's private work to review.
import type { Prisma } from '~/prisma/generated/prisma/client'
import {
  buildArtImageWhere,
  type ArtImageAccessContext,
} from '~/server/utils/artImageAccess'

const STILL_IMAGE_TYPES = ['png', 'jpg', 'jpeg', 'webp', 'gif']

export function buildArtReviewWhere(
  access: ArtImageAccessContext,
  userId: number,
  excludeIds: number[],
): Prisma.ArtImageWhereInput {
  return {
    AND: [
      buildArtImageWhere(access),
      { OR: [{ isPublic: true }, { userId }] },
      { Reactions: { none: { userId, reactionCategory: 'ART_IMAGE' } } },
      { fileType: { in: STILL_IMAGE_TYPES } },
      {
        OR: [
          { imagePath: { startsWith: '/' } },
          { imagePath: { startsWith: 'http' } },
        ],
      },
      ...(excludeIds.length ? [{ id: { notIn: excludeIds } }] : []),
    ],
  }
}

export function parseExcludeIds(value: unknown): number[] {
  const raw = Array.isArray(value) ? value.join(',') : String(value ?? '')
  return raw
    .split(',')
    .map((part) => Number(part))
    .filter((id) => Number.isInteger(id) && id > 0)
    .slice(0, 200)
}
