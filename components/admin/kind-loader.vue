<template>
  <div v-if="showOverlay || !pageReadyEmitted" class="loader-root">
    <loading-messages
      v-if="showOverlay"
      :stores-ready="storesReady"
      @covered="handleOverlayCovered"
      @hiding="handleOverlayHiding"
      @hidden="handleOverlayHidden"
    />
  </div>
</template>

<script setup lang="ts">
// /components/content/story/kind-loader.vue
import { onBeforeMount, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useErrorStore, ErrorType } from '@/stores/errorStore'
import { useUserStore } from '@/stores/userStore'
import { useArtStore } from '@/stores/artStore'
import { useRandomStore } from '@/stores/randomStore'
import { useCharacterStore } from '@/stores/characterStore'
import { useBotStore } from '@/stores/botStore'
import { useChatStore } from '@/stores/chatStore'
import { useAchievementStore } from '@/stores/achievementStore'
import { useDisplayStore } from '@/stores/displayStore'
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
import { useThemeStore } from '@/stores/themeStore'
import { useButterflyStore } from '@/stores/butterflyStore'
import { useStartupAnimationStore } from '@/stores/startupAnimationStore'
import { ensureBuildersRegistered } from '@/stores/registerBuilderStore'
import {
  clearStartupCover,
  consumeForcedFullStartup,
  isBrowserReload,
  startupWasAbandoned,
} from '@/utils/startupLaunch'

const errorStore = useErrorStore()
const displayStore = useDisplayStore()
const pageStore = usePageStore()
const userStore = useUserStore()
const serverStore = useServerStore()
const checkpointStore = useCheckpointStore()
const artStore = useArtStore()
const botStore = useBotStore()
const achievementStore = useAchievementStore()
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
const themeStore = useThemeStore()
const butterflyStore = useButterflyStore()
const startupStore = useStartupAnimationStore()
const runtimeConfig = useRuntimeConfig()

const emit = defineEmits<{
  covered: []
  pageReady: [boolean]
}>()

type StartupMode = 'full' | 'none'

const STARTUP_STORAGE_KEY = 'kind-robots-startup-build-v1'
const buildId = String(runtimeConfig.public.buildId || 'development')

function shouldShowFullStartupSequence(): boolean {
  if (!import.meta.client) return true

  /*
   * Checked before anything else, including the forced-reload flag: if the
   * shell already tore the launch screen down we must not raise a second one,
   * no matter how we got here. Reveal the site instead.
   */
  if (startupWasAbandoned()) {
    consumeForcedFullStartup()
    return false
  }

  if (consumeForcedFullStartup()) return true
  if (isBrowserReload()) return false

  try {
    return localStorage.getItem(STARTUP_STORAGE_KEY) !== buildId
  } catch {
    return true
  }
}

function markStartupSequenceSeen(): void {
  if (!import.meta.client) return

  try {
    localStorage.setItem(STARTUP_STORAGE_KEY, buildId)
  } catch {
    return
  }
}

const startupMode = ref<StartupMode>(
  shouldShowFullStartupSequence() ? 'full' : 'none',
)
const showOverlay = ref(startupMode.value === 'full')
const storesReady = ref(false)
const pageReadyEmitted = ref(false)
const coveredEmitted = ref(false)

let initializationPromise: Promise<void> | null = null

startupStore.reset()
butterflyStore.setShowSwarm(startupMode.value === 'full')

if (startupMode.value === 'full') {
  markStartupSequenceSeen()
}

function releasePrehydrateCover(): void {
  if (!import.meta.client) return

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      clearStartupCover()
    })
  })
}

function handleOverlayCovered() {
  if (coveredEmitted.value) return
  coveredEmitted.value = true
  emit('covered')
  releasePrehydrateCover()
}

function handleOverlayHiding() {
  clearStartupCover()
  butterflyStore.setShowSwarm(false)
}

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

async function runWave(
  label: string,
  tasks: Array<Promise<unknown> | void | undefined>,
): Promise<void> {
  const promises = tasks.filter(
    (task): task is Promise<unknown> =>
      task != null && typeof (task as Promise<unknown>).then === 'function',
  )

  const results = await Promise.allSettled(promises)

  for (const result of results) {
    if (result.status === 'rejected') {
      errorStore.setError(
        ErrorType.STORE_ERROR,
        `Store init failed during ${label}: ${
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason)
        }`,
      )
    }
  }
}

async function initializeServerAndCheckpoints() {
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
    ensureBuildersRegistered()

    if (!displayStore.isInitialized) {
      await errorStore.handleError(
        async () => displayStore.initialize(),
        ErrorType.STORE_ERROR,
        'Error initializing display store',
      )
    }

    await runWave('identity + chrome', [
      userStore.initialize?.(),
      pageStore.initialize?.(),
      navStore.initialize?.(),
      smartbarStore.initialize?.(),
      consoleStore.initialize?.(),
      achievementStore.initialize?.({
        fetchRemote: true,
        migratePendingGuestAchievements: true,
      }),
      themeStore.initialize({ fetchShared: true }),
    ])

    await initializeServerAndCheckpoints()

    await runWave('content stores', [
      artStore.initialize?.(),
      botStore.initialize?.(),
      chatStore.initialize?.(),
    ])

    await runWave('remaining stores', [
      characterStore.initialize?.(),
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

function ensureStoresInitialized(): Promise<void> {
  if (!initializationPromise) {
    initializationPromise = initializeStores()
  }

  return initializationPromise
}

watch(
  () => startupStore.exitRequest,
  (request, previousRequest) => {
    if (request === previousRequest || startupMode.value !== 'full') return

    handleOverlayHiding()
    showOverlay.value = false
    emitReadyOnce()
  },
)

onBeforeMount(() => {
  if (startupMode.value !== 'none') return

  void ensureStoresInitialized()
  handleOverlayCovered()
  emitReadyOnce()
})

onMounted(() => {
  if (startupMode.value !== 'full') return
  void ensureStoresInitialized()
})

/*
 * If anything unmounts the loader before it finished fading (an app-level
 * failsafe, a route teardown), the swarm flag would otherwise stay true and
 * leave the startup effect stage and control tray stranded on top of the site
 * with nothing left alive to remove them.
 */
onBeforeUnmount(() => {
  handleOverlayHiding()
})
</script>

<style scoped>
.loader-root {
  position: fixed;
  inset: 0;
  z-index: 40;
  pointer-events: none;
}

:global(.kr-shell.bg-black) {
  background-color: transparent !important;
}

:global(.loading-overlay),
:global(.loading-content) {
  pointer-events: none !important;
}
</style>
