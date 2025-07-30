// server/api/comfy/status.get.ts

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const comfyWsUrl = String(
    query?.url || process.env.COMFY_WS || 'wss://0.0.0.0:8188',
  )

  return new Promise((resolve) => {
    const ws = new WebSocket(comfyWsUrl)

    const timeout = setTimeout(() => {
      ws.close()
      resolve({
        status: 'timeout',
        message: `No response from ${comfyWsUrl}`,
      })
    }, 3000)

    ws.onmessage = (event) => {
      clearTimeout(timeout)
      ws.close()
      try {
        const parsed = JSON.parse(event.data)
        resolve({
          status: 'ok',
          wsUrl: comfyWsUrl,
          messageType: parsed.type,
          dataPreview: parsed.data?.gpus
            ? { gpus: parsed.data.gpus }
            : parsed.data,
        })
      } catch {
        resolve({
          status: 'error',
          error: 'Invalid JSON',
          raw: event.data,
        })
      }
    }

    ws.onerror = () => {
      clearTimeout(timeout)
      resolve({
        status: 'error',
        message: `WebSocket error from ${comfyWsUrl}`,
      })
    }
  })
})
