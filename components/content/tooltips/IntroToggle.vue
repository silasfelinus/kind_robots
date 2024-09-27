<template>
  <div class="intro-toggle flex items-center gap-2">
    <!-- Conditional Icon and Text based on whether intro is running or not -->
    <button
      class="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm hover:bg-gray-300 flex items-center"
      @click="toggleIntro"
    >
      <icon
        :name="displayStore.showIntro ? 'fast-forward' : 'video-camera'"
        class="mr-2"
      />
      {{ displayStore.showIntro ? 'Skip Intro' : 'Intro' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const toggleIntro = () => {
  console.log('Intro toggle button clicked') // Add logging to debug
  displayStore.toggleIntro()
}
</script>
