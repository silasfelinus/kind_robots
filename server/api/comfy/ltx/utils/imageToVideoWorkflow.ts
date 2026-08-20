// /server/api/comfy/ltx/utils/imageToVideoWorkflow.ts
import {
  buildVideoOutputNodes,
  normalizeVideoOutputFormat,
  type VideoOutputFormat,
} from '../../utils/videoOutput'

export type ComfyWorkflow = Record<string, ComfyWorkflowNode>

export type ComfyWorkflowNode = {
  class_type?: string
  inputs?: Record<string, unknown>
  _meta?: Record<string, unknown>
}

export type LtxImageToVideoInput = {
  prompt: string
  negativePrompt: string
  firstImageName: string
  lastImageName?: string | null
  width: number
  height: number
  duration: number
  frameRate: number
  seed?: number | null
  steps?: number | null
  cfg?: number | null
  sampler?: string | null
  sigmas?: string | null
  loraStrength?: number | null
  styleLoraName?: string | null
  styleLoraStrength?: number | null
  tileSize?: number | null
  tileOverlap?: number | null
  temporalSize?: number | null
  temporalOverlap?: number | null
  filenamePrefix?: string | null
  outputFormat?: VideoOutputFormat | string | null
  renderScale?: number | null
  latentUpscaleModel?: string | null
  refineSampler?: string | null
  refineSigmas?: string | null
}

export const LTX_DEFAULT_WIDTH = 1280
export const LTX_DEFAULT_HEIGHT = 720
export const LTX_DEFAULT_DURATION = 6
export const LTX_DEFAULT_FRAME_RATE = 25
export const LTX_DEFAULT_STEPS = 20
export const LTX_DEFAULT_CFG = 1
export const LTX_DEFAULT_SAMPLER = 'euler_ancestral_cfg_pp'
export const LTX_DEFAULT_SIGMAS =
  '1.0, 0.99375, 0.9875, 0.98125, 0.975, 0.909375, 0.725, 0.421875, 0.0'
export const LTX_DEFAULT_LORA_STRENGTH = 0.5
export const LTX_CHECKPOINT = 'ltx/ltx-2.3-22b-dev-fp8.safetensors'
export const LTX_TEXT_ENCODER = 'gemma_3_12B_it_fp4_mixed.safetensors'
export const LTX_LORA = 'ltx-2.3-22b-distilled-lora-384.safetensors'

function resolveSeed(seed?: number | null): number {
  if (typeof seed === 'number' && Number.isFinite(seed) && seed >= 0) {
    return Math.floor(seed)
  }
  return Math.floor(Math.random() * 2_147_483_647)
}

function clampRenderScale(value?: number | null): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 1
  return Math.min(1, Math.max(0.25, value))
}

function scaledDimension(value: number, scale: number): number {
  return Math.max(64, Math.round((value * scale) / 8) * 8)
}

export function ltxFrameCount(duration: number, frameRate: number): number {
  const frames = Math.round(duration * frameRate) + 1
  return Math.max(2, frames)
}

