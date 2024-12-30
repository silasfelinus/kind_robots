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

    <!-- Button to load a new random image -->
    <div class="text-center mt-4">
      <button
        class="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
        @click="loadNewRandomImage"
      >
        Load New Random Image
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useGalleryStore } from '@/stores/galleryStore'
import { useErrorStore } from '@/stores/errorStore'

// Initialize the gallery store and error store
const galleryStore = useGalleryStore()
const errorStore = useErrorStore()

// Fetch the random image from the store
const randomImage = computed(() => galleryStore.currentImage)

// State to hold error messages
const errorMessage = ref<string | null>(null)

// Function to load a random image
const loadNewRandomImage = async () => {
  try {
    errorMessage.value = null // Clear any existing error messages

    // Initialize the gallery store if not already initialized
    if (!galleryStore.galleries.length) {
      await galleryStore.initializeStore()
    }

    // Set a random gallery and image
    galleryStore.setRandomGallery()
    await galleryStore.changeToRandomImage()
  } catch (error) {
    // Capture and display the error message
    errorMessage.value =
      errorStore.getError || 'Failed to load a random image.' + error
  }
}

// Load a random image when the component mounts
onMounted(async () => {
  await loadNewRandomImage()
})
</script>

<style scoped>
.random-image-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}
img {
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
}
button {
  margin-top: 16px;
}
</style>
