<template>
  <div class="bg-gray-200 p-4 rounded-lg">
    <h3 class="text-center mb-4">Adjust New Butterfly Preset Settings</h3>

    <!-- Size range slider -->
    <div class="mb-4">
      <label for="sizeRange" class="block mb-2">Size (Min-Max):</label>
      <input
        id="minSize"
        v-model="newButterflySettings.minSize"
        type="range"
        min="0.5"
        max="2"
        step="0.1"
        class="w-full"
      />
      <input
        id="maxSize"
        v-model="newButterflySettings.maxSize"
        type="range"
        min="0.5"
        max="2"
        step="0.1"
        class="w-full"
      />
      <p>
        Size: {{ newButterflySettings.minSize }} -
        {{ newButterflySettings.maxSize }}
      </p>
    </div>

    <!-- Speed range slider -->
    <div class="mb-4">
      <label for="speedRange" class="block mb-2">Speed (Min-Max):</label>
      <input
        id="minSpeed"
        v-model="newButterflySettings.minSpeed"
        type="range"
        min="0.5"
        max="5"
        step="0.1"
        class="w-full"
      />
      <input
        id="maxSpeed"
        v-model="newButterflySettings.maxSpeed"
        type="range"
        min="0.5"
        max="5"
        step="0.1"
        class="w-full"
      />
      <p>
        Speed: {{ newButterflySettings.minSpeed }} -
        {{ newButterflySettings.maxSpeed }}
      </p>
    </div>

    <!-- Wing Speed -->
    <div class="mb-4">
      <label for="wingSpeedRange" class="block mb-2"
        >Wing Speed (Min-Max):</label
      >
      <input
        id="minWingSpeed"
        v-model="newButterflySettings.minWingSpeed"
        type="range"
        min="1"
        max="5"
        step="1"
        class="w-full"
      />
      <input
        id="maxWingSpeed"
        v-model="newButterflySettings.maxWingSpeed"
        type="range"
        min="1"
        max="5"
        step="1"
        class="w-full"
      />
      <p>
        Wing Speed: {{ newButterflySettings.minWingSpeed }} -
        {{ newButterflySettings.maxWingSpeed }}
      </p>
    </div>

    <!-- Rotation -->
    <div class="mb-4">
      <label for="rotationRange" class="block mb-2">Rotation (Min-Max):</label>
      <input
        id="minRotation"
        v-model="newButterflySettings.minRotation"
        type="range"
        min="0"
        max="360"
        step="10"
        class="w-full"
      />
      <input
        id="maxRotation"
        v-model="newButterflySettings.maxRotation"
        type="range"
        min="0"
        max="360"
        step="10"
        class="w-full"
      />
      <p>
        Rotation: {{ newButterflySettings.minRotation }} -
        {{ newButterflySettings.maxRotation }}
      </p>
    </div>

    <!-- Color Scheme -->
    <div class="mb-4">
      <label for="colorScheme" class="block mb-2">Color Scheme:</label>
      <select v-model="newButterflySettings.colorScheme" class="w-full p-2">
        <option value="random">Random</option>
        <option value="complementary">Complementary</option>
        <option value="analogous">Analogous</option>
        <option value="same">Same</option>
        <option value="primary">Primary</option>
      </select>
      <p>Color Scheme: {{ newButterflySettings.colorScheme }}</p>
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
/* Basic styling for the controls */
input[type='range'] {
  margin-bottom: 8px;
}

button {
  cursor: pointer;
}
</style>
