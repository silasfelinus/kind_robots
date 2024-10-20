<template>
  <div class="bg-gray-200 p-4 rounded-lg flex flex-col h-full">
    <!-- Scrollable settings area -->
    <div class="overflow-y-auto flex-grow pr-4">
      <h3 class="text-center mb-4">Select and Adjust Butterfly Settings</h3>

      <!-- Guard: Check if there are butterflies and selected butterfly is available -->
      <div v-if="butterflyStoreAvailable">
        <!-- Butterfly Selection -->
        <div v-if="butterflies.length > 0" class="mb-6">
          <label for="selectedButterfly" class="block mb-2">
            Select Butterfly:
          </label>
          <select
            v-model="butterflyStore.selectedButterflyId"
            class="w-full p-2 rounded"
          >
            <option
              v-for="butterfly in butterflies"
              :key="butterfly.id"
              :value="butterfly.id"
            >
              {{ butterfly.id }}
            </option>
          </select>
        </div>

        <!-- Butterfly ID Display (not editable) -->
        <div v-if="selectedButterfly" class="mb-6">
          <label for="butterflyId" class="block mb-2"
            >Butterfly ID (Uneditable):</label
          >
          <input
            id="butterflyId"
            v-model="selectedButterfly.id"
            type="text"
            class="w-full p-2 rounded bg-gray-400 text-gray-700 cursor-not-allowed"
            disabled
          />
        </div>

        <!-- Size slider -->
        <single-slider
          v-if="selectedButterfly"
          v-model="selectedButterflySize"
          label="Size"
          :min="0.5"
          :max="2"
          :step="0.1"
          slider-id="sizeSlider"
          class="mb-4"
        />

        <!-- Speed slider -->
        <single-slider
          v-if="selectedButterfly"
          v-model="selectedButterflySpeed"
          label="Speed"
          :min="1"
          :max="5"
          :step="1"
          slider-id="speedSlider"
          class="mb-4"
        />

        <!-- Wing Speed slider -->
        <single-slider
          v-if="selectedButterfly"
          v-model="selectedButterflyWingSpeed"
          label="Wing Speed"
          :min="1"
          :max="5"
          :step="1"
          slider-id="wingSpeedSlider"
          class="mb-4"
        />

        <!-- Rotation slider -->
        <single-slider
          v-if="selectedButterfly"
          v-model="selectedButterflyRotation"
          label="Rotation"
          :min="0"
          :max="360"
          :step="1"
          slider-id="rotationSlider"
          class="mb-4"
        />

        <!-- zIndex slider -->
        <single-slider
          v-if="selectedButterfly"
          v-model="selectedButterflyZIndex"
          label="zIndex"
          :min="0"
          :max="100"
          :step="1"
          slider-id="zIndexSlider"
          class="mb-4"
        />

        <!-- Wing Colors -->
        <div class="mb-6">
          <label for="wingTopColor" class="block mb-2">Wing Top Color:</label>
          <input
            id="wingTopColor"
            v-model="selectedButterflyWingTopColor"
            type="color"
            class="w-full p-2 rounded"
          />
        </div>

        <div class="mb-6">
          <label for="wingBottomColor" class="block mb-2"
            >Wing Bottom Color:</label
          >
          <input
            id="wingBottomColor"
            v-model="selectedButterflyWingBottomColor"
            type="color"
            class="w-full p-2 rounded"
          />
        </div>

        <!-- Status Dropdown -->
        <div class="mb-6">
          <label for="butterflyStatus" class="block mb-2">Status:</label>
          <select
            id="butterflyStatus"
            v-model="selectedButterflyStatus"
            class="w-full p-2 rounded"
          >
            <option value="random">Random</option>
            <option value="float">Float</option>
            <option value="mouse">Mouse</option>
            <option value="spaz">Spaz</option>
            <option value="flock">Flock</option>
            <option value="clear">Clear</option>
          </select>
        </div>
      </div>

      <!-- Fallback Message if Store or Selected Butterfly is Unavailable -->
      <div v-else class="text-red-500 text-center mt-4">
        No butterfly selected or settings unavailable. Please check your data.
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useButterflyStore } from '@/stores/butterflyStore'

// Access the butterfly store
const butterflyStore = useButterflyStore()

// Guard for store and selected butterfly availability
const butterflyStoreAvailable = computed(
  () =>
    butterflyStore && butterflies.value.length > 0,
)

// Get the list of butterflies from the store
const butterflies = computed(() => butterflyStore.getAllButterflies)

// Use the store's selected butterfly
const selectedButterfly = computed(() => butterflyStore.getSelectedButterfly)

// Computed properties for butterfly settings
const selectedButterflySize = computed({
  get: () => selectedButterfly.value?.scale || 0.5,
  set: (val) => {
    if (selectedButterfly.value) {
      selectedButterfly.value.scale = val
    }
  },
})

const selectedButterflySpeed = computed({
  get: () => selectedButterfly.value?.speed || 1,
  set: (val) => {
    if (selectedButterfly.value) {
      selectedButterfly.value.speed = val
    }
  },
})

const selectedButterflyWingSpeed = computed({
  get: () => selectedButterfly.value?.wingSpeed || 1,
  set: (val) => {
    if (selectedButterfly.value) {
      selectedButterfly.value.wingSpeed = val
    }
  },
})

const selectedButterflyRotation = computed({
  get: () => selectedButterfly.value?.rotation || 0,
  set: (val) => {
    if (selectedButterfly.value) {
      selectedButterfly.value.rotation = val
    }
  },
})

const selectedButterflyZIndex = computed({
  get: () => selectedButterfly.value?.zIndex || 0,
  set: (val) => {
    if (selectedButterfly.value) {
      selectedButterfly.value.zIndex = val
    }
  },
})

const selectedButterflyWingTopColor = computed({
  get: () => selectedButterfly.value?.wingTopColor || '#ffffff',
  set: (val) => {
    if (selectedButterfly.value) {
      selectedButterfly.value.wingTopColor = val
    }
  },
})

const selectedButterflyWingBottomColor = computed({
  get: () => selectedButterfly.value?.wingBottomColor || '#ffffff',
  set: (val) => {
    if (selectedButterfly.value) {
      selectedButterfly.value.wingBottomColor = val
    }
  },
})

const selectedButterflyStatus = computed({
  get: () => selectedButterfly.value?.status || 'random',
  set: (val) => {
    if (selectedButterfly.value) {
      selectedButterfly.value.status = val
    }
  },
})
</script>
