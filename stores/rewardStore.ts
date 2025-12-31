// /stores/rewardStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Reward } from '~/server/generated/prisma'
import { performFetch } from './utils'

const isClient = typeof window !== 'undefined'

export const useRewardStore = defineStore('rewardStore', () => {
  const rewards = ref<Reward[]>([])
  const selectedReward = ref<Reward | null>(null)
  const error = ref<string | null>(null)
  const startingRewardId = ref<number | null>(null)
  const isLoading = ref(false)
  const randomRewards = ref<Reward[]>([])

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

  function initialize() {
    isLoading.value = true
    try {
      if (isClient) {
        const stored = localStorage.getItem('rewards')
        if (stored) rewards.value = JSON.parse(stored)
      }
      fetchRewards()
    } catch (e) {
      error.value = `Failed to initialize store: ${e}`
      console.error(error.value)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchRewards() {
    isLoading.value = true
    try {
      const res = await performFetch<Reward[]>('/api/rewards')
      if (!res.success || !Array.isArray(res.data)) {
        throw new Error(
          res.message || 'Invalid response format from the server',
        )
      }
      const valid = res.data.filter((r) => r.id && r.text && r.power)
      if (!valid.length) throw new Error('No valid rewards found')
      rewards.value = valid
      refreshRandomRewards()
      if (isClient)
        localStorage.setItem('rewards', JSON.stringify(rewards.value))
    } catch (e) {
      error.value = `Failed to fetch rewards: ${e}`
      console.error(error.value)
    } finally {
      isLoading.value = false
    }
  }

  function refreshRandomRewards() {
    const shuffled = [...rewards.value].sort(() => 0.5 - Math.random())
    randomRewards.value = shuffled.slice(0, 5)
  }

  async function editReward(id: number, updatedData: Partial<Reward>) {
    try {
      const res = await performFetch<Reward>(`/api/rewards/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updatedData),
      })
      if (res.success && res.data) {
        const index = rewards.value.findIndex(
          (r: { id: number }) => r.id === id,
        )
        if (index !== -1) rewards.value[index] = res.data
        if (isClient)
          localStorage.setItem('rewards', JSON.stringify(rewards.value))
      } else throw new Error(res.message || 'Failed to edit reward')
    } catch (e) {
      error.value = `Failed to edit reward: ${e}`
      console.error(error.value)
    }
  }

  function setStartingRewardId(id: number | null) {
    startingRewardId.value = id
  }

  async function createReward(newReward: Partial<Reward>) {
    try {
      const res = await performFetch<Reward>('/api/rewards', {
        method: 'POST',
        body: JSON.stringify(newReward),
      })
      if (res.success && res.data) {
        rewards.value.push(res.data)
        if (isClient)
          localStorage.setItem('rewards', JSON.stringify(rewards.value))
      } else throw new Error(res.message || 'Failed to create reward')
    } catch (e) {
      error.value = `Failed to create reward: ${e}`
      console.error(error.value)
    }
  }

  async function updateRewardById(id: number, updatedReward: Partial<Reward>) {
    try {
      const res = await performFetch<Reward>(`/api/rewards/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updatedReward),
      })
      if (res.success && res.data) {
        const i = rewards.value.findIndex((r: { id: number }) => r.id === id)
        if (i !== -1) rewards.value[i] = res.data
        if (isClient)
          localStorage.setItem('rewards', JSON.stringify(rewards.value))
      } else throw new Error(res.message || 'Failed to update reward')
    } catch (e) {
      error.value = `Failed to update reward: ${e}`
      console.error(error.value)
    }
  }

  async function deleteRewardById(id: number) {
    try {
      const res = await performFetch(`/api/rewards/${id}`, { method: 'DELETE' })
      if (res.success) {
        rewards.value = rewards.value.filter((r: { id: number }) => r.id !== id)
        if (isClient)
          localStorage.setItem('rewards', JSON.stringify(rewards.value))
      } else throw new Error(res.message || 'Failed to delete reward')
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
        if (isClient)
          localStorage.setItem('rewards', JSON.stringify(rewards.value))
      } else throw new Error(res.message || 'Failed to create rewards in batch')
    } catch (e) {
      error.value = `Failed to create rewards in batch: ${e}`
      console.error(error.value)
    }
  }

  function clearselectedReward() {
    selectedReward.value = null
  }

  function setRewardById(id: number) {
    const r = rewards.value.find((r: { id: number }) => r.id === id)
    if (r) selectedReward.value = r
    else {
      error.value = `Reward with ID ${id} not found.`
      console.warn(error.value)
    }
  }

  return {
    rewards,
    selectedReward,
    error,
    startingRewardId,
    isLoading,
    randomRewards,
    selectedRewardIcon,
    selectedRewardText,
    selectedRewardPower,
    selectedRewardCollection,
    selectedRewardRarity,
    initialize,
    fetchRewards,
    refreshRandomRewards,
    editReward,
    setStartingRewardId,
    createReward,
    updateRewardById,
    deleteRewardById,
    createRewardsBatch,
    clearselectedReward,
    setRewardById,
  }
})

export type { Reward }
