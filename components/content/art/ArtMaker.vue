<template>
  <div class="bg-base-300 rounded-2xl border p-6 text-lg max-w-lg mx-auto">
    <h1 class="text-2xl m-4 text-center">🎨 Welcome to the Art-Maker</h1>

    <!-- Prompt Input -->
    <div class="mb-4">
      <input
        v-model="promptStore.promptField"
        placeholder="Enter your creative prompt..."
        class="rounded-2xl p-3 w-full text-lg bg-base-200 placeholder-gray-500"
        :disabled="loading"
        @input="savePrompt"
      />
    </div>

    <!-- Generate Art Button -->
<button
  class="bg-primary text-white rounded-2xl p-3 w-full transition-colors duration-300 ease-in-out 
         hover:bg-info active:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark disabled:bg-gray-400"
  :disabled="loading || !promptStore.promptField"
  @click="generateArt"
>
  <span v-if="loading">🖌️ Making Art...</span>
  <span v-else>🖌️ Create Art</span>
</button>

    <!-- Error Message -->
    <p v-if="error" class="text-red-500 mt-4">{{ error }}</p>

    <!-- Generated Art Display -->
    <div v-if="art && !loading" class="mt-8">
      <ArtCard :art="art" />
    </div>

    <!-- User's Collected Art Display -->
    <div v-if="collectedArt.length > 0" class="mt-8">
      <h2 class="text-xl text-center mb-4">🖼️ Your Art Collection</h2>
      <div class="grid grid-cols-1 gap-4">
        <ArtCard
          v-for="artItem in collectedArt"
          :key="artItem.id"
          :art="artItem"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { usePromptStore } from '@/stores/promptStore'
import { useErrorStore, ErrorType } from '@/stores/errorStore'
import ArtCard from './ArtCard.vue' // Import the reusable ArtCard component

// Access the artStore, promptStore, and errorStore
const artStore = useArtStore()
const promptStore = usePromptStore()
const errorStore = useErrorStore()

// Computed properties for state
const loading = computed(() => artStore.loading)
const art = computed(() => artStore.currentArt)
const error = computed(() => errorStore.getError)
const collectedArt = computed(() => artStore.collectedArt)

// Save the prompt when the input changes
const savePrompt = () => {
  promptStore.savePromptField()
}

// Validate the prompt string for invalid characters or patterns
const validatePromptString = (prompt: string): boolean => {
  // Simple validation: Ensure the prompt is not empty and doesn't contain special characters.
  const validPattern = /^[a-zA-Z0-9 ,]+$/; // Adjust the pattern as necessary
  return validPattern.test(prompt);
}

// Generate art based on the prompt
const generateArt = async () => {
  const pitch = extractPitch(promptStore.promptField);
  
  // Log the prompt and pitch for debugging
  console.log("Generating art with prompt:", promptStore.promptField);
  console.log("Using pitch:", pitch);

  // Validate the prompt before proceeding
  if (!validatePromptString(promptStore.promptField)) {
    console.error("Invalid prompt string:", promptStore.promptField);
    errorStore.setError(ErrorType.VALIDATION_ERROR, "Invalid characters in prompt.");
    return;
  }

  await errorStore.handleError(
    async () => {
      const result = await artStore.generateArt({
        promptString: promptStore.promptField,
        pitch: pitch, // Include pitch
        userId: 10, // Example user ID
      });

      if (!result.success) {
        throw new Error(result.message || 'Unknown error occurred.');
      }
    },
    ErrorType.GENERAL_ERROR,
    'Failed to generate art.',
  );
}

// Initialize the artStore and promptStore when the component is mounted
onMounted(async () => {
  const userId = 10 // Example user ID
  await artStore.initialize(userId)
  await promptStore.initialize()
})
</script>
