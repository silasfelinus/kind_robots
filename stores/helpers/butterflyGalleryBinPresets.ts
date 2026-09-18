import type {
  ButterflyBinConfig,
  ButterflyBinKind,
  ButterflyGenerationAction,
} from '@/types/butterflyGallery'

// Re-exported for existing importers (butterflyGalleryPresetStore.ts,
// ButterflyGalleryPresetEditor.vue) -- the type now lives in
// types/butterflyGallery.ts alongside the rest of the generation contract
// (butterfly-gallery/t-019) so it can be shared with the ArtJob submission
// seam without those files reaching back into this one.
export type { ButterflyGenerationAction }

export type ButterflyCustomBinPreset = ButterflyBinConfig & {
  actions: ButterflyGenerationAction[]
}

export type ButterflyBinPresetEnvelope = {
  version: 1
  bins: ButterflyCustomBinPreset[]
}

export const BUTTERFLY_BIN_PRESETS_KEY =
  'kind-robots:butterfly-gallery:bin-presets:v1'

const BIN_KINDS = new Set<ButterflyBinKind>([
  'processed',
  'unprocessed',
  'rating',
  'trash',
  'collection',
  'needs-review',
  'move',
  'preset',
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isBinKind(value: unknown): value is ButterflyBinKind {
  return typeof value === 'string' && BIN_KINDS.has(value as ButterflyBinKind)
}

function isGenerationAction(
  value: unknown,
): value is ButterflyGenerationAction {
  if (!isRecord(value) || typeof value.kind !== 'string') return false

  switch (value.kind) {
    case 'add-lora':
      return (
        typeof value.resource === 'string' &&
        (value.weight === undefined || typeof value.weight === 'number')
      )
    case 'replace-lora':
      return (
        typeof value.from === 'string' &&
        typeof value.to === 'string' &&
        (value.weight === undefined || typeof value.weight === 'number')
      )
    case 'switch-checkpoint':
      return typeof value.resource === 'string'
    case 'append-prompt':
    case 'replace-prompt':
      return typeof value.text === 'string'
    case 'set-generation':
      return isRecord(value.values)
    case 'add-variant':
    case 'request-replacement':
      return true
    default:
      return false
  }
}

function isCustomBin(value: unknown): value is ButterflyCustomBinPreset {
  if (!isRecord(value)) return false
  return (
    typeof value.id === 'string' &&
    typeof value.label === 'string' &&
    (value.side === 'left' || value.side === 'right') &&
    typeof value.icon === 'string' &&
    isBinKind(value.kind) &&
    isRecord(value.payload) &&
    typeof value.sortOrder === 'number' &&
    typeof value.enabled === 'boolean' &&
    Array.isArray(value.actions) &&
    value.actions.every(isGenerationAction)
  )
}

export function parseButterflyBinPresetEnvelope(
  raw: string | null,
): ButterflyBinPresetEnvelope | null {
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (
      !isRecord(parsed) ||
      parsed.version !== 1 ||
      !Array.isArray(parsed.bins)
    ) {
      return null
    }
    if (!parsed.bins.every(isCustomBin)) return null
    return { version: 1, bins: parsed.bins }
  } catch {
    return null
  }
}

export function loadButterflyBinPresets(
  storage: Pick<Storage, 'getItem'>,
): ButterflyCustomBinPreset[] | null {
  return (
    parseButterflyBinPresetEnvelope(storage.getItem(BUTTERFLY_BIN_PRESETS_KEY))
      ?.bins ?? null
  )
}

export function saveButterflyBinPresets(
  storage: Pick<Storage, 'setItem'>,
  bins: ButterflyCustomBinPreset[],
): void {
  const envelope: ButterflyBinPresetEnvelope = { version: 1, bins }
  storage.setItem(BUTTERFLY_BIN_PRESETS_KEY, JSON.stringify(envelope))
}

export function toCustomBinPreset(
  bin: ButterflyBinConfig,
  actions: ButterflyGenerationAction[] = [],
): ButterflyCustomBinPreset {
  return { ...bin, payload: { ...bin.payload }, actions: [...actions] }
}
