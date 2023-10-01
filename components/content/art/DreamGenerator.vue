<template>
  <div class="bg-base-200 rounded-2xl p-8 text-lg">
    <h1 class="text-2xl mb-4">Art-Maker</h1>

    <!-- Select Pitch -->
    <pitch-selector @selected-pitch="updateSelectedPitch($event)" />

    <!-- Random Dream as Prompt -->
    <div class="mt-4">
      <button class="bg-accent rounded-2xl p-2 text-white" @click="getRandomDream">
        Get Random Dream
      </button>
      <p v-if="randomDream">{{ randomDream }}</p>
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
      Generate Art
    </button>

    <!-- Loading State -->
    <div v-if="isLoading" class="mt-4">
      <p>Loading...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDreamStore } from '@/stores/dreamStore'
import { useTagStore } from '@/stores/tagStore'
import { useArtStore } from '@/stores/artStore'
import { errorHandler } from '@/server/api/utils/error' // Import your errorHandler

const prompt = ref('')
const isLoading = ref(false)
const dreamStore = useDreamStore()
const tagStore = useTagStore()
const selectedPitch = ref('')
const randomDream = ref<string | null>(null)
const artStore = useArtStore()
const newArt = ref<{ id: number; path: string; pitch: string; prompt: string } | null>(null)
// New ref for custom pitch
const customPitch = ref('')

const getRandomDream = () => {
  randomDream.value = dreamStore.randomDream()
  prompt.value = randomDream.value
}

const updateSelectedPitch = (newPitch: string) => {
  selectedPitch.value = newPitch
}

const availablePitches = tagStore.getPitchTitles()

const generateArt = async () => {
  isLoading.value = true
  try {
    const response = await fetch('https://kindrobots.org/api/art/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt.value,
        username: 'silasfelinus',
        galleryName: 'cafefred',
        pitch: selectedPitch.value
      })
    })

    if (response.ok) {
      const data = await response.json()
      newArt.value = data.newArt
      console.log('Art generated:', data)
    } else {
      const errorText = await response.text()
      const handledError = errorHandler(new Error(errorText))
      console.error('Failed to generate dream:', handledError.message)
    }
  } catch (error: any) {
    const handledError = errorHandler(error)
    console.error('Error generating art:', handledError.message)
  } finally {
    isLoading.value = false
  }
}

// Initialize tags when the component is mounted
onMounted(async () => {
  await tagStore.initializeTags()
})
</script>
