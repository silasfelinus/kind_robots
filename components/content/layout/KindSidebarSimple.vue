<template>
  <div class="flex">
    <!-- Sidebar -->
    <aside
      v-if="displayStore.sidebarLeft !== 'hidden'"
      class="transition-all duration-300 bg-base-200 hide-scrollbar p-2"
      :style="{
        width: `${sidebarWidth.value}px`,
        maxHeight: `calc(100vh - ${headerHeight}px)`,
        position: 'sticky',
        top: `${headerHeight}px`
      }"
    >
      <div class="p-1">
        <!-- Sidebar Links with Icons and Titles -->
        <NuxtLink
          v-for="link in filteredLinks"
          :key="link.title"
          :to="link.path"
          :style="{ height: `${iconHeight}px`, margin: '1px 0' }"
          class="Icon-link-container flex items-center space-x-2 hover:bg-base-100 hover:scale-105 rounded-xl mt-1 mb-1 p-1"
        >
          <!-- Icon for each link -->
          <Icon
            :name="link.icon"
            class="h-12 w-12 transition-all duration-300 ease-in-out"
          />
          <!-- Only show the link title when the sidebar is fully open -->
          <span
            v-if="isSidebarOpen"
            class="text-sm font-semibold ml-2 transition-opacity duration-300"
          >
            {{ link.title }}
          </span>
        </NuxtLink>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { sidebarLinks } from '@/assets/sidebar'

// Access the display store for the sidebar state
const displayStore = useDisplayStore()

// Computed properties to check the sidebar state
const isSidebarOpen = computed(() => displayStore.sidebarLeft === 'open')

// Sidebar Links
const filteredLinks = computed(() => sidebarLinks)

// Manual width and height calculations for sidebar based on screen size
const sidebarWidth = ref(0)
const headerHeight = ref(70) // Assume a default header height in pixels
const iconHeight = ref(0)

const calculateSidebarWidth = () => {
  const screenWidth = window.innerWidth
  const state = displayStore.sidebarLeft

  // Adjust width based on screen size and sidebar state
  if (screenWidth < 600) {
    // Mobile
    sidebarWidth.value = state === 'open' ? 200 : state === 'compact' ? 60 : 0
  } else if (screenWidth >= 600 && screenWidth < 1024) {
    // Tablet
    sidebarWidth.value = state === 'open' ? 220 : state === 'compact' ? 70 : 0
  } else {
    // Desktop
    sidebarWidth.value = state === 'open' ? 256 : state === 'compact' ? 80 : 0
  }
}

const calculateIconHeight = () => {
  const totalLinks = sidebarLinks.length
  const marginSpace = 10 * totalLinks // Adjust for link margins
  const availableHeight = window.innerHeight - headerHeight.value
  iconHeight.value = (availableHeight - marginSpace) / totalLinks
}

onMounted(() => {
  calculateSidebarWidth()
  calculateIconHeight()

  window.addEventListener('resize', calculateSidebarWidth)
  window.addEventListener('resize', calculateIconHeight)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', calculateSidebarWidth)
  window.removeEventListener('resize', calculateIconHeight)
})
</script>

<style scoped>
/* Hide scrollbar but allow scrolling */
.hide-scrollbar {
  overflow-y: auto;
}
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

aside {
  transition: width 0.3s ease-in-out;
  overflow-y: auto;
  position: sticky; /* Keep the sidebar fixed while scrolling */
  top: 0;
}

.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Interactive hover effects for the links */
.Icon-link-container:hover {
  background-color: var(--bg-base-100);
  transform: scale(1.05);
  transition: all 0.3s ease-in-out;
}
</style>
