// /server/api/comfy/modifiers/inpaint.ts

export function applyInpaint(graph: any, maskData: string) {
  const maskKey =
    findNodeByType(graph, 'LoadMaskImage') ||
    findNodeByType(graph, 'LoadImageFromBase64')
  if (maskKey) {
    graph[maskKey].inputs.image_data = `data:image/png;base64,${maskData}`
  }

  const switchKey = findNodeByType(graph, 'Image Input Switch')
  if (switchKey) {
    graph[switchKey].inputs.condition = true
  }
}

function findNodeByType(graph: any, type: string): string | undefined {
  return Object.keys(graph).find((key) => graph[key].class_type === type)
}
