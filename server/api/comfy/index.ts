// /server/api/comfy/index.ts

import { defineEventHandler, readBody, getQuery } from 'h3'
import { pipelines } from './pipelines'

// Modifier functions
import prompt from './modifiers/prompt'
import inpaint from './modifiers/inpaint'
import controlnet from './modifiers/controlnet'
import upscale from './modifiers/upscale'
import outpaint from './modifiers/outpaint'
import morph from './modifiers/morph'

export type ModelType = 'flux' | 'sdxl'
export type ControlType = 'depth' | 'scribble' | 'canny' | 'custom'

export interface BuildGraphInput {
  modelType: ModelType
  prompt: string
  promptB?: string
  promptBlend?: number
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
  const base = pipelines[input.modelType]
  if (!base) throw new Error(`Unknown model type: ${input.modelType}`)

  const graph = structuredClone(base)

  // Required: prompt
  prompt(graph, input)

  // Optional: image
  if (input.imageData)
    graph['120'].inputs.image_data = `data:image/png;base64,${input.imageData}`

  // Optional features
  if (input.useInpaint && input.maskData) inpaint(graph, input)
  if (input.controlType) controlnet(graph, input)
  if (input.useUpscale) upscale(graph, input)
  if (input.useOutpaint) outpaint(graph, input)
  if (input.useMorph) morph(graph, input)

  return graph
}

// ---- Status ----

async function fetchStatus(): Promise<any> {
  try {
    return await $fetch('http://localhost:8188/status')
  } catch (err) {
    return { error: 'Failed to fetch status', details: err }
  }
}
