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

export type CharacterFacetAssignment = {
  facetId: number
  fieldKey: string
  sortOrder?: number
  weight?: number
  source?: string
}

type FacetCatalogQuery = {
  taxonomies?: FacetTaxonomy[]
  includeInactive?: boolean
  includeMature?: boolean
  randomizableOnly?: boolean
  search?: string
  /** Page size. The store continues requesting pages until the result is complete. */
  take?: number
  skip?: number
}

const FACET_CATALOG_PAGE_SIZE = 1000

export const CHARACTER_FIELD_TAXONOMIES: Record<string, FacetTaxonomy[]> = {
  genre: ['GENRE'],
  species: ['ANIMAL', 'SPECIES'],
  class: ['OCCUPATION', 'ARCHETYPE', 'ROLE'],
  alignment: ['ALIGNMENT'],
  personality: ['PERSONALITY'],
  backstory: ['BACKSTORY'],
  quirks: ['QUIRK'],
  role: ['ROLE'],
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

function splitCharacterField(fieldKey: string, value: unknown): string[] {
  if (typeof value !== 'string') return []
  const trimmed = value.trim()
  if (!trimmed) return []

  if (fieldKey === 'quirks' || fieldKey === 'personality') {
    return trimmed
      .split(/\n---\n|\||\n|;|,/)
      .map((entry) => entry.trim())
      .filter(Boolean)
  }

  return [trimmed]
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

  function facetForValue(value: string): FacetCatalogEntry | null {
    const key = normalizeFacetLookupKey(value)
    return key ? (byLookupKey.value.get(key) ?? null) : null
  }

  function randomFacetForField(fieldKey: string): FacetCatalogEntry | null {
    return weightedPick(facetsForCharacterField(fieldKey))
  }

  function builderChoicesForField(fieldKey: string): BuilderChoice[] {
    return facetsForCharacterField(fieldKey).map((entry) => ({
      value: entry.canonicalValue || entry.title,
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

  function characterAssignments(
    character: Record<string, unknown>,
  ): CharacterFacetAssignment[] {
    const assignments: CharacterFacetAssignment[] = []
    const seen = new Set<string>()

    for (const fieldKey of Object.keys(CHARACTER_FIELD_TAXONOMIES)) {
      const values = splitCharacterField(fieldKey, character[fieldKey])
      for (const [sortOrder, value] of values.entries()) {
        const facet = facetForValue(value)
        if (!facet) continue
        const key = `${fieldKey}:${facet.id}`
        if (seen.has(key)) continue
        seen.add(key)
        assignments.push({
          facetId: facet.id,
          fieldKey,
          sortOrder,
          source: 'BUILDER',
        })
      }
    }

    return assignments
  }

  async function syncCharacterFacets(
    characterId: number,
    character: Record<string, unknown>,
  ): Promise<void> {
    const assignments = characterAssignments(character)
    const response = await performFetch(`/api/characters/${characterId}/facets`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignments }),
    })
    if (!response.success) {
      throw new Error(response.message || 'Failed to save Character Facets.')
    }
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
    facetForValue,
    randomFacetForField,
    builderChoicesForField,
    characterAssignments,
    syncCharacterFacets,
  }
})
