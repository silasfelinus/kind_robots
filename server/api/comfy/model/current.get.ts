// server/api/comfy/model/current.get.ts
import { defineEventHandler } from 'h3'

export default defineEventHandler(async () => {
  const wsUrl = process.env.COMFY_WS || 'ws://127.0.0.1:8188/ws'
  const start = Date.now()

  return await new Promise((resolve) => {
    const ws = new WebSocket(wsUrl)

    const timeout = setTimeout(() => {
      ws.close()
      resolve({
        success: false,
        error: 'Timeout querying model info (no response in 10s)',
        durationMs: Date.now() - start,
      })
    }, 10000)

    ws.onopen = () => {
      console.log(`[MODEL] ✅ Connected. Sending object_info...`)
      ws.send(JSON.stringify({ type: 'object_info' }))
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)

        if (msg.type === 'object_info') {
          clearTimeout(timeout)
          ws.close()

          const checkpoints = msg.data?.Checkpoints ?? []
          const current = checkpoints.find((c: any) => c.is_loaded)

          resolve({
            success: true,
            current: current?.name || null,
            all: checkpoints.map((c: any) => c.name),
            durationMs: Date.now() - start,
          })
        } else {
          console.warn(`[MODEL] ⚠️ Ignored msg type: ${msg.type}`)
        }
      } catch (err) {
        clearTimeout(timeout)
        ws.close()
        resolve({
          success: false,
          error: 'Failed to parse WebSocket message',
          detail: err instanceof Error ? err.message : err,
        })
      }
    }

    ws.onerror = (err) => {
      clearTimeout(timeout)
      ws.close()
      resolve({
        success: false,
        error: 'WebSocket error',
        detail: err,
      })
    }

    ws.onclose = () => {
      console.log(`[MODEL] 🔌 Connection closed`)
    }
  })
})
