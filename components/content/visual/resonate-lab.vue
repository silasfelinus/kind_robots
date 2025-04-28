<!-- /pages/lab/resonate-lab.vue -->
<template>
  <div
    class="w-full min-h-screen flex flex-col gap-8 p-4 sm:p-6 md:p-10 bg-base-200 rounded-2xl overflow-hidden"
  >
    <!-- Title + Description -->
    <div class="text-center space-y-4">
      <h1 class="text-3xl md:text-5xl font-bold text-primary">
        {{ pageStore.title }}
      </h1>
      <p class="text-lg md:text-2xl text-base-content">
        {{ pageStore.subtitle }}
      </p>
      <p class="text-md md:text-lg text-base-content/70">
        {{ pageStore.description }}
      </p>
    </div>

    <!-- Resonate Display -->
    <resonate-display class="flex-1 max-h-[65vh]" />

    <!-- Command Buttons -->
    <resonate-buttons />

    <!-- Optional: Return Navigation -->
    <div class="w-full flex justify-center pt-6">
      <nuxt-link to="/gallery" class="btn btn-secondary rounded-2xl text-lg">
        Return to Gallery
      </nuxt-link>
    </div>
  </div>
</template>

<script setup lang="ts">
// /pages/lab/resonate-lab.vue
import { usePageStore } from '@/stores/pageStore'
import { onMounted } from 'vue'

const pageStore = usePageStore()

onMounted(async () => {
  await pageStore.loadPage()
})
</script>
