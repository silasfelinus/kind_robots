// /utils/artGeneratorPresets.ts
//
// Product-owned image generation quality profiles.
//
// The UI/store chooses one of these profiles, resolves it to explicit values,
// and sends those values with the ArtJob. Server workflow builders may retain
// defensive fallbacks for legacy/script callers, but those fallbacks are not
// the product source of truth and must not silently redefine these profiles.
//
// Every engine below is a Comfy lane. OpenAI images and A1111 are deliberately
// absent from the primary generator profile catalog.

export type ArtGeneratorEngine =
  | 'krea2'
  | 'flux2'
  | 'flux'
  | 'kontext'
  | 'comfy'
  | 'sdxl-img2img'

export type FluxVariant = 'dev' | 'schnell'
export type ArtRuntimeClass = 'fast' | 'standard' | 'slow'
export type SourceImageSupport = 'none' | 'optional' | 'required'

export type ArtEngineSupport = {
  checkpoint: boolean
  lora: boolean
  negativePrompt: boolean
  sampler: boolean
  scheduler: boolean
  size: boolean
  guidance: boolean
  sourceImage: SourceImageSupport
  sourceImageStrength: boolean
  sourceImageOwnsSize: boolean
}

export type ArtEngineProfile = {
  engine: ArtGeneratorEngine
  label: string
  blurb: string
  supports: ArtEngineSupport
  negativePromptNote?: string
}

export const ART_ENGINE_PROFILES: Record<ArtGeneratorEngine, ArtEngineProfile> =
  {
    krea2: {
      engine: 'krea2',
      label: 'Krea 2 Turbo',
      blurb:
        'The house default. Its model is baked into the workflow, so there is no checkpoint to pick — but it takes a LoRA.',
      supports: {
        checkpoint: false,
        lora: true,
        negativePrompt: true,
        sampler: true,
        scheduler: true,
        size: true,
        guidance: false,
        sourceImage: 'none',
        sourceImageStrength: false,
        sourceImageOwnsSize: false,
      },
      negativePromptNote:
        'At the default CFG 1, negative conditioning has little to no effect. Raise CFG only when you intentionally want it active.',
    },
    flux2: {
      engine: 'flux2',
      label: 'FLUX.2 Klein',
      blurb:
        'Fastest lane here — four steps. Model baked in, LoRA supported, with optional reference-image editing.',
      supports: {
        checkpoint: false,
        lora: true,
        negativePrompt: true,
        sampler: true,
        scheduler: true,
        size: true,
        guidance: false,
        sourceImage: 'optional',
        sourceImageStrength: false,
        sourceImageOwnsSize: true,
      },
      negativePromptNote:
        'At the default CFG 1, negative conditioning has little to no effect. Raise CFG only when you intentionally want it active.',
    },
    flux: {
      engine: 'flux',
      label: 'FLUX.1',
      blurb:
        'Highest fidelity, slowest. Uses its own guidance value instead of CFG. Takes a FLUX.1 LoRA -- not a FLUX.2 or Kontext one.',
      supports: {
        checkpoint: false,
        lora: true,
        negativePrompt: false,
        sampler: true,
        scheduler: true,
        size: true,
        guidance: true,
        sourceImage: 'optional',
        sourceImageStrength: true,
        sourceImageOwnsSize: true,
      },
    },
    kontext: {
      engine: 'kontext',
      label: 'FLUX.1 Kontext',
      blurb:
        'Image-editing model: bring a source picture, then describe the change. Supports Kontext/Flux LoRAs.',
      supports: {
        checkpoint: false,
        lora: true,
        negativePrompt: true,
        sampler: true,
        scheduler: true,
        size: true,
        guidance: true,
        sourceImage: 'required',
        sourceImageStrength: true,
        sourceImageOwnsSize: true,
      },
    },
    'sdxl-img2img': {
      engine: 'sdxl-img2img',
      label: 'Checkpoint image-to-image',
      blurb:
        'Optional source-image mode for named SDXL, Pony, Illustrious, and SD 1.5 checkpoints. Strength controls how far the render travels from the upload.',
      supports: {
        checkpoint: true,
        lora: true,
        negativePrompt: true,
        sampler: true,
        scheduler: true,
        size: false,
        guidance: false,
        sourceImage: 'required',
        sourceImageStrength: true,
        sourceImageOwnsSize: true,
      },
    },
    comfy: {
      engine: 'comfy',
      label: 'Checkpoint',
      blurb:
        'The lane for a checkpoint you choose: SDXL, Pony, Illustrious, SD 1.5, and compatible variants. Takes a LoRA on top of it.',
      supports: {
        checkpoint: true,
        lora: true,
        negativePrompt: true,
        sampler: true,
        scheduler: false,
        size: true,
        guidance: false,
        sourceImage: 'optional',
        sourceImageStrength: true,
        sourceImageOwnsSize: true,
      },
    },
  }

