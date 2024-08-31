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
</script>
