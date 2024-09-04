<!-- eslint-disable vue/html-self-closing -->
<template>
  <div class="bg-base-200 rounded-2xl p-8 text-lg">
    <h1 class="text-2xl mb-4">Art-Generator</h1>
    Enter your Art Prompt. We will automatically begin with the pitch:
    <div class="font-bold">
      {{ pitch }}
    </div>

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
      :disabled="isLoading"
      class="bg-primary rounded-2xl p-2 text-white mt-4 w-full hover:bg-primary-dark"
      @click="generateArt"
    >
      Generate Art for Pitch
    </button>

    Active Prompt
    <h1>{{ activePrompt }}</h1>

    <!-- Loading State -->
    <div v-if="isLoading" class="mt-4 flex flex-col items-center">
      <p>{{ loadingMessage }}</p>
      <div class="loader flex justify-center mt-2">
        <ami-butterfly />
      </div>
    </div>

    <!-- Add this line where you want to display the milestone-check -->
    <milestone-reward v-if="shouldShowMilestoneCheck" :id="11" />

    <!-- Display Created Art -->
    <div v-for="art in createdArts" :key="art.id" class="mt-4">
      <art-card :art="art" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDreamStore } from './../../../stores/dreamStore'
import { useErrorStore, ErrorType } from './../../../stores/errorStore'
import { useUserStore } from './../../../stores/userStore'
import { useLoadStore } from './../../../stores/loadStore'
import { usePitchStore } from './../../../stores/pitchStore'
import { useGalleryStore } from './../../../stores/galleryStore'
import { usePromptStore } from './../../../stores/promptStore'
import type { Art } from './../../../stores/artStore'

// Load stores
const dreamStore = useDreamStore()
const userStore = useUserStore()
const loadStore = useLoadStore()
const pitchStore = usePitchStore()
const galleryStore = useGalleryStore()
const promptStore = usePromptStore()
const errorStore = useErrorStore()

// Computed properties from stores
const currentPitch = computed(() => pitchStore.selectedPitch)
const pitch = computed(() => pitchStore.selectedPitch?.pitch || '')
const galleryName = computed(
  () => galleryStore.currentGallery?.name || 'cafefred',
)
const galleryId = computed(() => galleryStore.currentGallery?.id || 21)
const activePrompt = computed(() => promptStore.activePrompt?.prompt)
const flavorText = ref('')
const username = computed(() => userStore.username)
const userId = computed(() => userStore.userId)
const promptString = ref('')

const isLoading = ref(false)
const createdArts = ref<Art[]>([]) // Array to store created art
const loadingMessage = ref<string | null>(null)
const shouldShowMilestoneCheck = ref(false)

// Function to get a loading message
const getLoadingMessage = () => {
  loadingMessage.value = loadStore.randomLoadMessage()
}

// Function to set a random prompt
const setRandomPrompt = () => {
  const random = dreamStore.randomDream()
  if (random) {
    promptString.value = random
  }
}

// Initialize prompt with random value
setRandomPrompt()

const generateArt = async () => {
  getLoadingMessage()
  isLoading.value = true
  try {
    const response = await fetch('/api/art/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        promptString: `${pitch.value}, ${promptString.value}, ${flavorText.value}`,
        username: username.value,
        galleryName: galleryName.value,
        galleryId: galleryId.value,
        pitchId: currentPitch.value?.id,
        title: currentPitch.value?.title,
        isMature: false, // Assume default, can be set if required
        isPublic: true, // Assume default, can be set if required
        flavorText: flavorText.value,
        userId: userId.value,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      createdArts.value.unshift(data.newArt as Art)
      shouldShowMilestoneCheck.value = true
      console.log('Art generated:', createdArts)
    } else {
      const errorText = await response.text()
      errorStore.setError(ErrorType.NETWORK_ERROR, errorText)
      console.error('Failed to generate art:', errorText)
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    errorStore.setError(ErrorType.UNKNOWN_ERROR, errorMsg)
    console.error('Error generating art:', errorMsg)
  } finally {
    isLoading.value = false
  }
}
</script>
