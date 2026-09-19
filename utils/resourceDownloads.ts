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
