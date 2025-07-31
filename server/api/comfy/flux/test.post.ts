// server/api/comfy/test.post.ts
import { defineEventHandler } from 'h3'

export default defineEventHandler(async () => {
  const prompt_id = `testprompt-${Date.now()}`
  const wsUrl = process.env.COMFY_WS || 'ws://127.0.0.1:8188/ws'

  const minimalGraph = {
    '1': {
      class_type: 'EmptyLatentImage',
      inputs: { width: 64, height: 64 },
    },
    '2': {
      class_type: 'LoadCheckpoint',
      inputs: { ckpt_name: 'sd_xl_base_1.0.safetensors' },
    },
    '3': {
      class_type: 'KSampler',
      inputs: {
        steps: 2,
        cfg: 1,
        seed: Math.floor(Math.random() * 1e18),
        sampler_name: 'euler',
        scheduler: 'karras',
        denoise: 1,
        model: ['2', 0],
        latent_image: ['1', 0],
      },
    },
    '4': {
      class_type: 'VAEDecode',
      inputs: {
        samples: ['3', 0],
        vae: ['2', 2],
      },
    },
    '5': {
      class_type: 'SaveImage',
      inputs: { images: ['4', 0] },
    },
  }

  return await new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl)

    const timeout = setTimeout(() => {
      ws.close()
      reject(new Error('Timeout: No response from ComfyUI'))
    }, 15000)

    ws.onopen = () => {
      console.log('[TESTPROMPT] Connected to Comfy')
      ws.send(
        JSON.stringify({
          type: 'prompt',
          prompt_id,
          prompt: minimalGraph,
        }),
      )
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
            promptId: prompt_id,
            queuePosition: message.data.number,
          })
        }
      } catch (err) {
        clearTimeout(timeout)
        ws.close()
        reject(new Error('Invalid JSON in response'))
      }
    }

    ws.onerror = () => {
      clearTimeout(timeout)
      reject(new Error('WebSocket error'))
    }

    ws.onclose = () => {
      console.log(`[TESTPROMPT] Closed for ${prompt_id}`)
    }
  })
})
