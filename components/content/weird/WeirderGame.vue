<template>
  <div
    class="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary via-secondary to-base-100"
  >
    <!-- Splash Image -->
    <img
      src="/images/weirdlandia/weird1.png"
      alt="Weirdlandia"
      class="h-48 w-auto mb-8"
    />

    <!-- Story Display -->
    <div
      v-if="story.text"
      class="bg-base-200 rounded-2xl p-8 shadow-lg w-full max-w-xl mt-4"
    >
      <h2 class="text-xl font-semibold mb-4">The Story Continues...</h2>
      <p class="mb-6">{{ story.text }}</p>
      <p class="text-sm text-info mb-2">
        <strong>Progress:</strong> {{ progress }}
      </p>
      <p class="text-sm text-warning mb-4">
        <strong>Narrative Stage:</strong> {{ narrativeStage }}
      </p>

      <div class="flex flex-col gap-4">
        <button
          v-for="(choice, index) in story.choices"
          :key="index"
          class="btn btn-lg btn-secondary"
          @click="submitChoice(choice)"
        >
          {{ choice }}
        </button>

        <!-- Special Item Button -->
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

    <!-- Reward Selection -->
    <div v-if="!story.text && !gameComplete">
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
      <button
        class="btn btn-primary btn-lg mt-4"
        :disabled="selectedRewardId === null"
        @click="setStartingRewardAndStartGame"
      >
        Start Game with Selected Reward
      </button>
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
import { ref, computed, onMounted } from 'vue'
import { useRewardStore } from '@/stores/rewardStore'
import type { Reward } from '@prisma/client' // Import Reward type

// Form states
const username = ref<string>('')
const selectedGenres = ref<string[]>([])
const rounds = ref<'3' | '4' | '5' | 'infinite'>('infinite')
const roundsCompleted = ref<number>(0)
const customChoice = ref<string>('')

// Rewards and Store
const rewardStore = useRewardStore()
const randomRewards = ref<Reward[]>([]) // Explicitly type as Reward[]
const selectedRewardId = ref<number | null>(null) // ID of the selected reward

// Story State
const story = ref<{ text: string; choices: string[] }>({
  text: '',
  choices: [],
})
const gameComplete = ref<boolean>(false)
const debug = ref<string | null>(null)

// Computed Properties
const progress = computed(() =>
  rounds.value === 'infinite'
    ? 'An endless journey awaits.'
    : `${roundsCompleted.value}/${rounds.value} (${Math.round(
        (roundsCompleted.value / +rounds.value) * 100,
      )}%)`,
)

const narrativeStage = computed(() => {
  if (rounds.value === 'infinite') return 'The adventure continues...'
  if (roundsCompleted.value === 0) return 'Introduction: Setting the stage.'
  if (roundsCompleted.value < +rounds.value / 2)
    return 'Rising Action: Building drama and stakes.'
  if (roundsCompleted.value < +rounds.value)
    return 'Climax: An unexpected twist!'
  return 'Resolution: Wrapping up the journey.'
})

// Fetch rewards on mount
onMounted(async () => {
  await rewardStore.fetchRewards()
  randomRewards.value = rewardStore.rewards.slice(0, 3) // Limit to 3 options
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
    roundsCompleted: roundsCompleted.value,
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
    roundsCompleted.value = 0
    debug.value = JSON.stringify(data, null, 2)
  } catch (error) {
    console.error('Error starting game:', error)
    debug.value = `Error: ${error}`
  }
}

// Submit a Choice
const submitChoice = async (choice: string) => {
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
    roundsCompleted.value += 1
    debug.value = JSON.stringify(data, null, 2)
  } catch (error) {
    console.error('Error continuing game:', error)
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
