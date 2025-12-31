import type { BuildGraphInput, ModelType, ControlType } from '../index'

let id = 200 // start high to avoid conflicts

export default function controlnet(
  graph: Record<string, any>,
  input: BuildGraphInput,
  fromNodeId: string | undefined,
): string {
  const { modelType = 'flux', controlType = 'depth' } = input

  // Pick model name
  const modelMap: Record<ModelType, Record<ControlType, string>> = {
    flux: {
      canny: 'flux_canny.safetensors',
      scribble: 'flux_scribble.safetensors',
      depth: 'control-lora-depth-rank256.safetensors',
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

  // ---- 1. Add Preprocessor Node ----
  const preprocessorId = `${id++}`
  graph[preprocessorId] = {
    class_type:
      controlType === 'depth'
        ? 'MiDaS-DepthMapPreprocessor'
        : controlType === 'scribble'
          ? 'ScribblePreprocessor'
          : controlType === 'canny'
            ? 'Canny'
            : 'CustomPreprocessor',
    inputs: {},
    _meta: { title: 'Control Preprocessor' },
  }

  if (controlType === 'canny') {
    graph[preprocessorId].inputs = {
      low_threshold: 0.45,
      high_threshold: 0.8,
    }
  } else if (controlType === 'scribble') {
    graph[preprocessorId].inputs = {
      threshold: 0.5,
    }
  }

  if (!fromNodeId) {
    throw new Error('[CONTROLNET] No source node for control image')
  }

  graph[preprocessorId].inputs.image = [fromNodeId, 0]

  // ---- 2. Add ControlNetLoader Node ----
  const loaderId = `${id++}`
  graph[loaderId] = {
    class_type: 'ControlNetLoader',
    inputs: {
      control_net_name: controlNetName,
    },
    _meta: { title: 'Load ControlNet' },
  }

  // ---- 3. Add ControlNetApplyAdvanced Node ----
  const applyId = `${id++}`
  graph[applyId] = {
    class_type: 'ControlNetApplyAdvanced',
    inputs: {
      strength: input.strength ?? 0.85,
      start_percent: 0,
      end_percent: 1,
      positive: ['placeholder_pos', 0],
      negative: ['placeholder_neg', 0],
      control_net: [loaderId, 0],
      image: [preprocessorId, 0],
      vae: ['placeholder_vae', 2],
    },
    _meta: { title: 'Apply ControlNet' },
  }

  console.log(
    `[CONTROLNET] ✅ ${modelType.toUpperCase()} using ${controlType} → "${controlNetName}"`,
  )

  return applyId
}
