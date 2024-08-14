<template>
  <div class="bg-base-200 p-1">
    <ami-loader />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useHead } from '@vueuse/head'

const layoutStore = useLayoutStore()
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
    layoutStore.initialize()
    botStore.loadStore()
    matureStore.initialize()
    userStore.initializeUser()
    artStore.init()
    tagStore.initializeTags()
    themeStore.initTheme()
    pitchStore.initializePitches()
    channelStore.initializeChannels()
    milestoneStore.initializeMilestones()
    chatStore.fetchChatExchanges()
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
</script>
