<template>
  <div
    class="relative flex flex-col items-center justify-center h-full w-full bg-base-100 overflow-hidden rounded-2xl border border-accent mb-4 mr-10"
    :style="tutorialStyle"
  >
    <!-- Title and Subtitle -->
    <div class="text-center p-4">
      <h1 class="text-lg md:text-2xl font-bold text-secondary">
        {{ page.title }}
      </h1>
      <h2
        v-if="page.subtitle"
        class="text-sm md:text-lg font-medium text-accent mt-1"
      >
        {{ page.subtitle }}
      </h2>
    </div>

    <!-- Image and Description Section -->
    <div
      class="flex flex-col items-center justify-center mt-4 space-y-6 px-4 lg:px-8"
    >
      <!-- Image Section -->
      <img
        :src="'/images/' + page.image"
        alt="Main Image"
        class="rounded-2xl border border-base-300 shadow-md object-cover w-32 h-32 md:w-56 md:h-56"
      />

      <!-- Description Section -->
      <div
        class="bg-info text-info-content p-4 rounded-xl shadow-md w-full lg:w-2/3 max-w-4xl"
      >
        <p class="text-xs md:text-sm font-medium text-center">
          {{ page.description }}
        </p>
      </div>
    </div>

    <!-- Bot Messages Section -->
    <div class="flex flex-col space-y-6 mt-6 w-full max-w-4xl px-4 lg:px-8">
      <!-- DottiBot Message -->
      <div class="flex justify-center">
        <div
          class="flex items-center space-x-2 p-4 bg-primary border border-secondary text-base-200 rounded-lg shadow-lg w-full lg:w-2/3"
        >
          <img
            src="/images/avatars/dottie1.webp"
            alt="DottiBot Avatar"
            class="w-10 h-10 md:w-12 md:h-12 rounded-full shadow-md"
          />
          <div class="flex flex-col">
            <span class="text-sm font-semibold">DottiBot</span>
            <p class="text-xs md:text-sm">{{ page.dottitip }}</p>
          </div>
        </div>
      </div>

      <!-- AMIbot Message -->
      <div class="flex justify-center">
        <div
          class="flex items-center space-x-2 p-4 bg-secondary border border-primary text-base-200 rounded-lg shadow-lg w-full lg:w-2/3"
        >
          <img
            src="/images/amibotsquare1.webp"
            alt="AMIbot Avatar"
            class="w-10 h-10 md:w-12 md:h-12 rounded-full shadow-md"
          />
          <div class="flex flex-col">
            <span class="text-sm font-semibold">AMIbot</span>
            <p class="text-xs md:text-sm text-white">{{ page.amitip }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

// Access displayStore to compute space below header and sidebar
const displayStore = useDisplayStore()

// Compute tutorial wrapper style based on available space
const tutorialStyle = computed(() => ({
  height: `${100 - displayStore.headerVh}vh`,
  width: `${100 - displayStore.sidebarVw}vw`,
}))

// Page content
const { page } = useContent()
</script>

<style scoped>
html,
body,
#app {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden; /* Prevent scrollbars */
}

@media (min-width: 1024px) {
  /* For larger screens */
  .max-w-4xl {
    max-width: 75vw;
  }
}
</style>
