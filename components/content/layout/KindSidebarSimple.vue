<template>
  <!-- Left Sidebar -->
  <div
    class="transition-all duration-300 bg-base-300 border-1 border-accent rounded-2xl left-0 h-full overflow-y-auto no-scrollbar flex flex-col justify-between flex-grow box-border"
  >
    <!-- Sidebar Links with Icons and Titles -->
    <div class="flex flex-col justify-between flex-grow">
      <div
        v-for="link in hardcodedLinks"
        :key="link.title"
        class="Icon-link-container flex items-center hover:bg-primary hover:scale-110 box-border rounded-xl"
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
            class="h-10 w-10 md:h-12 md:w-12 lg:h-13 lg:w-13 xl:w-19 xl:h-19 transition-all duration-300 ease-in-out"
          />

          <!-- Show the link title below the icon in compact state -->
          <span
            v-if="displayStore.sidebarLeftState === 'compact' && !isMobile"
            class="text-xs md:text-md lg:text-lg font-semibold text-center px-2 rounded-lg"
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
  </div>
</template>

<script setup lang="ts">
import { useDisplayStore } from '@/stores/displayStore'
import { useRouter } from 'vue-router'

// Hardcoded sidebar links
const hardcodedLinks = [
  { title: 'Home', path: '/', icon: 'kind-icon:home' },
  { title: 'Bot Cafe', path: '/botcafe', icon: 'kind-icon:addbot' },
  {
    title: 'Brainstorm!',
    path: '/brainstorm',
    icon: 'kind-icon:brain',
  },
  { title: 'Art Lab', path: '/artmaker', icon: 'kind-icon:easel' },
  {
    title: 'Memory',
    path: '/memory',
    icon: 'kind-icon:question',
  },
  { title: 'Wonderlab', path: '/wonderlab', icon: 'kind-icon:gearhammer' },
  {
    title: 'WeirdLand',
    path: '/weirdlandia',
    icon: 'kind-icon:alien',
  },
  {
    title: 'Story Maker',
    path: '/story',
    icon: 'kind-icon:book',
  },
]

// Access router to handle navigation
const router = useRouter()

// Access the display store for the sidebar state
const displayStore = useDisplayStore()

// Function to navigate to a route
const navigate = (path: string) => {
  router.push(path)
}

const isMobile = computed(() => displayStore.isMobileViewport)
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
