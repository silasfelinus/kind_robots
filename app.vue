<template>
  <div class="flex flex-col h-screen bg-primary overflow-hidden">
    <!-- Header -->
    <header-upgrade
      class="w-full bg-base-200 rounded-xl p-2 m-2 border"
    ></header-upgrade>

    <!-- Main Container for Sidebar and Content -->
    <div class="flex flex-grow overflow-hidden">
      <!-- Collapsible Sidebar -->
      <aside
        :class="`transition-transform duration-300 z-10 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} w-64 h-full`"
      >
        <add-bot-link class="block p-4" />
        <bot-chat-link class="block p-4" />
        <bot-messages-link class="block p-4" />
        <button class="p-2 text-left w-full" @click="toggleSidebar">
          <icon name="material-icons:menu" class="text-xl" />
        </button>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 flex flex-col items-center overflow-auto">
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

const isSidebarOpen = ref(true) // Using ref for better TypeScript inference

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value
  // Additional code to trigger re-rendering or adjustment of main content width might be needed
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
  } catch (error: unknown) {
    errorStore.setError(
      ErrorType.UNKNOWN_ERROR,
      `Initialization failed: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
})
</script>
<style scoped>
.flex {
  display: flex;
  flex-direction: column;
  height: 100vh; /* This confines your flex container to the height of the viewport */
  width: 100vw; /* Ensure the container fills the viewport width */
  overflow-x: hidden; /* Prevent horizontal overflow, which is good */
}

.main-container {
  display: flex;
  flex-grow: 1; /* This should take up any remaining space after the header */
  width: 100%; /* Ensure it spans the full width */
  overflow: hidden; /* May need to adjust this if your main content should scroll */
}

main {
  flex-grow: 1; /* Allow main content to expand */
  width: calc(100vw - 16rem); /* Adjust width if the sidebar is visible */
  overflow-y: auto; /* Ensure it scrolls vertically if content overflows */
}

.header-upgrade {
  flex-shrink: 0;
  width: 100%;
}

.sidebar {
  position: relative; /* Use relative for inline flex positioning */
  transition: transform 0.3s ease;
  width: 16rem; /* Sidebar width */
  overflow-y: auto; /* Allow vertical scrolling in sidebar */
}
</style>
