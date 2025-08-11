// /server/api/comfy/turbo.post.ts
import { defineEventHandler, readBody } from 'h3'
import turboGraph from '~/utils/fluxTurbo.json'

// Default 1x1 transparent PNG (raw base64, no header)
const defaultRaw =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADjgGRzSVcrwAAAABJRU5ErkJggg=='

// Ensure the LoadImageFromBase64 "data" field has a data URL header
function asDataUrl(input?: string | null) {
  const s = (input ?? '').trim()
  if (!s) return `data:image/png;base64,${defaultRaw}`
  // If the caller already sent a data URL, keep it; otherwise wrap it.
  return s.startsWith('data:image') ? s : `data:image/png;base64,${s}`
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{
      apiUrl?: string
      data?: string // base64 with or without data: header
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

    // ---- Node 63: LoadImageFromBase64 must get a data URL ----
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
    n63.inputs.data = asDataUrl(incoming)
    // be explicit: some versions accept an empty mask to avoid auto-construct
    if (n63.inputs.mask === undefined) n63.inputs.mask = ''

    // ---- Node 61: ensure populated_text present ----
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
