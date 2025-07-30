// server/api/comfy/flux.post.ts
import fluxSchnell from '~/utils/comfy/fluxSchnell.json'
import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const prompt_id = `flux-${Date.now()}`
  const wsUrl = body.wsUrl || process.env.COMFY_WS || 'ws://127.0.0.1:8188/ws'
  const ws = new WebSocket(wsUrl)

  return await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      ws.close()
      reject(new Error('Timeout while waiting for queue confirmation'))
    }, 20000)

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: 'prompt',
          prompt_id,
          prompt: fluxSchnell, // ← the key fix!
        }),
      )
    }

    ws.onerror = (err) => {
      clearTimeout(timeout)
      ws.close()
      reject(err)
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)

        if (
          message.type === 'queue_prompt' &&
          message.data.prompt_id === prompt_id
        ) {
          clearTimeout(timeout)
          ws.close()
          resolve({
            status: 'queued',
            jobId: message.data.prompt_id,
            queuePosition: message.data.number,
          })
        }

        if (message.type === 'execution_error') {
          clearTimeout(timeout)
          ws.close()
          reject(new Error(message.data.error || 'Execution error'))
        }
      } catch (err) {
        clearTimeout(timeout)
        ws.close()
        reject(err)
      }
    }
  })
})
