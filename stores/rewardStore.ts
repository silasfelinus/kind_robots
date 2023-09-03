// ~/stores/rewardStore.ts
import { defineStore } from 'pinia'
import { Reward } from '@prisma/client'

interface RewardState {
  rewards: Reward[]
  currentReward: Reward | null
  error: string | null
}

export const useRewardStore = defineStore({
  id: 'rewardStore',

  state: (): RewardState => ({
    rewards: [],
    currentReward: null,
    error: null
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
    }
  },

  actions: {
    async fetchRewards() {
      try {
        const response = await fetch('/api/rewards')
        if (!response.ok) {
          const responseBody = await response.json() // Parse the response body
          this.error = `Failed to fetch rewards: ${response.statusText}. ${
            responseBody.message || ''
          }`
          console.error(this.error, response)
          return
        }
        this.rewards = await response.json()
      } catch (err: any) {
        this.error = `An error occurred: ${err.message}`
        console.error(this.error, err.stack) // Log the stack trace
      }
    },
    async createReward(newReward: Partial<Reward>) {
      try {
        const response = await fetch('/api/rewards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newReward)
        })

        if (!response.ok) {
          const responseBody = await response.json()
          this.error = `Failed to create reward: ${response.statusText}. ${
            responseBody.message || ''
          }`
          console.error(this.error, response)
          return
        }

        const createdReward = await response.json()
        this.rewards.push(createdReward)
      } catch (err: any) {
        this.error = `An error occurred: ${err.message}`
        console.error(this.error, err.stack)
      }
    },

    async updateRewardById(id: number, updatedReward: Partial<Reward>) {
      try {
        const response = await fetch(`/api/rewards/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedReward)
        })

        if (!response.ok) {
          const responseBody = await response.json()
          this.error = `Failed to update reward: ${response.statusText}. ${
            responseBody.message || ''
          }`
          console.error(this.error, response)
          return
        }

        const updated = await response.json()
        const index = this.rewards.findIndex((reward) => reward.id === id)
        if (index !== -1) {
          this.rewards[index] = updated
        }
      } catch (err: any) {
        this.error = `An error occurred: ${err.message}`
        console.error(this.error, err.stack)
      }
    },

    async deleteRewardById(id: number) {
      try {
        const response = await fetch(`/api/rewards/${id}`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          this.error = `Failed to delete reward: ${response.statusText}`
          return
        }

        const index = this.rewards.findIndex((reward) => reward.id === id)
        if (index !== -1) {
          this.rewards.splice(index, 1)
        }
      } catch (err: any) {
        this.error = `An error occurred: ${err.message}`
      }
    },

    async createRewardsBatch(newRewards: Partial<Reward>[]) {
      try {
        const response = await fetch('/api/rewards/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newRewards)
        })

        if (!response.ok) {
          this.error = `Failed to create rewards in batch: ${response.statusText}`
          return
        }

        const { rewards } = await response.json()
        this.rewards.push(...rewards)
      } catch (err: any) {
        this.error = `An error occurred: ${err.message}`
      }
    },

    setRewardById(id: number) {
      const selectedReward = this.rewards.find((reward) => reward.id === id)
      if (selectedReward) {
        this.currentReward = selectedReward
      } else {
        this.error = `Reward with ID ${id} not found.`
        console.warn(this.error)
      }
    }
  }
})

export default Reward
