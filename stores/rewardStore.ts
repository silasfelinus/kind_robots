// /stores/rewardStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Reward } from '~/prisma/generated/prisma/client'
import { performFetch, handleError } from './utils'
import { useNavStore } from '@/stores/navStore'

const isClient = typeof window !== 'undefined'

type RewardInitializeOptions = {
  force?: boolean
  fetchRemote?: boolean
}

export interface RewardForm extends Partial<Reward> {}

const rewardsStorageKey = 'rewards'
const rewardFormStorageKey = 'rewardForm'
const selectedRewardStorageKey = 'selectedReward'
const startingRewardIdStorageKey = 'startingRewardId'
const dashboardKey = 'reward' as const

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

  try {
    const parsed = Number(JSON.parse(raw))
    return Number.isFinite(parsed) ? parsed : null
  } catch {
    const parsed = Number(raw)
    return Number.isFinite(parsed) ? parsed : null
  }
}

function isValidReward(reward: Reward): boolean {
  return Boolean(reward.id && reward.text && reward.power)
}

function sortRewards(a: Reward, b: Reward): number {
  const rarityDelta = (a.rarity ?? 999) - (b.rarity ?? 999)

  if (rarityDelta !== 0) {
    return rarityDelta
  }

  const aText = a.text || ''
  const bText = b.text || ''

  return aText.localeCompare(bText)
}

function toRewardForm(reward: Reward): RewardForm {
  return {
    ...reward,
  }
}

function toRewardPayload(form: RewardForm): Partial<Reward> {
  return {
    ...form,
    text: form.text?.trim() || '',
    power: form.power?.trim() || '',
    collection: form.collection?.trim() || 'general',
    icon: form.icon?.trim() || 'kind-icon:gift',
    label: form.label?.trim() || null,
    rarity: Number.isFinite(Number(form.rarity)) ? Number(form.rarity) : 5,
    userId: form.userId ?? null,
    artImageId: form.artImageId ?? null,
    imagePath: form.imagePath ?? null,
    artPrompt: form.artPrompt ?? null,
  }
}

function createDefaultRewardForm(): RewardForm {
  return {
    text: '',
    power: '',
    collection: 'general',
    icon: 'kind-icon:gift',
    label: '',
    rarity: 5,
    userId: null,
    artImageId: null,
    imagePath: null,
    artPrompt: '',
  }
}

