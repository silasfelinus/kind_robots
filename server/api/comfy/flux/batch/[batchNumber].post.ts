// server/api/comfy/flux/batch/[batchNumber].post.ts
import sd3Schnell from '~/utils/comfy/sd3Schnell.json'
import { defineEventHandler, readBody, getRouterParam } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const batchNumber = parseInt(getRouterParam(event, 'batchNumber') || '1', 10)
  const wsUrl = body.wsUrl || process.env.COMFY_WS || 'ws://192.168.4.3:8188/ws'

  console.log(`[FLUX-BATCH] Starting batch of ${batchNumber} to ${wsUrl}`)

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

    const result = await new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl)
      const timeout = setTimeout(() => {
        console.error(
          `[FLUX-BATCH] Timeout waiting for prompt_id: ${prompt_id}`,
        )
        ws.close()
        reject(new Error('Timeout while waiting for queue confirmation'))
      }, 20000)

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'prompt', prompt_id, prompt: graph }))
      }

      ws.onerror = (err) => {
        clearTimeout(timeout)
        ws.close()
        reject(err)
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          if (
            message.type === 'queue_prompt' &&
            message.data.prompt_id === prompt_id
          ) {
            clearTimeout(timeout)
            ws.close()
            resolve({
              status: 'queued',
              jobId: prompt_id,
              queuePosition: message.data.number,
            })
          } else if (message.type === 'execution_error') {
            clearTimeout(timeout)
            ws.close()
            reject(new Error(message.data.error || 'Execution error'))
          }
        } catch (err) {
          clearTimeout(timeout)
          ws.close()
          reject(err)
        }
      }
    })

    results.push(result)
  }

  return {
    batch: batchNumber,
    results,
  }
})
