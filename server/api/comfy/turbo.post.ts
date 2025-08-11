// /server/api/comfy/turbo.post.ts
import { defineEventHandler, readBody } from 'h3'
import turboGraph from '~/utils/fluxTurbo.json'

// Default 1x1 transparent PNG (RAW base64, no header)
const defaultRaw =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADjgGRzSVcrwAAAABJRU5ErkJggg=='

// Convert possible data URL -> RAW base64 & fix padding
function toRawBase64(input?: string | null) {
  const s = (input ?? '').trim()
  // strip data URL header if present
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
      prompt?: string
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

    // ---- Node 63: requires RAW base64 in "data"
    const n63 = graph['63']
    if (!n63 || n63.class_type !== 'LoadImageFromBase64') {
      return {
        success: false,
        statusCode: 500,
        message: 'Graph missing node 63 (LoadImageFromBase64)',
      }
    }
    const incoming = body.data ?? body.imageData
    n63.inputs = n63.inputs || {}
    n63.inputs.data = toRawBase64(incoming) // <-- RAW base64 only
    if (n63.inputs.mask === undefined) n63.inputs.mask = '' // be explicit

    // ---- Node 61: ensure populated_text present
    const n61 = graph['61']
    if (!n61 || n61.class_type !== 'ImpactWildcardEncode') {
      return {
        success: false,
        statusCode: 500,
        message: 'Graph missing node 61 (ImpactWildcardEncode)',
      }
    }
    const existing = n61.inputs?.populated_text
    n61.inputs.populated_text =
      (body.prompt && body.prompt.trim()) ||
      (typeof existing === 'string' && existing.trim()) ||
      'keep framing, remix style'

    const clientId = `comfy-turbo-${Date.now()}`
    const res = await fetch(comfyHttpUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: graph, client_id: clientId }),
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
