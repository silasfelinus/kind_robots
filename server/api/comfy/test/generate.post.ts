// /server/api/comfy/test/generate.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import { generateComfyImageDirect } from './comfyDirect'

export default defineEventHandler(async (event) => {
  const authorizationHeader = event.node.req.headers.authorization

  if (!authorizationHeader?.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      message:
        'Authorization token is required in the format "Bearer <token>".',
    })
  }

  const body = await readBody<{
    prompt?: string
    imageData?: string
    apiUrl?: string
    width?: number
    height?: number
    seed?: number
    steps?: number
    cfg?: number
    samplerName?: string
    scheduler?: string
    timeoutMs?: number
    intervalMs?: number
  }>(event)

  return await generateComfyImageDirect({
    prompt: body.prompt || '',
    imageData: body.imageData,
    apiUrl: body.apiUrl,
    width: body.width,
    height: body.height,
    seed: body.seed,
    steps: body.steps,
    cfg: body.cfg,
    samplerName: body.samplerName,
    scheduler: body.scheduler,
    timeoutMs: body.timeoutMs,
    intervalMs: body.intervalMs,
  })
})
