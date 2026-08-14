// Contract test for the two WAN image-to-video graphs.
//
// WAN 2.2 ships two i2v paths and this render box (12 GB card) can only afford
// one interactively. Measured sizes on the host:
//
//   A14B  wan2.2_i2v_high_noise_14B_fp8   14 GB  } one resident at a time,
//         wan2.2_i2v_low_noise_14B_fp8    14 GB  } still over the card
//   TI2V  wan2.2_ti2v_5B_fp16            9.4 GB
//
// A14B does not fit, so ComfyUI offloads and the render becomes an overnight
// job -- slow, not broken, and explicitly kept as the quality mode. TI2V is the
// default. The two graphs are structurally different, and the differences are
// exactly what a careless edit would flatten, so they are pinned here.
import assert from 'node:assert/strict'
import {
  buildWanImageToVideoWorkflow,
  resolveWanMode,
  WAN_TI2V_UNET,
  WAN_TI2V_VAE,
  WAN_VAE,
} from '../../server/api/comfy/wan/utils/imageToVideoWorkflow'

const base = {
  prompt: 'a cat',
  negativePrompt: 'blurry',
  firstImageName: 'a.png',
  width: 832,
  height: 480,
  duration: 5,
  frameRate: 16,
} as Parameters<typeof buildWanImageToVideoWorkflow>[0]

const node = (wf: Record<string, any>, cls: string) =>
  Object.values(wf).find((n: any) => n?.class_type === cls) as any

// --- mode selection ---------------------------------------------------------

assert.equal(
  resolveWanMode(base),
  'ti2v',
  'TI2V is the default: it fits the card',
)
assert.equal(
  resolveWanMode({ ...base, mode: 'a14b' }),
  'a14b',
  'an explicit mode always wins',
)
assert.equal(
  resolveWanMode({ ...base, lastImageName: 'z.png' }),
  'a14b',
  // Wan22ImageToVideoLatent declares only an optional start_image and has no
  // end_image, so TI2V cannot honour a last frame. Routing to A14B costs time;
  // silently dropping the pinned final frame would cost the user the feature.
  'a last-frame request must select the only graph that can do it',
)

// --- TI2V graph -------------------------------------------------------------

const ti2v = buildWanImageToVideoWorkflow(base) as Record<string, any>

assert.equal(node(ti2v, 'UNETLoader').inputs.unet_name, WAN_TI2V_UNET)
assert.equal(
  node(ti2v, 'VAELoader').inputs.vae_name,
  WAN_TI2V_VAE,
  'the 5B TI2V model is trained against the 2.2 VAE, not the 2.1 VAE',
)
assert.ok(node(ti2v, 'Wan22ImageToVideoLatent'), 'TI2V uses the latent node')
assert.equal(node(ti2v, 'WanImageToVideo'), undefined)
assert.equal(
  node(ti2v, 'KSamplerAdvanced'),
  undefined,
  'no expert handover, so no two-stage sampler',
)

const sampler = node(ti2v, 'KSampler')
assert.ok(sampler, 'TI2V samples in one pass')
// The load-bearing wiring difference. WanImageToVideo returns
// (positive, negative, latent) and the A14B graph routes conditioning THROUGH
// it. Wan22ImageToVideoLatent returns a LATENT only -- confirmed against the
// host's /object_info -- so conditioning must come straight off the encoders.
// Copying A14B's wiring here would reference outputs that do not exist.
assert.deepEqual(sampler.inputs.positive, ['positive', 0])
assert.deepEqual(sampler.inputs.negative, ['negative', 0])
assert.deepEqual(sampler.inputs.latent_image, ['latent', 0])

const latent = node(ti2v, 'Wan22ImageToVideoLatent')
assert.deepEqual(latent.inputs.start_image, ['img_first', 0])
assert.ok(
  !('end_image' in latent.inputs),
  'the node declares no end_image; emitting one would be rejected at submit',
)
for (const key of ['vae', 'width', 'height', 'length', 'batch_size']) {
  assert.ok(key in latent.inputs, `Wan22ImageToVideoLatent requires ${key}`)
}

// One unet means one LoRA, not the A14B matched pair.
const ti2vLora = buildWanImageToVideoWorkflow({
  ...base,
  loraName: 'x.safetensors',
}) as Record<string, any>
const loraNodes = Object.values(ti2vLora).filter(
  (n: any) => n?.class_type === 'LoraLoaderModelOnly',
)
assert.equal(loraNodes.length, 1, 'TI2V has a single model to patch')
assert.deepEqual(node(ti2vLora, 'KSampler').inputs.model, ['lora', 0])

// --- A14B graph is untouched ------------------------------------------------

const a14b = buildWanImageToVideoWorkflow({
  ...base,
  mode: 'a14b',
}) as Record<string, any>

const unets = Object.values(a14b).filter(
  (n: any) => n?.class_type === 'UNETLoader',
)
assert.equal(unets.length, 2, 'the quality mode keeps both experts')
assert.equal(node(a14b, 'VAELoader').inputs.vae_name, WAN_VAE)
assert.ok(node(a14b, 'WanImageToVideo'))
const advanced = Object.values(a14b).filter(
  (n: any) => n?.class_type === 'KSamplerAdvanced',
)
assert.equal(advanced.length, 2, 'high-noise then low-noise')

const a14bLast = buildWanImageToVideoWorkflow({
  ...base,
  lastImageName: 'z.png',
}) as Record<string, any>
assert.deepEqual(node(a14bLast, 'WanImageToVideo').inputs.end_image, [
  'img_last',
  0,
])

console.log(
  'WAN i2v mode contract OK: ti2v default (5B/2.2 VAE/single sampler), ' +
    'a14b on request or last-frame, conditioning wired per graph.',
)
