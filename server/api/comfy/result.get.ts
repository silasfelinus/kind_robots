export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const promptId = typeof query?.promptId === 'string' ? query.promptId : null

  if (!promptId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing promptId in query string',
    })
  }

  const wsUrl = process.env.COMFY_WS || 'wss://comfyui.acrocatranch.com/ws'

  return new Promise((resolve) => {
    const ws = new WebSocket(wsUrl)

    const timeout = setTimeout(() => {
      ws.close()
      resolve({
        status: 'timeout',
        message: `No result for promptId: ${promptId} within time limit.`,
      })
    }, 10000) // 10 second polling window

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)

        if (
          message.type === 'executed' &&
          message.data?.prompt_id === promptId
        ) {
          clearTimeout(timeout)
          ws.close()
          resolve({
            status: 'done',
            promptId,
            result: message.data,
          })
        }

        if (
          message.type === 'execution_error' &&
          message.data?.prompt_id === promptId
        ) {
          clearTimeout(timeout)
          ws.close()
          resolve({
            status: 'error',
            promptId,
            error: message.data.error,
          })
        }
      } catch (err) {
        clearTimeout(timeout)
        ws.close()
        resolve({
          status: 'error',
          promptId,
          error: 'Invalid message format',
        })
      }
    }

    ws.onerror = () => {
      clearTimeout(timeout)
      resolve({
        status: 'error',
        promptId,
        error: 'WebSocket connection failed',
      })
    }
  })
})
