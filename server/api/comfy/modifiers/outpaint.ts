import type { BuildGraphInput } from '../index'

export default function outpaint(graph: any, input: BuildGraphInput) {
  if (!input.useOutpaint) return

  graph['145'].inputs.direction = 'right'
  graph['145'].inputs.match_image_size = true
}
