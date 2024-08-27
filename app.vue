<template>
  <div class="relative flex h-screen bg-primary">
    <!-- Header -->
    <header-upgrade
      ref="headerRef"
      class="flex flex-col items-center bg-base-200 rounded-2xl p-2 m-2 border"
    ></header-upgrade>
    <!-- Collapsible Sidebar -->
    <aside :class="`sidebar ${isSidebarOpen ? 'expanded' : 'collapsed'}`">
      <add-bot-link class="icon-link" />
      <bot-chat-link class="icon-link" />
      <bot-messages-link class="icon-link" />
      <button class="toggle-sidebar" @click="toggleSidebar">
        <icon name="material-icons:menu" />
      </button>
    </aside>

    <!-- Toggle Icon -->
    <div v-if="!isSidebarOpen" class="toggle-icon" @click="toggleSidebar">
      <icon name="material-icons:menu" />
    </div>

    <!-- Main Content -->
    <main ref="mainContentRef" class="flex flex-col items-center flex-grow">
      <NuxtPage />
    </main>
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

// Function to toggle sidebar state
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

const headerRef = ref<HTMLElement | null>(null)
const mainContentRef = ref<HTMLElement | null>(null)

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
.sidebar {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 200px;
  transition: transform 0.3s ease;
}

.collapsed {
  transform: translateX(-100%);
}

.expanded {
  transform: translateX(0);
}

.icon-link {
  margin: 1rem;
  display: block;
}

.toggle-sidebar {
  display: none; /* Hide toggle inside sidebar when expanded */
}

.toggle-icon {
  position: absolute;
  top: 100px; /* Adjust based on header height */
  left: 0;
  cursor: pointer;
  padding: 10px;
}

button {
  font-size: 1.5rem;
  width: 3rem;
  height: 3rem;
}
</style>
