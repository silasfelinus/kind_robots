// server/api/comfy/model/current.get.ts
import { defineEventHandler } from 'h3'

export default defineEventHandler(async () => {
  const wsUrl = process.env.COMFY_WS || 'ws://127.0.0.1:8188/ws'
  const ws = new WebSocket(wsUrl)

  return await new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.error(`[CHECKPOINT] ❌ Timeout after 10s`)
      ws.close()
      resolve({ success: false, error: 'Timeout querying model info' })
    }, 10000)

    ws.onopen = () => {
      console.log(`[CHECKPOINT] ✅ Connected. Requesting object_info...`)
      ws.send(JSON.stringify({ type: 'object_info' }))
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        if (message?.type !== 'object_info') return

        clearTimeout(timeout)
        ws.close()

        const checkpoints = message?.data?.Checkpoints
        if (!Array.isArray(checkpoints)) {
          console.error(`[CHECKPOINT] ❌ Invalid model list format`, message)
          return resolve({
            success: false,
            error: 'Invalid response format',
            detail: message,
          })
        }

        const current = checkpoints.find((m) => m?.is_loaded)
        console.log(`[CHECKPOINT] ✅ Current model: ${current?.name}`)

        resolve({
          success: true,
          current: current?.name ?? null,
          all: checkpoints.map((m) => m.name),
        })
      } catch (err) {
        clearTimeout(timeout)
        ws.close()
        console.error(`[CHECKPOINT] ❌ Failed to parse message`, err)
        resolve({
          success: false,
          error: 'JSON parse error',
          detail: err,
        })
      }
    }

    ws.onerror = (err) => {
      clearTimeout(timeout)
      ws.close()
      console.error(`[CHECKPOINT] ❌ WebSocket error`, err)
      resolve({ success: false, error: 'WebSocket error', detail: err })
    }
  })
})
