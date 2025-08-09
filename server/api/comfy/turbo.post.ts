// /server/api/comfy/kontext.post.ts
import { defineEventHandler, readBody } from 'h3'
import kontextGraph from '~/utils/fluxTurbo.json'

const defaultBase64Image =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADjgGRzSVcrwAAAABJRU5ErkJggg=='

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{ apiUrl?: string; imageData?: string }>(event)

    const comfyHttpUrl =
      body.apiUrl ||
      (process.env.COMFY_URL ? `${process.env.COMFY_URL}/prompt` : null)

    if (!comfyHttpUrl) {
      return {
        success: false,
        statusCode: 400,
        message: 'Missing COMFY_URL and no apiUrl provided',
      }
    }

    const graph = structuredClone(kontextGraph)

    if (!graph['63'] || graph['63'].class_type !== 'LoadImageFromBase64') {
      return {
        success: false,
        statusCode: 500,
        message: 'Graph missing node 63 (LoadImageFromBase64)',
      }
    }

    graph['63'].inputs.image = body.imageData || defaultBase64Image

    const promptId = `comfy-kontext-${Date.now()}`
    const res = await fetch(comfyHttpUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: graph, client_id: promptId }),
    })

    const json = await res.json().catch(() => null)

    if (!res.ok) {
      return {
        success: false,
        statusCode: res.status,
        message: `Comfy error: ${res.statusText}`,
        debug: json,
      }
    }

    if (!json?.prompt_id) {
      return {
        success: false,
        statusCode: 502,
        message: 'No prompt_id in Comfy response',
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
    return {
      success: false,
      statusCode: 500,
      message: err?.message ?? 'Unknown error',
    }
  }
})