export function buildLtxImageToVideoWorkflow(
  input: LtxImageToVideoInput,
): ComfyWorkflow {
  const seed = resolveSeed(input.seed)
  const width = input.width
  const height = input.height
  const frameRate = input.frameRate
  const length = ltxFrameCount(input.duration, frameRate)
  const hasLastFrame = Boolean(input.lastImageName)
  const renderScale = clampRenderScale(input.renderScale)
  const renderWidth = scaledDimension(width, renderScale)
  const renderHeight = scaledDimension(height, renderScale)
  const wantsUpscale = renderScale < 1
  const latentUpscaleModel = input.latentUpscaleModel?.trim() || null
  const refineSampler = input.refineSampler?.trim() || null
  const refineSigmas = input.refineSigmas?.trim() || null

  if (wantsUpscale && !latentUpscaleModel) {
    throw new Error(
      'LTX renderScale below 1 requires latentUpscaleModel so output dimensions remain explicit.',
    )
  }
  if (wantsUpscale && (!refineSampler || !refineSigmas)) {
    throw new Error(
      'LTX latent upscale requires refineSampler and refineSigmas for the post-upscale refinement pass.',
    )
  }

  const workflow: ComfyWorkflow = {
    '317': {
      inputs: { ckpt_name: LTX_CHECKPOINT },
      class_type: 'CheckpointLoaderSimple',
      _meta: { title: 'Load Checkpoint' },
    },
    '318': {
      inputs: {
        text_encoder: LTX_TEXT_ENCODER,
        ckpt_name: LTX_CHECKPOINT,
        device: 'default',
      },
      class_type: 'LTXAVTextEncoderLoader',
      _meta: { title: 'LTXV Text Encoder Loader' },
    },
    '293': {
      inputs: {
        lora_name: LTX_LORA,
        strength_model: input.loraStrength ?? LTX_DEFAULT_LORA_STRENGTH,
        model: ['317', 0],
      },
      class_type: 'LoraLoaderModelOnly',
      _meta: { title: 'Load Required LTX Distilled LoRA' },
    },
    '319': {
      inputs: { value: input.prompt },
      class_type: 'PrimitiveStringMultiline',
      _meta: { title: 'Prompt', prompt: input.prompt },
    },
    '306': {
      inputs: { text: ['319', 0], clip: ['318', 0] },
      class_type: 'CLIPTextEncode',
      _meta: { title: 'CLIP Text Encode Positive' },
    },
    '314': {
      inputs: { text: input.negativePrompt, clip: ['318', 0] },
      class_type: 'CLIPTextEncode',
      _meta: { title: 'CLIP Text Encode Negative' },
    },
    '307': {
      inputs: {
        frame_rate: frameRate,
        positive: ['306', 0],
        negative: ['314', 0],
      },
      class_type: 'LTXVConditioning',
      _meta: { title: 'LTXVConditioning' },
    },
    img_first: {
      inputs: { image: input.firstImageName },
      class_type: 'LoadImage',
      _meta: { title: 'Load First Image' },
    },
    img_scale: {
      inputs: {
        image: ['img_first', 0],
        upscale_method: 'lanczos',
        width,
        height,
        crop: 'disabled',
      },
      class_type: 'ImageScale',
      _meta: { title: 'Resize First Image' },
    },
    ltxv_i2v: {
      inputs: {
        positive: ['307', 0],
        negative: ['307', 1],
        vae: ['317', 2],
        image: ['img_scale', 0],
        width: renderWidth,
        height: renderHeight,
        length,
        batch_size: 1,
        strength: 1,
      },
      class_type: 'LTXVImgToVideo',
      _meta: { title: 'LTXV Image To Video' },
    },
  }

  let sampledModelRef: [string, number] = ['293', 0]
  const styleLoraName = input.styleLoraName?.trim()
  if (styleLoraName) {
    workflow.video_lora = {
      inputs: {
        lora_name: styleLoraName,
        strength_model: input.styleLoraStrength ?? 1,
        model: sampledModelRef,
      },
      class_type: 'LoraLoaderModelOnly',
      _meta: { title: 'Load Selected LTX LoRA' },
    }
    sampledModelRef = ['video_lora', 0]
  }

  let positiveRef: [string, number] = ['ltxv_i2v', 0]
  let negativeRef: [string, number] = ['ltxv_i2v', 1]
  let latentRef: [string, number] = ['ltxv_i2v', 2]

  if (hasLastFrame) {
    workflow.img_last = {
      inputs: { image: input.lastImageName as string },
      class_type: 'LoadImage',
      _meta: { title: 'Load Last Image' },
    }
    workflow.img_last_scale = {
      inputs: {
        image: ['img_last', 0],
        upscale_method: 'lanczos',
        width,
        height,
        crop: 'disabled',
      },
      class_type: 'ImageScale',
      _meta: { title: 'Resize Last Image' },
    }
    workflow.ltxv_guide = {
      inputs: {
        positive: ['ltxv_i2v', 0],
        negative: ['ltxv_i2v', 1],
        vae: ['317', 2],
        latent: ['ltxv_i2v', 2],
        image: ['img_last_scale', 0],
        frame_idx: -1,
        strength: 1,
      },
      class_type: 'LTXVAddGuide',
      _meta: { title: 'LTXV Add Guide (End Frame)' },
    }
    positiveRef = ['ltxv_guide', 0]
    negativeRef = ['ltxv_guide', 1]
    latentRef = ['ltxv_guide', 2]
  }

  workflow['286'] = {
    inputs: { noise_seed: seed },
    class_type: 'RandomNoise',
    _meta: { title: 'RandomNoise' },
  }
  workflow['298'] = {
    inputs: { sampler_name: input.sampler ?? LTX_DEFAULT_SAMPLER },
    class_type: 'KSamplerSelect',
    _meta: { title: 'KSamplerSelect' },
  }
  workflow['308'] = {
    inputs: { sigmas: input.sigmas ?? LTX_DEFAULT_SIGMAS },
    class_type: 'ManualSigmas',
    _meta: { title: 'ManualSigmas' },
  }
  workflow['315'] = {
    inputs: {
      cfg: input.cfg ?? LTX_DEFAULT_CFG,
      model: sampledModelRef,
      positive: positiveRef,
      negative: negativeRef,
    },
    class_type: 'CFGGuider',
    _meta: { title: 'CFGGuider' },
  }
  workflow['291'] = {
    inputs: {
      noise: ['286', 0],
      guider: ['315', 0],
      sampler: ['298', 0],
      sigmas: ['308', 0],
      latent_image: latentRef,
    },
    class_type: 'SamplerCustomAdvanced',
    _meta: { title: 'SamplerCustomAdvanced' },
  }

  let finalLatentRef: [string, number] = ['291', 0]

  if (wantsUpscale) {
    workflow.ltx_crop_guides = {
      inputs: {
        positive: positiveRef,
        negative: negativeRef,
        latent: ['291', 0],
      },
      class_type: 'LTXVCropGuides',
      _meta: { title: 'LTXV Crop Guides For Upscale' },
    }
    workflow.ltx_upscale_model = {
      inputs: { model_name: latentUpscaleModel as string },
      class_type: 'LatentUpscaleModelLoader',
      _meta: { title: 'Load LTX Latent Upscale Model' },
    }
    workflow.ltx_upscale = {
      inputs: {
        samples: ['291', 0],
        upscale_model: ['ltx_upscale_model', 0],
        vae: ['317', 2],
      },
      class_type: 'LTXVLatentUpsampler',
      _meta: { title: 'LTXV Latent Upsampler' },
    }
    workflow.ltx_recondition = {
      inputs: {
        strength: 1,
        bypass: false,
        vae: ['317', 2],
        image: ['img_scale', 0],
        latent: ['ltx_upscale', 0],
      },
      class_type: 'LTXVImgToVideoInplace',
      _meta: { title: 'Reapply First Frame After Upscale' },
    }

    let refinePositiveRef: [string, number] = ['ltx_crop_guides', 0]
    let refineNegativeRef: [string, number] = ['ltx_crop_guides', 1]
    let refineLatentRef: [string, number] = ['ltx_recondition', 0]

    if (hasLastFrame) {
      workflow.ltx_refine_last_guide = {
        inputs: {
          positive: refinePositiveRef,
          negative: refineNegativeRef,
          vae: ['317', 2],
          latent: refineLatentRef,
          image: ['img_last_scale', 0],
          frame_idx: -1,
          strength: 1,
        },
        class_type: 'LTXVAddGuide',
        _meta: { title: 'Reapply End Frame After Upscale' },
      }
      refinePositiveRef = ['ltx_refine_last_guide', 0]
      refineNegativeRef = ['ltx_refine_last_guide', 1]
      refineLatentRef = ['ltx_refine_last_guide', 2]
    }

    workflow.ltx_refine_noise = {
      inputs: { noise_seed: (seed + 1) % 2_147_483_647 },
      class_type: 'RandomNoise',
      _meta: { title: 'Refinement Noise' },
    }
    workflow.ltx_refine_sampler = {
      inputs: { sampler_name: refineSampler as string },
      class_type: 'KSamplerSelect',
      _meta: { title: 'Refinement Sampler' },
    }
    workflow.ltx_refine_sigmas = {
      inputs: { sigmas: refineSigmas as string },
      class_type: 'ManualSigmas',
      _meta: { title: 'Refinement Sigmas' },
    }
    workflow.ltx_refine_guider = {
      inputs: {
        cfg: input.cfg ?? LTX_DEFAULT_CFG,
        model: sampledModelRef,
        positive: refinePositiveRef,
        negative: refineNegativeRef,
      },
      class_type: 'CFGGuider',
      _meta: { title: 'Refinement CFG Guider' },
    }
    workflow.ltx_refine_sample = {
      inputs: {
        noise: ['ltx_refine_noise', 0],
        guider: ['ltx_refine_guider', 0],
        sampler: ['ltx_refine_sampler', 0],
        sigmas: ['ltx_refine_sigmas', 0],
        latent_image: refineLatentRef,
      },
      class_type: 'SamplerCustomAdvanced',
      _meta: { title: 'Post-upscale Refinement' },
    }
    finalLatentRef = ['ltx_refine_sample', 0]
  }

  workflow['316'] = {
    inputs: {
      tile_size: input.tileSize ?? 768,
      overlap: input.tileOverlap ?? 64,
      temporal_size: input.temporalSize ?? 4096,
      temporal_overlap: input.temporalOverlap ?? 4,
      samples: finalLatentRef,
      vae: ['317', 2],
    },
    class_type: 'VAEDecodeTiled',
    _meta: { title: 'VAE Decode Tiled' },
  }

  Object.assign(
    workflow,
    buildVideoOutputNodes({
      format: normalizeVideoOutputFormat(input.outputFormat),
      imagesRef: ['316', 0],
      fps: frameRate,
      filenamePrefix: input.filenamePrefix ?? 'video/kindrobots_ltx_image2video',
    }),
  )

  return workflow
}
