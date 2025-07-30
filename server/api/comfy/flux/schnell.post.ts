// server/api/comfy/sd3/text.post.ts
import sd3Schnell from '~/utils/comfy/sd3Schnell.json'
import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const prompt_id = `sd3-${Date.now()}`
  const wsUrl = body.wsUrl || process.env.COMFY_WS || 'ws://192.168.4.3:8188/ws'
  const ws = new WebSocket(wsUrl)

  console.log(`[SD3] Connecting to WebSocket at: ${wsUrl}`)
  console.log(`[SD3] Using prompt_id: ${prompt_id}`)

  // Inject user values into cloned graph
  const graph = structuredClone(sd3Schnell)

  graph['39'].inputs.wildcard_text = body.prompt || 'A surreal dream'
  graph['39'].inputs.populated_text = body.prompt || 'A surreal dream'
  graph['30'].inputs.ckpt_name =
    body.ckpt_name || 'Flux/flux1-schnell-fp8.safetensors'
  graph['31'].inputs.cfg = body.cfg ?? 1
  graph['31'].inputs.denoise = body.denoise ?? 1
  graph['27'].inputs.width = body.width ?? 1024
  graph['27'].inputs.height = body.height ?? 1024

  return await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.error(`[SD3] Timeout after 20s waiting for queue confirmation`)
      ws.close()
      reject(new Error('Timeout while waiting for queue confirmation'))
    }, 20000)

    ws.onopen = () => {
      console.log('[SD3] WebSocket connection opened')
      ws.send(
        JSON.stringify({
          type: 'prompt',
          prompt_id,
          prompt: graph,
        }),
      )
      console.log('[SD3] Prompt sent to WebSocket')
    }

    ws.onerror = (err) => {
      console.error('[SD3] WebSocket error:', err)
      clearTimeout(timeout)
      ws.close()
      reject(err)
    }

    ws.onclose = (event) => {
      console.log(
        `[SD3] WebSocket closed (code: ${event.code}, reason: ${event.reason})`,
      )
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        console.log('[SD3] Message received:', message)

        if (
          message.type === 'queue_prompt' &&
          message.data.prompt_id === prompt_id
        ) {
          console.log('[SD3] Prompt accepted and queued')
          clearTimeout(timeout)
          ws.close()
          resolve({
            status: 'queued',
            jobId: message.data.prompt_id,
            queuePosition: message.data.number,
          })
        }

        if (message.type === 'execution_error') {
          console.error('[SD3] Execution error:', message.data.error)
          clearTimeout(timeout)
          ws.close()
          reject(new Error(message.data.error || 'Execution error'))
        }
      } catch (err) {
        console.error('[SD3] Error parsing WebSocket message:', err)
        clearTimeout(timeout)
        ws.close()
        reject(err)
      }
    }
  })
})
