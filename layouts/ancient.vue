<template>
  <div class="flex flex-col min-h-screen bg-base-100 overflow-hidden relative">
    <!-- Header -->
    <site-header />
    <!-- Main Content -->
    <main>
      <slot />
    </main>
    <!-- Footer -->
    <footer class="p-4 bg-primary text-black text-center">
      <home-nav />
      KindRobots © 2023
      <screen-fx />
    </footer>

    <!-- Tooltip Popup -->
    <div class="absolute bottom-4 right-4">
      <tooltip-popup />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'

const { page } = useContent()
useContentHead(page)

const mainImage = ref('/images/' + page.image ?? '/images/kindtitle.webp') // Fallback image
const headerImage = ref('/images/kindtitle.webp')
const isLoading = ref(false)
const hasError = ref(false)
const randomImage = ref()

onMounted(async () => {
  try {
    isLoading.value = true
    headerImage.value = page.image ?? '/images/kindtitle.webp' // Fallback header image
    const response = await axios.get(
      `https://kindrobots.org/api/gallery/random/name/${page.gallery}`
    )
    randomImage.value = response.data.url
  } catch (error) {
    console.error('Failed to fetch random image:', error)
    hasError.value = true
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
/* Flip card transition */
.flip-card-enter-active,
.flip-card-leave-active {
  transition: transform 1s;
}
.flip-card-enter,
.flip-card-leave-to {
  transform: rotateY(180deg);
}
</style>
