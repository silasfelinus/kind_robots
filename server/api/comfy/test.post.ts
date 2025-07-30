// server/api/comfy/test.post.ts
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

  if (!prompt) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing prompt.',
    })
  }

  const blankImage =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQI12NgYGBgAAAABQABDQottgAAAABJRU5ErkJggg=='

  const result = await sendComfyPrompt({
    imageData: imageData || blankImage,
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
