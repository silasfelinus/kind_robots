<template>
  <div class="w-full max-w-4xl mx-auto mb-6 flex flex-col items-center">
    <!-- Avatar Image URL Input -->
    <label for="avatarImageInput" class="block text-sm font-medium mb-2">Avatar Image (URL):</label>
    <input
      id="avatarImageInput"
      v-model="avatarImage"
      type="text"
      class="w-full p-2 rounded border mb-4"
      placeholder="Enter a custom avatar image URL"
    />

<image-upload />
    
    <!-- Avatar Preview -->
    <div class="mt-2">
      <img
        :src="avatarImage || defaultAvatar"
        alt="Avatar Preview"
        class="w-32 h-32 object-cover mb-4 rounded-full shadow-md"
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

    <!-- Generate Random Avatar Button -->
    <button
      class="btn btn-primary"
      :disabled="isLoading"
      @click="generateRandomAvatar"
    >
      <span v-if="isLoading">Generating...</span>
      <span v-else>Generate Random Avatar</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useGalleryStore } from './../../../stores/galleryStore'
import { useErrorStore, ErrorType } from './../../../stores/errorStore'

const galleryStore = useGalleryStore()
const errorStore = useErrorStore()

const isLoading = ref(false)
const selectedGallery = ref<string | null>(null)
const avatarImage = ref('/images/wonderchest/wonderchest-1630.webp')
const defaultAvatar = '/images/wonderchest/wonderchest-1630.webp'

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
      'Error generating or fetching avatar: ' + error,
    )
  } finally {
    isLoading.value = false
  }
}

// Load initial gallery data
onMounted(async () => {
  await galleryStore.initializeStore()
})
</script>

