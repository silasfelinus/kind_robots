<template>
  <div class="random-image-container">
    <!-- Display the random image if available -->
    <div v-if="randomImage">
      <img
        :src="randomImage"
        alt="Random Gallery Image"
        class="rounded-lg shadow-lg"
      />
    </div>

    <!-- Display error message if an error occurred -->
    <div v-else-if="errorMessage" class="text-center text-red-500">
      <p>{{ errorMessage }}</p>
    </div>

    <!-- Display a fallback message if no image is available -->
    <div v-else class="text-center text-gray-500">
      <p>No image available.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useGalleryStore } from '@/stores/galleryStore'
import { useErrorStore, ErrorType } from '@/stores/errorStore'

// Initialize the gallery store and error store
const galleryStore = useGalleryStore()
const errorStore = useErrorStore()

// Fetch the random image from the store
const randomImage = computed(() => galleryStore.currentImage)

// State to hold error messages
const errorMessage = ref<string | null>(null)

// Initialize the store when the component mounts
onMounted(async () => {
  try {
    // Use the errorStore to handle any errors while fetching galleries or images
    await errorStore.handleError(
      async () => {
        // Initialize the gallery store if not already initialized
        if (!galleryStore.galleries.length) {
          await galleryStore.initializeStore()
        }

        // If no gallery is selected, pick a random one
        if (!galleryStore.currentGallery) {
          galleryStore.setRandomGallery()
        }

        // If no image is set, fetch a random image
        if (!galleryStore.currentImage) {
          await galleryStore.changeToRandomImage()
        }
      },
      ErrorType.GENERAL_ERROR,
      'Failed to load random image.',
    )
  } catch (error) {
    // Capture and display the error message
    errorMessage.value =
      errorStore.getError || 'An unknown error occurred: ' + error
  }
})
</script>

<style scoped>
.random-image-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}
img {
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
}
</style>
