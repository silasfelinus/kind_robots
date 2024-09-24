<template>
  <div
    class="relative flex flex-col items-center justify-between h-full w-full bg-base-100 overflow-hidden rounded-2xl border border-accent mb-4"
    :style="mainContentStyle"
  >
    <!-- Title and Subtitle Section -->
    <div class="w-full flex justify-between items-center p-4">
      <h1 class="text-lg md:text-2xl font-bold text-secondary w-full">
        {{ page.title }}
      </h1>
      <h2
        v-if="page.subtitle"
        class="text-sm md:text-lg font-medium text-accent ml-auto"
      >
        {{ page.subtitle }}
      </h2>
    </div>

    <!-- Main Content Section (Image and Description) -->
    <div class="flex flex-1 flex-col items-center justify-center w-full px-4 lg:px-8">
      <!-- Image Section -->
      <img
        :src="'/images/' + page.image"
        alt="Main Image"
        class="rounded-2xl border border-base-300 shadow-md object-cover w-full max-w-lg flex-shrink-0"
      />

      <!-- Description Section -->
      <div
        class="bg-info text-info-content p-4 rounded-xl shadow-md w-full lg:w-2/3 max-w-4xl mt-4 flex-shrink-0"
      >
        <p class="text-xs md:text-sm font-medium text-center">
          {{ page.description }}
        </p>
      </div>
    </div>

    <!-- Bot Messages Section -->
    <div class="flex flex-col space-y-6 w-full max-w-4xl px-4 lg:px-8 flex-shrink-0">
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
import { computed, onMounted } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Ensure the store initializes correctly when the component mounts
onMounted(() => {
  displayStore.initializeViewportWatcher()
})

// Calculate the available space dynamically based on the display store.
const mainContentStyle = computed(() => ({
  height: `${displayStore.mainVh || 100}vh`,
  width: `${displayStore.mainVw || 100}vw`,
}))
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

/* Flex-based grid for content stretching */
.flex-1 {
  flex-grow: 1;
  flex-shrink: 0;
}

/* Utility to handle max width for large screens */
@media (min-width: 1024px) {
  .max-w-4xl {
    max-width: 75vw;
  }
}
</style>
