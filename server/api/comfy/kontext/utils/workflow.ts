// /server/api/comfy/kontext/utils/workflow.ts
//
// Shared Flux Kontext workflow builder for the queue-based generation path.
// Mirrors the graph in ../generate.post.ts (kept private there); the direct
// route and this builder should be deduped in a later pass.

export type ComfyWorkflow = Record<string, ComfyWorkflowNode>

export type ComfyWorkflowNode = {
  class_type?: string
  inputs?: Record<string, unknown>
  _meta?: Record<string, unknown>
}

export type KontextWorkflowInput = {
  prompt: string
  imageName: string
  width?: number | null
  height?: number | null
  steps?: number | null
  guidance?: number | null
  seed?: number | null
  sampler?: string | null
  scheduler?: string | null
  denoise?: number | null
  filenamePrefix?: string | null
}

export const DEFAULT_KONTEXT_WIDTH = 1024
export const DEFAULT_KONTEXT_HEIGHT = 1024
export const DEFAULT_KONTEXT_STEPS = 20
export const DEFAULT_KONTEXT_GUIDANCE = 2.5
export const DEFAULT_KONTEXT_SAMPLER = 'res_multistep'
export const DEFAULT_KONTEXT_SCHEDULER = 'sgm_uniform'
export const DEFAULT_KONTEXT_DENOISE = 1

function resolveSeed(seed?: number | null): number {
  if (typeof seed === 'number' && Number.isFinite(seed) && seed >= 0) {
    return Math.floor(seed)
  }

  return Math.floor(Math.random() * 1_000_000_000_000_000)
}

export function buildKontextWorkflow(
  input: KontextWorkflowInput,
): ComfyWorkflow {
  const width = input.width ?? DEFAULT_KONTEXT_WIDTH
  const height = input.height ?? DEFAULT_KONTEXT_HEIGHT
  const seed = resolveSeed(input.seed)

  return {
    '6': {
      inputs: {
        text: input.prompt,
        clip: ['11', 0],
      },
      class_type: 'CLIPTextEncode',
      _meta: {
        title: 'CLIP Text Encode (Positive Prompt)',
      },
    },
    '8': {
      inputs: {
        samples: ['13', 0],
        vae: ['10', 0],
      },
      class_type: 'VAEDecode',
      _meta: {
        title: 'VAE Decode',
      },
    },
    '9': {
      inputs: {
        filename_prefix: input.filenamePrefix || 'kindrobots_kontext_queue',
        images: ['8', 0],
      },
      class_type: 'SaveImage',
      _meta: {
        title: 'Save Image',
      },
    },
    '10': {
      inputs: {
        vae_name: 'ae.safetensors',
      },
      class_type: 'VAELoader',
      _meta: {
        title: 'Load VAE',
      },
    },
    '11': {
      inputs: {
        clip_name1: 't5xxl_fp8_e4m3fn_scaled.safetensors',
        clip_name2: 'clip_l.safetensors',
        type: 'flux',
        device: 'default',
      },
      class_type: 'DualCLIPLoader',
      _meta: {
        title: 'DualCLIPLoader',
      },
    },
    '13': {
      inputs: {
        noise: ['25', 0],
        guider: ['22', 0],
        sampler: ['60', 0],
        sigmas: ['17', 0],
        latent_image: ['27', 0],
      },
      class_type: 'SamplerCustomAdvanced',
      _meta: {
        title: 'SamplerCustomAdvanced',
      },
    },
    '16': {
      inputs: {
        sampler_name: input.sampler ?? DEFAULT_KONTEXT_SAMPLER,
      },
      class_type: 'KSamplerSelect',
      _meta: {
        title: 'KSamplerSelect',
      },
    },
    '17': {
      inputs: {
        scheduler: input.scheduler ?? DEFAULT_KONTEXT_SCHEDULER,
        steps: input.steps ?? DEFAULT_KONTEXT_STEPS,
        denoise: input.denoise ?? DEFAULT_KONTEXT_DENOISE,
        model: ['30', 0],
      },
      class_type: 'BasicScheduler',
      _meta: {
        title: 'BasicScheduler',
      },
    },
    '22': {
      inputs: {
        model: ['30', 0],
        conditioning: ['42', 0],
      },
      class_type: 'BasicGuider',
      _meta: {
        title: 'BasicGuider',
      },
    },
    '25': {
      inputs: {
        noise_seed: seed,
      },
      class_type: 'RandomNoise',
      _meta: {
        title: 'RandomNoise',
      },
    },
    '26': {
      inputs: {
        guidance: input.guidance ?? DEFAULT_KONTEXT_GUIDANCE,
        conditioning: ['6', 0],
      },
      class_type: 'FluxGuidance',
      _meta: {
        title: 'FluxGuidance',
      },
    },
    '27': {
      inputs: {
        width,
        height,
        batch_size: 1,
      },
      class_type: 'EmptySD3LatentImage',
      _meta: {
        title: 'EmptySD3LatentImage',
      },
    },
    '30': {
      inputs: {
        max_shift: 1.15,
        base_shift: 0.5,
        width,
        height,
        model: ['59', 0],
      },
      class_type: 'ModelSamplingFlux',
      _meta: {
        title: 'ModelSamplingFlux',
      },
    },
    '39': {
      inputs: {
        pixels: ['40', 0],
        vae: ['10', 0],
      },
      class_type: 'VAEEncode',
      _meta: {
        title: 'VAE Encode',
      },
    },
    '40': {
      inputs: {
        image: ['41', 0],
      },
      class_type: 'FluxKontextImageScale',
      _meta: {
        title: 'FluxKontextImageScale',
      },
    },
    '41': {
      inputs: {
        image: input.imageName,
      },
      class_type: 'LoadImage',
      _meta: {
        title: 'Load Image',
      },
    },
    '42': {
      inputs: {
        conditioning: ['26', 0],
        latent: ['39', 0],
      },
      class_type: 'ReferenceLatent',
      _meta: {
        title: 'ReferenceLatent',
      },
    },
    '59': {
      inputs: {
        unet_name: 'flux1-kontext-dev-Q5_K_M.gguf',
      },
      class_type: 'UnetLoaderGGUF',
      _meta: {
        title: 'Unet Loader (GGUF)',
      },
    },
    '60': {
      inputs: {
        detail_amount: 0.06,
        start: 0.3,
        end: 0.7,
        bias: 0.5,
        exponent: 1,
        start_offset: 0,
        end_offset: 0,
        fade: 0,
        smooth: true,
        cfg_scale_override: 0,
        sampler: ['16', 0],
      },
      class_type: 'DetailDaemonSamplerNode',
      _meta: {
        title: 'Detail Daemon Sampler',
      },
    },
  }
}

export function getKontextImageExtension(imageData: string): string {
  const match = imageData
    .trim()
    .match(/^data:image\/([a-zA-Z0-9.+-]+);base64,/)
  const subtype = (match?.[1] || 'png').toLowerCase()

  if (subtype.includes('jpeg') || subtype.includes('jpg')) return 'jpg'
  if (subtype.includes('webp')) return 'webp'

  return 'png'
}
