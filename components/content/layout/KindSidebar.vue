<template>
  <!-- Collapsible Sidebar -->
  <aside
    :style="{
      width: isSidebarHidden ? '0vw' : sidebarWidth + 'vw',
      visibility: isSidebarHidden ? 'hidden' : 'visible',
      maxHeight: `${availableSidebarHeight}vh`, // Sidebar takes the remaining space after header
    }"
    class="transition-all duration-500 ease-in-out bg-base-200 hide-scrollbar"
    :aria-hidden="isSidebarHidden"
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
          :class="[
            isSidebarOpen
              ? 'h-12 w-12'
              : isSidebarCompact
                ? 'h-10 w-10'
                : 'h-8 w-8',
          ]"
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
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { sidebarLinks } from '@/assets/sidebar' // Import the sidebar data

const displayStore = useDisplayStore()

// Sidebar state based on the displayStore
const sidebarWidth = computed(() => displayStore.sidebarVw)
const isSidebarOpen = computed(() => displayStore.sidebarLeft === 'open')
const isSidebarCompact = computed(() => displayStore.sidebarLeft === 'compact')
const isSidebarHidden = computed(() => displayStore.sidebarLeft === 'hidden')

// Reduce the availableSidebarHeight slightly (e.g., by 2%) to prevent cut-off issues
const availableSidebarHeight = ref(100 - displayStore.headerVh - 2) // Reduced height by 2% for safety
const iconHeight = ref(0)

onMounted(() => {
  const calculateIconHeight = () => {
    if (typeof window !== 'undefined') {
      const totalLinks = sidebarLinks.length
      const marginSpace = 10 * totalLinks // Example: 10px margin for each link

      // Calculate the total sidebar height in pixels after accounting for the header and the extra margin
      const sidebarHeightInPx =
        (availableSidebarHeight.value * window.innerHeight) / 100

      // Reduce the height by 5px per link for safety room
      iconHeight.value = (sidebarHeightInPx - marginSpace - 5) / totalLinks
    }
  }

  // Initial calculation on mount
  calculateIconHeight()

  // Update calculations on resize
  window.addEventListener('resize', calculateIconHeight)

  // Cleanup on component unmount
  onBeforeUnmount(() => {
    window.removeEventListener('resize', calculateIconHeight)
  })
})

// Filter links (you can add conditions if needed, like mature content)
const filteredLinks = computed(() => sidebarLinks)
</script>

<style scoped>
/* Hide scrollbar but keep content scrollable */
.hide-scrollbar {
  overflow-y: auto;
}
.hide-scrollbar::-webkit-scrollbar {
  display: none; /* Chrome, Safari, WebKit */
}
.hide-scrollbar {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}
</style>
