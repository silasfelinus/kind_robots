// /server/api/comfy/wan/utils/imageToVideoWorkflow.ts
//
// WAN 2.2 A14B image-to-video ComfyUI workflow builder for the queue path.
//
// WAN 2.2's 14B i2v model is a mixture-of-experts pair: a HIGH-noise expert
// denoises the early (structure) steps and a LOW-noise expert finishes the
// late (detail) steps. So the graph loads both diffusion models and runs two
// KSamplerAdvanced passes over one latent — high noise for steps [0, boundary),
// then low noise for [boundary, end) — instead of a single sampler. This is the
// better-quality path and the project default (chosen over the single-model
// WAN 2.1 build, which is still installed but no longer wired here).
//
// Like the LTX builder, the graph references images by NAME only; the enqueue
// endpoint ships the base64 in the ArtJob payload's `images` array and the home
// relay uploads them to Comfy's input folder before the graph runs.
//
// Model filenames are verified against the home Comfy install (Z:/ai/models,
// 2026-07) and centralised as constants so the operator can retune a different
// WAN build without touching the graph.

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
  // Fraction of the total steps handled by the high-noise expert before the
  // low-noise expert takes over (0–1). Defaults to WAN_DEFAULT_BOUNDARY.
  boundary?: number | null
  filenamePrefix?: string | null
}

export const WAN_DEFAULT_WIDTH = 832
export const WAN_DEFAULT_HEIGHT = 480
export const WAN_DEFAULT_DURATION = 5
export const WAN_DEFAULT_FRAME_RATE = 16
// WAN 2.2 A14B i2v sampling defaults (ComfyUI's reference template): 20 steps
// split evenly between the two experts, low cfg, euler/simple.
export const WAN_DEFAULT_STEPS = 20
export const WAN_DEFAULT_CFG = 3.5
export const WAN_DEFAULT_SAMPLER = 'euler'
export const WAN_DEFAULT_SCHEDULER = 'simple'
// Half the steps run on the high-noise expert, half on the low-noise expert.
export const WAN_DEFAULT_BOUNDARY = 0.5

// WAN 2.2 A14B i2v model files — matched to the home Comfy install. The A14B
// pair reuses the WAN 2.1 VAE (the separate wan2.2_vae is only for the 5B
// TI2V model). WAN 2.2 i2v conditions on the start-image latent directly and
// does not use a CLIP-vision encoder, so none is loaded.
export const WAN_HIGH_NOISE_UNET =
  'wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors'
export const WAN_LOW_NOISE_UNET =
  'wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors'
export const WAN_CLIP = 'umt5_xxl_fp8_e4m3fn_scaled.safetensors'
export const WAN_VAE = 'wan_2.1_vae.safetensors'

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

// Step at which the low-noise expert takes over from the high-noise expert.
// Kept in [1, steps-1] so both experts always run at least one step.
function boundaryStep(steps: number, boundary: number): number {
  const raw = Math.round(steps * boundary)
  return Math.min(steps - 1, Math.max(1, raw))
}

export function buildWanImageToVideoWorkflow(
  input: WanImageToVideoInput,
): ComfyWorkflow {
  const seed = resolveSeed(input.seed)
  const width = input.width
  const height = input.height
  const frameRate = input.frameRate
  const length = wanFrameCount(input.duration, frameRate)
  const steps = input.steps ?? WAN_DEFAULT_STEPS
  const cfg = input.cfg ?? WAN_DEFAULT_CFG
  const samplerName = input.sampler ?? WAN_DEFAULT_SAMPLER
  const scheduler = input.scheduler ?? WAN_DEFAULT_SCHEDULER
  const split = boundaryStep(steps, input.boundary ?? WAN_DEFAULT_BOUNDARY)
  const hasLastFrame = Boolean(input.lastImageName)

  const workflow: ComfyWorkflow = {
    // --- Loaders ------------------------------------------------------------
    // The two experts of the A14B pair.
    unet_high: {
      inputs: { unet_name: WAN_HIGH_NOISE_UNET, weight_dtype: 'default' },
      class_type: 'UNETLoader',
      _meta: { title: 'Load Diffusion Model (High Noise)' },
    },
    unet_low: {
      inputs: { unet_name: WAN_LOW_NOISE_UNET, weight_dtype: 'default' },
      class_type: 'UNETLoader',
      _meta: { title: 'Load Diffusion Model (Low Noise)' },
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
  }

  // WanImageToVideo emits conditioning + the seed latent from the start frame.
  // An optional end frame (WAN 2.2 first-last-frame) pins the final frame.
  const i2vInputs: Record<string, unknown> = {
    positive: ['positive', 0],
    negative: ['negative', 0],
    vae: ['vae', 0],
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

  // --- Two-expert sampling --------------------------------------------------
  // High-noise expert: denoise [0, split), keeping the leftover noise so the
  // low-noise expert can finish it.
  workflow['sampler_high'] = {
    inputs: {
      add_noise: 'enable',
      noise_seed: seed,
      steps,
      cfg,
      sampler_name: samplerName,
      scheduler,
      start_at_step: 0,
      end_at_step: split,
      return_with_leftover_noise: 'enable',
      model: ['unet_high', 0],
      positive: ['wan_i2v', 0],
      negative: ['wan_i2v', 1],
      latent_image: ['wan_i2v', 2],
    },
    class_type: 'KSamplerAdvanced',
    _meta: { title: 'KSampler Advanced (High Noise)' },
  }
  // Low-noise expert: pick up the partially-denoised latent (no fresh noise)
  // and finish [split, end).
  workflow['sampler_low'] = {
    inputs: {
      add_noise: 'disable',
      noise_seed: seed,
      steps,
      cfg,
      sampler_name: samplerName,
      scheduler,
      start_at_step: split,
      end_at_step: 10_000,
      return_with_leftover_noise: 'disable',
      model: ['unet_low', 0],
      positive: ['wan_i2v', 0],
      negative: ['wan_i2v', 1],
      latent_image: ['sampler_high', 0],
    },
    class_type: 'KSamplerAdvanced',
    _meta: { title: 'KSampler Advanced (Low Noise)' },
  }

  // --- Decode + encode video ----------------------------------------------
  workflow['decode'] = {
    inputs: { samples: ['sampler_low', 0], vae: ['vae', 0] },
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
