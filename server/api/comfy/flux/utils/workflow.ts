// /server/api/comfy/flux/utils/workflow.ts
//
// Shared Flux (GGUF) workflow builder. Extracted from ../generate.post.ts so
// both the direct/relay render route and the queue-based enqueue endpoint
// (/api/art/enqueue) build the exact same Comfy graph. The direct route keeps
// the networking/polling; this module owns only the workflow shape + defaults.

export type ComfyWorkflow = Record<string, ComfyWorkflowNode>

export type ComfyWorkflowNode = {
  class_type?: string
  inputs?: Record<string, unknown>
  _meta?: Record<string, unknown>
}

export type FluxVariant = 'dev' | 'schnell'

// Flux is trained at ~1 megapixel. Rendering below that (the old 1024x512 =
// 0.5MP letterbox) is the #1 cause of cramped, distorted, low-detail output.
// Default to the native 1MP square; callers can still pass any dimensions
// (use proper 1MP buckets for other aspect ratios, e.g. 1216x832 for 3:2,
// 1344x768 for 16:9, 832x1216 for a portrait card).
export const DEFAULT_FLUX_DEV_WIDTH = 1024
export const DEFAULT_FLUX_DEV_HEIGHT = 1024
export const DEFAULT_FLUX_SCHNELL_WIDTH = 1024
export const DEFAULT_FLUX_SCHNELL_HEIGHT = 1024
export const DEFAULT_FLUX_SAMPLER = 'euler'
// `beta` resolves Flux's flow-matching noise schedule far better than the
// SD-era `normal` scheduler — crisper detail and cleaner composition.
export const DEFAULT_FLUX_SCHEDULER = 'beta'
export const DEFAULT_FLUX_DENOISE = 1

export const defaultFluxPrompt =
  'an evil magician, holding a magic wand, the magic wand creates the big words:"FLUX GGUF 🔥" appear, professional cartoon movie cover, epic scenery, eyes looking straight, ultra detailed, best movie effects, best quality, ultra professional, magic particles, colorful, midjourneyv6.1, detailmaximizer'

export const fluxModelByVariant = {
  dev: {
    unetName: 'flux1-dev-Q8_0.gguf',
    filenamePrefix: 'kindrobots_flux_dev',
    defaultSteps: 30,
    defaultCfg: 1,
    // 3.5 is Flux-dev's aesthetic sweet spot; higher (4+) starts to "burn"
    // contrast and over-bake detail on general/illustrative prompts.
    defaultGuidance: 3.5,
  },
  schnell: {
    unetName: 'flux1-schnell-Q8_0.gguf',
    filenamePrefix: 'kindrobots_flux_schnell',
    defaultSteps: 8,
    defaultCfg: 1,
    defaultGuidance: 4,
  },
} as const

export function resolveFluxSeed(seed?: number | null): number {
  if (typeof seed === 'number' && Number.isFinite(seed) && seed >= 0) {
    return Math.floor(seed)
  }

  return Math.floor(Math.random() * 1_000_000_000_000_000)
}

