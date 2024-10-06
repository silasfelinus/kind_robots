<template>
  <div
    class="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-primary hover:bg-accent transition duration-300 cursor-pointer rounded-lg shadow-md p-1"
    :style="{ bottom: footerHeight }"
    @click="toggleTutorial"
  >
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
import { useContent } from '@/composables/useContent'

// Access the display store
const displayStore = useDisplayStore()

// Access the content, including page.icon
const { page } = useContent()

// Footer height from displayStore
const footerHeight = computed(() => displayStore.footerHeight)

// Compute the tutorial and icon state
const showTutorial = computed(() => displayStore.showTutorial)

// Toggle the tutorial state
const toggleTutorial = () => {
  displayStore.toggleTutorial()
}

// Use a computed value to get the page icon from useContent
const pageIcon = computed(() => page.icon || 'mdi-page-layout-sidebar-right')
</script>

<style scoped>
div {
  display: inline-block;
  position: absolute;
}
</style>
