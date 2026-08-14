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
  loraName?: string | null
  loraStrength?: number | null
  // Fraction of the total steps handled by the high-noise expert before the
  // low-noise expert takes over (0–1). Defaults to WAN_DEFAULT_BOUNDARY.
  // Ignored in ti2v mode, which has no second expert to hand over to.
  boundary?: number | null
  // 'ti2v' (default) fits the card; 'a14b' is the slower high-quality pair.
  // Omitted, a last-frame request selects 'a14b' -- see resolveWanMode.
  mode?: WanImageToVideoMode | null
  filenamePrefix?: string | null
  outputFormat?: VideoOutputFormat | string | null
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
// WAN's text encoder is umT5-XXL. The fp8 safetensors build is 6.27 GB; the
// Q5_K_M GGUF already sitting in the same folder is 3.86 GB, so this is 2.41 GB
// of a 12 GB card recovered for the two 14B unets that follow it -- the same
// win as the Flux T5 switch (see server/utils/fluxTextEncoders.ts), on the
// other encoder family. Point WAN_CLIP_ENCODER at a .safetensors to go back;
// the loader class follows the extension.
export const WAN_CLIP =
  (process.env.WAN_CLIP_ENCODER || '').trim() || 'umt5-xxl-encoder-Q5_K_M.gguf'

export function wanClipIsGguf(): boolean {
  return WAN_CLIP.toLowerCase().endsWith('.gguf')
}

/**
 * CLIPLoaderGGUF does not declare a `device` input, so it is emitted only on
 * the safetensors path -- an undeclared input risks a submit-time validation
 * rejection, the same failure class as an unlisted lora_name.
 */
export function wanClipLoaderNode() {
  const gguf = wanClipIsGguf()
  const inputs: Record<string, unknown> = { clip_name: WAN_CLIP, type: 'wan' }
  if (!gguf) inputs.device = 'default'
  return {
    inputs,
    class_type: gguf ? 'CLIPLoaderGGUF' : 'CLIPLoader',
    _meta: { title: gguf ? 'Load CLIP (GGUF)' : 'Load CLIP' },
  }
}
export const WAN_VAE = 'wan_2.1_vae.safetensors'

// WAN 2.2 ships two image-to-video paths, and this box can only afford one of
// them interactively. Measured on the render host (12 GB card):
//
//   A14B  wan2.2_i2v_high_noise_14B_fp8   14 GB  } one resident at a time,
//         wan2.2_i2v_low_noise_14B_fp8    14 GB  } still over the card
//   TI2V  wan2.2_ti2v_5B_fp16            9.4 GB
//
// A14B does not fit in VRAM, so ComfyUI offloads to system RAM and the render
// becomes an overnight job. It completes, and Silas rates the quality highly --
// it is a batch mode, not a broken one, and is kept exactly as it was.
//
// TI2V-5B is WAN's own answer for consumer cards and is what a caller should
// get by default. It is a different graph, not a different filename: one unet
// instead of the high/low expert pair, no boundary split, the 2.2 VAE rather
// than the 2.1 VAE, and Wan22ImageToVideoLatent in place of WanImageToVideo.
export const WAN_TI2V_UNET = 'wan2.2_ti2v_5B_fp16.safetensors'

// The 5B TI2V model uses the 2.2 VAE. The A14B pair uses the 2.1 VAE -- these
// are not interchangeable, which is why both files exist on the box.
export const WAN_TI2V_VAE = 'wan2.2_vae.safetensors'

export type WanImageToVideoMode = 'ti2v' | 'a14b'

export const WAN_DEFAULT_MODE: WanImageToVideoMode =
  (process.env.WAN_I2V_MODE || '').trim() === 'a14b' ? 'a14b' : 'ti2v'

/**
 * Which graph to build.
 *
 * An explicit mode wins. Otherwise a request that pins the final frame selects
 * A14B automatically: Wan22ImageToVideoLatent declares only an optional
 * `start_image` and has no `end_image` input, so first-last-frame is a
 * capability TI2V structurally does not have. Silently dropping the last frame
 * would be worse than spending the extra time.
 */
export function resolveWanMode(
  input: Pick<WanImageToVideoInput, 'mode' | 'lastImageName'>,
): WanImageToVideoMode {
  if (input.mode === 'a14b' || input.mode === 'ti2v') return input.mode
  if (input.lastImageName?.trim()) return 'a14b'
  return WAN_DEFAULT_MODE
}

