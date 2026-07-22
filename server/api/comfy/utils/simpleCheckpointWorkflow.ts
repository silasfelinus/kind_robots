// /server/api/comfy/utils/simpleCheckpointWorkflow.ts
//
// Shared builder for "simple" single-checkpoint Comfy graphs:
//   diffusion model -> CLIP -> (+/- text encode) -> KSampler -> VAE -> save
//
// Krea 2 Turbo and Flux.2 Klein both use this exact shape. Unlike Flux.1 (which
// needs a DualCLIPLoader + FluxGuidance node) these newer models load a single
// CLIP with a model-specific `type` and sample with a plain KSampler. The
// negative prompt gets its OWN CLIPTextEncode node here — so "no text/border"
// negatives are live wherever cfg > 1, and merely inert (not silently wired to
// the positive node, the Flux.1 path's bug) at the cfg-1 distilled settings.

export type ComfyWorkflow = Record<string, ComfyWorkflowNode>

export type ComfyWorkflowNode = {
  class_type?: string
  inputs?: Record<string, unknown>
  _meta?: Record<string, unknown>
}

export function resolveComfySeed(seed?: number | null): number {
  if (typeof seed === 'number' && Number.isFinite(seed) && seed >= 0) {
    return Math.floor(seed)
  }
  return Math.floor(Math.random() * 1_000_000_000_000_000)
}

export type SimpleCheckpointInput = {
  prompt: string
  negativePrompt: string
  width: number
  height: number
  steps: number
  cfg: number
  seed: number
  sampler: string
  scheduler: string
  denoise: number
  // Loader: 'UnetLoaderGGUF' for a .gguf, 'UNETLoader' for an fp8/safetensors.
  unetLoader: 'UnetLoaderGGUF' | 'UNETLoader'
  unetName: string
  unetDtype?: string
  clipName: string
  clipType: string
  vaeName: string
  filenamePrefix: string
  // Optional model-only style LoRA (comic/ink/lineart) for the inked look.
  loraName?: string | null
  loraStrength?: number | null
}

export function buildSimpleCheckpointWorkflow(input: SimpleCheckpointInput): {
  workflow: ComfyWorkflow
  seed: number
} {
  const seed = resolveComfySeed(input.seed)
  const text = input.prompt.trim() || 'a beautiful, richly detailed illustration'

  const loaderInputs: Record<string, unknown> =
    input.unetLoader === 'UnetLoaderGGUF'
      ? { unet_name: input.unetName }
      : { unet_name: input.unetName, weight_dtype: input.unetDtype ?? 'default' }

  const workflow: ComfyWorkflow = {
    '1': {
      inputs: loaderInputs,
      class_type: input.unetLoader,
      _meta: { title: 'Load Diffusion Model' },
    },
    '2': {
      inputs: {
        clip_name: input.clipName,
        type: input.clipType,
        device: 'default',
      },
      class_type: 'CLIPLoader',
      _meta: { title: 'Load CLIP' },
    },
    '3': {
      inputs: { text, clip: ['2', 0] },
      class_type: 'CLIPTextEncode',
      _meta: { title: 'Positive Prompt' },
    },
    '4': {
      inputs: { text: input.negativePrompt || '', clip: ['2', 0] },
      class_type: 'CLIPTextEncode',
      _meta: { title: 'Negative Prompt' },
    },
    '5': {
      inputs: { vae_name: input.vaeName },
      class_type: 'VAELoader',
      _meta: { title: 'Load VAE' },
    },
    '6': {
      inputs: { width: input.width, height: input.height, batch_size: 1 },
      class_type: 'EmptyLatentImage',
      _meta: { title: 'Empty Latent Image' },
    },
    '7': {
      inputs: {
        seed,
        steps: input.steps,
        cfg: input.cfg,
        sampler_name: input.sampler,
        scheduler: input.scheduler,
        denoise: input.denoise,
        model: ['1', 0],
        positive: ['3', 0],
        negative: ['4', 0],
        latent_image: ['6', 0],
      },
      class_type: 'KSampler',
      _meta: { title: 'KSampler' },
    },
    '8': {
      inputs: { samples: ['7', 0], vae: ['5', 0] },
      class_type: 'VAEDecode',
      _meta: { title: 'VAE Decode' },
    },
    '9': {
      inputs: { filename_prefix: input.filenamePrefix, images: ['8', 0] },
      class_type: 'SaveImage',
      _meta: { title: 'Save Image' },
    },
  }

  if (input.loraName) {
    workflow['10'] = {
      inputs: {
        model: ['1', 0],
        lora_name: input.loraName,
        strength_model:
          typeof input.loraStrength === 'number' ? input.loraStrength : 1.0,
      },
      class_type: 'LoraLoaderModelOnly',
      _meta: { title: 'Style LoRA' },
    }

    // Route the sampler's model through the LoRA; CLIP stays on the encoder.
    const sampler = workflow['7']
    if (!sampler?.inputs) {
      throw new Error('KSampler node is missing from the simple checkpoint workflow.')
    }
    sampler.inputs.model = ['10', 0]
  }

  return { workflow, seed }
}
