<template>
  <div class="relative h-screen flex flex-col">
    <!-- Header (of undetermined height) -->
    <header class="relative">
      <!-- Your header content goes here -->
      <button class="absolute top-0 left-0 z-40" @click="toggleSidebar">
        <Icon
          :name="isSidebarOpen ? 'lucide:sidebar-open' : 'lucide:sidebar'"
          class="h-6 w-6 text-gray-500"
        />
      </button>
    </header>

    <!-- Collapsible Sidebar -->
    <aside
      :class="`flex flex-col justify-start transition-all duration-300 ease-in-out border rounded-2xl bg-base-200 ${isSidebarOpen ? 'sidebarOpen' : 'sidebarClosed'} ${isVertical ? 'verticalSidebar' : 'horizontalSidebar'}`"
      :aria-hidden="isSidebarOpen ? 'false' : 'true'"
      class="flex-grow overflow-y-auto"
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

      <!-- Optional margin at the bottom -->
      <div class="w-full mb-4"></div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useUserStore } from './../../../stores/userStore'
import { useContentStore } from './../../../stores/contentStore'
import { useLayoutStore } from './../../../stores/layoutStore'
import { sidebarLinks } from './../../../assets/sidebar' // Import the sidebar data

const layoutStore = useLayoutStore()
const isSidebarOpen = computed(() => layoutStore.isSidebarOpen)
const userStore = useUserStore()
const contentStore = useContentStore()
const showMature = computed(() => userStore.showMatureContent)
const isVertical = ref(false)

const isCurrentPage = (path: string) => contentStore.currentPage?._path === path

const filteredLinks = computed(() => {
  return sidebarLinks.filter(
    (link) =>
      !link.condition || (link.condition === 'showMature' && showMature.value),
  )
})

const checkVertical = () => {
  isVertical.value = window.innerHeight > window.innerWidth
}

onMounted(() => {
  checkVertical()
  window.addEventListener('resize', checkVertical)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkVertical)
})

function toggleSidebar() {
  layoutStore.toggleSidebar()
}
</script>

<style scoped>
/* Collapsed sidebar - horizontal */
.sidebarClosed.horizontalSidebar {
  @apply w-20 md:w-16 sm:w-14;
}

/* Opened sidebar - horizontal */
.sidebarOpen.horizontalSidebar {
  @apply w-64 md:w-48 sm:w-36;
}

/* Collapsed sidebar - vertical */
.sidebarClosed.verticalSidebar {
  @apply w-0 h-0 overflow-hidden;
}

/* Opened sidebar - vertical */
.sidebarOpen.verticalSidebar {
  @apply w-full;
}

/* Additional button styling */
button {
  @apply absolute top-0 left-0 z-40;
}
</style>