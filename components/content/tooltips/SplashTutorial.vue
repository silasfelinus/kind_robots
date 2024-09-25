<template>
  <div
    class="relative flex flex-col items-center justify-between h-full w-full bg-base-300 p-1 overflow-y-auto rounded-2xl shadow-lg"
  >
    
    <!-- Main Content Section -->
    <div
      class="flex-1 flex flex-col items-center justify-center w-full overflow-y-auto"
    >
      <img
        :src="'/images/' + page.image"
        alt="Main Image"
        class="rounded-2xl border border-base-300 shadow-md object-contain max-w-full max-h-[60vh]" 
      />
      <div
        class="bg-info text-info-content p-2 rounded-xl shadow-md w-2/3"
      >

<!-- Title and Subtitle Section -->
    <div class="w-full flex justify-between items-center p-1">
      <h1 class="text-lg md:text-xl font-bold text-secondary w-full">
        {{ page.title }}
      </h1>
      <h2
        v-if="page.subtitle"
        class="text-xs md:text-base font-medium text-accent ml-auto"
      >
        {{ page.subtitle }}
      </h2>
    </div>

        <p class="text-xs md:text-sm font-medium text-center">
          {{ page.description }}
        </p>
      </div>
    </div>

    <!-- Bot Messages Section -->
    <div class="flex flex-col space-y-1 w-full max-w-3xl px-2 lg:px-4 flex-shrink-0">
      <!-- DottiBot Message -->
      <div class="flex justify-center">
        <div
          class="flex items-center space-x-2 p-1 bg-primary border border-secondary text-base-200 rounded-lg shadow-lg w-2/3"
        >
          <img
            src="/images/avatars/dottie1.webp"
            alt="DottiBot Avatar"
            class="w-8 h-8 md:w-10 md:h-10 rounded-full shadow-md"
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
          class="flex items-center space-x-2 p-1 bg-secondary border border-primary text-base-200 rounded-lg shadow-lg w-2/3"
        >
          <img
            src="/images/amibotsquare1.webp"
            alt="AMIbot Avatar"
            class="w-8 h-8 md:w-10 md:h-10 rounded-full shadow-md"
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
import { computed, onMounted } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()
const { page } = useContent()

onMounted(() => {
  displayStore.initializeViewportWatcher()
})
</script>

<style scoped>
/* Tailwind utilities handle the layout, so no custom CSS is needed */
</style>
