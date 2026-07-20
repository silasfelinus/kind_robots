// /utils/scripts/verifyArtJobQueueAffinity.ts
import assert from 'node:assert/strict'
import {
  artJobQueueAffinityKey,
  selectSmartQueueCandidate,
} from '../../server/utils/artJobQueueAffinity'

function comfyPayload(checkpoint: string, seed: number, strength = 1) {
  return {
    workflow: {
      '1': {
        class_type: 'CheckpointLoaderSimple',
        inputs: { ckpt_name: checkpoint },
      },
      '2': {
        class_type: 'LoraLoader',
        inputs: {
          model: ['1', 0],
          clip: ['1', 1],
          lora_name: 'ami-style.safetensors',
          strength_model: strength,
          strength_clip: strength,
        },
      },
      '3': {
        class_type: 'KSampler',
        inputs: { seed, steps: 24, model: ['2', 0] },
      },
    },
  }
}

const firstAffinity = artJobQueueAffinityKey(
  'COMFY',
  comfyPayload('dream-a.safetensors', 100),
)
const sameModelNewSeed = artJobQueueAffinityKey(
  'COMFY',
  comfyPayload('dream-a.safetensors', 999),
)
const differentCheckpoint = artJobQueueAffinityKey(
  'COMFY',
  comfyPayload('dream-b.safetensors', 100),
)
const differentLoraStrength = artJobQueueAffinityKey(
  'COMFY',
  comfyPayload('dream-a.safetensors', 100, 0.65),
)

assert.equal(
  firstAffinity,
  sameModelNewSeed,
  'seed changes must not split model affinity',
)
assert.notEqual(
  firstAffinity,
  differentCheckpoint,
  'different checkpoints must use different affinity',
)
assert.notEqual(
  firstAffinity,
  differentLoraStrength,
  'different loader settings must use different affinity',
)

const candidates = [
  {
    id: 10,
    engine: 'COMFY',
    payload: comfyPayload('dream-b.safetensors', 1),
    priority: 0,
  },
  {
    id: 11,
    engine: 'COMFY',
    payload: comfyPayload('dream-a.safetensors', 2),
    priority: 0,
  },
]

const affinitySelection = selectSmartQueueCandidate(
  candidates,
  firstAffinity,
  24,
)
assert.equal(affinitySelection.candidate?.id, 11)
assert.equal(affinitySelection.affinityMatched, true)
assert.equal(affinitySelection.bypassedCount, 1)

const prioritySelection = selectSmartQueueCandidate(
  [
    ...candidates,
    {
      id: 20,
      engine: 'COMFY',
      payload: comfyPayload('dream-b.safetensors', 3),
      priority: 5,
    },
  ],
  firstAffinity,
  24,
)
assert.equal(
  prioritySelection.candidate?.id,
  20,
  'model affinity must never jump a higher-priority job',
)

const fairnessCandidates = Array.from({ length: 27 }, (_, index) => ({
  id: index + 1,
  engine: 'COMFY',
  payload: comfyPayload(
    index === 26 ? 'dream-a.safetensors' : 'dream-b.safetensors',
    index,
  ),
  priority: 0,
}))
const fairnessSelection = selectSmartQueueCandidate(
  fairnessCandidates,
  firstAffinity,
  24,
)
assert.equal(
  fairnessSelection.candidate?.id,
  1,
  'affinity must not bypass more than the configured fairness cap',
)

console.log('ArtJob smart queue affinity checks passed.')
