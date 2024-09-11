<template>
  <div
    class="flex flex-col items-center bg-base-200 rounded-2xl p-4 sm:p-6 md:p-8 m-4 md:m-6 border border-primary shadow-xl w-full"
  >
    <!-- Title and Info -->
    <h1
      class="text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-primary text-center"
    >
      Brainstorm Café
    </h1>
    <p class="text-sm sm:text-lg mb-4 sm:mb-6 text-secondary text-center">
      Select your top five ideas for brainstorming. Click on a pitch to add it
      to your top five.
    </p>

    <!-- Top 5 Selected Pitches (Responsive) -->
    <div class="flex flex-wrap justify-center sm:justify-around mb-6 w-full">
      <div
        v-for="(pitch, index) in selectedPitches"
        :key="index"
        class="bg-accent text-white rounded-lg p-4 m-2 sm:m-0 w-full sm:w-1/3 md:w-1/5 flex items-center justify-center text-center h-28 sm:h-20"
      >
        <div v-if="pitch">
          <h4 class="text-md md:text-lg font-semibold">{{ pitch.title }}</h4>
          <p class="text-xs md:text-sm">{{ pitch.pitch }}</p>
        </div>
        <p v-else class="text-gray-400">Select a pitch</p>
      </div>
    </div>

    <!-- Display All Brainstorm Ideas (Responsive Grid) -->
    <transition-group
      name="list"
      tag="div"
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 justify-center w-full"
    >
      <div
        v-for="idea in brainstormPitches"
        :key="idea.id"
        class="bg-base-100 shadow-md rounded-lg p-4 cursor-pointer"
        @click="selectPitch(idea)"
      >
        <BrainstormCard :idea="idea" class="card-style" />
      </div>
    </transition-group>

    <!-- Button to Submit the Top 5 Selected Pitches -->
    <button
      class="bg-primary hover:bg-primary-focus text-white py-2 sm:py-3 px-6 rounded-full text-base sm:text-lg mt-6 transition-all duration-300"
      :disabled="selectedPitches.filter((p) => p !== null).length < 5"
      @click="submitTopPitches"
    >
      Submit Top 5 Pitches
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
import { ref, computed, onMounted } from 'vue'
import { usePitchStore } from '../../../stores/pitchStore'
import { useErrorStore, ErrorType } from '../../../stores/errorStore'
import type { Pitch } from '../../../stores/pitchStore' // Import the Pitch type

// Initialize the pitch store
const pitchStore = usePitchStore()

// Error handling
const errorStore = useErrorStore()

// Selected pitches - explicitly define it as an array of Pitch or null for unselected slots
const selectedPitches = ref<(Pitch | null)[]>([null, null, null, null, null])

// Access brainstorm pitches
const brainstormPitches = computed(() => pitchStore.brainstormPitches)

// Fetch brainstorm ideas from pitchStore on mount
onMounted(() => {
  pitchStore.fetchBrainstormPitches()
})

// Select a pitch to add to the top 5
const selectPitch = (pitch: Pitch) => {
  const existingIndex = selectedPitches.value.findIndex(
    (p) => p && p.id === pitch.id,
  )

  if (existingIndex === -1) {
    // Add the pitch if there is space, otherwise replace the last one
    if (selectedPitches.value.filter((p) => p !== null).length < 5) {
      const firstEmptyIndex = selectedPitches.value.indexOf(null)
      selectedPitches.value[firstEmptyIndex] = pitch
    } else {
      selectedPitches.value.splice(4, 1, pitch) // Replace the last one
    }
  }
}

// Submit the selected top 5 pitches
const submitTopPitches = async () => {
  try {
    if (selectedPitches.value.filter((p) => p !== null).length !== 5) {
      throw new Error('Please select exactly 5 pitches.')
    }

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
  } catch (error) {
    const err = error as Error
    errorStore.setError(
      ErrorType.NETWORK_ERROR,
      err.message || 'Failed to submit top 5 pitches',
    )
  }
}
</script>

<style scoped>
/* Custom styles */
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
