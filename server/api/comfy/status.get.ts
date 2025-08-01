// server/api/comfy/status.get.ts
import { defineEventHandler, getQuery } from 'h3'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const rawUrl = query?.url || process.env.COMFY_WS || 'wss://127.0.0.1:8188/ws'
  const comfyWsUrl = typeof rawUrl === 'string' ? rawUrl : String(rawUrl)

  console.log(`[STATUS] 🌐 Connecting to WebSocket at: ${comfyWsUrl}`)

  return new Promise((resolve) => {
    const ws = new WebSocket(comfyWsUrl)
    const received: Record<string, any> = {}

    const timeout = setTimeout(() => {
      ws.close()
      resolve({
        success: false,
        message: 'Timed out waiting for status response.',
        wsUrl: comfyWsUrl,
        queueRemaining:
          received.status?.status?.exec_info?.queue_remaining ?? null,
        queueRunning: received.status?.status?.exec_info?.queue_running ?? null,
        sessionId: received.status?.sid ?? null,
      })
    }, 3000)

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'status' }))
    }

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data)
        if (parsed.type === 'status') {
          clearTimeout(timeout)
          ws.close()
          const data = parsed.data
          resolve({
            success: true,
            wsUrl: comfyWsUrl,
            queueRemaining: data?.status?.exec_info?.queue_remaining ?? null,
            queueRunning: data?.status?.exec_info?.queue_running ?? null,
            sessionId: data?.sid ?? null,
          })
        }
      } catch (err) {
        clearTimeout(timeout)
        ws.close()
        resolve({
          success: false,
          message: 'Invalid JSON from WebSocket server.',
          raw: event.data,
        })
      }
    }

    ws.onerror = () => {
      clearTimeout(timeout)
      resolve({
        success: false,
        message: `WebSocket connection failed for ${comfyWsUrl}`,
      })
    }
  })
})
