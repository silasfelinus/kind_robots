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

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event) as Record<string, QueryValue>
    const access = await getArtImageAccessContext(event)
    const accessWhere = buildArtImageWhere(access)
    const where: Prisma.ArtImageWhereInput = {
      AND: [accessWhere, { ArtCollections: { none: {} } }],
    }
    const summaryOnly = readBoolean(query.summary, false)
    const select = buildArtImageSelect(query)

    if (summaryOnly) {
      const [count, totalCount, previewArtImage] = await Promise.all([
        prisma.artImage.count({ where }),
        prisma.artImage.count({ where: accessWhere }),
        prisma.artImage.findFirst({
          where,
          select,
          orderBy: { createdAt: 'desc' },
        }),
      ])

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

    return {
      success: true,
      data,
      message: data.length
        ? 'Unsorted art images loaded.'
        : 'No unsorted art images found.',
    }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})
