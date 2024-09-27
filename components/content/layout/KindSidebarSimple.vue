<template>
  <div class="flex">
    <!-- Left Sidebar -->
    <aside
      v-if="displayStore.sidebarLeftState !== 'hidden'"
      class="transition-all duration-300 bg-base-300 rounded-2xl hide-scrollbar p-1"
      :style="{
        width: displayStore.sidebarLeftVw + 'vw',
        maxHeight: `calc(100vh - ${displayStore.headerVh}vh - ${displayStore.footerVh}vh)`,
        overflowY: 'auto',
      }"
    >
      <!-- Sidebar Links with Icons and Titles -->
      <div
        v-for="link in hardcodedLinks"
        :key="link.title"
        :style="{ height: iconHeight + 'px', margin: '1px 0' }"
        class="Icon-link-container flex items-center space-x-1 md:space-x-2 hover:bg-primary hover:scale-110 rounded-xl mt-1 mb-1 p-1 md:p-2"
      >
        <!-- Use a click event with router.push for navigation -->
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
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { useRouter } from 'vue-router'

// Hardcoded sidebar links
const hardcodedLinks = [
  { title: 'Home', path: '/', icon: 'line-md:home-md-twotone' },
  { title: 'Add Bot', path: '/addbot', icon: 'fluent:bot-add-20-regular' },
  { title: 'Bot Cafe', path: '/botcafe', icon: 'mdi:chat-processing' },
  {
    title: 'Pitch Manager',
    path: '/pitch',
    icon: 'fluent:chat-bubbles-question-16-regular',
  },
  { title: 'Art Maker', path: '/artmaker', icon: 'game-icons:easel' },
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
  { title: 'Dashboard', path: '/dashboard', icon: 'mingcute:settings-6-fill' },
  { title: 'Mature Content', path: '/mature', icon: 'fxemoji:lips' },
  { title: 'Wonderlab', path: '/wonderlab', icon: 'game-icons:gear-hammer' },
  { title: 'About', path: '/about', icon: 'game-icons:abstract-037' },
]

// Access router to handle navigation
const router = useRouter()

// Access the display store for the sidebar state
const displayStore = useDisplayStore()

// Adjust height calculations based on window size and available space
const availableSidebarHeight = ref(
  100 - displayStore.headerVh - displayStore.footerVh,
) // Adjust for header and footer
const iconHeight = ref(0)

const navigate = (path: string) => {
  router.push(path)
}

onMounted(() => {
  const calculateIconHeight = () => {
    const totalLinks = hardcodedLinks.length
    const marginSpace = 4 * totalLinks // Adjust for link margins
    const sidebarHeightInPx =
      (availableSidebarHeight.value * window.innerHeight) / 100
    iconHeight.value = (sidebarHeightInPx - marginSpace) / totalLinks
  }

  calculateIconHeight()

  window.addEventListener('resize', calculateIconHeight)

  onBeforeUnmount(() => {
    window.removeEventListener('resize', calculateIconHeight)
  })
})
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
