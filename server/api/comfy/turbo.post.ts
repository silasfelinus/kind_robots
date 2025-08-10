// /server/api/comfy/turbo.post.ts
import { defineEventHandler, readBody } from 'h3'
import turboGraph from '~/utils/fluxTurbo.json'

// Default 1x1 transparent PNG (raw base64, no header)
const defaultRaw =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADjgGRzSVcrwAAAABJRU5ErkJggg=='

// Convert possible data URL -> raw base64 & fix padding
function toRawBase64(input: string | undefined | null) {
  const s = (input ?? '').trim()
  const stripped = s.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '')
  const base = stripped || defaultRaw
  const pad = (4 - (base.length % 4)) % 4
  return base + '='.repeat(pad)
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{
      apiUrl?: string
      data?: string // raw base64 or data URL
      imageData?: string // legacy raw base64
      prompt?: string // optional: fills populated_text
    }>(event)

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

    const graph: any = structuredClone(turboGraph)

    // ---- Node 63: LoadImageFromBase64 expects RAW base64 in "data" ----
    if (!graph['63'] || graph['63'].class_type !== 'LoadImageFromBase64') {
      return {
        success: false,
        statusCode: 500,
        message: 'Graph missing node 63 (LoadImageFromBase64)',
      }
    }
    const incoming = body.data ?? body.imageData
    graph['63'].inputs.data = toRawBase64(incoming)

    // ---- Node 61: ensure populated_text present ----
    if (!graph['61'] || graph['61'].class_type !== 'ImpactWildcardEncode') {
      return {
        success: false,
        statusCode: 500,
        message: 'Graph missing node 61 (ImpactWildcardEncode)',
      }
    }
    const existing = graph['61'].inputs.populated_text
    graph['61'].inputs.populated_text =
      body.prompt?.trim() ||
      (typeof existing === 'string' && existing.trim()) ||
      'keep framing, remix style'

    const promptId = `comfy-turbo-${Date.now()}`
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
