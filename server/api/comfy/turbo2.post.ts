// /server/api/comfy/turbo.post.ts
import { defineEventHandler, readBody } from 'h3'
import turboGraph from './json/fluxTurbo.json'

function toRawBase64(input?: string | null) {
  const s = (input ?? '').trim()
  const stripped = s.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '')
  if (!stripped) return ''
  const pad = (4 - (stripped.length % 4)) % 4
  return stripped + '='.repeat(pad)
}
const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32)

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{ apiUrl?: string; data?: string; imageData?: string; prompt?: string }>(event)
    const comfyHttpUrl = body.apiUrl || (process.env.COMFY_URL ? `${process.env.COMFY_URL}/prompt` : null)
    if (!comfyHttpUrl) return { success: false, statusCode: 400, message: 'Missing COMFY_URL and no apiUrl provided' }

    const graph: any = structuredClone(turboGraph)

    // --- TEXT: force ImpactWildcardEncode to use the user's prompt verbatim
    const n61 = graph['61']
    if (!n61 || n61.class_type !== 'ImpactWildcardEncode')
      return { success: false, statusCode: 500, message: 'Graph missing node 61 (ImpactWildcardEncode)' }

    const userPrompt =
      (body.prompt && body.prompt.trim()) ||
      'a bright yellow rubber duck centered on a clean blue background, flat, high contrast'
    n61.inputs.populated_text = userPrompt
    n61.inputs.mode = 'populate'          // <-- add
    n61.inputs.wildcard_text = ''         // <-- add (disable wildcards/LoRA mixing)

    // --- QUALITY: slightly stronger defaults for GGUF
    if (graph['17']?.class_type === 'BasicScheduler') graph['17'].inputs.steps = 28   // <-- add
    if (graph['26']?.class_type === 'FluxGuidance')   graph['26'].inputs.guidance = 3.8 // <-- add

    // --- nicer test filenames so you can spot results
    if (graph['9']?.class_type === 'SaveImage') graph['9'].inputs.filename_prefix = `turbo-${slug(userPrompt)}-` // <-- add

    // --- IMAGE HANDLING (your existing logic)
    const raw = toRawBase64(body.data ?? body.imageData)
    const hasUserImage = !!raw

    if (hasUserImage) {
      const n63 = graph['63']
      if (!n63 || n63.class_type !== 'LoadImageFromBase64')
        return { success: false, statusCode: 500, message: 'Graph missing node 63 (LoadImageFromBase64)' }
      n63.inputs = n63.inputs || {}
      n63.inputs.data = raw
      if (n63.inputs.mask === undefined) n63.inputs.mask = ''
    } else {
      delete graph['64']; delete graph['73']; delete graph['75']; delete graph['63']; delete graph['74']
      const n42 = graph['42']
      if (!n42 || n42.class_type !== 'ReferenceLatent')
        return { success: false, statusCode: 500, message: 'Graph missing node 42 (ReferenceLatent)' }
      n42.inputs = n42.inputs || {}
      n42.inputs.latent = ['27', 0]
    }

    const clientId = `comfy-turbo-${Date.now()}`
    const res = await fetch(comfyHttpUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: graph, client_id: clientId }) })
    const json = await res.json().catch(() => null)

    if (!res.ok) return { success: false, statusCode: res.status, message: `Comfy error: ${res.statusText}`, debug: json }
    if (!json?.prompt_id) return { success: false, statusCode: 502, message: 'No prompt_id in Comfy response', debug: json }

    return { success: true, promptId: json.prompt_id, queuePosition: json.number ?? null, nodeErrors: json.node_errors ?? null }
  } catch (err: any) {
    return { success: false, statusCode: 500, message: err?.message ?? 'Unknown error' }
  }
})