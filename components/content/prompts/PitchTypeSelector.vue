<template>
  <div class="pitch-type-selector">
    <label for="pitchType" class="text-lg">Select Pitch Type:</label>
    <select
      id="pitchType"
      v-model="selectedPitchType"
      class="p-2 border rounded-lg"
    >
      <option v-for="type in pitchTypes" :key="type" :value="type">
        {{ type }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePitchStore, PitchType } from './../../../stores/pitchStore'

// Use the correct import from Prisma and store
const pitchStore = usePitchStore()

// Available PitchType values from Prisma
const pitchTypes = Object.values(PitchType)

// Use a computed property that supports null for the selectedPitchType
const selectedPitchType = computed<PitchType | null>({
  get: () => pitchStore.selectedPitchType,
  set: (value: PitchType | null) => pitchStore.setSelectedPitchType(value),
})
</script>
