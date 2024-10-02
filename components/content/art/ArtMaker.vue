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
      class="bg-primary text-white font-semibold rounded-3xl p-4 w-full transition-all duration-300 ease-in-out hover:bg-info hover:shadow-lg active:bg-secondary focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed"
      :disabled="loading || !promptStore.promptField"
      @click="generateArt"
    >
      <span v-if="loading">🖌️ Making Art...</span>
      <span v-else>🖌️ Create Art</span>
    </button>

    <!-- Error Message -->
    <p v-if="error" class="text-red-500 mt-4 text-center font-medium">
      {{ error }}
    </p>

    <!-- Generated Art Display -->
    <div v-if="art && !loading" class="mt-8">
      <ArtCard :art="art" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { usePromptStore } from '@/stores/promptStore'
import { useErrorStore, ErrorType } from '@/stores/errorStore'
import ArtCard from './ArtCard.vue' // Import the reusable ArtCard component

// Access the artStore, promptStore, errorStore, and userStore
const artStore = useArtStore()
const promptStore = usePromptStore()
const errorStore = useErrorStore()

// Computed properties for state
const loading = computed(() => artStore.loading)
const art = computed(() => artStore.currentArt)
const error = computed(() => errorStore.getError || '')

// Save the prompt when the input changes
const savePrompt = () => {
  promptStore.savePromptField()
}

// Generate art based on the prompt
const generateArt = async () => {
  // Clear any previous error before generating new art
  errorStore.clearError()

  // Validate the prompt string before proceeding
  if (!artStore.validatePromptString(promptStore.promptField)) {
    errorStore.setError(
      ErrorType.VALIDATION_ERROR,
      'Invalid characters in prompt.',
    )
    return
  }

  // Generate the art and handle any errors
  await errorStore.handleError(
    async () => {
      const result = await artStore.generateArt()

      if (!result.success) {
        throw new Error(result.message || 'Unknown error occurred.')
      }
    },
    ErrorType.GENERAL_ERROR,
    'Failed to generate art.',
  )
}

// Initialize the artStore and promptStore when the component is mounted
onMounted(async () => {
  await artStore.initialize()
  await promptStore.initialize()
})
</script>
