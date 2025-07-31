// server/api/comfy/test.post.ts
import { defineEventHandler, readBody } from 'h3'
import baseGraph from '~/utils/comfy/test.json'

export default defineEventHandler(async (event) => {
  const prompt_id = `testprompt-${Date.now()}`
  const body = await readBody(event)
  const wsUrl = body.wsUrl || process.env.COMFY_WS || 'ws://127.0.0.1:8188/ws'

  console.log(`\n[TESTPROMPT] 🚀 Starting prompt_id: ${prompt_id}`)
  console.log(`[TESTPROMPT] 🌐 Connecting to WebSocket at: ${wsUrl}`)

  const minimalGraph = structuredClone(baseGraph)

  // Inject dynamic overrides
  try {
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
  } catch (err) {
    console.error(`[TESTPROMPT] ❌ Failed to inject dynamic values:`, err)
    return {
      success: false,
      promptId: prompt_id,
      error: 'Invalid test graph structure',
    }
  }

  return await new Promise((resolve) => {
    let wasQueued = false
    let wasExecuted = false

    const ws = new WebSocket(wsUrl)

    const timeout = setTimeout(() => {
      console.error(`[TESTPROMPT] ❌ Timeout: No execution within 20s`)
      ws.close()
      resolve({
        success: false,
        promptId: prompt_id,
        wasQueued,
        wasExecuted,
        error: wasQueued
          ? 'Timeout: Prompt was queued but never executed'
          : 'Timeout: Prompt was never queued',
        debug: { wsUrl, promptId: prompt_id, graph: minimalGraph },
      })
    }, 20000)

    ws.onopen = () => {
      console.log(`[TESTPROMPT] ✅ Connected. Sending prompt.`)
      try {
        ws.send(
          JSON.stringify({
            type: 'prompt',
            prompt_id,
            prompt: minimalGraph,
          }),
        )
      } catch (err) {
        console.error(`[TESTPROMPT] ❌ Failed to send prompt:`, err)
        clearTimeout(timeout)
        ws.close()
        resolve({
          success: false,
          promptId: prompt_id,
          error: 'WebSocket send error',
        })
      }
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        const type = message.type
        const dataId = message.data?.prompt_id

        console.log(`[TESTPROMPT] 📡 Received: type=${type} id=${dataId}`)

        if (type === 'queue_prompt') {
          if (dataId === prompt_id) {
            wasQueued = true
            console.log(
              `[TESTPROMPT] ✅ Queued: position=${message.data.number}`,
            )
          } else {
            console.warn(
              `[TESTPROMPT] ⚠️ Prompt queued but ID mismatch: expected ${prompt_id}, got ${dataId}`,
            )
          }
        } else if (type === 'executed') {
          if (dataId === prompt_id) {
            wasExecuted = true
            clearTimeout(timeout)
            ws.close()
            console.log(`[TESTPROMPT] ✅ Executed successfully.`)
            resolve({
              success: true,
              status: 'executed',
              promptId: prompt_id,
            })
          } else {
            console.warn(
              `[TESTPROMPT] ⚠️ Unrelated execution received (id=${dataId})`,
            )
          }
        } else if (type === 'execution_error') {
          if (dataId === prompt_id) {
            clearTimeout(timeout)
            ws.close()
            console.error(
              `[TESTPROMPT] ❌ Execution error: ${message.data.error}`,
            )
            resolve({
              success: false,
              promptId: prompt_id,
              error: `Execution error: ${message.data.error}`,
            })
          } else {
            console.warn(
              `[TESTPROMPT] ⚠️ Unrelated execution error received (id=${dataId})`,
            )
          }
        } else if (['status', 'crystools.monitor'].includes(type)) {
          // Do nothing — background info
        } else {
          console.warn(
            `[TESTPROMPT] ⚠️ Unrecognized or ignored message type=${type}`,
          )
        }
      } catch (err) {
        console.error(`[TESTPROMPT] ❌ JSON parse error from WebSocket:`, err)
        clearTimeout(timeout)
        ws.close()
        resolve({
          success: false,
          promptId: prompt_id,
          error: 'Invalid JSON in WebSocket response',
        })
      }
    }

    ws.onerror = (err) => {
      console.error(`[TESTPROMPT] ❌ WebSocket connection error:`, err)
      clearTimeout(timeout)
      resolve({
        success: false,
        promptId: prompt_id,
        error: 'WebSocket connection error',
      })
    }

    ws.onclose = () => {
      console.log(`[TESTPROMPT] 🔌 WebSocket closed for prompt_id=${prompt_id}`)
    }
  })
})
