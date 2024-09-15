<template>
  <div class="relative h-screen flex flex-col">
    <!-- Header with sidebar toggle -->
    <header class="relative">
      <button class="absolute top-0 left-0 z-40" @click="toggleSidebar">
        <Icon
          :name="isSidebarOpen ? 'lucide:sidebar-open' : 'lucide:sidebar'"
          class="h-6 w-6 text-gray-500"
        />
      </button>
    </header>

    <!-- Collapsible Sidebar -->
    <aside
      :class="[
        isSidebarOpen ? 'sidebarOpen' : 'sidebarClosed',
        isVertical ? 'verticalSidebar' : 'horizontalSidebar',
      ]"
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
            :class="[
              isSidebarOpen ? 'h-16 w-16' : 'h-12 w-12',
              isCurrentPage(link.path) ? 'text-accent' : 'text-gray-500',
            ]"
            class="transition-all"
          />
          <span
            v-show="isSidebarOpen"
            :class="isCurrentPage(link.path) ? 'text-accent' : 'text-gray-500'"
            class="text-sm font-semibold ml-2"
          >
            {{ link.title }}
          </span>
        </NuxtLink>
      </div>

      <!-- Optional margin at the bottom with responsive handling -->
      <div class="w-full mt-auto mb-48"></div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { sidebarLinks } from '@/assets/sidebar' // Import the sidebar data

const displayStore = useDisplayStore()
const isSidebarOpen = computed(() => displayStore.sidebarLeft === 'open') // Use displayStore for sidebar status
const toggleSidebar = () => displayStore.toggleSidebar('sidebarLeft') // Define the toggle function for the sidebar

const isVertical = ref(false)

// Check if the current page matches the given path
const isCurrentPage = (path: string) => {
  const currentPath = window.location.pathname
  return currentPath === path
}

// Filter links (you can add conditions if needed, like mature content)
const filteredLinks = computed(() => sidebarLinks)

// Handle sidebar orientation based on screen size
const checkVertical = () => {
  isVertical.value = window.innerHeight > window.innerWidth
}

// Add event listeners for screen resizing
onMounted(() => {
  checkVertical()
  window.addEventListener('resize', checkVertical)
})

// Cleanup event listeners when the component is destroyed
onBeforeUnmount(() => {
  window.removeEventListener('resize', checkVertical)
})
</script>

<style scoped>
/* Collapsed sidebar - horizontal */
.sidebarClosed.horizontalSidebar {
  width: 4rem; /* Adjust the width as needed for the collapsed state */
}

/* Opened sidebar - horizontal */
.sidebarOpen.horizontalSidebar {
  width: 16rem; /* Adjust the width for the open state */
}

/* Collapsed sidebar - vertical */
.sidebarClosed.verticalSidebar {
  height: 0; /* Hide completely in the vertical mode */
  overflow: hidden;
}

/* Opened sidebar - vertical */
.sidebarOpen.verticalSidebar {
  width: 100%; /* Full width in vertical mode */
  height: 100vh; /* Full height for vertical mode */
}
</style>
