<template>
  <!-- Collapsible Sidebar -->
  <aside
    :style="{
      width: sidebarWidth,
      visibility: isSidebarOpen ? 'visible' : 'hidden',
      maxHeight: `${availableSidebarHeight}vh`, // Sidebar takes the remaining space after header
      overflowY: 'auto', // Scrollable if content overflows
    }"
    class="transition-all duration-500 ease-in-out border rounded-2xl bg-base-200"
    :aria-hidden="!isSidebarOpen"
  >
    <!-- Sidebar Links with Icons and Titles -->
    <div
      v-for="link in filteredLinks"
      :key="link.title"
      :style="{
        height: `${iconHeight}px`,
        margin: '5px 0',
      }"
      class="Icon-link-container flex items-center justify-center space-x-2 transition-all duration-300 ease-in-out hover:bg-base-100 hover:scale-105 rounded-xl p-2"
    >
      <NuxtLink
        :to="link.path"
        class="flex items-center justify-center rounded-2xl text-center hover:scale-110 transition-transform"
      >
        <Icon
          :name="link.icon"
          :class="[isSidebarOpen ? 'h-16 w-16' : 'h-12 w-12']"
          class="transition-all duration-300 ease-in-out"
        />
        <span
          v-show="isSidebarOpen"
          class="text-sm font-semibold ml-2 transition-opacity duration-300"
          >{{ link.title }}</span
        >
      </NuxtLink>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { sidebarLinks } from '@/assets/sidebar' // Import the sidebar data

const displayStore = useDisplayStore()

const sidebarWidth = computed(() => displayStore.sidebarVw)
const isSidebarOpen = computed(() => displayStore.sidebarLeft !== 'hidden')

// Calculate the total available sidebar height (viewport - header height in vh)
const availableSidebarHeight = computed(() => 100 - displayStore.headerVh)

// Calculate the height of each icon based on the number of links and available height
const iconHeight = computed(() => {
  const totalLinks = sidebarLinks.length
  const marginSpace = 10 * totalLinks // Example: 10px margin for each link
  return (
    ((availableSidebarHeight.value * window.innerHeight) / 100 - marginSpace) /
    totalLinks
  )
})

// Filter links (you can add conditions if needed, like mature content)
const filteredLinks = computed(() => sidebarLinks)

onMounted(() => {
  displayStore.initializeViewportWatcher()
})

onBeforeUnmount(() => {
  displayStore.removeViewportWatcher()
})
</script>
