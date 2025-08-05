// /server/api/comfy/index.ts

import { defineEventHandler, readBody, getQuery } from 'h3'
import { pipelines } from './pipelines'
import { applyPrompt } from './modifiers/prompt'
import { applyInpaint } from './modifiers/inpaint'
import { applyControlNet } from './modifiers/controlnet'
import { applyUpscale } from './modifiers/upscale'

export type ModelType = 'flux' | 'sdxl'
export type ControlType = 'depth' | 'scribble' | 'canny' | 'custom'

export interface BuildGraphInput {
  modelType: ModelType
  prompt: string
  promptB?: string
  imageData?: string // base64
  maskData?: string // base64
  controlType?: ControlType
  loraName?: string
  useInpaint?: boolean
  useOutpaint?: boolean
  useUpscale?: boolean
  useMorph?: boolean
  denoise?: number
  strength?: number
  width?: number
  height?: number
  seed?: number
}

// ---- Main API Route ----

export default defineEventHandler(async (event) => {
  const method = event.method
  const query = getQuery(event)

  if (method === 'GET' && query.status) return await fetchStatus()
  if (method === 'GET' && query.models) return Object.keys(pipelines)

  if (method === 'POST') {
    const input = await readBody<BuildGraphInput>(event)
    return await buildGraph(input)
  }

  return { error: 'Invalid method or query' }
})

// ---- Pipeline Assembly ----

async function buildGraph(input: BuildGraphInput): Promise<any> {
  const {
    modelType,
    prompt,
    promptB,
    imageData,
    maskData,
    controlType,
    loraName,
    useInpaint,
    useOutpaint,
    useUpscale,
    useMorph,
    denoise,
    strength,
    width,
    height,
    seed,
  } = input

  const base = pipelines[modelType]
  if (!base) throw new Error(`Unknown model type: ${modelType}`)

  const graph = structuredClone(base)

  applyPrompt(graph, { modelType, prompt, promptB })

  if (imageData)
    graph['120'].inputs.image_data = `data:image/png;base64,${imageData}`
  if (useInpaint && maskData) applyInpaint(graph, maskData)
  if (controlType) applyControlNet(graph, controlType)
  if (useUpscale) applyUpscale(graph)

  return graph
}

// ---- Status ----

async function fetchStatus(): Promise<any> {
  try {
    const res = await $fetch('http://localhost:8188/status')
    return res
  } catch (err) {
    return { error: 'Failed to fetch status', details: err }
  }
}
