<template>
  <div class="relative flex flex-col h-screen bg-secondary">
    <!-- Header -->
    <header-upgrade
      v-if="toggleSidebar"
      ref="headerRef"
      class="w-full rounded-2xl bg-primary shadow-md z-40 p-1"
    ></header-upgrade>
    <!-- Header -->
    <header-upgrade
      v-if="toggleSidebar"
      ref="headerRef"
      class="w-full rounded-2xl bg-primary shadow-md z-40 p-1"
    ></header-upgrade>

    <!-- Collapsible Toggle Button -->
    <div :class="['absolute right-4 z-50', buttonPosition]">
      <button
        class="bg-accent text-white p-2 rounded-full shadow-md"
        @click="toggleSidebarFunction"
      >
        <span class="text-lg"
          ><Icon :name="toggleSidebar ? 'fxemoji:eye' : 'nimbus:eye-off'"
        /></span>
      </button>
    </div>

    <!-- Main Content -->
    <main
      ref="mainContentRef"
      class="flex-1 p-1 bg-secondary overflow-y-auto z-30"
    >
      <NuxtPage />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
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

const buttonPosition = computed(() => {
  if (toggleSidebar.value && headerRef.value) {
    const headerHeight = headerRef.value.getBoundingClientRect().height
    return { top: `${headerHeight}px` }
  }
  return { top: '4px' } // Default position when the header is not visible
})

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
