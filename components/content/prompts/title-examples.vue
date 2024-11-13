<template>
  <div>
    <h2 class="text-xl font-semibold mb-4 text-primary">Title Examples</h2>

    <!-- Display each example with an input, reorder, and delete buttons -->
    <div
      v-for="(example, index) in currentExamples"
      :key="index"
      class="flex items-center space-x-3 mb-3 p-3 rounded-lg border border-gray-300 shadow-md"
    >
      <!-- Example input box -->
      <input
        v-model="currentExamples[index]"
        type="text"
        class="w-full p-3 lg:text-lg rounded-lg border border-gray-300 focus:outline-none focus:ring focus:ring-primary"
        placeholder="Enter example"
        @input="updateExampleString"
      />

      <!-- Reorder Buttons -->
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

      <!-- Delete Button -->
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
import { ref } from 'vue'
import { usePitchStore } from '~/stores/pitchStore'

const pitchStore = usePitchStore()

// Initialize examples from the store, split by "|"
const currentExamples = ref<string[]>(
  pitchStore.exampleString ? pitchStore.exampleString.split('|') : []
)

// Emit the example string to update in the store whenever currentExamples changes
function updateExampleString() {
  pitchStore.exampleString = currentExamples.value.join('|')
}

// Add a new empty example
function addExample() {
  currentExamples.value.push('')
  updateExampleString()
}

// Remove an example at a specific index
function removeExample(index: number) {
  currentExamples.value.splice(index, 1)
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
