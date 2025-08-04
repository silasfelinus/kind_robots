// /server/api/comfy/index.ts

import fluxPipeline from './json/fluxImage.json'
import sd3Schnell from './json/sd3Schnell.json'

// ---- Types ----
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

// ---- Graph Modifiers ----

function applyPrompt(
  graph: any,
  {
    modelType,
    prompt,
    promptB,
  }: { modelType: ModelType; prompt: string; promptB?: string },
) {
  if (modelType === 'flux') {
    if (graph['29']) graph['29'].inputs.t5xxl = prompt
    if (promptB && graph['170']) graph['170'].inputs.t5xxl = promptB
  } else {
    if (graph['6']) graph['6'].inputs.text = prompt
    if (promptB && graph['33']) graph['33'].inputs.text = promptB
  }
}

function applyImage(graph: any, imageData: string) {
  const key = findNodeByType(graph, 'LoadImageFromBase64')
  if (key) graph[key].inputs.image_data = `data:image/png;base64,${imageData}`
}

function applyMask(graph: any, maskData: string) {
  const maskKey =
    findNodeByType(graph, 'LoadMaskImage') ||
    findNodeByType(graph, 'LoadImageFromBase64')
  if (maskKey)
    graph[maskKey].inputs.image_data = `data:image/png;base64,${maskData}`

  const switchKey = findNodeByType(graph, 'Image Input Switch')
  if (switchKey) graph[switchKey].inputs.condition = true
}

function applyControlNet(graph: any, controlType: ControlType) {
  const controlKey = findNodeByType(graph, 'ControlNetApplyAdvanced')
  const preprocessorKey = findControlPreprocessor(graph, controlType)
  if (controlKey && preprocessorKey)
    graph[controlKey].inputs.image = [preprocessorKey, 0]
}

function applyUpscale(graph: any) {
  const switchKey = findNodeByType(graph, 'Conditioning Input Switch')
  if (switchKey) graph[switchKey].inputs.condition = true
}

function applyLora(graph: any, loraName: string) {
  const loraKey =
    findNodeByType(graph, 'ImpactWildcardEncode') ||
    findNodeByType(graph, 'CLIPTextEncode')
  if (loraKey) graph[loraKey].inputs['Select to add LoRA'] = loraName
}

function saveImage(graph: any) {
  const saveKey = findNodeByType(graph, 'SaveImage')
  if (saveKey && !graph[saveKey].inputs.filename_prefix)
    graph[saveKey].inputs.filename_prefix = 'ComfyOutput'
}

function findNodeByType(graph: any, type: string): string | undefined {
  return Object.keys(graph).find((key) => graph[key].class_type === type)
}

function findControlPreprocessor(
  graph: any,
  controlType: ControlType,
): string | undefined {
  const map = {
    depth: 'Midas',
    scribble: 'ScribblePreprocessor',
    canny: 'Canny',
    custom: 'ControlPreprocessorCustom',
  }
  return findNodeByType(graph, map[controlType])
}

// ---- Main Builder ----

export async function buildGraph(input: BuildGraphInput): Promise<any> {
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

  let graph = structuredClone(getBasePipeline(modelType))

  applyPrompt(graph, { modelType, prompt, promptB })

  if (imageData) applyImage(graph, imageData)
  if (useInpaint && maskData) applyMask(graph, maskData)
  if (controlType) applyControlNet(graph, controlType)
  if (modelType === 'sdxl' && loraName) applyLora(graph, loraName)
  if (useUpscale) applyUpscale(graph)
  if (useMorph) {
    // placeholder for morph logic
  }

  saveImage(graph)
  return graph
}

function getBasePipeline(modelType: ModelType): any {
  switch (modelType) {
    case 'flux':
      return fluxPipeline
    case 'sdxl':
      return sd3Schnell
    default:
      throw new Error('Unknown model type')
  }
}
