<!-- /components/content/prompts/pitch-type-selector.vue -->
<template>
  <div class="pitch-selector flex flex-col items-center space-y-4">
    <!-- PitchTypeSelector Component as Buttons -->
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

    <!-- Display Pitches based on the selected PitchType using PitchCard components -->
    <div
      v-if="filteredPitches.length"
      class="pitch-list grid gap-4 mt-4 w-full"
    >
      <PitchCard
        v-for="pitch in filteredPitches"
        :key="pitch.id"
        :pitch="pitch"
        :class="[
          'border rounded-lg shadow p-4',
          pitchStore.selectedPitch && pitchStore.selectedPitch.id === pitch.id
            ? 'bg-primary text-white border-primary'
            : 'bg-base-300 hover:bg-primary hover:text-white',
        ]"
        @click="updateSelectedPitch(pitch.id)"
      />
    </div>

    <p v-else class="text-sm text-gray-500 mt-4">
      No pitches available for the selected type.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { PitchType, type Pitch } from '~/stores/pitchStore'

const pitchStore = usePitchStore()

const filteredPitches = computed<Pitch[]>(() =>
  pitchStore.getPitchesBySelectedType(),
)

// Update selected pitch type directly with PitchType values
const updateSelectedPitchType = (type: PitchType) => {
  pitchStore.setSelectedPitchType(type)
}

// Handle pitch selection
const updateSelectedPitch = (pitchId: number) => {
  if (pitchStore.selectedPitch?.id === pitchId) return
  pitchStore.setSelectedPitch(pitchId)
}
</script>
