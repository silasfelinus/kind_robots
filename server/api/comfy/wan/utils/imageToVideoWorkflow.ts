// /server/api/comfy/wan/utils/imageToVideoWorkflow.ts
//
// WAN image-to-video ComfyUI workflow builder for the queue path.
//
// WAN 2.x i2v takes a start frame (and optionally an end frame — WAN 2.2 FLF2V)
// and animates from it. Like the LTX builder, the graph references images by
// NAME only; the enqueue endpoint ships the base64 in the ArtJob payload's
// `images` array and the home relay uploads them before running the graph.
//
// The model filenames below are verified against the home Comfy install
// (Z:/ai/models, 2026-07). They are centralised as constants so the relay
// operator can retune them to a different WAN build without touching the graph.

export type ComfyWorkflow = Record<string, ComfyWorkflowNode>

export type ComfyWorkflowNode = {
  class_type?: string
  inputs?: Record<string, unknown>
  _meta?: Record<string, unknown>
}

export type WanImageToVideoInput = {
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
  scheduler?: string | null
  filenamePrefix?: string | null
}

export const WAN_DEFAULT_WIDTH = 832
export const WAN_DEFAULT_HEIGHT = 480
export const WAN_DEFAULT_DURATION = 5
export const WAN_DEFAULT_FRAME_RATE = 16
export const WAN_DEFAULT_STEPS = 20
export const WAN_DEFAULT_CFG = 6
export const WAN_DEFAULT_SAMPLER = 'uni_pc'
export const WAN_DEFAULT_SCHEDULER = 'simple'

// WAN 2.1 i2v 480p single-model stack, matched to the installed files:
//   - diffusion model is the fp16 build (no fp8 i2v file is installed)
//   - umt5-xxl fp8 text encoder, wan 2.1 vae, standard ViT-H clip vision
// The WAN 2.2 A14B high/low-noise pair is also installed but needs a two-model
// sampler chain this single-UNETLoader graph doesn't build, so it's not used.
export const WAN_UNET = 'wan2.1_i2v_480p_14B_fp16.safetensors'
export const WAN_CLIP = 'umt5_xxl_fp8_e4m3fn_scaled.safetensors'
export const WAN_VAE = 'wan_2.1_vae.safetensors'
export const WAN_CLIP_VISION = 'clip_vision_h.safetensors'

function resolveSeed(seed?: number | null): number {
  if (typeof seed === 'number' && Number.isFinite(seed) && seed >= 0) {
    return Math.floor(seed)
  }

  return Math.floor(Math.random() * 1_000_000_000_000_000)
}

// WAN wants a 4n+1 frame count. Round the requested seconds to the nearest
// valid length so the sampler doesn't reject it.
export function wanFrameCount(duration: number, frameRate: number): number {
  const raw = Math.round(duration * frameRate)
  const snapped = Math.round((raw - 1) / 4) * 4 + 1
  return Math.max(5, snapped)
}

export function buildWanImageToVideoWorkflow(
  input: WanImageToVideoInput,
): ComfyWorkflow {
  const seed = resolveSeed(input.seed)
  const width = input.width
  const height = input.height
  const frameRate = input.frameRate
  const length = wanFrameCount(input.duration, frameRate)
  const hasLastFrame = Boolean(input.lastImageName)

  const workflow: ComfyWorkflow = {
    // --- Loaders ------------------------------------------------------------
    unet: {
      inputs: { unet_name: WAN_UNET, weight_dtype: 'default' },
      class_type: 'UNETLoader',
      _meta: { title: 'Load Diffusion Model' },
    },
    clip: {
      inputs: { clip_name: WAN_CLIP, type: 'wan', device: 'default' },
      class_type: 'CLIPLoader',
      _meta: { title: 'Load CLIP' },
    },
    vae: {
      inputs: { vae_name: WAN_VAE },
      class_type: 'VAELoader',
      _meta: { title: 'Load VAE' },
    },
    clip_vision: {
      inputs: { clip_name: WAN_CLIP_VISION },
      class_type: 'CLIPVisionLoader',
      _meta: { title: 'Load CLIP Vision' },
    },

    // --- Prompt conditioning ------------------------------------------------
    positive: {
      inputs: { text: input.prompt, clip: ['clip', 0] },
      class_type: 'CLIPTextEncode',
      _meta: { title: 'CLIP Text Encode Positive' },
    },
    negative: {
      inputs: { text: input.negativePrompt, clip: ['clip', 0] },
      class_type: 'CLIPTextEncode',
      _meta: { title: 'CLIP Text Encode Negative' },
    },

    // --- Image conditioning -------------------------------------------------
    img_first: {
      inputs: { image: input.firstImageName },
      class_type: 'LoadImage',
      _meta: { title: 'Load First Image' },
    },
    clip_vision_encode: {
      inputs: {
        crop: 'center',
        clip_vision: ['clip_vision', 0],
        image: ['img_first', 0],
      },
      class_type: 'CLIPVisionEncode',
      _meta: { title: 'CLIP Vision Encode' },
    },
  }

  // WanImageToVideo produces conditioning + the seed latent. WAN 2.2 accepts an
  // optional end_image for first-last-frame interpolation.
  const i2vInputs: Record<string, unknown> = {
    positive: ['positive', 0],
    negative: ['negative', 0],
    vae: ['vae', 0],
    clip_vision_output: ['clip_vision_encode', 0],
    start_image: ['img_first', 0],
    width,
    height,
    length,
    batch_size: 1,
  }

  if (hasLastFrame) {
    workflow['img_last'] = {
      inputs: { image: input.lastImageName as string },
      class_type: 'LoadImage',
      _meta: { title: 'Load Last Image' },
    }
    i2vInputs.end_image = ['img_last', 0]
  }

  workflow['wan_i2v'] = {
    inputs: i2vInputs,
    class_type: 'WanImageToVideo',
    _meta: { title: 'WAN Image To Video' },
  }

  // --- Sampling -------------------------------------------------------------
  workflow['sampler'] = {
    inputs: {
      seed,
      steps: input.steps ?? WAN_DEFAULT_STEPS,
      cfg: input.cfg ?? WAN_DEFAULT_CFG,
      sampler_name: input.sampler ?? WAN_DEFAULT_SAMPLER,
      scheduler: input.scheduler ?? WAN_DEFAULT_SCHEDULER,
      denoise: 1,
      model: ['unet', 0],
      positive: ['wan_i2v', 0],
      negative: ['wan_i2v', 1],
      latent_image: ['wan_i2v', 2],
    },
    class_type: 'KSampler',
    _meta: { title: 'KSampler' },
  }

  // --- Decode + encode video ----------------------------------------------
  workflow['decode'] = {
    inputs: { samples: ['sampler', 0], vae: ['vae', 0] },
    class_type: 'VAEDecode',
    _meta: { title: 'VAE Decode' },
  }
  workflow['create_video'] = {
    inputs: { fps: frameRate, images: ['decode', 0] },
    class_type: 'CreateVideo',
    _meta: { title: 'Create Video' },
  }
  workflow['save_video'] = {
    inputs: {
      filename_prefix:
        input.filenamePrefix ?? 'video/kindrobots_wan_image2video',
      format: 'auto',
      codec: 'auto',
      video: ['create_video', 0],
    },
    class_type: 'SaveVideo',
    _meta: { title: 'Save Video' },
  }

  return workflow
}
