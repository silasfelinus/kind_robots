<template>
  <div class="relative flex flex-col h-screen bg-gray-100">
    <!-- Header Dashboard -->
    <header-upgrade
      class="w-full bg-primary z-40"
      :style="{ height: headerHeight }"
    >
    </header-upgrade>

    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto p-4 bg-secondary">
      <NuxtPage />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
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

const headerHeight = computed(() => `var(--header-height)`)

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

interface BackupResponse {
  success: boolean
  message?: string
}

const BACKUP_INTERVAL = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

const checkAndTriggerBackup = async () => {
  // Type assertion for $fetch
  const fetchBackup = async (): Promise<BackupResponse> => {
    return $fetch<BackupResponse>('/api/backup')
  }

  const lastBackup = localStorage.getItem('lastBackup')
  const now = new Date().getTime()

  console.log('Last backup timestamp:', lastBackup)
  console.log('Current time:', now)
  console.log('Backup interval (ms):', BACKUP_INTERVAL)

  if (!lastBackup || now - parseInt(lastBackup) > BACKUP_INTERVAL) {
    console.log('Backup is due. Triggering backup process...')
    try {
      const data = await fetchBackup()

      // Check if data is not null
      if (data) {
        if (data.success) {
          localStorage.setItem('lastBackup', now.toString())
          console.log('Backup triggered and successful.')
        } else {
          console.error('Backup failed:', data.message)
        }
      } else {
        console.error('Backup response is null or undefined.')
      }
    } catch (err) {
      console.error('Error triggering backup:', err)
    }
  } else {
    console.log('Backup not needed. Last backup was within the interval.')
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
    await checkAndTriggerBackup()
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

<style scoped>
:root {
  --header-height: 3rem;
}

header {
  position: relative;
  width: 100%;
}

main {
  flex: 1;
  padding: 1rem;
  background-color: var(
    --color-secondary
  ); /* Ensure correct background color */
  overflow-y: auto;
}
</style>
