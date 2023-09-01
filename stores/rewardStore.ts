// ~/store/rewardStore.ts
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
          this.error = `Failed to fetch rewards: ${response.statusText}`
          console.error(this.error)
          return
        }

        this.rewards = await response.json()
      } catch (err: any) {
        this.error = `An error occurred: ${err.message}`
        console.error(this.error)
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
