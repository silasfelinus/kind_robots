// /stores/facetCatalogStore.ts
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { performFetch } from '@/stores/utils'
import { normalizeFacetLookupKey } from '@/utils/facetAliases'
import type { BuilderChoice } from '@/stores/helpers/builderCards'

export const FACET_TAXONOMIES = [
  'GENRE',
  'ANIMAL',
  'COLOR',
  'THEME',
  'CORE',
  'MOOD',
  'STYLE',
  'SETTING',
  'ART_DIRECTION',
  'SPECIES',
  'OCCUPATION',
  'ARCHETYPE',
  'ROLE',
  'ALIGNMENT',
  'GENDER',
  'BOT_TYPE',
  'DREAM_TYPE',
  'REWARD_TYPE',
  'RARITY',
  'PERSONALITY',
  'BACKSTORY',
  'QUIRK',
  'MATERIAL',
  'PROMPT_ENHANCEMENT',
  'OTHER',
] as const

export type FacetTaxonomy = (typeof FACET_TAXONOMIES)[number]

export type FacetCatalogEntry = {
  id: number
  title: string
  slug: string | null
  kind: string
  taxonomy: FacetTaxonomy
  canonicalValue: string
  description: string | null
  flavorText: string | null
  examples: string | null
  artPrompt: string | null
  imagePath: string | null
  cardPath: string | null
  heroPath: string | null
  iconPath: string | null
  icon: string | null
  groupKey: string | null
  groupLabel: string | null
  sortOrder: number
  isRandomizable: boolean
  randomWeight: number
  artRequired: boolean
  sourceRank: number
  metadata: Record<string, unknown> | null
  aliases: string[]
  userId: number | null
  isPublic: boolean
  isMature: boolean
  isActive: boolean
  allowReviews: boolean
}

type FacetCatalogQuery = {
  taxonomies?: FacetTaxonomy[]
  includeInactive?: boolean
  includeMature?: boolean
  randomizableOnly?: boolean
  search?: string
  take?: number
  skip?: number
}

type ArtFieldDefinition = {
  taxonomies: FacetTaxonomy[]
  groupKeys?: string[]
}

const FACET_CATALOG_PAGE_SIZE = 1000

export const CHARACTER_FIELD_TAXONOMIES: Record<string, FacetTaxonomy[]> = {
  genre: ['GENRE'],
  species: ['ANIMAL', 'SPECIES'],
  class: ['OCCUPATION', 'ARCHETYPE', 'ROLE'],
  alignment: ['ALIGNMENT'],
  gender: ['GENDER'],
  personality: ['PERSONALITY'],
  backstory: ['BACKSTORY'],
  quirks: ['QUIRK'],
  role: ['ROLE'],
}

export const BOT_FIELD_TAXONOMIES: Record<string, FacetTaxonomy[]> = {
  BotType: ['BOT_TYPE'],
  personality: ['PERSONALITY'],
}

export const SYSTEM_FIELD_TAXONOMIES: Record<string, FacetTaxonomy[]> = {
  dreamType: ['DREAM_TYPE'],
  rewardType: ['REWARD_TYPE'],
  rarity: ['RARITY'],
}

// Art workflow controls (mode, figure count, resources, and negative filters)
// remain operational configuration. Reusable visual vocabulary comes from the
// canonical catalog. Subject types use grouped ART_DIRECTION Facets rather than
// adding another top-level taxonomy solely for one Builder deck.
export const ART_FIELD_FACETS: Record<string, ArtFieldDefinition> = {
  subject: { taxonomies: ['ART_DIRECTION'], groupKeys: ['art-subject'] },
  figureSpecies: { taxonomies: ['ANIMAL', 'SPECIES'] },
  style: { taxonomies: ['STYLE'], groupKeys: ['style'] },
  punk: { taxonomies: ['STYLE'], groupKeys: ['punk'] },
  theme: { taxonomies: ['THEME'], groupKeys: ['theme'] },
  palette: { taxonomies: ['COLOR'], groupKeys: ['palette'] },
  emotion: { taxonomies: ['MOOD'], groupKeys: ['art-mood'] },
  prettifiers: {
    taxonomies: ['PROMPT_ENHANCEMENT'],
    groupKeys: ['__pretty__'],
  },
}

