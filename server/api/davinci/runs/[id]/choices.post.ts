// /server/api/davinci/runs/[id]/choices.post.ts
//
// Records a LifeChoice on an ACTIVE run and applies its stat effects (dimension
// -> integer delta) atomically. Returns the created choice plus the run's full
// post-choice stats. Only the run's owner may act; resolved/abandoned runs are
// rejected with 409.

import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../../../../utils/error'
import { requireApiUser } from '../../../../utils/authGuard'
import { recordLifeChoice } from '../../../../utils/davinci'

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

    const data = await recordLifeChoice(lifeRunId, user.id, {
      chapter: body?.chapter,
      prompt: body?.prompt,
      choiceText: body?.choiceText,
      resultText: body?.resultText,
      effects: body?.effects,
      chatId: body?.chatId,
    })

    response = {
      success: true,
      message: `Choice recorded on run ${lifeRunId}.`,
      data,
      statusCode: 201,
    }
    event.node.res.statusCode = 201
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to record choice.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
