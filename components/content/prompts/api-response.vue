<template>
  <div class="api-response-container">
    <h2 class="text-lg font-semibold mb-2 text-black">Parsed Examples</h2>
    <div v-if="parsedExamples.length" class="example-list space-y-3">
      <div
        v-for="(example, index) in parsedExamples"
        :key="index"
        class="flex items-center space-x-3 p-3 rounded-lg border border-gray-300 shadow-md"
      >
        <!-- Checkbox for selecting/unselecting examples -->
        <input
          v-model="selectedIndices"
          type="checkbox"
          :value="index"
          class="cursor-pointer"
        />
        <input
          v-model="parsedExamples[index]"
          type="text"
          class="w-full p-2 border rounded focus:outline-none focus:ring text-black"
        />
        <button
          class="text-red-500 hover:text-red-700 transform transition-transform duration-200 hover:scale-110"
          @click="removeExample(index)"
        >
          <Icon name="kind-icon:trash" class="w-5 h-5" />
        </button>
      </div>
    </div>
    <p v-else class="text-sm text-black mt-2">No examples available.</p>

    <button
      class="btn btn-secondary mt-4 hover:scale-105 transform transition-transform duration-200"
      @click="addSelectedExamplesToTitle"
    >
      Add Selected Examples to Title
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { usePitchStore } from '~/stores/pitchStore'

const pitchStore = usePitchStore()

// Parse apiResponse by splitting with '|'
const parsedExamples = ref<string[]>([])
watch(
  () => pitchStore.apiResponse,
  (newResponse) => {
    parsedExamples.value = newResponse.split('|').map((ex) => ex.trim())
  },
  { immediate: true },
)

// Track selected example indices
const selectedIndices = ref<number[]>([])

// Observe changes to selectedIndices to debug selection/unselection
watch(selectedIndices, (newSelection) => {
  console.log('Selected Indices:', newSelection)
})

// Remove example by index
function removeExample(index: number) {
  parsedExamples.value.splice(index, 1)
}

function addSelectedExamplesToTitle() {
  if (pitchStore.selectedTitle) {
    const selectedExamples = selectedIndices.value.map(
      (i) => parsedExamples.value[i],
    )

    // Combine existing examples with new selected examples as an array
    const updatedExamples = [
      ...(pitchStore.selectedTitle.examples?.split('|') || []),
      ...selectedExamples,
    ]

    // Update pitch examples with an array of strings
    pitchStore.updatePitchExamples(pitchStore.selectedTitle.id, updatedExamples)
    console.log('Added examples to title:', updatedExamples)

    // Remove selected examples from parsedExamples
    selectedIndices.value
      .sort((a, b) => b - a) // Sort indices in descending order to avoid reindexing issues
      .forEach((index) => {
        parsedExamples.value.splice(index, 1)
      })

    // Clear selections after adding
    selectedIndices.value = []
  } else {
    console.warn('No selected title to add examples to.')
  }
}
</script>
