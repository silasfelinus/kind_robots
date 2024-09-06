<template>
  <div class="relative m-1 p-1">
    <!-- Toggle Button - Always at the top-center on small/vertical screens -->
    <button class="absolute top-0 left-1/2 transform -translate-x-1/2 z-40" @click="toggleSidebar">
      <Icon
        :name="isSidebarOpen ? 'lucide:sidebar' : 'lucide:sidebar-open'"
        class="h-4 w-4 text-gray-500"
      ></Icon>
    </button>

    <!-- Collapsible Sidebar -->
    <aside
      :class="`sidebar flex-col transition-all duration-300 ease-in-out overflow-y-scroll p-1 border rounded-2xl bg-base-200 ${isSidebarOpen ? 'sidebarOpen' : 'sidebarClosed'} ${isVertical ? 'fromTop' : 'fromSide'}`"
      :aria-hidden="isSidebarOpen ? 'false' : 'true'"
    >
      <!-- Sidebar Links with Icons and Titles -->
      <div
        v-for="link in filteredLinks"
        :key="link.title"
        class="Icon-link-container"
        @click="handleLinkClick"
      >
        <NuxtLink
          :to="link.path"
          :class="[
            'flex',
            'items-center',
            'justify-start',
            'rounded-2xl',
            'text-center',
            'hover:scale-110',
            'hover:glow-animation',
            'm-1',
            isCurrentPage(link.path) ? 'text-gray-400' : 'text-gray-900',
            'w-full',
          ]"
        >
          <Icon
            :name="link.icon"
            class="icon-base mr-1 cursor-pointer transition-shadow"
          ></Icon>
          <span v-show="isSidebarOpen" class="text-lg font-semibold">
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

function handleLinkClick() {
  if (isSidebarOpen.value) {
    toggleSidebar()
  }
}

const filteredLinks = computed(() => {
  return links.filter(
    (link) =>
      !link.condition || (link.condition === 'showMature' && showMature.value),
  )
})

const isCurrentPage = (path: string) => {
  return contentStore.currentPage?._path === path
}

// Function to check if layout is vertical
const checkVertical = () => {
  isVertical.value = window.innerHeight > window.innerWidth
}

onMounted(() => {
  checkVertical() // Initial check when component is mounted
  window.addEventListener('resize', checkVertical) // Update on window resize
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkVertical) // Cleanup event listener
})
</script>

<style scoped>
/* Sidebar Styles */
.sidebar {
  position: fixed;
  z-index: 30;
  height: 100vh;
  width: 16rem; /* Default width when open */
}

.sidebarClosed {
  width: 0; /* Hidden when closed */
}

.sidebarOpen {
  width: 16rem;
}

.fromSide {
  left: 0; /* Default position when from the side */
  top: 0;
}

.fromTop {
  top: 0;
  left: 0;
  width: 100vw;
  height: 10rem; /* Adjusted height when open from top */
}

@media (max-width: 768px) {
  /* On small screens or when vertical */
  .sidebar {
    top: 0;
    left: 0;
    width: 100vw;
    height: 10rem;
    transition: height 0.3s ease-in-out;
  }
}
</style>