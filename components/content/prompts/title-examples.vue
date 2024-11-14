<template>
  <div>
    <h2 class="text-xl text-black font-semibold mb-4">Title Examples</h2>

    <!-- Toggle Edit Mode Button -->
    <button
      class="btn btn-primary mb-4 hover:scale-105 transform transition-transform duration-200"
      @click="toggleEditMode"
    >
      {{ isEditing ? 'Finish Editing' : 'Edit Examples' }}
    </button>

    <!-- Display Examples in Edit or Non-Edit Mode -->
    <div
      v-for="(example, index) in isEditing ? editableExamples : displayExamples"
      :key="index"
      class="flex items-center space-x-3 mb-3 p-3 rounded-lg border border-gray-300 shadow-md"
      :class="{ 'bg-blue-200': !isEditing && selectedExamples.includes(index) }"
      @click="!isEditing && toggleExampleSelection(index)"
    >
      <!-- Edit Mode Input for Editing Examples -->
      <input
        v-if="isEditing"
        v-model="editableExamples[index]"
        type="text"
        class="w-full p-3 lg:text-lg text-black rounded-lg border border-gray-300 focus:outline-none focus:ring focus:ring-primary"
        placeholder="Enter example"
      />
      <!-- Non-Edit Mode Display -->
      <span v-else>{{ example }}</span>

      <!-- Edit Mode Controls -->
      <template v-if="isEditing">
        <button
          class="text-gray-500 hover:text-gray-700"
          :disabled="index === 0"
          @click="moveExample(index, -1)"
        >
          ⬆️
        </button>
        <button
          class="text-gray-500 hover:text-gray-700"
          :disabled="index === editableExamples.length - 1"
          @click="moveExample(index, 1)"
        >
          ⬇️
        </button>
        <button
          class="text-red-500 hover:text-red-700"
          @click="removeExample(index)"
        >
          <Icon name="kind-icon:trash" class="w-6 h-6" />
        </button>
      </template>
    </div>

    <!-- Add and Save Buttons in Edit Mode -->
    <button
      v-if="isEditing"
      class="btn btn-secondary mt-4"
      @click="addExample"
    >
      Add New Example
    </button>
    <button
      v-if="isEditing"
      class="btn btn-success mt-4"
      @click="saveEditedExamples"
    >
      Save Edited Examples
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePitchStore } from '~/stores/pitchStore'
import type { Pitch } from '~/stores/pitchStore'

const props = defineProps<{ pitch: Pitch }>()
const pitchStore = usePitchStore()

// State
const isEditing = ref(false)
const selectedExamples = ref<number[]>([])
const editableExamples = ref<string[]>([])

// Computed for Non-Edit Mode Display
const displayExamples = computed(() => props.pitch.examples.split('|'))

// Toggle Edit Mode
function toggleEditMode() {
  isEditing.value = !isEditing.value
  if (isEditing.value) {
    editableExamples.value = [...displayExamples.value] // Initialize edit array
  } else {
    saveEditedExamples() // Save edits when exiting edit mode
  }
}

// Select/Deselect Examples in Non-Edit Mode
function toggleExampleSelection(index: number) {
  const selectedIndex = selectedExamples.value.indexOf(index)
  if (selectedIndex === -1) {
    selectedExamples.value.push(index)
  } else {
    selectedExamples.value.splice(selectedIndex, 1)
  }
}

// Save Edited Examples to PitchStore
async function saveEditedExamples() {
  await pitchStore.updatePitchExamples(props.pitch.id, editableExamples.value)
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
