// utils/comfy/sendComfyPrompt.ts
import pipelineJson from './fluxPipeline.json'

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
}): Promise<any> {
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

  const resolvedWsUrl =
    wsUrl || process.env.COMFY_WS || 'wss://localhost:8188/ws'
  const ws = new WebSocket(resolvedWsUrl)

  return await new Promise((resolve, reject) => {
    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: 'queue_prompt',
          prompt_id: `edit-${Date.now()}`,
          prompt: graph,
        }),
      )
    }

    ws.onerror = (err) => reject(err)

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (message.type === 'executed') {
        ws.close()
        resolve(message)
      }
    }
  })
}
