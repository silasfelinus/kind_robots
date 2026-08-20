// Contract test for the two WAN image-to-video graphs and the shared video
// LoRA adapter layered on top of them.
import assert from 'node:assert/strict'
import type {
  ComfyWorkflow,
  ComfyWorkflowNode,
  WanImageToVideoInput,
} from '../../server/api/comfy/wan/utils/imageToVideoWorkflow'
import {
  buildWanImageToVideoWorkflow,
  resolveWanMode,
  WAN_TI2V_UNET,
  WAN_TI2V_VAE,
  WAN_VAE,
} from '../../server/api/comfy/wan/utils/imageToVideoWorkflow'
import { applyVideoLoraChain } from '../../server/api/comfy/utils/videoLoraChain'
import {
  promptWithLoraTriggers,
  videoLoraCompatible,
} from '../loraSelection'

const base: WanImageToVideoInput = {
  prompt: 'a cat',
  negativePrompt: 'blurry',
  firstImageName: 'a.png',
  width: 832,
  height: 480,
  duration: 5,
  frameRate: 16,
}

function nodesOfClass(wf: ComfyWorkflow, cls: string): ComfyWorkflowNode[] {
  return Object.values(wf).filter((n) => n?.class_type === cls)
}

function maybeNode(
  wf: ComfyWorkflow,
  cls: string,
): ComfyWorkflowNode | undefined {
  return nodesOfClass(wf, cls)[0]
}

function node(wf: ComfyWorkflow, cls: string): Required<ComfyWorkflowNode> {
  const found = maybeNode(wf, cls)
  assert.ok(found, `expected a ${cls} node`)
  assert.ok(found.inputs, `${cls} must carry inputs`)
  return found as Required<ComfyWorkflowNode>
}

function nodeById(wf: ComfyWorkflow, id: string): Required<ComfyWorkflowNode> {
  const found = wf[id]
  assert.ok(found?.inputs, `expected workflow node ${id}`)
  return found as Required<ComfyWorkflowNode>
}

function assertModelChain(
  wf: ComfyWorkflow,
  start: unknown,
  expectedNames: string[],
  rootId: string,
): void {
  const walked: string[] = []
  let ref = start as [string, number]

  for (let index = 0; index < expectedNames.length; index += 1) {
    assert.ok(Array.isArray(ref), 'model chain must use node references')
    const current = nodeById(wf, ref[0])
    assert.equal(current.class_type, 'LoraLoaderModelOnly')
    walked.unshift(String(current.inputs.lora_name))
    ref = current.inputs.model as [string, number]
  }

  assert.deepEqual(walked, expectedNames)
  assert.deepEqual(ref, [rootId, 0], 'LoRA chain must terminate at its base model')
}

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
  'a last-frame request must select the only graph that can do it',
)

// --- TI2V graph -------------------------------------------------------------

const ti2v = buildWanImageToVideoWorkflow(base)

assert.equal(node(ti2v, 'UNETLoader').inputs.unet_name, WAN_TI2V_UNET)
assert.equal(
  node(ti2v, 'VAELoader').inputs.vae_name,
  WAN_TI2V_VAE,
  'the 5B TI2V model is trained against the 2.2 VAE, not the 2.1 VAE',
)
assert.ok(maybeNode(ti2v, 'Wan22ImageToVideoLatent'))
assert.equal(maybeNode(ti2v, 'WanImageToVideo'), undefined)
assert.equal(maybeNode(ti2v, 'KSamplerAdvanced'), undefined)

const sampler = node(ti2v, 'KSampler')
assert.deepEqual(sampler.inputs.positive, ['positive', 0])
assert.deepEqual(sampler.inputs.negative, ['negative', 0])
assert.deepEqual(sampler.inputs.latent_image, ['latent', 0])

const latent = node(ti2v, 'Wan22ImageToVideoLatent')
assert.deepEqual(latent.inputs.start_image, ['img_first', 0])
assert.ok(!('end_image' in latent.inputs))
for (const key of ['vae', 'width', 'height', 'length', 'batch_size']) {
  assert.ok(key in latent.inputs, `Wan22ImageToVideoLatent requires ${key}`)
}

// Legacy direct-builder support remains one LoRA for backwards compatibility.
const ti2vLora = buildWanImageToVideoWorkflow({
  ...base,
  loraName: 'x.safetensors',
})
const loraNodes = nodesOfClass(ti2vLora, 'LoraLoaderModelOnly')
assert.equal(loraNodes.length, 1, 'TI2V legacy input still patches one model')
assert.deepEqual(node(ti2vLora, 'KSampler').inputs.model, ['lora', 0])

