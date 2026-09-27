// /stores/tzaddikStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  TzaddikCandidate,
  TzaddikCandidateTag,
} from '~/prisma/generated/prisma/client'
import { performFetch, handleError } from './utils'

export type TzaddikCandidateWithTags = TzaddikCandidate & {
  Tags: TzaddikCandidateTag[]
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

  return {
    living,
    memorial,
    isLoadingLiving,
    isLoadingMemorial,
    livingError,
    memorialError,
    hasLoadedLiving,
    hasLoadedMemorial,
    fetchLiving,
    fetchMemorial,
  }
})
