<template>
  <div>
    <h1>Pitch Generator</h1>

    <!-- Dropdown for selecting a pitch -->
    <select v-model="selectedPitchId" @change="onPitchChange">
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
import { useArtStore } from './../../../stores/artStore'
import { usePitchStore } from './../../../stores/pitchStore'
import { useErrorStore, ErrorType } from './../../../stores/errorStore'

const artStore = useArtStore()
const pitchStore = usePitchStore()
const errorStore = useErrorStore()

const selectedPitchId = ref<number | null>(null)
const publicPitches = computed(() => pitchStore.publicPitches)
const errorMessage = ref<string | null>(null)

const onPitchChange = () => {
  if (selectedPitchId.value) {
    pitchStore.setSelectedPitch(selectedPitchId.value) // Corrected method name
  }
}

const generateArtBasedOnPitch = async () => {
  if (pitchStore.selectedPitch) {
    const pitch = pitchStore.selectedPitch
    const data = {
      prompt: pitch.title || '', // Ensure prompt is a string
      galleryName: 'cafefred',
      pitchName: pitch.title || '', // Ensure pitchName is a string
      // Add other fields as needed
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
