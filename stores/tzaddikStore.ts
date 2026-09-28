// /stores/tzaddikStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  TzaddikCandidate,
  TzaddikCandidateTag,
  TzaddikRecheckRequest,
} from '~/prisma/generated/prisma/client'
import { performFetch, handleError } from './utils'

export type TzaddikModerationCurationState = 'PENDING' | 'ARCHIVED'

// t-028: a third queue value alongside the two real curationState filters --
// every candidate whose latest recheck request is NEEDS_REVIEW, regardless
// of its curationState. Not a curationState itself, so fetchModerationQueue
// routes it to a different query param instead of `curationState=`.
export type TzaddikModerationQueueFilter =
  TzaddikModerationCurationState | 'NEEDS_REVIEW'

export type TzaddikOverridePayload = {
  displayNameOverride?: string | null
  biographyOverride?: string | null
  rationaleOverride?: string | null
  objectionsOverride?: string | null
  imageUrlOverride?: string | null
  overrideNote?: string | null
}

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
  const isSubmittingCandidate = ref(false)
  const submitError = ref('')

  // Admin moderation queue (tzaddik-gallery/t-008): PENDING submissions
  // awaiting a decision, and ARCHIVED entries an admin might restore. Kept
  // separate from living/memorial (which only ever hold APPROVED rows) so an
  // admin browsing the review queue never mixes with the public roster.
  const moderationQueue = ref<TzaddikCandidateWithTags[]>([])
  const isLoadingModerationQueue = ref(false)
  const moderationQueueError = ref('')
  const isModerating = ref(false)

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

  async function submitCandidate(payload: {
    displayName: string
    lifeState: 'LIVING' | 'MEMORIAL'
    rationale: string
    wikipediaUrl: string
    biography?: string
  }): Promise<TzaddikCandidateWithTags | null> {
    isSubmittingCandidate.value = true
    submitError.value = ''

    try {
      const res = await performFetch<TzaddikCandidateWithTags>('/api/tzaddik', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Invalid response')
      }

      return res.data
    } catch (caughtError) {
      submitError.value =
        caughtError instanceof Error
          ? caughtError.message
          : 'Failed to submit this candidate.'
      handleError(caughtError, 'submitting a Tzaddik candidate')
      return null
    } finally {
      isSubmittingCandidate.value = false
    }
  }

  async function fetchModerationQueue(
    filter: TzaddikModerationQueueFilter,
    force = false,
  ): Promise<TzaddikCandidateWithTags[]> {
    isLoadingModerationQueue.value = true
    moderationQueueError.value = ''

    try {
      const query =
        filter === 'NEEDS_REVIEW'
          ? 'needsReview=true'
          : `curationState=${filter}`
      const res = await performFetch<TzaddikCandidateWithTags[]>(
        `/api/tzaddik?${query}`,
      )

      if (!res.success || !Array.isArray(res.data)) {
        throw new Error(res.message || 'Invalid response')
      }

      moderationQueue.value = res.data
      return moderationQueue.value
    } catch (caughtError) {
      moderationQueueError.value = 'Failed to load the review queue.'
      handleError(caughtError, 'fetching the Tzaddik moderation queue')
      return force ? [] : moderationQueue.value
    } finally {
      isLoadingModerationQueue.value = false
    }
  }

  /** Refreshes every cache a moderation action could have touched: the
   * detail (curationState/overrides changed), the moderation queue (the row
   * likely left it), and living/memorial (an approve/archive can add or
   * remove a row from the public roster). */
  async function refreshAfterModeration(candidateId: number): Promise<void> {
    await Promise.all([
      fetchOne(candidateId, true),
      fetchLiving(true),
      fetchMemorial(true),
    ])
  }

  async function approveCandidate(
    candidateId: number,
  ): Promise<TzaddikCandidateWithTags | null> {
    isModerating.value = true

    try {
      const res = await performFetch<TzaddikCandidateWithTags>(
        '/api/tzaddik/approve',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidateId }),
        },
      )

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Invalid response')
      }

      await refreshAfterModeration(candidateId)
      return res.data
    } catch (caughtError) {
      handleError(caughtError, 'approving a Tzaddik candidate')
      return null
    } finally {
      isModerating.value = false
    }
  }

  async function archiveCandidate(
    candidateId: number,
  ): Promise<TzaddikCandidateWithTags | null> {
    isModerating.value = true

    try {
      const res = await performFetch<TzaddikCandidateWithTags>(
        '/api/tzaddik/archive',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidateId }),
        },
      )

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Invalid response')
      }

      await refreshAfterModeration(candidateId)
      return res.data
    } catch (caughtError) {
      handleError(caughtError, 'archiving a Tzaddik candidate')
      return null
    } finally {
      isModerating.value = false
    }
  }

  async function overrideCandidate(
    candidateId: number,
    payload: TzaddikOverridePayload,
  ): Promise<TzaddikCandidateWithTags | null> {
    isModerating.value = true

    try {
      const res = await performFetch<TzaddikCandidateWithTags>(
        '/api/tzaddik/override',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidateId, ...payload }),
        },
      )

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Invalid response')
      }

      await refreshAfterModeration(candidateId)
      return res.data
    } catch (caughtError) {
      handleError(caughtError, 'updating a Tzaddik candidate override')
      return null
    } finally {
      isModerating.value = false
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
    isSubmittingCandidate,
    submitError,
    moderationQueue,
    isLoadingModerationQueue,
    moderationQueueError,
    isModerating,
    fetchLiving,
    fetchMemorial,
    fetchOne,
    requestRecheck,
    submitCandidate,
    fetchModerationQueue,
    approveCandidate,
    archiveCandidate,
    overrideCandidate,
  }
})
