// /stores/facetStore.ts
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Facet } from '~/prisma/generated/prisma/client'
import { performFetch } from '@/stores/utils'
import { normalizeFacetLookupKey } from '@/utils/facetAliases'
import type { FacetTaxonomy } from '@/stores/facetCatalogStore'

export type FacetWithAliases = Pick<
  Facet,
  | 'id'
  | 'title'
  | 'slug'
  | 'kind'
  | 'description'
  | 'flavorText'
  | 'examples'
  | 'artPrompt'
  | 'imagePath'
  | 'cardPath'
  | 'heroPath'
  | 'iconPath'
  | 'icon'
  | 'artImageId'
  | 'artCollectionId'
  | 'userId'
  | 'isPublic'
  | 'isMature'
  | 'isActive'
> & {
  aliases: string[]
  taxonomy: FacetTaxonomy
  canonicalValue: string
  groupKey: string | null
  groupLabel: string | null
  sortOrder: number
  isRandomizable: boolean
  randomWeight: number
  artRequired: boolean
  sourceRank: number
  metadata: Record<string, unknown> | null
}

export type FacetListOptions = {
  search?: string
  taxonomy?: FacetTaxonomy
  includeInactive?: boolean
  includeMature?: boolean
  mine?: boolean
  /** Page size. The store continues until all matching pages are loaded. */
  take?: number
  skip?: number
}

export type FacetCreateInput = {
  title: string
  taxonomy: FacetTaxonomy
  slug?: string
  canonicalValue?: string | null
  groupKey?: string | null
  groupLabel?: string | null
  sortOrder?: number
  isRandomizable?: boolean
  randomWeight?: number
  artRequired?: boolean
  sourceRank?: number
  metadata?: Record<string, unknown> | null
  description?: string | null
  flavorText?: string | null
  examples?: string | null
  artPrompt?: string | null
  imagePath?: string | null
  cardPath?: string | null
  heroPath?: string | null
  iconPath?: string | null
  icon?: string | null
  artImageId?: number | null
  artCollectionId?: number | null
  aliases?: string[]
  isPublic?: boolean
  isMature?: boolean
}

export type FacetUpdateInput = Partial<FacetCreateInput> & {
  isActive?: boolean
}

export type FacetOwnerType = 'dream' | 'scenario' | 'artImage'

const FACET_LIBRARY_PAGE_SIZE = 250

function toQuery(options: FacetListOptions): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(options)) {
    if (value === undefined || value === null || value === '') continue
    query.set(key, String(value))
  }
  const result = query.toString()
  return result ? `?${result}` : ''
}

function sortFacets(entries: FacetWithAliases[]): FacetWithAliases[] {
  return entries.sort((a, b) =>
    a.taxonomy === b.taxonomy
      ? a.sortOrder === b.sortOrder
        ? a.title.localeCompare(b.title)
        : a.sortOrder - b.sortOrder
      : a.taxonomy.localeCompare(b.taxonomy),
  )
}

