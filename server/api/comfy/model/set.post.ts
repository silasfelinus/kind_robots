// server/api/comfy/model/set.post.ts
import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const wsUrl = process.env.COMFY_WS || 'ws://127.0.0.1:8188/ws'
  const { ckpt } = await readBody(event)
  const prompt_id = `loadckpt-${Date.now()}`

  if (!ckpt || typeof ckpt !== 'string') {
    return {
      success: false,
      error: 'Missing or invalid `ckpt` in request body',
    }
  }

  const graph = {
    '1': {
      class_type: 'CheckpointLoaderSimple',
      inputs: {
        ckpt_name: ckpt,
      },
    },
  }

  return await new Promise((resolve) => {
    let wasQueued = false
    const ws = new WebSocket(wsUrl)

    const timeout = setTimeout(() => {
      console.error(`[LOADCKPT] ❌ Timeout for ${prompt_id}`)
      ws.close()
      resolve({
        success: false,
        promptId: prompt_id,
        wasQueued,
        error: wasQueued
          ? 'Timeout: Prompt was queued but never executed'
          : 'Timeout: Prompt was never queued',
        debug: { wsUrl, promptId: prompt_id, graph },
      })
    }, 15000)

    ws.onopen = () => {
      console.log(
        `[LOADCKPT] ✅ Connected. Sending checkpoint load for ${ckpt}`,
      )
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
        const message = JSON.parse(event.data)
        const type = message.type
        const dataId = message.data?.prompt_id

        if (type === 'queue_prompt' && dataId === prompt_id) {
          wasQueued = true
          console.log(`[LOADCKPT] ✅ Queued at position ${message.data.number}`)
        } else if (type === 'executed' && dataId === prompt_id) {
          clearTimeout(timeout)
          ws.close()
          console.log(`[LOADCKPT] ✅ Executed successfully for ${ckpt}`)
          resolve({
            success: true,
            status: 'executed',
            promptId: prompt_id,
          })
        } else if (type === 'execution_error' && dataId === prompt_id) {
          clearTimeout(timeout)
          ws.close()
          console.error(`[LOADCKPT] ❌ Execution error: ${message.data.error}`)
          resolve({
            success: false,
            promptId: prompt_id,
            error: `Execution error: ${message.data.error}`,
          })
        }
      } catch (err) {
        clearTimeout(timeout)
        ws.close()
        console.error(`[LOADCKPT] ❌ Failed to parse WebSocket JSON`, err)
        resolve({
          success: false,
          promptId: prompt_id,
          error: 'JSON parse error from WebSocket',
        })
      }
    }

    ws.onerror = (err) => {
      clearTimeout(timeout)
      ws.close()
      console.error(`[LOADCKPT] ❌ WebSocket error`, err)
      resolve({
        success: false,
        promptId: prompt_id,
        error: 'WebSocket connection error',
      })
    }

    ws.onclose = () => {
      console.log(`[LOADCKPT] 🔌 WebSocket closed for prompt_id=${prompt_id}`)
    }
  })
})
