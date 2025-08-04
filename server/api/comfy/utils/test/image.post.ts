// server/api/comfy/image.post.ts
import fluxImage from '../../json/fluxImage.json'
import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    const {
      prompt,
      imageData,
      denoise = 0.95,
      strength = 0.6,
      width = 768,
      height = 1024,
      steps = 25,
      scheduler = 'sgm_uniform',
    } = body

    if (!prompt || !imageData) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required prompt or imageData.',
      })
    }

    const graph: Record<string, any> = structuredClone(fluxImage)

    // Inject base64 image
    graph['120'].inputs.image_data = imageData

    // Prompt and guidance
    graph['29'].inputs.t5xxl = prompt

    // Size and generation settings
    graph['125'].inputs.width = width
    graph['125'].inputs.height = height
    graph['135'].inputs.strength = strength

    // Sampler config
    graph['17'].inputs.denoise = denoise
    graph['17'].inputs.steps = steps
    graph['17'].inputs.scheduler = scheduler

    const prompt_id = `edit-${Date.now()}`
    const resolvedWsUrl = process.env.COMFY_WS || 'ws://127.0.0.1:8188/ws'
    const ws = new WebSocket(resolvedWsUrl)

    return await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close()
        reject(new Error('Timed out waiting for queue confirmation'))
      }, 30000)

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            type: 'prompt',
            prompt_id,
            prompt: graph,
          }),
        )
      }

      ws.onerror = (err) => {
        clearTimeout(timeout)
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
  } catch (err) {
    console.error(`[IMAGE] ❌ Error processing image prompt`, err)
    return {
      error: true,
      message: err instanceof Error ? err.message : 'Unknown error',
    }
  }
})
