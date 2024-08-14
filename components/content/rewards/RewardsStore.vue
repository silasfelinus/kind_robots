<!-- ~/components/RewardsListFromStore.vue -->
<template>
  <div class="bg-base-200 p-4">
    <!-- Loading State -->
    <div v-if="rewardStore.isLoading">Loading rewards...</div>

    <!-- Error State -->
    <div v-if="rewardStore.error">🚨 Error: {{ rewardStore.error }}</div>

    <!-- Rewards List -->
    <div v-else>
      <ul>
        <li v-for="reward in rewardStore.rewards" :key="reward.id">
          {{ reward.text }} (Power: {{ reward.power }})
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRewardStore } from './../../../stores/rewardStore'

const rewardStore = useRewardStore()

// Fetch rewards on mounted
onMounted(() => {
  rewardStore.fetchRewards()
})
</script>
