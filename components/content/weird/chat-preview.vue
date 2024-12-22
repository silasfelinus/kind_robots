<template>
  <div class="w-full max-w-4xl mx-auto p-6 bg-base-200 rounded-2xl shadow-md">
    <h1 class="text-2xl font-bold mb-4 text-center">Chat Overview</h1>

    <!-- Character Overview -->
    <div class="mb-4 p-4 bg-base-100 rounded-lg border shadow-sm">
      <h2 class="text-lg font-semibold mb-2">Character</h2>
      <p v-if="characterStore.selectedCharacter">
        <span class="font-bold">Name:</span>
        {{ characterStore.selectedCharacter.name }} the
        {{ characterStore.selectedCharacter.honorific || 'Unremarkable' }}
      </p>
      <p v-else class="text-gray-500">No character selected.</p>
    </div>

    <!-- Scenario Overview -->
    <div class="mb-4 p-4 bg-base-100 rounded-lg border shadow-sm">
      <h2 class="text-lg font-semibold mb-2">Scenario</h2>
      <p v-if="scenarioStore.selectedScenario">
        <span class="font-bold">Title:</span>
        {{ scenarioStore.selectedScenario.title || 'Untitled Scenario' }}
      </p>
      <p v-if="scenarioStore.selectedScenario?.genres">
        <span class="font-bold">Genres:</span>
        {{ scenarioStore.selectedScenario.genres }}
      </p>
      <p v-if="scenarioStore.selectedScenario?.description">
        <span class="font-bold">Description:</span>
        {{ scenarioStore.selectedScenario.description }}
      </p>
      <p v-if="scenarioStore.currentChoice">
        <span class="font-bold">Current Choice:</span>
        {{ scenarioStore.currentChoice }}
      </p>
      <p v-else class="text-gray-500">No scenario selected.</p>
    </div>

    <!-- Reward Overview -->
    <div class="mb-4 p-4 bg-base-100 rounded-lg border shadow-sm">
      <h2 class="text-lg font-semibold mb-2">Reward</h2>
      <p v-if="rewardStore.selectedReward">
        <span class="font-bold">Text:</span>
        {{ rewardStore.selectedReward.text }}
      </p>
      <p v-if="rewardStore.selectedReward">
        <span class="font-bold">Power:</span>
        {{ rewardStore.selectedReward.power }}
      </p>
      <p v-else class="text-gray-500">No reward selected.</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useCharacterStore } from '@/stores/characterStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useRewardStore } from '@/stores/rewardStore'

// Stores
const characterStore = useCharacterStore()
const scenarioStore = useScenarioStore()
const rewardStore = useRewardStore()
</script>
