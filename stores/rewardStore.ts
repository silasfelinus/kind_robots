// /stores/rewardStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Reward } from '~/prisma/generated/prisma/client'
import { performFetch, handleError } from './utils'

const isClient = typeof window !== 'undefined'

type RewardInitializeOptions = {
  force?: boolean
  fetchRemote?: boolean
}

const rewardsStorageKey = 'rewards'
const selectedRewardStorageKey = 'selectedReward'
const startingRewardIdStorageKey = 'startingRewardId'

function safeGetLocalStorage(key: string): string | null {
  if (!isClient) return null

  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetLocalStorage(key: string, value: string): void {
  if (!isClient) return

  try {
    localStorage.setItem(key, value)
  } catch {}
}

function safeParseArray<T>(raw: string | null): T[] {
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function safeParseObject<T>(raw: string | null): T | null {
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as T) : null
  } catch {
    return null
  }
}

function safeParseNumber(raw: string | null): number | null {
  if (!raw) return null

  const parsed = Number(JSON.parse(raw))
  return Number.isFinite(parsed) ? parsed : null
}

function isValidReward(reward: Reward): boolean {
  return Boolean(reward.id && reward.text && reward.power)
}

function sortRewards(a: Reward, b: Reward): number {
  const rarityDelta = (a.rarity ?? 999) - (b.rarity ?? 999)

  if (rarityDelta !== 0) {
    return rarityDelta
  }

  return a.id - b.id
}

