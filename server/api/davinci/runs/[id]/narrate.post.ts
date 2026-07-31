// /server/api/davinci/runs/[id]/narrate.post.ts
//
// Asks the run's narrator for the next chapter's prose, choices, and proposed
// stat deltas. Read-only by design: this route writes nothing. The client takes
// the returned choice's `effects` and posts them to
// POST /api/davinci/runs/:id/choices as a separate step, so LifeChoice/LifeStat
// writes and all outcome math stay in server/utils/davinci.ts.
//
// Only the run's owner may narrate; a COMPLETE or ABANDONED run is rejected
// with 409, matching the choices endpoint's guard.

import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../../../../utils/error'
import { requireApiUser } from '../../../../utils/authGuard'
import { getLifeRunForUser } from '../../../../utils/davinci'
import {
  buildNarrationRequest,
  generateDaVinciChapter,
  loadRunNarrator,
} from '../../../../utils/davinciNarration'

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

    const body = await readBody(event).catch(() => null)
    const requestedChapter = Number(body?.chapter)

    const run = await getLifeRunForUser(lifeRunId, user.id)
    if (run.status !== 'ACTIVE') {
      throw createError({
        statusCode: 409,
        message: `LifeRun ${lifeRunId} is ${run.status}; only ACTIVE runs can be narrated.`,
      })
    }

    const narrator = await loadRunNarrator(run)
    const narrationRequest = buildNarrationRequest(
      run,
      narrator,
      Number.isInteger(requestedChapter) && requestedChapter > 0
        ? requestedChapter
        : undefined,
    )
    const data = await generateDaVinciChapter(narrationRequest)

    response = {
      success: true,
      message: `Chapter ${narrationRequest.chapter} narrated for run ${lifeRunId}.`,
      data: {
        ...data,
        chapter: narrationRequest.chapter,
        narrator: narrator.name,
      },
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to narrate chapter.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
