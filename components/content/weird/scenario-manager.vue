<template>
  <div
    class="w-full h-screen bg-base-200 p-4 flex flex-col overflow-y-auto relative"
  >
    <!-- Title Bar -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex-1 text-center">
        <h1
          class="text-3xl font-bold bg-red-600 text-white rounded-2xl inline-block py-2 px-4"
        >
          Choose Your Own Weird Adventure
        </h1>
      </div>
      <!-- Floating Add Scenario Button -->
      <button
        class="btn btn-accent rounded-full shadow-lg hover:shadow-xl ml-4"
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
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Local state for add scenario toggle
const showAddScenario = ref(false)

// Toggle add scenario visibility
function toggleAddScenario() {
  showAddScenario.value = !showAddScenario.value
}
</script>
