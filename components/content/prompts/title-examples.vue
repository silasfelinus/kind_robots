<template>
  <div>
    <h2 class="text-xl font-semibold mb-4 text-primary">Title Examples</h2>

    <!-- Display Examples in Edit or Non-Edit Mode -->
    <div
      v-for="(example, index) in isEditing ? currentExamples : nonEditExamples"
      :key="index"
      class="flex items-center space-x-3 mb-3 p-3 rounded-lg border border-gray-300 shadow-md"
    >
      <!-- Edit Mode Input for Editing Examples -->
      <input
        v-if="isEditing"
        v-model="currentExamples[index]"
        type="text"
        class="w-full p-3 lg:text-lg rounded-lg border border-gray-300 focus:outline-none focus:ring focus:ring-primary"
        placeholder="Enter example"
      />
      <!-- Non-Edit Mode Display -->
      <span v-else>{{ example }}</span>

      <!-- Buttons for Editing Mode -->
      <template v-if="isEditing">
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
        <button
          class="text-red-500 hover:text-red-700 transform transition-transform duration-200 hover:scale-110"
          @click="removeExample(index)"
        >
          <Icon name="kind-icon:trash" class="w-6 h-6" />
        </button>
      </template>
    </div>

    <!-- Add New Example and Save Buttons for Editing Mode -->
    <button
      v-if="isEditing"
      class="btn btn-primary mt-4 hover:scale-105 transform transition-transform duration-200"
      @click="addExample"
    >
      Add New Example
    </button>
    <button
      v-if="isEditing"
      class="btn btn-success mt-4 hover:scale-105 transform transition-transform duration-200"
      @click="saveSelectedExamples"
    >
      Save Selected Examples
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePitchStore, type Pitch } from '~/stores/pitchStore'

const props = defineProps<{ pitch?: Partial<Pitch>; isEditing: boolean }>()
const pitchStore = usePitchStore()

// Local State for Current and Non-Edit Mode Examples
const currentExamples = ref<string[]>([])
const exampleString = ref<string>('')

// Initialize Examples for Edit and Non-Edit Modes
function initializeExamples() {
  if (props.pitch) {
    // Populate currentExamples for edit mode, fallback in non-edit mode
    currentExamples.value = props.pitch.examples?.split('|') || []
    exampleString.value = props.pitch.examples || ''
  }
}
initializeExamples()

// Non-Edit Mode Examples - Fallback to Example String or Delimiter-Joined Selected Examples
const nonEditExamples = computed(() => {
  // If exampleString has selections, split by delimiter; otherwise, use fallback
  return exampleString.value
    ? exampleString.value.split('|')
    : currentExamples.value
})

// Watch for Edit Mode Toggle
watch(
  () => props.isEditing,
  (newEditingStatus) => {
    if (newEditingStatus) {
      initializeExamples() // Reset examples on edit
    }
  },
)

// Add, Remove, and Reorder Examples in Edit Mode
function addExample() {
  currentExamples.value.push('')
}
function removeExample(index: number) {
  currentExamples.value.splice(index, 1)
}
function moveExample(index: number, direction: number) {
  const newIndex = index + direction
  if (newIndex >= 0 && newIndex < currentExamples.value.length) {
    const temp = currentExamples.value[index]
    currentExamples.value[index] = currentExamples.value[newIndex]
    currentExamples.value[newIndex] = temp
  }
}

// Save Examples to PitchStore and Update Selected Title
async function saveSelectedExamples() {
  if (props.pitch?.id) {
    pitchStore.exampleString = currentExamples.value.join('|')
    await pitchStore.updatePitchExamples(props.pitch.id, currentExamples.value)
  } else {
    console.warn("Can't save examples: pitch ID is missing.")
  }
}
</script>
