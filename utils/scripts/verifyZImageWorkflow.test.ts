// /utils/scripts/verifyZImageWorkflow.test.ts
//
// Self-test for the Z-Image Turbo graph. Every assertion here corresponds to a
// value in the ComfyUI template Silas exported on 2026-09-16; the point is that
// a later edit cannot quietly drift away from a graph that is known to run.
//
// Why these specifically: ArtJob 25378 failed with "clip input is invalid:
// None" when Z-Image was pushed through the ordinary comfy lane, because
// Z-Image ships its text encoder separately from the diffusion weights. The
// three loaders, the encoder TYPE, and the zeroed negative are the parts that
// distinguish a working graph from that failure.
import assert from 'node:assert/strict'

import {
  buildZImageWorkflowFromRequest,
  ZIMAGE_CFG,
  ZIMAGE_CLIP_NAME,
  ZIMAGE_CLIP_TYPE,
  ZIMAGE_MAX_STEPS,
  ZIMAGE_UNET_NAME,
  ZIMAGE_VAE_NAME,
} from '../../server/api/comfy/zimage/utils/workflow.js'

function nodesOfType(
  workflow: Record<
    string,
    { class_type: string; inputs: Record<string, unknown> }
  >,
  type: string,
) {
  return Object.entries(workflow).filter(([, node]) => node.class_type === type)
}

function run(): void {
  const { workflow, steps } = buildZImageWorkflowFromRequest({
    prompt: 'a test subject',
    width: 1024,
    height: 1024,
  })

  // --- the three separate loaders ---
  const [, unet] = nodesOfType(workflow, 'UNETLoader')[0]!
  assert.equal(unet.inputs.unet_name, ZIMAGE_UNET_NAME)

  const [, clip] = nodesOfType(workflow, 'CLIPLoader')[0]!
  assert.equal(clip.inputs.clip_name, ZIMAGE_CLIP_NAME)
  assert.equal(
    clip.inputs.type,
    ZIMAGE_CLIP_TYPE,
    "the encoder is Qwen3-4B loaded as 'lumina2'; the default CLIP type will not load it",
  )

  const [, vae] = nodesOfType(workflow, 'VAELoader')[0]!
  assert.equal(vae.inputs.vae_name, ZIMAGE_VAE_NAME)

  assert.equal(
    nodesOfType(workflow, 'CheckpointLoaderSimple').length,
    0,
    'Z-Image has no bundled checkpoint -- that path is what failed on ArtJob 25378',
  )

  // --- the negative is the positive, zeroed ---
  const zeroOut = nodesOfType(workflow, 'ConditioningZeroOut')
  assert.equal(zeroOut.length, 1, 'the negative branch is a zeroed positive')
  const [encodeId] = nodesOfType(workflow, 'CLIPTextEncode')[0]!
  assert.deepEqual(zeroOut[0]![1].inputs.conditioning, [encodeId, 0])
  assert.equal(
    nodesOfType(workflow, 'CLIPTextEncode').length,
    1,
    'there is no second encode node for a negative prompt to reach',
  )

  // --- sampling is fixed by the distilled model ---
  const [, sampler] = nodesOfType(workflow, 'KSampler')[0]!
  assert.equal(sampler.inputs.cfg, ZIMAGE_CFG)
  assert.equal(sampler.inputs.sampler_name, 'res_multistep')
  assert.equal(sampler.inputs.scheduler, 'simple')
  assert.deepEqual(
    sampler.inputs.negative,
    zeroOut[0]![1] && [zeroOut[0]![0], 0],
  )

  assert.equal(
    nodesOfType(workflow, 'ModelSamplingAuraFlow').length,
    1,
    'the model passes through ModelSamplingAuraFlow before sampling',
  )
  assert.equal(
    nodesOfType(workflow, 'EmptySD3LatentImage').length,
    1,
    'Z-Image takes an SD3-shaped latent, not EmptyLatentImage',
  )

  // --- steps are clamped to the distilled ceiling ---
  const pushed = buildZImageWorkflowFromRequest({ prompt: 'x', steps: 60 })
  assert.equal(
    pushed.steps,
    ZIMAGE_MAX_STEPS,
    'a caller cannot push a distilled model past its ceiling',
  )
  assert.ok(steps > 0)

  // --- LoRAs ride the UNet only ---
  const withLora = buildZImageWorkflowFromRequest({
    prompt: 'x',
    loras: [
      { name: 'Unknown/SFW/RealisticSnapshot.safetensors', strength: 0.8 },
    ],
  })
  const chain = nodesOfType(withLora.workflow, 'LoraLoaderModelOnly')
  assert.equal(chain.length, 1, 'the LoRA is wired as a model-only link')
  assert.equal(
    nodesOfType(withLora.workflow, 'LoraLoader').length,
    0,
    'never the model+clip loader: the encoder is Qwen, not a CLIP a LoRA trains',
  )
  const [, aura] = nodesOfType(withLora.workflow, 'ModelSamplingAuraFlow')[0]!
  assert.deepEqual(
    aura.inputs.model,
    [chain[0]![0], 0],
    'sampling reads the tail of the LoRA chain, not the bare UNet',
  )

  // --- seeds vary so a re-render is a real re-render ---
  const a = buildZImageWorkflowFromRequest({ prompt: 'x' }).seed
  const b = buildZImageWorkflowFromRequest({ prompt: 'x' }).seed
  assert.ok(a !== b || a === 0, 'an unspecified seed is randomised')
  assert.equal(
    buildZImageWorkflowFromRequest({ prompt: 'x', seed: 42 }).seed,
    42,
  )

  console.log('verifyZImageWorkflow: all assertions passed')
}

run()
