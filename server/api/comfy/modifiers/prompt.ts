// /server/api/comfy/modifiers/prompt.ts

import type { ModelType } from '../index'

export function applyPrompt(
  graph: any,
  {
    modelType,
    prompt,
    promptB,
  }: { modelType: ModelType; prompt: string; promptB?: string },
) {
  if (modelType === 'flux') {
    if (graph['29']) graph['29'].inputs.t5xxl = prompt
    if (promptB && graph['170']) {
      graph['170'].inputs.t5xxl = promptB
      graph['171'].inputs.conditioning_2 = ['170', 0]
    }
  } else if (modelType === 'sdxl') {
    if (graph['6']) graph['6'].inputs.text = prompt
    if (promptB && graph['33']) graph['33'].inputs.text = promptB
  }
}
