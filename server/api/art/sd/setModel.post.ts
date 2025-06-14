// /server/api/art/sd/setModel.post.ts
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../utils/error'

const SD_OPTIONS_URL = 'https://lola.acrocatranch.com/sdapi/v1/options'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const targetModel = body?.model?.trim()

    if (!targetModel) throw new Error('No model specified.')

    // Trigger the model switch
    await $fetch(SD_OPTIONS_URL, {
      method: 'POST',
      body: { sd_model_checkpoint: targetModel },
    })

    // Poll every 2s for up to 20s (10 attempts)
    const maxAttempts = 10
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

    let currentModel = ''
    let attempt = 0

    while (attempt < maxAttempts) {
      await delay(2000)

      const res = await $fetch<{ sd_model_checkpoint: string }>(SD_OPTIONS_URL)
      currentModel = res?.sd_model_checkpoint

      if (currentModel === targetModel) {
        return {
          success: true,
          message: `Model successfully switched to "${currentModel}" after ${2 * (attempt + 1)}s.`,
          model: currentModel,
        }
      }

      attempt++
    }

    // Timed out
    return {
      success: false,
      message: `Model switch to "${targetModel}" timed out after 20s. Current model is "${currentModel}".`,
      model: currentModel,
    }
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    return {
      success: false,
      message: handledError.message || 'Failed to set model.',
    }
  }
})
