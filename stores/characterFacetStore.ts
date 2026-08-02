// /stores/characterFacetStore.ts
//
// Client store for Character Facet assignments. The server side has been
// complete since the facet-catalog cutover (Character table, get/put
// endpoints, characterFacetSync util) but had zero client consumption until
// now. Mirrors rewardFacetStore.ts's shape, with one difference: Character's
// /api/characters/:id/facets endpoints return each assignment link wrapped
// around its Facet (`{ facetId, fieldKey, ..., facet: FacetWithAliases }`,
// see server/utils/facetCatalog.ts's loadOwnerFacetCatalog), not a flat
// Facet array the way Reward's does — so this store unwraps `.facet` before
// handing data to callers, keeping the public shape identical to
// rewardFacetStore's for UI reuse.
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { handleError, performFetch } from '@/stores/utils'
import {
  useFacetStore,
  type FacetWithAliases,
} from '@/stores/facetStore'

export type CharacterFacetLink = {
  facetId: number
  fieldKey: string
  sortOrder: number
  weight: number
  source: string
  facet: FacetWithAliases | null
}

export type CharacterFacetResult = {
  success: boolean
  data?: FacetWithAliases[]
  message?: string
}

function normalizeCharacterId(value: unknown): number | null {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

function normalizeFacetIds(values: number[]): number[] {
  return Array.from(
    new Set(values.map(Number).filter((id) => Number.isInteger(id) && id > 0)),
  )
}

function unwrapFacets(links: CharacterFacetLink[]): FacetWithAliases[] {
  return links
    .map((link) => link.facet)
    .filter((facet): facet is FacetWithAliases => Boolean(facet))
}

export const useCharacterFacetStore = defineStore('characterFacetStore', () => {
  const facetStore = useFacetStore()
  const assignmentsByCharacterId = ref<Record<number, number[]>>({})
  const loadingByCharacterId = ref<Record<number, boolean>>({})
  const savingByCharacterId = ref<Record<number, boolean>>({})
  const errorsByCharacterId = ref<Record<number, string>>({})

  function mergeFacets(facets: FacetWithAliases[]): void {
    for (const facet of facets) {
      const index = facetStore.facets.findIndex((entry) => entry.id === facet.id)
      if (index >= 0) facetStore.facets[index] = facet
      else facetStore.facets.push(facet)
    }
  }

  function isLoadingCharacter(characterId?: number | null): boolean {
    const id = normalizeCharacterId(characterId)
    return id ? Boolean(loadingByCharacterId.value[id]) : false
  }

  function isSavingCharacter(characterId?: number | null): boolean {
    const id = normalizeCharacterId(characterId)
    return id ? Boolean(savingByCharacterId.value[id]) : false
  }

  function errorForCharacter(characterId?: number | null): string {
    const id = normalizeCharacterId(characterId)
    return id ? errorsByCharacterId.value[id] || '' : ''
  }

  async function fetchCharacterFacets(
    characterId: number,
  ): Promise<CharacterFacetResult> {
    const id = normalizeCharacterId(characterId)
    if (!id) return { success: false, message: 'Invalid Character ID.' }

    loadingByCharacterId.value[id] = true
    errorsByCharacterId.value[id] = ''

    try {
      const response = await performFetch<CharacterFacetLink[]>(
        `/api/characters/${id}/facets`,
      )

      if (!response.success || !response.data) {
        throw new Error(
          response.message || 'Character Facets could not be loaded.',
        )
      }

      const facets = unwrapFacets(response.data)
      mergeFacets(facets)
      assignmentsByCharacterId.value[id] = facets.map((facet) => facet.id)

      return {
        success: true,
        data: facets,
        message: response.message || 'Character Facets loaded.',
      }
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : 'Character Facets could not be loaded.'
      errorsByCharacterId.value[id] = message
      handleError(cause, `loading Facets for Character ${id}`)
      return { success: false, message }
    } finally {
      loadingByCharacterId.value[id] = false
    }
  }

  async function replaceCharacterFacets(
    characterId: number,
    facetIds: number[],
  ): Promise<CharacterFacetResult> {
    const id = normalizeCharacterId(characterId)
    if (!id) return { success: false, message: 'Invalid Character ID.' }

    savingByCharacterId.value[id] = true
    errorsByCharacterId.value[id] = ''

    try {
      const response = await performFetch<CharacterFacetLink[]>(
        `/api/characters/${id}/facets`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ facetIds: normalizeFacetIds(facetIds) }),
        },
      )

      if (!response.success || !response.data) {
        throw new Error(
          response.message || 'Character Facets could not be saved.',
        )
      }

      const facets = unwrapFacets(response.data)
      mergeFacets(facets)
      assignmentsByCharacterId.value[id] = facets.map((facet) => facet.id)

      return {
        success: true,
        data: facets,
        message: response.message || 'Character Facets updated.',
      }
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : 'Character Facets could not be saved.'
      errorsByCharacterId.value[id] = message
      handleError(cause, `saving Facets for Character ${id}`)
      return { success: false, message }
    } finally {
      savingByCharacterId.value[id] = false
    }
  }

  return {
    assignmentsByCharacterId,
    loadingByCharacterId,
    savingByCharacterId,
    errorsByCharacterId,
    isLoadingCharacter,
    isSavingCharacter,
    errorForCharacter,
    fetchCharacterFacets,
    replaceCharacterFacets,
  }
})
