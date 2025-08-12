// /server/api/comfy/segments/output.ts
import type { BuildGraphInput } from '../index'

type Graph = Record<string, any>

export function addOutput(
  graph: Graph,
  fromNodeId: string,
  input: BuildGraphInput & { filenamePrefix?: string; returnBase64?: boolean },
  vaeId: string | number = '30',
) {
  const decodeNodeId = 'decodeImage'
  const saveNodeId = input.returnBase64 ? 'saveImage64' : 'saveImage'
  const prefix =
    (input.filenamePrefix && String(input.filenamePrefix).trim()) ||
    `${input.modelType?.toUpperCase?.() || 'IMG'}_${Date.now()}`

  graph[decodeNodeId] = {
    class_type: 'VAEDecode',
    inputs: {
      samples: [fromNodeId, 0],
      vae: [String(vaeId), 0],
    },
    _meta: { title: 'VAE Decode' },
  }

  if (input.returnBase64) {
    graph[saveNodeId] = {
      class_type: 'SaveImage64',
      inputs: {
        images: [decodeNodeId, 0],
        filename_prefix: prefix,
      },
      _meta: { title: 'Save Image & Base64 Output' },
    }
  } else {
    graph[saveNodeId] = {
      class_type: 'SaveImage',
      inputs: {
        images: [decodeNodeId, 0],
        filename_prefix: prefix,
      },
      _meta: { title: 'Save Image' },
    }
  }

  return saveNodeId
}

export function logGraph(graph: Graph, title = 'Graph') {
  const nodeIds = Object.keys(graph).sort((a, b) => {
    const na = Number(a),
      nb = Number(b)
    const aNum = Number.isFinite(na),
      bNum = Number.isFinite(nb)
    return aNum && bNum ? na - nb : a.localeCompare(b)
  })

  const lines = nodeIds.map(
    (id) => `${id.padEnd(12)} → ${graph[id].class_type}`,
  )
  console.log(`[COMFY] 🔍 ${title}:\n${lines.join('\n')}`)
}
