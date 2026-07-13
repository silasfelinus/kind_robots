// /server/api/comfy/ltx/utils/imageToVideoWorkflow.ts
//
// LTX image-to-video ComfyUI workflow builder for the queue path.
//
// Mirrors the loader/sampler stack of the synchronous text2video route
// (../text2Video.post.ts) — same checkpoint, text encoder, LoRA, VAE, sigmas —
// but swaps the empty latent for image-conditioned latents so the motion starts
// from a supplied still. A first image is required; an optional second image is
// pinned to the final frame (first→last keyframe interpolation) via LTXVAddGuide.
//
// The workflow references its input images by NAME only. The enqueue endpoint
// puts the actual base64 in the ArtJob payload's `images: [{ name, imageData }]`
// array; the home relay uploads those to Comfy before running the graph, so the
// LoadImage nodes resolve. This is the same contract the kontext queue path uses.

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
  // When present, pinned to the final frame so the clip morphs first → last.
  lastImageName?: string | null
  width: number
  height: number
  // Length of the clip in seconds; combined with frameRate to derive frames.
  duration: number
  frameRate: number
  seed?: number | null
  steps?: number | null
  cfg?: number | null
  sampler?: string | null
  sigmas?: string | null
  loraStrength?: number | null
  tileSize?: number | null
  tileOverlap?: number | null
  temporalSize?: number | null
  temporalOverlap?: number | null
  filenamePrefix?: string | null
}

// Defaults match the proven text2video route so a queued clip renders with the
// same look the synchronous path produces.
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
export const LTX_CHECKPOINT = 'ltx\\ltx-2.3-22b-dev-fp8.safetensors'
export const LTX_TEXT_ENCODER = 'gemma_3_12B_it_fp4_mixed.safetensors'
export const LTX_LORA = 'ltx-2.3-22b-distilled-lora-384.safetensors'

function resolveSeed(seed?: number | null): number {
  if (typeof seed === 'number' && Number.isFinite(seed) && seed >= 0) {
    return Math.floor(seed)
  }

  return Math.floor(Math.random() * 1_000_000_000_000_000)
}

// Frame count LTX expects: whole frames across the duration, +1 for the anchor
// frame — matches the `duration * frameRate + 1` expression the text2video graph
// computes on-device.
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

  const workflow: ComfyWorkflow = {
    // --- Loaders ------------------------------------------------------------
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
      _meta: { title: 'Load LoRA' },
    },

    // --- Prompt conditioning ------------------------------------------------
    '319': {
      inputs: { value: input.prompt },
      class_type: 'PrimitiveStringMultiline',
      _meta: { title: 'Prompt' },
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

    // --- Image conditioning (the i2v part) ----------------------------------
    // First frame: load the still, encode it, and seed the video latent from it.
    img_first: {
      inputs: { image: input.firstImageName },
      class_type: 'LoadImage',
      _meta: { title: 'Load First Image' },
    },
    img_scale: {
      inputs: {
        width,
        height,
        interpolation: 'lanczos',
        method: 'stretch',
        condition: 'always',
        multiple_of: 0,
        image: ['img_first', 0],
      },
      class_type: 'ImageResize+',
      _meta: { title: 'Resize First Image' },
    },
    // LTXVImgToVideo bakes the start frame into the latent + conditioning.
    ltxv_i2v: {
      inputs: {
        positive: ['307', 0],
        negative: ['307', 1],
        vae: ['317', 2],
        image: ['img_scale', 0],
        width,
        height,
        length,
        batch_size: 1,
        strength: 1,
      },
      class_type: 'LTXVImgToVideo',
      _meta: { title: 'LTXV Image To Video' },
    },
  }

  // Node ids that feed the sampler. Default: straight off LTXVImgToVideo.
  let positiveRef: [string, number] = ['ltxv_i2v', 0]
  let negativeRef: [string, number] = ['ltxv_i2v', 1]
  let latentRef: [string, number] = ['ltxv_i2v', 2]

  if (hasLastFrame) {
    // Optional end frame: pin the second still to the final frame index so the
    // motion resolves onto it. LTXVAddGuide threads through conditioning+latent.
    workflow['img_last'] = {
      inputs: { image: input.lastImageName as string },
      class_type: 'LoadImage',
      _meta: { title: 'Load Last Image' },
    }
    workflow['img_last_scale'] = {
      inputs: {
        width,
        height,
        interpolation: 'lanczos',
        method: 'stretch',
        condition: 'always',
        multiple_of: 0,
        image: ['img_last', 0],
      },
      class_type: 'ImageResize+',
      _meta: { title: 'Resize Last Image' },
    }
    workflow['ltxv_guide'] = {
      inputs: {
        positive: ['ltxv_i2v', 0],
        negative: ['ltxv_i2v', 1],
        vae: ['317', 2],
        latent: ['ltxv_i2v', 2],
        image: ['img_last_scale', 0],
        // -1 targets the final frame of the clip.
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

  // --- Sampling -------------------------------------------------------------
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
      model: ['293', 0],
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

  // --- Decode + encode video ----------------------------------------------
  workflow['316'] = {
    inputs: {
      tile_size: input.tileSize ?? 768,
      overlap: input.tileOverlap ?? 64,
      temporal_size: input.temporalSize ?? 4096,
      temporal_overlap: input.temporalOverlap ?? 4,
      samples: ['291', 0],
      vae: ['317', 2],
    },
    class_type: 'VAEDecodeTiled',
    _meta: { title: 'VAE Decode Tiled' },
  }
  workflow['312'] = {
    inputs: { fps: frameRate, images: ['316', 0] },
    class_type: 'CreateVideo',
    _meta: { title: 'Create Video' },
  }
  workflow['341'] = {
    inputs: {
      filename_prefix:
        input.filenamePrefix ?? 'video/kindrobots_ltx_image2video',
      format: 'auto',
      codec: 'auto',
      video: ['312', 0],
    },
    class_type: 'SaveVideo',
    _meta: { title: 'Save Video' },
  }

  return workflow
}
