// server/api/comfy/model/current.get.ts
import { defineEventHandler } from 'h3'

export default defineEventHandler(async () => {
  const ws = new WebSocket(process.env.COMFY_WS || 'ws://127.0.0.1:8188/ws')

  return await new Promise((resolve) => {
    const timeout = setTimeout(() => {
      ws.close()
      resolve({ success: false, error: 'Timeout querying model info' })
    }, 10000)

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'object_info' }))
    }

    ws.onmessage = (event) => {
      clearTimeout(timeout)
      const data = JSON.parse(event.data)
      if (data?.type === 'object_info') {
        const models = data?.data?.Checkpoints || []
        const currentlyLoaded = models.find((m: any) => m?.is_loaded)
        ws.close()
        resolve({
          success: true,
          current: currentlyLoaded?.name ?? null,
          all: models.map((m: any) => m.name),
        })
      }
    }

    ws.onerror = (err) => {
      clearTimeout(timeout)
      ws.close()
      resolve({ success: false, error: 'WebSocket error', detail: err })
    }
  })
})
