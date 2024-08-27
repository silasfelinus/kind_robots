<template>
  <div class="flex flex-col h-screen bg-primary overflow-hidden">
    <!-- Header -->
    <header-upgrade
      class="w-full bg-base-200 rounded-xl p-2 m-2 border"
    ></header-upgrade>

    <!-- Main Container for Sidebar and Content -->
    <div class="flex flex-grow relative">
      <!-- Added 'relative' to make positioning of the sidebar absolute relative to this container -->
      <!-- Collapsible Sidebar -->
      <aside :class="`sidebar ${isSidebarOpen ? 'open' : 'closed'}`">
        <add-bot-link class="block p-4" />
        <bot-chat-link class="block p-4" />
        <bot-messages-link class="block p-4" />
        <hot-link class="block p-4" />
        <button class="p-2 text-left w-full" @click="toggleSidebar">
          <icon name="material-icons:menu" class="text-xl" />
        </button>
      </aside>

      <!-- Main Content -->
      <main class="main-container">
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
import HotLink from '@/components/content/navigation/HotLink.vue'

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

watch(isSidebarOpen, (newValue) => {
  document.documentElement.style.setProperty(
    '--sidebar-width',
    newValue ? '16rem' : '0',
  )
})
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
  height: 100vh;
  overflow-x: hidden;
}

.main-container {
  flex-grow: 1;
  overflow-y: auto;
  width: 100%; /* Full width always */
}

.sidebar {
  position: absolute; /* Changed from relative to absolute */
  top: 0;
  bottom: 0;
  width: 16rem; /* Sidebar width */
  transform: translateX(-100%); /* Start off-screen */
  transition: transform 0.3s ease;
  z-index: 100; /* Ensure it floats over the content */
}

.sidebar.open {
  transform: translateX(0); /* Move into view */
}

.sidebar.closed {
  transform: translateX(-100%); /* Move out of view */
}

.header-upgrade {
  flex-shrink: 0;
  width: 100%;
}

@media (max-width: 768px) {
  .sidebar {
    width: 100%; /* Full width on smaller screens */
  }
}
</style>
