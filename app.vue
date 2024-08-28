<template>
  <div class="main-container bg-primary">
    <!-- Header with embedded toggle button -->
    <header-upgrade class="rounded-2xl border p-1 m-1">
      <button class="absolute bottom-0 right-3 z-50" @click="toggleSidebar">
        <icon
          :name="isSidebarOpen ? 'lucide:sidebar' : 'lucide:sidebar-open'"
          class="h-6 w-6 md:h-12 md:w-12"
        ></icon>
      </button>
    </header-upgrade>

    <div class="flex-grow">
      <!-- Collapsible Sidebar -->
      <aside
        :class="`sidebar flex-shrink-0 transition-width duration-300 ease-in-out overflow-y-auto m-1 p-1 border rounded-2xl bg-secondary ${isSidebarOpen ? 'w-64' : 'w-24'}`"
        :aria-hidden="isSidebarOpen ? 'false' : 'true'"
      >
        <!-- Sidebar Links with Icons and Titles -->
        <div
          class="p-4 flex items-center justify-start"
          title="Home"
          @click="toggleSidebar"
        >
          <home-link class="text-xl w-6 h-6 md:w-16 md:h-16" />
          <router-link
            v-show="isSidebarOpen"
            to="/home"
            class="ml-2 text-lg font-semibold"
            >Home</router-link
          >
        </div>
        <div
          class="p-4 flex items-center justify-start"
          title="Add Bot"
          @click="toggleSidebar"
        >
          <add-bot-link class="text-xl" />
          <router-link
            v-show="isSidebarOpen"
            to="/addbot"
            class="ml-2 text-lg font-semibold"
            >Add Bot</router-link
          >
        </div>
        <div
          class="p-4 flex items-center justify-start"
          title="Chat with Bots"
          @click="toggleSidebar"
        >
          <bot-chat-link class="text-xl" />
          <router-link
            v-show="isSidebarOpen"
            to="/botcafe"
            class="ml-2 text-lg font-semibold"
            >Chat with Bots</router-link
          >
        </div>
        <div
          class="p-4 flex items-center justify-start"
          title="Bot Messages"
          @click="toggleSidebar"
        >
          <bot-messages-link class="text-xl" />
          <router-link
            v-show="isSidebarOpen"
            to="/botmessages"
            class="ml-2 text-lg font-semibold"
            >Bot Messages</router-link
          >
        </div>
        <div
          class="p-4 flex items-center justify-start"
          title="Hot or Not?"
          @click="toggleSidebar"
        >
          <hot-link class="text-xl" />
          <router-link
            v-show="isSidebarOpen"
            to="/hotornot"
            class="ml-2 text-lg font-semibold"
            >Hot or Not?</router-link
          >
        </div>
        <div
          class="p-4 flex items-center justify-start"
          title="Art Gallery"
          @click="toggleSidebar"
        >
          <art-gallery-link class="text-xl" />
          <router-link
            v-show="isSidebarOpen"
            to="/artgallery"
            class="ml-2 text-lg font-semibold"
            >Art Gallery</router-link
          >
        </div>
        <div
          class="p-4 flex items-center justify-start"
          title="Dashboard"
          @click="toggleSidebar"
        >
          <dashboard-link class="text-xl" />
          <router-link
            v-show="isSidebarOpen"
            to="/dashboard"
            class="ml-2 text-lg font-semibold"
            >Dashboard</router-link
          >
        </div>
        <div
          v-if="showMature"
          class="p-4 flex items-center justify-start"
          title="Mature Content"
          @click="toggleSidebar"
        >
          <icon name="fxemoji:lips" class="text-xl w-6 h-6 md:w-16 md:h-16" />
          <router-link
            v-show="isSidebarOpen"
            to="/mature"
            class="ml-2 text-lg font-semibold"
            >Mature Content</router-link
          >
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content rounded-2xl p-1 m-1">
        <NuxtPage />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useHead } from '@vueuse/head'
import { useErrorStore } from '@/stores/errorStore'
import { useTagStore } from '@/stores/tagStore'
import { useUserStore } from '@/stores/userStore'
import { useArtStore } from '@/stores/artStore'
import { useThemeStore } from '@/stores/themeStore'
import { useBotStore } from '@/stores/botStore'
import { usePitchStore } from '@/stores/pitchStore'
import { useChannelStore } from '@/stores/channelStore'
import { useMilestoneStore } from '@/stores/milestoneStore'
import { useLayoutStore } from '@/stores/layoutStore'
import AddBotLink from '@/components/content/navigation/AddBotLink.vue'
import BotChatLink from '@/components/content/navigation/BotChatLink.vue'
import BotMessagesLink from '@/components/content/navigation/BotMessagesLink.vue'
import ArtGalleryLink from '@/components/content/navigation/ArtGalleryLink.vue'
import HotLink from '@/components/content/navigation/HotLink.vue'
import DashboardLink from '@/components/content/navigation/DashboardLink.vue'

const errorStore = useErrorStore()
const tagStore = useTagStore()
const userStore = useUserStore()
const artStore = useArtStore()
const themeStore = useThemeStore()
const botStore = useBotStore()
const pitchStore = usePitchStore()
const channelStore = useChannelStore()
const milestoneStore = useMilestoneStore()
const layoutStore = useLayoutStore()

const isSidebarOpen = ref(true)
const showMature = computed(() => userStore.showMature)

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value
}

useHead({
  title: 'Kind Robots',
  meta: [
    { name: 'og:title', content: 'Welcome to the Kind Robots' },
    {
      name: 'description',
      content: 'OpenAI-supported Promptbots here to assist humanity.',
    },
    {
      name: 'og:description',
      content:
        'Make and Share OpenAI prompts, AI-assisted art, and find the secret jellybeans',
    },
    { name: 'og:image', content: '/images/kindtitle.webp' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ],
})

onMounted(async () => {
  try {
    await botStore.loadStore()
    console.log('loading user')
    await userStore.initializeUser()
    console.log('user loaded')
    await artStore.init()
    await tagStore.initializeTags()
    await themeStore.initTheme()
    await pitchStore.initializePitches()
    await channelStore.initializeChannels()
    await milestoneStore.initializeMilestones()
    await layoutStore.initializeStore()
    console.log('Initialization complete.')
  } catch (error) {
    errorStore.setError(
      ErrorType.UNKNOWN_ERROR,
      `Initialization failed: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
})
</script>

<style>
.main-container {
  display: flex;
  flex-direction: column;
  height: 100vh; /* Use vh to fill the screen vertically */
  overflow: hidden; /* Prevents spillover from internal elements */
}

.header-upgrade {
  flex-shrink: 0; /* Ensures the header does not shrink */
  min-height: 50px; /* Minimum height; adjust as needed */
}

/* Using CSS variable to dynamically adjust the height */
.flex-grow {
  display: flex;
  flex-direction: row;
  height: calc(100vh - var(--header-height)); /* Dynamically calculated based on header height */
  overflow: hidden; /* Containing internal overflows */
}

.sidebar {
  flex-shrink: 0;
  transition: width 0.3s ease-in-out;
  overflow-y: auto; /* Allows scrolling within the sidebar */
}

.main-content {
  flex-grow: 1;
  overflow-y: auto; /* Enables scrolling for main content */
}

@media (max-width: 768px) {
  .sidebar {
    min-width: 150px;
    max-width: 200px;
  }
}

@media (max-width: 480px) {
  .sidebar {
    min-width: 120px;
    width: 100%; /* Sidebar takes full width on very small devices */
  }
}
</style>