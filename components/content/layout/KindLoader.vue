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
const userStore = useUserStore()
const artStore = useArtStore()
const themeStore = useThemeStore()
const botStore = useBotStore()
const milestoneStore = useMilestoneStore()
const displayStore = useDisplayStore()
const pitchStore = usePitchStore()

// State management
const isReady = ref(false)
const isFirstLoad = ref(true) // This tracks if it’s the first load
const mainContentStyle = ref('') // Style for main content view after the first load
const emit = defineEmits(['pageReady'])

onMounted(async () => {
  if (displayStore.isLoaded) {
    // If already initialized, skip the loader
    isReady.value = true
    emit('pageReady', true)
    isFirstLoad.value = false
    return
  }

  try {
    // Initialize the stores
    await Promise.all([
      botStore.loadStore(),
      userStore.initializeUser(),
      artStore.init(),
      themeStore.initTheme(),
      milestoneStore.initializeMilestones(),
      pitchStore.initializePitches(),
    ])

    displayStore.loadState()
    displayStore.updateViewport()

    // Set the main content style based on sidebarVw and headerVh after the first load
    mainContentStyle.value = `top: ${displayStore.headerVh}px; left: ${displayStore.sidebarVw}px;`

    // Simulate a delay to hide the loader
    setTimeout(() => {
      isReady.value = true
      isFirstLoad.value = false
      emit('pageReady', true)

      // Mark the loader as initialized
      displayStore.isLoaded = true
    }, 1000)

    window.addEventListener('resize', displayStore.updateViewport)
  } catch (error) {
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
