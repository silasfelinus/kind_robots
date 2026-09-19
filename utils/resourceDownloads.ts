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

export type CivitaiBaseModelFamily = {
  id: string
  label: string
  baseModels: readonly string[]
  kindRobotsSupported: boolean
}

// The UI chooses a useful FAMILY; the proxy expands it to Civitai's exact
// BaseModel enum strings. This keeps version noise out of the dropdown without
// throwing away search coverage. "Supported" means Kind Robots currently has
// a generation lane/checkpoint family that can actually use LoRAs from that
// family, so those choices deserve first billing in Discover.
export const CIVITAI_BASE_MODEL_FAMILIES = [
  {
    id: 'krea2',
    label: 'Krea 2',
    baseModels: ['Krea 2'],
    kindRobotsSupported: true,
  },
  {
    id: 'flux2',
    label: 'FLUX.2',
    baseModels: [
      'Flux.2 D',
      'Flux.2 Klein 9B',
      'Flux.2 Klein 9B-base',
      'Flux.2 Klein 4B',
      'Flux.2 Klein 4B-base',
    ],
    kindRobotsSupported: true,
  },
  {
    id: 'sdxl',
    label: 'SDXL',
    baseModels: [
      'SDXL 0.9',
      'SDXL 1.0',
      'SDXL 1.0 LCM',
      'SDXL Distilled',
      'SDXL Turbo',
      'SDXL Lightning',
      'SDXL Hyper',
    ],
    kindRobotsSupported: true,
  },
  {
    id: 'pony',
    label: 'Pony',
    baseModels: ['Pony', 'Pony V7'],
    kindRobotsSupported: true,
  },
  {
    id: 'sd15',
    label: 'SD 1.5',
    baseModels: ['SD 1.4', 'SD 1.5', 'SD 1.5 LCM', 'SD 1.5 Hyper'],
    kindRobotsSupported: true,
  },
  {
    id: 'zimage',
    label: 'Z-Image',
    baseModels: ['ZImageTurbo', 'ZImageBase'],
    kindRobotsSupported: true,
  },
  {
    id: 'flux1',
    label: 'FLUX.1',
    baseModels: ['Flux.1 S', 'Flux.1 D', 'Flux.1 Krea', 'Flux.1 Kontext'],
    kindRobotsSupported: false,
  },
  {
    id: 'illustrious',
    label: 'Illustrious',
    baseModels: ['Illustrious'],
    kindRobotsSupported: false,
  },
  {
    id: 'noobai',
    label: 'NoobAI',
    baseModels: ['NoobAI'],
    kindRobotsSupported: false,
  },
  {
    id: 'sd2',
    label: 'SD 2.x',
    baseModels: ['SD 2.0', 'SD 2.0 768', 'SD 2.1', 'SD 2.1 768', 'SD 2.1 Unclip'],
    kindRobotsSupported: false,
  },
  {
    id: 'sd3',
    label: 'SD 3 / 3.5',
    baseModels: [
      'SD 3',
      'SD 3.5',
      'SD 3.5 Medium',
      'SD 3.5 Large',
      'SD 3.5 Large Turbo',
    ],
    kindRobotsSupported: false,
  },
  {
    id: 'qwen',
    label: 'Qwen',
    baseModels: ['Qwen'],
    kindRobotsSupported: false,
  },
  {
    id: 'other-image',
    label: 'Other image',
    baseModels: [
      'Kolors',
      'PixArt a',
      'PixArt E',
      'AuraFlow',
      'Chroma',
      'HiDream',
      'Lumina',
      'Stable Cascade',
      'Anima',
    ],
    kindRobotsSupported: false,
  },
  {
    id: 'video',
    label: 'Video',
    baseModels: [
      'Hunyuan Video',
      'Mochi',
      'LTXV',
      'LTXV2',
      'LTXV 2.3',
      'LTXV 2.5',
      'SVD',
      'SVD XT',
      'Wan Video',
      'Wan Video 1.3B t2v',
      'Wan Video 14B t2v',
      'Wan Video 14B i2v 480p',
      'Wan Video 14B i2v 720p',
      'Wan Video 2.2 I2V-A14B',
      'Wan Video 2.2 T2V-A14B',
      'Wan Video 2.2 TI2V-5B',
      'Wan Video 2.5 T2V',
      'Wan Video 2.5 I2V',
    ],
    kindRobotsSupported: false,
  },
] as const satisfies readonly CivitaiBaseModelFamily[]

export type CivitaiBaseModelFamilyId =
  (typeof CIVITAI_BASE_MODEL_FAMILIES)[number]['id']

export const CIVITAI_SUPPORTED_BASE_MODEL_FAMILIES =
  CIVITAI_BASE_MODEL_FAMILIES.filter((family) => family.kindRobotsSupported)

export const CIVITAI_OTHER_BASE_MODEL_FAMILIES =
  CIVITAI_BASE_MODEL_FAMILIES.filter((family) => !family.kindRobotsSupported)

export const CIVITAI_BASE_MODELS = CIVITAI_BASE_MODEL_FAMILIES.flatMap(
  (family) => family.baseModels,
)

export function civitaiBaseModelsForFamily(value: unknown): readonly string[] {
  const candidate = String(value ?? '').trim()
  if (!candidate) return []

  const family = CIVITAI_BASE_MODEL_FAMILIES.find(
    (entry) => entry.id === candidate,
  )
  if (family) return family.baseModels

  // Backward compatibility for bookmarked URLs from the earlier exact-value
  // dropdown. New UI only emits family ids.
  return CIVITAI_BASE_MODELS.includes(
    candidate as (typeof CIVITAI_BASE_MODELS)[number],
  )
    ? [candidate]
    : []
}

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
