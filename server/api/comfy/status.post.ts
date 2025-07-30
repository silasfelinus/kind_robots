// server/api/comfy/status.post.ts

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const customUrl = body?.comfyWsUrl || body?.url
  const wsUrl = customUrl || process.env.COMFY_WS || 'wss://0.0.0.0:8188/ws'

  return new Promise((resolve) => {
    const ws = new WebSocket(wsUrl)

    const timeout = setTimeout(() => {
      ws.close()
      resolve({ status: 'timeout', message: `No response from ${wsUrl}` })
    }, 3000)

    ws.onopen = () => {
      // Still wait for a message — don't resolve on open alone
    }

    ws.onmessage = () => {
      clearTimeout(timeout)
      ws.close()
      resolve({ status: 'ok', url: wsUrl })
    }

    ws.onerror = () => {
      clearTimeout(timeout)
      resolve({
        status: 'error',
        message: `WebSocket error connecting to ${wsUrl}`,
      })
    }
  })
})
