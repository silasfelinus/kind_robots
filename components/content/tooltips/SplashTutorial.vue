<template>
  <div
    class="relative flex flex-col h-full w-full bg-base-300 overflow-hidden rounded-2xl shadow-lg"
    :style="{ height: displayStore.mainVh + 'vh' }"
  >
    <!-- Main Content Section -->
    <div class="flex-1 flex flex-col items-center justify-start space-y-4 overflow-y-auto p-4">
      <!-- Main Image -->
      <img
        :src="'/images/' + page.image"
        alt="Main Image"
        class="rounded-2xl border border-base-300 shadow-md object-contain max-w-full max-h-[40vh]"
      />

      <!-- Title, Description, and Subtitle Section -->
      <div class="text-center w-full space-y-2">
        <h1 class="text-xl md:text-2xl font-bold text-secondary">{{ page.title }}</h1>

        <p class="text-sm md:text-base font-medium text-info-content px-4">{{ page.description }}</p>

        <h2 v-if="page.subtitle" class="text-xs md:text-sm font-medium text-accent">
          {{ page.subtitle }}
        </h2>
      </div>
    </div>

    <!-- Bot Messages Section -->
    <div class="flex flex-col space-y-2 w-full max-w-3xl px-4 py-2 overflow-y-auto">
      <!-- DottiBot Message -->
      <div class="flex justify-center">
        <div
          class="flex items-center space-x-2 p-2 bg-primary border border-secondary text-base-200 rounded-lg shadow-lg w-full lg:w-2/3"
        >
          <img
            src="/images/avatars/dottie1.webp"
            alt="DottiBot Avatar"
            class="w-8 h-8 lg:w-10 lg:h-10 rounded-full shadow-md"
          />
          <div class="flex flex-col">
            <span class="text-xs font-semibold">DottiBot</span>
            <p class="text-xs md:text-sm">{{ page.dottitip }}</p>
          </div>
        </div>
      </div>

      <!-- AMIbot Message -->
      <div class="flex justify-center">
        <div
          class="flex items-center space-x-2 p-2 bg-secondary border border-primary text-base-200 rounded-lg shadow-lg w-full lg:w-2/3"
        >
          <img
            src="/images/amibotsquare1.webp"
            alt="AMIbot Avatar"
            class="w-8 h-8 lg:w-10 lg:h-10 rounded-full shadow-md"
          />
          <div class="flex flex-col">
            <span class="text-xs font-semibold">AMIbot</span>
            <p class="text-xs md:text-sm text-white">{{ page.amitip }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()
const { page } = useContent()

onMounted(() => {
  displayStore.initializeViewportWatcher()
})
</script>

<style scoped>
/* No custom CSS needed, Tailwind utilities are used */
</style>
