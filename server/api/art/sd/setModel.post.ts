// /server/api/art/sd/setModel.post.ts

import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const model = body?.model

    if (!model) throw new Error('No model specified.')

    const result = await $fetch(
      'https://lola.acrocatranch.com/sdapi/v1/options',
      {
        method: 'POST',
        body: {
          sd_model_checkpoint: model,
        },
      },
    )

    return { success: true, result }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    return {
      success: false,
      message: handledError.message || 'Failed to set model.',
    }
  }
})
