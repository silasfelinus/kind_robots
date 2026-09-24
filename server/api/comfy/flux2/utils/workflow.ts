// /server/api/comfy/flux2/utils/workflow.ts
//
// Flux.2 Klein 4B workflow builder. Apache-2.0 (clean for the storefront),
// 4-step, <12GB, and takes JSON structured prompts that bind compositions far
// more faithfully than a run-on sentence — the fix for renders that "veer off".
// Pass `jsonPrompt` (an object/array) and it is serialized into the positive
// text encode; otherwise the plain prompt string is used. Flux.2 uses its OWN
// text encoder and VAE (different from Flux.1).
//
// MODEL FILENAMES, corrected 2026-08-24 (kind-robots/t-070, cthulhuquarium/t-033).
// These previously read `flux-2-klein-4b-Q4_K_M.gguf` and
// `flux2_klein_text_encoder_fp8_scaled.safetensors`, neither of which exists in any
// Comfy-Org release or on the render box -- so this engine had never once run. The
// comment above them said to verify the names against the release; nobody did, and the
// only failure signal was a ComfyUI error at render time months later.
//
// Now pointed at the Flux 2 stack that IS registered as a Resource and present on the
// box: flux2_dev_fp8mixed (diffusion_models/), mistral_3_small_flux2_bf16
// (text_encoders/) and flux2-vae (vae/). The unet is a .safetensors, so the loader
// moves off UnetLoaderGGUF.
//
// NOT YET RUN END TO END: mistral_3_small_flux2_bf16 is 35.5 GB against a 12 GB card.
// ComfyUI can offload a text encoder to CPU, but that needs a real render to confirm.
// If it will not fit, register Comfy-Org's mistral_3_small_flux2_fp8 and change the one
// name here -- do not invent a filename, which is how this broke the first time.
import {
  buildSimpleCheckpointWorkflow,
  type ComfyWorkflow,
} from '../../utils/simpleCheckpointWorkflow'
import {
  appendModelOnlyLoraChain,
  normalizeLoraSelections,
  type LoraSelectionInput,
} from '../../utils/loraChain'

export const FLUX2_KLEIN_UNET_LOADER: 'UNETLoader' | 'UnetLoaderGGUF' =
  'UNETLoader'
export const FLUX2_KLEIN_MODEL = 'flux2_dev_fp8mixed.safetensors'
export const FLUX2_KLEIN_CLIP = 'mistral_3_small_flux2_bf16.safetensors'
export const FLUX2_KLEIN_CLIP_TYPE = 'flux2'
export const FLUX2_KLEIN_VAE = 'flux2-vae.safetensors'
export const FLUX2_KLEIN_DEFAULT_STEPS = 4
export const FLUX2_KLEIN_DEFAULT_CFG = 1
export const FLUX2_KLEIN_DEFAULT_SAMPLER = 'euler'
export const FLUX2_KLEIN_DEFAULT_SCHEDULER = 'simple'
export const FLUX2_KLEIN_DEFAULT_WIDTH = 1024
export const FLUX2_KLEIN_DEFAULT_HEIGHT = 1024

function flux2Prompt(input: {
  prompt?: string | null
  jsonPrompt?: Record<string, unknown> | unknown[] | null
}): string {
  const hasJson =
    input.jsonPrompt &&
    (Array.isArray(input.jsonPrompt)
      ? input.jsonPrompt.length > 0
      : Object.keys(input.jsonPrompt).length > 0)
  return hasJson
    ? JSON.stringify(input.jsonPrompt)
    : input.prompt?.trim() || ''
}

/**
 * FLUX.2 source-image edit graph, following ComfyUI's official ReferenceLatent
 * workflow shape: the picture conditions both positive and negative branches
 * while generation starts from a Flux.2 latent matching the scaled source.
 */
