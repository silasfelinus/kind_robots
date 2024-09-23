<template>
  <div
    v-if="!isReady"
    :class="{
      'fixed inset-0 flex items-center justify-center bg-opacity-70 z-50':
        isFirstLoad,
      'absolute flex items-center justify-center bg-opacity-70 z-50':
        !isFirstLoad,
    }"
    :style="!isFirstLoad ? mainContentStyle : ''"
  >
    <ami-loader />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useErrorStore, ErrorType } from '@/stores/errorStore'
import { useUserStore } from '@/stores/userStore'
import { useArtStore } from '@/stores/artStore'
import { useThemeStore } from '@/stores/themeStore'
import { useBotStore } from '@/stores/botStore'
import { useMilestoneStore } from '@/stores/milestoneStore'
import { useDisplayStore } from '@/stores/displayStore'
import { usePitchStore } from '@/stores/pitchStore'

// Stores
const errorStore = useErrorStore()
const displayStore = useDisplayStore()
const userStore = useUserStore()
const artStore = useArtStore()
const themeStore = useThemeStore()
const botStore = useBotStore()
const milestoneStore = useMilestoneStore()
const pitchStore = usePitchStore()

// State management
const isReady = ref(false)
const isFirstLoad = ref(true)
const mainContentStyle = ref('')
const emit = defineEmits(['pageReady'])

onMounted(async () => {
  console.log('Starting initialization...')

  try {
    if (displayStore.isLoaded) {
      console.log('DisplayStore already loaded. Skipping initialization.')
      isReady.value = true
      isFirstLoad.value = false
      emit('pageReady', true)
      return
    }

    console.log('Initializing stores...')

    // Initialize the stores in parallel
    await Promise.all([
      (async () => {
        if (typeof displayStore.updateViewport === 'function') {
          await displayStore.updateViewport()
        }
      })(),

      (async () => {
        if (typeof botStore.loadStore === 'function') {
          await botStore.loadStore()
        }
      })(),

      (async () => {
        if (typeof userStore.initializeUser === 'function') {
          await userStore.initializeUser()
        }
      })(),

      (async () => {
        if (typeof artStore.init === 'function') {
          await artStore.init()
        }
      })(),

      (async () => {
        if (typeof themeStore.initTheme === 'function') {
          await themeStore.initTheme()
        }
      })(),

      (async () => {
        if (typeof milestoneStore.initializeMilestones === 'function') {
          await milestoneStore.initializeMilestones()
        }
      })(),

      (async () => {
        if (typeof pitchStore.initializePitches === 'function') {
          await pitchStore.initializePitches()
        }
      })(),
    ])

    console.log('All stores initialized successfully.')

    // Dynamically set the main content style based on sidebar and header sizes
    mainContentStyle.value = `top: ${displayStore.headerVh}px; left: ${displayStore.sidebarVw}px;`
    console.log('Main content style set:', mainContentStyle.value)

    // Simulate a delay for loader visibility
    setTimeout(() => {
      console.log('Page is ready, hiding loader.')
      isReady.value = true
      isFirstLoad.value = false
      emit('pageReady', true)

      // Mark displayStore as loaded
      displayStore.isLoaded = true
    }, 1000)

    // Add viewport resize event listener
    window.addEventListener('resize', displayStore.updateViewport)
    console.log('Viewport resize listener added.')
  } catch (error) {
    console.error('Initialization failed:', error)
    errorStore.setError(
      ErrorType.UNKNOWN_ERROR,
      `Initialization failed: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
})

onBeforeUnmount(() => {
  console.log('Removing viewport resize listener.')
  window.removeEventListener('resize', displayStore.updateViewport)
})
</script>
