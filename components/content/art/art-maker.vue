<!-- /components/content/art/art-maker.vue -->
<template>
  <div
    class="bg-base-300 shadow-xl rounded-3xl border overflow-y-auto border-base-200 z-10 text-lg max-w-xl mx-auto transform transition-all duration-300 hover:scale-105"
  >
    <h1 class="text-3xl font-bold m-6 text-center text-primary">
      🎨 Welcome to the Art-Maker
    </h1>
    <checkpoint-gallery />
    <random-selector />

    <!-- Prompt Input -->
    <div class="mb-6">
      <textarea
        v-model="promptStore.promptField"
        placeholder="Enter your creative prompt..."
        rows="6"
        class="rounded-3xl p-4 w-full text-lg bg-base-200 placeholder-gray-500 focus:ring-4 focus:ring-info focus:outline-none shadow-inner transition-all resize-none"
        :disabled="loading"
        @input="savePrompt"
      />
    </div>

    <collection-handler />

    <!-- Generate Art Button -->
    <button
      :class="
        isGenerating ? 'bg-secondary text-white' : 'bg-primary text-white'
      "
      class="font-semibold rounded-3xl p-4 w-full transition-all duration-300 ease-in-out hover:bg-info hover:shadow-lg active:bg-secondary focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed"
      :disabled="isGenerating || !promptStore.promptField"
      @click="generateArt"
    >
      <span>🖌️ Create Art</span>
    </button>

    <!-- Local and Error Store Messages -->
    <div v-if="localError" class="mt-4">
      <p class="text-red-500 text-center font-medium">
        {{ localError }}
      </p>
      <p v-if="lastError" class="text-red-500 text-center font-medium">
        {{ lastError }}
      </p>
    </div>

    <!-- Generated Art Display -->
    <div v-if="generatedArt.length > 0" class="mt-8">
      <div v-for="art in generatedArt" :key="art.id" class="mb-6">
        <ArtCard :art="art" />
      </div>
    </div>
    <art-gallery />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useArtStore } from './../../../stores/artStore'
import { usePromptStore } from './../../../stores/promptStore'
import { useDisplayStore } from './../../../stores/displayStore'
import { useErrorStore, ErrorType } from './../../../stores/errorStore'
import { useCollectionStore } from './../../../stores/collectionStore'
import { useMilestoneStore } from './../../../stores/milestoneStore'

const milestoneStore = useMilestoneStore()
const collectionStore = useCollectionStore()
const artStore = useArtStore()
const promptStore = usePromptStore()
const displayStore = useDisplayStore()
const errorStore = useErrorStore()

// States and computed properties
const localError = ref<string | null>(null)
const isGenerating = ref(false) // Tracks if art generation is in progress
const loading = computed(() => artStore.loading)
const lastError = computed(() => errorStore.getError)

const savePrompt = () => {
  promptStore.syncToLocalStorage()
}

// Fetch the "Generated Art" collection and its art
const generatedArtCollection = computed(() =>
  collectionStore.collections.find((c) => c.label === 'Generated Art'),
)

const generatedArt = computed(() =>
  generatedArtCollection.value
    ? [...generatedArtCollection.value.art].reverse()
    : [],
)

const generateArt = async () => {
  localError.value = null
  isGenerating.value = true // Mark art generation as in progress
  displayStore.toggleRandomAnimation()
  milestoneStore.rewardMilestone(11)

  console.log('Generating art with prompt:', promptStore.promptField)

  if (!promptStore.validatePromptString(promptStore.promptField)) {
    localError.value = 'Invalid characters in prompt.'
    errorStore.addError(ErrorType.VALIDATION_ERROR, localError.value)
    console.log('Error:', localError.value)
    isGenerating.value = false
    return
  }

  try {
    const result = await artStore.generateArt()
    console.log('Art generated result:', result)

    if (!result.success) {
      localError.value = result.message || 'Unknown error occurred.'
      errorStore.addError(ErrorType.GENERAL_ERROR, localError.value)
      console.log('Error:', localError.value)
    }
  } catch (error) {
    localError.value =
      error instanceof Error ? error.message : 'Failed to generate art.'
    errorStore.addError(ErrorType.NETWORK_ERROR, localError.value)
    console.log('Error:', localError.value)
  } finally {
    displayStore.stopAnimation()
    isGenerating.value = false // Mark art generation as complete
  }
}

onMounted(async () => {
  await artStore.initialize()
  console.log('Fetching Generated Art collection...')
  await collectionStore.fetchCollections()
  console.log('ArtStore and PromptStore initialized')
})
</script>
