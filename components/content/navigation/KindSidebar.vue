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
        class="Icon-link-container flex flex-col items-center m-2"
      >
        <NuxtLink
          :to="link.path"
          class="flex flex-col items-center justify-center rounded-2xl text-center hover:scale-110 transition-transform"
        >
          <Icon
            :name="link.icon"
            :class="isSidebarOpen ? 'h-16 w-16' : 'h-12 w-12'"
            class="transition-all"
          ></Icon>
          <span v-show="isSidebarOpen" class="text-sm font-semibold mt-1">
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
import { sidebarLinks } from '../../../../assets/sidebarData' // Import the sidebar data

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
  width: 100vw;
  max-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  overflow-y: auto;
  transition: all 0.3s ease;
}

.sidebarClosed.horizontalSidebar {
  width: 5rem;
  height: 100vh;
  visibility: visible;
  overflow-y: auto;
}

.sidebarOpen.horizontalSidebar {
  width: 16rem;
  max-height: 100vh;
  visibility: visible;
  overflow-y: auto;
}

.sidebarClosed.verticalSidebar {
  width: 0;
  height: 0;
  visibility: hidden;
  overflow: hidden;
}

.sidebarOpen.verticalSidebar {
  width: 100vw;
  height: auto;
  visibility: visible;
  max-height: 100vh;
}

.verticalSidebar .Icon-link-container {
  display: flex;
  justify-content: center;
  flex-direction: row;
  margin-bottom: 0.5rem;
}

button {
  left: 0;
}
</style>