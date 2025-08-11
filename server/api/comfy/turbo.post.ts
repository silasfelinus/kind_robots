// /server/api/comfy/turbo.post.ts
import { defineEventHandler, readBody } from 'h3'
import turboGraph from './json/fluxTurbo.json'

function asDataUrl(s?: string | null) {
  const t = (s ?? '').trim()
  if (!t) return ''
  return t.startsWith('data:image')
    ? t
    : `data:image/png;base64,${t.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '')}`
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

    // Ensure populated_text
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

    const dataUrl = asDataUrl(body.data ?? body.imageData)
    const hasUserImage = !!dataUrl
    if (hasUserImage) {
      const n63 = graph['63']
      n63.inputs = n63.inputs || {}
      n63.inputs.data = dataUrl // <-- feed data URL here
      if (n63.inputs.mask === undefined) n63.inputs.mask = ''
    } else {
      // No image provided. Remove the entire preview chain so Comfy will not execute 63.
      // Chain: 63 -> 73 -> 75 -> 74 -> 39 -> 42(latent)
      delete graph['64'] // PreviewImage
      delete graph['73'] // RebatchImages
      delete graph['75'] // ImageSimpleResize
      delete graph['63'] // LoadImageFromBase64
      delete graph['74'] // RebatchImages

      // Rewire ReferenceLatent to the empty latent so the model still runs
      const n42 = graph['42']
      if (!n42 || n42.class_type !== 'ReferenceLatent') {
        return {
          success: false,
          statusCode: 500,
          message: 'Graph missing node 42 (ReferenceLatent)',
        }
      }
      n42.inputs = n42.inputs || {}
      n42.inputs.latent = ['27', 0] // EmptySD3LatentImage

      // Optionally also remove VAEEncode(39) since it was only feeding 42
      // delete graph['39']  // safe to delete if you want it cleaner
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
