import { defineStore } from 'pinia'
import type { Reward } from '@prisma/client'
import { performFetch } from './utils'

interface RewardState {
  rewards: Reward[]
  selectedReward: Reward | null
  error: string | null
  startingRewardId: number | null
  isLoading: boolean
  randomRewards: Reward[] | null
}

export const useRewardStore = defineStore( 'rewardStore' , {

  state: (): RewardState => ({
    rewards: [],
    selectedReward: null,
    error: null,
    startingRewardId: null,
    isLoading: false,
    randomRewards: [],
  }),

  getters: {
    selectedRewardIcon(): string | null {
      return this.selectedReward?.icon || null
    },
    selectedRewardText(): string | null {
      return this.selectedReward?.text || null
    },
    selectedRewardPower(): string | null {
      return this.selectedReward?.power || null
    },
    selectedRewardCollection(): string | null {
      return this.selectedReward?.collection || null
    },
    selectedRewardRarity(): number | null {
      return this.selectedReward?.rarity || null
    },
  },

  actions: {
    initialize() {
      this.isLoading = true
      try {
        const storedRewards = localStorage.getItem('rewards')
        if (storedRewards) {
          this.rewards = JSON.parse(storedRewards)
        }
        this.fetchRewards()
      } catch (error) {
        this.error = `Failed to initialize store: ${error}`
        console.error(this.error)
      } finally {
        this.isLoading = false
      }
    },
    async fetchRewards() {
      this.isLoading = true
      try {
        const response = await performFetch<Reward[]>('/api/rewards')
        if (!response.success || !Array.isArray(response.data)) {
          throw new Error(
            response.message || 'Invalid response format from the server',
          )
        }

        const validRewards = response.data.filter(
          (reward) => reward.id && reward.text && reward.power,
        )

        if (!validRewards.length) {
          throw new Error('No valid rewards found')
        }

        this.rewards = validRewards
        this.refreshRandomRewards()
        localStorage.setItem('rewards', JSON.stringify(this.rewards))
      } catch (error) {
        this.error = `Failed to fetch rewards: ${error}`
        console.error(this.error)
      } finally {
        this.isLoading = false
      }
    },
    refreshRandomRewards() {
      const shuffled = [...this.rewards].sort(() => 0.5 - Math.random())
      this.randomRewards = shuffled.slice(0, 5)
    },



    async editReward(id: number, updatedData: Partial<Reward>) {
      try {
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
      } catch (error) {
        this.error = `Failed to edit reward: ${error}`
        console.error(this.error)
      }
    },

    setStartingRewardId(id: number | null) {
      this.startingRewardId = id
    },

    async createReward(newReward: Partial<Reward>) {
      try {
        const response = await performFetch<Reward>('/api/rewards', {
          method: 'POST',
          body: JSON.stringify(newReward),
        })

        if (response.success && response.data) {
          this.rewards.push(response.data)
          localStorage.setItem('rewards', JSON.stringify(this.rewards))
        } else {
          throw new Error(response.message || 'Failed to create reward')
        }
      } catch (error) {
        this.error = `Failed to create reward: ${error}`
        console.error(this.error)
      }
    },

    async updateRewardById(id: number, updatedReward: Partial<Reward>) {
      try {
        const response = await performFetch<Reward>(`/api/rewards/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(updatedReward),
        })

        if (response.success && response.data) {
          const index = this.rewards.findIndex((reward) => reward.id === id)
          if (index !== -1) {
            this.rewards[index] = response.data
            localStorage.setItem('rewards', JSON.stringify(this.rewards))
          }
        } else {
          throw new Error(response.message || 'Failed to update reward')
        }
      } catch (error) {
        this.error = `Failed to update reward: ${error}`
        console.error(this.error)
      }
    },

    async deleteRewardById(id: number) {
      try {
        const response = await performFetch(`/api/rewards/${id}`, {
          method: 'DELETE',
        })

        if (response.success) {
          this.rewards = this.rewards.filter((reward) => reward.id !== id)
          localStorage.setItem('rewards', JSON.stringify(this.rewards))
        } else {
          throw new Error(response.message || 'Failed to delete reward')
        }
      } catch (error) {
        this.error = `Failed to delete reward: ${error}`
        console.error(this.error)
      }
    },

    async createRewardsBatch(newRewards: Partial<Reward>[]) {
      try {
        const response = await performFetch<Reward[]>('/api/rewards/batch', {
          method: 'POST',
          body: JSON.stringify(newRewards),
        })

        if (response.success && response.data) {
          this.rewards.push(...response.data)
          localStorage.setItem('rewards', JSON.stringify(this.rewards))
        } else {
          throw new Error(
            response.message || 'Failed to create rewards in batch',
          )
        }
      } catch (error) {
        this.error = `Failed to create rewards in batch: ${error}`
        console.error(this.error)
      }
    },

    clearselectedReward() {
      this.selectedReward = null
    },

    setRewardById(id: number) {
      const selectedReward = this.rewards.find((reward) => reward.id === id)
      if (selectedReward) {
        this.selectedReward = selectedReward
      } else {
        this.error = `Reward with ID ${id} not found.`
        console.warn(this.error)
      }
    },
  },
})

export type { Reward }
