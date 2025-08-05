import type { BuildGraphInput } from '../index'

export default function morph(graph: any, input: BuildGraphInput) {
  if (!input.useMorph) return

  graph['171'].inputs.strength = input.strength ?? 0.5
}
