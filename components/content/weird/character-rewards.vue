<template>
  <div class="bg-base-300 p-4">
    <!-- Error Message -->
    <div v-if="rewardStore.error" class="text-red-500">
      🚨 {{ rewardStore.error }}
    </div>
<h2>Choose a starting reward:</h2>

    <!-- Rewards Horizontal Scroll -->
    <div class="flex overflow-x-auto space-x-4 items-center scrollbar-hide">
      <div
        v-for="reward in randomRewards"
        :key="reward.id"
        class="flex-none w-40 h-40 rounded-xl bg-base-200 flex items-center justify-center text-center cursor-pointer hover:bg-primary hover:text-default transition-all duration-300 ease-in-out"
        @click="selectReward(reward)"
      >
        <Icon
          v-if="reward.icon"
          :name="reward.icon"
          alt="Reward Icon"
          class="w-24 h-24 object-contain"
        />
        <span class="text-lg text-gray-600 p-2">
          {{ reward.text }}
        </span>
      </div>
    </div>

    <!-- Refresh Rewards Button -->
    <button
      class="bg-accent text-default p-2 rounded mt-4"
      @click="refreshRewards"
    >
      🔄 Refresh Rewards
    </button>

    <!-- Selected Reward Details -->
    <div v-if="rewardStore.currentReward" class="mt-4">
      <h1 class="text-2xl">{{ rewardStore.currentReward.text }}</h1>
      <p>🔥 Power: {{ rewardStore.currentReward.power }}</p>
      <p>🌟 Rarity: {{ rewardStore.currentReward.rarity }}</p>
      <button class="bg-primary p-2 rounded mt-2" @click="endReward">
        Back to Gallery
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { type Reward, useRewardStore } from './../../../stores/rewardStore'

const rewardStore = useRewardStore()

// Fetch initial rewards
onMounted(() => {
  rewardStore.fetchRewards()
})

// Get a random set of 5 rewards
const randomRewards = computed(() => rewardStore.randomRewards)

// Refresh the random set
const refreshRewards = () => {
  rewardStore.refreshRandomRewards()
}

// Clear current reward selection
const endReward = () => {
  rewardStore.clearCurrentReward()
}

// Select a reward
const selectReward = (reward: Reward) => {
  rewardStore.setRewardById(reward.id)
}
</script>

<style scoped>
/* Hide default scrollbar */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
