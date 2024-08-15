<template>
  <div class="relative flex flex-col h-screen bg-gray-100">
    <!-- Toggle Navigation Button -->
    <button
      class="absolute top-4 left-4 z-50 p-2 bg-primary rounded-full"
      @click="toggleNav"
    >
      <icon name="fluent:row-triple-20-filled" class="text-2xl text-white" />
    </button>

    <!-- Header Dashboard -->
    <header-dashboard
      class="w-full bg-white fixed top-0 left-0 right-0 z-40"
      style="
        padding: 0 1rem;
        height: 7rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      "
    />

    <!-- Main Content -->
    <main
      class="flex-grow overflow-y-auto pt-[4rem] pb-[calc(8rem+env(safe-area-inset-bottom))]"
    >
      <!-- Navigation -->
      <navigation-trimmed
        v-if="showNav"
        class="fixed bottom-0 left-0 right-0 rounded-t-xl p-2 bg-white shadow-lg z-30 transition-transform duration-300"
        :class="{ 'translate-y-0': showNav, 'translate-y-full': !showNav }"
      />
      <!-- Main Content Area -->
      <div class="border border-gray-300 rounded-lg mb-4 p-4 bg-gray-200">
        <NuxtPage />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useHead } from '@vueuse/head'

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
    await userStore.initializeUser()
    await artStore.init()
    await tagStore.initializeTags()
    await themeStore.initTheme()
    await pitchStore.initializePitches()
    await channelStore.initializeChannels()
    await milestoneStore.initializeMilestones()
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
