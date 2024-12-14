<template>
  <div class="w-full h-screen bg-base-200 p-4 flex flex-col overflow-y-auto relative">
    <!-- Title Bar -->
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-700">Scenario Manager</h1>
      <!-- Floating Add Scenario Button -->
      <button
        class="btn btn-accent rounded-full shadow-lg hover:shadow-xl"
        @click="toggleAddScenario"
      >
        <Icon name="kind-icon:plus" class="w-6 h-6" />
      </button>
    </div>

    <!-- Conditional Add Scenario Section -->
    <div
      v-if="showAddScenario"
      class="bg-base-300 p-4 rounded-lg shadow-md mb-6"
    >
      <h2 class="text-xl font-bold text-gray-600 mb-4">Create/Edit Scenario</h2>
      <scenario-maker />
    </div>

    <!-- Scenario Gallery and Selected Scenario -->
    <div class="flex flex-col gap-6">
      <!-- Scenario Gallery -->
      <div class="bg-base-300 p-4 rounded-lg shadow-md">
        <h2 class="text-xl font-bold text-gray-600 mb-4">Scenario Gallery</h2>
        <scenario-gallery />
      </div>

      <!-- Selected Scenario Preview -->
      <div class="bg-base-300 p-4 rounded-lg shadow-md">
        <h2 class="text-xl font-bold text-gray-600 mb-4">Selected Scenario</h2>
        <div class="flex flex-col md:flex-row md:items-center gap-4">
          <scenario-selector class="flex-1" />
          <scenario-card
            v-if="selectedScenario"
            :scenario="selectedScenario"
            class="w-full md:w-1/2"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const showAddScenario = ref(false)
const selectedScenario = ref(null)

function toggleAddScenario() {
  showAddScenario.value = !showAddScenario.value
}
</script>
