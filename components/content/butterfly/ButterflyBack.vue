<template>
  <div class="bg-gray-200 p-4 rounded-lg">
    <h3 class="text-center mb-4">Modify Butterflies</h3>

    <!-- Butterfly ID Selection Bubbles -->
    <div class="flex flex-wrap mb-4">
      <div
        v-for="butterfly in butterflies"
        :key="butterfly.id"
        class="butterfly-id-bubble cursor-pointer mx-2 mb-2"
        :class="{
          'bg-blue-400': selectedButterflies.includes(butterfly.id),
          'bg-gray-400': !selectedButterflies.includes(butterfly.id),
        }"
        @click="toggleSelect(butterfly.id)"
      >
        {{ butterfly.id }}
      </div>
    </div>

    <!-- Select All Button -->
    <button class="control-btn mb-4" @click="selectAllButterflies">
      Select All
    </button>

    <!-- Butterfly Settings Form -->
    <div v-if="selectedButterflies.length > 0" class="settings-form">
      <h4 class="mb-2">Modify Settings for Selected Butterflies</h4>

      <!-- Size Slider -->
      <div class="mb-4">
        <label for="sizeRange" class="block mb-2">Size:</label>
        <input
          id="sizeRange"
          v-model="groupSettings.size"
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          class="w-full"
        />
        <p>Size: {{ groupSettings.size }}</p>
      </div>

      <!-- Speed Slider -->
      <div class="mb-4">
        <label for="speedRange" class="block mb-2">Speed:</label>
        <input
          id="speedRange"
          v-model="groupSettings.speed"
          type="range"
          min="0.5"
          max="5"
          step="0.1"
          class="w-full"
        />
        <p>Speed: {{ groupSettings.speed }}</p>
      </div>

      <!-- Color Scheme Dropdown -->
      <div class="mb-4">
        <label for="colorScheme" class="block mb-2">Color Scheme:</label>
        <select v-model="groupSettings.colorScheme" class="w-full p-2">
          <option value="random">Random</option>
          <option value="complementary">Complementary</option>
          <option value="analogous">Analogous</option>
          <option value="same">Same</option>
          <option value="primary">Primary</option>
        </select>
      </div>

      <!-- Apply Changes Button -->
      <button class="control-btn mt-4" @click="applyChangesToSelected">
        Apply Changes
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useButterflyStore } from '@/stores/butterflyStore'

// Access the butterfly store
const butterflyStore = useButterflyStore()

// Get all butterflies from the store
const butterflies = computed(() => butterflyStore.butterflies)

// Array of selected butterfly IDs
const selectedButterflies = ref<number[]>([])

// Default group settings for the selected butterflies
const groupSettings = ref({
  size: 1,
  speed: 1,
  colorScheme: 'random',
})

// Function to toggle selection of a butterfly ID
const toggleSelect = (id: number) => {
  if (selectedButterflies.value.includes(id)) {
    selectedButterflies.value = selectedButterflies.value.filter(
      (bId) => bId !== id,
    )
  } else {
    selectedButterflies.value.push(id)
  }
}

// Select all butterflies
const selectAllButterflies = () => {
  if (selectedButterflies.value.length === butterflies.value.length) {
    selectedButterflies.value = [] // Deselect all if already selected
  } else {
    selectedButterflies.value = butterflies.value.map((b) => b.id) // Select all
  }
}

// Apply changes to the selected butterflies
const applyChangesToSelected = () => {
  selectedButterflies.value.forEach((id) => {
    const butterfly = butterflyStore.getButterflyById(id)

    if (butterfly) {
      butterfly.z = groupSettings.value.size
      butterfly.speed = groupSettings.value.speed
      butterfly.wingTopColor = butterflyStore.getColorSchemeColor(
        groupSettings.value.colorScheme,
      )
      butterfly.wingBottomColor = butterflyStore.getColorSchemeColor(
        groupSettings.value.colorScheme,
      )
    }
  })
}
</script>

<style scoped>
.butterfly-id-bubble {
  width: 40px;
  height: 40px;
  line-height: 40px;
  border-radius: 50%;
  text-align: center;
  background-color: gray;
  color: white;
  font-size: 12px;
}

.control-btn {
  background-color: #ff9800;
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s;
}

.control-btn:hover {
  transform: scale(1.05);
}
</style>
