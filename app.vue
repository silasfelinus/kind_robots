<template>
  <div class="relative flex flex-col h-screen bg-secondary">
    <div>
      <!-- Header -->
      <header-upgrade
        v-if="toggleSidebar"
        ref="headerRef"
        class="w-full rounded-2xl bg-primary shadow-md z-40 p-1 relative"
      >
        <h1 class="text-white text-lg font-bold">Header</h1>

        <!-- Collapsible Toggle Button -->
        <div
          class="absolute right-4 bottom-1 z-50"
          @click="toggleSidebarFunction"
        >
          <button
            v-if="!toggleSidebar"
            class="bg-accent text-white p-2 rounded-full shadow-md"
          >
            <span class="text-lg"><Icon name="nimbus:eye-off" /></span>
          </button>
          <button
            v-if="toggleSidebar"
            class="bg-accent text-white p-2 rounded-full shadow-md"
          >
            <span class="text-lg"><Icon name="fxemoji:eye" /></span>
          </button>
        </div>
      </header-upgrade>
    </div>

    <!-- Main Content -->
    <main ref="mainContentRef" class="flex-1 p-1 bg-secondary overflow-y-auto">
      <NuxtPage />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
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

const headerRef = ref<HTMLElement | null>(null)
const mainContentRef = ref<HTMLElement | null>(null)
const toggleSidebar = ref(true)

const toggleSidebarFunction = () => {
  toggleSidebar.value = !toggleSidebar.value
}

const handleClickOutside = (event: MouseEvent) => {
  if (
    headerRef.value &&
    !headerRef.value.contains(event.target as Node) &&
    mainContentRef.value &&
    !mainContentRef.value.contains(event.target as Node)
  ) {
    toggleSidebar.value = false
  }
}

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
    console.log('Initialization complete.')
  } catch (error: unknown) {
    errorStore.setError(
      ErrorType.UNKNOWN_ERROR,
      `Initialization failed: ${error instanceof Error ? error.message : String(error)}`,
    )
  }

  // Add event listener for clicks outside
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  // Clean up event listener when component unmounts
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
button {
  font-size: 1.5rem;
  width: 3rem;
  height: 3rem;
}
</style>
