<template>
  <div v-if="showOverlay || !pageReadyEmitted" class="loader-root">
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
import { useErrorStore, ErrorType } from '@/stores/errorStore'
import { useUserStore } from '@/stores/userStore'
import { useArtStore } from '@/stores/artStore'
import { useRandomStore } from '@/stores/randomStore'
import { useCharacterStore } from '@/stores/characterStore'
import { useBotStore } from '@/stores/botStore'
import { useChatStore } from '@/stores/chatStore'
import { useMilestoneStore } from '@/stores/milestoneStore'
import { useDisplayStore } from '@/stores/displayStore'
import { usePitchStore } from '@/stores/pitchStore'
import { usePromptStore } from '@/stores/promptStore'
import { useReactionStore } from '@/stores/reactionStore'
import { useRewardStore } from '@/stores/rewardStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useWeirdStore } from '@/stores/weirdStore'
import { useConsoleStore } from '@/stores/consoleStore'
import { useChoiceStore } from '@/stores/choiceStore'
import { useSmartbarStore } from '@/stores/smartbarStore'
import { useComponentStore } from '@/stores/componentStore'
import { usePageStore } from '@/stores/pageStore'
import { useNavStore } from '@/stores/navStore'
import { useServerStore } from '@/stores/serverStore'
import { useCheckpointStore } from '@/stores/checkpointStore'

const errorStore = useErrorStore()
const displayStore = useDisplayStore()
const pageStore = usePageStore()
const userStore = useUserStore()
const serverStore = useServerStore()
const checkpointStore = useCheckpointStore()
const artStore = useArtStore()
const botStore = useBotStore()
const milestoneStore = useMilestoneStore()
const pitchStore = usePitchStore()
const promptStore = usePromptStore()
const reactionStore = useReactionStore()
const rewardStore = useRewardStore()
const chatStore = useChatStore()
const characterStore = useCharacterStore()
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

const showOverlay = ref(true)
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
  emitReadyOnce()
}

async function initializeServerAndCheckpoints() {
  // Servers must fully load before checkpoints can resolve their active server.
  // This is the single place both are initialized — galleries must not re-fetch.
  await errorStore.handleError(
    async () => {
      if (
        !serverStore.isInitialized ||
        !serverStore.hasLoaded ||
        serverStore.servers.length === 0
      ) {
        await serverStore.initialize({ fetchRemote: true })
      }
    },
    ErrorType.STORE_ERROR,
    'Error initializing server store',
  )

  // Checkpoints depend on servers being present so they can resolve activeArtServer.
  await errorStore.handleError(
    async () => {
      checkpointStore.initialize()
    },
    ErrorType.STORE_ERROR,
    'Error initializing checkpoint store',
  )
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

    // First wave: user identity and UI chrome — everything else depends on these
    await Promise.all([
      userStore.initialize?.(),
      pageStore.initialize?.(),
      navStore.initialize?.(),
      smartbarStore.initialize?.(),
      consoleStore.initialize?.(),
      milestoneStore.initialize?.(),
    ])

    // Servers + checkpoints are sequential: checkpoints need a loaded server array
    await initializeServerAndCheckpoints()

    // Second wave: content stores that may reference servers but don't block server init
    await Promise.all([
      artStore.initialize?.(),
      botStore.initialize?.(),
      chatStore.initialize?.(),
    ])

    // Third wave: everything else
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
      `Initialization failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
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
  z-index: 40;
  pointer-events: none;
}
</style>
