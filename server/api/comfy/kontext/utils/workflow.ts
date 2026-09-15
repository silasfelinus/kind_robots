// /server/api/comfy/kontext/utils/workflow.ts
//
// Shared Flux Kontext workflow builder for the queue-based generation path.
// Mirrors the graph in ../generate.post.ts (kept private there); the direct
// route and this builder should be deduped in a later pass.

import { kontextDualClipLoaderNode } from '../../../../utils/fluxTextEncoders'
import {
  appendModelOnlyLoraChain,
  normalizeLoraSelections,
  type LoraSelectionInput,
} from '../../utils/loraChain'

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
  originalWeight?: number | null
  negativePrompt?: string | null
  cfg?: number | null
  maskName?: string | null
  loraName?: string | null
  loraStrength?: number | null
  loras?: LoraSelectionInput[] | null
  unetName?: string | null
  unetWeightDtype?: string | null
}

export const DEFAULT_KONTEXT_WIDTH = 1024
export const DEFAULT_KONTEXT_HEIGHT = 1024
export const DEFAULT_KONTEXT_STEPS = 10
export const DEFAULT_KONTEXT_GUIDANCE = 2.5
export const DEFAULT_KONTEXT_SAMPLER = 'euler'
export const DEFAULT_KONTEXT_SCHEDULER = 'simple'
export const DEFAULT_KONTEXT_DENOISE = 1
export const DEFAULT_KONTEXT_CFG = 2.5
const MIN_IMG2IMG_DENOISE = 0.15

function resolveSeed(seed?: number | null): number {
  if (typeof seed === 'number' && Number.isFinite(seed) && seed >= 0) {
    return Math.floor(seed)
  }

  return Math.floor(Math.random() * 2_147_483_647)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

const DEFAULT_KONTEXT_UNET = 'flux1-kontext-dev-Q5_K_M.gguf'
const DEFAULT_KONTEXT_UNET_WEIGHT_DTYPE = 'fp8_e4m3fn'

function buildKontextUnetLoader(input: KontextWorkflowInput): ComfyWorkflowNode {
  const unetName = input.unetName?.trim() || DEFAULT_KONTEXT_UNET

  if (unetName.toLowerCase().endsWith('.gguf')) {
    return {
      inputs: { unet_name: unetName },
      class_type: 'UnetLoaderGGUF',
      _meta: { title: 'Unet Loader (GGUF)' },
    }
  }

  return {
    inputs: {
      unet_name: unetName,
      weight_dtype:
        input.unetWeightDtype?.trim() || DEFAULT_KONTEXT_UNET_WEIGHT_DTYPE,
    },
    class_type: 'UNETLoader',
    _meta: { title: 'Load Diffusion Model' },
  }
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
    typeof input.originalWeight === 'number' &&
    Number.isFinite(input.originalWeight)
      ? clamp(input.originalWeight, 0, 1)
      : 0
  const useImg2Img = originalWeight > 0 || useMask

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
    '11': kontextDualClipLoaderNode(),
    '13': {
      inputs: {
        noise: ['25', 0],
        guider: ['22', 0],
        sampler: ['16', 0],
        sigmas: ['17', 0],
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
    '59': buildKontextUnetLoader(input),
  }

  const loras = normalizeLoraSelections(input)
  if (loras.length) {
    const model = appendModelOnlyLoraChain(workflow, {
      loras,
      model: ['59', 0],
      startId: 61,
    })
    ;(workflow['30']!.inputs as Record<string, unknown>).model = model
  }

  let latentRef: [string, number] = useImg2Img ? ['39', 0] : ['27', 0]

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
  const match = imageData.trim().match(/^data:image\/([a-zA-Z0-9.+-]+);base64,/)
  const subtype = (match?.[1] || 'png').toLowerCase()

  if (subtype.includes('jpeg') || subtype.includes('jpg')) return 'jpg'
  if (subtype.includes('webp')) return 'webp'

  return 'png'
}

export type KontextInputImage = { name: string; imageData: string }

export function buildKontextInputImages(
  imageName: string,
  imageData: string,
  maskName?: string | null,
  maskData?: string | null,
): KontextInputImage[] {
  const images: KontextInputImage[] = [{ name: imageName, imageData }]

  if (maskName && maskData) {
    images.push({ name: maskName, imageData: maskData })
  }

  return images
}
