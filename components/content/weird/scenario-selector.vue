<template>
  <select
    v-model="scenarioStore.selectedScenario"
    class="bg-base-200 border border-gray-400 rounded-lg p-2 w-full"
  >
    <option disabled value="">Select a Scenario</option>
    <option
      v-for="scenario in scenarioStore.scenarios"
      :key="scenario.id"
      :value="scenario"
    >
      {{ scenario.title || 'Untitled Scenario' }}
    </option>
  </select>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useScenarioStore } from '@/stores/scenarioStore';

const scenarioStore = useScenarioStore();

// Watch for scenario selection changes
watch(
  () => scenarioStore.selectedScenario,
  () => {
    scenarioStore.currentChoice = ''; // Reset currentChoice when a new scenario is selected
  },
);
</script>
