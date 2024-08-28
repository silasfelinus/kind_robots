<template>
  <div class="flex flex-col h-screen bg-primary">
    <!-- Header with embedded toggle button -->
    <header-upgrade
      class="w-full bg-base-200 rounded-xl p-2 m-2 border relative z-50"
    >
      <button
        class="absolute p-2 text-left text-accent top-2 left-2"
        title="Toggle Sidebar"
        @click="toggleSidebar"
      >
        <icon
          :name="isSidebarOpen ? 'lucide:sidebar' : 'lucide:sidebar-open'"
          class="text-xl"
          style="font-size: 24px"
        ></icon>
      </button>
    </header-upgrade>

    <!-- Main Container for Sidebar and Content -->
    <div class="flex flex-grow">
      <!-- Collapsible Sidebar -->
      <aside
        :class="`flex-shrink-0 transition-width duration-300 ease-in-out overflow-y-auto border rounded-2xl bg-secondary ${isSidebarOpen ? 'w-64' : 'w-16'}`"
        :aria-hidden="isSidebarOpen ? 'false' : 'true'"
      >
        <!-- Sidebar Links with Icons and Titles -->
        <div
          class="p-4 flex items-center justify-start"
          title="Home"
          @click="toggleSidebar"
        >
          <home-link class="text-xl" />
          <router-link
            v-show="isSidebarOpen"
            to="/home"
            class="ml-2 text-lg font-semibold"
            >Home/Navigation</router-link
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
            to="/add-bot"
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
            to="/chat-bots"
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
            to="/bot-messages"
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
            to="/hot-or-not"
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
            to="/art-gallery"
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
      </aside>

      <!-- Main Content -->
      <main class="flex-grow overflow-y-auto m-2">
        <NuxtPage />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
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

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value
}

const canSeeMatureContent = computed(() => userStore.showMature)

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
