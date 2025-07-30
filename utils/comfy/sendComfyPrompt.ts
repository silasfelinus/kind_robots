// utils/comfy/sendComfyPrompt.ts
import pipelineJson from './fluxPipeline.json'
import { comfyUrl } from './comfyUrl'

export async function sendComfyPrompt({
  imageData,
  promptText,
  denoise,
  strength,
  width,
  height,
  useUpscale,
  maskData,
  useInpaint,
  promptTextB,
  promptBlend,
  wsUrl,
}: {
  imageData: string
  promptText: string
  denoise: number
  strength: number
  width: number
  height: number
  useUpscale: boolean
  maskData?: string
  useInpaint?: boolean
  promptTextB?: string
  promptBlend?: number
  wsUrl?: string
}): Promise<{
  status: 'queued'
  jobId: string
  queuePosition: number
}> {
  const graph = structuredClone(pipelineJson)

  // Dynamic value injection
  graph['120'].inputs.image_data = `data:image/png;base64,${imageData}`
  graph['29'].inputs.t5xxl = promptText
  graph['17'].inputs.denoise = denoise
  graph['91'].inputs.condition = useUpscale
  graph['135'].inputs.strength = strength
  graph['125'].inputs.width = width
  graph['125'].inputs.height = height

  if (maskData) {
    graph['160'].inputs.image_data = `data:image/png;base64,${maskData}`
  }

  graph['162'].inputs.condition = useInpaint ?? false
  graph['170'].inputs.t5xxl = promptTextB || promptText
  graph['171'].inputs.weight = promptBlend ?? 0.5

  const prompt_id = `edit-${Date.now()}`
  const resolvedWsUrl = wsUrl || comfyUrl()
  const ws = new WebSocket(resolvedWsUrl)

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      ws.close()
      reject(new Error('Timed out waiting for queue confirmation'))
    }, 30000)

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: 'prompt', // ✅ correct type
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
}
