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
import { useScenarioStore } from '@/stores/scenarioStore';

const scenarioStore = useScenarioStore();
</script>
