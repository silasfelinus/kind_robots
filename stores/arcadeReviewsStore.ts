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
    const res = await performFetch<ArcadeRatingSummaryMap>(
      '/api/arcade/reviews',
    )
    if (res.success && res.data) summaries.value = res.data
    return res.success
  }

  async function fetchReviews(game: string) {
    loading.value = true
    error.value = ''
    try {
      const res = await performFetch<ArcadeReviewRow[]>(
        '/api/arcade/reviews/' + encodeURIComponent(game),
      )
      if (!res.success || !Array.isArray(res.data))
        throw new Error(res.message || 'Could not load reviews.')
      reviewsByGame.value[game] = res.data
    } catch (cause) {
      error.value =
        cause instanceof Error ? cause.message : 'Could not load reviews.'
    } finally {
      loading.value = false
    }
  }

  async function saveReview(game: string, rating: number, comment: string) {
    saving.value = true
    error.value = ''
    try {
      const res = await performFetch<ArcadeReviewRow>(
        '/api/arcade/reviews/' + encodeURIComponent(game),
        {
          method: 'PUT',
          body: JSON.stringify({ rating, comment }),
        },
      )
      if (!res.success)
        throw new Error(res.message || 'Could not save your review.')
      await Promise.all([fetchReviews(game), fetchSummaries()])
      return true
    } catch (cause) {
      error.value =
        cause instanceof Error ? cause.message : 'Could not save your review.'
      return false
    } finally {
      saving.value = false
    }
  }

  // Logged-out stars. The random token lives only in this browser; the server
  // stores a hash of it so each browser has one editable rating per game.
  function guestToken(): string {
    try {
      const key = 'kr-arcade-guest-token'
      let token = localStorage.getItem(key)
      if (!token || !/^[A-Za-z0-9-]{16,64}$/.test(token)) {
        token = crypto.randomUUID()
        localStorage.setItem(key, token)
      }
      return token
    } catch {
      return crypto.randomUUID()
    }
  }

  async function saveGuestRating(
    game: string,
    rating: number,
    comment: string,
  ) {
    saving.value = true
    error.value = ''
    try {
      const res = await performFetch(
        '/api/arcade/reviews/' + encodeURIComponent(game) + '/guest',
        {
          method: 'POST',
          body: JSON.stringify({ rating, comment, token: guestToken() }),
        },
      )
      if (!res.success)
        throw new Error(res.message || 'Could not save your rating.')
      await fetchSummaries()
      return true
    } catch (cause) {
      error.value =
        cause instanceof Error ? cause.message : 'Could not save your rating.'
      return false
    } finally {
      saving.value = false
    }
  }

  return {
    summaries,
    reviewsByGame,
    loading,
    saving,
    error,
    fetchSummaries,
    fetchReviews,
    saveReview,
    saveGuestRating,
  }
})
