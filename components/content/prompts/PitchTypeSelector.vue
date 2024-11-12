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
import { PitchType, usePitchStore } from '~/stores/pitchStore'

const pitchStore = usePitchStore()

// Bind selectedPitchType directly to the store's state
const selectedPitchType = computed({
  get: () => pitchStore.selectedPitchType,
  set: (value) => pitchStore.setSelectedPitchType(value),
})

// Generate pitch type options with labels
const pitchTypeOptions = computed(() =>
  Object.entries(PitchType).map(([type, label]) => ({
    type,
    label: label.replace(/_/g, ' '), // Replace underscores for readability
  })),
)
</script>
