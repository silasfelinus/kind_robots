<template>
  <div class="flex flex-col h-screen bg-primary">
    <!-- Header -->
    <header-upgrade
      class="w-full bg-base-200 rounded-xl p-2 m-2 border"
    ></header-upgrade>

    <!-- Main Container for Sidebar and Content -->
    <div class="flex flex-grow relative border rounded-2xl bg-primary">
      <!-- Sidebar Toggle Button, consistently positioned -->
      <button
        class="absolute z-50 p-2 text-left text-accent inset-y-0 left-0 top-2"
        @click="toggleSidebar"
      >
        <icon
          :name="isSidebarOpen ? 'lucide:sidebar-open' : 'lucide:sidebar'"
          class="text-xl"
          style="font-size: 24px"
        ></icon>
      </button>

      <!-- Collapsible Sidebar -->
      <aside
        :class="`absolute inset-y-0 left-0 transform transition-transform duration-300 z-50 w-64 overflow-y-auto bg-secondary ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`"
      >
        <!-- Sidebar Links -->
        <add-bot-link class="block p-4 bg-primary" @click="toggleSidebar" />
        <bot-chat-link class="block p-4 bg-primary" @click="toggleSidebar" />
        <bot-messages-link
          class="block p-4 bg-primary"
          @click="toggleSidebar"
        />
        <hot-link class="block p-4 bg-primary" @click="toggleSidebar" />
        <art-gallery-link class="block p-4 bg-primary" @click="toggleSidebar" />
        <dashboard-link class="block p-4 bg-primary" @click="toggleSidebar" />
      </aside>

      <!-- Main Content -->
      <main class="flex-grow overflow-y-auto w-full">
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
