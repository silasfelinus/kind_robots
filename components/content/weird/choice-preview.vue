<template>
  <div class="w-full mb-6">
    <div
      class="p-4 border rounded-2xl bg-base-100 hover:shadow-lg transition-all"
    >
      <h2 class="text-lg font-bold text-gray-800 mb-2">Choices Preview</h2>

      <!-- Current Choice -->
      <div class="mb-4">
        <p v-if="currentChoice" class="text-sm">
          <span class="font-bold">Current Choice:</span> {{ currentChoice }}
        </p>
        <p v-else class="text-sm text-gray-500">No choice selected yet.</p>
      </div>

      <!-- List of Choices -->
      <ul class="space-y-2">
        <li
          v-for="(choice, index) in choices"
          :key="index"
          class="bg-base-200 p-2 rounded-md text-sm"
        >
          {{ choice }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useScenarioStore } from '@/stores/scenarioStore'

// Store
const scenarioStore = useScenarioStore()

// Choices
const choices = computed(() => {
  const intros = scenarioStore.selectedScenario?.intros || '[]' // Default to empty array string
  try {
    return JSON.parse(intros)
  } catch (error) {
    console.error('Failed to parse choices JSON:', error)
    return []
  }
})

const currentChoice = computed(() => scenarioStore.currentChoice)
</script>
