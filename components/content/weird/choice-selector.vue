<!-- /components/content/weird/choice-selector.vue -->
<template>
  <div class="w-full mb-6">
    <div
      class="p-4 border rounded-2xl bg-base-100 hover:shadow-lg transition-all"
    >
      <h2 class="text-lg font-bold text-gray-800 mb-2">Select a Choice</h2>

      <!-- List of Choices -->
      <ul class="space-y-2">
        <li
          v-for="(choice, index) in choices"
          :key="index"
          class="bg-base-200 p-2 rounded-md text-sm cursor-pointer hover:bg-primary hover:text-white transition"
          @click="selectChoice(choice)"
        >
          {{ choice }}
        </li>
      </ul>

      <!-- Selected Choice -->
      <div v-if="currentChoice" class="mt-4 text-sm">
        <p>
          <span class="font-bold">Selected Choice:</span> {{ currentChoice }}
        </p>
        <button
          class="mt-2 text-sm text-error underline hover:no-underline"
          @click="clearChoice"
        >
          Deselect Choice
        </button>
      </div>
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
    return JSON.parse(intros) // Parse stringified JSON
  } catch (error) {
    console.error('Failed to parse choices JSON:', error)
    return []
  }
})

const currentChoice = computed(() => scenarioStore.currentChoice)

// Methods
const selectChoice = (choice: string) => {
  scenarioStore.currentChoice = choice
}

const clearChoice = () => {
  scenarioStore.currentChoice = ''
}
</script>
