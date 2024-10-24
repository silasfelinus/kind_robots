<template>
  <div
    class="w-full max-w-2xl mx-auto mb-6 flex flex-col items-center space-y-4"
  >
    <!-- Avatar Image URL Input -->
    <label for="avatarImageInput" class="block text-sm font-medium"
      >Avatar Image (URL):</label
    >
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
import { useErrorStore, ErrorType } from './../../../stores/errorStore'

const galleryStore = useGalleryStore()
const botStore = useBotStore()
const errorStore = useErrorStore()

const isLoading = ref(false)
const selectedGallery = ref<string | null>(null)
const defaultAvatar = '/images/wonderchest/wonderchest-1630.webp'

// Bind avatarImage to currentImagePath from botStore
const avatarImage = computed({
  get() {
    console.log('Computed avatarImage getter:', botStore.currentImagePath)
    return botStore.currentImagePath || defaultAvatar
  },
  set(newValue) {
    console.log('Computed avatarImage setter:', newValue)
    botStore.currentImagePath = newValue
  },
})

// Function to generate a random avatar from the selected gallery
async function generateRandomAvatar() {
  try {
    console.log('Starting avatar generation...')
    if (!selectedGallery.value) {
      const errorMsg = 'Please select a gallery first.'
      console.error(errorMsg)
      throw new Error(errorMsg)
    }

    isLoading.value = true
    console.log(`Selected gallery: ${selectedGallery.value}`)

    // Set the gallery by name and try to change to a random image
    galleryStore.setGalleryByName(selectedGallery.value)
    console.log('Gallery set. Now fetching random image...')

    await galleryStore.changeToRandomImage()

    // Check if the current image was updated
    if (galleryStore.currentImage) {
      console.log(
        'Random avatar fetched successfully:',
        galleryStore.currentImage,
      )
      avatarImage.value = galleryStore.currentImage
    } else {
      const errorMsg = 'Failed to fetch a random avatar image.'
      console.error(errorMsg)
      throw new Error(errorMsg)
    }
  } catch (error) {
    console.error('Error generating or fetching avatar:', error)
    errorStore.setError(
      ErrorType.GENERAL_ERROR,
      'Error generating or fetching avatar: ' + error,
    )
  } finally {
    isLoading.value = false
    console.log('Avatar generation complete.')
  }
}

// Load initial gallery data
onMounted(async () => {
  await galleryStore.initializeStore()
})
</script>
