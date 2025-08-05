// server/api/comfy/flux/text.post.ts
import { defineEventHandler, readBody } from 'h3'
import fluxSchnell from '../../json/fluxSchnell.json'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const comfyHttpUrl =
    body.apiUrl ||
    (process.env.COMFY_URL ? `${process.env.COMFY_URL}/prompt` : null) ||
    'http://192.168.4.3/prompt'

  const prompt_id = `flux-${Date.now()}`
  console.log(`[FLUX] 🚀 Sending FLUX prompt with ID: ${prompt_id}`)

  try {
    const graph = structuredClone(fluxSchnell)

    // Inject values
    if (body.promptText) {
      graph['6'].inputs.text = body.promptText
    }
    if (body.negativePrompt !== undefined) {
      graph['33'].inputs.text = body.negativePrompt
    }
    if (body.cfg !== undefined) {
      graph['31'].inputs.cfg = body.cfg
    }
    if (body.denoise !== undefined) {
      graph['31'].inputs.denoise = body.denoise
    }
    if (body.steps !== undefined) {
      graph['31'].inputs.steps = body.steps
    }
    if (body.seed !== undefined) {
      graph['31'].inputs.seed = body.seed
    }
    if (body.ckpt_name) {
      graph['30'].inputs.ckpt_name = body.ckpt_name
    }
    if (body.width) {
      graph['27'].inputs.width = body.width
    }
    if (body.height) {
      graph['27'].inputs.height = body.height
    }

    const res = await fetch(comfyHttpUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: graph }),
    })

    const json = await res.json()

    if (json?.prompt_id) {
      console.log(`[FLUX] ✅ Queued prompt_id=${json.prompt_id}`)
      return {
        success: true,
        promptId: json.prompt_id,
        queuePosition: json.number ?? null,
        nodeErrors: json.node_errors ?? null,
      }
    }

    console.warn(`[FLUX] ⚠️ No prompt_id in response`)
    return {
      success: false,
      error: 'No prompt_id in response',
      debug: json,
    }
  } catch (err) {
    console.error(`[FLUX] ❌ HTTP error submitting prompt`, err)
    return {
      success: false,
      error: 'HTTP submission failed',
      detail: (err as Error).message,
    }
  }
})
