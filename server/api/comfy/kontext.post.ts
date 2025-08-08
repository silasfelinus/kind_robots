// /server/api/comfy/kontext.post.ts
import { defineEventHandler, readBody } from 'h3'
import fluxKontext from '~/utils/fluxKontext.json'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{
      apiUrl?: string
    }>(event)

    const comfyHttpUrl =
      body.apiUrl ||
      (process.env.COMFY_URL ? `${process.env.COMFY_URL}/prompt` : null)

    if (!comfyHttpUrl) {
      throw new Error('Missing COMFY_URL and no apiUrl provided')
    }

    const promptId = `comfy-kontext-${Date.now()}`
    console.log(`[COMFY/KONTEXT] 🚀 Submitting prompt with ID: ${promptId}`)
    console.log(
      '[COMFY/KONTEXT] 🔍 Graph:\n' + JSON.stringify(fluxKontext, null, 2),
    )

    const res = await fetch(comfyHttpUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: fluxKontext }),
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
