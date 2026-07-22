// /server/api/comfy/krea2/utils/workflow.ts
//
// Krea 2 Turbo (Qwen-Image lineage) workflow builder. An 8-step distilled DiT
// tuned for illustration/painting — the "extreme creativity" lane — and fast on
// a 12GB card. Stack: single CLIPLoader (type "krea2") -> Qwen3-VL encoder,
// Qwen-Image VAE, plain KSampler (no FluxGuidance). Negatives are inert at
// cfg 1 but correctly wired.
//
// VERIFY the three filenames against the ComfyUI models folders you download
// into; GGUF users flip KREA2_UNET_LOADER to 'UnetLoaderGGUF' and point
// KREA2_MODEL at the .gguf (lighter on 12GB VRAM).
import {
  buildSimpleCheckpointWorkflow,
  type ComfyWorkflow,
} from '../../utils/simpleCheckpointWorkflow'

export const KREA2_UNET_LOADER: 'UNETLoader' | 'UnetLoaderGGUF' =
  'UnetLoaderGGUF'
export const KREA2_MODEL = 'Krea-2-Turbo-Q5_K_S.gguf'
export const KREA2_CLIP = 'qwen3vl_4b_fp8_scaled.safetensors'
export const KREA2_CLIP_TYPE = 'krea2'
export const KREA2_VAE = 'qwen_image_vae.safetensors'
export const KREA2_DEFAULT_STEPS = 8
export const KREA2_DEFAULT_CFG = 1
export const KREA2_DEFAULT_SAMPLER = 'euler'
export const KREA2_DEFAULT_SCHEDULER = 'simple'
export const KREA2_DEFAULT_WIDTH = 1024
export const KREA2_DEFAULT_HEIGHT = 1024

export function buildKrea2WorkflowFromRequest(input: {
  prompt?: string | null
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
}): { workflow: ComfyWorkflow; seed: number } {
  return buildSimpleCheckpointWorkflow({
    prompt: input.prompt?.trim() || '',
    negativePrompt: input.negativePrompt ?? '',
    width: input.width ?? KREA2_DEFAULT_WIDTH,
    height: input.height ?? KREA2_DEFAULT_HEIGHT,
    steps: input.steps ?? KREA2_DEFAULT_STEPS,
    cfg: input.cfg ?? KREA2_DEFAULT_CFG,
    seed: input.seed ?? -1,
    sampler: input.sampler ?? KREA2_DEFAULT_SAMPLER,
    scheduler: input.scheduler ?? KREA2_DEFAULT_SCHEDULER,
    denoise: input.denoise ?? 1,
    unetLoader: KREA2_UNET_LOADER,
    unetName: KREA2_MODEL,
    clipName: KREA2_CLIP,
    clipType: KREA2_CLIP_TYPE,
    vaeName: KREA2_VAE,
    filenamePrefix: 'kindrobots_krea2',
    loraName: input.loraName ?? null,
    loraStrength: input.loraStrength ?? null,
  })
}
