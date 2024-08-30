<template>
  <div class="pitch-screen">
    <!-- Selection Mode -->
    <div v-if="isSelectionMode">
      <h2>Select a Pitch</h2>
      <div v-for="pitch in selectedPitches" :key="pitch.id" class="pitch-item">
        <h3>{{ pitch.title }}</h3>
        <p>{{ pitch.description }}</p>
        <button @click="selectPitch(pitch.id)">Select</button>
      </div>
    </div>

    <!-- Gallery Mode -->
    <div v-else>
      <h2>Pitch Gallery</h2>
      <div v-for="art in galleryArt" :key="art.id" class="art-item">
        <h3>{{ art.title }}</h3>
        <img :src="art.url" alt="Art" class="art-image" />
        <p>{{ art.description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { usePitchStore } from './../../../stores/pitchStore'
import { useRoute } from 'vue-router'

const pitchStore = usePitchStore()
const route = useRoute()

// Determine if we are in selection mode or gallery mode based on the route or props
const isSelectionMode = computed(() => route.name === 'PitchSelection')

// Pitches to display in selection mode
const selectedPitches = computed(() => pitchStore.selectedPitches)

// Art to display in gallery mode
const galleryArt = computed(() => pitchStore.galleryArt)

onMounted(() => {
  if (isSelectionMode.value) {
    // Fetch random unique pitches for selection
    pitchStore.fetchRandomPitches(3)
  } else {
    // Fetch art associated with the played pitch
    const pitchId = route.params.pitchId
    pitchStore.fetchArtForPitch(pitchId)
  }
})

const selectPitch = (pitchId) => {
  pitchStore.selectPitch(pitchId)
  // Additional logic for handling pitch selection
}
</script>

<style scoped>
.pitch-screen {
  padding: 1rem;
}

.pitch-item,
.art-item {
  border: 1px solid #ccc;
  padding: 1rem;
  margin-bottom: 1rem;
}

.art-image {
  max-width: 100%;
  height: auto;
}
</style>
