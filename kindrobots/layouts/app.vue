<template>
  <main class="main-content">
    <!-- nuxt-link to Home -->
    <nuxt-link to="/">Home to Kind Robots</nuxt-link>

    <!-- Banner Image -->
    <div v-if="pageContentImage && pageContentImage !== 'default.jpg'">
      <img :src="imagePath" alt="Kind Robots Banner" />
    </div>

    <slot />
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const pageContentImage = ref('backtree.webp') // Default value for easier debugging

onMounted(async () => {
  try {
    const route = useRoute()
    const currentPath = route.path.startsWith('/content') ? route.path.substring(8) : route.path
    const content = await useContent(currentPath)

    if (content && content.image) {
      pageContentImage.value = content.image
    } else {
      console.warn('No image parameter found in the content file.') // Warning if image parameter is missing
    }
  } catch (error) {
    console.error('An error occurred during image processing:', error) // Log any unexpected errors
  }
})

const imagePath = computed(() => `/images/${pageContentImage.value}`)
</script>
