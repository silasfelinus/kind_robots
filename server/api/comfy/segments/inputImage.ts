// /server/api/comfy/segments/inputImage.ts

import type { BuildGraphInput } from '../index'

export function addImageInput(graph: any, input: BuildGraphInput): string {
  const loadNodeId = 'loadImage'
  const encodeNodeId = 'vaeEncode'

  graph[loadNodeId] = {
    class_type: 'LoadImageFromBase64',
    inputs: {
      image_data: input.imageData || '',
    },
  }

  graph[encodeNodeId] = {
    class_type: 'VAEEncode',
    inputs: {
      pixels: [loadNodeId, 0],
      vae: ['10', 0], // Flux VAE or SDXL VAE (same index)
    },
  }

  return encodeNodeId
}
