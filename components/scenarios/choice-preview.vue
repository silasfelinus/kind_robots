<!-- /components/content/weird/choice-preview.vue -->
<template>
  <div class="w-full mb-6">
    <div
      class="p-4 border rounded-2xl bg-base-100 hover:shadow-lg transition-all"
    >
      <h2 class="text-lg font-bold text-gray-800 mb-2">Choice Selector</h2>

      <!-- Current Choice -->
      <div v-if="currentChoice" class="mb-4">
        <p class="text-sm">
          <span class="font-bold">Current Choice:</span> {{ currentChoice }}
        </p>
        <button
          class="mt-2 text-sm text-error underline hover:no-underline"
          @click="clearCurrentChoice"
        >
          Deselect Choice
        </button>
      </div>

      <!-- Choices List -->
      <ul v-else class="space-y-2">
        <li
          v-for="(choice, index) in choices"
          :key="index"
          class="bg-base-200 p-2 rounded-md text-sm cursor-pointer hover:bg-primary hover:text-white transition"
          @click="selectChoice(choice)"
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

// Computed Properties
const choices = computed(() => {
  const intros = scenarioStore.selectedScenario?.intros || '[]'
  try {
    return JSON.parse(intros)
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

const clearCurrentChoice = () => {
  scenarioStore.currentChoice = ''
}
</script>
