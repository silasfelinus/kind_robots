<template>
  <div class="bg-base p-6 rounded-lg shadow-lg">
    <h2 class="text-2xl font-semibold mb-4">{{ currentGallery?.name }}</h2>
    <button class="btn btn-accent mb-4" @click="getRandomGalleryImage(currentGallery?.id)">
      Get Random Image
    </button>
    <div v-if="currentImage" class="mb-4">
      <img
        :src="currentImage"
        alt="Random Gallery Image"
        class="w-full h-64 object-cover rounded"
      />
    </div>
    <div class="grid grid-cols-5 gap-4 thumbnails">
      <img
        v-for="image in galleryImages"
        :key="image"
        :src="image"
        alt="Gallery Thumbnail"
        class="w-full h-32 object-cover rounded"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useGalleryStore } from '../../stores/galleryStore'

const route = useRoute()
const galleryStore = useGalleryStore()
const { currentGallery, galleryImages, currentImage, getRandomGalleryImage } = galleryStore

const galleryId = ref(route.params.id)
galleryStore.getGalleryImages(galleryId.value)
</script>
