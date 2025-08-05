// /server/api/comfy/modifiers/upscale.ts

export function applyUpscale(graph: any) {
  const switchKey = findNodeByType(graph, 'Conditioning Input Switch')
  if (switchKey) {
    graph[switchKey].inputs.condition = true
  }
}

function findNodeByType(graph: any, type: string): string | undefined {
  return Object.keys(graph).find((key) => graph[key].class_type === type)
}
