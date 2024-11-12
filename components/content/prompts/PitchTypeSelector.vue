<template>
  <div class="pitch-type-selector">
    <label for="pitchType" class="text-lg">Select Pitch Type:</label>
    <select
      id="pitchType"
      v-model="selectedPitchType"
      class="p-2 border rounded-lg"
    >
      <option
        v-for="type in pitchTypes"
        :key="type"
        :value="type"
      >
        {{ type }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePitchStore, PitchTypeEnum } from '~/stores/pitchStore'

const pitchStore = usePitchStore()

// Use a computed property to bind the selectedPitchType to the store
const selectedPitchType = computed({
  get: () => pitchStore.selectedPitchType,
  set: (value: PitchTypeEnum | null) => pitchStore.setSelectedPitchType(value),
})

// Create a computed property to dynamically fetch pitch types from the enum
const pitchTypes = computed(() => Object.values(PitchTypeEnum))
</script>
