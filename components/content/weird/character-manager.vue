<template>
  <div ref="container" class="h-full w-full bg-base-200 flex flex-col">
    <!-- Error Display -->
    <div
      v-if="error"
      class="bg-red-500 text-white p-4 rounded-lg absolute inset-x-1/2 top-4 transform -translate-x-1/2 z-50"
    >
      <p>{{ error }}</p>
      <button
        class="mt-2 bg-white text-red-500 px-4 py-2 rounded"
        @click="clearError"
      >
        Dismiss
      </button>
    </div>

    <!-- Character Options (Top Section) -->
    <div class="flex justify-center items-center h-[6%] sm:h-auto">
      <character-options />
    </div>

    <!-- Main Content -->
    <div class="flex-grow flex flex-col">
      <!-- Title Section -->
      <div class="flex justify-center items-center h-[20%] sm:h-auto">
        <character-title />
      </div>

      <!-- Stats and Art Section -->
      <div class="flex flex-row flex-grow">
        <!-- Stats and Goals -->
        <div class="flex flex-col space-y-4 w-2/3 lg:w-3/4 overflow-auto">
          <character-stats />
          <character-rewards />
        </div>

        <!-- Character Art -->
        <div class="flex items-center justify-center w-1/3 lg:w-1/4">
          <character-art />
        </div>
      </div>
    </div>

    <!-- Bottom Section -->
    <div class="flex justify-center items-center w-full h-[27%] sm:h-auto">
      <character-bottom />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Error handling
const error = ref<string | null>(null)
function clearError() {
  error.value = null
}
</script>
