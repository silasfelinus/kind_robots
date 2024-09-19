<!-- components/KindLoader.vue -->
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

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useErrorStore, ErrorType } from '@/stores/errorStore'
import { useUserStore } from '@/stores/userStore'
import { useArtStore } from '@/stores/artStore'
import { useThemeStore } from '@/stores/themeStore'
import { useBotStore } from '@/stores/botStore'
import { useMilestoneStore } from '@/stores/milestoneStore'
import { useDisplayStore } from '@/stores/displayStore'

const errorStore = useErrorStore()
const userStore = useUserStore()
const artStore = useArtStore()
const themeStore = useThemeStore()
const botStore = useBotStore()
const milestoneStore = useMilestoneStore()
const displayStore = useDisplayStore()

const isReady = ref(false)
const isFirstLoad = ref(true) // Track if this is the first load
const mainContentStyle = ref('') // Style for main content view after first load

// Emit the state to parent component
const emit = defineEmits(['pageReady'])

onMounted(async () => {
  try {
    // Handle all store initializations here
    await Promise.all([
      botStore.loadStore(),
      userStore.initializeUser(),
      artStore.init(),
      themeStore.initTheme(),
      milestoneStore.initializeMilestones(),
    ])

    displayStore.loadState()
    displayStore.updateViewport()

    // Set the main content style based on sidebarVw and headerVh after the first load
    mainContentStyle.value = `top: ${displayStore.headerVh}px; left: ${displayStore.sidebarVw}px;`

    // Simulate a delay to hide the loader
    setTimeout(() => {
      isReady.value = true
      isFirstLoad.value = false // After first load, we switch to main screen view
      emit('pageReady', true) // Emit the pageReady state to parent
    }, 1000)

    window.addEventListener('resize', displayStore.updateViewport)
    console.log('Initialization complete.')
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
