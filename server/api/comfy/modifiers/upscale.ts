// /server/api/comfy/modifiers/upscale.ts

import type { BuildGraphInput, ModelType } from '../index'

export default function upscale(
  graph: any,
  input: BuildGraphInput,
  fromNodeId: string | undefined,
): string {
  if (!input.useUpscale) return fromNodeId || 'vaeEncode'

  if (!graph['91']) {
    throw new Error('[UPSCALE] Missing toggle node (91)')
  }

  graph['91'].inputs.condition = true

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
  return '91'
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
