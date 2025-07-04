<!-- /components/content/story/kind-loader.vue -->
<template>
  <ami-loader />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useErrorStore, ErrorType } from '../../stores/errorStore'
import { useUserStore } from '../../stores/userStore'
import { useArtStore } from '../../stores/artStore'
import { useRandomStore } from '../../stores/randomStore'
import { useCharacterStore } from '../../stores/characterStore'
import { useThemeStore } from '../../stores/themeStore'
import { useBotStore } from '../../stores/botStore'
import { useChatStore } from '../../stores/chatStore'
import { useMilestoneStore } from '../../stores/milestoneStore'
import { useDisplayStore } from '../../stores/displayStore'
import { usePitchStore } from '../../stores/pitchStore'
import { usePromptStore } from '../../stores/promptStore'
import { useReactionStore } from '../../stores/reactionStore'
import { useRewardStore } from '../../stores/rewardStore'
import { useGalleryStore } from '../../stores/galleryStore'
import { useScenarioStore } from '../../stores/scenarioStore'
import { useWeirdStore } from '../../stores/weirdStore'
import { useConsoleStore } from '../../stores/consoleStore'
import { useChoiceStore } from '../../stores/choiceStore'
import { useResonanceStore } from '../../stores/resonanceStore'
import { useSmartbarStore } from '../../stores/smartbarStore'
import { useComponentStore } from '../../stores/componentStore'
import { usePageStore } from '../../stores/pageStore'

// Stores
const errorStore = useErrorStore()
const displayStore = useDisplayStore()
const pageStore = usePageStore()
const userStore = useUserStore()
const artStore = useArtStore()
const themeStore = useThemeStore()
const botStore = useBotStore()
const milestoneStore = useMilestoneStore()
const pitchStore = usePitchStore()
const promptStore = usePromptStore()
const reactionStore = useReactionStore()
const rewardStore = useRewardStore()
const chatStore = useChatStore()
const characterStore = useCharacterStore()
const galleryStore = useGalleryStore()
const scenarioStore = useScenarioStore()
const weirdStore = useWeirdStore()
const consoleStore = useConsoleStore()
const choiceStore = useChoiceStore()
const resonanceStore = useResonanceStore()
const smartbarStore = useSmartbarStore()
const componentStore = useComponentStore()
const randomStore = useRandomStore()

// State management
const isReady = ref(false)
const emit = defineEmits(['pageReady'])

onMounted(async () => {
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
      consoleStore.initialize?.(),
      pageStore.initialize?.(),
      userStore.initialize?.(),
      milestoneStore.initialize?.(),
      pitchStore.initialize?.(),
      randomStore.initialize?.(),
      promptStore.initialize?.(),
      artStore.initialize?.(),
      botStore.initialize?.(),
      chatStore.initialize?.(),
      themeStore.initialize?.(),
      reactionStore.initialize?.(),
      rewardStore.initialize?.(),
      characterStore.initialize?.(),
      galleryStore.initialize?.(),
      weirdStore.initialize?.(),
      scenarioStore.initialize?.(),
      choiceStore.initialize?.(),
      resonanceStore.initialize?.(),
      smartbarStore.initialize?.(),
      componentStore.initialize?.(),
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
