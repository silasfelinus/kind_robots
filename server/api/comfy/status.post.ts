// server/api/comfy/status.post.ts

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const rawUrl = query?.url || process.env.COMFY_WS || 'wss://0.0.0.0:8188'
  const comfyWsUrl = typeof rawUrl === 'string' ? rawUrl : String(rawUrl)

  return new Promise((resolve) => {
    const ws = new WebSocket(comfyWsUrl)
    const received: Record<string, any> = {}

    const timeout = setTimeout(() => {
      ws.close()
      resolve({
        status: 'partial',
        message: 'Timed out waiting for full response.',
        wsUrl: comfyWsUrl,
        queueRemaining:
          received.status?.status?.exec_info?.queue_remaining ?? null,
        gpuStats: received['crystools.monitor']?.gpus ?? null,
        sessionId: received.status?.sid ?? null,
      })
    }, 3000)

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data)
        received[parsed.type] = parsed.data

        if (received.status && received['crystools.monitor']) {
          clearTimeout(timeout)
          ws.close()
          resolve({
            status: 'ok',
            wsUrl: comfyWsUrl,
            queueRemaining:
              received.status?.status?.exec_info?.queue_remaining ?? null,
            gpuStats: received['crystools.monitor']?.gpus,
            sessionId: received.status?.sid,
          })
        }
      } catch {
        clearTimeout(timeout)
        ws.close()
        resolve({
          status: 'error',
          message: 'Invalid JSON from WebSocket server.',
          raw: event.data,
        })
      }
    }

    ws.onerror = () => {
      clearTimeout(timeout)
      resolve({
        status: 'error',
        message: `WebSocket connection failed for ${comfyWsUrl}`,
      })
    }
  })
})
