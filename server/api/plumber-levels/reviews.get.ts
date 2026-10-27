import { createError, defineEventHandler, getQuery } from 'h3'
import { errorHandler } from '~/server/utils/error'
import prisma from '~/server/utils/prisma'
import { getOptionalApiUser } from '~/server/utils/authGuard'
import {
  courseFromShareCode,
  plumberReviewSummary,
} from '~/server/utils/plumberLevelReviews'

export default defineEventHandler(async (event) => {
  try {
    const { code } = getQuery(event)
    if (typeof code !== 'string' || code.length > 12000) {
      throw createError({ statusCode: 400, message: 'A valid course share code is required.' })
    }
    let fingerprint: string
    try {
      fingerprint = courseFromShareCode(code).fingerprint
    } catch {
      throw createError({ statusCode: 400, message: 'Invalid course share code.' })
    }
    const course = await prisma.plumberLevel.findUnique({
      where: { fingerprint },
      select: { id: true, isPublic: true },
    })
    const auth = await getOptionalApiUser(event)
    const data = await plumberReviewSummary(
      course?.isPublic ? course.id : null,
      auth?.user.id ?? null,
    )
    return { success: true, statusCode: 200, data }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return { ...handled, data: null, statusCode: event.node.res.statusCode }
  }
})
