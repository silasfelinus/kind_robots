// /server/api/comfy/krea2/utils/workflow.ts
//
// Krea 2 Turbo (Qwen-Image lineage) workflow builder. An 8-step distilled DiT
// tuned for illustration/painting — the "extreme creativity" lane — and fast on
// a 12GB card. Stack: single CLIPLoader (type "krea2") -> Qwen3-VL encoder,
// Qwen-Image VAE, plain KSampler (no FluxGuidance). Negatives are inert at
// cfg 1 but correctly wired.
//
// Krea is caption-conditioned rather than instruction-following. Every caller
// reaches the semantic prompt scrubber here, including direct ArtJob producers,
// so application/entity labels and prompt-writing instructions cannot leak into
// the positive conditioning even when an upstream surface still carries them as
// request metadata.
//
// VERIFY the three filenames against the ComfyUI models folders you download
// into; GGUF users flip KREA2_UNET_LOADER to 'UnetLoaderGGUF' and point
// KREA2_MODEL at the .gguf (lighter on 12GB VRAM).
import {
  buildSimpleCheckpointWorkflow,
  type ComfyWorkflow,
} from '../../utils/simpleCheckpointWorkflow'
import type { LoraSelectionInput } from '../../utils/loraChain'
import {
  buildKreaSemanticPrompt,
  rewriteKreaWorkflowPositivePrompt,
} from '../../../../../utils/kreaSemanticPrompt'

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
  imageName?: string | null
  loraName?: string | null
  loraStrength?: number | null
  loras?: LoraSelectionInput[] | null
}): { workflow: ComfyWorkflow; seed: number } {
  const requestPrompt = input.prompt?.trim() || ''
  const semanticPrompt = buildKreaSemanticPrompt(requestPrompt)
  const imageName = input.imageName?.trim()
  const denoise = input.denoise ?? (imageName ? 0.65 : 1)
  if (!Number.isFinite(denoise) || denoise <= 0 || denoise > 1) {
    throw new Error('Krea 2 denoise must be greater than 0 and at most 1.')
  }
  const built = buildSimpleCheckpointWorkflow({
    prompt: semanticPrompt,
    negativePrompt: input.negativePrompt ?? '',
    width: input.width ?? KREA2_DEFAULT_WIDTH,
    height: input.height ?? KREA2_DEFAULT_HEIGHT,
    steps: input.steps ?? KREA2_DEFAULT_STEPS,
    cfg: input.cfg ?? KREA2_DEFAULT_CFG,
    seed: input.seed ?? -1,
    sampler: input.sampler ?? KREA2_DEFAULT_SAMPLER,
    scheduler: input.scheduler ?? KREA2_DEFAULT_SCHEDULER,
    denoise,
    unetLoader: KREA2_UNET_LOADER,
    unetName: KREA2_MODEL,
    clipName: KREA2_CLIP,
    clipType: KREA2_CLIP_TYPE,
    vaeName: KREA2_VAE,
    filenamePrefix: 'kindrobots_krea2',
    loraName: input.loraName ?? null,
    loraStrength: input.loraStrength ?? null,
    loras: input.loras ?? null,
  })

  // Preserve the caller's raw request only as Comfy `_meta` provenance. The
  // positive CLIP node continues to receive semanticPrompt. This keeps legacy
  // ArtJob provenance checks able to reconcile the request without ever feeding
  // the contextual wording to Krea.
  const rewritten = rewriteKreaWorkflowPositivePrompt(
    built.workflow,
    requestPrompt || semanticPrompt,
  )

  if (imageName) {
    const workflow = rewritten.workflow
    const imageId = String(Math.max(...Object.keys(workflow).map(Number)) + 1)
    const encodeId = String(Number(imageId) + 1)
    workflow[imageId] = {
      class_type: 'LoadImage',
      inputs: { image: imageName },
      _meta: { title: 'Load Krea Source Image' },
    }
    workflow[encodeId] = {
      class_type: 'VAEEncode',
      inputs: { pixels: [imageId, 0], vae: ['5', 0] },
      _meta: { title: 'Encode Krea Source Image' },
    }
    const sampler = workflow['7']?.inputs
    if (!sampler) {
      throw new Error('Krea 2 sampler is missing from the workflow.')
    }
    sampler.latent_image = [encodeId, 0]
    delete workflow['6']
  }

  return { workflow: rewritten.workflow, seed: built.seed }
}
