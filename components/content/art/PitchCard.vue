<template>
  <div class="w-full max-w-[200px] mx-auto relative">
    <div class="flip-card" @click="showCardBack = !showCardBack">
      <div class="flip-card-inner" :class="{ 'flip-card-flipped': showCardBack }">
        <PitchCardFront :pitch="selectedPitch" />
        <PitchCardBack :pitch="selectedPitch" @update:pitch="updateSelectedPitch" />
      </div>
    </div>
    <PitchCardActions :pitch="selectedPitch" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import PitchCardFront from './PitchCardFront.vue'
import PitchCardBack from './PitchCardBack.vue'
import PitchCardActions from './PitchCardActions.vue'
import { usePitchStore, Pitch } from '@/stores/pitchStore'
import { useArtStore } from '@/stores/artStore'

const showCardBack = ref(false)
const pitchStore = usePitchStore()
const selectedPitch = computed(() => pitchStore.selectedPitch) // Use computed to reactively get selectedPitch
const sortedArt = ref()
// Function to fetch and sort art
const fetchAndSortArt = () => {
  if (selectedPitch.value) {
    pitchStore
      .getArtForPitch(selectedPitch.value.id)
      .then((artArray) => {
        return artArray.sort((a, b) => b.claps - a.claps)
      })
      .catch((error) => {
        console.error('An error occurred while fetching art:', error)
      })
  }
}

// Function to update selected pitch
const updateSelectedPitch = (newPitch: Pitch) => {
  pitchStore.selectPitch(newPitch.id)
}

// Fetch and sort the Art by claps when the component is mounted
onMounted(() => {
  sortedArt.value = fetchAndSortArt()
})
</script>

<style scoped>
.flip-card-inner {
  transition: transform 0.6s;
  transform-style: preserve-3d;
}
.flip-card-flipped {
  transform: rotateY(180deg);
}
</style>
