<template>
  <div class="rounded-2xl border p-2 m-2 flex flex-col items-center">
    <h1 class="text-3xl mb-4 text-center">Create or Edit a Bot</h1>

    <!-- Bot Selection Dropdown -->
    <div class="w-full max-w-4xl mx-auto mb-6">
      <label for="selectBot" class="block text-sm font-medium">Select Existing Bot:</label>
      <select
        id="selectBot"
        v-model="selectedBotId"
        class="w-full p-2 rounded border"
        @change="loadBotData"
      >
        <option value="" disabled>Select a bot</option>
        <option v-for="bot in botStore.bots" :key="bot.id" :value="bot.id">
          {{ bot.name }}
        </option>
      </select>
    </div>

    <!-- Avatar Image URL and Gallery Selection -->
    <div class="w-full max-w-4xl mx-auto mb-6 flex flex-col items-center">
      <label for="avatarImageInput" class="block text-sm font-medium mb-2">Avatar Image (URL):</label>
      <input
        id="avatarImageInput"
        v-model="avatarImage"
        type="text"
        class="w-full p-2 rounded border mb-4"
        placeholder="Enter a custom avatar image URL"
      />
      <div class="mt-2">
        <img
          :src="avatarImage || '/images/wonderchest/wonderchest-1630.webp'"
          alt="Avatar Preview"
          class="w-32 h-32 object-cover mb-4"
        />
      </div>

      <!-- Gallery Selection Dropdown -->
      <div class="w-full mb-4">
        <label for="selectGallery" class="block text-sm font-medium">Select Gallery:</label>
        <select
          id="selectGallery"
          v-model="selectedGallery"
          class="w-full p-2 rounded border"
        >
          <option value="" disabled>Select a gallery</option>
          <option
            v-for="gallery in galleryStore.galleries"
            :key="gallery.name"
            :value="gallery.name"
          >
            {{ gallery.name }}
          </option>
        </select>
      </div>

      <button
        class="btn btn-primary"
        type="button"
        @click="generateRandomAvatar"
        :disabled="isLoading"
      >
        Generate Random Avatar
      </button>
    </div>

    <!-- Image Prompt and Generation Button -->
    <div class="w-full max-w-4xl mx-auto mb-6">
      <label for="imagePrompt" class="block text-sm font-medium">Avatar Image Prompt:</label>
      <input
        id="imagePrompt"
        v-model="imagePrompt"
        type="text"
        class="w-full p-2 rounded border"
        placeholder="Enter an image prompt to generate the avatar"
      />
    </div>

    <button
      class="btn btn-success w-full mb-4"
      @click="sendImagePromptToGenerator"
      :disabled="isLoading"
    >
      Generate Image
    </button>

    <form
      class="bg-white shadow-lg rounded-lg p-8 w-full max-w-4xl mx-auto"
      @submit.prevent="handleSubmit"
    >
      <div class="flex flex-wrap -mx-2">
        <!-- Name -->
        <div class="px-2 w-full md:w-1/2 mb-4">
          <label for="name" class="block text-sm font-medium">Name:</label>
          <input
            id="name"
            v-model="name"
            type="text"
            class="w-full p-2 rounded border"
            required
          />
        </div>

        <!-- Remaining form fields, subtitle, description, etc. -->
      </div>
      <span v-if="isLoading" class="loading loading-ring loading-lg"></span>
      <button type="submit" class="btn btn-success w-full">Save Bot</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useBotStore } from './../../../stores/botStore'
import { useGalleryStore } from './../../../stores/galleryStore'
import { useErrorStore, ErrorType } from './../../../stores/errorStore'
import { useUserStore } from './../../../stores/userStore'
import { useArtStore } from './../../../stores/artStore' // Import artStore

const botStore = useBotStore()
const galleryStore = useGalleryStore()
const userStore = useUserStore()
const artStore = useArtStore() // Initialize artStore
const errorStore = useErrorStore()

const isLoading = ref(false)
const selectedBotId = ref<number | null>(null)
const selectedGallery = ref<string | null>(null)

// Form fields with default values
const name = ref('')
const avatarImage = ref('/images/wonderchest/wonderchest-1630.webp')
const imagePrompt = ref('')
const userId = computed(() => userStore.userId)

// Load the data of the selected bot into the form fields
function loadBotData() {
  const bot = botStore.bots.find((b) => b.id === selectedBotId.value)
  if (bot) {
    name.value = bot.name || ''
    avatarImage.value = bot.avatarImage || '/images/default-avatar.png'
  } else {
    resetForm()
  }
}

// Reset the form to default values
function resetForm() {
  name.value = ''
  avatarImage.value = '/images/wonderchest/wonderchest-1630.webp'
  imagePrompt.value = ''
}

// Handle form submission
async function handleSubmit(e: Event) {
  e.preventDefault()

  try {
    const botData = {
      name: name.value,
      avatarImage: avatarImage.value ?? '/images/default-avatar.png',
      userId: userId.value,
    }

    const selectedBot = botStore.bots.find((bot) => bot.id === selectedBotId.value)

    if (selectedBot?.userId === userId.value) {
      await botStore.updateBot(selectedBotId.value!, botData)
      console.log('Bot updated successfully!')
    } else {
      await botStore.addBots([botData])
      console.log('New bot created successfully!')
    }
  } catch (error) {
    errorStore.setError(ErrorType.GENERAL_ERROR, 'Error saving bot: ' + error.message)
  }
}

// Send image prompt to art generator store
async function sendImagePromptToGenerator() {
  try {
    isLoading.value = true
    const artData = {
      promptString: imagePrompt.value,
      userId: userId.value,
      galleryId: selectedGallery.value ? parseInt(selectedGallery.value) : undefined,
    }

    const { success, message, newArt } = await artStore.generateArt(artData)

    if (success) {
      console.log('Image generated successfully:', newArt)
    } else {
      console.error('Failed to generate image:', message)
    }
  } catch (error) {
    errorStore.setError(ErrorType.GENERAL_ERROR, 'Error generating image: ' + error.message)
  } finally {
    isLoading.value = false
  }
}

// Function to generate a random avatar from the selected gallery
async function generateRandomAvatar() {
  try {
    if (!selectedGallery.value) {
      throw new Error('Please select a gallery first.')
    }

    isLoading.value = true
    galleryStore.setGalleryByName(selectedGallery.value)
    await galleryStore.changeToRandomImage()

    if (galleryStore.currentImage) {
      avatarImage.value = galleryStore.currentImage
    } else {
      throw new Error('Failed to fetch a random avatar image.')
    }
  } catch (error) {
    errorStore.setError(
      ErrorType.GENERAL_ERROR,
      'Error generating or fetching avatar: ' + error.message,
    )
  } finally {
    isLoading.value = false
  }
}

// Watch for changes in selectedBotId to load bot data
watch(selectedBotId, (newBotId) => {
  if (newBotId) {
    loadBotData()
  }
})

// Run client-side only logic inside onMounted
onMounted(async () => {
  await galleryStore.initializeStore()
  await botStore.loadStore()
})
</script>
