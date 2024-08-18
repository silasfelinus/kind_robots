<template>
  <div class="relative flex flex-col h-screen bg-gray-100">
    <!-- Header Dashboard -->
    <header-upgrade class="w-full bg-primary shadow-md z-40"> </header-upgrade>

    <!-- Main Content -->
    <main class="flex-1 p-1 bg-secondary overflow-y-auto">
      <NuxtPage />
    </main>
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

  if (!lastBackup || now - parseInt(lastBackup) > BACKUP_INTERVAL) {
    try {
      const data = await fetchBackup()
      if (data && data.success) {
        localStorage.setItem('lastBackup', now.toString())
      } else {
        console.error('Backup failed:', data?.message)
      }
    } catch (err) {
      console.error('Error triggering backup:', err)
    }
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
    console.log('Initialization complete.')
  } catch (error: unknown) {
    errorStore.setError(
      ErrorType.UNKNOWN_ERROR,
      `Initialization failed: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
})
</script>
