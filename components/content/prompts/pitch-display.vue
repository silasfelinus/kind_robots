<template>
  <div>
    <!-- Pitch Type Selector Component -->
    <PitchTypeSelector />

    <!-- Display Title if Selected -->
    <h2 v-if="pitchStore.selectedTitle">
      Pitches for {{ pitchStore.selectedTitle.title }}
    </h2>
    <h2 v-else>
      Pitches for Type: {{ pitchStore.selectedPitchType || 'All Types' }}
    </h2>

    <!-- Filtered Pitches List -->
    <ul>
      <li
        v-for="pitch in displayedPitches"
        :key="pitch.id"
        :class="{
          newest: pitchStore.newestPitches.includes(pitch),
          selected: pitchStore.selectedPitches.includes(pitch),
        }"
        @click="toggleSelectedPitch(pitch)"
      >
        {{ pitch.pitch }}
      </li>
    </ul>

    <!-- Request More Examples Button -->
    <button @click="fetchMoreExamples">Request More Examples</button>

    
  </div>
</template>


<script setup lang="ts">
import { computed } from 'vue'
import { usePitchStore, type Pitch } from '~/stores/pitchStore'
import PitchTypeSelector from './PitchTypeSelector.vue' // Ensure correct path

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

function toggleSelectedPitch(pitch: Pitch) {
  const index = pitchStore.selectedPitches.indexOf(pitch)
  if (index === -1) {
    pitchStore.selectedPitches.push(pitch)
  } else {
    pitchStore.selectedPitches.splice(index, 1)
  }
}

async function fetchMoreExamples() {
  await pitchStore.fetchBrainstormPitches()
}
</script>

<style scoped>
.newest {
  background-color: #ffeb3b; /* Highlight for newest pitches */
}
.selected {
  font-weight: bold;
  color: #007bff; /* Different color for selected pitches */
}
</style>
