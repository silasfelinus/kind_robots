// /server/api/comfy/turbo.post.ts
import { defineEventHandler, readBody } from 'h3'
import turboGraph from '~/utils/fluxTurbo.json'

// Default 1x1 transparent PNG (raw base64, no header)
const defaultRaw =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADjgGRzSVcrwAAAABJRU5ErkJggg=='

// Helper ensures the LoadImageFromBase64 "data" field has proper header
function asDataUrl(s: string) {
  return s.startsWith('data:image') ? s : `data:image/png;base64,${s}`
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{
      apiUrl?: string
      data?: string // preferred: base64 (with or without data: header)
      imageData?: string // legacy field (raw base64)
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

    // ---- Validate and set node 63 (LoadImageFromBase64) ----
    if (!graph['63'] || graph['63'].class_type !== 'LoadImageFromBase64') {
      return {
        success: false,
        statusCode: 500,
        message: 'Graph missing node 63 (LoadImageFromBase64)',
      }
    }

    // Prefer `data`, fall back to `imageData`, else default
    const incoming = body.data ?? body.imageData ?? defaultRaw
    graph['63'].inputs.data = asDataUrl(incoming)

    // ---- Ensure node 61 (ImpactWildcardEncode) has populated_text ----
    if (!graph['61'] || graph['61'].class_type !== 'ImpactWildcardEncode') {
      return {
        success: false,
        statusCode: 500,
        message: 'Graph missing node 61 (ImpactWildcardEncode)',
      }
    }

    // Provide a safe default if the graph doesn’t already have one
    const existing = graph['61'].inputs.populated_text
    graph['61'].inputs.populated_text =
      typeof body.prompt === 'string' && body.prompt.trim().length > 0
        ? body.prompt.trim()
        : typeof existing === 'string' && existing.trim().length > 0
          ? existing
          : 'keep framing, remix style'

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
