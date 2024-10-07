<template>
  <div
    class="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary via-secondary to-base-100"
  >
    <!-- Splash Image -->
    <img
      src="/images/weirdlandia-logo.png"
      alt="Weirdlandia"
      class="h-48 w-auto mb-8"
    />

    <!-- Selection Form -->
    <div class="bg-base-200 rounded-2xl p-8 shadow-lg w-full max-w-xl">
      <!-- Username Input -->
      <div class="mb-4">
        <label for="username" class="block text-lg font-semibold mb-2"
          >Enter Your Username</label
        >
        <input
          id="username"
          v-model="username"
          type="text"
          class="input input-lg input-bordered w-full"
          placeholder="Your name"
        />
      </div>

      <!-- Random Rewards Display -->
      <div class="mb-4">
        <p class="text-lg font-semibold mb-2">Your Starting Rewards</p>
        <div class="flex gap-4">
          <div
            v-for="(reward, index) in randomRewards"
            :key="index"
            class="bg-secondary p-4 rounded-lg shadow"
          >
            <p class="text-center">{{ reward.text }}</p>
            <p class="text-sm text-center">{{ reward.power }}</p>
            <p class="text-xs text-center text-gray-500">{{ reward.label }}</p>
          </div>
        </div>
      </div>

      <!-- Number of Scenes Selection -->
      <div class="mb-4">
        <p class="text-lg font-semibold mb-2">Number of Encounters</p>
        <div class="flex gap-4">
          <button
            v-for="num in [1, 2, 3, 4, 5]"
            :key="num"
            class="btn btn-lg bg-info"
            :class="{ 'btn-primary': selectedScenes === num }"
            @click="selectedScenes = num"
          >
            {{ num }}
          </button>
        </div>
      </div>

      <!-- Genre Selection -->
      <div class="mb-4">
        <p class="text-lg font-semibold mb-2">Choose Genres</p>
        <div class="grid grid-cols-2 gap-4">
          <label
            v-for="genre in genres"
            :key="genre"
            class="label cursor-pointer"
          >
            <input
              v-model="selectedGenres"
              type="checkbox"
              :value="genre"
              class="checkbox checkbox-primary"
            />
            <span class="label-text ml-2">{{ genre }}</span>
          </label>
        </div>
      </div>

      <!-- Start Button -->
      <button class="btn btn-primary btn-lg w-full mt-4" @click="startGame">
        Start Game
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRewardStore } from '@/stores/rewardStore'

// Form states
const username = ref('')
const selectedScenes = ref(1)
const selectedGenres = ref<string[]>([])

// Available genres
const genres = ['Fantasy', 'Sci-Fi', 'Mystery', 'Horror', 'Comedy']

// Reward store setup
const rewardStore = useRewardStore()
const randomRewards = ref<
  { text: string; power: string; label: string | null }[]
>([])

// Fetch random rewards on page load
onMounted(async () => {
  await rewardStore.fetchRewards()
  randomRewards.value = rewardStore.rewards
    .sort(() => 0.5 - Math.random())
    .slice(0, 3)
    .map((reward) => ({
      text: reward.text,
      power: reward.power,
      label: reward.label,
    })) // Only select text, power, and label from the rewards
})

// Handle form submission
const startGame = () => {
  const payload = {
    username: username.value,
    selectedScenes: selectedScenes.value,
    selectedGenres: selectedGenres.value,
    rewards: randomRewards.value,
  }

  // Send data to gameStore or an API for processing
  console.log('Game started with:', payload)
  // Replace this with a real API call or store action
}
</script>

<style scoped>
/* Additional styles if needed */
</style>
