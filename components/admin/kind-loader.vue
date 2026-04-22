<!-- /components/content/story/kind-loader.vue -->
<template>
  <div v-if="showSequence" class="loader-root">
    <butterfly-layer
      :begin-exit="beginButterflyExit"
      :overlay-visible="showOverlay"
    />

    <loading-messages
      v-if="showOverlay"
      :stores-ready="storesReady"
      @hidden="handleOverlayHidden"
    />
  </div>
</template>

<script setup lang="ts">
// /components/content/story/kind-loader.vue
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useErrorStore, ErrorType } from '../../stores/errorStore'
import { useUserStore } from '../../stores/userStore'
import { useArtStore } from '../../stores/artStore'
import { useRandomStore } from '../../stores/randomStore'
import { useCharacterStore } from '../../stores/characterStore'
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
import { useSmartbarStore } from '../../stores/smartbarStore'
import { useComponentStore } from '../../stores/componentStore'
import { usePageStore } from '../../stores/pageStore'
import { useNavStore } from '../../stores/navStore'

const errorStore = useErrorStore()
const displayStore = useDisplayStore()
const pageStore = usePageStore()
const userStore = useUserStore()
const artStore = useArtStore()
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
const smartbarStore = useSmartbarStore()
const componentStore = useComponentStore()
const randomStore = useRandomStore()
const navStore = useNavStore()

const emit = defineEmits<{
  pageReady: [boolean]
}>()

const showSequence = ref(true)
const showOverlay = ref(true)
const beginButterflyExit = ref(false)
const storesReady = ref(false)
const pageReadyEmitted = ref(false)

function emitReadyOnce() {
  if (pageReadyEmitted.value) return
  pageReadyEmitted.value = true
  emit('pageReady', true)
}

function handleOverlayHidden() {
  if (!showOverlay.value) return
  showOverlay.value = false
  beginButterflyExit.value = true
  emitReadyOnce()
}

async function initializeStores() {
  try {
    if (!displayStore.isInitialized) {
      await errorStore.handleError(
        async () => displayStore.initialize(),
        ErrorType.STORE_ERROR,
        'Error initializing display store',
      )
    }

    await Promise.all([
      userStore.initialize?.(),
      pageStore.initialize?.(),
      navStore.initialize?.(),
      smartbarStore.initialize?.(),
      consoleStore.initialize?.(),
      milestoneStore.initialize?.(),
    ])

    await Promise.all([
      artStore.initialize?.(),
      botStore.initialize?.(),
      galleryStore.initialize?.(),
      chatStore.initialize?.(),
    ])

    await Promise.all([
      characterStore.initialize?.(),
      pitchStore.initialize?.(),
      promptStore.initialize?.(),
      reactionStore.initialize?.(),
      rewardStore.initialize?.(),
      scenarioStore.initialize?.(),
      weirdStore.initialize?.(),
      choiceStore.initialize?.(),
      componentStore.initialize?.(),
      randomStore.initialize?.(),
    ])
  } catch (error) {
    errorStore.setError(
      ErrorType.UNKNOWN_ERROR,
      `Initialization failed: ${error instanceof Error ? error.message : String(error)}`,
    )
  } finally {
    storesReady.value = true
  }
}

onMounted(async () => {
  await initializeStores()
})

onBeforeUnmount(() => {
  displayStore.removeViewportWatcher()
})
</script>

<style scoped>
.loader-root {
  position: fixed;
  inset: 0;
  z-index: 80;
  pointer-events: none;
}
</style>
