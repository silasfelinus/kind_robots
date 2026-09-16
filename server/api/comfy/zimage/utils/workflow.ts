// /server/api/comfy/zimage/utils/workflow.ts
//
// Z-Image Turbo text-to-image, transcribed from the ComfyUI template Silas
// exported on 2026-09-16 ("Text to Image (Z-Image-Turbo)", comfy-core 0.3.73).
//
// Z-Image is NOT an SD-lineage checkpoint and cannot run through the ordinary
// comfy lane. ArtJob 25378 proved it: CheckpointLoaderSimple loaded the file
// and CLIPTextEncode then failed with "clip input is invalid: None", because
// Z-Image ships its text encoder separately instead of bundling one. The three
// weights load independently here -- UNETLoader, CLIPLoader, VAELoader.
//
// Three details in the template are easy to get wrong and are load-bearing:
//   - CLIPLoader needs type 'lumina2'. The encoder is Qwen3-4B, not CLIP.
//   - There is NO negative prompt. The positive conditioning is passed through
//     ConditioningZeroOut to make the negative, so a caller's negativePrompt
//     has nowhere to go and is deliberately ignored.
//   - The latent is EmptySD3LatentImage, and the model passes through
//     ModelSamplingAuraFlow (shift 3) before sampling.
import {
  appendModelOnlyLoraChain,
  normalizeLoraSelections,
  type LoraSelectionInput,
} from '../../utils/loraChain'

export const ZIMAGE_UNET_NAME = 'z_image_turbo_bf16.safetensors'
export const ZIMAGE_CLIP_NAME = 'qwen_3_4b.safetensors'
export const ZIMAGE_CLIP_TYPE = 'lumina2'
export const ZIMAGE_VAE_NAME = 'ae.safetensors'

/*
 * Turbo is distilled: it samples in 8 steps at cfg 1 and leaves its trained
 * distribution if pushed higher, the same way krea2 and the Lightning
 * checkpoints do. These are the template's own values, not guesses.
 */
export const ZIMAGE_DEFAULT_STEPS = 8
export const ZIMAGE_CFG = 1
export const ZIMAGE_SAMPLER = 'res_multistep'
export const ZIMAGE_SCHEDULER = 'simple'
export const ZIMAGE_SHIFT = 3
export const ZIMAGE_MAX_STEPS = 12
export const ZIMAGE_DEFAULT_WIDTH = 1024
export const ZIMAGE_DEFAULT_HEIGHT = 1024

export type ZImageWorkflowNode = {
  inputs: Record<string, unknown>
  class_type: string
  _meta?: Record<string, unknown>
}

export type ZImageWorkflow = Record<string, ZImageWorkflowNode>

export function resolveZImageSeed(seed?: number | null): number {
  if (typeof seed === 'number' && Number.isFinite(seed) && seed >= 0) {
    return Math.floor(seed)
  }
  return Math.floor(Math.random() * 2_147_483_647)
}

function positiveInt(value: unknown, fallback: number): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric > 0
    ? Math.floor(numeric)
    : fallback
}

export function buildZImageWorkflowFromRequest(input: {
  prompt?: string | null
  width?: number | null
  height?: number | null
  steps?: number | null
  seed?: number | null
  loraName?: string | null
  loraStrength?: number | null
  loras?: LoraSelectionInput[] | null
  filenamePrefix?: string | null
}): { workflow: ZImageWorkflow; seed: number; steps: number } {
  const seed = resolveZImageSeed(input.seed)
  const steps = Math.min(
    positiveInt(input.steps, ZIMAGE_DEFAULT_STEPS),
    ZIMAGE_MAX_STEPS,
  )
  const width = positiveInt(input.width, ZIMAGE_DEFAULT_WIDTH)
  const height = positiveInt(input.height, ZIMAGE_DEFAULT_HEIGHT)
  const prompt = String(input.prompt || '').trim()

  const workflow: ZImageWorkflow = {
    '1': {
      class_type: 'UNETLoader',
      inputs: { unet_name: ZIMAGE_UNET_NAME, weight_dtype: 'default' },
    },
    '2': {
      class_type: 'CLIPLoader',
      inputs: {
        clip_name: ZIMAGE_CLIP_NAME,
        type: ZIMAGE_CLIP_TYPE,
        device: 'default',
      },
    },
    '3': {
      class_type: 'VAELoader',
      inputs: { vae_name: ZIMAGE_VAE_NAME },
    },
    '4': {
      class_type: 'CLIPTextEncode',
      inputs: { text: prompt, clip: ['2', 0] },
      _meta: { title: 'Positive prompt' },
    },
    /*
     * The negative IS the positive, zeroed. Z-Image Turbo runs at cfg 1 where
     * a real negative branch would have no effect anyway.
     */
    '5': {
      class_type: 'ConditioningZeroOut',
      inputs: { conditioning: ['4', 0] },
      _meta: { title: 'Negative (zeroed)' },
    },
    '6': {
      class_type: 'EmptySD3LatentImage',
      inputs: { width, height, batch_size: 1 },
    },
  }

  // LoRAs ride the UNet only: the encoder is Qwen, not a CLIP a LoRA trains.
  const loras = normalizeLoraSelections({
    loras: input.loras,
    loraName: input.loraName,
    loraStrength: input.loraStrength,
  })
  const model = appendModelOnlyLoraChain(workflow, {
    loras,
    model: ['1', 0],
    startId: 20,
  })

  workflow['7'] = {
    class_type: 'ModelSamplingAuraFlow',
    inputs: { model, shift: ZIMAGE_SHIFT },
  }
  workflow['8'] = {
    class_type: 'KSampler',
    inputs: {
      model: ['7', 0],
      positive: ['4', 0],
      negative: ['5', 0],
      latent_image: ['6', 0],
      seed,
      steps,
      cfg: ZIMAGE_CFG,
      sampler_name: ZIMAGE_SAMPLER,
      scheduler: ZIMAGE_SCHEDULER,
      denoise: 1,
    },
  }
  workflow['9'] = {
    class_type: 'VAEDecode',
    inputs: { samples: ['8', 0], vae: ['3', 0] },
  }
  workflow['10'] = {
    class_type: 'SaveImage',
    inputs: {
      images: ['9', 0],
      filename_prefix: input.filenamePrefix || 'kindrobots_zimage',
    },
  }

  return { workflow, seed, steps }
}
