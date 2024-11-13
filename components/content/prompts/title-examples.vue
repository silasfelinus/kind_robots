<template>
  <div>
    <h2 class="text-lg font-medium mb-2">Title Examples</h2>

    <!-- Display each example with an input and delete button -->
    <div
      v-for="(example, index) in currentExamples"
      :key="index"
      class="flex items-center space-x-4 mb-4"
    >
      <input
        v-model="currentExamples[index]"
        type="text"
        class="w-full p-2 rounded-lg border"
        placeholder="Enter example"
        @input="updateExampleString"
      />
      <button class="text-red-500" @click="removeExample(index)">
        <Icon name="kind-icon:trash" class="w-6 h-6" />
      </button>
    </div>

    <!-- Button to add a new example -->
    <button class="btn btn-primary mt-4" @click="addExample">
      Add New Example
    </button>

    <!-- Button to reorder examples -->
    <button class="btn btn-secondary mt-4" @click="reorderExamples">
      Reorder Examples
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { usePitchStore } from '~/stores/pitchStore'

const pitchStore = usePitchStore()

// Initialize current examples from the store's example string
const currentExamples = ref<string[]>(
  pitchStore.exampleString ? pitchStore.exampleString.split('|') : []
)

// Update the store whenever currentExamples changes
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

// Reorder examples and update the store (e.g., a simple reverse order)
function reorderExamples() {
  currentExamples.value.reverse()
  updateExampleString()
}
</script>
