<template>
  <div>
    <h1>Pitch Generator</h1>

    <!-- Dropdown for selecting a pitch -->
    <select v-model="selectedPitchId">
      <option v-for="pitch in publicPitches" :key="pitch.id" :value="pitch.id">
        {{ pitch.title }}
      </option>
    </select>

    <!-- Button to generate art -->
    <button @click="generateArtBasedOnPitch">Generate Art</button>

    <!-- Error Message Display -->
    <div v-if="errorMessage" class="text-red-500 mt-2">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useArtStore } from '../../../stores/artStore'
import { usePitchStore } from '../../../stores/pitchStore'
import { useErrorStore, ErrorType } from '../../../stores/errorStore'

const artStore = useArtStore()
const pitchStore = usePitchStore()
const errorStore = useErrorStore()

// Create a ref to store the selected pitch ID
const selectedPitchId = computed(() => pitchStore.selectedPitchId)

// Computed property for public pitches
const publicPitches = computed(() => pitchStore.publicPitches)

// Ref for error messages
const errorMessage = ref<string | null>(null)

// Method to generate art based on the selected pitch
const generateArtBasedOnPitch = async () => {
  if (pitchStore.selectedPitch) {
    const pitch = pitchStore.selectedPitch
    const data = {
      promptString: pitch.title || '', // Correct field: promptString
      galleryName: 'cafefred',
      pitchName: pitch.title || '',
      hasArtImage: false,
    }
    try {
      const result = await artStore.generateArt(data)
      if (!result.success) {
        throw new Error(result.message || 'Failed to generate art.')
      }
      console.log('Art generated successfully.')
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error ? error.message : 'Unknown error occurred.'
      errorStore.setError(ErrorType.GENERAL_ERROR, errorMsg)
      errorMessage.value = errorMsg
    }
  } else {
    console.warn('No pitch selected.')
    errorMessage.value = 'Please select a pitch before generating art.'
  }
}
</script>
