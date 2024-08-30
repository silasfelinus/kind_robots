<template>
  <div class="relative m-1 p-1">
    <button class="absolute top-0 left-3 z-40" @click="toggleSidebar">
      <Icon
        :name="isSidebarOpen ? 'lucide:sidebar' : 'lucide:sidebar-open'"
        class="h-4 w-4 text-gray-500"
      ></Icon>
    </button>
    <!-- Collapsible Sidebar -->
    <aside
      :class="`sidebar flex-col flex-shrink-0 transition-width duration-300 ease-in-out overflow-y-scroll mt-2 p-1 border rounded-2xl bg-base-200 ${isSidebarOpen ? 'sidebarOpen' : 'sidebarClosed'}`"
      :aria-hidden="isSidebarOpen ? 'false' : 'true'"
    >
      <!-- Sidebar Links with Icons and Titles -->
      <div
        v-for="link in filteredLinks"
        :key="link.title"
        class="Icon-link-container"
        @click="toggleSidebar"
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
            isCurrentPage(link.path) ? 'text-gray-400' : 'text-gray-900',
            'w-full',
          ]"
        >
          <Icon
            :name="link.icon"
            class="icon-base mr-1 cursor-pointer transition-shadow"
          ></Icon>
          <span v-show="isSidebarOpen" class="text-lg font-semibold">{{
            link.title
          }}</span>
        </NuxtLink>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from './../../../stores/userStore'
import { useContentStore } from './../../../stores/contentStore'
import { useLayoutStore } from './../../../stores/layoutStore'

const layoutStore = useLayoutStore()
const isSidebarOpen = computed(() => layoutStore.isSidebarOpen)
const userStore = useUserStore()
const contentStore = useContentStore()
const showMature = computed(() => userStore.showMatureContent)
const links = [
  { title: 'Home', path: '/', icon: 'line-md:home-md-twotone' },
  { title: 'Add Bot', path: '/addbot', icon: 'fluent:bot-add-20-regular' },
  { title: 'Chat with Bots', path: '/botcafe', icon: 'mdi:chat-processing' },
  {
    title: 'Bot Messages',
    path: '/botmessages',
    icon: 'fluent:chat-multiple-24-regular',
  },
  { title: 'Hot or Not?', path: '/hotornot', icon: 'emojione-monotone:fire' },
  { title: 'Art Gallery', path: '/artgallery', icon: 'mdi:palette' },
  { title: 'Art Challenge', path: '/artchallenge', icon: 'game-icons:tabletop-players' },
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

const isCurrentPage = (path: string) => {
  return contentStore.currentPage?._path === path
}
</script>

<style>
/* Basic styles for icon containers and hover effects */
.Icon-link-container {
  width: 100%;
  padding: 0.5rem;
}

.Icon-link-container .hover:glow-animation:hover {
  animation: glow 1.5s infinite;
}

@keyframes glow {
  0%,
  100% {
    box-shadow: 0 0 5px rgba(255, 255, 255, 0.75);
  }
  50% {
    box-shadow:
      0 0 20px rgba(255, 115, 253, 0.75),
      0 0 30px rgba(255, 115, 253, 0.75);
  }
}

/* Adjusting sidebar and text styles */
.sidebar {
  transition:
    width 0.3s ease-in-out,
    padding 0.3s ease-in-out;
  backface-visibility: hidden;
  transform: translateZ(0);
  will-change: overflow;
  transition: width 0.3s ease-in-out;
  -webkit-overflow-scrolling: touch;
  overflow-y: auto; /* Ensures scroll */
  max-height: 83vh;
}

.nuxt-link {
  display: flex;
  align-items: center;
  width: 100%;
  color: inherit;
  text-decoration: none;
}

.nuxt-link:hover {
  text-decoration: none;
}

/* Small devices */
@media (max-width: 768px) {
  .sidebarClosed {
    width: 15vw;
  }
  .sidebarOpen {
    width: 30vw;
  }
  .icon-base {
    width: 48px;
    height: 48px;
  }
}

/* Medium devices */
@media (min-width: 769px) {
  .sidebarClosed {
    width: 8vw;
  }
  .sidebarOpen {
    width: 23vw;
  }
  .icon-base {
    width: 48px;
    height: 48px;
  }
}

/* Large devices */
@media (min-width: 1025px) {
  .sidebarClosed {
    width: 8vw;
  }
  .sidebarOpen {
    width: 15vw;
  }
  .icon-base {
    width: 48px;
    height: 48px;
  }
}

/* Extra large devices */
@media (min-width: 1441px) {
  .sidebarClosed {
    width: 5vw;
  }
  .sidebarOpen {
    width: 8vw;
  }
  .icon-base {
    width: 64px;
    height: 64px;
  }
}
</style>
