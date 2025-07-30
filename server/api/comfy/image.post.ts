//server/api/comfy/image.post.ts

import { sendComfyPrompt } from '~/utils/comfy/sendComfyPrompt'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const {
    prompt,
    imageData,
    promptTextB,
    promptBlend,
    denoise = 0.95,
    strength = 0.6,
    width = 768,
    height = 1024,
    useUpscale = false,
    useInpaint = false,
    maskData,
  } = body

  if (!prompt || !imageData) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required prompt or imageData.',
    })
  }

  const result = await sendComfyPrompt({
    imageData,
    promptText: prompt,
    promptTextB,
    promptBlend,
    denoise,
    strength,
    width,
    height,
    useUpscale,
    useInpaint,
    maskData,
  })

  return result
})
