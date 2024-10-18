<template>
  <div class="bg-gray-200 p-4 rounded-lg flex flex-col justify-between h-full">
    <!-- Scrollable settings area -->
    <div class="overflow-y-auto flex-grow pr-4">
      <h3 class="text-center mb-4">Select and Adjust Butterfly Settings</h3>

      <!-- Butterfly Selection -->
      <div v-if="butterflies.length > 0" class="mb-6">
        <label for="selectedButterfly" class="block mb-2"
          >Select Butterfly:</label
        >
        <select
          v-model="selectedButterflyId"
          class="w-full p-2 rounded"
          @change="selectButterfly"
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
          @blur="updateButterflyId"
        />
      </div>

      <!-- Size range slider -->
      <butterfly-slider
        v-if="selectedButterfly"
        v-model="selectedButterflySize"
        label="Size"
        :min="0.5"
        :max="2"
        :step="0.1"
        slider-id="sizeSlider"
      />

      <!-- Speed range slider -->
      <butterfly-slider
        v-if="selectedButterfly"
        v-model="selectedButterflySpeed"
        label="Speed"
        :min="0.5"
        :max="5"
        :step="0.1"
        slider-id="speedSlider"
      />

      <!-- Wing Speed range slider -->
      <butterfly-slider
        v-if="selectedButterfly"
        v-model="selectedButterflyWingSpeed"
        label="Wing Speed"
        :min="0.5"
        :max="5"
        :step="0.1"
        slider-id="wingSpeedSlider"
      />

      <!-- Sway range slider -->
      <butterfly-slider
        v-if="selectedButterfly"
        v-model="selectedButterflySway"
        label="Sway"
        :min="0"
        :max="2"
        :step="0.1"
        slider-id="swaySlider"
      />
    </div>

    <!-- Butterfly Demo always visible at the bottom -->
    <div class="mt-4">
      <butterfly-demo v-if="selectedButterfly" :butterfly="selectedButterfly" />
    </div>
  </div>
</template>
<script setup>
import { computed, ref } from 'vue'
import { useButterflyStore } from '@/stores/butterflyStore'

// Access the butterfly store
const butterflyStore = useButterflyStore()
const butterflies = computed(() => butterflyStore.getAllButterflies)

// Selected butterfly ID and reactive object for selected butterfly
const selectedButterflyId = ref(
  butterflies.value.length ? butterflies.value[0].id : null,
)
const selectedButterfly = computed(() =>
  butterflies.value.find(
    (butterfly) => butterfly.id === selectedButterflyId.value,
  ),
)

// Create a reactive property for the new butterfly ID (used for editing)
const newButterflyId = ref(selectedButterfly.value?.id || '')

// Update the selected butterfly's ID
const updateButterflyId = () => {
  if (selectedButterfly.value) {
    butterflyStore.updateButterflyId(
      selectedButterfly.value.id,
      newButterflyId.value,
    )
  }
}

// Handle selecting a new butterfly
const selectButterfly = () => {
  newButterflyId.value = selectedButterfly.value?.id || ''
}

// Compute and bind individual butterfly properties like size, speed, etc.
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

const selectedButterflySway = computed({
  get: () => selectedButterfly.value?.sway || 0.1,
  set: (val) => {
    if (selectedButterfly.value) {
      selectedButterfly.value.sway = val
    }
  },
})
</script>
