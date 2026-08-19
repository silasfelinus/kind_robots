// /stores/creatorEarningsStore.ts
//
// kind-economy/t-009: owns the one read-only fetch behind the creator
// earnings page (components/pages/creator-earnings-page.vue). Same shape as
// karmaStore.ts -- components never call APIs directly, per AGENTS.md.
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { performFetch, handleError } from './utils'

export type CreatorEarningsInteraction = {
  id: number
  createdAt: string
  creatorShareCents: number
  isSelfAttribution: boolean
  sourceType: string | null
  sourceId: number | null
}

export type CreatorEarningsObjectGroup = {
  key: string
  sourceType: string | null
  sourceId: number | null
  title: string
  totalCents: number
  selfAttributedCents: number
  count: number
  rows: CreatorEarningsInteraction[]
}

export type CreatorEarningsPeriodBucket = {
  key: string
  granularity: 'day' | 'month'
  totalCents: number
  selfAttributedCents: number
  count: number
}

export type CreatorEarningsSummary = {
  totalCents: number
  selfAttributedTotalCents: number
  interactionCount: number
  selfAttributedCount: number
  byObject: CreatorEarningsObjectGroup[]
  byPeriod: CreatorEarningsPeriodBucket[]
}

export type CreatorEarningsData = {
  summary: CreatorEarningsSummary
  rows: CreatorEarningsInteraction[]
}

export const useCreatorEarningsStore = defineStore(
  'creatorEarningsStore',
  () => {
    const userStore = useUserStore()

    const data = ref<CreatorEarningsData | null>(null)
    const loading = ref(false)
    const error = ref('')

    const isGuest = computed(() => userStore.isGuest)
    const hasLoaded = computed(() => data.value !== null)
    const summary = computed(() => data.value?.summary ?? null)

    async function fetch() {
      if (userStore.isGuest || !userStore.user?.id) return
      loading.value = true
      error.value = ''
      try {
        const res = await performFetch<CreatorEarningsData>(
          '/api/economy/creator-earnings',
        )

        if (res.success && res.data) {
          data.value = res.data
        } else {
          error.value = res.message || 'Failed to load creator earnings.'
        }
      } catch (err) {
        handleError(err, 'creatorEarningsStore.fetch')
        error.value = 'Failed to load creator earnings.'
      } finally {
        loading.value = false
      }
    }

    return {
      data,
      summary,
      loading,
      error,
      isGuest,
      hasLoaded,
      fetch,
    }
  },
)
