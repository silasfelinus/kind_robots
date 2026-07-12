// /stores/facetStore.ts
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Facet, FacetKind } from '~/prisma/generated/prisma/client'
import { performFetch } from '@/stores/utils'
import { normalizeFacetLookupKey } from '@/utils/facetAliases'

export type FacetWithAliases = Pick<
  Facet,
  | 'id'
  | 'title'
  | 'slug'
  | 'kind'
  | 'description'
  | 'flavorText'
  | 'imagePath'
  | 'icon'
  | 'userId'
  | 'isPublic'
  | 'isMature'
  | 'isActive'
> & {
  aliases: string[]
}

export type FacetListOptions = {
  search?: string
  kind?: FacetKind
  includeInactive?: boolean
  includeMature?: boolean
  mine?: boolean
  take?: number
  skip?: number
}

export type FacetCreateInput = {
  title: string
  slug?: string
  kind?: FacetKind
  description?: string | null
  flavorText?: string | null
  imagePath?: string | null
  icon?: string | null
  aliases?: string[]
  isPublic?: boolean
  isMature?: boolean
}

export type FacetUpdateInput = Partial<FacetCreateInput> & {
  isActive?: boolean
}

function toQuery(options: FacetListOptions): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(options)) {
    if (value === undefined || value === null || value === '') continue
    query.set(key, String(value))
  }
  const result = query.toString()
  return result ? `?${result}` : ''
}

export const useFacetStore = defineStore('facetStore', () => {
  const facets = ref<FacetWithAliases[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const loaded = ref(false)
  const error = ref<string | null>(null)
  const dreamFacetIds = ref<Record<number, number[]>>({})
  const scenarioFacetIds = ref<Record<number, number[]>>({})

  const activeFacets = computed(() =>
    facets.value.filter((facet) => facet.isActive),
  )

  const facetsByLookupKey = computed(() => {
    const index = new Map<string, FacetWithAliases>()
    for (const facet of facets.value) {
      const keys = [facet.slug, facet.title, ...facet.aliases]
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
    facets.value.sort((a, b) =>
      a.kind === b.kind
        ? a.title.localeCompare(b.title)
        : a.kind.localeCompare(b.kind),
    )
    return facet
  }

  async function fetchFacets(
    options: FacetListOptions = {},
  ): Promise<FacetWithAliases[]> {
    loading.value = true
    error.value = null
    try {
      const response = await performFetch<FacetWithAliases[]>(
        `/api/facets${toQuery(options)}`,
      )
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch Facets.')
      }
      facets.value = response.data ?? []
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

  async function fetchOwnerFacets(
    ownerType: 'dream' | 'scenario',
    ownerId: number,
  ): Promise<FacetWithAliases[]> {
    const response = await performFetch<FacetWithAliases[]>(
      `/api/${ownerType === 'dream' ? 'dreams' : 'scenarios'}/${ownerId}/facets`,
    )
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch assigned Facets.')
    }

    const assigned = response.data ?? []
    for (const facet of assigned) upsertFacet(facet)
    const ids = assigned.map((facet) => facet.id)
    if (ownerType === 'dream') dreamFacetIds.value[ownerId] = ids
    else scenarioFacetIds.value[ownerId] = ids
    return assigned
  }

  async function setOwnerFacets(
    ownerType: 'dream' | 'scenario',
    ownerId: number,
    facetIds: number[],
  ): Promise<FacetWithAliases[]> {
    saving.value = true
    error.value = null
    try {
      const response = await performFetch<FacetWithAliases[]>(
        `/api/${ownerType === 'dream' ? 'dreams' : 'scenarios'}/${ownerId}/facets`,
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
      const ids = assigned.map((facet) => facet.id)
      if (ownerType === 'dream') dreamFacetIds.value[ownerId] = ids
      else scenarioFacetIds.value[ownerId] = ids
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

  return {
    facets,
    loading,
    saving,
    loaded,
    error,
    dreamFacetIds,
    scenarioFacetIds,
    activeFacets,
    facetsByLookupKey,
    facetForKey,
    fetchFacets,
    resolveFacet,
    createFacet,
    updateFacet,
    archiveFacet,
    fetchDreamFacets,
    setDreamFacets,
    fetchScenarioFacets,
    setScenarioFacets,
  }
})
