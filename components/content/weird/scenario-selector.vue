<template>
  <select
    v-model="selectedScenario"
    class="bg-base-200 border border-gray-400 rounded-lg p-2 w-full"
    @change="handleScenarioChange"
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
import { computed } from 'vue';
import { useScenarioStore } from '@/stores/scenarioStore';

// Store
const scenarioStore = useScenarioStore();

// Computed
const selectedScenario = computed({
  get: () => scenarioStore.selectedScenario,
  set: (value) => (scenarioStore.selectedScenario = value),
});

// Method to handle scenario selection change
const handleScenarioChange = () => {
  scenarioStore.currentChoice = ''; // Reset currentChoice on scenario change
};
</script>