export type ArtGeneratorPreset = {
  id: string
  label: string
  blurb: string
  engine: ArtGeneratorEngine
  steps: number
  cfg: number
  sampler: string | null
  scheduler: string | null
  width: number
  height: number
  guidance: number | null
  variant: FluxVariant | null
  runtimeClass: ArtRuntimeClass
  families: CheckpointFamily[]
}

export const ART_GENERATOR_PRESETS: ArtGeneratorPreset[] = [
  {
    id: 'krea2-turbo',
    label: 'Krea 2 · Fast',
    blurb: '8 steps, cfg 1. The standard Kind Robots image-generation default.',
    engine: 'krea2',
    steps: 8,
    cfg: 1,
    sampler: 'euler',
    scheduler: 'simple',
    width: 1024,
    height: 1024,
    guidance: null,
    variant: null,
    runtimeClass: 'fast',
    families: [],
  },
  {
    id: 'flux2-klein',
    label: 'FLUX.2 Klein · Fastest',
    blurb: '4 steps. Good for iterating on a prompt before committing.',
    engine: 'flux2',
    steps: 4,
    cfg: 1,
    sampler: 'euler',
    scheduler: 'simple',
    width: 1024,
    height: 1024,
    guidance: null,
    variant: null,
    runtimeClass: 'fast',
    families: [],
  },
  {
    id: 'flux-schnell',
    label: 'FLUX.1 schnell',
    blurb: '8 steps, guidance 4. Apache-licensed weights.',
    engine: 'flux',
    steps: 8,
    cfg: 1,
    sampler: 'euler',
    scheduler: 'beta',
    width: 1024,
    height: 1024,
    guidance: 4,
    variant: 'schnell',
    runtimeClass: 'standard',
    families: [],
  },
  {
    id: 'flux-dev',
    label: 'FLUX.1 dev · Best quality',
    blurb: '30 steps, guidance 3.5. The slow one worth waiting for.',
    engine: 'flux',
    steps: 30,
    cfg: 1,
    sampler: 'euler',
    scheduler: 'beta',
    width: 1024,
    height: 1024,
    guidance: 3.5,
    variant: 'dev',
    runtimeClass: 'slow',
    families: [],
  },
  {
    id: 'kontext-edit',
    label: 'FLUX.1 Kontext · Edit',
    blurb:
      'Source image required. 10 steps, guidance 2.5, built for directed edits.',
    engine: 'kontext',
    steps: 10,
    cfg: 2.5,
    sampler: 'euler',
    scheduler: 'simple',
    width: 1024,
    height: 1024,
    guidance: 2.5,
    variant: null,
    runtimeClass: 'standard',
    families: [],
  },
  {
    id: 'sdxl-distilled',
    label: 'Checkpoint · Turbo',
    blurb:
      '8 steps, cfg 2, dpmpp_sde/karras — for distilled Turbo, Lightning, LCM, and Hyper checkpoints.',
    engine: 'comfy',
    steps: 8,
    cfg: 2,
    sampler: 'dpmpp_sde',
    scheduler: 'karras',
    width: 1024,
    height: 1024,
    guidance: null,
    variant: null,
    runtimeClass: 'fast',
    families: ['sdxl-distilled', 'pony'],
  },
  {
    id: 'sdxl-standard',
    label: 'Checkpoint · Standard',
    blurb:
      '20 steps, cfg 3, euler — for SDXL, Pony, Illustrious, SD 1.5, and other undistilled checkpoints.',
    engine: 'comfy',
    steps: 20,
    cfg: 3,
    sampler: 'euler',
    scheduler: 'normal',
    width: 1024,
    height: 1024,
    guidance: null,
    variant: null,
    runtimeClass: 'standard',
    families: ['sdxl', 'illustrious', 'sd15', 'archive', 'unknown'],
  },
]

export const DEFAULT_ART_PRESET_ID = 'krea2-turbo'

export type CheckpointFamily =
  | 'sdxl'
  | 'sdxl-distilled'
  | 'pony'
  | 'illustrious'
  | 'sd15'
  | 'archive'
  | 'unknown'

export const CHECKPOINT_FAMILY_LABELS: Record<CheckpointFamily, string> = {
  sdxl: 'SDXL',
  'sdxl-distilled': 'SDXL Turbo/Lightning',
  pony: 'Pony',
  illustrious: 'Illustrious / NoobAI',
  sd15: 'SD 1.5',
  archive: 'Archive',
  unknown: 'Unrecognised',
}