export const useRewardStore = defineStore('rewardStore', () => {
  const rewards = ref<Reward[]>([])
  const selectedReward = ref<Reward | null>(null)
  const error = ref<string | null>(null)
  const startingRewardId = ref<number | null>(null)
  const isLoading = ref(false)
  const isInitialized = ref(false)
  const isInitializing = ref(false)
  const hasLoaded = ref(false)

  const randomRewards = ref<Reward[]>([])

  const initializePromise = ref<Promise<void> | null>(null)
  const fetchPromise = ref<Promise<Reward[]> | null>(null)
  const fetchRewardByIdPromises = ref<Record<number, Promise<Reward | null>>>(
    {},
  )

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

  function setError(value: unknown, fallback: string): void {
    error.value = value instanceof Error ? value.message : fallback
  }

  function clearError(): void {
    error.value = null
  }

  function syncToLocalStorage() {
    safeSetLocalStorage(rewardsStorageKey, JSON.stringify(rewards.value))
    safeSetLocalStorage(
      selectedRewardStorageKey,
      JSON.stringify(selectedReward.value),
    )
    safeSetLocalStorage(
      startingRewardIdStorageKey,
      JSON.stringify(startingRewardId.value),
    )
  }

  function loadFromLocalStorage() {
    rewards.value = safeParseArray<Reward>(
      safeGetLocalStorage(rewardsStorageKey),
    )
      .filter(isValidReward)
      .sort(sortRewards)

    selectedReward.value = safeParseObject<Reward>(
      safeGetLocalStorage(selectedRewardStorageKey),
    )

    startingRewardId.value = safeParseNumber(
      safeGetLocalStorage(startingRewardIdStorageKey),
    )

    refreshRandomRewards()
  }

  function upsertReward(reward: Reward) {
    const index = rewards.value.findIndex((entry) => entry.id === reward.id)

    if (index >= 0) {
      rewards.value.splice(index, 1, reward)
    } else {
      rewards.value.push(reward)
    }

    rewards.value.sort(sortRewards)

    if (selectedReward.value?.id === reward.id) {
      selectedReward.value = reward
    }

    refreshRandomRewards()
    syncToLocalStorage()
  }

  function removeRewardLocally(id: number) {
    rewards.value = rewards.value.filter((reward) => reward.id !== id)

    if (selectedReward.value?.id === id) {
      selectedReward.value = null
    }

    if (startingRewardId.value === id) {
      startingRewardId.value = null
    }

    refreshRandomRewards()
    syncToLocalStorage()
  }

  async function initialize(
    options: RewardInitializeOptions = {},
  ): Promise<void> {
    if (isInitialized.value && !options.force) return
    if (initializePromise.value && !options.force)
      return initializePromise.value

    initializePromise.value = (async () => {
      try {
        isInitializing.value = true
        clearError()

        loadFromLocalStorage()

        if (options.fetchRemote) {
          await fetchRewards(Boolean(options.force))
        }

        isInitialized.value = true
      } catch (caughtError) {
        setError(caughtError, 'Failed to initialize rewards')
        handleError(caughtError, 'initializing reward store')
        isInitialized.value = false
      } finally {
        isInitializing.value = false
        initializePromise.value = null
      }
    })()

    return initializePromise.value
  }

  async function fetchRewards(force = false): Promise<Reward[]> {
    if (!force && hasLoaded.value && rewards.value.length) {
      return rewards.value
    }

    if (fetchPromise.value && !force) {
      return fetchPromise.value
    }

    fetchPromise.value = (async () => {
      isLoading.value = true
      clearError()

      try {
        const res = await performFetch<Reward[]>('/api/rewards')

        if (!res.success || !Array.isArray(res.data)) {
          throw new Error(res.message || 'Invalid response')
        }

        const valid = res.data.filter(isValidReward).sort(sortRewards)

        rewards.value = valid
        hasLoaded.value = true

        refreshRandomRewards()
        syncToLocalStorage()

        return rewards.value
      } catch (caughtError) {
        hasLoaded.value = false
        setError(caughtError, 'Failed to fetch rewards')
        handleError(caughtError, 'fetching rewards')
        return rewards.value
      } finally {
        isLoading.value = false
        fetchPromise.value = null
      }
    })()

    return fetchPromise.value
  }

  async function fetchRewardById(id: number): Promise<Reward | null> {
    const existing = rewards.value.find((reward) => reward.id === id)

    if (existing) {
      return existing
    }

    if (fetchRewardByIdPromises.value[id]) {
      return fetchRewardByIdPromises.value[id]
    }

    fetchRewardByIdPromises.value[id] = (async () => {
      try {
        clearError()

        const res = await performFetch<Reward>(`/api/rewards/${id}`)

        if (!res.success || !res.data) {
          throw new Error(res.message || 'Reward not found')
        }

        upsertReward(res.data)
        return res.data
      } catch (caughtError) {
        setError(caughtError, 'Failed to fetch reward')
        handleError(caughtError, 'fetching reward by ID')
        return null
      } finally {
        delete fetchRewardByIdPromises.value[id]
      }
    })()

    return fetchRewardByIdPromises.value[id]
  }

  function refreshRandomRewards() {
    if (!rewards.value.length) {
      randomRewards.value = []
      return
    }

    const shuffled = [...rewards.value].sort(() => 0.5 - Math.random())
    randomRewards.value = shuffled.slice(0, 5)
  }

  async function updateReward(id: number, updates: Partial<Reward>) {
    try {
      clearError()

      const res = await performFetch<Reward>(`/api/rewards/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Update failed')
      }

      upsertReward(res.data)

      return {
        success: true,
        data: res.data,
      }
    } catch (caughtError) {
      setError(caughtError, 'Failed to update reward')
      handleError(caughtError, 'updating reward')

      return {
        success: false,
        message:
          caughtError instanceof Error
            ? caughtError.message
            : 'Failed to update reward',
      }
    }
  }

  async function createReward(newReward: Partial<Reward>) {
    try {
      clearError()

      const res = await performFetch<Reward>('/api/rewards', {
        method: 'POST',
        body: JSON.stringify(newReward),
      })

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Create failed')
      }

      upsertReward(res.data)

      return {
        success: true,
        data: res.data,
      }
    } catch (caughtError) {
      setError(caughtError, 'Failed to create reward')
      handleError(caughtError, 'creating reward')

      return {
        success: false,
        message:
          caughtError instanceof Error
            ? caughtError.message
            : 'Failed to create reward',
      }
    }
  }

  async function deleteReward(id: number) {
    try {
      clearError()

      const res = await performFetch(`/api/rewards/${id}`, {
        method: 'DELETE',
      })

      if (!res.success) {
        throw new Error(res.message || 'Delete failed')
      }

      removeRewardLocally(id)

      return {
        success: true,
      }
    } catch (caughtError) {
      setError(caughtError, 'Failed to delete reward')
      handleError(caughtError, 'deleting reward')

      return {
        success: false,
        message:
          caughtError instanceof Error
            ? caughtError.message
            : 'Failed to delete reward',
      }
    }
  }

  async function createRewardsBatch(newRewards: Partial<Reward>[]) {
    try {
      clearError()

      const res = await performFetch<Reward[]>('/api/rewards/batch', {
        method: 'POST',
        body: JSON.stringify(newRewards),
      })

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Batch create failed')
      }

      for (const reward of res.data) {
        upsertReward(reward)
      }

      return {
        success: true,
        data: res.data,
      }
    } catch (caughtError) {
      setError(caughtError, 'Batch create failed')
      handleError(caughtError, 'creating rewards batch')

      return {
        success: false,
        message:
          caughtError instanceof Error
            ? caughtError.message
            : 'Batch create failed',
      }
    }
  }

  function setStartingRewardId(id: number | null) {
    startingRewardId.value = id
    syncToLocalStorage()
  }

  async function setRewardById(id: number) {
    const found = rewards.value.find((reward) => reward.id === id)

    if (found) {
      selectedReward.value = found
      syncToLocalStorage()
      return found
    }

    const fetched = await fetchRewardById(id)

    if (fetched) {
      selectedReward.value = fetched
      syncToLocalStorage()
      return fetched
    }

    error.value = `Reward ${id} not found`
    return null
  }

  function clearSelectedReward() {
    selectedReward.value = null
    syncToLocalStorage()
  }

  function resetInitialization() {
    isInitialized.value = false
    isInitializing.value = false
    initializePromise.value = null
    fetchPromise.value = null
    fetchRewardByIdPromises.value = {}
    error.value = null
  }

  return {
    rewards,
    selectedReward,
    error,
    startingRewardId,
    isLoading,
    isInitialized,
    isInitializing,
    hasLoaded,
    randomRewards,
    initializePromise,
    fetchPromise,
    fetchRewardByIdPromises,

    selectedRewardIcon,
    selectedRewardText,
    selectedRewardPower,
    selectedRewardCollection,
    selectedRewardRarity,

    initialize,
    resetInitialization,
    loadFromLocalStorage,
    syncToLocalStorage,
    fetchRewards,
    fetchRewardById,
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
