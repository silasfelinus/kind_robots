// /server/api/comfy/kontext.post.ts
import { defineEventHandler, readBody } from 'h3'
import fluxKontext from '~/utils/fluxKontext.json'

// 1x1 transparent PNG base64
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

    // Clone the fixed graph so we can modify it
    const graph = structuredClone(fluxKontext)

    // Replace node 191 (LoadImage) with LoadImageFromBase64
    graph['191'] = {
      class_type: 'LoadImageFromBase64',
      inputs: {
        image: body.imageData || defaultBase64Image,
      },
      _meta: { title: 'Load Image (Base64)' },
    }

    const promptId = `comfy-kontext-${Date.now()}`
    console.log(`[COMFY/KONTEXT] 🚀 Submitting prompt with ID: ${promptId}`)
    console.log('[COMFY/KONTEXT] 🔍 Graph:\n' + JSON.stringify(graph, null, 2))

    const res = await fetch(comfyHttpUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: graph }),
    })

    const json = await res.json()

    if (!json?.prompt_id) {
      console.warn('[COMFY/KONTEXT] ⚠️ No prompt_id in response')
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
    console.error('[COMFY/KONTEXT] ❌ Failed:', err)
    return {
      error: true,
      statusCode: 500,
      statusMessage: 'Comfy Kontext submit failed',
      message: err.message || 'Unknown error',
    }
  }
})
