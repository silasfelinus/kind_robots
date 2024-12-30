<template>
  <div class="bg-base-300 p-6 min-h-screen">
    <!-- Error Message -->
    <div v-if="rewardStore.error" class="text-red-500 mb-4">
      🚨 {{ rewardStore.error }}
    </div>

    <!-- Add New Reward Button -->
    <div class="flex justify-end mb-4">
      <button
        class="bg-primary text-white p-3 rounded-lg hover:bg-primary-focus transition"
        @click="showAddReward = true"
      >
        ➕ Add New Reward
      </button>
    </div>

    <!-- Detailed Reward View -->
    <div
      v-if="rewardStore.selectedReward"
      class="p-6 bg-white rounded-lg shadow-lg"
    >
      <div class="text-center mb-4">
        <img
          v-if="rewardStore.selectedReward.artImageId"
          :src="rewardStore.selectedReward.imagePath || ''"
          alt="Reward Image"
          class="rounded-lg shadow-md w-48 h-48 object-cover mx-auto mb-4"
        />

        <Icon
          v-else
          :name="rewardStore.selectedReward.icon || 'default-icon'"
          class="text-8xl text-primary mb-4"
        />
        <h1 class="text-3xl font-bold mb-2">
          {{ rewardStore.selectedReward.text }}
        </h1>
        <p class="text-lg text-gray-600 mb-2">
          🔥 Power: {{ rewardStore.selectedReward.power }}
        </p>
        <p class="text-lg text-gray-600 mb-2">
          📚 Collection: {{ rewardStore.selectedReward.collection }}
        </p>
        <p class="text-lg text-gray-600">
          🌟 Rarity: {{ rewardStore.selectedReward.rarity }}
        </p>
      </div>
      <div class="flex justify-center gap-4 mt-4">
        <button
          class="bg-secondary text-white px-4 py-2 rounded-lg hover:bg-secondary-focus transition"
          @click="endReward"
        >
          Back
        </button>
        <button
          class="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent-focus transition"
          @click="showEditReward = true"
        >
          ✏️ Edit
        </button>
      </div>
    </div>

    <!-- Add New Reward Form -->
    <div v-if="showAddReward" class="mt-6">
      <add-reward @added="showAddReward = false" />
    </div>

    <!-- Rewards Grid -->
    <div
      v-else
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-6"
    >
      <reward-card
        v-for="reward in rewardStore.rewards"
        :key="reward.id"
        :reward="reward"
        @select="selectReward"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRewardStore, type Reward } from '@/stores/rewardStore'

// Store
const rewardStore = useRewardStore()
const showAddReward = ref(false)
const showEditReward = ref(false)

// Methods
const endReward = () => {
  rewardStore.clearselectedReward()
}

const selectReward = (reward: Reward) => {
  rewardStore.setRewardById(reward.id)
}

// Fetch rewards on mount
onMounted(() => {
  rewardStore.fetchRewards()
})
</script>
