<template>
  <div>
    <h2 class="text-xl font-semibold mb-4 text-primary">Title Examples</h2>

    <div
      v-for="(example, index) in currentExamples"
      :key="index"
      class="flex items-center space-x-3 mb-3 p-3 rounded-lg border border-gray-300 shadow-md"
    >
      <input
        v-if="isEditing"
        v-model="currentExamples[index]"
        type="text"
        class="w-full p-3 lg:text-lg rounded-lg border border-gray-300 focus:outline-none focus:ring focus:ring-primary"
        placeholder="Enter example"
      />
      <span v-else>{{ example }}</span>

      <button
        v-if="isEditing"
        class="text-gray-500 hover:text-gray-700 transform transition-transform duration-200 hover:scale-110"
        :disabled="index === 0"
        @click="moveExample(index, -1)"
      >
        ⬆️
      </button>
      <button
        v-if="isEditing"
        class="text-gray-500 hover:text-gray-700 transform transition-transform duration-200 hover:scale-110"
        :disabled="index === currentExamples.length - 1"
        @click="moveExample(index, 1)"
      >
        ⬇️
      </button>

      <button
        v-if="isEditing"
        class="text-red-500 hover:text-red-700 transform transition-transform duration-200 hover:scale-110"
        @click="removeExample(index)"
      >
        <Icon name="kind-icon:trash" class="w-6 h-6" />
      </button>
    </div>

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
import { ref, watch } from 'vue'
import { usePitchStore, type Pitch } from '~/stores/pitchStore'

const props = defineProps<{ pitch?: Partial<Pitch>; isEditing: boolean }>()
const pitchStore = usePitchStore()

const currentExamples = ref<string[]>([])

// Initialize currentExamples from selectedTitle examples
function initializeExamples() {
  currentExamples.value = props.pitch?.examples?.split('|') || []
}

// Call initializeExamples on component mount and whenever `isEditing` changes
initializeExamples()
watch(
  () => props.isEditing,
  (newEditingStatus) => {
    if (newEditingStatus) {
      initializeExamples() // Reset examples when entering edit mode
    }
  },
)

// Edit actions
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

// Save to selectedTitle on save
async function saveSelectedExamples() {
  if (props.pitch?.id) {
    // Save examples back to pitchStore as a string with | delimiter
    pitchStore.exampleString = currentExamples.value.join('|')
    await pitchStore.updatePitchExamples(props.pitch.id, currentExamples.value)
  } else {
    console.warn("Can't save examples: pitch ID is missing.")
  }
}
</script>
