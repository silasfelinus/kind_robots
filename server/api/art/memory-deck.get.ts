import { defineEventHandler, getQuery } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import {
  buildArtImageWhere,
  getArtImageAccessContext,
} from '~/server/utils/artImageAccess'
import { attachGalleryArchiveMediaPaths } from '~/server/utils/artGalleryArchiveMedia'

/**
 * Bounded image candidate sampler for Memory Dungeon.
 * The regular art-gallery endpoint can return hundreds of thousands of rows.
 * A memory board needs only a small random subset, never that full payload.
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const access = await getArtImageAccessContext(event)
  const mode = query.source === 'generated' ? 'generated' : 'all'
  const requestedMature =
    query.includeMature === 'true' || query.includeMature === '1'
  const mature = requestedMature && access.showMature
  const neededRaw = Number(query.needed)
  const needed = Number.isInteger(neededRaw)
    ? Math.max(1, Math.min(32, neededRaw))
    : 9

  if (mode === 'generated' && !access.userId) {
    return {
      success: true,
      data: [],
      message: 'Sign in to use your generated-art collection.',
    }
  }

  const where: Prisma.ArtImageWhereInput = {
    AND: [
      buildArtImageWhere(access),
      mode === 'generated' ? { userId: access.userId! } : { isPublic: true },
      { isActive: true },
      ...(!mature ? [{ isMature: false }] : []),
    ],
  }
  const count = await prisma.artImage.count({ where })
  if (count === 0)
    return { success: true, data: [], message: 'No eligible art images found.' }
  const take = Math.min(count, Math.max(48, needed * 5))
  const skip = Math.max(0, Math.floor(Math.random() * (count - take + 1)))
  const images = await prisma.artImage.findMany({
    where,
    orderBy: { id: 'desc' },
    skip,
    take,
    select: {
      id: true,
      userId: true,
      imagePath: true,
      path: true,
      fileType: true,
      isMature: true,
      isPublic: true,
      isActive: true,
    },
  })
  attachGalleryArchiveMediaPaths(
    images as Parameters<typeof attachGalleryArchiveMediaPaths>[0],
  )
  return {
    success: true,
    data: images,
    message: `Loaded ${images.length} candidate images.`,
  }
})
