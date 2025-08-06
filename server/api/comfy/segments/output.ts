// /server/api/comfy/segments/output.ts

import type { BuildGraphInput } from '../index'

export function addOutput(
  graph: any,
  fromNodeId: string,
  input: BuildGraphInput,
) {
  const decodeNodeId = 'decodeImage'
  const saveNodeId = 'saveImage'

  graph[decodeNodeId] = {
    class_type: 'VAEDecode',
    inputs: {
      samples: [fromNodeId, 0],
      vae: ['10', 0], // Use '30' for SDXL
    },
  }

  graph[saveNodeId] = {
    class_type: 'SaveImage',
    inputs: {
      images: [decodeNodeId, 0],
      filename_prefix: `${input.modelType.toUpperCase()}_Output`,
    },
  }

  return saveNodeId
}
