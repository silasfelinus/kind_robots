import { defineEventHandler, getQuery } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import {
  buildArtImageSelect,
  buildArtImageWhere,
  getArtImageAccessContext,
  readBoolean,
  type QueryValue,
} from '~/server/utils/artImageAccess'
import { attachGalleryArchiveMediaPaths } from '~/server/utils/artGalleryArchiveMedia'

type GalleryMaturityFilter = 'all' | 'mature' | 'safe'

function readMaturityFilter(value: QueryValue): GalleryMaturityFilter {
  const raw = Array.isArray(value) ? value[0] : value
  const normalized = String(raw ?? 'all').trim().toLowerCase()
  if (normalized === 'mature' || normalized === 'safe') return normalized
  return 'all'
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event) as Record<string, QueryValue>
    const access = await getArtImageAccessContext(event)
    const accessWhere = buildArtImageWhere(access)
    const maturity = readMaturityFilter(query.maturity)
    const maturityWhere: Prisma.ArtImageWhereInput =
      maturity === 'all' ? {} : { isMature: maturity === 'mature' }
    const where: Prisma.ArtImageWhereInput = {
      AND: [accessWhere, maturityWhere, { ArtCollections: { none: {} } }],
    }
    const totalWhere: Prisma.ArtImageWhereInput =
      maturity === 'all'
        ? accessWhere
        : { AND: [accessWhere, maturityWhere] }
    const summaryOnly = readBoolean(query.summary, false)
    const select = buildArtImageSelect(query)

    if (summaryOnly) {
      const [count, totalCount, previewArtImage] = await Promise.all([
        prisma.artImage.count({ where }),
        prisma.artImage.count({ where: totalWhere }),
        prisma.artImage.findFirst({
          where,
          select,
          orderBy: { createdAt: 'desc' },
        }),
      ])

      if (previewArtImage) {
        attachGalleryArchiveMediaPaths([previewArtImage], 'thumbnail')
      }

      return {
        success: true,
        data: {
          count,
          totalCount,
          previewArtImage,
        },
        message: count
          ? 'Unsorted art summary loaded.'
          : 'No unsorted art images found.',
      }
    }

    const data = await prisma.artImage.findMany({
      where,
      select,
      orderBy: { createdAt: 'desc' },
    })

    attachGalleryArchiveMediaPaths(data, 'medium')

    return {
      success: true,
      data,
      message: data.length
        ? 'Unsorted art images loaded.'
        : 'No unsorted art images found.',
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
