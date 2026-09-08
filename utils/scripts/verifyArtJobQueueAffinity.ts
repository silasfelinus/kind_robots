// /utils/scripts/verifyArtJobQueueAffinity.ts
import assert from 'node:assert/strict'
import {
  artJobQueueAffinityKey,
  artJobQueueModelKey,
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

// ---------------------------------------------------------------------------
// HEAVY-MODEL TIER
//
// Measured on the live queue 2026-09-08: 23 pending jobs, TWO heavy models, but
// SEVEN distinct full affinity keys, because jobs in one family carried
// different LoRAs. Seven keys over two models means the exact tier almost never
// fires and the claim falls back to FIFO, swapping unets far more often than
// the work needs.

const modelA = artJobQueueModelKey(
  'COMFY',
  comfyPayload('dream-a.safetensors', 1),
)
const modelB = artJobQueueModelKey(
  'COMFY',
  comfyPayload('dream-b.safetensors', 1),
)

assert.equal(
  modelA,
  artJobQueueModelKey('COMFY', comfyPayload('dream-a.safetensors', 7, 0.42)),
  'a LoRA strength change must NOT split the heavy-model key',
)
assert.notEqual(
  modelA,
  modelB,
  'different checkpoints must split the heavy-model key',
)
assert.equal(
  artJobQueueModelKey('COMFY', {
    workflow: { '1': { class_type: 'KSampler', inputs: { seed: 1 } } },
  }),
  null,
  'a payload naming no heavy resource must yield null, never an engine-only bucket',
)

// The case the whole change exists for: nothing matches exactly, but a job on
// the same unet sits behind one on a different unet.
const differentLora = {
  id: 31,
  engine: 'COMFY',
  payload: comfyPayload('dream-a.safetensors', 5, 0.65),
  priority: 0,
}
const modelTier = selectSmartQueueCandidate(
  [
    {
      id: 30,
      engine: 'COMFY',
      payload: comfyPayload('dream-b.safetensors', 4),
      priority: 0,
    },
    differentLora,
  ],
  firstAffinity,
  24,
  modelA,
)
assert.equal(
  modelTier.candidate?.id,
  31,
  'must prefer the same heavy model over a unet swap',
)
assert.equal(modelTier.matchTier, 'model')
assert.equal(modelTier.affinityMatched, true)

// The same call WITHOUT a preferred model key is the old behaviour, and it
// takes the unet swap. Asserted so the tier above is provably what changes the
// outcome, and so smartQueue=false stays strict FIFO.
assert.equal(
  selectSmartQueueCandidate(
    [
      {
        id: 30,
        engine: 'COMFY',
        payload: comfyPayload('dream-b.safetensors', 4),
        priority: 0,
      },
      differentLora,
    ],
    firstAffinity,
    24,
  ).candidate?.id,
  30,
  'without a model key the selector must behave exactly as before',
)

// An exact match must still win over a merely-same-model one, even when the
// same-model job is older.
const exactBeatsModel = selectSmartQueueCandidate(
  [
    differentLora,
    {
      id: 32,
      engine: 'COMFY',
      payload: comfyPayload('dream-a.safetensors', 6),
      priority: 0,
    },
  ],
  firstAffinity,
  24,
  modelA,
)
assert.equal(
  exactBeatsModel.candidate?.id,
  32,
  'exact affinity must outrank heavy-model affinity',
)
assert.equal(exactBeatsModel.matchTier, 'exact')

// Priority still dominates both tiers.
assert.equal(
  selectSmartQueueCandidate(
    [
      differentLora,
      {
        id: 33,
        engine: 'COMFY',
        payload: comfyPayload('dream-b.safetensors', 7),
        priority: 5,
      },
    ],
    firstAffinity,
    24,
    modelA,
  ).candidate?.id,
  33,
  'heavy-model affinity must never jump a higher-priority job',
)

// And the fairness cap bounds the model tier too.
const modelFairness = selectSmartQueueCandidate(
  Array.from({ length: 27 }, (_, index) => ({
    id: index + 1,
    engine: 'COMFY',
    payload: comfyPayload(
      index === 26 ? 'dream-a.safetensors' : 'dream-b.safetensors',
      index,
      index === 26 ? 0.65 : 1,
    ),
    priority: 0,
  })),
  firstAffinity,
  24,
  modelA,
)
assert.equal(
  modelFairness.candidate?.id,
  1,
  'heavy-model affinity must not bypass more than the fairness cap',
)

// A null preferred model key must never group: two unrelated payloads that both
// fail heavy-resource detection must not be treated as the same model.
const nullKeySelection = selectSmartQueueCandidate(
  [
    {
      id: 40,
      engine: 'COMFY',
      payload: comfyPayload('dream-b.safetensors', 9),
      priority: 0,
    },
    { id: 41, engine: 'COMFY', payload: { workflow: {} }, priority: 0 },
  ],
  null,
  24,
  null,
)
assert.equal(
  nullKeySelection.candidate?.id,
  40,
  'a null model key must fall back to FIFO',
)
assert.equal(nullKeySelection.matchTier, 'none')

console.log('ArtJob smart queue affinity checks passed.')
