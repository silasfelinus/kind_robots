<!-- eslint-disable vue/html-self-closing -->
<template>
  <div class="bg-base-300 rounded-2xl p-8 text-lg">
    <h1 class="text-2xl mb-4">Dream-Generator</h1>

    <!-- Random Dream as Prompt -->
    <div class="mt-4">
      <button
        class="bg-accent rounded-2xl p-2 text-white"
        @click="getRandomDream"
      >
        Get Random Dream
      </button>
      <p v-if="randomDream" class="mt-2">
        {{ randomDream }}
      </p>
    </div>

    <!-- Prompt Input -->
    <div class="mt-4">
      <input
        v-model="prompt"
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
      Generate Dream
    </button>

    <!-- Loading State -->
    <div v-if="isLoading" class="mt-4 flex flex-col items-center">
      <p>{{ loadingMessage }}</p>
      <div class="loader flex justify-center mt-2">
        <ami-butterfly />
      </div>
    </div>

    <!-- Milestone Reward -->
    <award-milestone v-if="shouldShowMilestoneCheck" :id="11" />

    <!-- Display Created Art -->
    <div v-for="art in createdArts" :key="art.id" class="mt-4">
      <art-card :art="art" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDreamStore } from './../../../stores/dreamStore'
import { useErrorStore } from './../../../stores/errorStore'
import { useUserStore } from './../../../stores/userStore'
import { useLoadStore } from './../../../stores/loadStore'
import type { Art } from './../../../stores/artStore'

// Load stores
const dreamStore = useDreamStore()
const userStore = useUserStore()
const loadStore = useLoadStore()
const errorStore = useErrorStore()

const shouldShowMilestoneCheck = ref(false)
const prompt = ref('')
const flavorText = ref('')
const username = computed(() => userStore.username)
const userId = computed(() => userStore.userId)

const isLoading = ref(false)
const createdArts = ref<Art[]>([]) // Array to store created art
const randomDream = ref<string | null>(null)
const loadingMessage = ref<string | null>(null)

// Function to get a loading message
const getLoadingMessage = () => {
  loadingMessage.value = loadStore.randomLoadMessage()
}

// Function to get a random dream and set it as prompt
const getRandomDream = () => {
  randomDream.value = dreamStore.randomDream()
  prompt.value = randomDream.value || ''
}

// Function to generate art
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
        prompt: prompt.value,
        userName: username.value,
        galleryName: 'cafefred',
        pitchId: 6, // Ensure this ID is valid
        title: 'dreamscapes',
        isMature: false,
        isPublic: true,
        isOrphan: true,
        flavorText: flavorText.value,
        userId: userId.value,
        galleryId: 21,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      createdArts.value.unshift(data.newArt as Art)
      shouldShowMilestoneCheck.value = true
      console.log('Art generated:', createdArts.value)
    } else {
      const errorText = await response.text()
      errorStore.setError(ErrorType.UNKNOWN_ERROR, errorText) // Adjusted to pass type and message separately
      console.error('Failed to generate dream:', errorText)
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    errorStore.setError(ErrorType.UNKNOWN_ERROR, errorMsg) // Adjusted to pass type and message separately
    console.error('Error generating art:', errorMsg)
  } finally {
    isLoading.value = false
  }
}
</script>
