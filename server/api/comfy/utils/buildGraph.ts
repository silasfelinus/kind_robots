import type { BuildGraphInput } from './types'
import fluxPipeline from '~/utils/comfy/fluxImage.json'
import fluxSchnell from '~/utils/comfy/fluxSchnell.json'
import sd3Schnell from '~/utils/comfy/sd3Schnell.json'

import { applyPrompt } from './injectPrompt'
import { applyImage } from './injectImage'
import { applyMask } from './injectMask'
import { applyControlNet } from './injectControl'
import { applyUpscale } from './injectUpscale'
import { applyLora } from './injectLora'
import { saveImage } from './saveImage'

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

  // Clone a fresh graph
  let graph = structuredClone(getBasePipeline(modelType))

  // Core prompt
  applyPrompt(graph, { modelType, prompt, promptB })

  // Optional image
  if (imageData) applyImage(graph, imageData)

  // Optional mask
  if (useInpaint && maskData) applyMask(graph, maskData)

  // Optional ControlNet
  if (controlType) applyControlNet(graph, controlType)

  // Optional morph (TBD)
  if (useMorph) {
    // applyMorph(graph, ...)
  }

  // Optional LoRA (SDXL only)
  if (modelType === 'sdxl' && loraName) {
    applyLora(graph, loraName)
  }

  // Optional upscale
  if (useUpscale) {
    applyUpscale(graph)
  }

  // Final output
  saveImage(graph)

  return graph
}

function getBasePipeline(modelType: 'flux' | 'sdxl') {
  switch (modelType) {
    case 'flux':
      return fluxPipeline
    case 'sdxl':
      return sd3Schnell // or another refined base
    default:
      throw new Error('Invalid model type')
  }
}
