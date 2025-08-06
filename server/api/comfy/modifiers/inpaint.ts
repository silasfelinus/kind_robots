// /server/api/comfy/modifiers/inpaint.ts

import type { BuildGraphInput, ModelType } from '../index'

export default function inpaint(
  graph: any,
  input: BuildGraphInput,
  fromNodeId: string | undefined,
): string {
  const { modelType = 'flux', maskData, inpaintMode = 'masked' } = input
  if (!input.useInpaint || !maskData) {
    return fromNodeId || 'vaeEncode'
  }

  if (!graph['160'] || !graph['162']) {
    throw new Error('[INPAINT] Missing mask or switch nodes (160, 162)')
  }

  // Inject mask
  graph['160'].inputs.image_data = `data:image/png;base64,${maskData}`

  // Control whether to use the inpainted area
  graph['162'].inputs.condition = inpaintMode === 'masked'

  // Optionally gate inpaint model (if used)
  const inpaintModelMap: Record<ModelType, string> = {
    flux: 'flux_inpaint.safetensors',
    sdxl: 'sdxl_inpaint.safetensors',
  }

  const modelNodeId = findInpaintModelNode(graph)
  if (modelNodeId) {
    graph[modelNodeId].inputs.inpaint_model_name = inpaintModelMap[modelType]
    console.log(
      `[INPAINT] ✅ Using ${inpaintModelMap[modelType]} on node ${modelNodeId}`,
    )
  }

  console.log(`[INPAINT] ✅ Mask applied, mode: ${inpaintMode}`)

  return '162'
}

function findInpaintModelNode(graph: any): string | null {
  for (const [id, node] of Object.entries<any>(graph)) {
    if (
      node.class_type?.toLowerCase().includes('inpaint') &&
      node.inputs?.inpaint_model_name !== undefined
    ) {
      return id
    }
  }
  return null
}
