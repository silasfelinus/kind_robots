// /server/api/sheets/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import type { Prisma } from '~/prisma/generated/prisma/client'

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)
    const query = getQuery(event)
    const includeUserData = isValid && user && typeof user.id === 'number'
    const dreamType = typeof query.dreamType === 'string' ? query.dreamType : undefined
    const userId = Number(query.userId)

    const where: Prisma.PitchSheetWhereInput = includeUserData
      ? {
          OR: [
            { isPublic: true, Dream: { isPublic: true } },
            { userId: user.id },
            { Dream: { userId: user.id } },
          ],
        }
      : { isPublic: true, Dream: { isPublic: true } }

    if (dreamType) {
      where.Dream = {
        ...(typeof where.Dream === 'object' && where.Dream !== null ? where.Dream : {}),
        dreamType: dreamType as never,
      }
    }

    if (!Number.isNaN(userId) && userId > 0) {
      where.userId = userId
    }

    const data = await prisma.pitchSheet.findMany({
      where,
      include: {
        Dream: true,
        ArtImage: {
          select: {
            id: true,
            imagePath: true,
            thumbnailData: true,
            fileName: true,
            fileType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    event.node.res.statusCode = 200
    return {
      success: true,
      message: includeUserData
        ? `PitchSheets retrieved for user ${user.id}.`
        : 'Public PitchSheets retrieved successfully.',
      data,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to fetch PitchSheets.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
