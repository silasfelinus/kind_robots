<template>
  <div
    class="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-bg-base-300 via-bg-base-100 to-bg-base-200"
  >
    <!-- Splash Image -->
    <img
      src="/images/weirdlandia/weird1.png"
      alt="Weirdlandia"
      class="h-48 w-auto mb-8"
    />

    <!-- Reward Selection -->
    <div v-if="!story.text && !gameComplete" class="mb-8">
      <h2 class="text-xl font-semibold mb-4">Choose Your Starting Reward</h2>
      <div class="grid grid-cols-3 gap-4">
        <label
          v-for="reward in randomRewards"
          :key="reward.id"
          class="label cursor-pointer"
        >
          <input
            v-model="selectedRewardId"
            type="radio"
            :value="reward.id"
            class="radio radio-primary"
          />
          <div class="bg-secondary p-4 rounded-lg shadow">
            <p class="text-center font-bold">{{ reward.text }}</p>
            <p class="text-center text-sm">{{ reward.power }}</p>
          </div>
        </label>
      </div>
    </div>

    <!-- Name, Genre, and Rounds Selection -->
    <div v-if="!story.text && !gameComplete" class="mb-8">
      <h2 class="text-xl font-semibold mb-4">Enter Your Details</h2>
      <!-- Name Input -->
      <div class="mb-4">
        <label for="username" class="block text-lg font-semibold mb-2"
          >Name:</label
        >
        <input
          id="username"
          v-model="username"
          type="text"
          class="input input-lg input-bordered w-full"
          placeholder="Enter your name"
        />
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

      <!-- Rounds Selection -->
      <div class="mb-4">
        <p class="text-lg font-semibold mb-2">Number of Rounds</p>
        <div class="flex gap-4">
          <button
            v-for="option in roundOptions"
            :key="option"
            class="btn"
            :class="{ 'btn-primary': rounds === option }"
            @click="rounds = option"
          >
            {{ option }}
          </button>
        </div>
      </div>

      <!-- Start Button -->
      <button
        class="btn btn-primary btn-lg w-full mt-4"
        :disabled="!selectedRewardId || !username"
        @click="setStartingRewardAndStartGame"
      >
        Start Game
      </button>
    </div>

    <!-- Story Display -->
    <div
      v-if="story.text"
      class="bg-base-200 rounded-2xl p-8 shadow-lg w-full max-w-xl mt-4"
    >
      <h2 class="text-xl font-semibold mb-4">The Story Continues...</h2>
      <p class="mb-6">{{ story.text }}</p>
      <div class="flex flex-col gap-4">
        <button
          v-for="(choice, index) in story.choices"
          :key="index"
          class="btn btn-lg btn-secondary"
          @click="submitChoice(choice)"
        >
          {{ choice }}
        </button>

        <!-- Use Special Item -->
        <button
          v-if="rewardStore.currentReward"
          class="btn btn-lg btn-accent"
          @click="useSpecialItem"
        >
          Use Special Item: {{ rewardStore.currentReward.text }}
        </button>

        <!-- Custom Input -->
        <input
          v-model="customChoice"
          type="text"
          placeholder="Enter your own choice..."
          class="input input-lg input-bordered"
        />
        <button
          class="btn btn-primary btn-lg"
          :disabled="!customChoice"
          @click="submitChoice(customChoice)"
        >
          Submit Custom Choice
        </button>
      </div>
    </div>

    <!-- Debug Display -->
    <div
      v-if="debug"
      class="bg-info rounded-2xl p-4 shadow-lg w-full max-w-xl mt-4"
    >
      <h2 class="text-lg font-semibold mb-2">Debug Information</h2>
      <pre>{{ debug }}</pre>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRewardStore } from '@/stores/rewardStore'
import type { Reward } from '@prisma/client'

// State
const username = ref('')
const selectedGenres = ref<string[]>([])
const genres = ['Fantasy', 'Sci-Fi', 'Mystery', 'Horror', 'Comedy']
const rounds = ref<'3' | '4' | '5' | 'infinite'>('infinite')
const customChoice = ref<string>('')
const roundsCompleted = ref<number>(0) // Define roundsCompleted

// Ensure button options match the type
const roundOptions: Array<'3' | '4' | '5' | 'infinite'> = [
  '3',
  '4',
  '5',
  'infinite',
]

const randomRewards = ref<Reward[]>([])
const selectedRewardId = ref<number | null>(null)
const story = ref<{ text: string; choices: string[] }>({
  text: '',
  choices: [],
})
const gameComplete = ref(false)
const debug = ref<string | null>(null)

// Reward Store
const rewardStore = useRewardStore()

// Fetch Rewards
onMounted(async () => {
  await rewardStore.fetchRewards()
  randomRewards.value = rewardStore.rewards.slice(0, 3)
})

// Set Starting Reward and Start Game
const setStartingRewardAndStartGame = async () => {
  if (selectedRewardId.value !== null) {
    rewardStore.setStartingRewardId(selectedRewardId.value)
    rewardStore.setRewardById(selectedRewardId.value)
  }
  await startGame()
}

// Start Game
const startGame = async () => {
  const payload = {
    username: username.value,
    genre: selectedGenres.value,
    rounds: rounds.value,
  }

  try {
    const response = await fetch('/api/botcafe/weirdlandia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await response.json()
    story.value.text = data.data.text
    story.value.choices = data.data.choices
  } catch (error) {
    debug.value = `Error: ${error}`
  }
}

const submitChoice = async (choice: string) => {
  // Ensure you use 'choice' in this function
  const payload = {
    username: username.value,
    text: choice,
    reward: rewardStore.currentReward,
    rounds: rounds.value,
    roundsCompleted: roundsCompleted.value + 1,
  }

  try {
    const response = await fetch('/api/botcafe/weirdlandia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await response.json()
    story.value.text = data.data.text
    story.value.choices = data.data.choices
  } catch (error) {
    debug.value = `Error: ${error}`
  }
}

// Use Special Item
const useSpecialItem = () => {
  if (rewardStore.currentReward) {
    submitChoice(`Use ${rewardStore.currentReward.text}`)
  }
}
</script>
