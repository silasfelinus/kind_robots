<template>
  <div class="h-screen w-full bg-base-200 p-6 flex flex-col space-y-6">
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
      :style="{ height: `calc(${displayStore.mainVh * 0.08}vh)` }"
    >
      <character-options />
    </div>

    <!-- Character Content -->
    <div
      class="flex-grow flex flex-col"
      :style="{ height: `calc(${displayStore.mainVh}vh)` }"
    >
      <!-- Title (20% Height) -->
      <div
        class="flex justify-center items-center"
        :style="{ height: `calc(${displayStore.mainVh * 0.2}vh)` }"
      >
        <character-title />
      </div>

      <!-- Stats and Goals + Character Art -->
      <div class="flex flex-row flex-grow">
        <!-- Stats and Goals (70% Width) -->
        <div
          class="flex flex-col space-y-4"
          :style="{
            width: `calc(${displayStore.mainVw * 0.7}vw)`,
            height: `calc(${displayStore.mainVh * 0.5}vh)`,
          }"
        >
          <character-stats />
          <character-goals />
        </div>

        <!-- Character Art (30% Width) -->
        <div
          class="flex items-center justify-center"
          :style="{
            width: `calc(${displayStore.mainVw * 0.3}vw)`,
            height: `calc(${displayStore.mainVh * 0.5}vh)`,
          }"
        >
          <character-art />
        </div>
      </div>
    </div>

    <!-- Bottom Section (Remaining 25%) -->
    <div
      class="flex justify-center items-center"
      :style="{ height: `calc(${displayStore.mainVh * 0.25}vh)` }"
    >
      <character-bottom />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Error handling
const error = ref<string | null>(null)
function clearError() {
  error.value = null
}
</script>
