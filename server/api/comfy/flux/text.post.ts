// server/api/comfy/flux/text.post.ts
import fluxSchnell from '~/utils/comfy/fluxSchnell.json'
import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const prompt_id = `flux-${Date.now()}`
  const wsUrl = body.wsUrl || process.env.COMFY_WS || 'ws://192.168.4.3:8188/ws'
  const ws = new WebSocket(wsUrl)

  console.log(`[FLUX] Connecting to WebSocket at: ${wsUrl}`)
  console.log(`[FLUX] Using prompt_id: ${prompt_id}`)

  return await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.error(`[FLUX] Timeout after 20s waiting for queue confirmation`)
      ws.close()
      reject(new Error('Timeout while waiting for queue confirmation'))
    }, 20000)

    ws.onopen = () => {
      console.log('[FLUX] WebSocket connection opened')
      ws.send(
        JSON.stringify({
          type: 'prompt',
          prompt_id,
          prompt: fluxSchnell,
        }),
      )
      console.log('[FLUX] Prompt sent to WebSocket')
    }

    ws.onerror = (err) => {
      console.error('[FLUX] WebSocket error:', err)
      clearTimeout(timeout)
      ws.close()
      reject(err)
    }

    ws.onclose = (event) => {
      console.log(
        `[FLUX] WebSocket closed (code: ${event.code}, reason: ${event.reason})`,
      )
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        console.log('[FLUX] Message received from WebSocket:', message)

        if (
          message.type === 'queue_prompt' &&
          message.data.prompt_id === prompt_id
        ) {
          console.log('[FLUX] Prompt accepted and queued')
          clearTimeout(timeout)
          ws.close()
          resolve({
            status: 'queued',
            jobId: message.data.prompt_id,
            queuePosition: message.data.number,
          })
        }

        if (message.type === 'execution_error') {
          console.error('[FLUX] Execution error:', message.data.error)
          clearTimeout(timeout)
          ws.close()
          reject(new Error(message.data.error || 'Execution error'))
        }
      } catch (err) {
        console.error('[FLUX] Error parsing WebSocket message:', err)
        clearTimeout(timeout)
        ws.close()
        reject(err)
      }
    }
  })
})
