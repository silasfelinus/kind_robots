// /utils/scripts/verifyKontextMaskForwarding.ts
//
// Regression test for the stylist hair-mask path (conductor
// superkate-hairstyle-ai t-021, kaizen from t-018): asserts a maskData data
// URL supplied to server/api/comfy/kontext/enqueue.post.ts is forwarded
// unchanged into the ArtJob's ComfyUI payload, and wires the corresponding
// LoadImageMask/SetLatentNoiseMask nodes into the workflow graph. No
// network/DB dependency -- pure functions over fixture input.
import assert from 'node:assert/strict'

import {
  buildKontextInputImages,
  buildKontextWorkflow,
} from '../../server/api/comfy/kontext/utils/workflow'
import { applyArtJobOverrides } from '../../server/utils/artJobRetry'

const FIXTURE_IMAGE_DATA = 'data:image/png;base64,ZmFrZS1zb3VyY2UtcGhvdG8='
const FIXTURE_MASK_DATA = 'data:image/png;base64,ZmFrZS1oYWlyLW1hc2s='
const IMAGE_NAME = 'kr_kontext_queue_fixture.png'
const MASK_NAME = 'kr_kontext_mask_fixture.png'

// --- buildKontextInputImages: the ArtJob payload's `images` array ----------

const withMask = buildKontextInputImages(
  IMAGE_NAME,
  FIXTURE_IMAGE_DATA,
  MASK_NAME,
  FIXTURE_MASK_DATA,
)
assert.deepEqual(
  withMask,
  [
    { name: IMAGE_NAME, imageData: FIXTURE_IMAGE_DATA },
    { name: MASK_NAME, imageData: FIXTURE_MASK_DATA },
  ],
  'a provided maskData must be forwarded into the payload images array unchanged, alongside the source image',
)

const withoutMask = buildKontextInputImages(IMAGE_NAME, FIXTURE_IMAGE_DATA)
assert.deepEqual(
  withoutMask,
  [{ name: IMAGE_NAME, imageData: FIXTURE_IMAGE_DATA }],
  'omitting maskData must not add a second images entry',
)

const maskNameOnly = buildKontextInputImages(
  IMAGE_NAME,
  FIXTURE_IMAGE_DATA,
  MASK_NAME,
  '',
)
assert.deepEqual(
  maskNameOnly,
  [{ name: IMAGE_NAME, imageData: FIXTURE_IMAGE_DATA }],
  'a maskName with no maskData must not add a dangling images entry',
)

// --- buildKontextWorkflow: the ComfyUI graph's mask wiring ------------------

const baseInput = {
  prompt: 'fixture prompt',
  imageName: IMAGE_NAME,
}

const maskedWorkflow = buildKontextWorkflow({
  ...baseInput,
  maskName: MASK_NAME,
})
assert.equal(
  maskedWorkflow['70']?.class_type,
  'LoadImageMask',
  'a maskName must add a LoadImageMask node at 70',
)
assert.deepEqual(
  maskedWorkflow['70']?.inputs,
  { image: MASK_NAME, channel: 'red' },
  'LoadImageMask must load the exact maskName forwarded from the request, on the red channel',
)
assert.equal(
  maskedWorkflow['71']?.class_type,
  'SetLatentNoiseMask',
  'a maskName must add a SetLatentNoiseMask node at 71',
)
assert.deepEqual(
  (maskedWorkflow['71']?.inputs as { mask?: unknown })?.mask,
  ['70', 0],
  "SetLatentNoiseMask must consume LoadImageMask's output",
)
assert.deepEqual(
  (maskedWorkflow['13']?.inputs as { latent_image?: unknown })?.latent_image,
  ['71', 0],
  'the sampler must be wired to the masked latent, not the unmasked source',
)

const unmaskedWorkflow = buildKontextWorkflow(baseInput)
assert.equal(
  unmaskedWorkflow['70'],
  undefined,
  'no maskName must mean no LoadImageMask node',
)
assert.equal(
  unmaskedWorkflow['71'],
  undefined,
  'no maskName must mean no SetLatentNoiseMask node',
)

// --- coloring-book/t-039: pin the proven-good Kontext model chain -----------

assert.equal(
  unmaskedWorkflow['11']?.class_type,
  'DualCLIPLoader',
  'Kontext must use the stock DualCLIPLoader with the known-good fp8 T5 encoder',
)
assert.deepEqual(
  unmaskedWorkflow['11']?.inputs,
  {
    clip_name1: 't5xxl_fp8_e4m3fn_scaled.safetensors',
    clip_name2: 'clip_l.safetensors',
    type: 'flux',
    device: 'default',
  },
  'Kontext text encoders must match the working reference workflow supplied for t-039',
)
assert.deepEqual(
  unmaskedWorkflow['59']?.inputs,
  { unet_name: 'flux1-kontext-dev-Q5_K_M.gguf' },
  'the working reference proves the existing GGUF Kontext UNet is not the corrupted-static regression',
)
assert.deepEqual(
  unmaskedWorkflow['10']?.inputs,
  { vae_name: 'ae.safetensors' },
  'Kontext must keep the working ae.safetensors VAE',
)
assert.equal(
  unmaskedWorkflow['42']?.class_type,
  'ReferenceLatent',
  'the source image must stay attached as a Kontext reference latent',
)
assert.deepEqual(
  (unmaskedWorkflow['13']?.inputs as { latent_image?: unknown })?.latent_image,
  ['27', 0],
  'default Kontext sampling must still start from the empty SD3 latent',
)

// A retry of an ArtJob stored during the broken #1870 era must be repaired to
// the same encoder path instead of silently reapplying the GGUF T5 loader.
const brokenEraWorkflow = structuredClone(unmaskedWorkflow)
brokenEraWorkflow['11'] = {
  class_type: 'DualCLIPLoaderGGUF',
  inputs: {
    clip_name1: 't5-v1_1-xxl-encoder-Q5_K_S.gguf',
    clip_name2: 'clip_l.safetensors',
    type: 'flux',
  },
  _meta: { title: 'DualCLIPLoader (GGUF)' },
}
const repairedRetry = applyArtJobOverrides(
  { workflow: brokenEraWorkflow },
  null,
)
const repairedLoader = (repairedRetry.workflow as typeof brokenEraWorkflow)[
  '11'
]
assert.equal(
  repairedLoader?.class_type,
  'DualCLIPLoader',
  'retry normalization must recognize a Kontext graph and restore its stock loader',
)
assert.deepEqual(
  repairedLoader?.inputs,
  unmaskedWorkflow['11']?.inputs,
  'retry normalization must restore the same proven-good Kontext encoder pair as fresh jobs',
)

console.log(
  'kontext workflow verified: masks forward correctly, the proven-good fp8 ' +
    'T5/stock-loader path is pinned, and retries repair broken-era GGUF T5 jobs.',
)
