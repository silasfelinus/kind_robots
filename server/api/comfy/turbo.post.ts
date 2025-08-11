// /server/api/comfy/turbo.post.ts
import { defineEventHandler, readBody } from 'h3'
import turboGraph from './json/fluxTurbo.json'

// RAW base64 with padding — what your custom node expects
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
      data?: string
      imageData?: string
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
    const existing = n61.inputs?.populated_text
    n61.inputs.populated_text =
      (body.prompt && body.prompt.trim()) ||
      (typeof existing === 'string' && existing.trim()) ||
      'keep framing, remix style'

    // Image handling (RAW base64 only)
    const raw = toRawBase64(body.data ?? body.imageData)
    const hasUserImage = !!raw

    // Always remove Preview node; we don't need it in API
    delete graph['64'] // PreviewImage

    if (hasUserImage) {
      const n63 = graph['63']
      if (!n63 || n63.class_type !== 'LoadImageFromBase64') {
        return {
          success: false,
          statusCode: 500,
          message: 'Graph missing node 63 (LoadImageFromBase64)',
        }
      }
      n63.inputs = n63.inputs || {}
      n63.inputs.data = raw
      if (n63.inputs.mask === undefined) n63.inputs.mask = ''
      // keep resize/encode chain (73 -> 75 -> 74 -> 39) intact
    } else {
      // No image: cut the image path and rewire both ReferenceLatent and Sampler to the empty latent
      delete graph['73'] // RebatchImages
      delete graph['75'] // ImageSimpleResize
      delete graph['63'] // LoadImageFromBase64
      delete graph['74'] // RebatchImages

      const n42 = graph['42'] // ReferenceLatent
      if (!n42 || n42.class_type !== 'ReferenceLatent') {
        return {
          success: false,
          statusCode: 500,
          message: 'Graph missing node 42 (ReferenceLatent)',
        }
      }
      n42.inputs = n42.inputs || {}
      n42.inputs.latent = ['27', 0] // EmptySD3LatentImage

      const n13 = graph['13'] // SamplerCustomAdvanced
      if (!n13 || n13.class_type !== 'SamplerCustomAdvanced') {
        return {
          success: false,
          statusCode: 500,
          message: 'Graph missing node 13 (SamplerCustomAdvanced)',
        }
      }
      n13.inputs = n13.inputs || {}
      n13.inputs.latent_image = ['27', 0]

      // VAEEncode (39) is now unused; safe to delete if you want:
      // delete graph['39']
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
