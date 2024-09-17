<!-- components/KindLoader.vue -->
<template>
  <div
    v-if="!isReady"
    class="fixed inset-0 flex items-center justify-center bg-opacity-70"
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

    // Simulate a delay to hide the loader
    setTimeout(() => {
      isReady.value = true
      emit('pageReady', true) // Emit the pageReady state to parent
    }, 1500)

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