export function buildFlux2KleinEditWorkflowFromRequest(input: {
  prompt?: string | null
  jsonPrompt?: Record<string, unknown> | unknown[] | null
  negativePrompt?: string | null
  imageName: string
  steps?: number | null
  cfg?: number | null
  seed?: number | null
  sampler?: string | null
  loraName?: string | null
  loraStrength?: number | null
  loras?: LoraSelectionInput[] | null
}): { workflow: ComfyWorkflow; seed: number } {
  const seed =
    typeof input.seed === 'number' &&
    Number.isFinite(input.seed) &&
    input.seed >= 0
      ? Math.floor(input.seed)
      : Math.floor(Math.random() * 2_147_483_647)
  const prompt = flux2Prompt(input)
  const imageName = input.imageName.trim()
  if (!imageName) throw new Error('FLUX.2 image editing requires an imageName.')

  const workflow: ComfyWorkflow = {
    '1': {
      inputs: {
        unet_name: FLUX2_KLEIN_MODEL,
        weight_dtype: 'default',
      },
      class_type: FLUX2_KLEIN_UNET_LOADER,
      _meta: { title: 'Load Diffusion Model' },
    },
    '2': {
      inputs: {
        clip_name: FLUX2_KLEIN_CLIP,
        type: FLUX2_KLEIN_CLIP_TYPE,
        device: 'default',
      },
      class_type: 'CLIPLoader',
      _meta: { title: 'Load CLIP' },
    },
    '3': {
      inputs: { text: prompt, clip: ['2', 0] },
      class_type: 'CLIPTextEncode',
      _meta: { title: 'Positive Prompt' },
    },
    '4': {
      inputs: { text: input.negativePrompt ?? '', clip: ['2', 0] },
      class_type: 'CLIPTextEncode',
      _meta: { title: 'Negative Prompt' },
    },
    '5': {
      inputs: { vae_name: FLUX2_KLEIN_VAE },
      class_type: 'VAELoader',
      _meta: { title: 'Load VAE' },
    },
    '6': {
      inputs: { image: imageName },
      class_type: 'LoadImage',
      _meta: { title: 'Load Source Image' },
    },
    '7': {
      inputs: {
        image: ['6', 0],
        upscale_method: 'nearest-exact',
        megapixels: 1,
        resolution_steps: 1,
      },
      class_type: 'ImageScaleToTotalPixels',
      _meta: { title: 'Scale Source Image' },
    },
    '8': {
      inputs: { pixels: ['7', 0], vae: ['5', 0] },
      class_type: 'VAEEncode',
      _meta: { title: 'Encode Source Image' },
    },
    '9': {
      inputs: { conditioning: ['3', 0], latent: ['8', 0] },
      class_type: 'ReferenceLatent',
      _meta: { title: 'Positive Reference' },
    },
    '10': {
      inputs: { conditioning: ['4', 0], latent: ['8', 0] },
      class_type: 'ReferenceLatent',
      _meta: { title: 'Negative Reference' },
    },
    '11': {
      inputs: { image: ['7', 0] },
      class_type: 'GetImageSize',
      _meta: { title: 'Source Image Size' },
    },
    '12': {
      inputs: {
        width: ['11', 0],
        height: ['11', 1],
        batch_size: 1,
      },
      class_type: 'EmptyFlux2LatentImage',
      _meta: { title: 'Empty Flux.2 Latent' },
    },
    '13': {
      inputs: {
        steps: input.steps ?? FLUX2_KLEIN_DEFAULT_STEPS,
        width: ['11', 0],
        height: ['11', 1],
      },
      class_type: 'Flux2Scheduler',
      _meta: { title: 'Flux.2 Scheduler' },
    },
    '14': {
      inputs: {
        model: ['1', 0],
        positive: ['9', 0],
        negative: ['10', 0],
        cfg: input.cfg ?? FLUX2_KLEIN_DEFAULT_CFG,
      },
      class_type: 'CFGGuider',
      _meta: { title: 'CFG Guider' },
    },
    '15': {
      inputs: { sampler_name: input.sampler ?? FLUX2_KLEIN_DEFAULT_SAMPLER },
      class_type: 'KSamplerSelect',
      _meta: { title: 'Sampler' },
    },
    '16': {
      inputs: { noise_seed: seed },
      class_type: 'RandomNoise',
      _meta: { title: 'Random Noise' },
    },
    '17': {
      inputs: {
        noise: ['16', 0],
        guider: ['14', 0],
        sampler: ['15', 0],
        sigmas: ['13', 0],
        latent_image: ['12', 0],
      },
      class_type: 'SamplerCustomAdvanced',
      _meta: { title: 'Sampler' },
    },
    '18': {
      inputs: { samples: ['17', 0], vae: ['5', 0] },
      class_type: 'VAEDecode',
      _meta: { title: 'Decode' },
    },
    '19': {
      inputs: {
        filename_prefix: 'kindrobots_flux2_klein_edit',
        images: ['18', 0],
      },
      class_type: 'SaveImage',
      _meta: { title: 'Save Image' },
    },
  }

  const loras = normalizeLoraSelections(input)
  if (loras.length) {
    const model = appendModelOnlyLoraChain(workflow, {
      loras,
      model: ['1', 0],
      startId: 20,
    })
    ;(workflow['14']!.inputs as Record<string, unknown>).model = model
  }

  return { workflow, seed }
}

export function buildFlux2KleinWorkflowFromRequest(input: {
  prompt?: string | null
  jsonPrompt?: Record<string, unknown> | unknown[] | null
  negativePrompt?: string | null
  width?: number | null
  height?: number | null
  steps?: number | null
  cfg?: number | null
  seed?: number | null
  sampler?: string | null
  scheduler?: string | null
  denoise?: number | null
  loraName?: string | null
  loraStrength?: number | null
  loras?: LoraSelectionInput[] | null
}): { workflow: ComfyWorkflow; seed: number } {
  const prompt = flux2Prompt(input)

  return buildSimpleCheckpointWorkflow({
    prompt,
    negativePrompt: input.negativePrompt ?? '',
    width: input.width ?? FLUX2_KLEIN_DEFAULT_WIDTH,
    height: input.height ?? FLUX2_KLEIN_DEFAULT_HEIGHT,
    steps: input.steps ?? FLUX2_KLEIN_DEFAULT_STEPS,
    cfg: input.cfg ?? FLUX2_KLEIN_DEFAULT_CFG,
    seed: input.seed ?? -1,
    sampler: input.sampler ?? FLUX2_KLEIN_DEFAULT_SAMPLER,
    scheduler: input.scheduler ?? FLUX2_KLEIN_DEFAULT_SCHEDULER,
    denoise: input.denoise ?? 1,
    unetLoader: FLUX2_KLEIN_UNET_LOADER,
    unetName: FLUX2_KLEIN_MODEL,
    clipName: FLUX2_KLEIN_CLIP,
    clipType: FLUX2_KLEIN_CLIP_TYPE,
    vaeName: FLUX2_KLEIN_VAE,
    filenamePrefix: 'kindrobots_flux2_klein',
    loraName: input.loraName ?? null,
    loraStrength: input.loraStrength ?? null,
    loras: input.loras ?? null,
  })
}
