<template>
  <div>
    <h2 class="text-xl font-bold mb-4">Choose Art for Selected Pitch</h2>

    <!-- If no pitch is selected, show a message -->
    <div v-if="!selectedPitch" class="text-gray-500">
      No pitch selected. Please select a pitch to view the art.
    </div>

    <!-- Display art matching the selected pitch -->
    <div v-else>
      <p class="text-gray-700 mb-4">Selected Pitch: {{ selectedPitch.name }}</p>

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

<script setup>
import { computed } from 'vue'
import { useGameStore } from './../../../stores/gameStore'
import { useArtStore } from './../../../stores/artStore' // If art is stored separately

const gameStore = useGameStore()
const artStore = useArtStore() // Assumes you have a store managing art data

// Get the selected pitch from the gameStore
const selectedPitch = computed(() => gameStore.selectedPitch)

// Filter the art by matching pitchId
const filteredArtIds = computed(() => {
  if (!selectedPitch.value) return []

  // Assuming artStore has an array of art objects, each containing artId and pitchId
  return artStore.artList
    .filter((art) => art.pitchId === selectedPitch.value.id)
    .map((art) => art.id) // Return just the artIds
})
</script>

<style scoped>
/* Scoped styles for ArtChooser */
</style>
