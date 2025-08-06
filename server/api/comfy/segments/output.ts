// /server/api/comfy/segments/output.ts

import type { BuildGraphInput } from '../index'

export function addOutput(
  graph: any,
  fromNodeId: string,
  input: BuildGraphInput,
) {
  const decodeNodeId = 'decodeImage'
  const saveNodeId = 'saveImage'

  graph[decodeNodeId] = {
    class_type: 'VAEDecode',
    inputs: {
      samples: [fromNodeId, 0],
      vae: ['10', 0], // Use '30' for SDXL
    },
  }

  graph[saveNodeId] = {
    class_type: 'SaveImage',
    inputs: {
      images: [decodeNodeId, 0],
      filename_prefix: `${input.modelType.toUpperCase()}_Output`,
    },
  }

  return saveNodeId
}

export function logGraph(stages: string[], title = 'Flow') {
  const maxLength = Math.max(...stages.map((s) => s.length)) + 4
  const line = '─'.repeat(maxLength)
  const spacer = ' '.repeat(2)
  const prefix = '│'
  const output = []

  output.push(`┌${line}┐`)
  output.push(
    `│${title.padStart(Math.floor((maxLength + title.length) / 2)).padEnd(maxLength)}│`,
  )
  output.push(`├${line}┤`)

  for (let i = 0; i < stages.length; i++) {
    const label = stages[i]
    output.push(
      `${prefix}${spacer}${label.padEnd(maxLength - 4)}${spacer}${prefix}`,
    )
    if (i < stages.length - 1) {
      output.push(
        `${prefix}${spacer}${'│'.padEnd(maxLength - 4)}${spacer}${prefix}`,
      )
    }
  }

  output.push(`└${line}┘`)

  console.log(output.join('\n'))
}
