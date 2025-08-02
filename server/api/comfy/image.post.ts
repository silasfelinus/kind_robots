// server/api/comfy/image.post.ts
import fluxImage from '~/utils/comfy/fluxImage.json'
import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    const {
      prompt,
      imageData,
      promptTextB,
      promptBlend,
      denoise = 0.95,
      strength = 0.6,
      width = 768,
      height = 1024,
      useUpscale = false,
      useInpaint = false,
      maskData,
      steps = 25,
      seed,
      cfg = 8,
      scheduler = 'sgm_uniform',
    } = body

    if (!prompt || !imageData) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required prompt or imageData.',
      })
    }

    const fallbackImage =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQI12NgYGBgAAAABQABDQottgAAAABJRU5ErkJggg=='

    const actualImage = imageData || fallbackImage
    const graph: Record<string, any> = structuredClone(fluxImage)

    graph['120'].inputs.image_data = actualImage
    graph['29'].inputs.t5xxl = prompt
    graph['170'].inputs.t5xxl = promptTextB || prompt
    graph['171'].inputs.strength = promptBlend ?? 0.5

    graph['17'].inputs.denoise = denoise
    graph['17'].inputs.steps = steps
    graph['17'].inputs.scheduler = scheduler

    graph['3'] = graph['3'] || { inputs: {} }
    graph['3'].inputs.seed = seed ?? Math.floor(Math.random() * 1e18)
    graph['3'].inputs.cfg = cfg

    graph['125'].inputs.width = width
    graph['125'].inputs.height = height
    graph['135'].inputs.strength = strength

    graph['91'].inputs.condition = useUpscale
    graph['162'].inputs.condition = useInpaint ?? false

    if (maskData) {
      graph['160'].inputs.image_data = maskData
    }

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
