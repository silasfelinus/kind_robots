// /server/api/comfy/segments/sampling.ts

import type { BuildGraphInput } from '../index'

export function addSamplerAndScheduler(
  graph: any,
  input: BuildGraphInput,
  modelNode: string,
  conditioningNode: string | undefined,
  latentInputNode: string | undefined,
): string {
  const scheduleNodeId = 'sigmaSchedule'
  const samplerNodeId = 'sampler'

  graph[scheduleNodeId] = {
    class_type: 'BasicScheduler',
    inputs: {
      scheduler: input.scheduler || 'sgm_uniform',
      steps: input.steps || 20,
      denoise: input.denoise ?? 1,
      model: [modelNode, 0],
    },
  }

  graph[samplerNodeId] = {
    class_type: 'SamplerCustomAdvanced',
    inputs: {
      noise: ['noise', 0],
      guider: ['guider', 0],
      sampler: ['samplerSelect', 0],
      sigmas: [scheduleNodeId, 0],
      latent_image: [latentInputNode || 'latentInit', 0],
    },
  }

  graph['noise'] = {
    class_type: 'RandomNoise',
    inputs: {
      noise_seed: input.seed || Date.now(),
    },
  }

  graph['samplerSelect'] = {
    class_type: 'KSamplerSelect',
    inputs: {
      sampler_name: input.sampler_name || 'euler',
    },
  }

  graph['guider'] = {
    class_type: 'BasicGuider',
    inputs: {
      model: [modelNode, 0],
      conditioning: [conditioningNode || 'clipText', 0],
    },
  }

  return samplerNodeId
}
