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
import { useRoute } from 'vue-router'
import { useErrorStore, ErrorType } from '@/stores/errorStore'
import { useDisplayStore } from '@/stores/displayStore'
import { useButterflyStore } from '@/stores/butterflyStore'
import { useStartupAnimationStore } from '@/stores/startupAnimationStore'
import {
  consumeForcedFullStartup,
  isBrowserReload,
  markAppReady,
} from '@/utils/startupLaunch'

const errorStore = useErrorStore()
const displayStore = useDisplayStore()
const butterflyStore = useButterflyStore()
const startupStore = useStartupAnimationStore()
const route = useRoute()

const emit = defineEmits<{
  covered: []
  pageReady: [boolean]
}>()

type StartupMode = 'full' | 'none'

/*
 * A browser refresh skips the intro and goes straight to the site; a fresh
 * navigation plays it; the dashboard refresh button forces it.
 *
 * There used to be an additional localStorage build-id check here, but the
 * pre-hydration head script cleared that key on every non-reload navigation,
 * so it always evaluated true and never actually gated anything. Both halves
 * are gone rather than left as decoration.
 */
function shouldShowFullStartupSequence(): boolean {
  if (!import.meta.client) return true

  if (consumeForcedFullStartup()) return true

  return !isBrowserReload()
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

/*
 * Retires the server-rendered boot cover now that the app is rendering its own
 * intro. The cover also releases itself through CSS, so this only makes the
 * handoff prompt — it is never what guarantees the site becomes visible.
 */
function releaseBootCover(): void {
  if (!import.meta.client) return

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      markAppReady()
    })
  })
}

function handleOverlayCovered() {
  if (coveredEmitted.value) return
  coveredEmitted.value = true
  emit('covered')
  releaseBootCover()
}

function handleOverlayHiding() {
  markAppReady()
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

/*
 * Every store below is imported on demand rather than at module scope.
 *
 * kind-loader is rendered by app.vue, so a static import here puts the store —
 * and everything it pulls in — into the eager entry chunk that must download,
 * parse and execute before the app can mount. That chain was dragging ~25
 * stores plus the builder card decks and seed tables into the critical path
 * for every visitor on every page, purely so this function could call
 * initialize() on them. Loading them here instead moves that work off first
 * paint without changing what runs or in what order.
 */
async function initializeStores() {
  try {
    if (!displayStore.isInitialized) {
      await errorStore.handleError(
        async () => displayStore.initialize(),
        ErrorType.STORE_ERROR,
        'Error initializing display store',
      )
    }

    const [
      { useUserStore },
      { usePageStore },
      { useNavStore },
      { useSmartbarStore },
      { useConsoleStore },
      { useAchievementStore },
      { useThemeStore },
    ] = await Promise.all([
      import('@/stores/userStore'),
      import('@/stores/pageStore'),
      import('@/stores/navStore'),
      import('@/stores/smartbarStore'),
      import('@/stores/consoleStore'),
      import('@/stores/achievementStore'),
      import('@/stores/themeStore'),
    ])

    await runWave('identity + chrome', [
      useUserStore().initialize?.(),
      usePageStore().initialize?.(),
      useNavStore().initialize?.(),
      useSmartbarStore().initialize?.(),
      useConsoleStore().initialize?.(),
      useAchievementStore().initialize?.({
        fetchRemote: true,
        migratePendingGuestAchievements: true,
      }),
      useThemeStore().initialize({ fetchShared: true }),
    ])

    await useAchievementStore().rewardAchievementForPath(route.path)

    const [{ useServerStore }, { useCheckpointStore }] = await Promise.all([
      import('@/stores/serverStore'),
      import('@/stores/checkpointStore'),
    ])
    const serverStore = useServerStore()

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
        useCheckpointStore().initialize()
      },
      ErrorType.STORE_ERROR,
      'Error initializing checkpoint store',
    )

    const [{ useArtStore }, { useBotStore }, { useChatStore }] =
      await Promise.all([
        import('@/stores/artStore'),
        import('@/stores/botStore'),
        import('@/stores/chatStore'),
      ])

    await runWave('content stores', [
      useArtStore().initialize?.(),
      useBotStore().initialize?.(),
      useChatStore().initialize?.(),
    ])

    const [
      { useCharacterStore },
      { usePromptStore },
      { useReactionStore },
      { useRewardStore },
      { useScenarioStore },
      { useWeirdStore },
      { useChoiceStore },
      { useComponentStore },
      { useRandomStore },
      { ensureBuildersRegistered },
    ] = await Promise.all([
      import('@/stores/characterStore'),
      import('@/stores/promptStore'),
      import('@/stores/reactionStore'),
      import('@/stores/rewardStore'),
      import('@/stores/scenarioStore'),
      import('@/stores/weirdStore'),
      import('@/stores/choiceStore'),
      import('@/stores/componentStore'),
      import('@/stores/randomStore'),
      import('@/stores/registerBuilderStore'),
    ])

    ensureBuildersRegistered()

    await runWave('remaining stores', [
      useCharacterStore().initialize?.(),
      usePromptStore().initialize?.(),
      useReactionStore().initialize?.(),
      useRewardStore().initialize?.(),
      useScenarioStore().initialize?.(),
      useWeirdStore().initialize?.(),
      useChoiceStore().initialize?.(),
      useComponentStore().initialize?.(),
      useRandomStore().initialize?.(),
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
