<template>
  <div class="flex flex-col h-full w-full bg-base-100" :style="tutorialStyle">
    <!-- Title and Subtitle -->
    <div class="flex flex-col items-center justify-center p-4">
      <h1 class="text-3xl font-bold text-secondary">{{ page.title }}</h1>
      <h2 v-if="page.subtitle" class="text-xl font-medium text-accent mt-2">
        {{ page.subtitle }}
      </h2>
    </div>

    <!-- Image Section -->
    <div class="flex justify-center items-center mt-6">
      <img
        :src="'/images/' + page.image"
        alt="Main Image"
        class="rounded-2xl border border-base-300 shadow-md object-cover w-64 h-64"
      />
    </div>

    <!-- Description -->
    <div class="text-center text-base-content max-w-lg mx-auto mt-4 p-4">
      <p>{{ page.description }}</p>
    </div>

    <!-- Bot Messages Section -->
    <div class="flex flex-col space-y-4 mt-8 mx-auto w-full max-w-lg px-4">
      <!-- DottiBot Message -->
      <div class="flex justify-end">
        <div
          class="flex items-center space-x-4 p-4 bg-primary border border-secondary text-base-200 rounded-lg shadow-lg w-full md:w-3/4"
        >
          <img
            src="/images/avatars/dottie1.webp"
            alt="DottiBot Avatar"
            class="w-12 h-12 rounded-full shadow-md"
          />
          <div class="flex flex-col">
            <span class="text-sm font-semibold">DottiBot</span>
            <p class="text-sm">{{ page.dottitip }}</p>
          </div>
        </div>
      </div>

      <!-- AMIbot Message -->
      <div class="flex justify-start">
        <div
          class="flex items-center space-x-4 p-4 bg-secondary border border-primary text-base-200 rounded-lg shadow-lg w-full md:w-3/4"
        >
          <img
            src="/images/amibotsquare1.webp"
            alt="AMIbot Avatar"
            class="w-12 h-12 rounded-full shadow-md"
          />
          <div class="flex flex-col">
            <span class="text-sm font-semibold">AMIbot</span>
            <p class="text-sm text-white">{{ page.amitip }}</p>
            <!-- Improved readability -->
          </div>
        </div>
      </div>
    </div>

    <!-- Footer with Next Button -->
    <div class="flex justify-between items-center mt-8 px-4">
      <div class="flex items-center">
        <input
          id="showInfo"
          v-model="showInfoInStore"
          type="checkbox"
          class="mr-2 h-4 w-4 text-accent focus:ring-0"
        />
        <label for="showInfo" class="text-base-content"
          >Don't show this again</label
        >
      </div>
      <button
        class="bg-info text-base-200 py-2 px-4 rounded-lg shadow-md hover:bg-info-focus transition duration-300"
        @click="startPageTransition"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script setup>
import {  computed } from 'vue'
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

// Method to trigger the transition to the actual page content
const startPageTransition = () => {
  emit('page-transition')
}

// Manage whether to show the splash again in the future
const showInfoInStore = computed({
  get: () => displayStore.showInfo,
  set: (value: boolean) => {
    displayStore.showInfo = value
  },
})
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
}

img {
  object-fit: cover;
}

/* Improved readability for AMIbot text */
.text-white {
  color: #ffffff;
}
</style>
