// /stores/tzaddikStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  TzaddikCandidate,
  TzaddikCandidateTag,
  TzaddikRecheckRequest,
} from '~/prisma/generated/prisma/client'
import { performFetch, handleError } from './utils'

export type TzaddikCandidateWithTags = TzaddikCandidate & {
  Tags: TzaddikCandidateTag[]
}

export type TzaddikCandidateDetail = TzaddikCandidateWithTags & {
  RecheckRequests: TzaddikRecheckRequest[]
}

export const useTzaddikStore = defineStore('tzaddikStore', () => {
  const living = ref<TzaddikCandidateWithTags[]>([])
  const memorial = ref<TzaddikCandidateWithTags[]>([])
  const isLoadingLiving = ref(false)
  const isLoadingMemorial = ref(false)
  const livingError = ref('')
  const memorialError = ref('')
  const hasLoadedLiving = ref(false)
  const hasLoadedMemorial = ref(false)
  const detailById = ref<Record<number, TzaddikCandidateDetail>>({})
  const isLoadingDetail = ref(false)
  const detailError = ref('')
  const isRequestingRecheck = ref(false)

  async function fetchLiving(
    force = false,
  ): Promise<TzaddikCandidateWithTags[]> {
    if (!force && hasLoadedLiving.value) return living.value

    isLoadingLiving.value = true
    livingError.value = ''

    try {
      const res = await performFetch<TzaddikCandidateWithTags[]>(
        '/api/tzaddik?lifeState=LIVING',
      )

      if (!res.success || !Array.isArray(res.data)) {
        throw new Error(res.message || 'Invalid response')
      }

      living.value = res.data
      hasLoadedLiving.value = true
      return living.value
    } catch (caughtError) {
      livingError.value = 'Failed to load the living roster.'
      handleError(caughtError, 'fetching living Tzaddik candidates')
      return living.value
    } finally {
      isLoadingLiving.value = false
    }
  }

  async function fetchMemorial(
    force = false,
  ): Promise<TzaddikCandidateWithTags[]> {
    if (!force && hasLoadedMemorial.value) return memorial.value

    isLoadingMemorial.value = true
    memorialError.value = ''

    try {
      const res = await performFetch<TzaddikCandidateWithTags[]>(
        '/api/tzaddik?lifeState=MEMORIAL',
      )

      if (!res.success || !Array.isArray(res.data)) {
        throw new Error(res.message || 'Invalid response')
      }

      memorial.value = res.data
      hasLoadedMemorial.value = true
      return memorial.value
    } catch (caughtError) {
      memorialError.value = 'Failed to load the memorial archive.'
      handleError(caughtError, 'fetching memorial Tzaddik candidates')
      return memorial.value
    } finally {
      isLoadingMemorial.value = false
    }
  }

  async function fetchOne(
    id: number,
    force = false,
  ): Promise<TzaddikCandidateDetail | null> {
    if (!force && detailById.value[id]) return detailById.value[id]

    isLoadingDetail.value = true
    detailError.value = ''

    try {
      const res = await performFetch<TzaddikCandidateDetail>(
        `/api/tzaddik/${id}`,
      )

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Invalid response')
      }

      detailById.value = { ...detailById.value, [id]: res.data }
      return res.data
    } catch (caughtError) {
      detailError.value = 'Failed to load this candidate.'
      handleError(caughtError, 'fetching a Tzaddik candidate')
      return null
    } finally {
      isLoadingDetail.value = false
    }
  }

  async function requestRecheck(
    candidateId: number,
  ): Promise<TzaddikRecheckRequest | null> {
    isRequestingRecheck.value = true

    try {
      const res = await performFetch<TzaddikRecheckRequest>(
        '/api/tzaddik/recheck',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidateId }),
        },
      )

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Invalid response')
      }

      // Refresh the detail cache so the new/existing request's status shows
      // up without a separate poll.
      await fetchOne(candidateId, true)
      return res.data
    } catch (caughtError) {
      handleError(caughtError, 'requesting a Tzaddik candidate recheck')
      return null
    } finally {
      isRequestingRecheck.value = false
    }
  }

  return {
    living,
    memorial,
    isLoadingLiving,
    isLoadingMemorial,
    livingError,
    memorialError,
    hasLoadedLiving,
    hasLoadedMemorial,
    detailById,
    isLoadingDetail,
    detailError,
    isRequestingRecheck,
    fetchLiving,
    fetchMemorial,
    fetchOne,
    requestRecheck,
  }
})
