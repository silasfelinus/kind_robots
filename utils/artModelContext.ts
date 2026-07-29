export const ART_MODEL_TYPES = [
  'project',
  'bot',
  'character',
  'dream',
  'scenario',
  'reward',
  'facet',
] as const

export type ArtModelType = (typeof ART_MODEL_TYPES)[number]

export type ArtModelRef = {
  modelType: ArtModelType
  id?: number
  slug?: string
}

const ART_MODEL_TYPE_SET = new Set<string>(ART_MODEL_TYPES)

export function normalizeArtModelType(value: unknown): ArtModelType | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase().replace(/s$/, '')
  return ART_MODEL_TYPE_SET.has(normalized)
    ? (normalized as ArtModelType)
    : null
}

export function normalizeArtModelRef(value: unknown): ArtModelRef | null {
  if (!value || typeof value !== 'object') return null
  const source = value as Record<string, unknown>
  const modelType = normalizeArtModelType(source.modelType ?? source.type)
  if (!modelType) return null

  const numericId = Number(source.id)
  const id = Number.isInteger(numericId) && numericId > 0 ? numericId : undefined
  const slug =
    typeof source.slug === 'string' && source.slug.trim()
      ? source.slug.trim().slice(0, 160)
      : undefined

  if (!id && !slug) return null
  return { modelType, ...(id ? { id } : {}), ...(slug ? { slug } : {}) }
}
