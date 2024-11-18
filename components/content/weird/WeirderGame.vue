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

      <!-- Rounds Selection -->
      <div class="mb-4">
        <p class="text-lg font-semibold mb-2">Choose Rounds</p>
        <div class="flex gap-4">
          <button
            v-for="option in ['3', '4', '5', 'infinite']"
            :key="option"
            :class="{ 'btn-primary': rounds === option }"
            class="btn btn-lg"
            @click="rounds = option"
          >
            {{ option }}
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

// Form states
const username = ref('')
const selectedGenres = ref<string[]>([])
const rounds = ref('infinite')
const roundsCompleted = ref(0)
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

// Computed values for progress and narrative stage
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
    genre: selectedGenres.value,
    rounds: rounds.value,
    roundsCompleted: roundsCompleted.value,
  }

  // API Call
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
    debug.value = JSON.stringify(data, null, 2) // Display debug information
  } catch (error) {
    console.error('Error starting game:', error)
    debug.value = `Error: ${error}`
  }
}

// Submit a choice
const submitChoice = async (choice: string) => {
  const payload = {
    username: username.value,
    text: choice,
    rounds: rounds.value,
    roundsCompleted: roundsCompleted.value + 1,
  }

  // API Call
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
