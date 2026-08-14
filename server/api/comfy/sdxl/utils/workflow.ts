// /server/api/comfy/sdxl/utils/workflow.ts
//
// Shared default SDXL/Comfy workflow builder + patcher. Extracted from
// ../generate.post.ts so both the direct/relay render route and the
// queue-based enqueue endpoint (/api/art/enqueue) build the same Comfy graph
// and apply prompt/seed/sampler overrides identically.

export type ComfyWorkflow = Record<string, ComfyWorkflowNode>

export type ComfyWorkflowNode = {
  class_type?: string
  inputs?: Record<string, unknown>
  _meta?: Record<string, unknown>
}

export type ComfyWorkflowInput = {
  prompt: string
  cfgValue: number
  negativePrompt?: string
  seed?: number | null
  steps?: number
  checkpoint?: string | null
  sampler?: string | null
  /** Optional style LoRA, same shape the img2img builder takes. */
  loraName?: string | null
  loraStrength?: number | null
  width?: number | null
  height?: number | null
  filenamePrefix?: string | null
}

/**
 * A concrete, non-negative seed. Anything missing or negative becomes a fresh
 * random one — every Comfy lane in the repo resolves here or in its own copy of
 * this, so "unspecified seed" always means "different image", never "-1".
 */
function resolveSdxlSeed(seed?: number | null): number {
  if (typeof seed === 'number' && Number.isFinite(seed) && seed >= 0) {
    return Math.floor(seed)
  }
  return Math.floor(Math.random() * 2_147_483_647)
}

export function normalizeComfySampler(sampler?: string | null): string {
  const value = sampler?.trim()

  if (!value) return 'euler'

  const lookup: Record<string, string> = {
    'Euler a': 'euler_ancestral',
    Euler: 'euler',
    LMS: 'lms',
    Heun: 'heun',
    DPM2: 'dpm_2',
    'DPM2 a': 'dpm_2_ancestral',
    DDIM: 'ddim',
  }

  return lookup[value] || value
}

function getNodeTitle(node: ComfyWorkflowNode): string {
  const title = node._meta?.title

  return typeof title === 'string' ? title : ''
}

function assignIfKeyExists(
  inputs: Record<string, unknown>,
  key: string,
  value: unknown,
): void {
  if (key in inputs) {
    inputs[key] = value
  }
}

export function patchComfyWorkflow(
  workflow: ComfyWorkflow,
  input: ComfyWorkflowInput,
): void {
  const positiveText = input.prompt
  const negativeText = input.negativePrompt || ''
  // Resolve, don't pass -1 through. generate.post.ts calls this immediately
  // after buildDefaultComfyWorkflow with the SAME input, so a literal -1 here
  // would overwrite the random seed the builder just picked and quietly pin the
  // route to one image per Comfy install.
  const seed = resolveSdxlSeed(input.seed)
  const checkpoint = input.checkpoint || ''
  const profile = sdxlSamplerProfile(checkpoint)
  const steps = input.steps ?? profile.steps
  const cfg = input.cfgValue || profile.cfg
  const sampler = normalizeComfySampler(input.sampler)

  for (const node of Object.values(workflow)) {
    if (!node?.inputs) continue

    const classType = node.class_type || ''
    const title = getNodeTitle(node)

    if (classType === 'CheckpointLoaderSimple' && checkpoint) {
      assignIfKeyExists(node.inputs, 'ckpt_name', checkpoint)
    }

    if (classType === 'KSampler') {
      assignIfKeyExists(node.inputs, 'seed', seed)
      assignIfKeyExists(node.inputs, 'steps', steps)
      assignIfKeyExists(node.inputs, 'cfg', cfg)
      assignIfKeyExists(node.inputs, 'sampler_name', sampler)
    }

    if (classType === 'CLIPTextEncode') {
      const label = `${title} ${JSON.stringify(node.inputs)}`.toLowerCase()

      if (label.includes('negative')) {
        assignIfKeyExists(node.inputs, 'text', negativeText)
      } else if (label.includes('positive') || label.includes('prompt')) {
        assignIfKeyExists(node.inputs, 'text', positiveText)
      }
    }

    if (classType === 'CLIPTextEncodeFlux') {
      const label = `${title} ${JSON.stringify(node.inputs)}`.toLowerCase()

      if (label.includes('negative')) {
        assignIfKeyExists(node.inputs, 'clip_l', negativeText)
        assignIfKeyExists(node.inputs, 't5xxl', negativeText)
      } else {
        assignIfKeyExists(node.inputs, 'clip_l', positiveText)
        assignIfKeyExists(node.inputs, 't5xxl', positiveText)
      }
    }

    if ('noise_seed' in node.inputs) {
      node.inputs.noise_seed = seed
    }

    if ('guidance' in node.inputs) {
      node.inputs.guidance = cfg
    }

    if ('denoise' in node.inputs && typeof node.inputs.denoise !== 'number') {
      node.inputs.denoise = 1
    }
  }
}