function resolveSeed(seed?: number | null): number {
  if (typeof seed === 'number' && Number.isFinite(seed) && seed >= 0) {
    return Math.floor(seed)
  }

  return Math.floor(Math.random() * 2_147_483_647)
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

  if (resolveWanMode(input) === 'ti2v') {
    return buildWanTi2vWorkflow(input, {
      seed,
      width,
      height,
      frameRate,
      length,
      steps,
      cfg,
      samplerName,
      scheduler,
    })
  }

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
    clip: wanClipLoaderNode(),
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

  let highModelRef: [string, number] = ['unet_high', 0]
  let lowModelRef: [string, number] = ['unet_low', 0]
  const loraName = input.loraName?.trim()
  if (loraName) {
    workflow['lora_high'] = {
      inputs: {
        lora_name: loraName,
        strength_model: input.loraStrength ?? 1,
        model: highModelRef,
      },
      class_type: 'LoraLoaderModelOnly',
      _meta: { title: 'Load Selected WAN LoRA (High Noise)' },
    }
    workflow['lora_low'] = {
      inputs: {
        lora_name: loraName,
        strength_model: input.loraStrength ?? 1,
        model: lowModelRef,
      },
      class_type: 'LoraLoaderModelOnly',
      _meta: { title: 'Load Selected WAN LoRA (Low Noise)' },
    }
    highModelRef = ['lora_high', 0]
    lowModelRef = ['lora_low', 0]
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
      model: highModelRef,
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
      model: lowModelRef,
      positive: ['wan_i2v', 0],
      negative: ['wan_i2v', 1],
      latent_image: ['sampler_high', 0],
    },
    class_type: 'KSamplerAdvanced',
    _meta: { title: 'KSampler Advanced (Low Noise)' },
  }

  // --- Decode + save output ------------------------------------------------
  workflow['decode'] = {
    inputs: { samples: ['sampler_low', 0], vae: ['vae', 0] },
    class_type: 'VAEDecode',
    _meta: { title: 'VAE Decode' },
  }
  Object.assign(
    workflow,
    buildVideoOutputNodes({
      format: normalizeVideoOutputFormat(input.outputFormat),
      imagesRef: ['decode', 0],
      fps: frameRate,
      filenamePrefix:
        input.filenamePrefix ?? 'video/kindrobots_wan_image2video',
    }),
  )

  return workflow
}

type WanDerived = {
  seed: number
  width: number
  height: number
  frameRate: number
  length: number
  steps: number
  cfg: number
  samplerName: string
  scheduler: string
}

/**
 * WAN 2.2 TI2V-5B: one 9.4 GB unet that fits the card, against the A14B pair's
 * 14 GB-at-a-time that does not.
 *
 * Structurally different from the A14B graph, not just differently named:
 *
 *   - one UNETLoader, so one optional LoRA rather than a matched pair
 *   - one KSampler, because there is no second expert to hand a partially
 *     denoised latent to -- `boundary` has no meaning here
 *   - the 2.2 VAE, which is what the 5B model was trained against
 *   - Wan22ImageToVideoLatent, whose signature (confirmed against the render
 *     host's /object_info) is vae/width/height/length/batch_size with an
 *     OPTIONAL start_image, returning a LATENT and nothing else
 *
 * That last point is the one worth reading twice. WanImageToVideo returns
 * (positive, negative, latent) and the A14B graph wires conditioning THROUGH
 * it. Wan22ImageToVideoLatent returns a latent only, so conditioning runs
 * straight from CLIPTextEncode into the sampler. Copying the A14B wiring here
 * would reference outputs that do not exist.
 *
 * It also has no end_image input, which is why resolveWanMode sends any
 * last-frame request to A14B rather than quietly dropping the last frame.
 */
function buildWanTi2vWorkflow(
  input: WanImageToVideoInput,
  derived: WanDerived,
): ComfyWorkflow {
  const { seed, width, height, frameRate, length, steps, cfg } = derived
  const { samplerName, scheduler } = derived

  const workflow: ComfyWorkflow = {
    unet: {
      inputs: { unet_name: WAN_TI2V_UNET, weight_dtype: 'default' },
      class_type: 'UNETLoader',
      _meta: { title: 'Load Diffusion Model (TI2V 5B)' },
    },
    clip: wanClipLoaderNode(),
    vae: {
      inputs: { vae_name: WAN_TI2V_VAE },
      class_type: 'VAELoader',
      _meta: { title: 'Load VAE (WAN 2.2)' },
    },
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
    img_first: {
      inputs: { image: input.firstImageName },
      class_type: 'LoadImage',
      _meta: { title: 'Load First Image' },
    },
  }

  let modelRef: [string, number] = ['unet', 0]
  const loraName = input.loraName?.trim()
  if (loraName) {
    workflow['lora'] = {
      inputs: {
        lora_name: loraName,
        strength_model: input.loraStrength ?? 1,
        model: modelRef,
      },
      class_type: 'LoraLoaderModelOnly',
      _meta: { title: 'Load Selected WAN LoRA' },
    }
    modelRef = ['lora', 0]
  }

  workflow['latent'] = {
    inputs: {
      vae: ['vae', 0],
      width,
      height,
      length,
      batch_size: 1,
      start_image: ['img_first', 0],
    },
    class_type: 'Wan22ImageToVideoLatent',
    _meta: { title: 'WAN 2.2 Image To Video Latent' },
  }

  workflow['sampler'] = {
    inputs: {
      seed,
      steps,
      cfg,
      sampler_name: samplerName,
      scheduler,
      denoise: 1,
      model: modelRef,
      // Straight from the encoders: this graph's latent node emits no
      // conditioning to route through.
      positive: ['positive', 0],
      negative: ['negative', 0],
      latent_image: ['latent', 0],
    },
    class_type: 'KSampler',
    _meta: { title: 'KSampler (TI2V)' },
  }

  workflow['decode'] = {
    inputs: { samples: ['sampler', 0], vae: ['vae', 0] },
    class_type: 'VAEDecode',
    _meta: { title: 'VAE Decode' },
  }

  Object.assign(
    workflow,
    buildVideoOutputNodes({
      format: normalizeVideoOutputFormat(input.outputFormat),
      imagesRef: ['decode', 0],
      fps: frameRate,
      filenamePrefix:
        input.filenamePrefix ?? 'video/kindrobots_wan_image2video',
    }),
  )

  return workflow
}
