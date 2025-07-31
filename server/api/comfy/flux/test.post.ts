// server/api/comfy/test.post.ts
import { defineEventHandler, readBody } from 'h3'
import baseGraph from '~/utils/comfy/test.json'

export default defineEventHandler(async (event) => {
  const prompt_id = `testprompt-${Date.now()}`
  const body = await readBody(event)
  const wsUrl = body.wsUrl || process.env.COMFY_WS || 'ws://127.0.0.1:8188/ws'

  console.log(`[TESTPROMPT] 🚀 Starting test for prompt_id: ${prompt_id}`)
  console.log(`[TESTPROMPT] 🌐 Connecting to WebSocket at: ${wsUrl}`)

  // Deep clone the base graph to allow overrides
  const minimalGraph = structuredClone(baseGraph)

  // Inject dynamic values
  minimalGraph['1'].inputs.width = body.width ?? 64
  minimalGraph['1'].inputs.height = body.height ?? 64
  minimalGraph['2'].inputs.ckpt_name =
    body.ckpt_name || 'Flux/flux1-schnell-fp8.safetensors'
  minimalGraph['6'].inputs.text = body.promptText || 'test prompt'

  const ksampler = minimalGraph['3'].inputs
  ksampler.cfg = body.cfg ?? 1
  ksampler.denoise = body.denoise ?? 1
  ksampler.seed = Math.floor(Math.random() * 1e18)
  ksampler.steps = body.steps ?? 2
  ksampler.sampler_name = body.sampler_name || 'euler'
  ksampler.scheduler = body.scheduler || 'karras'

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
          console.log(
            `[TESTPROMPT] ✅ Queued at position ${message.data.number}`,
          )
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
      console.log(`[TESTPROMPT] 🔌 WebSocket closed for ${prompt_id}`)
    }
  })
})
