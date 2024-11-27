<template>
  <div class="brainstorm-selector flex flex-col items-center space-y-4">
    <!-- Toggle Buttons for Title and Brainstorm PitchTypes -->
    <div class="pitch-type-buttons flex space-x-2">
      <button
        :class="[
          'py-2 px-4 rounded-lg border',
          pitchStore.selectedPitchType === 'TITLE'
            ? 'bg-primary text-white border-primary'
            : 'bg-base-300 hover:bg-primary hover:text-white border-base-200',
        ]"
        @click="updateSelectedPitchType(PitchType.TITLE)"
      >
        Title
      </button>
      <button
        :class="[
          'py-2 px-4 rounded-lg border',
          pitchStore.selectedPitchType === 'BRAINSTORM'
            ? 'bg-primary text-white border-primary'
            : 'bg-base-300 hover:bg-primary hover:text-white border-base-200',
        ]"
        @click="updateSelectedPitchType(PitchType.BRAINSTORM)"
      >
        Brainstorm
      </button>
 

      <button
        :class="[
          'py-2 px-4 rounded-lg border',
          pitchStore.selectedPitchType === 'RANDOMLIST'
            ? 'bg-primary text-white border-primary'
            : 'bg-base-300 hover:bg-primary hover:text-white border-base-200',
        ]"
        @click="updateSelectedPitchType(PitchType.RANDOMLIST)"
      >
        Randomizer
      </button>

      <button
        :class="[
          'py-2 px-4 rounded-lg border',
          pitchStore.selectedPitchType === 'WEIRDLANDIA'
            ? 'bg-primary text-white border-primary'
            : 'bg-base-300 hover:bg-primary hover:text-white border-base-200',
        ]"
        @click="updateSelectedPitchType(PitchType.WEIRDLANDIA)"
      >
         Weirdland
      </button>
    </div>
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
import { computed, onMounted } from 'vue'
import { usePitchStore, PitchType } from '../../../stores/pitchStore'

const pitchStore = usePitchStore()

// Auto-select "Title" pitch type on component mount
onMounted(() => {
  if (!pitchStore.selectedPitchType) {
    updateSelectedPitchType(PitchType.TITLE)
  }
})

// Filter pitches by selected pitch type (TITLE or BRAINSTORM)
const filteredPitches = computed(() =>
  pitchStore.pitches.filter(
    (pitch) =>
      pitch.PitchType === pitchStore.selectedPitchType &&
      (pitch.PitchType === 'TITLE' || pitch.PitchType === 'BRAINSTORM'),
  ),
)

// Update selected pitch type to either TITLE or BRAINSTORM
const updateSelectedPitchType = (type: PitchType) => {
  pitchStore.setSelectedPitchType(type)
}

// Handle pitch selection
const updateSelectedPitch = (pitchId: number) => {
  if (pitchStore.selectedPitch?.id === pitchId) return
  pitchStore.setSelectedPitch(pitchId)
}
</script>