export const useRewardStore = defineStore('rewardStore', () => {
  const rewards = ref<Reward[]>([])
  const selectedReward = ref<Reward | null>(null)
  const rewardForm = ref<RewardForm>({})
  const error = ref<string | null>(null)
  const startingRewardId = ref<number | null>(null)

  const isLoading = ref(false)
  const isSaving = ref(false)
  const isInitialized = ref(false)
  const isInitializing = ref(false)
  const hasLoaded = ref(false)

  const randomRewards = ref<Reward[]>([])

  const initializePromise = ref<Promise<void> | null>(null)
  const fetchPromise = ref<Promise<Reward[]> | null>(null)
  const fetchRewardByIdPromises = ref<Record<number, Promise<Reward | null>>>(
    {},
  )

  const totalRewards = computed(() => rewards.value.length)

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

  const hasUnsavedChanges = computed(() => {
    const selected = selectedReward.value
      ? toRewardPayload(toRewardForm(selectedReward.value))
      : {}

    const form = toRewardPayload(rewardForm.value)

    return JSON.stringify(selected) !== JSON.stringify(form)
  })

  function setError(value: unknown, fallback: string): void {
    error.value = value instanceof Error ? value.message : fallback
  }

  function clearError(): void {
    error.value = null
  }

  function syncToLocalStorage() {
    safeSetLocalStorage(rewardsStorageKey, JSON.stringify(rewards.value))
    safeSetLocalStorage(rewardFormStorageKey, JSON.stringify(rewardForm.value))
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

    rewardForm.value =
      safeParseObject<RewardForm>(safeGetLocalStorage(rewardFormStorageKey)) ??
      {}

    selectedReward.value = safeParseObject<Reward>(
      safeGetLocalStorage(selectedRewardStorageKey),
    )

    startingRewardId.value = safeParseNumber(
      safeGetLocalStorage(startingRewardIdStorageKey),
    )

    refreshRandomRewards()
  }

  function mergeRewards(incoming: Reward[]) {
    const map = new Map<number, Reward>()

    for (const reward of rewards.value) {
      map.set(reward.id, reward)
    }

    for (const reward of incoming) {
      if (isValidReward(reward)) {
        map.set(reward.id, reward)
      }
    }

    rewards.value = Array.from(map.values()).sort(sortRewards)
    refreshRandomRewards()
    syncToLocalStorage()
  }

  function upsertReward(reward: Reward) {
    mergeRewards([reward])

    if (selectedReward.value?.id === reward.id) {
      selectedReward.value = reward
      rewardForm.value = toRewardForm(reward)
    }

    syncToLocalStorage()
  }

  function removeRewardLocally(id: number) {
    rewards.value = rewards.value.filter((reward) => reward.id !== id)

    if (selectedReward.value?.id === id) {
      selectedReward.value = null
      rewardForm.value = {}
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
    const shouldFetchRemote =
      Boolean(options.fetchRemote) &&
      (Boolean(options.force) || !hasLoaded.value || rewards.value.length === 0)

    if (isInitialized.value && !options.force && !shouldFetchRemote) return

    if (initializePromise.value && !options.force) {
      return initializePromise.value
    }

    initializePromise.value = (async () => {
      try {
        isInitializing.value = true
        clearError()

        if (!isInitialized.value || options.force) {
          loadFromLocalStorage()
        }

        if (shouldFetchRemote) {
          await fetchRewards(Boolean(options.force))
        }

        if (!rewardForm.value || Object.keys(rewardForm.value).length === 0) {
          rewardForm.value = createDefaultRewardForm()
          syncToLocalStorage()
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
    if (!force && hasLoaded.value) {
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

        mergeRewards(res.data)
        hasLoaded.value = true

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

  async function selectReward(id: number) {
    const found = rewards.value.find((reward) => reward.id === id)

    if (found) {
      selectedReward.value = found
      rewardForm.value = toRewardForm(found)
      syncToLocalStorage()
      return found
    }

    const fetched = await fetchRewardById(id)

    if (fetched) {
      selectedReward.value = fetched
      rewardForm.value = toRewardForm(fetched)
      syncToLocalStorage()
      return fetched
    }

    setError(new Error(`Reward ${id} not found`), 'Reward not found')
    return null
  }

  async function setRewardById(id: number) {
    return await selectReward(id)
  }

  async function startRewardInteraction(id: number) {
    const reward = await selectReward(id)

    if (!reward) {
      return null
    }

    startingRewardId.value = id
    syncToLocalStorage()

    const navStore = useNavStore()
    navStore.setDashboardTab(dashboardKey, 'interact')

    return reward
  }

  function deselectReward() {
    selectedReward.value = null
    rewardForm.value = {}
    syncToLocalStorage()
  }

  function clearSelectedReward() {
    deselectReward()
  }

  function startAddingReward() {
    selectedReward.value = null
    rewardForm.value = createDefaultRewardForm()
    syncToLocalStorage()
  }

  async function startEditingReward(id?: number) {
    const rewardId = id ?? selectedReward.value?.id

    if (!rewardId) return null

    const reward = await selectReward(rewardId)

    if (!reward) return null

    rewardForm.value = toRewardForm(reward)
    syncToLocalStorage()

    return reward
  }

  async function saveReward() {
    isSaving.value = true

    try {
      clearError()

      const data = toRewardPayload(rewardForm.value)

      if (!data.text) {
        throw new Error('Reward text is required.')
      }

      if (!data.power) {
        throw new Error('Reward power is required.')
      }

      if (data.id && data.id > 0) {
        const result = await updateReward(data.id, data)

        if (!result.success || !result.data) {
          throw new Error(result.message || 'Failed to update reward.')
        }

        return result.data
      }

      const result = await createReward(data)

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Failed to create reward.')
      }

      return result.data
    } catch (caughtError) {
      setError(caughtError, 'Failed to save reward')
      handleError(caughtError, 'saving reward')
      return null
    } finally {
      isSaving.value = false
    }
  }

  function refreshRandomRewards() {
    if (!rewards.value.length) {
      randomRewards.value = []
      return
    }

    const shuffled = [...rewards.value].sort(() => 0.5 - Math.random())
    randomRewards.value = shuffled.slice(0, 5)
  }

  async function updateReward(
    id: number,
    updates: RewardForm | Partial<Reward>,
  ) {
    try {
      clearError()

      const payload = toRewardPayload(updates as RewardForm)

      const res = await performFetch<Reward>(`/api/rewards/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Update failed')
      }

      upsertReward(res.data)
      selectedReward.value = res.data
      rewardForm.value = toRewardForm(res.data)
      syncToLocalStorage()

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

  async function createReward(newReward: RewardForm | Partial<Reward>) {
    try {
      clearError()

      const payload = toRewardPayload(newReward as RewardForm)

      const res = await performFetch<Reward>('/api/rewards', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Create failed')
      }

      upsertReward(res.data)
      selectedReward.value = res.data
      rewardForm.value = toRewardForm(res.data)
      syncToLocalStorage()

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

  async function createRewardsBatch(
    newRewards: Array<RewardForm | Partial<Reward>>,
  ) {
    try {
      clearError()

      const payload = newRewards.map((reward) =>
        toRewardPayload(reward as RewardForm),
      )

      const res = await performFetch<Reward[]>('/api/rewards/batch', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Batch create failed')
      }

      mergeRewards(res.data)

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

  function resetInitialization() {
    isInitialized.value = false
    isInitializing.value = false
    initializePromise.value = null
    fetchPromise.value = null
    fetchRewardByIdPromises.value = {}
    hasLoaded.value = false
    error.value = null
  }

  return {
    rewards,
    selectedReward,
    rewardForm,
    error,
    startingRewardId,

    isLoading,
    isSaving,
    isInitialized,
    isInitializing,
    hasLoaded,
    randomRewards,

    initializePromise,
    fetchPromise,
    fetchRewardByIdPromises,

    totalRewards,
    hasUnsavedChanges,

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

    selectReward,
    setRewardById,
    startRewardInteraction,
    deselectReward,
    clearSelectedReward,

    startAddingReward,
    startEditingReward,
    saveReward,

    refreshRandomRewards,
    updateReward,
    createReward,
    deleteReward,
    createRewardsBatch,
    setStartingRewardId,

    toRewardForm,
    toRewardPayload,
    createDefaultRewardForm,
  }
})

export type { Reward }
