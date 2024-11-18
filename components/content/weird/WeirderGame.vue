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
          v-if="specialItem"
          class="btn btn-lg btn-accent"
          @click="useSpecialItem"
        >
          Use Special Item: {{ specialItem.text }}
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

    <!-- Selection Form -->
    <div v-else class="bg-base-200 rounded-2xl p-8 shadow-lg w-full max-w-xl">
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

      <!-- Debug Rewards Display -->
      <div class="mb-4">
        <p class="text-lg font-semibold mb-2">Your Starting Item</p>
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

// Form states
const username = ref('')
const selectedGenres = ref<string[]>([])
const customChoice = ref('')

// Special Item and API Response
const specialItem = ref<{
  text: string
  power: string
  label: string | null
} | null>(null)
const story = ref<{ text: string; choices: string[] }>({
  text: '',
  choices: [],
})
const debug = ref<string | null>(null)

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
  specialItem.value = randomRewards.value[0] || null
})

// Handle form submission
const startGame = async () => {
  const payload = {
    username: username.value,
    selectedGenres: selectedGenres.value,
    rewards: randomRewards.value,
  }

  // API Call
  try {
    const response = await fetch('/api/botcafe/weirdlandia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await response.json()
    story.value.text = data.text
    story.value.choices = data.choices
    debug.value = JSON.stringify(data, null, 2) // Display debug information
  } catch (error) {
    console.error('Error starting game:', error)
    debug.value = `Error: ${error}`
  }
}

// Submit a choice
const submitChoice = async (choice: string) => {
  const payload = {
    choice,
    username: username.value,
    specialItem: specialItem.value,
  }

  // API Call
  try {
    const response = await fetch('/api/continueGame', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await response.json()
    story.value.text = data.text
    story.value.choices = data.choices
    debug.value = JSON.stringify(data, null, 2) // Display debug information
  } catch (error) {
    console.error('Error continuing game:', error)
    debug.value = `Error: ${error}`
  }
}

// Use the special item
const useSpecialItem = () => {
  submitChoice(`Use ${specialItem.value?.text}`)
}
</script>

<style scoped>
/* Additional styles if needed */
</style>
