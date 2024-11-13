<template>
  <div>
    <h2 class="text-xl font-semibold mb-4 text-primary">Title Examples</h2>

    <!-- Display each example with an input, reorder, select, and delete buttons -->
    <div
      v-for="(example, index) in currentExamples"
      :key="index"
      :class="{ 'bg-yellow-200': selectedExamples.includes(index) }"
      class="flex items-center space-x-3 mb-3 p-3 rounded-lg border border-gray-300 shadow-md"
    >
      <!-- Example input box with responsive text and padding -->
      <input
        v-model="currentExamples[index]"
        type="text"
        class="w-full p-3 lg:text-lg rounded-lg border border-gray-300 focus:outline-none focus:ring focus:ring-primary"
        placeholder="Enter example"
        @input="updateExampleString"
      />

      <!-- Select Example Toggle with hover effect and scale animation -->
      <button
        class="text-green-500 hover:text-green-700 transform transition-transform duration-200 hover:scale-110"
        @click="toggleSelectExample(index)"
      >
        <Icon
          :name="
            selectedExamples.includes(index)
              ? 'mdi:checkbox-marked'
              : 'mdi:checkbox-blank-outline'
          "
          class="w-6 h-6"
        />
      </button>

      <!-- Reorder Buttons with hover effect and scale animation -->
      <button
        class="text-gray-500 hover:text-gray-700 transform transition-transform duration-200 hover:scale-110"
        :disabled="index === 0"
        @click="moveExample(index, -1)"
      >
        ⬆️
      </button>
      <button
        class="text-gray-500 hover:text-gray-700 transform transition-transform duration-200 hover:scale-110"
        :disabled="index === currentExamples.length - 1"
        @click="moveExample(index, 1)"
      >
        ⬇️
      </button>

      <!-- Delete Button with hover effect and scale animation -->
      <button
        class="text-red-500 hover:text-red-700 transform transition-transform duration-200 hover:scale-110"
        @click="removeExample(index)"
      >
        <Icon name="kind-icon:trash" class="w-6 h-6" />
      </button>
    </div>

    <!-- Button to add a new example -->
    <button
      class="btn btn-primary mt-4 hover:scale-105 transform transition-transform duration-200"
      @click="addExample"
    >
      Add New Example
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePitchStore } from '~/stores/pitchStore'

const pitchStore = usePitchStore()

// Get current examples from the store's pitch data, handling possible null values
const selectedTitle = computed(() => pitchStore.selectedTitle)
const currentExamples = ref<string[]>(
  selectedTitle.value?.examples ? selectedTitle.value.examples.split('|') : [],
)

// Track selected examples
const selectedExamples = ref<number[]>([])

// Update exampleString in the store whenever currentExamples changes
function updateExampleString() {
  if (selectedTitle.value) {
    selectedTitle.value.examples = currentExamples.value.join('|')
  }
}

// Toggle the selection of an example
function toggleSelectExample(index: number) {
  if (selectedExamples.value.includes(index)) {
    selectedExamples.value = selectedExamples.value.filter((i) => i !== index)
  } else {
    selectedExamples.value.push(index)
  }
}

// Add a new empty example
function addExample() {
  currentExamples.value.push('')
  updateExampleString()
}

// Remove an example at a specific index
function removeExample(index: number) {
  currentExamples.value.splice(index, 1)
  selectedExamples.value = selectedExamples.value.filter((i) => i !== index) // Update selectedExamples if necessary
  updateExampleString()
}

// Move an example up or down within the list
function moveExample(index: number, direction: number) {
  const newIndex = index + direction
  if (newIndex >= 0 && newIndex < currentExamples.value.length) {
    const temp = currentExamples.value[index]
    currentExamples.value[index] = currentExamples.value[newIndex]
    currentExamples.value[newIndex] = temp
    updateExampleString()
  }
}
</script>

<style scoped>
/* Highlight color for selected examples */
.bg-yellow-200 {
  background-color: rgba(255, 223, 88, 0.3); /* Highlight color */
}
</style>
