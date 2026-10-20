// /server/api/art/recycle-bin/index.get.ts
//
// The Gallery's Recycle Bin: images and collections (folders) that were
// deleted, i.e. marked isActive = false. A viewer sees their own; an admin
// sees everyone's. Images carry a signed thumbnail url, because the normal
// image routes deliberately refuse inactive rows.
import { defineEventHandler, getQuery } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import { buildArtImageSelect } from '~/server/utils/artImageAccess'
import { recycledThumbnailUrl } from '~/server/utils/artGalleryArchiveMedia'

const DEFAULT_LIMIT = 200
const MAX_LIMIT = 500

function readLimit(value: unknown): number {
  const parsed = Number(Array.isArray(value) ? value[0] : value)
  if (!Number.isInteger(parsed) || parsed <= 0) return DEFAULT_LIMIT
  return Math.min(parsed, MAX_LIMIT)
}

export default defineEventHandler(async (event) => {
  try {
    const { user, isAdmin } = await requireApiUser(event)
    const limit = readLimit(getQuery(event).limit)
    const owner = isAdmin ? {} : { userId: user.id }

    const imageWhere: Prisma.ArtImageWhereInput = { isActive: false, ...owner }
    const collectionWhere: Prisma.ArtCollectionWhereInput = {
      isActive: false,
      ...owner,
    }

    const [images, imageCount, collections] = await Promise.all([
      prisma.artImage.findMany({
        where: imageWhere,
        select: buildArtImageSelect({}),
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        take: limit,
      }),
      prisma.artImage.count({ where: imageWhere }),
      prisma.artCollection.findMany({
        where: collectionWhere,
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        select: {
          id: true,
          updatedAt: true,
          userId: true,
          label: true,
          slug: true,
          isMature: true,
          isPublic: true,
          _count: { select: { ArtImages: true } },
        },
      }),
    ])

    const now = Date.now()
    return {
      success: true,
      message: `${imageCount} image(s) and ${collections.length} collection(s) in the Recycle Bin.`,
      data: {
        images: images.map((image) => ({
          ...image,
          thumbnailUrl: recycledThumbnailUrl(image.id, now),
        })),
        imageCount,
        collections: collections.map(({ _count, ...collection }) => ({
          ...collection,
          artImageCount: _count.ArtImages,
        })),
      },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
