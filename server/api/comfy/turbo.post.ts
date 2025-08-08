// /server/api/comfy/turbo.post.ts
import { defineEventHandler, readBody } from 'h3'
import turboGraph from '~/utils/fluxTurbo.json' // save your JSON above as utils/fluxTurbo.json

// Default 1x1 transparent PNG base64
const defaultBase64Image =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADjgGRzSVcrwAAAABJRU5ErkJggg=='

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{
      apiUrl?: string
      imageData?: string
    }>(event)

    const comfyHttpUrl =
      body.apiUrl ||
      (process.env.COMFY_URL ? `${process.env.COMFY_URL}/prompt` : null)

    if (!comfyHttpUrl) {
      throw new Error('Missing COMFY_URL and no apiUrl provided')
    }

    // Clone the fixed GGUF turbo graph so we can modify it
    const graph = structuredClone(turboGraph)

    // Replace node 62 (LoadImageOutput) with LoadImageFromBase64 if imageData present
    if (body.imageData || !graph['62']) {
      graph['62'] = {
        class_type: 'LoadImageFromBase64',
        inputs: {
          image: body.imageData || defaultBase64Image,
          refresh: 'refresh', // satisfies the existing type
        },
        _meta: { title: 'Load Image (Base64)' },
      }
    }

    const promptId = `comfy-turbo-${Date.now()}`
    console.log(`[COMFY/TURBO] 🚀 Submitting prompt with ID: ${promptId}`)
    console.log('[COMFY/TURBO] 🔍 Graph:\n' + JSON.stringify(graph, null, 2))

    const res = await fetch(comfyHttpUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: graph }),
    })

    const json = await res.json()

    if (!json?.prompt_id) {
      console.warn('[COMFY/TURBO] ⚠️ No prompt_id in response')
      return {
        success: false,
        error: 'No prompt_id in Comfy response',
        debug: json,
      }
    }

    return {
      success: true,
      promptId: json.prompt_id,
      queuePosition: json.number ?? null,
      nodeErrors: json.node_errors ?? null,
    }
  } catch (err: any) {
    console.error('[COMFY/TURBO] ❌ Failed:', err)
    return {
      error: true,
      statusCode: 500,
      statusMessage: 'Comfy Turbo submit failed',
      message: err.message || 'Unknown error',
    }
  }
})
