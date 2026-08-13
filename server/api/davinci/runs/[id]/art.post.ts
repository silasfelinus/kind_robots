// /server/api/davinci/runs/[id]/art.post.ts
//
// Attaches a resolved illustration to a Da Vinci life run as a LifeRunArt row.
// The narrator only *proposes* an artPrompt (server/utils/davinciNarration.ts);
// the client requests art for that prompt through the same shared
// /api/art/enqueue narrativeContext pipeline Storybook and Taskmaster already
// use (product: 'davinci'), then — once that job resolves to a real ArtImage —
// calls this route to persist the (lifeRunId, chapter, sceneType, prompt,
// artImageId) row. Only the run's owner may attach art to it.

import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../../../../utils/error'
import { requireApiUser } from '../../../../utils/authGuard'
import { attachLifeRunArt } from '../../../../utils/davinci'

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

    const body = await readBody(event)

    const data = await attachLifeRunArt(lifeRunId, user.id, {
      chapter: body?.chapter ?? null,
      sceneType: body?.sceneType,
      prompt: body?.prompt,
      artImageId: body?.artImageId,
    })

    response = {
      success: true,
      message: `Art attached to run ${lifeRunId}.`,
      data,
      statusCode: 201,
    }
    event.node.res.statusCode = 201
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to attach art to life run.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
