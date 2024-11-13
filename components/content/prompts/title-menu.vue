<template>
  <div>
    <label class="block text-gray-700 text-sm font-bold mb-2" for="customTitle">
      Custom Title (Optional)
    </label>
    <input
      id="customTitle"
      v-model="customTitle"
      class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4"
      type="text"
      placeholder="Enter a custom title"
    />

    <label class="block text-gray-700 text-sm font-bold mb-2" for="titleSelect">
      Select Existing Title
    </label>
    <select
      id="titleSelect"
      v-model="selectedTitle"
      class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
    >
      <option
        v-for="title in availableTitles"
        :key="title || 'default-key'"
        :value="title"
      >
        {{ title }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { usePitchStore } from '~/stores/pitchStore'

const pitchStore = usePitchStore()
const customTitle = ref('')
const selectedTitle = ref('')

// Available titles based on the selected PitchType
const availableTitles = computed(() =>
  pitchStore.pitches
    .filter((p) => p.PitchType === pitchStore.selectedPitchType)
    .map((p) => p.title),
)

// Sync custom title or selected title with the parent form
watch([customTitle, selectedTitle], ([newCustom, newSelected]) => {
  pitchStore.selectedTitle = newCustom || newSelected
})
</script>
