<template>
  <div class="bg-base-300 p-6">
    <!-- Error Message -->
    <div v-if="rewardStore.error" class="text-red-500 mb-4">
      🚨 {{ rewardStore.error }}
    </div>

    <!-- Add New Reward Button -->
    <div class="flex justify-end mb-4">
      <button class="bg-primary p-3 rounded-lg" @click="showAddReward = true">
        ➕ Add New Reward
      </button>
    </div>

    <!-- Detailed Reward View -->
    <div v-else-if="rewardStore.currentReward" :class="{ pixelate: pixelate }">
      <Icon
        v-if="rewardStore.currentReward && rewardStore.currentReward.icon"
        :name="rewardStore.currentReward.icon"
        class="text-12xl mb-4 transition-all duration-500 ease-in-out"
      />
      <h1 class="text-4xl mb-2">
        {{ rewardStore.currentReward.text }}
      </h1>
      <p class="text-xl mb-1">🔥 Power: {{ rewardStore.currentReward.power }}</p>
      <p class="text-xl mb-1">
        📚 Collection: {{ rewardStore.currentReward.collection }}
      </p>
      <p class="text-xl mb-4">🌟 Rarity: {{ rewardStore.currentReward.rarity }}</p>
      <div class="flex gap-4">
        <button class="bg-primary p-2 rounded-lg" @click="endReward">
          <Icon name="kind-icon:back-arrow" class="text-2xl" />
        </button>
        <button class="bg-accent p-2 rounded-lg" @click="showEditReward = true">
          ✏️ Edit
        </button>
      </div>
    </div>

    <!-- Edit Reward Form -->
    <div v-if="showEditReward && rewardStore.currentReward" class="mt-4">
      <edit-reward
        :reward="rewardStore.currentReward"
        @updated="showEditReward = false"
      />
    </div>

    <!-- Rewards Grid -->
    <div v-else class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 border-t border-base-100 pt-6">
      <div
        v-for="reward in rewardStore.rewards"
        :key="reward.id"
        class="p-4 rounded-lg hover:bg-primary hover:text-base-300 cursor-pointer transition duration-300 ease-in-out shadow"
        @click="selectReward(reward)"
      >
        <div class="text-center">
          <Icon :name="reward.icon || 'default-icon'" class="text-6xl mb-2" />
          <p class="text-lg">
            {{ reward.text }}
          </p>
        </div>
      </div>
    </div>

    <!-- Add New Reward Form -->
    <div v-if="showAddReward" class="mt-6">
      <add-reward @added="showAddReward = false" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, type Ref } from 'vue'
import { type Reward, useRewardStore } from './../../../stores/rewardStore'

const rewardStore = useRewardStore()
const showAddReward: Ref<boolean> = ref(false)
const showEditReward: Ref<boolean> = ref(false)
const pixelate: Ref<boolean> = ref(false)

// Fetch rewards on mounted
onMounted(() => {
  rewardStore.fetchRewards()
})

const endReward = () => {
  rewardStore.clearCurrentReward()
}

const selectReward = (reward: Reward) => {
  console.log(`Selecting reward with ID: ${reward.id}`) // Debugging line
  pixelate.value = true
  setTimeout(() => {
    rewardStore.setRewardById(reward.id)
    pixelate.value = false
  }, 500)
}
</script>

<style scoped>
.pixelate {
  filter: pixelate(20);
  transition: filter 0.5s ease-in-out;
}
</style>
