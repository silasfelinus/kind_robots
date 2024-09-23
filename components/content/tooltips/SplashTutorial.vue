<template>
  <div class="flex flex-col h-full w-full bg-base-100 overflow-hidden" :style="tutorialStyle">
    <!-- Title and Subtitle -->
    <div class="flex flex-col items-center justify-center p-2 md:p-4">
      <h1 class="text-xl md:text-3xl font-bold text-secondary">{{ page.title }}</h1>
      <h2 v-if="page.subtitle" class="text-md md:text-xl font-medium text-accent mt-2">
        {{ page.subtitle }}
      </h2>
    </div>

    <!-- Image and Description Section -->
    <div class="flex flex-col md:flex-row justify-center items-center mt-2 md:mt-4 md:space-x-6 px-2">
      <img
        :src="'/images/' + page.image"
        alt="Main Image"
        class="rounded-2xl border border-base-300 shadow-md object-cover w-40 h-40 md:w-64 md:h-64"
      />
      <div class="text-center text-base-content max-w-md mx-auto mt-4 md:mt-0">
        <p class="text-xs md:text-base">{{ page.description }}</p>
      </div>
    </div>

    <!-- Bot Messages Section -->
    <div class="flex flex-col md:flex-row justify-between space-y-4 md:space-y-0 mt-6 mx-auto w-full max-w-4xl px-4">
      <!-- DottiBot Message -->
      <div class="flex md:w-1/2 justify-end">
        <div class="flex items-center space-x-2 md:space-x-4 p-3 md:p-4 bg-primary border border-secondary text-base-200 rounded-lg shadow-lg w-full">
          <img
            src="/images/avatars/dottie1.webp"
            alt="DottiBot Avatar"
            class="w-10 h-10 md:w-12 md:h-12 rounded-full shadow-md"
          />
          <div class="flex flex-col">
            <span class="text-xs md:text-sm font-semibold">DottiBot</span>
            <p class="text-xs md:text-sm">{{ page.dottitip }}</p>
          </div>
        </div>
      </div>

      <!-- AMIbot Message -->
      <div class="flex md:w-1/2 justify-start">
        <div class="flex items-center space-x-2 md:space-x-4 p-3 md:p-4 bg-secondary border border-primary text-base-200 rounded-lg shadow-lg w-full">
          <img
            src="/images/amibotsquare1.webp"
            alt="AMIbot Avatar"
            class="w-10 h-10 md:w-12 md:h-12 rounded-full shadow-md"
          />
          <div class="flex flex-col">
            <span class="text-xs md:text-sm font-semibold">AMIbot</span>
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

// Emit event when transitioning to the next page
const emit = defineEmits(['page-transition'])

// Compute tutorial wrapper style based on available space
const tutorialStyle = computed(() => ({
  height: `${100 - displayStore.headerVh}vh`,
  width: `${100 - displayStore.sidebarVw}vw`,
}))

// Page content
const { page } = useContent()

// Method to trigger the transition to the actual page content
const startPageTransition = () => {
  emit('page-transition')
}
</script>

<style scoped>
/* Flexbox and layout styling */
.tutorial-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--tw-bg-opacity, 1);
  transition: all 0.5s ease;
  position: relative;
  overflow: hidden; /* Prevents overflowing on small screens */
}

img {
  object-fit: cover;
}

/* Improved readability for AMIbot text */
.text-white {
  color: #ffffff;
}

/* Triangle right for Next button */
.triangle-right {
  width: 0;
  height: 0;
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-left: 12px solid white; /* Arrow color */
  margin-left: 8px;
}
</style>
