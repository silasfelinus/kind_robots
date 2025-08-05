// /server/api/comfy/modifiers/upscale.ts

import type { BuildGraphInput, ModelType } from '../index'

export default function upscale(graph: any, input: BuildGraphInput) {
  if (!input.useUpscale) return

  if (!graph['91']) {
    throw new Error('[UPSCALE] Missing toggle node (91)')
  }

  // Enable conditional upscale
  graph['91'].inputs.condition = true

  // Determine model based on type
  const upscaleModelMap: Record<ModelType, string> = {
    flux: 'flux_upscale.safetensors',
    sdxl: 'sdxl_upscale.safetensors',
  }

  const modelNodeId = findUpscaleModelNode(graph)
  if (modelNodeId) {
    graph[modelNodeId].inputs.upscale_model_name =
      upscaleModelMap[input.modelType || 'flux']
    console.log(
      `[UPSCALE] ✅ Using ${upscaleModelMap[input.modelType || 'flux']} on node ${modelNodeId}`,
    )
  }

  console.log('[UPSCALE] ✅ Enabled conditional upscale')
}

function findUpscaleModelNode(graph: any): string | null {
  for (const [id, node] of Object.entries<any>(graph)) {
    if (
      node.class_type?.toLowerCase().includes('upscale') &&
      node.inputs?.upscale_model_name !== undefined
    ) {
      return id
    }
  }
  return null
}
