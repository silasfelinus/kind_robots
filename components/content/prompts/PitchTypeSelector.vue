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
import { usePitchStore, PitchTypeEnum } from './../../../stores/pitchStore'
import type { PitchType } from './../../../stores/pitchStore' // Use a type-only import for PitchType

// Initialize the pitch store
const pitchStore = usePitchStore()

// Map between PitchTypeEnum (human-readable) and PitchType (store values)
const pitchTypeOptions = {
  [PitchTypeEnum.ARTPITCH]: 'Art Pitch',
  [PitchTypeEnum.BRAINSTORM]: 'Brainstorm',
  [PitchTypeEnum.BOT]: 'Bot',
  [PitchTypeEnum.ARTGALLERY]: 'Art Gallery',
  [PitchTypeEnum.INSPIRATION]: 'Inspiration',
}

// Use a computed property to bind the selectedPitchType to the store
const selectedPitchType = computed({
  get: () => pitchStore.selectedPitchType,
  set: (value: PitchType | null) => pitchStore.setSelectedPitchType(value),
})
</script>
