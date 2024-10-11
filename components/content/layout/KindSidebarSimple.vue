<template>
  <div class="flex">
    <!-- Left Sidebar -->
    <aside
      class="transition-all duration-300 bg-base-300 border-4 rounded-2xl left-0 overflow-y-auto flex flex-col justify-between"
      :style="{
        width: displayStore.sidebarLeftWidth,
        top: `${displayStore.headerHeight}vh`,
        height: `calc(100vh - ${displayStore.headerHeight}vh - ${displayStore.footerHeight}vh)`,
      }"
    >
      <!-- Sidebar Links with Icons and Titles -->
      <div class="flex flex-col justify-between flex-grow">
        <div
          v-for="link in hardcodedLinks"
          :key="link.title"
          class="Icon-link-container flex items-center space-x-1 md:space-x-2 hover:bg-primary hover:scale-110 rounded-xl p-1 md:p-2"
        >
          <!-- Navigation click event -->
          <a
            v-if="displayStore.sidebarLeftState !== 'hidden'"
            class="flex items-center cursor-pointer w-full"
            @click.prevent="navigate(link.path)"
          >
            <!-- Only show icon if sidebar is open or compact -->
            <Icon
              v-if="
                displayStore.sidebarLeftState === 'open' ||
                displayStore.sidebarLeftState === 'compact'
              "
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
    icon: 'mdi:brain',
  },
  { title: 'Wonder Lab', path: '/wonderlab', icon: 'game-icons:gear-hammer' },
  { title: 'Dash', path: '/dashboard', icon: 'mingcute:settings-6-fill' },
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
