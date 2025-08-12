// /server/api/comfy/turbo.post.ts
import { defineEventHandler, readBody } from 'h3'
import turboGraph from './json/fluxTurbo.json'
import defaultImageJson from './json/defaultImage.json' // { "base64": "<no data: header>" }

// If you're on TS, make sure tsconfig has: "resolveJsonModule": true
const DEFAULT_IMAGE_BASE64: string =
  (defaultImageJson as { base64?: string })?.base64 || ''

// RAW base64 with padding — what custom nodes often expect
function toRawBase64(s?: string | null) {
  const t = (s ?? '').trim()
  if (!t) return ''
  const raw = t.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '')
  const pad = (4 - (raw.length % 4)) % 4
  return raw + '='.repeat(pad)
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{
      apiUrl?: string
      data?: string | string[]
      imageData?: string | string[]
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

    // Prompt into ImpactWildcardEncode (61)
    const n61 = graph['61']
    if (!n61 || n61.class_type !== 'ImpactWildcardEncode') {
      return {
        success: false,
        statusCode: 500,
        message: 'Graph missing node 61 (ImpactWildcardEncode)',
      }
    }
    n61.inputs = n61.inputs || {}
    const existing = n61.inputs.populated_text
    n61.inputs.populated_text =
      (body.prompt && body.prompt.trim()) ||
      (typeof existing === 'string' && existing.trim()) ||
      'keep framing, remix style'

    // --- Image selection with JSON default ---
    // Prefer user-provided image(s); if none, use defaultImage.json.base64 (if present).
    const provided = body.data ?? body.imageData
    const source =
      (Array.isArray(provided) && provided.length === 0) || provided == null
        ? DEFAULT_IMAGE_BASE64
          ? DEFAULT_IMAGE_BASE64
          : null
        : provided

    const arr = Array.isArray(source)
      ? source
      : ([source].filter(Boolean) as string[])
    const raws = arr.map(toRawBase64).filter(Boolean)
    const hasImage = raws.length > 0

    if (hasImage) {
      // Prefer node 63 (LoadImageFromBase64); else support 81 (LoadImagesToBatch)
      const n63 = graph['63']
      const n81 = graph['81']

      if (n63 && n63.class_type === 'LoadImageFromBase64') {
        n63.inputs = n63.inputs || {}
        n63.inputs.data = raws[0] // single-image loader
        if (n63.inputs.mask === undefined) n63.inputs.mask = ''
      } else if (n81 && n81.class_type === 'LoadImagesToBatch') {
        n81.inputs = n81.inputs || {}
        n81.inputs.images = n81.inputs.images || {}
        n81.inputs.images.base64 = raws // multi-image batch
        if (graph['27']?.class_type === 'EmptySD3LatentImage') {
          graph['27'].inputs = graph['27'].inputs || {}
          graph['27'].inputs.batch_size = raws.length
        }
      } else {
        return {
          success: false,
          statusCode: 500,
          message:
            'Graph has neither node 63 (LoadImageFromBase64) nor 81 (LoadImagesToBatch).',
        }
      }

      if (graph['64']?.class_type === 'PreviewImage') delete graph['64']
    } else {
      // No image available at all (no user input and no JSON default) → imageless path
      const n42 = graph['42'] // ReferenceLatent
      const n13 = graph['13'] // SamplerCustomAdvanced
      if (!n42 || n42.class_type !== 'ReferenceLatent') {
        return {
          success: false,
          statusCode: 500,
          message: 'Graph missing node 42 (ReferenceLatent)',
        }
      }
      if (!n13 || n13.class_type !== 'SamplerCustomAdvanced') {
        return {
          success: false,
          statusCode: 500,
          message: 'Graph missing node 13 (SamplerCustomAdvanced)',
        }
      }
      n42.inputs = n42.inputs || {}
      n13.inputs = n13.inputs || {}
      n42.inputs.latent = ['27', 0]
      n13.inputs.latent_image = ['27', 0]
    }

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
