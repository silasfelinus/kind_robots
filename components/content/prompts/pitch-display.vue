<template>
  <div>
    <!-- Display Title if Selected -->
    <h2 v-if="pitchStore.selectedTitle">
      Pitches for {{ pitchStore.selectedTitle.title }}
    </h2>
    <h2 v-else>
      Pitches for Type: {{ pitchStore.selectedPitchType || 'All Types' }}
    </h2>

    <!-- Filtered Pitches List using PitchCard components -->
    <div class="pitches-list grid gap-4 mt-4">
      <PitchCard
        v-for="pitch in displayedPitches"
        :key="pitch.id"
        :pitch="pitch"
        :class="{
          newest: pitchStore.newestPitches.includes(pitch),
          selected: pitchStore.selectedPitches.includes(pitch) ||
                    (pitchStore.selectedTitle && pitchStore.selectedTitle.id === pitch.id),
        }"
        @select="toggleSelectedPitch(pitch)"
      />
    </div>

    <!-- Request More Examples Button -->
    <button
      class="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      @click="fetchMoreExamples"
    >
      Request More Examples
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePitchStore, type Pitch } from '~/stores/pitchStore'

const pitchStore = usePitchStore()

// Computed property for filtering displayed pitches
const displayedPitches = computed(() => {
  if (pitchStore.selectedTitle) {
    // Show pitches for the selected title within the selected PitchType
    return pitchStore.pitches.filter(
      (pitch) =>
        pitch.PitchType === pitchStore.selectedPitchType &&
        pitch.title === pitchStore.selectedTitle?.title,
    )
  } else if (pitchStore.selectedPitchType) {
    // Show all pitches by the selected PitchType if no title is selected
    return pitchStore.getPitchesBySelectedType
  } else {
    // Show all pitches if neither title nor type is selected
    return pitchStore.pitches
  }
})

// Toggle pitch selection based on PitchType
function toggleSelectedPitch(pitch: Pitch) {
  if (pitch.PitchType === 'TITLE') {
    // For TITLE type, set selectedTitle in the store
    pitchStore.selectedTitle = pitch
    pitchStore.selectedPitches = [] // Clear any brainstorm selections
  } else if (pitch.PitchType === 'BRAINSTORM') {
    // For BRAINSTORM type, allow multiple selections
    const index = pitchStore.selectedPitches.indexOf(pitch)
    if (index === -1) {
      pitchStore.selectedPitches.push(pitch)
    } else {
      pitchStore.selectedPitches.splice(index, 1)
    }
    pitchStore.selectedTitle = null // Clear selectedTitle for brainstorm selections
  }
}

// Function to fetch additional examples
async function fetchMoreExamples() {
  await pitchStore.fetchBrainstormPitches()
}
</script>