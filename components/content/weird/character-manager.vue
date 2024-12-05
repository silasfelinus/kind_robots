<template>
  <div
    ref="container"
    class="h-full w-full bg-base-200 flex flex-col"
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
      class="flex justify-center items-center h-10%"
    >
      <character-options />
    </div>

    <!-- Character Content -->
    <div class="flex-grow flex flex-col">
      <!-- Title (20% Height) -->
      <div
        class="flex justify-center items-center h-20%"
      >
        <character-title />
      </div>

      <!-- Stats and Goals + Character Art -->
      <div class="flex flex-row flex-grow">
        <!-- Stats and Goals (70% Width) -->
        <div
          class="flex flex-col space-y-4 w-2/3 h-1/2"
        >
          <character-stats />
          <character-rewards />
        </div>

        <!-- Character Art (30% Width) -->
        <div
          class="flex items-center justify-center  w-1/3 h-1/2"
          
        >
          <character-art />
        </div>
      </div>
    </div>

    <!-- Bottom Section (Remaining 25%) -->
    <div
      class="flex justify-center items-center w-full h-auto"
      
    >
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
