<template>
  <div>
    <h2 class="text-xl font-bold mb-4">Choose Art for Selected Pitch</h2>

    <!-- If no pitch is selected, show a message -->
    <div v-if="!selectedPitch" class="text-gray-500">
      No pitch selected. Please select a pitch to view the art.
    </div>

    <!-- Display art matching the selected pitch -->
    <div v-else>
      <p class="text-gray-700 mb-4">
        Selected Pitch: {{ selectedPitch.title || 'Untitled' }}
      </p>

      <div v-if="filteredArtIds.length > 0" class="grid grid-cols-2 gap-4">
        <div
          v-for="artId in filteredArtIds"
          :key="artId"
          class="p-2 border rounded shadow-sm"
        >
          <p>Art ID: {{ artId }}</p>
          <!-- You can enhance this by adding art previews if you have URLs/images -->
        </div>
      </div>

      <!-- If no matching art is found -->
      <div v-if="filteredArtIds.length === 0" class="text-gray-500">
        No art found for the selected pitch.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useArtStore } from './../../../stores/artStore' // Corrected import path
import { usePitchStore } from './../../../stores/pitchStore' // Corrected import path

const pitchStore = usePitchStore()
const artStore = useArtStore()

// Get the selected pitch from the gameStore (update if the property name is different)
const selectedPitch = computed(() => pitchStore.currentPitch) // Assuming it's currentPitch

const filteredArtIds = computed(() => {
  if (!selectedPitch.value) return []

  // Safely handle cases where art.pitchId might be null
  return artStore.artAssets
    .filter(
      (art: { pitchId: number | null }) =>
        art.pitchId === selectedPitch.value?.id,
    )
    .map((art: { id: number }) => art.id) // Return just the artIds
})
</script>

<style scoped>
/* Scoped styles for ArtChooser */
</style>
