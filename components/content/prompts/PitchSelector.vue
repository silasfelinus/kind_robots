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
        :class="[
          'rounded-lg border p-3',
          pitchStore.selectedPitch && pitchStore.selectedPitch.id === pitch.id
            ? 'bg-primary text-white'
            : 'bg-base-300 hover:bg-primary hover:text-white',
        ]"
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
import { usePitchStore, pitchTypeMap } from './../../../stores/pitchStore'

// Initialize pitch store
const pitchStore = usePitchStore()

// Fetch pitches by selected pitch type
const filteredPitches = computed(() => pitchStore.getPitchesBySelectedType)

const updateSelectedPitchType = (type: string) => {
  const selectedType = pitchTypeMap[type] // Use pitchTypeMap to get the correct enum value
  if (selectedType) {
    pitchStore.setSelectedPitchType(selectedType)
  } else {
    pitchStore.setSelectedPitchType(null)
  }
}

const updateSelectedPitch = (pitchId: number) => {
  const selectedPitch = pitchStore.selectedPitch
  if (selectedPitch && selectedPitch.id === pitchId) {
    // Pitch is already selected
    return
  }
  pitchStore.setSelectedPitch(pitchId)
}
</script>
