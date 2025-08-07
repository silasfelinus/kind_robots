// /server/api/comfy/segments/output.ts

import type { BuildGraphInput } from '../index'

export function addOutput(
  graph: any,
  fromNodeId: string,
  input: BuildGraphInput,
  vaeId = '30', // fallback for legacy
) {
  const decodeNodeId = 'decodeImage'
  const saveNodeId = 'saveImage'

  graph[decodeNodeId] = {
    class_type: 'VAEDecode',
    inputs: {
      samples: [fromNodeId, 0],
      vae: [vaeId, 0],
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

export function logGraph(graph: Record<string, any>, title = 'Graph') {
  const nodeIds = Object.keys(graph).sort((a, b) => {
    const aNum = parseInt(a)
    const bNum = parseInt(b)
    return isNaN(aNum) || isNaN(bNum) ? a.localeCompare(b) : aNum - bNum
  })

  const lines = nodeIds.map((id) => {
    const node = graph[id]
    return `${id.padEnd(8)} → ${node.class_type}`
  })

  console.log(`[COMFY] 🔍 ${title}:\n` + lines.join('\n'))
}
