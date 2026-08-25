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
import type { LoraSelectionInput } from '../../utils/loraChain'

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
  const hasJson =
    input.jsonPrompt &&
    (Array.isArray(input.jsonPrompt)
      ? input.jsonPrompt.length > 0
      : Object.keys(input.jsonPrompt).length > 0)
  const prompt = hasJson
    ? JSON.stringify(input.jsonPrompt)
    : input.prompt?.trim() || ''

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
