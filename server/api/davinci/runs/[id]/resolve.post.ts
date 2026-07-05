// /server/api/davinci/runs/[id]/resolve.post.ts
//
// Resolves a LifeRun's stats into its deterministic 10-bit outcomeKey, marks
// the run COMPLETE with the matching LifeEnding, and awards the linked
// Milestone + LifeAchievement (once per user — see server/utils/davinci.ts
// for the NULL-lifeRunId duplicate-unlock guard). Idempotent.

import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../../../../utils/error'
import { requireApiUser } from '../../../../utils/authGuard'
import { resolveLifeRunEnding } from '../../../../utils/davinci'

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

    const data = await resolveLifeRunEnding(lifeRunId, user.id, user.username)

    response = {
      success: true,
      message: `LifeRun resolved to ending ${data.outcomeKey}: ${data.ending.title}.`,
      data,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to resolve LifeRun ending.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
