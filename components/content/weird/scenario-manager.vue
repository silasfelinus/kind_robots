<template>
  <div class="w-full h-screen bg-base-200 p-4 flex flex-col overflow-y-auto">
    <h1 class="text-3xl font-bold text-gray-700 mb-4">Scenario Manager</h1>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Scenario Maker -->
      <div class="bg-base-300 p-4 rounded-lg shadow-md">
        <h2 class="text-xl font-bold text-gray-600 mb-4">Create/Edit Scenario</h2>
        <scenario-maker />
      </div>

      <!-- Scenario Gallery -->
      <div class="bg-base-300 p-4 rounded-lg shadow-md">
        <h2 class="text-xl font-bold text-gray-600 mb-4">Scenario Gallery</h2>
        <scenario-gallery />
      </div>
    </div>

    <!-- Scenario Selector and Preview -->
    <div class="bg-base-300 p-4 rounded-lg shadow-md mt-6">
      <h2 class="text-xl font-bold text-gray-600 mb-4">Selected Scenario</h2>
      <div class="flex flex-col md:flex-row md:items-center gap-4">
        <scenario-selector class="flex-1" />
        <scenario-card
          v-if="scenarioStore.selectedScenario"
          :scenario="scenarioStore.selectedScenario"
          class="w-full md:w-1/2"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useScenarioStore } from '@/stores/scenarioStore';


// Store
const scenarioStore = useScenarioStore();
</script>
