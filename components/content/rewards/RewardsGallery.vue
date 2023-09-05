<template>
  <div class="bg-base-100 p-4">
    <!-- Error Message -->
    <div v-if="error" class="text-red-500">
      {{ error }}
    </div>

    <!-- Detailed Reward View -->
    <div v-else-if="selectedReward">
      <icon :name="`game-icons:${selectedReward.icon}`" class="text-6xl mb-2" />
      <h1>{{ selectedReward.text }}</h1>
      <p>{{ selectedReward.power }}</p>
      <p>Collection: {{ selectedReward.collection }}</p>
      <p>Rarity: {{ selectedReward.rarity }}</p>
      <button @click="endReward">
        <icon name="game-icons:fast-backward-button" class="text-4xl" />
      </button>
    </div>

    <!-- Rewards Grid -->
    <div v-else class="grid grid-cols-5 gap-4">
      <div
        v-for="reward in rewards"
        :key="reward.id"
        class="p-4 rounded-lg hover:bg-primary hover:text-white cursor-pointer transition duration-300 ease-in-out"
        @click="selectReward(reward)"
      >
        <div class="text-center">
          <icon name="game-icons:open-treasure-chest" class="text-4xl" />
          <p class="mt-2">{{ reward.text }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Reward } from '@prisma/client'

const rewards = ref<Reward[]>([])
const selectedReward = ref<Reward | null>(null)
const error = ref<string | null>(null)

const fetchRewards = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/rewards')
    if (!response.ok) {
      const responseBody = await response.json()
      error.value = `Failed to fetch rewards: ${response.statusText}. ${responseBody.message || ''}`
      return
    }
    rewards.value = await response.json()
  } catch (err: any) {
    error.value = `An error occurred: ${err.message}`
  }
}

onMounted(() => {
  fetchRewards()
})

const selectReward = (reward: Reward) => {
  selectedReward.value = reward
}

const endReward = () => {
  selectedReward.value = null
}
</script>
