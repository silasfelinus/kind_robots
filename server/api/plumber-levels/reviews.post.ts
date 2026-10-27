import { createError, defineEventHandler, readBody } from 'h3'
import { errorHandler } from '~/server/utils/error'
import prisma from '~/server/utils/prisma'
import { requireApiUser } from '~/server/utils/authGuard'
import {
  ART_REVIEW_RATINGS,
  isArtReviewRating,
  reactionTypeForRating,
} from '~/utils/artReview'
import {
  courseFromShareCode,
  plumberReviewSummary,
  PLUMBER_REVIEW_COMMENT_MAX,
} from '~/server/utils/plumberLevelReviews'

type ReviewBody = { code?: unknown; rating?: unknown; comment?: unknown }

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireApiUser(event)
    if (user.id === 10 || user.isGuest) {
      throw createError({ statusCode: 401, message: 'Sign in to review a course.' })
    }

    const body = (await readBody<ReviewBody>(event)) ?? {}
    if (!isArtReviewRating(body.rating)) {
      throw createError({
        statusCode: 400,
        message: `Rating must be one of ${ART_REVIEW_RATINGS.map((r) => r.rating).join(', ')}.`,
      })
    }
    if (body.comment !== undefined && typeof body.comment !== 'string') {
      throw createError({ statusCode: 400, message: 'Review comment must be text.' })
    }
    if (typeof body.comment === 'string' && body.comment.length > PLUMBER_REVIEW_COMMENT_MAX) {
      throw createError({ statusCode: 400, message: 'Review comment is too long.' })
    }

    let courseData: ReturnType<typeof courseFromShareCode>
    try {
      courseData = courseFromShareCode(body.code)
    } catch {
      throw createError({ statusCode: 400, message: 'A valid playable course is required.' })
    }

    // A course revision is immutable and content-addressed. Edits create a new
    // revision; prior course reviews never silently transfer to changed tiles.
    const course = await prisma.plumberLevel.upsert({
      where: { fingerprint: courseData.fingerprint },
      update: {},
      create: {
        fingerprint: courseData.fingerprint,
        title: courseData.level.title,
        payload: courseData.payload,
        isPublic: true,
      },
      select: { id: true, isPublic: true },
    })
    if (!course.isPublic) {
      throw createError({ statusCode: 403, message: 'This course is not available for reviews.' })
    }
    const comment = typeof body.comment === 'string'
      ? body.comment.trim() || null
      : null
    const reaction = await prisma.reaction.upsert({
      where: {
        userId_plumberLevelId: {
          userId: user.id,
          plumberLevelId: course.id,
        },
      },
      update: {
        rating: body.rating,
        reactionType: reactionTypeForRating(body.rating),
        comment,
      },
      create: {
        userId: user.id,
        plumberLevelId: course.id,
        reactionCategory: 'PLUMBER_LEVEL',
        rating: body.rating,
        reactionType: reactionTypeForRating(body.rating),
        comment,
      },
      select: { id: true },
    })
    const data = await plumberReviewSummary(course.id, user.id)
    return {
      success: true,
      statusCode: 200,
      message: 'Course review saved.',
      data: { ...data, reactionId: reaction.id },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return { ...handled, data: null, statusCode: event.node.res.statusCode }
  }
})
