// server/api/comfy/test.post.ts
import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const prompt_id = `testprompt-${Date.now()}`
  const body = await readBody(event)
  const wsUrl = body.wsUrl || process.env.COMFY_WS || 'ws://127.0.0.1:8188/ws'

  console.log(`[TESTPROMPT] 🚀 Starting test for prompt_id: ${prompt_id}`)
  console.log(`[TESTPROMPT] 🌐 Connecting to WebSocket at: ${wsUrl}`)

  const minimalGraph = {
    '1': {
      class_type: 'EmptyLatentImage',
      inputs: {
        width: body.width ?? 64,
        height: body.height ?? 64,
      },
    },
    '2': {
      class_type: 'CheckpointLoaderSimple',
      inputs: {
        ckpt_name: body.ckpt_name || 'Flux/flux1-schnell-fp8.safetensors',
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
        positive: ['6', 0],
        negative: ['6', 0],
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
    '6': {
      class_type: 'CLIPTextEncode',
      inputs: {
        text: body.promptText || 'test prompt',

        clip: ['2', 1],
      },
    },
  }

  return await new Promise((resolve) => {
    const ws = new WebSocket(wsUrl)

    const timeout = setTimeout(() => {
      console.error(`[TESTPROMPT] ❌ Timeout for prompt_id: ${prompt_id}`)
      ws.close()
      resolve({
        success: false,
        promptId: prompt_id,
        error: 'Timeout: No response from ComfyUI',
        debug: { wsUrl, graph: minimalGraph },
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
        console.log(`[TESTPROMPT] 📨 Message for ${prompt_id}:`, message)

        if (
          message.type === 'queue_prompt' &&
          message.data?.prompt_id === prompt_id
        ) {
          clearTimeout(timeout)
          ws.close()
          console.log(
            `[TESTPROMPT] ✅ Queued at position ${message.data.number}`,
          )
          resolve({
            success: true,
            status: 'queued',
            promptId: prompt_id,
            queuePosition: message.data.number,
          })
        } else if (
          message.type === 'executed' &&
          message.data?.prompt_id === prompt_id
        ) {
          clearTimeout(timeout)
          ws.close()
          console.log(`[TESTPROMPT] ✅ Prompt executed for ${prompt_id}`)
          resolve({
            success: true,
            status: 'executed',
            promptId: prompt_id,
          })
        } else {
          console.log(`[TESTPROMPT] ℹ️ Ignored message:`, message)
        }
      } catch (err) {
        console.error(`[TESTPROMPT] ❌ Bad JSON for ${prompt_id}:`, err)
        clearTimeout(timeout)
        ws.close()
        resolve({
          success: false,
          promptId: prompt_id,
          error: 'Invalid JSON in response',
        })
      }
    }

    ws.onerror = (err) => {
      console.error(`[TESTPROMPT] ❌ WebSocket error for ${prompt_id}:`, err)
      clearTimeout(timeout)
      resolve({
        success: false,
        promptId: prompt_id,
        error: 'WebSocket error',
      })
    }

    ws.onclose = () => {
      console.log(`[TESTPROMPT] 🔌 Closed for ${prompt_id}`)
    }
  })
})
