import type { BuildGraphInput } from '../index'

export default function upscale(graph: any, input: BuildGraphInput) {
  if (!input.useUpscale) return

  graph['91'].inputs.condition = true
}
