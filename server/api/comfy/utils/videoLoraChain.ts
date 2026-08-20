import {
  appendModelOnlyLoraChain,
  normalizeLoraSelections,
  type LoraChainWorkflow,
  type LoraSelection,
} from './loraChain'

export type VideoLoraEngine = 'ltx' | 'wan'

export type VideoLoraRequest = {
  loras?: unknown
  loraName?: unknown
  loraStrength?: unknown
}

function setModelRef(
  workflow: LoraChainWorkflow,
  nodeId: string,
  model: [string, number],
): void {
  const node = workflow[nodeId]
  if (!node?.inputs) return
  node.inputs.model = model
}

/**
 * Apply user-selected LoRAs after a video builder has created its base graph.
 *
 * LTX already has one REQUIRED distilled acceleration LoRA at node 293. User
 * LoRAs therefore chain after node 293 and both the main and refine guiders read
 * the final model. That required LoRA is deliberately not part of the user's
 * stack or MAX_LORAS_PER_JOB allowance.
 *
 * WAN has two graph shapes. TI2V has one UNET/sampler. A14B has high- and
 * low-noise experts, so every selected LoRA must be applied independently to
 * both experts in the same order and at the same strength.
 */
export function applyVideoLoraChain(
  workflow: LoraChainWorkflow,
  engine: VideoLoraEngine,
  request: VideoLoraRequest,
): LoraSelection[] {
  const loras = normalizeLoraSelections(request)
  if (!loras.length) return loras

  if (engine === 'ltx') {
    const model = appendModelOnlyLoraChain(workflow, {
      loras,
      model: ['293', 0],
      startId: 9000,
    })
    setModelRef(workflow, '315', model)
    setModelRef(workflow, 'ltx_refine_guider', model)
    return loras
  }

  if (workflow.sampler) {
    const model = appendModelOnlyLoraChain(workflow, {
      loras,
      model: ['unet', 0],
      startId: 9100,
    })
    setModelRef(workflow, 'sampler', model)
    return loras
  }

  const highModel = appendModelOnlyLoraChain(workflow, {
    loras,
    model: ['unet_high', 0],
    startId: 9100,
  })
  const lowModel = appendModelOnlyLoraChain(workflow, {
    loras,
    model: ['unet_low', 0],
    startId: 9200,
  })
  setModelRef(workflow, 'sampler_high', highModel)
  setModelRef(workflow, 'sampler_low', lowModel)
  return loras
}
