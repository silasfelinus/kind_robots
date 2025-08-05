// /server/api/comfy/buildGraph.ts

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
  } = input

  const fragments: any[] = []

  // Required: base graph
  const base = await import(`~/api/comfy/json/base/${modelType}.json`)
  fragments.push(base.default)

  // Prompt
  if (modelType === 'flux') {
    const promptMod = await import('./json/prompt/fluxTextEncode.json')
    fragments.push(promptMod.default)
  } else {
    const promptMod = await import(
      '~/server/api/comfy/json/prompt/clipTextEncode.json'
    )
    fragments.push(promptMod.default)
    if (loraName) {
      const loraMod = await import(
        '~/server/api/comfy/json/prompt/wildcardPrompt.json'
      )
      fragments.push(loraMod.default)
    }
  }

  // Optional: image loader
  if (imageData) {
    fragments.push({
      '1': {
        class_type: 'LoadImageFromBase64',
        inputs: {
          image_data: `data:image/png;base64,${imageData}`,
        },
      },
    })
  }

  // Optional: mask
  if (useInpaint && maskData) {
    const mask = await import('~/server/api/comfy/json/edit/inpaint.json')
    fragments.push(mask.default)
    fragments.push({
      '98': {
        class_type: 'LoadImageFromBase64',
        inputs: {
          image_data: `data:image/png;base64,${maskData}`,
        },
      },
    })
  }

  // Optional: controlnet
  if (controlType) {
    const control = await import(
      `~/server/api/comfy/json/control/${controlType}.json`
    )
    const apply = await import(
      '~/server/api/comfy/json/control/applyControlNet.json'
    )
    fragments.push(control.default)
    fragments.push(apply.default)
  }

  // Optional: morph
  if (useMorph) {
    const morph = await import('~/server/api/comfy/json/edit/morph.json')
    fragments.push(morph.default)
  }

  // Optional: outpaint
  if (useOutpaint) {
    const outpaint = await import('~/server/api/comfy/json/edit/outpaint.json')
    fragments.push(outpaint.default)
  }

  // Optional: upscale
  if (useUpscale) {
    const up = await import(
      `~/server/api/comfy/json/upscale/${modelType}Upscale.json`
    )
    fragments.push(up.default)
  }

  // Always: output
  const output = await import('~/server/api/comfy/json/output/saveImage.json')
  fragments.push(output.default)

  const graph = mergeGraphs(fragments)
  return graph
}

// --- Graph Merging ---

function mergeGraphs(graphs: any[]): any {
  const result: any = {}
  let offset = 0

  for (const graph of graphs) {
    for (const [key, node] of Object.entries(graph)) {
      const newKey = (parseInt(key) + offset).toString()
      result[newKey] = shiftInputs(node, offset)
    }
    offset += Object.keys(graph).length
  }

  return result
}

function shiftInputs(node: any, offset: number): any {
  const clone = structuredClone(node)
  for (const k in clone.inputs) {
    const val = clone.inputs[k]
    if (Array.isArray(val) && typeof val[0] === 'string') {
      const newId = (parseInt(val[0]) + offset).toString()
      clone.inputs[k] = [newId, val[1]]
    }
  }
  return clone
}
