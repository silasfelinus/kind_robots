<!-- /components/content/weird/weird-art.vue -->
<template>
  <div
    class="weird-art bg-accent text-white flex items-center justify-center rounded-lg h-full"
  >
    <div class="flex flex-col items-center">
      <img
        v-if="currentArt"
        :src="currentArt"
        alt="Weird Art"
        class="rounded-md shadow-lg object-cover h-32 w-32"
      />
      <p v-else class="text-sm">No Art Available</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useWeirdStore } from '@/stores/weirdStore'
import { useGalleryStore } from '@/stores/galleryStore'

const weirdStore = useWeirdStore()
const galleryStore = useGalleryStore()

const currentArt = computed(() => weirdStore.artImage)

onMounted(async () => {
  try {
    // Load a random image from gallery ID 20
    const randomImage = await galleryStore.changeToRandomImageFromGallery(17)
    if (randomImage) {
      weirdStore.artImage = randomImage // Update the weirdStore with the fetched image
    }
  } catch (error) {
    console.error('Failed to load random gallery image:', error)
  }
})
</script>
