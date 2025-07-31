// server/api/comfy/test.post.ts
import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const prompt_id = `testprompt-${Date.now()}`
  const body = await readBody(event)
  const wsUrl = body.wsUrl || process.env.COMFY_WS || 'ws://127.0.0.1:8188/ws'

  console.log(`[TESTPROMPT] Starting test for prompt_id: ${prompt_id}`)
  console.log(`[TESTPROMPT] Connecting to WebSocket at: ${wsUrl}`)

  const minimalGraph = {
    '1': {
      class_type: 'EmptyLatentImage',
      inputs: { width: 64, height: 64 },
    },
    '2': {
      class_type: 'LoadCheckpoint',
      inputs: {
        ckpt_name: body.ckpt_name || 'sd_xl_base_1.0.safetensors',
      },
    },
    '3': {
      class_type: 'KSampler',
      inputs: {
        steps: 2,
        cfg: body.cfg ?? 1,
        seed: Math.floor(Math.random() * 1e18),
        sampler_name: 'euler',
        scheduler: 'karras',
        denoise: body.denoise ?? 1,
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
      console.error(`[TESTPROMPT] ❌ Timeout for prompt_id: ${prompt_id}`)
      ws.close()
      reject({
        success: false,
        promptId: prompt_id,
        error: 'Timeout: No response from ComfyUI',
      })
    }, 15000)

    ws.onopen = () => {
      console.log(`[TESTPROMPT] ✅ Connected! Sending prompt ${prompt_id}`)
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
        console.log(
          `[TESTPROMPT] 📨 Received message for prompt_id ${prompt_id}:`,
          message,
        )

        if (
          message.type === 'queue_prompt' &&
          message.data.prompt_id === prompt_id
        ) {
          clearTimeout(timeout)
          ws.close()
          console.log(
            `[TESTPROMPT] ✅ Prompt queued at position ${message.data.number}`,
          )
          resolve({
            success: true,
            status: 'queued',
            promptId: prompt_id,
            queuePosition: message.data.number,
          })
        }
      } catch (err) {
        console.error(`[TESTPROMPT] ❌ Invalid message format:`, err)
        clearTimeout(timeout)
        ws.close()
        reject({
          success: false,
          promptId: prompt_id,
          error: 'Invalid JSON in response',
        })
      }
    }

    ws.onerror = (err) => {
      console.error(
        `[TESTPROMPT] ❌ WebSocket error for prompt_id: ${prompt_id}`,
        err,
      )
      clearTimeout(timeout)
      reject({ success: false, promptId: prompt_id, error: 'WebSocket error' })
    }

    ws.onclose = () => {
      console.log(`[TESTPROMPT] 🔌 WebSocket closed for prompt_id ${prompt_id}`)
    }
  })
})
