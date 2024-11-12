<template>
  <div>
    <h2>Pitches for {{ pitchStore.selectedTitle?.title }}</h2>
    <ul>
      <li
        v-for="pitch in pitchStore.selectedTitlePitches"
        :key="pitch.id"
        @click="toggleSelectedPitch(pitch)"
        :class="{ 'highlighted': pitch.isHighlighted, 'selected': pitchStore.selectedPitches.includes(pitch) }"
      >
        {{ pitch.pitch }}
      </li>
    </ul>
    <button @click="fetchMoreExamples">Request More Examples</button>
  </div>
</template>

<script setup lang="ts">
import { usePitchStore } from '~/stores/pitchStore'
const pitchStore = usePitchStore()

function toggleSelectedPitch(pitch) {
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
