<template>
  <div class="bg-base-200 rounded-2xl p-8 text-lg">
    <h1 class="text-2xl mb-4">Art-Generator</h1>
    Enter your Art Prompt. We will automatically begin with the pitch:
    <div class="font-bold">{{ pitch }}</div>
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
      Generate Art for Pitch
    </button>

    <!-- Loading State -->
    <div v-if="isLoading" class="mt-4 flex flex-col items-center">
      <p>{{ loadingMessage }}</p>
      <div class="loader flex justify-center mt-2">
        <ami-butterfly />
      </div>
    </div>
    <!-- Add this line where you want to display the milestone-check -->
    <milestone-reward v-if="shouldShowMilestoneCheck" :id="11"></milestone-reward>

    <!-- Display Created Art -->
    <div v-for="art in createdArts" :key="art.id" class="mt-4">
      <art-card :art="art" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDreamStore } from '@/stores/dreamStore'
import { errorHandler } from '@/server/api/utils/error'
import { useUserStore } from '@/stores/userStore'
import { useLoadStore } from '@/stores/loadStore'
import { useArtStore, Art } from '@/stores/artStore'
import { Pitch, usePitchStore } from '@/stores/pitchStore'

// Load stores
const dreamStore = useDreamStore()
const userStore = useUserStore()
const loadStore = useLoadStore()
const pitchStore = usePitchStore()
const currentPitch = computed(() => pitchStore.selectedPitch)
const shouldShowMilestoneCheck = ref(false)

const pitch = computed(() => pitchStore.selectedPitch?.pitch)
// Art Prompt text
const prompt = ref('')
const flavorText = ref('')
const username = computed(() => userStore.username)

// Art Prompt Ids
const userId = computed(() => userStore.userId)

const isLoading = ref(false)
const createdArts = ref<Art[]>([]) // Array to store created art
const randomDream = ref<string | null>(null)
const loadingMessage = ref<string | null>(null)

const getLoadingMessage = () => {
  loadingMessage.value = loadStore.randomLoadMessage()
}

const getRandomDream = () => {
  randomDream.value = dreamStore.randomDream()
  prompt.value = randomDream.value
}

const generateArt = async () => {
  getLoadingMessage()
  isLoading.value = true
  try {
    const response = await fetch('https://kindrobots.org/api/art/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: pitch.value + ', ' + prompt.value + ', ' + flavorText.value,
        userName: username.value,
        galleryName: 'cafefred',
        pitchId: currentPitch.value?.id,
        title: currentPitch.value?.title,
        isMature: false,
        isPublic: true,
        isOrphan: true,
        flavorText: flavorText.value,
        userId: userId.value,
        galleryId: 21
      })
    })

    if (response.ok) {
      const data = await response.json()
      createdArts.value.unshift(data.newArt as Art)
      shouldShowMilestoneCheck.value = true
      console.log('Art generated:', createdArts)
    } else {
      const errorText = await response.text()
      const handledError = errorHandler(new Error(errorText))
      console.error('Failed to generate art:', handledError.message)
    }
  } catch (error: any) {
    const handledError = errorHandler(error)
    console.error('Error generating art:', handledError.message)
  } finally {
    isLoading.value = false
  }
}
</script>
