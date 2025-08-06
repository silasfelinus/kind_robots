// /server/api/comfy/index.ts

import { defineEventHandler, readBody } from 'h3'
import { pipelines } from './pipelines'

// Modifier functions
import inpaint from './modifiers/inpaint'
import controlnet from './modifiers/controlnet'
import upscale from './modifiers/upscale'
import outpaint from './modifiers/outpaint'
import morph from './modifiers/morph'

// Builder segments
import { addTextInput } from './segments/inputText'
import { addImageInput } from './segments/inputImage'
import { addSamplerAndScheduler } from './segments/sampling'
import { addOutput, logGraph } from './segments/output'

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

async function buildGraph(
  input: BuildGraphInput,
): Promise<Record<string, any>> {
  const { inputType, modelType } = input

  const base = pipelines[modelType]
  if (!base) throw new Error(`Unknown model type: ${modelType}`)

  const graph = structuredClone(base)
  const ids = getModelHandles(modelType)

  // Apply input
  let latentId: string | undefined
  let conditioningId: string | undefined

  if (inputType === 'text') {
    conditioningId = addTextInput(graph, input, ids)
  } else if (inputType === 'image') {
    latentId = addImageInput(graph, input)
  }

  // Modifiers
  try {
    if (input.useInpaint && input.maskData)
      latentId = inpaint(graph, input, latentId)
    if (input.controlType) latentId = controlnet(graph, input, latentId)
    if (input.useUpscale) latentId = upscale(graph, input, latentId)
    if (input.useOutpaint) latentId = outpaint(graph, input, latentId)
    if (input.useMorph) latentId = morph(graph, input, latentId)
  } catch (e) {
    console.warn('[COMFY] Modifier failed:', e)
    throw new Error('A modifier failed during graph assembly')
  }

  // Sampling
  latentId = addSamplerAndScheduler(
    graph,
    input,
    ids.model,
    conditioningId,
    latentId,
  )

  // Output
  logGraph(graph)
  addOutput(graph, latentId ?? '8', input)

  // ✅ Return classic Comfy format
  return graph
}

function getModelHandles(modelType: ModelType) {
  if (modelType === 'flux') {
    return {
      model: '12', // UNETLoader
      clip: '11',
      vae: '10',
    }
  } else {
    return {
      model: '30',
      clip: '30',
      vae: '30',
    }
  }
}
