<template>
  <div class="flex flex-col h-screen w-screen">
    <!-- Header Dashboard -->
    <header-dashboard class="h-20 w-full z-50" />

    <!-- Container for User Navigation and Main Slot -->
    <div class="flex flex-grow">
      <!-- User Navigation: Only appears on large screen -->
      <div v-if="isLargeScreen" class="w-1/4 overflow-y-auto border-r">
        <user-navigation />
      </div>

      <!-- Main Slot -->
      <div class="flex-grow overflow-y-auto">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const isLargeScreen = ref(false) // Default value

if (process.client) {
  const handleResize = () => {
    isLargeScreen.value = window.innerWidth > 1024 // Adjust this number based on what you consider 'large'
  }

  onMounted(() => {
    handleResize() // Initial check
    window.addEventListener('resize', handleResize)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize)
  })
}
</script>
