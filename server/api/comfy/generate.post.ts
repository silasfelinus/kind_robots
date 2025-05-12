// /server/api/comfy/generate.post.ts
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '@/server/api/utils/error'
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
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        prompt: body.prompt,
      },
    })

    return {
      success: true,
      data: response,
    }
  } catch (error: any) {
    console.error('🔥 Comfy Error:', error?.data || error?.message || error)
    return errorHandler({
      error,
      message: 'Comfy server failed to respond properly',
      statusCode: error?.statusCode || 500,
    })
  }
})
