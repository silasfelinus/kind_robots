<!-- /components/content/prompts/pitch-selector.vue -->
<template>
  <div class="pitch-selector flex flex-col items-center space-y-4">
    <!-- PitchTypeSelector Component (as buttons instead of a dropdown) -->
    <div class="pitch-type-buttons grid grid-cols-3 gap-2">
      <button
        v-for="type in pitchStore.pitchTypes"
        :key="type"
        :class="[
          'py-2 px-4 rounded-lg border',
          pitchStore.selectedPitchType === type
            ? 'bg-primary text-white border-primary'
            : 'bg-base-300 hover:bg-primary hover:text-white border-base-200',
        ]"
        @click="updateSelectedPitchType(type)"
      >
        {{ type }}
      </button>
    </div>

    <!-- Display Pitches based on the selected PitchType -->
    <div v-if="filteredPitches.length" class="pitch-list grid gap-4">
      <button
        v-for="pitch in filteredPitches"
        :key="pitch.id"
        class="rounded-lg border p-3 bg-base-300 hover:bg-primary hover:text-white"
        ,
        @click="updateSelectedPitch(pitch.id)"
      >
        <h3 class="font-bold">{{ pitch.title || 'Untitled' }}</h3>
        <p>{{ pitch.pitch }}</p>
      </button>
    </div>

    <p v-else class="text-sm text-gray-500">
      No pitches available for the selected type.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePitchStore, PitchType } from './../../stores/pitchStore'

const pitchStore = usePitchStore()

const filteredPitches = computed(() => pitchStore.getPitchesBySelectedType())

// Define update function with keyof PitchType
const updateSelectedPitchType = (type: keyof typeof PitchType) => {
  const selectedType = PitchType[type] // Correctly typed access to PitchType enum
  pitchStore.setSelectedPitchType(selectedType || null)
}

// Handle pitch selection
const updateSelectedPitch = (pitchId: number) => {
  if (pitchStore.selectedPitch?.id === pitchId) return
  pitchStore.setSelectedPitch(pitchId)
}
</script>
