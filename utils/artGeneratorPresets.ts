// /utils/artGeneratorPresets.ts
//
// One table describing what the art generator can actually ask ComfyUI to do.
//
// Silas, 2026-08-09: "any (all) gen tasks should be comfy, and comfy should
// generally be the default." Every engine below is a Comfy lane; OpenAI images
// and A1111 are deliberately absent (an A1111 server a user adds is still
// reachable through /api/art/generate, it is just not something the generator
// offers to pick).
//
// WHY A CAPABILITY MATRIX AND NOT JUST DEFAULT NUMBERS. The old generator drew
// a checkpoint dropdown, a sampler dropdown, and a steps box and implied all
// three reached the renderer. They mostly did not: server/api/art/enqueue.post.ts
// only forwards `checkpoint` on the `comfy` lane -- krea2, flux2, and flux build
// their model into the workflow -- and only krea2/flux2/comfy carry a LoRA. A
// control that silently does nothing is worse than a missing one, so the
// generator reads `supports` here and hides (rather than fakes) what the chosen
// lane ignores.
//
// Every number below is the server's own default, imported in spirit from:
//   server/api/comfy/krea2/utils/workflow.ts   (8 steps, cfg 1, euler/simple)
//   server/api/comfy/flux2/utils/workflow.ts   (4 steps, cfg 1, euler/simple)
//   server/api/comfy/flux/utils/workflow.ts    (dev 30/schnell 8, euler/beta)
//   server/api/comfy/sdxl/utils/workflow.ts    (distilled 8/2, standard 20/3)
// Keep them in sync -- utils/scripts/verifyArtGeneratorPresets.ts asserts it.

export type ArtGeneratorEngine = 'krea2' | 'flux2' | 'flux' | 'comfy'

export type FluxVariant = 'dev' | 'schnell'

export type ArtEngineSupport = {
  /** The `checkpoint` field reaches the workflow (only the named-checkpoint lane). */
  checkpoint: boolean
  /** `loraName` / `loraStrength` reach a LoraLoader node. */
  lora: boolean
  negativePrompt: boolean
  sampler: boolean
  scheduler: boolean
  size: boolean
  /** Flux's separate CFG-distilled guidance value. */
  guidance: boolean
}

export type ArtEngineProfile = {
  engine: ArtGeneratorEngine
  label: string
  blurb: string
  supports: ArtEngineSupport
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
      },
    },
    flux2: {
      engine: 'flux2',
      label: 'FLUX.2 Klein',
      blurb: 'Fastest lane here — four steps. Model baked in, LoRA supported.',
      supports: {
        checkpoint: false,
        lora: true,
        negativePrompt: true,
        sampler: true,
        scheduler: true,
        size: true,
        guidance: false,
      },
    },
    flux: {
      engine: 'flux',
      label: 'FLUX.1',
      blurb:
        'Highest fidelity, slowest. Uses its own guidance value instead of CFG, and does not take a LoRA.',
      supports: {
        checkpoint: false,
        lora: false,
        negativePrompt: true,
        sampler: true,
        scheduler: true,
        size: true,
        guidance: true,
      },
    },
    comfy: {
      engine: 'comfy',
      label: 'SDXL checkpoint',
      blurb:
        'The only lane that renders a checkpoint you choose. Takes a LoRA on top of it.',
      supports: {
        checkpoint: true,
        lora: true,
        negativePrompt: true,
        sampler: true,
        scheduler: false,
        size: true,
        guidance: false,
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
  /**
   * Checkpoint families this preset is the sensible default for. Empty means
   * the preset does not care (its engine ignores the checkpoint anyway).
   */
  families: CheckpointFamily[]
}

export const ART_GENERATOR_PRESETS: ArtGeneratorPreset[] = [
  {
    id: 'krea2-turbo',
    label: 'Krea 2 · Fast',
    blurb: '8 steps, cfg 1. What you get when you say nothing.',
    engine: 'krea2',
    steps: 8,
    cfg: 1,
    sampler: 'euler',
    scheduler: 'simple',
    width: 1024,
    height: 1024,
    guidance: null,
    variant: null,
    families: [],
  },
  {
    id: 'krea2-detailed',
    label: 'Krea 2 · Detailed',
    blurb: 'Same lane, 16 steps. Slower, cleaner edges.',
    engine: 'krea2',
    steps: 16,
    cfg: 1,
    sampler: 'euler',
    scheduler: 'simple',
    width: 1024,
    height: 1024,
    guidance: null,
    variant: null,
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
    families: [],
  },
  {
    id: 'sdxl-distilled',
    label: 'SDXL checkpoint · Turbo',
    blurb:
      '8 steps, cfg 2, dpmpp_sde/karras — for Turbo, Lightning, LCM, Hyper.',
    engine: 'comfy',
    steps: 8,
    cfg: 2,
    sampler: 'dpmpp_sde',
    scheduler: 'karras',
    width: 1024,
    height: 1024,
    guidance: null,
    variant: null,
    families: ['sdxl-distilled', 'pony'],
  },
  {
    id: 'sdxl-standard',
    label: 'SDXL checkpoint · Standard',
    blurb: '20 steps, cfg 3, euler — for undistilled SDXL checkpoints.',
    engine: 'comfy',
    steps: 20,
    cfg: 3,
    sampler: 'euler',
    scheduler: 'normal',
    width: 1024,
    height: 1024,
    guidance: null,
    variant: null,
    families: ['sdxl', 'sd15', 'archive', 'unknown'],
  },
]

export const DEFAULT_ART_PRESET_ID = 'krea2-turbo'

export type CheckpointFamily =
  'sdxl' | 'sdxl-distilled' | 'pony' | 'sd15' | 'archive' | 'unknown'

export const CHECKPOINT_FAMILY_LABELS: Record<CheckpointFamily, string> = {
  sdxl: 'SDXL',
  'sdxl-distilled': 'SDXL Turbo/Lightning',
  pony: 'Pony',
  sd15: 'SD 1.5',
  archive: 'Archive',
  unknown: 'Unrecognised',
}

// Mirrors DISTILLED_CHECKPOINT_PATTERN in server/api/comfy/sdxl/utils/workflow.ts.
// The server profiles by the same words, so the numbers the panel shows are the
// numbers the render will actually use when the caller leaves them alone.
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

  if (generation === 'pony') return 'pony'
  if (generation === 'archive') return 'archive'
  if (generation === '1.5' || generation === 'sd15') return 'sd15'

  if (DISTILLED_PATTERN.test(text)) return 'sdxl-distilled'
  if (generation === 'sdxl' || /sdxl|xl\b/i.test(text)) return 'sdxl'

  return 'unknown'
}

/** The preset that best matches a checkpoint, for the named-checkpoint lane. */
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

/** Settings a preset writes into the art form when it is applied. */
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
