<template>
  <div class="flex flex-col h-full w-full bg-base-100 overflow-hidden" :style="tutorialStyle">
    <!-- Title and Subtitle -->
    <div class="flex flex-col items-center justify-center p-2 md:p-4">
      <h1 class="text-lg md:text-xl font-bold text-secondary">{{ page.title }}</h1>
      <h2 v-if="page.subtitle" class="text-sm md:text-lg font-medium text-accent mt-1">
        {{ page.subtitle }}
      </h2>
    </div>

    <!-- Main Content (Image, Description, and Bot Messages) -->
    <div class="flex flex-col md:flex-row justify-center items-start md:items-center mt-2 md:mt-4 md:space-x-6 px-2">
      <!-- Left Column: Image and Description -->
      <div class="flex flex-col items-center md:w-1/2">
        <img
          :src="'/images/' + page.image"
          alt="Main Image"
          class="rounded-2xl border border-base-300 shadow-md object-cover w-full md:w-auto h-auto"
        />
        <div class="text-center text-base-content max-w-md mx-auto mt-4 md:mt-0">
          <p class="text-xs md:text-sm">{{ page.description }}</p>
        </div>
      </div>

      <!-- Right Column: Bot Messages (On larger screens) -->
      <div class="flex flex-col space-y-4 mt-6 mx-auto md:mx-0 w-full max-w-md md:max-w-none md:w-1/2 px-4">
        <!-- DottiBot Message -->
        <div class="flex justify-end">
          <div class="flex items-center space-x-2 md:space-x-4 p-3 md:p-4 bg-primary border border-secondary text-base-200 rounded-lg shadow-lg w-full md:w-auto inset-box-right">
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
        <div class="flex justify-start">
          <div class="flex items-center space-x-2 md:space-x-4 p-3 md:p-4 bg-secondary border border-primary text-base-200 rounded-lg shadow-lg w-full md:w-auto inset-box-left">
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

/* Insets for chat messages */
.inset-box-right {
  margin-right: auto;
}

.inset-box-left {
  margin-left: auto;
}

/* Chat bubbles for DottiBot and AMIbot */
.flex {
  flex-wrap: wrap;
  align-items: center;
}

/* Responsive layout adjustments */
@media (min-width: 768px) {
  .md\\:flex-row {
    display: flex;
  }
}
</style>
