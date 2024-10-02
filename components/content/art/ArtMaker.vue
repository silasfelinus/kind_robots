<template>
  <div
    class="bg-base-300 shadow-xl rounded-3xl border border-base-200 p-6 text-lg max-w-xl mx-auto transform transition-all duration-300 hover:scale-105"
  >
    <h1 class="text-3xl font-bold m-6 text-center text-primary">
      🎨 Welcome to the Art-Maker
    </h1>

    <!-- Prompt Input -->
    <div class="mb-6">
      <input
        v-model="promptStore.promptField"
        placeholder="Enter your creative prompt..."
        class="rounded-3xl p-4 w-full text-lg bg-base-200 placeholder-gray-500 focus:ring-4 focus:ring-info focus:outline-none shadow-inner transition-all"
        :disabled="loading"
        @input="savePrompt"
      />
    </div>

    <!-- Generate Art Button -->
    <button
      :class="loading ? 'bg-secondary text-white' : 'bg-primary text-white'"
      class="font-semibold rounded-3xl p-4 w-full transition-all duration-300 ease-in-out hover:bg-info hover:shadow-lg active:bg-secondary focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed"
      :disabled="loading || !promptStore.promptField"
      @click="generateArt"
    >
      <span v-if="loading">🖌️ Making Art...</span>
      <span v-else>🖌️ Create Art</span>
    </button>

    <!-- Local and Error Store Messages -->
    <div v-if="localError" class="mt-4">
      <p v-if="localError" class="text-red-500 text-center font-medium">
        {{ localError }}
      </p>
      <p v-if="lastError" class="text-red-500 text-center font-medium">
        {{ lastError }}
      </p>
    </div>

    <!-- Generated Art Display -->
    <div v-if="generatedArtWithImages.length > 0" class="mt-8">
      <div v-for="item in generatedArtWithImages" :key="item.art.id" class="mb-6">
        <ArtCard :art="item.art" :imageData="item.artImage" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { usePromptStore } from '@/stores/promptStore'
import { useDisplayStore } from '@/stores/displayStore'
import { useErrorStore, ErrorType } from '@/stores/errorStore'
import ArtCard from './ArtCard.vue' // Import the reusable ArtCard component

// Access the stores
const artStore = useArtStore()
const promptStore = usePromptStore()
const displayStore = useDisplayStore()
const errorStore = useErrorStore()

// Local error state specific to this component
const localError = ref<string | null>(null)

// Computed properties for state
const loading = computed(() => artStore.loading)

// Get the last error from errorStore
const lastError = computed(() => errorStore.getError)

// Save the prompt when the input changes
const savePrompt = () => {
  promptStore.savePromptField()
}

// Computed property for generated art and its images
const generatedArtWithImages = computed(() => {
  return artStore.generatedArt.map((art) => {
    const artImage = artStore.getArtImagesById(art.id)[0] // Get the first image or handle accordingly
    return {
      art,
      artImage
    }
  })
})

// Generate art based on the prompt
const generateArt = async () => {
  // Clear any previous local error before generating new art
  localError.value = null
  displayStore.toggleRandomAnimation()

  // Validate the prompt string before proceeding
  if (!artStore.validatePromptString(promptStore.promptField)) {
    localError.value = 'Invalid characters in prompt.'
    errorStore.addError(ErrorType.VALIDATION_ERROR, localError.value) // Log error
    return
  }

  // Attempt to generate art and catch any errors
  try {
    const result = await artStore.generateArt()

    // Stop animation when generation is complete
    displayStore.stopAnimation()

    if (!result.success) {
      localError.value = result.message || 'Unknown error occurred.'
      errorStore.addError(ErrorType.GENERAL_ERROR, localError.value) // Log error
    }
  } catch (error) {
    displayStore.stopAnimation()
    localError.value =
      error instanceof Error ? error.message : 'Failed to generate art.'
    errorStore.addError(ErrorType.NETWORK_ERROR, localError.value) // Log error
  }
}

// Initialize the artStore and promptStore when the component is mounted
onMounted(async () => {
  await artStore.initialize()
  await promptStore.initialize()
})
</script>
