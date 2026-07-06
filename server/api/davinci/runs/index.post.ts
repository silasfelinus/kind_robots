// /server/api/davinci/runs/index.post.ts
//
// Creates a new Da Vinci life run for the authenticated user. The run starts
// ACTIVE; choices are recorded via POST /api/davinci/runs/:id/choices and the
// run is resolved via POST /api/davinci/runs/:id/resolve.

import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'
import { createLifeRun } from '../../../utils/davinci'

export default defineEventHandler(async (event) => {
  let response

  try {
    const { user } = await requireApiUser(event)
    const body = await readBody(event)

    const run = await createLifeRun(user.id, {
      title: body?.title,
      seed: body?.seed,
      protagonistName: body?.protagonistName,
      genre: body?.genre,
      currentChapter: body?.currentChapter,
      characterId: body?.characterId,
      dreamId: body?.dreamId,
      botId: body?.botId,
      artCollectionId: body?.artCollectionId,
    })

    response = {
      success: true,
      message: `Life run ${run.id} created.`,
      data: run,
      statusCode: 201,
    }
    event.node.res.statusCode = 201
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to create life run.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
