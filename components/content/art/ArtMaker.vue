<template>
  <div class="bg-base-300 rounded-2xl border p-6 text-lg max-w-lg mx-auto">
    <h1 class="text-2xl mb-4 text-center">🎨 Welcome to the Art-Maker</h1>

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
      class="bg-primary rounded-2xl p-3 text-white w-full hover:bg-primary-dark disabled:bg-gray-400"
      :disabled="loading || !promptStore.promptField"
      @click="generateArt"
    >
      <span v-if="loading">🖌️ Making Art...</span>
      <span v-else>🖌️ Create Art</span>
    </button>

    <!-- Error Message -->
    <p v-if="error" class="text-red-500 mt-4">{{ error }}</p>

    <!-- Generated Art Display -->
    <div v-if="art && !loading" class="mt-8 relative">
      <img
        :src="art?.path || ''"
        alt="Generated Art"
        class="rounded-lg shadow-lg w-full"
      />

      <!-- Overlay to show art details -->
      <div
        v-if="showInfo"
        class="absolute inset-0 bg-black bg-opacity-50 flex flex-col justify-center items-center text-white p-4 rounded-lg"
      >
        <p><strong>Designer:</strong> {{ art?.designer }}</p>
        <p><strong>Prompt:</strong> {{ art?.promptString }}</p>
        <p><strong>Steps:</strong> {{ art?.steps }}</p>
        <p><strong>Seed:</strong> {{ art?.seed }}</p>
        <p><strong>CFG:</strong> {{ art?.cfg }}</p>
      </div>

      <!-- Toggle Info Button -->
      <button
        class="mt-4 bg-secondary rounded-2xl p-2 text-white w-full hover:bg-secondary-dark"
        @click="toggleInfo"
      >
        {{ showInfo ? 'Hide' : 'Show' }} Art Details
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { usePromptStore } from '@/stores/promptStore'

// Local state
const showInfo = ref(false)

// Access the artStore and promptStore
const artStore = useArtStore()
const promptStore = usePromptStore()

// Computed properties for state
const loading = computed(() => artStore.loading)
const art = computed(() => artStore.currentArt)
const error = computed(() => artStore.error)

// Save the prompt when the input changes
const savePrompt = () => {
  promptStore.savePromptField()
}

// Extract pitch (first part before the comma)
const extractPitch = (promptString: string) => {
  const pitch = promptString.split(',')[0].trim()
  return pitch || 'Untitled Pitch'
}

// Generate art based on the prompt
const generateArt = async () => {
  const pitch = extractPitch(promptStore.promptField) // Extract pitch from prompt
  await artStore.generateArt({
    promptString: promptStore.promptField,
    pitch: pitch, // Include pitch
    userId: 10, // Example user ID
  })
}

// Toggle art details visibility
const toggleInfo = () => {
  showInfo.value = !showInfo.value
}

// Initialize the prompt store when the component is mounted
onMounted(async () => {
  await promptStore.initialize()
})
</script>
