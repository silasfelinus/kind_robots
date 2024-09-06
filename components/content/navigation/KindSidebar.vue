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

#### Updated CSS:

```css
<style scoped>
/* Sidebar Styles */
.sidebar {
  position: relative; /* Relative positioning for proper flow below header */
  width: 100vw; /* Respect viewport width */
  height: auto;
  min-height: 20vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  flex-wrap: wrap;
  overflow-y: auto;
  transition: all 0.3s ease;
}

.sidebarClosed {
  width: 100%; /* When closed, sidebar will be fully hidden on vertical screens */
  height: 0;
  visibility: hidden;
  transition: height 0.3s ease, visibility 0.3s ease;
}

.sidebarOpen {
  width: 100vw; /* Take up full width on wider screens */
  height: auto; /* Expand based on content */
  visibility: visible;
}

/* Icons always visible when open */
.icon-small {
  width: 3rem;
  height: 3rem;
}

.icon-large {
  width: 4rem;
  height: 4rem;
}

/* Toggle button should always remain visible */
button {
  visibility: visible;
}

/* For vertical screens, completely collapse the sidebar */
@media (max-width: 768px) {
  .sidebarClosed {
    width: 0;
    height: 0;
    visibility: hidden;
  }

  .sidebarOpen {
    min-height: 15vh;
    height: auto;
    flex-wrap: wrap;
    transition: height 0.3s ease;
  }
}
</style>