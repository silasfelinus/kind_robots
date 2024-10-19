<template>
  <div class="bg-gray-200 p-4 rounded-lg flex flex-col h-full">
    <!-- Scrollable settings area -->
    <div class="overflow-y-auto flex-grow pr-4">
      <h3 class="text-center mb-4">Select and Adjust Butterfly Settings</h3>

      <!-- Guard: Check if there are butterflies and selected butterfly is available -->
      <div v-if="butterflyStoreAvailable">
        <!-- Butterfly Selection -->
        <div v-if="butterflies.length > 0" class="mb-6">
          <label for="selectedButterfly" class="block mb-2"
            >Select Butterfly:</label
          >
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

        <!-- Butterfly ID Editing -->
        <div v-if="selectedButterfly" class="mb-6">
          <label for="editButterflyId" class="block mb-2"
            >Edit Butterfly ID:</label
          >
          <input
            id="editButterflyId"
            v-model="newButterflyId"
            type="text"
            class="w-full p-2 rounded"
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
          :min="0.5"
          :max="5"
          :step="0.1"
          slider-id="speedSlider"
          class="mb-4"
        />

        <!-- Wing Speed slider -->
        <single-slider
          v-if="selectedButterfly"
          v-model="selectedButterflyWingSpeed"
          label="Wing Speed"
          :min="0.5"
          :max="5"
          :step="0.1"
          slider-id="wingSpeedSlider"
          class="mb-4"
        />
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
    butterflyStore && butterflies.value.length > 0 && selectedButterfly.value,
)

// Get the list of butterflies from the store
const butterflies = computed(() => butterflyStore.getAllButterflies)

// Use the store's selected butterfly getter directly
const selectedButterfly = computed(() => butterflyStore.getSelectedButterfly)

// New butterfly ID for editing purposes
const newButterflyId = computed({
  get: () => selectedButterfly.value?.id || '',
  set: (val) => {
    if (selectedButterfly.value) {
      butterflyStore.updateButterflyId(selectedButterfly.value.id, val)
    }
  },
})

// Butterfly property bindings with fallback values
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
</script>

<style scoped>
/* Add any necessary styles here */
</style>
