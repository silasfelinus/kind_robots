<template>
  <header
    class="flex flex-col fixed justify-between rounded-2xl border p-2 bg-base-300 z-20 space-y-2"
    :style="{
      height: displayStore.headerHeight + 'vh',
      width: 90%,
    }"
  >
    <!-- Avatar, Title, and Subtitle Section -->
    <div class="flex items-center space-x-3 w-full">
      <avatar-image
        alt="User Avatar"
        class="max-h-full min-h-14 aspect-square rounded-2xl"
      />
      <!-- Title and Subtitle Column -->
      <div class="flex flex-col items-center justify-center flex-grow">
        <h1 class="text-lg text-primary font-semibold text-center truncate w-full">
          The {{ page.title || 'Room' }} Room
        </h1>
        <h2 class="text-sm text-accent italic text-center truncate w-full">
          {{ subtitle }}
        </h2>
      </div>
    </div>

    <!-- Second Row for Smaller Icons -->
    <div class="flex justify-center flex-wrap space-x-2 w-full">
      <login-button class="w-8 h-8" />
      <theme-icon class="w-8 h-8" />
      <tutorial-toggle class="w-8 h-8" />
      <butterfly-toggle class="w-8 h-8" />
      
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

// Access display store
const displayStore = useDisplayStore()

const { page } = useContent()
const subtitle = computed(
  () => page.value?.subtitle ?? 'Welcome to Kind Robots',
)
</script>

<style scoped>
/* Additional styling if needed */
</style>
