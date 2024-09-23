<template>
  <div
    class="relative flex flex-col h-full w-full bg-base-100 overflow-hidden mx-10"
    :style="tutorialStyle"
  >
    <!-- Title and Subtitle -->
    <div class="flex flex-col items-center justify-center p-4 md:p-6 mt-8">
      <h1 class="text-xl md:text-3xl font-bold text-secondary">
        {{ page.title }}
      </h1>
      <h2
        v-if="page.subtitle"
        class="text-md md:text-xl font-medium text-accent mt-2"
      >
        {{ page.subtitle }}
      </h2>
    </div>

    <!-- Image and Description Section -->
    <div
      class="flex flex-col items-center justify-center mt-2 md:mt-4 lg:space-x-6 lg:mx-auto lg:max-w-4xl lg:w-full px-4"
    >
      <!-- Image Section -->
      <img
        :src="'/images/' + page.image"
        alt="Main Image"
        class="rounded-2xl border border-base-300 shadow-md object-cover w-40 h-40 md:w-64 md:h-64"
      />

      <!-- Description Section (always below the image) -->
      <div
        class="bg-info text-info-content p-4 md:p-6 rounded-xl shadow-md mt-4 lg:mt-4 w-full"
      >
        <p class="text-sm md:text-base font-medium">
          {{ page.description }}
        </p>
      </div>
    </div>

    <!-- Bot Messages Section -->
    <div
      class="flex flex-col space-y-4 mt-6 mx-auto w-full max-w-4xl px-4"
    >
      <!-- DottiBot Message -->
      <div class="flex justify-start w-full">
        <div
          class="mr-14 ml-4 flex items-center space-x-2 p-3 bg-primary border border-secondary text-base-200 rounded-lg shadow-lg w-full lg:w-3/4"
        >
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
      <div class="flex justify-end w-full">
        <div
          class="ml-14 mr-4 flex items-center space-x-2 p-3 bg-secondary border border-primary text-base-200 rounded-lg shadow-lg w-full lg:w-3/4"
        >
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