export function buildFluxWorkflow(input: {
  prompt: string
  negativePrompt: string
  width: number
  height: number
  steps: number
  cfg: number
  guidance: number
  seed: number
  wildcardSeed: number
  sampler: string
  scheduler: string
  denoise: number
  unetName: string
  filenamePrefix: string
}): ComfyWorkflow {
  const samplerSeed = resolveFluxSeed(input.seed)
  const wildcardSeed = resolveFluxSeed(input.wildcardSeed)
  const prompt = input.prompt.trim() || defaultFluxPrompt

  return {
    '4': {
      inputs: {
        clip_name1: 'umt5_xxl_fp8_e4m3fn_scaled.safetensors',
        clip_name2: 'clip_l.safetensors',
        type: 'flux',
        device: 'default',
      },
      class_type: 'DualCLIPLoader',
      _meta: {
        title: 'DualCLIPLoader',
      },
    },
    '6': {
      inputs: {
        width: input.width,
        height: input.height,
        batch_size: 1,
      },
      class_type: 'EmptyLatentImage',
      _meta: {
        title: 'Empty Latent Image',
      },
    },
    '7': {
      inputs: {
        samples: ['52', 0],
        vae: ['8', 0],
      },
      class_type: 'VAEDecode',
      _meta: {
        title: 'VAE Decode',
      },
    },
    '8': {
      inputs: {
        vae_name: 'ae.safetensors',
      },
      class_type: 'VAELoader',
      _meta: {
        title: 'Load VAE',
      },
    },
    '24': {
      inputs: {
        unet_name: input.unetName,
      },
      class_type: 'UnetLoaderGGUF',
      _meta: {
        title: 'Unet Loader (GGUF)',
      },
    },
    '46': {
      inputs: {
        guidance: input.guidance,
        conditioning: ['59', 2],
      },
      class_type: 'FluxGuidance',
      _meta: {
        title: 'FluxGuidance',
      },
    },
    '52': {
      inputs: {
        seed: samplerSeed,
        steps: input.steps,
        cfg: input.cfg,
        sampler_name: input.sampler,
        scheduler: input.scheduler,
        denoise: input.denoise,
        model: ['59', 0],
        positive: ['46', 0],
        negative: ['46', 0],
        latent_image: ['6', 0],
      },
      class_type: 'KSampler',
      _meta: {
        title: 'KSampler',
      },
    },
    '57': {
      inputs: {
        filename_prefix: input.filenamePrefix,
        images: ['7', 0],
      },
      class_type: 'SaveImage',
      _meta: {
        title: 'Save Image',
      },
    },
    '59': {
      inputs: {
        wildcard_text: prompt,
        populated_text: prompt,
        mode: 'populate',
        'Select to add LoRA': 'Select the LoRA to add to the text',
        'Select to add Wildcard': 'Select the Wildcard to add to the text',
        seed: wildcardSeed,
        model: ['24', 0],
        clip: ['4', 0],
      },
      class_type: 'ImpactWildcardEncode',
      _meta: {
        title: 'ImpactWildcardEncode',
      },
    },
  }
}

// Resolve variant defaults + build the workflow from a loose request shape.
// Shared by the direct route and the enqueue endpoint so both pick identical
// models, sizes, and sampling for a given variant.
export function buildFluxWorkflowFromRequest(input: {
  variant?: FluxVariant | null
  prompt?: string | null
  negativePrompt?: string | null
  width?: number | null
  height?: number | null
  steps?: number | null
  cfg?: number | null
  guidance?: number | null
  seed?: number | null
  wildcardSeed?: number | null
  sampler?: string | null
  scheduler?: string | null
  denoise?: number | null
}): { workflow: ComfyWorkflow; variant: FluxVariant } {
  const variant: FluxVariant = input.variant === 'schnell' ? 'schnell' : 'dev'
  const fluxConfig = fluxModelByVariant[variant]

  const workflow = buildFluxWorkflow({
    prompt: input.prompt?.trim() || defaultFluxPrompt,
    negativePrompt: input.negativePrompt ?? '',
    width:
      input.width ??
      (variant === 'schnell'
        ? DEFAULT_FLUX_SCHNELL_WIDTH
        : DEFAULT_FLUX_DEV_WIDTH),
    height:
      input.height ??
      (variant === 'schnell'
        ? DEFAULT_FLUX_SCHNELL_HEIGHT
        : DEFAULT_FLUX_DEV_HEIGHT),
    steps: input.steps ?? fluxConfig.defaultSteps,
    cfg: input.cfg ?? fluxConfig.defaultCfg,
    guidance: input.guidance ?? fluxConfig.defaultGuidance,
    seed: input.seed ?? -1,
    wildcardSeed: input.wildcardSeed ?? -1,
    sampler: input.sampler ?? DEFAULT_FLUX_SAMPLER,
    scheduler: input.scheduler ?? DEFAULT_FLUX_SCHEDULER,
    denoise: input.denoise ?? DEFAULT_FLUX_DENOISE,
    unetName: fluxConfig.unetName,
    filenamePrefix: fluxConfig.filenamePrefix,
  })

  return { workflow, variant }
}
