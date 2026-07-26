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
    return facetsForTaxonomies(taxonomies).map((entry) => ({
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
      },
    }))
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
    facetForValue,
    randomFacetForField,
    randomFacetForBotField,
    builderChoicesForTaxonomies,
    builderChoicesForField,
    builderChoicesForBotField,
  }
})
