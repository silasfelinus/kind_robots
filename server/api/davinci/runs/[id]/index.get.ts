// /server/api/davinci/runs/[id]/index.get.ts
//
// Reads a Da Vinci life run owned by the authenticated user, with its stats,
// choices (chapter order), and resolved ending — for resume.

import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../../../../utils/error'
import { requireApiUser } from '../../../../utils/authGuard'
import { getLifeRunForUser } from '../../../../utils/davinci'

export default defineEventHandler(async (event) => {
  let response

  try {
    const { user } = await requireApiUser(event)

    const lifeRunId = Number(event.context.params?.id)
    if (!Number.isInteger(lifeRunId) || lifeRunId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'LifeRun ID must be a positive integer.',
      })
    }

    const data = await getLifeRunForUser(lifeRunId, user.id)

    response = {
      success: true,
      data,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to load life run.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
