// server/api/comfy/test.post.ts
import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const prompt_id = `test-${Date.now()}`
  const wsUrl = body.wsUrl || process.env.COMFY_WS || 'ws://127.0.0.1:8188/ws'

  return await new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl)

    const timeout = setTimeout(() => {
      ws.close()
      reject(new Error('Timeout: No response from ComfyUI'))
    }, 15000)

    ws.onopen = () => {
      console.log(`[COMFY TEST] Connected to ${wsUrl}`)
      ws.send(
        JSON.stringify({
          type: 'status',
          prompt_id,
        }),
      )
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        console.log('[COMFY TEST] Message:', message)
        clearTimeout(timeout)
        ws.close()
        resolve({ success: true, message })
      } catch (err) {
        clearTimeout(timeout)
        ws.close()
        reject(new Error('Invalid JSON response'))
      }
    }

    ws.onerror = (err) => {
      clearTimeout(timeout)
      ws.close()
      reject(new Error(`WebSocket error: ${err}`))
    }

    ws.onclose = () => {
      console.log(`[COMFY TEST] Connection closed for prompt_id ${prompt_id}`)
    }
  })
})
