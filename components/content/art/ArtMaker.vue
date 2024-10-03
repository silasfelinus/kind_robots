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

    <!-- Logs -->
    <div class="mt-4 p-4 bg-gray-100 rounded">
      <h2 class="text-lg font-semibold">Live Logs:</h2>
      <ul class="text-sm text-gray-700">
        <li v-for="log in logs" :key="log" class="mb-1">{{ log }}</li>
      </ul>
    </div>

    <!-- Generated Art Display -->
    <div v-if="generatedArtWithImages.length > 0" class="mt-8">
      <div
        v-for="item in generatedArtWithImages"
        :key="item.art.id"
        class="mb-6"
      >
        <ArtCard :art="item.art" :image-data="item.artImage" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { usePromptStore } from '@/stores/promptStore'
import { useDisplayStore } from '@/stores/displayStore'
import { useErrorStore, ErrorType } from '@/stores/errorStore'
import ArtCard from './ArtCard.vue' 

const artStore = useArtStore()
const promptStore = usePromptStore()
const displayStore = useDisplayStore()
const errorStore = useErrorStore()

const localError = ref<string | null>(null)
const logs = ref<string[]>([])  // Store for logs
const originalConsoleLog = console.log // Save original console.log function

// Hijack the console.log function
console.log = function(...args) {
  originalConsoleLog.apply(console, args) // Still call original log
  logs.value.push(args.join(' ')) // Add the log to the UI logs
}

// Watch for log overflow and trim if necessary
watch(logs, (newLogs) => {
  if (newLogs.length > 20) {
    logs.value = logs.value.slice(-20) // Keep only the last 20 logs
  }
})

const loading = computed(() => artStore.loading)
const lastError = computed(() => errorStore.getError)

const savePrompt = () => {
  promptStore.savePromptField()
}

const generatedArtWithImages = computed(() => {
  return artStore.generatedArt.map((art) => {
    const artImage = artStore.getArtImagesById(art.id)[0] 
    return {
      art,
      artImage,
    }
  })
})

const generateArt = async () => {
  localError.value = null
  displayStore.toggleRandomAnimation()

  console.log('Generating art with prompt:', promptStore.promptField)

  if (!artStore.validatePromptString(promptStore.promptField)) {
    localError.value = 'Invalid characters in prompt.'
    errorStore.addError(ErrorType.VALIDATION_ERROR, localError.value)
    console.log('Error:', localError.value)
    return
  }

  try {
    const result = await artStore.generateArt()
    console.log('Art generated result:', result)

    displayStore.stopAnimation()

    if (!result.success) {
      localError.value = result.message || 'Unknown error occurred.'
      errorStore.addError(ErrorType.GENERAL_ERROR, localError.value)
      console.log('Error:', localError.value)
    }
  } catch (error) {
    displayStore.stopAnimation()
    localError.value =
      error instanceof Error ? error.message : 'Failed to generate art.'
    errorStore.addError(ErrorType.NETWORK_ERROR, localError.value)
    console.log('Error:', localError.value)
  }
}

onMounted(async () => {
  await artStore.initialize()
  await promptStore.initialize()
  console.log('ArtStore and PromptStore initialized')
})
</script>
