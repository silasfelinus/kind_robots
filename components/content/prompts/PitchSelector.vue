<template>
  <div class="pitch-selector flex flex-col items-center space-y-4">
    <!-- PitchTypeSelector Component -->
    <PitchTypeSelector />

    <!-- Display Pitches based on the selected PitchType -->
    <div v-if="filteredPitches.length" class="pitch-list grid gap-4">
      <div
        v-for="pitch in filteredPitches"
        :key="pitch.id"
        class="rounded-lg border p-3 bg-base-300 hover:bg-primary hover:text-white"
        @click="updateSelectedPitch(pitch.id)"
      >
        <h3 class="font-bold">{{ pitch.title || 'Untitled' }}</h3>
        <p>{{ pitch.pitch }}</p>
      </div>
    </div>

    <p v-else class="text-sm text-gray-500">
      No pitches available for the selected type.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePitchStore } from '../../../stores/pitchStore'

// Initialize pitch store
const pitchStore = usePitchStore()

// Fetch pitches by selected pitch type
const filteredPitches = computed(() => pitchStore.getPitchesBySelectedType)

// Function to update selected pitch
const updateSelectedPitch = (pitchId: number) => {
  pitchStore.selectedPitchId = pitchId
}
</script>
