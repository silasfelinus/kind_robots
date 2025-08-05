// /server/api/comfy/tag.post.ts

import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const comfyHttpUrl = process.env.COMFY_URL
    ? `${process.env.COMFY_URL}/prompt`
    : null

  if (!body.imageData || !comfyHttpUrl) {
    return { error: 'Missing imageData or COMFY_URL' }
  }

  const promptId = `describe-${Date.now()}`

  const graph = {
    '0': {
      class_type: 'LoadImageFromBase64',
      inputs: {
        image_data: `data:image/png;base64,${body.imageData}`,
      },
    },
    '1': {
      class_type: 'CLIP Interrogator',
      inputs: {
        image: ['0', 0],
        mode: 'best', // or "fast", "caption", etc.
        clip_model: 'ViT-L-14/openai',
      },
    },
  }

  const res = await fetch(comfyHttpUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: graph }),
  })

  const json = await res.json()

  if (json?.prompt_id) {
    return {
      success: true,
      promptId: json.prompt_id,
    }
  }

  return {
    success: false,
    error: 'No prompt_id returned',
    raw: json,
  }
})
