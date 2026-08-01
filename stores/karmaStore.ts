// /stores/karmaStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { performFetch, handleError } from './utils'

interface KarmaTxn {
  id: number
  createdAt: string
  amount: number
  reason: string
  balanceAfter: number
  refId?: string | null
  note?: string | null
}

export const useKarmaStore = defineStore('karmaStore', () => {
  const userStore = useUserStore()

  const transactions = ref<KarmaTxn[]>([])
  const loading = ref(false)
  const error = ref('')

  // Balance mirrors userStore.user.karma — single source of truth stays on the user.
  const balance = computed(() => userStore.user?.karma ?? 0)
  const isGuest = computed(() => userStore.isGuest)

  async function fetch() {
    const id = userStore.user?.id
    if (!id || userStore.isGuest) return
    loading.value = true
    error.value = ''
    try {
      const res = await performFetch<{
        balance: number
        transactions: KarmaTxn[]
      }>(`/api/karma/${id}`)

      if (res.success && res.data) {
        transactions.value = res.data.transactions
        if (userStore.user) userStore.user.karma = res.data.balance
      } else {
        error.value = res.message || 'Failed to load karma.'
      }
    } catch (err) {
      handleError(err, 'karmaStore.fetch')
      error.value = 'Failed to load karma.'
    } finally {
      loading.value = false
    }
  }

  return {
    transactions,
    loading,
    error,
    balance,
    isGuest,
    fetch,
  }
})
