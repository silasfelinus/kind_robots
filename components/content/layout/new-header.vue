<!-- new-header.vue -->
<template>
  <header
    class="flex justify-between items-center p-2 bg-base-400 rounded-2xl border-8 border-accent m-4"
  >
    <!-- Image -->
    <div class="flex items-center justify-center w-16">
      <img
        :src="finalHeaderImage"
        alt="Main Image"
        class="w-full h-50 rounded-xl"
        @load="imageLoaded"
      />
    </div>
    <!-- Title and Subtitle -->
    <div class="flex flex-col items-center justify-center bg-primary p-2 rounded">
      <h1 class="text-xl text-white font-bold">{{ page.title }}</h1>
      <h2 class="text-lg text-white">{{ page.subtitle }}</h2>
    </div>
    <!-- Theme Selector -->
    <div class="flex items-center justify-center w-16">
      <theme-selector />
    </div>
    <!-- Butterfly Toggle -->
    <div class="flex items-center justify-center w-16">
      <butterfly-toggle />
    </div>
    <!-- Screen FX -->
    <div class="flex items-center justify-center">
      <screen-fx />
    </div>
  </header>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const finalHeaderImage = ref('/images/kindtitle.webp') // Fallback image

const { page } = useContent()
useContentHead(page)

const imageLoaded = () => {
  if (page.image) {
    finalHeaderImage.value = `/images/${page.image}`
  }
}
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
