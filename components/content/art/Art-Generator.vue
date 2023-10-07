<template>
  <div class="bg-base-200 rounded-2xl p-8 text-lg">
    <h1 class="text-2xl mb-4">Art-Maker</h1>

    <!-- Random Prompt -->
    <div class="mt-4">
      <button class="bg-accent rounded-2xl p-2 text-white" @click="getRandomDream">
        Generate Prompt Help
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
      Generate Dream
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
import { useArtStore } from '@/stores/artStore'
import { errorHandler } from '@/server/api/utils/error'
import { usePitchStore } from '@/stores/pitchStore'
import { useUserStore } from '@/stores/userStore'
import { useChannelStore } from '@/stores/channelStore'

// Load stores
const dreamStore = useDreamStore()
const userStore = useUserStore()
const pitchStore = usePitchStore()
const artStore = useArtStore()
const channelStore = useChannelStore()

// Art Prompt text
const title = ref('')
const prompt = ref('')
const description = ref('')
const flavorText = ref('')
const designerName = ref('')
const channelName = computed(() => channelStore.currentChannel?.label)
const userName = computed(() => userStore.username)
const pitchName = computed(() => pitchStore.selectedPitch?.pitch)
const galleryName = 'cafefred'
const isMature = ref(false)
const isPublic = ref(true)
const isOrphan = ref(false)

// Art Prompt Ids
const userId = computed(() => userStore.userId)
const galleryId = 21
const pitchId = computed(() => pitchStore.selectedPitch?.id)
const channelId = computed(() => channelStore.currentChannel?.id)
const promptId = computed(() => userStore.username)

const isLoading = ref(false)
const selectedPitch = computed(() => pitchStore.selectedPitch)
const randomDream = ref<string | null>(null)

const newArt = ref<{
  title?: string
  prompt: string
  description?: string
  flavorText?: string
  userId?: number
  galleryId?: number
  pitchId?: number
  channelId?: number
  promptId?: number
  designerName?: string
  channelName?: string
  userName?: string
  pitchName?: string
  galleryName: string
  isMature?: boolean
  isPublic?: boolean
  isOrphan?: boolean
} | null>(null)

const getRandomDream = () => {
  randomDream.value = dreamStore.randomDream()
  prompt.value = randomDream.value
}

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
        pitchName: selectedPitch.value,
        pitchId: 6
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
</script>
