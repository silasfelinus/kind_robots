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
const isFirstLoad = ref(true)
const mainContentStyle = ref('')
const emit = defineEmits(['pageReady'])

onMounted(async () => {
  try {
    if (displayStore.isLoaded) {
      // If already initialized, skip the loader
      isReady.value = true
      isFirstLoad.value = false
      emit('pageReady', true)
      return
    }

    // Initialize the stores in parallel
    await Promise.all([
      botStore.loadStore(),
      userStore.initializeUser(),
      artStore.init(),
      themeStore.initTheme(),
      milestoneStore.initializeMilestones(),
      pitchStore.initializePitches(),
    ])

    displayStore.updateViewport()

    // Dynamically set the main content style based on sidebar and header sizes
    mainContentStyle.value = `top: ${displayStore.headerVh}px; left: ${displayStore.sidebarVw}px;`

    // Simulate a delay for loader visibility
    setTimeout(() => {
      isReady.value = true
      isFirstLoad.value = false
      emit('pageReady', true)

      displayStore.isLoaded = true
    }, 1000)

    // Add viewport resize event listener
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
