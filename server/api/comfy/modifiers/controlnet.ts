// /server/api/comfy/modifiers/controlnet.ts

import type { ControlType } from '../index'

export function applyControlNet(graph: any, controlType: ControlType) {
  const controlKey = findNodeByType(graph, 'ControlNetApplyAdvanced')
  const preprocessorKey = findPreprocessorNode(graph, controlType)

  if (controlKey && preprocessorKey) {
    graph[controlKey].inputs.image = [preprocessorKey, 0]
  }
}

function findPreprocessorNode(
  graph: any,
  controlType: ControlType,
): string | undefined {
  const map: Record<ControlType, string> = {
    depth: 'Midas',
    scribble: 'ScribblePreprocessor',
    canny: 'Canny',
    custom: 'ControlPreprocessorCustom',
  }

  return findNodeByType(graph, map[controlType])
}

function findNodeByType(graph: any, type: string): string | undefined {
  return Object.keys(graph).find((key) => graph[key].class_type === type)
}
