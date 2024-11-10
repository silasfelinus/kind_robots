<template>
  <div class="bg-base-300 rounded-2xl p-8 text-lg">
    <h1 class="text-2xl mb-4">Art-Generator</h1>
    <p>Enter your Art Prompt. We will automatically begin with the pitch:</p>
    <div class="font-bold">{{ pitch }}</div>

    <!-- Prompt Input -->
    <div class="mt-4">
      <input
        v-model="promptString"
        placeholder="Enter your art prompt"
        class="rounded-2xl p-2 w-full text-lg"
      />
    </div>

    <!-- Generate Art Button -->
    <button
      :disabled="isLoading || !promptString"
      class="bg-primary rounded-2xl p-2 text-white mt-4 w-full hover:bg-primary-dark"
      @click="generateArt"
    >
      {{ isLoading ? 'Generating...' : 'Generate Art for Pitch' }}
    </button>

    <p>
      Active Prompt: <span class="font-bold">{{ activePrompt }}</span>
    </p>

    <!-- Loading State -->
    <div v-if="isLoading" class="mt-4 flex flex-col items-center">
      <p>{{ loadingMessage }}</p>
      <div class="loader flex justify-center mt-2">
        <ami-butterfly />
      </div>
    </div>

    <!-- Milestone Reward Check -->
    <award-milestone v-if="shouldShowMilestoneCheck" :id="11" />

    <!-- Display Created Art -->
    <div v-for="(art, index) in createdArts" :key="index" class="mt-4">
      <art-card :art="art" />
    </div>

    <!-- Error Message -->
    <p v-if="errorMessage" class="text-red-500 mt-4">{{ errorMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useArtStore } from './../../../stores/artStore'
import { useErrorStore, ErrorType } from './../../../stores/errorStore'
import { useUserStore } from './../../../stores/userStore'
import { useLoadStore } from './../../../stores/loadStore'
import { usePitchStore } from './../../../stores/pitchStore'
import { useGalleryStore } from './../../../stores/galleryStore'
import { usePromptStore } from './../../../stores/promptStore'

// Load stores
const artStore = useArtStore()
const errorStore = useErrorStore()
const userStore = useUserStore()
const loadStore = useLoadStore()
const pitchStore = usePitchStore()
const galleryStore = useGalleryStore()
const promptStore = usePromptStore()

// Computed properties from stores
const currentPitch = computed(() => pitchStore.selectedPitch)
const pitch = computed(() => currentPitch.value?.pitch || '')
const galleryId = computed(() => galleryStore.currentGallery?.id || 21)
const activePrompt = computed(() => promptStore.selectedPrompt?.prompt)
const userId = computed(() => userStore.userId)

// Reactive state
const promptString = ref('')
const flavorText = ref('')
const isLoading = ref(false)
const createdArts = computed(() => artStore.generatedArt) // Fetch generated art from the store
const loadingMessage = ref<string | null>(null)
const shouldShowMilestoneCheck = ref(false)
const errorMessage = ref<string | null>(null)

// Function to set a random prompt
const setRandomPrompt = () => {
  const random = promptStore.finalPromptString // Replace with correct method
  if (random) {
    promptString.value = random
  }
}

// Initialize prompt with random value
setRandomPrompt()

// Get a loading message
const getLoadingMessage = () => {
  loadingMessage.value = loadStore.randomLoadMessage()
}

// Function to generate art using the artStore
const generateArt = async () => {
  if (!promptString.value) return

  getLoadingMessage()
  isLoading.value = true
  errorMessage.value = null

  try {
    // Prepare the art generation data
    const generateArtData = {
      promptString: `${pitch.value}, ${promptString.value}, ${flavorText.value}`,
      userId: userId.value,
      pitchId: currentPitch.value?.id,
      galleryId: galleryId.value,
      title: currentPitch.value?.title || '', // Ensure no null value
      isMature: false,
      isPublic: true,
    }

    // Use the artStore to generate art
    const response = await artStore.generateArt(generateArtData)

    if (response.success && response.newArt) {
      shouldShowMilestoneCheck.value = true
      console.log('Art generated successfully:', response.newArt)
    } else {
      errorStore.setError(
        ErrorType.NETWORK_ERROR,
        response.message || 'Failed to generate art.',
      )
      errorMessage.value = 'Failed to generate art. Please try again.'
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    errorStore.setError(ErrorType.UNKNOWN_ERROR, errorMsg)
    errorMessage.value = 'An unexpected error occurred. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>
