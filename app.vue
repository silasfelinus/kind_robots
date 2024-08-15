<template>
  <div class="relative flex flex-col h-screen w-screen bg-gray-100">
    <!-- Toggle Navigation Button -->
    <button
      class="absolute top-4 left-4 z-50 p-2 bg-primary rounded-full"
      @click="toggleNav"
    >
      <icon name="fluent:row-triple-20-filled" class="text-2xl text-white" />
    </button>

    <!-- Header Dashboard -->
    <header-dashboard
      class="w-full shadow-lg bg-white z-40 fixed top-0 left-0 right-0"
    />

    <!-- Main Content -->
    <main
      class="flex-grow overflow-y-auto"
      :style="{
        paddingBottom: showNav ? '8rem' : '0',
        paddingTop: headerHeight,
      }"
    >
      <!-- Navigation -->
      <navigation-trimmed
        v-if="showNav"
        class="fixed bottom-0 left-0 right-0 rounded-t-xl p-2 bg-white shadow-lg z-30 transition-transform duration-300 transform"
        :class="{ 'translate-y-0': showNav, 'translate-y-full': !showNav }"
      />
      <!-- Main Content Area -->
      <div class="border border-gray-300 rounded-lg mb-4 p-4 bg-gray-200">
        <!-- Use NuxtPage for dynamic content -->
        <NuxtPage />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useHead } from '@vueuse/head'
import { useErrorStore, ErrorType } from './stores/errorStore'
import { useTagStore } from './stores/tagStore'
import { useUserStore } from './stores/userStore'
import { useArtStore } from './stores/artStore'
import { useMatureStore } from './stores/matureStore'
import { useThemeStore } from './stores/themeStore'
import { useBotStore } from './stores/botStore'
import { usePitchStore } from './stores/pitchStore'
import { useChannelStore } from './stores/channelStore'
import { useMilestoneStore } from './stores/milestoneStore'
import { useChatStore } from './stores/chatStore'
import { useLayoutStore } from './stores/layoutStore'

const tagStore = useTagStore()
const userStore = useUserStore()
const artStore = useArtStore()
const matureStore = useMatureStore()
const themeStore = useThemeStore()
const botStore = useBotStore()
const pitchStore = usePitchStore()
const channelStore = useChannelStore()
const milestoneStore = useMilestoneStore()
const chatStore = useChatStore()
const errorStore = useErrorStore()
const layoutStore = useLayoutStore()

const headerHeight = computed(() => '6rem') // Adjust based on the actual height of your header

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
    await matureStore.initialize()
    await userStore.initializeUser()
    await artStore.init()
    await tagStore.initializeTags()
    await themeStore.initTheme()
    await pitchStore.initializePitches()
    await channelStore.initializeChannels()
    await milestoneStore.initializeMilestones()
    await chatStore.fetchChatExchanges()
    await layoutStore.initializeStore()
    console.log(
      'Welcome to Kind Robots, random person who reads console logs! Are you a developer?',
    )
  } catch (error: unknown) {
    errorStore.setError(
      ErrorType.UNKNOWN_ERROR,
      `Initialization failed: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
})

const showNav = ref(false)

const toggleNav = () => {
  showNav.value = !showNav.value
}
</script>

<style scoped>
html,
body,
#app {
  height: 100%;
  overflow: hidden; /* Ensures no scrollbars appear on the whole page */
}

main {
  overflow-y: auto; /* Allows vertical scrolling in the main content area */
  padding-top: 6rem; /* Adjust space for the fixed header */
  padding-bottom: 8rem; /* Space for the fixed bottom navigation */
}

.relative {
  position: relative;
}

.flex-grow {
  flex-grow: 1;
}

.bg-gray-100 {
  background-color: #f7f7f7;
}
</style>
