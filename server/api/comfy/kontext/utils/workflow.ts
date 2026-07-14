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
  // How much of the ORIGINAL photo to preserve, 0..1. 0 = full reimagine from
  // an empty latent (the legacy Kontext behavior); higher values initialise the
  // sampler from the encoded source photo at a reduced denoise, so the person's
  // face, body, and background survive — this is the "weight from the original
  // picture" control. It also makes the output follow the source's aspect ratio
  // instead of a forced 1024x1024 square. Ignored (treated as full denoise) when
  // a mask is supplied, where the mask alone decides what changes.
  originalWeight?: number | null
  // Optional real negative prompt. When set, the graph swaps BasicGuider for
  // CFGGuider (cfg > 1) so the negative actually constrains the result — Flux
  // ignores negatives on the default cfg=1 path. Left empty keeps the cheaper
  // single-pass BasicGuider path unchanged.
  negativePrompt?: string | null
  cfg?: number | null
  // Optional hair/region mask (uploaded as a separate input image, white =
  // change, black = keep). When set, only the masked region is repainted via
  // SetLatentNoiseMask over the source-init latent — everything else is locked
  // to the original. Core ComfyUI nodes only (LoadImageMask/SetLatentNoiseMask).
  maskName?: string | null
}

export const DEFAULT_KONTEXT_WIDTH = 1024
export const DEFAULT_KONTEXT_HEIGHT = 1024
export const DEFAULT_KONTEXT_STEPS = 20
export const DEFAULT_KONTEXT_GUIDANCE = 2.5
export const DEFAULT_KONTEXT_SAMPLER = 'res_multistep'
export const DEFAULT_KONTEXT_SCHEDULER = 'sgm_uniform'
export const DEFAULT_KONTEXT_DENOISE = 1
// cfg used only on the CFGGuider (real-negative) path; the default BasicGuider
// path is effectively cfg=1. Flux stays coherent at a low positive cfg.
export const DEFAULT_KONTEXT_CFG = 2.5
// Minimum denoise floor so a very high originalWeight still leaves the model
// enough budget to actually apply the requested change.
const MIN_IMG2IMG_DENOISE = 0.15

