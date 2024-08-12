// ~/stores/rewardStore.ts
import { defineStore } from 'pinia'
import type { Reward } from '@prisma/client'

interface RewardState {
  rewards: Reward[]
  currentReward: Reward | null
  error: string | null
  startingRewardId: number | null
  isLoading: boolean
}

interface ErrorResponse {
  message?: string;
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
      this.isLoading = true;
      try {
        const response = await fetch('/api/rewards');
        if (!response.ok) {
          this.error = `Failed to fetch rewards: ${response.statusText}`;
          return;
        }
        const data = await response.json();
        this.rewards = data.rewards; // Make sure the API returns an object with a "rewards" key
      }
      catch (err: unknown) {
        if (err instanceof Error) {
          this.error = `An error occurred: ${err.message}`;
        } else {
          this.error = 'An unknown error occurred.';
        }
      }
      finally {
        this.isLoading = false;
      }
    }
    ,
    async editReward(id: number, updatedData: Partial<Reward>) {
      try {
        const response = await fetch(`/api/rewards/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData),
        });
    
        if (!response.ok) {
          const responseBody: ErrorResponse = await response.json();
          this.error = `Failed to edit reward: ${response.statusText}. ${responseBody.message || ''}`;
          console.error(this.error, response);
          return;
        }
    
        const { success, reward: updatedReward } = await response.json();
        if (success) {
          const index = this.rewards.findIndex(reward => reward.id === id);
          if (index !== -1) {
            this.rewards[index] = updatedReward;
          }
        }
      }
      catch (err: unknown) {
        if (err instanceof Error) {
          this.error = `An error occurred: ${err.message}`;
          console.error(this.error, err.stack);
        } else {
          this.error = 'An unknown error occurred.';
          console.error(this.error);
        }
      }
    }
    ,
    setStartingRewardId(id: number | null) {
      this.startingRewardId = id
    },
    async createReward(newReward: Partial<Reward>) {
      try {
        const response = await fetch('/api/rewards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newReward),
        });
    
        if (!response.ok) {
          const responseBody: ErrorResponse = await response.json();
          this.error = `Failed to create reward: ${response.statusText}. ${responseBody.message || ''}`;
          console.error(this.error, response);
          return;
        }
    
        const createdReward = await response.json();
        this.rewards.push(createdReward);
      }
      catch (err: unknown) {
        if (err instanceof Error) {
          this.error = `An error occurred: ${err.message}`;
          console.error(this.error, err.stack);
        } else {
          this.error = 'An unknown error occurred.';
          console.error(this.error);
        }
      }
    },

    async updateRewardById(id: number, updatedReward: Partial<Reward>) {
      try {
        const response = await fetch(`/api/rewards/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedReward),
        });
    
        if (!response.ok) {
          const responseBody: ErrorResponse = await response.json();
          this.error = `Failed to update reward: ${response.statusText}. ${responseBody.message || ''}`;
          console.error(this.error, response);
          return;
        }
    
        const updated = await response.json();
        const index = this.rewards.findIndex(reward => reward.id === id);
        if (index !== -1) {
          this.rewards[index] = updated;
        }
      }
      catch (err: unknown) {
        if (err instanceof Error) {
          this.error = `An error occurred: ${err.message}`;
          console.error(this.error, err.stack);
        } else {
          this.error = 'An unknown error occurred.';
          console.error(this.error);
        }
      }
    },

    async deleteRewardById(id: number) {
      try {
        const response = await fetch(`/api/rewards/${id}`, {
          method: 'DELETE',
        });
    
        if (!response.ok) {
          this.error = `Failed to delete reward: ${response.statusText}`;
          return;
        }
    
        const index = this.rewards.findIndex(reward => reward.id === id);
        if (index !== -1) {
          this.rewards.splice(index, 1);
        }
      }
      catch (err: unknown) {
        if (err instanceof Error) {
          this.error = `An error occurred: ${err.message}`;
          console.error(this.error);
        } else {
          this.error = 'An unknown error occurred.';
          console.error(this.error);
        }
      }
    },
    
    async createRewardsBatch(newRewards: Partial<Reward>[]) {
      try {
        const response = await fetch('/api/rewards/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newRewards),
        });
    
        if (!response.ok) {
          this.error = `Failed to create rewards in batch: ${response.statusText}`;
          return;
        }
    
        const { rewards } = await response.json();
        this.rewards.push(...rewards);
      }
      catch (err: unknown) {
        if (err instanceof Error) {
          this.error = `An error occurred: ${err.message}`;
          console.error(this.error);
        } else {
          this.error = 'An unknown error occurred.';
          console.error(this.error);
        }
      }
    },
    clearCurrentReward() {
      this.currentReward = null
    },
    setRewardById(id: number) {
      const selectedReward = this.rewards.find(reward => reward.id === id)
      if (selectedReward) {
        this.currentReward = selectedReward
      }
      else {
        this.error = `Reward with ID ${id} not found.`
        console.warn(this.error)
      }
    },
  },
})

export type { Reward }