// The queue-facing adapter is the multi-LoRA path. Every selected LoRA must be
// in the sampler's model chain, in order and with independent strengths.
const wanLoras = [
  { name: 'motion-one.safetensors', strength: 0.8 },
  { name: 'motion-two.safetensors', strength: 1.15 },
  { name: 'motion-three.safetensors', strength: 0.45 },
]
const ti2vStack = buildWanImageToVideoWorkflow(base)
const appliedTi2v = applyVideoLoraChain(ti2vStack, 'wan', { loras: wanLoras })
assert.deepEqual(appliedTi2v, wanLoras)
assertModelChain(
  ti2vStack,
  node(ti2vStack, 'KSampler').inputs.model,
  wanLoras.map((lora) => lora.name),
  'unet',
)

// --- A14B graph -------------------------------------------------------------

const a14b = buildWanImageToVideoWorkflow({ ...base, mode: 'a14b' })

const unets = nodesOfClass(a14b, 'UNETLoader')
assert.equal(unets.length, 2, 'the quality mode keeps both experts')
assert.equal(node(a14b, 'VAELoader').inputs.vae_name, WAN_VAE)
assert.ok(maybeNode(a14b, 'WanImageToVideo'))
const advanced = nodesOfClass(a14b, 'KSamplerAdvanced')
assert.equal(advanced.length, 2, 'high-noise then low-noise')

const a14bLast = buildWanImageToVideoWorkflow({
  ...base,
  lastImageName: 'z.png',
})
assert.deepEqual(node(a14bLast, 'WanImageToVideo').inputs.end_image, [
  'img_last',
  0,
])

// A14B has two experts. The same ordered user stack must patch BOTH model paths.
const a14bStack = buildWanImageToVideoWorkflow({ ...base, mode: 'a14b' })
applyVideoLoraChain(a14bStack, 'wan', { loras: wanLoras })
assertModelChain(
  a14bStack,
  nodeById(a14bStack, 'sampler_high').inputs.model,
  wanLoras.map((lora) => lora.name),
  'unet_high',
)
assertModelChain(
  a14bStack,
  nodeById(a14bStack, 'sampler_low').inputs.model,
  wanLoras.map((lora) => lora.name),
  'unet_low',
)

// LTX always keeps its hidden required distilled LoRA first, then chains the
// user's style/motion stack after node 293. Both main and refinement guiders
// must read the final user-LoRA model reference.
const ltxSynthetic: ComfyWorkflow = {
  '293': {
    class_type: 'LoraLoaderModelOnly',
    inputs: {
      model: ['292', 0],
      lora_name: 'ltx-required-distilled.safetensors',
      strength_model: 0.5,
    },
    _meta: { title: 'Required Distilled LoRA' },
  },
  '315': {
    class_type: 'CFGGuider',
    inputs: { model: ['293', 0] },
  },
  ltx_refine_guider: {
    class_type: 'CFGGuider',
    inputs: { model: ['293', 0] },
  },
}
applyVideoLoraChain(ltxSynthetic, 'ltx', { loras: wanLoras })
assert.equal(
  nodeById(ltxSynthetic, '293').inputs.lora_name,
  'ltx-required-distilled.safetensors',
  'the hidden required LTX LoRA is not replaced by the user stack',
)
assertModelChain(
  ltxSynthetic,
  nodeById(ltxSynthetic, '315').inputs.model,
  wanLoras.map((lora) => lora.name),
  '293',
)
assert.deepEqual(
  nodeById(ltxSynthetic, '315').inputs.model,
  nodeById(ltxSynthetic, 'ltx_refine_guider').inputs.model,
  'main and refinement passes must use the same final styled LTX model',
)

// --- compatibility and triggers --------------------------------------------

const wanResource = {
  id: 1,
  supportedServer: 'WAN',
  defaultTrigger: 'cinematic camera orbit',
  triggerWords: 'orbit, dolly',
}
const ltxResource = { id: 2, supportedServer: 'LTX' }
const genericResource = { id: 3, supportedServer: 'GENERIC' }
assert.equal(videoLoraCompatible(wanResource, 'wan'), true)
assert.equal(videoLoraCompatible(wanResource, 'ltx'), false)
assert.equal(videoLoraCompatible(ltxResource, 'wan'), false)
assert.equal(videoLoraCompatible(genericResource, 'wan'), true)
assert.equal(videoLoraCompatible(genericResource, 'ltx'), true)

assert.equal(
  promptWithLoraTriggers(
    'A robot turns toward camera',
    [{ resourceId: 1, strength: 1 }],
    [wanResource],
  ),
  'A robot turns toward camera, cinematic camera orbit',
  'the preferred trigger is appended to the effective render prompt',
)
assert.equal(
  promptWithLoraTriggers(
    'A robot, cinematic camera orbit',
    [{ resourceId: 1, strength: 1 }],
    [wanResource],
  ),
  'A robot, cinematic camera orbit',
  'trigger decoration is idempotent',
)

console.log(
  'WAN/video LoRA contract OK: TI2V and A14B retain their graph shapes, ' +
    'ordered user LoRA stacks reach every sampler model path, LTX keeps its ' +
    'required distilled LoRA, WAN/LTX compatibility stays distinct, and ' +
    'trigger words are added idempotently.',
)
