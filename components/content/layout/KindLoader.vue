<template>
  <div
    v-if="!isReady"
    :class="{
      'fixed inset-0 flex items-center justify-center bg-opacity-70 z-50':
        isFirstLoad,
      'absolute flex items-center justify-center bg-opacity-70 z-50':
        !isFirstLoad,
    }"
    :style="mainContentStyle"
  >
    <ami-loader />
  </div>
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
const mainContentStyle = ref(`top: 0; left: 0;`)
const emit = defineEmits(['pageReady'])

onMounted(async () => {
  console.log('Starting initialization process...')

  try {
    if (displayStore.isInitialized) {
      console.log('DisplayStore already initialized. Skipping initialization.')
      isReady.value = true
      isFirstLoad.value = false
      emit('pageReady', true)
      return
    }

    console.log('Initializing stores...')

    // Initialize the stores in parallel with individual error handling for each store
    await Promise.all([
      (async () => {
        try {
          if (typeof displayStore.updateViewport === 'function') {
            console.log('Initializing DisplayStore...')
            await displayStore.updateViewport()
            console.log('DisplayStore initialized successfully.')
          }
        } catch (error) {
          console.error('DisplayStore initialization failed:', error)
          errorStore.setError(
            ErrorType.STORE_ERROR,
            'DisplayStore failed to initialize',
          )
          throw error
        }
      })(),

      (async () => {
        try {
          if (typeof botStore.loadStore === 'function') {
            console.log('Initializing BotStore...')
            await botStore.loadStore()
            console.log('BotStore initialized successfully.')
          }
        } catch (error) {
          console.error('BotStore initialization failed:', error)
          errorStore.setError(
            ErrorType.STORE_ERROR,
            'BotStore failed to initialize',
          )
          throw error
        }
      })(),

      (async () => {
        try {
          if (typeof userStore.initializeUser === 'function') {
            console.log('Initializing UserStore...')
            await userStore.initializeUser()
            console.log('UserStore initialized successfully.')
          }
        } catch (error) {
          console.error('UserStore initialization failed:', error)
          errorStore.setError(
            ErrorType.STORE_ERROR,
            'UserStore failed to initialize',
          )
          throw error
        }
      })(),

      (async () => {
        try {
          if (typeof artStore.init === 'function') {
            console.log('Initializing ArtStore...')
            await artStore.init()
            console.log('ArtStore initialized successfully.')
          }
        } catch (error) {
          console.error('ArtStore initialization failed:', error)
          errorStore.setError(
            ErrorType.STORE_ERROR,
            'ArtStore failed to initialize',
          )
          throw error
        }
      })(),

      (async () => {
        try {
          if (typeof themeStore.initTheme === 'function') {
            console.log('Initializing ThemeStore...')
            await themeStore.initTheme()
            console.log('ThemeStore initialized successfully.')
          }
        } catch (error) {
          console.error('ThemeStore initialization failed:', error)
          errorStore.setError(
            ErrorType.STORE_ERROR,
            'ThemeStore failed to initialize',
          )
          throw error
        }
      })(),

      (async () => {
        try {
          if (typeof milestoneStore.initializeMilestones === 'function') {
            console.log('Initializing MilestoneStore...')
            await milestoneStore.initializeMilestones()
            console.log('MilestoneStore initialized successfully.')
          }
        } catch (error) {
          console.error('MilestoneStore initialization failed:', error)
          errorStore.setError(
            ErrorType.STORE_ERROR,
            'MilestoneStore failed to initialize',
          )
          throw error
        }
      })(),

      (async () => {
        try {
          if (typeof pitchStore.initializePitches === 'function') {
            console.log('Initializing PitchStore...')
            await pitchStore.initializePitches()
            console.log('PitchStore initialized successfully.')
          }
        } catch (error) {
          console.error('PitchStore initialization failed:', error)
          errorStore.setError(
            ErrorType.STORE_ERROR,
            'PitchStore failed to initialize',
          )
          throw error
        }
      })(),
    ])

    console.log('All stores initialized successfully.')

    // Dynamically set the main content style based on sidebar and header sizes
    mainContentStyle.value = `top: ${displayStore.headerVh}px; left: ${displayStore.sidebarLeftVw}px;`

    // Simulate a delay for loader visibility
    setTimeout(() => {
      isReady.value = true
      isFirstLoad.value = false
      emit('pageReady', true)

      // Mark displayStore as loaded
      displayStore.isInitialized = true
    }, 1000)

    // Add viewport resize event listener
    window.addEventListener('resize', displayStore.updateViewport)
  } catch (error) {
    console.error('Overall initialization failed:', error)
    errorStore.setError(
      ErrorType.UNKNOWN_ERROR,
      `Initialization failed: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', displayStore.updateViewport)
})
</script>
