<template>
  <div>
    <h2>Pitches for {{ pitchStore.selectedTitle?.title }}</h2>
    <ul>
      <li
        v-for="pitch in pitchStore.selectedTitlePitches"
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
    <button @click="fetchMoreExamples">Request More Examples</button>
  </div>
</template>

<script setup lang="ts">
import { usePitchStore, type Pitch } from '~/stores/pitchStore'

const pitchStore = usePitchStore()

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
