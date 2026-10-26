import { defineStore } from 'pinia'
import { ref } from 'vue'
import { performFetch } from '~/stores/utils'

export type PlaybookReviewRow = {
  id: number
  gameSlug: string
  endingKey: string
  stars: number
  comment: string | null
  history: Record<string, unknown>
  createdAt: string
}

export const usePlaybookReviewAdminStore = defineStore(
  'playbookReviewAdmin',
  () => {
    const reviews = ref<PlaybookReviewRow[]>([])
    const loading = ref(false)
    const error = ref('')
    const game = ref('')
    const stars = ref(0)

    async function load() {
      loading.value = true
      error.value = ''
      const query = new URLSearchParams({ take: '100' })
      if (game.value) query.set('game', game.value)
      if (stars.value) query.set('stars', String(stars.value))
      const result = await performFetch<PlaybookReviewRow[]>(
        '/api/admin/playbook/reviews?' + query.toString(),
      )
      loading.value = false
      if (!result.success || !result.data) {
        error.value = result.message || 'Could not load player reviews.'
        return
      }
      reviews.value = result.data
    }

    return { reviews, loading, error, game, stars, load }
  },
)
