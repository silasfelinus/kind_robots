import type { BuildGraphInput } from '../index'

export default function inpaint(graph: any, input: BuildGraphInput) {
  if (!input.useInpaint || !input.maskData) return

  graph['160'].inputs.image_data = `data:image/png;base64,${input.maskData}`
  graph['162'].inputs.condition = true
}
