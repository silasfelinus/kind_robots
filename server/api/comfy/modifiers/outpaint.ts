// /server/api/comfy/modifiers/outpaint.ts

import type { BuildGraphInput, ModelType } from '../index'

export default function outpaint(
  graph: any,
  input: BuildGraphInput,
  fromNodeId: string | undefined,
): string {
  if (!input.useOutpaint) return fromNodeId || 'vaeEncode'

  const { modelType = 'flux', outpaintDirection = 'right' } = input

  if (!graph['145']) {
    throw new Error('[OUTPAINT] Node 145 (Outpaint node) is missing')
  }

  graph['145'].inputs.direction = outpaintDirection
  graph['145'].inputs.match_image_size = true

  const outpaintModelMap: Record<ModelType, string> = {
    flux: 'flux_outpaint.safetensors',
    sdxl: 'sdxl_outpaint.safetensors',
  }

  const modelNodeId = findOutpaintModelNode(graph)
  if (modelNodeId) {
    graph[modelNodeId].inputs.outpaint_model_name = outpaintModelMap[modelType]
    console.log(
      `[OUTPAINT] ✅ Using ${outpaintModelMap[modelType]} on node ${modelNodeId}`,
    )
  }

  console.log(
    `[OUTPAINT] ✅ Direction: ${outpaintDirection}, matched size: true`,
  )

  return '145'
}

function findOutpaintModelNode(graph: any): string | null {
  for (const [id, node] of Object.entries<any>(graph)) {
    if (
      node.class_type?.toLowerCase().includes('outpaint') &&
      node.inputs?.outpaint_model_name !== undefined
    ) {
      return id
    }
  }
  return null
}
