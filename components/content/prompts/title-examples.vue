<template>
  <div>
    <h2 class="text-xl font-semibold mb-4">Title Examples</h2>

    <!-- Toggle Edit Mode Button -->
    <button
      class="btn btn-primary mb-4 hover:scale-105 transform transition-transform duration-200"
      @click="toggleEditMode"
    >
      {{ isEditing ? 'Finish Editing' : 'Edit Examples' }}
    </button>

    <!-- Display Examples in Edit or Non-Edit Mode -->
    <div
      v-for="(example, index) in isEditing ? editableExamples : nonEditExamples"
      :key="index"
      class="flex items-center space-x-3 mb-3 p-3 rounded-lg border border-gray-300 shadow-md"
      :class="{
        'bg-blue-200': !isEditing && selectedExamples.includes(index),
        'cursor-pointer': !isEditing,
      }"
      @click="!isEditing && toggleExampleSelection(index)"
    >
      <!-- Edit Mode Input for Editing Examples -->
      <input
        v-if="isEditing"
        v-model="editableExamples[index]"
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
          :disabled="index === editableExamples.length - 1"
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
      class="btn btn-secondary mt-4 hover:scale-105 transform transition-transform duration-200"
      @click="addExample"
    >
      Add New Example
    </button>
    <button
      v-if="isEditing"
      class="btn btn-success mt-4 hover:scale-105 transform transition-transform duration-200"
      @click="saveEditedExamples"
    >
      Save Edited Examples
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePitchStore, type Pitch } from '~/stores/pitchStore'

const props = defineProps<{ pitch?: Partial<Pitch> }>()
const pitchStore = usePitchStore()

// Local State for Edit Mode
const isEditing = ref(false) // Track edit mode locally
const editableExamples = ref<string[]>([]) // Track editable examples only when in edit mode
const exampleString = ref<string>('') // Main example string updated in non-edit mode
const selectedExamples = ref<number[]>([]) // Track selected example indices in non-edit mode

// Initialize Examples for Non-Edit Mode and Edit Mode Separately
function initializeExamples() {
  if (props.pitch) {
    // Populate exampleString for non-edit mode display
    exampleString.value = props.pitch.examples || ''
    editableExamples.value = exampleString.value.split('|') // Only for editing
    selectedExamples.value = [] // Reset selections on initialization
  }
}
initializeExamples()

// Non-Edit Mode Display Examples (computed from exampleString)
const nonEditExamples = computed(() => {
  return exampleString.value.split('|')
})

// Toggle Edit Mode
function toggleEditMode() {
  isEditing.value = !isEditing.value
  if (isEditing.value) {
    editableExamples.value = exampleString.value.split('|') // Initialize editable list
  } else {
    saveEditedExamples() // Save edits to exampleString on toggle exit
  }
}

// Toggle example selection in non-edit mode
function toggleExampleSelection(index: number) {
  const selectedIndex = selectedExamples.value.indexOf(index)
  if (selectedIndex === -1) {
    selectedExamples.value.push(index) // Select example
  } else {
    selectedExamples.value.splice(selectedIndex, 1) // Deselect example
  }
  updateExampleStringFromSelection()
}

// Update exampleString based on selected examples in non-edit mode
function updateExampleStringFromSelection() {
  // Join selected examples by '|' to form a single string
  const selectedStrings = selectedExamples.value
    .map((i) => nonEditExamples.value[i])
    .join('|')
  exampleString.value = selectedStrings
}

// Save Edited Examples back to PitchStore when finishing editing
async function saveEditedExamples() {
  const pitchId = props.pitch?.id ?? 0
  if (pitchId) {
    // Use editableExamples as an array for pitchStore update
    exampleString.value = editableExamples.value.join('|') // Update exampleString for display
    await pitchStore.updatePitchExamples(pitchId, editableExamples.value) // Pass as an array
  } else {
    console.warn("Can't save examples: pitch ID is missing.")
  }
}

// Add, Remove, and Reorder Examples in Edit Mode
function addExample() {
  editableExamples.value.push('')
}
function removeExample(index: number) {
  editableExamples.value.splice(index, 1)
}
function moveExample(index: number, direction: number) {
  const newIndex = index + direction
  if (newIndex >= 0 && newIndex < editableExamples.value.length) {
    const temp = editableExamples.value[index]
    editableExamples.value[index] = editableExamples.value[newIndex]
    editableExamples.value[newIndex] = temp
  }
}
</script>
