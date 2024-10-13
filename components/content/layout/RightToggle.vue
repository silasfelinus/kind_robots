<template>
  <div>
    <!-- Toggle button for right sidebar and tutorial -->
    <button
      class="flex items-center justify-center text-accent rounded-lg shadow-lg hover:bg-secondary text-lg h-10 w-10"
      @click="toggleTutorialSidebar"
    >
      {{ rightIconText }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const isMobile = computed(() => displayStore.isMobileViewport)

const rightIconText = computed(() => {
  return displayStore.sidebarRightState === 'hidden' ? '<' : '>'
})

const toggleTutorialSidebar = () => {
  displayStore.toggleTutorial()

  if (!isMobile.value) {
    displayStore.sidebarRightState =
      displayStore.sidebarRightState === 'hidden' ? 'open' : 'hidden'
  }
}
</script>

<style scoped>
/* No additional styles needed, using Tailwind CSS classes */
</style>
