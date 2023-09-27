<template>
  <div class="bg-base-200 p-4">
    <h1 class="text-2xl mb-4">Reward Portal</h1>

    <!-- Show Rewards -->
    <div class="mb-4">
      <div v-for="reward in rewardStore.rewards" :key="reward.id">
        <!-- Display all relevant reward info -->
        <div class="reward-info">
          {{ reward.icon }} - {{ reward.text }} - {{ reward.power }} - {{ reward.collection }} -
          {{ reward.rarity }}
        </div>
        <button @click="showReward(reward)">Show</button>
        <button @click="editReward(reward)">Edit</button>
        <button @click="deleteReward(reward.id)">Delete</button>
      </div>
    </div>

    <!-- Add Reward Button -->
    <button
      class="bg-primary text-default p-2 rounded mb-4"
      @click="showAddReward = !showAddReward"
    >
      Add New Reward
    </button>

    <!-- Add Reward Form -->
    <transition name="fade" mode="out-in">
      <AddReward v-if="showAddReward" key="add-reward" />
    </transition>

    <!-- Show Reward Modal -->
    <transition name="fade" mode="out-in">
      <EditReward
        v-if="showEditReward && selectedReward !== null"
        key="edit-reward"
        :reward="selectedReward"
      />
    </transition>
    <!-- Show Reward Modal -->
    <transition name="fade" mode="out-in">
      <ShowReward
        v-if="showShowReward && selectedReward !== null"
        key="show-reward"
        :reward="selectedReward"
    /></transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Reward, { useRewardStore } from '@/stores/rewardStore'

const rewardStore = useRewardStore()
const showAddReward: Ref<boolean> = ref(false)
const showEditReward: Ref<boolean> = ref(false)
const showShowReward: Ref<boolean> = ref(false)
const selectedReward: Ref<Reward | null> = ref(null)

// Fetch rewards on mounted
onMounted(() => {
  rewardStore.fetchRewards()
})

const showReward = (reward: Reward): void => {
  selectedReward.value = reward
  showShowReward.value = true
}

const editReward = (reward: Reward): void => {
  selectedReward.value = reward
  showEditReward.value = true
}

const deleteReward = (id: number): void => {
  rewardStore.deleteRewardById(id)
}
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active in <2.1.8 */ {
  opacity: 0;
}
</style>
