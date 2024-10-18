<template>
  <div class="bg-gray-200 p-4 rounded-lg">
    <h3 class="text-center mb-4">Adjust New Butterfly Presets</h3>

    <!-- Size range slider -->
    <butterfly-slider
      label="Size"
      :min="0.5"
      :max="2"
      :step="0.1"
      v-model="newButterflySettings.sizeRange"
      slider-id="sizeSlider"
    />

    <!-- Speed range slider -->
    <butterfly-slider
      label="Speed"
      :min="0.5"
      :max="5"
      :step="0.1"
      v-model="newButterflySettings.speedRange"
      slider-id="speedSlider"
    />

    <!-- Wing Speed slider -->
    <butterfly-slider
      label="Wing Speed"
      :min="1"
      :max="5"
      :step="1"
      v-model="newButterflySettings.wingSpeedRange"
      slider-id="wingSpeedSlider"
    />

    <!-- Rotation slider -->
    <butterfly-slider
      label="Rotation"
      :min="0"
      :max="360"
      :step="10"
      v-model="newButterflySettings.rotationRange"
      slider-id="rotationSlider"
    />

    <!-- X Starting Range -->
    <butterfly-slider
      label="Starting X Position"
      :min="0"
      :max="100"
      :step="1"
      v-model="newButterflySettings.xRange"
      slider-id="xPositionSlider"
    />

    <!-- Y Starting Range -->
    <butterfly-slider
      label="Starting Y Position"
      :min="0"
      :max="100"
      :step="1"
      v-model="newButterflySettings.yRange"
      slider-id="yPositionSlider"
    />

    <!-- Color Scheme selection -->
    <div class="mb-6">
      <label for="colorScheme" class="block mb-2">Color Scheme:</label>
      <select v-model="newButterflySettings.colorScheme" class="w-full p-2 rounded">
        <option value="random">Random</option>
        <option value="complementary">Complementary</option>
        <option value="analogous">Analogous</option>
        <option value="same">Same</option>
        <option value="primary">Primary</option>
      </select>
      <div class="text-center mt-2">
        Selected Color Scheme: {{ newButterflySettings.colorScheme }}
      </div>
    </div>

    <!-- Butterfly Status selection -->
    <div class="mb-6">
      <label for="status" class="block mb-2">Butterfly Status:</label>
      <select v-model="newButterflySettings.status" class="w-full p-2 rounded">
        <option value="random">Random</option>
        <option value="float">Float</option>
        <option value="mouse">Mouse</option>
        <option value="spaz">Spaz</option>
        <option value="flock">Flock</option>
        <option value="clear">Clear</option>
      </select>
      <div class="text-center mt-2">
        Selected Status: {{ newButterflySettings.status }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useButterflyStore } from '@/stores/butterflyStore'

// Access the butterfly store
const butterflyStore = useButterflyStore()

// Reactive binding to the current butterfly settings
const newButterflySettings = computed({
  get: () => butterflyStore.newButterflySettings,
  set: (value) => butterflyStore.updateButterflySettings(value),
})
</script>

<style scoped>
/* Style adjustments can go here if needed */
</style>
