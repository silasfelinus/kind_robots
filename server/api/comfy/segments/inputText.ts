// /server/api/comfy/segments/inputText.ts

import type { BuildGraphInput } from '../index'

export function addTextInput(
  graph: any,
  input: BuildGraphInput,
  ids: { clip: string },
) {
  const nodeId = 'clipText'
  graph[nodeId] = {
    class_type: input.loraName ? 'ImpactWildcardEncode' : 'CLIPTextEncode',
    inputs: input.loraName
      ? {
          wildcard_text: input.prompt,
          populated_text: '',
          mode: 'populate',
          seed: input.seed ?? 0,
          model: [ids.clip, 0],
          clip: [ids.clip, 1],
        }
      : {
          text: input.prompt,
          clip: [ids.clip, 1],
        },
  }
  return nodeId
}
