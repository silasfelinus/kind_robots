<template>
  <div class="relative m-1 p-1">
    <!-- Toggle Button - Positioned on the left side -->
    <button
      class="absolute top-0 left-0 z-40"
      @click="toggleSidebar"
    >
      <Icon
        :name="isSidebarOpen ? 'lucide:sidebar-open' : 'lucide:sidebar'"
        class="h-6 w-6 text-gray-500"
      ></Icon>
    </button>

    <!-- Collapsible Sidebar -->
    <aside
      :class="`sidebar flex flex-wrap justify-center items-start transition-all duration-300 ease-in-out p-2 border rounded-2xl bg-base-200 ${isSidebarOpen ? 'sidebarOpen' : 'sidebarClosed'} ${isVertical ? 'verticalSidebar' : 'horizontalSidebar'}`"
      :aria-hidden="isSidebarOpen ? 'false' : 'true'"
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
            :class="isSidebarOpen ? 'h-16 w-16' : 'h-12 w-12'"
            class="transition-all"
          ></Icon>
          <span v-show="isSidebarOpen" class="text-sm font-semibold ml-2">
            {{ link.title }}
          </span>
        </NuxtLink>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useUserStore } from './../../../stores/userStore'
import { useContentStore } from './../../../stores/contentStore'
import { useLayoutStore } from './../../../stores/layoutStore'
import { sidebarLinks } from './../../../assets/sidebarData' // Import the sidebar data

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
/* Sidebar Styles */
.sidebar {
  @apply w-full max-h-screen flex justify-center items-start overflow-y-auto transition-all ease-in-out;
}

.sidebarClosed.horizontalSidebar {
  @apply w-20 h-screen overflow-y-auto;
}

.sidebarOpen.horizontalSidebar {
  @apply w-64 max-h-screen overflow-y-auto;
}

.sidebarClosed.verticalSidebar {
  @apply w-0 h-0 overflow-hidden;
}

.sidebarOpen.verticalSidebar {
  @apply w-full max-h-screen;
}

.verticalSidebar .Icon-link-container {
  @apply flex justify-around items-center w-full space-x-2;
}

button {
  @apply absolute top-0 left-0 z-40;
}
</style>