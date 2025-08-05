// /server/api/comfy/index.ts

import { defineEventHandler, readBody } from 'h3'
import { pipelines } from './pipelines'

// Modifier functions
import inpaint from './modifiers/inpaint'
import controlnet from './modifiers/controlnet'
import upscale from './modifiers/upscale'
import outpaint from './modifiers/outpaint'
import morph from './modifiers/morph'

export type ModelType = 'flux' | 'sdxl'
export type ControlType = 'depth' | 'scribble' | 'canny' | 'custom'

export interface BuildGraphInput {
  modelType: ModelType
  inputType: 'text' | 'image'
  outputType: 'image' | 'text'
  prompt: string
  promptB?: string
  promptBlend?: number
  imageData?: string // base64
  maskData?: string // base64
  loraName?: string
  useInpaint?: boolean
  useOutpaint?: boolean
  useUpscale?: boolean
  useMorph?: boolean
  useControlNet?: boolean
  controlType?: ControlType
  denoise?: number
  strength?: number
  width?: number
  height?: number
  seed?: number
  steps?: number
  cfg?: number
  sampler_name?: string
  scheduler?: string
  ckpt_name?: string
  apiUrl?: string
  inpaintMode?: 'masked' | 'full'
  outpaintDirection?: 'left' | 'right' | 'up' | 'down'
}

// ---- Main Route: Always Build + Submit ----

export default defineEventHandler(async (event) => {
  try {
    const input = await readBody<BuildGraphInput>(event)
    const graph = await buildGraph(input)
    const comfyHttpUrl =
      input.apiUrl ||
      (process.env.COMFY_URL ? `${process.env.COMFY_URL}/prompt` : null)

    if (!comfyHttpUrl) {
      throw new Error('Missing COMFY_URL and no apiUrl provided')
    }

    const promptId = `comfy-${Date.now()}`
    console.log(
      `[COMFY] 🚀 Submitting prompt with ID: ${promptId} to ${comfyHttpUrl}`,
    )

    const res = await fetch(comfyHttpUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: graph }),
    })

    const json = await res.json()

    if (!json?.prompt_id) {
      console.warn('[COMFY] ⚠️ No prompt_id in response')
      return {
        success: false,
        error: 'No prompt_id in Comfy response',
        debug: json,
      }
    }

    return {
      success: true,
      promptId: json.prompt_id,
      queuePosition: json.number ?? null,
      nodeErrors: json.node_errors ?? null,
    }
  } catch (err: any) {
    console.error('[COMFY] ❌ Build + Submit failed:', err)
    return {
      error: true,
      statusCode: 500,
      statusMessage: 'Build + Submit failed',
      message: err.message || 'Unknown error',
    }
  }
})

// ---- Graph Assembly ----
async function buildGraph(input: BuildGraphInput): Promise<any> {
  const { inputType, outputType, modelType } = input

  const base = pipelines[modelType]
  if (!base) throw new Error(`Unknown model type: ${modelType}`)

  const graph = structuredClone(base)

  // 🔒 Input enforcement
  if (inputType === 'text' && !input.prompt) {
    throw new Error('Prompt is required for text-based input')
  }

  if (inputType === 'image' && !input.imageData) {
    throw new Error('imageData is required for image-based input')
  }

  // 🔒 Output enforcement (optional)
  if (outputType === 'text') {
    console.warn(
      '[COMFY] Output type is text. Consider using /tag route instead',
    )
  }

  // Apply image input
  if (input.imageData && graph['120']?.inputs) {
    graph['120'].inputs.image_data = `data:image/png;base64,${input.imageData}`
  }

  // Apply modifiers (if applicable)
  try {
    if (input.useInpaint && input.maskData) inpaint(graph, input)
    if (input.controlType) controlnet(graph, input)
    if (input.useUpscale) upscale(graph, input)
    if (input.useOutpaint) outpaint(graph, input)
    if (input.useMorph) morph(graph, input)
  } catch (e) {
    console.warn('[COMFY] Modifier failed:', e)
    throw new Error('A modifier failed during graph assembly')
  }

  return graph
}
