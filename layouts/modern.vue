<template>
  <div class="flex flex-row h-screen text-gray-800 p-4 space-x-4">
    <!-- Sidebar for navigation, profile info, etc. -->
    <div class="relative flex-shrink-0 w-full md:w-1/5 overflow-y-auto flex flex-col items-start">
      <!-- Layout Selector - Centered Vertically -->
      <div flex flex-row>
        <layout-selector class="self-center mt-2 mb-4 items-center" />
        <theme-selector class="self-center mt-2 mb-4 items-center" />
      </div>

      <AppSidebar class="self-center mt-2 mb-4" />
    </div>

    <!-- Main content area. This is where you insert content specific to the route or view. -->
    <div class="flex-grow overflow-y-auto relative">
      <slot />

      <!-- Page Title Overlay -->
      <div class="absolute top-4 right-4 bg-base-100 p-2 rounded shadow-lg">
        The {{ page.title }} Room
      </div>
      <login-toggle />

      <!-- Show Tooltip Icon -->
      <button
        class="fixed bottom-4 right-[calc(25% + 4rem)] flex items-center space-x-2"
        @click="toggleTooltip"
      >
        <icon name="fontisto:lightbulb" class="text-2xl text-gray-700" />
        <span v-if="showTooltip">Hide Tooltip</span>
        <span v-else>Show Tooltip</span>
      </button>

      <!-- Hideable Container for Streaming Tooltip -->
      <div
        v-show="showTooltip"
        class="fixed bottom-16 left-[calc(25% + 4rem)] bg-base-100 p-4 rounded shadow-lg max-w-[33%]"
      >
        <streaming-tooltip :tooltip="page.tooltip" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const { page } = useContent()
useContentHead(page)

// New ref to manage the visibility of the tooltip container
const showTooltip = ref(true)

// Function to toggle the visibility of the tooltip container
const toggleTooltip = () => {
  showTooltip.value = !showTooltip.value
}
</script>

<style scoped>
/* Ensure sidebar and main content scroll when content is too long. */
.overflow-y-auto {
  overflow-y: auto;
}
</style>
