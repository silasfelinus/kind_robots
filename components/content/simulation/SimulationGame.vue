<template>
  <div class="bg-base-200 p-4 rounded-2xl">
    <h1 class="text-lg border-b mb-4">{{ title }}</h1>

    <!-- Simulation Space -->
    <div
      class="bg-primary p-4 rounded-2xl grid grid-cols-[repeat(auto-fill,minmax(20px,1fr))] gap-2"
    >
      <div
        v-for="(cell, index) in simulationSpace"
        :key="index"
        class="w-4 h-4 bg-secondary rounded-full"
      ></div>
    </div>

    <!-- Controls -->
    <div class="flex justify-between items-center mt-4">
      <button class="bg-accent text-lg p-2 rounded-2xl" @click="step">Step</button>
      <button class="bg-info text-lg p-2 rounded-2xl" @click="play">Play</button>
      <button class="bg-warning text-lg p-2 rounded-2xl" @click="pause">Pause</button>
      <button class="bg-primary text-lg p-2 rounded-2xl" @click="reset">Reset</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSimulationStore } from '@/stores/simulationStore'

const simulationStore = useSimulationStore()
const title = ref('Epic Paper Rock Scissors Lizard Spock Simulator')
const simulationSpace = simulationStore.simulationSpace

const step = () => simulationStore.stepSimulation()
const play = () => simulationStore.playSimulation()
const pause = () => simulationStore.pauseSimulation()
const reset = () => simulationStore.resetSimulation()
</script>
