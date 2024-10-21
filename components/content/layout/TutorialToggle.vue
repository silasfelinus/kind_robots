<template>
  <!-- Parent Container for Tutorial Toggle -->
  <div
    class="flex justify-center items-center bg-primary hover:bg-accent transition duration-300 cursor-pointer rounded-lg shadow-md p-3"
    @click="toggleTutorial"
  >
    <!-- Toggle Icon -->
    <Icon
      v-if="showTutorial"
      name="mdi-information-outline"
      class="text-base-200 w-8 h-8"
    />
    <Icon v-else :name="pageIcon" class="text-base-200 w-8 h-8" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

// Access the display store
const displayStore = useDisplayStore()

// Access the content, including page.icon
const { page } = useContent()

// Compute the tutorial and icon state
const showTutorial = computed(() => displayStore.showTutorial)

// Toggle the tutorial state
const toggleTutorial = () => {
  displayStore.toggleTutorial()
}

const pageIcon = computed(() => {
  const content = page as { icon?: string }
  return content.icon ? content.icon : 'mdi-page-layout-sidebar-right'
})
</script>

<style scoped>
/* No positioning needed for the toggle since it's now in a natural flow */
</style>
