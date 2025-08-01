// server/api/comfy/flux/batch/[batchNumber].post.ts
import sd3Schnell from '~/utils/comfy/sd3Schnell.json'
import { defineEventHandler, readBody, getRouterParam } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const batchNumber = parseInt(getRouterParam(event, 'batchNumber') || '1', 10)
  const comfyHttpUrl =
    body.apiUrl ||
    (process.env.COMFY_URL ? `${process.env.COMFY_URL}/prompt` : null) ||
    'http://192.168.4.3/prompt'

  console.log(
    `[FLUX-BATCH] Starting batch of ${batchNumber} to ${comfyHttpUrl}`,
  )

  const results = []

  for (let i = 0; i < batchNumber; i++) {
    const prompt_id = `batch-${Date.now()}-${i}`
    const graph = structuredClone(sd3Schnell)

    graph['39'].inputs.wildcard_text = body.prompt
    graph['39'].inputs.populated_text = body.prompt
    graph['42'].inputs.text = body.negativePrompt || ''
    graph['30'].inputs.ckpt_name =
      body.ckpt_name || 'Flux/flux1-schnell-fp8.safetensors'
    graph['27'].inputs.width = body.width ?? 1024
    graph['27'].inputs.height = body.height ?? 1024
    graph['27'].inputs.batch_size = body.batch_size ?? 1
    graph['31'].inputs.cfg = body.cfg ?? 1
    graph['31'].inputs.steps = body.steps ?? 20
    graph['31'].inputs.denoise = body.denoise ?? 1
    graph['31'].inputs.sampler_name = body.sampler_name || 'euler'
    graph['31'].inputs.scheduler = body.scheduler || 'simple'
    graph['31'].inputs.seed =
      body.seed !== undefined ? body.seed + i : Math.floor(Math.random() * 1e18)
    graph['35'].inputs.guidance = body.guidance ?? 3.5

    try {
      const res = await fetch(comfyHttpUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: graph }),
      })

      const json = await res.json()

      if (json?.prompt_id) {
        results.push({
          status: 'queued',
          jobId: json.prompt_id,
          queuePosition: json.number ?? null,
          nodeErrors: json.node_errors ?? null,
        })
      } else {
        results.push({
          status: 'error',
          error: 'No prompt_id in response',
          debug: json,
        })
      }
    } catch (err) {
      results.push({
        status: 'error',
        error: (err as Error).message,
      })
    }
  }

  return {
    batch: batchNumber,
    results,
  }
})
