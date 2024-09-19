<template>
  <div class="random-image-container">
    <!-- Show the image if it exists -->
    <div v-if="randomImage">
      <img
        :src="randomImage"
        alt="Random Gallery Image"
        class="rounded-lg shadow-lg"
      />
    </div>
    <!-- Show a message if no image is available -->
    <div v-else class="text-center text-gray-500">
      <p>No image available.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useGalleryStore } from '@/stores/galleryStore'

// Initialize the gallery store
const galleryStore = useGalleryStore()

// Fetch the random image from the store's getter
const randomImage = computed(() => galleryStore.currentImage)

// Initialize the store and fetch galleries on component mount
onMounted(async () => {
  // Initialize the store if galleries haven't been loaded yet
  if (!galleryStore.galleries.length) {
    await galleryStore.initializeStore()
  }

  // If no gallery is currently selected, select a random one
  if (!galleryStore.currentGallery) {
    galleryStore.setRandomGallery()
  }

  // Ensure a random image is selected
  if (!galleryStore.currentImage) {
    galleryStore.changeToRandomImage()
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
