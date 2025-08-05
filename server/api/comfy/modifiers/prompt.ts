import type { BuildGraphInput } from '../index'

export default function prompt(graph: any, input: BuildGraphInput) {
  if (!input.prompt) return

  graph['29'].inputs.t5xxl = input.prompt

  if (input.promptB) {
    graph['170'].inputs.t5xxl = input.promptB
    graph['171'].inputs.strength = input.promptBlend ?? 0.5
  }
}
