import { defineStore } from 'pinia'
import type { Reward } from '@prisma/client'
import { performFetch, handleError } from './utils'

interface RewardState {
  rewards: Reward[]
  currentReward: Reward | null
  error: string | null
  startingRewardId: number | null
  isLoading: boolean
}

export const useRewardStore = defineStore({
  id: 'rewardStore',

  state: (): RewardState => ({
    rewards: [],
    currentReward: null,
    error: null,
    startingRewardId: null,
    isLoading: false,
  }),

  getters: {
    currentRewardIcon(): string | null {
      return this.currentReward?.icon || null
    },
    currentRewardText(): string | null {
      return this.currentReward?.text || null
    },
    currentRewardPower(): string | null {
      return this.currentReward?.power || null
    },
    currentRewardCollection(): string | null {
      return this.currentReward?.collection || null
    },
    currentRewardRarity(): number | null {
      return this.currentReward?.rarity || null
    },
  },

  actions: {
    async fetchRewards() {
      this.isLoading = true
      await handleError(async () => {
        const response = await performFetch<Reward[]>('/api/rewards')
        if (response.success) {
          this.rewards = response.data || []
          localStorage.setItem('rewards', JSON.stringify(this.rewards))
        } else {
          throw new Error(response.message || 'Failed to fetch rewards')
        }
      }, 'fetching rewards')
      this.isLoading = false
    },
initializeStore() {
      this.isLoading = true
      try {
        // Load from local storage
        const storedRewards = localStorage.getItem('rewards')
        if (storedRewards) {
          this.rewards = JSON.parse(storedRewards)
        }

        // Fetch from the server
        this.fetchRewards()
      } catch (error) {
        this.error = `Failed to initialize store: ${error}`
        console.error(this.error)
      } finally {
        this.isLoading = false
      }
    },


    async editReward(id: number, updatedData: Partial<Reward>) {
      await handleError(async () => {
        const response = await performFetch<Reward>(`/api/rewards/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(updatedData),
        })
        if (response.success && response.data) {
          const index = this.rewards.findIndex((reward) => reward.id === id)
          if (index !== -1) {
            this.rewards[index] = response.data
            localStorage.setItem('rewards', JSON.stringify(this.rewards))
          }
        } else {
          throw new Error(response.message || 'Failed to edit reward')
        }
      }, `editing reward ID: ${id}`)
    },

    setStartingRewardId(id: number | null) {
      this.startingRewardId = id
    },


    async createReward(newReward: Partial<Reward>) {
      await handleError(async () => {
        const response = await performFetch<Reward>(
          '/api/rewards',
          {
            method: 'POST',
            body: JSON.stringify(newReward),
          },
        )
        if (response.success && response.data) {
          this.rewards.push(response.data)
          localStorage.setItem('rewards', JSON.stringify(this.rewards))
        } else {
          throw new Error(response.message || 'Failed to create reward')
        }
      }, 'creating reward')
    },

async updateRewardById(id: number, updatedReward: Partial<Reward>) {
      await handleError(async () => {
        const response = await performFetch<Reward>(
          `/api/rewards/${id}`,
          {
            method: 'PATCH',
            body: JSON.stringify(updatedReward),
          },
        )
        if (response.success && response.data) {
          const index = this.rewards.findIndex((reward) => reward.id === id)
          if (index !== -1) {
            this.rewards[index] = response.data
            localStorage.setItem('rewards', JSON.stringify(this.rewards))
          }
        } else {
          throw new Error(response.message || 'Failed to update reward')
        }
      }, `updating reward ID: ${id}`)
    },

    async deleteRewardById(id: number) {
      await handleError(async () => {
        const response = await performFetch(`/api/rewards/${id}`, {
          method: 'DELETE',
        })
        if (response.success) {
          this.rewards = this.rewards.filter((reward) => reward.id !== id)
          localStorage.setItem('rewards', JSON.stringify(this.rewards))
        } else {
          throw new Error(response.message || 'Failed to delete reward')
        }
      }, `deleting reward ID: ${id}`)
    },

    async createRewardsBatch(newRewards: Partial<Reward>[]) {
      await handleError(async () => {
        const response = await performFetch<Reward[]>(
          '/api/rewards/batch',
          {
            method: 'POST',
            body: JSON.stringify(newRewards),
          },
        )
        if (response.success && response.data) {
          this.rewards.push(...response.data)
          localStorage.setItem('rewards', JSON.stringify(this.rewards))
        } else {
          throw new Error(
            response.message || 'Failed to create rewards in batch',
          )
        }
      }, 'creating rewards batch')
    },

    clearCurrentReward() {
      this.currentReward = null
    },

    setRewardById(id: number) {
      const selectedReward = this.rewards.find((reward) => reward.id === id)
      if (selectedReward) {
        this.currentReward = selectedReward
      } else {
        this.error = `Reward with ID ${id} not found.`
        console.warn(this.error)
      }
    },
  },
})

export type { Reward }