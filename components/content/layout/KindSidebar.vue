<template>
  <!-- Collapsible Sidebar -->
  <aside
    :style="{
      width: isSidebarHidden ? '0' : sidebarWidth + 'vw',
      display: isSidebarHidden ? 'none' : 'block', // Use display to fully hide the sidebar
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
        margin: '1px 0',
      }"
      class="Icon-link-container flex items-left justify-left space-x-2 transition-all duration-300 ease-in-out hover:bg-base-100 hover:scale-105 rounded-xl p-2"
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
        >
          {{ link.title }}
        </span>
      </NuxtLink>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { sidebarLinks } from '@/assets/sidebar'

const displayStore = useDisplayStore()

// Sidebar state based on the displayStore
const sidebarWidth = computed(() => displayStore.sidebarVw)
const isSidebarOpen = computed(() => displayStore.sidebarLeft === 'open')
const isSidebarCompact = computed(() => displayStore.sidebarLeft === 'compact')
const isSidebarHidden = computed(() => displayStore.sidebarLeft === 'hidden')

// Adjust height calculations based on window size and available space
const availableSidebarHeight = ref(100 - displayStore.headerVh - 2)
const iconHeight = ref(0)

onMounted(() => {
  const calculateIconHeight = () => {
    if (typeof window !== 'undefined') {
      const totalLinks = sidebarLinks.length
      const marginSpace = 10 * totalLinks // Adjust for link margins

      const sidebarHeightInPx =
        (availableSidebarHeight.value * window.innerHeight) / 100
      iconHeight.value = (sidebarHeightInPx - marginSpace) / totalLinks
    }
  }

  calculateIconHeight()

  window.addEventListener('resize', calculateIconHeight)

  onBeforeUnmount(() => {
    window.removeEventListener('resize', calculateIconHeight)
  })
})

// Filter links (can add conditions here if needed)
const filteredLinks = computed(() => sidebarLinks)
</script>

<style scoped>
/* Hide scrollbar but keep content scrollable */
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
</style>