export const useFacetStore = defineStore('facetStore', () => {
  const facets = ref<FacetWithAliases[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const loaded = ref(false)
  const error = ref<string | null>(null)
  const dreamFacetIds = ref<Record<number, number[]>>({})
  const scenarioFacetIds = ref<Record<number, number[]>>({})
  const artImageFacetIds = ref<Record<number, number[]>>({})

  const activeFacets = computed(() =>
    facets.value.filter((facet) => facet.isActive),
  )

  const facetsByLookupKey = computed(() => {
    const index = new Map<string, FacetWithAliases>()
    for (const facet of facets.value) {
      const keys = [
        facet.slug,
        facet.title,
        facet.canonicalValue,
        ...facet.aliases,
      ]
      for (const key of keys) {
        const lookupKey = normalizeFacetLookupKey(key || '')
        if (lookupKey) index.set(lookupKey, facet)
      }
    }
    return index
  })

  function facetForKey(value?: string | null): FacetWithAliases | null {
    const lookupKey = normalizeFacetLookupKey(value || '')
    return lookupKey ? (facetsByLookupKey.value.get(lookupKey) ?? null) : null
  }

  function upsertFacet(facet: FacetWithAliases): FacetWithAliases {
    const index = facets.value.findIndex((entry) => entry.id === facet.id)
    if (index >= 0) facets.value[index] = facet
    else facets.value.push(facet)
    facets.value = sortFacets([...facets.value])
    return facet
  }

  async function fetchFacets(
    options: FacetListOptions = {},
  ): Promise<FacetWithAliases[]> {
    loading.value = true
    error.value = null
    try {
      const pageSize = Math.min(
        FACET_LIBRARY_PAGE_SIZE,
        Math.max(1, options.take ?? FACET_LIBRARY_PAGE_SIZE),
      )
      let skip = Math.max(0, options.skip ?? 0)
      const byId = new Map<number, FacetWithAliases>()

      while (true) {
        const response = await performFetch<FacetWithAliases[]>(
          `/api/facets${toQuery({ ...options, take: pageSize, skip })}`,
        )
        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch Facets.')
        }

        const page = response.data ?? []
        for (const facet of page) byId.set(facet.id, facet)
        if (page.length < pageSize) break
        skip += page.length
      }

      facets.value = sortFacets(Array.from(byId.values()))
      loaded.value = true
      return facets.value
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : String(cause)
      throw cause
    } finally {
      loading.value = false
    }
  }

  async function resolveFacet(key: string): Promise<FacetWithAliases> {
    const existing = facetForKey(key)
    if (existing) return existing

    const response = await performFetch<FacetWithAliases>(
      `/api/facets/${encodeURIComponent(key)}`,
    )
    if (!response.success || !response.data) {
      throw new Error(response.message || `Facet not found: ${key}.`)
    }
    return upsertFacet(response.data)
  }

  async function createFacet(
    input: FacetCreateInput,
  ): Promise<FacetWithAliases> {
    saving.value = true
    error.value = null
    try {
      const response = await performFetch<FacetWithAliases>('/api/facets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create Facet.')
      }
      return upsertFacet(response.data)
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : String(cause)
      throw cause
    } finally {
      saving.value = false
    }
  }

  async function updateFacet(
    id: number,
    input: FacetUpdateInput,
  ): Promise<FacetWithAliases> {
    saving.value = true
    error.value = null
    try {
      const response = await performFetch<FacetWithAliases>(
        `/api/facets/${id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        },
      )
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update Facet.')
      }
      return upsertFacet(response.data)
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : String(cause)
      throw cause
    } finally {
      saving.value = false
    }
  }

  async function archiveFacet(id: number): Promise<FacetWithAliases> {
    saving.value = true
    error.value = null
    try {
      const response = await performFetch<FacetWithAliases>(
        `/api/facets/${id}`,
        { method: 'DELETE' },
      )
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to archive Facet.')
      }
      return upsertFacet(response.data)
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : String(cause)
      throw cause
    } finally {
      saving.value = false
    }
  }

  const ownerFacetEndpoints: Record<FacetOwnerType, (id: number) => string> = {
    dream: (id) => `/api/dreams/${id}/facets`,
    scenario: (id) => `/api/scenarios/${id}/facets`,
    artImage: (id) => `/api/art/image/${id}/facets`,
  }

  function ownerFacetIndex(ownerType: FacetOwnerType) {
    if (ownerType === 'dream') return dreamFacetIds
    if (ownerType === 'scenario') return scenarioFacetIds
    return artImageFacetIds
  }

  async function fetchOwnerFacets(
    ownerType: FacetOwnerType,
    ownerId: number,
  ): Promise<FacetWithAliases[]> {
    const response = await performFetch<FacetWithAliases[]>(
      ownerFacetEndpoints[ownerType](ownerId),
    )
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch assigned Facets.')
    }

    const assigned = response.data ?? []
    for (const facet of assigned) upsertFacet(facet)
    ownerFacetIndex(ownerType).value[ownerId] = assigned.map(
      (facet) => facet.id,
    )
    return assigned
  }

  async function setOwnerFacets(
    ownerType: FacetOwnerType,
    ownerId: number,
    facetIds: number[],
  ): Promise<FacetWithAliases[]> {
    saving.value = true
    error.value = null
    try {
      const response = await performFetch<FacetWithAliases[]>(
        ownerFacetEndpoints[ownerType](ownerId),
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ facetIds }),
        },
      )
      if (!response.success) {
        throw new Error(response.message || 'Failed to update Facets.')
      }

      const assigned = response.data ?? []
      for (const facet of assigned) upsertFacet(facet)
      ownerFacetIndex(ownerType).value[ownerId] = assigned.map(
        (facet) => facet.id,
      )
      return assigned
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : String(cause)
      throw cause
    } finally {
      saving.value = false
    }
  }

  function fetchDreamFacets(dreamId: number) {
    return fetchOwnerFacets('dream', dreamId)
  }

  function setDreamFacets(dreamId: number, facetIds: number[]) {
    return setOwnerFacets('dream', dreamId, facetIds)
  }

  function fetchScenarioFacets(scenarioId: number) {
    return fetchOwnerFacets('scenario', scenarioId)
  }

  function setScenarioFacets(scenarioId: number, facetIds: number[]) {
    return setOwnerFacets('scenario', scenarioId, facetIds)
  }

  function fetchArtImageFacets(artImageId: number) {
    return fetchOwnerFacets('artImage', artImageId)
  }

  function setArtImageFacets(artImageId: number, facetIds: number[]) {
    return setOwnerFacets('artImage', artImageId, facetIds)
  }

  return {
    facets,
    loading,
    saving,
    loaded,
    error,
    dreamFacetIds,
    scenarioFacetIds,
    artImageFacetIds,
    activeFacets,
    facetsByLookupKey,
    facetForKey,
    fetchFacets,
    resolveFacet,
    createFacet,
    updateFacet,
    archiveFacet,
    fetchOwnerFacets,
    setOwnerFacets,
    fetchDreamFacets,
    setDreamFacets,
    fetchScenarioFacets,
    setScenarioFacets,
    fetchArtImageFacets,
    setArtImageFacets,
  }
})
