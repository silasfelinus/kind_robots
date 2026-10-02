// /server/api/art/review/next.get.ts
import { createError, defineEventHandler, getQuery } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import { getArtImageAccessContext } from '~/server/utils/artImageAccess'
import {
  buildArtReviewWhere,
  parseExcludeIds,
} from '~/server/utils/artReviewQueue'
import type { ArtReviewCandidate } from '~/utils/artReview'

const WINDOW = 10

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireApiUser(event)
    const access = await getArtImageAccessContext(event)
    const where = buildArtReviewWhere(
      access,
      user.id,
      parseExcludeIds(getQuery(event).exclude),
    )

    const remaining = await prisma.artImage.count({ where })
    if (remaining === 0) {
      return {
        success: true,
        message: 'You have reviewed everything available right now.',
        data: { candidate: null, remaining: 0 },
        statusCode: 200,
      }
    }

    const skip = Math.floor(Math.random() * Math.max(1, remaining - WINDOW + 1))
    const rows = await prisma.artImage.findMany({
      where,
      skip,
      take: WINDOW,
      orderBy: { id: 'asc' },
      select: { id: true, userId: true, imagePath: true, isMature: true },
    })

    const pool = rows.filter(
      (row) =>
        row.imagePath &&
        !(
          row.isMature &&
          row.userId !== user.id &&
          row.imagePath.includes('/api/art/images/')
        ),
    )
    if (!pool.length) {
      throw createError({
        statusCode: 404,
        message: 'No reviewable art found. Try again.',
      })
    }

    const pick = pool[Math.floor(Math.random() * pool.length)]!
    const candidate: ArtReviewCandidate = {
      id: pick.id,
      src: pick.imagePath as string,
      isMature: pick.isMature === true,
      isOwn: pick.userId === user.id,
    }

    return {
      success: true,
      message: 'Art ready for review.',
      data: { candidate, remaining },
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to fetch art for review.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