function toQuery(options: FacetCatalogQuery): string {
  const query = new URLSearchParams()
  if (options.taxonomies?.length) {
    query.set('taxonomy', options.taxonomies.join(','))
  }
  if (options.includeInactive) query.set('includeInactive', 'true')
  if (options.includeMature) query.set('includeMature', 'true')
  if (options.randomizableOnly) query.set('randomizableOnly', 'true')
  if (options.search) query.set('search', options.search)
  if (options.take != null) query.set('take', String(options.take))
  if (options.skip != null) query.set('skip', String(options.skip))
  const value = query.toString()
  return value ? `?${value}` : ''
}

async function fetchAllCatalogPages(
  options: FacetCatalogQuery,
): Promise<FacetCatalogEntry[]> {
  const pageSize = Math.min(
    FACET_CATALOG_PAGE_SIZE,
    Math.max(1, options.take ?? FACET_CATALOG_PAGE_SIZE),
  )
  let skip = Math.max(0, options.skip ?? 0)
  const entriesById = new Map<number, FacetCatalogEntry>()

  while (true) {
    const response = await performFetch<FacetCatalogEntry[]>(
      `/api/facets/catalog${toQuery({ ...options, take: pageSize, skip })}`,
    )
    if (!response.success) {
      throw new Error(response.message || 'Failed to load canonical Facets.')
    }

    const page = response.data ?? []
    for (const entry of page) entriesById.set(entry.id, entry)

    if (page.length < pageSize) break
    skip += page.length
  }

  return Array.from(entriesById.values())
}

function weightedPick(entries: FacetCatalogEntry[]): FacetCatalogEntry | null {
  const viable = entries.filter(
    (entry) => entry.isRandomizable && entry.randomWeight > 0,
  )
  if (!viable.length) return null

  const total = viable.reduce((sum, entry) => sum + entry.randomWeight, 0)
  let roll = Math.random() * total
  for (const entry of viable) {
    roll -= entry.randomWeight
    if (roll <= 0) return entry
  }
  return viable.at(-1) ?? null
}

function metadataString(
  entry: FacetCatalogEntry,
  key: string | undefined,
): string | null {
  if (!key) return null
  const value = entry.metadata?.[key]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function metadataRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function metadataStrings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter(
        (entry): entry is string =>
          typeof entry === 'string' && Boolean(entry.trim()),
      )
    : []
}

function builderChoiceForEntry(
  entry: FacetCatalogEntry,
  metadataValueKey?: string,
): BuilderChoice {
  return {
    value:
      metadataString(entry, metadataValueKey) ||
      entry.canonicalValue ||
      entry.title,
    label: entry.title,
    subtext: entry.description || entry.flavorText || undefined,
    image: entry.cardPath || entry.imagePath || entry.heroPath || undefined,
    icon: entry.icon || undefined,
    payload: {
      facetId: entry.id,
      taxonomy: entry.taxonomy,
      groupKey: entry.groupKey,
      groupLabel: entry.groupLabel,
      aliases: entry.aliases,
      structuralEnum: entry.metadata?.structuralEnum === true,
    },
  }
}

function supportsArtField(
  entry: FacetCatalogEntry,
  fieldKey: string,
  definition: ArtFieldDefinition,
): boolean {
  if (!definition.groupKeys?.length) return true
  if (entry.groupKey && definition.groupKeys.includes(entry.groupKey)) return true
  return metadataStrings(entry.metadata?.artBuilderFields).includes(fieldKey)
}

