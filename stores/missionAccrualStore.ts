// /stores/missionAccrualStore.ts
//
// kind-economy/t-010: owns the fetch + remittance-logging actions behind
// the admin-only mission-share accrual dashboard
// (components/pages/mission-accrual-page.vue). Same shape as
// creatorEarningsStore.ts -- components never call APIs directly, per
// AGENTS.md.
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { performFetch, handleError } from './utils'

export type MissionAccrualPeriodBucket = {
  key: string
  granularity: 'day' | 'month'
  totalCents: number
  count: number
}

export type MissionAccrualSummary = {
  totalCents: number
  count: number
  byPeriod: MissionAccrualPeriodBucket[]
}

export type MissionRemittanceRow = {
  id: number
  createdAt: string
  amountCents: number
  remittedById: number
  remittedByUsername: string | null
  note: string
  reference: string | null
}

export type MissionAccrualData = {
  accrual: MissionAccrualSummary
  remittances: MissionRemittanceRow[]
  remittedTotalCents: number
  outstandingCents: number
}

export type LogRemittanceInput = {
  amountCents: number
  note: string
  reference?: string
}

// Static, approximate, as-of-2026-08-19 figure -- the amount raised
// DIRECTLY at againstmalaria.com/amibot (see stores/seeds/cartItems.ts's
// giving-page copy and conductor/projects/kind-economy/DESIGN-BRIEF.md).
// Deliberately NOT a live fetch against againstmalaria.com (out of scope
// for kind-economy/t-010) and deliberately NOT folded into any total this
// store computes from the platform's own RevenueSplit/MissionRemittance
// ledgers -- those dollars never touched this app's books.
export const EXTERNAL_DIRECT_DONATION_CENTS = 84000
export const EXTERNAL_DIRECT_DONATION_AS_OF = '2026-08-19'
export const EXTERNAL_DIRECT_DONATION_URL = 'https://againstmalaria.com/amibot'

export const useMissionAccrualStore = defineStore('missionAccrualStore', () => {
  const userStore = useUserStore()

  const data = ref<MissionAccrualData | null>(null)
  const loading = ref(false)
  const submitting = ref(false)
  const error = ref('')
  const submitError = ref('')

  const isAdmin = computed(() => userStore.isAdmin)
  const hasLoaded = computed(() => data.value !== null)

  async function fetch() {
    if (!userStore.isAdmin) return
    loading.value = true
    error.value = ''
    try {
      const res = await performFetch<MissionAccrualData>(
        '/api/economy/mission-accrual',
      )

      if (res.success && res.data) {
        data.value = res.data
      } else {
        error.value = res.message || 'Failed to load mission accrual.'
      }
    } catch (err) {
      handleError(err, 'missionAccrualStore.fetch')
      error.value = 'Failed to load mission accrual.'
    } finally {
      loading.value = false
    }
  }

  async function logRemittance(input: LogRemittanceInput): Promise<boolean> {
    if (!userStore.isAdmin) return false
    submitting.value = true
    submitError.value = ''
    try {
      const res = await performFetch<MissionRemittanceRow>(
        '/api/economy/mission-accrual',
        { method: 'POST', body: JSON.stringify(input) },
      )

      if (res.success) {
        await fetch()
        return true
      }
      submitError.value = res.message || 'Failed to log remittance.'
      return false
    } catch (err) {
      handleError(err, 'missionAccrualStore.logRemittance')
      submitError.value = 'Failed to log remittance.'
      return false
    } finally {
      submitting.value = false
    }
  }

  return {
    data,
    loading,
    submitting,
    error,
    submitError,
    isAdmin,
    hasLoaded,
    fetch,
    logRemittance,
  }
})
