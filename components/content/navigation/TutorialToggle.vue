<template>
  <div
    class="fixed top-30 right-4 z-50 p-1 rounded-lg shadow-md bg-primary hover:bg-accent transition duration-300 cursor-pointer"
    @click="toggleTutorial"
  >
    <!-- Swap icons based on the showTutorial state -->
    <Icon
      v-if="showTutorial"
      name="mdi-information-outline" 
      class="text-base-200 w-6 h-6"
    />
    <Icon
      v-else
      :name="pageIcon" 
      class="text-base-200 w-6 h-6"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

// Access the display store
const displayStore = useDisplayStore()

// Access the content, including page.icon
const { page } = useContent()

const showTutorial = computed(() => displayStore.showTutorial)

// Toggle the tutorial state
const toggleTutorial = () => {
  displayStore.toggleTutorial()
}

// Use a computed value to get the page icon from useContent
const pageIcon = computed(() => page.icon || 'mdi-page-layout-sidebar-right') // Default to an icon if page.icon is missing
</script>

<style scoped>
/* Add styles for the clickable icon */
div {
  display: inline-block;
}
</style>