export const useFacetCatalogStore = defineStore('facetCatalogStore', () => {
  const entries = ref<FacetCatalogEntry[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref<string | null>(null)

  const byTaxonomy = computed(() => {
    const grouped = new Map<FacetTaxonomy, FacetCatalogEntry[]>()
    for (const taxonomy of FACET_TAXONOMIES) grouped.set(taxonomy, [])
    for (const entry of entries.value) {
      grouped.get(entry.taxonomy)?.push(entry)
    }
    return grouped
  })

  const byLookupKey = computed(() => {
    const index = new Map<string, FacetCatalogEntry>()
    for (const entry of entries.value) {
      const values = [
        entry.title,
        entry.canonicalValue,
        entry.slug ?? '',
        ...entry.aliases,
      ]
      for (const value of values) {
        const key = normalizeFacetLookupKey(value)
        if (key && !index.has(key)) index.set(key, entry)
      }
    }
    return index
  })

  async function fetchCatalog(
    options: FacetCatalogQuery = {},
    force = false,
  ): Promise<FacetCatalogEntry[]> {
    if (loaded.value && !force && !Object.keys(options).length) {
      return entries.value
    }

    loading.value = true
    error.value = null
    try {
      entries.value = await fetchAllCatalogPages(options)
      loaded.value = true
      return entries.value
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : String(cause)
      throw cause
    } finally {
      loading.value = false
    }
  }

  function facetsForTaxonomies(
    taxonomies: readonly FacetTaxonomy[],
  ): FacetCatalogEntry[] {
    const allowed = new Set(taxonomies)
    return entries.value.filter((entry) => allowed.has(entry.taxonomy))
  }

  function facetsForCharacterField(fieldKey: string): FacetCatalogEntry[] {
    return facetsForTaxonomies(CHARACTER_FIELD_TAXONOMIES[fieldKey] ?? [])
  }

  function facetsForBotField(fieldKey: string): FacetCatalogEntry[] {
    return facetsForTaxonomies(BOT_FIELD_TAXONOMIES[fieldKey] ?? [])
  }

  function facetsForSystemField(fieldKey: string): FacetCatalogEntry[] {
    return facetsForTaxonomies(SYSTEM_FIELD_TAXONOMIES[fieldKey] ?? [])
  }

  function facetsForArtField(fieldKey: string): FacetCatalogEntry[] {
    const definition = ART_FIELD_FACETS[fieldKey]
    if (!definition) return []
    return facetsForTaxonomies(definition.taxonomies).filter((entry) =>
      supportsArtField(entry, fieldKey, definition),
    )
  }

  function facetForValue(value: string): FacetCatalogEntry | null {
    const key = normalizeFacetLookupKey(value)
    return key ? (byLookupKey.value.get(key) ?? null) : null
  }

  function randomFacetForField(fieldKey: string): FacetCatalogEntry | null {
    return weightedPick(facetsForCharacterField(fieldKey))
  }

  function randomFacetForBotField(fieldKey: string): FacetCatalogEntry | null {
    return weightedPick(facetsForBotField(fieldKey))
  }

  function builderChoicesForTaxonomies(
    taxonomies: readonly FacetTaxonomy[],
    metadataValueKey?: string,
  ): BuilderChoice[] {
    return facetsForTaxonomies(taxonomies).map((entry) =>
      builderChoiceForEntry(entry, metadataValueKey),
    )
  }

  function builderChoicesForField(fieldKey: string): BuilderChoice[] {
    return builderChoicesForTaxonomies(
      CHARACTER_FIELD_TAXONOMIES[fieldKey] ?? [],
    )
  }

  function builderChoicesForBotField(fieldKey: string): BuilderChoice[] {
    return builderChoicesForTaxonomies(
      BOT_FIELD_TAXONOMIES[fieldKey] ?? [],
      fieldKey === 'BotType' ? 'builderValue' : undefined,
    )
  }

  function builderChoicesForSystemField(fieldKey: string): BuilderChoice[] {
    return builderChoicesForTaxonomies(
      SYSTEM_FIELD_TAXONOMIES[fieldKey] ?? [],
      'enumValue',
    )
  }

  function builderChoicesForArtField(fieldKey: string): BuilderChoice[] {
    return facetsForArtField(fieldKey).map((entry) => {
      const choice = builderChoiceForEntry(entry)
      const artBuilder = metadataRecord(entry.metadata?.artBuilder)
      const fieldMetadata = metadataRecord(artBuilder?.[fieldKey])
      const builderValue = fieldMetadata?.builderValue
      const promptHint = fieldMetadata?.promptHint
      const loras = metadataStrings(fieldMetadata?.loras)

      return {
        ...choice,
        value:
          typeof builderValue === 'string' && builderValue.trim()
            ? builderValue.trim()
            : choice.value,
        payload: {
          ...(choice.payload ?? {}),
          source: 'facet-catalog',
          artField: fieldKey,
          ...(typeof promptHint === 'string' && promptHint.trim()
            ? { promptHint: promptHint.trim() }
            : {}),
          ...(loras.length ? { loras } : {}),
        },
      }
    })
  }

  return {
    entries,
    loading,
    loaded,
    error,
    byTaxonomy,
    byLookupKey,
    fetchCatalog,
    facetsForTaxonomies,
    facetsForCharacterField,
    facetsForBotField,
    facetsForSystemField,
    facetsForArtField,
    facetForValue,
    randomFacetForField,
    randomFacetForBotField,
    builderChoicesForTaxonomies,
    builderChoicesForField,
    builderChoicesForBotField,
    builderChoicesForSystemField,
    builderChoicesForArtField,
  }
})