export type SdxlImg2ImgInput = {
  prompt: string
  negativePrompt?: string | null
  imageName: string
  checkpoint?: string | null
  cfgValue?: number | null
  steps?: number | null
  seed?: number | null
  sampler?: string | null
  scheduler?: string | null
  originalWeight?: number | null
  denoise?: number | null
  loraName?: string | null
  loraStrength?: number | null
  filenamePrefix?: string | null
}

// The checkpoint used when a caller names none. This was
// 'v1-5-pruned-emaonly.safetensors' -- SD 1.5, in the SDXL builder. Not a VRAM
// problem: a caller that omitted the checkpoint silently rendered at 1.5
// quality through an SDXL graph, and nothing failed loudly enough to notice.
//
// dreamshaper XL is this system's own designated SDXL: the first entry in
// stores/seeds/validCheckpoints.ts, the example in components/model/add-model.vue,
// and confirmed present in the live Resource catalog (SDXL, isMature false).
//
// Note it is a Turbo/DPM++SDE model, trained for roughly 4-8 steps, while this
// builder's KSampler defaults to `steps ?? 20` at cfg 3. That pairing is
// tolerable but not ideal; the step default is deliberately left alone here
// because it applies to explicitly-chosen checkpoints too, and narrowing it
// would change behaviour for callers who are not using this fallback.
export const DEFAULT_SDXL_CHECKPOINT =
  'SDXL/dreamshaperXL_v21TurboDPMSDE.safetensors'

// Turbo / Lightning / Hyper / LCM checkpoints are distilled to converge in a
// handful of steps at very low guidance. Running one at 20 steps and cfg 3
// wastes most of the compute and overcooks the result; running a standard SDXL
// checkpoint at 8 steps leaves it undercooked. The right defaults are a
// property of the checkpoint, not a global.
//
// This was already half-known here: buildSdxlImg2ImgWorkflow hardcoded 8 steps
// / cfg 2 / dpmpp_sde / karras -- the exact dreamshaper Turbo DPM++SDE profile
// -- while the txt2img paths used 20 / 3. So img2img was right for turbo and
// wrong for everything else, and txt2img the reverse.
//
// Detection is by filename because that is how these variants are published and
// how they arrive in the Resource catalog (dreamshaperXL_v21TurboDPMSDE,
// RealitiesEdgeXLLIGHTNING_TURBOV7). An explicit caller value always wins --
// these set the default only.
const DISTILLED_CHECKPOINT_PATTERN = /(turbo|lightning|lcm|hyper)/i

export type SdxlSamplerProfile = {
  steps: number
  cfg: number
  sampler: string
  scheduler: string
}

export const SDXL_DISTILLED_PROFILE: SdxlSamplerProfile = {
  steps: 8,
  cfg: 2,
  sampler: 'dpmpp_sde',
  scheduler: 'karras',
}

export const SDXL_STANDARD_PROFILE: SdxlSamplerProfile = {
  steps: 20,
  cfg: 3,
  sampler: 'euler',
  scheduler: 'normal',
}

export function sdxlSamplerProfile(
  checkpoint?: string | null,
): SdxlSamplerProfile {
  return DISTILLED_CHECKPOINT_PATTERN.test(String(checkpoint || ''))
    ? SDXL_DISTILLED_PROFILE
    : SDXL_STANDARD_PROFILE
}

