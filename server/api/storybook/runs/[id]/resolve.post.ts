// /server/api/storybook/runs/[id]/resolve.post.ts
//
// End the story: read the run's axis values against its deck, name the one
// ending they produce, mark the run COMPLETE, and credit the ending to the
// reader's collection.
//
// The math is the app's, never the narrator's -- the same rule the life engine
// has held since davinci/t-009, now deck-generic. Idempotent: resolving an
// already-finished run returns the same ending and awards nothing twice.

import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../../../../utils/error'
import { requireApiUser } from '../../../../utils/authGuard'
import { resolveStoryRunEnding } from '../../../../utils/davinci'

export default defineEventHandler(async (event) => {
  let response

  try {
    const { user } = await requireApiUser(event)

    const runId = Number(event.context.params?.id)
    if (!Number.isInteger(runId) || runId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Story run ID must be a positive integer.',
      })
    }

    const data = await resolveStoryRunEnding(runId, user.id, user.username)

    response = {
      success: true,
      message: `Story run ${runId} resolved to ${data.ending.title}.`,
      data,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to resolve this story.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
