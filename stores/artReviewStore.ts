// /stores/artReviewStore.ts
//
// The Rebel Button's art-reviewer mode: one random unreviewed image at a time,
// a 1-5 star rating with an optional comment, and the click + karma reward the
// server reports back. Reviews are ordinary Reactions, so "remembering" a score
// is the reaction system's job; this store only sequences the session.
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { handleError, performFetch } from '@/stores/utils'
import {
  ART_REVIEW_UNLOCK_CLICKS,
  type ArtReviewCandidate,
  type ArtReviewRating,
  type ArtReviewResult,
} from '@/utils/artReview'

export const useArtReviewStore = defineStore('artReviewStore', () => {
  const userStore = useUserStore()

  const candidate = ref<ArtReviewCandidate | null>(null)
  const remaining = ref(0)
  const skippedIds = ref<number[]>([])
  const sessionReviews = ref(0)
  const lastResult = ref<ArtReviewResult | null>(null)
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const errorMessage = ref('')

  const unlocked = computed(
    () =>
      userStore.isLoggedIn &&
      (userStore.clickRecord ?? 0) >= ART_REVIEW_UNLOCK_CLICKS,
  )
  const exhausted = computed(
    () => !isLoading.value && !candidate.value && !errorMessage.value,
  )

  async function fetchNext(): Promise<void> {
    isLoading.value = true
    errorMessage.value = ''
    try {
      const query = skippedIds.value.length
        ? `?exclude=${skippedIds.value.join(',')}`
        : ''
      const res = await performFetch<{
        candidate: ArtReviewCandidate | null
        remaining: number
      }>(`/api/art/review/next${query}`)
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Could not find art to review.')
      }
      candidate.value = res.data.candidate
      remaining.value = res.data.remaining
    } catch (error) {
      candidate.value = null
      errorMessage.value =
        error instanceof Error ? error.message : 'Could not find art.'
      handleError(error, 'fetching art to review')
    } finally {
      isLoading.value = false
    }
  }

  async function submitReview(
    rating: ArtReviewRating,
    comment: string,
  ): Promise<boolean> {
    const current = candidate.value
    if (!current || isSubmitting.value) return false

    isSubmitting.value = true
    errorMessage.value = ''
    try {
      const res = await performFetch<ArtReviewResult>('/api/art/review', {
        method: 'POST',
        body: JSON.stringify({
          artImageId: current.id,
          rating,
          comment: comment.trim() || undefined,
        }),
      })
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Could not save your review.')
      }

      lastResult.value = res.data
      if (res.data.firstReview) sessionReviews.value += 1
      if (userStore.user) {
        userStore.user.clickRecord = res.data.clickRecord
        userStore.user.karma = res.data.karma
      }
      await fetchNext()
      return true
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Could not save your review.'
      handleError(error, 'saving art review')
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  async function skip(): Promise<void> {
    if (candidate.value) skippedIds.value.push(candidate.value.id)
    await fetchNext()
  }

  return {
    candidate,
    remaining,
    sessionReviews,
    lastResult,
    isLoading,
    isSubmitting,
    errorMessage,
    unlocked,
    exhausted,
    fetchNext,
    submitReview,
    skip,
  }
})
