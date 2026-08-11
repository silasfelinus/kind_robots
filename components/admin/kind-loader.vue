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
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useErrorStore, ErrorType } from '@/stores/errorStore'
import { useViewportStore } from '@/stores/viewportStore'
import { useButterflyStore } from '@/stores/butterflyStore'
import { useStartupAnimationStore } from '@/stores/startupAnimationStore'
import {
  consumeForcedFullStartup,
  isBrowserReload,
  markAppReady,
} from '@/utils/startupLaunch'

const errorStore = useErrorStore()
const viewportStore = useViewportStore()
const butterflyStore = useButterflyStore()
const startupStore = useStartupAnimationStore()
const route = useRoute()

const emit = defineEmits<{
  covered: []
  pageReady: [boolean]
}>()

type StartupMode = 'full' | 'none'

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
 * Global boot is deliberately conservative. Feature stores initialize from
 * their own surfaces instead of making every visitor download/fetch the whole
 * application. ConsoleStore is intentionally global: its browser-console
 * journey is a product feature for attentive developers, not debug debris.
 */
async function initializeStores() {
  try {
    if (!viewportStore.isInitialized) {
      await errorStore.handleError(
        async () => viewportStore.initialize(),
        ErrorType.STORE_ERROR,
        'Error initializing viewport store',
      )
    }

    const [
      { useUserStore },
      { usePageStore },
      { useNavStore },
      { useConsoleStore },
      { useAchievementStore },
      { useThemeStore },
    ] = await Promise.all([
      import('@/stores/userStore'),
      import('@/stores/pageStore'),
      import('@/stores/navStore'),
      import('@/stores/consoleStore'),
      import('@/stores/achievementStore'),
      import('@/stores/themeStore'),
    ])

    const userStore = useUserStore()
    const achievementStore = useAchievementStore()

    await errorStore.handleError(
      async () => userStore.initialize?.(),
      ErrorType.STORE_ERROR,
      'Error initializing user store',
    )

    await runWave('identity + chrome', [
      usePageStore().initialize?.(),
      useNavStore().initialize?.(),
      useConsoleStore().initialize?.(),
      achievementStore.initialize?.(),
      // Apply the current/local theme at boot. The shared theme catalog belongs
      // to the Themes surface and should not be fetched for every page visit.
      useThemeStore().initialize({ fetchShared: false }),
    ])

    await runWave('achievement sync', [
      achievementStore.fetchAchievements(true),
      userStore.isLoggedIn
        ? achievementStore.fetchAchievementRecords(true)
        : undefined,
    ])

    await runWave('achievement migration', [
      userStore.isLoggedIn
        ? achievementStore.migratePendingGuestAchievements()
        : undefined,
    ])

    await achievementStore.rewardAchievementForPath(route.path)

    /*
     * Servers, checkpoints, art, chat, builders, facets/randomizer, prompts,
     * rewards, scenarios, characters and the remaining feature stores all
     * initialize from the surfaces that consume them. Historically boot woke
     * these systems speculatively, including a 1,000-facet randomizer catalog,
     * even when the visitor never opened those features.
     */
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

onMounted(() => {
  void ensureStoresInitialized()

  if (startupMode.value !== 'none') return

  handleOverlayCovered()
  emitReadyOnce()
})

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
