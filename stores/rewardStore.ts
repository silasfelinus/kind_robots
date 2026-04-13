// /stores/rewardStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Reward } from '~/prisma/generated/prisma/client'
import { performFetch } from './utils'

const isClient = typeof window !== 'undefined'

export const useRewardStore = defineStore('rewardStore', () => {
  const rewards = ref<Reward[]>([])
  const selectedReward = ref<Reward | null>(null)
  const error = ref<string | null>(null)
  const startingRewardId = ref<number | null>(null)
  const isLoading = ref(false)
  const isInitialized = ref(false)
  const hasLoaded = ref(false)

  const randomRewards = ref<Reward[]>([])

  const initializePromise = ref<Promise<void> | null>(null)
  const fetchPromise = ref<Promise<Reward[]> | null>(null)

  const selectedRewardIcon = computed(() => selectedReward.value?.icon || null)
  const selectedRewardText = computed(() => selectedReward.value?.text || null)
  const selectedRewardPower = computed(
    () => selectedReward.value?.power || null,
  )
  const selectedRewardCollection = computed(
    () => selectedReward.value?.collection || null,
  )
  const selectedRewardRarity = computed(
    () => selectedReward.value?.rarity || null,
  )

  function syncToLocalStorage() {
    if (!isClient) return
    try {
      localStorage.setItem('rewards', JSON.stringify(rewards.value))
    } catch (e) {
      console.warn('[rewardStore] localStorage sync failed', e)
    }
  }

  function loadFromLocalStorage() {
    if (!isClient) return
    try {
      const stored = localStorage.getItem('rewards')
      if (stored) rewards.value = JSON.parse(stored)
    } catch (e) {
      console.warn('[rewardStore] localStorage load failed', e)
    }
  }

  async function initialize() {
    if (isInitialized.value) return
    if (initializePromise.value) return initializePromise.value

    initializePromise.value = (async () => {
      try {
        loadFromLocalStorage()

        if (!rewards.value.length) {
          await fetchRewards()
        }

        isInitialized.value = true
      } catch (e) {
        error.value = `Failed to initialize: ${e}`
        console.error(error.value)
        isInitialized.value = false
      } finally {
        initializePromise.value = null
      }
    })()

    return initializePromise.value
  }

  async function fetchRewards(force = false): Promise<Reward[]> {
    if (!force && hasLoaded.value) return rewards.value
    if (fetchPromise.value) return fetchPromise.value

    fetchPromise.value = (async () => {
      isLoading.value = true
      error.value = null

      try {
        const res = await performFetch<Reward[]>('/api/rewards')

        if (!res.success || !Array.isArray(res.data)) {
          throw new Error(res.message || 'Invalid response')
        }

        const valid = res.data.filter((r) => r.id && r.text && r.power)

        if (!valid.length) throw new Error('No valid rewards found')

        rewards.value = valid
        hasLoaded.value = true

        syncToLocalStorage()
        refreshRandomRewards()

        return valid
      } catch (e) {
        hasLoaded.value = false
        error.value = `Failed to fetch rewards: ${e}`
        console.error(error.value)
        return []
      } finally {
        isLoading.value = false
        fetchPromise.value = null
      }
    })()

    return fetchPromise.value
  }

  function refreshRandomRewards() {
    if (!rewards.value.length) return

    const shuffled = [...rewards.value].sort(() => 0.5 - Math.random())
    randomRewards.value = shuffled.slice(0, 5)
  }

  async function updateReward(id: number, updates: Partial<Reward>) {
    try {
      const res = await performFetch<Reward>(`/api/rewards/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })

      if (res.success && res.data) {
        const index = rewards.value.findIndex((r) => r.id === id)
        if (index !== -1) rewards.value[index] = res.data
        syncToLocalStorage()
      } else {
        throw new Error(res.message || 'Update failed')
      }
    } catch (e) {
      error.value = `Failed to update reward: ${e}`
      console.error(error.value)
    }
  }

  async function createReward(newReward: Partial<Reward>) {
    try {
      const res = await performFetch<Reward>('/api/rewards', {
        method: 'POST',
        body: JSON.stringify(newReward),
      })

      if (res.success && res.data) {
        rewards.value.push(res.data)
        syncToLocalStorage()
      } else {
        throw new Error(res.message || 'Create failed')
      }
    } catch (e) {
      error.value = `Failed to create reward: ${e}`
      console.error(error.value)
    }
  }

  async function deleteReward(id: number) {
    try {
      const res = await performFetch(`/api/rewards/${id}`, {
        method: 'DELETE',
      })

      if (res.success) {
        rewards.value = rewards.value.filter((r) => r.id !== id)
        syncToLocalStorage()
      } else {
        throw new Error(res.message || 'Delete failed')
      }
    } catch (e) {
      error.value = `Failed to delete reward: ${e}`
      console.error(error.value)
    }
  }

  async function createRewardsBatch(newRewards: Partial<Reward>[]) {
    try {
      const res = await performFetch<Reward[]>('/api/rewards/batch', {
        method: 'POST',
        body: JSON.stringify(newRewards),
      })

      if (res.success && res.data) {
        rewards.value.push(...res.data)
        syncToLocalStorage()
      } else {
        throw new Error(res.message || 'Batch create failed')
      }
    } catch (e) {
      error.value = `Batch create failed: ${e}`
      console.error(error.value)
    }
  }

  function setStartingRewardId(id: number | null) {
    startingRewardId.value = id
  }

  function setRewardById(id: number) {
    const found = rewards.value.find((r) => r.id === id)
    if (found) selectedReward.value = found
    else {
      error.value = `Reward ${id} not found`
      console.warn(error.value)
    }
  }

  function clearSelectedReward() {
    selectedReward.value = null
  }

  return {
    rewards,
    selectedReward,
    error,
    startingRewardId,
    isLoading,
    isInitialized,
    hasLoaded,
    randomRewards,
    selectedRewardIcon,
    selectedRewardText,
    selectedRewardPower,
    selectedRewardCollection,
    selectedRewardRarity,
    initialize,
    fetchRewards,
    refreshRandomRewards,
    updateReward,
    createReward,
    deleteReward,
    createRewardsBatch,
    setStartingRewardId,
    setRewardById,
    clearSelectedReward,
  }
})

export type { Reward }
