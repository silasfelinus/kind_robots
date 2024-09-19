<template>
  <div class="random-image-container">
    <div v-if="randomImage">
      <img
        :src="randomImage"
        alt="Random Gallery Image"
        class="rounded-lg shadow-lg"
      />
    </div>
    <div v-else class="text-center text-gray-500">
      <p>No image available. Please select a gallery.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useGalleryStore } from '@/stores/galleryStore'

// Initialize the gallery store
const galleryStore = useGalleryStore()

// Fetch a random image using the store's getter
const randomImage = computed(() => galleryStore.randomImage)

// Initialize the store when the component mounts
onMounted(async () => {
  // If the store hasn't been initialized yet, initialize it
  if (!galleryStore.galleries.length) {
    await galleryStore.initializeStore()
  }

  // Ensure a gallery is selected and an image is loaded
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
  min-height: 200px;
}
img {
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
}
</style>
