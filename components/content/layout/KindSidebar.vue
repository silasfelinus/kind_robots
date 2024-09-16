<template<template>
  <!-- Collapsible Sidebar -->
  <aside
    :style="{
      width: `${displayStore.sidebarVw}vw`,
      visibility: isSidebarOpen ? 'visible' : 'hidden',
      maxHeight: '100vh', // Ensure the sidebar stays within the viewport
      overflowY: 'auto', // Enable scrolling if content overflows
    }"
    class="transition-all duration-300 ease-in-out border rounded-2xl bg-base-200"
    :aria-hidden="!isSidebarOpen"
  >
    <!-- Sidebar Links with Icons and Titles -->
    <div
      v-for="link in filteredLinks"
      :key="link.title"
      class="Icon-link-container flex items-center justify-center space-x-2 m-2"
    >
      <NuxtLink
        :to="link.path"
        class="flex items-center justify-center rounded-2xl text-center hover:scale-110 transition-transform"
      >
        <Icon
          :name="link.icon"
          :class="[isSidebarOpen ? 'h-16 w-16' : 'h-12 w-12']"
          class="transition-all"
        />
        <span v-show="isSidebarOpen" class="text-sm font-semibold ml-2">{{
          link.title
        }}</span>
      </NuxtLink>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { sidebarLinks } from '@/assets/sidebar' // Import the sidebar data

const displayStore = useDisplayStore()
const isSidebarOpen = computed(() => displayStore.sidebarLeft === 'open')

// Toggle the sidebar
const toggleSidebar = () => displayStore.toggleSidebar('sidebarLeft')

// Filter links (you can add conditions if needed, like mature content)
const filteredLinks = computed(() => sidebarLinks)
onMounted(() => {
  displayStore.loadState()
  displayStore.initializeViewportWatcher()
})

onBeforeUnmount(() => {
  displayStore.removeViewportWatcher()
})
</script>
