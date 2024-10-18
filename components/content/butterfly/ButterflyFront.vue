<template>
  <div class="bg-gray-200 p-4 rounded-lg h-full overflow-y-auto">
    <h3 class="text-center mb-4">Adjust New Butterfly Presets</h3>

    <!-- Size range slider -->
    <butterfly-slider
      v-model="newSizeRange"
      label="Size"
      :min="0.5"
      :max="2"
      :step="0.1"
      slider-id="sizeSlider"
    />

    <!-- Speed range slider -->
    <butterfly-slider
      v-model="newSpeedRange"
      label="Speed"
      :min="0.5"
      :max="5"
      :step="0.1"
      slider-id="speedSlider"
    />

    <!-- Wing Speed slider -->
    <butterfly-slider
      v-model="newWingSpeedRange"
      label="Wing Speed"
      :min="1"
      :max="5"
      :step="1"
      slider-id="wingSpeedSlider"
    />

    <!-- Rotation slider -->
    <butterfly-slider
      v-model="newRotationRange"
      label="Rotation"
      :min="0"
      :max="360"
      :step="10"
      slider-id="rotationSlider"
    />

    <!-- X Starting Range -->
    <butterfly-slider
      v-model="newXRange"
      label="Starting X Position"
      :min="0"
      :max="100"
      :step="1"
      slider-id="xPositionSlider"
    />

    <!-- Y Starting Range -->
    <butterfly-slider
      v-model="newYRange"
      label="Starting Y Position"
      :min="0"
      :max="100"
      :step="1"
      slider-id="yPositionSlider"
    />

    <!-- Color Scheme selection -->
    <div class="mb-6">
      <label for="colorScheme" class="block mb-2">Color Scheme:</label>
      <select v-model="newColorScheme" class="w-full p-2 rounded">
        <option value="random">Random</option>
        <option value="complementary">Complementary</option>
        <option value="analogous">Analogous</option>
        <option value="same">Same</option>
        <option value="primary">Primary</option>
      </select>
      <div class="text-center mt-2">
        Selected Color Scheme: {{ newColorScheme }}
      </div>
    </div>

    <!-- Butterfly Status selection -->
    <div class="mb-6">
      <label for="status" class="block mb-2">Butterfly Status:</label>
      <select v-model="newStatus" class="w-full p-2 rounded">
        <option value="random">Random</option>
        <option value="float">Float</option>
        <option value="mouse">Mouse</option>
        <option value="spaz">Spaz</option>
        <option value="flock">Flock</option>
        <option value="clear">Clear</option>
      </select>
      <div class="text-center mt-2">Selected Status: {{ newStatus }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useButterflyStore } from '@/stores/butterflyStore'

// Access the butterfly store
const butterflyStore = useButterflyStore()

// Bind individual properties for better reactivity
const newSizeRange = computed({
  get: () => butterflyStore.newButterflySettings.sizeRange,
  set: (val) => butterflyStore.updateButterflySettings({ sizeRange: val }),
})

const newSpeedRange = computed({
  get: () => butterflyStore.newButterflySettings.speedRange,
  set: (val) => butterflyStore.updateButterflySettings({ speedRange: val }),
})

const newWingSpeedRange = computed({
  get: () => butterflyStore.newButterflySettings.wingSpeedRange,
  set: (val) => butterflyStore.updateButterflySettings({ wingSpeedRange: val }),
})

const newRotationRange = computed({
  get: () => butterflyStore.newButterflySettings.rotationRange,
  set: (val) => butterflyStore.updateButterflySettings({ rotationRange: val }),
})

const newXRange = computed({
  get: () => butterflyStore.newButterflySettings.xRange,
  set: (val) => butterflyStore.updateButterflySettings({ xRange: val }),
})

const newYRange = computed({
  get: () => butterflyStore.newButterflySettings.yRange,
  set: (val) => butterflyStore.updateButterflySettings({ yRange: val }),
})

const newColorScheme = computed({
  get: () => butterflyStore.newButterflySettings.colorScheme,
  set: (val) => butterflyStore.updateButterflySettings({ colorScheme: val }),
})

const newStatus = computed({
  get: () => butterflyStore.newButterflySettings.status,
  set: (val) => butterflyStore.updateButterflySettings({ status: val }),
})
</script>

<style scoped>
.bg-gray-200 {
  height: 100%; /* Ensure full height for the container */
}

.overflow-y-auto {
  max-height: 100vh; /* Ensure it scrolls if content overflows vertically */
  overflow-y: auto;
}
</style>
