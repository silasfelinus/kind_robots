<template>
  <div class="flex h-full">
    <!-- Left Sidebar -->
    <aside
      class="transition-all duration-300 bg-base-300 border-4 rounded-2xl left-0 overflow-y-auto flex flex-col justify-between flex-grow"
    >
      <!-- Sidebar Links with Icons and Titles -->
      <div class="flex flex-col justify-between flex-grow">
        <div
          v-for="link in hardcodedLinks"
          :key="link.title"
          class="Icon-link-container flex items-center space-x-1 md:space-x-2 hover:bg-primary hover:scale-110 box-border rounded-xl p-1 md:p-2"
        >
          <!-- Navigation click event -->
          <a
            v-if="displayStore.sidebarLeftState !== 'hidden'"
            class="flex flex-col items-center cursor-pointer w-full"
            @click.prevent="navigate(link.path)"
          >
            <!-- Show icon in all states except hidden -->
            <Icon
              v-if="
                displayStore.sidebarLeftState === 'open' ||
                displayStore.sidebarLeftState === 'compact'
              "
              :name="link.icon"
              class="h-6 w-6 md:h-12 md:w-12 transition-all duration-300 ease-in-out text-accent"
            />

            <!-- Show the link title below the icon in compact state -->
            <span
              v-if="(displayStore.sidebarLeftState === 'compact' && !isMobile)"
              class="text-xs md:text-md lg:text-lg font-semibold mt-1 text-center bg-secondary text-white px-2 py-1 rounded-lg"
            >
              {{ link.title }}
            </span>

            <!-- Only show the link title to the right in fully open state -->
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

const isMobile = computed (()=> displayStore.isMobileViewport)
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