const DISTILLED_PATTERN = /(turbo|lightning|lcm|hyper)/i

export type CheckpointLike = {
  name?: string | null
  customLabel?: string | null
  localPath?: string | null
  generation?: string | null
}

function checkpointText(checkpoint: CheckpointLike | null | undefined): string {
  if (!checkpoint) return ''
  return [checkpoint.name, checkpoint.localPath, checkpoint.customLabel]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
}

export function detectCheckpointFamily(
  checkpoint: CheckpointLike | null | undefined,
): CheckpointFamily {
  if (!checkpoint) return 'unknown'

  const generation = String(checkpoint.generation || '')
    .trim()
    .toLowerCase()
  const text = checkpointText(checkpoint)
  const localPath = String(checkpoint.localPath || '').replaceAll('\\', '/')
  const directory = localPath.split('/')[0]?.toLowerCase() || ''

  if (DISTILLED_PATTERN.test(text)) return 'sdxl-distilled'

  // Resource.generation is stale on several live checkpoints; the importer's
  // Comfy directory is the maintained architecture signal.
  if (directory === 'pony') return 'pony'
  if (directory === 'illustrious' || directory === 'noobai') {
    return 'illustrious'
  }
  if (directory === 'sd15' || directory === 'sd1.5') return 'sd15'
  if (directory === 'sdxl') return 'sdxl'

  if (generation === 'pony') return 'pony'
  if (generation.includes('illustrious') || generation.includes('noobai')) {
    return 'illustrious'
  }
  if (generation === 'archive') return 'archive'
  if (generation === '1.5' || generation === 'sd15') return 'sd15'
  if (generation === 'sdxl' || /sdxl|xl\b/i.test(text)) return 'sdxl'

  return 'unknown'
}

export function presetForCheckpoint(
  checkpoint: CheckpointLike | null | undefined,
): ArtGeneratorPreset {
  const family = detectCheckpointFamily(checkpoint)
  const match = ART_GENERATOR_PRESETS.find(
    (preset) => preset.engine === 'comfy' && preset.families.includes(family),
  )
  return match ?? getPreset('sdxl-standard')
}

export function getPreset(id: string): ArtGeneratorPreset {
  const found = ART_GENERATOR_PRESETS.find((preset) => preset.id === id)
  if (found) return found

  const fallback = ART_GENERATOR_PRESETS.find(
    (preset) => preset.id === DEFAULT_ART_PRESET_ID,
  )
  if (!fallback) {
    throw new Error('artGeneratorPresets: the default preset is missing.')
  }
  return fallback
}

export function engineProfile(engine: ArtGeneratorEngine): ArtEngineProfile {
  return ART_ENGINE_PROFILES[engine]
}

export type PresetSettings = {
  engine: ArtGeneratorEngine
  steps: number
  cfg: number
  sampler: string | null
  scheduler: string | null
  width: number
  height: number
  guidance: number | null
  variant: FluxVariant | null
}

const SD15_DIMENSIONS = [512, 576, 640, 704, 768] as const
const XL_DIMENSIONS = [768, 832, 896, 1024, 1152, 1216, 1344] as const

/**
 * Dimensions the primary generator can offer without turning two numeric boxes
 * into an invitation to invent arbitrary, model-hostile sizes.
 *
 * SD 1.5 stays in its smaller training neighborhood. Krea 2, FLUX and the
 * XL/Pony families use the common XL-side dimensions; callers may preserve an
 * existing odd value separately so editing a legacy job does not erase it.
 */
export function artDimensionOptions(
  engine: ArtGeneratorEngine,
  checkpointFamily: CheckpointFamily = 'unknown',
): number[] {
  if (!ART_ENGINE_PROFILES[engine].supports.size) return []
  if (engine === 'comfy' && checkpointFamily === 'sd15') {
    return [...SD15_DIMENSIONS]
  }
  return [...XL_DIMENSIONS]
}

export function presetSettings(preset: ArtGeneratorPreset): PresetSettings {
  return {
    engine: preset.engine,
    steps: preset.steps,
    cfg: preset.cfg,
    sampler: preset.sampler,
    scheduler: preset.scheduler,
    width: preset.width,
    height: preset.height,
    guidance: preset.guidance,
    variant: preset.variant,
  }
}

export function defaultPresetSettings(): PresetSettings {
  return presetSettings(getPreset(DEFAULT_ART_PRESET_ID))
}
