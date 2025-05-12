// /server/api/comfy/generate.post.ts
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '@/server/api/utils/error' // assume your usual handler
import { $fetch } from 'ofetch'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{ prompt: string }>(event)

    if (!body?.prompt) {
      return errorHandler({ message: 'Missing prompt', statusCode: 400 })
    }

    const comfyServerURL =
      process.env.COMFY_SERVER_URL || 'https://comfy.acrocatranch.com/generate'

    const response = await $fetch(comfyServerURL, {
      method: 'POST',
      body: {
        prompt: body.prompt,
      },
    })

    return {
      success: true,
      data: response,
    }
  } catch (error) {
    return errorHandler({ error })
  }
})