export const DEFAULT_SDXL_IMG2IMG_ORIGINAL_WEIGHT = 0.35
const MIN_SDXL_IMG2IMG_DENOISE = 0.15

function clampUnit(value: number): number {
  return Math.min(1, Math.max(0, value))
}

export function buildSdxlImg2ImgWorkflow(input: SdxlImg2ImgInput): {
  workflow: ComfyWorkflow
  seed: number
  denoise: number
} {
  const seed = resolveSdxlSeed(input.seed)
  // Deliberately NOT profiled by checkpoint, unlike the txt2img paths. This
  // runs at reduced denoise, so the KSampler executes steps x denoise -- the
  // low nominal count is a property of the operation, not of a distilled
  // checkpoint, and these exact numbers are pinned by
  // utils/scripts/verifyComfyOnlyGeneration.ts as this builder's contract.
  const steps = input.steps ?? 8
  const cfg = input.cfgValue || 2
  const sampler = input.sampler
    ? normalizeComfySampler(input.sampler)
    : 'dpmpp_sde'
  const scheduler = input.scheduler?.trim() || 'karras'
  const checkpoint = input.checkpoint?.trim()

  if (!checkpoint) {
    throw new Error(
      'SDXL img2img requires an explicit checkpoint Resource path; refusing to build a workflow with a stale hard-coded fallback.',
    )
  }

  const originalWeight =
    typeof input.originalWeight === 'number' &&
    Number.isFinite(input.originalWeight)
      ? clampUnit(input.originalWeight)
      : null
  const denoise =
    originalWeight !== null
      ? Math.min(1, Math.max(MIN_SDXL_IMG2IMG_DENOISE, 1 - originalWeight))
      : typeof input.denoise === 'number' && Number.isFinite(input.denoise)
        ? Math.min(1, Math.max(MIN_SDXL_IMG2IMG_DENOISE, input.denoise))
        : 1 - DEFAULT_SDXL_IMG2IMG_ORIGINAL_WEIGHT

  const loraName = input.loraName?.trim() || ''
  const loraStrength =
    typeof input.loraStrength === 'number' &&
    Number.isFinite(input.loraStrength)
      ? input.loraStrength
      : 1

  const modelSource: [string, number] = loraName ? ['10', 0] : ['1', 0]
  const clipSource: [string, number] = loraName ? ['10', 1] : ['1', 1]

  const workflow: ComfyWorkflow = {
    '1': {
      class_type: 'CheckpointLoaderSimple',
      inputs: { ckpt_name: checkpoint },
      _meta: { title: 'Load Checkpoint' },
    },
    '2': {
      class_type: 'CLIPTextEncode',
      inputs: { text: input.prompt, clip: clipSource },
      _meta: { title: 'Positive Prompt' },
    },
    '3': {
      class_type: 'CLIPTextEncode',
      inputs: { text: input.negativePrompt || '', clip: clipSource },
      _meta: { title: 'Negative Prompt' },
    },
    '4': {
      class_type: 'LoadImage',
      inputs: { image: input.imageName },
      _meta: { title: 'Load Source Image' },
    },
    '5': {
      class_type: 'VAEEncode',
      inputs: { pixels: ['4', 0], vae: ['1', 2] },
      _meta: { title: 'VAE Encode (img2img init)' },
    },
    '6': {
      class_type: 'KSampler',
      inputs: {
        seed,
        steps,
        cfg,
        sampler_name: sampler,
        scheduler,
        denoise,
        model: modelSource,
        positive: ['2', 0],
        negative: ['3', 0],
        latent_image: ['5', 0],
      },
      _meta: { title: 'KSampler' },
    },
    '7': {
      class_type: 'VAEDecode',
      inputs: { samples: ['6', 0], vae: ['1', 2] },
      _meta: { title: 'VAE Decode' },
    },
    '8': {
      class_type: 'SaveImage',
      inputs: {
        filename_prefix: input.filenamePrefix || 'kindrobots_sdxl_restyle',
        images: ['7', 0],
      },
      _meta: { title: 'Save Image' },
    },
  }

  if (loraName) {
    workflow['10'] = {
      class_type: 'LoraLoader',
      inputs: {
        model: ['1', 0],
        clip: ['1', 1],
        lora_name: loraName,
        strength_model: loraStrength,
        strength_clip: loraStrength,
      },
      _meta: { title: 'Style LoRA' },
    }
  }

  return { workflow, seed, denoise }
}

