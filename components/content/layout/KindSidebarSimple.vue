<template>
  <div class="flex">
    <!-- Left Sidebar -->
    <aside
      v-if="displayStore.sidebarLeftState !== 'hidden'"
      class="transition-all duration-300 rounded-2xl hide-scrollbar p-1 fixed top-0 left-0 overflow-y-auto"
      :class="{
        'w-1/6': displayStore.sidebarLeftState === 'open',
        'w-1/12': displayStore.sidebarLeftState === 'compact',
      }"
      :style="{
        height: `calc(100vh - ${displayStore.headerVh}vh - ${displayStore.footerVh}vh)`,
      }"
    >
      <!-- Sidebar Links with Icons and Titles -->
      <div
        v-for="link in hardcodedLinks"
        :key="link.title"
        class="Icon-link-container flex items-center space-x-2 hover:bg-primary hover:scale-110 rounded-xl p-2"
      >
        <!-- Navigation click event -->
        <a
          class="flex items-center cursor-pointer"
          @click.prevent="navigate(link.path)"
        >
          <!-- Icon for each link -->
          <Icon
            :name="link.icon"
            class="h-6 w-6 md:h-12 md:w-12 transition-all duration-300 ease-in-out text-accent"
          />
          <!-- Only show the link title when the sidebar is fully open -->
          <span
            v-if="displayStore.sidebarLeftState === 'open'"
            class="text-xs md:text-md lg:text-lg font-semibold ml-2 transition-opacity duration-300"
          >
            {{ link.title }}
          </span>
        </a>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { useDisplayStore } from '@/stores/displayStore'
import { useRouter } from 'vue-router'

// Hardcoded sidebar links
const hardcodedLinks = [
  { title: 'Home', path: '/', icon: 'line-md:home-md-twotone' },
  { title: 'Bot Cafe', path: '/botcafe', icon: 'fluent:bot-add-20-regular' },
  {
    title: 'Prompt Factory',
    path: '/pitch',
    icon: 'fluent:chat-bubbles-question-16-regular',
  },
  { title: 'Art Lab', path: '/artmaker', icon: 'game-icons:easel' },
  {
    title: 'Memory Match',
    path: '/memory',
    icon: 'material-symbols:art-track-outline-rounded',
  },
  { title: 'Wonderlab', path: '/wonderlab', icon: 'game-icons:gear-hammer' },
  { title: 'Dashboard', path: '/dashboard', icon: 'mingcute:settings-6-fill' },
]

// Access router to handle navigation
const router = useRouter()

// Access the display store for the sidebar state
const displayStore = useDisplayStore()

// Function to navigate to a route
const navigate = (path: string) => {
  router.push(path)
}
</script>

<style scoped>
/* Hide scrollbar but allow scrolling */
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
