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

    <!-- Local Error Message -->
    <p v-if="localError" class="text-red-500 mt-4 text-center font-medium">
      {{ localError }}
    </p>

    <!-- Generated Art Display -->
    <div v-if="localArt && !loading" class="mt-8">
      <ArtCard :art="localArt" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { usePromptStore } from '@/stores/promptStore'
import { useDisplayStore } from '@/stores/displayStore'
import ArtCard from './ArtCard.vue' // Import the reusable ArtCard component

// Access the artStore and promptStore
const artStore = useArtStore()
const promptStore = usePromptStore()
const displayStore = useDisplayStore()

// Local error state specific to this component
const localError = ref<string | null>(null)

// Local state for storing the generated art
const localArt = ref(null)

// Computed properties for state
const loading = computed(() => artStore.loading)

// Save the prompt when the input changes
const savePrompt = () => {
  promptStore.savePromptField()
}

// Generate art based on the prompt
const generateArt = async () => {
  // Clear any previous local error before generating new art
  localError.value = null
  const localArt = ref<Art | null>(null)
  displayStore.toggleRandomAnimation()

  // Validate the prompt string before proceeding
  if (!artStore.validatePromptString(promptStore.promptField)) {
    localError.value = 'Invalid characters in prompt.'
    return
  }

  // Attempt to generate art and catch any errors
  try {
    const result = await artStore.generateArt()

    // Stop animation when generation is complete
    displayStore.stopAnimation()

    if (result.success && result.newArt) {
      // Populate localArt with the generated art result
      localArt.value = result.newArt
    } else {
      localError.value = result.message || 'Unknown error occurred.'
    }
  } catch (error) {
    displayStore.stopAnimation()
    localError.value =
      error instanceof Error ? error.message : 'Failed to generate art.'
  }
}

// Initialize the artStore and promptStore when the component is mounted
onMounted(async () => {
  await artStore.initialize()
  await promptStore.initialize()
})
</script>
