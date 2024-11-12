<template>
  <div class="pitch-type-selector">
    <label for="pitchType" class="text-lg">Select Pitch Type:</label>
    <select
      id="pitchType"
      v-model="selectedPitchType"
      class="p-2 border rounded-lg"
    >
      <option
        v-for="(label, type) in pitchTypeOptions"
        :key="type"
        :value="type"
      >
        {{ label }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePitchStore } from '~/stores/pitchStore'
import { PitchType } from '@prisma/client' // This should be the enum imported from Prisma

const pitchStore = usePitchStore()

// Bind selectedPitchType directly to the store
const selectedPitchType = computed({
  get: () => pitchStore.selectedPitchType,
  set: (value: PitchType | null) => pitchStore.setSelectedPitchType(value),
})

// Map enum values to more readable labels if needed
const pitchTypeOptions = computed(() =>
  Object.values(PitchType).map((type) => ({
    type,
    label: type.replace(/_/g, ' '), // Adjust label formatting if necessary
  })),
)
</script>
