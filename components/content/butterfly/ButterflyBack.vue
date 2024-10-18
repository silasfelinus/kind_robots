<template>
  <div class="bg-gray-200 p-4 rounded-lg flex flex-col justify-between h-full">
    <div>
      <h3 class="text-center mb-4">Select and Adjust Butterfly Settings</h3>

      <!-- Butterfly Selection -->
      <div class="mb-6">
        <label for="selectedButterfly" class="block mb-2">Select Butterfly:</label>
        <select v-model="selectedButterflyId" class="w-full p-2 rounded" @change="selectButterfly">
          <option v-for="butterfly in butterflies" :key="butterfly.id" :value="butterfly.id">
            Butterfly {{ butterfly.id }}
          </option>
        </select>
      </div>

      <!-- Size range slider -->
      <butterfly-slider
        v-if="selectedButterfly"
        label="Size"
        :min="0.5"
        :max="2"
        :step="0.1"
        v-model="selectedButterflySize"
        slider-id="sizeSlider"
      />

      <!-- Speed range slider -->
      <butterfly-slider
        v-if="selectedButterfly"
        label="Speed"
        :min="0.5"
        :max="5"
        :step="0.1"
        v-model="selectedButterflySpeed"
        slider-id="speedSlider"
      />

      <!-- Wing Speed slider -->
      <butterfly-slider
        v-if="selectedButterfly"
        label="Wing Speed"
        :min="1"
        :max="5"
        :step="1"
        v-model="selectedButterflyWingSpeed"
        slider-id="wingSpeedSlider"
      />

      <!-- Rotation slider -->
      <butterfly-slider
        v-if="selectedButterfly"
        label="Rotation"
        :min="0"
        :max="360"
        :step="10"
        v-model="selectedButterflyRotation"
        slider-id="rotationSlider"
      />

      <!-- X Starting Range -->
      <butterfly-slider
        v-if="selectedButterfly"
        label="Starting X Position"
        :min="0"
        :max="100"
        :step="1"
        v-model="selectedButterflyX"
        slider-id="xPositionSlider"
      />

      <!-- Y Starting Range -->
      <butterfly-slider
        v-if="selectedButterfly"
        label="Starting Y Position"
        :min="0"
        :max="100"
        :step="1"
        v-model="selectedButterflyY"
        slider-id="yPositionSlider"
      />

      <!-- Color Scheme selection -->
      <div v-if="selectedButterfly" class="mb-6">
        <label for="colorScheme" class="block mb-2">Color Scheme:</label>
        <select v-model="selectedButterfly.colorScheme" class="w-full p-2 rounded">
          <option value="random">Random</option>
          <option value="complementary">Complementary</option>
          <option value="analogous">Analogous</option>
          <option value="same">Same</option>
          <option value="primary">Primary</option>
        </select>
      </div>

      <!-- Butterfly Status selection -->
      <div v-if="selectedButterfly" class="mb-6">
        <label for="status" class="block mb-2">Butterfly Status:</label>
        <select v-model="selectedButterfly.status" class="w-full p-2 rounded">
          <option value="random">Random</option>
          <option value="float">Float</option>
          <option value="mouse">Mouse</option>
          <option value="spaz">Spaz</option>
          <option value="flock">Flock</option>
          <option value="clear">Clear</option>
        </select>
      </div>
    </div>

    <!-- Butterfly Demo at the bottom -->
    <div class="mt-4">
      <butterfly-demo />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useButterflyStore } from '@/stores/butterflyStore'

// Access the butterfly store
const butterflyStore = useButterflyStore()
const butterflies = computed(() => butterflyStore.butterflies)

// Selected butterfly ID and reactive object for selected butterfly
const selectedButterflyId = ref(butterflies.value.length ? butterflies.value[0].id : null)
const selectedButterfly = computed(() => butterflies.value.find(butterfly => butterfly.id === selectedButterflyId.value))

// Compute and bind individual butterfly properties
const selectedButterflySize = computed({
  get: () => selectedButterfly.value ? selectedButterfly.value.scale : 0,
  set: (val) => { if (selectedButterfly.value) selectedButterfly.value.scale = val }
})

const selectedButterflySpeed = computed({
  get: () => selectedButterfly.value ? selectedButterfly.value.speed : 0,
  set: (val) => { if (selectedButterfly.value) selectedButterfly.value.speed = val }
})

const selectedButterflyWingSpeed = computed({
  get: () => selectedButterfly.value ? selectedButterfly.value.wingSpeed : 0,
  set: (val) => { if (selectedButterfly.value) selectedButterfly.value.wingSpeed = val }
})

const selectedButterflyRotation = computed({
  get: () => selectedButterfly.value ? selectedButterfly.value.rotation : 0,
  set: (val) => { if (selectedButterfly.value) selectedButterfly.value.rotation = val }
})

const selectedButterflyX = computed({
  get: () => selectedButterfly.value ? selectedButterfly.value.x : 0,
  set: (val) => { if (selectedButterfly.value) selectedButterfly.value.x = val }
})

const selectedButterflyY = computed({
  get: () => selectedButterfly.value ? selectedButterfly.value.y : 0,
  set: (val) => { if (selectedButterfly.value) selectedButterfly.value.y = val }
})

const selectButterfly = () => {
  selectedButterflyId.value = selectedButterflyId.value || butterflies.value[0].id
}
</script>

<style scoped>
/* Style adjustments can go here if needed */
</style>
