// /stores/rewardFacetStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { handleError, performFetch } from '@/stores/utils'
import {
  useFacetStore,
  type FacetWithAliases,
} from '@/stores/facetStore'

export type RewardFacetResult = {
  success: boolean
  data?: FacetWithAliases[]
  message?: string
}

function normalizeRewardId(value: unknown): number | null {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

function normalizeFacetIds(values: number[]): number[] {
  return Array.from(
    new Set(values.map(Number).filter((id) => Number.isInteger(id) && id > 0)),
  )
}

export const useRewardFacetStore = defineStore('rewardFacetStore', () => {
  const facetStore = useFacetStore()
  const assignmentsByRewardId = ref<Record<number, number[]>>({})
  const loadingByRewardId = ref<Record<number, boolean>>({})
  const savingByRewardId = ref<Record<number, boolean>>({})
  const errorsByRewardId = ref<Record<number, string>>({})

  function mergeFacets(facets: FacetWithAliases[]): void {
    for (const facet of facets) {
      const index = facetStore.facets.findIndex((entry) => entry.id === facet.id)
      if (index >= 0) facetStore.facets[index] = facet
      else facetStore.facets.push(facet)
    }
  }

  function isLoadingReward(rewardId?: number | null): boolean {
    const id = normalizeRewardId(rewardId)
    return id ? Boolean(loadingByRewardId.value[id]) : false
  }

  function isSavingReward(rewardId?: number | null): boolean {
    const id = normalizeRewardId(rewardId)
    return id ? Boolean(savingByRewardId.value[id]) : false
  }

  function errorForReward(rewardId?: number | null): string {
    const id = normalizeRewardId(rewardId)
    return id ? errorsByRewardId.value[id] || '' : ''
  }

  async function fetchRewardFacets(rewardId: number): Promise<RewardFacetResult> {
    const id = normalizeRewardId(rewardId)
    if (!id) return { success: false, message: 'Invalid Reward ID.' }

    loadingByRewardId.value[id] = true
    errorsByRewardId.value[id] = ''

    try {
      const response = await performFetch<FacetWithAliases[]>(
        `/api/rewards/${id}/facets`,
      )

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Reward Facets could not be loaded.')
      }

      mergeFacets(response.data)
      assignmentsByRewardId.value[id] = response.data.map((facet) => facet.id)

      return {
        success: true,
        data: response.data,
        message: response.message || 'Reward Facets loaded.',
      }
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : 'Reward Facets could not be loaded.'
      errorsByRewardId.value[id] = message
      handleError(cause, `loading Facets for Reward ${id}`)
      return { success: false, message }
    } finally {
      loadingByRewardId.value[id] = false
    }
  }

  async function replaceRewardFacets(
    rewardId: number,
    facetIds: number[],
  ): Promise<RewardFacetResult> {
    const id = normalizeRewardId(rewardId)
    if (!id) return { success: false, message: 'Invalid Reward ID.' }

    savingByRewardId.value[id] = true
    errorsByRewardId.value[id] = ''

    try {
      const response = await performFetch<FacetWithAliases[]>(
        `/api/rewards/${id}/facets`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ facetIds: normalizeFacetIds(facetIds) }),
        },
      )

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Reward Facets could not be saved.')
      }

      mergeFacets(response.data)
      assignmentsByRewardId.value[id] = response.data.map((facet) => facet.id)

      return {
        success: true,
        data: response.data,
        message: response.message || 'Reward Facets updated.',
      }
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : 'Reward Facets could not be saved.'
      errorsByRewardId.value[id] = message
      handleError(cause, `saving Facets for Reward ${id}`)
      return { success: false, message }
    } finally {
      savingByRewardId.value[id] = false
    }
  }

  return {
    assignmentsByRewardId,
    loadingByRewardId,
    savingByRewardId,
    errorsByRewardId,
    isLoadingReward,
    isSavingReward,
    errorForReward,
    fetchRewardFacets,
    replaceRewardFacets,
  }
})
