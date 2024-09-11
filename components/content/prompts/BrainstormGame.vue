<template>
  <div
    class="flex flex-col items-center bg-base-200 rounded-2xl p-6 m-6 border border-primary shadow-xl"
  >
    <!-- Title and Info -->
    <h1 class="text-4xl font-bold mb-6 text-primary">Brainstorm Café</h1>
    <img
      :src="pageImage"
      alt="Brainstorming"
      class="rounded-full h-40 w-40 mb-6"
    />
    <p class="text-lg mb-6 text-secondary text-center">
      Welcome to the Brainstorm Café! Click the button below to get some fresh,
      creative ideas.
    </p>

    <!-- Button to Fetch New Ideas -->
    <button
      class="bg-primary hover:bg-primary-focus text-white py-3 px-6 rounded-full text-lg mb-6 transition-all duration-300"
      :disabled="isLoading"
      @click="fetchBrainstorm"
    >
      Get New Ideas
    </button>

    <!-- Milestone Reward -->
    <milestone-reward
      v-if="shouldShowMilestoneCheck"
      :id="2"
    ></milestone-reward>

    <!-- Loader when Fetching -->
    <div
      v-if="isLoading"
      class="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-16 w-16 mb-6"
    ></div>

    <!-- Display All Brainstorm Ideas -->
    <transition-group
      name="list"
      tag="div"
      class="flex flex-wrap justify-center w-full"
    >
      <div v-for="idea in allIdeas" :key="idea.id" class="m-2 w-72">
        <BrainstormCard
          :idea="idea"
          class="card-style"
          @click="handleCardClick(idea)"
        />
      </div>
    </transition-group>

    <!-- Error Message if Any -->
    <div
      v-if="errorStore.message"
      class="bg-warning text-white py-4 px-6 rounded-full mt-6 text-center"
    >
      <icon name="error" class="text-lg" /> {{ errorStore.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useErrorStore, ErrorType } from '../../../stores/errorStore'
import { samplePitches } from './../../../training/samplePitches'
import { usePitchStore } from './../../../stores/pitchStore'
import type { Pitch } from './../../../stores/pitchStore'

const isLoading = ref(false)
const pageImage = '/images/avatars/brain1.webp'
const shouldShowMilestoneCheck = ref(false)

// Access the stores
const errorStore = useErrorStore()
const pitchStore = usePitchStore()

// Initialize the list of ideas with samplePitches
const allIdeas = ref<Pitch[]>([...samplePitches])

// Fetch new brainstorm ideas from the API
const fetchBrainstorm = async () => {
  isLoading.value = true
  errorStore.clearError() // Clear any previous errors

  try {
    await errorStore.handleError(
      async () => {
        const response = await fetch('/api/botcafe/brainstorm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            n: 5,
            messages: [
              { role: 'user', content: 'one more original brainstorms' },
            ],
            max_tokens: 500,
          }),
        })

        shouldShowMilestoneCheck.value = true

        const data = await response.json()
        if (data.choices && data.choices[0] && data.choices[0].message) {
          const newIdeas: Pitch[] = parseIdeasFromAPI(
            data.choices[0].message.content,
          )
          if (newIdeas.length > 0) {
            // Add the new pitches to the store and UI
            allIdeas.value = [...newIdeas, ...allIdeas.value]
            pitchStore.addPitches(newIdeas) // Assuming pitchStore handles adding pitches
          } else {
            throw new Error('No new ideas generated')
          }
        } else {
          throw new Error('Invalid API response')
        }
      },
      ErrorType.NETWORK_ERROR,
      'Failed to fetch new brainstorming ideas.',
    )
  } finally {
    isLoading.value = false
  }
}

// Handle card click event
const handleCardClick = (idea: Pitch) => {
  console.log('Card clicked:', idea)
}

// Parse ideas from API response
const parseIdeasFromAPI = (rawContent: string): Pitch[] => {
  const lines = rawContent.split('\n')
  const ideasList = lines.filter((line: string) => /^\d+\./.test(line))
  return ideasList.map((item: string, index: number) => {
    const cleanItem = item.replace(/^\d+\.\s/, '')
    const [title, pitch] = cleanItem.split(' - ')
    return {
      id: allIdeas.value.length + index + 1, // Creating a new unique id
      createdAt: new Date(),
      updatedAt: new Date(),
      title: title || `Idea ${index + 1}`,
      pitch: pitch || cleanItem,
      designer: null,
      flavorText: null,
      highlightImage: null,
      PitchType: 'BRAINSTORM',
      isMature: false,
      isPublic: true,
      userId: 1,
      playerId: null,
      channelId: null,
    } as Pitch
  })
}

// Fetch the initial set of sample pitches on mount
onMounted(() => {
  allIdeas.value = [...samplePitches]
})
</script>

<style scoped>
.loader {
  border-top-color: #3498db;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.card-style {
  background-color: var(--bg-secondary);
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.3s ease-in-out,
    box-shadow 0.3s ease-in-out;
  padding: 1.5rem;
  text-align: center;
  font-size: 1rem;
  cursor: pointer;
}

.card-style:hover {
  transform: translateY(-10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.list-enter-active,
.list-leave-active {
  transition: all 0.5s;
}

.list-enter,
.list-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}
</style>