/**
 * SDXL/SD15 txt2img on a NAMED checkpoint.
 *
 * This is not the default text-to-image lane — krea2 is (see
 * server/api/art/enqueue.post.ts). Use this one only when the caller is
 * generating *for* a specific checkpoint or LoRA and the model is the point of
 * the image rather than an implementation detail: a Resource preview is the
 * whole reason it still exists. Rendering that on krea2 would show the user a
 * lovely picture of the wrong model.
 */
export function buildDefaultComfyWorkflow({
  prompt,
  negativePrompt,
  cfgValue,
  seed,
  steps,
  checkpoint,
  sampler,
  loraName,
  loraStrength,
  width,
  height,
  filenamePrefix,
}: ComfyWorkflowInput): ComfyWorkflow {
  // A literal -1 used to reach the KSampler here, unlike every sibling builder
  // (krea2, flux, kontext, sdxl-img2img) which all resolve through a
  // random-seed helper. That silently pinned this lane to one seed per Comfy
  // install: re-running a job returned the same image, and "generate another
  // preview" was a no-op you could not see was a no-op.
  const resolvedSeed = resolveSdxlSeed(seed)
  // Resolve the checkpoint BEFORE profiling it: the fallback is a Turbo model,
  // so a caller who names no checkpoint must also get turbo sampler defaults.
  // Profiling `checkpoint` directly would have left the fallback at 20 steps.
  const resolvedCheckpoint = checkpoint || DEFAULT_SDXL_CHECKPOINT
  const profile = sdxlSamplerProfile(resolvedCheckpoint)
  const style = (loraName || '').trim()
  const strength =
    typeof loraStrength === 'number' && Number.isFinite(loraStrength)
      ? loraStrength
      : 1
  // With a LoRA in the graph, model and CLIP come off the LoraLoader instead of
  // the checkpoint — same wiring as buildSdxlImg2ImgWorkflow.
  const modelSource: [string, number] = style ? ['10', 0] : ['1', 0]
  const clipSource: [string, number] = style ? ['10', 1] : ['1', 1]

  const workflow: ComfyWorkflow = {
    '1': {
      class_type: 'CheckpointLoaderSimple',
      inputs: {
        ckpt_name: resolvedCheckpoint,
      },
    },
    '2': {
      class_type: 'CLIPTextEncode',
      inputs: {
        text: prompt,
        clip: clipSource,
      },
      _meta: {
        title: 'Positive Prompt',
      },
    },
    '3': {
      class_type: 'CLIPTextEncode',
      inputs: {
        text: negativePrompt || '',
        clip: clipSource,
      },
      _meta: {
        title: 'Negative Prompt',
      },
    },
    '4': {
      class_type: 'EmptyLatentImage',
      inputs: {
        width: width ?? 1024,
        height: height ?? 1024,
        batch_size: 1,
      },
    },
    '5': {
      class_type: 'KSampler',
      inputs: {
        seed: resolvedSeed,
        steps: steps ?? profile.steps,
        cfg: cfgValue || profile.cfg,
        sampler_name: sampler
          ? normalizeComfySampler(sampler)
          : profile.sampler,
        scheduler: profile.scheduler,
        denoise: 1,
        model: modelSource,
        positive: ['2', 0],
        negative: ['3', 0],
        latent_image: ['4', 0],
      },
    },
    '6': {
      class_type: 'VAEDecode',
      inputs: {
        samples: ['5', 0],
        vae: ['1', 2],
      },
    },
    '7': {
      class_type: 'SaveImage',
      inputs: {
        filename_prefix: filenamePrefix || 'kindrobots',
        images: ['6', 0],
      },
    },
  }

  if (style) {
    workflow['10'] = {
      class_type: 'LoraLoader',
      inputs: {
        model: ['1', 0],
        clip: ['1', 1],
        lora_name: style,
        strength_model: strength,
        strength_clip: strength,
      },
      _meta: { title: 'Style LoRA' },
    }
  }

  return workflow
}
