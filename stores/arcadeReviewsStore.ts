import { defineStore } from 'pinia'
import { ref } from 'vue'
import { performFetch } from './utils'
import type { ArcadeRatingSummaryMap } from '~/utils/arcade/reviews'

export type ArcadeReviewRow = {
  id: number
  userId: number
  username: string | null
  rating: number
  comment: string | null
  createdAt: string
  updatedAt: string
}

export const useArcadeReviewsStore = defineStore('arcadeReviews', () => {
  const summaries = ref<ArcadeRatingSummaryMap>({})
  const reviewsByGame = ref<Record<string, ArcadeReviewRow[]>>({})
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')

  async function fetchSummaries() {
    const res = await performFetch<ArcadeRatingSummaryMap>('/api/arcade/reviews')
    if (res.success && res.data) summaries.value = res.data
    return res.success
  }

  async function fetchReviews(game: string) {
    loading.value = true
    error.value = ''
    try {
      const res = await performFetch<ArcadeReviewRow[]>('/api/arcade/reviews/' + encodeURIComponent(game))
      if (!res.success || !Array.isArray(res.data)) throw new Error(res.message || 'Could not load reviews.')
      reviewsByGame.value[game] = res.data
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Could not load reviews.'
    } finally {
      loading.value = false
    }
  }

  async function saveReview(game: string, rating: number, comment: string) {
    saving.value = true
    error.value = ''
    try {
      const res = await performFetch<ArcadeReviewRow>('/api/arcade/reviews/' + encodeURIComponent(game), {
        method: 'PUT',
        body: JSON.stringify({ rating, comment }),
      })
      if (!res.success) throw new Error(res.message || 'Could not save your review.')
      await Promise.all([fetchReviews(game), fetchSummaries()])
      return true
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Could not save your review.'
      return false
    } finally {
      saving.value = false
    }
  }

  return { summaries, reviewsByGame, loading, saving, error, fetchSummaries, fetchReviews, saveReview }
})
