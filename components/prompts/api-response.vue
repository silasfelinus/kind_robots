<!-- /components/content/prompts/api-response.vue -->
<template>
  <div class="api-response-container">
    <h2 class="text-lg font-semibold mb-2 text-black">Parsed Examples</h2>

    <div v-if="parsedExamples.length" class="example-list space-y-3">
      <div
        v-for="(example, index) in parsedExamples"
        :key="index"
        class="flex items-center space-x-3 p-3 rounded-lg border border-gray-300 shadow-md"
      >
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
          type="button"
        >
          <Icon name="kind-icon:trash" class="w-5 h-5" />
        </button>
      </div>
    </div>

    <p v-else class="text-sm text-black mt-2">No examples available.</p>

    <button
      class="btn btn-secondary mt-4 hover:scale-105 transform transition-transform duration-200"
      @click="addSelectedExamplesToTitle"
      type="button"
    >
      Add Selected Examples to Title
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { usePitchStore } from '~/stores/pitchStore'

const pitchStore = usePitchStore()

const parsedExamples = ref<string[]>([])
const selectedIndices = ref<number[]>([])

watch(
  () => pitchStore.apiResponse as unknown,
  (newResponse) => {
    const raw = typeof newResponse === 'string' ? newResponse : ''
    parsedExamples.value = raw
      .split('|')
      .map((ex: string) => ex.trim())
      .filter((ex: string) => ex.length > 0)
  },
  { immediate: true },
)

watch(selectedIndices, (newSelection: number[]) => {
  console.log('Selected Indices:', newSelection)
})

function removeExample(index: number) {
  parsedExamples.value.splice(index, 1)
}

function addSelectedExamplesToTitle() {
  const title = pitchStore.selectedTitle
  if (!title) {
    console.warn('No selected title to add examples to.')
    return
  }

  const selectedExamples = selectedIndices.value
    .map((i: number) => parsedExamples.value[i])
    .filter((v: string | undefined): v is string => typeof v === 'string')

  const existing = typeof title.examples === 'string' ? title.examples : ''
  const updatedExamples = [
    ...existing
      .split('|')
      .map((s: string) => s.trim())
      .filter(Boolean),
    ...selectedExamples,
  ]

  pitchStore.updatePitchExamples(title.id, updatedExamples)
  console.log('Added examples to title:', updatedExamples)

  selectedIndices.value
    .sort((a: number, b: number) => b - a)
    .forEach((index: number) => {
      parsedExamples.value.splice(index, 1)
    })

  selectedIndices.value = []
}
</script>
