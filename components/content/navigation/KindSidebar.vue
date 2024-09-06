<template>
  <div class="relative m-1 p-1">
    <!-- Toggle Button - Positioned at the top-center -->
    <button
      class="absolute top-0 left-1/2 transform -translate-x-1/2 z-40"
      @click="toggleSidebar"
    >
      <Icon
        :name="isSidebarOpen ? 'lucide:sidebar-open' : 'lucide:sidebar'"
        class="h-6 w-6 text-gray-500"
      ></Icon>
    </button>

    <!-- Collapsible Sidebar -->
    <aside
      :class="`sidebar flex flex-wrap justify-center items-start transition-all duration-300 ease-in-out overflow-y-hidden p-1 border rounded-2xl bg-base-200 ${isSidebarOpen ? 'sidebarOpen' : 'sidebarClosed'} ${isVertical ? 'fromTop' : 'fromSide'}`"
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
          :class="[
            'flex flex-col items-center justify-center',
            'rounded-2xl text-center',
            'hover:scale-110 hover:glow-animation',
            isCurrentPage(link.path) ? 'text-gray-400' : 'text-accent',
          ]"
        >
          <Icon
            :name="link.icon"
            :class="isSidebarOpen ? 'icon-large' : 'icon-small'"
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

const layoutStore = useLayoutStore()
const isSidebarOpen = computed(() => layoutStore.isSidebarOpen)
const userStore = useUserStore()
const contentStore = useContentStore()
const showMature = computed(() => userStore.showMatureContent)
const isVertical = ref(false)

const isCurrentPage = (path: string) => contentStore.currentPage?._path === path

const links = [
  { title: 'Home', path: '/', icon: 'line-md:home-md-twotone' },
  { title: 'Add Bot', path: '/addbot', icon: 'fluent:bot-add-20-regular' },
  { title: 'Bot Cafe', path: '/botcafe', icon: 'mdi:chat-processing' },
  {
    title: 'Bot Messages',
    path: '/botmessages',
    icon: 'fluent:chat-multiple-24-regular',
  },
  {
    title: 'Pitch Manager',
    path: '/pitch',
    icon: 'fluent:chat-bubbles-question-16-regular',
  },
  {
    title: 'Art Maker',
    path: '/artmaker',
    icon: 'game-icons:easel',
  },
  { title: 'Hot or Not?', path: '/hotornot', icon: 'emojione-monotone:fire' },
  { title: 'Art Gallery', path: '/artgallery', icon: 'mdi:palette' },
  {
    title: 'Art Challenge',
    path: '/artchallenge',
    icon: 'game-icons:tabletop-players',
  },
  {
    title: 'Brainstorm',
    path: '/brainstorm',
    icon: 'game-icons:robot-antennas',
  },
  {
    title: 'Memory Match',
    path: '/memory',
    icon: 'material-symbols:art-track-outline-rounded',
  },
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: 'mingcute:settings-6-fill',
  },
  {
    title: 'Mature Content',
    path: '/mature',
    icon: 'fxemoji:lips',
    condition: 'showMature',
  },
  {
    title: 'Wonderlab',
    path: '/wonderlab',
    icon: 'game-icons:gear-hammer',
    condition: 'showMature',
  },
  {
    title: 'About',
    path: '/about',
    icon: 'game-icons:abstract-037',
  },
]

function toggleSidebar() {
  layoutStore.toggleSidebar()
}

const filteredLinks = computed(() => {
  return links.filter(
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
</script>

<style scoped>
/* Sidebar Styles */
.sidebar {
  position: absolute;
  top: calc(10vh + 1rem); /* Adjust to place below the header with padding */
  left: 0;
  z-index: 30;
  width: 100vw; /* Always respect viewport width */
  height: calc(100vh - 10vh - 2rem); /* Sidebar fills remaining space below the header */
  display: flex;
  justify-content: center;
  align-items: flex-start;
  flex-wrap: wrap;
}

.sidebarClosed {
  height: auto;
}

.sidebarOpen {
  flex-wrap: wrap;
  align-items: flex-start;
}

/* Icons are always visible */
.icon-small {
  width: 3rem;
  height: 3rem;
}

.icon-large {
  width: 4rem;
  height: 4rem;
}

/* When the sidebar is open, text shows below the icons */
@media (max-width: 768px) {
  .sidebar {
    top: 10vh; /* Still start below the header */
    width: 100vw;
    height: auto;
    transition: height 0.3s ease-in-out;
  }
}
</style>