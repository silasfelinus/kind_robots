// /server/api/comfy/modifiers/morph.ts

import type { BuildGraphInput } from '../index'

export default function morph(graph: any, input: BuildGraphInput) {
  if (!input.useMorph) return

  const strength = input.strength ?? 0.5

  if (!graph['171']) {
    throw new Error('[MORPH] Missing conditioning combiner node (171)')
  }

  graph['171'].inputs.strength = strength
  console.log(`[MORPH] ✅ Set blend strength to ${strength}`)

  // Optional mask
  if (input.maskData && graph['160']) {
    graph['160'].inputs.image_data = `data:image/png;base64,${input.maskData}`
    console.log('[MORPH] ✅ Applied blend mask to node 160')
  }

  // Conditional routing if needed
  if (graph['162']) {
    graph['162'].inputs.condition = true
    console.log('[MORPH] ✅ Enabled image switch for morphing')
  }
}
