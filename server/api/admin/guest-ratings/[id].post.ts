import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireAdminApiUser } from '~/server/utils/authGuard'

// Moderate one held guest note: `release` clears the hold, `dismiss` deletes
// the note text but keeps the star rating counted.
export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const id = Number(event.context.params?.id)
    const body = (await readBody(event)) as { action?: unknown } | null
    const action = body?.action
    if (!Number.isInteger(id) || id < 1)
      throw createError({ statusCode: 400, message: 'Bad rating id.' })
    if (action !== 'release' && action !== 'dismiss')
      throw createError({
        statusCode: 400,
        message: 'Action must be release or dismiss.',
      })
    const result = await prisma.arcadeGuestRating.updateMany({
      where: { id, commentHeld: true },
      data:
        action === 'release'
          ? { commentHeld: false }
          : { comment: null, commentHeld: false },
    })
    if (!result.count)
      throw createError({
        statusCode: 404,
        message: 'No held note with that id.',
      })
    return { success: true, statusCode: 200 }
  } catch (error) {
    const failure = errorHandler(error)
    event.node.res.statusCode = failure.statusCode || 500
    return {
      success: false,
      message: failure.message,
      statusCode: event.node.res.statusCode,
    }
  }
})
