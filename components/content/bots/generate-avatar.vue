<template>
  <div class="w-full max-w-2xl mx-auto mb-6 flex flex-col items-center space-y-4">
    <!-- Avatar Image URL Input -->
    <label for="avatarImageInput" class="block text-sm font-medium">
      Avatar Image (URL):
    </label>
    <input
      id="avatarImageInput"
      v-model="avatarImage"
      type="text"
      class="w-full p-2 rounded-lg border mb-2"
      placeholder="Enter a custom avatar image URL"
    />

    <image-upload />

    <!-- Avatar Preview with tighter spacing and centered focus -->
    <div class="mt-4 flex flex-col items-center space-y-2">
      <img
        :src="avatarImage || defaultAvatar"
        alt="Avatar Preview"
        class="w-40 h-40 object-cover rounded-full shadow-lg border-2 border-gray-300"
      />
      <p class="text-sm text-gray-500">Preview your avatar</p>
    </div>

    <gallery-selector />

    <!-- Display the uploaded image as an ArtCard for confirmation -->
    <div v-if="newArt" class="mt-6">
      <art-card :art="newArt" />
    </div>

    <!-- Generate Random Avatar Button -->
    <button
      class="btn btn-primary w-full sm:w-auto px-4 py-2 rounded-lg shadow-md"
      :disabled="isLoading"
      @click="generateRandomAvatar"
    >
      <span v-if="isLoading">Generating...</span>
      <span v-else>Generate Random Avatar</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useGalleryStore } from './../../../stores/galleryStore'
import { useBotStore } from './../../../stores/botStore'
import { useArtStore } from './../../../stores/artStore'
import { useErrorStore, ErrorType } from './../../../stores/errorStore'

const galleryStore = useGalleryStore()
const botStore = useBotStore()
const artStore = useArtStore()
const errorStore = useErrorStore()

const isLoading = ref(false)
const defaultAvatar = '/images/wonderchest/wonderchest-1630.webp'
const newArt = ref(null)

// Bind avatarImage to currentImagePath from botStore
const avatarImage = computed({
  get() {
    return botStore.currentImagePath || defaultAvatar
  },
  set(newValue) {
    botStore.currentImagePath = newValue
  },
})

// Function to generate a random avatar from the current gallery
async function generateRandomAvatar() {
  try {
    if (!galleryStore.currentGallery) {
      throw new Error('Please select a gallery first.')
    }

    isLoading.value = true
    await galleryStore.changeToRandomImage()

    if (galleryStore.currentImage) {
      avatarImage.value = galleryStore.currentImage
    } else {
      throw new Error('Failed to fetch a random avatar image.')
    }
  } catch (error) {
    errorStore.setError(ErrorType.GENERAL_ERROR, 'Error generating or fetching avatar: ' + error)
  } finally {
    isLoading.value = false
  }
}

// Handle the uploaded image and create an Art object
async function uploadImage(event: Event) {
  const input = event.target as HTMLInputElement
  const uploadedFile = input?.files?.[0]

  if (uploadedFile) {
    const formData = new FormData()
    formData.append('image', uploadedFile)

    try {
      const art = await artStore.uploadImage(formData)
      newArt.value = art
    } catch (error) {
      console.error('Error uploading image:', error)
    }
  }
}

// Load initial gallery data
onMounted(async () => {
  await galleryStore.initializeStore()
})
</script>