<template>
  <div class="flex">
 
    <!-- Main Content Area -->
    <main class="flex-grow p-2">
      <div>
      <div class="p-1">
        <h2 class="text-lg font-semibold mb-4">Sidebar Training</h2>
        <!-- Sidebar Links with Icons and Titles -->
        <div
          v-for="link in filteredLinks"
          :key="link.title"
          :style="{ height: `${iconHeight}px`, margin: '1px 0' }"
          class="Icon-link-container flex items-center space-x-2 hover:bg-base-100 hover:scale-105 rounded-xl p-1"
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
        </div>
      </div>
      </div>
    </main>
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

// Adjust height calculations based on window size and available space
const availableSidebarHeight = ref(100 - 10) // Assume header height = 10vh for now
const iconHeight = ref(0)

onMounted(() => {
  const calculateIconHeight = () => {
    const totalLinks = sidebarLinks.length
    const marginSpace = 10 * totalLinks // Adjust for link margins
    const sidebarHeightInPx = (availableSidebarHeight.value * window.innerHeight) / 100
    iconHeight.value = (sidebarHeightInPx - marginSpace) / totalLinks
  }

  calculateIconHeight()

  window.addEventListener('resize', calculateIconHeight)

  onBeforeUnmount(() => {
    window.removeEventListener('resize', calculateIconHeight)
  })
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
