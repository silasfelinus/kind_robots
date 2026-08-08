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
  const seed = input.seed ?? -1
  const steps = input.steps ?? 20
  const cfg = input.cfgValue || 3
  const sampler = normalizeComfySampler(input.sampler)
  const checkpoint = input.checkpoint || ''

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

export const DEFAULT_SDXL_IMG2IMG_ORIGINAL_WEIGHT = 0.35
const MIN_SDXL_IMG2IMG_DENOISE = 0.15

function resolveSdxlSeed(seed?: number | null): number {
  if (typeof seed === 'number' && Number.isFinite(seed) && seed >= 0) {
    return Math.floor(seed)
  }
  return Math.floor(Math.random() * 2_147_483_647)
}

function clampUnit(value: number): number {
  return Math.min(1, Math.max(0, value))
}

export function buildSdxlImg2ImgWorkflow(input: SdxlImg2ImgInput): {
  workflow: ComfyWorkflow
  seed: number
  denoise: number
} {
  const seed = resolveSdxlSeed(input.seed)
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
    typeof input.loraStrength === 'number' && Number.isFinite(input.loraStrength)
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

export function buildDefaultComfyWorkflow({
  prompt,
  negativePrompt,
  cfgValue,
  seed,
  steps,
  checkpoint,
  sampler,
}: ComfyWorkflowInput): ComfyWorkflow {
  return {
    '1': {
      class_type: 'CheckpointLoaderSimple',
      inputs: {
        ckpt_name: checkpoint || 'v1-5-pruned-emaonly.safetensors',
      },
    },
    '2': {
      class_type: 'CLIPTextEncode',
      inputs: {
        text: prompt,
        clip: ['1', 1],
      },
      _meta: {
        title: 'Positive Prompt',
      },
    },
    '3': {
      class_type: 'CLIPTextEncode',
      inputs: {
        text: negativePrompt || '',
        clip: ['1', 1],
      },
      _meta: {
        title: 'Negative Prompt',
      },
    },
    '4': {
      class_type: 'EmptyLatentImage',
      inputs: {
        width: 1024,
        height: 1024,
        batch_size: 1,
      },
    },
    '5': {
      class_type: 'KSampler',
      inputs: {
        seed: seed ?? -1,
        steps: steps ?? 20,
        cfg: cfgValue || 3,
        sampler_name: normalizeComfySampler(sampler),
        scheduler: 'normal',
        denoise: 1,
        model: ['1', 0],
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
        filename_prefix: 'kindrobots',
        images: ['6', 0],
      },
    },
  }
}
