import type { BuildGraphInput } from '../index'

export default function controlnet(graph: any, input: BuildGraphInput) {
  if (!input.controlType) return

  // Adjust the loader or image type depending on control type
  // Example below assumes canny is default, modify as needed
  switch (input.controlType) {
    case 'canny':
      graph['132'].inputs.low_threshold = 0.45
      graph['132'].inputs.high_threshold = 0.8
      graph['135'].inputs.image = ['132', 0]
      break
    case 'scribble':
      graph['133'].inputs.control_net_name = 'scribbleModel.safetensors'
      break
    case 'depth':
      graph['133'].inputs.control_net_name = 'depthModel.safetensors'
      break
    case 'custom':
      graph['133'].inputs.control_net_name = 'ControlNetUnion.safetensors'
      break
  }
}
