<template>
  <div
    class="pitch-manager bg-base-200 rounded-2xl p-6 border max-w-full flex flex-col space-y-6 mb-48"
  >
    <!-- Pitch Selection Mode -->
    <div v-if="isSelectionMode" class="selection-mode">
      <h2 class="text-xl font-semibold text-primary mb-4">Select a Pitch</h2>
      <div
        v-if="selectedPitches.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <div
          v-for="pitch in selectedPitches"
          :key="pitch.id"
          class="pitch-item bg-base-100 p-4 rounded-xl border shadow"
        >
          <h3 class="text-lg font-bold">{{ pitch.title }}</h3>
          <p class="text-sm text-gray-600 mb-2">{{ pitch.description }}</p>
          <button class="btn btn-accent w-full" @click="selectPitch(pitch.id)">
            Select Pitch
          </button>
        </div>
      </div>
      <div v-else class="text-center text-gray-500">No available pitches.</div>
    </div>

    <!-- Gallery Mode -->
    <div v-else class="gallery-mode">
      <h2 class="text-xl font-semibold text-primary mb-4">Pitch Gallery</h2>
      <div
        v-if="galleryArt.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <div
          v-for="art in galleryArt"
          :key="art.id"
          class="art-item bg-base-100 p-4 rounded-xl border shadow"
        >
          <h3 class="text-lg font-bold">{{ art.title }}</h3>
          <img
            :src="art.url"
            alt="Art"
            class="art-image my-2 rounded-lg shadow-lg"
          />
          <p class="text-sm text-gray-600">{{ art.description }}</p>
        </div>
      </div>
      <div v-else class="text-center text-gray-500">
        No art available for this pitch.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { usePitchStore } from '@/stores/pitchStore'
import { useRoute } from 'vue-router'

const pitchStore = usePitchStore()
const route = useRoute()

// Determine whether we are in Pitch Selection Mode or Pitch Gallery Mode
const isSelectionMode = computed(() => route.name === 'PitchSelection')

// Computed: List of pitches to display in selection mode
const selectedPitches = computed(() => pitchStore.selectedPitches)

// Computed: List of art associated with the selected pitch for gallery mode
const galleryArt = computed(() => pitchStore.galleryArt)

onMounted(() => {
  if (isSelectionMode.value) {
    // Fetch random unique pitches for pitch selection
    pitchStore.fetchRandomPitches(3)
  } else {
    // Fetch art associated with the selected pitch for gallery mode
    const pitchId = route.params.pitchId
    pitchStore.fetchArtForPitch(pitchId)
  }
})

// Function to select a pitch (for selection mode)
const selectPitch = (pitchId) => {
  pitchStore.setSelectedPitch(pitchId)
  // Redirect or handle post-selection actions here if needed
}
</script>

<style scoped>
.pitch-manager {
  padding: 1.5rem;
}

.pitch-item,
.art-item {
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.art-image {
  width: 100%;
  height: auto;
  border-radius: 0.5rem;
}

.selection-mode,
.gallery-mode {
  display: flex;
  flex-direction: column;
}
</style>
