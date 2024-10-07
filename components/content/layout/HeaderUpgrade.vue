<template>
  <header
    class="flex flex-col md:flex-row fixed justify-between rounded-2xl border p-2 bg-base-300 z-20 space-y-2 md:space-y-0"
    :style="{
      height: displayStore.headerHeight + 'vh',
      width: '90%',
    }"
  >
    <!-- Avatar, Title, Subtitle, and Login Button Section (Vertical on small screens) -->
    <div class="flex flex-col md:flex-row items-center justify-between w-full space-y-2 md:space-y-0">
      <!-- Avatar -->
      <avatar-image
        alt="User Avatar"
        class="max-h-full min-h-14 aspect-square rounded-2xl"
      />
      
      <!-- Title, Subtitle, and Login Button Column -->
      <div class="flex flex-col items-center justify-center flex-grow text-center md:flex-row md:space-x-3">
        <div class="flex flex-col items-center">
          <h1 class="text-sm md:text-lg text-primary font-semibold truncate">
            The {{ page.title || 'Room' }} Room
          </h1>
          <h2 class="text-xs md:text-sm text-accent italic truncate">
            {{ subtitle }}
          </h2>
        </div>

        <!-- Login Button -->
        <login-button class="w-8 h-8 md:ml-4" />
      </div>
    </div>

    <!-- Non-login Icons (Vertical on small screens, horizontal on medium and larger screens) -->
    <div class="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-2">
      <theme-toggle class="w-8 h-8" />
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
