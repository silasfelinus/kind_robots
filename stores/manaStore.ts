// /stores/manaStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { performFetch, handleError } from './utils'

const CYCLE_MS = 1000 * 60 * 60 * 24 // daily

interface ManaTxn {
  id: number
  createdAt: string
  amount: number
  reason: string
  balanceAfter: number
  provider?: string | null
  costUsd?: number | null
}

export const useManaStore = defineStore('manaStore', () => {
  const userStore = useUserStore()

  const cap = ref(500)
  const lastRefill = ref<string | null>(null)
  const transactions = ref<ManaTxn[]>([])
  const loading = ref(false)
  const error = ref('')

  // Balance mirrors userStore.user.mana — single source of truth stays on the user.
  const balance = computed(() => userStore.user?.mana ?? 0)
  const isFamily = computed(() => userStore.role === 'FAMILY')
  const isGuest = computed(() => userStore.isGuest)

  const nextRefillMs = computed(() => {
    if (isFamily.value || !lastRefill.value) return 0
    const elapsed = Date.now() - new Date(lastRefill.value).getTime()
    return Math.max(0, CYCLE_MS - elapsed)
  })

  const refillReady = computed(() => nextRefillMs.value === 0)

  const refillCountdown = computed(() => {
    const ms = nextRefillMs.value
    if (ms <= 0) return 'ready'
    const h = Math.floor(ms / 3_600_000)
    const m = Math.floor((ms % 3_600_000) / 60_000)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  })

  const pct = computed(() =>
    cap.value > 0
      ? Math.min(100, Math.round((balance.value / cap.value) * 100))
      : 0,
  )

  async function fetch() {
    const id = userStore.user?.id
    if (!id || userStore.isGuest) return
    loading.value = true
    error.value = ''
    try {
      const res = await performFetch<{
        balance: number
        cap: number
        lastRefill: string | null
        transactions: ManaTxn[]
      }>(`/api/mana/${id}`)

      if (res.success && res.data) {
        cap.value = res.data.cap
        lastRefill.value = res.data.lastRefill
        transactions.value = res.data.transactions
        if (userStore.user) userStore.user.mana = res.data.balance
      } else {
        error.value = res.message || 'Failed to load mana.'
      }
    } catch (err) {
      handleError(err, 'manaStore.fetch')
      error.value = 'Failed to load mana.'
    } finally {
      loading.value = false
    }
  }

  // Optimistic local debit so UI reacts instantly; server is source of truth.
  function applyLocal(amount: number) {
    if (userStore.user) {
      userStore.user.mana = Math.max(0, (userStore.user.mana ?? 0) + amount)
    }
  }

  return {
    cap,
    lastRefill,
    transactions,
    loading,
    error,
    balance,
    isFamily,
    isGuest,
    nextRefillMs,
    refillReady,
    refillCountdown,
    pct,
    fetch,
    applyLocal,
  }
})
