// /server/api/comfy/generate.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../utils/error'

type ComfyRequest = {
  prompt: string
  user?: string
  cfg?: number
  seed?: number
  steps?: number
}

type ComfyResponse = {
  images: string[]
  error?: string
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<ComfyRequest>(event)

    if (!body?.prompt) {
      throw createError({ statusCode: 400, message: 'Missing prompt.' })
    }

    const comfyResponse = await generateImageFromComfy({
      prompt: body.prompt,
      user: body.user || 'kindguest',
      cfg: body.cfg ?? 3,
      seed: body.seed ?? -1,
      steps: body.steps ?? 20,
    })

    if (!comfyResponse.images.length) {
      throw createError({
        statusCode: 500,
        message: comfyResponse.error || 'Comfy server returned no images.',
      })
    }

    return {
      success: true,
      data: comfyResponse.images,
    }
  } catch (error: any) {
    console.error('🔥 Comfy error:', error)
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Unknown error from Comfy backend',
    }
  }
})

async function generateImageFromComfy({
  prompt,
  user,
  cfg,
  seed,
  steps,
}: ComfyRequest): Promise<ComfyResponse> {
  try {
    const response = await fetch('https://comfy.acrocatranch.com/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        user,
        cfg_scale: cfg,
        seed,
        steps,
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('❌ Comfy responded with error:', text)
      return { images: [], error: text }
    }

    const data = await response.json()
    return {
      images: data.images || [],
      error: data.error,
    }
  } catch (err: any) {
    console.error('❌ Comfy network error:', err)
    return {
      images: [],
      error: 'Connection to Comfy failed',
    }
  }
}
