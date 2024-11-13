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
      />
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
import { ref, computed, watch } from 'vue'

// Set up emit for parent updates
const emit = defineEmits(['update:examples'])

// Manage examples as a list of strings
const currentExamples = ref<string[]>([])

// Computed property that joins examples with '|'
const finalExamplesString = computed(() => currentExamples.value.join(' | '))

// Watch for changes to the examples and emit updated string
watch(finalExamplesString, (newString) => {
  emit('update:examples', newString) // Send final string to parent
})

// Method to add an empty example input
function addExample() {
  currentExamples.value.push('')
}

// Method to remove a specific example by index
function removeExample(index: number) {
  currentExamples.value.splice(index, 1)
}
</script>
