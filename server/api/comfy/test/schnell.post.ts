// server/api/comfy/flux/schnell.post.ts
import sd3Schnell from '../../comfybak/json/sd3Schnell.json'
import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const comfyHttpUrl =
    body.apiUrl ||
    (process.env.COMFY_URL ? `${process.env.COMFY_URL}/prompt` : null) ||
    'http://192.168.4.3/prompt'

  const prompt_id = `sd3-${Date.now()}`
  console.log(`[SD3] 🚀 Sending HTTP prompt with ID: ${prompt_id}`)

  try {
    const graph = structuredClone(sd3Schnell) as Record<string, any>

    graph['39'].inputs.wildcard_text = body.prompt || 'A surreal dream'
    graph['39'].inputs.populated_text = body.prompt || 'A surreal dream'
    graph['42'].inputs.text = body.negativePrompt || ''
    graph['30'].inputs.ckpt_name =
      body.ckpt_name || 'Flux/flux1-schnell-fp8.safetensors'
    graph['27'].inputs.width = body.width ?? 1024
    graph['27'].inputs.height = body.height ?? 1024
    graph['27'].inputs.batch_size = body.batch_size ?? 1
    graph['31'].inputs.cfg = body.cfg ?? 1
    graph['31'].inputs.steps = body.steps ?? 10
    graph['31'].inputs.denoise = body.denoise ?? 1
    graph['31'].inputs.sampler_name = body.sampler_name || 'euler'
    graph['31'].inputs.scheduler = body.scheduler || 'simple'
    graph['31'].inputs.seed = body.seed ?? Math.floor(Math.random() * 1e18)

    const res = await fetch(comfyHttpUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: graph }),
    })

    const json = await res.json()

    if (json?.prompt_id) {
      console.log(`[SD3] ✅ Prompt queued with ID: ${json.prompt_id}`)
      return {
        success: true,
        promptId: json.prompt_id,
        queuePosition: json.number ?? null,
        nodeErrors: json.node_errors ?? null,
      }
    }

    console.warn(`[SD3] ⚠️ No prompt_id in response`)
    return {
      success: false,
      error: 'No prompt_id in response',
      debug: json,
    }
  } catch (err) {
    console.error(`[SD3] ❌ Failed to submit HTTP prompt`, err)
    return {
      success: false,
      error: 'Failed to submit prompt via HTTP',
      detail: (err as Error).message,
    }
  }
})
