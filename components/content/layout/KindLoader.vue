<template>
  <ami-loader />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useErrorStore, ErrorType } from './../../../stores/errorStore'
import { useUserStore } from './../../../stores/userStore'
import { useArtStore } from './../../../stores/artStore'
import { useThemeStore } from './../../../stores/themeStore'
import { useBotStore } from './../../../stores/botStore'
import { useMilestoneStore } from './../../../stores/milestoneStore'
import { useDisplayStore } from './../../../stores/displayStore'
import { usePitchStore } from './../../../stores/pitchStore'
import { usePromptStore } from './../../../stores/promptStore'

// Stores
const errorStore = useErrorStore()
const displayStore = useDisplayStore()
const userStore = useUserStore()
const artStore = useArtStore()
const themeStore = useThemeStore()
const botStore = useBotStore()
const milestoneStore = useMilestoneStore()
const pitchStore = usePitchStore()
const promptStore = usePromptStore()

// State management
const isReady = ref(false)
const emit = defineEmits(['pageReady'])

onMounted(async () => {
  console.log('Starting initialization process...')

  try {
    if (!displayStore.isInitialized) {
      await errorStore.handleError(
        async () => displayStore.initialize(),
        ErrorType.STORE_ERROR,
        'Error initializing display store',
      )
    }

    // Initialize other stores in parallel
    await Promise.all([
      userStore.initializeUser?.(),
      botStore.loadStore?.(),
      artStore.initialize?.(),
      themeStore.initTheme?.(),
      milestoneStore.initializeMilestones?.(),
      pitchStore.initializePitches?.(),
      promptStore.initialize?.(),
    ])

    console.log('All stores initialized successfully.')

    // Immediately announce the page is ready
    isReady.value = true
    emit('pageReady', true)
  } catch (error) {
    console.error('Initialization failed:', error)
    errorStore.setError(
      ErrorType.UNKNOWN_ERROR,
      `Initialization failed: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
})

onBeforeUnmount(() => {
  displayStore.removeViewportWatcher() // Clean up the watcher
})
</script>
