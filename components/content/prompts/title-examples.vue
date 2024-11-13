<template>
  <div>
    <h2 class="text-lg font-medium mb-2">Title Examples</h2>

    <!-- Display each example with an input, reorder, select, and delete buttons -->
    <div
      v-for="(example, index) in currentExamples"
      :key="index"
      :class="{ 'bg-yellow-100': selectedExamples.includes(index) }"
      class="flex items-center space-x-4 mb-4 p-2 rounded-lg border"
    >
      <input
        v-model="currentExamples[index]"
        type="text"
        class="w-full p-2 rounded-lg border"
        placeholder="Enter example"
        @input="updateExampleString"
      />

      <!-- Select Example Toggle -->
      <button class="text-green-500" @click="toggleSelectExample(index)">
        <Icon
          :name="
            selectedExamples.includes(index)
              ? 'mdi:checkbox-marked'
              : 'mdi:checkbox-blank-outline'
          "
          class="w-6 h-6"
        />
      </button>

      <!-- Reorder Buttons -->
      <button
        class="text-gray-500"
        :disabled="index === 0"
        @click="moveExample(index, -1)"
      >
        ⬆️
      </button>
      <button
        class="text-gray-500"
        :disabled="index === currentExamples.length - 1"
        @click="moveExample(index, 1)"
      >
        ⬇️
      </button>

      <!-- Delete Button -->
      <button class="text-red-500" @click="removeExample(index)">
        <Icon name="kind-icon:trash" class="w-6 h-6" />
      </button>
    </div>

    <!-- Button to add a new example -->
    <button class="btn btn-primary mt-4" @click="addExample">
      Add New Example
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { usePitchStore } from '~/stores/pitchStore'

const pitchStore = usePitchStore()

// Initialize current examples from the store's example string
const currentExamples = ref<string[]>(
  pitchStore.exampleString ? pitchStore.exampleString.split('|') : [],
)

// Track selected examples
const selectedExamples = ref<number[]>([])

// Update exampleString in the store whenever currentExamples changes
function updateExampleString() {
  pitchStore.exampleString = currentExamples.value.join('|')
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
/* Style for selected examples */
.bg-yellow-100 {
  background-color: rgba(255, 223, 88, 0.3); /* Highlight color */
}
</style>
