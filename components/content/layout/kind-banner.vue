<!-- /components/content/layout/kind-banner.vue -->
<template>
  <div
    class="banner-container flex flex-col lg:flex-row items-center justify-center border-accent border bg-primary text-white px-4 py-3 rounded-lg shadow-lg w-full mb-6"
  >
    <!-- Display the image if it exists -->
    <div class="flex-shrink-0 h-auto">
      <img
        v-if="image"
        :src="'/images/' + image"
        alt="Page banner image"
        class="object-contain rounded-lg max-h-24 lg:max-h-32"
      />
    </div>

    <!-- Title and Subtitle -->
    <div
      class="flex flex-col justify-center text-center lg:text-left lg:w-3/4 mt-3 lg:mt-0 lg:ml-4"
    >
      <h1 class="text-2xl md:text-4xl font-extrabold">
        {{ title || 'Kind Robots' }}
      </h1>
      <p class="text-md md:text-lg font-medium mt-1">
        {{ subtitle || 'Craft your universe.' }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePageStore } from '@/stores/pageStore'

const pageStore = usePageStore()
const { title, subtitle, image } = storeToRefs(pageStore)
</script>
