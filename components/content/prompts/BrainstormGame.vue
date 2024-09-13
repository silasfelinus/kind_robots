<template>
  <div
    class="flex flex-col items-center bg-base-200 rounded-2xl p-4 sm:p-6 md:p-8 m-4 md:m-6 border border-primary shadow-xl w-full max-w-full overflow-hidden"
  >
    <!-- Title and Info -->
    <h1
      class="text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-primary text-center"
    >
      Brainstorm Cafe
    </h1>
    <p class="text-sm sm:text-lg mb-4 sm:mb-6 text-secondary text-center">
      Select your top five ideas for brainstorming. Click on a pitch to add it
      to your top five, or create your own!
    </p>

    <AddPitch @pitch-created="handlePitchCreated" />

    <!-- Top 5 Selected Pitches (Responsive) -->
    <div
      class="flex flex-wrap justify-center sm:justify-around mb-6 w-full max-w-full overflow-hidden"
    >
      <div
        v-for="(pitch, index) in selectedPitches"
        :key="index"
        class="bg-accent text-white rounded-lg p-4 m-2 sm:m-0 w-full sm:w-1/3 md:w-1/5 flex flex-col items-center justify-center text-center h-28 sm:h-20 hover:shadow-lg transition duration-300"
      >
        <div v-if="pitch">
          <h4 class="text-md md:text-lg font-semibold">{{ pitch.title }}</h4>
          <p class="text-xs md:text-sm">{{ pitch.pitch }}</p>
        </div>
        <p v-else class="text-gray-400">Select a pitch</p>
      </div>
    </div>

    <!-- Display All Brainstorm Ideas (Responsive Grid with Editing) -->
    <transition-group
      name="list"
      tag="div"
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 justify-center w-full max-w-full"
    >
      <div
        v-for="idea in brainstormPitches"
        :key="idea.id"
        class="bg-base-100 shadow-md rounded-lg p-4 cursor-pointer hover:bg-base-300 transition duration-300"
        @click="selectPitch(idea)"
      >
        <!-- Basic Pitch Display -->
        <div>
          <h4 class="text-md md:text-lg font-semibold">{{ idea.title }}</h4>
          <p class="text-xs md:text-sm">{{ idea.pitch }}</p>
          <button
            class="bg-yellow-500 hover:bg-yellow-700 text-white py-2 px-4 rounded-full transition duration-300 ml-2"
            @click.stop="reactToPitch(idea, ReactionType.CLAPPED)"
          >
            Clap Reaction
          </button>
          <button
            class="bg-yellow-500 hover:bg-yellow-700 text-white py-2 px-4 rounded-full transition duration-300 ml-2"
            @click.stop="reactToPitch(idea, ReactionType.LOVED)"
          >
            Love Reaction
          </button>
          <button
            class="bg-yellow-500 hover:bg-yellow-700 text-white py-2 px-4 rounded-full transition duration-300 ml-2"
            @click.stop="reactToPitch(idea, ReactionType.HATED)"
          >
            Hate Reaction
          </button>
        </div>
      </div>
    </transition-group>

    <!-- Button to Submit the Top 5 Selected Pitches -->
    <button
      class="bg-primary hover:bg-primary-focus text-white py-2 sm:py-3 px-6 rounded-full text-base sm:text-lg mt-6 transition-all duration-300"
      :disabled="
        selectedPitches.filter((p) => p !== null).length < 5 || isSubmitting
      "
      @click="submitTopPitches"
    >
      {{ isSubmitting ? 'Submitting...' : 'Submit Top 5 Pitches' }}
    </button>

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
import { ref, computed } from 'vue'
import { usePitchStore } from './../../../stores/pitchStore'
import { useErrorStore, ErrorType } from './../../../stores/errorStore'
import AddPitch from './AddPitch.vue'
import type { Pitch } from './../../../stores/pitchStore'
import { useReactionStore, ReactionType } from '../../../stores/reactionStore'

// Stores and States
const pitchStore = usePitchStore()
const errorStore = useErrorStore()
const reactionStore = useReactionStore()
const selectedPitches = ref<(Pitch | null)[]>([null, null, null, null, null])

// Computed brainstorm pitches
const brainstormPitches = computed(() => pitchStore.brainstormPitches)

// Event handler for when a custom pitch is created
const handlePitchCreated = (pitch: Pitch) => {
  selectedPitches.value.unshift(pitch)
  if (selectedPitches.value.length > 5) {
    selectedPitches.value.pop()
  }
}

const reactToPitch = async (pitch: Pitch, reactionType: ReactionType) => {
  try {
    const userStore = useUserStore()
    await reactionStore.createReaction({
      pitchId: pitch.id,
      userId: userStore.userId,
      reactionType, // Use ReactionType enum directly
    })
  } catch (error: unknown) {
    const err = error as Error
    errorStore.setError(ErrorType.NETWORK_ERROR, err)
    console.error('Failed to react to pitch:', err.message)
  }
}

const selectPitch = (pitch: Pitch) => {
  selectedPitches.value = selectedPitches.value.filter(
    (p) => p?.id !== pitch.id,
  )
  selectedPitches.value.unshift(pitch)
  if (selectedPitches.value.length > 5) {
    selectedPitches.value.pop()
  }
}

const isSubmitting = ref(false)

const submitTopPitches = async () => {
  try {
    if (selectedPitches.value.filter((p) => p !== null).length !== 5) {
      throw new Error('Please select exactly 5 pitches.')
    }

    isSubmitting.value = true

    const topFive = selectedPitches.value.map((pitch) => ({
      title: pitch?.title || '',
      pitch: pitch?.pitch || '',
    }))

    const response = await fetch('/api/botcafe/submit-pitches', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topFive }),
    })

    if (!response.ok) {
      throw new Error('Failed to submit pitches.')
    }

    alert('Top 5 pitches submitted successfully!')
    selectedPitches.value = [null, null, null, null, null]
  } catch (error: unknown) {
    const err = error as Error
    errorStore.setError(
      ErrorType.NETWORK_ERROR,

      err || 'Failed to submit top 5 pitches',
    )
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
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

.bg-accent {
  background-color: var(--bg-accent) !important;
}
</style>
