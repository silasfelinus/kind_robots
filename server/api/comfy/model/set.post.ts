// server/api/comfy/model/set.post.ts
import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const ckpt = body?.ckpt || 'Flux/flux1-schnell-fp8.safetensors'
  const ws = new WebSocket(process.env.COMFY_WS || 'ws://127.0.0.1:8188/ws')
  const prompt_id = `loadckpt-${Date.now()}`

  const graph = {
    '1': {
      class_type: 'CheckpointLoaderSimple',
      inputs: { ckpt_name: ckpt },
    },
    '2': {
      class_type: 'EmptyLatentImage',
      inputs: { width: 64, height: 64 },
    },
    '3': {
      class_type: 'PreviewImage',
      inputs: { images: ['2', 0] },
    },
  }

  return await new Promise((resolve) => {
    const timeout = setTimeout(() => {
      ws.close()
      resolve({ success: false, error: 'Timeout loading checkpoint' })
    }, 15000)

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: 'prompt',
          prompt_id,
          prompt: graph,
        }),
      )
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'executed' && msg.data?.prompt_id === prompt_id) {
          clearTimeout(timeout)
          ws.close()
          resolve({ success: true, status: 'executed', promptId: prompt_id })
        } else if (msg.type === 'execution_error') {
          clearTimeout(timeout)
          ws.close()
          resolve({ success: false, error: msg.data?.error })
        }
      } catch (err) {
        clearTimeout(timeout)
        ws.close()
        resolve({ success: false, error: 'Invalid JSON in response' })
      }
    }

    ws.onerror = (err) => {
      clearTimeout(timeout)
      ws.close()
      resolve({ success: false, error: 'WebSocket error', detail: err })
    }
  })
})