function resolveSeed(seed?: number | null): number {
  if (typeof seed === 'number' && Number.isFinite(seed) && seed >= 0) {
    return Math.floor(seed)
  }

  return Math.floor(Math.random() * 1_000_000_000_000_000)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function buildKontextWorkflow(
  input: KontextWorkflowInput,
): ComfyWorkflow {
  const width = input.width ?? DEFAULT_KONTEXT_WIDTH
  const height = input.height ?? DEFAULT_KONTEXT_HEIGHT
  const seed = resolveSeed(input.seed)

  const negativePrompt = input.negativePrompt?.trim() || ''
  const useNegative = negativePrompt.length > 0
  const maskName = input.maskName?.trim() || ''
  const useMask = maskName.length > 0
  const originalWeight =
    typeof input.originalWeight === 'number' && Number.isFinite(input.originalWeight)
      ? clamp(input.originalWeight, 0, 1)
      : 0
  // Init from the encoded source when preserving the original or when masking
  // (a mask needs a base latent to protect). Otherwise start from empty latent.
  const useImg2Img = originalWeight > 0 || useMask

  // With an img2img init, denoise sets how much of the original survives:
  // denoise = 1 - originalWeight (floored). Masking with no weight keeps full
  // denoise so the masked region is fully restyled while the rest is locked.
  const denoise = useImg2Img
    ? originalWeight > 0
      ? clamp(1 - originalWeight, MIN_IMG2IMG_DENOISE, 1)
      : (input.denoise ?? DEFAULT_KONTEXT_DENOISE)
    : (input.denoise ?? DEFAULT_KONTEXT_DENOISE)

  const workflow: ComfyWorkflow = {
    '6': {
      inputs: { text: input.prompt, clip: ['11', 0] },
      class_type: 'CLIPTextEncode',
      _meta: { title: 'CLIP Text Encode (Positive Prompt)' },
    },
    '8': {
      inputs: { samples: ['13', 0], vae: ['10', 0] },
      class_type: 'VAEDecode',
      _meta: { title: 'VAE Decode' },
    },
    '9': {
      inputs: {
        filename_prefix: input.filenamePrefix || 'kindrobots_kontext_queue',
        images: ['8', 0],
      },
      class_type: 'SaveImage',
      _meta: { title: 'Save Image' },
    },
    '10': {
      inputs: { vae_name: 'ae.safetensors' },
      class_type: 'VAELoader',
      _meta: { title: 'Load VAE' },
    },
    '11': {
      inputs: {
        clip_name1: 't5xxl_fp8_e4m3fn_scaled.safetensors',
        clip_name2: 'clip_l.safetensors',
        type: 'flux',
        device: 'default',
      },
      class_type: 'DualCLIPLoader',
      _meta: { title: 'DualCLIPLoader' },
    },
    '13': {
      inputs: {
        noise: ['25', 0],
        guider: ['22', 0],
        sampler: ['60', 0],
        sigmas: ['17', 0],
        // latent_image is patched below depending on img2img/mask.
        latent_image: ['27', 0],
      },
      class_type: 'SamplerCustomAdvanced',
      _meta: { title: 'SamplerCustomAdvanced' },
    },
    '16': {
      inputs: { sampler_name: input.sampler ?? DEFAULT_KONTEXT_SAMPLER },
      class_type: 'KSamplerSelect',
      _meta: { title: 'KSamplerSelect' },
    },
    '17': {
      inputs: {
        scheduler: input.scheduler ?? DEFAULT_KONTEXT_SCHEDULER,
        steps: input.steps ?? DEFAULT_KONTEXT_STEPS,
        denoise,
        model: ['30', 0],
      },
      class_type: 'BasicScheduler',
      _meta: { title: 'BasicScheduler' },
    },
    // 22 is the guider — BasicGuider by default; replaced with CFGGuider below
    // when a real negative prompt is supplied.
    '22': {
      inputs: { model: ['30', 0], conditioning: ['42', 0] },
      class_type: 'BasicGuider',
      _meta: { title: 'BasicGuider' },
    },
    '25': {
      inputs: { noise_seed: seed },
      class_type: 'RandomNoise',
      _meta: { title: 'RandomNoise' },
    },
    '26': {
      inputs: {
        guidance: input.guidance ?? DEFAULT_KONTEXT_GUIDANCE,
        conditioning: ['6', 0],
      },
      class_type: 'FluxGuidance',
      _meta: { title: 'FluxGuidance' },
    },
    '27': {
      inputs: { width, height, batch_size: 1 },
      class_type: 'EmptySD3LatentImage',
      _meta: { title: 'EmptySD3LatentImage' },
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
      _meta: { title: 'ModelSamplingFlux' },
    },
    '39': {
      inputs: { pixels: ['40', 0], vae: ['10', 0] },
      class_type: 'VAEEncode',
      _meta: { title: 'VAE Encode' },
    },
    '40': {
      inputs: { image: ['41', 0] },
      class_type: 'FluxKontextImageScale',
      _meta: { title: 'FluxKontextImageScale' },
    },
    '41': {
      inputs: { image: input.imageName },
      class_type: 'LoadImage',
      _meta: { title: 'Load Image' },
    },
    '42': {
      inputs: { conditioning: ['26', 0], latent: ['39', 0] },
      class_type: 'ReferenceLatent',
      _meta: { title: 'ReferenceLatent' },
    },
    '59': {
      inputs: { unet_name: 'flux1-kontext-dev-Q5_K_M.gguf' },
      class_type: 'UnetLoaderGGUF',
      _meta: { title: 'Unet Loader (GGUF)' },
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
      _meta: { title: 'Detail Daemon Sampler' },
    },
  }

  // --- img2img init: start from the encoded source photo (node 39) so the
  //     person and framing survive, instead of the empty latent (node 27). ---
  let latentRef: [string, number] = useImg2Img ? ['39', 0] : ['27', 0]

  // --- optional hair/region mask: only the white area of the mask is denoised,
  //     the rest is locked to the source latent. ---
  if (useMask) {
    workflow['70'] = {
      inputs: { image: maskName, channel: 'red' },
      class_type: 'LoadImageMask',
      _meta: { title: 'Load Hair Mask' },
    }
    workflow['71'] = {
      inputs: { samples: ['39', 0], mask: ['70', 0] },
      class_type: 'SetLatentNoiseMask',
      _meta: { title: 'Set Latent Noise Mask (hair only)' },
    }
    latentRef = ['71', 0]
  }

  ;(workflow['13']!.inputs as Record<string, unknown>).latent_image = latentRef

  // --- real negative prompt via CFGGuider (Flux ignores negatives at cfg=1) ---
  if (useNegative) {
    workflow['7'] = {
      inputs: { text: negativePrompt, clip: ['11', 0] },
      class_type: 'CLIPTextEncode',
      _meta: { title: 'CLIP Text Encode (Negative Prompt)' },
    }
    workflow['22'] = {
      inputs: {
        model: ['30', 0],
        positive: ['42', 0],
        negative: ['7', 0],
        cfg: input.cfg ?? DEFAULT_KONTEXT_CFG,
      },
      class_type: 'CFGGuider',
      _meta: { title: 'CFGGuider' },
    }
  }

  return workflow
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
