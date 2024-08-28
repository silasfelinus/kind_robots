<template>
  <div class="main-container bg-primary">
    <!-- Header with embedded toggle button -->
    <header-upgrade class="rounded-2xl border p-2 m-2"> </header-upgrade>

    <div class="flex-grow">
      <kind-sidebar />

      <!-- Main Content -->
      <main class="main-content rounded-2xl p-1 m-1">
        <NuxtPage />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
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
import KindSidebar from '@/components/content/navigation/KindSidebar.vue'

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
}

/* Flex-grow on main ensures it takes up remaining space */
.flex-grow {
  display: flex;
  flex-direction: row;
  height: calc(100% - 50px); /* Adjust based on your header's height */
  overflow: hidden; /* Containing internal overflows */
}
</style>
