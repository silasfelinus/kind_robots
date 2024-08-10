<template>
  <div class="bg-base-200 p-4">
    <!-- Error Message -->
    <div
      v-if="rewardStore.error"
      class="text-red-500"
    >
      🚨 {{ rewardStore.error }}
    </div>

    <!-- Detailed Reward View -->
    <div
      v-else-if="rewardStore.currentReward"
      :class="{ pixelate: pixelate }"
    >
      <icon
        v-if="rewardStore.currentReward && rewardStore.currentReward.icon"
        :name="rewardStore.currentReward.icon"
        class="text-12xl mb-2 transition-all duration-500 ease-in-out"
      />
      <h1 class="text-4xl">
        {{ rewardStore.currentReward.text }}
      </h1>
      <p class="text-xl">
        🔥 Power: {{ rewardStore.currentReward.power }}
      </p>
      <p class="text-xl">
        📚 Collection: {{ rewardStore.currentReward.collection }}
      </p>
      <p class="text-xl">
        🌟 Rarity: {{ rewardStore.currentReward.rarity }}
      </p>
      <button
        class="bg-primary p-2 rounded"
        @click="endReward"
      >
        <icon
          name="game-icons:fast-backward-button"
          class="text-6xl"
        />
      </button>
      <button
        class="bg-accent p-2 rounded"
        @click="showEditReward = true"
      >
        ✏️ Edit
      </button>
    </div>

    <!-- Edit Reward Form -->
    <div v-if="showEditReward && rewardStore.currentReward">
      <edit-reward
        :reward="rewardStore.currentReward"
        @updated="showEditReward = false"
      />
    </div>
    <!-- Rewards Grid -->
    <div
      v-else
      class="grid grid-cols-5 gap-4"
    >
      <div
        v-for="reward in rewardStore.rewards"
        :key="reward.id"
        class="p-4 rounded-lg hover:bg-primary hover:text-default cursor-pointer transition duration-300 ease-in-out"
        @click="selectReward(reward)"
      >
        <div class="text-center">
          <icon
            name="game-icons:open-treasure-chest"
            class="text-6xl"
          />
          <p class="mt-2 text-lg">
            {{ reward.text }}
          </p>
        </div>
      </div>
    </div>

    <!-- Add New Reward Form -->
    <div v-if="showAddReward">
      <add-reward @added="showAddReward = false" />
    </div>

    <!-- Add New Reward Button -->
    <button
      class="bg-primary p-2 rounded mt-4"
      @click="showAddReward = true"
    >
      ➕ Add New Reward
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, type Ref } from 'vue'
import { type Reward, useRewardStore } from '@/stores/rewardStore'

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

const deleteReward = (id: number) => {
  rewardStore.deleteRewardById(id)
}

const setStartingReward = (id: number) => {
  rewardStore.setStartingRewardId(id)
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
