
<template>
  <div
    class="bg-base-300 shadow-xl rounded-3xl border overflow-y-auto border-base-200 z-10 p-6 text-lg max-w-xl mx-auto transform transition-all duration-300 hover:scale-105"
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
      :class="isGenerating ? 'bg-secondary text-white' : 'bg-primary text-white'"
      class="font-semibold rounded-3xl p-4 w-full transition-all duration-300 ease-in-out hover:bg-info hover:shadow-lg active:bg-secondary focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed"
      :disabled="isGenerating || !promptStore.promptField"
      @click="generateArt"
    >
      <span v-if="isGenerating">🖌️ Making Art... <award-milestone :id="11" /></span>
      <span v-else>🖌️ Create Art</span>
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

// States and computed properties
const localError = ref<string | null>(null)
const isGenerating = ref(false) // Tracks if art generation is in progress
const loading = computed(() => artStore.loading)
const lastError = computed(() => errorStore.getError)

const savePrompt = () => {
  promptStore.savePromptField()
}

// Fetch the "Generated Art" collection and its art
const generatedArtCollection = computed(() =>
  artStore.collections.find((c) => c.label === 'Generated Art')
)

const generatedArt = computed(() =>
  generatedArtCollection.value ? generatedArtCollection.value.art : []
)

const generateArt = async () => {
  localError.value = null
  isGenerating.value = true // Mark art generation as in progress
  displayStore.toggleRandomAnimation()

  console.log('Generating art with prompt:', promptStore.promptField)

  if (!artStore.validatePromptString(promptStore.promptField)) {
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
  await artStore.fetchCollections()
  console.log('ArtStore and PromptStore initialized')
})
</script>

<template>
  <div
    class="bg-base-300 shadow-xl rounded-3xl border overflow-y-auto border-base-200 z-10 p-6 text-lg max-w-xl mx-auto transform transition-all duration-300 hover:scale-105"
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
      :class="isGenerating ? 'bg-secondary text-white' : 'bg-primary text-white'"
      class="font-semibold rounded-3xl p-4 w-full transition-all duration-300 ease-in-out hover:bg-info hover:shadow-lg active:bg-secondary focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed"
      :disabled="isGenerating || !promptStore.promptField"
      @click="generateArt"
    >
      <span v-if="isGenerating">🖌️ Making Art... <award-milestone :id="11" /></span>
      <span v-else>🖌️ Create Art</span>
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
  </div>
</template>
