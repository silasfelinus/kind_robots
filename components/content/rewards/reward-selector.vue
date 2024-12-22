<template>
  <div class="w-full max-w-lg mx-auto p-4 bg-base-200 rounded-2xl">
    <label for="reward-select" class="block text-lg font-semibold mb-2"
      >Select a Reward:</label
    >
    <select
      id="reward-select"
      v-model="selectedRewardId"
      class="w-full p-3 rounded-lg border border-gray-300 text-gray-800"
      @change="selectReward"
    >
      <option disabled value="">-- Choose a Reward --</option>
      <option
        v-for="reward in rewardStore.rewards"
        :key="reward.id"
        :value="reward.id"
      >
        {{ reward.text }} - Power: {{ reward.power }}
      </option>
    </select>
    <div
      v-if="rewardStore.selectedReward"
      class="mt-4 p-4 bg-base-100 rounded-lg border shadow-md"
    >
      <h2 class="text-xl font-bold mb-2">Selected Reward:</h2>
      <p class="text-lg">
        <span class="font-semibold">Text:</span>
        {{ rewardStore.selectedReward.text }}
      </p>
      <p class="text-lg">
        <span class="font-semibold">Power:</span>
        {{ rewardStore.selectedReward.power }}
      </p>
      <button
        class="mt-4 bg-error text-white px-4 py-2 rounded-lg hover:bg-error-focus transition"
        @click="clearSelection"
      >
        Deselect Reward
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRewardStore } from '@/stores/rewardStore'

// Store
const rewardStore = useRewardStore()
const selectedRewardId = ref(rewardStore.selectedReward?.id || '')

// Methods
const selectReward = () => {
  if (selectedRewardId.value) {
    rewardStore.setRewardById(Number(selectedRewardId.value))
  }
}

const clearSelection = () => {
  rewardStore.selectedReward = null
}
</script>
