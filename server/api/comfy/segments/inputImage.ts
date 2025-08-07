import type { BuildGraphInput } from '../index'

export function addImageInput(
  graph: any,
  input: BuildGraphInput,
  handles: { vae: string },
): string {
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
      vae: [handles.vae, 0], // ✅ dynamic VAE ID
    },
  }

  return encodeNodeId
}
