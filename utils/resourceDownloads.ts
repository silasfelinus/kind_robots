// Shared model-download taxonomy.
//
// ResourceType is intentionally broader than Civitai's top-level ModelType
// filters. These are the file-backed Resource kinds the home downloader can
// place into a ComfyUI model directory.
export const DOWNLOADABLE_RESOURCE_TYPES = [
  'CHECKPOINT',
  'EMBEDDING',
  'LORA',
  'LYCORIS',
  'HYPERNETWORK',
  'CONTROLNET',
  'VAE',
  'TEXT_ENCODER',
  'DIFFUSION_MODEL',
  'LATENT_UPSCALER',
  'UPSCALER',
] as const

export type DownloadableResourceType =
  (typeof DOWNLOADABLE_RESOURCE_TYPES)[number]

export type CivitaiDiscoverType = {
  resourceType:
    | 'LORA'
    | 'CHECKPOINT'
    | 'EMBEDDING'
    | 'HYPERNETWORK'
    | 'CONTROLNET'
    | 'VAE'
    | 'UPSCALER'
  label: string
  civitaiType: string
}

// Civitai's browse API exposes these as top-level model classes. Kind Robots
// has additional component-level Resource types (DIFFUSION_MODEL,
// TEXT_ENCODER, LATENT_UPSCALER) that are still valid downloads/imports, but
// they are not useful standalone Civitai browse tabs.
export const CIVITAI_DISCOVER_TYPES = [
  { resourceType: 'LORA', label: 'LoRAs', civitaiType: 'LORA' },
  {
    resourceType: 'CHECKPOINT',
    label: 'Checkpoints',
    civitaiType: 'Checkpoint',
  },
  {
    resourceType: 'EMBEDDING',
    label: 'Embeddings',
    civitaiType: 'TextualInversion',
  },
  {
    resourceType: 'HYPERNETWORK',
    label: 'Hypernetworks',
    civitaiType: 'Hypernetwork',
  },
  {
    resourceType: 'CONTROLNET',
    label: 'ControlNets',
    civitaiType: 'Controlnet',
  },
  { resourceType: 'VAE', label: 'VAEs', civitaiType: 'VAE' },
  { resourceType: 'UPSCALER', label: 'Upscalers', civitaiType: 'Upscaler' },
] as const satisfies readonly CivitaiDiscoverType[]

export type CivitaiDiscoverResourceType =
  (typeof CIVITAI_DISCOVER_TYPES)[number]['resourceType']

export type CivitaiBaseModelGroup = {
  label: string
  options: readonly string[]
}

// Keep the Discover base filter aligned with every base/generation family the
// local catalog knows how to identify. Exact strings matter: Civitai's
// `baseModels` filter is an enum, not a fuzzy family search.
//
// The contract test cross-checks this list against scan_loras.py BASEMODEL_MAP
// and scan_models.py FOLDER_BASE_HINTS, so adding a new locally-recognized
// family without exposing it here fails CI instead of silently shrinking the
// Discover menu again.
export const CIVITAI_BASE_MODEL_GROUPS = [
  {
    label: 'Krea / Flux',
    options: [
      'Krea 2',
      'Krea 1',
      'Krea',
      'Flux.2 D',
      'Flux.2 Klein 9B',
      'Flux.1 D',
      'Flux.1 S',
      'Flux.1 Kontext',
      'Flux.1',
    ],
  },
  {
    label: 'SDXL families',
    options: [
      'Pony',
      'Illustrious',
      'NoobAI',
      'SDXL 1.0',
      'SDXL 0.9',
      'SDXL 1.0 LCM',
      'SDXL Distilled',
      'SDXL Turbo',
      'SDXL Lightning',
      'SDXL Hyper',
    ],
  },
  {
    label: 'Stable Diffusion',
    options: [
      'SD 1.4',
      'SD 1.5',
      'SD 1.5 LCM',
      'SD 1.5 Hyper',
      'SD 2.0',
      'SD 2.1',
      'SD 3',
      'SD 3.5',
      'SD 3.5 Medium',
      'SD 3.5 Large',
    ],
  },
  {
    label: 'Other image families',
    options: [
      'ZImage',
      'Z-Image Turbo',
      'Qwen',
      'Kolors',
      'PixArt A',
      'PixArt E',
      'AuraFlow',
    ],
  },
  {
    label: 'Video / multimodal',
    options: [
      'Hunyuan',
      'Hunyuan Video',
      'Wan Video',
      'Wan Video 14B i2v 480p',
      'LTXV',
      'LTX Video',
      'SVD Video',
      'Audio',
      '3D',
    ],
  },
] as const satisfies readonly CivitaiBaseModelGroup[]

export const CIVITAI_BASE_MODELS = CIVITAI_BASE_MODEL_GROUPS.flatMap(
  (group) => group.options,
)

export function civitaiDiscoverType(
  value: unknown,
): (typeof CIVITAI_DISCOVER_TYPES)[number] {
  const candidate = String(value ?? '').toUpperCase()
  return (
    CIVITAI_DISCOVER_TYPES.find(
      (entry) => entry.resourceType === candidate,
    ) ?? CIVITAI_DISCOVER_TYPES[0]
  )
}

export function resourceTypeForCivitaiModelType(
  value: unknown,
): CivitaiDiscoverResourceType | null {
  const candidate = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[ _-]+/g, '')
  switch (candidate) {
    case 'lora':
    case 'locon':
    case 'dora':
      return 'LORA'
    case 'checkpoint':
      return 'CHECKPOINT'
    case 'textualinversion':
      return 'EMBEDDING'
    case 'hypernetwork':
      return 'HYPERNETWORK'
    case 'controlnet':
      return 'CONTROLNET'
    case 'vae':
      return 'VAE'
    case 'upscaler':
      return 'UPSCALER'
    default:
      return null
  }
}
