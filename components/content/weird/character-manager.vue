<template>
  <div
    ref="container"
    class="h-screen w-full bg-base-200 p-6 flex flex-col space-y-6"
  >
    <!-- Error Display -->
    <div
      v-if="error"
      class="bg-red-500 text-white p-4 rounded-lg absolute top-4 left-1/2 transform -translate-x-1/2 z-50"
    >
      <p>{{ error }}</p>
      <button
        class="mt-2 bg-white text-red-500 px-4 py-2 rounded"
        @click="clearError"
      >
        Dismiss
      </button>
    </div>

    <!-- Character Options (Top 8%) -->
    <div
      class="flex justify-center items-center"
      :style="{ height: `calc(${containerHeight * 0.08}px)` }"
    >
      <character-options />
    </div>

    <!-- Character Content -->
    <div class="flex-grow flex flex-col">
      <!-- Title (20% Height) -->
      <div
        class="flex justify-center items-center"
        :style="{ height: `calc(${containerHeight * 0.2}px)` }"
      >
        <character-title />
      </div>

      <!-- Stats and Goals + Character Art -->
      <div class="flex flex-row flex-grow">
        <!-- Stats and Goals (70% Width) -->
        <div
          class="flex flex-col space-y-4"
          :style="{
            width: `calc(${containerWidth * 0.7}px)`,
            height: `calc(${containerHeight * 0.5}px)`,
          }"
        >
          <character-stats />
          <character-rewards />
        </div>

        <!-- Character Art (30% Width) -->
        <div
          class="flex items-center justify-center"
          :style="{
            width: `calc(${containerWidth * 0.3}px)`,
            height: `calc(${containerHeight * 0.5}px)`,
          }"
        >
          <character-art />
        </div>
      </div>
    </div>

    <!-- Bottom Section (Remaining 25%) -->
    <div
      class="flex justify-center items-center"
      :style="{ height: `calc(${containerHeight * 0.25}px)` }"
    >
      <character-bottom />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const container = ref<HTMLElement | null>(null)
const containerWidth = ref(0)
const containerHeight = ref(0)

// Error handling
const error = ref<string | null>(null)
function clearError() {
  error.value = null
}

// Function to calculate container dimensions
const calculateContainerDimensions = () => {
  if (container.value) {
    const rect = container.value.getBoundingClientRect()
    containerWidth.value = rect.width
    containerHeight.value = rect.height
  }
}

// Watch for window resize
const handleResize = () => {
  calculateContainerDimensions()
}

// Initialize and set up event listeners
onMounted(() => {
  calculateContainerDimensions()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})
</script>
