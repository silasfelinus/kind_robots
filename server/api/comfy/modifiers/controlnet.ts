// /server/api/comfy/modifiers/controlnet.ts

import type { BuildGraphInput, ModelType, ControlType } from '../index'

export default function controlnet(
  graph: any,
  input: BuildGraphInput,
  fromNodeId: string | undefined,
): string {
  const { modelType = 'flux', controlType = 'canny' } = input

  // Confirm required nodes exist
  if (!graph['132'] || !graph['133'] || !graph['135']) {
    throw new Error('[CONTROLNET] Missing required nodes (132, 133, 135)')
  }

  // ---- 1. Set Preprocessor Behavior (Node 132) ----
  switch (controlType) {
    case 'scribble':
      graph['132'].class_type = 'ScribblePreprocessor'
      graph['132'].inputs.threshold = 0.5
      break

    case 'depth':
      graph['132'].class_type = 'DepthMapPreprocessor'
      graph['132'].inputs.normalization = 'linear'
      break

    case 'custom':
      graph['132'].class_type = 'CustomPreprocessor'
      break

    case 'canny':
    default:
      graph['132'].class_type = 'Canny'
      graph['132'].inputs.low_threshold = 0.45
      graph['132'].inputs.high_threshold = 0.8
      break
  }

  // ---- 2. Route Preprocessed Image to Apply Node (Node 135) ----
  graph['135'].inputs.image = ['132', 0]

  // ---- 3. Select Default ControlNet Model by Type + Model ----
  const modelMap: Record<ModelType, Record<ControlType, string>> = {
    flux: {
      canny: 'flux_canny.safetensors',
      scribble: 'flux_scribble.safetensors',
      depth: 'flux_depth.safetensors',
      custom: 'ControlNetUnion.safetensors',
    },
    sdxl: {
      canny: 'sdxl_canny.safetensors',
      scribble: 'sdxl_scribble.safetensors',
      depth: 'sdxl_depth.safetensors',
      custom: 'ControlNetXL.safetensors',
    },
  }

  const controlNetName =
    modelMap[modelType]?.[controlType] || modelMap[modelType].custom

  graph['133'].inputs.control_net_name = controlNetName

  console.log(
    `[CONTROLNET] ✅ ${modelType.toUpperCase()} using ${controlType} → "${controlNetName}"`,
  )

  return '135'
}
